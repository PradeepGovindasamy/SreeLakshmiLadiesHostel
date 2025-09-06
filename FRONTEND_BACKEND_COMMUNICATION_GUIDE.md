# Frontend-Backend Communication Guide

## Overview
The hostel management system uses a React frontend communicating with a Django REST API backend through HTTP requests. Authentication is handled via JWT tokens, and authorization is implemented through role-based access control (RBAC).

## Architecture

### Frontend Architecture
- **React 18.2.0** with Material-UI components
- **Axios** for HTTP client with interceptors
- **JWT tokens** stored in localStorage
- **Role-based routing** and conditional component rendering

### Backend Architecture
- **Django REST Framework** with ViewSets
- **JWT Authentication** using django-rest-framework-simplejwt
- **Role-based permissions** with custom permission classes
- **PostgreSQL/SQLite** database

## Authentication Flow

### 1. Login Process

**Frontend Request:**
```javascript
// LoginForm.js / UserContext.js
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password"
}
```

**Backend Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Frontend Storage:**
```javascript
localStorage.setItem('access', response.data.access);
localStorage.setItem('refresh', response.data.refresh);
```

### 2. Token Refresh Process

**Frontend Request (when access token expires):**
```javascript
// axiosInstance.js interceptor
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Backend Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. User Profile Fetching

**Frontend Request:**
```javascript
// UserContext.js
GET /api/auth/user/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Backend Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Profile with Role Information:**
```javascript
GET /api/auth/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "role": "owner",
  "role_display": "Property Owner",
  "phone_number": "+1234567890",
  "business_name": "Doe Properties",
  "business_license": "LIC123456",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

## API Endpoints and Role-Based Access

### 1. Branches/Properties API

**Owner Access - All Branches:**
```javascript
GET /api/branches/
Authorization: Bearer <token>
```

**Response for Owner:**
```json
[
  {
    "id": 1,
    "name": "Lakshmi Ladies Hostel - Main",
    "address": "123 Main St, City",
    "description": "Main branch with modern facilities",
    "num_rooms": 20,
    "num_bathrooms": 8,
    "owner": {
      "id": 1,
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe"
    },
    "owner_name": "John Doe",
    "contact_phone": "+1234567890",
    "contact_email": "contact@hostel.com",
    "total_rooms": 20,
    "occupied_rooms": 15,
    "total_capacity": 60,
    "current_occupancy": 45,
    "occupancy_rate": 75.0,
    "established_date": "2023-01-01",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  }
]
```

**Warden Access - Assigned Branch Only:**
```javascript
GET /api/warden/assigned-property/
Authorization: Bearer <token>
```

**Response for Warden:**
```json
{
  "id": 1,
  "name": "Lakshmi Ladies Hostel - Main",
  "address": "123 Main St, City",
  "assigned_permissions": {
    "can_manage_rooms": true,
    "can_manage_tenants": true,
    "can_view_payments": true,
    "can_collect_payments": false
  },
  "assignment_date": "2024-01-15T10:30:00Z"
}
```

### 2. Rooms API

**Frontend Request:**
```javascript
GET /api/rooms/
Authorization: Bearer <token>
```

**Response (Filtered by Role):**
```json
[
  {
    "id": 1,
    "room_name": "Room 101",
    "sharing_type": 2,
    "sharing_type_display": "Double Sharing",
    "branch": 1,
    "branch_name": "Lakshmi Ladies Hostel - Main",
    "attached_bath": true,
    "ac_room": false,
    "rent": 8000.00,
    "floor_number": 1,
    "room_size_sqft": 150.0,
    "is_available": true,
    "current_occupancy": 1,
    "is_full": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  }
]
```

### 3. Tenants API

**Owner/Warden Request:**
```javascript
GET /api/tenants/
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "user": {
      "id": 5,
      "username": "alice_tenant",
      "first_name": "Alice",
      "last_name": "Johnson"
    },
    "room": {
      "id": 1,
      "room_name": "Room 101",
      "branch_name": "Lakshmi Ladies Hostel - Main"
    },
    "phone_number": "+1234567891",
    "emergency_contact_name": "Bob Johnson",
    "emergency_contact_phone": "+1234567892",
    "date_of_joining": "2024-01-15",
    "vacating_date": null,
    "deposit_amount": 16000.00,
    "monthly_rent": 8000.00,
    "is_active": true
  }
]
```

**Tenant Self-Access:**
```javascript
GET /api/tenants/me/
Authorization: Bearer <token>
```

### 4. Dashboard APIs

**Owner Dashboard:**
```javascript
GET /api/dashboard/owner/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_properties": 3,
  "total_rooms": 60,
  "occupied_rooms": 45,
  "total_tenants": 45,
  "monthly_revenue": 360000.00,
  "occupancy_rate": 75.0,
  "recent_payments": [
    {
      "id": 1,
      "tenant_name": "Alice Johnson",
      "amount": 8000.00,
      "payment_date": "2024-01-20",
      "property_name": "Lakshmi Ladies Hostel - Main"
    }
  ],
  "properties": [
    {
      "id": 1,
      "name": "Lakshmi Ladies Hostel - Main",
      "occupancy_rate": 75.0,
      "monthly_revenue": 120000.00
    }
  ]
}
```

**Warden Dashboard:**
```javascript
GET /api/dashboard/warden/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "assigned_property": {
    "id": 1,
    "name": "Lakshmi Ladies Hostel - Main",
    "total_rooms": 20,
    "occupied_rooms": 15,
    "occupancy_rate": 75.0
  },
  "pending_requests": 3,
  "monthly_collections": 120000.00,
  "recent_activities": [
    {
      "type": "new_tenant",
      "message": "New tenant Alice Johnson moved in",
      "timestamp": "2024-01-20T10:30:00Z"
    }
  ]
}
```

**Tenant Dashboard:**
```javascript
GET /api/dashboard/tenant/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "profile": {
    "room": {
      "room_name": "Room 101",
      "rent": 8000.00,
      "branch_name": "Lakshmi Ladies Hostel - Main"
    },
    "next_payment_due": "2024-02-01",
    "deposit_amount": 16000.00
  },
  "recent_payments": [
    {
      "id": 1,
      "amount": 8000.00,
      "payment_date": "2024-01-20",
      "status": "completed"
    }
  ],
  "my_requests": [
    {
      "id": 1,
      "request_type": "maintenance",
      "description": "AC not working",
      "status": "pending",
      "created_at": "2024-01-19T14:30:00Z"
    }
  ]
}
```

### 5. Tenant Requests API

**Create Request (Tenant):**
```javascript
POST /api/tenant-requests/
Authorization: Bearer <token>
Content-Type: application/json

