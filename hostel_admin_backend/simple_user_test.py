#!/usr/bin/env python
"""
Minimal test endpoint to verify user creation is working
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from core.models import UserProfile
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def simple_user_create(request):
    """Very simple user creation endpoint for testing"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({'error': 'Username and password required'}, status=400)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=data.get('email', ''),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )
        
        # Create profile
        profile_data = data.get('profile', {})
        profile = UserProfile.objects.create(
            user=user,
            role=profile_data.get('role', 'owner'),
            phone_number=profile_data.get('phone_number', '')
        )
        
        return JsonResponse({
            'success': True,
            'user_id': user.id,
            'username': user.username,
            'profile_role': profile.role,
            'message': 'User created successfully'
        }, status=201)
        
    except Exception as e:
        logger.error(f"Error in simple user creation: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

# This can be called directly
if __name__ == '__main__':
    print("Simple user creation function ready")
