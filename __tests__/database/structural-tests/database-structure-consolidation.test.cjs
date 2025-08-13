/**
 * STRUCTURAL TEST: Database Structure Consolidation
 *
 * Purpose: Test-First Development untuk database structure cleanup
 * Target: Consolidate database/ vs src/database/ duplication
 * Scope: Folder structure, migration consolidation, developer guidelines
 *
 * Test Categories:
 * - Database folder structure validation
 * - Migration consolidation verification
 * - Developer guidelines existence
 * - Import path consistency
 *
 * Requirements:
 * - Clean folder structure without duplication
 * - Clear developer guidelines
 * - Consolidated migration system
 *
 * Usage: node __tests__/database/structural-tests/database-structure-consolidation.test.cjs
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

/**
 * Color codes for enhanced console output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Enhanced logging dengan color support
 */
function log(type, message, data = null) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    success: colors.green,
    error: colors.red,
    info: colors.blue,
    warning: colors.yellow,
    test: colors.cyan
  };
  
  const color = colorMap[type] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  
  if (data) {
    console.log(`${colors.magenta}Data:${colors.reset}`, data);
  }
}

/**
 * Test result tracking
 */
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test assertion helper
 */
function assert(condition, testName, successMessage = null, errorMessage = null) {
  testResults.total++;
  
  if (condition) {
    testResults.passed++;
    log('success', `✅ ${testName}: ${successMessage || 'PASSED'}`);
    return true;
  } else {
    testResults.failed++;
    const error = `❌ ${testName}: ${errorMessage || 'FAILED'}`;
    testResults.errors.push(error);
    log('error', error);
    return false;
  }
}

/**
 * Main testing function untuk database structure consolidation
 */
