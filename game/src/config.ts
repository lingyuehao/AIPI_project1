import type { ConditionId } from './types';

export const STUDY = {
  version: '1.0.0',
  decisionSeconds: 25,
  verifyCostSeconds: 6, // charged on the first cross-check only
  aidedFlights: [2, 3],
  testFlight: 4,
  ariaReliability: 0.75,
};

export const CONDITIONS: Record<ConditionId, { explanation: boolean; debrief: boolean; label: string }> = {
  A: { explanation: false, debrief: false, label: 'Control: advice only' },
  B: { explanation: true, debrief: false, label: 'Real-time explanation' },
  C: { explanation: false, debrief: true, label: 'Post-flight debrief' },
  D: { explanation: true, debrief: true, label: 'Explanation + debrief' },
};

// ?fast=1 is for piloting only; those sessions are flagged test_mode.
export const FAST_MODE = new URLSearchParams(window.location.search).get('fast') === '1';
export const gapMs = (gapSec: number) => (FAST_MODE ? 500 : gapSec * 1000);

export const aidsActive = (flight: number) => STUDY.aidedFlights.includes(flight);

export const SUPABASE = {
  url: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '',
  key: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '',
};
