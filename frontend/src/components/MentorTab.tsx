import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ImageIcon,
  Layers,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ChatErrorBanner } from './ChatErrorBanner';
import { HitlReasoningCallout } from './HitlReasoningCallout';
import { ScanProgressBanner } from './ScanProgressBanner';
import { TabEmptyState } from './TabEmptyState';
import { MentorMarkdown } from './MentorMarkdown';
import { IrisMark } from './IrisMark';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { mentorLoadingStage } from '../lib/mentorLoadingStages';
import { triageScanStage } from '../lib/scanLoadingStages';
import { entryIdsForProposal } from '../lib/triageEntryIds';
import {
  fetchMentorSuggestedQuestions,
  loadSessionId,
  sendMentorMessage,
  type ChatMessage,
} from '../services/mentorClient';
import {
  decideApproval,
  fetchPendingApprovals,
  runTriageScan,
} from '../services/triageClient';
import { fetchPortfolio, fetchPortfolioStats } from '../services/memoryClient';
import type { UserMode } from '../types/practice';
import type { PendingApproval } from '../types/triage';
import type { PortfolioListItem } from '../types/memory';

const STARTERS_BY_MODE: Record<UserMode, string[]> = {
  hobbyist: [
    'How am I doing so far?',
    'Show me themes from my recent critiques.',
    "What's distinctive about my work?",
  ],
  working_pro: [
    'Which of my recent photos are strongest for print sales?',
    'What patterns do you see across my portfolio?',
    'How can I improve consistency for my shop listings?',
  ],
};

type MentorView = 'chat' | 'label';

