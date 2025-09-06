# Management command to set up role-based access control
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from core.models import UserProfile, Branch, WardenAssignment
import getpass


class Command(BaseCommand):
    help = 'Set up role-based access control system with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-admin',
            action='store_true',
            help='Create an admin user',
        )
        parser.add_argument(
            '--migrate-existing-data',
            action='store_true',
            help='Migrate existing user data to new role system',
        )
        parser.add_argument(
            '--setup-sample-data',
            action='store_true',
            help='Create sample data for testing',
        )

    def handle(self, *args, **options):
        """Main command handler"""
        self.stdout.write(
            self.style.SUCCESS('Setting up Role-Based Access Control System...')
        )

        if options['create_admin']:
            self.create_admin_user()

        if options['migrate_existing_data']:
            self.migrate_existing_data()

        if options['setup_sample_data']:
            self.setup_sample_data()

        self.stdout.write(
            self.style.SUCCESS('RBAC setup completed successfully!')
        )

    def create_admin_user(self):
        """Create an admin user"""
        self.stdout.write('Creating admin user...')
        
        username = input('Enter admin username: ')
        email = input('Enter admin email: ')
        password = getpass.getpass('Enter admin password: ')
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User {username} already exists!')
            )
            return

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_staff=True,
                is_superuser=True
            )
            
            UserProfile.objects.create(
                user=user,
                role='admin',
                phone_number=input('Enter phone number (optional): ') or '',
                is_active=True
            )

        self.stdout.write(
            self.style.SUCCESS(f'Admin user {username} created successfully!')
        )

    def migrate_existing_data(self):
        """Migrate existing data to new role system"""
        self.stdout.write('Migrating existing data...')
        
        # Update existing UserProfiles that don't have the new role choices
        updated_profiles = 0
        
        for profile in UserProfile.objects.all():
            updated = False
            
            # Migrate old role choices to new ones
            if profile.role == 'admin':
                # Admin role already exists in new system
                pass
            elif profile.role == 'warden':
                # Warden role already exists in new system
                pass
            else:
                # Default unknown roles to 'owner'
                profile.role = 'owner'
                updated = True
            
            # Ensure all profiles have required fields
            if not hasattr(profile, 'phone_number') or profile.phone_number is None:
                profile.phone_number = ''
                updated = True
                
            if not hasattr(profile, 'is_active') or profile.is_active is None:
                profile.is_active = True
                updated = True
            
            if updated:
                profile.save()
                updated_profiles += 1

        self.stdout.write(
            self.style.SUCCESS(f'Updated {updated_profiles} user profiles')
        )

        # Assign ownership of existing branches
        branches_updated = 0
        for branch in Branch.objects.filter(owner__isnull=True):
            # Try to find an owner based on existing data
            # Look for admin users first, then any user with owner role
            potential_owners = UserProfile.objects.filter(
                role__in=['admin', 'owner']
            ).first()
            
            if potential_owners:
                branch.owner = potential_owners.user
                branch.save()
                branches_updated += 1

        self.stdout.write(
            self.style.SUCCESS(f'Updated {branches_updated} branches with owners')
        )

        # Create WardenAssignments for existing wardens
        assignments_created = 0
        warden_profiles = UserProfile.objects.filter(role='warden')
        
        for warden_profile in warden_profiles:
            if warden_profile.branch:  # If warden has a legacy branch assignment
                assignment, created = WardenAssignment.objects.get_or_create(
                    warden=warden_profile.user,
                    branch=warden_profile.branch,
                    defaults={
                        'assigned_by': warden_profile.branch.owner or User.objects.filter(
                            is_superuser=True
                        ).first(),
                        'can_manage_rooms': True,
                        'can_manage_tenants': True,
                        'can_view_payments': True,
                        'can_collect_payments': False,
                    }
                )
                if created:
                    assignments_created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Created {assignments_created} warden assignments')
        )

    def setup_sample_data(self):
        """Create sample data for testing"""
        self.stdout.write('Creating sample data...')
        
        with transaction.atomic():
            # Create sample users with different roles
            self.create_sample_users()
            self.create_sample_branches()
            self.create_sample_assignments()

        self.stdout.write(
            self.style.SUCCESS('Sample data created successfully!')
        )

    def create_sample_users(self):
        """Create sample users for each role"""
        sample_users = [
            {
                'username': 'owner1',
                'email': 'owner1@example.com',
                'password': 'password123',
                'role': 'owner',
                'first_name': 'John',
                'last_name': 'Owner',
                'phone_number': '+91-9876543210',
                'business_name': 'John\'s Hostels',
                'business_license': 'BL123456'
            },
            {
                'username': 'warden1',
                'email': 'warden1@example.com',
                'password': 'password123',
                'role': 'warden',
                'first_name': 'Jane',
                'last_name': 'Warden',
                'phone_number': '+91-9876543211',
            },
            {
                'username': 'tenant1',
                'email': 'tenant1@example.com',
                'password': 'password123',
                'role': 'tenant',
                'first_name': 'Alice',
                'last_name': 'Tenant',
                'phone_number': '+91-9876543212',
            }
        ]

        for user_data in sample_users:
            username = user_data['username']
            
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'Sample user {username} already exists')
                )
                continue

            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name']
            )

            profile_data = {
                'user': user,
                'role': user_data['role'],
                'phone_number': user_data['phone_number'],
            }

            if user_data['role'] == 'owner':
                profile_data.update({
                    'business_name': user_data.get('business_name'),
                    'business_license': user_data.get('business_license')
                })

            UserProfile.objects.create(**profile_data)
            
            self.stdout.write(
                f'Created sample {user_data["role"]}: {username}'
            )

    def create_sample_branches(self):
        """Create sample branches"""
        owner = User.objects.filter(profile__role='owner').first()
        
        if not owner:
            self.stdout.write(
                self.style.WARNING('No owner found for sample branches')
            )
            return

        sample_branches = [
            {
                'name': 'Sree Lakshmi Ladies Hostel - Main',
                'address': '123 Main Street, Bangalore, Karnataka',
                'description': 'Main branch with modern facilities',
                'num_rooms': 20,
                'num_bathrooms': 8,
                'contact_phone': '+91-9876543220',
                'contact_email': 'main@sreelakshmi.com',
                'owner': owner
            },
            {
                'name': 'Sree Lakshmi Ladies Hostel - Annexe',
                'address': '456 Side Street, Bangalore, Karnataka',
                'description': 'Annexe building with budget accommodation',
                'num_rooms': 15,
                'num_bathrooms': 6,
                'contact_phone': '+91-9876543221',
                'contact_email': 'annexe@sreelakshmi.com',
                'owner': owner
            }
        ]

        for branch_data in sample_branches:
            branch, created = Branch.objects.get_or_create(
                name=branch_data['name'],
                defaults=branch_data
            )
            
            if created:
                self.stdout.write(f'Created sample branch: {branch.name}')

    def create_sample_assignments(self):
        """Create sample warden assignments"""
        warden = User.objects.filter(profile__role='warden').first()
        branch = Branch.objects.first()
        owner = User.objects.filter(profile__role='owner').first()

        if not all([warden, branch, owner]):
            self.stdout.write(
                self.style.WARNING('Missing required users/branches for assignments')
            )
            return

        assignment, created = WardenAssignment.objects.get_or_create(
            warden=warden,
            branch=branch,
            defaults={
                'assigned_by': owner,
                'can_manage_rooms': True,
                'can_manage_tenants': True,
                'can_view_payments': True,
                'can_collect_payments': True,
                'notes': 'Sample warden assignment for testing'
            }
        )

        if created:
            self.stdout.write(
                f'Created sample assignment: {warden.username} -> {branch.name}'
            )

    def validate_rbac_setup(self):
        """Validate that RBAC is set up correctly"""
        self.stdout.write('Validating RBAC setup...')
        
        issues = []
        
        # Check that all users have profiles
        users_without_profiles = User.objects.filter(profile__isnull=True).count()
        if users_without_profiles > 0:
            issues.append(f'{users_without_profiles} users without profiles')
        
        # Check that all branches have owners
        branches_without_owners = Branch.objects.filter(owner__isnull=True).count()
        if branches_without_owners > 0:
            issues.append(f'{branches_without_owners} branches without owners')
        
        # Check for orphaned warden assignments
        invalid_assignments = WardenAssignment.objects.filter(
            Q(warden__profile__role__ne='warden') |
            Q(assigned_by__isnull=True)
        ).count()
        if invalid_assignments > 0:
            issues.append(f'{invalid_assignments} invalid warden assignments')
        
        if issues:
            self.stdout.write(
                self.style.WARNING('RBAC validation issues found:')
            )
            for issue in issues:
                self.stdout.write(f'  - {issue}')
        else:
            self.stdout.write(
                self.style.SUCCESS('RBAC validation passed!')
            )
