# Plugin Architecture Framework untuk Event Management Engine

## Executive Summary
Comprehensive plugin architecture untuk **Event Management Engine** yang memungkinkan extensible, modular, dan maintainable system untuk berbagai jenis event types (wedding, conference, seminar, corporate events, dll).

---

## Architecture Philosophy

### **🎯 Core Principles**
- **Plugin Independence**: Setiap event type adalah independent plugin
- **Configuration-Driven**: JSON-based configuration dengan zero code deployment
- **Multi-Tenant Aware**: Plugin configurations dapat di-customize per tenant
- **Performance First**: Lazy loading, caching, dan optimized database queries
- **Developer Friendly**: Clear APIs, comprehensive documentation, easy development workflow

### **🏗️ Plugin Ecosystem** 
```
Event Management Engine Core
├── Plugin Registry & Discovery
├── Configuration Management System
├── Dynamic Form Builder
├── Template Engine Integration
├── Permission & Security Layer
├── API Gateway & Routing
└── Event Hook System
    ├── Wedding Plugin
    ├── Conference Plugin  
    ├── Seminar Plugin
    └── Custom Plugins...
```

---

## Plugin Architecture Components

### **🔌 1. Plugin Interface Contract**
**Standard interface yang harus diimplementasikan oleh semua plugins**

```typescript
// Core Plugin Interface
interface EventPlugin {
  // Plugin Metadata
  readonly name: string;                    // 'wedding', 'conference', 'seminar'
  readonly version: string;                 // '1.0.0'
  readonly displayName: string;             // 'Wedding Celebration'
  readonly description: string;
  readonly category: EventCategory;         // 'social', 'business', 'educational'
  readonly author: string;
  readonly supportedFeatures: string[];    // ['rsvp', 'gallery', 'timeline']
  
  // Plugin Lifecycle
  initialize(config: PluginConfiguration): Promise<void>;
  destroy(): Promise<void>;
  reload(): Promise<void>;
  validate(): Promise<ValidationResult>;
  
  // Event Management
  createEvent(data: EventCreateData): Promise<Event>;
  updateEvent(eventId: string, data: EventUpdateData): Promise<Event>;
  deleteEvent(eventId: string): Promise<boolean>;
  getEventTemplate(): EventTemplate;
  
  // Form System
  getFormSchema(): FormSchema;
  validateFormData(data: any): ValidationResult;
  processFormSubmission(data: any): Promise<ProcessingResult>;
  
  // Participant Management
  getParticipantTypes(): ParticipantType[];
  processParticipantRegistration(data: ParticipantData): Promise<boolean>;
  generateAccessCode(participant: Participant): Promise<string>;
  
  // Template & UI
  getDefaultSections(): EventSection[];
  getUIConfiguration(): UIConfiguration;
  getEmailTemplates(): EmailTemplate[];
  
  // Hooks & Events
  onEventCreated?(event: Event): Promise<void>;
  onParticipantRegistered?(participant: Participant): Promise<void>;
  onEventPublished?(event: Event): Promise<void>;
  onRSVPReceived?(rsvp: RSVPData): Promise<void>;
}

// Plugin Configuration Structure
interface PluginConfiguration {
  tenantId?: string;                       // Tenant-specific config
  features: {
    enabled: string[];                     // Enabled features
    disabled: string[];                    // Disabled features
    settings: Record<string, any>;        // Feature-specific settings
  };
  integrations: {
    email: EmailIntegrationConfig;
    calendar: CalendarIntegrationConfig;
    payment: PaymentIntegrationConfig;
    social: SocialIntegrationConfig;
  };
  limits: {
    maxParticipants: number;
    maxTemplates: number;
    storageQuotaMB: number;
  };
  ui: {
    theme: string;
    primaryColor: string;
    customCSS?: string;
    branding: BrandingConfig;
  };
  workflow: {
    approvalRequired: boolean;
    autoPublish: boolean;
    reminderSchedule: ReminderConfig[];
  };
}
```

### **🗂️ 2. Plugin Registry System**
**Central registry untuk manage dan discover plugins**

