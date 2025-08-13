# Generic Event Model Architecture

## Overview
Desain komprehensif untuk **Event Management Engine** yang dapat menangani berbagai jenis event (wedding, seminar, conference, birthday, corporate events, dll) melalui plugin architecture dan dynamic form system.

---

## Core Architecture Principles

### **1. Plugin-Based Event Types** 🔌
- Setiap event type adalah plugin dengan konfigurasi sendiri
- Dynamic form schema untuk custom fields
- Extensible permission system per event type
- Backward compatibility dengan existing wedding data

### **2. Multi-Tenant Foundation** 🏢
- Semua existing multi-tenant architecture retained
- Event isolation per tenant
- Tenant-specific plugin configurations
- Performance optimized untuk multi-tenant queries

### **3. Dynamic Form System** 📋
- JSON-based form schema configuration
- Runtime form generation
- Validation engine untuk custom fields
- Export/import capabilities untuk form templates

---

## Database Schema Design

### **🔥 CORE: Event Types Table**
**Plugin architecture foundation**

```sql
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,              -- 'wedding', 'conference', 'seminar'
    display_name VARCHAR(150) NOT NULL,             -- 'Wedding Celebration'
    description TEXT,
    category VARCHAR(50) NOT NULL,                  -- 'social', 'business', 'educational'
    
    -- Plugin Configuration
    plugin_config JSONB DEFAULT '{}',              -- Plugin-specific settings
    form_schema JSONB DEFAULT '{}',                -- Dynamic form configuration
    validation_rules JSONB DEFAULT '{}',           -- Form validation rules
    
    -- UI Configuration  
    ui_config JSONB DEFAULT '{}',                  -- Colors, icons, layout
    default_sections JSONB DEFAULT '[]',           -- Default event sections
    
    -- Permission System
    default_permissions JSONB DEFAULT '[]',        -- Permissions untuk event type
    required_roles JSONB DEFAULT '[]',            -- Required roles untuk create event
    
    -- Status & Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_system_type BOOLEAN DEFAULT FALSE,          -- Built-in vs custom
    is_premium BOOLEAN DEFAULT FALSE,              -- Premium feature flag
    sort_order INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES tenant_users(id)
);

-- Indexes untuk performance
CREATE INDEX idx_event_types_active ON event_types(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_event_types_category ON event_types(category, is_active);
CREATE INDEX idx_event_types_system ON event_types(is_system_type);
```

### **🎯 CORE: Events Table**  
**Main event entity dengan multi-tenant isolation**

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type_id UUID NOT NULL REFERENCES event_types(id),
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255), -- URL-friendly identifier
    
    -- Event Timing
    event_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
    is_all_day BOOLEAN DEFAULT FALSE,
    
    -- Location (Flexible)
    location JSONB DEFAULT '{}',                   -- address, coordinates, venue details
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link TEXT,
    
    -- Dynamic Data
    form_data JSONB DEFAULT '{}',                  -- Dynamic form responses
    custom_fields JSONB DEFAULT '{}',             -- Additional custom data
    settings JSONB DEFAULT '{}',                  -- Event-specific settings
    
    -- Content & Media
    cover_image TEXT,
    gallery JSONB DEFAULT '[]',                   -- Image/video gallery
    documents JSONB DEFAULT '[]',                 -- Related documents
    
    -- Status & Workflow  
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'planning', 'published', 'active', 
        'completed', 'cancelled', 'postponed'
    )),
    visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN (
        'private', 'public', 'unlisted', 'password_protected'
    )),
    password_hash TEXT, -- For password protection
    
    -- Statistics & Analytics
    view_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    rsvp_count INTEGER DEFAULT 0,
    
    -- Audit Trail
    created_by UUID NOT NULL REFERENCES tenant_users(id),
    updated_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT ck_end_date_after_start CHECK (end_date IS NULL OR end_date > event_date),
    CONSTRAINT ck_slug_format CHECK (slug IS NULL OR slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT ck_password_with_protection CHECK (
        visibility != 'password_protected' OR password_hash IS NOT NULL
    )
);

