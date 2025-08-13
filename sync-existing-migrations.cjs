#!/usr/bin/env node

/**
 * Sync Existing Migrations to Enhanced Migration System
 * Populate enhanced migration table dengan existing migrations
 */

const { Client } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');
const { createHash } = require('crypto');
const dotenv = require('dotenv');

// Load environment
dotenv.config({ path: '.env.local' });

console.log('🔄 Syncing existing migrations to enhanced migration system...\n');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'weddinvite_enterprise',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin'
});

async function syncExistingMigrations() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Define existing migrations yang sudah dijalankan
        const existingMigrations = [
            {
                filename: '001_create_tenants_table.sql',
                version: '001',
                name: 'create tenants table'
            },
            {
                filename: '002_create_tenant_users_table.sql', 
                version: '002',
                name: 'create tenant users table'
            },
            {
                filename: '003_create_roles_permissions_tables.sql',
                version: '003', 
                name: 'create roles permissions tables'
            },
            {
                filename: '004_create_rls_policies.sql',
                version: '004',
                name: 'create rls policies'
            }
        ];

        const migrationsDir = join(__dirname, 'src', 'database', 'migrations');

        for (const migration of existingMigrations) {
            console.log(`⏳ Processing ${migration.filename}...`);
            
            // Read file and calculate checksum
            const filePath = join(migrationsDir, migration.filename);
            const content = readFileSync(filePath, 'utf8');
            const checksum = createHash('sha256').update(content).digest('hex');
            
            // Extract rollback SQL if exists
            let rollback_sql = null;
            const rollbackMatch = content.match(/-- ROLLBACK:(.*?)(?=-- |\Z)/s);
            if (rollbackMatch) {
                rollback_sql = rollbackMatch[1].trim();
            }

            // Check if already exists
            const existingCheck = await client.query(
                'SELECT filename FROM migrations WHERE filename = $1',
                [migration.filename]
            );

            if (existingCheck.rows.length > 0) {
                console.log(`⏩ ${migration.filename} already synced`);
                continue;
            }

            // Insert into enhanced migrations table
            await client.query(`
                INSERT INTO migrations (
                    filename, version, name, checksum, 
                    execution_time_ms, rollback_sql, created_by, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                migration.filename,
                migration.version, 
                migration.name,
                checksum,
                0, // execution_time_ms (unknown for existing)
                rollback_sql,
                'sync_script',
                'Synced from existing database state'
            ]);

            console.log(`✅ Synced ${migration.filename} (${checksum.substring(0, 16)}...)`);
        }

        console.log('\n🎉 All existing migrations synced successfully!');

        // Verify sync
        const syncResult = await client.query(`
            SELECT filename, version, name, executed_at 
            FROM migrations 
            ORDER BY version
        `);

        console.log('\n📋 Synced migrations:');
        syncResult.rows.forEach(row => {
            console.log(`  ✅ ${row.version}: ${row.filename} (${row.executed_at.toISOString().split('T')[0]})`);
        });

    } catch (error) {
        console.error(`❌ Sync failed: ${error.message}`);
        throw error;
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run sync
syncExistingMigrations();