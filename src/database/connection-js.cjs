const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'weddinvite',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

/**
 * Connect to PostgreSQL database
 * @returns {Promise<Client>} PostgreSQL client instance
 */
async function connectToDatabase() {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

/**
 * Close database connection
 * @param {Client} client - PostgreSQL client instance
 */
async function closeDatabaseConnection(client) {
  if (client) {
    await client.end();
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  dbConfig
};