#!/usr/bin/env python3
"""Independent vectors for tools/pe_engine.js (Elecmetric Percent Error Calculator, Mode 01, Absolute Percent Error). Writes tests/pe_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  observed O, reference R:  signed error e = O - R;  absolute error |e|;  relative error magnitude |e| / |R|;  percentage error |e| / |R| * 100  (R = 0 refused)
  direction: above when e > 0, below when e < 0, equal when e = 0
Display: ROUND_HALF_UP on a Decimal with 3000 digits. Percentage 'auto' = exact decimal when it terminates, otherwise 6 places (not exact).
The error and the absolute error are exact decimals when they terminate (up to 40 places), otherwise the exact fraction n/d.
The relative error magnitude is an exact decimal when it terminates (up to 40 places), otherwise 8 places flagged approximate.
Each row: [observed, reference, places, num, den, text, exact, dir, signed, abs, rel]."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
RND = random.Random(20261124)

def terms(d):
    a = b = 0
    while d % 2 == 0: d //= 2; a += 1
    while d % 5 == 0: d //= 5; b += 1
    return max(a, b) if d == 1 else -1

def q(fr, places):
    dec = Decimal(fr.numerator) / Decimal(fr.denominator)
    qq = dec.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    s = format(qq, 'f')
    z = '0' if places == 0 else '0.' + '0' * places
    return z if s == '-' + z else s

def exactdec(fr):
    k = terms(fr.denominator)
    s = q(fr, k)
    if '.' in s: s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def dv(fr):
    k = terms(fr.denominator)
    if 0 <= k <= 40: return exactdec(fr)
    return '%d/%d' % (fr.numerator, fr.denominator)

def pct_text(fr, places):
    if places == 'auto':
        if terms(fr.denominator) >= 0: return exactdec(fr), True
        return q(fr, 6), False
    return q(fr, places), (fr * 10 ** places).denominator == 1

def rel_text(fr):
    k = terms(fr.denominator)
    if 0 <= k <= 40: return exactdec(fr)
    return '\u2248 ' + q(fr, 8)

def row(o, r, places='auto'):
    O, R = Fraction(Decimal(o)), Fraction(Decimal(r))
    e = O - R; ae = abs(e); rel = ae / abs(R); pct = rel * 100
    text, exact = pct_text(pct, places)
    d = 'equal' if e == 0 else ('above' if e > 0 else 'below')
    return [o, r, places, str(pct.numerator), str(pct.denominator), text, exact, d, dv(e), dv(ae), rel_text(rel)]

def dec(maxint, maxfrac):
    s = str(RND.randint(0, maxint))
    f = RND.randint(0, maxfrac)
    if f: s += '.' + ''.join(str(RND.randint(0, 9)) for _ in range(f))
    return ('-' if RND.random() < 0.15 else '') + s

fixed = [('225', '230'), ('235', '230'), ('100', '100'), ('7', '9'), ('56.891', '62.327'), ('9.8', '10'), ('-9', '-10'), ('229', '230'), ('231', '230'), ('228', '230'), ('232', '230'),
         ('0', '50'), ('500', '5'), ('-5', '5'), ('5', '-5'), ('0.001', '0.002'), ('1', '3'), ('2', '3'), ('1234.5678', '1234.5'), ('98.5', '100'), ('1012', '1000'), ('9.87', '10'),
         ('480', '500'), ('5.10', '4.80'), ('1' * 60, '2' * 60), ('0.0000001', '0.0000002'), ('-9', '10'), ('1e0'.replace('e0', ''), '8')]
calc = []
for o, r in fixed:
    for p in ('auto', 0, 2, 6):
        if Fraction(Decimal(r)) != 0: calc.append(row(o, r, p))
while len(calc) < 420:
    r = dec(RND.choice([9, 99, 999, 100000]), RND.choice([0, 1, 3, 6]))
    if Fraction(Decimal(r)) == 0: continue
    o = dec(RND.choice([9, 99, 999, 100000]), RND.choice([0, 1, 3, 6]))
    calc.append(row(o, r, RND.choice(['auto', 'auto', 0, 1, 2, 3, 4, 8, 10])))
# values that sit on a rounding edge: x.xx5 percentages
for r, o in [('200', '201'), ('400', '401'), ('1000', '1000.5'), ('8', '8.01'), ('80', '80.01'), ('16', '17')]:
    for p in (0, 1, 2, 3): calc.append(row(o, r, p))
refused = [['5', '0'], ['0', '0'], ['-3', '0'], ['5', '0.000'], ['5', '-0'], ['5', '0.0']]
bad = [['abc', '5'], ['5', 'abc'], ['1e3', '5'], ['5', '1e3'], ['--5', '5'], ['5', '1.2.3'], ['5', '1,5,5'], ['1' * 401, '5'], ['5', '1' * 401]]
empty = [['', ''], ['5', ''], ['', '5'], ['  ', '  ']]
json.dump({'calc': calc, 'zero': refused, 'bad': bad, 'empty': empty}, open('tests/pe_vectors.json', 'w'), ensure_ascii=False)
print(len(calc), 'calc rows,', len(refused), 'zero,', len(bad), 'bad,', len(empty), 'empty')
