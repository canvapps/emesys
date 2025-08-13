/**
 * Row Level Security Context Management
 * Manages user and tenant context for PostgreSQL RLS policies
 */

import { DatabaseConnection } from './connection';

export interface RLSContext {
    userId: string | null;
    tenantId: string | null;
    isActive: boolean;
}

export interface SecurityValidationResult {
    isValid: boolean;
    canAccess: boolean;
    isSuperAdmin: boolean;
    hasSystemPermissions: boolean;
    message?: string;
}

export interface TenantSwitchResult {
    success: boolean;
    previousTenant: string | null;
    newTenant: string | null;
    message?: string;
}

export class RLSContextManager {
    private db: DatabaseConnection;
    private currentContext: RLSContext = {
        userId: null,
        tenantId: null,
        isActive: false
    };

    constructor(db: DatabaseConnection) {
        this.db = db;
    }

    /**
     * Set user context untuk RLS policies
     */
    async setUserContext(userId: string, tenantId?: string): Promise<boolean> {
        try {
            // Call database function untuk set context
            const result = await this.db.query(
                'SELECT set_current_user_context($1, $2)',
                [userId, tenantId || null]
            );

            // Update local context
            this.currentContext = {
                userId,
                tenantId: tenantId || null,
                isActive: true
            };

            console.log(`✅ RLS Context set - User: ${userId}, Tenant: ${tenantId || 'auto-detect'}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to set RLS context:', error);
            this.currentContext.isActive = false;
            throw error;
        }
    }

    /**
     * Clear user context
     */
    async clearContext(): Promise<void> {
        try {
            // Clear session settings
            await this.db.query("SELECT set_config('app.current_user_id', '', FALSE)");
            await this.db.query("SELECT set_config('app.current_tenant_id', '', FALSE)");

            this.currentContext = {
                userId: null,
                tenantId: null,
                isActive: false
            };

            console.log('✅ RLS Context cleared');
        } catch (error) {
            console.error('❌ Failed to clear RLS context:', error);
            throw error;
        }
    }

    /**
     * Get current context
     */
    getCurrentContext(): RLSContext {
        return { ...this.currentContext };
    }

    /**
     * Validate current user's security context
     */
    async validateSecurityContext(): Promise<SecurityValidationResult> {
        try {
            const result = await this.db.query(`
                SELECT
                    get_current_user_id() as current_user_id,
                    get_current_tenant_id() as current_tenant_id,
                    is_super_admin() as is_super_admin,
                    has_system_permission() as has_system_permission
            `);

            const row = result.rows[0];

            return {
                isValid: row.current_user_id !== null,
                canAccess: row.current_user_id !== null,
                isSuperAdmin: row.is_super_admin || false,
                hasSystemPermissions: row.has_system_permission || false,
                message: row.current_user_id ? 'Valid context' : 'No active user context'
            };
        } catch (error) {
            console.error('❌ Failed to validate security context:', error);
            return {
                isValid: false,
                canAccess: false,
                isSuperAdmin: false,
                hasSystemPermissions: false,
                message: `Validation failed: ${error.message}`
            };
        }
    }

    /**
     * Check if user can access specific tenant
     */
    async validateTenantAccess(tenantId: string): Promise<boolean> {
        try {
            const result = await this.db.query(
                'SELECT validate_tenant_access($1) as can_access',
                [tenantId]
            );

            return result.rows[0]?.can_access || false;
        } catch (error) {
            console.error('❌ Failed to validate tenant access:', error);
            return false;
        }
    }

    /**
     * Safely switch tenant context
     */
    async switchTenantContext(newTenantId: string): Promise<TenantSwitchResult> {
        const previousTenant = this.currentContext.tenantId;

        try {
            const result = await this.db.query(
                'SELECT safe_switch_tenant_context($1) as success',
                [newTenantId]
            );

            if (result.rows[0]?.success) {
                this.currentContext.tenantId = newTenantId;
                return {
                    success: true,
                    previousTenant,
                    newTenant: newTenantId,
                    message: 'Tenant context switched successfully'
                };
            } else {
                return {
                    success: false,
                    previousTenant,
                    newTenant: null,
                    message: 'Failed to switch tenant context'
                };
            }
        } catch (error) {
            console.error('❌ Failed to switch tenant context:', error);
            return {
                success: false,
                previousTenant,
                newTenant: null,
                message: `Switch failed: ${error.message}`
            };
        }
    }

    /**
     * Test RLS isolation by attempting to access different tenant data
     */
    async testTenantIsolation(): Promise<{
        ownTenantAccess: boolean;
        otherTenantAccess: boolean;
        systemDataAccess: boolean;
        isolationWorking: boolean;
    }> {
        try {
            const currentContext = await this.validateSecurityContext();
            
            // Test 1: Access own tenant data
            const ownTenantTest = await this.db.query(`
                SELECT COUNT(*) as count
                FROM tenant_users
                WHERE tenant_id = get_current_tenant_id()
            `);
            const ownTenantAccess = parseInt(ownTenantTest.rows[0].count) >= 0;

            // Test 2: Try to access other tenant data (should be blocked unless super admin)
            let otherTenantAccess = false;
            try {
                const otherTenantTest = await this.db.query(`
                    SELECT COUNT(*) as count
                    FROM tenant_users tu
                    JOIN tenants t ON t.id = tu.tenant_id
                    WHERE tu.tenant_id != get_current_tenant_id()
                    AND t.type != 'super_admin'
                `);
                otherTenantAccess = parseInt(otherTenantTest.rows[0].count) > 0;
            } catch (error) {
                // Expected untuk non-super admin users
                otherTenantAccess = false;
            }

            // Test 3: Access system data
            let systemDataAccess = false;
            try {
                const systemTest = await this.db.query('SELECT COUNT(*) as count FROM permissions');
                systemDataAccess = parseInt(systemTest.rows[0].count) > 0;
            } catch (error) {
                systemDataAccess = false;
            }

            // RLS isolation working if:
            // - Can access own tenant data
            // - Cannot access other tenant data (unless super admin)
            // - System data access based on permissions
            const isolationWorking = ownTenantAccess &&
                (!otherTenantAccess || currentContext.isSuperAdmin);

            return {
                ownTenantAccess,
                otherTenantAccess,
                systemDataAccess,
                isolationWorking
            };
        } catch (error) {
            console.error('❌ Failed to test tenant isolation:', error);
            return {
                ownTenantAccess: false,
                otherTenantAccess: false,
                systemDataAccess: false,
                isolationWorking: false
            };
        }
    }

    /**
     * Execute query with specific user context (temporary context switch)
     */
    async executeWithContext<T>(
        userId: string,
        tenantId: string | null,
        operation: (client: any) => Promise<T>
    ): Promise<T> {
        const originalContext = this.getCurrentContext();
        
        try {
            // Set temporary context
            await this.setUserContext(userId, tenantId || undefined);
            
            const client = this.db.getClient();
            return await operation(client);
        } finally {
            // Restore original context
            if (originalContext.isActive && originalContext.userId) {
                await this.setUserContext(originalContext.userId, originalContext.tenantId || undefined);
            } else {
                await this.clearContext();
            }
        }
    }

    /**
     * Get user's effective permissions dengan RLS context
     */
    async getUserEffectivePermissions(userId?: string): Promise<Array<{
        permission_name: string;
        resource: string;
        action: string;
        role_name: string;
    }>> {
        try {
            const targetUserId = userId || this.currentContext.userId;
            if (!targetUserId) {
                throw new Error('No user ID provided or in context');
            }

            const result = await this.db.query(
                'SELECT * FROM get_user_permissions($1)',
                [targetUserId]
            );

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get user permissions:', error);
            return [];
        }
    }

    /**
     * Check specific permission dengan RLS context
     */
    async checkUserPermission(permissionName: string, userId?: string): Promise<boolean> {
        try {
            const targetUserId = userId || this.currentContext.userId;
            if (!targetUserId) {
                return false;
            }

            const result = await this.db.query(
                'SELECT user_has_permission($1, $2) as has_permission',
                [targetUserId, permissionName]
            );

            return result.rows[0]?.has_permission || false;
        } catch (error) {
            console.error('❌ Failed to check user permission:', error);
            return false;
        }
    }

    /**
     * Log security event (untuk audit)
     */
    async logSecurityEvent(
        eventType: string,
        tableName: string,
        details: Record<string, any> = {}
    ): Promise<void> {
        try {
            await this.db.query(
                'SELECT log_security_event($1, $2, $3, $4, $5)',
                [
                    eventType,
                    tableName,
                    this.currentContext.userId,
                    this.currentContext.tenantId,
                    JSON.stringify(details)
                ]
            );
        } catch (error) {
            console.error('❌ Failed to log security event:', error);
        }
    }
}

// Export singleton instance
export function createRLSContextManager(db: DatabaseConnection): RLSContextManager {
    return new RLSContextManager(db);
}