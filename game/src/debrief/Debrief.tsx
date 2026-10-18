import { useMemo, useRef } from 'react';
import type { DecisionRecord, Framing, Scenario } from '../types';
import { buildReport } from './reportGenerator';
import { IncidentReportView } from './IncidentReportView';

interface Props {
  scenario: Scenario;
  decisions: DecisionRecord[];
  framing: Framing | '';
  onDone: (viewMs: number, reports: number) => void;
}

/** Post-flight debrief: one report for every ARIA error in the flight just flown. */
export function Debrief({ scenario, decisions, framing, onDone }: Props) {
  const opened = useRef(Date.now());
  const reports = useMemo(
    () =>
      scenario.events
        .filter((e) => e.aria.errorType)
        .map((e) => buildReport(scenario, e, decisions.find((d) => d.event_id === e.id) ?? null, framing)),
    [scenario, decisions, framing],
  );

  return (
    <main className="paper">
      <div className="paper-col">
        <p className="kicker">After landing</p>
        <h1>Debrief: {scenario.title}</h1>
        <p className="lede">
          ARIA made {reports.length} errors on this flight. The safety board investigated each one. Read the reports before your next flight.
        </p>
        {reports.map((r) => (
          <IncidentReportView key={r.docket} r={r} />
        ))}
        <button className="btn-paper" onClick={() => onDone(Date.now() - opened.current, reports.length)}>
          Continue to the next flight
        </button>
      </div>
    </main>
  );
}
