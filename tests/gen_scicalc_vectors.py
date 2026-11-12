#!/usr/bin/env python3
"""Independent reference vectors for the Elecmetric Scientific Calculator (tools/scicalc_engine.js).

Every expected value is computed here with Python's math and cmath modules. This file was written from the
textbook definitions and does not read or import the JavaScript engine. Run:  python3 tests/gen_scicalc_vectors.py
It writes tests/scicalc_vectors.json. Each vector is {id, expr, angle, complex, re, im} or {id, expr, angle, complex, error: true}.
Polar vectors are {re, im, mag, ang} (angle in degrees) and check describe() and the polar display values.
"""
import cmath
import json
import math
import os

V = []
P = []


def extra(d, implicit, vars):
    if implicit:
        d['implicit'] = implicit
    if vars:
        d['vars'] = {k: [complex(x).real, complex(x).imag] for k, x in vars.items()}
    return d


def add(expr, value, angle='DEG', cx=False, tag='', implicit=None, vars=None):
    v = complex(value)
    suffix = ('[' + implicit + ']' if implicit else '') + ('{' + ','.join(sorted(vars)) + '}' if vars else '')
    V.append(extra({'id': tag + expr + suffix, 'expr': expr, 'angle': angle, 'complex': cx, 're': v.real, 'im': v.imag}, implicit, vars))


def bad(expr, angle='DEG', cx=False, implicit=None, vars=None):
    suffix = ('[' + implicit + ']' if implicit else '') + ('{' + ','.join(sorted(vars)) + '}' if vars else '')
    V.append(extra({'id': 'error:' + expr + suffix, 'expr': expr, 'angle': angle, 'complex': cx, 'error': True}, implicit, vars))


def num(x):
    """A number as the calculator would be typed: no exponent form, enough digits."""
    return repr(float(x)) if not float(x).is_integer() else str(int(x))


# ---- trigonometry in degrees (exact at multiples of 30 and 45 degrees) ----
for a in [0, 15, 30, 45, 60, 75, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360, 390, 720, -30, -45, -90, 10.5, 22.5, 89, 179]:
    r = math.radians(a)
    add('sin(%s)' % num(a), math.sin(r))
    add('cos(%s)' % num(a), math.cos(r))
    if a % 180 != 90:
        add('tan(%s)' % num(a), math.tan(r))
for a in [90, 270, 450, -90]:
    bad('tan(%s)' % a)

# ---- trigonometry in radians ----
for x in [0, 0.5, 1, 2, 3, 10, -1, math.pi / 6, math.pi / 4, math.pi / 3, math.pi, 2 * math.pi, 1e-5]:
    add('sin(%s)' % num(x), math.sin(x), 'RAD')
    add('cos(%s)' % num(x), math.cos(x), 'RAD')
for x in [0, 0.5, 1, 2, 3, -1, math.pi / 4, math.pi / 3, math.pi]:
    add('tan(%s)' % num(x), math.tan(x), 'RAD')
bad('tan(%s)' % repr(math.pi / 2), 'RAD')

# ---- trigonometry in gradians (400 grad = full circle) ----
for g in [0, 10, 50, 100, 150, 200, 300, 400, 33.3]:
    r = g * math.pi / 200
    add('sin(%s)' % num(g), math.sin(r), 'GRAD')
    add('cos(%s)' % num(g), math.cos(r), 'GRAD')
for g in [0, 10, 50, 150, 333]:
    add('tan(%s)' % num(g), math.tan(g * math.pi / 200), 'GRAD')
bad('tan(100)', 'GRAD')

# ---- inverse trigonometry: result in the active angle unit ----
for x in [-1, -0.5, 0, 0.25, 0.5, 0.8660254037844386, 1]:
    add('asin(%s)' % num(x), math.degrees(math.asin(x)))
    add('acos(%s)' % num(x), math.degrees(math.acos(x)))
    add('asin(%s)' % num(x), math.asin(x), 'RAD')
    add('acos(%s)' % num(x), math.acos(x), 'RAD')
    add('asin(%s)' % num(x), math.asin(x) * 200 / math.pi, 'GRAD')
