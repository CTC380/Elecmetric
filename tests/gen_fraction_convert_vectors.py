"""Independent vectors for the converter in tools/fraction_engine.js (Fraction Calculator, Mode 03: Decimal & Fraction Converter).
Every expected value is computed here with Python's fractions.Fraction and decimal.Decimal, and by routes that differ from the engine:
  - a repeating decimal ip.fp(rp) is read as ip.fp + rp / (10^a (10^b - 1)), not by the engine's subtraction of two integers;
  - decimal expansions come from number theory (the factors 2 and 5 of the denominator give the digits before the block, the multiplicative order
    of 10 modulo the rest gives the block length), not from long division;
  - the 'rounded repeating decimal' approximation is found by brute force over denominators, not by the continued-fraction walk;
  - the largest-denominator approximation is Fraction.limit_denominator; the difference is formatted with decimal.Decimal.
Run: python3 tests/gen_fraction_convert_vectors.py  -> tests/fraction_convert_vectors.json"""
import json, random
from fractions import Fraction as Fr
from math import gcd
from decimal import Decimal, Context, ROUND_HALF_UP
R = random.Random(20261122)

def ftxt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def mixed(q):
    if q.denominator == 1: return str(q.numerator)
    if abs(q) < 1: return ftxt(q)
    w = abs(q.numerator) // q.denominator; r = abs(q.numerator) % q.denominator
    return ('-' if q < 0 else '') + '%d %d/%d' % (w, r, q.denominator)

