/**
 * PHASE 3: Plugin Architecture Foundation
 * Core plugin types and interfaces for Event Management Engine
 * 
 * This file defines the contract that all event plugins must implement
 * to ensure consistent behavior across different event types.
 */

import { ReactNode } from 'react';

// ======================================
// CORE PLUGIN INTERFACE
// ======================================

/**
 * Main plugin interface that all event plugins must implement
 */
export interface EventPlugin {
  // Plugin metadata
  type: string;                    // 'wedding', 'seminar', 'conference'
  name: string;                    // Display name
  version: string;                 // Plugin version
  description: string;             // Plugin description
  
  // Component renderers
  renderHero(data: EventData, config: any): ReactNode;
  renderParticipants(data: EventData, config: any): ReactNode;
  renderDetails(data: EventData, config: any): ReactNode;
  renderStory?(data: EventData, config: any): ReactNode;
  renderRegistration?(data: EventData, config: any): ReactNode;
  
  // Data schema and validation
  getDefaultSettings(): any;
  getFormFields(): FormField[];
  validateEventData(data: any): ValidationResult;
  
  // Lifecycle hooks
  onEventCreate?(data: EventData): Promise<void>;
  onEventUpdate?(data: EventData): Promise<void>;
  onEventDelete?(eventId: string): Promise<void>;
  
  // Theme configuration
  getAvailableThemes?(): ThemeConfig[];
  getDefaultTheme?(): string;
}

// ======================================
// EVENT DATA TYPES
// ======================================

/**
 * Generic event data structure
 */
export interface EventData {
  id: string;
  tenant_id: string;
  event_type: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Related data
  participants?: EventParticipant[];
  sections?: EventSection[];
  stories?: EventStory[];
  theme_settings?: any;
}

/**
 * Event participant structure
 */
export interface EventParticipant {
  id: string;
  event_id: string;
  participant_type: string;
  name: string;
  role?: string;
  bio?: string;
  image_url?: string;
  contact_info?: Record<string, any>;
  settings: Record<string, any>;
}

/**
 * Event section structure
 */
export interface EventSection {
  id: string;
  event_id: string;
  section_type: string;
  title: string;
  content: any;
  order_index: number;
  is_active: boolean;
  settings: Record<string, any>;
}

/**
 * Event story structure
 */
export interface EventStory {
  id: string;
  event_id: string;
  title: string;
  content: string;
  image_url?: string;
  order_index: number;
  is_active: boolean;
}

// ======================================
// FORM SYSTEM TYPES
// ======================================

/**
 * Dynamic form field definition
 */
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'datetime' | 'select' | 'textarea' | 'image' | 'checkbox' | 'number';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: ValidationRule[];
  options?: SelectOption[];        // for select fields
  defaultValue?: any;
  conditional?: ConditionalRule;   // show/hide based on other fields
  className?: string;              // CSS classes for styling
}

/**
 * Select field options
 */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Form field option alias for backward compatibility
 */
export type FormFieldOption = SelectOption;

/**
 * Validation rules for form fields
 */
export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

/**
 * Conditional field display rules
 */
export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: any;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

// ======================================
// THEME SYSTEM TYPES
// ======================================

/**
 * Theme configuration for events
 */
export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  preview_url?: string;
  
  // Color scheme
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text: string;
    muted?: string;
  };
  
  // Typography
  fonts: {
    heading: string;
    body: string;
  };
  
  // Layout
  layout: {
    container_width: string;
    spacing: string;
    border_radius: string;
  };
  
  // Custom CSS
  customStyles?: Record<string, any>;
}

// ======================================
// PLUGIN REGISTRY TYPES
// ======================================

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  plugin: EventPlugin;
  isActive: boolean;
  loadedAt: Date;
  dependencies?: string[];
}

/**
 * Plugin loader configuration
 */
export interface PluginLoaderConfig {
  autoLoad: boolean;
  lazyLoad: boolean;
  enableDevMode: boolean;
}

// ======================================
// HOOK TYPES
// ======================================

/**
 * Plugin hook return type
 */
export interface UsePluginResult {
  plugin: EventPlugin | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Plugin manager hook return type
 */
export interface UsePluginManagerResult {
  plugins: Record<string, EventPlugin>;
  activePlugins: EventPlugin[];
  loadPlugin: (type: string) => Promise<void>;
  unloadPlugin: (type: string) => void;
  isPluginActive: (type: string) => boolean;
}