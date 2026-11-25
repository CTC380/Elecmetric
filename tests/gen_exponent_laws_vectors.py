#!/usr/bin/env python3
"""Independent reference vectors for tools/exponent_laws_engine.js (Exponent Calculator, Mode 04: Exponent Laws).
Written to tests/exponent_laws_vectors.json. Run: python3 tests/gen_exponent_laws_vectors.py   (needs mpmath)
Independent of the engine, which keeps exact fractions where it can and carries irrational values as a sign and a logarithm: here EVERY value is an mpmath number
at 90 digits and every power is taken through one real-power rule (a negative number to p/q is real only when q is odd, with the sign (-1)^p; 0^n is 0 for n > 0 and
undefined otherwise). Both sides of each rule are evaluated separately; a side with no real value is None; the status is 'undefined' if either side is None,
'holds' if the two sides agree to 40 digits and 'mismatch' otherwise (so the classic failures with negative bases are found by evaluation, not by a rule list).
The seeded generator makes the file reproducible."""
import json, random
from fractions import Fraction
import mpmath
mpmath.mp.dps = 90
random.seed(20261125)

def ft(f): return str(f.numerator) if f.denominator == 1 else '%d/%d' % (f.numerator, f.denominator)
def mp(f): return mpmath.mpf(f.numerator) / f.denominator

def rp(x, n):
    """x: mpf, n: Fraction -> real power or None"""
    if x == 0: return mpmath.mpf(0) if n > 0 else None
    if x > 0: return x ** mp(n)
    if n.denominator % 2 == 0: return None
    mag = (-x) ** mp(n)
    return -mag if n.numerator % 2 else mag

def mul(a, b): return None if a is None or b is None else a * b
def div(a, b): return None if a is None or b is None or b == 0 else a / b

def sides(rule, a, b, m, n):
    A, B = mp(a) if a is not None else None, mp(b) if b is not None else None
    if rule == 'product': return mul(rp(A, m), rp(A, n)), rp(A, m + n)
    if rule == 'quotient': return div(rp(A, m), rp(A, n)), rp(A, m - n)
    if rule == 'power':
        inner = rp(A, m)
        return (None if inner is None else rp(inner, n)), rp(A, m * n)
    if rule == 'prodbase': return rp(mp(a * b), n), mul(rp(A, n), rp(B, n))
    if rule == 'quotbase': return rp(mp(a / b), n), div(rp(A, n), rp(B, n))
    if rule == 'zero': return rp(A, Fraction(0)), mpmath.mpf(1)
    if rule == 'negative': return rp(A, -n), (None if rp(A, n) is None or rp(A, n) == 0 else 1 / rp(A, n))
    if rule == 'fraction':
        L = rp(A, Fraction(1, int(n)))
        return L, L

def enc(v):
    if v is None: return None
    if v == 0: return {'sign': 0, 'log10': None}
    return {'sign': 1 if v > 0 else -1, 'log10': mpmath.nstr(mpmath.log10(abs(v)), 40)}

def status(L, R):
    if L is None or R is None: return 'undefined'
    return 'holds' if abs(L - R) <= mpmath.mpf(10) ** -40 * max(1, abs(L), abs(R)) else 'mismatch'

def rb():
    k = random.random()
    if k < 0.45: return Fraction(random.randint(1, 12))
    if k < 0.7: return Fraction(random.randint(1, 9), random.randint(2, 6))
    if k < 0.9: return -Fraction(random.randint(1, 9), random.choice([1, 1, 2]))
    return Fraction(random.choice([0, 1, -1]))
def re_():
    k = random.random()
    if k < 0.5: return Fraction(random.randint(-6, 6))
    return Fraction(random.randint(-7, 7), random.choice([2, 3, 4, 5]))

V = []
def add(rule, **kw):
    a, b, m, n = kw.get('a'), kw.get('b'), kw.get('m'), kw.get('n')
    L, R = sides(rule, a, b, m, n)
    v = {'rule': rule, 'status': status(L, R), 'left': enc(L), 'right': enc(R)}
    for k in 'abmn':
        if kw.get(k) is not None: v[k] = ft(kw[k])
    V.append(v)

for rule in ['product', 'quotient', 'power']:
    for _ in range(130): add(rule, a=rb(), m=re_(), n=re_())
for rule in ['prodbase', 'quotbase']:
    for _ in range(130):
        b = rb()
        if rule == 'quotbase' and b == 0: continue
        add(rule, a=rb(), b=b, n=re_())
for _ in range(40): add('zero', a=rb())
for _ in range(60): add('negative', a=rb(), n=re_())
for _ in range(60): add('fraction', a=rb(), n=Fraction(random.randint(1, 9)))
# targeted: negative bases with even whole-number and odd-denominator exponents, then a fractional outer exponent (the power-of-a-power trap)
for _ in range(80):
    base = -Fraction(random.randint(1, 9), random.choice([1, 1, 2]))
    m = random.choice([Fraction(2), Fraction(4), Fraction(-2), Fraction(2, 3), Fraction(4, 3), Fraction(1, 3), Fraction(3), Fraction(5, 3), Fraction(6)])
    n = random.choice([Fraction(1, 2), Fraction(1, 3), Fraction(1, 4), Fraction(3, 2), Fraction(2, 3), Fraction(-1, 2), Fraction(3, 4), Fraction(5, 2), Fraction(2), Fraction(3)])
    add('power', a=base, m=m, n=n)
for _ in range(30):
    add('product', a=-Fraction(random.randint(1, 9)), m=random.choice([Fraction(1, 3), Fraction(2), Fraction(1, 2), Fraction(3), Fraction(2, 3)]), n=random.choice([Fraction(1, 3), Fraction(1, 2), Fraction(-1, 2), Fraction(3), Fraction(4)]))
    add('prodbase', a=-Fraction(random.randint(1, 9)), b=random.choice([Fraction(-2), Fraction(3), Fraction(-3), Fraction(1, 2)]), n=random.choice([Fraction(1, 3), Fraction(1, 2), Fraction(2, 3), Fraction(2), Fraction(-1)]))
# named cases
add('product', a=Fraction(2), m=Fraction(3), n=Fraction(4)); add('quotient', a=Fraction(5), m=Fraction(6), n=Fraction(2)); add('power', a=Fraction(3), m=Fraction(2), n=Fraction(3))
add('power', a=Fraction(-1), m=Fraction(2), n=Fraction(1, 2)); add('power', a=Fraction(-8), m=Fraction(1, 3), n=Fraction(2)); add('prodbase', a=Fraction(-2), b=Fraction(-3), n=Fraction(1, 2))
add('product', a=Fraction(-4), m=Fraction(1, 2), n=Fraction(1, 2)); add('zero', a=Fraction(0)); add('negative', a=Fraction(0), n=Fraction(3)); add('fraction', a=Fraction(-8), n=Fraction(2))
json.dump(V, open('tests/exponent_laws_vectors.json', 'w'), indent=0)
from collections import Counter
print(len(V), 'vectors', dict(Counter((v['rule'], v['status']) for v in V)))
