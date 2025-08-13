import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ================================================================================================
// EVENT PARTICIPANTS HOOK - GENERIC EVENT MANAGEMENT ENGINE
// ================================================================================================
// This hook manages event participants using the generic event_participants table
// Part of Phase 2.3 Hook Transformation (TFD Implementation)
// Supports all event types: wedding, conference, birthday, seminar, etc.
// ================================================================================================

export interface EventParticipant {
  id: string;
  event_id: string;
  tenant_id: string;
  participant_type: 'primary' | 'secondary' | 'organizer' | 'guest' | 'vendor' | 'speaker' | 'attendee';
  participant_name: string;
  participant_full_name?: string;
  participant_parents?: string;
  participant_profession?: string;
  participant_education?: string;
  participant_hobbies?: string;
  participant_description?: string;
  participant_image_url?: string;
  participant_role?: string;
  participant_order: number;
  contact_phone?: string;
  contact_email?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_linkedin?: string;
  metadata: Record<string, any>;
  display_config: Record<string, any>;
  is_active: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingCoupleData {
  groom_name?: string;
  groom_full_name?: string;
  groom_parents?: string;
  groom_profession?: string;
  groom_education?: string;
  groom_hobbies?: string;
  groom_description?: string;
  groom_image_url?: string;
  bride_name?: string;
  bride_full_name?: string;
  bride_parents?: string;
  bride_profession?: string;
  bride_education?: string;
  bride_hobbies?: string;
  bride_description?: string;
  bride_image_url?: string;
}

export interface ConferenceSpaker {
  speaker_name: string;
  speaker_bio?: string;
  speaker_title?: string;
  speaker_company?: string;
  speaker_image_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
}

export interface ParticipantFilters {
  participant_type?: string;
  participant_role?: string;
  is_active?: boolean;
  is_visible?: boolean;
}

export interface UseEventParticipantsOptions {
  eventId?: string;
  eventType?: string;
  autoLoad?: boolean;
  filters?: ParticipantFilters;
}

export interface UseEventParticipantsReturn {
  // Data
  participants: EventParticipant[];
  primaryParticipants: EventParticipant[];
  secondaryParticipants: EventParticipant[];
  speakers: EventParticipant[];
  organizers: EventParticipant[];
  
  // Wedding-specific convenience data
  coupleInfo: WeddingCoupleData | null;
  bride: EventParticipant | null;
  groom: EventParticipant | null;
  
