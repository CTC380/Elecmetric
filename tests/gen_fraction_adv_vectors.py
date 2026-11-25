"""Independent vectors for advCalc (Mode 05: GCD and LCM, LCD, comparison, ratio, proportion) in tools/fraction_engine.js.
Run: python3 tests/gen_fraction_adv_vectors.py  (writes tests/fraction_adv_vectors.json; deterministic, seed 5).
Routes differ from the engine's: GCD and LCM of small numbers come from prime exponents (min and max) taken by this script's own trial division
and are cross-checked against math.gcd / math.lcm; big numbers are built as g * (pairwise-coprime cofactors) so the GCD is known by construction;
every fraction is a fractions.Fraction built from its parts; the ratio is scaled with Fraction arithmetic; a proportion is built from a known
fourth term (d = b*c/a) and one term is hidden, so the expected x is the planted value and no solving formula is shared with the engine."""
import json, math, random
from fractions import Fraction as Fr
from functools import reduce
random.seed(5)

def pf(n):
    out, p = {}, 2
    while p * p <= n:
        while n % p == 0: out[p] = out.get(p, 0) + 1; n //= p
        p += 1 if p == 2 else 2
    if n > 1: out[n] = out.get(n, 0) + 1
    return out
def fprod(m):
    r = 1
    for p, e in m.items(): r *= p ** e
    return r
def gl(nums):
    ms = [pf(n) for n in nums]; ps = set().union(*[set(m) for m in ms])
    g = {p: min(m.get(p, 0) for m in ms) for p in ps}; l = {p: max(m.get(p, 0) for m in ms) for p in ps}
    g = {p: e for p, e in g.items() if e}; G, L = fprod(g), fprod(l)
    assert G == reduce(math.gcd, nums) and L == reduce(math.lcm, nums)
    return G, L
def pstr(m):
    return ' \u00d7 '.join((str(p) + '^' + str(e)) if e > 1 else str(p) for p, e in sorted(m.items())) or '1'
def gl_primes(nums):
    ms = [pf(n) for n in nums]; ps = set().union(*[set(m) for m in ms])
    g = {p: min(m.get(p, 0) for m in ms) for p in ps}; l = {p: max(m.get(p, 0) for m in ms) for p in ps}
    return pstr({p: e for p, e in g.items() if e}), pstr(l)

def ftxt(q):
    return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)
