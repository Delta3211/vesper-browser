import React, { useMemo, useState } from 'react';
import { Bookmark, Clock, Download, Search, Star, Trash2, ExternalLink } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';
import { openInFileExplorer } from '../../lib/electronBridge';

function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return new Date(ts).toLocaleString();
}

export const BookmarksPage: React.FC<{ tabId: string }> = ({ tabId }) => {
  const { bookmarks, removeBookmark, navigateTab } = useBrowserStore();
  const [q, setQ] = useState('');
  const items = useMemo(
    () => bookmarks.filter(b =>
      !q || b.title.toLowerCase().includes(q.toLowerCase()) || b.url.toLowerCase().includes(q.toLowerCase())
    ),
    [bookmarks, q],
  );

  return (
    <PageShell title="Bookmarks" icon={<Star className="w-5 h-5" />} count={bookmarks.length}>
      <SearchField value={q} onChange={setQ} placeholder="Search bookmarks" />
      {items.length === 0 ? (
        <Empty text="Star pages from the address bar (Ctrl+D) to keep them here." />
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.id}>
              <Row
                favicon={item.favicon}
                title={item.title}
                subtitle={item.url}
                meta={formatWhen(item.createdAt)}
                onOpen={() => navigateTab(tabId, item.url)}
                onRemove={() => removeBookmark(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
};

export const HistoryPage: React.FC<{ tabId: string }> = ({ tabId }) => {
  const { history, clearHistory, navigateTab } = useBrowserStore();
  const [q, setQ] = useState('');
  const items = useMemo(
    () => history.filter(h =>
      !q || h.title.toLowerCase().includes(q.toLowerCase()) || h.url.toLowerCase().includes(q.toLowerCase())
    ),
    [history, q],
  );

  return (
    <PageShell
      title="History"
      icon={<Clock className="w-5 h-5" />}
      count={history.length}
      action={history.length > 0 ? (
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
          style={{ backgroundColor: '#1e1a2e', color: '#c5c0d4', border: '1px solid #252132' }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear history
        </button>
      ) : null}
    >
      <SearchField value={q} onChange={setQ} placeholder="Search history" />
      {items.length === 0 ? (
        <Empty text="Pages you visit will show up here." />
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.id}>
              <Row
                favicon={item.favicon}
                title={item.title}
                subtitle={item.url}
                meta={formatWhen(item.visitedAt)}
                onOpen={() => navigateTab(tabId, item.url)}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
};

export const DownloadsPage: React.FC = () => {
  const { downloads, setDownloadsDrawerOpen } = useBrowserStore();
  return (
    <PageShell title="Downloads" icon={<Download className="w-5 h-5" />} count={downloads.length}>
      {downloads.length === 0 ? (
        <Empty text="Files you download will appear here and in Ctrl+J." />
      ) : (
        <ul className="space-y-1">
          {downloads.map(item => (
            <li key={item.id}>
              <Row
                title={item.fileName}
                subtitle={item.savePath || item.url}
                meta={item.state}
                onOpen={() => { if (item.savePath) void openInFileExplorer(item.savePath); }}
              />
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => setDownloadsDrawerOpen(true)}
        className="mt-4 text-xs flex items-center gap-1"
        style={{ color: '#a078ff' }}
      >
        Open downloads drawer <ExternalLink className="w-3 h-3" />
      </button>
    </PageShell>
  );
};

function PageShell({
  title, icon, count, children, action,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#181a1f', color: '#a078ff' }}>
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#f1eff5' }}>{title}</h1>
              <p className="text-xs" style={{ color: '#9c8188' }}>{count} saved locally</p>
            </div>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 px-3 h-10 rounded-lg mb-4" style={{ backgroundColor: '#13151a', border: '1px solid #2b2738' }}>
      <Search className="w-4 h-4" style={{ color: '#9c8188' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: '#f1eff5' }}
      />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm py-12 text-center" style={{ color: '#6e6880' }}>{text}</p>;
}

function Row({
  favicon, title, subtitle, meta, onOpen, onRemove,
}: {
  favicon?: string;
  title: string;
  subtitle: string;
  meta?: string;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
      style={{ backgroundColor: '#13151a', border: '1px solid #1e1a2b' }}
      onClick={onOpen}
    >
      {favicon ? (
        <img src={favicon} alt="" className="w-4 h-4 rounded-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <Bookmark className="w-4 h-4" style={{ color: '#6e6880' }} />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate" style={{ color: '#f1eff5' }}>{title}</div>
        <div className="text-[11px] truncate font-mono" style={{ color: '#6e6880' }}>{subtitle}</div>
      </div>
      {meta && <span className="text-[10px] shrink-0" style={{ color: '#6e6880' }}>{meta}</span>}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded hover:bg-white/5"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" style={{ color: '#6e6880' }} />
        </button>
      )}
    </div>
  );
}
