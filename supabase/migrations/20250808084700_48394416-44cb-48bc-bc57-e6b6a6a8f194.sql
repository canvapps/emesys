
-- Create wedding_hero_settings table to store dynamic content for the hero section
CREATE TABLE public.wedding_hero_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bride_name VARCHAR(100) NOT NULL,
  groom_name VARCHAR(100) NOT NULL,
  wedding_date DATE NOT NULL,
  wedding_time TIME NOT NULL,
  ceremony_venue_name VARCHAR(255) NOT NULL,
  ceremony_venue_address TEXT NOT NULL,
  reception_venue_name VARCHAR(255),
  reception_venue_address TEXT,
  hero_subtitle VARCHAR(255) DEFAULT 'Merayakan Cinta yang Abadi',
  hero_description TEXT DEFAULT 'Dengan penuh rasa syukur kepada Allah SWT, kami mengundang Anda untuk menjadi saksi dalam ikatan suci pernikahan kami',
  hero_background_image TEXT,
  countdown_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.wedding_hero_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is public wedding info)
CREATE POLICY "Allow public read access to wedding hero settings" 
  ON public.wedding_hero_settings 
  FOR SELECT 
  USING (is_active = true);

-- Create policy for authenticated users to manage settings
CREATE POLICY "Allow authenticated users to manage wedding hero settings" 
  ON public.wedding_hero_settings 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Insert default data
INSERT INTO public.wedding_hero_settings (
  bride_name,
  groom_name,
  wedding_date,
  wedding_time,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  hero_subtitle,
  hero_description
) VALUES (
  'Sari',
  'Dhika', 
  '2025-02-15',
  '14:00',
  'Gedung Serbaguna',
  'Jl. Merdeka No. 123, Jakarta Pusat',
  'Gedung Serbaguna',
  'Jl. Merdeka No. 123, Jakarta Pusat',
  'Merayakan Cinta yang Abadi',
  'Dengan penuh rasa syukur kepada Allah SWT, kami mengundang Anda untuk menjadi saksi dalam ikatan suci pernikahan kami'
);

-- Create trigger for updated_at
CREATE TRIGGER update_wedding_hero_settings_updated_at 
  BEFORE UPDATE ON wedding_hero_settings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
