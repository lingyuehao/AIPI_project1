import type { ScenarioEvent } from '../types';
import { STUDY } from '../config';

interface Props {
  ev: ScenarioEvent;
  showExplanation: boolean;
  secondsLeft: number;
  verified: boolean;
  rejecting: boolean;
  hl: Set<string>;
  onAccept: () => void;
  onRejectStart: () => void;
  onReject: (optionId: string) => void;
  onCancelReject: () => void;
  onVerify: () => void;
  onEvidence: (ref: string | undefined) => void;
}

export function AriaCard(p: Props) {
  const { ev } = p;
  const frac = Math.max(0, Math.min(1, p.secondsLeft / STUDY.decisionSeconds));
  const low = p.secondsLeft <= 8;
  const alternatives = ev.options.filter((o) => o.id !== ev.aria.recommend);

  return (
    <section className="aria" aria-label="ARIA advice">
      <header className="aria-head">
        <span className="aria-name">ARIA</span>
        <span className="aria-role">AI first officer</span>
      </header>

      <p className="aria-advice">{ev.aria.text}</p>

      {ev.aria.broadcast && (
        <div className="aria-broadcast">
          <span>Radio call ARIA will send</span>
          <q>{ev.aria.broadcast}</q>
        </div>
      )}

      {p.showExplanation && (
        <div className="aria-explain">
          <p className="aria-why">{ev.aria.rationale}</p>
          <div className="aria-conf" aria-label={`Confidence ${Math.round(ev.aria.confidence * 100)} percent`}>
            <span>Confidence</span>
            <div className="conf-bar">
              <div style={{ width: `${ev.aria.confidence * 100}%` }} />
            </div>
            <strong>{Math.round(ev.aria.confidence * 100)}%</strong>
          </div>
          <div className="aria-evidence">
            <span>Based on</span>
            <ul>
              {ev.aria.evidence.map((e) => (
                <li key={e.label}>
                  {e.ref ? (
                    <button className={p.hl.has(e.ref) ? 'chip on' : 'chip'} onClick={() => p.onEvidence(e.ref)}>
                      {e.label}
                    </button>
                  ) : (
                    <span className="chip static">{e.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className={`timer ${low ? 'low' : ''}`} role="timer" aria-label={`${Math.ceil(p.secondsLeft)} seconds left`}>
        <div className="timer-bar" style={{ transform: `scaleX(${frac})` }} />
        <span>{Math.ceil(p.secondsLeft)} s</span>
      </div>

      {!p.rejecting ? (
        <div className="actions">
          <button className="btn btn-accept" onClick={p.onAccept}>
            Accept ARIA's advice
          </button>
          <button className="btn btn-reject" onClick={p.onRejectStart}>
            Choose another action
          </button>
          <button className="btn btn-verify" onClick={p.onVerify}>
            {p.verified ? 'Open cross-check pages' : `Cross-check (costs ${STUDY.verifyCostSeconds} s)`}
          </button>
        </div>
      ) : (
        <div className="actions">
          <p className="reject-prompt">What do you want to do instead?</p>
          {alternatives.map((o) => (
            <button key={o.id} className="btn btn-option" onClick={() => p.onReject(o.id)}>
              {o.label}
            </button>
          ))}
          <button className="btn btn-quiet" onClick={p.onCancelReject}>
            Back
          </button>
        </div>
      )}
      <p className="aria-foot">If time runs out, ARIA's advice is applied.</p>
    </section>
  );
}
