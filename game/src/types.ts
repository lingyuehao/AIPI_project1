
export type Phase = 'preflight' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach';

export type ErrorType =
  | 'E1_stale_data'
  | 'E2_sensor_fault'
  | 'E3_out_of_distribution'
  | 'E4_goal_misspecification'
  | 'E5_hallucinated_procedure'
  | 'E6_communication_error';

export type Severity = 'low' | 'medium' | 'high';
export type AlertLevel = 'warning' | 'caution' | 'advisory';
export type Panel = 'pfd' | 'nav' | 'comms' | 'systems' | 'checklists' | 'aria';
export type DrawerTab = 'comms' | 'systems' | 'checklists';

export interface Alert {
  id: string;
  level: AlertLevel;
  text: string;
}

export interface AircraftState {
  altitude: number; // ft, barometric
  ias: number; // kt
  gs: number; // kt
  mach?: number;
  heading: number; // deg
  vs: number; // ft/min
  pitch: number; // deg
  fuelKg: number;
  fuelFlowKgH: number;
  cabinAlt: number; // ft
  n1: [number, number]; // %
  oilPress: [number, number]; // psi
  oilTemp: [number, number]; // deg C
  tat: number; // deg C
  radioAlt?: number | null; // ft, null when not shown
  aoa?: [number, number] | null; // deg, left/right sensor
  alerts: Alert[];
  sysNotes?: string[]; // extra lines on the Systems page
}

export type CommsSource =
  | 'ATC'
  | 'ATIS'
  | 'METAR'
  | 'TAF'
  | 'SIGMET'
  | 'PIREP'
  | 'COMPANY'
  | 'CABIN'
  | 'NOTAM';

export interface CommsMessage {
  id: string;
  time: string;
  source: CommsSource;
  text: string;
}

// nm from the aircraft; x right, y ahead
export interface NavPoint {
  name: string;
  x: number;
  y: number;
}

export interface WeatherCell {
  id: string;
  x: number;
  y: number;
  r: number; // nm
  level: 1 | 2 | 3; // light, moderate, heavy
}

export interface NavScene {
  rangeNm: number;
  route: NavPoint[];
  weather: WeatherCell[];
  proposed?: NavPoint[]; // ARIA's suggested path, drawn dashed
}

export interface Option {
  id: string;
  label: string;
}

export interface Evidence {
  label: string;
  ref?: string; // id of an on-screen element to highlight, e.g. "nav.C1" or "pfd.ias"
}

export interface AriaAdvice {
  recommend: string;
  text: string;
  errorType: ErrorType | null; // null when the advice is correct
  rationale: string; // shown only with real-time explanations
  confidence: number; // 0..1, shown only with real-time explanations
  evidence: Evidence[]; // shown only with real-time explanations
  broadcast?: string; // radio call ARIA will transmit (E6); always shown
}

export interface Cue {
  panel: Panel;
  ref?: string;
  description: string;
}

export interface ScenarioEvent {
  id: string;
  phase: Phase;
  clock: string;
  gapSec: number; // quiet time before this event appears
  situation: string;
  state?: Partial<AircraftState>;
  comms?: CommsMessage[];
  nav?: NavScene;
  options: Option[];
  correctOption: string;
  aria: AriaAdvice;
  severity: Severity;
  cue?: Cue; // required when ARIA is wrong
  report?: { whatHappened: string; consequence: string }; // required when ARIA is wrong
}

export interface Scenario {
  flight: number;
  practice?: boolean;
  callsign: string;
  aircraft: string;
  origin: string;
  destination: string;
  title: string;
  briefing: string;
  initialState: AircraftState;
  initialComms: CommsMessage[];
  initialNav: NavScene;
  events: ScenarioEvent[];
}

export type ConditionId = 'A' | 'B' | 'C' | 'D';
export type Framing = 'systemic' | 'individual';
export type Action = 'accept' | 'reject' | 'timeout';

export interface PanelOpen {
  panel: DrawerTab;
  t_ms: number;
}

// Field names must match analysis/ and supabase/schema.sql.
export interface DecisionRecord {
  participant_id: string;
  condition: ConditionId;
  has_explanation: boolean;
  has_debrief: boolean;
  framing: Framing | '';
  flight: number;
  event_index: number;
  event_id: string;
  phase: Phase;
  aids_active: boolean;
  explanation_shown: boolean;
  aria_recommend: string;
  aria_correct: boolean;
  error_type: ErrorType | '';
  severity: Severity;
  action: Action;
  chosen_option: string;
  correct_option: string;
  choice_correct: boolean;
  detected: boolean; // ARIA wrong and the player rejected it
  false_alarm: boolean; // ARIA right and the player rejected it
  verified: boolean;
  panels_viewed: string; // pipe-separated
  first_verify_ms: number | null;
  evidence_clicks: number;
  response_ms: number;
  timestamp: string;
}

export interface PostFlightSurvey {
  participant_id: string;
  flight: number;
  trust: number; // 1..7
  tlx_mental: number;
  tlx_physical: number;
  tlx_temporal: number;
  tlx_performance: number;
  tlx_effort: number;
  tlx_frustration: number;
}

export interface DebriefView {
  participant_id: string;
  flight: number;
  reports: number;
  view_ms: number;
}

export interface BackgroundSurvey {
  flight_experience: string;
  sim_experience: string;
  ai_use: string;
  gaming: string;
  ai_trust_prior: number;
}

export interface FinalSurvey {
  jian: number[]; // 12 items, 1..7, raw (items 1-5 are distrust items)
  jian_trust_score: number; // mean after reverse-coding items 1-5
  resp_you: number;
  resp_aria: number;
  resp_designers: number;
  resp_airline: number;
  strategy: string;
  comments: string;
}

export interface Session {
  study_version: string;
  participant_id: string;
  condition: ConditionId;
  framing: Framing | '';
  test_mode: boolean;
  started_at: string;
  completed_at?: string;
  user_agent: string;
  background?: BackgroundSurvey;
  decisions: DecisionRecord[];
  post_flight: PostFlightSurvey[];
  debriefs: DebriefView[];
  final?: FinalSurvey;
}
