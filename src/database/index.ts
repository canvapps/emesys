/**
 * Database Layer - Clean Exports
 * 
 * This file provides clean, centralized imports for all database-related utilities,
 * models, and repositories. It follows the separation of concerns principle:
 * 
 * - Connection utilities for database connectivity
 * - Models for TypeScript interfaces and data structures  
 * - Repositories for data access and business logic
 */

// Connection utilities
export { DatabaseConnection, dbConnection } from './connection';
export type { DatabaseConfig } from './connection';

// Migration utilities
export { MigrationRunner } from './migrate';

// Models (will be populated during transformation)
// export * from './models';

// Repositories (will be populated during transformation)  
// export * from './repositories';

/**
 * Usage Examples:
 * 
 * // Import connection utilities
 * import { DatabaseConnection } from '@/database';
 * 
 * // Import specific utilities (once implemented)
 * // import { TenantsRepository, EventsRepository } from '@/database';
 * 
 * // Import types
 * // import type { Tenant, Event } from '@/database';
 */