// ============================================================================
// PHASE 4: DATA MIGRATION VALIDATION TESTS
// ============================================================================
// Comprehensive test suite untuk validasi data migration dari wedding ke generic events
// Target: 100% success rate dengan zero data loss

const path = require('path');
const fs = require('fs');

describe('PHASE 4: Wedding Data Migration to Generic Events', () => {

  describe('Migration Files Validation', () => {
    const migrationFiles = [
      'database/migrations/FASE_0_TRANSFORMATION/006_event_types_foundation.sql',
      'database/migrations/FASE_0_TRANSFORMATION/007_events_core_tables.sql', 
      'database/migrations/FASE_0_TRANSFORMATION/008_enhanced_indexing.sql',
      'database/migrations/FASE_0_TRANSFORMATION/009_wedding_compatibility.sql',
      'database/migrations/FASE_0_TRANSFORMATION/010_wedding_data_migration.sql'
    ];

    migrationFiles.forEach(filePath => {
      test(`${path.basename(filePath)} should exist and be properly formatted`, () => {
        const fullPath = path.join(__dirname, '../../../', filePath);
        expect(fs.existsSync(fullPath)).toBe(true);
        
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content.length).toBeGreaterThan(100);
        expect(content).toContain('-- PHASE 4');
        expect(content).toContain('BEGIN;');
        expect(content).toContain('COMMIT;');
      });
    });
  });

  describe('Migration 006: Event Types Foundation', () => {
    let migrationContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/006_event_types_foundation.sql');
      migrationContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should create event_types table', () => {
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS event_types');
      expect(migrationContent).toContain('id UUID PRIMARY KEY DEFAULT uuid_generate_v4()');
      expect(migrationContent).toContain('name VARCHAR(100) UNIQUE NOT NULL');
      expect(migrationContent).toContain('display_name VARCHAR(200) NOT NULL');
    });

    test('should have proper JSONB fields for configuration', () => {
      expect(migrationContent).toContain('default_config JSONB');
      expect(migrationContent).toContain('required_fields JSONB');
      expect(migrationContent).toContain('optional_fields JSONB');
    });

    test('should insert wedding event type as system type', () => {
      expect(migrationContent).toContain('INSERT INTO event_types');
      expect(migrationContent).toContain('\'wedding\'');
      expect(migrationContent).toContain('\'Wedding Celebration\'');
      expect(migrationContent).toContain('\'social\'');
      expect(migrationContent).toContain('TRUE');
    });

    test('should create proper indexes', () => {
      expect(migrationContent).toContain('CREATE INDEX idx_event_types_name');
      expect(migrationContent).toContain('CREATE INDEX idx_event_types_category');
      expect(migrationContent).toContain('CREATE INDEX idx_event_types_active');
    });
  });

  describe('Migration 007: Core Tables Structure', () => {
    let migrationContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/007_events_core_tables.sql');
      migrationContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should create events table with proper structure', () => {
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS events');
      expect(migrationContent).toContain('event_type_id UUID NOT NULL REFERENCES event_types(id)');
      expect(migrationContent).toContain('title VARCHAR(255) NOT NULL');
      expect(migrationContent).toContain('form_data JSONB');
      expect(migrationContent).toContain('location JSONB');
    });

    test('should create event_participants table', () => {
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS event_participants');
      expect(migrationContent).toContain('event_id UUID NOT NULL REFERENCES events(id)');
      expect(migrationContent).toContain('participant_type VARCHAR(100) NOT NULL');
      expect(migrationContent).toContain('contact_info JSONB');
      expect(migrationContent).toContain('custom_fields JSONB');
    });

    test('should create event_sections table', () => {
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS event_sections');
      expect(migrationContent).toContain('event_id UUID NOT NULL REFERENCES events(id)');
      expect(migrationContent).toContain('section_type VARCHAR(100) NOT NULL');
      expect(migrationContent).toContain('display_order INTEGER');
    });

    test('should create event_templates table', () => {
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS event_templates');
      expect(migrationContent).toContain('event_type_id UUID NOT NULL REFERENCES event_types(id)');
      expect(migrationContent).toContain('template_data JSONB');
    });

    test('should have proper constraints', () => {
      expect(migrationContent).toContain('CONSTRAINT events_title_length');
      expect(migrationContent).toContain('CONSTRAINT events_valid_date_range');
      expect(migrationContent).toContain('CHECK');
    });
  });

  describe('Migration 008: Performance Indexing', () => {
    let migrationContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/008_enhanced_indexing.sql');
      migrationContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should create composite indexes for common queries', () => {
      expect(migrationContent).toContain('CREATE INDEX idx_events_tenant_status_date');
      expect(migrationContent).toContain('CREATE INDEX idx_events_type_tenant_date');
      expect(migrationContent).toContain('CREATE INDEX idx_participants_event_status');
      expect(migrationContent).toContain('CREATE INDEX idx_sections_event_order');
    });

    test('should create GIN indexes for JSON fields', () => {
      expect(migrationContent).toContain('CREATE INDEX idx_events_form_data_gin');
      expect(migrationContent).toContain('USING gin(form_data)');
      expect(migrationContent).toContain('CREATE INDEX idx_participants_contact_gin');
      expect(migrationContent).toContain('USING gin(contact_info)');
    });

    test('should create wedding-specific JSON indexes', () => {
      expect(migrationContent).toContain('idx_events_bride_name');
      expect(migrationContent).toContain('idx_events_groom_name');
      expect(migrationContent).toContain('idx_events_venue');
      expect(migrationContent).toContain('form_data->>\'bride_name\'');
      expect(migrationContent).toContain('form_data->>\'groom_name\'');
    });

    test('should create text search indexes', () => {
      expect(migrationContent).toContain('CREATE INDEX idx_events_title_search');
      expect(migrationContent).toContain('to_tsvector');
    });
  });

  describe('Migration 009: Wedding Compatibility Views', () => {
    let migrationContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/009_wedding_compatibility.sql');
      migrationContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should create wedding_invitations view', () => {
      expect(migrationContent).toContain('CREATE OR REPLACE VIEW wedding_invitations AS');
      expect(migrationContent).toContain('e.id');
      expect(migrationContent).toContain('e.form_data->>\'bride_name\' as bride_name');
      expect(migrationContent).toContain('e.form_data->>\'groom_name\' as groom_name');
      expect(migrationContent).toContain('e.event_date as wedding_date');
    });

    test('should create wedding_guests view with RSVP mapping', () => {
      expect(migrationContent).toContain('CREATE OR REPLACE VIEW wedding_guests AS');
      expect(migrationContent).toContain('CASE');
      expect(migrationContent).toContain('WHEN ep.rsvp_status = \'accepted\' THEN \'yes\'');
      expect(migrationContent).toContain('WHEN ep.rsvp_status = \'declined\' THEN \'no\'');
      expect(migrationContent).toContain('WHEN ep.rsvp_status = \'tentative\' THEN \'maybe\'');
      expect(migrationContent).toContain('ELSE \'pending\'');
    });

    test('should create wedding_templates view', () => {
      expect(migrationContent).toContain('CREATE OR REPLACE VIEW wedding_templates AS');
      expect(migrationContent).toContain('FROM event_templates et');
      expect(migrationContent).toContain('JOIN event_types ety ON ety.id = et.event_type_id');
      expect(migrationContent).toContain('WHERE ety.name = \'wedding\'');
    });

    test('should create wedding_sections view', () => {
      expect(migrationContent).toContain('CREATE OR REPLACE VIEW wedding_sections AS');
      expect(migrationContent).toContain('FROM event_sections es');
      expect(migrationContent).toContain('JOIN events e ON e.id = es.event_id');
    });
  });

  describe('Migration 010: Data Migration', () => {
    let migrationContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/010_wedding_data_migration.sql');
      migrationContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should create backup tables', () => {
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS wedding_invitations_backup AS');
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS wedding_guests_backup AS');
      expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS wedding_templates_backup AS');
    });

    test('should migrate wedding invitations to events', () => {
      expect(migrationContent).toContain('INSERT INTO events');
      expect(migrationContent).toContain('SELECT');
      expect(migrationContent).toContain('FROM wedding_invitations_backup');
      expect(migrationContent).toContain('jsonb_build_object');
      expect(migrationContent).toContain('\'bride_name\'');
      expect(migrationContent).toContain('\'groom_name\'');
    });

    test('should migrate wedding guests to event_participants', () => {
      expect(migrationContent).toContain('INSERT INTO event_participants');
      expect(migrationContent).toContain('FROM wedding_guests_backup');
      expect(migrationContent).toContain('\'guest\' as participant_type');
      expect(migrationContent).toContain('CASE wg.rsvp_status');
      expect(migrationContent).toContain('WHEN \'yes\' THEN \'accepted\'');
    });

    test('should create default event sections for weddings', () => {
      expect(migrationContent).toContain('INSERT INTO event_sections');
      expect(migrationContent).toContain('\'couple_info\'');
      expect(migrationContent).toContain('\'ceremony\'');
      expect(migrationContent).toContain('\'reception\'');
    });

    test('should log migration operations', () => {
      expect(migrationContent).toContain('INSERT INTO migration_logs');
      expect(migrationContent).toContain('migration_010_wedding_data_migration');
      expect(migrationContent).toContain('jsonb_build_object');
      expect(migrationContent).toContain('\'migrated_events\'');
      expect(migrationContent).toContain('\'migrated_participants\'');
    });
  });

  describe('Migration Executor Validation', () => {
    let executorContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/execute_transformation.cjs');
      executorContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should have TransformationExecutor class', () => {
      expect(executorContent).toContain('class TransformationExecutor');
      expect(executorContent).toContain('constructor');
      expect(executorContent).toContain('async executeMigration');
    });

    test('should support dry-run mode', () => {
      expect(executorContent).toContain('dryRun');
      expect(executorContent).toContain('DRY RUN MODE');
      expect(executorContent).toContain('No changes will be made');
    });

    test('should have rollback capabilities', () => {
      expect(executorContent).toContain('rollback');
      expect(executorContent).toContain('ROLLBACK');
      expect(executorContent).toContain('Rolling back');
    });

    test('should have validation methods', () => {
      expect(executorContent).toContain('validateMigration');
      expect(executorContent).toContain('checkDatabaseConnection');
      expect(executorContent).toContain('validateBackup');
    });

    test('should have comprehensive logging', () => {
      expect(executorContent).toContain('console.log');
      expect(executorContent).toContain('Migration started');
      expect(executorContent).toContain('Migration completed');
      expect(executorContent).toContain('ERROR');
    });
  });

  describe('Documentation Validation', () => {
    let readmeContent;
    
    beforeAll(() => {
      const filePath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/README.md');
      readmeContent = fs.readFileSync(filePath, 'utf8');
    });

    test('should have comprehensive migration documentation', () => {
      expect(readmeContent).toContain('# FASE 0 TRANSFORMATION');
      expect(readmeContent).toContain('## Migration Sequence');
      expect(readmeContent).toContain('## Safety Procedures');
      expect(readmeContent).toContain('## Rollback Strategy');
    });

    test('should document each migration file', () => {
      expect(readmeContent).toContain('006_event_types_foundation.sql');
      expect(readmeContent).toContain('007_events_core_tables.sql');
      expect(readmeContent).toContain('008_enhanced_indexing.sql');
      expect(readmeContent).toContain('009_wedding_compatibility.sql');
      expect(readmeContent).toContain('010_wedding_data_migration.sql');
    });

    test('should have execution instructions', () => {
      expect(readmeContent).toContain('## Execution');
      expect(readmeContent).toContain('node execute_transformation.cjs');
      expect(readmeContent).toContain('--dry-run');
      expect(readmeContent).toContain('--rollback');
    });

    test('should have troubleshooting section', () => {
      expect(readmeContent).toContain('## Troubleshooting');
      expect(readmeContent).toContain('Common Issues');
      expect(readmeContent).toContain('Recovery Procedures');
    });
  });

  describe('Data Integrity Validation', () => {
    test('should preserve referential integrity', () => {
      const coreTablesContent = fs.readFileSync(
        path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/007_events_core_tables.sql'), 
        'utf8'
      );
      
      // Check foreign key constraints
      expect(coreTablesContent).toContain('REFERENCES event_types(id)');
      expect(coreTablesContent).toContain('REFERENCES events(id)');
      expect(coreTablesContent).toContain('ON DELETE CASCADE');
    });

    test('should maintain tenant isolation', () => {
      const coreTablesContent = fs.readFileSync(
        path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/007_events_core_tables.sql'), 
        'utf8'
      );
      
      // Check tenant_id fields
      expect(coreTablesContent).toContain('tenant_id UUID NOT NULL');
      expect(coreTablesContent).toContain('REFERENCES tenants(id)');
    });

    test('should have proper data validation constraints', () => {
      const coreTablesContent = fs.readFileSync(
        path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/007_events_core_tables.sql'),
        'utf8'
      );
      
      expect(coreTablesContent).toContain('CONSTRAINT events_title_length CHECK (LENGTH(title) >= 3)');
      expect(coreTablesContent).toContain('CHECK (end_date IS NULL OR end_date >= event_date)');
    });
  });

  describe('Performance Validation', () => {
    test('should have optimized indexes for common query patterns', () => {
      const indexingContent = fs.readFileSync(
        path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/008_enhanced_indexing.sql'), 
        'utf8'
      );
      
      // Count total indexes created
      const indexCount = (indexingContent.match(/CREATE INDEX/g) || []).length;
      expect(indexCount).toBeGreaterThanOrEqual(10);
    });

    test('should have JSON field optimization', () => {
      const indexingContent = fs.readFileSync(
        path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/008_enhanced_indexing.sql'), 
        'utf8'
      );
      
      // Check GIN indexes for JSON fields
      const ginIndexCount = (indexingContent.match(/USING gin/g) || []).length;
      expect(ginIndexCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PHASE 4 COMPLETION VALIDATION', () => {
    test('All migration components should be complete and properly structured', () => {
      const migrationFiles = [
        'database/migrations/FASE_0_TRANSFORMATION/006_event_types_foundation.sql',
        'database/migrations/FASE_0_TRANSFORMATION/007_events_core_tables.sql', 
        'database/migrations/FASE_0_TRANSFORMATION/008_enhanced_indexing.sql',
        'database/migrations/FASE_0_TRANSFORMATION/009_wedding_compatibility.sql',
        'database/migrations/FASE_0_TRANSFORMATION/010_wedding_data_migration.sql',
        'database/migrations/FASE_0_TRANSFORMATION/execute_transformation.cjs',
        'database/migrations/FASE_0_TRANSFORMATION/README.md'
      ];

      const results = migrationFiles.map(filePath => {
        const fullPath = path.join(__dirname, '../../../', filePath);
        const exists = fs.existsSync(fullPath);
        let content = '';
        let isComplete = false;
        
        if (exists) {
          content = fs.readFileSync(fullPath, 'utf8');
          isComplete = content.length > 100;
        }

        return {
          file: path.basename(filePath),
          exists,
          isComplete,
          hasProperStructure: content.includes('PHASE 4') || content.includes('class TransformationExecutor') || content.includes('README'),
          hasErrorHandling: content.includes('catch') || content.includes('try') || content.includes('ROLLBACK'),
          contentLength: content.length
        };
      });

      console.log('\n🔍 PHASE 4 DATA MIGRATION ANALYSIS:');
      console.log('=====================================================');
      
      results.forEach(result => {
        const status = result.exists && result.isComplete && 
                      result.hasProperStructure ? '✅' : '❌';
        
        console.log(`${status} ${result.file}:`);
        console.log(`   - Exists: ${result.exists ? '✅' : '❌'}`);
        console.log(`   - Complete: ${result.isComplete ? '✅' : '❌'}`);
        console.log(`   - Proper Structure: ${result.hasProperStructure ? '✅' : '❌'}`);
        console.log(`   - Error Handling: ${result.hasErrorHandling ? '✅' : '❌'}`);
        console.log(`   - Content Length: ${result.contentLength} characters`);
        console.log('');
      });

      // Calculate overall success rate
      const totalChecks = results.length * 4;
      const passedChecks = results.reduce((acc, result) => {
        return acc + 
          (result.exists ? 1 : 0) +
          (result.isComplete ? 1 : 0) +
          (result.hasProperStructure ? 1 : 0) +
          (result.hasErrorHandling ? 1 : 0);
      }, 0);

      const successRate = ((passedChecks / totalChecks) * 100).toFixed(2);
      
      console.log(`📊 PHASE 4 SUCCESS RATE: ${successRate}% (${passedChecks}/${totalChecks} checks passed)`);
      console.log('=====================================================\n');

      // All migration components should exist and be properly structured
      results.forEach(result => {
        expect(result.exists).toBe(true);
        expect(result.isComplete).toBe(true);
        expect(result.hasProperStructure).toBe(true);
      });

      // Overall success rate should be high
      expect(parseFloat(successRate)).toBeGreaterThanOrEqual(90);
    });

    test('Migration framework should be ready for production execution', () => {
      const executorPath = path.join(__dirname, '../../../database/migrations/FASE_0_TRANSFORMATION/execute_transformation.cjs');
      const executorContent = fs.readFileSync(executorPath, 'utf8');
      
      const hasRequiredFeatures = {
        hasClass: executorContent.includes('class TransformationExecutor'),
        hasDryRun: executorContent.includes('dryRun'),
        hasRollback: executorContent.includes('rollback'),
        hasValidation: executorContent.includes('validateMigration'),
        hasLogging: executorContent.includes('console.log'),
        hasErrorHandling: executorContent.includes('try {') && executorContent.includes('catch'),
        hasBackup: executorContent.includes('backup'),
        hasProgressTracking: executorContent.includes('progress') || executorContent.includes('step')
      };
      
      console.log('\n🚀 MIGRATION EXECUTOR READINESS:');
      console.log('==================================');
      Object.entries(hasRequiredFeatures).forEach(([feature, hasIt]) => {
        console.log(`${hasIt ? '✅' : '❌'} ${feature.replace('has', '')}: ${hasIt ? 'YES' : 'NO'}`);
      });
      console.log('==================================\n');

      Object.values(hasRequiredFeatures).forEach(hasFeature => {
        expect(hasFeature).toBe(true);
      });
    });
  });
});