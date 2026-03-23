"""
Serializers for API endpoints
"""
from rest_framework import serializers
from datetime import date
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from PIL import Image
from io import BytesIO
from .models import (
    User,
    Doctor,
    Staff,
    Receptionist,
    DoctorAvailability,
    Patient,
    PasswordResetOTP,
    PatientMedicalProfile,
    PatientCase,
    PatientEncounter,
    PrescriptionItem,
    PatientAdmission,
    Appointment,
    SiteSettings,
    HospitalNews,
    ChatMessage,
)


def validate_image_file(image_file):
    """Validate that uploaded file is a valid image"""
    if not image_file:
        return
    
    if image_file.size > 5 * 1024 * 1024:  # 5MB limit
        raise serializers.ValidationError("Image file size must be less than 5MB")
    
    # Check file extension
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
    file_name = image_file.name.lower()
    file_ext = file_name.split('.')[-1]
    
    if file_ext not in allowed_extensions:
        raise serializers.ValidationError(
            f"Upload a valid image. The file you uploaded was either not an image or a corrupted image. Allowed formats: {', '.join(allowed_extensions)}"
        )
    
    # Verify it's actually an image
    try:
        img = Image.open(image_file)
        img.verify()
        image_file.seek(0)  # Reset file pointer
    except Exception:
        raise serializers.ValidationError("Upload a valid image. The file you uploaded was either not an image or a corrupted image.")


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    # Role-specific fields
    doctor_id_card = serializers.ImageField(write_only=True, required=False, allow_null=True)
    specialization = serializers.CharField(write_only=True, required=False, allow_blank=True)
    staff_id_card = serializers.ImageField(write_only=True, required=False, allow_null=True)
    receptionist_id_card = serializers.ImageField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'confirm_password',
            'full_name', 'date_of_birth', 'phone_number', 'address',
            'profile_picture', 'about_yourself', 'role',
            'doctor_id_card', 'specialization',
            'staff_id_card', 'receptionist_id_card'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'password': {'write_only': True, 'required': True},
            'full_name': {'required': True},
            'date_of_birth': {'required': True},
            'phone_number': {'required': True},
            'address': {'required': True},
            'role': {'required': True},
            'profile_picture': {'required': False, 'allow_null': True},
            'about_yourself': {'required': False, 'allow_blank': True},
        }
    
    def validate_profile_picture(self, value):
        """Validate profile picture is a valid image"""
        validate_image_file(value)
        return value
    
    def validate_doctor_id_card(self, value):
        """Validate doctor ID card is a valid image"""
        validate_image_file(value)
        return value
    
    def validate_staff_id_card(self, value):
        """Validate staff ID card is a valid image"""
        validate_image_file(value)
        return value
    
    def validate_receptionist_id_card(self, value):
        """Validate receptionist ID card is a valid image"""
        validate_image_file(value)
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove role-specific fields
        doctor_id_card = validated_data.pop('doctor_id_card', None)
        specialization = validated_data.pop('specialization', None)
        staff_id_card = validated_data.pop('staff_id_card', None)
        receptionist_id_card = validated_data.pop('receptionist_id_card', None)
        confirm_password = validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Create role-specific profile
        role = validated_data.get('role')
        if role == 'Doctor' and specialization:
            Doctor.objects.create(
                user=user,
                doctor_id_card=doctor_id_card,
                specialization=specialization
            )
        elif role == 'Staff':
            Staff.objects.create(
                user=user,
                staff_id_card=staff_id_card
            )
        elif role == 'Receptionist':
            Receptionist.objects.create(
                user=user,
                receptionist_id_card=receptionist_id_card
            )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details - includes profile and ID card URLs for admin verification"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    id_card_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'date_of_birth',
            'phone_number', 'address', 'profile_picture', 'profile_picture_url',
            'about_yourself', 'role', 'role_display', 'specialization',
            'status', 'status_display', 'id_card_url',
            'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at']
    
    def _absolute_uri(self, file_field):
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        return file_field.url
    
    def get_profile_picture_url(self, obj):
        return self._absolute_uri(obj.profile_picture)
    
    def get_specialization(self, obj):
        if hasattr(obj, 'doctor_profile'):
            return getattr(obj.doctor_profile, 'specialization', None)
        return None
    
    def get_id_card_url(self, obj):
        if hasattr(obj, 'doctor_profile') and obj.doctor_profile.doctor_id_card:
            return self._absolute_uri(obj.doctor_profile.doctor_id_card)
        if hasattr(obj, 'staff_profile') and obj.staff_profile.staff_id_card:
            return self._absolute_uri(obj.staff_profile.staff_id_card)
        if hasattr(obj, 'receptionist_profile') and obj.receptionist_profile.receptionist_id_card:
            return self._absolute_uri(obj.receptionist_profile.receptionist_id_card)
        return None


