"""Independent vectors for the Big Number Calculator, Mode 01 (tools/bignum_engine.js), Big Integer Arithmetic.
Written without the engine, with Python's own arbitrary-length int and the decimal module (notation). Run: python3 tests/gen_bignum_vectors.py -> tests/bignum_vectors.json
V.solve rows: [a text, op, b text, conv, result, quotient|null, remainder|null, digits, digitSum, first10, last10, trailingZeros, bits, parity, sign, sci, eng]
  the analysis fields are those of the primary result (the quotient for 'div', the remainder for 'mod', the result otherwise).
V.err rows: [a text, op, b text, text the error must contain].   V.parse rows: [input text, expected integer text or null].
Division conventions in Python: euclid r = a % |b| (never negative), q = (a - r) // b; floor q, r = divmod(a, b); trunc q = sign * (|a| // |b|), r = a - q*b."""
import json, random, sys
sys.set_int_max_str_digits(0)
from decimal import Decimal, Context, ROUND_HALF_UP
R = random.Random(20261124)

def digs(n): return len(str(abs(n)))

def notation(n):
    if n == 0: return ['0', '0']
    c = Context(prec=10, rounding=ROUND_HALF_UP)
    d = c.plus(Decimal(abs(n)))
    t = d.as_tuple(); m = ''.join(map(str, t.digits)); exp = d.adjusted(); m = m.rstrip('0') or '0'
    sg = '-' if n < 0 else ''
    sci = sg + m[0] + ('.' + m[1:] if len(m) > 1 else '') + '×10^' + str(exp)
    e3 = exp - (exp % 3); lead = exp - e3 + 1
    ip = m[:lead].ljust(lead, '0'); fp = m[lead:]
    eng = sg + ip + ('.' + fp if fp else '') + '×10^' + str(e3)
    return [sci, eng]

def divm(a, b, conv):
    if conv == 'floor': q, r = divmod(a, b); return q, r
    if conv == 'trunc':
        q = abs(a) // abs(b); q = q if (a < 0) == (b < 0) else -q; return q, a - q * b
    r = a % abs(b); return (a - r) // b, r

def prim(a, op, b, conv):
    if op == 'add': return a + b, None, None
    if op == 'sub': return a - b, None, None
    if op == 'mul': return a * b, None, None
    if op == 'sq': return a * a, None, None
    if op == 'pow': return a ** b, None, None
    q, r = divm(a, b, conv)
    return (q if op == 'div' else r), q, r

def row(a, op, b, conv='euclid', at=None, bt=None):
    res, q, r = prim(a, op, b, conv)
    focus = res
    s = str(abs(focus))
    sci, eng = notation(focus)
    return [at if at is not None else str(a), op, (bt if bt is not None else (str(b) if op != 'sq' else '')), conv, str(res), None if q is None else str(q), None if r is None else str(r),
            len(s), sum(map(int, s)), s[:10], s[-10:], 0 if focus == 0 else len(s) - len(s.rstrip('0')), 1 if focus == 0 else abs(focus).bit_length(), 'even' if focus % 2 == 0 else 'odd', 'zero' if focus == 0 else ('negative' if focus < 0 else 'positive'), sci, eng]

def rnd(d, neg=None):
    n = R.randint(10 ** (d - 1), 10 ** d - 1) if d > 1 else R.randint(0, 9)
    if neg is None: neg = R.random() < .3
    return -n if neg else n

solve = []
def add(*a, **k): solve.append(row(*a, **k))
# the CEO-note test table
for a, op, b in [(999999999999999999, 'add', 1), (123456789, 'mul', 987654321), (100, 'div', 7), (2, 'pow', 256), (10 ** 50, 'mul', 10 ** 25), (17, 'mod', 5), (12345678901234567890, 'add', 98765432109876543210),
                 (98765432109876543210, 'sub', 12345678901234567890), (999999999, 'sq', 0), (123456789, 'mod', 97), (1000000000000, 'div', 7), (2, 'pow', 100), (10, 'pow', 1000), (999999, 'sq', 0), (2, 'pow', 10)]:
    add(a, op, b)
# boundaries around 2^53 and powers of ten
for k in [9007199254740991, 9007199254740992, 9007199254740993, 2 ** 63, 2 ** 64, 10 ** 15, 10 ** 16, 10 ** 17]:
    for d in [-1, 0, 1, 2]:
        for op in ['add', 'sub', 'mul']: add(k + d, op, 1 + d if d > -1 else 3)
for k in range(1, 40): add(10 ** k - 1, 'add', 1); add(10 ** k, 'sub', 1); add(10 ** k - 1, 'sq', 0)
# zeros, ones and signs
for a in [0, 1, -1, 5, -5, 12345678901234567890, -12345678901234567890]:
    for b in [0, 1, -1, 7, -7, 98765432109876543210, -98765432109876543210]:
        for op in ['add', 'sub', 'mul']: add(a, op, b)
        if b != 0:
            for conv in ['euclid', 'floor', 'trunc']:
                add(a, 'div', b, conv); add(a, 'mod', b, conv)
    add(a, 'sq', 0)
# random add / sub / mul of 1 to 300 digits, both signs
for i in range(110):
    da, db = R.choice([1, 2, 5, 12, 19, 20, 30, 60, 100, 300]), R.choice([1, 2, 5, 12, 19, 20, 30, 60, 100, 300])
    a, b = rnd(da), rnd(db)
    for op in ['add', 'sub', 'mul']: add(a, op, b)
    add(a, 'sq', 0)
