-- ================================================================================================
-- GENERIC EVENT SECTIONS TABLE
-- ================================================================================================
-- This migration creates the generic event_sections table for flexible event structure management
-- Part of Phase 2.2 Database Transformation (TFD Implementation)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS event_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Association
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Section Configuration
  section_type VARCHAR(100) NOT NULL CHECK (section_type IN (
    'hero', 'participants', 'details', 'stories', 'gallery', 'rsvp', 
    'contact', 'location', 'schedule', 'gift_registry', 'faq', 
    'testimonials', 'sponsors', 'agenda', 'custom'
  )),
  
  -- Section Identity
  section_name VARCHAR(255) NOT NULL,
  section_title VARCHAR(255),
  section_subtitle VARCHAR(500),
  section_description TEXT,
  
  -- Section Layout and Display
  layout_type VARCHAR(50) DEFAULT 'default' CHECK (layout_type IN (
    'default', 'hero', 'timeline', 'grid', 'carousel', 'accordion', 
    'tabs', 'masonry', 'split', 'fullwidth', 'modal', 'sidebar'
  )),
  
  -- Section Configuration and Styling
  section_config JSONB DEFAULT '{
    "background": "transparent",
    "padding": "default",
    "margin": "default",
    "animation": "none",
    "responsive": true,
    "custom_css": ""
  }',
  
  -- Content Configuration
  content_config JSONB DEFAULT '{
    "max_items": null,
    "show_title": true,
    "show_subtitle": true,
    "show_description": true,
    "allow_comments": false,
    "enable_sharing": false
  }',
  
  -- Section Data Storage
  section_data JSONB DEFAULT '{}',
  
  -- Display Control
  is_enabled BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Responsive Configuration
  responsive_config JSONB DEFAULT '{
    "desktop": {"enabled": true, "order": 0},
    "tablet": {"enabled": true, "order": 0},
    "mobile": {"enabled": true, "order": 0}
  }',
  
  -- SEO Configuration
  seo_config JSONB DEFAULT '{
    "include_in_sitemap": true,
    "meta_title": null,
    "meta_description": null,
    "schema_markup": null
  }',
  
  -- Section Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_event_sections_event_id ON event_sections(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sections_tenant_id ON event_sections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_sections_type ON event_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_event_sections_layout ON event_sections(layout_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_sections_tenant_event ON event_sections(tenant_id, event_id);
CREATE INDEX IF NOT EXISTS idx_event_sections_enabled ON event_sections(tenant_id, is_enabled, is_visible);
CREATE INDEX IF NOT EXISTS idx_event_sections_order ON event_sections(event_id, display_order);
CREATE INDEX IF NOT EXISTS idx_event_sections_visible_order ON event_sections(event_id, is_visible, display_order);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_event_sections_search ON event_sections USING gin(to_tsvector('english', section_name || ' ' || COALESCE(section_title, '') || ' ' || COALESCE(section_description, '')));

-- JSONB indexes for configuration queries
CREATE INDEX IF NOT EXISTS idx_event_sections_config ON event_sections USING gin(section_config);
CREATE INDEX IF NOT EXISTS idx_event_sections_data ON event_sections USING gin(section_data);
CREATE INDEX IF NOT EXISTS idx_event_sections_metadata ON event_sections USING gin(metadata);

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================================================

ALTER TABLE event_sections ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see their own tenant data
CREATE POLICY event_sections_tenant_policy ON event_sections
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = auth.jwt() ->> 'tenant_id'::UUID
  );

-- Policy for service role to access all data
CREATE POLICY event_sections_service_policy ON event_sections
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_sections_update_trigger
  BEFORE UPDATE ON event_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_event_sections_updated_at();

-- ================================================================================================
-- HELPER FUNCTIONS FOR SECTION MANAGEMENT
-- ================================================================================================

-- Function to get sections by type for an event
CREATE OR REPLACE FUNCTION get_event_sections_by_type(p_event_id UUID, p_section_type VARCHAR)
RETURNS TABLE (
  id UUID,
  section_name VARCHAR,
  section_title VARCHAR,
  section_subtitle VARCHAR,
  layout_type VARCHAR,
  section_config JSONB,
  section_data JSONB,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.section_name,
    es.section_title,
    es.section_subtitle,
    es.layout_type,
    es.section_config,
    es.section_data,
    es.display_order
  FROM event_sections es
  WHERE es.event_id = p_event_id 
    AND es.section_type = p_section_type
    AND es.is_enabled = true
    AND es.is_visible = true
  ORDER BY es.display_order, es.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all visible sections for an event
CREATE OR REPLACE FUNCTION get_event_sections(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  section_type VARCHAR,
  section_name VARCHAR,
  section_title VARCHAR,
  layout_type VARCHAR,
  section_config JSONB,
  content_config JSONB,
  section_data JSONB,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.section_type,
    es.section_name,
    es.section_title,
    es.layout_type,
    es.section_config,
    es.content_config,
    es.section_data,
    es.display_order
  FROM event_sections es
  WHERE es.event_id = p_event_id 
    AND es.is_enabled = true
    AND es.is_visible = true
  ORDER BY es.display_order, es.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default wedding sections
CREATE OR REPLACE FUNCTION create_default_wedding_sections(
  p_event_id UUID,
  p_tenant_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_section_count INTEGER := 0;
  v_section_id UUID;
BEGIN
  -- Hero Section
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'hero', 'wedding_hero', 'Hero Wedding',
    'hero', 1, 
    '{"background": "image", "animation": "fade", "height": "fullscreen"}'
  );
  v_section_count := v_section_count + 1;
  
  -- Participants Section (Couple)
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'participants', 'couple_section', 'Mempelai',
    'split', 2,
    '{"background": "light", "animation": "slideInUp"}'
  );
  v_section_count := v_section_count + 1;
  
  -- Love Story Section
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'stories', 'love_story', 'Kisah Cinta Kami',
    'timeline', 3,
    '{"background": "white", "animation": "fadeInUp"}'
  );
  v_section_count := v_section_count + 1;
  
  -- Wedding Details Section
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'details', 'wedding_details', 'Detail Acara',
    'grid', 4,
    '{"background": "light", "animation": "fadeIn", "columns": 2}'
  );
  v_section_count := v_section_count + 1;
  
  -- Gallery Section
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'gallery', 'photo_gallery', 'Galeri Foto',
    'masonry', 5,
    '{"background": "dark", "animation": "zoomIn"}'
  );
  v_section_count := v_section_count + 1;
  
  -- RSVP Section
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'rsvp', 'rsvp_section', 'Konfirmasi Kehadiran',
    'default', 6,
    '{"background": "gradient", "animation": "slideInUp"}'
  );
  v_section_count := v_section_count + 1;
  
  -- Contact Section
  INSERT INTO event_sections (
    event_id, tenant_id, section_type, section_name, section_title,
    layout_type, display_order, section_config
  ) VALUES (
    p_event_id, p_tenant_id, 'contact', 'contact_section', 'Hubungi Kami',
    'default', 7,
    '{"background": "white", "animation": "fadeInUp"}'
  );
  v_section_count := v_section_count + 1;
  
  RETURN v_section_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update section configuration
