"""
Database models for Hospital System
PostgreSQL Models
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils import timezone
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
    has_changed_password = models.BooleanField(default=False)
    
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
        ordering = ['user__full_name']
    
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
        ordering = ['day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.doctor.user.full_name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Patient(models.Model):
    """Patient information"""
    TYPE_CHOICES = [
        ('Clinic', 'Clinic'),
        ('Accident', 'Accident'),
        ('General', 'General'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    phone_number = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")]
    )
    email = models.EmailField(null=True, blank=True)
    primary_disease = models.CharField(max_length=255, blank=True)
    patient_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='General')
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.phone_number}"


class PasswordResetOTP(models.Model):
    """OTP records for forgot-password flow"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_otps'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['otp_code', 'expires_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.otp_code}"


class PatientMedicalProfile(models.Model):
    """Extended patient profile for clinical workflows"""
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='medical_profile')
    ic_number = models.CharField(max_length=50, unique=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    baseline_summary = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_medical_profiles')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_medical_profiles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_medical_profiles'
        indexes = [
            models.Index(fields=['ic_number']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.patient.name} ({self.ic_number})"


class PatientCase(models.Model):
    """Core care case for patient diagnosis and assignment"""
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('UnderObservation', 'Under Observation'),
        ('Stable', 'Stable'),
        ('Critical', 'Critical'),
        ('Closed', 'Closed'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='cases')
    assigned_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='assigned_cases')
    diagnosis = models.TextField()
    current_condition = models.TextField(blank=True)
    next_checkup_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Open')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_patient_cases')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_patient_cases')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_cases'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'is_active']),
            models.Index(fields=['assigned_doctor', 'status']),
            models.Index(fields=['next_checkup_date']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        doctor_name = self.assigned_doctor.user.full_name if self.assigned_doctor else 'Unassigned'
        return f"{self.patient.name} - {doctor_name}"


class PatientEncounter(models.Model):
    """Doctor encounter / visit notes"""
    patient_case = models.ForeignKey(PatientCase, on_delete=models.CASCADE, related_name='encounters')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='encounters')
    notes = models.TextField()
    current_situation = models.TextField(blank=True)
    follow_up_plan = models.TextField(blank=True)
    encounter_date = models.DateField(default=timezone.now)
    next_checkup_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_encounters')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_encounters')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_encounters'
        ordering = ['-encounter_date', '-created_at']
        indexes = [
            models.Index(fields=['patient_case', 'encounter_date']),
            models.Index(fields=['doctor', 'encounter_date']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Encounter {self.patient_case.patient.name} - {self.encounter_date}"


class PrescriptionItem(models.Model):
    """Medicines prescribed during encounter"""
    encounter = models.ForeignKey(PatientEncounter, on_delete=models.CASCADE, related_name='prescriptions')
    medicine_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=255, blank=True)
    frequency = models.CharField(max_length=255, blank=True)
    duration = models.CharField(max_length=255, blank=True)
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescription_items'
        indexes = [
            models.Index(fields=['encounter', 'created_at']),
        ]

    def __str__(self):
        return f"{self.medicine_name} ({self.encounter_id})"


class PatientAdmission(models.Model):
    """Hospital admission and discharge timeline"""
    patient_case = models.ForeignKey(PatientCase, on_delete=models.CASCADE, related_name='admissions')
    admitted_on = models.DateField()
    discharged_on = models.DateField(null=True, blank=True)
    is_currently_admitted = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_admissions')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_admissions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient_admissions'
        ordering = ['-admitted_on', '-created_at']
        indexes = [
            models.Index(fields=['patient_case', 'is_currently_admitted']),
            models.Index(fields=['admitted_on']),
            models.Index(fields=['discharged_on']),
        ]

    @property
    def stay_days(self):
        end_date = self.discharged_on or timezone.now().date()
        return max((end_date - self.admitted_on).days + 1, 0)

    def __str__(self):
        return f"Admission {self.patient_case.patient.name} - {self.admitted_on}"


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
