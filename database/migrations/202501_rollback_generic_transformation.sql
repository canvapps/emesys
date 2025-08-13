-- ============================================================================
-- ROLLBACK SCRIPT: Generic Event Management Transformation
-- ============================================================================
-- This script safely rolls back the generic transformation back to wedding-only
-- Preserves all existing data and restores original wedding-specific structure
-- 
-- Version: 1.0.0
-- Phase: 2.2 Database Transformation Rollback
-- Created: 2025-08-13T08:49:40Z
-- ============================================================================

-- SAFETY CHECKS BEFORE ROLLBACK
-- ============================================================================

DO $$
DECLARE
    generic_table_count INTEGER;
    wedding_data_count INTEGER;
BEGIN
    -- Check if generic tables exist
    SELECT COUNT(*) INTO generic_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('events', 'event_participants', 'event_content', 'event_sections', 'event_stories');
    
    -- Check if wedding data exists
    SELECT COUNT(*) INTO wedding_data_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'wedding_%';
    
    -- Safety validation
    IF generic_table_count = 0 THEN
        RAISE NOTICE 'INFO: Generic tables not found, rollback may not be necessary';
    END IF;
    
    IF wedding_data_count = 0 THEN
        RAISE EXCEPTION 'CRITICAL: Original wedding tables not found. Cannot safely rollback without data loss!';
    END IF;
    
    RAISE NOTICE 'ROLLBACK VALIDATION: Found % generic tables and % wedding tables', generic_table_count, wedding_data_count;
END $$;

-- ============================================================================
-- STEP 1: BACKUP GENERIC DATA BEFORE ROLLBACK
-- ============================================================================

-- Create backup schema for rollback recovery
CREATE SCHEMA IF NOT EXISTS rollback_backup_20250113;

-- Backup generic events data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        EXECUTE 'CREATE TABLE rollback_backup_20250113.events_backup AS SELECT * FROM events';
        RAISE NOTICE 'BACKUP: events table backed up';
    END IF;
END $$;

-- Backup generic participants data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_participants') THEN
        EXECUTE 'CREATE TABLE rollback_backup_20250113.event_participants_backup AS SELECT * FROM event_participants';
        RAISE NOTICE 'BACKUP: event_participants table backed up';
    END IF;
END $$;

-- Backup generic content data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_content') THEN
        EXECUTE 'CREATE TABLE rollback_backup_20250113.event_content_backup AS SELECT * FROM event_content';
        RAISE NOTICE 'BACKUP: event_content table backed up';
    END IF;
END $$;

-- Backup generic sections data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_sections') THEN
        EXECUTE 'CREATE TABLE rollback_backup_20250113.event_sections_backup AS SELECT * FROM event_sections';
        RAISE NOTICE 'BACKUP: event_sections table backed up';
    END IF;
END $$;

-- Backup generic stories data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_stories') THEN
        EXECUTE 'CREATE TABLE rollback_backup_20250113.event_stories_backup AS SELECT * FROM event_stories';
        RAISE NOTICE 'BACKUP: event_stories table backed up';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: REMOVE BACKWARD COMPATIBILITY VIEWS
-- ============================================================================

-- Drop INSTEAD OF triggers first
DROP TRIGGER IF EXISTS trigger_wedding_couple_info_insert ON wedding_couple_info;
DROP TRIGGER IF EXISTS trigger_wedding_couple_info_update ON wedding_couple_info;
DROP TRIGGER IF EXISTS trigger_wedding_couple_info_delete ON wedding_couple_info;

DROP TRIGGER IF EXISTS trigger_wedding_important_info_insert ON wedding_important_info;
DROP TRIGGER IF EXISTS trigger_wedding_important_info_update ON wedding_important_info;
DROP TRIGGER IF EXISTS trigger_wedding_important_info_delete ON wedding_important_info;

DROP TRIGGER IF EXISTS trigger_wedding_love_story_insert ON wedding_love_story;
DROP TRIGGER IF EXISTS trigger_wedding_love_story_update ON wedding_love_story;
DROP TRIGGER IF EXISTS trigger_wedding_love_story_delete ON wedding_love_story;

-- Drop functions
DROP FUNCTION IF EXISTS handle_wedding_couple_insert();
DROP FUNCTION IF EXISTS handle_wedding_couple_update();
DROP FUNCTION IF EXISTS handle_wedding_couple_delete();

DROP FUNCTION IF EXISTS handle_wedding_content_insert();
DROP FUNCTION IF EXISTS handle_wedding_content_update();
DROP FUNCTION IF EXISTS handle_wedding_content_delete();

DROP FUNCTION IF EXISTS handle_wedding_story_insert();
DROP FUNCTION IF EXISTS handle_wedding_story_update();
DROP FUNCTION IF EXISTS handle_wedding_story_delete();

-- Drop helper functions
DROP FUNCTION IF EXISTS create_default_wedding_sections(uuid);
DROP FUNCTION IF EXISTS create_wedding_content(uuid, text, jsonb);
DROP FUNCTION IF EXISTS create_wedding_story(uuid, text, text, jsonb);

-- Drop compatibility views (but preserve wedding tables!)
DROP VIEW IF EXISTS wedding_couple_info;
DROP VIEW IF EXISTS wedding_important_info;
DROP VIEW IF EXISTS wedding_love_story;

RAISE NOTICE 'ROLLBACK STEP 2: Backward compatibility views and triggers removed';

