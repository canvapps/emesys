import { DatabaseConnection } from './connection.js';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'member' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'archived';

export interface TenantUser {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  last_login_at: Date | null;
  email_verified_at: Date | null;
  profile_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTenantUser {
  tenant_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  profile_data?: Record<string, any>;
}

export interface UpdateTenantUser {
  email?: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  status?: UserStatus;
  profile_data?: Record<string, any>;
}

export interface UserListOptions {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface UserListResult {
  users: TenantUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserWithTenant {
  user: TenantUser;
  tenant: {
    id: string;
    name: string;
    type: string;
    status: string;
    subscription_plan?: string;
  };
}

export class TenantUsersRepository {
  constructor(private db: DatabaseConnection) {}

  async create(userData: CreateTenantUser): Promise<TenantUser> {
    try {
      const query = `
        INSERT INTO tenant_users (
          tenant_id, email, password_hash, first_name, last_name, 
          role, status, profile_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        userData.tenant_id,
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.status,
        JSON.stringify(userData.profile_data || {})
      ];

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Failed to create tenant user');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'unique_email_per_tenant') {
          throw new Error('Email already exists for this tenant');
        }
      }
      if (error.code === '23503') { // Foreign key violation
        if (error.constraint === 'fk_tenant_users_tenant_id') {
          throw new Error('Invalid tenant ID');
        }
      }
      throw error;
    }
  }

  async findById(id: string): Promise<TenantUser | null> {
    try {
      const query = 'SELECT * FROM tenant_users WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(tenantId: string, email: string): Promise<TenantUser | null> {
    try {
      const query = `
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 AND email = $2
      `;
      const result = await this.db.query(query, [tenantId, email]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateData: UpdateTenantUser): Promise<TenantUser> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'profile_data') {
            updateFields.push(`${key} = $${paramCounter}`);
            values.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramCounter}`);
            values.push(value);
          }
          paramCounter++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add updated_at field
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE tenant_users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      values.push(id);

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'unique_email_per_tenant') {
          throw new Error('Email already exists for this tenant');
        }
      }
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<TenantUser> {
    try {
      const query = `
        UPDATE tenant_users 
        SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async markEmailVerified(id: string): Promise<TenantUser> {
    try {
      const query = `
        UPDATE tenant_users 
        SET email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<TenantUser> {
    try {
      const query = `
        UPDATE tenant_users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [passwordHash, id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM tenant_users WHERE id = $1';
      const result = await this.db.query(query, [id]);

      return (result.rowCount || 0) > 0;
    } catch (error) {
      throw error;
    }
  }

  async listByTenant(tenantId: string, options: UserListOptions = {}): Promise<UserListResult> {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        status,
        search
      } = options;

      // Build WHERE clause
      const whereConditions = ['tenant_id = $1'];
      const values: any[] = [tenantId];
      let paramCounter = 2;

      if (role) {
        whereConditions.push(`role = $${paramCounter}`);
        values.push(role);
        paramCounter++;
      }

      if (status) {
        whereConditions.push(`status = $${paramCounter}`);
        values.push(status);
        paramCounter++;
      }

      if (search) {
        whereConditions.push(`(
          first_name ILIKE $${paramCounter} OR 
          last_name ILIKE $${paramCounter} OR 
          email ILIKE $${paramCounter}
        )`);
        values.push(`%${search}%`);
        paramCounter++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Count total records
      const countQuery = `SELECT COUNT(*) FROM tenant_users WHERE ${whereClause}`;
      const countResult = await this.db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM tenant_users 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      values.push(limit, offset);

      const dataResult = await this.db.query(dataQuery, values);
      const users = dataResult.rows.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw error;
    }
  }

  async userBelongsToTenant(userId: string, tenantId: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM tenant_users 
        WHERE id = $1 AND tenant_id = $2
      `;
      const result = await this.db.query(query, [userId, tenantId]);

      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async countActiveUsersInTenant(tenantId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) FROM tenant_users 
        WHERE tenant_id = $1 AND status = 'active'
      `;
      const result = await this.db.query(query, [tenantId]);

      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  async findByIdWithTenant(id: string): Promise<UserWithTenant | null> {
    try {
      const query = `
        SELECT 
          tu.*,
          t.id as tenant_id,
          t.name as tenant_name,
          t.type as tenant_type,
          t.status as tenant_status,
          t.subscription_plan as tenant_subscription_plan
        FROM tenant_users tu
        JOIN tenants t ON tu.tenant_id = t.id
        WHERE tu.id = $1
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      return {
        user: this.mapRowToUser(row),
        tenant: {
          id: row.tenant_id,
          name: row.tenant_name,
          type: row.tenant_type,
          status: row.tenant_status,
          subscription_plan: row.tenant_subscription_plan
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Business logic methods
  async canManageUser(managerId: string, targetUserId: string): Promise<boolean> {
    try {
      const query = `
        SELECT 
          m.role as manager_role,
          m.tenant_id as manager_tenant,
          t.role as target_role,
          t.tenant_id as target_tenant
        FROM tenant_users m
        CROSS JOIN tenant_users t
        WHERE m.id = $1 AND t.id = $2
      `;

      const result = await this.db.query(query, [managerId, targetUserId]);

      if (result.rows.length === 0) {
        return false;
      }

      const { manager_role, manager_tenant, target_role, target_tenant } = result.rows[0];

      // Users can only manage within same tenant (except super_admin)
      if (manager_role !== 'super_admin' && manager_tenant !== target_tenant) {
        return false;
      }

      // Use hierarchy validation function
      const hierarchyQuery = `
        SELECT validate_user_role_hierarchy($1, $2, $3) as can_manage
      `;

      const hierarchyResult = await this.db.query(hierarchyQuery, [
        manager_tenant,
        manager_role,
        target_role
      ]);

      return hierarchyResult.rows[0].can_manage;
    } catch (error) {
      throw error;
    }
  }

  async hasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    try {
      const query = 'SELECT user_can_access_feature($1, $2) as has_access';
      const result = await this.db.query(query, [userId, featureName]);

      return result.rows[0].has_access;
    } catch (error) {
      throw error;
    }
  }

  getRoleHierarchyLevel(role: UserRole): number {
    const hierarchy: Record<UserRole, number> = {
      'super_admin': 5,
      'admin': 4,
      'manager': 3,
      'member': 2,
      'guest': 1
    };

    return hierarchy[role] || 0;
  }

  // Helper methods
  private mapRowToUser(row: any): TenantUser {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      email: row.email,
      password_hash: row.password_hash,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
      status: row.status,
      last_login_at: row.last_login_at ? new Date(row.last_login_at) : null,
      email_verified_at: row.email_verified_at ? new Date(row.email_verified_at) : null,
      profile_data: typeof row.profile_data === 'string' 
        ? JSON.parse(row.profile_data) 
        : row.profile_data || {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // Utility methods for tenant management
  async getUsersByRole(tenantId: string, role: UserRole): Promise<TenantUser[]> {
    try {
      const query = `
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 AND role = $2
        ORDER BY created_at ASC
      `;

      const result = await this.db.query(query, [tenantId, role]);
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw error;
    }
  }

  async getRecentlyActiveUsers(tenantId: string, days: number = 30): Promise<TenantUser[]> {
    try {
      const query = `
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 
        AND last_login_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY last_login_at DESC
      `;

      const result = await this.db.query(query, [tenantId]);
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw error;
    }
  }

  async searchUsers(tenantId: string, searchTerm: string, limit: number = 10): Promise<TenantUser[]> {
    try {
      const query = `
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 
        AND (
          first_name ILIKE $2 OR 
          last_name ILIKE $2 OR 
          email ILIKE $2 OR
          (first_name || ' ' || last_name) ILIKE $2
        )
        ORDER BY 
          CASE WHEN email ILIKE $2 THEN 1 ELSE 2 END,
          first_name ASC
        LIMIT $3
      `;

      const searchPattern = `%${searchTerm}%`;
      const result = await this.db.query(query, [tenantId, searchPattern, limit]);
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw error;
    }
  }
}