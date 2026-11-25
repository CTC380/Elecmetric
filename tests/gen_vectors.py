#!/usr/bin/env python3
"""Independent reference vectors for Elecmetric.
Every formula here is written from the textbook relation, NOT copied from engine.js.
Run:  python3 gen_vectors.py > reference_vectors.json   (seeded, so output is reproducible)"""
import json, math, random
random.seed(20261107)
S3 = math.sqrt(3)
HPW = 550 * 0.3048 * 0.45359237 * 9.80665   # mechanical horsepower, exact: 550 ft*lbf/s
def pick(lo, hi, nd=3): return round(random.uniform(lo, hi), nd)
V = []
RETIRED = {"percentage-error", "fraction-calculator"}   # v1.99.78: pages replaced by percent-error-calculator and fraction-arithmetic; the draws below still run so every other vector is unchanged
def add(id, inp, out, tol=1e-9):
    if id not in RETIRED: V.append({"id": id, "in": inp, "out": out, "tol": tol})

for _ in range(10):
    P, Vv, pf, ph, eff = pick(1, 900), random.choice([230, 400, 415, 690, 11000]), pick(0.5, 1), random.choice([1, 3]), pick(0.7, 1)
    k = S3 if ph == 3 else 1
    add("three-phase-current", {"P": P, "V": Vv, "pf": pf, "phase": ph, "eff": eff}, {"I": P * 1000 / (eff * k * Vv * pf)})
    I = pick(1, 2000)
    add("amps-to-kw", {"I": I, "V": Vv, "pf": pf, "phase": ph}, {"P": k * Vv * I * pf / 1000})
    S, ph2 = pick(5, 5000), random.choice([1, 3])
    add("kva-to-amps", {"S": S, "V": Vv, "phase": ph2}, {"I": S * 1000 / ((S3 if ph2 == 3 else 1) * Vv)})
    add("amps-to-kva", {"I": I, "V": Vv, "phase": ph2}, {"S": (S3 if ph2 == 3 else 1) * Vv * I / 1000})
    add("kw-to-kva", {"P": P, "pf": pf}, {"S": P / pf, "Q": P * math.tan(math.acos(pf))})
    add("kva-to-kw", {"S": S, "pf": pf}, {"P": S * pf, "Q": S * math.sin(math.acos(pf))})
    add("watts-to-amps", {"P": P * 10, "V": Vv if Vv < 1000 else 230, "pf": pf}, {"I": P * 10 / ((Vv if Vv < 1000 else 230) * pf)})
    Rr, Vo = pick(0.5, 5000), pick(1, 600)
    add("ohms-law", {"V": Vo, "R": Rr}, {"I": Vo / Rr, "P": Vo * Vo / Rr})
    Ix = pick(0.01, 80)
    add("power-vir", {"V": Vo, "I": Ix}, {"P": Vo * Ix, "R": Vo / Ix})
    R1, R2, R3 = pick(1, 900), pick(1, 900), pick(1, 900)
    add("resistance-series", {"R1": R1, "R2": R2, "R3": R3}, {"Rt": R1 + R2 + R3})
    add("resistance-parallel", {"R1": R1, "R2": R2, "R3": R3}, {"Rt": 1 / (1 / R1 + 1 / R2 + 1 / R3)})
    f, L, C = random.choice([50, 60, 400]), pick(1, 500), pick(1, 900)
    add("reactance", {"f": f, "L": L, "C": C}, {"XL": 2 * math.pi * f * L * 1e-3, "XC": 1 / (2 * math.pi * f * C * 1e-6)})
    Sx, Vx, Z = pick(50, 3000), random.choice([230, 400, 415, 690]), pick(2, 10)
    add("fault-current", {"S": Sx, "V": Vx, "Z": Z}, {"Isc": Sx / (S3 * Vx * Z / 100)})
    add("transformer-current", {"S": Sx, "V": Vx}, {"I": Sx * 1000 / (S3 * Vx)})
    Pm, N = pick(1, 400), random.choice([720, 980, 1480, 2950])
    add("motor-torque", {"P": Pm, "N": N}, {"T": Pm * 1000 * 60 / (2 * math.pi * N)})
    pf1 = pick(0.6, 0.9); pf2 = pick(pf1 + 0.02, 0.99)
    add("pf-correction-kvar", {"P": P, "pf1": pf1, "pf2": pf2}, {"Qc": P * (math.tan(math.acos(pf1)) - math.tan(math.acos(pf2)))})
    h, d, t = pick(1, 24), random.choice([30, 365]), pick(1, 12)
    Pe = pick(0.1, 50)
    add("energy-cost", {"P": Pe, "h": h, "d": d, "t": t}, {"E": Pe * h * d, "cost": Pe * h * d * t})
    Vs = pick(5, 24); Vf = pick(1.5, 3.4); If = pick(5, 30)
    add("led-resistor", {"Vs": Vs, "Vf": Vf, "If": If}, {"R": (Vs - Vf) / (If / 1000), "P": (Vs - Vf) * (If / 1000)})
    Vin, Ra, Rb = pick(3, 48), pick(1, 100), pick(1, 100)
    add("voltage-divider", {"Vin": Vin, "R1": Ra, "R2": Rb}, {"Vo": Vin * Rb / (Ra + Rb), "Id": Vin / ((Ra + Rb) * 1000) * 1000})
    Rk, Cu = pick(0.1, 100), pick(0.001, 10)
    add("rc-time-constant", {"R": Rk, "C": Cu}, {"tau": Rk * 1e3 * Cu * 1e-6 * 1e3, "fc": 1 / (2 * math.pi * Rk * 1e3 * Cu * 1e-6)})
    rv, rp = pick(0.01, 1000), pick(0.01, 1000)
    add("decibel", {"rv": rv, "rp": rp}, {"dv": 20 * math.log10(rv), "dp": 10 * math.log10(rp)})
    z, S1, V1, S2, V2 = pick(0.01, 0.3), pick(1, 50), pick(1, 33), pick(1, 200), pick(1, 33)
    add("per-unit-convert", {"z": z, "S1": S1, "V1": V1, "S2": S2, "V2": V2}, {"zn": z * (S2 / S1) * (V1 / V2) ** 2})
    hp = pick(1, 1000)
    add("hp-kw-converter", {"P": hp}, {"kw": hp * HPW / 1000, "ps": hp * HPW / 735.49875})
    c1, c2, c3 = pick(1, 100), pick(1, 100), pick(1, 100)
    add("capacitance-series-parallel", {"C1": c1, "C2": c2, "C3": c3}, {"Cp": c1 + c2 + c3, "Cs": 1 / (1 / c1 + 1 / c2 + 1 / c3)})
    # voltage drop (exact textbook approximation Vd = k I L (R cos + X sin))
    I, Lm, Rk2, Xk, Vv, pf, ph = pick(5, 600), pick(5, 800), pick(0.05, 3), pick(0.05, 0.12), random.choice([230, 400, 415]), pick(0.7, 1), random.choice([1, 3])
    k = S3 if ph == 3 else 2
    Vd = k * I * (Lm / 1000) * (Rk2 * pf + Xk * math.sqrt(1 - pf * pf))
    add("voltage-drop", {"I": I, "L": Lm, "R": Rk2, "X": Xk, "V": Vv, "pf": pf, "phase": ph}, {"Vd": Vd, "pct": Vd / Vv * 100})
    # resistance-based DC drop with copper at 20C
    Ia, La, Aa = pick(1, 200), pick(1, 300), random.choice([2.5, 4, 6, 10, 16, 25, 35])
    add("dc-voltage-drop", {"I": Ia, "L": La, "A": Aa, "mat": 1, "T": 20, "V": 230, "phase": 1}, {"Vd": 2 * Ia * La * 1.7241e-8 / (Aa * 1e-6), "pct": 2 * Ia * La * 1.7241e-8 / (Aa * 1e-6) / 230 * 100}, 1e-6)

# ---- v1.4 additions: second batch, again from textbook relations only (engine.js not consulted) ----
for _ in range(6):
    kk = lambda ph: S3 if ph == 3 else 1
    # motor / power
    Pm, Vm, pfm, em, ph = pick(1, 500), random.choice([230, 400, 415, 690]), pick(0.6, 0.95), pick(0.7, 0.97), random.choice([1, 3])
    add("motor-current", {"P": Pm, "V": Vm, "pf": pfm, "eff": em, "phase": ph}, {"I": Pm * 1000 / (kk(ph) * Vm * pfm * em), "Pin": Pm / em})
    Im, Vi, pfi, emi = pick(5, 600), random.choice([400, 415, 690]), pick(0.6, 0.95), pick(0.7, 0.97)
    Pin = S3 * Vi * Im * pfi / 1000
    add("motor-power-output", {"V": Vi, "I": Im, "pf": pfi, "eff": emi}, {"Pin": Pin, "Pout": Pin * emi, "loss": Pin * (1 - emi)})
    L1, L2, L3 = pick(1, 100), pick(1, 100), pick(1, 100)
    add("inductance-series-parallel", {"L1": L1, "L2": L2, "L3": L3}, {"Ls": L1 + L2 + L3, "Lp": 1 / (1 / L1 + 1 / L2 + 1 / L3)})
    Rz, Lz, Cz, fz = pick(0.5, 200), pick(1, 500), pick(1, 900), random.choice([50, 60])
    X = 2 * math.pi * fz * Lz * 1e-3 - 1 / (2 * math.pi * fz * Cz * 1e-6); Zz = math.hypot(Rz, X)
    add("impedance-rlc", {"R": Rz, "L": Lz, "C": Cz, "f": fz}, {"Z": Zz, "phi": math.degrees(math.atan2(X, Rz)), "pf": Rz / Zz})
    f2 = pick(1, 1000)
    add("frequency-period", {"f": f2}, {"T": 1000 / f2, "w": 2 * math.pi * f2})
    Vp = pick(1, 700)
    add("rms-peak", {"Vp": Vp}, {"Vrms": Vp / math.sqrt(2), "Vpp": 2 * Vp})
    Ia, Va, pa = pick(0.1, 100), random.choice([110, 230]), pick(0.5, 1)
    add("amps-to-watts", {"I": Ia, "V": Va, "pf": pa}, {"P": Va * Ia * pa})
    Vt, It, pt_ = random.choice([400, 415, 690]), pick(1, 800), pick(0.5, 1)
    St = S3 * Vt * It / 1000; Pt = St * pt_
    add("three-phase-power", {"V": Vt, "I": It, "pf": pt_}, {"P": Pt, "S": St, "Q": math.sqrt(St * St - Pt * Pt)})
    Pp, Sp = pick(10, 90), pick(91, 200)
    add("power-factor", {"P": Pp, "S": Sp}, {"pf": Pp / Sp, "phi": math.degrees(math.acos(Pp / Sp))})
    # cables
    Lc, Ac, Tc = pick(5, 900), random.choice([2.5, 6, 16, 35, 95, 240]), pick(20, 90)
    Rc = 0.017241 * Lc / Ac * (1 + 0.00393 * (Tc - 20))
    add("cable-resistance", {"L": Lc, "A": Ac, "rho": 0.017241, "T": Tc, "alpha": 0.00393}, {"R": Rc, "Rk": Rc / Lc * 1000}, 1e-6)
    n = random.choice([4, 6, 8, 10, 12, 14, 16, 18, 20])
    d = 0.127 * 92 ** ((36 - n) / 39)
    add("wire-gauge-conversion", {"n": n}, {"d": d, "A": math.pi / 4 * d * d}, 1e-6)
    Ix, Vx, lim, Rk, Xk, pfx, phx = pick(10, 500), random.choice([230, 400, 415]), random.choice([2, 3, 5]), pick(0.05, 2), pick(0.05, 0.12), pick(0.7, 1), random.choice([1, 3])
    kx = S3 if phx == 3 else 2
    add("max-cable-length", {"I": Ix, "V": Vx, "lim": lim, "R": Rk, "X": Xk, "pf": pfx, "phase": phx}, {"L": Vx * lim / 100 / (kx * Ix * (Rk * pfx + Xk * math.sqrt(1 - pfx * pfx))) * 1000}, 1e-6)
    Ic, Lcp, Rkc, Vc, pfc, phc = pick(5, 600), pick(10, 3000), pick(0.05, 3), random.choice([400, 415]), pick(0.7, 1), random.choice([1, 3])
    nc = 3 if phc == 3 else 2
    Plc = nc * Ic * Ic * Rkc * Lcp / 1000  # watts
    add("cable-power-loss", {"I": Ic, "L": Lcp, "R": Rkc, "V": Vc, "pf": pfc, "phase": phc}, {"Pl": Plc}, 1e-6)
    R20, Tt = pick(0.1, 10), pick(-10, 120)
    add("conductor-temp-resistance", {"R20": R20, "T": Tt, "mat": 1}, {"RT": R20 * (1 + 0.00393 * (Tt - 20))}, 1e-4)
    # motors
    fm, pol, Nr = random.choice([50, 60]), random.choice([2, 4, 6, 8]), 0
    Ns = 120 * fm / pol; Nr = Ns * pick(0.94, 0.995)
    add("motor-slip", {"f": fm, "poles": pol, "N": Nr}, {"Ns": Ns, "slip": (Ns - Nr) / Ns * 100})
    Sk, Pf_, Pc_, xl, pfl = pick(100, 2000), pick(0.5, 5), pick(2, 20), pick(0.3, 1.1), pick(0.7, 1)
    loss = Pf_ + xl * xl * Pc_
    add("transformer-efficiency", {"S": Sk, "Pfe": Pf_, "Pcu": Pc_, "x": xl, "pf": pfl}, {"eff": xl * Sk * pfl / (xl * Sk * pfl + loss) * 100, "loss": loss}, 1e-6)
    Ind, kst, Tn, ktq, Tl = pick(10, 400), pick(5, 8), pick(50, 2000), pick(1.2, 2.2), pick(10, 100)
    add("star-delta-starting", {"In": Ind, "k": kst, "Tn": Tn, "kt": ktq, "Tl": Tl}, {"Id": kst * Ind, "Iy": kst * Ind / 3, "Td": ktq * Tn, "Ty": ktq * Tn / 3}, 1e-6)
    N1, N2, P1 = pick(700, 1800), pick(300, 1700), pick(1, 200)
    add("fan-pump-affinity", {"N1": N1, "N2": N2, "P1": P1}, {"Q": N2 / N1 * 100, "H": (N2 / N1) ** 2 * 100, "P2": P1 * (N2 / N1) ** 3}, 1e-6)
    Qp, Hp, rhop, ep, emp = pick(5, 500), pick(3, 120), 1000, pick(0.5, 0.85), pick(0.85, 0.96)
    Ph = rhop * 9.80665 * (Qp / 3600) * Hp / 1000
    add("pump-motor-power", {"Q": Qp, "H": Hp, "rho": rhop, "ep": ep, "em": emp}, {"Ph": Ph, "Ps": Ph / ep, "Pm": Ph / ep / emp}, 1e-5)
    # transformers / fault
    Sb, Vb = pick(1, 500), pick(11, 400)
    add("per-unit-base", {"S": Sb, "V": Vb}, {"Ib": Sb * 1e3 / (S3 * Vb), "Zb": Vb * Vb / Sb}, 1e-9)
    Vl, Il, Stl = random.choice([400, 415]), pick(50, 2500), pick(250, 2500)
    Sl = S3 * Vl * Il / 1000
    add("transformer-loading", {"V": Vl, "I": Il, "S": Stl}, {"Sl": Sl, "pct": Sl / Stl * 100})
    Vf, Zf = random.choice([400, 415]), pick(5, 80)
    I3 = Vf / (S3 * Zf / 1000)
    add("fault-types", {"V": Vf, "Z1": Zf, "r0": 1}, {"I3": I3 / 1000, "Ill": I3 * S3 / 2 / 1000}, 1e-6)
    Vm2, Ik = random.choice([415, 690, 11000, 33000]), pick(5, 60)  # V in volts, I in kA
    add("fault-mva", {"V": Vm2, "I": Ik}, {"S": S3 * Vm2 * Ik / 1000}, 1e-9)  # MVA
    # power quality / earthing
    I1, I3h, I5, I7 = pick(50, 500), pick(1, 80), pick(1, 60), pick(1, 40)
    add("harmonic-thd", {"I1": I1, "I3": I3h, "I5": I5, "I7": I7}, {"thd": math.sqrt(I3h**2 + I5**2 + I7**2) / I1 * 100, "Irms": math.sqrt(I1**2 + I3h**2 + I5**2 + I7**2)}, 1e-9)
    rho, Lr, dr = pick(10, 500), pick(1.5, 6), pick(10, 25)
    add("earth-rod-resistance", {"rho": rho, "L": Lr, "d": dr}, {"R": rho / (2 * math.pi * Lr) * (math.log(8 * Lr / (dr / 1000)) - 1)}, 1e-6)
    Ze, Zi, U0, Ia_ = pick(0.05, 1.5), pick(0.1, 2), 230, pick(50, 500)
    add("fault-loop-impedance", {"U0": U0, "Ze": Ze, "Zi": Zi, "Ia": Ia_}, {"Zs": Ze + Zi, "If": U0 / (Ze + Zi), "Zmax": U0 / Ia_, "ratio": (U0 / (Ze + Zi)) / Ia_}, 1e-6)
    Ptot, Pit = pick(500, 3000), pick(300, 499)
    add("pue", {"Pt": Ptot, "Pit": Pit}, {"pue": Ptot / Pit, "dcie": Pit / Ptot * 100, "oh": Ptot - Pit})
    Vu = [pick(380, 430) for _ in range(3)]; avg = sum(Vu) / 3
    add("voltage-unbalance", {"Vab": Vu[0], "Vbc": Vu[1], "Vca": Vu[2]}, {"avg": avg, "vur": max(abs(v - avg) for v in Vu) / avg * 100})
    # energy / storage / solar / misc
    Pk, psh, pr = pick(1, 500), pick(3, 7), pick(0.65, 0.85)
    add("pv-energy", {"P": Pk, "psh": psh, "pr": pr}, {"Ed": Pk * psh * pr, "Ey": Pk * psh * pr * 365}, 1e-9)
    cap, a, b, Pch, ef = pick(20, 120), pick(5, 30), pick(60, 100), pick(3, 50), pick(0.8, 0.95)
    Eb = cap * (b - a) / 100
    add("ev-charge-time", {"cap": cap, "from": a, "to": b, "P": Pch, "eff": ef}, {"Eb": Eb, "Eg": Eb / ef, "T": Eb / ef / Pch}, 1e-9)
    Elx, Ar, phi_, uf, mf = pick(100, 750), pick(10, 500), pick(1000, 9000), pick(0.4, 0.8), pick(0.7, 0.9)
    add("lumen-method", {"E": Elx, "A": Ar, "phi": phi_, "uf": uf, "mf": mf}, {"N": Elx * Ar / (phi_ * uf * mf)}, 1e-9)
    mA, lo, hi = pick(4, 20), 0, pick(50, 500)
    add("current-loop-4-20", {"I": mA, "lo": lo, "hi": hi}, {"PV": lo + (mA - 4) / 16 * (hi - lo), "pct": (mA - 4) / 16 * 100}, 1e-9)
    Pb, tb, Vb2, dod, eta = pick(100, 5000), pick(1, 24), random.choice([12, 24, 48]), pick(0.5, 0.9), pick(0.8, 0.95)
    Ebw = Pb * tb / (dod * eta)
    add("battery-bank-size", {"P": Pb, "t": tb, "V": Vb2, "dod": dod, "eff": eta}, {"E": Pb * tb / eta / 1000, "Ah": Ebw / Vb2}, 1e-9)
    Vc2, Ahc, ns, np_ = random.choice([2, 12]), pick(50, 200), random.randint(1, 30), random.randint(1, 8)
    add("battery-series-parallel", {"Vc": Vc2, "Ahc": Ahc, "ns": ns, "np": np_}, {"Vb": Vc2 * ns, "Ahb": Ahc * np_, "E": Vc2 * ns * Ahc * np_ / 1000}, 1e-9)
    Ce, Vce, Lh, Ih = pick(10, 2000), pick(12, 800), pick(1, 500), pick(1, 100)
    add("lc-energy", {"C": Ce, "V": Vce, "L": Lh, "I": Ih}, {"Ec": 0.5 * Ce * 1e-6 * Vce**2, "El": 0.5 * Lh * 1e-3 * Ih**2}, 1e-9)
    Lr2, Cr2, Rr2 = pick(1, 100), pick(1, 100), pick(0.5, 50)
    f0 = 1 / (2 * math.pi * math.sqrt(Lr2 * 1e-3 * Cr2 * 1e-6)); X0 = math.sqrt(Lr2 * 1e-3 / (Cr2 * 1e-6))
    add("resonance-lc", {"L": Lr2, "C": Cr2, "R": Rr2}, {"f0": f0, "X0": X0, "Q": X0 / Rr2, "bw": f0 / (X0 / Rr2)}, 1e-6)
    Ra_, Rb_, Rc_ = pick(1, 200), pick(1, 200), pick(1, 200); sm = Ra_ + Rb_ + Rc_
    add("delta-wye", {"Rab": Ra_, "Rbc": Rb_, "Rca": Rc_}, {"Ra": Ra_ * Rc_ / sm, "Rb": Ra_ * Rb_ / sm, "Rc": Rb_ * Rc_ / sm}, 1e-9)
    Rb1, ng, uu = pick(5, 100), random.randint(2, 10), pick(0.7, 0.95)
    add("earth-rods-parallel", {"R1": Rb1, "n": ng, "u": uu}, {"Rt": Rb1 / (ng * uu)}, 1e-9)
    cw, dTw = 4.186, pick(10, 80)
    Vw, tw, ew = pick(50, 3000), pick(1, 8), pick(0.8, 0.99)
    Ew = Vw * cw * dTw / 3600  # heat needed; heater rating divides by efficiency
    add("water-heater-kw", {"V": Vw, "dT": dTw, "t": tw, "eff": ew, "c": cw}, {"E": Ew, "P": Ew / (tw * ew)}, 1e-6)
    Ee = pick(0.1, 1000)
    add("energy-converter", {"E": Ee}, {"MJ": Ee * 3.6, "BTU": Ee * 3412.141633, "kcal": Ee * 859.845228}, 1e-6)
    R30 = pick(100, 3000); R60 = R30 * pick(1.05, 2); R600 = R60 * pick(1.2, 4)
    add("insulation-pi-dar", {"R30": R30, "R60": R60, "R600": R600}, {"dar": R60 / R30, "pi": R600 / R60}, 1e-9)
    Dw, vw, cpw, rhow, ewg = pick(10, 150), pick(4, 16), pick(0.25, 0.45), 1.225, pick(0.85, 0.98)
    Aw = math.pi * Dw * Dw / 4; Pw = 0.5 * rhow * Aw * vw**3 / 1000
    add("wind-power", {"D": Dw, "v": vw, "cp": cpw, "rho": rhow, "eff": ewg}, {"A": Aw, "Pw": Pw, "Pe": Pw * cpw * ewg}, 1e-9)
    R1k, R2k, Cu = pick(1, 100), pick(1, 100), pick(0.1, 100)
    th, tl = 0.693 * (R1k + R2k) * 1e3 * Cu * 1e-6, 0.693 * R2k * 1e3 * Cu * 1e-6
    add("timer-555", {"R1": R1k, "R2": R2k, "C": Cu}, {"f": 1 / (th + tl), "duty": th / (th + tl) * 100}, 5e-3)
    Pw2, Ta, Tj, tjc, tcs = pick(1, 100), pick(25, 50), pick(110, 175), pick(0.2, 2), pick(0.1, 1)
    tja = (Tj - Ta) / Pw2
    add("heatsink-thermal", {"P": Pw2, "Ta": Ta, "Tj": Tj, "tjc": tjc, "tcs": tcs}, {"tja": tja, "tsa": tja - tjc - tcs}, 1e-9)
    Rf, Rin, Vin = pick(1, 1000), pick(1, 100), pick(0.01, 2)
    add("op-amp-gain", {"Rf": Rf, "Rin": Rin, "Vin": Vin, "cfg": 1}, {"A": -Rf / Rin, "Vo": -Rf / Rin * Vin}, 1e-9)
    add("op-amp-gain", {"Rf": Rf, "Rin": Rin, "Vin": Vin, "cfg": 2}, {"A": 1 + Rf / Rin, "Vo": (1 + Rf / Rin) * Vin}, 1e-9)
    Rk3, Cn, fx = pick(0.1, 100), pick(1, 1000), pick(10, 10000)
    add("rc-filter-cutoff", {"R": Rk3, "C": Cn, "f": fx, "type": 1}, {"fc": 1 / (2 * math.pi * Rk3 * 1e3 * Cn * 1e-9)}, 1e-9)
    R0r, Tr = 100, pick(0, 200)  # Callendar-Van Dusen, T >= 0 C
    Rpt = R0r * (1 + 3.9083e-3 * Tr - 5.775e-7 * Tr * Tr)
    add("rtd-pt100", {"R": Rpt, "R0": R0r}, {"T": Tr}, 1e-6)
    Tmp = [pick(20, 100) for _ in range(3)]
    add("neutral-current-unbalance", {"Ia": Tmp[0], "Ib": Tmp[1], "Ic": Tmp[2]}, {"In": math.sqrt(Tmp[0]**2 + Tmp[1]**2 + Tmp[2]**2 - Tmp[0]*Tmp[1] - Tmp[1]*Tmp[2] - Tmp[2]*Tmp[0])}, 1e-9)
    Pg, sfc, dg, Tk = pick(50, 2000), pick(200, 260), 0.84, pick(200, 5000)
    lph = Pg * sfc / 1000 / dg
    add("generator-fuel", {"P": Pg, "sfc": sfc, "d": dg, "Tk": Tk}, {"lph": lph, "rt": Tk / lph}, 1e-6)
    Ep = pick(10, 200); psh2, pr2, Pmod = pick(3, 7), pick(0.65, 0.85), random.choice([400, 450, 550])
    Pa = Ep / (psh2 * pr2)
    add("pv-array-size", {"E": Ep, "psh": psh2, "pr": pr2, "Pm": Pmod}, {"Pa": Pa, "nm": math.ceil(Pa * 1000 / Pmod)}, 1e-9)
    nl, Dp, dd = random.randint(2, 20), pick(20, 100), pick(5, 15)
    add("conduit-fill", {"D": Dp, "d": dd, "n": nl}, {"fill": nl * dd * dd / (Dp * Dp) * 100}, 1e-9)

# ---- v1.4.1+ batch: calculators previously without independent vectors (textbook relations, written without reading engine.js) ----
E24 = [1.0,1.1,1.2,1.3,1.5,1.6,1.8,2.0,2.2,2.4,2.7,3.0,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1]
def e24_floor(r):
    d = 10 ** math.floor(math.log10(r)); m = r / d
    best = max(x for x in E24 if x <= m * (1 + 1e-12))
    return best * d
for _ in range(8):
    VLx, ILx, con = random.choice([230, 400, 415, 690, 11000]), pick(1, 800), random.choice([1, 2])
    Vp, Ip = (VLx / S3, ILx) if con == 1 else (VLx, ILx / S3)
    add("line-phase", {"VL": VLx, "IL": ILx, "con": con}, {"Vp": Vp, "Ip": Ip, "Zp": Vp / Ip, "S": S3 * VLx * ILx / 1000}, 1e-9)
    Qk, Vq, fq = pick(5, 500), random.choice([400, 415, 690]), random.choice([50, 60])
    add("pf-capacitor-uf", {"Q": Qk, "V": Vq, "f": fq}, {"C": Qk * 1000 / (3 * 2 * math.pi * fq * Vq ** 2) * 1e6, "I": Qk * 1000 / (S3 * Vq)}, 1e-9)
    Pl, eff, Vb, Ah, dod, age = pick(1, 50), pick(0.85, 0.98), random.choice([48, 120, 240, 480]), pick(20, 400), pick(0.5, 0.9), pick(0.6, 1)
    Eu = Vb * Ah * dod * age / 1000
    add("ups-runtime", {"Pl": Pl, "eff": eff, "Vb": Vb, "Ah": Ah, "dod": dod, "age": age}, {"E": Eu, "T": Eu * eff / Pl * 60}, 1e-9)
    Cap, fr, Ic, eta = pick(20, 500), pick(0.2, 0.9), pick(2, 100), pick(0.75, 0.95)
    Qd = Cap * fr / eta
    add("battery-charge-time", {"Cap": Cap, "fr": fr, "Ic": Ic, "eta": eta}, {"Qc": Qd, "t": Qd / Ic}, 1e-9)
    Vi, Vz, ILm, Izm = pick(9, 30), pick(3, 8), pick(2, 80), pick(2, 15)
    Rs = (Vi - Vz) / ((ILm + Izm) / 1000)
    add("zener-regulator", {"Vin": Vi, "Vz": Vz, "IL": ILm, "Iz": Izm}, {"Rs": Rs, "Rstd": e24_floor(Rs), "Pr": ((ILm + Izm) / 1000) ** 2 * Rs, "Pz": Vz * (ILm + Izm) / 1000}, 1e-9)
    Vi2, Vbe, Icm, hfe, kk = pick(3, 12), pick(0.6, 0.8), pick(5, 500), random.choice([50, 100, 200]), pick(1.5, 3)
    Ib = kk * Icm / hfe
    add("bjt-base-resistor", {"Vin": Vi2, "Vbe": Vbe, "Ic": Icm, "hfe": hfe, "k": kk}, {"Ib": Ib, "Rb": (Vi2 - Vbe) / (Ib / 1000), "Rstd": e24_floor((Vi2 - Vbe) / (Ib / 1000))}, 1e-9)
    Prk, dT = pick(1, 40), pick(8, 20)
    btu = Prk * 3412.14163
    add("rack-cooling", {"P": Prk, "dT": dT}, {"btu": btu, "tons": btu / 12000, "air": Prk * 1000 / (1.2 * 1005 * dT) * 3600}, 1e-6)  # air: rho 1.2 kg/m3, cp 1005 J/(kg K) as printed in the calculator assumptions, in m3/h
    Zp_, Rp_ = pick(4, 8), pick(0.5, 1.5); Xp_ = math.sqrt(Zp_ ** 2 - Rp_ ** 2)
    pfm, Vm2, xl = pick(0.7, 0.95), random.choice([400, 415, 433]), pick(0.5, 1)
    sn = math.sqrt(1 - pfm ** 2)
    first = xl * (Rp_ * pfm + Xp_ * sn)
    exact_reg = first + (xl * (Xp_ * pfm - Rp_ * sn)) ** 2 / 200
    add("transformer-regulation", {"Z": Zp_, "R": Rp_, "x": xl, "pf": pfm, "V": Vm2}, {"reg": exact_reg}, 5e-3)
    In_, ks, Vs_, Ssc = pick(20, 600), pick(5, 8), random.choice([400, 415, 690]), pick(2, 50)
    Sst = S3 * Vs_ * In_ * ks / 1e6
    dip = Sst / (Sst + Ssc) * 100
    add("motor-start-dip", {"In": In_, "k": ks, "V": Vs_, "Ssc": Ssc}, {"Sst": Sst, "dip": dip, "Tq": (1 - dip / 100) ** 2 * 100}, 1e-6)
    Vn, Ifn, tn = random.choice([3.3, 6.6, 11, 33]), pick(50, 1000), pick(1, 30)
    Rn = Vn * 1000 / S3 / Ifn
    add("ngr-sizing", {"V": Vn, "If": Ifn, "t": tn}, {"R": Rn, "P": Ifn ** 2 * Rn / 1000, "E": Ifn ** 2 * Rn / 1000 * tn / 3600}, 1e-9)
    rho, Ag, LT = pick(20, 500), pick(200, 5000), pick(200, 3000)
    add("earth-grid-resistance", {"rho": rho, "A": Ag, "LT": LT}, {"Rg": rho / (4 * math.sqrt(Ag / math.pi)) + rho / LT}, 1e-9)
    nn, Wo, Wn, hh, tar, cst = random.randint(10, 500), pick(100, 250), pick(20, 90), random.choice([2000, 4000, 8760]), pick(4, 12), pick(500, 5000)
    Es = nn * (Wo - Wn) * hh / 1000
    add("led-retrofit-payback", {"n": nn, "Wo": Wo, "Wn": Wn, "h": hh, "tar": tar, "cost": cst}, {"Es": Es, "cs": Es * tar, "pb": cst * nn / (Es * tar)}, 1e-9)
    Pgk, pfg, mg = pick(50, 2000), pick(0.7, 0.9), pick(10, 40)
    GEN_STD = [10, 15, 20, 30, 40, 50, 62.5, 75, 100, 125, 150, 200, 250, 320, 400, 500, 625, 750, 1000, 1250, 1500, 2000, 2500]  # standard genset kVA list printed in the calculator assumptions
    Srg = Pgk / pfg * (1 + mg / 100); Ssg = next((x for x in GEN_STD if x >= Srg - 1e-9), None)
    gout = {"Sr": Srg}
    if Ssg is not None: gout.update({"Ss": Ssg, "I": Ssg * 1000 / (S3 * 415)})
    add("generator-kva", {"P": Pgk, "pf": pfg, "m": mg, "V": 415}, gout, 1e-9)
    Rm, Tm = pick(50, 5000), pick(5, 60)
    kt = 0.5 ** ((40 - Tm) / 10)
    add("ir-temp-correction", {"Rm": Rm, "T": Tm}, {"kt": kt, "R40": Rm * kt}, 1e-9)

# ---- cable-derating across calculation bases: kt = sqrt((tm - Ta)/(tm - Tref)), Iz = Itab*kt*kg*ko, Ireq = In/(kt*kg*ko), Idev = cf*Ib ----
BASIS_TM = {1: (70, 90), 4: (70, 90), 5: (70, 90), 6: (75, 90), 2: (75, 90)}
BASIS_CF = {1: 1, 4: 1, 5: 1, 6: 1, 2: 1.25}
for _ in range(6):
    for bs in (1, 4, 5, 6, 2):
        ins = random.choice([1, 2]); tm = BASIS_TM[bs][ins - 1]
        Ta, Tr = pick(20, 45), random.choice([30, 40])
        Ib, Itab, kg, ko = pick(20, 400), pick(100, 800), pick(0.6, 1), pick(0.8, 1)
        In = pick(Ib, Ib * 1.5)
        kt = math.sqrt((tm - Ta) / (tm - Tr)); f = kt * kg * ko
        add("cable-derating", {"basis": bs, "Ib": Ib, "In": In, "Itab": Itab, "ins": ins, "Ta": Ta, "Tref": Tr, "kg": kg, "ko": ko}, {"kt": kt, "Iz": Itab * f, "Ireq": In / f, "Idev": BASIS_CF[bs] * Ib}, 1e-9)

# --- v1.5.1: solve-for-any-variable calculators (appended last so earlier seeded vectors do not move) ---
for _ in range(8):
    Vs, Is = pick(5, 600), pick(0.05, 80)
    Rs, Ps = Vs / Is, Vs * Is
    add("vipr-solver", {"V": Vs, "I": Is}, {"R": Rs, "P": Ps})
    add("vipr-solver", {"V": Vs, "R": Rs}, {"I": Is, "P": Ps})
    add("vipr-solver", {"V": Vs, "P": Ps}, {"I": Is, "R": Rs})
    add("vipr-solver", {"I": Is, "R": Rs}, {"V": Vs, "P": Ps})
    add("vipr-solver", {"I": Is, "P": Ps}, {"V": Vs, "R": Rs})
    add("vipr-solver", {"R": Rs, "P": Ps}, {"V": Vs, "I": Is})
    Pk, Vl, pfx, phx = pick(1, 900), random.choice([230, 400, 415, 690]), pick(0.5, 1), random.choice([1, 3])
    kx = S3 if phx == 3 else 1
    Ix2 = Pk * 1000 / (kx * Vl * pfx)
    add("power-vi-solver", {"P": Pk, "V": Vl, "pf": pfx, "phase": phx}, {"I": Ix2})
    add("power-vi-solver", {"P": Pk, "I": Ix2, "pf": pfx, "phase": phx}, {"V": Vl})
    add("power-vi-solver", {"V": Vl, "I": Ix2, "pf": pfx, "phase": phx}, {"P": Pk})
    Ek, th = pick(0.5, 500), pick(0.25, 48)
    add("kwh-to-kw", {"E": Ek, "t": th}, {"P": Ek / th})
    add("kwh-to-kw", {"E": Ek * 1000, "EUnit": "Wh", "t": th * 60, "tUnit": "min"}, {"P": Ek / th})

# --- v1.5.2: energy and charge conversions (appended last so earlier seeded vectors do not move) ---
QE = 1.602176634e-19  # elementary charge in coulombs, exact SI value
for _ in range(8):
    Pw, tw = pick(1, 5000), pick(0.5, 7200)
    Ej = Pw * tw  # joules
    add("power-energy-time", {"P": Pw, "t": tw}, {"E": Ej})
    add("power-energy-time", {"E": Ej, "t": tw}, {"P": Pw})
    add("power-energy-time", {"P": Pw, "E": Ej}, {"t": tw})
    add("power-energy-time", {"P": Pw / 1000, "PUnit": "kW", "t": tw / 3600, "tUnit": "h"}, {"E": Ej})
    Qc, Vq = pick(0.01, 50), pick(1, 600)
    Eq = Qc * Vq
    add("energy-voltage-charge", {"Q": Qc, "V": Vq}, {"E": Eq})
    add("energy-voltage-charge", {"E": Eq, "Q": Qc}, {"V": Vq})
    add("energy-voltage-charge", {"E": Eq, "V": Vq}, {"Q": Qc})
    ne, Vp = random.randint(1, 20), pick(0.5, 5000)
    add("energy-voltage-charge", {"Q": ne, "QUnit": "e", "V": Vp}, {"Eev": ne * Vp}, 1e-9)
    add("energy-voltage-charge", {"E": ne * Vp, "EUnit": "eV", "Q": ne, "QUnit": "e"}, {"V": Vp}, 1e-9)
    mAh, Vb = pick(500, 20000), pick(1.2, 48)
    Wh = mAh * Vb / 1000
    add("battery-mah-wh", {"Q": mAh, "V": Vb}, {"E": Wh})
    add("battery-mah-wh", {"E": Wh, "V": Vb}, {"Q": mAh})
    add("battery-mah-wh", {"E": Wh, "Q": mAh}, {"V": Vb})
    add("battery-mah-wh", {"Q": mAh / 1000, "QUnit": "Ah", "V": Vb}, {"E": Wh})

# --- v1.5.3: DC and line-to-neutral modes (appended last so earlier seeded vectors do not move) ---
for _ in range(8):
    Ix, Vx, pfx2 = pick(0.5, 400), random.choice([12, 24, 48, 120, 230, 400, 415]), pick(0.5, 1)
    Pw3 = Vx * Ix
    # DC: P = V I, power factor ignored
    add("amps-to-kw", {"I": Ix, "V": Vx, "pf": pfx2, "phase": 0}, {"P": Pw3 / 1000})
    add("amps-to-watts", {"I": Ix, "V": Vx, "pf": pfx2, "phase": 0}, {"P": Pw3})
    add("amps-to-kva", {"I": Ix, "V": Vx, "phase": 0}, {"S": Pw3 / 1000})
    add("watts-to-amps", {"P": Pw3, "V": Vx, "pf": pfx2, "phase": 0}, {"I": Ix})
    add("kva-to-amps", {"S": Pw3 / 1000, "V": Vx, "phase": 0}, {"I": Ix})
    add("three-phase-current", {"P": Pw3 / 1000, "V": Vx, "pf": pfx2, "phase": 0, "eff": 1}, {"I": Ix})
    add("power-vi-solver", {"V": Vx, "I": Ix, "pf": pfx2, "phase": 0}, {"P": Pw3 / 1000})
    # three-phase line-to-neutral: P = 3 V_LN I pf, S = 3 V_LN I
    add("amps-to-kw", {"I": Ix, "V": Vx, "pf": pfx2, "phase": 3, "vt": 1}, {"P": 3 * Vx * Ix * pfx2 / 1000})
    add("amps-to-watts", {"I": Ix, "V": Vx, "pf": pfx2, "phase": 3, "vt": 1}, {"P": 3 * Vx * Ix * pfx2})
    add("amps-to-kva", {"I": Ix, "V": Vx, "phase": 3, "vt": 1}, {"S": 3 * Vx * Ix / 1000})
    add("watts-to-amps", {"P": 3 * Vx * Ix * pfx2, "V": Vx, "pf": pfx2, "phase": 3, "vt": 1}, {"I": Ix})
    add("kva-to-amps", {"S": 3 * Vx * Ix / 1000, "V": Vx, "phase": 3, "vt": 1}, {"I": Ix})
    add("three-phase-current", {"P": 3 * Vx * Ix * pfx2 / 1000, "V": Vx, "pf": pfx2, "phase": 3, "vt": 1, "eff": 1}, {"I": Ix})
    add("power-vi-solver", {"V": Vx, "I": Ix, "pf": pfx2, "phase": 3, "vt": 1}, {"P": 3 * Vx * Ix * pfx2 / 1000})
    add("power-vi-solver", {"P": 3 * Vx * Ix * pfx2 / 1000, "I": Ix, "pf": pfx2, "phase": 3, "vt": 1}, {"V": Vx})
    # three-phase line-to-line stays sqrt(3) V I pf
    add("amps-to-watts", {"I": Ix, "V": Vx, "pf": pfx2, "phase": 3}, {"P": math.sqrt(3) * Vx * Ix * pfx2})

# ---- v1.5.5: voltage drop from material and size (F5). Written from R = rho L / A and the published AWG chart
# (rapidtables.org wire gauge chart, 4-decimal mm2 values); engine.js not consulted. ----
CHART = {-3: 107.2193, -2: 85.0288, -1: 67.4309, 0: 53.4751, 1: 42.4077, 2: 33.6308, 4: 21.1506, 6: 13.3018, 8: 8.3656, 10: 5.2612, 12: 3.3088, 14: 2.0809, 16: 1.3087, 18: 0.8230, 20: 0.5176, 24: 0.2047, 30: 0.0509}
MATS = {1: (1.7241e-8, 0.00393), 2: (2.8264e-8, 0.00403), 3: (1.59e-8, 0.0038), 4: (2.44e-8, 0.0034), 5: (6.99e-8, 0.006), 6: (1.10e-6, 0.0004)}
for n, area in CHART.items():
    mat = random.choice(list(MATS)); rho, al = MATS[mat]
    Iw, Lw, Tw, Vw, ph = pick(1, 40), pick(2, 80), random.choice([20, 40, 70, 90]), random.choice([12, 24, 48, 230]), random.choice([1, 3])
    kf = S3 if ph == 3 else 2
    rt = rho * (1 + al * (Tw - 20)); Rw = rt * Lw / (area * 1e-6); Vdw = kf * Iw * Rw
    add("dc-voltage-drop", {"I": Iw, "L": Lw, "mat": mat, "sz": 1, "awg": n, "T": Tw, "V": Vw, "phase": ph}, {"Vd": Vdw, "R": Rw, "pct": Vdw / Vw * 100}, max(3e-4, 0.6e-4 / area))
for _ in range(10):
    # diameter route, metres: A = pi d^2 / 4
    dmm = pick(0.3, 14); mat = random.choice(list(MATS)); rho, al = MATS[mat]
    Iw, Lw, Tw, Vw = pick(1, 60), pick(2, 150), random.choice([20, 55, 75]), random.choice([24, 120, 400])
    Aw = math.pi * (dmm * 1e-3) ** 2 / 4; rt = rho * (1 + al * (Tw - 20)); Vdw = 2 * Iw * rt * Lw / Aw
    add("dc-voltage-drop", {"I": Iw, "L": Lw, "mat": mat, "sz": 2, "D": dmm, "T": Tw, "V": Vw, "phase": 1}, {"Vd": Vdw, "Au": Aw * 1e6}, 1e-9)
    # diameter given in inches converts to the same wire
    din = dmm / 25.4
    add("dc-voltage-drop", {"I": Iw, "L": Lw, "mat": mat, "sz": 2, "D": din, "DUnit": "in", "T": Tw, "V": Vw, "phase": 1}, {"Vd": Vdw}, 1e-9)
for _ in range(8):
    # custom resistivity with and without a temperature coefficient; length in feet
    rc, ac = random.choice([1.43e-7, 4.6e-7, 9.71e-8, 5.6e-8]), random.choice([0, 0.0016, 0.005])
    Iw, Lft, Aw, Tw = pick(1, 30), pick(10, 400), pick(0.5, 70), random.choice([20, 60, 100])
    Lm = Lft * 0.3048; Vdw = 2 * Iw * rc * (1 + ac * (Tw - 20)) * Lm / (Aw * 1e-6)
    add("dc-voltage-drop", {"I": Iw, "L": Lft, "LUnit": "ft", "A": Aw, "mat": 7, "rhoC": rc, "aC": ac, "T": Tw, "V": 48, "phase": 1}, {"Vd": Vdw}, 1e-9)

for _ in range(10):
    # slab bill written from the tariff definition: telescopic slabs, then fixed charge, then tax on the sum
    Eb, s1, s2 = pick(1, 900, 2), pick(0, 200, 1), pick(0, 300, 1)
    r1, r2, r3, fc, tx = pick(1, 6, 3), pick(2, 9, 3), pick(3, 14, 3), pick(0, 300, 2), random.choice([0, 5, 12.5, 18])
    en = 0.0; left = Eb
    for size, rate in ((s1, r1), (s2, r2), (None, r3)):
        use = left if size is None else min(left, size)
        en += use * rate; left -= use
    tot = (en + fc) * (1 + tx / 100)
    add("electricity-bill-slabs", {"E": Eb, "s1": s1, "r1": r1, "s2": s2, "r2": r2, "r3": r3, "fc": fc, "tax": tx}, {"energy": en, "total": tot, "taxAmt": (en + fc) * tx / 100, "avg": tot / Eb}, 1e-9)

for _ in range(12):
    # AC voltage drop written from the standard relation Vd = k I (R cos phi + X sin phi), R = rho(T) L / A
    Iw, Lw, Aw, Tw = pick(1, 400), pick(5, 500), random.choice([1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120]), random.choice([20, 50, 70, 90])
    mat, rho0, al = random.choice([(1, 1.7241e-8, 0.00393), (2, 2.8264e-8, 0.00403)])
    pfw, Xw, ph = pick(0.6, 1), random.choice([0, 0.07, 0.08, 0.09]), random.choice([1, 3])
    Vw = random.choice([230, 400, 415]) if ph == 3 else 230
    Rw = rho0 * (1 + al * (Tw - 20)) * Lw / (Aw * 1e-6)
    lead = random.choice([0, 1])  # 0 lagging (+X sin phi), 1 leading (-X sin phi)
    Vdw = (S3 if ph == 3 else 2) * Iw * (Rw * pfw + (-1 if lead else 1) * Xw * 1e-3 * Lw * math.sqrt(1 - pfw * pfw))
    add("ac-voltage-drop", {"I": Iw, "L": Lw, "A": Aw, "mat": mat, "T": Tw, "X": Xw, "pf": pfw, "V": Vw, "phase": ph, "lead": lead}, {"Vd": Vdw, "pct": Vdw / Vw * 100, "R": Rw}, 1e-9)

# SWG: legal table in thousandths of an inch, transcribed separately from engine.js (7/0 first, 50 last)
SWG = {-6: 500, -5: 464, -4: 432, -3: 400, -2: 372, -1: 348, 0: 324, 1: 300, 2: 276, 3: 252, 4: 232, 5: 212, 6: 192, 7: 176, 8: 160, 9: 144, 10: 128, 11: 116, 12: 104, 13: 92, 14: 80, 15: 72, 16: 64, 17: 56, 18: 48, 19: 40, 20: 36, 21: 32, 22: 28, 23: 24, 24: 22, 25: 20, 26: 18, 27: 16.4, 28: 14.8, 29: 13.6, 30: 12.4, 31: 11.6, 32: 10.8, 33: 10, 34: 9.2, 35: 8.4, 36: 7.6, 37: 6.8, 38: 6, 39: 5.2, 40: 4.8, 41: 4.4, 42: 4, 43: 3.6, 44: 3.2, 45: 2.8, 46: 2.4, 47: 2, 48: 1.6, 49: 1.2, 50: 1}
for n in sorted(SWG):
    dmm = SWG[n] * 0.0254
    add("swg-wire", {"n": n}, {"d": dmm, "din": SWG[n] / 1000, "A": math.pi * dmm * dmm / 4}, 1e-9)


# AC Ohm's law (phasors): complex arithmetic from Python's cmath, no engine formulas. Angles in degrees, wrapped to (-180, 180].
import cmath
def ph(m, a): return cmath.rect(m, math.radians(a))
def ang(z): return math.degrees(cmath.phase(z))
for _ in range(12):
    Vm_, Va_ = pick(10, 700), pick(-120, 120, 1)
    Im_, Ia_ = pick(0.1, 400), pick(-120, 120, 1)
    Zm_, Za_ = pick(0.5, 900), pick(-85, 85, 1)
    for k in ("V", "I", "Z"):
        pass
    Vp, Ip, Zp = ph(Vm_, Va_), ph(Im_, Ia_), ph(Zm_, Za_)
    # V and I given -> Z
    Zr = Vp / Ip; Sr = Vp * Ip.conjugate()
    add("ac-ohms-law", {"V": Vm_, "Vang": Va_, "I": Im_, "Iang": Ia_}, {"Z": abs(Zr), "Zang": ang(Zr), "S": abs(Sr), "P": Sr.real, "Q": Sr.imag, "pf": Sr.real / abs(Sr)}, 1e-9)
    # V and Z given -> I
    Ir = Vp / Zp; Sr = Vp * Ir.conjugate()
    add("ac-ohms-law", {"V": Vm_, "Vang": Va_, "Z": Zm_, "Zang": Za_}, {"I": abs(Ir), "Iang": ang(Ir), "S": abs(Sr), "P": Sr.real, "Q": Sr.imag, "pf": Sr.real / abs(Sr)}, 1e-9)
    # I and Z given -> V
    Vr = Ip * Zp; Sr = Vr * Ip.conjugate()
    add("ac-ohms-law", {"I": Im_, "Iang": Ia_, "Z": Zm_, "Zang": Za_}, {"V": abs(Vr), "Vang": ang(Vr), "S": abs(Sr), "P": Sr.real, "Q": Sr.imag, "pf": Sr.real / abs(Sr)}, 1e-9)
for v in V:
    if v["id"] == "ac-ohms-law":
        for k in ("Zang", "Iang", "Vang"):
            if k in v["out"]: assert abs(abs(v["out"][k]) - 180) > 1e-6 and abs(v["out"][k]) > 1e-6, v

# F5: plain power converter (input in kW, the calculator's default unit)
for kw in [0.001, 0.75, 1, 2.5, 18.4, 250, 3200.5, 12000]:
    add("power-converter", {"P": kw}, {"w": kw * 1000, "kw": kw, "mw": kw / 1000, "hp": kw * 1000 / HPW})
    add("power-converter", {"P": kw * 1000, "PUnit": "W"}, {"w": kw * 1000, "kw": kw, "mw": kw / 1000, "hp": kw * 1000 / HPW})
# F6: unit prefixes on voltage, current and power inputs (value typed in the prefixed unit; SI result written from the definition of the prefix)
PFX = {"µ": 1e-6, "m": 1e-3, "k": 1e3, "M": 1e6}
for sym, f in PFX.items():
    for x, Rr in [(2.5, 10), (47, 330), (0.8, 1.5)]:
        Vv = x * f
        add("ohms-law", {"V": x, "VUnit": sym + "V", "R": Rr}, {"I": Vv / Rr, "P": Vv * Vv / Rr}, 1e-9)
        add("power-converter", {"P": x, "PUnit": sym + "W"}, {"w": Vv, "kw": Vv / 1000, "mw": Vv / 1e6}, 1e-9)
for sym in ("µ", "m", "k", "M"):
    x, Vv = 3.3, 12.0
    add("vipr-solver", {"V": Vv, "I": x, "IUnit": sym + "A"}, {"R": Vv / (x * PFX[sym]), "P": Vv * x * PFX[sym]}, 1e-9)
# F3: appliance running cost. Run-at %, hours per day/week/month, per-day/month/year results, BTU/h and TR inputs.
# Written from the definitions (1 BTU/h = 1055.05585262 J per 3600 s, 1 TR = 12000 BTU/h, month = 365/12 days). Own generator so earlier vectors keep their values.
rng = random.Random(20261113)
BTUH_W = 1055.05585262 / 3600
TR_W = 12000 * BTUH_W
PER_DAYS = {0: 1.0, 1: 7.0, 2: 365 / 12}
for _ in range(12):
    kw, cap = round(rng.uniform(0.05, 8), 3), rng.choice([100, 100, 80, 60, 35.5])
    per = rng.choice([0, 1, 2])
    hmax = {0: 24, 1: 168, 2: 744}[per]
    hrs, d, tar = round(rng.uniform(0.5, hmax), 2), rng.choice([7, 30, 90, 365]), round(rng.uniform(1, 15), 2)
    eday = kw * cap / 100 * hrs / PER_DAYS[per]
    add("energy-cost", {"P": kw, "cap": cap, "h": hrs, "per": per, "d": d, "t": tar},
        {"Eday": eday, "Emonth": eday * 365 / 12, "Eyear": eday * 365, "E": eday * d, "cost": eday * d * tar,
         "costDay": eday * tar, "costMonth": eday * 365 / 12 * tar, "costYear": eday * 365 * tar})
for x, unit, w in [(12000, "BTU/h", 12000 * BTUH_W), (18000, "BTU/h", 18000 * BTUH_W), (1.5, "TR", 1.5 * TR_W), (2, "TR", 2 * TR_W)]:
    add("energy-cost", {"P": x, "PUnit": unit, "cap": 100, "h": 10, "per": 0, "d": 30, "t": 8},
        {"Eday": w * 10 / 1000, "E": w * 10 * 30 / 1000, "costYear": w * 10 / 1000 * 365 * 8})

# ---- Issue 6: the ten calculators that had no independent vectors. Written from textbook relations and from the
# conventions each calculator publishes (engine.js not consulted). Own generator so earlier vectors keep their values.
rg = random.Random(20261115)
def ru(lo, hi, nd=3): return round(rg.uniform(lo, hi), nd)
def smallest_at_least(table, x):
    for t in table:
        if t >= x: return t
    raise ValueError("beyond table")
BREAKER = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000]
IEC60228 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630]
XFMR = [25, 50, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150]
CCR = [1, 2, 4, 7.5, 10, 15, 20, 25, 30]

# 1. breaker-size: smallest standard rating >= I x margin, with every rating tested exactly on and just over its boundary
for r in BREAKER[:-1]:
    add("breaker-size", {"I": r, "m": 1}, {"In": r}, 0)
    add("breaker-size", {"I": round(r + 0.01, 2), "m": 1}, {"In": BREAKER[BREAKER.index(r) + 1]}, 0)
for r in (80, 160, 200, 320, 400, 800, 1600, 3200):          # exact fits at margin 1.25 (r x 1.25 is exact in binary)
    add("breaker-size", {"I": r, "m": 1.25}, {"In": smallest_at_least(BREAKER, r * 1.25)}, 0)
for _ in range(25):
    I, m = ru(0.5, 2400, 2), ru(1, 1.6, 2)
    add("breaker-size", {"I": I, "m": m}, {"In": smallest_at_least(BREAKER, I * m)}, 0)

# 2. cable-size-vd: A = k I L rho_theta cos / (Vmax - k I L X sin), then the next IEC 60228 size; drop at that size
RHO20 = {1: 0.017241, 2: 0.02826}; ALPHA = {1: 0.00393, 2: 0.00403}; THETA = {1: 70, 2: 90}
n = 0
while n < 30:
    I, L, Vv, lim, pf = ru(10, 700, 1), ru(5, 400, 1), rg.choice([230, 400, 415, 690]), rg.choice([2, 3, 4, 5]), ru(0.6, 1)
    mat, ins, X, ph = rg.choice([1, 2]), rg.choice([1, 2]), ru(0.06, 0.1), rg.choice([3, 1])
    k = S3 if ph == 3 else 2
    rho = RHO20[mat] * (1 + ALPHA[mat] * (THETA[ins] - 20)); sn = math.sqrt(1 - pf * pf)
    den = lim / 100 * Vv - k * I * L / 1000 * X * sn
    if den <= 0: continue
    Amin = k * I * L * rho * pf / den
    if Amin > 630: continue
    As = smallest_at_least(IEC60228, Amin)
    Vd = k * I * L * (rho / As * pf + X / 1000 * sn)
    add("cable-size-vd", {"I": I, "L": L, "V": Vv, "lim": lim, "pf": pf, "mat": mat, "ins": ins, "X": X, "phase": ph},
        {"Amin": Amin, "Astd": As, "Vd": Vd, "pct": Vd / Vv * 100}, 1e-6)
    n += 1

# 3. cable-sc-withstand: S = I sqrt(t) / k, then the next IEC 60228 size. k is IEC 60364-4-43 Table 43A / IEC 60364-5-54 Table A.54.4 / BS 7671 Table 43.1:
#    PVC 115 Cu / 76 Al for conductors up to 300 mm2, and 103 Cu / 68 Al above 300 mm2 (final temperature 140 C instead of 160 C); XLPE 143 Cu / 94 Al at every size.
#    The sample is drawn and kept exactly as before (the up-to-300 mm2 value decides which cases are drawn, so every later random stream is unchanged); only the expected
#    values changed from v1.67.1. A conductor whose required area is above 300 mm2 uses the lower k, and above 630 mm2 no standard size exists, so only Amin and k are compared.
KSC = {1: 115, 2: 143, 3: 76, 4: 94}
KSC_BIG = {1: 103, 2: 143, 3: 68, 4: 94}
n = 0
while n < 30:
    Isc, t, mat = ru(1, 60, 2), ru(0.05, 5, 2), rg.choice([1, 2, 3, 4])
    Amin0 = Isc * 1000 * math.sqrt(t) / KSC[mat]
    if Amin0 > 630: continue
    k = KSC_BIG[mat] if Amin0 > 300 else KSC[mat]
    Amin = Isc * 1000 * math.sqrt(t) / k
    out = {"Amin": Amin, "k": k}
    if Amin <= 630: out["Astd"] = smallest_at_least(IEC60228, Amin)
    add("cable-sc-withstand", {"Isc": Isc, "t": t, "mat": mat}, out, 1e-9)
    n += 1

# 4. motor-starting: DOL k In; star-delta one third of current and torque; auto-transformer tap squared on both
for _ in range(10):
    In, k, tap = ru(2, 900, 1), ru(4, 9, 2), ru(0.4, 0.85, 2)
    add("motor-starting", {"In": In, "k": k, "meth": 1, "tap": tap}, {"Ist": k * In, "Tq": 100}, 1e-9)
    add("motor-starting", {"In": In, "k": k, "meth": 2, "tap": tap}, {"Ist": k * In / 3, "Tq": 100 / 3}, 1e-9)
    add("motor-starting", {"In": In, "k": k, "meth": 3, "tap": tap}, {"Ist": k * In * tap ** 2, "Tq": 100 * tap ** 2}, 1e-9)

# 5. pv-string-size: Voc_cold = Voc (1 + tc/100 (Tmin - 25)), N = floor(Vmax / Voc_cold)
for _ in range(20):
    Voc, tc, Tmin, Vmax = ru(20, 70, 2), -ru(0.15, 0.4, 3), ru(-30, 20, 1), rg.choice([600, 1000, 1500])
    Vc = Voc * (1 + tc / 100 * (Tmin - 25))
    add("pv-string-size", {"Voc": Voc, "tc": tc, "Tmin": Tmin, "Vmax": Vmax}, {"Vc": Vc, "N": math.floor(Vmax / Vc)}, 1e-9)
add("pv-string-size", {"Voc": 50, "tc": 0, "Tmin": 25, "Vmax": 1000}, {"Vc": 50, "N": 20}, 1e-9)      # exact fit does not lose a module
add("pv-string-size", {"Voc": 40, "tc": -0.5, "Tmin": -15, "Vmax": 1200}, {"Vc": 48, "N": 25}, 1e-9)  # 40 x (1 + 0.005 x 40) = 48, 1200 / 48 = 25 exactly

# 6. copper-vs-aluminium: R = rho L / A at 20 C, equal-resistance aluminium area, mass ratio at equal resistance
RCU, RAL, DCU, DAL = 1.7241e-8, 2.8264e-8, 8960, 2700
for _ in range(15):
    A, L = rg.choice([1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630]), ru(1, 2000, 1)
    Aeq = A * RAL / RCU
    add("copper-vs-aluminium", {"A": A, "L": L}, {"Rcu": RCU * L / (A * 1e-6), "Ral": RAL * L / (A * 1e-6), "Aeq": Aeq, "wr": Aeq * DAL / (A * DCU)}, 1e-9)

# 7. transformer-sizing: S = P / pf (1 + g/100) / loading, next standard kVA, full-load current of the selected rating
n = 0
while n < 25:
    P, pf, g, ld, Vv = ru(5, 2200, 1), ru(0.6, 1), rg.choice([0, 5, 10, 20, 25, 50]), ru(0.5, 1), rg.choice([230, 400, 415, 690, 11000])
    Sr = P / pf * (1 + g / 100) / ld
    if Sr > 3150: continue
    Ss = smallest_at_least(XFMR, Sr)
    add("transformer-sizing", {"P": P, "pf": pf, "g": g, "ld": ld, "V": Vv}, {"Sr": Sr, "Ss": Ss, "I": Ss * 1000 / (S3 * Vv)}, 1e-9)
    n += 1
for sz in XFMR:                                              # a load that fills a standard size exactly stays in that size
    add("transformer-sizing", {"P": sz, "pf": 1, "g": 0, "ld": 1, "V": 400}, {"Sr": sz, "Ss": sz}, 1e-9)

# 8. maximum-demand: MD = connected x demand factor / diversity factor, S = MD / pf
for _ in range(15):
    Pc, df, dv, pf = ru(1, 5000, 1), ru(0.1, 1), ru(1, 3), ru(0.6, 1)
    md = Pc * df / dv
    add("maximum-demand", {"Pc": Pc, "df": df, "dv": dv, "pf": pf}, {"md": md, "S": md / pf}, 1e-9)

# 9. parallel-cable-sets: n = ceil(Ib / (Iz kg)), derated current of one cable Iz kg
for _ in range(20):
    Ib, Iz, kg = ru(10, 5000, 1), ru(50, 800, 1), ru(0.4, 1, 2)
    add("parallel-cable-sets", {"Ib": Ib, "Iz": Iz, "kg": kg}, {"n": math.ceil(Ib / (Iz * kg)), "Iu": Iz * kg}, 1e-9)
for Iz, kg in [(400, 1), (400, 0.5), (250, 0.75), (320, 0.25)]:      # factors exact in binary: Ib on the boundary and just over it
    for cnt in (1, 2, 3, 5):
        add("parallel-cable-sets", {"Ib": Iz * kg * cnt, "Iz": Iz, "kg": kg}, {"n": cnt, "Iu": Iz * kg}, 1e-9)
        add("parallel-cable-sets", {"Ib": Iz * kg * cnt + 0.5, "Iz": Iz, "kg": kg}, {"n": cnt + 1, "Iu": Iz * kg}, 1e-9)

# 10. agl-ccr-loading: Pt = n Plamp / eta + I^2 R L, Vout = Pt / I, CCR >= Pt / max loading, from the sizes the calculator lists
n = 0
while n < 25:
    nf, Pl, et, I, L, R, ld = rg.randint(5, 300), ru(20, 200, 1), ru(0.7, 0.97), rg.choice([2.8, 4.0, 5.5, 6.6]), ru(500, 12000, 0), ru(0.5, 5, 2), ru(0.5, 1)
    Pc = I * I * R * L / 1000
    Pt = (nf * Pl / et + Pc) / 1000
    if Pt / ld > 30: continue
    ccr = smallest_at_least(CCR, Pt / ld)
    add("agl-ccr-loading", {"n": nf, "Pl": Pl, "et": et, "I": I, "L": L, "R": R, "ld": ld}, {"Pt": Pt, "Vo": Pt * 1000 / I, "Pc": Pc, "ccr": ccr, "pct": Pt / ccr * 100}, 1e-9)
    n += 1

# 11. agl-max-fittings: how many fittings fit on a CCR. Usable power = loading x rating; each fitting draws lamp W / transformer efficiency;
#     the loop loses I^2 R L. Count the whole fittings that fit (draws that land within 1e-6 of a whole number are skipped, so rounding cannot flip them).
n = 0
while n < 25:
    kw, Pl, et, I, L, R, ld = rg.choice([4, 7.5, 10, 15, 20, 25, 30]), ru(20, 200, 1), ru(0.7, 0.97), rg.choice([2.8, 4.1, 5.2, 6.6]), ru(500, 12000, 0), ru(0.5, 5, 2), ru(0.5, 1)
    loss_w = I * I * (R / 1000) * L
    room_w = ld * kw * 1000 - loss_w
    if room_w <= 0: continue
    each_w = Pl / et
    fits = room_w / each_w
    if abs(fits - round(fits)) < 1e-6: continue
    k = math.floor(fits)
    total_w = k * each_w + loss_w
    add("agl-max-fittings", {"Pr": kw, "Pl": Pl, "et": et, "I": I, "L": L, "R": R, "ld": ld}, {"nmax": k, "Pt": total_w / 1000, "Pc": loss_w, "pct": total_w / (kw * 1000) * 100, "Vo": total_w / I}, 1e-9)
    n += 1

# 12. agl-isolating-transformer: ideal current ratio Is = Ip x Isr / Ipr; lamp volts = lamp W / Is; input W = lamp W / eta; primary volts = input W / Ip; loading = lamp W / rating
for _ in range(25):
    Ipr, Isr = rg.choice([6.6, 6.6, 20.0]), rg.choice([6.6, 20.0, 10.0])
    Ip = rg.choice([2.8, 3.4, 4.1, 5.2, 6.6, 4.8, 5.5])
    Pl, Pt, et = ru(10, 200, 1), rg.choice([30, 45, 65, 100, 200, 300, 500]), ru(0.7, 0.97)
    Is = Ip * Isr / Ipr
    Win = Pl / et
    add("agl-isolating-transformer", {"Ip": Ip, "Ipr": Ipr, "Isr": Isr, "Pl": Pl, "Pt": Pt, "et": et}, {"Is": Is, "Vs": Pl / Is, "Pin": Win, "Vp": Win / Ip, "pct": Pl / Pt * 100}, 1e-9)

# 13. agl-ccr-input-energy: input kW = output kW / eta; kVA = kW / pf; kvar = kW tan(acos pf); kWh = kW x hours; cost = kWh x tariff
for _ in range(25):
    Po, ec, pf, h, tar = ru(0.5, 30, 3), ru(0.75, 0.98), ru(0.6, 0.99), rg.choice([1000, 2190, 3000, 4380, 6570, 8760]), ru(2, 20, 2)
    kw_in = Po / ec
    kwh = kw_in * h
    add("agl-ccr-input-energy", {"Po": Po, "ec": ec, "pf": pf, "h": h, "tar": tar}, {"Pin": kw_in, "S": kw_in / pf, "Q": kw_in * math.tan(math.acos(pf)), "E": kwh, "cost": kwh * tar}, 1e-9)

# 14. generator-kva boundaries (v1.8.5): a required rating that lands exactly on each listed size keeps that size, 10 W above it moves to the next
#     size, below the smallest gives 10 kVA, and above the largest gives no size (only Sr is returned). Written from the printed size list.
GEN_LIST = [10, 15, 20, 30, 40, 50, 62.5, 75, 100, 125, 150, 200, 250, 320, 400, 500, 625, 750, 1000, 1250, 1500, 2000, 2500]
def gen_case(P, pf, m):
    Sr = P / pf * (1 + m / 100)
    Ss = next((x for x in GEN_LIST if x >= Sr - 1e-9), None)
    out = {"Sr": Sr}
    if Ss is not None: out.update({"Ss": Ss, "I": Ss * 1000 / (S3 * 415)})
    add("generator-kva", {"P": P, "pf": pf, "m": m, "V": 415}, out, 1e-9)
for size in GEN_LIST:
    gen_case(size, 1.0, 0)                      # exactly on the size (pf 1, no margin)
    gen_case(round(size + 0.01, 3), 1.0, 0)     # 10 W over: next size up, or none above 2500
for size in [62.5, 75, 100, 125, 250, 400, 500, 625, 1000, 1250, 2500]:
    gen_case(size / 1.5625, 0.8, 25)            # pf 0.8 and 25 % margin: P x 1.5625 lands exactly on the size
gen_case(0.5, 1.0, 0)                           # far below the smallest size
gen_case(3000, 0.8, 25)                         # well above the largest size

# 15. transformer-sizing boundaries (v1.8.6): 10 W over each listed size moves to the next size; above 3150 kVA only the required rating is returned;
#     four exact hits through pf 0.8, 25 % growth and 80 % loading (P x 1.953125 lands exactly on the size).
def xf_case(P, pf, g, ld):
    Sr = P / pf * (1 + g / 100) / ld
    Ss = next((x for x in XFMR if x >= Sr - 1e-9), None)
    out = {"Sr": Sr}
    if Ss is not None: out.update({"Ss": Ss, "I": Ss * 1000 / (S3 * 400)})
    add("transformer-sizing", {"P": P, "pf": pf, "g": g, "ld": ld, "V": 400}, out, 1e-9)
for sz in XFMR: xf_case(round(sz + 0.01, 3), 1, 0, 1)
for sz in [250, 500, 1000, 2000]: xf_case(sz / 1.953125, 0.8, 25, 0.8)
xf_case(3150, 1, 0, 1)                                       # the largest size, exactly
xf_case(4000, 0.9, 10, 0.8)                                  # well above the list

# 16. agl-ccr-loading boundaries: one fitting of (size - 1) W with transformer efficiency 1 plus 1 W of loop loss (1 A, 1 ohm/km, 1000 m) loads the
#     circuit to exactly the CCR size at 100 % loading; 10 W more moves to the next size, and above 30 kW only the load figures are returned.
CCR_LIST = [1, 2, 4, 7.5, 10, 15, 20, 25, 30]
def ccr_case(Pl_w):
    Pt = (Pl_w + 1) / 1000
    k = next((x for x in CCR_LIST if x >= Pt - 1e-9), None)
    out = {"Pt": Pt, "Vo": Pt * 1000, "Pc": 1.0}
    if k is not None: out.update({"ccr": k, "pct": Pt / k * 100})
    add("agl-ccr-loading", {"n": 1, "Pl": Pl_w, "et": 1, "I": 1, "L": 1000, "R": 1, "ld": 1}, out, 1e-9)
for k in CCR_LIST[2:]:
    ccr_case(k * 1000 - 1)                                   # exactly on the size
    ccr_case(k * 1000 - 1 + 10)                              # 10 W over: next size, or none above 30 kW

# 17. amps-to-kw efficiency (v1.8.7): Pout = eff * P, fixed inputs so the earlier random vectors are unchanged
for (I_, V_, pf_, ph_, vt_, ef_) in [(100, 400, 0.9, 3, 0, 0.9), (63, 415, 0.85, 3, 0, 0.92), (25, 230, 0.8, 1, 0, 0.75), (40, 400, 0.88, 3, 1, 0.95), (10, 24, 0.5, 0, 0, 0.6)]:
    kk = {0: 1, 1: 1, 3: S3}[ph_] if ph_ != 3 else (3 if vt_ == 1 else S3)
    pw = kk * V_ * I_ * (1 if ph_ == 0 else pf_)
    inp = {"I": I_, "V": V_, "pf": pf_, "phase": ph_, "eff": ef_}
    if vt_: inp["vt"] = vt_
    add("amps-to-kw", inp, {"P": pw / 1000, "Pout": pw * ef_ / 1000})

# 18. agl-brightness-steps (v1.9.0), written from the relations on the page, not from engine.js: I from the step table, Plamp = n P (I/6.6)^k / eta,
#     Pcable = I^2 R L, Vout = Ptotal / I, and the load relative to the same circuit at 6.6 A. 3-step circuits only take steps 1 to 3.
STEP_TAB = {1: [2.8, 3.4, 4.1, 5.2, 6.6], 2: [4.8, 5.5, 6.6]}
for _ in range(30):
    ct = rg.choice([1, 2]); b = rg.randint(1, len(STEP_TAB[ct]))
    n_, Pl_, et_, L_, R_, k_ = rg.randint(1, 300), ru(10, 200, 1), ru(0.6, 0.98), ru(100, 12000, 0), ru(0.5, 8, 3), ru(1, 4, 2)
    Is = STEP_TAB[ct][b - 1]
    cab_ = Is * Is * (R_ / 1000) * L_
    Pt_ = n_ * Pl_ * (Is / 6.6) ** k_ / et_ + cab_
    Pfull = n_ * Pl_ / et_ + 6.6 * 6.6 * (R_ / 1000) * L_
    add("agl-brightness-steps", {"ct": ct, "b": b, "n": n_, "Pl": Pl_, "et": et_, "L": L_, "R": R_, "k": k_},
        {"I": Is, "pI": Is / 6.6 * 100, "Pt": Pt_ / 1000, "Vo": Pt_ / Is, "Pc": cab_, "pL": Pt_ / Pfull * 100}, 1e-9)

# 19. agl-lamp-life-curve (v1.9.0): power law through two points, life = T1 (I/I1)^(-m), m = ln(T2/T1) / ln(I1/I2), replacements = n H / life
for _ in range(25):
    I1_, I2_ = ru(3, 6.6, 2), ru(3, 6.6, 2)
    if abs(I1_ - I2_) < 0.05: I2_ = I1_ + 0.5
    T1_, T2_, I3_ = ru(200, 4000, 0), ru(200, 8000, 0), ru(2.5, 7, 2)
    n_, H_ = rg.randint(1, 400), rg.choice([500, 1000, 2190, 4380, 8760])
    m_ = math.log(T2_ / T1_) / math.log(I1_ / I2_)
    T3_ = T1_ * (I3_ / I1_) ** (-m_)
    add("agl-lamp-life-curve", {"I1": I1_, "T1": T1_, "I2": I2_, "T2": T2_, "I3": I3_, "n": n_, "H": H_},
        {"m": m_, "T3": T3_, "rt": T3_ / T1_, "rep": n_ * H_ / T3_}, 1e-9)

# 20-25. v1.10.0 lighting calculators. Written from the textbook relations only (not from engine.js). Appended last with the shared rg stream,
#     so every earlier vector is unchanged. Omitted keys are blank fields, so each solver case enters exactly the stated variables.
FC_LUX_ = 0.3048 ** -2   # 1 lm/ft^2 in lux, from the exact foot
for _ in range(10):   # lumens-lux-area: E = phi u / A, solved all three ways
    ph_, A_, u_ = ru(100, 20000, 1), ru(2, 400, 2), ru(0.2, 1, 2)
    E_ = ph_ * u_ / A_
    add("lumens-lux-area", {"phi": ph_, "A": A_, "u": u_}, {"E": E_, "fc": E_ / FC_LUX_}, 1e-9)
    add("lumens-lux-area", {"E": E_, "A": A_, "u": u_}, {"phi": ph_}, 1e-9)
    add("lumens-lux-area", {"phi": ph_, "E": E_, "u": u_}, {"A": A_}, 1e-9)

for _ in range(10):   # candela-lux-distance: E = I cos(th) / d^2, solved all three ways
    I_, d_, th_ = ru(10, 50000, 1), ru(0.5, 60, 2), rg.choice([0, 15, 30, 45, 60, 75, 85])
    c_ = math.cos(math.radians(th_)); E_ = I_ * c_ / d_ ** 2
    add("candela-lux-distance", {"I": I_, "d": d_, "th": th_}, {"E": E_, "fc": E_ / FC_LUX_}, 1e-9)
    add("candela-lux-distance", {"E": E_, "d": d_, "th": th_}, {"I": I_}, 1e-9)
    add("candela-lux-distance", {"I": I_, "E": E_, "th": th_}, {"d": d_}, 1e-9)

for _ in range(10):   # candela-lumens-beam: solid angle of a cone, 2 pi (1 - cos(half angle)); flux = I x omega
    I_, b_ = ru(10, 100000, 1), ru(2, 360, 1)
    om_ = 2 * math.pi * (1 - math.cos(math.radians(b_ / 2)))
    add("candela-lumens-beam", {"I": I_, "th": b_}, {"phi": I_ * om_, "om": om_}, 1e-9)
    add("candela-lumens-beam", {"phi": I_ * om_, "th": b_}, {"I": I_, "om": om_}, 1e-9)

for _ in range(10):   # lumens-watts: flux = power x efficacy, solved all three ways
    P_, e_ = ru(0.5, 2000, 2), ru(5, 220, 1)
    add("lumens-watts", {"P": P_, "eta": e_}, {"phi": P_ * e_}, 1e-9)
    add("lumens-watts", {"phi": P_ * e_, "eta": e_}, {"P": P_}, 1e-9)
    add("lumens-watts", {"phi": P_ * e_, "P": P_}, {"eta": e_}, 1e-9)

for _ in range(15):   # lux-to-watts: flux = E A / (UF MF), P = flux / efficacy, power density = P / A
    E_, A_, e_, uf_, mf_ = ru(20, 1000, 0), ru(5, 2000, 1), ru(30, 200, 1), ru(0.2, 1, 2), ru(0.4, 1, 2)
    ph_ = E_ * A_ / (uf_ * mf_)
    add("lux-to-watts", {"E": E_, "A": A_, "eta": e_, "uf": uf_, "mf": mf_}, {"phi": ph_, "P": ph_ / e_, "pd": ph_ / e_ / A_}, 1e-9)

for _ in range(20):   # agl-light-intensity-distance: Allard's law E = I T / d^2, T = exp(-sigma d), sigma = ln(1/0.05) / MOR
    I_, d_, mor_ = ru(100, 300000, 0), ru(30, 3000, 1), ru(50, 5000, 0)
    sg_ = math.log(1 / 0.05) / mor_; T_ = math.exp(-sg_ * d_)
    add("agl-light-intensity-distance", {"I": I_, "d": d_, "mor": mor_}, {"E": I_ * T_ / d_ ** 2, "Ec": I_ / d_ ** 2, "T": T_ * 100, "sig": sg_ * 1000}, 1e-9)

for _ in range(10):   # millicandela-lumens-beam: I in mcd (cd x 1000); solid angle of a cone 2 pi (1 - cos(half angle)); flux = (mcd / 1000) x omega
    m_, b_ = ru(100, 200000, 0), ru(2, 360, 1)
    om_ = 2 * math.pi * (1 - math.cos(math.radians(b_ / 2)))
    add("millicandela-lumens-beam", {"I": m_, "th": b_}, {"phi": m_ / 1000 * om_, "om": om_}, 1e-9)
    add("millicandela-lumens-beam", {"phi": m_ / 1000 * om_, "th": b_}, {"I": m_, "om": om_}, 1e-9)

for _ in range(10):   # watts-to-lux: flux = P x efficacy; E = flux x UF x MF / A; power density = P / A
    P_, e_, A_, uf_, mf_ = ru(5, 5000, 1), ru(30, 200, 1), ru(5, 2000, 1), ru(0.2, 1, 2), ru(0.4, 1, 2)
    add("watts-to-lux", {"P": P_, "eta": e_, "A": A_, "uf": uf_, "mf": mf_}, {"E": P_ * e_ * uf_ * mf_ / A_, "phi": P_ * e_, "pd": P_ / A_}, 1e-9)

for _ in range(12):   # complex-number: Python cmath written from the textbook definitions; op 0 convert, 1 add, 2 subtract, 3 multiply, 4 divide
    a_, b_, c_, d_ = ru(-500, 500, 3), ru(-500, 500, 3), ru(-500, 500, 3), ru(-500, 500, 3)
    z1_, z2_ = complex(a_, b_), complex(c_, d_)
    for op_, r_ in ((0, z1_), (1, z1_ + z2_), (2, z1_ - z2_), (3, z1_ * z2_), (4, z1_ / z2_)):
        add("complex-number", {"a": a_, "b": b_, "op": op_, "c": c_, "d": d_}, {"re": r_.real, "im": r_.imag, "mag": abs(r_), "ang": math.degrees(cmath.phase(r_)), "angr": cmath.phase(r_), "m1": abs(z1_), "a1": math.degrees(cmath.phase(z1_))}, 1e-9)
for a_, b_ in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (-1, -1), (1, -1), (100, 0.001), (-100, -0.001)):   # axes and quadrant edges (angle +180 on the negative real axis)
    z_ = complex(a_, b_)
    add("complex-number", {"a": a_, "b": b_, "op": 0, "c": 1, "d": 1}, {"re": a_, "im": b_, "mag": abs(z_), "ang": math.degrees(cmath.phase(z_)), "a1": math.degrees(cmath.phase(z_))}, 1e-9)

for s2_, s3_ in ((1, 1), (1, -1), (-1, 1), (-1, -1)):   # phasor-sum: Python cmath.rect (magnitude, angle in radians) summed with the signs; arith is the sum of the magnitudes used
    for _ in range(5):
        m1_, m2_, m3_ = ru(0.5, 500, 3), ru(0.5, 500, 3), ru(0.5, 500, 3)
        t1_, t2_, t3_ = ru(-360, 360, 2), ru(-360, 360, 2), ru(-360, 360, 2)
        r_ = cmath.rect(m1_, math.radians(t1_)) + s2_ * cmath.rect(m2_, math.radians(t2_)) + s3_ * cmath.rect(m3_, math.radians(t3_))
        add("phasor-sum", {"m1": m1_, "t1": t1_, "s2": s2_, "m2": m2_, "t2": t2_, "s3": s3_, "m3": m3_, "t3": t3_}, {"re": r_.real, "im": r_.imag, "mag": abs(r_), "ang": math.degrees(cmath.phase(r_)), "angr": cmath.phase(r_), "arith": m1_ + m2_ + m3_}, 1e-9)
for _ in range(8):   # two phasors only (phasor 3 magnitude 0 is left out)
    m1_, m2_, t1_, t2_ = ru(0.5, 500, 3), ru(0.5, 500, 3), ru(-360, 360, 2), ru(-360, 360, 2)
    r_ = cmath.rect(m1_, math.radians(t1_)) + cmath.rect(m2_, math.radians(t2_))
    add("phasor-sum", {"m1": m1_, "t1": t1_, "s2": 1, "m2": m2_, "t2": t2_, "s3": 1, "m3": 0, "t3": 0}, {"re": r_.real, "im": r_.imag, "mag": abs(r_), "ang": math.degrees(cmath.phase(r_)), "arith": m1_ + m2_}, 1e-9)
for m_, t_ in ((230, 0), (11000, 30), (5, -179), (5, 179), (1, 90)):   # one phasor on its own: the angle is wrapped to (-180, 180]
    r_ = cmath.rect(m_, math.radians(t_))
    add("phasor-sum", {"m1": m_, "t1": t_, "s2": 1, "m2": 0, "t2": 0, "s3": 1, "m3": 0, "t3": 0}, {"mag": m_, "ang": math.degrees(cmath.phase(r_)), "arith": m_}, 1e-9)
for v_ in (230, 400, 11000):   # line voltage from two phase voltages: V1 - V2 with the phases 120 degrees apart has magnitude sqrt(3) V at +30 degrees
    add("phasor-sum", {"m1": v_, "t1": 0, "s2": -1, "m2": v_, "t2": -120, "s3": 1, "m3": 0, "t3": 0}, {"mag": 3 ** 0.5 * v_, "ang": 30, "re": 1.5 * v_, "im": 3 ** 0.5 / 2 * v_}, 1e-9)

for _ in range(24):   # percentage-error: (measured - true) / |true| x 100, written from the definition
    t_ = ru(0.5, 1000, 3) * random.choice((1, -1)); m_ = ru(-1000, 1000, 3); e_ = m_ - t_
    add("percentage-error", {"m": m_, "t": t_}, {"err": e_, "aerr": abs(e_), "rel": e_ / abs(t_), "pe": e_ / abs(t_) * 100, "ape": abs(e_) / abs(t_) * 100}, 1e-9)
for m_, t_ in ((98.5, 100), (105, 100), (229.2, 230), (9.81, 9.80665), (0.001, 0.0011), (1e6, 1.02e6), (5, 5), (-9, -10)):
    e_ = m_ - t_
    add("percentage-error", {"m": m_, "t": t_}, {"err": e_, "aerr": abs(e_), "rel": e_ / abs(t_), "pe": e_ / abs(t_) * 100, "ape": abs(e_) / abs(t_) * 100}, 1e-9)

for _ in range(20):   # trig-functions: Python math.sin / cos / tan on the angle in radians, written from the textbook definitions (angles kept off the multiples of 90 degrees so tan and sec stay finite)
    d_ = ru(-3600, 3600, 3)
    if abs(d_ / 90 - round(d_ / 90)) < 1e-3: continue
    r_ = math.radians(d_); s_, c_ = math.sin(r_), math.cos(r_)
    add("trig-functions", {"x": d_, "u": 1}, {"sin": s_, "cos": c_, "tan": s_ / c_, "csc": 1 / s_, "sec": 1 / c_, "cot": c_ / s_, "deg": d_, "rad": r_, "red": d_ % 360}, 1e-8)
for _ in range(10):   # radians input
    r_ = ru(-60, 60, 4)
    if abs(r_ / (math.pi / 2) - round(r_ / (math.pi / 2))) < 1e-3: continue
    s_, c_ = math.sin(r_), math.cos(r_)
    add("trig-functions", {"x": r_, "u": 2}, {"sin": s_, "cos": c_, "tan": s_ / c_, "deg": math.degrees(r_), "rad": r_}, 1e-8)
for d_ in (0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360, -90, -180, 720):   # standard angles, with exact values on the axes
    r_ = math.radians(d_)
    o_ = {"sin": round(math.sin(r_), 12), "cos": round(math.cos(r_), 12), "red": d_ % 360, "deg": d_}
    add("trig-functions", {"x": d_, "u": 1}, o_, 1e-9)

# v1.51.0: n identical conductors per phase in parallel share the current, so R and X per phase are divided by n (n = 1 leaves every earlier vector unchanged)
for _ in range(10):   # voltage-drop with n parallel conductors
    I_, L_, R_, X_, V_, pf_, ph_, n_ = pick(20, 900), pick(10, 800), pick(0.03, 1.5), pick(0.05, 0.12), random.choice([230, 400, 415]), pick(0.7, 1), random.choice([1, 3]), random.randint(2, 9)
    Vd_ = (S3 if ph_ == 3 else 2) * I_ * (L_ / 1000) * (R_ * pf_ + X_ * math.sqrt(1 - pf_ * pf_)) / n_
    add("voltage-drop", {"I": I_, "L": L_, "R": R_, "X": X_, "V": V_, "pf": pf_, "phase": ph_, "n": n_}, {"Vd": Vd_, "pct": Vd_ / V_ * 100})
for _ in range(10):   # ac-voltage-drop with n parallel conductors: R = rho(T) L / (A n), X = x L / n
    I_, L_, A_, T_ = pick(20, 900), pick(10, 500), random.choice([50, 70, 95, 120, 150, 185, 240, 300]), random.choice([20, 70, 90])
    rho0_, al_ = random.choice([(1.7241e-8, 0.00393), (2.8264e-8, 0.00403)])
    mat_ = 1 if rho0_ < 2e-8 else 2
    pf_, X_, ph_, n_ = pick(0.6, 1), random.choice([0.07, 0.08, 0.09]), random.choice([1, 3]), random.randint(2, 9)
    V_ = random.choice([230, 400, 415]) if ph_ == 3 else 230
    R_ = rho0_ * (1 + al_ * (T_ - 20)) * L_ / (A_ * 1e-6) / n_
    Vd_ = (S3 if ph_ == 3 else 2) * I_ * (R_ * pf_ + X_ * 1e-3 * L_ / n_ * math.sqrt(1 - pf_ * pf_))
    add("ac-voltage-drop", {"I": I_, "L": L_, "A": A_, "mat": mat_, "T": T_, "X": X_, "pf": pf_, "V": V_, "phase": ph_, "lead": 0, "n": n_}, {"Vd": Vd_, "pct": Vd_ / V_ * 100, "R": R_}, 1e-9)
for _ in range(8):   # max-cable-length with n parallel conductors: L = n x (limit% V) / (k I (R cos + X sin))
    I_, V_, lim_, R_, X_, pf_, ph_, n_ = pick(20, 900), random.choice([230, 400, 415]), random.choice([2, 3, 5]), pick(0.03, 1.5), pick(0.05, 0.12), pick(0.7, 1), random.choice([1, 3]), random.randint(2, 9)
    add("max-cable-length", {"I": I_, "V": V_, "lim": lim_, "R": R_, "X": X_, "pf": pf_, "phase": ph_, "n": n_}, {"L": n_ * V_ * lim_ / 100 / ((S3 if ph_ == 3 else 2) * I_ * (R_ * pf_ + X_ * math.sqrt(1 - pf_ * pf_))) * 1000}, 1e-6)

import statistics as st
KEYS12 = ["x%d" % k for k in range(1, 13)]
def rd(xs): return {k: (xs[j] if j < len(xs) else "") for j, k in enumerate(KEYS12)}
rs = random.Random(20261110)   # own stream, so the vectors above are unchanged
def stat_sets():
    for n_ in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 8, 6, 5):
        yield [round(rs.uniform(-500, 500), 3) for _ in range(n_)]
    for n_ in (5, 6, 8, 10, 12, 12):   # readings drawn from a small set of values so that ties and repeated values occur
        yield [rs.choice([1.5, 2, 3.25, 4, 5, 230, 230.5]) for _ in range(n_)]
    yield [2, 4, 4, 4, 5, 5, 7, 9]; yield [230.1, 229.8, 230.4, 229.8, 231, 230.2]; yield [0.001, 0.002, 0.0015]; yield [1e6, 1.02e6, 0.98e6, 1.01e6]
for xs_ in stat_sets():   # mean-median-mode: Python statistics module (mean, median, multimode)
    n_ = len(xs_); mm_ = st.multimode(xs_); top_ = xs_.count(mm_[0])
    o_ = {"mean": st.fmean(xs_), "median": st.median(xs_), "n": n_, "sum": math.fsum(xs_), "min": min(xs_), "max": max(xs_), "range": max(xs_) - min(xs_)}
    if top_ > 1: o_["mode"] = min(mm_)
    add("mean-median-mode", rd(xs_), o_, 1e-9)
for xs_ in stat_sets():   # standard-deviation: statistics.pstdev / pvariance (population) and stdev / variance (sample, n >= 2)
    n_ = len(xs_); m_ = st.fmean(xs_)
    o_ = {"mean": m_, "n": n_, "psd": st.pstdev(xs_), "pvar": st.pvariance(xs_)}
    if n_ > 1:
        o_.update({"ssd": st.stdev(xs_), "svar": st.variance(xs_), "sem": st.stdev(xs_) / math.sqrt(n_)})
        if m_ != 0: o_["cv"] = st.stdev(xs_) / abs(m_) * 100
    add("standard-deviation", rd(xs_), o_, 1e-8)

rq = random.Random(20261111)   # own stream for the algebra vectors, so earlier vectors are unchanged
def nz(d): return {k: v for k, v in d.items() if v != 0}
for _ in range(10):   # quadratic-solver: textbook formula x = (-b +/- sqrt(D)) / 2a, roots built from chosen values so the answer is known
    a_ = rq.choice((1, -1, 2, 0.5, 3.5, -4)); r1_, r2_ = round(rq.uniform(-20, 20), 2), round(rq.uniform(-20, 20), 2)
    b_ = round(-a_ * (r1_ + r2_), 6); c_ = round(a_ * r1_ * r2_, 6); D_ = b_ * b_ - 4 * a_ * c_
    if D_ <= 1e-6: continue
    q1_ = (-b_ + math.sqrt(D_)) / (2 * a_); q2_ = (-b_ - math.sqrt(D_)) / (2 * a_)
    add("quadratic-solver", {"a": a_, "b": b_, "c": c_}, nz({"x1": q1_, "x2": q2_, "disc": D_, "xv": -b_ / (2 * a_), "yv": c_ - b_ * b_ / (4 * a_)}), 1e-7)
for _ in range(8):   # complex roots: x = -b/2a +/- j sqrt(-D)/2|a|, through cmath
    a_ = rq.choice((1, 2, -1, 0.5)); b_ = round(rq.uniform(-10, 10), 3); c_ = round(rq.uniform(5, 40) * (1 if a_ > 0 else -1) + b_ * b_ / (4 * a_), 3); D_ = b_ * b_ - 4 * a_ * c_
    if D_ >= -1e-6: continue
    z1_ = (-b_ + cmath.sqrt(D_)) / (2 * a_); z2_ = (-b_ - cmath.sqrt(D_)) / (2 * a_)
    add("quadratic-solver", {"a": a_, "b": b_, "c": c_}, nz({"x1": z1_.real, "x1i": z1_.imag, "x2": z2_.real, "x2i": z2_.imag, "disc": D_}), 1e-7)
for a_, b_, c_ in ((1, -2, 1), (1, 2, 5), (2, -4, -6), (1, 3, 0), (-1, 0, 4), (4, -12, 9), (1, 0, 1)):
    D_ = b_ * b_ - 4 * a_ * c_; z1_ = (-b_ + cmath.sqrt(D_)) / (2 * a_); z2_ = (-b_ - cmath.sqrt(D_)) / (2 * a_)
    add("quadratic-solver", {"a": a_, "b": b_, "c": c_}, nz({"x1": z1_.real, "x1i": z1_.imag, "x2": z2_.real, "x2i": z2_.imag, "disc": D_, "xv": -b_ / (2 * a_), "yv": c_ - b_ * b_ / (4 * a_)}), 1e-9)
for _ in range(16):   # logarithm: Python math.log10, math.log, math.log2 and math.log(x, b)
    x_ = round(rq.uniform(0.001, 5000), 4); b_ = rq.choice((10, 2, 3, 5, 7, 16, 0.5, 2.718281828459045, 1.5))
    add("logarithm", {"x": x_, "b": b_}, nz({"lb": math.log(x_, b_), "l10": math.log10(x_), "ln": math.log(x_), "l2": math.log2(x_)}), 1e-9)
for x_, b_ in ((1000, 10), (8, 2), (0.001, 10), (1, 10), (1e9, 10), (1e-9, 10), (125, 5), (100, 10)):
    add("logarithm", {"x": x_, "b": b_}, nz({"lb": math.log(x_, b_), "l10": math.log10(x_), "ln": math.log(x_), "l2": math.log2(x_)}), 1e-9)
def realroot(x_, k_): return -((-x_) ** (1 / k_)) if x_ < 0 else x_ ** (1 / k_)
for _ in range(16):   # powers-roots: Python ** (positive bases, real exponents) and the real k-th root
    x_ = round(rq.uniform(0.1, 500), 3); n_ = round(rq.uniform(-4, 4), 3); k_ = rq.randint(1, 9)
    add("powers-roots", {"x": x_, "n": n_, "k": k_}, {"pow": x_ ** n_, "root": x_ ** (1 / k_), "sq": x_ ** 2, "cube": x_ ** 3, "rec": 1 / x_}, 1e-9)
for _ in range(8):   # negative bases: whole-number exponents, odd roots only
    x_ = -round(rq.uniform(0.1, 50), 3); n_ = rq.randint(-4, 6); k_ = rq.choice((1, 3, 5, 7))
    add("powers-roots", {"x": x_, "n": n_, "k": k_}, nz({"pow": x_ ** n_, "root": realroot(x_, k_), "sq": x_ ** 2, "cube": x_ ** 3, "rec": 1 / x_}), 1e-9)
for x_, n_, k_ in ((8, 2, 3), (2, 10, 2), (10, -3, 2), (16, 0.25, 4), (27, 1, 3), (144, 0.5, 2), (1, 5, 6)):
    add("powers-roots", {"x": x_, "n": n_, "k": k_}, {"pow": x_ ** n_, "root": realroot(x_, k_), "sq": x_ ** 2, "cube": x_ ** 3, "rec": 1 / x_}, 1e-9)

import decimal
from decimal import Decimal, ROUND_HALF_UP, ROUND_CEILING, ROUND_FLOOR, ROUND_DOWN
rp = random.Random(20261112)   # own stream for the percentage, ratio and rounding vectors
for _ in range(16):   # percentage-calculator: the five textbook definitions
    A_ = round(rp.uniform(-500, 500), 3) or 1; B_ = round(rp.uniform(-2000, 2000), 3) or 1
    add("percentage-calculator", {"A": A_, "B": B_}, nz({"pof": A_ * B_ / 100, "whatpct": A_ / B_ * 100, "chg": (B_ - A_) / abs(A_) * 100, "inc": B_ * (1 + A_ / 100), "dec": B_ * (1 - A_ / 100)}), 1e-9)
for A_, B_ in ((15, 200), (80, 100), (100, 80), (12.5, 8), (50, 50), (7, 0.5), (0.1, 1e6)):
    add("percentage-calculator", {"A": A_, "B": B_}, nz({"pof": A_ * B_ / 100, "whatpct": A_ / B_ * 100, "chg": (B_ - A_) / abs(A_) * 100, "inc": B_ * (1 + A_ / 100), "dec": B_ * (1 - A_ / 100)}), 1e-9)
for _ in range(14):   # ratio-calculator: whole numbers simplified with math.gcd, shares and the proportion X = B C / A
    a_, b_ = rp.randint(1, 5000), rp.randint(1, 5000); c_ = round(rp.uniform(0.1, 900), 3); g_ = math.gcd(a_, b_)
    add("ratio-calculator", {"a": a_, "b": b_, "c": c_}, {"sa": a_ // g_, "sb": b_ // g_, "rab": a_ / b_, "pa": a_ / (a_ + b_) * 100, "pb": b_ / (a_ + b_) * 100, "x": b_ * c_ / a_}, 1e-9)
for _ in range(5):   # decimal parts: no simplified ratio, the rest still checked
    a_, b_ = round(rp.uniform(0.1, 50), 3), round(rp.uniform(0.1, 50), 3); c_ = round(rp.uniform(0.1, 90), 3)
    add("ratio-calculator", {"a": a_, "b": b_, "c": c_}, {"rab": a_ / b_, "pa": a_ / (a_ + b_) * 100, "pb": b_ / (a_ + b_) * 100, "x": b_ * c_ / a_}, 1e-9)
for a_, b_ in ((12, 18), (7, 9), (5, 5), (11000, 415), (1000, 250)):
    g_ = math.gcd(a_, b_); add("ratio-calculator", {"a": a_, "b": b_, "c": ""}, {"sa": a_ // g_, "sb": b_ // g_, "rab": a_ / b_}, 1e-9)
def rnd(x_, mode, d_): return Decimal(repr(x_)).quantize(Decimal(1).scaleb(-d_), rounding=mode)
def sig(x_, s_):
    D_ = Decimal(repr(x_)); return D_.quantize(Decimal(1).scaleb(D_.adjusted() - (s_ - 1)), rounding=ROUND_HALF_UP)
def rvec(x_, d_, s_): return nz({"rd": float(rnd(x_, ROUND_HALF_UP, d_)), "up": float(rnd(x_, ROUND_CEILING, d_)), "dn": float(rnd(x_, ROUND_FLOOR, d_)), "tr": float(rnd(x_, ROUND_DOWN, d_)), "rs": float(sig(x_, s_))})
for _ in range(26):   # rounding-sig-figs: Python decimal module on the number as written (repr), ROUND_HALF_UP = away from zero on halves
    x_ = round(rp.uniform(-20000, 20000), rp.randint(0, 6)) or 1.5; d_ = rp.randint(-2, 7); s_ = rp.randint(1, 9)
    add("rounding-sig-figs", {"x": x_, "d": d_, "s": s_}, rvec(x_, d_, s_), 1e-12)
for x_, d_, s_ in ((1234.5678, 2, 3), (1.005, 2, 3), (2.5, 0, 1), (-2.5, 0, 1), (-2.3, 0, 2), (1234, -1, 4), (0.00456789, 4, 3), (999.95, 1, 3), (0.5, 0, 1), (1.45, 1, 2), (123456789, -3, 5)):
    add("rounding-sig-figs", {"x": x_, "d": d_, "s": s_}, rvec(x_, d_, s_), 1e-12)

from fractions import Fraction
rf = random.Random(20261113)   # own stream for the fraction vectors
for _ in range(30):   # fraction-calculator: exact arithmetic with fractions.Fraction (auto-reduced, sign on the numerator)
    n1_, n2_ = rf.randint(-60, 60), rf.randint(-60, 60); d1_, d2_ = rf.choice([k for k in range(-40, 41) if k]), rf.choice([k for k in range(-40, 41) if k]); op_ = rf.randint(1, 4)
    if op_ == 4 and n2_ == 0: n2_ = 7
    a_, b_ = Fraction(n1_, d1_), Fraction(n2_, d2_)
    f_ = [a_ + b_, a_ - b_, a_ * b_, a_ / b_ if b_ else None][op_ - 1]
    mw_ = int(f_); mn_ = abs(f_.numerator) - abs(mw_) * f_.denominator
    add("fraction-calculator", {"n1": n1_, "d1": d1_, "op": op_, "n2": n2_, "d2": d2_}, nz({"rn": f_.numerator, "rd": f_.denominator, "mw": mw_, "mn": mn_, "dec": float(f_), "pct": float(f_) * 100}), 1e-9)
for n1_, d1_, op_, n2_, d2_ in ((1, 2, 1, 1, 3), (3, 4, 2, 5, 4), (2, 3, 3, 3, 4), (1, 2, 4, 1, 4), (7, 2, 1, 0, 1), (-17, 5, 3, 1, 1), (999999, 1000000, 1, 1, 1000000), (1, 3, 1, 1, 6), (5, 6, 2, 1, 6)):
    a_, b_ = Fraction(n1_, d1_), Fraction(n2_, d2_); f_ = [a_ + b_, a_ - b_, a_ * b_, a_ / b_ if b_ else None][op_ - 1]; mw_ = int(f_); mn_ = abs(f_.numerator) - abs(mw_) * f_.denominator
    add("fraction-calculator", {"n1": n1_, "d1": d1_, "op": op_, "n2": n2_, "d2": d2_}, nz({"rn": f_.numerator, "rd": f_.denominator, "mw": mw_, "mn": mn_, "dec": float(f_), "pct": float(f_) * 100}), 1e-9)

rs = random.Random(20261120)   # own stream for the simultaneous-equations and linear-interpolation vectors
def solve_exact(M_, k_):
    """Gauss-Jordan elimination in exact Fraction arithmetic (a different method from the engine's pivoted floating-point elimination); also returns the determinant."""
    n_ = len(M_); A_ = [[Fraction(v_) for v_ in row_] + [Fraction(kk_)] for row_, kk_ in zip(M_, k_)]; det_ = Fraction(1)
    for c_ in range(n_):
        p_ = next(r_ for r_ in range(c_, n_) if A_[r_][c_] != 0)
        if p_ != c_: A_[c_], A_[p_] = A_[p_], A_[c_]; det_ = -det_
        det_ *= A_[c_][c_]; piv_ = A_[c_][c_]; A_[c_] = [v_ / piv_ for v_ in A_[c_]]
        for r_ in range(n_):
            if r_ != c_ and A_[r_][c_] != 0:
                f_ = A_[r_][c_]; A_[r_] = [a_ - f_ * b_ for a_, b_ in zip(A_[r_], A_[c_])]
    return [A_[r_][n_] for r_ in range(n_)], det_
def simvec(M_, k_):
    n_ = len(M_); sol_, det_ = solve_exact(M_, k_)
    g_ = lambda r_, c_: (M_[r_][c_] if c_ < n_ else "") if r_ < n_ else ""
    inp_ = {"n": n_}
    for r_ in range(3):
        for c_, nm_ in enumerate("abc"):
            inp_[nm_ + str(r_ + 1)] = M_[r_][c_] if (r_ < n_ and c_ < n_) else ""
        inp_["k" + str(r_ + 1)] = k_[r_] if r_ < n_ else ""
    out_ = {"x": float(sol_[0]), "y": float(sol_[1]), "det": float(det_)}
    if n_ == 3: out_["z"] = float(sol_[2])
    add("simultaneous-equations", inp_, nz(out_), 1e-8)
def nonsingular(n_):
    while True:
        M_ = [[rs.randint(-9, 9) for _ in range(n_)] for _ in range(n_)]
        if solve_exact_det(M_) != 0 and abs(solve_exact_det(M_)) >= 3: return M_
def solve_exact_det(M_):
    try: return solve_exact(M_, [0] * len(M_))[1]
    except StopIteration: return Fraction(0)
for n_ in [2] * 20 + [3] * 16:   # simultaneous-equations: right-hand sides built from chosen whole-number solutions, answers by exact fractions
    M_ = nonsingular(n_); s_ = [rs.randint(-12, 12) for _ in range(n_)]
    simvec(M_, [sum(a_ * b_ for a_, b_ in zip(row_, s_)) for row_ in M_])
for M_, k_ in (([[2, 3], [1, -1]], [13, -1]), ([[1, 1, 1], [0, 2, 5], [2, 5, -1]], [6, -4, 27]), ([[0, 1], [1, 1]], [4, 5]), ([[10, -4], [-4, 9]], [12, 0]), ([[0.5, 2.5], [4, -1.5]], [3.5, 5]), ([[0, 0, 2], [0, 3, 1], [4, 1, 1]], [10, 9, 12]), ([[230, 0.5], [0.4, 11000]], [229, 10.5])):
    simvec(M_, k_)
def intvec(x1_, y1_, x2_, y2_, x_, yt_=None):
    F_ = Fraction; x1f, y1f, x2f, y2f, xf = F_(str(x1_)), F_(str(y1_)), F_(str(x2_)), F_(str(y2_)), F_(str(x_))
    m_ = (y2f - y1f) / (x2f - x1f); y_ = y1f + (xf - x1f) * m_
    out_ = {"y": float(y_), "m": float(m_), "t": float((xf - x1f) / (x2f - x1f)), "b": float(y1f - x1f * m_)}
    if yt_ is not None: out_["xt"] = float(x1f + (F_(str(yt_)) - y1f) / m_)
    add("linear-interpolation", {"x1": x1_, "y1": y1_, "x2": x2_, "y2": y2_, "x": x_, "yt": "" if yt_ is None else yt_}, nz(out_), 1e-9)
for _ in range(22):   # linear-interpolation: two-point line in exact fractions, inside and outside the points, with and without a y to look up
    x1_ = round(rs.uniform(-50, 50), 2); x2_ = round(x1_ + rs.choice([-1, 1]) * rs.uniform(1, 200), 2)
    y1_ = round(rs.uniform(-100, 100), 3); y2_ = round(rs.uniform(-100, 100), 3)
    if y1_ == y2_: y2_ += 1.5
    x_ = round(rs.uniform(min(x1_, x2_) - 30, max(x1_, x2_) + 30), 3)
    intvec(x1_, y1_, x2_, y2_, x_, round(rs.uniform(-150, 150), 3) if rs.random() < 0.5 else None)
for a_ in ((0, 4, 100, 20, 25, None), (0, 4, 100, 20, 25, 12), (10, 50, 30, 10, 20, None), (100, 20, 0, 4, 25, None), (0, 4, 100, 20, 150, None), (20, 107.79, 30, 111.67, 25, None), (0, 0, 1, 1, 0.5, 0.25)):
    intvec(*a_)

rm = random.Random(20261121)   # own stream for the matrix and vector vectors, so earlier vectors are unchanged
def cof_det(M_):
    """Determinant by cofactor expansion in exact Fractions (the engine uses elimination)."""
    if len(M_) == 2: return M_[0][0] * M_[1][1] - M_[0][1] * M_[1][0]
    return sum(((-1) ** j_) * M_[0][j_] * cof_det([[M_[r_][c_] for c_ in range(3) if c_ != j_] for r_ in (1, 2)]) for j_ in range(3))
def adj_inverse(M_):
    """Inverse as the adjugate over the determinant, exact (the engine uses Gauss-Jordan with row swaps)."""
    n_ = len(M_); d_ = cof_det(M_)
    if n_ == 2: return [[M_[1][1] / d_, -M_[0][1] / d_], [-M_[1][0] / d_, M_[0][0] / d_]]
    minor = lambda r_, c_: cof_det([[M_[a_][b_] for b_ in range(3) if b_ != c_] for a_ in range(3) if a_ != r_])
    return [[((-1) ** (r_ + c_)) * minor(c_, r_) / d_ for c_ in range(3)] for r_ in range(3)]
def matvec(M_):
    n_ = len(M_); F_ = Fraction; Mf_ = [[F_(str(v_)) for v_ in row_] for row_ in M_]
    d_ = cof_det(Mf_); inv_ = adj_inverse(Mf_)
    inp_ = {"n": n_}
    for r_ in range(3):
        for c_ in range(3): inp_["m%d%d" % (r_ + 1, c_ + 1)] = M_[r_][c_] if (r_ < n_ and c_ < n_) else ""
    out_ = {"det": float(d_), "tr": float(sum(Mf_[k_][k_] for k_ in range(n_)))}
    for r_ in range(n_):
        for c_ in range(n_): out_["i%d%d" % (r_ + 1, c_ + 1)] = float(inv_[r_][c_])
    add("matrix-calculator", inp_, nz(out_), 1e-8)
for n_ in [2] * 14 + [3] * 14:   # matrix-calculator: random whole-number matrices with a non-zero determinant, decimals in a few
    while True:
        M_ = [[rm.randint(-9, 9) for _ in range(n_)] for _ in range(n_)]
        if abs(cof_det([[Fraction(v_) for v_ in r_] for r_ in M_])) >= 2: break
    matvec(M_)
for M_ in ([[4, 7], [2, 6]], [[2, 0, 1], [1, 3, 2], [1, 1, 2]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 1], [1, 0]], [[2.5, 1.5], [0.5, 4]], [[0, 0, 1], [0, 1, 0], [1, 0, 0]], [[10, -4, 0], [-4, 9, -3], [0, -3, 8]], [[0.001, 0], [0, 1000]]):
    matvec(M_)
def vecvec(a_, b_):
    F_ = Fraction; A_ = [F_(str(v_)) for v_ in a_]; B_ = [F_(str(v_)) for v_ in b_]
    dot_ = sum(x_ * y_ for x_, y_ in zip(A_, B_))
    c_ = [A_[1] * B_[2] - A_[2] * B_[1], A_[2] * B_[0] - A_[0] * B_[2], A_[0] * B_[1] - A_[1] * B_[0]]
    ma_ = math.sqrt(float(sum(x_ * x_ for x_ in A_))); mb_ = math.sqrt(float(sum(x_ * x_ for x_ in B_))); mc_ = math.sqrt(float(sum(x_ * x_ for x_ in c_)))
    out_ = {"ma": ma_, "mb": mb_, "dot": float(dot_), "cx": float(c_[0]), "cy": float(c_[1]), "cz": float(c_[2]), "mc": mc_}
    if ma_ and mb_:
        cs_ = max(-1.0, min(1.0, float(dot_) / (ma_ * mb_)))
        out_["ang"] = math.degrees(math.acos(cs_)); out_["proj"] = float(dot_) / mb_
    add("vector-calculator", {"ax": a_[0], "ay": a_[1], "az": a_[2], "bx": b_[0], "by": b_[1], "bz": b_[2]}, nz(out_), 1e-8)
for _ in range(24):   # vector-calculator: random vectors, exact dot and cross in fractions, angle by arccos (the engine uses atan2 of |A x B| and A . B)
    a_ = [round(rm.uniform(-20, 20), 2) for _ in range(3)]; b_ = [round(rm.uniform(-20, 20), 2) for _ in range(3)]
    if rm.random() < 0.25: a_[2] = 0; b_[2] = 0
    vecvec(a_, b_)
for a_, b_ in (([3, 4, 0], [1, 2, 2]), ([1, 0, 0], [0, 1, 0]), ([1, 2, 3], [2, 4, 6]), ([1, 0, 0], [-5, 0, 0]), ([0, 0, 0], [1, 2, 3]), ([230, 0, 0], [0, 0, 400]), ([1, 1, 0], [1, 0, 0]), ([2.5, -1.5, 4], [-3, 0.5, 2])):
    vecvec(a_, b_)

rl = random.Random(20261122)   # own stream for the linear-regression vectors, so earlier vectors are unchanged
def regvec(pts_, xp_=None):
    """Least squares by the normal equations in exact Fractions: m = (n.Sxy - Sx.Sy) / (n.Sxx - Sx^2). The engine uses sums about the means."""
    F_ = Fraction; P_ = [(F_(str(a_)), F_(str(b_))) for a_, b_ in pts_]; n_ = len(P_)
    sx_ = sum(a_ for a_, _ in P_); sy_ = sum(b_ for _, b_ in P_); sxy_ = sum(a_ * b_ for a_, b_ in P_); sxx_ = sum(a_ * a_ for a_, _ in P_); syy_ = sum(b_ * b_ for _, b_ in P_)
    m_ = (n_ * sxy_ - sx_ * sy_) / (n_ * sxx_ - sx_ * sx_); c_ = (sy_ - m_ * sx_) / n_
    out_ = {"m": float(m_), "c": float(c_), "n": n_, "xbar": float(sx_ / n_), "ybar": float(sy_ / n_)}
    vy_ = n_ * syy_ - sy_ * sy_
    if vy_ != 0:
        r2_ = (n_ * sxy_ - sx_ * sy_) ** 2 / ((n_ * sxx_ - sx_ * sx_) * vy_); out_["r2"] = float(r2_)
        out_["r"] = math.copysign(math.sqrt(float(r2_)), float(m_)) if m_ != 0 else 0.0
    if n_ > 2: out_["see"] = math.sqrt(float(sum((b_ - m_ * a_ - c_) ** 2 for a_, b_ in P_) / (n_ - 2)))
    if xp_ is not None: out_["yp"] = float(m_ * F_(str(xp_)) + c_)
    inp_ = {}
    for k_ in range(10):
        inp_["x%d" % (k_ + 1)] = pts_[k_][0] if k_ < n_ else ""; inp_["y%d" % (k_ + 1)] = pts_[k_][1] if k_ < n_ else ""
    inp_["xp"] = "" if xp_ is None else xp_
    add("linear-regression", inp_, nz(out_), 1e-8)
for _ in range(26):   # linear-regression: 3 to 10 noisy points on a random line, with and without a prediction
    n_ = rl.randint(3, 10); m0_ = round(rl.uniform(-8, 8), 2); c0_ = round(rl.uniform(-50, 50), 2)
    xs_ = rl.sample(range(-40, 120), n_); pts_ = [(x_, round(m0_ * x_ + c0_ + rl.uniform(-5, 5), 3)) for x_ in xs_]
    regvec(pts_, round(rl.uniform(-60, 140), 2) if rl.random() < 0.5 else None)
for pts_, xp_ in (([(1, 2), (2, 4), (3, 5), (4, 4), (5, 5)], 6), ([(1, 2), (2, 4), (3, 6)], None), ([(0, 10), (1, 8), (2, 6), (3, 4)], None), ([(0, 1), (10, 21)], 5), ([(1, 5), (2, 5), (3, 5)], None),
                  ([(0, 4), (25, 8.1), (50, 11.9), (75, 16.2), (100, 19.9)], 60), ([(0.5, 12.1), (1, 24.3), (1.5, 35.8), (2, 48.4)], 3), ([(1e6, 2e6), (2e6, 4.1e6), (3e6, 5.9e6)], None)):
    regvec(pts_, xp_)

rg = random.Random(20261123)   # own stream for the geometry vectors, so earlier vectors are unchanged
decimal.getcontext().prec = 60
PI_ = Decimal("3.14159265358979323846264338327950288419716939937510582097494")
def dsqrt(x_): return Decimal(x_).sqrt()
def pyvec(a_, b_, c_):
    """Right triangle in 60-digit Decimal; angles by arcsine and arccosine of the side ratios (the engine uses atan2)."""
    D_ = Decimal; ad_ = None if a_ is None else D_(str(a_)); bd_ = None if b_ is None else D_(str(b_)); cd_ = None if c_ is None else D_(str(c_))
    if cd_ is None: cd_ = dsqrt(ad_ * ad_ + bd_ * bd_)
    elif ad_ is None: ad_ = dsqrt(cd_ * cd_ - bd_ * bd_)
    else: bd_ = dsqrt(cd_ * cd_ - ad_ * ad_)
    out_ = {"a": float(ad_), "b": float(bd_), "c": float(cd_), "angA": math.degrees(math.asin(float(ad_ / cd_))), "angB": math.degrees(math.acos(float(ad_ / cd_))), "area": float(ad_ * bd_ / 2), "perim": float(ad_ + bd_ + cd_)}
    add("pythagorean-theorem", {"a": "" if a_ is None else a_, "b": "" if b_ is None else b_, "c": "" if c_ is None else c_}, nz(out_), 1e-8)
for _ in range(14): pyvec(round(rg.uniform(0.5, 200), 3), round(rg.uniform(0.5, 200), 3), None)
for _ in range(8):
    b_ = round(rg.uniform(1, 100), 2); pyvec(None, b_, round(b_ + rg.uniform(0.5, 150), 2))
for _ in range(8):
    a_ = round(rg.uniform(1, 100), 2); pyvec(a_, None, round(a_ + rg.uniform(0.5, 150), 2))
for a_, b_, c_ in ((3, 4, None), (None, 12, 13), (1, 1, None), (8, None, 17), (5, 12, None), (230, 400, None), (None, 1, 1.000001), (0.001, 1000, None)): pyvec(a_, b_, c_)
def trivec(a_, b_, c_):
    """Triangle from three sides in exact Fractions: 16 A^2 = (a+b+c)(-a+b+c)(a-b+c)(a+b-c); angles from the half-angle tangent tan(A/2) = sqrt((s-b)(s-c) / (s(s-a)))."""
    F_ = Fraction; A_, B_, C_ = F_(str(a_)), F_(str(b_)), F_(str(c_)); s_ = (A_ + B_ + C_) / 2
    a2_ = s_ * (s_ - A_) * (s_ - B_) * (s_ - C_); ar_ = math.sqrt(float(a2_))
    half = lambda x_, y_, z_: 2 * math.degrees(math.atan(math.sqrt(float((s_ - y_) * (s_ - z_) / (s_ * (s_ - x_))))))
    ga_, gb_ = half(A_, B_, C_), half(B_, A_, C_)
    out_ = {"angA": ga_, "angB": gb_, "angC": 180 - ga_ - gb_, "area": ar_, "perim": float(2 * s_), "inr": ar_ / float(s_), "cir": float(A_ * B_ * C_) / (4 * ar_)}
    add("triangle-calculator", {"a": a_, "b": b_, "c": c_}, nz(out_), 1e-8)
for _ in range(26):
    while True:
        t_ = sorted((round(rg.uniform(1, 100), 2) for _ in range(3)), reverse=True)
        if t_[0] < t_[1] + t_[2] - 1.0: break   # keep clear of a flat triangle, where any method loses digits
    rg.shuffle(t_); trivec(*t_)
for t_ in ((3, 4, 5), (2, 2, 2), (7, 8, 9), (9, 7, 8), (5, 5, 8), (1, 1, 1.5), (230, 230, 400), (0.5, 0.5, 0.5), (13, 14, 15)): trivec(*t_)
def circvec(k_, v_):
    D_ = Decimal; vd_ = D_(str(v_))
    r_ = vd_ if k_ == 1 else vd_ / 2 if k_ == 2 else vd_ / (2 * PI_) if k_ == 3 else dsqrt(vd_ / PI_)
    add("circle-calculator", {"k": k_, "v": v_}, nz({"r": float(r_), "d": float(2 * r_), "circ": float(2 * PI_ * r_), "area": float(PI_ * r_ * r_)}), 1e-9)
for k_ in (1, 2, 3, 4):
    for _ in range(6): circvec(k_, round(rg.uniform(0.01, 500), 3))
for k_, v_ in ((1, 5), (2, 10), (3, 6.283185307179586), (4, 100), (4, 2.5), (2, 1.784), (4, 1e-6), (1, 1e9)): circvec(k_, v_)

# --- v1.61.0: area-calculator and volume-surface-area (own stream, so earlier vectors are unchanged) ---
import mpmath as mpm
mpm.mp.dps = 50
rh = random.Random(20261124)
def mpf_(x_): return mpm.mpf(str(x_))
def areavec(s_, x_, y_=None, z_=None):
    """Area and perimeter from textbook formulas in 50-digit mpmath. The ellipse perimeter is 4 a E(m) with mpmath's complete elliptic integral of the second kind, m = 1 - b^2/a^2 (the engine uses the arithmetic-geometric mean)."""
    X_, Y_, Z_ = mpf_(x_), (None if y_ is None else mpf_(y_)), (None if z_ is None else mpf_(z_)); pi_ = mpm.pi; per_ = None
    if s_ == 1: ar_, per_ = X_ * Y_, 2 * (X_ + Y_)
    elif s_ == 2: ar_ = X_ * Y_ / 2
    elif s_ == 3: ar_ = (X_ + Y_) * Z_ / 2
    elif s_ == 4: ar_ = X_ * Y_
    elif s_ == 5:
        a_, b_ = max(X_, Y_), min(X_, Y_); ar_ = pi_ * X_ * Y_; per_ = 4 * a_ * mpm.ellipe(1 - b_ * b_ / (a_ * a_))
    elif s_ == 6: th_ = Y_ * pi_ / 180; ar_ = X_ * X_ * th_ / 2; per_ = 2 * X_ + X_ * th_
    elif s_ == 7: ar_ = pi_ * (X_ * X_ - Y_ * Y_); per_ = 2 * pi_ * X_ + 2 * pi_ * Y_
    else: ar_ = X_ * Y_ * Y_ / (4 * mpm.tan(pi_ / X_)); per_ = X_ * Y_
    o_ = {"area": float(ar_)}
    if per_ is not None: o_["perim"] = float(per_)
    add("area-calculator", {"s": s_, "x": x_, "y": "" if y_ is None else y_, "z": "" if z_ is None else z_}, o_, 1e-9)
for s_ in (1, 2, 4, 5):
    for _ in range(4): areavec(s_, round(rh.uniform(0.1, 300), 3), round(rh.uniform(0.1, 300), 3))
for _ in range(4): areavec(3, round(rh.uniform(0.1, 300), 3), round(rh.uniform(0.1, 300), 3), round(rh.uniform(0.1, 300), 3))
for _ in range(4): areavec(6, round(rh.uniform(0.1, 300), 3), round(rh.uniform(1, 360), 2))
for _ in range(4):
    R_ = round(rh.uniform(1, 300), 3); areavec(7, R_, round(rh.uniform(0.05, 0.95) * R_, 3))
for _ in range(4): areavec(8, rh.randint(3, 40), round(rh.uniform(0.1, 200), 3))
for a_ in ((1, 6, 4), (2, 10, 3), (3, 5, 7, 4), (4, 8, 3), (5, 5, 3), (5, 2, 1), (5, 1, 10), (5, 3, 3), (6, 10, 90), (6, 5, 360), (7, 10, 4), (8, 6, 2), (8, 4, 3), (8, 3, 1), (8, 1000, 0.5), (1, 1e6, 1e-3)): areavec(*a_)
def solidvec(s_, x_, y_=None, z_=None):
    X_, Y_, Z_ = mpf_(x_), (None if y_ is None else mpf_(y_)), (None if z_ is None else mpf_(z_)); pi_ = mpm.pi
    if s_ == 1: v_, a_, l_ = X_ * Y_ * Z_, 2 * X_ * Y_ + 2 * X_ * Z_ + 2 * Y_ * Z_, 2 * X_ * Z_ + 2 * Y_ * Z_
    elif s_ == 2: v_, a_, l_ = pi_ * X_ ** 2 * Y_, 2 * pi_ * X_ ** 2 + 2 * pi_ * X_ * Y_, 2 * pi_ * X_ * Y_
    elif s_ == 3: v_, a_ = mpm.mpf(4) / 3 * pi_ * X_ ** 3, 4 * pi_ * X_ ** 2; l_ = a_
    elif s_ == 4:
        sl_ = mpm.sqrt(X_ ** 2 + Y_ ** 2); v_, l_ = pi_ * X_ ** 2 * Y_ / 3, pi_ * X_ * sl_; a_ = pi_ * X_ ** 2 + l_
    else: v_, l_ = pi_ * (X_ ** 2 - Y_ ** 2) * Z_, 2 * pi_ * X_ * Z_ + 2 * pi_ * Y_ * Z_; a_ = l_ + 2 * pi_ * (X_ ** 2 - Y_ ** 2)
    add("volume-surface-area", {"s": s_, "x": x_, "y": "" if y_ is None else y_, "z": "" if z_ is None else z_}, {"vol": float(v_), "sa": float(a_), "lat": float(l_)}, 1e-9)
for _ in range(5): solidvec(1, round(rh.uniform(0.1, 200), 3), round(rh.uniform(0.1, 200), 3), round(rh.uniform(0.1, 200), 3))
for s_ in (2, 4):
    for _ in range(5): solidvec(s_, round(rh.uniform(0.1, 200), 3), round(rh.uniform(0.1, 200), 3))
for _ in range(5): solidvec(3, round(rh.uniform(0.1, 200), 3))
for _ in range(5):
    R_ = round(rh.uniform(1, 200), 3); solidvec(5, R_, round(rh.uniform(0.05, 0.95) * R_, 3), round(rh.uniform(0.1, 200), 3))
for a_ in ((1, 2, 3, 4), (2, 2, 5), (3, 3), (4, 3, 4), (5, 5, 3, 10), (1, 1, 1, 1), (2, 0.025, 12), (3, 1e6), (4, 1, 1e-3), (5, 0.05, 0.04, 100), (1, 20, 10, 3)): solidvec(*a_)

# --- v1.62.0: slope-calculator and distance-calculator (own stream, so earlier vectors are unchanged) ---
rk = random.Random(20261125)
def mq_(f_): return mpm.mpf(f_.numerator) / mpm.mpf(f_.denominator)   # exact Fraction to a 50-digit mpmath number
def slopevec(x1_, y1_, x2_, y2_):
    """Line through two points from exact Fractions; the angle is mpmath atan of the exact slope (the engine uses atan2), the length a 50-digit square root."""
    F_ = Fraction; X1_, Y1_, X2_, Y2_ = F_(str(x1_)), F_(str(y1_)), F_(str(x2_)), F_(str(y2_)); dx_, dy_ = X2_ - X1_, Y2_ - Y1_
    o_ = {"rise": float(dy_), "run": float(dx_), "len": float(mpm.sqrt(mq_(dx_ * dx_ + dy_ * dy_)))}
    if dx_ == 0: o_["ang"] = 90.0
    else:
        m_ = dy_ / dx_; o_["m"] = float(m_); o_["grade"] = float(100 * m_); o_["ang"] = float(mpm.atan(mq_(m_)) * 180 / mpm.pi)
        b_ = Y1_ - m_ * X1_
        if abs(b_) > 1e-6 * (abs(Y1_) + abs(m_ * X1_)): o_["b"] = float(b_)   # skip an intercept that is only a cancellation residue
    if dy_ != 0: o_["ratio"] = float(abs(dx_ / dy_))
    add("slope-calculator", {"x1": x1_, "y1": y1_, "x2": x2_, "y2": y2_}, nz(o_), 1e-9)
for _ in range(22):
    x1_ = round(rk.uniform(-200, 200), 3); y1_ = round(rk.uniform(-200, 200), 3)
    x2_ = round(x1_ + rk.choice([-1, 1]) * rk.uniform(0.5, 300), 3); y2_ = round(y1_ + rk.uniform(-150, 150), 3)
    if x2_ == x1_: x2_ += 1
    slopevec(x1_, y1_, x2_, y2_)
for a_ in ((0, 0, 20, 1), (0, 0, 4, 3), (0, 10, 5, 0), (4, 3, 0, 0), (2, 0, 2, 5), (0, 2, 8, 2), (-5, -5, 5, 5), (0, 0, 100, 0.5), (1000, 50, 0, 0), (0, 0, 1e6, 1), (0, 0, 1, 1e6), (-3.5, 12.25, 8.75, -6.5)): slopevec(*a_)
def distvec(p1_, p2_):
    """Distance from exact Fraction differences and a 50-digit square root; the angle above the horizontal is mpmath atan of dz / horizontal (the engine uses atan2); midpoint exact. A 2-value point has a blank z, which the page takes as 0."""
    F_ = Fraction; A_ = [F_(str(v_)) for v_ in p1_] + [F_(0)] * (3 - len(p1_)); B_ = [F_(str(v_)) for v_ in p2_] + [F_(0)] * (3 - len(p2_)); d_ = [b_ - a_ for a_, b_ in zip(A_, B_)]
    hz_ = mpm.sqrt(mq_(d_[0] * d_[0] + d_[1] * d_[1])); ds_ = mpm.sqrt(mq_(d_[0] * d_[0] + d_[1] * d_[1] + d_[2] * d_[2]))
    o_ = {"dist": float(ds_), "horiz": float(hz_), "dx": float(d_[0]), "dy": float(d_[1]), "dz": float(d_[2]), "mx": float((A_[0] + B_[0]) / 2), "my": float((A_[1] + B_[1]) / 2), "mz": float((A_[2] + B_[2]) / 2)}
    if ds_ != 0: o_["elev"] = float(mpm.atan(mq_(d_[2]) / hz_) * 180 / mpm.pi) if hz_ != 0 else (90.0 if d_[2] > 0 else -90.0)
    inp_ = {"x1": p1_[0], "y1": p1_[1], "z1": p1_[2] if len(p1_) > 2 else "", "x2": p2_[0], "y2": p2_[1], "z2": p2_[2] if len(p2_) > 2 else ""}
    add("distance-calculator", inp_, nz(o_), 1e-9)
for _ in range(12): distvec([round(rk.uniform(-300, 300), 3) for _ in range(2)], [round(rk.uniform(-300, 300), 3) for _ in range(2)])   # 2D
for _ in range(14): distvec([round(rk.uniform(-300, 300), 3) for _ in range(3)], [round(rk.uniform(-300, 300), 3) for _ in range(3)])   # 3D
for a_, b_ in (((1, 2, 3), (4, 6, 15)), ((0, 0, 5), (4, 3, 0)), ((0, 0, 0), (0, 0, 7)), ((0, 0, 0), (0, 0, -7)), ((1.5, -2.5, 10), (1.5, -2.5, 10)), ((100, 200, 0), (-100, -200, 50)), ((0.001, 0.002, 0.003), (0.004, 0.006, 0.015)), ((1e6, 1e6, 1e6), (-1e6, -1e6, -1e6))): distvec(a_, b_)

# --- v1.63.0: probability-calculator (own stream, so earlier vectors are unchanged) ---
rp = random.Random(20261126)
def probvec(pa_, pb_, rel_, pab_, n_):
    """Two-event probabilities from exact Fractions (inclusion-exclusion, conditional probability, n-trial powers); nothing is rounded until the final float()."""
    F_ = Fraction; A_, B_ = F_(str(pa_)), F_(str(pb_))
    AB_ = A_ * B_ if rel_ == 1 else (F_(0) if rel_ == 2 else F_(str(pab_)))
    OR_ = A_ + B_ - AB_
    o_ = {"pand": float(AB_), "por": float(OR_), "pnone": float(1 - OR_), "paonly": float(A_ - AB_), "pbonly": float(B_ - AB_), "pnota": float(1 - A_), "pnotb": float(1 - B_),
          "pall": float(A_ ** n_), "pany": float(1 - (1 - A_) ** n_)}
    if B_ != 0: o_["pagb"] = float(AB_ / B_)
    if A_ != 0: o_["pbga"] = float(AB_ / A_)
    add("probability-calculator", {"pa": pa_, "pb": pb_, "rel": rel_, "pab": "" if rel_ != 3 else pab_, "n": n_}, nz(o_), 1e-9)
for _ in range(14): probvec(round(rp.uniform(0.02, 0.95), 3), round(rp.uniform(0.02, 0.95), 3), 1, None, rp.randint(1, 40))
for _ in range(10):
    a_ = round(rp.uniform(0.02, 0.6), 3); probvec(a_, round(rp.uniform(0.02, 0.97 - a_), 3), 2, None, rp.randint(1, 30))
for _ in range(14):
    a_ = round(rp.uniform(0.1, 0.95), 3); b_ = round(rp.uniform(0.1, 0.95), 3); lo_ = max(0, a_ + b_ - 1); hi_ = min(a_, b_)
    probvec(a_, b_, 3, round(rp.uniform(lo_ + 0.01 * (hi_ - lo_), hi_ - 0.01 * (hi_ - lo_)), 3) if hi_ - lo_ > 0.02 else hi_, rp.randint(1, 25))
for a_ in ((0.3, 0.5, 1, None, 5), (0.2, 0.5, 2, None, 1), (0.6, 0.5, 3, 0.4, 2), (0.01, 0.01, 1, None, 1), (1, 0.25, 1, None, 3), (0.4, 0, 1, None, 1), (0, 0.4, 1, None, 4), (0.5, 0.5, 2, None, 10), (0.999, 0.999, 1, None, 3), (0.001, 0.002, 1, None, 1000), (0.3, 0.3, 3, 0.3, 2), (0.05, 0.9, 3, 0.05, 100)): probvec(*a_)

# --- v1.64.0: permutations-combinations and binomial-distribution (own stream, so earlier vectors are unchanged) ---
rc = random.Random(20261111)
def combvec(n_, r_):
    """Exact integer counts from Python math.factorial, math.perm and math.comb (a different method from the engine's BigInt loops); nothing is rounded until the final float()."""
    o_ = {"nfact": float(math.factorial(n_)), "perm": float(math.perm(n_, r_)), "comb": float(math.comb(n_, r_)), "permrep": float(n_ ** r_), "combrep": float(math.comb(n_ + r_ - 1, r_))}
    add("permutations-combinations", {"n": n_, "r": r_}, nz(o_), 1e-9)
for _ in range(14): n_ = rc.randint(1, 100); combvec(n_, rc.randint(0, n_))
for _ in range(6): combvec(rc.randint(1, 100), rc.randint(0, 100))   # r may exceed n
for a_ in ((10, 3), (52, 5), (6, 0), (5, 5), (3, 5), (100, 1), (100, 100), (100, 50), (1, 1), (1, 0), (49, 6), (20, 10)): combvec(*a_)
def binvec(n_, p_, k_):
    """Binomial probabilities from exact Fractions: comb(n, j) p^j (1 - p)^(n - j) summed term by term for each tail; values below 1e-250 are left out of the comparison."""
    F_ = Fraction; P_ = F_(str(p_)); Q_ = 1 - P_
    pm_ = lambda j_: math.comb(n_, j_) * P_ ** j_ * Q_ ** (n_ - j_)
    pk_ = pm_(k_); plt_ = sum((pm_(j_) for j_ in range(0, k_)), F_(0)); pgt_ = sum((pm_(j_) for j_ in range(k_ + 1, n_ + 1)), F_(0))
    o_ = {"pk": float(pk_), "plt": float(plt_), "ple": float(plt_ + pk_), "pgt": float(pgt_), "pge": float(pgt_ + pk_), "mean": float(n_ * P_), "var": float(n_ * P_ * Q_), "sd": float(mpm.sqrt(mq_(n_ * P_ * Q_)))}
    add("binomial-distribution", {"n": n_, "p": p_, "k": k_}, {a_: b_ for a_, b_ in o_.items() if abs(b_) >= 1e-250}, 1e-9)
for _ in range(16):
    n_ = rc.randint(1, 120); binvec(n_, round(rc.uniform(0.02, 0.98), 3), rc.randint(0, n_))
for _ in range(6):
    n_ = rc.randint(150, 400); binvec(n_, round(rc.uniform(0.2, 0.8), 3), rc.randint(0, n_))
for a_ in ((10, 0.5, 5), (20, 0.05, 2), (3, 0.1, 0), (4, 0.5, 4), (8, 0, 0), (8, 1, 8), (1, 0.3, 1), (1000, 0.5, 500), (500, 0.01, 5), (50, 0.999, 49), (12, 0.25, 3), (100, 0.05, 0)): binvec(*a_)


# --- v1.72.0: three AGL calculators, written from the relations on their pages (not from engine.js), appended last from their own stream ---
ra = random.Random(20261201)
def rua(lo, hi, nd=3): return round(ra.uniform(lo, hi), nd)
# agl-cable-loop-loss: R = rho20 (1 + alpha (T - 20)) L / A, with rho in ohm mm2/m and A in mm2; Vd = I R; P = I^2 R
MATA = {1: (0.017241, 0.00393), 2: (0.028264, 0.00403)}
for _ in range(25):
    I_, L_, A_, m_, T_ = rua(1, 20, 2), rua(50, 15000, 0), rua(1.5, 95, 1), ra.choice([1, 2]), rua(-20, 110, 1)
    r20_, al_ = MATA[m_]; R_ = r20_ * (1 + al_ * (T_ - 20)) * L_ / A_
    add("agl-cable-loop-loss", {"I": I_, "L": L_, "A": A_, "mat": m_, "T": T_}, {"Rl": R_, "Rk": R_ / L_ * 1000, "Vd": I_ * R_, "Pc": I_ * I_ * R_}, 1e-9)
# agl-cable-size-loss: A >= rho(T) L I^2 / (lim/100 P), next size from the IEC 60228 list used on the page; loss and share at that size
SIZES_A = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630]
for _ in range(30):
    I_, L_, P_, lim_, m_, T_ = rua(1, 12, 2), rua(100, 12000, 0), rua(0.5, 60, 3), rua(2, 30, 1), ra.choice([1, 2]), rua(-10, 90, 1)
    r20_, al_ = MATA[m_]; rho_ = r20_ * (1 + al_ * (T_ - 20))
    Am_ = rho_ * L_ * I_ * I_ / (lim_ / 100 * P_ * 1000)
    Ast_ = next((a for a in SIZES_A if a >= Am_ - 1e-9), None)
    o_ = {"Amin": Am_}
    if Ast_ is not None:
        Pc_ = I_ * I_ * rho_ * L_ / Ast_; o_.update({"Astd": Ast_, "Pc": Pc_, "pct": Pc_ / (P_ * 1000) * 100})
    add("agl-cable-size-loss", {"I": I_, "L": L_, "P": P_, "lim": lim_, "mat": m_, "T": T_}, o_, 1e-9)
# boundary: a loop that needs exactly a listed size (rho 1 ohm mm2/m is not a material, so use copper at 20 C and pick L so that A = 10 mm2 exactly)
for sz_ in (4, 16, 95):
    L_ = 1000.0; I_ = 5.0; r20_ = 0.017241; lim_ = 10.0; P_ = r20_ * L_ * I_ * I_ / sz_ / (lim_ / 100) / 1000
    add("agl-cable-size-loss", {"I": I_, "L": L_, "P": P_, "lim": lim_, "mat": 1, "T": 20}, {"Amin": sz_, "Astd": sz_, "pct": lim_}, 1e-9)
# agl-lamp-failure-load: P0 = n Pl / eta + I^2 R L; Pf = (n - f) Pl / eta + f Pm + I^2 R L; dP = Pf - P0 = f (Pm - Pl / eta)
for _ in range(30):
    n_ = ra.randint(1, 400); f_ = ra.randint(0, n_); Pl_, et_, Pm_ = rua(10, 200, 1), rua(0.6, 0.98), rua(0, 20, 1)
    I_, L_, R_ = rua(2.8, 6.6, 2), rua(100, 12000, 0), rua(0.5, 8, 3)
    cab_ = I_ * I_ * (R_ / 1000) * L_; P0_ = n_ * Pl_ / et_ + cab_; Pf_ = (n_ - f_) * Pl_ / et_ + f_ * Pm_ + cab_
    add("agl-lamp-failure-load", {"n": n_, "f": f_, "Pl": Pl_, "et": et_, "Pm": Pm_, "I": I_, "L": L_, "R": R_},
        {"P0": P0_ / 1000, "Pf": Pf_ / 1000, "dP": Pf_ - P0_, "pd": (Pf_ - P0_) / P0_ * 100, "Vf": Pf_ / I_}, 1e-9)


# --- v1.74.0: superposition-theorem (own stream, so earlier vectors are unchanged) ---
# Textbook node-voltage method in exact Fractions: Kirchhoff's current law at the load node N,
# (V1 - Vn)/R1 + (V2 - Vn)/R2 + Is = Vn/R3. Each source's contribution is found by solving that equation
# with the other sources set to zero (a different route from the engine's resistor-divider formulas), then summed.
rsu = random.Random(20261122)
def sup_nodal(v1_, r1_, v2_, r2_, is_, r3_):
    return (v1_ / r1_ + v2_ / r2_ + is_) / (1 / r1_ + 1 / r2_ + 1 / r3_)
def supvec(V1_, R1_, V2_, R2_, Is_, R3_):
    F_ = lambda x_: Fraction(str(x_)); v1_, r1_, v2_, r2_, i_, r3_ = map(F_, (V1_, R1_, V2_, R2_, Is_, R3_))
    a1_ = sup_nodal(v1_, r1_, F_(0), r2_, F_(0), r3_); a2_ = sup_nodal(F_(0), r1_, v2_, r2_, F_(0), r3_); a3_ = sup_nodal(F_(0), r1_, F_(0), r2_, i_, r3_)
    vl_ = sup_nodal(v1_, r1_, v2_, r2_, i_, r3_)
    assert a1_ + a2_ + a3_ == vl_   # the theorem itself, exact
    o_ = {"Vl1": float(a1_), "Vl2": float(a2_), "Vl3": float(a3_), "VL": float(vl_), "IL": float(vl_ / r3_), "P": float(vl_ * vl_ / r3_),
          "Psum": float((a1_ ** 2 + a2_ ** 2 + a3_ ** 2) / r3_), "I1": float((v1_ - vl_) / r1_), "I2": float((v2_ - vl_) / r2_)}
    add("superposition-theorem", {"V1": V1_, "R1": R1_, "V2": V2_, "R2": R2_, "Is": Is_, "R3": R3_}, nz(o_), 1e-9)
for _ in range(36):   # random networks: whole-volt sources (either polarity), tenth-of-an-ohm to kilo-ohm resistances, current source of either sign or zero
    supvec(rsu.choice([0, 0, rsu.randint(-60, 60), rsu.randint(1, 230)]), round(rsu.uniform(0.1, 500), 2), rsu.choice([0, rsu.randint(-60, 60), rsu.randint(1, 48)]), round(rsu.uniform(0.1, 500), 2),
           rsu.choice([0, round(rsu.uniform(-5, 5), 3), round(rsu.uniform(0.01, 2), 3)]), round(rsu.uniform(0.1, 2000), 2))
for a_ in ((12, 2, 6, 3, 1, 6), (10, 2, 0, 3, 0, 6), (0, 4, 0, 12, 2, 6), (10, 1, -4, 1, 0, 2), (5, 1000, 5, 1000, 0.001, 1000), (24, 4, 12, 6, 0.5, 12), (120, 0.5, 110, 0.4, 0, 8), (12, 0.05, 12.6, 0.02, -30, 0.5)):
    supvec(*a_)

# --- v1.75.0: magnetic-circuit (own stream, so earlier vectors are unchanged) ---
# Hopkinson's law written from the textbook in exact Fractions where possible: R = l/(mu0 mur A), F = N I = phi (Rc + Rg), B = phi/A, H = B/(mu0 mur), L = N^2/R, W = L I^2/2.
# Route differs from the engine: the MMF drops are found from the series-circuit (voltage-divider) share F * R_part / R_total, then H = F_part / l.
rmg = random.Random(20261123)
def mcvec(N_, I_, lc_cm, Ac_cm2, mur_, lg_mm, kf_):
    F_ = Fraction; mu0_ = 4e-7 * math.pi
    lc_ = lc_cm / 100; Ac_ = Ac_cm2 * 1e-4; lg_ = lg_mm / 1000; Ag_ = Ac_ * kf_
    Rc_ = lc_ / (mu0_ * mur_ * Ac_); Rg_ = lg_ / (mu0_ * Ag_); Rt_ = Rc_ + Rg_; Fm_ = N_ * I_
    Fc_ = Fm_ * Rc_ / Rt_; Fg_ = Fm_ * Rg_ / Rt_; phi_ = Fm_ / Rt_
    o_ = {"Rc": Rc_, "Rg": Rg_, "Rt": Rt_, "F": Fm_, "Fc": Fc_, "Fg": Fg_, "pg": Fg_ / Fm_ * 100, "phi": phi_, "Bc": phi_ / Ac_, "Bg": phi_ / Ag_,
          "Hc": Fc_ / lc_, "Hg": Fg_ / lg_ if lg_ else 0, "L": N_ * N_ / Rt_ * 1000, "W": 0.5 * N_ * N_ / Rt_ * I_ * I_}
    if lg_ == 0: o_ = {k_: v_ for k_, v_ in o_.items() if k_ not in ("Bg", "Hg", "Fg", "pg")}
    add("magnetic-circuit", {"N": N_, "I": I_, "lc": lc_cm, "Ac": Ac_cm2, "mur": mur_, "lg": lg_mm, "kf": kf_}, nz(o_), 1e-9)
for _ in range(30):
    mcvec(rmg.choice([50, 100, 200, 500, 1000, 2500]), round(rmg.uniform(0.05, 10), 3), round(rmg.uniform(5, 80), 1), round(rmg.uniform(0.5, 30), 2), rmg.choice([200, 800, 1500, 2000, 4000, 10000]),
          rmg.choice([0, 0.1, 0.5, 1, 2, 5]), rmg.choice([1, 1.05, 1.1, 1.2, 1.5]))
for a_ in ((500, 2, 30, 4, 2000, 1, 1), (500, 2, 30, 4, 2000, 1, 1.1), (200, 1, 20, 5, 1500, 0, 1), (1000, 0.5, 40, 6, 800, 2, 1.15), (2000, 5, 30, 4, 2000, 1, 1)):
    mcvec(*a_)


# --- v1.76.0: dc-machine-emf-torque (own stream, so earlier vectors are unchanged) ---
# DC machine relations written from the textbook in exact Fractions where possible: Ea = (P Z / (60 A)) phi N, A = P (lap) or 2 (wave), voltage balance V = Ea + Ia Ra + Vb (motor) or V = Ea - Ia Ra - Vb (generator).
# Route differs from the engine: the torque is found from the power balance Te = Ea Ia / omega (not from the torque constant), the motor speed is the exact ratio Ea / EMF-per-rpm,
# and the efficiency is found from the losses, (Pt - Pcu - Pbr) / Pt for a motor and Pt / (Pt + Pcu + Pbr) for a generator, which the generator code also checks against Ea Ia.
rdc = random.Random(20261124)
def dcvec(op_, P_, Z_, wind_, phi_mwb, V_, N_, Ia_, Ra_, Vb_):
    F_ = Fraction
    A_ = P_ if wind_ == 0 else 2
    kv_ = F_(P_ * Z_, 60 * A_) * F_(str(phi_mwb)) / 1000          # volts per rpm, exact
    Ia_f, Ra_f, Vb_f = F_(str(Ia_)), F_(str(Ra_)), F_(str(Vb_))
    if op_ == 1:
        Vt_ = F_(str(V_)); Ea_ = Vt_ - Ia_f * Ra_f - Vb_f; Nr_ = Ea_ / kv_
    else:
        Nr_ = F_(str(N_)); Ea_ = kv_ * Nr_; Vt_ = Ea_ - Ia_f * Ra_f - Vb_f
    assert Ea_ > 0 and Vt_ > 0
    w_ = 2 * math.pi * float(Nr_) / 60
    Pd_ = Ea_ * Ia_f; Pcu_ = Ia_f * Ia_f * Ra_f; Pbr_ = Vb_f * Ia_f; Pt_ = Vt_ * Ia_f
    assert (Pd_ == Pt_ + Pcu_ + Pbr_) if op_ == 0 else (Pt_ == Pd_ + Pcu_ + Pbr_)   # power balance
    o_ = {"A": A_, "Ea": float(Ea_), "Nr": float(Nr_), "w": w_, "Vt": float(Vt_), "Te": float(Pd_) / w_, "Pd": float(Pd_) / 1000, "Pcu": float(Pcu_) / 1000, "Pbr": float(Pbr_) / 1000, "Pt": float(Pt_) / 1000}
    if Ia_f > 0: o_["eff"] = float((Pt_ - Pcu_ - Pbr_) / Pt_ * 100) if op_ == 1 else float(Pt_ / (Pt_ + Pcu_ + Pbr_) * 100)
    inp_ = {"op": op_, "P": P_, "Z": Z_, "wind": wind_, "phi": phi_mwb, "Ia": Ia_, "Ra": Ra_, "Vb": Vb_}
    if op_ == 1: inp_["V"] = V_
    else: inp_["N"] = N_
    add("dc-machine-emf-torque", inp_, nz(o_), 1e-9)
for _ in range(20):
    P_ = rdc.choice([2, 4, 6, 8, 12]); Z_ = rdc.choice([120, 240, 360, 480, 600, 720, 960, 1440]); wd_ = rdc.choice([0, 1]); ph_ = round(rdc.uniform(2, 80), 1)
    V_ = rdc.choice([24, 110, 220, 230, 440, 600]); Ra_ = round(rdc.uniform(0.02, 0.6), 3); Vb_ = rdc.choice([0, 1, 2, 2.5])
    Ia_ = round(rdc.uniform(0, (0.15 * V_ - Vb_) / Ra_), 2) if 0.15 * V_ > Vb_ else 0
    dcvec(1, P_, Z_, wd_, ph_, V_, None, Ia_, Ra_, Vb_)
for _ in range(20):
    P_ = rdc.choice([2, 4, 6, 8, 12]); Z_ = rdc.choice([120, 240, 360, 480, 600, 720, 960, 1440]); wd_ = rdc.choice([0, 1]); ph_ = round(rdc.uniform(2, 80), 1)
    N_ = rdc.choice([500, 750, 1000, 1200, 1500, 1800, 3000]); Ra_ = round(rdc.uniform(0.02, 0.6), 3); Vb_ = rdc.choice([0, 1, 2, 2.5])
    Ea0_ = float(Fraction(P_ * Z_, 60 * (P_ if wd_ == 0 else 2)) * Fraction(str(ph_)) / 1000 * N_)
    Ia_ = round(rdc.uniform(0, max(0, (0.15 * Ea0_ - Vb_) / Ra_)), 2) if 0.15 * Ea0_ > Vb_ else 0
    if Ea0_ - Ia_ * Ra_ - Vb_ > 0: dcvec(0, P_, Z_, wd_, ph_, None, N_, Ia_, Ra_, Vb_)
for a_ in ((1, 4, 720, 0, 12, 230, None, 40, 0.25, 2), (0, 4, 720, 0, 12, None, 1500, 40, 0.25, 2), (0, 4, 600, 1, 25, None, 1000, 0, 0.2, 2), (1, 6, 400, 1, 30, 440, None, 100, 0.1, 0), (1, 2, 200, 0, 40, 110, None, 15, 0.8, 2)):
    dcvec(*a_)


# --- v1.77.0: transformer-test-data (own stream, so earlier vectors are unchanged) ---
# OC/SC test reduction written from the textbook in a different route from the engine: the magnetising branch from the admittance triangle (Y0, G, B),
# the series branch from the short-circuit power triangle (Q = sqrt(S^2 - P^2), X = Q / I^2), regulation from the complex phasor sum with cmath, efficiency from the loss sum.
import cmath
rtt = random.Random(20261125)
def ttvec(S_, V1_, V2_, n_, V0_, I0_, P0_, Vsc_, Isc_, Psc_, xp_, pf_, lead_):
    k_ = math.sqrt(3) if n_ == 3 else 1
    Ir_ = S_ * 1000 / (k_ * V1_); a_ = V1_ / V2_
    Y_ = I0_ / (V0_ / k_); G_ = (P0_ / n_) / (V0_ / k_) ** 2; B_ = math.sqrt(Y_ * Y_ - G_ * G_)
    cos0_ = P0_ / (k_ * V0_ * I0_)
    Ssc_ = Vsc_ * Isc_ * k_ / n_; Pph_ = Psc_ / n_; Q_ = math.sqrt(Ssc_ ** 2 - Pph_ ** 2)
    R_ = Pph_ / Isc_ ** 2; X_ = Q_ / Isc_ ** 2; Z_ = math.hypot(R_, X_); Zb_ = V1_ ** 2 / (S_ * 1000)
    Pcu_ = Psc_ * (Ir_ / Isc_) ** 2; x_ = xp_ / 100; phi_ = math.acos(pf_)
    I_ = x_ * Ir_ * cmath.rect(1, phi_ if lead_ else -phi_); Vp_ = V1_ / k_
    E_ = abs(Vp_ + I_ * complex(R_, X_)); reg_ = (E_ - Vp_) / Vp_ * 100
    Po_ = x_ * S_ * 1000 * pf_; eff_ = Po_ / (Po_ + P0_ + x_ * x_ * Pcu_) * 100
    xm_ = math.sqrt(P0_ / Pcu_); em_ = xm_ * S_ * 1000 * pf_ / (xm_ * S_ * 1000 * pf_ + 2 * P0_) * 100
    o_ = {"Ir": Ir_, "cos0": cos0_, "Ic": I0_ * cos0_, "Im": I0_ * math.sqrt(1 - cos0_ ** 2), "Rc": a_ * a_ / G_, "Xm": a_ * a_ / B_, "R": R_, "X": X_, "Z": Z_,
          "pR": R_ / Zb_ * 100, "pX": X_ / Zb_ * 100, "pZ": Z_ / Zb_ * 100, "Pc": P0_ / 1000, "Pcu": Pcu_ / 1000, "reg": reg_, "eff": eff_, "xm": xm_ * 100, "em": em_}
    add("transformer-test-data", {"S": S_, "V1": V1_, "V2": V2_, "ph": n_, "V0": V0_, "I0": I0_, "P0": P0_, "Vsc": Vsc_, "Isc": Isc_, "Psc": Psc_, "xp": xp_, "pf": pf_, "lead": lead_}, nz(o_), 1e-8)
for _ in range(36):
    n_ = rtt.choice([1, 3]); S_ = rtt.choice([25, 63, 100, 250, 500, 1000, 2500]); V1_ = rtt.choice([3300, 6600, 11000, 22000, 33000]); V2_ = rtt.choice([240, 415, 433, 690, 3300])
    if V2_ >= V1_: V2_ = 415
    k_ = math.sqrt(3) if n_ == 3 else 1; Ir_ = S_ * 1000 / (k_ * V1_)
    Isc_ = round(Ir_ * rtt.uniform(0.9, 1.1), 3); zpu_ = rtt.uniform(0.03, 0.10); rpu_ = zpu_ * rtt.uniform(0.15, 0.5)
    Zb_ = V1_ ** 2 / (S_ * 1000); Vsc_ = round(zpu_ * Zb_ * Isc_ * k_, 2); Psc_ = round(rpu_ * Zb_ * Isc_ ** 2 * n_, 1)
    I0_ = round(Ir_ * (V1_ / V2_) * rtt.uniform(0.01, 0.05), 3); P0_ = round(k_ * V2_ * I0_ * rtt.uniform(0.15, 0.4), 1)
    ttvec(S_, V1_, V2_, n_, V2_, I0_, P0_, Vsc_, Isc_, Psc_, rtt.choice([25, 50, 75, 100, 110]), round(rtt.uniform(0.5, 1), 2), rtt.choice([0, 0, 1]))
for a_ in ((500, 11000, 433, 3, 433, 6.5, 1100, 475, 26.24, 5200, 75, 0.8, 0), (500, 11000, 433, 3, 433, 6.5, 1100, 475, 26.24, 5200, 100, 0.8, 1), (100, 6600, 230, 1, 230, 2, 150, 300, 15.15, 1400, 50, 1, 0)):
    ttvec(*a_)


# --- v1.78.0: load-flow-3bus (own stream, so earlier vectors are unchanged) ---
# Reverse construction, no iterative solver on the reference side: the bus voltages are CHOSEN first, the injections follow directly from the bus admittance
# matrix (S = V conj(Y V)), and those injections are fed to the engine as the loads, so the engine's iteration must land back on the chosen voltages.
# Line flows come from branch currents I = (Vi - Vj) / z (not from the admittance form the engine uses). Loads are in MW and MVAR, the base in MVA.
rlf = random.Random(20261126)
def lfvec(Sb_, V1_, z12_, z13_, z23_, v2_, v3_, t3_, method_):
    z_ = (complex(*z12_), complex(*z13_), complex(*z23_)); y_ = [1 / z for z in z_]
    Y_ = [[y_[0] + y_[1], -y_[0], -y_[1]], [-y_[0], y_[0] + y_[2], -y_[2]], [-y_[1], -y_[2], y_[1] + y_[2]]]
    v_ = [complex(V1_, 0), v2_, v3_]
    S_ = [v_[k] * sum(Y_[k][j] * v_[j] for j in range(3)).conjugate() for k in range(3)]
    br_ = lambda a, b, z: v_[a] * ((v_[a] - v_[b]) / z).conjugate()
    f12_, f13_, f23_ = br_(0, 1, z_[0]), br_(0, 2, z_[1]), br_(1, 2, z_[2])
    loss_ = (f12_ + br_(1, 0, z_[0]) + f13_ + br_(2, 0, z_[1]) + f23_ + br_(2, 1, z_[2])).real
    cx_ = lambda c: cmath.phase(c) * 180 / math.pi
    inp_ = {"Sb": Sb_, "V1": V1_, "R12": z12_[0], "X12": z12_[1], "R13": z13_[0], "X13": z13_[1], "R23": z23_[0], "X23": z23_[1],
            "P2": -S_[1].real * Sb_, "Q2": -S_[1].imag * Sb_, "t3": t3_, "P3": (S_[2].real if t3_ else -S_[2].real) * Sb_, "method": method_}
    if t3_: inp_["V3"] = abs(v3_)
    else: inp_["Q3"] = -S_[2].imag * Sb_
    o_ = {"V2": abs(v2_), "a2": cx_(v2_), "V3": abs(v3_), "a3": cx_(v3_), "Pg": S_[0].real * Sb_, "Qg": S_[0].imag * Sb_,
          "P12": f12_.real * Sb_, "Q12": f12_.imag * Sb_, "P13": f13_.real * Sb_, "Q13": f13_.imag * Sb_, "P23": f23_.real * Sb_, "Q23": f23_.imag * Sb_, "Pl": loss_ * Sb_}
    if t3_: o_["Qg3"] = S_[2].imag * Sb_
    add("load-flow-3bus", inp_, nz(o_), 1e-7)
for _ in range(38):
    t3_ = rlf.choice([0, 0, 1]); Sb_ = rlf.choice([50, 100, 100, 200, 500]); V1_ = round(rlf.uniform(1.0, 1.06), 3)
    zs_ = [(round(rlf.uniform(0.01, 0.08), 4), round(rlf.uniform(0.03, 0.3), 4)) for _ in range(3)]
    v2_ = cmath.rect(rlf.uniform(0.96, 1.04), math.radians(rlf.uniform(-9, 0))); v3_ = cmath.rect(rlf.uniform(0.95, 1.05), math.radians(rlf.uniform(-10, 3)))
    lfvec(Sb_, V1_, zs_[0], zs_[1], zs_[2], v2_, v3_, t3_, rlf.choice([0, 0, 1]))
for a_ in ((100, 1.05, (0.02, 0.06), (0.08, 0.24), (0.06, 0.18), cmath.rect(0.99935866791814, math.radians(-2.7575932818366393)), cmath.rect(0.9716691071557862, math.radians(-4.61365233229834)), 0, 0),
           (100, 1.05, (0.02, 0.06), (0.08, 0.24), (0.06, 0.18), cmath.rect(0.99935866791814, math.radians(-2.7575932818366393)), cmath.rect(0.9716691071557862, math.radians(-4.61365233229834)), 0, 1),
           (100, 1.05, (0.02, 0.06), (0.08, 0.24), (0.06, 0.18), cmath.rect(1.0173322159861413, math.radians(-0.8750725672036055)), cmath.rect(1.04, math.radians(2.9758885296650637)), 1, 0),
           (50, 1.02, (0.01, 0.08), (0.015, 0.1), (0.02, 0.12), cmath.rect(0.9952512707975815, math.radians(-0.49632459667244433)), cmath.rect(1.0, math.radians(2.6978423635654245)), 1, 1)):
    lfvec(*a_)


# --- v1.79.0: symmetrical-components (own stream, so earlier vectors are unchanged) ---
# No sequence-network closed forms on the reference side. Phase to sequence: the sequence components are CHOSEN first, the phase phasors follow from the
# transformation matrix, and the engine must recover the chosen components. Sequence to phase: the phasors are checked against the same matrix product.
# Faults: the fault boundary conditions are written in the PHASE domain (Zabc = A diag(Z0,Z1,Z2) A^-1, prefault Ea, Eb, Ec) and the six unknowns (three
# currents, three voltages) are found by one linear solve with Gaussian elimination, so the engine's sequence-network formulas are checked against a different route.
rsc = random.Random(20261127)
a_sc = cmath.exp(2j * math.pi / 3)
A_sc = [[1, 1, 1], [1, a_sc * a_sc, a_sc], [1, a_sc, a_sc * a_sc]]
def solve_sc(M, b):
    n = len(b); T = [list(M[i]) + [b[i]] for i in range(n)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(T[r][c])); T[c], T[p] = T[p], T[c]
        for r in range(n):
            if r != c:
                f = T[r][c] / T[c][c]; T[r] = [x - f * y for x, y in zip(T[r], T[c])]
    return [T[i][n] / T[i][i] for i in range(n)]
def zabc_sc(Z0, Z1, Z2):
    cols = [solve_sc(A_sc, [1 if i == k else 0 for i in range(3)]) for k in range(3)]
    Ai = [[cols[c][r] for c in range(3)] for r in range(3)]; D_ = [Z0, Z1, Z2]
    return [[sum(A_sc[i][k] * D_[k] * Ai[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
def faults_sc(E, Z0, Z1, Z2):
    Z = zabc_sc(Z0, Z1, Z2); Ea = [E, E * a_sc * a_sc, E * a_sc]
    def sys_(bc):
        M = []; rhs = []
        for r_ in range(3): M.append([Z[r_][0], Z[r_][1], Z[r_][2]] + [1 if k == r_ else 0 for k in range(3)]); rhs.append(Ea[r_])
        for row, v in bc: M.append(row); rhs.append(v)
        return solve_sc(M, rhs)
    x3 = sys_([([0, 0, 0, 1, 0, 0], 0), ([0, 0, 0, 0, 1, 0], 0), ([0, 0, 0, 0, 0, 1], 0)])
    xg = sys_([([0, 0, 0, 1, 0, 0], 0), ([0, 1, 0, 0, 0, 0], 0), ([0, 0, 1, 0, 0, 0], 0)])
    xl = sys_([([1, 0, 0, 0, 0, 0], 0), ([0, 1, 1, 0, 0, 0], 0), ([0, 0, 0, 0, 1, -1], 0)])
    xd = sys_([([1, 0, 0, 0, 0, 0], 0), ([0, 0, 0, 0, 1, 0], 0), ([0, 0, 0, 0, 0, 1], 0)])
    return {"If3": abs(x3[0]) / 1000, "Islg": abs(xg[0]) / 1000, "Ill": abs(xl[1]) / 1000, "Illgb": abs(xd[1]) / 1000, "Illgc": abs(xd[2]) / 1000, "Illgn": abs(xd[1] + xd[2]) / 1000}
def wrapang_sc(z): return math.degrees(cmath.phase(z))
def scvec_seq(Mg, An):   # Mg, An: chosen sequence magnitudes and angles; the phases are built from the matrix
    S_ = [cmath.rect(Mg[k], math.radians(An[k])) for k in range(3)]
    P_ = [sum(A_sc[i][j] * S_[j] for j in range(3)) for i in range(3)]
    ph_ = {"Ma": abs(P_[0]), "Fa": wrapang_sc(P_[0]), "Mb": abs(P_[1]), "Fb": wrapang_sc(P_[1]), "Mc": abs(P_[2]), "Fc": wrapang_sc(P_[2])}
    return S_, P_, ph_
def scok(angs): return all(abs(abs(x) - 180) > 0.5 for x in angs)
n_sc = 0
while n_sc < 14:   # phase to sequence, reverse construction
    Mg_ = [round(rsc.uniform(1, 60), 3), round(rsc.uniform(150, 450), 3), round(rsc.uniform(1, 60), 3)]; An_ = [round(rsc.uniform(-170, 170), 2) for _ in range(3)]
    S_, P_, ph_ = scvec_seq(Mg_, An_)
    if not scok([ph_["Fa"], ph_["Fb"], ph_["Fc"]] + An_): continue
    inp_ = dict(ph_, mode=0); o_ = {"M0": Mg_[0], "A0": An_[0], "M1": Mg_[1], "A1": An_[1], "M2": Mg_[2], "A2": An_[2], "u2": Mg_[2] / Mg_[1] * 100, "u0": Mg_[0] / Mg_[1] * 100}
    add("symmetrical-components", inp_, o_, 1e-8); n_sc += 1
n_sc = 0
while n_sc < 14:   # sequence to phase, phasors from the matrix product
    Mg_ = [round(rsc.uniform(0.5, 80), 3), round(rsc.uniform(100, 500), 3), round(rsc.uniform(0.5, 80), 3)]; An_ = [round(rsc.uniform(-170, 170), 2) for _ in range(3)]
    S_, P_, ph_ = scvec_seq(Mg_, An_)
    if not scok([ph_["Fa"], ph_["Fb"], ph_["Fc"]] + An_): continue
    add("symmetrical-components", {"mode": 1, "S0": Mg_[0], "G0": An_[0], "S1": Mg_[1], "G1": An_[1], "S2": Mg_[2], "G2": An_[2]},
        {"Pma": ph_["Ma"], "Paa": ph_["Fa"], "Pmb": ph_["Mb"], "Pab": ph_["Fb"], "Pmc": ph_["Mc"], "Pac": ph_["Fc"], "M0": Mg_[0], "M1": Mg_[1], "M2": Mg_[2]}, 1e-8); n_sc += 1
for _ in range(12):   # faults at 230 V to 33 kV
    Vll_ = rsc.choice([400, 415, 690, 3300, 6600, 11000, 33000]); sc_ = Vll_ / 400
    z1_ = complex(round(rsc.uniform(0.005, 0.05) * sc_, 5), round(rsc.uniform(0.03, 0.3) * sc_, 5))
    z2_ = z1_ if rsc.random() < 0.5 else complex(round(rsc.uniform(0.005, 0.06) * sc_, 5), round(rsc.uniform(0.03, 0.35) * sc_, 5))
    z0_ = complex(round(rsc.uniform(0.0, 0.2) * sc_, 5), round(rsc.uniform(0.01, 0.9) * sc_, 5))
    add("symmetrical-components", {"mode": 2, "Vll": Vll_, "R1": z1_.real, "X1": z1_.imag, "R2": z2_.real, "X2": z2_.imag, "R0": z0_.real, "X0": z0_.imag}, faults_sc(Vll_ / math.sqrt(3), z0_, z1_, z2_), 1e-8)
for z_ in ((0.06 + 0.2j, 0.02 + 0.08j, 0.02 + 0.08j), (0.005 + 0.02j, 0.02 + 0.08j, 0.02 + 0.08j), (0.3 + 1.1j, 0.05 + 0.25j, 0.06 + 0.28j), (0 + 0.0001j, 0.02 + 0.08j, 0.02 + 0.08j)):
    add("symmetrical-components", {"mode": 2, "Vll": 400, "R1": z_[1].real, "X1": z_[1].imag, "R2": z_[2].real, "X2": z_[2].imag, "R0": z_[0].real, "X0": z_[0].imag}, nz(faults_sc(400 / math.sqrt(3), z_[0], z_[1], z_[2])), 1e-8)


# --- v1.80.0: power-electronics-converter (own stream, so earlier vectors are unchanged) ---
# Rectifier: NO closed forms. The output waveform of each circuit is built from the phase voltages (max of the phases, or max minus min for the bridge) and
# its average and RMS are integrated numerically (mpmath, breakpoints every pi/6); the diode current is integrated from the waveform of one diode; the
# capacitor case is solved by bisection on the voltage balance Vfl = Vm - (Vfl / RL) / (2 fr C).
# Inverter: the fundamental and the total RMS are found by numerical Fourier integration of the switched waveforms (square wave, six-step line and phase
# voltages from the pole states); PWM fundamentals are complex-phasor sums of the pole fundamentals.
# DC-DC: from inductor volt-second balance and capacitor charge balance, in exact fractions (D from the volt-second equation, L from the ON-interval
# slope (Vin - Vo) D / (fsw dIL) for the buck, the capacitor ripple from the area of the charge triangle for the buck).
import mpmath as mp
mp.mp.dps = 30
rpc = random.Random(20261128)
def pc_wave(t, th, Vm):
    ph = [Vm * mp.sin(th - 2 * mp.pi * k / 3) for k in range(3)]
    if t == 0: return max(Vm * mp.sin(th), 0)
    if t == 1: return abs(Vm * mp.sin(th))
    if t == 2: return max(ph)
    return max(ph) - min(ph)            # bridge: Vm is the line-to-line peak, phases are Vm/sqrt(3)
def pc_int(f):
    pts = [mp.pi * k / 6 for k in range(13)]
    return mp.quad(f, pts) / (2 * mp.pi)
def pc_rect(t, Vs, f, RL, Cf):
    Vm = math.sqrt(2) * Vs          # Vs is the RMS line-to-line voltage for the bridge (t = 3), so Vm is its line-to-line peak
    Vph = Vm / mp.sqrt(3) if t == 3 else Vm
    w = lambda th: pc_wave(t, th, Vph) if t != 3 else pc_wave(3, th, Vph)
    Vdc = pc_int(w); Vro = mp.sqrt(pc_int(lambda th: w(th) ** 2))
    def id_(th):            # current in the diode of phase a (t=2, 3) or the first diode (t=0, 1), amps
        if t == 0: return max(Vm * mp.sin(th), 0) / RL
        if t == 1: return max(Vm * mp.sin(th), 0) / RL
        ph = [Vph * mp.sin(th - 2 * mp.pi * k / 3) for k in range(3)]
        if ph[0] < max(ph[1], ph[2]): return mp.mpf(0)
        return (ph[0] if t == 2 else ph[0] - min(ph)) / RL
    Ida = pc_int(id_); Idr = mp.sqrt(pc_int(lambda th: id_(th) ** 2))
    p = [1, 2, 3, 6][t]
    PIV = {0: Vm, 1: Vm, 2: math.sqrt(3) * Vm, 3: Vm}[t]
    o = {"Vm": Vm, "Vdc": float(Vdc), "Vro": float(Vro), "Idc": float(Vdc / RL), "Pdc": float(Vdc * Vdc / RL), "er": float(Vdc ** 2 / Vro ** 2 * 100),
         "FF": float(Vro / Vdc), "RF": float(mp.sqrt((Vro / Vdc) ** 2 - 1) * 100), "fr": p * f, "PIV": PIV, "Ida": float(Ida), "Idr": float(Idr)}
    if Cf:
        fr = p * f; C = Cf * 1e-6
        g = lambda V: V - (Vm - (V / RL) / (fr * C) / 2)
        lo, hi = mp.mpf(0), mp.mpf(Vm)
        for _ in range(200):
            mid = (lo + hi) / 2
            if g(mid) > 0: hi = mid
            else: lo = mid
        Vfl = (lo + hi) / 2
        o.update({"Vfl": float(Vfl), "Ifl": float(Vfl / RL), "Vrpp": float((Vfl / RL) / (fr * C))})
    return o
def pcvec_r(t, Vs, f, RL, Cf):
    inp = {"mode": 0, "rt": t, "Vs": Vs, "f": f, "RL": RL}
    if Cf: inp["Cf"] = Cf
    add("power-electronics-converter", inp, pc_rect(t, Vs, f, RL, Cf), 1e-9)
for t_ in (0, 1, 2, 3):
    for k_ in range(6):
        Vs_ = rpc.choice([110, 230, 240, 400, 415, 690]) if t_ == 3 else rpc.choice([12, 24, 110, 230, 240, 415])
        pcvec_r(t_, Vs_, rpc.choice([50, 60, 400]), round(rpc.uniform(2, 500), 2), None if k_ % 2 == 0 else rpc.choice([100, 470, 1000, 2200, 4700, 10000]))
for a_ in ((0, 230, 50, 10, None), (1, 230, 50, 10, None), (2, 230, 50, 10, None), (3, 400, 50, 10, None), (1, 230, 50, 100, 2200), (3, 400, 50, 20, 4700)):
    pcvec_r(*a_)
def pc_four(fn, T=2 * mp.pi):          # fundamental peak of a waveform by numerical Fourier integration, breakpoints every pi/3 (all switching instants)
    pts = [mp.pi * k / 3 for k in range(7)]
    a = mp.quad(lambda th: fn(th) * mp.cos(th), pts) / mp.pi; b = mp.quad(lambda th: fn(th) * mp.sin(th), pts) / mp.pi
    return mp.sqrt(a * a + b * b)
def pc_inv(it, Vd, ma, fo):
    sq = lambda th: 1 if mp.sin(th) > 0 else -1
    pole = lambda k: (lambda th: Vd / 2 * sq(th - 2 * mp.pi * k / 3))
    rms = lambda fn: mp.sqrt(mp.quad(lambda th: fn(th) ** 2, [mp.pi * k / 3 for k in range(7)]) / (2 * mp.pi))
    o = {}
    if it == 0:
        v = lambda th: Vd * sq(th); V1 = pc_four(v) / mp.sqrt(2); Vot = rms(v)
        o = {"V1": float(V1), "Vot": float(Vot), "THD": float(mp.sqrt(Vot ** 2 - V1 ** 2) / V1 * 100)}
    elif it == 2:
        vll = lambda th: pole(0)(th) - pole(1)(th); vph = lambda th: (2 * pole(0)(th) - pole(1)(th) - pole(2)(th)) / 3
        V1 = pc_four(vll) / mp.sqrt(2); Vot = rms(vll)
        o = {"V1": float(V1), "V1p": float(pc_four(vph) / mp.sqrt(2)), "Vot": float(Vot), "THD": float(mp.sqrt(Vot ** 2 - V1 ** 2) / V1 * 100)}
    elif it == 1:
        pa = mp.mpf(ma) * Vd / 2; V1 = abs(pa - (-pa)) / mp.sqrt(2); o = {"V1": float(V1)}
    else:
        pa = mp.mpf(ma) * Vd / 2; Va = mp.mpc(pa, 0); Vb = pa * mp.expjpi(mp.mpf(-2) / 3)
        V1 = abs(Va - Vb) / mp.sqrt(2); o = {"V1": float(V1), "V1p": float(abs(Va) / mp.sqrt(2))}
    o["ut"] = o["V1"] / Vd
    if fo: o["vf"] = o["V1"] / fo
    return o
def pcvec_i(it, Vd, ma, fo):
    inp = {"mode": 1, "it": it, "Vd": Vd, "fo": fo}
    if ma is not None: inp["ma"] = ma
    add("power-electronics-converter", inp, pc_inv(it, Vd, ma, fo), 1e-9)
for it_ in (0, 1, 2, 3, 4):
    for _ in range(5):
        lim_ = {1: 1.0, 3: 1.0, 4: 2 / math.sqrt(3)}.get(it_)
        pcvec_i(it_, rpc.choice([12, 24, 48, 311, 325, 540, 600, 750, 1100]), None if lim_ is None else round(rpc.uniform(0.1, lim_), 3), rpc.choice([25, 50, 60, 87]))
for a_ in ((3, 600, 0.9, 50), (4, 600, 1.1547, 50), (3, 540, 1.0, 50), (0, 300, None, 50), (2, 600, None, 50), (1, 400, 1.0, 50)):
    pcvec_i(*a_)
def pc_dc(tp, Vin, Vo, Io, fk, rl, rv, eta):
    Vin_, Vo_, Io_, fs_, r_, v_, e_ = (Fraction(str(x)) for x in (Vin, Vo, Io, fk * 1000, rl / 100, rv / 100, eta / 100))
    if tp == 0: D = Vo_ / Vin_; IL = Io_
    elif tp == 1: D = (Vo_ - Vin_) / Vo_; IL = Io_ / (1 - D)
    else: D = Vo_ / (Vin_ + Vo_); IL = Io_ / (1 - D)
    dIL = r_ * IL; dV = v_ * Vo_
    if tp == 0:
        L = (Vin_ - Vo_) * D / (fs_ * dIL)
        dQ = Fraction(1, 2) * (1 / (2 * fs_)) * (dIL / 2); C = dQ / dV
    else:
        L = Vin_ * D / (fs_ * dIL); C = Io_ * D / (fs_ * dV)
    Vst = Vin_ if tp == 0 else (Vo_ if tp == 1 else Vin_ + Vo_); Pout = Vo_ * Io_; Pin = Pout / e_
    return {"D": float(D), "IL": float(IL), "dIL": float(dIL), "Ipk": float(IL + dIL / 2), "Lm": float(L) * 1e6, "Cm": float(C) * 1e6, "Vst": float(Vst), "Iin": float(Pin / Vin_), "Pl": float(Pin - Pout)}
def pcvec_d(tp, Vin, Vo, Io, fk, rl, rv, eta):
    add("power-electronics-converter", {"mode": 2, "tp": tp, "Vin": Vin, "Vout": Vo, "Iout": Io, "fsw": fk, "rl": rl, "rv": rv, "eta": eta}, nz(pc_dc(tp, Vin, Vo, Io, fk, rl, rv, eta)), 1e-9)
for tp_ in (0, 1, 2):
    for _ in range(8):
        Vin_ = rpc.choice([5, 12, 24, 48, 110, 311]); Vo_ = round(Vin_ * rpc.uniform(0.15, 0.8), 2) if tp_ == 0 else round(Vin_ * rpc.uniform(1.3, 5.5), 2) if tp_ == 1 else round(Vin_ * rpc.uniform(0.3, 2.5), 2)
        pcvec_d(tp_, Vin_, Vo_, round(rpc.uniform(0.2, 40), 2), rpc.choice([20, 50, 100, 200, 500, 1000]), rpc.choice([10, 20, 30, 40, 60, 100]), rpc.choice([0.5, 1, 2, 5]), rpc.choice([100, 98, 95, 90, 85]))
for a_ in ((0, 48, 12, 5, 100, 30, 1, 95), (1, 12, 48, 2, 100, 30, 1, 95), (2, 24, 12, 3, 100, 30, 1, 95), (0, 12, 5, 2, 500, 20, 1, 100)):
    pcvec_d(*a_)


# v1.80.2: 1 and 2 kW CCR sizes (FAA AC 150/5345-10H, clause 1.2.4), boundary cases appended so the earlier vectors keep their random streams
for k in CCR_LIST[:2]:
    ccr_case(k * 1000 - 1)
    ccr_case(k * 1000 - 1 + 10)


# --- v1.81.0: plant-load-flow (own stream, so earlier vectors are unchanged) ---
# Reference route (no closed-form loss formulas): each group's complex power is built from its power angle (S = P / pf, Q = S sin(acos pf)),
# the groups are added as complex numbers and scaled by the coincidence factor, the capacitor is a -jQc injection, and the transformer is an
# equivalent circuit in per unit on its own rating: series Z = r + jx with r = Pcu / St and x = sqrt(uk^2 - r^2) carrying the load current
# I = |S bus| / St (loss = I^2 Z St), and a shunt Y = g + jb at 1 pu voltage with g = P0 / St and b = sqrt(i0^2 - g^2) (loss = Y St).
# The extra capacitor is the utility reactive power minus Pu tan(acos pft), floored at zero.
rpl = random.Random(20261129)
def pl_ref(d):
    mp.mp.dps = 30
    St = mp.mpf(d["St"]) * 1000
    grp = []
    for k in (1, 2, 3, 4):
        P = mp.mpf(d["Pc%d" % k]) * 1000 * mp.mpf(d["df%d" % k]); f = mp.mpf(d["pf%d" % k])
        grp.append(mp.mpc(P, P / f * mp.sin(mp.acos(f))))
    tot = sum(grp) * mp.mpf(d["kc"]); bus = tot - 1j * mp.mpf(d["Qc"]) * 1000
    xpu = abs(bus) / St; uk = mp.mpf(d["uk"]) / 100; r = mp.mpf(d["Pcu"]) * 1000 / St; xl = mp.sqrt(uk ** 2 - r ** 2)
    g = mp.mpf(d["P0"]) * 1000 / St; i0 = mp.mpf(d["i0"]) / 100; b = mp.sqrt(i0 ** 2 - g ** 2)
    loss = xpu ** 2 * mp.mpc(r, xl) * St + mp.mpc(g, b) * St; util = bus + loss
    o = {}
    for k, z in enumerate(grp, 1): o["P%d" % k] = z.real / 1000; o["S%d" % k] = abs(z) / 1000
    o.update(Pd=tot.real / 1000, Qd=tot.imag / 1000, pfd=tot.real / abs(tot), Qn=bus.imag / 1000, Sn=abs(bus) / 1000, pfn=bus.real / abs(bus),
             In=abs(bus) / (mp.sqrt(3) * mp.mpf(d["Vs"])), x=xpu * 100, Sp=(St - abs(bus)) / 1000, Pl=loss.real / 1000, Ql=loss.imag / 1000,
             Pu=util.real / 1000, Qu=util.imag / 1000, Su=abs(util) / 1000, pfu=util.real / abs(util), Iu=abs(util) / (mp.sqrt(3) * mp.mpf(d["Vh"]) * 1000),
             Qx=max(util.imag - util.real * mp.tan(mp.acos(mp.mpf(d["pft"]))), 0) / 1000)
    return {k: float(v) for k, v in o.items()}
def pl_case(d): add("plant-load-flow", d, nz(pl_ref(d)), 1e-9)
def pl_rand(cap_frac=None, kc=None, zero=()):
    St_ = rpl.choice([250, 400, 500, 630, 800, 1000, 1250, 1600, 2000]); d = {"Vs": rpl.choice([400, 415, 433, 690]), "Vh": rpl.choice([6.6, 11, 22, 33]), "St": St_,
        "uk": rpl.choice([4, 4.5, 5, 6, 6.25, 7]), "Pcu": round(St_ * rpl.uniform(0.007, 0.014), 3), "P0": round(St_ * rpl.uniform(0.001, 0.0025), 3), "i0": round(rpl.uniform(0.5, 2.0), 2)}
    for k in (1, 2, 3, 4):
        d["Pc%d" % k] = 0 if k in zero else round(St_ * rpl.uniform(0.05, 0.5), 1); d["df%d" % k] = round(rpl.uniform(0.3, 1.0), 2); d["pf%d" % k] = round(rpl.uniform(0.6, 1.0), 2)
    d["kc"] = kc if kc is not None else round(rpl.uniform(0.6, 1.0), 2); d["pft"] = rpl.choice([0.9, 0.92, 0.95, 0.98, 1.0])
    Qd_ = float(sum(mp.mpf(d["Pc%d" % k]) * mp.mpf(d["df%d" % k]) * mp.tan(mp.acos(mp.mpf(d["pf%d" % k]))) for k in (1, 2, 3, 4)) * mp.mpf(d["kc"]))
    d["Qc"] = round(Qd_ * (cap_frac if cap_frac is not None else rpl.uniform(0, 1.3)), 1)
    return d
for _ in range(30): pl_case(pl_rand())
for _ in range(6): pl_case(pl_rand(cap_frac=0, zero=(rpl.choice([2, 3, 4]),)))
for _ in range(4): pl_case(pl_rand(cap_frac=1.5, kc=1))
for _ in range(2): pl_case(pl_rand(cap_frac=0.5, zero=(2, 3, 4)))


# --- v1.81.1 work: thevenin-norton (own stream, earlier vectors unchanged) ---
# Divider case: the whole circuit (source, R1, node A with R2 to common, R3, node B with RL to common) is solved by nodal analysis in exact fractions;
# Voc comes from the same circuit with RL open, Isc from RL shorted, Rth = Voc / Isc, and the maximum power from a numerical search over RL on the real circuit.
# Measured case: the Norton source Isc in parallel with G = Isc / Voc feeds RL (a different route from the Thevenin divider).
from fractions import Fraction as Fr
rth = random.Random(20261130)
def th_solve(Vs, R1, R2, R3, RL):
    """node voltages (Va, VL) of the divider circuit; RL None = open, RL 0 = short"""
    Vs, R1, R2, R3 = map(Fr, (Vs, R1, R2, R3))
    if R3 == 0:
        g = 1 / R1 + 1 / R2 + (0 if RL is None else (1 / Fr(RL) if RL != 0 else 0))
        Va = Vs / R1 / g; VL = Va if RL != 0 else Fr(0)
        return Va, VL
    if RL is None:
        Va = (Vs / R1) / (1 / R1 + 1 / R2); return Va, Va
    if RL == 0:
        Va = (Vs / R1) / (1 / R1 + 1 / R2 + 1 / R3); return Va, Fr(0)
    RL = Fr(RL); g1 = 1 / R1 + 1 / R2 + 1 / R3; g3 = 1 / R3; g4 = 1 / R3 + 1 / RL
    det = g1 * g4 - g3 * g3; Va = (Vs / R1) * g4 / det; VL = g3 * (Vs / R1) / det
    return Va, VL
def th_vec(Vs, R1, R2, R3, RL):
    Voc = th_solve(Vs, R1, R2, R3, None)[1]
    if R3 == 0: Isc = Fr(Vs) / Fr(R1)
    else: Isc = th_solve(Vs, R1, R2, R3, 0)[0] / Fr(R3)
    Rt = Voc / Isc
    VL = th_solve(Vs, R1, R2, R3, RL)[1]; IL = VL / Fr(RL) if RL else Isc if R3 == 0 else th_solve(Vs, R1, R2, R3, 0)[0] / Fr(R3)
    lo, hi = 1e-6, float(Rt) * 1000
    def pw(x): v = float(th_solve(Vs, R1, R2, R3, Fr(x))[1]); return v * v / x
    for _ in range(300):
        m1 = lo + (hi - lo) / 3; m2 = hi - (hi - lo) / 3
        if pw(m1) < pw(m2): lo = m1
        else: hi = m2
    Pm = pw((lo + hi) / 2)
    return {"Vth": float(Voc), "Rth": float(Rt), "In": float(Isc), "IL": float(IL), "VL": float(VL), "PL": float(VL * IL), "Pm": Pm, "eta": float(VL / Voc * 100)}
for _ in range(25):
    Vs_ = round(rth.uniform(1, 480), 2); R1_, R2_, R3_ = [round(rth.uniform(0.5, 300), 2) for _ in range(3)]; RL_ = round(rth.uniform(0.2, 500), 2)
    add("thevenin-norton", {"mode": 0, "Vs": Vs_, "R1": R1_, "R2": R2_, "R3": R3_, "RL": RL_}, th_vec(Vs_, R1_, R2_, R3_, RL_), 1e-7)
for a_ in ((12, 4, 12, 2, 10), (10, 6, 3, 0, 4), (230, 50, 100, 25, 1), (5, 1000, 0.5, 0.1, 100), (48, 7, 9, 0, 0.5)):
    add("thevenin-norton", dict(zip(("Vs", "R1", "R2", "R3", "RL"), a_), mode=0), th_vec(*a_), 1e-7)
for _ in range(10):
    Voc_ = round(rth.uniform(1, 500), 2) * rth.choice([1, -1]); Isc_ = round(rth.uniform(0.01, 50), 3) * (1 if Voc_ > 0 else -1); RL_ = round(rth.uniform(0.1, 800), 2)
    Voc_f, Isc_f, G_ = Fr(Voc_), Fr(Isc_), Fr(Isc_) / Fr(Voc_); VL_ = Isc_f / (G_ + 1 / Fr(RL_)); IL_ = VL_ / Fr(RL_); Rt_ = 1 / G_
    add("thevenin-norton", {"mode": 1, "Voc": Voc_, "Isc": Isc_, "RL": RL_}, {"Vth": Voc_, "Rth": float(Rt_), "In": Isc_, "IL": float(IL_), "VL": float(VL_), "PL": float(VL_ * IL_), "Pm": float(Voc_f * Voc_f * G_ / 4), "eta": float(VL_ / Voc_f * 100)}, 1e-9)

# --- v1.82.0 work: transformer-vector-group (own stream, earlier vectors unchanged) ---
# Written from phasors and per-phase power, not from the engine's formulas.
# Clock numbers are the nameplate convention (low side lags by 30 degrees per hour). Winding voltage is found from the line-voltage phasors
# (delta: the winding carries the line phasor; star: Van = (Vab - Vca) / 3). Winding current comes from per-phase power, Iw = (S / 3) / Vw,
# and line current from S = sqrt(3) V I. The phase difference and the open-link voltage come from the two low-side line phasors, |VL1 - VL2|.
import cmath
rvg = random.Random(20261201)
VGT = [("D", "Y", 11), ("D", "Y", 1), ("D", "Y", 5), ("Y", "D", 1), ("Y", "D", 11), ("Y", "Y", 0), ("Y", "Y", 6), ("D", "D", 0), ("D", "D", 6)]
def vg_wind(kind, VL):
    """winding voltage magnitude from the three line-voltage phasors of a balanced set"""
    vab = cmath.rect(VL, 0); vbc = cmath.rect(VL, -2 * math.pi / 3); vca = cmath.rect(VL, 2 * math.pi / 3)
    if kind == "D": return abs(vab)
    van = (vab - vca) / 3
    return abs(van)
def vg_vec(g, Vh, Vl, S, g2):
    hk, lk, c = VGT[g]
    Vhw, Vlw = vg_wind(hk, Vh), vg_wind(lk, Vl)
    out = {"a": Vh / Vl, "n": Vhw / Vlw, "clock": c, "ang": c * 30, "Vhw": Vhw, "Vlw": Vlw,
           "Ih": S / (math.sqrt(3) * Vh), "Il": S / (math.sqrt(3) * Vl), "Ihw": (S / 3) / Vhw, "Ilw": (S / 3) / Vlw}
    if g2 != 9:
        c2 = VGT[g2][2]; p1 = cmath.rect(1, -math.radians(30 * c)); p2 = cmath.rect(1, -math.radians(30 * c2))
        out["dang"] = abs(math.degrees(cmath.phase(p1 / p2))); out["dv"] = abs(p1 - p2) * 100
        if out["dang"] > 179.999999: out["dang"] = 180.0
        if abs(out["dang"]) < 1e-9: out["dang"] = 0.0
    return out
def vg_case(g, Vh, Vl, S, g2):
    # inputs are given in the calculator's default units (Vh in kV, Vl in V, S in kVA); the expected values are worked in V, VA and A
    add("transformer-vector-group", {"grp": g, "Vh": Vh / 1000, "Vl": Vl, "S": S / 1000, "grp2": g2}, vg_vec(g, Vh, Vl, S, g2), 1e-7)
for g in range(9):
    for _ in range(3):
        Vh_ = round(rvg.choice([3300, 6600, 11000, 22000, 33000, 66000, 132000]) * rvg.uniform(0.95, 1.05), 1); Vl_ = round(rvg.choice([230, 400, 415, 433, 690, 3300, 6600]) * rvg.uniform(0.95, 1.05), 1)
        S_ = round(rvg.uniform(50, 80000), 1) * 1000
        vg_case(g, Vh_, Vl_, S_, 9)
for g in range(9):
    for g2 in rvg.sample(range(9), 3):
        vg_case(g, 11000, 415, round(rvg.uniform(100, 5000), 1) * 1000, g2)
for g, g2 in ((0, 1), (0, 4), (0, 2), (3, 1), (5, 6), (7, 8), (0, 0)):
    vg_case(g, 11000, 415, 1000000, g2)

# --- v1.83.0 work: relay-setting (own stream, earlier vectors unchanged) ---
# Written from the IEC 60255-151 operating equation t = TMS k / ((I/Is)^a - 1) at 40 digits (mpmath). The TMS is found by root-finding on t(TMS) = target,
# not by rearranging the formula, and the setting is the next relay step ABOVE the exact TMS (exact decimal ceiling, never rounded down), capped at the relay maximum.
from mpmath import mp as _mp, mpf as _mf, findroot as _fr
_mp.dps = 40
rrs = random.Random(20261202)
RS_K = [(_mf("0.14"), _mf("0.02")), (_mf(13.5), _mf(1)), (_mf(80), _mf(2)), (_mf(120), _mf(1))]
def rs_vec(c, IL, ctp, cts, kpu, Imax, Imin, tt, Id, ki, step="0.025", tmx="1.5"):
    k, a = RS_K[c]; IL_, ctp_, kpu_, Imax_, Imin_, tt_, Id_, ki_ = map(lambda x: _mf(str(x)), (IL, ctp, kpu, Imax, Imin, tt, Id, ki))
    Is = kpu_ * IL_; M = Imax_ / Is; Mm = Imin_ / Is
    tof = lambda tms: tms * k / (M ** a - 1)
    tms = _fr(lambda x: tof(x) - tt_, _mf("0.1"))
    st = (Decimal(str(float(tms))) / Decimal(str(step))).to_integral_value(rounding=ROUND_CEILING)
    tup = max(_mf(str(step)), _mf(str(st * Decimal(str(step)))))
    tset = min(tup, _mf(str(tmx)))
    out = {"Is": float(Is), "Iss": float(Is / ctp_ * cts), "plug": float(Is / ctp_ * 100), "M": float(M), "TMS": float(tms), "TMSs": float(tset), "tset": float(tof(tset)),
           "Mmin": float(Mm), "Ihs": float(ki_ * Id_), "Ihss": float(ki_ * Id_ / ctp_ * cts)}
    dd = tof(tset) - tt_
    if abs(dd) > _mf("1e-9"): out["tdiff"] = float(dd)
    if Mm > 1: out["tmin"] = float(tset * k / (Mm ** a - 1))
    return out
def rs_case(c, IL, ctp, cts, kpu, Imax, Imin, tt, Id, ki, step="0.025", tmx="1.5"):
    add("relay-setting", {"curve": c, "IL": IL, "ctp": ctp, "cts": cts, "kpu": kpu, "Ifmax": Imax, "Ifmin": Imin, "tt": tt, "tstep": float(step), "tmax": float(tmx), "Ifd": Id, "ki": ki}, rs_vec(c, IL, ctp, cts, kpu, Imax, Imin, tt, Id, ki, step, tmx), 1e-7)
for _ in range(40):
    c_ = rrs.randrange(4); IL_ = round(rrs.uniform(20, 800), 1); ctp_ = rrs.choice([100, 150, 200, 300, 400, 600, 800, 1000, 1200]); cts_ = rrs.choice([1, 5]); kpu_ = round(rrs.uniform(1, 1.6), 2)
    Is_ = IL_ * kpu_; Imax_ = round(Is_ * rrs.uniform(3, 60), 1); Imin_ = round(Is_ * rrs.uniform(0.7, 9), 1); tt_ = round(rrs.uniform(0.1, 2.0), 2); Id_ = round(Imax_ * rrs.uniform(0.2, 0.9), 1); ki_ = round(rrs.uniform(1.1, 1.6), 2)
    st_ = rrs.choice(["0.025", "0.025", "0.05", "0.01", "0.125"]); tx_ = rrs.choice(["1.5", "1.5", "3", "10"])
    rs_case(c_, IL_, ctp_, cts_, kpu_, Imax_, Imin_, tt_, Id_, ki_, st_, tx_)
for a_ in ((0, 200, 300, 1, 1.3, 4000, 1200, 0.4, 2500, 1.3), (0, 100, 100, 1, 1, 500, 150, 0.8559, 400, 1.3), (1, 150, 200, 5, 1.2, 6000, 900, 0.6, 3000, 1.25), (2, 80, 100, 1, 1.1, 3000, 500, 0.8, 1500, 1.3), (3, 120, 200, 5, 1.25, 5000, 800, 1.2, 2000, 1.3), (0, 200, 300, 1, 1.3, 4000, 250, 0.4, 2500, 1.3)):
    rs_case(*a_)
# v1.99.12: relay step and maximum are inputs; the TMS is rounded UP to the step. The default case on a 0.05 step, on a 0.01 step, and a case where the exact TMS is above the relay maximum.
rs_case(0, 200, 300, 1, 1.3, 4000, 1200, 0.4, 2500, 1.3, "0.05", "1.5")
rs_case(0, 200, 300, 1, 1.3, 4000, 1200, 0.4, 2500, 1.3, "0.01", "1.5")
rs_case(2, 80, 100, 1, 1.1, 3000, 500, 0.8, 1500, 1.3, "0.025", "1.5")

# --- v1.84.0 work: relay-coordination (own stream, earlier vectors unchanged) ---
# Written from the IEC 60255-151 operating equation t = TMS k / ((I/Is)^a - 1) at 40 digits (mpmath). The upstream TMS is found by root-finding on
# t_up(TMS) = t_down + margin, not by rearranging the formula, and the setting is the next 0.025 above it, by exact decimal rounding (ceiling).
rrc = random.Random(20261213)
def rc_vec(cd, Isd, TMSd, cu, Isu, If, Ifl, tm):
    kd, ad = RS_K[cd]; ku, au = RS_K[cu]; Isd_, TMSd_, Isu_, If_, Ifl_, tm_ = map(lambda x: _mf(str(x)), (Isd, TMSd, Isu, If, Ifl, tm))
    tdf = lambda M: TMSd_ * kd / (M ** ad - 1)
    td = tdf(If_ / Isd_)
    tuf = lambda tms, M: tms * ku / (M ** au - 1)
    tms = _fr(lambda x: tuf(x, If_ / Isu_) - (td + tm_), _mf("0.1"))
    st = (Decimal(str(float(tms))) / Decimal("0.025")).to_integral_value(rounding=ROUND_CEILING)
    tset = max(_mf("0.025"), _mf(str(st * Decimal("0.025"))))
    tu = tuf(tset, If_ / Isu_)
    out = {"Md": float(If_ / Isd_), "td": float(td), "treq": float(td + tm_), "Mu": float(If_ / Isu_), "TMSu": float(tms), "TMSus": float(tset), "tu": float(tu), "marg": float(tu - td),
           "Mdl": float(Ifl_ / Isd_), "Mul": float(Ifl_ / Isu_)}
    if Ifl_ / Isd_ > 1: out["tdl"] = float(tdf(Ifl_ / Isd_))
    if Ifl_ / Isu_ > 1: out["tul"] = float(tuf(tset, Ifl_ / Isu_))
    if "tdl" in out and "tul" in out: out["margl"] = out["tul"] - out["tdl"]
    return out
def rc_case(cd, Isd, TMSd, cu, Isu, If, Ifl, tm):
    add("relay-coordination", {"cd": cd, "Isd": Isd, "TMSd": TMSd, "cu": cu, "Isu": Isu, "If": If, "Ifl": Ifl, "tm": tm}, rc_vec(cd, Isd, TMSd, cu, Isu, If, Ifl, tm), 1e-7)
for _ in range(40):
    cd_ = rrc.randrange(4); cu_ = rrc.randrange(4); Isd_ = round(rrc.uniform(20, 600), 1); Isu_ = round(Isd_ * rrc.uniform(1.1, 2.2), 1); TMSd_ = round(rrc.uniform(0.05, 1.0), 3)
    If_ = round(max(Isd_, Isu_) * rrc.uniform(3, 60), 1); Ifl_ = round(max(Isd_, Isu_) * rrc.uniform(0.7, 9), 1); tm_ = round(rrc.uniform(0.2, 0.6), 2)
    rc_case(cd_, Isd_, TMSd_, cu_, Isu_, If_, Ifl_, tm_)
for a_ in ((0, 200, 0.1, 0, 300, 4000, 1000, 0.4), (0, 200, 0.1, 1, 300, 4000, 1000, 0.4), (2, 150, 0.15, 0, 250, 5000, 600, 0.35), (1, 100, 0.2, 0, 160, 3000, 500, 0.4),
           (0, 200, 0.1, 0, 300, 4000, 250, 0.4), (0, 300, 0.2, 0, 150, 4000, 400, 0.4)):
    rc_case(*a_)

# --- v1.85.0 work: ct-burden (own stream, earlier vectors unchanged) ---
# Written from the CT burden formulas (lead loop resistance, S = Is^2 R, ALF' = ALF (Sn + Sct) / (S + Sct)) at 40 digits (mpmath), with exact rational
# arithmetic for the rated-burden and lead-length solution (the longest lead cable is checked by putting it back: S(Lmax) must equal Sn).
from fractions import Fraction as _Fr
rcb = random.Random(20261214)
def cb_vec(Is, Sn, ALF, Rct, L, A, rho, T, al, conn, Sr, Sm, Rc, If, Ip):
    F = lambda x: _Fr(str(x))
    Is_, Sn_, ALF_, Rct_, L_, A_, rho_, T_, al_, Sr_, Sm_, Rc_, If_, Ip_ = map(F, (Is, Sn, ALF, Rct, L, A, rho, T, al, Sr, Sm, Rc, If, Ip))
    kt = 1 + al_ * (T_ - 20); RL = rho_ * kt * conn * L_ / A_; Rr = Sr_ / Is_ ** 2; Rm = Sm_ / Is_ ** 2; Rt = RL + Rr + Rm + Rc_; S = Is_ ** 2 * Rt
    Sct = Is_ ** 2 * Rct_; ALFa = ALF_ * (Sn_ + Sct) / (S + Sct); ALFr = If_ / Ip_; Rmax = Sn_ / Is_ ** 2 - Rr - Rm - Rc_
    out = {"RL": float(RL), "Rr": float(Rr), "Rm": float(Rm), "Rt": float(Rt), "S": float(S), "use": float(S / Sn_ * 100), "Smar": float(Sn_ - S), "Sct": float(Sct),
           "ALFa": float(ALFa), "ALFr": float(ALFr), "ALFm": float(ALFa / ALFr), "Rmax": float(Rmax)}
    if Rmax > 0:
        Lm = Rmax * A_ / (rho_ * kt * conn); out["Lmax"] = float(Lm)
        assert Is_ ** 2 * (rho_ * kt * conn * Lm / A_ + Rr + Rm + Rc_) == Sn_
    return out
def cb_case(*a):
    Is, Sn, ALF, Rct, L, A, rho, T, al, conn, Sr, Sm, Rc, If, Ip = a
    add("ct-burden", {"Is": Is, "Sn": Sn, "ALF": ALF, "Rct": Rct, "L": L, "A": A, "rho": rho, "T": T, "alpha": al, "conn": conn, "Srelay": Sr, "Smeter": Sm, "Rc": Rc, "Ifmax": If, "Ip": Ip}, cb_vec(*a), 1e-9)
for _ in range(40):
    Is_ = rcb.choice([1, 5]); Sn_ = rcb.choice([2.5, 5, 10, 15, 20, 30, 45]); ALF_ = rcb.choice([5, 10, 15, 20, 30]); Rct_ = round(rcb.uniform(0.05, 0.6) * (1 if Is_ == 5 else 10), 3)
    L_ = round(rcb.uniform(5, 400), 1); A_ = rcb.choice([1.5, 2.5, 4, 6, 10]); mat = rcb.choice([(0.017241, 0.00393), (0.02826, 0.00403)]); T_ = rcb.choice([20, 30, 55, 75]); conn_ = rcb.choice([1, 2])
    Sr_ = round(rcb.uniform(0.05, 4), 2); Sm_ = round(rcb.uniform(0, 3), 2); Rc_ = round(rcb.uniform(0, 0.2), 3); Ip_ = rcb.choice([100, 200, 400, 800, 1600]); If_ = round(Ip_ * rcb.uniform(3, 40), 0)
    cb_case(Is_, Sn_, ALF_, Rct_, L_, A_, mat[0], T_, mat[1], conn_, Sr_, Sm_, Rc_, If_, Ip_)
for a_ in ((5, 30, 20, 0.2, 50, 2.5, 0.017241, 20, 0.00393, 2, 2, 1, 0.05, 4000, 400), (5, 10, 20, 0.2, 50, 2.5, 0.0172, 20, 0.00393, 2, 2, 0, 0, 4000, 400), (1, 10, 20, 0.2, 50, 2.5, 0.0172, 20, 0.00393, 2, 2, 0, 0, 4000, 400),
           (5, 30, 20, 0.2, 50, 2.5, 0.017241, 20, 0.00393, 1, 2, 1, 0.05, 4000, 400), (5, 30, 20, 0.2, 50, 2.5, 0.017241, 75, 0.00393, 2, 2, 1, 0.05, 4000, 400), (5, 15, 10, 0.3, 50, 2.5, 0.017241, 20, 0.00393, 2, 2, 1, 0.05, 12000, 400),
           (1, 30, 20, 0.2, 10, 4, 0.017241, 20, 0.00393, 2, 1, 0, 0, 2000, 400), (5, 5, 20, 0.2, 50, 2.5, 0.017241, 20, 0.00393, 2, 3, 2, 0.1, 4000, 400)):
    cb_case(*a_)

# --- v1.86.0 work: busbar-sizing (own stream, earlier vectors unchanged) ---
# Written from the busbar formulas in exact rational arithmetic, without reading the engine: A = I / J, n = ceil(A / Ab), A_fault = Isc sqrt(t) / k,
# installed bars n = max of the two, J actual = I / (n Ab), withstand = n Ab k / sqrt(t), mass = n Ab rho_m, R = rho (1 + alpha (T - 20)) / (n Ab), P = I^2 R.
# The fault area is compared as a square so no irrational number enters the rounding: n_fault = ceil(sqrt(Isc^2 t / k^2) / Ab) is found by the smallest integer
# n whose (n Ab k)^2 >= Isc^2 t, which is exact.
import math as _m
rbb = random.Random(20261215)
def bb_vec(mat, I_, J_, w_, th_, Isc_, t_, k_, T_):
    F = lambda x: _Fr(str(x))
    I, J, w, th, Isc, t, k, T = map(F, (I_, J_, w_, th_, Isc_, t_, k_, T_))
    Isc = Isc * 1000                              # the input is in kA, the formula takes amperes
    rho, al, dm = (_Fr("0.02826"), _Fr("0.00403"), 2700) if mat == 2 else (_Fr("0.017241"), _Fr("0.00393"), 8960)
    Ab = w * th                                   # mm^2 (w, th in mm)
    Areq = I / J
    nL = -((-Areq) // Ab)                         # exact ceiling
    nS = 1
    while (nS * Ab * k) ** 2 < Isc ** 2 * t: nS += 1
    n = max(nL, nS)
    Ain = n * Ab
    Asc = float(Isc) * _m.sqrt(float(t)) / float(k)  # mm^2 (A * sqrt(s) / (A sqrt(s) / mm^2))
    out = {"Areq": float(Areq), "Ab": float(Ab), "nL": int(nL), "Asc": Asc, "nS": int(nS), "n": int(n), "Ain": float(Ain), "Jact": float(I / Ain),
           "Iw": float(Ain * k / _Fr(_m.sqrt(float(t)))) / 1000, "scm": float(Ain) / Asc, "mpm": float(Ain * dm / 10**6),
           "Rm": float(rho * (1 + al * (T - 20)) / Ain * 1000), "Pm": float(I ** 2 * rho * (1 + al * (T - 20)) / Ain)}
    return out
def bb_case(*a):
    mat, I, J, w, th, Isc, t, k, T = a
    add("busbar-sizing", {"mat": mat, "I": I, "J": J, "w": w, "th": th, "Isc": Isc, "tsc": t, "k": k, "T": T}, bb_vec(*a), 1e-9)
for _ in range(40):
    mat_ = rbb.choice([1, 2]); w_ = rbb.choice([20, 25, 30, 40, 50, 60, 80, 100, 120]); th_ = rbb.choice([3, 5, 6, 8, 10, 12]); I_ = round(rbb.uniform(100, 5000), 0)
    J_ = round(rbb.uniform(0.6, 2.5), 2); Isc_ = round(rbb.uniform(5, 80), 1); t_ = rbb.choice([0.1, 0.2, 0.5, 1, 1.5, 3]); k_ = rbb.choice([76, 94, 115, 143, 159]); T_ = rbb.choice([20, 35, 65, 85, 105])
    bb_case(mat_, I_, J_, w_, th_, Isc_, t_, k_, T_)
for a_ in ((1, 2000, 1.2, 100, 10, 40, 0.5, 115, 65), (1, 1000, 1.2, 100, 10, 10, 1, 115, 20), (2, 1000, 1.2, 100, 10, 10, 1, 76, 20), (1, 300, 1.2, 50, 5, 50, 1, 115, 65),
           (1, 600, 1.2, 50, 5, 50, 1, 115, 65), (2, 3200, 0.9, 120, 10, 65, 1, 76, 85)):
    bb_case(*a_)

# --- v1.87.0 work: ac-dc-equivalent (own stream, earlier vectors unchanged) ---
# Written from the definitions, not from the engine: rms = sqrt(mean of v^2 over a period) and average = mean of |v| over a period. The mean squares and mean absolute
# values below are the closed forms of those integrals (sine 1/2 and 2/pi; square 1 and 1; triangle 1/3 and 1/2; full-wave rectified 1/2 and 2/pi; half-wave rectified 1/4
# and 1/pi, all times Vp^2 or Vp). Before use, each closed form is checked against a midpoint-rule integral of the waveform itself (20,000 samples) to 1e-6.
rac = random.Random(20261216)
def _wf(kind, x):                                     # x in [0, 1) is the position in the period; unit peak
    if kind == 1: return math.sin(2 * math.pi * x)
    if kind == 2: return 1.0 if x < 0.5 else -1.0
    if kind == 3: return 4 * x - 1 if x < 0.5 else 3 - 4 * x
    if kind == 4: return abs(math.sin(2 * math.pi * x))
    return max(math.sin(2 * math.pi * x), 0.0)
_MS = {1: 1 / 2, 2: 1.0, 3: 1 / 3, 4: 1 / 2, 5: 1 / 4}; _MA = {1: 2 / math.pi, 2: 1.0, 3: 1 / 2, 4: 2 / math.pi, 5: 1 / math.pi}
for _k in range(1, 6):
    _n = 20000; _xs = [(j + 0.5) / _n for j in range(_n)]
    assert abs(sum(_wf(_k, x) ** 2 for x in _xs) / _n - _MS[_k]) < 1e-6 and abs(sum(abs(_wf(_k, x)) for x in _xs) / _n - _MA[_k]) < 1e-6, _k
def ac_vec(wave, given, X, R):
    rf, af = math.sqrt(_MS[wave]), _MA[wave]
    Vp = X if given == 1 else X / rf if given == 2 else X / af
    Vrms, Vavg = rf * Vp, af * Vp
    Vm = 1.1107207345395915 * Vavg                    # pi / (2 sqrt 2), the factor that makes the meter read a sine correctly
    return {"Vp": Vp, "Vrms": Vrms, "Vavg": Vavg, "ff": Vrms / Vavg, "cf": Vp / Vrms, "Irms": Vrms / R, "P": Vrms ** 2 / R, "Ppk": Vp ** 2 / R,
            "pr": (Vp / Vrms) ** 2, "Vm": Vm, "me": (Vm / Vrms - 1) * 100}
def ac_case(*a):
    wave, given, X, R = a
    add("ac-dc-equivalent", {"wave": wave, "given": given, "X": X, "R": R}, ac_vec(*a), 1e-9)
for _ in range(40):
    ac_case(rac.randrange(1, 6), rac.randrange(1, 4), round(rac.uniform(1, 700), 2), round(rac.uniform(0.5, 500), 2))
for a_ in ((1, 1, 325, 10), (1, 2, 230, 10), (2, 2, 100, 10), (3, 2, 100, 10), (5, 3, 100, 10), (4, 1, 100, 10)):
    ac_case(*a_)


# --- v1.88.0 work: kirchhoff-solver (own stream, earlier vectors unchanged) ---
# Written by the node-voltage route in exact fractions, not by the Kirchhoff equations the engine solves: the voltage of the top node A is found from the sum of the
# branch currents being zero, VA = (E1/R1 + E2/R2 + E3/R3) / (1/R1 + 1/R2 + 1/R3), and each branch current follows from Ohm's law across its own resistor.
# Branches 1 and 2 push current up into A, I1 = (E1 - VA) / R1 and I2 = (E2 - VA) / R2; branch 3 carries I3 = (VA - E3) / R3 down. Source power is E times its upward current.
from fractions import Fraction as _F
rkf = random.Random(20261217)
def kf_vec(E1, R1, E2, R2, E3, R3):
    E1, R1, E2, R2, E3, R3 = map(_F, (E1, R1, E2, R2, E3, R3))
    VA = (E1 / R1 + E2 / R2 + E3 / R3) / (1 / R1 + 1 / R2 + 1 / R3)
    I1, I2, I3 = (E1 - VA) / R1, (E2 - VA) / R2, (VA - E3) / R3
    r = {"I1": I1, "I2": I2, "I3": I3, "VA": VA, "VR1": I1 * R1, "VR2": I2 * R2, "VR3": I3 * R3, "P1": E1 * I1, "P2": E2 * I2, "P3": -E3 * I3,
         "Pr": I1 * I1 * R1 + I2 * I2 * R2 + I3 * I3 * R3}
    return {k: float(v) for k, v in r.items() if v != 0}      # an exact zero is left out because the comparison is relative
def kf_case(*a):
    E1, R1, E2, R2, E3, R3 = a
    add("kirchhoff-solver", {"E1": E1, "R1": R1, "E2": E2, "R2": R2, "E3": E3, "R3": R3}, kf_vec(*a), 1e-9)
for _ in range(40):
    kf_case(round(rkf.uniform(-60, 60), 1), round(rkf.uniform(0.2, 50), 2), round(rkf.uniform(-60, 60), 1), round(rkf.uniform(0.2, 50), 2),
            rkf.choice([0, 0, round(rkf.uniform(-30, 30), 1)]), round(rkf.uniform(0.2, 100), 2))
for a_ in ((12, 1, 9, 1, 0, 2), (12, 2, 6, 3, 0, 6), (10, 2, 5, 1, 3, 4), (24, 0.5, 24, 0.5, 0, 12), (12, 0.1, 13.8, 0.05, 0, 3), (0, 5, 20, 10, 0, 15)):
    kf_case(*a_)

# --- v1.89.0 work: rlc-transient (own stream, earlier vectors unchanged) ---
# Written from the differential equation, not from the closed-form step responses the engine uses: the output y of the normalised equation y'' + 2 a y' + w0^2 y = w0^2,
# started from rest, is integrated with fourth-order Runge-Kutta (40,000 steps), and the answer is A y(t). Series: a = R / (2L) (output capacitor voltage, from L C v'' + R C v' + v = A);
# parallel: a = 1 / (2 R C) (output inductor current, from L C i'' + (L / R) i' + i = A). Damping ratio, Q, frequencies, critical resistance, overshoot and the 4 / decay-rate
# settling time are the textbook definitions. Inputs are in ohm, mH, uF and ms; ts is in ms. A value that is exactly zero (no ringing outside the underdamped case) is left out.
rrl = random.Random(20261218)
def _rk4(a, w0, t, n=40000):
    def f(y, v): return v, w0 * w0 * (1 - y) - 2 * a * v
    y = v = 0.0; h = t / n
    for _ in range(n):
        k1 = f(y, v); k2 = f(y + h / 2 * k1[0], v + h / 2 * k1[1]); k3 = f(y + h / 2 * k2[0], v + h / 2 * k2[1]); k4 = f(y + h * k3[0], v + h * k3[1])
        y += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
    return y
def rlc_case(typ, R, Lm, Cu, A, tm):
    L, C, t = Lm * 1e-3, Cu * 1e-6, tm * 1e-3
    a = R / (2 * L) if typ == 1 else 1 / (2 * R * C); w0 = 1 / math.sqrt(L * C); z = a / w0
    o = {"alpha": a, "w0": w0, "zeta": z, "Q": 1 / (2 * z), "f0": w0 / (2 * math.pi), "Rc": 2 * math.sqrt(L / C) if typ == 1 else 0.5 * math.sqrt(L / C), "yt": A * _rk4(a, w0, t) if t > 0 else 0}
    if z < 1 - 1e-9:
        o["fd"] = w0 * math.sqrt(1 - z * z) / (2 * math.pi); o["Mp"] = 100 * math.exp(-math.pi * z / math.sqrt(1 - z * z)); o["ts"] = 4 / a * 1e3
    elif z <= 1 + 1e-9: o["ts"] = 4 / a * 1e3
    else: o["ts"] = 4 / (a - math.sqrt(a * a - w0 * w0)) * 1e3
    o = {k: v for k, v in o.items() if v != 0}
    add("rlc-transient", {"typ": typ, "R": R, "L": Lm, "C": Cu, "A": A, "t": tm}, o, 1e-7)
for _ in range(44):
    _L, _C = round(rrl.uniform(1, 100), 1), round(rrl.uniform(1, 200), 1)
    _typ = rrl.choice([1, 2]); _w0 = 1 / math.sqrt(_L * 1e-3 * _C * 1e-6)
    _z = rrl.choice([0.05, 0.2, 0.4, 0.7, 0.9, 1.5, 3, 8]) * rrl.uniform(0.9, 1.1)
    _R = round((2 * _z * _w0 * _L * 1e-3) if _typ == 1 else (1 / (2 * _z * _w0 * _C * 1e-6)), 3)
    _a = _R / (2 * _L * 1e-3) if _typ == 1 else 1 / (2 * _R * _C * 1e-6)
    rlc_case(_typ, _R, _L, _C, round(rrl.uniform(1, 400), 1), round(rrl.uniform(0.05, 6 / _a * 1e3), 4))
for a_ in ((1, 20, 10, 10, 10, 2), (1, 63.245553203367585, 10, 10, 10, 1), (1, 200, 10, 10, 10, 1), (2, 50, 10, 10, 2, 2), (2, 5, 10, 10, 2, 0.5), (1, 2, 10, 10, 10, 3)):
    rlc_case(*a_)

# --- v1.90.0 work: mesh-nodal-solver (own stream, earlier vectors unchanged) ---
# Written from the six branch currents as unknowns, in exact fractions: Kirchhoff's current law at nodes A, B and C and the voltage law round the two inner loops and the source loop
# (Is Rs + I3 R3 + I4 R4 = E), solved by exact Gaussian elimination. This is neither the three mesh equations nor the three node equations the engine solves, so it is a different route.
# The node voltages follow from Ohm's law along the paths from D (VB = I2 R2, VC = I4 R4, VA = VB + I1 R1). The generator also checks every case against the node-voltage equations.
rmn = random.Random(20261219)
def mn_vec(E, Rs, R1, R2, R3, R4, R5):
    E, Rs, R1, R2, R3, R4, R5 = map(_F, (E, Rs, R1, R2, R3, R4, R5))
    A = [[1, -1, 0, -1, 0, 0], [0, 1, -1, 0, 0, -1], [0, 0, 0, 1, -1, 1], [0, R1, 0, -R3, 0, R5], [0, 0, R2, 0, -R4, -R5], [Rs, 0, 0, R3, R4, 0]]
    b = [0, 0, 0, 0, 0, E]
    M = [[_F(x) for x in r] + [_F(b[i])] for i, r in enumerate(A)]      # every entry a Fraction, so no step falls back to floating point
    for c in range(6):
        pv = next(r for r in range(c, 6) if M[r][c] != 0); M[c], M[pv] = M[pv], M[c]
        for r in range(6):
            if r != c:
                f = M[r][c] / M[c][c]; M[r] = [x - f * y for x, y in zip(M[r], M[c])]
    Is, I1, I2, I3, I4, I5 = [M[i][6] / M[i][i] for i in range(6)]
    VB, VC = I2 * R2, I4 * R4; VA = VB + I1 * R1
    G = [1 / x for x in (Rs, R1, R2, R3, R4, R5)]
    assert Is == (E - VA) / Rs and I3 == (VA - VC) / R3 and I5 == (VB - VC) / R5          # node-voltage equations agree exactly
    r = {"VA": VA, "VB": VB, "VC": VC, "Vbc": VB - VC, "Is": Is, "I1": I1, "I2": I2, "I3": I3, "I4": I4, "I5": I5, "Req": VA / Is, "Pin": E * Is,
         "Pr": Is * Is * Rs + I1 * I1 * R1 + I2 * I2 * R2 + I3 * I3 * R3 + I4 * I4 * R4 + I5 * I5 * R5}
    return {k: float(v) for k, v in r.items() if v != 0}      # an exact zero is left out because the comparison is relative
def mn_case(meth, *a):
    E, Rs, R1, R2, R3, R4, R5 = a
    add("mesh-nodal-solver", {"meth": meth, "E": E, "Rs": Rs, "R1": R1, "R2": R2, "R3": R3, "R4": R4, "R5": R5}, mn_vec(*a), 1e-8)
for _ in range(40):
    mn_case(rmn.choice([1, 2]), round(rmn.choice([-1, 1]) * rmn.uniform(1, 500), 2), round(rmn.uniform(0.05, 20), 2),
            *[round(rmn.uniform(1, 5000), 1) for _ in range(5)])
for a_ in ((1, 24, 1, 10, 20, 30, 40, 50), (2, 24, 1, 10, 20, 30, 40, 50), (1, 12, 2, 10, 20, 15, 30, 25), (2, 10, 1, 100, 200, 150, 300, 500),
           (1, 100, 0.5, 1000, 1000, 1000, 1000, 1000), (2, 5, 10, 1, 1000, 1000, 1, 100)):
    mn_case(*a_)

# --- v1.91.0 work: transformer-turns-ratio (own stream, earlier vectors unchanged) ---
# Written from the winding definitions, not from the engine's formulas: each winding carries one third (three-phase) or all (single-phase) of the rating, so the winding
# current is (S / n) / Vw with the winding voltage Vw = line voltage / sqrt(3) for a star winding; the line current is the winding current times sqrt(3) on a delta side.
rtt = random.Random(20261220)
def tt_case(phase, hv, lv, Vp, Vs, S, Np, ZL):
    n = 3 if phase == 3 else 1
    wp = Vp / math.sqrt(3) if (phase == 3 and hv == 1) else Vp; ws = Vs / math.sqrt(3) if (phase == 3 and lv == 1) else Vs
    a = wp / ws; Ns = Np / a
    Ipw = S * 1000 / n / wp; Isw = S * 1000 / n / ws
    Ip = Ipw * (math.sqrt(3) if (phase == 3 and hv == 2) else 1); Is = Isw * (math.sqrt(3) if (phase == 3 and lv == 2) else 1)
    Nr = max(1, round(Ns)); err = (Np / Nr / a - 1) * 100
    o = {"av": Vp / Vs, "at": a, "Ns": Ns, "Nr": Nr, "vt": wp / Np, "Ip": Ip, "Is": Is, "Ipw": Ipw, "Isw": Isw, "Zr": a * a * ZL}
    if abs(err) > 1e-9: o["err"] = err
    add("transformer-turns-ratio", {"phase": phase, "hv": hv, "lv": lv, "Vp": Vp, "Vs": Vs, "S": S, "Np": Np, "ZL": ZL}, o, 1e-8)
for _ in range(40):
    _ph = rtt.choice([1, 3, 3]); _Vs = rtt.choice([110, 230, 400, 415, 690, 3300, 6600])
    tt_case(_ph, rtt.choice([1, 2]), rtt.choice([1, 2]), round(_Vs * rtt.uniform(0.3, 60), 1), _Vs, round(rtt.uniform(5, 5000), 1), round(rtt.uniform(50, 6000), 1), round(rtt.uniform(0.05, 500), 3))
for a_ in ((3, 2, 1, 11000, 415, 1000, 2295, 0.5), (1, 2, 1, 230, 115, 10, 100, 2), (3, 1, 1, 11000, 415, 500, 1000, 1), (3, 2, 2, 33000, 11000, 2000, 900, 10), (3, 1, 2, 6600, 433, 630, 1500, 0.2), (1, 2, 1, 11000, 230, 25, 4780, 5)):
    tt_case(*a_)

# --- v1.92.0 work: short-circuit-impedance (own stream, earlier vectors unchanged) ---
# Written by the per-unit route with complex impedances, not from the engine's ohm-by-ohm sums: every element is a per-unit complex impedance on a 100 MVA base at the system voltage
# (network c Sb / Ssc at the angle atan(X/R); transformer (uk / 100) Sb / St with the resistive part ur = Pk / St and the reactive part sqrt(uk^2 - ur^2); cable (r f + j x) L / (1000 n) over the base impedance
# V^2 / Sb, f = 1 + alpha (T - 20)). The current is c Ib / |z| with Ib = Sb / (sqrt 3 V), the peak factor comes from the real and imaginary parts of the total, and the cable fall is 1 - |z_busbar| / |z|.
# Outputs are in kA, MVA and milliohm. An output that is exactly zero (the transformer when it is left out) is left out because the comparison is relative.
rsc = random.Random(20261221)
def sc_case(V_, c, Ssc, xrq, tx, St, uk, Pk, r20, x, L, n, mat, T):
    Sb = 100e6; Zb = V_ * V_ / Sb; Ib = Sb / (S3 * V_)
    zq = (c * Sb / (Ssc * 1e6)) * complex(1, xrq) / math.hypot(1, xrq)
    if tx == 1:
        ur = Pk * 1e3 / (St * 1e3); ukf = uk / 100; k = Sb / (St * 1e3)
        zt = complex(ur * k, math.sqrt(ukf * ukf - ur * ur) * k)
    else: zt = 0j
    al = 0.00393 if mat == 1 else 0.00403
    zc = complex(r20 * (1 + al * (T - 20)), x) * L / 1000 / n / Zb
    zb = zq + zt; z = zb + zc
    Ik = c * Ib / abs(z); Ibus = c * Ib / abs(zb)
    kap = 1.02 + 0.98 * math.exp(-3 * z.real / z.imag)
    o = {"Ik": Ik / 1e3, "ip": kap * math.sqrt(2) * Ik / 1e3, "Ik2": S3 / 2 * Ik / 1e3, "Sk": S3 * V_ * Ik / 1e6, "Ib": Ibus / 1e3, "red": (1 - abs(zb) / abs(z)) * 100,
         "R": z.real * Zb * 1e3, "X": z.imag * Zb * 1e3, "Z": abs(z) * Zb * 1e3, "xr": z.imag / z.real, "kap": kap, "Zq": abs(zq) * Zb * 1e3, "Zt": abs(zt) * Zb * 1e3, "Zc": abs(zc) * Zb * 1e3}
    o = {k_: v_ for k_, v_ in o.items() if v_ != 0}
    add("short-circuit-impedance", {"V": V_, "c": c, "Ssc": Ssc, "xrq": xrq, "tx": tx, "St": St, "uk": uk, "Pk": Pk, "r20": r20, "x": x, "L": L, "n": n, "mat": mat, "T": T}, o, 1e-8)
for _ in range(44):
    _St = rsc.choice([100, 200, 315, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150]); _uk = round(rsc.uniform(3, 10), 2); _ur = rsc.uniform(0.2, 0.7 * _uk)
    sc_case(rsc.choice([230, 400, 415, 480, 690, 1000]), rsc.choice([1.1, 1.05, 1.05, 1, 0.95]), round(rsc.uniform(5, 500), 1), round(rsc.uniform(1, 30), 2), rsc.choice([1, 1, 0]), _St, _uk,
            round(_ur / 100 * _St, 3), round(rsc.uniform(0.05, 2), 4), round(rsc.uniform(0, 0.15), 4), round(rsc.uniform(1, 800), 1), rsc.choice([1, 2, 3, 4]), rsc.choice([1, 2]), rsc.choice([20, 20, 0, 50, 70, 90]))
for a_ in ((415, 1.05, 250, 10, 1, 1000, 6, 10.5, 0.0754, 0.072, 50, 1, 1, 20), (415, 1.05, 25, 1, 0, 1000, 6, 10.5, 0.0754, 0, 0.001, 1, 1, 20), (400, 1.1, 500, 15, 1, 1600, 6, 14, 0.153, 0.08, 30, 2, 1, 20),
           (415, 0.95, 250, 10, 1, 1000, 6, 10.5, 0.0754, 0.072, 50, 1, 1, 90), (690, 1.05, 100, 10, 1, 2500, 6, 22, 0.6, 0.09, 200, 1, 2, 70), (415, 1.05, 500, 20, 1, 3150, 7, 27, 0.0754, 0.072, 0.001, 1, 1, 20)):
    sc_case(*a_)

# --- v1.93.0 work: earthing-conductor-size (own stream, earlier vectors unchanged) ---
# Written from the adiabatic equation and the published k table, not from the engine. The k table is checked here against the physical formula
# k = sqrt(Qc (B + 20) / rho20 * ln(1 + (thetaf - thetai) / (B + thetai))) (copper B 234.5, Qc 3.45e-3 J/(C mm3), rho20 17.241e-6 ohm mm; aluminium 228, 2.5e-3, 28.264e-6; steel 202, 3.8e-3, 138e-6),
# and every published value must lie within 0.65% of it before it is used. The required area is I sqrt(t) / k (mm2 with I in A); PVC in a cable (final temperature 160 C) drops to the 140 C value (103 copper, 68 aluminium)
# when the area is above 300 mm2. The mechanical minimum is 2.5 mm2 (protected) or 4 mm2 (not protected) for copper and 16 mm2 for aluminium, none for steel. The standard size is the first IEC 60228 size at or above the larger of the two.
# The table rule is Sph up to 16, 16 up to 35, Sph / 2 above 35, then the same size selection. Outputs left out when not defined (no mechanical minimum, no phase conductor, above 630 mm2).
import bisect
rec = random.Random(20261301)
EC_STD = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630]
EC_PHYS = {"Cu": (234.5, 3.45e-3, 17.241e-6), "Al": (228, 2.5e-3, 28.264e-6), "St": (202, 3.8e-3, 138e-6)}
EC_MAT = {1: ("Cu", 30, 160, 143), 2: ("Cu", 70, 160, 115), 3: ("Cu", 30, 250, 176), 4: ("Cu", 90, 250, 143), 5: ("Al", 30, 160, 95), 6: ("Al", 70, 160, 76),
          7: ("Al", 30, 250, 116), 8: ("Al", 90, 250, 94), 9: ("Cu", 30, 500, 228), 10: ("Al", 30, 300, 125), 11: ("St", 30, 500, 82)}
def ec_kphys(m, ti, tf):
    B, Q, r = EC_PHYS[m]; return math.sqrt(Q * (B + 20) / r * math.log(1 + (tf - ti) / (B + ti)))
for _m, (_mm, _ti, _tf, _kp) in EC_MAT.items(): assert abs(ec_kphys(_mm, _ti, _tf) / _kp - 1) < 0.0065, _m
assert abs(ec_kphys("Cu", 70, 140) / 103 - 1) < 0.0065 and abs(ec_kphys("Al", 70, 140) / 68 - 1) < 0.0065
def ec_std(a):
    i = bisect.bisect_left(EC_STD, a - 1e-9); return EC_STD[i] if i < len(EC_STD) else None
def ec_case(Ik_kA, t, mat, mech, Sph):
    m, ti, tf, kp = EC_MAT[mat]; I = Ik_kA * 1000; rt = I * math.sqrt(t)
    k = kp; Sf = rt / k
    if mat in (2, 6) and Sf > 300: k = 103 if mat == 2 else 68; Sf = rt / k
    Sm = 0
    if mech == 2: Sm = 2.5 if m == "Cu" else (16 if m == "Al" else 0)
    if mech == 3: Sm = 4 if m == "Cu" else (16 if m == "Al" else 0)
    Ss = ec_std(max(Sf, Sm))
    o = {"Sf": Sf, "k": k, "I2t": I * I * t / 1e6}
    if Sm: o["Sm"] = Sm
    if Ss: o["Sstd"] = Ss; o["J"] = I / Ss
    if Sph > 0:
        St = Sph if Sph <= 16 else (16 if Sph <= 35 else Sph / 2); o["St"] = St
        if ec_std(St): o["Sts"] = ec_std(St)
    add("earthing-conductor-size", {"Ief": Ik_kA, "t": t, "mat": mat, "mech": mech, "Sph": Sph}, o, 1e-8)
for _ in range(48):
    ec_case(round(10 ** rec.uniform(-0.7, 1.8), 3), rec.choice([0.1, 0.2, 0.4, 0.5, 0.8, 1, 1.5, 2, 3, 5]), rec.randint(1, 11), rec.randint(1, 3), rec.choice([0, 0, 6, 10, 16, 25, 35, 50, 95, 150, 240]))
for a_ in ((10, 0.5, 1, 3, 150), (25, 1, 8, 1, 0), (60, 1, 2, 1, 0), (60, 1, 6, 1, 0), (20, 0.2, 11, 2, 0), (1, 0.1, 1, 3, 0), (1, 0.1, 5, 2, 0), (5, 0.2, 4, 1, 70), (40, 1, 1, 1, 95), (100, 5, 1, 1, 0), (10, 0.5, 9, 3, 0), (10, 0.5, 10, 2, 35)):
    ec_case(*a_)

# --- v1.94.0 work: load-schedule (own stream, earlier vectors unchanged) ---
# Written with complex power: each row contributes Sd = Pc d (1 + j tan(acos pf)) with Pc = n P, the rows are summed as complex numbers and divided by the diversity factor, the overall power factor is
# cos of the angle of the total, the design load is |S| (1 + margin / 100) and the current is Sdes / (sqrt 3 V) or Sdes / V. The connected kVA is the sum of Pc / pf. Unused rows (P = 0) are left out of the outputs.
rls = random.Random(20261401)
def ls_case(V_, ph, dv, mg, rows):
    tot = 0j; Pc = 0.0; Sc = 0.0; o = {}
    inp = {"V": V_, "phase": ph, "dv": dv, "mg": mg}
    for i in range(8):
        P_, n_, d_, f_ = rows[i] if i < len(rows) else (0, 1, 1, 0.9)
        inp["P%d" % (i + 1)] = P_; inp["n%d" % (i + 1)] = n_; inp["d%d" % (i + 1)] = d_; inp["f%d" % (i + 1)] = f_
        if P_ > 0:
            pc = n_ * P_; z = pc * d_ * complex(1, math.tan(math.acos(f_))); tot += z; Pc += pc; Sc += pc / f_; o["D%d" % (i + 1)] = pc * d_
    t = tot / dv; Sdes = abs(t) * (1 + mg / 100)
    o.update({"Pc": Pc, "Sc": Sc, "Pd": t.real, "Qd": t.imag, "Sd": abs(t), "pf": math.cos(math.atan2(t.imag, t.real)), "ovf": t.real / Pc, "Sdes": Sdes, "Id": Sdes * 1000 / ((S3 if ph == 3 else 1) * V_)})
    add("load-schedule", inp, o, 1e-8)
for _ in range(36):
    _n = rls.randint(1, 8)
    ls_case(rls.choice([230, 400, 415, 480, 690]), rls.choice([3, 3, 1]), rls.choice([1, 1, 1.1, 1.25, 1.5]), rls.choice([0, 10, 20, 25]),
            [(round(rls.uniform(0.1, 90), 2), rls.randint(1, 20), round(rls.uniform(0.1, 1), 2), round(rls.uniform(0.4, 1), 2)) for _ in range(_n)])
for a_ in ((415, 3, 1, 20, [(12, 2, 0.9, 0.9), (45, 1, 0.75, 0.85), (7.5, 4, 0.7, 0.85), (20, 1, 0.4, 0.9), (11, 2, 0.5, 0.8), (15, 1, 0.8, 0.95), (9, 1, 0.6, 1), (7.4, 2, 0.5, 0.95)]), (230, 1, 1.25, 0, [(30, 3, 0.8, 0.8)]),
           (400, 3, 1, 20, [(10, 1, 1, 1)]), (415, 3, 1.2, 15, [(55, 1, 1, 0.88), (22, 2, 0.8, 0.85)])):
    ls_case(*a_)

# --- v1.94.2 work: power-measurement (own stream, earlier vectors unchanged) ---
# Written from the textbook relations, not from the engine. Three-phase apparent power is taken as 3 Vph I with Vph = V / sqrt 3 (not sqrt 3 V I); primary values are meter value times the ratio;
# the wattmeter total is the reading times both ratios (times 3 when it reads one phase of a balanced load); Q = S sin(acos pf) (not sqrt(S2 - P2)), taken only when P <= S;
# the energy meter average is (E2 - E1) mf / (T / 60) in kW and the difference is Pavg / P - 1 in per cent. Energy outputs are left out when E2 = E1.
rpm = random.Random(20261402)
def pm_case(ph, V_, I_, W_, wm, kv, kc, E1, E2, T, mf):
    Vp = V_ * kv; Ip = I_ * kc
    S = 3 * (Vp / S3) * Ip if ph == 3 else Vp * Ip
    P = W_ * 1000 * kv * kc * (3 if wm == 2 else 1)
    o = {"Vp": Vp, "Ip": Ip, "S": S / 1000, "P": P / 1000, "pf": P / S}
    if P <= S:
        o["Q"] = S * math.sin(math.acos(P / S)) / 1000; o["ang"] = math.degrees(math.acos(P / S))
    if E2 > E1:
        Pa = (E2 - E1) * mf / (T / 60); o["dE"] = (E2 - E1) * mf; o["Pavg"] = Pa; o["dP"] = (Pa * 1000 / P - 1) * 100
    add("power-measurement", {"phase": ph, "V": V_, "I": I_, "W": W_, "wm": wm, "kv": kv, "kc": kc, "E1": E1, "E2": E2, "T": T, "mf": mf}, o, 1e-6)
for _ in range(30):
    _ph = rpm.choice([3, 3, 1]); _V = rpm.choice([110, 230, 400, 415, 440, 690]); _I = round(rpm.uniform(0.5, 400), 2)
    _kv = rpm.choice([1, 1, 1, 10, 100]); _kc = rpm.choice([1, 1, 5, 40, 120])
    _wm = rpm.choice([1, 1, 2]) if _ph == 3 else 1
    _Sp = (S3 if _ph == 3 else 1) * _V * _I * _kv * _kc  # primary apparent power, VA
    _Pw = rpm.uniform(0.15, 1.0) * _Sp  # primary real power, W
    _W = round(_Pw / (_kv * _kc * (3 if _wm == 2 else 1)) / 1000, 4)
    _E1 = rpm.choice([0, 100, 12345.6, 99000]); _dT = rpm.choice([5, 15, 30, 60, 120]); _mf = rpm.choice([1, 1, 10, 4000])
    _E2 = round(_E1 + (_W * 1000 * _kv * _kc * (3 if _wm == 2 else 1)) / 1000 * _dT / 60 / _mf * rpm.uniform(0.85, 1.15), 6) if rpm.random() < 0.8 else _E1
    pm_case(_ph, _V, _I, _W, _wm, _kv, _kc, _E1, _E2, _dT, _mf)
for a_ in ((3, 415, 10, 5, 1, 1, 1, 1000, 1002.5, 30, 1), (1, 230, 20, 3.5, 1, 1, 1, 5000, 5003.1, 60, 1), (3, 110, 4.2, 0.225, 2, 100, 40, 12000, 12000.69, 60, 4000),
           (3, 415, 10, 7.4, 1, 1, 1, 0, 0, 0, 1), (1, 230, 5, 1.15, 1, 1, 1, 10, 10, 30, 1)):
    pm_case(*a_)

# --- v1.94.3 work: pt-ratio (own stream, earlier vectors unchanged) ---
# Written from the definitions, not from the engine: K = Vpn / Vsn; the secondary is the primary divided by K and the primary is the secondary times K; the percentage is the primary over the rated primary;
# the actual ratio is the test primary over the test secondary and the ratio error is the rated-ratio prediction of the primary, K Vts, against the applied primary, in per cent of the applied primary;
# the loading is Sc over Sn and the secondary current is Sc over the rated secondary voltage. Test, burden outputs are left out when their inputs are 0.
rpt = random.Random(20261403)
def pt_case(Vpn, Vsn, mode, Vx, Vtp, Vts, Sn, Sc):
    K = Vpn / Vsn; o = {"K": K, "Vp": Vx if mode == 1 else Vx * K, "Vs": Vx / K if mode == 1 else Vx}
    o["pct"] = o["Vp"] / Vpn * 100
    if Vtp > 0 and Vts > 0: o["Ka"] = Vtp / Vts; o["eps"] = (K * Vts - Vtp) / Vtp * 100
    if Sn > 0 and Sc > 0: o["load"] = Sc / Sn * 100; o["Is"] = Sc / Vsn
    add("pt-ratio", {"Vpn": Vpn, "Vsn": Vsn, "mode": mode, "Vx": Vx, "Vtp": Vtp, "Vts": Vts, "Sn": Sn, "Sc": Sc}, o, 1e-8)
for _ in range(24):
    _Vp = rpt.choice([415, 3300, 6600, 11000, 22000, 33000, 66000, 132000, 220000]); _Vs = rpt.choice([100, 110, 115, 120, 63.5, 110 / 3 ** 0.5])
    _Vs = round(_Vs, 4); _K = _Vp / _Vs; _Vx = round(_Vp * rpt.uniform(0.5, 1.3), 1) if rpt.random() < 0.5 else round(_Vs * rpt.uniform(0.5, 1.3), 3)
    _m = 1 if _Vx > _Vs * 2 else 2
    _tp = round(_Vp * rpt.uniform(0.8, 1.2), 1) if rpt.random() < 0.7 else 0
    _ts = round(_tp / _K * rpt.uniform(0.995, 1.005), 4) if _tp > 0 else 0
    _Sn = rpt.choice([0, 25, 50, 100, 200]); _Sc = round(_Sn * rpt.uniform(0.1, 1.3), 1) if _Sn else 0
    pt_case(_Vp, _Vs, _m, _Vx, _tp, _ts, _Sn, _Sc)
for a_ in ((11000, 110, 1, 10500, 10500, 104.7, 50, 30), (33000, 110, 2, 63.5, 0, 0, 0, 0), (6600, 110, 1, 6600, 6600, 108, 25, 40), (11000, 110, 1, 11000, 0, 0, 0, 0), (132000, 110, 2, 110, 132000, 110.2, 100, 80)):
    pt_case(*a_)

# --- v1.94.4 work: diode-circuit (own stream, earlier vectors unchanged) ---
# Written from the textbook relations, not from the engine, and by a different route: the DC circuit with the Shockley diode is solved in closed form with the Lambert W function
# (I = (nVt / R) W((Is R / nVt) exp((Vs + Is R) / nVt)) - Is, Is = Iref / (exp(Vf / nVt) - 1), Vt = kT / q with the exact SI constants), not by iteration; the rectifier waveform vo = Vpk sin(t) - Vt
# (Vt = Vf for one diode, 2 Vf for a bridge, conducting while the supply is above Vt) is integrated numerically for its average and mean square, not from the closed form; the ripple factor is
# sqrt((Vrms / Vdc)^2 - 1), the diode loss is Vt times the average load current and the efficiency is load power over load power plus diode loss; the bridge PIV is Vpk - Vf and the half-wave PIV is Vpk;
# the clamp holds the capacitor at Vpk - Vf, so the output runs from -Vf to 2 Vpk - Vf. Outputs that do not apply to a circuit (or to an off diode) are left out.
from mpmath import mp as _dmp, mpf as _df, lambertw as _dlw, exp as _dexp, quad as _dquad, sin as _dsin, sqrt as _dsqrt, pi as _dpi, asin as _dasin
_dmp.dps = 40
_KB, _QE = _df('1.380649e-23'), _df('1.602176634e-19')
rdi = random.Random(20261404)
def _dpay(mode, model, Vs, R, Vf, Iref, n, T): return {"mode": mode, "model": model, "Vs": Vs, "R": R, "Vf": Vf, "Iref": Iref, "n": n, "T": T}
def di_dc(model, Vs, R, Vf, Iref=10, n=1, T=25):
    _V, _R, _F = _df(str(Vs)), _df(str(R)), _df(str(Vf))
    if model == 2 and Vs > 0:
        nv = _df(str(n)) * _KB * (_df(str(T)) + _df('273.15')) / _QE; Is = _df(str(Iref)) / 1000 / (_dexp(_F / nv) - 1)
        I = (nv / _R) * _dlw((Is * _R / nv) * _dexp((_V + Is * _R) / nv)).real - Is
        o = {"I": I * 1000, "Vd": _V - _R * I, "VR": _R * I, "rd": nv / (I + Is), "Pd": (_V - _R * I) * I, "PR": I * I * _R, "eta": I * I * _R / (_V * I) * 100}
    elif model == 1 and Vs > Vf:
        I = (_V - _F) / _R
        o = {"I": I * 1000, "Vd": _F, "VR": I * _R, "Pd": _F * I, "PR": I * I * _R, "eta": I * I * _R / (_V * I) * 100}
    else:
        o = {"I": 0, "Vd": _V, "VR": 0, "Pd": 0, "PR": 0}
    add("diode-circuit", _dpay(1, model, Vs, R, Vf, Iref, n, T), {k: float(v) for k, v in o.items()}, 1e-8)
def di_ac(bridge, Vs, R, Vf):
    _V, _R, _F = _df(str(Vs)), _df(str(R)), _df(str(Vf)); Vpk = _dsqrt(2) * _V; Vt = 2 * _F if bridge else _F
    t1 = _dasin(Vt / Vpk); per = _dpi if bridge else 2 * _dpi; f1 = lambda x: Vpk * _dsin(x) - Vt
    avg = _dquad(f1, [t1, _dpi - t1]) / per; Vro = _dsqrt(_dquad(lambda x: f1(x) ** 2, [t1, _dpi - t1]) / per); Idc = avg / _R; PR = Vro ** 2 / _R; Pd = Vt * Idc
    o = {"Vpk": Vpk, "Vopk": Vpk - Vt, "Vdc": avg, "Vro": Vro, "RF": _dsqrt((Vro / avg) ** 2 - 1) * 100, "I": Idc * 1000, "Ipk": (Vpk - Vt) / _R * 1000, "PIV": (Vpk - _F) if bridge else Vpk,
         "Ida": Idc * 1000 / (2 if bridge else 1), "Pd": Pd, "PR": PR, "eta": PR / (PR + Pd) * 100, "theta": (_dpi - 2 * t1) * 180 / _dpi}
    add("diode-circuit", _dpay(3 if bridge else 2, 1, Vs, R, Vf, 10, 1, 25), {k: float(v) for k, v in o.items()}, 1e-8)
def di_clamp(Vs, Vf):
    Vpk = _dsqrt(2) * _df(str(Vs)); _F = _df(str(Vf))
    add("diode-circuit", _dpay(4, 1, Vs, 330, Vf, 10, 1, 25), {"Vpk": float(Vpk), "Vdc": float(Vpk - _F), "Vopk": float(2 * Vpk - _F), "Vomin": float(-_F), "PIV": float(2 * Vpk - _F)}, 1e-8)
for _ in range(14):
    di_dc(1, round(rdi.uniform(-15, 60), 2), rdi.choice([10, 47, 100, 330, 1000, 4700]), rdi.choice([0, 0.2, 0.3, 0.45, 0.7, 0.9, 1.1, 1.8]))
for _ in range(14):
    di_dc(2, round(rdi.uniform(0.2, 60), 2), rdi.choice([1, 10, 47, 100, 330, 1000, 10000]), rdi.choice([0.25, 0.3, 0.5, 0.65, 0.7, 0.8]), rdi.choice([1, 5, 10, 50, 100]), rdi.choice([1, 1.2, 1.5, 2]), rdi.choice([-20, 0, 25, 60, 100, 150]))
for a_ in ((1, 5, 330, 0.7), (1, 0.5, 330, 0.7), (1, -12, 330, 0.7), (1, 0.7, 330, 0.7), (1, 24, 1000, 0.3)):
    di_dc(*a_)
for a_ in ((2, 5, 330, 0.7), (2, 12, 100, 0.7, 10, 1, 25), (2, 3, 100, 0.65, 5, 1.8, 100), (2, 0.9, 10000, 0.7), (2, 48, 2, 0.8, 100, 1.5, 25)):
    di_dc(*a_)
for _ in range(10):
    di_ac(False, round(rdi.uniform(3, 400), 1), rdi.choice([10, 47, 100, 330, 1000]), rdi.choice([0, 0.3, 0.7, 1.0, 1.4]))
for _ in range(10):
    di_ac(True, round(rdi.uniform(3, 400), 1), rdi.choice([10, 47, 100, 330, 1000]), rdi.choice([0, 0.3, 0.7, 1.0, 1.4]))
for a_ in ((False, 230, 330, 0.7), (True, 230, 330, 0.7), (True, 8, 10, 0.7), (False, 24, 47, 0.3), (False, 230, 330, 0)):
    di_ac(*a_)
for _ in range(6):
    di_clamp(round(rdi.uniform(1, 300), 2), rdi.choice([0, 0.3, 0.7, 1.2]))
di_clamp(5, 0.7)

# --- v1.95.0 work: vfd-speed (own stream, earlier vectors unchanged) ---
# Written from the machine relations, not from the engine, and by a different route: the rated slip is turned into an electrical slip frequency fs = s fb (s = (Ns - Nr) / Ns at the base frequency),
# and with constant flux the rotor runs at the supply frequency less that slip frequency, so the shaft speed is N = 120 (f - fs) / p and a target speed needs f = p N / 120 + fs (the engine
# subtracts a slip speed in rpm instead). The voltage is Vb min(f / fb, 1), the flux is that voltage per hertz over the rated volts per hertz, and the power and torque come from the rated torque
# Tr = Pr / wr (wr = pi Nr / 30 in rad/s): the motor gives Tr at speeds up to rated and Pr above it, so P = min(Tr w, Pr) and T = P / w (not from the engine's regions).
rvf = random.Random(20261501)
def vf_case(fb, Vb, poles, Nr, Pr, mode, fx, Nx):
    Nsr = 120 * fb / poles; fs = (Nsr - Nr) / Nsr * fb
    f = fx if mode == 1 else poles * Nx / 120 + fs
    N = 120 * (f - fs) / poles; Ns = 120 * f / poles
    V = Vb * min(f / fb, 1); w = math.pi * N / 30; Tr = Pr * 1000 / (math.pi * Nr / 30)
    P = min(Tr * w, Pr * 1000) / 1000; T = P * 1000 / w
    o = {"f": f, "Ns": Ns, "N": N, "pct": N / Nr * 100, "dn": Ns - N, "slip": (Ns - N) / Ns * 100, "V": V, "vhz": V / f, "flux": (V / f) / (Vb / fb) * 100, "T": T, "P": P}
    add("vfd-speed", {"fb": fb, "Vb": Vb, "poles": poles, "Nr": Nr, "Pr": Pr, "mode": mode, "fx": fx, "Nx": Nx}, o, 1e-8)
def vf_motor():
    fb = rvf.choice([50, 50, 60]); poles = rvf.choice([2, 4, 4, 6, 8, 10, 12]); Nsr = 120 * fb / poles
    return fb, rvf.choice([230, 380, 400, 415, 460, 690, 3300]), poles, round(Nsr * (1 - rvf.uniform(0.01, 0.06))), round(rvf.uniform(0.75, 400), 2)
for _ in range(17):
    _fb, _Vb, _p, _Nr, _Pr = vf_motor()
    vf_case(_fb, _Vb, _p, _Nr, _Pr, 1, round(rvf.uniform(0.15, 2.2) * _fb, 2), 900)
for _ in range(17):
    _fb, _Vb, _p, _Nr, _Pr = vf_motor()
    vf_case(_fb, _Vb, _p, _Nr, _Pr, 2, 40, round(rvf.uniform(0.1, 1.8) * _Nr, 1))
for a_ in ((50, 415, 4, 1470, 11, 1, 40, 900), (50, 415, 4, 1470, 11, 1, 50, 900), (50, 415, 4, 1470, 11, 2, 40, 900), (50, 415, 4, 1470, 11, 1, 60, 900),
           (60, 460, 4, 1750, 30, 1, 30, 900), (50, 400, 2, 2940, 7.5, 2, 40, 1500), (50, 690, 6, 985, 90, 1, 100, 900)):
    vf_case(*a_)

# --- v1.95.2 work: sensor-range-converter (own stream, earlier vectors unchanged) ---
# Written from the straight-line relation in exact fractions, not from the engine, and by a different route: the transmitter is the line signal = m x + c through the two points (range low, signal low) and
# (range high, signal high), so m = (s1 - s0) / (hi - lo) and c = s0 - m lo; a process value gives the signal m PV + c and a signal gives PV = (signal - c) / m (the engine works with the span fraction).
# The percentage of span is read off the signal side, (signal - s0) / (s1 - s0) x 100, the 4-20 mA equivalent is 4 + 16 pct / 100, and the gain is 1 / m. An expected value that is exactly zero is left out because the comparison is relative.
from fractions import Fraction as _Fr
rsr = random.Random(20261502)
_SIG = {1: (4, 20), 2: (0, 20), 3: (0, 10), 4: (1, 5), 5: (0, 5), 6: (2, 10)}
def sr_case(lo, hi, typ, mode, pv, sig):
    F = lambda x: _Fr(str(x)); lo_, hi_, pv_, sig_ = F(lo), F(hi), F(pv), F(sig); s0, s1 = _SIG[typ]
    m = _Fr(s1 - s0) / (hi_ - lo_); c = s0 - m * lo_
    if mode == 1: sg = m * pv_ + c; pvv = pv_
    else: sg = sig_; pvv = (sig_ - c) / m
    pct = (sg - s0) / _Fr(s1 - s0) * 100; i420 = 4 + 16 * pct / 100
    o = {k: float(v) for k, v in {"pct": pct, "PV": pvv, "sig": sg, "i420": i420, "gain": 1 / m}.items() if v != 0}
    add("sensor-range-converter", {"lo": lo, "hi": hi, "type": typ, "mode": mode, "pv": pv, "sig": sig}, o, 1e-9)
def sr_range():
    lo = rsr.choice([0, 0, 0, -50, -20, 4, 100, round(rsr.uniform(-100, 50), 2)]); span = round(rsr.uniform(1, 600), 2) * rsr.choice([1, 1, 1, -1])
    return lo, round(lo + span, 2)
for _ in range(17):
    _lo, _hi = sr_range(); _t = rsr.randint(1, 6)
    sr_case(_lo, _hi, _t, 1, round(_lo + rsr.uniform(-0.15, 1.2) * (_hi - _lo), 3), 12)
for _ in range(17):
    _lo, _hi = sr_range(); _t = rsr.randint(1, 6); _s0, _s1 = _SIG[_t]
    sr_case(_lo, _hi, _t, 2, 6.5, round(_s0 + rsr.uniform(-0.15, 1.2) * (_s1 - _s0), 3))
for a_ in ((0, 10, 1, 1, 6.5, 12), (-50, 150, 1, 2, 6.5, 12), (0, 200, 3, 2, 6.5, 7.5), (0, 100, 4, 2, 6.5, 3), (100, 0, 1, 1, 25, 12), (0, 10, 1, 1, 12, 12), (0, 250, 6, 1, 125, 12)):
    sr_case(*a_)

# --- v1.97.0 work: energy-audit (own stream, earlier vectors unchanged) ---
# Written in exact fractions from the energy balance, not from the engine, and by a different route: each row is turned into an average power n P l (kW) first and its yearly energy is that power
# times its hours, the surveyed total is the sum, and the unaccounted share is 1 - Es / Em (the engine takes (Em - Es) / Em); the average metered demand is Em / 8760 h, the costs are kWh times the tariff, the
# largest user is the first row with the greatest energy (first wins a tie) and its share is taken of the surveyed total, and the baseline change is Em - Eb and that over Eb. Unused rows (P = 0) and the baseline
# outputs when no baseline is given are left out, and so is any expected zero, because the comparison is relative.
rea = random.Random(20261701)
def ea_case(Em, tar, Eb, rows):
    F = lambda x: _Fr(str(x)); Em_, tar_, Eb_ = F(Em), F(tar), F(Eb)
    inp = {"Em": Em, "tar": tar, "Eb": Eb}; o = {}; en = []; Pc = _Fr(0)
    for k in range(6):
        P_, n_, l_, h_ = rows[k] if k < len(rows) else (0, 1, 0.5, 1000)
        inp["P%d" % (k + 1)] = P_; inp["n%d" % (k + 1)] = n_; inp["l%d" % (k + 1)] = l_; inp["h%d" % (k + 1)] = h_
        if P_ > 0:
            avg = n_ * F(P_) * F(l_); e = avg * F(h_); Pc += n_ * F(P_); en.append((k + 1, e)); o["E%d" % (k + 1)] = e
    Es = sum(e for _, e in en); top = max(en, key=lambda t: (t[1], -t[0]))
    o.update({"Pc": Pc, "Es": Es, "Eu": Em_ - Es, "pu": (1 - Es / Em_) * 100, "Eavg": Em_ / 8760, "top": top[0], "topsh": top[1] / Es * 100 if Es > 0 else 0,
              "Cm": Em_ * tar_, "Cs": Es * tar_, "Cu": (Em_ - Es) * tar_})
    if Eb > 0: o["dE"] = Em_ - Eb_; o["dpct"] = (Em_ - Eb_) / Eb_ * 100
    add("energy-audit", inp, {k: float(v) for k, v in o.items() if v != 0}, 1e-9)
def ea_rows(n):
    return [(round(rea.choice([rea.uniform(0.05, 3), rea.uniform(3, 30), rea.uniform(30, 250)]), 2), rea.randint(1, 400), round(rea.uniform(0.2, 1), 2), rea.choice([500, 1500, 2000, 3000, 4000, 6000, 8000, 8760, rea.randint(100, 8760)])) for _ in range(n)]
for _ in range(36):
    _r = ea_rows(rea.randint(1, 6)); _es = sum(n_ * P_ * l_ * h_ for P_, n_, l_, h_ in _r)
    ea_case(round(_es * rea.uniform(0.8, 1.4) + 100), rea.choice([0, 4.5, 6, 8, 10.25, 12]), rea.choice([0, 0, round(_es * rea.uniform(0.9, 1.6))]), _r)
for a_ in ((1000000, 8, 1050000, [(15, 6, 0.7, 6000), (0.15, 200, 1, 4000), (5.5, 10, 0.6, 3000), (37, 1, 0.65, 6500), (30, 2, 0.5, 2000), (0.3, 50, 0.8, 8760)]),
           (50000, 10, 0, [(10, 4, 0.5, 2000)]), (30000, 10, 0, [(10, 4, 0.5, 2000)]), (44000, 10, 0, [(10, 4, 0.5, 2000)]),
           (250000, 7.5, 200000, [(22, 2, 0.8, 5000), (22, 2, 0.8, 4000)]), (480000, 9, 500000, [(75, 1, 0.9, 6000), (2.2, 40, 0.6, 3000), (0.5, 100, 1, 8760)])):
    ea_case(*a_)

# --- v1.97.1 work: derivative-integral (own stream, earlier vectors unchanged) ---
# Written without the closed-form antiderivatives or derivatives the engine uses: the function is defined as an mpmath expression, its derivatives at the point are taken numerically with mpmath.diff
# (30 digits) and its definite integral by mpmath.quad (Gauss-Legendre, split at the point where the integrand changes sign not needed because the integral is signed). The mean is the integral over the length.
# The Simpson output is the 200-strip composite Simpson sum of the same function, written out here (it differs from the exact integral on fast-oscillating cases, as the engine's does); an expected zero is left out because the comparison is relative.
import mpmath as _mp
rdi2 = random.Random(20261702)
def _simpson(fn, lo, hi, n=200):
    h = (hi - lo) / n; t = fn(lo) + fn(hi)
    for k in range(1, n): t += (4 if k % 2 else 2) * fn(lo + k * h)
    return t * h / 3
def di2_case(ft, a, b, c, d, x0, lo, hi):
    _mp.mp.dps = 30
    A, B, C_, D = _mp.mpf(str(a)), _mp.mpf(str(b)), _mp.mpf(str(c)), _mp.mpf(str(d))
    if ft == 1: fn = lambda x: A * x**3 + B * x**2 + C_ * x + D
    elif ft == 2: fn = lambda x: A * _mp.sin(B * x + C_) + D
    elif ft == 3: fn = lambda x: A * _mp.exp(B * x) + D
    else: fn = lambda x: A * x**B + D
    X0 = _mp.mpf(str(x0)); I = _mp.quad(fn, [_mp.mpf(str(lo)), _mp.mpf(str(hi))])
    o = {"f0": fn(X0), "df": _mp.diff(fn, X0), "d2f": _mp.diff(fn, X0, 2), "I": I, "mean": I / (_mp.mpf(str(hi)) - _mp.mpf(str(lo))), "Isim": _simpson(fn, _mp.mpf(str(lo)), _mp.mpf(str(hi)))}
    o = {k: float(v) for k, v in o.items() if abs(v) > 1e-9}
    if "I" not in o: return
    add("derivative-integral", {"ft": ft, "a": a, "b": b, "c": c, "d": d, "x0": x0, "lo": lo, "hi": hi}, o, 1e-7)
    _mp.mp.dps = 15
def _r(lo, hi, nd=3): return round(rdi2.uniform(lo, hi), nd)
for _ in range(10):
    _lo = _r(-3, 2); di2_case(1, _r(-4, 4), _r(-6, 6), _r(-10, 10), _r(-8, 8), _r(-3, 3), _lo, round(_lo + rdi2.uniform(0.3, 4), 3))
for _ in range(10):
    _lo = _r(-2, 2); di2_case(2, _r(0.2, 20), _r(0.3, 12), _r(-3, 3), _r(-5, 5), _r(-2, 2), _lo, round(_lo + rdi2.uniform(0.1, 2.5), 3))
for _ in range(9):
    _lo = _r(-1, 1); di2_case(3, _r(-20, 20), rdi2.choice([-1, 1]) * _r(0.1, 5), 0, _r(-5, 5), _r(-1, 1), _lo, round(_lo + rdi2.uniform(0.2, 2), 3))
for _ in range(9):
    _lo = _r(0.1, 3); di2_case(4, _r(-6, 6), rdi2.choice([-3, -2.5, -1.5, -0.5, 0.5, 1.5, 2, 2.5, 3, 4]), 0, _r(-4, 4), _r(0.2, 5), _lo, round(_lo + rdi2.uniform(0.3, 5), 3))
for a_ in ((1, 1, -6, 11, -6, 1.5, 0, 3), (2, 2, 1, 0, 0, 0, 0, math.pi), (3, 5, -2, 0, 0, 0, 0, 1), (4, 3, 2, 0, 1, 2, 1, 3), (4, 2, -1, 0, 0, 1, 1, 2.718281828459045), (2, 10, 314.159, 0.5, 0, 0.001, 0, 0.02), (4, 1, 3, 0, 0, 2, 3, 1)):
    di2_case(*a_)

# --- v1.97.2 work: induced-emf (own stream, earlier vectors unchanged) ---
# Written from Faraday's law without the closed forms the engine uses (e = B l v sin(theta), e = N dPhi/dt, Em = N B A w):
#  case 1: the motional EMF is the line integral of (v x B) along the conductor, taken from the cross product of vector v and vector B; the force is the cross product I (l x B) and the
#          power is its dot product with the velocity, so e*I is not used to get P.
#  case 2: flux linkage lambda(t) = N A B(t) with B(t) a straight line from B1 to B2; EMF = -d lambda/dt by numerical differentiation (mpmath.diff) at mid-interval; size shown.
#  case 3: lambda(t) = N B A cos(w t); e = -d lambda/dt by mpmath.diff at the stated angle; the peak is the maximum of |e| found by mpmath.findroot of de/dt = 0 from the neutral plane (quarter turn);
#          the rms is the square root of the mean of e^2 over one period by mpmath.quad.
import mpmath as _mpe
rie = random.Random(20261972)
def _ie_dflt(**k):
    d = {"mode": 1, "Bm": 0.5, "l": 0.4, "v": 10, "th": 90, "R": 2, "N": 100, "B1": 0, "B2": 0.8, "A": 50, "dt": 20, "rpm": 1500, "al": 90}
    d.update(k); return d
def ie1(Bm, l, v, th, R):
    _mpe.mp.dps = 30
    Bv = [_mpe.mpf(str(Bm)) * _mpe.cos(_mpe.radians(th)), _mpe.mpf(str(Bm)) * _mpe.sin(_mpe.radians(th)), 0]
    vv = [_mpe.mpf(str(v)), 0, 0]; L = _mpe.mpf(str(l)); Rr = _mpe.mpf(str(R))
    cross = lambda a, b: [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
    vxB = cross(vv, Bv); e = abs(vxB[2]) * L
    I = e / Rr
    Fv = cross([0, 0, I * L], Bv)
    Fmag = _mpe.sqrt(sum(c * c for c in Fv)); P = abs(sum(Fv[k] * vv[k] for k in range(3)))
    o = {"e": e, "I": I, "F": Fmag, "Pm": P}
    o = {k: float(x) for k, x in o.items() if abs(x) > 1e-9}
    add("induced-emf", _ie_dflt(mode=1, Bm=Bm, l=l, v=v, th=th, R=R), o, 1e-7)
    _mpe.mp.dps = 15
def ie2(N, B1, B2, A_cm2, dt_ms):
    _mpe.mp.dps = 30
    Ar = _mpe.mpf(str(A_cm2)) * _mpe.mpf("1e-4"); T = _mpe.mpf(str(dt_ms)) / 1000
    b1, b2 = _mpe.mpf(str(B1)), _mpe.mpf(str(B2))
    lam = lambda t: N * Ar * (b1 + (b2 - b1) * t / T)
    e = -_mpe.diff(lam, T / 2)
    o = {"e": abs(e), "dphi": (b2 - b1) * Ar, "rate": (b2 - b1) * Ar / T}
    o = {k: float(x) for k, x in o.items() if abs(x) > 1e-12}
    add("induced-emf", _ie_dflt(mode=2, N=N, B1=B1, B2=B2, A=A_cm2, dt=dt_ms), o, 1e-7)
    _mpe.mp.dps = 15
def ie3(N, Bm, A_cm2, rpm, al):
    _mpe.mp.dps = 30
    Ar = _mpe.mpf(str(A_cm2)) * _mpe.mpf("1e-4"); b = _mpe.mpf(str(Bm)); w = 2 * _mpe.pi * _mpe.mpf(str(rpm)) / 60
    lam = lambda t: N * b * Ar * _mpe.cos(w * t)
    emf = lambda t: -_mpe.diff(lam, t)
    Tp = 2 * _mpe.pi / w
    Em = abs(emf(Tp / 4))
    erms = _mpe.sqrt(_mpe.quad(lambda t: emf(t) ** 2, [0, Tp / 4, Tp / 2, 3 * Tp / 4, Tp]) / Tp)
    ea = emf(_mpe.radians(al) / w)
    o = {"w": w, "f": _mpe.mpf(str(rpm)) / 60, "Em": Em, "Erms": erms, "e": ea}
    o = {k: float(x) for k, x in o.items() if abs(x) > 1e-9}
    add("induced-emf", _ie_dflt(mode=3, N=N, Bm=Bm, A=A_cm2, rpm=rpm, al=al), o, 1e-6)
    _mpe.mp.dps = 15
for _ in range(12):
    ie1(round(rie.uniform(0.05, 2), 3), round(rie.uniform(0.05, 3), 3), round(rie.uniform(0.5, 60), 2), rie.choice([15, 30, 45, 60, 75, 90, 120, 135, 150, 165]), round(rie.uniform(0.1, 50), 2))
for _ in range(12):
    ie2(rie.choice([1, 10, 50, 200, 1000]), round(rie.uniform(-1.5, 1.5), 3), round(rie.uniform(-1.5, 1.5), 3), round(rie.uniform(1, 400), 1), round(rie.uniform(0.5, 500), 2))
for _ in range(12):
    ie3(rie.choice([1, 20, 100, 500]), round(rie.uniform(0.05, 1.5), 3), round(rie.uniform(5, 500), 1), rie.choice([60, 300, 750, 1000, 1500, 3000, 3600]), rie.choice([0, 15, 30, 60, 90, 120, 200, 270, 330]))
for a_ in ((0.5, 0.4, 10, 90, 2), (0.5, 0.4, 10, 30, 2), (1.2, 2.5, 25, 90, 0.5)):
    ie1(*a_)
for a_ in ((100, 0, 0.8, 50, 20), (100, 0.5, -0.5, 100, 10), (1, 0.2, 0.2, 10, 5)):
    ie2(*a_)
for a_ in ((100, 0.5, 50, 1500, 90), (100, 0.5, 50, 1500, 30), (500, 1.2, 200, 3000, 45)):
    ie3(*a_)

# --- v1.97.3 work: alternator-emf (own stream, earlier vectors unchanged) ---
# Written without the closed forms the engine uses (Kp = cos(alpha/2), Kd = sin(q g/2) / (q sin(g/2)), E = 4.44 Kw f phi T, E0 = |V + Ia (Ra + j Xs)| in components):
#  case 1: the winding factor is found slot by slot. The phase belt is q adjacent slots under one pole; slot k has the conductor-EMF phasor exp(j k g) with g = pi / (3 q); a coil with its sides in slot k and slot
#          k + span has the EMF exp(j k g) - exp(j (k + span) g); Kw = |sum over the belt| / (2 q), so a full-pitch coil (span = 3 q) gives 2 exp(j k g) and Kp = 1 follows from the sum, not from the cosine.
#          Kp and Kd are then each taken from their own phasor sums (pitch: |1 - exp(j (3q - span) ... )| form with the coil EMF, distribution: |sum exp(j k g)| / q). The EMF is Faraday's law:
#          flux linkage lambda(t) = T Kw Phi cos(w t) with w = 2 pi f, e = -d lambda / dt by mpmath.diff, rms from mpmath.quad of e^2 over one period.
#  case 2: the armature current is a phasor in polar form, I = Ia at -phi (lagging) or +phi (leading); the synchronous impedance is |Zs| at atan2(Xs, Ra); E0 = V + I Zs is added as complex numbers by mpmath
#          and its modulus and argument are taken; the regulation is |E0| / V - 1.
import mpmath as _mpa
raa = random.Random(20261973)
def _aa_dflt(**k):
    d = {"mode": 1, "poles": 4, "N": 1500, "phi": 50, "q": 3, "span": 8, "T": 48, "conn": 1, "VL": 6600, "IL": 100, "pf": 0.8, "lead": 0, "Ra": 1, "Xs": 20}
    d.update(k); return d
def aa1(poles, N, phi, q, span, T, conn):
    _mpa.mp.dps = 30
    g = _mpa.pi / (3 * q); ph = lambda k: _mpa.expjpi(_mpa.mpf(k) * g / _mpa.pi)
    belt = sum(ph(k) - ph(k + span) for k in range(q)); Kw = abs(belt) / (2 * q)
    Kd = abs(sum(ph(k) for k in range(q))) / q
    Kp = abs(ph(0) - ph(span)) / abs(ph(0) - ph(3 * q))
    f = _mpa.mpf(poles) * N / 120; w = 2 * _mpa.pi * f; Phi = _mpa.mpf(str(phi)) / 1000
    lam = lambda t: T * Kw * Phi * _mpa.cos(w * t)
    emf = lambda t: -_mpa.diff(lam, t)
    Tp = 1 / f
    Eph = _mpa.sqrt(_mpa.quad(lambda t: emf(t) ** 2, [0, Tp / 4, Tp / 2, 3 * Tp / 4, Tp]) / Tp)
    Ei = Eph / Kw
    o = {"f": f, "Ns": 3 * q * poles, "gam": _mpa.degrees(g), "al": _mpa.degrees((3 * q - span) * g), "Kp": Kp, "Kd": Kd, "Kw": Kw, "Ei": Ei, "Eph": Eph, "El": Eph * _mpa.sqrt(3) if conn == 1 else Eph}
    o = {k: float(x) for k, x in o.items() if abs(x) > 1e-9}
    add("alternator-emf", _aa_dflt(mode=1, poles=poles, N=N, phi=phi, q=q, span=span, T=T, conn=conn), o, 1e-7)
    _mpa.mp.dps = 15
def aa2(VL, IL, pf, lead, Ra, Xs, conn):
    _mpa.mp.dps = 30
    VL_, IL_ = _mpa.mpf(str(VL)), _mpa.mpf(str(IL))
    Vp = VL_ / _mpa.sqrt(3) if conn == 1 else VL_
    Ip = IL_ if conn == 1 else IL_ / _mpa.sqrt(3)
    phi = _mpa.acos(_mpa.mpf(str(pf)))
    Zs = _mpa.mpc(_mpa.mpf(str(Ra)), _mpa.mpf(str(Xs))); Zm, Za = abs(Zs), _mpa.arg(Zs)
    drop = _mpa.mpc(Ip * Zm * _mpa.cos(Za + (phi if lead else -phi)), Ip * Zm * _mpa.sin(Za + (phi if lead else -phi)))
    E = Vp + drop; E0 = abs(E); S = _mpa.sqrt(3) * VL_ * IL_ / 1000
    o = {"Vph": Vp, "Iph": Ip, "dR": Ip * _mpa.mpf(str(Ra)), "dX": Ip * _mpa.mpf(str(Xs)), "E0": E0, "E0l": E0 * _mpa.sqrt(3) if conn == 1 else E0, "reg": (E0 / Vp - 1) * 100, "dl": _mpa.degrees(_mpa.arg(E)), "S": S, "P": S * _mpa.mpf(str(pf))}
    o = {k: float(x) for k, x in o.items() if abs(x) > 1e-9}
    add("alternator-emf", _aa_dflt(mode=2, VL=VL, IL=IL, pf=pf, lead=lead, Ra=Ra, Xs=Xs, conn=conn), o, 1e-9)
    _mpa.mp.dps = 15
for _ in range(18):
    _q = raa.randint(1, 8)
    aa1(raa.choice([2, 4, 6, 8, 10, 12, 16, 24]), raa.choice([100, 250, 375, 500, 750, 1000, 1500, 3000, 3600]), round(raa.uniform(2, 400), 1), _q, raa.randint(max(1, 3 * _q - 4), 3 * _q), raa.choice([4, 12, 24, 48, 96, 200, 540]), raa.choice([1, 2]))
for _ in range(18):
    aa2(raa.choice([415, 690, 3300, 6600, 11000, 13800, 22000]), round(raa.uniform(5, 2500), 1), round(raa.uniform(0.5, 1), 2), raa.choice([0, 0, 1]), round(raa.uniform(0, 3), 3), round(raa.uniform(0.5, 60), 3), raa.choice([1, 2]))
for a_ in ((4, 1500, 50, 3, 8, 48, 1), (4, 1500, 50, 3, 9, 48, 1), (2, 3000, 120, 6, 16, 20, 1), (6, 1000, 30, 1, 3, 100, 2), (4, 1500, 50, 2, 3, 100, 1)):
    aa1(*a_)
for a_ in ((6600, 100, 0.8, 0, 1, 20, 1), (6600, 100, 0.8, 1, 1, 20, 1), (3300, 150, 0.8, 0, 0.4, 9, 2), (11000, 60, 1, 0, 1.5, 18, 1), (415, 40, 0.9, 0, 0, 2.5, 1)):
    aa2(*a_)

# --- v1.97.4 work: pwm-inverter (own stream, earlier vectors unchanged) ---
# Written without the Bessel-function closed form the engine uses. The real PWM waveform is built from its exact switching instants:
# a triangular carrier (peak +1 at t = 0, mf cycles per fundamental period) is compared with the reference wave and each crossing is found numerically
# (mpmath findroot, 28 digits). A pole output is +1 while the reference is above the carrier and -1 below, in units of Vdc / 2.
# The Fourier coefficient at every harmonic is then integrated exactly over the constant-level intervals. Topologies come from the waveform itself:
#  half bridge = one pole; bipolar full bridge = twice one pole (output +-Vdc); unipolar full bridge = pole a minus pole b with the reference of leg b inverted;
#  three-phase line voltage = pole a minus pole b with leg b shifted by -120 degrees, and the phase voltage the load sees is the line voltage / sqrt(3).
# The harmonic percentages are the coefficient at m mf +- n divided by the fundamental coefficient; the cancellation rules (unipolar: no odd carrier groups; three-phase line voltage:
# none where n is a multiple of 3) come out of the waveform, they are not written in. Currents add the harmonic voltages divided by the series R-L impedance at each frequency.
# Third-harmonic injection uses the reference cos(t) - cos(3t) / 6 and only its fundamental is compared. Random vectors use whole mf of 27 and above (carrier groups then do
# not overlap in frequency), so the tolerance is 1e-8; the low-mf named cases use 1e-6.
import mpmath as mp

# Independent reference for pwm-inverter. No Bessel functions and none of the engine's closed forms:
# the real PWM waveform is built from exact switching instants (reference = carrier, solved numerically),
# then its Fourier coefficients are integrated exactly over the constant-level intervals.
# Time is in fundamental periods (T1 = 1), carrier = triangle with its peak (+1) at t = 0, so the carrier
# has mf cycles per fundamental period. A pole output is +1 while reference > carrier, else -1 (units of Vdc/2).

def _breaks(refun, mf):
    """Switching instants of one pole over t in [0, 1). The carrier is a straight line on each segment
    [k / (2 mf), (k + 1) / (2 mf)]: +1 -> -1 for even k, -1 -> +1 for odd k. Returns (level at t = 0, [(time, new level)])."""
    n = int(mf)
    out = []
    lvl0 = None
    for k in range(2 * n):
        a, b = mp.mpf(k) / (2 * n), mp.mpf(k + 1) / (2 * n)
        ca, cb = (1, -1) if k % 2 == 0 else (-1, 1)
        g = lambda t: refun(t) - (ca + (cb - ca) * (t - a) / (b - a))
        ga, gb = g(a), g(b)
        if lvl0 is None:
            lvl0 = 1 if ga > 0 else -1
        if ga * gb < 0:
            t = mp.findroot(g, (a, b), solver='anderson', tol=1e-28, maxsteps=200)
            out.append((t, 1 if gb > 0 else -1))
    return lvl0, out

def pole_coeffs(refun, mf, ks):
    """Two-sided Fourier integral X_k = integral over one fundamental period of v(t) exp(-j 2 pi k t) dt, for each k in ks."""
    lvl0, sw = _breaks(refun, mf)
    edges = [mp.mpf(0)] + [t for t, _ in sw] + [mp.mpf(1)]
    levels = [lvl0] + [l for _, l in sw]
    res = {}
    for k in ks:
        if k == 0:
            res[k] = sum(lv * (edges[i + 1] - edges[i]) for i, lv in enumerate(levels))
            continue
        w = -2j * mp.pi * k
        res[k] = sum(lv * (mp.exp(w * edges[i + 1]) - mp.exp(w * edges[i])) / w for i, lv in enumerate(levels))
    return res

def pwm_ref(topo, mod, Vdc, ma, fc, f1, R, L):
    """Return the calculator outputs computed from the real waveform. mf = fc / f1 must be a whole number."""
    mp.mp.dps = 30
    ma, Vdc, fc, f1, R, L = [mp.mpf(str(x)) for x in (ma, Vdc, fc, f1, R, L)]
    mf = fc / f1
    nmf = int(mp.nint(mf))
    assert abs(mf - nmf) < 1e-20
    three = topo == 4
    inj = mod == 2
    lim = 2 / mp.sqrt(3) if inj else mp.mpf(1)
    if inj:
        base = lambda th: ma * (mp.cos(th) - mp.cos(3 * th) / 6)
    else:
        base = lambda th: ma * mp.cos(th)
    two_pi = 2 * mp.pi
    ra = lambda t: base(two_pi * t)
    # second leg: opposite sign (unipolar single phase) or -120 degrees (three phase)
    rb = (lambda t: base(two_pi * t - 2 * mp.pi / 3)) if three else (lambda t: -base(two_pi * t))
    # harmonic components of the listed groups: (m, n) with n = 0 (one component) or +-n (two components)
    groups = [(1, [0]), (1, [2, -2]), (2, [1, -1]), (2, [3, -3]), (3, [0]), (3, [2, -2])]
    ks = sorted({1} | {abs(m * nmf + n) for m, ns in groups for n in ns})
    Xa = pole_coeffs(ra, nmf, ks)
    Xb = pole_coeffs(rb, nmf, ks) if topo in (3, 4) else None
    if topo == 1:
        X = Xa            # half bridge: pole voltage, units of Vdc/2
    elif topo == 2:
        X = {k: 2 * Xa[k] for k in ks}   # full bridge bipolar: output is +-Vdc = 2 x the pole level
    else:
        X = {k: Xa[k] - Xb[k] for k in ks}   # unipolar leg difference, or three-phase line voltage
    amp = {k: 2 * abs(X[k]) for k in ks}     # one-sided amplitude in units of Vdc/2
    unit = Vdc / 2
    # fundamental, as the voltage the load phase sees
    if three:
        V1pk = amp[1] / mp.sqrt(3) * unit      # phase peak from the line-voltage fundamental
        VLL = amp[1] * unit / mp.sqrt(2)
    else:
        V1pk = amp[1] * unit
        VLL = None
    V1 = V1pk / mp.sqrt(2)
    Vmax = (mp.sqrt(3) if three else 1) * lim * (Vdc if topo in (2, 3) else Vdc / 2) / mp.sqrt(2)
    w1 = two_pi * f1
    Z1 = mp.sqrt(R * R + (w1 * L) ** 2)
    phi = mp.degrees(mp.atan2(w1 * L, R))
    I1 = V1 / Z1
    out = {"mf": mf, "lim": lim, "V1pk": V1pk, "V1": V1, "Vmax": Vmax, "Z1": Z1, "phi": phi, "I1": I1}
    if three:
        out["VLL"] = VLL
    nph = 3 if three else 1
    if not inj:
        names = ["h1", "h2", "h3", "h4", "h5", "h6"]
        s2 = mp.mpf(0)
        i2 = mp.mpf(0)
        for name, (m, ns) in zip(names, groups):
            v = amp[abs(m * nmf + ns[0])] / amp[1] * 100
            # a group with a +- pair has two equal sidebands; the percentage is that of one sideband
            out[name] = v
            for n in ns:
                k = abs(m * nmf + n)
                r = amp[k] / amp[1]
                s2 += r * r
                Vh = (amp[k] / (mp.sqrt(3) if three else 1)) * unit / mp.sqrt(2)
                Zh = mp.sqrt(R * R + (two_pi * k * f1 * L) ** 2)
                i2 += (Vh / Zh) ** 2
        out["thd"] = mp.sqrt(s2) * 100
        out["Ih"] = mp.sqrt(i2)
        It = mp.sqrt(I1 ** 2 + i2)
    else:
        It = I1
    out["It"] = It
    out["P"] = nph * R * It ** 2
    return out

rpw = random.Random(20261974)
def _pw_dflt(**k):
    d = {"topo": 4, "mod": 1, "Vdc": 600, "ma": 0.8, "fc": 1950, "f1": 50, "R": 5, "L": 0.01}
    d.update(k); return d
def pw(tol=1e-8, **k):
    d = _pw_dflt(**k)
    o = pwm_ref(d["topo"], d["mod"], d["Vdc"], d["ma"], d["fc"], d["f1"], d["R"], d["L"])
    o = {n: (0.0 if abs(x) < 1e-20 else float(x)) for n, x in o.items()}
    add("pwm-inverter", dict(d, L=round(d["L"] * 1000, 9)), o, tol)   # the API takes L in mH, the reference works in henries
    mp.mp.dps = 15
def _pw_rand(topo, mod):
    f1 = rpw.choice([25, 50, 60, 100, 400])
    mf = rpw.choice([27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 99]) if topo == 4 else rpw.choice([27, 29, 31, 35, 41, 49, 55, 61, 75, 91])
    ma = round(rpw.uniform(0.15, 1.14), 3) if mod == 2 else round(rpw.uniform(0.15, 0.98), 3)
    pw(topo=topo, mod=mod, Vdc=rpw.choice([48, 110, 311, 400, 540, 600, 750, 1200]), ma=ma, fc=mf * f1, f1=f1, R=round(rpw.uniform(0.5, 60), 2), L=round(rpw.uniform(0.0001, 0.06), 5))
for t_ in (1, 2, 3):
    for _ in range(9):
        _pw_rand(t_, 1)
for _ in range(9):
    _pw_rand(4, 1)
for _ in range(7):
    _pw_rand(4, 2)
for k_, tol_ in (({}, 1e-8), (dict(topo=1, Vdc=400), 1e-8), (dict(topo=2, Vdc=400, ma=0.9, fc=1050, R=8, L=0.02), 1e-6), (dict(topo=3, Vdc=400, ma=0.9, R=8, L=0.02), 1e-8),
                 (dict(mod=2, ma=1.1), 1e-8), (dict(topo=1, Vdc=100, ma=0.999, fc=1050), 1e-6), (dict(L=0), 1e-8), (dict(ma=0.5, fc=4950, Vdc=540), 1e-8)):
    pw(tol_, **k_)

# --- v1.97.5 work: second-order-response (own stream, earlier vectors unchanged) ---
# Written without the textbook closed forms the engine uses (the underdamped, critically damped and overdamped step-response formulas, the overshoot and peak-time
# expressions). The system y'' + 2 z y' + y = u in time x = wn t is written as the state z' = A z with state (y - 1, y'), z(0) = (-1, 0), and propagated with the
# matrix exponential, one formula for every damping ratio. The poles are the eigenvalues of A wn. The peak is the root of y' (brentq), the 10% and 90% rise times
# and the 2% and 5% settling times are found by scanning the response on a fine grid (the settling time is the last grid point outside the band) and refining each
# crossing with brentq to 1e-14. For the overshoot case the damping ratio is the root of exp(-pi z / sqrt(1 - z^2)) = OS / 100. Needs numpy and scipy.
import numpy as _np2
from scipy.linalg import expm
from scipy.optimize import brentq

# Independent reference for second-order-response. The step response is not taken from the textbook closed forms:
# the system y'' + 2 z y' + y = u (time in units of 1/wn) is written as the state z' = A z with state (y - 1, y'),
# z(0) = (-1, 0), and propagated with the matrix exponential, one formula for every damping ratio. Peak, rise and
# settling times are found by scanning the response on a fine grid and refining each crossing with brentq (1e-14).
def _resp(A, x):
    return expm(A * x) @ _np2.array([-1.0, 0.0])

def second_ref(zeta, wn, K=1.0):
    z = float(zeta); wn = float(wn); K = float(K)
    A = _np2.array([[0.0, 1.0], [-1.0, -2.0 * z]])
    yv = lambda x: _resp(A, x)[0] + 1.0
    dy = lambda x: _resp(A, x)[1]
    poles = _np2.linalg.eigvals(A * wn)
    out = {"zeta": z, "wn": wn, "K": K, "yfin": K}
    if z < 1 - 1e-9:
        out["pa"] = float(poles[0].real); out["wd"] = float(abs(poles[0].imag))
        s = _np2.sqrt(1 - z * z)
        xp = brentq(dy, 0.9 * _np2.pi / s, 1.1 * _np2.pi / s, xtol=1e-14, rtol=1e-14)
        ypk = yv(xp)
        out["tp"] = xp / wn; out["Mp"] = (ypk - 1) * 100; out["ypk"] = K * ypk
        X = 20.0 / z; step = 0.02
    else:
        pr = sorted(poles.real)   # slower pole is the one closer to zero
        out["pa"] = float(pr[-1]); out["pb"] = float(pr[0])
        X = 24.0 * z + 40.0; step = 0.02 * max(1.0, z)
    xs = _np2.arange(0.0, X, step)
    ys = _np2.array([yv(x) for x in xs])
    def first_cross(level):
        i = int(_np2.argmax(ys >= level)); assert ys[i] >= level and i > 0
        return brentq(lambda x: yv(x) - level, xs[i - 1], xs[i], xtol=1e-14, rtol=1e-14)
    out["tr"] = (first_cross(0.9) - first_cross(0.1)) / wn
    for band, key in ((0.02, "ts2"), (0.05, "ts5")):
        outside = _np2.where(_np2.abs(ys - 1.0) > band)[0]
        i = int(outside[-1]); assert i + 1 < len(xs)
        x = brentq(lambda x: abs(yv(x) - 1.0) - band, xs[i], xs[i + 1], xtol=1e-14, rtol=1e-14)
        out[key] = x / wn
    if z < 1 - 1e-9: out["ts2a"] = 4.0 / (z * wn)
    return out

def zeta_from_overshoot(os_pct):
    f = lambda z: _np2.exp(-_np2.pi * z / _np2.sqrt(1 - z * z)) - os_pct / 100.0
    return brentq(f, 1e-9, 1 - 1e-12, xtol=1e-15, rtol=1e-15)

add("second-order-response", {"mode": 1, "zeta": 5.5591, "wn": 54.714, "K": 4.856, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 5.5591, "wn": 54.714, "K": 4.856, "yfin": 4.856, "pa": -4.96158801874401, "pb": -603.3596067812559, "tr": 0.44284704377670825, "ts2": 0.7901261162050521, "ts5": 0.6054492086479224}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.0615, "wn": 2.045, "K": 3.988, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.0615, "wn": 2.045, "K": 3.988, "yfin": 3.988, "pa": -0.12576750000000003, "wd": 2.041128985621377, "tp": 1.5391445987591041, "Mp": 82.40085537809377, "ypk": 7.2741461124783795, "tr": 0.5232661773782826, "ts2": 30.921996455307276, "ts5": 23.29568028473418, "ts2a": 31.80471902518536}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 5.6912, "wn": 138.64, "K": 3.435, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 5.6912, "wn": 138.64, "K": 3.435, "yfin": 3.435, "pa": -12.275700744725782, "pb": -1565.7802352552742, "tr": 0.17898974793508904, "ts2": 0.3193213952369022, "ts5": 0.24467875357200025}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 7.6875, "wn": 154.118, "K": 0.99, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 7.6875, "wn": 154.118, "K": 0.99, "yfin": 0.99, "pa": -10.06670167590164, "pb": -2359.4975483240983, "tr": 0.21826658304538019, "ts2": 0.3890349310752095, "ts5": 0.2980129894925328}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.4828, "wn": 122.892, "K": 3.561, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.4828, "wn": 122.892, "K": 3.561, "yfin": 3.561, "pa": -59.3322576, "wd": 107.6202902434631, "tp": 0.029191453084569392, "Mp": 17.693111302151788, "ypk": 4.191051693469625, "tr": 0.013059776341162335, "ts2": 0.0667833061750733, "ts5": 0.04294835448594294, "ts2a": 0.06741695262915463}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.3505, "wn": 3.514, "K": 3.062, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.3505, "wn": 3.514, "K": 3.062, "yfin": 3.062, "pa": -1.2316569999999998, "wd": 3.2910814384258247, "tp": 0.954577609933736, "Mp": 30.85991185578485, "ypk": 4.006930501024132, "tr": 0.39546736814944616, "ts2": 3.124040773121871, "ts5": 2.241802049436856, "ts2a": 3.2476574241042764}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.3212, "wn": 202.796, "K": 1.11, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.3212, "wn": 202.796, "K": 1.11, "yfin": 1.11, "pa": -65.1380752, "wd": 192.05012047702323, "tp": 0.016358191527225098, "Mp": 34.454136959315186, "ypk": 1.4924409202483986, "tr": 0.006653131303459383, "ts2": 0.05504109353652898, "ts5": 0.03919358842941518, "ts2a": 0.06140801655127815}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 5.2317, "wn": 50.925, "K": 3.044, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 5.2317, "wn": 50.925, "K": 3.044, "yfin": 3.044, "pa": -4.9122501312773466, "pb": -527.9363948687226, "tr": 0.44729493914171004, "ts2": 0.7982841027985705, "ts5": 0.6117523286855343}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 1.489, "wn": 8.938, "K": 2.35, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 1.489, "wn": 8.938, "K": 2.35, "yfin": 2.35, "pa": -3.4479937594599903, "pb": -23.16937024054001, "tr": 0.64946082277035, "ts2": 1.1813104372232175, "ts5": 0.915564383741684}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 1.1397, "wn": 86.249, "K": 4.186, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 1.1397, "wn": 86.249, "K": 4.186, "yfin": 4.186, "pa": -51.14288045398132, "pb": -145.45309014601867, "tr": 0.047127590173587273, "ts2": 0.08496139985954415, "ts5": 0.06703503326832018}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 3.7059, "wn": 131.975, "K": 2.136, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 3.7059, "wn": 131.975, "K": 2.136, "yfin": 2.136, "pa": -18.142563582756793, "pb": -960.0297414172431, "tr": 0.12111045793042069, "ts2": 0.21667840674616645, "ts5": 0.16617337598276172}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.2061, "wn": 52.217, "K": 2.041, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.2061, "wn": 52.217, "K": 2.041, "yfin": 2.041, "pa": -10.7619237, "wd": 51.09594981283133, "tp": 0.06148418152706235, "Mp": 51.59795890687735, "ypk": 3.094114341289367, "tr": 0.023173289300874558, "ts2": 0.3279287157427253, "ts5": 0.26192915995397, "ts2a": 0.3716807618697389}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.4528, "wn": 0.844, "K": 3.385, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.4528, "wn": 0.844, "K": 3.385, "yfin": 3.385, "pa": -0.3821631999999999, "wd": 0.7525206233491277, "tp": 4.1747595429451465, "Mp": 20.281937666123852, "ypk": 4.071543589998292, "tr": 1.8374816907859242, "ts2": 9.877909167620329, "ts5": 6.22067410646339, "ts2a": 10.466732537303436}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.1592, "wn": 0.573, "K": 4.814, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.1592, "wn": 0.573, "K": 4.814, "yfin": 4.814, "pa": -0.09122160000000003, "wd": 0.5656921598302739, "tp": 5.553537553945188, "Mp": 60.253918322660205, "ypk": 7.714623628052863, "tr": 2.0260832179850765, "ts2": 40.3440825321822, "ts5": 29.402366743112978, "ts2a": 43.849263770861285}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 1.4217, "wn": 66.449, "K": 2.913, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 1.4217, "wn": 66.449, "K": 2.913, "yfin": 2.913, "pa": -27.31986236229713, "pb": -161.62122423770288, "tr": 0.08241720765058112, "ts2": 0.1499711888125449, "ts5": 0.11643182661630753}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.3902, "wn": 1.019, "K": 0.418, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.3902, "wn": 1.019, "K": 0.418, "yfin": 0.418, "pa": -0.3976137999999999, "wd": 0.9382239956692431, "tp": 3.3484462858455153, "Mp": 26.41103021788984, "ypk": 0.5283981063107795, "tr": 1.4212884874465799, "ts2": 8.252518114788092, "ts5": 7.542778444374288, "ts2a": 10.06001300759682}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.8746, "wn": 1.248, "K": 0.938, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.8746, "wn": 1.248, "K": 0.938, "yfin": 0.938, "pa": -1.0915008000000002, "wd": 0.6050867736113225, "tp": 5.191970458782161, "Mp": 0.34580863901627623, "ypk": 0.9412436850339726, "tr": 2.2202042773154496, "ts2": 3.551093061946165, "ts5": 3.078490582956888, "ts2a": 3.6646789448070027}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.7249, "wn": 5.074, "K": 2.144, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.7249, "wn": 5.074, "K": 2.144, "yfin": 2.144, "pa": -3.6781426, "wd": 3.495245773055916, "tp": 0.8988188120582633, "Mp": 3.666312628758095, "ypk": 2.2226057427605737, "tr": 0.4344269802415307, "ts2": 1.1631788511641903, "ts5": 0.5927917010475655, "ts2a": 1.0875054164566649}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 1.764, "wn": 38.611, "K": 4.421, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 1.764, "wn": 38.611, "K": 4.421, "yfin": 4.421, "pa": -12.001550775377012, "pb": -124.21805722462298, "tr": 0.18444456648848248, "ts2": 0.33442606952967546, "ts5": 0.25807837505055153}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 7.5762, "wn": 22.378, "K": 3.203, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 7.5762, "wn": 22.378, "K": 3.203, "yfin": 3.203, "pa": -1.483350860430221, "pb": -337.59705633956986, "tr": 1.4812574933883633, "ts2": 2.6402563556156795, "ts5": 2.022539565665904}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.1219, "wn": 59.744, "K": 1.698, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.1219, "wn": 59.744, "K": 1.698, "yfin": 1.698, "pa": -7.282793599999998, "wd": 59.29845236917907, "tp": 0.05297933635823961, "Mp": 67.98809485766807, "ypk": 2.852437850683204, "tr": 0.01882293782268594, "ts2": 0.5353003399895561, "ts5": 0.3834771076444122, "ts2a": 0.5492397862270874}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 1.8202, "wn": 1.553, "K": 3.331, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 1.8202, "wn": 1.553, "K": 3.331, "yfin": 3.331, "pa": -0.46481737755372077, "pb": -5.1887238224462795, "tr": 4.7565189020537435, "ts2": 8.61816894174296, "ts5": 6.646877040617212}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.1926, "wn": 7.006, "K": 4.109, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.1926, "wn": 7.006, "K": 4.109, "yfin": 4.109, "pa": -1.3493555999999998, "wd": 6.874829122585423, "tp": 0.45697028938056394, "Mp": 53.976823877258376, "ypk": 6.326907693116547, "tr": 0.17064003748985282, "ts2": 2.835469929223249, "ts5": 1.9714510206091735, "ts2a": 2.9643779593755717}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.6123, "wn": 1.124, "K": 4.76, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.6123, "wn": 1.124, "K": 4.76, "yfin": 4.76, "pa": -0.6882252, "wd": 0.8886630824361728, "tp": 3.5351897875373184, "Mp": 8.777252990246476, "ypk": 5.177797242335732, "tr": 1.6763627401235355, "ts2": 5.306541274150959, "ts5": 4.623908590997701, "ts2a": 5.812051055381291}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 4.88, "wn": 28.757, "K": 3.982, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 4.88, "wn": 28.757, "K": 3.982, "yfin": 3.982, "pa": -2.9780119253484827, "pb": -277.6903080746515, "tr": 0.7378159896214572, "ts2": 1.3172563584574564, "ts5": 1.0095709781287845}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.2346, "wn": 15.832, "K": 3.927, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.2346, "wn": 15.832, "K": 3.927, "yfin": 3.927, "pa": -3.7141872, "wd": 15.390160409929337, "tp": 0.2041299486107316, "Mp": 46.8519834384681, "ypk": 5.766877389628642, "tr": 0.07844038885122381, "ts2": 1.0523303307435763, "ts5": 0.6862432425181857, "ts2a": 1.0769516409942934}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 5.1099, "wn": 37.522, "K": 4.053, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 5.1099, "wn": 37.522, "K": 4.053, "yfin": 4.053, "pa": -3.707342823839383, "pb": -379.7599927761606, "tr": 0.5926683244994204, "ts2": 1.0578555820018603, "ts5": 0.810699930255249}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 6.8063, "wn": 80.71, "K": 2.865, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 6.8063, "wn": 80.71, "K": 2.865, "yfin": 2.865, "pa": -5.961412412858408, "pb": -1092.7115335871415, "tr": 0.36857449630662775, "ts2": 0.6571418456565363, "ts5": 0.5034382149703296}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.1561, "wn": 292.4, "K": 4.68, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.1561, "wn": 292.4, "K": 4.68, "yfin": 4.68, "pa": -45.64363999999999, "wd": 288.8155434313575, "tp": 0.01087750547032607, "Mp": 60.86639658419828, "ypk": 7.528547360140479, "tr": 0.003959765514302993, "ts2": 0.07926044605493855, "ts5": 0.06589616060454122, "ts2a": 0.08763542960202124}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.8933, "wn": 242.755, "K": 0.982, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.8933, "wn": 242.755, "K": 0.982, "yfin": 0.982, "pa": -216.85304150000002, "wd": 109.1088833102021, "tp": 0.028793188586286704, "Mp": 0.1942284309594644, "ypk": 0.9839073231920219, "tr": 0.011752488529373346, "ts2": 0.01906212788203573, "ts5": 0.016346335034033113, "ts2a": 0.01844567165086315}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 67.82, "tp": 4.12, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.12267036061193132, "wn": 0.7683252877786866, "K": 1.0, "yfin": 1.0, "pa": -0.09425074011907741, "wd": 0.7625224887353866, "tp": 4.119999999999995, "Mp": 67.81999999999977, "ypk": 1.6781999999999977, "tr": 1.4645969768908889, "ts2": 41.51445246536835, "ts5": 29.794276129171248, "ts2a": 42.439985032970114}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 76.26, "tp": 1.3007, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.08594962538404469, "wn": 2.424280270266479, "K": 1.0, "yfin": 1.0, "pa": -0.20836598105533444, "wd": 2.4153091824323774, "tp": 1.3006999999999984, "Mp": 76.2599999999999, "ypk": 1.762599999999999, "tr": 0.45023974559718255, "ts2": 18.408802865757774, "ts5": 14.378105107548592, "ts2a": 19.196991657374937}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 46.39, "tp": 2.5662, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.23749434528004243, "wn": 1.2602776258034187, "K": 1.0, "yfin": 1.0, "pa": -0.29930880961126927, "wd": 1.2242197231664693, "tp": 2.566199999999998, "Mp": 46.38999999999942, "ypk": 1.4638999999999942, "tr": 0.988028891283107, "ts2": 13.136817034067759, "ts5": 8.611028525256009, "ts2a": 13.364123846521746}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 11.35, "tp": 4.3142, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.5693875076446909, "wn": 0.8858112469718586, "K": 1.0, "yfin": 1.0, "pa": -0.5043698581569422, "wd": 0.7281981951670746, "tp": 4.3142, "Mp": 11.350000000000016, "ypk": 1.1135000000000002, "tr": 2.012310753701818, "ts2": 6.635680921320129, "ts5": 5.958595147463418, "ts2a": 7.930688036388049}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 58.55, "tp": 1.1169, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.16796704527352604, "wn": 2.853316995411175, "K": 1.0, "yfin": 1.0, "pa": -0.47926322494794993, "wd": 2.812778810627445, "tp": 1.1168999999999982, "Mp": 58.54999999999961, "ypk": 1.5854999999999961, "tr": 0.40998926556927073, "ts2": 8.020609273775213, "ts5": 5.862193363739911, "ts2a": 8.346144230937844}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 14.0, "tp": 1.8013, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.5305067124853201, "wn": 2.057460521057943, "K": 1.0, "yfin": 1.0, "pa": -1.091496617094783, "wd": 1.744069646138785, "tp": 1.8013000000000003, "Mp": 14.000000000000036, "ypk": 1.1400000000000003, "tr": 0.8255589571532703, "ts2": 2.809089390051693, "ts5": 2.5746467453020827, "ts2a": 3.6646929888309945}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 58.4, "tp": 2.9937, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.16874910489624687, "wn": 1.0646696811344452, "K": 1.0, "yfin": 1.0, "pa": -0.1796620557016102, "wd": 1.0494012939138164, "tp": 2.993699999999996, "Mp": 58.39999999999963, "ypk": 1.5839999999999963, "tr": 1.0995223940352645, "ts2": 21.46842332764057, "ts5": 15.69869152014863, "ts2a": 22.264022218711318}, 1e-06)
add("second-order-response", {"mode": 2, "zeta": 0.5, "wn": 10, "K": 1, "OS": 78.99, "tp": 3.0772, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.07486237974027588, "wn": 1.023798636171109, "K": 1.0, "yfin": 1.0, "pa": -0.07664400227861809, "wd": 1.0209257291010636, "tp": 3.0771999999999973, "Mp": 78.9899999999999, "ypk": 1.789899999999999, "tr": 1.0565445370328463, "ts2": 49.7440377104935, "ts5": 37.480972040099594, "ts2a": 52.18934138458877}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 21.615, "a0": 1320.94, "b0": 178.05}, {"zeta": 0.2973607876706679, "wn": 36.344738271172076, "K": 0.13479037655003256, "yfin": 0.13479037655003256, "pa": -10.807499999999996, "wd": 34.70069082525592, "tp": 0.09053400894553021, "Mp": 37.589467230675375, "ypk": 0.185457360973411, "tr": 0.03626233568022441, "ts2": 0.30914950311017175, "ts5": 0.28140550684322396, "ts2a": 0.37011334721258393}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 7.569, "a0": 331.58, "b0": 2209.64}, {"zeta": 0.20783292315212173, "wn": 18.20933826364923, "K": 6.663972495325412, "yfin": 6.663972495325412, "pa": -3.784500000000001, "wd": 17.811725344558845, "tp": 0.17637778445474897, "Mp": 51.29885646096868, "ypk": 10.082514180300828, "tr": 0.06655541822350572, "ts2": 0.9394818301976519, "ts5": 0.7499256885550918, "ts2a": 1.0569427929713304}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 10.983, "a0": 1310.53, "b0": 1004.8}, {"zeta": 0.15169368601487296, "wn": 36.2012430725797, "K": 0.7667127040205107, "yfin": 0.7667127040205107, "pa": -5.491500000000001, "wd": 35.7823060708781, "tp": 0.08779737804955548, "Mp": 61.746104248758286, "ypk": 1.2401279295334888, "tr": 0.031861945871909395, "ts2": 0.7116037887584865, "ts5": 0.5393898036013574, "ts2a": 0.728398433943367}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 38.085, "a0": 827.79, "b0": 1908.78}, {"zeta": 0.6618565580212897, "wn": 28.771339906233077, "K": 2.305874678360454, "yfin": 2.305874678360454, "pa": -19.0425, "wd": 21.567874112902274, "tp": 0.14566074695838646, "Mp": 6.242778851594188, "ypk": 2.449825335125406, "tr": 0.07003177581570852, "ts2": 0.20893451989221595, "ts5": 0.171776054271865, "ts2a": 0.2100564526716555}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 21.515, "a0": 563.66, "b0": 2131.63}, {"zeta": 0.45310906055909134, "wn": 23.741524803600967, "K": 3.7817656033779232, "yfin": 3.7817656033779232, "pa": -10.757499999999997, "wd": 21.16450315386591, "tp": 0.1484368723777935, "Mp": 20.25416661968751, "ypk": 4.547730709852118, "tr": 0.06534435274314099, "ts2": 0.35111677711030775, "ts5": 0.22115599283989365, "ts2a": 0.37183360446200325}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 195.662, "a0": 731.51, "b0": 2747.01}, {"zeta": 3.6171486682916063, "wn": 27.046441540431893, "K": 3.755259668357234, "yfin": 3.755259668357234, "pa": -3.8129455583131175, "pb": -191.8490544416869, "tr": 0.5762646058569363, "ts2": 1.0312494160812131, "ts5": 0.7909389480032141}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 47.638, "a0": 1123.0, "b0": 2122.6}, {"zeta": 0.7107774586505502, "wn": 33.51119216023208, "K": 1.8901157613535173, "yfin": 1.8901157613535173, "pa": -23.818999999999996, "wd": 23.572340549890242, "tp": 0.13327453194309175, "Mp": 4.181642490369297, "ypk": 1.9691536451474432, "tr": 0.06443983966793279, "ts2": 0.17762996690095884, "ts5": 0.08789875882085378, "ts2a": 0.16793316260128469}, 1e-06)
add("second-order-response", {"mode": 3, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 66.569, "a0": 145.52, "b0": 973.47}, {"zeta": 2.7591841992459174, "wn": 12.063167080000177, "K": 6.689595931830676, "yfin": 6.689595931830676, "pa": -2.2629278243348807, "pb": -64.30607217566512, "tr": 0.9712963012005382, "ts2": 1.7445748844349944, "ts5": 1.33966107232812}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.5, "wn": 10, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.5, "wn": 10.0, "K": 1.0, "yfin": 1.0, "pa": -5.0, "wd": 8.660254037844387, "tp": 0.36275987284684363, "Mp": 16.303353482158055, "ypk": 1.1630335348215806, "tr": 0.1637572947328345, "ts2": 0.8076348973928011, "ts5": 0.5289093220304324, "ts2a": 0.8}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 1, "wn": 5, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 1.0, "wn": 5.0, "K": 1.0, "yfin": 1.0, "pa": -5.0, "pb": -5.0, "tr": 0.6715817122955612, "ts2": 1.1667843403834803, "ts5": 0.9487729036781156}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 2, "wn": 3, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 2.0, "wn": 3.0, "K": 1.0, "yfin": 1.0, "pa": -0.803847577293368, "pb": -11.196152422706632, "tr": 2.743078394133789, "ts2": 4.9593078216171085, "ts5": 3.8194266329974975}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.7071, "wn": 100, "K": 1, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.7071, "wn": 100.0, "K": 1.0, "yfin": 1.0, "pa": -70.70999999999998, "wd": 70.71135623080637, "tp": 0.044428403315238715, "Mp": 4.3216522204181596, "ypk": 1.0432165222041816, "tr": 0.02148016984217708, "ts2": 0.059626020304659307, "ts5": 0.02929809570012793, "ts2a": 0.05656908499505021}, 1e-06)
add("second-order-response", {"mode": 1, "zeta": 0.2, "wn": 50, "K": 2, "OS": 16.3, "tp": 0.363, "a1": 10, "a0": 100, "b0": 100}, {"zeta": 0.2, "wn": 50.0, "K": 2.0, "yfin": 2.0, "pa": -9.999999999999998, "wd": 48.98979485566356, "tp": 0.06412749150809312, "Mp": 52.662059933029816, "ypk": 3.0532411986605963, "tr": 0.024068598018506505, "ts2": 0.39203807460874657, "ts5": 0.27488872836542316, "ts2a": 0.4}, 1e-06)

# --- v1.97.6 work: routh-hurwitz (own stream, earlier vectors unchanged) ---
# Written without the Routh table for the counts. The number of roots in the right half plane, on the imaginary axis and in the left half plane comes from the roots
# of the polynomial itself (numpy.roots, the eigenvalues of the companion matrix; a root is on the imaginary axis when |Re| <= 1e-6 max(1, |root|)). The first column
# is built with exact Fractions by the plain Routh recurrence from the definition, and only when the table has no special case (no zero first entry and no zero row).
# Random polynomials are products of integer-root factors (real roots, complex pairs, imaginary pairs with distinct frequencies, at most one root at 0) with an
# integer leading coefficient, so the coefficients are exact. Needs numpy.
import numpy as _np3
from fractions import Fraction

# Independent reference for routh-hurwitz. The counts do NOT come from a Routh table: they come from the roots of the polynomial
# (numpy.roots, the eigenvalues of the companion matrix). A root is on the imaginary axis when |Re| <= 1e-6 max(1, |root|); the
# others are counted by the sign of Re. The first column is built with exact Fractions only when the table has no special case
# (no zero first entry and no zero row), by the plain Routh recurrence written from the definition.
def routh_ref(coefs):
    c = [float(x) for x in coefs]
    n = len(c) - 1
    r = _np3.roots(c)
    tol = lambda z: 1e-6 * max(1.0, abs(z))
    nI = int(sum(1 for z in r if abs(z.real) <= tol(z)))
    nR = int(sum(1 for z in r if z.real > tol(z)))
    nL = n - nR - nI
    out = {"nR": nR, "nI": nI, "nL": nL, "stab": -1 if nR > 0 else (0 if nI > 0 else 1)}
    F = [Fraction(str(x)) for x in coefs]
    w = (n + 2) // 2 + 1
    r0 = F[0::2] + [Fraction(0)] * w; r1 = F[1::2] + [Fraction(0)] * w
    rows = [r0, r1]; ok = True
    for k in range(2, n + 1):
        pv, pp = rows[-1], rows[-2]
        if pv[0] == 0: ok = False; break
        rows.append([(pv[0] * pp[j + 1] - pp[0] * pv[j + 1]) / pv[0] for j in range(w - 1)] + [Fraction(0)])
    if ok and all(any(x != 0 for x in rw) for rw in rows):
        for k, rw in enumerate(rows): out["c%d" % k] = float(rw[0])
    return out

add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 8, "a1": -4, "a0": -40}, {"nR": 1, "nI": 0, "nL": 2, "stab": -1, "c0": 2.0, "c1": 8.0, "c2": 6.0, "c3": -40.0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": -2, "a1": -10, "a0": -8}, {"nR": 0, "nI": 0, "nL": 2, "stab": 1, "c0": -2.0, "c1": -10.0, "c2": -8.0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 1, "a1": 0, "a0": 16}, {"nR": 0, "nI": 2, "nL": 0, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 2, "a5": -4, "a4": -6, "a3": 20, "a2": -92, "a1": 144, "a0": -144}, {"nR": 3, "nI": 2, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": -2, "a3": -6, "a2": 4, "a1": 64, "a0": 96}, {"nR": 1, "nI": 0, "nL": 3, "stab": -1, "c0": -2.0, "c1": -6.0, "c2": -17.333333333333332, "c3": 30.76923076923077, "c4": 96.0}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": -2, "a5": -10, "a4": -10, "a3": 10, "a2": -8, "a1": 20, "a0": 0}, {"nR": 1, "nI": 3, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": -2, "a4": -16, "a3": -90, "a2": -360, "a1": -928, "a0": -1664}, {"nR": 0, "nI": 2, "nL": 3, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 3, "a5": -9, "a4": -21, "a3": -3, "a2": 294, "a1": -144, "a0": -432}, {"nR": 3, "nI": 0, "nL": 3, "stab": -1, "c0": 3.0, "c1": -9.0, "c2": -22.0, "c3": -103.63636363636364, "c4": 239.05263157894737, "c5": -154.557463672391, "c6": -432.0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 1, "a1": -3, "a0": 0}, {"nR": 1, "nI": 1, "nL": 0, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": -4, "a4": 8, "a3": 0, "a2": -16, "a1": 64, "a0": -128}, {"nR": 3, "nI": 2, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": -2, "a4": 0, "a3": 16, "a2": 0, "a1": 18, "a0": 0}, {"nR": 1, "nI": 3, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": 1, "a4": 2, "a3": -38, "a2": 1, "a1": -39, "a0": 0}, {"nR": 1, "nI": 3, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": 1, "a4": -3, "a3": -5, "a2": 25, "a1": -36, "a0": 18}, {"nR": 4, "nI": 0, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": 1, "a3": 3, "a2": -13, "a1": -15, "a0": 0}, {"nR": 1, "nI": 1, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 3, "a1": 0, "a0": 12}, {"nR": 0, "nI": 2, "nL": 0, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 6, "a1": 13, "a0": 0}, {"nR": 0, "nI": 1, "nL": 2, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 3, "a2": 0, "a1": 12, "a0": 0}, {"nR": 0, "nI": 3, "nL": 0, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": -1, "a1": 3, "a0": 0}, {"nR": 1, "nI": 1, "nL": 0, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": 4, "a4": 38, "a3": 100, "a2": 469, "a1": 576, "a0": 1872}, {"nR": 0, "nI": 4, "nL": 2, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": 1, "a4": -1, "a3": 25, "a2": -25, "a1": 144, "a0": -144}, {"nR": 1, "nI": 4, "nL": 0, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": 1, "a3": 3, "a2": -3, "a1": -11, "a0": -6}, {"nR": 1, "nI": 0, "nL": 3, "stab": -1, "c0": 1.0, "c1": 3.0, "c2": 0.6666666666666666, "c3": 16.0, "c4": -6.0}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": 3, "a4": -6, "a3": 15, "a2": -30, "a1": 12, "a0": -24}, {"nR": 1, "nI": 4, "nL": 0, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 2, "a1": -8, "a0": 10}, {"nR": 2, "nI": 0, "nL": 0, "stab": -1, "c0": 2.0, "c1": -8.0, "c2": 10.0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 4, "a1": -5, "a0": 0}, {"nR": 1, "nI": 1, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": 0, "a4": -9, "a3": 40, "a2": 39, "a1": -360, "a0": -351}, {"nR": 3, "nI": 0, "nL": 3, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": -1, "a1": -5, "a0": 0}, {"nR": 0, "nI": 1, "nL": 1, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": 1, "a4": 6, "a3": 0, "a2": -24, "a1": -1, "a0": -30}, {"nR": 1, "nI": 2, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": -3, "a4": -5, "a3": 11, "a2": -48, "a1": 92, "a0": -48}, {"nR": 3, "nI": 2, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": 10, "a4": 46, "a3": 110, "a2": 149, "a1": 100, "a0": 104}, {"nR": 0, "nI": 2, "nL": 4, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 2, "a5": 10, "a4": 40, "a3": 120, "a2": 198, "a1": 270, "a0": 0}, {"nR": 0, "nI": 3, "nL": 3, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": -4, "a1": 8, "a0": -16}, {"nR": 1, "nI": 2, "nL": 0, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 0, "a1": 4, "a0": 0}, {"nR": 0, "nI": 3, "nL": 0, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 2, "a5": -4, "a4": 10, "a3": -60, "a2": -272, "a1": 64, "a0": 1280}, {"nR": 2, "nI": 2, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": -2, "a2": 0, "a1": 22, "a0": 40}, {"nR": 1, "nI": 0, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": 2, "a3": 14, "a2": 38, "a1": 26, "a0": 0}, {"nR": 0, "nI": 1, "nL": 3, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": -2, "a2": 18, "a1": -52, "a0": 48}, {"nR": 3, "nI": 0, "nL": 0, "stab": -1, "c0": -2.0, "c1": 18.0, "c2": -46.666666666666664, "c3": 48.0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 2, "a1": 0, "a0": 2}, {"nR": 0, "nI": 2, "nL": 0, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 3, "a1": 21, "a0": 36}, {"nR": 0, "nI": 0, "nL": 2, "stab": 1, "c0": 3.0, "c1": 21.0, "c2": 36.0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": -2, "a1": -2, "a0": 4}, {"nR": 1, "nI": 0, "nL": 1, "stab": -1, "c0": -2.0, "c1": -2.0, "c2": 4.0}, 1e-9)
add("routh-hurwitz", {"deg": 5, "a6": 1, "a5": 1, "a4": 4, "a3": 20, "a2": 80, "a1": 64, "a0": 256}, {"nR": 0, "nI": 4, "nL": 1, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 3, "a1": 18, "a0": 39}, {"nR": 0, "nI": 0, "nL": 2, "stab": 1, "c0": 3.0, "c1": 18.0, "c2": 39.0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": -1, "a1": 0, "a0": 9}, {"nR": 1, "nI": 0, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 2, "a5": -2, "a4": 10, "a3": -34, "a2": -376, "a1": -32, "a0": -384}, {"nR": 1, "nI": 4, "nL": 1, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 6, "a6": 1, "a5": 8, "a4": 33, "a3": 138, "a2": 272, "a1": 160, "a0": 0}, {"nR": 0, "nI": 3, "nL": 3, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 2, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 1, "a1": 4, "a0": 0}, {"nR": 0, "nI": 1, "nL": 1, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": 1, "a3": 2, "a2": 3, "a1": 4, "a0": 5}, {"nR": 2, "nI": 0, "nL": 2, "stab": -1, "c0": 1.0, "c1": 2.0, "c2": 1.0, "c3": -6.0, "c4": 5.0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 6, "a1": 11, "a0": 6}, {"nR": 0, "nI": 0, "nL": 3, "stab": 1, "c0": 1.0, "c1": 6.0, "c2": 10.0, "c3": 6.0}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 1, "a1": 4, "a0": 4}, {"nR": 0, "nI": 2, "nL": 1, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 2, "a1": 2, "a0": 3}, {"nR": 2, "nI": 0, "nL": 2, "stab": -1}, 1e-9)
add("routh-hurwitz", {"deg": 3, "a6": 1, "a5": 1, "a4": 1, "a3": 1, "a2": 3, "a1": 2, "a0": 0}, {"nR": 0, "nI": 1, "nL": 2, "stab": 0}, 1e-9)
add("routh-hurwitz", {"deg": 4, "a6": 1, "a5": 1, "a4": 1, "a3": 0, "a2": 5, "a1": 0, "a0": 4}, {"nR": 0, "nI": 4, "nL": 0, "stab": 0}, 1e-9)


# --- v1.97.7 work: ladder-logic-simulator (own stream, earlier vectors unchanged) ---
# Written without the engine's Boolean expression. Rung 1 is built as a wiring network: a left rail, four contacts (START and the holding
# contact M in parallel, then STOP and the overload contact in series) and the coil; the coil is energised when a path of closed contacts
# joins the rail to it (breadth-first search over the contacts, a normally open contact conducts when its bit is 1, a normally closed one
# when its bit is 0). The timer is a tick-by-tick state machine in whole milliseconds, one tick per millisecond, started from the edge
# that begins the timing: TON starts at the rising edge of the rung and counts while it stays true, TOF has the rung true for one tick
# (output on) and then counts while it stays false. The accumulated time, the done bit, the time left and the percent complete are read
# from that state; the scan count is an exact Fraction ceiling. Presets and times are whole milliseconds, so the engine's seconds are exact.
from fractions import Fraction as _LF
import random as _lrand

def ladder_energised(start, stop, ol, seal):
    edges = [("L", "A", "XIC", start), ("L", "A", "XIC", seal), ("A", "B", "XIO", stop), ("B", "COIL", "XIO", ol)]
    seen, todo = {"L"}, ["L"]
    while todo:
        n = todo.pop()
        for a, b, kind, bit in edges:
            if a == n and b not in seen and ((bit == 1) if kind == "XIC" else (bit == 0)):
                seen.add(b); todo.append(b)
    return 1 if "COIL" in seen else 0

def ladder_timer(kind, en, pt_ms, tin_ms):
    # state machine, 1 ms per tick; returns (accumulated ms, done bit)
    et, q = 0, 0
    if kind == 0:                       # TON: IN rises, then holds for tin ticks (IN stays 0 if the rung is false)
        if en:
            for _ in range(tin_ms):
                et = min(et + 1, pt_ms)
            q = 1 if et >= pt_ms else 0
        return et, q
    if en:                              # TOF with the rung true: ET held at 0, Q on
        return 0, 1
    q = 1                               # TOF: the rung was true, then falls and stays false for tin ticks
    for _ in range(tin_ms):
        et = min(et + 1, pt_ms)
        if et >= pt_ms: q = 0
    if tin_ms == 0: q = 1 if et < pt_ms else 0
    return et, q

def ladder_vec(tmr, start, stop, ol, seal, pt_ms, tin_ms, scan):
    M = ladder_energised(start, stop, ol, seal)
    et, q = ladder_timer(tmr, M, pt_ms, tin_ms)
    scans = -((-_LF(pt_ms)) // _LF(str(scan)))
    inp = {"tmr": tmr, "start": start, "stop": stop, "ol": ol, "seal": seal, "PT": pt_ms / 1000, "tin": tin_ms / 1000, "scan": scan}
    out = {"M": M, "EN": M, "acc": et / 1000, "dn": q, "rem": (pt_ms - et) / 1000, "pct": et / pt_ms * 100, "scans": int(scans)}
    add("ladder-logic-simulator", inp, out, 1e-9)

# every combination of the four contact bits for both timer types (32 vectors), preset 4 s, 2 s elapsed
for _t in (0, 1):
    for _b in range(16):
        ladder_vec(_t, _b >> 3 & 1, _b >> 2 & 1, _b >> 1 & 1, _b & 1, 4000, 2000, 10)
# random: random presets, elapsed times from none to above the preset, scan times
_lr = _lrand.Random(19707)
for _ in range(40):
    _pt = _lr.randint(100, 20000)
    _tin = _lr.choice([0, _pt, _lr.randint(0, _pt), _lr.randint(0, int(_pt * 1.4))])
    ladder_vec(_lr.randint(0, 1), _lr.randint(0, 1), 1 if _lr.random() < 0.2 else 0, 1 if _lr.random() < 0.15 else 0, _lr.randint(0, 1), _pt, _tin, _lr.choice([1, 2, 5, 10, 20, 25, 50, 7.5, 0.5, 30]))
# named: a preset that is a whole number of scans, one scan, and a long preset
ladder_vec(0, 1, 0, 0, 0, 5000, 3000, 10)
ladder_vec(0, 0, 0, 0, 1, 2500, 2500, 25)
ladder_vec(1, 0, 1, 0, 1, 6000, 6000, 20)
ladder_vec(1, 0, 1, 0, 1, 6000, 5999, 20)
ladder_vec(0, 1, 0, 0, 0, 100, 0, 30)
ladder_vec(0, 1, 0, 0, 1, 60000, 45000, 50)


# --- v1.97.8 work: fourier-series (own stream, earlier vectors unchanged) ---
# Written without the closed-form coefficients the engine uses. Each waveform is a piecewise function of the phase x = f t (one period = 1),
# and its coefficients come from numerical integration at 30 digits (mpmath.quad split at the breakpoints):
# a0 = integral of f, a_n = 2 integral of f cos(2 pi n x), b_n = 2 integral of f sin(2 pi n x), and the RMS from the integral of f squared.
# THD, the AC power share and the partial sum are built from those numbers; the exact value is the piecewise function itself.
# Outputs that are zero by symmetry (below 1e-9 of the amplitude) are left out because the comparison is relative.
import mpmath as _fm
_fm.mp.dps = 30

def fourier_piece(wave, A, D):
    A = _fm.mpf(A); D = _fm.mpf(D)
    pi = _fm.pi
    if wave == 0: return (lambda x: A if x < 0.5 else -A), [0, 0.5, 1]
    if wave == 1: return (lambda x: 4*A*x if x <= 0.25 else (A*(2-4*x) if x <= 0.75 else 4*A*(x-1))), [0, 0.25, 0.75, 1]
    if wave == 2: return (lambda x: 2*A*x if x < 0.5 else 2*A*(x-1)), [0, 0.5, 1]
    if wave == 3: return (lambda x: A*_fm.sin(2*pi*x) if x < 0.5 else _fm.mpf(0)), [0, 0.5, 1]
    if wave == 4: return (lambda x: A*abs(_fm.sin(pi*x))), [0, 1]
    return (lambda x: A if (x < D/2 or x > 1 - D/2) else _fm.mpf(0)), [0, D/2, 1 - D/2, 1]

def fourier_vec(wave, A, f, Dpct, n, N, t):
    D = _fm.mpf(Dpct) / 100
    fn, bp = fourier_piece(wave, A, D)
    pi = _fm.pi
    a0 = _fm.quad(fn, bp)
    rms = _fm.sqrt(_fm.quad(lambda x: fn(x)**2, bp))
    an = lambda k: 2*_fm.quad(lambda x: fn(x)*_fm.cos(2*pi*k*x), bp)
    bn = lambda k: 2*_fm.quad(lambda x: fn(x)*_fm.sin(2*pi*k*x), bp)
    a1, b1 = an(1), bn(1); c1 = _fm.sqrt(a1**2 + b1**2)
    ak, bk = an(n), bn(n); cn = _fm.sqrt(ak**2 + bk**2)
    ac2 = rms**2 - a0**2
    thd = _fm.sqrt(ac2 - c1**2/2) / (c1/_fm.sqrt(2)) * 100
    _xf = Fraction(str(f)) * Fraction(str(t)) / 1000 % 1; x = _fm.mpf(_xf.numerator) / _fm.mpf(_xf.denominator)
    SN = a0; pw = _fm.mpf(0)
    for k in range(1, N + 1):
        a_, b_ = (ak, bk) if k == n else (an(k), bn(k))
        SN += a_*_fm.cos(2*pi*k*x) + b_*_fm.sin(2*pi*k*x); pw += (a_**2 + b_**2)/2
    fx = fn(x); err = SN - fx
    cand = {"a0": a0, "rms": rms, "acrms": _fm.sqrt(ac2), "c1": c1, "an": ak, "bn": bk, "cn": cn, "cpct": cn/c1*100, "thd": thd, "pshare": pw/ac2*100, "SN": SN, "fx": fx, "err": err}
    out = {}
    for k, v in cand.items():
        scale = 1e-9 * float(A) if k not in ("cpct", "thd", "pshare") else 1e-9
        if abs(float(v)) > scale: out[k] = float(v)
    add("fourier-series", {"wave": wave, "A": float(A), "f": float(f), "D": float(Dpct), "n": n, "N": N, "t": float(t)}, out, 1e-9)

_fr = random.Random(19708)
for _w in range(6):
    for _ in range(8):
        _A = round(_fr.uniform(0.5, 100), 3); _f = _fr.choice([10, 50, 60, 100, 120, 400]); _D = _fr.randint(5, 95) if _w == 5 else 25
        _n = _fr.randint(1, 25); _N = _fr.randint(1, 30)
        while True:
            _x = _fr.uniform(0.01, 0.99)
            if all(abs(_x - b) > 2e-3 for b in (0.25, 0.5, 0.75, _D / 200, 1 - _D / 200)): break
        fourier_vec(_w, _A, _f, _D, _n, _N, round(_x / _f * 1000, 6))
# named: first harmonics of each wave, a large N, a pulse at 50%
for _w, _n in ((0, 1), (0, 5), (1, 1), (2, 7), (3, 1), (3, 4), (4, 1), (5, 1)):
    fourier_vec(_w, 10, 50, 50 if _w == 5 else 25, _n, 40, 3.3)
fourier_vec(5, 4, 50, 25, 3, 9, 1)
fourier_vec(0, 10, 50, 25, 3, 9, 2)

# --- v1.97.9 work: lighting-uniformity (own stream, earlier vectors unchanged) ---
# Written from the definitions only, in exact rational arithmetic (fractions.Fraction), not from the engine's float code:
# Eavg = sum / n, Uo = Emin / Eavg, U1 = Emin / Emax, Emax / Eavg, population variance = sum (E - Eavg)^2 / n (square root and
# the 100 factor taken at the end), the required lowest point = Ur Eavg and the shortfall = max(0, Ur Eavg - Emin).
# The pass flags use exact comparisons, and readings are kept to two decimals so ties at a limit can be built exactly.
import random as _lr
from fractions import Fraction as _LF
_lr = _lr.Random(20261114)

def light_vec(n, E, Er, Ur):
    P = [_LF(str(e)) for e in E[:n]]
    s = sum(P); avg = s / n; mn = min(P); mx = max(P)
    var = sum((x - avg) ** 2 for x in P) / n
    sd = math.sqrt(var)
    Urf = _LF(str(Ur)); Erf = _LF(str(Er))
    out = {"avg": float(avg), "mn": float(mn), "mx": float(mx), "uo": float(mn / avg), "u1": float(mn / mx), "mxavg": float(mx / avg),
           "sd": sd, "cv": sd / float(avg) * 100, "imin": [k for k, x in enumerate(P) if x == mn][0] + 1, "imax": [k for k, x in enumerate(P) if x == mx][0] + 1,
           "okem": int(avg >= Erf), "okuo": int(mn / avg >= Urf), "minreq": float(Urf * avg), "short": float(max(_LF(0), Urf * avg - mn))}
    if out["sd"] == 0: out.pop("sd"); out.pop("cv")
    if out["short"] == 0: out.pop("short")
    if out["uo"] == 0: out.pop("uo"); out.pop("u1")
    inp = {"n": n}
    for k in range(12): inp["E%d" % (k + 1)] = float(E[k]) if k < len(E) else 0.0
    inp["Er"] = float(Er); inp["Ur"] = float(Ur)
    add("lighting-uniformity", inp, out, 1e-9)

for _ in range(24):
    _n = _lr.randint(2, 12)
    _base = _lr.choice([50, 150, 300, 500, 750])
    _E = [round(_lr.uniform(0.4, 1.6) * _base, 2) for _ in range(12)]
    # points after n are filled with junk to show they are ignored
    light_vec(_n, _E, round(_lr.uniform(0.7, 1.3) * _base, 1), round(_lr.uniform(0.3, 0.9), 2))
# named: exact ties at a limit, equal readings, two points, a point at zero
light_vec(4, [300.0, 300.0, 300.0, 300.0], 300.0, 1.0)
light_vec(2, [100.0, 300.0], 200.0, 0.5)
light_vec(4, [120.0, 480.0, 360.0, 240.0], 300.0, 0.4)
light_vec(5, [0.0, 100.0, 200.0, 300.0, 400.0], 200.0, 0.5)
light_vec(12, [round(280 + 7 * k + (-1) ** k * 11, 2) for k in range(12)], 300.0, 0.8)
light_vec(3, [250.5, 249.5, 500.0], 333.33, 0.75)

# --- v1.97.10 work: synchronous-motor (own stream, earlier vectors unchanged) ---
# Written without the engine's closed forms. The back EMF is the phasor Eb = V - Ia (Ra + j Xs) built with cmath (current at +phi leading,
# -phi lagging); the developed power is checked two ways, P - 3 Ia^2 Ra and 3 Re(Eb conj(Ia)), and the pull-out power is found by scanning
# the power-angle curve numerically (20,000 steps, then refined by golden-section search) instead of using the closed form at delta = theta.
import cmath as _cm
_sr = random.Random(20261115)

def sm_vec(Pw, VL, poles, f, pf, lead, Ra, Xs):
    V = VL / math.sqrt(3); Ia = Pw / (math.sqrt(3) * VL * pf); phi = math.acos(pf)
    I = _cm.rect(Ia, phi if lead else -phi); Z = complex(Ra, Xs); Eb = V - I * Z
    Pcu = 3 * Ia ** 2 * Ra; Pd = Pw - Pcu
    assert abs(3 * (Eb * I.conjugate()).real - Pd) < 1e-7 * Pw
    Ns = 120 * f / poles; Ebm = abs(Eb); Zs = abs(Z); th = math.atan2(Xs, Ra)
    g = lambda d: 3 * (V * Ebm * math.cos(th - d) - Ebm ** 2 * math.cos(th)) / Zs
    best = max(range(0, 20001), key=lambda k: g(k * math.pi / 20000)); lo, hi = max(best - 1, 0) * math.pi / 20000, (best + 1) * math.pi / 20000
    for _ in range(80):
        m1 = lo + (hi - lo) * 0.381966; m2 = lo + (hi - lo) * 0.618034
        if g(m1) < g(m2): lo = m1
        else: hi = m2
    Pm = g((lo + hi) / 2)
    out = {"Ns": Ns, "Vph": V, "Ia": Ia, "S": math.sqrt(3) * VL * Ia, "Q": (-1 if lead else 1) * Pw * math.tan(phi), "Eb": Ebm, "Ebl": math.sqrt(3) * Ebm,
           "ratio": Ebm / V, "dl": -math.degrees(_cm.phase(Eb)), "Pcu": Pcu, "Pd": Pd, "T": Pd / (2 * math.pi * Ns / 60), "Pmax": Pm, "marg": Pm / Pd}
    for _k in ("S", "Q", "Pcu", "Pd", "Pmax"): out[_k] /= 1000   # shown in kVA, kvar and kW, the units of the vector file
    if Ra == 0: out.pop("Pcu")
    add("synchronous-motor", {"P": Pw / 1000, "VL": VL, "poles": poles, "f": f, "pf": pf, "lead": lead, "Ra": Ra, "Xs": Xs}, out, 1e-7)

for _ in range(30):
    _VL = _sr.choice([415, 690, 3300, 6600, 11000]); _pf = round(_sr.uniform(0.6, 1.0), 3); _po = _sr.choice([2, 4, 6, 8, 12, 16, 24])
    _Pw = round(_sr.uniform(50, 6000) * 1000, 0); _Xs = round(_sr.uniform(0.5, 1.5) * _VL ** 2 / (_Pw * 1.0) * 1.2, 4)
    _Ra = round(_Xs * _sr.uniform(0.0, 0.06), 4)
    sm_vec(_Pw, float(_VL), _po, _sr.choice([50, 60, 25, 16.7]), _pf, _sr.choice([0, 1]), _Ra, _Xs)
sm_vec(1000e3, 6600.0, 6, 50, 0.9, 1, 1.0, 25.0)
sm_vec(500e3, 3300.0, 4, 50, 1.0, 1, 1e-9, 12.0)
sm_vec(300e3, 440.0, 4, 60, 0.85, 1, 0.05, 1.2)

# --- v1.97.11 work: transformer-parallel (own stream, earlier vectors unchanged) ---
# Written without the engine's kVA-equivalent admittances. The two units are physical: each has a series impedance in ohms per phase,
# Z = (z / 100) (VL / sqrt3) / In at the angle atan(X/R), with In = Sn / (sqrt3 VL); the common busbar voltage comes from the nodal (Millman) equation
# Vb = (E1 / Z1 + E2 / Z2 - IL) / (1 / Z1 + 1 / Z2) and each unit current is (Ei - Vb) / Zi, so the shares and the circulating current are found
# from the busbar voltage instead of by current division and superposition. The largest load is found by bisection on the loading of each unit
# (the loading is convex in the load, so there is one crossing), not by the quadratic. E1 is the phase reference; the load current is fixed at
# S / (sqrt3 VL) at angle -phi; the clock numbers come from the vector group table; real and reactive power are sqrt3 VL times the real and (negated)
# imaginary parts of the unit current referred to E1.
_tr = random.Random(20261116)
_CLK = [11, 1, 5, 1, 11, 0, 6, 0, 6]   # Dyn11, Dyn1, Dyn5, Yd1, Yd11, Yy0, Yy6, Dd0, Dd6

def tp_vec(g1, S1, z1, xr1, g2, S2, z2, xr2, eps, S, pf, VL=415.0, keep_lim=True):
    r3 = math.sqrt(3); Vph = VL / r3
    In1, In2 = S1 * 1000 / (r3 * VL), S2 * 1000 / (r3 * VL)
    Z1 = (z1 / 100) * (Vph / In1) * _cm.rect(1.0, math.atan(xr1)); Z2 = (z2 / 100) * (Vph / In2) * _cm.rect(1.0, math.atan(xr2))
    dl = (_CLK[g2] - _CLK[g1]) * 30
    E1 = complex(Vph, 0); E2 = (1 + eps / 100) * Vph * _cm.rect(1.0, -math.radians(dl))
    def cur(Sl):
        IL = Sl * 1000 / (r3 * VL) * _cm.rect(1.0, -math.acos(pf))
        Vb = (E1 / Z1 + E2 / Z2 - IL) / (1 / Z1 + 1 / Z2)
        return (E1 - Vb) / Z1, (E2 - Vb) / Z2
    def full(Sl, k):
        f = lambda x: abs(cur(x)[k]) - (In1, In2)[k]
        if f(0.0) >= 0: return 0.0
        lo, hi = 0.0, 1.0
        while f(hi) < 0: lo, hi = hi, hi * 2
        for _ in range(200):
            m = (lo + hi) / 2
            if f(m) < 0: lo = m
            else: hi = m
        return (lo + hi) / 2
    I1, I2 = cur(S); Ic = abs((E1 - E2) / (Z1 + Z2)); K = r3 * VL / 1000   # amperes to kVA at rated voltage
    m1, m2 = S1 / z1, S2 / z2; Sm = [full(S, 0), full(S, 1)]; Smax = min(Sm)
    out = {"dang": (lambda r: 360 - r if r > 180 else r)(abs(_CLK[g1] - _CLK[g2]) * 30), "dz": (max(z1, z2) - min(z1, z2)) / min(z1, z2) * 100, "rr": max(S1, S2) / min(S1, S2),
           "Sa0": S * m1 / (m1 + m2), "Sa": abs(I1) * K, "Sb": abs(I2) * K, "La": abs(I1) / In1 * 100, "Lb": abs(I2) / In2 * 100,
           "Pa": I1.real * K, "Pb": I2.real * K, "Qa": -I1.imag * K, "Qb": -I2.imag * K, "Ic": Ic * K, "Ca": Ic * K / S1 * 100, "Cb": Ic * K / S2 * 100,
           "Smax": Smax, "util": Smax / (S1 + S2) * 100, "head": Smax - S}
    if abs(Sm[0] - Sm[1]) > 1e-9 * max(Sm[0], Sm[1], 1) and Smax > 0: out["lim"] = 1 if Sm[0] < Sm[1] else 2
    for _k in list(out):
        if abs(out[_k]) < 1e-6: out.pop(_k)    # the comparison is relative, so values that are zero are left out
    add("transformer-parallel", {"g1": g1, "S1": S1, "z1": z1, "xr1": xr1, "g2": g2, "S2": S2, "z2": z2, "xr2": xr2, "eps": eps, "S": S, "pf": pf}, out, 1e-7)

_SZ = [315, 500, 630, 800, 1000, 1250, 1600, 2000, 2500]
for _ in range(36):
    _a = _tr.choice(_SZ); _b = _tr.choice(_SZ); _g1 = _tr.randrange(9); _g2 = _g1 if _tr.random() < 0.65 else _tr.randrange(9)
    tp_vec(_g1, float(_a), round(_tr.uniform(4, 8), 2), round(_tr.uniform(2, 20), 2), _g2, float(_b), round(_tr.uniform(4, 8), 2), round(_tr.uniform(2, 20), 2),
           round(_tr.uniform(-3, 3), 3) if _tr.random() < 0.7 else 0.0, round(_tr.uniform(0.3, 1.2) * (_a + _b), 1), round(_tr.uniform(0.6, 1.0), 3), _tr.choice([415.0, 690.0, 3300.0, 11000.0]))
tp_vec(0, 1000.0, 5.0, 8.0, 0, 630.0, 4.5, 8.0, 0.0, 1400.0, 0.85)           # the worked example of the formula guide
tp_vec(0, 1000.0, 5.0, 8.0, 0, 1000.0, 5.0, 8.0, 0.0, 1500.0, 0.9)           # equal units share equally
tp_vec(0, 1000.0, 5.0, 12.0, 0, 630.0, 4.5, 4.0, 0.0, 1400.0, 0.8)           # different X/R
tp_vec(0, 1000.0, 5.0, 10.0, 0, 1000.0, 5.0, 10.0, 2.0, 100.0, 0.9)          # 2% ratio difference
tp_vec(0, 1000.0, 5.0, 10.0, 1, 1000.0, 5.0, 10.0, 0.0, 800.0, 0.9)          # Dyn11 against Dyn1
tp_vec(0, 1000.0, 5.0, 8.0, 0, 630.0, 4.5, 8.0, 0.0, 1800.0, 0.85)           # overloaded
tp_vec(0, 1000.0, 5.0, 10.0, 0, 1000.0, 5.0, 10.0, 20.0, 500.0, 0.9)         # circulating current fills a unit
tp_vec(4, 800.0, 6.0, 9.0, 0, 1600.0, 7.0, 15.0, -1.5, 1500.0, 1.0)          # Yd11 with Dyn11, unity power factor, ratio difference
tp_vec(5, 2000.0, 6.5, 14.0, 7, 2500.0, 6.5, 14.0, 0.0, 3000.0, 0.8)         # Yy0 with Dd0

# --- v1.97.12 work: transformer-inrush (own stream, earlier vectors unchanged) ---
# Written without the engine's closed forms. The current is taken per phase: each of the three phases carries S/3 at the phase voltage VL/sqrt3,
# so In = (S/3) / (VL/sqrt3). The rated peak is the amplitude of that sinusoid, found by sampling a cycle and taking the largest sample (not by
# multiplying by sqrt2). The first peak is the multiple times the rated current. The decay is worked from the half-life, Ipeak(t) = Ipeak * 2^(-t / T_half)
# with T_half = tau ln2, and the time to reach the rated peak is found by bisection on that curve instead of by the logarithm. The setting margins are plain ratios.
_ti = random.Random(20261117)

def ti_vec(S, VL, k, tau, t, Iset):
    In = (S * 1000 / 3) / (VL / math.sqrt(3))
    Irp = max(In * math.sqrt(2) * math.sin(2 * math.pi * n / 200000) for n in range(200001))   # amplitude of the sinusoid by sampling one cycle
    Ipk = k * In; Th = tau * math.log(2)
    f = lambda x: Ipk * 2 ** (-x / Th)
    Ipt = f(t)
    if Ipk > Irp:
        lo, hi = 0.0, 1.0
        while f(hi) > Irp: lo, hi = hi, hi * 2
        for _ in range(200):
            m = (lo + hi) / 2
            if f(m) > Irp: lo = m
            else: hi = m
        tr = (lo + hi) / 2
    else: tr = 0.0
    out = {"In": In, "Irp": Irp, "Ipk": Ipk, "r": Ipk / Irp, "Ipt": Ipt, "m": Iset / Ipk, "mn": Iset / In}
    if tr > 0: out["tr"] = tr
    add("transformer-inrush", {"S": S, "V": VL, "k": k, "tau": tau, "t": t, "Iset": Iset}, out, 1e-7)

for _ in range(30):
    _s = _ti.choice([50.0, 100.0, 250.0, 500.0, 630.0, 1000.0, 1600.0, 2500.0, 5000.0, 10000.0]); _v = _ti.choice([230.0, 415.0, 690.0, 3300.0, 6600.0, 11000.0, 22000.0, 33000.0, 132000.0])
    _k = round(_ti.uniform(2, 20), 2); _tau = round(_ti.uniform(0.05, 5), 3); _t = round(_ti.uniform(0, 4), 2) if _ti.random() < 0.85 else 0.0
    _in = _s * 1000 / (math.sqrt(3) * _v)
    ti_vec(_s, _v, _k, _tau, _t, round(_in * _ti.uniform(2, 20), 1))
ti_vec(1000.0, 11000.0, 10.0, 0.5, 1.0, 600.0)     # the worked example of the formula guide (1,000 kVA, 11 kV, multiple of 10)
ti_vec(1000.0, 11000.0, 6.0, 0.5, 1.0, 600.0)      # multiple of 6
ti_vec(1000.0, 11000.0, 12.0, 0.5, 1.0, 800.0)     # multiple of 12
ti_vec(2500.0, 33000.0, 8.0, 1.2, 2.0, 500.0)      # a larger unit with a slower decay
ti_vec(1000.0, 11000.0, 10.0, 0.5, 1.0, 400.0)     # setting below the peak
ti_vec(1000.0, 11000.0, 1.2, 0.5, 1.0, 200.0)      # multiple below the square root of 2
ti_vec(400.0, 415.0, 9.0, 0.3, 0.0, 5000.0)        # time 0
ti_vec(100.0, 415.0, 12.0, 0.2, 0.5, 1500.0)       # small unit

# --- v1.97.13 work: two-wattmeter (own stream, earlier vectors unchanged) ---
# Written from phasors, not from the sum and difference formulas. A balanced load is built from a line voltage VL, a line current IL and an angle phi (positive lagging),
# with phase sequence ABC. The meters are read the way a real wattmeter reads: W1 = Re(V_AB conj(I_A)) and W2 = Re(V_CB conj(I_C)), each current coil in one line and the voltage coil
# to line B. The true total is 3 Re(V_A conj(I_A)) from the phase quantities, the reactive power is 3 Im(V_A conj(I_A)) (positive lagging), and the apparent power is sqrt3 VL IL.
# For the readings-to-load direction the readings go in and the true values are the expected output. For the load-to-readings direction the true total and power factor go in
# and the larger and smaller of the two phasor readings are the expected output.
import cmath as _cm2
_tw = random.Random(20261118)

def tw_true(VL, IL, phi, lead):
    a = _cm2.rect(1.0, 2 * math.pi / 3); Vph = VL / math.sqrt(3)
    VA, VB, VC = complex(Vph, 0), Vph * a * a, Vph * a                     # sequence ABC
    ph = -phi if not lead else phi                                           # lagging: current behind the voltage
    IA = _cm2.rect(IL, math.atan2(VA.imag, VA.real) + ph); IC = _cm2.rect(IL, cmath_phase(VC) + ph)
    W1 = ((VA - VB) * IA.conjugate()).real; W2 = ((VC - VB) * IC.conjugate()).real
    Sc = 3 * VA * IA.conjugate()
    return W1 / 1000, W2 / 1000, Sc.real / 1000, Sc.imag / 1000, math.sqrt(3) * VL * IL / 1000

def cmath_phase(z): return math.atan2(z.imag, z.real)

def tw_vec(VL, IL, phi_deg, lead):
    W1, W2, P, Qs, S = tw_true(VL, IL, math.radians(phi_deg), lead)
    out = {"P": P, "Q": (Qs if not lead else Qs), "S": S, "phi": phi_deg, "pf": math.cos(math.radians(phi_deg)), "I": IL}
    out["Q"] = -abs(Qs) if lead else abs(Qs)
    big, small = max(W1, W2), min(W1, W2)
    r = dict(out); r["Wbig"] = big; r["Wsmall"] = small; r["ratio"] = small / big
    for _k in ("Wsmall", "ratio"):
        if abs(r[_k]) < 1e-6: r.pop(_k)    # the comparison is relative, so a reading that is zero is left out
    _keys = [k for k in ("P", "Q", "S", "phi", "pf", "Wbig", "Wsmall", "ratio", "I") if k in r]
    add("two-wattmeter", {"mode": 0, "W1": W1, "W2": W2, "pf": 0.8, "lt": 1 if lead else 0, "V": VL}, {k: r[k] for k in _keys}, 1e-7)
    add("two-wattmeter", {"mode": 1, "P": P, "pf": math.cos(math.radians(phi_deg)), "lt": 1 if lead else 0, "V": VL}, {k: r[k] for k in _keys}, 1e-7)

for _ in range(18):
    tw_vec(_tw.choice([230.0, 400.0, 415.0, 690.0, 3300.0, 11000.0]), round(_tw.uniform(2, 400), 2), round(_tw.uniform(1, 88), 2), _tw.random() < 0.4)
tw_vec(415.0, 19.2776, 30.0, False)   # the guide example pf 0.866
tw_vec(415.0, 10.0, 60.0, False)      # pf 0.5: smaller reading zero
tw_vec(415.0, 10.0, 73.9, False)      # below pf 0.5, negative reading
tw_vec(400.0, 25.0, 0.5, True)        # near unity, leading

# --- v1.97.14 work: controlled-rectifier (own stream, earlier vectors unchanged) ---
# Written from the waveforms, not from the closed-form averages. One period of the output voltage and of the supply current is described piece by piece
# (which thyristors conduct in each interval, which supply phase carries the load current) and integrated numerically with Gauss-Legendre on each smooth piece:
# the average and RMS output come from integrating that output voltage, the supply RMS, fundamental, power and distortion from the supply current (Fourier integrals of
# i(t) sin t and i(t) cos t), the thyristor average current from the positive part of the supply current, and the real power from the source side (v_a i_a, times the phases).
# For the R-L-E circuits the load current is found from Id = (Vdc - E) / R by bisection on the numerically integrated Vdc. Overlap is found by integrating the commutation voltage
# (the line voltage between the incoming and outgoing phase, over 2 w Ls in the loop) until the commutating current has changed by the load current (twice that in the
# single-phase bridge), and the output voltage during the overlap is the mean of the old and new output voltages. The generator also asserts that the source-side power
# equals Vdc Id for every instant-commutation case.
def _cr_gl(n):
    xs, ws = [], []
    for k in range(1, n + 1):
        x = math.cos(math.pi * (k - 0.25) / (n + 0.5))
        for _ in range(100):
            p0, p1 = 1.0, x
            for j in range(2, n + 1): p0, p1 = p1, ((2 * j - 1) * x * p1 - (j - 1) * p0) / j
            dp = n * (x * p1 - p0) / (x * x - 1)
            dx = p1 / dp; x -= dx
            if abs(dx) < 1e-15: break
        xs.append(x); ws.append(2 / ((1 - x * x) * dp * dp))
    return xs, ws
_CRX, _CRW = _cr_gl(24)
def _cr_int(segs, f):
    tot = 0.0
    for a, b, vo, ii in segs:
        if b - a <= 1e-14: continue
        h, m = 0.5 * (b - a), 0.5 * (b + a)
        tot += h * sum(w * f(vo(m + h * x), ii(m + h * x), m + h * x) for x, w in zip(_CRX, _CRW))
    return tot
def _cr_c(c): return lambda x: c
def _cr_s(Vm, ph=0.0): return lambda x: Vm * math.sin(x - ph)
def _cr_four(segs):
    return _cr_int(segs, lambda v, i, x: i * math.cos(x)) / math.pi, _cr_int(segs, lambda v, i, x: i * math.sin(x)) / math.pi

def _cr_resistive(t, Vs, al_deg, R, f):
    al, Vm, tw = math.radians(al_deg), math.sqrt(2) * Vs, 2 * math.pi
    cur = lambda x: Vm * math.sin(x) / R
    z = _cr_c(0.0)
    segs = [(0, al, z, z), (al, math.pi, _cr_s(Vm), cur), (math.pi, tw, z, z)] if t == 0 else \
           [(0, al, z, z), (al, math.pi, _cr_s(Vm), cur), (math.pi, math.pi + al, z, z), (math.pi + al, tw, lambda x: -Vm * math.sin(x), cur)]
    Vdc = _cr_int(segs, lambda vo, i, x: vo) / tw
    Vro = math.sqrt(_cr_int(segs, lambda vo, i, x: vo * vo) / tw)
    Isrc = math.sqrt(_cr_int(segs, lambda vo, i, x: i * i) / tw)
    Ps = _cr_int(segs, lambda vo, i, x: Vm * math.sin(x) * i) / tw
    a1, b1 = _cr_four(segs); I1m = math.hypot(a1, b1); I1 = I1m / math.sqrt(2)
    S = Vs * Isrc
    return dict(Vdc=Vdc, Vro=Vro, Id=Vdc / R, Isrc=Isrc, I1=I1, Pw=Ps / 1000, S=S / 1000, PF=Ps / S, DPF=b1 / I1m, Q1=Vs * I1 * (-a1 / I1m) / 1000,
                THD=math.sqrt(Isrc ** 2 / I1 ** 2 - 1) * 100, IavT=_cr_int(segs, lambda vo, i, x: max(i, 0.0)) / tw, PIV=Vm, fr=(1 if t == 0 else 2) * f)

def _cr_cycle(t, Vs, al):
    d = math.radians
    if t == 2:
        Vm = math.sqrt(2) * Vs
        return al, math.pi, [(_cr_s(Vm), +1), (lambda x: -Vm * math.sin(x), -1)], 1.0
    if t == 4:
        Vp = math.sqrt(2) * Vs; va, vb, vc = _cr_s(Vp), _cr_s(Vp, d(120)), _cr_s(Vp, d(240))
        return d(30) + al, d(120), [(va, 1), (vb, 0), (vc, 0)], 3.0
    Vp = math.sqrt(2) * Vs / math.sqrt(3); va, vb, vc = _cr_s(Vp), _cr_s(Vp, d(120)), _cr_s(Vp, d(240))
    df = lambda p, n: (lambda x: p(x) - n(x))
    return d(30) + al, d(60), [(df(va, vb), 1), (df(va, vc), 1), (df(vb, vc), 0), (df(vb, va), -1), (df(vc, va), -1), (df(vc, vb), 0)], math.sqrt(3)

def _cr_rle(t, Vs, f, al_deg, R, E, Ls_mH=0.0):
    al, Vm, w, tw, Ls = math.radians(al_deg), math.sqrt(2) * Vs, 2 * math.pi * f, 2 * math.pi, Ls_mH * 1e-3
    z = _cr_c(0.0)
    if t == 3:
        segs_for = lambda Id, mu: [(0, al, z, z), (al, math.pi, _cr_s(Vm), _cr_c(Id)), (math.pi, math.pi + al, z, z), (math.pi + al, tw, lambda x: -Vm * math.sin(x), _cr_c(-Id))]
        nS, mu = 1.0, None
        Vdc = _cr_int(segs_for(1.0, 0), lambda vo, i, x: vo) / tw; Id = (Vdc - E) / R
        if Id <= 0: return None
        Vdc_no = Vdc
    else:
        s0, width, fl, nS = _cr_cycle(t, Vs, al); n = len(fl)
        def segs_for(Id, mu):
            out = []
            for k in range(n):
                a = s0 + k * width; vn, kn = fl[k]; vp, _ = fl[(k - 1) % n]
                if mu > 0:
                    out.append((a, a + mu, (lambda vn=vn, vp=vp: (lambda x: 0.5 * (vn(x) + vp(x))))(), _cr_c(kn * Id)))
                    out.append((a + mu, a + width, vn, _cr_c(kn * Id)))
                else: out.append((a, a + width, vn, _cr_c(kn * Id)))
            return out
        vn0, vp0 = fl[0][0], fl[-1][0]
        def find_mu(Id):
            if Ls <= 0: return 0.0
            target = 2 * w * Ls * (2 * Id if t == 2 else Id)
            G = lambda m: _cr_int([(s0, s0 + m, _cr_c(0.0), _cr_c(0.0))], lambda a_, b_, x: vn0(x) - vp0(x))
            lo, hi = 0.0, math.pi - al          # the commutation voltage reverses at pi - alpha after the start, so the overlap cannot be longer
            if G(hi) < target: return None
            for _ in range(70):
                mid = 0.5 * (lo + hi)
                if G(mid) < target: lo = mid
                else: hi = mid
            return 0.5 * (lo + hi)
        def vdc_of(Id):
            m = find_mu(Id)
            return (None, None) if m is None else (_cr_int(segs_for(Id, m), lambda vo, i, x: vo) / tw, m)
        def h(Id):
            vd, m = vdc_of(Id)
            return None if vd is None else Id - (vd - E) / R
        lo, hi = 1e-9, (3 * Vm / math.pi) / R + 1.0
        hl = h(lo)
        if hl is None or hl > 0: return None
        hh = h(hi)
        while hh is None or hh < 0:
            hi *= 0.9; hh = h(hi)
            if hi < 1e-6: return None
        for _ in range(70):
            mid = 0.5 * (lo + hi); hm = h(mid)
            if hm is None or hm > 0: hi = mid
            else: lo = mid
        Id = 0.5 * (lo + hi); Vdc, mu = vdc_of(Id)
        Vdc_no = _cr_int(segs_for(Id, 0.0), lambda vo, i, x: vo) / tw
    ideal = segs_for(Id, 0.0)
    Isrc = math.sqrt(_cr_int(ideal, lambda vo, i, x: i * i) / tw)
    a1, b1 = _cr_four(ideal); I1m = math.hypot(a1, b1); I1 = I1m / math.sqrt(2)
    Vro = math.sqrt(_cr_int(ideal, lambda vo, i, x: vo * vo) / tw)
    Pw = Vdc * Id; S = nS * Vs * Isrc; PF = Pw / S; DPF = PF / (I1 / Isrc)
    if Ls_mH == 0 or t == 3:
        phases = {2: 1, 3: 1, 4: 3, 5: 3}[t]; vph = Vm if t != 5 else Vm / math.sqrt(3)
        Ps = phases * _cr_int(ideal, lambda vo, i, x: vph * math.sin(x) * i) / tw
        assert abs(Ps - Pw) <= 1e-9 * abs(Pw), (t, Ps, Pw)       # the source delivers exactly what the converter output receives
    res = dict(Vdc=Vdc, Id=Id, Pw=Pw / 1000, S=S / 1000, PF=PF, DPF=DPF, Isrc=Isrc, I1=I1, Q1=nS * Vs * I1 * math.sqrt(max(0.0, 1 - DPF * DPF)) / 1000, Vro=Vro,
               THD=math.sqrt(Isrc ** 2 / I1 ** 2 - 1) * 100, PIV={2: Vm, 3: Vm, 4: math.sqrt(3) * Vm, 5: math.sqrt(2) * Vs}[t], fr={2: 2, 3: 2, 4: 3, 5: 6}[t] * f)
    if t != 3: res["IavT"] = _cr_int(ideal, lambda vo, i, x: max(i, 0.0)) / tw
    if mu is not None and Ls_mH > 0: res["mu"] = math.degrees(mu); res["dV"] = Vdc_no - Vdc
    if t != 3 and al_deg > 90: res["gamma"] = 180 - al_deg - (math.degrees(mu) if mu is not None else 0.0)
    return res

def _cr_vec(t, Vs, f, al, R, E=0.0, Ls=None):
    r = _cr_resistive(t, Vs, al, R, f) if t <= 1 else _cr_rle(t, Vs, f, al, R, E, Ls or 0.0)
    if r is None: return False
    r0 = _cr_resistive(t, Vs, 0.0, R, f) if t <= 1 else None
    if t <= 1: Vd0 = r0["Vdc"]                                   # uncontrolled output: the integral at alpha = 0
    elif t == 3: Vd0 = _cr_int([(0, math.pi, _cr_s(math.sqrt(2) * Vs), _cr_c(0.0)), (math.pi, 2 * math.pi, lambda x: -math.sqrt(2) * Vs * math.sin(x), _cr_c(0.0))], lambda vo, i, x: vo) / (2 * math.pi)
    else: Vd0 = _cr_int(_cr_ideal_segs(t, Vs), lambda vo, i, x: vo) / (2 * math.pi)
    r["Vd0"] = Vd0; r["rat"] = r["Vdc"] / Vd0 * 100
    inp = {"ct": t, "Vs": Vs, "f": f, "alpha": al, "R": R, "E": E}
    if Ls: inp["Ls"] = Ls
    out = {k: v for k, v in r.items() if v is not None and abs(v) > 1e-9}
    add("controlled-rectifier", inp, out, 2e-8)
    return True
def _cr_ideal_segs(t, Vs):
    s0, width, fl, nS = _cr_cycle(t, Vs, 0.0)
    return [(s0 + k * width, s0 + (k + 1) * width, fl[k][0], _cr_c(0.0)) for k in range(len(fl))]

_crr = random.Random(20261119)
def _cr_rand(t, n, with_ls):
    done = 0
    while done < n:
        Vs = _crr.choice([230.0, 240.0, 120.0, 400.0]) if t != 5 else _crr.choice([415.0, 400.0, 380.0, 480.0])
        f = _crr.choice([50.0, 60.0]); R = round(_crr.uniform(2, 30), 2)
        al = round(_crr.uniform(3, 88), 1) if t <= 1 or _crr.random() < 0.8 else round(_crr.uniform(92, 150), 1)
        if t <= 1: al = round(_crr.uniform(3, 170), 1)
        if t == 3: al = round(_crr.uniform(3, 170), 1)
        E = 0.0; Ls = None
        if t >= 2:
            vd0 = {2: 2 * math.sqrt(2) * Vs / math.pi, 3: 2 * math.sqrt(2) * Vs / math.pi, 4: 3 * math.sqrt(6) * Vs / (2 * math.pi), 5: 3 * math.sqrt(2) * Vs / math.pi}[t]
            vdn = vd0 * (1 + math.cos(math.radians(al))) / 2 if t == 3 else vd0 * math.cos(math.radians(al))
            E = round(vdn * _crr.uniform(0.15, 0.7), 1) if vdn > 0 else round(vdn * _crr.uniform(1.2, 2.0), 1)
            if with_ls and t != 3: Ls = round(_crr.uniform(0.2, 3.0), 2)
        if _cr_vec(t, Vs, f, al, R, E, Ls): done += 1
for _t in range(6): _cr_rand(_t, 6, False)
for _t in (2, 4, 5): _cr_rand(_t, 5, True)
assert _cr_vec(1, 230.0, 50.0, 0.0, 10.0)                  # alpha 0: the uncontrolled bridge
assert _cr_vec(0, 230.0, 50.0, 90.0, 10.0)                 # half-wave at 90 degrees
assert _cr_vec(1, 230.0, 50.0, 150.0, 10.0)                # bridge, large angle
assert _cr_vec(2, 230.0, 50.0, 30.0, 10.0)                 # the calculator default
assert _cr_vec(3, 230.0, 50.0, 90.0, 10.0)                 # half-controlled, 90 degrees
assert _cr_vec(4, 230.0, 50.0, 0.0, 10.0, 0.0, 1.0)        # 3-pulse at alpha 0 with overlap
assert _cr_vec(5, 415.0, 50.0, 60.0, 10.0)                 # three-phase bridge at 60 degrees
assert _cr_vec(5, 415.0, 50.0, 30.0, 10.0, 0.0, 1.0)       # three-phase bridge with overlap
assert _cr_vec(2, 230.0, 50.0, 150.0, 10.0, -250.0, 0.5)   # inverter operation, extinction angle
assert _cr_vec(5, 415.0, 50.0, 120.0, 5.0, -400.0, 0.3)    # three-phase inverter operation

# --- v1.97.15 work: dc-dc-converter (own stream, earlier vectors unchanged) ---
# Written from the circuit, not the closed-form duty and ripple equations. The average model of each converter (inductor voltage and capacitor current in the on and off intervals,
# with the switch resistance, diode drop, inductor resistance and a resistor load Vo / Io) is weighted by the duty cycle and solved as two linear equations, and the duty cycle that gives the
# wanted output is found by bisection on the rising branch. The inductor ripple comes from the on-interval slope (di/dt = v / L), the RMS, average and loss currents from integrating the
# triangular inductor current in each interval (Gauss-Legendre), and the capacitor ripple from the capacitor current integrated over the period and read as peak to peak, plus the ESR drop on the
# capacitor current swing. The output capacitance for the target is the capacitance that gives that ripple (ripple is proportional to 1 / C).
def _dc_coef(tp, Vi, Rds, Vf, Rl, R):
    on = (-(Rds + Rl), 0.0 if tp else -1.0, Vi); cap_on = (0.0, -1.0 / R, 0.0) if tp else (1.0, -1.0 / R, 0.0)
    if tp == 0: off = (-Rl, -1.0, -Vf)
    elif tp == 1: off = (-Rl, -1.0, Vi - Vf)
    else: off = (-Rl, -1.0, -Vf)
    return on, off, cap_on, (1.0, -1.0 / R, 0.0)
def _dc_steady(tp, Vi, Rds, Vf, Rl, R, D):
    on, off, con, coff = _dc_coef(tp, Vi, Rds, Vf, Rl, R)
    a = [D * on[k] + (1 - D) * off[k] for k in range(3)]; b = [D * con[k] + (1 - D) * coff[k] for k in range(3)]
    det = a[0] * b[1] - a[1] * b[0]
    return (-a[2] * b[1] + a[1] * b[2]) / det, (-a[0] * b[2] + a[2] * b[0]) / det     # iL, v
def _dc_find(tp, Vi, Vo, Io, Rds, Vf, Rl):
    R = Vo / Io; N = 4000
    vs = [_dc_steady(tp, Vi, Rds, Vf, Rl, R, k / N)[1] for k in range(1, N)]
    kp = max(range(len(vs)), key=lambda k: vs[k]) + 1 if tp else N - 1
    if vs[kp - 1] < Vo: return None
    lo, hi = 1e-9, kp / N
    for _ in range(100):
        mid = 0.5 * (lo + hi)
        if _dc_steady(tp, Vi, Rds, Vf, Rl, R, mid)[1] < Vo: lo = mid
        else: hi = mid
    D = 0.5 * (lo + hi); return D, _dc_steady(tp, Vi, Rds, Vf, Rl, R, D)[0]
def _dc_vec(tp, Vi, Vo, Io, fk, rl=30.0, L_uH=None, dVp=1.0, C_uF=None, ESR_m=0.0, Rds_m=0.0, Vf=0.0, DCR_m=0.0):
    f, Rds, Rl, ESR = fk * 1e3, Rds_m * 1e-3, DCR_m * 1e-3, ESR_m * 1e-3
    found = _dc_find(tp, Vi, Vo, Io, Rds, Vf, Rl)
    if found is None: return False
    D, IL = found
    if not (0.01 < D < 0.99) or IL <= 0: return False
    on, off, cap_on, cap_off = _dc_coef(tp, Vi, Rds, Vf, Rl, Vo / Io)
    s_on_L = on[0] * IL + on[1] * Vo + on[2]            # L di/dt in the on interval, in volts
    s_off_L = off[0] * IL + off[1] * Vo + off[2]
    assert abs(s_on_L * D + s_off_L * (1 - D)) < 1e-6 * max(1.0, abs(s_on_L))      # the inductor volt-seconds balance
    if L_uH is None: L = s_on_L * D / (f * rl / 100 * IL)
    else: L = L_uH * 1e-6
    dI = s_on_L * D / (L * f)
    if IL - dI / 2 <= 0: return False
    T = 1 / f; ton = D * T; toff = T - ton; Imin = IL - dI / 2
    i_on = lambda t: Imin + (dI / ton) * t; i_off = lambda t: IL + dI / 2 - (dI / toff) * t
    def gint(g, a, b):
        h, m = 0.5 * (b - a), 0.5 * (b + a)
        return h * sum(w * g(m + h * x) for x, w in zip(_CRX, _CRW))
    on_sq, off_sq = gint(lambda t: i_on(t) ** 2, 0, ton), gint(lambda t: i_off(t) ** 2, 0, toff)
    ILrms = math.sqrt((on_sq + off_sq) / T); Isw_avg = gint(i_on, 0, ton) / T; Iswr = math.sqrt(on_sq / T); Id_avg = gint(i_off, 0, toff) / T
    iC = (lambda t, on_=True: (i_on(t) if on_ else i_off(t)) - Io) if tp == 0 else (lambda t, on_=True: -Io if on_ else i_off(t) - Io)
    swing = [iC(0.0, True), iC(ton, True), iC(0.0, False), iC(toff, False)]
    # the first call of cap_pp with a unit capacitor gives the capacitance part for C = 1 F
    # capacitor voltage for C = 1 F: integrate the capacitor current exactly over each interval (Gauss-Legendre on 2000 sub-intervals) and read the peak to peak
    v = 0.0; ys = [0.0]
    for on_, t0, dur in ((True, 0.0, ton), (False, 0.0, toff)):
        for k in range(2000):
            a_, b_ = t0 + dur * k / 2000, t0 + dur * (k + 1) / 2000
            v += gint(lambda t: iC(t, on_), a_, b_); ys.append(v)
    ppC1 = max(ys) - min(ys)
    dV = dVp / 100 * Vo; Cm = ppC1 / dV; Cu = Cm if C_uF is None else C_uF * 1e-6
    iCmax = max(swing); iCmin = min(swing)
    esrV = ESR * (iCmax - iCmin)
    Vrip = ppC1 / Cu + esrV
    Psw = Rds * Iswr ** 2; Pd = Vf * Id_avg; PL = Rl * ILrms ** 2; Pl = Psw + Pd + PL; Pout = Vo * Io; Pin = Pout + Pl
    inp = {"tp": tp, "Vin": Vi, "Vout": Vo, "Iout": Io, "fsw": fk, "rl": rl, "dV": dVp, "ESR": ESR_m, "Rds": Rds_m, "Vf": Vf, "DCR": DCR_m}
    if L_uH is not None: inp["L"] = L_uH
    if C_uF is not None: inp["C"] = C_uF
    out = {"D": D, "IL": IL, "dI": dI, "Ipk": IL + dI / 2, "ILrms": ILrms, "L": L * 1e6, "Lcrit": s_on_L * D / (2 * f * IL) * 1e6, "Cm": Cm * 1e6, "Vrip": Vrip,
           "Isw": Isw_avg, "Iswr": Iswr, "Id": Id_avg, "Vst": {0: Vi, 1: Vo, 2: Vi + Vo}[tp], "Psw": Psw, "Pd": Pd, "PL": PL, "Pl": Pl, "Iin": Pin / Vi, "eta": Pout / Pin * 100}
    add("dc-dc-converter", inp, {k: v for k, v in out.items() if abs(v) > 1e-12}, 5e-6)
    return True
_dcr = random.Random(20261120)
for _tp in range(3):
    _n = 0
    while _n < 9:
        _Vi = _dcr.choice([12.0, 24.0, 48.0, 5.0, 36.0])
        _Vo = round(_dcr.uniform(0.3, 0.9) * _Vi, 2) if _tp == 0 else round(_Vi * _dcr.uniform(1.4, 4.0), 2) if _tp == 1 else round(_dcr.uniform(0.3, 3.0) * _Vi, 2)
        _Io = round(_dcr.uniform(0.5, 15), 2); _fk = _dcr.choice([50.0, 100.0, 250.0, 500.0, 1000.0]); _rl = _dcr.choice([20.0, 30.0, 40.0, 60.0])
        _kw = dict(rl=_rl, dVp=_dcr.choice([0.5, 1.0, 2.0]), ESR_m=round(_dcr.uniform(0, 80), 1), Rds_m=round(_dcr.uniform(2, 80), 1), Vf=round(_dcr.uniform(0.3, 0.8), 2), DCR_m=round(_dcr.uniform(2, 60), 1))
        if _n >= 6: _kw["C_uF"] = round(_dcr.uniform(20, 500), 1)
        if _n >= 7: _kw["L_uH"] = round(_dcr.uniform(30, 300), 1)
        if _dc_vec(_tp, _Vi, _Vo, _Io, _fk, **_kw): _n += 1
assert _dc_vec(0, 48.0, 12.0, 5.0, 100.0)                                       # the ideal buck of the Power Converter calculator: D 0.25, 60 uH, 15.625 uF
assert _dc_vec(1, 12.0, 48.0, 2.0, 200.0)                                       # ideal boost, D 0.75
assert _dc_vec(2, 12.0, 12.0, 3.0, 100.0)                                       # ideal buck-boost, D 0.5
assert _dc_vec(0, 24.0, 5.0, 8.0, 500.0, 30.0, None, 1.0, None, 20.0, 10.0, 0.5, 15.0)   # a real synchronous-style buck
assert _dc_vec(1, 12.0, 24.0, 4.0, 100.0, 40.0, 47.0, 1.0, 220.0, 30.0, 25.0, 0.6, 20.0) # a real boost with the inductor and capacitor given
assert _dc_vec(2, 24.0, 36.0, 1.5, 250.0, 30.0, None, 1.0, 100.0, 40.0, 40.0, 0.5, 30.0) # a real buck-boost

# --- v1.97.16 work: switching-loss-comparison (own stream, earlier vectors unchanged) ---
# Written from the switching waveforms, not the closed-form losses. Turn-on: the drain voltage is held at V while the current ramps 0 to I over tr (energy = integral of v i dt by Gauss-Legendre);
# turn-off: the current is held at I while the voltage ramps 0 to V over tf. Conduction: I^2 Rds integrated over the on-time D T and divided by T. Gate drive: a constant gate current Ig charges
# the gate to Vg, so the energy per cycle is the integral of Vg Ig dt over the charge time Qg / Ig. Each loss is its energy per cycle times the frequency. The break-even frequency is the root of
# the difference of two devices' total losses found by bisection (it exists only when the difference changes sign), and the conduction / switching crossover is the root of Pc - (Psw + Pg) by bisection.
def _sl_dev(V, I, D, fk, Vg, Rds_m, tr_ns, tf_ns, Qg_nC):
    f = fk * 1e3; T = 1.0 / f; Rds = Rds_m * 1e-3; tr = tr_ns * 1e-9; tf = tf_ns * 1e-9; Qg = Qg_nC * 1e-9
    def gint(g, a, b):
        h, m = 0.5 * (b - a), 0.5 * (b + a)
        return h * sum(w * g(m + h * x) for x, w in zip(_CRX, _CRW))
    Eon = gint(lambda t: V * (I * t / tr), 0.0, tr)
    Eoff = gint(lambda t: (V * t / tf) * I, 0.0, tf)
    Ec = gint(lambda t: I * I * Rds, 0.0, D * T)
    Ig = 1.0; Eg = gint(lambda t: Vg * Ig, 0.0, Qg / Ig)
    return {"Pc": Ec / T, "Psw": (Eon + Eoff) * f, "Pg": Eg * f, "Ec": Ec, "Esw": Eon + Eoff, "Eg": Eg}
def _sl_total(dev, f):
    return dev["Ec"] * f + dev["Esw"] * f + dev["Eg"] * f
def _sl_root(fn, hi=1e12):
    lo = 0.0
    flo, fhi = fn(lo), fn(hi)
    if flo == 0 or flo * fhi > 0: return None
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if fn(mid) * flo > 0: lo = mid
        else: hi = mid
    return 0.5 * (lo + hi)
def _sl_vec(V, I, D, fk, Vg, devs):
    f = fk * 1e3
    if any((tr + tf) * 1e-9 * f >= min(D, 1 - D) for (_, tr, tf, _) in [(d[0], d[1], d[2], d[3]) for d in devs]): return False
    R = [_sl_dev(V, I, D, fk, Vg, *d) for d in devs]
    names = "ABC"; inp = {"V": V, "I": I, "D": D, "fsw": fk, "Vg": Vg}; out = {}
    for n, d, r in zip(names, devs, R):
        inp["Rds" + n], inp["tr" + n], inp["tf" + n], inp["Qg" + n] = d
        Pt = r["Pc"] + r["Psw"] + r["Pg"]
        out.update({"Pc" + n: r["Pc"], "Psw" + n: r["Psw"], "Pg" + n: r["Pg"], "Pt" + n: Pt, "Pd" + n: r["Pc"] + r["Psw"], "sh" + n: (r["Psw"] + r["Pg"]) / Pt * 100})
        # conduction loss does not depend on f, so solve Pc = (Esw + Eg) f by bisection on f
        fc = _sl_root(lambda x: r["Pc"] - (r["Esw"] + r["Eg"]) * x)
        if fc is not None: out["fc" + n] = fc / 1e3
    Pts = [out["Pt" + n] for n in names[:len(R)]]
    best = Pts.index(min(Pts)) + 1; worst = Pts.index(max(Pts)) + 1
    if sorted(Pts)[1] - sorted(Pts)[0] < 1e-9 * max(Pts): return False     # a tie for the lowest is not compared
    out["best"] = best; out["dP"] = max(Pts) - min(Pts); out["dpct"] = (max(Pts) - min(Pts)) / max(Pts) * 100
    for a in range(len(R)):
        for c in range(a + 1, len(R)):
            ra, rc = R[a], R[c]
            fx = _sl_root(lambda x: (ra["Pc"] + (ra["Esw"] + ra["Eg"]) * x) - (rc["Pc"] + (rc["Esw"] + rc["Eg"]) * x))
            if fx is not None and fx > 0: out["fx" + names[a] + names[c]] = fx / 1e3
    add("switching-loss-comparison", inp, {k: v for k, v in out.items() if abs(v) > 1e-12}, 5e-6)
    return True
_slr = random.Random(20261121)
def _sl_rand_dev():
    return (round(_slr.uniform(1, 200), 1), round(_slr.uniform(5, 80), 1), round(_slr.uniform(5, 80), 1), round(_slr.uniform(5, 300), 1))
for _nd in (2, 2, 2, 3):
    _n = 0
    while _n < (14 if _nd == 2 else 10):
        _V = _slr.choice([12.0, 24.0, 48.0, 100.0, 400.0]); _I = round(_slr.uniform(1, 60), 1); _D = round(_slr.uniform(0.1, 0.9), 2)
        _fk = _slr.choice([20.0, 50.0, 100.0, 200.0, 500.0, 1000.0]); _Vg = _slr.choice([5.0, 10.0, 12.0, 15.0])
        if _sl_vec(_V, _I, _D, _fk, _Vg, [_sl_rand_dev() for _ in range(_nd)]): _n += 1
assert _sl_vec(48.0, 10.0, 0.5, 100.0, 10.0, [(10.0, 20.0, 20.0, 50.0), (4.0, 35.0, 30.0, 140.0)])                         # the guide example, A = 1.51 W
assert _sl_vec(48.0, 10.0, 0.5, 200.0, 10.0, [(10.0, 20.0, 20.0, 50.0), (4.0, 35.0, 30.0, 140.0), (15.0, 8.0, 8.0, 20.0)])  # three devices
assert _sl_vec(400.0, 20.0, 0.4, 50.0, 12.0, [(60.0, 30.0, 25.0, 40.0), (25.0, 55.0, 45.0, 120.0)])                      # a 400 V stage

# --- v1.97.17 work: adc-sampling (own stream, earlier vectors unchanged) ---
# Written from the converter's physical behaviour, not the closed forms. The count is the number of transition levels V0 + k LSB (k = 1 ... 2^N - 1) at or below the input, counted with exact
# fractions (bisection over the transition table), so no division or floor is used. The ideal SNR is the power ratio of a full-scale sine (amplitude FSR / 2, power A^2 / 2) to the quantisation
# noise of a uniform error over one step (power LSB^2 / 12), in dB; ENOB is that relation solved for the number of bits at the given SINAD. The alias is found by folding the tone onto the sampling
# circle: take f modulo fs and reflect it about fs / 2. Oversampling by OSR spreads the same noise over OSR times the bandwidth, so the in-band noise power falls by OSR and the SNR rises by 10 log10 OSR dB.
from fractions import Fraction as _Fr
def _ad_code(vlo, lsb, nlev, v):
    lo, hi = 0, nlev - 1                     # the highest k with vlo + k*lsb <= v, k in 0 .. nlev - 1
    if v < vlo: return 0
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if vlo + mid * lsb <= v: lo = mid
        else: hi = mid - 1
    return lo
def _ad_vec(bits, fsr, vlo, v, slo, shi, span, fmax, fs, sinad):
    fsr_, vlo_, v_, slo_, shi_ = [_Fr(str(x)) for x in (fsr, vlo, v, slo, shi)]
    nlev = 2 ** bits; lsb = fsr_ / nlev
    if not (slo_ >= vlo_ and shi_ <= vlo_ + fsr_ and shi_ > slo_ and sinad > 1.77): return False
    code = _ad_code(vlo_, lsb, nlev, v_)
    sig_p = (fsr / 2.0) ** 2 / 2.0; noise_p = (float(lsb)) ** 2 / 12.0
    snr = 10 * math.log10(sig_p / noise_p)
    enob = (sinad - 10 * math.log10(1.5)) / (20 * math.log10(2))
    cnt = float((shi_ - slo_) / lsb)
    osr = fs / (2.0 * fmax)
    out = {"lsb": float(lsb) * 1e3, "levels": nlev, "maxcode": nlev - 1, "code": code, "qerr": float(lsb) * 1e3 / 2, "qpct": 50.0 / nlev, "snr": snr, "enob": enob, "lost": bits - enob,
           "cnt": cnt, "frac": float((shi_ - slo_) / fsr_ * 100), "bused": math.log2(cnt), "rpct": 100.0 / cnt, "upc": span / cnt, "gmax": float(fsr_ / (shi_ - slo_)), "nyq": fs / 2.0 / 1e3, "osr": osr}
    if osr > 1: out["xbits"] = 10 * math.log10(osr) / (20 * math.log10(2))
    if fmax > fs / 2.0:
        r = math.fmod(fmax, fs); r = fs - r if r > fs / 2.0 else r
        if r > 1e-12: out["alias"] = r
    add("adc-sampling", {"bits": bits, "fsr": fsr, "vlo": vlo, "v": v, "slo": slo, "shi": shi, "span": span, "fmax": fmax, "fs": fs, "sinad": sinad}, out, 1e-9)
    return True
_adr = random.Random(20261122)
_n = 0
while _n < 40:
    _b = _adr.choice([6, 8, 10, 12, 14, 16, 18, 20, 24]); _fsr = _adr.choice([1.0, 2.5, 3.3, 5.0, 10.0, 12.288]); _vlo = _adr.choice([0.0, 0.0, 0.0, -_fsr / 2, -1.0])
    _vlo = round(_vlo, 3); _slo = round(_adr.uniform(_vlo, _vlo + _fsr * 0.5), 3); _shi = round(_adr.uniform(_slo + 0.05 * _fsr, _vlo + _fsr), 3)
    _v = round(_adr.uniform(_vlo - 0.1, _vlo + _fsr + 0.1), 3); _span = round(_adr.uniform(1, 500), 2)
    _fm = _adr.choice([50.0, 400.0, 1000.0, 2500.0, 20000.0]); _fs = _adr.choice([1000.0, 2000.0, 8000.0, 10000.0, 44100.0, 100000.0, 192000.0]); _sn = round(_adr.uniform(20, 6.02 * _b + 1.0), 2)
    if _ad_vec(_b, _fsr, _vlo, _v, _slo, _shi, _span, _fm, _fs, _sn): _n += 1
assert _ad_vec(12, 3.3, 0.0, 1.65, 0.0, 3.3, 100.0, 1000.0, 10000.0, 68.0)                      # guide: 0.8057 mV, 2048 counts, 74 dB, ENOB 11
assert _ad_vec(12, 5.0, 0.0, 1.0, 1.0, 5.0, 16.0, 1000.0, 10000.0, 68.0)                        # guide: 4-20 mA on 250 ohm, 3277 counts, 4.883 uA each
assert _ad_vec(16, 10.0, -5.0, 0.0, -5.0, 5.0, 100.0, 1000.0, 100000.0, 90.0)                   # bipolar, 0 V is code 32768
assert _ad_vec(12, 3.3, 0.0, 1.0, 0.0, 3.3, 100.0, 1500.0, 2000.0, 68.0)                        # 1.5 kHz at 2 kHz folds to 500 Hz
assert _ad_vec(8, 3.3, 0.0, 3.2, 0.0, 3.3, 100.0, 900.0, 2000.0, 45.0)                          # near the Nyquist limit

# --- v1.97.18 work: load-factor (own stream, earlier vectors unchanged) ---
# Written from a metered load profile, not the closed forms. Each feeder gets a random demand profile in kW per interval (half-hour intervals over a number of days); the site profile is their sum.
# Energy is the sum of demand x interval length, the maximum demand is the largest interval of the site profile (the group maximum), the average demand is the mean of the profile, the load factor is
# energy / (maximum x hours) and the diversity factor is the sum of the feeders' own maxima over the group maximum. With the measured-maximum field blank, the profile is scaled so its peak equals Pc x DF.
_lfr = random.Random(20261123)
def _lf_vec(nfeed, days, blank_md):
    n = days * 48; dt = 0.5; hours = n * dt
    feeders = [[round(_lfr.uniform(0.1, 1.0) * _lfr.choice([20, 50, 120, 300]) * (0.4 + 0.6 * _lfr.random() ** 2), 1) for _ in range(n)] for _ in range(nfeed)]
    site = [sum(f[k] for f in feeders) for k in range(n)]
    Ps = sum(max(f) for f in feeders); gmax = max(site)
    Pc = round(Ps * _lfr.uniform(1.05, 1.8), 1); df = round(_lfr.uniform(0.3, 0.95), 2)
    if blank_md:
        gmax = round(Pc * df, 3); k = _lfr.randrange(n); scale = gmax / max(site); site = [x * scale for x in site]; Ps = gmax * _lfr.uniform(1.0, 1.3); Ps = round(Ps, 3)
        if Ps > Pc: return False
    E = sum(site) * dt
    if E / hours > gmax or gmax > Pc or Ps > Pc: return False
    lf = E / (gmax * hours)
    inp = {"Pc": Pc, "df": df, "mdm": "" if blank_md else gmax, "E": E, "T": hours, "Ps": Ps}
    out = {"md": gmax, "dfo": gmax / Pc, "pavg": sum(site) / n, "lf": lf, "lfp": lf * 100, "gap": gmax - sum(site) / n, "emax": gmax * hours, "unused": (1 - lf) * 100, "dvf": Ps / gmax}
    add("load-factor", inp, out, 1e-9)
    return True
_n = 0
while _n < 24:
    if _lf_vec(_lfr.choice([2, 3, 4]), _lfr.choice([1, 7, 30]), _n % 3 == 2): _n += 1


# --- v1.97.19 work: rc-rl-transient (own stream, earlier vectors unchanged) ---
# Written from the circuit differential equations, not the closed exponentials. RC: C dv/dt = (Vs - v)/R with Vs = V (charging) or 0 (discharging), v(0) = 0 or V.
# RL: L di/dt = Vs - R i with Vs = V (step) or 0 (decay), i(0) = 0 or I0. The state is integrated with fourth-order Runge-Kutta (the step is a small fraction of the time constant).
# The time constant is read from the initial slope (tau = (final - start) / slope at t = 0, the tangent-intercept definition), the half, 10-90%, 99% and chosen-level times are found by bisection on the
# integrated trajectory, the companion value is C dv/dt (resistor current) or L di/dt (inductor voltage) from the state equation, and the energy is half the element value times the state squared.
# Inputs are kohm, uF, H, V, A and ms; outputs time in ms, energy in mJ, frequency in Hz. A value that is exactly zero is left out.
rrt = random.Random(20261124)
def _rt_state(typ, R, C, L, V, I0, t, n=2000):
    # R ohm, C farad, L henry; returns the state (capacitor voltage or inductor current) at time t by RK4
    if typ in (1, 2): x = 0.0 if typ == 1 else V; Vs = V if typ == 1 else 0.0; f = lambda x: (Vs - x) / (R * C)
    else: x = 0.0 if typ == 3 else I0; Vs = V if typ == 3 else 0.0; f = lambda x: (Vs - R * x) / L
    h = t / n
    for _ in range(n):
        k1 = f(x); k2 = f(x + h / 2 * k1); k3 = f(x + h / 2 * k2); k4 = f(x + h * k3)
        x += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return x
def _rt_case(typ, Rk, Cu, LH, V, I0, tm, pl):
    R, C, L, t = Rk * 1e3, Cu * 1e-6, LH, tm * 1e-3
    if typ in (1, 2): y0 = 0.0 if typ == 1 else V; Vs = V if typ == 1 else 0.0; yfin = Vs; slope0 = (Vs - y0) / (R * C)
    else: y0 = 0.0 if typ == 3 else I0; Vs = V if typ == 3 else 0.0; yfin = Vs / R; slope0 = (Vs - R * y0) / L
    tau = (yfin - y0) / slope0
    yt = _rt_state(typ, R, C, L, V, I0, t) if t > 0 else y0
    if typ in (1, 2): z = abs(C * (Vs - yt) / (R * C)); en = 0.5 * C * yt * yt
    else: z = abs(L * (Vs - R * yt) / L); en = 0.5 * L * yt * yt
    def t_at(p):
        lo, hi = 0.0, 40 * tau
        for _ in range(70):
            mid = (lo + hi) / 2; y = _rt_state(typ, R, C, L, V, I0, mid, 400)
            if (y - y0) / (yfin - y0) < p: lo = mid
            else: hi = mid
        return (lo + hi) / 2
    o = {"tau": tau * 1e3, "fc": 1 / (2 * math.pi * tau), "y0": y0, "yfin": yfin, "yt": yt, "pct": (yt - y0) / (yfin - y0) * 100, "z": z, "en": en * 1e3,
         "tlev": t_at(pl / 100) * 1e3, "thalf": t_at(0.5) * 1e3, "t1090": (t_at(0.9) - t_at(0.1)) * 1e3, "t99": t_at(0.99) * 1e3}
    o = {k: v for k, v in o.items() if v != 0}
    add("rc-rl-transient", {"typ": typ, "R": Rk, "C": Cu, "L": LH, "V": V, "I0": I0, "t": tm, "pl": pl}, o, 1e-7)
for _k in range(40):
    _typ = 1 + _k % 4
    _Rk = round(rrt.uniform(0.05, 100), 3); _Cu = round(rrt.uniform(0.1, 2000), 2); _LH = round(rrt.uniform(0.01, 20), 3)
    _V = round(rrt.uniform(1, 480), 2); _I0 = round(rrt.uniform(0.01, 50), 3); _pl = round(rrt.uniform(5, 99.5), 1)
    _tau_ms = (_Rk * 1e3 * _Cu * 1e-6 if _typ <= 2 else _LH / (_Rk * 1e3)) * 1e3
    _tm = round(_tau_ms * rrt.uniform(0.05, 7), 6)
    _rt_case(_typ, _Rk, _Cu, _LH, _V, _I0, _tm, _pl)


# --- v1.97.20 work: magnetic-flux-density (own stream, earlier vectors unchanged) ---
# Written without the engine's closed forms and with mu0 from the CODATA 2018 value (1.25663706212e-6, which differs from 4 pi e-7 by about 5e-10 relative), tolerance 1e-8.
# Case 1: the flux is the surface integral of B over the rectangle (exact Fractions for the product). Case 2 and 3: H from Ampere's law round the loop (N I over the path length), B = mu H.
# Case 4: the field of the straight conductor is the Biot-Savart integral of mu0 I dx r / (4 pi (x^2 + r^2)^(3/2)) over the whole line, evaluated numerically with mpmath.quad, then H = B / mu.
# Inputs are A in cm2, l and r in cm; all outputs are in SI numbers (T, gauss, A/m, H/m, Wb, J/m3, N/m2). Expected zeros are left out.
from fractions import Fraction as _F
import mpmath as _mp
_mp.mp.dps = 30
rmf = random.Random(20261125); _MU0 = _F(125663706212, 10**17)
def _mf_case(typ):
    mur = round(rmf.choice([1, 1, 1, rmf.uniform(1, 5000)]), 2); Acm = round(rmf.uniform(0.5, 400), 2); Hh = round(rmf.uniform(-9e4, 9e4), 1) or 1.0
    Nt = rmf.randrange(1, 5000); Ia = round(rmf.uniform(0.01, 200), 3); lcm = round(rmf.uniform(1, 300), 2); rcm = round(rmf.uniform(0.5, 100), 2)
    phi = round(rmf.uniform(1e-6, 2e-3), 8)
    A = _F(str(Acm)) / 10000; mu = _MU0 * _F(str(mur))
    if typ == 1: B = _F(str(phi)) / A; H = B / mu
    elif typ == 2: H = _F(str(Hh)); B = mu * H
    elif typ == 3: H = _F(Nt) * _F(str(Ia)) / (_F(str(lcm)) / 100); B = mu * H
    else:
        r = _mp.mpf(rcm) / 100; Bm = _mp.quad(lambda x: _mp.mpf('1.25663706212e-6') * _mp.mpf(str(Ia)) * r / (4 * _mp.pi * (x * x + r * r) ** 1.5), [-_mp.inf, 0, _mp.inf]) * mur
        B = _F(str(Bm)) if False else _F(float(Bm)); H = B / mu
    Bf = float(B)
    o = {"B": Bf, "G": Bf * 1e4, "Hf": float(H), "mu": float(mu), "ph": float(B * A), "wd": float(B * B / (2 * mu)), "pm": float(B * B / (2 * _MU0))}
    o = {k: v for k, v in o.items() if v != 0}
    add("magnetic-flux-density", {"typ": typ, "mur": mur, "phi": phi, "A": Acm, "H": Hh, "Nt": Nt, "I": Ia, "l": lcm, "r": rcm}, o, 1e-8)
for _k in range(40): _mf_case(1 + _k % 4)

# --- v1.97.21 work: motor-efficiency-loss (own stream, earlier vectors unchanged) ---
# Written from the loss model, not the engine's closed forms. A motor is a fixed loss Pf plus a loss Pv x^2 that rises with the square of the load fraction x, with Pf + Pv equal to the full-load loss Pr (1/eta_r - 1).
# Case 1: the outputs are evaluated at the load. Case 2: the input power is built from a chosen load and then handed to the engine, which must recover that load; the expected load is found by bisection on Pin(x) = x Pr + Pf + Pv x^2 for a
# rounded input power (no quadratic formula). Case 3: the load is the slip ratio, in exact fractions. The load of peak efficiency is the root of d(eta)/dx = 0 found with mpmath.findroot and mpmath.diff (30 digits), not sqrt(Pf/Pv).
# Energy is kW x hours, cost is energy x tariff, and the replacement saving is Pin - Pout/eta2 held at the same shaft load. A third of the vectors give a no-load input power, a third leave the replacement blank.
import mpmath as _mp2
_mp2.mp.dps = 30
rme = random.Random(20261126)
def _me_case(mode):
    Pr = round(rme.choice([0.75, 2.2, 7.5, 15, 37, 55, 110, 250, 560]) * rme.uniform(0.9, 1.1), 3); etar = round(rme.uniform(78, 97), 2); fs = round(rme.uniform(15, 60), 1)
    Lr = Pr * (1 / (etar / 100) - 1); Pnl = None
    if rme.random() < 1 / 3: Pnl = round(Lr * rme.uniform(0.15, 0.8), 3)
    Pf = Pnl if Pnl is not None else Lr * fs / 100; Pv = Lr - Pf
    hrs = float(rme.choice([800, 2000, 4380, 6000, 8000, 8760])); tar = round(rme.uniform(0.5, 15), 2)
    eta2 = None if rme.random() < 1 / 3 else round(rme.uniform(80, 98.5), 2)
    inp = {"mode": mode, "Pr": Pr, "etar": etar, "fs": fs, "Pnl": "" if Pnl is None else Pnl, "hrs": hrs, "tar": tar, "eta2": "" if eta2 is None else eta2}
    pin_of = lambda x: x * Pr + Pf + Pv * x * x
    if mode == 1: xl = round(rme.uniform(5, 140), 2) / 100; inp["x"] = round(xl * 100, 2)
    elif mode == 2:
        Pim = round(pin_of(rme.uniform(0.1, 1.3)), 3); inp["Pim"] = Pim; lo, hi = 0.0, 5.0
        for _ in range(200):
            mid = (lo + hi) / 2
            if pin_of(mid) < Pim: lo = mid
            else: hi = mid
        xl = (lo + hi) / 2
    else:
        Ns = rme.choice([3000, 1500, 1000, 750]); Nr = Ns - rme.randrange(15, 80); Nm = Ns - rme.randrange(1, int((Ns - Nr) * 1.4) + 1)
        inp.update({"Ns": float(Ns), "Nr": float(Nr), "Nm": float(Nm)}); xl = float(_F(Ns - Nm, Ns - Nr))
    if not (0.01 < xl <= 1.5): return False
    Pout = xl * Pr; loss = Pf + Pv * xl * xl; Pin = Pout + loss
    eta_f = lambda x: x * Pr / (x * Pr + Pf + Pv * x * x)
    xp = float(_mp2.findroot(lambda x: _mp2.diff(lambda y: y * Pr / (y * Pr + Pf + Pv * y * y), x), 0.6))
    o = {"Pout": Pout, "Pin": Pin, "loss": loss, "eta": Pout / Pin * 100, "ld": xl * 100, "Pfx": Pf, "Pvr": Pv * xl * xl, "e100": eta_f(1) * 100, "e75": eta_f(0.75) * 100, "e50": eta_f(0.5) * 100, "e25": eta_f(0.25) * 100,
         "xp": xp * 100, "etap": eta_f(xp) * 100, "Ein": Pin * hrs, "El": loss * hrs, "cl": loss * hrs * tar}
    if eta2 is not None: dP = Pin - Pout / (eta2 / 100); o.update({"dP": dP, "dE": dP * hrs, "ds": dP * hrs * tar})
    o = {k: v for k, v in o.items() if v != 0}
    add("motor-efficiency-loss", inp, o, 1e-7)
    return True
_n = 0
while _n < 45:
    if _me_case(1 + _n % 3): _n += 1

# --- v1.97.22 work: boolean-logic (own stream, earlier vectors unchanged) ---
# Written without the engine's method. The engine lists every cube that lies inside the ON-set and keeps the maximal ones; here the primes come from the Quine-McCluskey tabular method on strings of 0, 1 and
# - (adjacent terms that differ in one position are merged until nothing merges, the terms that never merge are the primes). Essential primes come from the coverage chart (a minterm covered by one prime only).
# The cheapest cover is found by trying every subset of the primes: fewest terms, then fewest literals, and the number of covers at that cost is counted. Each minimal SOP and the product of sums built from the
# complement is evaluated back on all rows and must equal the truth table (asserted here, so a vector can only be written for a correct form). Gates are defined by counting the ones in the row number.
# 21 gate vectors (every gate at 2, 3 and 4 inputs), 24 random custom truth tables (8 per input count) and 3 named ones (the default 232, the six-cycle 231 with two minimal forms, and 18407).
import itertools as _it
rbl = random.Random(20261127)
def _bl_fv(n, fn, tt, r):
    c = bin(r).count("1")
    if fn == 1: return int(c == n)
    if fn == 2: return int(c > 0)
    if fn == 3: return int(c != n)
    if fn == 4: return int(c == 0)
    if fn == 5: return c % 2
    if fn == 6: return 1 - c % 2
    if fn == 7: return int(2 * c > n)
    return (tt >> r) & 1
def _bl_match(pat, r, n):
    return all(ch == "-" or int(ch) == (r >> (n - 1 - k)) & 1 for k, ch in enumerate(pat))
def _bl_primes(on, n):
    cur = {format(r, "0%db" % n) for r in on}; primes = set()
    while cur:
        nxt = set(); used = set(); L = sorted(cur)
        for a, b in _it.combinations(L, 2):
            d = [k for k in range(n) if a[k] != b[k]]
            if len(d) == 1 and a[d[0]] != "-" and b[d[0]] != "-":
                nxt.add(a[:d[0]] + "-" + a[d[0] + 1:]); used.add(a); used.add(b)
        primes |= (cur - used); cur = nxt
    return sorted(primes)
def _bl_min(g, n):
    on = [r for r in range(1 << n) if g[r]]
    if not on: return {"on": on, "pri": [], "ess": [], "cover": [], "ties": 1}
    pri = _bl_primes(on, n)
    ess = {p for p in pri if any(_bl_match(p, r, n) and sum(_bl_match(q, r, n) for q in pri) == 1 for r in on)}
    best = None; ties = 0
    for k in range(1, len(pri) + 1):
        for sub in _it.combinations(pri, k):
            if not all(any(_bl_match(p, r, n) for p in sub) for r in on): continue
            cost = (k, sum(len(p) - p.count("-") for p in sub))
            if best is None or cost < best[0]: best = (cost, sub); ties = 1
            elif cost == best[0]: ties += 1
    return {"on": on, "pri": pri, "ess": ess, "cover": list(best[1]), "ties": ties}
def _bl_case(n, fn, tt, xs):
    R = 1 << n; f = [_bl_fv(n, fn, tt, r) for r in range(R)]
    S = _bl_min(f, n); P = _bl_min([1 - v for v in f], n)
    for r in range(R):
        assert (1 if any(_bl_match(p, r, n) for p in S["cover"]) else 0) == f[r]
        # the product of sums: F is 0 exactly when some cube of the minimal SOP of F' is satisfied
        assert (0 if any(_bl_match(p, r, n) for p in P["cover"]) else 1) == f[r]
    ttn = sum(v << r for r, v in enumerate(f)); ones = sum(f)
    row = 0
    for k in range(n): row = row * 2 + xs[k]
    lits = lambda cov: sum(len(p) - p.count("-") for p in cov)
    dep = sum(1 for k in range(n) if any(f[r] != f[r ^ (1 << k)] for r in range(R)))
    kind = 1 if ones == 0 else (2 if ones == R else 0)
    o = {"F": f[row], "row": row, "ttn": ttn, "ttc": (1 << R) - 1 - ttn, "ones": ones, "zeros": R - ones, "pi": len(S["pri"]), "epi": len(S["ess"]),
         "sopT": len(S["cover"]), "sopL": lits(S["cover"]), "posT": len(P["cover"]), "posL": lits(P["cover"]), "dep": dep, "kind": kind}
    o = {k: v for k, v in o.items() if v != 0}
    inp = {"n": n, "fn": fn, "tt": tt if fn == 0 else rbl.choice(["", tt]), "xa": xs[0], "xb": xs[1], "xc": xs[2] if n > 2 else rbl.randrange(2), "xd": xs[3] if n > 3 else rbl.randrange(2)}
    add("boolean-logic", inp, o, 1e-9)
def _bl_xs(n): return [rbl.randrange(2) for _ in range(n)]
for _n in (2, 3, 4):
    for _fn in range(1, 8): _bl_case(_n, _fn, rbl.randrange(1 << (1 << _n)), _bl_xs(_n))
for _n in (2, 3, 4):
    for _k in range(8):
        _R = 1 << _n
        _tt = rbl.randrange(1 << _R) if _k % 2 == 0 else sum(1 << r for r in rbl.sample(range(_R), rbl.randrange(1, max(2, _R // 2 + 1))))
        _bl_case(_n, 0, _tt, _bl_xs(_n))
_bl_case(3, 0, 232, [1, 0, 1]); _bl_case(3, 0, 231, [0, 1, 0]); _bl_case(4, 0, 18407, [0, 1, 0, 1])


# --- v1.97.24 work: solar-inverter-sizing (own stream, earlier vectors unchanged) ---
# Written without the engine's closed forms, in exact Fraction arithmetic. The array is built module by module (every string is a list of Ns modules), so the rating is the sum of the module
# powers and a string voltage is the sum of the module voltages, each module voltage taken at the cell temperature from its own slope in volts per degree (tc / 100 x V at STC, per degree away from 25 C).
# The most modules allowed is found by adding modules one at a time while the string stays within the maximum DC voltage. The strings are dealt out to the MPPT inputs one at a time round the inputs
# and the busiest input is the one holding most strings. The power the inverter delivers is the lesser of the array output (after the efficiency) and its rating, and the clipped share is
# 1 - delivered / available. The array output at which the inverter reaches its rating is found by bisection on x in eta x Pdc = Pac, and the inverter for the target ratio by bisection on Pdc / Pac = r.
_sir = random.Random(20261128)
def _fr(x): return _Fr(str(x))
def _si_vec(Pm, Ns, Np, Voc, tcVoc, Vmp, tcVmp, Isc, Tmin, Tmax, PacKW, Vdc, Vlo, Vhi, nm, Ilim, eta, k, rt):
    Pm, Voc, tcVoc, Vmp, tcVmp, Isc, Tmin, Tmax, Vdc, Vlo, Vhi, Ilim, eta, k, rt = map(_fr, (Pm, Voc, tcVoc, Vmp, tcVmp, Isc, Tmin, Tmax, Vdc, Vlo, Vhi, Ilim, eta, k, rt))
    PacW = _fr(PacKW) * 1000
    strings = [[Pm] * Ns for _ in range(Np)]
    Pdc = sum(sum(st) for st in strings)
    slope = lambda V, tc: tc / 100 * V                       # volts per degree away from 25 C
    atT = lambda V, tc, T: V + slope(V, tc) * (T - 25)
    vstr = lambda V, tc, T: sum(atT(V, tc, T) for _ in range(Ns))
    Vc, Vh, Vk = vstr(Voc, tcVoc, Tmin), vstr(Vmp, tcVmp, Tmax), vstr(Vmp, tcVmp, Tmin)
    n = 0
    while (n + 1) * atT(Voc, tcVoc, Tmin) <= Vdc: n += 1
    held = [0] * nm
    for j in range(Np): held[j % nm] += 1
    spi = max(held); Iin = spi * Isc
    avail = Pdc * k * eta; delivered = min(avail, PacW)
    clip = 1 - delivered / avail
    lo, hi = _Fr(0), _Fr(100)                                # bisection for x with eta x Pdc = Pac
    for _ in range(200):
        mid = (lo + hi) / 2
        if eta * mid * Pdc < PacW: lo = mid
        else: hi = mid
    thr = float(lo) * 100
    lo2, hi2 = _Fr(0), Pdc * 1000                            # bisection for the inverter rating at which Pdc / Pac = rt
    for _ in range(200):
        mid = (lo2 + hi2) / 2
        if Pdc / mid > rt: lo2 = mid
        else: hi2 = mid
    Pt = float(lo2)
    PkW = float(avail) / 1000
    inp = {"Pm": float(Pm), "Ns": Ns, "Np": Np, "Voc": float(Voc), "tcVoc": float(tcVoc), "Vmp": float(Vmp), "tcVmp": float(tcVmp), "Isc": float(Isc), "Tmin": float(Tmin), "Tmax": float(Tmax),
           "Pac": PacKW, "Vdcmax": float(Vdc), "Vlo": float(Vlo), "Vhi": float(Vhi), "nm": nm, "Ilim": float(Ilim), "eta": float(eta), "k": float(k), "rt": float(rt)}
    out = {"Pdc": float(Pdc) / 1000, "nmod": Ns * Np, "r": float(Pdc / PacW), "Pt": Pt / 1000, "Pa": float(PacW * rt) / 1000, "Vc": float(Vc), "Nmax": n, "Vh": float(Vh), "Vk": float(Vk), "spi": spi,
           "Iin": float(Iin), "Pk": PkW, "ld": float(avail / PacW * 100), "thr": thr}
    if clip > 0: out["clip"] = float(clip * 100)
    add("solar-inverter-sizing", inp, out, 1e-9)
def _si_rand():
    Voc = round(_sir.uniform(30, 55), 2); Vmp = round(Voc * _sir.uniform(0.82, 0.88), 2)
    Vdc = _sir.choice([600, 1000, 1100, 1500]); Vhi = round(_sir.uniform(450, Vdc), 0)
    Pm = _sir.choice([320, 400, 450, 500, 545, 550, 600, 665]); Ns = _sir.randrange(6, 25); Np = _sir.randrange(1, 9)
    Pdc_kw = Ns * Np * Pm / 1000
    Pac = round(Pdc_kw / _sir.uniform(0.8, 1.7), 1)
    _si_vec(Pm, Ns, Np, Voc, round(_sir.uniform(-0.40, -0.20), 3), Vmp, round(_sir.uniform(-0.40, -0.22), 3), round(_sir.uniform(8, 18), 2),
            _sir.randrange(-25, 16), _sir.randrange(45, 91), Pac, Vdc, round(_sir.uniform(100, 300), 0), Vhi, _sir.randrange(1, 7), round(_sir.uniform(10, 40), 1),
            round(_sir.uniform(0.94, 0.99), 3), round(_sir.uniform(0.6, 1.1), 2), round(_sir.uniform(1.0, 1.5), 2))
for _ in range(32): _si_rand()
_si_vec(550, 12, 2, 49.5, -0.28, 41.5, -0.3, 13.9, -5, 70, 10, 1000, 200, 800, 2, 18, 0.98, 0.85, 1.25)    # the 24 x 550 W array on 10 kW from the DC to AC ratio guide
_si_vec(550, 18, 1, 49.5, -0.28, 41.5, -0.3, 13.9, -5, 70, 8, 1000, 200, 800, 1, 18, 0.98, 1.0, 1.25)      # 18 modules: at most 18 allowed, the string uses the limit
_si_vec(550, 12, 3, 49.5, -0.28, 41.5, -0.3, 13.9, -5, 70, 15, 1000, 200, 800, 2, 18, 0.98, 0.85, 1.25)   # three strings on two inputs: two on the busiest
_si_vec(400, 10, 2, 41.0, -0.30, 34.0, -0.33, 11.2, 0, 60, 12, 600, 150, 550, 1, 20, 0.97, 0.7, 1.0)       # inverter larger than the array: no clipping


# --- v1.97.25 work: hybrid-system-sizing (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed forms, in exact Fraction arithmetic. The day's energy is split into the generator share, the daytime share (drawn from the DC bus
# through the inverter) and the night share (the battery must deliver it, and putting that energy in costs 1 / round-trip efficiency of array energy). The number of modules is found by adding
# one module at a time until the daily array yield (kW x sun hours x performance ratio) covers the need; the days to refill the reserve are counted day by day from the daily surplus, with the
# last day taken as a fraction; the generator hours are counted by running it hour by hour at its loading until the energy is delivered; the battery rate is peak DC power over nominal energy.
_hyr = random.Random(20261129)
def _hy_fr(x): return _Fr(str(x))
def _hy_calc(E,Ppk,fn,fg,psh,PR,etai,rt,DoD,Da,Dr,Vb,Pm,ms,Cm,lg,sfc):
    E,Ppk,fn,fg,psh,PR,etai,rt,DoD,Da,Dr,Vb,Pm,ms,Cm,lg,sfc=map(_hy_fr,(E,Ppk,fn,fg,psh,PR,etai,rt,DoD,Da,Dr,Vb,Pm,ms,Cm,lg,sfc))
    # energy split: the day's energy is shared out hour by hour is not needed; split as shares
    Eg=E*fg; Es=E-Eg; En=Es*fn; Ed=Es-En
    # daytime energy: inverter draws Ed/etai from the DC bus straight from the array.
    # night energy: battery must deliver En/etai DC; putting that in costs (En/etai)/rt of array energy.
    batt_out_night=En/etai
    arr_for_day=Ed/etai
    arr_for_night=batt_out_night/rt
    Edc=arr_for_day+arr_for_night
    # battery: usable store must carry the autonomy days of the whole solar-served load, if that exceeds one night
    aut_store=Da*(Es/etai)
    usable=batt_out_night if batt_out_night>=aut_store else aut_store
    reserve=usable-batt_out_night      # store held back for cloudy days
    refill_per_day=(reserve/rt)/Dr
    Edr=Edc+refill_per_day
    # modules: add one at a time until the daily DC yield (kW x h x PR) covers the need
    n=0
    while n*Pm*psh*PR<Edr*1000: n+=1
    Parr=n*Pm; Yd=Parr*psh*PR/1000
    Ppv=Edr/(psh*PR)
    nominal=usable/DoD
    Ah=nominal*1000/Vb
    cyc=batt_out_night/nominal*100
    Cn=(Ppk/etai)/nominal
    # days to refill the reserve from the daily surplus, counted day by day
    need=reserve/rt; surplus=Yd-Edc; days=_Fr(0)
    if need>0:
        got=_Fr(0)
        while got+surplus<need: got+=surplus; days+=1
        days+=(need-got)/surplus
    Pinv=Ppk*ms
    Pgen=Ppk*ms if fg>0 else _Fr(0)
    # generator: delivers lg*Pgen each hour until the energy is supplied
    hg=_Fr(0)
    if fg>0:
        step=lg*Pgen; left=Eg
        while left>=step: left-=step; hg+=1
        hg+=left/step
    fuel=Eg*sfc
    f=float
    return {"Es":f(Es),"En":f(En),"Eg":f(Eg),"Edc":f(Edc),"Edr":f(Edr),"Ppv":f(Ppv),"nmod":n,"Parr":f(Parr/1000),"Yd":f(Yd),"Bu":f(usable),"Bn":f(nominal),"Ah":f(Ah),"cyc":f(cyc),"Cn":f(Cn),"drr":f(days),"Pinv":f(Pinv),"Pgen":f(Pgen),"hg":f(hg),"fuel":f(fuel)}

def _hy_vec(**k):
    r = _hy_calc(**k)
    inp = {"E": k["E"], "Ppk": k["Ppk"], "fn": k["fn"], "fg": k["fg"], "psh": k["psh"], "PR": k["PR"], "etai": k["etai"], "rt": k["rt"], "DoD": k["DoD"], "Da": k["Da"], "Dr": k["Dr"],
           "Vb": k["Vb"], "Pm": k["Pm"], "ms": k["ms"], "Cm": k["Cm"], "lg": k["lg"], "sfc": k["sfc"]}
    add("hybrid-system-sizing", inp, r, 1e-9)
def _hy_rand():
    E = round(_hyr.uniform(5, 200), 1); Ppk = round(E / _hyr.uniform(4, 20), 2)
    _hy_vec(E=E, Ppk=Ppk, fn=round(_hyr.uniform(0, 1), 2), fg=_hyr.choice([0, 0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.6]), psh=round(_hyr.uniform(2.5, 7), 2), PR=round(_hyr.uniform(0.6, 0.85), 2),
            etai=round(_hyr.uniform(0.9, 0.98), 3), rt=round(_hyr.uniform(0.8, 0.98), 2), DoD=round(_hyr.uniform(0.5, 0.95), 2), Da=_hyr.choice([0, 0.5, 1, 1.5, 2, 3, 5]), Dr=_hyr.randrange(1, 11),
            Vb=_hyr.choice([12, 24, 48, 96, 400]), Pm=_hyr.choice([320, 400, 450, 500, 545, 550, 600, 665]), ms=round(_hyr.uniform(1, 1.6), 2), Cm=round(_hyr.uniform(0.2, 1), 2),
            lg=round(_hyr.uniform(0.4, 0.9), 2), sfc=round(_hyr.uniform(0.2, 0.45), 3))
for _ in range(32): _hy_rand()
_hb = dict(E=20, Ppk=5, fn=0.6, fg=0.1, psh=5, PR=0.75, etai=0.95, rt=0.9, DoD=0.8, Da=1, Dr=3, Vb=48, Pm=550, ms=1.25, Cm=0.5, lg=0.7, sfc=0.35)
_hy_vec(**_hb)                                    # the default: 20 kWh/day, 10% on the generator
_hy_vec(**{**_hb, "fg": 0})                       # no generator
_hy_vec(**{**_hb, "Da": 0})                       # battery for the night only, no reserve
_hy_vec(**{**_hb, "fn": 1, "fg": 0})              # everything after dark: autonomy equals the night
_hy_vec(**{**_hb, "fn": 0, "fg": 0})              # everything in daylight: the battery is all reserve
_hy_vec(**{**_hb, "E": 100, "fg": 0.95, "lg": 0.5})   # generator running more than 24 hours


# --- v1.97.26 work: bess-energy-power (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed forms, in exact Fraction arithmetic. The discharge is run minute by minute: each minute the converter delivers P dt on the AC side and
# the battery gives up that energy divided by the one-way efficiency, which is found by bisection on eta x eta = round-trip efficiency (the engine takes the square root). The recharge finds the
# grid power by bisection so that the DC energy put into the battery over the recharge time equals the energy drawn out. The nameplate energy is the smallest capacity (bisection) whose
# end-of-life usable share (nameplate x SOH x DoD) covers the DC energy drawn. The yearly energy is summed day by day over 365 days at the cycles per day, and the years to the cycle life are
# counted day by day with the last day taken as a fraction. The converter rating is the modulus of the complex power P + jQ with Q = P tan(acos pf).
_ber = random.Random(20261130)
def _be_fr(x): return _Fr(str(x))
def _be_eta(rt):
    lo, hi = _Fr(0), _Fr(1)
    for _ in range(140):
        mid = (lo + hi) / 2
        if mid * mid < rt: lo = mid
        else: hi = mid
    return (lo + hi) / 2
def _be_calc(Pd, Td, rt, DoD, SOH, Tc, pf, n, Ncyc):
    Pd, Td, rt, DoD, SOH, Tc, pf, n, Ncyc = map(_be_fr, (Pd, Td, rt, DoD, SOH, Tc, pf, n, Ncyc))
    eta = _be_eta(rt)
    # discharge, minute by minute
    steps = int(Td * 60); dt = _Fr(1, 60)
    ac_out = _Fr(0); dc_out = _Fr(0)
    for _ in range(steps):
        e = Pd * dt; ac_out += e; dc_out += e / eta
    # recharge: bisection on the grid power so that the DC energy in equals the DC energy out
    csteps = int(Tc * 60); lo, hi = _Fr(0), Pd * 1000
    for _ in range(140):
        mid = (lo + hi) / 2
        dc_in = _Fr(0)
        for _ in range(1): dc_in = mid * eta * dt * csteps
        if dc_in < dc_out: lo = mid
        else: hi = mid
    Pch = (lo + hi) / 2; Ein = Pch * Tc
    # nameplate: smallest capacity whose end-of-life usable share covers the DC energy drawn
    lo, hi = _Fr(0), dc_out * 1000
    for _ in range(140):
        mid = (lo + hi) / 2
        if mid * SOH * DoD < dc_out: lo = mid
        else: hi = mid
    Enom = (lo + hi) / 2
    Pdc = Pd / eta
    # yearly energy, day by day
    Eyr = _Fr(0)
    for _d in range(365): Eyr += n * ac_out
    Lyr = _Fr(0)
    for _d in range(365): Lyr += n * (Ein - ac_out)
    # years to the cycle life: whole days, then the last day as a fraction
    cyc = _Fr(0); days = _Fr(0)
    while cyc + n <= Ncyc: cyc += n; days += 1
    days += (Ncyc - cyc) / n
    Q = Pd * _Fr(math.sqrt(1 - float(pf) ** 2) / float(pf)) if pf < 1 else _Fr(0)
    S = math.hypot(float(Pd), float(Q))
    f = float
    return {"Eout": f(ac_out), "Edc": f(dc_out), "Ein": f(Ein), "Eloss": f(Ein - ac_out), "Enom": f(Enom), "Ebol": f(Enom * DoD), "Ehr": f(Enom / Pd), "Pdc": f(Pdc), "Cd": f(Pdc / Enom),
            "Pch": f(Pch), "Cc": f(dc_out / Tc / Enom), "S": S, "Eyr": f(Eyr / 1000), "Lyr": f(Lyr / 1000), "yrs": f(days / 365)}

def _be_vec(Pd, Td, rt, DoD, SOH, Tc, Cm, pf, n, Ncyc):
    r = _be_calc(Pd, Td, rt, DoD, SOH, Tc, pf, n, Ncyc)
    add("bess-energy-power", {"Pd": Pd, "Td": Td, "rt": rt, "DoD": DoD, "SOH": SOH, "Tc": Tc, "Cm": Cm, "pf": pf, "n": n, "Ncyc": Ncyc}, r, 1e-9)
def _be_rand():
    while True:
        Td = _ber.randrange(2, 33) * 0.25; Tc = _ber.randrange(2, 41) * 0.25
        n = _ber.choice([0.25, 0.5, 1, 1.5, 2, 3])
        if n * (Td + Tc) <= 24: break
    _be_vec(round(_ber.uniform(50, 60000), 0), Td, round(_ber.uniform(0.75, 0.96), 3), round(_ber.uniform(0.5, 0.98), 2), round(_ber.uniform(0.6, 1.0), 2), Tc,
            round(_ber.uniform(0.2, 1.0), 2), round(_ber.uniform(0.8, 1.0), 2), n, _ber.randrange(1000, 12001, 250))
for _ in range(32): _be_rand()
_be_vec(1000, 4, 0.88, 0.9, 0.8, 4, 0.5, 1, 1, 6000)       # the default: 1 MW for 4 h
_be_vec(1000, 2, 0.85, 0.9, 0.8, 2, 0.5, 0.9, 1.5, 4000)   # 1.5 cycles a day, 0.9 power factor
_be_vec(500, 1, 0.88, 0.9, 0.8, 4, 0.5, 1, 1, 6000)        # short duration: high discharge C-rate
_be_vec(1000, 4, 0.88, 0.9, 0.8, 1, 0.5, 1, 1, 6000)       # one-hour recharge: high charge C-rate
_be_vec(2500, 6, 0.92, 0.95, 1.0, 12, 0.3, 0.95, 0.5, 8000)  # a new battery, one cycle every second day
_be_vec(100, 0.5, 0.8, 0.5, 0.6, 0.5, 1.0, 0.8, 4, 1500)   # half-hour system, four cycles a day

# --- v1.97.27 work: ev-energy-consumption (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's force x speed formulas, with 30-digit mpmath: the vehicle drives one kilometre of road in 50 segments of 20 m. In each segment the work done
# is added up from its sources: the rolling work is Crr x (normal force) x ds with the normal force m g / sqrt(1 + G^2); the drag work is (1/2) rho Cd A v^2 x ds; the grade work is m g x the
# height gained (ds x G / sqrt(1 + G^2)), so the road angle is never taken (rise over run gives the sine and cosine algebraically, where the engine uses atan, sin and cos). The battery energy
# of a segment is its work divided by the drivetrain efficiency when positive, or times the regeneration efficiency when negative, plus the auxiliary power times the segment time ds / v. The
# forces are the work per metre, the wheel power is the work per metre times the speed, the energy per km is the sum over the 50 segments, and the trip, yearly and cost figures are built from it.
_evr = random.Random(20261201)
def _ev_calc(m, v, Cd, A, Crr, rho, gr, etad, etar, Pa, etac, D, Dyr, price):
    mp.mp.dps = 30
    m, Cd, A, Crr, rho, etad, etar, etac, price = [mp.mpf(str(x)) for x in (m, Cd, A, Crr, rho, etad, etar, etac, price)]
    v = mp.mpf(str(v)) / mp.mpf('3.6'); G = mp.mpf(str(gr)) / 100; Pa = mp.mpf(str(Pa)) * 1000
    g = mp.mpf('9.80665'); D = mp.mpf(str(D)); Dyr = mp.mpf(str(Dyr))
    root = mp.sqrt(1 + G * G)
    ds = mp.mpf(1000) / 50
    Wr = Wa = Wg = Eb = mp.mpf(0)
    for _k in range(50):
        wr = Crr * (m * g / root) * ds
        wa = mp.mpf(1) / 2 * rho * Cd * A * v * v * ds
        wg = m * g * (ds * G / root)
        w = wr + wa + wg
        Wr += wr; Wa += wa; Wg += wg
        Eb += (w / etad if w >= 0 else w * etar) + Pa * ds / v
    Fr, Fa, Fg = Wr / 1000, Wa / 1000, Wg / 1000
    Ft = Fr + Fa + Fg
    Ekm = Eb / 3600                      # Wh per km of road
    Egr = Ekm / etac
    kmkwh = 1000 / Egr
    f = float
    return {"Fr": f(Fr), "Fa": f(Fa), "Fg": f(Fg), "Ft": f(Ft), "ash": f(100 * Fa / (Fr + Fa)), "Pw": f(Ft * v / 1000), "Pb": f(Ekm * 3600 / 1000 * v / 1000),
            "Ekm": f(Ekm), "Egr": f(Egr), "E100": f(Ekm / 10), "E100g": f(Egr / 10), "kmkwh": f(kmkwh), "mikwh": f(kmkwh / mp.mpf('1.609344')),
            "Tt": f(D / (v * 3600) * 1000), "Etb": f(Ekm * D / 1000), "Etg": f(Egr * D / 1000), "Eyr": f(Egr * Dyr / 1000), "Cyr": f(Egr * Dyr / 1000 * price),
            "C100": f(Egr / 10 * price)}
def _ev_vec(**k):
    r = _ev_calc(**k)
    if r["Pb"] <= 0: return False
    if k["gr"] == 0: r.pop("Fg")
    add("ev-energy-consumption", dict(k), r, 1e-9)
    return True
def _ev_rand():
    while True:
        k = dict(m=_evr.randrange(900, 3501, 10), v=_evr.randrange(20, 161, 5), Cd=round(_evr.uniform(0.2, 0.45), 2), A=round(_evr.uniform(1.8, 3.2), 2),
                 Crr=round(_evr.uniform(0.006, 0.015), 3), rho=round(_evr.uniform(1.0, 1.3), 2), gr=round(_evr.uniform(-6, 8), 1), etad=round(_evr.uniform(0.75, 0.95), 2),
                 etar=round(_evr.uniform(0.3, 0.8), 2), Pa=round(_evr.uniform(0, 3), 1), etac=round(_evr.uniform(0.8, 0.97), 2), D=_evr.randrange(5, 601, 5),
                 Dyr=_evr.randrange(3000, 40001, 500), price=round(_evr.uniform(0.05, 0.6), 2))
        if _ev_vec(**k): return
for _ in range(32): _ev_rand()
_evb = dict(m=1800, v=90, Cd=0.28, A=2.3, Crr=0.01, rho=1.2, gr=0, etad=0.88, etar=0.6, Pa=0.5, etac=0.9, D=100, Dyr=15000, price=0.15)
_ev_vec(**_evb)                                            # the default: 1,800 kg at 90 km/h on the level
_ev_vec(**{**_evb, "v": 130})                              # motorway speed: air drag dominates
_ev_vec(**{**_evb, "gr": 5})                               # a 5 % climb
_ev_vec(**{**_evb, "v": 60, "gr": -2, "Pa": 1.5})          # a 2 % descent: negative wheel power, regeneration applies
_ev_vec(**{**_evb, "Pa": 0, "etad": 1.0, "etar": 1.0, "etac": 1.0})   # no losses at all: the bare road load
_ev_vec(**{**_evb, "m": 2600, "v": 30, "Pa": 3.0})         # a heavy vehicle at city speed with a large auxiliary load

# --- v1.97.28 work: equipment-loss (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed forms, with 30-digit mpmath, and without scaling the data-sheet losses by x^2 or by a fixed share. Each item is built as a circuit and the
# year is stepped hour by hour. The transformer is a three-phase equivalent circuit at a line voltage VL (the answer does not depend on the VL chosen): the iron loss is 3 Vph^2 / Rc with the core
# resistance Rc = 3 Vph^2 / Pfe, and the copper loss is 3 I^2 Req with the rated phase current Irated = S / (sqrt3 VL) and Req = Pcu / (3 Irated^2), the load current being x Irated; the efficiency is
# the output x S pf over the output plus the two losses. The motor is a rated input Pr / eta whose loss Pin - Pr is split into a fixed power (the stated share) and a winding loss 3 Ir^2 Rw in an
# equivalent resistance found at a fictitious rated current Ir = 100 A, the load current being y Ir. The cable is summed conductor by conductor: three (or two) conductors each carrying I and each with
# resistance R L / 1000, and the power it carries is sqrt3 V I pf (or V I pf). The energy is the sum over the 8,784-hour calendar of the loss in force in each hour: iron loss while the transformer is
# energised (hours before Hte), copper loss while it is loaded (hours before Htl), the motor loss while it runs (before Hm) and the cable loss while it carries (before Hc).
_elr = random.Random(20261202)
def _el_calc(S, Pfe, Pcu, x, pf, Hte, Htl, Pr, etar, fs, y, Hm, I, L, R, V, phase, Hc, tar):
    mp.mp.dps = 30
    m = lambda a: mp.mpf(str(a))
    S, Pfe, Pcu, x, pf, Pr, etar, fs, y, I, L, R, V, tar = [m(a) for a in (S, Pfe, Pcu, x, pf, Pr, etar, fs, y, I, L, R, V, tar)]
    s3 = mp.sqrt(3)
    VL = mp.mpf(11000); Vph = VL / s3
    Ir_t = S * 1000 / (s3 * VL)
    Rc = 3 * Vph ** 2 / (Pfe * 1000)
    Req = Pcu * 1000 / (3 * Ir_t ** 2)
    P_iron = 3 * Vph ** 2 / Rc                  # W
    P_cu = 3 * (x * Ir_t) ** 2 * Req            # W
    out_t = x * S * 1000 * pf
    ett = out_t / (out_t + P_iron + P_cu) * 100
    Pin_r = Pr * 1000 / (etar / 100)
    Ploss_r = Pin_r - Pr * 1000
    Pfix = Ploss_r * fs / 100
    Irm = mp.mpf(100)
    Rw = (Ploss_r - Pfix) / (3 * Irm ** 2)
    P_wind = 3 * (y / 100 * Irm) ** 2 * Rw
    Pm = Pfix + P_wind
    out_m = y / 100 * Pr * 1000
    etm = out_m / (out_m + Pm) * 100
    nc = 3 if phase == 3 else 2
    Rc_each = R * L / 1000
    P_cab = mp.mpf(0)
    for _c in range(nc): P_cab += I ** 2 * Rc_each
    carried = (s3 if phase == 3 else 1) * V * I * pf
    pcl = P_cab / carried * 100
    Et = Em = Ec = Ef = mp.mpf(0)
    for h in range(8784):
        if h < Hte: Et += P_iron; Ef += P_iron
        if h < Htl: Et += P_cu
        if h < Hm: Em += Pm; Ef += Pfix
        if h < Hc: Ec += P_cab
    Etot = Et + Em + Ec
    f = lambda a: float(a)
    return {"Ptfe": f(P_iron / 1000), "Ptcu": f(P_cu / 1000), "Pt": f((P_iron + P_cu) / 1000), "ett": f(ett), "Pmf": f(Pfix / 1000), "Pmv": f(P_wind / 1000), "Pm": f(Pm / 1000), "etm": f(etm),
            "Pc": f(P_cab / 1000), "pcl": f(pcl), "Ptot": f((P_iron + P_cu + Pm + P_cab) / 1000), "Et": f(Et / 1000), "Em": f(Em / 1000), "Ec": f(Ec / 1000), "Etot": f(Etot / 1000),
            "sT": f(Et / Etot * 100), "sM": f(Em / Etot * 100), "sC": f(Ec / Etot * 100), "fx": f(Ef / Etot * 100), "cost": f(Etot / 1000 * tar)}
def _el_vec(**k):
    add("equipment-loss", dict(k), _el_calc(**k), 1e-9)
def _el_rand():
    S = _elr.randrange(100, 5001, 50); Pfe = round(S * _elr.uniform(0.0008, 0.0025), 2) or 0.1
    Pcu = round(Pfe * _elr.uniform(3, 9), 2); Hte = _elr.randrange(2000, 8761, 10); Htl = _elr.randrange(1000, Hte + 1, 10)
    k = dict(S=S, Pfe=Pfe, Pcu=Pcu, x=round(_elr.uniform(0.1, 1.3), 2), pf=round(_elr.uniform(0.7, 1.0), 2), Hte=Hte, Htl=Htl,
             Pr=_elr.randrange(5, 401, 5), etar=round(_elr.uniform(85, 97), 1), fs=_elr.randrange(20, 51), y=_elr.randrange(20, 131, 5), Hm=_elr.randrange(1000, 8761, 10),
             I=_elr.randrange(20, 801, 5), L=_elr.randrange(20, 2001, 10), R=round(_elr.uniform(0.05, 1.5), 3), V=_elr.choice([230, 400, 415, 690, 3300]),
             phase=_elr.choice([1, 3]), Hc=_elr.randrange(1000, 8761, 10), tar=round(_elr.uniform(0.05, 10), 2))
    _el_vec(**k)
for _ in range(32): _el_rand()
_elb = dict(S=1000, Pfe=1.7, Pcu=10.5, x=0.6, pf=0.9, Hte=8760, Htl=6000, Pr=55, etar=93, fs=35, y=75, Hm=6000, I=100, L=200, R=0.2, V=400, phase=3, Hc=6000, tar=8)
_el_vec(**_elb)                                             # the default
_el_vec(**{**_elb, "phase": 1, "V": 230})                   # single-phase cable
_el_vec(**{**_elb, "x": 0.2})                               # a lightly loaded transformer: iron loss dominates
_el_vec(**{**_elb, "x": 1.2, "y": 120})                     # transformer and motor both overloaded
_el_vec(**{**_elb, "Htl": 8760, "Hm": 8760, "Hc": 8760})    # everything runs all year
_el_vec(**{**_elb, "I": 300, "L": 1000, "R": 0.3})          # a long, heavily loaded cable

# --- v1.97.29 work: calibration-error (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed forms, with 30-digit mpmath and exact fractions, without the engine's error formula or its normal equations. Each reading is placed on a
# normalised scale first: t = (reading - lo) / (hi - lo) is the fraction of span, so the error in % of span is 100 (t_reading - t_applied) and the applied fraction needs no reference value.
# The tolerance test is an exact fraction comparison (Fraction built from the decimal text of each input). The zero and span error are the two coefficients of the least-squares straight line
# found by QR decomposition of the design matrix [1, p] (mpmath qr and back substitution), not from the sums of squares; the left-over is the largest residual of that fit. The ratio is tolerance over
# reference accuracy.
from fractions import Fraction
_cer = random.Random(20261203)
def _ce_calc(lo, hi, tol, unc, n, pts):
    mp.mp.dps = 30
    Fr = lambda a: Fraction(str(a))
    lo_f, hi_f, tol_f = Fr(lo), Fr(hi), Fr(tol)
    span_f = hi_f - lo_f
    f_err, l_err, nbf, nbl = [], [], 0, 0
    for (p, a, b) in pts[:n]:
        t_a = (Fr(a) - lo_f) / span_f; t_b = (Fr(b) - lo_f) / span_f; t_p = Fr(p) / 100
        ef = 100 * (t_a - t_p); el = 100 * (t_b - t_p)
        f_err.append(ef); l_err.append(el)
        if abs(ef) > tol_f: nbf += 1
        if abs(el) > tol_f: nbl += 1
    A = mp.matrix([[1, mp.mpf(pts[k][0])] for k in range(n)])
    y = mp.matrix([mp.mpf(f_err[k].numerator) / mp.mpf(f_err[k].denominator) for k in range(n)])
    Q, R = mp.qr(A)                              # full QR: A = Q R, R upper triangular in its first two rows
    Qty = Q.T * y
    b1 = Qty[1] / R[1, 1]; z = (Qty[0] - R[0, 1] * b1) / R[0, 0]     # back substitution
    nonlin = max(abs(y[k] - (z + b1 * mp.mpf(pts[k][0]))) for k in range(n))
    af = [abs(e) for e in f_err]; wmax = max(af); wf = af.index(wmax) + 1
    out = {}
    for k in range(n):
        out["f%d" % (k + 1)] = float(f_err[k]); out["l%d" % (k + 1)] = float(l_err[k])
    out.update({"fm": float(wmax), "fmu": float(wmax * span_f / 100), "wf": wf, "lm": float(max(abs(e) for e in l_err)), "nbf": nbf, "nbl": nbl,
                "z": float(z), "sp": float(100 * b1), "nonlin": float(nonlin)})
    for _k in ("z", "sp", "nonlin"):
        if abs(out[_k]) < 1e-25: out[_k] = 0.0      # a fit that is exact to 30 digits is exactly zero
    if unc > 0: out["tur"] = float(tol_f / Fr(unc))
    return out
def _ce_vec(lo, hi, tol, unc, n, pts):
    inp = dict(lo=lo, hi=hi, tol=tol, unc=unc, n=n)
    for k in range(5):
        p, a, b = pts[k]; inp["p%d" % (k + 1)] = p; inp["a%d" % (k + 1)] = a; inp["b%d" % (k + 1)] = b
    add("calibration-error", inp, _ce_calc(lo, hi, tol, unc, n, pts), 1e-8)
def _ce_rand():
    lo = _cer.choice([0, 0, -50, -1, 4, 100, 0.5]); span = _cer.choice([1, 2.5, 10, 16, 100, 150, 400, 1000]); hi = round(lo + span, 4)
    tol = _cer.choice([0.1, 0.25, 0.5, 1, 2]); unc = _cer.choice([0, 0.01, 0.025, 0.05, 0.1, 0.25])
    n = _cer.choice([3, 4, 5]); ps = sorted(_cer.sample([0, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100], 5))
    # as-found noise up to 2 x tolerance and as-left noise up to 1.2 x tolerance, in % of span, rounded to four decimals of the range unit
    pts = [(p, round(lo + p / 100 * span + span * _cer.uniform(-2, 2) * tol / 100, 4), round(lo + p / 100 * span + span * _cer.uniform(-1.2, 1.2) * tol / 100, 4)) for p in ps]
    _ce_vec(lo, hi, tol, unc, n, pts)
for _ in range(34): _ce_rand()
_ce_vec(0, 10, 0.5, 0.05, 5, [(0, 0.02, 0), (25, 2.54, 2.51), (50, 5.08, 5.01), (75, 7.62, 7.5), (100, 10.14, 10.01)])       # the default
_ce_vec(-50, 150, 0.25, 0.02, 5, [(0, -49.8, -50.1), (25, 0.3, -0.2), (50, 50.3, 50.1), (75, 99.9, 100.2), (100, 150.6, 150.2)])   # a temperature range
_ce_vec(0, 10, 0.5, 0.2, 5, [(0, 0.02, 0), (25, 2.54, 2.51), (50, 5.08, 5.01), (75, 7.62, 7.5), (100, 10.14, 10.01)])       # a weak reference: ratio 2.5
_ce_vec(0, 10, 0.5, 0.05, 5, [(0, 0, 0), (25, 2.84, 2.51), (50, 5.0, 5.01), (75, 7.5, 7.5), (100, 10.0, 10.01)])             # a bowed curve
_ce_vec(0, 16, 6.25, 0, 3, [(0, 0, 0), (50, 9, 8), (100, 16, 16), (75, 0, 0), (100, 0, 0)])                                   # an error exactly at the tolerance

# --- v1.97.30 work: electric-potential (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's formulas, with 30-digit mpmath. Each position is a complex number and a distance is the modulus of a difference, so there is no
# square root of a sum of squares. The Coulomb constant comes from the vacuum permeability and the speed of light, k = mu0 c^2 / (4 pi) with mu0 = 1.25663706212e-6, not from the
# engine's epsilon0. The energy of the group is found as one half of the sum of each charge times the potential at that charge due to all the others, not as a sum over pairs.
_epr = random.Random(20261215)
def _ep_calc(er, n, ch, pt, q0):
    mp.mp.dps = 30
    mu0 = mp.mpf("1.25663706212e-6"); c = mp.mpf(299792458)
    k = mu0 * c * c / (4 * mp.pi) / mp.mpf(str(er))
    z = [mp.mpc(mp.mpf(str(x)), mp.mpf(str(y))) for (_q, x, y) in ch[:n]]
    q = [mp.mpf(str(c_[0])) * mp.mpf("1e-6") for c_ in ch[:n]]
    zp = mp.mpc(mp.mpf(str(pt[0])), mp.mpf(str(pt[1])))
    out = {}
    V = mp.mpf(0)
    for j in range(n):
        r = abs(zp - z[j]); v = k * q[j] / r
        out["r%d" % (j + 1)] = float(r); out["v%d" % (j + 1)] = float(v); V += v
    out["V"] = float(V); out["W"] = float(mp.mpf(str(q0)) * mp.mpf("1e-6") * V); out["Qn"] = float(sum(q) * mp.mpf("1e6"))
    if n >= 2:
        U = mp.mpf(0)
        for i in range(n):
            phi = sum(k * q[j] / abs(z[i] - z[j]) for j in range(n) if j != i)
            U += q[i] * phi
        out["U"] = float(U / 2)
    for key in ("V", "W", "U", "Qn"):
        if key in out and abs(out[key]) < 1e-20: out[key] = 0.0
    return out
def _ep_vec(er, n, ch, pt, q0):
    inp = dict(n=n, er=er, px=pt[0], py=pt[1], q0=q0)
    for j in range(3):
        inp["q%d" % (j + 1)], inp["x%d" % (j + 1)], inp["y%d" % (j + 1)] = ch[j]
    add("electric-potential", inp, _ep_calc(er, n, ch, pt, q0), 1e-8)
def _ep_rand():
    n = _epr.choice([1, 2, 3, 3]); er = _epr.choice([1, 1, 2.1, 4, 80, 2.5, 1.0006])
    while True:
        pts = [(round(_epr.uniform(-2, 2), 3), round(_epr.uniform(-2, 2), 3)) for _ in range(4)]
        if len(set(pts)) == 4: break
    ch = [(round(_epr.choice([-1, 1]) * _epr.uniform(0.1, 50), 3),) + pts[j] for j in range(3)]
    q0 = _epr.choice([0, 1, -1, 2.5, 0.01])
    _ep_vec(er, n, ch, pts[3], q0)
for _ in range(30): _ep_rand()
_ep_vec(1, 3, [(4, 0, 0), (-2, 0.4, 0), (3, 0, 0.3)], (0.2, 0.15), 1)                       # the default: all three charges 0.25 m from the point
_ep_vec(1, 2, [(1, -1, 0), (-1, 1, 0), (0, 0, 0)], (0, 5), 1)                              # an equal and opposite pair: zero potential on the midline
_ep_vec(80, 1, [(1, 0, 0), (0, 1, 0), (0, 2, 0)], (1, 0), 3)                                # one charge in water
_ep_vec(1, 2, [(3, 0, 0), (-3, 0.1, 0), (0, 5, 5)], (0.05, 0.2), 1)                        # an opposite pair 0.1 m apart: negative group energy

# --- v1.97.30 work: thermal-rise (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed forms, with 20-digit mpmath. The exposed area is the sum of a list of the faces that lose heat (front, back, two sides, top), not
# a collapsed formula. The steady rise is the heat times a thermal resistance, R = 1 / (h A). The airflow goes through a mass flow, m_dot = P_excess / (cp dT), then V = m_dot / rho. The
# warm-up is not taken from the exponential: the lumped energy balance C dT/dt = P - G T is separated, so the time to reach a rise T is t = C * integral of dT' / (P - G T') from 0 to T,
# evaluated by numerical quadrature (mpmath quad). The time to the limit is that integral up to the allowed rise; the temperature after a given time is found by root-finding on T until
# the integral equals that time (Illinois method). The engine's exponential and its logarithm are never used. Cases with more than ten time constants elapsed are redrawn (the
# integrand is then too close to its pole for the quadrature to be a fair check).
_thr = random.Random(20261216)
def _th_calc(P, mt, W, H, D, Ac, sf, hc, Ta, Tmax, m, cp, t_h, rho):
    mp.mp.dps = 20
    f = lambda x: mp.mpf(str(x))
    W_, H_, D_ = f(W), f(H), f(D)
    faces = {"front": W_ * H_, "back": W_ * H_, "left": D_ * H_, "right": D_ * H_, "top": W_ * D_}
    if mt == 2: faces.pop("back")
    A = f(Ac) if mt == 0 else sum(faces.values())
    h = f(hc) if sf == 0 else f({1: 5.5, 2: 4.5, 3: 12, 4: 3.5}[sf])
    Rth = 1 / (h * A); G = 1 / Rth
    dT = f(P) * Rth; allow = f(Tmax) - f(Ta)
    Pmax = allow / Rth; Pex = f(P) - Pmax
    out = {"A": float(A), "h": float(h), "G": float(G), "dT": float(dT), "Ti": float(f(Ta) + dT), "Pmax": float(Pmax)}
    if Pex > 0:
        mdot = Pex / (mp.mpf(1005) * allow)
        out["Pex"] = float(Pex); out["Q"] = float(mdot / f(rho) * 3600)
    if m > 0:
        C = f(m) * f(cp); tau = C / G
        if f(t_h) * 3600 > 10 * tau: return None
        t_of = lambda T: C * mp.quad(lambda x: 1 / (f(P) - G * x), [0, T])
        out["tau"] = float(tau / 60)
        T_t = mp.findroot(lambda T: t_of(T) - f(t_h) * 3600, (mp.mpf(0), dT * (1 - mp.mpf("1e-9"))), solver="illinois", tol=1e-15, maxsteps=100)
        out["Tt"] = float(f(Ta) + T_t)
        if dT > allow: out["tl"] = float(t_of(allow) / 60)
    return out
def _th_vec(P, mt, W, H, D, Ac, sf, hc, Ta, Tmax, m, cp, t_h, rho):
    o = _th_calc(P, mt, W, H, D, Ac, sf, hc, Ta, Tmax, m, cp, t_h, rho)
    if o is None: return False
    add("thermal-rise", dict(P=P, mt=mt, W=W, H=H, D=D, Ac=Ac, sf=sf, hc=hc, Ta=Ta, Tmax=Tmax, m=m, cp=cp, t=t_h, rho=rho), o, 1e-8)
    return True
def _th_rand():
    while True:
        Ta = _thr.choice([20, 25, 30, 35, 40, 45]); Tmax = Ta + _thr.choice([5, 10, 15, 20, 30, 40])
        if _th_vec(round(_thr.uniform(10, 2000), 1), _thr.choice([0, 1, 1, 2, 2]), round(_thr.uniform(0.3, 2.2), 2), round(_thr.uniform(0.4, 2.4), 2), round(_thr.uniform(0.2, 0.8), 2),
                   round(_thr.uniform(0.5, 8), 2), _thr.choice([0, 1, 2, 3, 4]), round(_thr.uniform(2, 15), 1), Ta, Tmax, _thr.choice([0, 25, 80, 150, 400, 800]), _thr.choice([450, 500, 900]), round(_thr.uniform(0.1, 6), 2), _thr.choice([0.9, 1.0, 1.2])): return
for _ in range(30): _th_rand()
_th_vec(300, 1, 0.8, 1.8, 0.4, 2, 1, 5.5, 35, 45, 150, 500, 2, 1.2)                         # the default
_th_vec(100, 2, 0.8, 1.8, 0.4, 2, 3, 5.5, 35, 45, 150, 500, 2, 1.2)                         # wall-mounted aluminium, inside the limit
_th_vec(300, 1, 0.8, 1.8, 0.4, 2, 1, 5.5, 35, 45, 0, 500, 2, 1.2)                           # no thermal mass
_th_vec(240, 0, 0.8, 1.8, 0.4, 3, 0, 8, 35, 45, 150, 500, 2, 1.2)                           # an area and a coefficient by hand, rise exactly at the limit

# --- v1.97.31 work: energy-savings (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's formulas, in exact rational arithmetic (Fraction built from the decimal text of each input), so there is no floating-point rounding in the
# reference. The energy is found as a before total less an after total (motor input power at each efficiency, lamp energy at each power with the controls cut applied to the new
# fittings, loss energy at each loss power), not as one saving expression, and the share saved is 1 - after/before. The present value is not the closed-form annuity: it is the explicit sum,
# year by year, of the first-year saving raised by the tariff rise for t - 1 years and discounted for t years (and the maintenance saving, flat, discounted), so the equal-rate case (a
# ratio of exactly one, where the closed form needs a separate branch) is only a sum of equal terms here.
_esr = random.Random(20261217)
def _es_calc(tar, esc, dr, life, ef, maint, nm, Pm, eo, en, hm, cm, nl, Wo, Wn, hl, ct, cl, dist, Lb, La, hd, cd):
    F = lambda x: Fraction(str(x))
    tar, esc, dr, ef, maint = F(tar), F(esc) / 100, F(dr) / 100, F(ef), F(maint)
    bef = {}; aft = {}; inv = Fraction(0); out = {}
    if nm > 0:
        bef["m"] = F(nm) * F(Pm) * 1000 / (F(eo) / 100) * F(hm); aft["m"] = F(nm) * F(Pm) * 1000 / (F(en) / 100) * F(hm); inv += F(nm) * F(cm)
    if nl > 0:
        bef["l"] = F(nl) * F(Wo) * F(hl); aft["l"] = F(nl) * F(Wn) * F(hl) * (1 - F(ct) / 100); inv += F(nl) * F(cl)
    if dist == 1:
        bef["d"] = F(Lb) * 1000 * F(hd); aft["d"] = F(La) * 1000 * F(hd); inv += F(cd)
    for k, key in (("m", "Em"), ("l", "El"), ("d", "Ed")):
        if k in bef: out[key] = float((bef[k] - aft[k]) / 1000)
    Eb, Ea = sum(bef.values()), sum(aft.values())
    Et = Eb - Ea
    Se = Et / 1000 * tar; S = Se + maint
    pv = Fraction(0)
    for t in range(1, life + 1):
        pv += Se * (1 + esc) ** (t - 1) / (1 + dr) ** t + maint / (1 + dr) ** t
    out.update({"Et": float(Et / 1000), "pct": float(100 * (1 - Ea / Eb)), "S": float(S), "Inv": float(inv), "PV": float(pv), "NPV": float(pv - inv), "co2": float(Et / 1000 * ef / 1000)})
    if inv > 0 and S > 0: out["pb"] = float(inv / S)
    if inv > 0: out["sir"] = float(pv / inv)
    return out
def _es_vec(*a):
    keys = ("tar", "esc", "dr", "life", "ef", "maint", "nm", "Pm", "eo", "en", "hm", "cm", "nl", "Wo", "Wn", "hl", "ct", "cl", "dist", "Lb", "La", "hd", "cd")
    add("energy-savings", dict(zip(keys, a)), _es_calc(*a), 1e-9)
def _es_rand():
    while True:
        nm = _esr.choice([0, 1, 2, 4, 8, 20]); nl = _esr.choice([0, 20, 100, 200, 500]); dist = _esr.choice([0, 1, 1])
        if nm + nl + dist == 0: continue
        eo = round(_esr.uniform(70, 95), 1); en = round(min(99.5, eo + _esr.uniform(0.5, 8)), 1)
        Wo = round(_esr.uniform(30, 400), 0); Wn = round(Wo * _esr.uniform(0.2, 0.8), 0); Lb = round(_esr.uniform(2, 50), 1); La = round(Lb * _esr.uniform(0.3, 0.9), 1)
        e1 = _esr.choice([0, 2, 3, 5, 10, -3, 8]); d1 = _esr.choice([0, 5, 8, 10, 12, 15, 20, 10])
        zero = _esr.random() < 0.08
        _es_vec(round(_esr.uniform(2, 15), 2), e1, d1, _esr.randint(1, 30), round(_esr.uniform(0.2, 1.1), 2), _esr.choice([0, 0, 5000, 40000]),
                nm, round(_esr.uniform(1, 200), 1), eo, en, _esr.choice([500, 2000, 4000, 6000, 8000, 8760]), 0 if zero else _esr.choice([20000, 60000, 150000]),
                nl, Wo, Wn, _esr.choice([1000, 3000, 4000, 8760]), _esr.choice([0, 10, 25, 40]), 0 if zero else _esr.choice([500, 1500, 3000]),
                dist, Lb, La, _esr.choice([2000, 5000, 8000]), 0 if zero else _esr.choice([30000, 100000, 400000]))
        return
for _ in range(30): _es_rand()
_es_vec(8, 3, 10, 10, 0.7, 0, 4, 15, 90, 94, 6000, 90000, 200, 120, 50, 4000, 10, 2200, 1, 18, 11, 8000, 150000)      # the default
_es_vec(8, 0, 0, 10, 0.7, 0, 4, 15, 90, 94, 6000, 90000, 0, 120, 50, 4000, 10, 2200, 0, 18, 11, 8000, 150000)          # motors only, flat tariff, zero discount
_es_vec(8, 10, 10, 10, 0.7, 20000, 4, 15, 90, 94, 6000, 90000, 200, 120, 50, 4000, 10, 2200, 1, 18, 11, 8000, 150000)  # the tariff rise equals the discount rate
_es_vec(8, 0, 30, 5, 0.7, 0, 0, 15, 90, 94, 6000, 90000, 100, 100, 50, 4000, 0, 6400, 0, 18, 11, 8000, 150000)         # a negative net present value with a payback of four years

# --- v1.97.33 work: point-by-point-lighting (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed form (h^(m+1) / d^(m+3)), with 30-digit mpmath: each luminaire is placed at the centre of its own rectangle, the angle from the
# downward vertical is found with atan2, the intensity at that angle is I0 cos(g)^m, and the illuminance is I(g) cos(g) / d^2 summed over the luminaires, times the maintenance factor.
# The flux of one luminaire is a numerical quadrature of 2 pi I(g) sin(g) over the lower hemisphere (not 2 pi I0 / (m + 1)), and the half-intensity angle is found by bisection on
# cos(g)^m = 1/2. Calculation points are the centres of equal rectangles; the darkest point is the first, scanning rows then columns, within 1e-9 of the minimum.
_pbr = random.Random(20261218)
def _pb_calc(nx, ny, Sx, Sy, h, I0, m, MF, px, py, Er, Ur, xp, yp):
    mp.mp.dps = 30
    M = lambda v: mp.mpf(str(v))
    Sx, Sy, h, I0, m, MF, Er, Ur, xp, yp = [M(v) for v in (Sx, Sy, h, I0, m, MF, Er, Ur, xp, yp)]
    W, L = nx * Sx, ny * Sy
    lums = [((i + mp.mpf(1) / 2) * Sx, (j + mp.mpf(1) / 2) * Sy) for j in range(ny) for i in range(nx)]
    def E(x, y):
        t = mp.mpf(0)
        for (lx, ly) in lums:
            r = mp.sqrt((x - lx) ** 2 + (y - ly) ** 2); g = mp.atan2(r, h)
            t += I0 * mp.cos(g) ** m * mp.cos(g) / (r * r + h * h)
        return MF * t
    pts = []
    for j in range(py):
        for i in range(px):
            x = (i + mp.mpf(1) / 2) * W / px; y = (j + mp.mpf(1) / 2) * L / py
            pts.append((E(x, y), x, y))
    Es = [q[0] for q in pts]; n = len(Es); avg = sum(Es) / n; mn = min(Es); mx = max(Es)
    first = [q for q in pts if q[0] <= mn * (1 + mp.mpf("1e-9"))][0]
    out = dict(A=W * L, nl=nx * ny, avg=avg, mn=mn, mx=mx, uo=mn / avg, u1=mn / mx, xmn=first[1], ymn=first[2], Ep=E(xp, yp), Ea0=MF * I0 / h ** 2)
    phi1 = I0 * 2 * mp.pi * mp.quad(lambda g: mp.cos(g) ** m * mp.sin(g), [0, mp.pi / 2])
    out["phi"] = nx * ny * phi1; out["share"] = (avg / MF) * W * L / out["phi"]
    if m > 0:
        lo, hi = mp.mpf(0), mp.pi / 2          # bisection on cos(g)^m = 1/2 (cos(g)^m falls from 1 to 0 over the interval)
        for _ in range(140):
            mid = (lo + hi) / 2
            if mp.cos(mid) ** m > mp.mpf(1) / 2: lo = mid
            else: hi = mid
        out["g50"] = mp.degrees((lo + hi) / 2)
    out["minreq"] = Ur * avg; out["short"] = max(mp.mpf(0), Ur * avg - mn)
    out["okem"] = 1 if avg >= Er else 0; out["okuo"] = 1 if mn / avg >= Ur else 0
    return {k: float(v) for k, v in out.items()}
def _pb_vec(*a):
    keys = ("nx", "ny", "Sx", "Sy", "h", "I0", "m", "MF", "px", "py", "Er", "Ur", "xp", "yp")
    add("point-by-point-lighting", dict(zip(keys, a)), _pb_calc(*a), 1e-9)
def _pb_rand():
    nx = _pbr.randint(1, 10); ny = _pbr.randint(1, 10); Sx = round(_pbr.uniform(1, 12), 2); Sy = round(_pbr.uniform(1, 12), 2)
    h = round(_pbr.uniform(1.5, 14), 2); m = _pbr.choice([0, 0.5, 1, 1.5, 2, 3, 5, 8, 12, 20, round(_pbr.uniform(0.1, 15), 2)])
    px = _pbr.randint(1, 20); py = _pbr.randint(1, 20)
    # keep the darkest point and the average away from the requirement lines so no vector sits on a pass/fail edge
    W, L = nx * Sx, ny * Sy
    a = (nx, ny, Sx, Sy, h, round(_pbr.uniform(200, 90000), 0), m, round(_pbr.uniform(0.4, 1), 2), px, py, 100, 0.5, round(W * _pbr.random(), 3), round(L * _pbr.random(), 3))
    r = _pb_calc(*a)
    Er = round(r["avg"] * _pbr.choice([0.6, 0.8, 1.3, 1.7]), 1); Ur = round(min(1.0, max(0.05, r["uo"] * _pbr.choice([0.6, 0.8, 1.2, 1.6]))), 3)
    _pb_vec(*(a[:10] + (Er, Ur) + a[12:]))
for _ in range(32): _pb_rand()
_pb_vec(4, 3, 3, 3, 3.5, 3000, 1.5, 0.8, 12, 9, 300, 0.5, 6, 4.5)        # the default
_pb_vec(1, 1, 4, 4, 3, 2000, 2, 0.9, 5, 5, 100, 0.2, 2, 2)                # one luminaire, point under it
_pb_vec(3, 3, 3, 3, 3, 1000, 0, 0.8, 6, 6, 100, 0.5, 4.5, 4.5)            # exponent 0
_pb_vec(4, 3, 4, 4, 3, 5000, 8, 0.8, 12, 9, 150, 0.6, 8, 6)               # a narrow beam at wide spacing
_pb_vec(10, 10, 2, 2, 4, 2500, 1, 1, 20, 20, 200, 0.5, 10, 10)            # the largest array on the largest grid
_pb_vec(1, 1, 6, 6, 8, 20000, 12, 0.75, 1, 1, 100, 0.5, 3, 3)             # one luminaire, one point, a narrow beam

# --- v1.97.34 work: agl-photometry-data (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's loops, in 30-digit mpmath: lux readings become candela by E * d^2 first, the lowest and highest points come from a sorted copy
# (first index on a tie), the spread from the identity var = mean(I^2) - mean(I)^2 (the engine takes the two-pass sum of squared deviations), the points below the limit are counted by
# comparing 100 * I with Fp * Iavg (no division), and the light output from Iavg * 100 / Inew. Random cases keep every point, the average and the light output away from a pass or fail edge.
_agr = random.Random(20261220)
def _ag_calc(mode, d, R, Ireq, Fp, Inew, Pn, u):
    mp.mp.dps = 30
    M = lambda v: mp.mpf(str(v))
    k2 = M(d) ** 2 if mode == 1 else mp.mpf(1)
    I = [M(r) * k2 for r in R]; n = len(I); avg = sum(I) / n
    order = sorted(range(n), key=lambda k: (I[k], k)); mn = I[order[0]]; imin = order[0] + 1
    mx = max(I); imax = min(k for k in range(n) if I[k] == mx) + 1
    var = sum(x * x for x in I) / n - avg * avg; sd = mp.sqrt(var) if var > 0 else mp.mpf(0)
    nfail = sum(1 for x in I if 100 * x < M(Fp) * avg)
    avgU = avg * (1 - M(u) / 100); pct = avg * 100 / M(Inew)
    out = dict(avg=avg, mn=mn, mx=mx, imin=imin, imax=imax, mnavg=mn / avg, mxavg=mx / avg, sd=sd, cv=sd / avg * 100, lim=M(Fp) * avg / 100, nfail=nfail,
               okavg=1 if avg >= M(Ireq) else 0, okpt=1 if nfail == 0 else 0, short=max(mp.mpf(0), M(Ireq) - avg), avgU=avgU, okU=1 if avgU >= M(Ireq) else 0,
               pctnew=pct, oknew=1 if pct >= M(Pn) else 0)
    return {k: float(v) for k, v in out.items()}
def _ag_vec(mode, d, R, Ireq, Fp, Inew, Pn, u):
    n = len(R); full = list(R) + [0] * (12 - n)
    inp = {"mode": mode, "d": d, "n": n}
    for k in range(12): inp["I%d" % (k + 1)] = full[k]
    inp.update({"Ireq": Ireq, "Fp": Fp, "Inew": Inew, "Pn": Pn, "u": u})
    add("agl-photometry-data", inp, _ag_calc(mode, d, R, Ireq, Fp, Inew, Pn, u), 1e-9)
def _ag_rand():
    while True:
        n = _agr.randint(2, 12); mode = _agr.choice([0, 0, 1]); d = round(_agr.uniform(3, 40), 2) if mode == 1 else 10
        base = _agr.uniform(800, 60000) / (d * d if mode == 1 else 1); spread = _agr.choice([0.05, 0.15, 0.4, 0.7])
        R = [round(base * (1 + _agr.uniform(-spread, spread)), 2) for _ in range(n)]
        if min(R) <= 0: continue
        r = _ag_calc(mode, d, R, 1, 50, 1, 50, 0); avg = r["avg"]
        Fp = _agr.choice([20, 40, 60, 75, 90])
        if any(abs(x * (d * d if mode == 1 else 1) / avg * 100 - Fp) < 0.5 for x in R): continue
        u = _agr.choice([0, 2, 5, 10]); Ireq = round(avg * _agr.choice([0.7, 0.9, 1.1, 1.3]), 1)
        if abs(avg * (1 - u / 100) - Ireq) < 0.5 or abs(avg - Ireq) < 0.5: continue
        Inew = round(avg / _agr.choice([0.45, 0.6, 0.85, 1.0, 1.25]), 1); Pn = _agr.choice([40, 50, 65, 80])
        if abs(avg / Inew * 100 - Pn) < 0.5: continue
        _ag_vec(mode, d, R, Ireq, Fp, Inew, Pn, u); return
for _ in range(32): _ag_rand()
_ag_vec(0, 10, [14200, 15800, 14900, 16100, 18200, 16400, 14500, 15700, 13800], 15000, 50, 17000, 50, 5)                  # the default
_ag_vec(1, 10, [142, 158, 149, 161, 182, 164, 145, 157, 138], 15000, 50, 17000, 50, 5)                                    # the same readings as lux at 10 m
_ag_vec(0, 10, [8000, 8000, 8000, 8000, 8000], 8000, 100, 8000, 100, 0)                                                   # equal readings, spread 0, on every limit
_ag_vec(0, 10, [200, 100, 100, 200], 100, 50, 200, 50, 0)                                                                 # ties: the first lowest and first highest are reported
_ag_vec(0, 10, [0, 10000, 12000, 11000], 8000, 50, 12000, 50, 0)                                                          # a zero reading
_ag_vec(1, 6, [420, 450, 400, 480], 15000, 50, 15000, 50, 2)                                                              # lux at 6 m, above the new value
_ag_vec(0, 10, [10500, 11200, 9800, 10100, 10900, 11500, 9600, 10300, 10700, 11000, 9900, 10400], 10000, 50, 12000, 50, 3)  # the largest set, twelve points

# --- v1.97.35 work: first-order-ode (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed forms, in 30-digit mpmath: the equation is put in the form y' + y / tau = g(t) / a and solved by the integrating factor,
# y(t) = e^(-t/tau) [ y0 + (1/a) * integral from 0 to t of e^(s/tau) g(s) ds ], with the integral taken by numerical quadrature (mp.quad) instead of the particular solution; the
# transient part is e^(-t/tau) times (y0 minus the forced part at 0), and the forced part is what is left of y(t). The sine amplitude comes from the peak of the long-time
# solution found by root-finding on its derivative, and the lag from the time shift of that peak against the peak of the sine, not from arctan(w tau).
_fo = random.Random(20261221)
def _fo_calc(ft, a, b, F, w, y0, t, band):
    mp.mp.dps = 30
    M = lambda v: mp.mpf(str(v))
    a, b, F, w, y0, t, band = M(a), M(b), M(F), M(w), M(y0), M(t), M(band)
    tau = a / b
    g = (lambda s: F) if ft == 1 else (lambda s: F * s) if ft == 2 else (lambda s: F * mp.sin(w * s))
    def y_at(x):
        if x == 0: return y0
        pts = [x * k / 48 for k in range(0, 49)]
        I = mp.quad(lambda s: mp.e ** (s / tau) * g(s), pts)
        return mp.e ** (-x / tau) * (y0 + I / a)
    yt = y_at(t)
    # forced part at 0 from the long-time form: y_p(0) = y(0) - (the transient coefficient), found from the solution after many time constants
    if ft == 1: yp0 = F / b
    elif ft == 2: yp0 = -F * tau / b
    else:
        # forced sine part: y_p(x) = y(x) after 60 tau minus nothing; its value at 0 follows from the periodicity of the steady state, y_p(0) = y_p(2 pi k / w) for any k
        k = mp.ceil(w * 60 * tau / (2 * mp.pi)) + 1; x = 2 * mp.pi * k / w if w > 0 else mp.mpf(0)
        yp0 = y_at(x) if w > 0 else mp.mpf(0)
    C = y0 - yp0; ytr = C * mp.e ** (-t / tau); yp = yt - ytr
    dydt = (g(t) - b * yt) / a
    out = dict(tau=tau, yp=yp, ytr=ytr, yt=yt, dydt=dydt, gt=g(t), C=C, tset=tau * mp.log(100 / band))
    if ft == 1: out["yinf"] = F / b
    if ft == 3:
        D = 1 + (w * tau) ** 2
        out["amp"] = abs(F / b) / mp.sqrt(D); out["lag"] = mp.atan(w * tau) * 180 / mp.pi
    return {k: (0.0 if abs(v) < mp.mpf('1e-20') else float(v)) for k, v in out.items()}
def _fo_vec(ft, a, b, F, w, y0, t, band):
    add("first-order-ode", {"ft": ft, "a": a, "b": b, "F": F, "w": w, "y0": y0, "t": t, "band": band}, _fo_calc(ft, a, b, F, w, y0, t, band), 1e-8)
def _fo_rand():
    ft = _fo.choice([1, 1, 2, 3, 3]); a = round(_fo.uniform(0.05, 20), 3); b = round(_fo.uniform(0.2, 15), 3); F = round(_fo.uniform(-30, 30), 2)
    tau = a / b; w = round(_fo.uniform(0.05, 8) / tau, 3); y0 = round(_fo.uniform(-20, 20), 2); t = round(tau * _fo.uniform(0, 7), 4); band = _fo.choice([1, 2, 5, 10])
    if abs(F) < 0.5 or t <= 0: return
    _fo_vec(ft, a, b, F, w, y0, t, band)
for _ in range(60): _fo_rand()
_fo_vec(1, 2, 4, 12, 2, 0, 1, 2)         # the default
_fo_vec(2, 1, 1, 1, 2, 0, 2, 2)          # a ramp from rest
_fo_vec(3, 1, 1, 1, 1, 0, 2.5, 2)        # a sine with w tau = 1
_fo_vec(3, 1, 2, -4, 2, 0, 1, 2)          # a sine with a negative amplitude F
_fo_vec(1, 3, 1, 0, 2, 10, 3, 5)         # free decay
_fo_vec(1, 1, 2, 8, 2, 4, 5, 2)          # start at the final value
_fo_vec(3, 0.5, 2, 5, 40, -3, 0.2, 2)    # a fast sine, w tau = 10
_fo_vec(2, 4, 2, -6, 2, 7, 6, 10)        # a falling ramp from a positive start

# --- v1.97.36 work: laplace-transform (own stream, earlier vectors unchanged) ---
# Written as a different route from the table pairs: the transform is the defining integral, F(s) = integral from 0 to infinity of f(t) e^(-st) dt, taken by numerical
# quadrature in 30-digit mpmath (mp.quad over one-period sub-intervals) from the delay T, with the delayed function K f(t - T) written out directly, so neither the table
# entries nor the shifting theorem are used. The initial value is f read a tiny time after the switching instant, and the final value is read from the behaviour of f at
# a very large time (a limit exists only if f is constant over a window of times there); the abscissa of convergence is left to the built-in cases.
_lp = random.Random(20261222)
def _lp_calc(ft, K, a, w, n, T0, sig, om, t):
    mp.mp.dps = 30
    M = lambda v: mp.mpf(str(v))
    K, a, w, T0, sig, om, t = M(K), M(a), M(w), M(T0), M(sig), M(om), M(t)
    useA = ft in (4, 5, 8, 9, 10)
    def g(x):
        e = mp.e ** (-a * x) if useA else mp.mpf(1)
        if ft == 1: return mp.mpf(1)
        if ft == 2: return x
        if ft == 3: return x ** n
        if ft == 4: return e
        if ft == 5: return x * e
        if ft == 6: return mp.sin(w * x)
        if ft == 7: return mp.cos(w * x)
        if ft == 8: return e * mp.sin(w * x)
        if ft == 9: return e * mp.cos(w * x)
        return x ** n * e
    f = lambda x: K * g(x - T0) if x >= T0 else mp.mpf(0)
    dec = sig + (a if useA else 0)
    L = 90 / dec
    fmax = max(w if ft in (6, 7, 8, 9) else mp.mpf(0), abs(om))
    per = (2 * mp.pi / fmax) if fmax > 0 else L
    nseg = max(int(mp.ceil(L / per)), 1)
    pts = [T0 + L * k / nseg for k in range(nseg + 1)]
    Fre = mp.quad(lambda x: f(x) * mp.e ** (-sig * x) * mp.cos(om * x), pts)
    Fim = mp.quad(lambda x: -f(x) * mp.e ** (-sig * x) * mp.sin(om * x), pts)
    Fmag = mp.sqrt(Fre ** 2 + Fim ** 2); Fph = mp.atan2(Fim, Fre) * 180 / mp.pi
    mp.mp.dps = 60
    f0 = f(mp.mpf('1e-40'))   # f just after t = 0, so a delayed function is still zero there
    samp = [f(T0 + mp.mpf(4000) + mp.mpf(k) * mp.mpf('0.731')) for k in range(40)]
    spread = max(samp) - min(samp)
    out = dict(Fre=Fre, Fim=Fim, Fmag=Fmag, Fph=Fph, fval=f(t), f0=f0)
    if spread < mp.mpf('1e-20'): out["fv"] = sum(samp) / len(samp)
    return {k: (0.0 if abs(v) < mp.mpf('1e-18') else float(v)) for k, v in out.items()}
def _lp_vec(ft, K, a, w, n, T0, sig, om, t):
    add("laplace-transform", {"ft": ft, "K": K, "a": a, "w": w, "n": n, "T0": T0, "sig": sig, "om": om, "t": t}, _lp_calc(ft, K, a, w, n, T0, sig, om, t), 1e-8)
def _lp_rand():
    ft = _lp.randint(1, 10); K = round(_lp.choice([-1, 1]) * _lp.uniform(0.2, 12), 2); a = round(_lp.uniform(0.1, 6), 3); w = round(_lp.uniform(0.3, 5), 3)
    n = _lp.randint(1, 6); T0 = _lp.choice([0, 0, 0, round(_lp.uniform(0.1, 3), 2)]); useA = ft in (4, 5, 8, 9, 10)
    sig = round(_lp.uniform(0.5, 5) + (-a if useA and _lp.random() < 0.5 else 0), 3)
    if sig + (a if useA else 0) < 0.5: sig = round(0.5 - (a if useA else 0) + _lp.uniform(0, 1), 3)
    om = round(_lp.choice([0, _lp.uniform(-5, 5)]), 3); t = round(T0 + _lp.uniform(0, 4) if _lp.random() < 0.85 else _lp.uniform(0, max(T0, 0.1)) * 0.9, 3)
    c = _lp_calc(ft, K, a, w, n, T0, sig, om, t)
    sc = max(abs(c["Fre"]), abs(c["Fim"]), 1e-300)
    if (om != 0 and (abs(c["Fre"]) < 1e-3 * math.hypot(c["Fre"], c["Fim"]) or abs(c["Fim"]) < 1e-3 * math.hypot(c["Fre"], c["Fim"]))) or abs(c["Fmag"]) < 1e-9: return
    if c["fval"] != 0 and abs(c["fval"]) < 1e-3 * abs(K): return
    _lp_vec(ft, K, a, w, n, T0, sig, om, t)
for _ in range(70): _lp_rand()
_lp_vec(8, 1, 2, 3, 2, 0, 3, 2, 0.5)       # the default
_lp_vec(1, 1, 2, 3, 2, 0, 4, 0, 1)         # unit step on the real axis
_lp_vec(2, 1, 2, 3, 2, 0, 2, 2, 3)         # ramp at a complex s
_lp_vec(3, 1, 2, 3, 3, 0, 2, 0, 2)         # t cubed
_lp_vec(7, 1, 2, 2, 2, 0, 1, 1, 0)         # cosine, read at t = 0
_lp_vec(5, -3, 1, 3, 2, 0, 1, 0, 1)        # t e^(-t) with a negative amplitude
_lp_vec(1, 1, 2, 3, 2, 2, 1, 0, 1)         # a delayed step, read before the delay
_lp_vec(10, 1, 1, 3, 2, 0, 2, 0, 1)        # t^2 e^(-t)
_lp_vec(9, 2.5, 0.4, 6, 2, 0, -0.1, 1.5, 3)  # a damped cosine with sigma below zero but above -a
_lp_vec(6, 1, 2, 4.5, 2, 1.5, 0.8, -3, 4)  # a delayed sine at a negative imaginary part

# --- v1.97.36 work: electric-field (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's vector sum: the field is minus the gradient of the potential, E = -grad V, with V(x, y) = sum of k q / r written as a function and
# differentiated numerically by mpmath (mp.diff, 30 digits) in x and in y, so no unit vector, no 1/r^2 and no r^3 appear. Each charge's own field strength is the length of the
# gradient of its own potential. The Coulomb constant comes from the vacuum permeability and the speed of light, k = mu0 c^2 / (4 pi), as for the potential calculator. The force
# direction is the angle of the vector q0 E, taken from the signs of q0 Ex and q0 Ey, and the direction of the field is atan2 of the gradient.
_efr = random.Random(20261223)
def _ef_calc(er, n, ch, pt, q0):
    mp.mp.dps = 30
    mu0 = mp.mpf("1.25663706212e-6"); c = mp.mpf(299792458)
    k = mu0 * c * c / (4 * mp.pi) / mp.mpf(str(er))
    M = lambda v: mp.mpf(str(v))
    ch = [(M(q) * mp.mpf("1e-6"), M(x), M(y)) for (q, x, y) in ch[:n]]
    def pot(items):
        return lambda x, y: sum(k * q / mp.sqrt((x - cx) ** 2 + (y - cy) ** 2) for (q, cx, cy) in items)
    px, py = M(pt[0]), M(pt[1])
    grad = lambda V: (-mp.diff(V, (px, py), (1, 0)), -mp.diff(V, (px, py), (0, 1)))
    out = {}
    for j, item in enumerate(ch):
        gx, gy = grad(pot([item]))
        out["r%d" % (j + 1)] = float(mp.sqrt((px - item[1]) ** 2 + (py - item[2]) ** 2)); out["E%d" % (j + 1)] = float(mp.sqrt(gx ** 2 + gy ** 2))
    Ex, Ey = grad(pot(ch))
    E = mp.sqrt(Ex ** 2 + Ey ** 2)
    q0m = M(q0) * mp.mpf("1e-6")
    out.update(Ex=float(Ex), Ey=float(Ey), E=float(E), ang=float(mp.atan2(Ey, Ex) * 180 / mp.pi), F=float(abs(q0m) * E))
    if q0 != 0: out["Fang"] = float(mp.atan2(q0m * Ey, q0m * Ex) * 180 / mp.pi)
    return out
def _ef_vec(er, n, ch, pt, q0):
    inp = dict(n=n, er=er, px=pt[0], py=pt[1], q0=q0)
    for j in range(3):
        inp["q%d" % (j + 1)], inp["x%d" % (j + 1)], inp["y%d" % (j + 1)] = ch[j]
    add("electric-field", inp, _ef_calc(er, n, ch, pt, q0), 1e-8)
def _ef_rand():
    n = _efr.choice([1, 2, 3, 3]); er = _efr.choice([1, 1, 2.1, 4, 80, 2.5, 1.0006])
    while True:
        pts = [(round(_efr.uniform(-2, 2), 3), round(_efr.uniform(-2, 2), 3)) for _ in range(4)]
        if len(set(pts)) == 4: break
    ch = [(round(_efr.choice([-1, 1]) * _efr.uniform(0.1, 50), 3),) + pts[j] for j in range(3)]
    q0 = _efr.choice([0, 1, -1, 2.5, 0.01, -3])
    c = _ef_calc(er, n, ch, pts[3], q0)
    if min(abs(c["Ex"]), abs(c["Ey"])) < 1e-3 * c["E"]: return
    _ef_vec(er, n, ch, pts[3], q0)
for _ in range(34): _ef_rand()
_ef_vec(1, 3, [(4, 0, 0), (-2, 0.4, 0), (3, 0, 0.3)], (0.2, 0.15), 1)                       # the default: all three charges 0.25 m from the point
_ef_vec(1, 2, [(1, -1, 0), (-1, 1, 0), (0, 0, 0)], (0, 0.5), 1)                            # an equal and opposite pair, a point off the line joining them
_ef_vec(80, 1, [(1, 0, 0), (0, 1, 0), (0, 2, 0)], (1, 1), -3)                              # one charge in water, a negative test charge
_ef_vec(1, 2, [(3, 0, 0), (-3, 0.1, 0), (0, 5, 5)], (0.05, 0.2), 0)                        # an opposite pair 0.1 m apart, no test charge
_ef_vec(1, 3, [(-5, 1, 1), (-5, -1, 1), (5, 0, -2)], (0, 0.3), 2)                          # mixed signs, field point between them

# --- v1.98.0 work: reliability-indices (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's sums: exact fractions (no floating point), with each index built from customer FRACTIONS and hours instead of customer-seconds.
# SAIFI is the sum of the fractions of customers hit (Ci / NT); SAIDI the sum of those fractions times the event length (in minutes, from hours); CAIDI the mean event length
# weighted by the customers hit in each event (weights Ci / sum Ci); ASAI one minus the customer-hours lost over the customer-hours available; energy not supplied from
# customer-hours times kW per customer. The engine works in customer-seconds and divides at the end.
from fractions import Fraction as _Fr
_rir = random.Random(20261224)
def _ri_calc(NT, Th, ev, Lc):
    NT = _Fr(NT); Th = _Fr(str(Th)); ev = [(_Fr(c), _Fr(str(dm)) / 60) for (c, dm) in ev]   # duration in hours
    CI = sum(c for c, h in ev)
    saifi = sum(c / NT for c, h in ev)
    saidi_min = sum((c / NT) * h * 60 for c, h in ev)
    out = dict(CI=float(CI), CMI=float(sum(c * h * 60 for c, h in ev)), SAIFI=float(saifi), SAIDI=float(saidi_min))
    if CI > 0: out["CAIDI"] = float(sum((c / CI) * h * 60 for c, h in ev))
    lost_h = sum(c * h for c, h in ev); avail_h = NT * Th
    out.update(ASAI=float((avail_h - lost_h) / avail_h), ASAIp=float(100 * (avail_h - lost_h) / avail_h), ASUI=float(lost_h / avail_h))
    if Lc > 0:
        ens = lost_h * _Fr(str(Lc)); out.update(ENS=float(ens), AENS=float(ens / NT))
    tot = sum(c * h for c, h in ev)
    if tot > 0:
        top = max(range(len(ev)), key=lambda j: (ev[j][0] * ev[j][1], -j))
        out.update(top=float(100 * ev[top][0] * ev[top][1] / tot), topn=float(top + 1))
    return out
def _ri_vec(NT, Th, ev, Lc, tF=0, tD=0):
    inp = dict(NT=NT, T=Th, n=len(ev), Lc=Lc, tF=tF, tD=tD)
    pad = list(ev) + [(100, 30)] * (5 - len(ev))
    for j in range(5): inp["c%d" % (j + 1)], inp["d%d" % (j + 1)] = pad[j]
    add("reliability-indices", inp, _ri_calc(NT, Th, ev, Lc), 1e-9)
def _ri_rand():
    NT = _rir.choice([500, 1200, 5000, 20000, 85000, 250000]); n = _rir.choice([1, 2, 3, 4, 5, 5])
    Th = _rir.choice([8760, 720, 8784, 168, 4380])
    ev = [(_rir.randint(1, max(1, NT // 3)), _rir.choice([1, 5, 12, 30, 45, 90, 150, 240, 480, 1200]) + _rir.choice([0, 0.5, 0.25])) for _ in range(n)]
    Lc = _rir.choice([0, 0.4, 1.5, 3.2, 12])
    _ri_vec(NT, Th, ev, Lc, _rir.choice([0, 0.3, 1.2]), _rir.choice([0, 20, 90]))
for _ in range(30): _ri_rand()
_ri_vec(20000, 8760, [(1200, 90), (450, 240), (3000, 45), (800, 120), (150, 360)], 1.5, 0.5, 30)   # the default
_ri_vec(10000, 8760, [(1000, 120)], 2)                                                              # one event: SAIFI 0.1, SAIDI 12 min, CAIDI 120 min
_ri_vec(10000, 720, [(1000, 120)], 0)                                                               # a 720 h month, no energy not supplied
_ri_vec(5000, 8760, [(0, 3), (0, 60)], 1)                                                           # nothing interrupted
_ri_vec(2000, 8760, [(2000, 60), (2000, 60)], 0.8)                                                  # every customer off twice for 1 h: SAIFI 2, SAIDI 120, CAIDI 60

# --- v1.98.1 work: scr-triggering (own stream, earlier vectors unchanged) ---
# Different route from the engine. Mode 1 in exact fractions: the gate resistor from the voltage across it and the gate current (Ohm's law on a drop), the average gate power as
# the energy per pulse (power times pulse width) divided by the period. Mode 2 in 30-digit mpmath: the firing angle is found by ROOT-FINDING sin(a) = Vth / Vm (mp.findroot, no asin),
# and the half-wave average and RMS load voltage by numerical integration (mp.quad) of v(t) and v(t)^2 from the firing angle to pi, not by the closed forms.
from fractions import Fraction as _F2
_scr = random.Random(20261225)
def _scr_m1(VGT, IGT_mA, Vs, k, tp_us, T_ms, PGM, PGAV):
    VGT = _F2(str(VGT)); IG = _F2(str(k)) * _F2(str(IGT_mA)) / 1000; Vs = _F2(str(Vs))
    drop = Vs - VGT; R = drop / IG; pg = VGT * IG; pres = drop * IG
    if tp_us > 0: duty = (_F2(str(tp_us)) / 10**6) / (_F2(str(T_ms)) / 1000)
    else: duty = _F2(1)
    en = pg * (_F2(str(tp_us)) / 10**6) if tp_us > 0 else None
    pav = (en / (_F2(str(T_ms)) / 1000)) if tp_us > 0 else pg
    return dict(IG=float(IG * 1000), Rmax=float(R), PGpk=float(pg), Pres=float(pres), duty=float(duty * 100), PGav=float(pav))
def _scr_m2(VGT, IGT_mA, Vac, VD, Rg_k):
    mp.mp.dps = 30
    M = lambda x: mp.mpf(str(x))
    Vm = mp.sqrt(2) * M(Vac); Vth = M(VGT) + M(VD) + M(IGT_mA) / 1000 * M(Rg_k) * 1000
    out = dict(Vm=float(Vm), Vth=float(Vth), Rfire=float((Vm - M(VGT) - M(VD)) / (M(IGT_mA) / 1000)))
    if Vth < Vm:
        a = mp.findroot(lambda x: mp.sin(x) - Vth / Vm, mp.asin(Vth / Vm) * mp.mpf("0.9") + mp.mpf("1e-3"))
        vavg = mp.quad(lambda t: Vm * mp.sin(t), [a, mp.pi]) / (2 * mp.pi)
        vrms = mp.sqrt(mp.quad(lambda t: (Vm * mp.sin(t)) ** 2, [a, mp.pi]) / (2 * mp.pi))
        out.update(alpha=float(a * 180 / mp.pi), theta=float(180 - a * 180 / mp.pi), Vavg=float(vavg), Vrms=float(vrms))
    return out
def _scr_vec(mode, VGT, IGT, Vs, k, tp, T, PGM, PGAV, Vac, VD, Rg):
    inp = dict(mode=mode, VGT=VGT, IGT=IGT, Vs=Vs, k=k, tp=tp, T=T, PGM=PGM, PGAV=PGAV, Vac=Vac, VD=VD, Rg=Rg)
    out = _scr_m1(VGT, IGT, Vs, k, tp, T, PGM, PGAV) if mode == 1 else _scr_m2(VGT, IGT, Vac, VD, Rg)
    add("scr-triggering", inp, out, 1e-8)
def _scr_rand():
    VGT = _scr.choice([0.6, 0.8, 1, 1.5, 2, 3]); IGT = _scr.choice([0.2, 5, 15, 30, 50, 100]); k = _scr.choice([1, 1.5, 2, 3, 5])
    Vs = round(VGT + _scr.uniform(2, 30), 2); T = _scr.choice([8.33, 10, 20, 1]); tp = _scr.choice([0, 20, 50, 100, 250, 500])
    Vac = _scr.choice([24, 110, 120, 230, 400]); VD = _scr.choice([0, 0.7]); Vm = Vac * math.sqrt(2)
    Rk = round(_scr.uniform(0.05, 0.95) * (Vm - VGT - VD) / (IGT / 1000) / 1000, 3)
    if _scr.random() < 0.5: _scr_vec(1, VGT, IGT, Vs, k, tp, T, 5, 0.5, Vac, VD, Rk)
    else: _scr_vec(2, VGT, IGT, Vs, k, tp, T, 5, 0.5, Vac, VD, Rk)
for _ in range(34): _scr_rand()
_scr_vec(1, 1, 15, 12, 2, 100, 10, 5, 0.5, 230, 0.7, 10)      # the default
_scr_vec(1, 1.5, 50, 24, 3, 0, 10, 5, 0.5, 230, 0.7, 10)      # continuous gate current
_scr_vec(2, 1, 15, 12, 2, 100, 10, 5, 0.5, 230, 0.7, 10)      # AC 230 V, 10 kohm
_scr_vec(2, 1, 15, 12, 2, 100, 10, 5, 0.5, 230, 0.7, 0)       # no gate resistance
_scr_vec(2, 0.8, 30, 12, 2, 100, 10, 5, 0.5, 120, 0, 2.5)     # 120 V, no diode

# --- v1.98.2 work: pid-tuning (own stream, earlier vectors unchanged) ---
# Different route from the engine. Reaction-curve rules from the process reaction rate R = K / tau and the dead time L = theta (Kc = a / (R L), the form the rules were first
# published in), Cohen-Coon from the rational common-denominator forms of its formulas, and the ultimate-gain rules as exact fractions of Ku and Pu. The Ku and Pu used for methods 4 and 5
# are not typed in: they are found for the same first-order-plus-dead-time process by ROOT-FINDING the phase crossover -atan(w tau) - w theta = -pi (30-digit mpmath) and rounded to 6 digits.
# Lambda: the PID settings come from CANCELLING the process poles (the PID numerator polynomial is expanded and equated to (tau s + 1)(theta s / 2 + 1), which gives Ti and Td), and the gain
# from placing the closed-loop pole of 1 + C(s) P(s) at s = -1 / lambda on the Pade model, solved exactly in fractions. The lambda PI gain is found by root-finding |L(j wc)| = 1 for the full
# PI times first-order-plus-dead-time loop at the crossover frequency wc = 1 / (lambda + theta) with complex arithmetic (mpmath), not by the closed form.
_pid = random.Random(20261226)
def _pid_zn_ol(K, tau, th, ct):
    K = _F2(str(K)); tau = _F2(str(tau)); th = _F2(str(th)); R = K / tau
    a, ti, td = {1: (_F2(1), None, None), 2: (_F2(9, 10), th / _F2(3, 10), None), 3: (_F2(6, 5), 2 * th, th / 2)}[ct]
    return a / (R * th), ti, td, th / tau
def _pid_cc(K, tau, th, ct):
    K = _F2(str(K)); tau = _F2(str(tau)); th = _F2(str(th))
    if ct == 1: return (3 * tau + th) / (3 * K * th), None, None
    if ct == 2: return (_F2(108, 10) * tau + th) / (12 * K * th), th * (30 * tau + 3 * th) / (9 * tau + 20 * th), None
    return (16 * tau + 3 * th) / (12 * K * th), th * (32 * tau + 6 * th) / (13 * tau + 8 * th), 4 * th * tau / (11 * tau + 2 * th)
def _pid_lam_pid(K, tau, th, lam):
    K = _F2(str(K)); tau = _F2(str(tau)); th = _F2(str(th)); lam = _F2(str(lam))
    a2 = tau * th / 2; a1 = tau + th / 2            # (tau s + 1)(theta s / 2 + 1) = a2 s^2 + a1 s + 1
    Ti = a1; Td = a2 / Ti                           # Ti Td = a2, Ti = a1
    s0 = -1 / lam
    N0 = a2 * s0 * s0 + a1 * s0 + 1                 # numerator of C(s) / Kc at s0
    G = (N0 / (Ti * s0)) * K * (1 - th * s0 / 2) / ((1 + th * s0 / 2) * (tau * s0 + 1))
    return -1 / G, Ti, Td
def _pid_lam_pi(K, tau, th, lam):
    mp.mp.dps = 30
    M = lambda x: mp.mpf(str(x)); K, tau, th, lam = M(K), M(tau), M(th), M(lam)
    wc = 1 / (lam + th)
    def f(Kc):
        jw = mp.mpc(0, wc)
        L = Kc * (1 + 1 / (jw * tau)) * K * mp.exp(-jw * th) / (jw * tau + 1)
        return abs(L) - 1
    Kc = mp.findroot(f, tau / (K * (lam + th)) * mp.mpf("1.2"))
    return Kc, tau
def _pid_fopdt_ult(K, tau, th):
    mp.mp.dps = 30
    M = lambda x: mp.mpf(str(x)); K, tau, th = M(K), M(tau), M(th)
    w = mp.findroot(lambda x: -mp.atan(x * tau) - x * th + mp.pi, (mp.pi / 2) / (th + tau / 2) * mp.mpf("1.1"))
    Ku = mp.sqrt(1 + (w * tau) ** 2) / K
    return round(float(Ku), 6), round(float(2 * mp.pi / w), 6)
def _pid_add(m, ct, K, tau, th, lam, Ku, Pu):
    inp = dict(method=m, ctype=ct, K=K, tau=tau, theta=th, lam=lam, Ku=Ku, Pu=Pu)
    out = {}
    if m == 1: Kc, Ti, Td, r = _pid_zn_ol(K, tau, th, ct); out["r"] = float(r)
    elif m == 2: Kc, Ti, Td = _pid_cc(K, tau, th, ct); out["r"] = float(_F2(str(th)) / _F2(str(tau)))
    elif m == 3:
        if ct == 3: Kc, Ti, Td = _pid_lam_pid(K, tau, th, lam)
        else: Kc, Ti = _pid_lam_pi(K, tau, th, lam); Td = None
        out["r"] = float(_F2(str(th)) / _F2(str(tau)))
    elif m == 4:
        Ku_, Pu_ = _F2(str(Ku)), _F2(str(Pu))
        Kc, Ti, Td = {1: (Ku_ / 2, None, None), 2: (_F2(9, 20) * Ku_, Pu_ * _F2(5, 6), None), 3: (_F2(3, 5) * Ku_, Pu_ / 2, Pu_ / 8)}[ct]
    else:
        Ku_, Pu_ = _F2(str(Ku)), _F2(str(Pu))
        Kc, Ti, Td = {2: (Ku_ * _F2(5, 16), Pu_ * _F2(11, 5), None), 3: (Ku_ * _F2(5, 11), Pu_ * _F2(11, 5), Pu_ * _F2(10, 63))}[ct]
    out["Kc"] = float(Kc); out["PB"] = float(100 / Kc)
    if Ti is not None: out["Ti"] = float(Ti); out["Ki"] = float(Kc / Ti)
    if Td is not None: out["Td"] = float(Td); out["Kd"] = float(Kc * Td)
    add("pid-tuning", inp, out, 1e-8)
def _pid_rand():
    K = _pid.choice([0.4, 0.8, 1, 1.5, 2, 3.5, 5, 12]); tau = _pid.choice([5, 12, 30, 50, 120, 400, 1500]); th = round(tau * _pid.uniform(0.08, 1.2), 3)
    lam = round(_pid.uniform(0.5, 3) * th, 3); ku, pu = _pid_fopdt_ult(K, tau, th)
    m = _pid.choice([1, 2, 3, 4, 5]); ct = _pid.choice([2, 3] if m in (3, 5) else [1, 2, 3])
    _pid_add(m, ct, K, tau, th, lam, ku, pu)
for _ in range(60): _pid_rand()
_ku, _pu = _pid_fopdt_ult(2, 50, 10)
_pid_add(1, 3, 2, 50, 10, 30, _ku, _pu)       # the default
_pid_add(2, 3, 1, 10, 2, 30, 4, 20)           # Cohen-Coon PID, r = 0.2
_pid_add(3, 2, 2, 50, 10, 30, 4, 20)          # lambda PI
_pid_add(3, 3, 2, 50, 10, 30, 4, 20)          # lambda PID
_pid_add(4, 3, 2, 50, 10, 30, 4, 20)          # Z-N ultimate PID
_pid_add(5, 3, 2, 50, 10, 30, 4, 20)          # Tyreus-Luyben PID

# --- v1.98.3 work: bode-plot (own stream, earlier vectors unchanged) ---
# Different route from the engine. The response is built as the COMPLEX number G(j w) = K N(j w) / D(j w) from the numerator and denominator POLYNOMIALS (30-digit mpmath), and the
# magnitude and phase are read from it with abs() and arg(), not summed factor by factor. The gain crossover is a root of the polynomial |D|^2 - K^2 |N|^2 = 0 (mp.polyroots, smallest
# positive real root, no scan), the phase crossover a root of Im(N conj(D)) = 0 with Re < 0, which for the loops generated here (net lag of at most three first-order factors, no net lead) is
# exactly -180 degrees. The principal arg is mapped back to the continuous phase from the known bounds. The dead-time vectors use a small delay and add -w theta to that phase.
_bd = random.Random(20261227)
def _bd_poly(roots):
    c = [mp.mpf(1)]
    for r in roots:
        nc = [mp.mpf(0)] * (len(c) + 1)
        for k, a in enumerate(c): nc[k] += a; nc[k + 1] += a / mp.mpf(str(r))
        c = nc
    return c
def _bd_eval(c, w): return sum(a * (mp.mpc(0, w)) ** k for k, a in enumerate(c))
def _bd_G(K, n, Z, P, w):
    return mp.mpf(str(K)) * _bd_eval(_bd_poly(Z), w) / ((mp.mpc(0, w)) ** n * _bd_eval(_bd_poly(P), w))
def _bd_true_phase(G):
    a = mp.arg(G) * 180 / mp.pi
    return a - 360 if a > 0 else a
def _bd_sqpoly(c):
    re = [mp.mpf(0)] * len(c); im = [mp.mpf(0)] * len(c)
    for k, a in enumerate(c):
        (re if k % 2 == 0 else im)[k] = a * (-1) ** (k // 2)
    def mul(x, y):
        r = [mp.mpf(0)] * (len(x) + len(y) - 1)
        for i, a in enumerate(x):
            for j, b in enumerate(y): r[i + j] += a * b
        return r
    rr, ii = mul(re, re), mul(im, im)
    return [a + b for a, b in zip(rr, ii)]
def _bd_vec(K, n, Z, P, th, w):
    mp.mp.dps = 40
    zz = (list(Z) + [0, 0])[:2]; pp = (list(P) + [0, 0, 0])[:3]
    inp = dict(K=K, n=n, z1=zz[0], z2=zz[1], p1=pp[0], p2=pp[1], p3=pp[2], theta=th, w=w)
    G = _bd_G(K, n, Z, P, w); ph = _bd_true_phase(G) - float(w) * th * 180 / math.pi
    mag = abs(G)
    asym = 20 * math.log10(K) - 20 * n * math.log10(w) + sum(20 * math.log10(w / z) for z in Z if w > z) - sum(20 * math.log10(w / p) for p in P if w > p)
    slope = -20 * n + 20 * sum(1 for z in Z if w > z) - 20 * sum(1 for p in P if w > p)
    dB = float(20 * mp.log10(mag))
    out = dict(mag=float(mag), dB=dB, ph=float(ph), asym=asym, err=dB - asym, slope=slope)
    Nc, Dc = _bd_poly(Z), _bd_poly(P)
    # |K N|^2 - |s^n D|^2 as a polynomial in w; s^n only shifts degrees: |(jw)^n D|^2 = w^(2n) |D|^2
    A = [mp.mpf(str(K)) ** 2 * a for a in _bd_sqpoly(Nc)]
    B = [mp.mpf(0)] * (2 * n) + _bd_sqpoly(Dc)
    L = max(len(A), len(B)); A += [mp.mpf(0)] * (L - len(A)); B += [mp.mpf(0)] * (L - len(B))
    poly = [b - a for a, b in zip(A, B)]
    while poly and abs(poly[-1]) < mp.mpf("1e-30"): poly.pop()
    rts = sorted(float(r.real) for r in mp.polyroots(poly[::-1], maxsteps=500, extraprec=200) if abs(r.imag) < 1e-12 and r.real > 1e-9) if len(poly) > 1 else []
    if rts:
        wg = rts[0]; Gg = _bd_G(K, n, Z, P, mp.mpf(wg))
        out["wgc"] = wg; out["PM"] = float(180 + _bd_true_phase(Gg) - wg * th * 180 / math.pi)
    if th == 0:
        # Im(G) = 0 with Re(G) < 0: numerator Im(N conj(D')) where D' = (jw)^n D; evaluate by scanning the polynomial roots of Im part
        # Im(K N(jw) conj(D'(jw))) as a polynomial in w, built from the coefficients of N and (j)^n D.
        # polynomial in w of N(jw) * conj(D'(jw)): build from complex coefficients c_k j^k
        Nk = [a * (mp.mpc(0, 1)) ** k for k, a in enumerate(Nc)]
        Dk = [a * (mp.mpc(0, 1)) ** (k + n) for k, a in enumerate(Dc)]
        Dkc = [mp.conj(a) for a in Dk]
        # conj of a w^m coefficient: coefficients are complex numbers times w^m with w real, so conjugate the coefficients
        prod = [mp.mpc(0)] * (len(Nk) + len(Dkc) - 1)
        for i, a in enumerate(Nk):
            for j, b in enumerate(Dkc): prod[i + j] += a * b
        imp = [a.imag for a in prod]
        while imp and abs(imp[-1]) < mp.mpf("1e-30"): imp.pop()
        if len(imp) > 1:
            cand = sorted(float(r.real) for r in mp.polyroots(imp[::-1], maxsteps=500, extraprec=200) if abs(r.imag) < 1e-12 and r.real > 1e-9)
            for wp in cand:
                Gp = _bd_G(K, n, Z, P, mp.mpf(wp))
                if Gp.real < 0:
                    out["wpc"] = wp; out["GM"] = float(-20 * mp.log10(abs(Gp))); break
    add("bode-plot", inp, out, 1e-7)
def _bd_rand():
    n = _bd.choice([0, 1, 1, 2]); P = sorted(_bd.choice([0.2, 0.5, 1, 2, 5, 10, 30, 100, 400]) for _ in range(_bd.choice([1, 2, 3])))
    P = sorted(set(P)) if len(set(P)) != len(P) else P
    nz = _bd.choice([0, 1]) if n >= 1 else 0
    Z = [_bd.choice([3, 20, 80, 300])] if nz else []
    if n + len(P) - len(Z) > 3: P = P[:max(1, 3 - n + len(Z))]
    K = round(10 ** _bd.uniform(-1, 2.2), 3) if n >= 1 else round(_bd.uniform(1.5, 80), 3)
    w = round(10 ** _bd.uniform(-1, 2), 3)
    th = _bd.choice([0, 0, 0, 0.02, 0.05])
    _bd_vec(K, n, Z, P, th, w)
for _ in range(55): _bd_rand()
_bd_vec(10, 1, [], [1, 10], 0, 1)      # the default
_bd_vec(1, 1, [], [1, 10], 0, 1)       # gain margin 20 log10 11
_bd_vec(20, 1, [], [1, 10], 0, 1)      # unstable, GM below zero
_bd_vec(1, 1, [], [], 0, 1)            # pure integrator
_bd_vec(10, 1, [50], [1, 10], 0, 100)  # one zero

# --- v1.98.4 work: ev-range (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms, in exact fractions. The pack is built CELL BY CELL: the series string voltage is the sum of its cells' voltages, the pack capacity
# the sum of the parallel branches' capacities, and the nominal energy the sum over every cell of (cell voltage x cell capacity), not Vpack x Qpack. The vehicle is DRIVEN one kilometre
# at a time: each km takes the driving Wh plus the auxiliary energy of one km (the power times the hours that km takes, 1 / v), the whole kilometres are counted while the usable energy
# lasts, and the last part-kilometre is the remainder over one km's energy. Distance per 1% is one hundredth of the available energy over one km's energy; the trip energy is summed
# km by km with a last part-km; the discharge rate is the battery power (energy per km times km per hour) over the available energy.
from fractions import Fraction as _F3
_evr = random.Random(20261228)
def _ev_calc(ns, np_, Vc, Qc, soh, tf, s0, s1, E, Pa, v, D):
    Vc, Qc, soh, tf, s0, s1, E, Pa, v, D = [_F3(str(x)) for x in (Vc, Qc, soh, tf, s0, s1, E, Pa, v, D)]
    cells = [(Vc, Qc) for _ in range(ns * np_)]
    Vp = sum(Vc for _ in range(ns)); Qp = sum(Qc for _ in range(np_))
    Enom = sum(a * b for a, b in cells)                                    # Wh
    Eav = Enom * (soh / 100) * (tf / 100)
    Euse = Eav * (s0 - s1) / 100
    km_h = Pa * 1000 * (1 / v)                                             # auxiliary Wh in one km: the power times the hours that km takes (1 / v)
    Etot = E + km_h
    def drive(energy, per_km):
        km = _F3(0); left = energy
        while left >= per_km: left -= per_km; km += 1
        return km + left / per_km
    R = drive(Euse, Etot); Rfull = drive(Eav, Etot); Rnom = drive(Enom, E)
    Etr = Etot * D                                                          # trip energy, Wh
    Sneed = 100 * Etr / Eav
    out = dict(Vp=Vp, Qp=Qp, Ncell=ns * np_, Enom=Enom / 1000, Eav=Eav / 1000, Euse=Euse / 1000, Etot=Etot, R=R, Rmi=R / _F3("1.609344"), Rfull=Rfull, Rnom=Rnom,
               Rloss=100 * (Rnom - R) / Rnom, kmpct=(Eav / 100) / Etot, Tr=R / v, Pb=Etot * v / 1000, Crate=(Etot * v) / Eav, Etr=Etr / 1000, Sneed=Sneed, Sarr=s0 - Sneed, Mk=R - D)
    if Pa > 0: out["Eaux"] = km_h
    return {k: float(x) for k, x in out.items() if abs(float(x)) > 1e-6}
def _ev_vec(ns, np_, Vc, Qc, soh, tf, s0, s1, E, Pa, v, D):
    inp = dict(ns=ns, np=np_, Vc=Vc, Qc=Qc, soh=soh, tf=tf, s0=s0, s1=s1, E=E, Pa=Pa, v=v, D=D)
    add("ev-range", inp, _ev_calc(ns, np_, Vc, Qc, soh, tf, s0, s1, E, Pa, v, D), 1e-9)
def _ev_rand():
    ns = _evr.choice([24, 48, 72, 96, 100, 108, 112, 192]); np_ = _evr.choice([1, 2, 3, 4, 5, 6])
    Vc = _evr.choice([3.2, 3.6, 3.65, 3.7, 3.85, 3.3]); Qc = _evr.choice([4.8, 5, 21, 50, 60, 78, 94, 100, 120, 150])
    soh = _evr.choice([70, 78, 85, 90, 95, 98, 100]); tf = _evr.choice([75, 82, 88, 90, 95, 100, 105])
    s0 = _evr.choice([80, 85, 90, 95, 100]); s1 = _evr.choice([0, 5, 8, 10, 15, 20])
    E = _evr.choice([110, 130, 150, 160, 180, 210, 250, 320]); Pa = _evr.choice([0, 0.4, 1, 1.5, 2.2, 3.5, 5]); v = _evr.choice([20, 35, 50, 65, 80, 100, 120])
    D = _evr.choice([30, 80, 150, 250, 310, 400, 620]) + _evr.choice([0, 0.5, 12.5])
    _ev_vec(ns, np_, Vc, Qc, soh, tf, s0, s1, E, Pa, v, D)
for _ in range(32): _ev_rand()
_ev_vec(96, 2, 3.7, 100, 95, 90, 95, 10, 160, 1, 80, 250)       # the default
_ev_vec(96, 2, 3.7, 100, 100, 100, 100, 0, 160, 0, 80, 250)     # new pack, no auxiliary load, 100% to 0%: range = nominal energy / consumption
_ev_vec(96, 2, 3.7, 100, 95, 90, 95, 10, 160, 1, 80, 320)       # arrives below the reserve
_ev_vec(96, 3, 3.2, 100, 90, 85, 90, 10, 150, 2, 30, 250)       # LFP pack in slow traffic: the auxiliary load is a large share
_ev_vec(24, 1, 3.7, 5, 100, 100, 100, 0, 110, 0, 50, 5)         # one small string
_ev_vec(192, 4, 3.65, 60, 80, 90, 100, 5, 260, 3.5, 120, 600)   # large pack, motorway speed

# --- v1.98.5 work: wavelength (own stream, earlier vectors unchanged) ---
# Different route from the engine's c / sqrt(er mur), in 40-digit mpmath. The medium is built from its constants: mu = mu0 mur and eps = eps0 er with eps0 = 1 / (mu0 c^2)
# (CODATA 2018 mu0, exact c), the wave is exp(j (w t - k z)) with k = w sqrt(mu eps), the wavelength is the distance over which the phase falls by 2 pi (lambda = 2 pi / k), and the wave
# impedance is sqrt(mu / eps). A velocity factor VF is a medium with k = w / (VF c). A frequency from a wavelength comes from k = 2 pi / lambda and w = k / sqrt(mu eps), so f = w / 2 pi.
# The electrical length is the phase shift k L in radians, turned into degrees by 180 / pi and into wavelengths by dividing by 2 pi.
_mp_w = __import__("mpmath"); _mp_w.mp.dps = 40
_wlr = random.Random(20261229)
def _wl_calc(mode, med, f_MHz, lam, er, mur, vf, L):
    m = _mp_w; c = m.mpf(299792458); mu0 = m.mpf("1.25663706212e-6"); eps0 = 1 / (mu0 * c * c)
    if med == 1: sme = m.sqrt(mu0 * m.mpf(str(mur)) * eps0 * m.mpf(str(er)))      # sqrt(mu eps), seconds per metre
    else: sme = 1 / (m.mpf(str(vf)) * c)
    if mode == 1:
        w = 2 * m.pi * m.mpf(str(f_MHz)) * m.mpf(10) ** 6; k = w * sme; lam_m = 2 * m.pi / k
    else:
        lam_m = m.mpf(str(lam)); k = 2 * m.pi / lam_m; w = k / sme
    f = w / (2 * m.pi); k0 = w * m.sqrt(mu0 * eps0); lam0 = 2 * m.pi / k0
    out = dict(f=f / m.mpf(10) ** 6, lam=lam_m, lam0=lam0, v=w / k, VF=(w / k) / c, n=c * sme, T=(2 * m.pi / w) * m.mpf(10) ** 6, k=k, half=lam_m / 2, quarter=lam_m / 4)
    if med == 1: out["eta"] = m.sqrt(mu0 * m.mpf(str(mur)) / (eps0 * m.mpf(str(er))))
    if L > 0:
        ph = k * m.mpf(str(L)); out["Lw"] = ph / (2 * m.pi); out["Ldeg"] = ph * 180 / m.pi
    return {kk: float(x) for kk, x in out.items()}
def _wl_vec(mode, med, f_MHz, lam, er, mur, vf, L):
    add("wavelength", dict(mode=mode, med=med, f=f_MHz, lam=lam, er=er, mur=mur, vf=vf, L=L), _wl_calc(mode, med, f_MHz, lam, er, mur, vf, L), 1e-8)
def _wl_rand():
    mode = _wlr.choice([1, 2]); med = _wlr.choice([1, 2])
    f = _wlr.choice([0.1, 1, 7.1, 14.2, 50, 100, 144, 433.92, 868, 915, 2400, 5800, 10000, 24000])
    lam = _wlr.choice([0.0125, 0.1, 0.5, 1, 3, 20, 300]) * _wlr.choice([1, 1.5, 2.2])
    er = _wlr.choice([1, 1.0006, 2.1, 2.25, 2.3, 3.4, 4.2, 4.7, 6.15, 10.2, 80]); mur = _wlr.choice([1, 1, 1, 1, 2, 50, 100])
    vf = _wlr.choice([0.66, 0.7, 0.82, 0.85, 0.95, 0.97, 1]); L = _wlr.choice([0, 0.01, 0.05, 0.3, 0.5, 1.5, 10, 100.5])
    _wl_vec(mode, med, f, lam, er, mur, vf, L)
for _ in range(32): _wl_rand()
_wl_vec(1, 1, 100, 3, 1, 1, 0.66, 1.5)        # the default: 100 MHz in free space
_wl_vec(1, 1, 2400, 3, 1, 1, 0.66, 0)         # 2.4 GHz, no length
_wl_vec(1, 1, 1000, 3, 2.1, 1, 0.66, 0)       # PTFE at 1 GHz
_wl_vec(1, 2, 144, 3, 1, 1, 0.66, 0.5)        # coaxial cable, velocity factor 0.66
_wl_vec(2, 1, 100, 1, 1, 1, 0.66, 0)          # 1 m in free space is 299.792458 MHz
_wl_vec(2, 2, 100, 1, 1, 1, 0.8, 0.25)        # a quarter-wave stub on a line with velocity factor 0.8

# --- v1.98.6 work: contact-resistance (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms, in 40-digit mpmath. The spreading resistance of one half-space to a circular contact of radius a is built from its
# integral, rho / (2 pi a) times the integral of du / (1 + u^2) from 0 to infinity (evaluated numerically, not taken as pi / 2 or rho / 4a); the two members add; the spot radius is found by
# solving n pi a^2 H = F with a root finder; the film is a conductance over each spot; n identical spots are summed as n parallel conductances, each spot being constriction plus film in
# series; the single-spot radius that gives a resistance is found by bisection on ln a; the spot temperature is the root of 4 L (T^2 - Tb^2) = U^2 and the contact voltage that brings the
# spot to a temperature is found by root finding on that temperature, with L = 2.45e-8 V^2/K^2. The Lorenz number and the form of the Kohlrausch relation are the textbook statement
# that both sides share, so only the resistance route is fully independent.
_cr_m = __import__("mpmath"); _cr_m.mp.dps = 40
# Independent reference for contact-resistance (different route from the closed forms).
_cr_L0 = _cr_m.mpf('2.45e-8'); _cr_K0 = _cr_m.mpf('273.15')
_cr_I0 = _cr_m.quad(lambda u: 1 / (1 + u * u), [0, _cr_m.inf])   # = pi/2, the spreading integral of one half-space
def _cr_half(rho, a): return _cr_m.mpf(str(rho)) * _cr_I0 / (2 * _cr_m.pi * a)      # resistance of one half-space to a circular contact of radius a
def _cr_tspot(U, Tb):   # kelvin: root of 4 L (T^2 - Tb^2) = U^2
    return _cr_m.findroot(lambda T: 4 * _cr_L0 * (T * T - Tb * Tb) - U * U, Tb + 1)
def _cr_uat(T, Tb):     # contact voltage that brings the spot to T (kelvin): found by root finding on the spot temperature
    return _cr_m.findroot(lambda U: _cr_tspot(U, Tb) - T, _cr_m.mpf('0.1'))
def _cr_calc(mode, rho1, rho2, F, H, n, sf, I, Um, Tb, Ts, Tm, Rl):
    I_ = _cr_m.mpf(str(I)); Tbk = _cr_m.mpf(str(Tb)) + _cr_K0
    out = {}
    if mode == 1:
        a = _cr_m.findroot(lambda x: n * _cr_m.pi * x * x * _cr_m.mpf(str(H)) * _cr_m.mpf(10) ** 6 - _cr_m.mpf(str(F)), _cr_m.mpf('1e-4'))
        Rsc = _cr_half(rho1, a) + _cr_half(rho2, a)                     # one spot
        Rsf = _cr_m.mpf(str(sf)) * _cr_m.mpf('1e-9') / (_cr_m.pi * a * a)   # film over one spot
        G = _cr_m.mpf(0)
        for _ in range(n): G += 1 / (Rsc + Rsf)                 # n spots in parallel
        R = 1 / G
        out.update(A=n * _cr_m.pi * a * a * _cr_m.mpf(10) ** 6, a=a * _cr_m.mpf(10) ** 6, Rc=Rsc / n * _cr_m.mpf(10) ** 6, Rf=Rsf / n * _cr_m.mpf(10) ** 6)
        U = I_ * R
    else:
        U = _cr_m.mpf(str(Um)) / 1000; R = U / I_
    # equivalent single circular spot with no film: solve R = _cr_half(rho1,a) + _cr_half(rho2,a) for a
    lo, hi = _cr_m.mpf(-40), _cr_m.mpf(10)                           # bisection on ln(a): the resistance falls as the spot grows
    for _ in range(220):
        mid = (lo + hi) / 2
        if _cr_half(rho1, _cr_m.exp(mid)) + _cr_half(rho2, _cr_m.exp(mid)) > R: lo = mid
        else: hi = mid
    aeq = _cr_m.exp((lo + hi) / 2)
    out.update(R=R * _cr_m.mpf(10) ** 6, aeq=aeq * _cr_m.mpf(10) ** 6, U=U * 1000, P=I_ * U)
    T = _cr_tspot(U, Tbk); out.update(Tsp=T - _cr_K0, dT=T - Tbk)
    Us = _cr_uat(_cr_m.mpf(str(Ts)) + _cr_K0, Tbk); Um_ = _cr_uat(_cr_m.mpf(str(Tm)) + _cr_K0, Tbk)
    out.update(Us=Us * 1000, Um=Um_ * 1000, Is=Us / R, Im=Um_ / R)
    if Rl > 0: out['ratio'] = R * _cr_m.mpf(10) ** 6 / _cr_m.mpf(str(Rl))
    return {k: float(v) for k, v in out.items()}

_crr = random.Random(20261230)
def _cr_vec(mode, rho1, rho2, F, H, n, sf, I, Um, Tb, Ts, Tm, Rl):
    add("contact-resistance", dict(mode=mode, rho1=rho1, rho2=rho2, F=F, H=H, n=n, sf=sf, I=I, Um=Um, Tb=Tb, Ts=Ts, Tm=Tm, Rl=Rl), _cr_calc(mode, rho1, rho2, F, H, n, sf, I, Um, Tb, Ts, Tm, Rl), 1e-8)
def _cr_rand():
    mode = _crr.choice([1, 2]); r1 = _crr.choice([1.59e-8, 1.68e-8, 2.44e-8, 2.65e-8, 6.99e-8]); r2 = _crr.choice([1.59e-8, 1.68e-8, 2.44e-8, 2.65e-8, 6.99e-8])
    F = _crr.choice([5, 10, 20, 50, 100, 250, 800, 2000]); H = _crr.choice([100, 250, 500, 700, 1000, 1500, 3000]); n = _crr.choice([1, 1, 2, 3, 5, 10, 40])
    sf = _crr.choice([0, 0, 0.001, 0.01, 0.1]); I = _crr.choice([1, 10, 50, 100, 400, 1000, 5000]); Um = _crr.choice([0.05, 0.5, 2, 5, 12, 50, 250])
    Tb = _crr.choice([0, 20, 30, 40, 75]); Ts, Tm = _crr.choice([(100, 660), (150, 962), (190, 1085), (250, 1455)]); Rl = _crr.choice([0, 0, 10, 50, 200])
    _cr_vec(mode, r1, r2, F, H, n, sf, I, Um, Tb, Ts, Tm, Rl)
for _ in range(32): _cr_rand()
_cr_vec(1, 1.68e-8, 1.68e-8, 100, 1000, 1, 0, 100, 5, 30, 190, 1085, 0)      # the default
_cr_vec(1, 1.68e-8, 1.68e-8, 100, 1000, 10, 0, 100, 5, 30, 190, 1085, 0)     # ten spots
_cr_vec(1, 1.68e-8, 1.68e-8, 100, 1000, 1, 0.01, 100, 5, 30, 190, 1085, 0)   # a film
_cr_vec(1, 1.68e-8, 1.59e-8, 50, 700, 4, 0.01, 200, 5, 40, 190, 1085, 60)    # copper on silver with a limit
_cr_vec(2, 1.68e-8, 1.68e-8, 100, 1000, 1, 0, 100, 5, 30, 190, 1085, 0)      # a measured 5 mV at 100 A
_cr_vec(1, 1.68e-8, 1.68e-8, 20, 1000, 1, 0, 5000, 5, 30, 190, 1085, 0)      # above the melting voltage

# --- v1.98.7 work: signage-load (own stream, earlier vectors unchanged) ---
# Different route from the engine's group sums, in exact fractions.Fraction arithmetic: every sign is its own load in a list (lamp power over the transformer efficiency), the loop is a
# resistance in ohms (ohm per km times metres over 1000) and the cable loss is I^2 times that resistance, the total is a sum over the list, the output voltage is that total over the
# current, the spare allowance is applied to the sum of the list, the CCR is the first size in a scan of 1, 2, 4, 7.5, 10, 15, 20, 25 and 30 kW whose loading limit (size x limit) is at or
# above the design load, the room is that limit less the total, and the number of further signs is the count of signs of the average size that can be added one at a time (a loop, not a
# floor). The transformer loading is compared group by group by cross-multiplying, not by division. Random cases keep the design load and the room away from a size or sign-count edge.
import fractions as _sg_f
_sg_Fr = _sg_f.Fraction
_sg_STD = [_sg_Fr(1), _sg_Fr(2), _sg_Fr(4), _sg_Fr(15, 2), _sg_Fr(10), _sg_Fr(15), _sg_Fr(20), _sg_Fr(25), _sg_Fr(30)]
def _sg_fr(x): return _sg_Fr(str(x))
def _sg_calc(g, et, I, L, R, Po, sp, ld):
    et, I, L, R, Po, sp, ld = map(_sg_fr, (et, I, L, R, Po, sp, ld))
    signs = []
    for (n, P, T) in g:
        for _ in range(int(n)): signs.append(_sg_fr(P) / et)
    Pin = _sg_Fr(0)
    for x in signs: Pin += x
    Rloop = R * L / 1000; cab = I * I * Rloop
    Pt = Pin + Po + cab; Vo = Pt / I
    Pd = Pin * (1 + sp / 100) + Po + cab
    lamp = _sg_Fr(0)
    for x in signs: lamp += x * et
    out = dict(ns=len(signs), Plamp=lamp / 1000, Pin=Pin / 1000, Pc=cab, Pt=Pt / 1000, Vo=Vo, Pd=Pd / 1000)
    best = None   # group with the largest P / T, compared by cross-multiplication, first group on a tie
    for j, (n, P, T) in enumerate(g):
        if n > 0:
            out['g%d' % (j + 1)] = _sg_fr(P) * int(n) / et / 1000
            if best is None or _sg_fr(P) * _sg_fr(g[best][2]) > _sg_fr(g[best][1]) * _sg_fr(T): best = j
    out['tmax'] = _sg_fr(g[best][1]) / _sg_fr(g[best][2]) * 100; out['tg'] = best + 1
    ccr = None
    for k in _sg_STD:
        if k * 1000 * ld >= Pd: ccr = k; break
    if ccr is not None:
        room = ccr * 1000 * ld - Pt
        out.update(ccr=ccr, pct=Pt / (ccr * 1000) * 100, pctd=Pd / (ccr * 1000) * 100, room=room / 1000)
        avg = Pin / len(signs); more = 0; used = _sg_Fr(0)
        while used + avg <= room: used += avg; more += 1
        out['extra'] = more
    return {k: float(v) for k, v in out.items()}
def _sg_edge_ok(g, et, I, L, R, Po, sp, ld):
    etf, If, Lf, Rf, Pof, spf, ldf = map(_sg_fr, (et, I, L, R, Po, sp, ld))
    Pin = sum((_sg_fr(P) * int(n) / etf for (n, P, T) in g), _sg_Fr(0)); n_all = sum(int(n) for (n, P, T) in g)
    cab = If * If * Rf * Lf / 1000; Pd = Pin * (1 + spf / 100) + Pof + cab; Pt = Pin + Pof + cab
    for k in _sg_STD:
        if abs(k * 1000 * ldf - Pd) < _sg_Fr(1, 100): return False
        if k * 1000 * ldf >= Pd:
            room = k * 1000 * ldf - Pt; r = room / (Pin / n_all)
            return abs(r - round(r)) > _sg_Fr(1, 1000)
    return True   # above the largest size: no room figures
_sgr = random.Random(20261231)
def _sg_vec(g, et, I, L, R, Po, sp, ld):
    d = {}
    for j, (n, P, T) in enumerate(g, 1): d['n%d' % j] = n; d['P%d' % j] = P; d['T%d' % j] = T
    d.update(et=et, I=I, L=L, R=R, Po=Po, sp=sp, ld=ld)
    add("signage-load", d, _sg_calc(g, et, I, L, R, Po, sp, ld), 1e-9)
def _sg_rand():
    while True:
        g = []
        for _ in range(4):
            n = _sgr.choice([0, 0, 1, 2, 3, 5, 8, 12, 20, 35])
            P = _sgr.choice([30, 45, 60, 90, 100, 120, 150, 200, 250, 300, 450]); T = _sgr.choice([100, 150, 200, 300, 500])
            g.append((n, P, T))
        if sum(n for n, P, T in g) < 1: continue
        et = _sgr.choice([0.7, 0.8, 0.85, 0.9, 0.95, 1]); I = _sgr.choice([2.8, 3.4, 4.1, 5.2, 6.6, 20]); L = _sgr.choice([200, 800, 1500, 3500, 6000, 12000])
        R = _sgr.choice([0.5, 1.2, 3.08, 5.4]); Po = _sgr.choice([0, 0, 150, 800, 2500]); sp = _sgr.choice([0, 10, 20, 35, 100]); ld = _sgr.choice([0.5, 0.7, 0.8, 0.9, 1])
        if _sg_edge_ok(g, et, I, L, R, Po, sp, ld): return _sg_vec(g, et, I, L, R, Po, sp, ld)
for _ in range(32): _sg_rand()
_sg_D = [(10, 100, 150), (6, 200, 300), (4, 250, 300), (2, 60, 100)]
_sg_vec(_sg_D, 0.85, 6.6, 3500, 3.08, 0, 20, 0.8)                                  # the default
_sg_vec([(12, 100, 150), (8, 150, 200), (0, 100, 150), (0, 100, 150)], 0.9, 6.6, 2000, 3.08, 0, 20, 0.8)   # two groups used
_sg_vec([(20, 100, 150), (0, 100, 150), (0, 100, 150), (0, 100, 150)], 0.85, 6.6, 1500, 3.08, 1500, 0, 0.8)  # other load, no spare
_sg_vec([(30, 100, 150), (0, 100, 150), (0, 100, 150), (0, 100, 150)], 0.85, 6.6, 1000, 3.08, 0, 100, 0.8)   # spare pushes to the next size
_sg_vec([(5, 130, 100), (0, 100, 150), (0, 100, 150), (0, 100, 150)], 0.85, 6.6, 1000, 3.08, 0, 20, 0.8)     # transformer overloaded
_sg_vec([(10, 200, 300), (10, 100, 150), (0, 100, 150), (0, 100, 150)], 0.85, 6.6, 1000, 3.08, 0, 20, 0.8)   # a tie in transformer loading: first group
_sg_vec([(400, 100, 150), (100, 100, 150), (0, 100, 150), (0, 100, 150)], 0.85, 6.6, 4000, 3.08, 0, 20, 0.8)  # above 30 kW: no standard size


# --- v1.98.8 work: protection-coordination-check (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms: the pick-up window, the stability, sensitivity and instantaneous factors and the grading margins are exact fractions.Fraction
# arithmetic written as inequalities cleared of division (the lowest stable pick-up is the smallest setting whose reset current kr x Ipu still clears kl x IL, found as the exact
# quotient; each factor is a cross-product compared with its limit). The IEC 60255-151 operating time is the time at which an induction-disc emulation reaches full travel: the disc
# travels at a rate (M^a - 1) / (TMS k) per second (the rate is built with expm1 of a ln M in 40-digit mpmath, not the engine's pow minus one) and the time is the root of
# travel(t) = 1 found by mpmath.findroot on the integral of the rate. The same published curve form is behind both routes, so the timing is independent in arithmetic only.
# Random cases keep every check at least 1% away from its pass/fail edge. Expected zeros (a count of no failed checks) are left out because the comparison is relative.
import fractions as _pc_f, mpmath as _pc_m
_pc_Fr = _pc_f.Fraction
_pc_m.mp.dps = 40
_pc_K = [(_pc_m.mpf('0.14'), _pc_m.mpf('0.02')), (_pc_m.mpf('13.5'), _pc_m.mpf(1)), (_pc_m.mpf(80), _pc_m.mpf(2)), (_pc_m.mpf(120), _pc_m.mpf(1))]
def _pc_fr(x): return _pc_Fr(str(x))
def _pc_t(curve, tms, ip, i):
    """Operating time (s) from the disc emulation; None when the current does not exceed the pick-up."""
    k, a = _pc_K[curve]
    M = _pc_m.mpf(str(i)) / _pc_m.mpf(str(ip))
    if M <= 1: return None
    rate = _pc_m.expm1(a * _pc_m.log(M)) / (_pc_m.mpf(str(tms)) * k)
    return _pc_m.findroot(lambda t: _pc_m.quad(lambda u: rate, [0, t]) - 1, 1 / rate)
def _pc_calc(IL, kl, Ipu, kr, Imin, ks, Imax, Ii, ki, cd, TMSd, cu, Isu, TMSu, tm):
    IL, kl, Ipu, kr, Imin, ks, Imax, Ii, ki, Isu, tm = map(_pc_fr, (IL, kl, Ipu, kr, Imin, ks, Imax, Ii, ki, Isu, tm))
    lo = kl * IL / kr; hi = Imin / ks
    out = dict(lo=lo, hi=hi, fL=Ipu / lo, S=Imin / Ipu)
    nchk = 2; nfail = 0
    if Ipu * kr < kl * IL: nfail += 1                       # reset current below the load with its margin
    if Imin < ks * Ipu: nfail += 1                          # sensitivity factor not met
    if Ii > 0:
        out['Si'] = Ii / Imax; out['reach'] = Imin / Ii; nchk += 1
        if Ii < ki * Imax: nfail += 1
    td = _pc_t(cd, TMSd, Ipu, Imax); tu = _pc_t(cu, TMSu, Isu, Imax)
    out['td'] = td; out['tu'] = tu; out['marg'] = tu - td; nchk += 1
    if tu - td < _pc_m.mpf(str(tm)): nfail += 1
    tdl = _pc_t(cd, TMSd, Ipu, Imin); tul = _pc_t(cu, TMSu, Isu, Imin)
    if tdl is not None and tul is not None:
        out['tdl'] = tdl; out['tul'] = tul; out['margl'] = tul - tdl; nchk += 1
        if tul - tdl < _pc_m.mpf(str(tm)): nfail += 1
    out['nchk'] = nchk
    if nfail: out['nfail'] = nfail
    return {k: float(v) for k, v in out.items()}
def _pc_edge_ok(IL, kl, Ipu, kr, Imin, ks, Imax, Ii, ki, cd, TMSd, cu, Isu, TMSu, tm):
    ILf, klf, Ipuf, krf, Iminf, ksf, Imaxf, Iif, kif, Isuf = map(_pc_fr, (IL, kl, Ipu, kr, Imin, ks, Imax, Ii, ki, Isu))
    e = _pc_Fr(1, 100)
    def far(a, b): return abs(a - b) > e * abs(b)
    if not (far(Ipuf * krf, klf * ILf) and far(Iminf, ksf * Ipuf)): return False
    if Iif > 0 and not far(Iif, kif * Imaxf): return False
    if not (Imaxf > Ipuf and Imaxf > Isuf and Imaxf >= Iminf and (Iif == 0 or Iif > Ipuf)): return False
    if Iif > 0 and Iif <= Imaxf and False: return False
    tmv = _pc_m.mpf(str(tm))
    for I in (Imaxf, Iminf):
        td = _pc_t(cd, TMSd, Ipu, float(I)); tu = _pc_t(cu, TMSu, Isu, float(I))
        if td is None or tu is None:
            if I == Imaxf: return False
            continue
        if abs((tu - td) - tmv) < tmv / 50: return False
    return True
_pcr = random.Random(20261232)
def _pc_vec(*a):
    keys = ['IL', 'kl', 'Ipu', 'kr', 'Imin', 'ks', 'Imax', 'Ii', 'ki', 'cd', 'TMSd', 'cu', 'Isu', 'TMSu', 'tm']
    add("protection-coordination-check", dict(zip(keys, a)), _pc_calc(*a), 1e-9)
def _pc_rand():
    while True:
        IL = _pcr.choice([60, 120, 180, 250, 400, 640]); kl = _pcr.choice([1, 1.05, 1.1, 1.25]); kr = _pcr.choice([0.85, 0.9, 0.95, 0.98])
        Ipu = round(IL * _pcr.choice([1.0, 1.2, 1.5, 2.0, 3.0, 5.0]) , 1)
        Imin = round(Ipu * _pcr.choice([0.9, 1.3, 1.8, 2.5, 4, 8]), 1); ks = _pcr.choice([1.2, 1.5, 2])
        Imax = round(Imin * _pcr.choice([1.2, 2, 4, 8, 15]), 1); Ii = _pcr.choice([0, 0, round(Imax * _pcr.choice([0.9, 1.3, 1.8]), 1)]); ki = _pcr.choice([1.1, 1.2, 1.3])
        cd = _pcr.randrange(4); cu = _pcr.randrange(4); TMSd = _pcr.choice([0.05, 0.1, 0.2, 0.5, 1]); TMSu = _pcr.choice([0.1, 0.2, 0.35, 0.6, 1])
        Isu = round(Ipu * _pcr.choice([0.8, 1.2, 1.5, 2.2]), 1); tm = _pcr.choice([0.3, 0.35, 0.4, 0.5])
        a = (IL, kl, Ipu, kr, Imin, ks, Imax, Ii, ki, cd, TMSd, cu, Isu, TMSu, tm)
        if _pc_edge_ok(*a): return _pc_vec(*a)
for _ in range(32): _pc_rand()
_pc_vec(180, 1.1, 250, 0.95, 1100, 1.5, 6000, 7500, 1.2, 0, 0.1, 0, 400, 0.25, 0.4)      # the default: all checks pass
_pc_vec(180, 1.1, 190, 0.95, 1100, 1.5, 6000, 7500, 1.2, 0, 0.1, 0, 400, 0.25, 0.4)      # pick-up too low for the load
_pc_vec(180, 1.1, 800, 0.95, 1100, 1.5, 6000, 7500, 1.2, 0, 0.1, 0, 1200, 0.25, 0.4)     # pick-up too high for the minimum fault: no window
_pc_vec(180, 1.1, 250, 0.95, 1100, 1.5, 6000, 6500, 1.2, 0, 0.1, 0, 400, 0.25, 0.4)      # instantaneous too close to the through-fault
_pc_vec(180, 1.1, 250, 0.95, 1100, 1.5, 6000, 0, 1.2, 1, 0.1, 0, 400, 0.25, 0.4)         # no instantaneous; very inverse downstream
_pc_vec(180, 1.1, 250, 0.95, 1100, 1.5, 6000, 7500, 1.2, 0, 0.1, 2, 400, 0.15, 0.4)      # extremely inverse upstream: margin lost
_pc_vec(180, 1.1, 250, 0.95, 400, 1.5, 6000, 0, 1.2, 0, 0.1, 0, 500, 0.25, 0.4)          # the minimum fault is below the upstream pick-up: no back-up check


# --- v1.98.9 work: power-supply-ripple (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms I / (fr C), Vs sqrt 2 and ripple / 2 sqrt 3: the capacitor is followed through one ripple period as a waveform.
# The peak is found from the RMS by integrating (A sin w t)^2 over a cycle (so no sqrt 2 is typed), the ripple frequency is the number of charging peaks per mains cycle counted
# on the rectified waveform (one for half-wave, two for full-wave), the capacitor voltage falls linearly from Vp with slope I / C over one ripple period (charge removed = I x T),
# the lowest and average voltage and the RMS ripple come from mpmath.quad over that period, the capacitor for a ripple target is found by bisection on the end-of-period voltage,
# and the regulator rejection is exp(-rr ln 10 / 20). Cases keep the ripple below 80% of the peak and the headroom at least 10 mV from zero.
import mpmath as _ps_m
_ps_m.mp.dps = 30
def _ps_calc(tp, Vs, f, Vd, I, C, dVt, Vo, Vdo, rr):
    m = _ps_m; Vs, f, Vd, I, C, dVt, Vo, Vdo, rr = [m.mpf(str(x)) for x in (Vs, f, Vd, I, C, dVt, Vo, Vdo, rr)]
    A = Vs / m.sqrt(m.quad(lambda x: m.sin(x) ** 2, [0, 2 * m.pi]) / (2 * m.pi))      # peak from the RMS of a sine
    N = 2000; pk = 0; samp = []
    for k in range(N + 2):
        x = 2 * m.pi * k / N
        s_ = m.sin(x); samp.append(abs(s_) if tp else max(s_, 0))
    for k in range(1, N + 1):
        if samp[k] > samp[k - 1] and samp[k] >= samp[k + 1]: pk += 1
    fr = f * pk
    nd = 2 if tp == 2 else 1
    Vp = A - nd * Vd; T = 1 / fr; sl = I / (C * m.mpf('1e-6'))                      # charge removed = I T, volts per second = I / C
    v = lambda t: Vp - sl * t
    Vmin = v(T); dV = v(0) - v(T)
    Vdc = m.quad(v, [0, T]) / T
    Vr = m.sqrt(m.quad(lambda t: (v(t) - Vdc) ** 2, [0, T]) / T)
    lo, hi = m.mpf('1e-9'), m.mpf(1)                                              # capacitor (F) holding the target: bisection on the end-of-period drop
    for _ in range(200):
        mid = (lo + hi) / 2
        if sl * mid * 0 + (I / mid) * T > dVt: lo = mid
        else: hi = mid
    out = dict(Vpk=A, Vp=Vp, fr=fr, dV=dV, Vmin=Vmin, Vdc=Vdc, Vr=Vr, rf=Vr / Vdc * 100, Cq=(lo + hi) / 2 * 1e6)
    if Vo > 0:
        out['head'] = Vmin - (Vo + Vdo); out['Vro'] = Vr * m.exp(-rr * m.log(10) / 20) * 1000
    return {k: float(x) for k, x in out.items()}
_psr = random.Random(20261301)
def _ps_vec(*a):
    keys = ['tp', 'Vs', 'f', 'Vd', 'I', 'C', 'dVt', 'Vo', 'Vdo', 'rr']
    add("power-supply-ripple", dict(zip(keys, a)), _ps_calc(*a), 1e-9)
def _ps_rand():
    while True:
        tp = _psr.randrange(3); Vs = _psr.choice([5, 6, 9, 12, 15, 18, 24, 30, 48]); f = _psr.choice([50, 60]); Vd = _psr.choice([0.3, 0.5, 0.7, 0.9, 1.1])
        I = _psr.choice([0.05, 0.1, 0.25, 0.5, 1, 2, 5]); C = _psr.choice([100, 220, 470, 1000, 2200, 4700, 10000, 22000]); dVt = _psr.choice([0.05, 0.1, 0.25, 0.5, 1, 2])
        Vo = _psr.choice([0, 0, 3.3, 5, 9, 12, 15, 24]); Vdo = _psr.choice([0.3, 0.6, 1.5, 2, 2.5]); rr = _psr.choice([0, 40, 55, 60, 70, 80])
        nd = 2 if tp == 2 else 1; fr = f * (1 if tp == 0 else 2)
        Vp = Vs * 2 ** 0.5 - nd * Vd; dV = I / (fr * C * 1e-6)
        if Vp <= 0 or dV > 0.8 * Vp: continue
        if Vo > 0 and abs(Vp - dV - (Vo + Vdo)) < 0.01: continue
        return _ps_vec(tp, Vs, f, Vd, I, C, dVt, Vo, Vdo, rr)
for _ in range(34): _ps_rand()
_ps_vec(2, 12, 50, 0.7, 0.5, 4700, 0.5, 12, 2, 60)      # the default and the guide's worked example (bridge, 12 V rms, 0.5 A, 4,700 µF)
_ps_vec(0, 12, 50, 0.7, 0.5, 4700, 0.5, 12, 2, 60)      # half-wave on the same data
_ps_vec(1, 15, 60, 0.7, 1, 10000, 0.5, 0, 2, 60)        # centre-tap, no regulator
_ps_vec(2, 9, 50, 1.0, 0.2, 22000, 0.1, 5, 1.5, 70)     # large capacitor, 5 V regulator
_ps_vec(2, 12, 50, 0.7, 1, 1000, 1, 0, 2, 60)           # heavy ripple (64% of the peak)
_ps_vec(2, 12, 50, 0.7, 0.5, 2200, 0.5, 12, 2, 60)      # headroom short of the dropout



# --- v1.99.0 work: semiconductor-loss (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms: the device is followed through one switching period as waveforms, in 30-digit mpmath.
# Each switching energy is the integral of v i dt over the transition (the voltage held at V while the current ramps up over tr, the current held at I while the voltage ramps up over tf),
# the data-sheet energies are scaled as an energy per volt-ampere at the test point, the Coss energy is the integral of C v dv from 0 to V and the recovery energy the integral of V dq over Qrr,
# the conduction loss is the on-state power integrated over the on-time D T and divided by T, and the junction temperature is found by fixed-point iteration of Tj = Ta + Rth (Pc(Tj) + other loss),
# where the engine solves the same equation in closed form; the highest frequency is found by bisection on the frequency at which the iterated junction temperature reaches the limit.
# Random cases keep the iteration convergent (Rth Ron I^2 D tc / 100 below 0.5), the margin to the limit above 0.5 C and the room for switching loss at least 2% of the allowed loss from zero.
# An expected zero (no Coss, no recovery) is left out because the comparison is relative.
import mpmath as _sl_m
_sl_m.mp.dps = 30
KEYS = ['V','I','D','fsw','Vo','Ron','tc','sw','tr','tf','Eon','Eoff','Vref','Iref','Qg','Vg','Coss','Qrr','Rth','Ta','Tjm']
def _sl_calc(V, I, D, fsw, Vo, Ron, tc, sw, tr, tf, Eon, Eoff, Vref, Iref, Qg, Vg, Coss, Qrr, Rth, Ta, Tjm):
    m = _sl_m
    V, I, D, Vo, Ron, tc, tr, tf, Eon, Eoff, Vref, Iref, Qg, Vg, Coss, Qrr, Rth, Ta, Tjm = [m.mpf(str(x)) for x in (V, I, D, Vo, Ron, tc, tr, tf, Eon, Eoff, Vref, Iref, Qg, Vg, Coss, Qrr, Rth, Ta, Tjm)]
    f = m.mpf(str(fsw)) * 1000                      # kHz in, Hz inside
    T = 1 / f
    # switching energy per edge, from the waveform: v i integrated over the transition
    if sw == 0:
        tr_s, tf_s = tr * m.mpf('1e-9'), tf * m.mpf('1e-9')
        e_on = m.quad(lambda t: V * (I * t / tr_s), [0, tr_s]) if tr_s > 0 else m.mpf(0)      # voltage held at V while the current ramps up
        e_off = m.quad(lambda t: (V * t / tf_s) * I, [0, tf_s]) if tf_s > 0 else m.mpf(0)     # current held at I while the voltage ramps up
    else:
        e_on = (Eon * m.mpf('1e-6') / (Vref * Iref)) * V * I                                   # energy per volt-ampere at the test point
        e_off = (Eoff * m.mpf('1e-6') / (Vref * Iref)) * V * I
    c = Coss * m.mpf('1e-12')
    e_oss = m.quad(lambda v: c * v, [0, V])                                                    # charging Coss to V: integral of C v dv
    e_rr = m.quad(lambda q: V, [0, Qrr * m.mpf('1e-9')])                                       # recovery charge moved against V: integral of V dq
    Etot = e_on + e_off + e_oss + e_rr
    P_other = Etot * f
    def Pc_at(Tj):                                                                             # average over one period of the on-state power
        r = Ron * m.mpf('1e-3') * (1 + tc / 100 * (Tj - 25))
        return m.quad(lambda t: Vo * I + r * I * I, [0, D * T]) / T
    Tj = Ta
    for _ in range(400):                                                                       # fixed point: Tj = Ta + Rth (Pc(Tj) + others)
        Tn = Ta + Rth * (Pc_at(Tj) + P_other)
        if abs(Tn - Tj) < m.mpf('1e-26'): Tj = Tn; break
        Tj = Tn
    Pc = Pc_at(Tj); Pd = Pc + P_other
    Pg = Qg * m.mpf('1e-9') * Vg * f
    out = dict(Rhot=Ron * (1 + tc / 100 * (Tj - 25)) * m.mpf('1e-3') * 1000, Pc=Pc, Eon=e_on * 1e6, Eoff=e_off * 1e6, Eoss=e_oss * 1e6, Err=e_rr * 1e6,
               Psw=(e_on + e_off) * f, Poss=e_oss * f, Prr=e_rr * f, Pg=Pg, Pd=Pd, Pt=Pd + Pg, Tj=Tj, marg=Tjm - Tj, Pdm=(Tjm - Ta) / Rth, sh=(Pd + Pg - Pc) / (Pd + Pg) * 100)
    # highest frequency: bisection on f so that the fixed-point junction temperature equals Tjm
    def Tj_at(ff):
        po = Etot * ff; t = Ta
        for _ in range(400):
            tn = Ta + Rth * (Pc_at_f(t, ff) + po)
            if abs(tn - t) < m.mpf('1e-26'): return tn
            t = tn
        return t
    def Pc_at_f(Tj_, ff):
        r = Ron * m.mpf('1e-3') * (1 + tc / 100 * (Tj_ - 25))
        return m.quad(lambda t: Vo * I + r * I * I, [0, D / ff]) * ff
    if Etot > 0:
        if Tj_at(m.mpf('1e-3')) < Tjm:
            lo, hi = m.mpf('1e-3'), m.mpf(1)
            while Tj_at(hi) < Tjm: hi *= 2
            for _ in range(120):
                mid = (lo + hi) / 2
                if Tj_at(mid) < Tjm: lo = mid
                else: hi = mid
            out['fmax'] = (lo + hi) / 2 / 1000
    return {k: float(x) for k, x in out.items()}

_slr = random.Random(20261401)
def _sl_vec(*a):
    out = {k: v for k, v in _sl_calc(*a).items() if v != 0}
    add("semiconductor-loss", dict(zip(KEYS, a)), out, 1e-9)
def _sl_rand():
    while True:
        kind = _slr.randrange(3)
        V = _slr.choice([12, 24, 48, 60, 100, 150, 400, 600, 800]); I = _slr.choice([1, 2, 5, 8, 10, 15, 20, 30, 50]); D = _slr.choice([0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9])
        fsw = _slr.choice([5, 10, 20, 50, 100, 200, 300, 500]); Rth = _slr.choice([1.5, 3, 6, 12, 25, 40, 60]); Ta = _slr.choice([-20, 25, 40, 55, 70, 85]); Tjm = _slr.choice([125, 150, 175])
        if kind == 0:     # MOSFET
            Vo = 0; Ron = _slr.choice([1, 2.5, 5, 10, 25, 60]); tc = _slr.choice([0, 0.3, 0.5, 0.7]); sw = _slr.choice([0, 0, 1])
            Qg = _slr.choice([10, 30, 80, 150]); Vg = _slr.choice([5, 10, 12]); Coss = _slr.choice([0, 100, 400, 1000]); Qrr = _slr.choice([0, 30, 100, 300])
        elif kind == 1:   # IGBT
            Vo = _slr.choice([0.6, 0.9, 1.2, 1.8]); Ron = _slr.choice([5, 12, 25, 60]); tc = 0; sw = 1
            Qg = _slr.choice([50, 150, 400]); Vg = _slr.choice([15, 18]); Coss = _slr.choice([0, 0, 150]); Qrr = _slr.choice([0, 0, 100])
        else:             # diode
            Vo = _slr.choice([0.3, 0.5, 0.8, 1.0]); Ron = _slr.choice([5, 20, 50, 100]); tc = _slr.choice([0, 0, 0.2]); sw = _slr.choice([0, 1])
            Qg = 0; Vg = 0; Coss = _slr.choice([0, 50]); Qrr = _slr.choice([20, 100, 500])
        tr = _slr.choice([0, 5, 15, 40, 90]); tf = _slr.choice([0, 8, 25, 60, 120])
        Eon = _slr.choice([20, 100, 400, 1500]); Eoff = _slr.choice([10, 60, 300, 1100]); Vref = _slr.choice([48, 400, 600]); Iref = _slr.choice([10, 20, 30, 50])
        a = (V, I, D, fsw, Vo, Ron, tc, sw, tr, tf, Eon, Eoff, Vref, Iref, Qg, Vg, Coss, Qrr, Rth, Ta, Tjm)
        b = Ron * 1e-3 * I * I * D
        if Rth * b * tc / 100 >= 0.5: continue
        if min(D, 1 - D) <= (tr + tf) * 1e-9 * fsw * 1e3 * 1.5 and sw == 0: pass
        r = _sl_calc(*a)
        if abs(r['marg']) < 0.5 or r['Tj'] < -60: continue
        Etot = (r['Eon'] + r['Eoff'] + r['Eoss'] + r['Err']) * 1e-6
        if Etot > 0:
            Pc_max = Vo * I * D + Ron * 1e-3 * (1 + tc / 100 * (Tjm - 25)) * I * I * D
            if abs((Tjm - Ta) / Rth - Pc_max) < 0.02 * (Tjm - Ta) / Rth: continue
        return _sl_vec(*a)
for _ in range(34): _sl_rand()
#           V   I   D    f   Vo   Ron  tc  sw  tr  tf  Eon  Eoff Vref Iref Qg  Vg Coss Qrr Rth Ta Tjm
_sl_vec(48, 10, 0.5, 100, 0, 10, 0, 0, 20, 20, 100, 60, 400, 10, 50, 10, 0, 0, 30, 40, 150)       # the default and the guide's worked example (1.51 W in all)
_sl_vec(100, 20, 0.4, 200, 0, 5, 0.6, 0, 15, 25, 100, 60, 400, 10, 80, 10, 400, 100, 6, 50, 150)   # MOSFET with a temperature coefficient, Coss and recovery
_sl_vec(600, 30, 0.5, 20, 1.0, 25, 0, 1, 0, 0, 1500, 1100, 400, 30, 150, 15, 0, 0, 1.2, 60, 150)  # IGBT from data-sheet energies, above the test voltage, over the limit
_sl_vec(400, 8, 0.5, 100, 0.8, 30, 0, 0, 0, 0, 100, 60, 400, 10, 0, 0, 0, 50, 10, 40, 150)        # diode: offset, slope resistance and recovery charge
_sl_vec(12, 5, 0.9, 50, 0, 20, 0, 0, 0, 0, 100, 60, 400, 10, 0, 10, 0, 0, 40, 25, 150)            # no switching energy: no highest frequency
_sl_vec(48, 40, 0.8, 100, 0, 30, 0, 0, 20, 20, 100, 60, 400, 10, 50, 10, 0, 0, 20, 80, 150)       # conduction loss alone over the limit: no highest frequency

# --- v1.99.1 work: resistivity-conductance (own stream, earlier vectors unchanged) ---
# Different route from the engine's R = rho L / A: the conductor is treated through its conductivity and conductance, in 30-digit mpmath.
# The conductivity at temperature is sigma20 / (1 + alpha (T - 20)) (the engine multiplies the resistivity instead), the conductance is G = sigma A / L and the resistance is 1 / G;
# a round wire's area is found from its circumference (A = C^2 / 4 pi with C = pi d); resistivity, length and area for a target resistance are each found by bisection on the conductance
# (G falls as 1 / L and rises with A, so there is one crossing), and the resistivity at 20 C is found as the root of rho20 (1 + alpha (T - 20)) = rhoT.
# 100% IACS is the conductivity of 0.017241 ohm mm2/m. The material constants are the textbook figures shared with the other conductor calculators.
import mpmath as _rc_m
_rc_m.mp.dps = 30
_RC_MAT = {1: ('1.7241e-8', '0.00393'), 2: ('2.8264e-8', '0.00403'), 3: ('1.59e-8', '0.0038'), 4: ('2.44e-8', '0.0034'), 5: ('6.99e-8', '0.006'), 6: ('1.10e-6', '0.0004')}
def _rc_calc(solve, mat, rhoC, aC, T, sh, L, A, d, R):
    m = _rc_m; mp = m.mpf
    rho20_in, alpha = (mp(str(rhoC)), mp(str(aC))) if mat == 7 else (mp(_RC_MAT[mat][0]), mp(_RC_MAT[mat][1]))
    T, L, A, d, R = mp(str(T)), mp(str(L)), mp(str(A)), mp(str(d)), mp(str(R))
    kT = 1 + alpha * (T - 20)
    if sh == 1:
        circ = m.pi * (d * mp('1e-3'))                       # circumference in m
        a_sec = circ * circ / (4 * m.pi)                     # area from the circumference
    else:
        a_sec = A * mp('1e-6')
    def G_of(sigma, length, area): return sigma * area / length
    def bis(f, lo, hi):                                      # f increasing; find f(x) = 0 by bisection
        for _ in range(400):
            mid = (lo + hi) / 2
            if f(mid) < 0: lo = mid
            else: hi = mid
        return (lo + hi) / 2
    if solve == 1:
        Gm = 1 / R
        rhoT = bis(lambda r: Gm - G_of(1 / r, L, a_sec), mp('1e-12'), mp('1e12'))   # larger rho -> smaller G, so Gm - G rises with rho
        rho20 = m.findroot(lambda x: x * kT - rhoT, rhoT)
        sigmaT = 1 / rhoT; length = L; area = a_sec
    else:
        rho20 = rho20_in
        sigma20 = 1 / rho20; sigmaT = sigma20 / kT; rhoT = 1 / sigmaT
        if solve == 0: length = L; area = a_sec
        elif solve == 2: area = a_sec; length = bis(lambda x: 1 / R - G_of(sigmaT, x, area), mp('1e-12'), mp('1e12'))
        else: length = L; area = bis(lambda x: G_of(sigmaT, length, x) - 1 / R, mp('1e-15'), mp('1e6'))
    G = G_of(sigmaT, length, area); Rr = 1 / G
    sigma_iacs = 1 / mp('0.017241e-6')
    return {"R": Rr, "G": G, "R20": (1 / (1 / rho20)) * length / area, "Rk": Rr / length * 1000, "rhoT": rhoT, "rho20": rho20, "rhoMm": rho20 * mp('1e6'),
            "sg": sigmaT / mp('1e6'), "iacs": (1 / rho20) / sigma_iacs * 100, "Lx": length, "Ax": area * mp('1e6'), "dx": 2 * m.sqrt(area / m.pi) * mp('1e3')}
def _rc_vec(solve, mat, rhoC, aC, T, sh, L, A, d, R):
    out = {k: float(v) for k, v in _rc_calc(solve, mat, rhoC, aC, T, sh, L, A, d, R).items()}
    add("resistivity-conductance", {"solve": solve, "mat": mat, "rhoC": rhoC, "aC": aC, "T": T, "sh": sh, "L": L, "A": A, "d": d, "Rm": R}, out, 1e-9)
_rcr = random.Random(20261117)
def _rc_rand():
    solve = _rcr.randrange(4); mat = _rcr.choice([1, 2, 3, 4, 5, 6, 1, 2, 7])
    rhoC = _rcr.choice([1e-8, 5e-8, 3.3e-7, 4.9e-7, 1.5e-6, 2.2e-5]); aC = _rcr.choice([0, 0.00002, 0.0001, 0.0039, 0.006])
    T = _rcr.choice([-40, -10, 0, 20, 20, 35, 55, 70, 90, 105, 150, 200]); sh = _rcr.choice([0, 0, 1])
    L = _rcr.choice([0.05, 0.5, 2, 12.5, 50, 100, 320, 1500, 4800]); A = _rcr.choice([0.01, 0.1, 0.5, 1.5, 2.5, 6, 16, 35, 95, 240, 630]); d = _rcr.choice([0.05, 0.2, 0.8, 1.38, 2.0, 4.5, 9.0, 25.0])
    R = _rcr.choice([0.0005, 0.0123, 0.1, 0.347, 1.0, 4.7, 52, 880, 12000])
    _rc_vec(solve, mat, rhoC, aC, T, sh, L, A, d, R)
for _ in range(34): _rc_rand()
#            solve mat rhoC   aC   T  sh  L    A    d    R
_rc_vec(0, 1, 1.7241e-8, 0, 20, 0, 100, 16, 4.5, 0.1)        # the default: 100 m of 16 mm2 copper
_rc_vec(0, 1, 1.7241e-8, 0, 70, 0, 100, 16, 4.5, 0.1)        # the same copper at 70 C
_rc_vec(0, 1, 1.7241e-8, 0, 20, 1, 100, 16, 2.0, 0.1)        # 2 mm round copper wire
_rc_vec(1, 1, 1.7241e-8, 0, 20, 0, 50, 2.5, 4.5, 0.3448)     # resistivity of a copper sample from a measurement
_rc_vec(2, 2, 1.7241e-8, 0, 20, 0, 100, 25, 4.5, 0.1)        # length of aluminium for 0.1 ohm
_rc_vec(3, 1, 1.7241e-8, 0, 20, 0, 200, 16, 4.5, 0.2)        # cross-section for 0.2 ohm over 200 m


# --- v1.99.2 work: three-phase-network (own stream, earlier vectors unchanged) ---
# Different route from the engine's Millman / delta-star solution: the loop (KVL) equations are written for the circuit as drawn and solved as a linear system in 30-digit mpmath.
# Four-wire star: Ek = Ik (Zk + Zl) + (Ia + Ib + Ic) Zn, three equations in the three line currents. Three-wire star: KVL a-b and b-c plus KCL (Ia + Ib + Ic = 0).
# Delta: three mesh equations in the branch currents Jab, Jbc, Jca, with the line currents from KCL at the corners (Ia = Jab - Jca, ...) and the line impedance in the loops.
# Powers are the sum of |J|^2 R and |J|^2 X in the load impedances, the supply power is the sum of E conj(I), and the unbalance figures are formed from the solved currents.
import mpmath as _tp_m
_tp_m.mp.dps = 30
_TPa = _tp_m.mpc(-0.5, _tp_m.sqrt(3) / 2); _TPa2 = _TPa * _TPa
def _tp_calc(conn, VL, Z, Zl, Zn):
    m = _tp_m; mpc, mpf = m.mpc, m.mpf
    E = mpf(str(VL)) / m.sqrt(3); Ea, Eb, Ec = mpc(E), E * _TPa2, E * _TPa
    Z = [mpc(str(r), str(x)) for r, x in Z]; Zl = mpc(str(Zl[0]), str(Zl[1])); Zn = mpc(str(Zn[0]), str(Zn[1]))
    if conn == 0:
        M = m.matrix(3, 3)
        for k in range(3):
            for j in range(3): M[k, j] = Zn
            M[k, k] += Z[k] + Zl
        I = list(m.lu_solve(M, m.matrix([Ea, Eb, Ec]))); J = I; In = I[0] + I[1] + I[2]
    elif conn == 1:
        M = m.matrix([[Z[0] + Zl, -(Z[1] + Zl), 0], [0, Z[1] + Zl, -(Z[2] + Zl)], [1, 1, 1]])
        I = list(m.lu_solve(M, m.matrix([Ea - Eb, Eb - Ec, 0]))); J = I; In = mpc(0)
    else:
        M = m.matrix(3, 3)
        M[0, 0] = 2 * Zl + Z[0]; M[0, 1] = -Zl; M[0, 2] = -Zl
        M[1, 1] = 2 * Zl + Z[1]; M[1, 0] = -Zl; M[1, 2] = -Zl
        M[2, 2] = 2 * Zl + Z[2]; M[2, 0] = -Zl; M[2, 1] = -Zl
        J = list(m.lu_solve(M, m.matrix([Ea - Eb, Eb - Ec, Ec - Ea]))); I = [J[0] - J[2], J[1] - J[0], J[2] - J[1]]; In = mpc(0)
    T = [Ea - I[0] * Zl, Eb - I[1] * Zl, Ec - I[2] * Zl]; VLL = [T[0] - T[1], T[1] - T[2], T[2] - T[0]]
    Vz = [(VLL[k] if conn == 2 else I[k] * Z[k]) for k in range(3)]
    Vn = Ea - I[0] * (Z[0] + Zl)
    Pk = [abs(J[k]) ** 2 * Z[k].real for k in range(3)]; Qk = [abs(J[k]) ** 2 * Z[k].imag for k in range(3)]
    P, Q = sum(Pk), sum(Qk); S = m.sqrt(P * P + Q * Q)
    Pl = sum(abs(c) ** 2 for c in I) * Zl.real + (abs(In) ** 2 * Zn.real if conn == 0 else 0)
    Ss = Ea * I[0].conjugate() + Eb * I[1].conjugate() + Ec * I[2].conjugate()
    Im = [abs(c) for c in I]; avg = sum(Im) / 3
    I1 = (I[0] + _TPa * I[1] + _TPa2 * I[2]) / 3; I2 = (I[0] + _TPa2 * I[1] + _TPa * I[2]) / 3
    Vm = [abs(c) for c in VLL]; Vavg = sum(Vm) / 3
    d = {"Ia": Im[0], "Ib": Im[1], "Ic": Im[2], "Aa": m.arg(I[0]) * 180 / m.pi, "Ab": m.arg(I[1]) * 180 / m.pi, "Ac": m.arg(I[2]) * 180 / m.pi,
         "Ja": abs(J[0]), "Jb": abs(J[1]), "Jc": abs(J[2]), "Va": abs(Vz[0]), "Vb": abs(Vz[1]), "Vc": abs(Vz[2]), "Vab": Vm[0], "Vbc": Vm[1], "Vca": Vm[2],
         "Pa": Pk[0] / 1000, "Pb": Pk[1] / 1000, "Pc": Pk[2] / 1000, "P": P / 1000, "Q": Q / 1000, "S": S / 1000, "pf": P / S, "Ploss": Pl / 1000,
         "Ps": Ss.real / 1000, "Qs": Ss.imag / 1000, "Ss": abs(Ss) / 1000, "pfs": Ss.real / abs(Ss),
         "unbI": max(abs(x - avg) for x in Im) / avg * 100, "i2i1": abs(I2) / abs(I1) * 100,
         "vunb": max(abs(x - Vavg) for x in Vm) / Vavg * 100, "vdrop": (mpf(str(VL)) - Vavg) / mpf(str(VL)) * 100}
    if conn == 0: d["In"] = abs(In)
    if conn != 2: d["Vn"] = abs(Vn)
    return d
def _tp_vec(conn, VL, Z, Zl=(0, 0), Zn=(0, 0)):
    d = _tp_calc(conn, VL, Z, Zl, Zn)
    out = {k: (0.0 if (k in ("In", "Vn", "unbI", "i2i1", "vunb", "vdrop") and abs(v) < _tp_m.mpf("1e-9")) else float(v)) for k, v in d.items()}
    inp = {"conn": conn, "VL": VL, "Ra": Z[0][0], "Xa": Z[0][1], "Rb": Z[1][0], "Xb": Z[1][1], "Rc": Z[2][0], "Xc": Z[2][1], "Rl": Zl[0], "Xl": Zl[1], "Rn": Zn[0], "Xn": Zn[1]}
    add("three-phase-network", inp, out, 1e-9)
_tpr = random.Random(20261118)
def _tp_rand():
    conn = _tpr.choice([0, 0, 1, 2, 2, 1]); VL = _tpr.choice([230, 400, 415, 690, 11000])
    Z = [(_tpr.choice([0.5, 2, 5, 8, 12.5, 30, 100]), _tpr.choice([-15, -4, 0, 3, 6, 10, 25, 60])) for _ in range(3)]
    Zl = (_tpr.choice([0, 0, 0.05, 0.2, 1]), _tpr.choice([0, 0, 0.1, 0.5])); Zn = _tpr.choice([(0, 0), (0, 0), (0.5, 0.2), (2, 1), (10, 0)]) if conn == 0 else (0, 0)
    _tp_vec(conn, VL, Z, Zl, Zn)
for _ in range(34): _tp_rand()
_tp_vec(0, 400, [(8, 6)] * 3)                                                      # the default: balanced star, solid neutral
_tp_vec(2, 400, [(8, 6)] * 3)                                                      # the same impedances in delta
_tp_vec(0, 400, [(10, 0), (5, 5), (8, -4)])                                        # unbalanced star on a solid neutral
_tp_vec(1, 400, [(10, 0), (5, 5), (8, -4)])                                        # the same with no neutral wire
_tp_vec(0, 400, [(10, 0), (5, 5), (8, -4)], (0.1, 0.05), (0.5, 0.2))              # lines and a neutral impedance
_tp_vec(2, 415, [(12, 5), (9, 0), (10, -3)], (0.2, 0.1))                           # unbalanced delta on lines

# --- v1.99.3 work: coupled-inductance (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms: the two coupled coils are treated as the circuit equations they come from, in 30-digit mpmath.
# With x = di/dt, v1 = L1 x1 + s M x2 and v2 = s M x1 + L2 x2 (s = +1 aiding, -1 opposing). Parallel: both coils across one voltage, so the 2 x 2 system is solved for x1 and x2
# and Lp = 1 / (x1 + x2); series: one current, v = (L1 + sM) x + (L2 + sM) x; with coil 2 shorted v2 = 0 gives x2 = -(sM / L2) x1, so L1 seen = L1 - M^2 / L2 (and the same the other way).
# The flux linkages are the inductance matrix times the currents and the stored energy is half the sum of linkage times current. For coils on one core L = mu0 mur Ac N^2 / lc is used directly
# (the engine goes through the reluctance) and the flux density comes from H = (N1 i1 + N2 i2) / lc. A perfect-coupling pair of equal coils makes the parallel system singular:
# aiding gives L (x1 + x2) = 1 so Lp = L, and opposing is a short circuit (Lp = 0); those two limits are written out, not solved.
import mpmath as _ci_m
_ci_m.mp.dps = 30
def _ci_calc(src, L1, L2, N1, N2, Ac, lc, mur, cpl, k, M, La, Lo, f, i1, i2, di):
    m = _ci_m; mp = m.mpf; MU0 = 4 * m.pi * mp('1e-7')
    L1, L2, M, La, Lo = [mp(str(x)) * mp('1e-3') for x in (L1, L2, M, La, Lo)]
    N1, N2, Ac, lc, mur, k, f, i1, i2, di = [mp(str(x)) for x in (N1, N2, Ac, lc, mur, k, f, i1, i2, di)]
    Ac *= mp('1e-4'); lc *= mp('1e-2')
    if src == 1:
        L1 = MU0 * mur * Ac * N1 ** 2 / lc; L2 = MU0 * mur * Ac * N2 ** 2 / lc
    Mv = k * m.sqrt(L1 * L2) if cpl == 0 else (M if cpl == 1 else (La - Lo) / 4)
    kv = Mv / m.sqrt(L1 * L2)
    def par(sg):
        A = m.matrix([[L1, sg * Mv], [sg * Mv, L2]])
        try:
            x = m.lu_solve(A, m.matrix([1, 1])); return 1 / (x[0] + x[1])
        except ZeroDivisionError:
            return L1 if sg == 1 else mp(0)
    ser = lambda sg: (L1 + sg * Mv) + (L2 + sg * Mv)
    lam1 = L1 * i1 + Mv * i2; lam2 = L2 * i2 + Mv * i1
    om = 2 * m.pi * f
    o = {"L1": L1 * 1000, "L2": L2 * 1000, "M": Mv * 1000, "k": kv, "a": m.sqrt(L1 / L2), "Lsa": ser(1) * 1000, "Lso": ser(-1) * 1000, "Lpa": par(1) * 1000, "Lpo": par(-1) * 1000,
         "Lsc1": (L1 - Mv ** 2 / L2) * 1000, "Lsc2": (L2 - Mv ** 2 / L1) * 1000, "Ta": (L1 - Mv) * 1000, "Tb": (L2 - Mv) * 1000, "lam1": lam1, "lam2": lam2,
         "W": (lam1 * i1 + lam2 * i2) / 2, "Wm": Mv * i1 * i2, "XL1": om * L1, "XL2": om * L2, "XM": om * Mv, "e1": L1 * di, "e2": Mv * di}
    if src == 1:
        o["Bc"] = abs(MU0 * mur * (N1 * i1 + N2 * i2) / lc); o["Rel"] = lc / (MU0 * mur * Ac)
    return {kk: (0.0 if abs(v) < 1e-20 else float(v)) for kk, v in o.items()}
def _ci_vec(src, L1, L2, N1, N2, Ac, lc, mur, cpl, k, M, La, Lo, f, i1, i2, di):
    out = _ci_calc(src, L1, L2, N1, N2, Ac, lc, mur, cpl, k, M, La, Lo, f, i1, i2, di)
    add("coupled-inductance", {"src": src, "L1": L1, "L2": L2, "N1": N1, "N2": N2, "Ac": Ac, "lc": lc, "mur": mur, "cpl": cpl, "k": k, "M": M, "La": La, "Lo": Lo, "f": f, "i1": i1, "i2": i2, "di1dt": di}, out, 1e-9)
_cir = random.Random(20261118)
def _ci_rand():
    src = _cir.randrange(2); cpl = _cir.randrange(3)
    L1 = round(math.exp(_cir.uniform(math.log(0.5), math.log(500))), 4); L2 = round(math.exp(_cir.uniform(math.log(0.5), math.log(500))), 4)
    N1 = _cir.randrange(20, 2001); N2 = _cir.randrange(20, 2001); Ac = round(_cir.uniform(1, 20), 3); lc = round(_cir.uniform(10, 80), 2)
    mur = _cir.choice([1, 100, 800, 2000, 5000, 350.5])
    f = _cir.choice([50, 60, 400, 1000, 20000]); i1 = round(_cir.uniform(-3, 3), 4) or 1.0; i2 = round(_cir.uniform(-3, 3), 4); di = round(_cir.uniform(-500, 500), 3)
    mu0 = 4 * math.pi * 1e-7
    if src == 1: l1 = mu0 * mur * Ac * 1e-4 * N1 ** 2 / (lc * 1e-2) * 1e3; l2 = mu0 * mur * Ac * 1e-4 * N2 ** 2 / (lc * 1e-2) * 1e3
    else: l1, l2 = L1, L2
    g = math.sqrt(l1 * l2)                         # in mH
    u = _cir.uniform(0.02, 0.995)
    k = round(u, 4); M = round(u * g, 6) if cpl == 1 else 45; La, Lo = 215, 35          # an unused input still has to be in range, so it keeps the default
    if cpl == 2:
        Ls = l1 + l2; Mx = u * g
        La = round((Ls + 2 * Mx) * _cir.uniform(0.97, 1.03), 6); Lo = round((Ls - 2 * Mx) * _cir.uniform(0.97, 1.03), 6)
        if La < Lo or (La - Lo) / 4 > 0.999 * g or Lo <= 0: La, Lo = round(Ls + 2 * Mx, 6), round(Ls - 2 * Mx, 6)
        if (La - Lo) / 4 > 0.999 * g or Lo <= 0: La, Lo = round(Ls + 2 * 0.5 * g, 6), round(Ls - 2 * 0.5 * g, 6)
    if cpl == 1 and M > 0.999 * g: M = round(0.5 * g, 6)
    _ci_vec(src, L1, L2, N1, N2, Ac, lc, mur, cpl, k, M, La, Lo, f, i1, i2, di)
for _ in range(34): _ci_rand()
_ci_vec(0, 100, 25, 500, 250, 4, 30, 2000, 0, 0.9, 45, 215, 35, 50, 2, 1, 100)                    # default: L1 100 mH, L2 25 mH, k 0.9
_ci_vec(1, 100, 25, 500, 250, 4, 30, 2000, 0, 0.95, 45, 215, 35, 50, 0.01, 0.005, 100)             # two coils on one core, small currents
_ci_vec(0, 50, 50, 500, 250, 4, 30, 2000, 0, 1, 50, 215, 35, 50, 2, 1, 100)                        # perfect coupling of equal coils: parallel aiding limit and opposing short
_ci_vec(0, 100, 25, 500, 250, 4, 30, 2000, 0, 0, 45, 215, 35, 50, 2, 1, 100)                       # no coupling
_ci_vec(0, 10, 40, 500, 250, 4, 30, 2000, 2, 0.9, 45, 130, 70, 60, 3, -1, -50)                     # series readings (M 15 mH, k 0.75), opposing coil 2 current, falling di/dt
_ci_vec(1, 100, 25, 200, 100, 3, 15, 1, 1, 0.9, 0.03, 215, 35, 1000, 1, 0.5, 2000)                 # air-core coils on one former (0.1005 and 0.0251 mH), mutual inductance entered 0.03 mH

# --- v1.99.4 work: motor-nameplate (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms, in 30-digit mpmath. The slip comes from the electrical side: the rotor current frequency is the supply frequency
# less the frequency of the shaft speed against the pole pairs, fr = f - (p / 2) (N / 60), and s = fr / f; the synchronous speed is 60 f / (p / 2). The torque is the
# output over 2 pi times the speed in revolutions per second. The input power is the output plus the loss P (1 - eta) / eta. The current from the ratings is found
# per phase from the delta winding (the winding carries Pin / 3 at the line voltage) and then the line current is the difference of two winding-current phasors,
# |Iab - Ica| = 2 Iw sin(60 deg); the star and delta winding quantities are taken from the line quantity the same way (a star winding voltage is the line voltage over
# 2 sin(60 deg)). The reactive power is the S sqrt(1 - pf^2) form, and the current at another supply keeps the apparent power: In V = Is Vs.
import mpmath as _np_m
_np_m.mp.dps = 30
def _np_calc(P, V, f, p, N, In, pf, eta, SF, klr, conn, Vs, fs, Im):
    m = _np_m; mp = m.mpf
    P, V, f, p, N, In, pf, eta, SF, klr, Vs, fs, Im = [mp(str(x)) for x in (P, V, f, p, N, In, pf, eta, SF, klr, Vs, fs, Im)]
    P *= 1000; eta /= 100
    s60 = 2 * m.sin(m.pi / 3)                              # sqrt 3, as the chord of two phasors 120 degrees apart
    pairs = p / 2; Ns = 60 * f / pairs; fr = f - pairs * (N / 60); slip = fr / f
    n = N / 60; T = P / (2 * m.pi * n)
    loss = P * (1 - eta) / eta; Pin = P + loss
    Iw_d = (Pin / 3) / (V * pf); Ical = s60 * Iw_d          # delta winding at the line voltage; line current = 2 Iw sin 60
    S = s60 * V * In; Q = S * m.sqrt(1 - pf ** 2)
    etaI = P / (s60 * V * In * pf) * 100
    Vw = V if conn == 0 else V / s60; Iw = In / s60 if conn == 0 else In
    Ilr = klr * In; Pmax = SF * P
    o = {"Ns": Ns, "slip": slip * 100, "Nsl": Ns - N, "fr": fr, "T": T, "Pin": Pin / 1000, "Ploss": loss / 1000, "S": S / 1000, "Q": Q / 1000, "Ical": Ical,
         "Idiff": (In - Ical) / Ical * 100, "etaI": etaI, "Vw": Vw, "Iw": Iw, "Ilr": Ilr, "Pmax": Pmax / 1000, "Tsf": Pmax / (2 * m.pi * n),
         "Vdev": (Vs / V - 1) * 100, "fdev": (fs / f - 1) * 100, "vf": (Vs / V) / (fs / f) * 100, "Ns2": 60 * fs / pairs, "Iat": S / (s60 * Vs)}
    if Im > 0: o["load"] = Im / In * 100
    return {k: (float(v) if abs(v) > _np_m.mpf("1e-12") else None) for k, v in o.items()}
def _np_vec(P, V, f, p, N, In, pf, eta, SF, klr, conn, Vs, fs, Im):
    o = {k: v for k, v in _np_calc(P, V, f, p, N, In, pf, eta, SF, klr, conn, Vs, fs, Im).items() if v is not None}
    add("motor-nameplate", {"P": P, "V": V, "f": f, "poles": p, "N": N, "In": In, "pf": pf, "eta": eta, "SF": SF, "klr": klr, "conn": conn, "Vs": Vs, "fs": fs, "Im": Im}, o, 1e-9)
_npr = random.Random(20261119)
def _np_rand():
    P = _npr.choice([0.37, 0.75, 1.5, 2.2, 5.5, 7.5, 11, 15, 22, 37, 55, 75, 110, 160, 250, 315, 132.5])
    V = _npr.choice([230, 380, 400, 415, 440, 460, 575, 690, 3300, 6600]); f = _npr.choice([50, 60, 50, 60, 16.7, 400])
    p = _npr.choice([2, 4, 4, 6, 8, 10, 12, 16]); pf = round(_npr.uniform(0.5, 0.95), 3); eta = round(_npr.uniform(60, 97.5), 2)
    Ns = 120 * f / p; N = round(Ns * (1 - _npr.uniform(0.005, 0.08)), 2)
    In = round(P * 1000 / (3 ** 0.5 * V * pf * eta / 100) * _npr.uniform(0.96, 1.04), 4)
    SF = _npr.choice([1, 1, 1.1, 1.15, 1.25, 1.5]); klr = round(_npr.uniform(3.5, 9.5), 2); conn = _npr.randrange(2)
    Vs = round(V * _npr.choice([0.85, 0.9, 0.95, 1.05, 1.1, 1.15, 1.7320508075688772]), 2); fs = _npr.choice([f, f, f * 0.8, f * 1.05, f * 1.2]); fs = round(fs, 3)
    Im = 0 if _npr.random() < 0.4 else round(In * _npr.uniform(0.15, 1.3), 3)
    _np_vec(P, V, f, p, N, In, pf, eta, SF, klr, conn, Vs, fs, Im)
for _ in range(34): _np_rand()
_np_vec(15, 415, 50, 4, 1460, 27.3, 0.85, 90, 1, 7, 0, 400, 50, 0)                    # the default
_np_vec(15, 415, 50, 4, 1460, 27.3, 0.85, 90, 1.15, 7, 1, 380, 50, 29)               # star winding, service factor 1.15, low supply, measured current
_np_vec(0.75, 230, 60, 2, 3450, 3.2, 0.8, 78, 1.25, 6.5, 0, 230, 60, 1.1)           # small two-pole 60 Hz motor, light load
_np_vec(250, 6600, 50, 6, 985, 28.8, 0.88, 95.5, 1, 6, 1, 7000, 50, 28)             # high-voltage motor, star winding
_np_vec(11, 400, 50, 4, 1455, 21, 0.84, 89, 1, 7.5, 0, 460, 60, 0)                  # a 400 V motor on a 460 V 60 Hz supply (volts per hertz 100%)
_np_vec(5.5, 400, 50, 4, 1440, 11.4, 0.82, 86, 1.15, 7, 0, 400, 62, 0)              # frequency 24% high

# --- v1.99.5 work: motor-selection-load (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms, in exact fractions and 30-digit mpmath. The load torque is found at the load shaft (Pl over 2 pi times the load speed in
# revolutions per second) and carried to the motor shaft through the drive as a torque transformation (divided by the speed ratio and the efficiency), where the engine
# divides the power by the efficiency first and then by the motor speed; the rated torque of the chosen size is the load torque at the motor shaft scaled by the ratio of
# the two powers. The size is chosen by an exact scan of the preferred-rating list (IEC 60072) for the first rating that covers the need (cross-multiplied, no rounding),
# the loadings and the spare power are exact fractions. The voltage dependence is the ratio of the two voltages squared. The acceleration time comes from energy: the
# kinetic energy 1/2 J w^2 divided by the mean power of a constant accelerating torque, T w / 2, where the engine uses J w / T. The current is taken from the complex
# power (S = P / cos(phi), I = S / (2 sin(60 deg) V), Q = sqrt(S^2 - P^2)).
import mpmath as _ms_m
from fractions import Fraction as _ms_F
_ms_m.mp.dps = 30
_ms_STD = [_ms_F(str(x)) for x in (0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000)]
def _ms_calc(Pl, gr, etat, mg, der, N, Tlr, Tav, Tbd, Vst, Vrun, bk, ld, pk, tm, Jl, Jm, V, eta, pf):
    m = _ms_m; F = lambda x: _ms_F(str(x)); mp = lambda fr: m.mpf(fr.numerator) / m.mpf(fr.denominator)
    Pl, gr, etat, mg, der, Tlr, Tav, Tbd, Vst, Vrun, bk, ld, pk, Jl, Jm, eta, pf = [F(x) for x in (Pl, gr, etat, mg, der, Tlr, Tav, Tbd, Vst, Vrun, bk, ld, pk, Jl, Jm, eta, pf)]
    Nf = F(N); Vf = F(V)
    Pm = Pl / (etat / 100); Pdes = Pm * (1 + mg / 100); Preq = Pdes / der
    k = next((j for j, s in enumerate(_ms_STD) if s >= Preq), None)
    if k is None: return None
    Psel = _ms_STD[k]; Plow = _ms_STD[k - 1] if k > 0 else None
    o = {"Pshaft": Pm, "Pdes": Pdes, "Preq": Preq, "Psel": Psel, "load": Pm / Psel * 100, "loadd": Pm / (Psel * der) * 100, "spare": Psel * der - Pm}
    if Plow is not None: o["Plow"] = Plow; o["loadlow"] = Pm / (Plow * der) * 100
    o = {kk: mp(v) for kk, v in o.items()}
    two_pi = 2 * m.pi
    Nl = mp(Nf / gr); Tl = mp(Pl) * 1000 / (two_pi * (Nl / 60))
    Tmr = Tl / (mp(gr) * mp(etat) / 100)                     # torque transformation through the drive
    Tn = Tmr * mp(Psel / Pm)
    vs2 = mp((Vst / 100) ** 2); vr2 = mp((Vrun / 100) ** 2)
    Tst = mp(Tlr) * Tn * vs2; Tpk = mp(pk) * Tmr; Tbdv = mp(Tbd) * Tn * vr2
    o.update({"Nl": Nl, "Tl": Tl, "Tmr": Tmr, "Tn": Tn, "Tst": Tst, "Tpk": Tpk, "Tbdv": Tbdv, "rbd": Tbdv / Tpk})
    if bk > 0:
        Tbrk = mp(bk) / 100 * Tmr; o["Tbrk"] = Tbrk; o["rst"] = Tst / Tbrk
    Jt = mp(Jm) + mp(Jl) / mp(gr * gr)
    Tacc = mp(Tav) * Tn * vs2 - mp(ld) / 100 * Tmr
    if Jt > 0:
        o["Jt"] = Jt; o["Tacc"] = Tacc
        if Tacc > 0:
            w = two_pi * mp(Nf) / 60
            o["tacc"] = (Jt * w * w / 2) / (Tacc * w / 2)       # kinetic energy over the mean power of a constant torque
    Pin = mp(Pm / (eta / 100)); S = Pin / mp(pf); I = S * 1000 / (2 * m.sin(m.pi / 3) * mp(Vf))
    o.update({"Pin": Pin, "Iop": I, "Q": m.sqrt(S * S - Pin * Pin)})
    # the engine reports power in kW (the input is in kW), so the figures built above are in kW; torque in N m, current in A
    return {kk: (float(v) if abs(v) > m.mpf("1e-12") else None) for kk, v in o.items()}
def _ms_vec(*a):
    o = _ms_calc(*a)
    assert o is not None
    o = {k: v for k, v in o.items() if v is not None}
    names = ("Pl", "gr", "etat", "mg", "der", "N", "Tlr", "Tav", "Tbd", "Vst", "Vrun", "bk", "ld", "pk", "tm", "Jl", "Jm", "V", "eta", "pf")
    add("motor-selection-load", dict(zip(names, a)), o, 1e-9)
_msr = random.Random(20261120)
def _ms_rand():
    while True:
        Pl = round(math.exp(_msr.uniform(math.log(0.15), math.log(800))), 3)
        gr = _msr.choice([1, 1, 1, 1.5, 2, 3.5, 6, 10]); etat = round(_msr.uniform(88, 100), 1); mg = _msr.choice([0, 5, 10, 15, 20, 30])
        der = _msr.choice([1, 1, 0.95, 0.9, 0.85, 0.8]); N = _msr.choice([740, 960, 1450, 1470, 1485, 2900, 2950, 985, 3560])
        Tlr = round(_msr.uniform(1.2, 3), 2); Tav = round(_msr.uniform(1.2, 2.2), 2); Tbd = round(_msr.uniform(1.6, 3), 2)
        Vst = _msr.choice([70, 75, 80, 85, 90, 95, 100]); Vrun = _msr.choice([90, 95, 100, 105, 110])
        bk = 0 if _msr.random() < 0.15 else round(_msr.uniform(15, 150), 1); ld = round(_msr.uniform(15, 120), 1); pk = round(_msr.uniform(1, 2), 2)
        tm = _msr.choice([0, 10, 25, 25, 40]); Jl = 0 if _msr.random() < 0.1 else round(_msr.uniform(0.05, 60), 3); Jm = 0 if (_msr.random() < 0.1 and Jl == 0) else round(_msr.uniform(0.01, 3), 3)
        V = _msr.choice([230, 400, 415, 440, 690, 3300, 6600]); eta = round(_msr.uniform(70, 97), 1); pf = round(_msr.uniform(0.5, 0.92), 2)
        a = (Pl, gr, etat, mg, der, N, Tlr, Tav, Tbd, Vst, Vrun, bk, ld, pk, tm, Jl, Jm, V, eta, pf)
        # keep the choice of size away from a list edge, and the time to speed defined
        F = lambda x: _ms_F(str(x)); Preq = F(Pl) / (F(etat) / 100) * (1 + F(mg) / 100) / F(der)
        if Preq > 1000: continue
        if any(abs(Preq - s) / s < _ms_F(1, 1000) for s in _ms_STD): continue
        o = _ms_calc(*a)
        if o is None or "Tacc" in o and o.get("Tacc") is not None and o["Tacc"] <= 0: continue
        _ms_vec(*a); return
for _ in range(34): _ms_rand()
_ms_vec(18, 1, 98, 10, 1, 1470, 2, 1.6, 2.2, 90, 100, 40, 33, 1.2, 25, 1.5, 0.3, 415, 91, 0.84)        # the default: 22 kW, loaded to 83.5 per cent
_ms_vec(75, 4.5, 96, 20, 0.9, 1485, 1.8, 1.5, 2.0, 85, 100, 150, 100, 1.5, 25, 40, 1.2, 415, 94, 0.86)  # a gearbox conveyor with a high breakaway torque (starting ratio below the margin)
_ms_vec(0.37, 1, 100, 0, 1, 2800, 2.2, 1.7, 2.4, 100, 100, 0, 50, 1, 0, 0.002, 0.0004, 230, 66, 0.7)    # smallest sizes, no breakaway torque entered
_ms_vec(11, 1, 98, 10, 1, 1450, 1.6, 1.3, 1.8, 70, 95, 50, 40, 1.3, 25, 5, 0.5, 400, 89, 0.82)        # a 70 per cent start voltage
_ms_vec(250, 1, 98, 10, 0.85, 985, 2.0, 1.6, 2.2, 90, 100, 60, 33, 1.1, 25, 200, 20, 6600, 95, 0.88)   # a high-voltage motor with a large inertia
_ms_vec(3.2, 2, 97, 5, 1, 2900, 2.4, 1.9, 2.6, 100, 100, 30, 33, 1, 25, 0, 0.004, 400, 82, 0.8)        # motor inertia only

# --- v1.99.6 work: protective-device-selection (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms, in exact fractions. The engine first forms the cable limit Imax = min(Iz, 1.45 Iz / k2) and then takes the largest rating
# at or below it. Here every standard rating is tested against each condition on its own (rating <= Iz, and k2 x rating <= 1.45 x Iz, by cross-multiplication) and the
# ratings that pass both are collected; the rating that carries the load is the first one in the list at or above Ib, and it "fits" if it is in the collected set. The
# breaking capacity step is found by an exact scan of the kA list; the trip, let-through and withstand figures are exact products. Checks not met are counted from the
# individual yes/no tests.
from fractions import Fraction as _pd_F
_pd_LISTS = {1: [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125], 2: [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600],
             3: [630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300], 4: [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250]}
_pd_KA = [_pd_F(str(x)) for x in (3, 4.5, 6, 10, 15, 20, 25, 36, 50, 65, 70, 85, 100, 150)]
def _pd_calc(dev, Ib, Iz, k2, Isc, Icu, Imin, m, I2t, S, ks):
    F = lambda x: _pd_F(str(x)); Ib, Iz, k2, Isc, Icu, Imin, m, I2t, S, ks = [F(x) for x in (Ib, Iz, k2, Isc, Icu, Imin, m, I2t, S, ks)]
    R = [F(r) for r in _pd_LISTS[dev]]
    cable_ok = [r for r in R if r <= Iz and k2 * r <= F("1.45") * Iz]            # each condition tested on its own
    In = next(r for r in R if r >= Ib)
    fits = In in cable_ok
    o = {"Imax": min(Iz, F("1.45") * Iz / k2), "Insel": In, "load": Ib / In * 100, "I2": k2 * In, "r2": k2 * In / Iz}
    if cable_ok: o["Ilarg"] = cable_ok[-1]
    kk = next((k for k in _pd_KA if k >= Isc), None)
    if kk is not None: o["Icun"] = kk
    o["rcu"] = Icu / Isc
    fails = (0 if fits else 1) + (0 if Icu >= Isc else 1)
    if dev != 4 and Imin > 0:
        o["Itrip"] = m * In; o["rtr"] = Imin / (m * In); fails += 0 if Imin >= m * In else 1
    if I2t > 0 and S > 0 and ks > 0:
        W = ks * ks * S * S; o["Wc"] = W; o["rw"] = W / I2t; fails += 0 if I2t <= W else 1
    o["chk"] = fails
    return {key: float(v) for key, v in o.items()}
def _pd_vec(*a):
    o = _pd_calc(*a)
    names = ("dev", "Ib", "Iz", "k2", "Isc", "Icu", "Imin", "m", "I2t", "S", "ks")
    add("protective-device-selection", dict(zip(names, a)), o, 1e-9)
_pdr = random.Random(20261121)
def _pd_near(a, b): return abs(a - b) <= _pd_F(1, 100000) * max(abs(a), abs(b))
def _pd_rand():
    while True:
        dev = _pdr.choice([1, 1, 2, 2, 2, 3, 4, 4]); R = _pd_LISTS[dev]
        Ib = round(math.exp(_pdr.uniform(math.log(R[0] * 0.8), math.log(R[-1] * 0.95))), 1)
        Iz = round(Ib * _pdr.uniform(0.92, 1.7), 1); k2 = _pdr.choice([1.13, 1.3, 1.45, 1.6, 2.1, round(_pdr.uniform(1.05, 2.5), 2)])
        Isc = round(math.exp(_pdr.uniform(math.log(1.2), math.log(140))), 2); Icu = _pdr.choice([6, 10, 15, 25, 36, 50, 70, 100])
        Imin = 0 if _pdr.random() < 0.2 else round(_pdr.uniform(60, 25000), 0); m = _pdr.choice([3, 5, 8, 10, 12, 20, 4.5])
        I2t = 0 if _pdr.random() < 0.15 else round(math.exp(_pdr.uniform(math.log(2e3), math.log(3e7))), 0)
        S = _pdr.choice([1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]); ks = _pdr.choice([76, 115, 143, 94, 103])
        a = (dev, Ib, Iz, k2, Isc, Icu, Imin, m, I2t, S, ks)
        F = lambda x: _pd_F(str(x)); fIb, fIz, fk2 = F(Ib), F(Iz), F(k2)
        if Ib > R[-1]: continue
        if any(_pd_near(F(r), fIb) or _pd_near(F(r), fIz) or _pd_near(fk2 * F(r), F("1.45") * fIz) for r in R): continue
        if any(_pd_near(k * 1000, F(Isc) * 1000) for k in _pd_KA) or _pd_near(F(Isc), F(Icu)): continue
        In = next(r for r in R if F(r) >= fIb)
        if Imin > 0 and _pd_near(F(Imin), F(m) * F(In)): continue
        if I2t > 0 and _pd_near(F(I2t), F(ks) * F(ks) * F(S) * F(S)): continue
        _pd_vec(*a); return
for _ in range(36): _pd_rand()
_pd_vec(2, 85, 105, 1.3, 12, 25, 1800, 10, 400000, 25, 115)       # the default: 100 A moulded-case, all checks met
_pd_vec(1, 32, 36, 1.45, 6, 6, 250, 10, 0, 6, 115)                 # miniature circuit-breaker, type C, no let-through entered
_pd_vec(4, 100, 125, 1.6, 20, 50, 0, 10, 600000, 25, 115)          # gG fuse: 1.6 / 1.45 limit holds the rating to 90 per cent of Iz
_pd_vec(3, 1500, 1800, 1.3, 60, 50, 9000, 10, 0, 300, 143)         # air circuit-breaker, breaking capacity below the fault
_pd_vec(2, 90, 92, 1.3, 15, 25, 700, 10, 20000000, 16, 115)        # cable too small for the next rating, trip and withstand not met
_pd_vec(2, 63, 63, 1.3, 10, 25, 0, 10, 0, 0, 0)                    # Ib = In = Iz exactly, no optional checks

# --- v1.99.7 work: measurement-uncertainty (own stream, earlier vectors unchanged) ---
# Different route from the engine's closed forms, in 30-digit mpmath and scipy. Each Type B source is given its probability density and its standard uncertainty is the
# square root of the integral of x^2 f(x) dx (rectangular on -a..a, triangular (a - |x|) / a^2, arcsine 1 / (pi sqrt(a^2 - x^2)), a resolution step a rectangle on -d/2..d/2, a
# certificate figure U / 2), where the engine divides the limit by sqrt 3, sqrt 6, sqrt 2 or 2 sqrt 3. The variances are summed (mpmath fsum) before any root is taken, the shares are
# the variances over their sum, the effective degrees of freedom come from the Welch-Satterthwaite sum and are truncated with floor, and the coverage factor is scipy.stats.t.ppf (95% or
# 99% two-sided) where the engine finds it by an incomplete beta function and bisection; one million degrees of freedom or more is the normal quantile.
import mpmath as _mu_mp
from scipy import stats as _mu_st
_mu_mp.mp.dps = 30
def _mu_var(ty, a):
    a = _mu_mp.mpf(str(a))
    if a == 0: return _mu_mp.mpf(0)
    if ty == 1: return a * a
    if ty == 2: return _mu_mp.quad(lambda x: x * x / (2 * a), [-a, 0, a])
    if ty == 3: return _mu_mp.quad(lambda x: x * x * (a - abs(x)) / (a * a), [-a, 0, a])
    if ty == 4: return (a / 2) ** 2
    if ty == 5:
        h = a / 2
        return _mu_mp.quad(lambda x: x * x / (2 * h), [-h, 0, h])
    return _mu_mp.quad(lambda x: x * x / (_mu_mp.pi * _mu_mp.sqrt(a * a - x * x)), [-a, 0, a])
def _mu_calc(i):
    n = int(i["n"]); s = _mu_mp.mpf(str(i["s"]))
    v0 = s * s / n if s > 0 else _mu_mp.mpf(0)
    vs = [v0] + [_mu_var(i["ty%d" % k], i["a%d" % k]) * _mu_mp.mpf(str(i["c%d" % k])) ** 2 for k in range(1, 5)]
    tot = _mu_mp.fsum(vs); uc = _mu_mp.sqrt(tot)
    o = {"uA": _mu_mp.sqrt(vs[0])}
    for k in range(1, 5): o["q%d" % k] = _mu_mp.sqrt(vs[k])
    for k in range(5): o["p%d" % k] = 100 * vs[k] / tot
    o["uc"] = uc; o["dom"] = vs.index(max(vs))
    nu = tot ** 2 / (v0 ** 2 / (n - 1)) if s > 0 else None
    nint = int(_mu_mp.floor(nu * (1 + _mu_mp.mpf(10) ** -12))) if nu is not None else None
    inf = nu is None or nint >= 10 ** 6
    cov = i["cov"]
    if cov == 1: k = _mu_mp.mpf(2)
    elif cov == 2: k = _mu_mp.mpf(3)
    else:
        p = 0.975 if cov == 3 else 0.995
        k = _mu_mp.mpf(_mu_st.norm.ppf(p)) if inf else _mu_mp.mpf(float(_mu_st.t.ppf(p, nint)))
    if not inf: o["nu"] = nu
    o["k"] = k; o["U"] = k * uc
    x = _mu_mp.mpf(str(i["x"]))
    if x != 0: o["Urel"] = abs(k * uc / x) * 100
    o["lo"] = x - k * uc; o["hi"] = x + k * uc
    if i["T"] > 0: o["tur"] = _mu_mp.mpf(str(i["T"])) / (k * uc)
    return nu, {key: float(v) for key, v in o.items() if v != 0}
_mu_names = ("x", "s", "n", "ty1", "a1", "c1", "ty2", "a2", "c2", "ty3", "a3", "c3", "ty4", "a4", "c4", "cov", "T")
def _mu_vec(*a):
    i = dict(zip(_mu_names, a)); nu, o = _mu_calc(i)
    add("measurement-uncertainty", i, o, 1e-9)
    return nu
_mur = random.Random(20261122)
def _mu_ok(nu):
    if nu is None: return True
    fr = float(nu - _mu_mp.floor(nu))
    return 1e-4 < fr < 1 - 1e-4 and not (9e5 < float(nu) < 1.1e6)
def _mu_rand():
    r = _mur
    while True:
        x = round(r.choice([0, 1, 1, 1]) * r.uniform(0.5, 500), 3)
        n = r.choice([2, 3, 4, 5, 8, 10, 12, 20, 30, 50]); s = 0 if r.random() < 0.25 else round(r.uniform(0.001, 0.05) * max(abs(x), 1), 4)
        a = []
        for k in range(4):
            ty = r.randint(1, 6); v = 0 if r.random() < 0.15 else round(r.uniform(0.0005, 0.04) * max(abs(x), 1), 5)
            c = r.choice([1, 1, 1, 0.02, -2, 0.5, 3, 0.1, 0])
            a += [ty, v, c]
        T = 0 if r.random() < 0.2 else round(r.uniform(0.01, 0.3) * max(abs(x), 1), 3)
        args = [x, s, n] + a + [r.randint(1, 4), T]
        i = dict(zip(_mu_names, args))
        if s == 0 and not any(i["a%d" % k] > 0 and i["c%d" % k] != 0 for k in range(1, 5)): continue
        if s == 0: args[2] = 1
        i = dict(zip(_mu_names, args)); nu, o = _mu_calc(i)
        if _mu_ok(nu): return args
for _ in range(36): _mu_vec(*_mu_rand())
_mu_vec(230.4, 0.3, 10, 4, 0.35, 1, 2, 0.6, 1, 5, 0.1, 1, 2, 5, 0.02, 3, 10)      # the calculator default
_mu_vec(12.5, 0.4, 3, 4, 0.02, 1, 2, 0, 1, 5, 0.01, 1, 2, 0, 1, 3, 0)             # three readings, 95 per cent t factor
_mu_vec(50, 0.2, 5, 1, 0, 1, 2, 0.05, 1, 5, 0, 1, 2, 0, 1, 4, 0)                  # five readings, 99 per cent t factor
_mu_vec(100, 0, 1, 2, 0.5, 1, 3, 0.3, 1, 6, 0.2, 1, 1, 0.1, 1, 3, 2)              # Type B only, infinite degrees of freedom
_mu_vec(0, 0.02, 25, 5, 0.01, 1, 2, 0.05, 1, 4, 0.04, 1, 2, 2, 0.01, 2, 0)        # zero reading, k = 3
_mu_vec(1000, 0.5, 2, 1, 0.2, 1, 2, 3, -2, 5, 1, 1, 2, 0, 1, 1, 50)               # two readings, k = 2, negative coefficient

# --- v1.99.8 work: pv-performance-ratio (own stream, earlier vectors unchanged) ---
# A different route from the engine's closed forms, in 30-digit mpmath. The energy and irradiation are taken in Wh and Wh/m2 and the array in W, so the yields are Wh per Wp and
# hours at the 1000 W/m2 standard irradiance (the engine works in kWh and kW); the temperature step is the module's derated power over its nameplate, P(Tm) / P0 with
# P(Tm) = P0 (1 + gamma (Tm - 25)), where the engine multiplies a factor; degradation is applied one whole year at a time with the part year by exp(frac ln(1 - d)), where the
# engine uses a single power; the waterfall is built as the cumulative retained fraction after each stage (the ideal energy times the product of the factors so far), and the
# energy lost at a stage is the cumulative energy before it less the cumulative energy after it; the expected PR is the final retained fraction, the unexplained gap is the
# expected energy less the metered energy and the target energy is the target over 100 times the ideal energy.
import mpmath as _pv_mp
_pv_mp.mp.dps = 30
def _pv_calc(i):
    m = lambda k: _pv_mp.mpf(str(i[k]))
    Wh = m("E") * 1000; Wp = m("P0") * 1000; Hwh = m("H") * 1000
    Yf = Wh / Wp; Yr = Hwh / 1000
    PR = Yf / Yr * 100
    Eid = Wp * Hwh / 1000 / 1000
    fd = _pv_mp.mpf(1)
    age = m("age"); whole = int(_pv_mp.floor(age)); frac = age - whole
    for _y in range(whole): fd *= (1 - m("deg") / 100)
    if frac > 0: fd *= _pv_mp.exp(frac * _pv_mp.log(1 - m("deg") / 100))
    P0 = _pv_mp.mpf(1); Pt = P0 * (1 + m("gam") / 100 * (m("Tm") - 25))
    LT = Pt / P0
    fs = [("Ld", fd), ("Lt", LT), ("Ls", 1 - m("soil") / 100), ("Lw", 1 - m("dcl") / 100), ("La", 1 - m("avail") / 100), ("Lo", 1 - m("oth") / 100), ("Li", m("inv") / 100)]
    o = {"Yf": Yf, "Yfd": Yf / m("days"), "Yr": Yr, "PR": PR, "Eid": Eid, "Eloss": Eid - m("E"), "PRt": PR / LT}
    cum = _pv_mp.mpf(1)
    for key, f in fs:
        before = Eid * cum; cum = cum * f; after = Eid * cum
        o[key] = before - after
    o["Ex"] = Eid * cum; o["PRx"] = cum * 100; o["PRn"] = cum * 100 / fd
    o["gap"] = o["Ex"] - m("E"); o["gapp"] = o["gap"] / o["Ex"] * 100
    if i["tgt"] > 0:
        o["Etg"] = m("tgt") / 100 * Eid; o["sh"] = o["Etg"] - m("E"); o["mg"] = PR - m("tgt")
    return {k: float(v) for k, v in o.items() if v != 0}
_pv_names = ("E", "P0", "H", "days", "Tm", "gam", "soil", "dcl", "avail", "oth", "inv", "age", "deg", "tgt")
def _pv_vec(*a):
    i = dict(zip(_pv_names, a)); add("pv-performance-ratio", i, _pv_calc(i), 1e-8)
_pvr = random.Random(20261123)
for _k in range(36):
    r = _pvr
    P0 = round(r.choice([5, 20, 50, 100, 250, 1000, 5000]) * r.uniform(0.6, 1.6), 2)
    days = r.choice([1, 7, 14, 30, 31, 90, 365]); H = round(days * r.uniform(2.5, 7.5), 2)
    E = round(P0 * H * r.uniform(0.55, 0.95), 1)
    Tm = round(r.uniform(5, 65), 1); gam = r.choice([0, -0.25, -0.3, -0.35, -0.4, -0.45])
    soil = round(r.choice([0, 1, 2, 5, 10]) * r.uniform(0.7, 1.3), 2); dcl = round(r.uniform(0.5, 4), 2); avail = round(r.choice([0, 0.5, 1, 3]) * r.uniform(0.7, 1.3), 2)
    oth = round(r.uniform(0.5, 5), 2); inv = round(r.uniform(94, 99.2), 1); age = round(r.choice([0, 1, 2, 3, 5, 8, 12, 25, 2.5, 7.25]), 2); deg = round(r.choice([0.3, 0.5, 0.6, 0.8, 1.0]), 2)
    tgt = r.choice([0, 0, 75, 78, 80, 82, 85])
    _pv_vec(E, P0, H, days, Tm, gam, soil, dcl, avail, oth, inv, age, deg, tgt)
_pv_vec(15000, 100, 190, 30, 42, -0.35, 3, 3, 1, 2, 97.5, 3, 0.5, 80)       # the default
_pv_vec(19000, 100, 190, 30, 25, 0, 0, 0, 0, 0, 100, 0, 0, 0)                # no losses, nothing to lose
_pv_vec(52000, 250, 640, 100, 31.5, -0.3, 4, 2.5, 0.5, 1.5, 98.2, 12, 0.5, 80)  # a 250 kWp plant at twelve years
_pv_vec(8800, 50, 365, 90, 18, -0.4, 6, 3.5, 2, 3, 96.5, 0, 0, 78)              # cold quarter, new plant, below the target
_pv_vec(950, 5, 190, 31, 55, -0.45, 1, 1, 0, 1, 97, 25, 1, 0)                  # hot, old, high degradation
_pv_vec(3400000, 5000, 1100, 365, 38, -0.28, 2, 2, 0.5, 2, 98.7, 1, 0.4, 83)  # utility scale year

# --- v1.99.9 work: ev-charger-load (own stream, earlier vectors unchanged) ---
# A different route from the engine's closed forms. The chargers are taken one by one: a group of n chargers is walked charger by charger, and the number in use is the
# smallest whole count m with m x 100 >= n x share, found by stepping m up in exact fractions (the engine rounds up a quotient); each charger in use draws its rated output times the
# average power share over its efficiency, and the connected load is the sum of the rated outputs over the efficiencies. Every part is a complex power S = (P / pf) at the angle
# arccos(pf), added as phasors (the engine adds P and Q = P tan(arccos pf)), and the apparent power is the modulus of the sum. The current is the per-phase current (S / 3 over the
# phase voltage V / sqrt 3 for three-phase, S / V for single-phase). The transformer is the first entry of the sorted size list at or above the design demand. The power left for
# the chargers under the supply limit is found by bisection on the charger power until the modulus of the total equals the limit (the engine solves the quadratic), in 30-digit mpmath.
import mpmath as _ev_mp
from fractions import Fraction as _EvF
_ev_mp.mp.dps = 30
_EV_TX = [25, 50, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150]
def _ev_group(n, p, e, s, t):
    n = int(n); p = _EvF(str(p)); e = _EvF(str(e)); s = _EvF(str(s)); t = _EvF(str(t))
    m = 0
    while m * 100 < n * s: m += 1
    conn = _EvF(0); dem = _EvF(0)
    for k in range(n):
        conn += p / (e / 100)
        if k < m: dem += p * (t / 100) / (e / 100)
    return m, conn, dem
def _ev_mf(x):
    return _ev_mp.mpf(x.numerator) / _ev_mp.mpf(x.denominator) if isinstance(x, _EvF) else _ev_mp.mpf(str(x)) if isinstance(x, (int, float)) else _ev_mp.mpf(x)
def _ev_ph(P, pf):
    S = _ev_mf(P) / _ev_mf(pf)
    return S * _ev_mp.expjpi(_ev_mp.acos(_ev_mp.mpf(pf)) / _ev_mp.pi)
def _ev_calc(i):
    m1, c1, d1 = _ev_group(i["n1"], i["p1"], i["e1"], i["s1"], i["t1"]); m2, c2, d2 = _ev_group(i["n2"], i["p2"], i["e2"], i["s2"], i["t2"])
    Pc = c1 + c2; Pd = d1 + d2
    Sch = _ev_ph(Pd, i["pfc"]) if Pd > 0 else _ev_mp.mpc(0)
    Sb = _ev_ph(i["Pb"], i["pfb"]) if i["Pb"] > 0 else _ev_mp.mpc(0)
    Stot = Sch + Sb; St = abs(Stot)
    k = _ev_mp.sqrt(3) if i["phase"] == 3 else _ev_mp.mpf(1)
    Vph = _ev_mf(i["V"]) / k
    o = {"u1": m1, "u2": m2, "Pc": float(Pc), "Pd": float(Pd), "DF": float(Pd / Pc), "Sd": float(abs(Sch)), "Pt": float(Stot.real), "Qt": float(Stot.imag), "St": float(St), "pft": float(Stot.real / St)}
    ph = 3 if i["phase"] == 3 else 1
    o["It"] = float(St * 1000 / ph / Vph)
    Sdes = St * (1 + _ev_mf(i["sp"]) / 100)
    o["Sdes"] = float(Sdes); o["Ides"] = float(Sdes * 1000 / ph / Vph)
    tx = [x for x in _EV_TX if x >= Sdes]
    if tx: o["Tx"] = tx[0]; o["Ld"] = float(St / tx[0] * 100)
    if i["Sl"] > 0:
        Sl = _ev_mf(i["Sl"]); o["room"] = float(Sl - St); o["roomD"] = float(Sl - Sdes)
        tot = lambda x: abs(Sb + _ev_ph(x, i["pfc"]))
        if abs(Sb) >= Sl: x = _ev_mp.mpf(0)
        else:
            lo, hi = _ev_mp.mpf(0), Sl * _ev_mf(i["pfc"]) * 2
            for _ in range(200):
                mid = (lo + hi) / 2
                if tot(mid) < Sl: lo = mid
                else: hi = mid
            x = (lo + hi) / 2
        o["Pav"] = float(x); o["sh"] = float(min(_ev_mp.mpf(100), x / Pc * 100))
    return {a: b for a, b in o.items() if b != 0}
_ev_names = ("V", "phase", "n1", "p1", "e1", "s1", "t1", "n2", "p2", "e2", "s2", "t2", "pfc", "Pb", "pfb", "sp", "Sl")
def _ev_vec(*a):
    i = dict(zip(_ev_names, a)); add("ev-charger-load", i, _ev_calc(i), 1e-7)
_evr = random.Random(20261124)
for _k in range(36):
    r = _evr
    ph = r.choice([3, 3, 3, 1]); Vv = r.choice([400, 415, 480, 690]) if ph == 3 else r.choice([230, 240])
    n1 = r.choice([0, 2, 6, 10, 12, 20, 40, 60]); n2 = r.choice([0, 1, 2, 4, 6, 10, 16, 24])
    if n1 + n2 == 0: n1 = 8
    p1 = r.choice([3.7, 7.4, 11, 22]); e1 = r.choice([100, 99, 98.5]); s1 = round(r.uniform(15, 100), 1); t1 = round(r.uniform(45, 100), 1)
    p2 = r.choice([30, 50, 60, 120, 150, 350]); e2 = round(r.uniform(92, 97), 1); s2 = round(r.uniform(30, 100), 1); t2 = round(r.uniform(40, 95), 1)
    pfc = round(r.uniform(0.9, 0.995), 3); Pb = r.choice([0, 0, 40, 150, 400, 1200]) * round(r.uniform(0.8, 1.2), 2); Pb = round(Pb, 1); pfb = round(r.uniform(0.75, 0.98), 2)
    sp = r.choice([0, 10, 20, 25, 50])
    rough = (n1 * p1 * 0.8 + n2 * p2 * 0.7) + Pb
    Sl = 0 if r.random() < 0.3 else round(rough * r.uniform(0.55, 1.5), 1)
    _ev_vec(Vv, ph, n1, p1, e1, s1, t1, n2, p2, e2, s2, t2, pfc, Pb, pfb, sp, Sl)
_ev_vec(400, 3, 12, 7.4, 100, 70, 85, 4, 60, 95, 75, 70, 0.98, 150, 0.9, 20, 400)    # the default
_ev_vec(400, 3, 20, 22, 100, 100, 100, 0, 60, 95, 75, 70, 0.98, 0, 0.9, 0, 440)      # twenty 22 kW chargers at full power, no building load
_ev_vec(400, 3, 0, 7.4, 100, 70, 85, 8, 150, 95, 100, 100, 0.99, 100, 0.85, 25, 1500)  # fast chargers only, all in use
_ev_vec(230, 1, 6, 7.4, 100, 50, 100, 0, 60, 95, 75, 70, 0.98, 12, 0.95, 20, 0)     # single phase, no limit
_ev_vec(415, 3, 10, 11, 100, 33.3, 90, 2, 120, 94, 50, 80, 0.97, 300, 0.88, 10, 200)  # building load alone is above the limit
_ev_vec(690, 3, 30, 22, 99, 60, 90, 40, 350, 96, 90, 75, 0.99, 800, 0.9, 20, 0)     # large site above the largest standard transformer
# --- v1.99.10 work: railway-backup-load (own stream, earlier vectors unchanged) ---
# A different route from the engine's closed forms. Each load group is taken on its own as the charge it draws from the battery bank: the group's average power
# (rated watts x duty) is stepped through the growth margin and the battery-to-load efficiency to a bank current, and that current is multiplied by the backup hours to give
# ampere-hours drawn (the engine works in watts and watt-hours for the whole bank and divides by the voltage at the end). The ampere-hours drawn are divided by the product of the
# three capacity factors to give the nameplate capacity, and the standard size is the first entry of the sorted list at or above it. The runtime of an installed bank is found by
# bisection on the hours until the ampere-hours drawn equal the usable ampere-hours (the engine divides). The charger current is the recharge current plus the bus current, all in exact fractions and 30-digit mpmath.
import mpmath as _rw_mp
from fractions import Fraction as _RwF
_rw_mp.mp.dps = 30
_RW_AH = [50, 65, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000]
def _rw_calc(V, P, d, t, eta, dod, age, tmp, g, trc, ec, Ai):
    V = _RwF(str(V)); t = _RwF(str(t)); eta = _RwF(str(eta)) / 100; fac = _RwF(str(dod)) / 100 * _RwF(str(age)) / 100 * _RwF(str(tmp)) / 100
    grow = 1 + _RwF(str(g)) / 100
    Ib = _RwF(0); Ipk = _RwF(0); Pc = _RwF(0); Pa = _RwF(0)
    for p, dd in zip(P, d):
        p = _RwF(str(p)); dd = _RwF(str(dd)) / 100
        Pc += p; Pa += p * dd
        Ib += (p * dd * grow) / eta / V          # this group's current from the bank, amperes
        Ipk += p * grow / eta / V                # the same group at full power
    Pd = Pa * grow; Pb = Pd / eta
    Ahd = Ib * t
    Ah = Ahd / fac
    o = {"Pc": float(Pc), "Pa": float(Pa), "Pd": float(Pd), "Pb": float(Pb), "Ib": float(Ib), "Ipk": float(Ipk), "Ahd": float(Ahd), "Eb": float(Ahd * V / 1000), "Uf": float(fac), "En": float(Ah * V / 1000), "Ah": float(Ah)}
    std = [x for x in _RW_AH if x >= Ah]
    if std: o["Ahs"] = std[0]; o["Cpk"] = float(Ipk / std[0])
    Ich = Ahd / (_RwF(str(trc)) * _RwF(str(ec)) / 100) + Ib
    o["Ich"] = float(Ich); o["Pch"] = float(Ich * V / 1000)
    Ai = _RwF(str(Ai))
    if Ai > 0:
        use = Ai * fac; lo, hi = _rw_mp.mpf(0), _rw_mp.mpf(10) ** 6
        ibm = _rw_mp.mpf(Ib.numerator) / Ib.denominator; um = _rw_mp.mpf(use.numerator) / use.denominator
        for _ in range(300):
            mid = (lo + hi) / 2
            if ibm * mid < um: lo = mid
            else: hi = mid
        tr = (lo + hi) / 2; o["trun"] = float(tr); o["mg"] = float(tr - _rw_mp.mpf(t.numerator) / t.denominator)
    return {a: b for a, b in o.items() if b != 0}
_rw_names = ("V", "P1", "d1", "P2", "d2", "P3", "d3", "P4", "d4", "t", "eta", "dod", "age", "tmp", "g", "trc", "ec", "Ai")
def _rw_vec(*a):
    i = dict(zip(_rw_names, a))
    add("railway-backup-load", i, _rw_calc(i["V"], [i["P1"], i["P2"], i["P3"], i["P4"]], [i["d1"], i["d2"], i["d3"], i["d4"]], i["t"], i["eta"], i["dod"], i["age"], i["tmp"], i["g"], i["trc"], i["ec"], i["Ai"]), 1e-7)
_rwr = random.Random(20261125)
for _k in range(36):
    r = _rwr
    Vv = r.choice([24, 48, 110, 220]); P = [r.choice([0, 300, 900, 1500, 2400, 4000]) * round(r.uniform(0.8, 1.2), 2) for _ in range(4)]
    if sum(P) == 0: P[0] = 1200
    P = [round(x, 1) for x in P]; d = [r.choice([100, 100, round(r.uniform(5, 100), 1)]) for _ in range(4)]
    if not any(P[j] > 0 and d[j] > 0 for j in range(4)): d[P.index(max(P))] = 100
    t = r.choice([2, 4, 6, 8, 12, 24]); eta = round(r.uniform(80, 98), 1); dod = r.choice([50, 60, 70, 80]); age = r.choice([80, 85, 100]); tmp = r.choice([75, 85, 90, 100])
    g = r.choice([0, 5, 10, 20]); trc = r.choice([8, 12, 16, 24]); ec = r.choice([80, 85, 90, 95])
    Ai = 0 if r.random() < 0.4 else r.choice([100, 200, 300, 500, 800, 1200])
    _rw_vec(Vv, P[0], d[0], P[1], d[1], P[2], d[2], P[3], d[3], t, eta, dod, age, tmp, g, trc, ec, Ai)
_rw_vec(110, 2400, 100, 1800, 60, 900, 100, 1500, 10, 4, 92, 80, 80, 90, 10, 12, 90, 300)    # the default, with a 300 Ah bank that falls short
_rw_vec(110, 2400, 100, 1800, 60, 900, 100, 1500, 10, 4, 92, 80, 80, 90, 10, 12, 90, 500)    # the same load on a 500 Ah bank
_rw_vec(48, 600, 100, 0, 100, 0, 100, 0, 100, 8, 95, 80, 100, 100, 0, 12, 90, 0)            # one small telecom load, no margin
_rw_vec(24, 400, 100, 300, 100, 200, 100, 100, 100, 24, 85, 50, 80, 75, 20, 24, 80, 1500)   # a long backup on a 24 V bank
_rw_vec(220, 4000, 100, 4000, 100, 4000, 100, 4000, 100, 16, 90, 80, 80, 90, 10, 12, 90, 0)  # a large load above the largest standard size
_rw_vec(110, 3000, 100, 3000, 100, 0, 100, 0, 100, 4, 92, 80, 100, 100, 0, 8, 95, 0)       # two large loads, no ageing or temperature allowance, a 4 h backup

# 18b. agl-brightness-steps, 20 A circuit type (v1.99.16), written from the relations on the page and in exact fractions, own random stream
#      (the 6.6 A vectors above are untouched). Class 2 steps 8.5, 10.3, 12.4, 15.8, 20.0 A (FAA AC 150/5345-10H, five-step style); the lamp
#      power is taken at 20.0 A and scaled by (I/20)^k, the full-current load is the same circuit at 20.0 A.
from fractions import Fraction as _BF
_B20 = ["8.5", "10.3", "12.4", "15.8", "20.0"]
def _b20_vec(b, n_, Pl_, et_, L_, R_, k_):
    I = _BF(_B20[b - 1]); If = _BF("20.0"); Pl = _BF(str(Pl_)); et = _BF(str(et_)); L = _BF(str(L_)); R = _BF(str(R_)); k = _BF(str(k_))
    cab = I * I * (R / 1000) * L
    ratio = float(I / If)
    lamp = n_ * Pl * _BF(ratio).limit_denominator(10**9) ** int(k) / et if k.denominator == 1 else n_ * Pl * _BF(ratio ** float(k)) / et
    Pt = lamp + cab
    full = n_ * Pl / et + If * If * (R / 1000) * L
    add("agl-brightness-steps", {"ct": 3, "b": b, "n": n_, "Pl": Pl_, "et": et_, "L": L_, "R": R_, "k": k_},
        {"I": float(I), "pI": float(I / If * 100), "Pt": float(Pt / 1000), "Vo": float(Pt / I), "Pc": float(cab), "pL": float(Pt / full * 100)}, 1e-9)
_b20r = random.Random(20261118)
for _k in range(9):
    _b20_vec(_b20r.randint(1, 5), _b20r.randint(1, 300), round(_b20r.uniform(10, 200), 1), round(_b20r.uniform(0.6, 0.98), 3), _b20r.randint(100, 12000), round(_b20r.uniform(0.5, 8), 3), round(_b20r.uniform(1, 4), 2))
for _b in (1, 2, 3, 4, 5): _b20_vec(_b, 60, 45, 0.85, 4000, 3.08, 2)


# --- v1.99.30 work: multi-appliance-cost (own stream, earlier vectors unchanged) ---
# Written from the plain definitions, in exact fractions: energy = quantity x watts x (percent / 100) x hours, summed over the rows;
# month = daily x days, year = daily x 365; cost = kWh x tariff; share = row / total. Largest user is the first row of the maximum.
from fractions import Fraction as _MF
def _ma_vec(days, tar, rows):
    F = _MF; days = F(str(days)); tar = F(str(tar))
    rr = list(rows) + [(0, 1, 4, 100)] * (8 - len(rows))
    e = [F(str(n)) * F(str(P)) * F(str(d)) / 100 * F(str(h)) for (P, n, h, d) in rr]   # Wh per day
    Ed = sum(e); Em = Ed * days; Ey = Ed * 365
    inp = {"days": days and float(days), "tar": float(tar)}
    for r, (P, n, h, d) in enumerate(rr, 1):
        inp["P%d" % r] = P; inp["n%d" % r] = n; inp["h%d" % r] = h; inp["d%d" % r] = d
    out = {"Pc": float(sum(F(str(n)) * F(str(P)) for (P, n, h, d) in rr) / 1000), "Pavg": float(Ed / 24 / 1000), "Ed": float(Ed / 1000), "Em": float(Em / 1000), "Ey": float(Ey / 1000),
           "Cd": float(Ed / 1000 * tar), "Cm": float(Em / 1000 * tar), "Cy": float(Ey / 1000 * tar)}
    for r in range(8):
        out["E%d" % (r + 1)] = float(e[r] * days / 1000); out["C%d" % (r + 1)] = float(e[r] * days / 1000 * tar)
        out["s%d" % (r + 1)] = float(e[r] / Ed * 100) if Ed > 0 else 0.0
    mx = max(e)
    out["top"] = (e.index(mx) + 1) if Ed > 0 else 0
    out["topsh"] = float(mx / Ed * 100) if Ed > 0 else 0.0
    add("multi-appliance-cost", inp, out, 1e-9)
_mar = random.Random(20261118)
_ma_vec(30, 8, [(1500, 1, 8, 100), (75, 1, 10, 100), (100, 1, 6, 100), (100, 1, 5, 100), (150, 1, 24, 100)])      # the worked example of the product note: 523.5 kWh, 4,188
_ma_vec(30, 8, [(1500, 1, 8, 100), (75, 1, 10, 100), (100, 1, 6, 100), (100, 1, 5, 100), (150, 1, 24, 40)])       # the same list with the refrigerator at 40 % average draw
_ma_vec(30, 10, [(1000, 1, 24, 100)])                                                                             # 1 kW for 24 h: 8,760 kWh a year
_ma_vec(31, 6.5, [(2000, 2, 0, 100), (500, 1, 3, 100)])                                                           # a row with zero hours, 31-day month
_ma_vec(30, 8, [(1500, 1, 0, 100)])                                                                               # nothing used: zero energy, cost and share
_ma_vec(30, 8, [(60, 3, 5, 100), (60, 3, 5, 100)])                                                                # two equal rows tie: the first is the largest user
for _k in range(24):
    _nr = _mar.randint(1, 8)
    _ma_vec(_mar.choice([28, 30, 30, 31]), round(_mar.uniform(2, 15), 2),
            [(_mar.choice([9, 18, 40, 75, 100, 150, 500, 1200, 1500, 2000, round(_mar.uniform(5, 3000), 1)]), _mar.randint(1, 12), round(_mar.uniform(0, 24), 2), _mar.choice([100, 100, 80, 60, 40, 25, round(_mar.uniform(5, 100), 1)])) for _ in range(_nr)])

# --- v1.99.31 work: electricity-bill-meter (own stream, earlier vectors unchanged) ---
# Written from the plain bill definition in exact fractions. Telescopic: the units are cut into blocks (0-b1, b1-b2, b2-b3, above) and each block takes its own rate.
# Non-telescopic: the first slab whose upper limit is >= units gives the one rate for every unit (limits inclusive). Subtotal = energy + load x fixed per kW + monthly fixed + units x surcharge;
# duty and tax are each a percent of that subtotal; total = subtotal + duty + tax + other.
def _eb_vec(prev, cur, mf, meth, b, r, ld, fkw, fm, fps, du, tx, ot):
    F = _MF; q = lambda x: F(str(x))
    u = (q(cur) - q(prev)) * q(mf); bb = [q(x) for x in b]; rr = [q(x) for x in r]
    U = [F(0)] * 4
    if meth == 0:
        edges = [F(0)] + bb
        for j in range(3): U[j] = max(F(0), min(u, edges[j + 1]) - edges[j])
        U[3] = max(F(0), u - bb[2])
        sl = max([j + 1 for j in range(4) if U[j] > 0] or [1])
    else:
        sl = 4
        for j in range(3):
            if u <= bb[j]: sl = j + 1; break
        U[sl - 1] = u
    K = [U[j] * rr[j] for j in range(4)]; En = sum(K)
    Fx = q(ld) * q(fkw) + q(fm); Sc = u * q(fps); Sb = En + Fx + Sc; Du = Sb * q(du) / 100; Tx = Sb * q(tx) / 100; Tot = Sb + Du + Tx + q(ot)
    inp = {"prev": prev, "cur": cur, "mf": mf, "meth": meth, "b1": b[0], "b2": b[1], "b3": b[2], "r1": r[0], "r2": r[1], "r3": r[2], "r4": r[3], "ld": ld, "fkw": fkw, "fm": fm, "fps": fps, "du": du, "tx": tx, "ot": ot}
    out = {"u": float(u), "sl": sl, "En": float(En), "Fx": float(Fx), "Sc": float(Sc), "Sb": float(Sb), "Du": float(Du), "Tx": float(Tx), "Tot": float(Tot), "avg": float(Tot / u) if u > 0 else 0.0}
    for j in range(4): out["U%d" % (j + 1)] = float(U[j]); out["K%d" % (j + 1)] = float(K[j])
    add("electricity-bill-meter", inp, out, 1e-9)
_ebr = random.Random(20261118)
_eb_vec(1200, 1650, 1, 0, [100, 300, 500], [2.5, 5, 6.5, 7.5], 5, 25, 0, 0.3, 5, 0, 0)
_eb_vec(1200, 1650, 1, 1, [100, 300, 500], [2.5, 5, 6.5, 7.5], 5, 25, 0, 0.3, 5, 0, 0)
_eb_vec(0, 300, 1, 1, [100, 300, 500], [2.5, 5, 6.5, 7.5], 0, 0, 0, 0, 0, 0, 0)      # exactly on a limit stays in slab 2
_eb_vec(0, 300, 1, 0, [100, 300, 500], [2.5, 5, 6.5, 7.5], 0, 0, 0, 0, 0, 0, 0)
_eb_vec(0, 100, 1, 1, [100, 300, 500], [2.5, 5, 6.5, 7.5], 0, 0, 0, 0, 0, 0, 0)      # exactly on the first limit
_eb_vec(500, 500, 1, 0, [100, 300, 500], [2, 4, 6, 8], 2, 50, 20, 1, 10, 5, 7)       # zero units
_eb_vec(0, 700, 1, 1, [100, 300, 500], [1, 2, 3, 4], 0, 0, 0, 0, 0, 0, 0)            # above slab 3
_eb_vec(100, 110, 40, 0, [100, 300, 500], [2, 4, 6, 8], 0, 0, 0, 0, 0, 0, 0)
for _k in range(26):
    _b1 = _ebr.randint(30, 200); _b2 = _b1 + _ebr.randint(50, 300); _b3 = _b2 + _ebr.randint(50, 400)
    _p = _ebr.randint(0, 50000); _u = _ebr.choice([0, _b1, _b2, _b3, _ebr.randint(1, 1500), _ebr.randint(1, 1500), round(_ebr.uniform(1, 1500), 1)])
    _mf = _ebr.choice([1, 1, 1, 2, 10, 40, 1.5])
    _eb_vec(_p, round(_p + _u / _mf, 4) if _mf not in (1.5,) else _p + _u / 1.5, _mf, _ebr.randrange(2), [_b1, _b2, _b3], sorted(round(_ebr.uniform(1, 12), 2) for _ in range(4)),
            _ebr.choice([0, 1, 3, 5, 10.5]), _ebr.choice([0, 25, 60, 112.5]), _ebr.choice([0, 20, 90]), _ebr.choice([0, 0.25, 0.45]), _ebr.choice([0, 5, 15]), _ebr.choice([0, 5, 18]), _ebr.choice([0, 12, 150]))

# --- v1.99.32 work: replacement-savings (own stream, earlier vectors unchanged) ---
# Written from the plain definitions in exact fractions: energy = n x watts x (percent / 100) x hours x days; saving = existing - new; cost = kWh x tariff;
# percent saved = daily saving / daily existing; year = daily saving x days per year; investment = n x unit cost + other; payback = investment / yearly cost saving (0 when there is no saving);
# net = yearly cost saving x life - investment.
def _rs_vec(n, Pe, he, de, Pn, hn, dn, dm, dy, tar, ci, co, life):
    F = _MF; q = lambda x: F(str(x))
    eo = q(n) * q(Pe) * q(de) / 100 * q(he); en = q(n) * q(Pn) * q(dn) / 100 * q(hn)
    Eo = eo * q(dm); En = en * q(dm); dE = Eo - En; dEy = (eo - en) * q(dy); k = q(tar) / 1000; dCy = dEy * k; inv = q(n) * q(ci) + q(co)
    pby = inv / dCy if dCy > 0 else F(0); pct = (eo - en) / eo * 100 if eo > 0 else F(0)
    inp = {"n": n, "Pe": Pe, "he": he, "de": de, "Pn": Pn, "hn": hn, "dn": dn, "dm": dm, "dy": dy, "tar": tar, "ci": ci, "co": co, "life": life}
    out = {"Eo": float(Eo / 1000), "En": float(En / 1000), "Co": float(Eo / 1000 * q(tar)), "Cn": float(En / 1000 * q(tar)), "dE": float(dE / 1000), "dC": float(dE / 1000 * q(tar)), "pct": float(pct),
           "dEy": float(dEy / 1000), "dCy": float(dEy / 1000 * q(tar)), "inv": float(inv), "pby": float(pby), "pbm": float(pby * 12), "net": float(dEy / 1000 * q(tar) * q(life) - inv)}
    add("replacement-savings", inp, out, 1e-9)
_rsr = random.Random(20261118)
_rs_vec(1, 100, 10, 100, 20, 10, 100, 30, 360, 8, 150, 0, 10)
_rs_vec(1, 100, 10, 100, 20, 10, 100, 30, 365, 8, 0, 0, 10)
_rs_vec(50, 150, 12, 100, 60, 12, 100, 30, 360, 10, 1000, 5000, 8)
_rs_vec(1, 100, 10, 100, 20, 6, 100, 30, 360, 10, 0, 0, 10)
_rs_vec(1, 20, 10, 100, 100, 10, 100, 30, 360, 8, 150, 0, 10)        # no saving: payback 0
_rs_vec(1, 100, 10, 100, 100, 10, 100, 30, 360, 8, 150, 0, 10)       # equal energy: zero saving
for _k in range(26):
    _pe = _rsr.choice([40, 100, 150, 400, 750, 1500, 2200, round(_rsr.uniform(10, 5000), 1)]); _pn = round(_pe * _rsr.uniform(0.2, 1.1), 1)
    _rs_vec(_rsr.randint(1, 200), _pe, round(_rsr.uniform(1, 24), 2), _rsr.choice([100, 100, 70, 45, round(_rsr.uniform(10, 100), 1)]), _pn, round(_rsr.uniform(1, 24), 2), _rsr.choice([100, 100, 80, 50, round(_rsr.uniform(10, 100), 1)]),
            _rsr.choice([28, 30, 31]), _rsr.choice([300, 360, 365, 366]), round(_rsr.uniform(2, 15), 2), _rsr.choice([0, 80, 250, 1200, 15000]), _rsr.choice([0, 500, 25000]), _rsr.choice([1, 5, 10, 15, 0.5]))

# --- v1.99.33 work: load-energy-cost (own stream, earlier vectors unchanged) ---
# Written as a different route from the engine's closed form sqrt3 x V x I x pf: each phase is taken on its own in 50-digit mpmath. A balanced three-phase load with
# line-to-line voltage VL has a phase voltage VL / sqrt3 and each of the three phases carries P1 = Vph x I x pf (line-to-neutral voltage: Vph = V); the load is the sum of the phases.
# Single-phase is one such phase at V; DC is V x I with no power factor. Apparent power is the same sum without pf. Share of current scales each phase current; energy = kW x hours x days.
def _le_vec(ph, vt, V, I, pf, n, lf, h, dm, dy, tar):
    mpm.mp.dps = 50
    q = lambda x: mpm.mpf(str(x))
    if ph == 0:
        Pw = q(V) * q(I) * q(lf) / 100; Sa = Pw
    else:
        phases = 3 if ph == 3 else 1
        Vph = q(V) / mpm.sqrt(3) if (ph == 3 and vt == 0) else q(V)
        Iph = q(I) * q(lf) / 100
        Pw = sum(Vph * Iph * q(pf) for _ in range(phases)); Sa = sum(Vph * Iph for _ in range(phases))
    P = Pw * n / 1000; S = Sa * n / 1000
    Ed = P * q(h); Em = Ed * q(dm); Ey = Ed * q(dy); t = q(tar)
    inp = {"phase": ph, "vt": vt, "V": V, "I": I, "pf": pf, "n": n, "lf": lf, "h": h, "dm": dm, "dy": dy, "tar": tar}
    out = {"P": float(P), "S": float(S), "Ed": float(Ed), "Em": float(Em), "Ey": float(Ey), "Ch": float(P * t), "Cd": float(Ed * t), "Cm": float(Em * t), "Cy": float(Ey * t)}
    add("load-energy-cost", inp, out, 1e-9)
_ler = random.Random(20261118)
_le_vec(3, 0, 415, 10, 0.8, 1, 100, 8, 30, 365, 8)       # the note example: 415 V, 10 A, PF 0.8, about 5.75 kW
_le_vec(1, 0, 230, 10, 1, 1, 100, 8, 30, 365, 8)         # 230 V, 10 A, PF 1: 2.3 kW
_le_vec(3, 1, 230, 100, 0.9, 1, 100, 1, 30, 365, 1)      # three-phase line-to-neutral
_le_vec(0, 0, 48, 20, 0.5, 1, 100, 10, 30, 365, 10)      # DC ignores the power factor
_le_vec(1, 0, 1000, 1, 1, 1, 100, 24, 30, 365, 1)        # 1 kW for 24 h, 365 days: 8,760 kWh
_le_vec(3, 0, 415, 10, 0.8, 1, 100, 0, 30, 365, 8)       # zero hours: zero energy and cost
_le_vec(1, 0, 230, 10, 1, 4, 50, 8, 30, 365, 8)          # four loads at 50 %
for _k in range(26):
    _ph = _ler.choice([3, 3, 3, 1, 1, 0]); _vt = _ler.choice([0, 0, 1]) if _ph == 3 else 0
    _V = _ler.choice([230, 400, 415, 440, 690, 3300, 11000, round(_ler.uniform(12, 800), 1)]) if _ph != 0 else _ler.choice([12, 24, 48, 110, 600])
    _le_vec(_ph, _vt, _V, round(_ler.uniform(0.5, 600), 2), _ler.choice([0.7, 0.8, 0.85, 0.9, 0.95, 1, round(_ler.uniform(0.3, 1), 3)]), _ler.randint(1, 40),
            _ler.choice([100, 100, 80, 65, round(_ler.uniform(5, 100), 1)]), round(_ler.uniform(0, 24), 2), _ler.choice([28, 30, 31]), _ler.choice([300, 360, 365, 366]), round(_ler.uniform(1, 15), 2))

# --- v1.99.34 work: tou-demand-bill (own stream, earlier vectors unchanged) ---
# Written from the plain bill definition in exact fractions. Energy charge = sum of kWh x rate over the three periods; billed demand = the larger of the recorded demand and
# (minimum percent x contract demand); demand charge = billed demand x rate; subtotal = energy + demand + fixed; duty and tax are each a percent of the subtotal;
# total = subtotal + duty + tax + other; average = total / kWh; peak share = peak kWh / kWh; load factor = kWh / (recorded demand x days x 24).
def _td_vec(ep, es, eo, rp, rs, ro, Dr, Dc, mp, dd, dys, fm, du, tx, ot):
    F = _MF; q = lambda x: F(str(x))
    Et = q(ep) + q(es) + q(eo); Kp = q(ep) * q(rp); Ks = q(es) * q(rs); Ko = q(eo) * q(ro); En = Kp + Ks + Ko
    Db = max(q(Dr), q(Dc) * q(mp) / 100); Dch = Db * q(dd); Sb = En + Dch + q(fm); Du = Sb * q(du) / 100; Tx = Sb * q(tx) / 100; Tot = Sb + Du + Tx + q(ot)
    inp = {"ep": ep, "es": es, "eo": eo, "rp": rp, "rs": rs, "ro": ro, "Dr": Dr, "Dc": Dc, "mp": mp, "dd": dd, "dys": dys, "fm": fm, "du": du, "tx": tx, "ot": ot}
    out = {"Et": float(Et), "Kp": float(Kp), "Ks": float(Ks), "Ko": float(Ko), "En": float(En), "Db": float(Db), "Dch": float(Dch), "Sb": float(Sb), "Du": float(Du), "Tx": float(Tx), "Tot": float(Tot),
           "avg": float(Tot / Et) if Et > 0 else 0.0, "pk": float(q(ep) / Et * 100) if Et > 0 else 0.0, "lf": float(Et / (q(Dr) * q(dys) * 24) * 100) if q(Dr) > 0 else 0.0}
    add("tou-demand-bill", inp, out, 1e-9)
_tdr = random.Random(20261118)
_td_vec(3000, 5000, 4000, 10, 7, 5, 40, 50, 75, 300, 30, 0, 5, 0, 0)        # the default example
_td_vec(1000, 0, 1000, 10, 7, 5, 20, 100, 75, 200, 30, 500, 0, 0, 0)       # recorded demand below the minimum
_td_vec(1000, 0, 1000, 10, 7, 5, 20, 100, 0, 200, 30, 0, 0, 0, 0)          # minimum percent 0
_td_vec(100, 100, 100, 9, 6, 3, 60, 80, 75, 100, 30, 0, 0, 0, 0)           # exactly on the minimum
_td_vec(1000, 0, 0, 10, 0, 0, 10, 10, 0, 100, 30, 1000, 10, 18, 250)       # duty and tax on the same subtotal
_td_vec(0, 0, 0, 10, 7, 5, 0, 0, 0, 300, 30, 400, 0, 0, 100)               # nothing used
_td_vec(6000, 6000, 9600, 1, 1, 1, 50, 50, 0, 0, 30, 0, 0, 0, 0)           # load factor 60 %
_td_vec(2000, 3000, 1000, 12, 8, 4, 90, 60, 80, 250, 28, 0, 0, 0, 0)       # recorded demand above contract demand: still the recorded figure
for _k in range(25):
    _dc = _tdr.choice([0, 20, 50, 100, 250, 800, round(_tdr.uniform(5, 2000), 1)])
    _td_vec(_tdr.choice([0, 100, round(_tdr.uniform(10, 40000), 1)]), _tdr.choice([0, 250, round(_tdr.uniform(10, 60000), 1)]), _tdr.choice([0, 500, round(_tdr.uniform(10, 80000), 1)]),
            round(_tdr.uniform(6, 14), 2), round(_tdr.uniform(4, 10), 2), round(_tdr.uniform(2, 7), 2), _tdr.choice([0, 10, round(_tdr.uniform(5, 1500), 1)]), _dc, _tdr.choice([0, 50, 75, 80, 90, 100, round(_tdr.uniform(0, 100), 1)]),
            _tdr.choice([0, 150, 300, 450, round(_tdr.uniform(50, 700), 1)]), _tdr.choice([28, 30, 31]), _tdr.choice([0, 250, 1200, 5000]), _tdr.choice([0, 5, 9, 15]), _tdr.choice([0, 5, 18]), _tdr.choice([0, 100, 2500]))

# --- v1.99.39 work: electricity-cost-planner (own stream, earlier vectors unchanged) ---
# Written from the plain definitions in exact fractions, not from engine.js: monthly energy = sum of quantity x watts x (percent / 100) x hours x days;
# slab bill: telescopic = each block at its own rate (limits are inclusive upper limits); non-telescopic = the rate of the slab the total falls in on all units;
# subtotal = energy + fixed monthly charge; duty and tax are percentages of that subtotal; other charges are added at the end.
# Replacement: energy saved = quantity x (old watts x old share x old hours - new watts x new share x new hours) x days; bill saving = bill(units) - bill(units - saved);
# payback months = (quantity x unit cost + other cost) / bill saving; net = bill saving x 12 x life - investment.
from fractions import Fraction as _PF
def _pl_bill(u, meth, lim, rate, fm, du, tx, ot):
    F = _PF
    b1, b2, b3 = lim; r1, r2, r3, r4 = rate
    if meth == 0:
        U1 = min(u, b1); U2 = min(max(u - b1, 0), b2 - b1); U3 = min(max(u - b2, 0), b3 - b2); U4 = max(u - b3, 0)
        en = U1 * r1 + U2 * r2 + U3 * r3 + U4 * r4
    else:
        r = r1 if u <= b1 else r2 if u <= b2 else r3 if u <= b3 else r4
        en = u * r
    sub = en + fm
    return en, sub, sub * du / 100, sub * tx / 100, sub + sub * du / 100 + sub * tx / 100 + ot
def _pl_vec(days, rows, meth, lim, rate, fm, du, tx, ot, k, Pn, hn, dn, ci, co, life):
    F = lambda x: _PF(str(x))
    rr = list(rows) + [(0, 1, 4, 100)] * (12 - len(rows))
    e = [F(n) * F(P) * F(d) / 100 * F(h) for (P, n, h, d) in rr]       # Wh per day
    Ed = sum(e); Em = Ed * F(days) / 1000; Ey = Ed * 365 / 1000
    lim = [F(x) for x in lim]; rate = [F(x) for x in rate]; fm, du, tx, ot = F(fm), F(du), F(tx), F(ot)
    en, sub, dut, tax, tot = _pl_bill(Em, meth, lim, rate, fm, du, tx, ot)
    inp = {"days": days, "meth": meth, "b1": float(lim[0]), "b2": float(lim[1]), "b3": float(lim[2]), "r1": float(rate[0]), "r2": float(rate[1]), "r3": float(rate[2]), "r4": float(rate[3]),
           "fm": float(fm), "du": float(du), "tx": float(tx), "ot": float(ot), "k": k, "Pn": Pn, "hn": hn, "dn": dn, "ci": ci, "co": co, "life": life}
    for r, (P, n, h, d) in enumerate(rr, 1):
        inp["P%d" % r] = P; inp["n%d" % r] = n; inp["h%d" % r] = h; inp["d%d" % r] = d
    mx = max(e)
    out = {"Em": float(Em), "Ey": float(Ey), "top": (e.index(mx) + 1) if Ed > 0 else 0, "topsh": float(mx / Ed * 100) if Ed > 0 else 0.0,
           "En": float(en), "Fx": float(fm), "Du": float(dut), "Tx": float(tax), "Tot": float(tot), "avg": float(tot / Em) if Em > 0 else 0.0, "Cy": float(tot * 12)}
    dE = _PF(0); Tot1 = tot; dT = _PF(0); inv = _PF(0); pbm = _PF(0); net = _PF(0)
    if k >= 1:
        P, n, h, d = rr[k - 1]
        dEw = F(n) * (F(P) * F(d) / 100 * F(h) - F(Pn) * F(dn) / 100 * F(hn)) * F(days)    # Wh
        dE = dEw / 1000; inv = F(n) * F(ci) + F(co)
        Tot1 = _pl_bill(Em - dE, meth, lim, rate, fm, du, tx, ot)[4]; dT = tot - Tot1
        if dT > 0: pbm = inv / dT
        net = dT * 12 * F(life) - inv
    out.update({"dE": float(dE), "dpct": float(dE / Em * 100) if Em > 0 else 0.0, "Tot1": float(Tot1), "dT": float(dT), "dTy": float(dT * 12), "inv": float(inv), "pbm": float(pbm), "pby": float(pbm / 12), "net": float(net)})
    add("electricity-cost-planner", inp, out, 1e-9)
_L = (100, 300, 500); _R = (2.5, 5, 6.5, 7.5)
_def = [(1500, 1, 8, 100), (75, 1, 10, 100), (100, 1, 6, 100), (100, 1, 5, 100), (150, 1, 24, 100)]
_pl_vec(30, _def, 0, _L, _R, 125, 5, 0, 0, 1, 1000, 8, 100, 30000, 0, 10)                       # default: 523.5 kWh, telescopic bill, replace the air conditioner
_pl_vec(30, _def, 1, _L, _R, 125, 5, 0, 0, 1, 1000, 8, 100, 30000, 0, 10)                       # the same list, non-telescopic
_pl_vec(30, _def, 0, _L, _R, 125, 5, 0, 0, 0, 1000, 8, 100, 0, 0, 10)                           # no replacement
_pl_vec(31, [(2000, 2, 3, 100), (500, 1, 6, 80), (60, 4, 5, 100)], 0, (50, 150, 400), (3, 4.5, 6, 9), 80, 8, 4, 15, 2, 200, 6, 100, 2500, 600, 8)   # 31 days, three rows, duty, tax and other charges
_pl_vec(30, [(1000, 1, 10, 100)], 1, (100, 200, 300), (4, 5, 6, 7), 0, 0, 0, 0, 1, 1500, 10, 100, 1000, 0, 10)       # a replacement that raises the bill: no payback
_plr = random.Random(20261119)
for _ in range(12):
    _n = _plr.randint(1, 5)
    _rows = [(_plr.choice([40, 75, 100, 150, 800, 1500, 2000]), _plr.randint(1, 4), _plr.choice([1, 3, 5, 8, 10, 24]), _plr.choice([100, 100, 60, 40])) for _x in range(_n)]
    _l1 = _plr.choice([50, 100, 150]); _l2 = _l1 + _plr.choice([100, 150, 200]); _l3 = _l2 + _plr.choice([100, 200, 300])
    _rt = sorted(round(_plr.uniform(2, 9), 2) for _x in range(4))
    _k = _plr.randint(0, _n)
    _pl_vec(_plr.choice([28, 30, 31]), _rows, _plr.randint(0, 1), (_l1, _l2, _l3), _rt, _plr.choice([0, 60, 125]), _plr.choice([0, 5, 15]), _plr.choice([0, 5, 18]), _plr.choice([0, 20]),
            _k, _plr.choice([30, 100, 600, 1000]), _plr.choice([0, 4, 8]), 100, _plr.choice([0, 500, 12000]), _plr.choice([0, 300]), _plr.choice([5, 10]))

# --- v1.99.40 work: electricity-cost-planner twelve rows and the time-of-use and demand tariff (own stream, earlier vectors unchanged) ---
# Time-of-use bill written from the plain definition in exact fractions: energy = peak kWh x peak rate + shoulder kWh x shoulder rate + off-peak kWh x off-peak rate, with the list energy
# split by the peak and shoulder percentages entered and the rest off-peak; billed demand = larger of the recorded demand and (minimum % x contract demand); demand charge = billed demand x rate;
# subtotal = energy + demand charge + fixed charge; duty and tax are percentages of the subtotal; other charges are added at the end. Replacement: the saved energy is taken off in the same shares.
def _pl_tou_bill(u, pk, sh, rp, rs, ro, Dr, Dc, mp, dd, fm, du, tx, ot, S=None):
    ep, es, eo = S if S else (u * pk / 100, u * sh / 100, u * (100 - pk - sh) / 100)
    en = ep * rp + es * rs + eo * ro
    Db = max(Dr, Dc * mp / 100); dch = Db * dd
    sub = en + dch + fm
    return en, Db, dch, sub, sub * du / 100, sub * tx / 100, sub + sub * du / 100 + sub * tx / 100 + ot
def _pl_tou_vec(days, rows, pk, sh, rates, Dr, Dc, mp, dd, Dr1, fm, du, tx, ot, k, Pn, hn, dn, ci, co, life, own=None):
    F = lambda x: _PF(str(x))
    rr = list(rows) + [(0, 1, 4, 100)] * (12 - len(rows))
    e = [F(n) * F(P) * F(d) / 100 * F(h) for (P, n, h, d) in rr]
    Ed = sum(e); Em = Ed * F(days) / 1000
    pk, sh, Dr, Dc, mp, dd, Dr1, fm, du, tx, ot = [F(x) for x in (pk, sh, Dr, Dc, mp, dd, Dr1, fm, du, tx, ot)]
    rp, rs, ro = [F(x) for x in rates]
    ow = (list(own) + [(25, 40)] * (12 - len(own))) if own else None
    S0 = None
    if ow:
        er = [x * F(days) / 1000 for x in e]
        S0 = (sum(x * F(a) / 100 for x, (a, b) in zip(er, ow)), sum(x * F(b) / 100 for x, (a, b) in zip(er, ow)), sum(x * (100 - F(a) - F(b)) / 100 for x, (a, b) in zip(er, ow)))
    en, Db, dch, sub, dut, tax, tot = _pl_tou_bill(Em, pk, sh, rp, rs, ro, Dr, Dc, mp, dd, fm, du, tx, ot, S0)
    inp = {"days": days, "tm": 1, "pk": float(pk), "sh": float(sh), "trp": float(rp), "trs": float(rs), "tro": float(ro), "Dr": float(Dr), "Dc": float(Dc), "mp": float(mp), "dd": float(dd), "Dr1": float(Dr1),
           "fm": float(fm), "du": float(du), "tx": float(tx), "ot": float(ot), "k": k, "Pn": Pn, "hn": hn, "dn": dn, "ci": ci, "co": co, "life": life}
    for r, (P, n, h, d) in enumerate(rr, 1):
        inp["P%d" % r] = P; inp["n%d" % r] = n; inp["h%d" % r] = h; inp["d%d" % r] = d
    if ow:
        inp["ts"] = 1
        for r, (a, b) in enumerate(ow, 1):
            inp["pp%d" % r] = a; inp["ps%d" % r] = b
    out = {"Em": float(Em), "En": float(en), "Fx": float(fm), "Du": float(dut), "Tx": float(tax), "Db": float(Db), "Dch": float(dch), "Tot": float(tot), "avg": float(tot / Em) if Em > 0 else 0.0, "Cy": float(tot * 12)}
    dE = _PF(0); Tot1 = tot; dT = _PF(0); inv = _PF(0); pbm = _PF(0); net = _PF(0)
    if k >= 1:
        P, n, h, d = rr[k - 1]
        dE = F(n) * (F(P) * F(d) / 100 * F(h) - F(Pn) * F(dn) / 100 * F(hn)) * F(days) / 1000; inv = F(n) * F(ci) + F(co)
        Dafter = Dr1 if Dr1 > 0 else Dr
        if ow:
            a, b = F(ow[k - 1][0]), F(ow[k - 1][1])
            S1 = (max(S0[0] - dE * a / 100, 0), max(S0[1] - dE * b / 100, 0), max(S0[2] - dE * (100 - a - b) / 100, 0))
        else:
            S1 = None
        Tot1 = _pl_tou_bill(Em - dE, pk, sh, rp, rs, ro, Dafter, Dc, mp, dd, fm, du, tx, ot, S1)[6]; dT = tot - Tot1
        if dT > 0: pbm = inv / dT
        net = dT * 12 * F(life) - inv
    out.update({"dE": float(dE), "Tot1": float(Tot1), "dT": float(dT), "dTy": float(dT * 12), "inv": float(inv), "pbm": float(pbm), "net": float(net)})
    add("electricity-cost-planner", inp, out, 1e-9)
_pl_tou_vec(30, _def, 25, 40, (10, 7, 5), 40, 50, 75, 300, 0, 125, 5, 0, 0, 1, 1000, 8, 100, 30000, 0, 10)     # default list on the time-of-use tariff, demand kept after the replacement
_pl_tou_vec(30, _def, 25, 40, (10, 7, 5), 40, 50, 75, 300, 30, 125, 5, 0, 0, 1, 1000, 8, 100, 30000, 0, 10)    # recorded demand falls to 30 kW, so billed demand drops to the 37.5 kW minimum
_pl_tou_vec(30, _def, 100, 0, (9, 6, 4), 20, 100, 75, 200, 0, 0, 0, 0, 0, 0, 1000, 8, 100, 0, 0, 10)           # all energy at peak, billed on the 75 kW minimum demand, no replacement
_pl_tou_vec(31, _def + [(40, 3, 6, 100), (1200, 1, 2, 50), (300, 2, 4, 100), (60, 5, 8, 80), (800, 1, 1, 100), (25, 4, 12, 100), (2000, 1, 1, 60)], 10, 30, (12, 8, 3), 25, 30, 60, 250, 0, 90, 8, 4, 15, 9, 500, 6, 100, 1500, 200, 8)   # twelve rows, replace row 9
_ptr = random.Random(20261120)
for _ in range(10):
    _n = _ptr.randint(1, 12)
    _rows = [(_ptr.choice([40, 75, 100, 150, 800, 1500, 2000]), _ptr.randint(1, 4), _ptr.choice([1, 3, 5, 8, 10, 24]), _ptr.choice([100, 100, 60, 40])) for _x in range(_n)]
    _pk = _ptr.choice([0, 10, 25, 50]); _sh = _ptr.choice([0, 20, 40])
    _rt = sorted((round(_ptr.uniform(2, 12), 2) for _x in range(3)), reverse=True)
    _Dc = _ptr.choice([20, 50, 100]); _Dr = _ptr.choice([10, 30, 60])
    _k = _ptr.randint(0, _n)
    _pl_tou_vec(_ptr.choice([28, 30, 31]), _rows, _pk, _sh, _rt, _Dr, _Dc, _ptr.choice([0, 50, 75]), _ptr.choice([0, 150, 300]), _ptr.choice([0, 5, 15]), _ptr.choice([0, 125]), _ptr.choice([0, 5]), _ptr.choice([0, 18]), _ptr.choice([0, 100]),
                _k, _ptr.choice([30, 100, 600]), _ptr.choice([0, 4, 8]), 100, _ptr.choice([0, 500, 12000]), _ptr.choice([0, 300]), _ptr.choice([5, 10]))

_pl_tou_vec(30, _def, 25, 40, (10, 7, 5), 40, 50, 75, 300, 0, 125, 5, 0, 0, 1, 1000, 8, 100, 30000, 0, 10, own=[(100, 0), (0, 0), (0, 0), (0, 0), (0, 0)])   # air conditioner all peak, the rest off-peak
_pl_tou_vec(30, _def, 25, 40, (10, 7, 5), 40, 50, 75, 300, 0, 125, 5, 0, 0, 3, 40, 6, 100, 800, 0, 10, own=[(60, 10), (0, 50), (30, 30), (20, 20), (10, 0)])    # mixed shares, replace row 3
_pto = random.Random(20261121)
for _ in range(8):
    _n = _pto.randint(1, 12)
    _rows = [(_pto.choice([40, 75, 100, 150, 800, 1500, 2000]), _pto.randint(1, 4), _pto.choice([1, 3, 5, 8, 10, 24]), _pto.choice([100, 100, 60, 40])) for _x in range(_n)]
    _own = []
    for _x in range(_n):
        _a = _pto.choice([0, 10, 25, 50, 100]); _own.append((_a, _pto.choice([0, 10, 20, 50]) if _a <= 50 else 0))
    _rt = sorted((round(_pto.uniform(2, 12), 2) for _x in range(3)), reverse=True)
    _k = _pto.randint(0, _n)
    _pl_tou_vec(_pto.choice([28, 30, 31]), _rows, 25, 40, _rt, _pto.choice([10, 30, 60]), _pto.choice([20, 50, 100]), _pto.choice([0, 50, 75]), _pto.choice([0, 150, 300]), _pto.choice([0, 5, 15]), _pto.choice([0, 125]), _pto.choice([0, 5]), _pto.choice([0, 18]), _pto.choice([0, 100]),
                _k, _pto.choice([30, 100, 600]), _pto.choice([0, 4, 8]), 100, _pto.choice([0, 500, 12000]), _pto.choice([0, 300]), _pto.choice([5, 10]), own=_own)

print(json.dumps(V, indent=0))
