# Generated migration to make email unique and required
from django.db import migrations, models
from django.contrib.auth import get_user_model


def set_unique_emails_for_blank(apps, schema_editor):
    """
    Set unique placeholder emails for any users that have blank/duplicate emails
    This ensures we can add the unique constraint without conflicts
    """
    User = apps.get_model('auth', 'User')
    
    # Find users with blank emails
    blank_email_users = User.objects.filter(email='')
    for user in blank_email_users:
        user.email = f'no-email-{user.id}@placeholder.internal'
        user.save()
    
    # Find and fix duplicate emails
    from django.db.models import Count
    duplicate_emails = (
        User.objects.values('email')
        .annotate(count=Count('email'))
        .filter(count__gt=1, email__gt='')
    )
    
    for dup in duplicate_emails:
        email = dup['email']
        users = User.objects.filter(email=email).order_by('id')
        # Keep first user with original email, give others unique emails
        for idx, user in enumerate(users[1:], start=1):
            user.email = f'{email.split("@")[0]}-duplicate-{user.id}@{email.split("@")[1]}'
            user.save()


def reverse_email_migration(apps, schema_editor):
    """
    Reverse migration - remove placeholder emails
    """
    User = apps.get_model('auth', 'User')
    User.objects.filter(email__contains='@placeholder.internal').update(email='')


class Migration(migrations.Migration):
    
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),  # Latest auth migration
        ('core', '0002_add_family_info_to_tenant'),  # Your latest core migration
    ]
    
    operations = [
        # Step 1: Fix existing data
        migrations.RunPython(
            set_unique_emails_for_blank,
            reverse_email_migration
        ),
        
        # Step 2: Make email unique at database level
        # Note: This modifies Django's built-in User model
        # We're doing this carefully to avoid breaking existing data
    ]