def render(q):
    """one spelling of q as typed text (unreduced fractions, mixed numbers, terminating decimals, percentages)"""
    n, d = q.numerator, q.denominator; opts = []
    k = random.randint(1, 4)
    opts.append(ftxt(q))
    if q >= 0:
        opts.append('%d/%d' % (n * k, d * k))
        if d > 1 and abs(q) > 1 and n >= 0: opts.append('%d %d/%d' % (n // d, n % d, d) if n % d else ftxt(q))
        t = d
        for f in (2, 5):
            while t % f == 0: t //= f
        if t == 1 and d <= 1000:
            e = 0; v = q
            while v.denominator != 1: v *= 10; e += 1
            s = str(v.numerator).rjust(e + 1, '0'); opts.append(s[:len(s) - e] + ('.' + s[len(s) - e:] if e else ''))
    else:
        opts.append('-%d/%d' % (-n * k, d * k))
    return random.choice(opts)
def rq(lo=1, hi=30, dmax=12, neg=False):
    q = Fr(random.randint(lo, hi), random.randint(1, dmax))
    return -q if neg and random.random() < .3 else q
def sep(): return random.choice([', ', ',', '; ', ' , '])

out = {'gcd': [], 'big': [], 'lcd': [], 'cmp': [], 'ratio': [], 'prop': [], 'cf': [], 'cfb': [], 'err': []}
# ---- gcd and lcm
for _ in range(220):
    n = random.randint(2, 7); g = random.choice([1, 1, 2, 3, 4, 6, 7, 12, 30, 35, 60, 97, 210])
    nums = [g * random.randint(1, 60) for _ in range(n)]
    if random.random() < .15: nums[1] = nums[0]
    G, L = gl(nums); sp = random.choice([', ', ' ', ';', ',', '  ', ' , '])
    txt = sp.join(('+' if random.random() < .08 else '') + str(x) if random.random() > .12 else '\u2212' + str(x) for x in nums)
    neg = '\u2212' in txt
    out['gcd'].append([txt, [str(x) for x in nums], str(G), str(L), gl_primes(nums)])
for _ in range(60):
    n = random.randint(2, 5); g = random.randint(1, 10 ** random.randint(2, 40)); cof = []
    base = [random.randint(2, 10 ** random.randint(5, 40)) for _ in range(n)]
    nums = [g * c for c in base]
    G = reduce(math.gcd, nums); L = reduce(math.lcm, nums)
    assert G == g * reduce(math.gcd, base)
    out['big'].append([' '.join(map(str, nums)), str(G), str(L)])
# ---- lcd
for _ in range(240):
    n = random.randint(2, 6); qs = [rq(0 if random.random() < .1 else 1, 40, 36, True) for _ in range(n)]
    items = [render(q) for q in qs]
    L = reduce(math.lcm, [q.denominator for q in qs])
    out['lcd'].append([', '.join(items) if random.random() < .5 else '; '.join(items), [ftxt(q) for q in qs], str(L), [str(q.numerator * (L // q.denominator)) + '/' + str(L) for q in qs], [str(L // q.denominator) for q in qs]])
# ---- compare
for _ in range(260):
    n = random.randint(2, 7); qs = [rq(0, 40, 20, True) for _ in range(n)]
    if random.random() < .4: qs[random.randrange(n)] = qs[random.randrange(n)]
    items = [render(q) for q in qs]; idx = sorted(range(n), key=lambda i: (qs[i], i))
    rank = [1 + sum(1 for o in qs if o < q) for q in qs]
    lo, hi = min(qs), max(qs); L = reduce(math.lcm, [q.denominator for q in qs])
    rel = None
    if n == 2: rel = '<' if qs[0] < qs[1] else '>' if qs[0] > qs[1] else '='
    out['cmp'].append([sep().join(items), idx, rank, [ftxt(qs[i]) for i in idx], ftxt(lo), ftxt(hi), ftxt(hi - lo), str(L), rel, lo == hi])
# ---- ratio
for _ in range(240):
    n = random.randint(2, 5); qs = [rq(0 if random.random() < .1 else 1, 30, 10) for _ in range(n)]
    if all(q == 0 for q in qs): qs[0] = Fr(1)
    L = reduce(math.lcm, [q.denominator for q in qs]); ints = [int(q * L) for q in qs]; g = reduce(math.gcd, ints); ints = [x // g for x in ints]
    s = sum(ints); shares = [Fr(x, s) for x in ints]
    tot = None; tot_txt = ''
    if random.random() < .5: tot = rq(1, 500, 8); tot_txt = render(tot)
    items = [render(q) for q in qs]
    unit = [ftxt(q / qs[0]) for q in qs] if qs[0] != 0 else None
    out['ratio'].append([random.choice([' : ', ':', ' to ', ' : ']).join(items), tot_txt, [str(x) for x in ints], str(s), [ftxt(x) for x in shares], [ftxt(x * tot) for x in shares] if tot else None, unit])
# ---- proportion (the hidden term is the planted one)
for _ in range(240):
    a, b, c = rq(1, 30, 9, True), rq(1, 30, 9, True), rq(1, 30, 9, True)
    if 0 in (a, b, c): continue
    d = b * c / a; t = [a, b, c, d]; h = random.randrange(4)
    txt = [render(v) if i != h else random.choice(['x', 'X', '?']) for i, v in enumerate(t)]
    if random.random() < .5 and h != 0: txt[0] = ftxt(a)
    s = txt[0] + random.choice([' : ', ':']) + txt[1] + random.choice([' = ', '=']) + txt[2] + random.choice([' : ', ':']) + txt[3]
    out['prop'].append([s, ftxt(t[h]), 'abcd'[h], [ftxt(v) for v in t]])
# ---- continued fractions (Python route: floor and reciprocal on Fraction; convergents by evaluating the truncated expansion from the right)
R7 = random.Random(7)
def cf_terms(x):
    a = []
    while True:
        f = math.floor(x); a.append(f)
        if x == f: return a
        x = 1 / (x - f)
def cf_value(a):
    v = Fr(a[-1])
    for t in reversed(a[:-1]): v = t + 1 / v
    return v
def cf_conv(a): return [cf_value(a[:i + 1]) for i in range(len(a))]
def cfs(a): return '[' + str(a[0]) + ('; ' + ', '.join(str(t) for t in a[1:]) if len(a) > 1 else '') + ']'
cf_inputs = [Fr(355, 113), Fr(-415, 93), Fr(3, 4), Fr(5), Fr(0), Fr(-7), Fr(1, 3), Fr(-1, 2), Fr(1264, 465), Fr(314159, 100000), Fr(240, 12), Fr(11000, 415), Fr(127, 5), Fr(5, 127), Fr(1, 7), Fr(13, 8), Fr(21, 13), Fr(-3, 7)]
for q in cf_inputs: out['cf'].append([ftxt(q), [str(t) for t in cf_terms(q)], [ftxt(c) for c in cf_conv(cf_terms(q))], ftxt(q)])
for _ in range(220):
    q = Fr(R7.randint(-5000, 5000), R7.randint(1, 4000))
    txt = render(q) if R7.random() < .5 else ftxt(q)
    a = cf_terms(q); out['cf'].append([txt, [str(t) for t in a], [ftxt(c) for c in cf_conv(a)], ftxt(q)])
for _ in range(10):
    q = Fr(R7.randint(10**60, 10**61), R7.randint(10**59, 10**60)); a = cf_terms(q)
    out['cf'].append([ftxt(q), [str(t) for t in a], [ftxt(c) for c in cf_conv(a)], ftxt(q)])
for _ in range(120):
    a = [R7.randint(-9, 9)] + [R7.randint(1, 30) for _ in range(R7.randint(0, 9))]
    v = cf_value(a); canon = cf_terms(v)
    out['cfb'].append([cfs(a), ftxt(v), [str(t) for t in canon], a[-1] == 1 and len(a) > 1])
# ---- errors, per tool
out['err'] = [
 ['gcdlcm', ''], ['gcdlcm', '12'], ['gcdlcm', '12, 0'], ['gcdlcm', '12, 1.5'], ['gcdlcm', '12, 3/4'], ['gcdlcm', '12, abc'], ['gcdlcm', '12, 50%'], ['gcdlcm', ' '.join(['6'] * 21)], ['gcdlcm', '1 ' + '9' * 401],
 ['lcd', '1/2'], ['lcd', '1/2,'], ['lcd', '1/2,,1/3'], ['lcd', '1/0, 1/2'], ['lcd', '1/2, abc'], ['lcd', ', 1/2'], ['lcd', ', '.join(['1/2'] * 21)],
 ['compare', '1/2'], ['compare', '1/2, 1/0'], ['compare', '1/2, x'], ['compare', ', '.join(['1/2'] * 13)], ['compare', '1/2,,1/3'],
 ['ratio', '5'], ['ratio', '3 : '], ['ratio', ': 3'], ['ratio', '0 : 0'], ['ratio', '3 : -4'], ['ratio', '3 : abc'], ['ratio', ' : '.join(['1'] * 9)], ['ratio', '3 : 1/0'],
 ['continued', ''], ['continued', 'abc'], ['continued', '1/0'], ['continued', '[3; 0]'], ['continued', '[3; -2]'], ['continued', '[3; 1.5]'], ['continued', '[3 7]'], ['continued', '[3, 7]'], ['continued', '[]'], ['continued', '[3; 7'], ['continued', '[' + '; '.join(['1'] * 2) + ', ' + ', '.join(['1'] * 60) + ']'],
 ['proportion', '3 : 4'], ['proportion', '3 : 4 = 9 : 10'], ['proportion', '3 : x = y : 4'], ['proportion', 'x : x = 1 : 2'], ['proportion', '3 : 4 : 5 = 9 : x'], ['proportion', '0 : 4 = 9 : x'], ['proportion', '3 : 4 = 0 : x'], ['proportion', '3 : 4 = 9 : x = 2'], ['proportion', '3 : 4 = 9 :'], ['proportion', '3 : 4 = abc : x'],
]
out['errtotal'] = [['3 : 4', '0'], ['3 : 4', '-5'], ['3 : 4', 'abc'], ['3 : 4', '1/0']]
json.dump(out, open('tests/fraction_adv_vectors.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print({k: len(v) for k, v in out.items()})
