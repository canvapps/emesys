import { useState, useEffect } from 'react';
import { Guest, mockGuests } from '@/data/mockGuests';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './use-toast';

export const useGuests = () => {
  const [guests, setGuests] = useLocalStorage<Guest[]>('wedding-guests', mockGuests);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addGuest = async (guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const newGuest: Guest = {
        ...guestData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setGuests(prev => [...prev, newGuest]);
      
      toast({
        title: "Tamu ditambahkan",
        description: `${newGuest.name} berhasil ditambahkan ke daftar tamu.`,
      });

      return newGuest;
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan tamu. Silakan coba lagi.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    setIsLoading(true);
    try {
      setGuests(prev => prev.map(guest => 
        guest.id === id 
          ? { ...guest, ...updates, updated_at: new Date().toISOString() }
          : guest
      ));

      toast({
        title: "Tamu diperbarui",
        description: "Data tamu berhasil diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui data tamu. Silakan coba lagi.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGuest = async (id: string) => {
    setIsLoading(true);
    try {
      const guest = guests.find(g => g.id === id);
      setGuests(prev => prev.filter(g => g.id !== id));

      toast({
        title: "Tamu dihapus",
        description: `${guest?.name || 'Tamu'} berhasil dihapus dari daftar.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus tamu. Silakan coba lagi.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getGuestById = (id: string) => {
    return guests.find(guest => guest.id === id);
  };

  const getGuestStats = () => {
    const totalGuests = guests.length;
    const attending = guests.filter(g => g.attendance_status === 'attending').length;
    const pending = guests.filter(g => g.attendance_status === 'pending').length;
    const notAttending = guests.filter(g => g.attendance_status === 'not_attending').length;
    const maybe = guests.filter(g => g.attendance_status === 'maybe').length;

    return {
      total: totalGuests,
      attending,
      pending,
      notAttending,
      maybe,
      attendanceRate: totalGuests > 0 ? Math.round((attending / totalGuests) * 100) : 0
    };
  };

  return {
    guests,
    isLoading,
    addGuest,
    updateGuest,
    deleteGuest,
    getGuestById,
    getGuestStats
  };
};