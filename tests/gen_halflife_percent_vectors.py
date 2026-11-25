#!/usr/bin/env python3
"""Independent vectors for tools/halflife_percent_engine.js (Half-Life Calculator, Mode 03: remaining and decayed percentage).
No code is shared with the engine: every expected value is computed with Python's decimal module from the exact decimal value of the double-precision
inputs, using n = (t x seconds per t-unit) / (T x seconds per T-unit), f = 2^(-n) and decayed = 1 - f. The decayed fraction is computed at 450 digits so that
a decay of 1e-300 still has 30 correct digits (Julian year = 365.25 days).
Run: python3 tests/gen_halflife_percent_vectors.py > tests/halflife_percent_vectors.json"""
import json, random
from decimal import Decimal as D, Context, setcontext, localcontext
setcontext(Context(prec=60, Emin=-999999, Emax=999999))
random.seed(20261123)
SEC = {'ns': D('1e-9'), 'us': D('1e-6'), 'ms': D('1e-3'), 's': D(1), 'min': D(60), 'h': D(3600), 'd': D(86400), 'wk': D(604800),
       'yr': D('365.25') * 86400, 'kyr': D('365.25') * 86400 * 1000, 'Myr': D('365.25') * 86400 * 10**6, 'Gyr': D('365.25') * 86400 * 10**9}
def s(x): return format(x, '.30e')
def make(name, t, T, tu='yr', hu=None, N0=None):
    hu = hu or tu
    t, T = float(t), float(T)
    with localcontext(Context(prec=450, Emin=-999999, Emax=999999)):
        n = D(t) * SEC[tu] / (D(T) * SEC[hu])
        rem = (-n * D(2).ln()).exp()
        dec = 1 - rem
    o = {'n': s(n), 'rem': s(rem), 'dec': s(dec)}
    if N0 is not None:
        with localcontext(Context(prec=450, Emin=-999999, Emax=999999)):
            o['remQty'] = s(D(float(N0)) * rem); o['decQty'] = s(D(float(N0)) * dec)
    inp = {'t': repr(t), 'T': repr(T), 'timeUnit': tu}
    if hu != tu: inp['halfLifeUnit'] = hu
    if N0 is not None: inp['N0'] = repr(float(N0))
    return {'name': name, 'in': inp, 'out': o}
V = []
# the brief's cases
V.append(make('100 g after 11,460 yr, half-life 5,730 yr', 11460, 5730, N0=100))
V.append(make('100 g after one half-life', 10, 10, N0=100))
V.append(make('100 g after two half-lives', 20, 10, N0=100))
V.append(make('100 g after three half-lives', 30, 10, N0=100))
V.append(make('half-life 10 yr, time 20 yr', 20, 10))
V.append(make('half-life 5730 yr, time 11460 yr', 11460, 5730))
V.append(make('time zero', 0, 10, N0=100))
V.append(make('3 of 10 years', 3, 10))
# whole numbers of half-lives, 0 to 60
for k in range(0, 61): V.append(make('%d half-lives' % k, 7 * k, 7, N0=3.5))
# tiny decay: n from 1e-250 to 1e-3
for e in range(-250, -2, 12): V.append(make('tiny n 1e%d' % e, 10.0 ** e, 1.0, 's', N0=1e6))
# long times and the underflow edge (rem about 1e-308 to 1e-324 and beyond)
for n in (100, 500, 1000, 1022, 1023, 1040, 1070, 1073, 1074, 1074.5, 1075, 1100, 5000):
    V.append(make('long time n=%s' % n, n, 1.0, 'yr', N0=10))
# every ordered unit pair for the same physical ratio
for u in SEC:
    for o in SEC:
        V.append(make('t in %s, half-life in %s' % (u, o), 12.5, 3.75, u, o, N0=100))
# large and small quantities
for q in (1e-300, 1e-10, 1e10, 1e300): V.append(make('quantity %g' % q, 2.5, 1.0, 'yr', N0=q))
# random cases, same unit and mixed units; n kept below 150 for the mixed ones so the unit-ratio rounding stays inside the tolerance
units = list(SEC)
for i in range(400):
    T = 10 ** random.uniform(-6, 6); n = 10 ** random.uniform(-4, 2.1); t = n * T
    u = random.choice(units)
    V.append(make('random same unit #%d' % i, t, T, u, None, N0=10 ** random.uniform(-3, 6) if i % 2 else None))
for i in range(400):
    u, o = random.choice(units), random.choice(units)
    ratio = float(SEC[u] / SEC[o])
    T = 10 ** random.uniform(-3, 3); n = 10 ** random.uniform(-3, 2.1); t = n * T / ratio
    if not (1e-300 < t < 1e300): continue
    V.append(make('random mixed #%d (%s/%s)' % (i, u, o), t, T, u, o, N0=100 if i % 2 else None))
print(json.dumps(V, indent=0))
