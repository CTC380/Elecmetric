#!/usr/bin/env python3
"""Independent vectors for tools/percent_change_engine.js (Percentage Calculator, Mode 02). Writes tests/percent_change_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  inc    V increased by P%            = Fraction(V) * (1 + Fraction(P)/100)
  dec    V decreased by P%            = Fraction(V) * (1 - Fraction(P)/100)
  chg    percentage change Old->New   = (New - Old) / abs(Old) * 100        (Old = 0 refused)
  revinc original before a P% increase = New / (1 + P/100)                   (P = -100 refused)
  revdec original before a P% decrease = New / (1 - P/100)                   (P = 100 refused)
Display text: ROUND_HALF_UP on a Decimal with 3000 digits (half away from zero). 'auto' means the exact decimal when the value terminates,
otherwise 6 places, flagged not exact. The amount-of-change row is also checked where it terminates."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
R = random.Random(20261121)

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

def num(neg_ok=True):
    k = R.random()
    if k < .4: v = str(R.randint(0, 500))
    elif k < .8: v = '%d.%d' % (R.randint(0, 300), R.randint(0, 999))
    elif k < .9: v = '0.%0*d' % (R.randint(1, 4), R.randint(1, 9999))
    else: v = str(R.randint(1, 10 ** 12))
    if neg_ok and R.random() < .18: v = '-' + v
    return v

def pctv():
    k = R.random()
    if k < .5: return str(R.randint(0, 150))
    if k < .85: return '%d.%d' % (R.randint(0, 120), R.randint(0, 99))
    if k < .93: return '-%d' % R.randint(1, 60)
    return str(R.randint(100, 400))

PL = ['auto', 'auto', 0, 2, 3, 4, 6, 8]
out = {'calc': [], 'big': [], 'err': [], 'empty': []}

def result(kind, x, y):
    fx, fy = Fraction(x), Fraction(y)
    if kind == 'inc': return fx * (1 + fy / 100)
    if kind == 'dec': return fx * (1 - fy / 100)
    if kind == 'chg':
        if fx == 0: return None
        return (fy - fx) / abs(fx) * 100
    f = (1 + fy / 100) if kind == 'revinc' else (1 - fy / 100)
    if f == 0: return None
    return fx / f

def add(kind, x, y, places, store='calc'):
    r = result(kind, x, y)
    if r is None: return False
    t, ex = text(r, places)
    extra = ''
    if kind == 'chg': extra = 'increase' if r > 0 else 'decrease' if r < 0 else 'no change'
    amt = None
    fx, fy = Fraction(x), Fraction(y)
    if kind in ('inc', 'dec'):
        a = fx * fy / 100
        if terminates(a.denominator): amt = text(a, 'auto')[0]
    out[store].append([kind, x, y, places, str(r.numerator), str(r.denominator), t, ex, extra, amt])
    return True

named = [('inc', '1000', '15'), ('revdec', '920', '20'), ('chg', '80', '100'), ('chg', '100', '80'), ('chg', '10', '6'), ('inc', '100', '25'), ('dec', '100', '25'),
         ('revinc', '1150', '15'), ('dec', '1000', '15'), ('chg', '1', '4'), ('chg', '3', '4'), ('chg', '4', '3'), ('chg', '50', '50'), ('chg', '50', '0'), ('chg', '50', '-10'),
         ('chg', '-50', '-25'), ('chg', '-50', '25'), ('chg', '230', '225'), ('chg', '1000', '750'), ('chg', '0.2', '0.25'), ('inc', '0', '15'), ('dec', '0', '15'), ('inc', '100', '0'),
         ('dec', '100', '100'), ('dec', '100', '150'), ('inc', '100', '-20'), ('dec', '100', '-20'), ('inc', '-50', '10'), ('dec', '-50', '10'), ('inc', '230', '5'), ('dec', '230', '4'),
         ('revinc', '0', '15'), ('revdec', '0', '20'), ('revinc', '100', '0'), ('revdec', '100', '0'), ('revdec', '100', '150'), ('revinc', '100', '-20'), ('revdec', '100', '-20'),
         ('revinc', '110', '10'), ('revdec', '75', '25'), ('revdec', '1', '3'), ('inc', '33.333', '3'), ('chg', '0.001', '1000'), ('revdec', '920', '20.5'), ('revinc', '7', '33.3')]
for k, x, y in named:
    for p in ['auto', 2, 0]: add(k, x, y, p)
for _ in range(1100):
    k = R.choice(['inc', 'dec', 'chg', 'revinc', 'revdec'])
    if k == 'chg': x, y = num(neg_ok=R.random() < .4), num(neg_ok=R.random() < .4)
    else: x, y = num(neg_ok=R.random() < .3), pctv()
    add(k, x, y, R.choice(PL))
# spelling variants: plus sign, leading zeros, % sign on the percentage, unicode minus, spaces, trailing point
for k, xs, ys in [('inc', '1000', '15%'), ('dec', ' +200 ', '10 %'), ('revdec', '009.50', '20%'), ('revinc', '\u221255', '10'), ('chg', '0080', '100.'), ('chg', '.5', ' 1 '), ('inc', '12.50', '8.00%')]:
    x = xs.replace('\u2212', '-').strip(); y = ys.replace('%', '').strip()
    r = result(k, x, y); t, ex = text(r, 'auto')
    extra = ('increase' if r > 0 else 'decrease' if r < 0 else 'no change') if k == 'chg' else ''
    out['calc'].append([k, xs, ys, 'auto', str(r.numerator), str(r.denominator), t, ex, extra, None])
# big numbers
for digs in (100, 200, 380):
    a = str(R.randint(10 ** (digs - 1), 10 ** digs - 1)); b = str(R.randint(10 ** (digs - 1), 10 ** digs - 1))
    for k in ('inc', 'dec', 'chg', 'revinc', 'revdec'):
        y = b if k == 'chg' else str(R.randint(1, 60))
        add(k, a, y, 4, 'big')
out['err'] = [
    ['inc', '', ''], ['inc', '5', ''], ['inc', '', '5'], ['chg', '0', '5'], ['chg', '0', '0'], ['chg', '0', ''], ['revinc', '50', '-100'], ['revinc', '0', '-100'], ['revdec', '50', '100'], ['revdec', '0', '100'], ['revdec', '50', '100%'],
    ['inc', 'abc', '5'], ['inc', '5', 'x'], ['inc', '1,000', '5'], ['inc', '5', '1,5'], ['inc', '1..2', '5'], ['inc', '--5', '5'], ['inc', '5', '.'], ['inc', '-', '5'], ['inc', '1e3', '5'], ['inc', '5', 'Infinity'], ['inc', '5', 'NaN'],
    ['inc', '1/2', '5'], ['inc', '5%', '5'], ['dec', '5%', '5%'], ['chg', '5%', '5'], ['chg', '5', '5%'], ['revinc', '5%', '5'], ['revdec', '5', '5 %5'], ['inc', '1' * 401, '5'], ['dec', '5', '0.' + '1' * 400], ['chg', '1' * 401, '5'],
    ['inc', '5 5', '5'], ['nope', '1', '1'], ['', '1', '1'],
]
out['empty'] = [['inc', '', ''], ['inc', '5', ''], ['dec', '', '5'], ['chg', '', '5'], ['chg', '5', ''], ['revinc', '', ''], ['revdec', '10', '']]
json.dump(out, open('percent_change_vectors.json', 'w'), separators=(',', ':'))
print('calc %d, big %d, err %d' % (len(out['calc']), len(out['big']), len(out['err'])))
