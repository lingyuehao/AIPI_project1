import type { IncidentReport } from './reportGenerator';

/** Renders one report in the style of an NTSB final report. */
export function IncidentReportView({ r }: { r: IncidentReport }) {
  return (
    <article className="report">
      <header className="report-head">
        <p className="report-agency">Second Seat Safety Board · AI Incident Report</p>
        <p className="report-docket">{r.docket}</p>
        <h2>{r.title}</h2>
        <p className="report-flight">{r.flightLine}</p>
        {r.outcome !== 'reference' && (
          <p className={`report-outcome ${r.outcome}`}>{r.outcome === 'detected' ? 'Error caught by the crew' : 'Error not caught by the crew'}</p>
        )}
      </header>

      <section>
        <h3>Synopsis</h3>
        <p>{r.synopsis}</p>
      </section>

      <section>
        <h3>History of the flight</h3>
        <table className="report-timeline">
          <tbody>
            {r.history.map((h, i) => (
              <tr key={i}>
                <th>{h.t}</th>
                <td>{h.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>What the displays showed</h3>
        <p>{r.cue}</p>
      </section>

      <section>
        <h3>Analysis</h3>
        {r.analysis.map((a) => (
          <div key={a.heading} className="report-layer">
            <h4>{a.heading}</h4>
            <p>{a.text}</p>
          </div>
        ))}
        <p className="report-ml">
          <span>Machine learning parallel.</span> {r.mlAnalogue}
        </p>
      </section>

      <section>
        <h3>Probable cause</h3>
        <p className="report-cause">{r.probableCause}</p>
        {r.contributing.length > 0 && (
          <>
            <h4>Contributing factor</h4>
            {r.contributing.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </>
        )}
      </section>

      <section>
        <h3>Safety recommendations</h3>
        <dl className="report-recs">
          {r.recommendations.map((rec) => (
            <div key={rec.to}>
              <dt>{rec.to}</dt>
              <dd>{rec.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="report-foot">
        This board does not assign blame. Its purpose is to find what allowed the error through, so the next crew is safer.
      </footer>
    </article>
  );
}
