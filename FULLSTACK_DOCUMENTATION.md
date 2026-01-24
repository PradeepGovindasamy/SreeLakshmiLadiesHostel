# Sree Lakshmi Ladies Hostel - Full Stack Application Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema & Tenant Data Storage](#database-schema--tenant-data-storage)
4. [Authentication System](#authentication-system)
5. [Role-Based Access Control](#role-based-access-control)
6. [API Architecture](#api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Deployment Configuration](#deployment-configuration)

---

## 1. System Overview

**Sree Lakshmi Ladies Hostel** is a comprehensive hostel management system designed to manage multiple properties, rooms, tenants, rent payments, and staff with role-based access control.

### Key Features:
- Multi-branch/property management
- Room occupancy tracking
- Tenant management with family information
- Rent payment collection and tracking
- Role-based access (Admin, Owner, Warden, Tenant)
- Dual authentication: Traditional username/password and Firebase Phone OTP
- Real-time occupancy statistics

---

## 2. Technology Stack

### Backend
- **Framework**: Django 4.x (Python)
- **REST API**: Django REST Framework
- **Authentication**: 
  - JWT (JSON Web Tokens) via `djangorestframework-simplejwt`
  - Firebase Authentication (Phone OTP)
- **Database**: SQLite (Development) / PostgreSQL (Production-ready migrations available)
- **CORS**: django-cors-headers
- **Firebase Admin SDK**: firebase-admin, pyrebase

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Authentication**: Firebase Client SDK (Phone OTP)

### Infrastructure
- **Development Server**: Django Development Server (Port 8000)
- **Frontend Dev Server**: React Dev Server (Port 3000)
- **Containerization**: Docker & Docker Compose support available

---

## 3. Database Schema & Tenant Data Storage

### 3.1 Database Location
**Primary Database**: `hostel_admin_backend/db.sqlite3`

All tenant data is stored in this SQLite database. For production, PostgreSQL migration scripts are available:
- `migrate_to_postgresql.sh` (Linux/Mac)
- `migrate_to_postgresql.ps1` (Windows)

### 3.2 Core Data Models

#### **Branch (Property) Model**
```python
Location: core/models.py - Line 8
Table: core_branch

Key Fields:
- id: Primary Key
- name: Property name
- address, city, state, pincode: Location details
- property_type: (ladies_hostel, mens_hostel, mixed_hostel, guest_house, pg)
- owner: ForeignKey to User (Property Owner)
- contact_phone, contact_email, emergency_contact
- Amenities: has_parking, has_wifi, has_ac, has_laundry, has_security, has_mess
- Administrative: license_number, established_date, is_active
- Timestamps: created_at, updated_at
```

#### **Room Model**
```python
Location: core/models.py - Line 70
Table: core_room

Key Fields:
- id: Primary Key
- branch: ForeignKey to Branch (related_name='rooms')
- room_name: Unique per branch
- sharing_type: Integer (1-8 sharing capacity)
- rent: Decimal
- floor_number: Integer
- attached_bath, ac_room: Boolean
- is_available: Boolean
- Timestamps: created_at, updated_at

Computed Properties:
- current_occupancy: Count of active tenants
- is_full: Boolean (occupancy >= capacity)
- status: 'available', 'occupied', or 'maintenance'
```

#### **Tenant Model** ⭐ (PRIMARY TENANT DATA STORAGE)
```python
Location: core/models.py - Line 130
Table: core_tenant

Key Fields:
Personal Information:
- id: Primary Key
- user: OneToOneField to User (optional, for tenant login)
- name: Tenant full name
- phone_number: Contact number
- email: Email address
- address: Residential address

Family Information:
- father_name, father_aadhar
- mother_name, mother_aadhar
- guardian_name, guardian_aadhar
- emergency_contact_name, emergency_contact_phone

Occupancy Details:
- room: ForeignKey to Room (related_name='tenants')
- stay_type: 'daily' or 'monthly'
- joining_date: Date of joining
- vacating_date: Date of leaving (null if currently staying)

ID Proof:
- id_proof_type: (aadhar, voter_id, driving_license, passport, pan_card)
- id_proof_number: ID proof number

Audit Fields:
- created_by: ForeignKey to User (who created the record)
- created_at, updated_at: Timestamps

Business Logic:
- Validates room capacity before saving
- Automatically creates/updates RoomOccupancy records
- Updates room availability status on save/delete
```

#### **RoomOccupancy Model**
```python
Location: core/models.py - Line 250
Table: core_roomoccupancy

Purpose: Historical record of tenant stays
Key Fields:
- room, tenant: ForeignKeys
- start_date, end_date: Occupancy period
- monthly_rent_agreed: Rent amount
- security_deposit: Deposit amount
- created_by: User who created the record
```

#### **RentPayment Model**
```python
Location: core/models.py - Line 275
Table: core_rentpayment

Key Fields:
- tenant: ForeignKey to Tenant
- payment_date: Date of payment
- amount_paid: Decimal
- for_month: Date (which month's rent)
- payment_method: (cash, bank_transfer, upi, card, cheque)
- reference_number: Transaction reference
- collected_by: User who collected payment
```

#### **UserProfile Model**
```python
Location: core/models.py - Line 305
Table: core_userprofile

Key Fields:
- user: OneToOneField to Django User
- role: (owner, warden, tenant, admin)
- phone_number: User's phone
- firebase_uid: Firebase authentication UID
- phone_verified: Boolean
- business_name, business_license: For owners
- branch: ForeignKey to Branch (for wardens)
- is_active: Boolean
```

#### **WardenAssignment Model**
```python
Location: core/models.py - Line 335
Table: core_wardenassignment

Purpose: Assign wardens to branches with specific permissions
Key Fields:
- warden: ForeignKey to User
- branch: ForeignKey to Branch
- assigned_by: User who made the assignment
- Permissions: can_manage_rooms, can_manage_tenants, can_view_payments, can_collect_payments
- is_active: Boolean
```

### 3.3 Data Access Paths

**Where Tenant Data is Stored and Accessed:**

1. **Database File**: `hostel_admin_backend/db.sqlite3` → `core_tenant` table
2. **Django Model**: `core/models.py` → `Tenant` class
3. **API Endpoints**: 
   - `/api/tenants/` (Legacy)
   - `/api/v2/tenants/` (Enhanced with role filtering)
4. **Serializer**: `core/serializers.py` → `TenantSerializer`
5. **ViewSet**: `core/views.py` → `TenantViewSet` & `core/views_enhanced.py` → `EnhancedTenantViewSet`

**Frontend Access**: 
- Component: `src/components/SimpleTenants.js`
- API Helper: `src/api.js` → `enhancedAPI.tenants.list()`

---

## 4. Authentication System

### 4.1 Dual Authentication Mechanism

The application supports **TWO authentication methods**:

#### Method 1: Traditional Username/Password Authentication
**Backend Flow:**
```
1. Frontend sends: POST /api/auth/login/ 
   Body: { username, password }

2. Backend (views_auth.py - login_view):
   - Authenticates using Django's authenticate()
   - Generates JWT tokens (access + refresh)
   - Returns: { access, refresh, user, profile }

3. Frontend stores:
   - localStorage.setItem('access', access_token)
   - localStorage.setItem('refresh', refresh_token)

4. Subsequent requests:
   - Include: Authorization: Bearer <access_token>
```

**Files Involved:**
- Backend: `core/views_auth.py` → `login_view()`
- Frontend: `src/contexts/UserContext.js` → `login()`
- Settings: `hostel_admin/settings.py` → JWT configuration

#### Method 2: Firebase Phone OTP Authentication
**Backend Flow:**
```
1. Send OTP:
   POST /api/auth/send-otp/
   Body: { phone_number: "+919876543210" }
   Response: { session_info }

2. Verify OTP:
   POST /api/auth/verify-otp/
   Body: { phone_number, otp, session_info }
   
   Backend Process:
   a. Verify OTP (simulated for demo - accepts "123456")
   b. Find existing UserProfile by phone_number
   c. If not exists, create new User + UserProfile (role='tenant')
   d. Generate JWT tokens
   e. Return: { access_token, refresh_token, user, profile }

3. Frontend stores tokens and user data
```

**Files Involved:**
- Backend: `core/views_firebase.py` → `send_otp()`, `verify_otp()`
- Frontend: `src/components/BackendOTPLogin.js`
- Firebase Config: `core/firebase_auth.py`
- Settings: `hostel_admin/settings.py` → Firebase credentials

### 4.2 JWT Token Configuration

```python
Location: hostel_admin/settings.py - Line 150

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}
```

### 4.3 Token Refresh Flow

**Automatic Token Refresh** (Frontend):
```javascript
Location: src/api/axiosInstance.js

Response Interceptor:
- Detects 401 Unauthorized
- Calls: POST /api/token/refresh/ { refresh: token }
- Updates access token
- Retries original request
```

### 4.4 Firebase Configuration

**Backend Firebase Setup:**
```python
Location: hostel_admin/settings.py - Lines 60-75

FIREBASE_PROJECT_ID = 'srilakshmiladieshostel-daca8'
FIREBASE_API_KEY = 'AIzaSyARytYNTnnzBsBXfHygeNVaKsb8S9Si0YI'
FIREBASE_AUTH_DOMAIN = 'srilakshmiladieshostel-daca8.firebaseapp.com'
```

**Custom Firebase Authentication Backend:**
```python
Location: core/firebase_auth.py

class FirebaseAuthentication:
    - Verifies Firebase ID tokens
    - Maps phone_number to UserProfile
    - Creates user if doesn't exist
    - Returns Django User object
```

---

## 5. Role-Based Access Control (RBAC)

### 5.1 User Roles

| Role | Database Value | Access Level |
|------|----------------|--------------|
| Admin | `admin` | Full system access, all branches |
| Owner | `owner` | Manage owned branches, rooms, tenants |
| Warden | `warden` | Manage assigned branch(es), limited permissions |
| Tenant | `tenant` | View own information, make requests |

### 5.2 Role Storage

**Database Location:**
- Table: `core_userprofile`
- Field: `role` (CharField with choices)
- Related to: Django `auth_user` via OneToOneField

### 5.3 Permission System

#### Branch-Level Permissions
```python
Location: core/models.py - BranchPermission Model

Granular permissions per user per branch:
- can_view_branch
- can_edit_branch
- can_manage_rooms
- can_manage_tenants
- can_view_payments
- can_collect_payments
- can_view_reports
- can_assign_wardens
```

#### Warden-Specific Permissions
```python
Location: core/models.py - WardenAssignment Model

Per-branch warden permissions:
- can_manage_rooms
- can_manage_tenants
- can_view_payments
- can_collect_payments
```

### 5.4 Backend Permission Enforcement

**View-Level Permissions:**
```python
Location: core/views_enhanced.py

Example: EnhancedBranchViewSet
- Admin: See all branches
- Owner: See owned branches (owner=request.user)
- Warden: See assigned branches via WardenAssignment
- Tenant: No access (empty queryset)
```

### 5.5 Frontend Role-Based Routing

```javascript
Location: src/config/routes.js

Route Configuration:
{
  path: '/branches',
  component: Branches,
  requiredRoles: ['owner', 'admin'],
  showInNav: true
}

Protection: src/components/ProtectedRoute.js
- Checks user role from UserContext
- Redirects if unauthorized
```

**Navigation Menu Filtering:**
```javascript
Location: src/App.js

const navigationItems = getNavigationItems(userRole);
// Only shows menu items matching user's role
```

---

## 6. API Architecture

### 6.1 API Versioning

The backend has **TWO API versions**:

#### Legacy API (v1)
```
Base: /api/
Endpoints:
- /api/branches/
- /api/rooms/
- /api/tenants/
- /api/occupancy/
- /api/payments/

Features: Simple CRUD, no role filtering
```

#### Enhanced API (v2)
```
Base: /api/v2/
Endpoints:
- /api/v2/branches/
- /api/v2/rooms/
- /api/v2/tenants/
- /api/v2/occupancy/
- /api/v2/payments/

Features: Role-based filtering, enhanced serializers, statistics
```

### 6.2 Key API Endpoints

#### Authentication Endpoints
```
POST /api/auth/login/
  Body: { username, password }
  Returns: { access, refresh, user, profile }

GET /api/auth/user/
  Headers: Authorization: Bearer <token>
  Returns: User details

GET /api/auth/profile/
  Returns: UserProfile with role information

PUT /api/auth/profile/
  Body: Profile updates
  Returns: Updated profile

GET /api/auth/branches/
  Returns: Branches accessible to current user
```

#### Firebase Authentication
```
POST /api/auth/send-otp/
  Body: { phone_number }
  Returns: { session_info, message }

POST /api/auth/verify-otp/
  Body: { phone_number, otp, session_info }
  Returns: { access_token, refresh_token, user, profile }

POST /api/auth/firebase-login/
  Body: { id_token }
  Returns: JWT tokens and user data
```

#### Tenant Management (v2)
```
GET /api/v2/tenants/
  Query Params: ?branch=<id>, ?room=<id>
  Returns: Filtered tenant list based on role

POST /api/v2/tenants/
  Body: Tenant data
  Returns: Created tenant

GET /api/v2/tenants/<id>/
  Returns: Tenant detail

PUT /api/v2/tenants/<id>/
  Body: Updated tenant data
  Returns: Updated tenant

DELETE /api/v2/tenants/<id>/
  Returns: 204 No Content
```

#### Branch Management (v2)
```
GET /api/v2/branches/
  Returns: Role-filtered branches with statistics

GET /api/v2/branches/<id>/
  Returns: Branch detail with stats

POST /api/v2/branches/
  Body: Branch data (owner auto-set to current user)
  Returns: Created branch

GET /api/v2/branches/<id>/rooms/
  Returns: All rooms in branch

GET /api/v2/branches/<id>/tenants/
  Returns: All active tenants in branch

GET /api/v2/branches/<id>/occupancy_stats/
  Returns: { total_rooms, total_beds, occupied_beds, vacancy_rate }
```

#### User Management
```
POST /api/users/create_with_profile/
  Body: { username, password, email, profile: { role, phone_number } }
  Returns: Created user with profile

GET /api/users/
  Query: ?role=<role>
  Returns: User list (admin/owner only)

PATCH /api/users/<id>/update_profile/
  Body: Profile updates
  Returns: Updated profile
```

### 6.3 Response Formats

**Success Response Example:**
```json
{
  "id": 1,
  "name": "John Doe",
  "phone_number": "+919876543210",
  "room": {
    "id": 5,
    "room_name": "Room 101",
    "branch": {
      "id": 1,
      "name": "Main Branch"
    }
  },
  "joining_date": "2024-01-15",
  "vacating_date": null
}
```

**Error Response Example:**
```json
{
  "error": "Invalid credentials",
  "detail": "Username or password is incorrect"
}
```

### 6.4 API Request Flow

```
Frontend Request → Axios Interceptor (add token) 
    ↓
Backend Middleware (CORS, Auth) 
    ↓
URL Router (hostel_admin/urls.py) 
    ↓
Core URLs (core/urls.py) 
    ↓
ViewSet/View Function 
    ↓
Permission Check (IsAuthenticated, Custom) 
    ↓
Query Database (Django ORM) 
    ↓
Serializer (Format response) 
    ↓
Response → Interceptor (handle errors, refresh token)
    ↓
Frontend Component (update UI)
```

---

## 7. Frontend Architecture

### 7.1 Project Structure

```
src/
├── api/
│   ├── axios.js              # Axios instance with interceptors
│   └── axiosInstance.js      # Base axios configuration
├── api.js                    # API helper functions
├── components/
│   ├── BackendOTPLogin.js    # Phone OTP login component
│   ├── LoginForm.js          # Username/password login
│   ├── ProtectedRoute.js     # Route guard component
│   ├── ConditionalDashboard.js  # Role-based dashboard
│   ├── Branches.js           # Branch management
│   ├── Rooms.js              # Room management
│   ├── SimpleTenants.js      # Tenant management
│   ├── RoomStatus.js         # Room occupancy display
│   ├── UserManagement.js     # User CRUD (admin/owner)
│   └── Profile.js            # User profile view/edit
├── contexts/
│   └── UserContext.js        # Global user state management
├── config/
│   └── routes.js             # Route configuration with RBAC
├── pages/
│   └── LoginPage.js          # Login page container
├── App.js                    # Main app component with routing
└── index.js                  # React entry point
```

### 7.2 State Management: UserContext

```javascript
Location: src/contexts/UserContext.js

Provides Global State:
- user: Current user object
- profile: UserProfile with role
- loading: Boolean
- error: Error messages

Methods:
- login(username, password): Traditional login
- phoneOTPLogin(authData): OTP login
- logout(): Clear tokens and state
- isAuthenticated(): Check if user logged in
- hasRole(role): Check specific role
- hasAnyRole(roles): Check multiple roles
- getUserRole(): Get current user role
- getUserName(): Get display name
- updateProfile(data): Update user profile
```

### 7.3 Authentication Flow (Frontend)

#### Username/Password Flow
```javascript
1. User enters credentials in LoginForm
2. Calls: UserContext.login(username, password)
3. Makes API call: POST /api/auth/login/
4. On success:
   - Store tokens in localStorage
   - Set user and profile in Context
   - Navigate to /dashboard
5. ProtectedRoute checks authentication
6. Renders role-appropriate dashboard
```

#### Phone OTP Flow
```javascript
1. User enters phone in BackendOTPLogin
2. Click "Send OTP"
3. API: POST /api/auth/send-otp/
4. User enters 6-digit OTP
5. Click "Verify"
6. API: POST /api/auth/verify-otp/
7. On success:
   - Store tokens in localStorage
   - Call UserContext.phoneOTPLogin(data)
   - Navigate to /dashboard
```

### 7.4 API Integration

```javascript
Location: src/api.js

Organized API helpers:

authAPI:
- login(credentials)
- getUser()
- getProfile()
- updateProfile(data)

enhancedAPI.branches:
- list(params)
- get(id)
- create(data)
- update(id, data)
- delete(id)

enhancedAPI.tenants:
- list()
- get(id)
- create(data)
- update(id, data)
- delete(id)

All requests automatically include JWT token via interceptor
```

### 7.5 Route Protection

```javascript
Location: src/components/ProtectedRoute.js

<ProtectedRoute requiredRoles={['owner', 'admin']}>
  <Branches />
</ProtectedRoute>

Logic:
1. Check if user is authenticated
2. Get user role from UserContext
3. Check if role in requiredRoles
4. If yes: Render component
5. If no: Redirect to login
```

### 7.6 Component Examples

#### Tenant Management Component
```javascript
Location: src/components/SimpleTenants.js

Features:
- Fetches tenants via enhancedAPI.tenants.list()
- Displays in MUI DataGrid
- Add/Edit/Delete operations
- Filters by branch/room (role-dependent)
- Real-time updates

Data Flow:
useEffect → API call → setState → Render DataGrid
```

#### Role-Based Dashboard
```javascript
Location: src/components/ConditionalDashboard.js

Renders different content based on role:
- Admin: System-wide statistics
- Owner: Owned properties stats
- Warden: Assigned branch stats
- Tenant: Personal information
```

---

## 8. Data Flow Diagrams

### 8.1 Tenant Creation Flow

```
Frontend (SimpleTenants.js)
    ↓ User clicks "Add Tenant"
    ↓ Opens Dialog with form
    ↓ User fills: name, phone, room, joining_date, etc.
    ↓ Clicks "Save"
    ↓
    ↓ POST /api/v2/tenants/
    ↓ { name, phone_number, room: <room_id>, joining_date, ... }
    ↓
Backend (EnhancedTenantViewSet.create)
    ↓ Validate data
    ↓ Check permissions (role-based)
    ↓ Set created_by = request.user
    ↓
Database (Tenant.save())
    ↓ Validate room capacity
    ↓ Create Tenant record in core_tenant
    ↓ Create RoomOccupancy record
    ↓ Update Room.is_available
    ↓
Response
    ↓ Return serialized Tenant data
    ↓
Frontend
    ↓ Update state
    ↓ Refresh DataGrid
    ↓ Show success message
```

### 8.2 Login Authentication Flow

```
User Login Request
    ↓
Frontend: POST /api/auth/login/
    ↓ { username, password }
    ↓
Backend: views_auth.py - login_view()
    ↓ authenticate(username, password)
    ↓ Check User.is_active
    ↓
Django Auth
    ↓ Query: auth_user table
    ↓ Verify password hash
    ↓ Return User object
    ↓
UserProfile Lookup
    ↓ Query: core_userprofile
    ↓ Get role, phone_number, branch
    ↓
JWT Token Generation
    ↓ Create access token (30 min)
    ↓ Create refresh token (30 days)
    ↓
Response
    ↓ { access, refresh, user, profile }
    ↓
Frontend Storage
    ↓ localStorage.setItem('access', token)
    ↓ localStorage.setItem('refresh', token)
    ↓ UserContext.setUser(user)
    ↓ UserContext.setProfile(profile)
    ↓
Protected Routes
    ↓ All API requests include: Authorization: Bearer <token>
    ↓ JWT middleware validates token
    ↓ Sets request.user
    ↓ ViewSets filter data by role
```

### 8.3 Room Occupancy Calculation Flow

```
Request: GET /api/v2/branches/<id>/
    ↓
Backend: EnhancedBranchViewSet.retrieve()
    ↓ Query Branch by ID
    ↓
Serializer: BranchSerializer
    ↓ Serialize basic fields
    ↓
Compute Statistics (get_occupied_beds)
    ↓ SQL Query:
    ↓ SELECT COUNT(*)
    ↓ FROM core_tenant
    ↓ WHERE room.branch_id = <id>
    ↓   AND joining_date IS NOT NULL
    ↓   AND vacating_date IS NULL
    ↓
Compute Total Beds (get_total_beds)
    ↓ SQL Query:
    ↓ SELECT SUM(sharing_type)
    ↓ FROM core_room
    ↓ WHERE branch_id = <id>
    ↓
Calculate Vacancy Rate
    ↓ vacancy_rate = (total_beds - occupied_beds) / total_beds * 100
    ↓
Response
    ↓ {
    ↓   "id": 1,
    ↓   "name": "Main Branch",
    ↓   "total_rooms": 20,
    ↓   "total_beds": 60,
    ↓   "occupied_beds": 45,
    ↓   "vacant_beds": 15,
    ↓   "bed_occupancy_rate": 75.0
    ↓ }
```

---

## 9. Deployment Configuration

### 9.1 Development Setup

**Backend:**
```bash
cd hostel_admin_backend

# Activate virtual environment
source hostel_env/bin/activate  # Linux/Mac
hostel_env\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```bash
cd hostel-frontend-starter

# Install dependencies
npm install

# Start dev server
npm start  # Runs on http://localhost:3000
```

### 9.2 Environment Configuration

**Backend Settings:**
```python
Location: hostel_admin/settings.py

Development:
- DEBUG = True
- ALLOWED_HOSTS = []
- DATABASE: SQLite

Production (settings_production.py):
- DEBUG = False
- ALLOWED_HOSTS = ['your-domain.com']
- DATABASE: PostgreSQL
- STATIC_ROOT configured
- SECRET_KEY from environment variable
```

**Frontend Configuration:**
```javascript
Location: src/api.js

Development:
- baseURL: 'http://127.0.0.1:8000'

Production:
- baseURL: process.env.REACT_APP_API_URL or 'https://api.yourdomain.com'
```

### 9.3 Docker Deployment

**Files Available:**
- `hostel_admin_backend/Dockerfile`
- `hostel-frontend-starter/Dockerfile`
- `docker-compose.yml` (if created)

**Docker Commands:**
```bash
# Build images
docker build -t hostel-backend ./hostel_admin_backend
docker build -t hostel-frontend ./hostel-frontend-starter

# Run containers
docker run -p 8000:8000 hostel-backend
docker run -p 3000:3000 hostel-frontend
```

### 9.4 Database Migration to PostgreSQL

**Windows:**
```powershell
.\migrate_to_postgresql.ps1
```

**Linux/Mac:**
```bash
./migrate_to_postgresql.sh
```

**Manual PostgreSQL Setup:**
```python
# hostel_admin/settings_postgresql.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'hostel_db',
        'USER': 'hostel_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 9.5 Security Considerations

**Backend:**
- Use environment variables for SECRET_KEY, database passwords
- Enable CSRF protection in production
- Set SESSION_COOKIE_SECURE = True with HTTPS
- Use HTTPS for all API communication
- Regularly rotate JWT secrets
- Implement rate limiting on authentication endpoints

**Frontend:**
- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement proper CORS configuration
- Sanitize user inputs
- Use HTTPS only in production

### 9.6 Production Checklist

- [ ] Set DEBUG = False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use PostgreSQL database
- [ ] Set up proper SECRET_KEY
- [ ] Enable HTTPS
- [ ] Configure static file serving
- [ ] Set up logging
- [ ] Configure backup strategy for database
- [ ] Implement monitoring (e.g., Sentry)
- [ ] Set up CI/CD pipeline
- [ ] Configure Firebase production credentials
- [ ] Test all authentication flows
- [ ] Verify role-based access controls

---

## Appendix: File Reference Map

### Key Backend Files
| File | Purpose |
|------|---------|
| `core/models.py` | Database models (Branch, Room, Tenant, etc.) |
| `core/serializers.py` | API serializers |
| `core/views.py` | Legacy CRUD views |
| `core/views_enhanced.py` | Role-based CRUD views |
| `core/views_auth.py` | Authentication views |
| `core/views_firebase.py` | Firebase OTP authentication |
| `core/urls.py` | API URL routing |
| `core/firebase_auth.py` | Firebase configuration |
| `hostel_admin/settings.py` | Django settings |
| `hostel_admin/urls.py` | Main URL configuration |
| `requirements.txt` | Python dependencies |
| `db.sqlite3` | **TENANT DATA DATABASE** |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.js` | Main app component with routing |
| `src/api.js` | API helper functions |
| `src/contexts/UserContext.js` | Authentication state management |
| `src/config/routes.js` | Route configuration with RBAC |
| `src/components/LoginForm.js` | Username/password login |
| `src/components/BackendOTPLogin.js` | Phone OTP login |
| `src/components/ProtectedRoute.js` | Route protection |
| `src/components/SimpleTenants.js` | Tenant management UI |
| `src/components/Branches.js` | Branch management UI |
| `src/components/Rooms.js` | Room management UI |
| `src/api/axiosInstance.js` | Axios configuration with token refresh |

---

## Summary

### Tenant Data Storage:
✅ **Primary Location**: `hostel_admin_backend/db.sqlite3` → `core_tenant` table  
✅ **Django Model**: `core/models.py` → `Tenant` class  
✅ **API Access**: `/api/v2/tenants/` (role-filtered)  
✅ **Related Data**: Connected to Room, Branch, User, RoomOccupancy, RentPayment

### Authentication:
✅ **Method 1**: Username/Password → JWT tokens  
✅ **Method 2**: Firebase Phone OTP → JWT tokens  
✅ **Token Storage**: Frontend localStorage  
✅ **Token Validation**: Django REST Framework JWT middleware  
✅ **Token Refresh**: Automatic via axios interceptor  
✅ **Session Duration**: 30 minutes (access), 30 days (refresh)

### Role-Based Access:
✅ **Roles**: Admin, Owner, Warden, Tenant  
✅ **Storage**: `core_userprofile.role`  
✅ **Enforcement**: Backend ViewSets filter queries by role  
✅ **Frontend**: Routes protected, UI elements conditionally rendered  
✅ **Permissions**: Granular per-branch permissions available

---

**Last Updated**: January 16, 2026  
**Version**: 1.0  
**Maintainer**: Development Team
