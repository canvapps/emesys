-- PHASE 4: MIGRATION 010 - Wedding Data Migration to Generic Events
-- ===============================================
-- Purpose: Migrate existing wedding data to new generic event structure
-- Impact: DATA MIGRATION - Preserves all existing data with backward compatibility
-- Rollback: Restore from backup tables
-- Test Requirements: Validate data integrity and completeness

BEGIN;

-- Migration log entry
INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
    'migration_010_wedding_data_migration',
    'started',
    CURRENT_TIMESTAMP,
    jsonb_build_object(
        'description', 'Migrate wedding data to generic event structure',
        'impact', 'data_migration',
        'backward_compatible', true
    )
);

-- Step 1: Create backup tables
CREATE TABLE IF NOT EXISTS wedding_invitations_backup AS SELECT * FROM wedding_invitations;
CREATE TABLE IF NOT EXISTS wedding_guests_backup AS SELECT * FROM wedding_guests;
CREATE TABLE IF NOT EXISTS wedding_templates_backup AS SELECT * FROM wedding_templates;

-- Get wedding event type ID
DO $$
DECLARE
    wedding_type_id UUID;
    migrated_events INTEGER := 0;
    migrated_participants INTEGER := 0;
    migrated_templates INTEGER := 0;
    migrated_sections INTEGER := 0;
