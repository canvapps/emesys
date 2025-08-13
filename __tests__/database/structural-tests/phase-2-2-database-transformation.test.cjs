/**
 * PHASE 2.2 - DATABASE TABLE TRANSFORMATION TESTS (TFD)
 * 
 * Test-First Development untuk transformasi database tables
 * dari wedding-specific (`wedding_*`) menjadi generic event tables (`event_*`).
 * 
 * Target: Transform database schema dan update hooks untuk generic tables
 */

const fs = require('fs');
const path = require('path');

// Color codes untuk terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}[${new Date().toISOString()}] 🚀 Starting Phase 2.2 Database Transformation Tests (TFD)${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] =================================================================================${colors.reset}`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(testName, status, details = '') {
  totalTests++;
  if (status) {
    passedTests++;
    console.log(`${colors.green}[${new Date().toISOString()}] ✅ ${testName}: ${details}${colors.reset}`);
  } else {
    failedTests++;
    console.log(`${colors.red}[${new Date().toISOString()}] ❌ ${testName}: ${details}${colors.reset}`);
  }
}

function runTest(testName, testFunction) {
  console.log(`${colors.cyan}[${new Date().toISOString()}] TEST ${totalTests + 1}: ${testName}${colors.reset}`);
  try {
    testFunction();
  } catch (error) {
    logTest(testName, false, `Test failed with error: ${error.message}`);
  }
}

// ========================================
// TEST 1: Validate Generic Database Migration Files
// ========================================
runTest('Validating generic database migration files', () => {
  const migrationsPath = path.join(process.cwd(), 'database/migrations');
  
  // Check for generic event migrations
  const eventParticipantsMigration = fs.existsSync(path.join(migrationsPath, '202501_create_event_participants.sql'));
  const eventContentMigration = fs.existsSync(path.join(migrationsPath, '202501_create_event_content.sql'));
  const eventSectionsMigration = fs.existsSync(path.join(migrationsPath, '202501_create_event_sections.sql'));
  const eventStoriesMigration = fs.existsSync(path.join(migrationsPath, '202501_create_event_stories.sql'));
  
  logTest('Event Participants Migration', eventParticipantsMigration,
    eventParticipantsMigration ? 'event_participants migration exists' : 'event_participants migration missing');
  
  logTest('Event Content Migration', eventContentMigration,
    eventContentMigration ? 'event_content migration exists' : 'event_content migration missing');
  
  logTest('Event Sections Migration', eventSectionsMigration,
    eventSectionsMigration ? 'event_sections migration exists' : 'event_sections migration missing');
  
  logTest('Event Stories Migration', eventStoriesMigration,
    eventStoriesMigration ? 'event_stories migration exists' : 'event_stories migration missing');
});

// ========================================
// TEST 2: Validate Data Migration Scripts
// ========================================
runTest('Validating data migration scripts', () => {
  const migrationsPath = path.join(process.cwd(), 'database/migrations');
  
  // Check for data migration scripts
  const weddingToEventMigration = fs.existsSync(path.join(migrationsPath, '202501_migrate_wedding_to_event_data.sql'));
  const backwardCompatMigration = fs.existsSync(path.join(migrationsPath, '202501_create_backward_compatibility_views.sql'));
  
  logTest('Wedding to Event Data Migration', weddingToEventMigration,
    weddingToEventMigration ? 'Wedding data migration script exists' : 'Wedding data migration script missing');
  
  logTest('Backward Compatibility Views', backwardCompatMigration,
    backwardCompatMigration ? 'Backward compatibility views exist' : 'Backward compatibility views missing');
});

// ========================================
// TEST 3: Validate Updated useEventContent Hook
// ========================================
runTest('Validating updated useEventContent hook for generic tables', () => {
  const useEventContentPath = path.join(process.cwd(), 'src/hooks/useEventContent.ts');
  
  if (fs.existsSync(useEventContentPath)) {
    const content = fs.readFileSync(useEventContentPath, 'utf8');
    
    // Check for generic table references
    const usesEventParticipants = content.includes('event_participants') && content.includes('.from(\'event_participants\')');
    const usesEventContent = content.includes('event_content') && content.includes('.from(\'event_content\')');
    const usesEventSections = content.includes('event_sections') && content.includes('.from(\'event_sections\')');
    const usesEventStories = content.includes('event_stories') && content.includes('.from(\'event_stories\')');
    
    // Check no wedding table references in generic paths
    const noWeddingTables = !content.includes('wedding_couple_info') || content.includes('// Legacy compatibility:');
    
    logTest('Uses Event Participants Table', usesEventParticipants,
      usesEventParticipants ? 'Hook uses event_participants table' : 'Hook still uses wedding tables');
    
    logTest('Uses Event Content Table', usesEventContent,
      usesEventContent ? 'Hook uses event_content table' : 'Hook missing event_content table usage');
    
    logTest('Uses Event Sections Table', usesEventSections,
      usesEventSections ? 'Hook uses event_sections table' : 'Hook missing event_sections table usage');
    
    logTest('Uses Event Stories Table', usesEventStories,
      usesEventStories ? 'Hook uses event_stories table' : 'Hook missing event_stories table usage');
    
    logTest('No Direct Wedding Table References', noWeddingTables,
      noWeddingTables ? 'No direct wedding table references in generic code' : 'Wedding table references still present');
  } else {
    logTest('useEventContent Hook Exists', false, 'useEventContent.ts does not exist');
  }
});

