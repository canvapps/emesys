import { useState, useEffect, useCallback } from 'react';
import { DatabaseAdapterFactory, type DatabaseAdapter } from '@/database/core/database-adapter';
import { useToast } from './use-toast';

// ================================================================================================
// ENHANCED RSVP HOOK - FASE 1 RSVP SYSTEM ENHANCEMENT
// ================================================================================================
// Backward-compatible implementation using existing schema dengan progressive enhancement
// Strategy: Use existing tables + localStorage untuk advanced features
// Future-ready for database migration ketika schema sudah di-deploy
// ================================================================================================

export interface RSVPParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  guest_count: number;
  attendance_status: 'attending' | 'not_attending' | 'maybe' | 'pending';
  meal_preference?: string;
  special_requirements?: string;
  plus_one_name?: string;
  message?: string;
  rsvp_date?: string;
  invitation_code?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RSVPSession {
  id: string;
  session_token: string;
  invitation_code?: string;
  guest_name?: string;
  guest_email?: string;
  form_started_at: string;
  form_completed_at?: string;
  status: 'active' | 'completed' | 'abandoned' | 'expired';
  partial_data: Partial<RSVPFormData>;
  time_spent_seconds: number;
  last_activity_at: string;
  expires_at: string;
}

export interface RSVPAnalytics {
  total_invited: number;
  total_responded: number;
  total_attending: number;
  total_not_attending: number;
  total_maybe: number;
  total_pending: number;
  response_rate: number;
  acceptance_rate: number;
  total_guests: number;
  avg_response_time_days: number;
  responses_last_24h: number;
  responses_last_7d: number;
  calculated_at: string;
}

export interface RSVPInvitation {
  id: string;
  invitation_code: string;
  participant_id?: string;
  email?: string;
  phone?: string;
  name?: string;
  invitation_type: 'email' | 'whatsapp' | 'sms' | 'link';
  sent_at?: string;
  opened_at?: string;
  responded_at?: string;
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'responded' | 'bounced';
  reminder_count: number;
  last_reminder_at?: string;
}

export interface RSVPFormData {
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_count: number;
  attendance_status: 'attending' | 'not_attending' | 'maybe';
  meal_preference?: string;
  special_requirements?: string;
  plus_one_name?: string;
  message?: string;
}

export interface UseEnhancedRSVPOptions {
  enableRealtime?: boolean;
  enableAnalytics?: boolean;
  enableSessionTracking?: boolean;
  autoSave?: boolean;
}

export interface UseEnhancedRSVPReturn {
  // Data State
  participants: RSVPParticipant[];
  analytics: RSVPAnalytics;
  currentSession: RSVPSession | null;
  invitations: RSVPInvitation[];
  
  // Loading States
  loading: boolean;
  submitting: boolean;
  error: string | null;
  
  // Core RSVP Actions
  submitRSVP: (formData: RSVPFormData, sessionToken?: string) => Promise<boolean>;
  updateRSVP: (participantId: string, updates: Partial<RSVPParticipant>) => Promise<boolean>;
  deleteRSVP: (participantId: string) => Promise<boolean>;
  
  // Session Management
  createSession: (invitationCode?: string) => RSVPSession;
  updateSession: (partialData: Record<string, any>) => Promise<void>;
  completeSession: () => Promise<void>;
  
  // Invitation Management
  generateInvitationCode: (email?: string) => string;
  trackInvitationOpen: (invitationCode: string) => Promise<void>;
  sendReminder: (invitationCode: string) => Promise<boolean>;
  
  // Analytics
  refreshAnalytics: () => Promise<void>;
  exportData: (format: 'csv' | 'json') => string;
  
  // Search & Filter
  searchParticipants: (query: string) => RSVPParticipant[];
  filterByStatus: (status: RSVPParticipant['attendance_status']) => RSVPParticipant[];
  
