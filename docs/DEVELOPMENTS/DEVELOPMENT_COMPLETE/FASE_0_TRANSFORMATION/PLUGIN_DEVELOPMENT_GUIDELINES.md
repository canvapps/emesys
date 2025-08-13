# 📚 Plugin Development Guidelines & Standards - Event Management Engine

## Executive Summary
Comprehensive development guidelines dan standards untuk creating **Event Management Engine plugins**. Document ini menyediakan complete framework untuk plugin development, testing, distribution, dan maintenance dengan enterprise-grade quality standards dan best practices.

---

## 🎯 **PLUGIN DEVELOPMENT PHILOSOPHY**

### **Core Principles**
```typescript
// ===============================================
// EVENT MANAGEMENT ENGINE PLUGIN PRINCIPLES
// ===============================================

/*
1. EXTENSIBILITY FIRST
   - Plugins extend core functionality without modifying engine
   - Clean separation of concerns
   - Backward compatible APIs

2. PERFORMANCE ORIENTED  
   - <10ms processing targets
   - Minimal memory footprint
   - Efficient resource utilization

3. TEST-DRIVEN DEVELOPMENT
   - >95% test coverage requirement
   - Unit, integration, and performance tests
   - Automated quality assurance

4. ENTERPRISE READY
   - Production-grade security
   - Comprehensive error handling
   - Detailed logging and monitoring

5. DEVELOPER EXPERIENCE
   - Clear APIs and documentation
   - Rich development tools
   - Extensive examples and templates
*/

const PLUGIN_DEVELOPMENT_STANDARDS = {
  // Code Quality Standards
  TEST_COVERAGE: 95,           // Minimum 95% test coverage
  PERFORMANCE_TARGET: 10,      // <10ms processing time
  MEMORY_LIMIT: 25,           // <25MB memory per plugin
  
  // API Compliance
  TYPESCRIPT_REQUIRED: true,   // TypeScript mandatory
  API_VERSION: '3.0.0',       // Current API version
  SCHEMA_VALIDATION: true,     // JSON Schema validation required
  
  // Documentation Requirements
  README_REQUIRED: true,       // Comprehensive README
  API_DOCS_REQUIRED: true,     // Auto-generated API docs
  EXAMPLES_REQUIRED: true,     // Working code examples
  
  // Security Standards
  INPUT_VALIDATION: true,      // All inputs must be validated
  OUTPUT_SANITIZATION: true,   // All outputs must be sanitized
  PERMISSION_CHECKS: true,     // Authorization checks required
  
  // Distribution Standards
  NPM_PACKAGE: true,          // Must be NPM package
  SEMANTIC_VERSIONING: true,   // Semantic versioning required
  CHANGELOG: true,            // Maintain changelog
  LICENSE: 'MIT'              // MIT license required
} as const;
```

---

## 🏗️ **PLUGIN ARCHITECTURE STANDARDS**