def dec_text(q):
    """(text, exact, preperiod, period) by number theory."""
    n, d = abs(q.numerator), q.denominator
    ip = n // d; neg = q < 0
    sgn = '-' if neg and n else ''
    if n % d == 0: return sgn + str(ip), True, 0, 0
    t, v2, v5 = d, 0, 0
    while t % 2 == 0: t //= 2; v2 += 1
    while t % 5 == 0: t //= 5; v5 += 1
    pre = max(v2, v5)
    if t == 1:
        digs = str(((n % d) * 10 ** pre) // d).zfill(pre)
        return sgn + str(ip) + '.' + digs, True, pre, 0
    per, x = 1, 10 % t
    while x != 1: x = x * 10 % t; per += 1
    digs = str(((n % d) * 10 ** (pre + per)) // d).zfill(pre + per)
    return sgn + str(ip) + '.' + digs[:pre] + '(' + digs[pre:] + ')', False, pre, per

def round_text(q, p):
    v = abs(q) * 10 ** p; fl = v.numerator // v.denominator
    exact = v.denominator == 1
    if v - fl >= Fr(1, 2): fl += 1
    s = str(fl)
    if p > 0:
        s = s.zfill(p + 1); s = s[:-p] + '.' + s[-p:]
    return ('-' if q < 0 and fl != 0 else '') + s, exact

def sci(fr, sig=4):
    if fr == 0: return '0'
    a = abs(fr); dv = Context(prec=sig, rounding=ROUND_HALF_UP).divide(Decimal(a.numerator), Decimal(a.denominator))
    digs = ''.join(map(str, dv.as_tuple().digits)).rstrip('0') or '0'; e = dv.adjusted()
    return ('-' if fr < 0 else '') + digs[0] + ('.' + digs[1:] if len(digs) > 1 else '') + 'e' + str(e)

def approx_brute(x, k):
    """smallest denominator q with a fraction in [x - h, x + h), h = 1/(2 10^k); only denominators with q^2 * 100 <= 10^k count."""
    h = Fr(1, 2 * 10 ** k); lo, hi = x - h, x + h; q = 1
    while q * q * 100 <= 10 ** k:
        n = -((-lo.numerator * q) // lo.denominator)   # ceil(lo * q)
        if Fr(n, q) < hi: return Fr(n, q)
        q += 1
    return None

def row(txt, q, kind, places, pct_in=False, typed_dec_k=None, approx=None):
    d, ex, pre, per = dec_text(q); pc = dec_text(q * 100); rt, re_ = round_text(q, places); rpt, _ = round_text(q * 100, places)
    return [txt, kind, ftxt(q), mixed(q), d, ex, pre, per, pc[0] + '%', pc[1], places, rt, re_, rpt, approx]

def approx_for(q, k):
    """expected approximation text, or None, for a typed terminating decimal with k >= 3 places (brute force)."""
    a = approx_brute(abs(q), k)
    if a is None or a == abs(q): return None
    return ftxt(-a if q < 0 else a)

rows = []
# 1. terminating decimals, typed: sign, integer part, leading zeros, ".5", trailing zeros
for _ in range(260):
    k = R.choice([1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10]); ip = R.choice([0, 0, 0, 1, 2, 7, 12, 100, 4096, 123456]); fp = ''.join(R.choice('0123456789') for _ in range(k))
    if R.random() < 0.15: fp = fp[:-1] + '0'
    sg = R.choice(['', '', '-', '+']); body = ('' if ip == 0 and R.random() < 0.3 else str(ip)) + '.' + fp
    if body == '.' + fp and not fp: continue
    q = Fr((str(ip) + '.' + fp)); q = -q if sg == '-' else q
    places = R.choice([0, 2, 4, 6, 6, 8, 12]); kk = len(fp)
    ap = approx_for(q, kk) if (kk >= 3 and q != 0) else None
    rows.append(row(sg + body, q, 'decimal', places, approx=ap))
for t, q in [('0.5', Fr(1, 2)), ('0.25', Fr(1, 4)), ('0.125', Fr(1, 8)), ('0.375', Fr(3, 8)), ('0.625', Fr(5, 8)), ('0.75', Fr(3, 4)), ('1.25', Fr(5, 4)), ('2.5', Fr(5, 2)), ('.125', Fr(1, 8)), ('-0.0625', Fr(-1, 16)), ('0.3333', Fr(3333, 10000)), ('0.666667', Fr(666667, 1000000)), ('0.142857', Fr(142857, 1000000)), ('3.14159', Fr(314159, 100000)), ('0.000', Fr(0)), ('0.0', Fr(0))]:
    kk = len(t.split('.')[1]); rows.append(row(t, q, 'decimal', 6, approx=(approx_for(q, kk) if kk >= 3 and q != 0 else None)))
# 1b. planted: a fraction with a small denominator rounded to k places must come back as that fraction (also for large k)
planted = []
for _ in range(60):
    k = R.choice([5, 6, 8, 12, 20, 40]); lim = int((10 ** ((k - 2) / 2)) ** 1) if k < 30 else 10 ** 14
    qd = R.randint(2, min(lim, 400)); pn = R.randint(1, 3 * qd)
    f = Fr(pn, qd)
    if qd * qd * 100 > 10 ** k or f.denominator != qd: continue
    # round half up to k places
    v = f * 10 ** k; fl = v.numerator // v.denominator
    if v - fl >= Fr(1, 2): fl += 1
    s = str(fl).zfill(k + 1); txt = s[:-k] + '.' + s[-k:]
    qx = Fr(txt)
    exp = None if f == qx else ftxt(f)
    planted.append([txt, ftxt(qx), exp, k])
# 2. repeating decimals ip.fp(rp)
rep = []
for _ in range(200):
    ip = R.choice(['0', '0', '1', '5', '12', '300', '']); a = R.choice([0, 0, 1, 2, 3, 5]); b = R.choice([1, 1, 2, 3, 4, 6, 9, 15])
    fp = ''.join(R.choice('0123456789') for _ in range(a)); rp = ''.join(R.choice('0123456789') for _ in range(b))
    if R.random() < 0.1: rp = '9' * b
    if R.random() < 0.05: rp = '0' * b
    sg = R.choice(['', '', '-']); txt = sg + ip + '.' + fp + '(' + rp + ')'
    q = Fr(int((ip or '0') + fp), 10 ** a) + Fr(int(rp), 10 ** a * (10 ** b - 1)); q = -q if sg == '-' else q
    rep.append(row(txt, q, 'repeating', R.choice([0, 3, 6, 10]), approx=None))
for t, q in [('0.(3)', Fr(1, 3)), ('0.(6)', Fr(2, 3)), ('0.58(3)', Fr(7, 12)), ('0.(142857)', Fr(1, 7)), ('0.(9)', Fr(1)), ('0.4(9)', Fr(1, 2)), ('1.2(34)', Fr(611, 495)), ('-0.1(6)', Fr(-1, 6)), ('0.(0)', Fr(0)), ('.(3)', Fr(1, 3)), ('0.(012345679)', Fr(1, 81))]:
    rep.append(row(t, q, 'repeating', 6))
# 3. fractions, mixed numbers, whole numbers
fr = []
for _ in range(240):
    n = R.randint(0, 400); d = R.randint(1, 400); sn = R.choice(['', '', '-']); sd = R.choice(['', '', '', '-'])
    q = Fr(n, d) * (-1 if sn == '-' else 1) * (-1 if sd == '-' else 1)
    fr.append(row(sn + str(n) + '/' + sd + str(d), q, 'fraction', R.choice([0, 2, 5, 8])))
for _ in range(60):
    n = R.randint(1, 3000); d = R.choice([3, 6, 7, 9, 11, 12, 13, 17, 19, 21, 33, 37, 41, 99, 101, 303, 1001]); q = Fr(n, d)
    fr.append(row('%d/%d' % (n, d), q, 'fraction', 6))
for _ in range(80):
    w = R.randint(0, 50); d = R.randint(2, 60); n = R.randint(1, 80); neg = R.random() < 0.3; q = Fr(w * d + n, d); q = -q if neg else q
    txt = ('-' if neg else '') + '%d %d/%d' % (w, n, d); fr.append(row(txt, q, 'mixed', 6))
for t, q in [('1/3', Fr(1, 3)), ('2/3', Fr(2, 3)), ('1/7', Fr(1, 7)), ('3/8', Fr(3, 8)), ('7/12', Fr(7, 12)), ('22/7', Fr(22, 7)), ('1/81', Fr(1, 81)), ('1/97', Fr(1, 97)), ('5/16', Fr(5, 16)), ('1/1024', Fr(1, 1024)), ('0/5', Fr(0)), ('7/1', Fr(7)), ('2 1/3', Fr(7, 3)), ('-1 3/4', Fr(-7, 4)), ('1.5/2.5', Fr(3, 5)), ('0.75/0.5', Fr(3, 2)), ('3/-4', Fr(-3, 4)), ('-3/-4', Fr(3, 4))]:
    fr.append(row(t, q, 'mixed' if ' ' in t else 'fraction', 6))
for t, q in [('12', Fr(12)), ('-7', Fr(-7)), ('0', Fr(0)), ('1000000', Fr(10 ** 6)), ('5.', Fr(5))]:
    fr.append(row(t, q, 'integer', 6))
# 4. percentages
pc = []
for _ in range(120):
    kind = R.choice(['dec', 'dec', 'int', 'frac', 'rep', 'mixed'])
    if kind == 'dec':
        k = R.randint(1, 5); v = R.randint(1, 10 ** 6); txt = '%.*f' % (k, v / 10 ** k); q = Fr(txt)
    elif kind == 'int': v = R.randint(0, 500); txt = str(v); q = Fr(v)
    elif kind == 'frac': a = R.randint(1, 50); b = R.randint(1, 50); txt = '%d/%d' % (a, b); q = Fr(a, b)
    elif kind == 'rep': a = R.randint(0, 3); b = R.randint(1, 4); fp = ''.join(R.choice('0123456789') for _ in range(a)); rp = ''.join(R.choice('0123456789') for _ in range(b)); ip = str(R.randint(0, 99)); txt = ip + '.' + fp + '(' + rp + ')'; q = Fr(int(ip + fp), 10 ** a) + Fr(int(rp), 10 ** a * (10 ** b - 1))
    else: w = R.randint(1, 9); b = R.randint(2, 9); a = R.randint(1, b - 1); txt = '%d %d/%d' % (w, a, b); q = Fr(w * b + a, b)
    sg = R.choice(['', '', '-']); sp = R.choice(['', ' ']); full = sg + txt + sp + '%'; q = (-q if sg == '-' else q) / 100
    pc.append(row(full, q, 'integer' if kind == 'int' else 'decimal' if kind == 'dec' else 'repeating' if kind == 'rep' else 'mixed' if kind == 'mixed' else 'fraction', 6))
for t, q in [('37.5%', Fr(3, 8)), ('12.5%', Fr(1, 8)), ('50%', Fr(1, 2)), ('100%', Fr(1)), ('0%', Fr(0)), ('150%', Fr(3, 2)), ('33.(3)%', Fr(1, 3)), ('0.1%', Fr(1, 1000)), ('1/3%', Fr(1, 300)), ('-25%', Fr(-1, 4))]:
    kind = 'repeating' if '(' in t else 'fraction' if '/' in t else 'integer' if '.' not in t else 'decimal'
    pc.append(row(t, q, kind, 6))
# 5. scientific notation
sn = []
for _ in range(50):
    m = R.choice(['1.25', '5', '0.5', '12.34', '9.99', '123', '0.001', '7.5']); e = R.randint(-12, 12); q = Fr(m) * Fr(10) ** e
    kind = 'integer' if q.denominator == 1 and True else 'decimal'
    sn.append([m + 'e' + str(e), ftxt(q), mixed(q), dec_text(q)[0]])
# 6. largest-denominator approximations (Python's own Fraction.limit_denominator) and the difference in scientific notation
lim = []
for _ in range(120):
    kind = R.choice(['dec', 'dec', 'frac', 'big'])
    if kind == 'dec': k = R.randint(1, 8); txt = '%.*f' % (k, R.randint(1, 10 ** 7) / 10 ** k); q = Fr(txt)
    elif kind == 'frac': a = R.randint(1, 5000); b = R.randint(1, 5000); txt = '%d/%d' % (a, b); q = Fr(a, b)
    else: txt = '3.14159265358979323846'; q = Fr(txt) * R.choice([1, 2, 5, 10, Fr(1, 3)]); txt = txt if q == Fr(txt) else None
    if txt is None: continue
    neg = R.random() < 0.25; M = R.choice([2, 4, 8, 10, 16, 32, 64, 100, 128, 1000, 1024, 10 ** 6, 10 ** 12])
    q = -q if neg else q; txt = ('-' if neg else '') + txt
    a = (-(-q).limit_denominator(M)) if neg else q.limit_denominator(M)
    lim.append([txt, str(M), ftxt(a), a == q, sci(q - a, 4)])
sc = []
for _ in range(80):
    e = R.randint(-30, 30); n = R.randint(1, 10 ** 8); d = R.randint(1, 10 ** 8); f = Fr(n, d) * Fr(10) ** e
    if R.random() < 0.3: f = -f
    sc.append([ftxt(f), sci(f, 4), sci(f, 6)])
sc += [['1/1', '1e0', '1.00000'.rstrip('0') and sci(Fr(1), 6)], ['9999/10000', sci(Fr(9999, 10000)), sci(Fr(9999, 10000), 6)], ['99995/100000', sci(Fr(99995, 100000)), sci(Fr(99995, 100000), 6)], ['1/3', sci(Fr(1, 3)), sci(Fr(1, 3), 6)]]
# 7. rounding directly (half away from zero)
rnd = []
for _ in range(100):
    n = R.randint(-10 ** 6, 10 ** 6); d = R.choice([1, 2, 3, 4, 7, 8, 16, 125, 1000, 99, 10 ** 5]); p = R.choice([0, 1, 2, 3, 6, 10]); q = Fr(n, d); t, e = round_text(q, p)
    rnd.append([ftxt(q), p, t, e])
rnd += [[ftxt(Fr(5, 2)), 0, '3', False], [ftxt(Fr(-5, 2)), 0, '-3', False], [ftxt(Fr(1, 1000)), 2, '0.00', False], [ftxt(Fr(-1, 1000)), 2, '0.00', False]]
err = ['', '   ', 'abc', '1/0', '0/0', '5/0.0', '3 1/0', '1/2/3', '1,5', '1,000/3', '0.333...', '0.3333…', '0.(', '0.()', '(3)', '5(3)', '0.(3', '0.3)', '1.2.3', '.', '-', '+', '--1', '%', '%5', '5%%', '5%3', '1e', 'e5', '1e999', '1e-999', '0.(3)e2', '2 6', '2 1.5/3', '1.5 1/2', '2 1/3 1/4', '1 2 3/4', '1/', '/2', 'x/2', '1/x', '1/-', '(1/2)', '1+1', '0x1F', '1_000', '∞', '5 %%', '1' * 401]
perr = [['0.5', '51'], ['0.5', '-1'], ['0.5', 'x'], ['0.5', '1.5'], ['0.5', '100']]
merr = ['0', '-3', 'x', '1.5', '1' * 16, '1e3']
json.dump({'dec': rows, 'planted': planted, 'rep': rep, 'frac': fr, 'pct': pc, 'sci_in': sn, 'limit': lim, 'sci': sc, 'round': rnd, 'err': err, 'places_err': perr, 'maxden_err': merr}, open('tests/fraction_convert_vectors.json', 'w'), ensure_ascii=False)
print(len(rows), 'decimals,', len(planted), 'planted,', len(rep), 'repeating,', len(fr), 'fractions/mixed/whole,', len(pc), 'percent,', len(sn), 'scientific,', len(lim), 'limit_denominator,', len(sc), 'sci,', len(rnd), 'rounding,', len(err) + len(perr) + len(merr), 'errors')
