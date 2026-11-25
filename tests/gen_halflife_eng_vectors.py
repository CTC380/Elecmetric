#!/usr/bin/env python3
"""Independent vectors for tools/halflife_eng_engine.js (Half-Life Calculator, Mode 05: RC and RL engineering decay).
No code is shared with the engine: every expected value is computed with Python's decimal module (450 digits) from the exact decimal value of the double inputs,
with the unit prefixes as exact powers of ten. tau = R C (RC), L / R (RL) or tau / T_half / ln 2 (generic); n = t / tau; f = exp(-n); decayed = 1 - f;
for a target, n = ln(x0 / target). Energies are (1/2) C V^2 or (1/2) L I^2, falling as f^2.
Run: python3 tests/gen_halflife_eng_vectors.py > tests/halflife_eng_vectors.json"""
import json, random
from decimal import Decimal as D, Context, setcontext, localcontext
setcontext(Context(prec=60, Emin=-999999, Emax=999999))
random.seed(20261122)
EXP = {'mV': -3, 'V': 0, 'kV': 3, 'uA': -6, 'mA': -3, 'A': 0, 'kA': 3, 'mohm': -3, 'ohm': 0, 'kohm': 3, 'Mohm': 6, 'pF': -12, 'nF': -9, 'uF': -6, 'mF': -3, 'F': 0,
       'nH': -9, 'uH': -6, 'mH': -3, 'H': 0, 'ns': -9, 'us': -6, 'ms': -3, 's': 0}
MUL = {'min': 60, 'h': 3600, 'd': 86400}
def si(v, u):
    v = D(float(v))
    return v * MUL[u] if u in MUL else v * D(10) ** EXP[u]
def s(x): return format(x, '.30e')
def make(name, c, find, X0, x0u, A, au, B, bu, t=None, tu='s', target=None, tmode='abs', kind='tau'):
    """A, B: R and C (rc), R and L (rl); generic: A is tau or half-life (au its unit), B unused."""
    with localcontext(Context(prec=450, Emin=-999999, Emax=999999)):
        ln2 = D(2).ln()
        if c == 'gen': tau = si(A, au) / (ln2 if kind == 'half' else 1)
        elif c == 'rc': tau = si(A, au) * si(B, bu)
        else: tau = si(B, bu) / si(A, au)
        x0 = D(float(X0))
        if find == 'value': ts = si(t, tu); n = ts / tau
        else:
            f0 = (D(float(target)) / 100) if tmode == 'pct' else D(float(target)) / x0
            n = -f0.ln(); ts = n * tau
        f = (-n).exp()
        out = {'tau': s(tau), 'tHalf': s(tau * ln2), 'lambda': s(1 / tau), 'time': s(ts), 'n': s(n), 'frac': s(f), 'dec': s(1 - f), 'xt': s(x0 * f)}
        if c != 'gen':
            x0s = si(X0, x0u)
            if c == 'rc':
                C = si(B, bu); R = si(A, au)
                out.update({'I0': s(x0s / R), 'It': s(x0s / R * f), 'Q0': s(C * x0s), 'Qt': s(C * x0s * f), 'E0': s(C * x0s * x0s / 2), 'Et': s(C * x0s * x0s / 2 * f * f), 'Ed': s(C * x0s * x0s / 2 * (1 - f * f)), 'P0': s(x0s * x0s / R)})
            else:
                Lh = si(B, bu); R = si(A, au)
                out.update({'VR0': s(x0s * R), 'VRt': s(x0s * f * R), 'psi0': s(Lh * x0s), 'psit': s(Lh * x0s * f), 'E0': s(Lh * x0s * x0s / 2), 'Et': s(Lh * x0s * x0s / 2 * f * f), 'Ed': s(Lh * x0s * x0s / 2 * (1 - f * f))})
    inp = {'circuit': c, 'find': find, 'X0': repr(float(X0)), 'x0Unit': x0u}
    if c == 'gen': inp.update({'tau': repr(float(A)), 'tauUnit': au, 'tauKind': kind})
    else:
        inp.update({'R': repr(float(A)), 'rUnit': au})
        inp.update({'C': repr(float(B)), 'cUnit': bu} if c == 'rc' else {'L': repr(float(B)), 'lUnit': bu})
    if find == 'value': inp.update({'t': repr(float(t)), 'tUnit': tu})
    else: inp.update({'target': repr(float(target)), 'targetMode': tmode, 'tUnit': tu})
    return {'name': name, 'in': inp, 'out': out}
