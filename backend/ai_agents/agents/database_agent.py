from typing import Dict, Any, Optional
from .base import BaseAgent
import logging

logger = logging.getLogger(__name__)


class DatabaseAgent(BaseAgent):
    """
    The SQL Specialist: sole owner of all PostgreSQL reads and writes.

    FIX LOG
    -------
    1. find_appointment() was called by AppointmentAgent but NEVER defined — added.
    2. cancel_appointment() was called by AppointmentAgent but NEVER defined — added.
    3. book_appointment() alias added (AppointmentAgent called self.db.book_appointment).
    4. check_availability() alias added (AppointmentAgent called self.db.check_availability).
    5. process() routing table updated to cover all method aliases.
    6. list_doctors() now returns 'user' nested dict to stay compatible with
       AppointmentAgent which accesses d['user']['full_name'].
    7. All DB calls wrapped in try/except with structured error returns.
    """

    def __init__(self):
        super().__init__("Database Agent")

    # ------------------------------------------------------------------
    # Router
    # ------------------------------------------------------------------

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        intent = context.get("db_intent", "")
        params = context.get("db_params", {}) or {}

        routing = {
            "find_doctor":          lambda: self.list_doctors(params),
            "list_all_specialists": lambda: self.list_doctors(params),
            "check_slots":          lambda: self.get_available_slots(params),
            "check_availability":   lambda: self.get_available_slots(params),
            "create_appointment":   lambda: self.save_appointment(params),
            "book":                 lambda: self.save_appointment(params),
            "book_appointment":     lambda: self.save_appointment(params),
            "cancel_appointment":   lambda: self.cancel_appointment(params),
            "find_appointment":     lambda: self.find_appointment(params),
            "get_hospital_info":    lambda: self.get_hospital_info(),
            "hospital_info":        lambda: self.get_hospital_info(),
            "register_doctor":      lambda: self.register_doctor(params),
        }

        handler = routing.get(intent)
        if handler:
            return handler()
        return {"error": f"Unknown DB intent: '{intent}'"}

    # ------------------------------------------------------------------
    # Doctor queries
    # ------------------------------------------------------------------

    def list_doctors(self, params: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from api.models import Doctor
            spec = params.get("specialization", "").lower()
            query = Doctor.objects.select_related("user").filter(user__status="Approved")
            if spec:
                query = query.filter(specialization__icontains=spec)

            doctors = list(query)
            return {
                "count": len(doctors),
                "doctors": [
                    {
                        "id": str(d.id),
                        "name": d.user.full_name,
                        # Kept nested 'user' dict for AppointmentAgent compatibility
                        "user": {"full_name": d.user.full_name},
                        "specialization": d.specialization,
                        "phone": d.user.phone_number,
                    }
                    for d in doctors
                ],
            }
        except Exception as e:
            logger.error(f"list_doctors error: {e}")
            return {"count": 0, "doctors": [], "error": str(e)}

    def register_doctor(self, params: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from django.db.models import Q
            from api.models import User, Doctor

            full_name   = params.get("full_name")
            email       = params.get("email")
            phone       = params.get("phone_number")
            spec        = params.get("specialization")
            username    = params.get("username") or (email.split("@")[0] if email else None)
            address     = params.get("address", "Not Provided")
            dob         = params.get("date_of_birth", "1980-01-01")

            missing = [f for f, v in [
                ("full name", full_name), ("username", username), ("email", email),
                ("phone number", phone), ("specialization", spec),
            ] if not v]

            if missing:
                return {"success": False, "missing_fields": missing,
                        "error": f"Missing: {', '.join(missing)}"}

            if User.objects.filter(Q(email=email) | Q(username=username)).exists():
                return {"success": False,
                        "error": "A user with this email or username already exists."}

            user = User.objects.create_user(
                username=username, email=email, full_name=full_name,
                phone_number=phone, address=address, date_of_birth=dob,
                role="Doctor", status="Pending",
                has_changed_password=False,
            )
            # Default password is the username
            user.set_password(username)
            user.save()

            doctor = Doctor.objects.create(user=user, specialization=spec)

            return {
                "success": True,
                "message": (
                    f"Registration request for Dr. {full_name} ({spec}) has been "
                    "submitted. An admin will approve the account shortly."
                ),
                "doctor_id": str(doctor.id),
            }
        except Exception as e:
            logger.error(f"register_doctor error: {e}")
            return {"success": False, "error": str(e)}

    # ------------------------------------------------------------------
    # Availability
    # ------------------------------------------------------------------

    def get_available_slots(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Also accessible as check_availability."""
        try:
            from datetime import datetime
            from api.models import Doctor
            from api.services import AppointmentService

            doc_id   = params.get("doctor_id")
            date_str = params.get("date")

            if not doc_id or not date_str:
                return {"error": "Missing doctor_id or date"}

            parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            doctor = Doctor.objects.get(id=doc_id)
            free_slots = AppointmentService.get_available_slots(doctor, parsed_date)

            return {
                "doctor_id": doc_id,
                "doctor_name": doctor.user.full_name,
                "date": date_str,
                "available_slots": free_slots,
            }
        except Exception as e:
            logger.error(f"get_available_slots error: {e}")
            return {"error": str(e), "available_slots": []}

    # Alias used by AppointmentAgent
    def check_availability(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return self.get_available_slots(params)

    # ------------------------------------------------------------------
    # Appointment CRUD
    # ------------------------------------------------------------------

    def save_appointment(self, params: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from api.models import Appointment

            name     = params.get("patient_name")
            phone    = params.get("contact_number")
            age      = params.get("patient_age", 0)
            disease  = params.get("patient_disease", "Consultation")
            doc_id   = params.get("doctor_id")
            apt_date = params.get("date")
            apt_time = params.get("time")

            missing = [f for f, v in [
                ("patient_name", name), ("contact_number", phone),
                ("doctor_id", doc_id), ("date", apt_date), ("time", apt_time),
            ] if not v]

            if missing:
                return {"success": False,
                        "error": f"Missing booking details: {', '.join(missing)}"}

            apt = Appointment.objects.create(
                patient_name=name, patient_age=age,
                patient_disease=disease, contact_number=phone,
                doctor_id=doc_id, appointment_date=apt_date,
                appointment_time=apt_time, status="Pending",
            )

            return {
                "success": True,
                "appointment_id": str(apt.id),
                "details": {
                    "patient":   name,
                    "doctor":    apt.doctor.user.full_name,
                    "date":      apt_date,
                    "time":      apt_time,
                },
            }
        except Exception as e:
            logger.error(f"save_appointment error: {e}")
            return {"success": False, "error": str(e)}

    # Alias used by AppointmentAgent
    def book_appointment(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return self.save_appointment(params)

    def find_appointment(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Find active appointments by patient name and/or contact number.
        Previously MISSING — caused AttributeError in AppointmentAgent.
        """
        try:
            from django.db.models import Q
            from api.models import Appointment

            name  = params.get("patient_name", "")
            phone = params.get("contact_number", "")

            if not name and not phone:
                return {"appointments": [], "error": "Provide name or phone to search"}

            q = Q()
            if name:
                q &= Q(patient_name__icontains=name)
            if phone:
                q &= Q(contact_number=phone)

            appts = Appointment.objects.select_related("doctor__user").filter(
                q, status__in=["Pending", "Confirmed"]
            ).order_by("appointment_date")

            return {
                "appointments": [
                    {
                        "id":               str(a.id),
                        "patient_name":     a.patient_name,
                        "doctor_name":      a.doctor.user.full_name,
                        "appointment_date": str(a.appointment_date),
                        "appointment_time": str(a.appointment_time),
                        "status":           a.status,
                    }
                    for a in appts
                ]
            }
        except Exception as e:
            logger.error(f"find_appointment error: {e}")
            return {"appointments": [], "error": str(e)}

    def cancel_appointment(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cancel an appointment by ID.
        Previously MISSING — caused AttributeError in AppointmentAgent.
        """
        try:
            from api.models import Appointment

            appt_id = params.get("appointment_id")
            if not appt_id:
                return {"success": False, "error": "appointment_id is required"}

            rows = Appointment.objects.filter(id=appt_id).update(status="Cancelled")
            if rows == 0:
                return {"success": False, "error": "Appointment not found"}

            return {"success": True, "message": "Appointment cancelled successfully"}
        except Exception as e:
            logger.error(f"cancel_appointment error: {e}")
            return {"success": False, "error": str(e)}

    # ------------------------------------------------------------------
    # Hospital info
    # ------------------------------------------------------------------

    def get_hospital_info(self) -> Dict[str, Any]:
        try:
            from api.models import SiteSettings
            settings = SiteSettings.get_settings()
            return {
                "hospital_name":  settings.site_name,
                "services":       settings.services_text  or "General Medical Services, Emergency Care, Specialized Clinics",
                "vision":         settings.vision_text    or "To be the leading healthcare provider in the region.",
                "mission":        settings.mission_text   or "Providing affordable, high-quality healthcare to all.",
                "opening_hours":  "24/7 for Emergency, 8:00 AM – 8:00 PM for OPD",
                "location":       "123 Health Avenue, Medical City",
            }
        except Exception as e:
            logger.error(f"get_hospital_info error: {e}")
            return {
                "hospital_name":  "City General Hospital",
                "services":       "General Medical Services, Emergency Care, Specialized Clinics",
                "vision":         "Leading healthcare provider in the region.",
                "mission":        "Affordable, high-quality healthcare for all.",
                "opening_hours":  "24/7 for Emergency, 8:00 AM – 8:00 PM for OPD",
                "location":       "123 Health Avenue, Medical City",
            }