for x in [-100, -1, 0, 0.5, 1, math.sqrt(3), 10, 1e6]:
    add('atan(%s)' % num(x), math.degrees(math.atan(x)))
    add('atan(%s)' % num(x), math.atan(x), 'RAD')
add('sin\u207b\u00b9(0.5)', 30)
add('cos\u207b\u00b9(0.5)', 60)
add('tan\u207b\u00b9(1)', 45)
bad('asin(1.0001)')
bad('acos(-1.5)')

# ---- hyperbolic ----
for x in [-2, -0.5, 0, 0.5, 1, 2, 5]:
    add('sinh(%s)' % num(x), math.sinh(x))
    add('cosh(%s)' % num(x), math.cosh(x))
    add('tanh(%s)' % num(x), math.tanh(x))
    add('asinh(%s)' % num(x), math.asinh(x))
for x in [1, 1.5, 2, 10]:
    add('acosh(%s)' % num(x), math.acosh(x))
for x in [-0.9, -0.5, 0, 0.5, 0.99]:
    add('atanh(%s)' % num(x), math.atanh(x))
bad('acosh(0.5)')
bad('atanh(1)')
bad('atanh(-1)')

# ---- logarithms, exponentials ----
for x in [0.001, 0.5, 1, 2, 10, 100, 1000, 12345.678, 1e6, 1e-6]:
    add('log(%s)' % num(x), math.log10(x))
    add('ln(%s)' % num(x), math.log(x))
    add('log2(%s)' % num(x), math.log2(x))
for x, b in [(8, 2), (81, 3), (1000, 10), (0.25, 2), (5, 7), (2, 0.5), (1e6, 100)]:
    add('logb(%s,%s)' % (num(x), num(b)), math.log(x) / math.log(b))
    add('log(%s,%s)' % (num(x), num(b)), math.log(x) / math.log(b))
for x in [-3, -1, 0, 0.5, 1, 2, 10, 50]:
    add('exp(%s)' % num(x), math.exp(x))
add('ln(e)', 1)
add('log(1000)', 3)
for e in ['ln(0)', 'log(0)', 'log(-1)', 'ln(-2)', 'log2(0)', 'logb(8,1)', 'logb(8,0)', 'logb(8,-2)', 'logb(-8,2)']:
    bad(e)

# ---- powers and roots ----
for a, b in [(2, 3), (2, 10), (2, -2), (10, 3), (10, -3), (1.5, 2.5), (9, 0.5), (0, 0), (0, 3), (-2, 3), (-2, 2), (-3, 5), (5, 0), (7, 1), (2, 0.5), (100, 0.25)]:
    add('%s^%s' % (num(a), num(b)) if a >= 0 else '(%s)^%s' % (num(a), num(b)), 0 ** 0 if (a == 0 and b == 0) else (a ** b))
    add('pow(%s,%s)' % (num(a), num(b)), 0 ** 0 if (a == 0 and b == 0) else (a ** b))
for x in [0, 1, 2, 4, 9, 144, 2.25, 1e10, 0.0001]:
    add('sqrt(%s)' % num(x), math.sqrt(x))
for x in [-27, -8, -1, 0, 1, 8, 27, 64, 1000, 2]:
    add('cbrt(%s)' % num(x), math.copysign(abs(x) ** (1 / 3), x) if x != 0 else 0)
for x, n in [(16, 4), (32, 5), (-27, 3), (-32, 5), (2, 2), (1000, 3), (81, 4), (10, 0.5)]:
    add('root(%s,%s)' % (num(x), num(n)), math.copysign(abs(x) ** (1.0 / n), x) if (x < 0) else x ** (1.0 / n))
add('\u221a144', 12)
add('\u221a2', math.sqrt(2))
add('3\u00b2', 9)
add('3\u00b3', 27)
for e in ['sqrt(-1)', 'sqrt(-0.0001)', '(-8)^(1/3)', '(-2)^0.5', '0^-1', 'root(-16,4)', 'root(5,0)']:
    bad(e)

