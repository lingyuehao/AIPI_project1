"""Generate fake participant files in the exact format the game exports.

Usage:
    python simulate_data.py 48 data/simulated

Use this to test the analysis notebook before real data exists. The effects built in below
are ASSUMPTIONS, not findings: they exist only so the plots and models have something to show.
Never report simulated results.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

SCENARIOS = Path(__file__).resolve().parent.parent / "game" / "src" / "scenarios"
CONDITIONS = {"A": (False, False), "B": (True, False), "C": (False, True), "D": (True, True)}

# Assumed difficulty of each error type (log-odds of detection at baseline).
TYPE_EASE = {
    "E1_stale_data": 0.2,
    "E2_sensor_fault": -0.1,
    "E3_out_of_distribution": -1.1,
    "E4_goal_misspecification": -0.4,
    "E5_hallucinated_procedure": 0.0,
    "E6_communication_error": -0.6,
}


def sigmoid(x: float) -> float:
    return 1 / (1 + np.exp(-x))


def simulate(n: int, out: Path, seed: int = 590) -> None:
    rng = np.random.default_rng(seed)
    flights = [json.loads((SCENARIOS / f"flight{i}.json").read_text()) for i in range(1, 5)]
    out.mkdir(parents=True, exist_ok=True)
    conds = (["A", "B", "C", "D"] * (n // 4 + 1))[:n]
    rng.shuffle(conds)

    for i, cond in enumerate(conds):
        pid = f"SIM{i + 1:03d}"
        has_expl, has_deb = CONDITIONS[cond]
        framing = ("systemic" if rng.random() < 0.5 else "individual") if has_deb else ""
        skill = rng.normal(0, 0.6)  # person-level detection ability
        bias = rng.normal(0, 0.4)  # person-level tendency to reject
        t0 = datetime(2026, 11, 1, 14, 0, tzinfo=timezone.utc) + timedelta(minutes=50 * i)
        decisions, post, debriefs = [], [], []
        events_since_error = 0

        for f in flights:
            fno = f["flight"]
            aided = fno in (2, 3)
            for k, ev in enumerate(f["events"], start=1):
                wrong = ev["aria"]["recommend"] != ev["correctOption"]
                # Learning: debriefs after flights 2 and 3 help from flight 3 on (assumed effect).
                learned = 0.25 * (fno - 1) + (0.45 * (fno - 2) if has_deb and fno >= 3 else 0)
                # Real-time explanations help a little while shown, but raise acceptance of plausible advice (assumed).
                expl_now = 0.25 if (has_expl and aided) else 0
                verify_p = sigmoid(-1.0 + 0.3 * (fno - 1) + (0.4 if has_deb and fno >= 3 else 0) + bias)
                verified = rng.random() < verify_p
                if wrong:
                    first_failure = -0.9 if (fno == 1 and events_since_error >= 8) else 0
                    logit = -0.6 + TYPE_EASE[ev["aria"]["errorType"]] + learned + expl_now + first_failure + skill + (0.7 if verified else 0)
                    reject = rng.random() < sigmoid(logit)
                    events_since_error = 0
                else:
                    logit = -2.6 + bias - (0.3 if (has_expl and aided) else 0)
                    reject = rng.random() < sigmoid(logit)
                    events_since_error += 1
                timeout = (not reject) and rng.random() < 0.04
                action = "reject" if reject else ("timeout" if timeout else "accept")
                alts = [o["id"] for o in ev["options"] if o["id"] != ev["aria"]["recommend"]]
                if reject:
                    chosen = ev["correctOption"] if (wrong and rng.random() < 0.85) else str(rng.choice(alts))
                else:
                    chosen = ev["aria"]["recommend"]
                rt = int(np.clip(rng.normal(9000 + (5000 if verified else 0), 3000), 1500, 25000))
                decisions.append({
                    "participant_id": pid, "condition": cond, "has_explanation": has_expl, "has_debrief": has_deb,
                    "framing": framing, "flight": fno, "event_index": k, "event_id": ev["id"], "phase": ev["phase"],
                    "aids_active": aided, "explanation_shown": has_expl and aided,
                    "aria_recommend": ev["aria"]["recommend"], "aria_correct": not wrong,
                    "error_type": ev["aria"]["errorType"] or "", "severity": ev["severity"],
                    "action": action, "chosen_option": chosen, "correct_option": ev["correctOption"],
                    "choice_correct": chosen == ev["correctOption"], "detected": wrong and reject,
                    "false_alarm": (not wrong) and reject, "verified": bool(verified),
                    "panels_viewed": str(rng.choice(["comms", "systems", "comms|systems", "checklists", "comms|checklists"])) if verified else "",
                    "first_verify_ms": int(rng.uniform(1500, 6000)) if verified else None,
                    "evidence_clicks": int(rng.poisson(0.6)) if (has_expl and aided) else 0,
                    "response_ms": rt, "timestamp": (t0 + timedelta(minutes=10 * fno, seconds=40 * k)).isoformat(),
                })
            acc = np.mean([not d["detected"] and not d["false_alarm"] for d in decisions if d["flight"] == fno])
            post.append({"participant_id": pid, "flight": fno, "trust": int(np.clip(round(1 + 6 * acc + rng.normal(0, 0.8)), 1, 7)),
                         **{f"tlx_{k}": int(np.clip(rng.normal(m, 15) // 5 * 5, 0, 100)) for k, m in
                            [("mental", 60), ("physical", 15), ("temporal", 65), ("performance", 40), ("effort", 55), ("frustration", 35)]}})
            if has_deb and aided:
                debriefs.append({"participant_id": pid, "flight": fno, "reports": 3, "view_ms": int(rng.normal(150000, 40000))})

        # Responsibility: individual framing shifts blame toward the participant (assumed effect).
        base = np.array([30, 25, 25, 20], dtype=float) + rng.normal(0, 6, 4)
        if framing == "individual":
            base[0] += 10
        resp = np.maximum(base, 0)
        resp = np.round(resp / resp.sum() * 20) * 5
        resp[-1] = 100 - resp[:-1].sum()
        jian = [int(np.clip(round(rng.normal(3, 1)), 1, 7)) for _ in range(5)] + [int(np.clip(round(rng.normal(5, 1)), 1, 7)) for _ in range(7)]
        scored = [8 - v for v in jian[:5]] + jian[5:]
        session = {
            "study_version": "1.0.0", "participant_id": pid, "condition": cond, "framing": framing, "test_mode": False,
            "started_at": t0.isoformat(), "completed_at": (t0 + timedelta(minutes=48)).isoformat(), "user_agent": "simulated",
            "background": {"flight_experience": "None", "sim_experience": "A few times", "ai_use": "Weekly", "gaming": "Monthly",
                           "ai_trust_prior": int(rng.integers(2, 7))},
            "decisions": decisions, "post_flight": post, "debriefs": debriefs,
            "final": {"jian": jian, "jian_trust_score": float(np.mean(scored)), "resp_you": int(resp[0]), "resp_aria": int(resp[1]),
                      "resp_designers": int(resp[2]), "resp_airline": int(resp[3]), "strategy": "", "comments": ""},
        }
        (out / f"second-seat_{pid}.json").write_text(json.dumps(session, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)))
    print(f"Wrote {n} simulated participants to {out}")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 48
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data/simulated")
    simulate(n, out)
