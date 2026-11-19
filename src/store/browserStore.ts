import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tab, Bookmark, BookmarkFolder, DownloadItem, BrowserSettings,
  Workspace, PinnedApp, ShieldStats, UserProfile, HistoryItem,
} from '../types/browser';
import {
  goBackWebview,
  goForwardWebview,
  muteWebview,
  navigateWebview,
  reloadWebview,
  stopWebview,
} from '../lib/webviewRegistry';
import { cancelDownload, pauseNativeDownload, resumeNativeDownload } from '../lib/electronBridge';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFaviconUrl(url: string): string {
  try {
    if (url.startsWith('vesper://')) return '';
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

export function smartNavigate(input: string, engine: BrowserSettings['defaultSearchEngine']): string {
  const trimmed = input.trim();
  if (!trimmed) return 'vesper://newtab';
  if (trimmed.startsWith('vesper://')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.startsWith('//')) {
    return `https://${trimmed}`;
  }
  const q = encodeURIComponent(trimmed);
  if (engine === 'google') return `https://www.google.com/search?q=${q}`;
  if (engine === 'brave') return `https://search.brave.com/search?q=${q}`;
  return `https://duckduckgo.com/?q=${q}`;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws-personal', name: 'Personal', icon: 'User', color: '#8b5cf6' },
  { id: 'ws-work',     name: 'Work',     icon: 'Briefcase', color: '#a078ff' },
  { id: 'ws-design',   name: 'Design',   icon: 'Palette', color: '#00dce6' },
];

const DEFAULT_PINNED_APPS: PinnedApp[] = [
  { id: 'pin-google', name: 'Google',  url: 'https://google.com',  domain: 'google.com' },
  { id: 'pin-github', name: 'GitHub',  url: 'https://github.com',  domain: 'github.com' },
  { id: 'pin-yt',     name: 'YouTube', url: 'https://youtube.com', domain: 'youtube.com' },
  { id: 'pin-mail',   name: 'Gmail',   url: 'https://mail.google.com', domain: 'mail.google.com' },
  { id: 'pin-maps',   name: 'Maps',    url: 'https://maps.google.com', domain: 'maps.google.com' },
];

interface BrowserStore {
  tabs: Tab[];
  activeTabId: string;
  splitTabId: string | null;
  splitRatio: number;
  activePane: 'left' | 'right';
  workspaces: Workspace[];
  activeWorkspaceId: string;
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  downloads: DownloadItem[];
  pinnedApps: PinnedApp[];
  shieldStats: ShieldStats;
  userProfile: UserProfile;
  settings: BrowserSettings;
  recentlyClosedTabs: Tab[];
  history: HistoryItem[];
  hydrated: boolean;

  sidebarCollapsed: boolean;
  omnibarInput: string;
  isOmnibarFocused: boolean;
  commandPaletteOpen: boolean;
  downloadsDrawerOpen: boolean;
  settingsModalOpen: boolean;
  certificateModalOpen: boolean;
  findInPageOpen: boolean;
  findQuery: string;
  findMatchCount: number;
  isOfflineForced: boolean;

  createTab: (url?: string, workspaceId?: string) => string;
  closeTab: (tabId: string) => void;
  reopenClosedTab: () => void;
  setActiveTab: (tabId: string) => void;
  navigateTab: (tabId: string, input: string) => void;
  reloadTab: (tabId: string) => void;
  stopTab: (tabId: string) => void;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  cycleTab: (direction: 'next' | 'prev') => void;
  duplicateTab: (tabId: string) => void;
  togglePin: (tabId: string) => void;
  toggleMute: (tabId: string) => void;
  updateTabState: (tabId: string, partial: Partial<Tab>) => void;

  toggleSplitView: () => void;
  setSplitRatio: (ratio: number) => void;
  setActivePane: (pane: 'left' | 'right') => void;

  addBookmark: (url: string, title: string, folderId?: string) => void;
  removeBookmark: (id: string) => void;
  toggleBookmark: (url: string, title: string) => void;
  isBookmarked: (url: string) => boolean;

  addDownload: (item: Omit<DownloadItem, 'id'> & { id?: string }) => string;
  updateDownload: (id: string, partial: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  clearCompletedDownloads: () => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;

  setShieldLevel: (level: ShieldStats['shieldLevel']) => void;
  toggleShield: () => void;
  incrementShieldStats: (trackers?: number, ads?: number) => void;

  setUserProfile: (profile: Partial<UserProfile>) => void;
  setActiveWorkspace: (workspaceId: string) => void;

  addHistoryItem: (item: Omit<HistoryItem, 'id'>) => void;
  clearHistory: () => void;

  toggleSidebar: () => void;
  updateSettings: (partial: Partial<BrowserSettings>) => void;
  setOmnibarInput: (val: string) => void;
  setIsOmnibarFocused: (focused: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setDownloadsDrawerOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setCertificateModalOpen: (open: boolean) => void;
  setFindInPageOpen: (open: boolean) => void;
  setFindQuery: (query: string) => void;
  toggleOfflineForced: () => void;
  ensureActiveTab: () => void;
}

export const useBrowserStore = create<BrowserStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: '',
      splitTabId: null,
      splitRatio: 0.5,
      activePane: 'left',
      workspaces: DEFAULT_WORKSPACES,
      activeWorkspaceId: 'ws-personal',
      bookmarks: [],
      bookmarkFolders: [],
      downloads: [],
      pinnedApps: DEFAULT_PINNED_APPS,
      shieldStats: {
        trackersBlocked: 0,
        adsBlocked: 0,
        httpsUpgrades: 0,
        fingerprintingDefended: 0,
        memorySavedMb: 0,
        shieldLevel: 'Balanced',
        enabled: true,
      },
      userProfile: {
        name: 'Guest',
        email: '',
        initials: 'G',
        synced: false,
        lastSynced: 'Never',
        isGuest: true,
      },
      settings: {
        defaultSearchEngine: 'google',
        restoreTabsOnStartup: true,
        trackerBlocking: 'standard',
        downloadPath: '',
        sidebarCollapsed: false,
        theme: 'obsidian-violet',
      },
      recentlyClosedTabs: [],
      history: [],
      hydrated: false,
      sidebarCollapsed: false,
      omnibarInput: '',
      isOmnibarFocused: false,
      commandPaletteOpen: false,
      downloadsDrawerOpen: false,
      settingsModalOpen: false,
      certificateModalOpen: false,
      findInPageOpen: false,
      findQuery: '',
      findMatchCount: 0,
      isOfflineForced: false,

      createTab: (url = 'vesper://newtab', workspaceId) => {
        const id = `tab-${generateId()}`;
        const wsId = workspaceId ?? get().activeWorkspaceId;
        const resolvedUrl = url;
        const newTab: Tab = {
          id,
          url: resolvedUrl,
          title: resolvedUrl.startsWith('vesper://') ? 'New Tab' : resolvedUrl,
          favicon: getFaviconUrl(resolvedUrl),
          isLoading: !resolvedUrl.startsWith('vesper://'),
          isMuted: false,
          canGoBack: false,
          canGoForward: false,
          pinned: false,
          workspaceId: wsId,
          lastAccessed: Date.now(),
        };
        set(s => ({
          tabs: [...s.tabs, newTab],
          activeTabId: id,
          omnibarInput: resolvedUrl.startsWith('vesper://') ? '' : resolvedUrl,
          isOmnibarFocused: resolvedUrl === 'vesper://newtab',
        }));
        return id;
      },

      closeTab: (tabId) => {
        const { tabs, activeTabId, splitTabId, recentlyClosedTabs, activeWorkspaceId } = get();
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        const remaining = tabs.filter(t => t.id !== tabId);
        const updatedClosed = [tab, ...recentlyClosedTabs].slice(0, 20);
        let nextActiveId = activeTabId;
        let nextSplitId = splitTabId === tabId ? null : splitTabId;

        if (activeTabId === tabId) {
          const wsTabs = remaining.filter(t => t.workspaceId === activeWorkspaceId);
          nextActiveId = wsTabs.length > 0 ? wsTabs[wsTabs.length - 1].id : remaining[0]?.id ?? '';
        }

        const nextTab = remaining.find(t => t.id === nextActiveId);
        set({
          tabs: remaining,
          activeTabId: nextActiveId,
          splitTabId: nextSplitId,
          recentlyClosedTabs: updatedClosed,
          omnibarInput: nextTab ? (nextTab.url.startsWith('vesper://') ? '' : nextTab.url) : '',
        });

        const wsLeft = remaining.filter(t => t.workspaceId === activeWorkspaceId);
        if (wsLeft.length === 0) {
          get().createTab('vesper://newtab', activeWorkspaceId);
        }
      },

      reopenClosedTab: () => {
        const { recentlyClosedTabs } = get();
        if (recentlyClosedTabs.length === 0) return;
        const [tab, ...rest] = recentlyClosedTabs;
        set(s => ({
          tabs: [...s.tabs, { ...tab, isLoading: !tab.url.startsWith('vesper://') }],
          activeTabId: tab.id,
          recentlyClosedTabs: rest,
          omnibarInput: tab.url.startsWith('vesper://') ? '' : tab.url,
        }));
      },

      setActiveTab: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        if (!tab) return;
        set({
          activeTabId: tabId,
          omnibarInput: tab.url.startsWith('vesper://') ? '' : tab.url,
          activePane: 'left',
          tabs: get().tabs.map(t => t.id === tabId ? { ...t, lastAccessed: Date.now() } : t),
        });
      },

      navigateTab: (tabId, input) => {
        const { settings } = get();
        const url = smartNavigate(input, settings.defaultSearchEngine);
        set(s => ({
          tabs: s.tabs.map(t => t.id !== tabId ? t : {
            ...t,
            url,
            title: url.startsWith('vesper://') ? (
              url.includes('bookmarks') ? 'Bookmarks' :
              url.includes('history') ? 'History' :
              url.includes('downloads') ? 'Downloads' : 'New Tab'
            ) : url,
            favicon: getFaviconUrl(url),
            isLoading: !url.startsWith('vesper://'),
            lastAccessed: Date.now(),
          }),
          omnibarInput: url.startsWith('vesper://') ? '' : url,
        }));
        if (!url.startsWith('vesper://')) {
          navigateWebview(tabId, url);
          get().addHistoryItem({ url, title: url, favicon: getFaviconUrl(url), visitedAt: Date.now() });
        }
      },

      reloadTab: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        if (!tab || tab.url.startsWith('vesper://')) return;
        set(s => ({
          tabs: s.tabs.map(t => t.id !== tabId ? t : { ...t, isLoading: true, crashed: false }),
        }));
        reloadWebview(tabId);
      },

      stopTab: (tabId) => {
        stopWebview(tabId);
        set(s => ({
          tabs: s.tabs.map(t => t.id !== tabId ? t : { ...t, isLoading: false }),
        }));
      },

      goBack: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        if (!tab || !tab.canGoBack) return;
        goBackWebview(tabId);
      },

      goForward: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        if (!tab || !tab.canGoForward) return;
        goForwardWebview(tabId);
      },

      cycleTab: (direction) => {
        const { tabs, activeTabId, activeWorkspaceId } = get();
        const wsTabs = tabs.filter(t => t.workspaceId === activeWorkspaceId);
        if (wsTabs.length <= 1) return;
        const idx = wsTabs.findIndex(t => t.id === activeTabId);
        const next = direction === 'next'
          ? (idx + 1) % wsTabs.length
          : (idx - 1 + wsTabs.length) % wsTabs.length;
        get().setActiveTab(wsTabs[next].id);
      },

      duplicateTab: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        if (!tab) return;
        get().createTab(tab.url, tab.workspaceId);
      },

      togglePin: (tabId) => {
        set(s => ({
          tabs: s.tabs.map(t => t.id !== tabId ? t : { ...t, pinned: !t.pinned }),
        }));
      },

      toggleMute: (tabId) => {
        const tab = get().tabs.find(t => t.id === tabId);
        if (!tab) return;
        const muted = !tab.isMuted;
        muteWebview(tabId, muted);
        set(s => ({
          tabs: s.tabs.map(t => t.id !== tabId ? t : { ...t, isMuted: muted }),
        }));
      },

      updateTabState: (tabId, partial) => {
        set(s => ({
          tabs: s.tabs.map(t => t.id !== tabId ? t : { ...t, ...partial }),
        }));
        if (partial.url && get().activeTabId === tabId) {
          const url = partial.url;
          set({ omnibarInput: url.startsWith('vesper://') ? '' : url });
        }
      },

      toggleSplitView: () => {
        const { splitTabId, tabs, activeTabId, activeWorkspaceId } = get();
        if (splitTabId) {
          set({ splitTabId: null });
        } else {
          const others = tabs.filter(t => t.workspaceId === activeWorkspaceId && t.id !== activeTabId);
          if (others.length > 0) {
            set({ splitTabId: others[0].id, activePane: 'right' });
          } else {
            const newId = get().createTab('vesper://newtab', activeWorkspaceId);
            set({ splitTabId: newId, activePane: 'right' });
          }
        }
      },

      setSplitRatio: (ratio) => set({ splitRatio: Math.min(0.8, Math.max(0.2, ratio)) }),

      setActivePane: (pane) => {
        const { activeTabId, splitTabId, tabs } = get();
        const targetId = pane === 'left' ? activeTabId : splitTabId;
        const tab = tabs.find(t => t.id === targetId);
        set({
          activePane: pane,
          omnibarInput: tab ? (tab.url.startsWith('vesper://') ? '' : tab.url) : get().omnibarInput,
        });
      },

      addBookmark: (url, title, folderId) => {
        if (!url || url.startsWith('vesper://')) return;
        if (get().bookmarks.some(b => b.url === url)) return;
        const item: Bookmark = { id: generateId(), url, title, folderId, createdAt: Date.now(), favicon: getFaviconUrl(url) };
        set(s => ({ bookmarks: [...s.bookmarks, item] }));
      },

      removeBookmark: (id) => {
        set(s => ({ bookmarks: s.bookmarks.filter(b => b.id !== id) }));
      },

      toggleBookmark: (url, title) => {
        const existing = get().bookmarks.find(b => b.url === url);
        if (existing) get().removeBookmark(existing.id);
        else get().addBookmark(url, title);
      },

      isBookmarked: (url) => get().bookmarks.some(b => b.url === url),

      addDownload: (item) => {
        const id = item.id ?? generateId();
        const { id: _ignored, ...rest } = { id, ...item };
        void _ignored;
        set(s => {
          if (s.downloads.some(d => d.id === id)) {
            return { downloads: s.downloads.map(d => d.id === id ? { ...d, ...rest, id } : d) };
          }
          return { downloads: [{ id, ...rest }, ...s.downloads] };
        });
        return id;
      },

      updateDownload: (id, partial) => {
        set(s => ({ downloads: s.downloads.map(d => d.id !== id ? d : { ...d, ...partial }) }));
      },

      removeDownload: (id) => {
        set(s => ({ downloads: s.downloads.filter(d => d.id !== id) }));
      },

      clearCompletedDownloads: () => {
        set(s => ({ downloads: s.downloads.filter(d => d.state === 'progressing') }));
      },

      pauseDownload: (id) => {
        void pauseNativeDownload(id);
        get().updateDownload(id, { state: 'cancelled' });
      },

      resumeDownload: (id) => {
        void resumeNativeDownload(id);
        get().updateDownload(id, { state: 'progressing' });
      },

      cancelDownload: (id) => {
        void cancelDownload(id);
        get().updateDownload(id, { state: 'cancelled' });
      },

      setShieldLevel: (shieldLevel) => {
        set(s => ({ shieldStats: { ...s.shieldStats, shieldLevel } }));
      },

      toggleShield: () => {
        set(s => ({ shieldStats: { ...s.shieldStats, enabled: !s.shieldStats.enabled } }));
      },

      incrementShieldStats: (trackers = 0, ads = 0) => {
        set(s => ({
          shieldStats: {
            ...s.shieldStats,
            trackersBlocked: s.shieldStats.trackersBlocked + trackers,
            adsBlocked: s.shieldStats.adsBlocked + ads,
          },
        }));
      },

      setUserProfile: (profile) => {
        set(s => ({ userProfile: { ...s.userProfile, ...profile } }));
      },

      setActiveWorkspace: (workspaceId) => {
        const { workspaces, tabs } = get();
        if (!workspaces.find(w => w.id === workspaceId)) return;
        const wsTabs = tabs.filter(t => t.workspaceId === workspaceId);
        if (wsTabs.length === 0) {
          set({ activeWorkspaceId: workspaceId });
          get().createTab('vesper://newtab', workspaceId);
          return;
        }
        set({
          activeWorkspaceId: workspaceId,
          activeTabId: wsTabs[0].id,
          omnibarInput: wsTabs[0].url.startsWith('vesper://') ? '' : wsTabs[0].url,
        });
      },

      addHistoryItem: (item) => {
        const entry: HistoryItem = { id: generateId(), ...item };
        set(s => {
          const withoutDup = s.history.filter(h => h.url !== item.url);
          return { history: [entry, ...withoutDup].slice(0, 2000) };
        });
      },

      clearHistory: () => set({ history: [] }),

      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
      setOmnibarInput: (val) => set({ omnibarInput: val }),
      setIsOmnibarFocused: (focused) => set({ isOmnibarFocused: focused }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setDownloadsDrawerOpen: (open) => set({ downloadsDrawerOpen: open }),
      setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
      setCertificateModalOpen: (open) => set({ certificateModalOpen: open }),
      setFindInPageOpen: (open) => set({ findInPageOpen: open }),
      setFindQuery: (findQuery) => set({ findQuery }),
      toggleOfflineForced: () => set(s => ({ isOfflineForced: !s.isOfflineForced })),
      ensureActiveTab: () => {
        const { tabs, activeWorkspaceId } = get();
        if (tabs.length === 0) {
          get().createTab('vesper://newtab', activeWorkspaceId);
        }
      },
    }),
    {
      name: 'vesper-browser-state',
      partialize: (s) => ({
        tabs: s.tabs.map(t => ({ ...t, isLoading: false, crashed: false })),
        activeTabId: s.activeTabId,
        workspaces: s.workspaces,
        activeWorkspaceId: s.activeWorkspaceId,
        bookmarks: s.bookmarks,
        bookmarkFolders: s.bookmarkFolders,
        pinnedApps: s.pinnedApps,
        shieldStats: s.shieldStats,
        userProfile: s.userProfile,
        settings: s.settings,
        recentlyClosedTabs: s.recentlyClosedTabs,
        history: s.history,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          useBrowserStore.setState({ hydrated: true });
          return;
        }
        const onboardingDone = typeof window !== 'undefined' && localStorage.getItem('vesper_onboarding_done');
        if (!onboardingDone || !state.settings.restoreTabsOnStartup) {
          state.tabs = [];
          state.activeTabId = '';
        } else {
          state.tabs = state.tabs.map(t => ({ ...t, isLoading: false, crashed: false }));
        }
        useBrowserStore.setState({ hydrated: true });
      },
    },
  ),
);
