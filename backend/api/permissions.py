"""
Custom permissions
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only Admin can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'


class IsAdminOrReceptionist(permissions.BasePermission):
    """Admin or Receptionist can access"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['Admin', 'Receptionist']
        )


class IsDoctorOrAdminOrReceptionist(permissions.BasePermission):
    """Doctor, Admin, or Receptionist can access"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['Admin', 'Doctor', 'Receptionist']
        )


class CanEditClinicalData(permissions.BasePermission):
    """Doctors and admins can edit medical records"""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['Admin', 'Doctor']
        )


class CanManageAdmissions(permissions.BasePermission):
    """Doctors and admins can manage admissions"""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['Admin', 'Doctor']
        )


class CanViewPatientHistory(permissions.BasePermission):
    """Clinical and management roles can view full patient history"""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['Admin', 'Doctor', 'Receptionist', 'Staff']
        )
