-- PostgreSQL Database Creation Script
-- Run this script to create the hospital_db database
-- Usage: psql -U postgres -f create_database.sql

-- Create database
CREATE DATABASE hospital_db;

-- Connect to the new database
\c hospital_db

-- Grant privileges (optional - if you want to create a separate user)
-- CREATE USER hospital_user WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_user;

-- Display success message
SELECT 'Database hospital_db created successfully!' AS message;
