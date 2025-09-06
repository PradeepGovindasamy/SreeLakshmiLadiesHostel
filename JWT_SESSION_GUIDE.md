# JWT Token Configuration and Session Management Guide

## Current JWT Token Lifetimes (DEFAULT SETTINGS):

### 🕐 **Access Token (Short-lived)**
- **Lifetime**: 5 minutes (300 seconds)
- **Purpose**: Used for API requests
- **Storage**: localStorage in frontend
- **Auto-refresh**: When expired, use refresh token

### 🕑 **Refresh Token (Long-lived)**  
- **Lifetime**: 1 day (24 hours)
- **Purpose**: Used to get new access tokens
- **Storage**: localStorage in frontend
- **Security**: Should be HTTP-only in production

## Frontend Session Behavior:

### ✅ **Active Session Duration:**
- User stays logged in for **24 hours** (refresh token lifetime)
- Access token refreshes automatically every 5 minutes
- No manual login required during this period

### 🔄 **Token Refresh Process:**
- Frontend automatically detects expired access tokens
- Uses refresh token to get new access tokens
- Seamless experience for users

### 🚪 **Session Expiry:**
- After 24 hours: User must login again
- If refresh token expires: Automatic logout
- Manual logout: Clears all tokens

## Current Implementation Status:

🟡 **Using Default JWT Settings** (No custom configuration found)
- Access Token: 5 minutes
- Refresh Token: 1 day
- No automatic token refresh in frontend yet

## Recommendations for Your Hostel System:

### 📱 **For Tenants (Phone OTP Users):**
- **Access Token**: 30 minutes (longer for mobile users)
- **Refresh Token**: 30 days (convenient for daily hostel access)

### 👨‍💼 **For Admin/Staff:**
- **Access Token**: 15 minutes (more secure for admin tasks)
- **Refresh Token**: 7 days (weekly re-authentication)

### 🔐 **Security Considerations:**
- **Remember Me**: Extend refresh token to 30 days
- **Automatic Logout**: On device change/suspicious activity
- **Token Rotation**: Generate new refresh tokens periodically

## How to Configure Custom JWT Settings:

Add to Django settings.py:
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}
```

## Frontend Session Monitoring:

Current frontend checks:
- ✅ Token existence in localStorage
- ✅ User authentication status
- 🟡 No automatic token refresh yet
- 🟡 No session timeout warnings

## User Experience:

### **Current Behavior:**
1. User logs in with phone OTP
2. Gets 5-minute access token + 1-day refresh token
3. Stays logged in for 24 hours
4. After 24 hours: Must login again

### **Recommended Improvements:**
1. Extend refresh token to 30 days for tenants
2. Add automatic token refresh
3. Show session timeout warnings
4. Implement "Remember Me" option
