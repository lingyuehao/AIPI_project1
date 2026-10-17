import type { ConditionId } from './types';

export const STUDY = {
  version: '1.0.0',
  decisionSeconds: 25, // countdown per decision event
  verifyCostSeconds: 6, // seconds removed from the countdown the first time a player cross-checks
  aidedFlights: [2, 3], // flights where the experimental condition is applied
  testFlight: 4, // no aids for anyone; new error types appear
  ariaReliability: 0.75, // 9 of 12 recommendations are correct in each flight
};

export const CONDITIONS: Record<ConditionId, { explanation: boolean; debrief: boolean; label: string }> = {
  A: { explanation: false, debrief: false, label: 'Control: advice only' },
  B: { explanation: true, debrief: false, label: 'Real-time explanation' },
  C: { explanation: false, debrief: true, label: 'Post-flight debrief' },
  D: { explanation: true, debrief: true, label: 'Explanation + debrief' },
};

/**
 * Test mode (?fast=1): quiet gaps between decisions shrink to half a second.
 * For piloting and debugging only; sessions are flagged test_mode and should be excluded from analysis.
 */
export const FAST_MODE = new URLSearchParams(window.location.search).get('fast') === '1';
export const gapMs = (gapSec: number) => (FAST_MODE ? 500 : gapSec * 1000);

export const aidsActive = (flight: number) => STUDY.aidedFlights.includes(flight);

export const SUPABASE = {
  url: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '',
  key: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '',
};