### **Base Plugin Class Implementation**
```typescript
// ===============================================
// PLUGIN BASE CLASS - MANDATORY IMPLEMENTATION
// ===============================================

import { EventPlugin, EventFormSchema, EventSection, ValidationResult } from '@event-engine/core';

export abstract class EventPluginBase implements EventPlugin {
  // ===============================================
  // REQUIRED PROPERTIES
  // ===============================================
  
  abstract readonly name: string;                    // Unique plugin identifier
  abstract readonly version: string;                 // Semantic version (x.y.z)
  abstract readonly displayName: string;             // Human-readable name
  abstract readonly description: string;             // Plugin description
  abstract readonly author: string;                  // Plugin author/organization
  abstract readonly category: EventCategory;         // Plugin category
  abstract readonly license: string;                 // License (MIT required)
  
  // Optional properties dengan defaults
  readonly apiVersion: string = '3.0.0';            // API version compatibility
  readonly homepage?: string;                        // Plugin homepage URL
  readonly repository?: string;                      // Source code repository
  readonly keywords: string[] = [];                 // Search keywords
  readonly dependencies: PluginDependency[] = [];   // Plugin dependencies
  
  // ===============================================
  // LIFECYCLE METHODS - MUST IMPLEMENT
  // ===============================================
  
  /**
   * Plugin installation hook
   * Called when plugin is first installed
   */
  abstract async onInstall(): Promise<void>;
  
  /**
   * Plugin activation hook  
   * Called when plugin is activated
   */
  abstract async onActivate(): Promise<void>;
  
  /**
   * Plugin deactivation hook
   * Called when plugin is deactivated
   */
  async onDeactivate(): Promise<void> {
    // Default implementation - override if needed
    console.log(`Plugin ${this.name} deactivated`);
  }
  
  /**
   * Plugin uninstallation hook
   * Called when plugin is being removed
   */
  async onUninstall(): Promise<void> {
    // Default implementation - override if needed
    console.log(`Plugin ${this.name} uninstalled`);
  }
  
  // ===============================================
  // CORE FUNCTIONALITY - MUST IMPLEMENT
  // ===============================================
  
  /**
   * Return form schema for event creation/editing
   * @returns EventFormSchema - Complete form configuration
   */
  abstract getFormSchema(): EventFormSchema;
  
  /**
   * Return default page sections for this event type
   * @returns EventSection[] - Array of default sections
   */
  abstract getDefaultSections(): EventSection[];
  
  /**
   * Validate event data according to plugin rules
   * @param data - Event data to validate
   * @returns ValidationResult - Validation results
   */
  abstract validateEventData(data: any): ValidationResult;
  
  /**
   * Process participants for this event type
   * @param participants - Raw participant data
   * @returns ProcessedParticipant[] - Processed participants
   */
  abstract async processParticipants(
    participants: any[]
  ): Promise<any[]>;
  
  /**
   * Generate preview data for event
   * @param data - Event form data
   * @returns PreviewData - Preview configuration
   */
  abstract async generatePreview(data: any): Promise<any>;
  
  // ===============================================
  // OPTIONAL METHODS - CAN OVERRIDE
  // ===============================================
  
  /**
   * Custom validation beyond standard rules
   * @param data - Event data
   * @returns CustomValidationResult
   */
  async customValidation(data: any): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }
  
  /**
   * Generate custom reports for this event type
   * @param eventId - Event ID
   * @returns Report data
   */
  async generateReports(eventId: string): Promise<any> {
    throw new Error('Reports not implemented for this plugin');
  }
  
  /**
   * Export event data in plugin-specific format
   * @param eventId - Event ID
   * @param format - Export format
   * @returns Exported data
   */
  async exportData(eventId: string, format: string): Promise<any> {
    throw new Error('Export not implemented for this plugin');
  }
  
  /**
   * Import event data from external source
   * @param data - Import data
   * @returns Imported event data
   */
  async importData(data: any): Promise<any> {
    throw new Error('Import not implemented for this plugin');
  }
  
  // ===============================================
  // UTILITY METHODS - PROVIDED BY BASE CLASS
  // ===============================================
  
  /**
   * Log plugin activity
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Additional data
   */
  protected log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      plugin: this.name,
      version: this.version,
      level,
      message,
      metadata
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  /**
   * Validate plugin configuration
   * @param config - Plugin configuration
   * @returns Validation result
   */
  protected validateConfig(config: any): ValidationResult {
    // Implement basic config validation
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!config) {
      errors.push('Plugin configuration is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get plugin metadata for registry
   * @returns PluginMetadata
   */
  getMetadata(): PluginMetadata {
    return {
      name: this.name,
      version: this.version,
      displayName: this.displayName,
      description: this.description,
      author: this.author,
      category: this.category,
      license: this.license,
      apiVersion: this.apiVersion,
      homepage: this.homepage,
      repository: this.repository,
      keywords: this.keywords,
      dependencies: this.dependencies,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }
}

// ===============================================
// PLUGIN CATEGORIES
// ===============================================

export enum EventCategory {
  WEDDING = 'wedding',
  CORPORATE = 'corporate',
  EDUCATIONAL = 'educational',
  SOCIAL = 'social',
  ENTERTAINMENT = 'entertainment',
  SPORTS = 'sports',
  RELIGIOUS = 'religious',
  CHARITY = 'charity',
  CUSTOM = 'custom'
}

// ===============================================
// TYPE DEFINITIONS
// ===============================================

export interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

export interface PluginMetadata {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  category: EventCategory;
  license: string;
  apiVersion: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  dependencies: PluginDependency[];
  createdAt: Date;
  lastUpdated: Date;
}
```

---

## 📋 **FORM SCHEMA STANDARDS**