class DoctorSerializer(serializers.ModelSerializer):
    """Serializer for doctor details"""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'user_id', 'doctor_id_card', 'specialization', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for doctor availability"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'doctor', 'doctor_name', 'day_of_week', 'day_display',
            'start_time', 'end_time', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for patient"""
    class Meta:
        model = Patient
        fields = [
            'id',
            'name',
            'age',
            'phone_number',
            'email',
            'primary_disease',
            'patient_type',
            'address',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientMedicalProfileSerializer(serializers.ModelSerializer):
    """Serializer for extended patient medical profile"""

    class Meta:
        model = PatientMedicalProfile
        fields = [
            'id',
            'patient',
            'ic_number',
            'emergency_contact_name',
            'emergency_contact_phone',
            'allergies',
            'chronic_conditions',
            'baseline_summary',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at']

    def validate_ic_number(self, value):
        normalized = value.strip().upper()
        qs = PatientMedicalProfile.objects.filter(ic_number__iexact=normalized)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('IC number already exists.')
        return normalized


class PatientCaseSerializer(serializers.ModelSerializer):
    """Serializer for patient care case"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    assigned_doctor_name = serializers.CharField(source='assigned_doctor.user.full_name', read_only=True)
    encounters = serializers.SerializerMethodField()
    admissions = serializers.SerializerMethodField()

    class Meta:
        model = PatientCase
        fields = [
            'id',
            'patient',
            'patient_name',
            'assigned_doctor',
            'assigned_doctor_name',
            'diagnosis',
            'current_condition',
            'next_checkup_date',
            'status',
            'is_active',
            'encounters',
            'admissions',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at']

    def validate_next_checkup_date(self, value):
        if value and value < date.today():
            raise serializers.ValidationError('Next checkup date cannot be in the past.')
        return value

    def get_encounters(self, obj):
        encounters = obj.encounters.select_related('doctor__user').prefetch_related('prescriptions').all()
        return PatientEncounterSerializer(encounters, many=True).data

    def get_admissions(self, obj):
        admissions = obj.admissions.all()
        return PatientAdmissionSerializer(admissions, many=True).data


class PrescriptionItemSerializer(serializers.ModelSerializer):
    """Serializer for medicine items"""

    class Meta:
        model = PrescriptionItem
        fields = ['id', 'encounter', 'medicine_name', 'dosage', 'frequency', 'duration', 'instructions', 'created_at']
        read_only_fields = ['id', 'created_at']


class PatientEncounterSerializer(serializers.ModelSerializer):
    """Serializer for doctor encounters"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    prescriptions = PrescriptionItemSerializer(many=True, required=False)

    class Meta:
        model = PatientEncounter
        fields = [
            'id',
            'patient_case',
            'doctor',
            'doctor_name',
            'notes',
            'current_situation',
            'follow_up_plan',
            'encounter_date',
            'next_checkup_date',
            'prescriptions',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at']

    def validate_next_checkup_date(self, value):
        if value and value < date.today():
            raise serializers.ValidationError('Next checkup date cannot be in the past.')
        return value

    def create(self, validated_data):
        prescriptions_data = validated_data.pop('prescriptions', [])
        encounter = PatientEncounter.objects.create(**validated_data)
        for item in prescriptions_data:
            PrescriptionItem.objects.create(encounter=encounter, **item)
        return encounter

    def update(self, instance, validated_data):
        prescriptions_data = validated_data.pop('prescriptions', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        if prescriptions_data is not None:
            instance.prescriptions.all().delete()
            for item in prescriptions_data:
                PrescriptionItem.objects.create(encounter=instance, **item)
        return instance


class PatientAdmissionSerializer(serializers.ModelSerializer):
    """Serializer for patient admission timeline"""
    stay_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = PatientAdmission
        fields = [
            'id',
            'patient_case',
            'admitted_on',
            'discharged_on',
            'is_currently_admitted',
            'notes',
            'stay_days',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'stay_days', 'created_by', 'updated_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        admitted_on = attrs.get('admitted_on', getattr(self.instance, 'admitted_on', None))
        discharged_on = attrs.get('discharged_on', getattr(self.instance, 'discharged_on', None))
        is_current = attrs.get('is_currently_admitted', getattr(self.instance, 'is_currently_admitted', True))
        patient_case = attrs.get('patient_case', getattr(self.instance, 'patient_case', None))

        if discharged_on and admitted_on and discharged_on < admitted_on:
            raise serializers.ValidationError({'discharged_on': 'Discharge date cannot be before admit date.'})

        if patient_case and is_current:
            qs = PatientAdmission.objects.filter(patient_case=patient_case, is_currently_admitted=True)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('Only one active admission is allowed per case.')
        return attrs


class PatientHistorySerializer(serializers.Serializer):
    """Combined patient timeline serializer"""
    patient = PatientSerializer()
    medical_profile = PatientMedicalProfileSerializer(allow_null=True)
    cases = PatientCaseSerializer(many=True)

class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for appointment"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_name', 'patient_age', 'patient_disease',
            'contact_number', 'address', 'doctor', 'doctor_name', 'doctor_specialization',
            'appointment_date', 'appointment_time', 'booking_time',
            'status', 'status_display', 'created_by', 'created_by_name', 'updated_at'
        ]
        read_only_fields = ['id', 'booking_time', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointment"""
    class Meta:
        model = Appointment
        fields = [
            'patient_name', 'patient_age', 'patient_disease',
            'contact_number', 'address', 'doctor',
            'appointment_date', 'appointment_time', 'status'
        ]


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class UserApprovalSerializer(serializers.Serializer):
    """Serializer for user approval"""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'disable'])


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer for site settings (logo, banner, content sections, site name)"""
    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()
    hero_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteSettings
        fields = [
            'id',
            'site_name',
            'logo',
            'banner',
            'logo_url',
            'banner_url',
            'services_text',
            'vision_text',
            'mission_text',
            'hero_image',
            'hero_image_url',
            'footer_text',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_banner_url(self, obj):
        if obj.banner:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.banner.url)
            return obj.banner.url
        return None

    def get_hero_image_url(self, obj):
        if obj.hero_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
            return obj.hero_image.url
        return None


class HospitalNewsSerializer(serializers.ModelSerializer):
    """Serializer for hospital news"""
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True)
    
    class Meta:
        model = HospitalNews
        fields = ['id', 'title', 'content', 'image', 'posted_by', 'posted_by_name', 'created_at']
        read_only_fields = ['id', 'posted_by', 'created_at']


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending message to a user by email"""
    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    
    def validate(self, attrs):
        if not attrs.get('user_id') and not attrs.get('email'):
            raise serializers.ValidationError('Provide either user_id or email.')
        return attrs


class SimpleUserSerializer(serializers.ModelSerializer):
    """Lightweight user representation for chat user search"""
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'username', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender = SimpleUserSerializer(read_only=True)
    receiver = SimpleUserSerializer(read_only=True)
    receiver_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'message', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'receiver', 'created_at', 'is_read']

    def create(self, validated_data):
        receiver_id = validated_data.pop('receiver_id')
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({'receiver_id': 'Receiver not found'})

        user = self.context['request'].user
        return ChatMessage.objects.create(sender=user, receiver=receiver, **validated_data)
