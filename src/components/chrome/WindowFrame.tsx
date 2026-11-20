import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Star, MoreHorizontal, Minus, Square, X } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { minimizeWindow, toggleMaximizeWindow, closeWindow, getPlatform } from '../../lib/electronBridge';

export const WindowFrame: React.FC = () => {
  const {
    tabs, activeTabId, splitTabId, activePane,
    omnibarInput, isOmnibarFocused,
    setIsOmnibarFocused,
    navigateTab, goBack, goForward, reloadTab, stopTab,
    createTab, setCommandPaletteOpen, commandPaletteOpen,
    setDownloadsDrawerOpen, downloadsDrawerOpen,
    toggleBookmark, bookmarks, history, settings,
  } = useBrowserStore();

  const [editing, setEditing] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = getPlatform() === 'darwin';

  const currentTabId = activePane === 'left' ? activeTabId : (splitTabId ?? activeTabId);
  const activeTab = tabs.find(t => t.id === currentTabId);

  useEffect(() => {
    if (!editing) setLocalInput(omnibarInput);
  }, [omnibarInput, editing]);

  useEffect(() => {
    if (isOmnibarFocused && inputRef.current) {
      setEditing(true);
      setLocalInput(activeTab?.url?.startsWith('vesper://') ? '' : (activeTab?.url ?? ''));
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
    }
  }, [isOmnibarFocused]);

  const go = (value: string) => {
    if (!value.trim()) return;
    if (currentTabId) navigateTab(currentTabId, value);
    else createTab(value);
    inputRef.current?.blur();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pick = suggestions[suggestionIndex];
    go(pick?.url || localInput);
  };

  const onFocus = () => {
    setEditing(true);
    setLocalInput(activeTab?.url?.startsWith('vesper://') ? '' : (activeTab?.url ?? ''));
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const onBlur = () => {
    setEditing(false);
    setIsOmnibarFocused(false);
    setLocalInput(omnibarInput);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setEditing(false); inputRef.current?.blur(); }
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setSuggestionIndex(i => (i + 1) % suggestions.length);
    }
    if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length);
    }
  };

  // Protocol details
  const suggestions = (() => {
    const q = localInput.trim().toLowerCase();
    if (!editing || q.length < 1) return [];
    const fromHistory = history
      .filter(h => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q))
      .slice(0, 5)
      .map(h => ({ id: h.id, title: h.title, url: h.url, kind: 'History' as const }));
    const fromBookmarks = bookmarks
      .filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      .slice(0, 3)
      .map(b => ({ id: b.id, title: b.title, url: b.url, kind: 'Bookmark' as const }));
    const merged: { id: string; title: string; url: string; kind: 'History' | 'Bookmark' | 'Search' }[] = [...fromBookmarks, ...fromHistory].filter(
      (item, idx, arr) => arr.findIndex(x => x.url === item.url) === idx
    );
    if (q) {
      merged.unshift({
        id: 'typed',
        title: localInput.includes('.') && !localInput.includes(' ') ? `Go to ${localInput}` : `Search ${settings.defaultSearchEngine} for “${localInput}”`,
        url: localInput,
        kind: 'Search',
      });
    }
    return merged.slice(0, 8);
  })();

  const proto = (() => {
    const url = activeTab?.url ?? '';
    if (url.startsWith('vesper://')) return { icon: '✦', iconColor: '#ff506f', prefix: 'vesper://', prefixColor: '#7c768d', domain: url.replace('vesper://', ''), domainColor: '#f1eff5', path: '' };
    if (url.startsWith('https://')) {
      try {
        const u = new URL(url);
        return { icon: '🔒', iconColor: '#22c55e', prefix: 'https://', prefixColor: '#7c768d', domain: u.hostname.replace('www.', ''), domainColor: '#e2dfe8', path: u.pathname === '/' ? '' : u.pathname };
      } catch {}
    }
    if (url.startsWith('http://')) {
      try {
        const u = new URL(url);
        return { icon: '⚠', iconColor: '#f59e0b', prefix: 'http://', prefixColor: '#7c768d', domain: u.hostname.replace('www.', ''), domainColor: '#e2dfe8', path: u.pathname === '/' ? '' : u.pathname };
      } catch {}
    }
    return { icon: '🌐', iconColor: '#9a94a8', prefix: '', prefixColor: '#7c768d', domain: url, domainColor: '#e2dfe8', path: '' };
  })();

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[50px] z-50 flex items-center justify-between px-4 select-none text-[13px] animate-slide-down"
      style={{ backgroundColor: '#14121a', borderBottom: '1px solid #252132', WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* LEFT: window controls + nav */}
      <div className="flex items-center gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isMac ? (
          <div className="flex items-center gap-1.5 mr-2">
            <button onClick={closeWindow} className="w-3 h-3 rounded-full transition-opacity hover:opacity-70" style={{ backgroundColor: '#ff5f56' }} title="Close" />
            <button onClick={minimizeWindow} className="w-3 h-3 rounded-full transition-opacity hover:opacity-70" style={{ backgroundColor: '#ffbd2e' }} title="Minimize" />
            <button onClick={() => toggleMaximizeWindow().then(m => setIsMaximized(m))} className="w-3 h-3 rounded-full transition-opacity hover:opacity-70" style={{ backgroundColor: '#27c93f' }} title="Zoom" />
          </div>
        ) : null}

        {/* Separator */}
        <div className="w-px h-4 mx-1" style={{ backgroundColor: '#292535' }} />

        {/* Nav buttons */}
        <div className="flex items-center gap-0.5" style={{ color: '#9a94a8' }}>
          <button
            onClick={() => goBack(currentTabId)}
            disabled={!activeTab?.canGoBack}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors"
            style={{ color: activeTab?.canGoBack ? '#9a94a8' : '#3a3545' }}
            onMouseEnter={e => { if (activeTab?.canGoBack) { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = activeTab?.canGoBack ? '#9a94a8' : '#3a3545'; }}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goForward(currentTabId)}
            disabled={!activeTab?.canGoForward}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors"
            style={{ color: activeTab?.canGoForward ? '#9a94a8' : '#3a3545' }}
            onMouseEnter={e => { if (activeTab?.canGoForward) { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = activeTab?.canGoForward ? '#9a94a8' : '#3a3545'; }}
            title="Forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => activeTab?.isLoading ? stopTab(currentTabId) : reloadTab(currentTabId)}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors"
            style={{ color: '#9a94a8' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9a94a8'; }}
            title={activeTab?.isLoading ? 'Stop' : 'Reload'}
          >
            {activeTab?.isLoading ? (
              <X className="w-4 h-4" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* CENTER: Omnibox */}
      <div className="flex-1 max-w-[620px] mx-4 relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <form onSubmit={submit}>
          <div
            className="h-7 w-full px-2.5 rounded-md flex items-center justify-between cursor-text transition-colors"
            style={{
              backgroundColor: editing ? '#13151a' : '#1c1a24',
              border: editing ? '1px solid #8b5cf6' : '1px solid #2b2738',
              boxShadow: editing ? '0 0 0 1px #8b5cf6, 0 0 12px rgba(139,92,246,0.15)' : 'none',
            }}
            onClick={() => { if (!editing) { onFocus(); inputRef.current?.focus(); }}}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
              {!editing && (
                <span className="text-[13px] shrink-0" style={{ color: proto.iconColor }}>{proto.icon}</span>
              )}
              {!editing ? (
                <div className="flex items-center text-[12px] truncate">
                  <span style={{ color: proto.prefixColor }}>{proto.prefix}</span>
                  <span className="font-medium" style={{ color: proto.domainColor }}>{proto.domain}</span>
                  {proto.path && <span style={{ color: proto.prefixColor }}>{proto.path.length > 30 ? proto.path.slice(0, 30) + '…' : proto.path}</span>}
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={localInput}
                  onChange={e => { setLocalInput(e.target.value); setSuggestionIndex(0); }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  onKeyDown={onKeyDown}
                  placeholder="Search or enter address..."
                  className="w-full bg-transparent border-none outline-none text-[12px] font-mono"
                  style={{ color: '#e2dfe8' }}
                  spellCheck={false}
                  autoComplete="off"
                />
              )}
            </div>
            {!editing && (
              <div className="flex items-center gap-1 shrink-0" style={{ color: '#8b8599' }}>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    if (activeTab) toggleBookmark(activeTab.url, activeTab.title);
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:text-white transition-colors"
                  title={activeTab && bookmarks.some(b => b.url === activeTab.url) ? 'Remove bookmark (Ctrl+D)' : 'Bookmark this page (Ctrl+D)'}
                >
                  <Star
                    className="w-3.5 h-3.5"
                    fill={activeTab && bookmarks.some(b => b.url === activeTab.url) ? '#fbbf24' : 'none'}
                    color={activeTab && bookmarks.some(b => b.url === activeTab.url) ? '#fbbf24' : 'currentColor'}
                  />
                </button>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#292537', color: '#a09bb0', border: '1px solid #373249' }}>Ctrl+K</span>
              </div>
            )}
          </div>
        </form>
        {editing && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-[34px] z-[80] rounded-lg overflow-hidden"
            style={{ backgroundColor: '#16141f', border: '1px solid #2b2738', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}
          >
            {suggestions.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); go(item.url); }}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
                style={{ backgroundColor: idx === suggestionIndex ? '#221c32' : 'transparent' }}
              >
                <span className="truncate text-[12px]" style={{ color: '#e2dfe8' }}>{item.title}</span>
                <span className="text-[10px] font-mono ml-2 shrink-0" style={{ color: '#6e6880' }}>{item.kind}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: utilities + Windows controls */}
      <div className="flex items-center gap-1.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => setDownloadsDrawerOpen(!downloadsDrawerOpen)}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: '#9a94a8' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9a94a8'; }}
          title="Downloads (Ctrl+J)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>

        <button
          onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: '#9a94a8' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9a94a8'; }}
          title="Split View / Settings"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Windows controls for non-macOS */}
        {!isMac && (
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={minimizeWindow}
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: '#9a94a8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9a94a8'; }}
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleMaximizeWindow().then(m => setIsMaximized(m))}
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: '#9a94a8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#201d2a'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9a94a8'; }}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={closeWindow}
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: '#9a94a8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#c0392b'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9a94a8'; }}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default WindowFrame;
