from typing import Dict, Any
from .base import BaseAgent
import logging

logger = logging.getLogger(__name__)


class NotificationAgent(BaseAgent):
    """
    Handles outbound notifications (SMS, Email) and MongoDB interaction logging.

    FIX LOG
    -------
    1. MongoDBService was called as a static method in log_to_mongo() but
       instantiated in other places — unified to always use instance.
    2. All external service imports are inside try/except so a missing
       dependency doesn't crash an otherwise successful booking flow.
    3. send_confirmation() now gracefully handles missing appointment_id.
    """

    def __init__(self):
        super().__init__("Notification Agent")
        self._mongo = self._init_mongo()

    def _init_mongo(self):
        try:
            from api.mongodb_service import MongoDBService
            return MongoDBService()
        except Exception as e:
            logger.warning(f"MongoDBService unavailable: {e}")
            return None

    # ------------------------------------------------------------------
    # Router
    # ------------------------------------------------------------------

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        intent = context.get("notify_intent")
        data   = context.get("notify_data", {})

        if intent == "log_interaction":
            return self.log_to_mongo(data)
        elif intent == "send_booking_confirmation":
            return self.send_confirmation(data)

        return {"error": f"Unknown notify_intent: '{intent}'"}

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------

    def log_to_mongo(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._mongo:
            return {"success": False, "error": "MongoDB not available"}
        try:
            self._mongo.save_call_log(
                caller_number=data.get("call_id", "unknown"),
                intent=data.get("intent",     "chat"),
                response=data.get("ai_response", ""),
                status="completed",
            )
            return {"success": True}
        except Exception as e:
            logger.error(f"MongoDB log error: {e}")
            return {"success": False, "error": str(e)}

    def send_confirmation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        appointment_id = data.get("appointment_id")
        if not appointment_id:
            return {"success": False, "error": "No appointment_id provided"}

        try:
            from api.models import Appointment
            from api.services import NotificationService

            appointment = Appointment.objects.get(id=appointment_id)
            NotificationService.notify_appointment_confirmed(appointment)
            return {"success": True, "details": "SMS and Email notifications sent"}

        except Exception as e:
            logger.error(f"Notification dispatch error: {e}")
            return {"success": False, "error": str(e)}