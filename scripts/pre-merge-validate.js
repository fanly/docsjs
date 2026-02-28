#!/usr/bin/env node

/**
 * Pre-Merge Validation Script
 * 
 * Performs final verification before merging Core Engine v2 into main branch.
 */

import { spawnSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function preMergeValidation() {
  console.log('🧪 Running Pre-Merge Validation Suite...\n');
  
  let validationPassed = true;
  const checks = [];

  // Check 1: Verify all key architecture files exist
  console.log('🔍 Checking architecture component completeness...');
  const requiredFiles = [
    'src/engine/core.ts',
    'src/pipeline/manager.ts', 
    'src/pipeline/types.ts',
    'src/plugins-v2/manager.ts',
    'src/plugins-v2/types.ts', 
    'src/profiles/profile-manager.ts',
    'src/ast/types.ts',
    'src/ast/utils.ts'
  ];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(`  ✅ ${file}`);
    } catch (error) {
      console.error(`  ❌ Missing: ${file}`);
      validationPassed = false;
      checks.push({ check: `File Presence: ${file}`, status: 'FAIL', error });
    }
  }
  
  // Check 2: Verify all tests pass
  console.log('\n🔍 Running test suite...');
  try {
    const testResult = spawnSync('npx', ['vitest', 'run', '--passWithNoTests'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    if (testResult.status === 0) {
      console.log('  ✅ All tests passed');
      checks.push({ check: 'Test Suite', status: 'PASS' });
    } else {
      console.error('  ❌ Tests failed:');
      console.error(testResult.stderr?.toString() || testResult.stdout?.toString());
      validationPassed = false;
      checks.push({ check: 'Test Suite', status: 'FAIL', error: testResult.stderr?.toString() });
    }
  } catch (error) {
    console.error('  ❌ Test execution failed:', error);
    validationPassed = false;
    checks.push({ check: 'Test Execution', status: 'FAIL', error: error.message });
  }

  // Check 3: Verify API compatibility 
  console.log('\n🔍 Checking API compatibility...');
  try {
    // Try to import the main entry points to ensure they still work
    const { 
      parseDocxToHtmlSnapshot, 
      parseDocxToHtmlSnapshotWithReport,
      CoreEngine,
      SYSTEM_PROFILES 
    } = await import('./dist');
    
    // Verify backward compatible functions exist
    if (typeof parseDocxToHtmlSnapshot === 'function') {
      console.log('  ✅ Backward compatible API available');
      checks.push({ check: 'Backward Compatibility', status: 'PASS' });
    } else {
      throw new Error('parseDocxToHtmlSnapshot not a function');
    }
    
    // Verify new engine is available
    if (typeof CoreEngine === 'function') {
      console.log('  ✅ New Core Engine available');
      checks.push({ check: 'Core Engine v2', status: 'PASS' });
    } else {
      throw new Error('CoreEngine not a constructor');
    }
    
    // Verify profiles exist
    if (SYSTEM_PROFILES && Object.keys(SYSTEM_PROFILES).length >= 4) {
      console.log('  ✅ System profiles available');
      checks.push({ check: 'System Profiles', status: 'PASS' });
    } else {
      throw new Error('System profiles invalid');
    }
  } catch (error) {
    console.error('  ❌ API compatibility check failed:', error);
    validationPassed = false;
    checks.push({ check: 'API Compatibility', status: 'FAIL', error: error.message });
  }

  // Check 4: Performance validation (basic smoke test)
  console.log('\n🔍 Running performance smoke test...');
  try {
    const start = performance.now();
    
    // Quick instantiation test
    const TestEngine = await import('./dist').then(m => m.CoreEngine);
    const testEngine = new TestEngine();
    
    const initTime = performance.now() - start;
    
    if (initTime < 200) { // Should be <200ms for basic initialization
      console.log(`  ✅ Engine initialization: ${initTime.toFixed(1)}ms OK`);
      checks.push({ check: 'Engine Init Performance', status: 'PASS', value: `${initTime.toFixed(1)}ms` });
    } else {
      console.log(`  ⚠️  Engine initialization slower than expected: ${initTime.toFixed(1)}ms`);
      checks.push({ check: 'Engine Init Performance', status: 'SLOW', value: `${initTime.toFixed(1)}ms` });
    }
    
    testEngine?.destroy?.();
  } catch (error) {
    console.error('  ❌ Performance test failed:', error);
    validationPassed = false;
    checks.push({ check: 'Performance Smoke Test', status: 'FAIL', error: error.message });
  }
  
  // Check 5: Check build capability
  console.log('\n🔍 Verifying build capability...');
  try {
    const buildResult = spawnSync('npm', ['run', 'build'], {
      stdio: 'pipe',
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });

    if (buildResult.status === 0) {
      console.log('  ✅ Build succeeded');
      checks.push({ check: 'Build Capability', status: 'PASS' });
    } else {
      console.error('  ❌ Build failed:', buildResult.stderr?.toString() || 'Build timeout');
      validationPassed = false;
      checks.push({ check: 'Build Capability', status: 'FAIL', error: buildResult.stderr?.toString() });
    }
  } catch (error) {
    console.error('  ❌ Build execution failed:', error);
    validationPassed = false;
    checks.push({ check: 'Build Execution', status: 'FAIL', error: error.message });
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log('=====================');
  for (const check of checks) {
    const statusSymbol = check.status === 'PASS' ? '✅' : check.status === 'SLOW' ? '⚠️' : '❌';
    console.log(`${statusSymbol} ${check.check}: ${check.status}${check.value ? ` (${check.value})` : ''}`);
  }
  
  console.log(`\n🎯 Overall Status: ${validationPassed ? '✅ ALL CHECKS PASSED' : '❌ VALIDATION FAILED'}`);
  
  if (!validationPassed) {
    console.log('\n💥 CRITICAL: Merge should not proceed until all validations pass');
    process.exit(1);
  }

  console.log('\n🚀 Pre-Merge Validation Complete - Ready for merge!');
  console.log('All platform architecture components verified and passing');
}

// Run validation if this script is executed directly
if (require.main === module) {
  preMergeValidation().catch(error => {
    console.error('Pre-merge validation failed:', error);
    process.exit(1);
  });
}

export { preMergeValidation };