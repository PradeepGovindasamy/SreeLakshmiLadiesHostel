# 📋 Documentation Summary - Sree Lakshmi Ladies Hostel

## 🎯 Direct Answers to Your Questions

### 1. Where is Tenant Data Stored?

**Primary Storage Location**: 
```
hostel_admin_backend/db.sqlite3
```

**Database Table**: `core_tenant`

**Complete Storage Details**:
- **Physical File**: SQLite database at root of backend project
- **Django Model**: `core/models.py` → `Tenant` class (starts at line 130)
- **Database Schema**: 
  - Personal Info: name, phone_number, email, address
  - Family Info: father_name/aadhar, mother_name/aadhar, guardian_name/aadhar
  - Occupancy: room (FK), joining_date, vacating_date, stay_type
  - ID Proof: id_proof_type, id_proof_number
  - Emergency: emergency_contact_name, emergency_contact_phone
  - Audit: created_by, created_at, updated_at

**Access Methods**:
1. **Backend API**: `GET http://127.0.0.1:8000/api/v2/tenants/`
2. **Frontend**: Component at `src/components/SimpleTenants.js`
3. **Django Admin**: `http://127.0.0.1:8000/admin/core/tenant/`
4. **Django Shell**: `Tenant.objects.all()`

### 2. How Does Authentication Work?

The application has **DUAL authentication mechanisms**:

#### **Method 1: Traditional Username/Password**
```
Flow:
1. User enters username/password in LoginForm
2. POST /api/auth/login/ { username, password }
3. Backend validates via Django's authenticate()
4. Generates JWT tokens (access: 30min, refresh: 30days)
5. Returns: { access, refresh, user, profile }
6. Frontend stores in localStorage
7. All API requests include: Authorization: Bearer <token>
```

**Files Involved**:
- Backend: `core/views_auth.py` → `login_view()`
- Frontend: `src/contexts/UserContext.js` → `login()`
- Config: `hostel_admin/settings.py` → SIMPLE_JWT settings

#### **Method 2: Firebase Phone OTP**
```
Flow:
1. User enters phone number (+91XXXXXXXXXX)
2. POST /api/auth/send-otp/ → Returns session_info
3. User receives OTP via SMS (or uses "123456" for testing)
4. User enters OTP code
5. POST /api/auth/verify-otp/ { phone_number, otp, session_info }
6. Backend:
   - Validates OTP
   - Finds or creates User + UserProfile
   - Generates JWT tokens
7. Returns: { access_token, refresh_token, user, profile }
8. Frontend stores tokens and authenticates
```

**Files Involved**:
- Backend: `core/views_firebase.py` → `send_otp()`, `verify_otp()`
- Frontend: `src/components/BackendOTPLogin.js`
- Config: `hostel_admin/settings.py` → Firebase credentials

#### **Token Management**:
- **Storage**: Frontend localStorage (keys: `access`, `refresh`)
- **Validation**: Django REST Framework JWT middleware
- **Refresh**: Automatic via axios interceptor on 401 errors
- **Expiry**: Access token (30 min), Refresh token (30 days)

#### **How Authenticated Requests Work**:
```
1. User makes API request
2. Axios interceptor adds: Authorization: Bearer <access_token>
3. Django JWT middleware validates token
4. Sets request.user to authenticated User object
5. ViewSets filter data based on user.profile.role
6. Returns only authorized data
```

### 3. Role-Based Access Control (RBAC)

**Four User Roles**:
1. **Admin**: Full system access
2. **Owner**: Manage owned properties
3. **Warden**: Manage assigned branches
4. **Tenant**: View personal data only

**How RBAC Works**:

**Backend Enforcement**:
```python
# Location: core/views_enhanced.py
# Example: EnhancedBranchViewSet

def get_queryset(self):
    user = self.request.user
    role = user.profile.role
    
    if role == 'admin':
        return Branch.objects.all()
    elif role == 'owner':
        return Branch.objects.filter(owner=user)
    elif role == 'warden':
        assignments = WardenAssignment.objects.filter(warden=user)
        return Branch.objects.filter(id__in=assignments.values('branch_id'))
    else:  # tenant
        return Branch.objects.none()
```

