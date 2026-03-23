from django.test import TestCase
from django.urls import reverse


class TwilioWebhookTests(TestCase):
    def test_incoming_call_returns_twiml(self):
        response = self.client.post(
            reverse('twilio-voice'),
            data={'CallSid': 'CA123', 'From': '+94771111111'},
        )

        self.assertEqual(response.status_code, 200)
        body = response.content.decode('utf-8')
        self.assertIn('<Response>', body)
        self.assertIn('Thank you for calling Jaffna Hospital', body)

    def test_gather_returns_follow_up_prompt(self):
        response = self.client.post(
            reverse('twilio-gather'),
            data={'CallSid': 'CA123', 'From': '+94771111111', 'SpeechResult': 'book appointment'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('<Gather', response.content.decode('utf-8'))
