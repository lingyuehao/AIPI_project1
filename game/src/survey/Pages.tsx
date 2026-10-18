import { useState } from 'react';
import type { BackgroundSurvey, DecisionRecord, FinalSurvey, PostFlightSurvey, Scenario } from '../types';
import { STUDY } from '../config';
import { Choice, Likert, Slider } from './controls';
import { FLIGHTS } from '../scenarios';
import { ERROR_TEMPLATES } from '../debrief/reportTemplates';

const Paper = ({ children }: { children: React.ReactNode }) => (
  <main className="paper">
    <div className="paper-col">{children}</div>
  </main>
);

export function Consent({ onAgree }: { onAgree: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <Paper>
      <p className="kicker">Second Seat · AIPI 590 study</p>
      <h1>Fly with an AI first officer</h1>
      <p className="lede">
        You will fly four short airline flights as the captain. An AI first officer called ARIA will give you advice. Your job is to decide what to
        do. No flying experience is needed.
      </p>
      <h2>What taking part involves</h2>
      <p>
        The session takes about 45 minutes on a laptop or desktop computer. After each flight you answer a few questions. We record your decisions,
        how long they take, which pages you open, and your survey answers.
      </p>
      <h2>Your data</h2>
      <p>
        We do not collect your name or email. Your data is stored under a random code and used only for this course project. You can stop at any
        time by closing the page; nothing is kept from an unfinished session unless you download it.
      </p>
      <h2>Questions</h2>
      <p>Contact the researcher through the AIPI 590 course staff at Duke University, or through the person who sent you this link.</p>
      <label className="check">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />I am 18 or older, I have read this page, and I agree to take
        part.
      </label>
      <button className="btn-paper" disabled={!ok} onClick={onAgree}>
        Start
      </button>
    </Paper>
  );
}

export function Background({ onDone }: { onDone: (b: BackgroundSurvey) => void }) {
  const [flight, setFlight] = useState('');
  const [sim, setSim] = useState('');
  const [ai, setAi] = useState('');
  const [gaming, setGaming] = useState('');
  const [trust, setTrust] = useState<number | null>(null);
  const done = flight && sim && ai && gaming && trust;
  return (
    <Paper>
      <h1>About you</h1>
      <Choice label="Flying experience" options={['None', 'Student pilot', 'Licensed pilot', 'Airline or military pilot']} value={flight} onChange={setFlight} />
      <Choice label="Flight simulator experience" options={['None', 'A few times', 'Regularly']} value={sim} onChange={setSim} />
      <Choice label="How often do you use AI assistants such as ChatGPT or Claude?" options={['Never', 'Monthly', 'Weekly', 'Daily']} value={ai} onChange={setAi} />
      <Choice label="How often do you play video games?" options={['Never', 'Monthly', 'Weekly', 'Daily']} value={gaming} onChange={setGaming} />
      <Likert label="In general, how much do you trust AI systems?" value={trust} onChange={setTrust} low="Not at all" high="Completely" />
      <button
        className="btn-paper"
        disabled={!done}
        onClick={() => onDone({ flight_experience: flight, sim_experience: sim, ai_use: ai, gaming, ai_trust_prior: trust ?? 0 })}
      >
        Continue
      </button>
    </Paper>
  );
}

export function Tutorial({ onPractice }: { onPractice: () => void }) {
  return (
    <Paper>
      <h1>How the cockpit works</h1>
      <p className="lede">Each flight has 12 decision points. Between them the flight runs on its own.</p>
      <ol className="steps">
        <li>
          <strong>A situation appears</strong> on the right, and ARIA gives advice. ARIA is a reliable system, but it is not perfect.
        </li>
        <li>
          <strong>You have {STUDY.decisionSeconds} seconds</strong> to accept ARIA's advice or choose another action. If time runs out, ARIA's advice
          is applied.
        </li>
        <li>
          <strong>Cross-check</strong> opens three extra pages: the Comms log (every radio message and weather report, with times), Systems (engine
          and aircraft data), and Checklists. The first time you open them during a decision, {STUDY.verifyCostSeconds} seconds come off the clock.
        </li>
        <li>
          <strong>The two displays</strong> on the left are always visible: the flight display (speed on the left, altitude on the right, ground
          speed at the top) and the navigation display (your route in magenta, weather in green, yellow and red, and any route ARIA proposes as a
          dashed line).
        </li>
      </ol>
      <p>
        You are scored on safety first and efficiency second. You will not be told during the study whether a decision was right; everything is
        revealed at the end.
      </p>
      <button className="btn-paper" onClick={onPractice}>
        Start the practice flight
      </button>
    </Paper>
  );
}

