"""
Central inventory service — all stock changes go through here.

InventoryTransaction is the source of truth.
GroceryStock is updated as a fast snapshot after each transaction.
"""

from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import GroceryStock, InventoryTransaction


OUTGOING_TYPES = {'consumption', 'wastage'}


def _apply_stock_delta(stock, transaction_type, quantity):
    """Update GroceryStock snapshot based on transaction type."""
    qty = Decimal(str(abs(quantity)))
    if transaction_type in ('purchase', 'adjustment'):
        stock.quantity = Decimal(str(stock.quantity)) + qty
        stock.last_restocked = timezone.now()
    else:
        stock.quantity = max(Decimal('0'), Decimal(str(stock.quantity)) - qty)
    stock.save(update_fields=['quantity', 'last_restocked'])


@transaction.atomic
def record_inventory_transaction(
    *,
    branch,
    grocery_item,
    transaction_type,
    quantity,
    unit=None,
    reference_type='',
    reference_id=None,
    notes='',
    created_by=None,
):
    """
    Create an InventoryTransaction and update GroceryStock atomically.
    quantity is always positive; direction is determined by transaction_type.
    """
    if quantity is None or Decimal(str(quantity)) <= 0:
        raise ValueError('Quantity must be greater than zero.')

    if transaction_type not in dict(InventoryTransaction.TRANSACTION_TYPE_CHOICES):
        raise ValueError(f'Invalid transaction type: {transaction_type}')

    unit = unit or grocery_item.unit

    stock, _ = GroceryStock.objects.select_for_update().get_or_create(
        branch=branch,
        item=grocery_item,
        defaults={'quantity': 0},
    )

    txn = InventoryTransaction.objects.create(
        branch=branch,
        grocery_item=grocery_item,
        transaction_type=transaction_type,
        quantity=Decimal(str(quantity)),
        unit=unit,
        reference_type=reference_type or '',
        reference_id=reference_id,
        notes=notes or '',
        created_by=created_by,
    )

    _apply_stock_delta(stock, transaction_type, quantity)
    return txn


@transaction.atomic
def record_purchase_with_items(*, branch, vendor, purchase_date, items, user, **purchase_kwargs):
    """
    Create a GroceryPurchase with line items and corresponding purchase transactions.
    items: [{ item_id, quantity, unit_price }, ...]
    """
    from .models import GroceryPurchase, GroceryPurchaseItem, GroceryItem

    total_amount = sum(
        Decimal(str(i['quantity'])) * Decimal(str(i['unit_price']))
        for i in items
    )

    purchase = GroceryPurchase.objects.create(
        branch=branch,
        vendor=vendor,
        purchase_date=purchase_date,
        total_amount=total_amount,
        created_by=user,
        **purchase_kwargs,
    )

    transactions = []
    for line in items:
        grocery_item = GroceryItem.objects.get(pk=line['item_id'])
        GroceryPurchaseItem.objects.create(
            purchase=purchase,
            item=grocery_item,
            quantity=line['quantity'],
            unit_price=line['unit_price'],
            total_price=Decimal(str(line['quantity'])) * Decimal(str(line['unit_price'])),
        )
        txn = record_inventory_transaction(
            branch=branch,
            grocery_item=grocery_item,
            transaction_type='purchase',
            quantity=line['quantity'],
            unit=grocery_item.unit,
            reference_type='purchase',
            reference_id=purchase.id,
            notes=f'Purchase #{purchase.id}',
            created_by=user,
        )
        transactions.append(txn)

    return purchase, transactions
