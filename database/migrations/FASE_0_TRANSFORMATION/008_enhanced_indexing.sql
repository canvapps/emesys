-- PHASE 4: MIGRATION 008 - Enhanced Performance Indexing
-- ===============================================
-- Purpose: Add performance-optimized indexes untuk generic event system
-- Impact: PERFORMANCE - Query optimization untuk <50ms targets
-- Rollback: DROP specific indexes
-- Test Requirements: Validate query performance improvements

BEGIN;

-- Migration log entry
INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
    'migration_008_enhanced_indexing',
    'started',
    CURRENT_TIMESTAMP,
    jsonb_build_object(
        'description', 'Enhanced performance indexing untuk generic events',
        'target_performance', '<50ms',
        'impact', 'performance'
    )
);

-- Composite indexes untuk common query patterns
-- Event listing dengan filtering
CREATE INDEX idx_events_tenant_status_date ON events(tenant_id, status, event_date) 
WHERE status IN ('published', 'draft');

CREATE INDEX idx_events_type_tenant_date ON events(event_type_id, tenant_id, event_date DESC);

-- RSVP and participant queries
CREATE INDEX idx_participants_event_status ON event_participants(event_id, rsvp_status);
CREATE INDEX idx_participants_tenant_type ON event_participants(tenant_id, participant_type, created_at DESC);

-- Section ordering and display
CREATE INDEX idx_sections_event_order ON event_sections(event_id, display_order, is_visible)
WHERE is_visible = TRUE;

-- Template selection queries
CREATE INDEX idx_templates_type_public_rating ON event_templates(event_type_id, is_public, rating DESC)
WHERE is_public = TRUE;

-- Search and filtering indexes
CREATE INDEX idx_events_title_search ON events USING gin(to_tsvector('english', title));
CREATE INDEX idx_events_description_search ON events USING gin(to_tsvector('english', description))
WHERE description IS NOT NULL;

-- JSON field indexes untuk dynamic queries
CREATE INDEX idx_events_form_data_gin ON events USING gin(form_data);
CREATE INDEX idx_participants_contact_gin ON event_participants USING gin(contact_info);
CREATE INDEX idx_participants_custom_gin ON event_participants USING gin(custom_fields);

-- Specific JSON field indexes untuk wedding compatibility
CREATE INDEX idx_events_bride_name ON events((form_data->>'bride_name'))
WHERE form_data->>'bride_name' IS NOT NULL;

CREATE INDEX idx_events_groom_name ON events((form_data->>'groom_name'))
WHERE form_data->>'groom_name' IS NOT NULL;

CREATE INDEX idx_events_venue ON events((location->>'venue'))
WHERE location->>'venue' IS NOT NULL;

-- Migration tracking indexes
CREATE INDEX idx_events_legacy_mapping ON events(legacy_id, legacy_table)
WHERE legacy_id IS NOT NULL;

-- Tenant isolation optimization
CREATE INDEX idx_events_tenant_created ON events(tenant_id, created_at DESC);
CREATE INDEX idx_participants_tenant_created ON event_participants(tenant_id, created_at DESC);
CREATE INDEX idx_sections_tenant_created ON event_sections(tenant_id, created_at DESC);
CREATE INDEX idx_templates_tenant_created ON event_templates(tenant_id, created_at DESC);

-- Update migration log
UPDATE migration_logs 
SET status = 'completed', 
    completed_at = CURRENT_TIMESTAMP,
    metadata = metadata || jsonb_build_object(
        'indexes_added', 15,
        'gin_indexes', 5,
        'composite_indexes', 8
    )
WHERE operation = 'migration_008_enhanced_indexing';

COMMIT;