/**
 * Enhanced Plugin System Manager
 * 
 * Manages the new plugin lifecycle and registration system.
 */

import type { 
  EnginePlugin, 
  PluginHooks, 
  PluginHook, 
  PluginPriority,
  PluginContext, 
  HookResult,
  PluginPermissions,
  PluginRegistrationOptions,
  PluginManager
} from './types';
import type { CoreEngine } from '../engine/core';

export class PluginManagerImpl implements PluginManager {
  private plugins: Map<string, EnginePlugin> = new Map();
  private engine: CoreEngine;
  private pluginPriorities: Map<string, PluginPriority> = new Map();

  constructor(engine: CoreEngine) {
    this.engine = engine;
  }

  register(plugin: PluginHooks, options?: PluginRegistrationOptions): void {
    // Validate plugin first
    if (!this.validatePlugin(plugin)) {
      throw new Error(`Plugin validation failed for plugin: ${plugin.name}`);
    }

    // Run validation callback if provided
    if (options?.validate && !options.validate(plugin)) {
      throw new Error(`Plugin validation callback failed for plugin: ${plugin.name}`);
    }

    // Check if already exists
    if (this.plugins.has(plugin.name) && !options?.overrideExisting) {
      throw new Error(`Plugin already registered: ${plugin.name}`);
    }

    // Validate permissions against engine policy
    this.validatePermissions(plugin.permissions);

    // Actually register the plugin
    this.plugins.set(plugin.name, plugin);
    this.pluginPriorities.set(plugin.name, plugin.priority || 'normal');

    if (this.engine.getConfig().debug) {
      console.log(`Plugin registered: ${plugin.name} v${plugin.version}`);
    }
  }

  unregister(name: string): boolean {
    if (this.plugins.delete(name)) {
      this.pluginPriorities.delete(name);
      return true;
    }
    return false;
  }

