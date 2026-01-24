# Sree Lakshmi Ladies Hostel - Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                      (React + Material-UI)                       │
│                     Port: 3000 (Development)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Login      │  │  Dashboard   │  │   Branches   │          │
│  │ Component    │  │  Component   │  │  Component   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                       │
│              ┌────────────▼────────────┐                         │
│              │   UserContext (State)   │                         │
│              │   - user, profile       │                         │
│              │   - JWT tokens          │                         │
│              └────────────┬────────────┘                         │
│                           │                                       │
│              ┌────────────▼────────────┐                         │
│              │   Axios Instance        │                         │
│              │   + Token Interceptor   │                         │
│              └────────────┬────────────┘                         │
│                           │                                       │
└───────────────────────────┼───────────────────────────────────────┘
                            │ HTTP/HTTPS
                            │ Authorization: Bearer <JWT>
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                        BACKEND LAYER                               │
│                   (Django REST Framework)                          │
│                      Port: 8000 (Development)                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    URL Router                               │  │
│  │  /api/auth/login/  →  views_auth.login_view()             │  │
│  │  /api/v2/tenants/  →  EnhancedTenantViewSet               │  │
│  │  /api/v2/branches/ →  EnhancedBranchViewSet               │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                       │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │               JWT Authentication Middleware                 │  │
│  │  - Validates JWT token                                      │  │
│  │  - Sets request.user                                        │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                       │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │                  ViewSets / Views                           │  │
│  │  - Permission checks (IsAuthenticated)                      │  │
│  │  - Role-based query filtering                               │  │
│  │  - Business logic                                            │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                       │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │                     Django ORM                               │  │
│  │  models.py: Branch, Room, Tenant, UserProfile              │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────────┘
                             │ SQL Queries
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                        DATABASE LAYER                               │
│                     SQLite / PostgreSQL                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  auth_user   │  │ core_branch  │  │  core_room   │             │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤             │
│  │ id           │  │ id           │  │ id           │             │
│  │ username     │  │ name         │  │ room_name    │             │
│  │ password     │  │ address      │  │ branch_id FK │             │
│  │ email        │  │ owner_id FK  │  │ sharing_type │             │
│  │ is_active    │  │ property_type│  │ rent         │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │              core_tenant (PRIMARY TENANT DATA)          │       │
│  ├─────────────────────────────────────────────────────────┤       │
│  │ id                                                       │       │
│  │ user_id (FK to auth_user) - Optional for tenant login  │       │
│  │ name                                                     │       │
│  │ phone_number                                             │       │
│  │ email                                                    │       │
│  │ address                                                  │       │
│  │ room_id (FK to core_room)                               │       │
│  │ joining_date                                             │       │
│  │ vacating_date                                            │       │
│  │ father_name, father_aadhar                              │       │
│  │ mother_name, mother_aadhar                              │       │
│  │ guardian_name, guardian_aadhar                          │       │
│  │ emergency_contact_name, emergency_contact_phone         │       │
│  │ id_proof_type, id_proof_number                          │       │
│  │ stay_type (daily/monthly)                               │       │
│  │ created_by (FK to auth_user)                            │       │
│  │ created_at, updated_at                                   │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                      │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ core_userprofile │  │core_roomoccupancy│ │ core_rentpayment │  │
│  ├──────────────────┤  ├─────────────────┤  ├──────────────────┤  │
│  │ id               │  │ room_id FK      │  │ tenant_id FK     │  │
│  │ user_id FK       │  │ tenant_id FK    │  │ payment_date     │  │
│  │ role (RBAC)      │  │ start_date      │  │ amount_paid      │  │
│  │ phone_number     │  │ end_date        │  │ for_month        │  │
│  │ firebase_uid     │  │ monthly_rent    │  │ payment_method   │  │
│  │ phone_verified   │  │ security_deposit│  │ collected_by FK  │  │
│  │ branch_id FK     │  └─────────────────┘  └──────────────────┘  │
│  │ business_name    │                                               │
│  │ is_active        │                                               │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Diagram

