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
export { DatabaseConnectionFactory, ConnectionManager } from './connection';
export type { DatabaseConnection, ConnectionConfig } from './connection';

// Migration utilities (disabled until FASE 2)
// export * from './migrate';

// Models
export { default as Models } from './models';
export type { RSVPModel, SessionModel } from './models';

// Repositories
export { default as BaseRepository } from './repositories';
export type { Repository } from './repositories';

// Database Adapter
export { DatabaseAdapterFactory } from './database-adapter';
export type { DatabaseAdapter } from './database-adapter';

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