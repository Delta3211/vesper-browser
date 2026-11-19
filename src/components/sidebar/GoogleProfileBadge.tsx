import React from 'react';
import { Monitor, User } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

export const GoogleProfileBadge: React.FC = () => {
  const { userProfile, setSettingsModalOpen } = useBrowserStore();

  return (
    <div className="p-3 border-b border-[#27272a] bg-[#131316]/60">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setSettingsModalOpen(true)}
        >
          <div className="relative">
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-8 h-8 rounded-full object-cover border border-zinc-700 group-hover:border-purple-400 transition"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#62259b] border border-[#a078ff]/30 flex items-center justify-center group-hover:border-purple-400 transition">
                {userProfile.isGuest ? (
                  <User className="w-4 h-4 text-[#e9ddff]" />
                ) : (
                  <span className="text-xs font-semibold text-[#e9ddff]">{userProfile.initials}</span>
                )}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#131316] bg-violet-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-purple-300 transition">
              {userProfile.isGuest ? 'This device' : userProfile.name}
            </div>
            <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1 font-mono">
              <Monitor className="w-3 h-3" />
              <span>Local profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
