// ===============================================
// CHUNK 0b.1: Create Backward Compatibility Views
// ===============================================
// Protocol: Test-First Development (TFD) - GREEN Phase Final
// Purpose: Ensure 100% backward compatibility for wedding functionality
// Author: Kilo Code
// Created: 2025-08-12

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'emesys_dev',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
};

async function createCompatibilityViews() {
    const pool = new Pool(config);
    console.log('🔄 CREATING BACKWARD COMPATIBILITY VIEWS\n');
    
    try {
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // Create compatibility views SQL
        const createViewsSQL = `
            BEGIN;
            
            -- Migration log entry
            INSERT INTO migration_logs (operation, status, started_at, metadata) VALUES (
                'migration_009_wedding_compatibility',
                'started', 
                CURRENT_TIMESTAMP,
                jsonb_build_object(
                    'description', 'Create wedding compatibility views',
                    'impact', 'compatibility',
                    'breaking_changes', false
                )
            );
            
            -- Wedding invitations compatibility view
            CREATE VIEW wedding_invitations AS
            SELECT 
                e.id,
                e.tenant_id,
                e.title,
                e.description,
                e.event_date as wedding_date,
                e.event_time as ceremony_time,
                e.form_data->>'bride_name' as bride_name,
                e.form_data->>'groom_name' as groom_name,
                e.form_data->>'reception_time' as reception_time,
                e.location->>'venue' as venue_name,
                e.location->>'address' as venue_address,
                e.location->'coordinates' as venue_coordinates,
                e.status,
                e.visibility,
                e.slug,
                e.meta_title,
                e.meta_description,
                e.social_image_url,
                e.created_by,
                e.created_at,
                e.updated_at,
                e.published_at
            FROM events e
            JOIN event_types et ON et.id = e.event_type_id
            WHERE et.name = 'wedding';
            
            -- Wedding guests compatibility view  
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
                ep.rsvp_notes,
                ep.special_requirements,
                ep.attendance_confirmed,
                ep.created_at,
                ep.updated_at
            FROM event_participants ep
            JOIN events e ON e.id = ep.event_id
            JOIN event_types et ON et.id = e.event_type_id
            WHERE et.name = 'wedding' AND ep.participant_type = 'guest';
            
            -- Wedding templates compatibility view
            CREATE VIEW wedding_templates AS
            SELECT 
                et.id,
                et.name as template_name,
                et.description,
                et.template_data->'layout' as layout_config,
                et.template_data->'colors' as color_scheme,
                et.template_data->'fonts' as font_config,
                et.template_data->'sections' as sections_config,
                et.is_public,
                et.is_premium,
                et.tenant_id,
                et.usage_count,
                et.rating,
                et.created_by,
                et.created_at,
                et.updated_at
            FROM event_templates et
            JOIN event_types ety ON ety.id = et.event_type_id
            WHERE ety.name = 'wedding';
            
            -- Wedding sections compatibility view
            CREATE VIEW wedding_sections AS
            SELECT 
                es.id,
                es.event_id as wedding_invitation_id,
                es.section_type,
                es.title,
                es.subtitle,
                es.content,
                es.is_visible,
                es.display_order,
                es.template_name,
                es.custom_css,
                es.created_at,
                es.updated_at
            FROM event_sections es
            JOIN events e ON e.id = es.event_id
            JOIN event_types et ON et.id = e.event_type_id
            WHERE et.name = 'wedding';
            
            -- Update migration log
            UPDATE migration_logs 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                metadata = metadata || jsonb_build_object(
                    'views_created', 4,
                    'compatibility_level', 'full'
                )
            WHERE operation = 'migration_009_wedding_compatibility';
            
            COMMIT;
        `;
        
        await client.query(createViewsSQL);
        console.log('✅ Wedding compatibility views created successfully');
        console.log('   👁️  wedding_invitations view - maps to events with wedding type');
        console.log('   👁️  wedding_guests view - maps to event_participants with guest type');
        console.log('   👁️  wedding_templates view - maps to event_templates for wedding');
        console.log('   👁️  wedding_sections view - maps to event_sections for wedding');
        
        client.release();
        
        console.log('\n🎉 BACKWARD COMPATIBILITY VIEWS COMPLETED!');
        console.log('📄 All existing wedding APIs will continue to work unchanged');
        
        return { success: true, viewsCreated: 4 };
        
    } catch (error) {
        console.error('❌ Create compatibility views error:', error.message);
        return { success: false, error: error.message };
    } finally {
        await pool.end();
    }
}

// Run creation
if (require.main === module) {
    createCompatibilityViews()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { createCompatibilityViews };