@echo off
REM =============================================================
REM AI Hospital System - Automated Setup Script
REM =============================================================

echo.
echo ==========================================
echo  AI Hospital Receptionist System Setup
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to PATH
    pause
    exit /b 1
)

REM Check if in the correct directory
if not exist "manage.py" (
    echo Error: Please run this script from the backend directory
    echo Current directory: %cd%
    pause
    exit /b 1
)

echo Detected Python:
python --version
echo.

REM Check for virtual environment
if not exist "venv" (
    if not exist ".venv" (
        echo Creating virtual environment...
        python -m venv venv
        if errorlevel 1 (
            echo Error: Failed to create virtual environment
            pause
            exit /b 1
        )
        echo Virtual environment created
    )
)

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM Install requirements
echo.
echo Installing Python dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully

REM Run setup script
echo.
echo ==========================================
echo  Running Database Setup
echo ==========================================
python setup_database.py
if errorlevel 1 (
    echo Setup failed
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Start the server: python manage.py runserver
echo 2. Open http://localhost:8000/api/ in browser
echo 3. Start frontend: cd .. && npm run dev
echo.
pause
