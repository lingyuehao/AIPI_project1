import type { AircraftState, CommsMessage } from '../types';

interface Props {
  s: AircraftState;
  latestAtc: CommsMessage | null;
  newCount: number;
}

/** Engine and alert summary plus the latest ATC transmission. Always visible. */
export function AlertStrip({ s, latestAtc, newCount }: Props) {
  return (
    <div className="strip">
      <div className="strip-engines" aria-label="Engines">
        <div>
          <span className="strip-k">N1</span>
          <span className="strip-v">{s.n1[0].toFixed(0)}</span>
          <span className="strip-v">{s.n1[1].toFixed(0)}</span>
        </div>
        <div>
          <span className="strip-k">Fuel</span>
          <span className="strip-v strip-wide">{Math.round(s.fuelKg).toLocaleString()} kg</span>
        </div>
      </div>
      <ul className="strip-alerts" aria-label="Alerts">
        {s.alerts.length === 0 && <li className="alert-none">No alerts</li>}
        {s.alerts.map((a) => (
          <li key={a.id} className={`alert alert-${a.level}`}>
            {a.text}
          </li>
        ))}
      </ul>
      <div className="strip-atc" aria-live="polite">
        <span className="strip-k">Last ATC call</span>
        <span className="strip-atc-text">{latestAtc ? `${latestAtc.time}  ${latestAtc.text}` : 'None yet'}</span>
        {newCount > 0 && <span className="strip-new">{newCount} new in Comms log</span>}
      </div>
    </div>
  );
}
