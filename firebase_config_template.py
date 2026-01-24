# Firebase Configuration Template
# 
# Replace these placeholder values with your actual Firebase project details:
#
# 1. Go to Firebase Console → Project Settings → General
# 2. Copy values from "Your apps" web app configuration
# 3. Go to Service accounts tab and download service account JSON
# 4. Update the values below:

FIREBASE_CONFIG_TEMPLATE = {
    'project_id': 'your-hostel-project-id',  # From Firebase Console → Project Settings
    'api_key': 'AIzaSyC...',  # From Firebase web app config
    'auth_domain': 'your-project.firebaseapp.com',  # From Firebase web app config
    'messaging_sender_id': '123456789',  # From Firebase web app config
    'app_id': '1:123456789:web:abc123...',  # From Firebase web app config
    
    # Service Account Details (from downloaded JSON):
    'client_email': 'firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com',
    'client_id': '123456789...',
    'private_key_id': 'abc123def456...',
    'private_key': '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0...',
    'client_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...'
}

# Quick Setup Steps:
# 1. Update hostel_admin/settings.py with your values
# 2. Place service account JSON file in secure location
# 3. Update SERVICE_ACCOUNT_PATH in core/firebase_auth.py
# 4. Test with: python manage.py runserver
