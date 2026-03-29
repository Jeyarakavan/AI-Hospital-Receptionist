from typing import Dict, Any, List, Optional, Tuple
from .base import BaseAgent
from .database_agent import DatabaseAgent
from .memory_agent import MemoryAgent
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Flow definitions
# Each flow is an ordered list of steps: (field_key, question_text, required)
# ---------------------------------------------------------------------------

REGISTER_DOCTOR_STEPS: List[Tuple[str, str, bool]] = [
    ("full_name",       "What is the doctor's full name?",                          True),
    ("username",        "What username should they use for login?",                  True),
    ("specialization",  "What is their specialization? (e.g. Cardiology, ENT…)",    True),
    ("email",           "What is the doctor's email address?",                       True),
    ("phone_number",    "What is their phone number?",                               True),
    ("address",         "What is their clinic/home address? (or type 'skip')",       False),
    ("date_of_birth",   "What is their date of birth? (YYYY-MM-DD, or type 'skip')", False),
]

BOOK_APPOINTMENT_STEPS: List[Tuple[str, str, bool]] = [
    ("patient_name",    "What is the patient's full name?",                          True),
    ("patient_age",     "What is the patient's age?",                                True),
    ("contact_number",  "What phone number should we use for the confirmation SMS?", True),
    ("specialty",       "Which department or specialty are they visiting? (e.g. Cardiology, General)", True),
    ("date",            "What date would you prefer? (YYYY-MM-DD)",                  True),
    ("time",            "What time? Available slots will be shown next.",            True),
]


