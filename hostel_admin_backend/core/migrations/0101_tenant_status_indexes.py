"""
Migration: add DB indexes for Tenant lifecycle status queries.

Background
----------
The Tenant model previously contained two 'class Meta' blocks.  Python silently
discards the first one, so the carefully-crafted indexes defined there were
never applied to the database.  This migration creates them for the first time.

Indexes added
-------------
  tenant_active_idx        – (vacating_date, joining_date)  – status=active queries
  tenant_vacated_idx       – (-vacating_date)                – status=vacated, ordered
  tenant_room_status_idx   – (room, vacating_date)           – per-room capacity checks
  tenant_search_idx        – (name, phone_number)            – search queries
  tenant_phone_idx         – (phone_number)                  – phone-only lookups
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0100_make_email_unique'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(
                fields=['vacating_date', 'joining_date'],
                name='tenant_active_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(
                fields=['-vacating_date'],
                name='tenant_vacated_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(
                fields=['room', 'vacating_date'],
                name='tenant_room_status_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(
                fields=['name', 'phone_number'],
                name='tenant_search_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(
                fields=['phone_number'],
                name='tenant_phone_idx',
            ),
        ),
    ]
