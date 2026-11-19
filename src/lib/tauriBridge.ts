// src/lib/tauriBridge.ts
// Legacy Tauri IPC surface, preserved verbatim so any module that still
// imports it keeps compiling. The Tauri backend is gone; the window/shell/
// dialog/download helpers now delegate to the Electron bridge, and the rest
// no-op gracefully (the webview tag handles webview lifecycle natively now).

export {
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  isWindowMaximized,
  openInFileExplorer,
  cancelDownload,
} from './electronBridge';

interface DnsDiagResult {
  host: string;
  reachable: boolean;
  latency_ms: number;
  message: string;
}

/** Native DNS diagnostics are not wired in the Electron build; returns null. */
export const testDnsDiagnostics = async (_url: string): Promise<DnsDiagResult | null> => {
  console.warn('[Vesper] testDnsDiagnostics: unavailable in the Electron build');
  return null;
};

// --- Retained for API compatibility; no-ops in the Electron build. ---
export const webviewCreate = async (_id: string, _url: string): Promise<void> => {};
export const webviewNavigate = async (_id: string, _url: string): Promise<void> => {};
export const webviewShow = async (_id: string): Promise<void> => {};
export const webviewDestroy = async (_id: string): Promise<void> => {};
export const startDownload = async (_url: string, _fileName: string): Promise<void> => {};
export const toggleShield = async (_isEnabled: boolean): Promise<void> => {};
export const syncGoogleProfile = async (): Promise<null> => null;
export const getPinnedApps = async (): Promise<null> => null;
export const addPinnedApp = async (_app: unknown): Promise<void> => {};
export const removePinnedApp = async (_appId: string): Promise<void> => {};
export const getShieldStats = async (): Promise<null> => null;
export const getDownloads = async (): Promise<null> => null;
