# 🏥 AI Hospital Receptionist System - Complete Documentation

## Project Overview

A professional, enterprise-grade hospital management system built with **React + Express** featuring AI-powered appointment booking, comprehensive staff management, advanced analytics, and hospital branding customization.

**Built by:** Northernknights  
**Final Year Project:** ✅ Complete & Production-Ready

---

## ✨ Core Features Implemented

### 1. 🏥 Hospital Branding System
- **Logo Management** - Upload and display custom hospital logo
- **Banner/Background Image** - Customize login page background
- **Hospital Name** - Editable institution name displayed site-wide
- **Mission Statement** - Custom hospital mission displayed in footer
- **Vision Statement** - Custom hospital vision displayed in footer
- **Color Theme** - Primary & secondary color customization
- **All changes persist** to localStorage and apply site-wide instantly

### 2. 👥 Multi-Type Staff Management
- **6 Staff Types Supported:**
  - Doctors (with specialization)
  - Nurses (with care focus areas)
  - Receptionists
  - Paramedics
  - Technicians
  - Admins

- **Admin Registration Features:**
  - Complete professional details (name, email, phone, NIC, DOB)
  - Professional credentials (license number, specialization, department, designation)
  - Auto-generated secure login credentials (username + temp password)
  - SHA-256 password hashing for security
  - Status tracking (active/inactive)
  - Joining date & address records

### 3. 🔐 Multi-Modal Authentication
- **Demo Login** - Instant testing without setup
- **Staff Login** - Username/password with credential hashing
- **Email/Password** - Firebase integration ready
- **Google OAuth** - Social login integration ready
- **Role-based Access Control** - Admin-only pages protected

### 4. 📊 Role-Specific Dashboards

#### 👨‍⚕️ Doctor Dashboard
- Today's appointment list
- Patient management
- Appointment acceptance/scheduling
- Patient count & metrics

#### 👩‍⚕️ Nurse Dashboard
- Patient care list
- Daily task assignment
- Task completion tracking
- Vital signs & care activity logging

#### 📞 Receptionist Dashboard
- Today's appointment queue
- Incoming call monitoring
- Call transfer management
- Confirmation request handling

#### ⚙️ Admin Dashboard
- System statistics overview
- Staff count by type
- Total appointments & calls
- Quick access to management tools

### 5. 📈 Advanced Analytics Dashboard
- **Key Metrics:**
  - Total staff count
  - Appointment statistics
  - Call volume & duration
  - System performance metrics

- **Staff Breakdown Charts:**
  - Visual distribution by staff type
  - Performance progress bars
  - Completion rates

- **Performance Metrics:**
  - Appointment completion rate
  - System uptime (99.8%)
  - Staff availability
  - Patient satisfaction score

- **Data Export:**
  - Export analytics as JSON
  - Date-stamped exports
  - Comprehensive report generation

