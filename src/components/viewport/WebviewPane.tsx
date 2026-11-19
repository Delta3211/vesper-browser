import React, { useEffect, useRef } from 'react';
import type { Tab } from '../../types/browser';
import { useBrowserStore } from '../../store/browserStore';
import { NewTabPage } from './NewTabPage';
import { BookmarksPage, HistoryPage, DownloadsPage } from './InternalPages';
import { isElectron } from '../../lib/electronBridge';
import {
  emitFoundInPage,
  registerWebview,
  unregisterWebview,
  navigateWebview,
} from '../../lib/webviewRegistry';
import { Globe, RotateCw } from 'lucide-react';

interface WebviewPaneProps {
  tab: Tab;
  paneType: 'left' | 'right';
  isActivePane: boolean;
}

function VesperPage({ url, tabId }: { url: string; tabId: string }) {
  if (url.startsWith('vesper://newtab')) return <NewTabPage tabId={tabId} />;
  if (url.startsWith('vesper://bookmarks')) return <BookmarksPage tabId={tabId} />;
  if (url.startsWith('vesper://history')) return <HistoryPage tabId={tabId} />;
  if (url.startsWith('vesper://downloads')) return <DownloadsPage />;
  if (url.startsWith('vesper://settings')) {
    return <NewTabPage tabId={tabId} />;
  }
  return <NewTabPage tabId={tabId} />;
}

function DevModePlaceholder({ url, domain }: { url: string; domain: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: '#1c1d22' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#181a1f', border: '1px solid #2b2738' }}>
        <Globe className="w-7 h-7" style={{ color: '#8b5cf6' }} />
      </div>
      <h2 className="text-base font-semibold mb-1" style={{ color: '#f1eff5' }}>{domain}</h2>
      <p className="text-xs font-mono mb-4 max-w-sm truncate" style={{ color: '#9c8188' }}>{url}</p>
      <p className="text-sm max-w-md leading-relaxed" style={{ color: '#9c8188' }}>
        Vesper needs the desktop shell to load real websites. From this folder run
        {' '}<span className="font-mono" style={{ color: '#a078ff' }}>npm run electron:dev</span>.
      </p>
    </div>
  );
}

