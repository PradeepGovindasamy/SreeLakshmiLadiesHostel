# 🏢 Sree Lakshmi Ladies Hostel - Complete Project Specification

**Version:** 2.0  
**Date:** April 4, 2026  
**Status:** Production-Ready with AI Enhancement Recommendations

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [Backend API Documentation](#backend-api-documentation)
5. [Frontend Architecture](#frontend-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Deployment Architecture](#deployment-architecture)
8. [Expert Recommendations](#expert-recommendations)
9. [AI Integration Roadmap](#ai-integration-roadmap)
10. [Development Priorities](#development-priorities)

---

## 1. Project Overview

### Purpose
A comprehensive multi-tenant hostel management system designed for property owners to manage multiple branches, rooms, tenants, staff, and operations with role-based access control.

### Key Features
- ✅ Multi-branch property management
- ✅ Room allocation and occupancy tracking
- ✅ Tenant lifecycle management (onboarding to checkout)
- ✅ Rent payment tracking with multiple payment methods
- ✅ Worker/Staff management with attendance tracking
- ✅ Grocery inventory and purchase management
- ✅ Machine/Equipment maintenance tracking
- ✅ Role-based access control (Owner, Warden, Tenant, Admin)
- ✅ Real-time occupancy statistics
- ✅ Password reset via email
- ✅ Responsive Material-UI frontend

### User Roles

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **Owner** | Full access to owned properties | Create branches, manage all rooms/tenants, assign wardens, view all reports |
| **Warden** | Branch-specific access | Manage assigned branch operations, collect payments (if permitted) |
| **Tenant** | Self-service access | View profile, payment history, submit requests |
| **Admin** | System-wide access | Superuser - all operations across system |

---

## 2. Technology Stack

### Backend
```yaml
Language: Python 3.11+
Framework: Django 5.2.5
API Framework: Django REST Framework 3.14+
Authentication: JWT (djangorestframework-simplejwt)
Database ORM: Django ORM
Task Queue: (Recommended: Celery - not yet implemented)
```

**Key Dependencies:**
- `django-cors-headers` - CORS support
- `django-filter` - Advanced filtering
- `python-decouple` - Environment variable management
- `psycopg2` - PostgreSQL adapter
- `dj-database-url` - Database URL parsing

### Frontend
```yaml
Library: React 18.2.0
Language: JavaScript (ES6+)
UI Framework: Material-UI (MUI) 7.1.2
Routing: React Router DOM 6.22.3
HTTP Client: Axios 1.6.0
State Management: React Context API + Local State
Date Library: Day.js 1.11.13
Data Grid: MUI X Data Grid 8.6.0
```

### Database
```yaml
Primary: PostgreSQL 15 (Production)
Fallback: SQLite 3 (Development)
Cache: Redis 7 (Configured, usage minimal)
```

### Infrastructure
```yaml
Containerization: Docker + Docker Compose
Web Server: Nginx (Production)
Reverse Proxy: Nginx
Port Mapping:
  - Frontend: 80 (production) / 3000 (dev)
  - Backend: 8000
  - PostgreSQL: 5433:5432
  - Redis: 6379
```

---

## 3. Database Architecture

### Core Models (13 Tables)

#### 3.1 User & Authentication Models

**`auth_user` (Django Built-in)**
```sql
- id (PK)
- username (UNIQUE, NOT NULL) -- Primary identifier
- email (Optional, not unique)
- password (Hashed)
- first_name
- last_name
- is_active
- is_staff
- is_superuser
- date_joined
- last_login
```

**`core_userprofile`**
```sql
- id (PK)
- user_id (FK → auth_user, OneToOne) 
- role (ENUM: owner, warden, tenant, admin)
- phone_number
- firebase_uid (UNIQUE, Optional)
- phone_verified (Boolean)
- business_name (For owners)
- business_license (For owners)
- branch_id (FK → core_branch, Optional - Legacy)
- is_active
- created_at
- updated_at
```

#### 3.2 Property Management Models

**`core_branch`** (Properties/Hostels)
```sql
- id (PK)
- name
- address
- city
- state
- pincode
- description
- contact_phone
- contact_email
- emergency_contact
- property_type (ENUM: ladies_hostel, mens_hostel, mixed_hostel, guest_house, pg)
- total_floors
- num_rooms
- num_bathrooms
- has_parking, has_wifi, has_ac, has_laundry, has_security, has_mess (Booleans)
- amenities (Text)
- rules_and_regulations (Text)
- nearby_facilities (Text)
- established_date
- established_year
- license_number
- notes
- is_active
- owner_id (FK → auth_user) -- CASCADE delete issue
- created_at
- updated_at

INDEX: owner_id
UNIQUE: None (allows duplicate names)
```

**`core_room`**
```sql
- id (PK)
- branch_id (FK → core_branch, CASCADE)
- room_name
- sharing_type (1-8 sharing choices)
- attached_bath (Boolean)
- ac_room (Boolean)
- rent (Decimal 8,2)
- floor_number
- room_size_sqft
- is_available (Boolean) -- Not auto-updated based on occupancy
- created_at
- updated_at

UNIQUE: (branch_id, room_name)
INDEX: branch_id
COMPUTED PROPERTIES:
  - current_occupancy (Count of active tenants)
  - is_full (Boolean)
  - status (available/occupied/maintenance)
```

#### 3.3 Tenant Management Models

**`core_tenant`**
```sql
- id (PK)
- user_id (FK → auth_user, SET_NULL, Optional) -- For tenant login
- name
- address
- phone_number
- email
- emergency_contact_name
- emergency_contact_phone
- father_name, father_aadhar (Family info)
- mother_name, mother_aadhar
- guardian_name, guardian_aadhar
- stay_type (ENUM: daily, monthly)
- joining_date
- vacating_date (NULL = active tenant)
- room_id (FK → core_room, SET_NULL)
- id_proof_type (ENUM: aadhar, voter_id, driving_license, passport, pan_card)
- id_proof_number
- created_by_id (FK → auth_user, SET_NULL)
- created_at
- updated_at

INDEXES:
  - tenant_active_idx: (vacating_date, joining_date)
  - tenant_vacated_idx: (-vacating_date)  
  - tenant_room_status_idx: (room_id, vacating_date)
  - tenant_search_idx: (name, phone_number)

VALIDATION:
  - Room capacity check on save
  - Auto-update RoomOccupancy on save/delete
```

**`core_roomoccupancy`**
```sql
- id (PK)
- room_id (FK → core_room, CASCADE)
- tenant_id (FK → core_tenant, CASCADE)
- start_date
- end_date (NULL = current occupancy)
- monthly_rent_agreed (Decimal 8,2)
- security_deposit (Decimal 8,2)
- created_at
- created_by_id (FK → auth_user, SET_NULL)

UNIQUE: (room_id, tenant_id, start_date)
ORDER BY: -start_date
```

#### 3.4 Financial Models

**`core_rentpayment`**
```sql
- id (PK)
- tenant_id (FK → core_tenant, CASCADE)
- payment_date
- amount_paid (Decimal 8,2)
- for_month (Date - month for which rent was paid)
- payment_method (ENUM: cash, bank_transfer, upi, card, cheque)
- reference_number
- notes
- collected_by_id (FK → auth_user, SET_NULL)
- created_at

UNIQUE: (tenant_id, for_month) -- One payment per month
ORDER BY: -payment_date
```

#### 3.5 Access Control Models

**`core_wardenassignment`**
```sql
- id (PK)
- warden_id (FK → auth_user, CASCADE)
- branch_id (FK → core_branch, CASCADE)
- assigned_by_id (FK → auth_user, CASCADE)
- assigned_date
- is_active (Boolean)
- can_manage_rooms (Boolean)
- can_manage_tenants (Boolean)
- can_view_payments (Boolean)
- can_collect_payments (Boolean)
- notes

UNIQUE: (warden_id, branch_id)
ORDER BY: -assigned_date
```

**`core_branchpermission`** (Granular permissions)
```sql
- id (PK)
- user_id (FK → auth_user, CASCADE)
- branch_id (FK → core_branch, CASCADE)
- can_view (Boolean)
- can_edit (Boolean)
- can_delete (Boolean)
- can_manage_rooms (Boolean)
- can_manage_tenants (Boolean)
- can_view_payments (Boolean)
- can_manage_payments (Boolean)
- created_at
- updated_at
```

#### 3.6 Service Request Models

**`core_tenantrequest`**
```sql
- id (PK)
- tenant_id (FK → core_tenant, CASCADE)
- request_type (ENUM: maintenance, complaint, service, payment, other)
- title
- description (Text)
- priority (ENUM: low, medium, high, urgent)
- status (ENUM: open, in_progress, resolved, closed)
- assigned_to_id (FK → auth_user, SET_NULL)
- response_notes (Text)
- resolution_date
- created_at
- updated_at

ORDER BY: -created_at
```

---

### Staff Management Module (workers app)

**`workers_worker`**
```sql
- id (PK)
- name
- phone_number
- email
- address
- date_of_birth
- id_proof_type
- id_proof_number
- worker_type (ENUM: caretaker, cleaning, security, cook, maintenance, manager, other)
- employment_type (ENUM: full_time, part_time, contract)
- branch_id (FK → core_branch, CASCADE)
- joining_date
- leaving_date
- salary (Decimal 10,2)
- salary_frequency (ENUM: monthly, daily, hourly)
- status (ENUM: active, on_leave, resigned, terminated)
- emergency_contact_name
- emergency_contact_phone
- emergency_contact_relation
- photo (ImageField)
- notes
- created_by_id (FK → auth_user, SET_NULL)
- created_at
- updated_at

INDEXES:
  - (branch_id, status)
  - worker_type
```

**`workers_workerattendance`**
```sql
- id (PK)
- worker_id (FK → workers_worker, CASCADE)
- date
- status (ENUM: present, absent, half_day, leave)
- check_in_time
- check_out_time
- notes
- marked_by_id (FK → auth_user, SET_NULL)
- created_at

UNIQUE: (worker_id, date)
```

**`workers_workersalary`**
```sql
- id (PK)
- worker_id (FK → workers_worker, CASCADE)
- month (Date)
- amount_paid (Decimal 10,2)
- payment_date
- payment_mode
- notes
- paid_by_id (FK → auth_user, SET_NULL)
- created_at
```

**`workers_workerleave`**
```sql
- id (PK)
- worker_id (FK → workers_worker, CASCADE)
- leave_type (ENUM: sick, casual, earned)
- start_date
- end_date
- days_count
- reason
- status (ENUM: pending, approved, rejected)
- approved_by_id (FK → auth_user, SET_NULL)
- created_at
```

---

### Grocery Management Module (groceries app)

**`groceries_grocerycategory`**
```sql
- id (PK)
- name (UNIQUE)
- description
- created_at
- updated_at
```

**`groceries_groceryitem`**
```sql
- id (PK)
- name
- category_id (FK → groceries_grocerycategory, SET_NULL)
- description
- unit (ENUM: kg, g, l, ml, piece, packet, bag, bottle, box)
- min_stock_level (Decimal 10,2)
- avg_price_per_unit (Decimal 10,2)
- is_active (Boolean)
- created_at
- updated_at

INDEX: (name, is_active)
```

**`groceries_vendor`**
```sql
- id (PK)
- name
- contact_person
- phone_number
- alternate_phone
- email
- address
- gstin (GST Number)
- pan_number
- payment_terms
- is_active
- notes
- created_at
- updated_at
```

**`groceries_grocerystock`**
```sql
- id (PK)
- branch_id (FK → core_branch, CASCADE)
- item_id (FK → groceries_groceryitem, CASCADE)
- quantity (Decimal 10,2)
- last_restocked
- updated_at

UNIQUE: (branch_id, item_id)
```

**`groceries_grocerypurchase`**
```sql
- id (PK)
- branch_id (FK → core_branch, CASCADE)
- vendor_id (FK → groceries_vendor, SET_NULL)
- purchase_date
- invoice_number
- total_amount (Decimal 10,2)
- payment_status (ENUM: pending, partial, paid)
- payment_mode
- notes
- created_by_id (FK → auth_user, SET_NULL)
- created_at
```

**`groceries_grocerypurchaseitem`**
```sql
- id (PK)
- purchase_id (FK → groceries_grocerypurchase, CASCADE)
- item_id (FK → groceries_groceryitem, CASCADE)
- quantity (Decimal 10,2)
- unit_price (Decimal 10,2)
- total_price (Decimal 10,2)
```

**`groceries_groceryconsumption`**
```sql
- id (PK)
- branch_id (FK → core_branch, CASCADE)
- item_id (FK → groceries_groceryitem, CASCADE)
- quantity_used (Decimal 10,2)
- consumption_date
- purpose
- recorded_by_id (FK → auth_user, SET_NULL)
- created_at
```

---

### Machine Management Module (machines app)

**`machines_machinecategory`**
```sql
- id (PK)
- name (UNIQUE)
- description
- created_at
- updated_at
```

**`machines_machine`**
```sql
- id (PK)
- name
- category_id (FK → machines_machinecategory, SET_NULL)
- branch_id (FK → core_branch, CASCADE)
- brand
- model_number
- serial_number (UNIQUE)
- location (Room/Floor/Area)
- purchase_date
- purchase_price (Decimal 10,2)
- vendor
- warranty_start_date
- warranty_end_date
- warranty_terms
- status (ENUM: operational, under_maintenance, out_of_order, retired)
- condition (ENUM: excellent, good, fair, poor)
- specifications (Text)
- capacity (e.g., 7kg for washing machine)
- power_rating (e.g., 1500W)
- last_service_date
- next_service_date
- service_frequency_days (Default: 90)
- photo (ImageField)
- manual_document (FileField)
- notes
- created_by_id (FK → auth_user, SET_NULL)
- created_at
- updated_at

INDEXES:
  - (branch_id, status)
  - (category_id, status)

COMPUTED PROPERTY:
  - is_under_warranty (Boolean)
```

**`machines_maintenancerecord`**
```sql
- id (PK)
- machine_id (FK → machines_machine, CASCADE)
- maintenance_type (ENUM: preventive, corrective, emergency)
- description
- cost (Decimal 10,2)
- performed_by (Technician/Company name)
- performed_date
- next_due_date
- notes
- created_by_id (FK → auth_user, SET_NULL)
- created_at
```

**`machines_machineissue`**
```sql
- id (PK)
- machine_id (FK → machines_machine, CASCADE)
- issue_title
- description
- severity (ENUM: low, medium, high, critical)
- status (ENUM: reported, in_progress, resolved, closed)
- reported_by_id (FK → auth_user, SET_NULL)
- assigned_to
- resolution_notes
- reported_date
- resolved_date
- created_at
```

**`machines_machineusagelog`**
```sql
- id (PK)
- machine_id (FK → machines_machine, CASCADE)
- usage_date
- usage_hours (Decimal 5,2)
- used_by (Optional: tenant/staff identifier)
- notes
- recorded_by_id (FK → auth_user, SET_NULL)
- created_at
```

---

### Database Relationships Summary

```
auth_user (1) ←→ (1) core_userprofile
auth_user (1) ←→ (N) core_branch [as owner]
auth_user (1) ←→ (N) core_wardenassignment [as warden]
auth_user (1) ←→ (1) core_tenant [optional, for tenant login]

core_branch (1) ←→ (N) core_room
core_branch (1) ←→ (N) workers_worker
core_branch (1) ←→ (N) machines_machine
core_branch (1) ←→ (N) groceries_grocerystock

core_room (1) ←→ (N) core_tenant
core_room (1) ←→ (N) core_roomoccupancy

core_tenant (1) ←→ (N) core_rentpayment
core_tenant (1) ←→ (N) core_tenantrequest
core_tenant (1) ←→ (N) core_roomoccupancy

workers_worker (1) ←→ (N) workers_workerattendance
workers_worker (1) ←→ (N) workers_workersalary

groceries_groceryitem (1) ←→ (N) groceries_grocerystock
groceries_grocerypurchase (1) ←→ (N) groceries_grocerypurchaseitem

machines_machine (1) ←→ (N) machines_maintenancerecord
machines_machine (1) ←→ (N) machines_machineissue
```

---

## 4. Backend API Documentation

### Base URL
- **Development:** `http://localhost:8000/api/`
- **Production:** `https://yourdomain.com/api/`

### API Versioning
- **Legacy (v1):** `/api/` - Original endpoints (backward compatible)
- **Enhanced (v2):** `/api/v2/` - Role-based filtered endpoints

---

### 4.1 Authentication Endpoints

#### Register User
```http
POST /api/users/create/
POST /api/users/create_with_profile/

Request Body:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "profile": {
    "role": "owner",  // owner, warden, tenant, admin
    "phone_number": "9876543210",
    "business_name": "XYZ Hostels",
    "business_license": "LIC12345"
  }
}

Response: 201 Created
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "profile": {
    "id": 1,
    "role": "owner",
    "role_display": "Property Owner",
    "phone_number": "9876543210",
    "business_name": "XYZ Hostels",
    "is_active": true
  },
  "message": "User created successfully"
}
```

#### Login
```http
POST /api/auth/login/
POST /api/token/  (Legacy)

Request Body:
{
  "username": "john_doe",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",  // Valid for 2 hours
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",  // Valid for 30 days
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "profile": {
    "role": "owner",
    "role_display": "Property Owner",
    "phone_number": "9876543210",
    "branch_id": null,
    "branch_name": null
  }
}
```

#### Refresh Token
```http
POST /api/token/refresh/

Request Body:
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response: 200 OK
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."  // New access token
}
```

#### Get Current User
```http
GET /api/auth/user/

Headers:
Authorization: Bearer <access_token>

Response: 200 OK
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "date_joined": "2026-01-15T10:30:00Z"
}
```

#### Get User Profile
```http
GET /api/auth/profile/

Headers:
Authorization: Bearer <access_token>

Response: 200 OK
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
  "phone_number": "9876543210",
  "business_name": "XYZ Hostels",
  "business_license": "LIC12345",
  "is_active": true,
  "created_at": "2026-01-15T10:30:00Z"
}
```

#### Update Profile
```http
PUT /api/auth/profile/
PATCH /api/auth/profile/

Request Body:
{
  "phone_number": "9876543211",
  "business_name": "Updated Business Name"
}

Response: 200 OK
```

#### Get Available Branches (Role-filtered)
```http
GET /api/auth/branches/

Headers:
Authorization: Bearer <access_token>

Response: 200 OK
[
  {
    "id": 1,
    "name": "Main Branch - Chennai",
    "address": "123 Main St",
    "can_manage": true  // Based on user role
  },
  {
    "id": 2,
    "name": "Branch 2 - Bangalore",
    "address": "456 MG Road",
    "can_manage": false  // Warden assigned but no edit permission
  }
]
```

#### Password Reset Request
```http
POST /api/auth/password-reset/

Request Body:
{
  "email": "john@example.com"
}

Response: 200 OK
{
  "message": "Password reset email sent"
}
```

#### Password Reset Confirm
```http
POST /api/auth/password-reset/confirm/

Request Body:
{
  "uid": "encoded_user_id",
  "token": "reset_token",
  "new_password": "NewSecurePass123"
}

Response: 200 OK
{
  "message": "Password reset successful"
}
```

---

### 4.2 Branch Management APIs

#### List Branches (v2 - Role-filtered)
```http
GET /api/v2/branches/

Query Parameters:
- page=1
- page_size=25
- search=<name/city>
- property_type=ladies_hostel
- is_active=true

Headers:
Authorization: Bearer <access_token>

Response: 200 OK
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Main Ladies Hostel",
      "address": "123 Main St, T.Nagar",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600017",
      "property_type": "ladies_hostel",
      "total_floors": 3,
      "num_rooms": 25,
      "contact_phone": "9876543210",
      "contact_email": "contact@hostel.com",
      "has_wifi": true,
      "has_ac": true,
      "has_mess": true,
      "owner": {
        "id": 1,
        "username": "john_doe",
        "full_name": "John Doe"
      },
      "is_active": true,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-04-04T10:30:00Z"
    }
  ]
}
```

#### Get Branch Detail
```http
GET /api/v2/branches/{id}/

Response: 200 OK
{
  "id": 1,
  "name": "Main Ladies Hostel",
  "address": "123 Main St, T.Nagar",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "pincode": "600017",
  "description": "Premium ladies hostel with modern amenities",
  "contact_phone": "9876543210",
  "contact_email": "contact@hostel.com",
  "emergency_contact": "9876543211",
  "property_type": "ladies_hostel",
  "total_floors": 3,
  "num_rooms": 25,
  "num_bathrooms": 30,
  "has_parking": true,
  "has_wifi": true,
  "has_ac": true,
  "has_laundry": true,
  "has_security": true,
  "has_mess": true,
  "amenities": "24/7 security, WiFi, AC, Laundry, Mess",
  "rules_and_regulations": "No visitors after 9 PM, curfew at 10 PM",
  "nearby_facilities": "Metro station - 5 min walk, Shopping mall - 10 min",
  "established_date": "2020-01-15",
  "established_year": 2020,
  "license_number": "HOSTEL-2020-001",
  "owner": {
    "id": 1,
    "username": "john_doe",
    "full_name": "John Doe"
  },
  "room_count": 25,
  "occupied_rooms": 18,
  "available_rooms": 7,
  "total_beds": 75,
  "occupied_beds": 52,
  "occupancy_percentage": 69.33,
  "is_active": true
}
```

#### Create Branch
```http
POST /api/v2/branches/

Request Body:
{
  "name": "New Branch - Bangalore",
  "address": "456 MG Road, Indiranagar",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560038",
  "contact_phone": "9876543210",
  "property_type": "ladies_hostel",
  "total_floors": 2,
  "num_rooms": 15,
  "has_wifi": true,
  "has_ac": false,
  "has_mess": true
}

Response: 201 Created
{
  "id": 2,
  "name": "New Branch - Bangalore",
  ...
  "owner": {
    "id": 1,
    "username": "john_doe"
  }
}
```

#### Update Branch
```http
PUT /api/v2/branches/{id}/
PATCH /api/v2/branches/{id}/  (Partial update)

Request Body:
{
  "num_rooms": 20,
  "has_ac": true
}

Response: 200 OK
```

#### Delete Branch
```http
DELETE /api/v2/branches/{id}/

Response: 204 No Content

Note: Will CASCADE delete all related rooms, tenants, etc. (RISK!)
```

#### Get Branch Rooms
```http
GET /api/v2/branches/{id}/rooms/

Response: 200 OK
[
  {
    "id": 1,
    "room_name": "101",
    "sharing_type": 3,
    "current_occupancy": 2,
    "status": "available",
    "rent": 5000.00
  }
]
```

#### Get Branch Tenants
```http
GET /api/v2/branches/{id}/tenants/

Query Parameters:
- status=active (active/vacated/pending)

Response: 200 OK
```

#### Get Branch Occupancy Stats
```http
GET /api/v2/branches/{id}/occupancy_stats/

Response: 200 OK
{
  "branch_id": 1,
  "branch_name": "Main Ladies Hostel",
  "total_rooms": 25,
  "occupied_rooms": 18,
  "available_rooms": 7,
  "maintenance_rooms": 0,
  "total_beds": 75,
  "occupied_beds": 52,
  "available_beds": 23,
  "occupancy_rate": 69.33,
  "revenue_potential": 375000.00,
  "current_revenue": 260000.00
}
```

---

### 4.3 Room Management APIs

#### List Rooms (v2 - Role-filtered)
```http
GET /api/v2/rooms/

Query Parameters:
- page=1
- page_size=25
- branch=<branch_id>
- status=available  (available/occupied/maintenance)
- sharing_type=3
- floor_number=1
- attached_bath=true
- ac_room=true
- min_rent=5000
- max_rent=10000

Response: 200 OK
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "branch": {
        "id": 1,
        "name": "Main Branch"
      },
      "room_name": "101",
      "sharing_type": 3,
      "sharing_type_display": "3-Sharing",
      "attached_bath": true,
      "ac_room": false,
      "rent": 5000.00,
      "floor_number": 1,
      "room_size_sqft": 150,
      "is_available": true,
      "current_occupancy": 2,
      "status": "available",  // available/occupied/maintenance
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Room Detail
```http
GET /api/v2/rooms/{id}/

Response: 200 OK
{
  "id": 1,
  "branch": {
    "id": 1,
    "name": "Main Branch",
    "city": "Chennai"
  },
  "room_name": "101",
  "sharing_type": 3,
  "sharing_type_display": "3-Sharing",
  "attached_bath": true,
  "ac_room": false,
  "rent": 5000.00,
  "floor_number": 1,
  "room_size_sqft": 150,
  "is_available": true,
  "current_occupancy": 2,
  "max_capacity": 3,
  "available_beds": 1,
  "status": "available",
  "tenants": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "phone_number": "9876543210",
      "joining_date": "2026-01-15"
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "phone_number": "9876543211",
      "joining_date": "2026-02-01"
    }
  ],
  "created_at": "2026-01-15T10:30:00Z"
}
```

#### Create Room
```http
POST /api/v2/rooms/

Request Body:
{
  "branch": 1,
  "room_name": "201",
  "sharing_type": 4,
  "attached_bath": true,
  "ac_room": true,
  "rent": 7000.00,
  "floor_number": 2,
  "room_size_sqft": 180
}

Response: 201 Created
```

#### Update Room
```http
PUT /api/v2/rooms/{id}/
PATCH /api/v2/rooms/{id}/

Request Body:
{
  "rent": 7500.00,
  "is_available": false  // Mark for maintenance
}

Response: 200 OK
```

#### Delete Room
```http
DELETE /api/v2/rooms/{id}/

Response: 204 No Content

Note: Only if no active tenants
```

#### Get Room Tenants
```http
GET /api/v2/rooms/{id}/tenants/

Response: 200 OK
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "phone_number": "9876543210",
    "joining_date": "2026-01-15",
    "stay_type": "monthly",
    "status": "active"
  }
]
```

#### Check Room Availability
```http
GET /api/v2/rooms/{id}/availability/

Response: 200 OK
{
  "room_id": 1,
  "room_name": "101",
  "sharing_type": 3,
  "current_occupancy": 2,
  "available_beds": 1,
  "is_full": false,
  "status": "available"
}
```

---

### 4.4 Tenant Management APIs

#### List Tenants (v2 - Role-filtered)
```http
GET /api/v2/tenants/

Query Parameters:
- page=1
- page_size=25
- status=active  (active/vacated/pending)
- branch=<branch_id>
- room=<room_id>
- search=<name/phone>
- stay_type=monthly
- joining_date_from=2026-01-01
- joining_date_to=2026-03-31

Response: 200 OK
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "user": null,  // Optional user account
      "name": "Alice Johnson",
      "phone_number": "9876543210",
      "email": "alice@example.com",
      "address": "123 Home St, Chennai",
      "emergency_contact_name": "John Johnson",
      "emergency_contact_phone": "9876543211",
      "stay_type": "monthly",
      "joining_date": "2026-01-15",
      "vacating_date": null,  // null = active tenant
      "room": {
        "id": 1,
        "room_name": "101",
        "branch": {
          "id": 1,
          "name": "Main Branch"
        },
        "rent": 5000.00
      },
      "id_proof_type": "aadhar",
      "id_proof_number": "1234-5678-9012",
      "status": "active",  // Computed: active/vacated/pending
      "created_by": {
        "id": 1,
        "username": "john_doe"
      },
      "created_at": "2026-01-10T10:30:00Z"
    }
  ]
}
```

#### Get Tenant Detail
```http
GET /api/v2/tenants/{id}/

