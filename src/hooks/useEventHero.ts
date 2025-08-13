import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

// ========================================
// GENERIC EVENT HERO TYPES
// ========================================

export interface EventHeroSettings {
  id: string;
  event_type: string; // Plugin identifier
  primary_participants: Array<string>; // Main participants names
  event_date: string;
  event_time: string;
  primary_venue: {
    name: string;
    address: string;
  };
  secondary_venue?: {
    name: string;
    address: string;
  };
  hero_content: {
    subtitle: string;
    description: string;
    background_image?: string;
  };
  countdown_enabled: boolean;
  hero_metadata?: Record<string, any>; // Plugin-specific data
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// GENERIC EVENT HERO HOOK
// ========================================

export const useEventHero = (eventType?: string) => {
  const [settings, setSettings] = useState<EventHeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // ========================================
  // COMPATIBILITY TRANSFORMATION
  // ========================================
  
  const transformWeddingHeroToGeneric = (heroData: any): EventHeroSettings | null => {
    if (!heroData) return null;
    
    return {
      id: heroData.id,
      event_type: eventType || 'wedding',
      primary_participants: [heroData.groom_name, heroData.bride_name],
      event_date: heroData.wedding_date,
      event_time: heroData.wedding_time,
      primary_venue: {
        name: heroData.ceremony_venue_name,
        address: heroData.ceremony_venue_address
      },
      secondary_venue: heroData.reception_venue_name ? {
        name: heroData.reception_venue_name,
        address: heroData.reception_venue_address || ''
      } : undefined,
      hero_content: {
        subtitle: heroData.hero_subtitle,
        description: heroData.hero_description,
        background_image: heroData.hero_background_image
      },
      countdown_enabled: heroData.countdown_enabled,
      hero_metadata: { 
        type: 'wedding',
        compatibility_mode: true,
        original_data: {
          groom_name: heroData.groom_name,
          bride_name: heroData.bride_name,
          ceremony_venue_name: heroData.ceremony_venue_name,
          ceremony_venue_address: heroData.ceremony_venue_address,
          reception_venue_name: heroData.reception_venue_name,
          reception_venue_address: heroData.reception_venue_address
        }
      },
      is_active: heroData.is_active,
      created_at: heroData.created_at,
      updated_at: heroData.updated_at
    };
  };

  // ========================================
  // FETCH FUNCTION
  // ========================================
  
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // COMPATIBILITY: Use wedding_hero_settings table for now
      const { data, error } = await supabase
        .from('wedding_hero_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching hero settings:', error);
        setError('Failed to load hero settings');
        return;
      }

      const transformedSettings = transformWeddingHeroToGeneric(data);
      setSettings(transformedSettings);
      
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError('Failed to load hero settings');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // UPDATE FUNCTION (COMPATIBILITY MODE)
  // ========================================
  
  const updateSettings = async (updates: Partial<EventHeroSettings>) => {
    if (!settings) {
      toast({
        title: "Error",
        description: "No hero settings found to update",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Transform generic updates back to wedding format for compatibility
      const weddingUpdates: any = {};
      
      // Map primary participants
      if (updates.primary_participants && updates.primary_participants.length >= 2) {
        weddingUpdates.groom_name = updates.primary_participants[0];
        weddingUpdates.bride_name = updates.primary_participants[1];
      }
      
      // Map date and time
      if (updates.event_date) {
        weddingUpdates.wedding_date = updates.event_date;
      }
      if (updates.event_time) {
        weddingUpdates.wedding_time = updates.event_time;
      }
      
      // Map venues
      if (updates.primary_venue) {
        weddingUpdates.ceremony_venue_name = updates.primary_venue.name;
        weddingUpdates.ceremony_venue_address = updates.primary_venue.address;
      }
      if (updates.secondary_venue) {
        weddingUpdates.reception_venue_name = updates.secondary_venue.name;
        weddingUpdates.reception_venue_address = updates.secondary_venue.address;
      }
      
      // Map hero content
      if (updates.hero_content) {
        if (updates.hero_content.subtitle) {
          weddingUpdates.hero_subtitle = updates.hero_content.subtitle;
        }
        if (updates.hero_content.description) {
          weddingUpdates.hero_description = updates.hero_content.description;
        }
        if (updates.hero_content.background_image !== undefined) {
          weddingUpdates.hero_background_image = updates.hero_content.background_image;
        }
      }
      
      // Map other properties
      if (updates.countdown_enabled !== undefined) {
        weddingUpdates.countdown_enabled = updates.countdown_enabled;
      }
      if (updates.is_active !== undefined) {
        weddingUpdates.is_active = updates.is_active;
      }
      
      // Update wedding hero settings
      const { data, error } = await supabase
        .from('wedding_hero_settings')
        .update(weddingUpdates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update hero settings",
          variant: "destructive",
        });
        console.error('Update error:', error);
        return;
      }

      // Transform updated data back to generic format
      const transformedSettings = transformWeddingHeroToGeneric(data);
      setSettings(transformedSettings);
      
      toast({
        title: "Success",
        description: "Hero settings updated successfully",
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      toast({
        title: "Error",
        description: "Failed to update hero settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // LIFECYCLE
  // ========================================
  
  useEffect(() => {
    fetchSettings();
  }, [eventType]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
    
    // Helper methods for accessing data
    getParticipantNames: () => settings?.primary_participants || [],
    getPrimaryVenue: () => settings?.primary_venue,
    getSecondaryVenue: () => settings?.secondary_venue,
    getHeroContent: () => settings?.hero_content,
    
    // Plugin info
    eventType: settings?.event_type || eventType || 'wedding',
    isCompatibilityMode: !!settings?.hero_metadata?.compatibility_mode
  };
};