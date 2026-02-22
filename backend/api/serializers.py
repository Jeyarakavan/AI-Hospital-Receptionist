"""
Serializers for API endpoints
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from PIL import Image
from io import BytesIO
from .models import User, Doctor, Staff, Receptionist, DoctorAvailability, Patient, Appointment


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
    """Serializer for user details"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'date_of_birth',
            'phone_number', 'address', 'profile_picture', 'about_yourself',
            'role', 'role_display', 'status', 'status_display',
            'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at']


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
        fields = ['id', 'name', 'age', 'phone_number', 'email', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


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


class UserApprovalSerializer(serializers.Serializer):
    """Serializer for user approval"""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'disable'])