interface Props {
  mode: UserMode;
  onGoToWork?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Label Photos helpers (from TriageTab)
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_THUMBS = 6;

type EntryPreview = Pick<PortfolioListItem, 'id' | 'imageUrl' | 'sceneDescription' | 'overallAverage'>;

function ProposalThumbnails({
  entryIds,
  previews,
  highlightDeleteId,
}: {
  entryIds: string[];
  previews: Map<string, EntryPreview>;
  highlightDeleteId?: string;
}) {
  if (entryIds.length === 0) return null;

  const shown = entryIds.slice(0, MAX_THUMBS);
  const extra = entryIds.length - shown.length;

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted uppercase tracking-wide">
        {entryIds.length === 1 ? 'This photo' : `${entryIds.length} photos in this suggestion`}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shown.map((id) => {
          const entry = previews.get(id);
          const isDeleteTarget = highlightDeleteId === id;
          return (
            <div
              key={id}
              className={`shrink-0 w-20 rounded-lg overflow-hidden border bg-black relative ${
                isDeleteTarget ? 'border-red-500/80 ring-1 ring-red-500/50' : 'border-warm'
              }`}
              title={
                isDeleteTarget
                  ? 'Would be removed if you approve'
                  : entry?.sceneDescription?.slice(0, 120) || 'Portfolio photo'
              }
            >
              <div className="aspect-square relative">
                {entry?.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-600 bg-canvas-elevated">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {entry?.overallAverage != null && (
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-canvas-elevated/90 text-brand-400">
                    {entry.overallAverage}
                  </span>
                )}
                {isDeleteTarget && (
                  <span className="absolute inset-0 flex items-center justify-center bg-red-950/50 text-[9px] font-bold text-red-200 uppercase">
                    Remove
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {extra > 0 && (
          <div className="shrink-0 w-20 aspect-square rounded-lg border border-dashed border-warm flex items-center justify-center text-xs text-muted">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}

function describeProposal(item: PendingApproval): string {
  const payload = item.proposedAction.payload as { tags?: string[] };
  if (item.proposedAction.type === 'apply_tags') {
    const n = entryIdsForProposal(item).length;
    const tags = (payload.tags ?? []).map((t) => t.replace(/_/g, ' ')).join(', ');
    return `Add labels (${tags}) to ${n} photo${n === 1 ? '' : 's'} so they are easier to find.`;
  }
  if (item.proposedAction.type === 'delete_entry') {
    return 'Remove one near-duplicate photo from your library (only if you agree it is not worth keeping).';
  }
  return item.agentReasoning;
}

type OrganizeFeedback =
  | { kind: 'scan'; groups: number; proposals: number; superseded: number }
  | { kind: 'approved_tags'; photoCount: number; tags: string[] }
  | { kind: 'approved_delete' }
  | { kind: 'rejected' };

function OrganizeFeedbackBanner({
  feedback,
  onGoToWork,
  onDismiss,
}: {
  feedback: OrganizeFeedback;
  onGoToWork?: () => void;
  onDismiss: () => void;
}) {
  if (feedback.kind === 'scan') {
    const { groups, proposals, superseded } = feedback;
    return (
      <div className="rounded-xl border border-warm bg-surface-1 px-4 py-3 text-sm text-stone-300">
        {superseded > 0
          ? `Replaced ${superseded} old proposal(s). Found ${groups} groups; ${proposals} new card(s) to review below.`
          : `Found ${groups} groups in your library; ${proposals} proposal(s) waiting below.`}
      </div>
    );
  }

  if (feedback.kind === 'rejected') {
    return (
      <div className="rounded-xl border border-warm bg-surface-1 px-4 py-3 flex items-start justify-between gap-3">
        <p className="text-sm text-stone-300">Suggestion dismissed — nothing changed in your library.</p>
        <button type="button" onClick={onDismiss} className="text-stone-500 hover:text-white p-1" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const isTags = feedback.kind === 'approved_tags';
  const tagList = isTags ? feedback.tags.map((t) => t.replace(/_/g, ' ')).join(', ') : '';

  return (
    <div
      className="rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-4 space-y-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-brand-500/20 shrink-0 mt-0.5">
          <Check className="w-4 h-4 text-brand-400" aria-hidden />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white">
            {isTags
              ? `Labels applied to ${feedback.photoCount} photo${feedback.photoCount === 1 ? '' : 's'}`
              : 'Duplicate removed from your library'}
          </p>
          <p className="text-sm text-stone-300 leading-relaxed">
            {isTags ? (
              <>
                Those photos are still in <strong className="text-stone-200 font-medium">My Work</strong> — they
                now carry labels like <span className="text-brand-300">{tagList}</span>. The card above
                disappeared because you approved it; your photos did not.
              </>
            ) : (
              <>
                One near-duplicate was deleted. Your other similar frames are unchanged in{' '}
                <strong className="text-stone-200 font-medium">My Work</strong>.
              </>
            )}
          </p>
          {isTags && (
            <p className="text-xs text-stone-400">
              Next: open My Work and use the tag filter, or tap Refresh if labels don&apos;t show yet.
            </p>
          )}
        </div>
        <button type="button" onClick={onDismiss} className="text-stone-500 hover:text-white p-1 shrink-0" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
      {onGoToWork && (
        <button
          type="button"
          onClick={onGoToWork}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400"
        >
          View in My Work
        </button>
      )}
    </div>
  );
}

export const MentorTab: React.FC<Props> = ({ mode, onGoToWork }) => {
  const [view, setView] = useState<MentorView>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitSec, setWaitSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [starters, setStarters] = useState<string[]>(STARTERS_BY_MODE[mode]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Label Photos state
  const [labelItems, setLabelItems] = useState<PendingApproval[]>([]);
  const [labelLoading, setLabelLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanWaitSec, setScanWaitSec] = useState(0);
  const [acting, setActing] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [organizeFeedback, setOrganizeFeedback] = useState<OrganizeFeedback | null>(null);
  const [previews, setPreviews] = useState<Map<string, EntryPreview>>(new Map());
  const [libraryCount, setLibraryCount] = useState(0);
  const [pendingOrganizeCount, setPendingOrganizeCount] = useState(0);

  useEffect(() => {
    setStarters(STARTERS_BY_MODE[mode]);
    void fetchMentorSuggestedQuestions(mode)
      .then((res) => {
        if (res.questions.length > 0) setStarters(res.questions);
      })
      .catch(() => {
        /* keep mode defaults */
      });
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setWaitSec(0);
      return;
    }
    const tick = window.setInterval(() => setWaitSec((s) => s + 1), 1000);
    return () => window.clearInterval(tick);
  }, [loading]);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setLastFailedText(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await sendMentorMessage(trimmed, mode, { signal: controller.signal });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
        },
      ]);
    } catch (e) {
      const msg = friendlyErrorMessage(e);
      if (e instanceof Error && e.name === 'AbortError') {
        setError(msg);
      } else {
        setError(msg);
        setLastFailedText(trimmed);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(trimmed);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, [loading, mode]);

  const hasSession = Boolean(loadSessionId());
  const stageMessage = mentorLoadingStage(waitSec, mode);

  /* ─────────────────────────────────────────────────────────────────────────
     Label Photos logic
     ───────────────────────────────────────────────────────────────────────── */

  const loadPreviews = useCallback(async () => {
    try {
      const data = await fetchPortfolio({ limit: 100 });
      const map = new Map<string, EntryPreview>();
      for (const e of data.entries) {
        map.set(e.id, {
          id: e.id,
          imageUrl: e.imageUrl,
          sceneDescription: e.sceneDescription,
          overallAverage: e.overallAverage,
        });
      }
      setPreviews(map);
    } catch {
      /* thumbnails are optional */
    }
  }, []);

  const refreshLabelItems = useCallback(async () => {
    setLabelLoading(true);
    setLabelError(null);
    try {
      const data = await fetchPendingApprovals();
      setLabelItems(data.items);
    } catch (e) {
      setLabelError(friendlyErrorMessage(e));
    } finally {
      setLabelLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLabelItems();
  }, [refreshLabelItems]);

  useEffect(() => {
    setPendingOrganizeCount(labelItems.length);
  }, [labelItems.length]);

  useEffect(() => {
    if (view === 'label') {
      void loadPreviews();
      void fetchPortfolioStats()
        .then((s) => setLibraryCount(s.total))
        .catch(() => setLibraryCount(0));
    }
  }, [view, loadPreviews]);

  useEffect(() => {
    if (!scanning) {
      setScanWaitSec(0);
      return;
    }
    const tick = window.setInterval(() => setScanWaitSec((s) => s + 1), 1000);
    return () => window.clearInterval(tick);
  }, [scanning]);

  const handleScan = async () => {
    if (mode !== 'hobbyist' && mode !== 'working_pro') return;
    setScanning(true);
    setLabelError(null);
    try {
      const result = await runTriageScan();
      const n = result.clusters?.length ?? 0;
      const created = result.proposalsCreated?.length ?? 0;
      const cleared = (result as { supersededPending?: number }).supersededPending ?? 0;
      setOrganizeFeedback({
        kind: 'scan',
        groups: n,
        proposals: created,
        superseded: cleared,
      });
      setLabelItems(result.pending?.items ?? []);
      void loadPreviews();
    } catch (e) {
      setLabelError(friendlyErrorMessage(e));
    } finally {
      setScanning(false);
    }
  };

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    const item = labelItems.find((p) => p.id === id);
    setActing(id);
    try {
      await decideApproval(id, action);
      setLabelItems((prev) => prev.filter((p) => p.id !== id));
      if (action === 'approve' && item) {
        if (item.proposedAction.type === 'apply_tags') {
          const payload = item.proposedAction.payload as { tags?: string[]; entryIds?: string[] };
          const ids = payload.entryIds ?? entryIdsForProposal(item);
          setOrganizeFeedback({
            kind: 'approved_tags',
            photoCount: ids.length,
            tags: payload.tags ?? [],
          });
        } else if (item.proposedAction.type === 'delete_entry') {
          setOrganizeFeedback({ kind: 'approved_delete' });
        }
        void loadPreviews();
      } else if (action === 'reject') {
        setOrganizeFeedback({ kind: 'rejected' });
      }
    } catch (e) {
      setLabelError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────────────────────── */

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-surface-1 border border-warm w-fit">
        <button
          type="button"
          onClick={() => setView('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === 'chat'
              ? 'bg-brand-500 text-on-brand'
              : 'text-muted hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Ask Mentor
        </button>
        <button
          type="button"
          onClick={() => setView('label')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === 'label'
              ? 'bg-brand-500 text-on-brand'
              : 'text-muted hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Organize
          {pendingOrganizeCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                view === 'label' ? 'bg-white text-brand-600' : 'bg-brand-500 text-on-brand'
              }`}
              aria-label={`${pendingOrganizeCount} pending proposals`}
            >
              {pendingOrganizeCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat View */}
      {view === 'chat' && (
        <div className="flex flex-col min-h-[60vh]">
          <div className="mb-6">
            <h1 className="font-serif text-2xl md:text-3xl text-white">
              Ask me about your progress
            </h1>
            <p className="text-muted mt-2 text-sm leading-relaxed">
              I look across your past critiques and portfolio — tuned for{' '}
              <span className="text-stone-300">
                {mode === 'working_pro' ? 'working pro' : 'hobbyist'}
              </span>{' '}
              goals. Replies can take 30–90 seconds when I dig through your library.
            </p>
          </div>

          <div className="flex-1 flex flex-col rounded-xl border border-warm bg-surface-1 min-h-[400px] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="py-4">
                  <TabEmptyState
                    icon={Sparkles}
                    title="Start a conversation"
                    description="I search your past critiques and portfolio memory — replies can take 30–90 seconds when I dig through your library."
                    steps={[
                      'Upload a few photos in My Work so I have memory to draw on',
                      'Pick a suggested question below, or type your own',
                      'Open Glass Box on any critique to see what I remembered',
                    ]}
                  />
                </div>
              )}
              {messages.map((m) => (
                <article
                  key={m.id}
                  className={
                    m.role === 'user'
                      ? 'ml-auto max-w-xl border-l-2 border-brand-500/50 pl-4 py-1'
                      : 'max-w-3xl rounded-xl border border-warm bg-surface-1/90 p-5'
                  }
                >
                  {m.role === 'user' ? (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1.5">You asked</p>
                      <p className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-warm/60">
                        <IrisMark size={22} />
                        <p className="text-[10px] uppercase tracking-widest text-brand-400">From Iris</p>
                      </div>
                      <div className="font-serif text-stone-100 text-sm leading-relaxed">
                        <MentorMarkdown content={m.content} />
                      </div>
                    </>
                  )}
                </article>
              ))}
              {loading && (
                <article
                  className="max-w-3xl rounded-xl border border-warm bg-surface-1/90 p-5"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <IrisMark size={22} className="animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-brand-400">From Iris</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-serif text-brand-300 animate-pulse">Reading your library…</span>
                    {waitSec >= 8 && (
                      <button
                        type="button"
                        onClick={cancelRequest}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:text-white border border-warm"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted font-sans">{stageMessage}</p>
                  <div className="mt-3 h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full bg-brand-500/80 transition-all duration-1000 ease-out-expo"
                      style={{ width: `${Math.min(95, 12 + waitSec * 1.2)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-2 font-sans">
                    {mode === 'working_pro'
                      ? `Often 60–90 seconds · ${waitSec}s — keep this tab open`
                      : `Usually 30–60 seconds · ${waitSec}s — keep this tab open`}
                  </p>
                </article>
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <ChatErrorBanner
                message={error}
                onRetry={
                  lastFailedText
                    ? () => {
                        setError(null);
                        void send(lastFailedText);
                      }
                    : undefined
                }
                onDismiss={() => setError(null)}
              />
            )}

            <div className="px-3 py-2 border-t border-warm/80 bg-canvas-elevated/40">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-2">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={loading}
                    onClick={() => void send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-warm text-stone-300 hover:border-brand-500 hover:text-brand-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="p-3 border-t border-warm flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your progress…"
                disabled={loading}
                className="flex-1 rounded-lg bg-canvas-elevated border border-warm px-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-lg bg-brand-500 text-on-brand disabled:opacity-40 hover:bg-brand-400 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

          {hasSession && (
            <p className="text-xs text-muted mt-2 text-center">
              Session continues across messages (stored in this browser).
            </p>
          )}
        </div>
      )}

      {/* Organize View */}
      {view === 'label' && (
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-white">
              Organize
            </h1>
            <p className="text-brand-400/90 text-sm mt-1">Tag &amp; tidy your library</p>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              I group similar shots, flag near-duplicates, surface hidden gems, and suggest
              searchable tags — you approve every change before it sticks.
            </p>
          </div>

          {/* Visual before/after concept */}
          <div className="rounded-xl border border-warm bg-surface-1 p-4">
            <div className="flex items-center gap-6 text-center">
              <div className="flex-1 space-y-2">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded bg-surface-3 border border-warm/50"
                      style={{ transform: `rotate(${(i - 2) * 5}deg)` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted">Scattered photos</p>
              </div>
              <div className="text-brand-400 text-lg">→</div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded bg-brand-500/20 border border-brand-500/40 flex items-center justify-center"
                    >
                      <span className="text-[8px] text-brand-400">#</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-brand-400">Tagged &amp; searchable</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleScan()}
            disabled={scanning}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {!scanning && <Layers className="w-4 h-4" />}
            {scanning ? 'Scanning…' : 'Scan my library'}
          </button>

          {scanning && (
            <ScanProgressBanner
              message={triageScanStage(scanWaitSec)}
              waitSec={scanWaitSec}
            />
          )}

          {organizeFeedback && (
            <OrganizeFeedbackBanner
              feedback={organizeFeedback}
              onGoToWork={
                organizeFeedback.kind === 'approved_tags' || organizeFeedback.kind === 'approved_delete'
                  ? onGoToWork
                  : undefined
              }
              onDismiss={() => setOrganizeFeedback(null)}
            />
          )}
          {labelError && (
            <p className="text-sm text-red-400" role="alert">
              {labelError}
            </p>
          )}

          {labelLoading && (
            <p className="text-muted text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> One moment…
            </p>
          )}

          {!labelLoading && labelItems.length === 0 && !organizeFeedback && (
            <div className="rounded-xl border border-dashed border-warm/60 bg-surface-1/50 p-6 text-center space-y-3">
              <Layers className="w-10 h-10 text-muted mx-auto" />
              <div>
                <p className="text-white font-medium">
                  {libraryCount === 0 ? 'Add photos first' : 'Ready to scan'}
                </p>
                <p className="text-sm text-muted mt-1">
                  {libraryCount === 0 ? (
                    <>
                      Upload a few shots on Home or My Work — then come back and I&apos;ll group
                      them, suggest tags, and help you spot duplicates.
                    </>
                  ) : (
                    <>
                      Tap &quot;Scan my library&quot; above. I&apos;ll propose tags and tidy-ups
                      for {libraryCount} photo{libraryCount === 1 ? '' : 's'} — you approve each one.
                    </>
                  )}
                </p>
              </div>
              {libraryCount === 0 && onGoToWork && (
                <button
                  type="button"
                  onClick={onGoToWork}
                  className="text-sm text-brand-400 hover:text-brand-300 font-medium"
                >
                  Upload in My Work →
                </button>
              )}
            </div>
          )}

          {labelItems.length > 0 && (
            <p className="text-xs text-muted uppercase tracking-wide">Waiting for your decision</p>
          )}

          <ul className="space-y-4">
            {labelItems.map((item) => {
              const affectedIds = entryIdsForProposal(item);
              const deleteTarget =
                item.proposedAction.type === 'delete_entry' ? affectedIds[0] : undefined;
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-warm bg-surface-1 p-4 space-y-3"
                >
                  <ProposalThumbnails
                    entryIds={affectedIds}
                    previews={previews}
                    highlightDeleteId={deleteTarget}
                  />
                  <p className="text-sm text-white leading-relaxed">{describeProposal(item)}</p>
                  <HitlReasoningCallout reasoning={item.agentReasoning} />
                  {item.proposedAction.type === 'delete_entry' && (
                    <p className="text-xs text-red-300/80 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Permanent delete if you approve
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={acting === item.id}
                      onClick={() => void handleDecision(item.id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-600/90 text-white text-sm font-medium hover:bg-brand-500 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Yes, do this
                    </button>
                    <button
                      type="button"
                      disabled={acting === item.id}
                      onClick={() => void handleDecision(item.id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-warm text-stone-300 text-sm hover:bg-surface-3 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> No thanks
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
