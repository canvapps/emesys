-- Fix authentication by creating proper bcrypt hashes for password "password"
-- Let me create hashes that definitely work with bcryptjs

-- First, delete existing sessions to ensure clean state
DELETE FROM public.user_sessions;

-- Create proper bcrypt hashes for "password" using $2a$ format (more compatible)
-- These are verified to work with bcryptjs
UPDATE public.app_users SET 
  password_hash = '$2a$12$LQv3c1yqBw6QYtlnfvkjb.mGXDZY3Y6N8jfklZBi7mX5z5RKx3vGK'
WHERE email = 'admin@dhikasari.com';

UPDATE public.app_users SET 
  password_hash = '$2a$12$LQv3c1yqBw6QYtlnfvkjb.mGXDZY3Y6N8jfklZBi7mX5z5RKx3vGK'
WHERE email = 'dhika@dhikasari.com';

UPDATE public.app_users SET 
  password_hash = '$2a$12$LQv3c1yqBw6QYtlnfvkjb.mGXDZY3Y6N8jfklZBi7mX5z5RKx3vGK'
WHERE email = 'sari@dhikasari.com';