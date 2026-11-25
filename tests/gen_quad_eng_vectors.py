"""Reference vectors for tools/quad_eng_engine.js (Quadratic Formula Calculator, Mode 05: Engineering Quadratic Solver).
Everything here is computed without the JavaScript engine: the input text is read with Fraction, the root locations and the class come from exact sympy roots,
and the numbers and the natural response come from mpmath at 60 digits (the response coefficients by solving the 2x2 initial-condition system, not by the closed forms the engine uses).
Run: python3 tests/gen_quad_eng_vectors.py   (writes tests/quad_eng_vectors.json)"""
import json, random, os
from fractions import Fraction as F
from decimal import Decimal
import sympy as sp
import mpmath as mp

mp.mp.dps = 60
random.seed(5050)
PREFIX = {'p': -12, 'n': -9, 'u': -6, 'm': -3, 'k': 3, 'M': 6, 'G': 9}
UNITS = {'R': ['\u03a9', 'ohm'], 'L': ['H'], 'C': ['F'], 'm': ['kg'], 'wn': ['rad/s']}

def read(text, units=()):
    s = text.strip()
    for u in sorted(units, key=len, reverse=True):
        if len(s) > len(u) and s.endswith(u):
            s = s[:-len(u)].strip(); break
    mult = F(1)
    if len(s) > 1 and s[-1] in PREFIX and (s[-2].isdigit() or s[-2] in '. /'):
        e = PREFIX[s[-1]]; mult = F(10) ** e; s = s[:-1]
    s = s.strip()
    if ' ' in s and '/' in s:
        w, fr = s.split(None, 1); neg = w.startswith('-'); v = abs(F(w)) + F(fr); v = -v if neg else v
    else:
        v = F(Decimal(s)) if '/' not in s else F(s)
    return v * mult

def dec(f):
    """exact decimal string for a Fraction whose denominator is 2^a 5^b, in scientific form"""
    d = Decimal(f.numerator) / Decimal(f.denominator)
    t = format(d.normalize(), 'E') if d != 0 else '0'
    return t

def style(f, unit_list, plain=False):
    """render a value as text, randomly plain scientific or with an SI prefix and unit"""
    r = random.random()
    if f == 0: return random.choice(['0', '0.0'])
    if plain or r < 0.35: return dec(f)
    for p, e in sorted(PREFIX.items(), key=lambda kv: -kv[1]):
        m = f / F(10) ** e
        if 1 <= abs(m) < 1000:
            ms = dec(m)
            if len(ms.replace('-', '').replace('.', '').split('E')[0]) <= 7:
                u = random.choice(unit_list) if unit_list and random.random() < 0.5 else ''
                return ms + p + u
    return dec(f)

x = sp.symbols('x')
def coefs(kind, v):
    if kind == 'series': R, L, C = v; return L, R, 1 / C
    if kind == 'parallel': R, L, C = v; return C, 1 / R, 1 / L
    if kind == 'control': return v
    if kind == 'mech': m, c, k = v; return m, c, k
    if kind == 'zeta': wn, z = v; return F(1), 2 * z * wn, wn * wn

