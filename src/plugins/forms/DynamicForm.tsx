/**
 * PHASE 3: Dynamic Form Builder System
 * Generic form builder that creates forms based on plugin field definitions
 * 
 * This system allows plugins to define custom form fields and validation rules,
 * providing a unified interface for different event types.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FormField, ValidationResult, ValidationError } from '../types';

// ======================================
// DYNAMIC FORM PROPS
// ======================================

export interface DynamicFormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>, isValid: boolean) => void;
  onValidate?: (data: Record<string, any>) => ValidationResult;
  className?: string;
  submitText?: string;
  showValidation?: boolean;
  disabled?: boolean;
}

// ======================================
// INDIVIDUAL FIELD COMPONENTS
// ======================================

export interface DynamicFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const DynamicField: React.FC<DynamicFieldProps> = ({ 
  field, 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = field.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    onChange(newValue);
  }, [field.type, onChange]);

  const fieldClassName = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            id={field.id}
            type={field.type}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            className={fieldClassName}
          />
        );

      case 'date':
        return (
          <input
            id={field.id}
            type="date"
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            disabled={disabled}
            className={fieldClassName}
          />
        );

      case 'datetime':
        return (
          <input
            id={field.id}
            type="datetime-local"
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            disabled={disabled}
            className={fieldClassName}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled}
            rows={4}
            className={fieldClassName}
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            disabled={disabled}
            className={fieldClassName}
          >
            <option value="">Pilih {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-3">
            <input
              id={field.id}
              type="checkbox"
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className="w-5 h-5 text-primary border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor={field.id} className="text-gray-700 cursor-pointer">
              {field.label}
            </label>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <input
              id={field.id}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Convert to base64 for preview (in real app, upload to storage)
                  const reader = new FileReader();
                  reader.onloadend = () => onChange(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
              disabled={disabled}
              className={fieldClassName}
            />
            {value && (
              <div className="mt-3">
                <img
                  src={value}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Unsupported field type: {field.type}
          </div>
        );
    }
  };

  return (
    <div className="form-field mb-6">
      {field.type !== 'checkbox' && (
        <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {field.helpText && (
        <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
};

// ======================================
// MAIN DYNAMIC FORM COMPONENT
// ======================================

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onValidate,
  className = '',
  submitText = 'Submit',
  showValidation = true,
  disabled = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when initial values change
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...initialValues }));
  }, [initialValues]);

  // Apply conditional field logic
  const getVisibleFields = useCallback(() => {
    return fields.filter(field => {
      if (!field.conditional) return true;
      
      const conditionValue = formData[field.conditional.field];
      switch (field.conditional.operator) {
        case 'equals':
          return conditionValue === field.conditional.value;
        case 'not_equals':
          return conditionValue !== field.conditional.value;
        case 'contains':
          return String(conditionValue || '').includes(String(field.conditional.value));
        case 'not_contains':
          return !String(conditionValue || '').includes(String(field.conditional.value));
        default:
          return true;
      }
    });
  }, [fields, formData]);

  // Field value change handler
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [errors]);

  // Form validation
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    const visibleFields = getVisibleFields();

    // Built-in validation
    visibleFields.forEach(field => {
      const value = formData[field.id];

      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[field.id] = `${field.label} wajib diisi`;
        return;
      }

      // Skip other validations if field is empty and not required
      if (!value) return;

      // Custom validation rules
      if (field.validation) {
        for (const rule of field.validation) {
          switch (rule.type) {
            case 'email':
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors[field.id] = rule.message;
                return;
              }
              break;
            case 'minLength':
              if (String(value).length < rule.value) {
                newErrors[field.id] = rule.message;
                return;
              }
              break;
            case 'maxLength':
              if (String(value).length > rule.value) {
                newErrors[field.id] = rule.message;
                return;
              }
              break;
            case 'pattern':
              if (!new RegExp(rule.value).test(String(value))) {
                newErrors[field.id] = rule.message;
                return;
              }
              break;
            case 'custom':
              if (rule.customValidator && !rule.customValidator(value)) {
                newErrors[field.id] = rule.message;
                return;
              }
              break;
          }
        }
      }
    });

    // Plugin-specific validation
    if (onValidate) {
      const customValidation = onValidate(formData);
      if (!customValidation.isValid) {
        customValidation.errors.forEach((error: ValidationError) => {
          newErrors[error.field] = error.message;
        });
      }
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [formData, getVisibleFields, onValidate]);

  // Form submission handler
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const validation = validateForm();
      setErrors(validation.errors);

      if (showValidation && !validation.isValid) {
        // Scroll to first error
        const firstErrorField = Object.keys(validation.errors)[0];
        const element = document.getElementById(firstErrorField);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      await onSubmit(formData, validation.isValid);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateForm, disabled, isSubmitting, showValidation]);

  const visibleFields = getVisibleFields();

  return (
    <form onSubmit={handleSubmit} className={`dynamic-form ${className}`}>
      <div className="form-fields space-y-6">
        {visibleFields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData[field.id] || field.defaultValue}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="form-actions pt-6 border-t border-gray-200">
        <Button
          type="submit"
          variant="premium"
          size="lg"
          disabled={disabled || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Menyimpan...
            </>
          ) : (
            submitText
          )}
        </Button>
      </div>
    </form>
  );
};

export default DynamicForm;