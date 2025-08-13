import { DatabaseConnection } from './connection';
import { MockDatabaseConnection } from './connection-mock';
import type { QueryResult } from 'pg';

export interface SmartConnectionConfig {
  preferMock?: boolean;
  fallbackToMock?: boolean;
  connectionTimeout?: number;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

/**
 * Smart Database Connection Manager
 * Mencoba koneksi ke database nyata, jika gagal fallback ke mock connection
 */
export class SmartDatabaseConnection {
  private realConnection: DatabaseConnection;
  private mockConnection: MockDatabaseConnection;
  private activeConnection: DatabaseConnection | MockDatabaseConnection | null = null;
  private usingMock: boolean = false;
  private config: SmartConnectionConfig;

  constructor(customConfig?: SmartConnectionConfig) {
    this.config = {
      preferMock: customConfig?.preferMock || false,
      fallbackToMock: customConfig?.fallbackToMock !== false, // default true
      connectionTimeout: customConfig?.connectionTimeout || 3000,
      ...customConfig
    };

    this.realConnection = new DatabaseConnection(customConfig);
    this.mockConnection = new MockDatabaseConnection(customConfig);
  }

  async connect(): Promise<boolean> {
    // Jika konfigurasi memilih mock mode
    if (this.config.preferMock) {
      console.log('🔧 SMART DB: Menggunakan mock mode (preferMock=true)');
      const success = await this.mockConnection.connect();
      if (success) {
        this.activeConnection = this.mockConnection;
        this.usingMock = true;
        return true;
      }
    }

    // Coba koneksi ke database nyata
    try {
      console.log('🔍 SMART DB: Mencoba koneksi ke PostgreSQL...');
      const success = await Promise.race([
        this.realConnection.connect(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout!)
        )
      ]);

      if (success) {
        console.log('✅ SMART DB: PostgreSQL connection berhasil');
        this.activeConnection = this.realConnection;
        this.usingMock = false;
        return true;
      }
    } catch (error) {
      console.log('❌ SMART DB: PostgreSQL connection gagal:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback ke mock jika real connection gagal
    if (this.config.fallbackToMock) {
      console.log('🔧 SMART DB: Fallback ke mock mode');
      const mockSuccess = await this.mockConnection.connect();
      if (mockSuccess) {
        this.activeConnection = this.mockConnection;
        this.usingMock = true;
        return true;
      }
    }

    console.error('❌ SMART DB: Semua koneksi gagal');
    return false;
  }

  getClient(): any {
    if (!this.activeConnection) {
      throw new Error('Smart database connection belum established. Call connect() first.');
    }
    return this.activeConnection.getClient();
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.activeConnection) {
      throw new Error('Smart database connection belum established. Call connect() first.');
    }
    return await this.activeConnection.query(text, params);
  }

  async close(): Promise<boolean> {
    if (!this.activeConnection) {
      return true;
    }

    const success = await this.activeConnection.close();
    this.activeConnection = null;
    this.usingMock = false;
    return success;
  }

  isConnected(): boolean {
    return this.activeConnection?.isConnected() || false;
  }

  isMockMode(): boolean {
    return this.usingMock;
  }

  getConnectionInfo(): { type: 'real' | 'mock'; connected: boolean } {
    return {
      type: this.usingMock ? 'mock' : 'real',
      connected: this.isConnected()
    };
  }

  async initPool(): Promise<boolean> {
    if (!this.activeConnection) {
      throw new Error('Smart database connection belum established. Call connect() first.');
    }
    return await this.activeConnection.initPool();
  }

  getPool(): any {
    if (!this.activeConnection) {
      throw new Error('Smart database connection belum established. Call connect() first.');
    }
    return this.activeConnection.getPool();
  }
}

// Singleton instance untuk penggunaan global
export const smartDbConnection = new SmartDatabaseConnection({
  fallbackToMock: true,
  connectionTimeout: 2000
});

// Test environment specific instance
export const testDbConnection = new SmartDatabaseConnection({
  preferMock: process.env.NODE_ENV === 'test',
  fallbackToMock: true,
  connectionTimeout: 1000
});