-- ================================================================================================
-- BACKWARD COMPATIBILITY VIEWS
-- ================================================================================================
-- This migration creates views that maintain backward compatibility with legacy wedding tables
-- Part of Phase 2.2 Database Transformation (TFD Implementation)
-- SAFE MIGRATION: Ensures existing code continues to work without modification
-- ================================================================================================

-- ================================================================================================
-- WEDDING_HERO_SETTINGS COMPATIBILITY VIEW
-- ================================================================================================

-- First, ensure we have the base table structure (if not created already)
CREATE TABLE IF NOT EXISTS event_hero_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL DEFAULT 'wedding',
  primary_participants TEXT[] DEFAULT '{}',
  event_date DATE,
  event_time TIME,
  primary_venue JSONB DEFAULT '{}',
  secondary_venue JSONB DEFAULT '{}',
  hero_content JSONB DEFAULT '{}',
  countdown_enabled BOOLEAN DEFAULT true,
  hero_metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compatibility view for wedding_hero_settings
CREATE OR REPLACE VIEW wedding_hero_settings AS
SELECT 
  ehs.id,
  ehs.event_id,
  ehs.tenant_id,
  
  -- Extract participant names
  COALESCE(ehs.primary_participants[1], '') as groom_name,
  COALESCE(ehs.primary_participants[2], '') as bride_name,
  
  -- Date and time
  ehs.event_date as wedding_date,
  ehs.event_time as wedding_time,
  
  -- Venue information
  ehs.primary_venue->>'name' as ceremony_venue_name,
  ehs.primary_venue->>'address' as ceremony_venue_address,
  ehs.secondary_venue->>'name' as reception_venue_name,
  ehs.secondary_venue->>'address' as reception_venue_address,
  
  -- Hero content
  ehs.hero_content->>'subtitle' as hero_subtitle,
  ehs.hero_content->>'description' as hero_description,
  ehs.hero_content->>'background_image' as hero_background_image,
  
  -- Settings
  ehs.countdown_enabled,
  
  -- Status and timestamps
  ehs.is_active,
  ehs.created_at,
  ehs.updated_at
  
FROM event_hero_settings ehs
WHERE ehs.event_type = 'wedding';

-- ================================================================================================
-- LEGACY WEDDING TABLE VIEWS (Already created in individual migrations, but consolidated here)
-- ================================================================================================

-- Ensure wedding_couple_info view exists (consolidated version)
DROP VIEW IF EXISTS wedding_couple_info CASCADE;
CREATE OR REPLACE VIEW wedding_couple_info AS
SELECT 
  -- Use event_id as the main ID for wedding compatibility
  event_id as id,
  tenant_id,
  
  -- Groom information (participant_role = 'groom')
  MAX(CASE WHEN participant_role = 'groom' THEN participant_name END) as groom_name,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_full_name END) as groom_full_name,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_parents END) as groom_parents,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_profession END) as groom_profession,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_education END) as groom_education,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_hobbies END) as groom_hobbies,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_description END) as groom_description,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_image_url END) as groom_image_url,
  
  -- Bride information (participant_role = 'bride') 
  MAX(CASE WHEN participant_role = 'bride' THEN participant_name END) as bride_name,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_full_name END) as bride_full_name,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_parents END) as bride_parents,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_profession END) as bride_profession,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_education END) as bride_education,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_hobbies END) as bride_hobbies,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_description END) as bride_description,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_image_url END) as bride_image_url,
  
  -- General information
  bool_and(is_active) as is_active,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
  
FROM event_participants 
WHERE participant_role IN ('bride', 'groom')
  AND participant_type = 'primary'
GROUP BY event_id, tenant_id
HAVING COUNT(DISTINCT participant_role) = 2; -- Ensure both bride and groom exist

-- Ensure wedding_love_story view exists
DROP VIEW IF EXISTS wedding_love_story CASCADE;
CREATE OR REPLACE VIEW wedding_love_story AS
SELECT 
  es.id,
  es.event_id,
  es.tenant_id,
  es.title,
  es.subtitle,
  es.description,
  es.timeline_items,
  es.full_story,
  
  -- Extract story configuration
  es.story_config->>'layout' as story_layout,
  COALESCE((es.story_config->>'show_dates')::boolean, true) as show_timeline_dates,
  COALESCE((es.story_config->>'show_images')::boolean, true) as show_timeline_images,
  
  -- Media
  es.featured_image as hero_image,
  es.gallery_images as story_images,
  
  -- Status and timestamps
  es.is_visible,
  es.display_order,
  es.created_at,
  es.updated_at
  
FROM event_stories es
WHERE es.story_type = 'timeline'
  AND es.story_metadata->>'type' = 'wedding';

