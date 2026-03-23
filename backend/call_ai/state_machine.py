"""Strict conversation state machine for hospital receptionist voice calls."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from .intent_classifier import classify_intent
from .slot_extractor import extract_slots


YES_WORDS = {'yes', 'correct', 'confirm', 'please confirm', 'okay', 'ok', 'right'}
NO_WORDS = {'no', 'not correct', 'change', 'wrong'}


REQUIRED_SLOTS = {
    'BOOK_APPOINTMENT': ['patient_name', 'phone_number', 'doctor_name', 'appointment_date', 'appointment_time'],
    'CANCEL_APPOINTMENT': ['patient_name', 'phone_number', 'doctor_name', 'appointment_date', 'appointment_time'],
    'RESCHEDULE_APPOINTMENT': [
        'patient_name',
        'phone_number',
        'doctor_name',
        'appointment_date',
        'appointment_time',
        'new_appointment_date',
        'new_appointment_time',
    ],
}


@dataclass
class AgentReply:
    text: str
    should_end: bool = False
    transfer_human: bool = False
    transfer_emergency: bool = False
    should_save: bool = False
    final_status: str = 'pending'


@dataclass
class CallState:
    call_id: str
    caller_id: str
    hospital_name: str
    intent: str = ''
    intent_confidence: float = 0.0
    slots: dict = field(default_factory=dict)
    transcript_turns: list[str] = field(default_factory=list)
    retries: int = 0
    awaiting_confirmation: bool = False
    completed: bool = False
    handoff: bool = False
    emergency: bool = False

    def add_transcript(self, role: str, text: str) -> None:
        timestamp = datetime.utcnow().isoformat(timespec='seconds')
        self.transcript_turns.append(f"[{timestamp}] {role}: {text}")


class ReceptionistStateMachine:
    def __init__(self, hospital_name: str, vocab: dict[str, list[str]], max_retries: int, intent_threshold: float):
        self.hospital_name = hospital_name
        self.vocab = vocab
        self.max_retries = max_retries
        self.intent_threshold = intent_threshold

    def greeting(self) -> str:
        return f"Welcome to {self.hospital_name}. How may I help you today?"

    def process_turn(self, state: CallState, transcript: str, stt_confidence: float) -> AgentReply:
        user_text = (transcript or '').strip()
        if user_text:
            state.add_transcript('caller', user_text)

        if stt_confidence < 0.55 or not user_text:
            return self._on_low_confidence(state)

        if state.awaiting_confirmation:
            return self._handle_confirmation(state, user_text)

        intent_result = classify_intent(user_text)
        if not state.intent or intent_result.confidence >= state.intent_confidence:
            state.intent = intent_result.intent
            state.intent_confidence = intent_result.confidence

        if state.intent_confidence < self.intent_threshold:
            return self._on_low_confidence(state)

        if state.intent == 'EMERGENCY':
            state.emergency = True
            state.completed = True
            guidance = (
                'This sounds urgent. Please contact emergency services or the hospital emergency unit immediately. '
                'I am transferring you to emergency support now.'
            )
            state.add_transcript('assistant', guidance)
            return AgentReply(
                text=guidance,
                transfer_human=True,
                transfer_emergency=True,
                should_end=True,
                should_save=True,
                final_status='escalated',
            )

        if state.intent == 'HUMAN_HANDOFF':
            state.handoff = True
            state.completed = True
            message = 'Certainly. I am connecting you to a receptionist now.'
            state.add_transcript('assistant', message)
            return AgentReply(
                text=message,
                transfer_human=True,
                should_end=True,
                should_save=True,
                final_status='handoff_requested',
            )

        extracted = extract_slots(user_text, self.vocab).slots
        if state.intent == 'RESCHEDULE_APPOINTMENT':
            self._map_reschedule_slots(state, extracted, user_text)
        state.slots.update(extracted)

        missing = self._missing_slots(state)
        if missing:
            question = self._question_for_slot(state.intent, missing[0])
            state.add_transcript('assistant', question)
            return AgentReply(text=question)

        confirmation = self._build_confirmation(state)
        state.awaiting_confirmation = True
        state.add_transcript('assistant', confirmation)
        return AgentReply(text=confirmation)

    def _map_reschedule_slots(self, state: CallState, extracted: dict, user_text: str) -> None:
        if 'to' in user_text.lower() or 'instead' in user_text.lower() or 'new' in user_text.lower():
            if extracted.get('appointment_date'):
                extracted['new_appointment_date'] = extracted['appointment_date']
                extracted.pop('appointment_date', None)
            if extracted.get('appointment_time'):
                extracted['new_appointment_time'] = extracted['appointment_time']
                extracted.pop('appointment_time', None)

        if 'current' in user_text.lower() or 'old' in user_text.lower():
            if extracted.get('appointment_date'):
                extracted['appointment_date'] = extracted['appointment_date']
            if extracted.get('appointment_time'):
                extracted['appointment_time'] = extracted['appointment_time']

    def _handle_confirmation(self, state: CallState, user_text: str) -> AgentReply:
        lowered = user_text.lower()
        if any(word in lowered for word in YES_WORDS):
            state.awaiting_confirmation = False
            state.completed = True
            message = 'Thank you. Your request has been recorded for our hospital staff.'
            state.add_transcript('assistant', message)
            status_map = {
                'BOOK_APPOINTMENT': 'confirmed',
                'CANCEL_APPOINTMENT': 'cancelled',
                'RESCHEDULE_APPOINTMENT': 'rescheduled',
                'GENERAL_INQUIRY': 'pending',
            }
            return AgentReply(text=message, should_save=True, should_end=True, final_status=status_map.get(state.intent, 'pending'))

        if any(word in lowered for word in NO_WORDS):
            state.awaiting_confirmation = False
            state.retries = 0
            message = 'No problem. Please tell me the correct details and I will update the request.'
            state.add_transcript('assistant', message)
            return AgentReply(text=message)

        prompt = 'Please say yes to confirm, or no to change the details.'
        state.add_transcript('assistant', prompt)
        return AgentReply(text=prompt)

    def _on_low_confidence(self, state: CallState) -> AgentReply:
        state.retries += 1
        if state.retries > self.max_retries:
            state.handoff = True
            state.completed = True
            message = 'I am sorry, I could not capture that clearly. I will connect you to our receptionist team.'
            state.add_transcript('assistant', message)
            return AgentReply(
                text=message,
                transfer_human=True,
                should_save=True,
                should_end=True,
                final_status='failed_capture',
            )

        prompt = 'I did not catch that clearly. Could you please repeat in a short sentence?'
        state.add_transcript('assistant', prompt)
        return AgentReply(text=prompt)

    def _missing_slots(self, state: CallState) -> list[str]:
        required = REQUIRED_SLOTS.get(state.intent, [])
        return [slot for slot in required if not state.slots.get(slot)]

    def _question_for_slot(self, intent: str, slot: str) -> str:
        prompts = {
            'patient_name': 'May I know the patient full name?',
            'phone_number': 'May I know the best phone number to reach you?',
            'doctor_name': 'Which doctor would you like to see?',
            'department': 'Which department do you need?',
            'appointment_date': 'What is your preferred appointment date?',
            'appointment_time': 'What time would you prefer?',
            'new_appointment_date': 'What is the new appointment date?',
            'new_appointment_time': 'What is the new appointment time?',
            'reason_for_visit': 'Could you briefly share the reason for visit?',
        }
        if intent == 'GENERAL_INQUIRY':
            return 'Please tell me your inquiry and I will forward it to our staff.'
        return prompts.get(slot, 'Could you please provide that detail?')

    def _build_confirmation(self, state: CallState) -> str:
        if state.intent == 'BOOK_APPOINTMENT':
            return (
                f"You want to book an appointment with {state.slots.get('doctor_name')} on "
                f"{state.slots.get('appointment_date')} at {state.slots.get('appointment_time')}. "
                'Shall I confirm this request?'
            )
        if state.intent == 'CANCEL_APPOINTMENT':
            return (
                f"You want to cancel the appointment with {state.slots.get('doctor_name')} on "
                f"{state.slots.get('appointment_date')} at {state.slots.get('appointment_time')}. "
                'Shall I confirm this cancellation request?'
            )
        if state.intent == 'RESCHEDULE_APPOINTMENT':
            return (
                f"You want to reschedule the appointment with {state.slots.get('doctor_name')} from "
                f"{state.slots.get('appointment_date')} {state.slots.get('appointment_time')} to "
                f"{state.slots.get('new_appointment_date')} {state.slots.get('new_appointment_time')}. "
                'Shall I confirm this request?'
            )
        return 'I will forward this inquiry to our team. Shall I confirm this request?'

    def build_save_payload(self, state: CallState, final_status: str) -> dict:
        intent_confidence = max(0.0, min(1.0, state.intent_confidence))
        confirmation_status = 'confirmed' if state.completed and not state.emergency and not state.handoff else 'not_required'
        payload = {
            'call_id': state.call_id,
            'caller_id': state.caller_id,
            'patient_name': state.slots.get('patient_name', ''),
            'phone_number': state.slots.get('phone_number', '') or state.caller_id,
            'doctor_name': state.slots.get('doctor_name', ''),
            'department': state.slots.get('department', ''),
            'appointment_date': state.slots.get('appointment_date', ''),
            'appointment_time': state.slots.get('appointment_time', ''),
            'reason_for_visit': state.slots.get('reason_for_visit', ''),
            'urgency': state.slots.get('urgency', 'high' if state.emergency else 'normal'),
            'confirmation_status': confirmation_status,
            'transcript': '\n'.join(state.transcript_turns),
            'detected_intent': state.intent or 'GENERAL_INQUIRY',
            'confidence_score': round(intent_confidence, 4),
            'extracted_slots': state.slots,
            'emergency_flag': state.emergency,
            'handoff_flag': state.handoff,
            'final_status': final_status,
        }
        return payload