// ========================================
// TEST 4: Validate Generic Database Schema Structure
// ========================================
runTest('Validating generic database schema structure', () => {
  // Check if schema documentation exists
  const schemaDocPath = path.join(process.cwd(), 'docs/DATABASE_SCHEMA_GENERIC.md');
  const schemaDocExists = fs.existsSync(schemaDocPath);
  
  logTest('Generic Schema Documentation', schemaDocExists,
    schemaDocExists ? 'Generic database schema documentation exists' : 'Generic schema documentation missing');
  
  if (schemaDocExists) {
    const content = fs.readFileSync(schemaDocPath, 'utf8');
    
    // Check for required generic tables in documentation
    const hasEventParticipants = content.includes('event_participants');
    const hasEventContent = content.includes('event_content');
    const hasEventSections = content.includes('event_sections');
    const hasEventStories = content.includes('event_stories');
    
    logTest('Schema Includes Event Participants', hasEventParticipants,
      hasEventParticipants ? 'Schema docs include event_participants' : 'Schema docs missing event_participants');
    
    logTest('Schema Includes Event Content', hasEventContent,
      hasEventContent ? 'Schema docs include event_content' : 'Schema docs missing event_content');
    
    logTest('Schema Includes Event Sections', hasEventSections,
      hasEventSections ? 'Schema docs include event_sections' : 'Schema docs missing event_sections');
    
    logTest('Schema Includes Event Stories', hasEventStories,
      hasEventStories ? 'Schema docs include event_stories' : 'Schema docs missing event_stories');
  }
});

// ========================================
// TEST 5: Validate Plugin-Database Integration
// ========================================
runTest('Validating plugin-database integration', () => {
  const weddingPluginPath = path.join(process.cwd(), 'src/hooks/compatibility/weddingPlugin.ts');
  
  if (fs.existsSync(weddingPluginPath)) {
    const content = fs.readFileSync(weddingPluginPath, 'utf8');
    
    // Check for database mapping to generic tables
    const mapsToEventParticipants = content.includes('event_participants');
    const mapsToEventContent = content.includes('event_content');
    const mapsToEventSections = content.includes('event_sections');
    const hasFieldMappings = content.includes('field_mappings');
    
    logTest('Plugin Maps to Event Participants', mapsToEventParticipants,
      mapsToEventParticipants ? 'Plugin maps to event_participants' : 'Plugin missing event_participants mapping');
    
    logTest('Plugin Maps to Event Content', mapsToEventContent,
      mapsToEventContent ? 'Plugin maps to event_content' : 'Plugin missing event_content mapping');
    
    logTest('Plugin Maps to Event Sections', mapsToEventSections,
      mapsToEventSections ? 'Plugin maps to event_sections' : 'Plugin missing event_sections mapping');
    
    logTest('Plugin Has Field Mappings', hasFieldMappings,
      hasFieldMappings ? 'Plugin includes field mappings for transformation' : 'Plugin missing field mappings');
  } else {
    logTest('Wedding Plugin Integration', false, 'weddingPlugin.ts does not exist');
  }
});

// ========================================
// TEST 6: Validate Backward Compatibility Preserved
// ========================================
runTest('Validating backward compatibility preserved', () => {
  const weddingWrapperPath = path.join(process.cwd(), 'src/hooks/compatibility/weddingWrapper.ts');
  
  if (fs.existsSync(weddingWrapperPath)) {
    const content = fs.readFileSync(weddingWrapperPath, 'utf8');
    
    // Check compatibility functions still work
    const hasWeddingContentWrapper = content.includes('useWeddingContentCompatibility');
    const hasWeddingHeroWrapper = content.includes('useWeddingHeroCompatibility');
    const hasDataTransformers = content.includes('weddingTransformers');
    const hasCompatibilityMode = content.includes('compatibility_mode');
    
    logTest('Wedding Content Wrapper Exists', hasWeddingContentWrapper,
      hasWeddingContentWrapper ? 'Wedding content compatibility wrapper exists' : 'Wedding content wrapper missing');
    
    logTest('Wedding Hero Wrapper Exists', hasWeddingHeroWrapper,
      hasWeddingHeroWrapper ? 'Wedding hero compatibility wrapper exists' : 'Wedding hero wrapper missing');
    
    logTest('Data Transformers Available', hasDataTransformers,
      hasDataTransformers ? 'Data transformation utilities available' : 'Data transformers missing');
    
    logTest('Compatibility Mode Supported', hasCompatibilityMode,
      hasCompatibilityMode ? 'Compatibility mode flag supported' : 'Compatibility mode missing');
  } else {
    logTest('Backward Compatibility Wrapper', false, 'weddingWrapper.ts does not exist');
  }
});