def analyse(kind, v, x0, v0):
    a, b, c = coefs(kind, v)
    ba, ca = b / a, c / a
    A_, B_, C_ = sp.Rational(a.numerator, a.denominator), sp.Rational(b.numerator, b.denominator), sp.Rational(c.numerator, c.denominator)
    rts = sp.roots(sp.Poly(A_ * x**2 + B_ * x + C_, x), multiple=True)
    if len(rts) == 1: rts = rts * 2
    res = [(sp.simplify(sp.re(r)), sp.simplify(sp.im(r))) for r in rts]
    D = b * b - 4 * a * c
    sres = [sp.sign(r[0]) for r in res]
    if any(s > 0 for s in sres): key = 'unstable' if D >= 0 else 'unstable-osc'
    elif all(s < 0 for s in sres): key = 'over' if D > 0 else 'critical' if D == 0 else 'under'
    else: key = 'undamped' if D < 0 else 'marginal'
    stable = all(s < 0 for s in sres)
    # numbers at 60 digits
    mA, mB, mC = (mp.mpf(a.numerator) / a.denominator, mp.mpf(b.numerator) / b.denominator, mp.mpf(c.numerator) / c.denominator)
    mD = mp.mpf(D.numerator) / D.denominator
    sq = mp.sqrt(abs(mD))
    if D < 0: r1, r2 = mp.mpc(-mB / (2 * mA), sq / (2 * abs(mA))), mp.mpc(-mB / (2 * mA), -sq / (2 * abs(mA)))
    else:
        r1, r2 = (-mB - sq) / (2 * mA), (-mB + sq) / (2 * mA)
    rootsN = sorted([(float(mp.re(r1)), float(mp.im(r1))), (float(mp.re(r2)), float(mp.im(r2)))], key=lambda t: (t[0], -t[1]))
    # cross-check the generator's own roots against sympy's exact ones
    for (re_, im_), (se, si) in zip(sorted([(float(r[0]), float(r[1])) for r in res], key=lambda t: (t[0], -t[1])), rootsN):
        assert abs(re_ - se) <= 1e-9 * max(1, abs(re_)) and abs(abs(im_) - abs(si)) <= 1e-9 * max(1, abs(im_)), (kind, v, re_, im_, se, si)
    out = {'key': key, 'stable': bool(stable), 'roots': rootsN}
    if ca > 0:
        w0 = mp.sqrt(mp.mpf(ca.numerator) / ca.denominator); al = mp.mpf(ba.numerator) / ba.denominator / 2
        out['omega0'] = float(w0); out['alpha'] = float(al); out['zeta'] = float(al / w0); out['f0'] = float(w0 / (2 * mp.pi))
        if al > 0: out['Q'] = float(w0 / (2 * al))
        if D < 0:
            wd = sq / (2 * abs(mA)); out['omegad'] = float(wd)
            if stable:
                zt = al / w0; out['overshoot'] = float(100 * mp.exp(-mp.pi * zt / mp.sqrt(1 - zt * zt))); out['peakTime'] = float(mp.pi / wd)
    else:
        out['alpha'] = float(mp.mpf(ba.numerator) / ba.denominator / 2)
    if stable:
        slow = min(abs(rootsN[0][0]), abs(rootsN[1][0]))
        out['tauDom'] = 1.0 / slow
    if kind == 'series': out['Rcrit'] = float(2 * mp.sqrt(mp.mpf(v[1].numerator) / v[1].denominator / (mp.mpf(v[2].numerator) / v[2].denominator)))
    if kind == 'parallel': out['Rcrit'] = float(mp.sqrt(mp.mpf(v[1].numerator) / v[1].denominator / (mp.mpf(v[2].numerator) / v[2].denominator)) / 2)
    if kind == 'mech': out['Rcrit'] = float(2 * mp.sqrt(mp.mpf(v[0].numerator) / v[0].denominator * mp.mpf(v[2].numerator) / v[2].denominator))
    # natural response by solving the initial-condition system
    X0, V0 = mp.mpf(x0.numerator) / x0.denominator, mp.mpf(v0.numerator) / v0.denominator
    big = max(abs(r1), abs(r2))
    T = 1 / big if big > 0 else mp.mpf(1)
    if D == 0:
        r = r1
        M = mp.matrix([[1, 0], [r, 1]]); co = mp.lu_solve(M, mp.matrix([X0, V0]))
        f = lambda t: mp.re(co[0] * mp.exp(r * t) + co[1] * t * mp.exp(r * t))
        df = lambda t: mp.re(co[0] * r * mp.exp(r * t) + co[1] * (1 + r * t) * mp.exp(r * t))
    else:
        M = mp.matrix([[1, 1], [r1, r2]]); co = mp.lu_solve(M, mp.matrix([X0, V0]))
        f = lambda t: mp.re(co[0] * mp.exp(r1 * t) + co[1] * mp.exp(r2 * t))
        df = lambda t: mp.re(co[0] * r1 * mp.exp(r1 * t) + co[1] * r2 * mp.exp(r2 * t))
    samples = []
    smax = max(float(mp.re(r1)), float(mp.re(r2)))
    for k in (0.5, 1, 2, 3, 5, 8):
        t = T * k
        env = (abs(float(X0)) + abs(float(V0)) * float(T)) * (1 + k) * (3 if D < 0 else 1) * float(mp.exp(max(smax, 0) * t))
        # scale of the cancellation too: sum of magnitudes of the two terms
        mag = float(abs(co[0] * mp.exp(r1 * t)) + abs(co[1] * mp.exp(r2 * t) if D != 0 else co[1] * t * mp.exp(r1 * t)))
        samples.append([float(t), float(f(t)), float(df(t)), max(mag, 1e-300)])
    out['samples'] = samples
    return out