# thousands of digits
for d in [1000, 5000]:
    a, b = rnd(d, False), rnd(d, True)
    for op in ['add', 'sub', 'mul']: add(a, op, b)
    add(a, 'sq', 0); add(a, 'div', rnd(d // 2, False)); add(a, 'mod', rnd(d // 3, True), 'floor')
add(10 ** 4999, 'add', 10 ** 4999 - 1); add(10 ** 4999 + 7, 'mul', 10 ** 1000 - 3)
# division and modulo, all conventions, random sizes and signs
for i in range(200):
    da, db = R.choice([1, 3, 8, 18, 19, 25, 40, 60, 61, 100, 200, 500]), R.choice([1, 2, 5, 9, 18, 19, 30, 31, 50, 150])
    a, b = rnd(da), rnd(db)
    if b == 0: b = 7
    for conv in ['euclid', 'floor', 'trunc']:
        add(a, 'div', b, conv)
        if i % 2 == 0: add(a, 'mod', b, conv)
for a, b in [(7, 7), (-7, 7), (7, -7), (-7, -7), (6, 3), (-6, 3), (1, 5), (0, 5), (0, -5), (4, 10), (-4, 10), (-4, -10), (999999999999, 1000), (10 ** 40, 10 ** 20), (10 ** 40 + 1, 10 ** 20), (5, 10 ** 30), (-5, 10 ** 30)]:
    for conv in ['euclid', 'floor', 'trunc']: add(a, 'div', b, conv); add(a, 'mod', b, conv)
# powers
for i in range(150):
    base = R.choice([2, 3, 5, 7, 9, 10, 11, 12, 99, 123, 1000, 12345, 98765432101, -2, -3, -7, -10, -123, 2 ** 40 + 1, -(10 ** 20)])
    mx = max(1, int(19000 / max(1, len(str(abs(base))))))
    e = R.choice([0, 1, 2, 3, 4, 5, 7, 8, 13, 31, 64, 100, 255, 256, 257, 500, 1000, R.randint(2, mx)])
    if len(str(abs(base) ** e)) > 20000: continue
    add(base, 'pow', e)
for a, e in [(0, 0), (0, 1), (0, 5), (1, 1000000), (-1, 1000000), (-1, 999999), (1, 0), (-1, 0), (10, 19999), (2, 66438), (3, 41921), (7, 23677), (-2, 66438), (123456789, 2469)]:
    if len(str(abs(a) ** e)) <= 20000: add(a, 'pow', e)

err = [
    ['5', 'div', '0', 'zero'], ['0', 'div', '0', 'zero'], ['5', 'mod', '0', 'MOD 0'], ['-5', 'mod', '0', 'MOD 0'],
    ['2', 'pow', '100000', '30,103'], ['10', 'pow', '20000', 'limits results'], ['2', 'pow', '-1', 'negative'], ['2', 'pow', '1000001', '1,000,000'], ['0.5', 'add', '1', 'fractional part'], ['1', 'add', '0.25', 'fractional part'],
    ['abc', 'add', '1', 'not a whole number'], ['1', 'add', '1x', 'not a whole number'], ['1,23', 'add', '1', 'commas'], ['12,34,567', 'add', '1', 'commas'], ['1e5000', 'add', '1', '5,001 digits'], ['9' * 5001, 'add', '1', '5,001 digits'], ['1', 'mul', '1e9999999999', 'too large'],
    ['12e-1', 'add', '1', 'fractional part'], ['--5', 'add', '1', 'not a whole number'], ['5-', 'add', '1', 'not a whole number'], ['.', 'add', '1', 'not a whole number'], ['1e', 'add', '1', 'not a whole number'], ['0x1F', 'add', '1', 'not a whole number'],
]
empty = [['', 'add', '1'], ['  ', 'add', '1'], ['1', 'add', ''], ['1', 'pow', ''], ['', 'sq', '']]
parse = [['123', '123'], ['  123  ', '123'], ['+123', '123'], ['-123', '-123'], ['−123', '-123'], ['-0', '0'], ['+0', '0'], ['000123', '123'], ['0', '0'], ['00000', '0'], ['1,234,567', '1234567'], ['-1,234,567', '-1234567'], ['1 234 567', '1234567'], ['1_000_000', '1000000'],
         ['12.0', '12'], ['12.', '12'], ['12.000', '12'], ['23E18', '23' + '0' * 18], ['3.5e19', '35' + '0' * 18], ['1.2e3', '1200'], ['1e0', '1'], ['1E+3', '1000'], ['120e-1', '12'], ['1200e-2', '12'], ['5e-0', '5'], ['0e99999', '0'], ['0.0e5', '0'], ['.5e1', '5'], ['1,000e3', '1000000'],
         ['-2.5E2', '-250'], ['1e4999', '1' + '0' * 4999], ['9' * 5000, '9' * 5000], ['\u00a01\u00a0000', '1000'], ['\u20131', '-1']]
json.dump({'solve': solve, 'err': err, 'empty': empty, 'parse': parse}, open('tests/bignum_vectors.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(solve), 'solve rows;', len(err), 'error rows;', len(parse), 'parse rows')