# ---- factorial, combinations, permutations ----
for n in list(range(0, 21)) + [25, 50, 100, 170]:
    add('%d!' % n, float(math.factorial(n)))
    add('fact(%d)' % n, float(math.factorial(n)))
for n, r in [(5, 2), (10, 3), (52, 5), (30, 15), (7, 0), (7, 7), (100, 50)]:
    add('ncr(%d,%d)' % (n, r), float(math.comb(n, r)))
    add('npr(%d,%d)' % (n, r), float(math.perm(n, r)))
for e in ['171!', '(-1)!', '2.5!', 'fact(-3)', 'ncr(3,5)', 'ncr(3,-1)', 'npr(2.5,1)']:
    bad(e)

# ---- arithmetic and precedence ----
for ex, py in [
    ('2+3*4', '2+3*4'), ('(2+3)*4', '(2+3)*4'), ('100-10-5', '100-10-5'), ('100/10/5', '100/10/5'),
    ('-2^2', '-(2**2)'), ('2^3^2', '2**(3**2)'), ('2^-2', '2**-2'), ('(-2)^2', '(-2)**2'), ('-(3+4)*2', '-(3+4)*2'),
    ('10/4*2', '10/4*2'), ('2*3!', '2*6'), ('3!^2', '36'), ('2^3!', '2**6'), ('1.5e3+1', '1501'), ('1E-3*1000', '1'),
    ('50%*200', '0.5*200'), ('200*5%', '200*0.05'), ('3(4+5)', '27'), ('(2)(3)', '6'), ('2pi', '2*math.pi'), ('2\u03c0', '2*math.pi'),
    ('pi*2^2', 'math.pi*4'), ('e^2', 'math.e**2'), ('2e', '2*math.e'), ('2sin(30)', '1'), ('sin30', '0.5'), ('sin 30 + 1', '1.5'),
    ('0.1+0.2', '0.3'), ('1/3*3', '1'), ('7-(-3)', '10'), ('--5', '5'), ('2--2', '4'), ('6\u00f73', '2'), ('4\u00d75', '20'), ('9\u22124', '5'),
    ('12345.6789*1000', '12345678.9'), ('1e15+1', '1e15+1'), ('(1+2)*(3+4)*(5+6)', '231'), ('2*(3+4)^2', '98'),
    ('((((1))))', '1'), ('sqrt(16)+sqrt(9)', '7'), ('10!/(8!*2!)', '45'), ('abs(-7.5)', '7.5'), ('floor(-2.5)', '-3'), ('ceil(-2.5)', '-2'),
    ('round(2.5)', '3'), ('round(-2.5)', '-3'), ('trunc(-2.7)', '-2'), ('mod(10,3)', '1'), ('mod(-7,3)', '2'), ('mod(7,-3)', '-2'), ('inv(4)', '0.25'),
]:
    add(ex, eval(py, {'math': math}))
for e in ['1/0', '5/(2-2)', '1 000', '(1+2', '1+)', '2+', '*3', 'foo(1)', 'sin()', 'sin(1,2)', 'ncr(5)', '3 $ 4', 'mod(5,0)', '5\u222030', 'j5', '2i', '10\u222090', '((2)', '()']:
    bad(e)

