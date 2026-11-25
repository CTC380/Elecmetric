#!/usr/bin/env python3
"""Independent reference vectors for tools/exponent_engine.js (Exponent Calculator, Mode 01: Power Calculator).
Written to tests/exponent_vectors.json. Run: python3 tests/gen_exponent_vectors.py
Independent of the engine: exact cases use Python Fraction (arbitrary-precision integers, integer roots found by bisection, no floating point); non-exact cases use
Python decimal at 80 digits, from the exact rational base and exponent. The cases are fixed by a seeded generator, so the file is reproducible."""
import json, random, sys, math
sys.set_int_max_str_digits(0)
from fractions import Fraction
from decimal import Decimal, getcontext
getcontext().prec = 90
random.seed(20261122)

def parse(t):
    t = t.replace('−', '-').replace(',', '').strip().strip('()')
    if '/' in t:
        a, b = t.split('/'); return parse(a) / parse(b)
    return Fraction(Decimal(t))

def iroot(n, k):
    lo, hi = 0, 1
    while hi ** k <= n: hi *= 2
    while lo < hi - 1:
        mid = (lo + hi) // 2
        if mid ** k <= n: lo = mid
        else: hi = mid
    return lo

def dec(fr): return Decimal(fr.numerator) / Decimal(fr.denominator)

def ref(a, n):
    A, N = parse(a), parse(n)
    p, q = N.numerator, N.denominator
    if A == 0:
        if p == 0: return {'kind': 'error', 'code': 'ZERO_TO_ZERO'}
        if p < 0: return {'kind': 'error', 'code': 'ZERO_NEGATIVE'}
        return {'kind': 'exact', 'sign': 0, 'n': '0', 'd': '1'}
    if p == 0: return {'kind': 'exact', 'sign': 1, 'n': '1', 'd': '1'}
    if A < 0 and q % 2 == 0: return {'kind': 'error', 'code': 'NOT_REAL'}
    sign = -1 if (A < 0 and p % 2 != 0) else 1
    B = abs(A)
    if B == 1: return {'kind': 'exact', 'sign': sign, 'n': '1', 'd': '1'}
    est = abs(p) * math.log10(max(B.numerator, B.denominator)) if q == 1 else 0
    if q == 1 and est < 45000:
        r = B ** p if p > 0 else (1 / B) ** (-p)
        if len(str(max(r.numerator, r.denominator))) <= 49000:
            return {'kind': 'exact', 'sign': sign, 'n': str(r.numerator), 'd': str(r.denominator)}
    elif q != 1:
        rn, rd = iroot(B.numerator, q), iroot(B.denominator, q)
        if rn ** q == B.numerator and rd ** q == B.denominator:
            base = Fraction(rn, rd); r = base ** p if p > 0 else (1 / base) ** (-p)
            return {'kind': 'exact', 'sign': sign, 'n': str(r.numerator), 'd': str(r.denominator)}
    x = dec(N) * dec(B).log10()
    e10 = int(x.to_integral_value(rounding='ROUND_FLOOR'))
    m = Decimal(10) ** (x - e10)
    return {'kind': 'approx', 'sign': sign, 'mant': format(m, '.40f'), 'exp10': e10, 'x': format(x, '.30f')}

cases = []
def add(a, n, tag): cases.append({'a': a, 'n': n, 'tag': tag, 'out': ref(a, n)})

# the brief's cases
for a, n in [('2', '10'), ('2', '-3'), ('5', '-2'), ('8', '2/3'), ('27', '2/3'), ('16', '3/4'), ('-2', '3'), ('-2', '4'), ('-8', '1/3'), ('10', '-3'), ('2', '0'), ('4', '1/2'), ('8', '1/3'), ('(-8)', '2/3'), ('-4', '0.5'), ('0', '0'), ('0', '-2'), ('0', '3'), ('0', '1/2')]:
    add(a, n, 'brief')
# whole-number exponents on integer, decimal and fraction bases
for _ in range(220):
    a = random.choice([str(random.randint(-30, 30)), '%d.%d' % (random.randint(0, 20), random.randint(1, 99)), '-%d.%d' % (random.randint(0, 9), random.randint(1, 9)), '%d/%d' % (random.randint(-9, 9), random.randint(1, 12)), '%de%d' % (random.randint(1, 9), random.randint(-6, 6))])
    n = str(random.randint(-40, 80))
    add(a, n, 'integer')
for k in (100, 127, 200, 256, 500, 1000, 2000):
    add('2', str(k), 'big'); add('3', str(-k // 4), 'big'); add('-7', str(k + 1), 'big'); add('1.1', str(k // 5), 'big')
# perfect rational powers
for _ in range(160):
    r = random.randint(1, 12); q = random.choice([2, 3, 4, 5, 6]); p = random.randint(-7, 9)
    if random.random() < 0.3: rd = random.randint(2, 6); base = '%d/%d' % (r ** q, rd ** q)
    else: base = str(r ** q)
    if random.random() < 0.3 and q % 2 == 1: base = '-' + base.replace('-', '')
    add(base, '%d/%d' % (p, q), 'perfect')
    if q == 2: add(base, str(p / 2), 'perfect-decimal')
# non-exact rational exponents
for _ in range(220):
    a = random.choice([str(random.randint(2, 500)), '%d.%d' % (random.randint(0, 50), random.randint(1, 99)), '%d/%d' % (random.randint(1, 40), random.randint(2, 40))])
    n = random.choice(['%d/%d' % (random.randint(-9, 9), random.randint(2, 9)), '%.3f' % random.uniform(-6, 6), '%.1f' % random.uniform(-12, 12), '%d.5' % random.randint(-20, 20)])
    add(a, n, 'approx')
for _ in range(40):
    add('-' + str(random.randint(2, 99)), '%d/%d' % (random.randint(-9, 9) or 1, random.choice([3, 5, 7, 9])), 'neg-odd-root')
    add('-' + str(random.randint(2, 99)), '%d/%d' % (random.randint(-9, 9) or 1, random.choice([2, 4, 6])), 'neg-even-root')
# large and tiny results from logarithms
for a, n in [('2', '200000'), ('2', '1000000'), ('3', '-500000'), ('10', '-1000000'), ('1.0001', '1000000'), ('-5', '300001'), ('7', '123456'), ('0.5', '700000'), ('1.5', '90000000')]:
    add(a, n, 'huge')
for a, n in [('2', '1e9'), ('10', '300'), ('10', '-300'), ('1e-5', '60')]:
    add(a, n, 'range')
json.dump(cases, open('tests/exponent_vectors.json', 'w'))
print(len(cases), 'vectors')
