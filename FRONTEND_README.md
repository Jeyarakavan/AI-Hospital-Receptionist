# Frontend README

## Project
AI Hospital Receptionist Frontend

## Purpose
This frontend is the user interface for the AI Hospital Receptionist system. It provides role-based dashboards, appointment workflows, call monitoring, call logs, user management, and live real-time updates from the backend.

## Frontend Stack
- React (Vite)
- Material UI
- React Router
- Axios
- React Toastify
- WebSocket client for live calls

## Main Frontend Areas
- Authentication pages: login and signup
- Dashboard: role-based stats and activity
- Appointments: appointment workflows
- Availability: doctor availability management
- Call Logs: call history and transcript view
- Chat and News pages
- Profile and Settings pages
- Admin pages: user and staff management

## Real-Time Features Added
- Live call websocket connection
- Active AI call tracking
- Human transfer queue visibility
- Emergency alert banner for urgent call escalation
- Connection status indicator (connected or disconnected)

## Important Frontend Files
- `src/App.jsx`: app routes and providers
- `src/context/SocketContext.jsx`: global real-time call state
- `src/services/websocket.js`: websocket connection helper
- `src/components/LiveCallsWidget.jsx`: live call monitoring UI
- `src/components/EmergencyAlert.jsx`: emergency alert UI
- `src/pages/Dashboard.jsx`: dashboard with live call widgets
- `src/pages/CallLogs.jsx`: enhanced call log view with transcript expansion

## Environment Values Used
- `VITE_API_BASE_URL`: backend API base URL
- `VITE_WS_BASE_URL`: websocket base URL

## How To Run Frontend
1. Install dependencies.
2. Start development server.
3. Open the app in browser.
4. Ensure backend is running for API and websocket features.

## Notes
- Live call features depend on backend websocket endpoint availability.
- If backend is down, dashboard live call status will show disconnected.
- For complete end-to-end calling tests, Twilio webhook and public tunnel must be configured.

## Output You Requested
This file is a human-readable README summary and does not include full source code.
