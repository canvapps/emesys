// ================================================================================================
// GENERIC EVENT CONTENT HOOK - PHASE 2.3 TRANSFORMATION
// ================================================================================================
// This hook provides comprehensive event content management for the Generic Event Management Engine
// Part of Phase 2.3 TFD Implementation with comprehensive compatibility layer
// Supports wedding, conference, birthday, seminar, and other event types
// Features: backward compatibility, loading states, error handling, TypeScript interfaces
// ================================================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { createGenericQueryManager, EventTypeFilters } from '../database/generic-queries';
import { SupportedEventType, EventTypeUtils, EVENT_TYPE_REGISTRY } from '../database/event-type-filter';
import { createMultiEventSupportManager, DEFAULT_MULTI_EVENT_CONFIG } from '../database/multi-event-support';
import { DatabaseMode, createCompatibilityManager } from '../database/compatibility-mode';

// ========================================
// GENERIC EVENT MANAGEMENT ENGINE TYPES
// ========================================

export interface EventParticipants {
  id: string;
  participant_type: 'primary' | 'secondary' | 'organizer' | 'guest';
  participant_name: string;
  participant_full_name: string;
  participant_parents?: string;
  participant_profession?: string;
  participant_education?: string;
  participant_hobbies?: string;
  participant_description?: string;
  participant_image_url?: string;
  participant_role?: string;
  participant_order: number;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventStory {
  id: string;
  story_type: 'timeline' | 'narrative' | 'gallery' | 'custom';
  title: string;
  subtitle?: string;
  description?: string;
  timeline_items?: Array<{
    year: string;
    title: string;
    description: string;
    image_url?: string;
  }>;
  full_story?: string;
  story_metadata?: Record<string, any>;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventContent {
  id: string;
  content_type: 'info' | 'instructions' | 'requirements' | 'contact' | 'footer' | 'hero' | 'custom';
  title: string;
  subtitle?: string;
  description?: string;
  content_data: Record<string, any>;
  display_config?: {
    layout?: string;
    style?: string;
    show_icons?: boolean;
    custom_fields?: Record<string, any>;
  };
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventContact {
  id: string;
  contact_type: 'help' | 'support' | 'organizer' | 'venue';
  title: string;
  description?: string;
  contact_methods: Array<{
    type: 'phone' | 'email' | 'whatsapp' | 'website' | 'social';
    label: string;
    value: string;
    display_text?: string;
  }>;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventFooter {
  id: string;
  event_title: string;
  event_date: string;
  footer_description?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  thank_you_section: {
    title: string;
    message?: string;
  };
  social_actions: Array<{
    text: string;
    action: string;
    type?: string;
  }>;
  copyright_text?: string;
  footer_metadata?: Record<string, any>;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenericEvent {
  id: string;
  event_type: string;
  title: string;
  description?: string;
  category?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_info: {
    name: string;
    address: string;
    city: string;
    province: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  requirements?: {
    dress_code?: string;
    items_to_bring?: Array<string>;
    special_instructions?: string;
  };
  contact_person?: {
    name: string;
    phone: string;
    email?: string;
  };
  event_metadata?: Record<string, any>;
  is_visible: boolean;
  show_on_timeline: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventHeroSettings {
  id: string;
  event_type: string;
  primary_participants: Array<string>;
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
  hero_metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventPlugin {
  name: string;
  type: string;
  version: string;
  config: Record<string, any>;
}

// ========================================
// MAIN HOOK WITH COMPATIBILITY LAYER
// ========================================

export const useEventContent = (eventType?: string) => {
  const [participants, setParticipants] = useState<EventParticipants[]>([]);
  const [eventStory, setEventStory] = useState<EventStory | null>(null);
  const [eventContent, setEventContent] = useState<EventContent[]>([]);
  const [eventContact, setEventContact] = useState<EventContact | null>(null);
  const [eventFooter, setEventFooter] = useState<EventFooter | null>(null);
  const [events, setEvents] = useState<GenericEvent[]>([]);
  const [heroSettings, setHeroSettings] = useState<EventHeroSettings | null>(null);
  const [activePlugin, setActivePlugin] = useState<EventPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true); // Dual loading state for consistent patterns
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // ========================================
  // DATA TRANSFORMATION HELPERS
  // ========================================
  
  const transformWeddingToParticipants = (coupleData: any): EventParticipants[] => {
    if (!coupleData) return [];
    return [
      {
        id: `${coupleData.id}-groom`,
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
        metadata: { type: 'wedding', role: 'groom' },
        is_active: coupleData.is_active,
        created_at: coupleData.created_at,
        updated_at: coupleData.updated_at
      },
      {
        id: `${coupleData.id}-bride`,
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
        metadata: { type: 'wedding', role: 'bride' },
        is_active: coupleData.is_active,
        created_at: coupleData.created_at,
        updated_at: coupleData.updated_at
      }
    ];
  };

  const transformWeddingToEventStory = (loveStoryData: any): EventStory | null => {
    if (!loveStoryData) return null;
    return {
      id: loveStoryData.id,
      story_type: 'timeline',
      title: loveStoryData.title,
      subtitle: loveStoryData.subtitle,
      description: loveStoryData.description,
      timeline_items: loveStoryData.timeline_items,
      full_story: loveStoryData.full_story,
      story_metadata: { type: 'wedding' },
      is_visible: loveStoryData.is_visible,
      display_order: 1,
      created_at: loveStoryData.created_at,
      updated_at: loveStoryData.updated_at
    };
  };

  const transformWeddingToEventContent = (importantInfo: any): EventContent[] => {
    if (!importantInfo) return [];
    return [{
      id: importantInfo.id,
      content_type: 'instructions',
      title: importantInfo.title,
      description: 'Event important information',
      content_data: {
        dress_code: {
          title: importantInfo.dress_code_title,
          description: importantInfo.dress_code_description
        },
        health_protocol: {
          title: importantInfo.health_protocol_title,
          description: importantInfo.health_protocol_description
        },
        additional_info: importantInfo.additional_info,
        download_invitation: {
          enabled: importantInfo.download_invitation_enabled,
          text: importantInfo.download_invitation_text
        }
      },
      display_config: { layout: 'two-column', style: 'elegant' },
      is_visible: importantInfo.is_visible,
      display_order: 1,
      created_at: importantInfo.created_at,
      updated_at: importantInfo.updated_at
    }];
  };

  const transformWeddingToEventContact = (contactData: any): EventContact | null => {
    if (!contactData) return null;
    const contactMethods = [];
    
    if (contactData.whatsapp_number) {
      contactMethods.push({
        type: 'whatsapp',
        label: contactData.whatsapp_text,
        value: contactData.whatsapp_number,
        display_text: contactData.whatsapp_text
      });
    }
    
    if (contactData.email_address) {
      contactMethods.push({
        type: 'email',
        label: contactData.email_text,
        value: contactData.email_address,
        display_text: contactData.email_text
      });
    }
    
    return {
      id: contactData.id,
      contact_type: 'help',
      title: contactData.help_title,
      description: contactData.help_description,
      contact_methods: contactMethods,
      is_visible: contactData.is_visible,
      display_order: 1,
      created_at: contactData.created_at,
      updated_at: contactData.updated_at
    };
  };

  const transformWeddingToEventFooter = (footerData: any): EventFooter | null => {
    if (!footerData) return null;
    return {
      id: footerData.id,
      event_title: footerData.couple_names,
      event_date: footerData.wedding_date,
      footer_description: footerData.footer_description,
      contact_info: {
        phone: footerData.contact_phone,
        email: footerData.contact_email,
        address: footerData.contact_address
      },
      thank_you_section: {
        title: footerData.thank_you_title,
        message: footerData.thank_you_message
      },
      social_actions: footerData.social_buttons || [],
      copyright_text: footerData.copyright_text,
      footer_metadata: { type: 'wedding' },
      is_visible: footerData.is_visible,
      created_at: footerData.created_at,
      updated_at: footerData.updated_at
    };
  };

  const transformWeddingToEventHero = (heroData: any): EventHeroSettings | null => {
    if (!heroData) return null;
    return {
      id: heroData.id,
      event_type: 'wedding',
      primary_participants: [heroData.groom_name, heroData.bride_name],
      event_date: heroData.wedding_date,
      event_time: heroData.wedding_time,
      primary_venue: {
        name: heroData.ceremony_venue_name,
        address: heroData.ceremony_venue_address
      },
      secondary_venue: heroData.reception_venue_name ? {
        name: heroData.reception_venue_name,
        address: heroData.reception_venue_address
      } : undefined,
      hero_content: {
        subtitle: heroData.hero_subtitle,
        description: heroData.hero_description,
        background_image: heroData.hero_background_image
      },
      countdown_enabled: heroData.countdown_enabled,
      hero_metadata: { type: 'wedding' },
      is_active: heroData.is_active,
      created_at: heroData.created_at,
      updated_at: heroData.updated_at
    };
  };

  // ========================================
  // GENERIC QUERY FUNCTIONS
  // ========================================
  
  // Create query manager instance
  const queryManager = createGenericQueryManager(supabase);
  
  const fetchEventParticipants = async (eventType: string, tenantId: string) => {
    return await queryManager.participants.getParticipants({
      eventType,
      tenantId
    });
  };

  const getEventParticipants = fetchEventParticipants; // Alias for test compatibility

  // Multi-event support
  const multiEventOperations = createMultiEventSupportManager(supabase, {
    ...DEFAULT_MULTI_EVENT_CONFIG,
    tenantId: 'current-tenant'
  });

  // ========================================
  // MAIN DATA FETCHING FUNCTION
  // ========================================
  
  const fetchAllEventData = async () => {
    try {
      setIsLoading(true);
      setLoading(true); // Dual loading state for consistent patterns
      setError(null);

      // Support multiple event types: wedding, conference, birthday, corporate, etc.
      const currentEventType = eventType || 'wedding';
      
      // Get supported event types from registry
      const SUPPORTED_EVENT_TYPES = Object.keys(EVENT_TYPE_REGISTRY) as SupportedEventType[];
      
      // Validate event type
      if (!SUPPORTED_EVENT_TYPES.includes(currentEventType as SupportedEventType)) {
        console.warn(`Unsupported event type: ${currentEventType}. Supported types:`, SUPPORTED_EVENT_TYPES);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.id;

      if (!tenantId) {
        throw new Error('User authentication required');
      }

      // GENERIC TABLE QUERIES WITH FALLBACK TO LEGACY TABLES
      
      // 1. Fetch participants from generic event_participants table
      let participantsData: any[] | null = null;
      let participantsError: any = null;

      try {
        // Generic event_participants query with event_type WHERE filtering
        const participantsQuery = await (supabase as any)
          .from('event_participants')
          .select(`
            *,
            events!inner(event_type, tenant_id)
          `)
          .eq('events.event_type', currentEventType) // WHERE event_type filter
          .eq('events.tenant_id', tenantId)
          .eq('is_active', true)
          .order('participant_order', { ascending: true });

        participantsData = participantsQuery.data;
        participantsError = participantsQuery.error;
      } catch (err) {
        participantsError = err;
        console.warn('Generic event_participants table not available, using fallback');
      }

      if (participantsError) {
        console.warn('Generic participants table not ready, falling back to wedding_couple_info:', participantsError);
        // Legacy compatibility: Fallback to legacy table
        const { data: coupleData, error: coupleError } = await supabase
          .from('wedding_couple_info')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!coupleError && coupleData) {
          setParticipants(transformWeddingToParticipants(coupleData));
        }
      } else if (participantsData) {
        // Transform generic participants to EventParticipants format
        const genericParticipants: EventParticipants[] = participantsData.map((p, index) => ({
          id: p.id,
          participant_type: p.is_primary ? 'primary' : 'secondary',
          participant_name: p.participant_name,
          participant_full_name: p.participant_full_name,
          participant_parents: p.participant_data?.parents || '',
          participant_profession: p.participant_data?.profession || '',
          participant_education: p.participant_data?.education || '',
          participant_hobbies: p.participant_data?.hobbies || '',
          participant_description: p.bio || '',
          participant_image_url: p.participant_image_url,
          participant_role: p.participant_role,
          participant_order: p.participant_order,
          metadata: { type: currentEventType, ...p.participant_data },
          is_active: p.is_active,
          created_at: p.created_at,
          updated_at: p.updated_at
        }));
        setParticipants(genericParticipants);
      }

      // 2. Fetch stories from generic event_stories table
      let storiesData: any | null = null;
      let storiesError: any = null;

      try {
        const storiesQuery = await (supabase as any)
          .from('event_stories')
          .select(`
            *,
            events!inner(event_type, tenant_id)
          `)
          .eq('events.event_type', currentEventType)
          .eq('events.tenant_id', tenantId)
          .eq('is_published', true)
          .order('display_order', { ascending: true })
          .limit(1)
          .maybeSingle();

        storiesData = storiesQuery.data;
        storiesError = storiesQuery.error;
      } catch (err) {
        storiesError = err;
        console.warn('Generic event_stories table not available, using fallback');
      }

      if (storiesError) {
        console.warn('Generic stories table not ready, falling back to wedding_love_story:', storiesError);
        // Legacy compatibility: Fallback to legacy table
        const { data: loveStoryData, error: storyError } = await supabase
          .from('wedding_love_story')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!storyError && loveStoryData) {
          setEventStory(transformWeddingToEventStory(loveStoryData));
        }
      } else if (storiesData) {
        // Transform generic story to EventStory format
        const genericStory: EventStory = {
          id: storiesData.id,
          story_type: storiesData.story_type || 'timeline',
          title: storiesData.title,
          subtitle: storiesData.story_config?.subtitle || '',
          description: storiesData.content || '',
          timeline_items: storiesData.timeline_items || [],
          full_story: storiesData.content,
          story_metadata: { type: currentEventType, ...storiesData.story_config },
          is_visible: storiesData.is_published,
          display_order: storiesData.display_order,
          created_at: storiesData.created_at,
          updated_at: storiesData.updated_at
        };
        setEventStory(genericStory);
      }

      // 3. Fetch content from generic event_content table
      let contentData: any[] | null = null;
      let contentError: any = null;

      try {
        // Generic event_content query with event_type WHERE filtering
        const contentQuery = await (supabase as any)
          .from('event_content')
          .select(`
            *,
            events!inner(event_type, tenant_id)
          `)
          .eq('events.event_type', currentEventType) // WHERE event_type filter
          .eq('events.tenant_id', tenantId)
          .eq('is_published', true)
          .order('display_order', { ascending: true });

        contentData = contentQuery.data;
        contentError = contentQuery.error;
      } catch (err) {
        contentError = err;
        console.warn('Generic event_content table not available, using fallback');
      }

      if (contentError) {
        console.warn('Generic content table not ready, falling back to wedding_important_info:', contentError);
        // Legacy compatibility: Fallback to legacy table
        const { data: importantInfoData, error: legacyContentError } = await supabase
          .from('wedding_important_info')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!legacyContentError && importantInfoData) {
          setEventContent(transformWeddingToEventContent(importantInfoData));
        }
      } else if (contentData) {
        // Transform generic content to EventContent format
        const genericContent: EventContent[] = contentData.map(c => ({
          id: c.id,
          content_type: c.content_type || 'info',
          title: c.title || 'Event Information',
          subtitle: c.content_data?.subtitle || '',
          description: c.content || '',
          content_data: c.content_data || {},
          display_config: {
            layout: c.content_data?.layout || 'default',
            style: c.content_data?.style || 'default',
            show_icons: c.content_data?.show_icons || false
          },
          is_visible: c.is_published,
          display_order: c.display_order,
          created_at: c.created_at,
          updated_at: c.updated_at
        }));
        setEventContent(genericContent);

        // Extract contact info from content (check for contact type or fallback)
        const contactContent = genericContent.find(c => c.content_type === 'contact') ||
                              genericContent.find(c => c.title?.toLowerCase().includes('contact'));
        if (contactContent) {
          const contactInfo: EventContact = {
            id: contactContent.id,
            contact_type: 'help',
            title: contactContent.title,
            description: contactContent.description,
            contact_methods: contactContent.content_data?.contact_methods || [],
            is_visible: contactContent.is_visible,
            display_order: contactContent.display_order,
            created_at: contactContent.created_at,
            updated_at: contactContent.updated_at
          };
          setEventContact(contactInfo);
        }

        // Extract footer info from content (check for footer type or fallback)
        const footerContent = genericContent.find(c => c.content_type === 'footer') ||
                             genericContent.find(c => c.title?.toLowerCase().includes('footer'));
        if (footerContent) {
          const footerInfo: EventFooter = {
            id: footerContent.id,
            event_title: footerContent.title,
            event_date: footerContent.content_data?.event_date || '',
            footer_description: footerContent.description,
            contact_info: footerContent.content_data?.contact_info || {},
            thank_you_section: footerContent.content_data?.thank_you_section || { title: 'Thank You' },
            social_actions: footerContent.content_data?.social_actions || [],
            copyright_text: footerContent.content_data?.copyright_text,
            footer_metadata: { type: currentEventType, ...footerContent.content_data },
            is_visible: footerContent.is_visible,
            created_at: footerContent.created_at,
            updated_at: footerContent.updated_at
          };
          setEventFooter(footerInfo);
        }
      } else {
        // Fallback to legacy tables for contact and footer
        const { data: contactData, error: contactError } = await supabase
          .from('wedding_contact_info')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!contactError && contactData) {
          setEventContact(transformWeddingToEventContact(contactData));
        }

        const { data: footerData, error: footerError } = await supabase
          .from('wedding_footer_content')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!footerError && footerData) {
          setEventFooter(transformWeddingToEventFooter(footerData));
        }
      }

      // 4. Fetch sections from generic event_sections table
      let sectionsData: any[] | null = null;
      let sectionsError: any = null;

      try {
        const sectionsQuery = await (supabase as any)
          .from('event_sections')
          .select(`
            *,
            events!inner(event_type, tenant_id)
          `)
          .eq('events.event_type', currentEventType)
          .eq('events.tenant_id', tenantId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        sectionsData = sectionsQuery.data;
        sectionsError = sectionsQuery.error;
      } catch (err) {
        sectionsError = err;
        console.warn('Generic event_sections table not available, using fallback');
      }

      if (sectionsError) {
        console.warn('Generic sections table not ready:', sectionsError);
      }

      // 5. Fetch events (generic events list)
      let eventsData: any[] | null = null;
      let eventsError: any = null;

      try {
        const eventsQuery = await (supabase as any)
          .from('events')
          .select('*')
          .eq('event_type', currentEventType)
          .eq('tenant_id', tenantId)
          .eq('status', 'published')
          .order('event_date', { ascending: true });

        eventsData = eventsQuery.data;
        eventsError = eventsQuery.error;
      } catch (err) {
        eventsError = err;
        console.warn('Generic events table not available, using empty array');
        eventsData = [];
      }

      if (!eventsError && eventsData) {
        const genericEvents: GenericEvent[] = eventsData.map(e => ({
          id: e.id,
          event_type: e.event_type,
          title: e.title,
          description: e.description,
          category: e.settings?.category || currentEventType,
          event_date: e.event_date,
          start_time: e.event_time || '00:00',
          end_time: e.settings?.end_time || '23:59',
          venue_info: e.settings?.venue_info || {
            name: 'TBD',
            address: 'TBD',
            city: 'TBD',
            province: 'TBD'
          },
          requirements: e.settings?.requirements || {},
          contact_person: e.settings?.contact_person || {},
          event_metadata: { type: currentEventType, ...e.settings },
          is_visible: e.status === 'published',
          show_on_timeline: e.settings?.show_on_timeline !== false,
          display_order: 1,
          created_at: e.created_at,
          updated_at: e.updated_at
        }));
        setEvents(genericEvents);
      } else {
        setEvents([]);
      }

      // 6. Handle hero settings (could be in event_content or events table)
      const heroContent = contentData?.find(c => c.content_type === 'hero') ||
                         eventsData?.[0]; // Use first event as hero source

      if (heroContent) {
        const heroSettings: EventHeroSettings = {
          id: heroContent.id,
          event_type: currentEventType,
          primary_participants: participantsData?.filter(p => p.is_primary).map(p => p.participant_name) || [],
          event_date: heroContent.event_date || heroContent.content_data?.event_date || '',
          event_time: heroContent.event_time || heroContent.content_data?.event_time || '',
          primary_venue: heroContent.settings?.venue_info || heroContent.content_data?.venue_info || {
            name: 'TBD',
            address: 'TBD'
          },
          hero_content: {
            subtitle: heroContent.subtitle || heroContent.content_data?.subtitle || '',
            description: heroContent.description || heroContent.content_data?.description || '',
            background_image: heroContent.settings?.hero_image || heroContent.content_data?.background_image
          },
          countdown_enabled: heroContent.settings?.countdown_enabled !== false,
          hero_metadata: { type: currentEventType, ...heroContent.settings },
          is_active: heroContent.status === 'published' || heroContent.is_published === true,
          created_at: heroContent.created_at,
          updated_at: heroContent.updated_at
        };
        setHeroSettings(heroSettings);
      }

      // Set plugin info
      setActivePlugin({
        name: 'Event Management Plugin',
        type: currentEventType,
        version: '2.0.0',
        config: {
          compatibility_mode: false,
          generic_mode: true,
          tenant_id: tenantId,
          event_type: currentEventType
        }
      });

    } catch (err) {
      console.error('Error in fetchAllEventData:', err);
      setError('Failed to load event content');
    } finally {
      setIsLoading(false);
      setLoading(false); // Dual loading state for consistent patterns
    }
  };

  // ========================================
  // SIMPLIFIED UPDATE FUNCTIONS (READ-ONLY FOR NOW)
  // ========================================
  
  const updateParticipants = async (updates: Partial<EventParticipants>, participantId: string) => {
    console.warn('updateParticipants: Not implemented in compatibility mode');
    toast({
      title: "Info",
      description: "Participant updates will be available after database migration",
    });
  };

  const updateEventStory = async (updates: Partial<EventStory>) => {
    console.warn('updateEventStory: Not implemented in compatibility mode');
    toast({
      title: "Info", 
      description: "Story updates will be available after database migration",
    });
  };

  const updateEventContent = async (updates: Partial<EventContent>, contentId: string) => {
    console.warn('updateEventContent: Not implemented in compatibility mode');
    toast({
      title: "Info",
      description: "Content updates will be available after database migration",
    });
  };

  const updateHeroSettings = async (updates: Partial<EventHeroSettings>) => {
    console.warn('updateHeroSettings: Not implemented in compatibility mode');
    toast({
      title: "Info",
      description: "Hero settings updates will be available after database migration",
    });
  };

  // ========================================
  // LIFECYCLE
  // ========================================
  
  useEffect(() => {
    fetchAllEventData();
  }, [eventType]);

  return {
    // Data
    participants,
    eventStory,
    eventContent,
    eventContact,
    eventFooter,
    events,
    heroSettings,
    activePlugin,
    
    // State
    loading,
    isLoading,
    error,
    
    // Actions (compatibility mode - read-only for now)
    updateParticipants,
    updateEventStory,
    updateEventContent,
    updateHeroSettings,
    refreshContent: fetchAllEventData,
    
    // Plugin support
    eventType: eventType || activePlugin?.type || 'generic',
  };
};

// ================================================================================================
// LEGACY COMPATIBILITY LAYER
// ================================================================================================

// Wedding-specific content hook that uses the generic event content hook
export const useWeddingContent = (eventId?: string) => {
  return useEventContent('wedding');
};

// Backward compatibility aliases
export const useWeddingContentCompatibility = useWeddingContent;
export const useEventContentCompatibility = useEventContent;

export default useEventContent;