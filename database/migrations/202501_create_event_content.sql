-- ================================================================================================
-- GENERIC EVENT CONTENT TABLE  
-- ================================================================================================
-- This migration creates the generic event_content table to replace wedding-specific content tables
-- Part of Phase 2.2 Database Transformation (TFD Implementation)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS event_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Association
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Content Classification
  content_type VARCHAR(100) NOT NULL CHECK (content_type IN (
    'info', 'instructions', 'requirements', 'guidelines', 'rules',
    'dress_code', 'health_protocol', 'schedule', 'agenda', 'faq',
    'gift_registry', 'rsvp_info', 'contact_info', 'custom'
  )),
  
  -- Content Information
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  
  -- Flexible Content Data
  content_data JSONB NOT NULL DEFAULT '{}',
  
  -- Display Configuration
  display_config JSONB DEFAULT '{
    "layout": "default",
    "style": "standard", 
    "show_icons": true,
    "show_title": true,
    "show_subtitle": true,
    "custom_fields": {}
  }',
  
  -- Visibility and Ordering
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Content Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_event_content_event_id ON event_content(event_id);
CREATE INDEX IF NOT EXISTS idx_event_content_tenant_id ON event_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_content_type ON event_content(content_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_content_tenant_event ON event_content(tenant_id, event_id);
CREATE INDEX IF NOT EXISTS idx_event_content_visible ON event_content(tenant_id, is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_event_content_order ON event_content(event_id, display_order);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_event_content_search ON event_content USING gin(to_tsvector('english', title || ' ' || COALESCE(subtitle, '') || ' ' || COALESCE(description, '')));

-- JSONB indexes for content data queries
CREATE INDEX IF NOT EXISTS idx_event_content_data ON event_content USING gin(content_data);

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================================================

ALTER TABLE event_content ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see their own tenant data
CREATE POLICY event_content_tenant_policy ON event_content
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = auth.jwt() ->> 'tenant_id'::UUID
  );

-- Policy for service role to access all data  
CREATE POLICY event_content_service_policy ON event_content
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_content_update_trigger
  BEFORE UPDATE ON event_content
  FOR EACH ROW
  EXECUTE FUNCTION update_event_content_updated_at();

-- ================================================================================================
-- WEDDING COMPATIBILITY VIEW (BACKWARD COMPATIBILITY)  
-- ================================================================================================

-- Create view that mimics old wedding_important_info structure
CREATE OR REPLACE VIEW wedding_important_info AS
SELECT 
  id,
  event_id,
  tenant_id,
  title,
  
  -- Extract dress code information from content_data
  content_data->>'dress_code_title' as dress_code_title,
  content_data->>'dress_code_description' as dress_code_description,
  
  -- Extract health protocol information from content_data  
  content_data->>'health_protocol_title' as health_protocol_title,
  content_data->>'health_protocol_description' as health_protocol_description,
  
  -- Extract additional information
  content_data->>'additional_info' as additional_info,
  
  -- Extract download invitation settings
  COALESCE((content_data->>'download_invitation_enabled')::boolean, false) as download_invitation_enabled,
  content_data->>'download_invitation_text' as download_invitation_text,
  
  -- Status and timestamps
  is_visible,
  created_at,
  updated_at
  
FROM event_content 
WHERE content_type = 'instructions';

-- ================================================================================================
-- HELPER FUNCTIONS FOR CONTENT MANAGEMENT
-- ================================================================================================

-- Function to get content by type for an event
CREATE OR REPLACE FUNCTION get_event_content_by_type(p_event_id UUID, p_content_type VARCHAR)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  subtitle VARCHAR,
  description TEXT,
  content_data JSONB,
  display_config JSONB,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.title,
    ec.subtitle,
    ec.description,
    ec.content_data,
    ec.display_config,
    ec.display_order
  FROM event_content ec
  WHERE ec.event_id = p_event_id 
    AND ec.content_type = p_content_type
    AND ec.is_visible = true
  ORDER BY ec.display_order, ec.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update content data
CREATE OR REPLACE FUNCTION update_event_content_data(
  p_content_id UUID,
  p_data_updates JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE event_content 
  SET 
    content_data = content_data || p_data_updates,
    updated_at = NOW()
  WHERE id = p_content_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create wedding-style important info
CREATE OR REPLACE FUNCTION create_wedding_important_info(
  p_event_id UUID,
  p_tenant_id UUID,
  p_title VARCHAR DEFAULT 'Informasi Penting',
  p_dress_code_title VARCHAR DEFAULT NULL,
  p_dress_code_desc TEXT DEFAULT NULL,
  p_health_protocol_title VARCHAR DEFAULT NULL,
  p_health_protocol_desc TEXT DEFAULT NULL,
  p_additional_info TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_content_id UUID;
  v_content_data JSONB;
BEGIN
  -- Build content data
  v_content_data := jsonb_build_object(
    'dress_code_title', p_dress_code_title,
    'dress_code_description', p_dress_code_desc,
    'health_protocol_title', p_health_protocol_title,
    'health_protocol_description', p_health_protocol_desc,
    'additional_info', p_additional_info,
    'download_invitation_enabled', false,
    'download_invitation_text', 'Download Invitation'
  );
  
  -- Insert event content
  INSERT INTO event_content (
    event_id, tenant_id, content_type, title, content_data
  ) VALUES (
    p_event_id, p_tenant_id, 'instructions', p_title, v_content_data
  ) RETURNING id INTO v_content_id;
  
  RETURN v_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================================
-- COMMENTS AND DOCUMENTATION
-- ================================================================================================

COMMENT ON TABLE event_content IS 'Generic content table supporting all event types with flexible JSONB storage';
COMMENT ON COLUMN event_content.content_type IS 'Type of content: info, instructions, requirements, dress_code, etc.';
COMMENT ON COLUMN event_content.content_data IS 'Flexible JSONB storage for event-type specific content data';
COMMENT ON COLUMN event_content.display_config IS 'UI configuration for content presentation';

COMMENT ON VIEW wedding_important_info IS 'Backward compatibility view that presents event_content data in wedding_important_info format';

COMMENT ON FUNCTION get_event_content_by_type IS 'Helper function to retrieve content by type for an event';
COMMENT ON FUNCTION update_event_content_data IS 'Helper function to update content data using JSONB merge';
COMMENT ON FUNCTION create_wedding_important_info IS 'Helper function to create wedding-style important info content';