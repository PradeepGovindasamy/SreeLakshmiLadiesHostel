# Quick Reference Guide - Sree Lakshmi Ladies Hostel

## 📍 Tenant Data Storage - Quick Answer

**Primary Location**: `hostel_admin_backend/db.sqlite3`

**Database Table**: `core_tenant`

**Access Points**:
- Backend Model: `core/models.py` → `Tenant` class (Line 130)
- API Endpoint: `http://127.0.0.1:8000/api/v2/tenants/`
- Frontend Component: `src/components/SimpleTenants.js`

**What's Stored**:
- Personal info (name, phone, email, address)
- Family info (father, mother, guardian with Aadhar)
- Room assignment & occupancy dates
- ID proof details
- Emergency contacts

---

## 🔐 Authentication - Quick Answer

### Two Authentication Methods:

#### 1️⃣ Username/Password
```
Endpoint: POST /api/auth/login/
Input: { username, password }
Output: { access, refresh, user, profile }
Token Lifetime: 30 minutes (access), 30 days (refresh)
```

#### 2️⃣ Firebase Phone OTP
```
Step 1: POST /api/auth/send-otp/
        { phone_number: "+919876543210" }

Step 2: POST /api/auth/verify-otp/
        { phone_number, otp, session_info }
        
Output: { access_token, refresh_token, user, profile }
Demo OTP: "123456" (works for testing)
```

**Token Storage**: Frontend `localStorage` (keys: `access`, `refresh`)

**How It Works**:
1. User logs in → Backend validates → Generates JWT tokens
2. Frontend stores tokens in localStorage
3. Every API request includes: `Authorization: Bearer <access_token>`
4. Backend JWT middleware validates token → Sets `request.user`
5. ViewSets filter data based on user's role

---

## 👥 User Roles & Access

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access, all branches, user management |
| **Owner** | Manage owned properties, create branches, assign wardens |
| **Warden** | Manage assigned branch only, limited permissions |
| **Tenant** | View own information, submit requests |

**Role Storage**: `core_userprofile.role` (related to `auth_user`)

---

## 🚀 Quick Start Commands

### Backend
```bash
cd hostel_admin_backend
source hostel_env/bin/activate      # Linux/Mac
# OR
hostel_env\Scripts\activate         # Windows

python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd hostel-frontend-starter
npm install
npm start                           # Runs on port 3000
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000/api/
- Django Admin: http://127.0.0.1:8000/admin/

---

## 📊 Key API Endpoints Reference

### Authentication
```
POST   /api/auth/login/                    # Traditional login
POST   /api/auth/send-otp/                 # Send OTP to phone
POST   /api/auth/verify-otp/               # Verify OTP & login
GET    /api/auth/user/                     # Current user info
GET    /api/auth/profile/                  # User profile with role
POST   /api/token/refresh/                 # Refresh access token
```

### Tenants (Enhanced API)
```
GET    /api/v2/tenants/                    # List tenants (role-filtered)
POST   /api/v2/tenants/                    # Create tenant
GET    /api/v2/tenants/<id>/               # Get tenant detail
PUT    /api/v2/tenants/<id>/               # Update tenant
DELETE /api/v2/tenants/<id>/               # Delete tenant
```

### Branches/Properties
```
GET    /api/v2/branches/                   # List branches (role-filtered)
POST   /api/v2/branches/                   # Create branch
GET    /api/v2/branches/<id>/              # Get branch with stats
GET    /api/v2/branches/<id>/rooms/        # Get branch rooms
GET    /api/v2/branches/<id>/tenants/      # Get branch tenants
```

### Rooms
```
GET    /api/v2/rooms/                      # List rooms
POST   /api/v2/rooms/                      # Create room
GET    /api/v2/rooms/<id>/                 # Get room detail
GET    /api/v2/rooms/<id>/tenants/         # Get room tenants
GET    /api/v2/rooms/<id>/availability/    # Check availability
```

### User Management (Admin/Owner only)
```
GET    /api/users/                         # List users
POST   /api/users/create_with_profile/     # Create user with role
GET    /api/users/<id>/                    # Get user detail
PATCH  /api/users/<id>/update_profile/     # Update user profile
```

---

## 🔍 Common Operations

### 1. Find All Tenants in a Specific Room
**API Call**:
```bash
GET /api/v2/tenants/?room=5
```

**Python Code**:
```python
from core.models import Tenant
tenants = Tenant.objects.filter(room_id=5, vacating_date__isnull=True)
```

### 2. Check Room Occupancy
**API Call**:
```bash
GET /api/v2/rooms/5/availability/
```

**Python Code**:
```python
from core.models import Room
room = Room.objects.get(id=5)
print(f"Current Occupancy: {room.current_occupancy}/{room.sharing_type}")
print(f"Status: {room.status}")  # 'available', 'occupied', 'maintenance'
```

### 3. Create New Tenant
**Frontend Code**:
```javascript
import { enhancedAPI } from './api';

