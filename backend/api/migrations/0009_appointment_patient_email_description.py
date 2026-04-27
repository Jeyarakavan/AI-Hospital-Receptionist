from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_alter_doctor_options_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="patient_email",
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
