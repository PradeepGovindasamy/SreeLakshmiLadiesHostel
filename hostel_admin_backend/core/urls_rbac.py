# Role-based URL configuration
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views_rbac import (
    BranchViewSet, RoomViewSet, TenantViewSet, RentPaymentViewSet,
    TenantRequestViewSet, OwnerDashboardViewSet, WardenDashboardViewSet,
    TenantDashboardViewSet
)

# Create router for ViewSets
router = DefaultRouter()

# Register ViewSets with role-based access control
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'rent-payments', RentPaymentViewSet, basename='rentpayment')
router.register(r'tenant-requests', TenantRequestViewSet, basename='tenantrequest')

# Register dashboard ViewSets
router.register(r'dashboard/owner', OwnerDashboardViewSet, basename='owner-dashboard')
router.register(r'dashboard/warden', WardenDashboardViewSet, basename='warden-dashboard')
router.register(r'dashboard/tenant', TenantDashboardViewSet, basename='tenant-dashboard')

# URL patterns
urlpatterns = [
    # Authentication endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Health check endpoint
    path('health/', lambda request: JsonResponse({'status': 'healthy'}), name='health'),
    
    # API endpoints with role-based access control
    path('api/', include(router.urls)),
    
    # Additional role-specific endpoints
    path('api/tenants/me/', TenantViewSet.as_view({'get': 'me', 'put': 'update_profile'}), name='tenant-me'),
    path('api/rent-payments/my/', RentPaymentViewSet.as_view({'get': 'my_payments'}), name='my-payments'),
    path('api/tenant-requests/my/', TenantRequestViewSet.as_view({'get': 'my_requests'}), name='my-requests'),
]

# Import JsonResponse for health check
from django.http import JsonResponse
