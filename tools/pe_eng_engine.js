/* Elecmetric Percent Error Calculator, Mode 05 (Engineering Measurement Analysis). One file, no DOM, no floating point.
   A thin layer over Mode 01 (tools/pe_engine.js) and Mode 03 (tools/pe_tol_engine.js), both unchanged, so Mode 05 can never disagree with them.
   It adds the eight measurement applications of the product brief: each gives its own wording, unit choices and an example, and an optional tolerance in percent of the reference.
   Percent error = |indicated - reference| / |reference| x 100. The application never changes the arithmetic. Units are labels only; nothing is converted.
   The tolerance is whatever the user enters. The engine reads no standard, applies no measurement uncertainty and never says "compliant".
   calc({ app, x: indicated, y: reference, unit, tol (percent of reference, optional), places }) -> { ok, ... } | { ok: false, error } | { ok: false, empty: true, hint }
   Required by tests/pe_eng_test.js and inlined into calculators/engineering-measurement-analysis/ by tools/pe_eng_page.js. */
(function (root) {
  "use strict";
  var isNode = typeof module !== "undefined" && module.exports;
  var E1 = isNode ? require("./pe_engine.js") : root.PercentErrorMode01, E3 = isNode ? require("./pe_tol_engine.js") : root.PercentErrorMode03;
  var HINT = "Choose the application, then enter the indicated (measured) value and the reference value.";
  var APPS = [
    { id: "voltage", name: "Voltage measurement error", short: "Voltage", ind: "Measured voltage", ref: "Reference voltage", units: ["V", "mV", "kV"], u: "V", x: "225", y: "230", t: "2", use: "Compare a measured voltage with a reference or nominal voltage, for example a supply read by a multimeter against its nominal value.", note: "A reading taken under load and a nominal rating are different things. Say which one your reference is." },
    { id: "current", name: "Current measurement error", short: "Current", ind: "Measured current", ref: "Reference current", units: ["A", "mA", "kA"], u: "A", x: "98.5", y: "100", t: "2", use: "Verify a current reading, for example a clamp meter against a calibrated current source.", note: "Check that both currents are in the same unit and, for AC, that both are RMS values." },
    { id: "resistance", name: "Resistance measurement error", short: "Resistance", ind: "Measured resistance", ref: "Reference (marked) resistance", units: ["\u03a9", "m\u03a9", "k\u03a9", "M\u03a9"], u: "k\u03a9", x: "9.87", y: "10", t: "1", use: "Compare a measured resistance with a marked or standard value, for example a resistor against its colour-code value.", note: "Resistance changes with temperature. The result is only meaningful if both values refer to the same conditions." },
    { id: "frequency", name: "Frequency measurement error", short: "Frequency", ind: "Measured frequency", ref: "Reference frequency", units: ["Hz", "kHz", "MHz"], u: "Hz", x: "49.92", y: "50", t: "0.5", use: "Evaluate frequency deviation, for example a measured supply frequency against its nominal value.", note: "A frequency counter has its own resolution and gate time. Those are part of its uncertainty, not of this error." },
    { id: "power", name: "Power measurement error", short: "Power", ind: "Measured power", ref: "Reference power", units: ["W", "kW", "MW", "kVA", "kvar"], u: "kW", x: "9.8", y: "10", t: "2", use: "Compare a power analyser reading with a reference load or a reference meter.", note: "Active, apparent and reactive power are different quantities. Compare like with like." },
    { id: "energy", name: "Energy meter error", short: "Energy meter", ind: "Meter registration", ref: "Reference energy", units: ["kWh", "Wh", "MWh", "kvarh", "kVAh"], u: "kWh", x: "1012", y: "1000", t: "1", use: "Evaluate the energy a meter registered against a reference energy over the same period.", note: "A positive error means the meter registered more than the reference. The class limit of a meter comes from its nameplate and the standard it was built to; enter it as the tolerance, this page does not look it up." },
    { id: "calibration", name: "Instrument calibration deviation", short: "Calibration", ind: "Instrument indication", ref: "Calibration reference value", units: ["V", "A", "\u03a9", "W", "Hz", "\u00b0C", "%"], u: "V", x: "100.2", y: "100", t: "0.5", use: "Compare an instrument indication with the value of a calibration reference at one test point.", note: "A calibration result also needs the uncertainty of the reference and of the measurement. This page gives the deviation only." },
    { id: "photometry", name: "Photometry measurement deviation", short: "Photometry", ind: "Measured photometric value", ref: "Reference photometric value", units: ["cd", "lx", "cd/m\u00b2", "lm", "%"], u: "cd", x: "9850", y: "10000", t: "5", use: "Compare a measured intensity, illuminance or luminance with a reference or design value, for example an airfield light against its specified intensity.", note: "A specified minimum or maximum value is a limit, not a nominal value. Use the tolerance box only when the specification is a percentage of a nominal value." }
  ];
  function byId(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }
  function pass(s, a) { return String(s).replace(/Observed value/g, a.ind).replace(/Reference value/g, a.ref); }
  function calc(o) {
    o = o || {};
    var a = byId(o.app);
    if (!a) return { ok: false, error: "Choose one of the eight measurement applications.", empty: false };
    var unit = o.unit === undefined || o.unit === null || String(o.unit).trim() === "" ? a.u : o.unit;
    var r = E1.calc({ x: o.x, y: o.y, unit: unit, places: o.places });
    if (!r.ok) return r.empty ? { ok: false, empty: true, hint: HINT } : r;
    var tolText = o.tol === undefined || o.tol === null ? "" : String(o.tol).trim(), t = null;
    if (tolText !== "") {
      t = E3.calc({ x: o.x, y: o.y, unit: unit, basis: "pct", shape: "sym", t: tolText, places: o.places });
      if (!t.ok) return t.empty ? { ok: false, empty: true, hint: HINT } : t;
    }
    var rows = r.rows.map(function (z) { return [pass(z[0], a), z[1], pass(z[2], a)]; });
    var steps = r.steps.slice();
    if (t) {
      ["Tolerance entered", "Permitted range", "Margin to lower limit", "Margin to upper limit", "Tolerance used", "Assessment", "Scope of this result"].forEach(function (k) {
        for (var i = 0; i < t.rows.length; i++) if (t.rows[i][0] === k) rows.push([t.rows[i][0], t.rows[i][1], t.rows[i][2]]);
      });
      steps.push("Tolerance: \u00b1" + tolText + "% of the reference allows " + t.range + ". " + (t.pass ? "The error is inside the tolerance you entered." : "The error is outside the tolerance you entered."));
    }
    var sentence = "The " + a.ind.toLowerCase() + " of " + r.observed + " " + unit + " against a " + a.ref.toLowerCase() + " of " + r.reference + " " + unit + " is " + r.big + " " + r.dir + (r.dir === "equal" ? " to" : "") + " the reference" + (t ? ", " + (t.pass ? "inside" : "outside") + " the entered \u00b1" + tolText + "% tolerance" : "") + ".";
    sentence = sentence.replace("is 0% equal to the reference", "equals the reference (0%)");
    return { ok: true, kind: "eng", app: a, unit: unit, r: r, t: t, big: r.big, text: r.text, frac: r.frac, num: r.num, den: r.den, exact: r.exact, dir: r.dir, signed: r.signed, abs: r.abs, within: t ? !!t.pass : null, rows: rows, steps: steps, formula: r.formula, subst: r.subst, sentence: sentence, warnings: r.warnings.concat([a.note]) };
  }
  var api = { calc: calc, APPS: APPS, HINT: HINT };
  if (isNode) module.exports = api; else root.PercentErrorMode05 = api;
})(typeof window !== "undefined" ? window : this);
