-- ================================================================================================
-- GENERIC EVENT STORIES TABLE
-- ================================================================================================
-- This migration creates the generic event_stories table to replace wedding-specific story tables
-- Part of Phase 2.2 Database Transformation (TFD Implementation)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS event_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Association
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Story Classification
  story_type VARCHAR(100) NOT NULL CHECK (story_type IN (
    'timeline', 'narrative', 'gallery', 'testimonial', 'biography',
    'history', 'milestone', 'journey', 'achievement', 'custom'
  )),
  
  -- Story Identity
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  
  -- Timeline Data (for timeline stories)
  timeline_items JSONB DEFAULT '[]',
  
  -- Full Story Content
  full_story TEXT,
  
  -- Story Media
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]',
  video_urls JSONB DEFAULT '[]',
  
  -- Story Configuration
  story_config JSONB DEFAULT '{
    "layout": "timeline",
    "theme": "default",
    "show_dates": true,
    "show_images": true,
    "animation": "fade",
    "read_more": false
  }',
  
  -- SEO and Sharing
  meta_description TEXT,
  social_share_image TEXT,
  
  -- Visibility and Display
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Publication
  published_at TIMESTAMPTZ,
  author_name VARCHAR(255),
  
  -- Story Metadata
  story_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_event_stories_event_id ON event_stories(event_id);
