/**
 * Roles and Permissions Repository
 * Multi-tenant role-based access control system
 * Implements granular permission management with role hierarchy
 */

import { DatabaseConnection } from './connection.js';

// ==================== INTERFACES ====================

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
    category: 'general' | 'content' | 'admin' | 'billing' | 'analytics' | 'system';
    isSystemPermission: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserRole {
    id: string;
    tenantId: string | null;
    name: string;
    displayName: string;
    description?: string;
    color: string;
    priority: number;
    isSystemRole: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface RolePermission {
    id: string;
    roleId: string;
    permissionId: string;
    grantedByUserId?: string;
    grantedAt: Date;
}

export interface UserRoleAssignment {
    id: string;
    userId: string;
    roleId: string;
    assignedByUserId?: string;
    assignedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
}

export interface UserPermissionInfo {
    permissionName: string;
    resource: string;
    action: string;
    roleName: string;
}

export interface CreatePermissionData {
    name: string;
    resource: string;
    action: string;
    description?: string;
    category: Permission['category'];
    isSystemPermission?: boolean;
}

export interface CreateUserRoleData {
    tenantId?: string;
    name: string;
    displayName: string;
    description?: string;
    color?: string;
    priority?: number;
    isSystemRole?: boolean;
}

export interface AssignRoleData {
    userId: string;
    roleId: string;
    assignedByUserId: string;
    expiresAt?: Date;
}

// ==================== REPOSITORY CLASS ====================

export class RolesPermissionsRepository {
    private db: DatabaseConnection;

    constructor() {
        this.db = new DatabaseConnection();
    }

    // ==================== PERMISSION METHODS ====================

    /**
     * Create a new permission
     */
    async createPermission(data: CreatePermissionData): Promise<Permission> {
        await this.db.connect();
        
        try {
            const query = `
                INSERT INTO permissions (name, resource, action, description, category, is_system_permission)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING 
                    id,
                    name,
                    resource,
                    action,
                    description,
                    category,
                    is_system_permission as "isSystemPermission",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
            `;
            
            const values = [
                data.name,
                data.resource,
                data.action,
                data.description || null,
                data.category,
                data.isSystemPermission || false
            ];
            
            const result = await this.db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to create permission: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Get permission by ID
     */
    async getPermissionById(id: string): Promise<Permission | null> {
        await this.db.connect();
        
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    resource,
                    action,
                    description,
                    category,
                    is_system_permission as "isSystemPermission",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                FROM permissions 
                WHERE id = $1
            `;
            
            const result = await this.db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to get permission: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Get permission by name
     */
    async getPermissionByName(name: string): Promise<Permission | null> {
        await this.db.connect();
        
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    resource,
                    action,
                    description,
                    category,
                    is_system_permission as "isSystemPermission",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                FROM permissions 
                WHERE name = $1
            `;
            
            const result = await this.db.query(query, [name]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to get permission by name: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * List all permissions with optional filtering
     */
    async listPermissions(filters?: {
        category?: Permission['category'];
        resource?: string;
        isSystemPermission?: boolean;
    }): Promise<Permission[]> {
        await this.db.connect();
        
        try {
            let query = `
                SELECT 
                    id,
                    name,
                    resource,
                    action,
                    description,
                    category,
                    is_system_permission as "isSystemPermission",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                FROM permissions
                WHERE 1=1
            `;
            
            const values: any[] = [];
            let paramIndex = 1;
            
            if (filters?.category) {
                query += ` AND category = $${paramIndex}`;
                values.push(filters.category);
                paramIndex++;
            }
            
            if (filters?.resource) {
                query += ` AND resource = $${paramIndex}`;
                values.push(filters.resource);
                paramIndex++;
            }
            
            if (filters?.isSystemPermission !== undefined) {
                query += ` AND is_system_permission = $${paramIndex}`;
                values.push(filters.isSystemPermission);
                paramIndex++;
            }
            
            query += ` ORDER BY category, resource, action`;
            
            const result = await this.db.query(query, values);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to list permissions: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    // ==================== ROLE METHODS ====================

    /**
     * Create a new user role
     */
    async createUserRole(data: CreateUserRoleData): Promise<UserRole> {
        await this.db.connect();
        
        try {
            const query = `
                INSERT INTO user_roles (tenant_id, name, display_name, description, color, priority, is_system_role)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING 
                    id,
                    tenant_id as "tenantId",
                    name,
                    display_name as "displayName",
                    description,
                    color,
                    priority,
                    is_system_role as "isSystemRole",
                    is_active as "isActive",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
            `;
            
            const values = [
                data.tenantId || null,
                data.name,
                data.displayName,
                data.description || null,
                data.color || '#6B7280',
                data.priority || 0,
                data.isSystemRole || false
            ];
            
            const result = await this.db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to create user role: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Get role by ID
     */
    async getUserRoleById(id: string): Promise<UserRole | null> {
        await this.db.connect();
        
        try {
            const query = `
                SELECT 
                    id,
                    tenant_id as "tenantId",
                    name,
                    display_name as "displayName",
                    description,
                    color,
                    priority,
                    is_system_role as "isSystemRole",
                    is_active as "isActive",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                FROM user_roles 
                WHERE id = $1
            `;
            
            const result = await this.db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to get user role: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * List roles for a tenant (or system roles)
     */
    async listUserRoles(tenantId?: string | null): Promise<UserRole[]> {
        await this.db.connect();
        
        try {
            let query = `
                SELECT 
                    id,
                    tenant_id as "tenantId",
                    name,
                    display_name as "displayName",
                    description,
                    color,
                    priority,
                    is_system_role as "isSystemRole",
                    is_active as "isActive",
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                FROM user_roles 
                WHERE is_active = TRUE
            `;
            
            const values: any[] = [];
            
            if (tenantId === null) {
                // Get only system roles
                query += ` AND tenant_id IS NULL`;
            } else if (tenantId) {
                // Get tenant-specific roles and system roles
                query += ` AND (tenant_id = $1 OR tenant_id IS NULL)`;
                values.push(tenantId);
            }
            
            query += ` ORDER BY priority DESC, name`;
            
            const result = await this.db.query(query, values);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to list user roles: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    // ==================== ROLE-PERMISSION METHODS ====================

    /**
     * Grant permission to role
     */
    async grantPermissionToRole(roleId: string, permissionId: string, grantedByUserId?: string): Promise<RolePermission> {
        await this.db.connect();
        
        try {
            const query = `
                INSERT INTO role_permissions (role_id, permission_id, granted_by_user_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (role_id, permission_id) DO UPDATE SET
                    granted_by_user_id = EXCLUDED.granted_by_user_id,
                    granted_at = CURRENT_TIMESTAMP
                RETURNING 
                    id,
                    role_id as "roleId",
                    permission_id as "permissionId",
                    granted_by_user_id as "grantedByUserId",
                    granted_at as "grantedAt"
            `;
            
            const result = await this.db.query(query, [roleId, permissionId, grantedByUserId || null]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to grant permission to role: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Get permissions for a role
     */
    async getRolePermissions(roleId: string): Promise<Permission[]> {
        await this.db.connect();
        
        try {
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.resource,
                    p.action,
                    p.description,
                    p.category,
                    p.is_system_permission as "isSystemPermission",
                    p.created_at as "createdAt",
                    p.updated_at as "updatedAt"
                FROM permissions p
                JOIN role_permissions rp ON rp.permission_id = p.id
                WHERE rp.role_id = $1
                ORDER BY p.category, p.resource, p.action
            `;
            
            const result = await this.db.query(query, [roleId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to get role permissions: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    // ==================== USER ROLE ASSIGNMENT METHODS ====================

    /**
     * Assign role to user
     */
    async assignRoleToUser(data: AssignRoleData): Promise<UserRoleAssignment> {
        await this.db.connect();
        
        try {
            // Use the PostgreSQL function for validation
            const assignQuery = `SELECT assign_role_to_user($1, $2, $3, $4)`;
            await this.db.query(assignQuery, [
                data.userId,
                data.roleId,
                data.assignedByUserId,
                data.expiresAt || null
            ]);
            
            // Get the assignment record
            const query = `
                SELECT 
                    id,
                    user_id as "userId",
                    role_id as "roleId",
                    assigned_by_user_id as "assignedByUserId",
                    assigned_at as "assignedAt",
                    expires_at as "expiresAt",
                    is_active as "isActive"
                FROM user_role_assignments 
                WHERE user_id = $1 AND role_id = $2
            `;
            
            const result = await this.db.query(query, [data.userId, data.roleId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to assign role to user: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Get user's assigned roles
     */
    async getUserRoles(userId: string): Promise<UserRole[]> {
        await this.db.connect();
        
        try {
            const query = `
                SELECT 
                    ur.id,
                    ur.tenant_id as "tenantId",
                    ur.name,
                    ur.display_name as "displayName",
                    ur.description,
                    ur.color,
                    ur.priority,
                    ur.is_system_role as "isSystemRole",
                    ur.is_active as "isActive",
                    ur.created_at as "createdAt",
                    ur.updated_at as "updatedAt"
                FROM user_roles ur
                JOIN user_role_assignments ura ON ura.role_id = ur.id
                WHERE ura.user_id = $1 
                AND ura.is_active = TRUE
                AND ur.is_active = TRUE
                AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
                ORDER BY ur.priority DESC
            `;
            
            const result = await this.db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to get user roles: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    // ==================== PERMISSION CHECKING METHODS ====================

    /**
     * Check if user has specific permission
     */
    async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
        await this.db.connect();
        
        try {
            const query = `SELECT user_has_permission($1, $2) as has_permission`;
            const result = await this.db.query(query, [userId, permissionName]);
            return result.rows[0]?.has_permission || false;
        } catch (error) {
            throw new Error(`Failed to check user permission: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Get all effective permissions for user
     */
    async getUserPermissions(userId: string): Promise<UserPermissionInfo[]> {
        await this.db.connect();
        
        try {
            const query = `SELECT * FROM get_user_permissions($1)`;
            const result = await this.db.query(query, [userId]);
            return result.rows.map(row => ({
                permissionName: row.permission_name,
                resource: row.resource,
                action: row.action,
                roleName: row.role_name
            }));
        } catch (error) {
            throw new Error(`Failed to get user permissions: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }

    /**
     * Check if user can manage another user's roles
     */
    async canManageUserRoles(managerUserId: string, targetUserId: string): Promise<boolean> {
        await this.db.connect();
        
        try {
            const query = `SELECT can_manage_user_roles($1, $2) as can_manage`;
            const result = await this.db.query(query, [managerUserId, targetUserId]);
            return result.rows[0]?.can_manage || false;
        } catch (error) {
            throw new Error(`Failed to check role management permission: ${error.message}`);
        } finally {
            await this.db.close();
        }
    }
}

// Export default instance
export const rolesPermissionsRepository = new RolesPermissionsRepository();
export default rolesPermissionsRepository;