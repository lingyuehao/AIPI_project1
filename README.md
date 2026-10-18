# Second Seat

**Catching AI errors in flight, learning from them on the ground.**

Second Seat is a browser game and a human-AI teaming experiment. You fly four short airline flights as the captain. An AI first officer called ARIA advises you at every decision point. ARIA is right 75% of the time, and its errors are deliberate: stale data, a faulty sensor, a situation it was never trained for, a goal that leaves out safety, an invented checklist step, and a radio call that misstates what is happening.

The study asks one question: **do incident reports after a flight help people catch AI errors later better than explanations during the flight?** Aviation became safe through debriefing and accident investigation, not only through better automation. This project tests whether the same idea works for AI.

Built for AIPI 590 (Emerging Trends in Explainable AI), Duke University.

- **Play:** https://lingyuehao.github.io/AIPI_project1/
- **Quick tour** (half-second gaps, data flagged as test): https://lingyuehao.github.io/AIPI_project1/?fast=1
- **AI Incident Files** (all twelve reports, no game needed): https://lingyuehao.github.io/AIPI_project1/?view=incidents

## What is in this repository

```
.
├── game/                       Browser game (React + TypeScript + Vite)
│   ├── src/scenarios/          Four flights + practice, as JSON; checklist library
│   ├── src/engine/             Flight engine: gaps, decisions, countdown, cross-check cost
│   ├── src/cockpit/            Primary flight display, navigation display, alerts, cross-check pages
│   ├── src/aria/               ARIA's advice card and the real-time explanation layer
│   ├── src/debrief/            NTSB-style incident report generator and the Incident Files page
│   ├── src/survey/             Consent, questionnaires, results reveal
│   ├── src/experiment/         Condition assignment
│   ├── src/logging/            Data export and optional Supabase upload
│   └── scripts/                Scenario validator
├── analysis/                   Python analysis
│   ├── analysis.ipynb          All research questions, figures for the poster
│   ├── load_data.py            Turns exported files into tables
│   ├── sdt.py                  Signal detection measures (d′, criterion)
│   ├── simulate_data.py        Fake participants for testing the pipeline
│   └── make_participant_links.py   Balanced study links
├── supabase/schema.sql         Optional database tables
├── docs/scenario-format.md     How to write or edit flights
└── .github/workflows/deploy.yml    Publishes the game to GitHub Pages
```

## Run the game locally

Requires Node.js 18 or later.

```bash
cd game
npm install
npm run dev
```

Open the address Vite prints (usually `http://localhost:5173`).

Useful URL parameters:

| Parameter | Effect |
| --- | --- |
| `?cond=A`, `B`, `C` or `D` | Force a condition (otherwise random) |
| `?framing=systemic` or `individual` | Force the report framing for conditions C and D |
| `?pid=S001` | Set the participant id |
| `?fast=1` | Test mode: half-second gaps between decisions. Sessions are flagged `test_mode` and excluded from analysis |
| `?view=incidents` | The AI Incident Files page |

Other commands: `npm run validate` checks every scenario; `npm run build` produces the static site in `game/dist/`.

## Run the study

1. **Publish the game.** Push this repository to GitHub, then in Settings > Pages choose "GitHub Actions". The workflow builds and deploys on every push to `main`.
2. **Optional: collect data automatically.** Create a free Supabase project, run `supabase/schema.sql` in its SQL editor, and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets (or in `game/.env` for local runs; see `.env.example`). Without Supabase, participants download a data file at the end and send it to you.
3. **Make balanced links.** `python analysis/make_participant_links.py https://lingyuehao.github.io/AIPI_project1/ 48 > links.csv` gives each participant a link with a pre-assigned condition, balanced in blocks of eight.
4. **Pilot first.** Run three to five people, check the timing and the data, and adjust scenario difficulty if almost everyone catches or misses every error.
5. **Before recruiting,** confirm with the course instructor whether Duke requires IRB review for this project, and add your contact details to the consent page (`game/src/survey/Pages.tsx`).

## Analyse the data

```bash
cd analysis
pip install -r requirements.txt
python simulate_data.py 48 data/simulated     # optional: fake data to test the pipeline
jupyter notebook analysis.ipynb
```

