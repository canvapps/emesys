import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseConnection } from './connection';

describe('DatabaseConnection', () => {
  let db: DatabaseConnection;

  beforeAll(async () => {
    db = new DatabaseConnection();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  describe('connection establishment', () => {
    it('should successfully connect to PostgreSQL database', async () => {
      const isConnected = await db.connect();
      expect(isConnected).toBe(true);
    });

    it('should return database client for queries', async () => {
      await db.connect();
      const client = db.getClient();
      expect(client).toBeDefined();
      expect(typeof client.query).toBe('function');
    });

    it('should execute basic query successfully', async () => {
      await db.connect();
      const result = await db.query('SELECT NOW() as current_time');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('current_time');
    });

    it('should handle connection errors gracefully', async () => {
      const badDb = new DatabaseConnection({
        host: 'nonexistent-host',
        port: 9999,
        database: 'nonexistent-db',
        user: 'nonexistent-user',
        password: 'wrong-password'
      });

      const isConnected = await badDb.connect();
      expect(isConnected).toBe(false);
    });
  });

  describe('connection management', () => {
    it('should close connection properly', async () => {
      await db.connect();
      const result = await db.close();
      expect(result).toBe(true);
    });

    it('should indicate when connection is active', async () => {
      await db.connect();
      expect(db.isConnected()).toBe(true);
      
      await db.close();
      expect(db.isConnected()).toBe(false);
    });
  });
});