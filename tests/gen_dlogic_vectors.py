#!/usr/bin/env python3
"""Independent vectors for tools/dlogic_engine.js (Binary Calculator, Mode 05: Digital Electronics and Logic). No code shared with the engine.
Boolean functions are random syntax trees evaluated with Python booleans and written out in several notations; prime implicants come from enumerating every cube
(not Quine-McCluskey) and the minimum cover from a separate exhaustive search. Registers, parity and grouping use Python ints and strings.
Run: python3 tests/gen_dlogic_vectors.py > tests/dlogic_vectors.json"""
import json, random, itertools
random.seed(20261125)
OPS = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR']
PREC = {'OR': 1, 'NOR': 1, 'XOR': 2, 'XNOR': 2, 'AND': 3, 'NAND': 3}
def g(op, a, b):
    return {'AND': a and b, 'OR': a or b, 'XOR': a != b, 'NAND': not (a and b), 'NOR': not (a or b), 'XNOR': a == b}[op]
def ev(t, env):
    k = t[0]
    if k == 'v': return env[t[1]]
    if k == 'c': return t[1]
    if k == 'n': return not ev(t[1], env)
    return g(t[1], ev(t[2], env), ev(t[3], env))
def rnd(vs, d):
    if d == 0 or random.random() < .25: return ('v', random.choice(vs)) if random.random() > .05 else ('c', random.random() < .5)
    if random.random() < .2: return ('n', rnd(vs, d - 1))
    return ('b', random.choice(OPS + ['AND', 'OR', 'AND', 'OR']), rnd(vs, d - 1), rnd(vs, d - 1))
def names(t, s):
    if t[0] == 'v': s.add(t[1])
    elif t[0] == 'n': names(t[1], s)
    elif t[0] == 'b': names(t[2], s); names(t[3], s)
    return s
def render(t, style, parent=None, side=None):
    k = t[0]
    if k == 'v': return t[1] if style != 'lower' else t[1].lower()
    if k == 'c': return str(int(t[1]))
    if k == 'n':
        inner = render(t[1], style, 'NOT')
        if t[1][0] == 'b': inner = '(' + render(t[1], style) + ')'
        if style == 'sym': return '!' + inner
        if style == 'prime' and t[1][0] in ('v',): return inner + "'"
        return 'NOT ' + inner
    op = t[1]
    a = render(t[2], style, op, 'l'); b = render(t[3], style, op, 'r')
    def par(child, s, side):
        if child[0] != 'b': return s
        if style == 'full': return '(' + s + ')'
        if PREC[child[1]] < PREC[op] or (PREC[child[1]] == PREC[op] and side == 'r') or (PREC[child[1]] == PREC[op] and child[1] != op and side == 'l' and False): return '(' + s + ')'
        if PREC[child[1]] == PREC[op] and side == 'l' and op in ('NAND', 'NOR', 'XNOR'): return '(' + s + ')'
        return s
    a = par(t[2], a, 'l'); b = par(t[3], b, 'r')
    if style == 'sym': sym = {'AND': '&', 'OR': '|', 'XOR': '^'}.get(op)
    else: sym = None
    if style == 'prime' and op == 'AND': return a + ' ' + b if True else ''
    if style == 'prime' and op == 'OR': return a + ' + ' + b
    if sym: return a + ' ' + sym + ' ' + b
    return a + ' ' + (op if style != 'lower' else op.lower()) + ' ' + b
def table(t, vs):
    n = len(vs); out = []
    for i in range(1 << n):
        env = {v: bool((i >> (n - 1 - j)) & 1) for j, v in enumerate(vs)}
        out.append(1 if ev(t, env) else 0)
    return out
def cubes(n):
    return [''.join(c) for c in itertools.product('01-', repeat=n)]
def covers(c, n):
    return {i for i in range(1 << n) if all(ch == '-' or int(ch) == ((i >> (n - 1 - j)) & 1) for j, ch in enumerate(c))}
def min_cost(n, on, dc):
    if not on: return (0, 0)
    allowed = set(on) | set(dc); valid = {}
    for c in cubes(n):
        cs = covers(c, n)
        if cs <= allowed and cs & set(on): valid[c] = cs
    primes = []
    for c, cs in valid.items():
        bigger = False
        for j, ch in enumerate(c):
            if ch != '-' and (c[:j] + '-' + c[j + 1:]) in valid: bigger = True; break
        if not bigger: primes.append(c)
    lits = {c: n - c.count('-') for c in primes}; best = [None]
    def rec(unc, t, l):
        if best[0] is not None and (t, l) >= best[0]: return
        if not unc: best[0] = (t, l); return
        x = min(unc)
        for c in primes:
            if x in valid[c]: rec(unc - valid[c], t + 1, l + lits[c])
    rec(frozenset(on), 0, 0); return best[0]