-- Comprehensive indexing untuk performance
CREATE INDEX idx_events_tenant_status ON events(tenant_id, status);
CREATE INDEX idx_events_tenant_type ON events(tenant_id, event_type_id);
CREATE INDEX idx_events_type_status ON events(event_type_id, status);
CREATE INDEX idx_events_date_range ON events(event_date, end_date) WHERE status = 'published';
CREATE INDEX idx_events_slug ON events(tenant_id, slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX idx_events_unique_slug ON events(tenant_id, slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_events_visibility ON events(visibility, status);

-- Full-text search index
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('indonesian', title || ' ' || COALESCE(description, '')));

-- JSONB indexes untuk dynamic data
CREATE INDEX idx_events_form_data ON events USING gin(form_data);
CREATE INDEX idx_events_location ON events USING gin(location);
```

### **👥 CORE: Event Participants**
**Generic participant management untuk semua event types**

```sql
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Participant Classification
    participant_type VARCHAR(100) NOT NULL,        -- 'guest', 'speaker', 'organizer', 'vendor', etc.
    participant_category VARCHAR(100),             -- 'vip', 'regular', 'sponsor', etc.
    role VARCHAR(100),                             -- Specific role dalam event
    
    -- Contact Information
    contact_info JSONB NOT NULL,                   -- name, email, phone, etc.
    additional_contacts JSONB DEFAULT '[]',        -- Emergency contacts, etc.
    
    -- Dynamic Custom Fields (per event type)
    custom_fields JSONB DEFAULT '{}',             -- Event-type specific data
    preferences JSONB DEFAULT '{}',               -- Dietary, accessibility, etc.
    
    -- RSVP & Status Management
    invitation_status VARCHAR(50) DEFAULT 'pending' CHECK (invitation_status IN (
        'pending', 'sent', 'delivered', 'bounced', 'failed'
    )),
    rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN (
        'pending', 'accepted', 'declined', 'tentative', 'no_response'
    )),
    attendance_status VARCHAR(50) DEFAULT 'unknown' CHECK (attendance_status IN (
        'unknown', 'present', 'absent', 'partial'
    )),
    
    -- Communication & Tracking
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    rsvp_date TIMESTAMP WITH TIME ZONE,
    rsvp_response JSONB DEFAULT '{}',             -- Detailed RSVP responses
    last_communication TIMESTAMP WITH TIME ZONE,
    communication_log JSONB DEFAULT '[]',          -- Communication history
    
    -- Plus One / Companions
    plus_one_allowed BOOLEAN DEFAULT FALSE,
    plus_one_count INTEGER DEFAULT 0,
    companions JSONB DEFAULT '[]',                -- Companion details
    
    -- Access & Security
    access_code VARCHAR(100),                     -- Unique access code
    qr_code TEXT,                                 -- QR code untuk check-in
    special_instructions TEXT,
    
    -- Metadata
    tags JSONB DEFAULT '[]',                      -- Flexible tagging
    priority INTEGER DEFAULT 0,                   -- Priority level
    notes TEXT,                                   -- Internal notes
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES tenant_users(id),
    
    -- Constraints
    CONSTRAINT ck_plus_one_logic CHECK (
        NOT plus_one_allowed OR plus_one_count >= 0
    ),
    CONSTRAINT ck_contact_info_required CHECK (
        contact_info ? 'name' AND contact_info ? 'email'
    )
);

-- Performance indexes
CREATE INDEX idx_participants_event_type ON event_participants(event_id, participant_type);
CREATE INDEX idx_participants_status ON event_participants(event_id, rsvp_status, attendance_status);
CREATE INDEX idx_participants_contact ON event_participants USING gin(contact_info);
CREATE INDEX idx_participants_custom ON event_participants USING gin(custom_fields);
CREATE INDEX idx_participants_access_code ON event_participants(access_code) WHERE access_code IS NOT NULL;

