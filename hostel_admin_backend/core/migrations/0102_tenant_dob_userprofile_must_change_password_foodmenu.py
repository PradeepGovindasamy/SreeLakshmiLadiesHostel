from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0101_tenant_status_indexes'),
    ]

    operations = [
        # date_of_birth on Tenant
        migrations.AddField(
            model_name='tenant',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        # must_change_password on UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='must_change_password',
            field=models.BooleanField(default=False),
        ),
        # FoodMenu model
        migrations.CreateModel(
            name='FoodMenu',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(db_index=True)),
                ('meal_type', models.CharField(
                    choices=[
                        ('breakfast', 'Breakfast'),
                        ('lunch', 'Lunch'),
                        ('snacks', 'Snacks'),
                        ('dinner', 'Dinner'),
                    ],
                    max_length=20,
                )),
                ('items', models.TextField(help_text='Menu items for this meal, e.g. "Idli, Sambar, Chutney"')),
                ('notes', models.TextField(blank=True, help_text='Optional notes (e.g. special occasion, diet info)')),
                ('created_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='food_menus_created',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='food_menus_updated',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['date', 'meal_type'],
                'unique_together': {('date', 'meal_type')},
            },
        ),
    ]
