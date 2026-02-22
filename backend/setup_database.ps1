# PowerShell script to create PostgreSQL database
# This script helps create the hospital_db database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL (psql) is not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please do one of the following:" -ForegroundColor Yellow
    Write-Host "1. Add PostgreSQL bin directory to PATH" -ForegroundColor Yellow
    Write-Host "   Usually: C:\Program Files\PostgreSQL\<version>\bin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Or create database manually using pgAdmin or SQL:" -ForegroundColor Yellow
    Write-Host "   CREATE DATABASE hospital_db;" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Or use the SQL file:" -ForegroundColor Yellow
    Write-Host "   psql -U postgres -f create_database.sql" -ForegroundColor White
    exit 1
}

Write-Host "PostgreSQL found at: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Prompt for PostgreSQL password
$pgPassword = Read-Host "Enter PostgreSQL 'postgres' user password" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $pgPasswordPlain

Write-Host ""
Write-Host "Creating database 'hospital_db'..." -ForegroundColor Yellow

# Create database
$createDbCommand = "CREATE DATABASE hospital_db;"
$result = echo $createDbCommand | psql -U postgres -h localhost

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Database 'hospital_db' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run migrations: python manage.py migrate" -ForegroundColor White
    Write-Host "2. Create admin: python manage.py create_admin" -ForegroundColor White
    Write-Host "3. Start server: python manage.py runserver" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
    Write-Host "The database might already exist, or there was a connection error." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Yellow
    Write-Host "psql -U postgres" -ForegroundColor White
    Write-Host "CREATE DATABASE hospital_db;" -ForegroundColor White
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD
