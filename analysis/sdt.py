"""Signal detection measures for AI error detection.

Treat "ARIA is wrong" as the signal:
  hit          = ARIA wrong and the participant rejected the advice  (detected)
  miss         = ARIA wrong and the participant accepted or timed out
  false alarm  = ARIA right and the participant rejected the advice
  correct rej. = ARIA right and the participant accepted

d' (sensitivity) separates real discrimination from a general tendency to reject.
c (criterion) is that tendency: positive = leans toward accepting ARIA, negative = leans toward rejecting.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.stats import norm


def sdt(hits: int, misses: int, fas: int, crs: int) -> tuple[float, float]:
    """d' and c with the log-linear correction (Hautus, 1995), which avoids infinite z-scores at 0 or 1."""
    hr = (hits + 0.5) / (hits + misses + 1)
    far = (fas + 0.5) / (fas + crs + 1)
    d_prime = norm.ppf(hr) - norm.ppf(far)
    c = -0.5 * (norm.ppf(hr) + norm.ppf(far))
    return float(d_prime), float(c)


def sdt_table(decisions: pd.DataFrame, by: list[str]) -> pd.DataFrame:
    """One row per group in `by` (e.g. participant and flight) with counts, rates, d' and c."""
    d = decisions.copy()
    d["hit"] = d["detected"]
    d["miss"] = (~d["aria_correct"]) & (~d["detected"])
    d["fa"] = d["false_alarm"]
    d["cr"] = d["aria_correct"] & (~d["false_alarm"])
    g = d.groupby(by)[["hit", "miss", "fa", "cr"]].sum().reset_index()
    vals = g.apply(lambda r: sdt(r.hit, r.miss, r.fa, r.cr), axis=1, result_type="expand")
    g["d_prime"], g["criterion"] = vals[0], vals[1]
    g["hit_rate"] = g.hit / (g.hit + g.miss)
    g["fa_rate"] = g.fa / (g.fa + g.cr)
    return g


def bootstrap_ci(values: np.ndarray, n_boot: int = 2000, alpha: float = 0.05, seed: int = 0) -> tuple[float, float]:
    """Percentile bootstrap confidence interval for a mean."""
    values = np.asarray(values, dtype=float)
    values = values[~np.isnan(values)]
    if len(values) == 0:
        return (np.nan, np.nan)
    rng = np.random.default_rng(seed)
    means = rng.choice(values, size=(n_boot, len(values)), replace=True).mean(axis=1)
    return float(np.quantile(means, alpha / 2)), float(np.quantile(means, 1 - alpha / 2))
