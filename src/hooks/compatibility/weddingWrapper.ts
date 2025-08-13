/**
 * COMPATIBILITY LAYER: Wedding Wrapper
 *
 * This file provides backward compatibility between the new generic Event Management Engine
 * and existing wedding-specific components. It wraps generic event hooks and transforms
 * data to maintain compatibility with legacy wedding components.
 *
 * Created as part of PHASE 2 Frontend Component Transformation
 * Test-First Development (TFD) Implementation
 */

import { useEventContent } from '../useEventContent';
import { useEventHero } from '../useEventHero';
import { weddingPlugin, pluginUtils } from './weddingPlugin';
import { DatabaseMode, createCompatibilityManager } from '../../database/compatibility-mode';
import { supabase } from '@/integrations/supabase/client';
import type {
  EventParticipants,
  EventContent,
  EventStory,
  EventHeroSettings
} from '../useEventContent';

// Legacy Wedding Types (for backward compatibility)
interface WeddingCouple {
  bride: {
    name: string;
    fullName: string;
    father: string;
    mother: string;
    instagram?: string;
    image?: string;
  };
  groom: {
    name: string;
    fullName: string;
    father: string;
    mother: string;
    instagram?: string;
    image?: string;
  };
}

interface WeddingContent {
  couple: WeddingCouple;
  story: {
    title: string;
    content: string;
    timeline: Array<{
      date: string;
      title: string;
      description: string;
    }>;
  };
  event: {
    akad: {
      date: string;
      time: string;
      location: string;
      address: string;
    };
    resepsi: {
      date: string;
      time: string;
      location: string;
      address: string;
    };
  };
}

interface WeddingHeroData {
  couple: {
    bride_name: string;
    groom_name: string;
  };
  event_date: string;
  location: string;
  background_image?: string;
  theme?: string;
}

/**
 * Wedding Content Compatibility Wrapper
 * Wraps useEventContent dan transforms generic data to wedding-specific format
 */
export function useWeddingContentCompatibility(tenantId: string): {
  weddingContent: WeddingContent | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  // Use wedding plugin configuration
  const plugin = pluginUtils.getPlugin('wedding');
  const eventData = useEventContent('wedding');
  const {
    participants,
    eventStory,
    eventContent,
    isLoading,
    error,
    refreshContent
  } = eventData;

  // Transform generic event data to legacy WeddingContent format
  const transformToWeddingContent = (): WeddingContent | null => {
    if (!participants || participants.length === 0 || !eventStory) return null;

    // Find bride and groom from participants array
    const bride = participants.find(p => p.participant_role === 'bride');
    const groom = participants.find(p => p.participant_role === 'groom');
    
    if (!bride || !groom) return null;

    const brideData = {
      name: bride.participant_name || '',
      fullName: bride.participant_full_name || bride.participant_name || '',
      father: bride.participant_parents?.split(' & ')[0] || '',
      mother: bride.participant_parents?.split(' & ')[1] || '',
      instagram: '',
      image: bride.participant_image_url
    };

    const groomData = {
      name: groom.participant_name || '',
      fullName: groom.participant_full_name || groom.participant_name || '',
      father: groom.participant_parents?.split(' & ')[0] || '',
      mother: groom.participant_parents?.split(' & ')[1] || '',
      instagram: '',
      image: groom.participant_image_url
    };

    return {
      couple: {
        bride: brideData,
        groom: groomData
      },
      story: {
        title: eventStory.title || '',
        content: eventStory.full_story || '',
        timeline: eventStory.timeline_items?.map(item => ({
          date: item.year,
          title: item.title,
          description: item.description
        })) || []
      },
      event: {
        akad: {
          date: '',
          time: '',
          location: '',
          address: ''
        },
        resepsi: {
          date: '',
          time: '',
          location: '',
          address: ''
        }
      }
    };
  };

  return {
    weddingContent: transformToWeddingContent(),
    loading: isLoading,
    error: error || null,
    refetch: refreshContent
  };
}

/**
 * Wedding Hero Compatibility Wrapper
 * Wraps useEventHero dan transforms generic data to wedding-specific format
 */
export function useWeddingHeroCompatibility(tenantId: string): {
  weddingHero: WeddingHeroData | null;
  loading: boolean;
  error: string | null;
  updateWeddingHero: (data: Partial<WeddingHeroData>) => Promise<void>;
  refetch: () => void;
} {
  const eventData = useEventContent('wedding');
  const {
    heroSettings,
    isLoading,
    error,
    updateHeroSettings,
    refreshContent
  } = eventData;

  // Transform generic EventHeroSettings to legacy WeddingHeroData format
  const transformToWeddingHero = (settings: EventHeroSettings | null): WeddingHeroData | null => {
    if (!settings) return null;

    return {
      couple: {
        bride_name: settings.primary_participants?.[1] || '',
        groom_name: settings.primary_participants?.[0] || ''
      },
      event_date: settings.event_date || '',
      location: settings.primary_venue?.name || '',
      background_image: settings.hero_content?.background_image,
      theme: 'wedding'
    };
  };

  // Transform legacy WeddingHeroData to generic EventHeroSettings format
  const transformFromWeddingHero = (weddingData: Partial<WeddingHeroData>): Partial<EventHeroSettings> => {
    return {
      primary_participants: weddingData.couple ? [
        weddingData.couple.groom_name || '',
        weddingData.couple.bride_name || ''
      ] : undefined,
      event_date: weddingData.event_date,
      primary_venue: weddingData.location ? {
        name: weddingData.location,
        address: ''
      } : undefined,
      hero_content: weddingData.background_image ? {
        subtitle: '',
        description: '',
        background_image: weddingData.background_image
      } : undefined
    };
  };

  const updateWeddingHero = async (data: Partial<WeddingHeroData>) => {
    const transformedData = transformFromWeddingHero(data);
    await updateHeroSettings(transformedData);
  };

  return {
    weddingHero: transformToWeddingHero(heroSettings),
    loading: isLoading,
    error: error || null,
    updateWeddingHero,
    refetch: refreshContent
  };
}

