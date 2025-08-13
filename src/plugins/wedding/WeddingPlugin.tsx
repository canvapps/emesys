/**
 * PHASE 3: Wedding Plugin Implementation
 * Reference implementation of EventPlugin interface for wedding events
 * 
 * This plugin serves as the primary example of how to implement
 * event-specific functionality within the generic Event Management Engine.
 */

import React from 'react';
import { 
  EventPlugin, 
  EventData, 
  FormField, 
  ValidationResult, 
  ThemeConfig 
} from '../types';

// Import generic components and create wedding-specific wrappers
import { EventHero } from '../../components/EventHero';
import { ParticipantsSection } from '../../components/ParticipantsSection';
import { EventDetails } from '../../components/EventDetails';

// ======================================
// WEDDING PLUGIN IMPLEMENTATION
// ======================================

export const WeddingPlugin: EventPlugin = {
  // Plugin metadata
  type: 'wedding',
  name: 'Wedding Event Plugin',
  version: '1.0.0',
  description: 'Complete wedding event management with ceremony, reception, and RSVP functionality',

  // ======================================
  // COMPONENT RENDERERS
  // ======================================

  renderHero: (data: EventData, config: any) => {
    return (
      <EventHero eventType="wedding" />
    );
  },

  renderParticipants: (data: EventData, config: any) => {
    return (
      <ParticipantsSection eventType="wedding" />
    );
  },

  renderDetails: (data: EventData, config: any) => {
    return (
      <EventDetails eventType="wedding" />
    );
  },

  renderStory: (data: EventData, config: any) => {
    const storyData = data.stories?.filter(s => s.is_active) || [];
    
    return (
      <div className="wedding-story-section">
        <h2>Kisah Cinta Kami</h2>
        {data.settings?.showTimeline ? (
          <div className="story-timeline">
            {storyData.map((story, index) => (
              <div key={story.id} className="story-item">
                <h3>{story.title}</h3>
                <p>{story.content}</p>
                {story.image_url && (
                  <img src={story.image_url} alt={story.title} className="story-image" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="story-list">
            {storyData.map((story) => (
              <div key={story.id} className="story-card">
                <h3>{story.title}</h3>
                <p>{story.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },

  renderRegistration: (data: EventData, config: any) => {
    return (
      <div className="wedding-registration-section">
        <h2>RSVP</h2>
        <div className="rsvp-form">
          <p>Mohon konfirmasi kehadiran Anda</p>
          <form>
            <div className="form-group">
              <label>Nama</label>
              <input type="text" placeholder="Nama lengkap" required />
            </div>
            <div className="form-group">
              <label>Jumlah Tamu</label>
              <select>
                {Array.from({ length: data.settings?.maxGuests || 2 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} orang</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Konfirmasi Kehadiran</label>
              <div className="radio-group">
                <label><input type="radio" name="attendance" value="yes" /> Hadir</label>
                <label><input type="radio" name="attendance" value="no" /> Tidak Hadir</label>
              </div>
            </div>
            {data.settings?.enableGuestMessage && (
              <div className="form-group">
                <label>Pesan untuk Mempelai</label>
                <textarea placeholder="Tulis pesan Anda di sini..."></textarea>
              </div>
            )}
            <button type="submit">Kirim RSVP</button>
          </form>
        </div>
      </div>
    );
  },

  // ======================================
  // DATA SCHEMA AND VALIDATION
  // ======================================

  getDefaultSettings: () => ({
    // Hero settings
    showCountdown: true,
    countdownText: 'Hari menuju hari bahagia kami',
    heroBackgroundType: 'image', // 'image', 'video', 'color'
    
    // Participant settings
    showBio: true,
    showSocialMedia: true,
    showParentsNames: true,
    
    // Event details
    showMap: true,
    showDirections: true,
    ceremonySeparateFromReception: true,
    
    // Story settings
    showTimeline: true,
    enablePhotoGallery: true,
    
    // RSVP settings
    enableRSVP: true,
    enableGuestMessage: true,
    enableDietaryRequirements: false,
    maxGuests: 2,
    rsvpDeadline: null,
    
    // Theme settings
    primaryColor: '#D4AF37', // Gold
    secondaryColor: '#8B4513', // Brown
    fontFamily: 'serif',
    
    // Additional features
    enableGuestbook: true,
    enableWishes: true,
    showGiftRegistry: false,
  }),

  getFormFields: (): FormField[] => [
    // Basic event information
    {
      id: 'title',
      label: 'Judul Acara',
      type: 'text',
      required: true,
      placeholder: 'contoh: Pernikahan Andi & Sari',
      helpText: 'Nama acara yang akan ditampilkan di undangan'
    },
    {
      id: 'description',
      label: 'Deskripsi',
      type: 'textarea',
      required: false,
      placeholder: 'Deskripsi singkat acara pernikahan...'
    },
    {
      id: 'wedding_date',
      label: 'Tanggal Pernikahan',
      type: 'datetime',
      required: true,
      helpText: 'Tanggal dan waktu acara utama'
    },

    // Bride information
    {
      id: 'bride_name',
      label: 'Nama Pengantin Wanita',
      type: 'text',
      required: true,
      placeholder: 'Nama lengkap pengantin wanita'
    },
    {
      id: 'bride_nickname',
      label: 'Nama Panggilan (Wanita)',
      type: 'text',
      required: false,
      placeholder: 'Nama panggilan sehari-hari'
    },
    {
      id: 'bride_bio',
      label: 'Bio Pengantin Wanita',
      type: 'textarea',
      required: false,
      conditional: { field: 'showBio', operator: 'equals', value: true }
    },
    {
      id: 'bride_image',
      label: 'Foto Pengantin Wanita',
      type: 'image',
      required: false
    },
    {
      id: 'bride_parents',
      label: 'Nama Orang Tua (Wanita)',
      type: 'text',
      required: false,
      placeholder: 'Bapak ... & Ibu ...',
      conditional: { field: 'showParentsNames', operator: 'equals', value: true }
    },

    // Groom information
    {
      id: 'groom_name',
      label: 'Nama Pengantin Pria',
      type: 'text',
      required: true,
      placeholder: 'Nama lengkap pengantin pria'
    },
    {
      id: 'groom_nickname',
      label: 'Nama Panggilan (Pria)',
      type: 'text',
      required: false,
      placeholder: 'Nama panggilan sehari-hari'
    },
    {
      id: 'groom_bio',
      label: 'Bio Pengantin Pria',
      type: 'textarea',
      required: false,
      conditional: { field: 'showBio', operator: 'equals', value: true }
    },
    {
      id: 'groom_image',
      label: 'Foto Pengantin Pria',
      type: 'image',
      required: false
    },
    {
      id: 'groom_parents',
      label: 'Nama Orang Tua (Pria)',
      type: 'text',
      required: false,
      placeholder: 'Bapak ... & Ibu ...',
      conditional: { field: 'showParentsNames', operator: 'equals', value: true }
    },

    // Ceremony details
    {
      id: 'ceremony_venue',
      label: 'Tempat Akad Nikah',
      type: 'text',
      required: true,
      placeholder: 'Nama tempat akad nikah'
    },
    {
      id: 'ceremony_address',
      label: 'Alamat Akad Nikah',
      type: 'textarea',
      required: true,
      placeholder: 'Alamat lengkap tempat akad nikah'
    },
    {
      id: 'ceremony_date',
      label: 'Tanggal Akad Nikah',
      type: 'datetime',
      required: true
    },

    // Reception details (conditional)
    {
      id: 'reception_venue',
      label: 'Tempat Resepsi',
      type: 'text',
      required: false,
      conditional: { field: 'ceremonySeparateFromReception', operator: 'equals', value: true }
    },
    {
      id: 'reception_address',
      label: 'Alamat Resepsi',
      type: 'textarea',
      required: false,
      conditional: { field: 'ceremonySeparateFromReception', operator: 'equals', value: true }
    },
    {
      id: 'reception_date',
      label: 'Tanggal Resepsi',
      type: 'datetime',
      required: false,
      conditional: { field: 'ceremonySeparateFromReception', operator: 'equals', value: true }
    },

    // Theme and appearance
    {
      id: 'primary_color',
      label: 'Warna Utama',
      type: 'text',
      required: false,
      defaultValue: '#D4AF37',
      helpText: 'Kode warna hex (contoh: #D4AF37 untuk emas)'
    },
    {
      id: 'hero_background_image',
      label: 'Gambar Latar Hero',
      type: 'image',
      required: false,
      helpText: 'Gambar yang akan ditampilkan di bagian atas undangan'
    },

    // Feature toggles
    {
      id: 'showCountdown',
      label: 'Tampilkan Countdown',
      type: 'checkbox',
      required: false,
      defaultValue: true
    },
    {
      id: 'enableRSVP',
      label: 'Aktifkan RSVP',
      type: 'checkbox',
      required: false,
      defaultValue: true
    },
    {
      id: 'enableGuestMessage',
      label: 'Aktifkan Pesan Tamu',
      type: 'checkbox',
      required: false,
      defaultValue: true
    }
  ],

  validateEventData: (data: any): ValidationResult => {
    const errors: any[] = [];

    // Required fields validation
    if (!data.bride_name?.trim()) {
      errors.push({ field: 'bride_name', message: 'Nama pengantin wanita wajib diisi' });
    }
    if (!data.groom_name?.trim()) {
      errors.push({ field: 'groom_name', message: 'Nama pengantin pria wajib diisi' });
    }
    if (!data.wedding_date) {
      errors.push({ field: 'wedding_date', message: 'Tanggal pernikahan wajib diisi' });
    }
    if (!data.ceremony_venue?.trim()) {
      errors.push({ field: 'ceremony_venue', message: 'Tempat akad nikah wajib diisi' });
    }
    if (!data.ceremony_address?.trim()) {
      errors.push({ field: 'ceremony_address', message: 'Alamat akad nikah wajib diisi' });
    }

    // Date validation
    if (data.wedding_date && new Date(data.wedding_date) < new Date()) {
      errors.push({ field: 'wedding_date', message: 'Tanggal pernikahan tidak boleh di masa lalu' });
    }

    // Color validation
    if (data.primary_color && !/^#[0-9A-F]{6}$/i.test(data.primary_color)) {
      errors.push({ field: 'primary_color', message: 'Format warna harus berupa kode hex (contoh: #D4AF37)' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // ======================================
  // LIFECYCLE HOOKS
  // ======================================

  onEventCreate: async (data: EventData) => {
    console.log('Wedding event created:', data.title);
    
    // Create default participant entries
    // This would typically interact with the database
    // For now, just log the action
    console.log('Creating default bride and groom participant entries');
  },

  onEventUpdate: async (data: EventData) => {
    console.log('Wedding event updated:', data.title);
    
    // Handle any wedding-specific update logic
    // For example, update RSVP deadlines, send notifications, etc.
  },

  onEventDelete: async (eventId: string) => {
    console.log('Wedding event deleted:', eventId);
    
    // Clean up wedding-specific data
    // For example, cancel RSVP forms, remove guest messages, etc.
  },

  // ======================================
  // THEME CONFIGURATION
  // ======================================

  getAvailableThemes: (): ThemeConfig[] => [
    {
      id: 'classic-gold',
      name: 'Klasik Emas',
      description: 'Tema elegant dengan aksen emas dan coklat',
      colors: {
        primary: '#D4AF37',
        secondary: '#8B4513',
        background: '#FFF8DC',
        text: '#2F4F4F',
        muted: '#F5F5DC'
      },
      fonts: {
        heading: 'Georgia, serif',
        body: 'Arial, sans-serif'
      },
      layout: {
        container_width: '1200px',
        spacing: '1.5rem',
        border_radius: '8px'
      }
    },
    {
      id: 'modern-rose',
      name: 'Modern Rose',
      description: 'Tema modern dengan warna rose dan putih',
      colors: {
        primary: '#E91E63',
        secondary: '#F8BBD9',
        background: '#FFFFFF',
        text: '#333333',
        muted: '#F5F5F5'
      },
      fonts: {
        heading: 'Playfair Display, serif',
        body: 'Open Sans, sans-serif'
      },
      layout: {
        container_width: '1000px',
        spacing: '2rem',
        border_radius: '12px'
      }
    },
    {
      id: 'traditional-burgundy',
      name: 'Tradisional Burgundy',
      description: 'Tema tradisional dengan warna burgundy dan emas',
      colors: {
        primary: '#800020',
        secondary: '#DAA520',
        background: '#FAF0E6',
        text: '#2C1810',
        muted: '#F0E68C'
      },
      fonts: {
        heading: 'Times New Roman, serif',
        body: 'Georgia, serif'
      },
      layout: {
        container_width: '1100px',
        spacing: '1rem',
        border_radius: '4px'
      }
    }
  ],

  getDefaultTheme: () => 'classic-gold'
};

// ======================================
// PLUGIN REGISTRATION
// ======================================

// Auto-register the wedding plugin when this module is imported
import { registerPlugin } from '../registry';
registerPlugin(WeddingPlugin);

export default WeddingPlugin;