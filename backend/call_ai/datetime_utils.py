"""Date and time normalization helpers for caller utterances."""

from __future__ import annotations

from datetime import datetime

import dateparser


def normalize_date_time(text: str) -> tuple[str, str]:
    parsed = dateparser.parse(
        text,
        settings={
            'PREFER_DATES_FROM': 'future',
            'RETURN_AS_TIMEZONE_AWARE': False,
        },
    )
    if not parsed:
        return '', ''

    date_part = parsed.date().isoformat()
    if parsed.hour == 0 and parsed.minute == 0:
        return date_part, ''

    time_part = parsed.strftime('%H:%M')
    return date_part, time_part


def normalize_time_value(value: str) -> str:
    if not value:
        return ''
    for fmt in ('%H:%M', '%I:%M %p', '%I %p'):
        try:
            parsed = datetime.strptime(value.strip(), fmt)
            return parsed.strftime('%H:%M')
        except ValueError:
            continue
    return value.strip()