-- Email lookup untuk communication
CREATE INDEX idx_participants_email ON event_participants((contact_info->>'email')) WHERE contact_info ? 'email';
```

### **📋 EXTENSION: Event Sections** 
**Modular event content management**

```sql
CREATE TABLE event_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Section Configuration
    section_type VARCHAR(100) NOT NULL,           -- 'invitation', 'agenda', 'gallery', 'rsvp'
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,                   -- URL segment
    description TEXT,
    
    -- Content Management
    content JSONB NOT NULL DEFAULT '{}',         -- Section content
    template_config JSONB DEFAULT '{}',          -- Template configuration
    style_config JSONB DEFAULT '{}',            -- Styling configuration
    
    -- Layout & Display
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    responsive_config JSONB DEFAULT '{}',        -- Mobile/tablet configurations
    
    -- Access Control
    access_level VARCHAR(50) DEFAULT 'public' CHECK (access_level IN (
        'public', 'participants_only', 'rsvp_only', 'custom'
    )),
    custom_access_rules JSONB DEFAULT '{}',
    
    -- SEO & Metadata
    meta_title VARCHAR(200),
    meta_description TEXT,
    og_image TEXT,                               -- Open Graph image
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES tenant_users(id),
    
    -- Constraints
    CONSTRAINT unique_event_section_slug UNIQUE (event_id, slug),
    CONSTRAINT ck_section_slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_event_sections_event_order ON event_sections(event_id, display_order, is_visible);
CREATE INDEX idx_event_sections_type ON event_sections(section_type, is_enabled);
CREATE INDEX idx_event_sections_content ON event_sections USING gin(content);
```

### **🎨 EXTENSION: Event Templates**
**Generic template system untuk different event types**

```sql
CREATE TABLE event_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type_id UUID NOT NULL REFERENCES event_types(id),
    
    -- Template Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),                       -- 'elegant', 'modern', 'traditional', etc.
    
    -- Template Data
    template_data JSONB NOT NULL,               -- Complete template structure
    default_sections JSONB DEFAULT '[]',        -- Default sections untuk template
    form_schema JSONB DEFAULT '{}',            -- Form schema for template
    
    -- Visual Preview
    preview_image TEXT,
    thumbnail_image TEXT,
    demo_url TEXT,
    
    -- Access & Distribution
    is_public BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_system_template BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0,
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    compatible_versions JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '{}',
    
    -- Audit
    created_by UUID REFERENCES tenant_users(id),
    updated_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ck_price_non_negative CHECK (price >= 0),
    CONSTRAINT ck_rating_range CHECK (rating_average >= 0 AND rating_average <= 5)
);

-- Indexes
CREATE INDEX idx_templates_type_public ON event_templates(event_type_id, is_public, is_premium);
CREATE INDEX idx_templates_tenant ON event_templates(tenant_id, event_type_id);
CREATE INDEX idx_templates_usage ON event_templates(usage_count DESC, rating_average DESC);
CREATE INDEX idx_templates_tags ON event_templates USING gin(tags);
```

### **⚙️ PLUGIN: Configuration Management**
**Plugin-specific configurations per tenant**

```sql
CREATE TABLE plugin_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL REFERENCES event_types(name),
    
    -- Plugin Settings
    plugin_name VARCHAR(100) NOT NULL,
    configuration JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    integration_settings JSONB DEFAULT '{}',
    
    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,
    version VARCHAR(50),
    last_sync TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES tenant_users(id),
    
    -- Constraints
    CONSTRAINT unique_tenant_plugin UNIQUE (tenant_id, event_type, plugin_name)
);

