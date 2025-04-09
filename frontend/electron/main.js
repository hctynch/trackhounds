import { exec, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkForUpdates, initAutoUpdater, updateBackendImages } from './updater.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Determine paths based on whether we're in development or production
const getResourcePath = (relativePath) => {
  return isDev
    ? path.join(process.cwd(), relativePath)
    : path.join(process.resourcesPath, relativePath);
};

// Docker resource paths
const dockerResourcesPath = getResourcePath('docker-resources');
const composeFilePath = path.join(dockerResourcesPath, 'docker-compose.yml');
const backendTarPath = path.join(dockerResourcesPath, 'backend.tar');
const mariadbTarPath = path.join(dockerResourcesPath, 'mariadb.tar');

// Global window reference
let mainWindow;

// Store Docker process and container information
let dockerStatus = {
  checking: false,
  running: false,
  containers: {
    backend: { running: false },
    database: { running: false }
  }
};

const template = [
  {
    label: 'About',
    submenu: [
      {
        label: 'About TrackHounds',
        click: () => {
          const appVersion = app.getVersion();
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About TrackHounds',
            message: 'TrackHounds',
            detail: `Version: ${appVersion}\n\nA modern scoring application designed to provide an alternative to outdated scoring software currently used in Master's Foxhunts.\n\nAuthor: Hunt Tynch\nEmail: tynchhunt@gmail.com\n\nBuilt with: Electron, React, Docker, Spring Boot, and MariaDB`,
            buttons: ['OK'],
            icon: path.join(__dirname, '../public/dog.ico')
          });
        }
      },
      { type: 'separator' },
      {
        label: 'View on GitHub',
        click: () => {
          shell.openExternal('https://github.com/hctynch/trackhounds');
        }
      },
      {
        label: 'Report an Issue',
        click: () => {
          shell.openExternal('https://github.com/hctynch/trackhounds/issues');
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        click: () => {
          if (mainWindow) {
            // Send a message to the renderer process to navigate
            mainWindow.webContents.send('app-navigation', { route: '/docs' });
          }
        }
      }
    ]
  },
  {
    label: 'Update',
    submenu: [
      {
        label: 'Check for Updates',
        click: () => {
          checkForUpdates(true);
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/dog.ico'),
    
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize auto-updater
  initAutoUpdater(mainWindow);
}

// Check Docker status and start if needed
async function startDockerAndContainers() {
  if (dockerStatus.checking) return;
  
  dockerStatus.checking = true;
  console.log('Checking Docker status...');
  
  // Send initial status to renderer
  if (mainWindow) {
    mainWindow.webContents.send('docker-status', dockerStatus);
  }
  
  // Check if Docker is installed
  exec('docker --version', (error) => {
    if (error) {
      console.error('Docker is not installed:', error);
      dockerStatus.checking = false;
      dockerStatus.running = false;
      
      if (mainWindow) {
        mainWindow.webContents.send('docker-status', dockerStatus);
        dialog.showErrorBox(
          'Docker Not Found',
          'Docker is not installed. Please install Docker Desktop and restart the application.'
        );
      }
      return;
    }
    
    // Check if Docker is running
    exec('docker info', (error) => {
      if (error) {
        console.log('Docker is not running. Attempting to start Docker...');
        startDockerDesktop();
      } else {
        console.log('Docker is running.');
        dockerStatus.running = true;
        
        // Send status update to renderer
        if (mainWindow) {
          mainWindow.webContents.send('docker-status', dockerStatus);
        }
        
        checkDockerResources();
      }
    });
  });
}

// Start Docker Desktop
function startDockerDesktop() {
  let startCommand;
  
  if (process.platform === 'win32') {
    // Windows
    const dockerPath = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
    startCommand = spawn(dockerPath, [], { detached: true, stdio: 'ignore' });
    startCommand.unref();
  } else if (process.platform === 'darwin') {
    // macOS
    startCommand = spawn('open', ['-a', 'Docker']);
  } else {
    // Linux - usually runs as a service
    startCommand = spawn('systemctl', ['start', 'docker']);
  }
  
  if (process.platform !== 'win32') {
    startCommand.on('error', (error) => {
      console.error('Failed to start Docker:', error);
      dockerStatus.checking = false;
      dockerStatus.running = false;
      
      if (mainWindow) {
        mainWindow.webContents.send('docker-status', dockerStatus);
        dialog.showErrorBox(
          'Docker Error',
          'Could not start Docker Desktop. Please start it manually and restart the application.'
        );
      }
    });
  }
  
  console.log('Waiting for Docker to start...');
  
  // Wait for Docker to start
  const checkInterval = setInterval(() => {
    exec('docker info', (error) => {
      if (!error) {
        console.log('Docker is now running');
        clearInterval(checkInterval);
        dockerStatus.running = true;
        if (mainWindow) {
          mainWindow.webContents.send('docker-status', dockerStatus);
        }
        checkDockerResources();
      }
    });
  }, 5000); // Check every 5 seconds
  
  // Stop checking after 2 minutes (24 * 5 seconds)
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!dockerStatus.running) {
      console.error('Timed out waiting for Docker to start');
      dockerStatus.checking = false;
      
      if (mainWindow) {
        mainWindow.webContents.send('docker-status', dockerStatus);
        dialog.showErrorBox(
          'Docker Timeout',
          'Docker did not start in the expected time. Please start it manually and restart the application.'
        );
      }
    }
  }, 120000);
}

