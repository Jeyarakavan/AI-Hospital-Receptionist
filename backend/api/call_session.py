"""Call session state manager for Twilio voice sessions."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from django.core.cache import cache


SESSION_TTL_SECONDS = 60 * 30
SESSION_PREFIX = "call_session:"


DEFAULT_SESSION = {
    "call_sid": None,
    "caller_number": None,
    "started_at": None,
    "history": [],
    "context": {
        "intent": None,
        "doctor_id": None,
        "doctor_name": None,
        "date": None,
        "time": None,
        "awaiting_confirmation": False,
        "pending_action": None,
        "patient_id": None,
    },
    "clarification_count": 0,
    "last_keyword": None,
    "status": "active",
}


class CallSessionManager:
    """Persists call session state in Django cache (Redis or local cache)."""

    @staticmethod
    def _key(call_sid: str) -> str:
        return f"{SESSION_PREFIX}{call_sid}"

    @classmethod
    def get(cls, call_sid: str) -> dict[str, Any]:
        key = cls._key(call_sid)
        data = cache.get(key)
        if data:
            return data

        data = deepcopy(DEFAULT_SESSION)
        data["call_sid"] = call_sid
        cache.set(key, data, timeout=SESSION_TTL_SECONDS)
        return data

    @classmethod
    def save(cls, call_sid: str, session: dict[str, Any]) -> None:
        cache.set(cls._key(call_sid), session, timeout=SESSION_TTL_SECONDS)

    @classmethod
    def update_context(cls, call_sid: str, updates: dict[str, Any]) -> dict[str, Any]:
        session = cls.get(call_sid)
        session.setdefault("context", {}).update(updates or {})
        cls.save(call_sid, session)
        return session

    @classmethod
    def add_history(cls, call_sid: str, role: str, message: str) -> dict[str, Any]:
        session = cls.get(call_sid)
        session.setdefault("history", []).append({"role": role, "message": message})
        cls.save(call_sid, session)
        return session

    @classmethod
    def increment_clarification(cls, call_sid: str) -> int:
        session = cls.get(call_sid)
        session["clarification_count"] = int(session.get("clarification_count", 0)) + 1
        cls.save(call_sid, session)
        return session["clarification_count"]

    @classmethod
    def reset_clarification(cls, call_sid: str) -> None:
        session = cls.get(call_sid)
        session["clarification_count"] = 0
        cls.save(call_sid, session)

    @classmethod
    def close(cls, call_sid: str, status: str = "completed") -> dict[str, Any]:
        session = cls.get(call_sid)
        session["status"] = status
        cls.save(call_sid, session)
        return session

    @classmethod
    def clear(cls, call_sid: str) -> None:
        cache.delete(cls._key(call_sid))
