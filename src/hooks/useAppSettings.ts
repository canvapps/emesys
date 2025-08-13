
import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './use-toast';

export interface AppSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  wedding: {
    coupleNames: string;
    brideName: string;
    groomName: string;
    weddingDate: string;
    venue: string;
    rsvpDeadline: string;
    maxGuestsPerInvite: number;
    allowPlusOnes: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    rsvpNotifications: boolean;
    reminderEmails: boolean;
    adminAlerts: boolean;
    emailTemplate: string;
  };
  security: {
    requireEmailVerification: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    allowGuestRegistration: boolean;
  };
  appearance: {
    theme: string;
    primaryColor: string;
    logoUrl: string;
    customCSS: string;
  };
}

const defaultSettings: AppSettings = {
  general: {
    siteName: 'Wedding Management System',
    siteDescription: 'Sistem manajemen pernikahan yang modern dan elegan',
    contactEmail: 'admin@wedding.com',
    timezone: 'Asia/Jakarta',
    language: 'id',
    maintenanceMode: false,
  },
  wedding: {
    coupleNames: 'Bride & Groom',
    brideName: 'Bride',
    groomName: 'Groom',
    weddingDate: '2024-06-15',
    venue: 'Grand Ballroom',
    rsvpDeadline: '2024-06-01',
    maxGuestsPerInvite: 4,
    allowPlusOnes: true,
  },
  notifications: {
    emailNotifications: true,
    rsvpNotifications: true,
    reminderEmails: true,
    adminAlerts: true,
    emailTemplate: 'default',
  },
  security: {
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    allowGuestRegistration: false,
  },
  appearance: {
    theme: 'elegant',
    primaryColor: '#6366f1',
    logoUrl: '',
    customCSS: '',
  },
};

export const useAppSettings = () => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const updateSetting = useCallback((section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  }, [setSettings]);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    
    try {
      console.log('Saving settings:', settings);
      
      // Apply theme changes
      if (settings.appearance.theme) {
        document.documentElement.setAttribute('data-theme', settings.appearance.theme);
        console.log('Applied theme:', settings.appearance.theme);
      }
      
      // Apply primary color
      if (settings.appearance.primaryColor) {
        // Convert hex to HSL for CSS variables
        const hex = settings.appearance.primaryColor;
        const hsl = hexToHsl(hex);
        document.documentElement.style.setProperty('--primary', hsl);
        console.log('Applied primary color:', hex, 'as HSL:', hsl);
      }
      
      // Apply custom CSS
      let customStyleElement = document.getElementById('custom-css');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'custom-css';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = settings.appearance.customCSS || '';
      
      // Apply language settings
      document.documentElement.lang = settings.general.language;
      
      // Apply maintenance mode
      if (settings.general.maintenanceMode) {
        localStorage.setItem('maintenance-mode', 'true');
        console.log('Maintenance mode enabled');
      } else {
        localStorage.removeItem('maintenance-mode');
        console.log('Maintenance mode disabled');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast({
        title: "Pengaturan Disimpan",
        description: "Semua pengaturan berhasil disimpan dan diterapkan.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, toast]);

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const l = Math.round((sum / 2) * 100);
    const s = diff === 0 ? 0 : Math.round((diff / (1 - Math.abs(2 * l / 100 - 1))) * 100);
    
    return `${h} ${s}% ${l}%`;
  };

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Pengaturan Direset",
      description: "Semua pengaturan telah dikembalikan ke nilai default.",
    });
  }, [setSettings, toast]);

  const testEmailConfiguration = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (settings.notifications.emailNotifications) {
        toast({
          title: "Email Test Berhasil",
          description: "Konfigurasi email berhasil diuji.",
        });
        return { success: true, message: "Email berhasil dikirim" };
      } else {
        throw new Error("Email notifications disabled");
      }
    } catch (error) {
      toast({
        title: "Email Test Gagal",
        description: "Gagal mengirim email test. Periksa konfigurasi.",
        variant: "destructive",
      });
      return { success: false, message: "Gagal mengirim email" };
    } finally {
      setIsLoading(false);
    }
  }, [settings.notifications.emailNotifications, toast]);

  // Apply settings on load
  useEffect(() => {
    if (settings.appearance.theme) {
      document.documentElement.setAttribute('data-theme', settings.appearance.theme);
    }
    
    if (settings.appearance.primaryColor) {
      document.documentElement.style.setProperty('--primary', settings.appearance.primaryColor);
    }
    
    document.documentElement.lang = settings.general.language;
  }, [settings]);

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    saveSettings,
    resetSettings,
    testEmailConfiguration
  };
};
