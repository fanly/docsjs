/**
 * Test Suite Runner
 * 
 * Aggregates and executes all quality verification tests to ensure
 * the new Core Engine v2 meets all architectural requirements.
 */

import { execSync } from 'child_process';
import { exit } from 'process';

function runTestSuite(): void {
  console.log('🧪 Running comprehensive test suite for Core Engine v2...\n');
  
  const testResults: { suite: string; passed: number; failed: number; skipped: number }[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  
  try {
    // Engine core tests
    console.log('🔍 Running Engine Core tests...');
    const engineCoreResult = execSync('npx vitest run tests/engine/', { encoding: 'utf8' });
    const engineCorePassed = (engineCoreResult.match(/(\d+) passed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    const engineCoreFailed = (engineCoreResult.match(/(\d+) failed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    testResults.push({ suite: 'Engine Core', passed: engineCorePassed, failed: engineCoreFailed, skipped: 0 });
    totalPassed += engineCorePassed;
    totalFailed += engineCoreFailed;
    console.log(`✅ Engine Core: ${engineCorePassed} passed, ${engineCoreFailed} failed\n`);

    // Pipeline system tests
    console.log('🔍 Running Pipeline System tests...');
    const pipelineResult = execSync('npx vitest run tests/pipeline/', { encoding: 'utf8' });
    const pipelinePassed = (pipelineResult.match(/(\d+) passed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    const pipelineFailed = (pipelineResult.match(/(\d+) failed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    testResults.push({ suite: 'Pipeline System', passed: pipelinePassed, failed: pipelineFailed, skipped: 0 });
    totalPassed += pipelinePassed;
    totalFailed += pipelineFailed;
    console.log(`✅ Pipeline System: ${pipelinePassed} passed, ${pipelineFailed} failed\n`);

    // Plugin system tests
    console.log('🔍 Running Plugin System tests...');
    const pluginResult = execSync('npx vitest run tests/plugins-v2/', { encoding: 'utf8' });
    const pluginPassed = (pluginResult.match(/(\d+) passed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    const pluginFailed = (pluginResult.match(/(\d+) failed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    testResults.push({ suite: 'Plugin System', passed: pluginPassed, failed: pluginFailed, skipped: 0 });
    totalPassed += pluginPassed;
    totalFailed += pluginFailed;
    console.log(`✅ Plugin System: ${pluginPassed} passed, ${pluginFailed} failed\n`);

    // Profile system tests
    console.log('🔍 Running Profile System tests...');
    const profileResult = execSync('npx vitest run tests/profiles/', { encoding: 'utf8' });
    const profilePassed = (profileResult.match(/(\d+) passed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    const profileFailed = (profileResult.match(/(\d+) failed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    testResults.push({ suite: 'Profile System', passed: profilePassed, failed: profileFailed, skipped: 0 });
    totalPassed += profilePassed;
    totalFailed += profileFailed;
    console.log(`✅ Profile System: ${profilePassed} passed, ${profileFailed} failed\n`);

    // Architecture quality tests
    console.log('🔍 Running Architecture Quality tests...');
    const qualityResult = execSync('npx vitest run tests/quality/', { encoding: 'utf8' });
    const qualityPassed = (qualityResult.match(/(\d+) passed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    const qualityFailed = (qualityResult.match(/(\d+) failed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    testResults.push({ suite: 'Architecture Quality', passed: qualityPassed, failed: qualityFailed, skipped: 0 });
    totalPassed += qualityPassed;
    totalFailed += qualityFailed;
    console.log(`✅ Architecture Quality: ${qualityPassed} passed, ${qualityFailed} failed\n`);

    // Full integration tests
    console.log('🔍 Running Integration tests...');
    const integrationResult = execSync('npx vitest run tests/engine/integration.test.ts tests/engine/e2e.test.ts', { encoding: 'utf8' });
    const integrationPassed = (integrationResult.match(/(\d+) passed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    const integrationFailed = (integrationResult.match(/(\d+) failed/g) || []).map(s => parseInt(s.match(/\d+/)![0])).reduce((a, b) => a + b, 0);
    testResults.push({ suite: 'Integration', passed: integrationPassed, failed: integrationFailed, skipped: 0 });
    totalPassed += integrationPassed;
    totalFailed += integrationFailed;
    console.log(`✅ Integration: ${integrationPassed} passed, ${integrationFailed} failed\n`);

  } catch (error: any) {
    console.error('🚨 Test execution failed:');
    console.error(error.stdout || error.stderr || error.message);
    console.log(`\n❌ Total Failures: ${totalFailed}`);
    exit(1);
  }

  // Print summary
  console.log('📊 Test Suite Summary:');
  console.log('=====================');
  testResults.forEach(result => {
    const status = result.failed === 0 ? '✓' : '✗';
    console.log(`${status} ${result.suite}: ${result.passed} passed, ${result.failed} failed`);
  });
  
  console.log('\n🏁 Overall Results:');
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📈 Total Tests: ${totalPassed + totalFailed}`);

  if (totalFailed > 0) {
    console.log('\n❌ Some tests failed. Please fix before merging.');
    exit(1);
  } else {
    console.log('\n🎉 All tests passed! Core Engine v2 is ready for production!');
    console.log('✨ The strategic architecture transformation is now complete and validated.');
  }
}

// Run the test suite
if (require.main === module) {
  runTestSuite();
}