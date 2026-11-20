import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useBrowserStore } from '../../store/browserStore';
import { WebviewPane } from './WebviewPane';
import { X } from 'lucide-react';

export const EngineViewport: React.FC = () => {
  const {
    tabs,
    activeTabId,
    splitTabId,
    splitRatio,
    setSplitRatio,
    activePane,
    setActivePane,
    toggleSplitView,
  } = useBrowserStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const leftTab = tabs.find((t) => t.id === activeTabId);
  const rightTab = splitTabId ? tabs.find((t) => t.id === splitTabId) : null;
  const hiddenTabs = tabs.filter((t) => t.id !== activeTabId && t.id !== splitTabId);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSplitRatio((e.clientX - rect.left) / rect.width);
    },
    [isDragging, setSplitRatio]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!leftTab) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1c1d22', color: '#6e6880', fontFamily: 'monospace', fontSize: 12 }}>
        No active tab
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex relative overflow-hidden ${isDragging ? 'cursor-col-resize select-none' : ''}`}
      style={{ backgroundColor: '#1c1d22' }}
    >
      <div
        key={`${leftTab.id}:${leftTab.url.startsWith('vesper://') ? 'i' : 'w'}`}
        style={{ width: rightTab ? `${splitRatio * 100}%` : '100%', height: '100%', flexShrink: 0 }}
        className="relative overflow-hidden"
        onClick={() => setActivePane('left')}
      >
        <WebviewPane tab={leftTab} paneType="left" isActivePane={activePane === 'left' || !rightTab} />
      </div>

      {rightTab && (
        <>
          <div
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            className="w-2.5 h-full relative z-20 flex items-center justify-center cursor-col-resize group"
            style={{ backgroundColor: '#131316', borderLeft: '1px solid #27272a', borderRight: '1px solid #27272a' }}
          >
            <div className="w-1 h-8 rounded-full bg-zinc-600 group-hover:bg-purple-400" />
            <button
              onClick={(e) => { e.stopPropagation(); toggleSplitView(); }}
              title="Exit Split View (Ctrl+\\)"
              className="absolute top-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-zinc-800 text-zinc-300 hover:text-white hover:bg-rose-600"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
          <div
            key={`${rightTab.id}:${rightTab.url.startsWith('vesper://') ? 'i' : 'w'}`}
            style={{ width: `${(1 - splitRatio) * 100}%`, height: '100%', flexShrink: 0 }}
            className="relative overflow-hidden"
            onClick={() => setActivePane('right')}
          >
            <WebviewPane tab={rightTab} paneType="right" isActivePane={activePane === 'right'} />
          </div>
        </>
      )}

      {hiddenTabs.map((tab) => (
        <div
          key={`${tab.id}:${tab.url.startsWith('vesper://') ? 'i' : 'w'}`}
          className="overflow-hidden"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            visibility: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <WebviewPane tab={tab} paneType="left" isActivePane={false} />
        </div>
      ))}
    </div>
  );
};
