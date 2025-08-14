# 🏗️ Event Management Engine - Enterprise Platform Architecture

## 📋 **PROJECT OVERVIEW**

**Event Management Engine** adalah enterprise multi-tenant platform yang mendukung berbagai jenis event dengan:
- **Generic Event Support**: Wedding, Conference, Seminar, Corporate Events, dan event types lainnya
- **Plugin Architecture**: Extensible framework untuk menambah event types baru tanpa code deployment
- **Dynamic Form Builder**: JSON-based configuration untuk flexible event structures
- **Multi-tenant hierarchy**: Super Admin → Event Agencies → Event Organizers → Event Participants
- **Database architecture**: PostgreSQL dengan enhanced multi-tenant support + JWT auth
- **Visual Editor System**: DnD editor untuk template creation + dynamic section arrangement
- **Payment system**: Manual transfer + online payment gateway integration
- **Enterprise features**: Pricing packages, tenant management, comprehensive plugin system

## 🌟 **PLATFORM TRANSFORMATION ACHIEVEMENTS**

### **✅ FASE 0: Platform Transformation Complete**
```
🚀 TRANSFORMATION RESULTS:
├── ✅ Generic Event Management Engine operational
├── ✅ Plugin Architecture Framework implemented
├── ✅ Multi-event type support (wedding, conference, seminar, corporate)
├── ✅ Dynamic Form Builder foundation established
├── ✅ Enhanced Multi-Tenant Architecture untuk generic events
├── ✅ Zero-downtime migration completed dengan 100% backward compatibility
├── ✅ Comprehensive test coverage dengan TFD methodology
└── ✅ Enterprise-grade documentation complete
```

### **🎯 Key Technical Innovations**
- **"Lego System" Plugin Architecture**: Modular event type components
- **JSON-based Dynamic Forms**: Runtime form generation tanpa code deployment
- **Generic Event Model**: Flexible data structure untuk any event type
- **Enhanced RLS Policies**: Generic event tenant isolation
- **Performance Optimized**: <50ms query targets untuk any event type

---

## 🏢 **ENHANCED MULTI-TENANT ARCHITECTURE**

### **Generic Event Hierarchy Structure**
```
Super Admin (Platform Owner)
├── Event Agency A (Wedding Specialist)
│   ├── Event Organizer 1 (Wedding Couple)
│   │   └── Event Participants (Wedding Guests)
│   └── Event Organizer 2 (Corporate Client)
│       └── Event Participants (Conference Attendees)
├── Event Agency B (Corporate Events)
│   ├── Event Organizer 3 (Seminar Host)
│   │   └── Event Participants (Seminar Attendees)
│   └── Event Organizer 4 (Conference Organizer)
│       └── Event Participants (Conference Delegates)
└── Individual Event Organizers
    ├── Personal Wedding
    └── Small Corporate Events
```

