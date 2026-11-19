import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  importer: {
    listBrowsers: () => ipcRenderer.invoke('import:list-browsers'),
    scanBrowser: (browserId: string) => ipcRenderer.invoke('import:scan-browser', browserId),
    importBookmarks: (browserId: string, profileName: string) => ipcRenderer.invoke('import:bookmarks', browserId, profileName),
    importHistory: (browserId: string, profileName: string) => ipcRenderer.invoke('import:history', browserId, profileName),
    importBookmarksHtml: () => ipcRenderer.invoke('import:bookmarks-html'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },
  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:open-path', filePath),
    showItem: (filePath: string) => ipcRenderer.invoke('shell:show-item', filePath),
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  },
  downloads: {
    cancel: (id: string) => ipcRenderer.invoke('downloads:cancel', id),
    pause: (id: string) => ipcRenderer.invoke('downloads:pause', id),
    resume: (id: string) => ipcRenderer.invoke('downloads:resume', id),
    defaultPath: () => ipcRenderer.invoke('downloads:default-path'),
    setPath: (next: string) => ipcRenderer.invoke('downloads:set-path', next),
    onStarted: (cb: (data: unknown) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
      ipcRenderer.on('download:started', listener);
      return () => ipcRenderer.removeListener('download:started', listener);
    },
    onProgress: (cb: (data: unknown) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
      ipcRenderer.on('download:progress', listener);
      return () => ipcRenderer.removeListener('download:progress', listener);
    },
    onDone: (cb: (data: unknown) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, data: unknown) => cb(data);
      ipcRenderer.on('download:done', listener);
      return () => ipcRenderer.removeListener('download:done', listener);
    },
  },
  onNewTab: (cb: (url: string) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, url: string) => cb(url);
    ipcRenderer.on('browser:new-tab', listener);
    return () => ipcRenderer.removeListener('browser:new-tab', listener);
  },
  onShieldBlocked: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('shield:blocked', listener);
    return () => ipcRenderer.removeListener('shield:blocked', listener);
  },
  setShield: (enabled: boolean, level: string) => ipcRenderer.invoke('shield:set', enabled, level),
  platform: process.platform,
  isElectron: true,
});
