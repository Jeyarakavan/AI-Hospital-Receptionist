"""
Business logic services
"""
from django.utils import timezone
from datetime import datetime, timedelta
from django.conf import settings
from twilio.rest import Client as TwilioClient
import sendgrid
from sendgrid.helpers.mail import Mail
import logging
from .models import Appointment, Doctor, DoctorAvailability
from .mongodb_service import MongoDBService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications"""
    
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
            
            mail = Mail(
                from_email=(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
                to_emails=to_email,
                subject=subject,
                plain_text_content=message,
                html_content=html_content or message
            )
            
            response = sg.send(mail)
            logger.info(f"Email sent to {to_email}: Status {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def notify_appointment_confirmed(appointment):
        """Send SMS when appointment is confirmed"""
        message = f"Your appointment with Dr. {appointment.doctor.user.full_name} is confirmed for {appointment.appointment_date} at {appointment.appointment_time}. Thank you!"
        NotificationService.send_sms(appointment.contact_number, message)
        
        # Save notification to MongoDB
        MongoDBService.save_notification(
            user_id=None,  # Patient notifications
            notification_type='appointment_confirmed',
            title='Appointment Confirmed',
            message=message,
            metadata={'appointment_id': str(appointment.id)}
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
    def accept_appointment(appointment):
        """Doctor accepts appointment"""
        appointment.status = 'Confirmed'
        appointment.save()
        
        # Send notification
        NotificationService.notify_appointment_confirmed(appointment)
        
        return appointment
