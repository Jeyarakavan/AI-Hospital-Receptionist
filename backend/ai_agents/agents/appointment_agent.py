from typing import Dict, Any, List
from .base import BaseAgent
from .database_agent import DatabaseAgent
from ..services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)


class AppointmentAgent(BaseAgent):
    """
    Manages appointment booking, cancellation, and rescheduling conversation flows.
    Asks one question at a time and drives state via context['last_step'].

    NOTE: In the new architecture, the Orchestrator prefers FormFlowAgent for
    fresh booking/registration requests (cleaner state machine). AppointmentAgent
    is retained for backwards compatibility and handles mid-flow edge cases
    like multi-appointment cancellation selection.

    FIX LOG
    -------
    1. self.db.book_appointment() → self.db.save_appointment() (method existed,
       alias was added in DatabaseAgent but this also uses the canonical name).
    2. self.db.check_availability() → self.db.get_available_slots() (same fix).
    3. self.db.find_appointment()   — was MISSING; now exists in DatabaseAgent.
    4. self.db.cancel_appointment() — was MISSING; now exists in DatabaseAgent.
    5. Circular import of NotificationAgent inside handle_booking() replaced
       with a safer lazy import guarded by try/except.
    6. handle_booking confirmation now checks context['user_input'] properly.
    """

    def __init__(self, db_agent: DatabaseAgent, llm_service: LLMService):
        super().__init__("Appointment Agent")
        self.db  = db_agent
        self.llm = llm_service

    # ------------------------------------------------------------------
    # Router
    # ------------------------------------------------------------------

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        intent = context.get("intent")
        if intent == "booking":
            return self.handle_booking(context)
        elif intent == "cancellation":
            return self.handle_cancellation(context)
        elif intent == "rescheduling":
            return self.handle_rescheduling(context)
        return {"error": "Invalid intent for AppointmentAgent"}

    # ------------------------------------------------------------------
    # Booking flow
    # ------------------------------------------------------------------

    def handle_booking(self, context: Dict[str, Any]) -> Dict[str, Any]:
        entities = context.get("entities", {})

        # Step 1 — collect patient basics
        required_fields = ["patient_name", "patient_age", "contact_number"]
        missing_fields  = [f for f in required_fields if not entities.get(f)]
        if missing_fields:
            return self._ask_for_missing_info(context, missing_fields)

        # Step 2 — specialty / doctor
        if not entities.get("specialty") and not entities.get("doctor_id"):
            return {
                "response":  "Which department or doctor would you like to see? We have specialists in Cardiology, Dermatology, General Surgery, and more.",
                "next_step": "get_specialty",
            }

        if not entities.get("doctor_id"):
            spec   = entities.get("specialty", "")
            db_res = self.db.list_doctors({"specialization": spec})
            doctors = db_res.get("doctors", [])

            if not doctors:
                return {
                    "response":  f"I couldn't find any {spec} specialists right now. Would you like to try a different department?",
                    "next_step": "get_specialty",
                }
            if len(doctors) == 1:
                entities["doctor_id"]   = doctors[0]["id"]
                entities["doctor_name"] = doctors[0]["name"]
                context["entities"]     = entities
            else:
                doctor_list = ", ".join([f"Dr. {d['name']}" for d in doctors])
                return {
                    "response":  f"We have {len(doctors)} specialists in {spec}: {doctor_list}. Who would you like to see?",
                    "next_step": "pick_doctor",
                }

        # Step 3 — date
        if not entities.get("date"):
            return {
                "response":  f"Which day works best for you to see Dr. {entities.get('doctor_name', 'the doctor')}? (YYYY-MM-DD)",
                "next_step": "get_date",
            }

        # Step 4 — time (fetch live slots first)
        if not entities.get("time"):
            db_res = self.db.get_available_slots({
                "doctor_id": entities["doctor_id"],
                "date":      entities["date"],
            })
            slots = db_res.get("available_slots", [])
            if not slots:
                return {
                    "response":  f"Dr. {entities.get('doctor_name')} has no available slots on {entities['date']}. Could you pick another day?",
                    "next_step": "get_date",
                }
            slot_list = ", ".join(slots[:6])
            return {
                "response":  f"Dr. {entities.get('doctor_name')} has these slots on {entities['date']}: {slot_list}. Which one works for you?",
                "next_step": "pick_time",
            }

        # Step 5 — confirm
        confirm_text = (
            f"To confirm: appointment for {entities['patient_name']} "
            f"(age {entities['patient_age']}) with Dr. {entities.get('doctor_name')} "
            f"on {entities['date']} at {entities['time']}. Shall I go ahead? (yes/no)"
        )

        user_input = context.get("user_input", "").lower().strip()
        if context.get("last_step") == "confirmation":
            if any(w in user_input for w in ("yes", "yeah", "sure", "confirm", "ok")):
                db_res = self.db.save_appointment(entities)
                if db_res.get("success"):
                    self._send_confirmation(db_res.get("appointment_id"), entities)
                    return {
                        "response": (
                            f"✅ Your appointment is confirmed for {entities['date']} "
                            f"at {entities['time']}. You'll receive a confirmation SMS shortly. "
                            "Is there anything else I can help you with?"
                        ),
                        "status": "completed",
                    }
                else:
                    return {"response": f"I had trouble saving the booking: {db_res.get('error')}. Please try again."}
            elif any(w in user_input for w in ("no", "nope", "cancel", "stop")):
                return {"response": "No problem, the booking has been cancelled. Is there anything else I can help you with?", "status": "cancelled"}

        return {"response": confirm_text, "next_step": "confirmation"}

    # ------------------------------------------------------------------
    # Cancellation flow
    # ------------------------------------------------------------------

    def handle_cancellation(self, context: Dict[str, Any]) -> Dict[str, Any]:
        entities = context.get("entities", {})
        name     = entities.get("patient_name")
        phone    = entities.get("contact_number")

        if not name or not phone:
            return {
                "response":  "I can help you cancel. Could you please provide your full name and the phone number used for the booking?",
                "next_step": "get_cancel_info",
            }

        db_res      = self.db.find_appointment({"patient_name": name, "contact_number": phone})
        appointments = db_res.get("appointments", [])

        if not appointments:
            return {"response": "I couldn't find any active appointments under that name and phone number. Could you double-check the details?"}

        if len(appointments) == 1:
            appt       = appointments[0]
            user_input = context.get("user_input", "").lower()

            if context.get("last_step") == "cancel_confirmation":
                if any(w in user_input for w in ("yes", "yeah", "sure", "confirm")):
                    self.db.cancel_appointment({"appointment_id": appt["id"]})
                    return {
                        "response": f"Your appointment on {appt['appointment_date']} at {appt['appointment_time']} has been cancelled successfully.",
                        "status":   "completed",
                    }
                else:
                    return {"response": "Okay, I won't cancel it. Is there anything else I can help you with?", "status": "cancelled"}

            return {
                "response":  f"I found your appointment on {appt['appointment_date']} at {appt['appointment_time']} with Dr. {appt['doctor_name']}. Are you sure you want to cancel it? (yes/no)",
                "next_step": "cancel_confirmation",
            }

        # Multiple appointments found
        appt_list = "\n".join([
            f"{i+1}. {a['appointment_date']} at {a['appointment_time']} with Dr. {a['doctor_name']}"
            for i, a in enumerate(appointments)
        ])
        return {
            "response":  f"I found {len(appointments)} appointments:\n{appt_list}\nWhich one would you like to cancel? (enter the number)",
            "next_step": "pick_cancel_appt",
        }

    # ------------------------------------------------------------------
    # Rescheduling flow
    # ------------------------------------------------------------------

    def handle_rescheduling(self, context: Dict[str, Any]) -> Dict[str, Any]:
        if not context.get("old_appointment_cancelled"):
            res = self.handle_cancellation(context)
            if res.get("status") == "completed":
                context["old_appointment_cancelled"] = True
                context["intent"]  = "booking"
                # Clear old date/time so booking flow asks for them fresh
                context.get("entities", {}).pop("date", None)
                context.get("entities", {}).pop("time", None)
                return {
                    "response":  f"{res['response']} Now let's find a new time for your visit. What day would you prefer?",
                    "next_step": "get_date",
                }
            return res
        return self.handle_booking(context)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _ask_for_missing_info(self, context: Dict[str, Any], missing: List[str]) -> Dict[str, Any]:
        prompt_map = {
            "patient_name":    "Could you please tell me your full name?",
            "patient_age":     "What is your age?",
            "contact_number":  "What phone number should we use for the confirmation SMS?",
        }
        field = missing[0]
        return {"response": prompt_map.get(field, f"Could you provide your {field}?"), "next_step": f"get_{field}"}

    def _send_confirmation(self, appointment_id: str, entities: Dict[str, Any]):
        """Fire-and-forget: send SMS/email confirmation. Errors are logged, not raised."""
        try:
            from .notification_agent import NotificationAgent
            notifier = NotificationAgent()
            notifier.process({
                "notify_intent": "send_booking_confirmation",
                "notify_data":   {"appointment_id": appointment_id},
            })
        except Exception as e:
            logger.error(f"Notification dispatch error: {e}")