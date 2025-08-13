# 🎯 Event Type Creation Tutorial - Event Management Engine

**Date:** 2025-01-13  
**Version:** 1.0.0  
**Target Audience:** Plugin Developers  

---

## 📋 **OVERVIEW**

Tutorial ini menjelaskan langkah-by-langkah cara membuat event type baru di Event Management Engine platform menggunakan plugin architecture.

---

## 🚀 **QUICK START**

### **Scenario: Membuat "Conference" Event Plugin**

Mari kita buat plugin untuk event type "Conference" sebagai contoh praktis.

---

## 📁 **STEP 1: Project Structure Setup**

Buat struktur folder untuk plugin baru:

```
src/plugins/conference/
├── ConferencePlugin.tsx          # Main plugin implementation
├── components/
│   ├── ConferenceHero.tsx       # Hero section khusus conference
│   ├── SpeakersList.tsx         # Daftar pembicara
│   ├── AgendaSection.tsx        # Agenda conference
│   └── RegistrationForm.tsx     # Form registrasi
├── forms/
│   ├── conferenceFields.ts      # Field definitions
│   └── conferenceValidation.ts  # Validation rules
└── index.ts                     # Plugin exports
```

---

## 🔧 **STEP 2: Create Plugin Interface**

### **2.1 Main Plugin File (`ConferencePlugin.tsx`)**

```typescript
import { EventPlugin, EventData, PluginConfig } from '@/plugins/types';
import { ConferenceHero } from './components/ConferenceHero';
import { SpeakersList } from './components/SpeakersList';
import { AgendaSection } from './components/AgendaSection';
import { conferenceFields } from './forms/conferenceFields';
import { conferenceValidation } from './forms/conferenceValidation';

export const ConferencePlugin: EventPlugin = {
  // Plugin metadata
  type: 'conference',
  name: 'Conference Event Plugin',
  version: '1.0.0',
  description: 'Professional conference and seminar events',
  category: 'corporate',

  // Component renderers
  renderHero: (data: EventData, config: PluginConfig) => (
    <ConferenceHero {...data} {...config} />
  ),

  renderParticipants: (data: EventData, config: PluginConfig) => (
    <SpeakersList speakers={data.speakers} {...config} />
  ),

  renderDetails: (data: EventData, config: PluginConfig) => (
    <AgendaSection agenda={data.agenda} {...config} />
  ),

  renderRegistration: (data: EventData, config: PluginConfig) => (
    <RegistrationForm eventId={data.id} {...config} />
  ),

  // Configuration and form fields
  getDefaultSettings: () => ({
    enableSpeakers: true,
    enableAgenda: true,
    enableNetworking: true,
    maxAttendees: 500,
    registrationDeadline: null,
    requireApproval: false,
    allowWaitlist: true
  }),

  getFormFields: () => conferenceFields,

  // Validation
  validateEventData: (data: any) => conferenceValidation(data),

  // Lifecycle hooks
  onEventCreate: async (data: EventData) => {
    console.log(`Conference event created: ${data.title}`);
    // Setup specific conference configurations
    await setupConferenceDefaults(data);
  },

  onEventUpdate: async (data: EventData) => {
    console.log(`Conference event updated: ${data.title}`);
    // Handle conference-specific updates
  },

  // Custom methods for conference-specific functionality
  customMethods: {
    addSpeaker: async (eventId: string, speaker: any) => {
      // Add speaker logic
    },
    
    generateCertificates: async (eventId: string) => {
      // Certificate generation logic
    },
    
    sendReminders: async (eventId: string) => {
      // Reminder notifications
    }
  }
};

// Helper function
async function setupConferenceDefaults(data: EventData) {
  // Initialize conference-specific data structures
  return {
    agenda: [],
    speakers: [],
    sponsors: [],
    networking_sessions: []
  };
}
```

---

## 🎨 **STEP 3: Create Custom Components**

### **3.1 Conference Hero Component**

```typescript
// src/plugins/conference/components/ConferenceHero.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';

interface ConferenceHeroProps {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  expectedAttendees: number;
  category: string;
  backgroundImage?: string;
}

export const ConferenceHero: React.FC<ConferenceHeroProps> = ({
  title,
  description,
  startDate,
  endDate,
  venue,
  expectedAttendees,
  category,
  backgroundImage
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="relative min-h-[500px] flex items-center">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Content */}
      <div className="relative container mx-auto px-4 text-white">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            {category}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            {description}
          </p>

          {/* Event Details */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold">Tanggal</p>
                  <p className="text-sm">{formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-semibold">Lokasi</p>
                  <p className="text-sm">{venue}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-semibold">Peserta</p>
                  <p className="text-sm">{expectedAttendees} orang</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 📝 **STEP 4: Define Form Fields**

### **4.1 Conference Form Fields**

```typescript
// src/plugins/conference/forms/conferenceFields.ts
import { FormField } from '@/plugins/types';

