import React, { useState, useRef, useEffect } from 'react';
import { Search, Shield, Globe, ArrowUp } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

interface NewTabPageProps {
  tabId: string;
}

export const NewTabPage: React.FC<NewTabPageProps> = ({ tabId }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigateTab, settings, pinnedApps, setSettingsModalOpen } = useBrowserStore();

  useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 80);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigateTab(tabId, query);
  };

  const engineName =
    settings.defaultSearchEngine === 'google'
      ? 'Google'
      : settings.defaultSearchEngine === 'brave'
      ? 'Brave'
      : 'DuckDuckGo';

  // Quick links from pinned apps or defaults
  const shortcuts = pinnedApps.length > 0
    ? pinnedApps.slice(0, 6)
    : [
        { id: 'pin-google', name: 'Google',  url: 'https://google.com',         domain: 'google.com' },
        { id: 'pin-yt',     name: 'YouTube', url: 'https://youtube.com',        domain: 'youtube.com' },
        { id: 'pin-github', name: 'GitHub',  url: 'https://github.com',         domain: 'github.com' },
        { id: 'pin-gmail',  name: 'Gmail',   url: 'https://mail.google.com',    domain: 'mail.google.com' },
      ];

  const hasInput = query.trim().length > 0;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden relative select-none"
      style={{ backgroundColor: '#131419' }}
      data-purpose="new-tab-content"
    >
      {/* Ambient Glow Behind Logo */}
      <div className="absolute w-72 h-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none animate-pulse-glow -translate-y-28" />

      {/* Main Central Container */}
      <div className="relative z-10 w-full max-w-[560px] flex flex-col items-center">
        
        {/* Minimalist Slate Ribbon V Logo with soft floating effect */}
        <div className="mb-8 flex items-center justify-center relative animate-entrance">
          <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-gradient-to-b from-[#1c1c24] to-[#121318] shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_30px_rgba(147,51,234,0.18)] border border-white/10 flex items-center justify-center p-2.5 transition-all duration-300 hover:shadow-[0_8px_35px_rgba(147,51,234,0.3)] hover:scale-105 animate-float cursor-default">
            <img
              alt="Vesper Ribbon Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              src="./vesper-logo.png"
            />
          </div>
        </div>

        {/* Central Search Omnibox with fluid focus and typing reactions */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="w-full bg-[#1a1b22]/95 border border-[#2a2c36] hover:border-purple-500/30 focus-within:!border-purple-500/80 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.22)] rounded-2xl p-3.5 shadow-2xl transition-all duration-200 animate-entrance-delay-1 group backdrop-blur-md">
            
            {/* Search Input Row */}
            <div className="flex items-center px-1.5 pb-2.5">
              <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0 transition-colors group-focus-within:text-purple-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything or enter URL..."
                className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-400 focus:outline-none border-none p-0 focus:ring-0 font-normal selection:bg-purple-600 selection:text-white"
                spellCheck={false}
                autoComplete="off"
              />
              <kbd className="text-[10px] text-gray-500 bg-[#272932] px-1.5 py-0.5 rounded border border-white/5 opacity-60 group-focus-within:opacity-0 transition-opacity font-mono">
                /
              </kbd>
            </div>

            {/* Bottom Action Row inside Omnibox */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#262832]">
              <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-normal">
                <span className="flex items-center space-x-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-gray-300">Encrypted search</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  via {engineName}
                </span>
              </div>
              <button
                type="submit"
                title="Submit Search (Enter)"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
                  hasInput
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:bg-purple-500'
                    : 'bg-[#272932] text-gray-400 hover:text-white hover:bg-purple-600'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:translate-y-[-1px]" />
              </button>
            </div>
          </div>
        </form>

        {/* Headline, Subheadline & Shimmer Privacy Badge directly below Omnibox */}
        <div className="text-center mt-7 max-w-lg animate-entrance-delay-2 flex flex-col items-center">
          <h1 className="text-[19px] font-semibold text-white tracking-normal leading-snug">
            Browse privately. No tracking. No telemetry.<br />
            100% encrypted.
          </h1>
          <p className="text-[12px] text-gray-400 mt-2 font-normal">
            Your data stays on your device. Always private by design.
          </p>

          {/* Interactive Privacy Shield Indicator Pill */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="mt-4 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1e1c28]/80 border border-purple-500/20 hover:border-purple-400/50 shadow-sm transition-all cursor-pointer group hover:bg-[#252233]"
            title="Open Privacy Settings"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium text-purple-200 group-hover:text-white transition-colors">
              Zero telemetry active
            </span>
            <span className="text-[10px] text-purple-400/80 font-mono">AES-256</span>
          </button>
        </div>

        {/* Quick Launch Pinned Shortcuts */}
        {shortcuts.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-3 animate-entrance-delay-3 flex-wrap">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => navigateTab(tabId, shortcut.url)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1b22]/70 hover:bg-[#23242e] border border-white/5 hover:border-purple-500/30 transition-all duration-200 group shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                title={`Open ${shortcut.name}`}
              >
                {shortcut.domain ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${shortcut.domain}&sz=32`}
                    alt={shortcut.name}
                    className="w-4 h-4 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-4 h-4 text-purple-300" />
                )}
                <span className="text-xs text-gray-300 group-hover:text-white font-medium transition-colors">
                  {shortcut.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTabPage;
