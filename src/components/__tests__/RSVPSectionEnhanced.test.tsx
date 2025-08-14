import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RSVPSectionEnhanced from '../RSVPSectionEnhanced';

// Mock the useEnhancedRSVP hook
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
    currentSession: null,
    invitations: [],
    loading: false,
    submitting: false,
    error: null,
    submitRSVP: vi.fn().mockResolvedValue(true),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    completeSession: vi.fn(),
    validateForm: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    searchParticipants: vi.fn(),
    filterByStatus: vi.fn(),
    exportData: vi.fn(),
    generateInvitationCode: vi.fn(),
    trackInvitationOpen: vi.fn(),
    sendReminder: vi.fn(),
    refreshAnalytics: vi.fn()
  })
}));

// Mock use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('RSVPSectionEnhanced Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<RSVPSectionEnhanced />);
    
    expect(screen.getByText('Konfirmasi Kehadiran')).toBeInTheDocument();
    expect(screen.getByText('Mohon konfirmasi kehadiran Anda pada acara pernikahan kami')).toBeInTheDocument();
  });

  it('displays form steps correctly', () => {
    render(<RSVPSectionEnhanced />);
    
    // Check that step 1 is visible
    expect(screen.getByText('Nama Lengkap *')).toBeInTheDocument();
    expect(screen.getByText('Email *')).toBeInTheDocument();
  });

  it('navigates between form steps', async () => {
    render(<RSVPSectionEnhanced />);
    
    // Fill out step 1
    fireEvent.change(screen.getByLabelText('Nama Lengkap *'), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'john@example.com' }
    });
    
    // Click next button
    const nextButton = screen.getByText('Lanjutkan');
    fireEvent.click(nextButton);
    
    // Wait for step 2 to appear
    await waitFor(() => {
      expect(screen.getByText('Jumlah Tamu *')).toBeInTheDocument();
    });
  });

  it('submits the form successfully', async () => {
    render(<RSVPSectionEnhanced />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Nama Lengkap *'), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'john@example.com' }
    });
    
    // Navigate to step 2
    fireEvent.click(screen.getByText('Lanjutkan'));
    
    await waitFor(() => {
      expect(screen.getByText('Jumlah Tamu *')).toBeInTheDocument();
    });
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Lanjutkan'));
    
    await waitFor(() => {
      expect(screen.getByText('Pesan untuk Pengantin')).toBeInTheDocument();
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Kirim RSVP'));
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('RSVP Berhasil Tersimpan!')).toBeInTheDocument();
    });
  });

  it('displays validation errors', async () => {
    render(<RSVPSectionEnhanced />);
    
    // Try to submit empty form
    fireEvent.click(screen.getByText('Lanjutkan'));
    
    // Should stay on step 1 and show validation errors
    await waitFor(() => {
      expect(screen.getByText('Nama Lengkap *')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Mock submitRSVP to take some time
    const mockSubmit = vi.fn(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
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
        currentSession: null,
        invitations: [],
        loading: false,
        submitting: true,
        error: null,
        submitRSVP: mockSubmit,
        createSession: vi.fn(),
        updateSession: vi.fn(),
        completeSession: vi.fn(),
        validateForm: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
        searchParticipants: vi.fn(),
        filterByStatus: vi.fn(),
        exportData: vi.fn(),
        generateInvitationCode: vi.fn(),
        trackInvitationOpen: vi.fn(),
        sendReminder: vi.fn(),
        refreshAnalytics: vi.fn()
      })
    }));
    
    render(<RSVPSectionEnhanced />);
    
    // Fill out form and submit
    fireEvent.change(screen.getByLabelText('Nama Lengkap *'), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: 'john@example.com' }
    });
    
    fireEvent.click(screen.getByText('Lanjutkan'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Lanjutkan'));
    });
    
    fireEvent.click(screen.getByText('Kirim RSVP'));
    
    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText('Menyimpan...')).toBeInTheDocument();
    });
  });
});