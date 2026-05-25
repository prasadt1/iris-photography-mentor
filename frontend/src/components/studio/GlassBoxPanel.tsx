/**
 * Glass Box — transparent reasoning UI with dimension-linked highlights.
 */

import React, { useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronUp, Eye, Target, Database } from 'lucide-react';
import { dimensionForText, textMatchesDimension } from '../../lib/glassBoxHighlight';
import type { StudioAnalysis, EvidenceItem } from '../../types/studio';
import EvidencePanel from './EvidencePanel';

interface Props {
  rationale: StudioAnalysis['rationale'];
  groundingPrinciples: string[];
  groundingCitations: StudioAnalysis['groundingCitations'];
  evidence: EvidenceItem[];
  focusDimension?: string | null;
  onFocusDimension?: (dimension: string | null) => void;
  className?: string;
}

function highlightClass(active: boolean): string {
  return active
    ? 'ring-2 ring-brand-400/60 bg-brand-500/10 rounded-md -mx-1 px-1'
    : '';
}

const GlassBoxPanel: React.FC<Props> = ({
  rationale,
  groundingPrinciples,
  groundingCitations,
  evidence,
  focusDimension = null,
  onFocusDimension,
  className = '',
}) => {
  const [expanded, setExpanded] = React.useState(true);
  const firstMatchRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (focusDimension && firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusDimension]);

  let assignedFirstMatch = false;

  return (
    <div className={`space-y-4 animate-fadeIn ${className}`}>
      {focusDimension && (
        <p className="text-xs text-brand-400/90 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2">
          Highlighting reasoning related to <strong className="text-brand-300">{focusDimension}</strong>
          — click any line to explore another dimension.
        </p>
      )}

      <div className="rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500 to-purple-600 shadow-xl shadow-brand-500/10">
        <div className="bg-slate-950/60 rounded-2xl overflow-hidden backdrop-blur-md border border-slate-800/80">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-slate-900/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-lg text-white shadow-lg">
                <Brain className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm md:text-base">Why I scored it this way</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Glass Box — my reasoning steps, so you can learn from the critique
                </p>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
            )}
          </button>

          {expanded && (
            <div className="p-5 md:p-6 border-t border-slate-800 bg-slate-950/80 text-sm leading-relaxed space-y-6">
              <div>
                <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3 uppercase text-xs tracking-wider">
                  <Eye className="w-4 h-4" aria-hidden /> Key observations
                </h4>
                <ul className="space-y-2.5 list-disc list-outside pl-5 marker:text-emerald-500/60" role="list">
                  {rationale.observations.map((obs, i) => {
                    const match = textMatchesDimension(obs, focusDimension);
                    const dim = dimensionForText(obs);
                    const ref =
                      match && !assignedFirstMatch
                        ? (el: HTMLLIElement | null) => {
                            firstMatchRef.current = el;
                            assignedFirstMatch = true;
                          }
                        : undefined;
                    return (
                      <li
                        key={i}
                        ref={ref}
                        className={`text-slate-200 ${highlightClass(match)} ${
                          onFocusDimension && dim ? 'cursor-pointer hover:text-white' : ''
                        }`}
                        onClick={() => onFocusDimension?.(dim)}
                        onKeyDown={(e) => {
                          if (onFocusDimension && dim && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onFocusDimension(dim);
                          }
                        }}
                        role={onFocusDimension && dim ? 'button' : undefined}
                        tabIndex={onFocusDimension && dim ? 0 : undefined}
                      >
                        {obs}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-purple-400 font-bold mb-3 uppercase text-xs tracking-wider">
                  <Brain className="w-4 h-4" aria-hidden /> Reasoning steps
                </h4>
                <ol className="space-y-3" role="list">
                  {rationale.reasoningSteps.map((step, i) => {
                    const match = textMatchesDimension(step, focusDimension);
                    const dim = dimensionForText(step);
                    return (
                      <li
                        key={i}
                        className={`flex gap-3 text-slate-300 ${highlightClass(match)} ${
                          onFocusDimension && dim ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => onFocusDimension?.(dim)}
                        onKeyDown={(e) => {
                          if (onFocusDimension && dim && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onFocusDimension(dim);
                          }
                        }}
                        role={onFocusDimension && dim ? 'button' : undefined}
                        tabIndex={onFocusDimension && dim ? 0 : undefined}
                      >
                        <span className="text-purple-500/70 font-bold">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {rationale.priorityFixes.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-amber-400 font-bold mb-3 uppercase text-xs tracking-wider">
                    <Target className="w-4 h-4" aria-hidden /> Priority fixes
                  </h4>
                  <div className="space-y-2" role="list">
                    {rationale.priorityFixes.map((fix, i) => (
                      <div
                        key={i}
                        role="listitem"
                        className={`flex items-center gap-3 p-2 rounded bg-slate-900 border border-slate-800 ${highlightClass(
                          textMatchesDimension(fix, focusDimension),
                        )}`}
                      >
                        <div className="w-4 h-4 rounded border border-amber-500/50 flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
                        </div>
                        <span className="text-slate-300">{fix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(groundingCitations.length > 0 || groundingPrinciples.length > 0) && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="flex items-center gap-2 text-brand-400 font-bold mb-3 uppercase text-xs tracking-wider">
                    <Database className="w-4 h-4" aria-hidden /> Photography principles I used
                  </h4>
                  <div className="space-y-2">
                    {(groundingCitations.length > 0
                      ? groundingCitations
                      : groundingPrinciples.map((id) => ({ id, title: id, excerpt: '' }))
                    ).map((c) => (
                      <div
                        key={c.id}
                        className="text-xs rounded-lg bg-brand-500/5 border border-brand-500/20 px-3 py-2"
                      >
                        <span className="font-semibold text-brand-400">{c.title}</span>
                        {c.excerpt && (
                          <p className="text-slate-400 mt-1 leading-relaxed">{c.excerpt}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {evidence.length > 0 && <EvidencePanel evidence={evidence} />}
    </div>
  );
};

export default GlassBoxPanel;
