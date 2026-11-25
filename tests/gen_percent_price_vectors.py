#!/usr/bin/env python3
"""Independent vectors for tools/percent_price_engine.js (Percentage Calculator, Mode 06: Sequential, Discount & Markup). Writes tests/percent_price_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  seq    V after changes p1..pn      = V * prod(1 + pi/100)                      (signed percentages)
  disc   price with D% off           = P * (1 - D/100)
  dpct   discount, original -> sale  = (O - S) / abs(O) * 100                    (O = 0 refused)
  mkup   price from cost, markup M   = C * (1 + M/100)                           (markup is a percentage of cost)
  mgn    price from cost, margin G   = C / (1 - G/100)                           (margin is a percentage of price; G = 100 refused)
  mkpct  markup from cost and price  = (S - C) / abs(C) * 100                    (C = 0 refused); margin = (S - C) / S * 100
  orig   original from sale, d1..dn  = S / prod(1 - di/100)                      (discounts are percent off; product 0 refused)
  cost   cost from price, markup M   = S / (1 + M/100)                           (M = -100 refused)
Display text: ROUND_HALF_UP on a Decimal with 3000 digits (half away from zero). 'auto' means the exact decimal when the value terminates,
otherwise 6 places, flagged not exact. Each row also carries up to two auxiliary rows (label, expected text) that are checked only where the
value terminates in 40 digits or fewer, because the engine shows a non-terminating value as a fraction or an approximation."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
R = random.Random(20261122)

def terminates(d):
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1

def digits(d):
    a = b = 0
    while d % 2 == 0: d //= 2; a += 1
    while d % 5 == 0: d //= 5; b += 1
    return max(a, b)

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

def signed():
    k = R.random()
    v = str(R.randint(0, 60)) if k < .55 else '%d.%d' % (R.randint(0, 40), R.randint(0, 99))
    if k > .93: v = str(R.randint(80, 200))
    return ('-' + v) if R.random() < .5 else v

def fr(t): return Fraction(str(t).replace('%', '').replace(' ', '').replace('\u2212', '-'))
def prod(xs):
    p = Fraction(1)
    for t in xs: p *= t
    return p

SEPS = [' ', ', ', '; ', ' then ', ';']

def joinlist(items):
    s = ''
    for i, t in enumerate(items):
        if i: s += R.choice(SEPS)
        s += t
    return s

PL = ['auto', 'auto', 0, 2, 3, 4, 6, 8]
UNIT = {'dpct': '%', 'mkpct': '%'}
out = {'calc': [], 'big': [], 'err': [], 'empty': []}

def result(kind, x, ys):
    fx = Fraction(x.replace('\u2212', '-'))
    if kind in ('seq', 'orig'):
        ts = [fr(t) for t in ys]
        if kind == 'seq': return fx * prod([1 + t / 100 for t in ts])
        f = prod([1 - t / 100 for t in ts])
        return None if f == 0 else fx / f
    fy = fr(ys)
    if kind == 'disc': return fx * (1 - fy / 100)
    if kind == 'dpct': return None if fx == 0 else (fx - fy) / abs(fx) * 100
    if kind == 'mkup': return fx * (1 + fy / 100)
    if kind == 'mgn':
        f = 1 - fy / 100
        return None if f == 0 else fx / f
    if kind == 'mkpct': return None if fx == 0 else (fy - fx) / abs(fx) * 100
    f = 1 + fy / 100  # cost
    return None if f == 0 else fx / f

def aux(kind, x, ys, r):
    """rows [label, expected text] to check where the value terminates"""
    fx = Fraction(x.replace('\u2212', '-')); rows = []
    def put(label, v, pct=False):
        if v is None or not terminates(v.denominator) or digits(v.denominator) > 40: return
        rows.append([label, text(v, 'auto')[0] + ('%' if pct else '')])
    if kind == 'seq':
        put('Overall change', (prod([1 + fr(t) / 100 for t in ys]) - 1) * 100, True)
    elif kind == 'disc':
        put('You save', fx * fr(ys) / 100)
    elif kind == 'dpct':
        put('Saving (original \u2212 sale)', fx - fr(ys))
    elif kind == 'mkup':
        pf = fx * fr(ys) / 100; put('Profit', pf)
        if r != 0: put('Margin on the selling price', pf / r * 100, True)
    elif kind == 'mgn':
        pf = r - fx; put('Profit', pf)
        if fx != 0: put('Markup on cost', pf / abs(fx) * 100, True)
    elif kind == 'mkpct':
        fy = fr(ys); pf = fy - fx; put('Profit', pf)
        if fy != 0: put('Margin on the selling price', pf / fy * 100, True)
    elif kind == 'orig':
        f = prod([1 - fr(t) / 100 for t in ys]); put('Total discount', (1 - f) * 100, True); put('Amount saved', r - fx)
    else:
        pf = fx - r; put('Profit', pf)
        if fx != 0: put('Margin on the selling price', pf / fx * 100, True)
    return rows

def add(kind, x, ys, places, store='calc', xs=None, yst=None):
    r = result(kind, x, ys)
    if r is None: return False
    t, ex = text(r, places)
    extra = ''
    if kind == 'dpct': extra = 'discount' if r > 0 else 'increase' if r < 0 else 'no change'
    ytxt = yst if yst is not None else (joinlist(ys) if isinstance(ys, list) else ys)
    out[store].append([kind, xs if xs is not None else x, ytxt, places, str(r.numerator), str(r.denominator), t, ex, extra, aux(kind, x, ys, r)])
    return True

named = [
    ('seq', '100', ['+10', '-10']), ('seq', '100', ['20', '-20']), ('seq', '1000', ['10', '10', '-5']), ('seq', '100', ['-20', '-10']), ('seq', '100', ['10']), ('seq', '0', ['10', '20']),
    ('seq', '100', ['0', '0']), ('seq', '100', ['-100', '50']), ('seq', '100', ['-150']), ('seq', '230', ['5', '-5']), ('seq', '-50', ['10', '10']), ('seq', '100', ['50', '50']),
    ('seq', '100', ['100', '-50']), ('seq', '1', ['33.333', '-25']), ('seq', '100', ['2.5', '2.5', '2.5', '2.5']), ('seq', '100', ['1'] * 12),
    ('disc', '500', '10'), ('disc', '920', '20'), ('disc', '100', '0'), ('disc', '100', '100'), ('disc', '100', '150'), ('disc', '100', '-20'), ('disc', '0', '25'), ('disc', '-100', '25'), ('disc', '19.99', '15'), ('disc', '1', '33.3'),
    ('dpct', '500', '450'), ('dpct', '450', '500'), ('dpct', '100', '100'), ('dpct', '100', '0'), ('dpct', '100', '-20'), ('dpct', '-50', '-25'), ('dpct', '1', '0.67'), ('dpct', '1150', '920'), ('dpct', '3', '2'),
    ('mkup', '80', '25'), ('mkup', '100', '0'), ('mkup', '100', '-100'), ('mkup', '100', '-20'), ('mkup', '0', '50'), ('mkup', '100', '100'), ('mkup', '12.5', '8'), ('mkup', '1', '300'),
    ('mgn', '80', '20'), ('mgn', '100', '0'), ('mgn', '100', '50'), ('mgn', '100', '-25'), ('mgn', '100', '150'), ('mgn', '0', '30'), ('mgn', '80', '33.3'), ('mgn', '1', '99'),
    ('mkpct', '80', '100'), ('mkpct', '100', '100'), ('mkpct', '100', '80'), ('mkpct', '100', '0'), ('mkpct', '-50', '25'), ('mkpct', '3', '4'), ('mkpct', '1', '3'),
    ('orig', '72', ['20', '10']), ('orig', '920', ['20']), ('orig', '100', ['0']), ('orig', '75', ['25']), ('orig', '63', ['10', '10', '10']), ('orig', '0', ['20', '10']), ('orig', '100', ['-20']), ('orig', '100', ['150']),
    ('orig', '81', ['10', '10']), ('orig', '1', ['33.3', '12.5']),
    ('cost', '100', '25'), ('cost', '100', '0'), ('cost', '100', '-20'), ('cost', '0', '25'), ('cost', '125', '25'), ('cost', '1', '3'), ('cost', '19.99', '15.5'),
]
for k, x, y in named:
    for p in ['auto', 2, 0]: add(k, x, y, p)

for _ in range(1500):
    k = R.choice(['seq', 'disc', 'dpct', 'mkup', 'mgn', 'mkpct', 'orig', 'cost'])
    if k == 'seq': add(k, num(neg_ok=R.random() < .15), [signed() for _ in range(R.randint(1, 6))], R.choice(PL))
    elif k == 'orig': add(k, num(neg_ok=R.random() < .15), [pctv() for _ in range(R.randint(1, 5))], R.choice(PL))
    elif k in ('dpct', 'mkpct'): add(k, num(neg_ok=R.random() < .25), num(neg_ok=R.random() < .25), R.choice(PL))
    else: add(k, num(neg_ok=R.random() < .2), pctv(), R.choice(PL))

# spelling variants: plus sign, leading zeros, % signs, unicode minus, spaces before %, separators, trailing point
variants = [
    ('seq', '100', '+10% -10%'), ('seq', ' 100 ', '+10 %, \u221210 %'), ('seq', '1000', '10; 10; -5'), ('seq', '100', '20 then -20'), ('seq', '100', '20 and 10 &  5'), ('seq', '009.50', '10.'),
    ('seq', '100', '\u22125\u22125'.replace('\u22125\u22125', '\u22125 \u22125')), ('seq', '100', '5,\u00a0-5'),
    ('disc', '500', '10%'), ('disc', ' +200 ', '10 %'), ('dpct', '0080', '60.'), ('mkup', '.5', ' 20 '), ('mgn', '12.50', '8.00%'), ('mkpct', '\u221255', '10'), ('orig', '72', '20% 10%'),
    ('orig', '72', '20 then 10'), ('orig', '72', '20,10'.replace('20,10', '20, 10')), ('cost', '125', '25 %'),
]
for k, xs, ys in variants:
    x = xs.replace('\u2212', '-').replace('\u00a0', ' ').strip()
    if k in ('seq', 'orig'):
        toks = [t for t in __import__('re').split(r'[\s,;]+', ys.replace('\u2212', '-').replace('\u00a0', ' ').replace(' %', '%').strip()) if t and t.lower() not in ('then', 'and', '&')]
        r = result(k, x, toks)
        t, ex = text(r, 'auto')
        out['calc'].append([k, xs, ys, 'auto', str(r.numerator), str(r.denominator), t, ex, '', aux(k, x, toks, r)])
    else:
        y = ys.replace('%', '').strip()
        r = result(k, x, y); t, ex = text(r, 'auto')
        extra = ('discount' if r > 0 else 'increase' if r < 0 else 'no change') if k == 'dpct' else ''
        out['calc'].append([k, xs, ys, 'auto', str(r.numerator), str(r.denominator), t, ex, extra, aux(k, x, y, r)])

# big numbers
for digs in (100, 200, 380):
    a = str(R.randint(10 ** (digs - 1), 10 ** digs - 1)); b = str(R.randint(10 ** (digs - 1), 10 ** digs - 1))
    add('seq', a, ['10', '-5', '2.5'], 4, 'big'); add('orig', a, ['20', '10'], 4, 'big')
    for k in ('disc', 'mkup', 'cost'): add(k, a, str(R.randint(1, 60)), 4, 'big')
    add('mgn', a, '25', 4, 'big'); add('dpct', a, b, 4, 'big'); add('mkpct', a, b, 4, 'big')

out['err'] = [
    ['seq', '', ''], ['seq', '5', ''], ['seq', '', '5'], ['orig', '', '20'], ['dpct', '0', '5'], ['dpct', '0', '0'], ['dpct', '0', ''], ['mkpct', '0', '5'], ['mkpct', '0', '0'], ['mgn', '80', '100'], ['mgn', '0', '100'], ['mgn', '80', '100%'],
    ['orig', '50', '100'], ['orig', '50', '20 100'], ['orig', '0', '100%'], ['orig', '50', '100 20 5'], ['cost', '50', '-100'], ['cost', '0', '-100'], ['cost', '50', '-100%'],
    ['seq', '100', '10,5'], ['seq', '100', '1,5 2'], ['orig', '72', '2,5'], ['seq', '100', 'abc'], ['seq', '100', '10 abc'], ['seq', '100', '10 x 5'], ['seq', 'abc', '10'], ['seq', '1,000', '10'], ['seq', '100', '1..2'], ['seq', '100', '--5'],
    ['seq', '100', '1e3'], ['seq', '100', 'NaN'], ['seq', '100', '1/2'], ['seq', '100', '%'], ['seq', '100', '+'], ['seq', '100', '10%%'], ['seq', '5%', '10'], ['orig', '5%', '10'], ['disc', '5%', '5'], ['dpct', '5', '5%'], ['mkpct', '5%', '5'],
    ['seq', '1' * 401, '5'], ['seq', '100', '1' * 401], ['seq', '100', '0.' + '1' * 400], ['orig', '1' * 401, '5'], ['dpct', '1' * 401, '5'],
    ['seq', '100', ' '.join(['1'] * 31)], ['orig', '100', ' '.join(['1'] * 31)],
    ['disc', 'abc', '5'], ['disc', '5', 'x'], ['disc', '1,000', '5'], ['mkup', '5', '1,5'], ['mgn', '5', '.'], ['cost', '-', '5'], ['mkpct', '5', 'Infinity'], ['dpct', '5 5', '5'],
    ['nope', '1', '1'], ['', '1', '1'],
]
out['empty'] = [['seq', '', ''], ['seq', '5', ''], ['seq', '', '5'], ['seq', '5', ' '], ['seq', '5', ' , ; '], ['disc', '', '5'], ['disc', '5', ''], ['dpct', '', '5'], ['dpct', '5', ''], ['mkup', '', ''], ['mgn', '10', ''], ['mkpct', '', '4'], ['orig', '72', ''], ['orig', '', '20 10'], ['cost', '', '25']]
json.dump(out, open('percent_price_vectors.json', 'w'), separators=(',', ':'))
print('calc %d, big %d, err %d, empty %d' % (len(out['calc']), len(out['big']), len(out['err']), len(out['empty'])))
