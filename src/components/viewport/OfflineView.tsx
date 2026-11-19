import React, { useState } from 'react';
import { WifiOff, RefreshCw, Terminal, Activity } from 'lucide-react';
import { testDnsDiagnostics } from '../../lib/tauriBridge';
import { useBrowserStore } from '../../store/browserStore';

export const OfflineView: React.FC<{ url: string; onRetry: () => void }> = ({ url, onRetry }) => {
  const [runningDiag, setRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    host: string;
    reachable: boolean;
    latency_ms: number;
    message: string;
  } | null>(null);

  const { isOfflineForced, toggleOfflineForced } = useBrowserStore();

  const runDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const res = await testDnsDiagnostics(url);
      setDiagResult(res);
    } finally {
      setRunningDiag(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0e0e11] text-zinc-300 select-none">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
        <WifiOff className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-zinc-100 mb-1">No Internet Connection</h2>
      <p className="text-xs text-zinc-400 mb-6 font-mono text-center max-w-md">
        Vesper could not establish a connection to <span className="text-purple-400 underline">{url}</span>.
        {isOfflineForced && ' (Offline Simulation mode is active)'}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            if (isOfflineForced) toggleOfflineForced();
            onRetry();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>

        <button
          onClick={runDiagnostics}
          disabled={runningDiag}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1b1b1e] hover:bg-[#222226] border border-[#27272a] text-zinc-300 hover:text-white text-xs font-medium transition"
        >
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>{runningDiag ? 'Probing WinSock...' : 'Run DNS Diagnostics'}</span>
        </button>
      </div>

      {/* DNS Diagnostic Terminal Output */}
      {diagResult && (
        <div className="w-full max-w-md p-3 rounded-xl bg-[#131316] border border-[#27272a] font-mono text-xs text-zinc-300 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Windows Native Socket Diagnostic
            </span>
            <span className="text-purple-400">Tauri Rust IPC</span>
          </div>

          <div className="pt-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Target Host:</span>
              <span className="text-zinc-200">{diagResult.host}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">DNS Resolution:</span>
              <span className={diagResult.reachable ? 'text-emerald-400' : 'text-rose-400'}>
                {diagResult.reachable ? 'Successful' : 'Unreachable / NXDOMAIN'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Socket Latency:</span>
              <span className="text-zinc-200">{diagResult.latency_ms} ms</span>
            </div>
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800/80 text-zinc-400 text-[10px] mt-2">
              {diagResult.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
