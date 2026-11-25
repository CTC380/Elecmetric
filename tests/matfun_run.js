/* Runs tools/matfun_engine.js over tests/matfun_cases.json -> tests/matfun_out.json. Driven by tests/verify_matfun.py. */
const F = require('../tools/matfun_engine.js'), fs = require('fs'), path = require('path');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'matfun_cases.json'), 'utf8'));
const out = cases.map((c) => { try { const r = F.calc({ op: c.op, A: c.A.map((r) => r.map(String)) }); return { ok: r.ok, error: r.error, status: r.status, mats: r.mats && r.mats.map((m) => m.text.map((row) => row.map(Number))), checks: r.checks && r.checks.map((k) => [k.label, k.value, k.state]) }; } catch (e) { return { exc: String(e) }; } });
fs.writeFileSync(path.join(__dirname, 'matfun_out.json'), JSON.stringify(out));
console.log('ran', out.length);