CREATE OR REPLACE FUNCTION update_section_config(
  p_section_id UUID,
  p_config_updates JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE event_sections 
  SET 
    section_config = section_config || p_config_updates,
    updated_at = NOW()
  WHERE id = p_section_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder sections
CREATE OR REPLACE FUNCTION reorder_event_sections(
  p_event_id UUID,
  p_section_orders JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_section JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Loop through each section order update
  FOR v_section IN SELECT * FROM jsonb_array_elements(p_section_orders)
  LOOP
    UPDATE event_sections 
    SET 
      display_order = (v_section->>'order')::INTEGER,
      updated_at = NOW()
    WHERE id = (v_section->>'section_id')::UUID 
      AND event_id = p_event_id;
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================================
-- COMMENTS AND DOCUMENTATION
-- ================================================================================================

COMMENT ON TABLE event_sections IS 'Generic sections table for flexible event page structure management';
COMMENT ON COLUMN event_sections.section_type IS 'Type of section: hero, participants, details, stories, gallery, etc.';
COMMENT ON COLUMN event_sections.layout_type IS 'Layout template: default, hero, timeline, grid, carousel, etc.';
COMMENT ON COLUMN event_sections.section_config IS 'UI configuration for section styling and behavior';
COMMENT ON COLUMN event_sections.content_config IS 'Content display configuration and limits';
COMMENT ON COLUMN event_sections.section_data IS 'Flexible JSONB storage for section-specific data';
COMMENT ON COLUMN event_sections.responsive_config IS 'Responsive behavior configuration for different screen sizes';

COMMENT ON FUNCTION get_event_sections_by_type IS 'Helper function to retrieve sections by type for an event';
COMMENT ON FUNCTION get_event_sections IS 'Helper function to retrieve all visible sections for an event';
COMMENT ON FUNCTION create_default_wedding_sections IS 'Helper function to create default wedding page sections';
COMMENT ON FUNCTION update_section_config IS 'Helper function to update section configuration';
COMMENT ON FUNCTION reorder_event_sections IS 'Helper function to reorder sections for an event';