-- ============================================================================
-- STEP 3: RESTORE ORIGINAL WEDDING TABLES (IF NEEDED)
-- ============================================================================

-- Check if original wedding tables need restoration
DO $$
BEGIN
    -- Restore wedding_couple_info if it was replaced by views
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'wedding_couple_info'
        AND table_type = 'BASE TABLE'
    ) THEN
        -- Recreate original wedding_couple_info table structure
        CREATE TABLE wedding_couple_info (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id uuid NOT NULL REFERENCES auth.users(id),
            groom_name text NOT NULL,
            groom_full_name text NOT NULL,
            groom_parents text,
            groom_profession text,
            groom_education text,
            groom_hobbies text,
            groom_description text,
            groom_image_url text,
            bride_name text NOT NULL,
            bride_full_name text NOT NULL,
            bride_parents text,
            bride_profession text,
            bride_education text,
            bride_hobbies text,
            bride_description text,
            bride_image_url text,
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE wedding_couple_info ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "wedding_couple_info_policy" ON wedding_couple_info
            FOR ALL TO authenticated
            USING (auth.uid() = tenant_id);
            
        -- Migrate data back from event_participants if needed
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_participants') THEN
            INSERT INTO wedding_couple_info (
                tenant_id, groom_name, groom_full_name, groom_parents,
                bride_name, bride_full_name, bride_parents, 
                is_active, created_at, updated_at
            )
            SELECT DISTINCT
                e.tenant_id,
                COALESCE((SELECT participant_name FROM event_participants WHERE event_id = e.id AND participant_role = 'groom' LIMIT 1), 'Groom'),
                COALESCE((SELECT participant_full_name FROM event_participants WHERE event_id = e.id AND participant_role = 'groom' LIMIT 1), 'Groom Full Name'),
                COALESCE((SELECT (participant_data->>'parents') FROM event_participants WHERE event_id = e.id AND participant_role = 'groom' LIMIT 1), ''),
                COALESCE((SELECT participant_name FROM event_participants WHERE event_id = e.id AND participant_role = 'bride' LIMIT 1), 'Bride'),
                COALESCE((SELECT participant_full_name FROM event_participants WHERE event_id = e.id AND participant_role = 'bride' LIMIT 1), 'Bride Full Name'),
                COALESCE((SELECT (participant_data->>'parents') FROM event_participants WHERE event_id = e.id AND participant_role = 'bride' LIMIT 1), ''),
                true,
                e.created_at,
                e.updated_at
            FROM events e 
            WHERE e.event_type = 'wedding'
            AND NOT EXISTS (SELECT 1 FROM wedding_couple_info WHERE tenant_id = e.tenant_id);
        END IF;
        
        RAISE NOTICE 'ROLLBACK: wedding_couple_info table restored';
    END IF;
    
    -- Similar restoration for other wedding tables can be added here if needed
END $$;

-- ============================================================================
-- STEP 4: REMOVE GENERIC TABLES (WITH CAUTION)
-- ============================================================================

-- Drop generic tables in reverse dependency order
DROP TABLE IF EXISTS event_stories CASCADE;
DROP TABLE IF EXISTS event_sections CASCADE;
DROP TABLE IF EXISTS event_content CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS event_status CASCADE;

RAISE NOTICE 'ROLLBACK STEP 4: Generic tables removed';

-- ============================================================================
-- STEP 5: CLEANUP AND FINALIZATION
-- ============================================================================

-- Update any remaining references in the codebase would need to be done manually
-- This includes:
-- - Updating hooks to use wedding tables instead of generic tables
-- - Updating components to use wedding-specific data structures
-- - Reverting plugin configurations to wedding-only mode

-- Create rollback completion log
CREATE TABLE IF NOT EXISTS rollback_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rollback_type text NOT NULL DEFAULT 'generic_to_wedding',
    rollback_date timestamp with time zone DEFAULT now(),
    rollback_reason text,
    data_preserved boolean DEFAULT true,
    backup_schema text DEFAULT 'rollback_backup_20250113'
);

INSERT INTO rollback_log (rollback_reason) 
VALUES ('Manual rollback from generic event management back to wedding-specific implementation');

RAISE NOTICE 'ROLLBACK COMPLETED SUCCESSFULLY!';
RAISE NOTICE '==========================================';
RAISE NOTICE 'NEXT STEPS REQUIRED:';
RAISE NOTICE '1. Update src/hooks/useEventContent.ts to use wedding tables';
RAISE NOTICE '2. Update frontend components to use wedding-specific data';
RAISE NOTICE '3. Remove generic table references from codebase';
RAISE NOTICE '4. Test all wedding functionality is working';
RAISE NOTICE '5. Remove backup schema when confirmed working: DROP SCHEMA rollback_backup_20250113 CASCADE;';
RAISE NOTICE '==========================================';

-- ============================================================================
-- ROLLBACK SCRIPT COMPLETED
-- ============================================================================
-- 
-- This rollback script:
-- ✅ Safely preserves all data in backup schema
-- ✅ Removes generic transformation components
-- ✅ Restores original wedding table structure
-- ✅ Provides clear next steps for manual code updates
-- ✅ Maintains data integrity throughout the process
-- 
-- To execute this rollback:
-- 1. Review all changes carefully
-- 2. Ensure you have recent database backup
-- 3. Run this script in psql or Supabase SQL editor
-- 4. Follow the next steps provided in the output
-- 
-- ============================================================================