const path = require("path");
const fs = require("fs");
const Module = require("module");

/**
 * Configure module resolution so mssql, tedious, and all dependencies
 * load reliably across all Electron environments using the Production Vendor Bundle.
 */
function setupTdsResolution() {
  const vendorDir = path.resolve(__dirname, 'vendor');
  const vendorBundle = path.join(vendorDir, 'bundle.cjs');

  if (fs.existsSync(vendorBundle)) {
    const origResolveFilename = Module._resolveFilename;
    if (!Module._vendorHooked) {
      Module._vendorHooked = true;
      Module._resolveFilename = function(request, parent, isMain, options) {
        if (request === 'mssql') return path.join(vendorDir, 'mssql.cjs');
        if (request === 'tedious') return path.join(vendorDir, 'tedious.cjs');
        if (request === 'tarn') return path.join(vendorDir, 'tarn.cjs');
        return origResolveFilename.call(this, request, parent, isMain, options);
      };
    }
  }

  const searchDirs = [
    vendorDir,
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '..', 'node_modules'),
    path.resolve(process.cwd(), 'node_modules')
  ];

  if (process.versions && process.versions.electron) {
    try {
      const electronPkg = require('electron');
      const app = electronPkg.app || (electronPkg.remote && electronPkg.remote.app);
      if (app && app.getAppPath) {
        const appPath = app.getAppPath();
        searchDirs.push(path.join(appPath, 'electron', 'vendor'));
        searchDirs.push(path.join(appPath, 'node_modules'));
      }
    } catch (e) {}

    if (process.resourcesPath) {
      searchDirs.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'vendor'));
      searchDirs.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules'));
      searchDirs.push(path.join(process.resourcesPath, 'app', 'electron', 'vendor'));
      searchDirs.push(path.join(process.resourcesPath, 'app', 'node_modules'));
      searchDirs.push(path.join(process.resourcesPath, 'node_modules'));
    }
  }

  const validDirs = searchDirs.filter(d => {
    try {
      return fs.existsSync(d);
    } catch {
      return false;
    }
  });

  for (const dir of validDirs) {
    if (!Module.globalPaths.includes(dir)) {
      Module.globalPaths.push(dir);
    }
  }

  const origNodeModulePaths = Module._nodeModulePaths;
  if (!Module._tdsNodePathsHooked) {
    Module._tdsNodePathsHooked = true;
    Module._nodeModulePaths = function(from) {
      const paths = origNodeModulePaths.call(this, from);
      for (const d of validDirs) {
        if (!paths.includes(d)) paths.unshift(d);
      }
      return paths;
    };
  }

  return validDirs;
}

setupTdsResolution();

// Load mssql and tedious using the Production Vendor Bundle or natural tree
function loadDriverModule(pkgName) {
  const vendorDir = path.resolve(__dirname, 'vendor');
  const vendorPkg = path.join(vendorDir, `${pkgName}.cjs`);
  if (fs.existsSync(vendorPkg)) {
    try {
      return require(vendorPkg);
    } catch (e) {
      console.error(`[VERTEX Desktop] Failed loading ${pkgName} from vendor:`, e);
    }
  }

  try {
    return require(pkgName);
  } catch (err) {
    const validDirs = setupTdsResolution();
    for (const d of validDirs) {
      try {
        const resolved = require.resolve(pkgName, { paths: [d] });
        return require(resolved);
      } catch {}
      try {
        return require(path.join(d, pkgName));
      } catch {}
    }
    throw err;
  }
}

// Explicitly require mssql and tedious in Electron Production
const mssql = loadDriverModule("mssql");
const tedious = loadDriverModule("tedious");

// Also expose on global so they are readily available anywhere in the Electron runtime
global.mssql = mssql;
global.tedious = tedious;

let electron;
try {
  if (process.versions && process.versions.electron) {
    electron = require("electron");
  } else {
    const electronPathTxt = path.join(__dirname, "..", "node_modules", "electron", "path.txt");
    if (fs.existsSync(electronPathTxt)) {
      electron = require("electron");
    }
  }
} catch (e) {
  electron = null;
}

// If executed directly with standard Node.js CLI instead of Electron runtime, forward to Electron
if (typeof electron === "string" && require.main === module) {
  const { spawn } = require("child_process");
  const child = spawn(electron, ["."], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit"
  });
  child.on("close", (code) => process.exit(code || 0));
  return;
}

const { app, BrowserWindow, ipcMain } = (typeof electron === "object" && electron !== null) ? electron : {};
const sqlServer = require("./sqlConnectionLayer.cjs");

let mainWindow;

function setupSqlIpcHandlers() {
  ipcMain.handle("vertex:sql:getConfig", (_event, maskPassword) => {
    return sqlServer.getConfig(maskPassword);
  });

  ipcMain.handle("vertex:sql:saveConfig", (_event, config) => {
    return sqlServer.saveConfig(config);
  });

  ipcMain.handle("vertex:sql:getStatus", () => {
    return sqlServer.getStatus();
  });

  ipcMain.handle("vertex:sql:testConnection", async (_event, config) => {
    console.log("[VERTEX Desktop] Executing real TDS connection test to SQL Server...");
    const res = await sqlServer.testConnection(config);
    if (res.success || res.status === 'Connected') {
      console.log("[VERTEX Desktop] SQL Server TDS Connection: Connected");
    } else {
      console.log(`[VERTEX Desktop] SQL Server TDS Connection Failed: ${res.error}`);
    }
    return res;
  });

  ipcMain.handle("vertex:sql:connect", async () => {
    console.log("[VERTEX Desktop] Connecting to SQL Server via TDS...");
    const res = await sqlServer.connect();
    if (res.success || res.status === 'Connected') {
      console.log("[VERTEX Desktop] SQL Server TDS Connection Established: Connected");
    } else {
      console.log(`[VERTEX Desktop] SQL Server TDS Connect Failed: ${res.error}`);
    }
    return res;
  });

  ipcMain.handle("vertex:sql:disconnect", async () => {
    return await sqlServer.disconnect();
  });
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "VERTEX ERP Ultimate",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const desktopDistPath = path.join(__dirname, "..", "desktop-dist", "index.html");
  const fallbackDistPath = path.join(__dirname, "..", "dist", "index.html");
  const distHtmlPath = fs.existsSync(desktopDistPath) ? desktopDistPath : fallbackDistPath;

  // Standalone Production Mode: Direct file loading without any dev server or Vite
  if (fs.existsSync(distHtmlPath) && !process.env.VERTEX_DEV) {
    console.log("[VERTEX Desktop] Loading standalone production bundle from desktop-dist:", distHtmlPath);
    mainWindow.loadFile(distHtmlPath);
  } else {
    console.log("[VERTEX Desktop] Running in development mode, connecting to Vite dev server...");
    const devUrl = process.env.VERTEX_DEV_URL || "http://localhost:3000";

    function attemptLoad(retriesLeft = 20) {
      mainWindow.loadURL(devUrl).catch((err) => {
        if (retriesLeft > 0) {
          setTimeout(() => attemptLoad(retriesLeft - 1), 500);
        } else {
          console.error("Could not connect to Vite dev server at " + devUrl, err);
        }
      });
    }

    attemptLoad();
  }
}

if (app && app.whenReady) {
  app.whenReady().then(() => {
    setupSqlIpcHandlers();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = {
  mssql,
  tedious,
  sqlServer,
  setupTdsResolution
};