Response: 200 OK
{
  "id": 1,
  "user": null,
  "name": "Alice Johnson",
  "phone_number": "9876543210",
  "email": "alice@example.com",
  "address": "123 Home St, Chennai",
  "emergency_contact_name": "John Johnson",
  "emergency_contact_phone": "9876543211",
  "father_name": "Robert Johnson",
  "father_aadhar": "1234-5678-9013",
  "mother_name": "Mary Johnson",
  "mother_aadhar": "1234-5678-9014",
  "stay_type": "monthly",
  "joining_date": "2026-01-15",
  "vacating_date": null,
  "room": {
    "id": 1,
    "room_name": "101",
    "branch": {
      "id": 1,
      "name": "Main Branch",
      "city": "Chennai"
    },
    "rent": 5000.00
  },
  "id_proof_type": "aadhar",
  "id_proof_number": "1234-5678-9012",
  "payment_history": [
    {
      "id": 1,
      "payment_date": "2026-02-01",
      "amount_paid": 5000.00,
      "for_month": "2026-02-01",
      "payment_method": "upi"
    }
  ],
  "total_payments": 15000.00,
  "last_payment_date": "2026-04-01",
  "months_stayed": 3,
  "status": "active",
  "created_at": "2026-01-10T10:30:00Z"
}
```

#### Create Tenant
```http
POST /api/v2/tenants/