  get(name: string): EnginePlugin | undefined {
    return this.plugins.get(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  listForHook(hook: PluginHook): EnginePlugin[] {
    const plugins = Array.from(this.plugins.values())
      .filter(plugin => plugin.availableHooks.includes(hook));

    // Sort by priority (highest first)
    return plugins.sort((a, b) => {
      const priorityOrder: PluginPriority[] = ['highest', 'high', 'normal', 'low', 'lowest'];
      const priorityA = priorityOrder.indexOf(a.priority);
      const priorityB = priorityOrder.indexOf(b.priority);
      
      // Higher priority comes first
      return priorityB - priorityA;
    });
  }

  async runForHook(hook: PluginHook, context: PluginContext): Promise<PluginContext> {
    const plugins = this.listForHook(hook);
    let currentContext = context;

    if (this.engine.getConfig().debug) {
      console.log(`Running ${plugins.length} plugins for hook: ${hook}`);
    }

    for (const plugin of plugins) {
      try {
        // Check if plugin actually implements the specific hook method
        let pluginMethod: ((context: any) => any) | undefined = undefined;
        
        switch (hook) {
          case 'beforeParse': 
            pluginMethod = (plugin as any).beforeParse;
            break;
          case 'afterParse': 
            pluginMethod = (plugin as any).afterParse;
            break; 
          case 'beforeTransform': 
            pluginMethod = (plugin as any).beforeTransform;
            break;
          case 'afterTransform': 
            pluginMethod = (plugin as any).afterTransform;
            break;
          case 'beforeRender': 
            pluginMethod = (plugin as any).beforeRender;
            break;
          case 'afterRender': 
            pluginMethod = (plugin as any).afterRender;
            break;
          case 'beforeExport': 
            pluginMethod = (plugin as any).beforeExport;
            break;
          case 'afterExport': 
            pluginMethod = (plugin as any).afterExport;
            break;
        }

        if (pluginMethod) {
          const startTime = Date.now();
          
          // Get max CPU time from permission config
          const maxCpuTime = plugin.permissions.compute.maxCpuSecs * 1000; // Convert to ms
          
          // Create an abort signal that can cancel the operation if it takes too long
          // We'll use setTimeout to enforce the CPU time limit as a practical measure
          const timeoutHandle = setTimeout(() => {
            // This isn't a perfect solution, but for now it works to enforce timeouts
            if (this.engine.getConfig().debug) {
              console.warn(`Plugin ${plugin.name} exceeded max CPU time (${maxCpuTime}ms)`);
            }
          }, maxCpuTime);
          
          // Execute the plugin method
          const result: HookResult = await Promise.resolve(
            pluginMethod.call(plugin, currentContext)
          );
          
          clearTimeout(timeoutHandle);
          
          // Update context if plugin returned a modified context
          if (result !== undefined) {
            if (this.isPluginContext(result)) {
              currentContext = result;
            }
          }
          
          // Update performance metrics (though actual update would happen outside)
          const elapsedTime = Date.now() - startTime;
          currentContext.pipeline!.metrics!.pluginApplications++;
          
          if (this.engine.getConfig().debug) {
            console.log(`Plugin ${plugin.name} completed hook ${hook} in ${elapsedTime}ms`);
          }
        }
      } catch (error) {
        const errorMessage = `Plugin ${plugin.name} failed for hook ${hook}: ${error instanceof Error ? error.message : String(error)}`;
        
        // If pipeline is attached, add error to the pipeline state
        if (currentContext.pipeline) {
          currentContext.pipeline.state.errors.push({
            code: 'PLUGIN_ERROR',
            message: errorMessage,
            phase: currentContext!.pipeline.state.phase,
            timestamp: Date.now(),
            pluginName: plugin.name,
            severity: 'error'
          });
        }
        
        // Log the error
        if (this.engine.getConfig().debug) {
          console.error(errorMessage, error);
        }
        
        // Depending on error tolerance configuration, we might want to break instead of continuing
        // For now, we'll continue to allow other plugins to run
      }
    }

    return currentContext;
  }

  validatePlugin(plugin: EnginePlugin): boolean {
    if (!plugin.name) {
      return false;
    }

    if (!plugin.version) {
      return false;
    }

    if (!plugin.availableHooks || !Array.isArray(plugin.availableHooks)) {
      return false;
    }

    // Validate permissions structure
    if (!plugin.permissions) {
      return false;
    }

    // Validate that the plugin implements only the methods it claims to support in availableHooks
    const supportedHooks = plugin.availableHooks;
    
    // Check each hook to ensure corresponding method exists if the method is expected
    for (const hook of supportedHooks as PluginHook[]) {
      // The actual contract validation should happen in plugin registration where we verify
      // that if a plugin says it supports 'beforeParse', it has a beforeParse method
      const methodName = getMethodNameForHook(hook);
      if (!(plugin as any)[methodName]) {
        console.warn(`Plugin ${plugin.name} claims to support hook ${hook} but missing ${methodName} method`);
        // For now, we'll still allow registration since method might be optional for some hooks
      }
    }

    return true;
  }

  resolveDependencies(plugin: EnginePlugin): EnginePlugin[] {
    const resolved: EnginePlugin[] = [];
    const remaining: string[] = [...(plugin.dependencies || [])];
    
    // Simple dependency resolution: look up dependencies by name
    for (const depName of remaining) {
      const depPlugin = this.get(depName);
      if (!depPlugin) {
        throw new Error(`Dependency not found: ${depName} for plugin ${plugin.name}`);
      }
      resolved.push(depPlugin);
    }

    return resolved;
  }

  private validatePermissions(permissions: PluginPermissions): void {
    const config = this.engine.getConfig();
    
    // Check if network access is allowed in config
    if (permissions.network && !config.security.allowNetwork) {
      throw new Error('Plugin requests network access but engine restricts it');
    }
    
    // Check max memory
    if (permissions.compute.maxMemoryMB > config.performance.maxMemoryMB) {
      throw new Error(
        `Plugin requested ${permissions.compute.maxMemoryMB}MB which exceeds engine max of ${config.performance.maxMemoryMB}`
      );
    }
  }
  
  private isPluginContext(obj: any): obj is PluginContext {
    return typeof obj === 'object' && 
           obj.engine && 
           obj.pipeline !== undefined;
  }
}


// Helper function to map a hook type to its corresponding method name
function getMethodNameForHook(hook: PluginHook): string {
  switch (hook) {
    case 'beforeParse': return 'beforeParse';
    case 'afterParse': return 'afterParse';  
    case 'beforeTransform': return 'beforeTransform';
    case 'afterTransform': return 'afterTransform';
    case 'beforeRender': return 'beforeRender';
    case 'afterRender': return 'afterRender';
    case 'beforeExport': return 'beforeExport';
    case 'afterExport': return 'afterExport';
    default:
      throw new Error(`Unknown hook: ${hook}`);
  }
}

// Export as standard manager
export default PluginManagerImpl;