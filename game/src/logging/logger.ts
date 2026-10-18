import type { DecisionRecord, Session } from '../types';
import { SUPABASE } from '../config';

const STORAGE_PREFIX = 'second-seat-session-';

/** Keeps a copy in the browser so a refresh does not lose data. */
export function saveLocal(session: Session) {
  try {
    localStorage.setItem(STORAGE_PREFIX + session.participant_id, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode); the in-memory session still works.
  }
}

export const supabaseEnabled = () => Boolean(SUPABASE.url && SUPABASE.key);

/** Inserts one row into a Supabase table through the REST API. Fails quietly when offline. */
export async function pushRow(table: 'decisions' | 'sessions', row: object): Promise<boolean> {
  if (!supabaseEnabled()) return false;
  try {
    const res = await fetch(`${SUPABASE.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE.key,
        Authorization: `Bearer ${SUPABASE.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch (err) {
    console.warn('Supabase insert failed', err);
    return false;
  }
}

export async function pushSession(session: Session): Promise<boolean> {
  return pushRow('sessions', {
    participant_id: session.participant_id,
    condition: session.condition,
    framing: session.framing,
    study_version: session.study_version,
    test_mode: session.test_mode,
    payload: session,
  });
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function decisionsToCsv(rows: DecisionRecord[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]) as (keyof DecisionRecord)[];
  const lines = [cols.join(',')];
  for (const r of rows) lines.push(cols.map((c) => csvCell(r[c])).join(','));
  return lines.join('\n');
}

export function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