Request Body:
{
  "name": "Alice Johnson",
  "phone_number": "9876543210",
  "email": "alice@example.com",
  "address": "123 Home St, Chennai",
  "emergency_contact_name": "John Johnson",
  "emergency_contact_phone": "9876543211",
  "stay_type": "monthly",
  "joining_date": "2026-01-15",
  "room": 1,
  "id_proof_type": "aadhar",
  "id_proof_number": "1234-5678-9012",
  "father_name": "Robert Johnson",
  "father_aadhar": "1234-5678-9013"
}

Response: 201 Created
{
  "id": 1,
  "name": "Alice Johnson",
  ...
  "status": "active"
}

Error: 400 Bad Request
{
  "error": "Room '101' has reached its capacity of 3 tenants."
}
```

#### Update Tenant
```http
PUT /api/v2/tenants/{id}/
PATCH /api/v2/tenants/{id}/

Request Body:
{
  "phone_number": "9876543212",
  "email": "alice.new@example.com"
}

Response: 200 OK
```

#### Vacate Tenant
```http
PATCH /api/v2/tenants/{id}/

Request Body:
{
  "vacating_date": "2026-04-30"
}

Response: 200 OK
{
  "id": 1,
  "name": "Alice Johnson",
  "vacating_date": "2026-04-30",
  "status": "vacated"
}
```

#### Delete Tenant
```http
DELETE /api/v2/tenants/{id}/

