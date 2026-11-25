#!/usr/bin/env python3
"""Independent vectors for tools/pe_tol_engine.js (Elecmetric Percent Error Calculator, Mode 03, Tolerance Verification). Writes tests/pe_tol_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  observed O, reference R, tolerance basis pct (percent of |R|) or abs (value), shape sym (one tolerance) or asym (lower tolerance TL, upper tolerance TU), sizes only
  lower limit L = R - TL;  upper limit U = R + TU;  status below when O < L, above when O > U, within otherwise (limits included; on a limit when O == L or O == U)
  signed error e = O - R;  margin to the lower limit O - L;  margin to the upper limit U - O;  nearest = the smaller margin (lower when equal)
  tolerance used = |e| / (TU when e > 0, TL when e < 0) * 100 ('0%' when e = 0; null when that tolerance is 0)
  measured deviation = e / |R| * 100 as in Mode 02 (null when R = 0, which is only allowed with an absolute tolerance)
Display: ROUND_HALF_UP; 'auto' places = exact decimal when it ends, otherwise 6 places with an approximate sign; limits and margins are always exact decimals.
Each row: [observed, reference, basis, shape, t, tl, tu, places, lower, upper, status, onLimit, signed, marginLower, marginUpper, nearest, used, dev]"""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
RND = random.Random(20261126)

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

def plus(t): return t if t.startswith('-') or t == '0' else '+' + t
def zero(t): return set(t.replace('\u2248 ', '')) <= set('0.')

def pct_text(fr, places):
    if places == 'auto':
        return (exactdec(fr), True) if terms(fr.denominator) >= 0 else (q(fr, 6), False)
    return q(fr, places), (fr * 10 ** places).denominator == 1

def row(o, r, basis, shape, t, tl, tu, places='auto'):
    O, R = Fraction(Decimal(o)), Fraction(Decimal(r))
    a, b = (Fraction(Decimal(tl)), Fraction(Decimal(tu))) if shape == 'asym' else (Fraction(Decimal(t)),) * 2
    TL, TU = (abs(R) * a / 100, abs(R) * b / 100) if basis == 'pct' else (a, b)
    L, U = R - TL, R + TU
    e = O - R
    status = 'below' if O < L else 'above' if O > U else 'within'
    on = status == 'within' and (O == L or O == U)
    mL, mU = O - L, U - O
    if e == 0: used = '0%'
    else:
        T = TU if e > 0 else TL
        if T == 0: used = None
        else:
            tx, ex = pct_text(abs(e) / T * 100, places); used = ('' if ex else '\u2248 ') + tx + '%'
    dev = None
    if R != 0:
        pct = abs(e) / abs(R) * 100; tx, ex = pct_text(pct, places)
        sg = '' if e == 0 or zero(tx) else ('+' if e > 0 else '-')
        dev = ('' if ex else '\u2248 ') + sg + tx + '%'
    return [o, r, basis, shape, t, tl, tu, places, exactdec(L), exactdec(U), status, on, plus(exactdec(e)), plus(exactdec(mL)), plus(exactdec(mU)), plus(exactdec(min(mL, mU))), used, dev]

def dec(maxint, places, neg=True):
    v = RND.randint(0, maxint * 10 ** places) / Fraction(10 ** places)
    s = q(v, places)
    return ('-' + s if neg and RND.random() < 0.15 and Fraction(Decimal(s)) != 0 else s)

calc = []
# the cases in the product brief and other named cases
named = [('225', '230', 'pct', 'sym', '5'), ('235', '230', 'pct', 'sym', '5'), ('242', '230', 'pct', 'sym', '5'), ('218.5', '230', 'pct', 'sym', '5'), ('241.5', '230', 'pct', 'sym', '5'),
         ('218.4', '230', 'pct', 'sym', '5'), ('241.6', '230', 'pct', 'sym', '5'), ('230', '230', 'pct', 'sym', '5'), ('9.8', '10', 'pct', 'sym', '2'), ('9.8', '10', 'abs', 'sym', '0.5'),
         ('9.87', '10', 'pct', 'sym', '1'), ('9.87', '10', 'pct', 'sym', '1.5'), ('-9', '-10', 'pct', 'sym', '20'), ('-11', '-10', 'pct', 'sym', '5'), ('0.2', '0', 'abs', 'sym', '0.5'),
         ('-0.5', '0', 'abs', 'sym', '0.5'), ('0.51', '0', 'abs', 'sym', '0.5'), ('1', '0', 'abs', 'sym', '0'), ('0', '0', 'abs', 'sym', '0'), ('5', '5', 'abs', 'sym', '0'),
         ('5.1', '5', 'abs', 'sym', '0'), ('4.9', '5', 'pct', 'sym', '0'), ('1', '3', 'pct', 'sym', '50'), ('2', '3', 'pct', 'sym', '33.3333'), ('-5', '5', 'pct', 'sym', '150'),
         ('1234.5678', '1234.5', 'pct', 'sym', '0.01'), ('1' * 40, '2' * 40, 'pct', 'sym', '40'), ('0.0000001', '0.0000002', 'abs', 'sym', '0.0000001')]
