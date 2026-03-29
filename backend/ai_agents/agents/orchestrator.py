from typing import Dict, Any
from .base import BaseAgent
from .database_agent import DatabaseAgent
from .notification_agent import NotificationAgent
from .memory_agent import MemoryAgent
from .triage_agent import TriageAgent
from .info_agent import InfoAgent
from .intent_agent import IntentAgent
from .form_flow_agent import FormFlowAgent
from ..services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)


class OrchestratorAgent(BaseAgent):
    """
    The Brain: receives every user message, runs it through the pipeline, and
    returns a final natural-language response.

    Turn pipeline
    -------------
    1. Ensure session exists in MemoryAgent.
    2. Run IntentAgent  → extract intent + entities from raw input.
    3. Check if a multi-step flow (FormFlowAgent) is already active
       → if yes, advance it with the user's answer and return.
    4. If a new flow-worthy intent is detected (register_doctor, booking, etc.)
       → start the appropriate FormFlowAgent flow.
    5. For single-turn intents (inquiry, triage, greeting, emergency)
       → delegate to the right specialist agent.
    6. Synthesise a final text response.
    7. Persist to MemoryAgent + fire notifications if needed.

    FIX LOG
    -------
    1. Orchestrator used to do ALL intent classification AND entity extraction
       inline in the planner prompt, but then also had an IntentAgent that was
       NEVER called — both doing the same job. Now IntentAgent is step 2 of
       every turn and the planner only does routing.
    2. Multi-step flows (register_doctor, book_appointment) are now fully
       owned by FormFlowAgent — the Orchestrator no longer tries to track
       missing fields itself, which was the main reason registration silently
       failed (it called the DB immediately without all fields).
    3. memory.add_to_history() was called with wrong signature
       (role and call_id swapped). Fixed.
    4. Notification trigger after booking now always runs, even when
       FormFlowAgent executes the booking (was only triggered in the old
       database_agent branch).
    5. Graceful fallback for every LLM/agent error — no unhandled exceptions
       bubble up to the chat interface.
    """

    # Intents that trigger a guided multi-step form
    FLOW_INTENTS = {
        "register_doctor":  "register_doctor",
        "booking":          "book_appointment",
    }

    def __init__(self):
        super().__init__("Hospital Coordinator")
        self.llm         = LLMService()
        self.db          = DatabaseAgent()
        self.notifier    = NotificationAgent()
        self.memory      = MemoryAgent()
        self.intent_agent = IntentAgent(self.llm)
        self.triage      = TriageAgent(self.llm)
        self.info        = InfoAgent(self.db, self.llm)
        self.flow_agent  = FormFlowAgent(self.db, self.memory)

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    def process_chat(self, user_input: str, call_id: str) -> Dict[str, Any]:
        # 1. Ensure session
        self.memory.start_session(call_id)
        history = self.memory.get_history(call_id)

        # 2. Classify intent and extract entities
        intent_context = self.intent_agent.process({
            "user_input":   user_input,
            "chat_history": history,
            "entities":     self.memory.get_entities(call_id),
        })
        intent   = intent_context.get("intent",   "unknown")
        entities = intent_context.get("entities", {})
        is_urgent = intent_context.get("is_urgent", False)

        # Persist freshly extracted entities immediately
        self.memory.update_entities(call_id, entities)

        # 3. Emergency fast-path (always wins)
        if intent == "emergency" or is_urgent:
            result     = self.triage.process({"user_input": user_input, "chat_history": history})
            final_text = result.get("response", "Please call 119 immediately.")
            return self._finalise(call_id, user_input, final_text, intent)

        # 4. If a multi-step flow is already in progress, advance it
        if self.flow_agent.is_flow_active(call_id):
            # Check if user wants to cancel the flow
            if any(w in user_input.lower() for w in ("cancel", "stop", "quit", "abort", "nevermind", "never mind")):
                result = self.flow_agent.cancel_flow(call_id)
            else:
                result = self.flow_agent.advance(call_id, user_input)

            final_text = result.get("response", "")

            # If the flow just completed a booking, fire notifications
            if result.get("trigger_notify") and result.get("appointment_id"):
                self.notifier.process({
                    "notify_intent": "send_booking_confirmation",
                    "notify_data":   {"appointment_id": result["appointment_id"]},
                })

            return self._finalise(call_id, user_input, final_text, intent)

        # 5. Start a new guided flow if the intent requires one
        if intent in self.FLOW_INTENTS:
            flow_name = self.FLOW_INTENTS[intent]
            result    = self.flow_agent.start_flow(call_id, flow_name)
            final_text = result.get("response", "")
            return self._finalise(call_id, user_input, final_text, intent)

        # 6. Single-turn specialist routing
        final_text = self._route_single_turn(intent, user_input, history)

        return self._finalise(call_id, user_input, final_text, intent)

    # ------------------------------------------------------------------
    # Single-turn routing (no persistent state needed)
    # ------------------------------------------------------------------

    def _route_single_turn(self, intent: str, user_input: str,
                           history: list) -> str:
        ctx = {"user_input": user_input, "chat_history": history}

        if intent == "inquiry":
            return self.info.process(ctx).get("response", "")

        if intent in ("cancellation", "rescheduling"):
            # These are multi-turn but short — handled via a light LLM prompt
            return self._handle_simple_cancellation(user_input, history)

        if intent == "greeting":
            return self._greet(user_input, history)

        # Fallback: let the LLM decide what to say
        return self._fallback_response(user_input, history)

    def _handle_simple_cancellation(self, user_input: str, history: list) -> str:
        prompt = [
            {"role": "system", "content": (
                "You are a hospital receptionist. The patient wants to cancel or reschedule. "
                "Ask them for their full name and the phone number used for the booking so you "
                "can look it up. Be polite and professional."
            )},
            *history,
            {"role": "user", "content": user_input},
        ]
        try:
            return self.llm.call(prompt)
        except Exception as e:
            logger.error(f"Cancellation LLM error: {e}")
            return "I can help you with that. Could you please share your name and the phone number used when booking?"

    def _greet(self, user_input: str, history: list) -> str:
        prompt = [
            {"role": "system", "content": (
                "You are a friendly hospital AI receptionist. Greet the patient warmly and "
                "briefly explain you can help with: booking appointments, general information, "
                "doctor registration, and medical emergencies. Keep it to 2-3 sentences."
            )},
            {"role": "user", "content": user_input},
        ]
        try:
            return self.llm.call(prompt)
        except Exception as e:
            logger.error(f"Greeting LLM error: {e}")
            return ("Hello! Welcome to City General Hospital. I can help you book appointments, "
                    "answer questions about our services, or register new doctors. How can I assist you today?")

    def _fallback_response(self, user_input: str, history: list) -> str:
        prompt = [
            {"role": "system", "content": (
                "You are a hospital AI receptionist. You help with: "
                "booking appointments, hospital information, doctor registration, and emergencies. "
                "If the request is outside these areas, politely redirect. Never say you are "
                "'still learning'."
            )},
            *history,
            {"role": "user", "content": user_input},
        ]
        try:
            return self.llm.call(prompt)
        except Exception as e:
            logger.error(f"Fallback LLM error: {e}")
            return "I'm here to help. Could you please rephrase your request?"

    # ------------------------------------------------------------------
    # Finalise turn
    # ------------------------------------------------------------------

    def _finalise(self, call_id: str, user_input: str,
                  final_text: str, intent: str) -> Dict[str, Any]:
        if not final_text:
            final_text = "I'm here to help — could you tell me a bit more about what you need?"

        # Persist to memory
        self.memory.add_to_history(call_id, "user", user_input, intent)
        self.memory.add_to_history(call_id, "ai",   final_text, intent)

        # Log to MongoDB
        self.notifier.process({
            "notify_intent": "log_interaction",
            "notify_data": {
                "call_id":     call_id,
                "user_input":  user_input,
                "ai_response": final_text,
                "intent":      intent,
            },
        })

        return {
            "response_text": final_text,
            "intent":        intent,
        }

    # ------------------------------------------------------------------
    # BaseAgent requirement
    # ------------------------------------------------------------------

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        text    = context.get("text", "") or context.get("user_input", "")
        call_id = context.get("call_id", "default")
        return self.process_chat(text, call_id)