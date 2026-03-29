from typing import Dict, Any
from .base import BaseAgent
import os
import logging

logger = logging.getLogger(__name__)


class VoiceAgent(BaseAgent):
    """
    Handles Speech-to-Text (STT) and Text-to-Speech (TTS).

    STT : OpenAI Whisper (local / free)
    TTS : gTTS (free, Google Translate TTS)

    FIX LOG
    -------
    1. whisper imported at module level — if Whisper isn't installed, the whole
       agents package would fail to import. Moved to lazy load inside stt().
    2. Temporary audio file is now cleaned up after transcription.
    3. process_incoming_audio() now accepts a raw file path (str) in addition
       to a Django UploadedFile, making it easier to unit-test.
    4. OrchestratorAgent is lazy-imported to avoid circular import at startup.
    """

    def __init__(self):
        super().__init__("Voice Agent")
        self._stt_model = None

    # ------------------------------------------------------------------
    # STT
    # ------------------------------------------------------------------

    def stt(self, audio_path: str) -> str:
        """Convert audio file to text using OpenAI Whisper."""
        try:
            import whisper
            from decouple import config

            if not self._stt_model:
                model_size      = config("STT_MODEL_SIZE", default="base")
                self._stt_model = whisper.load_model(model_size)

            result = self._stt_model.transcribe(audio_path)
            return result["text"].strip()
        except ImportError:
            logger.error("Whisper is not installed. Run: pip install openai-whisper")
            return ""
        except Exception as e:
            logger.error(f"STT error: {e}")
            return ""

    # ------------------------------------------------------------------
    # TTS
    # ------------------------------------------------------------------

    def tts(self, text: str, output_path: str = "ai_response.mp3") -> str:
        """Convert text to speech using gTTS and save to output_path."""
        try:
            from gtts import gTTS
            gTTS(text=text, lang="en").save(output_path)
            return output_path
        except ImportError:
            logger.error("gTTS is not installed. Run: pip install gtts")
            return ""
        except Exception as e:
            logger.error(f"TTS error: {e}")
            return ""

    # ------------------------------------------------------------------
    # Full voice pipeline
    # ------------------------------------------------------------------

    def process_incoming_audio(self, audio_file: Any, call_id: str = None) -> Dict[str, Any]:
        """
        Full pipeline: audio file → STT → Orchestrator → TTS → response.

        audio_file can be:
          - a Django UploadedFile (has .chunks())
          - a plain file path string
        """
        temp_path = f"patient_{call_id or 'temp'}.wav"

        try:
            # Save audio to disk if it's a Django upload object
            if hasattr(audio_file, "chunks"):
                with open(temp_path, "wb+") as f:
                    for chunk in audio_file.chunks():
                        f.write(chunk)
            elif isinstance(audio_file, str) and os.path.exists(audio_file):
                temp_path = audio_file  # already on disk
            else:
                return {"error": "Invalid audio_file input"}

            # Step 1: Speech → Text
            text_input = self.stt(temp_path)
            if not text_input:
                return {"error": "Could not transcribe audio"}

            # Step 2: Text → AI response
            from .orchestrator import OrchestratorAgent
            orchestrator = OrchestratorAgent()
            result       = orchestrator.process({
                "text":    text_input,
                "call_id": call_id or "voice_call",
            })

            # Step 3: Text → Speech
            response_audio = self.tts(result.get("response_text", ""))
            result["response_audio_url"] = response_audio
            result["transcribed_input"]  = text_input
            return result

        finally:
            # Clean up temp file
            if os.path.exists(temp_path) and temp_path.startswith("patient_"):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        audio = context.get("audio_file")
        call_id = context.get("call_id")
        if audio:
            return self.process_incoming_audio(audio, call_id)
        return {"error": "No audio_file in context"}