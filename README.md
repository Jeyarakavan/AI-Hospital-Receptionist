# 🏥 AI Hospital Receptionist System - Complete Project

A comprehensive, production-ready Hospital Management System with AI-powered features, multi-role user management, and appointment scheduling. Built with Django REST Framework backend and React.js frontend.

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Deployment](#deployment)

## 🔧 Technology Stack

### Backend
- **Framework**: Django 4.2.7 + Django REST Framework
- **Database**: PostgreSQL (core data) + MongoDB (logs & AI interactions)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local file system (media uploads)

### Frontend
- **Framework**: React.js 18
- **UI Library**: Material UI (MUI) 5
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6

### External Services
- **SMS**: Twilio
- **Email**: SendGrid
- **Telephony**: Twilio, Asterisk (for AI call routing)
- **Real-time**: Django Channels WebSocket (`ws://<host>/ws/calls/`)

## ✨ Features

### 🤖 AI Receptionist
- Twilio voice webhooks for inbound calls (`/api/twilio/voice/`, `/api/twilio/gather/`, `/api/twilio/status/`)
- LLM-driven NLP orchestration (`backend/api/nlp_service.py`) with strict JSON responses
- Emergency keyword detection with immediate escalation flow
- Human handover queue events over WebSocket (`ws://<host>/ws/calls/`)
- Live **CallConsole** dashboard for monitoring active AI calls and human queue
- Simulate incoming call (`POST /api/twilio/simulate/`) for local testing without Twilio
- Transfer active call to human agent (`POST /api/calls/<call_sid>/transfer/`)
- Live call snapshot (`GET /api/live-calls/`) for polling fallback
- Call AI intake form (`POST /api/call-ai/intake/`) — stores structured `CallReceptionRequest` records
- Call AI requests list (`GET /api/call-ai/requests/`) with filtering
- Vocabulary endpoint (`GET /api/call-ai/vocabulary/`) for NLP hint tuning
- Full transcript call logging support in MongoDB (`store_call_log`)

### 🔐 Authentication & Authorization
- User registration with role-based fields
- JWT-based authentication
- Admin approval system for new users
- Role-based access control (Admin, Doctor, Receptionist, Staff)

### 👥 User Management
- Multi-role registration (Doctor, Staff, Receptionist, Admin)
- Profile picture upload
- Role-specific ID card uploads
- Admin approval/rejection system
- User status management (Pending, Approved, Rejected, Disabled)

### 👨‍⚕️ Doctor Management
- Doctor profiles with specialization
- Availability schedule management
- Time slot management
- Doctor ID card upload

### 📅 Appointment Management
- Create, view, edit, and cancel appointments
- Doctor availability validation
- Prevent double booking
- Appointment status tracking (Pending, Confirmed, Cancelled, Completed)
- Edit restrictions (only before one day of appointment)
- Automatic SMS notifications

### 📞 Call Logs & AI Integration
- Store call logs in MongoDB
- AI interaction logs
- Call history tracking
- Intent detection and response logging

### � Ambulance Dispatch
- Submit ambulance requests (public — no auth required)
- Admin/staff can view all requests and update dispatch status (`pending → dispatched → en_route → completed`)
- `GET /api/ambulance/`, `POST /api/ambulance/`, `PATCH /api/ambulance/<id>/`

### 📊 Dashboard Analytics
- Role-based dashboard views
- Full analytics stats for Admin: `total_doctors`, `total_patients`, `total_appointments`, `total_calls`, `total_staff`, `avg_call_duration`, `staff_breakdown`, `completed_appointments`, `pending_appointments`, `cancelled_appointments`, `today_appointments`, `pending_users`
- Today's appointments and pending approvals
- Recent call logs (MongoDB)

### 📧 Notifications
- SMS notifications via Twilio
- Email notifications via SendGrid
- In-app notifications stored in MongoDB
- Hospital news broadcast to all users

### 🎨 Admin Page & Branding
- **Site Settings** (Admin only): Change site name, upload logo (shown in corner of all pages, larger size), upload banner image for login/welcome pages. Stored in database (PostgreSQL) and media files.
- **Hospital News**: Admin can post news; optionally send email to all users. All roles can view news. Admin can delete news.
- **Send message to user**: Admin can send an email to a specific staff or doctor (select user, subject, message). Uses SendGrid.
- **User control**: Admin can approve, reject, or disable users (disable stops login; user is not deleted).

## 📁 Project Structure

```
AI-Hospital-Receptionist/
├── backend/                          # Django Backend
│   ├── api/                          # Main API app
│   │   ├── models.py                 # ORM models (User, Doctor, Appointment, AmbulanceRequest, ...)
│   │   ├── serializers.py            # DRF serializers
│   │   ├── views.py                  # API views + AmbulanceViewSet + dashboard_stats
│   │   ├── urls.py                   # URL routing
│   │   ├── twilio_views.py           # Twilio webhooks + simulate + transfer
│   │   ├── call_ai_views.py          # Call AI intake / requests / vocabulary
│   │   ├── consumers.py              # Django Channels WebSocket consumer
│   │   ├── call_session.py           # In-memory call session manager
│   │   ├── nlp_service.py            # OpenAI-backed NLP (intent + slot extraction)
│   │   ├── services.py               # Business logic (SMS, email, notifications)
│   │   ├── permissions.py            # Custom DRF permissions
│   │   ├── mongodb_service.py        # MongoDB call log operations
│   │   └── migrations/               # Django DB migrations
│   ├── call_ai/                      # Asterisk AGI AI call scripts
│   │   ├── agi_receptionist.py       # Main AGI script
│   │   ├── state_machine.py          # Call state machine
│   │   ├── intent_classifier.py      # Local intent classifier
│   │   ├── stt_whisper.py            # Whisper STT integration
│   │   └── tts_piper.py              # Piper TTS integration
│   ├── hospital_system/              # Django project settings
│   │   ├── settings.py               # Django configuration
│   │   ├── asgi.py                   # ASGI config (Channels)
│   │   └── urls.py                   # Root URL config
│   ├── manage.py                     # Django management script
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # Environment variables
│
├── src/                              # React Frontend
│   ├── components/                   # Reusable components
│   │   ├── CallCard.jsx              # Active call card with transfer button
│   │   ├── LiveCallsWidget.jsx       # Live calls sidebar widget
│   │   ├── Layout.jsx                # Main layout with sidebar
│   │   └── ...                       # Navbar, Sidebar, Modal, etc.
│   ├── pages/                        # Page components
│   │   ├── Dashboard.jsx             # Role-based stats dashboard
│   │   ├── CallConsole.jsx           # Real-time AI call monitoring + simulate/transfer
│   │   ├── CallLogs.jsx              # Historical call logs
│   │   ├── Appointments.jsx          # Appointment management
│   │   ├── Availability.jsx          # Doctor availability schedule
│   │   ├── Analytics.jsx             # Analytics charts
│   │   ├── Ambulance.jsx             # Ambulance request form
│   │   ├── UserManagement.jsx        # User management (Admin)
│   │   ├── DoctorManagement.jsx      # Doctor list
│   │   ├── Settings.jsx              # Site settings - logo, banner (Admin)
│   │   ├── News.jsx                  # Hospital news
│   │   └── Profile.jsx               # User profile
│   ├── services/                     # API services
│   │   ├── api.js                    # Axios API client (ambulanceAPI, callAIAPI, ...)
│   │   └── websocket.js              # WebSocket helpers
│   ├── context/                      # React Context
│   │   ├── AuthContext.jsx           # Authentication state
│   │   └── SocketContext.jsx         # Django Channels WebSocket state
│   ├── hooks/                        # Custom React hooks
│   │   ├── useLiveCalls.js           # Active calls via SocketContext
│   │   └── ...                       # useAppointments, useAuth, etc.
│   ├── routes/                       # Route components
│   │   └── ProtectedRoute.jsx        # Protected route wrapper
│   ├── App.jsx                       # Main app component
│   └── main.jsx                      # Entry point
│
├── package.json                      # Frontend dependencies
├── vite.config.js                    # Vite configuration
├── index.html                        # HTML entry (Google Fonts via <link>)
├── .env                              # Frontend environment variables
└── README.md                         # This file
```

## 🚀 Installation & Setup

### Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm
- **PostgreSQL 14+**
- **MongoDB** (Atlas or local instance)
- **Git**

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "AI Project For Hospital"
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.3 Configure Environment File

The `.env` file is already created in `backend/` directory. Update it with your credentials:

```env
# Update MongoDB URI if using cloud/local MongoDB
MONGODB_URI=mongodb+srv://UserName:PASSWORD@rakavan.v2vzewk.mongodb.net/

# Update PostgreSQL credentials if different
DB_PASSWORD=your_postgres_password

# AI receptionist settings
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
REDIS_URL=redis://127.0.0.1:6379/1
USE_REDIS_CACHE=False

TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TWILIO_VALIDATE_REQUEST=False
HUMAN_RECEPTION_TRANSFER_NUMBER=+94XXXXXXXXX
EMERGENCY_TRANSFER_NUMBER=+94XXXXXXXXX
```

If PostgreSQL is not running locally, this project supports local sqlite quick-start by using:

```env
DB_ENGINE=sqlite
SQLITE_NAME=db.sqlite3
```

#### 2.4 Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### 2.5 Create Superuser (Admin)

**Option 1: Using Management Command (Recommended)**

```bash
python manage.py create_admin
```

This will create a default admin user with:
- **Username**: `admin`
- **Email**: `admin@hospital.com`
- **Password**: `admin123`

You can customize these values:
```bash
python manage.py create_admin --username myadmin --email myadmin@hospital.com --password mypassword
```

**Option 2: Using Django's createsuperuser**

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

**⚠️ Important**: Change the default password after first login!

### Step 3: Frontend Setup

#### 3.1 Install Dependencies

```bash
# From project root
npm install
```

#### 3.2 Environment File

The `.env` file is already created in the root directory with:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://127.0.0.1:8000
```

### Redis and Channels (for WebSocket live call updates)

For local development, the Django Channels layer falls back gracefully when Redis is unavailable — the WebSocket still connects but real-time call events require Redis.

To enable full real-time support:
1. Install Redis locally or use a managed endpoint
2. Set in `backend/.env`: `REDIS_URL=redis://127.0.0.1:6379/1` and `USE_REDIS_CACHE=True`
3. Start the server:

```bash
cd backend
python manage.py runserver
```

For production, run with Daphne/Uvicorn and configure reverse proxy WebSocket forwarding.

The frontend connects to `ws://127.0.0.1:8000/ws/calls/` with a JWT token for real-time call events (`call_started`, `call_ended`, `call_updated`).

### Twilio Webhook Setup

In Twilio console, set Voice webhooks:
- Incoming call: `POST https://<your-domain>/api/twilio/voice/`
- Status callback: `POST https://<your-domain>/api/twilio/status/`

### Step 4: Database Setup

#### PostgreSQL Setup

1. **Install PostgreSQL** (if not installed)
   - Download from: https://www.postgresql.org/download/
   - Install with default settings
   - Remember the postgres user password

2. **Create Database**

   **Option A: Using PowerShell Script (Easiest)**
   ```powershell
   cd backend
   .\setup_database.ps1
   ```

   **Option B: Using SQL File**
   ```powershell
   cd backend
   psql -U postgres -f create_database.sql
   ```
   (Enter password when prompted: `1234` based on your .env file)

   **Option C: Manual SQL Command**
   ```sql
   -- Connect to PostgreSQL
   psql -U postgres
   -- (Enter password: 1234)

   -- Create database
   CREATE DATABASE hospital_db;
   \q
   ```

   **Option D: One-line Command**
   ```powershell
   $env:PGPASSWORD='1234'; psql -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

   **Note**: Replace `1234` with your actual PostgreSQL password if different.

3. **Update .env file** in `backend/` directory:

   ```env
   DB_NAME=hospital_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

#### MongoDB Setup

1. **Option A: MongoDB Atlas (Cloud)** - Recommended

   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Create a database user
   - Get connection string
   - Update `backend/.env`:

   ```env
   MONGODB_URI=mongodb+srv://Username:YOUR_PASSWORD@rakavan.v2vzewk.mongodb.net/
   MONGODB_DB_NAME=hospital_ai_logs
   ```

   Replace `YOUR_PASSWORD` with your actual MongoDB password.

2. **Option B: MongoDB Compass (Local)**

   - Download MongoDB Compass: https://www.mongodb.com/try/download/compass
   - Install and open MongoDB Compass
   - Connect to local MongoDB instance (default: `mongodb://localhost:27017`)
   - Create database: `hospital_ai_logs`
   - Update `backend/.env`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/
   MONGODB_DB_NAME=hospital_ai_logs
   ```

## ⚙️ Configuration

### Backend `.env` File

Located at: `backend/.env`

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database
DB_NAME=hospital_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# MongoDB Connection
MONGODB_URI=mongodb+srv://Username:<db_password>@rakavan.v2vzewk.mongodb.net/
MONGODB_DB_NAME=hospital_ai_logs

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Twilio SMS Settings (Optional - for SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email Settings - SendGrid (Optional - for email notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@hospital.com
EMAIL_FROM_NAME=Hospital System

# File Upload Settings
MEDIA_ROOT=media
MAX_UPLOAD_SIZE=5242880
```

### Frontend `.env` File

Located at: `.env` (project root)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
python manage.py runserver
```

Backend will run on: `http://localhost:8000`

### Start Frontend Server

```bash
# From project root
npm run dev
```

Frontend will run on: `http://localhost:5173` (or similar port)

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

## 🔑 Default Admin Credentials

If you used the `create_admin` management command, use these credentials:

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@hospital.com`

**⚠️ Security Note**: These are default credentials. Please change the password immediately after first login!

### Login Locations:
1. **Frontend Login**: http://localhost:5173/login
2. **Django Admin Panel**: http://localhost:8000/admin

### Troubleshooting Login Issues:

If you can't login:
1. Make sure you've run migrations: `python manage.py migrate`
2. Verify the admin user exists: `python manage.py create_admin`
3. Check PostgreSQL connection (see Database Setup section)
4. Ensure the user status is "Approved" in the database

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register/
Content-Type: multipart/form-data

Body:
- username: string
- email: string
- password: string
- confirm_password: string
- full_name: string
- date_of_birth: date (YYYY-MM-DD)
- phone_number: string
- address: string
- profile_picture: file (optional)
- about_yourself: string (optional)
- role: string (Doctor, Staff, Receptionist, Admin)
- specialization: string (if role=Doctor)
- doctor_id_card: file (if role=Doctor)
- staff_id_card: file (if role=Staff)
- receptionist_id_card: file (if role=Receptionist)
```

#### Login
```
POST /api/auth/login/

Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "access": "jwt_token",
  "refresh": "refresh_token",
  "user": { ... }
}
```

### User Management Endpoints

#### Get All Users (Admin only)
```
GET /api/users/
Authorization: Bearer <token>
```

#### Get Pending Users
```
GET /api/users/pending/
Authorization: Bearer <token>
```

#### Approve/Reject User
```
POST /api/users/{user_id}/approve/
Authorization: Bearer <token>

Body:
{
  "action": "approve" | "reject" | "disable"
}
```

### Appointment Endpoints

#### Create Appointment
```
POST /api/appointments/
Authorization: Bearer <token>

Body:
{
  "patient_name": "string",
  "patient_age": integer,
  "patient_disease": "string",
  "contact_number": "string",
  "address": "string",
  "doctor": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM:SS"
}
```

#### Get Appointments
```
GET /api/appointments/
Authorization: Bearer <token>
```

#### Accept Appointment (Doctor only)
```
POST /api/appointments/{id}/accept/
Authorization: Bearer <token>
```

### Dashboard Endpoint

```
GET /api/dashboard/
Authorization: Bearer <token>

Response (Admin):
{
  "total_doctors": integer,
  "total_patients": integer,
  "total_appointments": integer,
  "completed_appointments": integer,
  "pending_appointments": integer,
  "cancelled_appointments": integer,
  "today_appointments": integer,
  "pending_users": integer,
  "total_staff": integer,
  "total_calls": integer,
  "avg_call_duration": number,
  "staff_breakdown": { "Doctor": n, "Receptionist": n, "Staff": n },
  "recent_calls": [...]
}
```

### Call Logs Endpoint

```
GET /api/call-logs/
Authorization: Bearer <token>
Query Params: limit, skip
```

### Ambulance Endpoints

```
POST /api/ambulance/
# No auth required
Body: { patient_name, contact_number, pickup_location, condition? }

GET /api/ambulance/
Authorization: Bearer <token>

PATCH /api/ambulance/<uuid>/
Authorization: Bearer <token>
Body: { status: "pending" | "dispatched" | "en_route" | "completed" }
```

### Call AI Endpoints

```
POST /api/call-ai/intake/
# Submit structured call reception request from AI call
Authorization: Bearer <token> or AllowAny (configured)
Body: { caller_number, intent, details, ... }

GET /api/call-ai/requests/
Authorization: Bearer <token>
Query Params: status, intent, limit

GET /api/call-ai/vocabulary/
Authorization: Bearer <token>
```

### Twilio / Live Call Endpoints

```
POST /api/twilio/voice/         # Twilio inbound call webhook
POST /api/twilio/gather/        # Twilio speech gather webhook
POST /api/twilio/status/        # Twilio call status callback

POST /api/twilio/simulate/
Authorization: Bearer <token>
Body: { caller?: "string" }     # Simulate incoming call (local testing)

GET /api/live-calls/
Authorization: Bearer <token>   # Snapshot of currently active calls

POST /api/calls/<call_sid>/transfer/
Authorization: Bearer <token>   # Transfer call to human agent
```

### Site Settings (Logo, Banner)

```
GET /api/site-settings/
Authorization: Bearer <token>
Returns: { site_name, logo_url, banner_url, ... }

PATCH /api/site-settings/update/
Authorization: Bearer <token> (Admin only)
Content-Type: multipart/form-data
Body: site_name (optional), logo (file), banner (file)
```

### Hospital News

```
GET /api/hospital-news/list/
Authorization: Bearer <token>

POST /api/hospital-news/create/
Authorization: Bearer <token> (Admin only)
Body: { title, content, send_email_to_all?: boolean }

DELETE /api/hospital-news/<uuid>/delete/
Authorization: Bearer <token> (Admin only)
```

### Send Message to User (Email)

```
POST /api/send-message/
Authorization: Bearer <token> (Admin only)
Body: { user_id: uuid, subject: string, message: string }
Or: { email: string, subject: string, message: string }
```

## 👥 User Roles & Permissions

### Admin
- Full system access
- Approve/reject/disable user registrations
- Manage all users
- Create and manage appointments
- View all call logs and analytics dashboard
- Send hospital news to all users
- Manage ambulance request statuses
- Simulate incoming AI calls and transfer to human

### Doctor
- View own appointments
- Accept or reject appointments
- Update availability schedule
- View own profile
- Cannot create appointments

### Receptionist
- Create and edit appointments (up to one day before)
- View all appointments
- Monitor live AI calls via CallConsole
- View call logs
- View doctors and patients
- Cannot approve users

### Staff / Nurse
- View own profile
- View hospital news
- Limited access (read-only for most features)

## 🗄️ Database Schema

### PostgreSQL Tables

#### users
- `id` (UUID, Primary Key)
- `username` (String, Unique)
- `email` (String, Unique)
- `password` (Hashed)
- `full_name` (String)
- `date_of_birth` (Date)
- `phone_number` (String)
- `address` (Text)
- `profile_picture` (Image)
- `about_yourself` (Text)
- `role` (String: Admin, Doctor, Staff, Receptionist)
- `status` (String: Pending, Approved, Rejected, Disabled)
- `date_joined` (DateTime)
- `updated_at` (DateTime)

#### doctors
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `doctor_id_card` (Image)
- `specialization` (String)

#### appointments
- `id` (UUID, Primary Key)
- `patient_name` (String)
- `patient_age` (Integer)
- `patient_disease` (Text)
- `contact_number` (String)
- `address` (Text)
- `doctor_id` (Foreign Key → doctors)
- `appointment_date` (Date)
- `appointment_time` (Time)
- `booking_time` (DateTime)
- `status` (String: Pending, Confirmed, Cancelled, Completed)
- `created_by` (Foreign Key → users)

#### ambulance_requests
- `id` (UUID, Primary Key)
- `patient_name` (String)
- `contact_number` (String)
- `pickup_location` (Text)
- `condition` (Text, optional)
- `status` (String: pending, dispatched, en_route, completed)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### MongoDB Collections

#### call_logs
```json
{
  "caller_number": "string",
  "intent": "string",
  "response": "string",
  "duration": "number",
  "status": "string",
  "timestamp": "datetime"
}
```

#### notifications
```json
{
  "user_id": "string",
  "notification_type": "string",
  "title": "string",
  "message": "string",
  "metadata": "object",
  "read": "boolean",
  "timestamp": "datetime"
}
```

#### ai_interactions
```json
{
  "user_id": "string",
  "interaction_type": "string",
  "input_data": "object",
  "output_data": "object",
  "metadata": "object",
  "timestamp": "datetime"
}
```

## 🚀 Deployment

### Backend Deployment

1. **Set Environment Variables**
   - Set `DEBUG=False`
   - Update `ALLOWED_HOSTS` with your domain
   - Use production database credentials
   - Set secure `SECRET_KEY`

2. **Collect Static Files**
   ```bash
   python manage.py collectstatic
   ```

3. **Deploy to platforms like:**
   - Heroku
   - AWS Elastic Beanstalk
   - DigitalOcean App Platform
   - Railway

### Frontend Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy to:**
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - GitHub Pages

3. **Update API URL**
   - Update `VITE_API_BASE_URL` in production environment

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database users
- Enable HTTPS in production
- Regularly update dependencies
- Use environment variables for all secrets
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs

## 📝 Sample API Requests

### Register a Doctor

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -F "username=drjohn" \
  -F "email=drjohn@hospital.com" \
  -F "password=SecurePass123" \
  -F "confirm_password=SecurePass123" \
  -F "full_name=Dr. John Smith" \
  -F "date_of_birth=1980-01-15" \
  -F "phone_number=+1234567890" \
  -F "address=123 Medical St" \
  -F "role=Doctor" \
  -F "specialization=Cardiology" \
  -F "doctor_id_card=@/path/to/id_card.jpg" \
  -F "profile_picture=@/path/to/profile.jpg"
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "drjohn",
    "password": "SecurePass123"
  }'
