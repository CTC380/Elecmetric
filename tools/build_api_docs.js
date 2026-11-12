/* Writes docs/API.md: the documented contract of Elecmetric.api() plus a reference for every calculator, generated from the registry so it cannot go stale.
   Run: node tools/build_api_docs.js   (a test fails if docs/API.md differs from this output) */
const fs = require('fs'), path = require('path');
const E = require('../engine.js');
function build() {
  const ex = { P: 100, PUnit: 'kW', V: 400, VUnit: 'V', pf: 0.9, phase: 3, eff: 1 };
  const okRes = E.api('three-phase-current', ex), badRes = E.api('three-phase-current', Object.assign({}, ex, { P: 0 }));
  const md = [];
  md.push('# Elecmetric JavaScript API (v' + E.VERSION + ')', '',
    'Elecmetric is a client-side engine: `engine.js` has no dependencies and no DOM. It runs in a browser or in Node 18+. **There is no hosted REST API yet**; see "Hosted API" below.', '',
    '## Use it', '',
    'Browser: load `engine.js`, then call `Elecmetric.api(id, inputs)`. Node: `const E = require("./engine.js"); E.api(id, inputs)`.', '',
    '```js', 'Elecmetric.api(\'three-phase-current\', ' + JSON.stringify(ex) + ')', '```', '',
    '## Rules', '',
    '- `id` is a calculator id from the reference below. An unknown id returns `{ ok: false, error: "Unknown calculator: <id>" }`.',
    '- Each input is a plain number under its `key`. To give it in another unit add `<key>Unit`, for example `PUnit: "kW"`. Without it the input\'s default unit is used.',
    '- Choice inputs (enums) take the numeric option listed in the reference, not the label.',
    '- Omitted inputs use the calculator\'s default value. Keys the calculator does not know are ignored.',
    '- Outputs come back in each output\'s display unit, rounded to 12 significant figures.',
    '- Invalid input returns `ok: false` and an `errors` array of `{ key, msg }`; nothing is thrown.', '',
    '## Response', '',
    'Success:', '', '```json', JSON.stringify(okRes, null, 2), '```', '',
    'Failure:', '', '```json', JSON.stringify(badRes, null, 2), '```', '',
    '`warnings` lists the calculator\'s own cautions (for example a result beyond the end of a size table). Show them with the result.', '',
    '## Verification status', '',
    'Every calculator is tested against separately generated reference vectors (`tests/README.md`). Standard applicability records in `tools/review_records.json` distinguish `scope_screened` (public catalogue scope only; licensed clause review still pending) from `clause_reviewed`. The team-level reviewer designation in `tools/team_review_approval.json` is administrative only; it is not an individual or independent professional sign-off. Individual technical approval is a separate record in `tools/review_records.json`. Do not describe API results as certified or standards-compliant.', '',
    '## Hosted API', '',
    'Planned, not available. A hosted service would wrap this same `api()` function behind HTTPS (`POST /v1/calculate/<id>`), return the response above unchanged, version the path, and add authentication and rate limits. Until it exists, embed `engine.js` directly (it is a single file) or link to a calculator with pre-filled inputs: `/#three-phase-current?P=250:kW&V=415:V`.', '',
    '## Calculator reference (' + E.CALCS.length + ')', '');
  E.CALCS.forEach((c) => {
    md.push('### `' + c.id + '`: ' + c.title, '', '| Input key | Meaning | Unit or options | Default |', '|---|---|---|---|');
    c.inputs.forEach((s) => {
      let u, d;
      if (s.type === 'enum') { u = s.options.map((o) => o + ' = ' + (s.labels ? s.labels[o] : o)).join('; '); d = s.def; }
      else { u = s.dim ? E.unitsOf(s.dim).join(', ') : (s.unit || 'number'); d = s.def + (s.unit ? ' ' + s.unit : ''); }
      md.push('| `' + s.key + '` | ' + s.label + ' | ' + u.replace(/\|/g, '/') + ' | ' + d + ' |');
    });
    md.push('', 'Outputs: ' + c.outputs.map((o) => '`' + o.key + '` (' + o.label + (o.unit ? ', ' + o.unit : '') + ')').join('; '), '');
  });
  return md.join('\n') + '\n';
}
if (require.main === module) { fs.writeFileSync(path.join(__dirname, '..', 'docs', 'API.md'), build()); console.log('wrote docs/API.md for ' + E.CALCS.length + ' calculators'); }
module.exports = { build };
