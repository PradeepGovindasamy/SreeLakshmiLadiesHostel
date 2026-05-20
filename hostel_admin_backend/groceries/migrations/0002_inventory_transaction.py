from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('groceries', '0001_initial'),
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InventoryTransaction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('transaction_type', models.CharField(
                    choices=[
                        ('purchase', 'Purchase'),
                        ('consumption', 'Consumption'),
                        ('wastage', 'Wastage'),
                        ('adjustment', 'Adjustment'),
                    ],
                    max_length=20,
                )),
                ('quantity', models.DecimalField(decimal_places=3, max_digits=10)),
                ('unit', models.CharField(default='g', max_length=20)),
                ('reference_type', models.CharField(
                    blank=True,
                    choices=[
                        ('meal', 'Meal Consumption'),
                        ('purchase', 'Grocery Purchase'),
                        ('manual', 'Manual Adjustment'),
                    ],
                    max_length=20,
                )),
                ('reference_id', models.IntegerField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('branch', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='inventory_transactions',
                    to='core.branch',
                )),
                ('grocery_item', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='transactions',
                    to='groceries.groceryitem',
                )),
                ('created_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='inventory_transactions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(
                        fields=['branch', 'grocery_item', 'transaction_type'],
                        name='groc_inv_branch_item_type_idx',
                    ),
                    models.Index(fields=['branch', 'created_at'], name='groc_inv_branch_date_idx'),
                    models.Index(
                        fields=['reference_type', 'reference_id'],
                        name='groc_inv_ref_idx',
                    ),
                ],
            },
        ),
    ]
