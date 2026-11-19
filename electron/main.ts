import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  session,
  Menu,
  clipboard,
} from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { DownloadItem, WebContents } from 'electron';

let mainWindow: BrowserWindow | null = null;
const downloadItems = new Map<string, DownloadItem>();
let downloadPath = '';
let shieldEnabled = true;
let shieldLevel: 'Strict' | 'Balanced' | 'Permissive' = 'Balanced';

const TRACKER_HOSTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'facebook.net',
  'connect.facebook.net',
  'ads-twitter.com',
  'ads.twitter.com',
  'scorecardresearch.com',
  'hotjar.com',
  'clarity.ms',
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'adnxs.com',
];

function chromeUserAgent(): string {
  const chrome = process.versions.chrome || '131.0.0.0';
  const platform =
    process.platform === 'darwin'
      ? 'Macintosh; Intel Mac OS X 10_15_7'
      : process.platform === 'linux'
        ? 'X11; Linux x86_64'
        : 'Windows NT 10.0; Win64; x64';
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`;
}

function isTrackerUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return TRACKER_HOSTS.some((t) => host === t || host.endsWith(`.${t}`));
  } catch {
    return false;
  }
}

function isNavigableUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch { return false; }
}

function browseSession() {
  return session.fromPartition('persist:vesper');
}

function wireSession(ses: Electron.Session) {
  ses.setUserAgent(chromeUserAgent());

  // Sites must never gain access to sensitive device or user data silently.
  // A site permission prompt can be added when per-origin choices are persisted.
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);

  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    if (!shieldEnabled || shieldLevel === 'Permissive') {
      callback({});
      return;
    }
    if (isTrackerUrl(details.url)) {
      mainWindow?.webContents.send('shield:blocked', { url: details.url });
      callback({ cancel: true });
      return;
    }
    callback({});
  });

  ses.on('will-download', (_event, item) => {
    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    downloadItems.set(id, item);

    if (downloadPath) {
      item.setSavePath(path.join(downloadPath, item.getFilename()));
    }

    mainWindow?.webContents.send('download:started', {
      id,
      fileName: item.getFilename(),
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: 0,
      state: 'progressing',
      startTime: Date.now(),
      savePath: item.getSavePath(),
    });

    item.on('updated', (_e, state) => {
      mainWindow?.webContents.send('download:progress', {
        id,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state: state === 'interrupted' ? 'interrupted' : 'progressing',
        savePath: item.getSavePath(),
      });
    });

    item.once('done', (_e, state) => {
      mainWindow?.webContents.send('download:done', {
        id,
        state: state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted',
        savePath: item.getSavePath(),
        completedAt: Date.now(),
      });
      downloadItems.delete(id);
    });
  });
}

function attachWebContents(contents: WebContents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (isNavigableUrl(url)) mainWindow?.webContents.send('browser:new-tab', url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (!isNavigableUrl(url)) event.preventDefault();
  });

  contents.on('context-menu', (_event, params) => {
    const template: Electron.MenuItemConstructorOptions[] = [];

    if (params.linkURL) {
      template.push(
        {
          label: 'Open link in new tab',
          click: () => mainWindow?.webContents.send('browser:new-tab', params.linkURL),
        },
        {
          label: 'Copy link address',
          click: () => clipboard.writeText(params.linkURL),
        },
        { type: 'separator' },
      );
    }

    if (params.hasImageContents && params.srcURL) {
      template.push(
        {
          label: 'Open image in new tab',
          click: () => mainWindow?.webContents.send('browser:new-tab', params.srcURL),
        },
        {
          label: 'Copy image address',
          click: () => clipboard.writeText(params.srcURL),
        },
        { type: 'separator' },
      );
    }

    if (params.selectionText) {
      template.push(
        { role: 'copy' },
        {
          label: `Search for “${params.selectionText.slice(0, 32)}”`,
          click: () => {
            const q = encodeURIComponent(params.selectionText.trim());
            mainWindow?.webContents.send(
              'browser:new-tab',
              `https://www.google.com/search?q=${q}`,
            );
          },
        },
        { type: 'separator' },
      );
    }

    template.push(
      { role: 'paste' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Back',
        enabled: contents.navigationHistory.canGoBack(),
        click: () => contents.navigationHistory.goBack(),
      },
      {
        label: 'Forward',
        enabled: contents.navigationHistory.canGoForward(),
        click: () => contents.navigationHistory.goForward(),
      },
      { label: 'Reload', click: () => contents.reload() },
      { type: 'separator' },
      {
        label: 'Inspect',
        click: () => contents.inspectElement(params.x, params.y),
      },
    );

    Menu.buildFromTemplate(template).popup({ window: mainWindow ?? undefined });
  });
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 920,
    minHeight: 600,
    frame: false,
    title: 'Vesper',
    icon: path.join(__dirname, '../dist/vesper-logo.png'),
    backgroundColor: '#0b0c10',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


let sqlJsPromise: Promise<any> | null = null;

