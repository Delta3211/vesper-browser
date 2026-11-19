import type { DownloadItem } from '../types/browser';

export interface ElectronWindowAPI {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

export interface ElectronShellAPI {
  openPath: (path: string) => Promise<void>;
  showItem: (path: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

export interface ElectronDialogAPI {
  selectFolder: () => Promise<string | null>;
}

export interface ElectronDownloadsAPI {
  cancel: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  defaultPath: () => Promise<string>;
  setPath: (next: string) => Promise<string>;
  onStarted: (cb: (data: DownloadItem) => void) => () => void;
  onProgress: (cb: (data: Partial<DownloadItem> & { id: string }) => void) => () => void;
  onDone: (cb: (data: Partial<DownloadItem> & { id: string }) => void) => () => void;
}

export interface ImportedBrowserProfile { name: string; bookmarkCount: number; historyCount: number }
export interface ImportedBrowser { id: string; name: string; available: boolean; profiles: ImportedBrowserProfile[] }
export interface ImportedBookmark { title: string; url: string; folder: string }

export interface ElectronAPI {
  importer: { listBrowsers: () => Promise<ImportedBrowser[]>; scanBrowser: (browserId: string) => Promise<ImportedBrowser>; importBookmarks: (browserId: string, profileName: string) => Promise<ImportedBookmark[]>; importHistory: (browserId: string, profileName: string) => Promise<{ url: string; title: string; visitedAt: number }[]>; importBookmarksHtml: () => Promise<ImportedBookmark[]> };
  window: ElectronWindowAPI;
  shell: ElectronShellAPI;
  dialog: ElectronDialogAPI;
  downloads: ElectronDownloadsAPI;
  onNewTab: (cb: (url: string) => void) => () => void;
  onShieldBlocked: (cb: () => void) => () => void;
  setShield: (enabled: boolean, level: string) => Promise<void>;
  platform: string;
  isElectron: true;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export async function listImportBrowsers(): Promise<ImportedBrowser[]> { return isElectron() ? window.electronAPI!.importer.listBrowsers() : []; }
export async function scanImportBrowser(browserId: string): Promise<ImportedBrowser | null> { return isElectron() ? window.electronAPI!.importer.scanBrowser(browserId) : null; }
export async function importBrowserBookmarks(browserId: string, profileName: string): Promise<ImportedBookmark[]> { return isElectron() ? window.electronAPI!.importer.importBookmarks(browserId, profileName) : []; }
export async function importBrowserHistory(browserId: string, profileName: string): Promise<{ url: string; title: string; visitedAt: number }[]> { return isElectron() ? window.electronAPI!.importer.importHistory(browserId, profileName) : []; }
export async function importBookmarksHtml(): Promise<ImportedBookmark[]> { return isElectron() ? window.electronAPI!.importer.importBookmarksHtml() : []; }

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

export function getPlatform(): string {
  if (isElectron()) return window.electronAPI!.platform;
  return navigator.platform.toLowerCase().includes('mac') ? 'darwin'
    : navigator.platform.toLowerCase().includes('win') ? 'win32'
    : 'linux';
}

export async function minimizeWindow(): Promise<void> {
  if (!isElectron()) return;
  return window.electronAPI!.window.minimize();
}

export async function toggleMaximizeWindow(): Promise<boolean> {
  if (!isElectron()) return false;
  return window.electronAPI!.window.toggleMaximize();
}

export async function closeWindow(): Promise<void> {
  if (!isElectron()) return;
  return window.electronAPI!.window.close();
}

export async function isWindowMaximized(): Promise<boolean> {
  if (!isElectron()) return false;
  return window.electronAPI!.window.isMaximized();
}

export async function openInFileExplorer(path: string): Promise<void> {
  if (!isElectron() || !path) return;
  return window.electronAPI!.shell.showItem(path);
}

export async function selectDownloadPath(): Promise<string | null> {
  if (!isElectron()) return null;
  return window.electronAPI!.dialog.selectFolder();
}

export async function cancelDownload(id: string): Promise<void> {
  if (!isElectron()) return;
  return window.electronAPI!.downloads.cancel(id);
}

export async function pauseNativeDownload(id: string): Promise<void> {
  if (!isElectron()) return;
  return window.electronAPI!.downloads.pause(id);
}

export async function resumeNativeDownload(id: string): Promise<void> {
  if (!isElectron()) return;
  return window.electronAPI!.downloads.resume(id);
}

export function subscribeDownloads(handlers: {
  onStarted?: (item: DownloadItem) => void;
  onProgress?: (item: Partial<DownloadItem> & { id: string }) => void;
  onDone?: (item: Partial<DownloadItem> & { id: string }) => void;
}): () => void {
  if (!isElectron()) return () => {};
  const unsubs = [
    handlers.onStarted ? window.electronAPI!.downloads.onStarted(handlers.onStarted) : () => {},
    handlers.onProgress ? window.electronAPI!.downloads.onProgress(handlers.onProgress) : () => {},
    handlers.onDone ? window.electronAPI!.downloads.onDone(handlers.onDone) : () => {},
  ];
  return () => unsubs.forEach((fn) => fn());
}

export function subscribeNewTab(cb: (url: string) => void): () => void {
  if (!isElectron()) return () => {};
  return window.electronAPI!.onNewTab(cb);
}

export function subscribeShieldBlocked(cb: () => void): () => void {
  if (!isElectron()) return () => {};
  return window.electronAPI!.onShieldBlocked(cb);
}

export async function syncNativeShield(enabled: boolean, level: string): Promise<void> {
  if (!isElectron()) return;
  return window.electronAPI!.setShield(enabled, level);
}

export async function getDefaultDownloadPath(): Promise<string> {
  if (!isElectron()) return '';
  return window.electronAPI!.downloads.defaultPath();
}