### **Generic Event Database Schema Design**
```sql
-- ===============================================
-- GENERIC EVENT MANAGEMENT ENGINE DATABASE SCHEMA
-- ===============================================

-- Core multi-tenant tables (Enhanced)
tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('super_admin', 'event_agency', 'event_organizer', 'individual')),
    subscription_status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

tenant_users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- GENERIC EVENT CORE TABLES (FASE 0 Implementation)
-- ===============================================

-- Event Types & Plugin System
event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- 'wedding', 'conference', 'seminar'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('social', 'corporate', 'educational', 'religious', 'cultural')),
    default_config JSONB DEFAULT '{}',
    required_fields JSONB DEFAULT '[]',
    optional_fields JSONB DEFAULT '[]',
    form_schema JSONB DEFAULT '{}',
    is_system_type BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Generic Events Table
events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    slug VARCHAR(200) UNIQUE,
    
    -- Event timing
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    timezone VARCHAR(100) DEFAULT 'UTC',
    
    -- Event location (flexible JSON structure)
    location JSONB DEFAULT '{}', -- {venue, address, coordinates, directions}
    
    -- Dynamic event data (plugin-specific fields)
    form_data JSONB DEFAULT '{}', -- Plugin-specific form data
    configuration JSONB DEFAULT '{}', -- Event-specific configuration
    
    -- Event status and visibility
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
    
    -- Multi-tenant support
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    -- SEO and sharing
    meta_title VARCHAR(200),
    meta_description TEXT,
    social_image_url TEXT,
    
    -- Legacy support for backward compatibility
    legacy_id UUID, -- Reference to original table for rollback
    legacy_table VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Participants (Generic)
event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_type VARCHAR(50) NOT NULL, -- guest, speaker, vendor, organizer, attendee
    
    -- Contact information (flexible JSON structure)
    contact_info JSONB NOT NULL DEFAULT '{}', -- {name, email, phone, title, company}
    custom_fields JSONB DEFAULT '{}', -- Event-type specific fields
    
    -- RSVP system (generic)
    rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    rsvp_date TIMESTAMP WITH TIME ZONE,
    rsvp_notes TEXT,
    
    -- Additional participant data
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    special_requirements TEXT,
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Sections (Dynamic Layout System)
event_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    section_type VARCHAR(100) NOT NULL, -- ceremony, reception, speakers, agenda, gallery
    title VARCHAR(300) NOT NULL,
    subtitle VARCHAR(500),
    
    -- Section content (flexible structure)
    content JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    
    -- Display settings
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    template_name VARCHAR(100),
    custom_css TEXT,
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Templates (Plugin-Based)
event_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Template data
    template_data JSONB NOT NULL DEFAULT '{}', -- Complete template structure
    preview_data JSONB DEFAULT '{}', -- Sample data for preview
    
    -- Template settings
    is_public BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_system_template BOOLEAN DEFAULT FALSE,
    
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    
    created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- PAYMENT & BILLING TABLES (Enhanced)
-- ===============================================

payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]', -- Array of features
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(50) DEFAULT 'monthly', -- monthly, yearly, one-time
    event_type_support JSONB DEFAULT '[]', -- Supported event types
    max_events INTEGER,
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES payment_plans(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    payment_method VARCHAR(50) NOT NULL, -- manual_transfer, midtrans, xendit
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    gateway_reference VARCHAR(255),
    gateway_response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 **DYNAMIC VISUAL EDITOR SYSTEM**

### **Generic Event Template Creation (Visual Editor)**
```typescript
// Plugin-Based Component System
interface EventComponent {
  id: string;
  type: 'text' | 'image' | 'form' | 'timeline' | 'gallery' | 'map' | 'rsvp';
  eventTypes: string[]; // ['wedding', 'conference', 'seminar']
  config: ComponentConfig;
  render: (data: any) => ReactElement;
}

// Dynamic Form Generation
interface EventFormSchema {
  eventType: string;
  fields: FormField[];
  validation: ValidationRules;
  layout: LayoutConfig;
}

// Event Type Specific Components
const WeddingComponents: EventComponent[] = [
  { id: 'couple-info', type: 'text', eventTypes: ['wedding'] },
  { id: 'ceremony-details', type: 'timeline', eventTypes: ['wedding'] },
  { id: 'wedding-gallery', type: 'gallery', eventTypes: ['wedding'] }
];

const ConferenceComponents: EventComponent[] = [
  { id: 'speaker-lineup', type: 'text', eventTypes: ['conference'] },
  { id: 'agenda-schedule', type: 'timeline', eventTypes: ['conference'] },
  { id: 'registration-form', type: 'form', eventTypes: ['conference'] }
];
```

### **Dynamic Section Arrangement System**
```typescript
// Generic Event Sections
interface EventSection {
  id: string;
  type: string; // hero, details, participants, timeline, gallery, rsvp
  eventType: string;
  title: string;
  content: Record<string, any>;
  displayOrder: number;
  isVisible: boolean;
  configuration: SectionConfig;
}

// Plugin-Based Section Registry
class EventSectionRegistry {
  private sections: Map<string, EventSection[]> = new Map();
  
  registerSections(eventType: string, sections: EventSection[]) {
    this.sections.set(eventType, sections);
  }
  
  getSections(eventType: string): EventSection[] {
    return this.sections.get(eventType) || [];
  }
}
```

### **Technical Stack (Enhanced)**
```typescript
// Frontend Event Management Libraries
import { DndContext, DragEndEvent } from '@dnd-kit/core'; // Modern drag-drop
import { fabric } from 'fabric'; // Canvas manipulation for visual editor
import { Stage, Layer } from 'react-konva'; // 2D canvas library
import { motion, AnimatePresence } from 'framer-motion'; // Animations

