type FindOptions = { forward?: boolean; findNext?: boolean };

type WebviewEl = HTMLElement & {
  src: string;
  loadURL?: (url: string) => Promise<void> | void;
  getURL?: () => string;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  setAudioMuted: (muted: boolean) => void;
  findInPage: (text: string, options?: FindOptions) => void;
  stopFindInPage: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void;
  setZoomFactor: (factor: number) => void;
  getZoomFactor: () => number;
  openDevTools: () => void;
};

const webviews = new Map<string, WebviewEl>();
const zoom = new Map<string, number>();
const foundListeners = new Map<string, (active: number, total: number) => void>();

function ready(wv: WebviewEl, fn: () => void) {
  try {
    wv.getURL?.();
    fn();
  } catch {
    wv.addEventListener('dom-ready', () => fn(), { once: true });
  }
}

export function registerWebview(tabId: string, el: WebviewEl | null) {
  if (!el) {
    webviews.delete(tabId);
    return;
  }
  webviews.set(tabId, el);
  const factor = zoom.get(tabId) ?? 1;
  ready(el, () => {
    try { el.setZoomFactor(factor); } catch { /* not attached yet */ }
  });
}

export function unregisterWebview(tabId: string) {
  webviews.delete(tabId);
}

export function getWebview(tabId: string) {
  return webviews.get(tabId);
}

export function navigateWebview(tabId: string, url: string) {
  const wv = webviews.get(tabId);
  if (!wv || url.startsWith('vesper://')) return;
  ready(wv, () => {
    try {
      const current = wv.getURL?.() ?? '';
      if (current === url) return;
      if (wv.loadURL) wv.loadURL(url);
      else wv.src = url;
    } catch {
      wv.src = url;
    }
  });
}

export function reloadWebview(tabId: string) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.reload());
}

export function stopWebview(tabId: string) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.stop());
}

export function goBackWebview(tabId: string) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => { if (wv.canGoBack()) wv.goBack(); });
}

export function goForwardWebview(tabId: string) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => { if (wv.canGoForward()) wv.goForward(); });
}

export function muteWebview(tabId: string, muted: boolean) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.setAudioMuted(muted));
}

export function findInWebview(tabId: string, query: string, options?: FindOptions) {
  const wv = webviews.get(tabId);
  if (!wv) return;
  ready(wv, () => {
    if (!query) {
      wv.stopFindInPage('clearSelection');
      return;
    }
    wv.findInPage(query, options);
  });
}

export function stopFindInWebview(tabId: string) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.stopFindInPage('clearSelection'));
}

export function onFoundInPage(tabId: string, cb: (active: number, total: number) => void) {
  foundListeners.set(tabId, cb);
  return () => {
    if (foundListeners.get(tabId) === cb) foundListeners.delete(tabId);
  };
}

export function emitFoundInPage(tabId: string, active: number, total: number) {
  foundListeners.get(tabId)?.(active, total);
}

export function adjustZoom(tabId: string, delta: number) {
  const next = Math.min(3, Math.max(0.5, (zoom.get(tabId) ?? 1) + delta));
  zoom.set(tabId, next);
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.setZoomFactor(next));
  return next;
}

export function resetZoom(tabId: string) {
  zoom.set(tabId, 1);
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.setZoomFactor(1));
}

export function openDevTools(tabId: string) {
  const wv = webviews.get(tabId);
  if (wv) ready(wv, () => wv.openDevTools());
}
