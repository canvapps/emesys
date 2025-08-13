import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './use-toast';

export interface Event {
  id: string;
  title: string;
  event_type: 'akad' | 'resepsi';
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_province: string;
  venue_latitude: number;
  venue_longitude: number;
  event_date: string;
  start_time: string;
  end_time: string;
  description?: string;
  dress_code?: string;
  contact_person?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

const initialEvents: Event[] = [
  {
    id: '1',
    title: 'Akad Nikah',
    event_type: 'akad',
    venue_name: 'Masjid Al-Ikhlas',
    venue_address: 'Jl. Raya Bekasi No. 123, Bekasi',
    venue_city: 'Bekasi',
    venue_province: 'Jawa Barat',
    venue_latitude: -6.2088,
    venue_longitude: 107.0456,
    event_date: '2024-02-14',
    start_time: '08:00',
    end_time: '10:00',
    description: 'Akad nikah akan dilaksanakan di Masjid Al-Ikhlas',
    dress_code: 'Formal',
    contact_person: 'Pak Ahmad',
    contact_phone: '+62 812-3456-7890',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    title: 'Resepsi Pernikahan',
    event_type: 'resepsi',
    venue_name: 'Gedung Serbaguna',
    venue_address: 'Jl. Ahmad Yani No. 456, Jakarta',
    venue_city: 'Jakarta',
    venue_province: 'DKI Jakarta',
    venue_latitude: -6.1751,
    venue_longitude: 106.8650,
    event_date: '2024-02-14',
    start_time: '18:00',
    end_time: '21:00',
    description: 'Resepsi pernikahan untuk keluarga dan teman',
    dress_code: 'Semi Formal',
    contact_person: 'Ibu Siti',
    contact_phone: '+62 813-7890-1234',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];

export const useEvents = () => {
  const [events, setEvents] = useLocalStorage<Event[]>('wedding-events', initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const newEvent: Event = {
        ...eventData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEvents(prev => [...prev, newEvent]);
      
      toast({
        title: "Acara ditambahkan",
        description: `${newEvent.title} berhasil ditambahkan.`,
      });

      return newEvent;
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan acara. Silakan coba lagi.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    setIsLoading(true);
    try {
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, ...updates, updated_at: new Date().toISOString() }
          : event
      ));

      toast({
        title: "Acara diperbarui",
        description: "Data acara berhasil diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui acara. Silakan coba lagi.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setIsLoading(true);
    try {
      const event = events.find(e => e.id === id);
      setEvents(prev => prev.filter(e => e.id !== id));

      toast({
        title: "Acara dihapus",
        description: `${event?.title || 'Acara'} berhasil dihapus.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus acara. Silakan coba lagi.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getEventById = (id: string) => {
    return events.find(event => event.id === id);
  };

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById
  };
};