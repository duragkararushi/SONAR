const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonarDesktop', {
  platform: process.platform,
  isElectron: true,
  appVersion: '1.0.0',
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  openExternal: (url) => ipcRenderer.send('open-external', url)
});
