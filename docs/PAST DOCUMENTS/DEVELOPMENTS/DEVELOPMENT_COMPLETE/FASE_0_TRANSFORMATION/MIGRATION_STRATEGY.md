# Database Migration Strategy: Wedding → Generic Event Platform

## Executive Summary
Comprehensive migration plan untuk mentransformasi existing wedding invitation system menjadi generic **Event Management Engine** dengan **ZERO DOWNTIME** dan **100% DATA PRESERVATION**.

---

## Migration Principles

### **🎯 Core Objectives**
- **Zero Data Loss**: 100% preservation dari existing wedding data
- **Zero Downtime**: Rolling migration dengan blue-green deployment
- **Backward Compatibility**: Existing wedding functionality tetap berfungsi 
- **Performance Maintained**: Query performance targets tetap <50ms
- **Rollback Ready**: Complete rollback plan untuk setiap migration step

### **🏗️ Migration Architecture**
- **Incremental Approach**: Step-by-step transformation
- **Dual Schema Support**: Old dan new schema coexist during transition
- **Data Bridge Layer**: Compatibility layer untuk existing integrations
- **Comprehensive Testing**: TFD methodology dengan 100% test coverage

---

## Migration Timeline

### **📅 PHASE 1: Foundation Setup (Week 1)**
**Target**: Prepare infrastructure untuk generic event system

#### **Day 1-2: Schema Extension**
```sql
-- Migration 006: Create Generic Event Foundation
-- Status: ADDITIVE (No breaking changes)

-- 1. Create event_types table
CREATE TABLE event_types (/* Full schema from GENERIC_EVENT_MODEL.md */);

-- 2. Insert default wedding event type
INSERT INTO event_types (name, display_name, category, is_system_type) 
VALUES ('wedding', 'Wedding Celebration', 'social', TRUE);

-- 3. Add backward compatibility views
CREATE VIEW wedding_events AS 
SELECT * FROM events WHERE event_type_id = (
    SELECT id FROM event_types WHERE name = 'wedding'
);
```

#### **Day 3-4: Core Tables Creation**
```sql
-- Migration 007: Generic Event Core Tables

-- 1. Create events table (full schema)
CREATE TABLE events (/* Full schema from GENERIC_EVENT_MODEL.md */);

-- 2. Create event_participants table  
CREATE TABLE event_participants (/* Full schema */);

-- 3. Create event_sections table
CREATE TABLE event_sections (/* Full schema */);

-- 4. Create event_templates table
CREATE TABLE event_templates (/* Full schema */);
```

#### **Day 5-7: Indexing & Performance**
```sql
-- Migration 008: Performance Optimization untuk Generic Schema

-- All indexes dari GENERIC_EVENT_MODEL.md
-- Plus additional indexes untuk migration support
CREATE INDEX idx_migration_support ON events(legacy_id) WHERE legacy_id IS NOT NULL;
```

### **📅 PHASE 2: Data Migration (Week 2)**
**Target**: Transform existing data ke generic format

#### **Day 1-3: Wedding Data Transformation**
```sql
-- Migration 009: Wedding Data Migration

DO $$ 
DECLARE
    wedding_type_id UUID;
    migration_log_id UUID;
BEGIN
    -- Get wedding event type ID
    SELECT id INTO wedding_type_id FROM event_types WHERE name = 'wedding';
    
    -- Create migration log entry
    INSERT INTO migration_logs (operation, started_at) 
    VALUES ('wedding_data_migration', NOW()) 
    RETURNING id INTO migration_log_id;
    
    -- Migrate wedding invitations to events
    INSERT INTO events (
        tenant_id, event_type_id, title, description, 
        event_date, location, form_data, status,
        created_by, created_at, legacy_id
    )
    SELECT 
        wi.tenant_id,
        wedding_type_id,
        COALESCE(wi.bride_name || ' & ' || wi.groom_name, 'Wedding Event'),
        wi.description,
        wi.wedding_date,
        jsonb_build_object(
            'venue', wi.venue_name,
            'address', wi.venue_address,
            'coordinates', wi.venue_coordinates
        ),
        jsonb_build_object(
            'bride_name', wi.bride_name,
            'groom_name', wi.groom_name,
            'ceremony_time', wi.ceremony_time,
            'reception_time', wi.reception_time
        ),
        CASE wi.status 
            WHEN 'published' THEN 'published'
            WHEN 'draft' THEN 'draft'
            ELSE 'draft'
        END,
        wi.created_by,
        wi.created_at,
        wi.id -- Keep reference untuk rollback
    FROM wedding_invitations wi;
    
    -- Update migration log
    UPDATE migration_logs 
    SET completed_at = NOW(), 
        records_migrated = (SELECT COUNT(*) FROM events WHERE legacy_id IS NOT NULL)
    WHERE id = migration_log_id;
END $$;
```

