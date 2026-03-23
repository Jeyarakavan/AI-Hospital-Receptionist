"""Configuration for the open-source call AI receptionist."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class CallAIConfig:
    backend_base_url: str
    shared_token: str
    confidence_threshold_stt: float
    confidence_threshold_intent: float
    max_retries: int
    max_turns: int
    whisper_model_size: str
    whisper_compute_type: str
    piper_executable: str
    piper_model_path: str
    piper_speaker: int
    tts_output_dir: str
    asterisk_sounds_dir: str
    recording_dir: str
    hospital_name: str
    emergency_number_prompt: str


def load_config() -> CallAIConfig:
    return CallAIConfig(
        backend_base_url=os.getenv('CALL_AI_BACKEND_BASE_URL', 'http://127.0.0.1:8000'),
        shared_token=os.getenv('CALL_AI_SHARED_TOKEN', ''),
        confidence_threshold_stt=float(os.getenv('CALL_AI_STT_CONFIDENCE_THRESHOLD', '0.55')),
        confidence_threshold_intent=float(os.getenv('CALL_AI_INTENT_CONFIDENCE_THRESHOLD', '0.70')),
        max_retries=int(os.getenv('CALL_AI_MAX_RETRIES', '2')),
        max_turns=int(os.getenv('CALL_AI_MAX_TURNS', '20')),
        whisper_model_size=os.getenv('CALL_AI_WHISPER_MODEL', 'small.en'),
        whisper_compute_type=os.getenv('CALL_AI_WHISPER_COMPUTE_TYPE', 'int8'),
        piper_executable=os.getenv('CALL_AI_PIPER_BIN', 'piper'),
        piper_model_path=os.getenv('CALL_AI_PIPER_MODEL', '/opt/piper/en_US-lessac-medium.onnx'),
        piper_speaker=int(os.getenv('CALL_AI_PIPER_SPEAKER', '0')),
        tts_output_dir=os.getenv('CALL_AI_TTS_OUTPUT_DIR', '/tmp/call_ai_tts'),
        asterisk_sounds_dir=os.getenv('CALL_AI_ASTERISK_SOUNDS_DIR', '/var/lib/asterisk/sounds'),
        recording_dir=os.getenv('CALL_AI_RECORDING_DIR', '/tmp/call_ai_recordings'),
        hospital_name=os.getenv('CALL_AI_HOSPITAL_NAME', 'Jaffna Hospital'),
        emergency_number_prompt=os.getenv(
            'CALL_AI_EMERGENCY_PROMPT',
            'Please contact emergency services or our emergency unit immediately.',
        ),
    )