-- Ensure wedding_important_info view exists
DROP VIEW IF EXISTS wedding_important_info CASCADE;
CREATE OR REPLACE VIEW wedding_important_info AS
SELECT 
  ec.id,
  ec.event_id,
  ec.tenant_id,
  ec.title,
  
  -- Extract dress code information from content_data
  ec.content_data->>'dress_code_title' as dress_code_title,
  ec.content_data->>'dress_code_description' as dress_code_description,
  
  -- Extract health protocol information from content_data  
  ec.content_data->>'health_protocol_title' as health_protocol_title,
  ec.content_data->>'health_protocol_description' as health_protocol_description,
  
  -- Extract additional information
  ec.content_data->>'additional_info' as additional_info,
  
  -- Extract download invitation settings
  COALESCE((ec.content_data->>'download_invitation_enabled')::boolean, false) as download_invitation_enabled,
  ec.content_data->>'download_invitation_text' as download_invitation_text,
  
  -- Status and timestamps
  ec.is_visible,
  ec.created_at,
  ec.updated_at
  
FROM event_content ec 
WHERE ec.content_type = 'instructions'
  AND ec.metadata->>'type' = 'wedding';

-- Create wedding_contact_info view
DROP VIEW IF EXISTS wedding_contact_info CASCADE;
CREATE OR REPLACE VIEW wedding_contact_info AS
SELECT 
  ec.id,
  ec.event_id,
  ec.tenant_id,
  
  -- Extract contact information from content_data
  ec.content_data->>'help_title' as help_title,
  ec.content_data->>'help_description' as help_description,
  ec.content_data->>'whatsapp_number' as whatsapp_number,
  ec.content_data->>'whatsapp_text' as whatsapp_text,
  ec.content_data->>'email_address' as email_address,
  ec.content_data->>'email_text' as email_text,
  
  -- Status and timestamps
  ec.is_visible,
  ec.created_at,
  ec.updated_at
  
FROM event_content ec 
WHERE ec.content_type = 'contact_info'
  AND ec.metadata->>'type' = 'wedding';

-- Create wedding_footer_content view
DROP VIEW IF EXISTS wedding_footer_content CASCADE;
CREATE OR REPLACE VIEW wedding_footer_content AS
SELECT 
  ec.id,
  ec.event_id,
  ec.tenant_id,
  
  -- Extract footer information from content_data
  ec.content_data->>'couple_names' as couple_names,
  ec.content_data->>'wedding_date' as wedding_date,
  ec.content_data->>'footer_description' as footer_description,
  ec.content_data->>'contact_phone' as contact_phone,
  ec.content_data->>'contact_email' as contact_email,
  ec.content_data->>'contact_address' as contact_address,
  ec.content_data->>'thank_you_title' as thank_you_title,
  ec.content_data->>'thank_you_message' as thank_you_message,
  ec.content_data->'social_buttons' as social_buttons,
  ec.content_data->>'copyright_text' as copyright_text,
  
  -- Status and timestamps
  ec.is_visible,
  ec.created_at,
  ec.updated_at
  
FROM event_content ec 
WHERE ec.content_type = 'footer'
  AND ec.metadata->>'type' = 'wedding';

-- ================================================================================================
-- INSTEAD OF TRIGGERS FOR WRITE OPERATIONS
-- ================================================================================================
-- These triggers allow INSERT/UPDATE/DELETE operations on views to work with new tables

