#!/usr/bin/env python3
"""Independent reference vectors for tools/exponent_eng_engine.js (Exponent Calculator, Mode 05).

Nothing here uses the JavaScript engine's method.
  * notation, power of ten and prefix conversion: Python's decimal module (exact, 4000 digits), ROUND_HALF_UP, adjusted() for the exponent.
  * the exponential functions: mpmath at 60 digits (exp, expm1, log, log1p), with the displayed text built by a separate formatter written here.
Run:  python3 tests/gen_exponent_eng_vectors.py      (needs mpmath)   ->  tests/exponent_eng_vectors.json
"""
import json, random, os
from decimal import Decimal, getcontext, ROUND_HALF_UP
from mpmath import mp, mpf, exp, log, log10, expm1, log1p, nstr

getcontext().prec = 4000
mp.dps = 60
random.seed(2026)

PREFIXES = [('quecto', 'q', -30), ('ronto', 'r', -27), ('yocto', 'y', -24), ('zepto', 'z', -21), ('atto', 'a', -18), ('femto', 'f', -15), ('pico', 'p', -12), ('nano', 'n', -9), ('micro', '\u00b5', -6), ('milli', 'm', -3), ('centi', 'c', -2), ('deci', 'd', -1), ('none', '', 0), ('deca', 'da', 1), ('hecto', 'h', 2), ('kilo', 'k', 3), ('mega', 'M', 6), ('giga', 'G', 9), ('tera', 'T', 12), ('peta', 'P', 15), ('exa', 'E', 18), ('zetta', 'Z', 21), ('yotta', 'Y', 24), ('ronna', 'R', 27), ('quetta', 'Q', 30)]
KEY = {k: (s, e) for k, s, e in PREFIXES}
ENGSYM = {e: s for k, s, e in PREFIXES if e % 3 == 0}
SUFFIX = {'k': 3, 'M': 6, 'G': 9, 'T': 12, 'P': 15, 'Z': 21, 'Y': 24, 'R': 27, 'Q': 30, 'm': -3, 'u': -6, '\u00b5': -6, 'n': -9, 'p': -12, 'f': -15, 'a': -18, 'z': -21, 'y': -24, 'r': -27, 'q': -30}


def rnd(d, sig):
    """Round a Decimal to sig significant figures, half up; sig None keeps every digit."""
    if d == 0 or sig is None:
        return d
    q = Decimal(1).scaleb(d.adjusted() - sig + 1)
    return d.quantize(q, rounding=ROUND_HALF_UP)


def fields(d):
    """sign, digit string, exponent of the leading digit, for the normalised Decimal."""
    if d == 0:
        return 0, '0', 0
    n = d.normalize()
    digs = ''.join(map(str, n.as_tuple().digits))
    return (-1 if n < 0 else 1), digs, n.adjusted()


