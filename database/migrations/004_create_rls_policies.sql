-- Migration: Implement Row Level Security policies untuk tenant isolation
-- Date: 2025-08-12
-- Description: Enterprise-grade multi-tenant isolation dengan PostgreSQL RLS

-- Enable RLS pada semua tabel yang memerlukan tenant isolation
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTIONS FOR RLS CONTEXT
-- ========================================

-- Function untuk set current user context (digunakan oleh application layer)
CREATE OR REPLACE FUNCTION set_current_user_context(
    p_user_id UUID,
    p_tenant_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Set user_id dalam session
    PERFORM set_config('app.current_user_id', p_user_id::text, FALSE);
    
    -- Set tenant_id dalam session (auto-detect jika tidak disediakan)
    IF p_tenant_id IS NULL THEN
        SELECT tenant_id INTO p_tenant_id 
        FROM tenant_users 
        WHERE id = p_user_id;
    END IF;
    
    PERFORM set_config('app.current_tenant_id', COALESCE(p_tenant_id::text, ''), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk get current user ID dari session
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function untuk get current tenant ID dari session
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function untuk check apakah user adalah super admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    is_admin BOOLEAN := FALSE;
BEGIN
    current_user_id := get_current_user_id();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user adalah super_admin berdasarkan role
    SELECT EXISTS(
        SELECT 1
        FROM tenant_users tu
        JOIN tenants t ON t.id = tu.tenant_id
        WHERE tu.id = current_user_id
        AND (tu.role = 'super_admin' OR t.type = 'super_admin')
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function untuk check apakah user memiliki system permissions
CREATE OR REPLACE FUNCTION has_system_permission(permission_name VARCHAR DEFAULT NULL) RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    has_permission BOOLEAN := FALSE;
BEGIN
    current_user_id := get_current_user_id();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Super admin otomatis memiliki semua system permissions
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific system permission jika diberikan
    IF permission_name IS NOT NULL THEN
        SELECT user_has_permission(current_user_id, permission_name) INTO has_permission;
        RETURN has_permission;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- 1. TENANTS TABLE POLICIES
-- Policy: Users can only see their own tenant (unless super admin)
CREATE POLICY tenants_isolation_policy ON tenants
    FOR ALL
    USING (
        is_super_admin() 
        OR id = get_current_tenant_id()
        OR has_system_permission('tenants_manage')
    );

-- Policy: Allow insert hanya untuk super admin atau system
CREATE POLICY tenants_insert_policy ON tenants
    FOR INSERT
    WITH CHECK (
        is_super_admin() 
        OR has_system_permission('tenants_manage')
    );

-- 2. TENANT_USERS TABLE POLICIES
-- Policy: Users can only see users dari tenant yang sama
CREATE POLICY tenant_users_isolation_policy ON tenant_users
    FOR ALL
    USING (
        is_super_admin()
        OR tenant_id = get_current_tenant_id()
        OR has_system_permission('tenants_manage')
    );

-- Policy: Users can only insert users ke tenant mereka sendiri (atau super admin)
CREATE POLICY tenant_users_insert_policy ON tenant_users
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR tenant_id = get_current_tenant_id()
        OR has_system_permission('tenants_manage')
    );

-- 3. USER_ROLES TABLE POLICIES
-- Policy: Users can only see roles available untuk tenant mereka
CREATE POLICY user_roles_isolation_policy ON user_roles
    FOR ALL
    USING (
        is_super_admin()
        OR tenant_id IS NULL -- System-wide roles visible to all
        OR tenant_id = get_current_tenant_id()
        OR has_system_permission('tenants_manage')
    );

-- Policy: Users can only create roles dalam tenant mereka sendiri
CREATE POLICY user_roles_insert_policy ON user_roles
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR (tenant_id = get_current_tenant_id() AND user_has_permission(get_current_user_id(), 'users_manage_roles'))
        OR has_system_permission('tenants_manage')
    );

-- 4. ROLE_PERMISSIONS TABLE POLICIES  
-- Policy: Users can only see role-permission mappings untuk roles yang dapat mereka akses
CREATE POLICY role_permissions_isolation_policy ON role_permissions
    FOR ALL
    USING (
        is_super_admin()
        OR has_system_permission('tenants_manage')
        OR EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.id = role_id 
            AND (ur.tenant_id IS NULL OR ur.tenant_id = get_current_tenant_id())
        )
    );