rows = []
def add(kind, vals, texts, x0=F(1), v0=F(0), x0t='1', v0t='0'):
    r = analyse(kind, vals, x0, v0)
    rows.append({'type': kind, 'in': texts, 'x0': x0t, 'v0': v0t, **r})

def txt(kind, vals, plain=False):
    names = {'series': ['R', 'L', 'C'], 'parallel': ['R', 'L', 'C'], 'mech': ['m', 'c', 'k'], 'zeta': ['wn', 'z'], 'control': ['a', 'b', 'c']}[kind]
    out = []
    for n, v in zip(names, vals):
        ul = UNITS.get(n, []) if kind != 'control' else []
        out.append(style(v, ul, plain=plain or kind == 'control' or n in ('z',) or (kind == 'mech' and n != 'm')))
    return out

def rv(texts, kind):
    names = {'series': ['R', 'L', 'C'], 'parallel': ['R', 'L', 'C'], 'mech': ['m', 'c', 'k'], 'zeta': ['wn', 'z'], 'control': ['a', 'b', 'c']}[kind]
    return [read(t, UNITS.get(n, []) if kind != 'control' else []) for t, n in zip(texts, names)]

def make(kind, vals, x0=None, v0=None, plain=False):
    texts = txt(kind, vals, plain)
    vals2 = rv(texts, kind)
    assert vals2 == list(vals), (kind, vals, texts, vals2)
    x0 = x0 if x0 is not None else random.choice([F(1), F(1), F(2), F(-3, 2), F(5)])
    v0 = v0 if v0 is not None else random.choice([F(0), F(0), F(1), F(-2), F(3, 4)])
    add(kind, vals2, texts, x0, v0, dec(x0), dec(v0))

# 1. fixed textbook cases (exact classes)
for R_, L_, C_ in [(F(10), F(1, 1000), F(1, 10000)), (F(20), F(1, 1000), F(1, 1000000)), (F(200), F(1, 100), F(1, 1000000)), (F(0), F(1, 1000), F(1, 1000000)), (F(20), F(1, 1000), F(1, 100000)), (F(1000), F(1, 10), F(1, 1000000000)), (F(5), F(1, 1000000), F(1, 1000000000000))]:
    make('series', [R_, L_, C_])
for R_, L_, C_ in [(F(1000), F(1, 100), F(1, 10000000)), (F(500), F(1, 100), F(1, 10000000)), (F(50), F(1, 100), F(1, 10000000)), (F(1, 2), F(1, 1000), F(1, 1000)), (F(10**6), F(1, 1000000), F(1, 10**12))]:
    make('parallel', [R_, L_, C_])
