# Wedding Plugin - Reference Implementation

## Executive Summary
Comprehensive wedding plugin implementation yang berfungsi sebagai **reference standard** untuk semua event plugins dalam Event Management Engine. Plugin ini mempertahankan 100% existing wedding functionality sambil mendemonstrasikan best practices untuk plugin development.

---

## Plugin Overview

### **💒 Wedding Plugin Metadata**
```typescript
const WEDDING_PLUGIN_METADATA = {
  name: 'wedding',
  version: '1.2.0',
  displayName: 'Wedding Celebration',
  description: 'Complete wedding invitation and management system with RSVP, guest management, and celebration tools',
  category: 'social',
  author: 'WeddInvite Team',
  supportedFeatures: [
    'rsvp', 'guest_management', 'photo_gallery', 'gift_registry',
    'timeline', 'seating_chart', 'live_streaming', 'guestbook',
    'budget_tracker', 'vendor_management', 'ceremony_music'
  ],
  requiredPermissions: [
    'wedding:create', 'wedding:read', 'wedding:update', 'wedding:delete',
    'wedding:guest_manage', 'wedding:rsvp_view', 'wedding:template_access'
  ],
  tags: ['wedding', 'celebration', 'invitation', 'social', 'rsvp']
};
```

### **🏗️ Wedding Plugin Architecture**
```
Wedding Plugin
├── Core Implementation
│   ├── WeddingPlugin.ts (main plugin class)
│   ├── WeddingService.ts (business logic)
│   ├── WeddingRepository.ts (data access)
│   └── WeddingValidator.ts (validation logic)
├── Form System
│   ├── wedding-form-schema.json (complete form definition)
│   ├── WeddingFormProcessor.ts (form logic)
│   └── WeddingFormValidator.ts (custom validation)
├── UI Components
│   ├── WeddingComponents/ (React components)
│   ├── WeddingTemplates/ (template sections)
│   └── WeddingThemes/ (styling themes)
├── Business Logic
│   ├── RSVPService.ts (RSVP management)
│   ├── GuestService.ts (guest management)
│   ├── GiftRegistryService.ts (gift registry)
│   └── TimelineService.ts (wedding timeline)
├── Integration
│   ├── EmailService.ts (wedding emails)
│   ├── CalendarService.ts (calendar integration)
│   └── SocialService.ts (social sharing)
└── Tests
    ├── WeddingPlugin.test.ts
    ├── integration/
    └── fixtures/
```

---

## Core Plugin Implementation

### **🔥 Main Plugin Class**
**Complete implementation of EventPlugin interface**