```typescript
// Plugin Registry Implementation
class PluginRegistry {
  private plugins: Map<string, EventPlugin> = new Map();
  private configurations: Map<string, PluginConfiguration> = new Map();
  private hooks: Map<string, Hook[]> = new Map();
  
  // Plugin Management
  async register(plugin: EventPlugin, config?: PluginConfiguration): Promise<void> {
    await plugin.validate();
    await plugin.initialize(config || {});
    
    this.plugins.set(plugin.name, plugin);
    if (config) {
      this.configurations.set(plugin.name, config);
    }
    
    // Register plugin hooks
    this.registerPluginHooks(plugin);
    
    // Emit plugin registered event
    await this.emit('plugin:registered', { plugin, config });
  }
  
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(pluginName);
      this.configurations.delete(pluginName);
      
      await this.emit('plugin:unregistered', { pluginName });
    }
  }
  
  // Plugin Discovery
  getPlugin(name: string): EventPlugin | undefined {
    return this.plugins.get(name);
  }
  
  getAllPlugins(): EventPlugin[] {
    return Array.from(this.plugins.values());
  }
  
  getPluginsByCategory(category: EventCategory): EventPlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.category === category);
  }
  
  // Configuration Management
  async updatePluginConfig(
    pluginName: string, 
    tenantId: string, 
    config: Partial<PluginConfiguration>
  ): Promise<void> {
    const fullConfig = await this.getTenantPluginConfig(pluginName, tenantId);
    const updatedConfig = { ...fullConfig, ...config };
    
    // Save to database
    await this.savePluginConfiguration(pluginName, tenantId, updatedConfig);
    
    // Reload plugin with new config
    const plugin = this.getPlugin(pluginName);
    if (plugin) {
      await plugin.reload();
    }
  }
  
  // Hook System
  async emit(eventName: string, data: any): Promise<void> {
    const hooks = this.hooks.get(eventName) || [];
    for (const hook of hooks) {
      await hook.execute(data);
    }
  }
}
```

### **📝 3. Dynamic Form System**
**JSON-based dynamic form configuration dan rendering**

```typescript
// Form Schema Definition
interface FormSchema {
  version: string;                         // Schema version
  sections: FormSection[];                 // Form sections
  validation: ValidationRule[];           // Global validation rules
  conditional: ConditionalRule[];         // Conditional field logic
  styling: FormStyling;                   // UI styling configuration
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  layout: 'single' | 'double' | 'grid';
  collapsible?: boolean;
  conditional?: ConditionalRule;
}

interface FormField {
  id: string;
  type: FieldType;                        // 'text', 'email', 'date', 'select', etc.
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation: FieldValidation[];
  options?: FieldOption[];                // For select, radio, checkbox fields
  conditional?: ConditionalRule;
  styling?: FieldStyling;
}

// Wedding Plugin Form Schema Example
const weddingFormSchema: FormSchema = {
  version: "1.0",
  sections: [
    {
      id: "couple_info",
      title: "Couple Information", 
      layout: "double",
      fields: [
        {
          id: "bride_name",
          type: "text",
          label: "Bride Name",
          placeholder: "Enter bride's full name",
          required: true,
          validation: [
            { type: "minLength", value: 2, message: "Name must be at least 2 characters" },
            { type: "maxLength", value: 100, message: "Name cannot exceed 100 characters" }
          ]
        },
        {
          id: "groom_name", 
          type: "text",
          label: "Groom Name",
          placeholder: "Enter groom's full name",
          required: true,
          validation: [
            { type: "minLength", value: 2 },
            { type: "maxLength", value: 100 }
          ]
        }
      ]
    },
    {
      id: "event_details",
      title: "Event Details",
      layout: "single", 
      fields: [
        {
          id: "ceremony_date",
          type: "datetime",
          label: "Ceremony Date & Time",
          required: true,
          validation: [
            { type: "futureDate", message: "Ceremony must be in the future" }
          ]
        },
        {
          id: "venue",
          type: "location",
          label: "Venue",
          placeholder: "Enter venue name and address",
          required: true
        },
        {
          id: "reception_separate",
          type: "checkbox", 
          label: "Reception at different venue",
          required: false
        },
        {
          id: "reception_venue",
          type: "location",
          label: "Reception Venue",
          conditional: {
            field: "reception_separate",
            operator: "equals",
            value: true
          }
        }
      ]
    }
  ],
  validation: [
    {
      type: "custom",
      name: "venue_validation",
      message: "Reception venue is required when different from ceremony",
      rule: "if(reception_separate === true) then reception_venue is required"
    }
  ],
  styling: {
    theme: "elegant",
    primaryColor: "#D4AF37",
    fieldSpacing: "comfortable"
  }
};

// Conference Plugin Form Schema Example  
const conferenceFormSchema: FormSchema = {
  version: "1.0",
  sections: [
    {
      id: "conference_info",
      title: "Conference Information",
      layout: "single",
      fields: [
        {
          id: "conference_title",
          type: "text", 
          label: "Conference Title",
          required: true,
          validation: [{ type: "maxLength", value: 200 }]
        },
        {
          id: "conference_theme",
          type: "text",
          label: "Main Theme",
          required: true
        },
        {
          id: "conference_type",
          type: "select",
          label: "Conference Type",
          required: true,
          options: [
            { value: "virtual", label: "Virtual Conference" },
            { value: "physical", label: "In-Person Conference" },
            { value: "hybrid", label: "Hybrid Conference" }
          ]
        }
      ]
    },
    {
      id: "speakers_agenda",
      title: "Speakers & Agenda",
      layout: "grid",
      fields: [
        {
          id: "keynote_speakers",
          type: "repeatable",
          label: "Keynote Speakers",
          itemSchema: {
            name: { type: "text", required: true },
            title: { type: "text", required: true }, 
            bio: { type: "textarea", required: false },
            photo: { type: "file", required: false }
          }
        },
        {
          id: "session_tracks",
          type: "repeatable",
          label: "Session Tracks", 
          itemSchema: {
            track_name: { type: "text", required: true },
            description: { type: "textarea", required: false },
            duration: { type: "number", required: true }
          }
        }
      ]
    }
  ],
  styling: {
    theme: "professional",
    primaryColor: "#1E40AF"
  }
};
```

