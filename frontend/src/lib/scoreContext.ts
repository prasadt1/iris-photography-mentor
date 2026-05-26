/**
 * Score context utilities — translate raw numbers into meaningful labels and actions.
 */

export type ScoreLevel = 'needs-work' | 'developing' | 'strong' | 'exceptional';

export interface ScoreContext {
  level: ScoreLevel;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

/** Get context for a score value (1-10 scale) */
export function getScoreContext(score: number): ScoreContext {
  if (score >= 9) {
    return {
      level: 'exceptional',
      label: 'Exceptional',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      description: 'Top-tier work. This is portfolio-worthy.',
    };
  }
  if (score >= 7) {
    return {
      level: 'strong',
      label: 'Strong',
      color: 'text-brand-400',
      bgColor: 'bg-brand-500/20',
      description: 'Solid execution. Minor refinements possible.',
    };
  }
  if (score >= 5) {
    return {
      level: 'developing',
      label: 'Developing',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      description: 'Good foundation. Focused practice will help.',
    };
  }
  return {
    level: 'needs-work',
    label: 'Needs work',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    description: 'Key area to focus on. See suggestions below.',
  };
}

/** Dimension-specific improvement tips */
const DIMENSION_TIPS: Record<string, string[]> = {
  composition: [
    'Try the rule of thirds — place your subject off-center',
    'Look for leading lines that guide the eye',
    'Simplify the frame — remove distracting elements',
    'Experiment with different angles and perspectives',
  ],
  lighting: [
    'Shoot during golden hour (sunrise/sunset) for warm, soft light',
    'Use window light for flattering indoor portraits',
    'Notice where shadows fall — they shape your subject',
    'Try backlighting for dramatic silhouettes',
  ],
  technique: [
    'Lock focus on your subject\'s eyes for portraits',
    'Use a faster shutter speed to freeze motion',
    'Stabilize your camera — lean against something solid',
    'Check your exposure before shooting, not after',
  ],
  creativity: [
    'Tell a story — what moment are you capturing?',
    'Try an unexpected viewpoint (low, high, close)',
    'Look for patterns, then break them intentionally',
    'Shoot the same subject 10 different ways',
  ],
  subject_impact: [
    'Get closer — fill the frame with your subject',
    'Wait for the decisive moment',
    'Capture genuine emotion, not posed expressions',
    'Create contrast between subject and background',
  ],
};

/** Get 1-2 actionable tips for a dimension based on score */
export function getTipsForDimension(dimension: string, score: number): string[] {
  const tips = DIMENSION_TIPS[dimension.toLowerCase()] ?? DIMENSION_TIPS.composition;

  // Lower scores get more basic tips, higher scores get more advanced
  if (score < 5) {
    return tips.slice(0, 2);
  }
  if (score < 7) {
    return tips.slice(1, 3);
  }
  return tips.slice(2, 4);
}

/** Identify the user's focus area (lowest scoring dimension) */
export function getFocusArea(scores: Record<string, number | null | undefined>): {
  dimension: string;
  score: number;
  label: string;
  tips: string[];
} | null {
  const entries = Object.entries(scores)
    .filter((entry): entry is [string, number] => entry[1] != null)
    .map(([key, value]) => ({ key, value }));

  if (entries.length === 0) return null;

  const lowest = entries.reduce((min, curr) =>
    curr.value < min.value ? curr : min
  );

  const labels: Record<string, string> = {
    composition: 'Composition',
    lighting: 'Lighting',
    technique: 'Technique',
    creativity: 'Creativity',
    subject_impact: 'Subject Impact',
  };

  return {
    dimension: lowest.key,
    score: lowest.value,
    label: labels[lowest.key] ?? lowest.key,
    tips: getTipsForDimension(lowest.key, lowest.value),
  };
}

/** Format a score with its level label */
export function formatScoreWithLevel(score: number): string {
  const ctx = getScoreContext(score);
  return `${score.toFixed(1)} — ${ctx.label}`;
}