export const conferenceFields: FormField[] = [
  // Basic Information
  {
    id: 'title',
    label: 'Conference Title',
    type: 'text',
    required: true,
    validation: {
      minLength: 5,
      maxLength: 100
    },
    placeholder: 'e.g., Tech Summit 2024'
  },

  {
    id: 'description',
    label: 'Conference Description',
    type: 'textarea',
    required: true,
    validation: {
      minLength: 20,
      maxLength: 500
    },
    placeholder: 'Describe your conference objectives and highlights'
  },

  // Date & Time
  {
    id: 'start_date',
    label: 'Start Date',
    type: 'datetime-local',
    required: true
  },

  {
    id: 'end_date',
    label: 'End Date',
    type: 'datetime-local',
    required: true,
    validation: {
      custom: (value, formData) => {
        if (new Date(value) <= new Date(formData.start_date)) {
          return 'End date must be after start date';
        }
        return null;
      }
    }
  },

  // Venue Information
  {
    id: 'venue_name',
    label: 'Venue Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Jakarta Convention Center'
  },

  {
    id: 'venue_address',
    label: 'Venue Address',
    type: 'textarea',
    required: true,
    placeholder: 'Full address including city and postal code'
  },

  {
    id: 'venue_capacity',
    label: 'Venue Capacity',
    type: 'number',
    required: true,
    validation: {
      min: 10,
      max: 10000
    }
  },

  // Conference Settings
  {
    id: 'category',
    label: 'Conference Category',
    type: 'select',
    required: true,
    options: [
      { value: 'technology', label: 'Technology' },
      { value: 'business', label: 'Business' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'education', label: 'Education' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'other', label: 'Other' }
    ]
  },

  {
    id: 'registration_fee',
    label: 'Registration Fee',
    type: 'number',
    required: false,
    validation: {
      min: 0
    },
    placeholder: '0 for free event'
  },

  {
    id: 'max_attendees',
    label: 'Maximum Attendees',
    type: 'number',
    required: true,
    validation: {
      min: 1,
      max: 5000
    }
  },

  // Agenda Configuration
  {
    id: 'enable_agenda',
    label: 'Enable Agenda Section',
    type: 'checkbox',
    defaultValue: true
  },

  {
    id: 'enable_speakers',
    label: 'Enable Speakers Section',
    type: 'checkbox',
    defaultValue: true
  },

  {
    id: 'enable_networking',
    label: 'Enable Networking Sessions',
    type: 'checkbox',
    defaultValue: false
  },

  // Registration Settings
  {
    id: 'require_approval',
    label: 'Require Manual Approval',
    type: 'checkbox',
    defaultValue: false
  },

  {
    id: 'allow_waitlist',
    label: 'Allow Waitlist When Full',
    type: 'checkbox',
    defaultValue: true
  },

  {
    id: 'registration_deadline',
    label: 'Registration Deadline',
    type: 'datetime-local',
    required: false
  }
];
```

---

## ✅ **STEP 5: Add Validation Rules**

### **5.1 Conference Validation**

```typescript
// src/plugins/conference/forms/conferenceValidation.ts
import { ValidationResult } from '@/plugins/types';

