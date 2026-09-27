from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0107_cot_code_remove_global_unique'),
    ]

    operations = [
        migrations.AlterField(
            model_name='room',
            name='sharing_type',
            field=models.IntegerField(
                blank=True,
                choices=[(i, f'{i}-Sharing') for i in range(1, 16)],
                null=True,
            ),
        ),
    ]
