
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAppSettings } from './useAppSettings';

export interface FrontendData {
  heroSection: {
    isVisible: boolean;
    title: string;
    subtitle: string;
    description: string;
    backgroundImage: string;
    showCountdown: boolean;
  };
  coupleSection: {
    isVisible: boolean;
    brideName: string;
    groomName: string;
    brideDescription: string;
    groomDescription: string;
    brideImage: string;
    groomImage: string;
  };
  eventSection: {
    isVisible: boolean;
    events: Array<{
      id: string;
      title: string;
      date: string;
      time: string;
      venue: string;
      address: string;
      type: 'akad' | 'resepsi';
    }>;
  };
  rsvpSection: {
    isVisible: boolean;
    isEnabled: boolean;
    deadline: string;
    message: string;
  };
  gallerySection: {
    isVisible: boolean;
    images: string[];
  };
}

const defaultFrontendData: FrontendData = {
  heroSection: {
    isVisible: true,
    title: 'Wedding Invitation',
    subtitle: 'Merayakan Cinta yang Abadi',
    description: 'Dengan penuh rasa syukur kepada Allah SWT, kami mengundang Anda untuk menjadi saksi dalam ikatan suci pernikahan kami',
    backgroundImage: '/assets/wedding-hero.jpg',
    showCountdown: true,
  },
  coupleSection: {
    isVisible: true,
    brideName: 'Bride',
    groomName: 'Groom',
    brideDescription: 'Putri dari Bapak & Ibu',
    groomDescription: 'Putra dari Bapak & Ibu',
    brideImage: '',
    groomImage: '',
  },
  eventSection: {
    isVisible: true,
    events: [
      {
        id: '1',
        title: 'Akad Nikah',
        date: '2024-06-15',
        time: '08:00',
        venue: 'Masjid Istiqlal',
        address: 'Jl. Taman Wijaya Kusuma, Jakarta Pusat',
        type: 'akad',
      },
      {
        id: '2',
        title: 'Resepsi',
        date: '2024-06-15',
        time: '19:00',
        venue: 'Grand Ballroom Hotel',
        address: 'Jl. Asia Afrika No.8, Jakarta Pusat',
        type: 'resepsi',
      },
    ],
  },
  rsvpSection: {
    isVisible: true,
    isEnabled: true,
    deadline: '2024-06-01',
    message: 'Mohon konfirmasi kehadiran Anda sebelum tanggal yang ditentukan',
  },
  gallerySection: {
    isVisible: true,
    images: [],
  },
};

export const useFrontendData = () => {
  const [frontendData, setFrontendData] = useLocalStorage<FrontendData>('frontend-data', defaultFrontendData);
  const { settings } = useAppSettings();

  // Sync with settings changes
  useEffect(() => {
    if (settings?.wedding?.brideName !== frontendData.coupleSection.brideName ||
        settings?.wedding?.groomName !== frontendData.coupleSection.groomName) {
      setFrontendData(prev => ({
        ...prev,
        coupleSection: {
          ...prev.coupleSection,
          brideName: settings?.wedding?.brideName || prev.coupleSection.brideName,
          groomName: settings?.wedding?.groomName || prev.coupleSection.groomName,
        },
        heroSection: {
          ...prev.heroSection,
          title: `${settings?.wedding?.brideName || 'Bride'} & ${settings?.wedding?.groomName || 'Groom'}`,
        },
      }));
    }

    if (settings?.wedding?.rsvpDeadline !== frontendData.rsvpSection.deadline) {
      setFrontendData(prev => ({
        ...prev,
        rsvpSection: {
          ...prev.rsvpSection,
          deadline: settings?.wedding?.rsvpDeadline || prev.rsvpSection.deadline,
        },
      }));
    }
  }, [settings, frontendData, setFrontendData]);

  const updateSection = (section: keyof FrontendData, data: any) => {
    setFrontendData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const toggleSectionVisibility = (section: keyof FrontendData) => {
    setFrontendData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        isVisible: !prev[section].isVisible,
      },
    }));
  };

  return {
    frontendData,
    updateSection,
    toggleSectionVisibility,
    setFrontendData,
  };
};