export const WebviewPane: React.FC<WebviewPaneProps> = ({ tab, paneType, isActivePane }) => {
  const { setActivePane, updateTabState, addHistoryItem, reloadTab } = useBrowserStore();
  const webviewRef = useRef<HTMLElement | null>(null);
  const initialUrl = useRef(tab.url);
  const inElectron = isElectron();
  const isVesperPage = tab.url.startsWith('vesper://');

  let domain = '';
  try { domain = new URL(tab.url).hostname.replace('www.', ''); }
  catch { domain = tab.url; }

  useEffect(() => {
    if (inElectron || isVesperPage || !tab.isLoading) return;
    const t = setTimeout(() => updateTabState(tab.id, { isLoading: false }), 300);
    return () => clearTimeout(t);
  }, [tab.id, tab.url, tab.isLoading, inElectron, isVesperPage, updateTabState]);

  useEffect(() => {
    if (!inElectron || isVesperPage) return;
    const wv = webviewRef.current as (HTMLElement & {
      addEventListener: typeof HTMLElement.prototype.addEventListener;
      removeEventListener: typeof HTMLElement.prototype.removeEventListener;
      canGoBack: () => boolean;
      canGoForward: () => boolean;
    }) | null;
    if (!wv) return;

    registerWebview(tab.id, wv as never);

    const onStart = () => updateTabState(tab.id, { isLoading: true, crashed: false });
    const onStop = () => updateTabState(tab.id, {
      isLoading: false,
      canGoBack: wv.canGoBack?.() ?? false,
      canGoForward: wv.canGoForward?.() ?? false,
    });
    const onTitle = (e: Event) => {
      const title = (e as Event & { title?: string }).title;
      if (title) {
        updateTabState(tab.id, { title });
        const current = useBrowserStore.getState().tabs.find(t => t.id === tab.id);
        if (current && !current.url.startsWith('vesper://')) {
          addHistoryItem({ url: current.url, title, favicon: current.favicon, visitedAt: Date.now() });
        }
      }
    };
    const onFavicon = (e: Event) => {
      const f = (e as Event & { favicons?: string[] }).favicons?.[0];
      if (f) updateTabState(tab.id, { favicon: f });
    };
    const onNav = (e: Event) => {
      const url = (e as Event & { url?: string }).url;
      updateTabState(tab.id, {
        url: url ?? tab.url,
        canGoBack: wv.canGoBack?.() ?? false,
        canGoForward: wv.canGoForward?.() ?? false,
      });
    };
    const onCrash = () => updateTabState(tab.id, { crashed: true, isLoading: false });
    const onFail = (e: Event) => {
      const err = e as Event & { errorCode?: number; errorDescription?: string };
      if (err.errorCode === -3) return;
      updateTabState(tab.id, { isLoading: false });
    };
    const onFound = (e: Event) => {
      const result = (e as Event & { result?: { activeMatchOrdinal: number; matches: number } }).result;
      if (result) emitFoundInPage(tab.id, result.activeMatchOrdinal, result.matches);
    };

    wv.addEventListener('did-start-loading', onStart);
    wv.addEventListener('did-stop-loading', onStop);
    wv.addEventListener('page-title-updated', onTitle);
    wv.addEventListener('page-favicon-updated', onFavicon);
    wv.addEventListener('did-navigate', onNav);
    wv.addEventListener('did-navigate-in-page', onNav);
    wv.addEventListener('crashed', onCrash);
    wv.addEventListener('did-fail-load', onFail);
    wv.addEventListener('found-in-page', onFound);

    return () => {
      unregisterWebview(tab.id);
      wv.removeEventListener('did-start-loading', onStart);
      wv.removeEventListener('did-stop-loading', onStop);
      wv.removeEventListener('page-title-updated', onTitle);
      wv.removeEventListener('page-favicon-updated', onFavicon);
      wv.removeEventListener('did-navigate', onNav);
      wv.removeEventListener('did-navigate-in-page', onNav);
      wv.removeEventListener('crashed', onCrash);
      wv.removeEventListener('did-fail-load', onFail);
      wv.removeEventListener('found-in-page', onFound);
    };
  }, [tab.id, inElectron, isVesperPage, updateTabState, addHistoryItem]);

  useEffect(() => {
    if (!inElectron || isVesperPage) return;
    if (tab.url === initialUrl.current) return;
    navigateWebview(tab.id, tab.url);
  }, [tab.id, tab.url, inElectron, isVesperPage]);

  if (isVesperPage) {
    return (
      <div
        className="w-full h-full relative"
        onClick={() => setActivePane(paneType)}
        style={{ outline: isActivePane ? '2px solid rgba(139,92,246,0.35)' : 'none' }}
      >
        <VesperPage url={tab.url} tabId={tab.id} />
      </div>
    );
  }

  return (
    <div
      onClick={() => setActivePane(paneType)}
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: '#0b0c10',
        outline: isActivePane ? '2px solid rgba(139,92,246,0.35)' : 'none',
      }}
    >
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: inElectron ? 'white' : '#0b0c10' }}>
        {tab.isLoading && <div className="loading-bar" />}

        {tab.crashed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ backgroundColor: '#0b0c10' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1eff5' }}>This tab crashed</h3>
            <p className="text-xs mb-4" style={{ color: '#9c8188' }}>The page stopped responding.</p>
            <button
              onClick={e => { e.stopPropagation(); reloadTab(tab.id); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: '#8b5cf6' }}
            >
              Reload
            </button>
          </div>
        )}

        {inElectron ? (
          <webview
            ref={el => { webviewRef.current = el; }}
            src={initialUrl.current}
            partition="persist:vesper"
            allowpopups={true}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <DevModePlaceholder url={tab.url} domain={domain} />
        )}

        {tab.isLoading && !inElectron && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backgroundColor: 'rgba(11,12,16,0.6)' }}>
            <RotateCw className="w-5 h-5 animate-spin mb-2" style={{ color: '#8b5cf6' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WebviewPane;