# ---- complex numbers (Engineering mode) ----
cx = lambda ex, val, angle='DEG': add(ex, val, angle, True)
cx('10+j15', 10 + 15j)
cx('10+15j', 10 + 15j)
cx('10-j15', 10 - 15j)
cx('j', 1j)
cx('j*j', -1)
cx('3+4i', 3 + 4j)
cx('(10+j15)*(5-j2)', (10 + 15j) * (5 - 2j))
cx('(10+j15)/(5-j2)', (10 + 15j) / (5 - 2j))
cx('(3+j4)+(1-j9)', (3 + 4j) + (1 - 9j))
cx('(3+j4)-(1-j9)', (3 + 4j) - (1 - 9j))
cx('1/(j2)', 1 / 2j)
cx('1/j15', 1 / 15j)
cx('(1+j)^2', (1 + 1j) ** 2)
cx('(1+j)^8', (1 + 1j) ** 8)
cx('(1+j)^-3', (1 + 1j) ** -3)
cx('(1+j)^0.5', (1 + 1j) ** 0.5)
cx('(3+j4)^(1+j)', (3 + 4j) ** (1 + 1j))
cx('j^j', 1j ** 1j)
cx('sqrt(-4)', cmath.sqrt(-4))
cx('sqrt(3+j4)', cmath.sqrt(3 + 4j))
cx('sqrt(-3-j4)', cmath.sqrt(-3 - 4j))
cx('(-8)^(1/3)', (-8 + 0j) ** (1 / 3))
cx('cbrt(-8)', -2)
cx('root(-16,4)', (-16 + 0j) ** 0.25)
cx('ln(-1)', cmath.log(-1))
cx('ln(3+j4)', cmath.log(3 + 4j))
cx('log(-100)', cmath.log10(-100))
cx('exp(j*pi)', cmath.exp(1j * math.pi), 'RAD')
cx('e^(j*pi)', cmath.exp(1j * math.pi))
cx('exp(1+j)', cmath.exp(1 + 1j))
cx('abs(3+j4)', 5)
cx('mag(-6-j8)', 10)
cx('arg(1+j)', 45)
cx('arg(-1)', 180)
cx('arg(-1-j)', -135)
cx('arg(1+j)', math.pi / 4, 'RAD')
cx('arg(1+j)', 50, 'GRAD')
cx('re(3+j4)', 3)
cx('im(3+j4)', 4)
cx('conj(3+j4)', 3 - 4j)
cx('conj(5)', 5)
# On a branch cut the sign of the imaginary part is a convention (C99 and Mathematica differ), so check the real part and |imaginary part|.
cx('re(asin(2))', 90)
cx('abs(im(asin(2)))', math.degrees(abs(cmath.asin(2).imag)))
cx('re(acos(2))', 0)
cx('abs(im(acos(2)))', math.degrees(abs(cmath.acos(2).imag)))
cx('acosh(0.5)', cmath.acosh(0.5))
cx('re(atanh(2))', cmath.atanh(2).real)
cx('abs(im(atanh(2)))', abs(cmath.atanh(2).imag))
cx('ln(1+j)*ln(1-j)', cmath.log(1 + 1j) * cmath.log(1 - 1j))
cx('sin(1+j)', cmath.sin(1 + 1j), 'RAD')
cx('cos(1+j)', cmath.cos(1 + 1j), 'RAD')
cx('tan(1+j)', cmath.tan(1 + 1j), 'RAD')
cx('sinh(1+j)', cmath.sinh(1 + 1j))
cx('cosh(1+j)', cmath.cosh(1 + 1j))
cx('tanh(1+j)', cmath.tanh(1 + 1j))
cx('asin(0.5+j)', cmath.asin(0.5 + 1j) * 180 / math.pi)
cx('atan(1+j)', cmath.atan(1 + 1j) * 180 / math.pi)
cx('asinh(1+j)', cmath.asinh(1 + 1j))
cx('acosh(1+j)', cmath.acosh(1 + 1j))
cx('atanh(0.5+j0.5)', cmath.atanh(0.5 + 0.5j))
# polar literal r angle theta; the angle follows the angle mode
for r, t in [(230, 30), (10, 90), (5, -45), (1, 180), (100, 0), (12.5, 120), (3, 270), (7, 45), (2, 360)]:
    cx('%s\u2220%s' % (num(r), num(t)), cmath.rect(r, math.radians(t)))
    cx('%s<%s' % (num(r), num(t)), cmath.rect(r, math.radians(t)))
    cx('%s\u2220%s' % (num(r), num(t * math.pi / 180)), cmath.rect(r, t * math.pi / 180), 'RAD')
