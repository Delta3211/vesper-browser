import React from 'react';
import { Plus, Globe, X, VolumeX, Settings, Star, Clock, Download } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed, userProfile, tabs, activeTabId,
    activeWorkspaceId, shieldStats,
    setSettingsModalOpen, createTab, setActiveTab, closeTab, toggleMute, navigateTab,
    bookmarks, setDownloadsDrawerOpen,
  } = useBrowserStore();

  const currentTabs = tabs.filter(t => t.workspaceId === activeWorkspaceId);

  if (sidebarCollapsed) return null;

  return (
    <>
    <aside
      className="fixed left-0 top-[50px] bottom-0 z-40 flex flex-col select-none sidebar-enter"
      style={{ width: 248, backgroundColor: '#14121a', borderRight: '1px solid #252132' }}
    >
      {/* ── New Tab button ── */}
      <div className="px-2 pt-2 pb-1" style={{ borderBottom: '1px solid #252132' }}>
        <button
          onClick={() => createTab('vesper://newtab', activeWorkspaceId)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-left"
          style={{ color: '#c5c0d4' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1f1b29'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <Plus className="w-4 h-4 shrink-0" style={{ color: '#a078ff' }} />
          <span className="text-[13px] font-medium">New Tab</span>
        </button>
        <div className="flex items-center gap-1 px-1 pb-1">
          <button
            onClick={() => createTab('vesper://bookmarks', activeWorkspaceId)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px]"
            style={{ color: '#857f95' }}
            title="Bookmarks (Ctrl+Shift+B)"
          >
            <Star className="w-3 h-3" /> Saved
          </button>
          <button
            onClick={() => createTab('vesper://history', activeWorkspaceId)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px]"
            style={{ color: '#857f95' }}
            title="History (Ctrl+H)"
          >
            <Clock className="w-3 h-3" /> History
          </button>
          <button
            onClick={() => setDownloadsDrawerOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px]"
            style={{ color: '#857f95' }}
            title="Downloads (Ctrl+J)"
          >
            <Download className="w-3 h-3" /> Files
          </button>
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className="px-2 py-2" style={{ borderBottom: '1px solid #252132' }}>
          <div className="px-1 pb-1 text-[10px] uppercase tracking-wider" style={{ color: '#6e6880' }}>Bookmarks</div>
          {bookmarks.slice(0, 8).map(b => (
            <button
              key={b.id}
              onClick={() => {
                const active = tabs.find(t => t.id === activeTabId);
                if (active) navigateTab(active.id, b.url);
                else createTab(b.url, activeWorkspaceId);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded text-left"
              style={{ color: '#b0a8c4' }}
              title={b.url}
            >
              {b.favicon ? <img src={b.favicon} alt="" className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
              <span className="text-[12px] truncate">{b.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Tab list ── */}
      <div className="flex-1 overflow-y-auto py-1 stagger-children" style={{ scrollbarWidth: 'none' }}>
        {currentTabs.length === 0 && (
          <div className="px-4 py-2 text-[12px] animate-fade-in" style={{ color: '#6e6880' }}>No open tabs</div>
        )}
        {currentTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          let domain = '';
          try { domain = new URL(tab.url).hostname.replace('www.', ''); } catch { domain = ''; }
          const isNewTab = tab.url.startsWith('vesper://newtab');
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
              onDoubleClick={() => { if (!tab.url.startsWith('vesper://')) createTab(tab.url, tab.workspaceId); }}
              className="tab-row animate-tab-in group relative flex items-center gap-2 px-2.5 cursor-pointer"
              style={{
                height: 32,
                backgroundColor: isActive ? '#221c32' : 'transparent',
                borderLeft: isActive ? '2px solid #a078ff' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1624'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              {tab.favicon && !isNewTab ? (
                <img src={tab.favicon} alt="" className="favicon-img w-4 h-4 rounded shrink-0 object-contain"
                  onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
              ) : (
                <Globe className="w-4 h-4 shrink-0" style={{ color: isActive ? '#a078ff' : '#6e6880' }} />
              )}
              <span className="text-[13px] font-medium truncate flex-1" style={{ color: isActive ? '#ffffff' : '#b0a8c4' }}>
                {displayTitle}
              </span>
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {tab.isMuted && (
                  <button onClick={e => { e.stopPropagation(); toggleMute(tab.id); }}>
                    <VolumeX className="w-3 h-3 text-amber-400" />
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                  className="close-btn p-0.5 rounded hover:text-white" style={{ color: '#6e6880' }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full glow-pulse shrink-0" style={{ backgroundColor: '#a078ff' }} />}
            </div>
          );
        })}
      </div>

      {/* ── Bottom: Profile + Shield status ── */}
      <div className="flex flex-col" style={{ borderTop: '1px solid #252132' }}>
        {/* Shield status row */}
        <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid #1e1a2b' }}>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            style={{ color: '#857f95', fontSize: 11 }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: shieldStats.enabled ? '#10b981' : '#6b7280' }} />
            Shield {shieldStats.enabled ? 'Enabled' : 'Disabled'}
          </button>
          <span className="font-mono" style={{ color: '#787287', fontSize: 10 }}>v2.4.0</span>
        </div>

        {/* Profile pill at very bottom */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
          onClick={() => setSettingsModalOpen(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1f1b29'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0"
            style={{ backgroundColor: userProfile.isGuest ? '#1e1a2e' : '#62259b', border: `1px solid ${userProfile.isGuest ? '#3b3252' : 'rgba(160,120,255,0.3)'}`, color: '#e9ddff' }}
          >
            {userProfile.isGuest ? '?' : userProfile.initials}
          </div>
          {/* Text */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold leading-tight truncate" style={{ color: '#f1eff5' }}>
              {userProfile.isGuest ? 'This device' : userProfile.name}
            </span>
            <span className="text-[11px] leading-tight truncate" style={{ color: '#868097' }}>
              {userProfile.isGuest ? 'Local profile' : 'On this PC'}
            </span>
          </div>
          {/* Icon */}
          <Settings className="w-3.5 h-3.5 shrink-0" style={{ color: '#787287' }} />
        </div>
      </div>
    </aside>
    </>
  );
};
