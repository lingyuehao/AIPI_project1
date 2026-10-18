import type { ErrorType } from '../types';

// Layers adapted from HFACS (Shappell & Wiegmann, 2000).
export interface ErrorTemplate {
  label: string;
  mlAnalogue: string;
  model: string;
  interface: string;
  organization: string;
  systemicCause: string;
  individualCause: string;
  recCrew: string;
  recDeveloper: string;
  recRegulator: string;
}

export const ERROR_TEMPLATES: Record<ErrorType, ErrorTemplate> = {
  E1_stale_data: {
    label: 'Stale data',
    mlAnalogue: 'Data drift: the model acted on inputs that no longer described the world.',
    model:
      'ARIA selected the information it relied on by relevance, not by age. It had no rule that a newer report replaces an older one, so an outdated report carried full weight.',
    interface:
      "ARIA's advice did not show the age of the data behind it. The newer report was in the communications log, one cross-check away, rather than beside the advice.",
    organization:
      'The system was certified on scenarios where weather and airport data stay constant during a decision. Fast-changing conditions, such as a frontal passage, were not part of its acceptance tests.',
    systemicCause:
      'ARIA used outdated information and the interface did not show how old it was, so the advice looked current when it was not.',
    individualCause:
      'The crew acted on ARIA\'s advice without checking whether newer information had arrived.',
    recCrew: 'Before acting on weather- or airport-dependent advice, confirm the time stamp of the latest report.',
    recDeveloper: 'Show the age of every input next to the advice, and reject inputs older than a set limit when newer data exists.',
    recRegulator: 'Require data-freshness checks in the certification of advisory AI systems.',
  },
  E2_sensor_fault: {
    label: 'Sensor fault',
    mlAnalogue: 'Garbage in, garbage out: one corrupted input dominated the output.',
    model:
      'ARIA trusted a single sensor and did not cross-check it against other data that contradicted it. A plausibility check across sensors would have flagged the reading.',
    interface:
      'The advice repeated the faulty reading without showing the contradicting values. The cross-check data was on screen, but nothing tied it to the advice.',
    organization:
      'Single-sensor failures are a known hazard in aviation, but the system was deployed without a requirement that safety-critical advice use redundant sources.',
    systemicCause:
      'ARIA relied on one failed sensor, and nothing in the system design required it to check that sensor against the others.',
    individualCause:
      'The crew acted on a single abnormal reading without cross-checking the other instruments.',
    recCrew: 'When one instrument disagrees with the rest, treat it as suspect before acting on advice built on it.',
    recDeveloper: 'Require agreement between independent sensors before issuing safety-critical advice, and show the disagreement to the crew.',
    recRegulator: 'Prohibit single-source inputs for AI advice that commands large control changes.',
  },
  E3_out_of_distribution: {
    label: 'Out-of-distribution situation',
    mlAnalogue: 'Out-of-distribution failure with overconfidence: a situation unlike the training data, reported with high confidence.',
    model:
      'ARIA had not been trained on this kind of event. It matched the symptoms to the closest familiar pattern and reported high confidence, because its confidence measured similarity to known cases, not whether the case was known.',
    interface:
      "ARIA's confidence figure looked the same for familiar and unfamiliar situations, so it gave no warning that ARIA was outside its experience.",
    organization:
      'The operator did not publish a list of situations ARIA was never trained on, so crews could not know when to stop relying on it.',
    systemicCause:
      'ARIA met a situation outside its training and reported high confidence anyway, and the crew had no way to tell.',
    individualCause:
      'The crew relied on ARIA\'s confident answer instead of checking the information that pointed to an unusual situation.',
    recCrew: 'Treat high confidence as a statement about familiarity, not correctness, when the situation is unusual.',
    recDeveloper: 'Detect inputs unlike the training data and say so plainly instead of reporting a confidence figure.',
    recRegulator: 'Require operators to publish the known limits of advisory AI and train crews on them.',
  },
  E4_goal_misspecification: {
    label: 'Goal misspecification',
    mlAnalogue: 'Reward misspecification: the model pursued the objective it was given, which left out something that mattered.',
    model:
      'ARIA did exactly what it was built to do: it minimized time and fuel. Safety margins were not part of that objective, so advice that broke them still scored well.',
    interface:
      "ARIA presented the benefit (time or fuel saved) but not the trade-off it made. Its reasoning sounded complete, which made the gap hard to notice.",
    organization:
      'Efficiency targets set by the operator shaped the objective ARIA optimized. No independent review checked that the objective included every safety constraint.',
    systemicCause:
      'ARIA was given an objective that left out a safety constraint, and its advice presented only the benefit.',
    individualCause:
      'The crew accepted an efficiency recommendation without checking it against the safety constraint that it broke.',
    recCrew: 'When advice promises savings, ask what it trades away before accepting it.',
    recDeveloper: 'Encode safety limits as hard constraints, not as costs to be traded, and show the trade-offs behind every recommendation.',
    recRegulator: 'Require an independent review of the objectives that advisory AI systems optimize.',
  },
  E5_hallucinated_procedure: {
    label: 'Hallucinated procedure',
    mlAnalogue: 'Language model hallucination: fluent, specific and false.',
    model:
      'ARIA generated a procedure step that does not exist. Its text sounded authoritative because it used the format and vocabulary of real checklists.',
    interface:
      "ARIA cited a checklist by name and step number but did not link to the checklist, so verifying it took a separate search.",
    organization:
      "ARIA's procedure text was generated rather than retrieved from the approved checklist library, and no one had required it to quote approved text.",
    systemicCause:
      'ARIA invented a checklist step, and the system let generated text stand in for the approved procedure.',
    individualCause:
      'The crew followed a quoted checklist step without opening the checklist to confirm it.',
    recCrew: 'Open the checklist yourself before acting on a quoted step.',
    recDeveloper: 'Only quote procedures retrieved verbatim from the approved library, and link every citation to its source.',
    recRegulator: 'Prohibit generated procedural text in safety-critical advice; require retrieval from approved sources.',
  },
  E6_communication_error: {
    label: 'Communication error',
    mlAnalogue: 'Unfaithful explanation: what the system reported did not match what was happening.',
    model:
      "ARIA's action was correct, but it filled its radio message from a fixed emergency template that did not match the situation.",
    interface:
      'The radio call was shown as a finished message to approve, not as a draft to check, so it was easy to approve the action and the words together.',
    organization:
      'The emergency template was designed for one use case and reused for others without review. The real Garmin Autoland event in December 2025 showed the same pattern.',
    systemicCause:
      "ARIA's automatic message used a template that misstated the crew's condition, and the interface bundled it with a correct action.",
    individualCause:
      'The crew approved an automatic radio call without reading what it said.',
    recCrew: 'Read every automatic message before approving it, even when the action it accompanies is right.',
    recDeveloper: 'Generate messages from the actual system state and let the crew edit them separately from the action.',
    recRegulator: 'Require that automatic external communications reflect verified aircraft and crew state.',
  },
};

export const PHASE_LABEL: Record<string, string> = {
  preflight: 'preflight',
  takeoff: 'takeoff',
  climb: 'climb',
  cruise: 'cruise',
  descent: 'descent',
  approach: 'approach',
};

export const PANEL_LABEL: Record<string, string> = {
  pfd: 'primary flight display',
  nav: 'navigation display',
  comms: 'Comms log',
  systems: 'Systems page',
  checklists: 'Checklists page',
  aria: "ARIA's advice card",
};