class FormFlowAgent(BaseAgent):
    """
    Drives any multi-step guided form (register doctor, book appointment, etc.)
    by asking exactly ONE question per turn and persisting answers in MemoryAgent.

    The Orchestrator delegates here whenever a flow is active or a new one starts.
    This fully replaces the ad-hoc missing-field logic that was spread across
    AppointmentAgent and the Orchestrator planner prompt.

    Flow lifecycle
    --------------
    start_flow(call_id, flow_name)  → asks first question
    advance(call_id, user_answer)   → stores answer, asks next question OR executes
    cancel_flow(call_id)            → clears state
    """

    FLOWS = {
        "register_doctor":    REGISTER_DOCTOR_STEPS,
        "book_appointment":   BOOK_APPOINTMENT_STEPS,
    }

    def __init__(self, db_agent: DatabaseAgent, memory: MemoryAgent):
        super().__init__("Form Flow Agent")
        self.db     = db_agent
        self.memory = memory

    # ------------------------------------------------------------------
    # Public API used by Orchestrator
    # ------------------------------------------------------------------

    def is_flow_active(self, call_id: str) -> bool:
        state = self.memory.get_flow_state(call_id)
        return bool(state.get("flow") and state.get("step") is not None)

    def start_flow(self, call_id: str, flow_name: str) -> Dict[str, Any]:
        """Begin a new guided flow from step 0."""
        if flow_name not in self.FLOWS:
            return {"response": f"Unknown flow: {flow_name}", "flow_done": False}

        self.memory.set_flow_state(call_id, flow_name, 0)
        # Clear any stale partial data for this flow
        return self._ask_step(call_id, flow_name, 0)

    def advance(self, call_id: str, user_input: str) -> Dict[str, Any]:
        """
        Accept the user's answer for the current step, store it,
        then ask the next question or execute the action if complete.
        """
        state     = self.memory.get_flow_state(call_id)
        flow_name = state.get("flow")
        step_idx  = state.get("step", 0)

        if not flow_name or flow_name not in self.FLOWS:
            return {"response": "No active flow.", "flow_done": False}

        steps = self.FLOWS[flow_name]
        field, question, required = steps[step_idx]

        # Handle 'skip' for optional fields
        skip_requested = user_input.strip().lower() in ("skip", "s", "-", "n/a", "no")
        if not required and skip_requested:
            value = None
        else:
            value = user_input.strip()
            if required and not value:
                return {
                    "response": f"This field is required. {question}",
                    "flow_done": False,
                }

        # Persist the answer
        if value:
            self.memory.update_entities(call_id, {field: value})

        # Advance to next step
        next_step = step_idx + 1

        # Skip slots step for booking — we handle it after date is confirmed
        if flow_name == "book_appointment" and next_step < len(steps):
            next_field = steps[next_step][0]
            # When we reach the 'time' step, first show available slots
            if next_field == "time":
                entities  = self.memory.get_entities(call_id)
                slot_resp = self._get_slots_prompt(entities)
                self.memory.set_flow_state(call_id, flow_name, next_step)
                return {"response": slot_resp, "flow_done": False}

        if next_step < len(steps):
            self.memory.set_flow_state(call_id, flow_name, next_step)
            return self._ask_step(call_id, flow_name, next_step)

        # All steps done — execute
        return self._execute_flow(call_id, flow_name)

    def cancel_flow(self, call_id: str) -> Dict[str, Any]:
        self.memory.clear_flow_state(call_id)
        return {"response": "No problem, I've cancelled that. How else can I help you?",
                "flow_done": True}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ask_step(self, call_id: str, flow_name: str, step_idx: int) -> Dict[str, Any]:
        steps = self.FLOWS[flow_name]
        field, question, required = steps[step_idx]
        optional_hint = "" if required else " (optional — type 'skip' to leave blank)"
        return {
            "response":   question + optional_hint,
            "flow_done":  False,
            "flow":       flow_name,
            "step":       step_idx,
            "field":      field,
        }

    def _get_slots_prompt(self, entities: Dict[str, Any]) -> str:
        """Fetch available slots and present them before asking for time."""
        doctor_id = entities.get("doctor_id")
        date      = entities.get("date")

        if not doctor_id or not date:
            return (
                "What time works best for you? "
                "(Please note: exact slot availability will be confirmed upon booking.)"
            )

        res   = self.db.get_available_slots({"doctor_id": doctor_id, "date": date})
        slots = res.get("available_slots", [])

        if not slots:
            return (
                f"There are no available slots on {date} for that doctor. "
                "Could you choose a different date? (YYYY-MM-DD)"
            )

        slot_list = ", ".join(slots[:6])
        return (
            f"Here are the available slots on {date}: {slot_list}. "
            "Which time would you like?"
        )

    def _execute_flow(self, call_id: str, flow_name: str) -> Dict[str, Any]:
        """All data collected — now hit the database."""
        entities = self.memory.get_entities(call_id)
        self.memory.clear_flow_state(call_id)

        if flow_name == "register_doctor":
            result = self.db.register_doctor(entities)
            if result.get("success"):
                return {
                    "response":   result["message"],
                    "flow_done":  True,
                    "db_result":  result,
                }
            else:
                # If the DB said fields are still missing (shouldn't happen normally)
                missing = result.get("missing_fields", [])
                if missing:
                    return {
                        "response":  f"Oops, I'm still missing: {', '.join(missing)}. Let me ask again.",
                        "flow_done": False,
                        "restart":   True,
                    }
                return {
                    "response":  f"Registration failed: {result.get('error')}. Please try again.",
                    "flow_done": True,
                }

        elif flow_name == "book_appointment":
            # Resolve doctor_id from specialty if not yet set
            if not entities.get("doctor_id") and entities.get("specialty"):
                entities = self._resolve_doctor(call_id, entities)

            result = self.db.save_appointment(entities)
            if result.get("success"):
                details = result["details"]
                return {
                    "response": (
                        f"✅ Appointment booked! {details['patient']} will see "
                        f"Dr. {details['doctor']} on {details['date']} at {details['time']}. "
                        "A confirmation SMS will be sent shortly."
                    ),
                    "flow_done":      True,
                    "db_result":      result,
                    "trigger_notify": True,
                    "appointment_id": result.get("appointment_id"),
                }
            else:
                return {
                    "response":  f"Booking failed: {result.get('error')}. Please try again.",
                    "flow_done": True,
                }

        return {"response": "Flow completed.", "flow_done": True}

    def _resolve_doctor(self, call_id: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Auto-assign doctor_id when only specialty is known and there's one match."""
        res     = self.db.list_doctors({"specialization": entities.get("specialty", "")})
        doctors = res.get("doctors", [])
        if len(doctors) == 1:
            entities["doctor_id"]   = doctors[0]["id"]
            entities["doctor_name"] = doctors[0]["name"]
            self.memory.update_entities(call_id, {
                "doctor_id":   entities["doctor_id"],
                "doctor_name": entities["doctor_name"],
            })
        return entities

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """BaseAgent compatibility entry point."""
        call_id    = context.get("call_id", "default")
        user_input = context.get("user_input", "")
        action     = context.get("action")

        if action == "start":
            return self.start_flow(call_id, context.get("flow_name", ""))
        if action == "cancel":
            return self.cancel_flow(call_id)

        return self.advance(call_id, user_input)