-- PHASE 4: MIGRATION 007 - Generic Events Core Tables
-- ===============================================
-- Purpose: Create core generic event tables
-- Impact: ADDITIVE - Extends foundation with core tables
-- Rollback: DROP new tables, CASCADE handled properly
-- Test Requirements: Validate table relationships and constraints

BEGIN;

-- Migration log entry
INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
    'migration_007_events_core_tables',
    'started',
    CURRENT_TIMESTAMP,
    jsonb_build_object(
        'description', 'Create generic events core tables',
        'tables_created', ARRAY['events', 'event_participants', 'event_sections', 'event_templates'],
        'impact', 'additive'
    )
);

-- Create events table (main generic events table)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event identification
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    slug VARCHAR(200) UNIQUE,
    
    -- Event timing
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    timezone VARCHAR(100) DEFAULT 'UTC',
    
    -- Event location (flexible JSON structure)
    location JSONB DEFAULT '{}', -- {venue, address, coordinates, directions}
    
    -- Dynamic event data (plugin-specific fields)
    form_data JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    
    -- Event status and visibility
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
    
    -- Multi-tenant support
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- SEO and sharing
    meta_title VARCHAR(200),
    meta_description TEXT,
    social_image_url TEXT,
    
    -- Legacy support untuk backward compatibility
    legacy_id UUID, -- Reference ke wedding_invitations.id untuk rollback
    legacy_table VARCHAR(100), -- Track original table name
    
    -- Audit fields
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT events_title_length CHECK (LENGTH(title) >= 5),
    CONSTRAINT events_valid_date_range CHECK (end_date IS NULL OR end_date >= event_date),
    CONSTRAINT events_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$')
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_type VARCHAR(50) NOT NULL, -- guest, speaker, vendor, organizer, etc
    
    -- Contact information (flexible JSON structure)
    contact_info JSONB NOT NULL DEFAULT '{}', -- {name, email, phone, etc}
    
    -- Custom fields per event type
    custom_fields JSONB DEFAULT '{}',
    
    -- RSVP system
    rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    rsvp_date TIMESTAMP WITH TIME ZONE,
    rsvp_notes TEXT,
    
    -- Additional participant data
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    special_requirements TEXT,
    table_assignment VARCHAR(100),
    
    -- Multi-tenant support
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT participants_contact_info_required CHECK (jsonb_typeof(contact_info) = 'object' AND contact_info != '{}')
);

-- Create event_sections table
CREATE TABLE IF NOT EXISTS event_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Section identification
    section_type VARCHAR(100) NOT NULL, -- ceremony, reception, couple_info, gallery, etc
    title VARCHAR(300) NOT NULL,
    subtitle VARCHAR(500),
    
    -- Section content (flexible structure)
    content JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    
    -- Display settings
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Template and styling
    template_name VARCHAR(100),
    custom_css TEXT,
    
    -- Multi-tenant support
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT sections_title_length CHECK (LENGTH(title) >= 2),
    UNIQUE (event_id, section_type, display_order)
);

-- Create event_templates table
CREATE TABLE IF NOT EXISTS event_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Template data
    template_data JSONB NOT NULL DEFAULT '{}', -- Complete template structure
    preview_data JSONB DEFAULT '{}', -- Sample data untuk preview
    
    -- Template settings
    is_public BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_system_template BOOLEAN DEFAULT FALSE,
    
    -- Multi-tenant support
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL untuk system templates
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    
    -- Audit fields
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT templates_name_length CHECK (LENGTH(name) >= 3),
    CONSTRAINT templates_rating_range CHECK (rating >= 0 AND rating <= 5),
    UNIQUE (name, tenant_id) -- Same name allowed across tenants
);

-- Create comprehensive indexes
-- Events table indexes
CREATE INDEX idx_events_event_type_id ON events(event_type_id);
CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_legacy_id ON events(legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX idx_events_slug ON events(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_events_published ON events(published_at) WHERE published_at IS NOT NULL;

-- Event participants indexes
CREATE INDEX idx_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_participants_tenant_id ON event_participants(tenant_id);
CREATE INDEX idx_participants_type ON event_participants(participant_type);
CREATE INDEX idx_participants_rsvp_status ON event_participants(rsvp_status);
CREATE INDEX idx_participants_contact_email ON event_participants USING gin ((contact_info->>'email'));
CREATE INDEX idx_participants_invitation_sent ON event_participants(invitation_sent_at) WHERE invitation_sent_at IS NOT NULL;

-- Event sections indexes
CREATE INDEX idx_sections_event_id ON event_sections(event_id);
CREATE INDEX idx_sections_tenant_id ON event_sections(tenant_id);
CREATE INDEX idx_sections_type ON event_sections(section_type);
CREATE INDEX idx_sections_visible ON event_sections(is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_sections_display_order ON event_sections(event_id, display_order);

-- Event templates indexes
CREATE INDEX idx_templates_event_type_id ON event_templates(event_type_id);
CREATE INDEX idx_templates_tenant_id ON event_templates(tenant_id);
CREATE INDEX idx_templates_public ON event_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_templates_premium ON event_templates(is_premium) WHERE is_premium = TRUE;
CREATE INDEX idx_templates_usage_count ON event_templates(usage_count DESC);

-- Update migration log
UPDATE migration_logs 
SET status = 'completed', 
    completed_at = CURRENT_TIMESTAMP,
    records_migrated = 0,
    metadata = metadata || jsonb_build_object('indexes_created', 22)
WHERE operation = 'migration_007_events_core_tables';

COMMIT;