### **🎨 4. Template Engine Integration**
**Plugin-based template system dengan inheritance dan customization**

```typescript
// Template System Architecture
interface TemplateEngine {
  // Template Management
  registerTemplate(pluginName: string, template: EventTemplate): Promise<void>;
  getTemplate(templateId: string): Promise<EventTemplate>;
  getTemplatesByPlugin(pluginName: string): Promise<EventTemplate[]>;
  
  // Template Rendering
  renderEvent(event: Event, template: EventTemplate): Promise<RenderedContent>;
  renderSection(section: EventSection, context: RenderContext): Promise<string>;
  renderEmail(template: EmailTemplate, data: any): Promise<EmailContent>;
  
  // Template Customization
  createCustomTemplate(baseTemplate: EventTemplate, customizations: any): Promise<EventTemplate>;
  previewTemplate(template: EventTemplate, sampleData: any): Promise<PreviewResult>;
}

// Wedding Plugin Template Example
const weddingTemplateConfig = {
  id: "wedding_elegant_gold",
  name: "Elegant Gold Wedding",
  plugin: "wedding",
  category: "elegant",
  sections: [
    {
      type: "hero",
      template: "wedding_hero_elegant",
      defaultData: {
        showCountdown: true,
        showSaveTheDate: true,
        backgroundType: "image"
      },
      customizable: {
        backgroundColor: true,
        backgroundImage: true,
        textColor: true,
        fonts: ["Playfair Display", "Open Sans"]
      }
    },
    {
      type: "story", 
      template: "wedding_story_timeline",
      defaultData: {
        layout: "timeline",
        showPhotos: true
      }
    },
    {
      type: "event_details",
      template: "wedding_details_card",
      defaultData: {
        showMap: true,
        showDirections: true,
        showCalendarAdd: true
      }
    },
    {
      type: "rsvp",
      template: "wedding_rsvp_form",
      defaultData: {
        allowPlusOne: true,
        mealPreferences: true,
        customQuestions: []
      }
    }
  ],
  styling: {
    primaryColor: "#D4AF37",
    secondaryColor: "#F8F9FA", 
    accentColor: "#8B4513",
    fonts: {
      heading: "Playfair Display",
      body: "Open Sans"
    },
    spacing: "comfortable",
    borderRadius: "rounded"
  }
};
```

