// Use CommonJS module format for preload script
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire API
contextBridge.exposeInMainWorld('electron', {
  // Example API: sending notifications from renderer to main and getting responses
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['app-request', 'app-event'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['app-response', 'app-notification', 'docker-status'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Add platform information
  platform: process.platform,
  // Add one-time event listening
  receiveOnce: (channel, func) => {
    const validChannels = ['app-response', 'app-notification', 'docker-status'];
    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    }
  }
});

// Log when preload is successfully loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded successfully');
});