Put real participant files in `analysis/data/raw/` and set `DATA_DIR = Path('data/raw')` in the first code cell. If you used Supabase, export the `payload` column of the `sessions` table as one JSON file per participant. Figures are saved to `analysis/figures/`.

Simulated data has effects built in so the plots have something to show. Those effects are assumptions, not findings.

## Study design

**Conditions** (between subjects): real-time explanation (yes/no) × post-flight debrief (yes/no).

| | No debrief | Debrief |
| --- | --- | --- |
| **No explanation** | A: advice only | C: incident reports after flights 2 and 3 |
| **Explanation** | B: rationale, confidence and evidence during flights 2 and 3 | D: both |

**Flights** (within subjects): flight 1 is a baseline with no aids for anyone. Flights 2 and 3 apply the condition. Flight 4 is the test: no aids for anyone, and two error types appear for the first time. This measures what people learned, not what the aids did in the moment.

**Each decision:** a situation, ARIA's advice, a 25-second countdown, and three actions: accept, choose another action, or cross-check. Cross-checking opens the Comms log, Systems and Checklists pages and costs 6 seconds the first time. If time runs out, ARIA's advice is applied. Players get no feedback on correctness until the end.

**Measures:** sensitivity (d′) and criterion from signal detection theory, detection rate by error type, cross-check rate, response time, trust after each flight, raw NASA-TLX workload, the Jian et al. (2000) trust scale, and responsibility attribution.

**Debrief reports** follow the structure of an NTSB final report (synopsis, history of the flight, analysis, probable cause, safety recommendations) and trace each error through four layers adapted from HFACS: the AI model, the human-AI interaction, the interface, and the organization. Each report is generated from the player's own actions. For RQ4, half the debrief participants read reports that put the crew's action first (individual framing) and half read reports that put system causes first (systemic framing); the facts are the same.

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

Several are modelled on real events: Air France 447 (unreliable airspeed, 2009), the Boeing 737 MAX accidents (single angle-of-attack sensor, 2018–2019), Turkish Airlines 1951 (faulty radio altimeter, 2009), British Airways 9 (volcanic ash, 1982), Moffatt v. Air Canada (chatbot misstating policy, 2024), and the Garmin Autoland activation in Colorado (December 2025), where a correct automatic landing came with an automatic radio call reporting pilot incapacitation that had not happened.

## Limitations

- Most participants will not be pilots, so results describe how people work with an AI advisor in a high-stakes task, not how airline crews would behave.
- A game carries far less risk and stress than a real cockpit.
- ARIA is scripted (a Wizard-of-Oz design), so its errors are cleaner than a real model's. Every error type corresponds to a real machine learning failure mode and at least one real event.
- With about 48 participants, the study can detect only large differences between groups. The event-level models use all 2,300 or so decisions, and results should be reported with effect sizes and confidence intervals.
- Scenarios, procedures and the volcano are simplified or fictional. Checklists in the game are not real operating procedures.

## Ethics

Participants are told at the start that ARIA is reliable but not perfect, and every error is revealed at the end along with the purpose of the study. No names or emails are collected. Results should not be read as evidence that AI copilots are safe, or used to argue for fewer pilots in the cockpit.

## References

- Bansal, G., et al. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. CHI.
- Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). To trust or to think: Cognitive forcing functions can reduce overreliance on AI in AI-assisted decision-making. CSCW.
- Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX.
- Jian, J.-Y., Bisantz, A. M., & Drury, C. G. (2000). Foundations for an empirically determined scale of trust in automated systems. International Journal of Cognitive Ergonomics.
- Lee, J. D., & See, K. A. (2004). Trust in automation: Designing for appropriate reliance. Human Factors.
- Parasuraman, R., & Manzey, D. H. (2010). Complacency and bias in human use of automation. Human Factors.
- Parasuraman, R., & Riley, V. (1997). Humans and automation: Use, misuse, disuse, abuse. Human Factors.
- Shappell, S. A., & Wiegmann, D. A. (2000). The Human Factors Analysis and Classification System (HFACS).
- SESAR Joint Undertaking (2025). DARWIN digital co-pilot flight trials.

Check each reference against the original before citing it in the paper or poster.

## License

MIT for the code. Scenario text and reports may be reused with attribution.
