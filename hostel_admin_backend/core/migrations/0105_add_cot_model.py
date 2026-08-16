from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0104_branch_maps_url'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cot_number', models.PositiveSmallIntegerField(help_text='Cot number within the room, e.g. 1, 2, 3')),
                ('cot_type', models.CharField(
                    choices=[('S', 'Single'), ('U', 'Upper Bunk'), ('L', 'Lower Bunk')],
                    max_length=1,
                )),
                ('cot_code', models.CharField(
                    editable=False,
                    help_text='Auto-generated from room_name + cot_number + cot_type',
                    max_length=20,
                    unique=True,
                )),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('room', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='cots',
                    to='core.room',
                )),
            ],
            options={
                'ordering': ['room', 'cot_number', 'cot_type'],
                'unique_together': {('room', 'cot_number', 'cot_type')},
            },
        ),
    ]
