from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import BranchViewSet, RoomViewSet, TenantViewSet, RoomOccupancyViewSet, RentPaymentViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Legacy router for backward compatibility
router = DefaultRouter()
router.register(r'branches', BranchViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'occupancy', RoomOccupancyViewSet)
router.register(r'payments', RentPaymentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('core.urls')),  # This includes all our new auth and enhanced endpoints
    
    # New module endpoints
    path('api/workers/', include('workers.urls')),
    path('api/groceries/', include('groceries.urls')),
    path('api/machines/', include('machines.urls')),
    
    # Legacy endpoints (for backward compatibility)
    path('api/', include(router.urls)),
    
    # JWT Token endpoints (legacy)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
