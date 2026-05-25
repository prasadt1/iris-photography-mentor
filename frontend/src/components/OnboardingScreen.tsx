import React, { useState } from 'react';
import { Camera, Headphones, Loader2, Briefcase } from 'lucide-react';
import type { UserMode } from '../types/practice';

interface Props {
  onComplete: (mode: UserMode) => void;
  onPersist: (mode: UserMode) => Promise<void>;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete, onPersist }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (mode: UserMode) => {
    setSaving(true);
    setError(null);
    try {
      await onPersist(mode);
      onComplete(mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your choice');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8 animate-fadeIn">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Practice Companion</h1>
          <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            I&apos;ll remember every photo you take — and help you get better, faster.
          </p>
          <p className="text-sm text-slate-500">Choose your path to get started.</p>
        </div>

        {error && (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => void choose('hobbyist')}
            className="text-left rounded-2xl border border-slate-600 bg-slate-800/60 p-6 hover:border-brand-500 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Camera className="w-8 h-8 text-brand-400 mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Hobbyist</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              I shoot for creative fun and learning. I want critique, practice assignments, and a
              library that grows with me.
            </p>
            <span className="inline-block mt-4 text-sm font-semibold text-brand-400">
              Start as hobbyist →
            </span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => void choose('working_pro')}
            className="text-left rounded-2xl border border-slate-600 bg-slate-800/60 p-6 hover:border-brand-500 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Briefcase className="w-8 h-8 text-brand-400 mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Working pro</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              I sell prints and need listing drafts, portfolio insight, and practice — with my
              approval before anything goes live.
            </p>
            <span className="inline-block mt-4 text-sm font-semibold text-brand-400">
              Start as working pro →
            </span>
          </button>
        </div>

        <div
          className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 flex gap-4 opacity-70"
          aria-disabled="true"
        >
          <Headphones className="w-8 h-8 text-slate-500 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-slate-400 mb-1">Accessible mode</h2>
            <p className="text-sm text-slate-500">
              Voice-first photography with scene narration — coming soon on web and iPhone.
            </p>
            <span className="inline-block mt-2 text-xs uppercase tracking-wide text-slate-600">
              Coming soon
            </span>
          </div>
        </div>

        {saving && (
          <p className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Setting up your companion…
          </p>
        )}

        <p className="text-center text-xs text-slate-500">
          You can switch between Hobbyist and Working pro anytime in Settings.
        </p>
      </div>
    </div>
  );
};
