import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to retry file operations with delay
async function retryOperation(operation, maxRetries = 5, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await operation();
      console.log(`Operation succeeded on attempt ${attempt}`);
      return;
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Kill Electron processes on Windows
async function killElectronProcesses() {
  console.log('Killing Electron processes...');
  
  try {
    if (process.platform === 'win32') {
      // Kill electron processes
      execSync('taskkill /F /IM electron.exe /T', { stdio: 'inherit' });
      // Also try to kill the app by name if it's running
      execSync('taskkill /F /IM TrackHounds.exe /T', { stdio: 'ignore' });
    } else {
      execSync('killall electron || true', { stdio: 'inherit' });
    }
    console.log('Electron processes terminated successfully');
  } catch (error) {
    // It's okay if this fails - might mean no processes were running
    console.log('No active Electron processes found or unable to terminate');
  }
}

// Clean up the release directory
async function cleanupRelease() {
  const releasePath = path.join(__dirname, 'release');
  const asarPath = path.join(releasePath, 'win-unpacked', 'resources', 'app.asar');
  
  if (fs.existsSync(asarPath)) {
    console.log(`Found app.asar at ${asarPath}, attempting to remove...`);
    
    await retryOperation(async () => {
      return new Promise((resolve, reject) => {
        try {
          fs.unlinkSync(asarPath);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }
  
  console.log('Cleanup successful!');
}

// Clean up release directory before building
const releaseDir = path.join(__dirname, 'release');

if (fs.existsSync(releaseDir)) {
  console.log('Cleaning up release directory...');
  
  try {
    const files = fs.readdirSync(releaseDir);
    for (const file of files) {
      const filePath = path.join(releaseDir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        // Clean up asars and build artifacts in subdirectories
        const subDirFiles = fs.readdirSync(filePath);
        for (const subFile of subDirFiles) {
          if (subFile.endsWith('.asar')) {
            fs.unlinkSync(path.join(filePath, subFile));
            console.log(`Deleted: ${path.join(filePath, subFile)}`);
          }
        }
      }
    }
    console.log('Release directory cleaned successfully.');
  } catch (err) {
    console.error('Error cleaning release directory:', err);
  }
}

// Main cleanup function
async function cleanup() {
  try {
    // First kill any processes that might be holding the file
    await killElectronProcesses();
    
    // Wait a bit to ensure processes are fully terminated
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Then clean up the release directory
    await cleanupRelease();
    
    console.log('All cleanup tasks completed successfully!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanup();