-- Policy: Users can only grant permissions untuk roles dalam tenant mereka
CREATE POLICY role_permissions_insert_policy ON role_permissions
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR has_system_permission('tenants_manage')
        OR (
            user_has_permission(get_current_user_id(), 'users_manage_roles')
            AND EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.id = role_id 
                AND (ur.tenant_id IS NULL OR ur.tenant_id = get_current_tenant_id())
            )
        )
    );

-- 5. USER_ROLE_ASSIGNMENTS TABLE POLICIES
-- Policy: Users can only see role assignments untuk users dalam tenant yang sama
CREATE POLICY user_role_assignments_isolation_policy ON user_role_assignments
    FOR ALL
    USING (
        is_super_admin()
        OR has_system_permission('tenants_manage')
        OR EXISTS (
            SELECT 1 FROM tenant_users tu 
            WHERE tu.id = user_id 
            AND tu.tenant_id = get_current_tenant_id()
        )
    );

-- Policy: Users can only assign roles dalam tenant context yang sesuai
CREATE POLICY user_role_assignments_insert_policy ON user_role_assignments
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR has_system_permission('tenants_manage')
        OR (
            user_has_permission(get_current_user_id(), 'users_manage_roles')
            AND EXISTS (
                SELECT 1 FROM tenant_users tu 
                WHERE tu.id = user_id 
                AND tu.tenant_id = get_current_tenant_id()
            )
            AND EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.id = role_id 
                AND (ur.tenant_id IS NULL OR ur.tenant_id = get_current_tenant_id())
            )
        )
    );

-- ========================================
-- BYPASS POLICIES FOR SYSTEM FUNCTIONS
-- ========================================

-- Create special role untuk system operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'system_bypass') THEN
        CREATE ROLE system_bypass;
    END IF;
END
$$;

-- Grant bypass privileges untuk system functions
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments FORCE ROW LEVEL SECURITY;

-- Create bypass policies untuk system functions
CREATE POLICY tenants_system_bypass ON tenants
    FOR ALL
    TO system_bypass
    USING (TRUE);

CREATE POLICY tenant_users_system_bypass ON tenant_users
    FOR ALL
    TO system_bypass
    USING (TRUE);

CREATE POLICY user_roles_system_bypass ON user_roles
    FOR ALL
    TO system_bypass
    USING (TRUE);

CREATE POLICY role_permissions_system_bypass ON role_permissions
    FOR ALL
    TO system_bypass
    USING (TRUE);

CREATE POLICY user_role_assignments_system_bypass ON user_role_assignments
    FOR ALL
    TO system_bypass
    USING (TRUE);

-- ========================================
-- ENHANCED SECURITY FUNCTIONS
-- ========================================