### **🔐 5. Permission & Security Integration**
**Plugin-aware permission system dengan fine-grained access control**

```typescript
// Plugin Permission System
interface PluginPermissionManager {
  // Permission Registration
  registerPluginPermissions(pluginName: string, permissions: Permission[]): Promise<void>;
  
  // Permission Checking
  hasPluginPermission(userId: string, pluginName: string, permission: string): Promise<boolean>;
  getUserPluginPermissions(userId: string, pluginName: string): Promise<Permission[]>;
  
  // Role Management
  assignPluginRole(userId: string, pluginName: string, role: string): Promise<void>;
  getPluginRoles(pluginName: string): Promise<Role[]>;
}

// Wedding Plugin Permissions
const weddingPermissions: Permission[] = [
  {
    name: "wedding:create",
    resource: "wedding", 
    action: "create",
    description: "Create wedding events",
    category: "content"
  },
  {
    name: "wedding:guest_manage",
    resource: "wedding_guests",
    action: "manage", 
    description: "Manage wedding guest list",
    category: "content"
  },
  {
    name: "wedding:rsvp_view",
    resource: "wedding_rsvp",
    action: "read",
    description: "View RSVP responses",
    category: "analytics"
  },
  {
    name: "wedding:template_premium",
    resource: "wedding_templates", 
    action: "premium_access",
    description: "Access premium wedding templates",
    category: "premium"
  }
];

// Conference Plugin Permissions
const conferencePermissions: Permission[] = [
  {
    name: "conference:create",
    resource: "conference",
    action: "create", 
    description: "Create conference events",
    category: "content"
  },
  {
    name: "conference:speaker_manage",
    resource: "conference_speakers",
    action: "manage",
    description: "Manage conference speakers",
    category: "content" 
  },
  {
    name: "conference:agenda_manage",
    resource: "conference_agenda",
    action: "manage",
    description: "Manage conference agenda",
    category: "content"
  }
];
```

### **🌐 6. API Gateway & Plugin Routing**
**Unified API gateway dengan plugin-specific endpoints**

```typescript
// Plugin API Gateway
class PluginAPIGateway {
  private router: Router;
  private plugins: PluginRegistry;
  
  constructor(plugins: PluginRegistry) {
    this.plugins = plugins;
    this.router = new Router();
    this.setupRoutes();
  }
  
  private setupRoutes(): void {
    // Generic plugin routes
    this.router.get('/api/plugins', this.listPlugins.bind(this));
    this.router.get('/api/plugins/:name', this.getPlugin.bind(this));
    this.router.get('/api/plugins/:name/schema', this.getPluginFormSchema.bind(this));
    
    // Dynamic plugin-specific routes
    this.router.use('/api/events/:pluginName', this.pluginRouteHandler.bind(this));
    
    // Plugin configuration routes (admin only)
    this.router.get('/api/admin/plugins/:name/config', this.getPluginConfig.bind(this));
    this.router.post('/api/admin/plugins/:name/config', this.updatePluginConfig.bind(this));
  }
  
  private async pluginRouteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const pluginName = req.params.pluginName;
    const plugin = this.plugins.getPlugin(pluginName);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Delegate to plugin-specific handler
    const pluginRouter = await this.getPluginRouter(plugin);
    pluginRouter(req, res, next);
  }
  
  // Plugin-specific API endpoints
  private async getPluginRouter(plugin: EventPlugin): Promise<Router> {
    const router = new Router();
    
    // Standard CRUD operations
    router.post('/', async (req, res) => {
      try {
        const event = await plugin.createEvent(req.body);
        res.status(201).json(event);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/:id', async (req, res) => {
      // Implementation for get event
    });
    
    router.put('/:id', async (req, res) => {
      try {
        const event = await plugin.updateEvent(req.params.id, req.body);
        res.json(event);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    router.delete('/:id', async (req, res) => {
      try {
        await plugin.deleteEvent(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Plugin-specific endpoints
    router.get('/:id/participants', async (req, res) => {
      // Get event participants
    });
    
    router.post('/:id/participants', async (req, res) => {
      // Add participant
    });
    
    router.post('/:id/rsvp', async (req, res) => {
      // Handle RSVP submission
    });
    
    return router;
  }
}
```

