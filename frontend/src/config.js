// Configuration file for the application

// Base API URL
export const API_BASE_URL = 'http://localhost:8080';

// Detect if running in Electron
export const isElectron = window.electron !== undefined;

// Get platform information from Electron preload if available
export const platformInfo = isElectron ? window.electron.platform : 'browser';

// Utility to check backend connection
export async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/actuator/health`, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Backend connection check failed:', error);
    return false;
  }
}

// Docker status check via Electron IPC
export function checkDockerStatus(callback) {
  if (!isElectron) return;
  
  // Send request to main process
  window.electron.send('app-request', { type: 'check-docker' });
  
  // Set up one-time listener for the response
  window.electron.receive('app-response', (data) => {
    if (data.type === 'docker-status') {
      callback(data.status);
    }
  });
  
  // Also listen for ongoing status updates
  window.electron.receive('docker-status', (status) => {
    callback(status);
  });
}
