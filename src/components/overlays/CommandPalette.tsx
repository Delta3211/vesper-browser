import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import type { CommandItem } from '../../types/browser';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    tabs,
    workspaces,
    setActiveTab,
    createTab,
    toggleSplitView,
    toggleSidebar,
    setDownloadsDrawerOpen,
    setSettingsModalOpen,
    setFindInPageOpen,
    setShieldLevel,
    bookmarks,
    history,
    navigateTab,
    activeTabId,
    settings,
  } = useBrowserStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Tabs' | 'Workspaces' | 'Actions' | 'Bookmarks' | 'History'>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  // Build command catalogue
  const allCommands: CommandItem[] = [
    // Open Tabs
    ...tabs.map((tab) => ({
      id: `tab-${tab.id}`,
      title: tab.title,
      category: 'Tabs' as const,
      shortcut: 'Tab',
      action: () => {
        setActiveTab(tab.id);
        setCommandPaletteOpen(false);
      },
    })),

    // Workspaces
    ...workspaces.map((ws) => ({
      id: `ws-${ws.id}`,
      title: `Switch to Workspace: ${ws.name}`,
      category: 'Workspaces' as const,
      shortcut: 'Workspace',
      action: () => {
        useBrowserStore.getState().setActiveWorkspace(ws.id);
        setCommandPaletteOpen(false);
      },
    })),

    // Actions
    {
      id: 'action-new-tab',
      title: 'New Tab',
      category: 'Actions' as const,
      shortcut: 'Ctrl+T',
      action: () => {
        createTab();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-split-view',
      title: 'Toggle Split View (Side-by-Side)',
      category: 'Actions' as const,
      shortcut: 'Ctrl+\\',
      action: () => {
        toggleSplitView();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-toggle-sidebar',
      title: 'Toggle Desktop Sidebar Rail',
      category: 'Actions' as const,
      shortcut: 'Ctrl+B',
      action: () => {
        toggleSidebar();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-downloads',
      title: 'Open Downloads & File Hub',
      category: 'Actions' as const,
      shortcut: 'Ctrl+J',
      action: () => {
        setDownloadsDrawerOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-find-page',
      title: 'Find in Page',
      category: 'Actions' as const,
      shortcut: 'Ctrl+F',
      action: () => {
        setFindInPageOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-settings',
      title: 'Settings & Privacy Controls',
      category: 'Actions' as const,
      shortcut: 'Ctrl+,',
      action: () => {
        setSettingsModalOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-shield-strict',
      title: 'Vesper Shield: Enable Strict Blocking Mode',
      category: 'Actions' as const,
      shortcut: 'Shield',
      action: () => {
        setShieldLevel('Strict');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-bookmarks',
      title: 'Open Bookmarks',
      category: 'Actions' as const,
      shortcut: 'Ctrl+Shift+B',
      action: () => {
        createTab('vesper://bookmarks');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'action-history',
      title: 'Open History',
      category: 'Actions' as const,
      shortcut: 'Ctrl+H',
      action: () => {
        createTab('vesper://history');
        setCommandPaletteOpen(false);
      },
    },
    ...bookmarks.slice(0, 20).map((b) => ({
      id: `bm-${b.id}`,
      title: b.title,
      subtitle: b.url,
      category: 'Bookmarks' as const,
      action: () => {
        if (activeTabId) navigateTab(activeTabId, b.url);
        else createTab(b.url);
        setCommandPaletteOpen(false);
      },
    })),
    ...history.slice(0, 20).map((h) => ({
      id: `hist-${h.id}`,
      title: h.title,
      subtitle: h.url,
      category: 'History' as const,
      action: () => {
        if (activeTabId) navigateTab(activeTabId, h.url);
        else createTab(h.url);
        setCommandPaletteOpen(false);
      },
    })),
  ];

  if (search.trim()) {
    allCommands.unshift({
      id: 'search-web',
      title: `Search or open “${search.trim()}”`,
      category: 'Actions',
      shortcut: settings.defaultSearchEngine,
      action: () => {
        if (activeTabId) navigateTab(activeTabId, search.trim());
        else createTab(search.trim());
        setCommandPaletteOpen(false);
      },
    });
  }

  // Filtering
  const filtered = allCommands.filter((cmd) => {
    if (selectedFilter !== 'All' && cmd.category !== selectedFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-xs no-drag animate-in fade-in duration-100"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-[580px] bg-[#131316] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col text-zinc-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Rail */}
        <div className="flex items-center px-4 py-3 border-b border-[#27272a] gap-3">
          <Search className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, tab title, or action..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none font-sans"
          />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            ESC
          </span>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e0e11]/50 border-b border-[#27272a] text-xs">
          {(['All', 'Tabs', 'Workspaces', 'Actions', 'Bookmarks', 'History'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setSelectedFilter(filter);
                setSelectedIndex(0);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                selectedFilter === filter
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Command Items List */}
        <div className="max-h-[340px] overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No matching commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? 'bg-purple-600/20 text-zinc-100 border border-purple-500/40'
                      : 'text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0">
                      {cmd.category}
                    </span>
                    <span className="text-xs font-medium truncate">{cmd.title}</span>
                  </div>

                  {cmd.shortcut && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 ml-2">
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-3 py-2 bg-[#0e0e11] border-t border-[#27272a] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-purple-400">Vesper Desktop Fast Launcher</span>
        </div>
      </div>
    </div>
  );
};
