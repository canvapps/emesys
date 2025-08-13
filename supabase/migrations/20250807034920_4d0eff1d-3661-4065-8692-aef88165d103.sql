-- Generate fresh password hashes for demo users
-- This should fix the authentication issue

-- First, let's use a known working bcrypt hash for password "password"
-- Generated using bcryptjs with 12 salt rounds
UPDATE public.app_users SET 
  password_hash = '$2b$12$rVZBzFXEOb7LyMZL8KV8O.qK6Yt6pu8cJ8HGOq6cHRREr6FJG1KO6'
WHERE email = 'admin@dhikasari.com';

UPDATE public.app_users SET 
  password_hash = '$2b$12$rVZBzFXEOb7LyMZL8KV8O.qK6Yt6pu8cJ8HGOq6cHRREr6FJG1KO6'
WHERE email = 'dhika@dhikasari.com';

UPDATE public.app_users SET 
  password_hash = '$2b$12$rVZBzFXEOb7LyMZL8KV8O.qK6Yt6pu8cJ8HGOq6cHRREr6FJG1KO6'
WHERE email = 'sari@dhikasari.com';