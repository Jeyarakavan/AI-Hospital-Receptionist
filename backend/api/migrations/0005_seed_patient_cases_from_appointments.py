from django.db import migrations


def seed_cases_from_appointments(apps, schema_editor):
    Patient = apps.get_model('api', 'Patient')
    Appointment = apps.get_model('api', 'Appointment')
    PatientCase = apps.get_model('api', 'PatientCase')

    for appointment in Appointment.objects.select_related('doctor').all():
        patient, _ = Patient.objects.get_or_create(
            name=appointment.patient_name,
            phone_number=appointment.contact_number,
            defaults={
                'age': appointment.patient_age or 0,
                'address': appointment.address or '',
                'email': None,
            },
        )

        has_active_case = PatientCase.objects.filter(patient=patient, is_active=True).exists()
        if has_active_case:
            continue

        PatientCase.objects.create(
            patient=patient,
            assigned_doctor=appointment.doctor if appointment.doctor_id else None,
            diagnosis=appointment.patient_disease or 'Imported from appointment history.',
            current_condition='Imported from appointment history.',
            status='Open',
            is_active=True,
            created_by=appointment.created_by,
            updated_by=appointment.created_by,
        )


def reverse_seed_cases(apps, schema_editor):
    PatientCase = apps.get_model('api', 'PatientCase')
    PatientCase.objects.filter(current_condition='Imported from appointment history.').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_patientcase_patientencounter_patientadmission_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_cases_from_appointments, reverse_seed_cases),
    ]