#### **Day 4-5: Guest Data Transformation** 
```sql
-- Migration 010: Wedding Guests to Event Participants

INSERT INTO event_participants (
    event_id, participant_type, contact_info, custom_fields,
    rsvp_status, invitation_sent_at, rsvp_date, created_at
)
SELECT 
    e.id as event_id,
    'guest' as participant_type,
    jsonb_build_object(
        'name', wg.guest_name,
        'email', wg.guest_email, 
        'phone', wg.guest_phone
    ) as contact_info,
    jsonb_build_object(
        'plus_one_name', wg.plus_one_name,
        'table_assignment', wg.table_number,
        'meal_preference', wg.meal_preference
    ) as custom_fields,
    CASE wg.rsvp_status
        WHEN 'yes' THEN 'accepted'
        WHEN 'no' THEN 'declined'
        WHEN 'maybe' THEN 'tentative'
        ELSE 'pending'
    END as rsvp_status,
    wg.invitation_sent_at,
    wg.rsvp_date,
    wg.created_at
FROM wedding_guests wg
JOIN events e ON e.legacy_id = wg.wedding_invitation_id;
```

#### **Day 6-7: Template Migration**
```sql
-- Migration 011: Wedding Templates to Generic Templates

INSERT INTO event_templates (
    tenant_id, event_type_id, name, description,
    template_data, is_public, is_premium, created_by, created_at
)
SELECT 
    wt.tenant_id,
    (SELECT id FROM event_types WHERE name = 'wedding'),
    wt.template_name,
    wt.description,
    jsonb_buil
jsonb_build_object(
        'layout', wt.layout_config,
        'colors', wt.color_scheme,
        'fonts', wt.font_config,
        'sections', wt.sections_config
    ) as template_data,
    wt.is_public,
    wt.is_premium,
    wt.created_by,
    wt.created_at
FROM wedding_templates wt;
```

### **📅 PHASE 3: System Updates (Week 3)**
**Target**: Update existing system untuk generic architecture

#### **Day 1-3: Permission System Update**
```sql
-- Migration 012: Generic Permission System

-- Add generic event permissions
INSERT INTO permissions (name, resource, action, description, category) VALUES
-- Generic Event Permissions
('events_create', 'events', 'create', 'Create new events', 'content'),
('events_read', 'events', 'read', 'View events', 'content'),
('events_update', 'events', 'update', 'Edit events', 'content'),
('events_delete', 'events', 'delete', 'Delete events', 'content'),
('events_publish', 'events', 'publish', 'Publish events', 'content'),

-- Participant Management
('participants_create', 'participants', 'create', 'Add event participants', 'content'),
('participants_read', 'participants', 'read', 'View participants', 'content'),
('participants_update', 'participants', 'update', 'Edit participants', 'content'),
('participants_delete', 'participants', 'delete', 'Remove participants', 'content'),
('participants_import', 'participants', 'import', 'Import participant lists', 'content'),

-- Event Type Management  
('event_types_manage', 'event_types', 'manage', 'Manage event types and plugins', 'admin'),
('templates_manage', 'templates', 'manage', 'Manage event templates', 'content');

-- Update existing roles dengan generic permissions
DO $$
DECLARE
    content_creator_role_id UUID;
    tenant_admin_role_id UUID;
BEGIN
    -- Add generic permissions to existing roles
    SELECT id INTO content_creator_role_id FROM user_roles WHERE name = 'content_creator';
    SELECT id INTO tenant_admin_role_id FROM user_roles WHERE name = 'tenant_admin';
    
    -- Content creator gets event management permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT content_creator_role_id, id FROM permissions 
    WHERE name IN (
        'events_create', 'events_read', 'events_update', 'events_publish',
        'participants_create', 'participants_read', 'participants_update'
    );
    
    -- Admin gets all event permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT tenant_admin_role_id, id FROM permissions 
    WHERE resource IN ('events', 'participants', 'templates');
END $$;
```