def canon(on, off, vs):
    n = len(vs)
    def m(i): return ''.join(v + ("'" if not (i >> (n - 1 - j)) & 1 else '') for j, v in enumerate(vs))
    def mx(i): return '(' + ' + '.join(v + ("'" if (i >> (n - 1 - j)) & 1 else '') for j, v in enumerate(vs)) + ')'
    return (' + '.join(m(i) for i in on) if on else '0', ''.join(mx(i) for i in off) if off else '1')
V = []
def boolvec(text, vs, vec, extra=None, dc=()):
    n = len(vs); on = [i for i, x in enumerate(vec) if x == 1]; off = [i for i, x in enumerate(vec) if x == 0]
    c = canon(on, off, vs); mc = min_cost(n, on, dc) if n <= 5 else None
    pc = min_cost(n, off, dc) if n <= 5 else None
    x = {'vars': vs, 'vec': ''.join(str(x) if x in (0, 1) else 'X' for x in vec), 'on': on, 'off': off, 'sop': c[0], 'pos': c[1], 'cost': mc, 'poscost': pc,
         'const': 'tautology' if (len(on) == len(vec)) else ('contradiction' if len(off) == len(vec) else None)}
    if extra: x.update(extra)
    return x
LETTERS = 'ABCDEFGHJKLMPQRSTUVWXYZ'
for _ in range(420):
    n = random.choice([1, 2, 3, 3, 4, 4, 5, 5, 6]); vs = sorted(random.sample(LETTERS, n)); t = rnd(vs, random.choice([2, 3, 4, 5]))
    used = sorted(names(t, set()))
    if not used: continue
    vec = table(t, used); style = random.choice(['word', 'sym', 'prime', 'lower', 'full', 'word', 'prime'])
    text = render(t, style)
    if style == 'prime': text = text.replace('NOT ', '!') if random.random() < .5 else text
    e = {'k': 'b', 'expr': text}
    ex = boolvec(text, used, vec); ex['norm_vars'] = used
    if random.random() < .35:  # equivalence
        r = random.random()
        if r < .35: t2 = ('n', ('n', t)); eqv = True
        elif r < .6: t2 = ('b', 'NAND', ('b', 'NAND', t, ('c', True)), ('c', True)); eqv = True
        else: t2 = rnd(vs, random.choice([2, 3])); eqv = None
        un = sorted(names(t, set()) | names(t2, set()))
        if len(un) <= 6:
            v1 = table(t, un); v2 = table(t2, un); e['expr2'] = render(t2, random.choice(['word', 'sym', 'full']))
            ex['equiv'] = {'equal': v1 == v2, 'diff': sum(a != b for a, b in zip(v1, v2))}
    e['x'] = ex; V.append(e)
