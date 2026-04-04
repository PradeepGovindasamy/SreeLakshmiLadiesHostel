from django.core.management.base import BaseCommand
from core.models import Room, Tenant


class Command(BaseCommand):
    help = 'Test room status calculation'

    def handle(self, *args, **options):
        self.stdout.write('Testing Room Status Calculation...')
        self.stdout.write('=' * 50)
        
        # Get all rooms
        rooms = Room.objects.all()[:5]  # Test first 5 rooms
        
        for room in rooms:
            self.stdout.write(f'\nRoom: {room.room_name} ({room.branch.name})')
            self.stdout.write(f'Sharing Type: {room.sharing_type}')
            self.stdout.write(f'Current Occupancy: {room.current_occupancy}')
            self.stdout.write(f'Is Available: {room.is_available}')
            self.stdout.write(f'Is Full: {room.is_full}')
            self.stdout.write(f'Status: {room.status}')
            
            # Check tenants
            active_tenants = room.tenants.filter(joining_date__isnull=False, vacating_date__isnull=True)
            self.stdout.write(f'Active Tenants: {active_tenants.count()}')
            for tenant in active_tenants:
                self.stdout.write(f'  - {tenant.name} (Joined: {tenant.joining_date})')
            
            self.stdout.write('-' * 30)
        
        self.stdout.write(self.style.SUCCESS('Room status test completed!'))
