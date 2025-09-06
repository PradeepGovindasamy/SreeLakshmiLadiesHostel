#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('\\\\wsl.localhost\\Ubuntu\\Consultant\\projects\\SreeLakshmiLadiesHostel\\hostel_admin_backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel_admin.settings')
django.setup()

from core.models import Room, Tenant

def test_room_status():
    print("Testing Room Status Calculation...")
    print("=" * 50)
    
    # Get all rooms
    rooms = Room.objects.all()[:5]  # Test first 5 rooms
    
    for room in rooms:
        print(f"\nRoom: {room.room_name} ({room.branch.name})")
        print(f"Sharing Type: {room.sharing_type}")
        print(f"Current Occupancy: {room.current_occupancy}")
        print(f"Is Available: {room.is_available}")
        print(f"Is Full: {room.is_full}")
        print(f"Status: {room.status}")
        
        # Check tenants
        active_tenants = room.tenants.filter(joining_date__isnull=False, vacating_date__isnull=True)
        print(f"Active Tenants: {active_tenants.count()}")
        for tenant in active_tenants:
            print(f"  - {tenant.name} (Joined: {tenant.joining_date})")
        
        print("-" * 30)

if __name__ == "__main__":
    test_room_status()
