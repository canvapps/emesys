-- PostgreSQL Database Setup for Wedding Invitation Enterprise System
-- This script should be run to create the initial database structure

-- Create main database
CREATE DATABASE weddinvite_enterprise;

-- Create test database
CREATE DATABASE weddinvite_enterprise_test;

-- Connect to main database
\c weddinvite_enterprise;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database connection successful - ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT health_check();

-- Connect to test database and setup the same
\c weddinvite_enterprise_test;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security extension  
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Test database connection successful - ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT health_check();

-- Grant necessary permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON DATABASE weddinvite_enterprise TO postgres;
-- GRANT ALL PRIVILEGES ON DATABASE weddinvite_enterprise_test TO postgres;