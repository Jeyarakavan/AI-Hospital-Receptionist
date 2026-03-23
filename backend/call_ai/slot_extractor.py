"""Slot extraction using deterministic patterns and hospital vocabulary."""

from __future__ import annotations

import re
from dataclasses import dataclass

from rapidfuzz import process

from .datetime_utils import normalize_date_time, normalize_time_value


NAME_PATTERN = re.compile(r"(?:my name is|this is|i am)\s+([A-Za-z][A-Za-z\s\-']{1,80})", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s\-]{7,15}\d)")
DOCTOR_PATTERN = re.compile(r"(?:dr\.?|doctor)\s+([A-Za-z][A-Za-z\-']+)", re.IGNORECASE)


@dataclass
class SlotExtractionResult:
    slots: dict


def _best_match(value: str, candidates: list[str], cutoff: float = 82.0) -> str:
    if not value or not candidates:
        return ''
    match = process.extractOne(value, candidates, score_cutoff=cutoff)
    if not match:
        return ''
    return match[0]


def extract_slots(text: str, vocab: dict[str, list[str]]) -> SlotExtractionResult:
    utterance = (text or '').strip()
    lowered = utterance.lower()
    slots: dict[str, str] = {}

    date_value, time_value = normalize_date_time(utterance)
    if date_value:
        slots['appointment_date'] = date_value
    if time_value:
        slots['appointment_time'] = normalize_time_value(time_value)

    name_match = NAME_PATTERN.search(utterance)
    if name_match:
        slots['patient_name'] = name_match.group(1).strip().title()

    phone_match = PHONE_PATTERN.search(utterance)
    if phone_match:
        slots['phone_number'] = re.sub(r'\s+', '', phone_match.group(0))

    doctor_match = DOCTOR_PATTERN.search(utterance)
    if doctor_match:
        raw_doctor = doctor_match.group(1).strip()
        full_with_prefix = f'Dr. {raw_doctor.title()}'
        slots['doctor_name'] = _best_match(full_with_prefix, vocab.get('doctors', []), cutoff=74.0) or full_with_prefix

    for dept in vocab.get('departments', []):
        if dept.lower() in lowered:
            slots['department'] = dept
            break

    if 'morning' in lowered and 'appointment_time' not in slots:
        slots['appointment_time'] = '09:00'
    elif 'afternoon' in lowered and 'appointment_time' not in slots:
        slots['appointment_time'] = '14:00'
    elif 'evening' in lowered and 'appointment_time' not in slots:
        slots['appointment_time'] = '17:00'

    reason_triggers = ['because', 'for', 'regarding', 'reason is']
    for trigger in reason_triggers:
        if trigger in lowered:
            split_value = utterance.lower().split(trigger, 1)[1].strip()
            if split_value:
                slots['reason_for_visit'] = split_value[:250]
                break

    if 'urgent' in lowered or 'as soon as possible' in lowered:
        slots['urgency'] = 'high'

    return SlotExtractionResult(slots=slots)
