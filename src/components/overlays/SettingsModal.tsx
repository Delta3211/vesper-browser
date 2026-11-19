import React, { useState } from 'react';
import { X, Shield, RefreshCw, Zap, Lock, Info, Check } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { selectDownloadPath } from '../../lib/electronBridge';
import { SignInModal } from './SignInModal';

type Tab = 'shield' | 'sync' | 'performance' | 'privacy' | 'about';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'shield',      label: 'Vesper Shield',  icon: <Shield   className="w-4 h-4" /> },
  { id: 'sync',        label: 'This device',    icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'performance', label: 'Performance',    icon: <Zap      className="w-4 h-4" /> },
  { id: 'privacy',     label: 'Data & Privacy', icon: <Lock     className="w-4 h-4" /> },
  { id: 'about',       label: 'About Vesper',   icon: <Info     className="w-4 h-4" /> },
];

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen, setSettingsModalOpen,
    shieldStats, setShieldLevel, toggleShield,
    userProfile,
    settings, updateSettings,
    history, clearHistory,
  } = useBrowserStore();

  const [activeTab, setActiveTab] = useState<Tab>('shield');
  const [signInOpen, setSignInOpen] = useState(false);

  if (!settingsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={() => setSettingsModalOpen(false)}
    >
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <div
        className="modal-content flex overflow-hidden"
        style={{
          width: 720, height: 500,
          backgroundColor: '#111318',
          border: '1px solid #252132',
          borderRadius: 12,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left nav ── */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: 190, backgroundColor: '#0e0d14', borderRight: '1px solid #1e1a2b' }}
        >
          {/* Modal title */}
          <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #1e1a2b' }}>
            <Settings20 />
            <span className="text-[14px] font-semibold" style={{ color: '#f1eff5' }}>Settings & Preferences</span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 p-2 flex-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors w-full"
                style={activeTab === item.id
                  ? { backgroundColor: '#1e1a2e', color: '#a78bfa', borderLeft: '2px solid #8b5cf6', paddingLeft: 10 }
                  : { color: '#9b94ab', borderLeft: '2px solid transparent', paddingLeft: 10 }
                }
                onMouseEnter={e => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#16141f'; }}
                onMouseLeave={e => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <span style={{ color: activeTab === item.id ? '#a78bfa' : '#6e6880' }}>{item.icon}</span>
                <span className="text-[13px] font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e1a2b' }}>
            <h2 className="text-[16px] font-semibold" style={{ color: '#f1eff5' }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
            <button
              onClick={() => setSettingsModalOpen(false)}
              className="close-btn w-7 h-7 flex items-center justify-center rounded-md transition-colors"
              style={{ color: '#6e6880' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1e1a2b'; (e.currentTarget as HTMLElement).style.color = '#f1eff5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6e6880'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>

            {/* ── SHIELD ── */}
            {activeTab === 'shield' && (
              <div className="space-y-5 animate-fade-in">
                <p className="text-[13px] leading-relaxed" style={{ color: '#9b94ab' }}>
                  Blocks trackers, fingerprinting, and ad scripts without slowing page load.
                </p>

                {/* Shield toggle row */}
                <Row
                  label="Shield Active"
                  description={shieldStats.enabled ? 'Protection is on' : 'Protection is off'}
                  right={
                    <Toggle active={shieldStats.enabled} onToggle={toggleShield} />
                  }
                />

                {/* Level picker */}
                <div className="space-y-1.5">
                  {(['Strict', 'Balanced', 'Permissive'] as const).map(level => (
                    <LevelRow
                      key={level}
                      label={level}
                      tag={level === 'Strict' ? 'Recommended' : undefined}
                      description={
                        level === 'Strict' ? 'Blocks all third-party trackers and telemetry.' :
                        level === 'Balanced' ? 'Blocks trackers while keeping social widgets.' :
                        'Standard protection only.'
                      }
                      active={shieldStats.shieldLevel === level}
                      onSelect={() => setShieldLevel(level)}
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="space-y-1 pt-2" style={{ borderTop: '1px solid #1e1a2b' }}>
                  <StatRow label="Trackers Blocked" value={String(shieldStats.trackersBlocked)} color="#a78bfa" />
                  <StatRow label="Ads Blocked"      value={String(shieldStats.adsBlocked)}      color="#34d399" />
                  <StatRow label="Memory Saved"     value={`${shieldStats.memorySavedMb} MB`}   color="#60a5fa" />
                </div>
              </div>
            )}

            {/* ── SYNC ── */}
            {activeTab === 'sync' && (
              <div className="space-y-5 animate-fade-in">
                <p className="text-[13px] leading-relaxed" style={{ color: '#9b94ab' }}>
                  Vesper has no cloud account. Tabs, bookmarks, and history stay on this PC. Sign into websites inside the page itself.
                </p>
                <Row
                  label={userProfile.isGuest ? 'This device' : userProfile.name}
                  description={userProfile.isGuest ? 'Local guest profile' : 'Saved on this PC only'}
                  left={
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0"
                      style={{ backgroundColor: '#62259b', color: '#e9ddff' }}>
                      {userProfile.isGuest ? 'G' : userProfile.initials}
                    </div>
                  }
                  right={
                    <button
                      onClick={() => setSignInOpen(true)}
                      className="px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors"
                      style={{ backgroundColor: '#1e1a2e', color: '#a78bfa', border: '1px solid #3b3252' }}
                    >
                      {userProfile.isGuest ? 'Set name' : 'Edit'}
                    </button>
                  }
                />
                <Row
                  label="Import browser data"
                  description="Run setup again to scan Chrome, Arc, Brave, or Edge."
                  right={
                    <button
                      onClick={() => {
                        setSettingsModalOpen(false);
                        window.dispatchEvent(new Event('vesper:run-setup'));
                      }}
                      className="px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors"
                      style={{ backgroundColor: '#1e1a2e', color: '#a78bfa', border: '1px solid #3b3252' }}
                    >
                      Run setup
                    </button>
                  }
                />
              </div>
            )}

            {/* ── PERFORMANCE ── */}
            {activeTab === 'performance' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <SectionLabel>Default Search Engine</SectionLabel>
                  <div className="flex gap-2 mt-2">
                    {(['duckduckgo', 'google', 'brave'] as const).map(eng => (
                      <ChoiceChip
                        key={eng}
                        label={eng === 'duckduckgo' ? 'DuckDuckGo' : eng === 'google' ? 'Google' : 'Brave'}
                        active={settings.defaultSearchEngine === eng}
                        onSelect={() => updateSettings({ defaultSearchEngine: eng })}
                      />
                    ))}
                  </div>
                </div>
                <Row
                  label="Restore tabs on startup"
                  description="Pick up where you left off"
                  right={<Toggle active={settings.restoreTabsOnStartup} onToggle={() => updateSettings({ restoreTabsOnStartup: !settings.restoreTabsOnStartup })} />}
                />
                <Row
                  label="Download folder"
                  description={settings.downloadPath || 'System default'}
                  right={
                    <button
                      onClick={async () => {
                        const next = await selectDownloadPath();
                        if (next) updateSettings({ downloadPath: next });
                      }}
                      className="px-3 py-1.5 rounded-md text-[12px]"
                      style={{ backgroundColor: '#1e1a2e', color: '#a78bfa', border: '1px solid #3b3252' }}
                    >
                      Change
                    </button>
                  }
                />
                <div>
                  <SectionLabel>Tracker Blocking Level</SectionLabel>
                  <div className="flex gap-2 mt-2">
                    {(['standard', 'strict'] as const).map(lvl => (
                      <ChoiceChip
                        key={lvl}
                        label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        active={settings.trackerBlocking === lvl}
                        onSelect={() => updateSettings({ trackerBlocking: lvl })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <div className="space-y-3 animate-fade-in">
                <Row
                  label="Browsing History"
                  description={`${history.length} entries stored locally`}
                  right={
                    <DangerButton label="Clear History" onClick={clearHistory} />
                  }
                />
                <Row
                  label="All Local Data"
                  description="Clears all cached state and history"
                  right={
                    <DangerButton label="Reset All" onClick={() => useBrowserStore.setState({ history: [], bookmarks: [], downloads: [] })} danger />
                  }
                />
              </div>
            )}

            {/* ── ABOUT ── */}
            {activeTab === 'about' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-4">
                  <img src="./vesper-logo.png" alt="Vesper" className="w-14 h-14 rounded-2xl" style={{ boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }} />
                  <div>
                    <h3 className="text-[18px] font-bold" style={{ color: '#f1eff5' }}>Vesper Browser</h3>
                    <p className="text-[12px] font-mono mt-0.5" style={{ color: '#9b94ab' }}>Version 0.1.0 — Electron + React</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: '#c084fc' }}>Zero AI Guarantee</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#9b94ab' }}>
                    No chatbots, prompt bars, LLM telemetry, or AI overhead. Every cycle is dedicated to fast, private browsing.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {[['Engine', 'Electron v33 + Chromium'], ['UI', 'React 19 + TypeScript + Vite'], ['Styling', 'Tailwind CSS v4'], ['State', 'Zustand v5']].map(([k, v]) => (
                    <StatRow key={k} label={k} value={v} color="#e5e1e4" />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helper components ────────────────────────────────────────────────────────

function Settings20() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6e6880' }}>{children}</p>;
}

function Row({ label, description, right, left }: { label: string; description?: string; right?: React.ReactNode; left?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #1a1725' }}>
      {left}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium" style={{ color: '#e5e1e4' }}>{label}</p>
        {description && <p className="text-[12px] mt-0.5" style={{ color: '#9b94ab' }}>{description}</p>}
      </div>
      {right}
    </div>
  );
}

function LevelRow({ label, description, tag, active, onSelect }: { label: string; description: string; tag?: string; active: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="flex items-start justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-colors"
      style={active
        ? { backgroundColor: '#1a1628', border: '1px solid rgba(139,92,246,0.3)' }
        : { backgroundColor: 'transparent', border: '1px solid transparent' }
      }
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#16141f'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold" style={{ color: active ? '#f1eff5' : '#c5c0d4' }}>{label}</span>
          {tag && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(139,92,246,0.18)', color: '#a78bfa' }}>{tag}</span>}
        </div>
        <p className="text-[12px] mt-0.5" style={{ color: '#9b94ab' }}>{description}</p>
      </div>
      {active && <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#8b5cf6' }} />}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #15131e' }}>
      <span className="text-[13px]" style={{ color: '#9b94ab' }}>{label}</span>
      <span className="text-[13px] font-semibold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative shrink-0 transition-colors"
      style={{
        width: 42, height: 24, borderRadius: 12,
        backgroundColor: active ? '#7c3aed' : '#27272a',
        boxShadow: active ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
        transition: 'background-color 200ms, box-shadow 200ms',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3,
          left: active ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%',
          backgroundColor: 'white',
          transition: 'left 200ms cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}

function ChoiceChip({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
      style={active
        ? { backgroundColor: '#1e1a2e', color: '#a78bfa', border: '1px solid #6d3bd7' }
        : { backgroundColor: 'transparent', color: '#9b94ab', border: '1px solid #252132' }
      }
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = '#3b3252'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = '#252132'; }}
    >
      {label}
    </button>
  );
}

function DangerButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors"
      style={danger
        ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }
        : { backgroundColor: '#1e1a2e', color: '#c5c0d4', border: '1px solid #252132' }
      }
    >
      {label}
    </button>
  );
}
