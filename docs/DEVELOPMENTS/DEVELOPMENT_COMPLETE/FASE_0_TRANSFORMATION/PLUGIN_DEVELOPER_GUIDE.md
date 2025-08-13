# Plugin Developer Guide
**Event Management Engine - Quick Start untuk Developers**

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ dan npm/yarn
- TypeScript knowledge
- React experience
- Familiarity dengan Event Management Engine codebase

### **Setup Development Environment**

```bash
# Clone repository
git clone <repository-url>
cd event-management-engine

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:plugins
```

---

## 📝 **Step-by-Step: Membuat Plugin Baru**

### **Step 1: Create Plugin Structure**

```bash
# Buat folder plugin baru
mkdir src/plugins/corporate
touch src/plugins/corporate/CorporatePlugin.tsx
touch src/plugins/corporate/index.ts
```

### **Step 2: Plugin Boilerplate**

```typescript
// src/plugins/corporate/CorporatePlugin.tsx
import React from 'react';
import { EventPlugin, EventData, FormField, ValidationResult } from '../types';
import { FieldBuilder, PresetFields } from '../forms';

export const CorporatePlugin: EventPlugin = {
  // Plugin metadata
  type: 'corporate',
  name: 'Corporate Events',
  version: '1.0.0',
  description: 'Professional corporate events dan business meetings',
  
  // Required methods - implement semua
  getDefaultSettings() {
    return {
      eventFormat: 'hybrid',
      requiresApproval: true,
      dressCode: 'business'
    };
  },
  
  getFormFields(): FormField[] {
    return [
      // Implementasi form fields
    ];
  },
  
  validateEventData(data: any): ValidationResult {
    return {
      isValid: true,
      errors: []
    };
  },
  
  renderHero(data: EventData, config: any) {
    return <div>Hero Component</div>;
  },
  
  renderParticipants(data: EventData, config: any) {
    return <div>Participants Component</div>;
  },
  
  renderDetails(data: EventData, config: any) {
    return <div>Details Component</div>;
  }
};
```

### **Step 3: Implement Form Fields**

```typescript
getFormFields(): FormField[] {
  return [
    // Basic event fields
    ...PresetFields.eventName(),
    ...PresetFields.eventDate(),
    ...PresetFields.eventLocation(),
    
    // Corporate-specific fields
    FieldBuilder.select('eventFormat')
      .label('Event Format')
      .addOption('in-person', 'In Person')
      .addOption('virtual', 'Virtual')
      .addOption('hybrid', 'Hybrid')
      .defaultValue('hybrid')
      .required(true)
      .build(),
      
    FieldBuilder.select('dressCode')
      .label('Dress Code')
      .addOption('casual', 'Casual')
      .addOption('business-casual', 'Business Casual')
      .addOption('business', 'Business Formal')
      .addOption('black-tie', 'Black Tie')
      .defaultValue('business')
      .build(),
      
    FieldBuilder.textarea('agenda')
      .label('Meeting Agenda')
      .placeholder('1. Opening remarks\n2. Presentation\n3. Q&A')
      .showWhenNotEquals('eventFormat', 'casual')
      .build(),
      
    FieldBuilder.checkbox('requiresApproval')
      .label('Requires Manager Approval')
      .helpText('Internal events may require approval')
      .defaultValue(true)
      .build()
  ];
},
```

### **Step 4: Implement Validation**

```typescript
validateEventData(data: any): ValidationResult {
  const errors = [];
  
  // Corporate-specific validation rules
  if (data.eventFormat === 'virtual' && !data.meetingLink) {
    errors.push({
      field: 'meetingLink',
      message: 'Meeting link required for virtual events'
    });
  }
  
  if (data.dressCode === 'black-tie' && !data.venue?.includes('hotel')) {
    errors.push({
      field: 'venue',
      message: 'Black tie events typically require upscale venues'
    });
  }
  
  // Business hours validation
  const eventDate = new Date(data.start_date);
  const hour = eventDate.getHours();
  if (hour < 8 || hour > 18) {
    errors.push({
      field: 'start_date',
      message: 'Corporate events should be within business hours (8 AM - 6 PM)'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
},
```

### **Step 5: Implement Components**

