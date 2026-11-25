#!/usr/bin/env python3
"""Independent vectors for tools/numconv_engine.js (Binary Calculator, Mode 02: Number System Conversion). No code shared with the engine.

Integers use Python int(s, base) and format(). A fraction is a Fraction. Its digits in a target base T are NOT found by the engine's repeated multiplication:
the first n digits are floor(frac * T**n) written in base T (one big-integer division), a fraction ends after m digits when den divides T**m (found by removing the
factors it shares with T), and the repeating block is read from those digits, with its length from the pre-period and the multiplicative order of T modulo what is left of den.
Fixed width cases use masks (u = v & (2**W - 1)) and the textbook rules for each representation.
Run: python3 tests/gen_numconv_vectors.py > tests/numconv_vectors.json"""
import json, random, sys
from fractions import Fraction
from math import gcd
sys.set_int_max_str_digits(0)
random.seed(20261122)
BASES = {'bin': 2, 'oct': 8, 'dec': 10, 'hex': 16}
HARD = 4096
FR = [8, 16, 32, 64, 128]

def tostr(n, b):
    if n == 0: return '0'
    return format(n, {2: 'b', 8: 'o', 10: 'd', 16: 'X'}[b])

def digits_of(num, den, T, n):
    """first n digits of num/den (0 <= num/den < 1) in base T, as one integer division"""
    v = num * T ** n // den
    s = '' if v == 0 else (format(v, {2: 'b', 8: 'o', 10: 'd', 16: 'x'}[T]))
    return s.zfill(n).upper()

def frac_info(fr, T):
    """(pre, period) of the fraction fr in base T; period 0 means it ends after pre digits"""
    d = fr.denominator; pre = 0
    while gcd(d, T) > 1:
        d //= gcd(d, T); pre += 1
    if d == 1: return pre, 0
    # multiplicative order of T mod d (d is small enough in every generated case that this loop ends fast, or the case is left to the cap)
    x = T % d; k = 1
    while x != 1:
        x = x * T % d; k += 1
        if k > HARD: return pre, -1
    return pre, k

