import type { ConditionId, Framing } from '../types';
import { CONDITIONS } from '../config';

const params = () => new URLSearchParams(window.location.search);

/** Participant id from ?pid=..., otherwise a random id. */
export function makeParticipantId(): string {
  const pid = params().get('pid');
  if (pid) return pid.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `P-${rand}`;
}

/**
 * Condition from ?cond=A|B|C|D, otherwise random.
 * For balanced groups, hand out pre-generated links (analysis/make_participant_links.py)
 * instead of relying on random assignment.
 */
export function assignCondition(): ConditionId {
  const q = (params().get('cond') || '').toUpperCase();
  if (q === 'A' || q === 'B' || q === 'C' || q === 'D') return q;
  const all: ConditionId[] = ['A', 'B', 'C', 'D'];
  return all[Math.floor(Math.random() * all.length)];
}

/** Report framing for the debrief groups (RQ4), from ?framing=systemic|individual or random. */
export function assignFraming(condition: ConditionId): Framing | '' {
  if (!CONDITIONS[condition].debrief) return '';
  const q = params().get('framing');
  if (q === 'systemic' || q === 'individual') return q;
  return Math.random() < 0.5 ? 'systemic' : 'individual';
}

export const isIncidentFilesView = () => params().get('view') === 'incidents';
