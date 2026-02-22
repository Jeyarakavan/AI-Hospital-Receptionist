# 🏥 Database Setup Guide

## Quick Start

### **Windows Users**
```bash
cd backend
setup.bat
```

### **Linux/Mac Users**
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

### **Manual Setup**
```bash
cd backend
python manage.py migrate
python manage.py create_admin
```

---

## What the Setup Script Does

1. ✅ **Tests database connection**
   - Checks PostgreSQL connectivity
   - Validates configuration

2. ✅ **Runs migrations**
   - Creates all database tables
   - Sets up schema for Users, Doctors, Appointments, etc.

3. ✅ **Creates admin user**
   - Prompts for admin credentials
   - Sets up initial admin account
   - Automatically approves admin account

---

## Automatic Database Tables

The setup process creates these tables automatically:

- 👤 **Users** - Main user table
- 👨‍⚕️ **Doctors** - Doctor profiles
- 👩‍⚕️ **Staff** - Nurses/Staff members
- 👨‍💼 **Receptionists** - Reception staff
- ⏰ **Doctor Availability** - Schedule management
- 👨‍🏫 **Patients** - Patient information
- 📅 **Appointments** - Appointment records

---

## Environment Configuration (.env file)

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=hospital_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# MongoDB (Optional - for call logs)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=hospital_ai_logs

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Admin Account Setup

### Default Credentials (if not customized during setup)
- **Username:** `admin`
- **Password:** `Admin@123`
- **Email:** `admin@hospital.com`

⚠️ **Important:** Change these after first login!

### Create Additional Admin
```bash
python manage.py create_admin \
  --username=admin2 \
  --email=admin2@hospital.com \
  --password=SecurePassword123
```

---

## Features Enabled After Setup

### ✅ Admin Can Register Users
Use the "Register User" page to add:
- Doctors
- Nurses/Staff
- Receptionists
- Other Admins

Users are automatically approved and can login immediately.

### ✅ Admin Profile is Editable
- Click "Edit Profile" button
- Update name, email, phone, address
- Changes persist to database

### ✅ Image Upload Validation
Automatic validation for:
- Profile pictures
- Doctor ID cards
- Staff ID cards
- File format: JPG, PNG, GIF, BMP
- Max file size: 5MB

Error messages for invalid uploads:
- "This field is required" - for missing files
- "Upload a valid image. The file you uploaded was either not an image or a corrupted image" - for invalid formats

---

## Troubleshooting

### PostgreSQL Connection Error
```
Error: FATAL: database "hospital_db" does not exist
```

**Solution:**
1. Create database in pgAdmin:
   ```sql
   CREATE DATABASE hospital_db;
   ```
2. Re-run setup script

### Migration Error
```
Error: relation "users" does not exist
```

**Solution:**
```bash
python manage.py migrate --run-syncdb
python setup_database.py
```

### Admin Creation Failed
```
IntegrityError: duplicate key value violates unique constraint
```

**Solution:**
```bash
python manage.py create_admin --username=newadmin --email=new@hospital.com
```

---

## API Endpoints

### Admin User Registration
```
POST /api/auth/register_by_admin/
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "message": "User registered successfully by admin",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "role": "Doctor|Staff|Receptionist|Admin",
    "status": "Approved"
  }
}
```

---

## Starting the Application

### Backend
```bash
cd backend
python manage.py runserver
# Server runs at http://localhost:8000
```

### Frontend
```bash
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## First Time Setup Process

1. **Run Setup Script**
   ```bash
   cd backend
   ./setup.sh  # or setup.bat on Windows
   ```

2. **Provide Admin Details**
   - Username: (e.g., admin)
   - Email: (e.g., admin@hospital.com)
   - Password: (strong password recommended)

3. **Start Backend Server**
   ```bash
   python manage.py runserver
   ```

4. **Start Frontend Server**
   ```bash
   npm run dev
   ```

5. **Login**
   - Go to `http://localhost:5173/login`
   - Use your admin credentials
   - Change password if needed

6. **Register Other Users**
   - Go to "Admin → Register User"
   - Fill in user details
   - User is automatically approved

---

## Database Backup & Reset

### Backup Database
```bash
pg_dump hospital_db > backup.sql
```

### Reset Database (Delete All Data)
```bash
# Drop and recreate
python backend/reset_database.ps1  # Windows
# or
python reset_and_migrate.py
```

⚠️ **Warning:** This deletes all data!

---

## Support

- Check `ERROR_FIXES.md` for known issues
- Review `CREATE_DATABASE_GUIDE.md` for detailed database guide
- See `QUICK_FIX.md` for common problems

---

Generated: 2024
AI Hospital Receptionist System v1.0
