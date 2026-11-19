import React, { useState, useEffect } from 'react';
import {
  Plus, X, VolumeX, Globe, Pin, Copy, Columns, Trash2, FolderPlus,
  Terminal, Layers, Compass,
} from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

const ICON_MAP: Record<string, React.ReactNode> = {
  Terminal: <Terminal className="w-3.5 h-3.5" />,
  Layers: <Layers className="w-3.5 h-3.5" />,
  Compass: <Compass className="w-3.5 h-3.5" />,
  User: <Globe className="w-3.5 h-3.5" />,
  Briefcase: <Layers className="w-3.5 h-3.5" />,
  Palette: <Compass className="w-3.5 h-3.5" />,
};

export const WorkspacesTree: React.FC = () => {
  const {
    workspaces,
    activeWorkspaceId,
    tabs,
    activeTabId,
    splitTabId,
    setActiveTab,
    createTab,
    closeTab,
    duplicateTab,
    toggleMute,
    togglePin,
    toggleSplitView,
  } = useBrowserStore();

  const [newWsPrompt, setNewWsPrompt] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

  // Switch workspace by just changing activeWorkspaceId
  const setActiveWorkspace = (id: string) => {
    const wsTabs = tabs.filter(t => t.workspaceId === id);
    if (wsTabs.length > 0) {
      setActiveTab(wsTabs[0].id);
    } else {
      createTab('vesper://newtab', id);
    }
    // Update the store's activeWorkspaceId
    useBrowserStore.setState({ activeWorkspaceId: id });
  };

  const currentTabs = tabs.filter((t) => t.workspaceId === activeWorkspaceId);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const handleAddWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const id = `ws-${Date.now()}`;
    useBrowserStore.setState(s => ({
      workspaces: [...s.workspaces, { id, name: newWsName.trim(), icon: 'Terminal', color: '#8b5cf6' }],
    }));
    setNewWsName('');
    setNewWsPrompt(false);
  };

  const handleCloseOthers = (tabId: string) => {
    currentTabs.filter(t => t.id !== tabId).forEach(t => closeTab(t.id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Workspace switcher */}
      <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-[#27272a]/70">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5" style={{ scrollbarWidth: 'none' }}>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              title={ws.name}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition ${
                ws.id === activeWorkspaceId
                  ? 'bg-[#1b1b1e] text-zinc-100 border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <span style={{ color: ws.color }}>
                {ICON_MAP[ws.icon] ?? <Terminal className="w-3.5 h-3.5" />}
              </span>
              <span className="truncate max-w-[80px]">{ws.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setNewWsPrompt(!newWsPrompt)}
          title="New Workspace"
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {newWsPrompt && (
        <form onSubmit={handleAddWorkspace} className="px-3 py-2 bg-zinc-900 border-b border-zinc-800">
          <input
            type="text"
            placeholder="Workspace name..."
            value={newWsName}
            onChange={e => setNewWsName(e.target.value)}
            autoFocus
            className="w-full bg-[#1b1b1e] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 outline-none"
          />
        </form>
      )}

      {/* New Tab button */}
      <div className="p-2">
        <button
          onClick={() => createTab('vesper://newtab', activeWorkspaceId)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1b1b1e]/70 hover:bg-[#1b1b1e] border border-[#27272a] hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-medium transition group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Tab</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+T</span>
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {currentTabs.length === 0 && (
          <div className="text-center text-zinc-600 text-xs py-4">No tabs open</div>
        )}
        {currentTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isSplit = tab.id === splitTabId;
          const isNewTab = tab.url.startsWith('vesper://newtab');

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }}
              className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-[#1b1b1e] text-zinc-100 border border-purple-500/30'
                  : isSplit
                  ? 'bg-zinc-800/40 text-purple-300 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-purple-500 rounded-r" />}

              <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                {tab.favicon && !isNewTab ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    className="w-3.5 h-3.5 rounded-sm shrink-0 object-contain"
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
                )}
                <span className="text-xs truncate font-medium">
                  {tab.title || 'New Tab'}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {tab.isMuted && (
                  <button onClick={e => { e.stopPropagation(); toggleMute(tab.id); }} title="Unmute" className="text-amber-400 p-0.5">
                    <VolumeX className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); togglePin(tab.id); }}
                  title={tab.pinned ? 'Unpin' : 'Pin'}
                  className={`p-1 rounded transition ${tab.pinned ? 'text-purple-400' : 'opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200'} hover:bg-zinc-800`}
                >
                  <Pin className="w-2.5 h-2.5 rotate-45" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                  title="Close (Ctrl+W)"
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 220), left: contextMenu.x }}
          className="fixed z-50 w-48 bg-[#1b1b1e] border border-[#27272a] rounded-xl shadow-2xl p-1 text-xs text-zinc-300"
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Duplicate Tab', icon: <Copy className="w-3.5 h-3.5 text-zinc-400" />, action: () => { duplicateTab(contextMenu.tabId); setContextMenu(null); } },
            { label: 'Toggle Pin', icon: <Pin className="w-3.5 h-3.5 text-purple-400" />, action: () => { togglePin(contextMenu.tabId); setContextMenu(null); } },
            { label: 'Open in Split View', icon: <Columns className="w-3.5 h-3.5 text-zinc-400" />, action: () => { toggleSplitView(); setContextMenu(null); } },
          ].map(item => (
            <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition text-left">
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
          <div className="h-px bg-[#27272a] my-1" />
          <button onClick={() => { handleCloseOthers(contextMenu.tabId); setContextMenu(null); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition text-left">
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" /><span>Close Other Tabs</span>
          </button>
          <button onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-900/40 hover:text-rose-200 transition text-left text-rose-300">
            <X className="w-3.5 h-3.5" /><span>Close Tab</span>
          </button>
        </div>
      )}
    </div>
  );
};