// Check if Docker resources exist and load them if needed
function checkDockerResources() {
  console.log('Checking Docker resources...');
  
  // Check if tar files exist first
  const hasComposeFile = fs.existsSync(composeFilePath);
  const hasBackendTar = fs.existsSync(backendTarPath);
  const hasMariadbTar = fs.existsSync(mariadbTarPath);
  
  console.log(`Docker compose file ${hasComposeFile ? 'found' : 'not found'} at: ${composeFilePath}`);
  console.log(`Backend tar ${hasBackendTar ? 'found' : 'not found'} at: ${backendTarPath}`);
  console.log(`MariaDB tar ${hasMariadbTar ? 'found' : 'not found'} at: ${mariadbTarPath}`);
  
  // If we don't have any of the required resources, try to download them
  if (!hasComposeFile || !hasBackendTar || !hasMariadbTar) {
    downloadMissingResources().then(success => {
      if (success) {
        // After download, always load from tar files if they exist
        loadImagesAndStartContainers();
      } else {
        console.error('Failed to download Docker resources');
        if (mainWindow) {
          dialog.showErrorBox(
            'Missing Docker Resources',
            'Could not find or download necessary Docker resources. Please reinstall the application.'
          );
        }
      }
    });
  } else {
    // If we have all resources, load from tar files
    loadImagesAndStartContainers();
  }
}

// New function to consolidate loading images and starting containers
function loadImagesAndStartContainers() {
  // Always load images from tars first, even if they might exist in Docker
  const hasBackendTar = fs.existsSync(backendTarPath);
  const hasMariadbTar = fs.existsSync(mariadbTarPath);
  
  // Load both images (or any that are available)
  loadDockerImagesFromTar(hasBackendTar, hasMariadbTar).then(() => {
    startContainersWithCompose();
  });
}

// Download missing Docker resources
async function downloadMissingResources() {
  try {
    console.log('Attempting to download missing Docker resources from GitHub...');
    
    // Send progress event to renderer
    if (mainWindow) {
      mainWindow.webContents.send('setup-progress', {
        stage: 'downloading-resources',
        detail: 'Getting Docker resources from GitHub',
        progress: 0
      });
    }
    
    const downloadResult = await updateBackendImages(mainWindow);
    return downloadResult.success;
  } catch (err) {
    console.error('Error downloading Docker resources:', err);
    return false;
  }
}

