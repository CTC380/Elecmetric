#!/usr/bin/env python3
"""Independent reference vectors for tools/hex_engine.js (Hex Calculator). Plain Python integers, zlib and binascii; nothing here is copied from the engine.
Run: python3 tests/gen_hex_vectors.py > tests/hex_vectors.json"""
import json, random, zlib, binascii
random.seed(20261121)
def hx(v): return ('-' if v < 0 else '') + format(abs(v), 'X')
def tdiv(a, b):  # truncate toward zero, remainder takes the dividend's sign
    q = abs(a) // abs(b)
    q = -q if (a < 0) != (b < 0) else q
    return q, a - q * b
def rnd_hex(maxd):
    n = random.randint(1, maxd); v = random.getrandbits(4 * n); return v
out = {'arith': [], 'convert': [], 'signed': [], 'bitwise': [], 'crc': []}
fixed = [(0xA, 0xF), (0x1A, 0xB), (0xA, 5), (0x64, 8), (0x1A3, 0x2F), (0xFF, 1), (0xFFFF, 0xFFFF), (0, 0), (0x10, 0x10), (0xFFFFFFFFFFFFFFFF, 1), (0xB, 0xD), (0xD, 0xB)]
pairs = fixed + [(rnd_hex(6), rnd_hex(6)) for _ in range(60)] + [(rnd_hex(40), rnd_hex(40)) for _ in range(20)]
for a, b in pairs:
    for sa, sb in [(1, 1), (1, -1), (-1, 1), (-1, -1)] if random.random() < .5 else [(1, 1)]:
        x, y = sa * a, sb * b
        out['arith'].append({'op': 'add', 'ops': [hx(x), hx(y)], 'r': str(x + y), 'hex': hx(x + y)})
        out['arith'].append({'op': 'sub', 'ops': [hx(x), hx(y)], 'r': str(x - y), 'hex': hx(x - y)})
        out['arith'].append({'op': 'mul', 'ops': [hx(x), hx(y)], 'r': str(x * y), 'hex': hx(x * y)})
        if y != 0:
            q, r = tdiv(x, y)
            out['arith'].append({'op': 'div', 'ops': [hx(x), hx(y)], 'r': str(q), 'hex': hx(q), 'rem': str(r), 'remHex': hx(r)})
        else:
            out['arith'].append({'op': 'div', 'ops': [hx(x), hx(y)], 'err': True})
for _ in range(15):
    k = random.randint(3, 8); vs = [random.randint(-0xFFFFF, 0xFFFFF) for _ in range(k)]
    out['arith'].append({'op': 'add', 'ops': [hx(v) for v in vs], 'r': str(sum(vs)), 'hex': hx(sum(vs))})
    t = vs[0]
    for v in vs[1:]: t -= v
    out['arith'].append({'op': 'sub', 'ops': [hx(v) for v in vs], 'r': str(t), 'hex': hx(t)})
    p = 1
    for v in vs[:4]: p *= v
    out['arith'].append({'op': 'mul', 'ops': [hx(v) for v in vs[:4]], 'r': str(p), 'hex': hx(p)})
# converter: integers in all four bases
for v in [0, 1, 9, 10, 15, 16, 255, 256, 4095, 65535, 2**32 - 1, 2**64, 10**30, 123456789] + [random.getrandbits(random.randint(1, 200)) for _ in range(30)]:
    for neg in (False, True):
        if v == 0 and neg: continue
        s = -v if neg else v
        out['convert'].append({'v': str(s), 'hex': hx(s), 'bin': ('-' if neg else '') + format(v, 'b'), 'oct': ('-' if neg else '') + format(v, 'o')})
# fractions: exact in base 16 -> decimal using Python fractions-free integer maths (k/2^n is exact in decimal)
from fractions import Fraction
def dec_frac(num, den, maxd=64):
    ip = num // den; rem = num - ip * den; ds = ''
    while rem and len(ds) < maxd: rem *= 10; ds += str(rem // den); rem %= den
    return str(ip) + ('.' + ds if ds else '')
for h in ['0.8', '0.4', '0.C', 'A.8', '1.A', 'FF.FF', '0.01', '10.1']:
    ip, fp = h.split('.'); num = int(ip, 16) * 16 ** len(fp) + int(fp, 16); den = 16 ** len(fp)
    out['convert'].append({'frac': h, 'dec': dec_frac(num, den)})
# signed: every width, interesting and random patterns
for w in (8, 16, 32, 64):
    pats = [0, 1, (1 << (w - 1)) - 1, 1 << (w - 1), (1 << w) - 1, (1 << w) - 2] + [random.getrandbits(w) for _ in range(8)]
    for p in pats:
        s = p - (1 << w) if p >> (w - 1) else p
        out['signed'].append({'w': w, 'pat': format(p, 'X'), 'u': str(p), 's': str(s), 'neg': bool(p >> (w - 1)), 'twos': format((-p) % (1 << w), 'X').zfill(w // 4), 'ones': format(p ^ ((1 << w) - 1), 'X').zfill(w // 4)})
    lo, hi = -(1 << (w - 1)), (1 << (w - 1)) - 1
    for v in [lo, hi, lo - 1, hi + 1, -1, 0, 1, random.randint(lo, hi)]:
        out['signed'].append({'w': w, 'val': str(v), 'fits': lo <= v <= hi, 'over': v > hi, 'under': v < lo, 'pat': format(v % (1 << w), 'X').zfill(w // 4)})
# bitwise at fixed widths
def asr(p, w, n): s = p - (1 << w) if p >> (w - 1) else p; return (s >> n) % (1 << w)
for w in (8, 16, 32, 64):
    m = (1 << w) - 1
    for _ in range(12):
        a, b = random.getrandbits(w), random.getrandbits(w); n = random.randint(0, w)
        rec = {'w': w, 'a': format(a, 'X'), 'b': format(b, 'X'), 'n': n,
               'and': a & b, 'or': a | b, 'xor': a ^ b, 'nand': ~(a & b) & m, 'nor': ~(a | b) & m, 'xnor': ~(a ^ b) & m, 'not': ~a & m,
               'shl': (a << n) & m, 'shr': a >> n, 'sar': asr(a, w, n), 'rol': ((a << n) | (a >> (w - n))) & m if n else a, 'ror': ((a >> n) | (a << (w - n))) & m if n else a}
        out['bitwise'].append({k: (format(v, 'X').zfill(w // 4) if k in ('and', 'or', 'xor', 'nand', 'nor', 'xnor', 'not', 'shl', 'shr', 'sar', 'rol', 'ror') else v) for k, v in rec.items()})
# checksums: zlib and binascii as the independent source; ARC and MODBUS by a bit-by-bit reference
def crc16(data, init, poly):
    c = init
    for byte in data:
        c ^= byte
        for _ in range(8): c = (c >> 1) ^ poly if c & 1 else c >> 1
    return c
for data in [b'123456789', b'', b'A', b'Hello', bytes(range(256)), bytes([1, 3, 0, 0, 0, 10]), bytes(random.getrandbits(8) for _ in range(300))]:
    s = sum(data) & 0xFF
    out['crc'].append({'hex': data.hex().upper(), 'ibm': format(crc16(data, 0, 0xA001), '04X'), 'modbus': format(crc16(data, 0xFFFF, 0xA001), '04X'), 'ccitt': format(binascii.crc_hqx(data, 0xFFFF), '04X'),
                       'crc32': format(zlib.crc32(data) & 0xFFFFFFFF, '08X'), 'sum8': format(s, '02X'), 'lrc': format((-s) & 0xFF, '02X')})
print(json.dumps(out, separators=(',', ':')))
