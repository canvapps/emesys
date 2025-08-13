import { Client, Pool, QueryResult } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export class DatabaseConnection {
  private client: Client | null = null;
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private connected: boolean = false;

  constructor(customConfig?: DatabaseConfig) {
    this.config = {
      host: customConfig?.host || process.env.DB_HOST || 'localhost',
      port: customConfig?.port || parseInt(process.env.DB_PORT || '5432'),
      database: customConfig?.database || process.env.DB_NAME || 'weddinvite_enterprise',
      user: customConfig?.user || process.env.DB_USER || 'postgres',
      password: customConfig?.password || process.env.DB_PASSWORD,
      ssl: customConfig?.ssl || false
    };
  }

  async connect(): Promise<boolean> {
    try {
      this.client = new Client({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl
      });

      await this.client.connect();
      this.connected = true;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      this.connected = false;
      return false;
    }
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Database connection not established. Call connect() first.');
    }
    return this.client;
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.client) {
      throw new Error('Database connection not established. Call connect() first.');
    }
    
    try {
      return await this.client.query(text, params);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async close(): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.end();
        this.client = null;
      }
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      this.connected = false;
      return true;
    } catch (error) {
      console.error('Error closing database connection:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  // Pool connection for production use
  async initPool(): Promise<boolean> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl,
        max: 20, // Maximum number of clients
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the pool connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      return true;
    } catch (error) {
      console.error('Database pool initialization failed:', error);
      return false;
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initPool() first.');
    }
    return this.pool;
  }
}

// Singleton instance for global use
export const dbConnection = new DatabaseConnection();