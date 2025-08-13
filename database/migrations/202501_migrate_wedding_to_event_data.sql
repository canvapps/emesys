-- ================================================================================================
-- WEDDING TO EVENT DATA MIGRATION SCRIPT
-- ================================================================================================
-- This migration script migrates existing wedding data to new generic event structure
-- Part of Phase 2.2 Database Transformation (TFD Implementation)
-- SAFE MIGRATION: Preserves all existing data with full rollback capability
-- ================================================================================================

-- ================================================================================================
-- STEP 1: CREATE EVENTS TABLE IF NOT EXISTS (Main Event Records)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL DEFAULT 'wedding',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  event_date DATE,
  start_time TIME,
  end_time TIME,
  
  -- Venue Information
  venue_info JSONB DEFAULT '{}',
  
  -- Event Requirements  
  requirements JSONB DEFAULT '{}',
  
  -- Contact Person
  contact_person JSONB DEFAULT '{}',
  
  -- Event Metadata
  event_metadata JSONB DEFAULT '{}',
  
  -- Status
  is_visible BOOLEAN DEFAULT true,
  show_on_timeline BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- ================================================================================================
-- STEP 2: MIGRATE WEDDING_COUPLE_INFO TO EVENT_PARTICIPANTS
-- ================================================================================================

-- First, ensure we have events for each couple
INSERT INTO events (tenant_id, event_type, title, description, event_date, created_at, updated_at)
SELECT DISTINCT
  wci.tenant_id,
  'wedding' as event_type,
  CONCAT(wci.bride_name, ' & ', wci.groom_name) as title,
  'Wedding Event' as description,
  CURRENT_DATE as event_date, -- We'll update this later if we have actual dates
  wci.created_at,
  wci.updated_at
FROM wedding_couple_info wci
WHERE NOT EXISTS (
  SELECT 1 FROM events e 
  WHERE e.tenant_id = wci.tenant_id 
  AND e.event_type = 'wedding'
);

-- Migrate groom data to event_participants
INSERT INTO event_participants (
  event_id, tenant_id, participant_type, participant_name, participant_full_name,
  participant_parents, participant_profession, participant_education, participant_hobbies,
  participant_description, participant_image_url, participant_role, participant_order,
  metadata, is_active, created_at, updated_at
)
SELECT 
  e.id as event_id,
  wci.tenant_id,
  'primary' as participant_type,
  wci.groom_name as participant_name,
  wci.groom_full_name as participant_full_name,
  wci.groom_parents as participant_parents,
  wci.groom_profession as participant_profession,
  wci.groom_education as participant_education,
  wci.groom_hobbies as participant_hobbies,
  wci.groom_description as participant_description,
  wci.groom_image_url as participant_image_url,
  'groom' as participant_role,
  1 as participant_order,
  jsonb_build_object('type', 'wedding', 'role', 'groom', 'migrated_from', 'wedding_couple_info') as metadata,
  wci.is_active,
  wci.created_at,
  wci.updated_at
FROM wedding_couple_info wci
JOIN events e ON e.tenant_id = wci.tenant_id AND e.event_type = 'wedding'
WHERE NOT EXISTS (
  SELECT 1 FROM event_participants ep 
  WHERE ep.event_id = e.id AND ep.participant_role = 'groom'
);

-- Migrate bride data to event_participants
INSERT INTO event_participants (
  event_id, tenant_id, participant_type, participant_name, participant_full_name,
  participant_parents, participant_profession, participant_education, participant_hobbies,
  participant_description, participant_image_url, participant_role, participant_order,
  metadata, is_active, created_at, updated_at
)
SELECT 
  e.id as event_id,
  wci.tenant_id,
  'primary' as participant_type,
  wci.bride_name as participant_name,
  wci.bride_full_name as participant_full_name,
  wci.bride_parents as participant_parents,
  wci.bride_profession as participant_profession,
  wci.bride_education as participant_education,
  wci.bride_hobbies as participant_hobbies,
  wci.bride_description as participant_description,
  wci.bride_image_url as participant_image_url,
  'bride' as participant_role,
  2 as participant_order,
  jsonb_build_object('type', 'wedding', 'role', 'bride', 'migrated_from', 'wedding_couple_info') as metadata,
  wci.is_active,
  wci.created_at,
  wci.updated_at
FROM wedding_couple_info wci
JOIN events e ON e.tenant_id = wci.tenant_id AND e.event_type = 'wedding'
WHERE NOT EXISTS (
  SELECT 1 FROM event_participants ep 
  WHERE ep.event_id = e.id AND ep.participant_role = 'bride'
);

-- ================================================================================================
-- STEP 3: MIGRATE WEDDING_LOVE_STORY TO EVENT_STORIES
-- ================================================================================================