const tenantData = {
  name: "Jane Doe",
  phone_number: "+919876543210",
  room: 5,
  joining_date: "2024-01-15",
  stay_type: "monthly",
  father_name: "John Doe",
  emergency_contact_phone: "+919999999999"
};

const response = await enhancedAPI.tenants.create(tenantData);
```

**Backend Code** (Django shell):
```python
from core.models import Tenant, Room
from django.contrib.auth.models import User

tenant = Tenant.objects.create(
    name="Jane Doe",
    phone_number="+919876543210",
    room_id=5,
    joining_date="2024-01-15",
    stay_type="monthly",
    created_by=User.objects.get(username='admin')
)
```

### 4. Create User with Role
**API Call**:
```bash
POST /api/users/create_with_profile/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "username": "warden1",
  "password": "SecurePass123",
  "email": "warden1@hostel.com",
  "first_name": "Warden",
  "last_name": "One",
  "profile": {
    "role": "warden",
    "phone_number": "+919123456789",
    "branch": 1
  }
}
```

### 5. Assign Warden to Branch
**Python Code**:
```python
from core.models import WardenAssignment, Branch
from django.contrib.auth.models import User

WardenAssignment.objects.create(
    warden=User.objects.get(username='warden1'),
    branch=Branch.objects.get(id=1),
    assigned_by=User.objects.get(username='owner'),
    can_manage_rooms=True,
    can_manage_tenants=True,
    can_view_payments=True
)
```

### 6. Get Branch Statistics
**API Call**:
```bash
GET /api/v2/branches/1/
```

**Response**:
```json
{
  "id": 1,
  "name": "Main Branch",
  "total_rooms": 20,
  "total_beds": 60,
  "occupied_beds": 45,
  "vacant_beds": 15,
  "bed_occupancy_rate": 75.0,
  "property_type": "ladies_hostel",
  "owner": {
    "id": 1,
    "username": "owner1",
    "email": "owner@hostel.com"
  }
}
```

---

## 🛠️ Development Tips

### Database Access
```bash
# Django shell
python manage.py shell

# Import models
from core.models import Tenant, Room, Branch, UserProfile
from django.contrib.auth.models import User

# Query examples
Tenant.objects.all()
Tenant.objects.filter(room__branch__name="Main Branch")
Room.objects.filter(is_full=True)
```

### Database Backup
```bash
# SQLite backup
cp db.sqlite3 db.sqlite3.backup

# Export data
python manage.py dumpdata > backup.json

# Import data
python manage.py loaddata backup.json
```

### Create Admin User
```bash
python manage.py createsuperuser
```

### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Reset Database (Development)
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

## 🐛 Troubleshooting

### Issue: "Token is invalid or expired"
**Solution**:
```javascript
// Frontend: Clear localStorage and re-login
localStorage.removeItem('access');
localStorage.removeItem('refresh');
window.location.href = '/login';
```

### Issue: "CORS error"
**Solution**: Check `hostel_admin/settings.py`
```python
INSTALLED_APPS = [
    'corsheaders',  # Must be here
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be early
    ...
]

