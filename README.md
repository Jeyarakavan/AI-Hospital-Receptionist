# 🏥 AI Hospital Receptionist System v1.0

A professional, feature-rich hospital management system with AI-powered appointment booking, call handling, and comprehensive staff management. Built with modern technologies and medical-grade design standards.

## ✨ Key Features

### 🎯 Core Features
- **AI Receptionist Bot** - Automated appointment booking via voice/chat
- **Call Management** - Track, transfer, and record phone calls
- **Appointment Booking** - Real-time appointment scheduling with doctor assignment
- **Staff Management** - Unified management for doctors, nurses, receptionists, and other staff
- **Role-Based Dashboard** - Customized views for different staff types
- **Emergency Ambulance** - Quick ambulance booking system
- **Real-time Updates** - Socket.IO powered live notifications

### 🏥 Professional Features
- **Hospital Branding** - Customize hospital logo, name, and banner images
- **Staff Registration** - Auto-generate secure login credentials for new staff
- **Professional UI** - Medical-grade color palette and responsive design
- **Multiple Staff Types** - Doctors, Nurses, Receptionists, Paramedics, Technicians, Admin
- **Comprehensive Profiles** - Professional details (NIC, License, Specialization, etc.)

### 🔐 Authentication & Security
- **Multi-Tab Login** - Demo, Staff Login, Email/Password, Google OAuth
- **Password Hashing** - SHA-256 password hashing for credentials
- **Role-Based Access** - Admin-only features protected by role
- **Demo Mode** - Test system without external service configuration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Create .env file (if not exists)
echo "VITE_API_BASE_URL=http://localhost:4000" > .env
```

### Running the System

**Terminal 1 - Backend**
```bash
cd server && node index.js
# Runs on http://localhost:4000
```

**Terminal 2 - Frontend**
```bash
npm run dev
# Runs on http://localhost:5175
```

---

## 📋 Default Login Credentials

### Demo Login (No credentials needed)
- Choose: Receptionist, Doctor, or Admin

### Staff Login
**Admin Account**
- Username: `admin`
- Password: `admin123`

**Sample Staff Accounts**
- **Doctor**: alice / alice123
- **Doctor**: bob / bob123
- **Nurse**: sarah / sarah123
- **Receptionist**: emma / emma123

---

## 👥 Staff Types & Dashboards

### 👨‍⚕️ Doctor
- View today's appointments
- Patient management
- Appointment acceptance
- Schedule tracking

### 👩‍⚕️ Nurse
- Daily care tasks
- Patient tracking
- Task completion
- Care activity logging

### 📞 Receptionist
- Appointment booking
- Call monitoring
- Call transfers
- Confirmation management

### ⚙️ Admin
- System statistics
- Staff management
- Hospital branding
- System settings

---

## 🎨 Admin Features

### Hospital Branding Panel
Access: **Dashboard → Admin (Settings)**

Customize:
- **Hospital Name** - Display across system
- **Logo** - Upload PNG/JPG (200x200px recommended)
- **Banner** - Login page background (1920x1080px recommended)
- **Primary Color** - Main theme color
- **Secondary Color** - Accent color

### Staff Management
Access: **Dashboard → Staff Management (Admin only)**

Register new staff with:
- Professional information (name, email, phone)
- Staff type (Doctor, Nurse, Receptionist, etc.)
- Department & designation
- Professional license details
- Auto-generated login credentials

---

## 🗄️ Database

### Tables
1. **staff** - All staff members with professional details
2. **staff_credentials** - Login credentials with password hashing
3. **appointments** - Patient appointments
4. **calls** - Phone call records
5. **doctors** - Legacy compatibility table

---

## 📱 Routes

| Route | Authorization | Purpose |
|-------|---|---|
| `/login` | Public | Multi-tab login |
| `/` | Protected | Role-based dashboard |
| `/appointments` | Protected | Appointment management |
| `/calls` | Protected | Call console |
| `/staff` | Admin | Staff management |
| `/admin` | Admin | Hospital settings |
| `/profile` | Protected | User profile |
| `/ambulance` | Protected | Emergency booking |

---

## 🎨 Design System

### Colors
- **Primary**: #0ea5a4 (Teal)
- **Secondary**: #0369a1 (Dark Blue)
- **Health Green**: #10b981
- **Warning Red**: #dc2626

### Animations
- Page transitions (slideInLeft, slideInRight)
- Content fade-in
- Floating elements
- Pulsing indicators
- Interactive scale effects

### Responsive
- Mobile-first design
- Tablet & desktop optimized
- Touch-friendly interface

---

## 🔧 Technology Stack

**Frontend**: Vite, React 18, Tailwind, React Router, Lucide Icons, Socket.IO Client

**Backend**: Express, Socket.IO, Knex, SQLite/PostgreSQL, SendGrid, Twilio

**DevOps**: Docker, Vercel, Render

---

## 📦 Configuration

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
```

### Backend `.env`
```
PORT=4000
DATABASE_URL=postgresql://...
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
```

---

## 🚀 Production Deployment

**Frontend**: Push to GitHub → Deploy on Vercel

**Backend**: Deploy on Render, set environment variables

**Database**: Use PostgreSQL in production (config via `DATABASE_URL`)

---

## 📞 Support

**Admin Email**: admin@hospital.com  
**Admin Username**: admin  
**Admin Password**: admin123

---

**Built with ❤️ for modern hospitals**


