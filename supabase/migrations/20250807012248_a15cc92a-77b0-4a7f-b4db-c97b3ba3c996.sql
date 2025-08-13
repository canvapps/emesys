-- Update demo user emails to match the login page
UPDATE public.app_users 
SET email = 'dhika@dhikasari.com' 
WHERE email = 'dhika@example.com';

UPDATE public.app_users 
SET email = 'sari@dhikasari.com' 
WHERE email = 'sari@example.com';

-- Add the missing admin user with correct email
INSERT INTO public.app_users (email, name, password_hash, role) VALUES 
    ('admin@dhikasari.com', 'Super Admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBenBkLBWrBvyG', 'admin')
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read for authentication" ON public.app_users;
DROP POLICY IF EXISTS "Allow public insert for registration" ON public.app_users;
DROP POLICY IF EXISTS "Allow public access to sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Allow public access to reset tokens" ON public.password_reset_tokens;

-- Create proper RLS policies for app_users (allow public read for authentication)
CREATE POLICY "Allow public read for authentication" ON public.app_users
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for registration" ON public.app_users
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for user_sessions
CREATE POLICY "Allow public access to sessions" ON public.user_sessions
    FOR ALL USING (true);

-- Create RLS policies for password_reset_tokens  
CREATE POLICY "Allow public access to reset tokens" ON public.password_reset_tokens
    FOR ALL USING (true);