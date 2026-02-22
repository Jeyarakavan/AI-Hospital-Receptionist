# How to Create PostgreSQL Database

The error shows: `database "hospital_db" does not exist`

## Quick Solutions

### Method 1: Using pgAdmin (GUI - Easiest)

1. **Open pgAdmin** (usually installed with PostgreSQL)
2. **Connect to PostgreSQL server** (enter password: `1234`)
3. **Right-click on "Databases"** → **Create** → **Database**
4. **Enter database name**: `hospital_db`
5. **Click "Save"**

### Method 2: Using Command Line (if psql is in PATH)

```powershell
# Set password
$env:PGPASSWORD='1234'

# Create database
psql -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
```

### Method 3: Find psql and Use Full Path

1. **Find PostgreSQL installation** (usually):
   - `C:\Program Files\PostgreSQL\<version>\bin\psql.exe`
   - Or search for `psql.exe` in Windows

2. **Use full path**:
   ```powershell
   $env:PGPASSWORD='1234'
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE hospital_db;"
   ```

### Method 4: Using SQL Query Tool in pgAdmin

1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click on server → **Query Tool**
4. Run this SQL:
   ```sql
   CREATE DATABASE hospital_db;
   ```
5. Click Execute (F5)

### Method 5: Add PostgreSQL to PATH

1. Find PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\16\bin`)
2. Add to Windows PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add PostgreSQL bin folder
   - Restart PowerShell
3. Then use Method 2

## Verify Database Created

After creating, verify it exists:
```sql
-- In pgAdmin Query Tool or psql
\l
-- Should show hospital_db in the list
```

## Next Steps

After creating the database:

1. **Run migrations**:
   ```bash
   cd backend
   python manage.py migrate
   ```

2. **Create admin user**:
   ```bash
   python manage.py create_admin
   ```

3. **Start server**:
   ```bash
   python manage.py runserver
   ```

## Troubleshooting

- **"psql not found"**: Use pgAdmin GUI (Method 1) instead
- **"Password incorrect"**: Check `backend/.env` file for `DB_PASSWORD`
- **"Connection refused"**: Make sure PostgreSQL service is running
  - Check Windows Services → PostgreSQL
