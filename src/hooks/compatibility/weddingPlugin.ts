/**
 * WEDDING PLUGIN MAPPING
 * 
 * This file provides plugin mapping configuration for the Wedding event type
 * within the generic Event Management Engine architecture.
 * 
 * Created as part of PHASE 2 Frontend Component Transformation
 * Test-First Development (TFD) Implementation
 */

import type { EventPlugin } from '../useEventContent';

// Wedding-specific plugin configuration
export const weddingPlugin: EventPlugin = {
  name: 'Wedding Event Plugin',
  type: 'wedding',
  version: '1.0.0',
  config: {
    compatibility_mode: true,
    event_type: 'wedding',
    participant_roles: ['bride', 'groom', 'family'],
    ceremony_types: ['akad', 'resepsi', 'reception'],
    default_sections: [
      'hero',
      'couple_info',
      'love_story', 
      'event_details',
      'photo_gallery',
      'important_info',
      'gift_registry',
      'contact_info',
      'footer'
    ],
    supported_features: {
      countdown_timer: true,
      photo_gallery: true,
      rsvp_system: true,
      gift_registry: true,
      love_story_timeline: true,
      multiple_events: true,
      guest_book: true,
      live_streaming: true
    },
    ui_customization: {
      color_scheme: {
        primary: '#D4AF37',
        secondary: '#F5F5DC',
        accent: '#B8860B'
      },
      typography: {
        heading: 'serif',
        body: 'sans-serif'
      },
      layout_options: ['elegant', 'modern', 'classic', 'minimalist'],
      animation_effects: ['fade', 'slide', 'zoom', 'parallax']
    },
    database_mapping: {
      // Maps generic event tables to existing wedding tables
      event_participants: 'wedding_couple_info',
      participants: 'wedding_couple_info',
      event_stories: 'wedding_love_story',
      event_story: 'wedding_love_story',
      event_content: 'wedding_important_info',
      event_sections: 'wedding_sections',
      event_contact: 'wedding_contact_info',
      event_footer: 'wedding_footer_content',
      hero_settings: 'wedding_hero_settings'
    },
    field_mappings: {
      participants: {
        'participant_name': ['bride_name', 'groom_name'],
        'participant_full_name': ['bride_full_name', 'groom_full_name'],
        'participant_parents': ['bride_parents', 'groom_parents'],
        'participant_image_url': ['bride_image_url', 'groom_image_url'],
        'participant_role': ['bride', 'groom']
      },
      event_story: {
        'title': 'title',
        'full_story': 'full_story',
        'timeline_items': 'timeline_items'
      },
      hero_settings: {
        'primary_participants': ['groom_name', 'bride_name'],
        'event_date': 'wedding_date',
        'event_time': 'wedding_time',
        'primary_venue': 'ceremony_venue_name'
      }
    }
  }
};

// Plugin registry for different event types
export const eventPluginRegistry = {
  wedding: weddingPlugin,
  // Future plugins can be added here:
  // conference: conferencePlugin,
  // birthday: birthdayPlugin,
  // corporate: corporatePlugin
};

// Plugin utility functions
export const pluginUtils = {
  // Get plugin by event type
  getPlugin: (eventType: string): EventPlugin | null => {
    return eventPluginRegistry[eventType as keyof typeof eventPluginRegistry] || null;
  },

  // Check if event type is supported
  isEventTypeSupported: (eventType: string): boolean => {
    return eventType in eventPluginRegistry;
  },

  // Get all supported event types
  getSupportedEventTypes: (): string[] => {
    return Object.keys(eventPluginRegistry);
  },

  // Get plugin configuration
  getPluginConfig: (eventType: string): Record<string, any> | null => {
    const plugin = pluginUtils.getPlugin(eventType);
    return plugin ? plugin.config : null;
  },

  // Check if feature is supported by plugin
  isFeatureSupported: (eventType: string, feature: string): boolean => {
    const config = pluginUtils.getPluginConfig(eventType);
    return config?.supported_features?.[feature] === true;
  },

  // Get database table mapping
  getDatabaseMapping: (eventType: string): Record<string, string> | null => {
    const config = pluginUtils.getPluginConfig(eventType);
    return config?.database_mapping || null;
  },

  // Get field mappings for data transformation
  getFieldMappings: (eventType: string): Record<string, any> | null => {
    const config = pluginUtils.getPluginConfig(eventType);
    return config?.field_mappings || null;
  },

  // Transform field names based on plugin mapping
  transformFieldName: (eventType: string, table: string, genericField: string): string[] => {
    const fieldMappings = pluginUtils.getFieldMappings(eventType);
    const tableMapping = fieldMappings?.[table];
    
    if (!tableMapping || !tableMapping[genericField]) {
      return [genericField]; // Return original if no mapping found
    }

    const mapping = tableMapping[genericField];
    return Array.isArray(mapping) ? mapping : [mapping];
  },

  // Get UI customization options
  getUICustomization: (eventType: string): Record<string, any> | null => {
    const config = pluginUtils.getPluginConfig(eventType);
    return config?.ui_customization || null;
  }
};

// Wedding-specific utility functions
export const weddingPluginUtils = {
  // Get wedding ceremony types
  getCeremonyTypes: (): string[] => {
    return weddingPlugin.config.ceremony_types;
  },

  // Get wedding participant roles
  getParticipantRoles: (): string[] => {
    return weddingPlugin.config.participant_roles;
  },

  // Check if wedding feature is supported
  isWeddingFeatureSupported: (feature: string): boolean => {
    return weddingPlugin.config.supported_features[feature] === true;
  },

  // Get wedding default sections
  getDefaultSections: (): string[] => {
    return weddingPlugin.config.default_sections;
  },

  // Get wedding color scheme
  getWeddingColorScheme: (): Record<string, string> => {
    return weddingPlugin.config.ui_customization.color_scheme;
  },

  // Validate wedding data structure
  validateWeddingData: (data: any): boolean => {
    // Check for required wedding fields
    const requiredFields = ['bride_name', 'groom_name'];
    return requiredFields.every(field => 
      data && typeof data[field] === 'string' && data[field].length > 0
    );
  }
};

export default {
  weddingPlugin,
  eventPluginRegistry,
  pluginUtils,
  weddingPluginUtils
};