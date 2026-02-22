# 🎯 Complete Setup Instructions

## Prerequisites

### Required Software
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/)
- [PostgreSQL 12+](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

### Installation Check
```bash
python --version        # Should be 3.8+
node --version          # Should be 16+
npm --version           # Should be 8+
psql --version          # Should be 12+
```

---

## Step 1: Initial Project Setup

### Clone or Extract Project
```bash
# Navigate to project directory
cd "d:/AI Project For Hospital"
```

### Install Dependencies

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd ..
npm install
```

---

## Step 2: Configure Environment

### Create `.env` file in backend directory
```bash
cd backend
# Create .env file with these contents:
```

```env
# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=hospital_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# Django Configuration
DEBUG=True
SECRET_KEY=django-insecure-your-secret-key-change-this-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# MongoDB (Optional)
MONGODB_URI=mongodb+srv://username:password@cluster/
MONGODB_DB_NAME=hospital_ai_logs

# Frontend API URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### Create `.env` file in frontend directory (root)
```bash
cd ..
# Create .env file with:
```

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Step 3: Setup Database

### Windows Users
```bash
cd backend
setup.bat
```

### Linux/Mac Users
```bash
cd backend
bash setup.sh
```

### Manual Setup
```bash
cd backend
python setup_database.py
```

### Interactive Prompts
```
Admin username [admin]: your_admin_username
Admin email [admin@hospital.com]: your.email@hospital.com
Admin password [Admin@123]: YourSecurePassword123
```

---

## Step 4: Start Application

### Terminal 1: Backend Server
```bash
cd backend
python manage.py runserver
# Output: Starting development server at http://127.0.0.1:8000/
```

### Terminal 2: Frontend Server
```bash
npm run dev
# Output: Local: http://localhost:5173/
```

---

## Step 5: First Time Login

### Access Application
1. Open browser: `http://localhost:5173`
2. You'll be redirected to `/login`

### Login Credentials
```
Username: your_admin_username (from setup)
Password: YourSecurePassword123 (from setup)
```

### After Login
- You'll see the Dashboard
- Click "Register User" button in navbar (for admin only)
- Click "Profile" to edit your profile

---

## Feature Usage Guide

### 1. Register a New Doctor

1. **Navigate to Registration**
   - Click "Register User" button in navbar
   - Or go to: http://localhost:5173/register-user

2. **Fill Form**
   ```
   Full Name: Dr. John Smith
   Date of Birth: 1990-05-15
   Email: drjohn@hospital.com
   Phone: +1234567890
   Address: 123 Medical Street
   Username: drjohn
   Role: Doctor
   Specialization: Cardiology
   Password: SecurePass123
   Confirm Password: SecurePass123
   ```

3. **Upload Files** (Optional)
   - Click "Upload Profile Picture"
   - Click "Upload Doctor ID Card"

4. **Submit**
   - Click "Register User"
   - See success message with user details

5. **New Doctor Can Login**
   - Username: drjohn
   - Password: SecurePass123

### 2. Edit Your Profile

1. **Navigate to Profile**
   - Click "Profile" in navbar
   - Or go to: http://localhost:5173/profile

2. **Edit Details**
   - Click "Edit Profile" button
   - Update any field:
     - Full Name
     - Email
     - Phone Number
     - Address
     - About Yourself

3. **Save Changes**
   - Click "Save Changes" button
   - Wait for confirmation

4. **Verify Changes**
   - Refresh page
   - Changes should persist

### 3. Upload Profile Picture

#### During Registration
1. Go to registration form
2. Click "Upload Profile Picture"
3. Select image file (JPG/PNG)
4. File size must be < 5MB
5. If error, read message and try again

#### Valid Image Formats
- ✓ JPG/JPEG
- ✓ PNG
- ✓ GIF
- ✓ BMP
- ✗ PDF
- ✗ DOC
- ✗ TXT

#### File Size
- ✓ Under 5 MB
- ✗ Over 5 MB

---

## Troubleshooting

### Backend Won't Start
```
Error: psycopg2.OperationalError: could not connect to server
```
**Solution:**
1. Check PostgreSQL is running
2. Verify credentials in .env
3. Create database if missing

### Frontend Won't Start
```
Error: ENOENT: no such file or directory
```
**Solution:**
```bash
cd ..
npm install
npm run dev
```

### Setup Script Failed
```
Error: Database connection failed
```
**Solution:**
1. Start PostgreSQL service
2. Check .env file exists in backend/
3. Verify DB_NAME, DB_USER, DB_PASSWORD
4. Create database manually:
   ```sql
   CREATE DATABASE hospital_db;
   ```
5. Re-run setup script

### Can't Login
**Check:**
1. Backend server is running (http://localhost:8000)
2. Correct username and password
3. Admin user was created during setup
4. Check browser console for errors

### Image Upload Rejected
**Check:**
1. File format: JPG/PNG/GIF/BMP only
2. File size: Less than 5MB
3. File is not corrupted
4. Try a different image

---

## Project Structure

```
AI Project For Hospital/
├── backend/                      # Django backend
│   ├── api/                     # API app
│   │   ├── models.py            # Database models
│   │   ├── views.py             # API endpoints
│   │   ├── serializers.py       # Data serializers
│   │   └── permissions.py       # Access control
│   ├── hospital_system/         # Main settings
│   ├── setup_database.py        # NEW: Setup script
│   ├── setup.bat                # NEW: Windows setup
│   ├── setup.sh                 # NEW: Linux/Mac setup
│   ├── manage.py                # Django CLI
│   └── requirements.txt          # Python dependencies
│   
├── src/                         # React frontend
│   ├── pages/
│   │   ├── AdminUserRegistration.jsx  # NEW: Register users
│   │   ├── Profile.jsx          # UPDATED: Now editable
│   │   ├── Signup.jsx           # UPDATED: Image validation
│   │   └── ...
│   ├── components/
│   │   ├── Navbar.jsx           # UPDATED: Register button
│   │   └── ...
│   ├── services/
│   │   └── api.js               # UPDATED: API methods
│   ├── App.jsx                  # UPDATED: Routes
│   └── ...
│
├── package.json                 # Frontend dependencies
├── .env                         # Frontend config
├── IMPLEMENTATION_SUMMARY.md    # NEW: Feature guide
├── QUICK_REFERENCE.md           # NEW: Developer guide
└── README.md                    # Main documentation
```

---

## API Testing

### Using curl or Postman

#### Register User (As Admin)
```bash
curl -X POST http://localhost:8000/api/auth/register_by_admin/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "username=drsmith" \
  -F "email=drsmith@hospital.com" \
  -F "password=SecurePass123" \
  -F "confirm_password=SecurePass123" \
  -F "full_name=Dr. Smith" \
  -F "date_of_birth=1990-01-15" \
  -F "phone_number=+1234567890" \
  -F "address=123 Street" \
  -F "role=Doctor" \
  -F "specialization=Surgery" \
  -F "doctor_id_card=@/path/to/idcard.jpg" \
  -F "profile_picture=@/path/to/profile.jpg"
```

#### Update Profile
```bash
curl -X PATCH http://localhost:8000/api/users/update_profile/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "phone_number": "+9876543210"
  }'
```

---

## Admin Functions

### Only Admins Can:
- ✓ Click "Register User" button
- ✓ Register new users (all roles)
- ✓ Access `/register-user` page
- ✓ Approve pending users via admin panel
- ✓ Disable/reject user accounts

### Admin Profile
- ✓ Editable (edit button on profile page)
- ✓ Can change email, phone, address
- ✓ Changes persist to database
- ✓ Other users cannot see edit button

---

## Performance Tips

### For Development
- Keep backend and frontend servers running
- Use Redux DevTools browser extension
- Check Network tab for API issues
- Use React DevTools for debugging

### For Production
- Build frontend: `npm run build`
- Set DEBUG=False in .env
- Use strong SECRET_KEY
- Enable HTTPS
- Use production database

---

## Security Notes

### Change Default Credentials
After setup, change admin password immediately

### Environment Variables
- Never commit .env file
- Use strong SECRET_KEY
- Rotate passwords regularly

### Database
- Regular backups recommended
- Don't expose database ports
- Use strong passwords

---

## Getting Help

### Documentation
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature details
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Code reference
- [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md) - Database guide
- [README.md](README.md) - Project overview

### Common Issues
- See [ERROR_FIXES.md](ERROR_FIXES.md)
- See [QUICK_FIX.md](backend/QUICK_FIX.md)

---

## Verification Checklist

After completing setup:

- [ ] Backend server is running on port 8000
- [ ] Frontend server is running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can login with admin credentials
- [ ] "Register User" button visible in navbar
- [ ] Can register a new doctor
- [ ] New doctor can login
- [ ] Can edit admin profile
- [ ] Image upload validation works
- [ ] Database has all tables created

---

**Setup Complete! Enjoy using the AI Hospital Receptionist System! 🏥**

For questions or issues, refer to documentation files or check browser console for errors.

---

Version: 1.0  
Last Updated: 2024