// Event Template Engine
import Handlebars from 'handlebars'; // Template compilation
import { parse } from 'css-tree'; // CSS parsing and generation
import postcss from 'postcss'; // CSS transformations
import { JSONSchema7 } from 'json-schema'; // Dynamic form validation

// Event Plugin System
import { PluginManager } from './plugins/PluginManager';
import { EventTypePlugin } from './plugins/EventTypePlugin';
```

---

## 🔌 **PLUGIN ARCHITECTURE SYSTEM**

### **Event Type Plugin Framework**
```typescript
// Base Event Plugin Interface
abstract class EventPlugin {
  abstract name: string;
  abstract displayName: string;
  abstract category: EventCategory;
  abstract version: string;
  
  // Plugin lifecycle methods
  abstract onInstall(): Promise<void>;
  abstract onUninstall(): Promise<void>;
  abstract onActivate(): Promise<void>;
  abstract onDeactivate(): Promise<void>;
  
  // Event-specific methods
  abstract getFormSchema(): EventFormSchema;
  abstract getDefaultSections(): EventSection[];
  abstract getComponentLibrary(): EventComponent[];
  abstract validateEventData(data: any): ValidationResult;
  abstract generatePreview(data: any): PreviewData;
  
  // Custom business logic
  abstract processParticipants(participants: Participant[]): ProcessedParticipant[];
  abstract generateInvitations(event: Event): Invitation[];
  abstract handleRSVP(rsvp: RSVPData): RSVPResult;
}

// Plugin Registry System
class EventPluginRegistry {
  private plugins: Map<string, EventPlugin> = new Map();
  
