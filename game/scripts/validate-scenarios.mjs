import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'scenarios');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
let failed = false;

for (const file of files) {
  const s = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const problems = [];
  const ids = new Set();
  const errors = [];
  s.events.forEach((ev, i) => {
    if (ids.has(ev.id)) problems.push(`${ev.id}: duplicate id`);
    ids.add(ev.id);
    const opts = ev.options.map((o) => o.id);
    if (!opts.includes(ev.correctOption)) problems.push(`${ev.id}: correctOption not in options`);
    if (!opts.includes(ev.aria.recommend)) problems.push(`${ev.id}: aria.recommend not in options`);
    const wrong = ev.aria.recommend !== ev.correctOption;
    if (wrong && !ev.aria.errorType) problems.push(`${ev.id}: wrong advice without errorType`);
    if (!wrong && ev.aria.errorType) problems.push(`${ev.id}: right advice with errorType`);
    if (wrong && (!ev.cue || !ev.report)) problems.push(`${ev.id}: wrong advice needs cue and report`);
    if (wrong) errors.push(`#${i + 1} ${ev.aria.errorType}`);
  });
  const reliability = s.events.length ? 1 - errors.length / s.events.length : 0;
  console.log(`${file}: ${s.events.length} events, ARIA errors at ${errors.join(', ') || 'none'} (reliability ${(reliability * 100).toFixed(0)}%)`);
  for (const p of problems) console.log(`  PROBLEM ${p}`);
  if (problems.length) failed = true;
}
process.exit(failed ? 1 : 0);