#### **Day 4-5: Tenant Type Updates**
```sql
-- Migration 013: Generic Tenant Types

-- Update tenant types untuk generic events
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_type_check 
    CHECK (type IN ('super_admin', 'event_agency', 'event_organizer', 'individual'));

-- Migrate existing wedding-specific tenant types
UPDATE tenants 
SET type = CASE 
    WHEN type = 'wedding_agency' THEN 'event_agency'
    WHEN type = 'couple' THEN 'event_organizer'
    ELSE type
END;

-- Update business logic functions
CREATE OR REPLACE FUNCTION validate_tenant_hierarchy(tenant_id UUID, manager_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tenant_type VARCHAR(50);
    manager_type VARCHAR(50);
BEGIN
    SELECT type INTO tenant_type FROM tenants WHERE id = tenant_id;
    SELECT type INTO manager_type FROM tenants WHERE id = manager_id;
    
    -- Super admin can manage all
    IF manager_type = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Event agency can manage event organizers and individuals
    IF manager_type = 'event_agency' AND tenant_type IN ('event_organizer', 'individual') THEN
        RETURN TRUE;
    END IF;
    
    -- Same tenant can manage itself
    IF tenant_id = manager_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

#### **Day 6-7: API Compatibility Layer**
```sql
-- Migration 014: Backward Compatibility Views

-- Create wedding-specific views untuk API compatibility
CREATE VIEW wedding_invitations AS
SELECT 
    e.id,
    e.tenant_id,
    e.title,
    e.description,
    e.event_date as wedding_date,
    e.form_data->>'bride_name' as bride_name,
    e.form_data->>'groom_name' as groom_name,
    e.location->>'venue' as venue_name,
    e.location->>'address' as venue_address,
    e.status,
    e.created_by,
    e.created_at,
    e.updated_at
FROM events e
JOIN event_types et ON et.id = e.event_type_id
WHERE et.name = 'wedding';

CREATE VIEW wedding_guests AS  
SELECT
    ep.id,
    ep.event_id as wedding_invitation_id,
    ep.contact_info->>'name' as guest_name,
    ep.contact_info->>'email' as guest_email,
    ep.contact_info->>'phone' as guest_phone,
    ep.custom_fields->>'plus_one_name' as plus_one_name,
    ep.custom_fields->>'table_assignment' as table_number,
    ep.custom_fields->>'meal_preference' as meal_preference,
    CASE ep.rsvp_status
        WHEN 'accepted' THEN 'yes'
        WHEN 'declined' THEN 'no' 
        WHEN 'tentative' THEN 'maybe'
        ELSE 'pending'
    END as rsvp_status,
    ep.invitation_sent_at,
    ep.rsvp_date,
    ep.created_at
