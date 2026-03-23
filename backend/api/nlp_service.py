"""OpenAI-powered NLP orchestration for AI receptionist call flows."""

from __future__ import annotations

import json
import logging
import re
from difflib import get_close_matches
from dataclasses import dataclass
from datetime import date
from typing import Any

import dateparser
from django.conf import settings
from openai import OpenAI

from .models import Appointment, Doctor, Patient
from .mongodb_service import MongoDBService

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """
You are the AI Receptionist for Jaffna Hospital, Sri Lanka. Your voice is warm, professional, and empathetic. You speak clearly, use simple English, and always remain patient. You understand common Sri Lankan accents and phrasing.

You have access to real-time backend APIs (documented below) to look up patients, check doctor availability, book/cancel/reschedule appointments, and trigger notifications. You will be given the conversation history and the latest user utterance. Your task is to determine the next response and action.

### RULES (Strictly Follow)
1. **Greeting**: Always start a new call with: "Thank you for calling Jaffna Hospital. This is your AI assistant. How may I help you today? You can say something like 'book an appointment', 'check doctor availability', or 'talk to a person'."
2. **Listening**: Extract the user's intent and entities (doctor name, date, time, action). If multiple intents, ask for clarification.
3. **Clarification**: If unsure (confidence < 0.8), ask one clarifying question at a time. Example: "I didn't catch the doctor's name. Could you please repeat it?" After two failed clarifications, offer human transfer.
4. **Confirmation**: Before any action (booking, cancellation), repeat the details and ask for confirmation: "So I'll book an appointment for Dr. Perera on Monday at 10 AM. Is that correct?" Wait for confirmation (yes/no).
5. **Emergency detection**: Continuously monitor for keywords: ambulance, heart attack, chest pain, accident, bleeding, unconscious, emergency. If detected with high confidence (>0.9), immediately say: "I understand this may be an emergency. I will connect you to our emergency line right away." Then set action to "transfer_emergency".
6. **Human handover**: If the user explicitly asks for a human, or if the AI cannot handle the request after two clarification attempts, say: "Of course, let me transfer you to our reception team. Please hold." Set action to "transfer_human".
7. **State awareness**: You will receive the current session state (e.g., which information has been collected). Use it to avoid asking for the same thing twice.

### TASK-SPECIFIC FLOWS
**Appointment Booking**:
- Identify doctor, date, and optionally time.
- Check availability via API.
- Identify patient (by phone number; if not found, ask for name and DOB to create record).
- Confirm all details before booking.
- After booking, say: "Your appointment is confirmed. You will receive an SMS and email with the details." Set action to "continue" (to ask if anything else).

**Cancellation**:
- Identify patient (by phone).
- List their upcoming appointments.
- Ask which one to cancel.
- Confirm cancellation.
- After cancellation, say: "Your appointment has been cancelled. You will receive a confirmation message." Set action to "continue".

**Rescheduling**:
- Similar to cancellation, then ask for new date/time and follow booking flow.
- Update original appointment to 'rescheduled' and create new one.

**Doctor Availability Inquiry**:
- Ask for doctor and date (if not provided).
- Return available slots: "Dr. Perera is available on Thursday at 9 AM, 11 AM, and 3 PM."
- Offer to book immediately.

**Emergency**:
- Immediately set action to "transfer_emergency". Do not ask for confirmation.

### API CALLS (You Must Use)
You can request the system to perform these actions by including them in the returned JSON. The system will execute them and provide results in the next turn.
- `search_doctors(specialty=None)` -> list of doctors with IDs.
- `get_availability(doctor_id, date)` -> list of available times.
- `lookup_patient(phone)` -> patient info or null.
- `create_patient(name, dob, phone, ...)` -> new patient ID.
- `book_appointment(patient_id, doctor_id, datetime, reason)` -> appointment ID.
- `cancel_appointment(appointment_id)`
- `reschedule_appointment(appointment_id, new_datetime)`
- `send_notification(patient_id, type, details)`

### OUTPUT FORMAT
You must respond with a valid JSON object containing:
{
  "response_text": "What the AI should say next (string)",
  "action": "continue" | "transfer_human" | "transfer_emergency" | "end_call",
  "api_calls": [
    { "method": "search_doctors", "params": { "specialty": "cardiology" } }
  ],
  "context_update": {
    "intent": "...",
    "doctor_id": "...",
    "date": "..."
  }
}

### FEW-SHOT EXAMPLES
User: "Book an appointment with cardiology doctor tomorrow"
Assistant JSON: {"response_text":"I can help with that. Could you please confirm the doctor's name and preferred time tomorrow?","action":"continue","api_calls":[{"method":"search_doctors","params":{"specialty":"cardiology"}}],"context_update":{"intent":"book_appointment"}}

User: "I need a human please"
Assistant JSON: {"response_text":"Of course, let me transfer you to our reception team. Please hold.","action":"transfer_human","api_calls":[],"context_update":{"intent":"handover"}}

Now, based on the conversation history and latest utterance, produce the next JSON.
""".strip()

