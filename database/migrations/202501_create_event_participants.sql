-- ================================================================================================
-- GENERIC EVENT PARTICIPANTS TABLE
-- ================================================================================================
-- This migration creates the generic event_participants table to replace wedding-specific tables
-- Part of Phase 2.2 Database Transformation (TFD Implementation)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Association
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Participant Information
  participant_type VARCHAR(50) NOT NULL CHECK (participant_type IN ('primary', 'secondary', 'organizer', 'guest', 'vendor', 'speaker', 'attendee')),
  participant_name VARCHAR(255) NOT NULL,
  participant_full_name VARCHAR(500),
  participant_parents TEXT, -- For wedding: "Father Name & Mother Name"
  participant_profession VARCHAR(255),
  participant_education VARCHAR(255),
  participant_hobbies TEXT,
  participant_description TEXT,
  participant_image_url TEXT,
  
  -- Role-specific Information (flexible for different event types)
  participant_role VARCHAR(100), -- 'bride', 'groom', 'speaker', 'host', 'performer', etc.
  participant_order INTEGER DEFAULT 0, -- Display order
  
  -- Contact Information  
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  social_instagram VARCHAR(100),
  social_facebook VARCHAR(100),
  social_twitter VARCHAR(100),
  social_linkedin VARCHAR(100),
  
  -- Metadata and Configuration
  metadata JSONB DEFAULT '{}',
  display_config JSONB DEFAULT '{}',
  
  -- Status and Visibility
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_tenant_id ON event_participants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_type ON event_participants(participant_type);
CREATE INDEX IF NOT EXISTS idx_event_participants_role ON event_participants(participant_role);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_participants_tenant_event ON event_participants(tenant_id, event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_active ON event_participants(tenant_id, is_active, is_visible);
CREATE INDEX IF NOT EXISTS idx_event_participants_order ON event_participants(event_id, participant_order);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_event_participants_name_search ON event_participants USING gin(to_tsvector('english', participant_name || ' ' || COALESCE(participant_full_name, '')));

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================================================

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see their own tenant data
CREATE POLICY event_participants_tenant_policy ON event_participants
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = auth.jwt() ->> 'tenant_id'::UUID
  );

-- Policy for service role to access all data
CREATE POLICY event_participants_service_policy ON event_participants
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_participants_update_trigger
  BEFORE UPDATE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participants_updated_at();

-- ================================================================================================
-- WEDDING COMPATIBILITY VIEW (BACKWARD COMPATIBILITY)
-- ================================================================================================

-- Create view that mimics old wedding_couple_info structure
CREATE OR REPLACE VIEW wedding_couple_info AS
SELECT 
  -- Use event_id as the main ID for wedding compatibility
  event_id as id,
  
  -- Groom information (participant_order = 1)
  MAX(CASE WHEN participant_role = 'groom' THEN participant_name END) as groom_name,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_full_name END) as groom_full_name,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_parents END) as groom_parents,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_profession END) as groom_profession,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_education END) as groom_education,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_hobbies END) as groom_hobbies,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_description END) as groom_description,
  MAX(CASE WHEN participant_role = 'groom' THEN participant_image_url END) as groom_image_url,
  
  -- Bride information (participant_order = 2) 
  MAX(CASE WHEN participant_role = 'bride' THEN participant_name END) as bride_name,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_full_name END) as bride_full_name,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_parents END) as bride_parents,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_profession END) as bride_profession,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_education END) as bride_education,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_hobbies END) as bride_hobbies,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_description END) as bride_description,
  MAX(CASE WHEN participant_role = 'bride' THEN participant_image_url END) as bride_image_url,
  
  -- General information
  tenant_id,
  bool_and(is_active) as is_active,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
  
FROM event_participants 
WHERE participant_role IN ('bride', 'groom')
  AND participant_type = 'primary'
GROUP BY event_id, tenant_id
HAVING COUNT(DISTINCT participant_role) = 2; -- Ensure both bride and groom exist

-- ================================================================================================
-- COMMENTS AND DOCUMENTATION
-- ================================================================================================

COMMENT ON TABLE event_participants IS 'Generic participants table supporting all event types (wedding, conference, birthday, etc.)';
COMMENT ON COLUMN event_participants.participant_type IS 'Type of participant: primary, secondary, organizer, guest, vendor, speaker, attendee';
COMMENT ON COLUMN event_participants.participant_role IS 'Event-specific role: bride, groom, speaker, host, performer, etc.';
COMMENT ON COLUMN event_participants.metadata IS 'Flexible JSON storage for event-type specific data';
COMMENT ON COLUMN event_participants.display_config IS 'UI configuration for how participant should be displayed';

COMMENT ON VIEW wedding_couple_info IS 'Backward compatibility view that presents event_participants data in wedding_couple_info format';