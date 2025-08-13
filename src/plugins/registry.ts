/**
 * PHASE 3: Plugin Registry System
 * Manages registration, loading, and lifecycle of event plugins
 * 
 * This system provides centralized plugin management with lazy loading,
 * dependency resolution, and development mode support.
 */

import { EventPlugin, PluginRegistryEntry, PluginLoaderConfig } from './types';

/**
 * Global plugin registry - singleton pattern
 */
class PluginRegistry {
  private plugins = new Map<string, PluginRegistryEntry>();
  private config: PluginLoaderConfig = {
    autoLoad: true,
    lazyLoad: true,
    enableDevMode: process.env.NODE_ENV === 'development',
  };

  // ======================================
  // PLUGIN REGISTRATION
  // ======================================

  /**
   * Register a plugin with the registry
   */
  register(plugin: EventPlugin): void {
    const entry: PluginRegistryEntry = {
      plugin,
      isActive: false,
      loadedAt: new Date(),
      dependencies: this.extractDependencies(plugin),
    };

    this.plugins.set(plugin.type, entry);
    
    if (this.config.enableDevMode) {
      console.log(`🔌 Plugin registered: ${plugin.name} v${plugin.version}`);
    }

    // Auto-load if enabled
    if (this.config.autoLoad) {
      this.activate(plugin.type);
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginType: string): void {
    const entry = this.plugins.get(pluginType);
    if (entry) {
      this.deactivate(pluginType);
      this.plugins.delete(pluginType);
      
      if (this.config.enableDevMode) {
        console.log(`🔌 Plugin unregistered: ${pluginType}`);
      }
    }
  }

  // ======================================
  // PLUGIN ACTIVATION/DEACTIVATION
  // ======================================

  /**
   * Activate a plugin
   */
  async activate(pluginType: string): Promise<void> {
    const entry = this.plugins.get(pluginType);
    if (!entry) {
      throw new Error(`Plugin not found: ${pluginType}`);
    }

    if (entry.isActive) {
      return; // Already active
    }

    // Check dependencies
    await this.resolveDependencies(entry);

    entry.isActive = true;
    entry.loadedAt = new Date();

    if (this.config.enableDevMode) {
      console.log(`✅ Plugin activated: ${entry.plugin.name}`);
    }
  }

  /**
   * Deactivate a plugin
   */
  deactivate(pluginType: string): void {
    const entry = this.plugins.get(pluginType);
    if (entry && entry.isActive) {
      entry.isActive = false;
      
      if (this.config.enableDevMode) {
        console.log(`⏹️ Plugin deactivated: ${entry.plugin.name}`);
      }
    }
  }

  // ======================================
  // PLUGIN RETRIEVAL
  // ======================================

  /**
   * Get a plugin by type
   */
  getPlugin(pluginType: string): EventPlugin | null {
    const entry = this.plugins.get(pluginType);
    return entry?.isActive ? entry.plugin : null;
  }

  /**
   * Get all active plugins
   */
  getActivePlugins(): EventPlugin[] {
    return Array.from(this.plugins.values())
      .filter(entry => entry.isActive)
      .map(entry => entry.plugin);
  }

  /**
   * Get all registered plugins (active and inactive)
   */
  getAllPlugins(): Record<string, EventPlugin> {
    const result: Record<string, EventPlugin> = {};
    this.plugins.forEach((entry, type) => {
      result[type] = entry.plugin;
    });
    return result;
  }

  /**
   * Check if plugin is active
   */
  isPluginActive(pluginType: string): boolean {
    const entry = this.plugins.get(pluginType);
    return entry?.isActive ?? false;
  }

  /**
   * List all available plugin types
   */
  getAvailablePluginTypes(): string[] {
    return Array.from(this.plugins.keys());
  }

  // ======================================
  // CONFIGURATION
  // ======================================

  /**
   * Update registry configuration
   */
  configure(newConfig: Partial<PluginLoaderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableDevMode) {
      console.log('🔧 Plugin registry configured:', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PluginLoaderConfig {
    return { ...this.config };
  }

  // ======================================
  // DEVELOPMENT & DEBUGGING
  // ======================================

  /**
   * Get registry status for debugging
   */
  getRegistryStatus() {
    const plugins = Array.from(this.plugins.entries()).map(([type, entry]) => ({
      type,
      name: entry.plugin.name,
      version: entry.plugin.version,
      isActive: entry.isActive,
      loadedAt: entry.loadedAt,
      dependencies: entry.dependencies || [],
    }));

    return {
      totalPlugins: this.plugins.size,
      activePlugins: plugins.filter(p => p.isActive).length,
      config: this.config,
      plugins,
    };
  }

  /**
   * Validate plugin implementation
   */
  validatePlugin(plugin: EventPlugin): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!plugin.type) errors.push('Plugin type is required');
    if (!plugin.name) errors.push('Plugin name is required');
    if (!plugin.version) errors.push('Plugin version is required');

    // Required methods
    if (typeof plugin.renderHero !== 'function') {
      errors.push('renderHero method is required');
    }
    if (typeof plugin.renderParticipants !== 'function') {
      errors.push('renderParticipants method is required');
    }
    if (typeof plugin.renderDetails !== 'function') {
      errors.push('renderDetails method is required');
    }
    if (typeof plugin.getDefaultSettings !== 'function') {
      errors.push('getDefaultSettings method is required');
    }
    if (typeof plugin.getFormFields !== 'function') {
      errors.push('getFormFields method is required');
    }
    if (typeof plugin.validateEventData !== 'function') {
      errors.push('validateEventData method is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ======================================
  // PRIVATE METHODS
  // ======================================

  private extractDependencies(plugin: EventPlugin): string[] {
    // In future, we can analyze plugin code for dependencies
    // For now, return empty array
    return [];
  }

  private async resolveDependencies(entry: PluginRegistryEntry): Promise<void> {
    if (!entry.dependencies || entry.dependencies.length === 0) {
      return;
    }

    // Load dependencies first
    for (const dep of entry.dependencies) {
      if (!this.isPluginActive(dep)) {
        await this.activate(dep);
      }
    }
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.plugins.clear();
    this.config = {
      autoLoad: true,
      lazyLoad: true,
      enableDevMode: process.env.NODE_ENV === 'development',
    };
  }
}

// ======================================
// SINGLETON INSTANCE
// ======================================

export const pluginRegistry = new PluginRegistry();

// ======================================
// CONVENIENCE FUNCTIONS
// ======================================

/**
 * Register a plugin (convenience function)
 */
export function registerPlugin(plugin: EventPlugin): void {
  pluginRegistry.register(plugin);
}

/**
 * Get plugin by type (convenience function)
 */
export function getPlugin(pluginType: string): EventPlugin | null {
  return pluginRegistry.getPlugin(pluginType);
}

/**
 * Get all active plugins (convenience function)
 */
export function getActivePlugins(): EventPlugin[] {
  return pluginRegistry.getActivePlugins();
}

/**
 * Check if plugin is active (convenience function)
 */
export function isPluginActive(pluginType: string): boolean {
  return pluginRegistry.isPluginActive(pluginType);
}

// ======================================
// DEVELOPMENT EXPORTS
// ======================================

export { PluginRegistry };

// For development/testing purposes
if (process.env.NODE_ENV === 'development') {
  // Make registry available globally for debugging
  (window as any).pluginRegistry = pluginRegistry;
}