// ========================================
// TEST 7: Validate Generic Hook Functionality
// ========================================
runTest('Validating generic hook functionality with new tables', () => {
  const useEventContentPath = path.join(process.cwd(), 'src/hooks/useEventContent.ts');
  
  if (fs.existsSync(useEventContentPath)) {
    const content = fs.readFileSync(useEventContentPath, 'utf8');
    
    // Check for generic query functions
    const hasGenericQueries = content.includes('fetchEventParticipants') || content.includes('getEventParticipants');
    const hasEventTypeFiltering = content.includes('event_type') && content.includes('WHERE');
    const hasMultiEventSupport = content.includes('wedding') && content.includes('conference');
    const hasTenantSupport = content.includes('tenant_id') || content.includes('tenantId');
    
    logTest('Generic Query Functions', hasGenericQueries,
      hasGenericQueries ? 'Generic query functions implemented' : 'Generic query functions missing');
    
    logTest('Event Type Filtering', hasEventTypeFiltering,
      hasEventTypeFiltering ? 'Event type filtering implemented' : 'Event type filtering missing');
    
    logTest('Multi-Event Support', hasMultiEventSupport,
      hasMultiEventSupport ? 'Multi-event type support implemented' : 'Multi-event support missing');
    
    logTest('Tenant Support', hasTenantSupport,
      hasTenantSupport ? 'Tenant-based filtering supported' : 'Tenant support missing');
  } else {
    logTest('Generic Hook Functionality', false, 'useEventContent.ts does not exist');
  }
});

// ========================================
// TEST 8: Validate Migration Rollback Strategy
// ========================================
runTest('Validating migration rollback strategy', () => {
  const migrationsPath = path.join(process.cwd(), 'database/migrations');
  
  // Check for rollback scripts
  const rollbackScript = fs.existsSync(path.join(migrationsPath, '202501_rollback_generic_transformation.sql'));
  const rollbackDocumentation = fs.existsSync(path.join(process.cwd(), 'docs/ROLLBACK_STRATEGY.md'));
  
  logTest('Rollback Script Exists', rollbackScript,
    rollbackScript ? 'Database rollback script exists' : 'Database rollback script missing');
  
  logTest('Rollback Documentation', rollbackDocumentation,
    rollbackDocumentation ? 'Rollback strategy documented' : 'Rollback documentation missing');
  
  if (rollbackDocumentation) {
    const content = fs.readFileSync(path.join(process.cwd(), 'docs/ROLLBACK_STRATEGY.md'), 'utf8');
    
    const hasSteps = content.includes('Step') || content.includes('step');
    const hasDataBackup = content.includes('backup') || content.includes('backup');
    const hasValidation = content.includes('validation') || content.includes('validate');
    
    logTest('Rollback Steps Documented', hasSteps,
      hasSteps ? 'Rollback steps are documented' : 'Rollback steps missing');
    
    logTest('Data Backup Strategy', hasDataBackup,
      hasDataBackup ? 'Data backup strategy documented' : 'Data backup strategy missing');
    
    logTest('Rollback Validation', hasValidation,
      hasValidation ? 'Rollback validation process documented' : 'Rollback validation missing');
  }
});

// ========================================
// RESULTS SUMMARY
// ========================================
console.log(`${colors.blue}[${new Date().toISOString()}] =================================================================================${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] 📊 PHASE 2.2 DATABASE TRANSFORMATION TEST RESULTS${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] Total Tests: ${totalTests}${colors.reset}`);
console.log(`${colors.green}[${new Date().toISOString()}] Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}[${new Date().toISOString()}] Failed: ${failedTests}${colors.reset}`);

if (failedTests === 0) {
  console.log(`${colors.green}[${new Date().toISOString()}] 🎉 All database transformation tests passed!${colors.reset}`);
} else {
  console.log(`${colors.yellow}[${new Date().toISOString()}] ⚠️  Database transformation needs work!${colors.reset}`);
}

const successRate = ((passedTests / totalTests) * 100).toFixed(2);
console.log(`${colors.blue}[${new Date().toISOString()}] Success Rate: ${successRate}%${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] =================================================================================${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] ✨ Phase 2.2 Database Transformation Tests Completed${colors.reset}`);