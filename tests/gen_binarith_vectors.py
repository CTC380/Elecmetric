#!/usr/bin/env python3
"""Independent vectors for tools/binarith_engine.js: plain Python integers (int(s, 2), //, bin), no code shared with the engine.
Carry and borrow rows come from the identity  carry_into_bit_k = bit k of (x ^ y ^ (x + y))  and  borrow_into_bit_k = bit k of (x ^ y ^ (x - y)).
Run: python3 tests/gen_binarith_vectors.py > tests/binarith_vectors.json"""
import json, random
random.seed(20261121)
def tdiv(a, b):
    q = abs(a) // abs(b)
    return q if (a >= 0) == (b >= 0) else -q
def typed(v, lead):
    """Write v as a user might type it: sign, leading zeros, optional 0b prefix and grouping."""
    m = bin(abs(v))[2:]
    m = '0' * lead + m
    sign = '-' if v < 0 else random.choice(['', '', '+'])
    if random.random() < .1: m = '0b' + m
    if random.random() < .1 and len(m) > 4: m = m[:3] + ' ' + m[3:]
    return sign + m
def rnd():
    k = random.choice([0, 1, 2, 3, 4, 8, 16, 33, 64, 100, 200, 300])
    v = random.getrandbits(k) if k else 0
    if random.random() < .15: v = (1 << k) - 1
    if random.random() < .45: v = -v
    return v
def minbin(v): return ('-' if v < 0 else '') + bin(abs(v))[2:]
V = []
for _ in range(1500):
    op = random.choice(['add', 'sub', 'mul', 'div', 'add', 'sub'])
    n = 2 if op == 'div' else random.choice([2, 2, 2, 3, 4, 7])
    vals = [rnd() for _ in range(n)]
    if op == 'mul': vals = [v if abs(v).bit_length() < 400 else v >> 300 for v in vals]
    e = {'op': op, 'ops': [typed(v, random.choice([0, 0, 0, 1, 3])) for v in vals]}
    if op == 'add': r = sum(vals)
    elif op == 'sub': r = vals[0] - sum(vals[1:])
    elif op == 'mul':
        r = 1
        for v in vals: r *= v
    else:
        if vals[1] == 0: e['err'] = 'zero'; V.append(e); continue
        r = tdiv(vals[0], vals[1]); e['rem'] = str(vals[0] - r * vals[1]); e['remBits'] = minbin(vals[0] - r * vals[1])
    e['r'] = str(r); e['bits'] = minbin(r)
    if n == 2 and op in ('add', 'sub'):
        a, b = vals[0], (vals[1] if op == 'add' else -vals[1])
        if a == 0 or b == 0 or (a < 0) == (b < 0):
            x, y = abs(a), abs(b); s = x + y; w = max(x.bit_length(), y.bit_length(), 1) + 1
            e['step'] = {'kind': 'add', 'x': bin(x)[2:], 'y': bin(y)[2:], 'row': format(x ^ y ^ s, '0%db' % w)}
        else:
            x, y = max(abs(a), abs(b)), min(abs(a), abs(b)); w = max(x.bit_length(), 1)
            e['step'] = {'kind': 'sub', 'x': bin(x)[2:], 'y': bin(y)[2:], 'row': format(x ^ y ^ (x - y), '0%db' % w)}
    if op == 'mul' and n == 2:
        e['pprows'] = len(bin(abs(vals[1]))[2:]) if len(bin(abs(vals[1]))[2:]) <= 64 and len(bin(abs(vals[0]))[2:]) + len(bin(abs(vals[1]))[2:]) <= 256 else 0
    if op == 'div': e['divrows'] = len(bin(abs(vals[0]))[2:]) if len(bin(abs(vals[0]))[2:]) <= 256 else 0
    V.append(e)
print(json.dumps(V))
