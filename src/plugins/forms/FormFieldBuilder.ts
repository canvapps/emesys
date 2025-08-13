/**
 * PHASE 3: Form Field Builder Utilities
 * Utility functions to help plugins easily create form field definitions
 * 
 * This system provides a fluent API for building form fields with validation,
 * conditional logic, and various field types.
 */

import { FormField, FormFieldOption, ValidationRule } from '../types';

// ======================================
// FORM FIELD BUILDER CLASS
// ======================================

export class FormFieldBuilder {
  private field: Partial<FormField>;

  constructor(id: string, type: FormField['type']) {
    this.field = {
      id,
      type,
      required: false,
      validation: []
    };
  }

  // ======================================
  // BASIC FIELD PROPERTIES
  // ======================================

  label(label: string): this {
    this.field.label = label;
    return this;
  }

  placeholder(placeholder: string): this {
    this.field.placeholder = placeholder;
    return this;
  }

  helpText(helpText: string): this {
    this.field.helpText = helpText;
    return this;
  }

  defaultValue(value: any): this {
    this.field.defaultValue = value;
    return this;
  }

  required(required: boolean = true): this {
    this.field.required = required;
    return this;
  }

  // ======================================
  // SELECT FIELD OPTIONS
  // ======================================

  options(options: FormFieldOption[]): this {
    this.field.options = options;
    return this;
  }

  addOption(value: string, label: string): this {
    if (!this.field.options) {
      this.field.options = [];
    }
    this.field.options.push({ value, label });
    return this;
  }

  addOptions(options: Array<{value: string, label: string}>): this {
    if (!this.field.options) {
      this.field.options = [];
    }
    this.field.options.push(...options);
    return this;
  }

  // ======================================
  // CONDITIONAL LOGIC
  // ======================================

  showWhen(field: string, operator: 'equals' | 'not_equals' | 'contains' | 'not_contains', value: any): this {
    this.field.conditional = { field, operator, value };
    return this;
  }

  showWhenEquals(field: string, value: any): this {
    return this.showWhen(field, 'equals', value);
  }

  showWhenNotEquals(field: string, value: any): this {
    return this.showWhen(field, 'not_equals', value);
  }

  showWhenContains(field: string, value: any): this {
    return this.showWhen(field, 'contains', value);
  }

  // ======================================
  // VALIDATION RULES
  // ======================================

  private addValidation(rule: ValidationRule): this {
    if (!this.field.validation) {
      this.field.validation = [];
    }
    this.field.validation.push(rule);
    return this;
  }

  email(message: string = 'Format email tidak valid'): this {
    return this.addValidation({
      type: 'email',
      message
    });
  }

  minLength(length: number, message?: string): this {
    return this.addValidation({
      type: 'minLength',
      value: length,
      message: message || `Minimal ${length} karakter`
    });
  }

  maxLength(length: number, message?: string): this {
    return this.addValidation({
      type: 'maxLength',
      value: length,
      message: message || `Maksimal ${length} karakter`
    });
  }

  pattern(regex: string, message: string): this {
    return this.addValidation({
      type: 'pattern',
      value: regex,
      message
    });
  }

  custom(validator: (value: any) => boolean, message: string): this {
    return this.addValidation({
      type: 'custom',
      message,
      customValidator: validator
    });
  }

  // ======================================
  // BUILD FIELD
  // ======================================

  build(): FormField {
    if (!this.field.label) {
      throw new Error(`Field ${this.field.id} must have a label`);
    }
    return this.field as FormField;
  }
}

// ======================================
// STATIC FACTORY METHODS
// ======================================

export class FieldBuilder {
  static text(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'text');
  }

  static email(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'email').email();
  }

  static number(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'number');
  }

  static date(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'date');
  }

  static datetime(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'datetime');
  }

  static textarea(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'textarea');
  }

  static select(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'select');
  }

  static checkbox(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'checkbox');
  }

  static image(id: string): FormFieldBuilder {
    return new FormFieldBuilder(id, 'image');
  }
}

// ======================================
// PRESET FIELD COLLECTIONS
// ======================================

export class PresetFields {
  // Common event fields
  static eventName(): FormField {
    return FieldBuilder.text('eventName')
      .label('Nama Acara')
      .placeholder('Masukkan nama acara')
      .required()
      .minLength(3, 'Nama acara minimal 3 karakter')
      .maxLength(100, 'Nama acara maksimal 100 karakter')
      .build();
  }

  static eventDate(): FormField {
    return FieldBuilder.datetime('eventDate')
      .label('Tanggal & Waktu Acara')
      .required()
      .build();
  }

  static eventLocation(): FormField {
    return FieldBuilder.text('eventLocation')
      .label('Lokasi Acara')
      .placeholder('Masukkan alamat lokasi')
      .required()
      .minLength(5, 'Lokasi minimal 5 karakter')
      .build();
  }

  static description(): FormField {
    return FieldBuilder.textarea('description')
      .label('Deskripsi Acara')
      .placeholder('Jelaskan detail acara Anda')
      .helpText('Deskripsikan acara untuk memberikan informasi lebih kepada tamu')
      .maxLength(1000, 'Deskripsi maksimal 1000 karakter')
      .build();
  }

  static coverImage(): FormField {
    return FieldBuilder.image('coverImage')
      .label('Foto Cover')
      .helpText('Upload foto yang akan menjadi cover acara Anda')
      .build();
  }