```typescript
import { 
  EventPlugin, PluginConfiguration, Event, EventCreateData, EventUpdateData,
  FormSchema, EventSection, UIConfiguration, ValidationResult, Participant
} from '../types/plugin.types';
import { WeddingService } from './services/WeddingService';
import { RSVPService } from './services/RSVPService';
import { GuestService } from './services/GuestService';
import { GiftRegistryService } from './services/GiftRegistryService';
import weddingFormSchema from './schemas/wedding-form-schema.json';

export class WeddingPlugin implements EventPlugin {
  // Plugin Metadata
  readonly name = 'wedding';
  readonly version = '1.2.0';
  readonly displayName = 'Wedding Celebration';
  readonly description = 'Complete wedding invitation and management system';
  readonly category = 'social' as const;
  readonly author = 'WeddInvite Team';
  readonly supportedFeatures = [
    'rsvp', 'guest_management', 'photo_gallery', 'gift_registry',
    'timeline', 'seating_chart', 'live_streaming', 'guestbook'
  ];

  // Services
  private weddingService: WeddingService;
  private rsvpService: RSVPService;
  private guestService: GuestService;
  private giftRegistryService: GiftRegistryService;
  private config: PluginConfiguration;
  private initialized = false;

  constructor(
    private db: DatabaseConnection,
    private eventBus: EventBus,
    private logger: Logger
  ) {
    this.weddingService = new WeddingService(db, logger);
    this.rsvpService = new RSVPService(db, eventBus, logger);
    this.guestService = new GuestService(db, eventBus, logger);
    this.giftRegistryService = new GiftRegistryService(db, logger);
  }

  // Plugin Lifecycle
  async initialize(config: PluginConfiguration): Promise<void> {
    try {
      this.config = config;
      
      // Initialize services dengan configuration
      await this.weddingService.initialize(config);
      await this.rsvpService.initialize(config.features?.settings?.rsvp || {});
      await this.guestService.initialize(config.features?.settings?.guests || {});
      
      // Setup gift registry jika enabled
      if (config.features?.enabled?.includes('gift_registry')) {
        await this.giftRegistryService.initialize(config.features.settings.giftRegistry || {});
      }

      // Register event handlers
      this.registerEventHandlers();
      
      this.initialized = true;
      this.logger.info('Wedding plugin initialized successfully', { version: this.version });
      
    } catch (error) {
      this.logger.error('Failed to initialize wedding plugin', { error });
      throw new Error(`Wedding plugin initialization failed: ${error.message}`);
    }
  }

  async destroy(): Promise<void> {
    // Cleanup resources
    await this.weddingService.destroy();
    await this.rsvpService.destroy();
    await this.guestService.destroy();
    await this.giftRegistryService.destroy();
    
    this.initialized = false;
    this.logger.info('Wedding plugin destroyed');
  }

  async reload(): Promise<void> {
    await this.destroy();
    await this.initialize(this.config);
  }

  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Validate required dependencies
    if (!this.db) {
      errors.push('Database connection required');
    }
    
    // Validate form schema
    const schemaValidation = this.validateFormSchema();
    if (!schemaValidation.success) {
      errors.push(...schemaValidation.errors.map(e => e.message));
    }
    
    // Validate services
    try {
      await this.weddingService.healthCheck();
    } catch (error) {
      errors.push(`Wedding service validation failed: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      errors: errors.map(msg => ({ message: msg, path: '', value: null }))
    };
  }

  // Event Management
  async createEvent(data: EventCreateData): Promise<Event> {
    this.ensureInitialized();
    
    try {
      // Validate wedding-specific data
      const validationResult = this.validateFormData(data.formData || {});
      if (!validationResult.success) {
        throw new Error(`Invalid wedding data: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // Create base event
      const event = await this.weddingService.createEvent({
        ...data,
        event_type: 'wedding',
        default_sections: this.getDefaultSections()
      });

      // Initialize wedding-specific features
      await this.initializeWeddingFeatures(event);

      // Trigger wedding created hook
      await this.onEventCreated(event);

      this.logger.info('Wedding event created', { eventId: event.id, title: event.title });
      return event;
      
    } catch (error) {
      this.logger.error('Failed to create wedding event', { error, data });
      throw error;
    }
  }

  async updateEvent(eventId: string, data: EventUpdateData): Promise<Event> {
    this.ensureInitialized();
    
    try {
      const event = await this.weddingService.updateEvent(eventId, data);
      
      // Handle feature updates
      if (data.formData) {
        await this.updateWeddingFeatures(event, data.formData);
      }

      this.logger.info('Wedding event updated', { eventId, changes: Object.keys(data) });
      return event;
      
    } catch (error) {
      this.logger.error('Failed to update wedding event', { error, eventId, data });
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      // Clean up wedding-specific data
      await this.cleanupWeddingData(eventId);
      
      // Delete main event
      const result = await this.weddingService.deleteEvent(eventId);
      
      this.logger.info('Wedding event deleted', { eventId });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to delete wedding event', { error, eventId });
      throw error;
    }
  }

  getEventTemplate(): any {
    return {
      type: 'wedding',
      name: 'Wedding Celebration',
      sections: this.getDefaultSections(),
      formSchema: this.getFormSchema(),
      uiConfig: this.getUIConfiguration()
    };
  }

  // Form System
  getFormSchema(): FormSchema {
    return weddingFormSchema as FormSchema;
  }

  validateFormData(data: any): ValidationResult {
    const errors: any[] = [];
    
    // Required fields validation
    if (!data.bride_name || data.bride_name.trim() === '') {
      errors.push({ path: 'bride_name', message: 'Bride name is required', value: data.bride_name });
    }
    
    if (!data.groom_name || data.groom_name.trim() === '') {
      errors.push({ path: 'groom_name', message: 'Groom name is required', value: data.groom_name });
    }
    
    if (!data.wedding_date) {
      errors.push({ path: 'wedding_date', message: 'Wedding date is required', value: data.wedding_date });
    } else {
      // Validate future date
      const weddingDate = new Date(data.wedding_date);
      if (weddingDate <= new Date()) {
        errors.push({ 
          path: 'wedding_date', 
          message: 'Wedding date must be in the future', 
          value: data.wedding_date 
        });
      }
    }

    // Venue validation
    if (!data.ceremony_venue || !data.ceremony_venue.name) {
      errors.push({ 
        path: 'ceremony_venue', 
        message: 'Ceremony venue is required', 
        value: data.ceremony_venue 
      });
    }

    // Conditional validation for reception venue
    if (data.separate_reception && (!data.reception_venue || !data.reception_venue.name)) {
      errors.push({ 
        path: 'reception_venue', 
        message: 'Reception venue is required when different from ceremony', 
        value: data.reception_venue 
      });
    }

    // Guest count validation
    if (data.max_guests && (data.max_guests < 1 || data.max_guests > 1000)) {
      errors.push({ 
        path: 'max_guests', 
        message: 'Guest count must be between 1 and 1000', 
        value: data.max_guests 
      });
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  async processFormSubmission(data: any): Promise<any> {
    // Process wedding-specific form submission logic
    const processedData = {
      ...data,
      processed_at: new Date().toISOString(),
      wedding_specific_processing: true
    };

    // Handle special wedding fields
    if (data.ceremony_venue && data.reception_venue && !data.separate_reception) {
      processedData.reception_venue = data.ceremony_venue;
    }

    return processedData;
  }

  // Participant Management
  getParticipantTypes(): any[] {
    return [
      {
        type: 'guest',
        displayName: 'Wedding Guest',
        description: 'Regular wedding guest',
        defaultFields: ['name', 'email', 'phone', 'plus_one'],
        customFields: ['meal_preference', 'dietary_restrictions', 'table_assignment']
      },
      {
        type: 'wedding_party',
        displayName: 'Wedding Party',
        description: 'Bridesmaids, groomsmen, flower girls, etc.',
        defaultFields: ['name', 'email', 'phone', 'role'],
        customFields: ['relationship', 'special_instructions']
      },
      {
        type: 'family',
        displayName: 'Family Member',
        description: 'Close family members',
        defaultFields: ['name', 'email', 'phone', 'relationship'],
        customFields: ['special_seating', 'dietary_restrictions']
      },
      {
        type: 'vendor',
        displayName: 'Vendor/Service Provider',
        description: 'Photographers, caterers, musicians, etc.',
        defaultFields: ['name', 'email', 'phone', 'company'],
        customFields: ['service_type', 'contact_person', 'arrival_time']
      }
    ];
  }

  async processParticipantRegistration(data: any): Promise<boolean> {
    try {
      // Validate participant data
      if (!data.name || !data.email) {
        throw new Error('Name and email are required for participant registration');
      }

      // Process wedding-specific participant logic
      const participantData = {
        ...data,
        participant_type: data.participant_type || 'guest',
        registered_at: new Date().toISOString(),
        wedding_specific: true
      };

      // Handle plus one logic
      if (data.plus_one_requested && this.config.features?.settings?.rsvp?.allowPlusOne) {
        participantData.plus_one_allowed = true;
        participantData.plus_one_count = data.plus_one_count || 1;
      }

      await this.guestService.addParticipant(participantData);
      
      // Send welcome email jika enabled
      if (this.config.features?.enabled?.includes('email_notifications')) {
        await this.sendWelcomeEmail(participantData);
      }

      return true;
      
    } catch (error) {
      this.logger.error('Failed to process participant registration', { error, data });
      throw error;
    }
  }

  async generateAccessCode(participant: any): Promise<string> {
    // Generate unique access code untuk wedding guest
    const code = await this.guestService.generateAccessCode(participant.id);
    
    // Save access code dengan expiry
    await this.guestService.saveAccessCode(participant.id, code, {
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    return code;
  }

  // Template & UI
  getDefaultSections(): EventSection[] {
    return [
      {
        type: 'hero',
        title: 'Welcome',
        component: 'wedding_hero',
        order: 1,
        required: true,
        defaultData: {
          showCountdown: true,
          showSaveTheDate: true,
          backgroundType: 'image'
        }
      },
      {
        type: 'story',
        title: 'Our Love Story',
        component: 'love_story',
        order: 2,
        required: false,
        defaultData: {
          layout: 'timeline',
          showPhotos: true
        }
      },
      {
        type: 'details',
        title: 'Wedding Details',
        component: 'wedding_details',
        order: 3,
        required: true,
        defaultData: {
          showMap: true,
          showDirections: true,
          showCalendarAdd: true
        }
      },
      {
        type: 'rsvp',
        title: 'RSVP',
        component: 'rsvp_form',
        order: 4,
        required: true,
        defaultData: {
          allowPlusOne: this.config?.features?.settings?.rsvp?.allowPlusOne || true,
          mealPreferences: true,
          customQuestions: []
        }
      },
      {
        type: 'gallery',
        title: 'Photo Gallery',
        component: 'photo_gallery',
        order: 5,
        required: false,
        defaultData: {
          allowGuestUploads: this.config?.features?.settings?.gallery?.allowGuestUploads || false,
          maxPhotos: 50
        }
      },
      {
        type: 'gifts',
        title: 'Gift Registry',
        component: 'gift_registry',
        order: 6,
        required: false,
        enabled: this.config?.features?.enabled?.includes('gift_registry') || false
      }
    ];
  }

  getUIConfiguration(): UIConfiguration {
    return {
      theme: 'elegant',
      colorPalette: {
        primary: '#D4AF37',    // Gold
        secondary: '#F8F9FA',  // Light gray
        accent: '#8B4513',     // Brown
        background: '#FFFFFF', // White
        text: '#2C3E50'        // Dark blue-gray
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Open Sans',
        fontSize: 'medium'
      },
      layout: {
        containerWidth: 'medium',
        spacing: 'comfortable',
        borderRadius: 'medium'
      },
      components: {
        button: {
          variant: 'elegant',
          size: 'medium',
          customCSS: 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);'
        },
        input: {
          variant: 'bordered',
          size: 'large',
          customCSS: 'border-radius: 8px; border-color: #D4AF37;'
        },
        card: {
          variant: 'elevated',
          size: 'medium',
          customCSS: 'border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);'
        }
      }
    };
  }

  getEmailTemplates(): any[] {
    return [
      {
        name: 'wedding_invitation',
        subject: 'You\'re Invited to {{bride_name}} & {{groom_name}}\'s Wedding!',
        template: 'wedding_invitation_template.html',
        variables: ['bride_name', 'groom_name', 'wedding_date', 'venue', 'rsvp_link']
      },
      {
        name: 'rsvp_confirmation',
        subject: 'RSVP Confirmation - {{bride_name}} & {{groom_name}}\'s Wedding',
        template: 'rsvp_confirmation_template.html',
        variables: ['guest_name', 'rsvp_status', 'plus_one_count', 'meal_preference']
      },
      {
        name: 'wedding_reminder',
        subject: 'Reminder: {{bride_name}} & {{groom_name}}\'s Wedding is Tomorrow!',
        template: 'wedding_reminder_template.html',
        variables: ['bride_name', 'groom_name', 'wedding_date', 'venue', 'start_time']
      }
    ];
  }

  // Plugin Hooks
  async onEventCreated(event: Event): Promise<void> {
    try {
      this.logger.info('Wedding event created hook', { eventId: event.id });
      
      // Initialize wedding-specific features
      if (this.config.features?.enabled?.includes('gift_registry')) {
        await this.giftRegistryService.createRegistry(event.id);
      }
      
      if (this.config.features?.enabled?.includes('rsvp')) {
        await this.rsvpService.initializeRSVP(event.id, {
          deadline: this.config.features.settings?.rsvp?.deadline || '7_days_before',
          allowPlusOne: this.config.features.settings?.rsvp?.allowPlusOne || true
        });
      }

      // Emit event untuk other services
      this.eventBus.emit('wedding:created', { event, plugin: this.name });
      
    } catch (error) {
      this.logger.error('Wedding event created hook failed', { error, eventId: event.id });
    }
  }

  async onParticipantRegistered(participant: any): Promise<void> {
    try {
      this.logger.info('Wedding participant registered hook', { 
        participantId: participant.id, 
        eventId: participant.event_id 
      });
      
      // Send welcome email
      if (this.config.features?.enabled?.includes('email_notifications')) {
        await this.sendWelcomeEmail(participant);
      }
      
      // Add to seating chart jika enabled
      if (this.config.features?.enabled?.includes('seating_chart')) {
        await this.addToSeatingChart(participant);
      }
      
      // Update guest statistics
      await this.guestService.updateStatistics(participant.event_id);

      this.eventBus.emit('wedding:participant_registered', { participant, plugin: this.name });
      
    } catch (error) {
      this.logger.error('Wedding participant registered hook failed', { error, participant });
    }
  }

  async onEventPublished(event: Event): Promise<void> {
    try {
      this.logger.info('Wedding event published hook', { eventId: event.id });
      
      // Send invitations jika auto-send enabled
      if (this.config.workflow?.autoSendInvitations) {
        await this.sendWeddingInvitations(event.id);
      }
      
      // Setup reminders
      if (this.config.features?.settings?.rsvp?.reminderSchedule) {
        await this.scheduleReminders(event);
      }

      this.eventBus.emit('wedding:published', { event, plugin: this.name });
      
    } catch (error) {
      this.logger.error('Wedding event published hook failed', { error, eventId: event.id });
    }
  }

  async onRSVPReceived(rsvpData: any): Promise<void> {
    try {
      this.logger.info('Wedding RSVP received hook', { 
        eventId: rsvpData.event_id, 
        guestId: rsvpData.participant_id 
      });
      
      // Process RSVP
      await this.rsvpService.processRSVP(rsvpData);
      
      // Send confirmation email
      await this.sendRSVPConfirmation(rsvpData);
      
      // Update seating chart jika applicable
      if (rsvpData.status === 'accepted' && this.config.features?.enabled?.includes('seating_chart')) {
        await this.updateSeatingChart(rsvpData);
      }
      
      // Update event statistics
      await this.updateEventStatistics(rsvpData.event_id);

      this.eventBus.emit('wedding:rsvp_received', { rsvpData, plugin: this.name });
      
    } catch (error) {
      this.logger.error('Wedding RSVP received hook failed', { error, rsvpData });
    }
  }

  // Private Helper Methods
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Wedding plugin not initialized');
    }
  }

  private validateFormSchema(): ValidationResult {
    // Validate form schema structure
    try {
      const schema = this.getFormSchema();
      
      if (!schema.sections || !Array.isArray(schema.sections)) {
        return {
          success: false,
          errors: [{ message: 'Form schema must have sections array', path: 'sections', value: null }]
        };
      }

      return { success: true, errors: [] };
      
    } catch (error) {
      return {
        success: false,
        errors: [{ message: `Form schema validation failed: ${error.message}`, path: '', value: null }]
      };
    }
  }

  private registerEventHandlers(): void {
    // Register internal event handlers
    this.eventBus.on('wedding:guest_added', this.handleGuestAdded.bind(this));
    this.eventBus.on('wedding:rsvp_deadline_approaching', this.handleRSVPDeadlineApproaching.bind(this));
    this.eventBus.on('wedding:event_updated', this.handleEventUpdated.bind(this));
  }

  private async initializeWeddingFeatures(event: Event): Promise<void> {
    const features = this.config.features?.enabled || [];
    
    for (const feature of features) {
      switch (feature) {
        case 'gift_registry':
          await this.giftRegistryService.createRegistry(event.id);
          break;
        case 'rsvp':
          await this.rsvpService.initializeRSVP(event.id, this.config.features?.settings?.rsvp || {});
          break;
        case 'seating_chart':
          await this.initializeSeatingChart(event.id);
          break;
        default:
          this.logger.debug('Unknown feature, skipping initialization', { feature });
      }
    }
  }

  private async updateWeddingFeatures(event: Event, formData: any): Promise<void> {
    // Update wedding-specific features based on form data changes
    if (formData.max_guests !== undefined) {
      await this.guestService.updateGuestLimit(event.id, formData.max_guests);
    }
    
    if (formData.meal_options !== undefined) {
      await this.rsvpService.updateMealOptions(event.id, formData.meal_options);
    }
  }

  private async cleanupWeddingData(eventId: string): Promise<void> {
    // Clean up all wedding-specific data
    await Promise.all([
      this.guestService.deleteEventGuests(eventId),
      this.rsvpService.deleteEventRSVPs(eventId),
      this.giftRegistryService.deleteRegistry(eventId)
    ]);
  }

  private async sendWelcomeEmail(participant: any): Promise<void> {
    // Implementation for sending welcome email
    this.logger.info('Sending welcome email', { participantId: participant.id });
    // Actual email sending logic would go here
  }

  private async sendRSVPConfirmation(rsvpData: any): Promise<void> {
    // Implementation for sending RSVP confirmation
    this.logger.info('Sending RSVP confirmation', { eventId: rsvpData.event_id });
    // Actual email sending logic would go here
  }

  private async addToSeatingChart(participant: any): Promise<void> {
    // Implementation for adding participant to seating chart
    this.logger.info('Adding to seating chart', { participantId: participant.id });
  }

  private async handleGuestAdded(data: any): Promise<void> {
    // Handle guest added event
    this.logger.info('Guest added event received', data);
  }

  private async handleRSVPDeadlineApproaching(data: any): Promise<void> {
    // Handle RSVP deadline approaching
    this.logger.info('RSVP deadline approaching', data);
  }

  private async handleEventUpdated(data: any): Promise<void> {
    // Handle event updated
    this.logger.info('Wedding event updated', data);
  }
}

export default WeddingPlugin;
```

---

## Wedding Form Schema

### **📝 Complete Wedding Form Schema**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "title": "Wedding Event Configuration",
  "version": "1.2.0",
  "sections": [
    {
      "id": "couple_information",
      "title": "Couple Information",
      "description": "Basic information about the bride and groom",
      "layout": "double",
      "required": true,
      "fields": [
        {
          "id": "bride_name",
          "type": "text",
          "label": "Bride's Full Name",
          "placeholder": "Enter bride's full name",
          "required": true,
          "validation": [
            { "type": "required", "message": "Bride's name is required" },
            { "type": "minLength", "value": 2, "message": "Name must be at least 2 characters" },
            { "type": "maxLength", "value": 100, "message": "Name cannot exceed 100 characters" }
          ]
        },
        {
          "id": "groom_name",
          "type": "text",
          "label": "Groom's Full Name", 
          "placeholder": "Enter groom's full name",
          "required": true,
          "validation": [
            { "type": "required", "message": "Groom's name is required" },
            { "type": "minLength", "value": 2 },
            { "type": "maxLength", "value": 100 }
          ]
        },
        {
          "id": "wedding_hashtag",
          "type": "text",
          "label": "Wedding Hashtag (Optional)",
          "placeholder": "#BrideGroomWedding2025",
          "helpText": "A unique hashtag for social media sharing",
          "required": false,
          "validation": [
            { "type": "pattern", "value": "^#[a-zA-Z0-9_]+$", "message": "Must start with # and contain only letters, numbers, and underscores" }
          ]
        }
      ]
    },
    {
      "id": "wedding_details",
      "title": "Wedding Details",
      "layout": "single", 
      "required": true,
      "fields": [
        {
          "id": "wedding_date",
          "type": "datetime",
          "label": "Wedding Date & Time",
          "required": true,
          "validation": [
            { "type": "required", "message": "Wedding date is required" },
            { "type": "futureDate", "message": "Wedding date must be in the future" }
          ]
        },
        {
          "id": "ceremony_venue",
          "type": "location",
          "label": "Ceremony Venue",
          "placeholder": "Enter ceremony venue details",
          "required": true,
          "helpText": "Include venue name and complete address",
          "customProperties": {
            "showMap": true,
            "allowCoordinates": true
          }
        },
        {
          "id": "separate_reception",
          "type": "checkbox",
          "label": "Reception at different venue",
          "defaultValue": false,
          "helpText": "Check if reception will be held at a different location"
        },
        {
          "id": "reception_venue",
          "type": "location", 
          "label": "Reception Venue",
          "placeholder": "Enter reception venue details",
          "conditional": {
            "field": "separate_reception",
            "operator": "equals",
            "value": true,
            "action": "show"
          },
          "customProperties": {
            "showMap": true,
            "allowCoordinates": true
          }
        },
        {
          "id": "dress_code",
          "type": "select",
          "label": "Dress Code",
          "required": false,
          "options": [
            { "value": "casual", "label": "Casual" },
            { "value": "semi_formal", "label": "Semi-Formal" },
            { "value": "formal", "label": "Formal" },
            { "value": "black_tie", "label": "Black Tie" },
            { "value": "white_tie", "label": "White Tie" },
            { "value": "custom", "label": "Custom Dress Code" }
          ]
        },
        {
          "id": "custom_dress_code",
          "type": "text",
          "label": "Custom Dress Code Details",
          "conditional": {
            "field": "dress_code",
            "operator": "equals", 
            "value": "custom"
          }
        }
      ]
    },
    {
      "id": "guest_management",
      "title": "Guest Management",
      "layout": "single",
      "required": false,
      "fields": [
        {
          "id": "max_guests",
          "type": "number",
          "label": "Maximum Number of Guests",
          "defaultValue": 100,
          "helpText": "Total number of guests you expect to invite",
          "validation": [
            { "type": "min", "value": 1, "message": "Must have at least 1 guest" },
            { "type": "max", "value": 1000, "message": "Maximum 1000 guests supported" }
          ]
        },
        {
          "id": "allow_plus_one",
          "type": "checkbox",
          "label": "Allow guests to bring plus one",
          "defaultValue": true,
          "helpText": "Allow single guests to bring a companion"
        },
        {
          "id": "plus_one_restrictions",
          "type": "textarea",
          "label": "Plus One Restrictions (Optional)",
          "placeholder": "e.g., Plus ones only for married couples and long-term relationships",
          "conditional": {
            "field": "allow_plus_one",
            "operator": "equals",
            "value": true
          }
        },
        {
          "id": "children_allowed",
          "type": "select",
          "label": "Children Policy",
          "defaultValue": "welcome",
          "options": [
            { "value": "welcome", "label": "Children Welcome" },
            { "value": "family_only", "label": "Family Children Only" },
            { "value": "adults_only", "label": "Adults Only Celebration" }
          ]
        }
      ]
    },
    {
      "id": "rsvp_settings",
      "title": "RSVP Settings",
      "layout": "single",
      "fields": [
        {
          "id": "rsvp_deadline",
          "type": "date",
          "label": "RSVP Deadline",
          "required": true,
          "helpText": "Last date for guests to respond",
          "validation": [
            { "type": "required", "message": "RSVP deadline is required" },
            { "type": "futureDate", "message": "RSVP deadline must be in the future" }
          ]
        },
        {
          "id": "collect_meal_preferences",
          "type": "checkbox",
          "label": "Collect meal preferences",
          "defaultValue": true,
          "helpText": "Ask guests about their meal preferences and dietary restrictions"
        },
        {
          "id": "meal_options",
          "type": "repeatable",
          "label": "Meal Options",
          "conditional": {
            "field": "collect_meal_preferences",
            "operator": "equals",
            "value": true
          },
          "itemSchema": {
            "name": {
              "type": "text",
              "label": "Meal Option Name",
              "required": true,
              "placeholder": "e.g., Chicken, Beef, Vegetarian"
            },
            "description": {
              "type": "textarea",
              "label": "Description",
              "required": false,
              "placeholder": "Brief description of the meal"
            },
            "dietary_info": {
              "type": "select",
              "label": "Dietary Category",
              "options": [
                { "value": "regular", "label": "Regular" },
                { "value": "vegetarian", "label": "Vegetarian" },
                { "value": "vegan", "label": "Vegan" },
                { "value": "gluten_free", "label": "Gluten-Free" },
                { "value": "halal", "label": "Halal" },
                { "value": "kosher", "label": "Kosher" }
              ]
            }
          },
          "defaultValue": [
            {
              "name": "Grilled Chicken",
              "description": "Herb-grilled chicken breast with seasonal vegetables",
              "dietary_info": "regular"
            },
            {
              "name": "Vegetarian Pasta",
              "description": "Fresh pasta with roasted vegetables and herbs",
              "dietary_info": "vegetarian"
            }
          ]
        },
        {
          "id": "custom_rsvp_questions",
          "type": "repeatable",
          "label": "Additional RSVP Questions",
          "helpText": "Add custom questions for your guests",
          "itemSchema": {
            "question": {
              "type": "text",
              "label": "Question",
              "required": true,
              "placeholder": "e.g., Will you need transportation?"
            },
            "type": {
              "type": "select",
              "label": "Answer Type",
              "required": true,
              "options": [
                { "value": "text", "label": "Text Answer" },
                { "value": "yes_no", "label": "Yes/No" },
                { "value": "multiple_choice", "label": "Multiple Choice" }
              ]
            },
            "required": {
              "type": "checkbox",
              "label": "Required Question",
              "defaultValue": false
            }
          }
        }
      ]
    },
    {
      "id": "special_features",
      "title": "Special Features",
      "layout": "grid",
      "required": false,
      "fields": [
        {
          "id": "gift_registry_enabled",
          "type": "checkbox",
          "label": "Enable Gift Registry",
          "defaultValue": false,
          "helpText": "Allow guests to view and purchase gifts from your registry"
        },
        {
          "id": "gift_registry_message",
          "type": "textarea",
          "label": "Gift Registry Message",
          "placeholder": "Your presence is the only present we need, but if you wish to give a gift...",
          "conditional": {
            "field": "gift_registry_enabled",
            "operator": "equals",
            "value": true
          }
        },
        {
          "id": "live_streaming",
          "type": "checkbox",
          "label": "Enable Live Streaming",
          "defaultValue": false,
          "helpText": "Stream your ceremony for guests who cannot attend"
        },
        {
          "id": "streaming_platform",
          "type": "select",
          "label": "Streaming Platform",
          "conditional": {
            "field": "live_streaming",
            "operator": "equals",
            "value": true
          },
          "options": [
            { "value": "youtube", "label": "YouTube Live" },
            { "value": "facebook", "label": "Facebook Live" },
            { "value": "zoom", "label": "Zoom Meeting" },
            { "value": "custom", "label": "Custom Platform" }
          ]
        },
        {
          "id": "photo_sharing",
          "type": "checkbox", 
          "label": "Enable Guest Photo Sharing",
          "defaultValue": true,
          "helpText": "Let guests upload and share photos from your special day"
        },
        {
          "id": "guestbook_enabled",
          "type": "checkbox",
          "label": "Enable Digital Guestbook",
          "defaultValue": true,
          "helpText": "Allow guests to leave digital messages and wishes"
        }
      ]
    }
  ],
  "validation": [
    {
      "type": "custom",
      "name": "reception_venue_validation",
      "message": "Reception venue is required when different from ceremony venue",
      "customValidator": "function(data) { return !data.separate_reception || (data.reception_venue && data.reception_venue.name); }"
    },
    {
      "type": "custom",
      "name": "rsvp_deadline_validation", 
      "message": "RSVP deadline must be at least 1 week before wedding date",
      "customValidator": "function(data) { if (!data.wedding_date || !data.rsvp_deadline) return true; const weddingDate = new Date(data.wedding_date); const rsvpDeadline = new Date(data.rsvp_deadline); const oneWeek = 7 * 24 * 60 * 60 * 1000; return (weddingDate.getTime() - rsvpDeadline.getTime()) >= oneWeek; }"
    }
  ]
}
```

---

## Wedding Services Implementation

### **🎯 Wedding Service Layer**
```typescript
// WeddingService.ts - Main business logic service
export class WeddingService {
  constructor(
    private db: DatabaseConnection,
    private logger: Logger
  ) {}

  async initialize(config: any): Promise<void> {
    this.logger.info('Initializing wedding service', { config });
  }

  async createEvent(data: any): Promise<Event> {
    return this.db.transaction(async (trx) => {
      // Create base event
      const event = await trx('events').insert({
        tenant_id: data.tenant_id,
        event_type_id: await this.getWeddingEventTypeId(trx),
        title: `${data.formData.bride_name} & ${data.formData.groom_name}'s Wedding`,
        description: data.description,
        event_date: data.formData.wedding_date,
        location: {
          ceremony: data.formData.ceremony_venue,
          reception: data.formData.separate_reception 
            ? data.formData.reception_venue 
            : data.formData.ceremony_venue
        },
        form_data: data.formData,
        status: 'draft',
        created_by: data.created_by,
        created_at: new Date()
      }).returning('*');

      return event[0];
    });
  }

  async updateEvent(eventId: string, data: any): Promise<Event> {
    const updated = await this.db('events')
      .where('id', eventId)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');

    return updated[0];
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const deleted = await this.db('events')
      .where('id', eventId)
      .delete();

    return deleted > 0;
  }

  async healthCheck(): Promise<void> {
    // Verify service health
    await this.db.raw('SELECT 1');
  }

  private async getWeddingEventTypeId(trx: any): Promise<string> {
    const result = await trx('event_types')
      .select('id')
      .where('name', 'wedding')
      .first();
      
    if (!result) {
      throw new Error('Wedding event type not found');
    }
    
    return result.id;
  }
}
```

---

## Testing Strategy

### **🧪 Comprehensive Test Suite**
```typescript
// WeddingPlugin.test.ts
import { WeddingPlugin } from './WeddingPlugin';
import { MockDatabase, MockEventBus, MockLogger } from '../test-utils';

describe('WeddingPlugin', () => {
  let plugin: WeddingPlugin;
  let mockDb: MockDatabase;
  let mockEventBus: MockEventBus;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockDb = new MockDatabase();
    mockEventBus = new MockEventBus();
    mockLogger = new MockLogger();
    
    plugin = new WeddingPlugin(mockDb, mockEventBus, mockLogger);
  });

  describe('Plugin Lifecycle', () => {
    test('should initialize successfully with valid configuration', async () => {
      const config = {
        features: {
          enabled: ['rsvp', 'guest_management'],
          settings: {
            rsvp: { allowPlusOne: true, deadline: '7_days_before' }
          }
        }
      };

      await plugin.initialize(config);
      
      expect(plugin.initialized).toBe(true);
      expect(mockLogger.infoMessages).toContain('Wedding plugin initialized successfully');
    });

    test('should validate successfully', async () => {
      await plugin.initialize({});
      
      const result = await plugin.validate();
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should destroy cleanly', async () => {
      await plugin.initialize({});
      await plugin.destroy();
      
      expect(plugin.initialized).toBe(false);
    });
  });

  describe('Event Management', () => {
    beforeEach(async () => {
      await plugin.initialize({
        features: { enabled: ['rsvp', 'gift_registry'] }
      });
    });

    test('should create wedding event successfully', async () => {
      const eventData = {
        tenant_id: 'test-tenant',
        created_by: 'test-user',
        formData: {
          bride_name: 'Jane',
          groom_name: 'John',
          wedding_date: '2025-06-15T14:00:00Z',
          ceremony_venue: { name: 'Test Venue', address: '123 Test St' }
        }
      };

      const event = await plugin.createEvent(eventData);
      
      expect(event.title).toBe("Jane & John's Wedding");
      expect(event.event_type).toBe('wedding');
      expect(mockEventBus.emittedEvents).toContain('wedding:created');
    });

    test('should validate form data correctly', () => {
      const validData = {
        bride_name: 'Jane',
        groom_name: 'John',
        wedding_date: '2025-06-15T14:00:00Z',
        ceremony_venue: { name: 'Test Venue' }
      };

      const result = plugin.validateFormData(validData);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid form data', () => {
      const invalidData = {
        bride_name: '',
        groom_name: 'John',
        wedding_date: '2020-01-01T14:00:00Z', // Past date
        ceremony_venue: null
      };

      const result = plugin.validateFormData(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Participant Management', () => {
    test('should register wedding guest successfully', async () => {
      await plugin.initialize({ features: { enabled: ['guest_management'] } });
      
      const participantData = {
        name: 'Guest Name',
        email: 'guest@example.com',
        phone: '123-456-7890',
        participant_type: 'guest',
        plus_one_requested: true
      };

      const result = await plugin.processParticipantRegistration(participantData);
      
      expect(result).toBe(true);
      expect(mockEventBus.emittedEvents).toContain('wedding:participant_registered');
    });

    test('should generate unique access codes', async () => {
      await plugin.initialize({});
      
      const participant = { id: 'test-participant', name: 'Test Guest' };
      const accessCode = await plugin.generateAccessCode(participant);
      
      expect(accessCode).toBeTruthy();
      expect(typeof accessCode).toBe('string');
    });
  });

  describe('Hooks and Events', () => {
    test('should handle event created hook', async () => {
      await plugin.initialize({
        features: { enabled: ['rsvp', 'gift_registry'] }
      });
      
      const event = { id: 'test-event', title: 'Test Wedding' };
      await plugin.onEventCreated(event);
      
      expect(mockEventBus.emittedEvents).toContain('wedding:created');
    });

    test('should handle RSVP received hook', async () => {
      await plugin.initialize({ features: { enabled: ['rsvp'] } });
      
      const rsvpData = {
        event_id: 'test-event',
        participant_id: 'test-participant',
        status: 'accepted',
        plus_one_count: 1
      };
      
      await plugin.onRSVPReceived(rsvpData);
      
      expect(mockEventBus.emittedEvents).toContain('wedding:rsvp_received');
    });
  });

  describe('Template and UI', () => {
    test('should provide default sections', () => {
      const sections = plugin.getDefaultSections();
      
      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.find(s => s.type === 'hero')).toBeDefined();
      expect(sections.find(s => s.type === 'rsvp')).toBeDefined();
    });

    test('should provide UI configuration', () => {
      const uiConfig = plugin.getUIConfiguration();
      
      expect(uiConfig.theme).toBe('elegant');
      expect(uiConfig.colorPalette.primary).toBe('#D4AF37');
      expect(uiConfig.typography.headingFont).toBe('Playfair Display');
    });

    test('should provide email templates', () => {
      const templates = plugin.getEmailTemplates();
      
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.find(t => t.name === 'wedding_invitation')).toBeDefined();
    });
  });
});
```

---

## Implementation Timeline

### **Week 1: Core Plugin Implementation**
- [ ] Implement main WeddingPlugin class dengan all interface methods
- [ ] Create wedding-specific services (RSVPService, GuestService, etc.)
- [ ] Implement form validation dan processing
- [ ] Create comprehensive test suite

### **Week 2: UI Components & Templates**
- [ ] Develop wedding-specific React components
- [ ] Create default template sections
- [ ] Implement UI configuration system
- [ ] Design wedding email templates

### **Week 3: Feature Integration**
- [ ] Implement RSVP functionality
- [ ] Build guest management system
- [ ] Create gift registry integration
- [ ] Add timeline dan photo gallery features

### **Week 4: Testing & Documentation**
- [ ] Comprehensive integration testing
- [ ] Performance testing dan optimization
- [ ] Complete API documentation
- [ ] Plugin development guide

---

## Success Metrics

### **✅ Technical KPIs**
- **Plugin Loading**: <100ms initialization time
- **Form Processing**: <200ms untuk complex wedding forms
- **Event Creation**: <300ms untuk wedding event dengan all features
- **Memory Usage**: <80MB untuk fully loaded wedding plugin
- **Test Coverage**: >95% code coverage dengan comprehensive test suite

### **✅ Business KPIs**
- **Feature Parity**: 100% existing wedding functionality preserved
- **User Experience**: Zero breaking changes untuk existing users
- **Performance**: No degradation dari current wedding system
- **Reliability**: 99.9% plugin uptime dan stability
- **Developer Experience**: Clear documentation dan easy customization

---

**Status**: ✅ Wedding Plugin Reference Implementation Complete  
**Next**: Multi-Tenant Architecture Updates untuk Generic Event Handling  
**Timeline**: 4 weeks untuk complete wedding plugin implementation  
**Complexity**: High (comprehensive plugin dengan full wedding functionality)