CREATE INDEX IF NOT EXISTS idx_event_stories_tenant_id ON event_stories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_stories_type ON event_stories(story_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_stories_tenant_event ON event_stories(tenant_id, event_id);
CREATE INDEX IF NOT EXISTS idx_event_stories_visible ON event_stories(tenant_id, is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_event_stories_featured ON event_stories(tenant_id, is_featured, published_at);
CREATE INDEX IF NOT EXISTS idx_event_stories_published ON event_stories(published_at DESC) WHERE is_visible = true;

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_event_stories_search ON event_stories USING gin(to_tsvector('english', title || ' ' || COALESCE(subtitle, '') || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_event_stories_full_search ON event_stories USING gin(to_tsvector('english', title || ' ' || COALESCE(full_story, ''))) WHERE full_story IS NOT NULL;

-- JSONB indexes for timeline and metadata queries
CREATE INDEX IF NOT EXISTS idx_event_stories_timeline ON event_stories USING gin(timeline_items);
CREATE INDEX IF NOT EXISTS idx_event_stories_metadata ON event_stories USING gin(story_metadata);

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================================================

ALTER TABLE event_stories ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see their own tenant data
CREATE POLICY event_stories_tenant_policy ON event_stories
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = auth.jwt() ->> 'tenant_id'::UUID
  );

-- Policy for service role to access all data
CREATE POLICY event_stories_service_policy ON event_stories
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_stories_update_trigger
  BEFORE UPDATE ON event_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_event_stories_updated_at();

-- Trigger to auto-set published_at when is_visible changes to true
CREATE OR REPLACE FUNCTION auto_set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when story becomes visible for the first time
  IF NEW.is_visible = true AND (OLD.is_visible = false OR OLD.published_at IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  
  -- Clear published_at when story becomes invisible
  IF NEW.is_visible = false AND OLD.is_visible = true THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_stories_published_trigger
  BEFORE UPDATE ON event_stories
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_published_at();

-- ================================================================================================
-- WEDDING COMPATIBILITY VIEW (BACKWARD COMPATIBILITY)
-- ================================================================================================

-- Create view that mimics old wedding_love_story structure
CREATE OR REPLACE VIEW wedding_love_story AS
SELECT 
  id,
  event_id,
  tenant_id,
  title,
  subtitle,
  description,
  timeline_items,
  full_story,
  
  -- Extract story configuration
  story_config->>'layout' as story_layout,
  (story_config->>'show_dates')::boolean as show_timeline_dates,
  (story_config->>'show_images')::boolean as show_timeline_images,
  
  -- Media
  featured_image as hero_image,
  gallery_images as story_images,
  
  -- Status and timestamps
  is_visible,
  display_order,
  created_at,
  updated_at
  
FROM event_stories 
WHERE story_type = 'timeline';

-- ================================================================================================
-- HELPER FUNCTIONS FOR STORY MANAGEMENT
-- ================================================================================================

-- Function to get stories by type for an event
CREATE OR REPLACE FUNCTION get_event_stories_by_type(p_event_id UUID, p_story_type VARCHAR)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  subtitle VARCHAR,
  description TEXT,
  timeline_items JSONB,
  full_story TEXT,
  story_config JSONB,
  is_featured BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.title,
    es.subtitle,
    es.description,
    es.timeline_items,
    es.full_story,
    es.story_config,
    es.is_featured,
    es.display_order
  FROM event_stories es
  WHERE es.event_id = p_event_id 
    AND es.story_type = p_story_type
    AND es.is_visible = true
  ORDER BY es.display_order, es.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all published stories for an event
CREATE OR REPLACE FUNCTION get_published_event_stories(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  story_type VARCHAR,
  title VARCHAR,
  subtitle VARCHAR,
  timeline_items JSONB,
  full_story TEXT,
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.story_type,
    es.title,
    es.subtitle,
    es.timeline_items,
    es.full_story,
    es.featured_image,
    es.published_at,
    es.display_order
  FROM event_stories es
  WHERE es.event_id = p_event_id 
    AND es.is_visible = true
    AND es.published_at IS NOT NULL
  ORDER BY es.display_order, es.published_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add timeline item
CREATE OR REPLACE FUNCTION add_timeline_item(
  p_story_id UUID,
  p_year VARCHAR,
  p_title VARCHAR,
  p_description TEXT,
  p_image_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_item JSONB;
  v_timeline JSONB;
BEGIN
  -- Build new timeline item
  v_new_item := jsonb_build_object(
    'year', p_year,
    'title', p_title,
    'description', p_description,
    'image_url', p_image_url,
    'created_at', NOW()
  );
  
  -- Get current timeline
  SELECT timeline_items INTO v_timeline 
  FROM event_stories 
  WHERE id = p_story_id;
  
  -- Add new item to timeline
  v_timeline := COALESCE(v_timeline, '[]'::jsonb) || v_new_item;
  
  -- Update story with new timeline
  UPDATE event_stories 
  SET 
    timeline_items = v_timeline,
    updated_at = NOW()
  WHERE id = p_story_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create wedding love story
CREATE OR REPLACE FUNCTION create_wedding_love_story(
  p_event_id UUID,
  p_tenant_id UUID,
  p_title VARCHAR DEFAULT 'Kisah Cinta Kami',
  p_subtitle VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_full_story TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_story_id UUID;
  v_story_config JSONB;
BEGIN
  -- Build story configuration
  v_story_config := jsonb_build_object(
    'layout', 'timeline',
    'theme', 'romantic',
    'show_dates', true,
    'show_images', true,
    'animation', 'fade',
    'read_more', true
  );
  
  -- Insert event story
  INSERT INTO event_stories (
    event_id, tenant_id, story_type, title, subtitle, description, 
    full_story, story_config, is_visible, display_order
  ) VALUES (
    p_event_id, p_tenant_id, 'timeline', p_title, p_subtitle, p_description,
    p_full_story, v_story_config, true, 1
  ) RETURNING id INTO v_story_id;
  
  RETURN v_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update story timeline
CREATE OR REPLACE FUNCTION update_story_timeline(
  p_story_id UUID,
  p_timeline_items JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE event_stories 
  SET 
    timeline_items = p_timeline_items,
    updated_at = NOW()
  WHERE id = p_story_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================================
-- COMMENTS AND DOCUMENTATION
-- ================================================================================================

COMMENT ON TABLE event_stories IS 'Generic stories table supporting timelines, narratives, and testimonials for all event types';
COMMENT ON COLUMN event_stories.story_type IS 'Type of story: timeline, narrative, gallery, testimonial, biography, etc.';
COMMENT ON COLUMN event_stories.timeline_items IS 'JSONB array of timeline events with dates, titles, descriptions, and images';
COMMENT ON COLUMN event_stories.story_config IS 'UI configuration for story presentation and layout';
COMMENT ON COLUMN event_stories.story_metadata IS 'Additional metadata for event-specific story data';

COMMENT ON VIEW wedding_love_story IS 'Backward compatibility view that presents event_stories data in wedding_love_story format';

COMMENT ON FUNCTION get_event_stories_by_type IS 'Helper function to retrieve stories by type for an event';
COMMENT ON FUNCTION get_published_event_stories IS 'Helper function to retrieve all published stories for an event';
COMMENT ON FUNCTION add_timeline_item IS 'Helper function to add a new timeline item to a story';
COMMENT ON FUNCTION create_wedding_love_story IS 'Helper function to create wedding-style love story';
COMMENT ON FUNCTION update_story_timeline IS 'Helper function to update story timeline items';