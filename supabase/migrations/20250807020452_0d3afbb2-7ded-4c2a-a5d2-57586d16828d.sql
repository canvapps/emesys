-- Update password hashes using bcryptjs format that's compatible
-- Hash for "password" using bcryptjs with salt rounds 12
UPDATE public.app_users SET 
  password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBenBkLBWrBvyG'
WHERE email IN ('admin@dhikasari.com', 'dhika@dhikasari.com', 'sari@dhikasari.com');

-- Also add debug logging by temporarily allowing updates
CREATE POLICY "Allow public update for debug" ON public.app_users
    FOR UPDATE USING (true);