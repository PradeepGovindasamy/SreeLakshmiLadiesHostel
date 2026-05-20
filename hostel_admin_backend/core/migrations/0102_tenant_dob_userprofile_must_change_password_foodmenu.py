from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0101_tenant_status_indexes'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='must_change_password',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='FoodMenu',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('date', models.DateField(db_index=True)),
                ('meal_type', models.CharField(choices=[
                    ('breakfast', 'Breakfast'),
                    ('lunch', 'Lunch'),
                    ('snacks', 'Snacks'),
                    ('dinner', 'Dinner'),
                ], max_length=20)),
                ('items', models.TextField(blank=True, help_text='Brief summary of menu items')),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
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
            ],
            options={
                'ordering': ['date', 'meal_type'],
                'unique_together': {('date', 'meal_type')},
            },
        ),
    ]