### Method 1: Username/Password Authentication

```
┌─────────────┐                                    ┌─────────────┐
│   Browser   │                                    │   Backend   │
│  (React)    │                                    │  (Django)   │
└──────┬──────┘                                    └──────┬──────┘
       │                                                   │
       │  1. POST /api/auth/login/                       │
       │     { username, password }                       │
       │─────────────────────────────────────────────────>│
       │                                                   │
       │                           2. authenticate(user)  │
       │                              Check password hash │
       │                              Query auth_user     │
       │                                                   │
       │                           3. Query UserProfile   │
       │                              Get role, branch    │
       │                                                   │
       │                           4. Generate JWT        │
       │                              - Access (30 min)   │
       │                              - Refresh (30 days) │
       │                                                   │
       │  5. Response: { access, refresh, user, profile }│
       │<─────────────────────────────────────────────────│
       │                                                   │
       │  6. Store in localStorage                        │
       │     - access token                               │
       │     - refresh token                              │
       │     - user data                                  │
       │                                                   │
       │  7. Subsequent API Requests                      │
       │     Header: Authorization: Bearer <access>       │
       │─────────────────────────────────────────────────>│
       │                                                   │
       │                           8. JWT Middleware      │
       │                              - Validate token    │
       │                              - Set request.user  │
       │                                                   │
       │  9. Filtered data based on role                  │
       │<─────────────────────────────────────────────────│
       │                                                   │
```

### Method 2: Firebase Phone OTP Authentication

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Backend   │                    │  Firebase   │
│  (React)    │                    │  (Django)   │                    │   Service   │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                   │                                   │
       │  1. POST /api/auth/send-otp/     │                                   │
       │     { phone_number }              │                                   │
       │──────────────────────────────────>│                                   │
       │                                   │                                   │
       │                      2. Validate phone format                         │
       │                      3. Generate session_info                         │
       │                         (Firebase triggers OTP)                       │
       │                                   │                                   │
       │  4. { session_info, message }    │                                   │
       │<──────────────────────────────────│                                   │
       │                                   │                                   │
       │                                   │  ---- Firebase sends SMS OTP ---->│
       │                                   │                                   │
       │  5. User receives OTP via SMS    │                                   │
       │     (e.g., 123456)                │                                   │
       │                                   │                                   │
       │  6. POST /api/auth/verify-otp/   │                                   │
       │     { phone_number, otp,          │                                   │
       │       session_info }              │                                   │
       │──────────────────────────────────>│                                   │
       │                                   │                                   │
       │                      7. Validate OTP (6 digits)                       │
       │                      8. Query UserProfile by phone                    │
       │                         OR create new User+Profile                    │
       │                      9. Generate JWT tokens                           │
       │                                   │                                   │
       │ 10. { access_token, refresh_token,│                                   │
       │      user, profile }              │                                   │
       │<──────────────────────────────────│                                   │
       │                                   │                                   │
       │ 11. Store tokens, navigate to     │                                   │
       │     dashboard                     │                                   │
       │                                   │                                   │
```

## Role-Based Data Access Flow

```
User Request: GET /api/v2/branches/
         │
         ├─> JWT Token Validated → request.user set
         │
    ┌────▼────┐
    │ UserRole│
    │  Check  │
    └────┬────┘
         │
    ┌────▼────────────────────────────────────────────────┐
    │                                                      │
    │   Admin Role       Owner Role      Warden Role      │
    │   ↓                ↓                ↓                │
    │   All branches     owned_branches   assigned_branches│
    │   No filter        .filter(         .filter(         │
    │                    owner=user)      warden            │
    │                                     assignments)      │
    │                                                      │
    └────┬────────────────┬───────────────┬────────────────┘
         │                │               │
         ├────────────────┼───────────────┘
         │
    ┌────▼────┐
    │Database │
    │ Query   │
    │Execution│
    └────┬────┘
         │
    ┌────▼────┐
    │Serialize│
    │  Data   │
    └────┬────┘
         │
    ┌────▼────┐
    │ Return  │
    │  JSON   │
    └─────────┘