### **Form Field Specifications**
```typescript
// ===============================================
// FORM SCHEMA DEVELOPMENT STANDARDS
// ===============================================

export interface EventFormSchema {
  // ===============================================
  // REQUIRED PROPERTIES
  // ===============================================
  eventType: string;                    // Must match plugin name
  fields: FormField[];                  // Array of form fields
  validation: ValidationRules;          // Form-level validation
  layout: FormLayout;                   // Form layout configuration
  
  // ===============================================
  // OPTIONAL PROPERTIES
  // ===============================================
  conditionalFields?: ConditionalField[];    // Conditional field logic
  customValidation?: CustomValidationFn;     // Custom validation function
  submitButtonText?: string;                 // Custom submit button text
  resetButtonText?: string;                  // Custom reset button text
  helpText?: string;                         // Form-level help text
  successMessage?: string;                   // Success message after submit
  
  // ===============================================
  // METADATA
  // ===============================================
  metadata?: {
    version: string;                         // Schema version
    lastModified: Date;                      // Last modification date
    author: string;                          // Schema author
    description: string;                     // Schema description
  };
}

// ===============================================
// FORM FIELD TYPES - SUPPORTED STANDARDS
// ===============================================

export interface FormField {
  // Required properties
  name: string;                              // Unique field name
  type: FieldType;                          // Field type
  label: string;                            // Display label
  required: boolean;                        // Required field flag
  
  // Optional properties
  placeholder?: string;                     // Input placeholder
  helpText?: string;                        // Field help text
  validation?: FieldValidation;             // Field-specific validation
  defaultValue?: any;                       // Default value
  
  // UI Properties
  className?: string;                       // CSS classes
  style?: Record<string, any>;              // Inline styles
  disabled?: boolean;                       // Disabled state
  readonly?: boolean;                       // Read-only state
  hidden?: boolean;                         // Hidden field
  
  // Type-specific properties
  options?: SelectOption[];                 // For select/radio fields
  min?: number;                            // For number/date fields
  max?: number;                            // For number/date fields
  step?: number;                           // For number fields
  pattern?: string;                        // For text validation
  multiple?: boolean;                      // For file/select fields
  
  // Nested fields (for object/array types)
  fields?: FormField[];                    // Nested fields
  item_type?: FieldType;                   // Array item type
  item_config?: Partial<FormField>;        // Array item configuration
  
  // Accessibility
  ariaLabel?: string;                      // ARIA label
  ariaDescribedBy?: string;                // ARIA described by
  tabIndex?: number;                       // Tab index
  
  // Advanced features
  autocomplete?: string;                   // Autocomplete attribute
  dependsOn?: string[];                    // Field dependencies
  computedValue?: ComputedValueFn;         // Computed value function
}

// ===============================================
// SUPPORTED FIELD TYPES
// ===============================================

export enum FieldType {
  // Text inputs
  TEXT = 'text',
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  PASSWORD = 'password',
  TEXTAREA = 'textarea',
  RICH_TEXT = 'rich_text',
  
  // Numeric inputs
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  
  // Date/Time inputs
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  
  // Selection inputs
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TOGGLE = 'toggle',
  
  // File inputs
  FILE = 'file',
  IMAGE = 'image',
  
  // Complex inputs
  OBJECT = 'object',
  ARRAY = 'array',
  
  // Special inputs
  COLOR = 'color',
  RATING = 'rating',
  SLIDER = 'slider',
  LOCATION = 'location',
  
  // Display only
  DISPLAY = 'display',
  SEPARATOR = 'separator',
  HEADING = 'heading'
}

// ===============================================
// VALIDATION STANDARDS
// ===============================================

export interface FieldValidation {
  // Length validation
  minLength?: number;
  maxLength?: number;
  
  // Numeric validation
  min?: number;
  max?: number;
  
  // Pattern validation
  pattern?: string;
  format?: 'email' | 'url' | 'phone' | 'date' | 'time';
  
  // Custom validation
  custom?: ValidationFunction;
  
  // Error messages
  messages?: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
    format?: string;
    custom?: string;
  };
}

export type ValidationFunction = (
  value: any,
  allValues: Record<string, any>
) => ValidationResult;

// ===============================================
// CONDITIONAL FIELDS STANDARDS
// ===============================================

export interface ConditionalField {
  condition: FieldCondition;
  showFields: string[];
  hideFields?: string[];
  requiredFields?: string[];
  optionalFields?: string[];
}

export interface FieldCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  conditions?: FieldCondition[];  // For AND/OR logic
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  AND = 'and',
  OR = 'or'
}

// ===============================================
// FORM SCHEMA EXAMPLE - BEST PRACTICES
// ===============================================

export const ExampleFormSchema: EventFormSchema = {
  eventType: 'workshop',
  fields: [
    // Basic information section
    {
      name: 'workshop_title',
      type: FieldType.TEXT,
      label: 'Workshop Title',
      placeholder: 'Enter workshop title',
      required: true,
      validation: {
        minLength: 5,
        maxLength: 100,
        messages: {
          required: 'Workshop title is required',
          minLength: 'Title must be at least 5 characters',
          maxLength: 'Title cannot exceed 100 characters'
        }
      },
      helpText: 'Choose a clear, descriptive title for your workshop'
    },
    
    // Instructor information (object field)
    {
      name: 'instructor',
      type: FieldType.OBJECT,
      label: 'Instructor Information',
      required: true,
      fields: [
        {
          name: 'name',
          type: FieldType.TEXT,
          label: 'Instructor Name',
          required: true,
          validation: { minLength: 2, maxLength: 50 }
        },
        {
          name: 'email',
          type: FieldType.EMAIL,
          label: 'Email Address',
          required: true,
          validation: { format: 'email' }
        },
        {
          name: 'bio',
          type: FieldType.TEXTAREA,
          label: 'Biography',
          required: false,
          validation: { maxLength: 500 },
          helpText: 'Brief instructor biography (optional)'
        }
      ]
    },
    
    // Workshop sessions (array field)
    {
      name: 'sessions',
      type: FieldType.ARRAY,
      label: 'Workshop Sessions',
      required: true,
      validation: { 
        minItems: 1, 
        maxItems: 10,
        messages: {
          minItems: 'At least one session is required',
          maxItems: 'Maximum 10 sessions allowed'
        }
      },
      item_type: FieldType.OBJECT,
      item_config: {
        fields: [
          {
            name: 'title',
            type: FieldType.TEXT,
            label: 'Session Title',
            required: true
          },
          {
            name: 'duration',
            type: FieldType.NUMBER,
            label: 'Duration (minutes)',
            required: true,
            min: 15,
            max: 480
          }
        ]
      }
    }
  ],
  
  // Form validation
  validation: {
    crossFieldValidation: [
      {
        fields: ['start_date', 'end_date'],
        validator: (values) => {
          if (values.start_date && values.end_date) {
            return new Date(values.start_date) < new Date(values.end_date);
          }
          return true;
        },
        message: 'End date must be after start date'
      }
    ]
  },
  
  // Conditional fields
  conditionalFields: [
    {
      condition: {
        field: 'has_certificate',
        operator: ConditionOperator.EQUALS,
        value: true
      },
      showFields: ['certificate_template', 'certificate_requirements']
    }
  ],
  
  // Layout configuration
  layout: 'multi_step',
  
  // Metadata
  metadata: {
    version: '1.0.0',
    lastModified: new Date(),
    author: 'Workshop Plugin Team',
    description: 'Form schema for workshop event creation'
  }
};
```

