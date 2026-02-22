# PowerShell script to reset PostgreSQL database
# This will DROP and RECREATE the database

Write-Host "========================================" -ForegroundColor Red
Write-Host "WARNING: This will DELETE all data!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Are you sure you want to reset the database? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Resetting database..." -ForegroundColor Yellow

# Get password from .env or prompt
$envContent = Get-Content .env -Raw
if ($envContent -match 'DB_PASSWORD=(\S+)') {
    $dbPassword = $matches[1]
} else {
    $dbPassword = Read-Host "Enter PostgreSQL password" -AsSecureString
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
}

$env:PGPASSWORD = $dbPassword

# Try to find psql
$psqlPath = $null
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if (-not $psqlPath) {
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        $psqlPath = "psql"
    }
}

if (-not $psqlPath) {
    Write-Host "ERROR: psql not found. Please use pgAdmin to manually:" -ForegroundColor Red
    Write-Host "1. Drop database: hospital_db" -ForegroundColor Yellow
    Write-Host "2. Create database: hospital_db" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using psql at: $psqlPath" -ForegroundColor Green
Write-Host ""

# Drop database (ignore errors if it doesn't exist)
Write-Host "Dropping database..." -ForegroundColor Yellow
if ($psqlPath -eq "psql") {
    echo "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'hospital_db' AND pid <> pg_backend_pid();" | & $psqlPath -U postgres -h localhost
    echo "DROP DATABASE IF EXISTS hospital_db;" | & $psqlPath -U postgres -h localhost
} else {
    echo "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'hospital_db' AND pid <> pg_backend_pid();" | & $psqlPath -U postgres -h localhost
    echo "DROP DATABASE IF EXISTS hospital_db;" | & $psqlPath -U postgres -h localhost
}

# Create database
Write-Host "Creating database..." -ForegroundColor Yellow
if ($psqlPath -eq "psql") {
    echo "CREATE DATABASE hospital_db;" | & $psqlPath -U postgres -h localhost
} else {
    echo "CREATE DATABASE hospital_db;" | & $psqlPath -U postgres -h localhost
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Database reset complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run:" -ForegroundColor Cyan
    Write-Host "  python manage.py migrate" -ForegroundColor White
    Write-Host "  python manage.py create_admin" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to reset database" -ForegroundColor Red
    Write-Host "Please use pgAdmin to manually drop and create the database" -ForegroundColor Yellow
}

Remove-Item Env:\PGPASSWORD