```

## Data Relationships

```
                     ┌─────────────┐
                     │  auth_user  │
                     │  (Django)   │
                     └──────┬──────┘
                            │
                            │ OneToOne
                            │
                     ┌──────▼─────────┐
          ┌──────────┤ core_userprofile│◄─────────┐
          │          │   role: RBAC    │          │
          │          └──────┬──────────┘          │
          │                 │                      │
          │ owner (FK)      │ branch (FK)         │ warden (FK)
          │                 │ (for wardens)        │
          │                 │                      │
    ┌─────▼─────┐    ┌──────▼──────┐      ┌───────▼────────┐
    │core_branch│    │             │      │core_warden     │
    │           │    │             │      │assignment      │
    │- name     │    │             │      │                │
    │- address  │    │             │      │- can_manage_*  │
    │- owner_id │    │             │      └────────────────┘
    └─────┬─────┘    │             │
          │          │             │
          │ branch   │             │
          │  (FK)    │             │
          │          │             │
    ┌─────▼─────┐    │             │      ┌────────────────┐
    │core_room  │    │             │      │core_tenant     │
    │           │    │             │      │  request       │
    │- room_name│    │             │      │                │
    │- sharing  │    │             │      │- request_type  │
    │- rent     │◄───┼─────────────┼──────┤- status        │
    └─────┬─────┘    │             │      │- priority      │
          │          │             │      └────────────────┘
          │ room     │             │
          │  (FK)    │             │
          │          │             │
    ┌─────▼──────────────────────┐ │
    │     core_tenant             │ │
    │     (PRIMARY STORAGE)       │ │
    │                             │ │
    │ - name                      │ │
    │ - phone_number              │ │
    │ - room_id (FK)              │ │
    │ - user_id (FK) [optional]   │ │
    │ - joining_date              │ │
    │ - vacating_date             │ │
    │ - family info (6 fields)    │ │
    │ - emergency contacts        │ │
    │ - id_proof info             │ │
    │ - created_by (FK)           │ │
    └─────┬──────────┬────────────┘ │
          │          │               │
          │tenant(FK)│ tenant (FK)   │
          │          │               │
    ┌─────▼──────┐ ┌─▼──────────┐   │
    │core_room   │ │core_rent   │   │
    │occupancy   │ │payment     │   │
    │            │ │            │   │
    │- room_id   │ │- amount    │   │
    │- start_date│ │- for_month │   │
    │- end_date  │ │- method    │   │
    │- rent      │ │- collected │   │
    │- deposit   │ │  _by (FK)  │   │
    └────────────┘ └────────────┘   │
                                     │
             ┌───────────────────────┘
             │
    ┌────────▼────────┐
    │core_branch      │
    │permission       │
    │                 │
    │- user_id (FK)   │
    │- branch_id (FK) │
    │- can_view_*     │
    │- can_manage_*   │
    └─────────────────┘
```

## Component Interaction Flow

```
┌────────────────────────────────────────────────────────────┐
│                    App.js (Root)                            │
│  - BrowserRouter                                            │
│  - UserProvider (Context)                                   │
│  - AppBar with Navigation                                   │
│  - Sidebar with role-filtered menu                          │
└────────────┬───────────────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │  React Router   │
    │    <Routes>     │
    └────────┬────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │         Route Configuration                │
    │         (config/routes.js)                 │
    │                                             │
    │  Public Routes:                             │
    │    / → LoginPage                            │
    │    /login → LoginPage                       │
    │                                             │
    │  Protected Routes:                          │
    │    /dashboard → ConditionalDashboard        │
    │    /branches → Branches (owner, admin)      │
    │    /rooms → Rooms (owner, warden, admin)    │
    │    /tenants → SimpleTenants (owner, warden) │
    │    /user-management → UserManagement (admin)│
    └────────┬──────────────────────────────────┘
             │
    ┌────────▼────────┐
    │ ProtectedRoute  │
    │   Wrapper       │
    │                 │
    │ - Check auth    │
    │ - Check role    │
    │ - Allow/Deny    │
    └────────┬────────┘
             │
             │ If authorized
             │
    ┌────────▼──────────────────────────────────┐
    │        Component Renders                   │
    │                                             │
    │  Example: SimpleTenants.js                 │
    │    1. useEffect → API call                 │
    │    2. enhancedAPI.tenants.list()           │
    │    3. Update state                         │
    │    4. Render MUI DataGrid                  │
    │    5. User interactions:                   │
    │       - Add → Dialog → POST /api/v2/tenants│
    │       - Edit → Dialog → PUT /api/v2/tenants│
    │       - Delete → Confirm → DELETE          │
    │    6. Real-time data refresh                │
    └────────────────────────────────────────────┘
