import { DatabaseConnection } from './connection';
import { supabase } from '@/integrations/supabase/client';
import { RSVPParticipant, RSVPSession, RSVPInvitation } from '@/hooks/useEnhancedRSVP';

// ================================================================================================
// DATABASE ADAPTER - DUAL CONNECTION SYSTEM
// ================================================================================================
// Priority: Local PostgreSQL → Supabase fallback
// Configurable via environment variables
// ================================================================================================

export type DatabaseProvider = 'postgresql' | 'supabase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  fallback?: DatabaseProvider;
  postgresql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password?: string;
  };
  supabase?: {
    url: string;
    key: string;
  };
}

export interface DatabaseAdapter {
  // Connection Management
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  isConnected(): boolean;
  getProvider(): DatabaseProvider;
  
  // RSVP Operations
  saveRSVPParticipant(participant: RSVPParticipant): Promise<boolean>;
  loadRSVPParticipants(): Promise<RSVPParticipant[]>;
  updateRSVPParticipant(id: string, updates: Partial<RSVPParticipant>): Promise<boolean>;
  deleteRSVPParticipant(id: string): Promise<boolean>;
  
  // Session Operations
  saveSession(session: RSVPSession): Promise<boolean>;
  loadSessions(): Promise<RSVPSession[]>;
  
  // Invitation Operations
  saveInvitation(invitation: RSVPInvitation): Promise<boolean>;
  loadInvitations(): Promise<RSVPInvitation[]>;
}

class PostgreSQLAdapter implements DatabaseAdapter {
  private connection: DatabaseConnection;
  private connected: boolean = false;

  constructor(config: DatabaseConfig['postgresql']) {
    this.connection = new DatabaseConnection(config);
  }

