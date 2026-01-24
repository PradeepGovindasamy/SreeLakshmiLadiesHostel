#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
sys.path.append('/Consultant/projects/SreeLakshmiLadiesHostel/hostel_admin_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

from core.models import Room, Tenant

print("=== Current Occupancy Test ===")
print(f"Total rooms: {Room.objects.count()}")
print(f"Total tenants: {Tenant.objects.count()}")
print(f"Active tenants (no vacating_date): {Tenant.objects.filter(vacating_date__isnull=True).count()}")

print("\n=== Room Occupancy Details ===")
rooms = Room.objects.all()[:5]  # First 5 rooms
for room in rooms:
    active_tenants = room.tenants.filter(vacating_date__isnull=True)
    print(f"Room {room.room_name}: current_occupancy={room.current_occupancy}, capacity={room.sharing_type}")
    print(f"  Active tenants: {[t.id for t in active_tenants]}")

print("\n=== Create Test Tenant ===")
if Room.objects.exists():
    first_room = Room.objects.first()
    print(f"Testing with room: {first_room.room_name}")
    
    # Check if there are any tenants in this room
    existing_tenants = first_room.tenants.filter(vacating_date__isnull=True).count()
    print(f"Existing active tenants in room: {existing_tenants}")
    
    if existing_tenants == 0:
        # Create a test tenant
        from datetime import date
        test_tenant = Tenant.objects.create(
            name="Test Tenant",
            email="test@example.com",
            phone="1234567890",
            room=first_room,
            joining_date=date.today(),
            stay_type='monthly'
        )
        print(f"Created test tenant: {test_tenant.name}")
        print(f"Room {first_room.room_name} current_occupancy after tenant: {first_room.current_occupancy}")
else:
    print("No rooms found in database")
