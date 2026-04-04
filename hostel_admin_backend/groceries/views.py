from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    GroceryCategory, GroceryItem, Vendor, GroceryStock,
    GroceryPurchase, GroceryPurchaseItem, GroceryConsumption
)
from .serializers import (
    GroceryCategorySerializer, GroceryItemSerializer, VendorSerializer,
    GroceryStockSerializer, GroceryPurchaseSerializer, GroceryPurchaseItemSerializer,
    GroceryConsumptionSerializer
)


class GroceryCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing grocery categories
    """
    queryset = GroceryCategory.objects.all()
    serializer_class = GroceryCategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['name']


class GroceryItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing grocery items
    """
    queryset = GroceryItem.objects.all()
    serializer_class = GroceryItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'unit', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class VendorViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing vendors
    """
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_person', 'phone_number', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class GroceryStockViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing grocery stock
    """
    queryset = GroceryStock.objects.all()
    serializer_class = GroceryStockSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'item']
    ordering_fields = ['quantity', 'last_restocked']
    ordering = ['item__name']


class GroceryPurchaseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing grocery purchases
    """
    queryset = GroceryPurchase.objects.all()
    serializer_class = GroceryPurchaseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'vendor', 'payment_status', 'purchase_date']
    ordering_fields = ['purchase_date', 'total_amount', 'created_at']
    ordering = ['-purchase_date']


class GroceryPurchaseItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing purchase items
    """
    queryset = GroceryPurchaseItem.objects.all()
    serializer_class = GroceryPurchaseItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['purchase', 'item']


class GroceryConsumptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tracking grocery consumption
    """
    queryset = GroceryConsumption.objects.all()
    serializer_class = GroceryConsumptionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'item', 'consumption_date']
    ordering_fields = ['consumption_date', 'created_at']
    ordering = ['-consumption_date']
