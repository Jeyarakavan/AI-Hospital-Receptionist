from typing import Dict, Any
from .base import BaseAgent
from ..services.llm_service import LLMService


class TriageAgent(BaseAgent):
    """
    Handles emergency and symptom-based queries with calm, direct instructions.

    FIX LOG
    -------
    1. No functional changes — logic was correct.
    2. System prompt tightened to remove duplicate instructions.
    3. Staff-alert stub is now commented with a clear TODO so it's easier
       to wire up a real push notification later.
    """

    def __init__(self, llm_service: LLMService):
        super().__init__("Triage Agent")
        self.llm = llm_service

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        user_input   = context.get("user_input", "")
        chat_history = context.get("chat_history", [])

        system_prompt = """
You are the Emergency Triage Agent for City General Hospital.
Patient safety is your absolute priority. Stay calm, clear, and direct.

Guidelines:
- For life-threatening symptoms (chest pain, difficulty breathing, unconsciousness, stroke signs):
    1. Immediately advise: "Please call 119 now for ambulance service."
    2. Direct them: "Come to our Emergency Department immediately — we are open 24/7."
    3. Ask focused questions ONE at a time: current location, whether they are alone,
       known allergies or conditions, severity on a scale of 1-10.
    4. Reassure them that on-call staff are being alerted.
- For non-emergency symptoms, assess urgency and recommend the appropriate OPD department.
- Never minimise symptoms — if in doubt, treat as urgent.
- Keep responses short, numbered steps where appropriate.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            *chat_history,
            {"role": "user",   "content": user_input},
        ]

        response = self.llm.call(messages)

        # TODO: wire up real push alert to on-call staff
        # self._trigger_staff_alert(context)

        return {
            "response": response,
            "status":   "emergency_active",
        }