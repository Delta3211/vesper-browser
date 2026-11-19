import React from 'react';
import { Lock, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const CertificateModal: React.FC = () => {
  const { certificateModalOpen, setCertificateModalOpen, tabs, activeTabId, shieldStats } = useBrowserStore();
  const currentTab = tabs.find((t) => t.id === activeTabId);

  if (!certificateModalOpen || !currentTab) return null;

  let hostname = 'vesper-internal';
  try {
    if (!currentTab.url.startsWith('vesper://')) {
      hostname = new URL(currentTab.url).hostname;
    }
  } catch {
    hostname = currentTab.url;
  }

  const isVesperInternal = currentTab.url.startsWith('vesper://');

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 bg-black/40 backdrop-blur-xs no-drag"
      onClick={() => setCertificateModalOpen(false)}
    >
      <div
        className="w-[380px] bg-[#1b1b1e] border border-[#27272a] rounded-xl shadow-2xl p-4 text-zinc-300 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                {hostname}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {isVesperInternal ? 'Vesper Internal Subsystem' : 'TLS 1.3 / AES_256_GCM'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCertificateModalOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 space-y-2 text-xs">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-zinc-200">Connection is Private & Encrypted</span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                Information you send to this site (passwords, cookies) remains strictly private and cannot be intercepted.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Issuer:</span>
              <span className="text-zinc-300">{isVesperInternal ? 'Vesper Native Core' : 'GTS Root R1 (Let’s Encrypt)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Protocol:</span>
              <span className="text-zinc-300">HTTP/3 (QUIC)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Vesper Shield:</span>
              <span className="text-purple-400 font-semibold">{shieldStats.shieldLevel} Mode (Active)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Trackers Suppressed:</span>
              <span className="text-emerald-400">{shieldStats.trackersBlocked} on this origin</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Vesper Zero-Telemetry</span>
          <button
            onClick={() => {
              setCertificateModalOpen(false);
              useBrowserStore.getState().setSettingsModalOpen(true);
            }}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition"
          >
            Privacy Settings
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
