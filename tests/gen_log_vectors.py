"""Independent vectors for the Log Calculator, Mode 01 (tools/log_engine.js).
Expected values come from mpmath (60-digit logarithms) and sympy (prime factorisation), never from the engine.
Each row: [b text, x text, status, exact fraction or null, y rounded to 15 places, ln x rounded to 15 places]
status: rational | irrational. Run: python3 tests/gen_log_vectors.py  -> tests/log_vectors.json"""
import json, random
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 80
R = random.Random(20261123)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def r15(v):
    # round half away from zero to 15 places, return the same text the engine prints
    neg = v < 0; a = abs(v); s = mp.nstr(a * mp.mpf(10) ** 15 + mp.mpf(1) / 2, 60, strip_zeros=False)
    n = int(mp.floor(a * mp.mpf(10) ** 15 + mp.mpf(1) / 2))
    t = str(n).rjust(16, '0'); t = t[:-15] + '.' + t[-15:]
    return ('-' if neg and n else '') + t

def exps(q):
    d = {}
    for p, e in sp.factorint(q.numerator).items(): d[p] = d.get(p, 0) + e
    for p, e in sp.factorint(q.denominator).items(): d[p] = d.get(p, 0) - e
    return d

def classify(b, x):
    # y is rational iff the prime exponent vector of x is a rational multiple of that of b (written without the engine)
    if x == 1: return 'rational', Fr(0)
    vb, vx = exps(b), exps(x)
    ps = set(vb) | set(vx); lam = None
    for p in ps:
        eb, ex = vb.get(p, 0), vx.get(p, 0)
        if eb == 0:
            if ex != 0: return 'irrational', None
        else:
            l = Fr(ex, eb)
            if lam is None: lam = l
            elif lam != l: return 'irrational', None
    return 'rational', lam

def row(b, x):
    st, lam = classify(b, x)
    y = mp.log(mp.mpf(x.numerator) / x.denominator) / mp.log(mp.mpf(b.numerator) / b.denominator) if x != 1 else mp.mpf(0)
    lnx = mp.log(mp.mpf(x.numerator) / x.denominator)
    if st == 'rational': assert abs(y - mp.mpf(lam.numerator) / lam.denominator) < mp.mpf(10) ** -60 or x == 1
    return [txt(b), txt(x), st, txt(lam) if st == 'rational' else None, r15(y), r15(lnx), mp.nstr(y, 30), mp.nstr(lnx, 30)]

rows = []
named = [('2', '8'), ('10', '1000'), ('2', '32'), ('2', '1/8'), ('1/2', '8'), ('4', '1/8'), ('5', '125'), ('3', '81'), ('10', '1/1000'), ('2', '10'), ('10', '2'), ('7', '7'), ('9', '1'), ('1/3', '27'), ('8', '4'), ('4', '8'), ('6', '36'), ('12', '18'), ('1000', '1/10'), ('2', '1/1000000'), ('0.0001', '1000000'), ('1e-10', '1e10'), ('5', '1e300'), ('1e-300', '2'), ('1.0000001', '2'), ('2', '1.0000001'), ('1000003', '1000003000009')]
for b, x in named:
    def f(t): return Fr(t.replace('e', 'E')) if 'e' in t or 'E' in t else Fr(t)
    r = row(f(b), f(x)); r[0], r[1] = b, x; rows.append(r)
# powers of a common base: always rational
for _ in range(60):
    base = R.choice([2, 3, 5, 6, 7, 10, 12, 15, 30, Fr(2, 3), Fr(3, 4), Fr(5, 2), Fr(1, 2), Fr(1, 10), Fr(9, 4), Fr(7, 5), Fr(100, 27)])
    base = Fr(base)
    if base == 1: continue
    p, q = R.randint(-9, 9), R.randint(1, 5)
    # x = base^(p/q) only if that is rational: take x = base^(k q)^... choose x = (base^p)^(1) or root of perfect power
    root = Fr(R.choice([2, 3, 5, 7, Fr(1, 2), Fr(2, 3), 10, 6]))
    b = root ** R.randint(1, 4); x = root ** R.randint(-7, 7)
    if b == 1: continue
    rows.append(row(b, x))
# random pairs: almost always irrational
for _ in range(80):
    b = Fr(R.randint(2, 500), R.randint(1, 40)); x = Fr(R.randint(1, 100000), R.randint(1, 1000))
    if b == 1 or x == 0: continue
    rows.append(row(b, x))
for _ in range(30):
    b = Fr(R.randint(2, 10 ** 12), R.randint(1, 10 ** 6)); x = Fr(R.randint(1, 10 ** 25), R.randint(1, 10 ** 8))
    if b == 1: continue
    rows.append(row(b, x))
# e as base or argument
mp_e = mp.e
def erow(bt, xt):
    if bt == 'e':
        x = Fr(xt); lnx = mp.log(mp.mpf(x.numerator) / x.denominator)
        return ['e', xt, 'rational' if x == 1 else 'irrational', '0' if x == 1 else None, r15(lnx), r15(lnx), mp.nstr(lnx, 30), mp.nstr(lnx, 30)]
    b = Fr(bt); lnb = mp.log(mp.mpf(b.numerator) / b.denominator)
    return [bt, 'e', 'irrational', None, r15(1 / lnb), r15(mp.mpf(1)), mp.nstr(1 / lnb, 30), '1.0']
for x in ['2', '10', '1/2', '1', '1000', '0.001', '7/3']: rows.append(erow('e', x))
for b in ['2', '10', '1/2', '3', '0.5', '100']: rows.append(erow(b, 'e'))
rows.append(['e', 'e', 'rational', '1', '1.000000000000000', '1.000000000000000', '1.0', '1.0'])
err = {'b': ['1', '0', '-2', '-0.5', '1/1', '0/5', 'abc', '', '1/0'], 'x': ['0', '-10', '-1/3', 'abc', '', '1/0']}
json.dump({'ok': rows, 'err': err}, open('tests/log_vectors.json', 'w'))
print(len(rows), 'rows;', sum(1 for r in rows if r[2] == 'rational'), 'rational')