---

## 🧪 **TESTING STANDARDS**

### **Required Test Coverage**
```typescript
// ===============================================
// PLUGIN TESTING REQUIREMENTS - MANDATORY
// ===============================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkshopPlugin } from '../WorkshopPlugin';

describe('WorkshopPlugin - Complete Test Suite', () => {
  let plugin: WorkshopPlugin;
  
  beforeEach(() => {
    plugin = new WorkshopPlugin();
  });
  
  // ===============================================
  // 1. PLUGIN LIFECYCLE TESTS - REQUIRED
  // ===============================================
  
  describe('Plugin Lifecycle', () => {
    it('should install successfully', async () => {
      const result = await plugin.onInstall();
      expect(result).toBe(undefined); // No errors thrown
    });
    
    it('should activate successfully', async () => {
      await plugin.onInstall();
      const result = await plugin.onActivate();
      expect(result).toBe(undefined);
    });
    
    it('should deactivate gracefully', async () => {
      await plugin.onInstall();
      await plugin.onActivate();
      const result = await plugin.onDeactivate();
      expect(result).toBe(undefined);
    });
    
    it('should uninstall cleanly', async () => {
      await plugin.onInstall();
      const result = await plugin.onUninstall();
      expect(result).toBe(undefined);
    });
  });
  
  // ===============================================
  // 2. FORM SCHEMA TESTS - REQUIRED
  // ===============================================
  
  describe('Form Schema Validation', () => {
    it('should return valid form schema structure', () => {
      const schema = plugin.getFormSchema();
      
      // Required properties
      expect(schema).toHaveProperty('eventType');
      expect(schema).toHaveProperty('fields');
      expect(schema).toHaveProperty('validation');
      expect(schema).toHaveProperty('layout');
      
      // Event type matches plugin name
      expect(schema.eventType).toBe(plugin.name);
      
      // Fields is array with content
      expect(Array.isArray(schema.fields)).toBe(true);
      expect(schema.fields.length).toBeGreaterThan(0);
    });
    
    it('should have valid field definitions', () => {
      const schema = plugin.getFormSchema();
      
      schema.fields.forEach((field, index) => {
        // Required field properties
        expect(field.name).toBeDefined();
        expect(field.type).toBeDefined();
        expect(field.label).toBeDefined();
        expect(typeof field.required).toBe('boolean');
        
        // Field name is unique
        const duplicates = schema.fields.filter(f => f.name === field.name);
        expect(duplicates.length).toBe(1);
        
        // Validation is properly structured if present
        if (field.validation) {
          expect(typeof field.validation).toBe('object');
        }
      });
    });
    
    it('should validate conditional fields syntax', () => {
      const schema = plugin.getFormSchema();
      
      if (schema.conditionalFields) {
        schema.conditionalFields.forEach(conditionalField => {
          expect(conditionalField).toHaveProperty('condition');
          expect(conditionalField).toHaveProperty('showFields');
          expect(Array.isArray(conditionalField.showFields)).toBe(true);
          
          // Validate condition structure
          const condition = conditionalField.condition;
          expect(condition).toHaveProperty('field');
          expect(condition).toHaveProperty('operator');
          expect(condition).toHaveProperty('value');
        });
      }
    });
  });
  
  // ===============================================
  // 3. DATA VALIDATION TESTS - REQUIRED
  // ===============================================
  
  describe('Event Data Validation', () => {
    it('should validate correct data successfully', () => {
      const validData = {
        workshop_title: 'Introduction to React',
        instructor: {
          name: 'Jane Developer',
          email: 'jane@example.com',
          bio: 'Experienced React developer'
        },
        sessions: [
          {
            title: 'Getting Started',
            duration: 90
          }
        ]
      };
      
      const result = plugin.validateEventData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid data with proper error messages', () => {
      const invalidData = {
        workshop_title: 'A', // Too short
        instructor: {
          name: '', // Empty required field
          email: 'invalid-email' // Invalid format
        },
        sessions: [] // Empty required array
      };
      
      const result = plugin.validateEventData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check specific error messages
      const errorMessages = result.errors.join(' ');
      expect(errorMessages).toContain('title');
      expect(errorMessages).toContain('name');
      expect(errorMessages).toContain('email');
      expect(errorMessages).toContain('session');
    });
    
    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        null,
        undefined,
        {},
        { invalid_field: 'value' },
        { workshop_title: null }
      ];
      
      edgeCases.forEach(edgeCase => {
        const result = plugin.validateEventData(edgeCase);
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });
  });
  
  // ===============================================
  // 4. PARTICIPANT PROCESSING TESTS - REQUIRED
  // ===============================================
  
  describe('Participant Processing', () => {
    it('should process participants correctly', async () => {
      const mockParticipants = [
        {
          contactInfo: {
            name: 'John Attendee',
            email: 'john@example.com'
          },
          participant_type: 'attendee',
          status: 'registered'
        }
      ];
      
      const processed = await plugin.processParticipants(mockParticipants);
      
      expect(Array.isArray(processed)).toBe(true);
      expect(processed).toHaveLength(1);
      
      // Verify processing added required fields
      const participant = processed[0];
      expect(participant.contactInfo).toBeDefined();
      expect(participant.participant_type).toBeDefined();
      expect(participant.status).toBeDefined();
    });
    
    it('should handle empty participant list', async () => {
      const processed = await plugin.processParticipants([]);
      
      expect(Array.isArray(processed)).toBe(true);
      expect(processed).toHaveLength(0);
    });
    
    it('should validate participant data', async () => {
      const invalidParticipants = [
        {
          // Missing required contactInfo
          participant_type: 'attendee',
          status: 'registered'
        }
      ];
      
      await expect(
        plugin.processParticipants(invalidParticipants)
      ).rejects.toThrow();
    });
  });
  
  // ===============================================
  // 5. PREVIEW GENERATION TESTS - REQUIRED
  // ===============================================
  
  describe('Preview Generation', () => {
    it('should generate valid preview data', async () => {
      const eventData = {
        workshop_title: 'Test Workshop',
        instructor: {
          name: 'Test Instructor',
          email: 'test@example.com'
        }
      };
      
      const preview = await plugin.generatePreview(eventData);
      
      expect(preview).toBeDefined();
      expect(preview).toHaveProperty('pageTitle');
      expect(preview.pageTitle).toContain('Test Workshop');
    });
    
    it('should handle incomplete data gracefully', async () => {
      const incompleteData = {
        workshop_title: 'Incomplete Workshop'
        // Missing instructor
      };
      
      const preview = await plugin.generatePreview(incompleteData);
      
      expect(preview).toBeDefined();
      expect(preview.pageTitle).toBeDefined();
    });
  });
  
  // ===============================================
  // 6. PERFORMANCE TESTS - REQUIRED
  // ===============================================
  
  describe('Performance Benchmarks', () => {
    it('should meet form schema generation performance target', () => {
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        plugin.getFormSchema();
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;
      
      // Must be under 10ms average
      expect(averageTime).toBeLessThan(10);
    });
    
    it('should validate data within performance target', () => {
      const testData = {
        workshop_title: 'Performance Test Workshop',
        instructor: { name: 'Test', email: 'test@example.com' },
        sessions: [{ title: 'Session 1', duration: 60 }]
      };
      
      const iterations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        plugin.validateEventData(testData);
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;
      
      // Must be under 25ms average
      expect(averageTime).toBeLessThan(25);
    });
    
    it('should not exceed memory usage limits', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create multiple instances to test memory usage
      const plugins = Array.from({length: 100}, () => new WorkshopPlugin());
      
      // Generate schemas to test memory impact
      plugins.forEach(p => p.getFormSchema());
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB
      
      // Should not exceed 25MB for 100 instances
      expect(memoryIncrease).toBeLessThan(25);
    });
  });
  
  // ===============================================
  // 7. ERROR HANDLING TESTS - REQUIRED
  // ===============================================
  
  describe('Error Handling', () => {
    it('should handle malformed data gracefully', () => {
      const malformedData = {
        circular: {}
      };
      malformedData.circular = malformedData; // Circular reference
      
      expect(() => {
        plugin.validateEventData(malformedData);
      }).not.toThrow();
    });
    
    it('should provide meaningful error messages', () => {
      const invalidData = { workshop_title: '' };
      const result = plugin.validateEventData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.every(error => typeof error === 'string')).toBe(true);
      expect(result.errors.every(error => error.length > 0)).toBe(true);
    });
  });
  
  // ===============================================
  // 8. METADATA TESTS - REQUIRED
  // ===============================================
  
  describe('Plugin Metadata', () => {
    it('should return complete metadata', () => {
      const metadata = plugin.getMetadata();
      
      // Required fields
      expect(metadata.name).toBe(plugin.name);
      expect(metadata.version).toBe(plugin.version);
      expect(metadata.displayName).toBe(plugin.displayName);
      expect(metadata.description).toBe(plugin.description);
      expect(metadata.author).toBe(plugin.author);
      expect(metadata.category).toBe(plugin.category);
      expect(metadata.license).toBe(plugin.license);
      
      // Dates
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.lastUpdated).toBeInstanceOf(Date);
    });
    
    it('should have valid semantic version', () => {
      const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
      expect(plugin.version).toMatch(semverPattern);
    });
  });
});

// ===============================================
// INTEGRATION TESTS - REQUIRED
// ===============================================

describe('WorkshopPlugin Integration Tests', () => {
  it('should integrate with plugin registry', () => {
    const registry = new EventPluginRegistry();
    registry.register(plugin);
    
    const retrievedPlugin = registry.getPlugin('workshop');
    expect(retrievedPlugin).toBeInstanceOf(WorkshopPlugin);
  });
  
  it('should work with form builder', () => {
    const formBuilder = new DynamicFormBuilder();
    const schema = plugin.getFormSchema();
    
    const processedForm = formBuilder.processSchema(schema);
    expect(processedForm.fields).toBeDefined();
    expect(processedForm.validation).toBeDefined();
  });
});
```

