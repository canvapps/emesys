import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SmartDatabaseConnection } from '../../../src/database/core/smart-connection';

describe('SmartDatabaseConnection', () => {
  let smartDb: SmartDatabaseConnection;

  beforeEach(() => {
    smartDb = new SmartDatabaseConnection({
      fallbackToMock: true,
      connectionTimeout: 1000
    });
  });

  afterEach(async () => {
    await smartDb.close();
  });

  describe('connection establishment', () => {
    it('should successfully connect (real or mock)', async () => {
      const isConnected = await smartDb.connect();
      expect(isConnected).toBe(true);
    });

    it('should return connection info', async () => {
      await smartDb.connect();
      const info = smartDb.getConnectionInfo();
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('connected');
      expect(['real', 'mock']).toContain(info.type);
      expect(info.connected).toBe(true);
    });

    it('should return database client for queries', async () => {
      await smartDb.connect();
      const client = smartDb.getClient();
      expect(client).toBeDefined();
      expect(typeof client.query).toBe('function');
    });

    it('should execute basic query successfully', async () => {
      await smartDb.connect();
      const result = await smartDb.query('SELECT NOW() as current_time');
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('should handle connection errors gracefully with fallback', async () => {
      // Test dengan config yang force error pada real connection
      const errorDb = new SmartDatabaseConnection({
        host: 'nonexistent-host',
        fallbackToMock: true,
        connectionTimeout: 500
      });
      
      const isConnected = await errorDb.connect();
      expect(isConnected).toBe(true); // Should succeed due to mock fallback
      
      const info = errorDb.getConnectionInfo();
      expect(info.type).toBe('mock'); // Should be using mock
      
      await errorDb.close();
    });
  });

  describe('connection management', () => {
    it('should close connection properly', async () => {
      await smartDb.connect();
      expect(smartDb.isConnected()).toBe(true);
      
      const closed = await smartDb.close();
      expect(closed).toBe(true);
      expect(smartDb.isConnected()).toBe(false);
    });

    it('should indicate when connection is active', async () => {
      await smartDb.connect();
      expect(smartDb.isConnected()).toBe(true);

      await smartDb.close();
      expect(smartDb.isConnected()).toBe(false);
    });
  });

  describe('mock mode preference', () => {
    it('should use mock when preferMock is true', async () => {
      const mockDb = new SmartDatabaseConnection({
        preferMock: true,
        fallbackToMock: true
      });

      await mockDb.connect();
      expect(mockDb.isMockMode()).toBe(true);
      
      const info = mockDb.getConnectionInfo();
      expect(info.type).toBe('mock');
      
      await mockDb.close();
    });

    it('should provide mock mode status', async () => {
      await smartDb.connect();
      const isMock = smartDb.isMockMode();
      expect(typeof isMock).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should throw error when getting client without connection', () => {
      expect(() => smartDb.getClient()).toThrow('Smart database connection belum established');
    });

    it('should throw error when querying without connection', async () => {
      await expect(smartDb.query('SELECT 1')).rejects.toThrow('Smart database connection belum established');
    });
  });

  describe('pool operations', () => {
    it('should initialize pool after connection', async () => {
      await smartDb.connect();
      const poolInitialized = await smartDb.initPool();
      expect(poolInitialized).toBe(true);
    });

    it('should return pool instance', async () => {
      await smartDb.connect();
      await smartDb.initPool();
      const pool = smartDb.getPool();
      expect(pool).toBeDefined();
    });
  });

  describe('query execution with different connections', () => {
    it('should execute version query', async () => {
      await smartDb.connect();
      const result = await smartDb.query('SELECT version()');
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    it('should execute tenant queries (with fallback to mock)', async () => {
      await smartDb.connect();
      // This should work with either real or mock connection
      const result = await smartDb.query('SELECT * FROM tenants LIMIT 1');
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });
});

// Test for singleton instances
describe('SmartDatabaseConnection Singletons', () => {
  it('should have working smartDbConnection singleton', async () => {
    const { smartDbConnection } = await import('../../../src/database/core/smart-connection');
    expect(smartDbConnection).toBeDefined();
    expect(smartDbConnection instanceof SmartDatabaseConnection).toBe(true);
  });

  it('should have working testDbConnection singleton', async () => {
    const { testDbConnection } = await import('../../../src/database/core/smart-connection');
    expect(testDbConnection).toBeDefined();
    expect(testDbConnection instanceof SmartDatabaseConnection).toBe(true);
  });
});