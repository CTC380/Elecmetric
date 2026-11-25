#!/usr/bin/env python3
"""Independent vectors for tools/percent_diff_engine.js (Percentage Calculator, Mode 03). Writes tests/percent_diff_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  diff  percentage difference     = |A - B| / ((|A| + |B|) / 2) * 100            (A = B = 0 refused)
  chg   percentage change A to B  = (B - A) / |A| * 100                           (A = 0 refused)
  cmp   A compared with B         = (A - B) / |B| * 100                           (B = 0 refused)
  pp    two percentages           = P2 - P1 points; relative change (P2 - P1) / |P1| * 100 (not defined at P1 = 0)
Display text: ROUND_HALF_UP on a Decimal with 3000 digits (half away from zero). 'auto' means the exact decimal when the value terminates,
otherwise 6 places, flagged not exact. Row 'amt' is a second value checked in the result table (see the test)."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
R = random.Random(20261122)

def terminates(d):
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1

def text(fr, places):
    n, d = fr.numerator, fr.denominator
    dec = Decimal(n) / Decimal(d)
    if places == 'auto':
        if terminates(d):
            s = format(dec, 'f')
            if '.' in s: s = s.rstrip('0').rstrip('.')
            return ('0' if s in ('-0', '') else s), True
        q = dec.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        s = format(q, 'f')
        return ('0.000000' if s == '-0.000000' else s), False
    q = dec.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    s = format(q, 'f')
    z = '0' if places == 0 else '0.' + '0' * places
    exact = (fr * 10 ** places).denominator == 1
    return (z if s == '-' + z else s), exact

def pct_text(fr):  # the form of a percentage cell shown by the engine in automatic mode
    t, ex = text(fr, 'auto')
    return ('' if ex else '\u2248 ') + t + '%'

def num():
    k = R.random()
    if k < .4: v = str(R.randint(0, 500))
    elif k < .8: v = '%d.%d' % (R.randint(0, 300), R.randint(0, 999))
    elif k < .9: v = '0.%0*d' % (R.randint(1, 4), R.randint(1, 9999))
    else: v = str(R.randint(1, 10 ** 12))
    if R.random() < .2: v = '-' + v
    return v

def pctnum():
    k = R.random()
    if k < .55: return str(R.randint(0, 100))
    if k < .9: return '%d.%d' % (R.randint(0, 99), R.randint(0, 99))
    if k < .95: return '-%d' % R.randint(1, 30)
    return str(R.randint(101, 250))

def result(kind, x, y):
    fx, fy = Fraction(x), Fraction(y)
    if kind == 'diff':
        m = (abs(fx) + abs(fy)) / 2
        return None if m == 0 else abs(fx - fy) / m * 100
    if kind == 'chg': return None if fx == 0 else (fy - fx) / abs(fx) * 100
    if kind == 'cmp': return None if fy == 0 else (fx - fy) / abs(fy) * 100
    return fy - fx

def extras(kind, x, y, r):
    fx, fy = Fraction(x), Fraction(y)
    if kind == 'diff': return '', text(abs(fx - fy), 'auto')[0]
    if kind == 'chg': return ('increase' if r > 0 else 'decrease' if r < 0 else 'no change'), text(fy - fx, 'auto')[0]
    if kind == 'cmp': return ('higher' if r > 0 else 'lower' if r < 0 else 'equal'), text(fx - fy, 'auto')[0]
    return ('increase' if r > 0 else 'decrease' if r < 0 else 'no change'), ('not defined' if fx == 0 else pct_text((fy - fx) / abs(fx) * 100))

out = {'calc': [], 'big': [], 'err': [], 'empty': []}

def add(kind, x, y, places, store='calc', amt=True):
    r = result(kind, x, y)
    if r is None: return False
    t, ex = text(r, places)
    d, a = extras(kind, x, y, r)
    out[store].append([kind, x, y, places, str(r.numerator), str(r.denominator), t, ex, d, a if amt else None])
    return True

named = [('diff', '80', '100'), ('diff', '100', '80'), ('diff', '50', '150'), ('diff', '230', '225'), ('diff', '0', '5'), ('diff', '5', '0'), ('diff', '-5', '5'), ('diff', '-10', '-30'), ('diff', '7', '7'),
         ('diff', '1', '3'), ('diff', '0.001', '1000'), ('diff', '100', '120'), ('diff', '45', '50'), ('chg', '80', '100'), ('chg', '100', '80'), ('chg', '1000', '750'), ('chg', '3', '4'), ('chg', '5', '5'),
         ('chg', '-50', '-25'), ('chg', '-50', '25'), ('chg', '50', '0'), ('chg', '230', '225'), ('cmp', '80', '64'), ('cmp', '64', '80'), ('cmp', '100', '100'), ('cmp', '0', '5'), ('cmp', '5', '-5'),
         ('cmp', '-5', '-10'), ('cmp', '230', '225'), ('cmp', '1', '3'), ('pp', '12', '15'), ('pp', '15', '12'), ('pp', '92', '95'), ('pp', '0', '5'), ('pp', '5', '0'), ('pp', '50', '50'),
         ('pp', '12.5', '15.25'), ('pp', '-2', '3'), ('pp', '98', '102'), ('pp', '33.3', '66.6'), ('pp', '100', '0')]
for k, x, y in named:
    for p in ['auto', 2, 0]: add(k, x, y, p)
for _ in range(1200):
    k = R.choice(['diff', 'chg', 'cmp', 'pp'])
    if k == 'pp': x, y = pctnum(), pctnum()
    else: x, y = num(), num()
    add(k, x, y, R.choice(['auto', 'auto', 0, 2, 3, 4, 6, 8]))
# spelling variants: plus sign, leading zeros, trailing point, unicode minus, spaces, % signs on percentages
for k, xs, ys in [('diff', ' +80 ', '100.'), ('chg', '0080', '100'), ('cmp', '\u221255', '10'), ('pp', '12%', '15 %'), ('pp', ' 9.50% ', '10'), ('diff', '.5', ' 1 '), ('cmp', '12.50', '8.00')]:
    x = xs.replace('\u2212', '-').replace('%', '').strip(); y = ys.replace('%', '').strip()
    r = result(k, x, y); t, ex = text(r, 'auto'); d, a = extras(k, x, y, r)
    out['calc'].append([k, xs, ys, 'auto', str(r.numerator), str(r.denominator), t, ex, d, a])
for digs in (100, 200, 380):
    a = str(R.randint(10 ** (digs - 1), 10 ** digs - 1)); b = str(R.randint(10 ** (digs - 1), 10 ** digs - 1))
    for k in ('diff', 'chg', 'cmp'): add(k, a, b, 4, 'big', amt=False)
    add('pp', a, b, 4, 'big', amt=False)
out['err'] = [
    ['diff', '0', '0'], ['diff', '0.00', '-0'], ['chg', '0', '5'], ['chg', '0', '0'], ['cmp', '5', '0'], ['cmp', '0', '0'], ['diff', 'abc', '5'], ['diff', '5', 'x'], ['diff', '1,000', '5'], ['diff', '5', '1,5'],
    ['diff', '1..2', '5'], ['diff', '--5', '5'], ['diff', '5', '.'], ['diff', '-', '5'], ['diff', '1e3', '5'], ['diff', '5', 'Infinity'], ['diff', '5', 'NaN'], ['diff', '1/2', '5'], ['diff', '5%', '5'], ['chg', '5', '5%'],
    ['cmp', '5%', '5%'], ['pp', 'abc', '5'], ['pp', '5', '1,5'], ['pp', '1e3', '5'], ['pp', '5', '5 %5'], ['pp', '1/2', '5'], ['diff', '1' * 401, '5'], ['pp', '5', '0.' + '1' * 400], ['chg', '1' * 401, '5'],
    ['diff', '5 5', '5'], ['nope', '1', '1'], ['', '1', '1'],
]
out['empty'] = [['diff', '', ''], ['diff', '5', ''], ['chg', '', '5'], ['cmp', '5', ''], ['cmp', '', ''], ['pp', '', ''], ['pp', '10', '']]
json.dump(out, open('percent_diff_vectors.json', 'w'), separators=(',', ':'))
print('calc %d, big %d, err %d' % (len(out['calc']), len(out['big']), len(out['err'])))
