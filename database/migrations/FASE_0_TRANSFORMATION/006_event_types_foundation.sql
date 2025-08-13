-- PHASE 4: MIGRATION 006 - Create Event Types Foundation
-- ===============================================
-- Purpose: Setup generic event type system sebagai foundation
-- Impact: ADDITIVE - No existing functionality affected
-- Rollback: DROP new tables only
-- Test Requirements: Validate event type creation and constraints

BEGIN;

-- Migration log entry
INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
    'migration_006_event_types_foundation',
    'started',
    CURRENT_TIMESTAMP,
    jsonb_build_object(
        'description', 'Create generic event types foundation',
        'impact', 'additive',
        'breaking_changes', false
    )
);

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('social', 'corporate', 'educational', 'religious', 'cultural')),
    
    -- Configuration and features
    default_config JSONB DEFAULT '{}',
    required_fields JSONB DEFAULT '[]',
    optional_fields JSONB DEFAULT '[]',
    form_schema JSONB DEFAULT '{}',
    
    -- System configuration
    is_system_type BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Multi-tenant support
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT event_types_name_format CHECK (name ~ '^[a-z_]+$'),
    CONSTRAINT event_types_display_name_length CHECK (LENGTH(display_name) >= 3)
);

-- Create indexes
CREATE INDEX idx_event_types_name ON event_types(name);
CREATE INDEX idx_event_types_category ON event_types(category);
CREATE INDEX idx_event_types_tenant_id ON event_types(tenant_id);
CREATE INDEX idx_event_types_active ON event_types(is_active) WHERE is_active = TRUE;

-- Insert default wedding event type
INSERT INTO event_types (
    name, display_name, description, category,
    default_config, required_fields, optional_fields,
    is_system_type, is_active, created_at
) VALUES (
    'wedding',
    'Wedding Celebration',
    'Traditional wedding ceremony and reception events',
    'social',
    jsonb_build_object(
        'default_sections', ARRAY['ceremony', 'reception', 'couple_info'],
        'participant_types', ARRAY['guest', 'family', 'vendor'],
        'form_layout', 'traditional',
        'supports_rsvp', true,
        'supports_plus_one', true
    ),
    '["bride_name", "groom_name", "wedding_date", "venue_name"]'::jsonb,
    '["ceremony_time", "reception_time", "dress_code", "meal_preferences"]'::jsonb,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
);

-- Update migration log
UPDATE migration_logs 
SET status = 'completed', 
    completed_at = CURRENT_TIMESTAMP,
    records_migrated = 1
WHERE operation = 'migration_006_event_types_foundation';

COMMIT;