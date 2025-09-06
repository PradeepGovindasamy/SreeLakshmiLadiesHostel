#!/usr/bin/env python
"""
Simple script to create a superuser for Django admin access
Run this after successful migration to create admin login
"""
import os
import sys
import django
from django.conf import settings

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')

# Setup Django
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile

def create_superuser():
    """Create a superuser if one doesn't exist"""
    
    # Check if superuser already exists
    if User.objects.filter(is_superuser=True).exists():
        print("Superuser already exists!")
        superuser = User.objects.filter(is_superuser=True).first()
        print(f"Username: {superuser.username}")
        print(f"Email: {superuser.email}")
        return superuser
    
    # Create superuser
    print("Creating superuser...")
    username = input("Enter username (default: admin): ") or "admin"
    email = input("Enter email (default: admin@hostel.com): ") or "admin@hostel.com"
    password = input("Enter password (default: admin123): ") or "admin123"
    
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    
    # Create or update UserProfile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'admin',
            'phone_number': '1234567890',
            'is_active': True
        }
    )
    
    if created:
        print(f"UserProfile created for {username}")
    else:
        profile.role = 'admin'
        profile.is_active = True
        profile.save()
        print(f"UserProfile updated for {username}")
    
    print("\n" + "="*50)
    print("SUPERUSER CREATED SUCCESSFULLY!")
    print("="*50)
    print(f"Username: {username}")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("Role: admin")
    print("\nYou can now login to Django Admin at:")
    print("http://127.0.0.1:8000/admin/")
    print("="*50)
    
    return user

def reset_password():
    """Reset password for existing user"""
    username = input("Enter username to reset password: ")
    try:
        user = User.objects.get(username=username)
        new_password = input("Enter new password: ")
        user.set_password(new_password)
        user.save()
        print(f"Password reset successfully for {username}")
        print(f"New password: {new_password}")
    except User.DoesNotExist:
        print(f"User '{username}' does not exist!")

def list_users():
    """List all users in the system"""
    print("\nExisting Users:")
    print("-" * 50)
    for user in User.objects.all():
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else 'No profile'
        status = "Active" if user.is_active else "Inactive"
        superuser = "Yes" if user.is_superuser else "No"
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Role: {role}")
        print(f"Active: {status}")
        print(f"Superuser: {superuser}")
        print("-" * 30)

if __name__ == "__main__":
    print("Django Admin User Management")
    print("=" * 40)
    
    while True:
        print("\nOptions:")
        print("1. Create superuser")
        print("2. Reset user password")
        print("3. List all users")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            create_superuser()
        elif choice == "2":
            reset_password()
        elif choice == "3":
            list_users()
        elif choice == "4":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")