# 2. exactly critical, just either side, built so that R_crit is a rational number
for q, C_ in [(F(10), F(1, 100000)), (F(100), F(1, 1000000)), (F(3, 2), F(1, 1000)), (F(1000), F(1, 10**9)), (F(7), F(1, 10**6)), (F(1, 4), F(1, 10**4))]:
    L_ = q * q * C_; Rc = 2 * q
    make('series', [Rc, L_, C_])
    make('series', [Rc * (1 + F(1, 10**9)), L_, C_])
    make('series', [Rc * (1 - F(1, 10**9)), L_, C_])
    Rp = q / 2
    make('parallel', [Rp, L_, C_])
    make('parallel', [Rp * (1 + F(1, 10**9)), L_, C_])
    make('parallel', [Rp * (1 - F(1, 10**9)), L_, C_])
# 3. mass-spring-damper and omega_n / zeta
for m_, c_, k_ in [(F(1), F(4), F(4)), (F(2), F(3), F(8)), (F(1, 2), F(0), F(50)), (F(10), F(100), F(250)), (F(3), F(30), F(7)), (F(1), F(2), F(1)), (F(5), F(1, 10), F(2000))]:
    make('mech', [m_, c_, k_])
for wn, z in [(F(100), F(0)), (F(100), F(1, 2)), (F(100), F(1)), (F(100), F(3, 2)), (F(10**6), F(1, 10)), (F(1, 10), F(7, 10)), (F(2500), F(2)), (F(314), F(1, 20))]:
    make('zeta', [wn, z])
# 4. general control equations, including right-half-plane and zero roots
for a_, b_, c_ in [(1, 2, 5), (1, -2, 5), (1, 0, 4), (1, 0, -4), (1, 3, 0), (1, -3, 0), (1, 0, 0), (-1, -2, -5), (-1, 2, 5), (2, 4, 2), (1, 5, 6), (1, -5, 6), (3, 6, 10), (4, 0, 16), (1, 1, 1)]:
    make('control', [F(a_), F(b_), F(c_)], plain=True)
# 5. random sweeps
def rnd_si():
    return F(str(random.choice([1, 2, 2.2, 3.3, 4.7, 5.6, 6.8, 8.2, 10, 15, 22, 33, 47, 68, 82, 100, 150, 220, 330, 470])))
for _ in range(70):
    R_ = rnd_si() * F(10) ** random.choice([-2, -1, 0, 1, 2, 3, 4, 5, 6]); L_ = rnd_si() * F(10) ** random.choice([-9, -6, -3, -3, 0]); C_ = rnd_si() * F(10) ** random.choice([-12, -9, -9, -6, -6, -3])
    make('series', [R_, L_, C_])
for _ in range(60):
    R_ = rnd_si() * F(10) ** random.choice([0, 1, 2, 3, 4, 5, 6]); L_ = rnd_si() * F(10) ** random.choice([-9, -6, -3, 0]); C_ = rnd_si() * F(10) ** random.choice([-12, -9, -6, -3])
    make('parallel', [R_, L_, C_])
for _ in range(40):
    make('mech', [rnd_si() * F(10) ** random.choice([-1, 0, 1, 2]), rnd_si() * F(10) ** random.choice([-2, -1, 0, 1, 2]) * random.choice([0, 1, 1, 1]), rnd_si() * F(10) ** random.choice([0, 1, 2, 3, 4])])
for _ in range(30):
    make('zeta', [rnd_si() * F(10) ** random.choice([-1, 0, 1, 2, 3, 4]), F(str(random.choice([0, 0.05, 0.1, 0.25, 0.5, 0.707, 0.9, 1, 1.1, 2, 5, 10])))])
for _ in range(50):
    a_ = F(random.choice([1, 1, 2, 3, 5, -1, -2, F(1, 2), F(3, 4)])); b_ = F(random.choice([0, 1, -1, 2, -3, 4, 6, 7, -8, F(1, 4), F(5, 2)])); c_ = F(random.choice([0, 1, -1, 2, 3, 4, -5, 9, 10, 25, F(3, 8)]))
    make('control', [a_, b_, c_], plain=True)
json.dump({'rows': rows}, open(os.path.join(os.path.dirname(__file__), 'quad_eng_vectors.json'), 'w'), separators=(',', ':'))
print(len(rows), 'cases written')
