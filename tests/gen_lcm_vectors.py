"""Independent vectors for the LCM Calculator, Mode 01 (tools/lcm_engine.js), Multiple Number LCM.
Written without the engine, with Python integers, math.gcd / math.lcm and sympy only. Every expected LCM is found by routes that must agree:
(1) math.lcm of the distinct non-zero absolute values; (2) the same list folded with a different GCD route in the reverse order; (3) for small cases, a brute-force
search for the smallest positive integer that every number divides; (4) for numbers that sympy can factor, the product of the highest prime powers (sympy.factorint).
The input text is built from the integers in several spellings (signs, +, unicode minus, 12.0, 1.2e1, 1200e-2, 005, 5., separators), so the engine's parser is not
reproduced here.
Row of V.ok: [text, lcm, gcd, distinct (list of text, first-seen order), has zero, lcm without the zeros or null, has negative, prime working possible,
              listing working possible]
prime working possible: no zero and every distinct value at most 10^12. listing working possible: no zero, every value at most 10^12, LCM at most 10^12 and
LCM / smallest value at most 40 (the page's rule for showing the listing).
Run: python3 tests/gen_lcm_vectors.py -> tests/lcm_vectors.json   (needs sympy)"""
import json, random, math
from sympy import factorint
R = random.Random(20261124)
ok = []

def absd(vals):
    seen, out = set(), []
    for v in vals:
        a = abs(v)
        if a and a not in seen: seen.add(a); out.append(a)
    return out

def route_lcm(vals):
    d = absd(vals)
    if not d or any(v == 0 for v in vals): return 0   # convention: any zero gives 0
    a = math.lcm(*d)                                   # route 1
    b = 1
    for x in reversed(d): b = b // math.gcd(b, x) * x  # route 2
    assert a == b, (vals, a, b)
    if len(d) <= 4 and max(d) <= 60 and a <= 200000:   # route 3, brute force
        m = max(d)
        while not all(m % x == 0 for x in d): m += 1
        assert m == a, (vals, m, a)
    if max(d) < 10 ** 17:                              # route 4, sympy factorisation
        mx = {}
        for x in d:
            for p, e in factorint(x).items(): mx[p] = max(mx.get(p, 0), e)
        p4 = 1
        for p, e in mx.items(): p4 *= p ** e
        assert p4 == a, (vals, p4, a)
    return a

SEPS = [', ', ',', ' ', '; ', ';', '\n', ' , ', ',  ', '\t', ' ;  ']

def spell(v, style):
    neg = v < 0; a = abs(v); sg = ''
    if neg: sg = '-' if style % 5 != 4 else '\u2212'
    elif style % 7 == 3 and v > 0: sg = '+'
    if style % 11 == 5 and a: return sg + str(a) + '.0'
    if style % 11 == 6 and a: return sg + str(a) + '.000'
    if style % 13 == 7 and a and a % 10 == 0:
        k = 0; b = a
        while b % 10 == 0 and k < 12: b //= 10; k += 1
        return sg + str(b) + 'e' + str(k)
    if style % 17 == 8 and a: return sg + str(a * 100) + 'e-2'
    if style % 19 == 9 and a: return sg + '00' + str(a)
    if style % 23 == 10 and a: return sg + str(a) + '.'
    return sg + str(v if not neg else a)

def build(vals, mixed=True):
    parts = []
    for v in vals:
        parts.append(spell(v, R.randint(0, 400) if mixed else 0))
    sep = R.choice(SEPS) if mixed else ', '
    if mixed and R.random() < 0.3:
        return ''.join(p + R.choice(SEPS) for p in parts[:-1]) + parts[-1]
    return sep.join(parts)

def add(vals, text=None):
    if text is None: text = build(vals)
    d = absd(vals); z = any(v == 0 for v in vals)
    L = route_lcm(vals); g = 0
    for v in vals: g = math.gcd(g, abs(v))
    noz = (math.lcm(*d) if d else None) if z else None
    if noz is not None: assert noz == route_lcm([x for x in vals if x])
    lim = 10 ** 12
    primeOk = (not z) and all(x <= lim for x in d)
    listOk = (not z) and all(x <= lim for x in d) and L <= lim and L // min(d) <= 40
    ok.append([text, str(L), str(g), [str(x) for x in d], z, None if noz is None else str(noz), any(v < 0 for v in vals), primeOk, listOk])

# the CEO decision note
for t, vals in [('4, 6', [4, 6]), ('12, 18', [12, 18]), ('12, 18, 24', [12, 18, 24]), ('21, 14, 38', [21, 14, 38]), ('5, 7, 9', [5, 7, 9]), ('8, 12, 20', [8, 12, 20]), ('1, 100', [1, 100]),
                ('15, 25', [15, 25]), ('0, 5', [0, 5]), ('-4, 6', [-4, 6]), ('2, 3, 4', [2, 3, 4])]:
    add(vals, t)
