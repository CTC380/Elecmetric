#!/usr/bin/env python3
"""Independent reference vectors for tools/exponent_solver_engine.js (Exponent Calculator, Mode 03: Missing Value Solver, a^n = y).
Written to tests/exponent_solver_vectors.json. Run: python3 tests/gen_exponent_solver_vectors.py   (needs sympy and mpmath)

Independent of the engine, which finds an exact exponent by continued fractions and a whole-number test a^p = y^q:
  * SOLVE FOR n: a and y are both factored into primes (sympy.factorrat). a^n = y holds for a positive base exactly when every prime's exponent in y is n times its
    exponent in a, so n is the ratio of exponents, and it must be the SAME ratio for every prime (and a prime missing from a must be missing from y). That gives
    the exact rational n or proves there is none. Otherwise n = ln y / ln a, taken at 90 digits (mpmath). A negative base is judged by brute force: the candidate
    n = p/q is put back into the real power  sign(a)^p |a|^(p/q)  (defined only for q odd) and accepted only if it equals y.
  * SOLVE FOR a: both signs +-|y|^(q/p) are tried, each is put through the real power of a base (defined for a < 0 only when q is odd, with the sign (-1)^p) and kept
    only if the result equals y at 70 digits. The count of survivors is the number of real solutions; no parity rule is used to decide it.
  * SOLVE FOR y: a^n by the same real-power rule at 90 digits.
The seeded generator makes the file reproducible."""
import json, random, math
from fractions import Fraction
from sympy import factorrat, Rational
import mpmath
mpmath.mp.dps = 90
random.seed(20261124)
TOL = mpmath.mpf(10) ** -60

def ftext(f):
    return str(f.numerator) if f.denominator == 1 else '%d/%d' % (f.numerator, f.denominator)

def mp(f): return mpmath.mpf(f.numerator) / f.denominator

def real_power(a, n):
    """real value of a^n for rational a and n, or None when it is not a real number / undefined"""
    if a == 0:
        return mpmath.mpf(0) if n > 0 else None
    if a > 0:
        return mp(a) ** mp(n)
    if n.denominator % 2 == 0:
        return None
    mag = mp(-a) ** mp(n)
    return -mag if n.numerator % 2 else mag

def exponent_from_primes(a, y):
    """a, y positive Fractions. Returns Fraction n with a^n = y, or None"""
    fa = {p: k for p, k in factorrat(Rational(a.numerator, a.denominator)).items()}
    fy = {p: k for p, k in factorrat(Rational(y.numerator, y.denominator)).items()}
    n = None
    for p in set(fa) | set(fy):
        ea, ey = fa.get(p, 0), fy.get(p, 0)
        if ea == 0:
            if ey != 0: return None
            continue
        r = Fraction(ey, ea)
        if n is None: n = r
        elif n != r: return None
    return n if n is not None else None

def rnd_pos():
    kind = random.random()
    if kind < 0.45: return Fraction(random.randint(2, 40))
    if kind < 0.75: return Fraction(random.randint(1, 30), random.randint(2, 12))
    return Fraction(random.randint(1, 999), random.choice([1, 10, 100, 1000]))

V = []

# ---- solve for n, exact exponents built from a root: a = (u/v)^q, y = (u/v)^p, n = p/q ----
for _ in range(110):
    u, v = random.randint(1, 9), random.randint(1, 9)
    r = Fraction(u, v)
    if r == 1: continue
    q = random.choice([1, 1, 2, 3, 4, 5, 6]); p = random.choice([x for x in range(-9, 10) if x != 0])
    a = r ** q; y = r ** p; n = Fraction(p, q)
    if len(str(a.numerator)) + len(str(a.denominator)) > 30 or abs(y.numerator) > 10 ** 25 or y.denominator > 10 ** 25: continue
    assert exponent_from_primes(a, y) == n, (a, y, n)
    V.append({'solve': 'n', 'a': ftext(a), 'y': ftext(y), 'out': {'cls': 'unique', 'exact': True, 'n': ftext(n), 'nlog': str(mpmath.mpf(n.numerator) / n.denominator)}})

