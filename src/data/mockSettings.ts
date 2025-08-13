
export interface AppSettings {
  // General Settings
  site_name: string;
  site_description: string;
  site_url: string;
  timezone: string;
  
  // Email Settings
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  email_from_name: string;
  email_from_address: string;
  
  // Notification Settings
  email_notifications: boolean;
  rsvp_notifications: boolean;
  guest_notifications: boolean;
  auto_reminder: boolean;
  
  // Security Settings
  two_factor_auth: boolean;
  password_expiry: number;
  max_login_attempts: number;
  session_timeout: number;
  
  // API Settings
  google_maps_api: string;
  recaptcha_site_key: string;
  recaptcha_secret_key: string;
  
  // Backup Settings
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_retention: number;
}

export const mockSettings: AppSettings = {
  // General Settings
  site_name: 'Dhika & Sari Wedding',
  site_description: 'Undangan pernikahan Dhika dan Sari',
  site_url: 'https://dhikasari.com',
  timezone: 'Asia/Jakarta',
  
  // Email Settings
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_username: 'admin@dhikasari.com',
  smtp_password: '',
  email_from_name: 'Dhika & Sari Wedding',
  email_from_address: 'noreply@dhikasari.com',
  
  // Notification Settings
  email_notifications: true,
  rsvp_notifications: true,
  guest_notifications: true,
  auto_reminder: true,
  
  // Security Settings
  two_factor_auth: false,
  password_expiry: 90,
  max_login_attempts: 5,
  session_timeout: 30,
  
  // API Settings
  google_maps_api: '',
  recaptcha_site_key: '',
  recaptcha_secret_key: '',
  
  // Backup Settings
  auto_backup: true,
  backup_frequency: 'daily',
  backup_retention: 30,
};

// Simulate API calls
export const settingsAPI = {
  getSettings: (): Promise<AppSettings> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const saved = localStorage.getItem('app_settings');
        resolve(saved ? JSON.parse(saved) : mockSettings);
      }, 500);
    });
  },

  saveSettings: (settings: AppSettings): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem('app_settings', JSON.stringify(settings));
        resolve();
      }, 800);
    });
  },

  testEmailConfiguration: (): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.3,
          message: Math.random() > 0.3 
            ? 'Email test berhasil dikirim!' 
            : 'Gagal mengirim email test. Periksa konfigurasi SMTP.'
        });
      }, 1500);
    });
  },

  exportData: (): Promise<{ success: boolean; downloadUrl?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          downloadUrl: 'mock-download-url'
        });
      }, 2000);
    });
  },

  createBackup: (): Promise<{ success: boolean; backupId?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          backupId: `backup_${Date.now()}`
        });
      }, 3000);
    });
  }
};