```typescript
renderHero(data: EventData, config: any) {
  return (
    <div className="corporate-hero bg-gradient-to-r from-blue-900 to-gray-800 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-4xl mb-6">🏢</div>
          <h1 className="text-4xl font-bold mb-6">{data.title}</h1>
          <p className="text-xl mb-8">{data.description}</p>
          
          <div className="flex justify-center space-x-6 text-sm">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              📅 {new Date(data.start_date).toLocaleDateString()}
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              💼 {data.settings?.dressCode || 'Business'}
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              🌐 {data.settings?.eventFormat || 'Hybrid'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
},

renderParticipants(data: EventData, config: any) {
  const participants = data.participants || [];
  const speakers = participants.filter(p => p.participant_type === 'speaker');
  const attendees = participants.filter(p => p.participant_type === 'attendee');
  
  return (
    <section className="corporate-participants py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Speakers Section */}
        {speakers.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Speakers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map(speaker => (
                <div key={speaker.id} className="speaker-card bg-white p-6 rounded-lg shadow">
                  <img 
                    src={speaker.image_url || '/default-avatar.jpg'} 
                    alt={speaker.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold text-center">{speaker.name}</h3>
                  <p className="text-blue-600 text-center mb-2">{speaker.role}</p>
                  <p className="text-gray-600 text-sm text-center">{speaker.bio}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Attendees Section */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Attendees ({attendees.length})</h2>
          {attendees.length === 0 ? (
            <p className="text-center text-gray-500">No attendees registered yet.</p>
          ) : (
            <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
              {attendees.map(attendee => (
                <div key={attendee.id} className="attendee-card text-center">
                  <img 
                    src={attendee.image_url || '/default-avatar.jpg'} 
                    alt={attendee.name}
                    className="w-16 h-16 rounded-full mx-auto mb-2"
                  />
                  <p className="text-sm font-medium">{attendee.name}</p>
                  <p className="text-xs text-gray-500">{attendee.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
},
```

### **Step 6: Register Plugin**

```typescript
// src/plugins/corporate/index.ts
import { pluginRegistry } from '../registry';
import { CorporatePlugin } from './CorporatePlugin';

// Register plugin
pluginRegistry.register(CorporatePlugin);

export { CorporatePlugin };
```

```typescript
// src/plugins/index.ts - Add export
export { CorporatePlugin } from './corporate';
```

### **Step 7: Create Tests**

```javascript
// __tests__/plugins/corporate-plugin.test.cjs
const { describe, it, expect, beforeEach } = require('vitest');

describe('Corporate Plugin', () => {
  let CorporatePlugin;
  
  beforeEach(async () => {
    const module = await import('../../src/plugins/corporate/CorporatePlugin.tsx');
    CorporatePlugin = module.CorporatePlugin;
  });
  
  it('should have correct plugin metadata', () => {
    expect(CorporatePlugin.type).toBe('corporate');
    expect(CorporatePlugin.name).toBe('Corporate Events');
    expect(CorporatePlugin.version).toBe('1.0.0');
  });
  
  it('should provide default settings', () => {
    const settings = CorporatePlugin.getDefaultSettings();
    expect(settings.eventFormat).toBe('hybrid');
    expect(settings.requiresApproval).toBe(true);
  });
  
  it('should validate virtual event requirements', () => {
    const result = CorporatePlugin.validateEventData({
      eventFormat: 'virtual'
      // missing meetingLink
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('meetingLink');
  });
  
  it('should validate business hours', () => {
    const result = CorporatePlugin.validateEventData({
      start_date: '2025-01-15T22:00:00Z' // 10 PM
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors[0].field).toBe('start_date');
  });
});
```

### **Step 8: Test Your Plugin**

```bash
# Run plugin tests
npm run test:plugins

# Run specific plugin test
npm run test -- corporate-plugin.test.cjs

# Test form fields
npm run test:forms
```

---

## 📋 **Form Builder Usage Guide**

### **Basic Field Types**

