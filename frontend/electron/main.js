import { exec, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAutoUpdater, updateBackendImages } from './updater.js';

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/dog.ico')
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
  
  // Check if compose file exists
  const hasComposeFile = fs.existsSync(composeFilePath);
  console.log(`Docker compose file ${hasComposeFile ? 'found' : 'not found'} at: ${composeFilePath}`);
  
  // Check if tar files exist
  const hasBackendTar = fs.existsSync(backendTarPath);
  const hasMariadbTar = fs.existsSync(mariadbTarPath);
  
  console.log(`Backend tar ${hasBackendTar ? 'found' : 'not found'} at: ${backendTarPath}`);
  console.log(`MariaDB tar ${hasMariadbTar ? 'found' : 'not found'} at: ${mariadbTarPath}`);
  loadDockerImagesFromTar(hasBackendTar, hasMariadbTar);
  if (hasComposeFile) {
    startContainersWithCompose();
  } else {
    console.error('No Docker resources found. Cannot start containers.');
    dockerStatus.checking = false;
    
    if (mainWindow) {
      mainWindow.webContents.send('docker-status', dockerStatus);
      dialog.showErrorBox(
        'Missing Docker Resources',
        'Could not find the necessary Docker resources. Please reinstall the application.'
      );
    }
  }
}

// Start containers using docker-compose
function startContainersWithCompose() {
  console.log('Starting containers with docker-compose...');
  
  const composeCommand = `docker-compose -f "${composeFilePath}"  up -d`;
  console.log(`Running command: ${composeCommand}`);
  
  exec(composeCommand, (error) => {
    if (error) {
      console.error('Error starting containers with docker-compose:', error);
      
      if (mainWindow) {
        dialog.showErrorBox(
          'Docker Compose Error',
          'Failed to start containers with docker-compose. Trying individual container startup.'
        );
      }
      
      // Fall back to individual container startup
      startIndividualContainers();
    } else {
      console.log('Containers started successfully with docker-compose');
      dockerStatus.checking = false;
      
      // Check container status
      setTimeout(() => {
        checkContainerStatus();
      }, 5000);
    }
  });
}

// Load Docker images from tar files
function loadDockerImagesFromTar(hasBackendTar, hasMariadbTar) {
  console.log('Loading Docker images from tar files...');
  
  const loadPromises = [];
  
  if (hasMariadbTar) {
    loadPromises.push(new Promise((resolve) => {
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
}

// Start individual containers
function startIndividualContainers() {
  console.log('Starting individual containers...');
  dockerStatus.checking = false;
  
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
    }
    
    // Wait a bit to ensure database is up before starting backend
    setTimeout(() => {
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