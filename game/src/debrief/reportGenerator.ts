import type { DecisionRecord, Framing, Scenario, ScenarioEvent } from '../types';
import { ERROR_TEMPLATES, PANEL_LABEL, PHASE_LABEL } from './reportTemplates';

export interface IncidentReport {
  docket: string;
  title: string;
  flightLine: string;
  errorLabel: string;
  mlAnalogue: string;
  synopsis: string;
  history: { t: string; text: string }[];
  cue: string;
  analysis: { heading: string; text: string }[];
  probableCause: string;
  contributing: string[];
  recommendations: { to: string; text: string }[];
  outcome: 'detected' | 'missed' | 'reference';
}

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/**
 * Builds an NTSB-style report for one ARIA error.
 * `log` is the player's decision record; pass null for the reference version (Incident Files page).
 */
export function buildReport(
  scenario: Scenario,
  ev: ScenarioEvent,
  log: DecisionRecord | null,
  framing: Framing | '',
): IncidentReport {
  if (!ev.aria.errorType || !ev.cue || !ev.report) throw new Error(`${ev.id} is not an ARIA error event`);
  const t = ERROR_TEMPLATES[ev.aria.errorType];
  const optionLabel = (id: string) => ev.options.find((o) => o.id === id)?.label ?? id;
  const outcome: IncidentReport['outcome'] = !log ? 'reference' : log.detected ? 'detected' : 'missed';
  const cuePlace = ['pfd', 'nav', 'aria'].includes(ev.cue.panel)
    ? `on the ${PANEL_LABEL[ev.cue.panel]}, visible without a cross-check`
    : `on the ${PANEL_LABEL[ev.cue.panel]}, one cross-check away`;

  // Synopsis
  let result: string;
  if (!log) result = `If a crew accepts the advice: ${lowerFirst(ev.report.consequence)}`;
  else if (log.action === 'timeout') result = `Time ran out and ARIA's advice was applied by default. ${ev.report.consequence}`;
  else if (log.action === 'accept') result = `The crew accepted the advice. ${ev.report.consequence}`;
  else if (log.choice_correct) result = `The crew rejected the advice and chose "${optionLabel(log.chosen_option)}", the correct action.`;
  else result = `The crew rejected the advice but chose "${optionLabel(log.chosen_option)}" instead of the correct action, "${optionLabel(ev.correctOption)}".`;
  const synopsis = `At ${ev.clock}, during ${PHASE_LABEL[ev.phase]}, ARIA advised: "${ev.aria.text}" ${ev.report.whatHappened} ${result}`;

  // History of the flight
  const history: IncidentReport['history'] = [
    { t: 'T+0.0 s', text: `Situation presented: ${ev.situation}` },
    { t: 'T+0.0 s', text: `ARIA advised: "${ev.aria.text}"${ev.aria.broadcast ? ` Proposed radio call: "${ev.aria.broadcast}"` : ''}` },
  ];
  if (log) {
    if (log.verified && log.first_verify_ms !== null) {
      const pages = log.panels_viewed.split('|').filter(Boolean).map((p) => PANEL_LABEL[p] ?? p).join(', ');
      history.push({ t: `T+${secs(log.first_verify_ms)}`, text: `Crew opened the cross-check pages: ${pages}.` });
    }
    const decision =
      log.action === 'timeout'
        ? 'Decision time expired; ARIA\'s advice was applied by default.'
        : log.action === 'accept'
          ? 'Crew accepted ARIA\'s advice.'
          : `Crew rejected ARIA's advice and selected "${optionLabel(log.chosen_option)}".`;
    history.push({ t: `T+${secs(log.response_ms)}`, text: decision });
  }

  // Interaction layer, written from the player's log
  let interaction: string;
  if (!log) {
    interaction = `The information that contradicted ARIA was ${cuePlace}. Whether a crew catches this error depends on whether they look there before deciding.`;
  } else if (log.detected) {
    interaction = log.verified
      ? `The crew rejected the advice after opening the cross-check pages (${log.panels_viewed.split('|').map((p) => PANEL_LABEL[p] ?? p).join(', ')}). The contradicting information was ${cuePlace}.`
      : `The crew rejected the advice without opening the cross-check pages, relying on what was on the primary displays. The contradicting information was ${cuePlace}.`;
  } else {
    interaction = log.verified
      ? `The crew opened the cross-check pages (${log.panels_viewed.split('|').map((p) => PANEL_LABEL[p] ?? p).join(', ')}) but did not act on the contradicting information, which was ${cuePlace}.`
      : `The crew ${log.action === 'timeout' ? 'did not decide in time' : 'accepted the advice'} without opening the cross-check pages. The contradicting information was ${cuePlace}.`;
  }

  const layers = {
    model: { heading: 'AI model', text: t.model },
    interaction: { heading: 'Human-AI interaction', text: interaction },
    interface: { heading: 'Interface design', text: t.interface },
    organization: { heading: 'Organization and deployment', text: t.organization },
  };

  // Framing manipulation (RQ4): same facts, different emphasis and order.
  const individual = framing === 'individual' && log !== null && !log.detected;
  const analysis = individual
    ? [layers.interaction, layers.model, layers.interface, layers.organization]
    : [layers.model, layers.interface, layers.organization, layers.interaction];
  const probableCause = individual ? t.individualCause : t.systemicCause;
  const contributing = individual
    ? [t.systemicCause]
    : log && !log.detected
      ? [t.individualCause]
      : [];

  return {
    docket: `SSIR-${ev.id}`,
    title: `${t.label}: ${ev.report.whatHappened.replace(/\.$/, '')}`,
    flightLine: `${scenario.callsign} · ${scenario.origin} to ${scenario.destination} · ${scenario.aircraft}`,
    errorLabel: t.label,
    mlAnalogue: t.mlAnalogue,
    synopsis,
    history,
    cue: ev.cue.description,
    analysis,
    probableCause,
    contributing,
    recommendations: [
      { to: 'To flight crews', text: t.recCrew },
      { to: 'To AI developers', text: t.recDeveloper },
      { to: 'To regulators', text: t.recRegulator },
    ],
    outcome,
  };
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