```

### Create Appointment

```bash
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Jane Doe",
    "patient_age": 35,
    "patient_disease": "Regular checkup",
    "contact_number": "+1234567890",
    "address": "456 Patient Ave",
    "doctor": "<doctor_uuid>",
    "appointment_date": "2024-02-25",
    "appointment_time": "10:00:00"
  }'
```

## 🐛 Troubleshooting

### ⚠️ CRITICAL: Database Migration Issues

**If you see errors like:**
- `relation "users" does not exist`
- `null value in column "name" of relation "django_content_type"`
- `No migrations to apply` but tables don't exist

**This means the database is corrupted. RESET IT:**

#### Quick Fix (pgAdmin - Recommended):

1. **Open pgAdmin**
2. **Right-click `hospital_db`** → **Delete/Drop** (check "Cascade")
3. **Right-click "Databases"** → **Create** → **Database**
4. **Name**: `hospital_db` → **Save**
5. **Run migrations**:
   ```bash
   cd backend
   python manage.py migrate
   python manage.py create_admin
   ```

#### Alternative Fix (Python Script):

```bash
cd backend
python fix_migrations.py
# Type 'yes' when prompted
python manage.py migrate
python manage.py create_admin
```

**See `backend/QUICK_FIX.md` for detailed instructions.**

---

### Backend Issues

1. **PostgreSQL Database Does Not Exist**

   **Error**: `django.db.utils.OperationalError: database "hospital_db" does not exist`

   **Quick Fix - Use pgAdmin (Easiest)**:
   1. Open **pgAdmin** (installed with PostgreSQL)
   2. Connect to PostgreSQL server (password: check your `.env` file, default might be `1234`)
   3. Right-click **"Databases"** → **Create** → **Database**
   4. Name: `hospital_db`
   5. Click **Save**

   **Alternative - Command Line**:
   ```powershell
   # If psql is in PATH
   $env:PGPASSWORD='1234'  # Use your actual password
   psql -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

   **Or find psql.exe** (usually in `C:\Program Files\PostgreSQL\<version>\bin\`):
   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

   See `backend/CREATE_DATABASE_GUIDE.md` for detailed instructions.

2. **PostgreSQL Connection Error - "password authentication failed"**

   **Error**: `psycopg2.OperationalError: password authentication failed for user "postgres"`

   **Solutions**:
   
   **Option A: Update .env with correct password**
   ```bash
   # Edit backend/.env file
   DB_PASSWORD=your_actual_postgres_password
   ```
   
   **Option B: Reset PostgreSQL password**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Change password
   ALTER USER postgres WITH PASSWORD 'postgres';
   ```
   
   **Option C: Create a new PostgreSQL user**
   ```sql
   CREATE USER hospital_user WITH PASSWORD 'your_password';
   CREATE DATABASE hospital_db OWNER hospital_user;
   GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_user;
   ```
   
   Then update `backend/.env`:
   ```env
   DB_USER=hospital_user
   DB_PASSWORD=your_password
   ```

2. **Database Connection Error**
   - Check PostgreSQL is running: `pg_isready` or check Windows Services
   - Verify database credentials in `.env`
   - Ensure database exists: `psql -U postgres -l` (list databases)
   - Check PostgreSQL is listening on port 5432

3. **MongoDB Connection Error**
   - Verify MongoDB URI in `.env`
   - Replace `<db_password>` with actual password
   - Check network connectivity (for Atlas)
   - Ensure database user has proper permissions
   - Test connection: `mongosh "your_connection_string"`

4. **Migration Errors**
   - Delete migration files and recreate: `python manage.py makemigrations`
   - Reset database if needed (development only)
   - Ensure PostgreSQL is running before migrations

5. **Admin User Creation Issues**
   - Run: `python manage.py create_admin`
   - If user exists, delete and recreate: `python manage.py shell` then `User.objects.filter(username='admin').delete()`
   - Check user status is "Approved" in database

### Frontend Issues

1. **API Connection Error**
   - Verify backend is running on http://localhost:8000
   - Check `VITE_API_BASE_URL` in `.env`
   - Check CORS settings in backend
   - Check browser console for CORS errors

2. **Login Page Issues**
   - "Forgot Password" and "Can't access your account?" links are now removed (not implemented)
   - Use "Sign Up Here" link to register new accounts
   - Admin must approve new registrations before login

3. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version (18+)
   - Delete `package-lock.json` and reinstall if needed

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Check Django and React logs

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ for modern healthcare management**