**Frontend Enforcement**:
```javascript
// Location: src/config/routes.js
{
  path: '/branches',
  component: Branches,
  requiredRoles: ['owner', 'admin'],  // Only these roles can access
  showInNav: true
}

// Protected by: src/components/ProtectedRoute.js
```

**Role Storage**: `core_userprofile.role` (related to Django's `auth_user`)

---

## 📚 Documentation Files Created

I've created **THREE comprehensive documentation files** for you:

### 1. FULLSTACK_DOCUMENTATION.md (Main Document)
**Purpose**: Complete technical documentation  
**Sections**:
- System Overview
- Technology Stack
- Database Schema (detailed)
- Authentication System (both methods)
- Role-Based Access Control
- API Architecture
- Frontend Architecture
- Data Flow Diagrams
- Deployment Configuration

**Best For**: Understanding the entire system, onboarding developers, reference documentation

### 2. ARCHITECTURE_DIAGRAM.md (Visual Reference)
**Purpose**: Visual system architecture and diagrams  
**Sections**:
- System Architecture Overview (ASCII diagrams)
- Authentication Flow Diagrams
- Role-Based Data Access Flow
- Database Relationships
- Component Interaction Flow
- File System Layout

**Best For**: Quick visual understanding, presentations, explaining to non-technical stakeholders

### 3. QUICK_REFERENCE.md (Cheat Sheet)
**Purpose**: Quick answers and common operations  
**Sections**:
- Direct answers to key questions
- Quick start commands
- Key API endpoints
- Common operations with code examples
- Troubleshooting guide
- Test credentials
- Important files reference

**Best For**: Daily development, quick lookups, common tasks

---

## 🔑 Key System Facts

### Technology Choices
- **Backend**: Django 4.x + Django REST Framework
- **Database**: SQLite (dev) / PostgreSQL (prod ready)
- **Authentication**: JWT + Firebase
- **Frontend**: React 18 + Material-UI
- **State Management**: React Context API

### Critical Numbers
- **Access Token Lifetime**: 30 minutes
- **Refresh Token Lifetime**: 30 days
- **Backend Port**: 8000
- **Frontend Port**: 3000
- **Total Database Tables**: 12+ (core models)

### Data Architecture
```
Branch (Properties)
  ├─> Room (multiple)
  │     ├─> Tenant (multiple)
  │     │     ├─> RoomOccupancy (history)
  │     │     └─> RentPayment (multiple)
  │     └─> Capacity validation
  └─> Owner (User)

User (Django auth)
  └─> UserProfile (role, permissions)
       └─> Branch (for wardens)
```

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Start Backend
```bash
cd hostel_admin_backend
source hostel_env/bin/activate  # Linux/Mac
python manage.py runserver 0.0.0.0:8000
```

### Step 2: Start Frontend
```bash
cd hostel-frontend-starter
npm start  # Opens http://localhost:3000
```

### Step 3: Login
- **URL**: http://localhost:3000
- **Option 1**: Username/Password (if you have credentials)
- **Option 2**: Phone OTP with +91XXXXXXXXXX and OTP: "123456"

### Step 4: Explore
- Dashboard shows role-based information
- Navigate through sidebar menu
- Try creating a branch, room, or tenant

---

## 📊 Data Models at a Glance

| Model | Purpose | Key Fields | Location |
|-------|---------|-----------|----------|
| **Tenant** | Store tenant information | name, phone, room, joining_date | `core_tenant` table |
| **Branch** | Store property details | name, address, owner, property_type | `core_branch` table |
| **Room** | Store room information | room_name, sharing_type, rent, branch | `core_room` table |
| **UserProfile** | Store user roles & permissions | user, role, phone_number, branch | `core_userprofile` table |
| **RoomOccupancy** | Historical tenant stays | tenant, room, start_date, end_date | `core_roomoccupancy` table |
| **RentPayment** | Payment records | tenant, amount, for_month, method | `core_rentpayment` table |

---

## 🔐 Authentication Summary

| Feature | Username/Password | Firebase Phone OTP |
|---------|-------------------|-------------------|
| **Endpoint** | `/api/auth/login/` | `/api/auth/send-otp/` + `/api/auth/verify-otp/` |
| **Input** | username, password | phone_number, otp |
| **Token Type** | JWT (access + refresh) | JWT (access + refresh) |
| **User Creation** | Manual (admin creates) | Auto-created on first OTP login |
| **Default Role** | As assigned | Tenant |
| **Best For** | Admin/Owner/Warden | Tenant self-registration |

---

## 🎯 Quick Navigation

**Want to understand...**
- ❓ **Where tenant data is stored?** → See "Where is Tenant Data Stored?" above
- ❓ **How authentication works?** → See "How Does Authentication Work?" above
- ❓ **Complete system details?** → Read `FULLSTACK_DOCUMENTATION.md`
- ❓ **Visual architecture?** → View `ARCHITECTURE_DIAGRAM.md`
- ❓ **Quick code examples?** → Check `QUICK_REFERENCE.md`
- ❓ **API endpoints?** → See `QUICK_REFERENCE.md` → API Endpoints section
- ❓ **Database schema?** → See `FULLSTACK_DOCUMENTATION.md` → Section 3
- ❓ **Role-based access?** → See `FULLSTACK_DOCUMENTATION.md` → Section 5

---

## 🔍 Key File Locations

### Backend (Django)
```
hostel_admin_backend/
├── db.sqlite3                      ⭐ PRIMARY DATA STORAGE
├── core/models.py                  ⭐ Tenant model (line 130)
├── core/views_auth.py              ⭐ Login endpoints
├── core/views_firebase.py          ⭐ OTP authentication
├── core/serializers.py             API serializers
├── hostel_admin/settings.py        ⭐ Configuration
└── hostel_admin/urls.py            URL routing
```

### Frontend (React)
```
hostel-frontend-starter/
├── src/App.js                      ⭐ Main component
├── src/api.js                      ⭐ API helpers
├── src/contexts/UserContext.js     ⭐ Auth state management
├── src/config/routes.js            ⭐ Route configuration
├── src/components/SimpleTenants.js ⭐ Tenant management UI
└── src/api/axiosInstance.js        Token refresh logic
```

---

## 💡 Pro Tips

1. **Finding Data**: All tenant data is in ONE table: `core_tenant` in `db.sqlite3`
2. **Testing Auth**: Use phone OTP with any number and OTP "123456"
3. **Debugging**: Check Django shell with `python manage.py shell`
4. **API Testing**: Use Django's browsable API at `http://127.0.0.1:8000/api/`
5. **Role Issues**: Verify `UserProfile.role` in database or Django admin
6. **Token Issues**: Clear localStorage and re-login
7. **Database Backup**: Simple `cp db.sqlite3 backup.sqlite3`

---

## 📞 Support Information

**Documentation Files**:
- 📄 FULLSTACK_DOCUMENTATION.md (Complete technical docs)
- 📊 ARCHITECTURE_DIAGRAM.md (Visual diagrams)
- 📝 QUICK_REFERENCE.md (Cheat sheet)
- 📋 README_DOCUMENTATION_SUMMARY.md (This file)

**Additional Resources**:
- Django Docs: https://docs.djangoproject.com/
- React Docs: https://react.dev/
- DRF Docs: https://www.django-rest-framework.org/
- Firebase Docs: https://firebase.google.com/docs

---

## ✅ What You Now Know

After reading this documentation, you understand:

✓ **Tenant Data Location**: SQLite database at `hostel_admin_backend/db.sqlite3`  
✓ **Database Table**: `core_tenant` with all tenant information  
✓ **Authentication Methods**: Username/Password OR Firebase Phone OTP  
✓ **How JWT Works**: Token generation, storage, validation, and refresh  
✓ **Role-Based Access**: 4 roles with backend and frontend enforcement  
✓ **Data Flow**: From user input → API → database → response → UI  
✓ **API Architecture**: Two versions (legacy and enhanced) with role filtering  
✓ **System Components**: Backend (Django), Frontend (React), Database (SQLite)  

---

**Generated**: January 16, 2026  
**Application**: Sree Lakshmi Ladies Hostel Management System  
**Version**: 1.0  
**Type**: Fullstack Application (Django + React)
