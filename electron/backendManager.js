const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork, execSync } = require('child_process');

let backendProcess = null;
let isShuttingDown = false;

// Helper to parse .env file format into key-value object
function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.substring(0, equalsIdx).trim();
        let val = trimmed.substring(equalsIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  } catch (err) {
    console.error('[BackendManager] Error reading env file:', err);
  }
  return env;
}

// Get backend directory & server script path
function getBackendPaths() {
  if (app.isPackaged) {
    const backendDir = path.join(process.resourcesPath, 'backend');
    return {
      backendDir,
      serverScript: path.join(backendDir, 'server.js'),
    };
  } else {
    const backendDir = path.join(__dirname, '..', 'backend');
    return {
      backendDir,
      serverScript: path.join(backendDir, 'server.js'),
    };
  }
}

// Resolve environment variables for backend execution
function resolveEnvironment() {
  const { backendDir } = getBackendPaths();
  let envConfig = {};

  if (app.isPackaged) {
    const userDataPath = app.getPath('userData');
    const userConfigFile = path.join(userDataPath, 'config.env');
    const bundledConfigFile = fs.existsSync(path.join(process.resourcesPath, 'app.env'))
      ? path.join(process.resourcesPath, 'app.env')
      : path.join(process.resourcesPath, 'resources', 'app.env');
    const backendEnvFile = path.join(backendDir, '.env');

    // If config.env does not exist in userData, initialize it from bundled config
    if (!fs.existsSync(userConfigFile)) {
      try {
        if (fs.existsSync(bundledConfigFile)) {
          fs.copyFileSync(bundledConfigFile, userConfigFile);
          console.log('[BackendManager] Initialized user config at:', userConfigFile);
        } else if (fs.existsSync(backendEnvFile)) {
          fs.copyFileSync(backendEnvFile, userConfigFile);
          console.log('[BackendManager] Initialized user config from backend .env at:', userConfigFile);
        }
      } catch (copyErr) {
        console.warn('[BackendManager] Could not copy config template:', copyErr.message);
      }
    }

    // Read user configuration
    if (fs.existsSync(userConfigFile)) {
      envConfig = parseEnvFile(userConfigFile);
      console.log('[BackendManager] Loaded config from:', userConfigFile);
    } else if (fs.existsSync(backendEnvFile)) {
      envConfig = parseEnvFile(backendEnvFile);
      console.log('[BackendManager] Loaded config from backend .env');
    }
  } else {
    // Development mode
    const devEnvFile = path.join(backendDir, '.env');
    if (fs.existsSync(devEnvFile)) {
      envConfig = parseEnvFile(devEnvFile);
      console.log('[BackendManager] Loaded dev config from:', devEnvFile);
    }
  }

  // Ensure mandatory defaults
  if (!envConfig.PORT) envConfig.PORT = '5000';
  if (!envConfig.NODE_ENV) envConfig.NODE_ENV = app.isPackaged ? 'production' : 'development';
  if (!envConfig.JWT_SECRET) envConfig.JWT_SECRET = 'bso_school_system_secret_key_2026_super_secure';

  return envConfig;
}

// Check if backend HTTP port is responding
function checkBackendHealth(port = 5000) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path: '/api/health',
        timeout: 1000,
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Poll backend until it's ready or timeout expires
async function waitForBackend(port = 5000, timeoutMs = 25000) {
  const startTime = Date.now();
  console.log(`[BackendManager] Waiting for backend on port ${port}...`);

  while (Date.now() - startTime < timeoutMs) {
    if (isShuttingDown) return false;
    const isReady = await checkBackendHealth(port);
    if (isReady) {
      console.log(`[BackendManager] Backend confirmed ready after ${Date.now() - startTime}ms`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.warn('[BackendManager] Backend readiness check timed out. Proceeding anyway...');
  return false;
}

// Start backend process
function startBackend() {
  const { backendDir, serverScript } = getBackendPaths();

  if (!fs.existsSync(serverScript)) {
    console.error('[BackendManager] Backend server script not found at:', serverScript);
    return Promise.resolve(false);
  }

  const envConfig = resolveEnvironment();
  const port = parseInt(envConfig.PORT, 10) || 5000;

  console.log('[BackendManager] Starting backend from:', serverScript);
  console.log('[BackendManager] Using PORT:', port, '| NODE_ENV:', envConfig.NODE_ENV);

  try {
    const userDataPath = app.getPath('userData');
    const logPath = path.join(userDataPath, 'backend.log');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    logStream.write(`\n--- Backend startup: ${new Date().toISOString()} ---\n`);

    backendProcess = fork(serverScript, [], {
      cwd: backendDir,
      env: {
        ...process.env,
        ...envConfig,
        ELECTRON_RUN_AS_NODE: '1',
      },
      silent: true,
    });

    backendProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      logStream.write(msg);
      console.log(`[Backend API] ${msg.trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      logStream.write(`[ERROR] ${msg}`);
      console.error(`[Backend API Error] ${msg.trim()}`);
    });

    backendProcess.on('exit', (code, signal) => {
      const exitMsg = `[BackendManager] Backend exited with code: ${code}, signal: ${signal}\n`;
      logStream.write(exitMsg);
      console.log(exitMsg.trim());
      backendProcess = null;
    });

    return waitForBackend(port, 10000);
  } catch (error) {
    console.error('[BackendManager] Failed to launch backend:', error);
    return Promise.resolve(false);
  }
}

// Stop backend process cleanly
function stopBackend() {
  isShuttingDown = true;
  if (!backendProcess) return;

  const pid = backendProcess.pid;
  console.log(`[BackendManager] Terminating backend process (PID: ${pid})...`);

  try {
    if (process.platform === 'win32' && pid) {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      backendProcess.kill('SIGTERM');
    }
  } catch (err) {
    // Ignore error if process already terminated
  }
  backendProcess = null;
}

module.exports = {
  startBackend,
  stopBackend,
};
