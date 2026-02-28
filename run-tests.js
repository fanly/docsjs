/**
 * Test Execution Script
 *
 * Runs all tests and reports status
 */
import { execSync } from 'child_process';

console.log('🔬 Running DocsJS Core Engine v2 Tests...\n');

try {
  // Run all tests 
  console.log('.UnitTesting components...');
  const unitTestResult = execSync('npx vitest run tests/engine/core.test.ts tests/pipeline/pipeline.test.ts tests/plugins-v2/plugins-v2.test.ts tests/profiles/profiles.test.ts', { encoding: 'utf8' });
  console.log('✅ Unit tests passed\n');

  console.log('🔗 Integration testing...');
  const integrationTestResult = execSync('npx vitest run tests/engine/integration.test.ts', { encoding: 'utf8' });
  console.log('✅ Integration tests passed\n');
  
  console.log('🎯 End-to-end testing...');
  const e2eTestResult = execSync('npx vitest run tests/engine/e2e.test.ts', { encoding: 'utf8' });
  console.log('✅ E2E tests passed\n');

  console.log('🔌 Demo integration testing...');
  const demoTestResult = execSync('npx vitest run tests/engine/demo-integration.test.ts', { encoding: 'utf8' });
  console.log('✅ Demo integration tests passed\n');

  console.log('⚖️  Quality standards testing...');
  const qualityTestResult = execSync('npx vitest run tests/quality/standards.test.ts', { encoding: 'utf8' });
  console.log('✅ Quality tests passed\n');

  console.log('⚡ Performance testing...');
  const perfTestResult = execSync('npx vitest run tests/quality/performance.test.ts', { encoding: 'utf8' });
  console.log('✅ Performance tests passed\n');

  console.log('🔄 Compatibility testing...');
  const compatTestResult = execSync('npx vitest run tests/quality/compatibility.test.ts', { encoding: 'utf8' });
  console.log('✅ Compatibility tests passed\n');

  console.log('🏆 All tests passed! Core Engine v2 is ready.\n');

  // Summary
  console.log('📋 Test Summary:');
  console.log('- Engine core: ✅ Verified');
  console.log('- Pipeline system: ✅ Verified');  
  console.log('- Plugin system v2: ✅ Verified');
  console.log('- Profile management: ✅ Verified');
  console.log('- Integration: ✅ Verified');
  console.log('- Demo compatibility: ✅ Verified');
  console.log('- Quality standards: ✅ Verified');
  console.log('- Performance: ✅ Verified');
  console.log('- Compatibility: ✅ Verified\n');

  console.log('🚀 Core Engine v2 is validated and ready for production!\n');

} catch (error: any) {
  console.error('❌ Test execution failed:');
  console.error(error.stdout || error.stderr || error.message);
  process.exit(1);
}