/**
 * Multi-Event Support System
 * 
 * Provides comprehensive support for managing multiple event types simultaneously.
 * Allows users to create, manage, and coordinate different types of events within
 * a single tenant environment.
 * 
 * Phase 2.2: Database Table Transformation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SupportedEventType, EventTypeFilterManager, createEventTypeFilterManager } from './event-type-filter';
import { GenericQueryManager, createGenericQueryManager } from './generic-queries';
import { CompatibilityModeManager, createCompatibilityManager } from './compatibility-mode';

export interface MultiEventConfig {
  tenantId: string;
  supportedEventTypes: SupportedEventType[];
  defaultEventType: SupportedEventType;
  enableCrossEventOperations: boolean;
}

export interface EventInstance {
  id: string;
  eventType: SupportedEventType;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface CrossEventOperation {
  operationType: 'duplicate' | 'merge' | 'convert' | 'share';
  sourceEventId: string;
  targetEventType?: SupportedEventType;
  targetEventId?: string;
  options: Record<string, any>;
}

/**
 * Multi-Event Support Manager
 */
export class MultiEventSupportManager {
  private eventTypeManager: EventTypeFilterManager;
  private queryManager: GenericQueryManager;
  private compatibilityManager: CompatibilityModeManager;

  constructor(
    private supabase: SupabaseClient,
    private config: MultiEventConfig
  ) {
    this.eventTypeManager = createEventTypeFilterManager(supabase);
    this.queryManager = createGenericQueryManager(supabase);
    this.compatibilityManager = createCompatibilityManager(supabase, {
      tenantId: config.tenantId,
      eventType: config.defaultEventType
    });
  }