# ---- solve for n, random pairs: exact when the prime exponents agree, otherwise ln y / ln a ----
count = {'exact': 0, 'approx': 0}
while count['approx'] < 70 or count['exact'] < 20:
    a, y = rnd_pos(), rnd_pos()
    if a == 1: continue
    n = exponent_from_primes(a, y)
    if n is not None and n.denominator <= 1000 and abs(n.numerator) <= 4000:
        if count['exact'] >= 30: continue
        V.append({'solve': 'n', 'a': ftext(a), 'y': ftext(y), 'out': {'cls': 'unique', 'exact': True, 'n': ftext(n), 'nlog': str(mpmath.mpf(n.numerator) / n.denominator)}}); count['exact'] += 1
    elif n is None:
        if count['approx'] >= 80: continue
        nn = mpmath.log(mp(y)) / mpmath.log(mp(a))
        V.append({'solve': 'n', 'a': ftext(a), 'y': ftext(y), 'out': {'cls': 'unique', 'exact': False, 'n': None, 'nlog': mpmath.nstr(nn, 40)}}); count['approx'] += 1

# ---- solve for n, negative bases (brute-force real power) ----
for _ in range(60):
    u = random.randint(2, 9); q = random.choice([1, 3, 5]); p = random.choice([x for x in range(-7, 8) if x != 0])
    a = -Fraction(u) ** q; n = Fraction(p, q)
    val = real_power(a, n)
    if val is None: continue
    y = Fraction(u) ** p * (-1 if p % 2 else 1)          # (-u^q)^(p/q) = (-1)^p u^p for q odd
    assert abs(mp(y) - val) <= TOL * max(1, abs(val)), (a, n, y, val)
    V.append({'solve': 'n', 'a': ftext(a), 'y': ftext(y), 'out': {'cls': 'unique', 'exact': True, 'n': ftext(n), 'nlog': str(mpmath.mpf(n.numerator) / n.denominator)}})
    wrong = -y                                           # the same size with the wrong sign has no real exponent
    V.append({'solve': 'n', 'a': ftext(a), 'y': ftext(wrong), 'out': {'cls': 'none'}})
# a negative base with an even-denominator exponent: (-4)^n = 2 would need n = 1/2
V += [{'solve': 'n', 'a': '-4', 'y': '2', 'out': {'cls': 'none'}}, {'solve': 'n', 'a': '-9', 'y': '3', 'out': {'cls': 'none'}}, {'solve': 'n', 'a': '-2', 'y': '10', 'out': {'cls': 'none'}}]

# ---- solve for n, domain classes ----
for a, y, cls in [('2', '-8', 'none'), ('2', '0', 'none'), ('1/3', '-1', 'none'), ('5', '-0.5', 'none'), ('0', '0', 'indeterminate'), ('0', '5', 'none'), ('1', '1', 'indeterminate'), ('1', '7', 'none'), ('1', '0', 'none'),
                  ('-1', '1', 'indeterminate'), ('-1', '-1', 'indeterminate'), ('-1', '3', 'none'), ('-3', '0', 'none'), ('e', '-2', 'none')]:
    V.append({'solve': 'n', 'a': a, 'y': y, 'out': {'cls': cls}})
for a in ['2', '7', '1/3', '0.5', '123']:
    V.append({'solve': 'n', 'a': a, 'y': '1', 'out': {'cls': 'unique', 'exact': True, 'n': '0', 'nlog': '0'}})
for y, fy in [('10', Fraction(10)), ('2', Fraction(2)), ('0.5', Fraction(1, 2)), ('100', Fraction(100)), ('1e-3', Fraction(1, 1000))]:
    V.append({'solve': 'n', 'a': 'e', 'y': y, 'out': {'cls': 'unique', 'exact': False, 'n': None, 'nlog': mpmath.nstr(mpmath.log(mp(fy)), 40)}})

