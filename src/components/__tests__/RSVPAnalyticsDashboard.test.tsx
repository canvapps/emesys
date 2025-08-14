import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RSVPAnalyticsDashboard from '../RSVPAnalyticsDashboard';

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
        rsvp_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        guest_count: 1,
        attendance_status: 'not_attending',
        rsvp_date: '2024-01-02T00:00:00Z',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
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
    invitations: [],
    loading: false,
    refreshAnalytics: vi.fn(),
    exportData: vi.fn(),
    searchParticipants: vi.fn(),
    filterByStatus: vi.fn()
  })
}));

describe('RSVPAnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<RSVPAnalyticsDashboard />);
    
    expect(screen.getByText('RSVP Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive insights dan analytics untuk RSVP management')).toBeInTheDocument();
  });

  it('displays summary metrics', () => {
    render(<RSVPAnalyticsDashboard />);
    
    expect(screen.getByText('Total Responses')).toBeInTheDocument();
    expect(screen.getByText('Attending')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Pending Responses')).toBeInTheDocument();
  });

  it('shows response breakdown chart', () => {
    render(<RSVPAnalyticsDashboard />);
    
    expect(screen.getByText('Response Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Attending')).toBeInTheDocument();
    expect(screen.getByText('Not Attending')).toBeInTheDocument();
  });

  it('switches between dashboard tabs', () => {
    render(<RSVPAnalyticsDashboard />);
    
    // Check overview tab is visible by default
    expect(screen.getByText('Response Breakdown')).toBeInTheDocument();
    
    // Switch to trends tab
    const trendsTab = screen.getByText('Trends');
    fireEvent.click(trendsTab);
    
    // Switch to participants tab
    const participantsTab = screen.getByText('Participants');
    fireEvent.click(participantsTab);
    
    // Switch to actions tab
    const actionsTab = screen.getByText('Actions');
    fireEvent.click(actionsTab);
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
        invitations: [],
        loading: false,
        refreshAnalytics: vi.fn(),
        exportData: vi.fn(),
        searchParticipants: vi.fn(),
        filterByStatus: vi.fn()
      })
    }));
    
    render(<RSVPAnalyticsDashboard />);
    
    // Check that empty states are handled
    expect(screen.getByText('RSVP Analytics Dashboard')).toBeInTheDocument();
  });

  it('displays participant details', () => {
    render(<RSVPAnalyticsDashboard />);
    
    // Check that participant details are rendered
    expect(screen.getByText('Participant Details')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows export actions', () => {
    render(<RSVPAnalyticsDashboard />);
    
    // Switch to actions tab
    const actionsTab = screen.getByText('Actions');
    fireEvent.click(actionsTab);
    
    expect(screen.getByText('Export & Actions')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });
});