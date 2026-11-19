import React from 'react';
import { useBrowserStore } from '../../store/browserStore';

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed,
    tabs,
    activeTabId,
    activeWorkspaceId,
    setActiveTab,
    createTab,
    closeTab,
    setSettingsModalOpen,
    setDownloadsDrawerOpen,
    downloadsDrawerOpen,
    downloads,
  } = useBrowserStore();

  const currentTabs = tabs.filter(t => t.workspaceId === activeWorkspaceId);
  const activeDownloadsCount = downloads.filter(d => d.state === 'progressing').length || (downloads.length > 0 ? downloads.length : 1);

  if (sidebarCollapsed) return null;

  return (
    <aside
      className="fixed left-0 top-10 bottom-0 w-[230px] bg-[#1d192b] flex flex-col border-r border-[#262137] text-gray-300 text-xs tracking-normal shrink-0 z-20 select-none"
    >
      {/* Workspace Switcher & Monogram Header */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            alt="Vesper"
            className="w-5 h-5 object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            src="./vesper-logo.png"
            onClick={() => createTab('vesper://newtab')}
          />
        </div>
        <button
          className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
          title="Workspace menu"
          type="button"
          onClick={() => setSettingsModalOpen(true)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Quick Action Pinned Apps (Gmail & Google) */}
      <div className="px-3 pt-1 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => createTab('https://mail.google.com')}
            className="h-10 bg-[#2b2540] hover:bg-[#342e4d] border border-white/5 hover:border-white/15 rounded-lg flex items-center justify-center transition-all duration-200 group shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Open Gmail"
            type="button"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M1.5 6.5v12a2 2 0 002 2h2.5v-9l6 4.5 6-4.5v9H20.5a2 2 0 002-2v-12l-10.5 7.875L1.5 6.5z" fill="#4285F4" />
              <path d="M22 4.5a1.5 1.5 0 00-2.25-1.3L12 9 4.25 3.2A1.5 1.5 0 002 4.5v2l10 7.5 10-7.5v-2z" fill="#EA4335" />
              <path d="M20.5 20.5H22v-14l-4 3v11h2.5z" fill="#34A853" />
              <path d="M2 6.5v14h1.5v-11l-3.5-3z" fill="#FBBC05" />
            </svg>
          </button>
          <button
            onClick={() => createTab('https://google.com')}
            className="h-10 bg-[#2b2540] hover:bg-[#342e4d] border border-white/5 hover:border-white/15 rounded-lg flex items-center justify-center transition-all duration-200 group shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Open Google"
            type="button"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.18 3.665-9.15z" fill="#4285F4" />
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.7-4.93H1.27v3.15C3.25 21.36 7.31 24 12 24z" fill="#34A853" />
              <path d="M5.3 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.03-3.15z" fill="#FBBC05" />
              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.58l4.03 3.15c.94-2.83 3.58-4.98 6.7-4.98z" fill="#EA4335" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Tab Action Button */}
      <div className="px-3 pt-1">
        <button
          onClick={() => createTab('vesper://newtab')}
          className="w-full flex items-center space-x-2 py-2 px-2.5 rounded-md text-gray-300 hover:text-white hover:bg-[#28223a] transition-all duration-200 text-[13px] font-normal group active:scale-[0.98] cursor-pointer"
          id="btn-new-tab"
          type="button"
        >
          <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-300 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>New tab</span>
        </button>
      </div>

      {/* Tab Items List */}
      <div className="px-3 mt-1 flex-1 space-y-1 overflow-y-auto" id="sidebar-tab-list" style={{ scrollbarWidth: 'none' }}>
        {currentTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const isNewTab = tab.url.startsWith('vesper://newtab');
          let domain = '';
          try { domain = new URL(tab.url).hostname.replace('www.', ''); } catch { domain = ''; }
          const displayTitle = isNewTab
            ? 'New Tab'
            : (tab.title && tab.title !== tab.url && !tab.title.startsWith('http'))
              ? tab.title
              : domain || tab.url;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onAuxClick={e => { if (e.button === 1) { e.preventDefault(); closeTab(tab.id); } }}
              className={`tab-item group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer shadow-sm text-[13px] transition-all duration-150 ${
                isActive
                  ? 'bg-[#2d2542] text-white font-medium border border-white/10'
                  : 'text-gray-400 hover:bg-[#262037] hover:text-gray-200 font-normal border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2 truncate flex-1 min-w-0 mr-1">
                {isNewTab ? (
                  <img
                    alt="Vesper Tab"
                    className={`w-4 h-4 object-contain shrink-0 transition-opacity ${isActive ? 'opacity-90' : 'opacity-60 group-hover:opacity-100'}`}
                    src="./vesper-logo.png"
                  />
                ) : tab.favicon ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    className="w-4 h-4 rounded shrink-0 object-contain"
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-300 text-[10px]">
                    ✦
                  </div>
                )}
                <span className="truncate">{displayTitle}</span>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-opacity cursor-pointer shrink-0"
                title="Close Tab"
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions Dock */}
      <div className="p-3 border-t border-[#262137] mt-auto shrink-0">
        <button
          onClick={() => setDownloadsDrawerOpen(!downloadsDrawerOpen)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md bg-[#2d2542] text-white border border-purple-500/20 shadow-sm transition-all duration-200 text-[13px] font-medium group active:scale-[0.98] cursor-pointer mb-1"
          id="btn-sidebar-downloads"
          title="Downloads"
          type="button"
        >
          <div className="flex items-center space-x-2.5">
            <svg className="w-4 h-4 text-purple-300 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
            <span className="truncate">Downloads</span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-600/40 text-purple-200">
            {activeDownloadsCount}
          </span>
        </button>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-gray-400 hover:text-white hover:bg-[#28223a] transition-all duration-200 text-[13px] font-normal group active:scale-[0.98] cursor-pointer"
          type="button"
        >
          <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-300 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
          </svg>
          <span className="truncate">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
