const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔗 Testing Database Connection...');
console.log('📍 Config:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', process.env.DB_PORT || '5432');
console.log('  Database:', process.env.DB_NAME || 'weddinvite_enterprise');
console.log('  User:', process.env.DB_USER || 'postgres');
console.log('  Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'weddinvite_enterprise',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin'
});

async function testDatabase() {
  try {
    console.log('\n⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('\n⏳ Testing basic query...');
    const result = await client.query('SELECT current_database(), version()');
    console.log('✅ Database:', result.rows[0].current_database);
    console.log('✅ Version:', result.rows[0].version.split(',')[0]);

    console.log('\n⏳ Checking tables...');
    const tables = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('✅ Tables found:', tables.rows.length);
    tables.rows.forEach(table => {
      console.log(`  📋 ${table.table_name} (${table.table_type})`);
    });

    // Check if our specific tables exist
    const ourTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenants', 'tenant_users')
    `);
    
    const expectedTables = ['tenants', 'tenant_users'];
    const existingTables = ourTables.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables.join(', '));
      console.log('📝 Need to run migrations');
    } else {
      console.log('✅ All required tables exist');
      
      // Test data operations
      console.log('\n⏳ Testing data operations...');
      
      // Count existing data
      const tenantsCount = await client.query('SELECT COUNT(*) as count FROM tenants');
      const usersCount = await client.query('SELECT COUNT(*) as count FROM tenant_users');
      
      console.log('📊 Current data:');
      console.log(`  👥 Tenants: ${tenantsCount.rows[0].count}`);
      console.log(`  👤 Users: ${usersCount.rows[0].count}`);

      // Test sample data query
      const sampleTenants = await client.query('SELECT id, name, type, status FROM tenants LIMIT 3');
      if (sampleTenants.rows.length > 0) {
        console.log('📋 Sample tenants:');
        sampleTenants.rows.forEach(tenant => {
          console.log(`  🏢 ${tenant.name} (${tenant.type}) - ${tenant.status}`);
        });
      }
    }

    console.log('\n🎉 Database test completed successfully!');

  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Suggestions:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check if the port 5432 is correct');
      console.error('3. Verify host configuration');
    } else if (error.code === '28P01') {
      console.error('\n💡 Suggestions:');
      console.error('1. Check username and password');
      console.error('2. Verify user has access to the database');
    } else if (error.code === '3D000') {
      console.error('\n💡 Suggestions:');
      console.error('1. Create the database first');
      console.error('2. Check database name spelling');
    }
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

testDatabase();