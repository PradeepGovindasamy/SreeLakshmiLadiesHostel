from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Branch, Room, Tenant
from django.utils import timezone

class Command(BaseCommand):
    help = 'Populate sample data for testing'

    def handle(self, *args, **options):
        # Create or get admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@hostel.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(f'Created admin user: admin/admin123')

        # Create sample branches
        branches_data = [
            {
                'name': 'Sree Lakshmi Ladies Hostel - Main Branch',
                'address': '123 Main Street, City Center',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001',
                'description': 'Main branch with excellent facilities',
                'contact_phone': '+91-9876543210',
                'contact_email': 'main@sreelakshmi.com',
                'property_type': 'ladies_hostel',
                'total_floors': 3,
                'num_rooms': 50,
                'num_bathrooms': 15,
                'has_wifi': True,
                'has_security': True,
                'has_mess': True,
                'owner': admin_user
            },
            {
                'name': 'Sree Lakshmi Ladies Hostel - Branch 2',
                'address': '456 Park Avenue, Green Area',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560002',
                'description': 'Second branch with modern amenities',
                'contact_phone': '+91-9876543211',
                'contact_email': 'branch2@sreelakshmi.com',
                'property_type': 'ladies_hostel',
                'total_floors': 2,
                'num_rooms': 30,
                'num_bathrooms': 10,
                'has_wifi': True,
                'has_security': True,
                'has_mess': True,
                'owner': admin_user
            }
        ]

        for branch_data in branches_data:
            branch, created = Branch.objects.get_or_create(
                name=branch_data['name'],
                defaults=branch_data
            )
            if created:
                self.stdout.write(f'Created branch: {branch.name}')
                
                # Create sample rooms for each branch
                for i in range(1, 6):  # Create 5 sample rooms
                    room_data = {
                        'branch': branch,
                        'room_name': f'Room {i:03d}',
                        'sharing_type': 2 if i % 2 == 0 else 3,  # Mix of 2-sharing and 3-sharing
                        'attached_bath': i % 3 == 0,  # Every 3rd room has attached bath
                        'ac_room': i % 2 == 0,  # Every 2nd room has AC
                        'rent': 8000 if i % 2 == 0 else 6000,  # Different rent for AC/non-AC
                        'is_occupied': False
                    }
                    
                    room, room_created = Room.objects.get_or_create(
                        branch=branch,
                        room_name=room_data['room_name'],
                        defaults=room_data
                    )
                    
                    if room_created:
                        self.stdout.write(f'  Created room: {room.room_name}')

        self.stdout.write(self.style.SUCCESS('Sample data populated successfully!'))
        self.stdout.write('You can now access the admin panel at http://localhost:8000/admin')
        self.stdout.write('Username: admin, Password: admin123')
