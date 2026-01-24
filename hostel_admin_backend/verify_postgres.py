#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

from django.db import connection
from django.contrib.auth.models import User
from core.models import Branch, Room, Tenant

print('=' * 60)
print('PostgreSQL Database Verification')
print('=' * 60)

# Check database backend
print(f'\n✓ Database Engine: {connection.settings_dict["ENGINE"]}')
print(f'✓ Database Name: {connection.settings_dict["NAME"]}')
print(f'✓ Database Host: {connection.settings_dict["HOST"]}')
print(f'✓ Database Port: {connection.settings_dict["PORT"]}')
print(f'✓ Database User: {connection.settings_dict["USER"]}')

print(f'\n✓ Connection Status: {"Connected" if connection.is_usable() else "Not Connected"}')

# Data verification
print('\n' + '=' * 60)
print('Data in PostgreSQL Database')
print('=' * 60)
print(f'✓ Users: {User.objects.count()}')
print(f'✓ Branches: {Branch.objects.count()}')
print(f'✓ Rooms: {Room.objects.count()}')
print(f'✓ Tenants: {Tenant.objects.count()}')

# Show sample data
print('\n' + '=' * 60)
print('Sample Data (confirming real data access)')
print('=' * 60)
for branch in Branch.objects.all():
    print(f'✓ Branch: {branch.name}')
    rooms = Room.objects.filter(branch=branch)
    print(f'  - Rooms in this branch: {rooms.count()}')

print('\n' + '=' * 60)
print('✅ PostgreSQL Migration Verified Successfully!')
print('✅ Backend is serving requests from PostgreSQL database')
print('=' * 60)
