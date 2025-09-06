# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BranchViewSet, RoomViewSet, TenantViewSet, RoomOccupancyViewSet, RentPaymentViewSet
# from .views_tenant_requests import TenantServiceRequestViewSet  # Temporarily commented out
from .views_auth import (
    login_view, user_detail_view, user_profile_view, 
    UserManagementViewSet, available_branches, CustomTokenObtainPairView,
    create_user_with_profile_standalone
)
from .views_enhanced import (
    EnhancedBranchViewSet, EnhancedRoomViewSet, EnhancedTenantViewSet,
    EnhancedRoomOccupancyViewSet, EnhancedRentPaymentViewSet
)
from .views_firebase import (
    send_otp, verify_otp, firebase_login, verify_token
)

# Create routers for different API versions
router = DefaultRouter()

# Original simple views (for backward compatibility)
router.register(r'branches', BranchViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'occupancy', RoomOccupancyViewSet)
router.register(r'payments', RentPaymentViewSet)
# router.register(r'tenant-requests', TenantServiceRequestViewSet, basename='tenant-requests')  # Temporarily commented out

# Enhanced views with role-based access
enhanced_router = DefaultRouter()
enhanced_router.register(r'branches', EnhancedBranchViewSet, basename='enhanced-branches')
enhanced_router.register(r'rooms', EnhancedRoomViewSet, basename='enhanced-rooms')
enhanced_router.register(r'tenants', EnhancedTenantViewSet, basename='enhanced-tenants')
enhanced_router.register(r'occupancy', EnhancedRoomOccupancyViewSet, basename='enhanced-occupancy')
enhanced_router.register(r'payments', EnhancedRentPaymentViewSet, basename='enhanced-payments')

# User management
user_router = DefaultRouter()
user_router.register(r'users', UserManagementViewSet, basename='users')

urlpatterns = [
    # Authentication endpoints (expected by frontend)
    path('auth/login/', login_view, name='auth-login'),
    path('auth/user/', user_detail_view, name='auth-user'),
    path('auth/profile/', user_profile_view, name='auth-profile'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='auth-token'),
    path('auth/branches/', available_branches, name='auth-available-branches'),
    
    # Firebase Authentication endpoints
    path('auth/send-otp/', send_otp, name='send_otp'),
    path('auth/verify-otp/', verify_otp, name='verify_otp'),
    path('auth/firebase-login/', firebase_login, name='firebase_login'),
    path('auth/verify-token/', verify_token, name='verify_token'),
    
    # User creation endpoints (multiple approaches to ensure it works)
    path('users/create_with_profile/', UserManagementViewSet.as_view({'post': 'create_with_profile'}), name='create-user-with-profile'),
    path('users/create/', create_user_with_profile_standalone, name='create-user-standalone'),
    
    # User management
    path('', include(user_router.urls)),
    
    # Enhanced endpoints with role-based access
    path('v2/', include(enhanced_router.urls)),
    
    # Original endpoints (for backward compatibility)
    path('', include(router.urls)),
]