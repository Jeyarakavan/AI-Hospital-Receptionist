# Group 3 — Team Contribution Summary
**Project:** AI Hospital Receptionist System  
**Total Duration:** 8 Weeks

---

## Team Members & Individual Functions

| SA Number | Name | Individual Function | CRUD 1 | CRUD 2 |
|-----------|------|---------------------|--------|--------|
| SA24100138 | J. Jeyarakavan | User Authentication & User Management | User Account CRUD | Admin Approval Workflow CRUD |
| SA24610554 | M. Kowshigan | Appointment Management (Patient Booking) | Appointment Booking CRUD | Patient Records CRUD |
| SA24610839 | N. Jathursha | Doctor Management & Availability Scheduling | Doctor Profile CRUD | Availability Slots CRUD |
| SA24610619 | N. Kajana | AI Call System & Staff Management | Call Log CRUD | Staff Record CRUD |
| SA24610524 | V. Sanjeev | Dashboard, Analytics, Emergency/Ambulance, Chat & News | Ambulance Request CRUD | Hospital News CRUD |

---

## Week-Wise Work Distribution

| Week | SA24100138 Jeyarakavan | SA24610554 Kowshigan | SA24610839 Jathursha | SA24610619 Kajana | SA24610524 Sanjeev |
|------|------------------------|----------------------|----------------------|-------------------|-------------------|
| **1** | Project setup; auth flow planning | Project setup; appointment requirements | Project setup; doctor scheduling research | Project setup; call system research | Project setup; dashboard/emergency scoping |
| **2** | `User` model, `UserManager`, migrations | `Appointment` + `Patient` models, migrations | `Doctor` + `DoctorAvailability` models, migrations | `Staff` + `Receptionist` models, Channels routing | `Ambulance` + `ChatMessage` models, migrations |
| **3** | `AuthViewSet`, `UserViewSet`, JWT serializers | `AppointmentViewSet`, `PatientViewSet`, serializers | `DoctorViewSet`, `DoctorAvailabilityViewSet`, serializers | `twilio_views`, `call_ai_views`, `call_logs`, `staff_list` | `dashboard_stats`, `AmbulanceViewSet`, news/chat views |
| **4** | `Login.jsx`, `Signup.jsx`, `AuthContext.jsx` | `Appointments.jsx` layout, calendar view, `useAppointments.js` | `DoctorManagement.jsx` base, React Query setup | STT/TTS/intent classifier (`stt_whisper`, `tts_piper`, `intent_classifier`) | `Dashboard.jsx` KPIs, `Analytics.jsx` charts |
| **5** | `UserManagement.jsx` — full CRUD table | Booking form modal, Create/Read operations | "Add Doctor" modal, doctor list with filters | `CallConsole.jsx`, `LiveCallsWidget.jsx`, WebSocket | `Ambulance.jsx` form + status board, `EmergencyAlert.jsx` |
| **6** | `Profile.jsx`, `AdminUserRegistration.jsx`, `AdminManage.jsx` | Update/Delete, status buttons, `AppointmentCard.jsx` | `Availability.jsx` — weekly timetable grid, slot CRUD | `CallLogs.jsx`, `StaffManagement.jsx` full CRUD | `Chat.jsx` real-time messaging, `News.jsx` CRUD |
| **7** | JWT polish, `ProtectedRoute.jsx`, Navbar role menus | Calendar ↔ list sync, patient lookup, filters | Availability → appointment booking integration, slot UI polish | `state_machine.py`, `agi_receptionist.py`, WebSocket broadcast | `Settings.jsx`, `SocketContext.jsx`, `EmergencyAlert` global integration |
| **8** | Auth endpoint tests, form validation fixes | Appointment CRUD E2E tests, timezone fix | Doctor/availability tests, cascade delete fix | Twilio webhook tests, WebSocket disconnect fix | Ambulance/news tests, dashboard refresh fix |

---

## Technology Stack (Shared)

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Server State | React Query (TanStack Query) |
| Forms | React Hook Form |
| Backend Framework | Django 4 + Django REST Framework |
| Authentication | JWT (SimpleJWT) |
| Real-time | Django Channels + WebSocket |
| Telephony / AI Calls | Twilio Programmable Voice + Whisper STT + Piper TTS |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL |
| Build Tool | Vite + esbuild |