```typescript
import { FieldBuilder } from '@/plugins/forms';

// Text input
const nameField = FieldBuilder.text('participantName')
  .label('Full Name')
  .placeholder('Enter your full name')
  .required(true)
  .minLength(2)
  .maxLength(100)
  .build();

// Email with validation
const emailField = FieldBuilder.email('email')
  .label('Email Address')
  .placeholder('john@company.com')
  .required(true)
  .custom(value => value.endsWith('@company.com'), 'Must use company email')
  .build();

// Number input
const budgetField = FieldBuilder.number('budget')
  .label('Event Budget')
  .placeholder('10000')
  .min(1000)
  .max(1000000)
  .step(500)
  .build();

// Date input
const dateField = FieldBuilder.date('eventDate')
  .label('Event Date')
  .required(true)
  .custom(value => new Date(value) > new Date(), 'Date must be in the future')
  .build();

// Select dropdown
const typeField = FieldBuilder.select('eventType')
  .label('Event Type')
  .addOption('meeting', 'Meeting')
  .addOption('conference', 'Conference')
  .addOption('workshop', 'Workshop')
  .placeholder('Choose event type')
  .required(true)
  .build();

// Textarea
const descriptionField = FieldBuilder.textarea('description')
  .label('Event Description')
  .placeholder('Describe your event...')
  .rows(4)
  .maxLength(500)
  .build();

// Checkbox
const agreementField = FieldBuilder.checkbox('agreeToTerms')
  .label('I agree to the terms and conditions')
  .required(true)
  .build();

// Image upload
const imageField = FieldBuilder.image('eventImage')
  .label('Event Banner')
  .accept('image/jpeg,image/png')
  .maxSize(5) // 5MB
  .build();
```

### **Advanced Field Features**

```typescript
// Conditional fields
const venueTypeField = FieldBuilder.select('venueType')
  .label('Venue Type')
  .addOption('indoor', 'Indoor')
  .addOption('outdoor', 'Outdoor')
  .addOption('virtual', 'Virtual')
  .build();

const venueDetailsField = FieldBuilder.text('venueDetails')
  .label('Venue Details')
  .showWhenNotEquals('venueType', 'virtual')  // Hide for virtual events
  .required(true)
  .build();

const meetingLinkField = FieldBuilder.text('meetingLink')
  .label('Meeting Link')
  .showWhenEquals('venueType', 'virtual')     // Show only for virtual events
  .required(true)
  .build();

// Cross-field validation
const budgetField = FieldBuilder.number('budget')
  .label('Budget')
  .custom((value, context) => {
    const eventType = context.formData.eventType;
    const minBudget = eventType === 'conference' ? 50000 : 10000;
    return value >= minBudget;
  }, 'Budget too low for this event type')
  .build();

// Dynamic options berdasarkan field lain
const cityField = FieldBuilder.select('city')
  .label('City')
  .addOption('jakarta', 'Jakarta')
  .addOption('surabaya', 'Surabaya')
  .addOption('bandung', 'Bandung')
  .build();

const venueField = FieldBuilder.select('venue')
  .label('Venue')
  .dynamicOptions((context) => {
    const city = context.formData.city;
    if (city === 'jakarta') {
      return [
        { value: 'hotel-indonesia', label: 'Hotel Indonesia' },
        { value: 'grand-hyatt', label: 'Grand Hyatt Jakarta' }
      ];
    } else if (city === 'surabaya') {
      return [
        { value: 'shangri-la', label: 'Shangri-La Surabaya' },
        { value: 'jw-marriott', label: 'JW Marriott Surabaya' }
      ];
    }
    return [];
  })
  .showWhenNotEquals('city', '')
  .build();
```

### **Using Preset Fields**

```typescript
import { PresetFields } from '@/plugins/forms';

// Use preset collections
const basicFields = [
  ...PresetFields.eventName(),        // Standard event name field
  ...PresetFields.eventDate(),        // Date and time picker
  ...PresetFields.eventLocation(),    // Location with map integration
  ...PresetFields.eventDescription(), // Rich text description
];

// Event-specific presets
const weddingFields = [
  ...PresetFields.forWedding(),      // Wedding-specific field collection
  ...PresetFields.brideAndGroom(),   // Bride and groom information
  ...PresetFields.weddingVenue(),    // Venue with ceremony/reception
];

const conferenceFields = [
  ...PresetFields.forConference(),   // Conference-specific fields
  ...PresetFields.speakers(),        // Speaker management
  ...PresetFields.agenda(),          // Conference agenda builder
];

const birthdayFields = [
  ...PresetFields.forBirthday(),     // Birthday-specific fields
  ...PresetFields.celebrant(),       // Birthday person info
  ...PresetFields.partyTheme(),      // Theme selection
];
```