async function testDatabaseStructureConsolidation() {
  try {
    log('info', '🚀 Starting Database Structure Consolidation Tests (TFD)');
    log('info', '=' .repeat(80));
    
    // TEST 1: Database Folder Structure Validation
    log('test', 'TEST 1: Validating clean database folder structure');
    
    // EXPECTED: Consolidated structure should exist
    const expectedStructure = {
      'database/': ['schema.sql', 'migrations/', 'seeders/', 'README.md'],
      'src/database/': ['connection.ts', 'models/', 'repositories/', 'index.ts']
    };

    // Validate main database folder exists
    assert(
      fs.existsSync('database'),
      'Main Database Folder',
      'database/ folder exists',
      'database/ folder missing'
    );

    // Validate database subfolders
    assert(
      fs.existsSync('database/migrations'),
      'Database Migrations Folder',
      'database/migrations/ exists',
      'database/migrations/ missing'
    );

    assert(
      fs.existsSync('database/seeders') || !fs.existsSync('database'),
      'Database Seeders Folder',
      'database/seeders/ structure ready',
      'database/seeders/ needs creation'
    );

    // Validate src/database folder
    assert(
      fs.existsSync('src/database'),
      'Source Database Folder',
      'src/database/ folder exists',
      'src/database/ folder missing'
    );

    // TEST 2: NO Duplicate Migration Folders
    log('test', 'TEST 2: Validating NO duplicate migration folders');
    
    const srcDatabaseMigrations = 'src/database/migrations';
    const mainDatabaseMigrations = 'database/migrations';
    
    // Main migrations should exist
    assert(
      fs.existsSync(mainDatabaseMigrations),
      'Main Migration Location',
      'database/migrations/ is the single source of truth',
      'database/migrations/ missing'
    );
    
    // Check for duplicate confusion
    if (fs.existsSync(srcDatabaseMigrations)) {
      const files = fs.readdirSync(srcDatabaseMigrations).filter(f => f.endsWith('.sql') || f.endsWith('.cjs'));
      assert(
        files.length === 0,
        'No Migration Duplication',
        'src/database/migrations/ is empty (consolidated to database/migrations/)',
        `src/database/migrations/ contains ${files.length} files - should be moved to database/migrations/`
      );
    } else {
      log('success', '✅ No Migration Duplication: src/database/migrations/ does not exist - clean structure!');
      testResults.total++;
      testResults.passed++;
    }

    // TEST 3: Migration Consolidation Validation
    log('test', 'TEST 3: Validating migration consolidation');
    
    const migrationsDir = 'database/migrations';
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql') || file.endsWith('.cjs'));
      
      assert(
        migrationFiles.length > 0,
        'Migration Files Exist',
        `${migrationFiles.length} migration files found in database/migrations/`,
        'No migration files found in database/migrations/'
      );

      // Check for specific expected migrations
      const expectedMigrations = [
        '001_create_tenants_table.sql',
        '002_create_tenant_users_table.sql',
        'create-compatibility-views.cjs',
        'fix-performance-indexes.cjs'
      ];

      expectedMigrations.forEach(migration => {
        const migrationExists = fs.existsSync(path.join(migrationsDir, migration));
        assert(
          migrationExists,
          `Migration: ${migration}`,
          `${migration} exists in consolidated location`,
          `${migration} missing from database/migrations/`
        );
      });
    }

    // TEST 4: Migration Runner Path Validation
    log('test', 'TEST 4: Validating migration runner points to correct location');
    
    const migrationRunnerPath = 'src/database/migrate.ts';
    if (fs.existsSync(migrationRunnerPath)) {
      const content = fs.readFileSync(migrationRunnerPath, 'utf8');
      
      assert(
        content.includes('database/migrations') && !content.includes('src/database/migrations'),
        'Migration Runner Path',
        'Migration runner points to database/migrations/',
        'Migration runner has incorrect paths'
      );
    }

    // TEST 5: Developer Guidelines
    log('test', 'TEST 5: Validating developer guidelines existence');
    
    const databaseReadme = 'database/README.md';
    const srcDatabaseReadme = 'src/database/README.md';
    
    assert(
      fs.existsSync(databaseReadme) || !fs.existsSync('database'),
      'Database README',
      'database/README.md exists with guidelines',
      'database/README.md missing - developers will be confused'
    );

    assert(
      fs.existsSync(srcDatabaseReadme) || !fs.existsSync('src/database'),
      'Source Database README',
      'src/database/README.md exists with guidelines',
      'src/database/README.md missing - developers will be confused'
    );

    // TEST 6: Connection File Location
    log('test', 'TEST 6: Validating database connection file location');
    
    const connectionPath = 'src/database/connection.ts';
    assert(
      fs.existsSync(connectionPath),
      'Database Connection File',
      'src/database/connection.ts exists in correct location',
      'src/database/connection.ts missing'
    );

    // TEST 7: Test Infrastructure Compatibility
    log('test', 'TEST 7: Validating test infrastructure compatibility');
    
    const testUtilPath = '__tests__/utilities/db-connection.util.cjs';
    assert(
      fs.existsSync(testUtilPath),
      'Test Database Utilities',
      'Test database utilities maintained',
      'Test database utilities missing'
    );

    // Generate test summary
    log('info', '=' .repeat(80));
    log('info', '📊 DATABASE STRUCTURE CONSOLIDATION TEST RESULTS');
    log('info', `Total Tests: ${testResults.total}`);
    log('success', `Passed: ${testResults.passed}`);
    log('error', `Failed: ${testResults.failed}`);
    
    if (testResults.failed > 0) {
      log('error', '❌ Failed Tests:');
      testResults.errors.forEach(error => log('error', `  - ${error}`));
      log('warning', '⚠️ IMPLEMENTATION NEEDED: Some structure consolidation required');
    } else {
      log('success', '🎉 Database structure is properly consolidated!');
    }
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    log('info', `Success Rate: ${successRate}%`);

  } catch (error) {
    log('error', '💥 Critical test failure occurred');
    log('error', `Error: ${error.message}`);
    console.error(error.stack);
    testResults.failed++;
  } finally {
    log('info', '=' .repeat(80));
    log('info', '✨ Database Structure Consolidation Tests Completed');
  }
}

// Execute test if run directly
if (require.main === module) {
  testDatabaseStructureConsolidation().then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testDatabaseStructureConsolidation, testResults };