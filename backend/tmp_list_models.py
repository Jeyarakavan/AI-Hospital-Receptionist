import os
import google.generativeai as genai
from decouple import config

def list_gemini_models():
    api_key = config('GEMINI_API_KEY', default='')
    if not api_key:
        print("No GEMINI_API_KEY found in .env")
        return
    
    genai.configure(api_key=api_key)
    print(f"Using API Key: {api_key[:10]}...")
    
    try:
        print("\nAvailable models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name} ({m.display_name})")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_gemini_models()
