from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from django.conf import settings
from django.http import HttpResponse
from twilio.twiml.voice_response import VoiceResponse, Gather
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)

from ..agents.orchestrator import OrchestratorAgent
from api.mongodb_service import MongoDBService

class CallHandlerView(APIView):
    """
    Endpoint to handle incoming calls/messages from patients.
    Receives voice audio text (transcribed by STT) or text input.
    """
    
    def post(self, request):
        user_input = request.data.get('text', '')
        call_id = request.data.get('call_id')
        
        if not user_input:
            return Response({"error": "No input provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Instantiate fresh for each call to ensure latest .env settings are used
        orchestrator = OrchestratorAgent()
        try:
            # Use the newly engineered Chat workflow
            user_id = str(request.user.id) if getattr(request, 'user', None) and request.user.is_authenticated else None
            result = orchestrator.process_chat(user_input, call_id, user_id=user_id)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"ChatHandler Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIChatHistoryView(APIView):
    """
    Fetch persisted AI chat history for the authenticated user.
    Optional filter by call_id for one conversation thread.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        call_id = request.query_params.get('call_id')
        limit = int(request.query_params.get('limit', 200))
        skip = int(request.query_params.get('skip', 0))

        rows = MongoDBService.get_ai_interactions(
            user_id=str(request.user.id),
            call_id=call_id,
            limit=limit,
            skip=skip,
        )
        return Response({'history': rows}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class TwilioVoiceWebhook(APIView):
    """
    Handle incoming calls from Twilio.
    1. Greeting
    2. Gathers speech
    3. Sends to Orchestrator
    4. Responds with speech
    """
    parser_classes = [FormParser, MultiPartParser, JSONParser]

    def post(self, request):
        response = VoiceResponse()
        orchestrator = OrchestratorAgent()
        
        # Get transcribed text from Twilio or user input
        # Twilio sends data in form parameters
        speech_result = request.data.get('SpeechResult', '')
        call_sid = request.data.get('CallSid', '')
        caller = request.data.get('From', 'unknown')
        
        logger.info(f"Incoming call from {caller} (Sid: {call_sid}). Speech: {speech_result}")
        
        if not speech_result:
            # First time in the call: Greet and Gather
            gather = Gather(input='speech', action='/api/ai/voice/', method='POST', timeout=3)
            gather.say("Thank you for calling City General Hospital. I'm your AI receptionist. How can I help you today?")
            response.append(gather)
            
            # If nothing is said
            response.say("I'm sorry, I didn't hear you. Please tell me how I can assist you or stay on the line.")
            response.redirect('/api/ai/voice/')
        else:
            # We have text from user speech: Process it
            try:
                result = orchestrator.process({
                    "text": speech_result,
                    "call_id": call_sid
                })
                ai_text = result['response_text']
                logger.info(f"AI Response: {ai_text}")
                
                # Response from AI
                response.say(ai_text)
                
                # Continue the conversation
                gather = Gather(input='speech', action='/api/ai/voice/', method='POST', timeout=3)
                response.append(gather)
                
                # If no more input
                response.say("Is there anything else I can help you with?")
                response.redirect('/api/ai/voice/')

            except Exception as e:
                logger.error(f"Error processing AI response: {str(e)}")
                response.say("I'm sorry, I'm having a technical difficulty. Please call back in a moment or stay on the line.")

        return HttpResponse(str(response), content_type='text/xml')
