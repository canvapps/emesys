
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
}

// Generate a secure session token
export const generateSessionToken = (): string => {
  return crypto.randomUUID() + '_' + Date.now().toString(36);
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// Login function
export const login = async (email: string, password: string) => {
  try {
    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error('Failed to create session');
    }

    // Store session token in localStorage
    localStorage.setItem('session_token', sessionToken);

    return { user, session };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register function
export const register = async (email: string, password: string, name: string) => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        password_hash: passwordHash,
        role: 'user'
      })
      .select()
      .single();

    if (userError) {
      throw new Error('Failed to create user account');
    }

    return { user };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Get current session
export const getCurrentSession = async (): Promise<{ user: AuthUser; session: AuthSession } | null> => {
  try {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      return null;
    }

    // Get session and user data
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        *,
        app_users (*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      localStorage.removeItem('session_token');
      return null;
    }

    return {
      user: sessionData.app_users as AuthUser,
      session: sessionData as AuthSession
    };
  } catch (error) {
    console.error('Get session error:', error);
    localStorage.removeItem('session_token');
    return null;
  }
};

// Logout function
export const logout = async () => {
  try {
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      // Delete session from database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    
    localStorage.removeItem('session_token');
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.removeItem('session_token');
  }
};
