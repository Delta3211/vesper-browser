import React from 'react';
import { Plus, ChevronDown, Settings, Download, X, Globe, VolumeX } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed,
    tabs,
    activeTabId,
    activeWorkspaceId,
    setSettingsModalOpen,
    createTab,
    setActiveTab,
    closeTab,
    toggleMute,
    downloads,
    setDownloadsDrawerOpen,
    downloadsDrawerOpen,
  } = useBrowserStore();

  const currentTabs = tabs.filter(t => t.workspaceId === activeWorkspaceId);
  const activeDownloadsCount = downloads.filter(d => d.state === 'progressing').length || (downloads.length > 0 ? downloads.length : 1);

  if (sidebarCollapsed) return null;

  return (
    <aside className="w-[252px] min-w-[252px] max-w-[252px] flex-shrink-0 bg-[#16141f] border-r border-[#262137] flex flex-col justify-between p-3 pt-3.5 select-none z-40 h-full">
      {/* ── TOP SECTION ── */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Header: Vesper Actual Grey Monogram + Chevron Dropdown */}
        <div className="flex items-center justify-between px-1 pb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#252033] border border-white/10 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img
                src="/vesper-gray-sidebar.png"
                alt="Vesper"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './vesper-slate-logo.png';
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[14px] tracking-tight text-white leading-tight truncate">
                Vesper
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wide leading-tight">
                v0.2.0
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title="Workspace menu"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pinned App Grid: 2 columns, rounded tiles */}
        <div className="grid grid-cols-2 gap-2 my-2.5">
          {/* Gmail */}
          <button
            type="button"
            onClick={() => createTab('https://mail.google.com', activeWorkspaceId)}
            className="bg-[#201d2d] hover:bg-[#2a263c] h-10 flex items-center justify-center rounded-xl transition-all duration-200 group shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border border-white/5"
            title="Open Gmail"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M1.5 6.5v12a2 2 0 002 2h2.5v-9l6 4.5 6-4.5v9H20.5a2 2 0 002-2v-12l-10.5 7.875L1.5 6.5z" fill="#4285F4" />
              <path d="M22 4.5a1.5 1.5 0 00-2.25-1.3L12 9 4.25 3.2A1.5 1.5 0 002 4.5v2l10 7.5 10-7.5v-2z" fill="#EA4335" />
              <path d="M20.5 20.5H22v-14l-4 3v11h2.5z" fill="#34A853" />
              <path d="M2 6.5v14h1.5v-11l-3.5-3z" fill="#FBBC05" />
            </svg>
          </button>

          {/* Google */}
          <button
            type="button"
            onClick={() => createTab('https://google.com', activeWorkspaceId)}
            className="bg-[#201d2d] hover:bg-[#2a263c] h-10 flex items-center justify-center rounded-xl transition-all duration-200 group shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border border-white/5"
            title="Open Google"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.18 3.665-9.15z" fill="#4285F4" />
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.7-4.93H1.27v3.15C3.25 21.36 7.31 24 12 24z" fill="#34A853" />
              <path d="M5.3 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.03-3.15z" fill="#FBBC05" />
              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.58l4.03 3.15c.94-2.83 3.58-4.98 6.7-4.98z" fill="#EA4335" />
            </svg>
          </button>
        </div>

        {/* Tab List Section: Generous + New Tab Pill */}
        <button
          type="button"
          onClick={() => createTab('vesper://newtab', activeWorkspaceId)}
          className="w-full min-h-[42px] py-2 px-3 rounded-xl text-neutral-200 hover:text-white bg-[#201d2d]/90 hover:bg-[#28233a] border border-white/5 hover:border-purple-500/20 shadow-sm transition-all duration-150 flex items-center gap-2.5 mb-2 cursor-pointer group active:scale-[0.99]"
        >
          <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5 text-neutral-300 group-hover:text-purple-300 transition-colors" />
          </div>
          <span className="font-medium text-[13px]">New tab</span>
        </button>

        {/* Scrollable Tabs: Generous, Well-Proportioned Pills (Not Cut Off) */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'none' }}>
          {currentTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isNewTab = tab.url.startsWith('vesper://newtab');
            let displayTitle = isNewTab ? 'New Tab' : tab.title || 'Untitled';
            if (!isNewTab && displayTitle === tab.url) {
              try {
                displayTitle = new URL(tab.url).hostname.replace('www.', '');
              } catch {
                displayTitle = tab.url;
              }
            }

            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group min-h-[42px] py-2 px-3 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all duration-150 border ${
                  isActive
                    ? 'bg-[#2a243e] text-white font-medium border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.35),0_0_12px_rgba(168,85,247,0.18)]'
                    : 'text-neutral-300 hover:text-white bg-[#1b1926]/50 hover:bg-[#221e30] border-transparent hover:border-white/5 font-normal'
                }`}
              >
                {/* Favicon or Globe */}
                {tab.favicon && !isNewTab ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    className="w-4 h-4 rounded shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-300' : 'text-neutral-400'}`} />
                )}

                {/* Title with min-w-0 for reliable truncation */}
                <span className="truncate min-w-0 flex-1 text-[13px] leading-snug">
                  {displayTitle}
                </span>

                {/* Right controls: Mute, Close, Active indicator */}
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  {tab.isMuted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute(tab.id);
                      }}
                      className="text-amber-400 hover:text-amber-300 p-0.5"
                      title="Unmute tab"
                    >
                      <VolumeX className="w-3 h-3" />
                    </button>
                  )}

                  {/* Close Tab Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Active Indicator Pip */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)] shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM SECTION: Generous, Premium Pills ── */}
      <div className="pt-2 border-t border-[#242131] space-y-1.5 flex-shrink-0">
        {/* Downloads Trigger Pill */}
        <button
          type="button"
          onClick={() => setDownloadsDrawerOpen(!downloadsDrawerOpen)}
          className="w-full min-h-[42px] bg-[#242136] hover:bg-[#2d2843] px-3.5 py-2 rounded-xl flex items-center justify-between text-sm cursor-pointer transition-all border border-white/5 group shadow-sm active:scale-[0.99]"
          title="Downloads (Ctrl+J)"
        >
          <div className="flex items-center gap-2.5 text-neutral-200 group-hover:text-white">
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-purple-300 transition-colors" />
            <span className="font-medium text-[13px]">Downloads</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 font-mono">
            {activeDownloadsCount}
          </span>
        </button>

        {/* Settings Shortcut Pill */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="w-full min-h-[40px] hover:bg-[#201d2d] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-sm text-neutral-400 hover:text-white transition-all cursor-pointer group active:scale-[0.99]"
          title="Settings (Ctrl+,)"
        >
          <Settings className="w-4 h-4 text-neutral-400 group-hover:text-purple-300 transition-colors" />
          <span className="font-normal text-[13px]">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