Response: 204 No Content

Note: Will CASCADE delete payment history (RISK!)
```

#### Get Tenant Payments
```http
GET /api/v2/tenants/{id}/payments/

Response: 200 OK
[
  {
    "id": 1,
    "payment_date": "2026-02-01",
    "amount_paid": 5000.00,
    "for_month": "2026-02-01",
    "payment_method": "upi",
    "reference_number": "UPI/123456789",
    "collected_by": {
      "id": 1,
      "username": "john_doe"
    }
  }
]
```

#### Get Tenant Requests
```http
GET /api/v2/tenants/{id}/requests/

Response: 200 OK
[
  {
    "id": 1,
    "request_type": "maintenance",
    "title": "AC not working",
    "description": "AC in room 101 stopped working",
    "priority": "high",
    "status": "in_progress",
    "created_at": "2026-04-01T10:30:00Z"
  }
]
```

---

### 4.5 Payment Management APIs

#### List Payments
```http
GET /api/v2/payments/

Query Parameters:
- page=1
- page_size=25
- tenant=<tenant_id>
- branch=<branch_id>
- payment_method=upi
- for_month=2026-02-01
- payment_date_from=2026-02-01
- payment_date_to=2026-02-28

Response: 200 OK
{
  "count": 100,
  "results": [
    {
      "id": 1,
      "tenant": {
        "id": 1,
        "name": "Alice Johnson",
        "room": {
          "id": 1,
          "room_name": "101",
          "branch_name": "Main Branch"
        }
      },
      "payment_date": "2026-02-01",
      "amount_paid": 5000.00,
      "for_month": "2026-02-01",
      "payment_method": "upi",
      "payment_method_display": "UPI",
      "reference_number": "UPI/123456789",
      "notes": "February rent",
      "collected_by": {
        "id": 1,
        "username": "john_doe",
        "full_name": "John Doe"
      },
      "created_at": "2026-02-01T10:30:00Z"
    }
  ]
}
```

#### Get Payment Detail
```http
GET /api/v2/payments/{id}/

Response: 200 OK
```

#### Create Payment
```http
POST /api/v2/payments/

Request Body:
{
  "tenant": 1,
  "payment_date": "2026-04-01",
  "amount_paid": 5000.00,
  "for_month": "2026-04-01",
  "payment_method": "upi",
  "reference_number": "UPI/987654321",
  "notes": "April rent - paid on time"
}

Response: 201 Created
{
  "id": 2,
  "tenant": {
    "id": 1,
    "name": "Alice Johnson"
  },
  ...
}

Error: 400 Bad Request
{
  "error": "Payment for this month already exists"
}
```

#### Update Payment
```http
PUT /api/v2/payments/{id}/
PATCH /api/v2/payments/{id}/

Request Body:
{
  "amount_paid": 5500.00,
  "notes": "April rent + late fee"
}

Response: 200 OK
```

#### Delete Payment
```http
DELETE /api/v2/payments/{id}/

Response: 204 No Content
```

---

### 4.6 Occupancy Management APIs

#### List Occupancies
```http
GET /api/v2/occupancy/

Query Parameters:
- page=1
- room=<room_id>
- tenant=<tenant_id>
- is_current=true  (end_date is null)

Response: 200 OK
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "room": {
        "id": 1,
        "room_name": "101",
        "branch_name": "Main Branch"
      },
      "tenant": {
        "id": 1,
        "name": "Alice Johnson"
      },
      "start_date": "2026-01-15",
      "end_date": null,  // null = current occupancy
      "monthly_rent_agreed": 5000.00,
      "security_deposit": 10000.00,
      "created_by": {
        "id": 1,
        "username": "john_doe"
      },
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Occupancy
```http
POST /api/v2/occupancy/

Request Body:
{
  "room": 1,
  "tenant": 1,
  "start_date": "2026-01-15",
  "monthly_rent_agreed": 5000.00,
  "security_deposit": 10000.00
}

Response: 201 Created
```

---

### 4.7 User Management APIs (Admin/Owner)

#### List Users
```http
GET /api/users/

Query Parameters:
- page=1
- page_size=25
- role=warden
- is_active=true
- search=<username/email/name>

Headers:
Authorization: Bearer <access_token>

Response: 200 OK
{
  "count": 10,
  "results": [
    {
      "id": 2,
      "username": "warden_jane",
      "email": "jane@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "is_active": true,
      "profile": {
        "role": "warden",
        "role_display": "Warden",
        "phone_number": "9876543220"
      },
      "date_joined": "2026-02-01T10:30:00Z",
      "last_login": "2026-04-04T09:15:00Z"
    }
  ]
}
```

#### Get User Detail
```http
GET /api/users/{id}/

Response: 200 OK
```

#### Create User (Admin/Owner only)
```http
POST /api/users/

Request Body:
{
  "username": "warden_jane",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "first_name": "Jane",
  "last_name": "Smith",
  "profile": {
    "role": "warden",
    "phone_number": "9876543220"
  }
}

Response: 201 Created
```

#### Update User
```http
PUT /api/users/{id}/
PATCH /api/users/{id}/

Request Body:
{
  "email": "jane.new@example.com",
  "is_active": false  // Deactivate user
}

Response: 200 OK
```

#### Update User Profile
```http
PATCH /api/users/{id}/update_profile/

Request Body:
{
  "phone_number": "9876543221",
  "role": "warden"
}

Response: 200 OK
```

#### Delete User
```http
DELETE /api/users/{id}/

Response: 204 No Content

Note: Will CASCADE delete owned branches (CRITICAL RISK!)
```

---

### 4.8 Worker Management APIs

#### List Workers
```http
GET /api/workers/workers/

Query Parameters:
- page=1
- branch=<branch_id>
- worker_type=cleaning
- status=active
- search=<name>

Response: 200 OK
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "name": "Ravi Kumar",
      "worker_type": "cleaning",
      "worker_type_display": "Cleaning Staff",
      "branch": {
        "id": 1,
        "name": "Main Branch"
      },
      "phone_number": "9876543230",
      "employment_type": "full_time",
      "salary": 15000.00,
      "salary_frequency": "monthly",
      "status": "active",
      "joining_date": "2025-12-01"
    }
  ]
}
```

#### Create Worker
```http
POST /api/workers/workers/

Request Body:
{
  "name": "Ravi Kumar",
  "phone_number": "9876543230",
  "address": "Worker colony, Chennai",
  "id_proof_type": "Aadhar",
  "id_proof_number": "1234-5678-9015",
  "worker_type": "cleaning",
  "employment_type": "full_time",
  "branch": 1,
  "joining_date": "2025-12-01",
  "salary": 15000.00,
  "salary_frequency": "monthly",
  "emergency_contact_name": "Lakshmi Kumar",
  "emergency_contact_phone": "9876543231",
  "emergency_contact_relation": "Wife"
}

Response: 201 Created
```

#### Worker Attendance
```http
GET /api/workers/attendance/
POST /api/workers/attendance/

Request Body:
{
  "worker": 1,
  "date": "2026-04-04",
  "status": "present",
  "check_in_time": "08:00:00",
  "check_out_time": "17:00:00"
}

Response: 201 Created
```

#### Worker Salary
```http
GET /api/workers/salaries/
POST /api/workers/salaries/

Request Body:
{
  "worker": 1,
  "month": "2026-04-01",
  "amount_paid": 15000.00,
  "payment_date": "2026-04-01",
  "payment_mode": "bank_transfer"
}
```

#### Worker Leave
```http
GET /api/workers/leaves/
POST /api/workers/leaves/

Request Body:
{
  "worker": 1,
  "leave_type": "sick",
  "start_date": "2026-04-05",
  "end_date": "2026-04-07",
  "days_count": 3,
  "reason": "Fever",
  "status": "pending"
}
```

---

### 4.9 Grocery Management APIs

#### List Grocery Categories
```http
GET /api/groceries/categories/

Response: 200 OK
[
  {
    "id": 1,
    "name": "Vegetables",
    "description": "Fresh vegetables"
  },
  {
    "id": 2,
    "name": "Rice & Grains",
    "description": ""
  }
]
```

#### List Grocery Items
```http
GET /api/groceries/items/

Query Parameters:
- category=<category_id>
- is_active=true
- search=<name>

Response: 200 OK
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "Tomato",
      "category": {
        "id": 1,
        "name": "Vegetables"
      },
      "unit": "kg",
      "unit_display": "Kilogram",
      "min_stock_level": 10.00,
      "avg_price_per_unit": 40.00,
      "is_active": true
    }
  ]
}
```

