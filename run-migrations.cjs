const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🚀 Starting Database Migration...');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'weddinvite_enterprise',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin'
});

async function runMigrations() {
  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Create migrations table if not exists
    console.log('⏳ Creating migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `);
    console.log('✅ Migrations table ready');

    // Get migration files
    const migrationsDir = path.join(__dirname, 'src', 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files`);

    // Get already executed migrations
    const executedResult = await client.query('SELECT filename FROM migrations');
    const executedMigrations = executedResult.rows.map(row => row.filename);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        console.log(`⏩ Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`⏳ Running migration: ${file}`);
      
      try {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Execute migration
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`✅ Migration completed: ${file}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed: ${file}`);
        console.error('Error:', error.message);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');

    // Verify tables
    console.log('\n⏳ Verifying created tables...');
    const tablesResult = await client.query(`
      SELECT table_name, 
             (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 Database tables:');
    tablesResult.rows.forEach(table => {
      console.log(`  📋 ${table.table_name} (${table.column_count} columns)`);
    });

    // Check indexes
    console.log('\n⏳ Checking indexes...');
    const indexesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);

    console.log('📊 Database indexes:');
    indexesResult.rows.forEach(index => {
      console.log(`  🔍 ${index.tablename}.${index.indexname}`);
    });

    // Check foreign keys
    console.log('\n⏳ Checking foreign key constraints...');
    const fkResult = await client.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);

    console.log('🔗 Foreign key constraints:');
    fkResult.rows.forEach(fk => {
      console.log(`  🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigrations();