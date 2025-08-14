/**
 * BACKWARD COMPATIBILITY WRAPPER: useWeddingContent Hook
 * 
 * This hook provides backward compatibility for wedding-specific components
 * by wrapping the generic useEventContent hook and transforming data to wedding format.
 * 
 * Part of PHASE 2 TFD Implementation - Tactical File Completion
 */

import { useState, useEffect } from 'react';
import { useEventContent } from './useEventContent';
import { useToast } from './use-toast';
import type { 
  EventParticipants, 
  EventStory, 
  EventContent, 
  EventContact, 
  EventFooter 
} from './useEventContent';

// Legacy Wedding Content Types for backward compatibility
export interface WeddingCouple {
  bride: {
    name: string;
    fullName: string;
    father: string;
    mother: string;
    instagram?: string;
    image?: string;
    profession?: string;
    education?: string;
    hobbies?: string;
    description?: string;
  };
  groom: {
    name: string;
    fullName: string;
    father: string;
    mother: string;
    instagram?: string;
    image?: string;
    profession?: string;
    education?: string;
    hobbies?: string;
    description?: string;
  };
}

export interface WeddingLoveStory {
  title: string;
  content: string;
  timeline: Array<{
    date: string;
    title: string;
    description: string;
    image?: string;
  }>;
  fullStory?: string;
  isVisible: boolean;
}

export interface WeddingContent {
  couple: WeddingCouple | null;
  story: WeddingLoveStory | null;
  importantInfo: {
    title: string;
    dressCode: {
      title: string;
      description: string;
    };
    healthProtocol: {
      title: string;
      description: string;
    };
    additionalInfo: string;
    downloadInvitation: {
      enabled: boolean;
      text: string;
    };
  } | null;
  contact: {
    title: string;
    description?: string;
    whatsapp?: {
      number: string;
      text: string;
    };
    email?: {
      address: string;
      text: string;
    };
  } | null;
  footer: {
    coupleNames: string;
    weddingDate: string;
    description?: string;
    thankYou: {
      title: string;
      message?: string;
    };
    socialButtons: Array<{
      text: string;
      action: string;
      type?: string;
    }>;
    copyright?: string;
  } | null;
}

/**
 * Wedding Content Hook - Backward Compatibility Wrapper
 * Wraps useEventContent and transforms generic data to wedding-specific format
 */
