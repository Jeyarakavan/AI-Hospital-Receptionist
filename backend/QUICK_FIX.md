# Quick Fix Guide - Database Migration Issues

## Problem
The database is corrupted with invalid migration state. The `users` table doesn't exist and `django_content_type` has null values.

## Solution: Complete Database Reset

### Step 1: Drop and Recreate Database (Using pgAdmin)

1. **Open pgAdmin**
2. **Connect to PostgreSQL** (password: `1234`)
3. **Right-click `hospital_db`** → **Delete/Drop**
   - Check "Cascade" if available
   - Click "OK"
4. **Right-click "Databases"** → **Create** → **Database**
5. **Name**: `hospital_db`
6. **Click "Save"**

### Step 2: Run Migrations (Fresh Start)

```powershell
cd backend

# Run migrations - this will create all tables
python manage.py migrate

# Create admin user
python manage.py create_admin
```

### Step 3: Verify

```powershell
# Start server
python manage.py runserver
```

If you see "System check identified no issues", you're good!

## Alternative: Using Python Script

If you prefer automation:

```powershell
cd backend

# Run the fix script
python fix_migrations.py
# Type 'yes' when prompted

# Then run migrations
python manage.py migrate
python manage.py create_admin
```

## What This Does

- Drops all existing tables (clears corrupted data)
- Allows fresh migrations to run
- Creates all tables properly
- Sets up admin user

## After Fix

You should be able to:
- ✅ Run `python manage.py migrate` without errors
- ✅ Create admin with `python manage.py create_admin`
- ✅ Start server with `python manage.py runserver`
- ✅ Login with username: `admin`, password: `admin123`