---

## Evaluation Coverage (Per Member)

| Criteria | Jeyarakavan | Kowshigan | Jathursha | Kajana | Sanjeev |
|----------|-------------|-----------|-----------|--------|---------|
| **2 CRUD operations (20 marks)** | User CRUD + Approval CRUD | Appointment CRUD + Patient CRUD | Doctor CRUD + Availability CRUD | Call Log CRUD + Staff CRUD | Ambulance CRUD + News CRUD |
| **Database connectivity (20 marks)** | `users` table, JWT auth | `appointments` + `patients` tables | `doctors` + `doctor_availability` tables | `staff`/`receptionists` tables + call session | `ambulance` + `chat_messages` tables |
| **UI/UX designs (20 marks)** | Login, Signup, Profile, UserManagement, AdminManage | Appointments (calendar+list), AppointmentCard | DoctorManagement, Availability timetable | CallConsole, CallLogs, StaffManagement | Dashboard, Analytics, Ambulance, Chat, News, Settings |
| **50% completeness (10 marks)** | All 6 screens + auth API complete | All appointment + patient screens complete | All doctor + availability screens complete | Call AI pipeline + console + staff CRUD complete | All 6 screens + backend views complete |

---

## File Reference Map

```
backend/
  api/
    models.py           ← All 5 members contributed models
    views.py            ← All 5 members contributed ViewSets/views
    serializers.py      ← All 5 members contributed serializers
    urls.py             ← Shared URL routing
    twilio_views.py     ← SA24610619 Kajana
    call_ai_views.py    ← SA24610619 Kajana
    consumers.py        ← SA24610619 Kajana (WebSocket)
    permissions.py      ← SA24100138 Jeyarakavan
  call_ai/
    agi_receptionist.py ← SA24610619 Kajana
    intent_classifier.py← SA24610619 Kajana
    slot_extractor.py   ← SA24610619 Kajana
    state_machine.py    ← SA24610619 Kajana
    stt_whisper.py      ← SA24610619 Kajana
    tts_piper.py        ← SA24610619 Kajana

src/
  pages/
    Login.jsx           ← SA24100138 Jeyarakavan
    Signup.jsx          ← SA24100138 Jeyarakavan
    Profile.jsx         ← SA24100138 Jeyarakavan
    UserManagement.jsx  ← SA24100138 Jeyarakavan
    AdminManage.jsx     ← SA24100138 Jeyarakavan
    AdminUserRegistration.jsx ← SA24100138 Jeyarakavan
    Appointments.jsx    ← SA24610554 Kowshigan
    DoctorManagement.jsx← SA24610839 Jathursha
    Availability.jsx    ← SA24610839 Jathursha
    CallConsole.jsx     ← SA24610619 Kajana
    CallLogs.jsx        ← SA24610619 Kajana
    StaffManagement.jsx ← SA24610619 Kajana
    Dashboard.jsx       ← SA24610524 Sanjeev
    Analytics.jsx       ← SA24610524 Sanjeev
    Ambulance.jsx       ← SA24610524 Sanjeev
    Chat.jsx            ← SA24610524 Sanjeev
    News.jsx            ← SA24610524 Sanjeev
    Settings.jsx        ← SA24610524 Sanjeev
  components/
    AppointmentCard.jsx ← SA24610554 Kowshigan
    LiveCallsWidget.jsx ← SA24610619 Kajana
    EmergencyAlert.jsx  ← SA24610524 Sanjeev
    Navbar.jsx          ← SA24100138 Jeyarakavan
    Layout.jsx          ← SA24610524 Sanjeev
  hooks/
    useAuth.js          ← SA24100138 Jeyarakavan
    useAppointments.js  ← SA24610554 Kowshigan
    useLiveCalls.js     ← SA24610619 Kajana
  context/
    AuthContext.jsx     ← SA24100138 Jeyarakavan
    SocketContext.jsx   ← SA24610524 Sanjeev
```
