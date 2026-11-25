#!/usr/bin/env python3
"""Independent vectors for tools/signbin_engine.js (Binary Calculator, Mode 04: Signed Binary Representations). No code shared with the engine: patterns are built and read as
strings and Python ints; one's complement and sign-magnitude arithmetic are simulated the way the hardware does it (end-around carry, sign and magnitude cases).
Run: python3 tests/gen_signbin_vectors.py > tests/signbin_vectors.json"""
import json, random
random.seed(20261124)
REPS = ['unsigned', 'signmag', 'ones', 'twos']
def lim(rep, W):
    t = 1 << (W - 1)
    return (0, (1 << W) - 1) if rep == 'unsigned' else (-t, t - 1) if rep == 'twos' else (-(t - 1), t - 1)
def enc(v, rep, W):
    lo, hi = lim(rep, W)
    if v < lo or v > hi: return None
    if rep == 'unsigned': return format(v, '0%db' % W)
    if rep == 'twos': return format(v & ((1 << W) - 1), '0%db' % W)
    if rep == 'signmag': return ('1' if v < 0 else '0') + format(abs(v), '0%db' % (W - 1))
    mag = format(abs(v), '0%db' % W)
    return ''.join('1' if c == '0' else '0' for c in mag) if v < 0 else mag
def dec(bits, rep, W):
    u = int(bits, 2); M = (1 << W) - 1
    if rep == 'unsigned': return str(u)
    neg = bits[0] == '1'
    if rep == 'twos': return str(u - (1 << W) if neg else u)
    if rep == 'signmag':
        m = int(bits[1:], 2)
        return ('-0' if m == 0 else str(-m)) if neg else str(u)
    if neg:
        m = (~u) & M
        return '-0' if m == 0 else str(-m)
    return str(u)
def val(bits, rep, W):  # numeric value, zeros as 0
    return int(dec(bits, rep, W).replace('-0', '0'))
def sat(e, rep, W):
    lo, hi = lim(rep, W); return enc(min(max(e, lo), hi), rep, W)
def hw(op, rep, W, abits, bbits):
    """pattern the hardware produces for the true result (also when it overflows)"""
    M = (1 << W) - 1; t = 1 << (W - 1); a = int(abits, 2); b = int(bbits, 2) if bbits else 0
    if op == 'neg':
        if rep in ('unsigned', 'twos'): return format(((~a) + 1) & M, '0%db' % W)
        if rep == 'ones': return format((~a) & M, '0%db' % W)
        return format(a ^ t, '0%db' % W)
    if rep in ('unsigned', 'twos'):
        y = ((~b) & M) + 1 if op == 'sub' else b
        return format((a + y) & M, '0%db' % W)
    if rep == 'ones':
        y = (~b) & M if op == 'sub' else b
        s = a + y
        if s >> W: s = (s & M) + 1
        return format(s & M, '0%db' % W)
    sa = a >= t; ma = a & (t - 1); sb = b >= t; mb = b & (t - 1)
    if op == 'sub': sb = not sb
    if sa == sb: m = ma + mb; sr = sa; m &= (t - 1)
    elif ma >= mb: m = ma - mb; sr = sa and (ma - mb) != 0
    else: m = mb - ma; sr = sb
    return format((t if sr else 0) + m, '0%db' % W)
def text(u, bid, W, rep=None, v=None):
    if bid == 'dec': return str(v)
    s = format(u, '0%db' % W) if bid == 'bin' else format(u, 'o') if bid == 'oct' else format(u, 'X')
    if bid == 'bin' and random.random() < .3: s = format(u, 'b')
    if bid == 'hex' and random.random() < .4: s = s.lower()
    return s
V = []
def pick(rep, W):
    lo, hi = lim(rep, W)
    return random.choice([random.randint(lo, hi), random.randint(lo, hi), lo, hi, 0, 1, -1 if lo < 0 else 0, hi - 1, lo + 1 if lo < hi else lo])
def operand(rep, W, bid):
    if bid == 'dec':
        v = pick(rep, W); return str(v) if random.random() > .1 or v < 0 else '+' + str(v), v
    u = random.choice([random.getrandbits(W), 0, (1 << W) - 1, 1 << (W - 1), (1 << (W - 1)) - 1, 1])
    return text(u, bid, W), u
