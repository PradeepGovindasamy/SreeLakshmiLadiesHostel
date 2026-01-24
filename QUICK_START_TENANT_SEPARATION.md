# Quick Start: Active/Vacated Tenant Separation

## 🚀 Quick Start (5 Minutes)

### Step 1: Apply Database Migrations
```bash
cd hostel_admin_backend
python manage.py makemigrations core
python manage.py migrate
```

### Step 2: Update Frontend Routing

**Option A: Replace existing (Recommended)**
```javascript
// src/App.js
import TenantsPage from './components/tenants/TenantsPage';

<Route path="/tenants" element={<TenantsPage />} />
```

**Option B: Test alongside old version**
```javascript
import TenantsPage from './components/tenants/TenantsPage';
import Tenants from './components/Tenants';

<Route path="/tenants" element={<Tenants />} />
<Route path="/tenants-v2" element={<TenantsPage />} />
```

### Step 3: Restart Services
```bash
# Backend (if running)
python manage.py runserver

# Frontend
cd hostel-frontend-starter
npm start
```

### Step 4: Test
1. Navigate to `/tenants` or `/tenants-v2`
2. See two tabs: "Active Tenants" and "Vacated Tenants"
3. Test searching, filtering, and pagination

---

## 📊 What Changed

### Backend
- ✅ Status filtering: `?status=active` / `?status=vacated`
- ✅ Pagination for vacated tenants
- ✅ Database indexes for performance
- ✅ New actions: `checkout()`, `reactivate()`

### Frontend
- ✅ Tabbed UI (Material-UI)
- ✅ Lazy loading per tab
- ✅ Read-only vacated view
- ✅ Enhanced tenant details

---

## 🔍 Key Files Changed

```
hostel_admin_backend/
├── core/
│   ├── views_rbac.py          # ✅ Updated
│   └── models.py              # ✅ Updated (indexes)

hostel-frontend-starter/
├── src/
│   ├── api.js                 # ✅ Updated
│   └── components/
│       └── tenants/           # ✅ NEW
│           ├── TenantsPage.jsx
│           ├── ActiveTenantsTab.jsx
│           ├── VacatedTenantsTab.jsx
│           ├── TenantTable.jsx
│           └── TenantDetailsDialog.jsx
```

---

## 🎯 Usage Examples

### Active Tenants
- **Load instantly** (<200 records)
- **Full CRUD** operations
- **Add, Edit, Checkout, Delete**

### Vacated Tenants
- **Paginated** (25 per page)
- **Read-only** historical view
- **View details** only

---

## 📚 Documentation

- **Full Architecture**: [TENANT_MANAGEMENT_SCALABLE_SOLUTION.md](TENANT_MANAGEMENT_SCALABLE_SOLUTION.md)
- **Implementation Details**: [TENANT_SEPARATION_IMPLEMENTATION.md](TENANT_SEPARATION_IMPLEMENTATION.md)

---

## ✅ Checklist

- [ ] Migrations applied
- [ ] Backend restarted
- [ ] Frontend routing updated
- [ ] Frontend restarted
- [ ] Tested Active tab
- [ ] Tested Vacated tab
- [ ] Tested pagination
- [ ] Tested search/filters

---

## 🆘 Troubleshooting

**Issue**: Tabs not showing
- **Fix**: Check routing in App.js

**Issue**: API errors
- **Fix**: Verify migrations ran: `python manage.py showmigrations core`

**Issue**: Pagination not working
- **Fix**: Check backend logs for errors

**Issue**: Old tenant list showing
- **Fix**: Clear browser cache, hard refresh (Ctrl+Shift+R)

---

Ready to use! 🎉
