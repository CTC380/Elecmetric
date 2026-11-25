"""Independent reference for the seeded generator in tools/rng_engine.js (Python integers, no shared code).
Writes tests/rng_vectors.json: for each case the exact values the engine must produce. Run: python3 tests/gen_rng_vectors.py"""
import json
M = 0xFFFFFFFF
def imul(a, b): return (a * b) & M
def cyrb128(s):
    h1, h2, h3, h4 = 1779033703, 3144134277, 1013904242, 2773480762
    for ch in s:
        k = ord(ch)  # UTF-16 units equal code points for the BMP seeds used here
        h1 = h2 ^ imul(h1 ^ k, 597399067); h2 = h3 ^ imul(h2 ^ k, 2869860233)
        h3 = h4 ^ imul(h3 ^ k, 951274213); h4 = h1 ^ imul(h4 ^ k, 2716044179)
    h1 = imul(h3 ^ (h1 >> 18), 597399067); h2 = imul(h4 ^ (h2 >> 19), 2869860233)
    h3 = imul(h1 ^ (h3 >> 17), 951274213); h4 = imul(h2 ^ (h4 >> 19), 2716044179)
    h1 ^= (h2 ^ h3 ^ h4); h2 ^= h1; h3 ^= h1; h4 ^= h1
    return [h1 & M, h2 & M, h3 & M, h4 & M]
class Sfc32:
    def __init__(s, seed):
        s.a, s.b, s.c, s.d = cyrb128(seed)
        for _ in range(12): s.next()
        s.buf = []
    def next(s):
        t = (s.a + s.b) & M; s.a = s.b ^ (s.b >> 9); s.b = (s.c + ((s.c << 3) & M)) & M
        s.c = (((s.c << 21) & M) | (s.c >> 11)); s.d = (s.d + 1) & M; t = (t + s.d) & M; s.c = (s.c + t) & M
        return t
    def bytes(s, n):
        out = []
        while len(out) < n:
            w = s.next(); out += [w >> 24, (w >> 16) & 255, (w >> 8) & 255, w & 255]
        return out[:n]
def below(n, g):
    if n <= 1: return 0
    bits = (n - 1).bit_length(); nb = (bits + 7) // 8; mask = 255 >> (nb * 8 - bits)
    while True:
        b = g.bytes(nb); b[0] &= mask
        v = int.from_bytes(bytes(b), 'big')
        if v < n: return v
def gen(seed, lo, hi, count, unique):
    g = Sfc32(seed); span = hi - lo + 1; out = []
    if not unique:
        for _ in range(count): out.append(lo + below(span, g))
    else:
        m = {}
        for i in range(count):
            j = i + below(span - i, g); vi = m.get(i, i); vj = m.get(j, j); m[j] = vi; out.append(lo + vj)
    return [str(x) for x in out]
cases = []
for seed, lo, hi, count, unique in [
    ('ELECMETRIC2026', 1, 100, 10, False), ('ELECMETRIC2026', 1, 100, 10, True), ('abc', 1, 6, 20, False), ('', 0, 0, 3, False) if False else ('x', 5, 5, 3, False),
    ('seed-1', -50, 50, 15, False), ('seed-1', -50, 50, 101, True), ('lotto', 1, 49, 6, True), ('big', 10**40, 10**40 + 10**30, 5, False),
    ('big', -10**100, 10**100, 4, False), ('wide', 0, 2**64 - 1, 3, False), ('pow2', 0, 255, 12, False), ('pow2b', 0, 256, 12, False), ('caf\u00e9', 1, 1000, 8, True)]:
    cases.append({'seed': seed, 'min': str(lo), 'max': str(hi), 'count': count, 'unique': unique, 'values': gen(seed, lo, hi, count, unique)})
# Mode 02: decimals. Independent grid maths with Decimal: grid = multiples of 10^-places inside [min, max]; one integer index per draw, written back with fixed places.
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR, getcontext
getcontext().prec = 400
def dgen(seed, lo, hi, places, count, unique):
    q = Decimal(10) ** places; a = int((Decimal(lo) * q).to_integral_value(ROUND_CEILING)); b = int((Decimal(hi) * q).to_integral_value(ROUND_FLOOR))
    return [format((Decimal(int(v)) / q).quantize(Decimal(1).scaleb(-places)), 'f') for v in gen(seed, a, b, count, unique) for v in [int(v)]]
