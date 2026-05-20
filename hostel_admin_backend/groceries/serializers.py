from rest_framework import serializers
from .models import (
    GroceryCategory, GroceryItem, Vendor, GroceryStock,
    GroceryPurchase, GroceryPurchaseItem, GroceryConsumption,
    InventoryTransaction,
)


class GroceryCategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroceryCategory
        fields = '__all__'
    
    def get_items_count(self, obj):
        return obj.items.count()


class GroceryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    
    class Meta:
        model = GroceryItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class GroceryStockSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_unit = serializers.CharField(source='item.unit', read_only=True)
    min_stock_level = serializers.DecimalField(
        source='item.min_stock_level', max_digits=10, decimal_places=2, read_only=True,
    )
    is_low_stock = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()
    status_label = serializers.SerializerMethodField()
    last_transaction_date = serializers.SerializerMethodField()

    class Meta:
        model = GroceryStock
        fields = [
            'id', 'branch', 'branch_name', 'item', 'item_name', 'item_unit',
            'quantity', 'min_stock_level', 'last_restocked',
            'is_low_stock', 'stock_status', 'status_label', 'last_transaction_date',
        ]
        read_only_fields = fields

    def get_status_label(self, obj):
        if obj.quantity <= 0:
            return 'Out of Stock'
        if obj.is_low_stock:
            return 'Low Stock'
        return 'Healthy'

    def get_last_transaction_date(self, obj):
        txn = InventoryTransaction.objects.filter(
            branch=obj.branch, grocery_item=obj.item,
        ).order_by('-created_at').values_list('created_at', flat=True).first()
        return txn


class RecordTransactionSerializer(serializers.Serializer):
    branch = serializers.IntegerField()
    grocery_item = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(
        choices=['purchase', 'consumption', 'wastage', 'adjustment'],
    )
    quantity = serializers.DecimalField(max_digits=10, decimal_places=3, min_value=0.001)
    unit = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class PurchaseLineSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)


class RecordPurchaseSerializer(serializers.Serializer):
    branch = serializers.IntegerField()
    vendor = serializers.IntegerField(required=False, allow_null=True)
    purchase_date = serializers.DateField()
    invoice_number = serializers.CharField(required=False, allow_blank=True, default='')
    payment_status = serializers.CharField(required=False, default='pending')
    payment_method = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    items = PurchaseLineSerializer(many=True)


class GroceryPurchaseItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_unit = serializers.CharField(source='item.unit', read_only=True)
    
    class Meta:
        model = GroceryPurchaseItem
        fields = '__all__'
        read_only_fields = ['total_price']


class GroceryPurchaseSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    items = GroceryPurchaseItemSerializer(many=True, read_only=True)
    balance_amount = serializers.ReadOnlyField()
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = GroceryPurchase
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class GroceryConsumptionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_unit = serializers.CharField(source='item.unit', read_only=True)
    
    class Meta:
        model = GroceryConsumption
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    item_name = serializers.CharField(source='grocery_item.name', read_only=True)
    item_unit = serializers.CharField(source='grocery_item.unit', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'branch', 'branch_name',
            'grocery_item', 'item_name', 'item_unit',
            'transaction_type', 'transaction_type_display',
            'quantity', 'unit',
            'reference_type', 'reference_id',
            'notes', 'created_at', 'created_by', 'created_by_name',
        ]
        read_only_fields = ['created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'System'
