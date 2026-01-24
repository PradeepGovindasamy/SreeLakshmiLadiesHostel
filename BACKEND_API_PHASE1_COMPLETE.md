# Backend API Documentation - Phase 1 Complete

## 🎉 **What We've Built**

### **New Authentication Endpoints**
Your frontend can now communicate properly with the backend using these endpoints:

```bash
# Authentication (exactly what your frontend expects)
POST /api/auth/login/          # Login with username/password
GET  /api/auth/user/           # Get current user details  
GET  /api/auth/profile/        # Get current user profile
PUT  /api/auth/profile/        # Update current user profile
POST /api/auth/token/          # Get JWT tokens (enhanced)
GET  /api/auth/branches/       # Get available branches for user
```

### **User Management (NEW)**
```bash
# Create users with profiles in one step
POST /api/users/create_with_profile/
GET  /api/users/               # List users (role-filtered)
GET  /api/users/{id}/          # Get specific user
PATCH /api/users/{id}/update_profile/  # Update user profile
```

### **Enhanced Role-Based Endpoints**
```bash
# Enhanced endpoints with role-based filtering
GET  /api/v2/branches/         # Branches (filtered by role)
GET  /api/v2/rooms/            # Rooms (filtered by role)  
GET  /api/v2/tenants/          # Tenants (filtered by role)
GET  /api/v2/occupancy/        # Occupancy (filtered by role)
GET  /api/v2/payments/         # Payments (filtered by role)

# Special actions
GET  /api/v2/branches/{id}/occupancy_stats/  # Branch statistics
GET  /api/v2/rooms/{id}/availability/        # Room availability
POST /api/v2/tenants/{id}/checkout/          # Checkout tenant
GET  /api/v2/payments/monthly_summary/       # Payment summary
```

### **Legacy Endpoints (Backward Compatible)**
```bash
# Original endpoints still work
GET  /api/branches/
GET  /api/rooms/
GET  /api/tenants/
GET  /api/occupancy/
GET  /api/payments/
```

## 🔐 **Role-Based Access Control**

### **Owner Role:**
- ✅ Can see all branches they own
- ✅ Can see all rooms in their branches
- ✅ Can see all tenants in their branches
- ✅ Can create/edit branches, rooms, tenants
- ✅ Can view all payment records for their properties

### **Warden Role:**
- ✅ Can see branches they're assigned to
- ✅ Can manage rooms and tenants in assigned branches
- ✅ Can view payments (if permissions allow)
- ✅ Limited to assigned properties only

### **Tenant Role:**
- ✅ Can see their own records only
- ✅ Can view available rooms/branches
- ✅ Can see their payment history
- ✅ Cannot modify other tenants' data

### **Admin Role:**
- ✅ Full access to everything
- ✅ Can manage all users and properties

## 📝 **API Usage Examples**

### **1. Create User with Profile (Frontend Integration)**
```javascript
// Your frontend can now create users in one step
const userData = {
  username: "rama_owner",
  password: "securePassword123",
  email: "rama@example.com",
  first_name: "Rama",
  last_name: "Devi",
  profile: {
    role: "owner",
    phone_number: "9876543210",
    business_name: "Sree Lakshmi Properties",
    branch: 1  // Assign to branch
  }
};

const response = await api.post('/api/users/create_with_profile/', userData);
```

### **2. Enhanced Login Response**
```javascript
// Login now returns complete user info
const loginResponse = await api.post('/api/auth/login/', {
  username: "rama_owner",
  password: "securePassword123"
});

// Response includes:
{
  "access": "eyJ0eXAiOiJKV1Q...",
  "refresh": "eyJ0eXAiOiJKV1Q...",
  "user": {
    "id": 1,
    "username": "rama_owner", 
    "email": "rama@example.com",
    "first_name": "Rama",
    "last_name": "Devi"
  },
  "profile": {
    "role": "owner",
    "role_display": "Property Owner",
    "phone_number": "9876543210",
    "branch_id": 1,
    "branch_name": "Main Branch"
  }
}
```

### **3. Role-Filtered Data**
```javascript
// Owners see all their branches
GET /api/v2/branches/  // Returns branches owned by current user

// Wardens see assigned branches only  
GET /api/v2/branches/  // Returns branches assigned to warden

// Tenants see all available branches
GET /api/v2/branches/  // Returns all active branches for selection
```

## 🚀 **Testing Your Setup**

### **Step 1: Start Backend Server**
```bash
# In your Ubuntu terminal
cd /Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend
source hostel_env/bin/activate
python manage.py runserver
```

### **Step 2: Test Authentication Endpoints**
```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "kavitha", "password": "your_password"}'

# Test user creation
curl -X POST http://localhost:8000/api/users/create_with_profile/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "test_owner",
    "password": "test123",
    "email": "test@example.com", 
    "first_name": "Test",
    "last_name": "Owner",
    "profile": {
      "role": "owner",
      "phone_number": "1234567890"
    }
  }'
```

### **Step 3: Test Role-Based Access**
```bash
# Get branches (filtered by role)
curl -X GET http://localhost:8000/api/v2/branches/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get branch statistics
curl -X GET http://localhost:8000/api/v2/branches/1/occupancy_stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 **Frontend Integration Steps**

### **1. Update API Base URL**
Your frontend's `api.js` should point to the enhanced endpoints:
```javascript
// Use enhanced endpoints for better role-based filtering
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',  // ✅ This works
});
```

### **2. Login Integration**
Your existing `UserContext.login()` should work perfectly with:
```javascript
const response = await api.post('/api/auth/login/', { username, password });
// This will return user + profile data
```

### **3. User Creation Forms**  
Add forms to create users with profiles:
```javascript
const createUser = async (userData) => {
  return await api.post('/api/users/create_with_profile/', userData);
};
```

## ✅ **What's Ready for Frontend**

1. **✅ Authentication**: Login, user details, profile management
2. **✅ User Management**: Create users with roles in one step  
3. **✅ Role-Based Data**: Filtered branches, rooms, tenants
4. **✅ Enhanced APIs**: Statistics, availability checks, actions
5. **✅ Backward Compatibility**: Existing frontend code still works

## 🎯 **Next Steps**

Ready to update your frontend to use these new capabilities? I can help you:

1. **Update existing components** to use enhanced endpoints
2. **Create user management forms** for Owner/Warden/Tenant creation
3. **Add role-based features** to your dashboard components
4. **Test the complete integration** between frontend and backend

**Your backend is now fully equipped to handle everything your frontend needs!** 🚀

Let me know which frontend updates you'd like to tackle first!
