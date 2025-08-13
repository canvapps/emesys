/**
 * PHASE 3: Plugin System Index
 * Central entry point for the Event Management Engine plugin system
 * 
 * This module exports all plugin system components and provides
 * convenient access to the plugin registry and hooks.
 */

// ======================================
// CORE PLUGIN SYSTEM EXPORTS
// ======================================

// Types and interfaces
export * from './types';

// Plugin registry system
export { 
  pluginRegistry, 
  registerPlugin, 
  getPlugin, 
  getActivePlugins, 
  isPluginActive,
  PluginRegistry 
} from './registry';

// React hooks for plugin system
export {
  usePlugin,
  usePluginManager,
  usePluginValidator,
  usePluginThemes,
  usePluginFormFields,
  usePluginRenderer,
  usePluginLifecycle
} from './hooks';

// ======================================
// PLUGIN IMPLEMENTATIONS
// ======================================

// Wedding plugin (reference implementation)
export { WeddingPlugin } from './wedding/WeddingPlugin';

// ======================================
// PLUGIN UTILITIES
// ======================================

/**
 * Initialize the plugin system
 * This should be called once during application startup
 */
export function initializePluginSystem() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Initializing Event Management Engine plugin system...');
    
    // Import pluginRegistry locally to avoid import issues
    const { pluginRegistry: registry } = require('./registry');
    
    // Log registered plugins
    const status = registry.getRegistryStatus();
    console.log(`📊 Registry status:`, status);
    
    if (status.totalPlugins > 0) {
      console.log('🎉 Plugins successfully loaded!');
    } else {
      console.warn('⚠️ No plugins found. Make sure plugins are properly registered.');
    }
  }
}

/**
 * Get plugin system statistics
 * Useful for debugging and monitoring
 */
export function getPluginSystemStats() {
  const { pluginRegistry: registry } = require('./registry');
  return registry.getRegistryStatus();
}

/**
 * Validate all registered plugins
 * Returns validation results for all plugins
 */
export function validateAllPlugins() {
  const { pluginRegistry: registry } = require('./registry');
  const allPlugins = registry.getAllPlugins();
  const results: Record<string, any> = {};
  
  Object.entries(allPlugins).forEach(([type, plugin]) => {
    results[type] = registry.validatePlugin(plugin);
  });
  
  return results;
}

/**
 * Get available event types from active plugins
 */
export function getAvailableEventTypes(): string[] {
  const { pluginRegistry: registry } = require('./registry');
  return registry.getActivePlugins().map(plugin => plugin.type);
}

/**
 * Check if an event type is supported
 */
export function isEventTypeSupported(eventType: string): boolean {
  const { pluginRegistry: registry } = require('./registry');
  return registry.isPluginActive(eventType);
}

// ======================================
// DEVELOPMENT HELPERS
// ======================================

if (process.env.NODE_ENV === 'development') {
  // Make plugin utilities available globally for debugging
  const { pluginRegistry: registry } = require('./registry');
  (window as any).pluginSystem = {
    registry: registry,
    stats: getPluginSystemStats,
    validate: validateAllPlugins,
    eventTypes: getAvailableEventTypes,
    isSupported: isEventTypeSupported
  };
}