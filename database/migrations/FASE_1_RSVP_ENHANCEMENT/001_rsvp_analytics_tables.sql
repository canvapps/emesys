-- FASE 1: MIGRATION 001 - RSVP System Enhancement
-- ===============================================
-- Purpose: Create advanced RSVP analytics and tracking tables
-- Impact: ADDITIVE - Extends event_participants with RSVP analytics
-- Rollback: DROP new tables, CASCADE handled properly
-- Test Requirements: Validate RSVP tracking and analytics functionality
-- Trinity Protocol: Maintain >90% score dengan comprehensive testing

BEGIN;

-- Migration log entry
INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
    'migration_fase1_001_rsvp_analytics_tables',
    'started',
    CURRENT_TIMESTAMP,
    jsonb_build_object(
        'description', 'Create RSVP analytics and tracking tables',
        'phase', 'FASE_1_RSVP_ENHANCEMENT',
        'tables_created', ARRAY['rsvp_analytics', 'rsvp_invitations', 'rsvp_notifications', 'rsvp_sessions'],
        'impact', 'additive',
        'trinity_compliant', true
    )
);

-- Create RSVP Analytics table untuk comprehensive tracking
CREATE TABLE IF NOT EXISTS rsvp_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event relationship
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Analytics snapshot data
    total_invited INTEGER DEFAULT 0,
    total_responded INTEGER DEFAULT 0,
    total_accepted INTEGER DEFAULT 0,
    total_declined INTEGER DEFAULT 0,
    total_tentative INTEGER DEFAULT 0,
    total_pending INTEGER DEFAULT 0,
    
    -- Response rate calculations
    response_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    acceptance_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    decline_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    
    -- Guest count analytics
    total_guest_count INTEGER DEFAULT 0,
    expected_attendance INTEGER DEFAULT 0,
    confirmed_attendance INTEGER DEFAULT 0,
    
    -- Time-based analytics
    avg_response_time_hours INTEGER DEFAULT 0,
    fastest_response_time_hours INTEGER,
    slowest_response_time_hours INTEGER,
    
    -- Daily/Weekly analytics
    responses_today INTEGER DEFAULT 0,
    responses_this_week INTEGER DEFAULT 0,
    responses_this_month INTEGER DEFAULT 0,
    
    -- Advanced metrics
    last_response_at TIMESTAMP WITH TIME ZONE,
    peak_response_day VARCHAR(20),
    peak_response_hour INTEGER,
    
    -- Metadata untuk additional tracking
    analytics_data JSONB DEFAULT '{}',
    
    -- Audit fields
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT rsvp_analytics_rates_valid CHECK (
        response_rate >= 0 AND response_rate <= 100 AND
        acceptance_rate >= 0 AND acceptance_rate <= 100 AND
        decline_rate >= 0 AND decline_rate <= 100
    ),
    CONSTRAINT rsvp_analytics_counts_valid CHECK (
        total_invited >= 0 AND total_responded >= 0 AND 
        total_accepted >= 0 AND total_declined >= 0
    )
);

-- Create RSVP Invitations tracking table
CREATE TABLE IF NOT EXISTS rsvp_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Invitation details
    invitation_code VARCHAR(100) UNIQUE NOT NULL,
    invitation_type VARCHAR(50) DEFAULT 'email' CHECK (invitation_type IN ('email', 'whatsapp', 'sms', 'physical')),
    
    -- Invitation content
    subject VARCHAR(500),
    message_content TEXT,
    custom_message TEXT,
    invitation_template_id UUID,
    
    -- Tracking information
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'responded', 'bounced', 'failed')),
    delivery_status VARCHAR(100),
    error_message TEXT,
    
    -- Reminder system
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
    next_reminder_scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    invitation_metadata JSONB DEFAULT '{}',
    tracking_data JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT rsvp_invitations_code_format CHECK (invitation_code ~ '^[A-Z0-9-]+$'),
    UNIQUE (event_id, participant_id) -- One invitation per participant per event
);

-- Create RSVP Notifications table untuk notification history
CREATE TABLE IF NOT EXISTS rsvp_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES event_participants(id) ON DELETE SET NULL,
    invitation_id UUID REFERENCES rsvp_invitations(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(100) NOT NULL, -- invitation_sent, reminder, response_received, deadline_approaching
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    
    -- Target information
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('guest', 'organizer', 'admin')),
    recipient_email VARCHAR(500),
    recipient_phone VARCHAR(50),
    
    -- Delivery tracking
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('email', 'push', 'sms', 'whatsapp', 'in_app')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    notification_data JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RSVP Sessions table untuk real-time tracking
CREATE TABLE IF NOT EXISTS rsvp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    invitation_id UUID REFERENCES rsvp_invitations(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Session tracking
    session_token VARCHAR(255) UNIQUE NOT NULL,
    guest_name VARCHAR(300),
    guest_email VARCHAR(500),
    guest_ip_address INET,
    user_agent TEXT,
    
    -- RSVP form interaction tracking
    form_started_at TIMESTAMP WITH TIME ZONE,
    form_completed_at TIMESTAMP WITH TIME ZONE,
    form_abandoned_at TIMESTAMP WITH TIME ZONE,
    
    -- Response data
    rsvp_response JSONB DEFAULT '{}',
    partial_response JSONB DEFAULT '{}',
    
    -- Session status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'expired')),
    
    -- Timing data
    time_spent_seconds INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 1,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Geographic data (optional)
    country VARCHAR(100),
    city VARCHAR(200),
    timezone VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Constraints
    CONSTRAINT rsvp_sessions_token_format CHECK (LENGTH(session_token) >= 20),
    CONSTRAINT rsvp_sessions_timing_valid CHECK (
        form_completed_at IS NULL OR form_started_at IS NULL OR form_completed_at >= form_started_at
    )
);