---

## 📦 **PACKAGING & DISTRIBUTION STANDARDS**

### **NPM Package Structure**
```json
// ===============================================
// PACKAGE.JSON - REQUIRED STRUCTURE
// ===============================================

{
  "name": "@event-plugins/workshop",
  "version": "1.0.0",
  "description": "Professional workshop management plugin for Event Management Engine",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist/**/*",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  
  // Required metadata
  "keywords": [
    "event-management-engine",
    "plugin",
    "workshop",
    "education",
    "training"
  ],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "homepage": "https://github.com/yourusername/event-plugin-workshop",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/event-plugin-workshop.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/event-plugin-workshop/issues"
  },
  
  // Engine compatibility
  "peerDependencies": {
    "@event-management-engine/core": "^3.0.0"
  },
  
  // Build scripts
  "scripts": {
    "build": "rollup -c",
    "build:watch": "rollup -c -w",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest run",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "docs": "typedoc",
    "prepublishOnly": "npm run build && npm run test:ci && npm run lint"
  },
  
  // Development dependencies
  "devDependencies": {
    "@event-management-engine/core": "^3.0.0",
    "@rollup/plugin-typescript": "^11.1.0",
    "@types/node": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "@vitest/coverage-v8": "^0.31.0",
    "eslint": "^8.40.0",
    "rollup": "^3.21.0",
    "typedoc": "^0.24.0",
    "typescript": "^5.0.0",
    "vitest": "^0.31.0"
  },
  
  // Plugin-specific metadata
  "eventEnginePlugin": {
    "apiVersion": "3.0.0",
    "category": "educational",
    "compatibility": {
      "minEngineVersion": "3.0.0",
      "maxEngineVersion": "4.0.0"
    },
    "features": [
      "form-generation",
      "participant-management",
      "preview-generation",
      "data-validation"
    ],
    "permissions": [
      "read-events",
      "write-events",
      "read-participants",
      "write-participants"
    ]
  }
}
```

