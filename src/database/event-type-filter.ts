/**
 * Event Type Filtering System
 * 
 * Provides comprehensive filtering capabilities for different event types.
 * Supports wedding, conference, birthday, corporate events, seminar, and more.
 * 
 * Phase 2.2: Database Table Transformation
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type SupportedEventType = 
  | 'wedding' 
  | 'conference' 
  | 'birthday' 
  | 'corporate' 
  | 'seminar' 
  | 'workshop' 
  | 'graduation' 
  | 'anniversary'
  | 'party'
  | 'exhibition';

export interface EventTypeConfig {
  type: SupportedEventType;
  displayName: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  sectionTypes: string[];
  participantRoles: string[];
}

/**
 * Event Type Registry
 */
export const EVENT_TYPE_REGISTRY: Record<SupportedEventType, EventTypeConfig> = {
  wedding: {
    type: 'wedding',
    displayName: 'Wedding',
    description: 'Wedding ceremony and reception events',
    requiredFields: ['bride_name', 'groom_name', 'ceremony_date', 'ceremony_venue'],
    optionalFields: ['reception_venue', 'reception_date', 'love_story', 'gallery'],
    sectionTypes: ['hero', 'participants', 'story', 'gallery', 'rsvp', 'contact'],
    participantRoles: ['bride', 'groom', 'best_man', 'maid_of_honor', 'bridesmaid', 'groomsman']
  },
  conference: {
    type: 'conference',
    displayName: 'Conference',
    description: 'Professional conferences and business events',
    requiredFields: ['event_name', 'start_date', 'venue', 'organizer'],
    optionalFields: ['speakers', 'agenda', 'sponsors', 'registration_fee'],
    sectionTypes: ['hero', 'speakers', 'agenda', 'venue', 'registration', 'contact'],
    participantRoles: ['organizer', 'speaker', 'attendee', 'sponsor', 'moderator']
  },
  birthday: {
    type: 'birthday',
    displayName: 'Birthday Party',
    description: 'Birthday celebration events',
    requiredFields: ['celebrant_name', 'birth_date', 'party_date', 'venue'],
    optionalFields: ['theme', 'gift_registry', 'dress_code', 'activities'],
    sectionTypes: ['hero', 'celebrant', 'timeline', 'activities', 'rsvp', 'contact'],
    participantRoles: ['celebrant', 'host', 'guest', 'entertainer']
  },
  corporate: {
    type: 'corporate',
    displayName: 'Corporate Event',
    description: 'Corporate meetings, launches, and business events',
    requiredFields: ['event_name', 'company', 'date', 'venue'],
    optionalFields: ['objectives', 'agenda', 'dress_code', 'networking'],
    sectionTypes: ['hero', 'objectives', 'agenda', 'venue', 'networking', 'contact'],
    participantRoles: ['organizer', 'executive', 'employee', 'client', 'vendor']
  },
  seminar: {
    type: 'seminar',
    displayName: 'Seminar',
    description: 'Educational seminars and workshops',
    requiredFields: ['title', 'facilitator', 'date', 'venue'],
    optionalFields: ['curriculum', 'materials', 'certificate', 'fee'],
    sectionTypes: ['hero', 'facilitator', 'curriculum', 'venue', 'registration', 'contact'],
    participantRoles: ['facilitator', 'participant', 'assistant', 'organizer']
  },
  workshop: {
    type: 'workshop',
    displayName: 'Workshop',
    description: 'Hands-on workshops and training sessions',
    requiredFields: ['title', 'instructor', 'date', 'venue'],
    optionalFields: ['materials', 'prerequisites', 'certificate', 'tools'],
    sectionTypes: ['hero', 'instructor', 'materials', 'venue', 'registration', 'contact'],
    participantRoles: ['instructor', 'participant', 'assistant', 'organizer']
  },
  graduation: {
    type: 'graduation',
    displayName: 'Graduation Ceremony',
    description: 'Graduation and commencement events',
    requiredFields: ['institution', 'ceremony_date', 'venue', 'degree_level'],
    optionalFields: ['valedictorian', 'guest_speaker', 'reception', 'dress_code'],
    sectionTypes: ['hero', 'ceremony', 'graduates', 'speakers', 'reception', 'contact'],
    participantRoles: ['graduate', 'speaker', 'faculty', 'family', 'guest']
  },
  anniversary: {
    type: 'anniversary',
    displayName: 'Anniversary Celebration',
    description: 'Anniversary and milestone celebrations',
    requiredFields: ['couple_names', 'anniversary_date', 'years_married', 'venue'],
    optionalFields: ['theme', 'memory_lane', 'renewal_ceremony', 'reception'],
    sectionTypes: ['hero', 'couple', 'memory_lane', 'celebration', 'rsvp', 'contact'],
    participantRoles: ['couple', 'host', 'family', 'friend', 'officiant']
  },
  party: {
    type: 'party',
    displayName: 'Party',
    description: 'General celebration and party events',
    requiredFields: ['party_name', 'host', 'date', 'venue'],
    optionalFields: ['theme', 'dress_code', 'activities', 'music'],
    sectionTypes: ['hero', 'host', 'activities', 'venue', 'rsvp', 'contact'],
    participantRoles: ['host', 'guest', 'entertainer', 'organizer']
  },
  exhibition: {
    type: 'exhibition',
    displayName: 'Exhibition',
    description: 'Art exhibitions and display events',
    requiredFields: ['exhibition_name', 'curator', 'start_date', 'venue'],
    optionalFields: ['artists', 'artworks', 'opening_reception', 'catalogue'],
    sectionTypes: ['hero', 'curator', 'artworks', 'artists', 'venue', 'contact'],
    participantRoles: ['curator', 'artist', 'visitor', 'collector', 'critic']
  }
};

