// ===============================================
// Database Connection Utility
// ===============================================
// Purpose: Centralized database connection management for all tests
// Category: Test Utilities
// Usage: const { getConnection, closeConnection } = require('./db-connection.util.cjs');
// Author: Kilo Code
// Created: 2025-08-12

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

class DatabaseConnectionManager {
    constructor() {
        this.pool = null;
        this.config = {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'emesys_dev',
            password: process.env.DB_PASSWORD || 'admin',
            port: process.env.DB_PORT || 5432,
        };
    }

    /**
     * Get database connection pool
     * @returns {Pool} PostgreSQL connection pool
     */
    getPool() {
        if (!this.pool) {
            this.pool = new Pool(this.config);
        }
        return this.pool;
    }

    /**
     * Get single database client from pool
     * @returns {Promise<Client>} Database client
     */
    async getConnection() {
        const pool = this.getPool();
        return await pool.connect();
    }

    /**
     * Close all database connections
     * @returns {Promise<void>}
     */
    async closeAllConnections() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }

    /**
     * Test database connection
     * @returns {Promise<boolean>} Connection success status
     */
    async testConnection() {
        try {
            const client = await this.getConnection();
            await client.query('SELECT 1');
            client.release();
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Get database configuration info
     * @returns {Object} Database config (without password)
     */
    getConnectionInfo() {
        return {
            user: this.config.user,
            host: this.config.host,
            database: this.config.database,
            port: this.config.port
        };
    }

    /**
     * Execute query with automatic connection management
     * @param {string} query SQL query
     * @param {Array} params Query parameters
     * @returns {Promise<Object>} Query result
     */
    async executeQuery(query, params = []) {
        const client = await this.getConnection();
        try {
            const result = await client.query(query, params);
            return result;
        } finally {
            client.release();
        }
    }

    /**
     * Execute transaction with automatic rollback on error
     * @param {Function} transactionCallback Function containing transaction logic
     * @returns {Promise<any>} Transaction result
     */
    async executeTransaction(transactionCallback) {
        const client = await this.getConnection();
        try {
            await client.query('BEGIN');
            const result = await transactionCallback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check if table exists
     * @param {string} tableName Table name to check
     * @returns {Promise<boolean>} Table existence status
     */
    async tableExists(tableName) {
        try {
            const result = await this.executeQuery(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [tableName]);
            return result.rows[0].exists;
        } catch (error) {
            console.error(`Error checking table ${tableName}:`, error.message);
            return false;
        }
    }

    /**
     * Get table row count
     * @param {string} tableName Table name
     * @returns {Promise<number>} Row count
     */
    async getTableRowCount(tableName) {
        try {
            const result = await this.executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error(`Error getting row count for ${tableName}:`, error.message);
            return 0;
        }
    }

    /**
     * Get table column information
     * @param {string} tableName Table name
     * @returns {Promise<Array>} Column information
     */
    async getTableColumns(tableName) {
        try {
            const result = await this.executeQuery(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            return result.rows;
        } catch (error) {
            console.error(`Error getting columns for ${tableName}:`, error.message);
            return [];
        }
    }

    /**
     * Get table indexes information
     * @param {string} tableName Table name
     * @returns {Promise<Array>} Index information
     */
    async getTableIndexes(tableName) {
        try {
            const result = await this.executeQuery(`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = $1
                ORDER BY indexname
            `, [tableName]);
            return result.rows;
        } catch (error) {
            console.error(`Error getting indexes for ${tableName}:`, error.message);
            return [];
        }
    }
}

// Export singleton instance
const dbManager = new DatabaseConnectionManager();

module.exports = {
    // Main functions
    getConnection: () => dbManager.getConnection(),
    getPool: () => dbManager.getPool(),
    closeAllConnections: () => dbManager.closeAllConnections(),
    testConnection: () => dbManager.testConnection(),
    
    // Utility functions
    executeQuery: (query, params) => dbManager.executeQuery(query, params),
    executeTransaction: (callback) => dbManager.executeTransaction(callback),
    
    // Schema inspection
    tableExists: (tableName) => dbManager.tableExists(tableName),
    getTableRowCount: (tableName) => dbManager.getTableRowCount(tableName),
    getTableColumns: (tableName) => dbManager.getTableColumns(tableName),
    getTableIndexes: (tableName) => dbManager.getTableIndexes(tableName),
    
    // Configuration
    getConnectionInfo: () => dbManager.getConnectionInfo(),
    
    // Direct access to manager instance
    dbManager
};