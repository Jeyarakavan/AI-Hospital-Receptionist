"""Piper TTS wrapper to generate WAV files playable by Asterisk."""

from __future__ import annotations

import subprocess
from pathlib import Path


class PiperTTS:
    def __init__(self, piper_bin: str, model_path: str, speaker: int):
        self.piper_bin = piper_bin
        self.model_path = model_path
        self.speaker = speaker

    def synthesize_to_wav(self, text: str, output_wav: str) -> str:
        output_path = Path(output_wav)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            self.piper_bin,
            '--model',
            self.model_path,
            '--speaker',
            str(self.speaker),
            '--output_file',
            str(output_path),
        ]
        subprocess.run(cmd, input=(text or '').encode('utf-8'), check=True)
        return str(output_path)