```

## File System Layout

```
Project Root
│
├── hostel_admin_backend/              (Django Backend)
│   ├── db.sqlite3                     ⭐ PRIMARY DATA STORAGE
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── RBAC_README.md
│   ├── 2FA_IMPLEMENTATION_GUIDE.md
│   │
│   ├── hostel_admin/                  (Django Project Settings)
│   │   ├── settings.py                ⭐ Main configuration
│   │   ├── settings_production.py
│   │   ├── settings_postgresql.py
│   │   ├── urls.py                    ⭐ Root URL routing
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── core/                          (Main Django App)
│   │   ├── models.py                  ⭐ Database models (Tenant, Branch, Room)
│   │   ├── serializers.py             ⭐ API serializers
│   │   ├── views.py                   ⭐ Legacy CRUD views
│   │   ├── views_enhanced.py          ⭐ Role-based views
│   │   ├── views_auth.py              ⭐ Authentication endpoints
│   │   ├── views_firebase.py          ⭐ Firebase OTP authentication
│   │   ├── firebase_auth.py           ⭐ Firebase configuration
│   │   ├── urls.py                    ⭐ App URL routing
│   │   ├── permissions.py             Role-based permissions
│   │   ├── admin.py                   Django admin config
│   │   ├── tests.py
│   │   │
│   │   ├── migrations/                Database migrations
│   │   │   ├── 0001_initial.py
│   │   │   ├── 0002_add_family_info_to_tenant.py
│   │   │   └── ...
│   │   │
│   │   └── management/                Custom Django commands
│   │       └── commands/
│   │
│   └── hostel_env/                    Python virtual environment
│
└── hostel-frontend-starter/           (React Frontend)
    ├── package.json
    ├── Dockerfile
    │
    ├── public/
    │   └── index.html
    │
    └── src/
        ├── index.js                   React entry point
        ├── App.js                     ⭐ Main component
        ├── api.js                     ⭐ API helper functions
        │
        ├── api/
        │   ├── axios.js
        │   └── axiosInstance.js       ⭐ Axios with token refresh
        │
        ├── contexts/
        │   └── UserContext.js         ⭐ Authentication state
        │
        ├── config/
        │   └── routes.js              ⭐ Route configuration with RBAC
        │
        ├── components/
        │   ├── LoginForm.js           Username/password login
        │   ├── BackendOTPLogin.js     ⭐ Phone OTP login
        │   ├── ProtectedRoute.js      ⭐ Route guard
        │   ├── ConditionalDashboard.js Role-based dashboard
        │   ├── Branches.js            Branch management
        │   ├── Rooms.js               Room management
        │   ├── SimpleTenants.js       ⭐ Tenant management
        │   ├── RoomStatus.js          Occupancy display
        │   ├── UserManagement.js      User CRUD
        │   └── Profile.js             User profile
        │
        ├── pages/
        │   └── LoginPage.js           Login page container
        │
        └── hooks/
            └── ...                    Custom React hooks
```

---

**Legend:**
- ⭐ = Critical file for understanding system flow
- (FK) = Foreign Key relationship
- → = Data/Control flow direction