// Updated to return a Promise and report progress
function loadDockerImagesFromTar(hasBackendTar, hasMariadbTar) {
  console.log('Loading Docker images from tar files...');
  
  // Send progress event to renderer
  if (mainWindow) {
    mainWindow.webContents.send('setup-progress', {
      stage: 'loading-images',
      detail: 'Preparing Docker images',
      progress: 0
    });
  }
  
  const loadPromises = [];
  
  if (hasMariadbTar) {
    loadPromises.push(new Promise((resolve) => {
      // Send progress event to renderer
      if (mainWindow) {
        mainWindow.webContents.send('setup-progress', {
          stage: 'loading-images',
          detail: 'Loading MariaDB image',
          progress: 0
        });
      }
      
      console.log(`Loading MariaDB image from: ${mariadbTarPath}`);
      exec(`docker load -i "${mariadbTarPath}"`, (error) => {
        if (error) {
          console.error('Error loading MariaDB image:', error);
        } else {
          console.log('MariaDB image loaded successfully');
        }
        resolve();
      });
    }));
  }
  
  if (hasBackendTar) {
    loadPromises.push(new Promise((resolve) => {
      // Send progress event to renderer
      if (mainWindow) {
        mainWindow.webContents.send('setup-progress', {
          stage: 'loading-images',
          detail: 'Loading backend image',
          progress: hasMariadbTar ? 50 : 0
        });
      }
      
      console.log(`Loading backend image from: ${backendTarPath}`);
      exec(`docker load -i "${backendTarPath}"`, (error) => {
        if (error) {
          console.error('Error loading backend image:', error);
        } else {
          console.log('Backend image loaded successfully');
        }
        resolve();
      });
    }));
  }
  
  // Return the promise that resolves when all images are loaded
  return Promise.all(loadPromises).then(() => {
    // Send progress event to renderer
    if (mainWindow) {
      mainWindow.webContents.send('setup-progress', {
        stage: 'loading-images',
        detail: 'Images loaded successfully',
        progress: 100
      });
    }
    
    console.log('Finished loading Docker images from tar files');
    return true;
  }).catch(err => {
    console.error('Error loading images:', err);
    return false;
  });
}

// Start containers using docker-compose with no-pull flag
function startContainersWithCompose() {
  console.log('Starting containers with docker-compose...');
  
  // Send progress event to renderer
  if (mainWindow) {
    mainWindow.webContents.send('setup-progress', {
      stage: 'starting-containers',
      detail: 'Checking existing containers',
      progress: 0
    });
  }
  
  // First check if containers with our names already exist
  exec('docker ps -a --format "{{.Names}}"', (error, stdout) => {
    if (error) {
      console.error('Error checking existing containers:', error);
      proceedWithDockerCompose();
      return;
    }
    
    const existingContainers = stdout.trim().split('\n');
    const hasMariadbContainer = existingContainers.includes('trackhounds-mariadb');
    const hasBackendContainer = existingContainers.includes('trackhounds-backend');
    
    // If either container exists, use individual container management
    if (hasMariadbContainer || hasBackendContainer) {
      console.log('Existing containers found, using individual container management');
      startIndividualContainers();
    } else {
      // No existing containers, proceed with docker-compose
      proceedWithDockerCompose();
    }
  });
}

// Extracted function to proceed with docker-compose (with no-pull flag)
function proceedWithDockerCompose() {
  // Send progress event to renderer
  if (mainWindow) {
    mainWindow.webContents.send('setup-progress', {
      stage: 'starting-containers',
      detail: 'Starting with docker-compose',
      progress: 30
    });
  }
  
  // Check for docker-compose vs docker compose (v2 format)
  exec('docker compose version', (error) => {
    // Add --no-build --no-pull flags to prevent Docker from trying to pull images
    const composeCommand = error 
      ? `docker-compose -f "${composeFilePath}" up -d --no-build` // Use legacy docker-compose
      : `docker compose -f "${composeFilePath}" up -d --no-build`; // Use new docker compose syntax
    
    console.log(`Running command: ${composeCommand}`);
    
    exec(composeCommand, (error) => {
      if (error) {
        console.error('Error starting containers with docker-compose:', error);
        
        // Update progress to show error state
        if (mainWindow) {
          mainWindow.webContents.send('setup-progress', {
            stage: 'error',
            detail: 'Docker compose failed, trying alternative',
            progress: 50
          });
        }
        
        // Try alternative way
        console.log('Trying alternative docker-compose command...');
        const altCommand = error.message.includes('docker-compose') 
          ? `docker compose -f "${composeFilePath}" up -d`  // Try new syntax
          : `docker-compose -f "${composeFilePath}" up -d`; // Try legacy syntax
        
        exec(altCommand, (altError) => {
          if (altError) {
            console.error('Alternative docker-compose command also failed:', altError);
            
            // Update progress to show fallback
            if (mainWindow) {
              mainWindow.webContents.send('setup-progress', {
                stage: 'starting-containers',
                detail: 'Falling back to individual container startup',
                progress: 60
              });
              
              dialog.showErrorBox(
                'Docker Compose Error',
                'Failed to start containers with docker-compose. Trying individual container startup.'
              );
            }
            startIndividualContainers();
          } else {
            console.log('Containers started successfully with alternative command');
            
            // Update progress to show success
            if (mainWindow) {
              mainWindow.webContents.send('setup-progress', {
                stage: 'complete',
                detail: 'Containers started successfully',
                progress: 100
              });
            }
            
            dockerStatus.checking = false;
            setTimeout(() => {
              checkContainerStatus();
            }, 5000);
          }
        });
      } else {
        console.log('Containers started successfully with docker-compose');
        
        // Update progress to show success
        if (mainWindow) {
          mainWindow.webContents.send('setup-progress', {
            stage: 'complete',
            detail: 'Containers started successfully',
            progress: 100
          });
        }
        
        dockerStatus.checking = false;
        
        // Check container status
        setTimeout(() => {
          checkContainerStatus();
        }, 5000);
      }
    });
  });
}