export function Briefing({ scenario, onGo }: { scenario: Scenario; onGo: () => void }) {
  return (
    <Paper>
      <p className="kicker">Flight {scenario.flight} of 4</p>
      <h1>{scenario.title}</h1>
      <p className="lede">{scenario.briefing}</p>
      <dl className="brief-list">
        <dt>Call sign</dt>
        <dd>{scenario.callsign}</dd>
        <dt>Aircraft</dt>
        <dd>{scenario.aircraft}</dd>
        <dt>Decision points</dt>
        <dd>{scenario.events.length}</dd>
      </dl>
      <button className="btn-paper" onClick={onGo}>
        Begin flight {scenario.flight}
      </button>
    </Paper>
  );
}

export function PostFlight({ flight, participantId, onDone }: { flight: number; participantId: string; onDone: (s: PostFlightSurvey) => void }) {
  const [trust, setTrust] = useState<number | null>(null);
  const [t, setT] = useState({ mental: 50, physical: 50, temporal: 50, performance: 50, effort: 50, frustration: 50 });
  const set = (k: keyof typeof t) => (v: number) => setT({ ...t, [k]: v });
  return (
    <Paper>
      <p className="kicker">After flight {flight}</p>
      <h1>Quick check-in</h1>
      <Likert label="How much did you trust ARIA on this flight?" value={trust} onChange={setTrust} low="Not at all" high="Completely" />
      <h2>Workload</h2>
      <Slider label="Mental demand" hint="How mentally demanding was the flight?" value={t.mental} onChange={set('mental')} low="Very low" high="Very high" />
      <Slider label="Physical demand" hint="How physically demanding was it?" value={t.physical} onChange={set('physical')} low="Very low" high="Very high" />
      <Slider label="Time pressure" hint="How hurried or rushed was the pace?" value={t.temporal} onChange={set('temporal')} low="Very low" high="Very high" />
      <Slider label="Performance" hint="How successful were you at what you were asked to do?" value={t.performance} onChange={set('performance')} low="Perfect" high="Failure" />
      <Slider label="Effort" hint="How hard did you have to work for your level of performance?" value={t.effort} onChange={set('effort')} low="Very low" high="Very high" />
      <Slider label="Frustration" hint="How insecure, discouraged, irritated or stressed were you?" value={t.frustration} onChange={set('frustration')} low="Very low" high="Very high" />
      <button
        className="btn-paper"
        disabled={!trust}
        onClick={() =>
          onDone({
            participant_id: participantId,
            flight,
            trust: trust ?? 0,
            tlx_mental: t.mental,
            tlx_physical: t.physical,
            tlx_temporal: t.temporal,
            tlx_performance: t.performance,
            tlx_effort: t.effort,
            tlx_frustration: t.frustration,
          })
        }
      >
        Continue
      </button>
    </Paper>
  );
}

// Trust in Automation scale (Jian, Bisantz & Drury, 2000). Items 1–5 measure distrust and are reverse-coded.
const JIAN = [
  'ARIA is deceptive.',
  'ARIA behaves in an underhanded manner.',
  "I am suspicious of ARIA's intent, actions or outputs.",
  'I am wary of ARIA.',
  "ARIA's actions will have a harmful or injurious outcome.",
  'I am confident in ARIA.',
  'ARIA provides security.',
  'ARIA has integrity.',
  'ARIA is dependable.',
  'ARIA is reliable.',
  'I can trust ARIA.',
  'I am familiar with ARIA.',
];

