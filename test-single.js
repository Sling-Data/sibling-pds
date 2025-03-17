// Script to run a single test file with increased memory limits
const { execSync } = require('child_process');
const path = require('path');

// Get the test file name from the command line arguments
const testFile = process.argv[2];

if (!testFile) {
  console.error('Please provide a test file name pattern');
  console.error('Example: node test-single.js useApi');
  process.exit(1);
}

try {
  // Set higher memory limit and run the test with jsdom environment
  console.log(`Running tests matching: ${testFile}`);
  execSync(`set NODE_OPTIONS=--max_old_space_size=8192 && npx jest --env=jsdom --testTimeout=30000 --detectOpenHandles --forceExit ${testFile}`, 
    { 
      stdio: 'inherit',
      cwd: path.join(__dirname, 'src/frontend')
    }
  );
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
} 