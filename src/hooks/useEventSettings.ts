import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ================================================================================================
// EVENT SETTINGS HOOK - GENERIC EVENT MANAGEMENT ENGINE
// ================================================================================================
// This hook manages event-specific settings using generic storage approach
// Part of Phase 2.3 Hook Transformation (TFD Implementation)
// Supports all event types: wedding, conference, birthday, seminar, etc.
// ================================================================================================

export interface EventSetting {
  id: string;
  event_id: string;
  tenant_id: string;
  setting_category: 'general' | 'appearance' | 'features' | 'integrations' | 'privacy' | 'custom';
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  is_public: boolean;
  is_required: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EventSettingsGroup {
  general: Record<string, any>;
  appearance: Record<string, any>;
  features: Record<string, any>;
  integrations: Record<string, any>;
  privacy: Record<string, any>;
  custom: Record<string, any>;
}

export interface WeddingSettings {
  // General Wedding Settings
  couple_names?: string;
  wedding_date?: string;
  wedding_location?: string;
  wedding_theme?: string;
  
  // RSVP Settings
  rsvp_enabled?: boolean;
  rsvp_deadline?: string;
  rsvp_confirmation_message?: string;
  
  // Guest Features
  guest_book_enabled?: boolean;
  photo_upload_enabled?: boolean;
  livestream_enabled?: boolean;
  livestream_url?: string;
  
  // Contact Settings
  contact_whatsapp?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Download Settings
  download_invitation_enabled?: boolean;
  invitation_pdf_url?: string;
  
  // Social Features
  hashtag?: string;
  social_sharing_enabled?: boolean;
}

export interface ConferenceSettings {
  // General Conference Settings
  conference_name?: string;
  conference_date?: string;
  conference_venue?: string;
  conference_theme?: string;
  
  // Registration Settings
  registration_enabled?: boolean;
  registration_deadline?: string;
  max_participants?: number;
  
  // Features
  networking_enabled?: boolean;
  q_and_a_enabled?: boolean;
  feedback_enabled?: boolean;
  certificates_enabled?: boolean;
  
  // Streaming
  live_streaming?: boolean;
  stream_url?: string;
  recording_enabled?: boolean;
  
  // Networking
  attendee_directory?: boolean;
  chat_enabled?: boolean;
  breakout_rooms?: boolean;
}

export interface UseEventSettingsOptions {
  eventId?: string;
  eventType?: string;
  autoLoad?: boolean;
  categories?: string[];
}

export interface UseEventSettingsReturn {
  // Data
  settings: EventSetting[];
  settingsByCategory: EventSettingsGroup;
  allSettings: Record<string, any>;
  
  // Event-specific convenience data
  weddingSettings: WeddingSettings;
  conferenceSettings: ConferenceSettings;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: (eventId: string, categories?: string[]) => Promise<void>;
  getSetting: (key: string, defaultValue?: any) => any;
  setSetting: (key: string, value: any, category?: string) => Promise<boolean>;
  updateSettings: (settings: Record<string, any>) => Promise<boolean>;
  deleteSetting: (key: string) => Promise<boolean>;
  
  // Bulk operations
  bulkUpdateSettings: (settings: Array<{key: string, value: any, category?: string}>) => Promise<number>;
  resetToDefaults: (eventType: string) => Promise<boolean>;
  exportSettings: () => Record<string, any>;
  importSettings: (settings: Record<string, any>) => Promise<number>;
  
  // Category operations
  getSettingsByCategory: (category: string) => Record<string, any>;
  updateCategory: (category: string, settings: Record<string, any>) => Promise<boolean>;
  
  // Type-specific operations
  initializeWeddingSettings: (weddingData: Partial<WeddingSettings>) => Promise<boolean>;
  updateWeddingSettings: (updates: Partial<WeddingSettings>) => Promise<boolean>;
  initializeConferenceSettings: (conferenceData: Partial<ConferenceSettings>) => Promise<boolean>;
  updateConferenceSettings: (updates: Partial<ConferenceSettings>) => Promise<boolean>;
  
