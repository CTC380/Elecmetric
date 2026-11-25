#!/usr/bin/env python3
"""Independent vectors for tools/binlogic_engine.js: plain Python integers, explicit range checks, no bit tricks shared with the engine.
Run: python3 tests/gen_binlogic_vectors.py > tests/binlogic_vectors.json"""
import json, random
random.seed(20261121)
def s(u, w): return u - (1 << w) if u >= (1 << (w - 1)) else u
def trunc_div(a, b):
    q = abs(a) // abs(b); return q if (a >= 0) == (b >= 0) else -q
V = []
for _ in range(3000):
    w = random.choice([4, 8, 16, 32, 64, 7, 12, 100]); M = (1 << w) - 1; lo, hi = -(1 << (w - 1)), (1 << (w - 1)) - 1
    pick = lambda: random.choice([0, 1, M, 1 << (w - 1), (1 << (w - 1)) - 1, random.getrandbits(w), random.getrandbits(w)])
    a, b = pick(), pick(); op = random.choice(['add', 'sub', 'mul', 'div', 'and', 'or', 'xor', 'nand', 'nor', 'xnor', 'not', 'shl', 'shrl', 'shra'])
    signed = random.random() < .5; sa, sb = s(a, w), s(b, w); e = {'w': w, 'op': op, 'a': a, 'b': b, 'signed': signed}
    if op == 'add': t = a + b; e.update(r=t % (1 << w), ovU=t > M, ovS=not (lo <= sa + sb <= hi))
    elif op == 'sub': e.update(r=(a - b) % (1 << w), ovU=a < b, ovS=not (lo <= sa - sb <= hi))
    elif op == 'mul': e.update(r=(a * b) % (1 << w), ovU=a * b > M, ovS=not (lo <= sa * sb <= hi))
    elif op == 'div':
        if b == 0: e.update(err=True)
        elif signed: q = trunc_div(sa, sb); e.update(r=q % (1 << w), rem=(sa - q * sb) % (1 << w), ovS=not (lo <= q <= hi))
        else: e.update(r=a // b, rem=a % b)
    elif op == 'and': e['r'] = a & b
    elif op == 'or': e['r'] = a | b
    elif op == 'xor': e['r'] = a ^ b
    elif op == 'nand': e['r'] = M - (a & b)
    elif op == 'nor': e['r'] = M - (a | b)
    elif op == 'xnor': e['r'] = M - (a ^ b)
    elif op == 'not': e['r'] = M - a
    else:
        n = random.choice([0, 1, 2, w - 1, w, w + 3, random.randint(0, w)]); e['b'] = n
        if op == 'shl': e.update(r=(a * 2 ** n) % (1 << w), ovU=a * 2 ** n > M, ovS=not (lo <= sa * 2 ** n <= hi) or (s((a * 2 ** n) % (1 << w), w) != sa * 2 ** n))
        elif op == 'shrl': e['r'] = a // 2 ** n
        else: e['r'] = (sa // 2 ** n) % (1 << w)
    for k in ('a', 'b', 'r', 'rem'):
        if k in e: e[k] = str(e[k])
    V.append(e)
print(json.dumps(V))
