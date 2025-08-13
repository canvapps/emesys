/*
  # Create wedding events table

  1. New Tables
    - `wedding_events` - Wedding events with location and timeline support
  2. Security
    - Enable RLS on `wedding_events` table
    - Add policies for public read and authenticated write
*/

CREATE TABLE IF NOT EXISTS public.wedding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('akad', 'resepsi', 'other')),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue_name VARCHAR(255) NOT NULL,
  venue_address TEXT NOT NULL,
  venue_city VARCHAR(100) NOT NULL,
  venue_province VARCHAR(100) NOT NULL,
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  dress_code TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(50),
  is_visible BOOLEAN DEFAULT true,
  show_on_timeline BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to wedding events" 
  ON public.wedding_events 
  FOR SELECT 
  USING (is_visible = true);

CREATE POLICY "Allow authenticated users to manage wedding events" 
  ON public.wedding_events 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_wedding_events_updated_at 
  BEFORE UPDATE ON public.wedding_events
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample events
INSERT INTO public.wedding_events (
  title, description, event_type, event_date, start_time, end_time,
  venue_name, venue_address, venue_city, venue_province,
  venue_latitude, venue_longitude, dress_code, contact_person, contact_phone,
  display_order
) VALUES 
(
  'Akad Nikah',
  'Ijab Qabul dalam ikatan suci pernikahan',
  'akad',
  '2025-02-15',
  '08:00',
  '10:00',
  'Masjid Al-Ikhlas',
  'Jl. Melati No. 123, Jakarta Selatan',
  'Jakarta Selatan',
  'DKI Jakarta',
  -6.2615,
  106.7810,
  'Formal, warna earth tone',
  'Bapak Ahmad',
  '+62 812-3456-7890',
  1
),
(
  'Resepsi Pernikahan',
  'Walimatul Ursy - Perayaan pernikahan bersama keluarga dan sahabat',
  'resepsi',
  '2025-02-15',
  '18:00',
  '22:00',
  'The Grand Ballroom',
  'Hotel Premium Jakarta, Jl. Sudirman No. 45, Jakarta Pusat',
  'Jakarta Pusat',
  'DKI Jakarta',
  -6.2088,
  106.8456,
  'Formal atau semi-formal, nuansa cream dan gold',
  'Ibu Siti',
  '+62 813-7890-1234',
  2
) ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wedding_events_visible ON public.wedding_events(is_visible);
CREATE INDEX IF NOT EXISTS idx_wedding_events_timeline ON public.wedding_events(show_on_timeline);
CREATE INDEX IF NOT EXISTS idx_wedding_events_order ON public.wedding_events(display_order);
CREATE INDEX IF NOT EXISTS idx_wedding_events_date ON public.wedding_events(event_date);