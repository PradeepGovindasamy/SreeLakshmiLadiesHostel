# Role-Based Access Control (RBAC) Implementation

This document describes the comprehensive Role-Based Access Control system implemented for the Sree Lakshmi Ladies Hostel Management System.

## 🎯 **Role Separation Overview**

The system implements four distinct roles with clear separation of access:

### **1. Owner (Property Owner)**
- **Access**: Full access to all properties they created
- **Permissions**: 
  - Create, read, update, delete their own branches
  - Manage all rooms in their branches
  - Manage all tenants in their properties
  - View and manage all payments for their properties
  - Assign wardens to their branches
  - View comprehensive reports and analytics
  - Grant permissions to other users

### **2. Warden**
- **Access**: Access only to properties they are assigned to
- **Permissions**:
  - View assigned branch details (read-only)
  - Manage rooms in assigned branches (if permitted)
  - Manage tenants in assigned branches (if permitted)
  - View payments in assigned branches (if permitted)
  - Collect payments (if permitted)
  - Handle tenant requests and complaints
  - View warden-specific dashboard

### **3. Tenant**
- **Access**: Access only to their own profile, payments, and requests
- **Permissions**:
  - View and update their own profile
  - View their payment history
  - Create and view their own requests/complaints
  - View their room and branch information
  - Access tenant-specific dashboard

### **4. Admin**
- **Access**: System-wide access (superuser)
- **Permissions**: All permissions across the entire system

## 🏗️ **Architecture Components**

### **1. Middleware (`core/middleware.py`)**

#### **RoleBasedAccessMiddleware**
- Intercepts all API requests
- Validates user authentication and role
- Enforces role-based URL access patterns
- Adds user context (accessible branches, tenants) to requests
- Returns appropriate error responses for unauthorized access

#### **PropertyOwnershipMiddleware**
- Adds property ownership context to requests
- Provides helpers for checking ownership/assignment
- Caches user permissions for performance

#### **APIRateLimitMiddleware**
- Implements role-based rate limiting
- Different limits for each role type
- Prevents API abuse

### **2. Decorators (`core/decorators.py`)**

#### **@require_role(*roles)**
```python
@require_role('owner', 'admin')
def owner_only_view(request):
    # Only owners and admins can access
```

#### **@require_property_ownership(resource_type)**
```python
@require_property_ownership('branch')
def branch_detail_view(request, branch_id):
    # Only branch owner can access
```

#### **@require_warden_permission(permission_type)**
```python
@require_warden_permission('can_manage_tenants')
def create_tenant_view(request, branch_id):
    # Only wardens with tenant management permission
```

#### **@tenant_access_only**
```python
@tenant_access_only
def tenant_profile_view(request):
    # Tenants can only access their own data
```

### **3. Enhanced Models (`core/models.py`)**

#### **Key Model Enhancements:**

**UserProfile**
- Extended with 4 role types
- Business information for owners
- Phone numbers and activity status

**Branch**
- Owner relationship for property ownership
- Enhanced contact information
- Audit timestamps

**Tenant**
- Linked to user accounts for login
- Comprehensive personal information
- Audit trail with created_by field

**WardenAssignment**
- Explicit warden-to-branch assignments
- Granular permission flags
- Assignment history and notes

**TenantRequest**
- Request/complaint system for tenants
- Priority and status tracking
- Assignment to wardens/staff

**BranchPermission**
- Granular permission system
- User-specific branch access control
- Permission inheritance

### **4. Enhanced Views (`core/views_rbac.py`)**

#### **RoleBasedViewSet (Base Class)**
- Automatic role-based queryset filtering
- User context injection
- Standardized permission checking

#### **Specific ViewSets:**
- **BranchViewSet**: Branch management with ownership checks
- **RoomViewSet**: Room management with assignment checks
- **TenantViewSet**: Tenant management with role filtering
- **RentPaymentViewSet**: Payment management with collection permissions
- **TenantRequestViewSet**: Request handling with role-based access