  // Validation and schema
  validateSetting: (key: string, value: any) => boolean;
  getSettingSchema: (key: string) => any;
  
  // Stats
  totalSettings: number;
  settingsCount: Record<string, number>;
  requiredSettings: string[];
  missingRequiredSettings: string[];
}

export const useEventSettings = (options: UseEventSettingsOptions = {}): UseEventSettingsReturn => {
  const { 
    eventId,
    eventType = 'generic',
    autoLoad = true,
    categories = []
  } = options;

  // ================================================================================================
  // STATE MANAGEMENT
  // ================================================================================================
  
  const [settings, setSettings] = useState<EventSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================================================================================================
  // COMPUTED VALUES
  // ================================================================================================
  
  // Group settings by category
  const settingsByCategory: EventSettingsGroup = settings.reduce((acc, setting) => {
    if (!acc[setting.setting_category]) {
      acc[setting.setting_category] = {};
    }
    acc[setting.setting_category][setting.setting_key] = setting.setting_value;
    return acc;
  }, {
    general: {},
    appearance: {},
    features: {},
    integrations: {},
    privacy: {},
    custom: {}
  });

  // All settings as flat object
  const allSettings = settings.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {} as Record<string, any>);

  // Wedding-specific settings
  const weddingSettings: WeddingSettings = {
    couple_names: allSettings.couple_names,
    wedding_date: allSettings.wedding_date,
    wedding_location: allSettings.wedding_location,
    wedding_theme: allSettings.wedding_theme,
    rsvp_enabled: allSettings.rsvp_enabled,
    rsvp_deadline: allSettings.rsvp_deadline,
    rsvp_confirmation_message: allSettings.rsvp_confirmation_message,
    guest_book_enabled: allSettings.guest_book_enabled,
    photo_upload_enabled: allSettings.photo_upload_enabled,
    livestream_enabled: allSettings.livestream_enabled,
    livestream_url: allSettings.livestream_url,
    contact_whatsapp: allSettings.contact_whatsapp,
    contact_email: allSettings.contact_email,
    contact_phone: allSettings.contact_phone,
    download_invitation_enabled: allSettings.download_invitation_enabled,
    invitation_pdf_url: allSettings.invitation_pdf_url,
    hashtag: allSettings.hashtag,
    social_sharing_enabled: allSettings.social_sharing_enabled
  };

  // Conference-specific settings
  const conferenceSettings: ConferenceSettings = {
    conference_name: allSettings.conference_name,
    conference_date: allSettings.conference_date,
    conference_venue: allSettings.conference_venue,
    conference_theme: allSettings.conference_theme,
    registration_enabled: allSettings.registration_enabled,
    registration_deadline: allSettings.registration_deadline,
    max_participants: allSettings.max_participants,
    networking_enabled: allSettings.networking_enabled,
    q_and_a_enabled: allSettings.q_and_a_enabled,
    feedback_enabled: allSettings.feedback_enabled,
    certificates_enabled: allSettings.certificates_enabled,
    live_streaming: allSettings.live_streaming,
    stream_url: allSettings.stream_url,
    recording_enabled: allSettings.recording_enabled,
    attendee_directory: allSettings.attendee_directory,
    chat_enabled: allSettings.chat_enabled,
    breakout_rooms: allSettings.breakout_rooms
  };

