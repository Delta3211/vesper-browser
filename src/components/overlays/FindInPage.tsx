import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { findInWebview, onFoundInPage, stopFindInWebview } from '../../lib/webviewRegistry';

export const FindInPage: React.FC = () => {
  const { findInPageOpen, setFindInPageOpen, findQuery, setFindQuery, activeTabId, splitTabId, activePane } = useBrowserStore();
  const [matchCount, setMatchCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabId = activePane === 'left' ? activeTabId : splitTabId || activeTabId;

  useEffect(() => {
    if (findInPageOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      stopFindInWebview(tabId);
    }
  }, [findInPageOpen, tabId]);

  useEffect(() => {
    return onFoundInPage(tabId, (active, total) => {
      setCurrentIndex(active);
      setMatchCount(total);
    });
  }, [tabId]);

  useEffect(() => {
    if (!findInPageOpen) return;
    if (!findQuery.trim()) {
      setMatchCount(0);
      setCurrentIndex(0);
      stopFindInWebview(tabId);
      return;
    }
    findInWebview(tabId, findQuery, { findNext: false });
  }, [findQuery, findInPageOpen, tabId]);

  if (!findInPageOpen) return null;

  const handleNext = () => {
    if (!findQuery.trim()) return;
    findInWebview(tabId, findQuery, { forward: true, findNext: true });
  };

  const handlePrev = () => {
    if (!findQuery.trim()) return;
    findInWebview(tabId, findQuery, { forward: false, findNext: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFindInPageOpen(false);
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="absolute top-3 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b1e] border border-[#27272a] shadow-xl text-xs text-zinc-200 no-drag animate-in slide-in-from-top-2 duration-150">
      <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={findQuery}
        onChange={(e) => setFindQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page..."
        className="w-40 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 outline-none font-sans"
      />

      <span className="text-[10px] text-zinc-400 font-mono px-1">
        {matchCount > 0 ? `${currentIndex}/${matchCount}` : '0/0'}
      </span>

      <div className="flex items-center gap-0.5 border-l border-zinc-800 pl-1">
        <button
          onClick={handlePrev}
          title="Previous match (Shift+Enter)"
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleNext}
          title="Next match (Enter)"
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setFindInPageOpen(false)}
          title="Close (Escape)"
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition ml-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

