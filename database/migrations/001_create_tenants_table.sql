-- Migration: Create tenants table for multi-tenant architecture
-- Version: 001
-- Created: 2025-08-12

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('super_admin', 'wedding_agency', 'couple')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive', 'expired')),
    subscription_plan VARCHAR(100) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'expired', 'cancelled', 'trial')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(type);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create tenant hierarchy validation function
CREATE OR REPLACE FUNCTION validate_tenant_hierarchy(tenant_id UUID, manager_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tenant_type VARCHAR(50);
    manager_type VARCHAR(50);
BEGIN
    -- Get tenant types
    SELECT type INTO tenant_type FROM tenants WHERE id = tenant_id;
    SELECT type INTO manager_type FROM tenants WHERE id = manager_id;
    
    -- Super admin can manage all
    IF manager_type = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Wedding agency can manage couples only
    IF manager_type = 'wedding_agency' AND tenant_type = 'couple' THEN
        RETURN TRUE;
    END IF;
    
    -- Same tenant can manage itself
    IF tenant_id = manager_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Insert default super admin tenant
INSERT INTO tenants (name, type, status, subscription_plan, subscription_status) 
VALUES ('System Administrator', 'super_admin', 'active', 'enterprise', 'active')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant table storing tenant information for the wedding invitation system';
COMMENT ON COLUMN tenants.id IS 'Unique identifier for the tenant';
COMMENT ON COLUMN tenants.name IS 'Display name of the tenant (must be unique)';
COMMENT ON COLUMN tenants.type IS 'Type of tenant: super_admin, wedding_agency, or couple';
COMMENT ON COLUMN tenants.status IS 'Current status of the tenant account';
COMMENT ON COLUMN tenants.subscription_plan IS 'Subscription plan level';
COMMENT ON COLUMN tenants.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN tenants.settings IS 'JSON configuration settings for the tenant';
COMMENT ON COLUMN tenants.metadata IS 'Additional metadata and custom fields';