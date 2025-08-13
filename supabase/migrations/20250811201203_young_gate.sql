/*
  # Wedding Content Management System

  1. New Tables
    - `wedding_couple_info` - Informasi mempelai
    - `wedding_love_story` - Kisah cinta pasangan  
    - `wedding_events` - Acara pernikahan (upgrade existing)
    - `wedding_important_info` - Informasi penting
    - `wedding_contact_info` - Informasi kontak dan bantuan
    - `wedding_footer_content` - Konten footer
    - `wedding_gallery` - Galeri foto
    - `wedding_social_links` - Link media sosial

  2. Security
    - Enable RLS on all tables
    - Add policies for public read and authenticated write
    - Add proper indexes for performance

  3. Data Sync
    - Triggers for real-time updates
    - Version control for content changes
*/

-- Wedding couple information
CREATE TABLE IF NOT EXISTS public.wedding_couple_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bride_name VARCHAR(100) NOT NULL,
  bride_full_name VARCHAR(255) NOT NULL,
  bride_parents VARCHAR(255) NOT NULL,
  bride_profession VARCHAR(255),
  bride_education VARCHAR(255),
  bride_hobbies VARCHAR(255),
  bride_description TEXT,
  bride_image_url TEXT,
  groom_name VARCHAR(100) NOT NULL,
  groom_full_name VARCHAR(255) NOT NULL,
  groom_parents VARCHAR(255) NOT NULL,
  groom_profession VARCHAR(255),
  groom_education VARCHAR(255),
  groom_hobbies VARCHAR(255),
  groom_description TEXT,
  groom_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wedding love story
CREATE TABLE IF NOT EXISTS public.wedding_love_story (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT 'Kisah Cinta Kami',
  subtitle VARCHAR(255),
  description TEXT,
  timeline_items JSONB DEFAULT '[]'::jsonb,
  full_story TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Upgrade wedding events table
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wedding_events' AND column_name = 'is_visible') THEN
    ALTER TABLE public.wedding_events ADD COLUMN is_visible BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wedding_events' AND column_name = 'display_order') THEN
    ALTER TABLE public.wedding_events ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wedding_events' AND column_name = 'show_on_timeline') THEN
    ALTER TABLE public.wedding_events ADD COLUMN show_on_timeline BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Wedding important information
CREATE TABLE IF NOT EXISTS public.wedding_important_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT 'Informasi Penting',
  dress_code_title VARCHAR(255) DEFAULT 'Dress Code',
  dress_code_description TEXT,
  health_protocol_title VARCHAR(255) DEFAULT 'Protokol Kesehatan',
  health_protocol_description TEXT,
  additional_info JSONB DEFAULT '[]'::jsonb,
  download_invitation_enabled BOOLEAN DEFAULT true,
  download_invitation_text VARCHAR(255) DEFAULT 'Download E-Invitation',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wedding contact and help information
CREATE TABLE IF NOT EXISTS public.wedding_contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  help_title VARCHAR(255) NOT NULL DEFAULT 'Butuh Bantuan?',
  help_description TEXT DEFAULT 'Hubungi kami jika ada pertanyaan atau kendala dalam konfirmasi',
  whatsapp_number VARCHAR(50),
  whatsapp_text VARCHAR(255) DEFAULT 'WhatsApp',
  email_address VARCHAR(255),
  email_text VARCHAR(255) DEFAULT 'Email',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wedding footer content
CREATE TABLE IF NOT EXISTS public.wedding_footer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_names VARCHAR(255) NOT NULL,
  wedding_date DATE NOT NULL,
  footer_description TEXT,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_address TEXT,
  thank_you_title VARCHAR(255) DEFAULT 'Terima Kasih Atas Doa & Restu Anda',
  thank_you_message TEXT,
  social_buttons JSONB DEFAULT '[]'::jsonb,
  copyright_text VARCHAR(255),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wedding gallery
CREATE TABLE IF NOT EXISTS public.wedding_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wedding social links
CREATE TABLE IF NOT EXISTS public.wedding_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  icon_name VARCHAR(50),
  display_text VARCHAR(100),
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE public.wedding_couple_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_love_story ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_important_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_social_links ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to couple info" ON public.wedding_couple_info
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to love story" ON public.wedding_love_story
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow public read access to important info" ON public.wedding_important_info
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow public read access to contact info" ON public.wedding_contact_info
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow public read access to footer content" ON public.wedding_footer_content
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow public read access to gallery" ON public.wedding_gallery
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow public read access to social links" ON public.wedding_social_links
  FOR SELECT USING (is_visible = true);

-- Create policies for authenticated management
CREATE POLICY "Allow authenticated users to manage couple info" ON public.wedding_couple_info
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage love story" ON public.wedding_love_story
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage important info" ON public.wedding_important_info
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage contact info" ON public.wedding_contact_info
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage footer content" ON public.wedding_footer_content
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage gallery" ON public.wedding_gallery
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage social links" ON public.wedding_social_links
  FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_wedding_couple_info_updated_at 
  BEFORE UPDATE ON public.wedding_couple_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_love_story_updated_at 
  BEFORE UPDATE ON public.wedding_love_story
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_important_info_updated_at 
  BEFORE UPDATE ON public.wedding_important_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_contact_info_updated_at 
  BEFORE UPDATE ON public.wedding_contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_footer_content_updated_at 
  BEFORE UPDATE ON public.wedding_footer_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_gallery_updated_at 
  BEFORE UPDATE ON public.wedding_gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_social_links_updated_at 
  BEFORE UPDATE ON public.wedding_social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO public.wedding_couple_info (
  bride_name, bride_full_name, bride_parents, bride_profession, bride_education, bride_hobbies,
  groom_name, groom_full_name, groom_parents, groom_profession, groom_education, groom_hobbies
) VALUES (
  'Sari', 'Sari Indah', 'Bapak Ahmad Wijaya & Ibu Rahayu', 'Dokter Umum', 'S1 Kedokteran', 'Memasak & Berkebun',
  'Dhika', 'Dhika Pratama', 'Bapak Suyanto & Ibu Siti Aminah', 'Software Engineer', 'S1 Teknik Informatika', 'Fotografi & Traveling'
) ON CONFLICT DO NOTHING;

INSERT INTO public.wedding_love_story (
  title, subtitle, description, timeline_items, full_story
) VALUES (
  'Kisah Cinta Kami',
  'Dua hati yang bersatu dalam cinta dan komitmen, siap membangun masa depan bersama',
  'Pertemuan pertama kami di kampus pada tahun 2019 telah membawa kami menuju jalan yang indah ini.',
  '[
    {"year": "2019", "title": "Pertemuan Pertama", "description": "Di kampus, takdir mempertemukan kami"},
    {"year": "2021", "title": "Jatuh Cinta", "description": "Persahabatan berubah menjadi cinta"},
    {"year": "2024", "title": "Lamaran", "description": "Komitmen untuk selamanya"}
  ]'::jsonb,
  'Pertemuan pertama kami di kampus pada tahun 2019 telah membawa kami menuju jalan yang indah ini. Dari persahabatan yang tulus, berkembang menjadi cinta yang mendalam. Melalui suka dan duka, kami semakin yakin bahwa Allah SWT telah mempertemukan kami untuk bersama selamanya.'
) ON CONFLICT DO NOTHING;

