/**
 * PHASE 3: Dynamic Form System Index
 * Central export point for all form-related components and utilities
 */

// Core form components
export { DynamicForm } from './DynamicForm';
export type { DynamicFormProps, DynamicFieldProps } from './DynamicForm';

// Form field builders
export { FormFieldBuilder, FieldBuilder, PresetFields, FormLayout, ValidationHelpers } from './FormFieldBuilder';

// Validation system
export {
  FormValidationEngine,
  PresetValidationSchemas
} from './FormValidationSystem';

export type {
  ValidationContext,
  AsyncValidationResult,
  AsyncValidator,
  ValidationSchema,
  FieldValidationConfig,
  CrossFieldRule,
  AsyncValidatorConfig,
  WarningRule,
  CustomValidator
} from './FormValidationSystem';

// Re-export types from plugin types
export type { FormField, FormFieldOption, ValidationRule, ValidationResult, ValidationError } from '../types';

// Import all dependencies to resolve function calls
import {
  FormValidationEngine,
  PresetValidationSchemas,
  ValidationSchema
} from './FormValidationSystem';

import {
  FormFieldBuilder,
  FieldBuilder,
  PresetFields,
  FormLayout,
  ValidationHelpers
} from './FormFieldBuilder';

import { FormField, ValidationResult } from '../types';

// ======================================
// FORM SYSTEM UTILITIES
// ======================================

/**
 * Create a validation schema for a specific event type
 */
export function createValidationSchemaForEventType(eventType: string): ValidationSchema {
  switch (eventType.toLowerCase()) {
    case 'wedding':
      return PresetValidationSchemas.wedding();
    case 'conference':
    case 'seminar':
      return PresetValidationSchemas.conference();
    case 'birthday':
      return PresetValidationSchemas.birthday();
    default:
      return PresetValidationSchemas.generic();
  }
}

/**
 * Initialize form validation engine with event type
 */
export function createFormValidationEngine(eventType: string): FormValidationEngine {
  const schema = createValidationSchemaForEventType(eventType);
  return new FormValidationEngine(schema);
}

/**
 * Get preset form fields for event type
 */
export function getPresetFieldsForEventType(eventType: string): FormField[] {
  const baseFields = [
    PresetFields.eventName(),
    PresetFields.eventDate(),
    PresetFields.eventLocation(),
    PresetFields.description(),
    PresetFields.coverImage()
  ];

  switch (eventType.toLowerCase()) {
    case 'wedding':
      return [
        ...baseFields,
        ...PresetFields.brideGroom(),
        ...PresetFields.weddingVenue()
      ];
    
    case 'conference':
    case 'seminar':
      return [
        ...baseFields,
        ...PresetFields.conferenceFields()
      ];
    
    case 'birthday':
      return [
        ...baseFields,
        ...PresetFields.birthdayFields()
      ];
    
    default:
      return [
        ...baseFields,
        PresetFields.hostName(),
        PresetFields.hostPhone(),
        PresetFields.hostEmail()
      ];
  }
}

/**
 * Validate form data for specific event type
 */
export function validateEventFormData(
  eventType: string,
  formData: Record<string, any>,
  fields: FormField[]
): ValidationResult {
  const engine = createFormValidationEngine(eventType);
  return engine.validateForm(formData, fields, eventType);
}

/**
 * Create form layout with sections
 */
export function createSectionedFormLayout(eventType: string): FormField[] {
  const fields = getPresetFieldsForEventType(eventType);
  
  switch (eventType.toLowerCase()) {
    case 'wedding':
      return [
        ...FormLayout.section('Informasi Dasar', fields.slice(0, 5)),
        ...FormLayout.section('Mempelai', fields.slice(5, 7)),
        ...FormLayout.section('Lokasi', fields.slice(7, 9))
      ];
    
    case 'conference':
      return [
        ...FormLayout.section('Informasi Acara', fields.slice(0, 5)),
        ...FormLayout.section('Detail Konferensi', fields.slice(5))
      ];
    
    case 'birthday':
      return [
        ...FormLayout.section('Informasi Acara', fields.slice(0, 5)),
        ...FormLayout.section('Detail Ulang Tahun', fields.slice(5))
      ];
    
    default:
      return [
        ...FormLayout.section('Informasi Acara', fields.slice(0, 5)),
        ...FormLayout.section('Kontak Penyelenggara', fields.slice(5))
      ];
  }
}

/**
 * Form field utilities for common operations
 */
export const FormUtils = {
  // Check if field is visible based on conditional rules
  isFieldVisible(field: FormField, formData: Record<string, any>): boolean {
    if (!field.conditional) return true;
    
    const { field: conditionField, operator, value } = field.conditional;
    const conditionValue = formData[conditionField];
    
    switch (operator) {
      case 'equals':
        return conditionValue === value;
      case 'not_equals':
        return conditionValue !== value;
      case 'contains':
        return String(conditionValue || '').includes(String(value));
      case 'not_contains':
        return !String(conditionValue || '').includes(String(value));
      default:
        return true;
    }
  },

  // Get all visible fields for current form state
  getVisibleFields(fields: FormField[], formData: Record<string, any>): FormField[] {
    return fields.filter(field => this.isFieldVisible(field, formData));
  },

  // Extract form data for API submission
  extractApiData(formData: Record<string, any>, fields: FormField[]): Record<string, any> {
    const apiData: Record<string, any> = {};
    const visibleFields = this.getVisibleFields(fields, formData);
    
    visibleFields.forEach(field => {
      if (formData[field.id] !== undefined && formData[field.id] !== null) {
        apiData[field.id] = formData[field.id];
      }
    });
    
    return apiData;
  },

  // Generate form summary for preview
  generateFormSummary(formData: Record<string, any>, fields: FormField[]): Record<string, string> {
    const summary: Record<string, string> = {};
    const visibleFields = this.getVisibleFields(fields, formData);
    
    visibleFields.forEach(field => {
      const value = formData[field.id];
      if (value !== undefined && value !== null && value !== '') {
        if (field.type === 'checkbox') {
          summary[field.label] = value ? 'Ya' : 'Tidak';
        } else if (field.type === 'select' && field.options) {
          const option = field.options.find(opt => opt.value === value);
          summary[field.label] = option?.label || String(value);
        } else if (field.type === 'date') {
          const date = new Date(value);
          summary[field.label] = date.toLocaleDateString('id-ID');
        } else if (field.type === 'datetime') {
          const date = new Date(value);
          summary[field.label] = date.toLocaleString('id-ID');
        } else {
          summary[field.label] = String(value);
        }
      }
    });
    
    return summary;
  }
};

// Import components for default export
import { DynamicForm } from './DynamicForm';

export default {
  DynamicForm,
  FormFieldBuilder,
  FieldBuilder,
  PresetFields,
  FormLayout,
  ValidationHelpers,
  FormValidationEngine,
  PresetValidationSchemas,
  createValidationSchemaForEventType,
  createFormValidationEngine,
  getPresetFieldsForEventType,
  validateEventFormData,
  createSectionedFormLayout,
  FormUtils
};