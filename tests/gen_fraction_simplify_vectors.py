"""Independent vectors for the simplifier in tools/fraction_engine.js (Fraction Calculator, Mode 02).
Expected values come from Python's math.gcd and fractions.Fraction, and prime factorisations from a separate trial-division routine
written here, not from the engine. Decimal fields are scaled to whole numbers by Python's own Fraction(str) parsing.
Run: python3 tests/gen_fraction_simplify_vectors.py  -> tests/fraction_simplify_vectors.json"""
import json, random
from fractions import Fraction as Fr
from math import gcd
R = random.Random(20261121)

def mixed(q):
    if q.denominator == 1: return str(q.numerator)
    if abs(q) < 1: return '%d/%d' % (q.numerator, q.denominator)
    w = abs(q.numerator) // q.denominator; r = abs(q.numerator) % q.denominator
    return ('-' if q < 0 else '') + '%d %d/%d' % (w, r, q.denominator)

def facs(n):
    n = abs(n); out = []; p = 2
    while p * p <= n:
        e = 0
        while n % p == 0: n //= p; e += 1
        if e: out.append([p, e])
        p += 1 if p == 2 else 2
    if n > 1: out.append([n, 1])
    return out

def row(n_txt, d_txt, N, D, k=0, extra=None):
    """N, D are the whole numbers after scaling both fields by 10**k (as a decimal field is scaled)."""
    sign = -1 if (N < 0) != (D < 0) and N != 0 else 1
    a, b = abs(N), abs(D)
    g = gcd(a, b)
    q = Fr(sign * a, b)
    return [n_txt, d_txt, str(q.numerator), str(q.denominator), str(g), mixed(q)]

fields = []   # (num text, den text) pairs
for _ in range(220):  # planted common factor
    g = R.randint(1, 40); a = R.randint(0, 60); b = R.randint(1, 60)
    n, d = a * g, b * g
    sn = R.choice(['', '-', '-', '+']) if n else ''
    sd = R.choice(['', '', '', '-'])
    fields.append((sn + str(n), sd + str(d)))
for n, d in [(18, 24), (-12, 18), (7, -14), (0, 5), (0, 1), (17, 5), (48, 1), (100, 8), (1, 1), (13, 13), (91, 7), (1001, 77), (360, 840), (1024, 4096), (5, 3), (-35, -49), (1000000007, 1000000009), (123456789, 987654321)]:
    fields.append((str(n), str(d)))
ok = []
for n, d in fields:
    ok.append(row(n, d, int(n), int(d)))
# decimals: scale both by 10**k where k is the larger count of decimal places
dec = []
for _ in range(60):
    kn = R.randint(0, 4); kd = R.randint(0, 4)
    n = R.randint(1, 5000); d = R.randint(1, 5000)
    sn = ('%d' % n) if kn == 0 else ('%.' + str(kn) + 'f') % (n / 10 ** kn)
    sd = ('%d' % d) if kd == 0 else ('%.' + str(kd) + 'f') % (d / 10 ** kd)
    k = max(kn if '.' in sn else 0, kd if '.' in sd else 0)
    fn = Fr(sn) * 10 ** k; fd = Fr(sd) * 10 ** k
    assert fn.denominator == 1 and fd.denominator == 1
    dec.append(row(sn, sd, int(fn), int(fd)))
for sn, sd in [('1.5', '2.5'), ('0.75', '1'), ('2.5', '5'), ('0.125', '1'), ('0.6', '0.9'), ('12.5', '100')]:
    k = max(len(sn.split('.')[1]) if '.' in sn else 0, len(sd.split('.')[1]) if '.' in sd else 0)
    dec.append(row(sn, sd, int(Fr(sn) * 10 ** k), int(Fr(sd) * 10 ** k)))
# mixed numbers written as "w n/d" in the single expression field
mix = []
for _ in range(50):
    w = R.randint(0, 20); d = R.randint(2, 40); n = R.randint(1, 60); neg = R.random() < 0.3
    N = w * d + n
    txt = ('-' if neg else '') + '%d %d/%d' % (w, n, d)
    mix.append([txt, str(Fr(-N if neg else N, d).numerator), str(Fr(-N if neg else N, d).denominator), str(gcd(N, d)), mixed(Fr(-N if neg else N, d))])
# very large numbers with a planted common factor of up to 150 digits
big = []
for _ in range(40):
    dg = R.choice([20, 40, 80, 150, 300]); gd = R.choice([5, 10, 30, 60])
    g = R.randint(10 ** (gd - 1), 10 ** gd); a = R.randint(10 ** (dg - 1), 10 ** dg); b = R.randint(10 ** (dg - 1), 10 ** dg)
    n, d = a * g, b * g
    if len(str(n)) > 390 or len(str(d)) > 390: continue
    big.append(row(str(n), str(d), n, d))
# prime factorisations (the engine's factor() against the independent routine here)
fac = []
for n in [2, 3, 4, 12, 18, 24, 97, 100, 360, 840, 1001, 2310, 4096, 65536, 99991, 1000003, 123456789, 600851475143, 999999000001] + [R.randint(2, 10 ** R.choice([3, 5, 8])) for _ in range(40)]:
    fac.append([str(n), facs(n)])
err = ['', '   ', '1/0', '0/0', '5/0', '3 1/0', '1/2/3', 'abc', '1/x', 'x/2', '1,000/3', '3 1.5/2', '1.5 1/2', '2 6', '--1/2', '1/-', '/', '/2', '1/', '1..2/3', '.', '1e3/2', '1 2 3/4', '(1/2)']
nd_err = [['', '5'], ['5', ''], ['1.2.3', '4'], ['5', '0'], ['5', '0.0'], ['abc', '2'], ['1,5', '2'], ['1', '2x'], ['-', '2'], ['1' + '0' * 401, '2']]
json.dump({'ok': ok, 'dec': dec, 'mixed': mix, 'big': big, 'factors': fac, 'err': err, 'nd_err': nd_err}, open('tests/fraction_simplify_vectors.json', 'w'), ensure_ascii=False)
print(len(ok), 'plain,', len(dec), 'decimal,', len(mix), 'mixed,', len(big), 'big,', len(fac), 'factorisations,', len(err) + len(nd_err), 'error cases')
