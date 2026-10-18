# Second Seat

Second Seat is a browser game for studying how people catch mistakes made by an AI advisor. You fly four short airline flights as the captain. An AI first officer, ARIA, gives advice at every decision point. ARIA is right 75% of the time. Its errors are planted on purpose and each one matches a known machine learning failure: stale data, a faulty sensor, a situation outside its training, a goal that leaves out safety, an invented checklist step, and a radio call that misstates what is happening.

The project borrows an idea from aviation safety. Flying got safer largely because crews and investigators study what went wrong after the fact, through debriefs and accident reports. Most explainable AI work does the opposite and explains the model in the moment. Second Seat is built to compare the two.

AIPI 590 (Emerging Trends in Explainable AI), Duke University, Fall 2026.

## Links

- Play: https://lingyuehao.github.io/AIPI_project1/
- Quick tour with short waits between decisions: https://lingyuehao.github.io/AIPI_project1/?fast=1
- AI Incident Files, all twelve reports without playing: https://lingyuehao.github.io/AIPI_project1/?view=incidents

A full session takes 30 to 40 minutes. The quick tour skips the waits between decisions, which saves about 7 minutes.

## What this project contributes

1. **A research instrument for human-AI error detection.** A complete, deployable experiment: consent, background survey, tutorial, practice flight, four scored flights, questionnaires, a results reveal at the end, and data export. Conditions, framing and participant ids can be set from the URL, so a study can be run from a list of links.
2. **A taxonomy of six AI error types, each tied to a real event.** Every planted error maps to an ML failure mode and to at least one documented incident (see [ARIA's errors](#arias-errors)). The scenario format is plain JSON, so new errors and domains can be added without touching the engine.
3. **AI incident reports as an explanation method.** After a flight, the game writes an NTSB-style report for each error, built from the player's own actions. Each report traces the error through four layers adapted from HFACS: the model, the human-AI interaction, the interface, and the organization. The same twelve reports are published as a standalone teaching resource.
4. **A pre-specified analysis plan.** The analysis notebook, signal detection code and exclusion rules are written before any data is collected and have been run end to end on simulated participants.

## Research question and design

**Question.** Do incident reports after a flight help people catch AI errors later, compared with explanations during the flight?

**Conditions** (between subjects), real-time explanation × post-flight debrief:

| | No debrief | Debrief |
| --- | --- | --- |
| No explanation | A: advice only | C: incident reports after flights 2 and 3 |
| Explanation | B: rationale, confidence and evidence during flights 2 and 3 | D: both |

**Flights** (within subjects). Flight 1 is a baseline with no aids for anyone. Flights 2 and 3 apply the condition. Flight 4 is the test: no aids for anyone, and two error types appear for the first time. Flight 4 measures what people carried forward, not what an aid did for them in the moment.

**Each decision.** The player sees the situation and ARIA's advice, then has 25 seconds to accept it, choose a different action, or cross-check. Cross-checking opens the Comms log, Systems and Checklists pages and costs 6 seconds the first time. If time runs out, ARIA's advice is applied. Players get no feedback on correctness until the end.

**Measures.** Sensitivity (d′) and criterion (c) from signal detection theory, with "ARIA is wrong" as the signal; detection rate by error type; cross-check rate; response time; trust after each flight; raw NASA-TLX; the Jian et al. (2000) trust scale; and responsibility attribution.

**Secondary question (RQ4).** Half of the debrief participants read reports that lead with the crew's action (individual framing), the other half reports that lead with system causes (systemic framing). The facts are the same. This tests whether framing shifts who people blame.

## Evidence so far

No human participants have been run yet. The evidence for this submission is the following.

- **Design rationale and case analysis.** Each of the twelve errors is grounded in an ML failure mode and a real incident, and each leaves a cue the player could find (the "Where the truth was" column below). The twelve incident reports are the case analyses.
- **Scenario validation.** `npm run validate` checks every flight for structure, fails if a wrong recommendation has no error type, cue or report text, and prints ARIA's reliability per flight (75% in all four). It runs on every deploy.
- **Pipeline validation.** `simulate_data.py` writes simulated participants (none of them real people) in the exact export format, and every cell of `analysis.ipynb` runs on them. The simulated effects are assumptions written into the simulator. They are not findings and should not be reported as results.
- **Design iteration.** Choices made to protect the measurement: ARIA is right for the first eight events of flight 1 so the first failure is a clean measure of complacency; correct advice is sometimes cautious and sometimes bold, so "always reject the risky option" does not work; flight 4 removes all aids and adds new error types so it measures transfer.

## ARIA's errors

| Flight | Event | Type | What ARIA did | Where the truth was |
| --- | --- | --- | --- | --- |
| 1 | 9 | Sensor fault | Treated an iced-probe airspeed drop as real | Ground speed and thrust unchanged; PROBE HEAT caution |
| 1 | 11 | Stale data | Chose a runway from a 48-minute-old weather report | Newer ATIS in the Comms log |
| 1 | 12 | Hallucinated procedure | Quoted a checklist step that does not exist | Checklists page |
| 2 | 4 | Goal misspecification | Took a shortcut through a thunderstorm to save fuel | Dashed route crosses cell C3 |
| 2 | 7 | Stale data | Planned no holding fuel despite fog and delays | Amended forecast and company message |
| 2 | 10 | Hallucinated procedure | Told the crew to add thrust to an engine with low oil pressure | Checklists page |
| 3 | 3 | Sensor fault | Called a stall from one bad angle-of-attack sensor | Normal airspeed; AOA disagree on Systems |
| 3 | 6 | Stale data | Briefed with an outdated altimeter setting | Newer ATIS after a cold front |
| 3 | 11 | Goal misspecification | Accepted a rushed, unstabilized approach to save time | Stabilized approach criteria |
| 4 | 5 | Out of distribution (new) | Treated volcanic ash as ordinary turbulence, at 94% confidence | SIGMET and a cabin report of sulfur smell |
| 4 | 8 | Communication error (new) | Right action, but a radio call announcing pilot incapacitation | The call text itself |
| 4 | 10 | Sensor fault | Ordered a terrain escape from one failed radio altimeter | Barometric altitude 9,000 ft |

| Code | Error type | ML parallel | Related real event |
| --- | --- | --- | --- |
| E1 | Stale data | Data drift | |
| E2 | Sensor fault | One corrupted input dominates the output | Air France 447 (2009), Boeing 737 MAX (2018–2019), Turkish Airlines 1951 (2009) |
| E3 | Out of distribution | Overconfident failure outside the training data | British Airways 9, volcanic ash (1982) |
| E4 | Goal misspecification | Reward misspecification | |
| E5 | Hallucinated procedure | Language model hallucination | Moffatt v. Air Canada, chatbot misstating policy (2024) |
| E6 | Communication error | Unfaithful explanation or report | Garmin Autoland activation in Colorado (December 2025): correct landing, automatic radio call reporting an incapacitation that had not happened |

## Repository layout

```
.
├── game/                       Browser game (React + TypeScript + Vite)
│   ├── src/scenarios/          Four flights + practice as JSON, checklist library
│   ├── src/engine/             Flight engine: gaps, decisions, countdown, cross-check cost
│   ├── src/cockpit/            Flight display, navigation display, alerts, cross-check pages
│   ├── src/aria/               ARIA's advice card and the real-time explanation layer
│   ├── src/debrief/            Incident report generator and the Incident Files page
│   ├── src/survey/             Consent, questionnaires, results reveal
│   ├── src/experiment/         Condition assignment
│   ├── src/logging/            Data export and optional Supabase upload
│   └── scripts/                Scenario validator
├── analysis/
│   ├── analysis.ipynb          Analysis for every research question, poster figures
│   ├── load_data.py            Exported session files to tables
│   ├── sdt.py                  d′ and criterion
│   ├── simulate_data.py        Fake participants for testing the pipeline
│   └── make_participant_links.py   Balanced study links
├── supabase/schema.sql         Optional database tables
├── docs/scenario-format.md     How to write or edit a flight
└── .github/workflows/deploy.yml    Builds and publishes to GitHub Pages
```

## Running it

### Game

Requires Node.js 18 or later. No API keys, models or datasets are needed.

```bash
cd game
npm install
npm run dev        # http://localhost:5173
npm run validate   # check all scenarios
npm run build      # static site in game/dist/
```

URL parameters:

| Parameter | Effect |
| --- | --- |
| `?cond=A` (or `B`, `C`, `D`) | Force a condition; otherwise random |
| `?framing=systemic` or `individual` | Force report framing in conditions C and D |
| `?pid=S001` | Set the participant id |
| `?fast=1` | Half-second gaps between decisions. Sessions are flagged `test_mode` and excluded from analysis |
| `?view=incidents` | Open the AI Incident Files page |

Every push to `main` rebuilds and redeploys the site through GitHub Actions.

### Analysis

Requires Python 3.10 or later.

```bash
cd analysis
pip install -r requirements.txt
python simulate_data.py 48 data/simulated
jupyter notebook analysis.ipynb
```

The notebook reads `data/simulated` by default. For real data, put participant files in `analysis/data/raw/` and set `DATA_DIR = Path('data/raw')` in the first code cell. Figures are written to `analysis/figures/`.

### Running the study

1. Optional automatic data collection: create a Supabase project, run `supabase/schema.sql`, and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets (or in `game/.env`, see `.env.example`). Without Supabase, participants download a JSON file at the end and send it in.
2. Generate balanced links, for example 48 of them: `python analysis/make_participant_links.py https://lingyuehao.github.io/AIPI_project1/ 48 > links.csv`. Each block of eight links covers every condition twice and alternates report framing.
3. Pilot with three to five people and check timing and difficulty before recruiting.
4. Get IRB review or an exemption before collecting data from people outside the course.

## Limitations

- **No human data yet.** The contribution is the instrument, the error taxonomy, the incident reports and the analysis plan. Whether debriefs beat real-time explanations is still an open question.
- **Non-pilot participants.** Most players will not be pilots. Results would describe people working with an AI advisor on a high-stakes task, not airline crews.
- **Low stakes.** A game has none of the risk or stress of a real cockpit.
- **Scripted AI.** ARIA is a Wizard-of-Oz design. Its errors are cleaner and easier to trace than a real model's, which probably makes them easier to catch.
- **Statistical power.** The sample size has not been set by a power analysis. A course-sized sample (a few dozen people) could only detect large between-group differences. The event-level models use every decision (48 per participant), and results should be reported with effect sizes and confidence intervals.
- **Simplified domain.** Scenarios, procedures and the volcano are simplified or invented. The checklists in the game are not real operating procedures.
- **Explanation quality is fixed.** The real-time explanations are written to be accurate and helpful. Poor or misleading explanations, common in deployed systems, are not tested.

## Risks and responsible use

- Players are told at the start that ARIA is reliable but not perfect. Every error and the purpose of the study are revealed at the end.
- No names or emails are collected. Data is stored under a random id.
- Results from this game should not be used to argue that AI copilots are safe or that fewer pilots are needed. A game that shows people can catch scripted errors says little about catching unscripted ones.
- The individual-framing reports put the crew's action first. In a real organization, that framing can push blame onto operators for system failures, which is part of what RQ4 is meant to measure.

## Future work

- Run a power analysis, then the human study with balanced links, and report d′ by condition on flight 4.
- Add a condition where real-time explanations are sometimes wrong, to test whether debriefs protect against misleading explanations.
- Swap the scripted ARIA for a live language model, so its errors are not hand-authored.
- Move the scenario format to another domain, such as clinical decision support, where post-incident review already exists.
- Run LLM agents as overseers in the same scenarios and compare their error detection with people's.

## References

- Bansal, G., et al. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. CHI.
- Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). To trust or to think: Cognitive forcing functions can reduce overreliance on AI in AI-assisted decision-making. CSCW.
- Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX.
- Hautus, M. J. (1995). Corrections for extreme proportions and their biasing effects on estimated values of d′. Behavior Research Methods.
- Jian, J.-Y., Bisantz, A. M., & Drury, C. G. (2000). Foundations for an empirically determined scale of trust in automated systems. International Journal of Cognitive Ergonomics.
- Lee, J. D., & See, K. A. (2004). Trust in automation: Designing for appropriate reliance. Human Factors.
- Parasuraman, R., & Manzey, D. H. (2010). Complacency and bias in human use of automation. Human Factors.
- Parasuraman, R., & Riley, V. (1997). Humans and automation: Use, misuse, disuse, abuse. Human Factors.
- Shappell, S. A., & Wiegmann, D. A. (2000). The Human Factors Analysis and Classification System (HFACS).
- SESAR Joint Undertaking (2025). DARWIN digital co-pilot flight trials.

## License

MIT for the code. Scenario text and reports may be reused with attribution.
