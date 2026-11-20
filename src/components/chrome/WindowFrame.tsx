import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  PanelLeft,
  Download,
  Minus,
  Square,
} from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { minimizeWindow, toggleMaximizeWindow, closeWindow } from '../../lib/electronBridge';

export const WindowFrame: React.FC = () => {
  const {
    tabs,
    activeTabId,
    splitTabId,
    activePane,
    omnibarInput,
    isOmnibarFocused,
    setIsOmnibarFocused,
    navigateTab,
    goBack,
    goForward,
    reloadTab,
    stopTab,
    createTab,
    toggleSidebar,
    setDownloadsDrawerOpen,
    downloadsDrawerOpen,
    history,
    bookmarks,
    settings,
  } = useBrowserStore();

  const [editing, setEditing] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTabId = activePane === 'left' ? activeTabId : (splitTabId ?? activeTabId);
  const activeTab = tabs.find((t) => t.id === currentTabId);

  useEffect(() => {
    if (!editing) {
      setLocalInput(omnibarInput);
    }
  }, [omnibarInput, editing]);

  useEffect(() => {
    if (isOmnibarFocused && inputRef.current) {
      setEditing(true);
      const initial = activeTab?.url?.startsWith('vesper://') ? '' : (activeTab?.url ?? '');
      setLocalInput(initial);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isOmnibarFocused]);

  const go = (value: string) => {
    if (!value.trim()) return;
    if (currentTabId) navigateTab(currentTabId, value);
    else createTab(value);
    setEditing(false);
    setIsOmnibarFocused(false);
    inputRef.current?.blur();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pick = suggestions[suggestionIndex];
    go(pick?.url || localInput);
  };

  const onFocus = () => {
    setEditing(true);
    const initial = activeTab?.url?.startsWith('vesper://') ? '' : (activeTab?.url ?? '');
    setLocalInput(initial);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const onBlur = () => {
    setEditing(false);
    setIsOmnibarFocused(false);
    setLocalInput(omnibarInput);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditing(false);
      setIsOmnibarFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setSuggestionIndex((i) => (i + 1) % suggestions.length);
    }
    if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    }
  };

  const suggestions = (() => {
    const q = localInput.trim().toLowerCase();
    if (!editing || q.length < 1) return [];
    const fromHistory = history
      .filter((h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q))
      .slice(0, 5)
      .map((h) => ({ id: h.id, title: h.title, url: h.url, kind: 'History' as const }));
    const fromBookmarks = bookmarks
      .filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      .slice(0, 3)
      .map((b) => ({ id: b.id, title: b.title, url: b.url, kind: 'Bookmark' as const }));
    const merged: { id: string; title: string; url: string; kind: 'History' | 'Bookmark' | 'Search' }[] = [
      ...fromBookmarks,
      ...fromHistory,
    ].filter((item, idx, arr) => arr.findIndex((x) => x.url === item.url) === idx);

    if (q) {
      merged.unshift({
        id: 'typed',
        title:
          localInput.includes('.') && !localInput.includes(' ')
            ? `Go to ${localInput}`
            : `Search ${settings.defaultSearchEngine} for "${localInput}"`,
        url: localInput,
        kind: 'Search',
      });
    }
    return merged.slice(0, 8);
  })();

  const rawUrl = activeTab?.url || 'vesper://newtab';
  const isSecure = rawUrl.startsWith('https://') || rawUrl.startsWith('vesper://');

  return (
    <header
      className="h-11 min-h-[44px] max-h-[44px] bg-[#111317] border-b border-[#1f2128] flex items-center justify-between px-3 gap-3 relative z-30 select-none text-neutral-200"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* ── Left Navigation Controls ── */}
      <div
        className="flex items-center gap-2 flex-shrink-0 text-neutral-400 text-sm"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-[#1f2128] hover:text-white transition-colors cursor-pointer"
          title="Toggle sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Back */}
        <button
          type="button"
          onClick={() => currentTabId && goBack(currentTabId)}
          disabled={!activeTab?.canGoBack}
          className="p-1 rounded hover:bg-[#1f2128] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Back (Alt+Left)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Forward */}
        <button
          type="button"
          onClick={() => currentTabId && goForward(currentTabId)}
          disabled={!activeTab?.canGoForward}
          className="p-1 rounded hover:bg-[#1f2128] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Forward (Alt+Right)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Reload / Stop */}
        <button
          type="button"
          onClick={() => {
            if (!currentTabId) return;
            if (activeTab?.isLoading) stopTab(currentTabId);
            else reloadTab(currentTabId);
          }}
          className="p-1 rounded hover:bg-[#1f2128] hover:text-white transition-colors cursor-pointer"
          title={activeTab?.isLoading ? 'Stop (Esc)' : 'Reload (Ctrl+R)'}
        >
          {activeTab?.isLoading ? (
            <X className="w-4 h-4" />
          ) : (
            <RotateCw className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* ── Omnibox (URL Bar) Container ── */}
      <div
        className="flex-1 max-w-[560px] mx-auto h-7 min-h-[28px] bg-[#1a1c23] hover:bg-[#20222b] border border-[#2a2d38] rounded-md flex items-center px-2.5 gap-2 text-xs flex-shrink-0 transition-all cursor-text relative"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        onClick={() => {
          if (!editing) {
            onFocus();
            inputRef.current?.focus();
          }
        }}
      >
        {editing ? (
          <form onSubmit={submit} className="w-full flex items-center gap-2">
            <span className="text-[11px] select-none text-neutral-400">
              {isSecure ? '🔒' : '🌐'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              placeholder="Search or enter web address..."
              className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-xs font-mono focus:outline-none border-none p-0"
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        ) : (
          <>
            {/* Prefix: Lock icon + text vesper://newtab */}
            <span className="text-[11px] select-none text-neutral-300 shrink-0">
              {isSecure ? '🔒' : '🌐'}
            </span>
            <span className="text-neutral-300 font-mono text-[11px] truncate flex-1 min-w-0">
              {rawUrl}
            </span>

            {/* Suffix: Shortcut keycap Ctrl+L */}
            <kbd className="text-[10px] text-neutral-500 bg-[#252833] px-1.5 py-0.5 rounded border border-[#323644] ml-auto shrink-0 font-mono select-none">
              Ctrl+L
            </kbd>
          </>
        )}

        {/* Suggestion Dropdown */}
        {editing && suggestions.length > 0 && (
          <div className="absolute top-[34px] left-0 right-0 bg-[#161421] border border-[#3b3552] rounded-lg shadow-2xl overflow-hidden z-50 py-1">
            {suggestions.map((item, idx) => (
              <div
                key={item.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(item.url);
                }}
                className={`px-3 py-1.5 flex items-center justify-between text-xs cursor-pointer ${
                  idx === suggestionIndex ? 'bg-[#28223a] text-white' : 'text-neutral-300 hover:bg-[#201d2d]'
                }`}
              >
                <span className="truncate flex-1">{item.title}</span>
                <span className="text-[10px] text-neutral-500 font-mono ml-2 uppercase shrink-0">
                  {item.kind}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Utility & Window Controls ── */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Downloads Button */}
        <button
          type="button"
          onClick={() => setDownloadsDrawerOpen(!downloadsDrawerOpen)}
          className="text-neutral-400 hover:text-white p-1 rounded hover:bg-[#1f2128] transition-colors cursor-pointer"
          title="Downloads (Ctrl+J)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Window Controls: Minimize, Maximize, Close */}
        <div className="flex items-center gap-1">
          {/* Minimize (—) */}
          <button
            type="button"
            onClick={minimizeWindow}
            className="text-neutral-400 hover:text-white p-1 px-1.5 rounded hover:bg-[#1f2128] transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize (▢) */}
          <button
            type="button"
            onClick={toggleMaximizeWindow}
            className="text-neutral-400 hover:text-white p-1 px-1.5 rounded hover:bg-[#1f2128] transition-colors cursor-pointer"
            title="Maximize"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Close (✕) */}
          <button
            type="button"
            onClick={closeWindow}
            className="text-neutral-400 hover:text-white p-1 px-1.5 rounded hover:bg-rose-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default WindowFrame;