### **Project Directory Structure**
```
event-plugin-workshop/
├── src/
│   ├── index.ts                    # Main plugin export
│   ├── WorkshopPlugin.ts          # Plugin implementation
│   ├── types.ts                   # Type definitions
│   ├── schemas/
│   │   └── workshop-schema.ts     # Form schema
│   ├── validators/
│   │   └── workshop-validator.ts  # Custom validators
│   ├── utils/
│   │   └── helpers.ts             # Utility functions
│   └── __tests__/
│       ├── WorkshopPlugin.test.ts # Main test file
│       ├── integration.test.ts    # Integration tests
│       └── fixtures/              # Test data
├── dist/                          # Built files (generated)
├── docs/                          # Generated documentation
├── examples/
│   └── basic-usage.ts             # Usage examples
├── README.md                      # Documentation
├── CHANGELOG.md                   # Version history
├── LICENSE                        # MIT License
├── package.json                   # Package configuration
├── tsconfig.json                  # TypeScript config
├── rollup.config.js              # Build configuration
├── vitest.config.ts              # Test configuration
└── .eslintrc.js                  # Linting configuration
```

---

## 🔒 **SECURITY STANDARDS**

### **Input Validation & Sanitization**
```typescript
// ===============================================
// SECURITY IMPLEMENTATION REQUIREMENTS
// ===============================================

import { sanitizeHtml, validateInput, escapeOutput } from '@event-engine/security';

export class SecureWorkshopPlugin extends EventPluginBase {
  
  // ===============================================
  // INPUT VALIDATION - MANDATORY
  // ===============================================
  
  validateEventData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Sanitize all string inputs
      const sanitizedData = this.sanitizeInputData(data);
      
      // 2. Validate data structure
      const structureValidation = this.validateDataStructure(sanitizedData);
      if (!structureValidation.isValid) {
        errors.push(...structureValidation.errors);
      }
      
      // 3. Validate business rules
      const businessValidation = this.validateBusinessRules(sanitizedData);
      if (!businessValidation.isValid) {
        errors.push(...businessValidation.errors);
      }
      
      // 4. Check for security violations
      const securityValidation = this.validateSecurity(sanitizedData);
      if (!securityValidation.isValid) {
        errors.push(...securityValidation.errors);
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      this.log('error', 'Data validation failed', { error: error.message });
      return {
        isValid: false,
        errors: ['Data validation failed due to security concerns'],
        warnings: []
      };
    }
  }
  
  // ===============================================
  // INPUT SANITIZATION
  // ===============================================
  
  private sanitizeInputData(data: any): any {
    if (typeof data === 'string') {
      return sanitizeHtml(data, {
        allowedTags: [], // No HTML allowed by default
        allowedAttributes: {}
      });
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInputData(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Validate key names
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          throw new Error(`Invalid property name: ${key}`);
        }
        
        sanitized[key] = this.sanitizeInputData(value);
      }
      return sanitized;
    }
    
    return data;
  }
  
  // ===============================================
  // SECURITY VALIDATION
  // ===============================================
  
  private validateSecurity(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Check for suspicious patterns
    const dataString = JSON.stringify(data);
    
    // SQL injection patterns
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)/i,
      /(\bdrop\b.*\btable\b)/i,
      /(\binsert\b.*\binto\b)/i,
      /(\bupdate\b.*\bset\b)/i,
      /(\bdelete\b.*\bfrom\b)/i,
      /(;.*--)/,
      /(\bexec\b|\bexecute\b)/i
    ];
    
    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi
    ];
    
    // Check SQL injection
    sqlPatterns.forEach(pattern => {
      if (pattern.test(dataString)) {
        errors.push('Potentially malicious SQL pattern detected');
      }
    });
    
    // Check XSS
    xssPatterns.forEach(pattern => {
      if (pattern.test(dataString)) {
        errors.push('Potentially malicious script pattern detected');
      }
    });
    
    // Check for suspicious file paths
    if (dataString.includes('../') || dataString.includes('..\\')) {
      errors.push('Path traversal attempt detected');
    }
    
    // Check payload size
    if (dataString.length > 1024 * 1024) { // 1MB limit
      errors.push('Payload size exceeds security limits');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
  
  // ===============================================
  // OUTPUT SANITIZATION
  // ===============================================
  
  async generatePreview(data: any): Promise<any> {
    // Validate input first
    const validation = this.validateEventData(data);
    if (!validation.isValid) {
      throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
    }
    
    // Generate preview with sanitized output
    const preview = {
      pageTitle: escapeOutput(data.workshop_title || 'Untitled Workshop'),
      metaDescription: escapeOutput(
        this.truncateText(data.description || '', 160)
      ),
      sections: await this.generateSecureSections(data)
    };
    
    return preview;
  }
  
  private async generateSecureSections(data: any): Promise<any[]> {
    const sections = [];
    
    // Hero section dengan sanitized content
    sections.push({
      type: 'hero',
      content: {
        title: escapeOutput(data.workshop_title),
        instructor: escapeOutput(data.instructor?.name || 'TBD'),
        // Remove any HTML/script content
        description: sanitizeHtml(data.description || '', {
          allowedTags: ['p', 'br'],
          allowedAttributes: {}
        })
      }
    });
    
    return sections;
  }
  
  // ===============================================
  // PERMISSION CHECKS
  // ===============================================
  
  private checkPermissions(
    userId: string, 
    operation: string, 
    resource: string
  ): boolean {
    // Implement permission checking logic
    // This should integrate with your authorization system
    
    const requiredPermission = `${operation}:${resource}`;
    
    // Example permission check (replace with actual implementation)
    return this.hasPermission(userId, requiredPermission);
  }
  
  private hasPermission(userId: string, permission: string): boolean {
    // Implement actual permission check
    // Should check against user roles, tenant permissions, etc.
    
    this.log('debug', 'Permission check', { userId, permission });
    
    // Placeholder implementation
    return true; // Replace with actual logic
  }
  
  // ===============================================
  // RATE LIMITING
  // ===============================================
  
  private rateLimiter = new Map<string, number[]>();
  
  private checkRateLimit(
    identifier: string, 
    maxRequests: number = 100, 
    timeWindow: number = 60000 // 1 minute
  ): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(identifier) || [];
    
    // Remove old requests outside time window
    const validRequests = requests.filter(time => now - time < timeWindow);
    
    // Check if under limit
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.rateLimiter.set(identifier, validRequests);
    
    return true;
  }
  
  // ===============================================
  // AUDIT LOGGING
  // ===============================================
  
  protected log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: any
  ): void {
    const auditLog = {
      timestamp: new Date().toISOString(),
      plugin: this.name,
      version: this.version,
      level,
      message,
      metadata: {
        ...metadata,
        // Include security context
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        userId: metadata?.userId,
        tenantId: metadata?.tenantId
      }
    };
    
    // Send to audit log system
    console.log(JSON.stringify(auditLog));
    
    // For security events, also trigger alerts
    if (level === 'error' || message.includes('security')) {
      this.triggerSecurityAlert(auditLog);
    }
  }
  
  private triggerSecurityAlert(auditLog: any): void {
    // Implement security alerting
    // Could send to SIEM, notification system, etc.
    console.error('🚨 SECURITY ALERT:', auditLog);
  }
}
```

---

**Status**: ✅ **PLUGIN DEVELOPMENT GUIDELINES FOUNDATION COMPLETE**  
**Coverage**: **Architecture + Testing + Security + Distribution** standards  
**Quality**: **Enterprise-grade requirements** dengan >95% test coverage  
**Security**: **Comprehensive input validation** dan output sanitization  
**Developer Experience**: **Complete framework** untuk plugin development

Plugin development guidelines siap untuk production use dengan comprehensive standards dan best practices.