  // Stats
  const totalSettings = settings.length;
  const settingsCount = settings.reduce((acc, setting) => {
    acc[setting.setting_category] = (acc[setting.setting_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const requiredSettings = settings
    .filter(s => s.is_required)
    .map(s => s.setting_key);
  
  const missingRequiredSettings = requiredSettings.filter(key =>
    !allSettings[key] || allSettings[key] === null || allSettings[key] === undefined
  );

  // ================================================================================================
  // CORE DATA OPERATIONS
  // ================================================================================================
  
  const loadSettings = async (targetEventId: string, targetCategories: string[] = []) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - in real implementation, this would load from database
      const mockSettings: EventSetting[] = [
        {
          id: '1',
          event_id: targetEventId,
          tenant_id: 'default-tenant',
          setting_category: 'general',
          setting_key: 'event_name',
          setting_value: 'My Wedding',
          setting_type: 'string',
          is_public: true,
          is_required: true,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          event_id: targetEventId,
          tenant_id: 'default-tenant',
          setting_category: 'features',
          setting_key: 'rsvp_enabled',
          setting_value: true,
          setting_type: 'boolean',
          is_public: false,
          is_required: false,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // Apply category filter if specified
      let filteredSettings = mockSettings;
      if (targetCategories.length > 0) {
        filteredSettings = mockSettings.filter(s =>
          targetCategories.includes(s.setting_category)
        );
      }
      
      setSettings(filteredSettings);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue: any = null): any => {
    return allSettings[key] ?? defaultValue;
  };

  const setSetting = async (key: string, value: any, category: string = 'custom'): Promise<boolean> => {
    try {
      const newSetting: EventSetting = {
        id: crypto.randomUUID(),
        event_id: eventId || '',
        tenant_id: 'default-tenant',
        setting_category: category as any,
        setting_key: key,
        setting_value: value,
        setting_type: typeof value as any,
        is_public: true,
        is_required: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update or add setting
      setSettings(prev => {
        const existingIndex = prev.findIndex(s => s.setting_key === key);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], setting_value: value, updated_at: new Date().toISOString() };
          return updated;
        } else {
          return [...prev, newSetting];
        }
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set setting';
      setError(errorMessage);
      console.error('Error setting value:', err);
      return false;
    }
  };

  const updateSettings = async (settingsUpdate: Record<string, any>): Promise<boolean> => {
    try {
      let success = true;
      
      for (const [key, value] of Object.entries(settingsUpdate)) {
        const result = await setSetting(key, value);
        if (!result) success = false;
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      console.error('Error updating settings:', err);
      return false;
    }
  };

  const deleteSetting = async (key: string): Promise<boolean> => {
    try {
      setSettings(prev => prev.filter(s => s.setting_key !== key));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete setting';
      setError(errorMessage);
      console.error('Error deleting setting:', err);
      return false;
    }
  };

  // ================================================================================================
  // BULK OPERATIONS
  // ================================================================================================
  
  const bulkUpdateSettings = async (settingsUpdates: Array<{key: string, value: any, category?: string}>): Promise<number> => {
    try {
      let successCount = 0;
      
      for (const update of settingsUpdates) {
        const success = await setSetting(update.key, update.value, update.category);
        if (success) successCount++;
      }
      
      return successCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update settings';
      setError(errorMessage);
      console.error('Error bulk updating settings:', err);
      return 0;
    }
  };

  const resetToDefaults = async (targetEventType: string): Promise<boolean> => {
    try {
      // Define default settings by event type
      const defaultSettings: Record<string, Record<string, any>> = {
        wedding: {
          rsvp_enabled: true,
          guest_book_enabled: true,
          social_sharing_enabled: true,
          download_invitation_enabled: true,
          hashtag: '#OurWedding'
        },
        conference: {
          registration_enabled: true,
          networking_enabled: true,
          q_and_a_enabled: true,
          feedback_enabled: true,
          live_streaming: false
        }
      };
      
      const defaults = defaultSettings[targetEventType] || {};
      return await updateSettings(defaults);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      console.error('Error resetting settings:', err);
      return false;
    }
  };

  const exportSettings = (): Record<string, any> => {
    return allSettings;
  };

  const importSettings = async (importedSettings: Record<string, any>): Promise<number> => {
    try {
      return await bulkUpdateSettings(
        Object.entries(importedSettings).map(([key, value]) => ({ key, value }))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import settings';
      setError(errorMessage);
      console.error('Error importing settings:', err);
      return 0;
    }
  };

  // ================================================================================================
  // CATEGORY OPERATIONS
  // ================================================================================================
  
  const getSettingsByCategory = (category: string): Record<string, any> => {
    return settingsByCategory[category] || {};
  };

  const updateCategory = async (category: string, categorySettings: Record<string, any>): Promise<boolean> => {
    try {
      const updates = Object.entries(categorySettings).map(([key, value]) => ({
        key, value, category
      }));
      
      const successCount = await bulkUpdateSettings(updates);
      return successCount === updates.length;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
      console.error('Error updating category:', err);
      return false;
    }
  };

  // ================================================================================================
  // TYPE-SPECIFIC OPERATIONS
  // ================================================================================================
  
  const initializeWeddingSettings = async (weddingData: Partial<WeddingSettings>): Promise<boolean> => {
    const weddingDefaults = {
      rsvp_enabled: true,
      guest_book_enabled: true,
      social_sharing_enabled: true,
      download_invitation_enabled: false,
      livestream_enabled: false,
      photo_upload_enabled: true,
      ...weddingData
    };
    
    return await updateSettings(weddingDefaults);
  };

  const updateWeddingSettings = async (updates: Partial<WeddingSettings>): Promise<boolean> => {
    return await updateSettings(updates);
  };

  const initializeConferenceSettings = async (conferenceData: Partial<ConferenceSettings>): Promise<boolean> => {
    const conferenceDefaults = {
      registration_enabled: true,
      networking_enabled: true,
      q_and_a_enabled: true,
      feedback_enabled: true,
      certificates_enabled: false,
      live_streaming: false,
      recording_enabled: false,
      attendee_directory: true,
      chat_enabled: true,
      breakout_rooms: false,
      ...conferenceData
    };
    
    return await updateSettings(conferenceDefaults);
  };

  const updateConferenceSettings = async (updates: Partial<ConferenceSettings>): Promise<boolean> => {
    return await updateSettings(updates);
  };

  // ================================================================================================
  // VALIDATION AND SCHEMA
  // ================================================================================================
  
  const validateSetting = (key: string, value: any): boolean => {
    // Basic validation - can be extended with schema validation
    const setting = settings.find(s => s.setting_key === key);
    if (!setting) return true; // Allow new settings
    
    // Type validation
    const expectedType = setting.setting_type;
    const actualType = typeof value;
    
    if (expectedType === 'json' && typeof value === 'object') return true;
    if (expectedType === 'array' && Array.isArray(value)) return true;
    
    return expectedType === actualType;
  };

  const getSettingSchema = (key: string): any => {
    const setting = settings.find(s => s.setting_key === key);
    if (!setting) return null;
    
    return {
      type: setting.setting_type,
      required: setting.is_required,
      public: setting.is_public,
      category: setting.setting_category,
      metadata: setting.metadata
    };
  };

  // ================================================================================================
  // EFFECTS
  // ================================================================================================
  
  useEffect(() => {
    if (autoLoad && eventId) {
      loadSettings(eventId, categories);
    }
  }, [eventId, autoLoad, JSON.stringify(categories)]);

  // ================================================================================================
  // RETURN HOOK INTERFACE
  // ================================================================================================
  
  return {
    // Data
    settings,
    settingsByCategory,
    allSettings,
    
    // Event-specific convenience data
    weddingSettings,
    conferenceSettings,
    
    // State
    loading,
    error,
    
    // Actions
    loadSettings,
    getSetting,
    setSetting,
    updateSettings,
    deleteSetting,
    
    // Bulk operations
    bulkUpdateSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    
    // Category operations
    getSettingsByCategory,
    updateCategory,
    
    // Type-specific operations
    initializeWeddingSettings,
    updateWeddingSettings,
    initializeConferenceSettings,
    updateConferenceSettings,
    
    // Validation and schema
    validateSetting,
    getSettingSchema,
    
    // Stats
    totalSettings,
    settingsCount,
    requiredSettings,
    missingRequiredSettings
  };
};

// ================================================================================================
// LEGACY COMPATIBILITY LAYER
// ================================================================================================

// Wedding-specific hook that uses the generic event settings hook
export const useWeddingSettings = (eventId?: string) => {
  return useEventSettings({
    eventId,
    eventType: 'wedding',
    categories: ['general', 'features', 'appearance']
  });
};

// Conference-specific hook for settings management
export const useConferenceSettings = (eventId?: string) => {
  return useEventSettings({
    eventId,
    eventType: 'conference',
    categories: ['general', 'features', 'integrations']
  });
};

export default useEventSettings;