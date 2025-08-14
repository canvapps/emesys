// ================================================================================================
// DATABASE CONNECTION MANAGEMENT - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// Centralized connection management untuk semua database operations
// Supporting both PostgreSQL dan Supabase dengan unified interface
// ================================================================================================

import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

export interface DatabaseConnection {
  query: (text: string, params?: any[]) => Promise<any>;
  close: () => Promise<void>;
  isConnected: () => boolean;
}

export interface ConnectionConfig {
  type: 'postgresql' | 'supabase';
  connectionString?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// PostgreSQL Connection Class
class PostgreSQLConnection implements DatabaseConnection {
  private pool: Pool;
  private connected: boolean = false;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('connect', () => {
      this.connected = true;
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      this.connected = false;
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Supabase Connection Class
class SupabaseConnection implements DatabaseConnection {
  private client: any;
  private connected: boolean = false;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
    this.connected = true; // Supabase is always "connected"
  }

  async query(text: string, params?: any[]): Promise<any> {
    // This would need to be implemented based on Supabase's query format
    // For now, return a mock result
    return { rows: [], rowCount: 0 };
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Connection Factory
export class DatabaseConnectionFactory {
  static async createConnection(config: ConnectionConfig): Promise<DatabaseConnection> {
    switch (config.type) {
      case 'postgresql':
        if (!config.connectionString) {
          throw new Error('PostgreSQL connection string is required');
        }
        const pgConnection = new PostgreSQLConnection(config.connectionString);
        return pgConnection;

      case 'supabase':
        if (!config.supabaseUrl || !config.supabaseKey) {
          throw new Error('Supabase URL and key are required');
        }
        return new SupabaseConnection(config.supabaseUrl, config.supabaseKey);

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
}

// Singleton connection manager
export class ConnectionManager {
  private static connections: Map<string, DatabaseConnection> = new Map();

  static async getConnection(name: string, config: ConnectionConfig): Promise<DatabaseConnection> {
    if (!this.connections.has(name)) {
      const connection = await DatabaseConnectionFactory.createConnection(config);
      this.connections.set(name, connection);
    }
    return this.connections.get(name)!;
  }

  static async closeConnection(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (connection) {
      await connection.close();
      this.connections.delete(name);
    }
  }

  static async closeAllConnections(): Promise<void> {
    for (const [name, connection] of this.connections) {
      await connection.close();
    }
    this.connections.clear();
  }
}

export default DatabaseConnectionFactory;