import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface CoupleInfo {
  id: string;
  bride_name: string;
  bride_full_name: string;
  bride_parents: string;
  bride_profession?: string;
  bride_education?: string;
  bride_hobbies?: string;
  bride_description?: string;
  bride_image_url?: string;
  groom_name: string;
  groom_full_name: string;
  groom_parents: string;
  groom_profession?: string;
  groom_education?: string;
  groom_hobbies?: string;
  groom_description?: string;
  groom_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoveStory {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  timeline_items: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  full_story?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportantInfo {
  id: string;
  title: string;
  dress_code_title: string;
  dress_code_description?: string;
  health_protocol_title: string;
  health_protocol_description?: string;
  additional_info: Array<{
    title: string;
    description: string;
  }>;
  download_invitation_enabled: boolean;
  download_invitation_text: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  id: string;
  help_title: string;
  help_description?: string;
  whatsapp_number?: string;
  whatsapp_text: string;
  email_address?: string;
  email_text: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterContent {
  id: string;
  couple_names: string;
  wedding_date: string;
  footer_description?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  thank_you_title: string;
  thank_you_message?: string;
  social_buttons: Array<{
    text: string;
    action: string;
  }>;
  copyright_text?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'akad' | 'resepsi' | 'other';
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_province: string;
  venue_latitude?: number;
  venue_longitude?: number;
  dress_code?: string;
  contact_person?: string;
  contact_phone?: string;
  is_visible: boolean;
  show_on_timeline: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useWeddingContent = () => {
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null);
  const [loveStory, setLoveStory] = useState<LoveStory | null>(null);
  const [importantInfo, setImportantInfo] = useState<ImportantInfo | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all wedding content
  const fetchAllContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch couple info
      const { data: coupleData, error: coupleError } = await supabase
        .from('wedding_couple_info')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (coupleError) {
        console.error('Error fetching couple info:', coupleError);
      } else {
        setCoupleInfo(coupleData);
      }

      // Fetch love story
      const { data: loveStoryData, error: loveStoryError } = await supabase
        .from('wedding_love_story')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (loveStoryError) {
        console.error('Error fetching love story:', loveStoryError);
      } else {
        setLoveStory(loveStoryData);
      }

      // Fetch important info
      const { data: importantInfoData, error: importantInfoError } = await supabase
        .from('wedding_important_info')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (importantInfoError) {
        console.error('Error fetching important info:', importantInfoError);
      } else {
        setImportantInfo(importantInfoData);
      }

      // Fetch contact info
      const { data: contactInfoData, error: contactInfoError } = await supabase
        .from('wedding_contact_info')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contactInfoError) {
        console.error('Error fetching contact info:', contactInfoError);
      } else {
        setContactInfo(contactInfoData);
      }

      // Fetch footer content
      const { data: footerData, error: footerError } = await supabase
        .from('wedding_footer_content')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (footerError) {
        console.error('Error fetching footer content:', footerError);
      } else {
        setFooterContent(footerData);
      }

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('wedding_events')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        setEvents(eventsData || []);
      }

    } catch (err) {
      console.error('Error in fetchAllContent:', err);
      setError('Failed to load wedding content');
    } finally {
      setIsLoading(false);
    }
  };

  // Update couple info
  const updateCoupleInfo = async (updates: Partial<CoupleInfo>) => {
    if (!coupleInfo) return;

    try {
      const { data, error } = await supabase
        .from('wedding_couple_info')
        .update(updates)
        .eq('id', coupleInfo.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update couple information",
          variant: "destructive",
        });
        return;
      }

      setCoupleInfo(data);
      toast({
        title: "Success",
        description: "Couple information updated successfully",
      });
    } catch (err) {
      console.error('Error updating couple info:', err);
      toast({
        title: "Error",
        description: "Failed to update couple information",
        variant: "destructive",
      });
    }
  };

  // Update love story
  const updateLoveStory = async (updates: Partial<LoveStory>) => {
    if (!loveStory) return;

    try {
      const { data, error } = await supabase
        .from('wedding_love_story')
        .update(updates)
        .eq('id', loveStory.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update love story",
          variant: "destructive",
        });
        return;
      }

      setLoveStory(data);
      toast({
        title: "Success",
        description: "Love story updated successfully",
      });
    } catch (err) {
      console.error('Error updating love story:', err);
      toast({
        title: "Error",
        description: "Failed to update love story",
        variant: "destructive",
      });
    }
  };

  // Update important info
  const updateImportantInfo = async (updates: Partial<ImportantInfo>) => {
    if (!importantInfo) return;

    try {
      const { data, error } = await supabase
        .from('wedding_important_info')
        .update(updates)
        .eq('id', importantInfo.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update important information",
          variant: "destructive",
        });
        return;
      }

      setImportantInfo(data);
      toast({
        title: "Success",
        description: "Important information updated successfully",
      });
    } catch (err) {
      console.error('Error updating important info:', err);
      toast({
        title: "Error",
        description: "Failed to update important information",
        variant: "destructive",
      });
    }
  };

  // Update contact info
  const updateContactInfo = async (updates: Partial<ContactInfo>) => {
    if (!contactInfo) return;

    try {
      const { data, error } = await supabase
        .from('wedding_contact_info')
        .update(updates)
        .eq('id', contactInfo.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update contact information",
          variant: "destructive",
        });
        return;
      }

      setContactInfo(data);
      toast({
        title: "Success",
        description: "Contact information updated successfully",
      });
    } catch (err) {
      console.error('Error updating contact info:', err);
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive",
      });
    }
  };

  // Update footer content
  const updateFooterContent = async (updates: Partial<FooterContent>) => {
    if (!footerContent) return;

    try {
      const { data, error } = await supabase
        .from('wedding_footer_content')
        .update(updates)
        .eq('id', footerContent.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update footer content",
          variant: "destructive",
        });
        return;
      }

      setFooterContent(data);
      toast({
        title: "Success",
        description: "Footer content updated successfully",
      });
    } catch (err) {
      console.error('Error updating footer content:', err);
      toast({
        title: "Error",
        description: "Failed to update footer content",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllContent();
  }, []);

  return {
    coupleInfo,
    loveStory,
    importantInfo,
    contactInfo,
    footerContent,
    events,
    isLoading,
    error,
    updateCoupleInfo,
    updateLoveStory,
    updateImportantInfo,
    updateContactInfo,
    updateFooterContent,
    refreshContent: fetchAllContent
  };
};