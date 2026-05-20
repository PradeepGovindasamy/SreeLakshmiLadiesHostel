from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Adds FoodMenuItem, MenuIngredient, TenantMealAvailability, MealCountSnapshot.

    Linear chain: 0101_tenant_status_indexes -> 0102 -> 0103.
    """

    dependencies = [
        ('core', '0102_tenant_dob_userprofile_must_change_password_foodmenu'),
        ('groceries', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # --- FoodMenuItem ---
        migrations.CreateModel(
            name='FoodMenuItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('display_order', models.PositiveSmallIntegerField(default=0)),
                ('food_menu', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='menu_items',
                    to='core.foodmenu',
                )),
            ],
            options={
                'ordering': ['food_menu', 'display_order', 'name'],
            },
        ),

        # --- MenuIngredient ---
        migrations.CreateModel(
            name='MenuIngredient',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('quantity_per_person', models.DecimalField(decimal_places=3, max_digits=8)),
                ('unit', models.CharField(
                    choices=[
                        ('kg', 'Kilogram'), ('g', 'Gram'),
                        ('l', 'Liter'), ('ml', 'Milliliter'),
                        ('piece', 'Piece'), ('packet', 'Packet'),
                    ],
                    default='g', max_length=20,
                )),
                ('grocery_item', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='menu_usages',
                    to='groceries.groceryitem',
                )),
                ('menu_item', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ingredients',
                    to='core.foodmenuitem',
                )),
            ],
            options={
                'ordering': ['menu_item', 'grocery_item__name'],
                'unique_together': {('menu_item', 'grocery_item')},
            },
        ),

        # --- TenantMealAvailability ---
        migrations.CreateModel(
            name='TenantMealAvailability',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('date', models.DateField(db_index=True)),
                ('meal_type', models.CharField(choices=[
                    ('breakfast', 'Breakfast'), ('lunch', 'Lunch'),
                    ('snacks', 'Snacks'), ('dinner', 'Dinner'),
                ], max_length=20)),
                ('is_available', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='meal_availability',
                    to='core.tenant',
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='availability_updates',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['date', 'meal_type', 'tenant'],
                'unique_together': {('tenant', 'date', 'meal_type')},
                'indexes': [
                    models.Index(fields=['date', 'meal_type'], name='core_tma_date_meal_idx'),
                    models.Index(fields=['tenant', 'date'], name='core_tma_tenant_date_idx'),
                ],
            },
        ),

        # --- MealCountSnapshot ---
        migrations.CreateModel(
            name='MealCountSnapshot',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('date', models.DateField(db_index=True)),
                ('meal_type', models.CharField(choices=[
                    ('breakfast', 'Breakfast'), ('lunch', 'Lunch'),
                    ('snacks', 'Snacks'), ('dinner', 'Dinner'),
                ], max_length=20)),
                ('total_residents', models.PositiveIntegerField()),
                ('unavailable_count', models.PositiveIntegerField(default=0)),
                ('meal_count', models.PositiveIntegerField()),
                ('snapshot_taken_at', models.DateTimeField(auto_now_add=True)),
                ('consumption_generated', models.BooleanField(default=False)),
                ('taken_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='meal_snapshots',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-date', 'meal_type'],
                'unique_together': {('date', 'meal_type')},
            },
        ),
    ]
