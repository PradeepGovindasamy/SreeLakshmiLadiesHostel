from django.contrib import admin
from .models import (
    GroceryCategory, GroceryItem, Vendor, GroceryStock,
    GroceryPurchase, GroceryPurchaseItem, GroceryConsumption
)


@admin.register(GroceryCategory)
class GroceryCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(GroceryItem)
class GroceryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit', 'min_stock_level', 'avg_price_per_unit', 'is_active']
    list_filter = ['category', 'unit', 'is_active']
    search_fields = ['name', 'description']


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone_number', 'email', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'contact_person', 'phone_number', 'email']


@admin.register(GroceryStock)
class GroceryStockAdmin(admin.ModelAdmin):
    list_display = ['item', 'branch', 'quantity', 'stock_status', 'last_restocked']
    list_filter = ['branch', 'item__category']
    search_fields = ['item__name', 'branch__name']


class GroceryPurchaseItemInline(admin.TabularInline):
    model = GroceryPurchaseItem
    extra = 1


@admin.register(GroceryPurchase)
class GroceryPurchaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'branch', 'vendor', 'purchase_date', 'total_amount', 'payment_status', 'balance_amount']
    list_filter = ['payment_status', 'purchase_date', 'branch']
    search_fields = ['invoice_number', 'vendor__name']
    date_hierarchy = 'purchase_date'
    inlines = [GroceryPurchaseItemInline]


@admin.register(GroceryConsumption)
class GroceryConsumptionAdmin(admin.ModelAdmin):
    list_display = ['item', 'branch', 'quantity', 'consumption_date', 'purpose']
    list_filter = ['branch', 'consumption_date', 'item__category']
    search_fields = ['item__name', 'purpose']
    date_hierarchy = 'consumption_date'
