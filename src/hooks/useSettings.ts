import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './use-toast';
import { AppSettings, settingsAPI } from '@/data/mockSettings';

export const useSettings = () => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('app_settings', null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await settingsAPI.getSettings();
      setSettings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [setSettings, toast]);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setIsSaving(true);
    try {
      await settingsAPI.saveSettings(newSettings);
      setSettings(newSettings);
      toast({
        title: "Pengaturan tersimpan",
        description: "Semua pengaturan berhasil disimpan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [setSettings, toast]);

  const testEmailConfiguration = useCallback(async () => {
    setIsTestingEmail(true);
    try {
      const result = await settingsAPI.testEmailConfiguration();
      toast({
        title: result.success ? "Email Test Berhasil" : "Email Test Gagal",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal melakukan test email",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsTestingEmail(false);
    }
  }, [toast]);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await settingsAPI.exportData();
      if (result.success) {
        // Simulate file download
        const link = document.createElement('a');
        link.href = '#';
        link.download = `wedding-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        toast({
          title: "Export Berhasil",
          description: "Data berhasil diekspor",
        });
      }
      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const createBackup = useCallback(async () => {
    setIsBackingUp(true);
    try {
      const result = await settingsAPI.createBackup();
      if (result.success) {
        toast({
          title: "Backup Berhasil",
          description: `Backup dibuat dengan ID: ${result.backupId}`,
        });
      }
      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat backup",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsBackingUp(false);
    }
  }, [toast]);

  const updateSetting = useCallback((key: keyof AppSettings, value: any) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    setSettings(updatedSettings);
  }, [settings, setSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    isTestingEmail,
    isExporting,
    isBackingUp,
    loadSettings,
    saveSettings,
    testEmailConfiguration,
    exportData,
    createBackup,
    updateSetting
  };
};