#### **Dashboard ViewSets:**
- **OwnerDashboardViewSet**: Owner-specific analytics
- **WardenDashboardViewSet**: Warden task management
- **TenantDashboardViewSet**: Tenant personal dashboard

### **5. Custom Permissions (`core/permissions.py`)**

#### **Permission Classes:**
- **IsOwnerOrReadOnly**: Ownership-based write access
- **IsBranchOwnerOrWarden**: Branch-level access control
- **IsTenantOwner**: Tenant data access control
- **CanManagePayments**: Payment operation permissions

#### **Helper Functions:**
- **get_user_accessible_branches()**: Get branches accessible to user
- **get_user_accessible_tenants()**: Get tenants accessible to user

## 🚀 **Implementation Steps**

### **1. Apply Database Migration**
```bash
cd hostel_admin_backend
python manage.py migrate
```

### **2. Update Django Settings**
Add the middleware to `settings.py`:
```python
MIDDLEWARE = [
    # ... existing middleware
    'core.middleware.RoleBasedAccessMiddleware',
    'core.middleware.PropertyOwnershipMiddleware',
    'core.middleware.APIRateLimitMiddleware',
]
```

### **3. Set Up Initial RBAC Data**
```bash
# Create admin user
python manage.py setup_rbac --create-admin

# Migrate existing data
python manage.py setup_rbac --migrate-existing-data

# Create sample data for testing
python manage.py setup_rbac --setup-sample-data
```

### **4. Update URL Configuration**
Replace the existing URLs with role-based ones:
```python
# In hostel_admin/urls.py
from core.urls_rbac import urlpatterns as rbac_patterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(rbac_patterns)),
]
```

### **5. Frontend Integration**
Update React components to handle role-based routing:

```javascript
// Check user role from token or API
const userRole = getUserRole();

// Render components based on role
{userRole === 'owner' && <OwnerDashboard />}
{userRole === 'warden' && <WardenDashboard />}
{userRole === 'tenant' && <TenantDashboard />}
```

## 🔐 **Security Features**

### **Authentication**
- JWT tokens with automatic refresh
- Secure token storage and transmission
- Session management

### **Authorization**
- Role-based URL access control
- Resource-level ownership checking
- Granular permission system
- Audit logging of access attempts

### **Data Isolation**
- Users only see data they have access to
- Automatic queryset filtering by role
- Property ownership enforcement
- Tenant data privacy protection

### **Rate Limiting**
- Role-based request limits
- API abuse prevention
- Fair usage enforcement

## 📊 **API Endpoints by Role**

### **Owner Endpoints**
```
GET /api/branches/                 # Own branches
POST /api/branches/                # Create branch
GET /api/branches/{id}/            # Own branch details
PUT /api/branches/{id}/            # Update own branch
DELETE /api/branches/{id}/         # Delete own branch
POST /api/branches/{id}/assign_warden/  # Assign warden
GET /api/branches/{id}/statistics/ # Branch analytics

GET /api/rooms/                    # Rooms in own branches
POST /api/rooms/                   # Create room
GET /api/tenants/                  # Tenants in own properties
POST /api/tenants/                 # Add tenant
GET /api/rent-payments/            # Payments for own properties
GET /api/dashboard/owner/          # Owner dashboard
```

### **Warden Endpoints**
```
GET /api/branches/                 # Assigned branches (read-only)
GET /api/rooms/                    # Rooms in assigned branches
POST /api/rooms/                   # Create room (if permitted)
PUT /api/rooms/{id}/               # Update room (if permitted)
GET /api/tenants/                  # Tenants in assigned branches
POST /api/tenants/                 # Add tenant (if permitted)
GET /api/rent-payments/            # View payments (if permitted)
POST /api/rent-payments/           # Collect payment (if permitted)
GET /api/tenant-requests/          # Handle requests
PUT /api/tenant-requests/{id}/update_status/  # Update request
GET /api/dashboard/warden/         # Warden dashboard
```

### **Tenant Endpoints**
```
GET /api/tenants/me/               # Own profile
PUT /api/tenants/me/               # Update profile
GET /api/rent-payments/my/         # Own payment history
GET /api/tenant-requests/my/       # Own requests
POST /api/tenant-requests/         # Create request
GET /api/dashboard/tenant/         # Tenant dashboard
```

