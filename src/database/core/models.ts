// ================================================================================================
// DATABASE MODELS STUB - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// Database model definitions untuk type safety
// ================================================================================================

export interface RSVPModel {
  id: string;
  name: string;
  email: string;
  attendance_status: 'attending' | 'not_attending' | 'maybe' | 'pending';
  guest_count: number;
  created_at: string;
  updated_at: string;
}

export interface SessionModel {
  id: string;
  session_token: string;
  status: 'active' | 'completed' | 'abandoned' | 'expired';
  created_at: string;
  updated_at: string;
}

export const Models = {
  RSVP: 'rsvp_table',
  SESSION: 'session_table'
} as const;

export default Models;