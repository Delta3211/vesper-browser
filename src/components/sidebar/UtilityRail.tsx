import React from 'react';
import { Shield, Download, Settings } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const UtilityRail: React.FC = () => {
  const {
    shieldStats,
    downloads,
    downloadsDrawerOpen,
    setDownloadsDrawerOpen,
    settingsModalOpen,
    setSettingsModalOpen,
  } = useBrowserStore();

  const activeDownloads = downloads.filter((d) => d.state === 'progressing');
  const totalBlocked = shieldStats.trackersBlocked + shieldStats.adsBlocked;

  return (
    <div className="p-2 border-t border-[#27272a] bg-[#131316] space-y-1">
      {/* Shield Status Pill */}
      <div
        onClick={() => setSettingsModalOpen(true)}
        title={`Vesper Shield ${shieldStats.enabled ? 'Active' : 'Disabled'} — ${totalBlocked} blocked`}
        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1b1b1e]/80 hover:bg-[#222226] border border-[#27272a] cursor-pointer transition group"
      >
        <div className="flex items-center gap-2">
          <Shield className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${shieldStats.enabled ? 'text-purple-400' : 'text-zinc-600'}`} />
          <span className="text-xs font-medium text-zinc-300">Vesper Shield</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
          shieldStats.enabled
            ? 'bg-purple-500/15 text-purple-300'
            : 'bg-zinc-800 text-zinc-500'
        }`}>
          {shieldStats.enabled ? `${totalBlocked} blocked` : 'Off'}
        </span>
      </div>

      {/* Downloads & Settings toolbar */}
      <div className="flex items-center justify-between pt-0.5 px-0.5">
        <button
          onClick={() => setDownloadsDrawerOpen(!downloadsDrawerOpen)}
          title="Downloads (Ctrl+J)"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition ${
            downloadsDrawerOpen || activeDownloads.length > 0
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Downloads</span>
          {activeDownloads.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setSettingsModalOpen(!settingsModalOpen)}
          title="Settings (Ctrl+,)"
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition ml-1"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