/**
 * Event Type Filter Manager
 */
export class EventTypeFilterManager {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get event type configuration
   */
  getEventTypeConfig(eventType: SupportedEventType): EventTypeConfig {
    return EVENT_TYPE_REGISTRY[eventType];
  }

  /**
   * Get all supported event types
   */
  getSupportedEventTypes(): SupportedEventType[] {
    return Object.keys(EVENT_TYPE_REGISTRY) as SupportedEventType[];
  }

  /**
   * Validate event type
   */
  isValidEventType(eventType: string): eventType is SupportedEventType {
    return eventType in EVENT_TYPE_REGISTRY;
  }

  /**
   * Filter events by type
   */
  async getEventsByType(
    eventType: SupportedEventType,
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      includeInactive?: boolean;
    } = {}
  ) {
    const { limit = 10, offset = 0, includeInactive = false } = options;

    let query = this.supabase
      .from('event_participants')
      .select(`
        *,
        event_content(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('event_type', eventType);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    return query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
  }

  /**
   * Get events with multiple type filters
   */
  async getEventsByMultipleTypes(
    eventTypes: SupportedEventType[],
    tenantId: string,
    options: {
      limit?: number;
      groupByType?: boolean;
    } = {}
  ) {
    const { limit = 50, groupByType = false } = options;

    const query = this.supabase
      .from('event_participants')
      .select(`
        *,
        event_content(*)
      `)
      .eq('tenant_id', tenantId)
      .in('event_type', eventTypes)
      .limit(limit)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    if (!groupByType) {
      return { data, error: null };
    }

    // Group results by event type
    const groupedData = eventTypes.reduce((acc, type) => {
      acc[type] = data?.filter(event => event.event_type === type) || [];
      return acc;
    }, {} as Record<SupportedEventType, any[]>);

    return { data: groupedData, error: null };
  }

  /**
   * Filter event sections by type and section
   */
  async getEventSections(
    eventType: SupportedEventType,
    sectionType: string,
    tenantId: string
  ) {
    const config = this.getEventTypeConfig(eventType);
    
    // Validate section type for this event type
    if (!config.sectionTypes.includes(sectionType)) {
      throw new Error(`Section type '${sectionType}' is not valid for event type '${eventType}'`);
    }

    return this.supabase
      .from('event_sections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('event_type', eventType)
      .eq('section_type', sectionType);
  }

  /**
   * Get participants by role for specific event type
   */
  async getParticipantsByRole(
    eventType: SupportedEventType,
    role: string,
    tenantId: string
  ) {
    const config = this.getEventTypeConfig(eventType);
    
    // Validate role for this event type
    if (!config.participantRoles.includes(role)) {
      throw new Error(`Role '${role}' is not valid for event type '${eventType}'`);
    }

    return this.supabase
      .from('event_participants')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('event_type', eventType)
      .eq('role', role);
  }

  /**
   * Search events by criteria with type filtering
   */
  async searchEvents(
    searchCriteria: {
      eventTypes?: SupportedEventType[];
      tenantId: string;
      query?: string;
      dateRange?: {
        start: string;
        end: string;
      };
      venue?: string;
      status?: 'active' | 'inactive' | 'all';
    }
  ) {
    let query = this.supabase
      .from('event_participants')
      .select(`
        *,
        event_content(*),
        event_sections(*)
      `)
      .eq('tenant_id', searchCriteria.tenantId);

    // Filter by event types
    if (searchCriteria.eventTypes && searchCriteria.eventTypes.length > 0) {
      query = query.in('event_type', searchCriteria.eventTypes);
    }

    // Text search
    if (searchCriteria.query) {
      query = query.or(`
        primary_participant_name.ilike.%${searchCriteria.query}%,
        secondary_participant_name.ilike.%${searchCriteria.query}%,
        event_content.title.ilike.%${searchCriteria.query}%
      `);
    }

    // Date range filter
    if (searchCriteria.dateRange) {
      query = query
        .gte('event_date', searchCriteria.dateRange.start)
        .lte('event_date', searchCriteria.dateRange.end);
    }

    // Status filter
    if (searchCriteria.status !== 'all') {
      query = query.eq('is_active', searchCriteria.status === 'active');
    }

    return query.order('event_date', { ascending: true });
  }

  /**
   * Get event type statistics
   */
  async getEventTypeStatistics(tenantId: string) {
    const { data, error } = await this.supabase
      .from('event_participants')
      .select('event_type, is_active')
      .eq('tenant_id', tenantId);

    if (error) throw error;

    const stats = this.getSupportedEventTypes().reduce((acc, type) => {
      const typeEvents = data?.filter(event => event.event_type === type) || [];
      acc[type] = {
        total: typeEvents.length,
        active: typeEvents.filter(event => event.is_active).length,
        inactive: typeEvents.filter(event => !event.is_active).length
      };
      return acc;
    }, {} as Record<SupportedEventType, { total: number; active: number; inactive: number }>);

    return { data: stats, error: null };
  }
}

/**
 * Factory function to create event type filter manager
 */
export function createEventTypeFilterManager(supabase: SupabaseClient): EventTypeFilterManager {
  return new EventTypeFilterManager(supabase);
}

/**
 * Utility functions for event type filtering
 */
export const EventTypeUtils = {
  /**
   * Get display name for event type
   */
  getDisplayName: (eventType: SupportedEventType): string => {
    return EVENT_TYPE_REGISTRY[eventType].displayName;
  },

  /**
   * Get required fields for event type
   */
  getRequiredFields: (eventType: SupportedEventType): string[] => {
    return EVENT_TYPE_REGISTRY[eventType].requiredFields;
  },

  /**
   * Get section types for event type
   */
  getSectionTypes: (eventType: SupportedEventType): string[] => {
    return EVENT_TYPE_REGISTRY[eventType].sectionTypes;
  },

  /**
   * Get participant roles for event type
   */
  getParticipantRoles: (eventType: SupportedEventType): string[] => {
    return EVENT_TYPE_REGISTRY[eventType].participantRoles;
  },

  /**
   * Check if field is required for event type
   */
  isFieldRequired: (eventType: SupportedEventType, fieldName: string): boolean => {
    return EVENT_TYPE_REGISTRY[eventType].requiredFields.includes(fieldName);
  },

  /**
   * Check if section is supported for event type
   */
  isSectionSupported: (eventType: SupportedEventType, sectionType: string): boolean => {
    return EVENT_TYPE_REGISTRY[eventType].sectionTypes.includes(sectionType);
  },

  /**
   * Check if role is valid for event type
   */
  isRoleValid: (eventType: SupportedEventType, role: string): boolean => {
    return EVENT_TYPE_REGISTRY[eventType].participantRoles.includes(role);
  }
};