import type { Scenario } from '../types';

export function validateScenario(s: Scenario): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const ev of s.events) {
    if (ids.has(ev.id)) problems.push(`${ev.id}: duplicate event id`);
    ids.add(ev.id);
    const optionIds = ev.options.map((o) => o.id);
    if (!optionIds.includes(ev.correctOption)) problems.push(`${ev.id}: correctOption not in options`);
    if (!optionIds.includes(ev.aria.recommend)) problems.push(`${ev.id}: aria.recommend not in options`);
    const wrong = ev.aria.recommend !== ev.correctOption;
    if (wrong && !ev.aria.errorType) problems.push(`${ev.id}: ARIA is wrong but errorType is null`);
    if (!wrong && ev.aria.errorType) problems.push(`${ev.id}: ARIA is right but has an errorType`);
    if (wrong && (!ev.cue || !ev.report)) problems.push(`${ev.id}: wrong advice needs a cue and a report`);
    if (ev.aria.confidence < 0 || ev.aria.confidence > 1) problems.push(`${ev.id}: confidence must be 0..1`);
  }
  return problems;
}
