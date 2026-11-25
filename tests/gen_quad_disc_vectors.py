"""Independent vectors for the Quadratic Formula Calculator, Mode 02 (tools/quad_disc_engine.js).
Expected values come from sympy (exact Rational and algebraic numbers, sp.roots, sp.solve) and mpmath, never from the engine.
analyse rows: [a, b, c, kind, D, rational(bool), sumSquares, recip|None, signs, diff|None, imag|None, modulus|None]
  kind: distinct | repeated | complex.  signs: opposite | both_positive | both_negative | zero_positive | zero_negative | both_zero | none
  diff = |x1 - x2| and imag = |Im x| and modulus = |x| are 30-digit strings.
range rows: [unknown, a, b, c, [breakpoints as floats, A = 0 excluded], [probes: [value, kind]]]
  breakpoints are the real roots of delta(v) = 0 found by sp.solve; each probe is a value (rational text) with the type of roots read from the sign of delta at that value.
Run: python3 tests/gen_quad_disc_vectors.py  -> tests/quad_disc_vectors.json"""
import json, random
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 50
R = random.Random(20261124)
x, v = sp.symbols('x v')

def val(t):
    t = t.replace('−', '-')
    if '/' in t:
        a, b = t.split('/'); return Fr(a) / Fr(b)
    return Fr(t)

def sr(q): return sp.Rational(q.numerator, q.denominator)

def rtxt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def s30(e): return mp.nstr(mp.mpf(str(sp.N(e, 50))), 30)

def arow(a, b, c):
    A, B, C = sr(val(a)), sr(val(b)), sr(val(c))
    D = B * B - 4 * A * C
    kind = 'distinct' if D > 0 else 'repeated' if D == 0 else 'complex'
    rational = bool(D >= 0 and sp.sqrt(D).is_Rational)
    rts = sp.roots(sp.Poly(A * x**2 + B * x + C, x), multiple=True) if D != 0 else [-B / (2 * A)] * 2
    r1, r2 = rts[0], rts[1]
    S = r1 + r2; P = r1 * r2
    mp.mp.dps = 90
    def ratof(e):  # the value is rational; recover it from 90 digits of the algebraic expression
        z = sp.N(e, 90); z = sp.re(z)
        return Fr(str(z)).limit_denominator(10**30)
    ss = ratof(r1**2 + r2**2)
    rec = None if C == 0 else ratof(1 / r1 + 1 / r2)
    mp.mp.dps = 50
    if D < 0: signs = 'none'
    else:
        pr = sp.simplify(P); sm = sp.simplify(S)
        if pr < 0: signs = 'opposite'
        elif pr > 0: signs = 'both_positive' if sm > 0 else 'both_negative'
        else: signs = 'both_zero' if sm == 0 else ('zero_positive' if sm > 0 else 'zero_negative')
    diff = s30(sp.Abs(r1 - r2)) if D >= 0 else None
    imag = s30(sp.Abs(sp.im(sp.N(r1, 60)))) if D < 0 else None
    modu = s30(sp.Abs(sp.N(r1, 60))) if D < 0 else None
    return [a, b, c, kind, rtxt(Fr(int(D.p), int(D.q))), rational, rtxt(ss), None if rec is None else rtxt(rec), signs, diff, imag, modu]

def rnd(lo=-9, hi=9, den=(1, 1, 1, 2, 3, 4, 5)):
    d = R.choice(den); n = R.randint(lo * d, hi * d)
    return rtxt(Fr(n, d))

def rnz():
    t = '0'
    while val(t) == 0: t = rnd()
    return t

def aq(a, b, c):
    return arow(a, b, c)

A_ROWS = []
named = [('1', '-5', '6'), ('1', '-4', '4'), ('1', '2', '5'), ('2', '3', '-5'), ('1', '-2', '-1'), ('3', '0', '-12'), ('1', '0', '1'), ('3/4', '1/2', '-2'), ('0.1', '0.2', '0.1'), ('1', '0', '0'), ('2', '-6', '0'), ('2', '6', '0'),
         ('1', '-2000000000', '1000000000000000001'), ('1', '-2000000000', '999999999999999999'), ('1', '-2000000000', '1000000000000000000'), ('-1', '4', '-4'), ('-2', '0', '8'), ('1', '1', '1'), ('5', '-2', '1'), ('1/3', '-1/2', '1/12')]
