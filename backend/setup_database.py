#!/usr/bin/env python
"""
Automated Database Setup Script
This script will:
1. Check if database is configured properly
2. Create all tables
3. Create admin user if it doesn't exist
4. Display setup summary

Usage: python setup_database.py
"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_system.settings')
django.setup()

from django.db import connection
from django.core.management import call_command
from django.core.management.color import Style
from api.models import User
from datetime import date


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_database_connection():
    """Test if database connection is working"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def run_migrations():
    """Run all pending migrations"""
    try:
        print("\n📦 Running database migrations...")
        call_command('migrate', interactive=False, verbosity=1)
        print("✅ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


def create_admin_user(username='admin', email='admin@hospital.com', password='Admin@123'):
    """Create default admin user if it doesn't exist"""
    try:
        if User.objects.filter(username=username).exists():
            print(f"ℹ️  Admin user '{username}' already exists, skipping creation")
            return True

        print(f"\n👤 Creating admin user '{username}'...")
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            full_name='System Administrator',
            date_of_birth=date(1990, 1, 1),
            phone_number='+1234567890',
            address='Hospital Admin Office',
            role='Admin',
            status='Approved',
        )
        print(f"✅ Admin user created successfully")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        return True
    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        return False


def get_user_input(prompt, default=None):
    """Get user input with optional default"""
    if default:
        prompt_with_default = f"{prompt} [{default}]: "
    else:
        prompt_with_default = f"{prompt}: "
    
    user_input = input(prompt_with_default).strip()
    return user_input if user_input else default


def setup_database():
    """Main setup function"""
    print_section("AI Hospital System - Database Setup")
    print("\n🏥 Welcome to the AI Hospital Receptionist System Setup!")
    print("This script will configure your database and create an admin account.\n")

    # Check database connection
    print("📡 Checking database connection...")
    if not test_database_connection():
        print("\n❌ Cannot proceed without a working database connection.")
        print("Please ensure:")
        print("  • PostgreSQL is running")
        print("  • Database credentials are set in .env file")
        print("  • Environment variables are configured correctly")
        return False

    # Run migrations
    if not run_migrations():
        print("\n❌ Cannot proceed without successful migrations.")
        return False

    # Create admin user
    print_section("Admin Account Setup")
    print("\nWould you like to create an admin account now?")
    
    create_admin = input("Create admin user? (yes/no) [yes]: ").strip().lower()
    if create_admin in ['', 'yes', 'y']:
        print("\nPlease provide admin account details:")
        admin_username = get_user_input("Admin username", "admin")
        admin_email = get_user_input("Admin email", "admin@hospital.com")
        admin_password = get_user_input("Admin password", "Admin@123")
        
        confirm = input(f"\n⚠️  Create admin with username '{admin_username}'? (yes/no): ").strip().lower()
        if confirm in ['yes', 'y']:
            if not create_admin_user(admin_username, admin_email, admin_password):
                return False
        else:
            print("❌ Admin creation cancelled")
            return False
    else:
        print("⏭️  Skipping admin creation")

    # Success summary
    print_section("Setup Complete! ✅")
    print("\n🎉 Database setup completed successfully!")
    print("\nNext steps:")
    print("  1. Start the development server: python manage.py runserver")
    print("  2. Login to admin panel: http://localhost:8000/admin/")
    print("  3. Start the frontend: npm run dev")
    print("\nImportant:")
    print("  • Save your admin credentials in a secure location")
    print("  • Change the password after first login")
    print("  • Configure environment variables in .env for production")
    
    return True


if __name__ == '__main__':
    try:
        success = setup_database()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
