/**
 * Migration Utilities dan Helper Functions
 * Utility functions untuk mendukung enhanced migration system
 */

import { DatabaseConnection } from './connection';
import { EnhancedMigrationSystem } from './enhanced-migrate';

export class MigrationUtils {
    private db: DatabaseConnection;

    constructor(db: DatabaseConnection) {
        this.db = db;
    }

    /**
     * Backup database sebelum migration
     */
    async createBackup(backupName: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `backup_${backupName}_${timestamp}.sql`;
        
        // This would typically use pg_dump
        console.log(`📦 Creating backup: ${backupFile}`);
        
        // For now, just return the backup name
        // In production, this would execute pg_dump command
        return backupFile;
    }

    /**
     * Validate database schema integrity
     */
    async validateSchemaIntegrity(): Promise<{
        valid: boolean;
        issues: string[];
        tables: number;
        indexes: number;
        constraints: number;
    }> {
        const issues: string[] = [];
        
        try {
            // Check for essential tables
            const requiredTables = ['tenants', 'tenant_users', 'roles', 'permissions', 'user_roles', 'role_permissions'];
            const tableResult = await this.db.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            `);
            
            const existingTables = tableResult.rows.map(row => row.table_name);
            const missingTables = requiredTables.filter(table => !existingTables.includes(table));
            
            if (missingTables.length > 0) {
                issues.push(`Missing tables: ${missingTables.join(', ')}`);
            }

            // Check foreign key constraints
            const fkResult = await this.db.query(`
                SELECT COUNT(*) as fk_count
                FROM information_schema.table_constraints 
                WHERE constraint_type = 'FOREIGN KEY'
            `);

            // Check indexes
            const indexResult = await this.db.query(`
                SELECT COUNT(*) as index_count
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND indexname NOT LIKE '%_pkey'
            `);

            // Check RLS policies
            const rlsResult = await this.db.query(`
                SELECT COUNT(*) as policy_count
                FROM pg_policies
                WHERE schemaname = 'public'
            `);

            if (parseInt(rlsResult.rows[0].policy_count) === 0) {
                issues.push('No Row Level Security policies found');
            }

            return {
                valid: issues.length === 0,
                issues,
                tables: existingTables.length,
                indexes: parseInt(indexResult.rows[0].index_count),
                constraints: parseInt(fkResult.rows[0].fk_count)
            };

        } catch (error) {
            issues.push(`Schema validation error: ${error.message}`);
            return {
                valid: false,
                issues,
                tables: 0,
                indexes: 0,
                constraints: 0
            };
        }
    }

    /**
     * Generate migration dependency graph
     */
    async generateDependencyGraph(): Promise<{
        nodes: Array<{ id: string; version: string; name: string }>;
        edges: Array<{ from: string; to: string }>;
    }> {
        const migrationSystem = new EnhancedMigrationSystem(this.db);
        const migrations = migrationSystem.getAvailableMigrations();
        
        const nodes = migrations.map(m => ({
            id: m.filename,
            version: m.version,
            name: m.name
        }));

        const edges: Array<{ from: string; to: string }> = [];
        
        migrations.forEach(migration => {
            if (migration.dependencies) {
                migration.dependencies.forEach(dep => {
                    const depMigration = migrations.find(m => m.version === dep);
                    if (depMigration) {
                        edges.push({
                            from: depMigration.filename,
                            to: migration.filename
                        });
                    }
                });
            }
        });

        return { nodes, edges };
    }

    /**
     * Calculate migration statistics
     */
    async getMigrationStatistics(): Promise<{
        totalMigrations: number;
        executedMigrations: number;
        pendingMigrations: number;
        averageExecutionTime: number;
        totalExecutionTime: number;
        slowestMigration: { filename: string; time: number } | null;
        fastestMigration: { filename: string; time: number } | null;
        migrationsByMonth: Array<{ month: string; count: number }>;
    }> {
        const migrationSystem = new EnhancedMigrationSystem(this.db);
        const executed = await migrationSystem.getExecutedMigrations();
        const available = migrationSystem.getAvailableMigrations();
        
        const executionTimes = executed
            .filter(m => m.execution_time_ms > 0)
            .map(m => m.execution_time_ms);
        
        const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
        const avgTime = executionTimes.length > 0 ? totalTime / executionTimes.length : 0;
        
        const slowest = executed.length > 0 
            ? executed.reduce((prev, current) => 
                prev.execution_time_ms > current.execution_time_ms ? prev : current)
            : null;
            
        const fastest = executed.length > 0
            ? executed.reduce((prev, current) => 
                prev.execution_time_ms < current.execution_time_ms ? prev : current)
            : null;

        // Group by month
        const migrationsByMonth = executed.reduce((acc, migration) => {
            const month = migration.executed_at.toISOString().substring(0, 7); // YYYY-MM
            const existing = acc.find(item => item.month === month);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ month, count: 1 });
            }
            return acc;
        }, [] as Array<{ month: string; count: number }>);

        return {
            totalMigrations: available.length,
            executedMigrations: executed.length,
            pendingMigrations: available.length - executed.length,
            averageExecutionTime: Math.round(avgTime),
            totalExecutionTime: totalTime,
            slowestMigration: slowest ? { 
                filename: slowest.filename, 
                time: slowest.execution_time_ms 
            } : null,
            fastestMigration: fastest ? { 
                filename: fastest.filename, 
                time: fastest.execution_time_ms 
            } : null,
            migrationsByMonth
        };
    }

    /**
     * Check for potential migration conflicts
     */
    async checkMigrationConflicts(): Promise<{
        conflicts: Array<{
            type: 'checksum_mismatch' | 'missing_dependency' | 'circular_dependency';
            migration: string;
            description: string;
            severity: 'low' | 'medium' | 'high';
        }>;
        hasConflicts: boolean;
    }> {
        const conflicts: any[] = [];
        const migrationSystem = new EnhancedMigrationSystem(this.db);
        
        try {
            const available = migrationSystem.getAvailableMigrations();
            const executed = await migrationSystem.getExecutedMigrations();
            
            // Check checksum mismatches
            for (const migration of available) {
                const executedMigration = executed.find(e => e.filename === migration.filename);
                if (executedMigration && executedMigration.checksum !== migration.checksum) {
                    conflicts.push({
                        type: 'checksum_mismatch',
                        migration: migration.filename,
                        description: `Migration file has been modified after execution`,
                        severity: 'high'
                    });
                }
            }
            
            // Check missing dependencies
            for (const migration of available) {
                if (migration.dependencies) {
                    for (const dep of migration.dependencies) {
                        const depExists = available.some(m => m.version === dep);
                        if (!depExists) {
                            conflicts.push({
                                type: 'missing_dependency',
                                migration: migration.filename,
                                description: `Depends on missing migration version: ${dep}`,
                                severity: 'high'
                            });
                        }
                    }
                }
            }
            
            return {
                conflicts,
                hasConflicts: conflicts.length > 0
            };
            
        } catch (error) {
            conflicts.push({
                type: 'checksum_mismatch',
                migration: 'unknown',
                description: `Error checking conflicts: ${error.message}`,
                severity: 'medium'
            });
            
            return {
                conflicts,
                hasConflicts: true
            };
        }
    }

    /**
     * Repair migration inconsistencies
     */
    async repairMigrationInconsistencies(): Promise<{
        repaired: number;
        issues: string[];
        success: boolean;
    }> {
        const issues: string[] = [];
        let repaired = 0;
        
        try {
            // Check for duplicate migration records
            const duplicateResult = await this.db.query(`
                SELECT filename, COUNT(*) as count
                FROM migrations 
                GROUP BY filename 
                HAVING COUNT(*) > 1
            `);
            
            for (const duplicate of duplicateResult.rows) {
                // Keep only the oldest record
                await this.db.query(`
                    DELETE FROM migrations 
                    WHERE filename = $1 
                    AND id NOT IN (
                        SELECT MIN(id) 
                        FROM migrations 
                        WHERE filename = $1
                    )
                `, [duplicate.filename]);
                
                repaired++;
                issues.push(`Removed duplicate records for ${duplicate.filename}`);
            }
            
            return {
                repaired,
                issues,
                success: true
            };
            
        } catch (error) {
            issues.push(`Repair failed: ${error.message}`);
            return {
                repaired,
                issues,
                success: false
            };
        }
    }
}

// Export utility functions
export async function validateMigrationEnvironment(db: DatabaseConnection): Promise<boolean> {
    const utils = new MigrationUtils(db);
    const validation = await utils.validateSchemaIntegrity();
    
    if (!validation.valid) {
        console.error('❌ Migration environment validation failed:');
        validation.issues.forEach(issue => console.error(`   • ${issue}`));
        return false;
    }
    
    console.log('✅ Migration environment validation passed');
    return true;
}

export async function generateMigrationReport(db: DatabaseConnection): Promise<void> {
    const utils = new MigrationUtils(db);
    
    console.log('📊 COMPREHENSIVE MIGRATION REPORT');
    console.log('='.repeat(50));
    
    // Statistics
    const stats = await utils.getMigrationStatistics();
    console.log('\n📈 STATISTICS:');
    console.log(`   Total migrations: ${stats.totalMigrations}`);
    console.log(`   Executed: ${stats.executedMigrations}`);
    console.log(`   Pending: ${stats.pendingMigrations}`);
    console.log(`   Average execution time: ${stats.averageExecutionTime}ms`);
    console.log(`   Total execution time: ${stats.totalExecutionTime}ms`);
    
    if (stats.slowestMigration) {
        console.log(`   Slowest migration: ${stats.slowestMigration.filename} (${stats.slowestMigration.time}ms)`);
    }
    
    // Schema validation
    const validation = await utils.validateSchemaIntegrity();
    console.log('\n🔍 SCHEMA VALIDATION:');
    console.log(`   Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Tables: ${validation.tables}`);
    console.log(`   Indexes: ${validation.indexes}`);
    console.log(`   Constraints: ${validation.constraints}`);
    
    if (validation.issues.length > 0) {
        console.log('   Issues:');
        validation.issues.forEach(issue => console.log(`     • ${issue}`));
    }
    
    // Conflicts
    const conflicts = await utils.checkMigrationConflicts();
    console.log('\n⚠️ CONFLICTS:');
    console.log(`   Status: ${conflicts.hasConflicts ? '❌ Conflicts found' : '✅ No conflicts'}`);
    
    if (conflicts.hasConflicts) {
        conflicts.conflicts.forEach(conflict => {
            console.log(`   • [${conflict.severity.toUpperCase()}] ${conflict.migration}: ${conflict.description}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
}