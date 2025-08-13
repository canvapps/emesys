
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface WeddingHeroSettings {
  id: string;
  bride_name: string;
  groom_name: string;
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

export const useWeddingHero = () => {
  const [settings, setSettings] = useState<WeddingHeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('wedding_hero_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching wedding hero settings:', error);
        setError('Failed to load wedding settings');
        return;
      }

      setSettings(data);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError('Failed to load wedding settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<WeddingHeroSettings>) => {
    if (!settings) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('wedding_hero_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update wedding settings",
          variant: "destructive",
        });
        return;
      }

      setSettings(data);
      toast({
        title: "Success",
        description: "Wedding settings updated successfully",
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      toast({
        title: "Error",
        description: "Failed to update wedding settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings: fetchSettings
  };
};
