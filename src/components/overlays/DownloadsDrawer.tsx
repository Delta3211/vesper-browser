import React from 'react';
import {
  Download,
  Folder,
  X,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { openInFileExplorer } from '../../lib/electronBridge';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const DownloadsDrawer: React.FC = () => {
  const {
    downloadsDrawerOpen,
    setDownloadsDrawerOpen,
    downloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    clearCompletedDownloads,
    settings,
  } = useBrowserStore();

  if (!downloadsDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs no-drag animate-in fade-in duration-150"
      onClick={() => setDownloadsDrawerOpen(false)}
    >
      <div
        className="w-[380px] h-full bg-[#131316] border-l border-[#27272a] shadow-2xl flex flex-col text-zinc-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Downloads Hub</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Ctrl+J
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearCompletedDownloads}
              title="Clear Completed"
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDownloadsDrawerOpen(false)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Downloads List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {downloads.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs text-center">
              <Download className="w-8 h-8 text-zinc-700 mb-2" />
              <span>No active or recent downloads</span>
            </div>
          ) : (
            downloads.map((item) => {
              const progress = Math.min(
                100,
                Math.round((item.receivedBytes / (item.totalBytes || 1)) * 100)
              );
              const isDone = item.state === 'completed';
              const isPaused = item.state === 'cancelled';
              const isDownloading = item.state === 'progressing';

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#1b1b1e] border border-[#27272a] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-100 truncate" title={item.fileName}>
                        {item.fileName}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                        {item.savePath}
                      </div>
                    </div>

                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        {isDownloading && (
                          <button
                            onClick={() => pauseDownload(item.id)}
                            title="Pause"
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        {isPaused && (
                          <button
                            onClick={() => resumeDownload(item.id)}
                            title="Resume"
                            className="p-1 rounded text-purple-400 hover:text-purple-300 hover:bg-zinc-800"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => cancelDownload(item.id)}
                          title="Cancel"
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500'
                          : isPaused
                          ? 'bg-amber-500'
                          : 'bg-purple-500 animate-pulse'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Stats and Action Footer */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>
                      {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)} ({progress}%)
                    </span>

                    {/* Native Windows File Explorer Trigger */}
                    <button
                      onClick={() => openInFileExplorer(item.savePath)}
                      title="Open file location in Windows Explorer"
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium transition"
                    >
                      <Folder className="w-3 h-3" />
                      <span>Show in folder</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Bottom Rail */}
        <div className="p-3 bg-[#0e0e11] border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span className="truncate max-w-[220px]" title={settings.downloadPath}>
            {settings.downloadPath || 'Default downloads folder'}
          </span>
          <button
            onClick={() => openInFileExplorer(settings.downloadPath)}
            className="text-zinc-400 hover:text-white flex items-center gap-1 transition"
          >
            Open Downloads <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