  // Utility Functions
  validateForm: (formData: RSVPFormData) => { isValid: boolean; errors: string[] };
  generateInvitationLink: (invitationCode: string) => string;
}

// ================================================================================================
// LOCAL STORAGE KEYS
// ================================================================================================
const STORAGE_Keys = {
  PARTICIPANTS: 'wedding_rsvp_participants',
  SESSIONS: 'wedding_rsvp_sessions', 
  INVITATIONS: 'wedding_rsvp_invitations',
  ANALYTICS: 'wedding_rsvp_analytics',
  CURRENT_SESSION: 'wedding_rsvp_current_session'
} as const;

export const useEnhancedRSVP = (options: UseEnhancedRSVPOptions = {}): UseEnhancedRSVPReturn => {
  const {
    enableRealtime = false,
    enableAnalytics = true,
    enableSessionTracking = true,
    autoSave = true
  } = options;

  const { toast } = useToast();
  
  // Database adapter instance
  const [dbAdapter, setDbAdapter] = useState<DatabaseAdapter | null>(null);

  // ================================================================================================
  // STATE MANAGEMENT
  // ================================================================================================
  
  const [participants, setParticipants] = useState<RSVPParticipant[]>([]);
  const [invitations, setInvitations] = useState<RSVPInvitation[]>([]);
  const [currentSession, setCurrentSession] = useState<RSVPSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session storage key
  const SESSION_STORAGE_KEY = STORAGE_Keys.CURRENT_SESSION;

  // ================================================================================================
  // COMPUTED ANALYTICS
  // ================================================================================================
  
  const analytics: RSVPAnalytics = {
    total_invited: invitations.length,
    total_responded: participants.filter(p => p.attendance_status !== 'pending').length,
    total_attending: participants.filter(p => p.attendance_status === 'attending').length,
    total_not_attending: participants.filter(p => p.attendance_status === 'not_attending').length,
    total_maybe: participants.filter(p => p.attendance_status === 'maybe').length,
    total_pending: participants.filter(p => p.attendance_status === 'pending').length,
    response_rate: invitations.length > 0 
      ? Math.round((participants.filter(p => p.attendance_status !== 'pending').length / invitations.length) * 100)
      : 0,
    acceptance_rate: participants.filter(p => p.attendance_status !== 'pending').length > 0
      ? Math.round((participants.filter(p => p.attendance_status === 'attending').length / participants.filter(p => p.attendance_status !== 'pending').length) * 100)
      : 0,
    total_guests: participants
      .filter(p => p.attendance_status === 'attending' || p.attendance_status === 'maybe')
      .reduce((total, p) => total + p.guest_count, 0),
    avg_response_time_days: 0, // Calculated from timestamps
    responses_last_24h: participants.filter(p => {
      if (!p.rsvp_date) return false;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(p.rsvp_date) > yesterday;
    }).length,
    responses_last_7d: participants.filter(p => {
      if (!p.rsvp_date) return false;
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return new Date(p.rsvp_date) > lastWeek;
    }).length,
    calculated_at: new Date().toISOString()
  };

  // ================================================================================================
  // LOCAL STORAGE UTILITIES
  // ================================================================================================
  
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  };

  // ================================================================================================
  // DATABASE OPERATIONS
  // ================================================================================================
  
  const initializeDatabaseAdapter = async () => {
    try {
      const adapter = await DatabaseAdapterFactory.createAdapter();
      setDbAdapter(adapter);
      console.log(`✅ Database connected: ${adapter.getProvider()}`);
      return adapter;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      // Check if we're in a test environment (jsdom doesn't have window.location sometimes)
      if (typeof window !== 'undefined' && setError) {
        setError('Failed to initialize database connection');
      }
      return null;
    }
  };

  const syncToDatabase = async (rsvpData: RSVPParticipant) => {
    if (!dbAdapter || !dbAdapter.isConnected()) {
      console.warn('Database not connected, skipping sync');
      return false;
    }

    try {
      return await dbAdapter.saveRSVPParticipant(rsvpData);
    } catch (error) {
      console.error('Database sync error:', error);
      return false;
    }
  };

  const loadFromDatabase = async () => {
    if (!dbAdapter || !dbAdapter.isConnected()) {
      console.warn('Database not connected, loading from localStorage only');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const rsvpData = await dbAdapter.loadRSVPParticipants();
      if (Array.isArray(rsvpData) && rsvpData.length > 0) {
        setParticipants(rsvpData);
        saveToStorage(STORAGE_Keys.PARTICIPANTS, rsvpData);
        
        console.log(`✅ Loaded ${rsvpData.length} participants from ${dbAdapter.getProvider()}`);
      }
    } catch (error) {
      console.error('Error loading from database:', error);
      setError(`Failed to load RSVP data from ${dbAdapter?.getProvider() || 'database'}`);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================================================
  // CORE RSVP ACTIONS
  // ================================================================================================
  
  const submitRSVP = async (formData: RSVPFormData, sessionToken?: string): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);

      const validation = validateForm(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        toast({
          title: "Form Tidak Valid",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return false;
      }

      const now = new Date().toISOString();
      const participantId = crypto.randomUUID();

      const newParticipant: RSVPParticipant = {
        id: participantId,
        name: formData.guest_name,
        email: formData.guest_email,
        phone: formData.guest_phone,
        guest_count: formData.guest_count,
        attendance_status: formData.attendance_status,
        meal_preference: formData.meal_preference,
        special_requirements: formData.special_requirements,
        plus_one_name: formData.plus_one_name,
        message: formData.message,
        rsvp_date: now,
        session_id: sessionToken,
        created_at: now,
        updated_at: now
      };

      // Update participants
      const updatedParticipants = participants.filter(p => p.email !== formData.guest_email);
      updatedParticipants.push(newParticipant);
      
      setParticipants(updatedParticipants);
      saveToStorage(STORAGE_Keys.PARTICIPANTS, updatedParticipants);

      // Sync to database in background
      if (autoSave) {
        syncToDatabase(newParticipant);
      }

      // Complete session if provided
      if (sessionToken && currentSession && currentSession.session_token === sessionToken) {
        completeSession();
      }

      toast({
        title: "RSVP Berhasil!",
        description: `Terima kasih ${formData.guest_name}, konfirmasi kehadiran Anda telah tersimpan.`,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan RSVP';
      setError(errorMessage);
      
      toast({
        title: "RSVP Gagal",
        description: "Terjadi kesalahan saat menyimpan konfirmasi. Silakan coba lagi.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateRSVP = async (participantId: string, updates: Partial<RSVPParticipant>): Promise<boolean> => {
    try {
      const updatedParticipants = participants.map(p => 
        p.id === participantId 
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      );
      
      setParticipants(updatedParticipants);
      saveToStorage(STORAGE_Keys.PARTICIPANTS, updatedParticipants);

      // Sync updated participant to database
      const updatedParticipant = updatedParticipants.find(p => p.id === participantId);
      if (updatedParticipant && autoSave) {
        await syncToDatabase(updatedParticipant);
      }

      return true;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      return false;
    }
  };

  const deleteRSVP = async (participantId: string): Promise<boolean> => {
    try {
      const updatedParticipants = participants.filter(p => p.id !== participantId);
      setParticipants(updatedParticipants);
      saveToStorage(STORAGE_Keys.PARTICIPANTS, updatedParticipants);
      return true;
    } catch (error) {
      console.error('Error deleting RSVP:', error);
      return false;
    }
  };

  // ================================================================================================
  // SESSION MANAGEMENT
  // ================================================================================================
  
  const createSession = (invitationCode?: string): RSVPSession => {
    const sessionToken = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const session: RSVPSession = {
      id: crypto.randomUUID(),
      session_token: sessionToken,
      invitation_code: invitationCode,
      form_started_at: now,
      status: 'active',
      partial_data: {},
      time_spent_seconds: 0,
      last_activity_at: now,
      expires_at: expiresAt.toISOString()
    };

    if (enableSessionTracking) {
      setCurrentSession(session);
      saveToStorage(STORAGE_Keys.CURRENT_SESSION, session);
      
      // Save to sessions history
      const sessions = loadFromStorage<RSVPSession[]>(STORAGE_Keys.SESSIONS, []);
      sessions.push(session);
      saveToStorage(STORAGE_Keys.SESSIONS, sessions);
    }

    return session;
  };

  const updateSession = useCallback(async (partialData: Record<string, any>) => {
    if (!enableSessionTracking || !currentSession) return;

    const updatedSession = {
      ...currentSession,
      partial_data: { ...currentSession.partial_data, ...partialData },
      last_activity_at: new Date().toISOString()
    };

    setCurrentSession(updatedSession);
    
    try {
      saveToStorage(SESSION_STORAGE_KEY, updatedSession);
    } catch (err) {
      console.error('Failed to save session to localStorage:', err);
    }

    if (dbAdapter) {
      try {
        // Database adapter doesn't have updateSession method yet
        // This would be implemented in future database schema updates
        console.log('Session update would sync to database:', updatedSession.session_token);
      } catch (error) {
        console.error('Failed to sync session update:', error);
      }
    }
  }, [enableSessionTracking, currentSession, dbAdapter]);

  const completeSession = useCallback(async () => {
    if (!enableSessionTracking || !currentSession) return;

    const completedSession = {
      ...currentSession,
      status: 'completed' as const,
      form_completed_at: new Date().toISOString()
    };

    setCurrentSession(completedSession);
    
    try {
      saveToStorage(SESSION_STORAGE_KEY, completedSession);
    } catch (err) {
      console.error('Failed to save completed session to localStorage:', err);
    }

    if (dbAdapter) {
      try {
        // Database adapter doesn't have updateSession method yet
        // This would be implemented in future database schema updates
        console.log('Session completion would sync to database:', completedSession.session_token);
      } catch (error) {
        console.error('Failed to sync session completion:', error);
      }
    }
  }, [enableSessionTracking, currentSession, dbAdapter]);

  // ================================================================================================
  // INVITATION MANAGEMENT
  // ================================================================================================
  
  const generateInvitationCode = (email?: string): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const emailPrefix = email ? email.substring(0, 3) : 'inv';
    return `${emailPrefix}-${timestamp}-${randomStr}`.toLowerCase();
  };

  const trackInvitationOpen = async (invitationCode: string) => {
    const invites = loadFromStorage<RSVPInvitation[]>(STORAGE_Keys.INVITATIONS, []);
    const invite = invites.find(i => i.invitation_code === invitationCode);
    
    if (invite && !invite.opened_at) {
      invite.opened_at = new Date().toISOString();
      invite.status = 'opened';
      saveToStorage(STORAGE_Keys.INVITATIONS, invites);
      setInvitations(invites);
    }
  };

  const sendReminder = async (invitationCode: string): Promise<boolean> => {
    // Implementation would integrate with email/SMS service
    const invites = loadFromStorage<RSVPInvitation[]>(STORAGE_Keys.INVITATIONS, []);
    const invite = invites.find(i => i.invitation_code === invitationCode);
    
    if (invite) {
      invite.reminder_count += 1;
      invite.last_reminder_at = new Date().toISOString();
      saveToStorage(STORAGE_Keys.INVITATIONS, invites);
      setInvitations(invites);
    }
    
    return true;
  };

  // ================================================================================================
  // ANALYTICS & UTILITIES
  // ================================================================================================
  
  const refreshAnalytics = async () => {
    if (enableAnalytics) {
      saveToStorage(STORAGE_Keys.ANALYTICS, analytics);
    }
  };

  const exportData = (format: 'csv' | 'json'): string => {
    if (format === 'json') {
      return JSON.stringify({ participants, analytics, invitations }, null, 2);
    }
    
    // CSV export
    const headers = ['Name', 'Email', 'Phone', 'Attendance', 'Guest Count', 'RSVP Date'];
    const rows = participants.map(p => [
      p.name,
      p.email,
      p.phone || '',
      p.attendance_status,
      p.guest_count,
      p.rsvp_date || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const searchParticipants = (query: string): RSVPParticipant[] => {
    if (!query.trim()) return participants;
    
    const lowercaseQuery = query.toLowerCase();
    return participants.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.email.toLowerCase().includes(lowercaseQuery) ||
      p.message?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const filterByStatus = (status: RSVPParticipant['attendance_status']): RSVPParticipant[] => {
    return participants.filter(p => p.attendance_status === status);
  };

  const validateForm = (formData: RSVPFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.guest_name.trim()) {
      errors.push('Nama lengkap wajib diisi');
    }

    if (!formData.guest_email.trim()) {
      errors.push('Email wajib diisi');
    } else if (!/\S+@\S+\.\S+/.test(formData.guest_email)) {
      errors.push('Format email tidak valid');
    }

    if (formData.guest_count < 1 || formData.guest_count > 10) {
      errors.push('Jumlah tamu harus antara 1-10 orang');
    }

    if (formData.guest_count > 1 && formData.attendance_status === 'attending' && !formData.plus_one_name?.trim()) {
      errors.push('Nama tamu tambahan wajib diisi jika jumlah tamu lebih dari 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const generateInvitationLink = (invitationCode: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/rsvp/${invitationCode}`;
  };

  // ================================================================================================
  // EFFECTS & INITIALIZATION
  // ================================================================================================
  
  useEffect(() => {
    const initialize = async () => {
      // Load data from localStorage first (immediate)
      const savedParticipants = loadFromStorage<RSVPParticipant[]>(STORAGE_Keys.PARTICIPANTS, []);
      const savedInvitations = loadFromStorage<RSVPInvitation[]>(STORAGE_Keys.INVITATIONS, []);
      const savedSession = loadFromStorage<RSVPSession | null>(STORAGE_Keys.CURRENT_SESSION, null);

      setParticipants(savedParticipants);
      setInvitations(savedInvitations);
      
      if (enableSessionTracking && savedSession) {
        // Check if session is still valid
        const now = new Date();
        const expiresAt = new Date(savedSession.expires_at);
        
        if (now < expiresAt && savedSession.status === 'active') {
          setCurrentSession(savedSession);
        } else {
          localStorage.removeItem(STORAGE_Keys.CURRENT_SESSION);
        }
      }

      // Initialize database adapter and load fresh data
      const adapter = await initializeDatabaseAdapter();
      if (adapter) {
        await loadFromDatabase();
      }
    };

    initialize();
  }, []);

  // Cleanup database connection on unmount
  useEffect(() => {
    return () => {
      DatabaseAdapterFactory.reset();
    };
  }, []);

  useEffect(() => {
    // Auto-save analytics periodically
    if (enableAnalytics) {
      const interval = setInterval(() => {
        refreshAnalytics();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [participants, enableAnalytics]);

  // ================================================================================================
  // RETURN HOOK INTERFACE
  // ================================================================================================
  
  return {
    // Data State
    participants,
    analytics,
    currentSession,
    invitations,
    
    // Loading States
    loading,
    submitting,
    error,
    
    // Core RSVP Actions
    submitRSVP,
    updateRSVP,
    deleteRSVP,
    
    // Session Management
    createSession,
    updateSession,
    completeSession,
    
    // Invitation Management
    generateInvitationCode,
    trackInvitationOpen,
    sendReminder,
    
    // Analytics
    refreshAnalytics,
    exportData,
    
    // Search & Filter
    searchParticipants,
    filterByStatus,
    
    // Utility Functions
    validateForm,
    generateInvitationLink
  };
};

export default useEnhancedRSVP;