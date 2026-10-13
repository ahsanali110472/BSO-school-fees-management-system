const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const config = require('./config');
const backendManager = require('./backendManager');

let mainWindow = null;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    backgroundColor: config.window.backgroundColor,
    title: config.window.title,
    show: false, // Prevent white flicker until ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  // Remove default menu for clean modern SaaS appearance
  mainWindow.setMenuBarVisibility(false);

  // Show window once rendered
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load URL based on environment
  if (config.isDev) {
    const devUrl = config.urls.devServer;
    
    // Connect to dev server with retry mechanism if server is still spinning up
    const loadDevServer = () => {
      mainWindow.loadURL(devUrl).catch(() => {
        console.log(`[Electron] Dev server at ${devUrl} not ready yet. Retrying in 1.5s...`);
        setTimeout(loadDevServer, 1500);
      });
    };

    loadDevServer();
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(config.urls.prodEntry).catch((err) => {
      console.error('[Electron] Failed to load production build file:', err);
    });
  }

  // Intercept new window requests and open securely in OS default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDevUrl = config.isDev && url.startsWith(config.urls.devServer);
    const isFileUrl = url.startsWith('file:');
    if (!isDevUrl && !isFileUrl) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Track maximize state change for custom UI if needed
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximize-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function registerIpcHandlers() {
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      return mainWindow.isMaximized();
    }
    return false;
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('shell:open-external', async (_event, targetUrl) => {
    if (targetUrl && (targetUrl.startsWith('http:') || targetUrl.startsWith('https:'))) {
      await shell.openExternal(targetUrl);
    }
  });
}

// App lifecycle
app.whenReady().then(async () => {
  registerIpcHandlers();

  // In production (or desktop standalone mode), launch the bundled Express backend automatically
  if (app.isPackaged || process.env.ELECTRON_START_BACKEND === 'true' || !process.env.VITE_DEV_SERVER_URL) {
    try {
      console.log('[Electron] Initializing bundled backend server...');
      await backendManager.startBackend();
    } catch (err) {
      console.error('[Electron] Error initializing backend server:', err);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  backendManager.stopBackend();
});

app.on('will-quit', () => {
  backendManager.stopBackend();
});

app.on('window-all-closed', () => {
  backendManager.stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
