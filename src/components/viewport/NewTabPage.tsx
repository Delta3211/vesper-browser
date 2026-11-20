import React, { useState, useRef, useEffect } from 'react';
import { Shield, ArrowUp } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

interface NewTabPageProps {
  tabId: string;
}

export const NewTabPage: React.FC<NewTabPageProps> = ({ tabId }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigateTab, setSettingsModalOpen } = useBrowserStore();

  useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);

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

  return (
    <div
      className="flex-1 h-full bg-[#1c1d22] flex flex-col items-center justify-center p-6 relative overflow-y-auto select-none"
      data-purpose="new-tab-content"
    >
      {/* Central Stack */}
      <div className="w-full max-w-[540px] flex flex-col items-center">
        {/* Main Big Hero Logo: Exact Grey V Logo from Specification */}
        <div className="mb-8 flex items-center justify-center relative">
          <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-gradient-to-b from-[#1c1c24] to-[#121318] shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_30px_rgba(147,51,234,0.18)] border border-white/10 flex items-center justify-center p-2.5 transition-all duration-300 hover:shadow-[0_8px_35px_rgba(147,51,234,0.3)] hover:scale-105 cursor-default">
            <img
              src="/vesper-gray-hero.png"
              alt="Vesper Ribbon Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = './vesper-slate-logo.png';
              }}
            />
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="w-full max-w-[540px] h-11 bg-[#16181f] border border-[#262933] focus-within:border-[#8b5cf6] rounded-xl flex items-center px-3.5 gap-3 shadow-lg transition-all">
            {/* Static Prefix Badge: Non-deletable pill with green active dot */}
            <div className="bg-[#1f222b] text-neutral-300 text-[11px] px-2 py-1 rounded-md flex items-center gap-1.5 border border-[#2b2f3c] flex-shrink-0 select-none pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Encrypted search</span>
            </div>

            {/* Input Field: Placeholder "Search anything or enter URL..." */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything or enter URL..."
              className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none border-none p-0 focus:ring-0 font-normal selection:bg-purple-600 selection:text-white"
              spellCheck={false}
              autoComplete="off"
            />

            {/* Suffix: / shortcut keycap */}
            <kbd className="text-[10px] text-neutral-500 bg-[#20222b] px-1.5 py-0.5 rounded border border-[#2d313d] font-mono shrink-0 select-none">
              /
            </kbd>

            {/* Suffix: Submit arrow button */}
            <button
              type="submit"
              title="Submit search (Enter)"
              className="w-7 h-7 rounded-lg bg-[#20222b] hover:bg-[#8b5cf6] text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Typography Block */}
        <div className="text-center mt-6 flex flex-col items-center">
          <h1 className="text-xl font-semibold text-white tracking-tight mt-6 text-center leading-snug">
            Browse privately. No tracking. No telemetry.<br />
            100% encrypted.
          </h1>

          <p className="text-xs text-neutral-400 mt-1.5 text-center font-normal">
            Your data stays on your device. Always private by design.
          </p>

          {/* Privacy Pill */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="mt-4 px-3 py-1 bg-[#16171d] border border-[#232630] rounded-full text-[11px] text-neutral-400 flex items-center gap-1.5 hover:border-purple-500/30 hover:text-neutral-200 transition-all cursor-pointer group"
            title="Privacy settings"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Zero telemetry active · AES-256</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTabPage;
