import { useEffect, useRef, useState } from 'react';
import type {
  Action,
  AircraftState,
  CommsMessage,
  ConditionId,
  DecisionRecord,
  DrawerTab,
  Framing,
  NavScene,
  Scenario,
} from '../types';
import { STUDY, aidsActive, gapMs } from '../config';
import { PFD } from '../cockpit/PFD';
import { NavDisplay } from '../cockpit/NavDisplay';
import { AlertStrip } from '../cockpit/AlertStrip';
import { Drawer } from '../cockpit/Drawer';
import { AriaCard } from '../aria/AriaCard';

export interface FlightContext {
  participant_id: string;
  condition: ConditionId;
  has_explanation: boolean;
  has_debrief: boolean;
  framing: Framing | '';
}

interface Props {
  scenario: Scenario;
  showExplanation: boolean;
  ctx: FlightContext;
  onDecision?: (r: DecisionRecord) => void;
  onComplete: (records: DecisionRecord[]) => void;
}

type Stage = 'gap' | 'decision';
type Msg = CommsMessage & { isNew?: boolean };

/**
 * Plays one scenario: a quiet gap, then a decision with a countdown, for each event.
 * No feedback on correctness is shown during the flight.
 */
export function Flight({ scenario, showExplanation, ctx, onDecision, onComplete }: Props) {
  const events = scenario.events;
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>('gap');
  const [stageEnd, setStageEnd] = useState(() => Date.now() + gapMs(events[0].gapSec));
  const [now, setNow] = useState(() => Date.now());
  const [ac, setAc] = useState<AircraftState>(scenario.initialState);
  const [comms, setComms] = useState<Msg[]>(scenario.initialComms);
  const [nav, setNav] = useState<NavScene>(scenario.initialNav);
  const [clock, setClock] = useState(events[0].clock);
  const [drawer, setDrawer] = useState<DrawerTab | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null);
  const [panels, setPanels] = useState<DrawerTab[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [hl, setHl] = useState<Set<string>>(new Set());
  const [evidenceClicks, setEvidenceClicks] = useState(0);
  const shownAt = useRef(Date.now());
  const decided = useRef(false);
  const records = useRef<DecisionRecord[]>([]);
  const ev = events[idx];

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (stage === 'gap' && now >= stageEnd) beginDecision();
    else if (stage === 'decision' && now >= stageEnd && !decided.current) decide('timeout', ev.aria.recommend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function beginDecision() {
    const e = events[idx];
    setAc((prev) => ({ ...prev, ...e.state }));
    setComms((prev) => [...prev.map((m) => ({ ...m, isNew: false })), ...(e.comms ?? []).map((m) => ({ ...m, isNew: true }))]);
    if (e.nav) setNav(e.nav);
    setClock(e.clock);
    setDrawer(null);
    setVerifiedAt(null);
    setPanels([]);
    setRejecting(false);
    setHl(new Set());
    setEvidenceClicks(0);
    decided.current = false;
    shownAt.current = Date.now();
    setStageEnd(Date.now() + STUDY.decisionSeconds * 1000);
    setStage('decision');
  }

  function decide(action: Action, chosen: string) {
    if (decided.current || stage !== 'decision') return;
    decided.current = true;
    const ariaCorrect = ev.aria.recommend === ev.correctOption;
    const rec: DecisionRecord = {
      participant_id: ctx.participant_id,
      condition: ctx.condition,
      has_explanation: ctx.has_explanation,
      has_debrief: ctx.has_debrief,
      framing: ctx.framing,
      flight: scenario.flight,
      event_index: idx + 1,
      event_id: ev.id,
      phase: ev.phase,
      aids_active: aidsActive(scenario.flight),
      explanation_shown: showExplanation,
      aria_recommend: ev.aria.recommend,
      aria_correct: ariaCorrect,
      error_type: ev.aria.errorType ?? '',
      severity: ev.severity,
      action,
      chosen_option: chosen,
      correct_option: ev.correctOption,
      choice_correct: chosen === ev.correctOption,
      detected: !ariaCorrect && action === 'reject',
      false_alarm: ariaCorrect && action === 'reject',
      verified: verifiedAt !== null,
      panels_viewed: panels.join('|'),
      first_verify_ms: verifiedAt,
      evidence_clicks: evidenceClicks,
      response_ms: Date.now() - shownAt.current,
      timestamp: new Date().toISOString(),
    };
    records.current.push(rec);
    onDecision?.(rec);

    if (idx + 1 < events.length) {
      setIdx(idx + 1);
      setStage('gap');
      setStageEnd(Date.now() + gapMs(events[idx + 1].gapSec));
      setDrawer(null);
      setRejecting(false);
      setHl(new Set());
    } else {
      onComplete(records.current);
    }
  }

  function openDrawer(tab: DrawerTab) {
    if (stage !== 'decision') return;
    if (verifiedAt === null) {
      setVerifiedAt(Date.now() - shownAt.current);
      // The cost never leaves fewer than 3 seconds to decide.
      setStageEnd((end) => Math.max(Date.now() + 3000, end - STUDY.verifyCostSeconds * 1000));
    }
    setPanels((p) => (p.includes(tab) ? p : [...p, tab]));
    setDrawer(tab);
  }

  function toggleEvidence(ref: string | undefined) {
    if (!ref) return;
    setEvidenceClicks((n) => n + 1);
    setHl((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }

  const secondsLeft = Math.max(0, (stageEnd - now) / 1000);
  const latestAtc = [...comms].reverse().find((m) => m.source === 'ATC') ?? null;
  const newCount = comms.filter((m) => m.isNew).length;
  const progress = stage === 'decision' ? idx + 1 : idx;

  return (
    <div className="cockpit">
      <header className="flight-head">
        <div className="flight-id">
          <strong>{scenario.callsign}</strong>
          <span>
            {scenario.origin} to {scenario.destination}
          </span>
        </div>
        <div className="flight-phase">{stage === 'decision' ? ev.phase : 'flying'}</div>
        <div className="flight-clock">{clock}</div>
        <div className="flight-progress" aria-label={`Item ${progress} of ${events.length}`}>
          {events.map((e, i) => (
            <span key={e.id} className={i < idx ? 'done' : i === idx && stage === 'decision' ? 'now' : ''} />
          ))}
        </div>
      </header>

      <div className="panel-row">
        <div className="screens">
          {drawer ? (
            <Drawer tab={drawer} s={ac} comms={comms} onTab={openDrawer} onClose={() => setDrawer(null)} />
          ) : (
            <>
              <div className="screen">
                <PFD s={ac} hl={hl} />
              </div>
              <div className="screen">
                <NavDisplay nav={nav} heading={ac.heading} hl={hl} />
              </div>
            </>
          )}
        </div>

        <aside className="right">
          {stage === 'decision' ? (
            <>
              <section className="situation" aria-live="assertive">
                <h2>Situation</h2>
                <p>{ev.situation}</p>
              </section>
              <AriaCard
                ev={ev}
                showExplanation={showExplanation}
                secondsLeft={secondsLeft}
                verified={verifiedAt !== null}
                rejecting={rejecting}
                hl={hl}
                onAccept={() => decide('accept', ev.aria.recommend)}
                onRejectStart={() => setRejecting(true)}
                onReject={(id) => decide('reject', id)}
                onCancelReject={() => setRejecting(false)}
                onVerify={() => openDrawer(drawer ?? 'comms')}
                onEvidence={toggleEvidence}
              />
            </>
          ) : (
            <section className="idle">
              <p className="idle-line">ARIA is monitoring the flight.</p>
              <p className="idle-sub">Next item in {Math.ceil(secondsLeft)} s</p>
            </section>
          )}
        </aside>
      </div>

      <AlertStrip s={ac} latestAtc={latestAtc} newCount={stage === 'decision' ? newCount : 0} />
    </div>
  );
}
