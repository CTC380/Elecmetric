#!/usr/bin/env python3
"""Independent vectors for tools/pe_signed_engine.js (Elecmetric Percent Error Calculator, Mode 02, Signed Error Analysis). Writes tests/pe_signed_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  observed O, reference R:  signed error e = O - R;  signed relative error e / |R|;  signed percentage deviation e / |R| * 100  (R = 0 refused)
  correction = R - O = -e;  direction: above when e > 0, below when e < 0, equal when e = 0
Display: ROUND_HALF_UP on the size, then the sign: '+' above, '-' below, none when the shown size is all zeros or the error is 0. Percentage 'auto' = exact decimal when it terminates, otherwise 6 places.
Signed error and correction are exact decimals with an explicit '+' when positive. The relative error is an exact decimal when it terminates (up to 40 places), otherwise 8 places flagged approximate.
Each row: [observed, reference, places, num, den, text, exact, dir, signed, abs, rel, pct, correction, frac]  (num/den: the size of the percentage, as in Mode 01; pct: the signed text without the % sign)."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
RND = random.Random(20261125)

def terms(d):
    a = b = 0
    while d % 2 == 0: d //= 2; a += 1
    while d % 5 == 0: d //= 5; b += 1
    return max(a, b) if d == 1 else -1

def q(fr, places):
    qq = (Decimal(fr.numerator) / Decimal(fr.denominator)).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    s = format(qq, 'f'); z = '0' if places == 0 else '0.' + '0' * places
    return z if s == '-' + z else s

def exactdec(fr):
    s = q(fr, terms(fr.denominator))
    if '.' in s: s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def dv(fr):
    k = terms(fr.denominator)
    return exactdec(fr) if 0 <= k <= 40 else '%d/%d' % (fr.numerator, fr.denominator)

def plus(t): return t if t.startswith('-') or t == '0' else '+' + t
def zero(t): return set(t.replace('\u2248 ', '')) <= set('0.')

def pct_text(fr, places):
    if places == 'auto':
        return (exactdec(fr), True) if terms(fr.denominator) >= 0 else (q(fr, 6), False)
    return q(fr, places), (fr * 10 ** places).denominator == 1

def row(o, r, places='auto'):
    O, R = Fraction(Decimal(o)), Fraction(Decimal(r))
    e = O - R; rel = abs(e) / abs(R); pct = rel * 100
    text, exact = pct_text(pct, places)
    d = 'equal' if e == 0 else ('above' if e > 0 else 'below')
    sg = '' if d == 'equal' else ('+' if d == 'above' else '-')
    k = terms(rel.denominator); rt = exactdec(rel) if 0 <= k <= 40 else '\u2248 ' + q(rel, 8)
    relS = (('' if zero(rt) else sg) + rt.replace('\u2248 ', ''))
    if rt.startswith('\u2248'): relS = '\u2248 ' + relS
    fr = str(pct.numerator) if pct.denominator == 1 else '%d/%d' % (pct.numerator, pct.denominator)
    return [o, r, places, str(pct.numerator), str(pct.denominator), text, exact, d, plus(dv(e)), dv(abs(e)), relS, ('' if zero(text) else sg) + text, plus(dv(-e)), ('-' if d == 'below' else '') + fr]

def dec(maxint, maxfrac):
    s = str(RND.randint(0, maxint)); f = RND.randint(0, maxfrac)
    if f: s += '.' + ''.join(str(RND.randint(0, 9)) for _ in range(f))
    return ('-' if RND.random() < 0.15 else '') + s

fixed = [('225', '230'), ('235', '230'), ('230', '230'), ('100', '100'), ('7', '9'), ('56.891', '62.327'), ('9.8', '10'), ('-9', '-10'), ('-11', '-10'), ('229', '230'), ('231', '230'),
         ('0', '50'), ('500', '5'), ('-5', '5'), ('5', '-5'), ('0.001', '0.002'), ('1', '3'), ('2', '3'), ('1234.5678', '1234.5'), ('98.5', '100'), ('1012', '1000'), ('10.2', '10'),
         ('480', '500'), ('1' * 60, '2' * 60), ('0.0000001', '0.0000002'), ('-9', '10'), ('1000000000', '1000000001'), ('1000000002', '1000000001'), ('0.0004', '1000'), ('-0.0004', '-1000')]
calc = []
for o, r in fixed:
    for p in ('auto', 0, 2, 6): calc.append(row(o, r, p))
while len(calc) < 420:
    r = dec(RND.choice([9, 99, 999, 100000]), RND.choice([0, 1, 3, 6]))
    if Fraction(Decimal(r)) == 0: continue
    calc.append(row(dec(RND.choice([9, 99, 999, 100000]), RND.choice([0, 1, 3, 6])), r, RND.choice(['auto', 'auto', 0, 1, 2, 3, 4, 8, 10])))
for r, o in [('200', '201'), ('200', '199'), ('400', '399'), ('1000', '1000.5'), ('8', '8.01'), ('80', '79.99'), ('16', '17')]:
    for p in (0, 1, 2, 3): calc.append(row(o, r, p))
json.dump({'calc': calc, 'zero': [['5', '0'], ['0', '0'], ['-3', '0'], ['5', '0.000']], 'bad': [['abc', '5'], ['5', 'abc'], ['1e3', '5'], ['--5', '5'], ['5', '1.2.3'], ['1' * 401, '5']], 'empty': [['', ''], ['5', ''], ['', '5'], ['  ', '  ']]},
          open('tests/pe_signed_vectors.json', 'w'), ensure_ascii=False)
print(len(calc), 'calc rows')