---

## Plugin Development Workflow

### **🛠️ Plugin Development Kit (PDK)**
```typescript
// Plugin Development Kit
class PluginDevelopmentKit {
  // Plugin Scaffolding
  async createPlugin(name: string, type: 'social' | 'business' | 'educational'): Promise<void> {
    const scaffoldPath = `./plugins/${name}`;
    
    // Create plugin structure
    await this.createDirectory(scaffoldPath);
    await this.createFile(`${scaffoldPath}/plugin.ts`, this.getPluginTemplate(name, type));
    await this.createFile(`${scaffoldPath}/schema.json`, this.getSchemaTemplate(type));
    await this.createFile(`${scaffoldPath}/templates/`, this.getTemplateDirectory(type));
    await this.createFile(`${scaffoldPath}/tests/`, this.getTestDirectory(name));
    await this.createFile(`${scaffoldPath}/package.json`, this.getPackageJson(name));
  }
  
  // Plugin Testing
  async testPlugin(pluginPath: string): Promise<TestResult> {
    const plugin = await this.loadPlugin(pluginPath);
    
    return {
      validation: await plugin.validate(),
      formSchema: await this.validateFormSchema(plugin.getFormSchema()),
      permissions: await this.validatePermissions(plugin),
      templates: await this.validateTemplates(plugin),
      performance: await this.performanceTest(plugin)
    };
  }
  
  // Plugin Deployment
  async deployPlugin(pluginPath: string, environment: 'staging' | 'production'): Promise<void> {
    const testResult = await this.testPlugin(pluginPath);
    
    if (!testResult.validation.success) {
      throw new Error('Plugin validation failed');
    }
    
    // Deploy to environment
    await this.uploadPlugin(pluginPath, environment);
    await this.registerPlugin(pluginPath, environment);
  }
}
```

### **📋 Plugin Development Guidelines**

#### **✅ Plugin Checklist**
- [ ] Implements EventPlugin interface completely
- [ ] Form schema follows JSON Schema specification
- [ ] All permissions properly defined dan documented
- [ ] Templates responsive dan accessible
- [ ] Comprehensive unit tests (>90% coverage)
- [ ] Integration tests dengan core system
- [ ] Performance tests (<100ms initialization)
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Multi-tenant isolation verified

#### **🚀 Plugin Performance Standards**
- **Initialization**: <100ms
- **Form Rendering**: <50ms
- **Event Creation**: <200ms
- **Template Processing**: <150ms
- **Database Queries**: <50ms
- **Memory Usage**: <50MB per plugin
- **CPU Usage**: <5% under normal load

---

## Built-in Plugins

### **💒 Wedding Plugin (Reference Implementation)**
```typescript
class WeddingPlugin implements EventPlugin {
  readonly name = 'wedding';
  readonly version = '1.0.0';
  readonly displayName = 'Wedding Celebration';
  readonly category = 'social' as EventCategory;
  readonly supportedFeatures = [
    'rsvp', 'gallery', 'gift_registry', 'timeline', 
    'seating_chart', 'live_streaming', 'guestbook'
  ];
  
  async initialize(config: PluginConfiguration): Promise<void> {
    // Initialize wedding-specific services
    this.rsvpService = new RSVPService(config.features.settings.rsvp);
    this.giftRegistryService = new GiftRegistryService(config.integrations);
    this.timelineService = new TimelineService();
  }
  
  getFormSchema(): FormSchema {
    return weddingFormSchema;
  }
  
  getDefaultSections(): EventSection[] {
    return [
      { type: 'hero', title: 'Welcome', order: 1 },
      { type: 'story', title: 'Our Story', order: 2 },
      { type: 'event_details', title: 'Event Details', order: 3 },
      { type: 'rsvp', title: 'RSVP', order: 4 },
      { type: 'gallery', title: 'Gallery', order: 5 },
      { type: 'gift_registry', title: 'Gift Registry', order: 6 }
    ];
  }
  
  async createEvent(data: EventCreateData): Promise<Event> {
    // Wedding-specific event creation logic
    const event = await this.eventService.create({
      ...data,
      event_type: 'wedding',
      default_sections: this.getDefaultSections()
    });
    
    // Initialize wedding-specific features
    if (this.config.features.enabled.includes('gift_registry')) {
      await this.giftRegistryService.initialize(event.id);
    }
    
    return event;
  }
  
  // Wedding-specific hook implementations
  async onParticipantRegistered(participant: Participant): Promise<void> {
    // Send welcome email dengan wedding-specific content
    await this.emailService.sendWeddingWelcome(participant);
    
    // Add to seating chart if enabled
    if (this.config.features.enabled.includes('seating_chart')) {
      await this.seatingChartService.addGuest(participant);
    }
  }
}
```

