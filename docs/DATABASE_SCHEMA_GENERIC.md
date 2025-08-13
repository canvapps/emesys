# 🗄️ **Generic Event Management Database Schema**

## 📋 **Overview**

This document describes the **generic event management database schema** designed to support multiple event types (weddings, conferences, birthdays, corporate events, etc.) through a **plugin-aware architecture**.

## 🏗️ **Core Architecture Principles**

### 1. **Multi-Tenant Support**
- All tables include `tenant_id` for data isolation
- Row Level Security (RLS) policies enforce tenant boundaries
- Supabase auth integration for secure access control

### 2. **Event-Type Agnostic Design**
- Generic table structures support any event type
- JSONB fields for flexible, event-type-specific data storage
- Plugin system maps event types to specific field structures

### 3. **Backward Compatibility**
- Legacy `wedding_*` table views maintain existing API compatibility
- INSTEAD OF triggers enable write operations on legacy views
- Seamless migration without breaking existing code

---

## 📋 **Core Tables**

### 🎯 **`events` Table**
**Purpose**: Central events registry supporting all event types

```sql
TABLE events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES auth.users(id),
    event_type text NOT NULL DEFAULT 'wedding',
    title text NOT NULL,
    subtitle text,
    description text,
    event_date date NOT NULL,
    event_time time,
    timezone text DEFAULT 'UTC',
    status event_status DEFAULT 'draft',
    settings jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- ✅ **Multi-event type support** via `event_type` field
- ✅ **Flexible settings** via JSONB for event-specific configurations
- ✅ **Status management** (draft, published, archived)
- ✅ **Timezone awareness** for global event coordination

---

### 👥 **`event_participants` Table**
**Purpose**: Generic participant management (replaces `wedding_couple_info`)

```sql
TABLE event_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES auth.users(id),
    participant_name text NOT NULL,
    participant_full_name text,
    participant_role text NOT NULL, -- 'bride', 'groom', 'speaker', 'organizer'
    participant_order integer DEFAULT 0,
    participant_data jsonb DEFAULT '{}',
    participant_image_url text,
    contact_info jsonb DEFAULT '{}',
    bio text,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- ✅ **Role-based participants** adaptable to any event type
- ✅ **Flexible participant data** via JSONB
- ✅ **Primary participant designation** for main event figures
- ✅ **Contact information** storage with structured data

**Wedding Plugin Mapping:**
```javascript
// Maps to legacy wedding_couple_info fields
participant_role: 'bride' | 'groom'
participant_name: bride_name | groom_name
participant_data: { parents: "...", family: "..." }
```

---

### 📝 **`event_content` Table**
**Purpose**: Flexible content management (replaces `wedding_important_info`)

```sql
TABLE event_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES auth.users(id),
    content_type text NOT NULL, -- 'instructions', 'requirements', 'contact'
    title text,
    content text,
    content_data jsonb DEFAULT '{}',
    display_order integer DEFAULT 0,
    is_published boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- ✅ **Multi-purpose content storage** (instructions, requirements, contact info)
- ✅ **Structured content data** via JSONB for complex layouts
- ✅ **Publishing control** with draft/published states
- ✅ **Display ordering** for content prioritization

**Wedding Plugin Mapping:**
```javascript
// Maps to legacy wedding_important_info structure
content_type: 'instructions' | 'requirements' | 'contact'
content: important_info_content
content_data: { dress_code: "...", gifts: "..." }
```

---

### 📱 **`event_sections` Table**
**Purpose**: Dynamic page section management with responsive configuration

```sql
TABLE event_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES auth.users(id),
    section_type text NOT NULL, -- 'hero', 'participants', 'story', 'gallery'
    section_name text NOT NULL,
    section_title text,
    section_config jsonb DEFAULT '{}',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    responsive_config jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- ✅ **Plugin-aware section types** adaptable to event requirements
- ✅ **Responsive configuration** for mobile/desktop optimization
- ✅ **Dynamic section ordering** with drag-and-drop support
- ✅ **Conditional section display** based on event type

**Wedding Plugin Mapping:**
```javascript
// Default wedding sections
section_types: ['hero', 'couple_info', 'love_story', 'event_details', 
               'photo_gallery', 'important_info', 'gift_registry']
```

---

### 📖 **`event_stories` Table**
**Purpose**: Timeline and narrative content (replaces `wedding_love_story`)

```sql
TABLE event_stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES auth.users(id),
    story_type text DEFAULT 'timeline',
    title text NOT NULL,
    content text,
    timeline_items jsonb DEFAULT '[]',
    media_urls jsonb DEFAULT '[]',
    story_config jsonb DEFAULT '{}',
    display_order integer DEFAULT 0,
    is_published boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone
);
```

**Key Features:**
- ✅ **Multi-story support** with different story types
- ✅ **Timeline management** via structured JSONB
- ✅ **Media integration** with URLs and metadata
- ✅ **Publication workflow** with scheduling support

**Wedding Plugin Mapping:**
```javascript
// Maps to legacy wedding_love_story
story_type: 'timeline' | 'narrative'
timeline_items: [{ date, title, description, image }]
```

---

## 🔄 **Backward Compatibility Layer**

### 📋 **Legacy View Mappings**