function getSqlJs(): Promise<any> {
  sqlJsPromise ??= Promise.resolve().then(() => {
    const initSqlJs: () => Promise<any> = require('sql.js/dist/sql-wasm-inline.js');
    return initSqlJs();
  });
  return sqlJsPromise;
}

async function browserProfiles() {
  const roots: { id: string; name: string; base: string }[] = [];
  const appData = app.getPath('appData');
  const home = app.getPath('home');
  if (process.platform === 'win32') {
    roots.push({ id: 'chrome', name: 'Google Chrome', base: path.join(appData, '..', 'Local', 'Google', 'Chrome', 'User Data') });
    roots.push({ id: 'edge', name: 'Microsoft Edge', base: path.join(appData, '..', 'Local', 'Microsoft', 'Edge', 'User Data') });
    roots.push({ id: 'brave', name: 'Brave', base: path.join(appData, '..', 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data') });
    roots.push({ id: 'arc', name: 'Arc', base: path.join(appData, '..', 'Local', 'Packages', 'TheBrowserCompany.Arc_ttt1ap7aakyb4', 'LocalCache', 'Local', 'Arc', 'User Data') });
  } else if (process.platform === 'darwin') {
    roots.push({ id: 'chrome', name: 'Google Chrome', base: path.join(home, 'Library/Application Support/Google/Chrome') });
    roots.push({ id: 'arc', name: 'Arc', base: path.join(home, 'Library/Application Support/Arc') });
    roots.push({ id: 'brave', name: 'Brave', base: path.join(home, 'Library/Application Support/BraveSoftware/Brave-Browser') });
  } else {
    roots.push({ id: 'chrome', name: 'Google Chrome', base: path.join(home, '.config/google-chrome') });
    roots.push({ id: 'arc', name: 'Arc', base: path.join(home, '.config/arc') });
    roots.push({ id: 'brave', name: 'Brave', base: path.join(home, '.config/BraveSoftware/Brave-Browser') });
  }
  return Promise.all(roots.map(async (browser) => {
    let profiles: { name: string; bookmarksPath: string; historyPath: string; bookmarkCount: number; historyCount: number }[] = [];
    if (fs.existsSync(browser.base)) {
      try {
        profiles = await Promise.all(fs.readdirSync(browser.base, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && (entry.name === 'Default' || entry.name.startsWith('Profile ')))
          .map(async (entry) => {
            const bookmarksPath = path.join(browser.base, entry.name, 'Bookmarks');
            const historyPath = path.join(browser.base, entry.name, 'History');
            let bookmarkCount = 0;
            let historyCount = 0;
            if (fs.existsSync(bookmarksPath)) {
              try { bookmarkCount = readChromiumBookmarks(bookmarksPath).length; } catch { /* browser may be writing this file */ }
            }
            if (fs.existsSync(historyPath)) {
              try { historyCount = await countChromiumHistory(historyPath); } catch { /* browser may be writing this file */ }
            }
            return { name: entry.name, bookmarksPath, historyPath, bookmarkCount, historyCount };
          }));
      } catch { /* inaccessible profiles are reported as unavailable */ }
    }
    return { id: browser.id, name: browser.name, available: fs.existsSync(browser.base), profiles };
  }));
}

function readChromiumBookmarks(filePath: string) {
  const root = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const bookmarks: { title: string; url: string; folder: string }[] = [];
  const walk = (node: any, folder = 'Imported') => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'url' && typeof node.url === 'string' && /^https?:\/\//i.test(node.url)) {
      bookmarks.push({ title: String(node.name || node.url), url: node.url, folder });
    } else if (Array.isArray(node.children)) {
      const next = node.name && node.name !== 'Bookmarks bar' && node.name !== 'Other bookmarks' ? String(node.name) : folder;
      node.children.forEach((child: unknown) => walk(child, next));
    }
  };
  walk(root.roots);
  return bookmarks;
}

async function readChromiumHistory(filePath: string, limit = 5000) {
  const copyPath = path.join(os.tmpdir(), `vesper-history-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  try {
    // Chromium keeps the live database locked. A temporary copy allows read-only import.
    fs.copyFileSync(filePath, copyPath);
    const SQL = await getSqlJs();
    const database = new SQL.Database(fs.readFileSync(copyPath));
    try {
      const result = database.exec(`
        SELECT url, title, last_visit_time
        FROM urls
        WHERE url LIKE 'http%'
        ORDER BY last_visit_time DESC
        LIMIT ${Math.max(1, Math.min(limit, 5000))}
      `);
      const [table] = result;
      if (!table) return [];
      return table.values.map((row: [string, string, number]) => ({
        url: String(row[0]),
        title: String(row[1] || row[0]),
        visitedAt: Math.max(0, Math.floor(Number(row[2]) / 1000 - 11644473600000)),
      }));
    } finally { database.close(); }
  } finally {
    try { fs.unlinkSync(copyPath); } catch { /* temporary file cleanup is best effort */ }
  }
}

async function countChromiumHistory(filePath: string) {
  const copyPath = path.join(os.tmpdir(), `vesper-history-count-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  try {
    fs.copyFileSync(filePath, copyPath);
    const SQL = await getSqlJs();
    const database = new SQL.Database(fs.readFileSync(copyPath));
    try {
      const [table] = database.exec(`SELECT COUNT(*) AS count FROM urls WHERE url LIKE 'http%'`);
      return Number(table?.values[0]?.[0] ?? 0);
    } finally { database.close(); }
  } finally {
    try { fs.unlinkSync(copyPath); } catch { /* temporary file cleanup is best effort */ }
  }
}

function decodeBookmarkText(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function readHtmlBookmarks(filePath: string) {
  const html = fs.readFileSync(filePath, 'utf8');
  const bookmarks: { title: string; url: string; folder: string }[] = [];
  const anchor = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (let match = anchor.exec(html); match; match = anchor.exec(html)) {
    const url = decodeBookmarkText(match[1]);
    if (/^https?:\/\//i.test(url)) {
      bookmarks.push({ title: decodeBookmarkText(match[2]) || url, url, folder: 'Imported bookmarks' });
    }
  }
  return bookmarks;
}

function registerIpcHandlers() {
  ipcMain.handle('import:list-browsers', async () => (await browserProfiles()).map(({ id, name, available, profiles }) => ({ id, name, available, profiles: profiles.map(({ name: profileName, bookmarkCount, historyCount }) => ({ name: profileName, bookmarkCount, historyCount })) })));
  ipcMain.handle('import:scan-browser', async (_e, browserId: string) => {
    const browser = (await browserProfiles()).find((candidate) => candidate.id === browserId);
    if (!browser) throw new Error('Unsupported browser.');
    return { id: browser.id, name: browser.name, available: browser.available, profiles: browser.profiles.map(({ name, bookmarkCount, historyCount }) => ({ name, bookmarkCount, historyCount })) };
  });
  ipcMain.handle('import:bookmarks', async (_e, browserId: string, profileName: string) => {
    const browser = (await browserProfiles()).find((b) => b.id === browserId);
    const profile = browser?.profiles.find((p) => p.name === profileName);
    if (!profile) throw new Error('Browser profile was not found. Close the browser and try again.');
    return readChromiumBookmarks(profile.bookmarksPath);
  });
  ipcMain.handle('import:history', async (_e, browserId: string, profileName: string) => {
    const browser = (await browserProfiles()).find((candidate) => candidate.id === browserId);
    const profile = browser?.profiles.find((candidate) => candidate.name === profileName);
    if (!profile || !fs.existsSync(profile.historyPath)) throw new Error('Browsing history was not found in this browser profile.');
    return await readChromiumHistory(profile.historyPath);
  });
  ipcMain.handle('import:bookmarks-html', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import bookmarks',
      properties: ['openFile'],
      filters: [{ name: 'Bookmarks export', extensions: ['html', 'htm'] }],
    });
    if (result.canceled || !result.filePaths[0]) return [];
    return readHtmlBookmarks(result.filePaths[0]);
  });
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    }
    mainWindow.maximize();
    return true;
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

  ipcMain.handle('shell:open-path', async (_e, filePath: string) => {
    if (filePath) await shell.openPath(filePath);
  });
  ipcMain.handle('shell:show-item', async (_e, filePath: string) => {
    if (filePath) shell.showItemInFolder(filePath);
  });
  ipcMain.handle('shell:open-external', async (_e, url: string) => {
    if (isNavigableUrl(url)) await shell.openExternal(url);
  });

  ipcMain.handle('dialog:select-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Download Folder',
    });
    if (result.canceled || !result.filePaths[0]) return null;
    downloadPath = result.filePaths[0];
    return downloadPath;
  });

  ipcMain.handle('downloads:default-path', () => app.getPath('downloads'));
  ipcMain.handle('downloads:set-path', (_e, next: string) => {
    downloadPath = next || '';
    return downloadPath;
  });
  ipcMain.handle('downloads:cancel', (_e, id: string) => downloadItems.get(id)?.cancel());
  ipcMain.handle('downloads:pause', (_e, id: string) => downloadItems.get(id)?.pause());
  ipcMain.handle('downloads:resume', (_e, id: string) => {
    const item = downloadItems.get(id);
    if (item?.canResume()) item.resume();
  });

  ipcMain.handle('shield:set', (_e, enabled: boolean, level: typeof shieldLevel) => {
    shieldEnabled = enabled;
    if (level) shieldLevel = level;
  });
}

app.setName('Vesper');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.vesper.browser');
}

app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar,FluentOverlayScrollbar');

app.whenReady().then(() => {
  downloadPath = app.getPath('downloads');
  wireSession(browseSession());
  registerIpcHandlers();

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      if (!isNavigableUrl(params.src)) {
        event.preventDefault();
        return;
      }
      webPreferences.nodeIntegration = false;
      webPreferences.webSecurity = true;
      webPreferences.allowRunningInsecureContent = false;
      webPreferences.sandbox = true;
      webPreferences.contextIsolation = true;
      delete webPreferences.preload;
    });
    if (contents.getType() === 'webview') {
      attachWebContents(contents);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
