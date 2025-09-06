# Firebase Configuration for Sree Lakshmi Ladies Hostel
import firebase_admin
from firebase_admin import credentials, auth
import pyrebase
import json
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Firebase Admin SDK configuration
def initialize_firebase_admin():
    """Initialize Firebase Admin SDK"""
    try:
        # Path to your Firebase service account key
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": "srilakshmiladieshostel-daca8",
            "private_key_id": getattr(settings, 'FIREBASE_PRIVATE_KEY_ID', ''),
            "private_key": getattr(settings, 'FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
            "client_email": getattr(settings, 'FIREBASE_CLIENT_EMAIL', ''),
            "client_id": getattr(settings, 'FIREBASE_CLIENT_ID', ''),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": getattr(settings, 'FIREBASE_CLIENT_CERT_URL', '')
        })
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        logger.info("Firebase Admin SDK initialized successfully for Sree Lakshmi Ladies Hostel")
        return True
    except Exception as e:
        logger.error(f"Firebase Admin SDK initialization failed: {e}")
        return False

# Firebase Client SDK configuration for frontend
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyARytYNTnnzBsBXfHygeNVaKsb8S9Si0YI",
    "authDomain": "srilakshmiladieshostel-daca8.firebaseapp.com",
    "projectId": "srilakshmiladieshostel-daca8",
    "storageBucket": "srilakshmiladieshostel-daca8.firebasestorage.app",
    "messagingSenderId": "681210557169",
    "appId": "1:681210557169:web:5c20d69891ef895cefef50"
}

# Initialize Pyrebase for backend operations
def get_firebase_client():
    """Get Firebase client for backend operations"""
    try:
        firebase = pyrebase.initialize_app(FIREBASE_CONFIG)
        return firebase
    except Exception as e:
        logger.error(f"Firebase client initialization failed: {e}")
        return None

# Verify Firebase ID Token
def verify_firebase_token(id_token):
    """Verify Firebase ID token"""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

# Custom Firebase Authentication Backend
class FirebaseAuthentication:
    """Custom Firebase authentication backend"""
    
    def authenticate(self, request, firebase_token=None, **kwargs):
        """Authenticate user with Firebase token"""
        if not firebase_token:
            return None
        
        try:
            decoded_token = verify_firebase_token(firebase_token)
            if not decoded_token:
                return None
            
            # Get user info from Firebase token
            firebase_uid = decoded_token['uid']
            phone_number = decoded_token.get('phone_number')
            
            if not phone_number:
                logger.error("No phone number in Firebase token")
                return None
            
            # Find or create user based on phone number
            from django.contrib.auth.models import User
            from core.models import UserProfile
            
            # Try to find existing user by phone number
            try:
                profile = UserProfile.objects.get(phone_number=phone_number)
                user = profile.user
            except UserProfile.DoesNotExist:
                # Create new user
                username = f"user_{phone_number.replace('+', '').replace('-', '')}"
                user = User.objects.create_user(
                    username=username,
                    first_name=decoded_token.get('name', ''),
                )
                
                # Create profile
                profile = UserProfile.objects.create(
                    user=user,
                    phone_number=phone_number,
                    role='tenant',  # Default role
                    firebase_uid=firebase_uid
                )
            
            # Update Firebase UID if not set
            if not hasattr(profile, 'firebase_uid') or not profile.firebase_uid:
                profile.firebase_uid = firebase_uid
                profile.save()
            
            return user
            
        except Exception as e:
            logger.error(f"Firebase authentication failed: {e}")
            return None
    
    def get_user(self, user_id):
        """Get user by ID"""
        try:
            from django.contrib.auth.models import User
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
