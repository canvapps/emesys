import { DatabaseConnection } from './connection';
import { QueryResult } from 'pg';

export type TenantType = 'super_admin' | 'wedding_agency' | 'couple';
export type TenantStatus = 'active' | 'suspended' | 'inactive' | 'expired';
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'suspended' | 'expired' | 'cancelled' | 'trial';

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  status: TenantStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_expires_at?: Date;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTenantData {
  name: string;
  type: TenantType;
  status: TenantStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_expires_at?: Date;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateTenantData {
  name?: string;
  type?: TenantType;
  status?: TenantStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  subscription_expires_at?: Date;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TenantFilters {
  type?: TenantType;
  status?: TenantStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  filters?: TenantFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export class TenantsRepository {
  constructor(private db: DatabaseConnection) {}

  async create(data: CreateTenantData): Promise<Tenant> {
    const query = `
      INSERT INTO tenants (
        name, type, status, subscription_plan, subscription_status,
        subscription_expires_at, settings, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.name,
      data.type,
      data.status,
      data.subscription_plan || 'free',
      data.subscription_status || 'active',
      data.subscription_expires_at || null,
      JSON.stringify(data.settings || {}),
      JSON.stringify(data.metadata || {})
    ];

    try {
      const result = await this.db.query(query, values);
      return this.mapRowToTenant(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Tenant with this name already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Tenant | null> {
    const query = 'SELECT * FROM tenants WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTenant(result.rows[0]);
  }

  async findByName(name: string): Promise<Tenant | null> {
    const query = 'SELECT * FROM tenants WHERE name = $1';
    const result = await this.db.query(query, [name]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTenant(result.rows[0]);
  }

  async update(id: string, data: UpdateTenantData): Promise<Tenant | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build dynamic update query
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (value !== undefined) {
        if (key === 'settings' || key === 'metadata') {
          updates.push(`${key} = $${paramCounter}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramCounter}`);
          values.push(value);
        }
        paramCounter++;
      }
    });

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE tenants 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToTenant(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Tenant with this name already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM tenants WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Tenant>> {
    const { limit = 10, offset = 0, filters = {} } = options;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    Object.keys(filters).forEach((key) => {
      const value = (filters as any)[key];
      if (value !== undefined) {
        conditions.push(`${key} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM tenants ${whereClause}`;
    const countResult = await this.db.query(countQuery, values.slice(0, paramCounter - 1));
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    values.push(limit, offset);
    const dataQuery = `
      SELECT * FROM tenants 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const dataResult = await this.db.query(dataQuery, values);
    const data = dataResult.rows.map(row => this.mapRowToTenant(row));

    return {
      data,
      total,
      limit,
      offset
    };
  }

  async hasPremiumAccess(tenantId: string): Promise<boolean> {
    const query = `
      SELECT subscription_plan, subscription_status, subscription_expires_at
      FROM tenants 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [tenantId]);
    
    if (result.rows.length === 0) {
      return false;
    }

    const { subscription_plan, subscription_status, subscription_expires_at } = result.rows[0];

    // Check if plan is premium or enterprise
    if (!['premium', 'enterprise'].includes(subscription_plan)) {
      return false;
    }

    // Check if subscription is active
    if (subscription_status !== 'active') {
      return false;
    }

    // Check if subscription hasn't expired
    if (subscription_expires_at && new Date(subscription_expires_at) < new Date()) {
      return false;
    }

    return true;
  }

  async canManageTenant(managerId: string, tenantId: string): Promise<boolean> {
    const query = 'SELECT validate_tenant_hierarchy($1, $2) as can_manage';
    const result = await this.db.query(query, [tenantId, managerId]);
    
    return result.rows[0].can_manage;
  }

  private mapRowToTenant(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      subscription_plan: row.subscription_plan,
      subscription_status: row.subscription_status,
      subscription_expires_at: row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // Migration helper method
  async runMigration(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationPath = path.join(process.cwd(), 'src/database/migrations/001_create_tenants_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await this.db.query(migrationSQL);
  }
}