-- Indexes
CREATE INDEX idx_plugin_configs_tenant_enabled ON plugin_configurations(tenant_id, is_enabled);
CREATE INDEX idx_plugin_configs_type ON plugin_configurations(event_type, is_enabled);
```

---

## Event Type Examples

### **💒 Wedding Plugin Configuration**
```json
{
  "name": "wedding",
  "display_name": "Wedding Celebration", 
  "category": "social",
  "plugin_config": {
    "features": ["rsvp", "gallery", "gift_registry", "timeline"],
    "integrations": ["google_calendar", "whatsapp", "email"],
    "max_participants": 1000
  },
  "form_schema": {
    "bride_name": {"type": "text", "required": true},
    "groom_name": {"type": "text", "required": true},
    "ceremony_time": {"type": "datetime", "required": true},
    "reception_venue": {"type": "textarea", "required": false}
  },
  "ui_config": {
    "primary_color": "#D4AF37",
    "theme": "elegant",
    "icons": ["rings", "heart", "flowers"]
  },
  "default_sections": [
    {"type": "cover", "title": "Welcome"},
    {"type": "story", "title": "Our Story"}, 
    {"type": "event_details", "title": "Event Details"},
    {"type": "rsvp", "title": "RSVP"},
    {"type": "gallery", "title": "Gallery"}
  ]
}
```

### **🎯 Conference Plugin Configuration**
```json
{
  "name": "conference",
  "display_name": "Professional Conference",
  "category": "business", 
  "plugin_config": {
    "features": ["agenda", "speakers", "sponsors", "networking"],
    "integrations": ["zoom", "teams", "linkedin", "eventbrite"],
    "max_participants": 10000
  },
  "form_schema": {
    "conference_title": {"type": "text", "required": true},
    "main_theme": {"type": "text", "required": true},
    "keynote_speakers": {"type": "array", "items": "speaker_info"},
    "session_tracks": {"type": "array", "items": "track_info"}
  },
  "ui_config": {
    "primary_color": "#1E40AF", 
    "theme": "professional",
    "icons": ["podium", "microphone", "users"]
  },
  "default_sections": [
    {"type": "hero", "title": "Conference Overview"},
    {"type": "agenda", "title": "Schedule & Agenda"},
    {"type": "speakers", "title": "Keynote Speakers"},
    {"type": "registration", "title": "Register Now"},
    {"type": "sponsors", "title": "Our Sponsors"}
  ]
}
```

---

## Migration Strategy

### **Phase 1: Foundation (Week 1)**
1. ✅ Create new generic tables dengan proper indexes
2. ✅ Insert default event types (wedding, conference, seminar)
3. ✅ Create migration utilities dan validation functions
4. ✅ Setup plugin configuration system

### **Phase 2: Data Migration (Week 2)**
1. 🔄 Migrate existing wedding data ke generic event structure
2. 🔄 Transform wedding templates ke generic template format
3. 🔄 Update existing users dan permissions
4. 🔄 Validate data integrity dan relationships

### **Phase 3: Application Updates (Week 3)**
1. ⏳ Update backend APIs untuk generic event handling
2. ⏳ Create plugin architecture framework
3. ⏳ Implement dynamic form system
4. ⏳ Update frontend untuk generic event management

---

## Success Metrics

### **✅ Technical KPIs**
- **Query Performance**: <50ms untuk all event queries
- **Plugin Loading**: <200ms untuk plugin initialization
- **Form Rendering**: <100ms untuk dynamic form generation
- **Multi-tenant Isolation**: 100% data segregation maintained

### **✅ Business KPIs**  
- **Backward Compatibility**: 100% existing wedding functionality preserved
- **Extensibility**: New event types addable dalam <1 day
- **User Experience**: Zero breaking changes untuk existing users
- **Performance**: No degradation dari current performance

---

**Status**: ✅ Generic Event Model Architecture Complete  
**Next**: Database Migration Strategy  
**Timeline**: Ready untuk implementation