"""Asterisk AGI entrypoint for open-source AI Hospital Receptionist calls."""

from __future__ import annotations

import json
import uuid
from pathlib import Path

from .asterisk_agi import AGI
from .backend_client import BackendClient
from .config import load_config
from .state_machine import CallState, ReceptionistStateMachine
from .stt_whisper import WhisperSTT
from .tts_piper import PiperTTS


class CallAgentRuntime:
    def __init__(self):
        self.cfg = load_config()
        self.client = BackendClient(self.cfg.backend_base_url, self.cfg.shared_token)
        self.vocab = {'doctors': [], 'departments': []}
        try:
            self.vocab = self.client.load_vocabulary()
        except Exception:
            local_vocab = Path(__file__).resolve().parent / 'config' / 'hospital_vocab.json'
            if local_vocab.exists():
                self.vocab = json.loads(local_vocab.read_text(encoding='utf-8'))
            else:
                self.vocab = {'doctors': [], 'departments': []}

        self.machine = ReceptionistStateMachine(
            hospital_name=self.cfg.hospital_name,
            vocab=self.vocab,
            max_retries=self.cfg.max_retries,
            intent_threshold=self.cfg.confidence_threshold_intent,
        )
        self.stt = WhisperSTT(self.cfg.whisper_model_size, self.cfg.whisper_compute_type)
        self.tts = PiperTTS(self.cfg.piper_executable, self.cfg.piper_model_path, self.cfg.piper_speaker)

    def run(self) -> None:
        agi = AGI()
        call_id = agi.env.get('agi_uniqueid') or str(uuid.uuid4())
        caller_id = agi.env.get('agi_callerid') or ''

        state = CallState(
            call_id=call_id,
            caller_id=caller_id,
            hospital_name=self.cfg.hospital_name,
        )

        Path(self.cfg.recording_dir).mkdir(parents=True, exist_ok=True)
        Path(self.cfg.tts_output_dir).mkdir(parents=True, exist_ok=True)

        agi.answer()
        self._speak(agi, state, self.machine.greeting())

        for turn_index in range(self.cfg.max_turns):
            record_base = str(Path(self.cfg.recording_dir) / f'{call_id}_{turn_index}')
            agi.record_file(record_base)
            audio_path = f'{record_base}.wav'

            stt_result = self.stt.transcribe(audio_path)
            reply = self.machine.process_turn(state, stt_result.text, stt_result.confidence)

            self._speak(agi, state, reply.text)

            if reply.should_save:
                payload = self.machine.build_save_payload(state, reply.final_status)
                try:
                    self.client.save_call_intake(payload)
                except Exception:
                    # Avoid silent data loss by attempting a failed-capture save fallback.
                    payload['final_status'] = 'failed_capture'
                    payload['confirmation_status'] = 'save_failed'
                    try:
                        self.client.save_call_intake(payload)
                    except Exception:
                        pass

            if reply.should_end:
                agi.hangup()
                return

        payload = self.machine.build_save_payload(state, 'failed_capture')
        payload['confirmation_status'] = 'turn_limit_exceeded'
        try:
            self.client.save_call_intake(payload)
        except Exception:
            pass
        self._speak(agi, state, 'I am forwarding your request to our staff now. Thank you for calling.')
        agi.hangup()

    def _speak(self, agi: AGI, state: CallState, text: str) -> None:
        state.add_transcript('assistant', text)
        file_key = f"{state.call_id}_{uuid.uuid4().hex[:8]}"
        wav_path = str(Path(self.cfg.tts_output_dir) / f'{file_key}.wav')
        self.tts.synthesize_to_wav(text, wav_path)

        # Asterisk STREAM FILE expects a path relative to sounds dir and no extension.
        sounds_dir = Path(self.cfg.asterisk_sounds_dir)
        output_sounds_path = sounds_dir / 'call_ai' / f'{file_key}.wav'
        output_sounds_path.parent.mkdir(parents=True, exist_ok=True)
        Path(wav_path).replace(output_sounds_path)

        agi.stream_file(f'call_ai/{file_key}')


def main() -> None:
    runtime = CallAgentRuntime()
    runtime.run()


if __name__ == '__main__':
    main()