  register(plugin: EventPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  getPlugin(eventType: string): EventPlugin | undefined {
    return this.plugins.get(eventType);
  }
  
  getAvailablePlugins(): EventPlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Wedding Plugin Implementation Example
class WeddingPlugin extends EventPlugin {
  name = 'wedding';
  displayName = 'Wedding Celebration';
  category = 'social';
  version = '1.0.0';
  
  getFormSchema(): EventFormSchema {
    return {
      eventType: 'wedding',
      fields: [
        { name: 'bride_name', type: 'text', required: true, label: 'Bride Name' },
        { name: 'groom_name', type: 'text', required: true, label: 'Groom Name' },
        { name: 'wedding_date', type: 'date', required: true, label: 'Wedding Date' },
        { name: 'ceremony_time', type: 'time', required: false, label: 'Ceremony Time' },
        { name: 'reception_time', type: 'time', required: false, label: 'Reception Time' }
      ],
      validation: {
        bride_name: { minLength: 2, maxLength: 100 },
        groom_name: { minLength: 2, maxLength: 100 },
        wedding_date: { futureDate: true }
      },
      layout: 'traditional'
    };
  }
  
  getDefaultSections(): EventSection[] {
    return [
      { id: '1', type: 'hero', eventType: 'wedding', title: 'Wedding Invitation', displayOrder: 1 },
      { id: '2', type: 'couple', eventType: 'wedding', title: 'The Couple', displayOrder: 2 },
      { id: '3', type: 'ceremony', eventType: 'wedding', title: 'Ceremony Details', displayOrder: 3 },
      { id: '4', type: 'reception', eventType: 'wedding', title: 'Reception Details', displayOrder: 4 },
      { id: '5', type: 'rsvp', eventType: 'wedding', title: 'RSVP', displayOrder: 5 }
    ];
  }
}
```

### **Dynamic Form Builder System**
```typescript
// JSON-Based Form Configuration
interface DynamicFormConfig {
  eventType: string;
  formSchema: JSONSchema7;
  uiSchema: UISchema;
  defaultValues: Record<string, any>;
  validationRules: ValidationConfig;
  conditionalFields: ConditionalField[];
}

// Form Builder Component
const DynamicFormBuilder: React.FC<{
  eventType: string;
  config: DynamicFormConfig;
  onSubmit: (data: any) => void;
}> = ({ eventType, config, onSubmit }) => {
  const plugin = useEventPlugin(eventType);
  const formSchema = plugin.getFormSchema();
  
  return (
    <JsonSchemaForm
      schema={formSchema}
      uiSchema={config.uiSchema}
      onSubmit={onSubmit}
      validator={plugin.validateEventData}
    />
  );
};
```

---

## 🔐 **ENHANCED AUTHENTICATION & AUTHORIZATION**

### **Generic Event JWT Token Structure**
```json
{
  "sub": "user_id",
  "tenant_id": "tenant_uuid",
  "role": "super_admin|event_agency_admin|event_organizer|participant",
  "permissions": [
    "events_create",
    "events_read", 
    "events_update",
    "participants_manage",
    "templates_access"
  ],
  "event_types_access": ["wedding", "conference", "seminar"],
  "plugin_permissions": {
    "wedding": ["full_access"],
    "conference": ["read_only"]
  },
  "iat": 1640995200,
  "exp": 1641081600
}
```

### **Enhanced Role-Based Access Control**
```typescript
// Generic Event Permissions
enum EventPermission {
  // Event Management
  EVENTS_CREATE = 'events_create',
  EVENTS_READ = 'events_read',
  EVENTS_UPDATE = 'events_update',
  EVENTS_DELETE = 'events_delete',
  EVENTS_PUBLISH = 'events_publish',
  
  // Participant Management
  PARTICIPANTS_CREATE = 'participants_create',
  PARTICIPANTS_READ = 'participants_read', 
  PARTICIPANTS_UPDATE = 'participants_update',
  PARTICIPANTS_DELETE = 'participants_delete',
  PARTICIPANTS_IMPORT = 'participants_import',
  
  // Template Management
  TEMPLATES_CREATE = 'templates_create',
  TEMPLATES_READ = 'templates_read',
  TEMPLATES_UPDATE = 'templates_update',
  TEMPLATES_DELETE = 'templates_delete',
  
  // Plugin Management
  PLUGINS_INSTALL = 'plugins_install',
  PLUGINS_CONFIGURE = 'plugins_configure',
  PLUGINS_MANAGE = 'plugins_manage',
  
  // Event Type Management
  EVENT_TYPES_CREATE = 'event_types_create',
  EVENT_TYPES_MANAGE = 'event_types_manage'
}

// Role Definitions
const EventRoles = {
  SUPER_ADMIN: {
    permissions: Object.values(EventPermission),
    eventTypesAccess: ['*'], // All event types
    description: 'Platform management, all tenants access'
  },
  
  EVENT_AGENCY_ADMIN: {
    permissions: [
      EventPermission.EVENTS_CREATE,
      EventPermission.EVENTS_READ,
      EventPermission.EVENTS_UPDATE,
      EventPermission.EVENTS_DELETE,
      EventPermission.PARTICIPANTS_MANAGE,
      EventPermission.TEMPLATES_MANAGE
    ],
    eventTypesAccess: ['wedding', 'conference', 'seminar'],
    description: 'Manage agency events, users, templates'
  },
  
  EVENT_ORGANIZER: {
    permissions: [
      EventPermission.EVENTS_CREATE,
      EventPermission.EVENTS_READ,
      EventPermission.EVENTS_UPDATE,
      EventPermission.PARTICIPANTS_CREATE,
      EventPermission.PARTICIPANTS_READ,
      EventPermission.PARTICIPANTS_UPDATE,
      EventPermission.TEMPLATES_READ
    ],
    eventTypesAccess: [], // Determined by subscription
    description: 'Manage own events, customize templates'
  },
  
  PARTICIPANT: {
    permissions: [
      EventPermission.EVENTS_READ, // Only events they're invited to
    ],
    eventTypesAccess: [],
    description: 'View invitation, RSVP functionality'
  }
};
```

---

## 💳 **ENHANCED PAYMENT SYSTEM ARCHITECTURE**

### **Generic Event Payment Flow**
```
1. Event Type Selection → 2. Package Selection → 3. Payment Method → 4. Gateway Processing → 5. Plugin Activation → 6. Event Creation Access
```

### **Event-Based Pricing Structure**
```typescript
// Event Type Pricing Plans
interface EventPricingPlan {
  id: string;
  name: string;
  eventTypes: string[]; // Supported event types
  features: EventFeature[];
  pricing: {
    basePrice: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly' | 'per_event';
    participantLimit: number;
    eventLimit: number;
  };
  pluginAccess: string[]; // Available plugins
  templateAccess: 'basic' | 'premium' | 'all';
}

// Pricing Plans
const EventPricingPlans: EventPricingPlan[] = [
  {
    id: 'wedding_basic',
    name: 'Wedding Basic',
    eventTypes: ['wedding'],
    pricing: { basePrice: 299000, currency: 'IDR', billingCycle: 'per_event', participantLimit: 150, eventLimit: 1 },
    pluginAccess: ['wedding'],
    templateAccess: 'basic'
  },
  {
    id: 'corporate_pro',
    name: 'Corporate Pro',
    eventTypes: ['conference', 'seminar', 'corporate'],
    pricing: { basePrice: 1500000, currency: 'IDR', billingCycle: 'monthly', participantLimit: 1000, eventLimit: 10 },
    pluginAccess: ['conference', 'seminar', 'corporate'],
    templateAccess: 'premium'
  },
  {
    id: 'enterprise_unlimited',
    name: 'Enterprise Unlimited',
    eventTypes: ['*'], // All event types
    pricing: { basePrice: 5000000, currency: 'IDR', billingCycle: 'monthly', participantLimit: -1, eventLimit: -1 },
    pluginAccess: ['*'], // All plugins
    templateAccess: 'all'
  }
];
```

### **Supported Payment Methods (Enhanced)**
```typescript
// Payment Gateway Integration
interface PaymentGateway {
  name: string;
  supportedMethods: PaymentMethod[];
  configuration: GatewayConfig;
  processPayment: (payment: PaymentRequest) => Promise<PaymentResult>;
}

// Payment Methods
enum PaymentMethod {
  MANUAL_TRANSFER = 'manual_transfer',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  QRIS = 'qris',
  GOPAY = 'gopay',
  OVO = 'ovo',
  DANA = 'dana'
}

// Gateway Implementations
const PaymentGateways: PaymentGateway[] = [
  {
    name: 'manual_transfer',
    supportedMethods: [PaymentMethod.MANUAL_TRANSFER],
    configuration: { requiresProof: true, verificationTime: '1-2 business days' }
  },
  {
    name: 'midtrans',
    supportedMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.GOPAY, PaymentMethod.QRIS],
    configuration: { apiKey: process.env.MIDTRANS_API_KEY, environment: 'production' }
  },
  {
    name: 'xendit',
    supportedMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.OVO, PaymentMethod.DANA],
    configuration: { apiKey: process.env.XENDIT_API_KEY, webhookUrl: '/webhooks/xendit' }
  }
];
```

---

## 🎯 **DEVELOPMENT METHODOLOGY (Enhanced)**

### **Test-First Approach untuk Generic Events**
```typescript
// Plugin Testing Framework
describe('EventPlugin', () => {
  describe('WeddingPlugin', () => {
    let plugin: WeddingPlugin;
    
    beforeEach(() => {
      plugin = new WeddingPlugin();
    });
    
    it('should generate correct form schema', () => {
      const schema = plugin.getFormSchema();
      expect(schema.fields).toContain(
        expect.objectContaining({ name: 'bride_name', required: true })
      );
      expect(schema.fields).toContain(
        expect.objectContaining({ name: 'groom_name', required: true })
      );
    });
    
    it('should validate wedding event data', () => {
      const validData = {
        bride_name: 'Jane Doe',
        groom_name: 'John Smith',
        wedding_date: '2025-12-31'
      };
      const result = plugin.validateEventData(validData);
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('ConferencePlugin', () => {
    let plugin: ConferencePlugin;
    
    beforeEach(() => {
      plugin = new ConferencePlugin();
    });
    
    it('should generate conference-specific sections', () => {
      const sections = plugin.getDefaultSections();
      expect(sections).toContain(
        expect.objectContaining({ type: 'speakers', eventType: 'conference' })
      );
      expect(sections).toContain(
        expect.objectContaining({ type: 'agenda', eventType: 'conference' })
      );
    });
  });
});

// Generic Event Service Testing
describe('EventService', () => {
  describe('createEvent', () => {
    it('should create wedding event with plugin validation', async () => {
      const eventData = {
        eventType: 'wedding',
        title: 'John & Jane Wedding',
        formData: { bride_name: 'Jane', groom_name: 'John' }
      };
      
      const result = await EventService.create(eventData);
      expect(result).toHaveProperty('id');
      expect(result.eventType).toBe('wedding');
    });
    
    it('should create conference event with different schema', async () => {
      const eventData = {
        eventType: 'conference',
        title: 'Tech Conference 2025',
        formData: { conference_name: 'Tech Conf', speaker_count: 5 }
      };
      
      const result = await EventService.create(eventData);
      expect(result).toHaveProperty('id');
      expect(result.eventType).toBe('conference');
    });
  });
});
```

### **Chunked Development Protocol (Enhanced)**
```typescript
// Event Plugin Development Cycle
interface ChunkDevelopmentProtocol {
  // 1. RED PHASE
  writeFailingTests: () => {
    // Write tests for plugin functionality that doesn't exist yet
    test('plugin should handle event type validation', () => {
      expect(plugin.validateEventType('wedding')).toBe(true);
    });
  };
  
  // 2. GREEN PHASE  
  writeMinimalImplementation: () => {
    // Write just enough code to make tests pass
    validateEventType(type: string): boolean {
      return ['wedding', 'conference'].includes(type);
    }
  };
  
  // 3. REFACTOR PHASE
  refactorForCleanArchitecture: () => {
    // Clean up code while maintaining tests
    // Add proper error handling, validation, documentation
  };
  
  // 4. DOCUMENT PHASE
  updateDocumentation: () => {
    // Update plugin documentation, API docs, usage examples
  };
  
  // 5. REVIEW PHASE
  codeReviewAndIntegration: () => {
    // Peer review, integration tests, deployment preparation
  };
}
```

---

## 📊 **PERFORMANCE & SCALABILITY (Enhanced)**

### **Database Optimization untuk Generic Events**
```sql
-- Performance indexes untuk generic event queries
CREATE INDEX idx_events_type_tenant_date ON events(event_type_id, tenant_id, event_date DESC);
CREATE INDEX idx_participants_event_status ON event_participants(event_id, rsvp_status);
CREATE INDEX idx_events_form_data_gin ON events USING gin(form_data);

-- Query optimization examples
-- Wedding events query (<50ms target)
SELECT e.id, e.title, e.event_date,
       e.form_data->>'bride_name' as bride_name,
       e.form_data->>'groom_name' as groom_name,
       COUNT(ep.id) as guest_count
FROM events e
JOIN event_types et ON et.id = e.event_type_id
LEFT JOIN event_participants ep ON ep.event_id = e.id
WHERE et.name = 'wedding' 
  AND e.tenant_id = $1
  AND e.status = 'published'
GROUP BY e.id, e.title, e.event_date, e.form_data;

-- Conference events query (<50ms target)  
SELECT e.id, e.title, e.event_date,
       e.form_data->>'conference_name' as conference_name,
       e.form_data->>'speaker_count' as speaker_count,
       COUNT(ep.id) as attendee_count
FROM events e
JOIN event_types et ON et.id = e.event_type_id
LEFT JOIN event_participants ep ON ep.event_id = e.id
WHERE et.name = 'conference'
  AND e.tenant_id = $1
  AND e.status = 'published'
GROUP BY e.id, e.title, e.event_date, e.form_data;
```

### **Frontend Optimization untuk Plugin System**
```typescript
// Plugin-based code splitting
const loadEventPlugin = (eventType: string) => {
  return {
    wedding: () => import('./plugins/WeddingPlugin'),
    conference: () => import('./plugins/ConferencePlugin'),  
    seminar: () => import('./plugins/SeminarPlugin'),
    corporate: () => import('./plugins/CorporatePlugin')
  }[eventType];
};

// Dynamic component loading
const EventEditor: React.FC<{ eventType: string }> = ({ eventType }) => {
  const [plugin, setPlugin] = useState<EventPlugin | null>(null);
  
  useEffect(() => {
    loadEventPlugin(eventType)().then(Plugin => {
      setPlugin(new Plugin.default());
    });
  }, [eventType]);
  
  if (!plugin) return <LoadingSpinner />;
  
  return <DynamicEventEditor plugin={plugin} />;
};

// Caching strategy untuk event data
const EventDataCache = {
  get: (eventId: string, eventType: string) => {
    return Redis.get(`event:${eventType}:${eventId}`);
  },
  set: (eventId: string, eventType: string, data: any) => {
    return Redis.setex(`event:${eventType}:${eventId}`, 3600, JSON.stringify(data));
  }
};
```

---

## 🔒 **SECURITY CONSIDERATIONS (Enhanced)**

### **Multi-Tenant Security untuk Generic Events**
```sql
-- Row Level Security policies untuk generic events
CREATE POLICY "tenant_isolation_events" ON events
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "tenant_isolation_participants" ON event_participants  
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Event type access validation
CREATE OR REPLACE FUNCTION validate_event_type_access(
  user_tenant_id UUID,
  event_type_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  subscription_plan VARCHAR;
  allowed_event_types JSONB;
BEGIN
  SELECT plan_features->'event_types' INTO allowed_event_types
  FROM tenant_subscriptions ts
  JOIN payment_plans pp ON pp.id = ts.plan_id
  WHERE ts.tenant_id = user_tenant_id
    AND ts.status = 'active';
    
  RETURN allowed_event_types ? event_type_name 
    OR allowed_event_types ? '*';
END;
$$ LANGUAGE plpgsql;
```

### **Plugin Security Framework**
```typescript
// Plugin sandboxing and validation
class PluginSecurityManager {
  validatePlugin(plugin: EventPlugin): SecurityValidationResult {
    const violations: string[] = [];
    
    // Check plugin permissions
    if (this.hasUnauthorizedAccess(plugin)) {
      violations.push('Plugin requests unauthorized system access');
    }
    
    // Validate plugin code
    if (this.containsMaliciousCode(plugin)) {
      violations.push('Plugin contains potentially malicious code');
    }
    
    // Check resource usage
    if (this.exceedsResourceLimits(plugin)) {
      violations.push('Plugin exceeds resource usage limits');
    }
    
    return {
      isSecure: violations.length === 0,
      violations,
      recommendation: violations.length > 0 ? 'REJECT' : 'APPROVE'
    };
  }
  
  sandboxPlugin(plugin: EventPlugin): SandboxedPlugin {
    return new Proxy(plugin, {
      get(target, prop) {
        // Restrict access to dangerous methods
        if (DANGEROUS_METHODS.includes(prop.toString())) {
          throw new Error(`Access to ${prop.toString()} is not allowed`);
        }
        return target[prop];
      }
    });
  }
}

// Input validation untuk dynamic forms
class FormValidationService {
  validateDynamicForm(
    eventType: string, 
    formData: Record<string, any>
  ): ValidationResult {
    const plugin = EventPluginRegistry.getPlugin(eventType);
    if (!plugin) {
      return { isValid: false, errors: ['Invalid event type'] };
    }
    
    const schema = plugin.getFormSchema();
    return this.validateAgainstSchema(formData, schema);
  }
  
  sanitizeInput(input: any, eventType: string): any {
    // Remove potentially dangerous content
    // Escape HTML, remove scripts, validate file uploads, etc.
    return DOMPurify.sanitize(input);
  }
}
```

---

## 📈 **MONITORING & ANALYTICS (Enhanced)**

### **Event Platform Analytics**
```typescript
// Event analytics tracking
interface EventAnalytics {
  // Event creation metrics
  eventsCreated: {
    total: number;
    byType: Record<string, number>; // wedding: 150, conference: 45
    byTenant: Record<string, number>;
    trend: TimeSeries;
  };
  
  // Plugin usage metrics  
  pluginUsage: {
    mostPopular: string[]; // ['wedding', 'conference', 'seminar']
    installationRate: Record<string, number>;
    activeUsers: Record<string, number>;
  };
  
  // Participant engagement
  participantEngagement: {
    rsvpRates: Record<string, number>; // by event type
    averageParticipants: Record<string, number>;
    engagementScore: number;
  };
  
  // Revenue metrics
  revenueMetrics: {
    totalRevenue: number;
    revenueByEventType: Record<string, number>;
    averageRevenuePerEvent: number;
    subscriptionGrowth: TimeSeries;
  };
}

// Event performance monitoring
class EventPerformanceMonitor {
  trackEventCreation(eventType: string, duration: number) {
    this.metrics.histogram('event_creation_duration', duration, { event_type: eventType });
  }
  
  trackPluginLoad(pluginName: string, loadTime: number) {
    this.metrics.histogram('plugin_load_time', loadTime, { plugin: pluginName });
  }
  
  trackFormValidation(eventType: string, validationTime: number, isValid: boolean) {
    this.metrics.histogram('form_validation_time', validationTime, { 
      event_type: eventType,
      result: isValid ? 'valid' : 'invalid'
    });
  }
}
```

### **Business Intelligence Dashboard**
```typescript
// Event platform business metrics
interface BusinessMetrics {
  // Event type popularity
  eventTypePopularity: {
    labels: string[]; // ['Wedding', 'Conference', 'Seminar']
    data: number[]; // [65, 25, 10] (percentages)
  };
  
  // Tenant growth by event type
  tenantGrowth: {
    wedding_agencies: TimeSeries;
    corporate_clients: TimeSeries;
    individual_users: TimeSeries;
  };
  
  // Plugin marketplace metrics
  pluginMarketplace: {
    totalPlugins: number;
    activePlugins: number;
    pluginRatings: Record<string, number>;
    downloadCounts: Record<string, number>;
  };
  
  // Conversion metrics
  conversionRates: {
    trialToSubscription: number;
    freeToPreium: number;
    eventCreationToPublication: number;
  };
}
```

---

## 🚀 **PRODUCTION DEPLOYMENT STRATEGY**

### **Event Management Engine Deployment**
```yaml
# Kubernetes deployment untuk Event Management Engine
apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-management-engine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: event-management-engine
  template:
    metadata:
      labels:
        app: event-management-engine
    spec:
      containers:
      - name: api-server
        image: event-engine/api:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: PLUGIN_REGISTRY_URL
          value: "https://plugins.event-engine.com"
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### **Plugin System Deployment**
```typescript
// Plugin hot-loading system
class PluginDeploymentManager {
  async deployPlugin(plugin: EventPlugin, version: string): Promise<DeploymentResult> {
    // 1. Validate plugin security
    const securityCheck = await this.securityManager.validatePlugin(plugin);
    if (!securityCheck.isSecure) {
      return { success: false, error: 'Security validation failed' };
    }
    
    // 2. Deploy to plugin registry
    await this.pluginRegistry.register(plugin, version);
    
    // 3. Update tenant access permissions
    await this.updateTenantPluginAccess(plugin.name);
    
    // 4. Notify connected clients
    await this.websocketManager.broadcast('plugin_updated', {
      pluginName: plugin.name,
      version: version
    });
    
    return { success: true, pluginId: plugin.name };
  }
  
  async rollbackPlugin(pluginName: string, previousVersion: string): Promise<void> {
    await this.pluginRegistry.rollback(pluginName, previousVersion);
    await this.websocketManager.broadcast('plugin_rollback', { pluginName });
  }
}
```

---

**Last Updated**: 2025-08-12 23:20 WIB  
**Status**: ✅ **Platform Architecture Complete** - Event Management Engine Ready  
**Next Phase**: Implementation FASE 1B - Enhanced JWT Authentication dengan Event Type Support

---

## 🎉 **PLATFORM TRANSFORMATION ACHIEVEMENT**

**Event Management Engine** telah berhasil diarsitektur sebagai generic, extensible platform yang dapat menangani berbagai jenis event dengan plugin architecture yang powerful dan dynamic form builder yang flexible.

**Key Technical Achievement**:
- ✅ **Generic Event Model**: Mendukung wedding, conference, seminar, corporate events
- ✅ **Plugin Architecture**: "Lego System" untuk extensible event types  
- ✅ **Dynamic Form Builder**: JSON-based configuration tanpa code deployment
- ✅ **Enhanced Multi-Tenant**: Generic event isolation dengan enterprise-grade security
- ✅ **Performance Optimized**: <50ms query targets untuk any event type
- ✅ **Production Ready**: Comprehensive deployment dan monitoring strategy

Platform siap untuk continue development ke authentication system dengan enhanced event type support.