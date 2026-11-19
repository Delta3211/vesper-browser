import React from 'react';
import { useBrowserStore } from '../../store/browserStore';

export const PinnedAppHub: React.FC = () => {
  const { pinnedApps, tabs, activeTabId, createTab, setActiveTab } = useBrowserStore();

  const handlePinnedClick = (app: (typeof pinnedApps)[0]) => {
    const existing = tabs.find((t) => t.url.includes(app.domain));
    if (existing) {
      setActiveTab(existing.id);
    } else {
      createTab(app.url);
    }
  };

  return (
    <div className="px-3 py-2 border-b border-[#27272a]">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
          Pinned Apps
        </span>
        <span className="text-[9px] text-zinc-600 font-mono">Alt+1-6</span>
      </div>

      <div className="grid grid-cols-6 gap-1">
        {pinnedApps.map((app) => {
          const isActive = tabs.some(
            (t) => t.id === activeTabId && t.url.includes(app.domain)
          );

          return (
            <button
              key={app.id}
              onClick={() => handlePinnedClick(app)}
              title={`${app.name} (${app.domain})`}
              className={`relative flex items-center justify-center h-8 rounded-lg transition-all duration-150 ${isActive
                  ? 'bg-purple-600/20 ring-1 ring-purple-500/60 shadow-xs'
                  : 'bg-[#1b1b1e]/60 hover:bg-[#222226] hover:ring-1 hover:ring-zinc-700'
                }`}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${app.domain}&sz=32`}
                alt={app.name}
                className="w-4 h-4 rounded-sm object-contain"
                onError={(e) => {
                  // Fallback letter if icon fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {app.badge && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-purple-600 text-white text-[8px] font-bold rounded-full leading-none">
                  {app.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