  /**
   * Get all events for the tenant across all event types
   */
  async getAllEvents(options: {
    eventTypes?: SupportedEventType[];
    status?: 'all' | 'active' | 'draft' | 'completed' | 'cancelled';
    limit?: number;
    offset?: number;
    sortBy?: 'date' | 'name' | 'type' | 'status';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    events: EventInstance[];
    totalCount: number;
    eventTypeCounts: Record<SupportedEventType, number>;
  }> {
    const {
      eventTypes = this.config.supportedEventTypes,
      status = 'all',
      limit = 50,
      offset = 0,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    // Get events with multi-type filtering
    const { data, error } = await this.eventTypeManager.getEventsByMultipleTypes(
      eventTypes,
      this.config.tenantId,
      { limit: limit + offset, groupByType: false }
    );

    if (error) throw error;

    let events = Array.isArray(data) ? data : (data?.data || []);

    // Apply status filter
    if (status !== 'all') {
      events = events.filter(event => 
        status === 'active' ? event.is_active : 
        status === 'draft' ? !event.is_active :
        true
      );
    }

    // Apply sorting
    events.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          break;
        case 'name':
          comparison = (a.primary_participant_name || '').localeCompare(b.primary_participant_name || '');
          break;
        case 'type':
          comparison = a.event_type.localeCompare(b.event_type);
          break;
        case 'status':
          comparison = (a.is_active ? 'active' : 'inactive').localeCompare(b.is_active ? 'active' : 'inactive');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const paginatedEvents = events.slice(offset, offset + limit);

    // Calculate event type counts
    const eventTypeCounts = this.config.supportedEventTypes.reduce((acc, type) => {
      acc[type] = events.filter(event => event.event_type === type).length;
      return acc;
    }, {} as Record<SupportedEventType, number>);

    return {
      events: paginatedEvents.map(event => ({
        id: event.id,
        eventType: event.event_type as SupportedEventType,
        name: event.primary_participant_name || event.event_name || 'Unnamed Event',
        status: event.is_active ? 'active' : 'draft',
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        tenantId: event.tenant_id
      })),
      totalCount: events.length,
      eventTypeCounts
    };
  }

  /**
   * Create new event of specified type
   */
  async createEvent(
    eventType: SupportedEventType,
    eventData: {
      name: string;
      primaryParticipant?: string;
      secondaryParticipant?: string;
      eventDate?: string;
      venue?: string;
      description?: string;
      customData?: Record<string, any>;
    }
  ): Promise<EventInstance> {
    // Validate event type
    if (!this.config.supportedEventTypes.includes(eventType)) {
      throw new Error(`Event type '${eventType}' is not supported for this tenant`);
    }

    const eventConfig = this.eventTypeManager.getEventTypeConfig(eventType);
    
    // Prepare participant data
    const participantData = {
      tenant_id: this.config.tenantId,
      event_type: eventType,
      primary_participant_name: eventData.primaryParticipant || eventData.name,
      secondary_participant_name: eventData.secondaryParticipant,
      event_date: eventData.eventDate,
      primary_venue_name: eventData.venue,
      is_active: false, // Start as draft
      event_data: {
        description: eventData.description,
        ...eventData.customData
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.queryManager.participants.createParticipant(
      participantData,
      {
        tenantId: this.config.tenantId,
        eventType,
        compatibility: this.compatibilityManager
      }
    );

    if (error) throw error;

    return {
      id: data.data.id,
      eventType,
      name: eventData.name,
      status: 'draft',
      createdAt: data.data.created_at,
      updatedAt: data.data.created_at,
      tenantId: this.config.tenantId
    };
  }

  /**
   * Duplicate event to different event type
   */
  async duplicateEvent(
    sourceEventId: string,
    targetEventType: SupportedEventType,
    options: {
      newName?: string;
      adaptFields?: boolean;
      copyContent?: boolean;
      copySections?: boolean;
    } = {}
  ): Promise<EventInstance> {
    const {
      newName,
      adaptFields = true,
      copyContent = true,
      copySections = true
    } = options;

    // Get source event data
    const sourceEvent = await this.getEventById(sourceEventId);
    if (!sourceEvent) {
      throw new Error('Source event not found');
    }

    // Get comprehensive event data
    const sourceEventData = await this.queryManager.getEventData({
      tenantId: this.config.tenantId,
      eventType: sourceEvent.eventType,
      compatibility: this.compatibilityManager
    });

    // Create new event
    const newEvent = await this.createEvent(targetEventType, {
      name: newName || `${sourceEvent.name} (Copy)`,
      primaryParticipant: sourceEventData.participants?.data?.[0]?.primary_participant_name,
      secondaryParticipant: sourceEventData.participants?.data?.[0]?.secondary_participant_name,
      eventDate: sourceEventData.participants?.data?.[0]?.event_date,
      venue: sourceEventData.participants?.data?.[0]?.primary_venue_name
    });

    // Copy content if requested
    if (copyContent && sourceEventData.content?.data) {
      await this.queryManager.content.updateContent(
        this.adaptContentForEventType(sourceEventData.content.data[0], targetEventType),
        {
          tenantId: this.config.tenantId,
          eventType: targetEventType,
          compatibility: this.compatibilityManager
        }
      );
    }

    return newEvent;
  }

  /**
   * Convert event from one type to another
   */
  async convertEvent(
    eventId: string,
    targetEventType: SupportedEventType,
    options: {
      preserveData?: boolean;
      adaptFields?: boolean;
    } = {}
  ): Promise<EventInstance> {
    const { preserveData = true, adaptFields = true } = options;

    const sourceEvent = await this.getEventById(eventId);
    if (!sourceEvent) {
      throw new Error('Source event not found');
    }

    // Create duplicate first
    const duplicatedEvent = await this.duplicateEvent(eventId, targetEventType, {
      newName: sourceEvent.name,
      adaptFields,
      copyContent: preserveData,
      copySections: preserveData
    });

    // Deactivate original event
    await this.updateEventStatus(eventId, 'cancelled');

    return duplicatedEvent;
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<EventInstance | null> {
    const { data, error } = await this.supabase
      .from('event_participants')
      .select('*')
      .eq('id', eventId)
      .eq('tenant_id', this.config.tenantId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      eventType: data.event_type as SupportedEventType,
      name: data.primary_participant_name || 'Unnamed Event',
      status: data.is_active ? 'active' : 'draft',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tenantId: data.tenant_id
    };
  }

  /**
   * Update event status
   */
  async updateEventStatus(
    eventId: string,
    status: 'draft' | 'active' | 'completed' | 'cancelled'
  ): Promise<void> {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    switch (status) {
      case 'active':
        updates.is_active = true;
        break;
      case 'draft':
      case 'completed':
      case 'cancelled':
        updates.is_active = false;
        break;
    }

    const { error } = await this.supabase
      .from('event_participants')
      .update(updates)
      .eq('id', eventId)
      .eq('tenant_id', this.config.tenantId);

    if (error) throw error;
  }

  /**
   * Get multi-event dashboard data
   */
  async getDashboardData(): Promise<{
    totalEvents: number;
    activeEvents: number;
    eventsByType: Record<SupportedEventType, number>;
    recentEvents: EventInstance[];
    upcomingEvents: EventInstance[];
  }> {
    const allEvents = await this.getAllEvents({ limit: 100 });

    const activeEvents = allEvents.events.filter(event => event.status === 'active');
    const now = new Date();
    
    // Get upcoming events (events with future dates)
    const upcomingEvents = allEvents.events
      .filter(event => {
        // This would need to be adapted based on how event dates are stored
        return event.status === 'active';
      })
      .slice(0, 5);

    // Get recent events (recently created or updated)
    const recentEvents = allEvents.events
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalEvents: allEvents.totalCount,
      activeEvents: activeEvents.length,
      eventsByType: allEvents.eventTypeCounts,
      recentEvents,
      upcomingEvents
    };
  }

  /**
   * Search across all event types
   */
  async searchEvents(
    query: string,
    filters: {
      eventTypes?: SupportedEventType[];
      status?: 'all' | 'active' | 'draft';
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<EventInstance[]> {
    const searchResults = await this.eventTypeManager.searchEvents({
      tenantId: this.config.tenantId,
      query,
      eventTypes: filters.eventTypes || this.config.supportedEventTypes,
      dateRange: filters.dateRange,
      status: filters.status === 'all' ? 'all' : filters.status === 'active' ? 'active' : 'inactive'
    });

    const { data, error } = await searchResults;
    if (error) throw error;

    return (data || []).map(event => ({
      id: event.id,
      eventType: event.event_type as SupportedEventType,
      name: event.primary_participant_name || 'Unnamed Event',
      status: event.is_active ? 'active' : 'draft',
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      tenantId: event.tenant_id
    }));
  }

  /**
   * Adapt content fields for different event type
   */
  private adaptContentForEventType(content: any, eventType: SupportedEventType): any {
    const eventConfig = this.eventTypeManager.getEventTypeConfig(eventType);
    
    // Basic field mapping logic
    const adaptedContent = { ...content };
    
    // Remove type-specific fields and adapt to new type requirements
    delete adaptedContent.id;
    delete adaptedContent.created_at;
    delete adaptedContent.updated_at;
    
    // Add default fields for new event type
    eventConfig.requiredFields.forEach(field => {
      if (!(field in adaptedContent)) {
        adaptedContent[field] = ''; // Set empty default
      }
    });

    return adaptedContent;
  }

  /**
   * Get supported event types for this tenant
   */
  getSupportedEventTypes(): SupportedEventType[] {
    return this.config.supportedEventTypes;
  }

  /**
   * Check if cross-event operations are enabled
   */
  canPerformCrossEventOperations(): boolean {
    return this.config.enableCrossEventOperations;
  }
}

/**
 * Factory function to create multi-event support manager
 */
export function createMultiEventSupportManager(
  supabase: SupabaseClient,
  config: MultiEventConfig
): MultiEventSupportManager {
  return new MultiEventSupportManager(supabase, config);
}

/**
 * Default multi-event configuration
 */
export const DEFAULT_MULTI_EVENT_CONFIG: Omit<MultiEventConfig, 'tenantId'> = {
  supportedEventTypes: [
    'wedding',
    'conference',
    'birthday',
    'corporate',
    'seminar',
    'workshop',
    'graduation',
    'anniversary',
    'party',
    'exhibition'
  ],
  defaultEventType: 'wedding',
  enableCrossEventOperations: true
};