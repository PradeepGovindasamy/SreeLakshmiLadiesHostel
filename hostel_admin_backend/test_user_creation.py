#!/usr/bin/env python
"""
Test script to check user creation endpoint
"""
import os
import sys
import django
import requests
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

def test_user_creation_endpoint():
    """Test the user creation endpoint"""
    
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/api/users/create_with_profile/"
    
    # Test data
    test_data = {
        "username": "testuser123",
        "password": "testpass123",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "profile": {
            "role": "owner",
            "phone_number": "1234567890"
        }
    }
    
    print(f"Testing endpoint: {endpoint}")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Check if server is running
        health_response = requests.get(f"{base_url}/api/health/", timeout=5)
        print(f"Health check: {health_response.status_code}")
        
        # Test the user creation endpoint
        response = requests.post(
            endpoint, 
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 405:
            print("❌ Method Not Allowed - Action not properly registered")
        elif response.status_code == 404:
            print("❌ Not Found - URL routing issue")
        elif response.status_code == 401:
            print("❌ Unauthorized - Permission issue")
        elif response.status_code in [200, 201]:
            print("✅ Success")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Error {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is Django running on port 8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_user_creation_endpoint()