assert route_lcm([12, 18, 24]) == 72 and route_lcm([21, 14, 38]) == 798 and route_lcm([5, 7, 9]) == 315 and route_lcm([-4, 6]) == 12 and math.gcd(12, 18) == 6
# every pair of 1..32, in plain text
for a in range(1, 33):
    for b in range(a, 33): add([a, b], '%d, %d' % (a, b))
# random lists of different sizes and ranges
for _ in range(220): add([R.randint(1, 50) for _ in range(R.randint(2, 4))])
for _ in range(120): add([R.randint(1, 1000) for _ in range(R.randint(2, 6))])
for _ in range(80): add([R.randint(1, 10 ** 6) for _ in range(R.randint(2, 8))])
for _ in range(60): add([R.randint(1, 10 ** 12) for _ in range(R.randint(2, 4))])
PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
for _ in range(40): add(R.sample(PR, R.randint(2, 6)))                                   # pairwise coprime: the LCM is the product
for _ in range(40):                                                                      # a number that divides the others
    g = R.randint(2, 40); add([g] + [g * R.randint(1, 30) for _ in range(R.randint(1, 4))])
# negatives, zeros, repeats, one number
for _ in range(120): add([R.choice([-1, 1]) * R.randint(1, 500) for _ in range(R.randint(2, 6))])
for _ in range(60): add([0] + [R.randint(-300, 300) for _ in range(R.randint(1, 4))])
for _ in range(20):
    v = [R.randint(1, 300) for _ in range(R.randint(1, 3))]; v = v + v + [R.choice(v)]; R.shuffle(v); add(v)
for t, v in [('0, 0', [0, 0]), ('0', [0]), ('-0, 0', [0, 0]), ('7', [7]), ('-7', [-7]), ('1', [1]), ('0, 0, 5', [0, 0, 5]), ('12, 12, 12', [12, 12, 12]), ('1, 1, 1, 1', [1, 1, 1, 1]), ('5, 0, 5', [5, 0, 5]),
             ('1e3, 12.0', [1000, 12]), ('5.', [5]), ('+5, 10', [5, 10]), ('005, 0012', [5, 12]), ('1200e-2, 18', [12, 18]), ('12.50e1, 10', [125, 10]), ('1e99, 3', [10 ** 99, 3])]:
    add(v, t)
# many numbers: 50 is the most the page accepts
add([R.randint(1, 30) for _ in range(50)]); add(list(range(1, 51)), ', '.join(str(i) for i in range(1, 51))); add([2] * 50)
# one list written with each separator, and with the sign spellings
for sep in SEPS: add([6, 10, 15], sep.join(['6', '10', '15']))
for style in range(0, 80): add([R.randint(1, 900), -R.randint(1, 900), R.randint(1, 900)], None)
# large numbers: 20 to 95 digits, built from a known gcd and cofactors, plus the 100-digit limit
for _ in range(60):
    g = R.randint(10 ** R.randint(5, 40), 10 ** 41); n = R.randint(2, 5)
    add([g * R.randint(1, 10 ** R.randint(2, 18)) * R.choice([1, -1]) for _ in range(n)])
for _ in range(25): add([R.randint(10 ** 60, 10 ** R.randint(61, 95)) for _ in range(R.randint(2, 4))])
add([10 ** 99, 10 ** 99 - 1], '%d, %d' % (10 ** 99, 10 ** 99 - 1)); add([10 ** 99 - 1], str(10 ** 99 - 1)); add([-(10 ** 99), 7], '-%d 7' % (10 ** 99))
add([2 ** 330, 3 ** 200], '%d, %d' % (2 ** 330, 3 ** 200))      # 100 and 96 digits, coprime
add([R.randint(1, 10 ** 12) for _ in range(50)])
add([int('9' * 40), int('9' * 20), int('9' * 10)], '%s, %s, %s' % ('9' * 40, '9' * 20, '9' * 10))

big = lambda n: '1' + '0' * (n - 1)
err = ['2.5, 4', '12, 2.5', 'abc', '12, x', '1/2, 3', '12, 3/4', '1e-1, 5', '0.5', '0.1, 3', '12.5, 3', '3.0001, 2', '1.5e0, 4', '--4, 6', '+-4, 6', '1e', 'e5', '.', '-', '+', '12-3', '0x10', '12.3.4', '1,5.5',
       '\u0661\u0662, 3', '1 2.5', '12 abc 18', '1e100', big(101) + ', 5', '-' + big(101), '1' * 101, '1.' + '0' * 100 + 'e100', ', '.join(['1'] * 51), ' '.join(str(i) for i in range(1, 52)),
       '12; 18; 2/3', '1e1000000', '5%', '1_000', '$5', '12,\u00a0x']
empty = ['', ' ', '   \n  ', ',', ',,;;', ' , ; ', '\n\n', ';', '\t']
json.dump({'ok': ok, 'err': err, 'empty': empty}, open('tests/lcm_vectors.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(ok), 'ok vectors,', len(err), 'rejected,', len(empty), 'empty')
