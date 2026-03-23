"""HTTP client for pushing structured call outcomes to the Django backend."""

from __future__ import annotations

from dataclasses import dataclass

import requests


@dataclass
class BackendClient:
    base_url: str
    shared_token: str
    timeout_seconds: int = 8

    def _headers(self) -> dict[str, str]:
        return {
            'X-Call-AI-Token': self.shared_token,
            'Content-Type': 'application/json',
        }

    def load_vocabulary(self) -> dict[str, list[str]]:
        response = requests.get(
            f"{self.base_url.rstrip('/')}/api/call-ai/vocabulary/",
            headers=self._headers(),
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        return {
            'doctors': payload.get('doctors', []),
            'departments': payload.get('departments', []),
        }

    def save_call_intake(self, payload: dict) -> dict:
        response = requests.post(
            f"{self.base_url.rstrip('/')}/api/call-ai/intake/",
            headers=self._headers(),
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        return response.json()