## 🛠️ **Usage Examples**

### **Creating a New Owner**
```python
from django.contrib.auth.models import User
from core.models import UserProfile

# Create user account
user = User.objects.create_user(
    username='newowner',
    email='owner@example.com',
    password='securepassword',
    first_name='John',
    last_name='Owner'
)

# Create owner profile
profile = UserProfile.objects.create(
    user=user,
    role='owner',
    phone_number='+91-9876543210',
    business_name='John\'s Properties',
    business_license='BL789012'
)
```

### **Assigning a Warden**
```python
from core.models import WardenAssignment

# Assign warden to branch
assignment = WardenAssignment.objects.create(
    warden=warden_user,
    branch=branch,
    assigned_by=owner_user,
    can_manage_rooms=True,
    can_manage_tenants=True,
    can_view_payments=True,
    can_collect_payments=False
)
```

### **Checking Permissions in Views**
```python
from core.decorators import PermissionChecker

def my_view(request, branch_id):
    # Check if user can access branch
    if not PermissionChecker.can_user_access_branch(request.user, branch_id):
        return Response({'error': 'Access denied'}, status=403)
    
    # Proceed with view logic
    ...
```

## 🔧 **Configuration**

### **Role-Based Settings**
```python
# In settings.py
RBAC_SETTINGS = {
    'CACHE_USER_PERMISSIONS': True,
    'CACHE_TIMEOUT': 60 * 15,  # 15 minutes
    'LOG_ACCESS_ATTEMPTS': True,
    'RATE_LIMITING_ENABLED': True,
    'DEFAULT_RATE_LIMITS': {
        'admin': 1000,
        'owner': 500,
        'warden': 300,
        'tenant': 100,
        'anonymous': 20,
    }
}
```

### **Caching Configuration**
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'KEY_PREFIX': 'hostel_rbac',
        'TIMEOUT': 300,
    }
}
```

## 📝 **Testing**

### **Run RBAC Tests**
```bash
python manage.py test core.tests.test_rbac
```

### **Manual Testing**
1. Create users with different roles
2. Test API endpoints with different user tokens
3. Verify access restrictions
4. Check audit logs

## 🚨 **Troubleshooting**

### **Common Issues**

**1. User has no profile**
```python
# Fix: Create missing profile
UserProfile.objects.create(user=user, role='owner')
```

**2. Branch has no owner**
```python
# Fix: Assign owner to branch
branch.owner = owner_user
branch.save()
```

**3. Warden can't access assigned branch**
```python
# Fix: Check active assignment
WardenAssignment.objects.filter(
    warden=warden_user, 
    branch=branch, 
    is_active=True
)
```

### **Debug Mode**
Enable detailed logging:
```python
LOGGING = {
    'loggers': {
        'core.middleware': {
            'level': 'DEBUG',
        }
    }
}
```

## 📈 **Performance Optimization**

### **Caching Strategy**
- User permissions cached for 15 minutes
- Branch statistics cached for 5 minutes
- Dashboard data cached for 2 minutes

### **Database Optimization**
- Proper indexing on foreign keys
- Efficient queryset filtering
- Batch operations for bulk updates

### **Frontend Optimization**
- Role-based component lazy loading
- Cached user permissions
- Optimized API calls

## 🔮 **Future Enhancements**

1. **Multi-tenancy support** for multiple hostel chains
2. **Permission inheritance** system
3. **Temporary permissions** with expiration dates
4. **Advanced audit logging** with detailed trails
5. **Role-based file access** control
6. **Integration with external auth** providers (OAuth, LDAP)

## 🤝 **Contributing**

When extending the RBAC system:

1. Always check role and ownership in new views
2. Add appropriate decorators for access control
3. Update middleware patterns for new endpoints
4. Add tests for new permission scenarios
5. Document new roles or permissions

## 📄 **License**

This RBAC implementation is part of the Sree Lakshmi Ladies Hostel Management System.
