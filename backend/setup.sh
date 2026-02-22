#!/bin/bash

#############################################################
# AI Hospital System - Automated Setup Script
# Supports: Linux and macOS
#############################################################

echo ""
echo "=========================================="
echo "  AI Hospital Receptionist System Setup"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

echo "Detected Python:"
python3 --version
echo ""

# Check if in correct directory
if [ ! -f "manage.py" ]; then
    echo "Error: Please run this script from the backend directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment"
        exit 1
    fi
    echo "Virtual environment created"
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

# Install requirements
echo ""
echo "Installing Python dependencies..."
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi
echo "Dependencies installed successfully"

# Run setup script
echo ""
echo "=========================================="
echo "  Running Database Setup"
echo "=========================================="
python3 setup_database.py
if [ $? -ne 0 ]; then
    echo "Setup failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the server: python manage.py runserver"
echo "2. Open http://localhost:8000/api/ in browser"
echo "3. Start frontend: cd .. && npm run dev"
echo ""
