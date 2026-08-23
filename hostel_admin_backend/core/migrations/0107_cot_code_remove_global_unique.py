from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Remove the global unique constraint on core_cot.cot_code.

    Uniqueness is already enforced per-room by unique_together = ['room', 'cot_number', 'cot_type'].
    The old global constraint caused failures when two different properties had rooms
    with the same name (e.g. both have room '101'), generating identical cot codes.
    """

    dependencies = [
        ('core', '0106_tenant_add_cot_fk'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cot',
            name='cot_code',
            field=models.CharField(
                editable=False,
                max_length=20,
                help_text='Auto-generated from room_name + cot_number + cot_type. Unique within a room.',
            ),
        ),
    ]
