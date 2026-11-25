"""Independent vectors for the Quadratic Formula Calculator, Mode 03 (tools/quad_graph_engine.js).
Expected values come from sympy and mpmath (exact Rational arithmetic, sp.solve, sp.Poly), never from the engine.
rows: [a, b, c, {vx, vy, fx, fy, directrix, latus, mirrorx, xints[30-digit strings], values[[x, y]], probes[[dx, x, y]]}]
  vertex: solve f'(x) = 0, then substitute.   focus and directrix: solve (x-h)^2 + (f-q)^2 = (f-d)^2 for all x (coefficients of x in sp.Poly), so the focus comes from the definition and not from a formula.
  mirrorx: the other solution of f(x) = f(0).   values: f at the integers h_near-3 .. h_near+3, h_near = floor(h + 1/2).   probes: f at h + dx for dx in -5/2, 1/2, 4 (for the drawn curve).
evalat rows: [a, b, c, x, y]  with y = a x^2 + b x + c exact.
Run: python3 tests/gen_quad_graph_vectors.py  -> tests/quad_graph_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 60
R = random.Random(20261125)
x, q, d = sp.symbols('x q d')

def val(t):
    t = t.replace('−', '-').strip()
    if ' ' in t:  # mixed number: the sign applies to the whole value
        w, fr_ = t.split(); ng = w.startswith('-'); v = abs(Fr(w)) + Fr(fr_); return -v if ng else v
    if '/' in t:
        a, b = t.split('/'); return Fr(a) / Fr(b)
    return Fr(t)
def sr(z): return sp.Rational(z.numerator, z.denominator)
def rt(e):
    e = sp.Rational(e); return str(e.p) if e.q == 1 else '%d/%d' % (e.p, e.q)
def s30(e): return mp.nstr(mp.mpf(str(sp.N(e, 60))), 30)

def row(a, b, c):
    A, B, C = sr(val(a)), sr(val(b)), sr(val(c))
    f = A * x**2 + B * x + C
    h = sp.solve(sp.diff(f, x), x)[0]
    k = sp.simplify(f.subs(x, h))
    eq = sp.expand((x - h)**2 + (f - q)**2 - (f - d)**2)
    co = sp.Poly(eq, x).all_coeffs()
    sol = sp.solve([cc for cc in co if cc != 0], [q, d], dict=True)[0]
    fy, dy = sol[q], sol[d]
    other = [s for s in sp.solve(sp.Eq(f, C), x) if s != 0]
    mx = other[0] if other else sp.Integer(0)
    D = B * B - 4 * A * C
    xi = sorted(s30(s) for s in sp.solve(f, x) if sp.im(sp.N(s, 40)) == 0) if D >= 0 else []
    xi = sorted(set(xi), key=lambda t: float(t)) if D >= 0 else []
    if D == 0: xi = [s30(h)]
    near = int(sp.floor(h + sp.Rational(1, 2)))
    vals = [[str(near + j), rt(f.subs(x, near + j))] for j in range(-3, 4)]
    probes = [[str(dx), rt(h + sp.Rational(dx)), rt(f.subs(x, h + sp.Rational(dx)))] for dx in ('-5/2', '1/2', '4')]
    return [a, b, c, {'vx': rt(h), 'vy': rt(k), 'fy': rt(fy), 'directrix': rt(dy), 'latus': rt(1 / abs(A)), 'mirrorx': rt(mx), 'xints': xi, 'values': vals, 'probes': probes}]

def fmt(z):
    z = Fr(z)
    if z.denominator == 1: return str(z.numerator)
    t = z.denominator
    for p in (2, 5):
        while t % p == 0: t //= p
    if t == 1 and R.random() < 0.5:
        return str(sp.Rational(z.numerator, z.denominator).evalf(30)).rstrip('0').rstrip('.')
    return '%d/%d' % (z.numerator, z.denominator)

fixed = [('2', '3', '-5'), ('1', '-5', '6'), ('1', '-4', '4'), ('1', '2', '5'), ('1', '-2', '-1'), ('3', '0', '-12'), ('1', '0', '1'), ('0.1', '0.2', '0.1'), ('3/4', '1/2', '-2'),
         ('-1', '4', '0'), ('-3/4', '1/2', '7'), ('1', '0', '0'), ('-2', '0', '0'), ('5', '10', '0'), ('1', '1', '1'), ('1', '-2000000000', '1000000000000000001'),
         ('1', '-2000000000', '1000000000000000000'), ('1e-6', '1e-3', '1'), ('1000000', '-3', '0.0001'), ('-0.5', '-1', '-0.5'), ('2 1/2', '-1 3/4', '1/3'), ('7', '-7', '7'), ('-1', '0', '9')]
rows = [row(*t) for t in fixed]
for _ in range(220):
    n = R.choice([1, 1, 2, 3, 5, 8, 12, 50, 1000])
    A = Fr(R.choice([-1, 1]) * R.randint(1, n), R.choice([1, 1, 2, 3, 4, 7, 10]))
    B = Fr(R.randint(-60, 60), R.choice([1, 1, 2, 3, 5, 8]))
    C = Fr(R.randint(-60, 60), R.choice([1, 1, 2, 4, 6, 9]))
    if R.random() < 0.12: B = Fr(0)
    if R.random() < 0.10: C = Fr(0)
    if R.random() < 0.1:  # repeated root: C = B^2 / 4A
        C = B * B / (4 * A)
    if R.random() < 0.06:  # large coefficients
        A *= 10 ** R.randint(3, 12); B *= 10 ** R.randint(3, 12); C *= 10 ** R.randint(3, 12)
    if R.random() < 0.06:  # small coefficients
        A /= 10 ** R.randint(3, 9); B /= 10 ** R.randint(2, 9)
    rows.append(row(fmt(A), fmt(B), fmt(C)))

ev = []
for _ in range(120):
    A = Fr(R.randint(-9, 9), R.choice([1, 2, 3])) or Fr(1); B = Fr(R.randint(-9, 9), R.choice([1, 2, 5])); C = Fr(R.randint(-9, 9), R.choice([1, 4]))
    X = Fr(R.randint(-40, 40), R.choice([1, 2, 3, 8, 10]))
    y = sr(A) * sr(X)**2 + sr(B) * sr(X) + sr(C)
    ev.append([fmt(A), fmt(B), fmt(C), fmt(X), rt(y)])
json.dump({'rows': rows, 'evalat': ev}, open('tests/quad_graph_vectors.json', 'w'), ensure_ascii=False)
print(len(rows), 'rows,', len(ev), 'evalat rows')