#### List Vendors
```http
GET /api/groceries/vendors/

Response: 200 OK
[
  {
    "id": 1,
    "name": "Fresh Mart Suppliers",
    "contact_person": "Mr. Sharma",
    "phone_number": "9876543240",
    "is_active": true
  }
]
```

#### Check Stock
```http
GET /api/groceries/stock/

Query Parameters:
- branch=<branch_id>
- item=<item_id>

Response: 200 OK
[
  {
    "id": 1,
    "branch": {
      "id": 1,
      "name": "Main Branch"
    },
    "item": {
      "id": 1,
      "name": "Tomato",
      "unit": "kg"
    },
    "quantity": 25.00,
    "last_restocked": "2026-04-01T10:00:00Z",
    "is_low_stock": false
  }
]
```

#### Create Purchase
```http
POST /api/groceries/purchases/

Request Body:
{
  "branch": 1,
  "vendor": 1,
  "purchase_date": "2026-04-04",
  "invoice_number": "INV-2026-001",
  "total_amount": 5000.00,
  "payment_status": "paid",
  "payment_mode": "bank_transfer",
  "items": [
    {
      "item": 1,
      "quantity": 50.00,
      "unit_price": 40.00,
      "total_price": 2000.00
    },
    {
      "item": 2,
      "quantity": 30.00,
      "unit_price": 100.00,
      "total_price": 3000.00
    }
  ]
}

Response: 201 Created
```

#### Record Consumption
```http
POST /api/groceries/consumption/

Request Body:
{
  "branch": 1,
  "item": 1,
  "quantity_used": 5.00,
  "consumption_date": "2026-04-04",
  "purpose": "Daily mess cooking"
}

Response: 201 Created
```

---

### 4.10 Machine Management APIs

#### List Machines
```http
GET /api/machines/machines/

Query Parameters:
- branch=<branch_id>
- category=<category_id>
- status=operational
- search=<name>

Response: 200 OK
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "name": "Washing Machine - Ground Floor",
      "category": {
        "id": 1,
        "name": "Laundry Equipment"
      },
      "branch": {
        "id": 1,
        "name": "Main Branch"
      },
      "brand": "LG",
      "model_number": "T80SJSF1Z",
      "serial_number": "SN123456789",
      "location": "Ground Floor - Laundry Room",
      "status": "operational",
      "condition": "good",
      "purchase_date": "2023-01-15",
      "is_under_warranty": false,
      "last_service_date": "2026-01-15",
      "next_service_date": "2026-04-15"
    }
  ]
}
```

#### Create Machine
```http
POST /api/machines/machines/

Request Body:
{
  "name": "Water Heater - 2nd Floor",
  "category": 2,
  "branch": 1,
  "brand": "Racold",
  "model_number": "ETERNO 15L",
  "serial_number": "SN987654321",
  "location": "2nd Floor - Bathroom",
  "purchase_date": "2025-06-15",
  "purchase_price": 12000.00,
  "vendor": "Vijay Appliances",
  "warranty_start_date": "2025-06-15",
  "warranty_end_date": "2027-06-15",
  "status": "operational",
  "condition": "excellent",
  "capacity": "15 liters",
  "power_rating": "2000W"
}

Response: 201 Created
```

#### Record Maintenance
```http
POST /api/machines/maintenance/

Request Body:
{
  "machine": 1,
  "maintenance_type": "preventive",
  "description": "Regular servicing and filter replacement",
  "cost": 800.00,
  "performed_by": "Service Center - LG",
  "performed_date": "2026-04-04",
  "next_due_date": "2026-07-04"
}

Response: 201 Created
```

#### Report Machine Issue
```http
POST /api/machines/issues/

Request Body:
{
  "machine": 1,
  "issue_title": "Not draining water",
  "description": "Washing machine completed cycle but water not draining",
  "severity": "high",
  "status": "reported"
}

Response: 201 Created
```

#### Log Machine Usage
```http
POST /api/machines/usage/

Request Body:
{
  "machine": 1,
  "usage_date": "2026-04-04",
  "usage_hours": 2.5,
  "used_by": "Room 101 tenants",
  "notes": "3 loads of laundry"
}
```

---

### 4.11 Legacy Endpoints (Backward Compatibility)

These endpoints exist at `/api/` without version prefix:

- `GET /api/branches/`
- `GET /api/rooms/`
- `GET /api/tenants/`
- `GET /api/occupancy/`
- `GET /api/payments/`

**Note:** These do NOT have role-based filtering. Use v2 endpoints for production.

---

## 5. Frontend Architecture

### Technology Stack
```yaml
React: 18.2.0
UI Library: Material-UI 7.1.2
Routing: React Router DOM 6.22.3
HTTP Client: Axios 1.6.0
State Management: Context API + Component State
Icons: Material Icons 7.1.2
Data Grid: MUI X Data Grid 8.6.0
Date Handling: Day.js 1.11.13
Auth: JWT stored in localStorage
```

### Project Structure
```
hostel-frontend-starter/
├── public/
│   └── index.html
├── src/
│   ├── api.js                    # Axios instance + API methods
│   ├── App.js                    # Main app with routing
│   ├── index.js                  # Entry point
│   ├── Login.js                  # Legacy login
│   ├── api/                      # API service layer (placeholder)
│   ├── components/
│   │   ├── ProtectedRoute.js    # Route guard for authenticated users
│   │   ├── RoleBasedComponent.js # Show/hide based on role
│   │   ├── SessionManager.js    # Handle session timeout
│   │   ├── ConditionalDashboard.js # Route to role-specific dashboard
│   │   ├── LoginForm.js         # Login component
│   │   ├── PhoneOTPLogin.js     # (Not fully implemented)
│   │   ├── Profile.js           # User profile page
│   │   ├── UserManagement.js    # Admin: manage users
│   │   ├── UserProfileForm.js   # User profile form
│   │   ├── Branches.js          # Branch management
│   │   ├── PropertyForm.js      # Branch create/edit form
│   │   ├── RoleFilteredBranches.js # Branch list filtered by role
│   │   ├── Rooms.js             # Room management
│   │   ├── RoomForm.js          # Room create/edit form
│   │   ├── RoomDialog.js        # Room modal dialog
│   │   ├── RoomStatus.js        # Room status display
│   │   ├── Tenants.js           # Tenant management
│   │   ├── TenantForm.js        # Tenant create/edit form
│   │   ├── TenantDialog.js      # Tenant modal dialog
│   │   ├── SimpleTenants.js     # Simplified tenant view
│   │   ├── Workers.js           # Worker management
│   │   ├── Groceries.js         # Grocery management
│   │   ├── Machines.js          # Machine management
│   │   ├── Dashboard.js         # Default dashboard
│   │   ├── RoleTestPage.js      # Role testing page
│   │   ├── dashboards/
│   │   │   ├── OwnerDashboard.js
│   │   │   ├── WardenDashboard.js
│   │   │   ├── TenantDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── tenants/
│   │   │   ├── ActiveTenants.js
│   │   │   ├── VacatedTenants.js
│   │   │   └── PendingTenants.js
│   │   └── navigation/
│   │       └── MainNavigation.js
│   ├── config/
│   │   └── api.js               # API base URL configuration
│   ├── contexts/
│   │   └── AuthContext.js       # Authentication context (if exists)
│   └── hooks/
│       └── useAuth.js           # Authentication hook (if exists)
├── pages/
│   ├── LoginPage.js
│   ├── ForgotPasswordPage.js
│   └── PasswordResetConfirmPage.js
├── package.json
└── nginx.conf                   # Production nginx config
```

### Key Components

#### 1. Authentication Flow
```javascript
// Login → Store tokens → Axios interceptor adds Bearer token
// On 401 → Auto refresh token → Retry request
// On refresh failure → Clear storage → Redirect to login

localStorage.setItem('access', accessToken);
localStorage.setItem('refresh', refreshToken);
localStorage.setItem('user', JSON.stringify(userData));
localStorage.setItem('userRole', role);
```

#### 2. Protected Routes
```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <ConditionalDashboard />
  </ProtectedRoute>
} />
```

#### 3. Role-Based Rendering
```jsx
<RoleBasedComponent allowedRoles={['owner', 'admin']}>
  <Button onClick={createBranch}>Create Branch</Button>
</RoleBasedComponent>
```

#### 4. API Integration
```javascript
// Example: Fetch branches
const response = await enhancedAPI.branches.list({ page: 1 });
const branches = response.data.results;

// Example: Create tenant
await enhancedAPI.tenants.create({
  name: "Alice Johnson",
  room: 1,
  ...
});
```

### Routing Structure
```
/                         → Redirect to /login or /dashboard
/login                    → LoginPage
/forgot-password          → ForgotPasswordPage
/reset-password/:uid/:token → PasswordResetConfirmPage
/dashboard                → ConditionalDashboard (role-based)
/profile                  → Profile
/users                    → UserManagement (admin/owner only)
/branches                 → Branches (owner/admin)
/rooms                    → Rooms
/tenants                  → Tenants
/payments                 → Payments (planned)
/workers                  → Workers
/groceries                → Groceries
/machines                 → Machines
/reports                  → Reports (planned)
```