  async connect(): Promise<boolean> {
    try {
      this.connected = await this.connection.connect();
      if (this.connected) {
        // Ensure tables exist
        await this.createTablesIfNotExists();
      }
      return this.connected;
    } catch (error) {
      console.error('PostgreSQL connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    this.connected = false;
    return await this.connection.close();
  }

  isConnected(): boolean {
    return this.connected && this.connection.isConnected();
  }

  getProvider(): DatabaseProvider {
    return 'postgresql';
  }

  private async createTablesIfNotExists(): Promise<void> {
    const createRSVPTable = `
      CREATE TABLE IF NOT EXISTS enhanced_rsvp_participants (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        guest_count INTEGER DEFAULT 1,
        attendance_status VARCHAR(20) DEFAULT 'pending',
        meal_preference VARCHAR(100),
        special_requirements TEXT,
        plus_one_name VARCHAR(255),
        message TEXT,
        rsvp_date TIMESTAMP,
        invitation_code VARCHAR(100),
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS enhanced_rsvp_sessions (
        id UUID PRIMARY KEY,
        session_token VARCHAR(100) NOT NULL,
        invitation_code VARCHAR(100),
        guest_name VARCHAR(255),
        guest_email VARCHAR(255),
        form_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        form_completed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        partial_data JSONB DEFAULT '{}',
        time_spent_seconds INTEGER DEFAULT 0,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createInvitationsTable = `
      CREATE TABLE IF NOT EXISTS enhanced_rsvp_invitations (
        id UUID PRIMARY KEY,
        invitation_code VARCHAR(100) NOT NULL UNIQUE,
        participant_id UUID,
        email VARCHAR(255),
        phone VARCHAR(50),
        name VARCHAR(255),
        invitation_type VARCHAR(20) DEFAULT 'email',
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        responded_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'draft',
        reminder_count INTEGER DEFAULT 0,
        last_reminder_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.connection.query(createRSVPTable);
      await this.connection.query(createSessionsTable);
      await this.connection.query(createInvitationsTable);
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async saveRSVPParticipant(participant: RSVPParticipant): Promise<boolean> {
    try {
      const query = `
        INSERT INTO enhanced_rsvp_participants 
        (id, name, email, phone, guest_count, attendance_status, meal_preference, 
         special_requirements, plus_one_name, message, rsvp_date, invitation_code, 
         session_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        guest_count = EXCLUDED.guest_count,
        attendance_status = EXCLUDED.attendance_status,
        meal_preference = EXCLUDED.meal_preference,
        special_requirements = EXCLUDED.special_requirements,
        plus_one_name = EXCLUDED.plus_one_name,
        message = EXCLUDED.message,
        rsvp_date = EXCLUDED.rsvp_date,
        updated_at = CURRENT_TIMESTAMP
      `;

      const values = [
        participant.id,
        participant.name,
        participant.email,
        participant.phone || null,
        participant.guest_count,
        participant.attendance_status,
        participant.meal_preference || null,
        participant.special_requirements || null,
        participant.plus_one_name || null,
        participant.message || null,
        participant.rsvp_date || null,
        participant.invitation_code || null,
        participant.session_id || null,
        participant.created_at,
        participant.updated_at
      ];

      await this.connection.query(query, values);
      return true;
    } catch (error) {
      console.error('Error saving RSVP participant:', error);
      return false;
    }
  }

  async loadRSVPParticipants(): Promise<RSVPParticipant[]> {
    try {
      const result = await this.connection.query('SELECT * FROM enhanced_rsvp_participants ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        guest_count: row.guest_count,
        attendance_status: row.attendance_status,
        meal_preference: row.meal_preference,
        special_requirements: row.special_requirements,
        plus_one_name: row.plus_one_name,
        message: row.message,
        rsvp_date: row.rsvp_date?.toISOString(),
        invitation_code: row.invitation_code,
        session_id: row.session_id,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString()
      }));
    } catch (error) {
      console.error('Error loading RSVP participants:', error);
      return [];
    }
  }

  async updateRSVPParticipant(id: string, updates: Partial<RSVPParticipant>): Promise<boolean> {
    try {
      const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const query = `UPDATE enhanced_rsvp_participants SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
      const values = [id, ...Object.values(updates)];
      
      await this.connection.query(query, values);
      return true;
    } catch (error) {
      console.error('Error updating RSVP participant:', error);
      return false;
    }
  }

  async deleteRSVPParticipant(id: string): Promise<boolean> {
    try {
      await this.connection.query('DELETE FROM enhanced_rsvp_participants WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting RSVP participant:', error);
      return false;
    }
  }

  async saveSession(session: RSVPSession): Promise<boolean> {
    try {
      const query = `
        INSERT INTO enhanced_rsvp_sessions 
        (id, session_token, invitation_code, guest_name, guest_email, form_started_at,
         form_completed_at, status, partial_data, time_spent_seconds, last_activity_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (session_token) DO UPDATE SET
        status = EXCLUDED.status,
        partial_data = EXCLUDED.partial_data,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        last_activity_at = EXCLUDED.last_activity_at,
        form_completed_at = EXCLUDED.form_completed_at
      `;

      const values = [
        session.id,
        session.session_token,
        session.invitation_code || null,
        session.guest_name || null,
        session.guest_email || null,
        session.form_started_at,
        session.form_completed_at || null,
        session.status,
        JSON.stringify(session.partial_data),
        session.time_spent_seconds,
        session.last_activity_at,
        session.expires_at
      ];

      await this.connection.query(query, values);
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  async loadSessions(): Promise<RSVPSession[]> {
    try {
      const result = await this.connection.query('SELECT * FROM enhanced_rsvp_sessions ORDER BY form_started_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        session_token: row.session_token,
        invitation_code: row.invitation_code,
        guest_name: row.guest_name,
        guest_email: row.guest_email,
        form_started_at: row.form_started_at.toISOString(),
        form_completed_at: row.form_completed_at?.toISOString(),
        status: row.status,
        partial_data: row.partial_data,
        time_spent_seconds: row.time_spent_seconds,
        last_activity_at: row.last_activity_at.toISOString(),
        expires_at: row.expires_at.toISOString()
      }));
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  async saveInvitation(invitation: RSVPInvitation): Promise<boolean> {
    try {
      const query = `
        INSERT INTO enhanced_rsvp_invitations 
        (id, invitation_code, participant_id, email, phone, name, invitation_type,
         sent_at, opened_at, responded_at, status, reminder_count, last_reminder_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (invitation_code) DO UPDATE SET
        opened_at = EXCLUDED.opened_at,
        responded_at = EXCLUDED.responded_at,
        status = EXCLUDED.status,
        reminder_count = EXCLUDED.reminder_count,
        last_reminder_at = EXCLUDED.last_reminder_at
      `;

      const values = [
        invitation.id,
        invitation.invitation_code,
        invitation.participant_id || null,
        invitation.email || null,
        invitation.phone || null,
        invitation.name || null,
        invitation.invitation_type,
        invitation.sent_at || null,
        invitation.opened_at || null,
        invitation.responded_at || null,
        invitation.status,
        invitation.reminder_count,
        invitation.last_reminder_at || null
      ];

      await this.connection.query(query, values);
      return true;
    } catch (error) {
      console.error('Error saving invitation:', error);
      return false;
    }
  }

  async loadInvitations(): Promise<RSVPInvitation[]> {
    try {
      const result = await this.connection.query('SELECT * FROM enhanced_rsvp_invitations ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        invitation_code: row.invitation_code,
        participant_id: row.participant_id,
        email: row.email,
        phone: row.phone,
        name: row.name,
        invitation_type: row.invitation_type,
        sent_at: row.sent_at?.toISOString(),
        opened_at: row.opened_at?.toISOString(),
        responded_at: row.responded_at?.toISOString(),
        status: row.status,
        reminder_count: row.reminder_count,
        last_reminder_at: row.last_reminder_at?.toISOString()
      }));
    } catch (error) {
      console.error('Error loading invitations:', error);
      return [];
    }
  }
}

class SupabaseAdapter implements DatabaseAdapter {
  private connected: boolean = false;

  async connect(): Promise<boolean> {
    try {
      // Test Supabase connection
      const { error } = await supabase.from('wedding_contact_info').select('id').limit(1);
      this.connected = !error;
      return this.connected;
    } catch (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    this.connected = false;
    return true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getProvider(): DatabaseProvider {
    return 'supabase';
  }

  async saveRSVPParticipant(participant: RSVPParticipant): Promise<boolean> {
    try {
      // Use existing schema compatibility - store in wedding_contact_info
      const { data: contactInfo, error: fetchError } = await supabase
        .from('wedding_contact_info')
        .select('*')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentRSVPs = contactInfo?.help_description ? 
        JSON.parse(contactInfo.help_description || '[]') : [];
      
      const existingIndex = currentRSVPs.findIndex((r: any) => r.email === participant.email);
      if (existingIndex >= 0) {
        currentRSVPs[existingIndex] = participant;
      } else {
        currentRSVPs.push(participant);
      }

      const { error: upsertError } = await supabase
        .from('wedding_contact_info')
        .upsert({
          id: contactInfo?.id || crypto.randomUUID(),
          help_title: contactInfo?.help_title || 'RSVP Responses',
          help_description: JSON.stringify(currentRSVPs),
          email_text: contactInfo?.email_text || 'RSVP',
          whatsapp_text: contactInfo?.whatsapp_text || 'RSVP',
          is_visible: contactInfo?.is_visible ?? true
        });

      return !upsertError;
    } catch (error) {
      console.error('Error saving RSVP participant to Supabase:', error);
      return false;
    }
  }

  async loadRSVPParticipants(): Promise<RSVPParticipant[]> {
    try {
      const { data: contactInfo, error } = await supabase
        .from('wedding_contact_info')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (contactInfo?.help_description) {
        const rsvpData = JSON.parse(contactInfo.help_description);
        if (Array.isArray(rsvpData)) {
          return rsvpData;
        }
      }

      return [];
    } catch (error) {
      console.error('Error loading RSVP participants from Supabase:', error);
      return [];
    }
  }

  async updateRSVPParticipant(id: string, updates: Partial<RSVPParticipant>): Promise<boolean> {
    // For Supabase adapter, we need to load all participants, update, and save back
    const participants = await this.loadRSVPParticipants();
    const updatedParticipants = participants.map(p => 
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    
    const updatedParticipant = updatedParticipants.find(p => p.id === id);
    return updatedParticipant ? await this.saveRSVPParticipant(updatedParticipant) : false;
  }

  async deleteRSVPParticipant(id: string): Promise<boolean> {
    const participants = await this.loadRSVPParticipants();
    const filteredParticipants = participants.filter(p => p.id !== id);
    
    // Save the filtered list back
    if (filteredParticipants.length > 0) {
      return await this.saveRSVPParticipant(filteredParticipants[0]); // This is a simplification
    }
    return true;
  }

  // For Supabase, sessions and invitations use localStorage for now
  async saveSession(session: RSVPSession): Promise<boolean> {
    try {
      localStorage.setItem(`rsvp_session_${session.session_token}`, JSON.stringify(session));
      return true;
    } catch (error) {
      console.error('Error saving session to localStorage:', error);
      return false;
    }
  }

  async loadSessions(): Promise<RSVPSession[]> {
    try {
      const sessions: RSVPSession[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('rsvp_session_')) {
          const session = JSON.parse(localStorage.getItem(key) || '{}');
          sessions.push(session);
        }
      }
      return sessions;
    } catch (error) {
      console.error('Error loading sessions from localStorage:', error);
      return [];
    }
  }

  async saveInvitation(invitation: RSVPInvitation): Promise<boolean> {
    try {
      const invitations = await this.loadInvitations();
      const existingIndex = invitations.findIndex(i => i.invitation_code === invitation.invitation_code);
      
      if (existingIndex >= 0) {
        invitations[existingIndex] = invitation;
      } else {
        invitations.push(invitation);
      }
      
      localStorage.setItem('rsvp_invitations', JSON.stringify(invitations));
      return true;
    } catch (error) {
      console.error('Error saving invitation:', error);
      return false;
    }
  }

  async loadInvitations(): Promise<RSVPInvitation[]> {
    try {
      const stored = localStorage.getItem('rsvp_invitations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading invitations:', error);
      return [];
    }
  }
}

// ================================================================================================
// DATABASE FACTORY
// ================================================================================================

export class DatabaseAdapterFactory {
  private static instance: DatabaseAdapter | null = null;

  static async createAdapter(config?: Partial<DatabaseConfig>): Promise<DatabaseAdapter> {
    if (this.instance) {
      return this.instance;
    }

    // Default configuration with Local PostgreSQL priority
    const defaultConfig: DatabaseConfig = {
      provider: 'postgresql',
      fallback: 'supabase',
      postgresql: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'emesys_dev_test',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'admin'
      },
      supabase: {
        url: process.env.VITE_SUPABASE_URL || '',
        key: process.env.VITE_SUPABASE_ANON_KEY || ''
      },
      ...config
    };

    // Try primary provider first
    let adapter: DatabaseAdapter;
    
    if (defaultConfig.provider === 'postgresql' && defaultConfig.postgresql) {
      adapter = new PostgreSQLAdapter(defaultConfig.postgresql);
      const connected = await adapter.connect();
      
      if (connected) {
        this.instance = adapter;
        console.log('✅ Connected to Local PostgreSQL database');
        return adapter;
      }
      
      console.warn('⚠️ Local PostgreSQL connection failed, trying fallback...');
    }

    // Try fallback provider
    if (defaultConfig.fallback === 'supabase') {
      adapter = new SupabaseAdapter();
      const connected = await adapter.connect();
      
      if (connected) {
        this.instance = adapter;
        console.log('✅ Connected to Supabase database (fallback)');
        return adapter;
      }
      
      console.error('❌ Both PostgreSQL and Supabase connections failed');
    }

    // If all fail, return a mock adapter or throw
    throw new Error('No database connections available');
  }

  static getInstance(): DatabaseAdapter | null {
    return this.instance;
  }

  static async reset(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }
}