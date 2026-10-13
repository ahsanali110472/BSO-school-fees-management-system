const path = require('path');
const { app } = require('electron');

// Explicitly ensure packaged desktop application NEVER runs in dev mode
const isDev = app ? (!app.isPackaged && (process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL)) : false;

module.exports = {
  isDev,
  appName: 'School Management & Fee Management System',
  appId: 'com.schoolsystem.bso',
  version: '1.0.0',
  window: {
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f172a',
    title: 'School Management & Fee Management System',
  },
  urls: {
    devServer: process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173',
    prodEntry: path.join(__dirname, '../frontend/dist/index.html'),
    backendApi: process.env.BACKEND_URL || 'http://localhost:5000/api',
  },
};