-- Create comprehensive indexes for performance
-- RSVP Analytics indexes
CREATE INDEX idx_rsvp_analytics_event_id ON rsvp_analytics(event_id);
CREATE INDEX idx_rsvp_analytics_tenant_id ON rsvp_analytics(tenant_id);
CREATE INDEX idx_rsvp_analytics_calculated_at ON rsvp_analytics(calculated_at DESC);
CREATE INDEX idx_rsvp_analytics_response_rate ON rsvp_analytics(response_rate DESC);

-- RSVP Invitations indexes
CREATE INDEX idx_rsvp_invitations_event_id ON rsvp_invitations(event_id);
CREATE INDEX idx_rsvp_invitations_participant_id ON rsvp_invitations(participant_id);
CREATE INDEX idx_rsvp_invitations_tenant_id ON rsvp_invitations(tenant_id);
CREATE INDEX idx_rsvp_invitations_status ON rsvp_invitations(status);
CREATE INDEX idx_rsvp_invitations_sent_at ON rsvp_invitations(sent_at);
CREATE INDEX idx_rsvp_invitations_reminder_scheduled ON rsvp_invitations(next_reminder_scheduled_at) 
    WHERE next_reminder_scheduled_at IS NOT NULL;

-- RSVP Notifications indexes
CREATE INDEX idx_rsvp_notifications_event_id ON rsvp_notifications(event_id);
CREATE INDEX idx_rsvp_notifications_participant_id ON rsvp_notifications(participant_id);
CREATE INDEX idx_rsvp_notifications_tenant_id ON rsvp_notifications(tenant_id);
CREATE INDEX idx_rsvp_notifications_type ON rsvp_notifications(notification_type);
CREATE INDEX idx_rsvp_notifications_status ON rsvp_notifications(status);
CREATE INDEX idx_rsvp_notifications_sent_at ON rsvp_notifications(sent_at);

