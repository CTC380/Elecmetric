/* Dumps the engine's exact root strings for every vector to tests/quad_out.json, for tests/verify_quad.py (sympy symbolic check). */
const Q = require('../tools/quad_engine.js'), V = require('./quad_vectors.json'), fs = require('fs'), path = require('path');
const out = V.ok.map((r) => { const s = Q.solve({ a: r[0], b: r[1], c: r[2] }); return [r[0], r[1], r[2], s.kind, (s.roots || []).map((x) => x.exact), s.radicand ? String(s.radicand) : null, s.radicandFull !== false]; });
fs.writeFileSync(path.join(__dirname, 'quad_out.json'), JSON.stringify(out)); console.log('wrote ' + out.length + ' rows');
