-- Seeder: Create Demo Tenant dan Sample Data
-- Environment: development
-- Purpose: Setup demo tenant untuk testing dan development

-- Create Demo Wedding Organizer Tenant
INSERT INTO tenants (name, type, status, subscription_plan, subscription_status, metadata)
VALUES (
    'Bali Dream Wedding',
    'wedding_agency',
    'active',
    'premium',
    'active',
    '{"type": "demo", "location": "Bali", "specialty": "beach_wedding", "created_by": "seeder"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Create Demo Admin User untuk tenant
WITH demo_tenant AS (
    SELECT id FROM tenants WHERE name = 'Bali Dream Wedding' LIMIT 1
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
    dt.id,
    'admin@balidreamwedding.com',
    '$2b$12$LQv3c1yqBwlT4w5GSY7My.Demo123Hash.Demo123Hash.Demo123', -- Password: DemoAdmin123!
    'Made',
    'Santika',
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    '{"department": "management", "created_by": "seeder"}'::jsonb
FROM demo_tenant dt
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Create Demo Designer User
WITH demo_tenant AS (
    SELECT id FROM tenants WHERE name = 'Bali Dream Wedding' LIMIT 1
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
    dt.id,
    'designer@balidreamwedding.com',
    '$2b$12$LQv3c1yqBwlT4w5GSY7My.Demo123Hash.Demo123Hash.Demo456', -- Password: Designer123!
    'Kadek',
    'Sari',
    'manager',
    'active',
    CURRENT_TIMESTAMP,
    '{"department": "creative", "specialty": "invitation_design", "created_by": "seeder"}'::jsonb
FROM demo_tenant dt
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Create Demo Customer Service User
WITH demo_tenant AS (
    SELECT id FROM tenants WHERE name = 'Bali Dream Wedding' LIMIT 1
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
    dt.id,
    'cs@balidreamwedding.com',
    '$2b$12$LQv3c1yqBwlT4w5GSY7My.Demo123Hash.Demo123Hash.Demo789', -- Password: Customer123!
    'Wayan',
    'Indira',
    'member',
    'active',
    CURRENT_TIMESTAMP,
    '{"department": "support", "languages": ["id", "en"], "created_by": "seeder"}'::jsonb
FROM demo_tenant dt
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Assign roles to demo users
WITH admin_user AS (
    SELECT id FROM tenant_users WHERE email = 'admin@balidreamwedding.com' LIMIT 1
),
designer_user AS (
    SELECT id FROM tenant_users WHERE email = 'designer@balidreamwedding.com' LIMIT 1
),
cs_user AS (
    SELECT id FROM tenant_users WHERE email = 'cs@balidreamwedding.com' LIMIT 1
),
tenant_admin_role AS (
    SELECT id FROM user_roles WHERE name = 'tenant_admin' LIMIT 1
),
content_creator_role AS (
    SELECT id FROM user_roles WHERE name = 'content_creator' LIMIT 1
),
viewer_role AS (
    SELECT id FROM user_roles WHERE name = 'viewer' LIMIT 1
)
INSERT INTO user_role_assignments (user_id, role_id, assigned_by_user_id, is_active)
SELECT * FROM (
    -- Admin user gets tenant_admin role
    SELECT au.id, tar.id, au.id, true FROM admin_user au, tenant_admin_role tar
    UNION ALL
    -- Designer user gets content_creator role
    SELECT du.id, ccr.id, (SELECT id FROM admin_user), true FROM designer_user du, content_creator_role ccr
    UNION ALL
    -- CS user gets viewer role
    SELECT cu.id, vr.id, (SELECT id FROM admin_user), true FROM cs_user cu, viewer_role vr
) AS role_assignments
ON CONFLICT (user_id, role_id) DO NOTHING;