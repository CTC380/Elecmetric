"""Independent vectors for mixedCalc in tools/fraction_engine.js (Fraction Calculator, Mode 04).
Every operand is built from its parts (sign, whole, numerator, denominator) and its value is taken with Python's fractions.Fraction; the expected result
is Python's own Fraction arithmetic on those values, never a second parser of the text. The text is then written in several spellings (minus signs, x and
the multiplication dot, colon division, underscore, extra spaces) so the engine's reading of the text is tested against the parts. The mixed number is
written here, and decimal expansions come from number theory (strip the factors 2 and 5; the block length is the multiplicative order of 10), not from
long division. Run: python3 tests/gen_fraction_mixed_vectors.py  -> tests/fraction_mixed_vectors.json"""
import json, random
from fractions import Fraction as Fr
R = random.Random(20261122)

def order10(m):
    k, x = 1, 10 % m
    while x != 1:
        x = x * 10 % m; k += 1
    return k

def dec(q):
    neg = q < 0; q = abs(q); ip = q.numerator // q.denominator; fr = q - ip
    sign = '-' if neg and q != 0 else ''
    if fr == 0: return sign + str(ip)
    d = fr.denominator; a = b = 0; t = d
    while t % 2 == 0: t //= 2; a += 1
    while t % 5 == 0: t //= 5; b += 1
    pre = max(a, b)
    if t == 1:
        return sign + str(ip) + '.' + str(fr.numerator * 10 ** pre // d).rjust(pre, '0')
    if t > 2_000_000: return None
    per = order10(t)
    if per > 4000: return None
    allv = int(fr * 10 ** (pre + per)); prev = int(fr * 10 ** pre)
    block = str(allv - prev * 10 ** per).rjust(per, '0')
    return sign + str(ip) + '.' + (str(prev).rjust(pre, '0') if pre else '') + '(' + block + ')'

def mixed(q):
    if q.denominator == 1: return str(q.numerator)
    if abs(q) < 1: return '%d/%d' % (q.numerator, q.denominator)
    w = abs(q.numerator) // q.denominator; r = abs(q.numerator) % q.denominator
    return ('-' if q < 0 else '') + '%d %d/%d' % (w, r, q.denominator)

def kind_of(q):
    return 'whole' if q.denominator == 1 else ('proper' if abs(q) < 1 else 'improper')

MINUS = ['-', '-', '\u2212']
def operand(first, force=None, big=0):
    """returns (text, Fraction, comp) where comp = [kind, sign, w, n, d] as the engine reports the parts"""
    k = force or R.choice(['mixed', 'mixed', 'mixed', 'proper', 'improper', 'whole', 'mixedodd'])
    neg = R.random() < 0.3
    if big:
        lo, hi = 10 ** (big - 1), 10 ** big
        d = R.randint(lo, hi); n = R.randint(lo, hi); w = R.randint(lo, hi)
    else:
        d = R.randint(2, 24); n = R.randint(1, d - 1); w = R.randint(1, 40)
    if k == 'mixed':
        if not big and R.random() < 0.08: n = 0
        q = w + Fr(n, d); body = ('%d%s%d%s/%s%d' % (w, R.choice([' ', ' ', '_', '  ']), n, R.choice(['', '', ' ']), R.choice(['', ' ']), d)); kk = 'mixed'; comp = [kk, '', str(w), str(n), str(d)]
        if R.random() < 0.1 and not big: body = '%d %d / %d' % (w, n, d)
    elif k == 'mixedodd':
        n = d + R.randint(0, 2 * d); q = w + Fr(n, d); body = '%d %d/%d' % (w, n, d); kk = 'mixed'; comp = [kk, '', str(w), str(n), str(d)]
    elif k == 'proper':
        if not big and R.random() < 0.1: n = 0
        q = Fr(n, d); body = '%d/%d' % (n, d); kk = 'proper'; comp = [kk, '', '', str(n), str(d)]
    elif k == 'improper':
        n = d + R.randint(0, 3 * d) if not big else R.randint(d, 3 * d); q = Fr(n, d); body = '%d/%d' % (n, d)
        if not big and R.random() < 0.1: d = 1; n = R.randint(1, 50); q = Fr(n, 1); body = '%d/1' % n
        kk = 'improper'; comp = [kk, '', '', str(n), str(d)]
    else:
        v = R.randint(0, 200) if not big else w; q = Fr(v); body = str(v); kk = 'whole'; comp = [kk, '', str(v), '', '']
    sg = ''
    if neg:
        sg = R.choice(MINUS); q = -q; comp[1] = '-'
    elif R.random() < 0.07: sg = '+'
    if R.random() < 0.1 and sg: sg += ' '
    return sg + body, q, comp

OPS = {'+': ['+', ' + ', '  +  '], '-': [' - ', ' \u2212 ', '-', ' \u2013 '], '*': [' \u00d7 ', ' x ', ' * ', ' \u00b7 ', ' X ', '\u00d7'], '/': [' \u00f7 ', ' : ', '\u00f7', ' ÷ ']}
APPLY = {'+': lambda a, b: a + b, '-': lambda a, b: a - b, '*': lambda a, b: a * b, '/': lambda a, b: a / b}
ENGOP = {'+': '+', '-': '-', '*': '*', '/': '\u00f7'}

def row(text, op, a, b, q, cas, cbs):
    return [text, ENGOP[op] if op else None, '%d/%d' % (a.numerator, a.denominator), ('%d/%d' % (b.numerator, b.denominator)) if b is not None else None,
            str(q.numerator), str(q.denominator), mixed(q), dec(q), dec(q * 100), kind_of(q), cas, cbs]

ops_rows = []
while len(ops_rows) < 420:
    ta, qa, ca = operand(True); tb, qb, cb = operand(False)
    op = R.choice('+-*/')
    if op == '/' and qb == 0: continue
    q = APPLY[op](qa, qb)
    # the second sign is written after the operator: keep a minus there only when it reads as a sign
    ops_rows.append(row(ta + R.choice(OPS[op]) + tb, op, qa, qb, q, ca, cb))
def add_named(ta, op, tb):
    def parse(t):
        t2 = t.replace('\u2212', '-'); neg = t2.startswith('-'); t2 = t2.lstrip('-+ ')
        if ' ' in t2:
            w, f = t2.split(' '); n, d = f.split('/'); q = int(w) + Fr(int(n), int(d)); comp = ['mixed', '-' if neg else '', w, n, d]
        elif '/' in t2:
            n, d = t2.split('/'); q = Fr(int(n), int(d)); comp = ['improper' if int(n) >= int(d) else 'proper', '-' if neg else '', '', n, d]
        else:
            q = Fr(int(t2)); comp = ['whole', '-' if neg else '', t2, '', '']
        return (-q if neg else q), comp
    qa, ca = parse(ta); qb, cb = parse(tb)
    q = APPLY[op](qa, qb)
    ops_rows.append(row(ta + ' ' + {'+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7'}[op] + ' ' + tb, op, qa, qb, q, ca, cb))
for t in [('2 1/3', '-', '5/6'), ('-1 3/4', '+', '2/3'), ('3 1/2', '+', '1 3/4'), ('5', '-', '2 3/8'), ('4 1/6', '-', '1 5/6'), ('2 1/2', '*', '3 1/2'), ('3 3/4', '/', '1 1/2'), ('1 1/2', '/', '3/4'),
          ('2 1/2', '-', '4 1/4'), ('-2 1/2', '*', '-1 1/3'), ('0', '+', '2 1/3'), ('2 2/4', '+', '1 2/6'), ('7/2', '-', '3 1/2'), ('-3 1/2', '+', '3 1/2'), ('1 1/2', '*', '2/3'), ('10', '/', '3 1/3')]:
    add_named(*t)

conv_rows = []
for _ in range(220):
    t, q, c = operand(True)
    conv_rows.append(row(t, None, q, None, q, c, None))
for t in ['3 2/5', '17/5', '-7/2', '12/4', '-1 3/4', '5', '0', '0/5', '2 7/3', '-0 1/2', '9/3', '1 0/3', '100/8', '-100/8', '25/1']:
    t2 = t.replace('\u2212', '-'); neg = t2.startswith('-'); b = t2.lstrip('-')
    if ' ' in b:
        w, f = b.split(' '); n, d = f.split('/'); q = int(w) + Fr(int(n), int(d)); comp = ['mixed', '-' if neg else '', w, n, d]
    elif '/' in b:
        n, d = b.split('/'); q = Fr(int(n), int(d)); comp = ['improper' if int(n) >= int(d) else 'proper', '-' if neg else '', '', n, d]
    else:
        q = Fr(int(b)); comp = ['whole', '-' if neg else '', b, '', '']
    q = -q if neg else q
    conv_rows.append(row(t, None, q, None, q, comp, None))

big_rows = []
for _ in range(40):
    dg = R.choice([20, 40, 80, 150, 300])
    ta, qa, ca = operand(True, force=R.choice(['mixed', 'improper', 'proper']), big=dg); tb, qb, cb = operand(False, force=R.choice(['mixed', 'improper', 'proper']), big=dg)
    op = R.choice('+-*/')
    if op == '/' and qb == 0: continue
    q = APPLY[op](qa, qb)
    big_rows.append([ta + R.choice(OPS[op]) + tb, ENGOP[op], str(q.numerator), str(q.denominator), mixed(q)])

err = ['', '   ', '1/0', '5/0', '0/0', '3 1/0', '2 1/3 + 5/0', '2 1/3 \u00f7 0', '2 1/3 \u00f7 0/5', '2 1/3 \u00f7 0 0/2', '2 1/3 \u00f7 (0)', '2.5 + 1', '1/2 + 0.5', '.5', '50%', '1,000 + 1',
       '1 + 2 + 3', '1/2 + 1/3 + 1/4', '(1/2 + 1/3)', '(1/2)', '2 1/3 +', '+', '-', '\u00d7 3', '\u00f7', '1/2 / 1/4', '1/2/3', '1 1/2/3', '1 2', '2 1/3 + 1 2', 'abc', '2 1/3 plus 5/6', '3/-4', '2 -1/-3',
       '1/2 + 1/-3', '--3/4', '3/4 \u00d7 \u00d7 1/2', '3/4 + - + 1/2', '2 1/3 \u2212 5/6 \u2212', '2 1/3 5/6', '1/2 $ 3', '1 1/2 + x', '2^3', '1/2 ** 3', '1' + '0' * 400, '1/' + '7' * 401, '1 ' + '1' * 401 + '/3',
       '1/2 + ' + '1' * 401, '1' * 2001]
json.dump({'op': ops_rows, 'conv': conv_rows, 'big': big_rows, 'err': err}, open('tests/fraction_mixed_vectors.json', 'w'), ensure_ascii=False)
print(len(ops_rows), 'operation vectors,', len(conv_rows), 'conversion vectors,', len(big_rows), 'big,', len(err), 'error cases')
