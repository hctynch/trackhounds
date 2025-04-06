import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kill any running electron processes
try {
  console.log('Attempting to kill any running Electron processes...');
  
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM electron.exe /T', { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    execSync('pkill -9 Electron || true', { stdio: 'ignore' });
  } else {
    execSync('killall electron || true', { stdio: 'ignore' });
  }
} catch (e) {
  // It's okay if this fails - might mean no processes were running
  console.log('No Electron processes found to kill.');
}

// Clean up release directory
const releasePath = path.join(__dirname, 'release');
if (fs.existsSync(releasePath)) {
  console.log('Cleaning up release directory...');
  try {
    fs.rmSync(releasePath, { recursive: true, force: true });
    console.log('Release directory successfully cleaned.');
  } catch (err) {
    console.error('Failed to remove release directory:', err);
  }
}

console.log('Cleanup complete!');
