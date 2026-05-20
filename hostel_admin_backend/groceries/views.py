from datetime import date
from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from core.models import Branch
from .inventory_service import record_inventory_transaction, record_purchase_with_items
from .models import (
    GroceryCategory, GroceryItem, Vendor, GroceryStock,
    GroceryPurchase, GroceryPurchaseItem, GroceryConsumption,
    InventoryTransaction,
)
from .serializers import (
    GroceryCategorySerializer, GroceryItemSerializer, VendorSerializer,
    GroceryStockSerializer, GroceryPurchaseSerializer, GroceryPurchaseItemSerializer,
    GroceryConsumptionSerializer, InventoryTransactionSerializer,
    RecordTransactionSerializer, RecordPurchaseSerializer,
)
class GroceryCategoryViewSet(viewsets.ModelViewSet):
    queryset = GroceryCategory.objects.all()
    serializer_class = GroceryCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['name']


class GroceryItemViewSet(viewsets.ModelViewSet):
    queryset = GroceryItem.objects.select_related('category')
    serializer_class = GroceryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'unit', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['name']

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """Unified transaction timeline for a product."""
        item = self.get_object()
        branch_id = request.query_params.get('branch')
        qs = InventoryTransaction.objects.filter(grocery_item=item).select_related(
            'branch', 'created_by',
        ).order_by('-created_at')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        serializer = InventoryTransactionSerializer(qs[:200], many=True)
        return Response(serializer.data)


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_person', 'phone_number', 'email']
    ordering = ['name']


class GroceryStockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only inventory snapshot. Stock changes only via transactions.
    """
    serializer_class = GroceryStockSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['branch', 'item']
    search_fields = ['item__name']
    ordering_fields = ['quantity', 'last_restocked']
    ordering = ['item__name']

    def get_queryset(self):
        return GroceryStock.objects.select_related('branch', 'item', 'item__category')

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        """Summary cards for inventory overview."""
        today = date.today()
        branch_id = request.query_params.get('branch')

        stocks = self.get_queryset()
        if branch_id:
            stocks = stocks.filter(branch_id=branch_id)

        low_count = sum(1 for s in stocks if s.quantity > 0 and s.is_low_stock)
        out_count = sum(1 for s in stocks if s.quantity <= 0)

        txn_qs = InventoryTransaction.objects.filter(created_at__date=today)
        if branch_id:
            txn_qs = txn_qs.filter(branch_id=branch_id)

        today_purchases = txn_qs.filter(transaction_type='purchase').aggregate(
            total=Sum('quantity'),
        )['total'] or 0
        today_consumption = txn_qs.filter(
            transaction_type__in=['consumption', 'wastage'],
        ).aggregate(total=Sum('quantity'))['total'] or 0

        return Response({
            'total_items': GroceryItem.objects.filter(is_active=True).count(),
            'tracked_stock_rows': stocks.count(),
            'low_stock_count': low_count,
            'out_of_stock_count': out_count,
            'today_purchases_qty': today_purchases,
            'today_consumption_qty': today_consumption,
        })

    @action(detail=True, methods=['get'], url_path='history')
    def stock_history(self, request, pk=None):
        stock = self.get_object()
        txns = InventoryTransaction.objects.filter(
            branch=stock.branch, grocery_item=stock.item,
        ).select_related('created_by').order_by('-created_at')[:200]
        return Response(InventoryTransactionSerializer(txns, many=True).data)


class GroceryPurchaseViewSet(viewsets.ModelViewSet):
    queryset = GroceryPurchase.objects.select_related('branch', 'vendor').prefetch_related('items')
    serializer_class = GroceryPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'vendor', 'payment_status', 'purchase_date']
    ordering = ['-purchase_date']

    @action(detail=False, methods=['post'], url_path='record')
    def record_purchase(self, request):
        """Create purchase + line items + inventory transactions atomically."""
        ser = RecordPurchaseSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        branch = Branch.objects.get(pk=data['branch'])
        vendor = Vendor.objects.get(pk=data['vendor']) if data.get('vendor') else None

        purchase, txns = record_purchase_with_items(
            branch=branch,
            vendor=vendor,
            purchase_date=data['purchase_date'],
            items=data['items'],
            user=request.user,
            invoice_number=data.get('invoice_number', ''),
            payment_status=data.get('payment_status', 'pending'),
            payment_method=data.get('payment_method', ''),
            notes=data.get('notes', ''),
        )
        return Response({
            'purchase': GroceryPurchaseSerializer(purchase).data,
            'transactions_created': len(txns),
        }, status=status.HTTP_201_CREATED)


class GroceryPurchaseItemViewSet(viewsets.ModelViewSet):
    queryset = GroceryPurchaseItem.objects.all()
    serializer_class = GroceryPurchaseItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['purchase', 'item']


class GroceryConsumptionViewSet(viewsets.ReadOnlyModelViewSet):
    """Legacy consumption records — read-only; new entries go through transactions."""
    queryset = GroceryConsumption.objects.select_related('branch', 'item')
    serializer_class = GroceryConsumptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'item', 'consumption_date']
    ordering = ['-consumption_date']


class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'grocery_item', 'transaction_type', 'reference_type']
    ordering = ['-created_at']

    def get_queryset(self):
        return InventoryTransaction.objects.select_related(
            'branch', 'grocery_item', 'created_by',
        )

    @action(detail=False, methods=['post'], url_path='record')
    def record(self, request):
        """
        Record opening stock, adjustment, consumption, or wastage.
        All inventory changes must go through this endpoint.
        """
        ser = RecordTransactionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        branch = Branch.objects.get(pk=data['branch'])
        grocery_item = GroceryItem.objects.get(pk=data['grocery_item'])

        ref_type = 'manual'
        if data['transaction_type'] == 'adjustment' and 'opening' in (data.get('notes') or '').lower():
            ref_type = 'manual'

        txn = record_inventory_transaction(
            branch=branch,
            grocery_item=grocery_item,
            transaction_type=data['transaction_type'],
            quantity=data['quantity'],
            unit=data.get('unit') or grocery_item.unit,
            reference_type=ref_type,
            notes=data.get('notes', ''),
            created_by=request.user,
        )
        return Response(
            InventoryTransactionSerializer(txn).data,
            status=status.HTTP_201_CREATED,
        )
