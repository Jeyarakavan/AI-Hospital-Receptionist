"""Minimal Asterisk AGI protocol helper."""

from __future__ import annotations

import sys


class AGI:
    def __init__(self):
        self.env = self._read_env()

    def _read_env(self) -> dict[str, str]:
        env: dict[str, str] = {}
        for line in sys.stdin:
            line = line.strip()
            if not line:
                break
            if ':' in line:
                key, value = line.split(':', 1)
                env[key.strip()] = value.strip()
        return env

    def command(self, command: str) -> str:
        sys.stdout.write(f"{command}\n")
        sys.stdout.flush()
        return sys.stdin.readline().strip()

    def answer(self) -> str:
        return self.command('ANSWER')

    def hangup(self) -> str:
        return self.command('HANGUP')

    def stream_file(self, filename_without_ext: str, escape_digits: str = '') -> str:
        return self.command(f'STREAM FILE {filename_without_ext} "{escape_digits}"')

    def record_file(self, output_without_ext: str, timeout_ms: int = 7000, silence_seconds: int = 2) -> str:
        # Format: RECORD FILE <file> <format> <escape_digits> <timeout> [offset] [BEEP] [s=silence]
        return self.command(
            f'RECORD FILE {output_without_ext} wav "#" {timeout_ms} 0 BEEP s={silence_seconds}'
        )
