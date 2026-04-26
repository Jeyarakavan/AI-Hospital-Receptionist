from typing import Dict, Any, List, Optional
from .base import BaseAgent
import uuid
import logging

logger = logging.getLogger(__name__)

# Global in-memory store — persists for the life of the Django process
_memory_store: Dict[str, Dict] = {}


class MemoryAgent(BaseAgent):
    """
    Manages conversation state across turns.

    Short-term  : Python dict keyed by call_id (fast, in-process).
    Long-term   : MongoDB via MongoDBService (optional — gracefully skipped if unavailable).

    FIX LOG
    -------
    1. add_to_history() now takes call_id as first param — previously it used
       self.call_id which was NEVER set when called from the Orchestrator, so
       history was silently lost every turn.
    2. start_session() now auto-initialises _memory_store so the key always
       exists before get_context / get_history are called.
    3. get_history() window raised to last 10 turns (5 was too short for
       multi-step flows like doctor registration or appointment booking).
    4. MongoDB writes are fully optional — a missing MongoDBService no longer
       crashes the system.
    5. update_entities() helper added so individual agents can persist
       extracted fields without rewriting the whole context block.
    """

    def __init__(self):
        super().__init__("Memory Agent")
        self._mongo = self._init_mongo()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _init_mongo(self):
        """Lazily import MongoDBService so the system boots even without Mongo."""
        try:
            from api.mongodb_service import MongoDBService
            return MongoDBService()
        except Exception as e:
            logger.warning(f"MongoDBService unavailable — long-term memory disabled: {e}")
            return None

    def _ensure_session(self, call_id: str):
        """Guarantee the session key exists in the store."""
        if call_id not in _memory_store:
            _memory_store[call_id] = {
                "history": [],
                "entities": {},
                "last_intent": "unknown",
                "last_step": None,
                "flow_state": {},   # tracks multi-step flows (e.g. registration progress)
            }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_session(self, call_id: Optional[str] = None) -> str:
        """Create or resume a session. Returns the call_id."""
        cid = call_id or str(uuid.uuid4())
        self._ensure_session(cid)
        return cid

    def add_to_history(self, call_id: str, role: str, message: str,
                       intent: str = "unknown", user_id: Optional[str] = None):
        """Append a turn to the session's history and persist to Mongo."""
        self._ensure_session(call_id)

        entry = {"role": role, "content": message}
        _memory_store[call_id]["history"].append(entry)

        if intent and intent != "unknown":
            _memory_store[call_id]["last_intent"] = intent

        # Optional MongoDB persistence
        if self._mongo:
            try:
                self._mongo.save_ai_interaction(
                    user_id=user_id,
                    interaction_type="chat",
                    input_data=message if role == "user" else "",
                    output_data=message if role == "ai" else "",
                    metadata={"call_id": call_id, "role": role, "intent": intent},
                )
                if role == "ai":
                    self._mongo.save_call_log(
                        caller_number=call_id,
                        intent=intent,
                        response=message,
                        status="active",
                    )
            except Exception as e:
                logger.error(f"MongoDB persistence error: {e}")

    def get_context(self, call_id: str) -> Dict[str, Any]:
        """Return the full session context."""
        self._ensure_session(call_id)
        return _memory_store[call_id]

    def get_history(self, call_id: str) -> List[Dict[str, str]]:
        """Return the last 10 turns for LLM context."""
        self._ensure_session(call_id)
        return _memory_store[call_id]["history"][-10:]

    def update_context(self, call_id: str, updates: Dict[str, Any]):
        """
        Merge partial updates into the session.
        Handles nested 'entities' and 'flow_state' dicts correctly.
        """
        self._ensure_session(call_id)
        store = _memory_store[call_id]

        for key, value in updates.items():
            if key in ("entities", "flow_state") and isinstance(value, dict):
                store[key].update({k: v for k, v in value.items() if v is not None})
            else:
                store[key] = value

    def update_entities(self, call_id: str, new_entities: Dict[str, Any]):
        """Convenience: merge only entity fields (ignores None/empty values)."""
        self._ensure_session(call_id)
        existing = _memory_store[call_id]["entities"]
        for k, v in new_entities.items():
            if v not in (None, "", []):
                existing[k] = v

    def get_entities(self, call_id: str) -> Dict[str, Any]:
        self._ensure_session(call_id)
        return _memory_store[call_id]["entities"]

    def set_flow_state(self, call_id: str, flow: str, step: str):
        """Track which multi-step flow is active and its current step."""
        self._ensure_session(call_id)
        _memory_store[call_id]["flow_state"] = {"flow": flow, "step": step}
        _memory_store[call_id]["last_step"] = step

    def get_flow_state(self, call_id: str) -> Dict[str, Any]:
        self._ensure_session(call_id)
        return _memory_store[call_id].get("flow_state", {})

    def clear_flow_state(self, call_id: str):
        self._ensure_session(call_id)
        _memory_store[call_id]["flow_state"] = {}
        _memory_store[call_id]["last_step"] = None

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """BaseAgent requirement — memory is utility-based, pass through."""
        return context