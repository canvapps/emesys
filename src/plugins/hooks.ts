/**
 * PHASE 3: Plugin System Hooks
 * React hooks for interacting with the plugin system
 * 
 * These hooks provide reactive plugin management with automatic
 * reloading, error handling, and performance optimization.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EventPlugin, UsePluginResult, UsePluginManagerResult } from './types';
import { pluginRegistry } from './registry';

// ======================================
// SINGLE PLUGIN HOOK
// ======================================

/**
 * Hook for loading and using a specific plugin
 * @param pluginType The type of plugin to load (e.g., 'wedding', 'seminar')
 * @param autoLoad Whether to automatically load the plugin
 */
export function usePlugin(pluginType: string, autoLoad: boolean = true): UsePluginResult {
  const [plugin, setPlugin] = useState<EventPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPlugin = useCallback(async () => {
    if (!pluginType) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to get existing plugin
      let loadedPlugin = pluginRegistry.getPlugin(pluginType);

      if (!loadedPlugin) {
        // Plugin not active, try to activate
        await pluginRegistry.activate(pluginType);
        loadedPlugin = pluginRegistry.getPlugin(pluginType);
      }

      if (!loadedPlugin) {
        throw new Error(`Plugin '${pluginType}' not found or failed to load`);
      }

      setPlugin(loadedPlugin);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load plugin');
      setError(error);
      setPlugin(null);
    } finally {
      setIsLoading(false);
    }
  }, [pluginType]);

  const reload = useCallback(async () => {
    await loadPlugin();
  }, [loadPlugin]);

  // Auto-load on mount and when pluginType changes
  useEffect(() => {
    if (autoLoad) {
      loadPlugin();
    }
  }, [pluginType, autoLoad, loadPlugin]);

  return {
    plugin,
    isLoading,
    error,
    reload,
  };
}

// ======================================
// PLUGIN MANAGER HOOK
// ======================================

/**
 * Hook for managing multiple plugins
 * Provides access to all plugins and management functions
 */