cx('230\u222030*2', 2 * cmath.rect(230, math.radians(30)))
cx('10\u222090*10\u222090', cmath.rect(10, math.pi / 2) * cmath.rect(10, math.pi / 2))
cx('5\u222030+3\u2220-10', cmath.rect(5, math.radians(30)) + cmath.rect(3, math.radians(-10)))
cx('(100\u222030)/(4\u222015)', cmath.rect(100, math.radians(30)) / cmath.rect(4, math.radians(15)))
cx('10\u222090\u00b0', cmath.rect(10, math.pi / 2))
cx('10\u22201.5707963267948966', cmath.rect(10, 1.5707963267948966), 'RAD')
# degrees postfix follows the active angle unit
add('sin(30\u00b0)', 0.5, 'DEG')
add('sin(30\u00b0)', 0.5, 'RAD')
add('sin(30\u00b0)', 0.5, 'GRAD')
add('cos(60\u00b0)', 0.5, 'RAD')
add('tan(45\u00b0)', 1, 'GRAD')
# engineering prefixes on numbers (Engineering mode only)
cx('4.7k', 4700)
cx('4.7k*2', 9400)
cx('10m', 0.01)
cx('2u', 2e-6)
cx('2\u00b5', 2e-6)
cx('33n', 33e-9)
cx('100p', 100e-12)
cx('1M', 1e6)
cx('2G', 2e9)
cx('1T', 1e12)
cx('5k+j2k', 5000 + 2000j)
cx('3pi', 3 * math.pi)
cx('230\u222030k', cmath.rect(230, math.radians(30000)))
cx('3mem', 0)
# series and parallel impedance
cx('par(10,10)', 5)
cx('par(10+j5,10-j5)', 1 / (1 / (10 + 5j) + 1 / (10 - 5j)))
cx('par(3,6,2)', 1 / (1 / 3 + 1 / 6 + 1 / 2))
cx('par(10+j10,10-j10,5)', 1 / (1 / (10 + 10j) + 1 / (10 - 10j) + 1 / 5))
w = 2 * math.pi * 50
cx('10+j2*pi*50*0.1', 10 + 1j * w * 0.1)
cx('10+j*2*pi*50*0.1', 10 + 1j * w * 0.1)
cx('1/(j*2*pi*50*100u)', 1 / (1j * w * 100e-6))
cx('230\u22200/(10+j2*pi*50*0.1)', 230 / (10 + 1j * w * 0.1))
cx('abs(230\u22200/(10+j31.41592653589793))', abs(230 / (10 + 31.41592653589793j)))
# standard maths still works unchanged in Engineering mode
cx('sin(30)', 0.5)
cx('5!', 120)
cx('log(1000)', 3)
cx('2^10', 1024)
for e in ['1/0', '1/(5-5)', 'foo(1)', '(1+j', '0^-1', 'ln(0)', 'tan(90)', '1/(j*0)', '171!', '(1+j)!']:
    bad(e, 'DEG', True)
# complex input is refused in Standard mode
for e in ['3+j4', '2\u222030', 'sqrt(-4)', '(-8)^(1/3)', 'asin(2)', 'ln(-1)']:
    bad(e)

# ---- v1.50.1 audit additions (appended after the earlier vectors) ----
# A short circuit in parallel with anything is 0; impedances that cancel give an open circuit (error).
cx('par(0,5)', 0)
cx('par(5,0)', 0)
cx('par(0,0)', 0)
cx('par(10,0,5)', 0)
cx('par(0,3+j4)', 0)
bad('par(5,-5)', 'DEG', True)
bad('par(3+j4,-3-j4)', 'DEG', True)
# npr past the largest double is an error, and a huge argument returns at once.
for n, r in [(171, 171), (200, 200), (1000000000, 1000000000), (1000000000000, 1000000000000)]:
    bad('npr(%d,%d)' % (n, r))
add('npr(170,170)', float(math.perm(170, 170)))
add('npr(1000000000,1)', 1e9)
add('npr(1000000000,2)', 1e9 * (1e9 - 1))

# ---- v1.50.2: atan2, implicit multiplication setting, variables ----
# atan2(y, x) in every angle unit, all four quadrants and the axes.
for y, x in [(1, 1), (1, -1), (-1, -1), (-1, 1), (0, 5), (0, -5), (5, 0), (-5, 0), (3, 4), (-4, 3), (1e-3, -2), (230, 1e-6)]:
    add('atan2(%s,%s)' % (num(y), num(x)), math.degrees(math.atan2(y, x)))
    add('atan2(%s,%s)' % (num(y), num(x)), math.atan2(y, x), 'RAD')
    add('atan2(%s,%s)' % (num(y), num(x)), math.atan2(y, x) * 200 / math.pi, 'GRAD')
