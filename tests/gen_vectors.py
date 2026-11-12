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
def add(id, inp, out, tol=1e-9): V.append({"id": id, "in": inp, "out": out, "tol": tol})

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
CCR = [4, 7.5, 10, 15, 20, 25, 30]

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
CCR_LIST = [4, 7.5, 10, 15, 20, 25, 30]
def ccr_case(Pl_w):
    Pt = (Pl_w + 1) / 1000
    k = next((x for x in CCR_LIST if x >= Pt - 1e-9), None)
    out = {"Pt": Pt, "Vo": Pt * 1000, "Pc": 1.0}
    if k is not None: out.update({"ccr": k, "pct": Pt / k * 100})
    add("agl-ccr-loading", {"n": 1, "Pl": Pl_w, "et": 1, "I": 1, "L": 1000, "R": 1, "ld": 1}, out, 1e-9)
for k in CCR_LIST:
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


print(json.dumps(V, indent=0))
