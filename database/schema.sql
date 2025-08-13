
-- Wedding Invitation Management System Database Schema
-- Created: 2024-01-28
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wedding events table
CREATE TABLE wedding_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('akad', 'resepsi', 'other')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT NOT NULL,
    venue_city VARCHAR(100) NOT NULL,
    venue_province VARCHAR(100) NOT NULL,
    venue_postal_code VARCHAR(20),
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    dress_code TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    invitation_type VARCHAR(20) DEFAULT 'both' CHECK (invitation_type IN ('akad', 'resepsi', 'both')),
    guest_count INTEGER DEFAULT 1,
    attendance_status VARCHAR(20) DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'attending', 'not_attending', 'maybe')),
    message TEXT,
    invited_by UUID REFERENCES users(id),
    rsvp_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('invitation', 'reminder', 'thank_you')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    invitation_code VARCHAR(100) UNIQUE NOT NULL,
    email_template_id UUID REFERENCES email_templates(id),
    sent_date TIMESTAMP WITH TIME ZONE,
    opened_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'responded')),
    email_subject VARCHAR(255),
    email_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Themes table
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    primary_color VARCHAR(7) NOT NULL,
    secondary_color VARCHAR(7) NOT NULL,
    accent_color VARCHAR(7) NOT NULL,
    background_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    font_family VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    preview_image TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Distance calculations table
CREATE TABLE distance_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    guest_latitude DECIMAL(10, 8) NOT NULL,
    guest_longitude DECIMAL(11, 8) NOT NULL,
    event_latitude DECIMAL(10, 8) NOT NULL,
    event_longitude DECIMAL(11, 8) NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    travel_time_motorcycle INTEGER, -- minutes
    travel_time_car INTEGER, -- minutes
    travel_time_public_transport INTEGER, -- minutes
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email logs table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_invitation_type ON guests(invitation_type);
CREATE INDEX idx_guests_attendance_status ON guests(attendance_status);
CREATE INDEX idx_invitations_guest_id ON invitations(guest_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_email_logs_invitation_id ON email_logs(invitation_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_distance_calculations_guest_id ON distance_calculations(guest_id);
CREATE INDEX idx_distance_calculations_event_id ON distance_calculations(event_id);
CREATE INDEX idx_themes_is_active ON themes(is_active);
CREATE INDEX idx_wedding_events_date ON wedding_events(date);
CREATE INDEX idx_wedding_events_type ON wedding_events(event_type);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_events_updated_at BEFORE UPDATE ON wedding_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('site_name', 'Wedding Invitation Manager', 'Nama aplikasi'),
('couple_name', 'Dhika & Sari', 'Nama pasangan'),
('wedding_date', '2025-02-15', 'Tanggal pernikahan'),
('email_from', 'noreply@dhikasari.com', 'Email pengirim'),
('email_from_name', 'Dhika & Sari Wedding', 'Nama pengirim email'),
('mapbox_token', '', 'Mapbox API token untuk fitur peta'),
('smtp_host', '', 'SMTP server host'),
('smtp_port', '587', 'SMTP server port'),
('smtp_username', '', 'SMTP username'),
('smtp_password', '', 'SMTP password'),
('smtp_encryption', 'tls', 'SMTP encryption type');

-- Insert sample data (optional)
-- You can uncomment these lines to insert sample data for testing

-- INSERT INTO users (email, name, password_hash, role) VALUES
-- ('admin@dhikasari.com', 'Wedding Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBenBkLBWrBvyG', 'admin'),
-- ('dhika@example.com', 'Dhika Pratama', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBenBkLBWrBvyG', 'admin'),
-- ('sari@example.com', 'Sari Indah', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBenBkLBWrBvyG', 'admin');

-- Create views for reporting
CREATE VIEW guest_summary AS
SELECT 
    attendance_status,
    COUNT(*) as count,
    SUM(guest_count) as total_guests
FROM guests
GROUP BY attendance_status;

CREATE VIEW invitation_status_summary AS
SELECT 
    status,
    COUNT(*) as count
FROM invitations
GROUP BY status;

CREATE VIEW rsvp_timeline AS
SELECT 
    DATE(rsvp_date) as rsvp_date,
    COUNT(*) as responses
FROM guests
WHERE rsvp_date IS NOT NULL
GROUP BY DATE(rsvp_date)
ORDER BY rsvp_date;
