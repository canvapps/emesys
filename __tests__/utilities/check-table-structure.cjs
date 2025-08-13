// Quick script to check table structure
const { executeQuery, closeAllConnections } = require('./db-connection.util.cjs');

async function checkTableStructure() {
    try {
        console.log('🔍 Checking event_types table structure...');
        
        const columns = await executeQuery(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'event_types'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📊 event_types columns:');
        columns.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        console.log('\n🔍 Checking sample data...');
        const sample = await executeQuery('SELECT * FROM event_types LIMIT 3');
        
        console.log('\n📋 Sample data:');
        console.log(sample.rows);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await closeAllConnections();
    }
}

checkTableStructure();