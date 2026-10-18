# Scenario format

Each flight is one JSON file in `game/src/scenarios/`. The engine plays its events in order: a quiet gap, then a decision with a countdown. Nothing in the engine is specific to aviation beyond the cockpit displays, so the same format can describe other human-AI teaming tasks.

Run `npm run validate` in `game/` after any edit. It checks the structure and prints where ARIA's errors fall in each flight.

## Flight

| Field | Type | Meaning |
| --- | --- | --- |
| `flight` | number | 1–4 for the study flights, 0 for practice |
| `callsign`, `aircraft`, `origin`, `destination`, `title`, `briefing` | string | Shown on the briefing page and the cockpit header |
| `initialState` | AircraftState | Instrument values before the first event |
| `initialComms` | CommsMessage[] | Messages already in the Comms log at the start |
| `initialNav` | NavScene | Route and weather at the start |
| `events` | ScenarioEvent[] | The 12 decision points |

## Event

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Unique, e.g. `F2-E07`. Used in the data and the reports |
| `phase` | `preflight` · `takeoff` · `climb` · `cruise` · `descent` · `approach` | Shown in the header |
| `clock` | string | Scenario time, e.g. `16:40Z` |
| `gapSec` | number | Quiet time before the event appears. Longer gaps in cruise build complacency |
| `situation` | string | What the player is told |
| `state` | partial AircraftState | Only the values that change. Values carry over to later events |
| `comms` | CommsMessage[] | New messages, marked "new" in the Comms log |
| `nav` | NavScene | Replaces the navigation display. `proposed` draws ARIA's suggested route as a dashed line |
| `options` | `{id, label}[]` | Two to four actions |
| `correctOption` | string | The id of the correct action |
| `aria` | AriaAdvice | See below |
| `severity` | `low` · `medium` · `high` | Used in the analysis |
| `cue` | `{panel, ref?, description}` | Required when ARIA is wrong: where the contradicting information is, in plain words for the report |
| `report` | `{whatHappened, consequence}` | Required when ARIA is wrong: one sentence each, used in the debrief |

## ARIA's advice

| Field | Shown to | Meaning |
| --- | --- | --- |
| `recommend` | everyone | The option id ARIA recommends. If it differs from `correctOption`, ARIA is wrong |
| `text` | everyone | The advice |
| `broadcast` | everyone | Optional radio call ARIA will send (error type E6) |
| `errorType` | nobody | `null` when ARIA is right; otherwise one of the six types |
| `rationale` | explanation groups, flights 2–3 | Natural-language reason |
| `confidence` | explanation groups, flights 2–3 | 0–1 |
| `evidence` | explanation groups, flights 2–3 | `{label, ref?}`. A `ref` such as `nav.C3`, `pfd.ias`, `pfd.alt`, `pfd.gs` or `pfd.ra` highlights that element when clicked |

## Error types

| Code | Name | Machine learning parallel |
| --- | --- | --- |
| `E1_stale_data` | Stale data | Data drift |
| `E2_sensor_fault` | Sensor fault | One corrupted input dominates the output |
| `E3_out_of_distribution` | Out-of-distribution situation | Overconfident failure outside the training data |
| `E4_goal_misspecification` | Goal misspecification | Reward misspecification |
| `E5_hallucinated_procedure` | Hallucinated procedure | Language model hallucination |
| `E6_communication_error` | Communication error | Unfaithful explanation or report |

Report text for each type lives in `game/src/debrief/reportTemplates.ts`. To add a seventh type, add it to `ErrorType` in `types.ts`, add a template, and use it in a scenario.

## Design rules used in the current scenarios

1. Every ARIA error leaves a cue the player could find, either on the always-visible displays or one cross-check away.
2. Each flight has 12 events and 3 errors (75% reliability).
3. In flight 1, ARIA is right for the first 8 events, so the 9th measures the first-failure effect.
4. Flights 2 and 3 use only E1, E2, E4 and E5. Flight 4 introduces E3 and E6 to test transfer.
5. Correct advice is sometimes cautious and sometimes bold, so "always reject the bold option" is not a winning strategy.