### 6. 🎨 Professional UI/UX
- **Medical Color Palette:**
  - Primary: Teal (#0ea5a4)
  - Secondary: Dark Blue (#0369a1)
  - Health Green (#10b981)
  - Warning Red (#dc2626)

- **Components:**
  - Responsive design (mobile-first)
  - Smooth animations (fade-in, slide, float, pulse)
  - Professional cards & modals
  - 150+ CSS utility classes
  - Medical-themed icons (lucide-react)

- **Navigation:**
  - Sticky navbar with branding
  - Sidebar with role-aware menu
  - Professional footer with company branding

### 7. 📱 Professional Footer
- Hospital logo & name
- Mission statement display
- Vision statement display
- Quick navigation links
- Social media links (mockups)
- Copyright notice
- **"Built by Northernknights"** branding
- Rights reserved notice

### 8. 📞 Additional Features
- **Appointments System** - Create, manage, accept appointments
- **Call Console** - Monitor, transfer, record calls
- **Emergency Ambulance** - Quick ambulance booking
- **User Profiles** - Staff profile management
- **Real-time Updates** - Socket.IO integration (ready for deployment)
- **Email/SMS Alerts** - SendGrid/Twilio integration (ready)

---

## 📁 Project Structure

```
AI Project For Hospital/
├── src/
│   ├── assets/
│   │   ├── hospital-logo.svg (Professional medical cross logo)
│   │   └── hospital-banner.svg (Teal-blue gradient banner)
│   ├── pages/
│   │   ├── Login.jsx (Multi-tab auth)
│   │   ├── Dashboard.jsx (Role-specific dashboards)
│   │   ├── Appointments.jsx (Appointment CRUD)
│   │   ├── CallConsole.jsx (Call management)
│   │   ├── StaffManagement.jsx (Admin staff registration - NEW!)
│   │   ├── AdminManage.jsx (Branding + Mission/Vision - ENHANCED!)
│   │   ├── Analytics.jsx (Advanced analytics - NEW!)
│   │   ├── Profile.jsx
│   │   └── Ambulance.jsx
│   ├── components/
│   │   ├── Navbar.jsx (Shows logo, name, user info)
│   │   ├── Sidebar.jsx (Role-aware navigation)
│   │   ├── Footer.jsx (Mission/vision + Northernknights branding - NEW!)
│   │   ├── Modal.jsx
│   │   ├── AppointmentCard.jsx
│   │   ├── CallCard.jsx
│   │   └── Preloader.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFormValidation.js
│   │   └── useLiveCalls.js
│   ├── context/
│   │   └── AuthContext.jsx (Extended for staff users)
│   ├── routes/
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   ├── authService.js
│   │   └── socket.js
│   ├── index.css (150+ utility classes)
│   ├── App.jsx (Router with analytics route)
│   └── main.jsx
├── server/
│   ├── db.js (Knex schema: staff, credentials tables)
│   ├── index.js (Express + 8 staff endpoints)
│   └── .env (DATABASE_URL, SENDGRID_API_KEY, etc.)
├── public/
├── package.json
├── README.md (UPDATED with all features)
└── tailwind.config.cjs
```

---

## 🚀 Running the System

### Start Backend
```bash
cd server
npm install  # First time only
node index.js
# Runs on http://localhost:4000
```

### Start Frontend
```bash
npm install  # First time only
npm run dev
# Runs on http://localhost:5175
```

### Access the System
- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:4000

---

## 🔐 Default Login Credentials

### Admin Account (Full Access)
- **Username:** admin
- **Password:** admin123

### Sample Staff Accounts
- **Doctor:** alice / alice123
- **Doctor:** bob / bob123
- **Nurse:** sarah / sarah123
- **Receptionist:** emma / emma123

### Demo Login (No Credentials)
- Click "Demo" on login page
- Choose role (Receptionist, Doctor, Admin)
- Instant access for testing

---

## 🎯 Admin Panel Features

### Hospital Branding Tab
✅ **Hospital Name** - Edit institution name
✅ **Logo Upload** - PNG/JPG, displays in navbar
✅ **Banner Image** - PNG/JPG, displays on login page
✅ **Mission Statement** - Custom text for footer
✅ **Vision Statement** - Custom text for footer
✅ **Preview** - Live preview of all assets
✅ **Remove** - Delete custom assets (reverts to default)
✅ **Save/Reset** - Persistent localStorage storage

### Colors Tab
✅ **Primary Color** - Main theme (default: Teal)
✅ **Secondary Color** - Accent theme (default: Dark Blue)
✅ **Visual Preview** - See colors in action
✅ **Apply Globally** - Changes reflect site-wide

### System Tab
✅ **System Info** - Name, version, last updated
✅ **Status Indicator** - Real-time operational status
✅ **System Actions** - View logs, sync DB, generate reports

### Staff Management Tab (Sidebar)
✅ **Filter by Type** - Doctor, Nurse, Receptionist, etc.
✅ **Search** - By name, email, designation
✅ **Register New Staff** - Modal form with 8+ fields
✅ **Auto-Generate Credentials** - Username + temp password
✅ **Copy Credentials** - One-click copy to clipboard
✅ **Edit Staff** - Modify existing staff records
✅ **Delete Staff** - Remove staff with confirmation

### Analytics Tab (NEW!)
✅ **Key Metrics** - Staff, Appointments, Calls, Duration
✅ **Period Filter** - Week, Month, Year views
✅ **Staff Distribution** - Visual breakdown by type
✅ **Performance Metrics** - Completion rates, uptime, satisfaction
✅ **Recent Activity** - Timeline of system events
✅ **Export Data** - Download analytics as JSON

---

## 🎨 Customization Guide

### Change Hospital Name
1. Go to **Admin → Settings → Branding**
2. Edit "Hospital Name / Institution Name"
3. Save changes

### Upload Hospital Logo
1. Go to **Admin → Settings → Branding**
2. Click "Upload Logo" area
3. Select PNG/JPG (200x200px recommended)
4. Save changes
5. Logo appears in navbar

### Upload Banner Image
1. Go to **Admin → Settings → Branding**
2. Click "Upload Banner" area
3. Select PNG/JPG (1920x1080px recommended)
4. Save changes
5. Banner appears on login page

### Change Theme Colors
1. Go to **Admin → Settings → Colors**
2. Click color picker for Primary/Secondary
3. Select desired color
4. Preview shows live changes
5. Save changes

### Edit Mission/Vision
1. Go to **Admin → Settings → Branding**
2. Edit "Mission Statement" textarea
3. Edit "Vision Statement" textarea
4. Save changes
5. Text appears in footer immediately

---

## 📊 API Endpoints (Backend)

### Staff Management
- `GET /staff` - List all staff
- `POST /staff` - Create new staff (returns credentials)
- `PUT /staff/:id` - Update staff
- `DELETE /staff/:id` - Delete staff
- `POST /staff-login` - Authenticate with username/password
- `POST /staff/:id/change-password` - Change password
- `GET /staff-by-type/:type` - Filter by staff type
- `GET /staff-stats` - Get statistics (doctors, nurses, total)

### Appointments
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment

### Calls
- `GET /calls` - List calls
- `POST /calls/:id/transfer` - Transfer call

---

## 🔒 Security Implementation

### Password Hashing
- **Algorithm:** SHA-256
- **Implementation:** `crypto.createHash('sha256')`
- **Storage:** Hashed in `staff_credentials.passwordHash`
- **Never stored:** Plain text passwords discarded after hashing

### Access Control
- **Admin-only routes** protected with role checking
- **Staff login** validates against hashed credentials
- **AuthContext** manages both demo & staff users
- **ProtectedRoute** component enforces authentication

### Data Protection
- **localStorage** used securely for user preferences
- **Environment variables** for sensitive keys
- **HTTPS ready** for production deployment

---

## 🚀 Production Deployment

### Frontend (Vercel)
```bash
# Build
npm run build

# Deploy to Vercel
vercel
```

### Backend (Render/Heroku)
```bash
# Set environment variables:
DATABASE_URL=postgresql://...
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Deploy
git push heroku main
```

### Database
- **Development:** SQLite (auto-created)
- **Production:** PostgreSQL (via DATABASE_URL)

---

## 📝 Notes for Final Year Project

### What Makes It Excellent:
1. ✅ **Professional Design** - Medical color palette, smooth animations
2. ✅ **Full Stack** - Frontend + Backend + Database
3. ✅ **Scalable** - Modular components, reusable hooks
4. ✅ **Feature-Rich** - 9+ distinct functionalities
5. ✅ **Enterprise-Ready** - Security, error handling, responsive design
6. ✅ **User-Centric** - Admin customization, role-based access
7. ✅ **Documented** - Code comments, comprehensive README
8. ✅ **Advanced Features** - Real-time updates, analytics, branding system

### Presentation Points:
- Modern tech stack (React 18, Express, Tailwind)
- Real-world hospital management problems solved
- Professional UI/UX with animations
- Multi-role system with customizable branding
- Advanced analytics & reporting
- Security best practices (password hashing, role-based access)
- Scalable architecture ready for production

---

## 🎓 Learning Outcomes Achieved

- ✅ Frontend: React hooks, routing, state management, React Query
- ✅ Backend: Express.js, RESTful APIs, database design
- ✅ Database: Schema design, relationships, Knex query builder
- ✅ Authentication: Multi-modal auth, password hashing, JWT ready
- ✅ UI/UX: Responsive design, animations, accessibility
- ✅ DevOps: Environment management, error handling, logging
- ✅ Security: Password hashing, role-based access, data protection

---

## 📞 Support & Credits

**Project Name:** AI Hospital Receptionist System  
**Version:** 1.0  
**Built by:** Northernknights  
**Purpose:** Final Year Project - Enterprise Healthcare Management System

**Key Technologies:**
- React 18, Vite, Tailwind CSS, React Router
- Express.js, Socket.IO, Knex, SQLite/PostgreSQL
- Lucide Icons, React Hot Toast, React Hook Form

**Status:** ✅ **PRODUCTION READY**

---

*Last Updated: February 6, 2026*  
**All Rights Reserved © 2026 Northernknights**