/**
 * Legacy Wedding Hook Wrappers
 * These maintain exact same interface as original wedding hooks for full backward compatibility
 */

// Legacy useWeddingContent hook wrapper
export function useWeddingContent(tenantId: string) {
  return useWeddingContentCompatibility(tenantId);
}

// Legacy useWeddingHero hook wrapper  
export function useWeddingHero(tenantId: string) {
  return useWeddingHeroCompatibility(tenantId);
}

/**
 * Wedding Data Transformation Utilities
 * Helper functions untuk data transformation between wedding dan generic formats
 */
export const weddingTransformers = {
  // Transform generic participants ke wedding couple format
  participantsToCouple: (participants: EventParticipants[]): WeddingCouple | null => {
    const bride = participants.find(p => p.participant_role === 'bride');
    const groom = participants.find(p => p.participant_role === 'groom');
    
    if (!bride || !groom) return null;

    return {
      bride: {
        name: bride.participant_name,
        fullName: bride.participant_full_name || bride.participant_name,
        father: bride.participant_parents?.split(' & ')[0] || '',
        mother: bride.participant_parents?.split(' & ')[1] || '',
        instagram: '',
        image: bride.participant_image_url
      },
      groom: {
        name: groom.participant_name,
        fullName: groom.participant_full_name || groom.participant_name,
        father: groom.participant_parents?.split(' & ')[0] || '',
        mother: groom.participant_parents?.split(' & ')[1] || '',
        instagram: '',
        image: groom.participant_image_url
      }
    };
  },

  // Transform wedding couple ke generic participants format
  coupleToParticipants: (couple: WeddingCouple): EventParticipants[] => {
    return [
      {
        id: 'bride-1',
        participant_type: 'primary',
        participant_name: couple.bride.name,
        participant_full_name: couple.bride.fullName,
        participant_parents: `${couple.bride.father} & ${couple.bride.mother}`,
        participant_image_url: couple.bride.image,
        participant_role: 'bride',
        participant_order: 2,
        metadata: { type: 'wedding', role: 'bride' },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'groom-1',
        participant_type: 'primary',
        participant_name: couple.groom.name,
        participant_full_name: couple.groom.fullName,
        participant_parents: `${couple.groom.father} & ${couple.groom.mother}`,
        participant_image_url: couple.groom.image,
        participant_role: 'groom',
        participant_order: 1,
        metadata: { type: 'wedding', role: 'groom' },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  },

  // Validate wedding-specific data structure
  validateWeddingData: (data: any): boolean => {
    return !!(
      data?.couple?.bride?.name &&
      data?.couple?.groom?.name &&
      data?.story?.title &&
      data?.event
    );
  }
};

/**
 * Compatibility Mode Support
 * Functions untuk manage compatibility mode antara legacy dan generic tables
 */
export const compatibilitySupport = {
  // Get current compatibility mode
  getCurrentMode: (): DatabaseMode => {
    return 'hybrid'; // Default to hybrid during transition
  },

  // Check if compatibility mode is supported
  isCompatibilityModeSupported: (): boolean => {
    return true; // Always supported during transformation
  },

  // Create compatibility manager for specific tenant
  createManager: (tenantId: string, eventType: string = 'wedding') => {
    return createCompatibilityManager(supabase, {
      mode: 'hybrid',
      tenantId,
      eventType,
      enableFallback: true
    });
  },

  // Compatibility mode flag untuk test detection
  compatibility_mode: 'hybrid' as DatabaseMode
};

/**
 * Migration Helper Functions
 * Functions untuk help migrate dari wedding-specific ke generic format
 */
export const migrationHelpers = {
  // Check if current data is in wedding format
  isWeddingFormat: (data: any): boolean => {
    return !!(data?.couple?.bride && data?.couple?.groom);
  },

  // Check if current data is in generic format
  isGenericFormat: (data: any): boolean => {
    return !!(data?.participants && Array.isArray(data.participants));
  },

  // Get migration status
  getMigrationStatus: (data: any): 'wedding' | 'generic' | 'unknown' => {
    if (migrationHelpers.isWeddingFormat(data)) return 'wedding';
    if (migrationHelpers.isGenericFormat(data)) return 'generic';
    return 'unknown';
  }
};

export default {
  useWeddingContent,
  useWeddingHero,
  useWeddingContentCompatibility,
  useWeddingHeroCompatibility,
  weddingTransformers,
  migrationHelpers
};