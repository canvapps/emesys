/**
 * Database Connection Utilities for Testing
 * ========================================
 * 
 * Purpose: Unified database connection utilities untuk integration tests
 * Features: Query execution, transaction management, connection pooling
 * Target: Resolve import errors di integration test files
 * 
 * Functions:
 * - executeQuery: Execute single database query dengan error handling
 * - executeTransaction: Execute transaction dengan rollback support
 * - testConnection: Test database connectivity
 * - closeAllConnections: Cleanup semua connections
 * 
 * Usage: const { executeQuery, executeTransaction } = require('../utilities/db-connection.util.cjs');
 */

const { SmartDatabaseConnection } = require('../../../src/database/core/smart-connection.ts');

// Global connection instances untuk testing
let globalConnection = null;
let activeConnections = [];

/**
 * Get atau create database connection
 */
async function getConnection() {
    if (!globalConnection) {
        globalConnection = new SmartDatabaseConnection({
            fallbackToMock: true,
            connectionTimeout: 5000,
            preferMock: false // Prefer real database for integration tests
        });
        
        const connected = await globalConnection.connect();
        if (!connected) {
            throw new Error('Failed to establish database connection');
        }
        
        activeConnections.push(globalConnection);
    }
    
    return globalConnection;
}

/**
 * Execute single database query dengan error handling
 */
async function executeQuery(query, params = []) {
    try {
        const connection = await getConnection();
        const result = await connection.query(query, params);
        return result;
    } catch (error) {
        console.error('❌ Database query execution failed:', error.message);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw error;
    }
}

/**
 * Execute database transaction dengan rollback support
 */
async function executeTransaction(transactionFunction) {
    const connection = await getConnection();
    const client = connection.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Execute transaction function dengan client
        const result = await transactionFunction(client);
        
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('❌ Transaction rollback failed:', rollbackError.message);
        }
        
        console.error('❌ Transaction execution failed:', error.message);
        throw error;
    }
}

/**
 * Test database connectivity
 */
async function testConnection() {
    try {
        const connection = await getConnection();
        const result = await connection.query('SELECT 1 as test');
        
        if (result && result.rows && result.rows.length > 0) {
            const info = connection.getConnectionInfo();
            console.log(`✅ Database connection test successful (${info.type} mode)`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

/**
 * Close semua active connections
 */
async function closeAllConnections() {
    try {
        const closePromises = activeConnections.map(async (conn) => {
            try {
                await conn.close();
            } catch (error) {
                console.warn('⚠️ Warning closing connection:', error.message);
            }
        });
        
        await Promise.all(closePromises);
        activeConnections = [];
        globalConnection = null;
        
        console.log('🔌 All database connections closed');
        return true;
    } catch (error) {
        console.error('❌ Error closing connections:', error.message);
        return false;
    }
}

/**
 * Get connection info untuk debugging
 */
async function getConnectionInfo() {
    try {
        const connection = await getConnection();
        return connection.getConnectionInfo();
    } catch (error) {
        return { type: 'error', connected: false, error: error.message };
    }
}

/**
 * Helper function untuk bulk operations
 */
async function executeBulkInsert(tableName, columns, dataRows) {
    if (!dataRows || dataRows.length === 0) {
        throw new Error('No data provided for bulk insert');
    }
    
    const placeholderRows = dataRows.map((_, rowIndex) => {
        const placeholders = columns.map((_, colIndex) => {
            return `$${rowIndex * columns.length + colIndex + 1}`;
        });
        return `(${placeholders.join(', ')})`;
    });
    
    const query = `
        INSERT INTO ${tableName} (${columns.join(', ')}) 
        VALUES ${placeholderRows.join(', ')}
        RETURNING *
    `;
    
    const flatValues = dataRows.flat();
    
    try {
        return await executeQuery(query, flatValues);
    } catch (error) {
        console.error('❌ Bulk insert failed:', error.message);
        throw error;
    }
}

/**
 * Create temporary test tenant untuk integration tests
 */
async function createTestTenant(domainName = 'integration-test.local') {
    try {
        const result = await executeQuery(`
            INSERT INTO tenants (name, domain, settings, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (domain) DO UPDATE SET
                updated_at = NOW()
            RETURNING id
        `, [
            `Integration Test Tenant - ${domainName}`,
            domainName,
            JSON.stringify({ 
                test: true, 
                integration: true, 
                created: new Date().toISOString() 
            })
        ]);
        
        if (result.rows && result.rows.length > 0) {
            console.log(`✅ Test tenant created: ${domainName} (ID: ${result.rows[0].id})`);
            return result.rows[0].id;
        }
        
        throw new Error('Failed to create test tenant');
    } catch (error) {
        console.error('❌ Test tenant creation failed:', error.message);
        throw error;
    }
}

/**
 * Cleanup test tenant setelah integration tests
 */
async function cleanupTestTenant(tenantId) {
    try {
        // Delete tenant dan related data dalam transaction
        await executeTransaction(async (client) => {
            // Delete tenant users first (foreign key constraint)
            await client.query('DELETE FROM tenant_users WHERE tenant_id = $1', [tenantId]);
            
            // Delete tenant
            await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
            
            console.log(`🧹 Test tenant cleaned up: ${tenantId}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Test tenant cleanup failed:', error.message);
        return false;
    }
}

module.exports = {
    executeQuery,
    executeTransaction,
    testConnection,
    closeAllConnections,
    getConnectionInfo,
    executeBulkInsert,
    createTestTenant,
    cleanupTestTenant,
    getConnection
};