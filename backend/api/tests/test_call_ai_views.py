from django.test import TestCase, override_settings
from django.urls import reverse

from api.models import CallReceptionRequest, User


@override_settings(CALL_AI_SHARED_TOKEN='test-token')
class CallAIViewsTests(TestCase):
    def test_call_ai_vocabulary_requires_token(self):
        response = self.client.get(reverse('call-ai-vocabulary'))
        self.assertEqual(response.status_code, 401)

    def test_call_ai_vocabulary_success(self):
        response = self.client.get(
            reverse('call-ai-vocabulary'),
            HTTP_X_CALL_AI_TOKEN='test-token',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('doctors', response.json())
        self.assertIn('departments', response.json())

    def test_call_ai_intake_success(self):
        payload = {
            'call_id': 'CALL-001',
            'caller_id': '+94771111111',
            'patient_name': 'John Perera',
            'phone_number': '+94771111111',
            'doctor_name': 'Dr. Kumar',
            'department': 'Cardiology',
            'appointment_date': '2026-03-10',
            'appointment_time': '10:00',
            'reason_for_visit': 'chest checkup',
            'urgency': 'normal',
            'confirmation_status': 'confirmed',
            'transcript': 'sample transcript',
            'detected_intent': 'BOOK_APPOINTMENT',
            'confidence_score': 0.93,
            'extracted_slots': {'doctor_name': 'Dr. Kumar'},
            'emergency_flag': False,
            'handoff_flag': False,
            'final_status': 'confirmed',
        }

        response = self.client.post(
            reverse('call-ai-intake'),
            data=payload,
            content_type='application/json',
            HTTP_X_CALL_AI_TOKEN='test-token',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CallReceptionRequest.objects.count(), 1)

    def test_call_ai_requests_requires_auth(self):
        response = self.client.get(reverse('call-ai-requests'))
        self.assertEqual(response.status_code, 401)

    def test_call_ai_requests_for_authenticated_user(self):
        user = User.objects.create_user(
            username='admin-user',
            email='admin@example.com',
            password='StrongPass123!',
            full_name='Admin User',
            date_of_birth='1990-01-01',
            phone_number='+94770000000',
            address='Admin Address',
            role='Admin',
            status='Approved',
            is_staff=True,
            is_superuser=True,
        )
        CallReceptionRequest.objects.create(
            call_id='CALL-REQ-1',
            caller_id='+94771111111',
            detected_intent='GENERAL_INQUIRY',
            confidence_score=0.8,
            final_status='pending',
        )
        self.client.force_login(user)

        response = self.client.get(reverse('call-ai-requests'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_call_ai_intake_emergency_sets_flags(self):
        payload = {
            'call_id': 'CALL-EM-1',
            'caller_id': '+94774444444',
            'detected_intent': 'EMERGENCY',
            'confidence_score': 0.99,
            'transcript': 'chest pain emergency',
            'extracted_slots': {},
        }
        response = self.client.post(
            reverse('call-ai-intake'),
            data=payload,
            content_type='application/json',
            HTTP_X_CALL_AI_TOKEN='test-token',
        )
        self.assertEqual(response.status_code, 201)
        record = CallReceptionRequest.objects.get(call_id='CALL-EM-1')
        self.assertTrue(record.emergency_flag)
        self.assertTrue(record.handoff_flag)
        self.assertEqual(record.final_status, 'escalated')

    def test_call_ai_intake_handoff_sets_default_status(self):
        payload = {
            'call_id': 'CALL-HO-1',
            'caller_id': '+94775555555',
            'detected_intent': 'HUMAN_HANDOFF',
            'confidence_score': 0.95,
            'transcript': 'operator please',
            'extracted_slots': {},
        }
        response = self.client.post(
            reverse('call-ai-intake'),
            data=payload,
            content_type='application/json',
            HTTP_X_CALL_AI_TOKEN='test-token',
        )
        self.assertEqual(response.status_code, 201)
        record = CallReceptionRequest.objects.get(call_id='CALL-HO-1')
        self.assertTrue(record.handoff_flag)
        self.assertEqual(record.final_status, 'handoff_requested')
