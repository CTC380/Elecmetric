#!/usr/bin/env python3
"""Independent vectors for tools/halflife_table_engine.js (Half-Life Calculator, Mode 04: decay table and graph).
No code is shared with the engine: every expected value is computed with Python's decimal module (450 digits) from the exact decimal value of the
double-precision inputs. Row i is at n = i x step half-lives of A ("hl") or at t = i x step in the table unit ("time"); every scenario j has
n_j = t x (seconds per table unit) / (T_j x seconds per unit of T_j), f = 2^(-n), decayed = 1 - f (Julian year = 365.25 days).
Run: python3 tests/gen_halflife_table_vectors.py > tests/halflife_table_vectors.json"""
import json, random
from decimal import Decimal as D, Context, setcontext, localcontext
setcontext(Context(prec=60, Emin=-999999, Emax=999999))
random.seed(20261124)
SEC = {'ns': D('1e-9'), 'us': D('1e-6'), 'ms': D('1e-3'), 's': D(1), 'min': D(60), 'h': D(3600), 'd': D(86400), 'wk': D(604800),
       'yr': D('365.25') * 86400, 'kyr': D('365.25') * 86400 * 1000, 'Myr': D('365.25') * 86400 * 10**6, 'Gyr': D('365.25') * 86400 * 10**9}
UN = list(SEC)
def s(x): return format(x, '.30e')
def make(name, T, hu, basis, step, rows, tu=None, N0=None, B=None, C=None):
    tu = tu or hu
    T, step = float(T), float(step)
    scen = [(T, hu)] + [(float(x[0]), x[1] or hu) for x in (B, C) if x]
    out = []
    with localcontext(Context(prec=450, Emin=-999999, Emax=999999)):
        for i in range(rows + 1):
            if basis == 'hl': t = D(i) * D(step) * D(T) * SEC[hu] / SEC[tu]
            else: t = D(i) * D(step)
            ps = []
            for j, (Tj, uj) in enumerate(scen):
                n = (D(i) * D(step)) if (basis == 'hl' and j == 0) else t * SEC[tu] / (D(Tj) * SEC[uj])
                rem = (-n * D(2).ln()).exp(); dec = 1 - rem
                p = {'n': s(n), 'rem': s(rem), 'dec': s(dec)}
                if N0 is not None: p['qty'] = s(D(float(N0)) * rem)
                ps.append(p)
            out.append({'i': i, 't': s(t), 'p': ps})
    inp = {'T': repr(T), 'halfLifeUnit': hu, 'basis': basis, 'step': repr(step), 'rows': str(rows)}
    if tu != hu: inp['tableUnit'] = tu
    if N0 is not None: inp['N0'] = repr(float(N0))
    if B: inp['TB'] = repr(float(B[0])); inp['unitB'] = B[1] or hu
    if C: inp['TC'] = repr(float(C[0])); inp['unitC'] = C[1] or hu
    return {'name': name, 'in': inp, 'rows': out}
V = []
V.append(make('carbon-14 every half-life', 5730, 'yr', 'hl', 1, 10, N0=100))
V.append(make('half-life 10 yr, 8 rows', 10, 'yr', 'hl', 1, 8))
V.append(make('quarter-half-life steps', 10, 'yr', 'hl', 0.25, 16, N0=100))
V.append(make('every year, T 3 yr', 3, 'yr', 'time', 1, 10, N0=1000))
V.append(make('compare 5 yr and 10 yr', 5, 'yr', 'time', 5, 8, B=(10, 'yr')))
V.append(make('three half-lives', 2, 'yr', 'time', 2, 10, B=(4, 'yr'), C=(8, 'yr')))
V.append(make('hourly for a day', 6, 'h', 'time', 1, 24, N0=800))
V.append(make('days against hours', 8.02, 'd', 'time', 1, 30, B=(12, 'h')))
V.append(make('40 half-lives', 1, 'yr', 'hl', 1, 40))
V.append(make('200 rows', 1, 's', 'hl', 1, 200, N0=1e6))
V.append(make('long time to the underflow edge', 1, 'yr', 'hl', 6, 200))
V.append(make('tiny step', 1, 'yr', 'hl', 1e-12, 50, N0=7))
V.append(make('half-lives of A shown in another unit', 1, 'yr', 'hl', 1, 12, tu='d', B=(1, 'd')))
for k in range(60):
    hu = random.choice(UN); tu = random.choice(UN); bs = random.choice(['hl', 'time'])
    T = 10 ** random.uniform(-3, 3)
    step = 10 ** random.uniform(-2, 1) if bs == 'hl' else T * float(SEC[hu] / SEC[tu]) * 10 ** random.uniform(-1.5, 0.5)
    step = float(step)
    rows = random.randint(1, 30); B = C = None
    if random.random() < .6: B = (10 ** random.uniform(-3, 3), random.choice(UN))
    if B and random.random() < .5: C = (10 ** random.uniform(-3, 3), random.choice(UN))
    N0 = 10 ** random.uniform(-6, 6) if random.random() < .5 else None
    V.append(make('random %d' % k, T, hu, bs, step, rows, tu=tu, N0=N0, B=B, C=C))
print(json.dumps(V, indent=0))
