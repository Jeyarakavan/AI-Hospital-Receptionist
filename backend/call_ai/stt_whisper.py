"""Faster-Whisper speech-to-text wrapper."""

from __future__ import annotations

from dataclasses import dataclass

from faster_whisper import WhisperModel


@dataclass
class STTResult:
    text: str
    confidence: float


class WhisperSTT:
    def __init__(self, model_size: str, compute_type: str):
        self.model = WhisperModel(model_size, compute_type=compute_type)

    def transcribe(self, audio_path: str) -> STTResult:
        segments, info = self.model.transcribe(audio_path, language='en', vad_filter=True)
        texts: list[str] = []
        confidences: list[float] = []

        for segment in segments:
            text = (segment.text or '').strip()
            if text:
                texts.append(text)
            # avg_logprob closer to 0 is better, map to practical 0..1 confidence.
            confidences.append(max(0.0, min(1.0, 1.0 + float(segment.avg_logprob or -1.0))))

        if not texts:
            return STTResult(text='', confidence=0.0)

        confidence = sum(confidences) / max(len(confidences), 1)
        return STTResult(text=' '.join(texts).strip(), confidence=confidence)
