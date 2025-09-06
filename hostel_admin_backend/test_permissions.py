#!/usr/bin/env python
"""
Test script to verify permission fixes for branch creation
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, Branch
from core.permissions import IsOwnerOrReadOnly
from rest_framework.test import APIRequestFactory
from unittest.mock import Mock

def test_permissions():
    print("=== Testing Permission Fixes ===\n")
    
    # Create a test user
    test_user = User.objects.create_user(
        username='testowner',
        email='test@example.com',
        password='testpass123'
    )
    
    # Create user profile
    profile = UserProfile.objects.create(
        user=test_user,
        role='owner',
        phone_number='1234567890'
    )
    
    print(f"Created test user: {test_user.username}")
    print(f"User profile role: {profile.role}")
    print(f"Profile attribute access: {getattr(test_user, 'profile', 'NOT FOUND')}")
    
    # Test permission class
    factory = APIRequestFactory()
    request = factory.post('/api/v2/branches/', {
        'name': 'Test Branch',
        'address': 'Test Address'
    })
    request.user = test_user
    
    # Create mock view
    view = Mock()
    view.__class__.__name__ = 'BranchViewSet'
    
    # Test permission
    permission = IsOwnerOrReadOnly()
    has_permission = permission.has_permission(request, view)
    
    print(f"\nPermission test result: {has_permission}")
    
    if has_permission:
        print("✅ SUCCESS: Owner can create branches")
    else:
        print("❌ FAILED: Owner cannot create branches")
    
    # Test branch creation
    try:
        branch = Branch.objects.create(
            name='Test Branch',
            address='Test Address',
            owner=test_user
        )
        print(f"✅ SUCCESS: Branch created successfully: {branch.name}")
    except Exception as e:
        print(f"❌ FAILED: Branch creation failed: {e}")
    
    # Cleanup
    test_user.delete()
    print("\n=== Test completed ===")

if __name__ == '__main__':
    test_permissions()