// Start individual containers
function startIndividualContainers() {
  console.log('Starting individual containers...');
  dockerStatus.checking = false;
  
  // Send progress event for individual startup
  if (mainWindow) {
    mainWindow.webContents.send('setup-progress', {
      stage: 'starting-containers',
      detail: 'Starting database container',
      progress: 65
    });
  }
  
  // Check for existing containers first
  exec('docker ps -a --format "{{.Names}}"', (error, stdout) => {
    if (error) {
      console.error('Error checking existing containers:', error);
      if (mainWindow) {
        mainWindow.webContents.send('docker-status', dockerStatus);
      }
      return;
    }
    
    const existingContainers = stdout.trim().split('\n');
    const hasMariadbContainer = existingContainers.includes('trackhounds-mariadb');
    const hasBackendContainer = existingContainers.includes('trackhounds-backend');
    
    console.log('Existing containers:', existingContainers);
    
    // Start MariaDB container
    if (hasMariadbContainer) {
      console.log('Starting existing MariaDB container...');
      exec('docker start trackhounds-mariadb', (error) => {
        if (error) {
          console.error('Error starting existing MariaDB container:', error);
        } else {
          console.log('Started existing MariaDB container');
          dockerStatus.containers.database.running = true;
          if (mainWindow) {
            mainWindow.webContents.send('docker-status', dockerStatus);
          }
        }
      });
      
      // Report progress
      if (mainWindow) {
        mainWindow.webContents.send('setup-progress', {
          stage: 'starting-containers',
          detail: 'Database container started, waiting for backend',
          progress: 80
        });
      }
    } else {
      console.log('Creating new MariaDB container...');
      exec('docker run -d --name trackhounds-mariadb -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=trackhounds mariadb:latest', (error) => {
        if (error) {
          console.error('Error creating MariaDB container:', error);
        } else {
          console.log('Created new MariaDB container');
          dockerStatus.containers.database.running = true;
          if (mainWindow) {
            mainWindow.webContents.send('docker-status', dockerStatus);
          }
        }
      });
      
      // Report progress
      if (mainWindow) {
        mainWindow.webContents.send('setup-progress', {
          stage: 'starting-containers',
          detail: 'Database container created, waiting for backend',
          progress: 80
        });
      }
    }
    
    // Wait a bit to ensure database is up before starting backend
    setTimeout(() => {
      // Send progress update for backend startup
      if (mainWindow) {
        mainWindow.webContents.send('setup-progress', {
          stage: 'starting-containers',
          detail: 'Starting backend container',
          progress: 85
        });
      }
      
      // Start Backend container
      if (hasBackendContainer) {
        console.log('Starting existing backend container...');
        exec('docker start trackhounds-backend', (error) => {
          if (error) {
            console.error('Error starting existing backend container:', error);
          } else {
            console.log('Started existing backend container');
            dockerStatus.containers.backend.running = true;
            if (mainWindow) {
              mainWindow.webContents.send('docker-status', dockerStatus);
            }
            
            // Final progress update
            if (mainWindow && !error) {
              mainWindow.webContents.send('setup-progress', {
                stage: 'complete',
                detail: 'All containers started successfully',
                progress: 100
              });
            }
          }
        });
      } else {
        console.log('Creating new backend container...');
        exec('docker run -d --name trackhounds-backend -p 8080:8080 --link trackhounds-mariadb:mariadb trackhounds-backend:latest', (error) => {
          if (error) {
            console.error('Error creating backend container:', error);
          } else {
            console.log('Created new backend container');
            dockerStatus.containers.backend.running = true;
            if (mainWindow) {
              mainWindow.webContents.send('docker-status', dockerStatus);
            }
            
            // Final progress update
            if (mainWindow && !error) {
              mainWindow.webContents.send('setup-progress', {
                stage: 'complete',
                detail: 'All containers started successfully',
                progress: 100
              });
            }
          }
        });
      }
    }, 5000);
    
    // Check container status periodically
    setTimeout(checkContainerStatus, 10000);
  });
}

