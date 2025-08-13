import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './use-toast';

export interface AnalyticsData {
  guest_stats: {
    total: number;
    attending: number;
    not_attending: number;
    pending: number;
    growth: number;
  };
  rsvp_trend: Array<{
    date: string;
    responses: number;
  }>;
  attendance_data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  city_data: Array<{
    city: string;
    count: number;
  }>;
  email_stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounce_rate: number;
    open_rate: number;
    click_rate: number;
  };
  website_stats: {
    total_visits: number;
    unique_visitors: number;
    page_views: number;
    avg_session: string;
    bounce_rate: number;
    growth: number;
  };
  last_updated: string;
}

// Generate more realistic data based on actual guest data
const generateRealtimeAnalytics = (guests: any[]): AnalyticsData => {
  const now = new Date();
  const totalGuests = guests?.length || 0;
  
  // Calculate real attendance stats
  const attending = guests?.filter(g => g.attendance_status === 'hadir').length || 0;
  const notAttending = guests?.filter(g => g.attendance_status === 'tidak_hadir').length || 0;
  const maybe = guests?.filter(g => g.attendance_status === 'mungkin').length || 0;
  const pending = totalGuests - attending - notAttending - maybe;
  
  // Generate RSVP trend for last 7 days
  const rsvpTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate responses based on actual data
    const responses = Math.floor(Math.random() * Math.max(1, totalGuests / 7)) + 1;
    rsvpTrend.push({ date: dateStr, responses });
  }
  
  // Real attendance distribution
  const attendanceData = [
    { name: 'Hadir', value: attending, color: '#10B981' },
    { name: 'Tidak Hadir', value: notAttending, color: '#EF4444' },
    { name: 'Mungkin', value: maybe, color: '#F59E0B' },
    { name: 'Pending', value: pending, color: '#6B7280' },
  ];
  
  // Generate city distribution from guest data
  const cityCount: Record<string, number> = {};
  guests?.forEach(guest => {
    if (guest.city) {
      cityCount[guest.city] = (cityCount[guest.city] || 0) + 1;
    }
  });
  
  const cityData = Object.entries(cityCount)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  
  // If no city data, use defaults
  if (cityData.length === 0) {
    cityData.push(
      { city: 'Jakarta', count: Math.floor(totalGuests * 0.3) },
      { city: 'Bandung', count: Math.floor(totalGuests * 0.2) },
      { city: 'Surabaya', count: Math.floor(totalGuests * 0.15) },
      { city: 'Yogyakarta', count: Math.floor(totalGuests * 0.1) },
      { city: 'Medan', count: Math.floor(totalGuests * 0.08) },
      { city: 'Semarang', count: Math.floor(totalGuests * 0.05) }
    );
  }
  
  // Calculate email stats based on guest count
  const emailSent = totalGuests;
  const emailOpened = Math.floor(emailSent * 0.85);
  const emailClicked = Math.floor(emailOpened * 0.65);
  
  return {
    guest_stats: {
      total: totalGuests,
      attending,
      not_attending: notAttending,
      pending,
      growth: Math.floor(Math.random() * 25) + 5
    },
    rsvp_trend: rsvpTrend,
    attendance_data: attendanceData,
    city_data: cityData,
    email_stats: {
      sent: emailSent,
      opened: emailOpened,
      clicked: emailClicked,
      bounce_rate: Math.round((Math.random() * 5 + 1) * 10) / 10,
      open_rate: Math.round((emailOpened / emailSent) * 100),
      click_rate: Math.round((emailClicked / emailOpened) * 100 * 10) / 10
    },
    website_stats: {
      total_visits: Math.floor(totalGuests * 8.5),
      unique_visitors: Math.floor(totalGuests * 6.2),
      page_views: Math.floor(totalGuests * 24),
      avg_session: '2m 45s',
      bounce_rate: Math.round((Math.random() * 20 + 25) * 10) / 10,
      growth: Math.floor(Math.random() * 30) + 10
    },
    last_updated: now.toISOString()
  };
};

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guests] = useLocalStorage('wedding-guests', []);
  const { toast } = useToast();
  
  const refreshAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newData = generateRealtimeAnalytics(guests);
      setAnalyticsData(newData);
      
      toast({
        title: "Analytics Updated",
        description: "Data analytics telah diperbarui",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const exportAnalytics = async () => {
    if (!analyticsData) return;
    
    try {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Berhasil",
        description: "Data analytics berhasil diekspor",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data analytics",
        variant: "destructive",
      });
    }
  };
  
  // Load analytics on mount and when guests data changes
  useEffect(() => {
    refreshAnalytics();
  }, [guests]);
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (analyticsData) {
        refreshAnalytics();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [analyticsData]);
  
  return {
    analyticsData,
    isLoading,
    refreshAnalytics,
    exportAnalytics
  };
};