def target(neg, ip, fr, T, N, padbits):
    """expected [text, approx, repeat] for the magnitude ip + fr in base T, with sign neg"""
    s = tostr(ip, T)
    if T != 10 and padbits:
        w = padbits if T == 2 else -(-padbits // (3 if T == 8 else 4))
        s = s.zfill(w)
    sign = '-' if neg else ''
    if fr == 0: return [sign + s, False, None]
    pre, per = frac_info(fr, T)
    if per == 0:
        f = digits_of(fr.numerator, fr.denominator, T, pre)
        return [sign + s + '.' + f, False, None]
    if per == -1 or pre + per >= HARD:
        return [sign + s + '.' + digits_of(fr.numerator, fr.denominator, T, N), True, None]
    allf = digits_of(fr.numerator, fr.denominator, T, pre + per)
    blk = allf[pre:]
    rep = sign + s + '.' + allf[:pre] + '(' + blk + ')' if len(blk) <= 64 else None
    return [sign + s + '.' + digits_of(fr.numerator, fr.denominator, T, N), True, rep]

def typed(neg, idg, fdg, base, point=True):
    """write a number the way a person might"""
    i = idg
    if random.random() < .15 and base != 10: i = '0' * random.choice([1, 2, 4]) + i
    if base == 16 and random.random() < .5: i = i.lower(); fdg = fdg.lower()
    body = i + ('.' + fdg if point else '')
    if random.random() < .1: body = {2: '0b', 8: '0o', 16: '0x'}.get(base, '') + body
    sign = '-' if neg else random.choice(['', '', '+'])
    if neg and random.random() < .15: sign = '\u2212'
    out = sign + body
    if random.random() < .1 and len(out) > 5: out = out[:4] + ' ' + out[4:]
    if random.random() < .05 and len(out) > 5: out = out[:3] + '_' + out[3:]
    return out

def rand_digits(base, n):
    alpha = {2: '01', 8: '01234567', 10: '0123456789', 16: '0123456789ABCDEF'}[base]
    return ''.join(random.choice(alpha) for _ in range(n))

V = []

# ---- signed (any size) mode ----
for _ in range(900):
    base = random.choice([2, 8, 10, 16]); fid = {2: 'bin', 8: 'oct', 10: 'dec', 16: 'hex'}[base]
    li = random.choice([0, 1, 1, 2, 3, 4, 8, 16, 33, 64, 100, 150, 300])
    kind = random.choice(['int', 'int', 'int', 'frac', 'frac', 'frac'])
    if li == 0 and kind == 'int': li = 1
    idg = rand_digits(base, li) if li else ''
    idg = idg.lstrip('0') or ('0' if kind == 'int' or li else '')
    if kind == 'frac':
        lf = random.choice([1, 1, 2, 3, 4, 5, 8, 12, 20, 40]) if base != 10 else random.choice([1, 1, 2, 2, 3, 4, 5, 8, 20])
        fdg = rand_digits(base, lf)
        if random.random() < .15: fdg = fdg.rstrip('0') + '0' * random.choice([1, 2]); fdg = fdg or '0'
    else:
        fdg = ''
    neg = random.random() < .4
    N = random.choice(FR); pad = random.choice(['min', 'min', 'min', 'match', '8', '16', '32', '64', '4'])
    iv = int(idg, base) if idg else 0
    D = base ** len(fdg)
    fv = Fraction(int(fdg, base) if fdg else 0, D)
    if iv == 0 and fv == 0: neg = False
    text = typed(neg, idg if idg else '', fdg, base, point=bool(fdg))
    if not idg and not fdg: continue
    padbits = 0 if pad == 'min' else (0 if pad == 'match' and base == 10 else (len(idg) if False else None))
    if pad == 'match':
        # typed integer digits count (leading zeros typed count); recompute from the text actually typed
        t = text.replace(' ', '').replace('_', '')
        t = t.lstrip('+-\u2212')
        for pf in ('0b', '0o', '0x', '0B', '0O', '0X'):
            if base != 10 and t.startswith(pf) and pf[1].lower() == {2: 'b', 8: 'o', 16: 'x'}[base]: t = t[2:]; break
        intpart = t.split('.')[0]
        padbits = 0 if base == 10 else len(intpart) * {2: 1, 8: 3, 16: 4}[base]
    elif pad == 'min': padbits = 0
    else: padbits = int(pad)
    e = {}
    for tid, T in BASES.items():
        e[tid] = target(neg and (iv or fv), iv, fv, T, N, padbits)
    V.append({'k': 's', 'f': fid, 't': text, 'n': N, 'p': pad, 'e': e})

# named cases
def named(fid, text, n=16, pad='min'):
    base = BASES[fid]; t = text.replace(' ', '')
    neg = t.startswith('-'); t = t.lstrip('-')
    ip, _, fp = t.partition('.')
    iv = int(ip, base) if ip else 0; fv = Fraction(int(fp, base) if fp else 0, base ** len(fp))
    V.append({'k': 's', 'f': fid, 't': text, 'n': n, 'p': pad, 'e': {tid: target(neg and (iv or fv), iv, fv, T, n, 0) for tid, T in BASES.items()}})
for fid, tx in [('bin', '10101010'), ('dec', '170'), ('bin', '10101010'), ('hex', 'FF'), ('oct', '77'), ('dec', '0.1'), ('dec', '0.2'), ('dec', '0.3'), ('dec', '0.5'), ('dec', '0.375'),
                ('bin', '101.101'), ('bin', '0.1'), ('hex', '0.1'), ('hex', 'A.8'), ('oct', '0.4'), ('dec', '255'), ('dec', '256'), ('dec', '65535'), ('dec', '-1'), ('hex', '-FF.8'),
                ('dec', '1000000'), ('dec', '0'), ('bin', '0'), ('dec', '0.0001'), ('dec', '3.14159'), ('dec', '255.255'), ('hex', 'DEADBEEF'), ('bin', '1' * 64), ('bin', '1' * 100), ('dec', '18446744073709551615')]:
    named(fid, tx)
named('dec', '0.1', 8); named('dec', '0.1', 128); named('dec', '1.1', 64)

# ---- fixed width ----
def fx_expect(u, rep, W):
    top = 1 << (W - 1); allv = 1 << W
    def val(r):
        if r == 'unsigned': return str(u), False
        if r == 'twos': return str(u - allv if u >= top else u), False
        if r == 'ones': return ('-0' if u == allv - 1 else str(-((allv - 1) ^ u) if u >= top else u)), u == allv - 1
        return ('-0' if u == top else str(-(u - top) if u >= top else u)), u == top
    v, nz = val(rep)
    return {'bin': format(u, '0%db' % W), 'oct': format(u, '0%do' % -(-W // 3)), 'hex': format(u, '0%dX' % (W // 4)), 'dec': v, 'uns': str(u),
            'cmp': [val(r)[0] for r in ('unsigned', 'signmag', 'ones', 'twos')]}
def vrange(rep, W):
    top = 1 << (W - 1)
    return (0, (1 << W) - 1) if rep == 'unsigned' else ((-top, top - 1) if rep == 'twos' else (-(top - 1), top - 1))
for _ in range(500):
    W = random.choice([4, 8, 16, 32, 64]); rep = random.choice(['unsigned', 'twos', 'ones', 'signmag'])
    lo, hi = vrange(rep, W)
    mode = random.choice(['dec', 'dec', 'bin', 'oct', 'hex'])
    if mode == 'dec':
        v = random.choice([random.randint(lo, hi), lo, hi, 0, -1 if lo < 0 else 1, 1])
        if random.random() < .12: v = random.choice([hi + 1, lo - 1, hi * 2 + 5, lo * 2 - 5])
        if v < lo or v > hi: V.append({'k': 'f', 'f': 'dec', 't': str(v), 'rep': rep, 'w': W, 'err': 'range'}); continue
        u = {'unsigned': v, 'twos': v & ((1 << W) - 1), 'ones': (v if v >= 0 else (((1 << W) - 1) ^ -v)), 'signmag': (v if v >= 0 else (1 << (W - 1)) | -v)}[rep]
        text = ('+' if v > 0 and random.random() < .2 else '') + str(v)
        V.append({'k': 'f', 'f': 'dec', 't': text, 'rep': rep, 'w': W, 'e': fx_expect(u, rep, W)})
    else:
        base = BASES[mode]
        u = random.choice([random.getrandbits(W), 0, (1 << W) - 1, 1 << (W - 1), (1 << (W - 1)) - 1, random.getrandbits(W) | (1 << (W - 1))])
        if random.random() < .08:
            u = (1 << W) + random.getrandbits(W)  # too wide
            V.append({'k': 'f', 'f': mode, 't': tostr(u, base), 'rep': rep, 'w': W, 'err': 'wide'}); continue
        s = tostr(u, base)
        if random.random() < .4: s = s.zfill(len(s) + random.choice([1, 2, 5]))
        if base == 16 and random.random() < .5: s = s.lower()
        V.append({'k': 'f', 'f': mode, 't': s, 'rep': rep, 'w': W, 'e': fx_expect(u, rep, W)})
V.append({'k': 'f', 'f': 'bin', 't': '11111111', 'rep': 'twos', 'w': 8, 'e': fx_expect(255, 'twos', 8)})
V.append({'k': 'f', 'f': 'bin', 't': '11111111', 'rep': 'unsigned', 'w': 8, 'e': fx_expect(255, 'unsigned', 8)})
V.append({'k': 'f', 'f': 'dec', 't': '-5', 'rep': 'twos', 'w': 8, 'e': fx_expect(0xFB, 'twos', 8)})
V.append({'k': 'f', 'f': 'dec', 't': '-128', 'rep': 'twos', 'w': 8, 'e': fx_expect(0x80, 'twos', 8)})
V.append({'k': 'f', 'f': 'dec', 't': '-128', 'rep': 'ones', 'w': 8, 'err': 'range'})
V.append({'k': 'f', 'f': 'dec', 't': '-1', 'rep': 'unsigned', 'w': 8, 'err': 'range'})
V.append({'k': 'f', 'f': 'dec', 't': '1.5', 'rep': 'twos', 'w': 8, 'err': 'frac'})
V.append({'k': 'f', 'f': 'bin', 't': '-101', 'rep': 'twos', 'w': 8, 'err': 'sign'})
V.append({'k': 'f', 'f': 'bin', 't': '1.1', 'rep': 'twos', 'w': 8, 'err': 'frac'})

# ---- refused input (signed mode) ----
for f, t in [('bin', '10201'), ('bin', '2'), ('oct', '78'), ('oct', '9'), ('dec', '12a'), ('dec', '1e5'), ('hex', '12G'), ('hex', 'xyz'), ('bin', '1.0.1'), ('dec', '--5'), ('dec', '.'), ('bin', '-'), ('bin', '0b')]:
    V.append({'k': 'x', 'f': f, 't': t})
print(json.dumps(V, separators=(',', ':')))
