import React, { useEffect, useState } from 'react';
import { WindowFrame } from './components/chrome/WindowFrame';
import { Sidebar } from './components/sidebar/Sidebar';
import { EngineViewport } from './components/viewport/EngineViewport';
import { CommandPalette } from './components/overlays/CommandPalette';
import { DownloadsDrawer } from './components/overlays/DownloadsDrawer';
import { SettingsModal } from './components/overlays/SettingsModal';
import { FindInPage } from './components/overlays/FindInPage';
import { ShortcutsModal } from './components/overlays/ShortcutsModal';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { useBrowserStore } from './store/browserStore';
import {
  getDefaultDownloadPath,
  subscribeDownloads,
  subscribeNewTab,
  subscribeShieldBlocked,
  syncNativeShield,
} from './lib/electronBridge';
import { adjustZoom, openDevTools, resetZoom } from './lib/webviewRegistry';

export const App: React.FC = () => {
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('vesper_onboarding_done')
  );
  const {
    tabs, createTab, ensureActiveTab, hydrated,
    closeTab, reopenClosedTab, cycleTab,
    toggleSplitView, toggleSidebar,
    setCommandPaletteOpen, commandPaletteOpen,
    setDownloadsDrawerOpen, downloadsDrawerOpen,
    setSettingsModalOpen, settingsModalOpen,
    setFindInPageOpen, findInPageOpen,
    reloadTab, goBack, goForward, stopTab,
    activeTabId, activePane, splitTabId,
    sidebarCollapsed, setIsOmnibarFocused,
    addDownload, updateDownload, incrementShieldStats,
    shieldStats, updateSettings, settings,
    toggleBookmark,
  } = useBrowserStore();

  useEffect(() => {
    if (showOnboarding) return;
    const finish = () => ensureActiveTab();
    const persistApi = (useBrowserStore as typeof useBrowserStore & {
      persist?: { onFinishHydration?: (cb: () => void) => () => void; hasHydrated?: () => boolean };
    }).persist;
    if (persistApi?.hasHydrated?.()) finish();
    const unsub = persistApi?.onFinishHydration?.(finish);
    if (hydrated) finish();
    return () => { unsub?.(); };
  }, [hydrated, ensureActiveTab, showOnboarding]);

  useEffect(() => {
    const reopenSetup = () => setShowOnboarding(true);
    window.addEventListener('vesper:run-setup', reopenSetup);
    return () => window.removeEventListener('vesper:run-setup', reopenSetup);
  }, []);

  useEffect(() => {
    void getDefaultDownloadPath().then((path) => {
      const current = useBrowserStore.getState().settings.downloadPath;
      if (path && !current) updateSettings({ downloadPath: path });
    });
  }, [updateSettings]);

  useEffect(() => {
    if (settings.downloadPath) {
      void window.electronAPI?.downloads.setPath(settings.downloadPath);
    }
  }, [settings.downloadPath]);

  useEffect(() => {
    void syncNativeShield(shieldStats.enabled, shieldStats.shieldLevel);
  }, [shieldStats.enabled, shieldStats.shieldLevel]);

  useEffect(() => {
    const unsubDl = subscribeDownloads({
      onStarted: (item) => {
        addDownload(item);
        setDownloadsDrawerOpen(true);
      },
      onProgress: (item) => updateDownload(item.id, item),
      onDone: (item) => updateDownload(item.id, item),
    });
    const unsubTab = subscribeNewTab((url) => createTab(url));
    const unsubShield = subscribeShieldBlocked(() => incrementShieldStats(1, 0));
    return () => {
      unsubDl();
      unsubTab();
      unsubShield();
    };
  }, [addDownload, updateDownload, createTab, incrementShieldStats, setDownloadsDrawerOpen]);

  useEffect(() => {
    const currentTabId = () => (activePane === 'left' ? activeTabId : splitTabId || activeTabId);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.ctrlKey && !e.shiftKey && key === 't') {
        e.preventDefault(); createTab(); return;
      }
      if (e.ctrlKey && e.shiftKey && key === 't') {
        e.preventDefault(); reopenClosedTab(); return;
      }
      if (e.ctrlKey && key === 'w') {
        e.preventDefault();
        closeTab(currentTabId()); return;
      }
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault(); cycleTab(e.shiftKey ? 'prev' : 'next'); return;
      }
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault(); toggleSplitView(); return;
      }
      if (e.ctrlKey && key === 'k') {
        e.preventDefault(); setCommandPaletteOpen(!commandPaletteOpen); return;
      }
      if (e.ctrlKey && key === 'j') {
        e.preventDefault(); setDownloadsDrawerOpen(!downloadsDrawerOpen); return;
      }
      if (e.ctrlKey && key === 'f') {
        e.preventDefault(); setFindInPageOpen(!findInPageOpen); return;
      }
      if (e.ctrlKey && key === 'b') {
        e.preventDefault(); toggleSidebar(); return;
      }
      if (e.ctrlKey && key === 'l') {
        e.preventDefault(); setIsOmnibarFocused(true); return;
      }
      if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        const tab = tabs.find(t => t.id === currentTabId());
        if (tab) toggleBookmark(tab.url, tab.title);
        return;
      }
      if (e.ctrlKey && key === 'h') {
        e.preventDefault(); createTab('vesper://history'); return;
      }
      if (e.ctrlKey && e.shiftKey && key === 'b') {
        e.preventDefault(); createTab('vesper://bookmarks'); return;
      }
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault(); setSettingsModalOpen(!settingsModalOpen); return;
      }
      if (e.ctrlKey && (e.key === '/' || e.key === '?')) {
        e.preventDefault(); setShortcutsModalOpen(p => !p); return;
      }
      if (e.ctrlKey && e.shiftKey && key === 'i') {
        e.preventDefault(); openDevTools(currentTabId()); return;
      }
      if ((e.ctrlKey && key === 'r') || e.key === 'F5') {
        e.preventDefault();
        if (e.ctrlKey && tabs.find(t => t.id === currentTabId())?.isLoading) {
          stopTab(currentTabId());
        } else {
          reloadTab(currentTabId());
        }
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault(); goBack(currentTabId()); return;
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault(); goForward(currentTabId()); return;
      }
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault(); adjustZoom(currentTabId(), 0.1); return;
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault(); adjustZoom(currentTabId(), -0.1); return;
      }
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault(); resetZoom(currentTabId()); return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    createTab, closeTab, reopenClosedTab, cycleTab,
    toggleSplitView, toggleSidebar, toggleBookmark, tabs,
    commandPaletteOpen, setCommandPaletteOpen,
    downloadsDrawerOpen, setDownloadsDrawerOpen,
    settingsModalOpen, setSettingsModalOpen,
    findInPageOpen, setFindInPageOpen,
    reloadTab, stopTab, goBack, goForward, setIsOmnibarFocused,
    activeTabId, activePane, splitTabId,
  ]);

  if (showOnboarding) {
    return (
      <div
        className="vesper-app fixed inset-0 overflow-hidden bg-[#0b0c10]"
        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
      >
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  return (
    <div
      className="vesper-app"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <WindowFrame />
      <Sidebar />

      <main
        className="fixed overflow-hidden"
        style={{
          top: 40,
          left: sidebarCollapsed ? 0 : 230,
          right: 0,
          bottom: 0,
          backgroundColor: '#1c1d22',
          transition: 'left 0.2s ease',
        }}
      >
        <EngineViewport />
        <FindInPage />
      </main>

      <CommandPalette />
      <DownloadsDrawer />
      <SettingsModal />
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
};

export default App;