def notation(d, sig):
    d = rnd(d, sig)
    if d == 0:
        return {'sign': 0, 'digits': '0', 'adj': 0, 'sciCoef': '0', 'sciExp': 0, 'engCoef': '0', 'engExp': 0, 'plain': '0', 'prefix': None}
    n = d.normalize()
    s, digs, adj = fields(d)
    sign = '-' if s < 0 else ''
    sci = sign + digs[0] + ('.' + digs[1:] if len(digs) > 1 else '')
    n3 = 3 * (adj // 3)
    eng = format(n.scaleb(-n3), 'f')
    plain = format(n, 'f')
    if len(plain.lstrip('-')) > 400:
        plain = None
    return {'sign': s, 'digits': digs, 'adj': adj, 'sciCoef': sci, 'sciExp': adj, 'engCoef': eng, 'engExp': n3, 'plain': plain, 'prefix': ENGSYM.get(n3) if n3 in ENGSYM else None}


def rdigits(n):
    return ''.join(random.choice('0123456789') for _ in range(n))


def mantissa():
    k = random.random()
    if k < 0.25:
        ip = str(random.randint(1, 999))
        fp = rdigits(random.randint(0, 6)) if random.random() < 0.7 else ''
    elif k < 0.4:
        ip = str(random.randint(1, 9)); fp = rdigits(random.randint(1, 30))
    elif k < 0.5:
        ip = rdigits(random.randint(10, 40)).lstrip('0') or '7'; fp = rdigits(random.randint(0, 20))
    elif k < 0.6:
        ip = '0'; fp = '0' * random.randint(0, 8) + str(random.randint(1, 99999))
    elif k < 0.7:
        ip = random.choice(['9', '99', '999', '9999']); fp = random.choice(['', '5', '95', '995', '9995', '99995', '999999'])
    else:
        ip = str(random.randint(1, 9)); fp = random.choice(['', '5', '25', '75', '7', '47', '2', '2'])
    return ip, fp


def notation_vectors():
    out = []
    for _ in range(700):
        ip, fp = mantissa()
        neg = random.random() < 0.25
        form = random.choice(['plain', 'e', 'E', 'x', 'times', 'suffix', 'suffix', 'plain'])
        exp10 = random.randint(-40, 40) if random.random() < 0.92 else random.choice([-500, -420, 410, 450, 99999, -99999, 301, -301])
        m = ip + ('.' + fp if fp else '')
        sign = '-' if neg else random.choice(['', '', '+'])
        suffix = 0
        if form == 'plain':
            text = sign + m; exp10 = 0
        elif form == 'e':
            text = sign + m + 'e' + (str(exp10) if random.random() < 0.8 else '+' + str(exp10) if exp10 >= 0 else str(exp10))
        elif form == 'E':
            text = sign + m + 'E' + str(exp10)
        elif form == 'x':
            text = sign + m + random.choice([' x 10^', 'x10^', ' x10^', '*10^', ' * 10^']) + str(exp10)
        elif form == 'times':
            text = sign + m + random.choice([' \u00d7 10^', '\u00d710^']) + ('(' + str(exp10) + ')' if random.random() < 0.15 else str(exp10))
        else:
            letter = random.choice(list(SUFFIX)); suffix = SUFFIX[letter]; exp10 = 0
            text = sign + m + letter
        value = Decimal(m).scaleb(exp10 + suffix)
        if neg:
            value = -value
        sig = random.choice([None, None, None, 3, 4, 6, 2, 2])
        e = notation(value, sig)
        e.update({'text': text, 'sig': 'full' if sig is None else str(sig)})
        out.append(e)
    # a few exact classics and zero
    for text, val in [('4700000', '4700000'), ('0.000047', '0.000047'), ('4.7k', '4700'), ('100u', '0.0001'), ('2.2M', '2200000'), ('10m', '0.01'), ('10M', '10000000'), ('1e-6', '0.000001'), ('299792458', '299792458'), ('6.62607015e-34', '6.62607015E-34'), ('1.602176634e-19', '1.602176634E-19'), ('0', '0'), ('0.0', '0'), ('-0', '0'), ('1,000', '1000'), ('1,234,567.89', '1234567.89'), ('10^-3', '0.001'), ('10^6', '1000000')]:
        e = notation(Decimal(val), None); e.update({'text': text, 'sig': 'full'}); out.append(e)
    return out


def power10_vectors():
    out = []
    for _ in range(300):
        c = random.choice(['1', '1', '1', '2.2', '4.7', '-3.3', '0.5', '12.5', '100', '0.001', '999.95', '6.8', '47', '123456789.123456789'])
        n = random.randint(-40, 40) if random.random() < 0.9 else random.choice([-300, 300, -1000, 1000, 100000, -100000])
        sig = random.choice([None, None, 3, 4])
        e = notation(Decimal(c).scaleb(n), sig)
        e.update({'c': c, 'n': str(n), 'sig': 'full' if sig is None else str(sig)})
        out.append(e)
    return out


def prefix_vectors():
    out = []
    keys = [k for k, s, e in PREFIXES]
    for _ in range(400):
        ip, fp = mantissa()
        m = ip + ('.' + fp if fp else '')
        if random.random() < 0.2:
            m = '-' + m
        frm = random.choice(keys); to = random.choice(keys + ['auto', 'auto', 'auto'])
        sig = random.choice([None, None, 3, 4, 6])
        base = Decimal(m).scaleb(KEY[frm][1])
        baseR = rnd(base, sig)
        if to == 'auto':
            adj = baseR.adjusted() if baseR != 0 else 0
            n3 = max(-30, min(30, 3 * (adj // 3))); toKey = [k for k, s, e in PREFIXES if e == n3][0]
        else:
            toKey = to
        res = rnd(base.scaleb(-KEY[toKey][1]), sig)
        s, digs, adj = fields(res)
        out.append({'v': m, 'from': frm, 'to': to, 'sig': 'full' if sig is None else str(sig), 'toKey': toKey, 'sign': s, 'digits': digs, 'adj': adj})
    return out


# ---------- the exponential functions ----------
def d6(x, sig):
    """an mpf to a Decimal at sig significant figures, half up"""
    return rnd(Decimal(nstr(x, 45)), sig)


def sci_text(d):
    s, digs, adj = fields(d)
    if s == 0:
        return '0'
    return ('-' if s < 0 else '') + digs[0] + ('.' + digs[1:] if len(digs) > 1 else '') + ' \u00d7 10^' + str(adj)


def u_text(x, sig=6):
    d = d6(x, sig)
    if d == 0:
        return '0'
    adj = d.normalize().adjusted()
    if -4 <= adj <= 8:
        p = format(d.normalize(), 'f')
        if len(p) <= 24:
            return p
    return sci_text(d)


def q_text(x, unit, sig=6):
    d = d6(x, sig)
    if d == 0:
        return '0' + (' ' + unit if unit else '')
    if not unit:
        return u_text(x, sig)
    n = d.normalize(); adj = n.adjusted(); n3 = 3 * (adj // 3)
    coef = format(n.scaleb(-n3), 'f')
    if unit == 's' and n3 > 0:
        return u_text(x, sig) + ' s'
    if n3 in ENGSYM:
        return coef + ' ' + ENGSYM[n3] + unit
    return coef + ' \u00d7 10^' + str(n3) + ' ' + unit


def pick_value(units):
    mant = random.choice(['1', '1.5', '2.2', '3.3', '4.7', '5.6', '6.8', '10', '22', '47', '100'])
    letter = random.choice(units)
    return mant + letter, Decimal(mant).scaleb(SUFFIX.get(letter, 0))


def circuit_vectors():
    out = []
    for mode in ['rc_charge', 'rc_discharge', 'rl_rise', 'rl_decay']:
        rc = mode.startswith('rc'); rise = mode.endswith('charge') and mode == 'rc_charge' or mode == 'rl_rise'
        for i in range(70):
            far = i >= 62
            fT, fD = pick_value(['', '', 'm', 'k', ''])
            if random.random() < 0.2:
                fT = '-' + fT; fD = -fD
            rT, rD = pick_value(['', 'k', 'M', 'm', '', 'k'])
            xT, xD = pick_value(['u', 'n', 'p', 'u', 'm'] if rc else ['m', 'u', '', 'm'])
            tau = rD * xD if rc else xD / rD
            n = random.uniform(700.5, 4000) if far else random.choice([random.uniform(0.01, 12), random.uniform(0.01, 60), 1.0, 2.0, 5.0])
            t = Decimal(format(tau * Decimal(f'{n:.4f}'), '.12e')).normalize()
            tT = str(t)
            case = {'mode': mode, 'f': fT, 'r': rT, ('c' if rc else 'l'): xT, 't': tT}
            Fv = mpf(str(fD)); R = mpf(str(rD)); X = mpf(str(xD)); tt = mpf(str(t)); ta = R * X if rc else X / R; nn = tt / ta
            unit = 'V' if rc else 'A'
            f = (1 - exp(-nn)) if rise else exp(-nn)
            exp_ = {'value': nstr(Fv * f, 30), 'tau': nstr(ta, 30), 'n': nstr(nn, 30), 'far': far}
            exp_['valText'] = q_text(Fv * f, unit); exp_['tauText'] = q_text(ta, 's')
            if not far:
                exp_['rows'] = [[f'{k} \u03c4', q_text(k * ta, 's'), q_text(Fv * ((1 - exp(-k)) if rise else exp(-k)), unit), q_text(100 * ((1 - exp(-k)) if rise else exp(-k)), '') + ' %'] for k in range(6)]
                if random.random() < 0.6:
                    q = random.choice([0.01, 0.1, 0.25, 0.5, 0.632, 0.75, 0.9, 0.99]) if rise else random.choice([0.001, 0.01, 0.1, 0.25, 0.5, 0.75, 0.99, 1.0])
                    tg = (fD * Decimal(str(q))).normalize()
                    case['tg'] = str(tg)
                    qq = mpf(str(tg)) / Fv
                    nstar = (-log(1 - qq)) if rise else (-log(qq))
                    exp_['tStar'] = nstar * ta; exp_['tStar'] = nstr(exp_['tStar'], 30); exp_['tStarText'] = q_text(nstar * ta, 's')
            out.append({'case': case, 'exp': exp_, 'unit': unit})
    return out


def general_vectors():
    out = []
    for mode in ['growth', 'decay', 'compound']:
        for i in range(90):
            far = i >= 84
            yT, yD = pick_value(['', '', 'm', 'k', ''])
            if random.random() < 0.15:
                yT = '-' + yT; yD = -yD
            if mode == 'compound':
                kT = str(random.choice([0.5, 1, 2.5, 5, 7.25, 12, 100, 250, -10, -50, -99, 0.01, 3.75]))
                tT = str(random.choice([0, 1, 2, 5, 10, 12, 30, 2.5, 0.5, 100, 7]))
                if far:
                    kT = str(random.choice([100, 900, 5000])); tT = str(random.choice([400, 900, 3000]))
                kk = mpf(kT); tt = mpf(tT); Lg = log1p(kk / 100); ex0 = tt * Lg
                factor = exp(ex0); val = mpf(str(yD)) * factor
                case = {'mode': mode, 'y': yT, 'k': kT, 't': tT}
                expd = {'value': nstr(val, 30), 'valText': u_text(val), 'factorText': u_text(factor), 'changeText': u_text(expm1(ex0) * 100) + ' %'}
                if kk != 0:
                    expd['dbl'] = nstr(log(2) / abs(Lg), 30)
                out.append({'case': case, 'exp': expd, 'far': (abs(ex0) > 700)})
                continue
            grow = mode == 'growth'
            kT = random.choice(['0.5', '0.2', '1', '2', '0.05', '0.001', '3.3', '10', '0.0125'])
            nT = random.choice([0.01, 0.5, 1, 2, 5, 10, 25, 39, 3.3])
            if far:
                nT = random.choice([720, 800, 1500, 5000])
            kk = mpf(kT); n = mpf(str(nT)); t = n / kk
            tT = str(Decimal(nstr(t, 12)).normalize())
            tt = mpf(tT); ex0 = (kk * tt) if grow else -(kk * tt)
            factor = exp(ex0); val = mpf(str(yD)) * factor
            case = {'mode': mode, 'y': yT, 'k': kT, 't': tT}
            expd = {'value': nstr(val, 30), 'valText': u_text(val), 'factorText': u_text(factor), 'changeText': u_text(expm1(ex0) * 100) + ' %', 'dbl': nstr(log(2) / kk, 30), 'far': far}
            if not far and random.random() < 0.6:
                q = random.choice([2, 10, 100, 1.5, 1000]) if grow else random.choice([0.5, 0.1, 0.01, 0.25, 0.9, 1.0])
                tg = (yD * Decimal(str(q))).normalize()
                case['tg'] = str(tg)
                qq = mpf(str(tg)) / mpf(str(yD))
                expd['tStar'] = nstr(log(qq) / (kk if grow else -kk), 30)
            out.append({'case': case, 'exp': expd, 'far': far})
    return out


if __name__ == '__main__':
    data = {'notation': notation_vectors(), 'power10': power10_vectors(), 'prefix': prefix_vectors(), 'circuit': circuit_vectors(), 'general': general_vectors()}
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exponent_eng_vectors.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False)
    print({k: len(v) for k, v in data.items()}, 'written', path)
