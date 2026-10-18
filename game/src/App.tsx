import { useEffect, useMemo, useState } from 'react';
import type { DecisionRecord, Session } from './types';
import { CONDITIONS, FAST_MODE, STUDY, aidsActive } from './config';
import { FLIGHTS, PRACTICE } from './scenarios';
import { assignCondition, assignFraming, makeParticipantId } from './experiment/assignment';
import { download, pushRow, pushSession, saveLocal, supabaseEnabled } from './logging/logger';
import { Flight, type FlightContext } from './engine/Flight';
import { Debrief } from './debrief/Debrief';
import { Background, Briefing, Consent, Final, Finish, PostFlight, Reveal, Tutorial } from './survey/Pages';

type Step =
  | { k: 'consent' }
  | { k: 'background' }
  | { k: 'tutorial' }
  | { k: 'practice' }
  | { k: 'practice-done' }
  | { k: 'briefing'; f: number }
  | { k: 'flight'; f: number }
  | { k: 'post'; f: number }
  | { k: 'debrief'; f: number }
  | { k: 'final' }
  | { k: 'reveal' }
  | { k: 'finish' };

export default function App() {
  const [session, setSession] = useState<Session>(() => {
    const condition = assignCondition();
    return {
      study_version: STUDY.version,
      participant_id: makeParticipantId(),
      condition,
      framing: assignFraming(condition),
      test_mode: FAST_MODE,
      started_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      decisions: [],
      post_flight: [],
      debriefs: [],
    };
  });
  const [step, setStep] = useState<Step>({ k: 'consent' });
  const [uploaded, setUploaded] = useState<boolean | null>(null);
  const cond = CONDITIONS[session.condition];

  useEffect(() => saveLocal(session), [session]);
  useEffect(() => window.scrollTo(0, 0), [step]);

  const ctx: FlightContext = useMemo(
    () => ({
      participant_id: session.participant_id,
      condition: session.condition,
      has_explanation: cond.explanation,
      has_debrief: cond.debrief,
      framing: session.framing,
    }),
    [session.participant_id, session.condition, session.framing, cond],
  );

  const scenarioFor = (f: number) => FLIGHTS[f - 1];

  function recordDecision(r: DecisionRecord) {
    setSession((s) => ({ ...s, decisions: [...s.decisions, r] }));
    void pushRow('decisions', r);
  }

  function afterPostFlight(f: number) {
    if (cond.debrief && aidsActive(f)) setStep({ k: 'debrief', f });
    else if (f < FLIGHTS.length) setStep({ k: 'briefing', f: f + 1 });
    else setStep({ k: 'final' });
  }

  async function finish() {
    const done = { ...session, completed_at: new Date().toISOString() };
    setSession(done);
    setStep({ k: 'finish' });
    if (supabaseEnabled()) setUploaded(await pushSession(done));
  }

  const downloadData = () =>
    download(`second-seat_${session.participant_id}.json`, JSON.stringify({ ...session, completed_at: session.completed_at ?? new Date().toISOString() }, null, 2));

  switch (step.k) {
    case 'consent':
      return <Consent onAgree={() => setStep({ k: 'background' })} />;
    case 'background':
      return (
        <Background
          onDone={(b) => {
            setSession((s) => ({ ...s, background: b }));
            setStep({ k: 'tutorial' });
          }}
        />
      );
    case 'tutorial':
      return <Tutorial onPractice={() => setStep({ k: 'practice' })} />;
    case 'practice':
      return (
        <Flight
          key="practice"
          scenario={PRACTICE}
          showExplanation={false}
          ctx={ctx}
          onComplete={() => setStep({ k: 'practice-done' })}
        />
      );
    case 'practice-done':
      return (
        <main className="paper">
          <div className="paper-col">
            <h1>Practice complete</h1>
            <p className="lede">The four real flights start now. From here on, your decisions are recorded.</p>
            <button className="btn-paper" onClick={() => setStep({ k: 'briefing', f: 1 })}>
              Go to flight 1
            </button>
          </div>
        </main>
      );
    case 'briefing':
      return <Briefing scenario={scenarioFor(step.f)} onGo={() => setStep({ k: 'flight', f: step.f })} />;
    case 'flight': {
      const f = step.f;
      return (
        <Flight
          key={`flight-${f}`}
          scenario={scenarioFor(f)}
          showExplanation={cond.explanation && aidsActive(f)}
          ctx={ctx}
          onDecision={recordDecision}
          onComplete={() => setStep({ k: 'post', f })}
        />
      );
    }
    case 'post':
      return (
        <PostFlight
          flight={step.f}
          participantId={session.participant_id}
          onDone={(p) => {
            setSession((s) => ({ ...s, post_flight: [...s.post_flight, p] }));
            afterPostFlight(step.f);
          }}
        />
      );
    case 'debrief': {
      const f = step.f;
      return (
        <Debrief
          scenario={scenarioFor(f)}
          decisions={session.decisions.filter((d) => d.flight === f)}
          framing={session.framing}
          onDone={(ms, n) => {
            setSession((s) => ({ ...s, debriefs: [...s.debriefs, { participant_id: s.participant_id, flight: f, reports: n, view_ms: ms }] }));
            setStep(f < FLIGHTS.length ? { k: 'briefing', f: f + 1 } : { k: 'final' });
          }}
        />
      );
    }
    case 'final':
      return (
        <Final
          onDone={(fin) => {
            setSession((s) => ({ ...s, final: fin }));
            setStep({ k: 'reveal' });
          }}
        />
      );
    case 'reveal':
      return <Reveal decisions={session.decisions} onDone={finish} />;
    case 'finish':
      return <Finish participantId={session.participant_id} uploaded={uploaded} onDownload={downloadData} />;
  }
}
