import os
from decouple import Config, RepositoryEnv
import google.generativeai as genai

env_path = os.path.join(os.path.dirname(__file__), '.env')
config = Config(RepositoryEnv(env_path))

api_key = config('GEMINI_API_KEY', default='')
genai.configure(api_key=api_key)

try:
    models = genai.list_models()
    for m in models:
        print(f"Name: {m.name}, Methods: {m.supported_generation_methods}")
except Exception as e:
    print("Error:", e)