### Environment Configuration
```javascript
// src/config/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// .env (development)
REACT_APP_API_URL=http://localhost:8000

// .env.production
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## 6. Authentication & Authorization

### Authentication Method
- **JWT (JSON Web Tokens)**
- Access token lifetime: 2 hours
- Refresh token lifetime: 30 days
- Stored in browser localStorage (⚠️ XSS vulnerability)

### Token Flow
```
1. Login → POST /api/auth/login/
2. Receive { access, refresh, user, profile }
3. Store in localStorage
4. Axios interceptor adds: Authorization: Bearer <access>
5. On 401 response → POST /api/token/refresh/ with refresh token
6. Get new access token → Retry original request
7. On refresh failure → Clear storage → Redirect to /login
```

### Role-Based Access Control (RBAC)

#### Backend Enforcement
```python
# Middleware: RoleBasedAccessMiddleware
# Decorators: @require_role, @require_property_ownership
# Permissions: IsOwnerOrReadOnly, Custom permissions per viewset

# Example:
@require_role('owner', 'admin')
def create_branch(request):
    # Only owners and admins can create branches
    pass
```

#### Frontend Enforcement
```jsx
// ProtectedRoute wrapper
// RoleBasedComponent for conditional rendering
// Role stored in localStorage.getItem('userRole')

// Example:
<RoleBasedComponent allowedRoles={['owner', 'admin']}>
  <CreateBranchButton />
</RoleBasedComponent>
```

### Permission Matrix

| Resource | Owner | Warden | Tenant | Admin |
|----------|-------|--------|--------|-------|
| **Branches** |
| Create | ✅ Own | ❌ | ❌ | ✅ All |
| Read | ✅ Own | ✅ Assigned | ❌ | ✅ All |
| Update | ✅ Own | ❌ | ❌ | ✅ All |
| Delete | ✅ Own | ❌ | ❌ | ✅ All |
| **Rooms** |
| Create | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |
| Read | ✅ Own branches | ✅ Assigned branches | ❌ | ✅ All |
| Update | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |
| Delete | ✅ Own branches | ❌ | ❌ | ✅ All |
| **Tenants** |
| Create | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |
| Read | ✅ Own branches | ✅ Assigned branches | ✅ Self only | ✅ All |
| Update | ✅ Own branches | ✅ If permitted | ✅ Self only | ✅ All |
| Delete | ✅ Own branches | ❌ | ❌ | ✅ All |
| **Payments** |
| Create | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |
| Read | ✅ Own branches | ✅ If permitted | ✅ Self only | ✅ All |
| Update | ✅ Own branches | ❌ | ❌ | ✅ All |
| Delete | ✅ Own branches | ❌ | ❌ | ✅ All |
| **Users** |
| Create | ✅ | ❌ | ❌ | ✅ |
| Read | ✅ Own org | ❌ | ❌ | ✅ All |
| Update | ✅ Own org | ❌ | ✅ Self | ✅ All |
| Delete | ✅ Own org | ❌ | ❌ | ✅ All |
| **Workers** |
| Manage | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |
| **Groceries** |
| Manage | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |
| **Machines** |
| Manage | ✅ Own branches | ✅ If permitted | ❌ | ✅ All |

---

## 7. Deployment Architecture

### Docker Compose Stack

```yaml
services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    ports: 5433:5432
    volumes: postgres_data
    
  # Redis Cache
  redis:
    image: redis:7-alpine
    ports: 6379:6379
    
  # Django Backend
  backend:
    build: ./hostel_admin_backend
    ports: 8000:8000
    depends_on: [db, redis]
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
    
  # React Frontend
  frontend:
    build: ./hostel-frontend-starter
    ports: 80:80
    depends_on: [backend]
    nginx serving static build
    
volumes:
  postgres_data:
```

### Production URLs
- Frontend: `http://yourdomain.com` (Port 80)
- Backend API: `http://yourdomain.com:8000/api/`
- Admin Panel: `http://yourdomain.com:8000/admin/`

### Environment Variables

**Backend (.env)**
```env
SECRET_KEY=<django-secret-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,localhost
DB_NAME=hostel_management
DB_USER=postgres
DB_PASSWORD=<secure-password>
DB_HOST=db
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://yourdomain.com
EMAIL_HOST_USER=sreelakshmiladieshostel91@gmail.com
EMAIL_HOST_PASSWORD=<app-password>
FRONTEND_URL=http://yourdomain.com
```

**Frontend (.env.production)**
```env
REACT_APP_API_URL=http://yourdomain.com:8000
```

---

## 8. Expert Recommendations

### 🔴 CRITICAL ISSUES (Fix Immediately)

#### 1. CASCADE Delete Risks
**Problem:** Deleting a user cascades to all owned branches, rooms, tenants, payments
```python
# Line 58 in models.py
owner = models.ForeignKey(User, on_delete=models.CASCADE)  # ❌ DANGEROUS
```

**Solution:**
```python
# Implement soft delete
owner = models.ForeignKey(User, on_delete=models.PROTECT, null=False)
is_deleted = models.BooleanField(default=False)
deleted_at = models.DateTimeField(null=True, blank=True)
```

**Impact:** Prevents accidental data loss when user account is deleted

---

#### 2. Data Integrity - Too Many Nullable Fields
**Problem:** Core fields allow NULL, creating unreliable data
```python
name = models.CharField(max_length=100, null=True, blank=True)  # ❌ Name should be required
```

**Solution:** Make essential fields mandatory
```python
# Branch model
name = models.CharField(max_length=100, null=False, blank=False)
address = models.TextField(null=False, blank=False)
contact_phone = models.CharField(max_length=15, null=False)

# Tenant model  
name = models.CharField(max_length=100, null=False, blank=False)
phone_number = models.CharField(max_length=15, null=False, blank=False)
```

**Priority:** P0 - Do this before AI integration

---

#### 3. Security - Token Storage in localStorage
**Problem:** XSS attacks can steal JWT tokens from localStorage

**Solution:**
```javascript
// Option 1: HTTP-only cookies (backend change needed)
// Option 2: Short-lived tokens + refresh in background
// Option 3: Store in memory + sessionStorage for refresh

// Immediate mitigation:
// - Implement Content Security Policy (CSP)
// - Add XSS sanitization
// - Reduce token lifetime to 30 minutes
```

---

#### 4. No API Rate Limiting
**Problem:** API can be abused, no throttling

**Solution:**
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

---

### 🟡 HIGH PRIORITY (Fix Soon)

#### 5. Add Pagination Everywhere
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'MAX_PAGE_SIZE': 100
}
```

#### 6. Implement Database Indexing Review
```python
# Add missing indexes for frequent queries
class Tenant(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['email']),  # If used for search
            models.Index(fields=['created_at']),
            models.Index(fields=['stay_type', 'vacating_date']),
        ]
```

#### 7. Add API Versioning Header
```python
# Instead of /api/v2/, use headers:
# Accept: application/json; version=2.0
```

#### 8. Implement Soft Deletes Base Model
```python
class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    objects = SoftDeleteManager()  # Custom manager filters out deleted
    all_objects = models.Manager()  # Access all including deleted
    
    def delete(self, soft=True, *args, **kwargs):
        if soft:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            self.save()
        else:
            super().delete(*args, **kwargs)
    
    class Meta:
        abstract = True
```

#### 9. Add Comprehensive Logging
```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
        },
        'core': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

#### 10. Implement Celery for Background Tasks
```python
# Async tasks needed:
# - Send payment reminders
# - Generate monthly reports
# - Send email notifications
# - Export large datasets for AI
# - Daily occupancy snapshots

# celery.py
from celery import Celery
app = Celery('hostel_admin')
app.config_from_object('django.conf:settings', namespace='CELERY')

@app.task
def send_payment_reminder(tenant_id):
    # Send reminder email
    pass
```

---

### 🟢 MEDIUM PRIORITY (Nice to Have)

#### 11. Add API Documentation
```bash
pip install drf-spectacular

# settings.py
INSTALLED_APPS += ['drf_spectacular']

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns += [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
```

#### 12. Add Data Validation Layer
```python
# serializers.py
class TenantSerializer(serializers.ModelSerializer):
    def validate_phone_number(self, value):
        if not re.match(r'^\d{10}$', value):
            raise serializers.ValidationError("Phone must be 10 digits")
        return value
    
    def validate_email(self, value):
        if value and not '@' in value:
            raise serializers.ValidationError("Invalid email")
        return value
```

#### 13. Add Bulk Operations
```python
# For AI data export
class TenantViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        # Return CSV of all tenants for ML training
        pass
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        # Create multiple tenants at once
        pass
```

#### 14. Implement Caching Strategy
```python
# views.py
from django.core.cache import cache

def get_branch_stats(branch_id):
    cache_key = f'branch_stats_{branch_id}'
    stats = cache.get(cache_key)
    if not stats:
        stats = calculate_stats(branch_id)
        cache.set(cache_key, stats, timeout=300)  # 5 minutes
    return stats
```

#### 15. Add Real-time Notifications
```python
# Using Django Channels for WebSocket
# - New tenant request
# - Payment received
# - Machine breakdown reported
# - Low grocery stock alert
```

---

## 9. AI Integration Roadmap

### Phase 1: Data Foundation (Weeks 1-2)