dec = []
for seed, lo, hi, pl, count, unique in [('ELECMETRIC2026', '1', '100', 2, 10, False), ('d1', '-0.5', '0.5', 1, 15, False), ('d2', '0', '1', 15, 4, False), ('d3', '1', '1.2', 1, 3, True),
    ('d4', '0.123', '0.987', 2, 10, False), ('d5', '-100', '100', 0, 8, False), ('d6', '-1', '-0.001', 3, 12, False), ('d7', '5', '5', 3, 3, False), ('d8', '0.5', '7.25', 2, 20, True), ('d9', '-12.345', '12.345', 3, 6, False)]:
    dec.append({'seed': seed, 'min': lo, 'max': hi, 'places': pl, 'count': count, 'unique': unique, 'values': dgen(seed, lo, hi, pl, count, unique)})
# Mode 03: unique numbers with an exclude list. Independent maths: list every allowed value explicitly, then index it with the unique positions 0..pool-1.
def ugen(seed, lo, hi, places, count, excl, dec):
    q = 10 ** places if dec else 1
    a = int((Decimal(lo) * q).to_integral_value(ROUND_CEILING)); b = int((Decimal(hi) * q).to_integral_value(ROUND_FLOOR))
    bad = set()
    for t in excl:
        v = Decimal(t) * q
        if v == v.to_integral_value() and a <= int(v) <= b: bad.add(int(v))
    pool = [x for x in range(a, b + 1) if x not in bad]
    idx = [int(i) for i in gen(seed, 0, len(pool) - 1, count, True)]
    vals = [pool[i] for i in idx]
    return [format((Decimal(v) / q).quantize(Decimal(1).scaleb(-places)), 'f') if dec else str(v) for v in vals], len(pool)
uniq = []
for seed, lo, hi, pl, count, excl, isdec in [('ELECMETRIC2026', '1', '100', 0, 8, [], False), ('u1', '1', '49', 0, 6, ['7', '13', '49', '1'], False), ('u2', '1', '10', 0, 8, ['3', '5', '99', '-4'], False),
    ('u3', '-20', '20', 0, 41 - 6, ['0', '-20', '20', '5', '5', '-5'], False), ('u4', '0', '1', 1, 8, ['0.5', '0.25', '0.30', '1'], True), ('u5', '0.5', '7.25', 2, 12, ['1.00', '2.5', '7.255', '0.5'], True),
    ('u6', '1', '1000000', 0, 20, ['1', '1000000', '500000'], False), ('u7', str(10**40), str(10**40 + 50), 0, 10, [str(10**40 + 7), str(10**40 + 8)], False), ('u8', '-1', '-0.001', 3, 15, ['-0.5'], True)]:
    vals, pool = ugen(seed, lo, hi, pl, count, excl, isdec)
    uniq.append({'seed': seed, 'min': lo, 'max': hi, 'places': pl, 'count': count, 'exclude': ' '.join(excl), 'dec': isdec, 'pool': pool, 'values': vals})

# Mode 04: statistical sampling. Independent Python implementation of the documented sampling methods (math module, fsum, statistics),
# including the 53-bit uniform u = (k + 0.5) / 2^53, Box-Muller, inversion, and the histogram rule. Values are compared as the rounded strings.
import math
def unif(g):
    b = g.bytes(7); k = int.from_bytes(bytes([b[0] & 31] + b[1:]), 'big'); return (k + 0.5) / 2**53
def poisson_inv(lam, u):
    x = 0; p = math.exp(-lam); s = p; lim = math.ceil(lam + 40 * math.sqrt(lam) + 100)
    while u > s and x < lim:
        x += 1; p *= lam / x; s += p
    return x
def binom_inv(n, pr, u):
    if pr == 0: return 0
    if pr == 1: return n
    flip = pr > 0.5; q = 1 - pr if flip else pr; r = q / (1 - q); pk = (1 - q) ** n; s = pk; k = 0
    while u > s and k < n:
        pk *= (n - k) / (k + 1) * r; k += 1; s += pk
    return n - k if flip else k
