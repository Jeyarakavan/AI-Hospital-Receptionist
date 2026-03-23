"""
Database models for Hospital System
PostgreSQL Models
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
import uuid


class UserManager(BaseUserManager):
    """Custom user manager"""
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Admin')
        extra_fields.setdefault('status', 'Approved')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """User model - stores all user information"""
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Doctor', 'Doctor'),
        ('Staff', 'Staff / Nurse'),
        ('Receptionist', 'Receptionist'),
    ]
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Disabled', 'Disabled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    phone_number = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")]
    )
    address = models.TextField()
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    about_yourself = models.TextField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.full_name} ({self.username})"


class Doctor(models.Model):
    """Doctor specific information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    doctor_id_card = models.ImageField(upload_to='doctor_id_cards/', null=True, blank=True)
    specialization = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'doctors'
    
    def __str__(self):
        return f"Dr. {self.user.full_name} - {self.specialization}"


class Staff(models.Model):
    """Staff/Nurse specific information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    staff_id_card = models.ImageField(upload_to='staff_id_cards/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'staff'
    
    def __str__(self):
        return f"{self.user.full_name} - Staff"


class Receptionist(models.Model):
    """Receptionist specific information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='receptionist_profile')
    receptionist_id_card = models.ImageField(upload_to='receptionist_id_cards/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'receptionists'
    
    def __str__(self):
        return f"{self.user.full_name} - Receptionist"


class DoctorAvailability(models.Model):
    """Doctor availability schedule"""
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.IntegerField(choices=[
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'doctor_availability'
        unique_together = ['doctor', 'day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.doctor.user.full_name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Patient(models.Model):
    """Patient information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    phone_number = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")]
    )
    email = models.EmailField(null=True, blank=True)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.phone_number}"


class Appointment(models.Model):
    """Appointment management"""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
        ('Completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_name = models.CharField(max_length=255)
    patient_age = models.IntegerField()
    patient_disease = models.TextField()
    contact_number = models.CharField(max_length=20)
    address = models.TextField()
    
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    booking_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_appointments')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        ordering = ['-appointment_date', '-appointment_time']
        indexes = [
            models.Index(fields=['appointment_date', 'appointment_time']),
            models.Index(fields=['doctor', 'appointment_date']),
        ]
    
    def __str__(self):
        return f"{self.patient_name} - Dr. {self.doctor.user.full_name} - {self.appointment_date} {self.appointment_time}"


class SiteSettings(models.Model):
    """Single row: logo, banner, site name - admin can change"""
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    site_name = models.CharField(max_length=255, default='WeHealth')
    logo = models.ImageField(upload_to='site/', null=True, blank=True)
    banner = models.ImageField(upload_to='site/', null=True, blank=True)
    # Public landing / login content (editable by admin)
    services_text = models.TextField(blank=True, default='')
    vision_text = models.TextField(blank=True, default='')
    mission_text = models.TextField(blank=True, default='')
    hero_image = models.ImageField(upload_to='site/', null=True, blank=True)
    footer_text = models.CharField(
        max_length=512,
        blank=True,
        default='© {year} Team Northern Knights – Application built by Team Northern Knights.',
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'site_settings'
    
    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'site_name': 'WeHealth'})
        return obj


class HospitalNews(models.Model):
    """News posts by admin - visible to all; email sent to users when posted"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    content = models.TextField()
    image = models.ImageField(upload_to='news/', null=True, blank=True)
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='news_posts')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'hospital_news'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class ChatMessage(models.Model):
    """Simple user-to-user chat messages inside the application"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['sender', 'receiver', 'created_at']),
        ]

    def __str__(self):
        return f"{self.sender.full_name} → {self.receiver.full_name}: {self.message[:30]}"


class CallReceptionRequest(models.Model):
    """Structured call-intake records created by the voice receptionist."""

    INTENT_CHOICES = [
        ('BOOK_APPOINTMENT', 'Book Appointment'),
        ('CANCEL_APPOINTMENT', 'Cancel Appointment'),
        ('RESCHEDULE_APPOINTMENT', 'Reschedule Appointment'),
        ('GENERAL_INQUIRY', 'General Inquiry'),
        ('HUMAN_HANDOFF', 'Human Handoff'),
        ('EMERGENCY', 'Emergency'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
        ('escalated', 'Escalated'),
        ('handoff_requested', 'Handoff Requested'),
        ('failed_capture', 'Failed Capture'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    call_id = models.CharField(max_length=128, unique=True)
    caller_id = models.CharField(max_length=32, blank=True, default='')
    patient_name = models.CharField(max_length=255, blank=True, default='')
    phone_number = models.CharField(max_length=32, blank=True, default='')
    doctor_name = models.CharField(max_length=255, blank=True, default='')
    department = models.CharField(max_length=255, blank=True, default='')
    appointment_date = models.CharField(max_length=32, blank=True, default='')
    appointment_time = models.CharField(max_length=32, blank=True, default='')
    reason_for_visit = models.TextField(blank=True, default='')
    urgency = models.CharField(max_length=32, blank=True, default='normal')
    confirmation_status = models.CharField(max_length=32, blank=True, default='not_confirmed')
    detected_intent = models.CharField(max_length=32, choices=INTENT_CHOICES)
    confidence_score = models.FloatField(default=0.0)
    transcript = models.TextField(blank=True, default='')
    extracted_slots = models.JSONField(default=dict, blank=True)
    emergency_flag = models.BooleanField(default=False)
    handoff_flag = models.BooleanField(default=False)
    final_status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'call_reception_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['detected_intent', 'final_status']),
            models.Index(fields=['caller_id']),
        ]

    def __str__(self):
        return f"{self.call_id} - {self.detected_intent} ({self.final_status})"


class AmbulanceRequest(models.Model):
    """Emergency ambulance dispatch requests submitted via the frontend."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('dispatched', 'Dispatched'),
        ('en_route', 'En Route'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=20)
    pickup_location = models.TextField()
    condition = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ambulance_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient_name} - {self.status} ({self.created_at.date()})"
