// CommonJS wrapper for Smart Database Connection
const path = require('path');

// Simple implementation untuk CommonJS compatibility
class SmartConnection {
  constructor(customConfig) {
    this.isMocked = true; // Always use mock for tests
    this.client = {
      query: async (text, params) => {
        // Mock query results
        if (text.includes('SELECT COUNT(*)')) {
          return { rows: [{ count: '1' }] };
        }
        if (text.includes('RETURNING *') || text.includes('RETURNING')) {
          return { 
            rows: [{ 
              id: 'mock-id',
              name: 'Mock Data',
              email: 'mock@test.com',
              tenant_id: 'mock-tenant',
              created_at: new Date()
            }]
          };
        }
        return { rows: [] };
      },
      end: async () => true
    };
  }

  async getConnection() {
    console.log('🔧 SMART DB: Using mock mode for CommonJS tests');
    return this.client;
  }

  async disconnect() {
    console.log('🔌 Mock connection closed');
    return true;
  }
}

module.exports = { SmartConnection };