{
  "request_type": "maintenance",
  "description": "AC not working properly",
  "priority": "medium"
}
```

**Response:**
```json
{
  "id": 1,
  "request_type": "maintenance",
  "description": "AC not working properly",
  "priority": "medium",
  "status": "pending",
  "tenant": {
    "id": 1,
    "user": {
      "first_name": "Alice",
      "last_name": "Johnson"
    },
    "room": {
      "room_name": "Room 101"
    }
  },
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T10:30:00Z"
}
```

**Get My Requests (Tenant):**
```javascript
GET /api/tenant-requests/my/
Authorization: Bearer <token>
```

**Get All Requests (Owner/Warden):**
```javascript
GET /api/tenant-requests/
Authorization: Bearer <token>
```

## Authorization Implementation

### 1. HTTP Request Headers

Every authenticated request includes:
```javascript
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

### 2. Frontend Axios Interceptors

**Request Interceptor:**
```javascript
// axiosInstance.js
axiosInstance.interceptors.request.use(async config => {
  const accessToken = localStorage.getItem('access');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});
```

**Response Interceptor (Token Refresh):**
```javascript
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401 && refreshToken && !originalRequest._retry) {
      // Attempt token refresh
      const response = await axios.post('/api/token/refresh/', {
        refresh: refreshToken
      });
      
      // Update tokens and retry original request
      localStorage.setItem('access', response.data.access);
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### 3. Backend Permission Classes

**Custom Permission Classes:**
```python
# permissions.py
class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions for all authenticated users
        if request.method in SAFE_METHODS:
            return self._has_read_access(request.user, obj)
        
        # Write permissions only for owners
        return self._has_write_access(request.user, obj)

class IsBranchOwnerOrWarden(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and \
               hasattr(request.user, 'profile')

class IsTenantOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Tenants can only access their own records
        return obj.user == request.user
```

**ViewSet Permission Configuration:**
```python
# views_rbac.py
class BranchViewSet(RoleBasedViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

class TenantViewSet(RoleBasedViewSet):
    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]
```

### 4. Role-Based Data Filtering

**Backend Queryset Filtering:**
```python
def filter_queryset_by_role(self, queryset, user_role):
    if user_role == 'owner':
        return queryset.filter(owner=self.request.user)
    elif user_role == 'warden':
        return queryset.filter(
            warden_assignments__warden=self.request.user,
            warden_assignments__is_active=True
        )
    elif user_role == 'tenant':
        try:
            tenant = self.request.user.tenant_profile
            if tenant.room:
                return queryset.filter(id=tenant.room.branch.id)
        except AttributeError:
            pass
        return queryset.none()
    return queryset.none()
```

## Error Handling

### 1. Authentication Errors

**401 Unauthorized Response:**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

**Frontend Handling:**
```javascript
// UserContext.js
if (err.response?.status === 401) {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  setUser(null);
  setProfile(null);
}
```

### 2. Authorization Errors

**403 Forbidden Response:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Frontend Handling:**
```javascript
// ProtectedRoute.js
if (!hasAnyRole(requiredRoles)) {
  return <Navigate to="/dashboard" replace />;
}
```

### 3. Validation Errors

**400 Bad Request Response:**
```json
{
  "field_name": [
    "This field is required."
  ],
  "non_field_errors": [
    "Invalid data provided."
  ]
}
```

## Security Features

### 1. JWT Token Security
- **Access tokens** expire in 15 minutes
- **Refresh tokens** expire in 7 days
- **Automatic token refresh** on 401 responses
- **Secure token storage** in localStorage

### 2. CORS Configuration
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

### 3. Permission Layers
1. **Authentication**: JWT token validation
2. **Authorization**: Role-based permission classes
3. **Object-level permissions**: Owner/tenant-specific access
4. **Data filtering**: Queryset filtering by role

### 4. Input Validation
- **DRF serializers** validate all input data
- **Custom validators** for business logic
- **SQL injection protection** through Django ORM
- **XSS protection** through React's built-in escaping

## Performance Optimizations

### 1. Caching
```python
@method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
def list(self, request):
    return super().list(request)
```

### 2. Database Optimization
- **select_related()** for foreign key relationships
- **prefetch_related()** for many-to-many relationships
- **Database indexing** on frequently queried fields

### 3. Frontend Optimization
- **Axios interceptors** for automatic token management
- **Conditional rendering** to reduce unnecessary API calls
- **Error boundaries** for graceful error handling

This comprehensive communication system ensures secure, role-based data access while maintaining good performance and user experience.
