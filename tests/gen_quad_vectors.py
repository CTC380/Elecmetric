"""Independent vectors for the Quadratic Formula Calculator, Mode 01 (tools/quad_engine.js).
Expected values come from sympy (exact Rational arithmetic) and mpmath (40-digit roots), never from the engine.
Each row: [A text, B text, C text, kind, discriminant, [[re, im], ...] roots as 30-digit strings, vertex x, vertex y, sum, product]
kind: rational | irrational | repeated | complex | linear | none | indeterminate
Run: python3 tests/gen_quad_vectors.py  -> tests/quad_vectors.json"""
import json, random
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 40
R = random.Random(20261123)

def val(t):
    t = t.replace('\u2212', '-')
    if '/' in t:
        a, b = t.split('/'); return Fr(a) / Fr(b)
    return Fr(t)

def rat_str(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def row(a, b, c):
    A, B, C = val(a), val(b), val(c)
    if A == 0 and B == 0:
        return [a, b, c, 'indeterminate' if C == 0 else 'none', None, [], None, None, None, None]
    if A == 0:
        x = -C / B
        return [a, b, c, 'linear', None, [[mp.nstr(mp.mpf(x.numerator) / x.denominator, 30), '0']], None, None, None, None]
    D = B * B - 4 * A * C
    sA, sB, sC = [sp.Rational(x.numerator, x.denominator) for x in (A, B, C)]
    xs = sp.symbols('x')
    rts = sp.roots(sp.Poly(sA * xs**2 + sB * xs + sC, xs), multiple=True) if D != 0 else [(-sB) / (2 * sA)]
    if D > 0:
        pn = sp.sqrt(sp.Rational(D.numerator, D.denominator))
        kind = 'rational' if pn.is_Rational else 'irrational'
    elif D == 0: kind = 'repeated'
    else: kind = 'complex'
    sD = sp.Rational(D.numerator, D.denominator)
    out = []
    for r in rts:
        z = sp.N(r, 40); out.append([mp.nstr(mp.mpf(str(sp.re(z))), 30), mp.nstr(mp.mpf(str(sp.im(z))), 30)])
    if kind == 'complex': out.sort(key=lambda t: -float(t[1]))
    else: out.sort(key=lambda t: float(t[0]))
    vx = -B / (2 * A); vy = C - B * B / (4 * A)
    return [a, b, c, kind, rat_str(D), out, rat_str(vx), rat_str(vy), rat_str(-B / A), rat_str(C / A)]

cases = []
note = [('1', '-5', '6'), ('1', '-4', '4'), ('1', '2', '5'), ('2', '3', '-5'), ('1', '-2', '-1'), ('3', '0', '-12'), ('1', '0', '1'), ('0', '2', '-4'), ('0', '0', '5'), ('0', '0', '0')]
cases += note
for _ in range(170): cases.append(tuple(str(R.randint(-30, 30)) for _ in range(3)))
for _ in range(60):   # fractions
    t = []
    for _ in range(3):
        n = R.randint(-20, 20); d = R.randint(1, 12); t.append('%d/%d' % (n, d) if R.random() < .8 else str(n))
    cases.append(tuple(t))
for _ in range(60):   # decimals
    cases.append(tuple(('%.' + str(R.randint(1, 4)) + 'f') % R.uniform(-20, 20) for _ in range(3)))
for _ in range(40):   # planted rational roots: A(x - p)(x - q)
    p = Fr(R.randint(-15, 15), R.randint(1, 8)); q = Fr(R.randint(-15, 15), R.randint(1, 8)); A = Fr(R.randint(1, 9) * R.choice([1, -1]), R.randint(1, 4))
    cases.append(tuple(rat_str(x) for x in (A, -A * (p + q), A * p * q)))
for _ in range(20):   # repeated
    p = Fr(R.randint(-12, 12), R.randint(1, 6)); A = Fr(R.randint(1, 7) * R.choice([1, -1]), R.randint(1, 3))
    cases.append(tuple(rat_str(x) for x in (A, -2 * A * p, A * p * p)))
for _ in range(20):   # near-repeated: D = +/- 1 over a large scale
    n = R.randint(10**6, 10**9); cases.append((str(1), str(-2 * n), str(n * n - R.choice([1, -1, 3]))))
for _ in range(14):   # large and small magnitudes
    cases.append((str(R.randint(1, 9)) + 'e' + str(R.choice([-12, -6, 6, 12, 20])), str(R.randint(-9, 9)), str(R.randint(1, 9)) + 'e' + str(R.choice([-12, -6, 6, 12]))))
for _ in range(12):   # A = 0 and the degenerate cases
    cases.append(('0', str(R.randint(-9, 9) or 1), str(R.randint(-9, 9))))
cases += [('0', '0', '-3/4'), ('0', '0.0', '0'), ('0', '3/4', '1/2'), ('1/3', '1/2', '1/6'), ('1e20', '1', '1e-20'), ('-1', '2', '-1')]
seen = set(); rows = []
for c in cases:
    if c in seen: continue
    seen.add(c)
    try: rows.append(row(*c))
    except Exception as e: print('skip', c, e)
err = ['', ' ', 'abc', '1/0', '1//2', '1.2.3', '--1', '1e', '1 2', '3/', '/4', '1,5x', '\u221a2', '0x10', 'NaN', 'Infinity', '1e999', '9' * 70]
json.dump({'ok': rows, 'err': err}, open('tests/quad_vectors.json', 'w'), indent=0)
print(len(rows), 'rows;', {k: sum(1 for r in rows if r[3] == k) for k in set(r[3] for r in rows)})