bad('atan2(0,0)')
bad('atan2(1)')
bad('atan2(1,2,3)')
bad('atan2(1+j,1)', 'DEG', True)
# Equal ranking (the default): a product with the sign left out ranks with * and /.
for ex, py in [('1/2pi', '0.5*math.pi'), ('1/2*pi', '0.5*math.pi'), ('6/2(1+2)', '9'), ('8/2(2+2)', '16'), ('1/2sin(30)', '0.25'), ('3(4)/2', '6'), ('2pi*50', '100*math.pi')]:
    add(ex, eval(py, {'math': math}), implicit='equal')
    if ex in ('1/2pi', '6/2(1+2)'):
        add(ex, eval(py, {'math': math}))
# Tight: a product with the sign left out binds before /.
for ex, py in [('1/2pi', '1/(2*math.pi)'), ('1/2*pi', '0.5*math.pi'), ('6/2(1+2)', '1'), ('8/2(2+2)', '1'), ('1/2sin(30)', '1'), ('3(4)/2', '6'),
               ('2pi*50', '100*math.pi'), ('1/2pi50*100', '100/(2*math.pi*50)'), ('10/2(5)(1)', '1'), ('1/(2pi)', '1/(2*math.pi)'), ('2sin(30)', '1'), ('4/2sqrt(4)', '1'),
               ('1/2e', '1/(2*math.e)'), ('100/4(5)', '5'), ('-1/2pi', '-1/(2*math.pi)'), ('2^2(3)', '12'), ('1/2(3)(4)', '1/24')]:
    add(ex, eval(py, {'math': math}), implicit='tight')
for e in ['2 3', '1/2 3', '1 000']:
    bad(e, implicit='tight')
add('1/2pi*50*100u', 1 / (2 * math.pi) * 50 * 100e-6, cx=True, implicit='tight', tag='')
# Named variables (letters only, not case sensitive).
fv = {'f': 50, 'c': 100e-6, 'l': 0.1, 'v': 230}
add('1/(2*pi*f*c)', 1 / (2 * math.pi * 50 * 100e-6), vars=fv)
add('1/2pi f c', 1 / (2 * math.pi * 50 * 100e-6), implicit='tight', vars=fv)
add('2*pi*f*l', 2 * math.pi * 50 * 0.1, vars=fv)
add('v/(2*pi*f*l)', 230 / (2 * math.pi * 50 * 0.1), vars=fv)
add('F*2', 100, vars=fv)
add('f+f+f', 150, vars=fv)
add('sqrt(v^2)', 230, vars=fv)
add('sin(f)', math.sin(math.radians(50)), vars=fv)
zv = {'z': 3 + 4j, 'w': 1 - 1j}
add('z*2', (3 + 4j) * 2, cx=True, vars=zv)
add('z*w', (3 + 4j) * (1 - 1j), cx=True, vars=zv)
add('abs(z)', 5, cx=True, vars=zv)
add('par(z,w)', 1 / (1 / (3 + 4j) + 1 / (1 - 1j)), cx=True, vars=zv)
bad('z*2', vars=zv)
bad('q+1', vars=fv)
bad('q+1', 'DEG', True, vars=fv)

# ---- polar vectors: describe(), polar display ----
for z in [10 + 15j, 3 + 4j, -3 + 4j, -3 - 4j, 3 - 4j, 1j, -1j, 5, -5, 0.001 + 0.002j, 1e6 + 1e6j, 230 * cmath.exp(1j * math.radians(30)), 0.5 - 0.25j, 12.5 + 0.01j]:
    m, p = cmath.polar(z)
    P.append({'re': z.real, 'im': z.imag, 'mag': m, 'ang': math.degrees(p)})

here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, 'scicalc_vectors.json'), 'w', encoding='utf8') as f:
    json.dump({'vectors': V, 'polar': P}, f, ensure_ascii=False, indent=0)
print('wrote %d vectors and %d polar vectors' % (len(V), len(P)))
