#!/usr/bin/env node
/**
 * Comprehensive Test Runner
 * Executes all test suites and generates a detailed report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${COLORS.cyan}[INFO]${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}[PASS]${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}[FAIL]${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}[WARN]${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.magenta}=== ${msg} ===${COLORS.reset}\n`)
};

const results = {
  unit: { passed: 0, failed: 0, errors: [] },
  integration: { passed: 0, failed: 0, errors: [] },
  blackbox: { passed: 0, failed: 0, errors: [] },
  whitebox: { passed: 0, failed: 0, errors: [] },
  e2e: { passed: 0, failed: 0, errors: [] }
};

function runJestTests(pattern, suiteName) {
  log.section(`Running ${suiteName} Tests`);
  
  try {
    const output = execSync(
      `npx jest ${pattern} --colors --verbose 2>&1`,
      { 
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 120000
      }
    );
    
    // Parse results
    const passMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    const failMatch = output.match(/Tests:\s+\d+\s+passed.*?(\d+)\s+failed/);
    
    results[suiteName].passed = passMatch ? parseInt(passMatch[1]) : 0;
    results[suiteName].failed = failMatch ? parseInt(failMatch[1]) : 0;
    
    console.log(output);
    log.success(`${suiteName} tests completed`);
    return true;
  } catch (error) {
    results[suiteName].failed++;
    results[suiteName].errors.push(error.message);
    log.error(`${suiteName} tests failed`);
    console.log(error.stdout || error.message);
    return false;
  }
}

function runESLint() {
  log.section('Running ESLint (Code Quality)');
  
  try {
    const output = execSync(
      'npm run lint 2>&1',
      { cwd: __dirname, encoding: 'utf8' }
    );
    log.success('ESLint passed - no issues found');
    return { errors: 0, warnings: 0 };
  } catch (error) {
    const output = error.stdout || error.message;
    const errorMatch = output.match/(\d+)\s+error/);
    const warningMatch = output.match(/(\d+)\s+warning/);
    
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
    
    if (errors > 0) {
      log.error(`ESLint found ${errors} errors and ${warnings} warnings`);
    } else if (warnings > 0) {
      log.warn(`ESLint found ${warnings} warnings`);
    }
    
    console.log(output);
    return { errors, warnings };
  }
}

function analyzeCodeCoverage() {
  log.section('Analyzing Code Coverage');
  
  try {
    execSync(
      'npx jest --coverage --coverageReporters=text-summary 2>&1',
      { cwd: __dirname, encoding: 'utf8', timeout: 120000 }
    );
    
    const coveragePath = path.join(__dirname, 'coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;
      
      log.info('Coverage Report:');
      log.info(`  Statements: ${total.statements.pct}%`);
      log.info(`  Branches: ${total.branches.pct}%`);
      log.info(`  Functions: ${total.functions.pct}%`);
      log.info(`  Lines: ${total.lines.pct}%`);
      
      return total;
    }
  } catch (error) {
    log.warn('Could not generate coverage report');
  }
  
  return null;
}

function checkForKnownIssues() {
  log.section('Checking for Known Issues');
  
  const issues = [];
  
  // Check for console.log statements in production code
  const sharedDir = path.join(__dirname, '../shared');
  const pagesDir = path.join(__dirname, '../pages');
  
  function checkDirectory(dir, label) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        
        // Check for console.log (should use console.error/warn for errors)
        const consoleLogs = content.match(/console\.log/g);
        if (consoleLogs && consoleLogs.length > 5) {
          issues.push({
            type: 'warning',
            file: `${label}/${file}`,
            message: `Found ${consoleLogs.length} console.log statements. Consider using a logging utility.`
          });
        }
        
        // Check for TODO/FIXME comments
        const todos = content.match(/TODO|FIXME/g);
        if (todos) {
          issues.push({
            type: 'info',
            file: `${label}/${file}`,
            message: `Found ${todos.length} TODO/FIXME comments`
          });
        }
        
        // Check for potential memory leaks
        if (content.includes('setInterval') && !content.includes('clearInterval')) {
          issues.push({
            type: 'error',
            file: `${label}/${file}`,
            message: 'setInterval without clearInterval - potential memory leak'
          });
        }
        
        // Check for event listeners without removal
        if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
          issues.push({
            type: 'warning',
            file: `${label}/${file}`,
            message: 'addEventListener without removeEventListener - potential memory leak'
          });
        }
      }
    });
  }
  
  checkDirectory(sharedDir, 'shared');
  checkDirectory(pagesDir, 'pages');
  
  // Report issues
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');
  
  errors.forEach(i => log.error(`${i.file}: ${i.message}`));
  warnings.forEach(i => log.warn(`${i.file}: ${i.message}`));
  infos.forEach(i => log.info(`${i.file}: ${i.message}`));
  
  if (issues.length === 0) {
    log.success('No known issues found');
  }
  
  return { errors: errors.length, warnings: warnings.length, infos: infos.length };
}

function generateReport() {
  log.section('Test Report Summary');
  
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
  
  console.log('┌─────────────────────────────────────────┐');
  console.log('│           TEST RESULTS                  │');
  console.log('├─────────────────────────────────────────┤');
  
  Object.entries(results).forEach(([suite, data]) => {
    const status = data.failed === 0 ? COLORS.green + '✓' : COLORS.red + '✗';
    console.log(`│ ${suite.padEnd(15)} │ ${status}${COLORS.reset} ${data.passed} passed, ${data.failed} failed │`);
  });
  
  console.log('├─────────────────────────────────────────┤');
  console.log(`│ ${'TOTAL'.padEnd(15)} │ ${totalPassed} passed, ${totalFailed} failed │`);
  console.log('└─────────────────────────────────────────┘');
  
  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalPassed,
      totalFailed,
      successRate: totalPassed + totalFailed > 0 
        ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2) + '%'
        : '0%'
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  log.info('Report saved to test-report.json');
  
  return totalFailed === 0;
}

// Main execution
async function main() {
  console.log(`${COLORS.cyan}
╔══════════════════════════════════════════════════════════╗
║        EVER WORK - COMPREHENSIVE TEST SUITE              ║
╚══════════════════════════════════════════════════════════╝
${COLORS.reset}`);
  
  // Run all test suites
  runJestTests('unit/', 'unit');
  runJestTests('integration/', 'integration');
  runJestTests('blackbox/', 'blackbox');
  runJestTests('whitebox/', 'whitebox');
  
  // Code quality checks
  const lintResults = runESLint();
  const coverage = analyzeCodeCoverage();
  const issues = checkForKnownIssues();
  
  // Generate final report
  const success = generateReport();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  log.error(`Test runner failed: ${error.message}`);
  process.exit(1);
});
