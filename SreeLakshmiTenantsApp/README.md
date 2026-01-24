# Sree Lakshmi Tenants App - React Native Mobile Application

A React Native mobile application for hostel tenant registration with Firebase OTP authentication and Django REST API backend integration.

## Features

- 📱 Phone number + Firebase OTP authentication
- 👤 Tenant registration with personal details
- 🏢 Browse properties and rooms
- 📄 Document upload (ID proof, photos)
- 📊 View room availability and details
- 👨‍👩‍👧 Family information management

## Tech Stack

- **React Native** 0.73+
- **TypeScript** for type safety
- **React Navigation** 6.x for routing
- **Firebase Authentication** for OTP
- **Axios** for API calls
- **AsyncStorage** for local data persistence
- **React Native Paper** for UI components
- **React Hook Form** for form management

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **React Native CLI**: `npm install -g react-native-cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **JDK** 11 or later

## Project Structure

```
SreeLakshmiTenantsApp/
├── src/
│   ├── screens/          # All application screens
│   │   ├── auth/         # Login, OTP verification
│   │   ├── registration/ # Tenant registration flow
│   │   ├── property/     # Property and room browsing
│   │   └── profile/      # User profile management
│   ├── components/       # Reusable UI components
│   ├── api/              # API service layer
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── navigation/       # Navigation setup
│   ├── utils/            # Helper functions
│   ├── config/           # Configuration files
│   └── types/            # TypeScript type definitions
├── android/              # Android native code
├── ios/                  # iOS native code
└── App.tsx              # Root component
```

## Installation

### 1. Clone and Install Dependencies

```bash
cd SreeLakshmiTenantsApp
npm install
# or
yarn install
```

### 2. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Configure Backend API

Edit `src/config/api.ts` and update the BASE_URL:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_BACKEND_IP:8000', // Replace with your Django backend URL
  TIMEOUT: 30000,
};
```

**Note:** For Android emulator, use `http://10.0.2.2:8000` if backend is on localhost.

### 4. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Phone Authentication** in Firebase Console
3. Download `google-services.json` (Android) and place it in `android/app/`
4. Download `GoogleService-Info.plist` (iOS) and place it in `ios/`
5. Update `src/config/firebase.ts` with your Firebase credentials

## Running the App

### Android

```bash
# Start Metro bundler
npm start

# In a new terminal, run Android app
npm run android
# or
npx react-native run-android
```

### iOS (macOS only)

```bash
# Start Metro bundler
npm start

# In a new terminal, run iOS app
npm run ios
# or
npx react-native run-ios
```

## Backend API Endpoints

The app integrates with the following Django REST API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/send-otp/` | POST | Send OTP to phone number |
| `/api/auth/verify-otp/` | POST | Verify OTP and get auth token |
| `/api/v2/branches/` | GET | List all properties |
| `/api/v2/branches/{id}/` | GET | Get property details |
| `/api/v2/rooms/` | GET | List rooms (with filters) |
| `/api/v2/rooms/{id}/` | GET | Get room details |
| `/api/v2/tenants/` | POST | Create tenant registration |
| `/api/v2/tenants/{id}/` | GET/PUT | Get/Update tenant details |

## Key Features Implementation

### Authentication Flow

1. User enters phone number
2. Firebase sends OTP via SMS
3. User enters OTP code
4. Backend verifies OTP and returns JWT token
5. Token stored in AsyncStorage
6. Token automatically added to all API requests

### Tenant Registration

Multi-step registration process:
1. Personal information
2. Emergency contacts
3. ID proof upload
4. Family information
5. Room selection
6. Review and submit

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building APK (Android)

```bash
cd android
./gradlew assembleRelease
```

The APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
npm start -- --reset-cache
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

## Environment Variables

Create a `.env` file in the root directory:

```
API_BASE_URL=http://YOUR_BACKEND_IP:8000
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on both Android and iOS
4. Submit a pull request

## License

Copyright © 2026 Sree Lakshmi Ladies Hostel

## Support

For issues and questions, please contact the development team.

---

**Note:** Make sure to replace placeholder values (API URLs, Firebase credentials) with actual values before deploying to production.