#### Task 1.1: Add Analytics Models
```python
# core/models.py

class TenantAnalytics(models.Model):
    """Pre-computed metrics for each tenant"""
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE)
    
    # Payment behavior
    total_payments = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payments_count = models.IntegerField(default=0)
    avg_payment_delay_days = models.FloatField(default=0)
    late_payments_count = models.IntegerField(default=0)
    payment_punctuality_score = models.FloatField(default=100)  # 0-100
    
    # Stay behavior
    months_stayed = models.IntegerField(default=0)
    room_changes_count = models.IntegerField(default=0)
    
    # Complaints & requests
    total_complaints = models.IntegerField(default=0)
    resolved_complaints = models.IntegerField(default=0)
    complaint_resolution_avg_days = models.FloatField(default=0)
    
    # Engagement
    last_payment_date = models.DateField(null=True)
    days_since_last_payment = models.IntegerField(default=0)
    
    # Risk scores (AI-computed)
    churn_risk_score = models.FloatField(default=0, help_text="0-100, higher = more likely to leave")
    default_risk_score = models.FloatField(default=0, help_text="0-100, higher = payment default risk")
    
    last_computed = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Tenant Analytics"


class BranchPerformance(models.Model):
    """Monthly performance metrics per branch"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    month = models.DateField()  # First day of month
    
    # Occupancy metrics
    avg_occupancy_rate = models.FloatField()
    avg_occupied_beds = models.IntegerField()
    total_beds = models.IntegerField()
    
    # Financial metrics
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2)
    total_rent_collected = models.DecimalField(max_digits=10, decimal_places=2)
    total_expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Tenant metrics
    new_tenants = models.IntegerField()
    vacated_tenants = models.IntegerField()
    churn_rate = models.FloatField()  # Percentage
    
    # Operational metrics
    maintenance_issues = models.IntegerField(default=0)
    tenant_complaints = models.IntegerField(default=0)
    avg_complaint_resolution_days = models.FloatField(default=0)
    
    # AI predictions (to be filled)
    predicted_occupancy_next_month = models.FloatField(null=True)
    predicted_revenue_next_month = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['branch', 'month']
        ordering = ['-month']


class DailyOccupancySnapshot(models.Model):
    """Daily snapshot for time-series analysis"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    date = models.DateField()
    
    total_rooms = models.IntegerField()
    occupied_rooms = models.IntegerField()
    available_rooms = models.IntegerField()
    maintenance_rooms = models.IntegerField()
    
    total_beds = models.IntegerField()
    occupied_beds = models.IntegerField()
    available_beds = models.IntegerField()
    
    occupancy_rate = models.FloatField()  # Percentage
    daily_revenue = models.DecimalField(max_digits=10, decimal_places=2)
    
    # External factors (optional)
    is_weekend = models.BooleanField()
    is_holiday = models.BooleanField(default=False)
    local_event = models.CharField(max_length=200, blank=True)  # e.g., "University exams"
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['branch', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['branch', 'date']),
            models.Index(fields=['date']),
        ]
```

#### Task 1.2: Create Celery Task for Daily Snapshots
```python
# core/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Branch, DailyOccupancySnapshot

@shared_task
def capture_daily_occupancy_snapshot():
    """Run this task daily at midnight"""
    today = timezone.now().date()
    
    for branch in Branch.objects.filter(is_active=True):
        # Calculate metrics
        total_rooms = branch.rooms.count()
        occupied_rooms = branch.rooms.filter(status='occupied').count()
        available_rooms = branch.rooms.filter(status='available').count()
        
        total_beds = sum(room.sharing_type for room in branch.rooms.all())
        occupied_beds = sum(room.current_occupancy for room in branch.rooms.all())
        
        occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
        
        # Calculate daily revenue
        active_tenants = branch.rooms.values_list('tenants', flat=True).filter(
            tenants__vacating_date__isnull=True
        )
        daily_revenue = sum(room.rent for room in branch.rooms.filter(
            tenants__vacating_date__isnull=True
        ).distinct()) / 30  # Rough estimate
        
        # Create snapshot
        DailyOccupancySnapshot.objects.update_or_create(
            branch=branch,
            date=today,
            defaults={
                'total_rooms': total_rooms,
                'occupied_rooms': occupied_rooms,
                'available_rooms': available_rooms,
                'total_beds': total_beds,
                'occupied_beds': occupied_beds,
                'occupancy_rate': occupancy_rate,
                'daily_revenue': daily_revenue,
                'is_weekend': today.weekday() >= 5,
            }
        )
```

#### Task 1.3: Add Feature Computation Task
```python
@shared_task
def compute_tenant_analytics():
    """Compute analytics for all active tenants"""
    from datetime import timedelta
    
    for tenant in Tenant.objects.filter(vacating_date__isnull=True):
        # Payment metrics
        payments = tenant.payments.all()
        total_payments = sum(p.amount_paid for p in payments)
        payments_count = payments.count()
        
        # Calculate payment delays
        delays = []
        for payment in payments:
            expected_date = payment.for_month  # First of month
            actual_date = payment.payment_date
            delay = (actual_date - expected_date).days
            if delay > 0:
                delays.append(delay)
        
        avg_delay = sum(delays) / len(delays) if delays else 0
        late_count = len([d for d in delays if d > 5])  # More than 5 days late
        
        # Punctuality score (100 - penalty for delays)
        punctuality = max(0, 100 - (avg_delay * 2) - (late_count * 5))
        
        # Stay duration
        months_stayed = 0
        if tenant.joining_date:
            delta = timezone.now().date() - tenant.joining_date
            months_stayed = delta.days // 30
        
        # Complaints
        requests = tenant.requests.all()
        total_complaints = requests.filter(request_type='complaint').count()
        resolved_complaints = requests.filter(
            request_type='complaint',
            status='resolved'
        ).count()
        
        # Days since last payment
        last_payment = payments.order_by('-payment_date').first()
        days_since_last = 0
        if last_payment:
            days_since_last = (timezone.now().date() - last_payment.payment_date).days
        
        # Update or create analytics
        TenantAnalytics.objects.update_or_create(
            tenant=tenant,
            defaults={
                'total_payments': total_payments,
                'payments_count': payments_count,
                'avg_payment_delay_days': avg_delay,
                'late_payments_count': late_count,
                'payment_punctuality_score': punctuality,
                'months_stayed': months_stayed,
                'total_complaints': total_complaints,
                'resolved_complaints': resolved_complaints,
                'last_payment_date': last_payment.payment_date if last_payment else None,
                'days_since_last_payment': days_since_last,
            }
        )
```

---

### Phase 2: AI Model Development (Weeks 3-6)

#### Use Case 1: Occupancy Forecasting
```python
# ai/models/occupancy_forecast.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

class OccupancyForecaster:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    def prepare_features(self, branch_id):
        """Extract features from DailyOccupancySnapshot"""
        snapshots = DailyOccupancySnapshot.objects.filter(
            branch_id=branch_id
        ).order_by('date')
        
        df = pd.DataFrame(list(snapshots.values()))
        
        # Feature engineering
        df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
        df['day_of_month'] = pd.to_datetime(df['date']).dt.day
        df['month'] = pd.to_datetime(df['date']).dt.month
        df['week_of_year'] = pd.to_datetime(df['date']).dt.isocalendar().week
        
        # Lagged features (previous week's occupancy)
        df['occupancy_rate_lag_7'] = df['occupancy_rate'].shift(7)
        df['occupancy_rate_lag_14'] = df['occupancy_rate'].shift(14)
        df['occupancy_rate_lag_30'] = df['occupancy_rate'].shift(30)
        
        # Rolling averages
        df['occupancy_rate_ma_7'] = df['occupancy_rate'].rolling(7).mean()
        df['occupancy_rate_ma_30'] = df['occupancy_rate'].rolling(30).mean()
        
        return df.dropna()
    
    def train(self, branch_id):
        """Train model on historical data"""
        df = self.prepare_features(branch_id)
        
        features = [
            'day_of_week', 'day_of_month', 'month', 'week_of_year',
            'is_weekend', 'is_holiday',
            'occupancy_rate_lag_7', 'occupancy_rate_lag_14', 'occupancy_rate_lag_30',
            'occupancy_rate_ma_7', 'occupancy_rate_ma_30'
        ]
        
        X = df[features]
        y = df['occupancy_rate']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        score = self.model.score(X_test, y_test)
        print(f"Model R² Score: {score:.4f}")
        
        # Save model
        joblib.dump(self.model, f'models/occupancy_forecast_branch_{branch_id}.pkl')
        
        return score
    
    def predict_next_30_days(self, branch_id):
        """Predict occupancy for next 30 days"""
        # Load model
        self.model = joblib.load(f'models/occupancy_forecast_branch_{branch_id}.pkl')
        
        # Get latest data
        latest = DailyOccupancySnapshot.objects.filter(
            branch_id=branch_id
        ).order_by('-date').first()
        
        predictions = []
        current_date = latest.date + timedelta(days=1)
        
        for i in range(30):
            # Prepare features for prediction
            features = {
                'day_of_week': current_date.weekday(),
                'day_of_month': current_date.day,
                'month': current_date.month,
                'week_of_year': current_date.isocalendar()[1],
                'is_weekend': current_date.weekday() >= 5,
                'is_holiday': False,  # TODO: Integrate holiday calendar
                'occupancy_rate_lag_7': latest.occupancy_rate,  # Simplified
                'occupancy_rate_lag_14': latest.occupancy_rate,
                'occupancy_rate_lag_30': latest.occupancy_rate,
                'occupancy_rate_ma_7': latest.occupancy_rate,
                'occupancy_rate_ma_30': latest.occupancy_rate,
            }
            
            X_pred = pd.DataFrame([features])
            predicted_occupancy = self.model.predict(X_pred)[0]
            
            predictions.append({
                'date': current_date,
                'predicted_occupancy_rate': round(predicted_occupancy, 2)
            })
            
            current_date += timedelta(days=1)
        
        return predictions
```

