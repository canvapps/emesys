# Form Builder Usage Guide
**Event Management Engine - Complete Form Builder Reference**

---

## 🎯 **Overview**

Form Builder system dalam Event Management Engine memungkinkan developer untuk membuat forms yang dynamic, dengan validasi complex, conditional fields, dan integration yang seamless dengan plugin architecture.

### **Key Features:**
- 🏗️ **Fluent API** - Chainable method untuk easy field construction
- ✅ **Advanced Validation** - Built-in dan custom validation rules
- 🔄 **Conditional Logic** - Show/hide fields berdasarkan conditions
- 🎨 **Layout System** - Flexible form layouts dan sections
- 📱 **Responsive Design** - Mobile-first form components
- ⚡ **Performance** - Optimized rendering dengan debouncing
- 🌐 **Internationalization** - Multi-language support

---

## 📋 **Table of Contents**

1. [Quick Start](#quick-start)
2. [Field Types Reference](#field-types-reference)
3. [Validation System](#validation-system)
4. [Conditional Logic](#conditional-logic)
5. [Layout System](#layout-system)
6. [Advanced Features](#advanced-features)
7. [Integration Examples](#integration-examples)
8. [Performance Tips](#performance-tips)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 **Quick Start**

### **Basic Form Creation**

```typescript
import { FieldBuilder, DynamicForm } from '@/plugins/forms';

// Define form fields
const fields = [
  FieldBuilder.text('eventName')
    .label('Event Name')
    .placeholder('Enter event name')
    .required(true)
    .minLength(3, 'Name must be at least 3 characters')
    .build(),
    
  FieldBuilder.email('contactEmail')
    .label('Contact Email')
    .required(true)
    .build(),
    
  FieldBuilder.select('eventType')
    .label('Event Type')
    .addOption('wedding', 'Wedding')
    .addOption('conference', 'Conference')
    .addOption('birthday', 'Birthday Party')
    .required(true)
    .build()
];

// Use in React component
function EventCreationForm() {
  const handleSubmit = (data: Record<string, any>, isValid: boolean) => {
    if (isValid) {
      console.log('Form data:', data);
      // Process form submission
    }
  };
  
  return (
    <DynamicForm
      fields={fields}
      onSubmit={handleSubmit}
      submitText="Create Event"
    />
  );
}
```

---

## 📝 **Field Types Reference**

### **Text Fields**

```typescript
// Basic text input
const textField = FieldBuilder.text('fieldName')
  .label('Display Label')
  .placeholder('Placeholder text')
  .helpText('Additional help information')
  .required(true)
  .minLength(2, 'Too short')
  .maxLength(100, 'Too long')
  .pattern('^[A-Za-z\\s]+$', 'Letters and spaces only')
  .build();

// Password field
const passwordField = FieldBuilder.text('password')
  .label('Password')
  .inputType('password')
  .required(true)
  .minLength(8, 'Password must be at least 8 characters')
  .custom(value => /[A-Z]/.test(value), 'Must contain uppercase letter')
  .custom(value => /[0-9]/.test(value), 'Must contain number')
  .build();

// Search field with debouncing
const searchField = FieldBuilder.text('searchQuery')
  .label('Search Events')
  .placeholder('Type to search...')
  .inputType('search')
  .debounce(300) // 300ms delay
  .build();
```

### **Email Fields**

```typescript
// Email dengan domain validation
const emailField = FieldBuilder.email('email')
  .label('Email Address')
  .placeholder('user@example.com')
  .required(true)
  .custom(value => {
    const allowedDomains = ['gmail.com', 'company.com', 'organization.org'];
    const domain = value.split('@')[1];
    return allowedDomains.includes(domain);
  }, 'Please use an approved email domain')
  .build();

// Multiple email addresses
const multiEmailField = FieldBuilder.email('emails')
  .label('Notification Emails')
  .placeholder('email1@example.com, email2@example.com')
  .multiple(true)
  .separator(',')
  .build();
```

### **Number Fields**

```typescript
// Integer field
const ageField = FieldBuilder.number('age')
  .label('Age')
  .placeholder('25')
  .integer(true)
  .min(18, 'Must be at least 18')
  .max(100, 'Maximum age is 100')
  .build();

// Currency field
const priceField = FieldBuilder.number('ticketPrice')
  .label('Ticket Price')
  .placeholder('100000')
  .decimal(true)
  .step(500)
  .min(0)
  .currency('IDR')
  .format(value => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(value))
  .build();

// Percentage field
const discountField = FieldBuilder.number('discount')
  .label('Discount')
  .placeholder('10')
  .decimal(true)
  .min(0)
  .max(100)
  .suffix('%')
  .build();
```

### **Date & Time Fields**

```typescript
// Date field dengan custom validation
const eventDateField = FieldBuilder.date('eventDate')
  .label('Event Date')
  .required(true)
  .min(new Date()) // Cannot be in the past
  .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // Max 1 year ahead
  .custom(value => {
    const date = new Date(value);
    const day = date.getDay();
    return day !== 0; // No Sundays
  }, 'Events cannot be scheduled on Sundays')
  .build();

// DateTime field dengan timezone
const startTimeField = FieldBuilder.datetime('startTime')
  .label('Start Time')
  .timezone('Asia/Jakarta')
  .required(true)
  .custom(value => {
    const hour = new Date(value).getHours();
    return hour >= 6 && hour <= 22;
  }, 'Events must be between 6 AM and 10 PM')
  .build();

// Time range field
const timeRangeField = FieldBuilder.dateRange('eventPeriod')
  .label('Event Period')
  .startLabel('From')
  .endLabel('To')
  .required(true)
  .custom((value, context) => {
    const { start, end } = value;
    const diffHours = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    return diffHours >= 1 && diffHours <= 12;
  }, 'Event must be between 1-12 hours long')
  .build();
```

### **Select Fields**

```typescript
// Static options
const categoryField = FieldBuilder.select('category')
  .label('Event Category')
  .addOption('corporate', 'Corporate Event', { icon: '🏢' })
  .addOption('social', 'Social Gathering', { icon: '🎉' })
  .addOption('educational', 'Educational Workshop', { icon: '📚' })
  .placeholder('Choose category')
  .required(true)
  .searchable(true) // Enable option search
  .build();

// Multi-select
const tagsField = FieldBuilder.select('eventTags')
  .label('Event Tags')
  .addOption('networking', 'Networking')
  .addOption('workshop', 'Workshop')
  .addOption('presentation', 'Presentation')
  .addOption('panel', 'Panel Discussion')
  .multiple(true)
  .maxSelections(3)
  .build();

// Grouped options
const venueField = FieldBuilder.select('venue')
  .label('Venue')
  .addOptionGroup('Hotels', [
    { value: 'hotel-a', label: 'Grand Hotel A' },
    { value: 'hotel-b', label: 'Luxury Hotel B' }
  ])
  .addOptionGroup('Convention Centers', [
    { value: 'cc-1', label: 'Jakarta Convention Center' },
    { value: 'cc-2', label: 'Surabaya Convention Hall' }
  ])
  .required(true)
  .build();

// Dynamic options dari API
const cityField = FieldBuilder.select('city')
  .label('City')
  .dynamicOptions(async (context) => {
    const response = await fetch('/api/cities');
    const cities = await response.json();
    return cities.map(city => ({
      value: city.id,
      label: city.name,
      data: { population: city.population }
    }));
  })
  .searchable(true)
  .build();
```

### **Textarea Fields**

```typescript
// Rich text editor
const descriptionField = FieldBuilder.textarea('description')
  .label('Event Description')
  .placeholder('Describe your event in detail...')
  .rows(6)
  .maxLength(2000)
  .richText(true) // Enable rich text editor
  .toolbar(['bold', 'italic', 'link', 'list'])
  .build();

// Code editor
const codeField = FieldBuilder.textarea('customCode')
  .label('Custom CSS')
  .language('css')
  .theme('monokai')
  .lineNumbers(true)
  .height(200)
  .build();

// Auto-expanding textarea
const notesField = FieldBuilder.textarea('notes')
  .label('Additional Notes')
  .placeholder('Any additional information...')
  .autoResize(true)
  .minRows(3)
  .maxRows(10)
  .build();
```

### **Checkbox & Radio Fields**

```typescript
// Single checkbox
const agreementField = FieldBuilder.checkbox('agreeToTerms')
  .label('I agree to the terms and conditions')
  .required(true)
  .linkText('Read terms', 'https://example.com/terms')
  .build();

// Checkbox group
const servicesField = FieldBuilder.checkbox('services')
  .label('Required Services')
  .addOption('catering', 'Catering Service', { price: 500000 })
  .addOption('photography', 'Photography', { price: 1000000 })
  .addOption('decoration', 'Decoration', { price: 750000 })
  .addOption('sound', 'Sound System', { price: 300000 })
  .multiple(true)
  .showPricing(true)
  .build();

// Radio buttons
const formatField = FieldBuilder.radio('eventFormat')
  .label('Event Format')
  .addOption('in-person', 'In Person', { 
    description: 'Physical attendance required',
    icon: '🏢'
  })
  .addOption('virtual', 'Virtual', { 
    description: 'Online event via video conference',
    icon: '💻'
  })
  .addOption('hybrid', 'Hybrid', { 
    description: 'Both in-person and virtual attendance',
    icon: '🌐'
  })
  .required(true)
  .layout('grid') // or 'list', 'inline'
  .build();
```

### **File Upload Fields**

```typescript
// Single file upload
const imageField = FieldBuilder.image('eventBanner')
  .label('Event Banner')
  .accept('image/jpeg,image/png,image/webp')
  .maxSize(5) // 5MB
  .dimensions({ width: 1920, height: 1080 })
  .crop(true)
  .preview(true)
  .build();

// Multiple file upload dengan progress
const documentsField = FieldBuilder.file('supportingDocs')
  .label('Supporting Documents')
  .accept('.pdf,.doc,.docx')
  .multiple(true)
  .maxFiles(5)
  .maxSize(10) // 10MB per file
  .showProgress(true)
  .dragDrop(true)
  .build();

// Image gallery
const galleryField = FieldBuilder.image('eventGallery')
  .label('Event Photos')
  .multiple(true)
  .maxFiles(20)
  .thumbnails(true)
  .sortable(true)
  .build();
```

---

## ✅ **Validation System**

### **Built-in Validators**

```typescript
// String validation
const nameField = FieldBuilder.text('name')
  .required(true, 'Name is required')
  .minLength(2, 'Name too short')
  .maxLength(50, 'Name too long')
  .pattern('^[A-Za-z\\s]+$', 'Letters and spaces only')
  .trim(true) // Auto-trim whitespace
  .build();

// Number validation
const priceField = FieldBuilder.number('price')
  .required(true)
  .min(1000, 'Minimum price is IDR 1,000')
  .max(10000000, 'Maximum price is IDR 10,000,000')
  .step(500, 'Price must be in increments of IDR 500')
  .integer(false) // Allow decimals
  .build();

// Email validation
const emailField = FieldBuilder.email('email')
  .required(true)
  .format('standard') // 'standard', 'strict', 'loose'
  .blacklist(['tempmail.com', 'guerrillamail.com'])
  .build();

// Date validation
const dateField = FieldBuilder.date('eventDate')
  .required(true)
  .min(new Date()) // Today or later
  .max(new Date(2026, 11, 31)) // Before 2027
  .weekdays([1, 2, 3, 4, 5]) // Monday-Friday only
  .build();
```

### **Custom Validation**

```typescript
// Simple custom validation
const usernameField = FieldBuilder.text('username')
  .custom(value => {
    return /^[a-z0-9_]+$/.test(value);
  }, 'Username must contain only lowercase letters, numbers, and underscores')
  .build();

// Async validation dengan debouncing
const usernameAsyncField = FieldBuilder.text('username')
  .asyncValidation(async (value) => {
    if (!value) return { isValid: true };
    
    const response = await fetch(`/api/check-username?username=${value}`);
    const result = await response.json();
    
    return {
      isValid: result.available,
      message: result.available ? '' : 'Username already taken'
    };
  }, 500) // 500ms debounce
  .build();

// Cross-field validation
const passwordField = FieldBuilder.text('password')
  .inputType('password')
  .required(true)
  .minLength(8)
  .build();

const confirmPasswordField = FieldBuilder.text('confirmPassword')
  .inputType('password')
  .required(true)
  .custom((value, context) => {
    return value === context.formData.password;
  }, 'Passwords do not match')
  .build();

// Conditional validation
const eventTypeField = FieldBuilder.select('eventType')
  .addOption('wedding', 'Wedding')
  .addOption('corporate', 'Corporate')
  .build();

const brideNameField = FieldBuilder.text('brideName')
  .label('Bride Name')
  .conditionalValidation({
    when: { field: 'eventType', equals: 'wedding' },
    then: { required: true, minLength: 2 }
  })
  .build();

// Complex business rule validation
const budgetField = FieldBuilder.number('budget')
  .custom((value, context) => {
    const eventType = context.formData.eventType;
    const guestCount = context.formData.guestCount || 0;
    
    const minBudgetPerGuest = eventType === 'wedding' ? 150000 : 75000;
    const minBudget = guestCount * minBudgetPerGuest;
    
    return value >= minBudget;
  }, (value, context) => {
    const eventType = context.formData.eventType;
    const guestCount = context.formData.guestCount || 0;
    const minBudgetPerGuest = eventType === 'wedding' ? 150000 : 75000;
    const minBudget = guestCount * minBudgetPerGuest;
    
    return `Budget too low. Minimum for ${guestCount} guests: ${new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(minBudget)}`;
  })
  .build();
```

### **Validation Schemas**

```typescript
import { PresetValidationSchemas } from '@/plugins/forms';

// Use preset validation schemas
const weddingValidation = PresetValidationSchemas.wedding();
const corporateValidation = PresetValidationSchemas.corporate();
const birthdayValidation = PresetValidationSchemas.birthday();

// Custom validation schema
const customSchema = {
  fields: {
    eventName: {
      required: true,
      minLength: 3,
      custom: [(value) => !value.includes('test'), 'Remove "test" from name']
    },
    budget: {
      required: true,
      min: 1000000,
      custom: [(value, context) => {
        // Complex budget validation
        return validateBudgetForEventType(value, context.formData.eventType);
      }, 'Budget insufficient for event type']
    }
  },
  crossField: [
    {
      fields: ['startDate', 'endDate'],
      validator: (data) => new Date(data.endDate) > new Date(data.startDate),
      message: 'End date must be after start date'
    }
  ]
};
```

---

## 🔄 **Conditional Logic**

### **Show/Hide Fields**

```typescript
// Show field when another field equals specific value
const venueTypeField = FieldBuilder.select('venueType')
  .addOption('indoor', 'Indoor')
  .addOption('outdoor', 'Outdoor')
  .addOption('virtual', 'Virtual')
  .build();

const venueNameField = FieldBuilder.text('venueName')
  .label('Venue Name')
  .showWhenNotEquals('venueType', 'virtual')
  .required(true)
  .build();

const meetingLinkField = FieldBuilder.text('meetingLink')
  .label('Meeting Link')
  .showWhenEquals('venueType', 'virtual')
  .required(true)
  .build();

// Show field when multiple conditions met
const cateringField = FieldBuilder.select('cateringType')
  .label('Catering Service')
  .addOption('buffet', 'Buffet')
  .addOption('plated', 'Plated Service')
  .addOption('cocktail', 'Cocktail Style')
  .showWhen(context => {
    return context.formData.venueType === 'indoor' && 
           parseInt(context.formData.guestCount) > 20;
  })
  .build();

// Show field with complex logic
const specialRequirementsField = FieldBuilder.textarea('specialRequirements')
  .label('Special Requirements')
  .showWhen(context => {
    const data = context.formData;
    return (
      data.eventType === 'wedding' ||
      data.hasDisabledGuests === true ||
      data.dietaryRestrictions?.length > 0
    );
  })
  .build();
```

### **Dynamic Field Options**

```typescript
// Options berubah berdasarkan field lain
const countryField = FieldBuilder.select('country')
  .label('Country')
  .addOption('ID', 'Indonesia')
  .addOption('SG', 'Singapore')
  .addOption('MY', 'Malaysia')
  .build();

const cityField = FieldBuilder.select('city')
  .label('City')
  .dynamicOptions(context => {
    const country = context.formData.country;
    
    const cityOptions = {
      'ID': [
        { value: 'JKT', label: 'Jakarta' },
        { value: 'SBY', label: 'Surabaya' },
        { value: 'BDG', label: 'Bandung' }
      ],
      'SG': [
        { value: 'SIN', label: 'Singapore' }
      ],
      'MY': [
        { value: 'KUL', label: 'Kuala Lumpur' },
        { value: 'JHR', label: 'Johor Bahru' }
      ]
    };
    
    return cityOptions[country] || [];
  })
  .showWhenNotEquals('country', '')
  .build();

// Price calculation berdasarkan selections
const serviceField = FieldBuilder.checkbox('services')
  .label('Additional Services')
  .addOption('photography', 'Photography', { price: 2000000 })
  .addOption('videography', 'Videography', { price: 3000000 })
  .addOption('decoration', 'Decoration', { price: 1500000 })
  .multiple(true)
  .build();

const totalPriceField = FieldBuilder.number('totalPrice')
  .label('Total Price')
  .readonly(true)
  .calculated(context => {
    const services = context.formData.services || [];
    const basePrice = parseInt(context.formData.basePrice) || 0;
    
    const servicePrices = {
      photography: 2000000,
      videography: 3000000,
      decoration: 1500000
    };
    
    const additionalCost = services.reduce((total, service) => {
      return total + (servicePrices[service] || 0);
    }, 0);
    
    return basePrice + additionalCost;
  })
  .format(value => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(value))
  .build();
```

### **Conditional Validation**

```typescript
// Validation berubah berdasarkan context
const eventTypeField = FieldBuilder.select('eventType')
  .addOption('wedding', 'Wedding')
  .addOption('corporate', 'Corporate')
  .build();

const dressCodeField = FieldBuilder.select('dressCode')
  .label('Dress Code')
  .dynamicOptions(context => {
    const eventType = context.formData.eventType;
    
    if (eventType === 'wedding') {
      return [
        { value: 'formal', label: 'Formal' },
        { value: 'semi-formal', label: 'Semi-Formal' },
        { value: 'casual-elegant', label: 'Casual Elegant' }
      ];
    } else if (eventType === 'corporate') {
      return [
        { value: 'business', label: 'Business Attire' },
        { value: 'business-casual', label: 'Business Casual' },
        { value: 'smart-casual', label: 'Smart Casual' }
      ];
    }
    return [];
  })
  .conditionalValidation({
    when: { field: 'eventType', notEquals: '' },
    then: { required: true }
  })
  .build();
```

---

## 🎨 **Layout System**

### **Form Sections**

```typescript
import { FormLayout } from '@/plugins/forms';

// Basic sections
const sectionedFields = [
  ...FormLayout.section('Event Information', [
    eventNameField,
    eventTypeField,
    eventDateField,
    locationField
  ]),
  
  ...FormLayout.section('Contact Details', [
    organizerNameField,
    emailField,
    phoneField
  ], {
    collapsible: true,
    collapsed: false,
    icon: '📞'
  }),
  
  ...FormLayout.section('Additional Settings', [
    publicEventField,
    requireApprovalField,
    maxAttendeesField
  ], {
    collapsible: true,
    collapsed: true,
    helpText: 'Optional settings for advanced event management'
  })
];
```

### **Multi-Column Layouts**

```typescript
// Two-column layout
const twoColumnFields = FormLayout.twoColumns([
  nameField,          // Left column
  emailField,         // Right column
  phoneField,         // Left column
  addressField        // Right column
]);

// Three-column layout
const threeColumnFields = FormLayout.threeColumns([
  firstNameField,     // Column 1
  lastNameField,      // Column 2  
  middleNameField,    // Column 3
  emailField,         // Column 1
  phoneField,         // Column 2
  birthdateField      // Column 3
]);

// Responsive columns
const responsiveFields = FormLayout.responsiveColumns([
  nameField,
  emailField,
  phoneField,
  addressField
], {
  mobile: 1,    // 1 column on mobile
  tablet: 2,    // 2 columns on tablet
  desktop: 3    // 3 columns on desktop
});
```

### **Tabbed Forms**

```typescript
// Tab layout
const tabbedFields = FormLayout.tabs([
  {
    id: 'basic',
    title: 'Basic Information',
    icon: 'ℹ️',
    fields: [
      eventNameField,
      eventTypeField,
      dateField
    ],
    validation: {
      required: true,
      message: 'Basic information must be completed first'
    }
  },
  {
    id: 'details',
    title: 'Event Details',
    icon: '📝',
    fields: [
      descriptionField,
      venueField,
      capacityField
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Settings',
    icon: '⚙️',
    fields: [
      customCssField,
      analyticsField,
      seoField
    ],
    visible: context => context.userRole === 'admin'
  }
]);
```

### **Wizard/Step Forms**

```typescript
// Multi-step wizard
const wizardFields = FormLayout.wizard([
  {
    step: 1,
    title: 'Event Basics',
    description: 'Tell us about your event',
    fields: [
      eventNameField,
      eventTypeField,
      eventDateField
    ],
    validation: {
      required: ['eventName', 'eventType', 'eventDate']
    }
  },
  {
    step: 2,
    title: 'Location & Venue',
    description: 'Where will your event take place?',
    fields: [
      venueTypeField,
      venueNameField,
      addressField,
      capacityField
    ],
    skipWhen: context => context.formData.eventType === 'virtual'
  },
  {
    step: 3,
    title: 'Services & Add-ons',
    description: 'Select additional services',
    fields: [
      servicesField,
      cateringField,
      equipmentField
    ]
  },
  {
    step: 4,
    title: 'Review & Submit',
    description: 'Review your event details',
    fields: [
      reviewField
    ],
    readonly: true
  }
], {
  showProgress: true,
  allowBackNavigation: true,
  saveProgress: true
});
```

### **Custom Layouts**

```typescript
// Grid layout dengan custom positioning
const gridFields = FormLayout.grid([
  { field: titleField, row: 1, col: 1, span: 2 },      // Full width
  { field: startDateField, row: 2, col: 1 },           // Left half
  { field: endDateField, row: 2, col: 2 },             // Right half
  { field: descriptionField, row: 3, col: 1, span: 2 }, // Full width
  { field: tagsField, row: 4, col: 1, span: 2 }        // Full width
], {
  columns: 2,
  gap: '1rem',
  responsive: {
    mobile: { columns: 1 }
  }
});

// Flexible layout
const flexFields = FormLayout.flex([
  { field: nameField, flex: 2 },      // Takes 2/3 of width
  { field: codeField, flex: 1 }       // Takes 1/3 of width
], {
  direction: 'row',
  wrap: true,
  align: 'stretch'
});
```

---

## ⚡ **Advanced Features**

### **Preset Field Collections**

```typescript
import { PresetFields } from '@/plugins/forms';

// Event-specific presets
const weddingFields = [
  ...PresetFields.forWedding(),
  ...PresetFields.brideAndGroom(),
  ...PresetFields.weddingVenue(),
  ...PresetFields.weddingServices()
];

const conferenceFields = [
  ...PresetFields.forConference(),
  ...PresetFields.speakers(),
  ...PresetFields.agenda(),
  ...PresetFields.registration()
];

const corporateFields = [
  ...PresetFields.forCorporate(),
  ...PresetFields.businessContact(),
  ...PresetFields.meetingRequirements()
];

// Location presets
const locationFields = [
  ...PresetFields.address(),        // Full address with validation
  ...PresetFields.coordinates(),    // Lat/lng with map picker
  ...PresetFields.timezone()        // Timezone selection
];

// Contact presets
const contactFields = [
  ...PresetFields.personalInfo(),   // Name, email, phone
  ...PresetFields.businessInfo(),   // Company, title, department
  ...PresetFields.socialMedia()     // Social media profiles
];
```

### **Dynamic Field Generation**

```typescript
// Generate fields dari schema
function generateFieldsFromSchema(schema: any) {
  return Object.entries(schema).map(([key, config]) => {
    const builder = FieldBuilder[config.type](key);
    
    if (config.label) builder.label(config.label);
    if (config.required) builder.required(true);
    if (config.options) {
      config.options.forEach(opt => builder.addOption(opt.value, opt.label));
    }
    
    return builder.build();
  });
}

// Usage
const eventSchema = {
  name: { type: 'text', label: 'Event Name', required: true },
  type: { 
    type: 'select', 
    label: 'Event Type',
    options: [
      { value: 'wedding', label: 'Wedding' },
      { value: 'conference', label: 'Conference' }
    ],
    required: true
  }
};

const dynamicFields = generateFieldsFromSchema(eventSchema);
```

### **Field Dependencies & Calculations**

```typescript
// Auto-calculated fields
const attendeesField = FieldBuilder.number('attendees')
  .label('Number of Attendees')
  .build();

const venueSizeField = FieldBuilder.number('venueSize')
  .label('Venue Size (sqm)')
  .build();

const densityField = FieldBuilder.number('density')
  .label('People per Square Meter')
  .readonly(true)
  .calculated(context => {
    const attendees = parseInt(context.formData.attendees) || 0;
    const venueSize = parseInt(context.formData.venueSize) || 1;
    return Math.round((attendees / venueSize) * 100) / 100;
  })
  .format(value => `${value} people/sqm`)
  .build();

// Field yang trigger calculations
const basePriceField = FieldBuilder.number('basePrice')
  .label('Base Price')
  .onChange((value, context, helpers) => {
    // Trigger recalculation of dependent fields
    helpers.updateField('totalPrice');
    helpers.updateField('pricePerPerson');
  })
  .build();
```

### **Real-time Validation & Feedback**

```typescript
// Real-time validation dengan indicators
const usernameField = FieldBuilder.text('username')
  .label('Username')
  .realTimeValidation(true)
  .validationIndicators({
    checking: 'Checking availability...',
    valid: '✅ Username available',
    invalid: '❌ Username taken'
  })
  .asyncValidation(async (value) => {
    const response = await fetch(`/api/check-username?username=${value}`);
    const result = await response.json();
    return {
      isValid: result.available,
      message: result.available ? 'Username available' : 'Username already taken'
    };
  }, 300)
  .build();

// Live preview
const cssField = FieldBuilder.textarea('customCss')
  .label('Custom CSS')
  .language('css')
  .livePreview({
    target: '#preview-container',
    debounce: 500
  })
  .build();
```

---

## 🔧 **Integration Examples**

### **Plugin Integration**

```typescript
// Dalam plugin implementation
export const CustomEventPlugin: EventPlugin = {
  // ... plugin metadata
  
  getFormFields(): FormField[] {
    return [
      // Basic event fields
      ...PresetFields.eventName(),
      ...PresetFields.eventDate(),
      
      // Plugin-specific fields
      FieldBuilder.select('eventTheme')
        .label('Event Theme')
        .addOption('modern', 'Modern')
        .addOption('classic', 'Classic')
        .addOption('rustic', 'Rustic')
        .required(true)
        .onChange((value, context, helpers) => {
          // Update related fields based on theme selection
          if (value === 'rustic') {
            helpers.showField('outdoorVenue');
            helpers.hideField('formalDressCode');
          }
        })
        .build(),
        
      FieldBuilder.checkbox('premiumServices')
        .label('Premium Services')
        .addOption('premium-catering', 'Premium Catering', { price: 500000 })
        .addOption('live-band', 'Live Band', { price: 2000000 })
        .addOption('photographer', 'Professional Photography', { price: 1500000 })
        .multiple(true)
        .showPricing(true)
        .onChange((value, context, helpers) => {
          // Auto-calculate total price
          helpers.updateField('totalCost');
        })
        .build()
    ];
  },
  
  // Custom validation for plugin
  validateEventData(data: any): ValidationResult {
    const errors = [];
    
    // Plugin-specific validation
    if (data.eventTheme === 'rustic' && !data.outdoorVenue) {
      errors.push({
        field: 'outdoorVenue',
        message: 'Rustic theme requires outdoor venue selection'
      });
    }
    
    return { isValid: errors.length === 0, errors };
  }
};
```

### **React Component Integration**

```tsx
// Complete form component dengan plugin integration
import React, { useState, useEffect } from 'react';
import { usePlugin, usePluginFormFields } from '@/plugins/hooks';
import { DynamicForm, FormLayout } from '@/plugins/forms';

interface EventCreationFormProps {
  eventType: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function EventCreationForm({ eventType, onSubmit, onCancel }: EventCreationFormProps) {
  const { plugin, isLoading: pluginLoading } = usePlugin(eventType);
  const { formFields, validateEventData, defaultSettings } = usePluginFormFields(eventType);
  const [formData, setFormData] = useState(defaultSettings);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Layout fields into sections
  const layoutFields = FormLayout.wizard([
    {
      step: 1,
      title: 'Event Basics',
      fields: formFields.slice(0, 5)
    },
    {
      step: 2,
      title: 'Event Details',
      fields: formFields.slice(5, 10)
    },
    {
      step: 3,
      title: 'Additional Services',
      fields: formFields.slice(10)
    }
  ]);
  
  const handleStepSubmit = (stepData: Record<string, any>, isValid: boolean) => {
    if (!isValid) return;
    
    setFormData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < layoutFields.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      const finalValidation = validateEventData({ ...formData, ...stepData });
      if (finalValidation.isValid) {
        onSubmit({ ...formData, ...stepData });
      }
    }
  };
  
  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  if (pluginLoading) {
    return <div className="loading">Loading form...</div>;
  }
  
  return (
    <div className="event-creation-form">
      {/* Progress indicator */}
      <div className="form-progress">
        {layoutFields.map((step, index) => (
          <div 
            key={step.step}
            className={`progress-step ${currentStep === step.step ? 'active' : ''}`}
          >
            <span className="step-number">{step.step}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>
      
      {/* Current step form */}
      <DynamicForm
        fields={layoutFields[currentStep - 1].fields}
        initialValues={formData}
        onSubmit={handleStepSubmit}
        submitText={currentStep < layoutFields.length ? 'Next Step' : 'Create Event'}
        showCancel={true}
        cancelText={currentStep > 1 ? 'Back' : 'Cancel'}
        onCancel={currentStep > 1 ? handleStepBack : onCancel}
        className="step-form"
      />
    </div>
  );
}
```

### **API Integration**

```typescript
// Form dengan API integration
const apiIntegratedFields = [
  // Field yang load options dari API
  FieldBuilder.select('venue')
    .label('Venue')
    .asyncOptions(async (query) => {
      const response = await fetch(`/api/venues?search=${query}`);
      const venues = await response.json();
      return venues.map(venue => ({
        value: venue.id,
        label: venue.name,
        data: {
          address: venue.address,
          capacity: venue.capacity,
          price: venue.price
        }
      }));
    })
    .searchable(true)
    .debounce(300)
    .onChange(async (value, context, helpers) => {
      // Load venue details when selected
      const response = await fetch(`/api/venues/${value}`);
      const venue = await response.json();
      
      // Update related fields
      helpers.setFieldValue('venueAddress', venue.address);
      helpers.setFieldValue('maxCapacity', venue.capacity);
      helpers.setFieldValue('venuePrice', venue.price);
    })
    .build(),
    
  // Auto-save field
  FieldBuilder.textarea('notes')
    .label('Event Notes')
    .autoSave(true)
    .autoSaveInterval(5000) // Save every 5 seconds
    .onAutoSave(async (value) => {
      await fetch('/api/events/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value })
      });
    })
    .build()
];
```

---

## 🚀 **Performance Tips**

### **Optimization Strategies**

```typescript
// Lazy loading untuk large option sets
const countryField = FieldBuilder.select('country')
  .label('Country')
  .lazyLoad(true)
  .pageSize(50)
  .asyncOptions(async (query, page = 1) => {
    const response = await fetch(`/api/countries?search=${query}&page=${page}&limit=50`);
    const result = await response.json();
    
    return {
      options: result.countries.map(c => ({ value: c.code, label: c.name })),
      hasMore: result.hasMore,
      total: result.total
    };
  })
  .build();

// Debounced validation untuk expensive operations
const emailField = FieldBuilder.email('email')
  .asyncValidation(async (value) => {
    // Expensive email validation (check domain, etc.)
    const response = await fetch(`/api/validate-email`, {
      method: 'POST',
      body: JSON.stringify({ email: value })
    });
    return await response.json();
  }, 1000) // 1 second debounce
  .build();

// Memoized calculations
const calculatedField = FieldBuilder.number('total')
  .calculated(useMemo(() => (context) => {
    // Expensive calculation
    return expensiveCalculation(context.formData);
  }, []))
  .build();
```

### **Memory Management**

```typescript
// Cleanup untuk async operations
const searchField = FieldBuilder.text('search')
  .asyncValidation(async (value, { signal }) => {
    try {
      const response = await fetch(`/api/search?q=${value}`, { signal });
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return { isValid: true }; // Ignore aborted requests
      }
      throw error;
    }
  }, 300)
  .build();

// Virtual scrolling untuk large lists
const largeSelectField = FieldBuilder.select('item')
  .label('Select Item')
  .virtualScroll(true)
  .itemHeight(40)
  .maxVisibleItems(10)
  .asyncOptions(async ({ query, startIndex, endIndex }) => {
    const response = await fetch(
      `/api/items?search=${query}&start=${startIndex}&end=${endIndex}`
    );
    return await response.json();
  })
  .build();
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Validation Not Working**

```typescript
// ❌ Incorrect - validation not properly configured
const field = FieldBuilder.text('name')
  .required() // Missing validation message
  .build();

// ✅ Correct - proper validation setup
const field = FieldBuilder.text('name')
  .required(true, 'Name is required')
  .minLength(2, 'Name must be at least 2 characters')
  .build();
```

#### **2. Conditional Fields Not Updating**

```typescript
// ❌ Incorrect - using wrong field reference
const conditionalField = FieldBuilder.text('conditionalField')
  .showWhenEquals('triggerField', 'show') // Field name must match exactly
  .build();

// ✅ Correct - ensure field names match
const triggerField = FieldBuilder.select('trigger') // Field name: 'trigger'
  .addOption('show', 'Show Field')
  .build();

const conditionalField = FieldBuilder.text('conditional')
  .showWhenEquals('trigger', 'show') // Must match field name exactly
  .build();
```

#### **3. Performance Issues**

```typescript
// ❌ Incorrect - no debouncing for expensive operations
const searchField = FieldBuilder.text('search')
  .onChange(async (value) => {
    // This fires on every keystroke - expensive!
    await fetch(`/api/search?q=${value}`);
  })
  .build();

// ✅ Correct - use debouncing
const searchField = FieldBuilder.text('search')
  .debounce(300)
  .onChange(async (value) => {
    await fetch(`/api/search?q=${value}`);
  })
  .build();
```

### **Debug Utilities**

```typescript
// Form debug mode
const debugForm = (
  <DynamicForm
    fields={fields}
    debug={process.env.NODE_ENV === 'development'}
    onDebug={(event, data) => {
      console.log(`Form Debug - ${event}:`, data);
    }}
    onSubmit={handleSubmit}
  />
);

// Field validation debug
const debugField = FieldBuilder.text('debugField')
  .label('Debug Field')
  .debug(true) // Enable field-level debugging
  .custom((value, context) => {
    console.log('Custom validation - value:', value, 'context:', context);
    return value.length > 0;
  }, 'Field cannot be empty')
  .build();
```

---

**Form Builder Usage Guide Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Compatibility:** Event Management Engine v2.0+

---

*Complete reference untuk Form Builder system. Untuk additional examples dan advanced patterns, lihat [Plugin System Technical Documentation](./PLUGIN_SYSTEM_TECHNICAL_DOCUMENTATION.md).*