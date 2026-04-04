from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Room, Tenant


class Command(BaseCommand):
    help = 'Update room status based on current occupancy'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            dest='dry_run',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write('Updating room status based on current occupancy...')
        
        rooms = Room.objects.all()
        updated_count = 0
        
        with transaction.atomic():
            for room in rooms:
                # Get current active tenants count
                current_occupancy = room.current_occupancy
                old_status = room.status
                
                # Calculate what the status should be
                if not room.is_available:
                    new_status = 'maintenance'
                elif current_occupancy == 0:
                    new_status = 'available'
                elif room.is_full:
                    new_status = 'occupied'
                else:
                    new_status = 'available'
                
                if old_status != new_status:
                    self.stdout.write(
                        f'Room {room.room_name} ({room.branch.name}): '
                        f'Occupancy {current_occupancy}/{room.sharing_type}, '
                        f'Status: {old_status} -> {new_status}'
                    )
                    
                    if not dry_run:
                        # The status is a property, so we don't need to save it
                        # Just trigger the room's update_availability method
                        room.update_availability()
                        updated_count += 1
                else:
                    self.stdout.write(
                        f'Room {room.room_name} ({room.branch.name}): '
                        f'Status already correct ({old_status})'
                    )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would have updated status for {len(rooms)} rooms'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated status for {updated_count} rooms'
                )
            )
