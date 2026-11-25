"""Independent vectors for tools/fraction_engine.js (Fraction Calculator, Mode 01).
The expected value of every expression is found by letting Python evaluate the same expression over fractions.Fraction (eval of a
Fraction-literal string, so Python's own precedence rules apply), not by a second parser. Decimal expansions come from number theory
(strip the factors 2 and 5, the repeating block is the multiplicative order of 10), not from long division.
Run: python3 tests/gen_fraction_vectors.py  -> tests/fraction_vectors.json"""
import json, random
from fractions import Fraction as Fr
from math import gcd
R = random.Random(20261120)

def order10(m):
    k, x = 1, 10 % m
    while x != 1:
        x = x * 10 % m; k += 1
    return k

def dec(q):
    """exact decimal text: finite 'a.b', repeating 'a.b(c)', or None when the repeating block is too long to search"""
    neg = q < 0; q = abs(q); ip = q.numerator // q.denominator; fr = q - ip
    sign = '-' if neg and q != 0 else ''
    if fr == 0: return sign + str(ip)
    d = fr.denominator; a = b = 0; t = d
    while t % 2 == 0: t //= 2; a += 1
    while t % 5 == 0: t //= 5; b += 1
    pre = max(a, b)
    if t == 1:
        digits = str(fr.numerator * 10 ** pre // d).rjust(pre, '0')
        return sign + str(ip) + '.' + digits
    if t > 2_000_000: return None
    per = order10(t)
    if per > 4000: return None
    n_all = fr * 10 ** (pre + per); n_pre = fr * 10 ** pre
    allv = int(n_all); prev = int(n_pre)
    block = str(allv - prev * 10 ** per).rjust(per, '0')
    pre_s = str(prev).rjust(pre, '0') if pre else ''
    return sign + str(ip) + '.' + pre_s + '(' + block + ')'

def mixed(q):
    if q.denominator == 1: return str(q.numerator)
    if abs(q) < 1: return '%d/%d' % (q.numerator, q.denominator)
    w = abs(q.numerator) // q.denominator; r = abs(q.numerator) % q.denominator
    return ('-' if q < 0 else '') + '%d %d/%d' % (w, r, q.denominator)

def lit():
    k = R.choice(['int', 'frac', 'frac', 'mixed', 'dec', 'fracU'])
    neg = R.random() < 0.25
    if k == 'int': v = R.randint(0, 60); s = str(v); q = Fr(v)
    elif k == 'frac':
        d = R.randint(2, 30); n = R.randint(1, 60); s = '%d/%d' % (n, d); q = Fr(n, d)
    elif k == 'fracU':
        d = R.randint(2, 12) * R.randint(1, 4); n = R.randint(1, 20) * R.randint(1, 4); s = '%d/%d' % (n, d); q = Fr(n, d)
    elif k == 'mixed':
        w = R.randint(1, 12); d = R.randint(2, 16); n = R.randint(1, d - 1); s = '%d %d/%d' % (w, n, d); q = w + Fr(n, d)
    else:
        f = R.randint(1, 4); v = R.randint(1, 10 ** (f + 1)); s = ('%.' + str(f) + 'f') % (v / 10 ** f); q = Fr(s)
    if neg:
        return ('-' + s, -q)
    return (s, q)

def py(s):  # python expression text for a rendered literal is built from the Fraction itself, never from the string
    return None

def expr():
    n = R.randint(2, 5); parts = []; pyp = []
    ops = ['+', '-', '*', '/']; render = {'+': ['+', ' + '], '-': ['-', ' \u2212 ', ' - '], '*': ['*', ' \u00d7 ', ' x '], '/': ['\u00f7', ' \u00f7 ', ' : ']}
    out = ''; ev = ''
    depth_open = 0
    for i in range(n):
        s, q = lit()
        wrap = R.random() < 0.2 and i > 0
        if q < 0 and i > 0: wrap = True
        txt = s.replace('-', '\u2212') if R.random() < 0.3 else s
        if wrap: txt = '(' + txt + ')'
        out += txt; ev += 'Fr(%d,%d)' % (q.numerator, q.denominator)
        if i < n - 1:
            op = R.choice(ops); out += R.choice(render[op]); ev += op
    return out, ev

ok = []
tries = 0
while len(ok) < 340 and tries < 5000:
    tries += 1
    s, ev = expr()
    try: q = eval(ev, {'Fr': Fr})
    except ZeroDivisionError: continue
    if abs(q.numerator) > 10 ** 18 or q.denominator > 10 ** 18: continue
    ok.append([s, q.numerator, q.denominator, mixed(q), dec(q), dec(q * 100)])
# the cases written in the CEO decision note
named = [('1/2 + 3/4', Fr(5, 4)), ('3/4 \u2212 1/6', Fr(7, 12)), ('3/5 \u00d7 10/9', Fr(2, 3)), ('7/8 \u00f7 1/4', Fr(7, 2)), ('18/24', Fr(3, 4)),
         ('0.125', Fr(1, 8)), ('2 1/3 \u2212 5/6', Fr(3, 2)), ('\u22121 3/4 + 2/3', Fr(-13, 12)), ('1/2 + 1/3 + 1/4', Fr(13, 12)), ('\u22123/4 + 1/2', Fr(-1, 4)),
         ('1/3', Fr(1, 3)), ('3/-4', Fr(-3, 4)), ('2_1/3', Fr(7, 3)), ('0.5 + 1/4', Fr(3, 4)), ('(1/2 + 1/3) \u00d7 6', Fr(5)), ('-(1/2)', Fr(-1, 2)), ('1/7', Fr(1, 7)), ('0', Fr(0)), ('0/5', Fr(0)), ('5', Fr(5)),
         ('3 \u00f7 -1/2', Fr(-6)), ('1.5/0.25', Fr(6)), ('-0.75', Fr(-3, 4)), ('7 3/4', Fr(31, 4)), ('-7 3/4', Fr(-31, 4)), ('100/8', Fr(25, 2)), ('1/6', Fr(1, 6)), ('5/12', Fr(5, 12)), ('1/97', Fr(1, 97))]
for s, q in named: ok.append([s, q.numerator, q.denominator, mixed(q), dec(q), dec(q * 100)])
# very large integers: exact results where a float would fail
big = []
for k in range(40):
    dg = R.choice([20, 40, 80, 150, 300])
    a = R.randint(10 ** (dg - 1), 10 ** dg); b = R.randint(10 ** (dg - 1), 10 ** dg); c = R.randint(10 ** (dg - 1), 10 ** dg); d = R.randint(10 ** (dg - 1), 10 ** dg)
    op = R.choice(['+', '-', '*', '/'])
    q = eval('Fr(%d,%d)%sFr(%d,%d)' % (a, b, op, c, d), {'Fr': Fr})
    sym = {'+': ' + ', '-': ' - ', '*': ' \u00d7 ', '/': ' \u00f7 '}[op]
    big.append(['%d/%d%s%d/%d' % (a, b, sym, c, d), str(q.numerator), str(q.denominator), mixed(q)])
err = ['1/0', '5/0', '0/0', '1/2 \u00f7 0', '1/2 \u00f7 (1/2 - 1/2)', '3 1/0', '', '1/', '/2', '1/2 +', '+', '(1/2', '1/2)', '1 2', 'abc', '1/2 + x', '1,000/3', '2^3', '1/2/3', '1/2 / 1/4', '3 1.5/2', '1.5 1/2', '1/2 + * 3', '()', '1/2 $ 3', '(1/2)(1/3)', '1/2 3']
json.dump({'ok': ok, 'big': big, 'err': err}, open('fraction_vectors.json', 'w'), ensure_ascii=False)
print(len(ok), 'vectors,', len(big), 'big,', len(err), 'error cases')
