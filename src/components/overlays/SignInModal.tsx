import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import { useBrowserStore } from '../../store/browserStore';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ open, onClose }) => {
  const { userProfile, setUserProfile } = useBrowserStore();
  const [name, setName] = useState(userProfile.isGuest ? '' : userProfile.name);

  if (!open) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim() || 'You';
    const initials = trimmed.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    setUserProfile({
      name: trimmed,
      email: 'Saved on this PC',
      initials,
      isGuest: false,
      synced: false,
      lastSynced: 'Never — local only',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-[420px] overflow-hidden"
        style={{ backgroundColor: '#07080b', borderRadius: 12, border: '1px solid #252132' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4" style={{ height: 40, backgroundColor: '#13151a', borderBottom: '1px solid #1e1a2b' }}>
          <span className="text-[13px] font-medium" style={{ color: '#9b94ab' }}>This device</span>
          <button onClick={onClose} className="text-[12px]" style={{ color: '#6e6880' }}>Close</button>
        </div>

        <form onSubmit={save} className="px-8 py-7 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1e1a2e', color: '#a78bfa' }}>
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold" style={{ color: '#f1eff5' }}>Local profile</h1>
              <p className="text-[12px]" style={{ color: '#9b94ab' }}>No Vesper account. Nothing is sent to a server.</p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: '#f1eff5' }}>Display name</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-11 px-3.5 rounded-lg text-[14px] outline-none"
              style={{ backgroundColor: '#13151a', border: '1px solid #252132', color: '#f1eff5' }}
              autoFocus
            />
          </label>

          <p className="text-[12px] leading-relaxed" style={{ color: '#9b94ab' }}>
            Sign into Gmail, YouTube, GitHub, and the rest on those websites. Vesper keeps their cookies on this PC, same as a normal browser.
          </p>

          <button
            type="submit"
            className="w-full h-11 rounded-lg text-[14px] font-semibold text-white"
            style={{ backgroundColor: '#7c3aed' }}
          >
            Save on this device
          </button>
        </form>
      </div>
    </div>
  );
};
