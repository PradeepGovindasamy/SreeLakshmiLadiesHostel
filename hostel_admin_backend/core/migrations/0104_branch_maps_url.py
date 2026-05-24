from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0103_kitchen_modules'),
    ]

    operations = [
        migrations.AddField(
            model_name='branch',
            name='maps_url',
            field=models.URLField(
                blank=True,
                help_text='Google Maps share link for exact property location',
                max_length=500,
            ),
        ),
    ]