-- Trigger for wedding_couple_info INSERT/UPDATE
CREATE OR REPLACE FUNCTION wedding_couple_info_instead_of_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_groom_id UUID;
  v_bride_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Find or create event
    SELECT id INTO v_event_id 
    FROM events 
    WHERE tenant_id = NEW.tenant_id AND event_type = 'wedding'
    LIMIT 1;
    
    IF v_event_id IS NULL THEN
      INSERT INTO events (tenant_id, event_type, title)
      VALUES (NEW.tenant_id, 'wedding', CONCAT(NEW.bride_name, ' & ', NEW.groom_name))
      RETURNING id INTO v_event_id;
    END IF;
    
    -- Insert groom
    INSERT INTO event_participants (
      event_id, tenant_id, participant_type, participant_name, participant_full_name,
      participant_parents, participant_profession, participant_education, participant_hobbies,
      participant_description, participant_image_url, participant_role, participant_order,
      metadata, is_active
    ) VALUES (
      v_event_id, NEW.tenant_id, 'primary', NEW.groom_name, NEW.groom_full_name,
      NEW.groom_parents, NEW.groom_profession, NEW.groom_education, NEW.groom_hobbies,
      NEW.groom_description, NEW.groom_image_url, 'groom', 1,
      jsonb_build_object('type', 'wedding', 'role', 'groom'), NEW.is_active
    ) RETURNING id INTO v_groom_id;
    
    -- Insert bride
    INSERT INTO event_participants (
      event_id, tenant_id, participant_type, participant_name, participant_full_name,
      participant_parents, participant_profession, participant_education, participant_hobbies,
      participant_description, participant_image_url, participant_role, participant_order,
      metadata, is_active
    ) VALUES (
      v_event_id, NEW.tenant_id, 'primary', NEW.bride_name, NEW.bride_full_name,
      NEW.bride_parents, NEW.bride_profession, NEW.bride_education, NEW.bride_hobbies,
      NEW.bride_description, NEW.bride_image_url, 'bride', 2,
      jsonb_build_object('type', 'wedding', 'role', 'bride'), NEW.is_active
    ) RETURNING id INTO v_bride_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update groom
    UPDATE event_participants 
    SET 
      participant_name = NEW.groom_name,
      participant_full_name = NEW.groom_full_name,
      participant_parents = NEW.groom_parents,
      participant_profession = NEW.groom_profession,
      participant_education = NEW.groom_education,
      participant_hobbies = NEW.groom_hobbies,
      participant_description = NEW.groom_description,
      participant_image_url = NEW.groom_image_url,
      is_active = NEW.is_active,
      updated_at = NOW()
    WHERE event_id = NEW.id AND participant_role = 'groom';
    
    -- Update bride
    UPDATE event_participants 
    SET 
      participant_name = NEW.bride_name,
      participant_full_name = NEW.bride_full_name,
      participant_parents = NEW.bride_parents,
      participant_profession = NEW.bride_profession,
      participant_education = NEW.bride_education,
      participant_hobbies = NEW.bride_hobbies,
      participant_description = NEW.bride_description,
      participant_image_url = NEW.bride_image_url,
      is_active = NEW.is_active,
      updated_at = NOW()
    WHERE event_id = NEW.id AND participant_role = 'bride';
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete participants for this event
    DELETE FROM event_participants 
    WHERE event_id = OLD.id AND participant_role IN ('bride', 'groom');
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create INSTEAD OF triggers for wedding views
CREATE TRIGGER wedding_couple_info_instead_of_trigger
  INSTEAD OF INSERT OR UPDATE OR DELETE ON wedding_couple_info
  FOR EACH ROW EXECUTE FUNCTION wedding_couple_info_instead_of_trigger();

-- ================================================================================================
-- HELPER FUNCTIONS FOR BACKWARD COMPATIBILITY
-- ================================================================================================

-- Function to sync wedding data to new structure
CREATE OR REPLACE FUNCTION sync_wedding_to_generic_structure()
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
  v_count INTEGER;
BEGIN
  v_result := 'Wedding to Generic Structure Sync Report:' || CHR(10);
  
  -- Count synced records
  SELECT COUNT(*) INTO v_count FROM events WHERE event_type = 'wedding';
  v_result := v_result || '- Wedding Events: ' || v_count || CHR(10);
  
  SELECT COUNT(*) INTO v_count FROM event_participants WHERE participant_role IN ('bride', 'groom');
  v_result := v_result || '- Wedding Participants: ' || v_count || CHR(10);
  
  SELECT COUNT(*) INTO v_count FROM event_stories WHERE story_type = 'timeline';
  v_result := v_result || '- Wedding Stories: ' || v_count || CHR(10);
  
  SELECT COUNT(*) INTO v_count FROM event_content WHERE metadata->>'type' = 'wedding';
  v_result := v_result || '- Wedding Content: ' || v_count || CHR(10);
  
  SELECT COUNT(*) INTO v_count FROM event_sections WHERE metadata->>'type' = 'wedding';
  v_result := v_result || '- Wedding Sections: ' || v_count || CHR(10);
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================================
-- COMMENTS AND DOCUMENTATION
-- ================================================================================================

COMMENT ON VIEW wedding_couple_info IS 'Backward compatibility view for wedding_couple_info table using event_participants';
COMMENT ON VIEW wedding_love_story IS 'Backward compatibility view for wedding_love_story table using event_stories';
COMMENT ON VIEW wedding_important_info IS 'Backward compatibility view for wedding_important_info table using event_content';
COMMENT ON VIEW wedding_contact_info IS 'Backward compatibility view for wedding_contact_info table using event_content';
COMMENT ON VIEW wedding_footer_content IS 'Backward compatibility view for wedding_footer_content table using event_content';
COMMENT ON VIEW wedding_hero_settings IS 'Backward compatibility view for wedding_hero_settings table using event_hero_settings';

COMMENT ON FUNCTION sync_wedding_to_generic_structure IS 'Helper function to provide sync status report';

-- ================================================================================================
-- BACKWARD COMPATIBILITY VIEWS COMPLETED
-- ================================================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Backward compatibility views created successfully at %', NOW();
  RAISE NOTICE 'Legacy wedding table views are now available and fully functional';
  RAISE NOTICE 'All existing code should continue to work without modification';
END $$;