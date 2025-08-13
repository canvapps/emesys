
-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES public.email_templates(id),
  recipient_group VARCHAR(50) NOT NULL DEFAULT 'all',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.app_users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('invitation', 'reminder', 'thank_you', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create guests table for email recipients
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  invitation_type VARCHAR(20) DEFAULT 'both' CHECK (invitation_type IN ('akad', 'resepsi', 'both')),
  attendance_status VARCHAR(20) DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'attending', 'not_attending', 'maybe')),
  guest_count INTEGER DEFAULT 1,
  message TEXT,
  rsvp_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email logs table
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_campaigns
CREATE POLICY "Allow authenticated users to manage campaigns" ON public.email_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for email_templates
CREATE POLICY "Allow authenticated users to manage templates" ON public.email_templates
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for guests
CREATE POLICY "Allow authenticated users to manage guests" ON public.guests
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for email_logs
CREATE POLICY "Allow authenticated users to view email logs" ON public.email_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample templates
INSERT INTO public.email_templates (name, subject, content, template_type) VALUES
('Undangan Utama', 'Undangan Pernikahan Dhika & Sari', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px; text-align: center;">
    <h1 style="color: #2c3e50;">Dhika & Sari</h1>
    <p style="color: #7f8c8d; font-size: 18px;">Mengundang Anda dalam acara pernikahan kami</p>
  </div>
  <div style="padding: 40px; background: #ffffff;">
    <p>Assalamu''alaikum Warahmatullahi Wabarakatuh</p>
    <p>Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami:</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="text-align: center;">15 Februari 2025</h3>
      <p style="text-align: center;">Pukul 08:00 - 22:00 WIB</p>
    </div>
  </div>
</div>', 'invitation'),

('Reminder RSVP', 'Pengingat: Konfirmasi Kehadiran', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f39c12; padding: 30px; text-align: center; color: white;">
    <h1>Pengingat RSVP</h1>
    <p style="font-size: 18px;">Jangan lupa konfirmasi kehadiran Anda</p>
  </div>
  <div style="padding: 30px;">
    <p>Halo,</p>
    <p>Kami menunggu konfirmasi kehadiran Anda untuk acara pernikahan kami.</p>
  </div>
</div>', 'reminder'),

('Terima Kasih', 'Terima Kasih atas Kehadiran Anda', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #27ae60; padding: 30px; text-align: center; color: white;">
    <h1>Terima Kasih</h1>
    <p style="font-size: 18px;">Atas kehadiran dan doa restu Anda</p>
  </div>
  <div style="padding: 30px;">
    <p>Terima kasih telah hadir dan memberikan doa restu pada acara pernikahan kami.</p>
  </div>
</div>', 'thank_you');

-- Insert sample guests
INSERT INTO public.guests (name, email, invitation_type, attendance_status) VALUES
('Ahmad Suryadi', 'ahmad@example.com', 'both', 'attending'),
('Siti Nurhaliza', 'siti@example.com', 'both', 'pending'),
('Budi Santoso', 'budi@example.com', 'resepsi', 'attending'),
('Maya Indira', 'maya@example.com', 'both', 'maybe'),
('Rizki Pratama', 'rizki@example.com', 'both', 'not_attending');

-- Create indexes for better performance
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_guests_email ON public.guests(email);