for o, r, b, s, t in named:
    for p in ('auto', 0, 2, 6): calc.append(row(o, r, b, s, t, '', '', p))
asym = [('255', '230', 'pct', '6', '10'), ('216.2', '230', 'pct', '6', '10'), ('216.1', '230', 'pct', '6', '10'), ('253', '230', 'pct', '6', '10'), ('225', '230', 'pct', '0', '5'), ('235', '230', 'pct', '0', '5'),
        ('231', '230', 'pct', '5', '0'), ('229', '230', 'pct', '5', '0'), ('9.7', '10', 'abs', '0.2', '0.4'), ('10.4', '10', 'abs', '0.2', '0.4'), ('10.41', '10', 'abs', '0.2', '0.4'), ('-3', '-10', 'pct', '10', '80'),
        ('0.1', '0', 'abs', '0.3', '0'), ('-0.1', '0', 'abs', '0.3', '0')]
for o, r, b, tl, tu in asym:
    for p in ('auto', 2): calc.append(row(o, r, b, 'asym', '', tl, tu, p))
# boundary cases: a value on each limit and one smallest step beyond it, for random references and tolerances
while len(calc) < 700:
    r = dec(RND.choice([9, 99, 999, 100000]), RND.choice([0, 1, 3]))
    basis = RND.choice(['pct', 'pct', 'abs']); shape = RND.choice(['sym', 'asym'])
    if basis == 'pct' and Fraction(Decimal(r)) == 0: continue
    mx = RND.choice([5, 25, 100]) if basis == 'pct' else RND.choice([1, 10, 1000]); pl = RND.choice([0, 1, 2])
    t, tl, tu = (dec(mx, pl, False), '', '') if shape == 'sym' else ('', dec(mx, pl, False), dec(mx, pl, False))
    R = Fraction(Decimal(r)); a, b = (Fraction(Decimal(t)),) * 2 if shape == 'sym' else (Fraction(Decimal(tl)), Fraction(Decimal(tu)))
    TL, TU = (abs(R) * a / 100, abs(R) * b / 100) if basis == 'pct' else (a, b)
    L, U = R - TL, R + TU; step = Fraction(1, 10 ** 4)
    for O in (L, U, L - step, U + step, (L + U) / 2, R):
        if terms(O.denominator) < 0 or terms(O.denominator) > 12: continue
        calc.append(row(exactdec(O), r, basis, shape, t, tl, tu, RND.choice(['auto', 'auto', 0, 2, 4])))
bad = [['abc', '5', 'pct', 'sym', '5', '', ''], ['5', 'abc', 'pct', 'sym', '5', '', ''], ['5', '5', 'pct', 'sym', 'x', '', ''], ['5', '5', 'pct', 'sym', '1e3', '', ''], ['5', '5', 'pct', 'sym', '1,5', '', ''],
       ['5', '5', 'abs', 'sym', '5%', '', ''], ['5', '5', 'pct', 'sym', '-5', '', ''], ['5', '5', 'pct', 'asym', '', '-3', '5'], ['5', '5', 'pct', 'asym', '', '3', '-5'], ['1' * 401, '5', 'pct', 'sym', '5', '', ''], ['5', '5', 'weekly', 'sym', '5', '', ''], ['5', '5', 'pct', 'both', '5', '', '']]
json.dump({'calc': calc, 'zero': [['5', '0', 'pct', 'sym', '5', '', ''], ['0', '0', 'pct', 'sym', '5', '', ''], ['5', '0.000', 'pct', 'asym', '', '1', '2']], 'bad': bad,
           'empty': [['', '', 'pct', 'sym', '', '', ''], ['5', '', 'pct', 'sym', '5', '', ''], ['', '5', 'pct', 'sym', '5', '', ''], ['5', '5', 'pct', 'sym', '', '', ''], ['5', '5', 'pct', 'asym', '', '3', ''], ['5', '5', 'pct', 'asym', '', '', '3'], ['  ', '  ', 'abs', 'sym', ' ', '', '']]},
          open('tests/pe_tol_vectors.json', 'w'), ensure_ascii=False)
print(len(calc), 'calc rows')