def hist(vals, bins, discrete):
    n = len(vals); mn = min(vals); mx = max(vals)
    if discrete:
        rng = int(mx - mn + 1); w = 1
        if bins: k = min(bins, rng); w = -(-rng // k)
        elif rng > 60: w = -(-rng // 40)
        k = -(-rng // w); c = [0] * k
        for v in vals: c[int((v - mn) // w)] += 1
        return c
    k = bins or (1 if n < 2 else min(30, max(5, math.ceil(math.log(n) / math.log(2)) + 1)))
    if mn == mx: k = 1
    w = 0 if k == 1 else (mx - mn) / k; c = [0] * k
    for v in vals: c[0 if k == 1 else min(k - 1, math.floor((v - mn) / w))] += 1
    return c
def sgen(seed, dist, p, count, places, bins):
    g = Sfc32(seed); xs = []; z1 = None
    for _ in range(count):
        if dist == 'uniform': x = p[0] + (p[1] - p[0]) * unif(g)
        elif dist == 'normal':
            if z1 is not None: x = z1; z1 = None
            else:
                u = unif(g); c = unif(g); a = math.sqrt(-2 * math.log(u)); x = a * math.cos(2 * math.pi * c); z1 = a * math.sin(2 * math.pi * c)
            x = p[0] + p[1] * x
        elif dist == 'exponential': x = -math.log(unif(g)) / p[0]
        elif dist == 'triangular':
            a, m, b = p; u = unif(g); fc = (m - a) / (b - a)
            x = a + math.sqrt(u * (b - a) * (m - a)) if u < fc else b - math.sqrt((1 - u) * (b - a) * (b - m))
        elif dist == 'poisson': x = poisson_inv(p[0], unif(g))
        else: x = binom_inv(int(p[0]), p[1], unif(g))
        xs.append(x)
    disc = dist in ('poisson', 'binomial')
    strs = [str(v) for v in xs] if disc else [('%.' + str(places) + 'f') % v for v in xs]
    strs = [t[1:] if (not disc and t.startswith('-0') and float(t) == 0) else t for t in strs]
    vals = [float(t) for t in strs]; n = len(vals)
    sd = None
    if n > 1:
        m = math.fsum(vals) / n; sd = math.sqrt(math.fsum((v - m) ** 2 for v in vals) / (n - 1))
    sv = sorted(vals); med = sv[n // 2] if n % 2 else (sv[n // 2 - 1] + sv[n // 2]) / 2
    return {'values': strs, 'mean': math.fsum(vals) / n, 'median': med, 'sd': sd, 'min': sv[0], 'max': sv[-1], 'sum': math.fsum(vals), 'hist': hist(vals, bins, disc)}
samp = []
for seed, dist, p, count, places, bins in [('ELECMETRIC2026', 'normal', [230, 5], 12, 3, 0), ('n1', 'normal', [0, 1], 501, 4, 0), ('n2', 'normal', [-40.5, 12.25], 2000, 6, 12), ('n3', 'normal', [0, 1], 1, 2, 0),
    ('u1', 'uniform', [210, 250], 300, 2, 0), ('u2', 'uniform', [-1, 1], 1000, 8, 7), ('e1', 'exponential', [0.002], 400, 3, 0), ('e2', 'exponential', [5], 1500, 6, 0),
    ('t1', 'triangular', [0, 2, 10], 800, 4, 0), ('t2', 'triangular', [5, 5, 9], 300, 3, 0), ('t3', 'triangular', [-3, 1, 1], 300, 3, 0),
    ('p1', 'poisson', [4], 1000, 0, 0), ('p2', 'poisson', [0.2], 500, 0, 0), ('p3', 'poisson', [350], 400, 0, 0), ('p4', 'poisson', [700], 100, 0, 5),
    ('b1', 'binomial', [20, 0.3], 1000, 0, 0), ('b2', 'binomial', [1000, 0.9], 500, 0, 0), ('b3', 'binomial', [1, 0.5], 300, 0, 0), ('b4', 'binomial', [10, 1], 5, 0, 0), ('b5', 'binomial', [10, 0], 5, 0, 0), ('b6', 'binomial', [500, 0.02], 700, 0, 0)]:
    r = sgen(seed, dist, p, count, places, bins); r.update({'seed': seed, 'dist': dist, 'p': p, 'count': count, 'places': places, 'bins': bins}); samp.append(r)
# Mode 05: engineering test data. Independent Python implementation of the documented method: one stream per parameter (seed + "|p" + n; error stream + "|e"),
# uniform, truncated normal (Box-Muller, redraw outside the limits), triangular and log-uniform values, exact Decimal grid check of the rounded value, and the
# measurement-tolerance column. Values are compared as the rounded strings, the statistics numerically.
def egrid(x, places, lo, hi):
    q = Decimal(10) ** places
    a = int((Decimal(lo) * q).to_integral_value(ROUND_CEILING)); b = int((Decimal(hi) * q).to_integral_value(ROUND_FLOOR))
    k = int((Decimal(x) * q).to_integral_value(ROUND_HALF_UP))  # x is the exact binary value, as in toFixed
    k = min(max(k, a), b)
    return format((Decimal(k) / q).quantize(Decimal(1).scaleb(-places)), 'f')
from decimal import ROUND_HALF_UP
def egen(seed, count, par):
    lo, hi = float(par['min']), float(par['max']); d = par['places']; dist = par['dist']
    vg = Sfc32(seed + '|p' + str(par['idx'])); eg = Sfc32(seed + '|p' + str(par['idx']) + '|e')
    typ = float(par['typ']) if par.get('typ') not in (None, '') else (lo + hi) / 2
    sd = (hi - lo) / 6; z1 = None; vals = []; meas = []
    tol = par.get('tol') or ''; pct = tol.endswith('%'); tv = float(tol[:-1] if pct else tol) if tol else 0.0
    for _ in range(count):
        if dist == 'uniform': x = lo + (hi - lo) * unif(vg)
        elif dist == 'loguniform': x = math.exp(math.log(lo) + (math.log(hi) - math.log(lo)) * unif(vg))
        elif dist == 'triangular':
            u = unif(vg); fc = (typ - lo) / (hi - lo)
            x = lo + math.sqrt(u * (hi - lo) * (typ - lo)) if u < fc else hi - math.sqrt((1 - u) * (hi - lo) * (hi - typ))
        else:
            while True:
                if z1 is not None: z = z1; z1 = None
                else:
                    u = unif(vg); c = unif(vg); r = math.sqrt(-2 * math.log(u)); z = r * math.cos(2 * math.pi * c); z1 = r * math.sin(2 * math.pi * c)
                x = typ + sd * z
                if lo <= x <= hi: break
        x = min(max(x, lo), hi)
        s = egrid(x, d, par['min'], par['max']); vals.append(s)
        if tv > 0:
            base = float(s); e = (abs(base) * tv / 100 if pct else tv) * (2 * unif(eg) - 1)
            t = ('%.' + str(d) + 'f') % (base + e); t = t[1:] if t.startswith('-0') and float(t) == 0 else t; meas.append(t)
    fv = [float(v) for v in vals]; n = len(fv); m = math.fsum(fv) / n
    sdv = math.sqrt(math.fsum((v - m) ** 2 for v in fv) / (n - 1)) if n > 1 else None
    out = {'values': vals, 'measured': meas, 'mean': m, 'sd': sdv, 'min': min(fv), 'max': max(fv)}
    if meas:
        fm = [float(v) for v in meas]; errs = [b - a for a, b in zip(fv, fm)]
        out['meanErr'] = math.fsum(errs) / n; out['maxAbsErr'] = max(abs(e) for e in errs); out['outside'] = sum(1 for v in fm if v < lo or v > hi)
    return out
eng = []
EP = [
    ('ELECMETRIC2026', 50, [dict(name='Voltage', min='210', max='250', typ='230', dist='normal', places=1, tol='0.5%'), dict(name='Current', min='0', max='100', dist='uniform', places=2),
        dict(name='Frequency', min='45', max='55', typ='50', dist='normal', places=2, tol='0.01'), dict(name='Power factor', min='0.70', max='1.00', typ='0.95', dist='triangular', places=3)]),
    ('e1', 300, [dict(name='Resistance', min='1', max='1000', dist='loguniform', places=2), dict(name='Insulation', min='10', max='10000', dist='loguniform', places=1, tol='5%')]),
    ('e2', 500, [dict(name='Temperature', min='20', max='80', typ='45', dist='normal', places=1, tol='0.5')]),
    ('e3', 400, [dict(name='Edge normal', min='0', max='10', typ='0', dist='normal', places=3), dict(name='Edge normal hi', min='0', max='10', typ='10', dist='normal', places=3)]),
    ('e4', 300, [dict(name='Off grid', min='0.15', max='0.45', dist='uniform', places=1), dict(name='Off grid tri', min='0.15', max='0.45', typ='0.3', dist='triangular', places=1)]),
    ('e5', 300, [dict(name='Negative', min='-5', max='5', dist='uniform', places=2, tol='0.2'), dict(name='Negative pct', min='-50', max='-10', typ='-20', dist='triangular', places=1, tol='2%')]),
    ('e6', 200, [dict(name='Whole', min='1', max='6', dist='uniform', places=0), dict(name='Whole normal', min='0', max='100', dist='normal', places=0, tol='1')]),
    ('e7', 150, [dict(name='Fine', min='0', max='1', dist='uniform', places=15), dict(name='Wide', min='-1000000', max='1000000', typ='1000', dist='normal', places=4, tol='0.001%')]),
    ('caf\u00e9', 120, [dict(name='A', min='0.5', max='7.25', dist='triangular', typ='7.25', places=2, tol='0.05'), dict(name='B', min='1e0'.replace('e0', ''), max='9', dist='loguniform', places=3)]),
    ('e8', 1, [dict(name='One', min='0', max='1', dist='uniform', places=2, tol='10%')]),
]
for seed, count, pars in EP:
    case = {'seed': seed, 'count': count, 'params': [], 'ref': []}
    for i, par in enumerate(pars, 1):
        par = dict(par); par['idx'] = i; res = egen(seed, count, par)
        case['params'].append({k: v for k, v in par.items() if k != 'idx'}); case['ref'].append(res)
    eng.append(case)

# Multiple sets (independent derivation of the documented rule: set 1 uses the seed as typed, set k >= 2 uses seed + "|set k") and exact statistics for Modes 01 to 03.
from decimal import getcontext, ROUND_HALF_UP
getcontext().prec = 250
def set_seed(seed, k): return seed if k == 1 else seed + '|set ' + str(k)
def pstats(vals, places):
    D = [Decimal(v) for v in vals]; n = len(D); mean = sum(D) / n; sv = sorted(D)
    med = sv[n // 2] if n % 2 else (sv[n // 2 - 1] + sv[n // 2]) / 2
    sd = (sum((x - mean) ** 2 for x in D) / (n - 1)).sqrt() if n > 1 else None
    def r(x):
        t = format(x.quantize(Decimal(1).scaleb(-(places + 4)), rounding=ROUND_HALF_UP), 'f')
        if '.' in t: t = t.rstrip('0').rstrip('.')
        return '0' if t == '-0' else t
    return {'mean': r(mean), 'median': r(med), 'sd': None if sd is None else r(sd)}
for c in cases: c['stats'] = pstats(c['values'], 0)
for c in dec: c['stats'] = pstats(c['values'], c['places'])
for c in uniq: c['stats'] = pstats(c['values'], c['places'] if c['dec'] else 0)
multi = []
for seed, lo, hi, count, unique, n in [('ELECMETRIC2026', 1, 100, 6, False, 4), ('m2', 1, 49, 6, True, 5), ('big', 10**30, 10**30 + 10**20, 3, False, 3), ('m4', -5, 5, 8, False, 12)]:
    multi.append({'seed': seed, 'min': str(lo), 'max': str(hi), 'count': count, 'unique': unique, 'sets': n, 'values': [gen(set_seed(seed, k), lo, hi, count, unique) for k in range(1, n + 1)]})
meng = []
for seed, count, pars in EP[:2]:
    n = 3; case = {'seed': seed, 'count': count, 'sets': n, 'params': [], 'ref': []}
    for i, par in enumerate(pars, 1):
        par = dict(par); par['idx'] = i; case['params'].append({k: v for k, v in par.items() if k != 'idx'})
    for k in range(1, n + 1):
        sd_ = set_seed(seed, k); one = []
        for i, par in enumerate(pars, 1):
            par = dict(par); par['idx'] = i; one.append(egen(sd_, count, par))
        case['ref'].append(one)
    meng.append(case)
json.dump({'cases': cases, 'dec': dec, 'uniq': uniq, 'samp': samp, 'eng': eng, 'multi': multi, 'meng': meng}, open('tests/rng_vectors.json', 'w'), indent=1)
print(len(cases), len(dec), len(uniq), len(samp), len(eng), 'cases written')