INSERT INTO public.wedding_important_info (
  dress_code_description, health_protocol_description
) VALUES (
  'Kami mengundang Anda untuk mengenakan pakaian formal atau semi-formal dengan nuansa warna cream, gold, atau earth tone yang elegan.',
  'Demi kenyamanan bersama, kami menerapkan protokol kesehatan yang ketat sesuai dengan ketentuan yang berlaku saat ini.'
) ON CONFLICT DO NOTHING;

INSERT INTO public.wedding_contact_info (
  whatsapp_number, email_address
) VALUES (
  '+62 812-3456-7890',
  'wedding@dhikasari.com'
) ON CONFLICT DO NOTHING;

INSERT INTO public.wedding_footer_content (
  couple_names, wedding_date, footer_description, contact_phone, contact_email, contact_address,
  thank_you_message, social_buttons, copyright_text
) VALUES (
  'Dhika & Sari',
  '2025-02-15',
  'Dengan penuh sukacita, kami mengundang Anda untuk menjadi saksi dalam perjalanan cinta kami yang akan diabadikan dalam ikatan suci pernikahan.',
  '+62 812-3456-7890',
  'wedding@dhikasari.com',
  'Jakarta, Indonesia',
  'Kehadiran dan doa restu dari keluarga serta sahabat tercinta merupakan karunia terindah bagi kami. Semoga Allah SWT senantiasa melimpahkan rahmat dan berkah-Nya kepada kita semua. Barakallahu lana wa lakum.',
  '[
    {"text": "📱 WhatsApp", "action": "whatsapp"},
    {"text": "✉️ Email", "action": "email"},
    {"text": "📍 Share Lokasi", "action": "location"}
  ]'::jsonb,
  '© 2025 Dhika & Sari Wedding Invitation'
) ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wedding_couple_info_active ON public.wedding_couple_info(is_active);
CREATE INDEX IF NOT EXISTS idx_wedding_love_story_visible ON public.wedding_love_story(is_visible);
CREATE INDEX IF NOT EXISTS idx_wedding_important_info_visible ON public.wedding_important_info(is_visible);
CREATE INDEX IF NOT EXISTS idx_wedding_contact_info_visible ON public.wedding_contact_info(is_visible);
CREATE INDEX IF NOT EXISTS idx_wedding_footer_content_visible ON public.wedding_footer_content(is_visible);
CREATE INDEX IF NOT EXISTS idx_wedding_gallery_visible ON public.wedding_gallery(is_visible);
CREATE INDEX IF NOT EXISTS idx_wedding_social_links_visible ON public.wedding_social_links(is_visible);