// Check status of Docker containers
function checkContainerStatus() {
  exec('docker ps --format "{{.Names}}"', (error, stdout) => {
    if (error) {
      console.error('Error checking running containers:', error);
      return;
    }
    
    const runningContainers = stdout.trim().split('\n');
    dockerStatus.containers.backend.running = runningContainers.includes('trackhounds-backend');
    dockerStatus.containers.database.running = runningContainers.includes('trackhounds-mariadb');
    
    console.log('Container status:', dockerStatus.containers);
    
    // Send updated status to renderer
    if (mainWindow) {
      if (dockerStatus.containers.backend.running && dockerStatus.containers.database.running) {
        mainWindow.webContents.send('setup-progress', {
          stage: 'complete',
          detail: 'All services running',
          progress: 100
        });
      }
      
      mainWindow.webContents.send('docker-status', dockerStatus);
    }
  });
}

// Add backend update function
async function updateBackend() {
  if (!dockerStatus.running) {
    console.log('Docker not running, cannot update backend');
    return { success: false, reason: 'Docker not running' };
  }
  
  console.log('Checking for backend updates...');
  
  try {
    // Download new Docker image tarballs if available
    const updateResult = await updateBackendImages(mainWindow);
    
    if (updateResult.success) {
      // Load new Docker images
      // Stop existing containers
      await new Promise((resolve) => {
        exec(`docker-compose -f "${composeFilePath}" down`, (error) => {
          if (error) console.error('Error stopping containers:', error);
          resolve();
        });
      });
      
      // Load new images and restart
      loadDockerImagesFromTar(true, true);
      startContainersWithCompose();
      
      return { success: true, version: updateResult.version };
    }
    
    return { success: false, reason: 'No updates available' };
  } catch (error) {
    console.error('Error updating backend:', error);
    return { success: false, reason: error.message };
  }
}

// Application ready event
app.whenReady().then(() => {
  createWindow();
  
  // Start Docker and containers when the app starts
  startDockerAndContainers();
  
  // Set up a periodic check for container status
  setInterval(checkContainerStatus, 30000);
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC messages from renderer
ipcMain.on('app-request', (event, data) => {
  if (data.type === 'check-docker') {
    event.reply('app-response', { 
      type: 'docker-status', 
      status: dockerStatus 
    });
  } else if (data.type === 'update-backend') {
    updateBackend().then(result => {
      event.reply('app-response', {
        type: 'backend-update-result',
        result: result
      });
    });
  } else if (data.type === 'check-updates') {
    // This will trigger a manual update check
    event.reply('app-response', { 
      type: 'checking-update'
    });
    checkForUpdates(true);
  } else if (data.type === 'open-external-url') {
    // Handle opening external URLs safely
    if (data.url && typeof data.url === 'string') {
      // Validate URL to prevent security issues
      const validUrlPattern = /^(https?:\/\/|mailto:)/i;
      if (validUrlPattern.test(data.url)) {
        // Open URL in default browser
        shell.openExternal(data.url);
      }
    }
  }
});

// Clean shutdown for Docker containers when app is closing
app.on('before-quit', (event) => {
  if (dockerStatus.running) {
    event.preventDefault(); // Prevent the app from quitting immediately
    
    console.log('Stopping Docker containers before quitting...');
    const hasComposeFile = fs.existsSync(composeFilePath);
    if (hasComposeFile) {
      exec(`docker-compose -f "${composeFilePath}"  down`, (error) => {
        if (error) {
          console.error('Error stopping containers with docker-compose:', error);
          exec('docker stop trackhounds-backend trackhounds-mariadb', (error) => {
            if (error) {
              console.error('Error stopping containers:', error);
            } else {
              console.log('Containers stopped successfully');
            }
          });
        } else {
          console.log('Containers stopped successfully with docker-compose');
        }
        app.exit(); // Now exit the app
      });
    } else {
      exec('docker stop trackhounds-backend trackhounds-mariadb', (error) => {
        if (error) {
          console.error('Error stopping containers:', error);
        } else {
          console.log('Containers stopped successfully');
        }
        app.exit(); // Now exit the app
      });
    }
  }
});