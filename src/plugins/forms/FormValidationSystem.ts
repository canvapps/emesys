/**
 * PHASE 3: Advanced Form Validation System
 * Comprehensive validation system with cross-field validation, 
 * async validation, and validation schemas for complex forms.
 */

import { FormField, ValidationResult, ValidationError } from '../types';

// ======================================
// VALIDATION CONTEXT
// ======================================

export interface ValidationContext {
  formData: Record<string, any>;
  field: FormField;
  allFields: FormField[];
  eventType: string;
}

export interface AsyncValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export type AsyncValidator = (
  value: any, 
  context: ValidationContext
) => Promise<AsyncValidationResult>;

// ======================================
// VALIDATION SCHEMA
// ======================================

export interface ValidationSchema {
  fields: Record<string, FieldValidationConfig>;
  crossFieldRules?: CrossFieldRule[];
  asyncValidators?: AsyncValidatorConfig[];
  warningRules?: WarningRule[];
}

export interface FieldValidationConfig {
  required?: boolean | ((context: ValidationContext) => boolean);
  customValidators?: CustomValidator[];
  dependsOn?: string[];
  validateOn?: 'change' | 'blur' | 'submit';
}

export interface CrossFieldRule {
  name: string;
  fields: string[];
  validator: (values: Record<string, any>, context: ValidationContext) => boolean;
  message: string;
  priority?: number;
}

export interface AsyncValidatorConfig {
  field: string;
  validator: AsyncValidator;
  debounceMs?: number;
  showProgress?: boolean;
}

export interface WarningRule {
  field: string;
  condition: (value: any, context: ValidationContext) => boolean;
  message: string;
}

export interface CustomValidator {
  name: string;
  validator: (value: any, context: ValidationContext) => boolean;
  message: string;
  priority?: number;
}

// ======================================
// VALIDATION ENGINE
// ======================================

export class FormValidationEngine {
  private schema: ValidationSchema;
  private asyncValidationCache = new Map<string, AsyncValidationResult>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  // ======================================
  // SYNC VALIDATION
  // ======================================

