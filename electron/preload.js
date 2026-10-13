const { contextBridge, ipcRenderer } = require('electron');

// Channel whitelist for renderer listening
const ALLOWED_RECEIVE_CHANNELS = [
  'window:maximize-change',
  'app:notification',
  'system:status',
];

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Window actions
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // App & System info
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // Safe IPC communication
  on: (channel, callback) => {
    if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },
  removeListener: (channel, callback) => {
    if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});