export const conferenceValidation = (data: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!data.title || data.title.trim().length < 5) {
    errors.push('Conference title must be at least 5 characters');
  }

  if (!data.description || data.description.trim().length < 20) {
    errors.push('Conference description must be at least 20 characters');
  }

  // Date validation
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const registrationDeadline = data.registration_deadline ? new Date(data.registration_deadline) : null;

  if (startDate <= new Date()) {
    errors.push('Start date must be in the future');
  }

  if (endDate <= startDate) {
    errors.push('End date must be after start date');
  }

  if (registrationDeadline && registrationDeadline >= startDate) {
    errors.push('Registration deadline must be before conference start date');
  }

  // Capacity validation
  if (data.venue_capacity < data.max_attendees) {
    warnings.push('Maximum attendees exceeds venue capacity');
  }

  // Business logic validation
  if (data.registration_fee > 0 && !data.require_approval) {
    warnings.push('Consider enabling manual approval for paid events');
  }

  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  if (daysDifference > 7) {
    warnings.push('Conference duration is longer than 7 days');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
```

---

## 🔌 **STEP 6: Register Plugin**

### **6.1 Update Plugin Registry**

```typescript
// src/plugins/index.ts
import { WeddingPlugin } from './wedding/WeddingPlugin';
import { ConferencePlugin } from './conference/ConferencePlugin'; // New import

export const availablePlugins = {
  wedding: WeddingPlugin,
  conference: ConferencePlugin // Register new plugin
};

export type AvailableEventTypes = keyof typeof availablePlugins;
```

### **6.2 Update Plugin Registry System**

```typescript
// src/plugins/registry.ts
import { EventPlugin } from './types';
import { availablePlugins } from './index';

class PluginRegistry {
  private plugins: Map<string, EventPlugin> = new Map();

  constructor() {
    // Auto-register all available plugins
    Object.entries(availablePlugins).forEach(([type, plugin]) => {
      this.register(type, plugin);
    });
  }

  register(type: string, plugin: EventPlugin): void {
    this.plugins.set(type, plugin);
    console.log(`✅ Plugin registered: ${type}`);
  }

  get(type: string): EventPlugin | undefined {
    return this.plugins.get(type);
  }

  getAll(): EventPlugin[] {
    return Array.from(this.plugins.values());
  }

  getAvailableTypes(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const pluginRegistry = new PluginRegistry();
```

---

## 📦 **STEP 7: Database Integration**

### **7.1 Add Event Type to Database**

```sql
-- Add to database/seeders/event_types.sql
INSERT INTO event_types (
    name, display_name, description, category,
    default_config, required_fields, optional_fields,
    is_system_type, is_active
) VALUES (
    'conference',
    'Conference & Seminar',
    'Professional conferences, seminars, and educational events',
    'corporate',
    jsonb_build_object(
        'default_sections', ARRAY['hero', 'agenda', 'speakers', 'registration'],
        'participant_types', ARRAY['attendee', 'speaker', 'organizer', 'sponsor'],
        'form_layout', 'professional',
        'supports_agenda', true,
        'supports_speakers', true,
        'supports_networking', true
    ),
    '["title", "description", "start_date", "end_date", "venue_name", "max_attendees"]'::jsonb,
    '["venue_address", "registration_fee", "category", "registration_deadline"]'::jsonb,
    TRUE,
    TRUE
);
```

---

## 🧪 **STEP 8: Testing Your Plugin**

### **8.1 Unit Tests**

```typescript
// __tests__/plugins/conference-plugin.test.ts
import { describe, it, expect } from 'vitest';
import { ConferencePlugin } from '@/plugins/conference/ConferencePlugin';
import { conferenceValidation } from '@/plugins/conference/forms/conferenceValidation';

describe('ConferencePlugin', () => {
  it('should have correct plugin metadata', () => {
    expect(ConferencePlugin.type).toBe('conference');
    expect(ConferencePlugin.name).toBe('Conference Event Plugin');
    expect(ConferencePlugin.category).toBe('corporate');
  });

  it('should provide default settings', () => {
    const defaultSettings = ConferencePlugin.getDefaultSettings();
    
    expect(defaultSettings.enableSpeakers).toBe(true);
    expect(defaultSettings.enableAgenda).toBe(true);
    expect(defaultSettings.maxAttendees).toBe(500);
  });

  it('should validate conference data correctly', () => {
    const validData = {
      title: 'Tech Summit 2024',
      description: 'Annual technology conference for professionals',
      start_date: '2024-06-01T09:00:00',
      end_date: '2024-06-02T17:00:00',
      venue_name: 'Jakarta Convention Center',
      venue_capacity: 1000,
      max_attendees: 800
    };

    const result = conferenceValidation(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

---

## 🚀 **STEP 9: Usage Example**

### **9.1 Create Conference Event**

```typescript
// Example usage in your application
import { useEventCreation } from '@/hooks/useEventCreation';
import { pluginRegistry } from '@/plugins/registry';

function CreateConferenceEvent() {
  const { createEvent } = useEventCreation();
  const conferencePlugin = pluginRegistry.get('conference');

  const handleSubmit = async (formData: any) => {
    // Validate using plugin
    const validation = conferencePlugin.validateEventData(formData);
    
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return;
    }

    // Create event
    const eventData = {
      event_type: 'conference',
      form_data: formData,
      settings: conferencePlugin.getDefaultSettings()
    };

    const newEvent = await createEvent(eventData);
    
    // Run plugin lifecycle hook
    await conferencePlugin.onEventCreate(newEvent);
  };

  return (
    <div>
      {/* Your conference creation form */}
    </div>
  );
}
```

---

## 📚 **STEP 10: Documentation and Deployment**

### **10.1 Plugin Documentation**

Create comprehensive documentation for your plugin:
- Component API documentation
- Configuration options
- Customization guidelines
- Integration examples

### **10.2 Testing Checklist**

- [ ] Plugin registers correctly
- [ ] Form fields render properly
- [ ] Validation works as expected
- [ ] Components display correctly
- [ ] Database integration works
- [ ] Lifecycle hooks execute
- [ ] Custom methods function properly

---

## 🎯 **SUCCESS METRICS**

Your plugin is successful when:
- ✅ Can create conference events in <2 minutes
- ✅ All validation rules work correctly
- ✅ Components render properly on all screen sizes
- ✅ Database operations complete without errors
- ✅ Plugin integrates seamlessly with existing system

---

## 🔄 **NEXT STEPS**

1. **Extend Functionality**: Add more conference-specific features
2. **Create More Plugins**: Birthday parties, corporate events, etc.
3. **Improve UX**: Add more interactive components
4. **Add Integrations**: Calendar systems, payment gateways, etc.

---

**Happy Plugin Development! 🚀**