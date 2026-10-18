const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vertexDesktop", {
  platform: process.platform,
  isDesktop: true,
  sqlServer: {
    getConfig: (maskPassword) => ipcRenderer.invoke("vertex:sql:getConfig", maskPassword),
    saveConfig: (config) => ipcRenderer.invoke("vertex:sql:saveConfig", config),
    getStatus: () => ipcRenderer.invoke("vertex:sql:getStatus"),
    testConnection: (config) => ipcRenderer.invoke("vertex:sql:testConnection", config),
    connect: () => ipcRenderer.invoke("vertex:sql:connect"),
    disconnect: () => ipcRenderer.invoke("vertex:sql:disconnect")
  }
});