# ---- solve for a: every n = p/q (reduced), y of either sign ----
def solve_a(n, y):
    if n == 0: return ('indeterminate', []) if y == 1 else ('none', [])
    if y == 0: return ('unique', [Fraction(0)]) if n > 0 else ('none', [])
    p, q = n.numerator, n.denominator
    mag = mpmath.mpf(abs(y.numerator)) / abs(y.denominator)
    a0 = mag ** (mpmath.mpf(q) / p)
    sols = []
    for s in (1, -1):
        a = s * a0
        # put the candidate back through the real power rule of a base
        if a < 0 and q % 2 == 0: continue
        val = (abs(a) ** (mpmath.mpf(p) / q)) * (-1 if (a < 0 and p % 2) else 1)
        if abs(val - mp(y)) <= TOL * max(1, abs(mp(y))): sols.append(a)
    return ('unique' if len(sols) == 1 else 'multiple' if len(sols) > 1 else 'none'), sols

def add_a(n, y):
    cls, sols = solve_a(n, y)
    out = {'cls': cls}
    if sols: out['alog'] = [{'sign': 1 if s > 0 else (-1 if s < 0 else 0), 'log10': None if s == 0 else mpmath.nstr(mpmath.log10(abs(s)), 40)} for s in sols]
    V.append({'solve': 'a', 'n': ftext(n), 'y': ftext(y), 'out': out})

seen = set()
for p in range(-7, 8):
    for q in (1, 2, 3, 4, 5, 6):
        if p == 0 or math.gcd(abs(p), q) != 1: continue
        for y in (Fraction(1, 8), Fraction(16), Fraction(-27), Fraction(-1, 4), Fraction(12), Fraction(-5), Fraction(1000), Fraction(2, 3)):
            if (p, q, y) in seen: continue
            seen.add((p, q, y)); add_a(Fraction(p, q), y)
for _ in range(60):
    n = Fraction(random.choice([x for x in range(-9, 10) if x != 0]), random.choice([1, 1, 2, 3, 4, 5]))
    y = rnd_pos() * random.choice([1, -1])
    add_a(n, y)
for n, y in [(Fraction(0), Fraction(1)), (Fraction(0), Fraction(5)), (Fraction(3), Fraction(0)), (Fraction(-3), Fraction(0)), (Fraction(1, 2), Fraction(0)), (Fraction(1), Fraction(7)), (Fraction(-1), Fraction(1, 7)), (Fraction(2), Fraction(9)), (Fraction(2), Fraction(-9)),
             (Fraction(3), Fraction(125)), (Fraction(3), Fraction(-125)), (Fraction(1, 2), Fraction(3)), (Fraction(2, 3), Fraction(4))]:
    add_a(n, y)

# ---- solve for y ----
for _ in range(60):
    a = rnd_pos() * random.choice([1, 1, -1]); n = Fraction(random.randint(-8, 8), random.choice([1, 1, 2, 3, 5]))
    val = real_power(a, n)
    if a == 0 or val is None: continue
    out = {'cls': 'unique', 'sign': 1 if val > 0 else -1, 'log10': mpmath.nstr(mpmath.log10(abs(val)), 40)}
    V.append({'solve': 'y', 'a': ftext(a), 'n': ftext(n), 'out': out})
V += [{'solve': 'y', 'a': '0', 'n': '0', 'out': {'cls': 'indeterminate'}}, {'solve': 'y', 'a': '0', 'n': '-2', 'out': {'cls': 'none'}}, {'solve': 'y', 'a': '-4', 'n': '1/2', 'out': {'cls': 'none'}}, {'solve': 'y', 'a': '-4', 'n': '0.5', 'out': {'cls': 'none'}},
      {'solve': 'y', 'a': '0', 'n': '3', 'out': {'cls': 'unique', 'sign': 0, 'log10': None}}]

json.dump(V, open('tests/exponent_solver_vectors.json', 'w'), indent=0)
from collections import Counter
print(len(V), 'vectors', dict(Counter((v['solve'], v['out']['cls']) for v in V)))
