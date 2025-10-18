import { config } from 'dotenv';
import { spawn } from 'child_process';

// Load environment variables from .env.cloud
config({ path: '.env.cloud' });

// Get command line arguments (excluding node and script path)
const args = process.argv.slice(2);

// Start astro dev with any additional arguments
const child = spawn('npx', ['astro', 'dev', ...args], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start astro dev:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
