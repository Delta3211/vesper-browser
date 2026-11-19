import React, { useEffect } from 'react';
import { useBrowserStore } from '../../store/browserStore';
import { openInFileExplorer } from '../../lib/electronBridge';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
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
    cancelDownload,
    clearCompletedDownloads,
    settings,
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

  const openFolder = () => {
    if (settings.downloadPath) {
      void openInFileExplorer(settings.downloadPath);
    }
  };

  const activeCount = downloads.length;

  return (
    <>
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={() => setDownloadsDrawerOpen(false)}
      />

      {/* Floating Downloads Popover */}
      <div
        className="fixed top-12 right-6 w-[380px] bg-[#181920]/95 backdrop-blur-xl border border-purple-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(147,51,234,0.18)] rounded-2xl z-50 overflow-hidden flex flex-col animate-entrance select-none"
        id="downloads-popover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-white tracking-normal">Downloads</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
              {activeCount} {activeCount === 1 ? 'file' : 'files'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <button
              onClick={openFolder}
              className="hover:text-purple-300 transition-colors flex items-center space-x-1 hover:underline cursor-pointer"
              title="Open downloads directory"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              <span>Folder</span>
            </button>
            <span className="opacity-30">•</span>
            <button
              onClick={clearCompletedDownloads}
              className="hover:text-gray-200 transition-colors cursor-pointer"
              type="button"
            >
              Clear
            </button>
            <span className="opacity-30">•</span>
            <button
              id="btn-close-downloads"
              onClick={() => setDownloadsDrawerOpen(false)}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Close Downloads"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-3 space-y-2.5 max-h-[380px] overflow-y-auto">
          {downloads.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </div>
              <p className="text-xs text-gray-300 font-medium">No recent downloads</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Files you download will appear here</p>
            </div>
          ) : (
            downloads.map((item) => {
              const progress = Math.min(
                100,
                Math.round((item.receivedBytes / (item.totalBytes || 1)) * 100)
              );
              const isProgressing = item.state === 'progressing';
              const isZip = item.fileName.endsWith('.zip') || item.fileName.endsWith('.tar.gz');
              const isPdf = item.fileName.endsWith('.pdf');

              if (isProgressing) {
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#20212b] border border-purple-500/30 shadow-inner group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                          </svg>
                        </div>
                        <div className="truncate">
                          <p className="text-[13px] font-medium text-white truncate leading-tight">
                            {item.fileName}
                          </p>
                          <p className="text-[11px] text-purple-300 mt-0.5 font-normal">
                            {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)} • {progress}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          onClick={() => pauseDownload(item.id)}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                          title="Pause"
                          type="button"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M10 9v6m4-6v6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => cancelDownload(item.id)}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                          title="Cancel"
                          type="button"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="w-full h-1.5 bg-[#14151b] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 ${
                        isPdf ? 'text-red-400' : isZip ? 'text-amber-400' : 'text-purple-300'
                      }`}
                    >
                      {isPdf ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                        </svg>
                      ) : isZip ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                        </svg>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-[13px] font-normal text-gray-200 group-hover:text-white truncate leading-tight">
                        {item.fileName}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-normal">
                        {formatBytes(item.totalBytes || item.receivedBytes)} • Completed
                      </p>
                    </div>
                  </div>
                  {item.savePath && (
                    <button
                      onClick={() => void openInFileExplorer(item.savePath)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-all shrink-0 cursor-pointer"
                      title="Show in folder"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Security verified footer */}
        <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.015] flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span className="text-gray-300 font-normal">Security verified</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">Esc to dismiss</span>
        </div>
      </div>
    </>
  );
};

export default DownloadsDrawer;
