// Simplified checklists for the game. These are NOT real operating procedures;
// they are written for this study so that ARIA's invented steps (error type E5)
// can be checked against a reference the player can open.

export interface Checklist {
  id: string;
  title: string;
  steps: string[];
}

export const CHECKLISTS: Checklist[] = [
  {
    id: 'uas',
    title: 'UNRELIABLE AIRSPEED',
    steps: [
      'Autopilot and autothrottle: disconnect if they react to the bad reading',
      'Pitch and thrust: hold the values for the current flight phase (cruise: about 2.5° and 80–85% N1)',
      'Cross-check ground speed, altitude and the other airspeed indicators',
      'Do not chase a single airspeed indication',
      'Inform ATC',
    ],
  },
  {
    id: 'aoa',
    title: 'AOA DISAGREE',
    steps: [
      'Autopilot: disengage if it commands an abnormal pitch',
      'Hold normal pitch and thrust for the flight phase',
      'Cross-check airspeed and altitude on both sides and on the standby instrument',
      'If airspeed and attitude are normal, disregard the stall warning from the affected side',
      'Inform ATC',
    ],
  },
  {
    id: 'hyd',
    title: 'HYD B LO QTY',
    steps: [
      'HYD B pressure: monitor',
      'Plan a flaps 15 landing; expect a longer landing distance',
      'Inform ATC and request a longer runway if available',
    ],
  },
  {
    id: 'oil',
    title: 'ENG OIL LO PR',
    steps: [
      'Oil pressure: check',
      'If in the amber band: thrust lever of the affected engine to idle, if practical',
      'If below the red line: run the ENGINE SHUTDOWN checklist',
      'Inform ATC',
    ],
  },
  {
    id: 'cabin',
    title: 'CABIN ALTITUDE / RAPID DEPRESSURIZATION',
    steps: [
      'Oxygen masks: on, 100%',
      'Crew communication: establish',
      'Emergency descent to 10,000 ft or the minimum safe altitude',
      'Transponder 7700 and inform ATC of the nature of the emergency',
      'Passenger oxygen: confirm deployed',
    ],
  },
  {
    id: 'ash',
    title: 'VOLCANIC ASH ENCOUNTER',
    steps: [
      'Exit the ash by the shortest route; a 180° turn is usually fastest',
      'Thrust: reduce to idle if altitude permits (lowers engine temperature)',
      'Engine and wing anti-ice: on',
      'Oxygen masks: on if smoke or a sulfur smell is present',
      'Inform ATC; declare an emergency if needed',
    ],
  },
  {
    id: 'ra',
    title: 'RADIO ALTIMETER FAULT',
    steps: [
      'Compare both radio altimeters with barometric altitude',
      'If one radio altimeter disagrees: treat it as failed',
      'Autothrottle: disconnect if it retards unexpectedly; control speed manually',
      'Do not use autoland on the affected side',
    ],
  },
  {
    id: 'stab',
    title: 'STABILIZED APPROACH CRITERIA',
    steps: [
      'By 1,000 ft above the runway the aircraft must be on the correct flight path',
      'Speed within +10 / −5 kt of the target speed',
      'Sink rate no greater than 1,000 fpm',
      'In the landing configuration with the briefing complete',
      'If any criterion is not met: go around',
    ],
  },
  {
    id: 'fire',
    title: 'ENGINE FIRE',
    steps: [
      'Thrust lever (affected engine): idle',
      'Fuel control switch: cutoff',
      'Fire switch: pull and rotate',
      'If the fire persists after 30 s: rotate to the other bottle',
      'Land at the nearest suitable airport',
    ],
  },
];
