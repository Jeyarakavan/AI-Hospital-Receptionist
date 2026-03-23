"""Deterministic intent classification for narrow hospital receptionist flows."""

from __future__ import annotations

from dataclasses import dataclass


INTENTS = [
    'BOOK_APPOINTMENT',
    'CANCEL_APPOINTMENT',
    'RESCHEDULE_APPOINTMENT',
    'GENERAL_INQUIRY',
    'HUMAN_HANDOFF',
    'EMERGENCY',
]


EMERGENCY_PHRASES = [
    'chest pain',
    'breathing trouble',
    'unconscious',
    'severe bleeding',
    'accident',
    'emergency',
    'cannot breathe',
    'collapsed',
]


HUMAN_HANDOFF_PHRASES = [
    'i want a human',
    'connect me to receptionist',
    'talk to staff',
    'operator please',
    'i need a person',
    'human',
    'receptionist',
    'operator',
]


INTENT_KEYWORDS = {
    'BOOK_APPOINTMENT': ['book', 'appointment', 'schedule', 'see doctor'],
    'CANCEL_APPOINTMENT': ['cancel', 'remove appointment', 'drop appointment'],
    'RESCHEDULE_APPOINTMENT': ['reschedule', 'change appointment', 'change date', 'change time'],
    'GENERAL_INQUIRY': ['hours', 'open', 'location', 'department', 'information', 'inquiry'],
}


@dataclass
class IntentResult:
    intent: str
    confidence: float
    emergency_phrase: str = ''


def classify_intent(text: str) -> IntentResult:
    lowered = (text or '').strip().lower()
    if not lowered:
        return IntentResult(intent='GENERAL_INQUIRY', confidence=0.2)

    for phrase in EMERGENCY_PHRASES:
        if phrase in lowered:
            return IntentResult(intent='EMERGENCY', confidence=0.99, emergency_phrase=phrase)

    for phrase in HUMAN_HANDOFF_PHRASES:
        if phrase in lowered:
            return IntentResult(intent='HUMAN_HANDOFF', confidence=0.98)

    best_intent = 'GENERAL_INQUIRY'
    best_score = 0.25
    for intent, keywords in INTENT_KEYWORDS.items():
        score = 0.0
        for word in keywords:
            if word in lowered:
                score += 0.34
        if score > best_score:
            best_intent = intent
            best_score = min(score, 0.95)

    return IntentResult(intent=best_intent, confidence=best_score)