export function Final({ onDone }: { onDone: (f: FinalSurvey) => void }) {
  const [jian, setJian] = useState<(number | null)[]>(Array(12).fill(null));
  const [resp, setResp] = useState({ you: 25, aria: 25, designers: 25, airline: 25 });
  const [strategy, setStrategy] = useState('');
  const [comments, setComments] = useState('');
  const total = resp.you + resp.aria + resp.designers + resp.airline;
  const done = jian.every((v) => v !== null) && total === 100;
  const setR = (k: keyof typeof resp) => (v: number) => setResp({ ...resp, [k]: v });

  const submit = () => {
    const raw = jian.map((v) => v ?? 0);
    const scored = raw.map((v, i) => (i < 5 ? 8 - v : v));
    onDone({
      jian: raw,
      jian_trust_score: scored.reduce((a, b) => a + b, 0) / scored.length,
      resp_you: resp.you,
      resp_aria: resp.aria,
      resp_designers: resp.designers,
      resp_airline: resp.airline,
      strategy,
      comments,
    });
  };

  return (
    <Paper>
      <h1>Last questions</h1>
      <h2>Your view of ARIA</h2>
      {JIAN.map((item, i) => (
        <Likert
          key={item}
          label={item}
          value={jian[i]}
          onChange={(v) => setJian(jian.map((x, j) => (j === i ? v : x)))}
          low="Not at all"
          high="Extremely"
        />
      ))}
      <h2>Responsibility</h2>
      <p>
        Suppose one of ARIA's errors had led to an accident. How would you divide responsibility? The four parts must add up to 100. Current total:{' '}
        <strong className={total === 100 ? 'ok' : 'bad'}>{total}</strong>
      </p>
      <Slider label="You, the captain" value={resp.you} onChange={setR('you')} low="0" high="100" />
      <Slider label="ARIA, the AI" value={resp.aria} onChange={setR('aria')} low="0" high="100" />
      <Slider label="The engineers who designed ARIA" value={resp.designers} onChange={setR('designers')} low="0" high="100" />
      <Slider label="The airline that deployed ARIA" value={resp.airline} onChange={setR('airline')} low="0" high="100" />
      <h2>In your own words</h2>
      <label className="textarea">
        How did you decide when to check ARIA's advice?
        <textarea rows={4} value={strategy} onChange={(e) => setStrategy(e.target.value)} />
      </label>
      <label className="textarea">
        Anything else you want to tell us? (optional)
        <textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
      </label>
      <button className="btn-paper" disabled={!done} onClick={submit}>
        Finish and see your results
      </button>
    </Paper>
  );
}

export function Reveal({ decisions, onDone }: { decisions: DecisionRecord[]; onDone: () => void }) {
  const errors = decisions.filter((d) => !d.aria_correct);
  const caught = errors.filter((d) => d.detected).length;
  const falseAlarms = decisions.filter((d) => d.false_alarm).length;
  const correctChoices = decisions.filter((d) => d.choice_correct).length;
  const label = (id: string) => {
    for (const f of FLIGHTS) {
      const e = f.events.find((x) => x.id === id);
      if (e) return e;
    }
    return null;
  };
  return (
    <Paper>
      <h1>What really happened</h1>
      <p className="lede">
        ARIA was right 75% of the time. It made {errors.length} deliberate errors across the four flights, and you caught {caught} of them. You also
        overruled ARIA {falseAlarms} {falseAlarms === 1 ? 'time' : 'times'} when it was right. Overall you chose the best action in {correctChoices} of{' '}
        {decisions.length} decisions.
      </p>
      <p>
        This study asks whether explanations during the flight, or incident reports after it, help people catch AI errors later on. Different
        participants saw different versions of ARIA. Please do not discuss the errors with anyone who might still take part.
      </p>
      <table className="reveal">
        <thead>
          <tr>
            <th>Flight</th>
            <th>ARIA's error</th>
            <th>You</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((d) => {
            const e = label(d.event_id);
            return (
              <tr key={d.event_id}>
                <td>{d.flight}</td>
                <td>
                  <strong>{d.error_type ? ERROR_TEMPLATES[d.error_type].label : ''}.</strong> {e?.report?.whatHappened}
                </td>
                <td className={d.detected ? 'ok' : 'bad'}>{d.detected ? 'Caught' : d.action === 'timeout' ? 'Timed out' : 'Accepted'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="btn-paper" onClick={onDone}>
        Continue
      </button>
    </Paper>
  );
}

export function Finish({
  participantId,
  uploaded,
  onDownload,
}: {
  participantId: string;
  uploaded: boolean | null;
  onDownload: () => void;
}) {
  return (
    <Paper>
      <h1>Thank you</h1>
      <p className="lede">Your participant code is {participantId}.</p>
      {uploaded === true && <p>Your responses were saved to the study database. You can close this page.</p>}
      {uploaded === false && (
        <p>
          <strong>Your responses could not be sent automatically.</strong> Download your data file and send it to the researcher.
        </p>
      )}
      {uploaded === null && <p>Download your data file and send it to the researcher.</p>}
      <button className="btn-paper" onClick={onDownload}>
        Download my data file
      </button>
    </Paper>
  );
}
