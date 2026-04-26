from typing import Dict, Any, List, Optional, Tuple
from .base import BaseAgent
from .database_agent import DatabaseAgent
from .memory_agent import MemoryAgent
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Flow definitions
# Each flow is an ordered list of steps: (field_key, question_text, required)
# ---------------------------------------------------------------------------

REGISTER_DOCTOR_STEPS: List[Tuple[str, str, bool]] = [
    ("full_name",       "What is the doctor's full name?",                          True),
    ("username",        "What username should they use for login?",                  True),
    ("specialization",  "What is their specialization? Select from: General Practitioner, Cardiologist, Neurologist, Pulmonologist, Gastroenterologist, Orthopedic Doctor, Ophthalmologist, ENT Specialist, Dermatologist, Endocrinologist, Hematologist, Oncologist, Pediatrician, Gynecologist, General Surgeon, Psychiatrist, etc.", True),
    ("email",           "What is the doctor's email address?",                       True),
    ("phone_number",    "What is their phone number?",                               True),
    ("address",         "What is their clinic/home address? (or type 'skip')",       False),
    ("date_of_birth",   "What is their date of birth? (YYYY-MM-DD, or type 'skip')", False),
]

BOOK_APPOINTMENT_STEPS: List[Tuple[str, str, bool]] = [
    ("patient_name",    "Sure! What is the patient's full name?",                    True),
    ("patient_age",     "What is the patient's age?",                                True),
    ("contact_number",  "What phone number should we use for confirmation? (e.g. +94771234567)", True),
    ("patient_disease", "What is the patient's condition or symptoms?\n(e.g. fever, chest pain, back pain, headache)\nI'll suggest the right doctors based on this.", True),
    ("doctor_id",       "Please choose a doctor from the list above (type the number or the doctor's name).", True),
    ("date",            "What date would you prefer for the appointment? (YYYY-MM-DD)", True),
    ("time",            "What time? Available slots will be shown next.",            True),
    ("address",         "What is the patient's address?",                            True),
    ("patient_email",   "What is the patient's email address? (type 'skip' if not available)", False),
]


