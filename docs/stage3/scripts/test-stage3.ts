/**
 * Stage 3 Test Script - Resume Management
 *
 * This script tests the Stage 3 API endpoints:
 * 1. Quota check endpoint
 * 2. Resume upload with quota enforcement
 * 3. Resume analysis endpoint
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Valid authentication (run through browser first to get session)
 *
 * Usage:
 * npx ts-node scripts/test-stage3.ts
 *
 * Or run individual tests via the dev server UI
 */

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logResult(testName: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${testName}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test results tracker
const results: { name: string; passed: boolean; error?: string }[] = [];

/**
 * Test 1: Check Quota Endpoint (requires auth)
 * This test will fail without authentication - that's expected
 */
async function testQuotaCheck() {
  logSection('Test 1: Quota Check Endpoint');

  try {
    const response = await fetch(`${BASE_URL}/api/quota/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      logResult('Quota check requires auth', true, 'Returns 401 for unauthenticated requests');
      results.push({ name: 'Quota check auth protection', passed: true });
    } else if (response.ok) {
      logResult('Quota check endpoint', true, `Remaining: ${data.remaining}/${data.limit}`);
      results.push({ name: 'Quota check endpoint', passed: true });
    } else {
      logResult('Quota check endpoint', false, `Status: ${response.status}, Error: ${data.error}`);
      results.push({ name: 'Quota check endpoint', passed: false, error: data.error });
    }
  } catch (error) {
    logResult('Quota check endpoint', false, `Error: ${error}`);
    results.push({ name: 'Quota check endpoint', passed: false, error: String(error) });
  }
}

/**
 * Test 2: Resume Analysis Endpoint (requires auth + resume_id)
 */
async function testResumeAnalysis() {
  logSection('Test 2: Resume Analysis Endpoint');

  // Test without auth
  try {
    const response = await fetch(`${BASE_URL}/api/resume/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resume_id: 'test-id' }),
    });

    const data = await response.json();

    if (response.status === 401) {
      logResult('Analysis requires auth', true, 'Returns 401 for unauthenticated requests');
      results.push({ name: 'Analysis auth protection', passed: true });
    } else {
      logResult('Analysis auth protection', false, `Unexpected status: ${response.status}`);
      results.push({ name: 'Analysis auth protection', passed: false });
    }
  } catch (error) {
    logResult('Analysis endpoint reachable', false, `Error: ${error}`);
    results.push({ name: 'Analysis endpoint reachable', passed: false, error: String(error) });
  }

  // Test with missing resume_id (simulating bad request)
  try {
    const response = await fetch(`${BASE_URL}/api/resume/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    // Should get 401 (auth) before 400 (bad request)
    if (response.status === 401) {
      logResult('Analysis validates auth first', true, 'Auth checked before body validation');
      results.push({ name: 'Analysis validates auth first', passed: true });
    }
  } catch (error) {
    // Expected if server not running
  }
}

/**
 * Test 3: Resume Upload Endpoint (requires auth + file)
 */
async function testResumeUpload() {
  logSection('Test 3: Resume Upload Endpoint');

  try {
    const response = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      // No file attached
    });

    const data = await response.json();

    if (response.status === 401) {
      logResult('Upload requires auth', true, 'Returns 401 for unauthenticated requests');
      results.push({ name: 'Upload auth protection', passed: true });
    } else if (response.status === 400 && data.error?.includes('file')) {
      logResult('Upload validates file', true, 'Returns 400 when no file provided');
      results.push({ name: 'Upload file validation', passed: true });
    } else {
      logResult('Upload endpoint', false, `Status: ${response.status}, Error: ${data.error}`);
      results.push({ name: 'Upload endpoint', passed: false });
    }
  } catch (error) {
    logResult('Upload endpoint reachable', false, `Error: ${error}`);
    results.push({ name: 'Upload endpoint reachable', passed: false, error: String(error) });
  }
}

/**
 * Test 4: Quota Increment Endpoint (internal, requires auth)
 */
async function testQuotaIncrement() {
  logSection('Test 4: Quota Increment Endpoint');

  try {
    const response = await fetch(`${BASE_URL}/api/quota/increment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      logResult('Quota increment requires auth', true, 'Returns 401 for unauthenticated requests');
      results.push({ name: 'Quota increment auth protection', passed: true });
    } else {
      logResult('Quota increment endpoint', response.ok, `Status: ${response.status}`);
      results.push({ name: 'Quota increment endpoint', passed: response.ok });
    }
  } catch (error) {
    logResult('Quota increment endpoint', false, `Error: ${error}`);
    results.push({ name: 'Quota increment endpoint', passed: false, error: String(error) });
  }
}

/**
 * Print summary of all tests
 */
function printSummary() {
  logSection('TEST SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal: ${results.length} tests`);
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      log(`  - ${r.name}: ${r.error || 'Unknown error'}`, 'red');
    });
  }

  console.log('\n' + '-'.repeat(60));
  log('NOTE: Most tests expect 401 (Unauthorized) since they run', 'yellow');
  log('without authentication. This is the EXPECTED behavior.', 'yellow');
  log('', 'yellow');
  log('For full testing with authentication:', 'yellow');
  log('1. Start dev server: npm run dev', 'yellow');
  log('2. Sign in through the browser', 'yellow');
  log('3. Test endpoints through the onboarding flow', 'yellow');
  console.log('-'.repeat(60) + '\n');
}

/**
 * Check if server is running
 */
async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL);
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n');
  log('🧪 STAGE 3 API ENDPOINT TESTS', 'blue');
  log('Testing Resume Management endpoints', 'blue');

  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    log('\n⚠️  Dev server not running!', 'yellow');
    log('Please start the server first: npm run dev', 'yellow');
    log('Then run this test script again.\n', 'yellow');
    process.exit(1);
  }

  log('\n✓ Server is running at ' + BASE_URL, 'green');

  // Run all tests
  await testQuotaCheck();
  await testResumeAnalysis();
  await testResumeUpload();
  await testQuotaIncrement();

  // Print summary
  printSummary();
}

// Run tests
runTests().catch(console.error);
