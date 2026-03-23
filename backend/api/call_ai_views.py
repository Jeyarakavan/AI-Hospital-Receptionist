"""Open-source call AI intake endpoints used by the Asterisk/Python voice agent."""

from __future__ import annotations

from hmac import compare_digest

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import CallReceptionRequest, Doctor
from .serializers import CallReceptionRequestSerializer


ALLOWED_INTENTS = {
    'BOOK_APPOINTMENT',
    'CANCEL_APPOINTMENT',
    'RESCHEDULE_APPOINTMENT',
    'GENERAL_INQUIRY',
    'HUMAN_HANDOFF',
    'EMERGENCY',
}


FINAL_STATUS_BY_INTENT = {
    'BOOK_APPOINTMENT': 'confirmed',
    'CANCEL_APPOINTMENT': 'cancelled',
    'RESCHEDULE_APPOINTMENT': 'rescheduled',
    'GENERAL_INQUIRY': 'pending',
    'HUMAN_HANDOFF': 'handoff_requested',
    'EMERGENCY': 'escalated',
}


def _is_authorized(request) -> bool:
    shared_token = getattr(settings, 'CALL_AI_SHARED_TOKEN', '').strip()
    if not shared_token:
        return False
    request_token = request.headers.get('X-Call-AI-Token', '').strip()
    return compare_digest(shared_token, request_token)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def call_ai_vocabulary(request):
    """Provides doctor and department vocabulary to the deterministic agent."""
    if not _is_authorized(request):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    doctors = list(
        Doctor.objects.select_related('user')
        .filter(user__status='Approved')
        .values_list('user__full_name', flat=True)
        .order_by('user__full_name')
    )
    departments = list(
        Doctor.objects.filter(user__status='Approved')
        .exclude(specialization='')
        .values_list('specialization', flat=True)
        .distinct()
        .order_by('specialization')
    )
    return Response({'doctors': doctors, 'departments': departments})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def call_ai_intake(request):
    """Stores final structured request after explicit caller confirmation."""
    if not _is_authorized(request):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    payload = dict(request.data)
    detected_intent = str(payload.get('detected_intent', '')).upper()
    if detected_intent not in ALLOWED_INTENTS:
        return Response(
            {'error': f'Unsupported intent: {detected_intent}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payload['detected_intent'] = detected_intent
    payload['final_status'] = payload.get('final_status') or FINAL_STATUS_BY_INTENT[detected_intent]

    if detected_intent == 'EMERGENCY':
        payload['emergency_flag'] = True
        payload['handoff_flag'] = True
        payload['confirmation_status'] = payload.get('confirmation_status') or 'not_required'
    elif detected_intent == 'HUMAN_HANDOFF':
        payload['handoff_flag'] = True
        payload['confirmation_status'] = payload.get('confirmation_status') or 'not_required'

    serializer = CallReceptionRequestSerializer(data=payload)
    if serializer.is_valid():
        record = serializer.save()
        return Response(
            {
                'id': str(record.id),
                'call_id': record.call_id,
                'status': record.final_status,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def call_ai_requests_list(request):
    """Lists AI receptionist requests for authorized staff dashboards."""
    qs = CallReceptionRequest.objects.all()
    final_status = request.query_params.get('status')
    if final_status:
        qs = qs.filter(final_status=final_status)

    intent = request.query_params.get('intent')
    if intent:
        qs = qs.filter(detected_intent=intent.upper())

    serializer = CallReceptionRequestSerializer(qs[:200], many=True)
    return Response(serializer.data)
