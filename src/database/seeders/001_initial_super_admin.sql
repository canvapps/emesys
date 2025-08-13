-- Seeder: Create Initial Super Admin User
-- Environment: development, production
-- Purpose: Setup initial super admin untuk bootstrap system

-- Insert Super Admin Tenant (System Tenant)
INSERT INTO tenants (name, type, status, subscription_plan, subscription_status, metadata)
VALUES (
    'System Admin',
    'super_admin',
    'active',
    'enterprise',
    'active',
    '{"type": "system", "created_by": "bootstrap"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Insert Super Admin User
WITH system_tenant AS (
    SELECT id FROM tenants WHERE name = 'System Admin' LIMIT 1
)
INSERT INTO tenant_users (
    tenant_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    email_verified_at,
    profile_data
)
SELECT
    st.id,
    'superadmin@weddinvite.com',
    '$2b$12$LQv3c1yqBwlT4w5GSY7My.LQv3c1yqBwlT4w5GSY7My.LQv3c1yqBw', -- Password: SuperAdmin123!
    'Super',
    'Administrator',
    'super_admin',
    'active',
    CURRENT_TIMESTAMP,
    '{"created_by": "bootstrap", "bypass_rls": true}'::jsonb
FROM system_tenant st
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Assign System Admin Role to Super Admin User
WITH system_tenant AS (
    SELECT id FROM tenants WHERE name = 'System Admin' LIMIT 1
),
super_admin_user AS (
    SELECT id FROM tenant_users WHERE email = 'superadmin@weddinvite.com' LIMIT 1
),
system_admin_role AS (
    SELECT id FROM user_roles WHERE name = 'system_admin' LIMIT 1
)
INSERT INTO user_role_assignments (user_id, role_id, assigned_by_user_id, is_active)
SELECT
    sau.id,
    sar.id,
    sau.id, -- Self-assigned
    true
FROM super_admin_user sau, system_admin_role sar
ON CONFLICT (user_id, role_id) DO NOTHING;