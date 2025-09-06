# Firebase Phone OTP Authentication Setup Guide

## Prerequisites
✅ Firebase project created  
✅ Phone authentication enabled in Firebase Console  
✅ Required packages installed (firebase-admin, pyrebase4)

## Step 1: Firebase Console Setup

### 1.1 Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Enable **Phone** authentication
5. Add your domain to authorized domains (e.g., `localhost` for development)

### 1.2 Create Service Account
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file (keep it secure!)

### 1.3 Get Firebase Config
1. Go to **Project Settings** → **General**
2. In "Your apps" section, click **Web app** configuration
3. Copy the config object

## Step 2: Configure Django Settings

Update `hostel_admin/settings.py` with your Firebase credentials:

```python
# Firebase Configuration
FIREBASE_PROJECT_ID = 'your-hostel-project-id'  # From Project Settings
FIREBASE_API_KEY = 'AIzaSyC...'  # From Firebase config
FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com'  # From service account JSON
FIREBASE_CLIENT_ID = '12345...'  # From service account JSON
FIREBASE_PRIVATE_KEY_ID = 'abcd1234...'  # From service account JSON
FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0...'  # From service account JSON (keep \\n)
FIREBASE_CLIENT_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...'  # From service account JSON
FIREBASE_MESSAGING_SENDER_ID = '12345...'  # From Firebase config
FIREBASE_APP_ID = '1:12345:web:abcd...'  # From Firebase config
```

## Step 3: Service Account JSON Setup

Place your service account JSON file in a secure location and update the path in `core/firebase_auth.py`:

```python
# Update this path to your service account JSON file
SERVICE_ACCOUNT_PATH = '/path/to/your/service-account-key.json'
```

## Step 4: Test Firebase Setup

1. Start Django server:
```bash
python manage.py runserver
```

2. Test OTP endpoints:
```bash
# Send OTP
curl -X POST http://localhost:8000/auth/send-otp/ \\
  -H "Content-Type: application/json" \\
  -d '{"phone_number": "+919876543210"}'

# Verify OTP
curl -X POST http://localhost:8000/auth/verify-otp/ \\
  -H "Content-Type: application/json" \\
  -d '{"phone_number": "+919876543210", "otp": "123456", "session_info": "session_from_send_otp"}'
```

## Step 5: Frontend Integration

The React component `FirebasePhoneAuth.js` is already created. Use it in your app:

```jsx
import FirebasePhoneAuth from './components/FirebasePhoneAuth';

function App() {
  const handleAuthSuccess = (data) => {
    console.log('User authenticated:', data);
    // Handle successful authentication
    // Store tokens, redirect, etc.
  };

  return (
    <FirebasePhoneAuth onAuthSuccess={handleAuthSuccess} />
  );
}
```

## Available Endpoints

After setup, these endpoints will be available:

- **POST** `/auth/send-otp/` - Send OTP to phone number
- **POST** `/auth/verify-otp/` - Verify OTP and login/register
- **POST** `/auth/firebase-login/` - Login with Firebase ID token
- **GET** `/auth/verify-token/` - Verify JWT token

## Security Notes

1. **Never commit service account JSON** to version control
2. **Use environment variables** for production
3. **Enable Firebase App Check** for production
4. **Set up proper CORS** for your domain
5. **Use HTTPS** in production

## Troubleshooting

### Common Issues:

1. **"No module named 'firebase_admin'"**
   - Run: `pip install firebase-admin pyrebase4`

2. **"Invalid project ID"**
   - Check FIREBASE_PROJECT_ID in settings.py

3. **"Phone number verification failed"**
   - Ensure phone authentication is enabled in Firebase Console
   - Check phone number format (+country_code + number)

4. **"Service account key not found"**
   - Update SERVICE_ACCOUNT_PATH in firebase_auth.py
   - Ensure JSON file permissions are correct

### Testing with Phone Numbers:

For testing, Firebase provides test phone numbers:
- Phone: `+1 555-555-5555`
- OTP: `123456`

Add these in Firebase Console → Authentication → Sign-in method → Phone → Test phone numbers

## Next Steps

1. Update Firebase configuration with your actual values
2. Place service account JSON file securely
3. Test OTP flow
4. Integrate with your frontend forms
5. Set up production Firebase App Check and security rules
