#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Branch, Room, Tenant

print('=' * 50)
print('PostgreSQL Migration Verification')
print('=' * 50)
print(f'Users: {User.objects.count()}')
print(f'Branches: {Branch.objects.count()}')
print(f'Rooms: {Room.objects.count()}')
print(f'Tenants: {Tenant.objects.count()}')
print('=' * 50)

# List users
print('\nUsers in database:')
for user in User.objects.all():
    print(f'  - {user.username} ({user.email})')

# List branches
print('\nBranches in database:')
for branch in Branch.objects.all():
    print(f'  - {branch.name}')
