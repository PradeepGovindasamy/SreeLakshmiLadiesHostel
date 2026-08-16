from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0105_add_cot_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='cot',
            field=models.ForeignKey(
                blank=True,
                help_text='Specific cot assigned to this tenant within the room',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tenant_assignments',
                to='core.cot',
            ),
        ),
    ]
