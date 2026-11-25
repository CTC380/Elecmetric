#!/usr/bin/env python3
"""Independent vectors for tools/bitops_engine.js (Binary Calculator, Mode 03: Bitwise Operations). No code shared with the engine: Python ints, masks and format().
Run: python3 tests/gen_bitops_vectors.py > tests/bitops_vectors.json"""
import json, random
random.seed(20261123)
BASE = {'bin': 2, 'oct': 8, 'dec': 10, 'hex': 16}
def fmt(u, base, W):
    if base == 2: return format(u, '0%db' % W)
    if base == 8: return format(u, 'o')
    if base == 16: return format(u, 'X')
    return str(u)
def signed(u, W): return u - (1 << W) if u >> (W - 1) else u
def typed(u, bid, W, extra_zero):
    s = fmt(u, BASE[bid], W)
    if bid == 'bin' and not extra_zero: s = format(u, 'b')
    if bid == 'hex' and random.random() < .4: s = s.lower()
    if random.random() < .1 and bid in ('bin', 'hex'): s = {'bin': '0b', 'hex': '0x'}[bid] + s
    return s
V = []
two = ['and', 'or', 'xor', 'nand', 'nor', 'xnor', 'diff']
for _ in range(1300):
    op = random.choice(two * 3 + ['not', 'shl', 'shr', 'sar', 'setbit', 'clearbit', 'togglebit', 'testbit'] * 2)
    W = random.choice([4, 8, 16, 32, 64]); bid = random.choice(['bin', 'bin', 'hex', 'dec', 'oct'])
    M = (1 << W) - 1
    pick = lambda: random.choice([random.getrandbits(W), 0, M, 1 << (W - 1), (1 << (W - 1)) - 1, 1, random.getrandbits(W) & random.getrandbits(W)])
    a = pick(); b = pick(); n = 0
    e = {'k': 'v', 'op': op, 'base': bid, 'w': str(W)}
    if op in ('shl', 'shr', 'sar'): n = random.randint(0, W)
    if op in ('setbit', 'clearbit', 'togglebit', 'testbit'): n = random.randint(0, W - 1)
    ta = fmt(a, BASE[bid], W) if bid != 'dec' else (str(signed(a, W)) if random.random() < .5 else str(a))
    tb = fmt(b, BASE[bid], W) if bid != 'dec' else (str(signed(b, W)) if random.random() < .5 else str(b))
    if bid == 'hex' and random.random() < .4: ta = ta.lower()
    if bid in ('bin', 'hex', 'oct') and random.random() < .15: ta = ta.zfill(len(ta) + 2) if len(ta) * {'bin': 1, 'hex': 4, 'oct': 3}[bid] + 8 <= W else ta
    e['a'] = ta; e['b'] = tb; e['n'] = str(n)
    if op == 'and': r = a & b
    elif op == 'or': r = a | b
    elif op in ('xor', 'diff'): r = a ^ b
    elif op == 'nand': r = ~(a & b) & M
    elif op == 'nor': r = ~(a | b) & M
    elif op == 'xnor': r = ~(a ^ b) & M
    elif op == 'not': r = ~a & M
    elif op == 'shl': r = (a << n) & M
    elif op == 'shr': r = a >> n
    elif op == 'sar': r = (signed(a, W) >> n) & M
    elif op == 'setbit': r = a | (1 << n)
    elif op == 'clearbit': r = a & ~(1 << n) & M
    elif op == 'togglebit': r = a ^ (1 << n)
    else: r = a
    ab = format(a, '0%db' % W)
    lost = ''
    if op == 'shl' and n: lost = ab[:n]
    if op in ('shr', 'sar') and n: lost = ab[W - n:]
    e['x'] = {'bin': format(r, '0%db' % W), 'hex': format(r, '0%dX' % ((W + 3) // 4)), 'uns': str(r), 'sgn': str(signed(r, W)), 'lost': lost, 'changed': bin(a ^ r).count('1'), 'a_sgn': str(signed(a, W))}
    if op == 'diff': e['x']['diff'] = [i for i in range(W - 1, -1, -1) if (a ^ b) >> i & 1]
    if op == 'testbit': e['x']['bit'] = (a >> n) & 1
    if op == 'shl':
        e['x']['uov'] = '1' in lost; s = signed(a, W) * (1 << n); e['x']['sov'] = not (-(1 << (W - 1)) <= s <= (1 << (W - 1)) - 1)
    V.append(e)
# auto width
for _ in range(150):
    op = random.choice(two + ['setbit', 'clearbit', 'togglebit', 'testbit'])
    tw = random.choice([1, 3, 4, 5, 8, 12, 16, 17, 24, 32, 33, 60, 64])
    a = random.getrandbits(tw); b = random.getrandbits(tw)
    ta = format(a, '0%db' % tw); tb = format(b, '0%db' % tw)
    W = max(4, -(-tw // 4) * 4); M = (1 << W) - 1; n = random.randint(0, W - 1)
    r = {'and': a & b, 'or': a | b, 'xor': a ^ b, 'diff': a ^ b, 'nand': ~(a & b) & M, 'nor': ~(a | b) & M, 'xnor': ~(a ^ b) & M, 'setbit': a | (1 << n), 'clearbit': a & ~(1 << n) & M, 'togglebit': a ^ (1 << n), 'testbit': a}[op]
    V.append({'k': 'v', 'op': op, 'base': 'bin', 'w': 'auto', 'a': ta, 'b': tb, 'n': str(n), 'x': {'bin': format(r, '0%db' % W), 'hex': format(r, '0%dX' % (W // 4)), 'uns': str(r), 'sgn': str(signed(r, W)), 'lost': '', 'changed': bin(a ^ r).count('1'), 'a_sgn': str(signed(a, W)), 'width': W}})
# refused
for op, base, a, b, w, n in [('not', 'bin', '1', '', 'auto', ''), ('shl', 'bin', '1', '', 'auto', '1'), ('sar', 'bin', '1', '', 'auto', '1'), ('and', 'bin', '100000000', '1', '8', ''), ('and', 'bin', '1', '100000000', '8', ''), ('and', 'bin', '102', '1', '8', ''),
                             ('and', 'dec', '-129', '1', '8', ''), ('and', 'dec', '-1', '1', 'auto', ''), ('shl', 'bin', '1', '', '8', '9'), ('shl', 'bin', '1', '', '8', '-1'), ('shl', 'bin', '1', '', '8', ''), ('setbit', 'bin', '1', '', '8', '8'),
                             ('and', 'hex', '-F', '1', '8', ''), ('and', 'hex', 'G', '1', '8', ''), ('and', 'bin', '', '1', '8', ''), ('and', 'bin', '1', '', '8', ''), ('xyz', 'bin', '1', '1', '8', ''), ('and', 'bin', '1', '1', '7', ''), ('and', 'bin', '1' * 65, '1', 'auto', '')]:
    V.append({'k': 'x', 'op': op, 'base': base, 'a': a, 'b': b, 'w': w, 'n': n})
print(json.dumps(V, separators=(',', ':')))
