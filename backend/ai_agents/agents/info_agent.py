from typing import Dict, Any
from .base import BaseAgent
from .database_agent import DatabaseAgent
from ..services.llm_service import LLMService


class InfoAgent(BaseAgent):
    """
    Answers general inquiries about the hospital, using live data from DatabaseAgent.

    FIX LOG
    -------
    1. No major bugs — worked mostly correctly.
    2. Doctor list now uses d['name'] consistently (DatabaseAgent was updated
       to always expose this top-level key).
    3. System prompt tightened to prevent hallucination of unknown info.
    """

    def __init__(self, db_agent: DatabaseAgent, llm_service: LLMService):
        super().__init__("Info Agent")
        self.db  = db_agent
        self.llm = llm_service

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        user_input   = context.get("user_input", "")
        chat_history = context.get("chat_history", [])

        hospital_info = self.db.get_hospital_info()
        doctor_data   = self.db.list_doctors({})
        doctor_list   = "\n".join([
            f"  - Dr. {d['name']} ({d['specialization']})"
            for d in doctor_data.get("doctors", [])
        ])

        system_prompt = f"""
You are the Information Agent for {hospital_info['hospital_name']}.
Answer questions using ONLY the facts provided below.
If asked something not in the list, say: "For that, please call our main reception line or speak to a staff member."
Never invent prices, room numbers, or details not listed here.
Keep responses concise, warm, and professional.

HOSPITAL INFORMATION:
  Services      : {hospital_info['services']}
  Vision        : {hospital_info['vision']}
  Mission       : {hospital_info['mission']}
  Opening Hours : {hospital_info['opening_hours']}
  Location      : {hospital_info['location']}

AVAILABLE SPECIALISTS:
{doctor_list if doctor_list else "  (No specialists currently listed)"}

If the patient expresses interest in booking after your answer, encourage them to share their name and preferred date so you can assist.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            *chat_history,
            {"role": "user",   "content": user_input},
        ]

        response = self.llm.call(messages)
        return {"response": response}
    