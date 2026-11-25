"""Independent vectors for inchCalc (Mode 06: fractional inches and millimetres) in tools/fraction_engine.js.
Run: python3 tests/gen_fraction_inch_vectors.py  (writes tests/fraction_inch_vectors.json; deterministic, seed 6).
Routes differ from the engine's: the factor is not 127/5 but is read from the decimal string 25.4 with fractions.Fraction(Decimal('25.4')); decimal
expansions come from the decimal module at 160 digits, not from long division; a graduation is chosen by scanning the two neighbouring marks
k/D around the exact inch value and comparing distances with Fraction arithmetic (ties go to the larger magnitude), and down / up use math.floor /
math.ceil. Tie cases are planted: the millimetre value is built as (2k+1)/(2D) inch times 25.4, so the exact value sits half way between two marks."""
import json, math, random
from decimal import Decimal, getcontext, ROUND_HALF_UP
from fractions import Fraction as Fr
getcontext().prec = 160
random.seed(6)
MM = Fr(Decimal('25.4'))
DENS = [2, 4, 8, 16, 32, 64, 128, 256]

def ftxt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)
def mtxt(q):
    n, d = abs(q.numerator), q.denominator; w, r = divmod(n, d); s = '-' if q < 0 else ''
    if r == 0: return s + str(w)
    return s + ((str(w) + ' ') if w else '') + '%d/%d' % (r, d)
def terminates(q):
    d = q.denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1
def dec_exact(q):
    """decimal text of a terminating fraction, no trailing zeros"""
    x = Decimal(q.numerator) / Decimal(q.denominator)
    t = format(x.normalize(), 'f')
    return t
def ndig(q):
    t = dec_exact(q); return len(t.split('.')[1]) if '.' in t else 0
def rnd(q, p):
    """round half away from zero to p places (plain text)"""
    x = (Decimal(abs(q.numerator)) / Decimal(q.denominator)).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP)
    t = format(x, 'f'); neg = q < 0 and x != 0
    return ('-' if neg else '') + t
def show(q, p):
    """the display rule: a terminating decimal that fits keeps its own digits, otherwise round to p places"""
    if terminates(q) and ndig(q) <= p: return dec_exact(q), True
    t = rnd(q, p); return t, False
def graduation(inn, D, mode):
    sc = inn * D
    if mode == 'down': return math.floor(sc)
    if mode == 'up': return math.ceil(sc)
    lo = math.floor(sc); hi = lo + 1; dl, dh = abs(sc - lo), abs(hi - sc)
    if dl < dh: return lo
    if dh < dl: return hi
    return lo if abs(lo) > abs(hi) else hi   # tie: larger magnitude

out = {'in': [], 'mm': [], 'err': []}
def spell_in(q):
    n, d = q.numerator, q.denominator; neg = n < 0; n = abs(n); w, r = divmod(n, d); s = '-' if neg else ''
    c = []
    c.append(s + ('%d/%d' % (n, d) if d > 1 else str(n)))
    if r and w: c += [s + '%d %d/%d' % (w, r, d), s + '%d-%d/%d' % (w, r, d), s + '%d %d/%d in' % (w, r, d), s + '%d-%d/%d"' % (w, r, d), s + '%d %d/%d inches' % (w, r, d)]
    if terminates(q) and ndig(q) <= 8: c += [s + dec_exact(abs(q)), s + dec_exact(abs(q)) + ' in']
    return random.choice(c)
seen = set()
def add_in(q, txt=None):
    t = txt or spell_in(q)
    if t in seen: return
    seen.add(t); mm = q * MM
    exact = terminates(mm)
    ex = dec_exact(mm) if exact else None
    shown, sx = show(mm, 3)
    out['in'].append([t, ftxt(q), mtxt(q), ftxt(mm), ex, shown, sx, show(mm, 0)[0], dec_exact(q * 1000) if terminates(q * 1000) else None, terminates(q) and q.denominator in DENS + [1]])
