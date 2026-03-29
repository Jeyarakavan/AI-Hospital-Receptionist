import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_system.settings')
django.setup()

from ai_agents.agents.orchestrator import OrchestratorAgent

def run_test():
    orchestrator = OrchestratorAgent()
    
    print("-" * 50)
    print("AI Receptionist Test Session")
    print("-" * 50)
    
    # Test case 1: Greeting
    print("\n[Patient]: Hello, I need help.")
    res = orchestrator.process("Hello, I need help.")
    print(f"[AI]: {res['response_text']}")
    
    # Test case 2: Inquiry
    print("\n[Patient]: Who is your cardiology specialist?")
    res = orchestrator.process("Who is your cardiology specialist?", call_id=res['call_id'])
    print(f"[AI]: {res['response_text']}")
    
    # Test case 3: Booking
    print("\n[Patient]: I want to book an appointment with a heart doctor.")
    res = orchestrator.process("I want to book an appointment with a heart doctor.", call_id=res['call_id'])
    print(f"[AI]: {res['response_text']}")

    # Test case 4: Emergency
    print("\n[Patient]: I have severe chest pain and can't breathe!")
    res = orchestrator.process("I have severe chest pain and can't breathe!", call_id=res['call_id'])
    print(f"[AI]: {res['response_text']}")

if __name__ == "__main__":
    run_test()
