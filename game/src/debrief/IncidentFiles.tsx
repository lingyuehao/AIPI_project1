import { FLIGHTS } from '../scenarios';
import { buildReport } from './reportGenerator';
import { IncidentReportView } from './IncidentReportView';
import { ERROR_TEMPLATES } from './reportTemplates';
import type { ErrorType } from '../types';

export function IncidentFiles() {
  const all = FLIGHTS.flatMap((s) => s.events.filter((e) => e.aria.errorType).map((e) => ({ s, e })));
  const types = Object.keys(ERROR_TEMPLATES) as ErrorType[];

  return (
    <main className="paper">
      <div className="paper-col">
        <p className="kicker">Second Seat</p>
        <h1>AI Incident Files</h1>
        <p className="lede">
          Twelve investigations into the errors of ARIA, a fictional AI first officer. Each one follows the structure of an NTSB report and traces
          the error through four layers: the model, the human-AI interaction, the interface, and the organization that deployed it.
        </p>
        <nav className="files-index" aria-label="Error types">
          {types.map((t) => (
            <div key={t}>
              <strong>{ERROR_TEMPLATES[t].label}</strong>
              <span>{ERROR_TEMPLATES[t].mlAnalogue}</span>
            </div>
          ))}
        </nav>
        {all.map(({ s, e }) => (
          <IncidentReportView key={e.id} r={buildReport(s, e, null, 'systemic')} />
        ))}
        <p className="files-foot">
          Scenarios are simplified and partly fictional. Checklists are written for the study and are not operating procedures.
        </p>
      </div>
    </main>
  );
}
