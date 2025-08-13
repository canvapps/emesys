-- Migration: Create roles and permissions tables for granular RBAC
-- Date: 2025-08-12
-- Description: Multi-tenant role-based access control with granular permissions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create permissions table (system-wide permissions catalog)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL, -- e.g., 'templates', 'invitations', 'users'
    action VARCHAR(100) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- e.g., 'content', 'admin', 'billing'
    is_system_permission BOOLEAN DEFAULT FALSE, -- System-level permissions vs tenant-level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ck_permissions_name_format 
        CHECK (name ~* '^[a-z][a-z0-9_]*[a-z0-9]$'),
    CONSTRAINT ck_permissions_resource_format 
        CHECK (resource ~* '^[a-z][a-z0-9_]*[a-z0-9]$'),
    CONSTRAINT ck_permissions_action_format 
        CHECK (action ~* '^[a-z][a-z0-9_]*[a-z0-9]$'),
    CONSTRAINT ck_permissions_category 
        CHECK (category IN ('general', 'content', 'admin', 'billing', 'analytics', 'system'))
);

-- 2. Create user_roles table (tenant-scoped roles)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for system-wide roles
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    priority INTEGER DEFAULT 0, -- Role hierarchy priority (higher = more priority)
    is_system_role BOOLEAN DEFAULT FALSE, -- System roles vs tenant-custom roles
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_user_roles_tenant_id 
        FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_role_name_per_tenant 
        UNIQUE (tenant_id, name),
    CONSTRAINT ck_user_roles_name_format 
        CHECK (name ~* '^[a-z][a-z0-9_]*[a-z0-9]$'),
    CONSTRAINT ck_user_roles_color_format 
        CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT ck_user_roles_priority_range 
        CHECK (priority >= 0 AND priority <= 1000)
);

-- 3. Create role_permissions table (many-to-many mapping)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_by_user_id UUID, -- User who granted this permission
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_role_permissions_role_id 
        FOREIGN KEY (role_id) 
        REFERENCES user_roles(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id 
        FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_granted_by 
        FOREIGN KEY (granted_by_user_id) 
        REFERENCES tenant_users(id) 
        ON DELETE SET NULL,
    CONSTRAINT unique_role_permission 
        UNIQUE (role_id, permission_id)
);

-- 4. Create user_role_assignments table (assign roles to users)
CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_by_user_id UUID, -- User who assigned this role
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT fk_user_role_assignments_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES tenant_users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_role_assignments_role_id 
        FOREIGN KEY (role_id) 
        REFERENCES user_roles(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_role_assignments_assigned_by 
        FOREIGN KEY (assigned_by_user_id) 
        REFERENCES tenant_users(id) 
        ON DELETE SET NULL,
    CONSTRAINT unique_user_role_active 
        UNIQUE (user_id, role_id),
    CONSTRAINT ck_expiration_future 
        CHECK (expires_at IS NULL OR expires_at > assigned_at)
);

-- 5. Create indexes for performance optimization
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_system ON permissions(is_system_permission);

CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_priority ON user_roles(priority DESC);
CREATE INDEX idx_user_roles_system ON user_roles(is_system_role);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX idx_user_role_assignments_active ON user_role_assignments(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_role_assignments_expires ON user_role_assignments(expires_at) WHERE expires_at IS NOT NULL;

-- 6. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permissions_updated_at();

CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- 7. Business logic functions

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check if user has the permission through any active role
    SELECT EXISTS(
        SELECT 1
        FROM user_role_assignments ura
        JOIN user_roles ur ON ur.id = ura.role_id
        JOIN role_permissions rp ON rp.role_id = ur.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ura.user_id = p_user_id
        AND ura.is_active = TRUE
        AND ur.is_active = TRUE
        AND p.name = p_permission_name
        AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's effective permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(
    permission_name VARCHAR(100),
    resource VARCHAR(100),
    action VARCHAR(100),
    role_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.name as permission_name,
        p.resource,
        p.action,
        ur.name as role_name
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    JOIN role_permissions rp ON rp.role_id = ur.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ura.user_id = p_user_id
    AND ura.is_active = TRUE
    AND ur.is_active = TRUE
    AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to check role hierarchy (can user A manage user B's roles?)
CREATE OR REPLACE FUNCTION can_manage_user_roles(
    p_manager_user_id UUID,
    p_target_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    manager_max_priority INTEGER := 0;
    target_max_priority INTEGER := 0;
    manager_tenant_id UUID;
    target_tenant_id UUID;
BEGIN
    -- Get manager's tenant and max role priority
    SELECT tu.tenant_id INTO manager_tenant_id
    FROM tenant_users tu WHERE tu.id = p_manager_user_id;
    
    SELECT COALESCE(MAX(ur.priority), 0) INTO manager_max_priority
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = p_manager_user_id
    AND ura.is_active = TRUE
    AND ur.is_active = TRUE;
    
    -- Get target user's tenant and max role priority
    SELECT tu.tenant_id INTO target_tenant_id
    FROM tenant_users tu WHERE tu.id = p_target_user_id;
    
    SELECT COALESCE(MAX(ur.priority), 0) INTO target_max_priority
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = p_target_user_id
    AND ura.is_active = TRUE
    AND ur.is_active = TRUE;
    
    -- Manager can manage if:
    -- 1. Same tenant (or manager is system admin)
    -- 2. Manager has higher priority role
    RETURN (manager_tenant_id = target_tenant_id OR manager_tenant_id IS NULL)
           AND manager_max_priority > target_max_priority;
END;
$$ LANGUAGE plpgsql;

-- Function to assign role to user (with validation)
CREATE OR REPLACE FUNCTION assign_role_to_user(
    p_user_id UUID,
    p_role_id UUID,
    p_assigned_by_user_id UUID,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    user_tenant_id UUID;
    role_tenant_id UUID;
    can_assign BOOLEAN := FALSE;
BEGIN
    -- Get user and role tenant IDs
    SELECT tenant_id INTO user_tenant_id FROM tenant_users WHERE id = p_user_id;
    SELECT tenant_id INTO role_tenant_id FROM user_roles WHERE id = p_role_id;
    
    -- Validate tenant matching (allow system roles)
    IF role_tenant_id IS NOT NULL AND role_tenant_id != user_tenant_id THEN
        RAISE EXCEPTION 'Cannot assign role from different tenant';
    END IF;
    
    -- Check if assigning user can manage target user's roles
    SELECT can_manage_user_roles(p_assigned_by_user_id, p_user_id) INTO can_assign;
    
    IF NOT can_assign THEN
        RAISE EXCEPTION 'Insufficient permissions to assign role';
    END IF;
    
    -- Insert or update role assignment
    INSERT INTO user_role_assignments (
        user_id, role_id, assigned_by_user_id, expires_at
    ) VALUES (
        p_user_id, p_role_id, p_assigned_by_user_id, p_expires_at
    ) ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
        assigned_by_user_id = EXCLUDED.assigned_by_user_id,
        assigned_at = CURRENT_TIMESTAMP,
        expires_at = EXCLUDED.expires_at,
        is_active = TRUE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Insert default permissions for wedding invitation system
INSERT INTO permissions (name, resource, action, description, category, is_system_permission) VALUES
-- Template permissions
('templates_create', 'templates', 'create', 'Create new wedding invitation templates', 'content', FALSE),
('templates_read', 'templates', 'read', 'View wedding invitation templates', 'content', FALSE),
('templates_update', 'templates', 'update', 'Edit wedding invitation templates', 'content', FALSE),
('templates_delete', 'templates', 'delete', 'Delete wedding invitation templates', 'content', FALSE),
('templates_publish', 'templates', 'publish', 'Publish templates to marketplace', 'content', FALSE),

-- Invitation permissions
('invitations_create', 'invitations', 'create', 'Create wedding invitations', 'content', FALSE),
('invitations_read', 'invitations', 'read', 'View wedding invitations', 'content', FALSE),
('invitations_update', 'invitations', 'update', 'Edit wedding invitations', 'content', FALSE),
('invitations_delete', 'invitations', 'delete', 'Delete wedding invitations', 'content', FALSE),
('invitations_send', 'invitations', 'send', 'Send wedding invitations', 'content', FALSE),
('invitations_track', 'invitations', 'track', 'Track invitation responses', 'analytics', FALSE),

-- User management permissions
('users_create', 'users', 'create', 'Create new users in tenant', 'admin', FALSE),
('users_read', 'users', 'read', 'View users in tenant', 'admin', FALSE),
('users_update', 'users', 'update', 'Edit user profiles', 'admin', FALSE),
('users_delete', 'users', 'delete', 'Delete users from tenant', 'admin', FALSE),
('users_manage_roles', 'users', 'manage_roles', 'Assign/remove user roles', 'admin', FALSE),

-- Billing permissions
('billing_read', 'billing', 'read', 'View billing information', 'billing', FALSE),
('billing_update', 'billing', 'update', 'Update billing settings', 'billing', FALSE),
('billing_manage', 'billing', 'manage', 'Full billing management', 'billing', FALSE),

-- Analytics permissions
('analytics_read', 'analytics', 'read', 'View analytics and reports', 'analytics', FALSE),
('analytics_export', 'analytics', 'export', 'Export analytics data', 'analytics', FALSE),

-- System permissions (for super admins)
('system_admin', 'system', 'admin', 'Full system administration access', 'system', TRUE),
('tenants_manage', 'tenants', 'manage', 'Manage tenant accounts', 'system', TRUE),
('system_settings', 'system', 'settings', 'Manage system-wide settings', 'system', TRUE);

-- 9. Insert default system roles
INSERT INTO user_roles (tenant_id, name, display_name, description, color, priority, is_system_role) VALUES
-- System-wide roles
(NULL, 'system_admin', 'System Administrator', 'Full system access across all tenants', '#DC2626', 1000, TRUE),
(NULL, 'tenant_admin', 'Tenant Administrator', 'Full access within tenant', '#7C3AED', 900, TRUE),
(NULL, 'tenant_manager', 'Tenant Manager', 'Management access within tenant', '#059669', 800, TRUE),
(NULL, 'content_creator', 'Content Creator', 'Create and manage templates and invitations', '#0D9488', 600, TRUE),
(NULL, 'viewer', 'Viewer', 'Read-only access to content', '#6B7280', 100, TRUE);

-- 10. Create default role-permission mappings
DO $$
DECLARE
    system_admin_role_id UUID;
    tenant_admin_role_id UUID;
    tenant_manager_role_id UUID;
    content_creator_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO system_admin_role_id FROM user_roles WHERE name = 'system_admin';
    SELECT id INTO tenant_admin_role_id FROM user_roles WHERE name = 'tenant_admin';
    SELECT id INTO tenant_manager_role_id FROM user_roles WHERE name = 'tenant_manager';
    SELECT id INTO content_creator_role_id FROM user_roles WHERE name = 'content_creator';
    SELECT id INTO viewer_role_id FROM user_roles WHERE name = 'viewer';
    
    -- System admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT system_admin_role_id, id FROM permissions;
    
    -- Tenant admin gets all non-system permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT tenant_admin_role_id, id FROM permissions WHERE is_system_permission = FALSE;
    
    -- Tenant manager gets management permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT tenant_manager_role_id, id FROM permissions 
    WHERE name IN (
        'templates_read', 'templates_update',
        'invitations_create', 'invitations_read', 'invitations_update', 'invitations_send', 'invitations_track',
        'users_read', 'users_update',
        'analytics_read', 'analytics_export'
    );
    
    -- Content creator gets content permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT content_creator_role_id, id FROM permissions 
    WHERE name IN (
        'templates_create', 'templates_read', 'templates_update', 'templates_publish',
        'invitations_create', 'invitations_read', 'invitations_update', 'invitations_send'
    );
    
    -- Viewer gets read permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT viewer_role_id, id FROM permissions 
    WHERE name IN (
        'templates_read',
        'invitations_read'
    );
END $$;

-- 11. Add comments for documentation
COMMENT ON TABLE permissions IS 'System-wide permissions catalog for RBAC';
COMMENT ON TABLE user_roles IS 'Tenant-scoped roles with hierarchical priorities';
COMMENT ON TABLE role_permissions IS 'Many-to-many mapping between roles and permissions';
COMMENT ON TABLE user_role_assignments IS 'Assignment of roles to users with optional expiration';

COMMENT ON FUNCTION user_has_permission IS 'Check if user has specific permission through their roles';
COMMENT ON FUNCTION get_user_permissions IS 'Get all effective permissions for a user';
COMMENT ON FUNCTION can_manage_user_roles IS 'Check if user can manage another users roles based on hierarchy';
COMMENT ON FUNCTION assign_role_to_user IS 'Safely assign role to user with validation';