# fractions of an inch on every graduation
for D in DENS:
    for _ in range(14):
        k = random.randint(1, 20 * D); add_in(Fr(k, D))
        if random.random() < 0.3: add_in(Fr(-random.randint(1, 8 * D), D))
for k in range(1, 65): add_in(Fr(k, 64), '%d/64' % k)
for t, q in [('0.75', Fr(3, 4)), ('.5', Fr(1, 2)), ('1/3', Fr(1, 3)), ('7/9', Fr(7, 9)), ('1 1/3', Fr(4, 3)), ('0.(3)', Fr(1, 3)), ('3/16 in', Fr(3, 16)), ('25.4', Fr(254, 10)), ('0', Fr(0)), ('-0.125', Fr(-1, 8)), ('1.5e-2', Fr(3, 200)), ('11/7', Fr(11, 7))]: add_in(q, t)
for _ in range(120):
    a, b = random.randint(1, 60), random.randint(2, 40); add_in(Fr(a, b))
for _ in range(60):
    q = Fr(random.randint(1, 99999), 10 ** random.randint(1, 4)); add_in(q, dec_exact(q))
# millimetres to inches
def add_mm(txt, mm, D, mode, places=None):
    p = 5 if places is None else places; inn = mm / MM; k = graduation(inn, D, mode); fr = Fr(k, D); fmm = fr * MM; em = fmm - mm; ei = fr - inn
    ishown, iex = show(inn, p)
    out['mm'].append([txt, D, mode, places, ftxt(mm), ftxt(inn), str(k), ftxt(fr), mtxt(fr), ftxt(fmm), dec_exact(fmm), ftxt(em), ftxt(ei), em == 0, ishown, terminates(inn), (em > 0) - (em < 0), dec_exact(inn) if terminates(inn) else None])
def mm_text(m):
    return dec_exact(abs(m)) if terminates(m) and ndig(m) <= 6 else None
for _ in range(200):
    m = Fr(random.randint(1, 3000000), 10 ** random.randint(0, 3)); neg = random.random() < 0.15; m = -m if neg else m
    t = dec_exact(abs(m)); t = ('-' if neg else '') + t
    t = random.choice([t, t + ' mm', t + 'mm']) if not t.startswith('-') else t
    add_mm(t, m, random.choice(DENS), random.choice(['nearest', 'down', 'up']), random.choice([None, None, 3, 4, 6]))
for D in DENS:                      # planted exact marks and planted ties
    for _ in range(6):
        k = random.randint(1, 40 * D); inn = Fr(k, D); m = inn * MM
        for mode in ('nearest', 'down', 'up'): add_mm(dec_exact(m), m, D, mode)
        tie = Fr(2 * random.randint(0, 30 * D) + 1, 2 * D) * MM
        for mode in ('nearest', 'down', 'up'): add_mm(dec_exact(tie), tie, D, mode)
        add_mm('-' + dec_exact(tie), -tie, D, 'nearest')
for t, m in [('12.7', Fr(127, 10)), ('25.4', Fr(254, 10)), ('1', Fr(1)), ('10', Fr(10)), ('6', Fr(6)), ('0', Fr(0)), ('0.01', Fr(1, 100)), ('100', Fr(100)), ('1/3', Fr(1, 3)), ('2 1/2', Fr(5, 2))]:
    for D in (16, 64): add_mm(t, m, D, 'nearest')
for t in ['', '   ', 'abc', '50%', '1,5', '1 2', '1/0', '1..2', '1e999', '--3', '3/', '/4', '1-2-3', '0.(', 'in', 'mm', '1 1/2/3', 'x', '5 mmm', '1 3/4 mm', '12 in', '9' * 401]:
    out['err'].append([t, 'in2mm' if t not in ('12 in',) else 'mm2in'])
for t in ['1/0', '50%', '3 in', '1 1/2 mm in']: out['err'].append([t, 'mm2in'])
json.dump(out, open('tests/fraction_inch_vectors.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print(len(out['in']), 'inch cases,', len(out['mm']), 'mm cases,', len(out['err']), 'error cases')