-- Function untuk validate tenant access before operations
CREATE OR REPLACE FUNCTION validate_tenant_access(p_tenant_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin dapat akses semua tenant
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Regular user hanya bisa akses tenant mereka sendiri
    RETURN p_tenant_id = get_current_tenant_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function untuk audit logging (untuk track RLS violations)
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_table_name VARCHAR(100),
    p_user_id UUID DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
BEGIN
    -- Simple logging function - bisa diperluas dengan proper audit table
    RAISE NOTICE 'SECURITY EVENT: % on table % by user % (tenant %) - Details: %',
        p_event_type, p_table_name, 
        COALESCE(p_user_id::text, get_current_user_id()::text), 
        COALESCE(p_tenant_id::text, get_current_tenant_id()::text),
        p_details::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk safe tenant switch (dengan validation)
CREATE OR REPLACE FUNCTION safe_switch_tenant_context(p_new_tenant_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    can_switch BOOLEAN := FALSE;
BEGIN
    current_user_id := get_current_user_id();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No current user context set';
    END IF;
    
    -- Super admin dapat switch ke tenant manapun
    IF is_super_admin() THEN
        can_switch := TRUE;
    ELSE
        -- Regular user hanya bisa switch jika mereka member dari target tenant
        SELECT EXISTS(
            SELECT 1 FROM tenant_users 
            WHERE id = current_user_id 
            AND tenant_id = p_new_tenant_id
        ) INTO can_switch;
    END IF;
    
    IF can_switch THEN
        PERFORM set_config('app.current_tenant_id', p_new_tenant_id::text, FALSE);
        PERFORM log_security_event('TENANT_SWITCH', 'context', current_user_id, p_new_tenant_id);
        RETURN TRUE;
    ELSE
        PERFORM log_security_event('TENANT_SWITCH_DENIED', 'context', current_user_id, p_new_tenant_id);
        RAISE EXCEPTION 'Access denied: Cannot switch to tenant %', p_new_tenant_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PERFORMANCE OPTIMIZATION INDEXES FOR RLS
-- ========================================

-- Additional indexes untuk optimize RLS queries
CREATE INDEX IF NOT EXISTS idx_tenant_users_id_tenant_id ON tenant_users(id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id_active ON user_roles(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id_permission ON role_permissions(role_id, permission_id);

-- Partial indexes untuk common RLS patterns
CREATE INDEX IF NOT EXISTS idx_tenants_type_active ON tenants(type, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_system_roles ON user_roles(is_system_role, is_active) WHERE is_system_role = TRUE AND is_active = TRUE;

-- ========================================
-- DOCUMENTATION COMMENTS
-- ========================================

COMMENT ON FUNCTION set_current_user_context IS 'Set user context untuk RLS evaluation - digunakan oleh application layer';
COMMENT ON FUNCTION get_current_user_id IS 'Get current user ID dari session context';
COMMENT ON FUNCTION get_current_tenant_id IS 'Get current tenant ID dari session context';
COMMENT ON FUNCTION is_super_admin IS 'Check apakah current user adalah super administrator';
COMMENT ON FUNCTION has_system_permission IS 'Check apakah current user memiliki system-level permissions';
COMMENT ON FUNCTION validate_tenant_access IS 'Validate apakah user dapat mengakses specific tenant';
COMMENT ON FUNCTION safe_switch_tenant_context IS 'Safely switch tenant context dengan validation';
COMMENT ON FUNCTION log_security_event IS 'Log security events untuk audit trail';

-- Add table comments
COMMENT ON POLICY tenants_isolation_policy ON tenants IS 'RLS policy: Users can only access their own tenant data';
COMMENT ON POLICY tenant_users_isolation_policy ON tenant_users IS 'RLS policy: Users can only access users from same tenant';
COMMENT ON POLICY user_roles_isolation_policy ON user_roles IS 'RLS policy: Users can only access roles available to their tenant';
COMMENT ON POLICY role_permissions_isolation_policy ON role_permissions IS 'RLS policy: Users can only see role-permissions for accessible roles';
COMMENT ON POLICY user_role_assignments_isolation_policy ON user_role_assignments IS 'RLS policy: Users can only see role assignments within their tenant';

-- Security notice
DO $$
BEGIN
    RAISE NOTICE 'Row Level Security policies telah diaktifkan untuk tenant isolation.';
    RAISE NOTICE 'Gunakan set_current_user_context() untuk mengatur user context sebelum database operations.';
    RAISE NOTICE 'Super admin role dapat bypass semua RLS policies untuk management purposes.';
END $$;