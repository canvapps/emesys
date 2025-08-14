-- PostgreSQL Database Setup for Wedding Invitation Enterprise System
-- This script should be run to create the initial database structure

-- Create main database
CREATE DATABASE emesys_dev;

-- Create test database
CREATE DATABASE emesys_dev_test;

-- Connect to main database
\c emesys_dev;

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
\c emesys_dev_test;

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
-- GRANT ALL PRIVILEGES ON DATABASE emesys_dev TO postgres;
-- GRANT ALL PRIVILEGES ON DATABASE emesys_dev_test TO postgres;