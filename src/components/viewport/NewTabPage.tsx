import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const NewTabPage: React.FC<{ tabId: string }> = ({ tabId }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigateTab, settings, pinnedApps, bookmarks, history } = useBrowserStore();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigateTab(tabId, query);
  };

  // Quick links — from pinned apps or defaults
  const quickLinks = pinnedApps.length > 0
    ? pinnedApps.slice(0, 6)
    : [
        { id: '1', name: 'Google',  url: 'https://google.com',         domain: 'google.com' },
        { id: '2', name: 'YouTube', url: 'https://youtube.com',        domain: 'youtube.com' },
        { id: '3', name: 'GitHub',  url: 'https://github.com',         domain: 'github.com' },
        { id: '4', name: 'Reading', url: 'vesper://bookmarks/reading', domain: '' },
      ];

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center select-none overflow-hidden relative animate-fade-in"
      style={{ backgroundColor: '#0b0c10' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: 520, height: 340,
          borderRadius: '50%',
          background: 'rgba(104,7,186,0.08)',
          filter: 'blur(130px)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8 px-4">

        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-3 text-center animate-bounce-in">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#13111a', boxShadow: '0 8px 32px rgba(107,7,186,0.5)' }}
          >
            <img src="./vesper-logo.png" alt="Vesper" className="w-14 h-14 rounded-2xl" />
          </div>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: 28, color: '#f1eff5', letterSpacing: '-0.02em' }}>
            New Tab
          </h1>
          <p style={{ fontSize: 13, color: '#9c8188' }}>Search the web or type a URL</p>
        </div>

        {/* Search bar — exact spec styling */}
        <div className="w-full">
          <form onSubmit={handleSearch}>
            <div
              className="relative flex items-center w-full transition-all"
              style={{
                height: 48,
                backgroundColor: '#13151a',
                border: '1px solid #2b2738',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              onFocus={() => {}}
            >
              <Search
                className="absolute left-4 shrink-0"
                style={{ width: 20, height: 20, color: '#9c8188' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search with ${settings.defaultSearchEngine === 'google' ? 'Google' : settings.defaultSearchEngine === 'brave' ? 'Brave' : 'DuckDuckGo'} or enter address...`}
                className="w-full bg-transparent border-none outline-none px-3"
                style={{
                  paddingLeft: 48, paddingRight: 60,
                  fontSize: 14, color: '#f1eff5',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                spellCheck={false}
                autoComplete="off"
                onFocus={e => {
                  const parent = e.target.closest('div') as HTMLElement;
                  if (parent) {
                    parent.style.borderColor = '#8b5cf6';
                    parent.style.boxShadow = '0 0 0 1px #8b5cf6, 0 0 16px rgba(139,92,246,0.25)';
                  }
                }}
                onBlur={e => {
                  const parent = e.target.closest('div') as HTMLElement;
                  if (parent) {
                    parent.style.borderColor = '#2b2738';
                    parent.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                  }
                }}
              />
              <div
                className="absolute right-3 flex items-center justify-center rounded"
                style={{
                  height: 24, minWidth: 44,
                  backgroundColor: '#181a1f',
                  border: '1px solid #333538',
                  color: '#9c8188',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  paddingLeft: 8, paddingRight: 8,
                }}
              >
                Enter
              </div>
            </div>
          </form>
        </div>

        {/* Quick links grid */}
        <div className="flex items-center justify-center gap-6 pt-2 stagger-children flex-wrap">
          {[...quickLinks, ...bookmarks.slice(0, 4).map(b => ({ id: b.id, name: b.title, url: b.url, domain: (() => { try { return new URL(b.url).hostname; } catch { return ''; } })() }))].filter((link, i, arr) => arr.findIndex(x => x.url === link.url) === i).slice(0, 8).map(link => (
            <button
              key={link.id}
              onClick={() => navigateTab(tabId, link.url)}
              className="quick-link animate-fade-in flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: '#181a1f',
                  border: '1px solid #2b2738',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1c1a24';
                  (e.currentTarget as HTMLElement).style.borderColor = '#3b3252';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#181a1f';
                  (e.currentTarget as HTMLElement).style.borderColor = '#2b2738';
                }}
              >
                {link.domain ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`}
                    alt={link.name}
                    className="w-6 h-6 object-contain"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                    }}
                  />
                ) : (
                  <Globe className="w-5 h-5" style={{ color: '#dbb8ff' }} />
                )}
              </div>
              <span
                className="text-center transition-colors group-hover:text-white"
                style={{ fontSize: 12, color: '#9c8188', fontWeight: 500 }}
              >
                {link.name}
              </span>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div className="w-full max-w-xl pt-2">
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: '#6e6880' }}>Recently visited</p>
            <div className="space-y-1">
              {history.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTab(tabId, item.url)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left"
                  style={{ backgroundColor: '#13151a', border: '1px solid #1e1a2b' }}
                >
                  {item.favicon && <img src={item.favicon} alt="" className="w-4 h-4" />}
                  <span className="text-xs truncate flex-1" style={{ color: '#e2dfe8' }}>{item.title}</span>
                  <span className="text-[10px] font-mono truncate max-w-[180px]" style={{ color: '#6e6880' }}>{item.url.replace(/^https?:\/\//, '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
