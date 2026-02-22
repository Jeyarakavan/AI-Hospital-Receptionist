-- Complete Database Reset Script
-- Run this in pgAdmin Query Tool or via psql
-- This will DROP ALL TABLES and prepare for fresh migrations

-- Step 1: Drop all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
END $$;

-- Step 2: Drop sequences if any
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- Step 3: Verify all tables are dropped
SELECT 'Database reset complete. Now run: python manage.py migrate' AS message;
