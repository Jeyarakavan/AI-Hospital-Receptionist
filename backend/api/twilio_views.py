"""Twilio voice webhooks for AI receptionist call handling."""

from __future__ import annotations

import logging
from datetime import datetime

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import Dial, Gather, VoiceResponse

from .call_session import CallSessionManager
from .consumers import broadcast_call_event
from .mongodb_service import MongoDBService
from .nlp_service import NLPService

logger = logging.getLogger(__name__)


def _validate_twilio_request(request: HttpRequest) -> bool:
    should_validate = getattr(settings, "TWILIO_VALIDATE_REQUEST", False)
    if not should_validate:
        return True

    auth_token = settings.TWILIO_AUTH_TOKEN
    if not auth_token:
        return False

    signature = request.headers.get("X-Twilio-Signature", "")
    validator = RequestValidator(auth_token)
    return validator.validate(request.build_absolute_uri(), request.POST, signature)


def _gather_prompt(response: VoiceResponse, text: str):
    gather = Gather(
        input="speech dtmf",
        speech_timeout="auto",
        timeout=4,
        action="/api/twilio/gather/",
        method="POST",
        language="en-US",
    )
    gather.say(text, voice="alice", language="en-US")
    response.append(gather)


def _transfer(response: VoiceResponse, action: str):
    if action == "transfer_emergency":
        target = getattr(settings, "EMERGENCY_TRANSFER_NUMBER", "")
    else:
        target = getattr(settings, "HUMAN_RECEPTION_TRANSFER_NUMBER", "")

    if target:
        dial = Dial(caller_id=settings.TWILIO_PHONE_NUMBER)
        dial.number(target)
        response.append(dial)
    else:
        response.say("Please stay on the line. A team member will call you back shortly.")


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def twilio_incoming_call(request: HttpRequest):
    if not _validate_twilio_request(request):
        return HttpResponse("Invalid signature", status=403)

    call_sid = request.data.get("CallSid")
    caller = request.data.get("From", "Unknown")

    session = CallSessionManager.get(call_sid)
    session["caller_number"] = caller
    session["started_at"] = timezone.now().isoformat()
    CallSessionManager.save(call_sid, session)

    broadcast_call_event(
        "call_started",
        {
            "call_sid": call_sid,
            "caller_number": caller,
            "started_at": session["started_at"],
            "intent": "unknown",
        },
    )

    response = VoiceResponse()
    greeting = (
        "Thank you for calling Jaffna Hospital. This is your AI assistant. "
        "How may I help you today? You can say something like book an appointment, "
        "check doctor availability, or talk to a person."
    )
    _gather_prompt(response, greeting)
    response.redirect("/api/twilio/gather/", method="POST")

    CallSessionManager.add_history(call_sid, "assistant", greeting)
    return HttpResponse(str(response), content_type="text/xml")


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def twilio_gather(request: HttpRequest):
    if not _validate_twilio_request(request):
        return HttpResponse("Invalid signature", status=403)

    call_sid = request.data.get("CallSid")
    speech_text = (request.data.get("SpeechResult") or request.data.get("Digits") or "").strip()

    session = CallSessionManager.get(call_sid)
    caller = session.get("caller_number") or request.data.get("From", "Unknown")

    if speech_text:
        CallSessionManager.add_history(call_sid, "user", speech_text)

    nlp = NLPService()
    result = nlp.process_turn(speech_text, session, caller)

    context_update = result.context_update or {}
    if context_update.get("clarification_increment"):
        CallSessionManager.increment_clarification(call_sid)
    else:
        CallSessionManager.reset_clarification(call_sid)

    context_update.pop("clarification_increment", None)
    CallSessionManager.update_context(call_sid, context_update)
    CallSessionManager.add_history(call_sid, "assistant", result.response_text)

    if context_update.get("intent") in {"emergency", "handover", "handover_on_error"}:
        queue_type = "emergency" if result.action == "transfer_emergency" else "human"
        broadcast_call_event(
            "call_queued",
            {
                "call_sid": call_sid,
                "caller_number": caller,
                "queue": queue_type,
                "reason": context_update.get("intent"),
                "keyword": context_update.get("keyword"),
            },
        )

    response = VoiceResponse()
    if result.action in {"transfer_human", "transfer_emergency"}:
        response.say(result.response_text, voice="alice", language="en-US")
        _transfer(response, result.action)
    elif result.action == "end_call":
        response.say(result.response_text, voice="alice", language="en-US")
        response.hangup()
    else:
        _gather_prompt(response, result.response_text)
        response.redirect("/api/twilio/gather/", method="POST")

    return HttpResponse(str(response), content_type="text/xml")


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def twilio_status_callback(request: HttpRequest):
    call_sid = request.data.get("CallSid")
    call_status = request.data.get("CallStatus", "unknown")
    duration = request.data.get("CallDuration")

    session = CallSessionManager.get(call_sid)
    session = CallSessionManager.close(call_sid, status=call_status)

    call_data = {
        "call_sid": call_sid,
        "caller_number": session.get("caller_number"),
        "intent": session.get("context", {}).get("intent") or "unknown",
        "status": call_status,
        "duration": int(duration) if str(duration or "").isdigit() else None,
        "started_at": session.get("started_at"),
        "ended_at": timezone.now().isoformat(),
        "transcript": session.get("history", []),
        "metadata": {
            "context": session.get("context", {}),
            "twilio": dict(request.data),
        },
    }

    try:
        MongoDBService.store_call_log(call_data)
    except Exception:
        logger.exception("Failed to store Twilio call log")

    broadcast_call_event(
        "call_ended",
        {
            "call_sid": call_sid,
            "caller_number": session.get("caller_number"),
            "status": call_status,
            "duration": call_data["duration"],
        },
    )
    CallSessionManager.clear(call_sid)

    return HttpResponse("ok")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def live_calls_snapshot(request):
    """Simple authenticated endpoint for dashboard bootstrapping."""
    return Response({"active_calls": [], "human_queue": []})


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def simulate_incoming_call(request: HttpRequest):
    """Dev-only: simulate an incoming Twilio call and broadcast the event."""
    import uuid as _uuid

    fake_call_sid = "SIM_" + _uuid.uuid4().hex[:12].upper()
    fake_caller = request.data.get("caller", "+94770000000")

    session = CallSessionManager.get(fake_call_sid)
    session["caller_number"] = fake_caller
    session["started_at"] = timezone.now().isoformat()
    CallSessionManager.save(fake_call_sid, session)

    broadcast_call_event(
        "call_started",
        {
            "call_sid": fake_call_sid,
            "caller_number": fake_caller,
            "started_at": session["started_at"],
            "intent": "simulated",
        },
    )
    return Response({"call_sid": fake_call_sid, "status": "simulated"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer_call(request: HttpRequest, call_sid: str):
    """Manually transfer an active call to human reception."""
    session = CallSessionManager.get(call_sid)

    broadcast_call_event(
        "call_ended",
        {
            "call_sid": call_sid,
            "caller_number": session.get("caller_number"),
            "status": "transferred",
            "duration": None,
        },
    )
    CallSessionManager.clear(call_sid)
    return Response({"call_sid": call_sid, "status": "transferred"})
