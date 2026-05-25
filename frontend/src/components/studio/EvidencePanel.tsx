/**
 * Evidence sources — human-readable labels (Pass 6).
 */

import React from 'react';
import { BookOpen, Camera, Eye } from 'lucide-react';
import type { EvidenceItem } from '../../types/studio';

const SOURCE_CONFIG: Record<
  EvidenceItem['source'],
  { label: string; icon: React.ReactNode; color: string }
> = {
  EXIF: {
    label: 'Camera metadata',
    icon: <Camera className="w-3.5 h-3.5" aria-hidden />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  CV: {
    label: 'What I see in the image',
    icon: <Eye className="w-3.5 h-3.5" aria-hidden />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  Coach: {
    label: 'Photography principles',
    icon: <BookOpen className="w-3.5 h-3.5" aria-hidden />,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
};

const FIELD_LABELS: Record<string, string> = {
  composition: 'Composition',
  lighting: 'Lighting',
  technique: 'Technique',
  creativity: 'Creativity',
  subject_impact: 'Subject impact',
  focal_length: 'Focal length',
  aperture: 'Aperture',
  shutter_speed: 'Shutter',
  iso: 'ISO',
};

function humanField(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ');
}

const EvidencePanel: React.FC<{ evidence: EvidenceItem[]; className?: string }> = ({
  evidence,
  className = '',
}) => {
  if (evidence.length === 0) return null;

  return (
    <div
      className={`rounded-xl bg-slate-800/40 border border-slate-700 overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Eye className="w-4 h-4 text-slate-400" aria-hidden />
        <h4 className="text-sm font-semibold text-slate-200">How I backed this critique</h4>
        <span className="ml-auto text-xs text-slate-400">{evidence.length} signals</span>
      </div>
      <ul className="divide-y divide-slate-700/50" role="list">
        {evidence.map((item, idx) => {
          const cfg = SOURCE_CONFIG[item.source];
          return (
            <li key={idx} className="px-4 py-3 flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded border shrink-0 ${cfg.color}`}
              >
                {cfg.icon}
                {cfg.label}
              </div>
              <div className="flex-1 min-w-0 text-xs text-slate-300">
                <span className="text-slate-400">{humanField(item.field)}: </span>
                {item.value}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EvidencePanel;
