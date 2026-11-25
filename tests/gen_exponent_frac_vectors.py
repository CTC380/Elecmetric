#!/usr/bin/env python3
"""Independent reference vectors for tools/exponent_frac_engine.js (Exponent Calculator, Mode 02: Negative & Fractional Exponents).
Written to tests/exponent_frac_vectors.json. Run: python3 tests/gen_exponent_frac_vectors.py   (needs sympy and mpmath)
Independent of the engine: primes come from sympy.factorint; for each prime the exponent k*p/q is kept as a Python Fraction, split into its floor and its
fractional part, and the fractional parts are brought to a common denominator with the least common multiple (the engine divides the index by a common factor
instead, so the two routes are different). Every vector is then CHECKED here: coefficient * radicand^(1/index) equals |a|^(p/q) to 70 digits (mpmath), the radicand has
no prime with exponent >= the index, and the index and the radicand's exponents have no common factor (which makes the form unique). The seeded generator makes the file reproducible."""
import json, random, math
from fractions import Fraction
from sympy import factorint
import mpmath
mpmath.mp.dps = 90
random.seed(20261123)

def lcm(a, b): return a * b // math.gcd(a, b)

def expected(a, e):
    """a: positive Fraction, e: Fraction. Returns dict(coef=(N,D), R, idx) in simplified radical form (R == 1 means the root is exact)."""
    fn, fd = factorint(a.numerator), factorint(a.denominator)
    primes = {}
    for p, k in fn.items(): primes[p] = primes.get(p, 0) + k
    for p, k in fd.items(): primes[p] = primes.get(p, 0) - k
    coef = Fraction(1); parts = []
    for p, k in primes.items():
        x = Fraction(k) * e; w = math.floor(x); f = x - w
        coef *= Fraction(p) ** w
        if f: parts.append((p, f))
    idx = 1
    for p, f in parts: idx = lcm(idx, f.denominator)
    R = 1
    for p, f in parts: R *= p ** int(f * idx)
    return coef, R, idx

def check(a, e, coef, R, idx):
    lhs = mpmath.mpf(coef.numerator) / coef.denominator * mpmath.root(mpmath.mpf(R), idx)
    rhs = (mpmath.mpf(a.numerator) / a.denominator) ** (mpmath.mpf(e.numerator) / e.denominator)
    assert abs(lhs - rhs) <= mpmath.mpf(10) ** -70 * max(1, abs(rhs)), (a, e)
    if R > 1:
        fr = factorint(R); assert all(k < idx for k in fr.values()), (a, e, R, idx)
        g = idx
        for k in fr.values(): g = math.gcd(g, k)
        assert g == 1, (a, e, R, idx)

def frac_text(f): return str(f.numerator) if f.denominator == 1 else '%d/%d' % (f.numerator, f.denominator)

cases = []
def add(atext, ntext, a, e):
    neg = a < 0
    if neg and e.denominator % 2 == 0:
        cases.append({'a': atext, 'n': ntext, 'out': {'kind': 'error', 'code': 'NOT_REAL'}}); return
    sign = -1 if (neg and e.numerator % 2 != 0) else 1
    coef, R, idx = expected(abs(a), e)
    check(abs(a), e, coef, R, idx)
    mag = mpmath.mpf(abs(a).numerator) / abs(a).denominator
    lg = (mpmath.mpf(e.numerator) / e.denominator) * mpmath.log10(mag)
    out = {'sign': sign, 'coefN': str(coef.numerator), 'coefD': str(coef.denominator), 'R': str(R), 'idx': idx, 'log10': mpmath.nstr(lg, 30),
           'kind': 'exact' if R == 1 else 'radical'}
    cases.append({'a': atext, 'n': ntext, 'out': out})

# fixed cases first (the CEO brief and the textbook ones)
fixed = [('27', '2/3'), ('8', '2/3'), ('16', '3/4'), ('12', '1/2'), ('2', '-3/2'), ('2', '2/3'), ('2/3', '1/2'), ('8', '-2/3'), ('-8', '2/3'), ('-8', '1/3'), ('-2', '1/3'),
         ('72', '5/4'), ('4', '6/9'), ('0.25', '-3/2'), ('2', '7/3'), ('16', '6/4'), ('10', '-1/2'), ('-8', '1/2'), ('5', '0.75'), ('1/8', '-1/3'), ('1/4', '-1/2'),
         ('50', '1/2'), ('18', '3/2'), ('32', '1/5'), ('32', '-2/5'), ('100', '3/2'), ('1000', '2/3'), ('0.001', '-2/3'), ('-32', '3/5'), ('-27', '-2/3'), ('2', '1.5'), ('9', '-0.5'), ('1', '1/3'), ('-1', '1/3'), ('-1', '2/3')]
def parse(t):
    from decimal import Decimal
    t = t.strip()
    if '/' in t:
        x, y = t.split('/'); return parse(x) / parse(y)
    return Fraction(Decimal(t))
for at, nt in fixed: add(at, nt, parse(at), parse(nt))

# random integers, fractions, decimals
for _ in range(240):
    a = random.randint(2, 3000); q = random.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]); p = random.choice([-1, 1]) * random.randint(1, 15)
    add(str(a), '%d/%d' % (p, q), Fraction(a), Fraction(p, q))
for _ in range(120):
    n, d = random.randint(1, 60), random.randint(2, 60)
    if math.gcd(n, d) != 1: continue
    q = random.choice([2, 3, 4, 5, 6]); p = random.choice([-1, 1]) * random.randint(1, 9)
    add('%d/%d' % (n, d), '%d/%d' % (p, q), Fraction(n, d), Fraction(p, q))
for _ in range(60):
    a = Fraction(random.randint(1, 999), random.choice([10, 100, 1000])); q = random.choice([2, 4, 5]); p = random.choice([-1, 1]) * random.randint(1, 7)
    add(str(float(a)) if a.denominator in (1, 2, 4, 5, 8, 10, 20, 25, 50, 100, 125, 200, 250, 500, 1000) and float(a) == a else frac_text(a), '%d/%d' % (p, q), a, Fraction(p, q))
for _ in range(60):  # negative bases: odd denominators are real, even are refused
    a = -random.randint(2, 500); q = random.choice([2, 3, 4, 5, 6, 7, 9]); p = random.choice([-1, 1]) * random.randint(1, 11)
    add(str(a), '%d/%d' % (p, q), Fraction(a), Fraction(p, q))
for _ in range(40):  # perfect powers, so exact roots are well covered
    q = random.choice([2, 3, 4, 5]); b = random.randint(2, 12); p = random.choice([-1, 1]) * random.randint(1, 8)
    add(str(b ** q), '%d/%d' % (p, q), Fraction(b ** q), Fraction(p, q))
    add('%d/%d' % (b ** q, (b + 1) ** q), '%d/%d' % (p, q), Fraction(b ** q, (b + 1) ** q), Fraction(p, q))

tally = {}
for c in cases: tally[c['out']['kind']] = tally.get(c['out']['kind'], 0) + 1
json.dump(cases, open('tests/exponent_frac_vectors.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(cases), 'vectors', tally)
