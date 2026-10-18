import type { Scenario } from '../types';
import practice from './flight0_practice.json';
import f1 from './flight1.json';
import f2 from './flight2.json';
import f3 from './flight3.json';
import f4 from './flight4.json';

export const PRACTICE = practice as unknown as Scenario;
export const FLIGHTS: Scenario[] = [f1, f2, f3, f4] as unknown as Scenario[];

if (import.meta.env.DEV) {
  import('../engine/validate').then(({ validateScenario }) => {
    for (const s of [PRACTICE, ...FLIGHTS]) {
      for (const problem of validateScenario(s)) console.warn(`Scenario ${s.flight}: ${problem}`);
    }
  });
}
