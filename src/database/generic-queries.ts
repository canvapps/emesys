/**
 * Generic Query Functions
 * 
 * Provides generic database query functions that work across different event types.
 * Supports wedding, conference, birthday, corporate events, and more.
 * 
 * Phase 2.2: Database Table Transformation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CompatibilityModeManager, createCompatibilityManager } from './compatibility-mode';

export interface EventTypeFilter {
  eventType: string;
  tenantId: string;
}

export interface GenericQueryOptions {
  tenantId: string;
  eventType?: string;
  compatibility?: CompatibilityModeManager;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Generic Event Participants Query Functions
 */
export class GenericParticipantsQuery {
  constructor(private supabase: SupabaseClient) {}

  async getParticipants(options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    return compatibility.executeQuery('event_participants', async (tableName) => {
      let query = this.supabase
        .from(tableName)
        .select('*')
        .eq('tenant_id', options.tenantId);

      // Apply event type filter if specified
      if (options.eventType && tableName === 'event_participants') {
        query = query.eq('event_type', options.eventType);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection === 'asc' 
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      return query;
    });
  }

  async createParticipant(data: any, options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    const participantData = {
      ...data,
      tenant_id: options.tenantId,
      event_type: options.eventType || 'wedding',
      created_at: new Date().toISOString()
    };

    return compatibility.executeQuery('event_participants', async (tableName) => {
      return this.supabase
        .from(tableName)
        .insert(participantData)
        .select()
        .single();
    });
  }
}

/**
 * Generic Event Content Query Functions
 */
export class GenericContentQuery {
  constructor(private supabase: SupabaseClient) {}

  async getContent(options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    return compatibility.executeQuery('event_content', async (tableName) => {
      let query = this.supabase
        .from(tableName)
        .select('*')
        .eq('tenant_id', options.tenantId);

      if (options.eventType && tableName === 'event_content') {
        query = query.eq('event_type', options.eventType);
      }

      return query;
    });
  }

  async updateContent(updates: any, options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    return compatibility.executeQuery('event_content', async (tableName) => {
      return this.supabase
        .from(tableName)
        .update(updateData)
        .eq('tenant_id', options.tenantId)
        .select();
    });
  }
}

/**
 * Generic Event Stories Query Functions
 */
export class GenericStoriesQuery {
  constructor(private supabase: SupabaseClient) {}

  async getStories(options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    return compatibility.executeQuery('event_stories', async (tableName) => {
      let query = this.supabase
        .from(tableName)
        .select('*')
        .eq('tenant_id', options.tenantId);

      if (options.eventType && tableName === 'event_stories') {
        query = query.eq('event_type', options.eventType);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection === 'asc' 
        });
      }

      return query;
    });
  }
}

/**
 * Generic Event Sections Query Functions
 */
export class GenericSectionsQuery {
  constructor(private supabase: SupabaseClient) {}

  async getSections(sectionType: string, options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    return compatibility.executeQuery('event_sections', async (tableName) => {
      let query = this.supabase
        .from(tableName)
        .select('*')
        .eq('tenant_id', options.tenantId);

      // Filter by section type (hero, participants, story, gallery, etc.)
      if (tableName === 'event_sections') {
        query = query.eq('section_type', sectionType);
      }

      if (options.eventType && tableName === 'event_sections') {
        query = query.eq('event_type', options.eventType);
      }

      return query;
    });
  }

  async updateSection(sectionType: string, updates: any, options: GenericQueryOptions) {
    const compatibility = options.compatibility || 
      createCompatibilityManager(this.supabase, {
        tenantId: options.tenantId,
        eventType: options.eventType || 'wedding'
      });

    const updateData = {
      ...updates,
      section_type: sectionType,
      event_type: options.eventType || 'wedding',
      updated_at: new Date().toISOString()
    };

    return compatibility.executeQuery('event_sections', async (tableName) => {
      return this.supabase
        .from(tableName)
        .update(updateData)
        .eq('tenant_id', options.tenantId)
        .eq('section_type', sectionType)
        .select();
    });
  }
}

/**
 * Main Generic Query Manager
 */
export class GenericQueryManager {
  public participants: GenericParticipantsQuery;
  public content: GenericContentQuery;
  public stories: GenericStoriesQuery;
  public sections: GenericSectionsQuery;

  constructor(private supabase: SupabaseClient) {
    this.participants = new GenericParticipantsQuery(supabase);
    this.content = new GenericContentQuery(supabase);
    this.stories = new GenericStoriesQuery(supabase);
    this.sections = new GenericSectionsQuery(supabase);
  }

  /**
   * Execute multi-table query across different event types
   */
  async executeMultiEventQuery(
    eventTypes: string[],
    tenantId: string,
    queryCallback: (eventType: string, options: GenericQueryOptions) => Promise<any>
  ) {
    const results = await Promise.allSettled(
      eventTypes.map(eventType => 
        queryCallback(eventType, { tenantId, eventType })
      )
    );

    return results.map((result, index) => ({
      eventType: eventTypes[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  /**
   * Get comprehensive event data for any event type
   */
  async getEventData(options: GenericQueryOptions) {
    const [participantsResult, contentResult, storiesResult] = await Promise.allSettled([
      this.participants.getParticipants(options),
      this.content.getContent(options),
      this.stories.getStories(options)
    ]);

    return {
      participants: participantsResult.status === 'fulfilled' ? participantsResult.value : null,
      content: contentResult.status === 'fulfilled' ? contentResult.value : null,
      stories: storiesResult.status === 'fulfilled' ? storiesResult.value : null,
      success: {
        participants: participantsResult.status === 'fulfilled',
        content: contentResult.status === 'fulfilled',
        stories: storiesResult.status === 'fulfilled'
      }
    };
  }
}

/**
 * Factory function to create generic query manager
 */
export function createGenericQueryManager(supabase: SupabaseClient): GenericQueryManager {
  return new GenericQueryManager(supabase);
}

/**
 * Event Type Filter utilities
 */
export const EventTypeFilters = {
  /**
   * Filter events by type
   */
  byEventType: (eventType: string): EventTypeFilter => ({
    eventType,
    tenantId: ''
  }),

  /**
   * Filter events by tenant
   */
  byTenant: (tenantId: string): Partial<EventTypeFilter> => ({
    tenantId
  }),

  /**
   * Combined filter
   */
  combined: (eventType: string, tenantId: string): EventTypeFilter => ({
    eventType,
    tenantId
  })
};