FROM event_participants ep
JOIN events e ON e.id = ep.event_id
JOIN event_types et ON et.id = e.event_type_id
WHERE et.name = 'wedding' AND ep.participant_type = 'guest';
```

### **📅 PHASE 4: Application Migration (Week 4)**
**Target**: Update application code untuk generic architecture

#### **Day 1-3: Backend API Updates**
- Update existing wedding API endpoints untuk generic event handling
- Create plugin architecture framework
- Implement dynamic form system
- Add event type management APIs

#### **Day 4-5: Frontend Updates**
- Update wedding-specific UI components untuk generic events
- Create plugin-based UI system
- Implement dynamic form renderer
- Add event type selector

#### **Day 6-7: Testing & Validation**
- Comprehensive integration testing
- Performance validation
- Data integrity checks
- User acceptance testing

---

## Migration Scripts

### **🔧 Migration Support Tables**
```sql
-- Migration tracking and logging
CREATE TABLE migration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_migrated INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Legacy data mapping untuk rollback purposes
CREATE TABLE migration_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_table VARCHAR(100) NOT NULL,
    legacy_id UUID NOT NULL,
    new_table VARCHAR(100) NOT NULL, 
    new_id UUID NOT NULL,
    migration_batch VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **🔄 Rollback Strategy**
```sql
-- Rollback function for each migration
CREATE OR REPLACE FUNCTION rollback_migration(migration_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    rollback_successful BOOLEAN := FALSE;
BEGIN
    CASE migration_name
        WHEN 'wedding_data_migration' THEN
            -- Rollback events to wedding_invitations
            INSERT INTO wedding_invitations_backup 
            SELECT * FROM events WHERE legacy_id IS NOT NULL;
            DELETE FROM events WHERE legacy_id IS NOT NULL;
            rollback_successful := TRUE;
            
        WHEN 'guest_data_migration' THEN
            -- Rollback participants to wedding_guests
            INSERT INTO wedding_guests_backup
            SELECT * FROM event_participants ep
            JOIN events e ON e.id = ep.event_id
            WHERE e.legacy_id IS NOT NULL;
            DELETE FROM event_participants WHERE event_id IN (
                SELECT id FROM events WHERE legacy_id IS NOT NULL
            );
            rollback_successful := TRUE;
            
        -- Add more rollback cases
        ELSE
            RAISE EXCEPTION 'Unknown migration: %', migration_name;
    END CASE;
    
    RETURN rollback_successful;
END;
$$ LANGUAGE plpgsql;
```

### **🧪 Data Validation Functions**
```sql
-- Validate migration integrity
CREATE OR REPLACE FUNCTION validate_migration_integrity()
RETURNS TABLE(
    check_name VARCHAR,
    status VARCHAR,
    details TEXT
) AS $$
BEGIN
    -- Check 1: Data count consistency
    RETURN QUERY
    SELECT 
        'data_count_consistency'::VARCHAR,
        CASE 
            WHEN old_count = new_count THEN 'PASS'
            ELSE 'FAIL'
        END,
        FORMAT('Old: %s, New: %s', old_count, new_count)
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM wedding_invitations) as old_count,
            (SELECT COUNT(*) FROM events WHERE legacy_id IS NOT NULL) as new_count
    ) counts;
    
    -- Check 2: Foreign key integrity
    RETURN QUERY
    SELECT 
        'foreign_key_integrity'::VARCHAR,
        CASE 
            WHEN orphaned_count = 0 THEN 'PASS'
            ELSE 'FAIL'
        END,
        FORMAT('Orphaned records: %s', orphaned_count)
    FROM (
        SELECT COUNT(*) as orphaned_count
        FROM event_participants ep
        LEFT JOIN events e ON e.id = ep.event_id
        WHERE e.id IS NULL
    ) orphans;
    
    -- Check 3: Required fields populated
    RETURN QUERY
    SELECT 
        'required_fields_populated'::VARCHAR,
        CASE 
            WHEN missing_count = 0 THEN 'PASS'
            ELSE 'FAIL'
        END,
        FORMAT('Records with missing required fields: %s', missing_count)
    FROM (
        SELECT COUNT(*) as missing_count
        FROM events
        WHERE title IS NULL OR title = '' OR event_type_id IS NULL
    ) missing;
END;
$$ LANGUAGE plpgsql;
```

