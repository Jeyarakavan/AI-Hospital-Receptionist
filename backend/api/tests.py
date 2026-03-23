from datetime import date, timedelta

from django.test import TestCase

from .models import User, Doctor, Patient, PatientCase, PatientAdmission
from .permissions import CanEditClinicalData, CanViewPatientHistory
from .serializers import PatientAdmissionSerializer, PatientCaseSerializer


class ClinicalPermissionTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_user',
            email='admin@test.com',
            password='StrongPass123!',
            full_name='Admin User',
            date_of_birth='1990-01-01',
            phone_number='+94123456789',
            address='addr',
            role='Admin',
            status='Approved',
        )
        self.doctor_user = User.objects.create_user(
            username='doctor_user',
            email='doctor@test.com',
            password='StrongPass123!',
            full_name='Doctor User',
            date_of_birth='1990-01-01',
            phone_number='+94123456788',
            address='addr',
            role='Doctor',
            status='Approved',
        )
        self.staff_user = User.objects.create_user(
            username='staff_user',
            email='staff@test.com',
            password='StrongPass123!',
            full_name='Staff User',
            date_of_birth='1990-01-01',
            phone_number='+94123456787',
            address='addr',
            role='Staff',
            status='Approved',
        )

    def test_edit_clinical_data_permission(self):
        perm = CanEditClinicalData()
        self.assertTrue(perm.has_permission(type('R', (), {'user': self.admin})(), None))
        self.assertTrue(perm.has_permission(type('R', (), {'user': self.doctor_user})(), None))
        self.assertFalse(perm.has_permission(type('R', (), {'user': self.staff_user})(), None))

    def test_view_history_permission(self):
        perm = CanViewPatientHistory()
        self.assertTrue(perm.has_permission(type('R', (), {'user': self.admin})(), None))
        self.assertTrue(perm.has_permission(type('R', (), {'user': self.staff_user})(), None))


class ClinicalValidationTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin2',
            email='admin2@test.com',
            password='StrongPass123!',
            full_name='Admin2',
            date_of_birth='1990-01-01',
            phone_number='+94123456000',
            address='addr',
            role='Admin',
            status='Approved',
        )
        self.doctor_user = User.objects.create_user(
            username='doctor2',
            email='doctor2@test.com',
            password='StrongPass123!',
            full_name='Doctor2',
            date_of_birth='1990-01-01',
            phone_number='+94123456001',
            address='addr',
            role='Doctor',
            status='Approved',
        )
        self.doctor = Doctor.objects.create(user=self.doctor_user, specialization='General')
        self.patient = Patient.objects.create(
            name='John Doe',
            age=32,
            phone_number='+94123456002',
            address='street',
        )
        self.case = PatientCase.objects.create(
            patient=self.patient,
            assigned_doctor=self.doctor,
            diagnosis='Fever',
            current_condition='Stable',
            created_by=self.admin,
            updated_by=self.admin,
        )

    def test_case_checkup_date_rejects_past_date(self):
        serializer = PatientCaseSerializer(data={
            'patient': self.patient.id,
            'assigned_doctor': self.doctor.id,
            'diagnosis': 'Fever',
            'current_condition': 'Stable',
            'next_checkup_date': date.today() - timedelta(days=1),
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('next_checkup_date', serializer.errors)

    def test_admission_rejects_discharge_before_admit(self):
        serializer = PatientAdmissionSerializer(data={
            'patient_case': self.case.id,
            'admitted_on': date.today(),
            'discharged_on': date.today() - timedelta(days=1),
            'is_currently_admitted': False,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('discharged_on', serializer.errors)

    def test_single_active_admission(self):
        PatientAdmission.objects.create(
            patient_case=self.case,
            admitted_on=date.today(),
            is_currently_admitted=True,
            created_by=self.admin,
            updated_by=self.admin,
        )
        serializer = PatientAdmissionSerializer(data={
            'patient_case': self.case.id,
            'admitted_on': date.today(),
            'is_currently_admitted': True,
        })
        self.assertFalse(serializer.is_valid())