  validateField(
    fieldId: string,
    value: any,
    formData: Record<string, any>,
    allFields: FormField[],
    eventType: string
  ): ValidationResult {
    const field = allFields.find(f => f.id === fieldId);
    if (!field) {
      return { isValid: false, errors: [{ field: fieldId, message: 'Field tidak ditemukan' }] };
    }

    const context: ValidationContext = { formData, field, allFields, eventType };
    const errors: ValidationError[] = [];
    const fieldConfig = this.schema.fields[fieldId] || {};

    // Required validation
    if (this.isFieldRequired(fieldConfig, context)) {
      if (this.isEmpty(value)) {
        errors.push({ field: fieldId, message: `${field.label} wajib diisi` });
        return { isValid: false, errors };
      }
    }

    // Skip other validations if empty and not required
    if (this.isEmpty(value)) {
      return { isValid: true, errors: [] };
    }

    // Built-in field validation
    const builtInErrors = this.validateBuiltInRules(field, value, context);
    errors.push(...builtInErrors);

    // Custom validators
    if (fieldConfig.customValidators) {
      const customErrors = this.validateCustomRules(fieldConfig.customValidators, value, context);
      errors.push(...customErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateForm(
    formData: Record<string, any>,
    allFields: FormField[],
    eventType: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const context: ValidationContext = { formData, field: allFields[0], allFields, eventType };

    // Validate individual fields
    for (const field of allFields) {
      const fieldResult = this.validateField(
        field.id,
        formData[field.id],
        formData,
        allFields,
        eventType
      );
      errors.push(...fieldResult.errors);
    }

    // Cross-field validation
    if (this.schema.crossFieldRules) {
      const crossFieldErrors = this.validateCrossFieldRules(formData, context);
      errors.push(...crossFieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ======================================
  // ASYNC VALIDATION
  // ======================================

  async validateFieldAsync(
    fieldId: string,
    value: any,
    formData: Record<string, any>,
    allFields: FormField[],
    eventType: string
  ): Promise<AsyncValidationResult> {
    const asyncConfig = this.schema.asyncValidators?.find(av => av.field === fieldId);
    if (!asyncConfig) {
      return { isValid: true };
    }

    const cacheKey = `${fieldId}:${JSON.stringify(value)}`;
    
    // Return cached result if available
    if (this.asyncValidationCache.has(cacheKey)) {
      return this.asyncValidationCache.get(cacheKey)!;
    }

    const field = allFields.find(f => f.id === fieldId)!;
    const context: ValidationContext = { formData, field, allFields, eventType };

    try {
      const result = await asyncConfig.validator(value, context);
      
      // Cache the result
      this.asyncValidationCache.set(cacheKey, result);
      
      // Clear cache after 5 minutes
      setTimeout(() => {
        this.asyncValidationCache.delete(cacheKey);
      }, 5 * 60 * 1000);

      return result;
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  validateFieldAsyncDebounced(
    fieldId: string,
    value: any,
    formData: Record<string, any>,
    allFields: FormField[],
    eventType: string,
    callback: (result: AsyncValidationResult) => void
  ): void {
    const asyncConfig = this.schema.asyncValidators?.find(av => av.field === fieldId);
    const debounceMs = asyncConfig?.debounceMs || 500;

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(fieldId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const result = await this.validateFieldAsync(fieldId, value, formData, allFields, eventType);
      callback(result);
      this.debounceTimers.delete(fieldId);
    }, debounceMs);

    this.debounceTimers.set(fieldId, timer);
  }

  // ======================================
  // WARNING SYSTEM
  // ======================================

  getFieldWarnings(
    fieldId: string,
    value: any,
    formData: Record<string, any>,
    allFields: FormField[],
    eventType: string
  ): string[] {
    const warnings: string[] = [];
    const field = allFields.find(f => f.id === fieldId);
    if (!field) return warnings;

    const context: ValidationContext = { formData, field, allFields, eventType };

    // Check warning rules
    const warningRules = this.schema.warningRules?.filter(wr => wr.field === fieldId) || [];
    for (const rule of warningRules) {
      if (rule.condition(value, context)) {
        warnings.push(rule.message);
      }
    }

    return warnings;
  }

  // ======================================
  // PRIVATE VALIDATION HELPERS
  // ======================================

  private isFieldRequired(config: FieldValidationConfig, context: ValidationContext): boolean {
    if (typeof config.required === 'function') {
      return config.required(context);
    }
    return config.required || context.field.required;
  }

  private isEmpty(value: any): boolean {
    return value === null || 
           value === undefined || 
           (typeof value === 'string' && value.trim() === '') ||
           (Array.isArray(value) && value.length === 0);
  }

  private validateBuiltInRules(
    field: FormField, 
    value: any, 
    context: ValidationContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!field.validation) return errors;

    for (const rule of field.validation) {
      let isValid = true;
      let message = rule.message;

      switch (rule.type) {
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
          break;

        case 'minLength':
          isValid = String(value).length >= (rule.value || 0);
          break;

        case 'maxLength':
          isValid = String(value).length <= (rule.value || Infinity);
          break;

        case 'pattern':
          isValid = new RegExp(rule.value).test(String(value));
          break;

        case 'custom':
          if (rule.customValidator) {
            isValid = rule.customValidator(value);
          }
          break;
      }

      if (!isValid) {
        errors.push({ field: field.id, message });
      }
    }

    return errors;
  }

  private validateCustomRules(
    validators: CustomValidator[],
    value: any,
    context: ValidationContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Sort by priority (higher priority first)
    const sortedValidators = [...validators].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const validator of sortedValidators) {
      if (!validator.validator(value, context)) {
        errors.push({ field: context.field.id, message: validator.message });
        // Stop on first error for each field
        break;
      }
    }

    return errors;
  }

  private validateCrossFieldRules(
    formData: Record<string, any>,
    context: ValidationContext
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!this.schema.crossFieldRules) return errors;

    // Sort by priority (higher priority first)
    const sortedRules = [...this.schema.crossFieldRules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    for (const rule of sortedRules) {
      const fieldValues = rule.fields.reduce((acc, fieldId) => {
        acc[fieldId] = formData[fieldId];
        return acc;
      }, {} as Record<string, any>);

      if (!rule.validator(fieldValues, context)) {
        // Add error to all involved fields
        for (const fieldId of rule.fields) {
          errors.push({ field: fieldId, message: rule.message });
        }
      }
    }

    return errors;
  }
}

// ======================================
// PRESET VALIDATION SCHEMAS
// ======================================

export class PresetValidationSchemas {
  // Wedding event validation schema
  static wedding(): ValidationSchema {
    return {
      fields: {
        brideName: {
          required: true,
          customValidators: [
            {
              name: 'minLength',
              validator: (value: string) => value && value.length >= 2,
              message: 'Nama mempelai wanita minimal 2 karakter'
            }
          ]
        },
        groomName: {
          required: true,
          customValidators: [
            {
              name: 'minLength',
              validator: (value: string) => value && value.length >= 2,
              message: 'Nama mempelai pria minimal 2 karakter'
            }
          ]
        },
        weddingDate: {
          required: true,
          customValidators: [
            {
              name: 'futureDate',
              validator: (value: string) => {
                if (!value) return false;
                return new Date(value) > new Date();
              },
              message: 'Tanggal pernikahan harus di masa depan'
            }
          ]
        }
      },
      crossFieldRules: [
        {
          name: 'differentNames',
          fields: ['brideName', 'groomName'],
          validator: (values: Record<string, any>) => {
            return values.brideName !== values.groomName;
          },
          message: 'Nama mempelai wanita dan pria tidak boleh sama'
        }
      ],
      warningRules: [
        {
          field: 'weddingDate',
          condition: (value: string) => {
            if (!value) return false;
            const weddingDate = new Date(value);
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            return weddingDate < oneMonthFromNow;
          },
          message: 'Pernikahan kurang dari sebulan lagi. Pastikan semua persiapan sudah selesai.'
        }
      ]
    };
  }

  // Conference event validation schema
  static conference(): ValidationSchema {
    return {
      fields: {
        conferenceName: {
          required: true,
          customValidators: [
            {
              name: 'minLength',
              validator: (value: string) => value && value.length >= 5,
              message: 'Nama konferensi minimal 5 karakter'
            }
          ]
        },
        maxParticipants: {
          required: true,
          customValidators: [
            {
              name: 'positiveNumber',
              validator: (value: any) => {
                const num = parseInt(String(value));
                return !isNaN(num) && num > 0 && num <= 10000;
              },
              message: 'Maksimal peserta harus antara 1-10.000'
            }
          ]
        }
      },
      warningRules: [
        {
          field: 'maxParticipants',
          condition: (value: any) => {
            const num = parseInt(String(value));
            return !isNaN(num) && num > 1000;
          },
          message: 'Konferensi dengan lebih dari 1000 peserta memerlukan persiapan khusus.'
        }
      ]
    };
  }

  // Birthday event validation schema
  static birthday(): ValidationSchema {
    return {
      fields: {
        birthdayPerson: {
          required: true,
          customValidators: [
            {
              name: 'minLength',
              validator: (value: string) => value && value.length >= 2,
              message: 'Nama minimal 2 karakter'
            }
          ]
        },
        age: {
          customValidators: [
            {
              name: 'validAge',
              validator: (value: any) => {
                if (!value) return true; // Optional field
                const age = parseInt(String(value));
                return !isNaN(age) && age > 0 && age < 150;
              },
              message: 'Usia harus antara 1-149 tahun'
            }
          ]
        }
      },
      warningRules: [
        {
          field: 'age',
          condition: (value: any) => {
            const age = parseInt(String(value));
            return !isNaN(age) && age >= 100;
          },
          message: 'Ulang tahun abad! Pastikan untuk merencanakan perayaan yang istimewa.'
        }
      ]
    };
  }

  // Generic event validation schema
  static generic(): ValidationSchema {
    return {
      fields: {
        eventName: {
          required: true,
          customValidators: [
            {
              name: 'minLength',
              validator: (value: string) => value && value.length >= 3,
              message: 'Nama acara minimal 3 karakter'
            },
            {
              name: 'maxLength',
              validator: (value: string) => !value || value.length <= 100,
              message: 'Nama acara maksimal 100 karakter'
            }
          ]
        },
        eventDate: {
          required: true,
          customValidators: [
            {
              name: 'validDate',
              validator: (value: string) => {
                if (!value) return false;
                const date = new Date(value);
                return !isNaN(date.getTime());
              },
              message: 'Format tanggal tidak valid'
            }
          ]
        },
        eventLocation: {
          required: true,
          customValidators: [
            {
              name: 'minLength',
              validator: (value: string) => value && value.length >= 5,
              message: 'Lokasi acara minimal 5 karakter'
            }
          ]
        }
      }
    };
  }
}

export default FormValidationEngine;