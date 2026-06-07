/** Strip markdown-ish formatting for Web Speech API utterances. */
import { humanizeOrganizeReasoning } from './humanizeOrganizeReasoning';

export function plainTextForSpeech(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function practiceSpeechText(parts: {
  targetSkill?: string;
  brief: string;
  rationale?: string | null;
}): string {
  const segments: string[] = [];
  if (parts.targetSkill) {
    segments.push(`Focus on ${parts.targetSkill.replace(/_/g, ' ')}.`);
  }
  segments.push(plainTextForSpeech(parts.brief));
  if (parts.rationale?.trim()) {
    segments.push(plainTextForSpeech(humanizeOrganizeReasoning(parts.rationale)));
  }
  return segments.filter(Boolean).join(' ');
}
