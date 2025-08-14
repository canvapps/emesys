/**
 * BACKWARD COMPATIBILITY WRAPPER: useWeddingHero Hook
 * 
 * This hook provides backward compatibility for wedding-specific components
 * by wrapping the generic useEventHero hook and transforming data to wedding format.
 * 
 * Part of PHASE 2 TFD Implementation - Tactical File Completion
 */

import { useState, useEffect } from 'react';
import { useEventHero, type EventHeroSettings } from './useEventHero';
import { useToast } from './use-toast';

// Legacy Wedding Hero Types for backward compatibility
export interface WeddingHeroSettings {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  wedding_time: string;
  ceremony_venue_name: string;
  ceremony_venue_address: string;
  reception_venue_name?: string;
  reception_venue_address?: string;
  hero_subtitle: string;
  hero_description: string;
  hero_background_image?: string;
  countdown_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Wedding Hero Hook - Backward Compatibility Wrapper
 * Wraps useEventHero and transforms generic data to wedding-specific format
 */
export const useWeddingHero = () => {
  const eventHeroData = useEventHero('wedding');
  const {
    settings: eventSettings,
    isLoading,
    error,
    updateSettings: updateEventSettings,
    refreshSettings,
    eventType,
    isCompatibilityMode
  } = eventHeroData;
  
  const [settings, setSettings] = useState<WeddingHeroSettings | null>(null);
  const { toast } = useToast();

  // Transform generic EventHeroSettings to legacy WeddingHeroSettings format
  const transformToWeddingHero = (eventData: EventHeroSettings | null): WeddingHeroSettings | null => {
    if (!eventData) return null;

    return {
      id: eventData.id,
      groom_name: eventData.primary_participants?.[0] || '',
      bride_name: eventData.primary_participants?.[1] || '',
      wedding_date: eventData.event_date || '',
      wedding_time: eventData.event_time || '',
      ceremony_venue_name: eventData.primary_venue?.name || '',
      ceremony_venue_address: eventData.primary_venue?.address || '',
      reception_venue_name: eventData.secondary_venue?.name || '',
      reception_venue_address: eventData.secondary_venue?.address || '',
      hero_subtitle: eventData.hero_content?.subtitle || '',
      hero_description: eventData.hero_content?.description || '',
      hero_background_image: eventData.hero_content?.background_image || '',
      countdown_enabled: eventData.countdown_enabled || false,
      is_active: eventData.is_active || false,
      created_at: eventData.created_at || '',
      updated_at: eventData.updated_at || ''
    };
  };

  // Transform legacy WeddingHeroSettings to generic EventHeroSettings format  
  const transformFromWeddingHero = (weddingData: Partial<WeddingHeroSettings>): Partial<EventHeroSettings> => {
    const updates: Partial<EventHeroSettings> = {};

    // Map participants
    if (weddingData.groom_name || weddingData.bride_name) {
      updates.primary_participants = [
        weddingData.groom_name || '',
        weddingData.bride_name || ''
      ];
    }

    // Map date and time
    if (weddingData.wedding_date) {
      updates.event_date = weddingData.wedding_date;
    }
    if (weddingData.wedding_time) {
      updates.event_time = weddingData.wedding_time;
    }

    // Map venues
    if (weddingData.ceremony_venue_name || weddingData.ceremony_venue_address) {
      updates.primary_venue = {
        name: weddingData.ceremony_venue_name || '',
        address: weddingData.ceremony_venue_address || ''
      };
    }
    if (weddingData.reception_venue_name || weddingData.reception_venue_address) {
      updates.secondary_venue = {
        name: weddingData.reception_venue_name || '',
        address: weddingData.reception_venue_address || ''
      };
    }

    // Map hero content
    if (weddingData.hero_subtitle || weddingData.hero_description || weddingData.hero_background_image !== undefined) {
      updates.hero_content = {
        subtitle: weddingData.hero_subtitle || '',
        description: weddingData.hero_description || '',
        background_image: weddingData.hero_background_image
      };
    }

    // Map other properties
    if (weddingData.countdown_enabled !== undefined) {
      updates.countdown_enabled = weddingData.countdown_enabled;
    }
    if (weddingData.is_active !== undefined) {
      updates.is_active = weddingData.is_active;
    }

    return updates;
  };

  // Update wedding hero settings
  const updateSettings = async (updates: Partial<WeddingHeroSettings>) => {
    try {
      const transformedUpdates = transformFromWeddingHero(updates);
      await updateEventSettings(transformedUpdates);
      
      // Refresh local wedding settings after update
      if (eventSettings) {
        const updatedWeddingSettings = transformToWeddingHero(eventSettings);
        setSettings(updatedWeddingSettings);
      }
      
      toast({
        title: "Success",
        description: "Wedding hero settings updated successfully",
      });
    } catch (err) {
      console.error('Error updating wedding hero settings:', err);
      toast({
        title: "Error", 
        description: "Failed to update wedding hero settings",
        variant: "destructive",
      });
    }
  };

  // Update local wedding settings when event settings change
  useEffect(() => {
    const weddingSettings = transformToWeddingHero(eventSettings);
    setSettings(weddingSettings);
  }, [eventSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings,
    
    // Additional wedding-specific helpers
    getGroomName: () => settings?.groom_name || '',
    getBrideName: () => settings?.bride_name || '',
    getWeddingDate: () => settings?.wedding_date || '',
    getWeddingTime: () => settings?.wedding_time || '',
    getCeremonyVenue: () => ({
      name: settings?.ceremony_venue_name || '',
      address: settings?.ceremony_venue_address || ''
    }),
    getReceptionVenue: () => ({
      name: settings?.reception_venue_name || '',
      address: settings?.reception_venue_address || ''
    }),
    
    // Compatibility flags
    eventType,
    isCompatibilityMode: isCompatibilityMode || true,
    compatibilityMode: 'wedding-wrapper'
  };
};

// Export default for backward compatibility
export default useWeddingHero;