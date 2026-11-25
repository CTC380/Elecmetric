/* Runs tools/network_engine.js over tests/network_cases.json and writes tests/network_out.json.
   tests/verify_network.py generates the cases and checks the output independently with numpy/scipy.
   Run through:  python3 tests/verify_network.py   (it calls this file) */
const N = require('../tools/network_engine.js'), fs = require('fs'), path = require('path');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'network_cases.json'), 'utf8'));
const out = cases.map((c) => { try { const r = N.calc({ op: c.op, text: c.text }); return { ok: r.ok, error: r.error, status: r.status, raw: r.raw, checks: r.checks && r.checks.map((k) => [k.label, k.value, k.state]) }; } catch (e) { return { exc: String(e) }; } });
fs.writeFileSync(path.join(__dirname, 'network_out.json'), JSON.stringify(out, (k, v) => (typeof v === 'number' && !isFinite(v) ? null : v)));
console.log('ran', out.length, 'cases');
