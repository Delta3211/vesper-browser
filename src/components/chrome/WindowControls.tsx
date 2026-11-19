import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { minimizeWindow, toggleMaximizeWindow, closeWindow, isWindowMaximized } from '../../lib/tauriBridge';

export const WindowControls: React.FC = () => {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    isWindowMaximized().then(setMaximized);
  }, []);

  const handleToggleMaximize = async () => {
    const isNowMax = await toggleMaximizeWindow();
    setMaximized(isNowMax);
  };

  return (
    <div className="flex items-center h-full no-drag">
      {/* Minimize */}
      <button
        onClick={minimizeWindow}
        title="Minimize"
        className="h-full px-3.5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors duration-150"
      >
        <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={handleToggleMaximize}
        title={maximized ? 'Restore' : 'Maximize'}
        className="h-full px-3.5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors duration-150"
      >
        {maximized ? (
          <Copy className="w-3 h-3 rotate-180" strokeWidth={1.75} />
        ) : (
          <Square className="w-3 h-3" strokeWidth={1.75} />
        )}
      </button>

      {/* Close */}
      <button
        onClick={closeWindow}
        title="Close"
        className="h-full px-4 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#e81123] transition-colors duration-150"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
};