#### Use Case 2: Tenant Churn Prediction
```python
# ai/models/churn_predictor.py
from sklearn.ensemble import GradientBoostingClassifier
import pandas as pd

class ChurnPredictor:
    def __init__(self):
        self.model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    
    def prepare_features(self):
        """Extract features from TenantAnalytics"""
        tenants = TenantAnalytics.objects.all()
        
        data = []
        for ta in tenants:
            tenant = ta.tenant
            
            # Determine if churned (vacated within 30 days)
            churned = (
                tenant.vacating_date is not None and
                (tenant.vacating_date - tenant.joining_date).days < 180  # Churned if stayed < 6 months
            )
            
            data.append({
                'months_stayed': ta.months_stayed,
                'payment_punctuality_score': ta.payment_punctuality_score,
                'late_payments_count': ta.late_payments_count,
                'avg_payment_delay_days': ta.avg_payment_delay_days,
                'total_complaints': ta.total_complaints,
                'complaint_resolution_rate': ta.resolved_complaints / ta.total_complaints if ta.total_complaints > 0 else 1.0,
                'days_since_last_payment': ta.days_since_last_payment,
                'room_changes_count': ta.room_changes_count,
                'stay_type': 1 if tenant.stay_type == 'monthly' else 0,
                'churned': 1 if churned else 0
            })
        
        return pd.DataFrame(data)
    
    def train(self):
        """Train churn prediction model"""
        df = self.prepare_features()
        
        features = [
            'months_stayed', 'payment_punctuality_score', 'late_payments_count',
            'avg_payment_delay_days', 'total_complaints', 'complaint_resolution_rate',
            'days_since_last_payment', 'room_changes_count', 'stay_type'
        ]
        
        X = df[features]
        y = df['churned']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        score = self.model.score(X_test, y_test)
        print(f"Churn Model Accuracy: {score:.4f}")
        
        joblib.dump(self.model, 'models/churn_predictor.pkl')
        
        return score
    
    def predict_churn_risk(self, tenant_id):
        """Predict churn risk for a tenant"""
        self.model = joblib.load('models/churn_predictor.pkl')
        
        ta = TenantAnalytics.objects.get(tenant_id=tenant_id)
        tenant = ta.tenant
        
        features = {
            'months_stayed': ta.months_stayed,
            'payment_punctuality_score': ta.payment_punctuality_score,
            'late_payments_count': ta.late_payments_count,
            'avg_payment_delay_days': ta.avg_payment_delay_days,
            'total_complaints': ta.total_complaints,
            'complaint_resolution_rate': ta.resolved_complaints / ta.total_complaints if ta.total_complaints > 0 else 1.0,
            'days_since_last_payment': ta.days_since_last_payment,
            'room_changes_count': ta.room_changes_count,
            'stay_type': 1 if tenant.stay_type == 'monthly' else 0,
        }
        
        X_pred = pd.DataFrame([features])
        churn_probability = self.model.predict_proba(X_pred)[0][1]  # Probability of class 1 (churned)
        
        # Update analytics
        ta.churn_risk_score = round(churn_probability * 100, 2)
        ta.save()
        
        return churn_probability
```

#### Task 2.3: Create AI API Endpoints
```python
# ai/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models.occupancy_forecast import OccupancyForecaster
from .models.churn_predictor import ChurnPredictor

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def occupancy_forecast(request, branch_id):
    """Get 30-day occupancy forecast for a branch"""
    forecaster = OccupancyForecaster()
    predictions = forecaster.predict_next_30_days(branch_id)
    
    return Response({
        'branch_id': branch_id,
        'forecast_period': '30_days',
        'predictions': predictions
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def churn_risk_report(request):
    """Get churn risk report for all active tenants"""
    predictor = ChurnPredictor()
    
    high_risk_tenants = []
    for tenant in Tenant.objects.filter(vacating_date__isnull=True):
        risk = predictor.predict_churn_risk(tenant.id)
        if risk > 0.5:  # High risk threshold
            high_risk_tenants.append({
                'tenant_id': tenant.id,
                'tenant_name': tenant.name,
                'room': tenant.room.room_name if tenant.room else None,
                'churn_risk_score': round(risk * 100, 2),
                'months_stayed': tenant.months_stayed,
                'payment_punctuality': tenant.analytics.payment_punctuality_score
            })
    
    return Response({
        'high_risk_count': len(high_risk_tenants),
        'tenants': sorted(high_risk_tenants, key=lambda x: x['churn_risk_score'], reverse=True)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_models(request):
    """Trigger model training (admin only)"""
    if not request.user.profile.role == 'admin':
        return Response({'error': 'Admin only'}, status=403)
    
    branch_id = request.data.get('branch_id')
    
    # Train occupancy forecaster
    forecaster = OccupancyForecaster()
    occupancy_score = forecaster.train(branch_id)
    
    # Train churn predictor
    predictor = ChurnPredictor()
    churn_score = predictor.train()
    
    return Response({
        'message': 'Models trained successfully',
        'occupancy_model_score': occupancy_score,
        'churn_model_score': churn_score
    })
```

---

### Phase 3: AI Integration (Weeks 7-8)

#### Task 3.1: Add AI Insights to Dashboard
```jsx
// components/dashboards/OwnerDashboard.js
import { useState, useEffect } from 'react';
import { enhancedAPI } from '../../api';

function AIInsights({ branchId }) {
  const [forecast, setForecast] = useState(null);
  const [churnRisk, setChurnRisk] = useState(null);
  
  useEffect(() => {
    // Fetch occupancy forecast
    fetch(`/api/ai/occupancy-forecast/${branchId}/`)
      .then(res => res.json())
      .then(data => setForecast(data));
    
    // Fetch churn risk report
    fetch('/api/ai/churn-risk/')
      .then(res => res.json())
      .then(data => setChurnRisk(data));
  }, [branchId]);
  
  return (
    <div>
      <h2>AI Insights</h2>
      
      {/* Occupancy Forecast Chart */}
      {forecast && (
        <div>
          <h3>30-Day Occupancy Forecast</h3>
          <LineChart data={forecast.predictions} />
        </div>
      )}
      
      {/* High Churn Risk Tenants */}
      {churnRisk && churnRisk.high_risk_count > 0 && (
        <div style={{background: '#fff3cd', padding: '15px', borderRadius: '8px'}}>
          <h3>⚠️ High Churn Risk Tenants ({churnRisk.high_risk_count})</h3>
          <ul>
            {churnRisk.tenants.slice(0, 5).map(tenant => (
              <li key={tenant.tenant_id}>
                <strong>{tenant.tenant_name}</strong> - Room {tenant.room}
                <br/>
                Churn Risk: {tenant.churn_risk_score}% | 
                Payment Score: {tenant.payment_punctuality}
              </li>
            ))}
          </ul>
          <button>Take Action</button>
        </div>
      )}
    </div>
  );
}
```

---

## 10. Development Priorities

### Sprint 1: Critical Fixes (Week 1)
- [ ] Change CASCADE to PROTECT on owner field
- [ ] Make core fields non-nullable (name, address, phone)
- [ ] Implement soft delete base model
- [ ] Add API rate limiting
- [ ] Add pagination to all list endpoints

### Sprint 2: Data Foundation (Week 2)
- [ ] Create TenantAnalytics model
- [ ] Create BranchPerformance model
- [ ] Create DailyOccupancySnapshot model
- [ ] Set up Celery for background tasks
- [ ] Implement daily snapshot capture task
- [ ] Implement analytics computation task

### Sprint 3: Monitoring & Logging (Week 3)
- [ ] Add comprehensive logging
- [ ] Set up error tracking (Sentry)
- [ ] Add API documentation (drf-spectacular)
- [ ] Implement caching for frequently accessed data
- [ ] Add database query optimization

### Sprint 4: AI Preparation (Week 4)
- [ ] Collect 30+ days of snapshot data
- [ ] Implement feature engineering pipeline
- [ ] Create data export endpoints for ML
- [ ] Add AI model storage structure
- [ ] Develop model versioning strategy

### Sprint 5: AI Development (Weeks 5-6)
- [ ] Develop occupancy forecasting model
- [ ] Develop churn prediction model
- [ ] Develop payment default prediction
- [ ] Develop dynamic pricing model
- [ ] Train and validate all models

### Sprint 6: AI Integration (Weeks 7-8)
- [ ] Create AI API endpoints
- [ ] Add AI insights to owner dashboard
- [ ] Add churn risk alerts
- [ ] Add occupancy forecast charts
- [ ] Implement A/B testing framework

### Sprint 7: Advanced Features (Weeks 9-10)
- [ ] Predictive maintenance for machines
- [ ] Tenant recommendation system
- [ ] Automated payment reminders
- [ ] Smart pricing suggestions
- [ ] Seasonal demand analysis

---

## 📊 Success Metrics

### Technical Metrics
- API Response Time: < 200ms (p95)
- Database Query Time: < 50ms (p95)
- Uptime: > 99.5%
- Test Coverage: > 80%

### Business Metrics
- Occupancy Rate: Track and forecast
- Payment Collection Rate: > 95%
- Tenant Churn Rate: < 20% annually
- Average Tenant Stay: > 12 months

### AI Model Metrics
- Occupancy Forecast MAE: < 5%
- Churn Prediction Accuracy: > 80%
- Payment Default Prediction: > 75%

---

## 📁 Appendix

### Database Backup Commands
```bash
# PostgreSQL backup
docker compose exec db pg_dump -U postgres hostel_management > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U postgres hostel_management < backup_20260404.sql
```

### Useful Django Commands
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Collect static files
python manage.py collectstatic

# Run tests
python manage.py test

# Shell
python manage.py shell
```

### API Testing with cURL
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "SecurePass123"}'

# Get branches (with token)
curl http://localhost:8000/api/v2/branches/ \
  -H "Authorization: Bearer <access_token>"

# Create tenant
curl -X POST http://localhost:8000/api/v2/tenants/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "phone_number": "9876543210", "room": 1, ...}'
```

---

## 🎯 Next Steps

1. **Review this document** - Validate all information
2. **Prioritize fixes** - Address critical issues first
3. **Set up development environment** - Ensure all tools are ready
4. **Start Sprint 1** - Implement critical fixes
5. **Deploy data collection** - Start capturing analytics data
6. **Plan AI implementation** - Based on collected data quality

---

**Document Status:** COMPLETE ✅  
**Last Updated:** April 4, 2026  
**Maintained By:** Development Team  
**Review Frequency:** Monthly

---

