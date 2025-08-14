import { beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
import '@testing-library/jest-dom';

// Load environment variables for testing
config({ path: '.env.local' });

// Set test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  console.log('Database:', process.env.TEST_DB_NAME || 'emesys_dev_test');
});

afterAll(async () => {
  console.log('🧪 Cleaning up test environment...');
});