export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  isMuted: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  crashed?: boolean;
  pinned?: boolean;
  workspaceId: string;
  lastAccessed: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId?: string;
  createdAt: number;
  favicon?: string;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
}

export interface DownloadItem {
  id: string;
  fileName: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  savePath: string;
  startTime: number;
  completedAt?: number;
  speedBytesPerSec?: number;
}

export interface BrowserSettings {
  defaultSearchEngine: 'google' | 'duckduckgo' | 'brave';
  restoreTabsOnStartup: boolean;
  trackerBlocking: 'standard' | 'strict';
  downloadPath: string;
  sidebarCollapsed: boolean;
  theme: 'obsidian-violet' | 'vesper-coral';
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface PinnedApp {
  id: string;
  name: string;
  url: string;
  domain: string;
  favicon?: string;
  badge?: string;
}

export interface ShieldStats {
  trackersBlocked: number;
  adsBlocked: number;
  httpsUpgrades: number;
  fingerprintingDefended: number;
  memorySavedMb: number;
  shieldLevel: 'Strict' | 'Balanced' | 'Permissive';
  enabled: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  synced: boolean;
  lastSynced: string;
  isGuest: boolean;
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Tabs' | 'Bookmarks' | 'Actions' | 'Workspaces' | 'System' | 'History';
  shortcut?: string;
  action: () => void;
  iconName?: string;
  favicon?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
}