### **Form Layouts dan Organization**

```typescript
import { FormLayout } from '@/plugins/forms';

// Two-column layout
const layoutFields = FormLayout.twoColumns([
  nameField,
  emailField,
  phoneField,
  addressField
]);

// Sectioned forms
const sectionedFields = [
  ...FormLayout.section('Event Information', [
    nameField,
    typeField,
    dateField,
    locationField
  ]),
  
  ...FormLayout.section('Contact Details', [
    organizerNameField,
    emailField,
    phoneField
  ]),
  
  ...FormLayout.section('Additional Settings', [
    publicEventField,
    allowRegistrationField,
    maxAttendeesField
  ])
];

// Tabbed layout
const tabbedFields = FormLayout.tabs([
  {
    id: 'basic',
    title: 'Basic Info',
    fields: basicFields
  },
  {
    id: 'details',
    title: 'Event Details',
    fields: detailFields
  },
  {
    id: 'settings',
    title: 'Settings',
    fields: settingFields
  }
]);
```

---

## ✅ **Testing Guidelines**

### **Plugin Test Structure**

```javascript
// __tests__/plugins/my-plugin.test.cjs
const { describe, it, expect, beforeEach } = require('vitest');

describe('My Plugin', () => {
  let MyPlugin;
  
  beforeEach(async () => {
    const module = await import('../../src/plugins/my/MyPlugin.tsx');
    MyPlugin = module.MyPlugin;
  });
  
  describe('Plugin Metadata', () => {
    it('should have correct type', () => {
      expect(MyPlugin.type).toBe('my-plugin-type');
    });
    
    it('should have semantic version', () => {
      expect(MyPlugin.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should have description', () => {
      expect(MyPlugin.description).toBeTruthy();
      expect(MyPlugin.description.length).toBeGreaterThan(10);
    });
  });
  
  describe('Form Fields', () => {
    it('should provide form fields', () => {
      const fields = MyPlugin.getFormFields();
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });
    
    it('should have required fields marked', () => {
      const fields = MyPlugin.getFormFields();
      const requiredFields = fields.filter(f => f.validation.required);
      expect(requiredFields.length).toBeGreaterThan(0);
    });
  });
  
  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const result = MyPlugin.validateEventData({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should pass validation with valid data', () => {
      const validData = {
        // provide valid test data
      };
      const result = MyPlugin.validateEventData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    it('should validate business rules', () => {
      const invalidData = {
        // data that violates business rules
      };
      const result = MyPlugin.validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'specific_field',
          message: expect.stringContaining('expected message')
        })
      );
    });
  });
  
  describe('Component Rendering', () => {
    it('should render hero component', () => {
      const testData = { title: 'Test Event' };
      const component = MyPlugin.renderHero(testData, {});
      expect(component).toBeTruthy();
    });
    
    it('should handle empty data gracefully', () => {
      const component = MyPlugin.renderHero(null, {});
      expect(component).toBeTruthy(); // Should not crash
    });
  });
});
```

### **Form Builder Tests**

```javascript
// __tests__/plugins/form-builder.test.cjs
describe('Form Builder', () => {
  it('should build text field correctly', () => {
    const field = FieldBuilder.text('testField')
      .label('Test Field')
      .required(true)
      .minLength(5)
      .build();
    
    expect(field.type).toBe('text');
    expect(field.name).toBe('testField');
    expect(field.label).toBe('Test Field');
    expect(field.validation.required).toBe(true);
    expect(field.validation.minLength).toBe(5);
  });
  
  it('should handle conditional logic', () => {
    const field = FieldBuilder.text('conditionalField')
      .showWhenEquals('trigger', 'show')
      .build();
    
    expect(field.conditional).toBeTruthy();
    expect(field.conditional.field).toBe('trigger');
    expect(field.conditional.operator).toBe('equals');
    expect(field.conditional.value).toBe('show');
  });
  
  it('should validate custom rules', () => {
    const field = FieldBuilder.text('customField')
      .custom(value => value.includes('test'), 'Must contain "test"')
      .build();
    
    const validation = field.validation.customRules[0];
    expect(validation.rule('test123')).toBe(true);
    expect(validation.rule('invalid')).toBe(false);
    expect(validation.message).toBe('Must contain "test"');
  });
});
```

