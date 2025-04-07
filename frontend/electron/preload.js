// Use CommonJS module format for preload script
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire API
contextBridge.exposeInMainWorld('electron', {
  // Example API: sending notifications from renderer to main and getting responses
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['app-request', 'app-event', 'install-update', 'check-for-updates'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'app-response', 
      'app-notification', 
      'docker-status', 
      'update-status', 
      'update-ready', 
      'update-progress',
      'setup-progress'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Add platform information
  platform: process.platform,
  // Add one-time event listening
  receiveOnce: (channel, func) => {
    const validChannels = ['app-response', 'app-notification', 'docker-status', 'update-status', 'update-ready'];
    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    }
  },
  // Add invoke method for synchronous IPC calls
  invoke: (channel, ...args) => {
    const validChannels = ['check-for-updates-sync'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invoke to invalid channel: ${channel}`));
  }
});

// Log when preload is successfully loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded successfully');
});
