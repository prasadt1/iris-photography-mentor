import React from 'react';
import { Settings } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { clearOnboardingComplete } from '../lib/onboarding';
import { isLocalDevHost } from '../lib/apiHelp';
import type { UserMode } from '../types/practice';

interface Props {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  onPersistPersona: (mode: UserMode) => Promise<void>;
  onPersistError: (message: string) => void;
  onRestartOnboarding: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  mode,
  onModeChange,
  onPersistPersona,
  onPersistError,
  onRestartOnboarding,
}) => {
  const isLocal = isLocalDevHost();

  return (
    <div className="animate-fadeIn max-w-lg space-y-8">
      <div>
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Settings</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Your profile</h1>
        <p className="text-slate-400 text-sm mt-2">
          Switch between hobbyist and working pro. I&apos;ll adjust listings, suggestions, and how
          I coach you.
        </p>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <ModeToggle
          mode={mode}
          onModeChange={onModeChange}
          onPersistPersona={onPersistPersona}
          onPersistError={onPersistError}
        />
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">Privacy</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your photos and critiques stay in your private library. Listing and label changes only
          happen when you approve them.
        </p>
      </section>

      {isLocal && (
        <section className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-400">Developer (local only)</h2>
          <p className="text-xs text-slate-500">
            API: run <code className="text-brand-400">make api-dev</code> on port 8081 before using
            Mentor or approvals.
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => {
          clearOnboardingComplete();
          onRestartOnboarding();
        }}
        className="text-sm text-slate-500 hover:text-brand-400 underline"
      >
        Show welcome screen again
      </button>
    </div>
  );
};