---

## 🚀 **Deployment Guide**

### **Plugin Registration Checklist**

1. ✅ Implement semua required interface methods
2. ✅ Add comprehensive tests dengan coverage >90%
3. ✅ Validate form fields dan business rules
4. ✅ Test component rendering dengan berbagai data scenarios
5. ✅ Register plugin dalam plugin registry
6. ✅ Export plugin dari central index
7. ✅ Update documentation

### **Production Deployment**

```typescript
// src/plugins/index.ts - Production registry
import { pluginRegistry } from './registry';

// Import dan register production plugins
import { WeddingPlugin } from './wedding';
import { ConferencePlugin } from './conference';
import { BirthdayPlugin } from './birthday';
import { CorporatePlugin } from './corporate';

// Register all production plugins
const productionPlugins = [
  WeddingPlugin,
  ConferencePlugin, 
  BirthdayPlugin,
  CorporatePlugin
];

productionPlugins.forEach(plugin => {
  pluginRegistry.register(plugin);
});

// Initialize plugin system
export function initializePluginSystem() {
  return pluginRegistry.init();
}
```

### **Environment Configuration**

```typescript
// src/config/plugins.ts
interface PluginConfig {
  enabledPlugins: string[];
  development: {
    enableDebugMode: boolean;
    allowHotReload: boolean;
  };
  production: {
    enableMetrics: boolean;
    maxCacheSize: number;
  };
}

export const pluginConfig: PluginConfig = {
  enabledPlugins: process.env.NODE_ENV === 'production'
    ? ['wedding', 'conference', 'birthday', 'corporate']
    : ['wedding', 'conference', 'birthday', 'corporate', 'test-plugin'],
    
  development: {
    enableDebugMode: true,
    allowHotReload: true
  },
  
  production: {
    enableMetrics: true,
    maxCacheSize: 1000
  }
};
```

---

## 🔍 **Debugging Tips**

### **Common Issues dan Solutions**

#### **1. Plugin Not Loading**
```typescript
// Debug plugin registration
import { pluginRegistry } from '@/plugins/registry';

console.log('Registered plugins:', pluginRegistry.getAllPlugins());
console.log('Active plugins:', pluginRegistry.getActivePlugins());

// Check specific plugin
const plugin = pluginRegistry.getPlugin('my-plugin');
if (!plugin) {
  console.error('Plugin not found. Check registration.');
}
```

#### **2. Form Validation Errors**
```typescript
// Debug form validation
const fields = MyPlugin.getFormFields();
console.log('Form fields:', fields);

const testData = { /* test data */ };
const validation = MyPlugin.validateEventData(testData);
console.log('Validation result:', validation);
```

#### **3. Component Rendering Issues**
```typescript
// Debug component rendering
const testData = { title: 'Test Event' };
const config = { theme: 'default' };

try {
  const component = MyPlugin.renderHero(testData, config);
  console.log('Hero component:', component);
} catch (error) {
  console.error('Hero rendering error:', error);
}
```

### **Development Tools**

```bash
# Plugin development commands
npm run plugin:create <plugin-name>    # Create new plugin boilerplate
npm run plugin:test <plugin-name>      # Run plugin-specific tests
npm run plugin:validate <plugin-name>  # Validate plugin structure
npm run plugin:docs <plugin-name>      # Generate plugin documentation
```

---

## 📚 **Resources dan References**

- 📖 [Plugin System Technical Documentation](./PLUGIN_SYSTEM_TECHNICAL_DOCUMENTATION.md)
- 🏗️ [Phase 3 Architecture Review](./PHASE_3_ARCHITECTURE_REVIEW.md)
- 🗺️ [Real Transformation Roadmap](./REAL_TRANSFORMATION_ROADMAP.md)
- ⚛️ [React Hooks Documentation](https://react.dev/reference/react)
- 📝 [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Guide Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Target Audience:** Plugin Developers, Frontend Engineers

---

*Happy coding! 🚀 Untuk pertanyaan atau support, hubungi development team.*