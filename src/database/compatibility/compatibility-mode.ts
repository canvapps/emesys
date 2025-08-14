// ================================================================================================
// DATABASE COMPATIBILITY MODE - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// Backward compatibility layer untuk legacy database schemas
// ================================================================================================

export interface CompatibilityConfig {
  enableLegacySupport: boolean;
  migrationMode: 'strict' | 'loose';
  fallbackToLocalStorage: boolean;
}

export const defaultCompatibilityConfig: CompatibilityConfig = {
  enableLegacySupport: true,
  migrationMode: 'loose',
  fallbackToLocalStorage: true
};

export class CompatibilityLayer {
  constructor(private config: CompatibilityConfig = defaultCompatibilityConfig) {}

  isLegacyModeEnabled(): boolean {
    return this.config.enableLegacySupport;
  }

  shouldFallbackToLocalStorage(): boolean {
    return this.config.fallbackToLocalStorage;
  }

  getMigrationMode(): 'strict' | 'loose' {
    return this.config.migrationMode;
  }

  // Stub methods for future implementation
  async migrateData(data: any): Promise<any> {
    return data;
  }

  async validateSchema(schema: any): Promise<boolean> {
    return true;
  }
}

export default CompatibilityLayer;