CORS_ALLOW_ALL_ORIGINS = True  # Development only
```

### Issue: "Cannot add tenant - room is full"
**Solution**: Check room capacity
```python
room = Room.objects.get(id=5)
print(f"Capacity: {room.sharing_type}")
print(f"Current: {room.current_occupancy}")
print(f"Is Full: {room.is_full}")
```

### Issue: User can't see any data (role issue)
**Solution**: Check UserProfile
```python
user = User.objects.get(username='user1')
profile = user.profile
print(f"Role: {profile.role}")
print(f"Branch: {profile.branch}")

# For wardens, check assignments
from core.models import WardenAssignment
assignments = WardenAssignment.objects.filter(warden=user, is_active=True)
```

### Issue: Firebase OTP not working
**Check**:
1. Firebase credentials in `settings.py`
2. Firebase project configuration
3. Phone number format (must start with +)
4. For testing: Use OTP "123456"

---

## 📝 Testing Credentials (Development)

### Create Test Users
```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from core.models import UserProfile, Branch

# Admin user
admin = User.objects.create_superuser('admin', 'admin@hostel.com', 'admin123')
UserProfile.objects.create(user=admin, role='admin', phone_number='+911234567890')

# Owner user
owner = User.objects.create_user('owner', 'owner@hostel.com', 'owner123')
UserProfile.objects.create(user=owner, role='owner', phone_number='+911234567891')

# Create a branch for owner
branch = Branch.objects.create(
    name='Test Branch',
    address='123 Main St',
    owner=owner,
    property_type='ladies_hostel'
)

# Warden user
warden = User.objects.create_user('warden', 'warden@hostel.com', 'warden123')
UserProfile.objects.create(user=warden, role='warden', phone_number='+911234567892', branch=branch)

# Tenant user
tenant_user = User.objects.create_user('tenant', 'tenant@hostel.com', 'tenant123')
UserProfile.objects.create(user=tenant_user, role='tenant', phone_number='+919876543210')
```

### Test Login Credentials
```
Admin:
  Username: admin
  Password: admin123

Owner:
  Username: owner
  Password: owner123

Warden:
  Username: warden
  Password: warden123

Tenant:
  Username: tenant
  Password: tenant123

Phone OTP (Testing):
  Any phone: +91XXXXXXXXXX
  OTP: 123456
```

---

## 📚 Important Files Quick Reference

| Purpose | File Location |
|---------|---------------|
| Tenant data model | `hostel_admin_backend/core/models.py` (Line 130) |
| Database file | `hostel_admin_backend/db.sqlite3` |
| Login API | `hostel_admin_backend/core/views_auth.py` |
| Phone OTP API | `hostel_admin_backend/core/views_firebase.py` |
| Settings | `hostel_admin_backend/hostel_admin/settings.py` |
| Frontend auth context | `hostel-frontend-starter/src/contexts/UserContext.js` |
| API helpers | `hostel-frontend-starter/src/api.js` |
| Route config | `hostel-frontend-starter/src/config/routes.js` |
| Tenant UI | `hostel-frontend-starter/src/components/SimpleTenants.js` |

---

## 🎯 Key Concepts Summary

### Tenant Data Flow
```
User Input → React Component → API Call → Django ViewSet 
→ Permission Check → Database Query → Serializer → JSON Response 
→ Frontend State → UI Update
```

### Authentication Flow
```
Login → Credentials → Backend Validation → JWT Generation 
→ Token Storage → API Requests with Token → JWT Validation 
→ User Context → Role-Based Access
```

### Role-Based Access
```
User Role → UserProfile → ViewSet Filter → Queryset 
→ Only Authorized Data → Serializer → Response
```

---

**Last Updated**: January 16, 2026  
**Documentation**: See `FULLSTACK_DOCUMENTATION.md` for detailed explanations  
**Architecture**: See `ARCHITECTURE_DIAGRAM.md` for system diagrams