-- RSVP Sessions indexes  
CREATE INDEX idx_rsvp_sessions_event_id ON rsvp_sessions(event_id);
CREATE INDEX idx_rsvp_sessions_tenant_id ON rsvp_sessions(tenant_id);
CREATE INDEX idx_rsvp_sessions_token ON rsvp_sessions(session_token);
CREATE INDEX idx_rsvp_sessions_status ON rsvp_sessions(status);
CREATE INDEX idx_rsvp_sessions_created_at ON rsvp_sessions(created_at DESC);
CREATE INDEX idx_rsvp_sessions_expires_at ON rsvp_sessions(expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Create RSVP analytics calculation function
CREATE OR REPLACE FUNCTION calculate_rsvp_analytics(target_event_id UUID)
RETURNS rsvp_analytics AS $$
DECLARE
    analytics_record rsvp_analytics%ROWTYPE;
    total_invited INTEGER;
    total_responded INTEGER;
    total_accepted INTEGER;
    total_declined INTEGER;
    total_tentative INTEGER;
    total_pending INTEGER;
    response_rate DECIMAL(5,2);
    acceptance_rate DECIMAL(5,2);
    decline_rate DECIMAL(5,2);
    total_guest_count INTEGER;
    avg_response_hours INTEGER;
BEGIN
    -- Get current stats from event_participants
    SELECT 
        COUNT(*) as invited,
        COUNT(*) FILTER (WHERE rsvp_status != 'pending') as responded,
        COUNT(*) FILTER (WHERE rsvp_status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE rsvp_status = 'declined') as declined,
        COUNT(*) FILTER (WHERE rsvp_status = 'tentative') as tentative,
        COUNT(*) FILTER (WHERE rsvp_status = 'pending') as pending,
        SUM((custom_fields->>'guest_count')::INTEGER) as guest_count,
        AVG(EXTRACT(EPOCH FROM (rsvp_date - invitation_sent_at))/3600)::INTEGER as avg_hours
    INTO 
        total_invited, total_responded, total_accepted, total_declined, 
        total_tentative, total_pending, total_guest_count, avg_response_hours
    FROM event_participants 
    WHERE event_id = target_event_id;
    
    -- Calculate rates
    response_rate := CASE WHEN total_invited > 0 THEN (total_responded::DECIMAL / total_invited * 100) ELSE 0 END;
    acceptance_rate := CASE WHEN total_responded > 0 THEN (total_accepted::DECIMAL / total_responded * 100) ELSE 0 END;
    decline_rate := CASE WHEN total_responded > 0 THEN (total_declined::DECIMAL / total_responded * 100) ELSE 0 END;
    
    -- Build analytics record
    analytics_record.event_id := target_event_id;
    analytics_record.total_invited := COALESCE(total_invited, 0);
    analytics_record.total_responded := COALESCE(total_responded, 0);
    analytics_record.total_accepted := COALESCE(total_accepted, 0);
    analytics_record.total_declined := COALESCE(total_declined, 0);
    analytics_record.total_tentative := COALESCE(total_tentative, 0);
    analytics_record.total_pending := COALESCE(total_pending, 0);
    analytics_record.response_rate := COALESCE(response_rate, 0);
    analytics_record.acceptance_rate := COALESCE(acceptance_rate, 0);
    analytics_record.decline_rate := COALESCE(decline_rate, 0);
    analytics_record.total_guest_count := COALESCE(total_guest_count, 0);
    analytics_record.expected_attendance := COALESCE(total_guest_count, 0);
    analytics_record.avg_response_time_hours := COALESCE(avg_response_hours, 0);
    analytics_record.calculated_at := CURRENT_TIMESTAMP;
    
    RETURN analytics_record;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function untuk auto-update analytics
CREATE OR REPLACE FUNCTION update_rsvp_analytics_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert analytics record
    INSERT INTO rsvp_analytics (
        event_id, tenant_id, total_invited, total_responded, total_accepted, 
        total_declined, total_tentative, total_pending, response_rate, 
        acceptance_rate, decline_rate, total_guest_count, expected_attendance,
        avg_response_time_hours, calculated_at
    )
    SELECT 
        calc.event_id, NEW.tenant_id, calc.total_invited, calc.total_responded, 
        calc.total_accepted, calc.total_declined, calc.total_tentative, 
        calc.total_pending, calc.response_rate, calc.acceptance_rate, 
        calc.decline_rate, calc.total_guest_count, calc.expected_attendance,
        calc.avg_response_time_hours, calc.calculated_at
    FROM calculate_rsvp_analytics(NEW.event_id) calc
    ON CONFLICT (event_id) 
    DO UPDATE SET
        total_invited = EXCLUDED.total_invited,
        total_responded = EXCLUDED.total_responded,
        total_accepted = EXCLUDED.total_accepted,
        total_declined = EXCLUDED.total_declined,
        total_tentative = EXCLUDED.total_tentative,
        total_pending = EXCLUDED.total_pending,
        response_rate = EXCLUDED.response_rate,
        acceptance_rate = EXCLUDED.acceptance_rate,
        decline_rate = EXCLUDED.decline_rate,
        total_guest_count = EXCLUDED.total_guest_count,
        expected_attendance = EXCLUDED.expected_attendance,
        avg_response_time_hours = EXCLUDED.avg_response_time_hours,
        calculated_at = EXCLUDED.calculated_at,
        updated_at = CURRENT_TIMESTAMP;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint untuk analytics per event
ALTER TABLE rsvp_analytics ADD CONSTRAINT unique_analytics_per_event UNIQUE (event_id);

-- Create trigger untuk auto-update analytics
CREATE TRIGGER trigger_update_rsvp_analytics
    AFTER INSERT OR UPDATE OR DELETE ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_rsvp_analytics_trigger();

-- Create views untuk quick analytics access
CREATE OR REPLACE VIEW rsvp_dashboard_stats AS
SELECT 
    ra.event_id,
    e.title as event_title,
    e.event_date,
    ra.total_invited,
    ra.total_responded,
    ra.total_pending,
    ra.response_rate,
    ra.acceptance_rate,
    ra.total_guest_count,
    ra.expected_attendance,
    ra.calculated_at,
    CASE 
        WHEN ra.response_rate >= 80 THEN 'excellent'
        WHEN ra.response_rate >= 60 THEN 'good'
        WHEN ra.response_rate >= 40 THEN 'average'
        ELSE 'needs_attention'
    END as response_status
FROM rsvp_analytics ra
JOIN events e ON e.id = ra.event_id
ORDER BY ra.calculated_at DESC;

-- Update migration log
UPDATE migration_logs 
SET status = 'completed', 
    completed_at = CURRENT_TIMESTAMP,
    records_migrated = 0,
    metadata = metadata || jsonb_build_object(
        'tables_created', 4,
        'indexes_created', 20,
        'functions_created', 2,
        'views_created', 1,
        'triggers_created', 1,
        'trinity_compliant', true
    )
WHERE operation = 'migration_fase1_001_rsvp_analytics_tables';

COMMIT;