  // Contact information fields
  static hostName(): FormField {
    return FieldBuilder.text('hostName')
      .label('Nama Penyelenggara')
      .placeholder('Masukkan nama penyelenggara')
      .required()
      .minLength(2, 'Nama penyelenggara minimal 2 karakter')
      .build();
  }

  static hostPhone(): FormField {
    return FieldBuilder.text('hostPhone')
      .label('Nomor Telepon')
      .placeholder('08xxxxxxxxxx')
      .pattern('^(08|\\+628)[0-9]{8,11}$', 'Format nomor telepon tidak valid')
      .build();
  }

  static hostEmail(): FormField {
    return FieldBuilder.email('hostEmail')
      .label('Email Penyelenggara')
      .placeholder('email@example.com')
      .build();
  }

  // Wedding-specific preset fields
  static brideGroom(): FormField[] {
    return [
      FieldBuilder.text('brideName')
        .label('Nama Mempelai Wanita')
        .placeholder('Masukkan nama mempelai wanita')
        .required()
        .build(),
      
      FieldBuilder.text('groomName')
        .label('Nama Mempelai Pria')
        .placeholder('Masukkan nama mempelai pria')
        .required()
        .build()
    ];
  }

  static weddingVenue(): FormField[] {
    return [
      FieldBuilder.text('ceremonyVenue')
        .label('Tempat Akad/Pemberkatan')
        .placeholder('Nama gedung/tempat akad')
        .required()
        .build(),
        
      FieldBuilder.text('receptionVenue')
        .label('Tempat Resepsi')
        .placeholder('Nama gedung/tempat resepsi')
        .showWhenNotEquals('ceremonyVenue', '')
        .build()
    ];
  }

  // Conference-specific preset fields
  static conferenceFields(): FormField[] {
    return [
      FieldBuilder.select('conferenceType')
        .label('Jenis Konferensi')
        .required()
        .addOption('academic', 'Akademik')
        .addOption('business', 'Bisnis')
        .addOption('technology', 'Teknologi')
        .addOption('medical', 'Medis')
        .addOption('other', 'Lainnya')
        .build(),

      FieldBuilder.text('maxParticipants')
        .label('Maksimal Peserta')
        .placeholder('100')
        .showWhenNotEquals('conferenceType', '')
        .build(),

      FieldBuilder.textarea('agenda')
        .label('Agenda Konferensi')
        .placeholder('Tuliskan agenda acara...')
        .showWhenNotEquals('conferenceType', '')
        .build()
    ];
  }

  // Birthday party preset fields
  static birthdayFields(): FormField[] {
    return [
      FieldBuilder.text('birthdayPerson')
        .label('Nama Yang Berulang Tahun')
        .placeholder('Masukkan nama')
        .required()
        .build(),

      FieldBuilder.number('age')
        .label('Usia')
        .placeholder('25')
        .custom((value) => value > 0 && value < 150, 'Usia harus antara 1-149 tahun')
        .build(),

      FieldBuilder.select('partyTheme')
        .label('Tema Pesta')
        .addOption('casual', 'Kasual')
        .addOption('formal', 'Formal')
        .addOption('costume', 'Kostum')
        .addOption('surprise', 'Surprise')
        .build()
    ];
  }
}

// ======================================
// FORM LAYOUT UTILITIES
// ======================================

export class FormLayout {
  static twoColumns(fields: FormField[]): FormField[] {
    return fields.map((field, index) => ({
      ...field,
      className: `${field.className || ''} ${index % 2 === 0 ? 'md:pr-3' : 'md:pl-3'} md:w-1/2 md:inline-block`.trim()
    }));
  }

  static threeColumns(fields: FormField[]): FormField[] {
    return fields.map((field, index) => ({
      ...field,
      className: `${field.className || ''} md:w-1/3 md:inline-block ${
        index % 3 === 1 ? 'md:px-2' : index % 3 === 2 ? 'md:pl-3' : 'md:pr-3'
      }`.trim()
    }));
  }

  static section(title: string, fields: FormField[]): FormField[] {
    const sectionHeader: FormField = {
      id: `section_${title.toLowerCase().replace(/\s+/g, '_')}`,
      type: 'text', // Dummy type, akan di-render khusus
      label: title,
      required: false,
      className: 'form-section-header',
      // @ts-ignore - custom property for section headers
      isSection: true
    };

    return [sectionHeader, ...fields];
  }
}

// ======================================
// VALIDATION HELPERS
// ======================================

export class ValidationHelpers {
  static requiredIf(targetField: string, condition: (value: any) => boolean) {
    return (formData: Record<string, any>) => {
      const targetValue = formData[targetField];
      if (condition(formData) && (!targetValue || String(targetValue).trim() === '')) {
        return false;
      }
      return true;
    };
  }

  static matchesField(fieldToMatch: string) {
    return (value: any, formData: Record<string, any>) => {
      return value === formData[fieldToMatch];
    };
  }

  static indonesianPhoneNumber(value: string): boolean {
    return /^(08|\+628)[0-9]{8,11}$/.test(value);
  }

  static strongPassword(value: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
  }

  static indonesianDate(value: string): boolean {
    // Support formats: DD/MM/YYYY, DD-MM-YYYY
    return /^(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[012])[\/\-](19|20)\d\d$/.test(value);
  }
}

export default FormFieldBuilder;