EMERGENCY_KEYWORDS = {
    "ambulance",
    "heart attack",
    "chest pain",
    "accident",
    "bleeding",
    "unconscious",
    "emergency",
}

HUMAN_REQUEST_PHRASES = {
    "human",
    "person",
    "receptionist",
    "operator",
    "agent",
}


@dataclass
class NLPResult:
    response_text: str
    action: str
    api_calls: list[dict[str, Any]]
    context_update: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {
            "response_text": self.response_text,
            "action": self.action,
            "api_calls": self.api_calls,
            "context_update": self.context_update,
        }


class NLPService:
    """Orchestrates LLM output, safety checks, and backend API execution."""

    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def process_turn(
        self,
        latest_utterance: str,
        session: dict[str, Any],
        caller_number: str,
    ) -> NLPResult:
        utterance = (latest_utterance or "").strip()
        lowered = utterance.lower()
        session_context = session.get("context", {})

        # Deterministic yes/no handling when the bot is awaiting explicit confirmation.
        if session_context.get("awaiting_confirmation"):
            confirmation = self._parse_confirmation(lowered)
            if confirmation is True:
                pending = session_context.get("pending_action") or {}
                pending_calls = pending.get("api_calls", [])
                api_outcomes = self.execute_api_calls(pending_calls)
                if api_outcomes.get("errors"):
                    return NLPResult(
                        response_text=(
                            "I am sorry, I could not complete that action right now. "
                            "Let me transfer you to our reception team."
                        ),
                        action="transfer_human",
                        api_calls=[],
                        context_update={
                            "intent": "handover_on_error",
                            "awaiting_confirmation": False,
                            "pending_action": None,
                        },
                    )
                return NLPResult(
                    response_text=(
                        "Done. Your request has been completed successfully. "
                        "Is there anything else I can help you with today?"
                    ),
                    action="continue",
                    api_calls=[],
                    context_update={
                        "intent": pending.get("intent", "confirmed_action"),
                        "awaiting_confirmation": False,
                        "pending_action": None,
                        "api_results": api_outcomes.get("results", []),
                        "confidence": 0.99,
                    },
                )

            if confirmation is False:
                return NLPResult(
                    response_text=(
                        "No problem. Please tell me the correct details and I will update it."
                    ),
                    action="continue",
                    api_calls=[],
                    context_update={
                        "intent": "correction_requested",
                        "awaiting_confirmation": False,
                        "pending_action": None,
                        "confidence": 0.95,
                    },
                )

        if self._is_emergency(lowered):
            return NLPResult(
                response_text=(
                    "I understand this may be an emergency. I will connect you "
                    "to our emergency line right away."
                ),
                action="transfer_emergency",
                api_calls=[],
                context_update={"intent": "emergency", "keyword": self._matched_keyword(lowered)},
            )

        if self._requested_human(lowered):
            return NLPResult(
                response_text="Of course, let me transfer you to our reception team. Please hold.",
                action="transfer_human",
                api_calls=[],
                context_update={"intent": "handover"},
            )

        # Deterministic intent+entity hints to improve recognition of local speech variants.
        rule_context = self._extract_rule_based_context(utterance, caller_number)

        llm_json = self._call_llm(utterance, session)
        result = self._normalize_result(llm_json)

        # Merge rule-based fields with LLM fields, prioritizing deterministic high-confidence values.
        if rule_context:
            merged = {**result.context_update, **rule_context}
            merged["confidence"] = max(
                float(result.context_update.get("confidence", 0.0)),
                float(rule_context.get("confidence", 0.0)),
            )
            result.context_update = merged

        confidence = float(result.context_update.get("confidence", 0.95))
        if confidence < 0.8:
            return self._clarification_or_handover(session, caller_number)

        validated = self._validate_entities(result.context_update)
        result.context_update.update(validated)

        # Always require explicit confirmation before mutating actions.
        if self._requires_confirmation(result):
            confirmation_text = self._build_confirmation_prompt(result)
            return NLPResult(
                response_text=confirmation_text,
                action="continue",
                api_calls=[],
                context_update={
                    **result.context_update,
                    "awaiting_confirmation": True,
                    "pending_action": {
                        "intent": result.context_update.get("intent", "mutation"),
                        "api_calls": result.api_calls,
                    },
                    "confidence": max(float(result.context_update.get("confidence", 0.9)), 0.9),
                },
            )

        api_outcomes = self.execute_api_calls(result.api_calls)
        if api_outcomes.get("errors"):
            logger.error("API call failures in NLP flow: %s", api_outcomes["errors"])
            return NLPResult(
                response_text=(
                    "I am sorry, I could not complete that right now. "
                    "Would you like me to transfer you to a human receptionist?"
                ),
                action="transfer_human",
                api_calls=[],
                context_update={"intent": "handover_on_error"},
            )

        result.context_update["api_results"] = api_outcomes.get("results", [])
        return result

    def execute_api_calls(self, api_calls: list[dict[str, Any]]) -> dict[str, Any]:
        results: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        handlers = {
            "search_doctors": self._api_search_doctors,
            "get_availability": self._api_get_availability,
            "lookup_patient": self._api_lookup_patient,
            "create_patient": self._api_create_patient,
            "book_appointment": self._api_book_appointment,
            "cancel_appointment": self._api_cancel_appointment,
            "reschedule_appointment": self._api_reschedule_appointment,
            "send_notification": self._api_send_notification,
        }

        for call in api_calls or []:
            method = call.get("method")
            params = call.get("params", {})
            handler = handlers.get(method)
            if not handler:
                errors.append({"method": method, "error": "Unsupported method"})
                continue

            try:
                payload = handler(**params)
                results.append({"method": method, "result": payload})
            except Exception as exc:
                logger.exception("API call '%s' failed", method)
                errors.append({"method": method, "error": str(exc)})

        return {"results": results, "errors": errors}

    def _call_llm(self, latest_utterance: str, session: dict[str, Any]) -> dict[str, Any]:
        if not self.client:
            return self._fallback_intent(latest_utterance)

        history = session.get("history", [])[-10:]
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for item in history:
            role = "assistant" if item.get("role") == "assistant" else "user"
            messages.append({"role": role, "content": item.get("message", "")})
        messages.append({"role": "user", "content": latest_utterance})

        completion = self.client.chat.completions.create(
            model=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.2,
            messages=messages,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or "{}"
        return self._safe_json_parse(content)

    def _normalize_result(self, raw: dict[str, Any]) -> NLPResult:
        return NLPResult(
            response_text=raw.get("response_text") or "Could you please repeat that?",
            action=raw.get("action") or "continue",
            api_calls=raw.get("api_calls") or [],
            context_update=raw.get("context_update") or {},
        )

    def _extract_rule_based_context(self, utterance: str, caller_number: str) -> dict[str, Any]:
        lowered = utterance.lower()
        context: dict[str, Any] = {"caller_phone": self._normalize_phone(caller_number)}

        if any(x in lowered for x in ["book", "appointment", "reserve", "see doctor"]):
            context["intent"] = "book_appointment"
            context["confidence"] = 0.9
        elif any(x in lowered for x in ["cancel", "remove appointment"]):
            context["intent"] = "cancel_appointment"
            context["confidence"] = 0.9
        elif any(x in lowered for x in ["reschedule", "change time", "change date", "postpone"]):
            context["intent"] = "reschedule_appointment"
            context["confidence"] = 0.9
        elif any(x in lowered for x in ["available", "availability", "free slot", "doctor available"]):
            context["intent"] = "doctor_availability"
            context["confidence"] = 0.88

        parsed = dateparser.parse(utterance)
        if parsed:
            context["date"] = parsed.date().isoformat()
            if parsed.time() and parsed.time().hour != 0:
                context["time"] = parsed.time().replace(second=0, microsecond=0).isoformat(timespec="minutes")

        context["doctor_name"] = self._extract_doctor_name(utterance)
        return {k: v for k, v in context.items() if v is not None}

    def _extract_doctor_name(self, utterance: str) -> str | None:
        # Handles variants like "Dr Perera", "doctor perera", "dr. perera".
        match = re.search(r"(?:dr\.?|doctor)\s+([A-Za-z][A-Za-z\-']+)", utterance, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None

    def _validate_entities(self, context_update: dict[str, Any]) -> dict[str, Any]:
        updates = {}

        doctor_name = context_update.get("doctor_name")
        if doctor_name and not context_update.get("doctor_id"):
            doctor = (
                Doctor.objects.select_related("user")
                .filter(user__full_name__icontains=doctor_name, user__status="Approved")
                .first()
            )
            if not doctor:
                doctors = list(
                    Doctor.objects.select_related("user")
                    .filter(user__status="Approved")
                    .values_list("user__full_name", flat=True)
                )
                close = get_close_matches(doctor_name, doctors, n=1, cutoff=0.75)
                if close:
                    doctor = (
                        Doctor.objects.select_related("user")
                        .filter(user__full_name=close[0], user__status="Approved")
                        .first()
                    )
            if doctor:
                updates["doctor_id"] = str(doctor.id)
                updates["doctor_name"] = doctor.user.full_name
            else:
                updates["confidence"] = min(float(context_update.get("confidence", 0.95)), 0.65)
                updates["doctor_not_found"] = True

        parsed_date = self._parse_date(context_update.get("date"))
        if parsed_date:
            updates["date"] = parsed_date.isoformat()
        elif context_update.get("intent") in {"book_appointment", "doctor_availability", "reschedule_appointment"}:
            updates["confidence"] = min(float(context_update.get("confidence", 0.95)), 0.7)

        return updates

    def _clarification_or_handover(self, session: dict[str, Any], caller_number: str) -> NLPResult:
        clarification_count = int(session.get("clarification_count", 0)) + 1
        if clarification_count >= 2:
            MongoDBService.save_misunderstanding(
                {
                    "caller_number": caller_number,
                    "reason": "low_confidence",
                    "clarification_count": clarification_count,
                }
            )
            return NLPResult(
                response_text="Of course, let me transfer you to our reception team. Please hold.",
                action="transfer_human",
                api_calls=[],
                context_update={"intent": "handover"},
            )

        return NLPResult(
            response_text=(
                "I did not catch all the details clearly. Please tell me one by one: "
                "doctor name, date, and time."
            ),
            action="continue",
            api_calls=[],
            context_update={"intent": "clarification_needed", "clarification_increment": 1},
        )

    def _requires_confirmation(self, result: NLPResult) -> bool:
        mutating_methods = {"book_appointment", "cancel_appointment", "reschedule_appointment"}
        return any(call.get("method") in mutating_methods for call in (result.api_calls or []))

    def _build_confirmation_prompt(self, result: NLPResult) -> str:
        ctx = result.context_update or {}
        intent = ctx.get("intent", "this request")
        doctor = ctx.get("doctor_name", "the selected doctor")
        date_value = ctx.get("date", "the selected date")
        time_value = ctx.get("time", "the selected time")

        if intent == "book_appointment":
            return (
                f"I will book an appointment with Dr. {doctor} on {date_value} at {time_value}. "
                "Is that correct?"
            )
        if intent == "cancel_appointment":
            return "I am about to cancel the selected appointment. Is that correct?"
        if intent == "reschedule_appointment":
            return f"I will reschedule your appointment to {date_value} at {time_value}. Is that correct?"
        return "Please confirm if you want me to continue with this request."

    @staticmethod
    def _parse_confirmation(text: str) -> bool | None:
        yes_set = {"yes", "yeah", "correct", "right", "ok", "okay", "confirm", "sure"}
        no_set = {"no", "not", "wrong", "cancel", "stop", "dont", "don't"}
        tokens = set(re.findall(r"[a-z']+", text.lower()))
        if tokens & yes_set:
            return True
        if tokens & no_set:
            return False
        return None

    @staticmethod
    def _normalize_phone(phone: str | None) -> str | None:
        if not phone:
            return None
        cleaned = re.sub(r"[^\d+]", "", phone)
        if cleaned.startswith("00"):
            cleaned = "+" + cleaned[2:]
        return cleaned

    def _fallback_intent(self, text: str) -> dict[str, Any]:
        lowered = text.lower()
        if "book" in lowered or "appointment" in lowered:
            return {
                "response_text": "Sure, I can help with booking. Please tell me the doctor name and preferred date.",
                "action": "continue",
                "api_calls": [],
                "context_update": {"intent": "book_appointment", "confidence": 0.85},
            }
        if "cancel" in lowered:
            return {
                "response_text": "I can help cancel an appointment. Please share your phone number.",
                "action": "continue",
                "api_calls": [],
                "context_update": {"intent": "cancel_appointment", "confidence": 0.85},
            }
        return {
            "response_text": "I can help with appointments, doctor availability, or connecting you to a person.",
            "action": "continue",
            "api_calls": [],
            "context_update": {"intent": "unknown", "confidence": 0.7},
        }

    def _api_search_doctors(self, specialty: str | None = None):
        query = Doctor.objects.select_related("user").filter(user__status="Approved")
        if specialty:
            query = query.filter(specialization__icontains=specialty)

        return [
            {
                "id": str(doc.id),
                "name": doc.user.full_name,
                "specialization": doc.specialization,
            }
            for doc in query[:20]
        ]

    def _api_get_availability(self, doctor_id: str, date: str):
        parsed = self._parse_date(date)
        if not parsed:
            raise ValueError("Invalid date")

        doctor = Doctor.objects.get(id=doctor_id)
        day_idx = parsed.weekday()
        slots = doctor.availability.filter(day_of_week=day_idx, is_available=True).order_by("start_time")

        return [
            {
                "start_time": slot.start_time.isoformat(timespec="minutes"),
                "end_time": slot.end_time.isoformat(timespec="minutes"),
            }
            for slot in slots
        ]

    def _api_lookup_patient(self, phone: str):
        patient = Patient.objects.filter(phone_number=phone).first()
        if not patient:
            return None
        return {
            "id": str(patient.id),
            "name": patient.name,
            "phone": patient.phone_number,
            "email": patient.email,
        }

    def _api_create_patient(self, name: str, dob: str, phone: str, email: str | None = None, address: str = ""):
        parsed_dob = self._parse_date(dob)
        if not parsed_dob:
            raise ValueError("Invalid DOB")
        age = max(0, date.today().year - parsed_dob.year)
        patient = Patient.objects.create(
            name=name,
            age=age,
            phone_number=phone,
            email=email,
            address=address or "Not provided",
        )
        return {"id": str(patient.id)}

    def _api_book_appointment(self, patient_id: str, doctor_id: str, datetime: str, reason: str = "General consultation"):
        patient = Patient.objects.get(id=patient_id)
        doctor = Doctor.objects.get(id=doctor_id)
        parsed = dateparser.parse(datetime)
        if not parsed:
            raise ValueError("Invalid appointment datetime")

        appointment = Appointment.objects.create(
            patient_name=patient.name,
            patient_age=patient.age,
            patient_disease=reason,
            contact_number=patient.phone_number,
            address=patient.address,
            doctor=doctor,
            appointment_date=parsed.date(),
            appointment_time=parsed.time().replace(second=0, microsecond=0),
            status="Pending",
        )
        return {"appointment_id": str(appointment.id)}

    def _api_cancel_appointment(self, appointment_id: str):
        appointment = Appointment.objects.get(id=appointment_id)
        appointment.status = "Cancelled"
        appointment.save(update_fields=["status", "updated_at"])
        return {"appointment_id": str(appointment.id), "status": appointment.status}

    def _api_reschedule_appointment(self, appointment_id: str, new_datetime: str):
        appointment = Appointment.objects.get(id=appointment_id)
        parsed = dateparser.parse(new_datetime)
        if not parsed:
            raise ValueError("Invalid new datetime")
        appointment.appointment_date = parsed.date()
        appointment.appointment_time = parsed.time().replace(second=0, microsecond=0)
        appointment.status = "Pending"
        appointment.save(update_fields=["appointment_date", "appointment_time", "status", "updated_at"])
        return {
            "appointment_id": str(appointment.id),
            "appointment_date": appointment.appointment_date.isoformat(),
            "appointment_time": appointment.appointment_time.isoformat(timespec="minutes"),
        }

    def _api_send_notification(self, patient_id: str, type: str, details: dict[str, Any]):
        MongoDBService.save_notification(
            user_id=str(patient_id),
            notification_type=type,
            title=details.get("title", "Hospital Notification"),
            message=details.get("message", ""),
            metadata=details,
        )
        return {"status": "sent"}

    @staticmethod
    def _safe_json_parse(content: str) -> dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                try:
                    return json.loads(content[start : end + 1])
                except Exception:
                    pass
        return {}

    @staticmethod
    def _parse_date(value: str | None):
        if not value:
            return None
        parsed = dateparser.parse(value)
        return parsed.date() if parsed else None

    @staticmethod
    def _is_emergency(text: str) -> bool:
        return any(keyword in text for keyword in EMERGENCY_KEYWORDS)

    @staticmethod
    def _matched_keyword(text: str) -> str | None:
        for keyword in EMERGENCY_KEYWORDS:
            if keyword in text:
                return keyword
        return None

    @staticmethod
    def _requested_human(text: str) -> bool:
        return any(phrase in text for phrase in HUMAN_REQUEST_PHRASES)
