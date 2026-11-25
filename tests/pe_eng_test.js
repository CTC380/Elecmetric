/* Tests for tools/pe_eng_engine.js (Percent Error Calculator, Mode 05). Independent check: a second, separate BigInt rational implementation
   of |x - y| / |y| x 100 and of the limits y +- y*t/100, compared by cross-multiplication with the engine output. Run: node tests/pe_eng_test.js */
const E = require("../tools/pe_eng_engine.js"), E1 = require("../tools/pe_engine.js"), E3 = require("../tools/pe_tol_engine.js");
let n = 0, bad = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log("FAIL " + m); } };
function dec(s) { const m = /^(-?)(\d*)\.?(\d*)$/.exec(s); const f = m[3] || ""; return { n: BigInt((m[1] || "") + (m[2] || "0") + f), d: 10n ** BigInt(f.length) }; }
const sub = (a, b) => ({ n: a.n * b.d - b.n * a.d, d: a.d * b.d }), abs = (a) => ({ n: a.n < 0n ? -a.n : a.n, d: a.d < 0n ? -a.d : a.d });
const div = (a, b) => ({ n: a.n * b.d, d: a.d * b.n }), mul = (a, k) => ({ n: a.n * k, d: a.d });
const eq = (a, b) => a.n * b.d === b.n * a.d;
const nums = ["225", "230", "235", "100", "7", "9", "56.891", "62.327", "9.8", "10", "-9", "-10", "0.001", "1000", "1012", "49.92", "50", "98.5", "9.87", "0.5", "12345.6789", "4.80", "5.10", "1", "250", "-0.25", "3"];
const tols = ["", "0", "0.5", "1", "2", "5", "10"];
for (const a of E.APPS) {
  ok(typeof a.name === "string" && a.units.indexOf(a.u) >= 0, "app " + a.id + " default unit is in its list");
  const d = E.calc({ app: a.id, x: a.x, y: a.y, tol: a.t }); ok(d.ok, "app " + a.id + " default example");
  for (const x of nums) for (const y of nums) {
    if (Math.random() > 0.35) continue;
    const t = tols[(x.length + y.length) % tols.length], r = E.calc({ app: a.id, x, y, tol: t }), X = dec(x), Y = dec(y);
    if (Y.n === 0n) { ok(!r.ok, "zero reference refused"); continue; }
    ok(r.ok, a.id + " " + x + "/" + y); if (!r.ok) continue;
    const want = mul(div(abs(sub(X, Y)), abs(Y)), 100n);
    ok(eq({ n: BigInt(r.num), d: BigInt(r.den) }, want), a.id + " pct " + x + "/" + y);
    const m1 = E1.calc({ x, y, unit: a.u });
    ok(m1.num === r.num && m1.den === r.den && m1.dir === r.dir, "matches Mode 01 " + x + "/" + y);
    if (t !== "") {
      const T = dec(t), lim = mul(div(abs(Y), { n: 100n, d: 1n }), 1n); const tolAbs = { n: lim.n * T.n, d: lim.d * T.d };
      const e = abs(sub(X, Y)), within = e.n * tolAbs.d <= tolAbs.n * e.d;
      ok(r.within === within, a.id + " verdict " + x + "/" + y + " tol " + t);
      const m3 = E3.calc({ x, y, unit: a.u, basis: "pct", shape: "sym", t }); ok(m3.pass === r.within, "matches Mode 03 " + x + "/" + y);
    } else ok(r.within === null && r.t === null, "no tolerance, no verdict");
    ok(/eference/.test(r.sentence) && r.rows.length >= 7, "sentence and rows present");
  }
}
// spec vectors
const V = [["225", "230", "2.173913"], ["235", "230", "2.173913"], ["100", "100", "0"], ["7", "9", "22.222222"], ["56.891", "62.327", "8.721742"], ["9.8", "10", "2"], ["-9", "-10", "10"]];
for (const [x, y, w] of V) { const r = E.calc({ app: "calibration", x, y }); ok(r.ok && r.text === w, "spec vector " + x + "/" + y + " got " + (r.ok && r.text)); }
ok(E.calc({ app: "power", x: "9.8", y: "10" }).dir === "below" && E.calc({ app: "power", x: "9.8", y: "10" }).signed.replace("\u2212", "-").indexOf("-0.2") === 0, "power meter example signed -0.2");
ok(E.calc({ app: "voltage", x: "225", y: "230", tol: "5" }).within === true && E.calc({ app: "voltage", x: "225", y: "230", tol: "2" }).within === false, "voltage 5% and 2%");
ok(E.calc({ app: "energy", x: "1012", y: "1000", tol: "1.2" }).within === true, "limit itself counts as within");
ok(!E.calc({ app: "nope", x: "1", y: "1" }).ok, "unknown application refused");
ok(E.calc({ app: "power", x: "", y: "" }).empty === true, "empty input gives hint");
ok(!E.calc({ app: "power", x: "abc", y: "1" }).ok, "bad number refused");
ok(!E.calc({ app: "power", x: "1", y: "1", tol: "-2" }).ok, "negative tolerance refused");
ok(!E.calc({ app: "power", x: "1", y: "1", unit: "<b>" }).ok, "bad unit label refused");
ok(E.calc({ app: "power", x: "1", y: "1" }).unit === "kW", "blank unit takes the application default");
console.log(n + " checks, " + bad + " failed"); process.exit(bad ? 1 : 0);