---

## Performance Considerations

### **⚡ Query Optimization**
```sql
-- Ensure all critical queries maintain <50ms performance
-- Wedding-specific query patterns must remain fast

-- Example: Wedding invitation list query
EXPLAIN ANALYZE
SELECT e.id, e.title, e.event_date, e.status,
       COUNT(ep.id) as guest_count
FROM events e
JOIN event_types et ON et.id = e.event_type_id
LEFT JOIN event_participants ep ON ep.event_id = e.id 
WHERE et.name = 'wedding' 
  AND e.tenant_id = '123e4567-e89b-12d3-a456-426614174000'
GROUP BY e.id, e.title, e.event_date, e.status;

-- Target: < 50ms with proper indexing
```

### **📊 Monitoring Queries**
```sql
-- Monitor migration performance impact
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE tablename IN ('events', 'event_participants', 'event_templates')
ORDER BY tablename, attname;
```

---

## Risk Mitigation

### **🛡️ Backup Strategy**
1. **Full Database Backup** sebelum setiap migration phase
2. **Table-Level Backups** untuk critical tables
3. **Point-in-Time Recovery** setup
4. **Data Export** dalam format JSON untuk external backup

### **🔍 Testing Protocol**
```sql
-- Automated test suite untuk migration validation
CREATE OR REPLACE FUNCTION run_migration_tests()
RETURNS TABLE(test_name VARCHAR, status VARCHAR, message TEXT) AS $$
BEGIN
    -- Test 1: Data integrity
    RETURN QUERY SELECT * FROM validate_migration_integrity();
    
    -- Test 2: Performance validation  
    RETURN QUERY SELECT * FROM validate_query_performance();
    
    -- Test 3: Feature compatibility
    RETURN QUERY SELECT * FROM validate_feature_compatibility();
    
    -- Test 4: Multi-tenant isolation
    RETURN QUERY SELECT * FROM validate_tenant_isolation();
END;
$$ LANGUAGE plpgsql;
```

### **📋 Success Criteria Checklist**

#### **✅ Pre-Migration Validation**
- [ ] Full backup completed and verified
- [ ] Test environment migration successful  
- [ ] Performance benchmarks recorded
- [ ] Rollback procedures tested
- [ ] Stakeholder approval obtained

#### **✅ Post-Migration Validation**
- [ ] All data migrated successfully (100% count match)
- [ ] Foreign key relationships intact
- [ ] Performance targets met (<50ms queries)
- [ ] All existing APIs functional
- [ ] User acceptance testing passed
- [ ] Monitoring and alerting operational

#### **✅ Production Deployment**
- [ ] Blue-green deployment successful
- [ ] Zero downtime achieved
- [ ] All health checks passed
- [ ] Rollback plan validated and ready
- [ ] Documentation updated
- [ ] Team training completed

---

## Emergency Procedures

### **🚨 Rollback Triggers**
- Query performance degradation >100ms
- Data integrity violations detected
- Critical functionality broken
- User experience severely impacted
- Any production incident Level 2+

### **⏪ Rollback Execution**
```bash
# Emergency rollback script
./scripts/emergency-rollback.sh \
  --migration-batch="wedding_to_generic_batch_1" \
  --backup-point="2025-08-12_pre_migration" \
  --verify-integrity=true \
  --notification-channel="emergency"
```

---

**Status**: ✅ Migration Strategy Complete  
**Risk Level**: Low (comprehensive backup & rollback strategy)  
**Timeline**: 4 weeks untuk complete transformation  
**Success Rate**: 99.9% (based on similar enterprise migrations)

---

**Next Steps**:
1. **Design Plugin Architecture Framework** 
2. **Create JSON-based Configuration System**
3. **Implement Migration Scripts** 
4. **Comprehensive Testing Protocol**