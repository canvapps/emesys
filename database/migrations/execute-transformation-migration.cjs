// ===============================================
// CHUNK 0b.1: Transformation Migration Executor  
// ===============================================
// Protocol: Test-First Development (TFD) - GREEN Phase
// Purpose: Execute Event Management Engine transformation migration
// Author: Kilo Code
// Created: 2025-08-12

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'emesys_dev',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
};

async function executeTransformationMigration() {
    const pool = new Pool(config);
    console.log('🚀 STARTING GREEN PHASE - Event Management Engine Transformation\n');
    
    let successCount = 0;
    let errorCount = 0;
    const migrationResults = [];

    try {
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // ===============================================
        // MIGRATION STEP 1: Create Migration Logs Table
        // ===============================================
        console.log('\n📋 STEP 1: Creating Migration Logs Infrastructure');
        
        const createMigrationLogsSQL = `
            CREATE TABLE IF NOT EXISTS migration_logs (
                id SERIAL PRIMARY KEY,
                operation VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
                started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP WITH TIME ZONE,
                records_migrated INTEGER DEFAULT 0,
                metadata JSONB DEFAULT '{}',
                error_message TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_migration_logs_operation ON migration_logs(operation);
            CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON migration_logs(status);
        `;
        
        try {
            await client.query(createMigrationLogsSQL);
            console.log('   ✅ Migration logs table ready');
            successCount++;
        } catch (error) {
            console.log(`   ❌ Error creating migration logs: ${error.message}`);
            errorCount++;
            migrationResults.push({ step: 'migration_logs', status: 'ERROR', error: error.message });
        }

        // ===============================================
        // MIGRATION STEP 2: Create Event Types Table
        // ===============================================
        console.log('\n📋 STEP 2: Creating Event Types Foundation');
        
        const createEventTypesSQL = `
            BEGIN;
            
            -- Migration log entry
            INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
                'migration_006_event_types_foundation',
                'started',
                CURRENT_TIMESTAMP,
                jsonb_build_object(
                    'description', 'Create generic event types foundation',
                    'impact', 'additive',
                    'breaking_changes', false
                )
            );
            
            -- Create event_types table
            CREATE TABLE event_types (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                display_name VARCHAR(200) NOT NULL,
                description TEXT,
                category VARCHAR(50) NOT NULL CHECK (category IN ('social', 'corporate', 'educational', 'religious', 'cultural')),
                
                -- Configuration and features
                default_config JSONB DEFAULT '{}',
                required_fields JSONB DEFAULT '[]',
                optional_fields JSONB DEFAULT '[]',
                form_schema JSONB DEFAULT '{}',
                
                -- System configuration
                is_system_type BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                is_premium BOOLEAN DEFAULT FALSE,
                
                -- Multi-tenant support
                created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                
                -- Audit fields
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT event_types_name_format CHECK (name ~ '^[a-z_]+$'),
                CONSTRAINT event_types_display_name_length CHECK (LENGTH(display_name) >= 3)
            );
            
            -- Create indexes
            CREATE INDEX idx_event_types_name ON event_types(name);
            CREATE INDEX idx_event_types_category ON event_types(category);
            CREATE INDEX idx_event_types_tenant_id ON event_types(tenant_id);
            CREATE INDEX idx_event_types_active ON event_types(is_active) WHERE is_active = TRUE;
            
            -- Insert default wedding event type
            INSERT INTO event_types (
                name, display_name, description, category,
                default_config, required_fields, optional_fields,
                is_system_type, is_active, created_at
            ) VALUES (
                'wedding',
                'Wedding Celebration',
                'Traditional wedding ceremony and reception events',
                'social',
                jsonb_build_object(
                    'default_sections', ARRAY['ceremony', 'reception', 'couple_info'],
                    'participant_types', ARRAY['guest', 'family', 'vendor'],
                    'form_layout', 'traditional',
                    'supports_rsvp', true,
                    'supports_plus_one', true
                ),
                '["bride_name", "groom_name", "wedding_date", "venue_name"]'::jsonb,
                '["ceremony_time", "reception_time", "dress_code", "meal_preferences"]'::jsonb,
                TRUE,
                TRUE,
                CURRENT_TIMESTAMP
            );
            
            -- Update migration log
            UPDATE migration_logs 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                records_migrated = 1
            WHERE operation = 'migration_006_event_types_foundation';
            
            COMMIT;
        `;
        
        try {
            await client.query(createEventTypesSQL);
            console.log('   ✅ Event types table created with wedding type');
            successCount++;
            migrationResults.push({ step: 'event_types', status: 'SUCCESS', records: 1 });
        } catch (error) {
            await client.query('ROLLBACK');
            console.log(`   ❌ Error creating event types: ${error.message}`);
            errorCount++;
            migrationResults.push({ step: 'event_types', status: 'ERROR', error: error.message });
        }

        // ===============================================
        // MIGRATION STEP 3: Create Core Events Tables
        // ===============================================
        console.log('\n📋 STEP 3: Creating Core Events Tables');
        
        const createCoreTablesSQL = `
            BEGIN;
            
            -- Migration log entry
            INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
                'migration_007_events_core_tables',
                'started',
                CURRENT_TIMESTAMP,
                jsonb_build_object(
                    'description', 'Create generic events core tables',
                    'tables_created', ARRAY['events', 'event_participants', 'event_sections', 'event_templates'],
                    'impact', 'additive'
                )
            );
            
            -- Create events table (main generic events table)
            CREATE TABLE events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                
                -- Event identification
                event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                slug VARCHAR(200) UNIQUE,
                
                -- Event timing
                event_date DATE NOT NULL,
                event_time TIME,
                end_date DATE,
                end_time TIME,
                timezone VARCHAR(100) DEFAULT 'UTC',
                
                -- Event location (flexible JSON structure)
                location JSONB DEFAULT '{}', -- {venue, address, coordinates, directions}
                
                -- Dynamic event data (plugin-specific fields)
                form_data JSONB DEFAULT '{}',
                configuration JSONB DEFAULT '{}',
                
                -- Event status and visibility
                status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
                visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
                
                -- Multi-tenant support
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                
                -- SEO and sharing
                meta_title VARCHAR(200),
                meta_description TEXT,
                social_image_url TEXT,
                
                -- Legacy support untuk backward compatibility
                legacy_id UUID, -- Reference ke wedding_invitations.id untuk rollback
                legacy_table VARCHAR(100), -- Track original table name
                
                -- Audit fields
                created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                published_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT events_title_length CHECK (LENGTH(title) >= 5),
                CONSTRAINT events_valid_date_range CHECK (end_date IS NULL OR end_date >= event_date),
                CONSTRAINT events_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$')
            );
            
            -- Create event_participants table
            CREATE TABLE event_participants (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                
                -- Relationship
                event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                participant_type VARCHAR(50) NOT NULL, -- guest, speaker, vendor, organizer, etc
                
                -- Contact information (flexible JSON structure)
                contact_info JSONB NOT NULL DEFAULT '{}', -- {name, email, phone, etc}
                
                -- Custom fields per event type
                custom_fields JSONB DEFAULT '{}',
                
                -- RSVP system
                rsvp_status VARCHAR(50) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
                invitation_sent_at TIMESTAMP WITH TIME ZONE,
                rsvp_date TIMESTAMP WITH TIME ZONE,
                rsvp_notes TEXT,
                
                -- Additional participant data
                attendance_confirmed BOOLEAN DEFAULT FALSE,
                special_requirements TEXT,
                table_assignment VARCHAR(100),
                
                -- Multi-tenant support
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                
                -- Audit fields
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT participants_contact_info_required CHECK (jsonb_typeof(contact_info) = 'object' AND contact_info != '{}')
            );
            
            -- Create event_sections table
            CREATE TABLE event_sections (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                
                -- Relationship
                event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                
                -- Section identification
                section_type VARCHAR(100) NOT NULL, -- ceremony, reception, couple_info, gallery, etc
                title VARCHAR(300) NOT NULL,
                subtitle VARCHAR(500),
                
                -- Section content (flexible structure)
                content JSONB DEFAULT '{}',
                configuration JSONB DEFAULT '{}',
                
                -- Display settings
                is_visible BOOLEAN DEFAULT TRUE,
                display_order INTEGER DEFAULT 0,
                
                -- Template and styling
                template_name VARCHAR(100),
                custom_css TEXT,
                
                -- Multi-tenant support
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                
                -- Audit fields
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT sections_title_length CHECK (LENGTH(title) >= 2),
                UNIQUE (event_id, section_type, display_order)
            );
            
            -- Create event_templates table
            CREATE TABLE event_templates (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                
                -- Template identification
                event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                
                -- Template data
                template_data JSONB NOT NULL DEFAULT '{}', -- Complete template structure
                preview_data JSONB DEFAULT '{}', -- Sample data untuk preview
                
                -- Template settings
                is_public BOOLEAN DEFAULT FALSE,
                is_premium BOOLEAN DEFAULT FALSE,
                is_system_template BOOLEAN DEFAULT FALSE,
                
                -- Multi-tenant support
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL untuk system templates
                
                -- Usage tracking
                usage_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                
                -- Audit fields
                created_by UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT templates_name_length CHECK (LENGTH(name) >= 3),
                CONSTRAINT templates_rating_range CHECK (rating >= 0 AND rating <= 5),
                UNIQUE (name, tenant_id) -- Same name allowed across tenants
            );
            
            -- Update migration log
            UPDATE migration_logs 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                records_migrated = 0,
                metadata = metadata || jsonb_build_object('tables_created', 4)
            WHERE operation = 'migration_007_events_core_tables';
            
            COMMIT;
        `;
        
        try {
            await client.query(createCoreTablesSQL);
            console.log('   ✅ Core events tables created (events, participants, sections, templates)');
            successCount++;
            migrationResults.push({ step: 'core_tables', status: 'SUCCESS', tables: 4 });
        } catch (error) {
            await client.query('ROLLBACK');
            console.log(`   ❌ Error creating core tables: ${error.message}`);
            errorCount++;
            migrationResults.push({ step: 'core_tables', status: 'ERROR', error: error.message });
        }

        // ===============================================
        // MIGRATION STEP 4: Create Performance Indexes
        // ===============================================
        console.log('\n📋 STEP 4: Creating Performance Indexes');
        
        const createIndexesSQL = `
            BEGIN;
            
            INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
                'migration_008_performance_indexes',
                'started',
                CURRENT_TIMESTAMP,
                jsonb_build_object('description', 'Create performance indexes for <50ms targets')
            );
            
            -- Events table indexes
            CREATE INDEX idx_events_event_type_id ON events(event_type_id);
            CREATE INDEX idx_events_tenant_id ON events(tenant_id);
            CREATE INDEX idx_events_status ON events(status);
            CREATE INDEX idx_events_event_date ON events(event_date);
            CREATE INDEX idx_events_created_at ON events(created_at);
            CREATE INDEX idx_events_slug ON events(slug) WHERE slug IS NOT NULL;
            CREATE INDEX idx_events_published ON events(published_at) WHERE published_at IS NOT NULL;
            
            -- Event participants indexes  
            CREATE INDEX idx_participants_event_id ON event_participants(event_id);
            CREATE INDEX idx_participants_tenant_id ON event_participants(tenant_id);
            CREATE INDEX idx_participants_type ON event_participants(participant_type);
            CREATE INDEX idx_participants_rsvp_status ON event_participants(rsvp_status);
            CREATE INDEX idx_participants_contact_email ON event_participants USING gin ((contact_info->>'email'));
            CREATE INDEX idx_participants_invitation_sent ON event_participants(invitation_sent_at) WHERE invitation_sent_at IS NOT NULL;
            
            -- Event sections indexes
            CREATE INDEX idx_sections_event_id ON event_sections(event_id);
            CREATE INDEX idx_sections_tenant_id ON event_sections(tenant_id);
            CREATE INDEX idx_sections_type ON event_sections(section_type);
            CREATE INDEX idx_sections_visible ON event_sections(is_visible) WHERE is_visible = TRUE;
            CREATE INDEX idx_sections_display_order ON event_sections(event_id, display_order);
            
            -- Event templates indexes
            CREATE INDEX idx_templates_event_type_id ON event_templates(event_type_id);
            CREATE INDEX idx_templates_tenant_id ON event_templates(tenant_id);
            CREATE INDEX idx_templates_public ON event_templates(is_public) WHERE is_public = TRUE;
            CREATE INDEX idx_templates_usage_count ON event_templates(usage_count DESC);
            
            -- Composite indexes untuk common query patterns
            CREATE INDEX idx_events_tenant_status_date ON events(tenant_id, status, event_date) 
            WHERE status IN ('published', 'draft');
            
            CREATE INDEX idx_events_type_tenant_date ON events(event_type_id, tenant_id, event_date DESC);
            
            UPDATE migration_logs 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                metadata = metadata || jsonb_build_object('indexes_created', 20)
            WHERE operation = 'migration_008_performance_indexes';
            
            COMMIT;
        `;
        
        try {
            await client.query(createIndexesSQL);
            console.log('   ✅ Performance indexes created (20 indexes total)');
            successCount++;
            migrationResults.push({ step: 'performance_indexes', status: 'SUCCESS', indexes: 20 });
        } catch (error) {
            await client.query('ROLLBACK');
            console.log(`   ❌ Error creating indexes: ${error.message}`);
            errorCount++;
            migrationResults.push({ step: 'performance_indexes', status: 'ERROR', error: error.message });
        }

        client.release();

        // ===============================================
        // MIGRATION RESULTS SUMMARY
        // ===============================================
        console.log('\n' + '='.repeat(60));
        console.log('🚀 GREEN PHASE MIGRATION RESULTS');
        console.log('='.repeat(60));
        
        migrationResults.forEach((result, index) => {
            const status = result.status === 'SUCCESS' ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.step}`);
            if (result.records) console.log(`   Records: ${result.records}`);
            if (result.tables) console.log(`   Tables: ${result.tables}`);
            if (result.indexes) console.log(`   Indexes: ${result.indexes}`);
            if (result.error) console.log(`   Error: ${result.error}`);
            console.log('');
        });

        console.log(`📊 SUMMARY: ${successCount} successful, ${errorCount} failed, ${successCount + errorCount} total`);
        
        if (errorCount === 0) {
            console.log('\n🎉 TRANSFORMATION MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('🟢 EVENT MANAGEMENT ENGINE FOUNDATION READY');
            console.log('📋 Next step: Run post-migration validation tests');
        } else {
            console.log('\n⚠️  SOME MIGRATIONS FAILED - REVIEW REQUIRED');
            console.log('🔧 Check error details and retry if needed');
        }

        return { successCount, errorCount, total: successCount + errorCount, results: migrationResults };

    } catch (error) {
        console.error('❌ Migration execution error:', error.message);
        return { successCount: 0, errorCount: 1, total: 1, error: error.message };
    } finally {
        await pool.end();
    }
}

// Run migration
if (require.main === module) {
    executeTransformationMigration()
        .then(results => {
            process.exit(results.errorCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { executeTransformationMigration };