class FormFlowAgent(BaseAgent):
    """
    Drives any multi-step guided form (register doctor, book appointment, etc.)
    by asking exactly ONE question per turn and persisting answers in MemoryAgent.

    Enhanced booking flow:
    ─────────────────────
    1. patient_name
    2. patient_age
    3. contact_number
    4. patient_disease  → after storing, AI fetches doctors by keyword and presents them
    5. doctor_id        → user picks from list (number or name)
    6. date
    7. time             → before asking, show available slots; if none suggest another date
    8. address
    9. patient_email    (optional)
    → Execute: save appointment, send confirmation to patient + doctor
    """

    FLOWS = {
        "register_doctor":    REGISTER_DOCTOR_STEPS,
        "book_appointment":   BOOK_APPOINTMENT_STEPS,
    }

    # Comprehensive Symptom → specialization mapping based on user provide data
    SYMPTOM_SPECIALTY_MAP = {
        # General
        "fever": "General Practitioner (GP)", "cold": "General Practitioner (GP)", "cough": "General Practitioner (GP)", "flu": "General Practitioner (GP)",
        "infection": "General Practitioner (GP)", "general": "General Practitioner (GP)",
        "family": "Family Medicine Doctor",
        # Heart
        "chest pain": "Cardiologist", "heart": "Cardiologist", "palpitation": "Cardiologist", "blood pressure": "Cardiologist",
        "heart attack": "Cardiologist", "heart surgery": "Cardiac Surgeon",
        # Brain
        "headache": "Neurologist", "migraine": "Neurologist", "seizure": "Neurologist", "stroke": "Neurologist", "nerves": "Neurologist",
        "brain surgery": "Neurosurgeon", "spine surgery": "Neurosurgeon",
        # Lungs
        "breathing": "Pulmonologist", "asthma": "Pulmonologist", "tb": "Pulmonologist", "lung": "Pulmonologist",
        # Digestive
        "stomach": "Gastroenterologist", "liver": "Hepatologist", "intestines": "Gastroenterologist", "digestion": "Gastroenterologist",
        # Bones
        "back pain": "Orthopedic Doctor", "joint": "Rheumatologist", "bone": "Orthopedic Doctor", "fracture": "Orthopedic Doctor",
        "arthritis": "Rheumatologist",
        # Eyes
        "eye": "Ophthalmologist", "vision": "Ophthalmologist", "blind": "Ophthalmologist",
        # ENT
        "ear": "ENT Specialist (Otolaryngologist)", "throat": "ENT Specialist (Otolaryngologist)", "nose": "ENT Specialist (Otolaryngologist)",
        # Skin
        "skin": "Dermatologist", "rash": "Dermatologist", "acne": "Dermatologist", "hair": "Dermatologist", "nails": "Dermatologist",
        # Hormones
        "diabetes": "Endocrinologist", "thyroid": "Endocrinologist", "hormones": "Endocrinologist",
        # Cancer
        "cancer": "Oncologist", "tumor": "Oncologist", "blood disease": "Hematologist",
        # Children
        "child": "Pediatrician", "baby": "Pediatrician", "infant": "Pediatrician", "kid": "Pediatrician",
        # Women
        "pregnancy": "Obstetrician", "gynae": "Gynecologist", "women": "Gynecologist", "childbirth": "Obstetrician",
        # Surgery
        "appendix": "General Surgeon", "hernia": "General Surgeon", "cosmetic": "Plastic Surgeon", "urinary": "Urologist",
        # Mental
        "mental": "Psychiatrist", "anxiety": "Psychologist", "depression": "Psychologist", "therapy": "Psychologist",
        # Emergency
        "accident": "Emergency Doctor", "urgent": "Emergency Doctor", "icu": "Intensivist",
        # Teeth
        "teeth": "Dentist", "gums": "Dentist", "tooth": "Dentist",
        # Testing
        "x-ray": "Radiologist", "scan": "Radiologist", "lab": "Pathologist", "diagnosis": "Pathologist",
        # Other
        "anesthesia": "Anesthesiologist", "recovery": "Physiotherapist", "exercise": "Physiotherapist",
        "covid": "Infectious Disease Specialist", "dengue": "Infectious Disease Specialist",
        "kidney": "Nephrologist", "allergy": "Allergist", "sports injury": "Sports Medicine Doctor",
        "elderly": "Geriatrician", "old": "Geriatrician"
    }

    def __init__(self, db_agent: DatabaseAgent, memory: MemoryAgent):
        super().__init__("Form Flow Agent")
        self.db     = db_agent
        self.memory = memory
        self._doctor_cache_by_call: Dict[str, Dict[str, Dict[str, Any]]] = {}

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
        skip_requested = user_input.strip().lower() in ("skip", "s", "-", "n/a", "none", "no")
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

        # ── Special handling after patient_disease is captured ──
        if flow_name == "book_appointment" and field == "patient_disease" and value:
            doctor_prompt = self._get_doctors_for_disease(call_id, value)
            # Store the suggested doctors list in memory for next step matching
            next_step = step_idx + 1
            self.memory.set_flow_state(call_id, flow_name, next_step)
            return {
                "response": doctor_prompt,
                "flow_done": False,
                "flow": flow_name,
                "step": next_step,
                "field": "doctor_id",
            }

        # ── Special handling at doctor_id step: resolve name/number to ID ──
        if flow_name == "book_appointment" and field == "doctor_id" and value:
            resolved = self._resolve_doctor_from_input(call_id, value)
            if resolved.get("error"):
                return {
                    "response": resolved["error"],
                    "flow_done": False,
                }
            # Save the resolved doctor info
            self.memory.update_entities(call_id, {
                "doctor_id":   resolved["doctor_id"],
                "doctor_name": resolved["doctor_name"],
            })

        # Advance to next step
        next_step = step_idx + 1

        # ── Special: before asking for time, show available slots ──
        if flow_name == "book_appointment" and next_step < len(steps):
            next_field = steps[next_step][0]
            if next_field == "time":
                entities  = self.memory.get_entities(call_id)
                slot_resp = self._get_slots_prompt(call_id, entities)
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

    def _get_doctors_for_disease(self, call_id: str, disease: str) -> str:
        """
        Find doctors relevant to disease/symptoms, present a numbered list.
        Stores the list in the class-level dict keyed by lowercased disease for later resolution.
        """
        # Try to map symptom to specialty keyword
        disease_lower = disease.lower()
        specialty_keyword = ""
        for symptom, spec in self.SYMPTOM_SPECIALTY_MAP.items():
            if symptom in disease_lower:
                specialty_keyword = spec
                break

        # Search doctors
        res = self.db.list_doctors({"specialization": specialty_keyword} if specialty_keyword else {})
        doctors = res.get("doctors", [])

        if not doctors:
            # Fallback: get all doctors
            res = self.db.list_doctors({})
            doctors = res.get("doctors", [])

        if not doctors:
            return (
                "I couldn't find any available doctors right now. "
                "Please contact the hospital directly or try again later."
            )

        # Store the candidates list in memory for resolution
        self._doctor_cache_by_call[call_id] = {str(i+1): d for i, d in enumerate(doctors[:8])}

        lines = [f"Based on '{disease}', here are our available doctors:\n"]
        for i, d in enumerate(doctors[:8], 1):
            spec = d.get("specialization", "General")
            lines.append(f"  {i}. Dr. {d['name']} — {spec}")

        lines.append("\nPlease type the number or the doctor's name to choose.")
        return "\n".join(lines)

    def _resolve_doctor_from_input(self, call_id: str, user_input: str) -> Dict[str, Any]:
        """Resolve the user's pick (number or name) to a doctor_id."""
        cache = self._doctor_cache_by_call.get(call_id, {})

        # By number
        if user_input.strip().isdigit():
            pick = cache.get(user_input.strip())
            if pick:
                return {"doctor_id": pick["id"], "doctor_name": pick["name"]}

        # By name (partial match)
        name_lower = user_input.lower()
        for d in cache.values():
            if name_lower in d["name"].lower():
                return {"doctor_id": d["id"], "doctor_name": d["name"]}

        # Try DB search as fallback
        res = self.db.list_doctors({})
        for d in res.get("doctors", []):
            if name_lower in d["name"].lower():
                return {"doctor_id": d["id"], "doctor_name": d["name"]}

        # Re-present list
        options = "\n".join(
            f"  {k}. Dr. {v['name']}" for k, v in cache.items()
        ) if cache else "No options cached."
        return {
            "error": (
                f"I couldn't find a doctor matching '{user_input}'. "
                f"Please choose by number:\n{options}"
            )
        }

    def _get_slots_prompt(self, call_id: str, entities: Dict[str, Any]) -> str:
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
            # No slots — back up to date step
            entities_copy = dict(entities)
            entities_copy.pop("date", None)
            self.memory.update_entities(call_id, {"date": None})
            # Move state back to the date step (index 5 in BOOK_APPOINTMENT_STEPS)
            steps = self.FLOWS["book_appointment"]
            date_step = next((i for i, s in enumerate(steps) if s[0] == "date"), 5)
            self.memory.set_flow_state(call_id, "book_appointment", date_step)
            doctor_name = entities.get("doctor_name", "that doctor")
            return (
                f"Sorry, Dr. {doctor_name} has no available slots on {date}. "
                "Could you choose a different date? (YYYY-MM-DD)"
            )

        slot_list = ", ".join(slots[:8])
        doctor_name = entities.get("doctor_name", "the doctor")
        return (
            f"Dr. {doctor_name} is available on {date} at: {slot_list}.\n"
            "Which time would you like? (type exactly as shown, e.g. 09:00:00)"
        )

    def _normalize_slot_time(self, user_time: str, slots: List[str]) -> Optional[str]:
        clean = (user_time or "").strip()
        for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I %p", "%I%p"):
            try:
                parsed = datetime.strptime(clean, fmt).time().strftime("%H:%M:%S")
                if parsed in slots:
                    return parsed
            except ValueError:
                continue
        return clean if clean in slots else None

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
            # Map patient_disease → patient_disease field in save_appointment
            appointment_data = dict(entities)
            chosen_date = appointment_data.get("date")
            chosen_doctor = appointment_data.get("doctor_id")
            if chosen_date and chosen_doctor and appointment_data.get("time"):
                slots_resp = self.db.get_available_slots({"doctor_id": chosen_doctor, "date": chosen_date})
                slots = slots_resp.get("available_slots", [])
                normalized = self._normalize_slot_time(str(appointment_data.get("time")), slots)
                if not normalized:
                    sample = ", ".join(slots[:6]) if slots else "No slots found"
                    return {
                        "response": f"That time is not available. Please choose one of these slots: {sample}",
                        "flow_done": False,
                    }
                appointment_data["time"] = normalized
            # Ensure address is included
            if not appointment_data.get("address"):
                appointment_data["address"] = "Not provided"

            result = self.db.save_appointment(appointment_data)
            if result.get("success"):
                details = result["details"]
                patient_email = entities.get("patient_email", "")
                email_note = f" A confirmation will also be sent to {patient_email}." if patient_email else ""
                return {
                    "response": (
                        f"✅ Appointment confirmed!\n\n"
                        f"👤 Patient: {details['patient']}\n"
                        f"🩺 Doctor:  Dr. {details['doctor']}\n"
                        f"📅 Date:    {details['date']}\n"
                        f"🕐 Time:    {details['time']}\n\n"
                        f"The doctor has been notified and will confirm your appointment shortly.{email_note}\n"
                        "Is there anything else I can help you with?"
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