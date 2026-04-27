import os
from typing import List, Dict, Any, Optional
import json
from decouple import config
# LLM Service logic - config-sensitive
import logging

logger = logging.getLogger(__name__)

class LLMService:
    """
    Service to interact with Large Language Models.
    Default: Claude via Anthropic API.
    """
    def __init__(self):
        self.api_key = config('GEMINI_API_KEY', default='')
        
        if self.api_key:
            self.provider = 'gemini'
            self.model = config('GEMINI_MODEL', default='gemini-1.5-flash')
            print(f" [DEBUG] LLMService initialized with GEMINI_MODEL={self.model} and KEY={self.api_key[:10]}...")
        else:
            self.api_key = config('OPENAI_API_KEY', default='')
            if self.api_key:
                self.provider = 'openai'
                self.model = config('OPENAI_MODEL', default='gpt-4o')
            else:
                self.api_key = config('CLAUDE_API_KEY', default='')
                self.provider = 'anthropic'
                self.model = config('CLAUDE_MODEL', default='claude-3-5-sonnet-20240620')
            
        logger.info(f"LLM initialized with provider: {self.provider}")

    def call(self, messages: List[Dict[str, str]], json_mode: bool = False) -> str:
        """
        Generic call to the configured LLM. Includes automatic fallback if primary fails.
        """
        try:
            if not self.api_key or 'your-' in self.api_key:
                return self._get_demo_response(messages)

            print(f"\n[DEBUG] LLM PROXY: Attempting call with {self.provider} ({self.model})...")
            
            if self.provider == 'gemini':
                try:
                    return self._call_gemini(messages, json_mode)
                except Exception as g_err:
                    print(f" [DEBUG] Gemini failed: {g_err}. Falling back to OpenAI...")
                    # Fallback to OpenAI if configured
                    o_key = config('OPENAI_API_KEY', default='')
                    if o_key and not o_key.startswith('your-'):
                        self.provider = 'openai'
                        self.model = config('OPENAI_MODEL', default='gpt-4o')
                        self.api_key = o_key
                        return self._call_openai(messages, json_mode)
                    raise g_err
            
            elif self.provider == 'openai':
                return self._call_openai(messages, json_mode)
            elif self.provider == 'anthropic':
                return self._call_anthropic(messages, json_mode)
            
            return self._get_demo_response(messages)
        except Exception as e:
            print(f" [DEBUG] LLM PROXY CRITICAL ERROR: {str(e)}")
            logger.error(f"LLM call failure: {str(e)}")
            return self._get_demo_response(messages)

    def _call_gemini(self, messages: List[Dict[str, str]], json_mode: bool) -> str:
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(self.model)
        
        prompt = ""
        for m in messages:
            prompt += f"{m['role'].upper()}: {m['content']}\n"
        
        generation_config = {
            "temperature": 0.7,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 1024,
        }
        
        if json_mode:
            generation_config["response_mime_type"] = "application/json"

        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text

    def _get_demo_response(self, messages: List[Dict[str, str]]) -> str:
        """Fallback rule-based response if API fails/is missing."""
        last_msg = messages[-1]['content'].lower()
        if "book" in last_msg or "appointment" in last_msg:
            return '{"intent": "booking", "response_text": "I can help you book an appointment. What is the patient name?"}'
        return "I'm your AI Hospital Receptionist. How can I help you today?"

    def _call_anthropic(self, messages: List[Dict[str, str]], json_mode: bool) -> str:
        import anthropic
        client = anthropic.Anthropic(api_key=self.api_key)
        
        # Extract system prompt if any
        system_content = next((m['content'] for m in messages if m['role'] == 'system'), "")
        msg_list = [m for m in messages if m['role'] != 'system']
        
        response = client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system_content if system_content else None,
            messages=msg_list,
        )
        return response.content[0].text

    def _call_openai(self, messages: List[Dict[str, str]], json_mode: bool) -> str:
        from openai import OpenAI
        client = OpenAI(api_key=self.api_key)
        
        # Ensure json_mode is handled
        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"} if json_mode else {"type": "text"}
        )
        return response.choices[0].message.content

    def extract_json(self, text: str) -> Dict[str, Any]:
        """
        Helper to extract JSON from LLM response text.
        """
        try:
            # Look for JSON between triple backticks if any
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except (ValueError, IndexError, json.JSONDecodeError):
            # Try to find the first '{' and last '}'
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start:end+1])
                except json.JSONDecodeError:
                    return {}
            return {}
