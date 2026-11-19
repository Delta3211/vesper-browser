import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Tabs & Navigation',
      items: [
        { label: 'New Tab', key: 'Ctrl + T' },
        { label: 'Close Active Tab', key: 'Ctrl + W' },
        { label: 'Reopen Closed Tab', key: 'Ctrl + Shift + T' },
        { label: 'Cycle Next Tab', key: 'Ctrl + Tab' },
        { label: 'Cycle Previous Tab', key: 'Ctrl + Shift + Tab' },
        { label: 'Reload Page', key: 'Ctrl + R / F5' },
        { label: 'Navigate Back', key: 'Alt + ←' },
        { label: 'Navigate Forward', key: 'Alt + →' },
      ],
    },
    {
      title: 'Layout & Workspace',
      items: [
        { label: 'Toggle Split View', key: 'Ctrl + \\' },
        { label: 'Toggle Left Sidebar', key: 'Ctrl + B' },
        { label: 'Find in Page', key: 'Ctrl + F' },
        { label: 'Focus Omnibar / URL', key: 'Ctrl + L' },
        { label: 'Bookmark Page', key: 'Ctrl + D' },
        { label: 'History', key: 'Ctrl + H' },
        { label: 'Zoom In / Out', key: 'Ctrl + / Ctrl -' },
      ],
    },
    {
      title: 'Hubs & Utility',
      items: [
        { label: 'Command Palette', key: 'Ctrl + K' },
        { label: 'Downloads & File Hub', key: 'Ctrl + J' },
        { label: 'Settings & Privacy', key: 'Ctrl + ,' },
        { label: 'Keyboard Shortcuts Help', key: 'Ctrl + /' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs no-drag animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[540px] bg-[#131316] border border-[#27272a] rounded-xl shadow-2xl p-5 text-zinc-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[420px] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-purple-400/90 font-semibold mb-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#1b1b1e] border border-[#27272a]"
                  >
                    <span className="text-zinc-300 text-[11px] truncate">{item.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 ml-1">
                      {item.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Vesper Keyboard-First Ergonomics</span>
          <span className="text-purple-400">Esc to close</span>
        </div>
      </div>
    </div>
  );
};

