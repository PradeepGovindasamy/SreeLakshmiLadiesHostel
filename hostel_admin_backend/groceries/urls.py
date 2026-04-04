from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GroceryCategoryViewSet, GroceryItemViewSet, VendorViewSet,
    GroceryStockViewSet, GroceryPurchaseViewSet, GroceryPurchaseItemViewSet,
    GroceryConsumptionViewSet
)

router = DefaultRouter()
router.register(r'categories', GroceryCategoryViewSet, basename='grocery-category')
router.register(r'items', GroceryItemViewSet, basename='grocery-item')
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'stock', GroceryStockViewSet, basename='grocery-stock')
router.register(r'purchases', GroceryPurchaseViewSet, basename='grocery-purchase')
router.register(r'purchase-items', GroceryPurchaseItemViewSet, basename='grocery-purchase-item')
router.register(r'consumption', GroceryConsumptionViewSet, basename='grocery-consumption')

urlpatterns = [
    path('', include(router.urls)),
]
