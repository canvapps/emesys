/**
 * Compatibility Mode System
 * 
 * Provides a system to switch between legacy wedding tables and generic event tables
 * during the migration process. Allows gradual transition without breaking functionality.
 * 
 * Phase 2.2: Database Table Transformation
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type DatabaseMode = 'legacy' | 'generic' | 'hybrid';

export interface CompatibilityConfig {
  mode: DatabaseMode;
  tenantId: string;
  eventType: string;
  enableFallback: boolean;
}

export interface TableMapping {
  generic: string;
  legacy: string;
  fallbackEnabled: boolean;
}

/**
 * Table mappings between generic and legacy tables
 */
export const TABLE_MAPPINGS: Record<string, TableMapping> = {
  event_participants: {
    generic: 'event_participants',
    legacy: 'wedding_couple_info',
    fallbackEnabled: true
  },
  event_content: {
    generic: 'event_content',
    legacy: 'wedding_important_info',
    fallbackEnabled: true
  },
  event_sections: {
    generic: 'event_sections',
    legacy: 'wedding_sections',
    fallbackEnabled: true
  },
  event_stories: {
    generic: 'event_stories',
    legacy: 'wedding_love_story',
    fallbackEnabled: true
  },
  event_hero: {
    generic: 'event_sections',
    legacy: 'wedding_hero_settings',
    fallbackEnabled: true
  }
};

/**
 * Compatibility Mode Manager
 */
export class CompatibilityModeManager {
  private supabase: SupabaseClient;
  private config: CompatibilityConfig;

  constructor(supabase: SupabaseClient, config: CompatibilityConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  /**
   * Get table name based on compatibility mode
   */
  getTableName(genericTable: string): string {
    const mapping = TABLE_MAPPINGS[genericTable];
    if (!mapping) {
      console.warn(`No mapping found for table: ${genericTable}`);
      return genericTable;
    }

    switch (this.config.mode) {
      case 'legacy':
        return mapping.legacy;
      
      case 'generic':
        return mapping.generic;
      
      case 'hybrid':
        // In hybrid mode, prefer generic but fallback to legacy
        return mapping.generic;
      
      default:
        return mapping.legacy;
    }
  }

  /**
   * Execute query with compatibility mode support
   */
  async executeQuery(
    genericTable: string,
    queryCallback: (tableName: string) => Promise<any>
  ) {
    const primaryTable = this.getTableName(genericTable);
    
    try {
      // Try primary table first
      const result = await queryCallback(primaryTable);
      return result;
    } catch (error) {
      // If hybrid mode and fallback enabled, try legacy table
      if (this.config.mode === 'hybrid' && this.config.enableFallback) {
        const mapping = TABLE_MAPPINGS[genericTable];
        if (mapping && mapping.fallbackEnabled) {
          console.warn(
            `Primary table ${primaryTable} failed, falling back to ${mapping.legacy}`,
            error
          );
          
          try {
            return await queryCallback(mapping.legacy);
          } catch (fallbackError) {
            console.error(`Both primary and fallback tables failed:`, {
              primaryError: error,
              fallbackError
            });
            throw fallbackError;
          }
        }
      }
      throw error;
    }
  }

  /**
   * Check if compatibility mode is supported
   */
  isCompatibilityModeSupported(): boolean {
    return ['legacy', 'generic', 'hybrid'].includes(this.config.mode);
  }

  /**
   * Get current mode
   */
  getCurrentMode(): DatabaseMode {
    return this.config.mode;
  }

  /**
   * Switch compatibility mode
   */
  switchMode(newMode: DatabaseMode): void {
    this.config.mode = newMode;
  }

  /**
   * Get compatibility status
   */
  getCompatibilityStatus() {
    return {
      mode: this.config.mode,
      supported: this.isCompatibilityModeSupported(),
      enableFallback: this.config.enableFallback,
      eventType: this.config.eventType,
      tenantId: this.config.tenantId,
      availableMappings: Object.keys(TABLE_MAPPINGS)
    };
  }
}

/**
 * Factory function to create compatibility manager
 */
export function createCompatibilityManager(
  supabase: SupabaseClient,
  config: Partial<CompatibilityConfig>
): CompatibilityModeManager {
  const defaultConfig: CompatibilityConfig = {
    mode: 'hybrid',
    tenantId: '',
    eventType: 'wedding',
    enableFallback: true,
    ...config
  };

  return new CompatibilityModeManager(supabase, defaultConfig);
}

/**
 * Global compatibility mode state
 */
let globalCompatibilityMode: DatabaseMode = 'hybrid';

export function setGlobalCompatibilityMode(mode: DatabaseMode): void {
  globalCompatibilityMode = mode;
}

export function getGlobalCompatibilityMode(): DatabaseMode {
  return globalCompatibilityMode;
}