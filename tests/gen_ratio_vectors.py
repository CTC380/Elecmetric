"""Independent vectors for the Ratio Calculator, Mode 01 (tools/ratio_engine.js), the Ratio Simplifier.
Written without the engine, with Python's fractions.Fraction and integer arithmetic only. The simplest form is found two ways and the two must agree:
(1) the lowest common multiple of the denominators and the greatest common divisor of the scaled integers; (2) for small cases, a brute-force search for the
smallest positive integer multiplier m that makes every term a whole number, then trial division by every common factor.
Row of V.ok: [ratio text, simplified terms (list of text), whole-number form (list), gcd, lcm, scale k = entered/simplified (text), shares (list of fraction text),
              share decimals at 4 places (list), share percents at 2 places (list), A/B fraction text or null, A/B decimal at 4 places or null]
Decimal texts carry the engine's marker: a leading '≈ ' when the value is not exact at that many places. Run: python3 tests/gen_ratio_vectors.py -> tests/ratio_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
R = random.Random(20261123)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def dec(q, p):
    # round half away from zero to p places; mark inexact with the same leading sign the page uses
    neg = q < 0; a = abs(q); S = 10 ** p
    sc = (a.numerator * S * 2 + a.denominator) // (a.denominator * 2)
    ip, fp = divmod(sc, S)
    t = str(ip) + ('.' + str(fp).rjust(p, '0') if p else '')
    exact = (a * S).denominator == 1
    return ('' if exact else '\u2248 ') + ('-' if neg and sc else '') + t

def simplify(terms):
    L = 1
    for t in terms: L = L * t.denominator // math.gcd(L, t.denominator)
    W = [int(t * L) for t in terms]
    g = 0
    for w in W: g = math.gcd(g, w)
    return L, W, g, [w // g for w in W]

def brute(terms):
    m = 1
    while any((t * m).denominator != 1 for t in terms): m += 1
    W = [int(t * m) for t in terms]
    f = max(W)
    while f > 1:
        if all(w % f == 0 for w in W): W = [w // f for w in W]; f = max(W) if max(W) > 1 else 1; continue
        f -= 1
    return m, W

def row(text, terms):
    L, W, g, S = simplify(terms)
    if max(max(abs(x.numerator), x.denominator) for x in terms) < 400 and len(terms) <= 4 and L <= 400:
        m, W2 = brute(terms)
        if sum(W2) and W2 != S:
            # brute force found the smallest multiplier; its reduced form must be the same ratio
            assert W2 == S, (text, W2, S)
    tot = sum(S); sh = [Fr(s, tot) for s in S]
    k = Fr(g, L)
    for t, s in zip(terms, S): assert t == k * s
    ab = Fr(S[0], S[1]) if len(S) == 2 and S[1] != 0 else None
    return [text, [str(s) for s in S], [str(w) for w in W], str(g), str(L), txt(k), [txt(x) for x in sh],
            [dec(x, 4) for x in sh], [dec(x * 100, 2) for x in sh], txt(ab) if ab is not None else None, dec(ab, 4) if ab is not None else None]

def mk(parts): return ':'.join(p[0] for p in parts), [p[1] for p in parts]
def whole(n): return (str(n), Fr(n))
def decimal(n, scale): q = Fr(n, 10 ** scale); s = str(abs(n)).rjust(scale + 1, '0'); t = s[:-scale] + '.' + s[-scale:] if scale else s; return (('-' if n < 0 else '') + t, q)
def frac(a, b): return ('%d/%d' % (a, b), Fr(a, b))
def mixed(w, a, b): return ('%d %d/%d' % (w, a, b), w + Fr(a, b))

ok = []; seen = set()
def add(parts):
    text, terms = mk(parts)
    if text in seen or all(t == 0 for t in terms): return
    seen.add(text); ok.append(row(text, terms))

# the CEO note
for t in ['12:18', '45:60', '2:3', '4:6', '3:4', '1.5:2.5', '400:5', '3:2', '2:3:4', '100:60', '900:600:400', '8:12', '20:30']:
    add([(p, Fr(p)) if '.' not in p else (p, Fr(p)) for p in t.split(':')])
# random whole two-term and multi-term, with a forced common factor
for _ in range(70):
    k = R.randint(1, 60); a, b = R.randint(1, 40), R.randint(1, 40); add([whole(a * k), whole(b * k)])
for _ in range(70):
    n = R.randint(3, 6); k = R.randint(1, 30); add([whole(R.randint(1, 25) * k) for _ in range(n)])
# decimals with up to four places
for _ in range(60):
    n = R.randint(2, 4); sc = R.randint(1, 4); add([decimal(R.randint(1, 99999), R.randint(0, sc)) for _ in range(n)])
# fractions and mixed numbers
for _ in range(50):
    n = R.randint(2, 4); add([frac(R.randint(1, 20), R.randint(1, 20)) for _ in range(n)])
for _ in range(25): add([mixed(R.randint(1, 5), R.randint(1, 6), R.randint(7, 12)), mixed(R.randint(1, 5), R.randint(1, 6), R.randint(7, 12))])
for _ in range(20): add([frac(R.randint(1, 15), R.randint(2, 15)), decimal(R.randint(1, 500), R.randint(1, 3)), whole(R.randint(1, 30))])
# scientific notation
for t in ['1e3:2e3', '2.5e2:5e2', '1e-3:1e-2:5e-3', '3e5:9e5', '4e-2:6e-2']:
    parts = []
    for p in t.split(':'):
        m, e = p.split('e'); parts.append((p, Fr(m) * Fr(10) ** int(e)))
    add(parts)
# zeros
for _ in range(25):
    n = R.randint(2, 4); v = [R.randint(0, 20) for _ in range(n)]
    if sum(v) == 0: continue
    add([whole(x) for x in v])
add([whole(0), whole(5)]); add([whole(7), whole(0)]); add([whole(0), whole(0), whole(9)])
# large integers with a big common factor (30 to 55 digits)
for _ in range(25):
    k = R.randint(10 ** 24, 10 ** 30); n = R.randint(2, 4); add([whole(R.randint(1, 10 ** 12) * k) for _ in range(n)])
for _ in range(10):
    n = R.randint(2, 3); add([decimal(R.randint(1, 10 ** 20), 18) for _ in range(n)])
# equal terms, 1 term values, and a ratio already in lowest terms
for t in ['7:7', '1:1', '5:5:5', '1:2:3:4:5:6:7:8:9:10:11:12', '13:17', '97:89', '1:1000000007']: add([whole(int(p)) for p in t.split(':')])
# spaces and thousands commas are read as the engine's parser does
add([(' 12 ', Fr(12)), (' 18 ', Fr(18))]); add([('1,000', Fr(1000)), ('2,500', Fr(2500))])

err = ['', ' ', '12', '12:', ':12', '12::18', 'a:b', '1:2:abc', '-1:2', '2:-3', '0:0', '0:0:0', '1/0:2', '1:2/0', '1.2.3:4', '1:2:3:4:5:6:7:8:9:10:11:12:13', '3 : 4 : ', '1e999:2',
       '1 2:3', '12/:3', '--2:3', '\u22122:3']
empty = ['', ' ', '12', '   ']
json.dump({'ok': ok, 'err': err, 'empty': empty}, open('tests/ratio_vectors.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(ok), 'ok vectors,', len(err), 'rejected,', len(empty), 'empty')
