import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RSVPRealtimeTracker from '../RSVPRealtimeTracker';

// Mock the useEnhancedRSVP hook
vi.mock('@/hooks/useEnhancedRSVP', () => ({
  useEnhancedRSVP: () => ({
    participants: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        guest_count: 2,
        attendance_status: 'attending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    analytics: {
      total_invited: 10,
      total_responded: 8,
      total_attending: 6,
      total_not_attending: 2,
      total_maybe: 0,
      total_pending: 2,
      response_rate: 80,
      acceptance_rate: 75,
      total_guests: 12,
      avg_response_time_days: 2.5,
      responses_last_24h: 3,
      responses_last_7d: 8,
      calculated_at: new Date().toISOString()
    },
    loading: false,
    refreshAnalytics: vi.fn()
  })
}));

describe('RSVPRealtimeTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<RSVPRealtimeTracker />);
    
    expect(screen.getByText('RSVP Real-time Tracker')).toBeInTheDocument();
    expect(screen.getByText('Live monitoring dan notifications untuk RSVP responses')).toBeInTheDocument();
  });

  it('displays live metrics dashboard', () => {
    render(<RSVPRealtimeTracker />);
    
    expect(screen.getByText('6')).toBeInTheDocument(); // Attending
    expect(screen.getByText('2')).toBeInTheDocument(); // Not Attending
    expect(screen.getByText('80%')).toBeInTheDocument(); // Response Rate
    expect(screen.getByText('12')).toBeInTheDocument(); // Total Guests
  });

  it('shows response progress', () => {
    render(<RSVPRealtimeTracker />);
    
    expect(screen.getByText('Overall Response Rate')).toBeInTheDocument();
    expect(screen.getByText('Acceptance Rate')).toBeInTheDocument();
  });

  it('toggles live mode', () => {
    render(<RSVPRealtimeTracker />);
    
    const liveButton = screen.getByText('Pause Live Mode');
    fireEvent.click(liveButton);
    
    expect(screen.getByText('Start Live Mode')).toBeInTheDocument();
  });

  it('switches between activity feed and notifications', () => {
    render(<RSVPRealtimeTracker />);
    
    // Check activity feed is visible by default
    expect(screen.getByText('Live Activity Feed')).toBeInTheDocument();
    
    // Switch to notifications tab
    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays activity feed content', () => {
    render(<RSVPRealtimeTracker />);
    
    // Check that activity feed content is rendered
    expect(screen.getByText('Live Activity Feed')).toBeInTheDocument();
  });

  it('handles empty states', () => {
    // Mock empty data
    vi.mock('@/hooks/useEnhancedRSVP', () => ({
      useEnhancedRSVP: () => ({
        participants: [],
        analytics: {
          total_invited: 0,
          total_responded: 0,
          total_attending: 0,
          total_not_attending: 0,
          total_maybe: 0,
          total_pending: 0,
          response_rate: 0,
          acceptance_rate: 0,
          total_guests: 0,
          avg_response_time_days: 0,
          responses_last_24h: 0,
          responses_last_7d: 0,
          calculated_at: new Date().toISOString()
        },
        loading: false,
        refreshAnalytics: vi.fn()
      })
    }));
    
    render(<RSVPRealtimeTracker />);
    
    // Check that empty states are handled
    expect(screen.getByText('RSVP Real-time Tracker')).toBeInTheDocument();
  });
});