V = []
V.append(make('brief RC 1 s', 'rc', 'value', 100, 'V', 10, 'kohm', 100, 'uF', t=1))
V.append(make('brief RC to 50 V', 'rc', 'time', 100, 'V', 10, 'kohm', 100, 'uF', target=50))
V.append(make('RL 2 A', 'rl', 'value', 2, 'A', 10, 'ohm', 100, 'mH', t=10, tu='ms'))
V.append(make('RL freewheel to 10%', 'rl', 'time', 5, 'A', 22, 'ohm', 2, 'H', target=10, tmode='pct', tu='ms'))
V.append(make('bleeder 400 V to 50 V', 'rc', 'time', 400, 'V', 1, 'Mohm', 470, 'uF', target=50, tu='min'))
V.append(make('generic tau', 'gen', 'value', 1, 'V', 5, 'ms', None, None, t=20, tu='ms'))
V.append(make('generic half-life 30 d to 20%', 'gen', 'time', 100, 'V', 30, 'd', None, None, target=20, tmode='pct', tu='d', kind='half'))
V.append(make('one time constant exactly', 'rc', 'value', 12, 'V', 1, 'kohm', 1, 'mF', t=1))
V.append(make('five time constants', 'rc', 'value', 100, 'V', 1, 'kohm', 1, 'uF', t=5, tu='ms'))
V.append(make('long time, deep decay', 'rc', 'value', 100, 'V', 1, 'ohm', 1, 'F', t=600))
V.append(make('target near the start', 'rc', 'time', 100, 'V', 1, 'kohm', 1, 'uF', target=99.9999, tmode='pct', tu='us'))
V.append(make('target tiny', 'rl', 'time', 1, 'A', 1, 'ohm', 1, 'H', target=1e-250))
V.append(make('time zero', 'rc', 'value', 5, 'V', 1, 'kohm', 1, 'uF', t=0))
for k in range(90):
    c = random.choice(['rc', 'rl', 'gen']); find = random.choice(['value', 'time'])
    X0 = 10 ** random.uniform(-3, 4); tu = random.choice(['ns', 'us', 'ms', 's', 'min', 'h', 'd'])
    x0u = random.choice(['mV', 'V', 'kV']) if c == 'rc' else random.choice(['uA', 'mA', 'A', 'kA'])
    A = 10 ** random.uniform(-1, 3); B = 10 ** random.uniform(-1, 3)
    au = random.choice(['mohm', 'ohm', 'kohm', 'Mohm']) if c != 'gen' else random.choice(['ns', 'us', 'ms', 's', 'min', 'h', 'd'])
    bu = random.choice(['pF', 'nF', 'uF', 'mF', 'F']) if c == 'rc' else random.choice(['nH', 'uH', 'mH', 'H']) if c == 'rl' else None
    kind = random.choice(['tau', 'half'])
    tauS = None
    if find == 'value':
        # a time of 0.05 to 8 time constants, in the chosen unit
        with localcontext(Context(prec=60)):
            tau = (si(A, au) if c == 'gen' else (si(A, au) * si(B, bu) if c == 'rc' else si(B, bu) / si(A, au)))
            if c == 'gen' and kind == 'half': tau = tau / D(2).ln()
            t = float(tau * D(10) ** D(random.uniform(-1.3, 0.9)) / (D(MUL[tu]) if tu in MUL else D(10) ** EXP[tu]))
        V.append(make('random %d' % k, c, find, X0, x0u, A, au, B, bu, t=t, tu=tu, kind=kind))
    else:
        if random.random() < .5: V.append(make('random %d' % k, c, find, X0, x0u, A, au, B, bu, target=random.uniform(0.001, 100), tmode='pct', tu=tu, kind=kind))
        else: V.append(make('random %d' % k, c, find, X0, x0u, A, au, B, bu, target=X0 * random.uniform(0.001, 1), tmode='abs', tu=tu, kind=kind))
print(json.dumps(V, indent=0))
