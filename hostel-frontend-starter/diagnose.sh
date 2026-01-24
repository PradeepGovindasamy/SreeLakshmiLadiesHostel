#!/bin/bash

echo "=========================================="
echo "FIREBASE DIAGNOSTIC - COMPREHENSIVE CHECK"
echo "=========================================="
echo ""

echo "1. Checking Firebase config files..."
find src -name "*.js" -exec grep -l "initializeApp" {} \; 2>/dev/null

echo ""
echo "2. Current firebase config content:"
cat src/config/firebase.js | grep -E "apiKey|appId|authDomain"

echo ""
echo "3. Checking all imports of auth:"
grep -r "import.*auth.*from" src/components/*.js 2>/dev/null | grep -v node_modules

echo ""
echo "4. Testing API directly..."
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=AIzaSyARytYNTnnzBsBXfHygeNVaKsb8S9Si0YI' \
  -H 'Content-Type: application/json' \
  -d '{
    "phoneNumber": "+919962820828",
    "recaptchaToken": "test-token"
  }' 2>&1

echo ""
echo ""
echo "=========================================="
echo "CRITICAL CHECKS NEEDED IN FIREBASE CONSOLE:"
echo "=========================================="
echo ""
echo "1. App Check Status:"
echo "   URL: https://console.firebase.google.com/project/srilakshmiladieshostel-daca8/appcheck"
echo "   CHECK: Is it ENABLED? If yes, DISABLE it or register your app"
echo ""
echo "2. API Key Restrictions:"
echo "   URL: https://console.cloud.google.com/apis/credentials?project=srilakshmiladieshostel-daca8"
echo "   FIND: AIzaSyARytYNTnnzBsBXfHygeNVaKsb8S9Si0YI"
echo "   CHECK: Application restrictions should be NONE"
echo "   CHECK: API restrictions should include 'Identity Toolkit API'"
echo ""
echo "3. Phone Auth Enabled:"
echo "   URL: https://console.firebase.google.com/project/srilakshmiladieshostel-daca8/authentication/providers"
echo "   CHECK: Phone should show as ENABLED"
echo ""
echo "=========================================="
