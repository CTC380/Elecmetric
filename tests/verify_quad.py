"""Symbolic check of the exact root strings the engine prints (run tests/quad_run.js first). Each string is parsed by sympy and must equal the true roots of the
equation, and every printed radicand must be squarefree. Independent of the engine's own substitution check.
Run: node tests/quad_run.js && python3 tests/verify_quad.py"""
import json, re, sys
from fractions import Fraction as Fr
import sympy as sp
rows = json.load(open('tests/quad_out.json'))
x = sp.symbols('x')

def val(t):
    t = t.replace('\u2212', '-')
    if '/' in t:
        a, b = t.split('/'); return Fr(a) / Fr(b)
    return Fr(t)

def parse(s):
    s = s.replace('\u2212', '-').replace('\u221a', 'sqrt')
    s = re.sub(r'(\d+)isqrt(\d+)', r'\1*I*sqrt(\2)', s)
    s = re.sub(r'isqrt(\d+)', r'I*sqrt(\1)', s)
    s = re.sub(r'(\d)sqrt', r'\1*sqrt', s)
    s = re.sub(r'sqrt(\d+)', r'sqrt(\1)', s)
    s = re.sub(r'(\d)i\b', r'\1*I', s)
    s = re.sub(r'(?<![A-Za-z])i\b', 'I', s)
    s = s.replace(')(', ')*(')
    return sp.sympify(s, rational=True)

bad = 0; n = 0
for a, b, c, kind, ex, rad, full in rows:
    if kind in ('none', 'indeterminate'): continue
    A, B, C = [sp.Rational(v.numerator, v.denominator) for v in map(val, (a, b, c))]
    P = sp.Poly(A * x**2 + B * x + C, x) if A != 0 else sp.Poly(B * x + C, x)
    for s in ex:
        n += 1
        try:
            e = parse(s)
            if sp.simplify(P.as_expr().subs(x, e)) != 0: bad += 1; print('NOT A ROOT', a, b, c, s)
        except Exception as err:
            bad += 1; print('PARSE', a, b, c, s, err)
    if len(ex) == 2 and kind in ('irrational', 'complex'):
        n += 1
        if sp.simplify(parse(ex[0]) - parse(ex[1])) == 0: bad += 1; print('SAME ROOT TWICE', a, b, c)
        if rad and full:
            f = sp.factorint(int(rad))
            if any(v > 1 for v in f.values()): bad += 1; print('RADICAND NOT SQUAREFREE', a, b, c, rad)
print(n, 'symbolic checks,', bad, 'failures'); sys.exit(1 if bad else 0)
