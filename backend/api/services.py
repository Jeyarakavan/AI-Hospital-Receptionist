"""
Business logic services
"""
from django.utils import timezone
from datetime import datetime, timedelta
from django.conf import settings
from twilio.rest import Client as TwilioClient
import sendgrid
from sendgrid.helpers.mail import Mail, Email
import logging
from .models import Appointment, Doctor, DoctorAvailability, Patient, PatientCase
from .mongodb_service import MongoDBService
from django.db.models import Q

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications"""

    @staticmethod
    def _render_transactional_html(title, intro, lines=None, footer_note=None):
        lines = lines or []
        line_items = "".join(
            f"<li style='margin: 6px 0; color: #334155;'>{line}</li>" for line in lines
        )
        footer = footer_note or "This is an automated service email from WeHealth."
        return f"""
        <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
          <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background: #0d9488; color: white; padding: 14px 20px; font-size: 18px; font-weight: 700;">
              WeHealth Notification
            </div>
            <div style="padding: 20px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a;">{title}</h2>
              <p style="margin: 0 0 14px 0; color: #334155;">{intro}</p>
              <ul style="padding-left: 18px; margin: 0 0 16px 0;">
                {line_items}
              </ul>
              <p style="margin: 0; color: #64748b; font-size: 12px;">{footer}</p>
            </div>
          </div>
        </div>
        """
    
    @staticmethod
    def send_sms(phone_number, message):
        """Send SMS using Twilio"""
        try:
            if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
                logger.warning("Twilio credentials not configured. SMS not sent.")
                return False
            
            client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            message = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            
            logger.info(f"SMS sent to {phone_number}: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            return False
    
    @staticmethod
    def send_email(to_email, subject, message, html_content=None):
        """Send email using SendGrid"""
        try:
            if not settings.SENDGRID_API_KEY:
                logger.warning("SendGrid API key not configured. Email not sent.")
                return False
            
            sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            from_email = Email(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME)
            
            mail = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                plain_text_content=message,
                html_content=html_content or message
            )
            
            response = sg.send(mail)
            if 200 <= response.status_code < 300:
                logger.info(f"Email sent to {to_email}: Status {response.status_code}")
                return True

            logger.error(
                "SendGrid non-success response to %s: status=%s body=%s",
                to_email,
                response.status_code,
                getattr(response, "body", b""),
            )
            return False
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def notify_appointment_confirmed(appointment):
        """Send doctor + patient notifications when appointment is confirmed"""
        doctor_email = appointment.doctor.user.email
        patient_email = appointment.patient_email or (
            appointment.created_by.email if appointment.created_by and appointment.created_by.email else None
        )
        appointment_details = (
            f"Patient: {appointment.patient_name}\n"
            f"Age: {appointment.patient_age}\n"
            f"Reason: {appointment.patient_disease}\n"
            f"Date: {appointment.appointment_date}\n"
            f"Time: {appointment.appointment_time}\n"
            f"Booked At: {appointment.booking_time}\n"
            f"Doctor: Dr. {appointment.doctor.user.full_name} ({appointment.doctor.specialization})"
        )
        message = f"Appointment confirmed.\n{appointment_details}"
        html_content = NotificationService._render_transactional_html(
            title="Appointment Confirmed",
            intro="An appointment has been confirmed with the following details:",
            lines=[
                f"Patient: {appointment.patient_name}",
                f"Age: {appointment.patient_age}",
                f"Reason: {appointment.patient_disease}",
                f"Date: {appointment.appointment_date}",
                f"Time: {appointment.appointment_time}",
                f"Booked At: {appointment.booking_time}",
                f"Doctor: Dr. {appointment.doctor.user.full_name} ({appointment.doctor.specialization})",
            ],
            footer_note="If you did not expect this, contact hospital support immediately.",
        )
        NotificationService.send_sms(appointment.contact_number, message)

        if doctor_email:
            NotificationService.send_email(
                to_email=doctor_email,
                subject='Appointment Confirmed - Doctor Notification',
                message=message,
                html_content=html_content,
            )
        if patient_email:
            NotificationService.send_email(
                to_email=patient_email,
                subject='Appointment Confirmed - Patient Copy',
                message=message,
                html_content=html_content,
            )

        MongoDBService.save_notification(
            user_id=str(appointment.created_by_id) if appointment.created_by_id else None,
            notification_type='appointment_confirmed',
            title='Appointment Confirmed',
            message=message,
            metadata={
                'appointment_id': str(appointment.id),
                'doctor_email': doctor_email,
                'patient_email': patient_email,
                'purpose': 'appointment confirmation',
                'receiver_email': patient_email or doctor_email,
            }
        )
    
    @staticmethod
    def notify_appointment_changed(appointment, old_date=None, old_time=None):
        """Send SMS when appointment is changed"""
        message = f"Your appointment with Dr. {appointment.doctor.user.full_name} has been updated. New date: {appointment.appointment_date}, Time: {appointment.appointment_time}."
        if old_date or old_time:
            message += f" Previous: {old_date or appointment.appointment_date} {old_time or appointment.appointment_time}."
        
        NotificationService.send_sms(appointment.contact_number, message)
        
        MongoDBService.save_notification(
            user_id=None,
            notification_type='appointment_changed',
            title='Appointment Updated',
            message=message,
            metadata={'appointment_id': str(appointment.id)}
        )
    
    @staticmethod
    def notify_hospital_news(user_ids, title, message):
        """Send email notification to all users about hospital news"""
        from .models import User
        
        users = User.objects.filter(id__in=user_ids, status='Approved')
        for user in users:
            NotificationService.send_email(
                to_email=user.email,
                subject=f"Hospital News: {title}",
                message=message
            )
            
            MongoDBService.save_notification(
                user_id=str(user.id),
                notification_type='hospital_news',
                title=title,
                message=message
            )


class AppointmentService:
    """Service for appointment management"""

    @staticmethod
    def ensure_patient_and_case_from_appointment(appointment):
        """
        Ensure a Patient exists (matched by email or phone), and ensure at least one active
        PatientCase exists for this doctor-patient pair.
        Returns (patient, patient_case) or (None, None) on failure.
        """
        try:
            email = (appointment.patient_email or "").strip().lower()
            phone = (appointment.contact_number or "").strip()

            patient = None
            if email:
                patient = Patient.objects.filter(email__iexact=email).first()
            if not patient and phone:
                patient = Patient.objects.filter(phone_number=phone).first()

            if patient:
                # Keep patient profile fresh
                dirty = False
                if appointment.patient_name and patient.name != appointment.patient_name:
                    patient.name = appointment.patient_name
                    dirty = True
                if appointment.patient_age and patient.age != appointment.patient_age:
                    patient.age = appointment.patient_age
                    dirty = True
                if phone and patient.phone_number != phone:
                    patient.phone_number = phone
                    dirty = True
                if email and (patient.email or "").lower() != email:
                    patient.email = email
                    dirty = True
                if appointment.address and patient.address != appointment.address:
                    patient.address = appointment.address
                    dirty = True
                if appointment.patient_disease and patient.primary_disease != appointment.patient_disease:
                    patient.primary_disease = appointment.patient_disease
                    dirty = True
                if dirty:
                    patient.save()
            else:
                patient = Patient.objects.create(
                    name=appointment.patient_name,
                    age=appointment.patient_age or 0,
                    phone_number=phone,
                    email=email or None,
                    primary_disease=appointment.patient_disease or "",
                    patient_type="General",
                    address=appointment.address or "",
                )

            # Ensure an active case exists for this patient & doctor
            existing_case = PatientCase.objects.filter(
                patient=patient,
                assigned_doctor=appointment.doctor,
                is_active=True,
            ).exclude(status="Closed").order_by("-created_at").first()

            if existing_case:
                # Optionally refresh diagnosis/condition
                updated = False
                if appointment.patient_disease and existing_case.diagnosis != appointment.patient_disease:
                    existing_case.diagnosis = appointment.patient_disease
                    updated = True
                if getattr(appointment, "description", "") and not existing_case.current_condition:
                    existing_case.current_condition = appointment.description
                    updated = True
                if updated:
                    existing_case.save(update_fields=["diagnosis", "current_condition", "updated_at"])
                return patient, existing_case

            new_case = PatientCase.objects.create(
                patient=patient,
                assigned_doctor=appointment.doctor,
                diagnosis=appointment.patient_disease or "Consultation",
                current_condition=getattr(appointment, "description", "") or "",
                status="Open",
                is_active=True,
                created_by=appointment.doctor.user,
                updated_by=appointment.doctor.user,
            )
            return patient, new_case
        except Exception as e:
            logger.error(f"ensure_patient_and_case_from_appointment error: {e}")
            return None, None
    
    @staticmethod
    def can_edit_appointment(appointment):
        """Check if appointment can be edited (before one day)"""
        appointment_datetime = datetime.combine(
            appointment.appointment_date,
            appointment.appointment_time
        )
        now = timezone.now()
        time_diff = appointment_datetime - now
        
        # Can edit if more than 24 hours before appointment
        return time_diff > timedelta(days=1)
    
    @staticmethod
    def check_doctor_availability(doctor, appointment_date, appointment_time):
        """Check if doctor is available at given date and time"""
        # Get day of week (0=Monday, 6=Sunday)
        day_of_week = appointment_date.weekday()
        
        # Check availability
        availability = DoctorAvailability.objects.filter(
            doctor=doctor,
            day_of_week=day_of_week,
            is_available=True,
            start_time__lte=appointment_time,
            end_time__gte=appointment_time
        ).exists()
        
        if not availability:
            return False, "Doctor is not available at this time"
        
        # Check for existing appointments
        existing = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status__in=['Pending', 'Confirmed']
        ).exists()
        
        if existing:
            return False, "Time slot already booked"
        
        return True, "Available"

    @staticmethod
    def get_available_slots(doctor, appointment_date, slot_minutes=30):
        """Return free times for a doctor on a specific date."""
        day_of_week = appointment_date.weekday()
        windows = DoctorAvailability.objects.filter(
            doctor=doctor,
            day_of_week=day_of_week,
            is_available=True,
        ).order_by('start_time')

        booked_times = set(
            Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                status__in=['Pending', 'Confirmed'],
            ).values_list('appointment_time', flat=True)
        )

        free_slots = []
        for window in windows:
            # We use a datetime combine to iterate
            current_dt = datetime.combine(appointment_date, window.start_time)
            end_dt = datetime.combine(appointment_date, window.end_time)
            
            # Start time must be >= now if appointment_date is today
            if appointment_date == timezone.now().date():
                now_time = timezone.now().time()
                if current_dt.time() < now_time:
                    # Move current_dt to next available slot after current time
                    while current_dt.time() < now_time and current_dt < end_dt:
                        current_dt += timedelta(minutes=slot_minutes)

            while current_dt < end_dt:
                slot_time = current_dt.time().replace(microsecond=0)
                if slot_time not in booked_times:
                    free_slots.append(slot_time.strftime('%H:%M:%S'))
                current_dt += timedelta(minutes=slot_minutes)
        return free_slots
    
    @staticmethod
    def get_upcoming_slots(doctor, days=7, slot_minutes=30):
        """Calculate next X days of available slots for a doctor."""
        results = []
        today = timezone.now().date()
        
        for i in range(days):
            date = today + timedelta(days=i)
            slots = AppointmentService.get_available_slots(doctor, date, slot_minutes)
            if slots:
                results.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'day_name': date.strftime('%A'),
                    'slots': slots
                })
        return results
    
    @staticmethod
    def accept_appointment(appointment):
        """Doctor accepts appointment"""
        appointment.status = 'Confirmed'
        appointment.save()

        # Ensure patient profile + active medical case exists for doctor workflow
        AppointmentService.ensure_patient_and_case_from_appointment(appointment)
        
        # Send notification
        NotificationService.notify_appointment_confirmed(appointment)
        
        return appointment
