# Family Information Fields - Setup Guide

## Changes Made

### ✅ Frontend (SimpleTenants.js)
Added 6 new fields to the tenant form (stored but NOT displayed in table):
- Father's Name
- Father's Aadhar Number
- Mother's Name
- Mother's Aadhar Number
- Guardian's Name
- Guardian's Aadhar Number

**Note:** These fields appear in the add/edit dialog under "Family Information" section but are NOT shown in the main tenant list table.

### ✅ Backend (models.py)
Added 6 new database fields to the `Tenant` model:
- `father_name` (CharField, max 100 chars)
- `father_aadhar` (CharField, max 12 chars)
- `mother_name` (CharField, max 100 chars)
- `mother_aadhar` (CharField, max 12 chars)
- `guardian_name` (CharField, max 100 chars)
- `guardian_aadhar` (CharField, max 12 chars)

All fields are **optional** (blank=True, null=True).

### ✅ API (serializers.py)
Updated `TenantSerializer` to include all 6 new fields in API responses.

### ✅ Database Migration
Created migration file: `0002_add_family_info_to_tenant.py`

---

## 🚀 Next Steps

### 1. Apply Database Migration

**Important:** Run this command to add the new columns to your database:

```powershell
cd "\\wsl.localhost\Ubuntu\Consultant\projects\SreeLakshmiLadiesHostel\hostel_admin_backend"
python manage.py migrate
```

### 2. Start Backend Server

```powershell
cd "\\wsl.localhost\Ubuntu\Consultant\projects\SreeLakshmiLadiesHostel\hostel_admin_backend"
# Activate virtual environment first
.\hostel_env\Scripts\Activate.ps1
# or
.\venv\Scripts\Activate.ps1

# Then start server
python manage.py runserver
```

### 3. Start Frontend

In a new terminal:

```powershell
cd "\\wsl.localhost\Ubuntu\Consultant\projects\SreeLakshmiLadiesHostel\hostel-frontend-starter"
npm start
```

---

## ✨ Features

### Form Layout (Add/Edit Tenant Dialog)

```
┌─────────────────────────────────────┐
│ Basic Information                   │
│ - Name, Phone, Email, Address       │
├─────────────────────────────────────┤
│ Emergency Contact                   │
│ - Name & Phone                      │
├─────────────────────────────────────┤
│ Room Assignment                     │
│ - Room & Join Date                  │
├─────────────────────────────────────┤
│ Family Information (NEW)            │
│ - Father's Name & Aadhar            │
│ - Mother's Name & Aadhar            │
│ - Guardian's Name & Aadhar          │
├─────────────────────────────────────┤
│ ID Proof (Optional)                 │
│ - Type & Number                     │
└─────────────────────────────────────┘
```

### Table View (Main Tenant List)

```
┌────────┬─────────┬──────┬───────────┬────────┬─────────┐
│ Name   │ Contact │ Room │ Join Date │ Status │ Actions │
├────────┼─────────┼──────┼───────────┼────────┼─────────┤
│ ...    │ ...     │ ...  │ ...       │ ...    │ ...     │
└────────┴─────────┴──────┴───────────┴────────┴─────────┘
```

**Note:** Family information is stored in database but NOT shown in the table view as requested.

---

## 🔍 Verification

After migration, you can verify the new fields exist:

```powershell
python manage.py dbshell
```

Then in SQLite:
```sql
PRAGMA table_info(core_tenant);
```

You should see the 6 new columns: `father_name`, `father_aadhar`, `mother_name`, `mother_aadhar`, `guardian_name`, `guardian_aadhar`.

---

## 📝 API Example

When creating/updating a tenant, the API now accepts:

```json
{
  "name": "John Doe",
  "phone_number": "+919876543210",
  "email": "john@example.com",
  "father_name": "Father Name",
  "father_aadhar": "123456789012",
  "mother_name": "Mother Name",
  "mother_aadhar": "987654321098",
  "guardian_name": "Guardian Name",
  "guardian_aadhar": "456789012345",
  "room": 1,
  "joining_date": "2025-11-08"
}
```

All family fields are **optional** - you can omit them if not available.
