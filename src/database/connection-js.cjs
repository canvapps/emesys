/**
 * JavaScript Database Connection Module
 * ====================================
 * 
 * Purpose: Legacy JavaScript database connection untuk backward compatibility
 * Features: PostgreSQL connection dengan CommonJS support
 * Target: Resolve import errors di performance tests dan legacy files
 * 
 * Functions:
 * - connectToDatabase: Create PostgreSQL connection
 * - createConnection: Create direct connection
 * - closeConnection: Close database connection
 * - executeQuery: Execute query dengan connection management
 * 
 * Usage: const { connectToDatabase } = require('./src/database/connection-js.cjs');
 */

const { Pool, Client } = require('pg');
const path = require('path');

// Database configuration dengan environment variables
const DB_CONFIG = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'weddinvite',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    
    // SSL configuration
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Global connection pool
let globalPool = null;

/**
 * Create atau reuse connection pool
 */
function getPool() {
    if (!globalPool) {
        globalPool = new Pool(DB_CONFIG);
        
        globalPool.on('error', (err) => {
            console.error('❌ PostgreSQL pool error:', err);
        });
        
        globalPool.on('connect', (client) => {
            console.log('🔗 PostgreSQL client connected to pool');
        });
    }
    
    return globalPool;
}

/**
 * Connect to PostgreSQL database dengan pool support
 */
async function connectToDatabase() {
    try {
        console.log('🔍 Connecting to PostgreSQL database...');
        
        const pool = getPool();
        const client = await pool.connect();
        
        // Test connection
        const result = await client.query('SELECT NOW() as connected_at');
        console.log(`✅ PostgreSQL connection successful at ${result.rows[0].connected_at}`);
        
        return client;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        
        // Fallback untuk development - create mock client
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔧 Falling back to mock database connection...');
            return createMockClient();
        }
        
        throw error;
    }
}

/**
 * Create direct database connection (non-pool)
 */
async function createConnection() {
    try {
        const client = new Client(DB_CONFIG);
        await client.connect();
        
        console.log('🔗 Direct PostgreSQL connection established');
        return client;
    } catch (error) {
        console.error('❌ Direct PostgreSQL connection failed:', error.message);
        
        if (process.env.NODE_ENV !== 'production') {
            return createMockClient();
        }
        
        throw error;
    }
}

/**
 * Close database connection
 */
async function closeConnection(client) {
    try {
        if (client && typeof client.release === 'function') {
            // Pool connection
            client.release();
            console.log('🔌 Pool connection released');
        } else if (client && typeof client.end === 'function') {
            // Direct connection
            await client.end();
            console.log('🔌 Direct connection closed');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error closing connection:', error.message);
        return false;
    }
}

/**
 * Close global pool
 */
async function closePool() {
    try {
        if (globalPool) {
            await globalPool.end();
            globalPool = null;
            console.log('🔌 Connection pool closed');
        }
        return true;
    } catch (error) {
        console.error('❌ Error closing pool:', error.message);
        return false;
    }
}

/**
 * Execute query dengan automatic connection management
 */
async function executeQuery(query, params = []) {
    let client = null;
    
    try {
        client = await connectToDatabase();
        const result = await client.query(query, params);
        return result;
    } catch (error) {
        console.error('❌ Query execution failed:', error.message);
        console.error('   Query:', query);
        throw error;
    } finally {
        if (client) {
            await closeConnection(client);
        }
    }
}

/**
 * Execute transaction dengan rollback support
 */
async function executeTransaction(queries) {
    let client = null;
    
    try {
        client = await connectToDatabase();
        
        await client.query('BEGIN');
        
        const results = [];
        for (const { query, params = [] } of queries) {
            const result = await client.query(query, params);
            results.push(result);
        }
        
        await client.query('COMMIT');
        console.log('✅ Transaction completed successfully');
        
        return results;
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
                console.log('🔄 Transaction rolled back');
            } catch (rollbackError) {
                console.error('❌ Rollback failed:', rollbackError.message);
            }
        }
        
        console.error('❌ Transaction failed:', error.message);
        throw error;
    } finally {
        if (client) {
            await closeConnection(client);
        }
    }
}

/**
 * Mock client untuk development/testing
 */
function createMockClient() {
    console.log('🎭 Creating mock database client...');
    
    const mockClient = {
        query: async (query, params = []) => {
            console.log(`🎭 Mock Query: ${query.substring(0, 50)}...`);
            
            // Mock responses berdasarkan query pattern
            if (query.includes('NOW()')) {
                return { rows: [{ connected_at: new Date(), now: new Date() }] };
            }
            
            if (query.includes('SELECT COUNT(*)') || query.includes('count')) {
                return { rows: [{ count: Math.floor(Math.random() * 10) + 1 }] };
            }
            
            if (query.includes('SELECT') && query.includes('tenants')) {
                return {
                    rows: [{
                        id: 'mock-tenant-id',
                        name: 'Mock Tenant',
                        domain: 'mock.local',
                        created_at: new Date()
                    }]
                };
            }
            
            if (query.includes('SELECT') && query.includes('users')) {
                return {
                    rows: [{
                        id: 'mock-user-id',
                        email: 'mock@test.com',
                        first_name: 'Mock',
                        last_name: 'User'
                    }]
                };
            }
            
            if (query.includes('INSERT') || query.includes('UPDATE')) {
                return {
                    rows: [{ id: `mock-id-${Date.now()}` }],
                    rowCount: 1
                };
            }
            
            // Default mock response
            return { rows: [], rowCount: 0 };
        },
        
        release: () => {
            console.log('🎭 Mock connection released');
        },
        
        end: async () => {
            console.log('🎭 Mock connection ended');
        }
    };
    
    return mockClient;
}

/**
 * Test database connectivity
 */
async function testDatabaseConnection() {
    try {
        const client = await connectToDatabase();
        const result = await client.query('SELECT version()');
        
        console.log('✅ Database connection test successful');
        console.log('📊 PostgreSQL Version:', result.rows[0].version.split(',')[0]);
        
        await closeConnection(client);
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

/**
 * Get database connection info
 */
function getConnectionConfig() {
    return {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        database: DB_CONFIG.database,
        user: DB_CONFIG.user,
        ssl: DB_CONFIG.ssl ? 'enabled' : 'disabled',
        pool: {
            max: DB_CONFIG.max,
            timeout: DB_CONFIG.connectionTimeoutMillis
        }
    };
}

// Export semua functions untuk backward compatibility
module.exports = {
    connectToDatabase,
    createConnection,
    closeConnection,
    closePool,
    executeQuery,
    executeTransaction,
    testDatabaseConnection,
    getConnectionConfig,
    getPool,
    
    // Aliases untuk compatibility
    connect: connectToDatabase,
    query: executeQuery,
    transaction: executeTransaction,
    test: testDatabaseConnection
};