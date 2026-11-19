import React, { useState, useEffect, useRef } from 'react';
import { useBrowserStore } from '../../store/browserStore';
import { minimizeWindow, toggleMaximizeWindow, closeWindow, getPlatform } from '../../lib/electronBridge';

export const WindowFrame: React.FC = () => {
  const {
    tabs, activeTabId, splitTabId, activePane,
    omnibarInput, isOmnibarFocused,
    setIsOmnibarFocused,
    navigateTab, goBack, goForward, reloadTab, stopTab,
    createTab,
    setDownloadsDrawerOpen, downloadsDrawerOpen,
    toggleSidebar, history, bookmarks, settings,
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
  }, [isOmnibarFocused, activeTab]);

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

  const displayUrl = activeTab?.url || 'vesper://newtab';

  return (
    <header
      className="fixed top-0 left-0 right-0 h-10 border-b border-[#1b1c22] flex items-center justify-between px-4 z-30 bg-[#16171d] select-none text-xs"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Browser History & Tab Toggle Controls */}
      <div className="flex items-center space-x-1.5 text-gray-400 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isMac ? (
          <div className="flex items-center gap-1.5 mr-2">
            <button onClick={closeWindow} className="w-3 h-3 rounded-full transition-opacity hover:opacity-70 cursor-pointer" style={{ backgroundColor: '#ff5f56' }} title="Close" />
            <button onClick={minimizeWindow} className="w-3 h-3 rounded-full transition-opacity hover:opacity-70 cursor-pointer" style={{ backgroundColor: '#ffbd2e' }} title="Minimize" />
            <button onClick={() => toggleMaximizeWindow().then(m => setIsMaximized(m))} className="w-3 h-3 rounded-full transition-opacity hover:opacity-70 cursor-pointer" style={{ backgroundColor: '#27c93f' }} title="Zoom" />
          </div>
        ) : null}

        {/* Sidebar Toggle Icon */}
        <button
          onClick={toggleSidebar}
          className="hover:text-gray-200 hover:bg-white/5 transition-all p-1.5 rounded active:scale-95 cursor-pointer"
          title="Toggle sidebar"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect height="16" rx="2" strokeWidth="1.8" width="18" x="3" y="4" />
            <path d="M9 4v16" strokeWidth="1.8" />
          </svg>
        </button>

        {/* Back Button */}
        <button
          onClick={() => goBack(currentTabId)}
          disabled={!activeTab?.canGoBack}
          className="hover:text-gray-200 hover:bg-white/5 transition-all p-1.5 rounded active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          title="Back"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>

        {/* Forward Button */}
        <button
          onClick={() => goForward(currentTabId)}
          disabled={!activeTab?.canGoForward}
          className="hover:text-gray-200 hover:bg-white/5 transition-all p-1.5 rounded active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          title="Forward"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>

        {/* Reload Button */}
        <button
          onClick={() => activeTab?.isLoading ? stopTab(currentTabId) : reloadTab(currentTabId)}
          className="hover:text-gray-200 hover:bg-white/5 transition-all p-1.5 rounded active:scale-95 group cursor-pointer"
          title={activeTab?.isLoading ? 'Stop' : 'Reload'}
          type="button"
        >
          <svg className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180 group-active:rotate-360" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Central Omnibox */}
      <div className="flex-1 max-w-lg mx-4 flex items-center justify-center relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <form onSubmit={submit} className="w-full">
          <div
            className="w-full h-7 bg-[#14151b] hover:bg-[#1a1b22] border border-[#262832] hover:border-purple-500/30 rounded-lg px-2.5 flex items-center justify-between text-xs text-gray-300 transition-colors cursor-text group"
            onClick={() => { if (!editing) { onFocus(); inputRef.current?.focus(); }}}
          >
            <div className="flex items-center space-x-2 truncate flex-1 min-w-0">
              <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              {!editing ? (
                <span className="text-[12px] font-mono text-purple-300 select-all truncate">
                  {displayUrl}
                </span>
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
                  className="w-full bg-transparent border-none outline-none text-[12px] font-mono text-purple-200 placeholder-gray-500 p-0 focus:ring-0"
                  spellCheck={false}
                  autoComplete="off"
                />
              )}
            </div>

            {!editing && (
              <div className="flex items-center space-x-1.5 text-gray-500 shrink-0">
                <span className="text-[10px] font-mono px-1 rounded bg-[#20212b] border border-white/5 opacity-70 group-hover:opacity-100">
                  Ctrl+L
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Suggestions dropdown */}
        {editing && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-[34px] z-[80] rounded-xl overflow-hidden bg-[#181920]/95 backdrop-blur-xl border border-purple-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(147,51,234,0.18)]"
          >
            {suggestions.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); go(item.url); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left cursor-pointer transition-colors ${
                  idx === suggestionIndex ? 'bg-[#2d2542] text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="truncate text-[12px]">{item.title}</span>
                <span className="text-[10px] font-mono ml-2 shrink-0 text-purple-300">{item.kind}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Action Icons & Window Action Buttons */}
      <div className="flex items-center shrink-0">
        {/* Header Downloads Button */}
        <div className="flex items-center space-x-1 mr-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => setDownloadsDrawerOpen(!downloadsDrawerOpen)}
            className="relative p-1.5 rounded-md text-white bg-purple-600/30 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all active:scale-95 group cursor-pointer"
            id="btn-header-downloads"
            title="Downloads (Ctrl+J)"
            type="button"
          >
            <svg className="w-4 h-4 text-purple-300 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
          </button>
        </div>

        {/* Windows Native Window Action Buttons */}
        {!isMac && (
          <div className="flex items-center h-10 -mr-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {/* Minimize */}
            <button
              onClick={minimizeWindow}
              className="h-full px-3.5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Minimize"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <rect height="1" width="16" y="7" />
              </svg>
            </button>
            {/* Maximize / Restore */}
            <button
              onClick={() => toggleMaximizeWindow().then(m => setIsMaximized(m))}
              className="h-full px-3.5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isMaximized ? 'Restore' : 'Maximize'}
              type="button"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                <rect height="12" strokeWidth="1.2" width="12" x="2" y="2" />
              </svg>
            </button>
            {/* Close */}
            <button
              onClick={closeWindow}
              className="h-full px-4 hover:bg-red-600 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default WindowFrame;
