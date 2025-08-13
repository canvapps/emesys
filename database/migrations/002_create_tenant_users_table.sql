-- Migration: Create tenant_users table with proper relationships
-- Date: 2025-08-12
-- Description: Multi-tenant user management table with foreign key to tenants

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenant_users table
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_tenant_users_tenant_id 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT unique_email_per_tenant 
        UNIQUE (tenant_id, email),
        
    CONSTRAINT ck_tenant_users_role 
        CHECK (role IN ('super_admin', 'admin', 'manager', 'member', 'guest')),
        
    CONSTRAINT ck_tenant_users_status 
        CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'archived')),
        
    CONSTRAINT ck_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
        
    CONSTRAINT ck_name_not_empty 
        CHECK (LENGTH(TRIM(first_name)) > 0 AND LENGTH(TRIM(last_name)) > 0),
        
    CONSTRAINT ck_password_hash_not_empty 
        CHECK (LENGTH(TRIM(password_hash)) > 0)
);

-- Create indexes for performance optimization
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_email ON tenant_users(email);
CREATE INDEX idx_tenant_users_tenant_email ON tenant_users(tenant_id, email);
CREATE INDEX idx_tenant_users_role ON tenant_users(role);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);
CREATE INDEX idx_tenant_users_last_login ON tenant_users(last_login_at);
CREATE INDEX idx_tenant_users_created_at ON tenant_users(created_at);
CREATE INDEX idx_tenant_users_email_verified ON tenant_users(email_verified_at) WHERE email_verified_at IS NOT NULL;

-- Create partial index for active users only (performance optimization)
CREATE INDEX idx_tenant_users_active_users ON tenant_users(tenant_id, role) 
WHERE status = 'active';

-- Create GIN index for profile_data JSONB field
CREATE INDEX idx_tenant_users_profile_data ON tenant_users USING GIN(profile_data);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_users_updated_at
    BEFORE UPDATE ON tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_users_updated_at();

-- Create function to validate user hierarchy within tenant
CREATE OR REPLACE FUNCTION validate_user_role_hierarchy(
    p_tenant_id UUID,
    p_user_role VARCHAR(50),
    p_target_user_role VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin can manage anyone in any tenant
    IF p_user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin can manage manager, member, guest
    IF p_user_role = 'admin' AND p_target_user_role IN ('manager', 'member', 'guest') THEN
        RETURN TRUE;
    END IF;
    
    -- Manager can manage member, guest
    IF p_user_role = 'manager' AND p_target_user_role IN ('member', 'guest') THEN
        RETURN TRUE;
    END IF;
    
    -- Members and guests cannot manage others
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can access tenant features based on subscription
CREATE OR REPLACE FUNCTION user_can_access_feature(
    p_user_id UUID,
    p_feature_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    tenant_subscription VARCHAR(100);
    tenant_status VARCHAR(50);
BEGIN
    -- Get tenant subscription and status
    SELECT t.subscription_plan, t.status
    INTO tenant_subscription, tenant_status
    FROM tenants t
    INNER JOIN tenant_users tu ON tu.tenant_id = t.id
    WHERE tu.id = p_user_id;
    
    -- Check if tenant is active
    IF tenant_status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Feature access based on subscription
    CASE p_feature_name
        WHEN 'basic_templates' THEN
            RETURN tenant_subscription IN ('free', 'basic', 'premium', 'enterprise');
        WHEN 'custom_templates' THEN
            RETURN tenant_subscription IN ('basic', 'premium', 'enterprise');
        WHEN 'advanced_customization' THEN
            RETURN tenant_subscription IN ('premium', 'enterprise');
        WHEN 'api_access' THEN
            RETURN tenant_subscription IN ('premium', 'enterprise');
        WHEN 'white_label' THEN
            RETURN tenant_subscription = 'enterprise';
        WHEN 'unlimited_invitations' THEN
            RETURN tenant_subscription IN ('premium', 'enterprise');
        ELSE
            RETURN tenant_subscription = 'enterprise';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user count per tenant (for subscription limits)
CREATE OR REPLACE FUNCTION get_active_user_count_in_tenant(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO user_count
    FROM tenant_users
    WHERE tenant_id = p_tenant_id 
    AND status = 'active';
    
    RETURN COALESCE(user_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to check subscription user limits
CREATE OR REPLACE FUNCTION check_user_limit_for_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_plan VARCHAR(100);
    current_user_count INTEGER;
    max_users INTEGER;
BEGIN
    -- Get tenant subscription plan
    SELECT t.subscription_plan INTO subscription_plan
    FROM tenants t WHERE t.id = p_tenant_id;
    
    -- Get current active user count
    current_user_count := get_active_user_count_in_tenant(p_tenant_id);
    
    -- Set limits based on subscription
    CASE subscription_plan
        WHEN 'free' THEN max_users := 3;
        WHEN 'basic' THEN max_users := 10;
        WHEN 'premium' THEN max_users := 50;
        WHEN 'enterprise' THEN max_users := -1; -- Unlimited
        ELSE max_users := 1;
    END CASE;
    
    -- Check if under limit (unlimited = -1)
    RETURN (max_users = -1 OR current_user_count < max_users);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce user limits before insert
CREATE OR REPLACE FUNCTION enforce_user_limit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for active users being added
    IF NEW.status = 'active' THEN
        IF NOT check_user_limit_for_tenant(NEW.tenant_id) THEN
            RAISE EXCEPTION 'User limit exceeded for tenant subscription plan';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_user_limit
    BEFORE INSERT OR UPDATE ON tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION enforce_user_limit_trigger();

-- Insert default super admin user if tenants table has super_admin tenant
DO $$
DECLARE
    super_admin_tenant_id UUID;
BEGIN
    -- Find super_admin tenant
    SELECT id INTO super_admin_tenant_id
    FROM tenants 
    WHERE type = 'super_admin' 
    LIMIT 1;
    
    -- Create super admin user if tenant exists and no super admin user exists
    IF super_admin_tenant_id IS NOT NULL THEN
        INSERT INTO tenant_users (
            tenant_id,
            email,
            password_hash,
            first_name,
            last_name,
            role,
            status,
            email_verified_at
        )
        SELECT 
            super_admin_tenant_id,
            'admin@weddinvite.com',
            '$2b$12$LQv3c1yqBwEHxXsITjnGduJElNHoKMRCG5hH4d8K.M8mNE.Y8zS.G', -- password: admin123
            'System',
            'Administrator',
            'super_admin',
            'active',
            CURRENT_TIMESTAMP
        WHERE NOT EXISTS (
            SELECT 1 FROM tenant_users 
            WHERE tenant_id = super_admin_tenant_id 
            AND role = 'super_admin'
        );
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE tenant_users IS 'Multi-tenant user management table with hierarchical roles';
COMMENT ON COLUMN tenant_users.id IS 'Unique identifier for user';
COMMENT ON COLUMN tenant_users.tenant_id IS 'Foreign key reference to tenants table';
COMMENT ON COLUMN tenant_users.email IS 'User email address (unique within tenant)';
COMMENT ON COLUMN tenant_users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN tenant_users.role IS 'User role within tenant (super_admin, admin, manager, member, guest)';
COMMENT ON COLUMN tenant_users.status IS 'User account status';
COMMENT ON COLUMN tenant_users.profile_data IS 'Additional user profile information stored as JSON';
COMMENT ON COLUMN tenant_users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN tenant_users.email_verified_at IS 'Timestamp when email was verified';

-- Grant permissions (adjust based on your application user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_users TO your_app_user;
-- GRANT USAGE ON SEQUENCE tenant_users_id_seq TO your_app_user;