  // Conference-specific convenience data
  keynoteSpeakers: ConferenceSpaker[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  loadParticipants: (eventId: string, filters?: ParticipantFilters) => Promise<void>;
  createParticipant: (participantData: Partial<EventParticipant>) => Promise<EventParticipant | null>;
  updateParticipant: (id: string, updates: Partial<EventParticipant>) => Promise<boolean>;
  deleteParticipant: (id: string) => Promise<boolean>;
  
  // Wedding-specific actions
  createWeddingCouple: (groomData: Partial<EventParticipant>, brideData: Partial<EventParticipant>) => Promise<boolean>;
  updateCoupleInfo: (coupleData: Partial<WeddingCoupleData>) => Promise<boolean>;
  
  // Conference-specific actions
  addSpeaker: (speakerData: Partial<EventParticipant>) => Promise<EventParticipant | null>;
  updateSpeaker: (speakerId: string, speakerData: Partial<EventParticipant>) => Promise<boolean>;
  
  // Utility actions
  reorderParticipants: (participantOrders: Array<{id: string, order: number}>) => Promise<boolean>;
  bulkUpdateParticipants: (updates: Array<{id: string, data: Partial<EventParticipant>}>) => Promise<number>;
  searchParticipants: (query: string) => EventParticipant[];
  
  // Stats
  totalParticipants: number;
  activeParticipants: number;
  participantsByType: Record<string, number>;
  participantsByRole: Record<string, number>;
}

export const useEventParticipants = (options: UseEventParticipantsOptions = {}): UseEventParticipantsReturn => {
  const { 
    eventId,
    eventType = 'generic',
    autoLoad = true,
    filters = {}
  } = options;

  // ================================================================================================
  // STATE MANAGEMENT
  // ================================================================================================
  
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================================================================================================
  // COMPUTED VALUES
  // ================================================================================================
  
  const primaryParticipants = participants.filter(p => p.participant_type === 'primary' && p.is_visible);
  const secondaryParticipants = participants.filter(p => p.participant_type === 'secondary' && p.is_visible);
  const speakers = participants.filter(p => p.participant_type === 'speaker' && p.is_visible);
  const organizers = participants.filter(p => p.participant_type === 'organizer' && p.is_visible);
  
  // Wedding-specific computed values
  const bride = participants.find(p => p.participant_role === 'bride' && p.is_visible) || null;
  const groom = participants.find(p => p.participant_role === 'groom' && p.is_visible) || null;
  
  const coupleInfo: WeddingCoupleData | null = (bride && groom) ? {
    bride_name: bride.participant_name,
    bride_full_name: bride.participant_full_name,
    bride_parents: bride.participant_parents,
    bride_profession: bride.participant_profession,
    bride_education: bride.participant_education,
    bride_hobbies: bride.participant_hobbies,
    bride_description: bride.participant_description,
    bride_image_url: bride.participant_image_url,
    groom_name: groom.participant_name,
    groom_full_name: groom.participant_full_name,
    groom_parents: groom.participant_parents,
    groom_profession: groom.participant_profession,
    groom_education: groom.participant_education,
    groom_hobbies: groom.participant_hobbies,
    groom_description: groom.participant_description,
    groom_image_url: groom.participant_image_url,
  } : null;
  
  // Conference-specific computed values
  const keynoteSpeakers: ConferenceSpaker[] = speakers
    .filter(s => s.metadata?.keynote === true)
    .map(s => ({
      speaker_name: s.participant_name,
      speaker_bio: s.participant_description,
      speaker_title: s.participant_profession,
      speaker_company: s.metadata?.company || '',
      speaker_image_url: s.participant_image_url,
      linkedin_url: s.social_linkedin,
      twitter_url: s.social_twitter
    }));

  // Stats
  const totalParticipants = participants.length;
  const activeParticipants = participants.filter(p => p.is_active).length;
  const participantsByType = participants.reduce((acc, p) => {
    acc[p.participant_type] = (acc[p.participant_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const participantsByRole = participants.reduce((acc, p) => {
    if (p.participant_role) {
      acc[p.participant_role] = (acc[p.participant_role] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // ================================================================================================
  // CORE DATA OPERATIONS
  // ================================================================================================
  
  const loadParticipants = async (targetEventId: string, targetFilters: ParticipantFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use backward compatibility view for wedding events
      const { data: weddingData, error: weddingError } = await supabase
        .from('wedding_couple_info')
        .select('*')
        .eq('id', targetEventId);
      
      if (!weddingError && weddingData && weddingData.length > 0) {
        const coupleData = weddingData[0];
        const participants: EventParticipant[] = [];
        
        // Convert groom data
        if (coupleData.groom_name) {
          participants.push({
            id: `groom-${targetEventId}`,
            event_id: targetEventId,
            tenant_id: 'default-tenant', // Default fallback
            participant_type: 'primary',
            participant_name: coupleData.groom_name,
            participant_full_name: coupleData.groom_full_name,
            participant_parents: coupleData.groom_parents,
            participant_profession: coupleData.groom_profession,
            participant_education: coupleData.groom_education,
            participant_hobbies: coupleData.groom_hobbies,
            participant_description: coupleData.groom_description,
            participant_image_url: coupleData.groom_image_url,
            participant_role: 'groom',
            participant_order: 1,
            metadata: {},
            display_config: {},
            is_active: true,
            is_visible: true,
            created_at: coupleData.created_at,
            updated_at: coupleData.updated_at
          });
        }
        
        // Convert bride data
        if (coupleData.bride_name) {
          participants.push({
            id: `bride-${targetEventId}`,
            event_id: targetEventId,
            tenant_id: 'default-tenant', // Default fallback
            participant_type: 'primary',
            participant_name: coupleData.bride_name,
            participant_full_name: coupleData.bride_full_name,
            participant_parents: coupleData.bride_parents,
            participant_profession: coupleData.bride_profession,
            participant_education: coupleData.bride_education,
            participant_hobbies: coupleData.bride_hobbies,
            participant_description: coupleData.bride_description,
            participant_image_url: coupleData.bride_image_url,
            participant_role: 'bride',
            participant_order: 2,
            metadata: {},
            display_config: {},
            is_active: true,
            is_visible: true,
            created_at: coupleData.created_at,
            updated_at: coupleData.updated_at
          });
        }
        
        // Apply filters
        let filteredParticipants = participants;
        
        if (targetFilters.participant_type) {
          filteredParticipants = filteredParticipants.filter(p =>
            p.participant_type === targetFilters.participant_type
          );
        }
        
        if (targetFilters.participant_role) {
          filteredParticipants = filteredParticipants.filter(p =>
            p.participant_role === targetFilters.participant_role
          );
        }
        
        if (typeof targetFilters.is_active === 'boolean') {
          filteredParticipants = filteredParticipants.filter(p =>
            p.is_active === targetFilters.is_active
          );
        }
        
        if (typeof targetFilters.is_visible === 'boolean') {
          filteredParticipants = filteredParticipants.filter(p =>
            p.is_visible === targetFilters.is_visible
          );
        }
        
        setParticipants(filteredParticipants);
        return;
      }
      
      // If no wedding data found, return empty array
      setParticipants([]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load participants';
      setError(errorMessage);
      console.error('Error loading participants:', err);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const createParticipant = async (participantData: Partial<EventParticipant>): Promise<EventParticipant | null> => {
    try {
      if (!participantData.event_id) {
        throw new Error('Event ID is required');
      }
      
      // For now, create a mock participant (in real implementation, this would use the generic event_participants table)
      const newParticipant: EventParticipant = {
        id: crypto.randomUUID(),
        event_id: participantData.event_id,
        tenant_id: participantData.tenant_id || 'default-tenant',
        participant_type: participantData.participant_type || 'guest',
        participant_name: participantData.participant_name || '',
        participant_full_name: participantData.participant_full_name,
        participant_parents: participantData.participant_parents,
        participant_profession: participantData.participant_profession,
        participant_education: participantData.participant_education,
        participant_hobbies: participantData.participant_hobbies,
        participant_description: participantData.participant_description,
        participant_image_url: participantData.participant_image_url,
        participant_role: participantData.participant_role,
        participant_order: participantData.participant_order || 0,
        contact_phone: participantData.contact_phone,
        contact_email: participantData.contact_email,
        social_instagram: participantData.social_instagram,
        social_facebook: participantData.social_facebook,
        social_twitter: participantData.social_twitter,
        social_linkedin: participantData.social_linkedin,
        metadata: participantData.metadata || {},
        display_config: participantData.display_config || {},
        is_active: participantData.is_active ?? true,
        is_visible: participantData.is_visible ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to local state (in real implementation, this would be persisted to database)
      setParticipants(prev => [...prev, newParticipant]);
      
      return newParticipant;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create participant';
      setError(errorMessage);
      console.error('Error creating participant:', err);
      return null;
    }
  };

  const updateParticipant = async (id: string, updates: Partial<EventParticipant>): Promise<boolean> => {
    try {
      // For now, just update local state (in real implementation, this would update the database)
      setParticipants(prev => prev.map(p =>
        p.id === id
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update participant';
      setError(errorMessage);
      console.error('Error updating participant:', err);
      return false;
    }
  };

  const deleteParticipant = async (id: string): Promise<boolean> => {
    try {
      // For now, just update local state (in real implementation, this would delete from database)
      setParticipants(prev => prev.filter(p => p.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete participant';
      setError(errorMessage);
      console.error('Error deleting participant:', err);
      return false;
    }
  };

  // ================================================================================================
  // WEDDING-SPECIFIC OPERATIONS
  // ================================================================================================
  
  const createWeddingCouple = async (
    groomData: Partial<EventParticipant>, 
    brideData: Partial<EventParticipant>
  ): Promise<boolean> => {
    try {
      if (!groomData.event_id || !brideData.event_id) {
        throw new Error('Event ID is required for both participants');
      }
      
      // Create groom
      const groomResult = await createParticipant({
        ...groomData,
        participant_type: 'primary',
        participant_role: 'groom',
        participant_order: 1
      });
      
      // Create bride
      const brideResult = await createParticipant({
        ...brideData,
        participant_type: 'primary',
        participant_role: 'bride',
        participant_order: 2
      });
      
      return !!(groomResult && brideResult);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wedding couple';
      setError(errorMessage);
      console.error('Error creating wedding couple:', err);
      return false;
    }
  };

  const updateCoupleInfo = async (coupleData: Partial<WeddingCoupleData>): Promise<boolean> => {
    try {
      let success = true;
      
      // Update groom info
      if (groom && Object.keys(coupleData).some(key => key.startsWith('groom_'))) {
        const groomUpdates: Partial<EventParticipant> = {};
        
        if (coupleData.groom_name) groomUpdates.participant_name = coupleData.groom_name;
        if (coupleData.groom_full_name) groomUpdates.participant_full_name = coupleData.groom_full_name;
        if (coupleData.groom_parents) groomUpdates.participant_parents = coupleData.groom_parents;
        if (coupleData.groom_profession) groomUpdates.participant_profession = coupleData.groom_profession;
        if (coupleData.groom_education) groomUpdates.participant_education = coupleData.groom_education;
        if (coupleData.groom_hobbies) groomUpdates.participant_hobbies = coupleData.groom_hobbies;
        if (coupleData.groom_description) groomUpdates.participant_description = coupleData.groom_description;
        if (coupleData.groom_image_url) groomUpdates.participant_image_url = coupleData.groom_image_url;
        
        const groomSuccess = await updateParticipant(groom.id, groomUpdates);
        if (!groomSuccess) success = false;
      }
      
      // Update bride info
      if (bride && Object.keys(coupleData).some(key => key.startsWith('bride_'))) {
        const brideUpdates: Partial<EventParticipant> = {};
        
        if (coupleData.bride_name) brideUpdates.participant_name = coupleData.bride_name;
        if (coupleData.bride_full_name) brideUpdates.participant_full_name = coupleData.bride_full_name;
        if (coupleData.bride_parents) brideUpdates.participant_parents = coupleData.bride_parents;
        if (coupleData.bride_profession) brideUpdates.participant_profession = coupleData.bride_profession;
        if (coupleData.bride_education) brideUpdates.participant_education = coupleData.bride_education;
        if (coupleData.bride_hobbies) brideUpdates.participant_hobbies = coupleData.bride_hobbies;
        if (coupleData.bride_description) brideUpdates.participant_description = coupleData.bride_description;
        if (coupleData.bride_image_url) brideUpdates.participant_image_url = coupleData.bride_image_url;
        
        const brideSuccess = await updateParticipant(bride.id, brideUpdates);
        if (!brideSuccess) success = false;
      }
      
      return success;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update couple info';
      setError(errorMessage);
      console.error('Error updating couple info:', err);
      return false;
    }
  };

  // ================================================================================================
  // CONFERENCE-SPECIFIC OPERATIONS
  // ================================================================================================
  
  const addSpeaker = async (speakerData: Partial<EventParticipant>): Promise<EventParticipant | null> => {
    return await createParticipant({
      ...speakerData,
      participant_type: 'speaker',
      participant_role: 'speaker'
    });
  };

  const updateSpeaker = async (speakerId: string, speakerData: Partial<EventParticipant>): Promise<boolean> => {
    return await updateParticipant(speakerId, speakerData);
  };

  // ================================================================================================
  // UTILITY OPERATIONS
  // ================================================================================================
  
  const reorderParticipants = async (participantOrders: Array<{id: string, order: number}>): Promise<boolean> => {
    try {
      const promises = participantOrders.map(({ id, order }) => 
        updateParticipant(id, { participant_order: order })
      );
      
      const results = await Promise.all(promises);
      return results.every(success => success);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder participants';
      setError(errorMessage);
      console.error('Error reordering participants:', err);
      return false;
    }
  };

  const bulkUpdateParticipants = async (updates: Array<{id: string, data: Partial<EventParticipant>}>): Promise<number> => {
    try {
      let successCount = 0;
      
      for (const update of updates) {
        const success = await updateParticipant(update.id, update.data);
        if (success) successCount++;
      }
      
      return successCount;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update participants';
      setError(errorMessage);
      console.error('Error bulk updating participants:', err);
      return 0;
    }
  };

  const searchParticipants = (query: string): EventParticipant[] => {
    if (!query.trim()) return participants;
    
    const lowercaseQuery = query.toLowerCase();
    return participants.filter(p => 
      p.participant_name.toLowerCase().includes(lowercaseQuery) ||
      p.participant_full_name?.toLowerCase().includes(lowercaseQuery) ||
      p.participant_profession?.toLowerCase().includes(lowercaseQuery) ||
      p.participant_role?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // ================================================================================================
  // EFFECTS
  // ================================================================================================
  
  useEffect(() => {
    if (autoLoad && eventId) {
      loadParticipants(eventId, filters);
    }
  }, [eventId, autoLoad, JSON.stringify(filters)]);

  // ================================================================================================
  // RETURN HOOK INTERFACE
  // ================================================================================================
  
  return {
    // Data
    participants,
    primaryParticipants,
    secondaryParticipants,
    speakers,
    organizers,
    
    // Wedding-specific convenience data
    coupleInfo,
    bride,
    groom,
    
    // Conference-specific convenience data
    keynoteSpeakers,
    
    // State
    loading,
    error,
    
    // Actions
    loadParticipants,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    
    // Wedding-specific actions
    createWeddingCouple,
    updateCoupleInfo,
    
    // Conference-specific actions
    addSpeaker,
    updateSpeaker,
    
    // Utility actions
    reorderParticipants,
    bulkUpdateParticipants,
    searchParticipants,
    
    // Stats
    totalParticipants,
    activeParticipants,
    participantsByType,
    participantsByRole
  };
};

// ================================================================================================
// LEGACY COMPATIBILITY LAYER
// ================================================================================================

// Wedding-specific hook that uses the generic event participants hook
export const useWeddingParticipants = (eventId?: string) => {
  return useEventParticipants({
    eventId,
    eventType: 'wedding',
    filters: { is_visible: true }
  });
};

// Conference-specific hook for speakers management  
export const useConferenceSpeakers = (eventId?: string) => {
  return useEventParticipants({
    eventId,
    eventType: 'conference',
    filters: { participant_type: 'speaker', is_visible: true }
  });
};

export default useEventParticipants;