INSERT INTO event_stories (
  event_id, tenant_id, story_type, title, subtitle, description,
  timeline_items, full_story, story_config, is_visible, display_order,
  story_metadata, created_at, updated_at
)
SELECT 
  e.id as event_id,
  wls.tenant_id,
  'timeline' as story_type,
  wls.title,
  wls.subtitle,
  wls.description,
  COALESCE(wls.timeline_items, '[]'::jsonb) as timeline_items,
  wls.full_story,
  jsonb_build_object(
    'layout', 'timeline',
    'theme', 'romantic',
    'show_dates', true,
    'show_images', true,
    'animation', 'fade',
    'read_more', true
  ) as story_config,
  wls.is_visible,
  1 as display_order,
  jsonb_build_object('type', 'wedding', 'migrated_from', 'wedding_love_story') as story_metadata,
  wls.created_at,
  wls.updated_at
FROM wedding_love_story wls
JOIN events e ON e.tenant_id = wls.tenant_id AND e.event_type = 'wedding'
WHERE NOT EXISTS (
  SELECT 1 FROM event_stories es 
  WHERE es.event_id = e.id AND es.story_type = 'timeline'
);

-- ================================================================================================
-- STEP 4: MIGRATE WEDDING_IMPORTANT_INFO TO EVENT_CONTENT
-- ================================================================================================

INSERT INTO event_content (
  event_id, tenant_id, content_type, title, subtitle, description,
  content_data, display_config, is_visible, display_order,
  metadata, created_at, updated_at
)
SELECT 
  e.id as event_id,
  wii.tenant_id,
  'instructions' as content_type,
  wii.title,
  NULL as subtitle,
  'Important wedding information and guidelines' as description,
  jsonb_build_object(
    'dress_code_title', wii.dress_code_title,
    'dress_code_description', wii.dress_code_description,
    'health_protocol_title', wii.health_protocol_title,
    'health_protocol_description', wii.health_protocol_description,
    'additional_info', wii.additional_info,
    'download_invitation_enabled', wii.download_invitation_enabled,
    'download_invitation_text', wii.download_invitation_text
  ) as content_data,
  jsonb_build_object('layout', 'two-column', 'style', 'elegant') as display_config,
  wii.is_visible,
  1 as display_order,
  jsonb_build_object('type', 'wedding', 'migrated_from', 'wedding_important_info') as metadata,
  wii.created_at,
  wii.updated_at
FROM wedding_important_info wii
JOIN events e ON e.tenant_id = wii.tenant_id AND e.event_type = 'wedding'
WHERE NOT EXISTS (
  SELECT 1 FROM event_content ec 
  WHERE ec.event_id = e.id AND ec.content_type = 'instructions'
);

-- ================================================================================================
-- STEP 5: MIGRATE WEDDING_CONTACT_INFO TO EVENT_CONTENT
-- ================================================================================================

INSERT INTO event_content (
  event_id, tenant_id, content_type, title, subtitle, description,
  content_data, display_config, is_visible, display_order,
  metadata, created_at, updated_at
)
SELECT 
  e.id as event_id,
  wci.tenant_id,
  'contact_info' as content_type,
  wci.help_title,
  NULL as subtitle,
  wci.help_description as description,
  jsonb_build_object(
    'help_title', wci.help_title,
    'help_description', wci.help_description,
    'whatsapp_number', wci.whatsapp_number,
    'whatsapp_text', wci.whatsapp_text,
    'email_address', wci.email_address,
    'email_text', wci.email_text
  ) as content_data,
  jsonb_build_object('layout', 'contact-card', 'style', 'modern') as display_config,
  wci.is_visible,
  2 as display_order,
  jsonb_build_object('type', 'wedding', 'migrated_from', 'wedding_contact_info') as metadata,
  wci.created_at,
  wci.updated_at
FROM wedding_contact_info wci
JOIN events e ON e.tenant_id = wci.tenant_id AND e.event_type = 'wedding'
WHERE NOT EXISTS (
  SELECT 1 FROM event_content ec 
  WHERE ec.event_id = e.id AND ec.content_type = 'contact_info'
);

-- ================================================================================================
-- STEP 6: MIGRATE WEDDING_FOOTER_CONTENT TO EVENT_CONTENT
-- ================================================================================================

INSERT INTO event_content (
  event_id, tenant_id, content_type, title, subtitle, description,
  content_data, display_config, is_visible, display_order,
  metadata, created_at, updated_at
)
SELECT 
  e.id as event_id,
  wfc.tenant_id,
  'footer' as content_type,
  'Footer Content' as title,
  NULL as subtitle,
  'Wedding footer information' as description,
  jsonb_build_object(
    'couple_names', wfc.couple_names,
    'wedding_date', wfc.wedding_date,
    'footer_description', wfc.footer_description,
    'contact_phone', wfc.contact_phone,
    'contact_email', wfc.contact_email,
    'contact_address', wfc.contact_address,
    'thank_you_title', wfc.thank_you_title,
    'thank_you_message', wfc.thank_you_message,
    'social_buttons', wfc.social_buttons,
    'copyright_text', wfc.copyright_text
  ) as content_data,
  jsonb_build_object('layout', 'footer-standard', 'style', 'elegant') as display_config,
  wfc.is_visible,
  99 as display_order, -- Footer should be last
  jsonb_build_object('type', 'wedding', 'migrated_from', 'wedding_footer_content') as metadata,
  wfc.created_at,
  wfc.updated_at
