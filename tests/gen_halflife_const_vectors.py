#!/usr/bin/env python3
"""Independent vectors for tools/halflife_const_engine.js (Half-Life Calculator, Mode 02: decay constant and mean lifetime converter).
No code is shared with the engine: every expected value is computed with Python's decimal module at 60 digits from the exact decimal value of the
double-precision input, using lambda = ln 2 / T, tau = 1 / lambda, T = tau ln 2, and, for a change of time unit, the exact seconds per unit
(Julian year = 365.25 days). Run: python3 tests/gen_halflife_const_vectors.py > tests/halflife_const_vectors.json"""
import json, random
from decimal import Decimal as D, Context, setcontext, localcontext
setcontext(Context(prec=60, Emin=-999999, Emax=999999))
random.seed(20261122)
LN2 = D(2).ln()
SEC = {'ns': D('1e-9'), 'us': D('1e-6'), 'ms': D('1e-3'), 's': D(1), 'min': D(60), 'h': D(3600), 'd': D(86400), 'wk': D(604800),
       'yr': D('365.25') * 86400, 'kyr': D('365.25') * 86400 * 1000, 'Myr': D('365.25') * 86400 * 10**6, 'Gyr': D('365.25') * 86400 * 10**9}
def s(x): return format(x, '.30e')
def decayed_per_unit(T):
    # 1 - 2^(-1/T) at 450 digits, so that a decay of 1e-300 still has 30 correct digits
    with localcontext(Context(prec=450, Emin=-999999, Emax=999999)):
        x = D(2).ln() / D(T)
        return 1 - (-x).exp()
def make(name, src, value, unit='yr', out=None):
    v = D(value)
    if src == 'T':        T = v
    elif src == 'lambda': T = LN2 / v
    else:                 T = v * LN2
    lam = LN2 / T; tau = T / LN2
    if src == 'lambda': lam, tau = v, 1 / v
    if src == 'tau':    tau, lam = v, 1 / v
    o = {'T': s(T), 'lambda': s(lam), 'tau': s(tau), 'perUnitRemaining': s(D(2) ** (-1 / T)), 'perUnitDecayed': s(decayed_per_unit(T))}
    if out and out != unit:
        k = SEC[unit] / SEC[out]
        o['conv'] = {'T': s(T * k), 'lambda': s(lam / k), 'tau': s(tau * k)}
    inp = {'known': src, src: repr(float(value)), 'timeUnit': unit}
    if out: inp['outUnit'] = out
    return {'name': name, 'in': inp, 'out': o}
V = []
# the brief's cases
V.append(make('lambda for a 10 year half-life', 'T', 10.0))
V.append(make('mean lifetime for a 10 year half-life', 'T', 10.0))
V.append(make('C-14 half-life 5730 yr', 'T', 5730.0))
V.append(make('half-life from lambda 0.0693147', 'lambda', 0.0693147))
V.append(make('half-life from tau 14.427', 'tau', 14.427))
V.append(make('tau 14.426950408889634', 'tau', 14.426950408889634))
V.append(make('lambda 1 per second', 'lambda', 1.0, 's'))
V.append(make('half-life one unit', 'T', 1.0))
# extreme but representable
for x in (1e-300, 1e-200, 1e-100, 1e100, 1e200, 1e300):
    for src in ('T', 'lambda', 'tau'):
        V.append(make('extreme %s=%g' % (src, x), src, x, 's'))
# every unit pair for the same half-life
for u in SEC:
    for o in SEC:
        if u != o: V.append(make('convert %s to %s' % (u, o), 'T', 12.5, u, o))
# random cases, all three sources, with and without a unit change
units = list(SEC)
for i in range(400):
    x = 10 ** random.uniform(-12, 12)
    u = random.choice(units); o = random.choice([None, random.choice(units)])
    for src in ('T', 'lambda', 'tau'):
        V.append(make('random %s #%d' % (src, i), src, x, u, o))
print(json.dumps(V, indent=0))