for t in named: A_ROWS.append(aq(*t))
for _ in range(120):
    a = rnz(); b = rnd(); c = rnd(); A_ROWS.append(aq(a, b, c))
# forced types: repeated (c = b^2/(4a)), perfect-square discriminant, near repeated
for _ in range(40):
    a = rnz(); b = rnd(); c = rtxt(val(b) ** 2 / (4 * val(a))); A_ROWS.append(aq(a, b, c))
for _ in range(40):
    r1 = Fr(R.randint(-12, 12), R.choice([1, 1, 2, 3])); r2 = Fr(R.randint(-12, 12), R.choice([1, 1, 2, 3])); a = Fr(R.choice([1, 2, 3, -1, -2, 1, 5]), R.choice([1, 1, 2]))
    A_ROWS.append(aq(rtxt(a), rtxt(-a * (r1 + r2)), rtxt(a * r1 * r2)))
for _ in range(30):
    b = R.randint(2, 40); a = R.choice([1, 1, 2, 3]); c = Fr(b * b, 4 * a)
    A_ROWS.append(aq(str(a), str(b), rtxt(c + Fr(R.choice([-1, 1]), R.choice([10**6, 10**8])))))

def classify(Dv):
    return 'distinct' if Dv > 0 else 'repeated' if Dv == 0 else 'complex'

def rrow(u, a, b, c):
    known = {'a': a, 'b': b, 'c': c}
    A = sr(val(a)) if a != '' else v; B = sr(val(b)) if b != '' else v; C = sr(val(c)) if c != '' else v
    Dv = sp.expand(B * B - 4 * A * C)
    sols = sp.solve(sp.Eq(Dv, 0), v)
    bps = sorted(float(sp.N(s)) for s in sols if s.is_real and not (u == 'a' and s == 0))
    # probes: between and beyond breakpoints, avoiding A = 0 for unknown a
    pts = sorted(set(bps + ([0.0] if u == 'a' else [])))
    cands = []
    if pts:
        cands.append(pts[0] - 3.5); cands.append(pts[-1] + 3.5)
        for p, q in zip(pts, pts[1:]): cands.append((p + q) / 2)
        for p in pts: cands.append(p - 0.37); cands.append(p + 0.37)
    else:
        cands = [-7.5, -1.25, 0.5, 3.25, 11]
    probes = []
    for cv in cands:
        q = Fr(cv).limit_denominator(1000)
        if u == 'a' and q == 0: continue
        sub = {v: sr(q)}
        kind = classify(Dv.subs(sub))
        probes.append([rtxt(q), kind])
    # exact boundary probes where the breakpoint is rational
    for s in sols:
        if s.is_Rational and not (u == 'a' and s == 0):
            probes.append([rtxt(Fr(int(s.p), int(s.q))), 'repeated'])
    return [u, a, b, c, bps, probes]

R_ROWS = []
for u, (a, b, c) in [('c', ('1', '-5', '')), ('c', ('-2', '3', '')), ('c', ('1', '0', '')), ('c', ('3/4', '1/2', '')), ('b', ('1', '', '4')), ('b', ('1', '', '-3')), ('b', ('1/2', '', '0')), ('b', ('2', '', '3')), ('b', ('-1', '', '-4')),
                     ('a', ('', '4', '2')), ('a', ('', '0', '3')), ('a', ('', '3', '0')), ('a', ('', '0', '0')), ('a', ('', '-4', '-1')), ('a', ('', '1/2', '1/8'))]:
    R_ROWS.append(rrow(u, a, b, c))
for _ in range(180):
    u = R.choice('abc'); vals = {'a': rnz(), 'b': rnd(), 'c': rnd()}
    if u == 'a': vals['c'] = R.choice([rnz(), rnz(), '0'])
    vals[u] = ''
    R_ROWS.append(rrow(u, vals['a'], vals['b'], vals['c']))

ERR = ['', 'abc', '1/0', '1//2', '--1']
json.dump({'analyse': A_ROWS, 'range': R_ROWS, 'err': ERR}, open('tests/quad_disc_vectors.json', 'w'))
print(len(A_ROWS), 'analyse vectors,', len(R_ROWS), 'range vectors')
