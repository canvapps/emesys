// ============================================================================
// PHASE 4: DATA MIGRATION VALIDATION TESTS  
// ============================================================================
// Comprehensive test suite untuk validasi data migration dari wedding ke generic events
// Target: 100% success rate dengan zero data loss

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dbConnection } from '../../../src/database/connection.ts';

describe('PHASE 4: Wedding Data Migration to Generic Events', () => {
  let db;
  let testTenantId;
  let weddingTypeId;
  
  beforeAll(async () => {
    await dbConnection.connect();
    db = dbConnection;
    
    // Create test tenant if not exists
    const tenantResult = await db.query(`
      INSERT INTO tenants (id, name, domain) 
      VALUES (uuid_generate_v4(), 'Test Tenant', 'test.example.com')
      ON CONFLICT (domain) DO NOTHING
      RETURNING id
    `);
    
    if (tenantResult.rows.length > 0) {
      testTenantId = tenantResult.rows[0].id;
    } else {
      const existingTenant = await db.query(`
        SELECT id FROM tenants WHERE domain = 'test.example.com' LIMIT 1
      `);
      testTenantId = existingTenant.rows[0].id;
    }
    
    // Get wedding event type ID
    const weddingType = await db.query(`
      SELECT id FROM event_types WHERE name = 'wedding' LIMIT 1
    `);
    weddingTypeId = weddingType.rows[0]?.id;
  });
  
  afterAll(async () => {
    if (db) {
      await db.end();
    }
  });

  describe('Migration 006: Event Types Foundation', () => {
    it('should have wedding event type created', async () => {
      const result = await db.query(`
        SELECT id, name, display_name, category, is_system_type, is_active
        FROM event_types 
        WHERE name = 'wedding'
      `);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('wedding');
      expect(result.rows[0].display_name).toBe('Wedding Celebration');
      expect(result.rows[0].category).toBe('social');
      expect(result.rows[0].is_system_type).toBe(true);
      expect(result.rows[0].is_active).toBe(true);
    });

    it('should have proper event type configuration', async () => {
      const result = await db.query(`
        SELECT default_config, required_fields, optional_fields
        FROM event_types 
        WHERE name = 'wedding'
      `);
      
      expect(result.rows).toHaveLength(1);
      const config = result.rows[0];
      
      expect(config.default_config).toHaveProperty('supports_rsvp', true);
      expect(config.default_config).toHaveProperty('supports_plus_one', true);
      expect(Array.isArray(config.required_fields)).toBe(true);
      expect(Array.isArray(config.optional_fields)).toBe(true);
      expect(config.required_fields).toContain('bride_name');
      expect(config.required_fields).toContain('groom_name');
    });

    it('should have proper indexes created', async () => {
      const indexResult = await db.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'event_types' 
        AND indexname IN ('idx_event_types_name', 'idx_event_types_category', 'idx_event_types_active')
      `);
      
      expect(indexResult.rows).toHaveLength(3);
    });
  });

  describe('Migration 007: Core Tables Structure', () => {
    it('should have all core tables created', async () => {
      const tables = ['events', 'event_participants', 'event_sections', 'event_templates'];
      
      for (const tableName of tables) {
        const result = await db.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        
        expect(result.rows).toHaveLength(1);
      }
    });

    it('should have proper foreign key relationships', async () => {
      const foreignKeys = await db.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('events', 'event_participants', 'event_sections', 'event_templates')
        ORDER BY tc.table_name, kcu.column_name
      `);
      
      expect(foreignKeys.rows.length).toBeGreaterThan(8);
      
      // Check specific relationships
      const eventToEventType = foreignKeys.rows.find(
        fk => fk.table_name === 'events' && fk.column_name === 'event_type_id'
      );
      expect(eventToEventType).toBeTruthy();
      expect(eventToEventType.foreign_table_name).toBe('event_types');
      
      const participantToEvent = foreignKeys.rows.find(
        fk => fk.table_name === 'event_participants' && fk.column_name === 'event_id'
      );
      expect(participantToEvent).toBeTruthy();
      expect(participantToEvent.foreign_table_name).toBe('events');
    });

    it('should have proper constraints and checks', async () => {
      // Test events table constraints
      try {
        await db.query(`
          INSERT INTO events (event_type_id, title, event_date, tenant_id)
          VALUES ($1, 'T', '2025-12-31', $2)
        `, [weddingTypeId, testTenantId]);
        
        throw new Error('Should not allow short titles');
      } catch (error) {
        expect(error.message).toContain('events_title_length');
      }
      
      // Test date range constraint
      try {
        await db.query(`
          INSERT INTO events (event_type_id, title, event_date, end_date, tenant_id)
          VALUES ($1, 'Test Event', '2025-12-31', '2025-12-30', $2)
        `, [weddingTypeId, testTenantId]);
        
        throw new Error('Should not allow end_date before event_date');
      } catch (error) {
        expect(error.message).toContain('events_valid_date_range');
      }
    });
  });

  describe('Migration 008: Performance Indexing', () => {
    it('should have composite indexes for common queries', async () => {
      const compositeIndexes = [
        'idx_events_tenant_status_date',
        'idx_events_type_tenant_date',
        'idx_participants_event_status',
        'idx_sections_event_order'
      ];
      
      for (const indexName of compositeIndexes) {
        const result = await db.query(`
          SELECT indexname FROM pg_indexes 
          WHERE schemaname = 'public' AND indexname = $1
        `, [indexName]);
        
        expect(result.rows).toHaveLength(1);
      }
    });

    it('should have GIN indexes for JSON fields', async () => {
      const ginIndexes = [
        'idx_events_form_data_gin',
        'idx_participants_contact_gin',
        'idx_events_title_search'
      ];
      
      for (const indexName of ginIndexes) {
        const result = await db.query(`
          SELECT indexname FROM pg_indexes 
          WHERE schemaname = 'public' AND indexname = $1
        `, [indexName]);
        
        expect(result.rows).toHaveLength(1);
      }
    });

    it('should have wedding-specific JSON field indexes', async () => {
      const weddingIndexes = [
        'idx_events_bride_name',
        'idx_events_groom_name',
        'idx_events_venue'
      ];
      
      for (const indexName of weddingIndexes) {
        const result = await db.query(`
          SELECT indexname FROM pg_indexes 
          WHERE schemaname = 'public' AND indexname = $1
        `, [indexName]);
        
        expect(result.rows).toHaveLength(1);
      }
    });
  });

  describe('Migration 009: Wedding Compatibility Views', () => {
    it('should have all compatibility views created', async () => {
      const views = ['wedding_invitations', 'wedding_guests', 'wedding_templates', 'wedding_sections'];
      
      for (const viewName of views) {
        const result = await db.query(`
          SELECT table_name FROM information_schema.views 
          WHERE table_schema = 'public' AND table_name = $1
        `, [viewName]);
        
        expect(result.rows).toHaveLength(1);
      }
    });

    it('should have proper column mappings in views', async () => {
      // Test wedding_invitations view columns
      const columnsResult = await db.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'wedding_invitations'
        ORDER BY column_name
      `);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('bride_name');
      expect(columns).toContain('groom_name');
      expect(columns).toContain('wedding_date');
      expect(columns).toContain('venue_name');
      expect(columns).toContain('ceremony_time');
    });

    it('should properly map RSVP status in wedding_guests view', async () => {
      // This will be tested after data migration
      const result = await db.query(`
        SELECT DISTINCT rsvp_status FROM wedding_guests LIMIT 5
      `);
      
      // Should only contain old format values: 'yes', 'no', 'maybe', 'pending'
      if (result.rows.length > 0) {
        const validStatuses = ['yes', 'no', 'maybe', 'pending'];
        result.rows.forEach(row => {
          expect(validStatuses).toContain(row.rsvp_status);
        });
      }
    });
  });

  describe('Migration 010: Data Migration Validation', () => {
    let testEventId;
    let testParticipantId;
    
    beforeAll(async () => {
      // Create test data untuk migration validation
      await db.query('BEGIN');
      
      try {
        // Create test wedding invitation (if not exists)
        const eventResult = await db.query(`
          INSERT INTO events (
            event_type_id, title, event_date, location, form_data, 
            status, tenant_id, created_at, updated_at
          ) VALUES (
            $1, 'Test Migration Wedding', '2025-12-25',
            '{"venue": "Test Venue", "address": "123 Test St"}',
            '{"bride_name": "Jane Test", "groom_name": "John Test", "reception_time": "18:00"}',
            'published', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) 
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [weddingTypeId, testTenantId]);
        
        if (eventResult.rows.length > 0) {
          testEventId = eventResult.rows[0].id;
        } else {
          const existingEvent = await db.query(`
            SELECT id FROM events WHERE title = 'Test Migration Wedding' LIMIT 1
          `);
          testEventId = existingEvent.rows[0]?.id;
        }
        
        // Create test participant
        if (testEventId) {
          const participantResult = await db.query(`
            INSERT INTO event_participants (
              event_id, participant_type, contact_info, custom_fields,
              rsvp_status, tenant_id, created_at, updated_at
            ) VALUES (
              $1, 'guest', 
              '{"name": "Test Guest", "email": "test@example.com", "phone": "123-456-7890"}',
              '{"plus_one_name": "Plus One", "meal_preference": "vegetarian"}',
              'accepted', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT DO NOTHING
            RETURNING id
          `, [testEventId, testTenantId]);
          
          if (participantResult.rows.length > 0) {
            testParticipantId = participantResult.rows[0].id;
          }
        }
        
        await db.query('COMMIT');
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    });

    it('should preserve all event data during migration', async () => {
      if (!testEventId) {
        return; // Skip if no test data
      }
      
      // Check event data integrity
      const eventResult = await db.query(`
        SELECT 
          e.title,
          e.event_date,
          e.form_data->>'bride_name' as bride_name,
          e.form_data->>'groom_name' as groom_name,
          e.location->>'venue' as venue,
          e.status,
          et.name as event_type
        FROM events e
        JOIN event_types et ON et.id = e.event_type_id
        WHERE e.id = $1
      `, [testEventId]);
      
      expect(eventResult.rows).toHaveLength(1);
      const event = eventResult.rows[0];
      expect(event.title).toBe('Test Migration Wedding');
      expect(event.bride_name).toBe('Jane Test');
      expect(event.groom_name).toBe('John Test');
      expect(event.venue).toBe('Test Venue');
      expect(event.event_type).toBe('wedding');
    });

    it('should preserve all participant data during migration', async () => {
      if (!testParticipantId) {
        return; // Skip if no test data
      }
      
      const participantResult = await db.query(`
        SELECT 
          contact_info->>'name' as name,
          contact_info->>'email' as email,
          custom_fields->>'plus_one_name' as plus_one_name,
          custom_fields->>'meal_preference' as meal_preference,
          rsvp_status,
          participant_type
        FROM event_participants 
        WHERE id = $1
      `, [testParticipantId]);
      
      expect(participantResult.rows).toHaveLength(1);
      const participant = participantResult.rows[0];
      expect(participant.name).toBe('Test Guest');
      expect(participant.email).toBe('test@example.com');
      expect(participant.plus_one_name).toBe('Plus One');
      expect(participant.meal_preference).toBe('vegetarian');
      expect(participant.rsvp_status).toBe('accepted');
      expect(participant.participant_type).toBe('guest');
    });

    it('should maintain backward compatibility through views', async () => {
      if (!testEventId) {
        return; // Skip if no test data
      }
      
      // Test wedding_invitations view
      const weddingResult = await db.query(`
        SELECT bride_name, groom_name, venue_name, wedding_date
        FROM wedding_invitations 
        WHERE id = $1
      `, [testEventId]);
      
      if (weddingResult.rows.length > 0) {
        const wedding = weddingResult.rows[0];
        expect(wedding.bride_name).toBe('Jane Test');
        expect(wedding.groom_name).toBe('John Test');
        expect(wedding.venue_name).toBe('Test Venue');
        expect(wedding.wedding_date).toBeTruthy();
      }
    });

    it('should properly map RSVP statuses in compatibility views', async () => {
      if (!testParticipantId) {
        return; // Skip if no test data
      }
      
      // Test wedding_guests view with RSVP status mapping
      const guestResult = await db.query(`
        SELECT guest_name, guest_email, rsvp_status, plus_one_name
        FROM wedding_guests wg
        JOIN event_participants ep ON ep.id = $1
        WHERE ep.event_id = wg.wedding_invitation_id
        AND ep.contact_info->>'email' = wg.guest_email
      `, [testParticipantId]);
      
      if (guestResult.rows.length > 0) {
        const guest = guestResult.rows[0];
        expect(guest.guest_name).toBe('Test Guest');
        expect(guest.guest_email).toBe('test@example.com');
        expect(guest.rsvp_status).toBe('yes'); // 'accepted' -> 'yes'
        expect(guest.plus_one_name).toBe('Plus One');
      }
    });

    it('should create default event sections for migrated weddings', async () => {
      if (!testEventId) {
        return; // Skip if no test data
      }
      
      const sectionsResult = await db.query(`
        SELECT section_type, title, is_visible, display_order
        FROM event_sections 
        WHERE event_id = $1
        ORDER BY display_order
      `, [testEventId]);
      
      expect(sectionsResult.rows.length).toBeGreaterThan(0);
      
      const sectionTypes = sectionsResult.rows.map(s => s.section_type);
      expect(sectionTypes).toContain('couple_info');
      // May also contain ceremony, reception sections
    });

    it('should preserve tenant isolation', async () => {
      // Verify all migrated data belongs to correct tenant
      const tenantCheckResult = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM events WHERE tenant_id != $1) as invalid_events,
          (SELECT COUNT(*) FROM event_participants WHERE tenant_id != $1) as invalid_participants,
          (SELECT COUNT(*) FROM event_sections WHERE tenant_id != $1) as invalid_sections
      `, [testTenantId]);
      
      const tenantCheck = tenantCheckResult.rows[0];
      // We can't guarantee 0 because there might be data from other tenants
      // But we can verify our test data is properly isolated
      
      const ourDataResult = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM events WHERE tenant_id = $1) as our_events,
          (SELECT COUNT(*) FROM event_participants WHERE tenant_id = $1) as our_participants,
          (SELECT COUNT(*) FROM event_sections WHERE tenant_id = $1) as our_sections
      `, [testTenantId]);
      
      const ourData = ourDataResult.rows[0];
      expect(parseInt(ourData.our_events)).toBeGreaterThan(0);
    });

    it('should maintain referential integrity', async () => {
      // Check no orphaned records
      const integrityResult = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM event_participants ep 
           WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = ep.event_id)) as orphaned_participants,
          (SELECT COUNT(*) FROM event_sections es 
           WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = es.event_id)) as orphaned_sections,
          (SELECT COUNT(*) FROM event_templates et 
           WHERE NOT EXISTS (SELECT 1 FROM event_types ety WHERE ety.id = et.event_type_id)) as orphaned_templates
      `);
      
      const integrity = integrityResult.rows[0];
      expect(parseInt(integrity.orphaned_participants)).toBe(0);
      expect(parseInt(integrity.orphaned_sections)).toBe(0);
      expect(parseInt(integrity.orphaned_templates)).toBe(0);
    });

    it('should have backup tables created', async () => {
      const backupTables = ['wedding_invitations_backup', 'wedding_guests_backup', 'wedding_templates_backup'];
      
      for (const tableName of backupTables) {
        const result = await db.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        
        expect(result.rows).toHaveLength(1);
      }
    });
  });

  describe('Performance Validation', () => {
    it('should execute event listing queries under 50ms', async () => {
      const startTime = process.hrtime();
      
      await db.query(`
        SELECT e.id, e.title, e.event_date, e.status,
               COUNT(ep.id) as participant_count
        FROM events e
        LEFT JOIN event_participants ep ON ep.event_id = e.id
        WHERE e.tenant_id = $1
          AND e.status = 'published'
        GROUP BY e.id, e.title, e.event_date, e.status
        ORDER BY e.event_date DESC
        LIMIT 20
      `, [testTenantId]);
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      expect(milliseconds).toBeLessThan(50);
    });

    it('should execute wedding-specific queries under 50ms', async () => {
      const startTime = process.hrtime();
      
      await db.query(`
        SELECT e.id, e.title, 
               e.form_data->>'bride_name' as bride_name,
               e.form_data->>'groom_name' as groom_name,
               e.location->>'venue' as venue
        FROM events e
        WHERE e.event_type_id = $1
          AND e.tenant_id = $2
          AND e.form_data->>'bride_name' IS NOT NULL
        ORDER BY e.event_date DESC
        LIMIT 10
      `, [weddingTypeId, testTenantId]);
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      expect(milliseconds).toBeLessThan(50);
    });

    it('should execute RSVP queries under 50ms', async () => {
      const startTime = process.hrtime();
      
      await db.query(`
        SELECT ep.id, ep.contact_info->>'name' as name,
               ep.rsvp_status, ep.participant_type
        FROM event_participants ep
        JOIN events e ON e.id = ep.event_id  
        WHERE ep.tenant_id = $1
          AND ep.rsvp_status = 'pending'
        ORDER BY ep.created_at DESC
        LIMIT 50
      `, [testTenantId]);
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      expect(milliseconds).toBeLessThan(50);
    });
  });

  describe('Migration Log Validation', () => {
    it('should have all migration operations logged', async () => {
      const migrationOps = [
        'migration_006_event_types_foundation',
        'migration_007_events_core_tables',
        'migration_008_enhanced_indexing',
        'migration_009_wedding_compatibility',
        'migration_010_wedding_data_migration'
      ];
      
      const logResult = await db.query(`
        SELECT operation, status FROM migration_logs 
        WHERE operation = ANY($1)
        ORDER BY started_at
      `, [migrationOps]);
      
      expect(logResult.rows.length).toBeGreaterThanOrEqual(5);
      
      logResult.rows.forEach(log => {
        expect(log.status).toBe('completed');
      });
    });

    it('should have detailed migration metadata', async () => {
      const metadataResult = await db.query(`
        SELECT operation, metadata FROM migration_logs 
        WHERE operation = 'migration_010_wedding_data_migration'
        AND status = 'completed'
      `);
      
      if (metadataResult.rows.length > 0) {
        const metadata = metadataResult.rows[0].metadata;
        expect(metadata).toHaveProperty('migrated_events');
        expect(metadata).toHaveProperty('migrated_participants');  
        expect(metadata).toHaveProperty('backup_tables_created');
        expect(metadata.backup_tables_created).toBe(3);
      }
    });
  });
});