for _ in range(120):  # minterm lists with don't-cares
    n = random.choice([2, 3, 4, 5]); N = 1 << n; k = random.randint(0, N); idx = random.sample(range(N), k); nd = random.randint(0, max(0, k // 2)) if k else 0
    dc = idx[:nd]; on = sorted(idx[nd:]); dc = sorted(dc)
    fmt = random.choice(['m(%s) d(%s)', 'Σm(%s) + d(%s)', 'm(%s)+d(%s)'])
    text = fmt % (','.join(map(str, on)), ','.join(map(str, dc)))
    if not dc: text = random.choice(['m(%s)', 'Σm(%s)']) % ','.join(map(str, on))
    if not on and not dc: text = 'm()'
    vs = list('ABCDEF'[:n]); vec = [1 if i in on else ('X' if i in dc else 0) for i in range(N)]
    x = boolvec(text, vs, vec, dc=dc); x['dc'] = dc
    V.append({'k': 'b', 'expr': text, 'vars': str(n), 'x': x})
def hexs(u, w): return format(u, '0%dX' % ((w + 3) // 4))
def txt(u, base, w):
    if base == 'bin': return format(u, 'b') if random.random() < .3 else format(u, '0%db' % w)
    if base == 'hex': return format(u, 'x') if random.random() < .5 else format(u, 'X')
    if base == 'oct': return format(u, 'o')
    return str(u)
def posn(b, ch): W = len(b); return sorted([W - 1 - i for i, c in enumerate(b) if c == ch], reverse=True)
for _ in range(260):  # register
    W = random.choice([4, 8, 8, 16, 32, 64]); u = random.choice([random.getrandbits(W), random.getrandbits(W), 0, (1 << W) - 1, 1 << (W - 1), 1]); base = random.choice(['bin', 'hex', 'dec', 'oct'])
    b = format(u, '0%db' % W); mset = sorted(random.sample(range(W), random.randint(1, min(W, 6)))); act = random.choice(['none', 'set', 'clear', 'toggle', 'keep']); mk = 0
    if random.random() < .5:
        parts = []
        for p in mset: mk |= 1 << p; parts.append(str(p))
        mtxt = ','.join(parts)
    else:
        mk = random.getrandbits(W); mtxt = '0x' + format(mk, 'X') if random.random() < .5 else '0b' + format(mk, '0%db' % W)
    R = {'set': u | mk, 'clear': u & ~mk & ((1 << W) - 1), 'toggle': u ^ mk, 'keep': u & mk, 'none': u}[act]
    fields = []; ftxt = []
    for q in range(random.randint(0, 3)):
        hi = random.randint(0, W - 1); lo = random.randint(0, hi); nm = 'F%d' % q; fields.append((nm, hi, lo)); ftxt.append('%s:%d:%d' % (nm, hi, lo) if hi != lo or random.random() < .5 else '%s:%d' % (nm, hi))
    x = {'bin': b, 'hex': hexs(u, W), 'oct': format(u, '0%do' % ((W + 2) // 3)), 'dec': str(u), 'msb': b[0], 'lsb': b[-1], 'ones': b.count('1'), 'set': posn(b, '1'), 'clear': posn(b, '0'),
         'fields': [{'name': nm, 'bin': b[W - 1 - hi:W - lo], 'dec': str(int(b[W - 1 - hi:W - lo], 2))} for nm, hi, lo in fields], 'result': format(R, '0%db' % W) if act != 'none' and mtxt else None,
         'changed': posn(''.join('1' if a != c else '0' for a, c in zip(b, format(R, '0%db' % W))), '1') if act != 'none' else None, 'maskbin': format(mk, '0%db' % W)}
    V.append({'k': 'r', 'value': txt(u, base, W), 'base': base, 'width': str(W), 'fields': ', '.join(ftxt), 'mask': mtxt, 'action': act, 'x': x})
for _ in range(200):  # parity
    w = random.choice([4, 8, 16, 32, 64]); kind = random.choice(['even', 'odd']); pos = random.choice(['msb', 'lsb']); mode = random.choice(['generate', 'check', 'check'])
    if mode == 'generate':
        u = random.getrandbits(w); d = format(u, '0%db' % w); ones = d.count('1'); p = ones % 2 if kind == 'even' else 1 - ones % 2; word = str(p) + d if pos == 'msb' else d + str(p)
        V.append({'k': 'p', 'value': format(u, '0%db' % w) if random.random() < .5 else str(u), 'base': 'bin' if True else 'dec', 'width': str(w), 'parity': kind, 'ppos': pos, 'pmode': mode, 'x': {'ones': ones, 'bit': p, 'word': word}}); V[-1]['base'] = 'bin' if V[-1]['value'] == d else 'dec'
    else:
        u = random.getrandbits(w + 1); r = format(u, '0%db' % (w + 1)); par = r[0] if pos == 'msb' else r[-1]; dat = r[1:] if pos == 'msb' else r[:-1]; tot = r.count('1'); okp = (tot % 2 == 0) if kind == 'even' else (tot % 2 == 1)
        V.append({'k': 'p', 'value': r, 'base': 'bin', 'width': str(w), 'parity': kind, 'ppos': pos, 'pmode': mode, 'x': {'pass': okp, 'total': tot, 'bit': int(par), 'data': dat}})
for _ in range(120):  # grouping
    W = random.choice([8, 16, 32, 64]); u = random.getrandbits(W); b = format(u, '0%db' % W); hx = format(u, '0%dX' % (W // 4)); by = [hx[i:i + 2] for i in range(0, len(hx), 2)]
    V.append({'k': 'g', 'value': hx if random.random() < .6 else format(u, 'b'), 'base': 'hex' if True else 'bin', 'width': str(W), 'x': {'bin': b, 'nib': [b[i:i + 4] for i in range(0, W, 4)], 'bytes': [b[i:i + 8] for i in range(0, W, 8)], 'big': by, 'little': by[::-1]}})
    V[-1]['base'] = 'hex' if V[-1]['value'] == hx else 'bin'
print(json.dumps(V, separators=(',', ':'), ensure_ascii=False))
