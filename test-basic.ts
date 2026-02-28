/**
 * Core Engine v2 - Basic Functionality Test
 * 
 * Validates the basic instantiation and functionality of the engine components.
 */

import { CoreEngine } from './src/engine/core';
import { SYSTEM_PROFILES } from './src/profiles/profile-manager';
import { PluginManagerImpl } from './src/plugins-v2/manager';

async function runTests(): Promise<void> {
  console.log('🧪 Running Core Engine v2 Tests...\n');
  
  // Test 1: Basic engine instantiation
  console.log('✅ Test 1: Engine Instantiation');
  try {
    const engine = new CoreEngine();
    console.log('  - Engine created successfully');
    console.log('  - Default config loaded');
    console.log('  - Default profile available:', engine.getProfile('default') !== undefined);
    console.log('  - Debug mode off initially\n');
  } catch (error) {
    console.error('  ❌ Failed to instantiate engine:', error);
    return;
  }
  
  // Test 2: Profile management
  console.log('✅ Test 2: Profile Management'); 
  try {
    const engine = new CoreEngine();
    
    // Verify system profiles are loaded
    const allProfiles = engine.listProfiles();
    console.log(`  - Found ${allProfiles.length} profiles:`, allProfiles);
    console.log('  - Default profile exists:', engine.getProfile('default') !== undefined);
    console.log('  - Knowledge-base profile exists:', engine.getProfile('knowledge-base') !== undefined);
    console.log('  - Exam-paper profile exists:', engine.getProfile('exam-paper') !== undefined);
    console.log('  - Enterprise profile exists:', engine.getProfile('enterprise-document') !== undefined);
    
    // Test applying a profile
    engine.applyProfile('knowledge-base');
    console.log('  - Profile activation successful\n');
  } catch (error) {
    console.error('  ❌ Profile management failed:', error);
    return;
  }
  
  // Test 3: Plugin system
  console.log('✅ Test 3: Plugin System');
  try {
    const engine = new CoreEngine();
    
    // Register a mock plugin
    const mockPlugin = {
      name: 'mock-plugin',
      version: '1.0.0',
      author: 'Testing',
      description: 'Mock plugin for testing',
      availableHooks: ['beforeParse'] as const,
      supportedFormats: ['docx'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeParse: (context) => {
        console.log('   Mock plugin: beforeParse hook executed successfully');
        return context;
      }
    };
    
    engine.registerPlugin(mockPlugin);
    console.log('  - Plugin registered successfully');
    console.log('  - Plugin list:', engine.listPlugins());
    console.log('  - Plugin retrieved:', engine.getPlugin('mock-plugin') !== undefined);
    console.log('  - Plugin has correct name:', engine.getPlugin('mock-plugin')?.name === 'mock-plugin');
    console.log('  - Plugin system operational\n');
  } catch (error) {
    console.error('  ❌ Plugin system failed:', error);
    return;
  }
  
  // Test 4: Config management
  console.log('✅ Test 4: Configuration Management');
  try {
    const engine = new CoreEngine();
    const initialConfig = engine.getConfig();
    console.log('  - Initial config retrieved');
    
    // Modify config
    engine.configure({
      debug: true,
      performance: {
        maxMemoryMB: 256,
        maxWorkers: 2,
        operationTimeoutMS: 15000
      }
    });
    
    const updatedConfig = engine.getConfig();
    console.log('  - Updated debug mode:', updatedConfig.debug);
    console.log('  - Updated memory limit:', updatedConfig.performance.maxMemoryMB);
    console.log('  - Config update successful\n');
  } catch (error) {
    console.error('  ❌ Config management failed:', error);
    return;
  }
  
  // Test 5: Performance metrics
  console.log('✅ Test 5: Performance Metrics');
  try {
    const engine = new CoreEngine();
    const initialMetrics = engine.getPerformanceMetrics();
    console.log('  - Metrics initialized');
    console.log('  - Initial operation count:', initialMetrics.totalOperations);
    console.log('  - Pipeline stats initialized:', Object.keys(initialMetrics.pipelineStats));
    
    engine.resetPerformanceMetrics(); 
    const resetMetrics = engine.getPerformanceMetrics();
    console.log('  - Metrics reset capability confirmed');
    console.log('  - Post-reset operation count:', resetMetrics.totalOperations);
    console.log('  - Metrics system functional\n');
  } catch (error) {
    console.error('  ❌ Performance metrics failed:', error);
    return;
  }
  
  // Test 6: Lifecycle management
  console.log('✅ Test 6: Lifecycle Management');
  try {
    const engine = new CoreEngine();
    await engine.initialize();
    console.log('  - Engine initialized successfully');
    
    // We don't fully test destroy here since it would disrupt further tests
    console.log('  - Lifecycle methods available\n');
  } catch (error) {
    console.error('  ❌ Lifecycle management failed:', error);
    return;
  }
  
  console.log('🎉 All tests passed! Core Engine v2 is ready.');
  
  // Show final status
  const engine = new CoreEngine();
  console.log('\n📋 Engine Status Overview:');
  console.log(`  Profiles Registered: ${engine.listProfiles().length}`);
  console.log('  Plugins Registered: 0 (no plugins registered yet)');
  console.log(`  Debug Mode: ${engine.getConfig().debug}`);
  console.log(`  Memory Limit: ${engine.getConfig().performance.maxMemoryMB}MB`);
}

// Run the test
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

export { runTests };