export function usePluginManager(): UsePluginManagerResult {
  const [plugins, setPlugins] = useState<Record<string, EventPlugin>>({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Refresh plugins list
  const refreshPlugins = useCallback(() => {
    const allPlugins = pluginRegistry.getAllPlugins();
    setPlugins(allPlugins);
    setLastUpdate(Date.now());
  }, []);

  // Load a specific plugin
  const loadPlugin = useCallback(async (type: string) => {
    try {
      await pluginRegistry.activate(type);
      refreshPlugins();
    } catch (error) {
      console.error(`Failed to load plugin '${type}':`, error);
      throw error;
    }
  }, [refreshPlugins]);

  // Unload a plugin
  const unloadPlugin = useCallback((type: string) => {
    pluginRegistry.deactivate(type);
    refreshPlugins();
  }, [refreshPlugins]);

  // Check if plugin is active
  const isPluginActive = useCallback((type: string) => {
    return pluginRegistry.isPluginActive(type);
  }, []);

  // Get active plugins
  const activePlugins = useMemo(() => {
    return pluginRegistry.getActivePlugins();
  }, [lastUpdate]);

  // Initialize on mount
  useEffect(() => {
    refreshPlugins();
  }, [refreshPlugins]);

  return {
    plugins,
    activePlugins,
    loadPlugin,
    unloadPlugin,
    isPluginActive,
  };
}

// ======================================
// PLUGIN VALIDATION HOOK
// ======================================

/**
 * Hook for validating plugin implementations
 * Useful for development and testing
 */
export function usePluginValidator() {
  const validatePlugin = useCallback((plugin: EventPlugin) => {
    return pluginRegistry.validatePlugin(plugin);
  }, []);

  const getRegistryStatus = useCallback(() => {
    return pluginRegistry.getRegistryStatus();
  }, []);

  return {
    validatePlugin,
    getRegistryStatus,
  };
}

// ======================================
// PLUGIN THEME HOOK
// ======================================

/**
 * Hook for managing plugin-specific themes
 * @param pluginType Plugin type to get themes for
 */
export function usePluginThemes(pluginType: string) {
  const { plugin } = usePlugin(pluginType);
  
  const availableThemes = useMemo(() => {
    if (!plugin || !plugin.getAvailableThemes) {
      return [];
    }
    return plugin.getAvailableThemes();
  }, [plugin]);

  const defaultTheme = useMemo(() => {
    if (!plugin || !plugin.getDefaultTheme) {
      return null;
    }
    return plugin.getDefaultTheme();
  }, [plugin]);

  return {
    availableThemes,
    defaultTheme,
    hasThemes: availableThemes.length > 0,
  };
}

// ======================================
// PLUGIN FORM FIELDS HOOK
// ======================================

/**
 * Hook for getting dynamic form fields from a plugin
 * @param pluginType Plugin type to get form fields for
 */
export function usePluginFormFields(pluginType: string) {
  const { plugin } = usePlugin(pluginType);

  const formFields = useMemo(() => {
    if (!plugin) return [];
    return plugin.getFormFields();
  }, [plugin]);

  const defaultSettings = useMemo(() => {
    if (!plugin) return {};
    return plugin.getDefaultSettings();
  }, [plugin]);

  const validateEventData = useCallback((data: any) => {
    if (!plugin) {
      return { isValid: false, errors: [{ field: 'plugin', message: 'Plugin not loaded' }] };
    }
    return plugin.validateEventData(data);
  }, [plugin]);

  return {
    formFields,
    defaultSettings,
    validateEventData,
    isReady: !!plugin,
  };
}

// ======================================
// PLUGIN COMPONENT RENDERER HOOK
// ======================================

/**
 * Hook for rendering plugin components with error boundaries
 * @param pluginType Plugin type
 * @param componentType Type of component to render ('hero', 'participants', etc.)
 */
export function usePluginRenderer(pluginType: string, componentType: string) {
  const { plugin, isLoading, error } = usePlugin(pluginType);

  const renderComponent = useCallback((data: any, config: any = {}) => {
    if (isLoading) {
      return <div className="plugin-loading">Loading plugin...</div>;
    }

    if (error) {
      return (
        <div className="plugin-error">
          <p>Error loading plugin: {error.message}</p>
        </div>
      );
    }

    if (!plugin) {
      return (
        <div className="plugin-not-found">
          <p>Plugin '{pluginType}' not found</p>
        </div>
      );
    }

    try {
      switch (componentType) {
        case 'hero':
          return plugin.renderHero(data, config);
        case 'participants':
          return plugin.renderParticipants(data, config);
        case 'details':
          return plugin.renderDetails(data, config);
        case 'story':
          return plugin.renderStory?.(data, config) ?? null;
        case 'registration':
          return plugin.renderRegistration?.(data, config) ?? null;
        default:
          return <div>Unknown component type: {componentType}</div>;
      }
    } catch (renderError) {
      console.error(`Error rendering ${componentType} component:`, renderError);
      return (
        <div className="plugin-render-error">
          <p>Error rendering component</p>
        </div>
      );
    }
  }, [plugin, isLoading, error, pluginType, componentType]);

  return {
    renderComponent,
    plugin,
    isLoading,
    error,
    isReady: !!plugin && !isLoading && !error,
  };
}

// ======================================
// PLUGIN LIFECYCLE HOOK
// ======================================

/**
 * Hook for plugin lifecycle events
 * @param pluginType Plugin type to handle lifecycle for
 */
export function usePluginLifecycle(pluginType: string) {
  const { plugin } = usePlugin(pluginType);

  const handleEventCreate = useCallback(async (data: any) => {
    if (plugin?.onEventCreate) {
      await plugin.onEventCreate(data);
    }
  }, [plugin]);

  const handleEventUpdate = useCallback(async (data: any) => {
    if (plugin?.onEventUpdate) {
      await plugin.onEventUpdate(data);
    }
  }, [plugin]);

  const handleEventDelete = useCallback(async (eventId: string) => {
    if (plugin?.onEventDelete) {
      await plugin.onEventDelete(eventId);
    }
  }, [plugin]);

  return {
    handleEventCreate,
    handleEventUpdate,
    handleEventDelete,
    hasLifecycleHooks: !!(plugin?.onEventCreate || plugin?.onEventUpdate || plugin?.onEventDelete),
  };
}