BEGIN
    -- Get wedding event type ID
    SELECT id INTO wedding_type_id FROM event_types WHERE name = 'wedding';
    
    IF wedding_type_id IS NULL THEN
        RAISE EXCEPTION 'Wedding event type not found. Run migration 006 first.';
    END IF;
    
    -- Step 2: Migrate wedding invitations to events
    INSERT INTO events (
        id,
        event_type_id,
        title,
        description,
        event_date,
        event_time,
        location,
        form_data,
        status,
        visibility,
        slug,
        meta_title,
        meta_description,
        social_image_url,
        tenant_id,
        created_by,
        created_at,
        updated_at,
        published_at,
        legacy_id,
        legacy_table
    )
    SELECT 
        wi.id,
        wedding_type_id,
        wi.title,
        wi.description,
        wi.wedding_date,
        wi.ceremony_time,
        jsonb_build_object(
            'venue', COALESCE(wi.venue_name, ''),
            'address', COALESCE(wi.venue_address, ''),
            'coordinates', COALESCE(wi.venue_coordinates, '{}')
        ),
        jsonb_build_object(
            'bride_name', COALESCE(wi.bride_name, ''),
            'groom_name', COALESCE(wi.groom_name, ''),
            'reception_time', COALESCE(wi.reception_time, ''),
            'ceremony_time', COALESCE(wi.ceremony_time::text, '')
        ),
        COALESCE(wi.status, 'draft'),
        COALESCE(wi.visibility, 'private'),
        wi.slug,
        wi.meta_title,
        wi.meta_description,
        wi.social_image_url,
        wi.tenant_id,
        wi.created_by,
        wi.created_at,
        wi.updated_at,
        wi.published_at,
        wi.id, -- Store original ID for rollback
        'wedding_invitations'
    FROM wedding_invitations_backup wi
    WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.legacy_id = wi.id);
    
    GET DIAGNOSTICS migrated_events = ROW_COUNT;
    
    -- Step 3: Migrate wedding guests to event_participants
    INSERT INTO event_participants (
        id,
        event_id,
        participant_type,
        contact_info,
        custom_fields,
        rsvp_status,
        invitation_sent_at,
        rsvp_date,
        rsvp_notes,
        special_requirements,
        attendance_confirmed,
        tenant_id,
        created_at,
        updated_at
    )
    SELECT 
        uuid_generate_v4(), -- New UUID for participants
        e.id, -- Reference to migrated event
        'guest',
        jsonb_build_object(
            'name', COALESCE(wg.guest_name, ''),
            'email', COALESCE(wg.guest_email, ''),
            'phone', COALESCE(wg.guest_phone, '')
        ),
        jsonb_build_object(
            'plus_one_name', COALESCE(wg.plus_one_name, ''),
            'table_assignment', COALESCE(wg.table_number, ''),
            'meal_preference', COALESCE(wg.meal_preference, '')
        ),
        CASE wg.rsvp_status
            WHEN 'yes' THEN 'accepted'
            WHEN 'no' THEN 'declined'
            WHEN 'maybe' THEN 'tentative'
            ELSE 'pending'
        END,
        wg.invitation_sent_at,
        wg.rsvp_date,
        wg.rsvp_notes,
        wg.special_requirements,
        COALESCE(wg.attendance_confirmed, false),
        wg.tenant_id,
        wg.created_at,
        wg.updated_at
    FROM wedding_guests_backup wg
    JOIN events e ON e.legacy_id = wg.wedding_invitation_id
    WHERE NOT EXISTS (
        SELECT 1 FROM event_participants ep 
        WHERE ep.event_id = e.id 
        AND ep.contact_info->>'email' = wg.guest_email
        AND ep.contact_info->>'name' = wg.guest_name
    );
    
    GET DIAGNOSTICS migrated_participants = ROW_COUNT;
    
    -- Step 4: Migrate wedding templates to event_templates
    INSERT INTO event_templates (
        id,
        event_type_id,
        name,
        description,
        template_data,
        is_public,
        is_premium,
        tenant_id,
        usage_count,
        rating,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        wt.id,
        wedding_type_id,
        wt.template_name,
        wt.description,
        jsonb_build_object(
            'layout', COALESCE(wt.layout_config, '{}'),
            'colors', COALESCE(wt.color_scheme, '{}'),
            'fonts', COALESCE(wt.font_config, '{}'),
            'sections', COALESCE(wt.sections_config, '{}')
        ),
        COALESCE(wt.is_public, false),
        COALESCE(wt.is_premium, false),
        wt.tenant_id,
        COALESCE(wt.usage_count, 0),
        COALESCE(wt.rating, 0),
        wt.created_by,
        wt.created_at,
        wt.updated_at
    FROM wedding_templates wt
    WHERE NOT EXISTS (SELECT 1 FROM event_templates et WHERE et.id = wt.id);
    
    GET DIAGNOSTICS migrated_templates = ROW_COUNT;
    
    -- Step 5: Create default event sections untuk migrated weddings
    INSERT INTO event_sections (
        event_id,
        section_type,
        title,
        subtitle,
        content,
        is_visible,
        display_order,
        tenant_id,
        created_at,
        updated_at
    )
    SELECT 
        e.id,
        'couple_info',
        CONCAT(e.form_data->>'bride_name', ' & ', e.form_data->>'groom_name'),
        'Our Wedding',
        jsonb_build_object(
            'bride_name', e.form_data->>'bride_name',
            'groom_name', e.form_data->>'groom_name',
            'wedding_date', e.event_date,
            'venue', e.location->>'venue'
        ),
        true,
        1,
        e.tenant_id,
        e.created_at,
        e.updated_at
    FROM events e
    JOIN event_types et ON et.id = e.event_type_id
    WHERE et.name = 'wedding'
    AND NOT EXISTS (
        SELECT 1 FROM event_sections es 
        WHERE es.event_id = e.id AND es.section_type = 'couple_info'
    );
    
    -- Create ceremony section
    INSERT INTO event_sections (
        event_id,
        section_type,
        title,
        subtitle,
        content,
        is_visible,
        display_order,
        tenant_id,
        created_at,
        updated_at
    )
    SELECT 
        e.id,
        'ceremony',
        'Wedding Ceremony',
        'Join us for our special day',
        jsonb_build_object(
            'time', COALESCE(e.form_data->>'ceremony_time', e.event_time::text),
            'venue', e.location->>'venue',
            'address', e.location->>'address'
        ),
        true,
        2,
        e.tenant_id,
        e.created_at,
        e.updated_at
    FROM events e
    JOIN event_types et ON et.id = e.event_type_id
    WHERE et.name = 'wedding'
    AND NOT EXISTS (
        SELECT 1 FROM event_sections es 
        WHERE es.event_id = e.id AND es.section_type = 'ceremony'
    );
    
    -- Create reception section
    INSERT INTO event_sections (
        event_id,
        section_type,
        title,
        subtitle,
        content,
        is_visible,
        display_order,
        tenant_id,
        created_at,
        updated_at
    )
    SELECT 
        e.id,
        'reception',
        'Wedding Reception',
        'Celebrate with us after the ceremony',
        jsonb_build_object(
            'time', COALESCE(e.form_data->>'reception_time', '18:00'),
            'venue', e.location->>'venue',
            'address', e.location->>'address'
        ),
        true,
        3,
        e.tenant_id,
        e.created_at,
        e.updated_at
    FROM events e
    JOIN event_types et ON et.id = e.event_type_id
    WHERE et.name = 'wedding'
    AND NOT EXISTS (
        SELECT 1 FROM event_sections es 
        WHERE es.event_id = e.id AND es.section_type = 'reception'
    );
    
    GET DIAGNOSTICS migrated_sections = ROW_COUNT;
    
    -- Update migration log with results
    UPDATE migration_logs 
    SET 
        status = 'completed', 
        completed_at = CURRENT_TIMESTAMP,
        records_migrated = migrated_events + migrated_participants + migrated_templates,
        metadata = metadata || jsonb_build_object(
            'migrated_events', migrated_events,
            'migrated_participants', migrated_participants,  
            'migrated_templates', migrated_templates,
            'created_sections', migrated_sections,
            'backup_tables_created', 3
        )
    WHERE operation = 'migration_010_wedding_data_migration';
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Events migrated: %', migrated_events;
    RAISE NOTICE '- Participants migrated: %', migrated_participants;
    RAISE NOTICE '- Templates migrated: %', migrated_templates;
    RAISE NOTICE '- Sections created: %', migrated_sections;
END $$;

COMMIT;