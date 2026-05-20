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
    is_low_stock = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()
    
    class Meta:
        model = GroceryStock
        fields = '__all__'


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
