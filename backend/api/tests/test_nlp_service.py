from django.test import TestCase, override_settings

from api.nlp_service import NLPService


@override_settings(OPENAI_API_KEY='')
class NLPServiceTests(TestCase):
    def test_emergency_keyword_transfers_immediately(self):
        service = NLPService()
        result = service.process_turn(
            latest_utterance='My father has chest pain and is unconscious',
            session={'history': [], 'clarification_count': 0},
            caller_number='+94770000000',
        )

        self.assertEqual(result.action, 'transfer_emergency')
        self.assertIn('emergency', result.response_text.lower())

    def test_human_request_handover(self):
        service = NLPService()
        result = service.process_turn(
            latest_utterance='Please connect me to a human receptionist',
            session={'history': [], 'clarification_count': 0},
            caller_number='+94770000000',
        )

        self.assertEqual(result.action, 'transfer_human')