### **🎯 Conference Plugin (Future Implementation)**
```typescript
class ConferencePlugin implements EventPlugin {
  readonly name = 'conference';
  readonly version = '1.0.0';
  readonly displayName = 'Professional Conference';
  readonly category = 'business' as EventCategory;
  readonly supportedFeatures = [
    'agenda', 'speakers', 'sessions', 'networking',
    'live_streaming', 'q_and_a', 'polls', 'certificates'
  ];
  
  getFormSchema(): FormSchema {
    return conferenceFormSchema;
  }
  
  getDefaultSections(): EventSection[] {
    return [
      { type: 'hero', title: 'Conference Overview', order: 1 },
      { type: 'agenda', title: 'Schedule & Agenda', order: 2 },
      { type: 'speakers', title: 'Keynote Speakers', order: 3 },
      { type: 'sessions', title: 'Sessions & Tracks', order: 4 },
      { type: 'registration', title: 'Register Now', order: 5 },
      { type: 'sponsors', title: 'Our Sponsors', order: 6 }
    ];
  }
  
  async createEvent(data: EventCreateData): Promise<Event> {
    // Conference-specific event creation
    const event = await this.eventService.create({
      ...data,
      event_type: 'conference',
      default_sections: this.getDefaultSections()
    });
    
    // Initialize conference features
    await this.agendaService.initialize(event.id);
    await this.speakerService.initialize(event.id);
    
    return event;
  }
}
```

---

## Implementation Timeline

### **Week 1: Core Plugin Framework**
- [ ] Plugin interface dan registry implementation  
- [ ] Basic plugin lifecycle management
- [ ] Configuration system foundation
- [ ] API gateway routing setup

### **Week 2: Dynamic Form System**
- [ ] Form schema processor implementation
- [ ] Dynamic form renderer (frontend)
- [ ] Validation engine development
- [ ] Conditional logic processor

### **Week 3: Wedding Plugin (Reference)**
- [ ] Complete wedding plugin implementation
- [ ] Form schema untuk wedding events
- [ ] Wedding-specific templates
- [ ] Integration testing dengan core system

### **Week 4: Testing & Documentation**
- [ ] Comprehensive plugin testing framework
- [ ] Plugin development documentation
- [ ] API documentation auto-generation
- [ ] Performance optimization dan monitoring

---

## Success Metrics

### **✅ Technical KPIs**
- **Plugin Loading**: <100ms untuk plugin initialization
- **Form Rendering**: <50ms untuk dynamic forms
- **API Response**: <200ms untuk plugin-specific endpoints
- **Memory Efficient**: <50MB per active plugin
- **Zero Breaking Changes**: 100% backward compatibility maintained

### **✅ Business KPIs**  
- **Extensibility**: New event types deployable dalam <1 day
- **Developer Experience**: Plugin development time <2 weeks
- **User Experience**: Seamless transition dari existing workflow
- **Performance**: No performance degradation dari current system

---

**Status**: ✅ Plugin Architecture Framework Complete  
**Next**: JSON-based Configuration System Implementation  
**Timeline**: 4 weeks untuk complete plugin ecosystem  
**Complexity**: High (comprehensive plugin system dengan full features)