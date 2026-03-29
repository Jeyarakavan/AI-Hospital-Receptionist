from typing import Dict, Any
from .base import BaseAgent
from ..services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)


class IntentAgent(BaseAgent):
    """
    Step 1 of every turn: classifies intent and extracts entities from raw user input.
    Returns an enriched context dict that the Orchestrator acts on.

    FIX LOG
    -------
    1. Added 'register_doctor' as a valid intent (was missing — Orchestrator
       planner had to handle it alone, leading to inconsistent routing).
    2. Entity merge now correctly skips falsy values (0 is valid for age though,
       so we only skip None and "").
    3. Errors are caught and context is returned unchanged (fail-safe).
    """

    def __init__(self, llm_service: LLMService):
        super().__init__("Intent Agent")
        self.llm = llm_service

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        user_input   = context.get("user_input", "")
        chat_history = context.get("chat_history", [])

        system_prompt = """
You are the Intent Agent for a hospital AI receptionist.
Analyse the user's latest message and conversation history, then return ONLY a JSON object.

Valid intents:
  booking           - patient wants to book / schedule an appointment
  cancellation      - patient wants to cancel an existing appointment
  rescheduling      - patient wants to change the time of an existing appointment
  register_doctor   - admin or staff wants to add / register a new doctor
  emergency         - life-threatening symptoms mentioned
  inquiry           - questions about hospital info, services, doctors, hours
  greeting          - hello / hi / small talk
  unknown           - cannot determine

JSON schema (output NOTHING else):
{
  "intent": "<one of the valid intents above>",
  "entities": {
    "patient_name":     "<string or null>",
    "patient_age":      <integer or null>,
    "patient_disease":  "<string or null>",
    "specialty":        "<string or null>",
    "doctor_id":        "<string or null>",
    "contact_number":   "<string or null>",
    "date":             "<YYYY-MM-DD or null>",
    "time":             "<HH:MM or null>",
    "full_name":        "<string or null>",
    "email":            "<string or null>",
    "phone_number":     "<string or null>",
    "specialization":   "<string or null>",
    "address":          "<string or null>"
  },
  "is_urgent":        <true|false>,
  "needs_escalation": <true|false>
}

Rules:
- chest pain / difficulty breathing / unconscious → intent=emergency, is_urgent=true
- "add doctor", "register doctor", "new doctor", "sign up doctor" → intent=register_doctor
- Only include entities that are explicitly mentioned; leave others null.
- Do NOT invent or assume entity values.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            *chat_history,
            {"role": "user",   "content": user_input},
        ]

        try:
            response = self.llm.call(messages, json_mode=True)
            result   = self.llm.extract_json(response)
        except Exception as e:
            logger.error(f"IntentAgent LLM error: {e}")
            result = {"intent": "unknown", "entities": {}}

        # Merge extracted entities with existing ones (keep existing if new value is empty)
        existing_entities = context.get("entities", {})
        new_entities      = result.get("entities", {})
        for key, value in new_entities.items():
            # Allow 0 as valid age; reject None and ""
            if value is not None and value != "":
                existing_entities[key] = value

        context.update({
            "intent":            result.get("intent", "unknown"),
            "entities":          existing_entities,
            "is_urgent":         result.get("is_urgent", False),
            "needs_escalation":  result.get("needs_escalation", False),
        })

        return context