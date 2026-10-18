/**
 * VERTEX ERP Ultimate - Desktop SQL Server Connection Layer
 * 
 * Target: Microsoft SQL Server (TDS Protocol)
 * Scope: VERTEX Desktop (Electron Main Process) ONLY.
 * 
 * Features:
 *   - Configuration Management: Server, Database, Authentication (SQL / Windows), Username, Password
 *   - Connection Lifecycle: Standby, Test Connection, Connect, Disconnect, Query
 *   - Secure Storage: Config persistence in user desktop environment
 *   - Isolation: Decoupled from Cloud runtime; Zero localStorage migration; No automatic DDL execution.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const Module = require('module');

/**
 * Setup module resolution so TDS drivers (mssql, tedious, tarn, etc.)
 * load reliably across Electron environments using the natural dependency tree.
 */
function setupTdsModuleResolution() {
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

// Immediately install module resolution on script load
setupTdsModuleResolution();

class SqlServerConnectionLayer {
  constructor() {
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
    this.lastError = null;
    this.lastConnectedAt = null;
    this.pool = null;
    this.driver = null;

    // Default configuration template (targeted for VERTEX Desktop)
    this.config = {
      server: '.\\VERTEX',
      database: 'VERTEX_ERP_DB',
      authentication: 'sql', // 'sql' (SQL Server Authentication) or 'windows' (Windows Integrated Authentication)
      username: 'sa',
      password: '',
      port: undefined, // Dynamic TCP port discovery for Named Instances (e.g. .\VERTEX)
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 8000,
        requestTimeout: 15000
      }
    };

    this.configFilePath = null;
    this._initStoragePath();
    this.loadSavedConfig();
  }

  /**
   * Determine path for saving desktop SQL Server connection settings
   */
  _initStoragePath() {
    try {
      let baseDir = path.resolve(__dirname);
      if (process.versions && process.versions.electron) {
        try {
          const { app } = require('electron');
          if (app && app.getPath) {
            baseDir = app.getPath('userData');
          }
        } catch (e) {
          // Fallback to local desktop directory if outside electron app lifecycle
        }
      }
      this.configFilePath = path.join(baseDir, 'vertex-sqlserver-config.json');
    } catch (err) {
      this.configFilePath = path.join(__dirname, 'vertex-sqlserver-config.json');
    }
  }

  /**
   * Load saved configuration from desktop storage
   */
  loadSavedConfig() {
    try {
      if (this.configFilePath && fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = {
          ...this.config,
          ...parsed,
          options: {
            ...this.config.options,
            ...(parsed.options || {})
          }
        };

        // For Named Instances without an explicit comma port, do not force 1433
        if (this.config.server && (this.config.server.includes('\\') || this.config.server.includes('/')) && !this.config.server.includes(',')) {
          if (this.config.port === 1433) {
            this.config.port = undefined;
          }
        }
      }
    } catch (err) {
      console.warn('[VERTEX Desktop SQL Layer] Could not read saved config:', err.message);
    }
  }

  /**
   * Save configuration to desktop storage
   */
  saveConfig(newConfig) {
    try {
      if (!newConfig || typeof newConfig !== 'object') {
        throw new Error('بيانات الإعدادات غير صالحة');
      }

      this.config = {
        server: String(newConfig.server || this.config.server).trim(),
        database: String(newConfig.database || this.config.database).trim(),
        authentication: newConfig.authentication === 'windows' ? 'windows' : 'sql',
        username: String(newConfig.username || '').trim(),
        password: String(newConfig.password || ''),
        port: Number(newConfig.port) || 1433,
        options: {
          ...this.config.options,
          ...(newConfig.options || {})
        }
      };

      if (this.configFilePath) {
        const dataToSave = { ...this.config };
        fs.writeFileSync(this.configFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
      }

      return { success: true, message: 'تم حفظ إعدادات الاتصال بـ SQL Server بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get sanitized configuration (without exposing raw password in UI payloads)
   */
  getConfig(maskPassword = false) {
    const configCopy = { ...this.config };
    if (maskPassword && configCopy.password) {
      configCopy.password = '••••••••';
    }
    return configCopy;
  }

  /**
   * Get current connection status and health
   */
  getStatus() {
    return {
      status: this.status,
      lastError: this.lastError ? this.lastError.message || String(this.lastError) : null,
      lastConnectedAt: this.lastConnectedAt,
      server: this.config.server,
      database: this.config.database,
      authentication: this.config.authentication,
      username: this.config.authentication === 'sql' ? this.config.username : 'Windows Authentication'
    };
  }

  /**
   * Lazy load SQL Server driver (mssql / tedious)
   * Resolves from standard node_modules dependency tree
   */
  _getDriver() {
    if (this.driver) return this.driver;

    const validDirs = setupTdsModuleResolution();

    const tryLoad = (pkgName) => {
      if (pkgName === 'mssql' && global.mssql) return global.mssql;
      if (pkgName === 'tedious' && global.tedious) return global.tedious;
      try {
        return require(pkgName);
      } catch (e1) {
        for (const cPath of validDirs) {
          try {
            const resolved = require.resolve(pkgName, { paths: [cPath] });
            return require(resolved);
          } catch (e2) {}
          try {
            return require(path.join(cPath, pkgName));
          } catch (e3) {}
        }
        return null;
      }
    };

    const mssqlPkg = tryLoad('mssql');
    if (mssqlPkg && (mssqlPkg.ConnectionPool || (mssqlPkg.default && mssqlPkg.default.ConnectionPool))) {
      const PoolClass = mssqlPkg.ConnectionPool || mssqlPkg.default.ConnectionPool;
      this.driver = {
        type: 'mssql',
        ConnectionPool: PoolClass,
        raw: mssqlPkg
      };
      return this.driver;
    }

    const tediousPkg = tryLoad('tedious');
    if (tediousPkg && (tediousPkg.Connection || typeof tediousPkg === 'function')) {
      const ConnectionClass = tediousPkg.Connection || tediousPkg;
      this.driver = {
        type: 'tedious',
        Connection: ConnectionClass,
        Request: tediousPkg.Request,
        TYPES: tediousPkg.TYPES,
        raw: tediousPkg
      };
      return this.driver;
    }

    return null;
  }

  /**
   * Determine if target host is the local machine
   */
  _isLocalHost(host) {
    if (!host) return true;
    const h = String(host).toLowerCase().trim();
    if (h === '.' || h === '(local)' || h === 'localhost' || h === '127.0.0.1' || h === '::1') {
      return true;
    }
    try {
      const os = require('os');
      if (h === os.hostname().toLowerCase()) return true;
    } catch {}
    return false;
  }

  /**
   * Resolve SQL Server host and instance/port targets for TDS protocol
   * Maps '.' and '(local)' to 'localhost', extracts instance names (e.g. .\VERTEX, AYMAN-PC\VERTEX, 192.168.1.10\VERTEX)
   */
  _resolveServerTarget(serverInput, portInput) {
    let raw = String(serverInput || '').trim();
    let host = raw;
    let instanceName = undefined;
    let port = portInput ? Number(portInput) : undefined;

    // Handle host,port format e.g. "localhost,1433" or "192.168.1.10,51433"
    if (host.includes(',')) {
      const parts = host.split(',');
      host = parts[0].trim();
      port = Number(parts[1].trim()) || port;
    }

    // Handle host\instance format e.g. ".\VERTEX", "AYMAN-PC\VERTEX", "192.168.1.10\VERTEX"
    if (host.includes('\\') || host.includes('/')) {
      const parts = host.includes('\\') ? host.split('\\') : host.split('/');
      host = parts[0].trim();
      instanceName = parts[1].trim();
      // When a named instance is provided and no explicit comma port was in the string, port must be undefined
      // so automatic port discovery takes precedence rather than forcing 1433
      if (!raw.includes(',')) {
        port = undefined;
      }
    }

    // Normalize Windows local shortcuts: '.' and '(local)' to 'localhost' for TDS network resolver
    if (host === '.' || host === '(local)') {
      host = 'localhost';
    }

    return { host, instanceName, port };
  }

  /**
   * Query SQL Server Browser service via UDP port 1434 using dual SSRP packets (0x03 & 0x02)
   */
  async _querySqlBrowserEnhanced(host, instanceName, timeout = 1200) {
    const dgram = require('dgram');
    return new Promise((resolve) => {
      const socket = dgram.createSocket('udp4');
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try { socket.close(); } catch {}
          resolve(null);
        }
      }, timeout);

      socket.on('message', (msg) => {
        if (!finished) {
          try {
            const text = msg.toString('ascii', 3);
            const instances = text.split(';;');
            for (const inst of instances) {
              const parts = inst.split(';');
              let matchedInstance = false;
              let foundTcpPort = null;
              for (let i = 0; i < parts.length; i += 2) {
                const key = parts[i];
                const val = parts[i + 1];
                if (key === 'InstanceName' && val && val.toUpperCase() === instanceName.toUpperCase()) {
                  matchedInstance = true;
                }
                if (key === 'tcp' && val) {
                  foundTcpPort = parseInt(val, 10);
                }
              }
              if (matchedInstance && foundTcpPort) {
                finished = true;
                clearTimeout(timer);
                try { socket.close(); } catch {}
                return resolve(foundTcpPort);
              }
            }
          } catch {}
        }
      });

      socket.on('error', () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          try { socket.close(); } catch {}
          resolve(null);
        }
      });

      try {
        // Send SSRP 0x03 (Instance Specific Query with instance name null-terminated)
        const pktInst = Buffer.concat([
          Buffer.from([0x03]),
          Buffer.from(instanceName, 'ascii'),
          Buffer.from([0x00])
        ]);
        socket.send(pktInst, 0, pktInst.length, 1434, host, () => {});

        // Also send SSRP 0x02 (All Instances Query) as dual fallback
        const pktAll = Buffer.from([0x02]);
        socket.send(pktAll, 0, pktAll.length, 1434, host, () => {});
      } catch {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          try { socket.close(); } catch {}
          resolve(null);
        }
      }
    });
  }

  /**
   * Probe Windows Registry on local machine for Named Instance TCP configuration
   * Reads TcpDynamicPorts and TcpPort from SuperSocketNetLib
   */
  _queryWindowsRegistryForInstancePorts(instanceName) {
    const ports = [];
    if (process.platform !== 'win32') return ports;
    const cp = require('child_process');

    const cleanInst = instanceName.trim();
    const regRoots = [
      'HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server',
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Microsoft SQL Server'
    ];

    for (const root of regRoots) {
      try {
        const out = cp.execSync(`reg query "${root}\\Instance Names\\SQL" /v "${cleanInst}"`, {
          encoding: 'utf8',
          timeout: 2000,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'ignore']
        });

        const match = out.match(new RegExp(`${cleanInst}\\s+REG_SZ\\s+([^\\r\\n]+)`, 'i'));
        const instanceId = match ? match[1].trim() : null;

        const idsToCheck = instanceId ? [instanceId] : [`MSSQL16.${cleanInst}`, `MSSQL15.${cleanInst}`, `MSSQL14.${cleanInst}`, `MSSQL.${cleanInst}`, cleanInst];

        for (const id of idsToCheck) {
          try {
            const tcpOut = cp.execSync(`reg query "${root}\\${id}\\MSSQLServer\\SuperSocketNetLib\\Tcp\\IPAll"`, {
              encoding: 'utf8',
              timeout: 2000,
              windowsHide: true,
              stdio: ['pipe', 'pipe', 'ignore']
            });

            const dynMatch = tcpOut.match(/TcpDynamicPorts\s+REG_SZ\s+(\d+)/i);
            if (dynMatch && dynMatch[1]) {
              const p = parseInt(dynMatch[1], 10);
              if (p > 0 && !ports.includes(p)) ports.push(p);
            }

            const staticMatch = tcpOut.match(/TcpPort\s+REG_SZ\s+(\d+)/i);
            if (staticMatch && staticMatch[1]) {
              const p = parseInt(staticMatch[1], 10);
              if (p > 0 && !ports.includes(p)) ports.push(p);
            }
          } catch {}
        }
      } catch {}
    }

    if (ports.length > 0) {
      console.log(`[VERTEX Desktop] Registry discovered ports for ${instanceName}:`, ports);
    }
    return ports;
  }

  /**
   * Probe active listening TCP ports of running sqlservr.exe processes via PowerShell on Windows
   */
  _queryActiveSqlProcessPorts(instanceName) {
    const ports = [];
    if (process.platform !== 'win32') return ports;
    const cp = require('child_process');

    try {
      const psCmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$procs = Get-Process -Name sqlservr -ErrorAction SilentlyContinue; if ($procs) { foreach ($p in $procs) { Get-NetTCPConnection -OwningProcess $p.Id -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort } }"`;
      const out = cp.execSync(psCmd, {
        encoding: 'utf8',
        timeout: 3000,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const lines = out.split(/\r?\n/);
      for (const line of lines) {
        const p = parseInt(line.trim(), 10);
        if (p > 0 && !ports.includes(p)) {
          ports.push(p);
        }
      }
    } catch {}

    if (ports.length > 0) {
      console.log(`[VERTEX Desktop] Active sqlservr listening ports discovered:`, ports);
    }
    return ports;
  }

  /**
   * Quick TCP port connectivity check to see if a port is actively open and listening
   */
  async _probeTcpPort(host, port, timeout = 400) {
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        done = true;
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        if (!done) { done = true; socket.destroy(); resolve(false); }
      });
      socket.on('error', () => {
        if (!done) { done = true; socket.destroy(); resolve(false); }
      });
      try {
        socket.connect(port, host);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Automatically discover the active TCP port for a Named Instance
   * Supports:
   *  - Local instances: .\VERTEX, localhost\VERTEX, 127.0.0.1\VERTEX, COMPUTERNAME\VERTEX
   *  - LAN / Remote instances: AYMAN-PC\VERTEX, 192.168.1.10\VERTEX
   */
  async _discoverNamedInstancePort(host, instanceName) {
    if (!instanceName) return null;
    console.log(`[VERTEX Desktop] Starting automatic port discovery for instance "${instanceName}" on "${host}"...`);

    const isLocal = this._isLocalHost(host);
    const candidatePorts = [];

    // 1. Network Discovery: Enhanced SQL Server Browser Query (UDP 1434)
    try {
      const browserPort = await this._querySqlBrowserEnhanced(host, instanceName, 1200);
      if (browserPort) {
        console.log(`[VERTEX Desktop] SQL Browser discovered port ${browserPort} for ${instanceName}`);
        return browserPort;
      }
    } catch (e) {
      console.warn(`[VERTEX Desktop] SQL Browser query failed:`, e.message);
    }

    // 2. Local Windows System Discovery (when running on local machine)
    if (isLocal && process.platform === 'win32') {
      console.log(`[VERTEX Desktop] Target is local host. Querying Windows Registry and active SQL services...`);

      // Method 2A: Query Windows Registry for instance TCP config (TcpDynamicPorts & TcpPort)
      const regPorts = this._queryWindowsRegistryForInstancePorts(instanceName);
      for (const p of regPorts) {
        if (!candidatePorts.includes(p)) candidatePorts.push(p);
      }

      // Method 2B: Query active listening ports of running sqlservr.exe processes via PowerShell
      const psPorts = this._queryActiveSqlProcessPorts(instanceName);
      for (const p of psPorts) {
        if (!candidatePorts.includes(p)) candidatePorts.push(p);
      }
    }

    // 3. For any discovered candidate ports, probe them to verify active listener
    for (const port of candidatePorts) {
      const isAlive = await this._probeTcpPort(host, port, 400);
      if (isAlive) {
        console.log(`[VERTEX Desktop] Verified active TCP listener on port ${port} for ${instanceName}!`);
        return port;
      }
    }

    // 4. Check cached port from previous successful connection
    if (this.config && this.config.lastDiscoveredPort) {
      const cached = Number(this.config.lastDiscoveredPort);
      if (cached && await this._probeTcpPort(host, cached, 400)) {
        console.log(`[VERTEX Desktop] Reusing verified cached port ${cached} for ${instanceName}`);
        return cached;
      }
    }

    return null;
  }

  /**
   * Connect to SQL Server pool with automatic Named Instance dynamic port resolution
   */
  async _connectPoolWithCandidates(driver, baseConfig, resolved) {
    const candidateConfigs = [];

    if (resolved.instanceName && !resolved.port) {
      // Step 1: Automatic dynamic port discovery (SQL Browser, Windows Registry, System Ports)
      let discoveredPort = null;
      try {
        discoveredPort = await this._discoverNamedInstancePort(resolved.host, resolved.instanceName);
      } catch (e) {
        console.warn('[VERTEX Desktop] Port discovery error:', e.message);
      }

      if (discoveredPort) {
        candidateConfigs.push({
          label: `Discovered Dynamic TCP Port ${discoveredPort} for (${resolved.host}\\${resolved.instanceName})`,
          config: {
            ...baseConfig,
            server: resolved.host,
            port: discoveredPort,
            options: {
              ...baseConfig.options,
              instanceName: undefined,
              connectTimeout: Math.min(baseConfig.options.connectTimeout || 8000, 6000)
            }
          }
        });

        // Save discovered port to cache for ultra-fast subsequent startups
        this.config.lastDiscoveredPort = discoveredPort;
        try {
          if (this.saveConfig) this.saveConfig({ ...this.config, lastDiscoveredPort: discoveredPort });
        } catch {}
      }

      // Step 2: Native Tedious instance resolution via SQL Browser
      candidateConfigs.push({
        label: `InstanceName (${resolved.instanceName}) via SQL Browser`,
        config: {
          ...baseConfig,
          server: resolved.host,
          options: {
            ...baseConfig.options,
            instanceName: resolved.instanceName,
            // Use 2500ms timeout for browser resolution so we don't hang if UDP 1434 is blocked
            connectTimeout: Math.min(baseConfig.options.connectTimeout || 8000, 2500)
          }
        }
      });

      // Step 3: ONLY test standard port 1433 IF it is ACTUALLY active and listening
      // Do NOT force 1433 if it is closed or not responding (addresses user requirement)
      const is1433Active = await this._probeTcpPort(resolved.host, 1433, 300);
      if (is1433Active) {
        candidateConfigs.push({
          label: `Verified Active Port 1433 on ${resolved.host}`,
          config: {
            ...baseConfig,
            server: resolved.host,
            port: 1433,
            options: {
              ...baseConfig.options,
              instanceName: undefined,
              connectTimeout: Math.min(baseConfig.options.connectTimeout || 8000, 4000)
            }
          }
        });
      }
    } else {
      // Standard host:port configuration
      candidateConfigs.push({
        label: `Host ${resolved.host}${resolved.port ? ':' + resolved.port : ''}`,
        config: {
          ...baseConfig,
          server: resolved.host,
          port: resolved.port || 1433,
          options: {
            ...baseConfig.options,
            instanceName: undefined
          }
        }
      });
    }

    let lastError = null;
    for (const candidate of candidateConfigs) {
      try {
        console.log(`[VERTEX Desktop] Attempting TDS Handshake via ${candidate.label}...`);
        if (driver.ConnectionPool) {
          const pool = await new driver.ConnectionPool(candidate.config).connect();
          return pool;
        } else if (driver.Connection) {
          const pool = await this._connectTediousCandidate(driver.raw || driver, candidate.config);
          return pool;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[VERTEX Desktop] Handshake via ${candidate.label} failed: ${err.message}`);
      }
    }

    if (resolved.instanceName) {
      const detailedMsg = lastError ? lastError.message : 'لم يستجب خادم قاعدة البيانات';
      throw new Error(`تعذر الاتصال بالنسخة المسماة (${resolved.host}\\${resolved.instanceName}): ${detailedMsg}. يرجى التحقق من تفعيل بروتوكول TCP/IP في SQL Server Configuration Manager أو تشغيل خدمة SQL Server Browser.`);
    }

    throw lastError || new Error(`Failed to connect to ${resolved.host}`);
  }

  /**
   * Helper to perform connection and query using pure tedious driver
   */
  async _connectTediousCandidate(tedious, config) {
    return new Promise((resolve, reject) => {
      const ConnectionClass = tedious.Connection || tedious;
      const RequestClass = tedious.Request;

      const connection = new ConnectionClass({
        server: config.server,
        options: {
          port: config.port,
          instanceName: config.options && config.options.instanceName,
          database: config.database,
          encrypt: Boolean(config.options && config.options.encrypt),
          trustServerCertificate: Boolean(config.options ? config.options.trustServerCertificate : true),
          connectTimeout: (config.options && config.options.connectTimeout) || 8000
        },
        authentication: {
          type: 'default',
          options: {
            userName: config.user || '',
            password: config.password || ''
          }
        }
      });

      let finished = false;
      connection.on('connect', (err) => {
        if (finished) return;
        finished = true;
        if (err) return reject(err);

        resolve({
          request: () => ({
            query: (sqlText) => new Promise((res, rej) => {
              const rows = [];
              const req = new RequestClass(sqlText, (queryErr, rowCount) => {
                if (queryErr) return rej(queryErr);
                res({ recordset: rows, rowsAffected: [rowCount] });
              });
              req.on('row', (columns) => {
                const row = {};
                columns.forEach(col => { row[col.metadata.colName] = col.value; });
                rows.push(row);
              });
              connection.execSql(req);
            })
          }),
          close: () => new Promise((res) => {
            try {
              connection.on('end', () => res());
              connection.close();
            } catch {
              res();
            }
          })
        });
      });

      connection.on('error', (err) => {
        if (!finished) {
          finished = true;
          reject(err);
        }
      });
    });
  }

  /**
   * Test SQL Server Connection via real TDS Protocol Handshake
   * Target: Server, Database, Authentication, Username, Password
   * On success: Returns status: 'Connected'
   * On failure: Returns status: 'Failed' and the real error message
   */
  async testConnection(customConfig = null) {
    let targetConfig = { ...this.config };
    if (customConfig && typeof customConfig === 'object') {
      const customPass = customConfig.password;
      const effectivePassword = (customPass && customPass !== '••••••••') ? customPass : this.config.password;
      targetConfig = {
        ...targetConfig,
        ...customConfig,
        server: (customConfig.server && String(customConfig.server).trim()) ? String(customConfig.server).trim() : (targetConfig.server || '.\\VERTEX'),
        database: (customConfig.database && String(customConfig.database).trim()) ? String(customConfig.database).trim() : (targetConfig.database || 'VERTEX_ERP_DB'),
        username: (customConfig.username && String(customConfig.username).trim()) ? String(customConfig.username).trim() : (targetConfig.username || 'sa'),
        password: effectivePassword
      };
    }

    if (!targetConfig.server) {
      targetConfig.server = '.\\VERTEX';
    }
    if (!targetConfig.database) {
      targetConfig.database = 'VERTEX_ERP_DB';
    }
    if (targetConfig.authentication === 'sql' && !targetConfig.username) {
      targetConfig.username = 'sa';
    }

    // Dynamic discovery: Do NOT force 1433 on Named Instances
    if (targetConfig.server && (targetConfig.server.includes('\\') || targetConfig.server.includes('/')) && !targetConfig.server.includes(',')) {
      if (!customConfig || customConfig.port === undefined) {
        targetConfig.port = undefined;
      }
    }

    const driver = this._getDriver();
    if (!driver || (!driver.ConnectionPool && !driver.Connection)) {
      return {
        success: false,
        status: 'Failed',
        error: 'محرك بروتوكول TDS (mssql/tedious) غير متوفر في بيئة الديسكتوب'
      };
    }

    const resolved = this._resolveServerTarget(targetConfig.server, targetConfig.port);

    try {
      const baseConfig = {
        user: targetConfig.authentication === 'sql' ? targetConfig.username : undefined,
        password: targetConfig.authentication === 'sql' ? targetConfig.password : undefined,
        database: targetConfig.database,
        options: {
          encrypt: Boolean(targetConfig.options && targetConfig.options.encrypt),
          trustServerCertificate: Boolean(targetConfig.options ? targetConfig.options.trustServerCertificate : true),
          connectTimeout: (targetConfig.options && targetConfig.options.connectTimeout) || 8000,
          requestTimeout: (targetConfig.options && targetConfig.options.requestTimeout) || 15000,
          abortTransactionOnError: true
        }
      };

      // Real TDS Protocol Handshake: connects socket, performs TDS pre-login & login negotiation
      const testPool = await this._connectPoolWithCandidates(driver, baseConfig, resolved);
      const result = await testPool.request().query('SELECT @@VERSION AS sql_version, DB_NAME() AS current_db');
      await testPool.close();

      return {
        success: true,
        status: 'Connected',
        message: 'Connected',
        server: targetConfig.server,
        database: targetConfig.database,
        details: result.recordset && result.recordset[0] ? result.recordset[0] : null
      };
    } catch (sqlErr) {
      const realErrorMsg = sqlErr && sqlErr.message ? sqlErr.message : String(sqlErr);
      return {
        success: false,
        status: 'Failed',
        error: realErrorMsg,
        code: sqlErr && sqlErr.code ? sqlErr.code : null,
        server: targetConfig.server,
        database: targetConfig.database
      };
    }
  }

  /**
   * Connect to SQL Server using actual TDS Connection Pool (Desktop runtime)
   */
  async connect() {
    if (this.status === 'connected' && this.pool) {
      return {
        success: true,
        status: 'Connected',
        message: 'Connected',
        server: this.config.server,
        database: this.config.database
      };
    }

    this.status = 'connecting';
    this.lastError = null;

    try {
      const driver = this._getDriver();
      if (!driver || (!driver.ConnectionPool && !driver.Connection)) {
        throw new Error('محرك بروتوكول TDS (mssql/tedious) غير متوفر');
      }

      const resolved = this._resolveServerTarget(this.config.server, this.config.port);
      const baseConfig = {
        user: this.config.authentication === 'sql' ? this.config.username : undefined,
        password: this.config.authentication === 'sql' ? this.config.password : undefined,
        database: this.config.database,
        options: {
          encrypt: Boolean(this.config.options && this.config.options.encrypt),
          trustServerCertificate: Boolean(this.config.options ? this.config.options.trustServerCertificate : true),
          connectTimeout: (this.config.options && this.config.options.connectTimeout) || 8000,
          requestTimeout: (this.config.options && this.config.options.requestTimeout) || 15000,
          abortTransactionOnError: true
        }
      };

      this.pool = await this._connectPoolWithCandidates(driver, baseConfig, resolved);
      this.status = 'connected';
      this.lastConnectedAt = new Date().toISOString();

      return {
        success: true,
        status: 'Connected',
        message: 'Connected',
        server: this.config.server,
        database: this.config.database
      };
    } catch (err) {
      this.status = 'error';
      this.lastError = err;
      return {
        success: false,
        status: 'Failed',
        error: err.message || String(err),
        code: err.code || null,
        server: this.config.server,
        database: this.config.database
      };
    }
  }

  /**
   * Disconnect and release resources
   */
  async disconnect() {
    try {
      if (this.pool && typeof this.pool.close === 'function') {
        await this.pool.close();
      }
      this.pool = null;
      this.status = 'disconnected';
      return { success: true, message: 'تم إغلاق اتصال SQL Server' };
    } catch (err) {
      this.status = 'error';
      this.lastError = err;
      return { success: false, error: err.message };
    }
  }

  /**
   * Execute parameterized query on connected pool
   */
  async query(sqlText, params = {}) {
    if (this.status !== 'connected') {
      throw new Error('لا يوجد اتصال نشط بقاعدة بيانات SQL Server');
    }

    if (!this.pool) {
      throw new Error('مجمع الاتصال (Connection Pool) غير مهيأ');
    }

    const request = this.pool.request();
    if (params && typeof params === 'object') {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    return await request.query(sqlText);
  }
}

module.exports = new SqlServerConnectionLayer();
