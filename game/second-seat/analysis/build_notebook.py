"""Builds analysis.ipynb. Edit the cells here, or edit the notebook directly and delete this file."""
import nbformat as nbf

nb = nbf.v4.new_notebook()
md = nbf.v4.new_markdown_cell
code = nbf.v4.new_code_cell

nb.cells = [
    md("""# Second Seat: analysis

Research questions (see the design document):

- **RQ1** Do post-flight incident reports (debriefs) improve later detection of AI errors more than real-time explanations?
- **RQ2** Do people become complacent after a run of correct advice (first-failure effect)?
- **RQ3** Which error types are hardest to catch?
- **RQ4** (exploratory) Does the framing of incident reports shift how people assign responsibility?

Set `DATA_DIR` to `data/raw` for real data. `data/simulated` holds fake data from `simulate_data.py`, for testing only; its built-in effects are assumptions, never results."""),
    code("""from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.formula.api as smf
import statsmodels.api as sm
from statsmodels.genmod.bayes_mixed_glm import BinomialBayesMixedGLM

from load_data import load_sessions
from sdt import sdt_table, bootstrap_ci

DATA_DIR = Path('data/simulated')   # change to Path('data/raw') for the real study
FIG_DIR = Path('figures'); FIG_DIR.mkdir(exist_ok=True)

COND_LABEL = {'A': 'Control', 'B': 'Real-time explanation', 'C': 'Post-flight debrief', 'D': 'Both'}
COND_COLOR = {'A': '#8a8f98', 'B': '#2a8fbd', 'C': '#c46a1b', 'D': '#1f3a5f'}
plt.rcParams.update({'figure.dpi': 130, 'axes.spines.top': False, 'axes.spines.right': False, 'font.size': 10})

t = load_sessions(DATA_DIR)
dec, post, final, people, debriefs = t['decisions'], t['post_flight'], t['final'], t['participants'], t['debriefs']
print(f"{people.participant_id.nunique()} participants, {len(dec)} decisions")
people.condition.value_counts().sort_index()"""),
    md("## 1. Data checks and exclusions"),
    code("""# Each completed participant should have 48 decisions (4 flights x 12).
per_person = dec.groupby('participant_id').size()
print('Participants without 48 decisions:', list(per_person[per_person != 48].index))

# Pre-specified exclusion: more than 25% timeouts suggests the participant was not engaged.
timeout_rate = dec.groupby('participant_id')['action'].apply(lambda s: (s == 'timeout').mean())
excluded = timeout_rate[timeout_rate > 0.25].index.tolist()
print('Excluded for timeouts:', excluded)
dec = dec[~dec.participant_id.isin(excluded)]
post = post[~post.participant_id.isin(excluded)]
final = final[~final.participant_id.isin(excluded)]
people = people[~people.participant_id.isin(excluded)]
errors = dec[~dec.aria_correct].copy()
print(f"Analysed: {people.participant_id.nunique()} participants, {len(errors)} AI-error trials")"""),
    md("""## 2. RQ1: detection over the four flights

Flight 1 is a baseline (no aids for anyone), flights 2–3 apply the condition, and flight 4 is the test (no aids, two new error types).
The key comparison is flight 4."""),
    code("""sd = sdt_table(dec, ['participant_id', 'condition', 'flight'])

fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))
for c in 'ABCD':
    g = sd[sd.condition == c].groupby('flight')
    for ax, col, lab in [(axes[0], 'hit_rate', 'AI errors caught'), (axes[1], 'd_prime', "Sensitivity (d')")]:
        m = g[col].mean()
        ci = np.array([bootstrap_ci(sd[(sd.condition == c) & (sd.flight == f)][col].values) for f in m.index])
        ax.plot(m.index, m.values, marker='o', color=COND_COLOR[c], label=COND_LABEL[c])
        ax.fill_between(m.index, ci[:, 0], ci[:, 1], color=COND_COLOR[c], alpha=0.12)
        ax.set_title(lab, loc='left'); ax.set_xticks([1, 2, 3, 4])
        ax.set_xticklabels(['1\\nbaseline', '2\\ntraining', '3\\ntraining', '4\\ntest'])
axes[0].yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v:.0%}'))
axes[0].legend(frameon=False, fontsize=8, loc='upper left')
for ax in axes:
    ax.axvspan(1.6, 3.4, color='#eef2f7', zorder=-1)
fig.suptitle('Learning curves by condition (shaded: flights where the condition is applied)', x=0.01, ha='left', fontsize=11)
fig.tight_layout(); fig.savefig(FIG_DIR / 'learning_curves.png', bbox_inches='tight')"""),
    code("""# Flight 4: 2 x 2 ANOVA on d'
f4 = sd[sd.flight == 4].merge(people[['participant_id']], on='participant_id')
f4['explanation'] = f4.condition.isin(['B', 'D']).astype(int)
f4['debrief'] = f4.condition.isin(['C', 'D']).astype(int)
anova = sm.stats.anova_lm(smf.ols('d_prime ~ explanation * debrief', data=f4).fit(), typ=2)
anova['eta_sq_partial'] = anova['sum_sq'] / (anova['sum_sq'] + anova.loc['Residual', 'sum_sq'])
anova.round(3)"""),
    code("""# Event-level model: did the participant catch the error?
# GEE logistic regression with participant clusters gives population-average effects with robust SEs.
errors['flight_c'] = errors['flight'] - 1
errors['explanation'] = errors.has_explanation.astype(int)
errors['debrief'] = errors.has_debrief.astype(int)
errors['caught'] = errors.detected.astype(int)

test = errors[errors.flight == 4]
gee = smf.gee('caught ~ explanation * debrief + C(error_type)', groups='participant_id', data=test,
              family=sm.families.Binomial(), cov_struct=sm.cov_struct.Exchangeable()).fit()
print('Flight 4 (test) model, odds ratios:')
print(pd.DataFrame({'OR': np.exp(gee.params), 'CI_low': np.exp(gee.conf_int()[0]), 'CI_high': np.exp(gee.conf_int()[1]), 'p': gee.pvalues}).round(3))"""),
    code("""# Learning speed across all flights: does detection rise faster with debriefs?
gee_all = smf.gee('caught ~ flight_c * debrief + flight_c * explanation + C(error_type)', groups='participant_id', data=errors,
                  family=sm.families.Binomial(), cov_struct=sm.cov_struct.Exchangeable()).fit()
print(pd.DataFrame({'OR': np.exp(gee_all.params), 'p': gee_all.pvalues}).round(3))

# Robustness check: Bayesian mixed model with a random intercept per participant.
bm = BinomialBayesMixedGLM.from_formula('caught ~ flight_c * debrief + flight_c * explanation + C(error_type)',
                                        {'participant': '0 + C(participant_id)'}, errors).fit_vb()
print(bm.summary())"""),
    md("## 3. RQ2: complacency and the first-failure effect"),
    code("""# In flight 1, ARIA is right for 8 straight events before its first error (F1-E09).
f1 = errors[errors.flight == 1]
first = f1[f1.event_id == 'F1-E09'].caught
later = errors[(errors.flight == 1) & (errors.event_id != 'F1-E09')].caught
print(f"First error caught: {first.mean():.0%} (n={len(first)})  |  later flight-1 errors: {later.mean():.0%}")

# Verification (cross-checking) as a behavioural measure of vigilance
ver = dec.groupby(['condition', 'flight']).verified.mean().unstack(0)
fig, ax = plt.subplots(figsize=(5, 3.4))
for c in 'ABCD':
    ax.plot(ver.index, ver[c], marker='o', color=COND_COLOR[c], label=COND_LABEL[c])
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v:.0%}'))
ax.set_xticks([1, 2, 3, 4]); ax.set_xlabel('Flight'); ax.set_title('Share of decisions cross-checked', loc='left')
ax.legend(frameon=False, fontsize=8); fig.tight_layout(); fig.savefig(FIG_DIR / 'verification.png', bbox_inches='tight')"""),
    md("## 4. RQ3: which errors are hardest to catch?"),
    code("""labels = {'E1_stale_data': 'Stale data', 'E2_sensor_fault': 'Sensor fault', 'E3_out_of_distribution': 'Out of distribution (new)',
          'E4_goal_misspecification': 'Goal misspecification', 'E5_hallucinated_procedure': 'Hallucinated procedure',
          'E6_communication_error': 'Communication error (new)'}
overall = errors.groupby('error_type').caught.mean().sort_values()
print(overall.rename(labels).map('{:.0%}'.format))

heat = test.groupby(['error_type', 'condition']).caught.mean().unstack()
fig, ax = plt.subplots(figsize=(6.4, 2.6))
im = ax.imshow(heat.values, cmap='Blues', vmin=0, vmax=1, aspect='auto')
ax.set_xticks(range(4)); ax.set_xticklabels([COND_LABEL[c] for c in heat.columns], fontsize=8)
ax.set_yticks(range(len(heat))); ax.set_yticklabels([labels[e] for e in heat.index], fontsize=8)
for i in range(heat.shape[0]):
    for j in range(heat.shape[1]):
        v = heat.values[i, j]
        ax.text(j, i, f'{v:.0%}', ha='center', va='center', color='white' if v > 0.55 else '#1b1d21', fontsize=8)
ax.set_title('Flight 4: share of each error type caught', loc='left')
fig.tight_layout(); fig.savefig(FIG_DIR / 'error_type_heatmap.png', bbox_inches='tight')"""),
    md("## 5. Trust calibration\n\nARIA was right 75% of the time. A well-calibrated participant accepts its advice about as often as it is right, and accepts it mostly when it is right."),
    code("""acc = dec.assign(accepted=lambda d: d.action != 'reject').groupby(['condition', 'flight']).accepted.mean().unstack(0)
trust = post.merge(people[['participant_id', 'condition']]).groupby(['condition', 'flight']).trust.mean().unstack(0)
fig, axes = plt.subplots(1, 2, figsize=(10, 3.4))
for c in 'ABCD':
    axes[0].plot(acc.index, acc[c], marker='o', color=COND_COLOR[c], label=COND_LABEL[c])
    axes[1].plot(trust.index, trust[c], marker='o', color=COND_COLOR[c])
axes[0].axhline(0.75, ls='--', color='#5b616b', lw=1); axes[0].text(4.05, 0.75, 'ARIA reliability', va='center', fontsize=8)
axes[0].yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v:.0%}'))
axes[0].set_title('Share of advice accepted', loc='left'); axes[1].set_title('Self-reported trust (1–7)', loc='left')
for ax in axes: ax.set_xticks([1, 2, 3, 4]); ax.set_xlabel('Flight')
axes[0].legend(frameon=False, fontsize=8); fig.tight_layout(); fig.savefig(FIG_DIR / 'trust_calibration.png', bbox_inches='tight')"""),
    md("## 6. RQ4 (exploratory): report framing and responsibility"),
    code("""resp = final.merge(people[['participant_id', 'condition', 'framing']])
resp = resp[resp.condition.isin(['C', 'D'])]
cols = ['resp_you', 'resp_aria', 'resp_designers', 'resp_airline']
summary = resp.groupby('framing')[cols].mean().round(1)
print(summary)
from scipy.stats import mannwhitneyu
for c in cols:
    a, b = resp[resp.framing == 'systemic'][c], resp[resp.framing == 'individual'][c]
    if len(a) and len(b):
        print(c, 'Mann-Whitney p =', round(mannwhitneyu(a, b).pvalue, 3))

fig, ax = plt.subplots(figsize=(6, 2.2))
left = np.zeros(len(summary))
names = {'resp_you': 'Captain', 'resp_aria': 'ARIA', 'resp_designers': 'Designers', 'resp_airline': 'Airline'}
for c, col in zip(cols, ['#1f3a5f', '#2a8fbd', '#c46a1b', '#8a8f98']):
    ax.barh(summary.index, summary[c], left=left, color=col, label=names[c]); left += summary[c].values
ax.set_xlim(0, 100); ax.set_xlabel('Share of responsibility (%)')
ax.legend(ncol=4, frameon=False, fontsize=8, loc='lower center', bbox_to_anchor=(0.5, 1.0))
fig.tight_layout(); fig.savefig(FIG_DIR / 'responsibility.png', bbox_inches='tight')"""),
    md("## 7. Workload and debrief reading time"),
    code("""print(post.merge(people[['participant_id', 'condition']]).groupby('condition').tlx_raw.mean().round(1))
if len(debriefs):
    print('Median debrief reading time (s):', round(debriefs.view_ms.median() / 1000))"""),
]

nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
nbf.write(nb, "analysis.ipynb")
print("wrote analysis.ipynb")
