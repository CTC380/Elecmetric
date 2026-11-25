#!/usr/bin/env python3
"""Independent vectors for tools/halflife_engine.js (Half-Life Calculator, Mode 01).
No code is shared with the engine: every expected value is computed with Python's decimal module at 60 digits from the exact decimal value of
the double-precision inputs, using N(t) = N0 * 2^(-t/T), t = T ln(N0/Nt) / ln 2, T = t ln 2 / ln(N0/Nt), lambda = ln 2 / T, tau = T / ln 2.
Run: python3 tests/gen_halflife_vectors.py > tests/halflife_vectors.json"""
import json, random
from decimal import Decimal as D, getcontext, Context, setcontext
setcontext(Context(prec=60, Emin=-999999, Emax=999999))
random.seed(20261121)
LN2 = D(2).ln()
def pw(n):            # 2^(-n) for a Decimal n
    return D(2) ** (-n)
def s(x):             # Decimal -> string with 30 significant digits
    return format(x, '.30e')
def repr_f(f):        # a float as the text a user could type
    return repr(float(f))
def make(name, target, N0, Nt, t, T):
    """N0, Nt, t, T are floats (Nt/t/T may be None for the unknown). Returns a vector; the unknown is computed exactly from the other three."""
    d = {k: (None if v is None else D(v)) for k, v in (('N0', N0), ('Nt', Nt), ('t', t), ('T', T))}
    if target == 'Nt':   d['Nt'] = d['N0'] * pw(d['t'] / d['T'])
    elif target == 'N0': d['N0'] = d['Nt'] * (D(2) ** (d['t'] / d['T']))
    elif target == 't':  d['t'] = d['T'] * (d['N0'] / d['Nt']).ln() / LN2
    elif target == 'T':  d['T'] = d['t'] * LN2 / (d['N0'] / d['Nt']).ln()
    n = d['t'] / d['T']
    remf = d['Nt'] / d['N0']
    out = {'N0': s(d['N0']), 'Nt': s(d['Nt']), 't': s(d['t']), 'T': s(d['T']), 'n': s(n), 'rem': s(remf * 100), 'dec': s((1 - remf) * 100), 'decQty': s(d['N0'] - d['Nt']), 'lambda': s(LN2 / d['T']), 'tau': s(d['T'] / LN2)}
    inp = {'target': target}
    for k, v in (('N0', N0), ('Nt', Nt), ('t', t), ('T', T)):
        if k != target and v is not None: inp[k] = repr_f(v)
    return {'name': name, 'in': inp, 'out': out}
V = []
# the brief's cases
V.append(make('100 g after one half-life', 'Nt', 100.0, None, 10.0, 10.0))
V.append(make('100 g after two half-lives', 'Nt', 100.0, None, 20.0, 10.0))
V.append(make('100 g after three half-lives', 'Nt', 100.0, None, 30.0, 10.0))
V.append(make('T 10 yr, t 20 yr', 'Nt', 100.0, None, 20.0, 10.0))
V.append(make('T 5730 yr, t 11460 yr', 'Nt', 100.0, None, 11460.0, 5730.0))
V.append(make('initial from Nt 25', 'N0', None, 25.0, 11460.0, 5730.0))
V.append(make('time 100 to 25', 'T', 100.0, 25.0, 11460.0, None))
V.append(make('half-life from 100, 25, 11460', 'T', 100.0, 25.0, 11460.0, None))
V.append(make('elapsed from 100, 25, T 5730', 't', 100.0, 25.0, None, 5730.0))
# near N0 (tiny decay) and very long runs
for n in (1e-12, 1e-9, 1e-6, 1e-4, 1e-3):
    V.append(make('tiny decay n=%g' % n, 'Nt', 1.0, None, n * 7.0, 7.0))
    V.append(make('tiny decay, Nt given, n=%g' % n, 'T', 1.0, float(D(1) * pw(D(n))), 7.0 * n, None))
for n in (100.0, 500.0, 1000.0, 1074.0):
    V.append(make('long run n=%g' % n, 'Nt', 5.0, None, n * 3.0, 3.0))
V.append(make('extreme ratio, time', 't', 1e300, 1e-300, None, 1e9))
V.append(make('extreme ratio, half-life', 'T', 1e300, 1e-300, 2e12, None))
# random cases, all four targets
def loguni(lo, hi): return 10 ** random.uniform(lo, hi)
for i in range(350):
    N0, T, n = loguni(-12, 12), loguni(-6, 12), random.choice([random.uniform(0, 8), random.uniform(0, 60), random.uniform(0, 0.01)])
    t = n * T
    if t == 0: continue
    Nt = float(D(N0) * pw(D(t) / D(T)))
    if Nt <= 0 or Nt >= N0: continue
    V.append(make('random Nt #%d' % i, 'Nt', N0, None, t, T))
    V.append(make('random N0 #%d' % i, 'N0', None, Nt, t, T))
    V.append(make('random t #%d' % i, 't', N0, Nt, None, T))
    V.append(make('random T #%d' % i, 'T', N0, Nt, t, None))
# automatic mode: the unknown is the blank field (same expected values, checked by the test through the blank)
print(json.dumps(V, indent=0))