The system maintains **100% backward compatibility** through SQL views that exactly match legacy table interfaces:

#### `wedding_couple_info` View
```sql
CREATE VIEW wedding_couple_info AS
SELECT DISTINCT
    e.tenant_id,
    -- Bride information (first primary participant)
    (SELECT participant_name FROM event_participants WHERE event_id = e.id AND participant_role = 'bride' LIMIT 1) as bride_name,
    (SELECT participant_full_name FROM event_participants WHERE event_id = e.id AND participant_role = 'bride' LIMIT 1) as bride_full_name,
    -- Groom information (second primary participant)  
    (SELECT participant_name FROM event_participants WHERE event_id = e.id AND participant_role = 'groom' LIMIT 1) as groom_name,
    (SELECT participant_full_name FROM event_participants WHERE event_id = e.id AND participant_role = 'groom' LIMIT 1) as groom_full_name,
    e.created_at,
    e.updated_at
FROM events e WHERE e.event_type = 'wedding';
```

#### `wedding_important_info` View
```sql
CREATE VIEW wedding_important_info AS
SELECT 
    tenant_id,
    content as important_info_content,
    (content_data->>'instructions') as instructions,
    (content_data->>'requirements') as requirements,
    created_at,
    updated_at
FROM event_content ec
JOIN events e ON ec.event_id = e.id
WHERE e.event_type = 'wedding' AND ec.content_type = 'instructions';
```

#### `wedding_love_story` View
```sql
CREATE VIEW wedding_love_story AS
SELECT
    tenant_id,
    title,
    content as full_story,
    timeline_items,
    is_published,
    created_at,
    updated_at
FROM event_stories es
JOIN events e ON es.event_id = e.id  
WHERE e.event_type = 'wedding' AND es.story_type = 'timeline';
```

---

## 🔌 **Plugin Integration**

### 📋 **Event Type Plugins**

Each event type implements a **plugin interface** that defines:

```typescript
interface EventPlugin {
  name: string;
  type: string;
  version: string;
  config: {
    participant_roles: string[];
    default_sections: string[];
    database_mapping: Record<string, string>;
    field_mappings: Record<string, any>;
    supported_features: Record<string, boolean>;
  };
}
```

### 🎯 **Wedding Plugin Example**

```typescript
const weddingPlugin: EventPlugin = {
  name: 'Wedding Event Plugin',
  type: 'wedding',
  database_mapping: {
    event_participants: 'wedding_couple_info',
    event_stories: 'wedding_love_story',
    event_content: 'wedding_important_info',
    event_sections: 'wedding_sections'
  },
  field_mappings: {
    participants: {
      'participant_name': ['bride_name', 'groom_name'],
      'participant_role': ['bride', 'groom']
    }
  }
};
```

---

## 🔒 **Security & Performance**

### 🛡️ **Row Level Security (RLS)**

All tables enforce tenant-based security:

```sql
-- Example RLS policy for events table
CREATE POLICY "Users can only see their own events" 
ON events FOR ALL 
TO authenticated 
USING (auth.uid() = tenant_id);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_stories ENABLE ROW LEVEL SECURITY;
```

### ⚡ **Performance Optimization**

Strategic indexing for common queries:

```sql
-- Core indexes for performance
CREATE INDEX idx_events_tenant_type ON events(tenant_id, event_type);
CREATE INDEX idx_participants_event_role ON event_participants(event_id, participant_role);
CREATE INDEX idx_content_event_type ON event_content(event_id, content_type);
CREATE INDEX idx_sections_event_order ON event_sections(event_id, display_order);
CREATE INDEX idx_stories_event_published ON event_stories(event_id, is_published);
```

---

## 🚀 **Migration Strategy**

### 📋 **Data Migration Process**

1. **Create generic tables** with new schema
2. **Migrate existing data** from `wedding_*` tables
3. **Create compatibility views** for legacy API support
4. **Update application code** to use generic hooks
5. **Maintain backward compatibility** during transition

### 🔄 **Rollback Plan**

- **Rollback scripts** available for emergency reversion
- **Data validation** at each migration step
- **Backup strategies** for data protection
- **Testing procedures** for validation

---

## 📊 **Future Extensions**

### 🎯 **Planned Event Types**

- **Conference Events**: Speaker management, session scheduling
- **Birthday Parties**: Age-specific themes, party planning
- **Corporate Events**: Team building, company celebrations
- **Workshops**: Instructor profiles, curriculum management

### 🔌 **Plugin Development**

Each new event type follows the **plugin architecture** pattern:
- Implements `EventPlugin` interface
- Defines specific participant roles and sections
- Maps to generic database structure
- Provides event-type-specific UI components

---

## ✅ **Schema Validation**

This generic schema successfully supports:

- ✅ **Multi-tenant architecture** with secure data isolation
- ✅ **Multiple event types** through plugin system  
- ✅ **Backward compatibility** with legacy wedding tables
- ✅ **Flexible data storage** via JSONB columns
- ✅ **Performance optimization** through strategic indexing
- ✅ **Scalable plugin architecture** for future event types

---

**Generated**: 2025-08-13T08:44:15Z  
**Version**: 1.0.0  
**Phase**: 2.2 Database Transformation