for _ in range(500):  # analyze
    rep = random.choice(REPS); W = random.choice([4, 8, 16, 32, 64]); bid = random.choice(['dec', 'dec', 'bin', 'hex', 'oct'])
    t, x = operand(rep, W, bid)
    bits = enc(x, rep, W) if bid == 'dec' else format(x, '0%db' % W)
    e = {'k': 'a', 'rep': rep, 'w': str(W), 'base': bid, 'a': t}
    M = (1 << W) - 1; u = int(bits, 2)
    e['x'] = {'bin': bits, 'hex': format(u, '0%dX' % ((W + 3) // 4)), 'uns': str(u), 'value': dec(bits, rep, W), 'sign': bits[0], 'ones': format((~u) & M, '0%db' % W), 'twos': format((-u) & M, '0%db' % W),
              'reads': {r: dec(bits, r, W) for r in REPS}, 'min': str(lim(rep, W)[0]), 'max': str(lim(rep, W)[1])}
    if bid == 'dec': e['x']['writes'] = {r: enc(int(x), r, W) for r in REPS}
    V.append(e)
for _ in range(120):  # refused values
    rep = random.choice(REPS); W = random.choice([4, 8, 16, 32, 64]); lo, hi = lim(rep, W)
    v = random.choice([hi + 1, hi + random.randint(1, 1000), lo - 1, lo - random.randint(1, 1000)])
    V.append({'k': 'x', 'op': 'analyze', 'rep': rep, 'w': str(W), 'base': 'dec', 'a': str(v), 'why': 'overflow' if v > hi else 'underflow'})
for _ in range(700):  # add, sub, neg
    op = random.choice(['add', 'sub', 'neg']); rep = random.choice(REPS); W = random.choice([4, 4, 8, 8, 16, 32, 64]); bid = random.choice(['dec', 'dec', 'bin', 'hex'])
    pol = random.choice(['flag', 'wrap', 'sat'])
    ta, xa = operand(rep, W, bid); tb, xb = operand(rep, W, bid)
    abits = enc(xa, rep, W) if bid == 'dec' else format(xa, '0%db' % W)
    bbits = (enc(xb, rep, W) if bid == 'dec' else format(xb, '0%db' % W)) if op != 'neg' else None
    va = val(abits, rep, W); vb = val(bbits, rep, W) if bbits else 0
    e = -va if op == 'neg' else va + vb if op == 'add' else va - vb
    lo, hi = lim(rep, W); inr = lo <= e <= hi
    x = {'exact': str(e), 'flag': None if inr else ('overflow' if e > hi else 'underflow')}
    h = hw(op, rep, W, abits, bbits)
    if inr:
        x['stored'] = enc(e, rep, W); x['value'] = str(e)
        assert val(h, rep, W) == e, (op, rep, W, abits, bbits, h, e)
    else:
        x['wrap'] = h; x['wrapValue'] = dec(h, rep, W); x['sat'] = sat(e, rep, W); x['satValue'] = dec(x['sat'], rep, W)
        x['stored'] = None if pol == 'flag' else (h if pol == 'wrap' else x['sat'])
        x['value'] = None if pol == 'flag' else (x['wrapValue'] if pol == 'wrap' else x['satValue'])
    V.append({'k': 'c', 'op': op, 'rep': rep, 'w': str(W), 'base': bid, 'a': ta, 'b': tb if op != 'neg' else '', 'policy': pol, 'x': x})
for _ in range(220):  # resize
    rep = random.choice(REPS); W = random.choice([4, 8, 16, 32, 64]); W2 = random.choice([4, 8, 16, 32, 64]); bid = random.choice(['dec', 'bin', 'hex'])
    ta, xa = operand(rep, W, bid)
    abits = enc(xa, rep, W) if bid == 'dec' else format(xa, '0%db' % W)
    dv = dec(abits, rep, W); v = int(dv.replace('-0', '0')); lo, hi = lim(rep, W2)
    if not (lo <= v <= hi): V.append({'k': 'x', 'op': 'resize', 'rep': rep, 'w': str(W), 'to': str(W2), 'base': bid, 'a': ta, 'why': 'overflow' if v > hi else 'underflow'}); continue
    if W2 >= W:
        if rep == 'unsigned': nb = '0' * (W2 - W) + abits
        elif rep == 'signmag': nb = abits[0] + '0' * (W2 - W) + abits[1:]
        else: nb = abits[0] * (W2 - W) + abits
    else:
        nb = abits[0] + abits[1 + W - W2:] if rep == 'signmag' else abits[W - W2:]
    assert dec(nb, rep, W2) == dv, (rep, W, W2, abits, nb)
    V.append({'k': 'z', 'rep': rep, 'w': str(W), 'to': str(W2), 'base': bid, 'a': ta, 'x': {'bin': nb, 'value': dv}})
print(json.dumps(V, separators=(',', ':')))
