import { useState } from 'react';
import type { AircraftState, CommsMessage, DrawerTab } from '../types';
import { CHECKLISTS } from '../scenarios/checklists';

interface Props {
  tab: DrawerTab;
  s: AircraftState;
  comms: (CommsMessage & { isNew?: boolean })[];
  onTab: (t: DrawerTab) => void;
  onClose: () => void;
}

const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'comms', label: 'Comms log' },
  { id: 'systems', label: 'Systems' },
  { id: 'checklists', label: 'Checklists' },
];

export function Drawer({ tab, s, comms, onTab, onClose }: Props) {
  return (
    <section className="drawer" aria-label="Cross-check pages">
      <div className="drawer-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => onTab(t.id)}>
            {t.label}
          </button>
        ))}
        <button className="drawer-close" onClick={onClose}>
          Back to displays
        </button>
      </div>
      <div className="drawer-body">
        {tab === 'comms' && <CommsLog comms={comms} />}
        {tab === 'systems' && <Systems s={s} />}
        {tab === 'checklists' && <Checklists />}
      </div>
    </section>
  );
}

function CommsLog({ comms }: { comms: (CommsMessage & { isNew?: boolean })[] }) {
  const sorted = [...comms].reverse();
  return (
    <ol className="comms">
      {sorted.map((m) => (
        <li key={m.id} className={m.isNew ? 'new' : ''}>
          <span className="comms-time">{m.time}</span>
          <span className={`comms-src src-${m.source.toLowerCase()}`}>{m.source}</span>
          <span className="comms-text">{m.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Systems({ s }: { s: AircraftState }) {
  const rows: [string, string, string][] = [
    ['N1 (%)', s.n1[0].toFixed(0), s.n1[1].toFixed(0)],
    ['Oil pressure (psi)', String(s.oilPress[0]), String(s.oilPress[1])],
    ['Oil temperature (°C)', String(s.oilTemp[0]), String(s.oilTemp[1])],
  ];
  if (s.aoa) rows.push(['Angle of attack (°)', String(s.aoa[0]), String(s.aoa[1])]);
  return (
    <div className="systems">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Left / ENG 1</th>
            <th>Right / ENG 2</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <th>{r[0]}</th>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl>
        <dt>Fuel on board</dt>
        <dd>{Math.round(s.fuelKg).toLocaleString()} kg</dd>
        <dt>Fuel flow</dt>
        <dd>{Math.round(s.fuelFlowKgH).toLocaleString()} kg/h</dd>
        <dt>Cabin altitude</dt>
        <dd>{Math.round(s.cabinAlt).toLocaleString()} ft</dd>
        <dt>Total air temperature</dt>
        <dd>{s.tat} °C</dd>
        {s.radioAlt !== null && s.radioAlt !== undefined && (
          <>
            <dt>Radio altitude</dt>
            <dd>{s.radioAlt} ft</dd>
          </>
        )}
      </dl>
      {(s.sysNotes?.length ?? 0) > 0 && (
        <ul className="sys-notes">
          {s.sysNotes!.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <ul className="sys-alerts">
        {s.alerts.map((a) => (
          <li key={a.id} className={`alert alert-${a.level}`}>
            {a.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Checklists() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="checklists">
      <p className="checklist-note">Simplified study checklists, not real operating procedures.</p>
      {CHECKLISTS.map((c) => (
        <div key={c.id} className="checklist">
          <button className="checklist-title" aria-expanded={open === c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>
            {c.title}
          </button>
          {open === c.id && (
            <ol>
              {c.steps.map((st) => (
                <li key={st}>{st}</li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}