export const useWeddingContent = () => {
  const eventData = useEventContent('wedding');
  const {
    participants,
    eventStory,
    eventContent,
    eventContact,
    eventFooter,
    loading,
    error,
    refreshContent
  } = eventData;
  
  const [weddingContent, setWeddingContent] = useState<WeddingContent | null>(null);
  const { toast } = useToast();

  // Transform generic participants to wedding couple format
  const transformToWeddingCouple = (participants: EventParticipants[]): WeddingCouple | null => {
    const bride = participants.find(p => p.participant_role === 'bride');
    const groom = participants.find(p => p.participant_role === 'groom');
    
    if (!bride || !groom) return null;

    return {
      bride: {
        name: bride.participant_name || '',
        fullName: bride.participant_full_name || bride.participant_name || '',
        father: bride.participant_parents?.split(' & ')[0] || '',
        mother: bride.participant_parents?.split(' & ')[1] || '',
        instagram: '',
        image: bride.participant_image_url,
        profession: bride.participant_profession,
        education: bride.participant_education,
        hobbies: bride.participant_hobbies,
        description: bride.participant_description
      },
      groom: {
        name: groom.participant_name || '',
        fullName: groom.participant_full_name || groom.participant_name || '',
        father: groom.participant_parents?.split(' & ')[0] || '',
        mother: groom.participant_parents?.split(' & ')[1] || '',
        instagram: '',
        image: groom.participant_image_url,
        profession: groom.participant_profession,
        education: groom.participant_education,
        hobbies: groom.participant_hobbies,
        description: groom.participant_description
      }
    };
  };

  // Transform generic story to wedding love story format
  const transformToWeddingStory = (eventStory: EventStory | null): WeddingLoveStory | null => {
    if (!eventStory) return null;

    return {
      title: eventStory.title || '',
      content: eventStory.description || '',
      timeline: eventStory.timeline_items?.map(item => ({
        date: item.year,
        title: item.title,
        description: item.description,
        image: item.image_url
      })) || [],
      fullStory: eventStory.full_story,
      isVisible: eventStory.is_visible
    };
  };

  // Transform generic content to wedding important info format
  const transformToImportantInfo = (eventContent: EventContent[]) => {
    const infoContent = eventContent.find(c => c.content_type === 'instructions' || c.content_type === 'info');
    if (!infoContent) return null;

    return {
      title: infoContent.title || 'Informasi Penting',
      dressCode: {
        title: infoContent.content_data?.dress_code?.title || 'Dress Code',
        description: infoContent.content_data?.dress_code?.description || ''
      },
      healthProtocol: {
        title: infoContent.content_data?.health_protocol?.title || 'Protokol Kesehatan',
        description: infoContent.content_data?.health_protocol?.description || ''
      },
      additionalInfo: infoContent.content_data?.additional_info || '',
      downloadInvitation: {
        enabled: infoContent.content_data?.download_invitation?.enabled || false,
        text: infoContent.content_data?.download_invitation?.text || 'Unduh Undangan'
      }
    };
  };

  // Transform generic contact to wedding contact format
  const transformToWeddingContact = (eventContact: EventContact | null) => {
    if (!eventContact) return null;

    const whatsappMethod = eventContact.contact_methods.find(m => m.type === 'whatsapp');
    const emailMethod = eventContact.contact_methods.find(m => m.type === 'email');

    return {
      title: eventContact.title || 'Bantuan',
      description: eventContact.description,
      whatsapp: whatsappMethod ? {
        number: whatsappMethod.value,
        text: whatsappMethod.display_text || whatsappMethod.label
      } : undefined,
      email: emailMethod ? {
        address: emailMethod.value,
        text: emailMethod.display_text || emailMethod.label
      } : undefined
    };
  };

  // Transform generic footer to wedding footer format
  const transformToWeddingFooter = (eventFooter: EventFooter | null) => {
    if (!eventFooter) return null;

    return {
      coupleNames: eventFooter.event_title || '',
      weddingDate: eventFooter.event_date || '',
      description: eventFooter.footer_description,
      thankYou: {
        title: eventFooter.thank_you_section?.title || 'Terima Kasih',
        message: eventFooter.thank_you_section?.message
      },
      socialButtons: eventFooter.social_actions || [],
      copyright: eventFooter.copyright_text
    };
  };

  // Update wedding content when generic data changes
  useEffect(() => {
    const transformedContent: WeddingContent = {
      couple: transformToWeddingCouple(participants),
      story: transformToWeddingStory(eventStory),
      importantInfo: transformToImportantInfo(eventContent),
      contact: transformToWeddingContact(eventContact),
      footer: transformToWeddingFooter(eventFooter)
    };

    setWeddingContent(transformedContent);
  }, [participants, eventStory, eventContent, eventContact, eventFooter]);

  // Legacy update functions (read-only for now)
  const updateCouple = async (coupleData: Partial<WeddingCouple>) => {
    console.warn('updateCouple: Not implemented in compatibility mode');
    toast({
      title: "Info",
      description: "Couple updates will be available after database migration",
    });
  };

  const updateStory = async (storyData: Partial<WeddingLoveStory>) => {
    console.warn('updateStory: Not implemented in compatibility mode');
    toast({
      title: "Info",
      description: "Story updates will be available after database migration",
    });
  };

  const updateImportantInfo = async (infoData: any) => {
    console.warn('updateImportantInfo: Not implemented in compatibility mode');
    toast({
      title: "Info",
      description: "Important info updates will be available after database migration",
    });
  };

  return {
    // Wedding-specific data
    weddingContent,
    couple: weddingContent?.couple,
    story: weddingContent?.story,
    importantInfo: weddingContent?.importantInfo,
    contact: weddingContent?.contact,
    footer: weddingContent?.footer,
    
    // State
    loading,
    error,
    
    // Actions (compatibility mode - read-only for now)
    updateCouple,
    updateStory,
    updateImportantInfo,
    refreshContent,
    
    // Helper functions
    getGroomName: () => weddingContent?.couple?.groom?.name || '',
    getBrideName: () => weddingContent?.couple?.bride?.name || '',
    getGroomFullName: () => weddingContent?.couple?.groom?.fullName || '',
    getBrideFullName: () => weddingContent?.couple?.bride?.fullName || '',
    hasStory: () => !!weddingContent?.story && weddingContent.story.isVisible,
    hasImportantInfo: () => !!weddingContent?.importantInfo,
    hasContact: () => !!weddingContent?.contact,
    hasFooter: () => !!weddingContent?.footer,
    
    // Compatibility flags
    compatibilityMode: 'wedding-wrapper',
    isBackwardCompatible: true
  };
};

// Export default for backward compatibility
export default useWeddingContent;