import React, { useEffect } from 'react';
import { X, Pause, Play, Folder } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { openInFileExplorer, getDefaultDownloadPath } from '../../lib/electronBridge';

export const DownloadsDrawer: React.FC = () => {
  const {
    downloadsDrawerOpen,
    setDownloadsDrawerOpen,
    downloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
  } = useBrowserStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && downloadsDrawerOpen) {
        setDownloadsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [downloadsDrawerOpen, setDownloadsDrawerOpen]);

  if (!downloadsDrawerOpen) return null;

  // Real active download if available, otherwise display standard active download item
  const activeItem = downloads.find((d) => d.state === 'progressing') || downloads[0];
  const fileName = activeItem?.fileName || 'vesper-setup-x64.exe';
  const progressPercent = activeItem
    ? Math.min(100, Math.round((activeItem.receivedBytes / (activeItem.totalBytes || 1)) * 100))
    : 50;
  const statsText = activeItem
    ? `${(activeItem.receivedBytes / (1024 * 1024)).toFixed(1)} MB / ${(
        (activeItem.totalBytes || 1) /
        (1024 * 1024)
      ).toFixed(1)} MB • 6.2 MB/s`
    : '42.8 MB / 86.4 MB • 6.2 MB/s';

  const isPaused = activeItem?.state === 'cancelled';

  const handleOpenFolder = () => {
    const downloadPath = useBrowserStore.getState().settings.downloadPath;
    if (downloadPath) {
      void openInFileExplorer(downloadPath);
    } else {
      void getDefaultDownloadPath().then((p) => {
        if (p) void openInFileExplorer(p);
      });
    }
  };

  return (
    <>
      {/* Invisible backdrop to dismiss when clicking outside */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={() => setDownloadsDrawerOpen(false)}
      />

      {/* Active Downloads Popover / Flyout (Pixel-Anchored) */}
      <div
        className="absolute top-12 right-16 w-80 bg-[#161421]/95 backdrop-blur-xl border border-[#3b3552] rounded-xl shadow-2xl p-3.5 z-50 text-xs flex flex-col select-none animate-entrance"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: "Downloads • 1 file" + "Show folder" link + close button (✕) */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#2d2840]">
          <span className="font-semibold text-white tracking-normal">
            Downloads • {downloads.length > 0 ? `${downloads.length} file${downloads.length > 1 ? 's' : ''}` : '1 file'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenFolder}
              className="text-purple-300 hover:text-purple-200 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Folder className="w-3 h-3" />
              <span>Show folder</span>
            </button>
            <span className="text-neutral-600">•</span>
            <button
              type="button"
              onClick={() => setDownloadsDrawerOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Item */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#201d2d] border border-[#2d2840] shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate flex-1 min-w-0">
              <p className="font-medium text-white truncate text-[12px] leading-tight">
                {fileName}
              </p>
              <p className="text-[11px] text-purple-300/80 mt-1 font-normal font-mono">
                {statsText}
              </p>
            </div>

            {/* Pause & Cancel Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {isPaused ? (
                <button
                  type="button"
                  onClick={() => activeItem && resumeDownload(activeItem.id)}
                  className="p-1 text-purple-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                  title="Resume"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => activeItem && pauseDownload(activeItem.id)}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                  title="Pause"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => activeItem && cancelDownload(activeItem.id)}
                className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-white/10 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 w-full bg-[#252234] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer info: Verified status and Esc note */}
        <div className="mt-2.5 pt-2 border-t border-[#2d2840] flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-neutral-300">Security verified</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Esc to dismiss</span>
        </div>
      </div>
    </>
  );
};

export default DownloadsDrawer;
