"""Balanced, randomized participant links (block randomization).

Usage:
    python make_participant_links.py https://lingyuehao.github.io/AIPI_project1/ 48 > links.csv

Every block of 8 links contains each condition twice; within the debrief conditions (C, D)
the report framing alternates, so groups stay balanced however many people finish.
"""
import csv
import random
import sys

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
n = int(sys.argv[2]) if len(sys.argv) > 2 else 48
rng = random.Random(590)
w = csv.writer(sys.stdout)
w.writerow(["participant_id", "condition", "framing", "url"])
i = 0
while i < n:
    block = [("A", ""), ("A", ""), ("B", ""), ("B", ""), ("C", "systemic"), ("C", "individual"), ("D", "systemic"), ("D", "individual")]
    rng.shuffle(block)
    for cond, framing in block:
        if i >= n:
            break
        pid = f"S{i + 1:03d}"
        url = f"{base}?pid={pid}&cond={cond}" + (f"&framing={framing}" if framing else "")
        w.writerow([pid, cond, framing, url])
        i += 1
