# ⚡ Quick Start Guide - AI Hospital System

## 📋 Prerequisites
- Node.js 18+
- npm or yarn
- Git (optional)

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies  
cd server && npm install && cd ..
```

### Step 2: Start Backend Server
```bash
# Terminal 1
cd server
node index.js
```
✅ Backend running at `http://localhost:4000`

### Step 3: Start Frontend Server
```bash
# Terminal 2 (in project root)
npm run dev
```
✅ Frontend running at `http://localhost:5175`

### Step 4: Login & Explore
1. Open http://localhost:5175 in your browser
2. Click "Demo" and choose Admin role
3. Or use credentials: `admin` / `admin123`

---

## 🎯 Quick Navigation

### As Admin/Staff
- **Dashboard** - Overview of key metrics
- **Appointments** - Schedule & manage appointments
- **Call Console** - Monitor incoming calls
- **Staff Management** - Register & manage staff
- **Analytics** - View detailed reports (Admin only)
- **Settings** - Customize hospital branding
- **Emergency** - Quick ambulance booking

---

## 🏥 Admin Tasks

### Register New Staff
1. Go to **Menu → Staff Management** (top navbar)
2. Click **+ New Staff Member**
3. Fill in the form:
   - Name, email, phone
   - Staff type (Doctor, Nurse, etc.)
   - Professional details
4. Click "Register"
5. **Copy credentials** from popup
6. Share username & password with staff member

### Customize Hospital Branding
1. Go to **Menu → Settings**
2. Select **Branding** tab
3. Change:
   - Hospital Name
   - Upload Logo (PNG/JPG)
   - Upload Banner (PNG/JPG)
   - Mission Statement
   - Vision Statement
   - Primary & Secondary Colors
4. Click **Save Branding**
5. Changes appear site-wide instantly!

### View Analytics & Reports
1. Go to **Menu → Analytics** (Admin only)
2. Filter by time period (Week/Month/Year)
3. View:
   - Staff distribution
   - Appointment statistics
   - System performance
   - Recent activity
4. Click **Export Data** to download as JSON

---

## 👥 Default Accounts

### Demo Roles (Instant Access)
- Receptionist (view calls, manage appointments)
- Doctor (view appointments, patient list)
- Admin (full access to all features)

### Pre-configured Staff Accounts
```
Admin User
- Username: admin
- Password: admin123

Dr. Alice Johnson (Doctor)
- Username: alice
- Password: alice123

Dr. Bob Smith (Doctor)
- Username: bob
- Password: bob123

Sarah Williams (Nurse)
- Username: sarah
- Password: sarah123

Emma Brown (Receptionist)
- Username: emma
- Password: emma123
```

---

## 🎨 Customize Everything

### Hospital Appearance
1. **Logo** - 200x200px PNG/JPG
2. **Banner** - 1920x1080px PNG/JPG
3. **Name** - Display in navbar and footer
4. **Colors** - Primary (Teal) & Secondary (Blue)
5. **Mission** - Your hospital's mission statement
6. **Vision** - Your hospital's vision statement

### Theme Colors
- Primary: Click color picker, select any color
- Secondary: Click color picker, select any color
- Default Medical Palette:
  - Teal: #0ea5a4
  - Dark Blue: #0369a1

---

## 📊 Key Features at a Glance

| Feature | Access | Purpose |
|---------|--------|---------|
| Dashboard | All | Quick overview of system |
| Appointments | All | Schedule & manage appointments |
| Call Console | All | Monitor phone calls |
| Staff Management | Admin | Register/manage staff |
| Analytics | Admin | Detailed reports & metrics |
| Settings | Admin | Hospital branding & customization |

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4000 (backend)
taskkill /PID <pid> /F

# Kill process on port 5175 (frontend)
taskkill /PID <pid> /F
```

### Database Issues
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

cd server
rm -rf node_modules package-lock.json
npm install
```

### Clear Browser Cache
- Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
- Clear Cookies and cached images/files
- Reload page

### Check Logs
- Backend console shows detailed API logs
- Frontend DevTools (F12) shows client-side errors
- Check `.env` file is properly configured

---

## 📞 Key Pages Reference

### Public Pages
- `/login` - Multi-tab authentication

### Protected Pages (Login Required)
- `/` - Dashboard (role-specific)
- `/appointments` - Appointment management
- `/calls` - Call console
- `/profile` - User profile
- `/ambulance` - Emergency booking

### Admin-Only Pages
- `/staff` - Staff management & registration
- `/admin` - Hospital branding & settings
- `/analytics` - Advanced analytics & reports

---

## 🎓 How to Impress with This Project

### During Presentation
1. **Show the Branding System**
   - Upload custom logo & banner
   - Change theme colors
   - Display mission/vision

2. **Demonstrate Staff Management**
   - Register a new staff member
   - Show auto-generated credentials
   - Explain secure password hashing

3. **Display Analytics Dashboard**
   - Show comprehensive metrics
   - Export data functionality
   - Performance tracking

4. **Highlight Design**
   - Professional medical color palette
   - Smooth animations
   - Responsive on mobile/tablet
   - Consistent branding throughout

5. **Explain Architecture**
   - Frontend (React) → Backend (Express) → Database (SQLite/PostgreSQL)
   - Multi-role authentication system
   - Real-time updates with Socket.IO
   - Scalable design ready for production

---

## 📱 Testing Scenarios

### Test 1: Register New Doctor
1. Login as Admin
2. Go to Staff Management
3. Fill form with doctor details
4. Copy credentials
5. Logout
6. Login with the new credentials
7. Verify doctor dashboard appears

### Test 2: Customize Hospital
1. Go to Settings
2. Upload a test logo
3. Upload a test banner
4. Change hospital name
5. Add mission statement
6. Save changes
7. Refresh page
8. Verify all changes appear

### Test 3: View Analytics
1. Go to Analytics (Admin only)
2. Change time period
3. Export data
4. Verify JSON file downloads

---

## 💡 Pro Tips

- **Credentials are displayed once** - Write them down immediately!
- **Changes apply instantly** - No page reload needed for most updates
- **localStorage saves everything** - Even after closing browser
- **Demo mode is great for testing** - No setup required
- **Mobile responsive** - Works on phones, tablets, desktops
- **Animations are smooth** - Professional user experience

---

## 🎓 Final Notes

This is a **production-ready** hospital management system:
- ✅ Scalable architecture
- ✅ Security best practices
- ✅ Professional UI/UX
- ✅ Real-time capabilities
- ✅ Comprehensive documentation
- ✅ Easy customization

Perfect for:
- Final year project
- Portfolio showcase
- Client demonstration
- Educational reference

---

**Happy Exploring! 🚀**

*For detailed information, see README.md and FEATURES.md*
