import axios from 'axios';
import { app, dialog, ipcMain } from 'electron';
import electronUpdater from 'electron-updater';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

// Get autoUpdater from electron-updater package
const { autoUpdater } = electronUpdater;

// Configure logging
import log from 'electron-log';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const streamPipeline = promisify(pipeline);

// Track update status
let updateStatus = {
  checking: false,
  available: false,
  downloaded: false,
  error: null,
  version: null,
  offlineMode: false,
  lastCheck: null
};

// Offline mode detection
let isOffline = false;
let updateCheckTimeoutId = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [60000, 300000, 1800000]; // 1min, 5min, 30min

export function initAutoUpdater(mainWindow) {
  // Configure update behavior
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Check for updates after a short delay (to let app finish startup)
  setTimeout(() => {
    console.log('Checking for updates...');
    checkInternetConnection()
      .then(online => {
        if (online) {
          autoUpdater.checkForUpdates();
        } else {
          console.log('No internet connection, skipping update check');
          updateStatus.offlineMode = true;
          mainWindow.webContents.send('update-status', updateStatus);
        }
      });
  }, 10000); // 10 seconds after startup
  
  // Set up event handlers
  autoUpdater.on('checking-for-update', () => {
    updateStatus.checking = true;
    mainWindow.webContents.send('update-status', updateStatus);
  });
  
  autoUpdater.on('update-available', (info) => {
    updateStatus.checking = false;
    updateStatus.available = true;
    updateStatus.version = info.version;
    mainWindow.webContents.send('update-status', updateStatus);
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available and will be downloaded automatically.`,
      buttons: ['OK']
    });
  });
  
  autoUpdater.on('update-not-available', () => {
    updateStatus.checking = false;
    updateStatus.available = false;
    mainWindow.webContents.send('update-status', updateStatus);
  });
  
  autoUpdater.on('error', (err) => {
    updateStatus.checking = false;
    updateStatus.error = err.message;
    mainWindow.webContents.send('update-status', updateStatus);
    
    // Check if error is due to network issues
    if (err.message.includes('net::') || err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
      console.log('Network error during update check, assuming offline mode');
      updateStatus.offlineMode = true;
      mainWindow.webContents.send('update-status', updateStatus);
      
      // Schedule retry with backoff
      scheduleUpdateRetry(mainWindow);
    }
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-progress', progressObj);
  });
  
  autoUpdater.on('update-downloaded', () => {
    updateStatus.downloaded = true;
    mainWindow.webContents.send('update-status', updateStatus);
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update has been downloaded. It will be installed on restart. Would you like to restart now?',
      buttons: ['Restart', 'Later']
    }).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
  
  // Listen for update check requests from renderer
  ipcMain.on('check-for-updates', (event, force) => {
    // Clear any scheduled checks
    if (updateCheckTimeoutId) {
      clearTimeout(updateCheckTimeoutId);
      updateCheckTimeoutId = null;
    }
    
    // Reset retry count if this is a manual check
    if (force) {
      retryCount = 0;
    }
    
    checkInternetConnection()
      .then(online => {
        if (online) {
          updateStatus.offlineMode = false;
          autoUpdater.checkForUpdates();
        } else {
          console.log('No internet connection, skipping update check');
          updateStatus.offlineMode = true;
          updateStatus.checking = false;
          event.reply('update-status', updateStatus);
          
          // Only schedule if this was an automatic check
          if (!force) {
            scheduleUpdateRetry(mainWindow);
          }
        }
      });
  });
  
  // Schedule periodic update checks (e.g., once per day) but only if we have internet
  scheduleUpdateCheck(mainWindow);
}

// Add a function to check for updates
export function checkForUpdates(manual = false) {
  if (manual) {
    retryCount = 0; // Reset retry count for manual checks
  }
  
  checkInternetConnection()
    .then(online => {
      if (online) {
        updateStatus.offlineMode = false;
        autoUpdater.checkForUpdates();
      } else {
        console.log('No internet connection, skipping update check');
        updateStatus.offlineMode = true;
        if (mainWindow) {
          mainWindow.webContents.send('update-status', updateStatus);
        }
      }
    });
}

// Simple internet connection check
async function checkInternetConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await axios.get('https://api.github.com', { 
      timeout: 5000,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    isOffline = false;
    return true;
  } catch (error) {
    isOffline = true;
    return false;
  }
}

// Schedule update checks with exponential backoff
function scheduleUpdateRetry(mainWindow) {
  if (retryCount >= MAX_RETRIES) {
    console.log('Max retries reached, stopping automatic update checks');
    return;
  }
  
  const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  console.log(`Scheduling update retry in ${delay/1000} seconds`);
  
  if (updateCheckTimeoutId) {
    clearTimeout(updateCheckTimeoutId);
  }
  
  updateCheckTimeoutId = setTimeout(() => {
    updateCheckTimeoutId = null;
    retryCount++;
    
    checkInternetConnection()
      .then(online => {
        if (online) {
          console.log('Internet connection restored, checking for updates');
          updateStatus.offlineMode = false;
          autoUpdater.checkForUpdates();
        } else {
          console.log('Still offline, continuing in offline mode');
          scheduleUpdateRetry(mainWindow);
        }
      });
  }, delay);
}

// Schedule daily update check
function scheduleUpdateCheck(mainWindow) {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  setInterval(() => {
    // Only check if we haven't checked recently
    const lastCheck = updateStatus.lastCheck || 0;
    const now = Date.now();
    
    if (now - lastCheck > TWENTY_FOUR_HOURS) {
      checkInternetConnection()
        .then(online => {
          if (online) {
            console.log('Performing scheduled update check');
            updateStatus.lastCheck = now;
            autoUpdater.checkForUpdates();
          }
        });
    }
  }, 3600000); // Check every hour if we should do a daily check
}

// Enhanced backend update function that downloads from GitHub releases
export async function updateBackendImages(mainWindow) {
  try {
    const online = await checkInternetConnection();
    if (!online) {
      return { success: false, reason: 'No internet connection available' };
    }
    
    // Get app version to determine which release to download from
    const currentVersion = app.getVersion();
    
    // GitHub repo details
    const owner = 'your-github-username';
    const repo = 'trackhounds';
    
    // Get the latest release info
    const releaseResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      { timeout: 10000 }
    );
    
    const latestRelease = releaseResponse.data;
    const latestVersion = latestRelease.tag_name.replace('v', '');
    
    // Check if update is needed
    if (currentVersion === latestVersion) {
      console.log(`Already on latest version ${latestVersion}`);
      return { success: false, reason: 'Already on latest version' };
    }
    
    console.log(`Updating backend from ${currentVersion} to ${latestVersion}`);
    
    // Get the Docker tarball assets
    const backendTarAsset = latestRelease.assets.find(asset => 
      asset.name === 'backend.tar' || asset.name.includes('backend')
    );
    
    const mariadbTarAsset = latestRelease.assets.find(asset => 
      asset.name === 'mariadb.tar' || asset.name.includes('mariadb')
    );
    
    if (!backendTarAsset || !mariadbTarAsset) {
      return { 
        success: false, 
        reason: 'Required Docker image tarballs not found in release' 
      };
    }
    
    // Get resource paths
    const resourcesPath = process.env.NODE_ENV === 'development'
      ? path.join(process.cwd(), 'docker-resources')
      : path.join(process.resourcesPath, 'docker-resources');
    
    const backendTarPath = path.join(resourcesPath, 'backend.tar');
    const mariadbTarPath = path.join(resourcesPath, 'mariadb.tar');
    
    // Ensure docker-resources directory exists
    if (!fs.existsSync(resourcesPath)) {
      fs.mkdirSync(resourcesPath, { recursive: true });
    }
    
    // Download the tarball files
    mainWindow.webContents.send('backend-update-progress', { 
      state: 'downloading',
      progress: 0
    });
    
    await downloadFile(backendTarAsset.browser_download_url, backendTarPath, progress => {
      mainWindow.webContents.send('backend-update-progress', { 
        state: 'downloading-backend',
        progress
      });
    });
    
    await downloadFile(mariadbTarAsset.browser_download_url, mariadbTarPath, progress => {
      mainWindow.webContents.send('backend-update-progress', { 
        state: 'downloading-mariadb',
        progress
      });
    });
    
    mainWindow.webContents.send('backend-update-progress', { 
      state: 'complete',
      progress: 100
    });
    
    return { 
      success: true, 
      version: latestVersion,
      backendTarPath,
      mariadbTarPath
    };
  } catch (error) {
    console.error('Error updating backend:', error);
    return { success: false, reason: error.message };
  }
}

// Helper function to download a file with progress tracking
async function downloadFile(url, outputPath, progressCallback) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 30000
  });
  
  const totalLength = parseInt(response.headers['content-length'], 10);
  let downloadedLength = 0;
  
  response.data.on('data', (chunk) => {
    downloadedLength += chunk.length;
    const progress = Math.round((downloadedLength / totalLength) * 100);
    progressCallback(progress);
  });
  
  await streamPipeline(response.data, fs.createWriteStream(outputPath));
}
