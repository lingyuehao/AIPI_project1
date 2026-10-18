"""Load participant data files exported by the game into analysis tables.

Usage:
    python load_data.py data/raw            # writes data/decisions.csv, post_flight.csv, final.csv, participants.csv

Each participant's file is the JSON the game downloads at the end (second-seat_<id>.json),
or the `payload` column of the Supabase `sessions` table saved one JSON per file.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

BOOL_COLS = ["has_explanation", "has_debrief", "aids_active", "explanation_shown", "aria_correct",
             "choice_correct", "detected", "false_alarm", "verified"]


def load_sessions(folder: str | Path, include_test: bool = False, include_incomplete: bool = False) -> dict[str, pd.DataFrame]:
    sessions = []
    for f in sorted(Path(folder).glob("*.json")):
        s = json.loads(f.read_text())
        if s.get("test_mode") and not include_test:
            continue
        if not s.get("completed_at") and not include_incomplete:
            continue
        sessions.append(s)
    if not sessions:
        raise FileNotFoundError(f"No usable session files in {folder}")

    decisions = pd.DataFrame([d for s in sessions for d in s["decisions"]])
    for c in BOOL_COLS:
        decisions[c] = decisions[c].astype(bool)
    decisions["error_type"] = decisions["error_type"].fillna("").replace("", "none")
    decisions = decisions[decisions["flight"] >= 1]  # the practice flight is never logged, but be safe

    post = pd.DataFrame([p for s in sessions for p in s["post_flight"]])
    tlx = ["tlx_mental", "tlx_physical", "tlx_temporal", "tlx_performance", "tlx_effort", "tlx_frustration"]
    post["tlx_raw"] = post[tlx].mean(axis=1)

    final_rows, people = [], []
    for s in sessions:
        bg = s.get("background") or {}
        people.append({"participant_id": s["participant_id"], "condition": s["condition"], "framing": s["framing"],
                       "started_at": s["started_at"], "completed_at": s.get("completed_at"), **bg})
        if s.get("final"):
            f = {k: v for k, v in s["final"].items() if k != "jian"}
            f.update({f"jian_{i + 1}": v for i, v in enumerate(s["final"]["jian"])})
            f["participant_id"] = s["participant_id"]
            final_rows.append(f)
    debriefs = pd.DataFrame([d for s in sessions for d in s.get("debriefs", [])])
    return {
        "decisions": decisions,
        "post_flight": post,
        "final": pd.DataFrame(final_rows),
        "participants": pd.DataFrame(people),
        "debriefs": debriefs,
    }


if __name__ == "__main__":
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else "data/raw")
    tables = load_sessions(folder)
    out = folder.parent
    for name, df in tables.items():
        df.to_csv(out / f"{name}.csv", index=False)
        print(f"{name}: {len(df)} rows -> {out / (name + '.csv')}")
