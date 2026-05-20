"""
No-op bridge migration.

The original 0101 conflicted with 0102/0103 on production. This file keeps the
same migration name so existing deployment artifacts stay compatible, but it
does no database work. All kitchen tables are created in 0103.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0102_tenant_dob_userprofile_must_change_password_foodmenu'),
    ]

    operations = []
