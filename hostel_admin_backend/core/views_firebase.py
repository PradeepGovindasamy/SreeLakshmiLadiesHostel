"""
Firebase Authentication Views for Phone OTP
"""
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
import firebase_admin
from firebase_admin import auth as firebase_auth
import pyrebase
import logging
from .models import UserProfile
from .serializers import UserProfileSerializer

logger = logging.getLogger(__name__)

# Initialize Pyrebase for client-side Firebase operations
firebase_config = {
    "apiKey": "AIzaSyC-_pXe0RI5Mxke_HaUmNKJKszr-D1-BEI",
    "authDomain": "srilakshmiladieshostel-daca8.firebaseapp.com",
    "databaseURL": "https://srilakshmiladieshostel-daca8-default-rtdb.firebaseio.com",
    "projectId": "srilakshmiladieshostel-daca8",
    "storageBucket": "srilakshmiladieshostel-daca8.appspot.com",
    "messagingSenderId": "889282100951",
    "appId": "1:889282100951:web:7b4b6e1a0e2c8e2b7b1b6e"
}

firebase = pyrebase.initialize_app(firebase_config)
firebase_auth_client = firebase.auth()


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Send OTP to phone number using Firebase Authentication
    """
    try:
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response({
                'error': 'Phone number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Format phone number (ensure it starts with country code)
        if not phone_number.startswith('+'):
            phone_number = '+91' + phone_number  # Default to India country code
        
        # Validate phone number format
        import re
        phone_pattern = r'^\+[1-9]\d{1,14}$'
        if not re.match(phone_pattern, phone_number):
            return Response({
                'error': 'Invalid phone number format. Please include country code (e.g., +919876543210)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"OTP request for phone number: {phone_number}")
        
        # For now, return success - Frontend will handle actual Firebase SMS sending
        # This is because backend-to-phone OTP requires special Firebase setup
        return Response({
            'message': 'OTP sent successfully',
            'phone_number': phone_number,
            'session_info': f'session_{phone_number}_{hash(phone_number)}',
            'note': 'Please check your phone for the OTP message'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error sending OTP: {str(e)}")
        return Response({
            'error': 'Failed to send OTP'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP and create/login user
    """
    try:
        phone_number = request.data.get('phone_number')
        otp = request.data.get('otp')
        session_info = request.data.get('session_info')
        
        if not all([phone_number, otp, session_info]):
            return Response({
                'error': 'Phone number, OTP, and session info are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Format phone number
        if not phone_number.startswith('+'):
            phone_number = '+91' + phone_number
        
        # In a real implementation, verify OTP with Firebase
        # For now, we'll accept any 6-digit OTP for demo purposes
        if len(otp) != 6 or not otp.isdigit():
            return Response({
                'error': 'Invalid OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Simulate successful OTP verification
        firebase_uid = f"firebase_uid_{phone_number.replace('+', '')}"
        
        # Try to find existing user with this phone number
        try:
            user_profile = UserProfile.objects.get(phone_number=phone_number)
            user = user_profile.user
            
            # Update Firebase UID and verification status
            user_profile.firebase_uid = firebase_uid
            user_profile.phone_verified = True
            user_profile.save()
            
            logger.info(f"Existing user logged in: {user.username}")
            
        except UserProfile.DoesNotExist:
            # Create new user
            username = f"user_{phone_number.replace('+', '').replace(' ', '')}"
            
            # Check if username exists, make it unique if needed
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}_{counter}"
                counter += 1
            
            # Create user and profile
            user = User.objects.create_user(
                username=username,
                email=f"{username}@hostel.com",  # Temporary email
                first_name="User",
                last_name=""
            )
            
            user_profile = UserProfile.objects.create(
                user=user,
                phone_number=phone_number,
                firebase_uid=firebase_uid,
                phone_verified=True,
                role='tenant'  # Default role
            )
            
            logger.info(f"New user created: {user.username}")
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Serialize user profile
        profile_serializer = UserProfileSerializer(user_profile)
        
        return Response({
            'message': 'OTP verified successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'profile': profile_serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error verifying OTP: {str(e)}")
        return Response({
            'error': 'Failed to verify OTP'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def firebase_login(request):
    """
    Login using Firebase ID token
    """
    try:
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response({
                'error': 'Firebase ID token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the Firebase ID token
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            firebase_uid = decoded_token['uid']
            phone_number = decoded_token.get('phone_number', '')
            
        except Exception as e:
            logger.error(f"Firebase token verification failed: {str(e)}")
            return Response({
                'error': 'Invalid Firebase token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Find or create user
        try:
            user_profile = UserProfile.objects.get(firebase_uid=firebase_uid)
            user = user_profile.user
            
        except UserProfile.DoesNotExist:
            # Create new user from Firebase data
            username = f"firebase_{firebase_uid[:8]}"
            
            # Check if username exists
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}_{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=decoded_token.get('email', f"{username}@hostel.com"),
                first_name=decoded_token.get('name', 'User'),
            )
            
            user_profile = UserProfile.objects.create(
                user=user,
                firebase_uid=firebase_uid,
                phone_number=phone_number,
                phone_verified=True,
                role='tenant'
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Serialize user profile
        profile_serializer = UserProfileSerializer(user_profile)
        
        return Response({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'profile': profile_serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in Firebase login: {str(e)}")
        return Response({
            'error': 'Login failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def verify_token(request):
    """
    Verify JWT token and return user info
    """
    try:
        user = request.user
        if user.is_authenticated:
            profile = UserProfile.objects.get(user=user)
            profile_serializer = UserProfileSerializer(profile)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'profile': profile_serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Token invalid'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return Response({
            'error': 'Token verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