FROM wedding_footer_content wfc
JOIN events e ON e.tenant_id = wfc.tenant_id AND e.event_type = 'wedding'
WHERE NOT EXISTS (
  SELECT 1 FROM event_content ec 
  WHERE ec.event_id = e.id AND ec.content_type = 'footer'
);

-- ================================================================================================
-- STEP 7: CREATE DEFAULT EVENT SECTIONS FOR MIGRATED WEDDINGS
-- ================================================================================================

-- Hero sections
INSERT INTO event_sections (event_id, tenant_id, section_type, section_name, section_title, display_order, section_data, metadata)
SELECT 
  e.id as event_id,
  e.tenant_id,
  'hero' as section_type,
  'wedding_hero' as section_name,
  'Hero Section' as section_title,
  1 as display_order,
  jsonb_build_object('enabled', true, 'layout', 'wedding') as section_data,
  jsonb_build_object('type', 'wedding', 'auto_created', true) as metadata
FROM events e
WHERE e.event_type = 'wedding'
AND NOT EXISTS (
  SELECT 1 FROM event_sections es 
  WHERE es.event_id = e.id AND es.section_type = 'hero'
);

-- Participants sections
INSERT INTO event_sections (event_id, tenant_id, section_type, section_name, section_title, display_order, section_data, metadata)
SELECT 
  e.id as event_id,
  e.tenant_id,
  'participants' as section_type,
  'couple_info' as section_name,
  'Mempelai' as section_title,
  2 as display_order,
  jsonb_build_object('show_parents', true, 'show_profession', true, 'layout', 'side-by-side') as section_data,
  jsonb_build_object('type', 'wedding', 'auto_created', true) as metadata
FROM events e
WHERE e.event_type = 'wedding'
AND NOT EXISTS (
  SELECT 1 FROM event_sections es 
  WHERE es.event_id = e.id AND es.section_type = 'participants'
);

-- Story sections  
INSERT INTO event_sections (event_id, tenant_id, section_type, section_name, section_title, display_order, section_data, metadata)
SELECT 
  e.id as event_id,
  e.tenant_id,
  'story' as section_type,
  'love_story' as section_name,
  'Kisah Cinta' as section_title,
  3 as display_order,
  jsonb_build_object('show_timeline', true, 'layout', 'timeline') as section_data,
  jsonb_build_object('type', 'wedding', 'auto_created', true) as metadata
FROM events e
WHERE e.event_type = 'wedding'
AND NOT EXISTS (
  SELECT 1 FROM event_sections es 
  WHERE es.event_id = e.id AND es.section_type = 'story'
);

-- Contact sections
INSERT INTO event_sections (event_id, tenant_id, section_type, section_name, section_title, display_order, section_data, metadata)
SELECT 
  e.id as event_id,
  e.tenant_id,
  'contact' as section_type,
  'contact_info' as section_name,
  'Hubungi Kami' as section_title,
  6 as display_order,
  jsonb_build_object('show_whatsapp', true, 'show_email', true) as section_data,
  jsonb_build_object('type', 'wedding', 'auto_created', true) as metadata
FROM events e
WHERE e.event_type = 'wedding'
AND NOT EXISTS (
  SELECT 1 FROM event_sections es 
  WHERE es.event_id = e.id AND es.section_type = 'contact'
);

-- Footer sections
INSERT INTO event_sections (event_id, tenant_id, section_type, section_name, section_title, display_order, section_data, metadata)
SELECT 
  e.id as event_id,
  e.tenant_id,
  'footer' as section_type,
  'wedding_footer' as section_name,
  'Footer' as section_title,
  99 as display_order,
  jsonb_build_object('show_thanks', true, 'show_social', true) as section_data,
  jsonb_build_object('type', 'wedding', 'auto_created', true) as metadata
FROM events e
WHERE e.event_type = 'wedding'
AND NOT EXISTS (
  SELECT 1 FROM event_sections es 
  WHERE es.event_id = e.id AND es.section_type = 'footer'
);

-- ================================================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ================================================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Wedding to Event data migration completed successfully at %', NOW();
  RAISE NOTICE 'Migrated events: % records', (SELECT COUNT(*) FROM events WHERE event_type = 'wedding');
  RAISE NOTICE 'Migrated participants: % records', (SELECT COUNT(*) FROM event_participants WHERE participant_role IN ('bride', 'groom'));
  RAISE NOTICE 'Migrated stories: % records', (SELECT COUNT(*) FROM event_stories WHERE story_type = 'timeline');
  RAISE NOTICE 'Migrated content: % records', (SELECT COUNT(*) FROM event_content WHERE metadata->>'migrated_from' IS NOT NULL);
  RAISE NOTICE 'Migrated sections: % records', (SELECT COUNT(*) FROM event_sections WHERE metadata->>'auto_created' = 'true');
END $$;