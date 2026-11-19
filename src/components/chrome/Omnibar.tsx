import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Columns,
} from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const Omnibar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    splitTabId,
    activePane,
    navigateTab,
    toggleSplitView,
    setCertificateModalOpen,
  } = useBrowserStore();

  const currentTab = tabs.find((t) => t.id === (activePane === 'left' ? activeTabId : splitTabId || activeTabId));
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentTab) {
      setInputValue(currentTab.url.startsWith('vesper://newtab') ? '' : currentTab.url);
    }
  }, [currentTab?.url, currentTab?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTab || !inputValue.trim()) return;
    navigateTab(currentTab.id, inputValue);
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const getCleanDomain = (url: string) => {
    try {
      if (url.startsWith('vesper://')) return 'vesper://';
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const isVesperTab = currentTab?.url.startsWith('vesper://');

  return (
    <div className="relative flex-1 max-w-2xl mx-auto flex items-center h-8 no-drag">
      <form
        onSubmit={handleSubmit}
        className={`w-full h-full flex items-center px-2.5 rounded-lg border transition-all duration-150 ${
          isFocused
            ? 'bg-[#1b1b1e] border-purple-500/70 shadow-[0_0_12px_rgba(139,92,246,0.18)]'
            : 'bg-[#18181b]/80 hover:bg-[#1b1b1e] border-[#27272a] hover:border-[#3f3f46]'
        }`}
      >
        {/* Security Padlock */}
        <button
          type="button"
          onClick={() => setCertificateModalOpen(true)}
          title="View Site Security & Certificate (TLS 1.3)"
          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
            isVesperTab
              ? 'text-purple-400 hover:bg-purple-500/10'
              : currentTab?.url.startsWith('https://')
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          {currentTab?.url.startsWith('https://') ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
          {!isFocused && (
            <span className="text-[11px] font-mono text-zinc-300 font-semibold tracking-tight">
              {getCleanDomain(currentTab?.url || 'vesper://newtab')}
            </span>
          )}
        </button>

        {/* Omnibar Input */}
        <div className="relative flex-1 flex items-center h-full ml-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder="Search or enter URL (Ctrl+L)"
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => {
              setIsFocused(true);
              e.target.select();
            }}
            onBlur={() => setIsFocused(false)}
            className={`w-full h-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 outline-none font-sans ${
              !isFocused ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'
            }`}
          />
          {!isFocused && (
            <span className="text-xs text-zinc-500 truncate select-none pl-1 font-sans">
              {currentTab?.url.startsWith('vesper://newtab')
                ? 'Search or jump to URL'
                : currentTab?.url.replace(/^https?:\/\//, '')}
            </span>
          )}
        </div>

        {/* Right Action Icons inside Omnibar */}
        <div className="flex items-center gap-1 text-zinc-400 ml-2">
          {/* Split View Shortcut Button */}
          <button
            type="button"
            onClick={toggleSplitView}
            title="Split View (Ctrl+\)"
            className={`p-1 rounded hover:bg-zinc-800 hover:text-white transition ${
              splitTabId ? 'text-purple-400 bg-purple-500/15' : 'text-zinc-400'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
