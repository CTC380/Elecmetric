/* Writes docs/REVIEW_PACK.md: one checklist entry per calculator (formula, assumptions, notes, independent-vector count) for an independent technical reviewer.
   It does NOT record any approval. A record goes into tools/review_records.json only after a person has actually reviewed that calculator.
   Run: node tools/build_review_pack.js */
const fs = require('fs'), path = require('path');
const E = require('../engine.js');
const vec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'reference_vectors.json'), 'utf8'));
const vs = Array.isArray(vec) ? vec : (vec.vectors || []);
const count = {}; vs.forEach((v) => { const k = v.id || v.calc || v.calculator; if (k) count[k] = (count[k] || 0) + 1; });
/* Wave 1: the high-risk calculators to review first (cable sizing, fault current, protection, earthing, transformer sizing, motor starting). */
const WAVE1 = [
  ['Cable sizing and voltage drop', ['cable-size-vd', 'cable-derating', 'voltage-drop', 'ac-voltage-drop', 'max-cable-length', 'cable-sc-withstand', 'parallel-cable-sets']],
  ['Fault current', ['fault-current', 'fault-mva', 'fault-types']],
  ['Protection', ['breaker-size', 'fault-loop-impedance']],
  ['Earthing', ['earth-rod-resistance', 'earth-rods-parallel', 'earth-grid-resistance', 'ngr-sizing']],
  ['Transformer sizing', ['transformer-sizing', 'transformer-loading', 'transformer-current', 'transformer-regulation']],
  ['Motor starting', ['motor-current', 'motor-starting', 'motor-start-dip', 'star-delta-starting']]
];
WAVE1.forEach((g) => g[1].forEach((id) => { if (!E.BY_ID[id]) throw new Error('Wave 1 lists an unknown calculator: ' + id); }));
const byDiv = {}; E.CALCS.forEach((c) => { (byDiv[c.division] = byDiv[c.division] || []).push(c); });
const md = [];
md.push('# Elecmetric independent review pack (v' + E.VERSION + ')', '',
  'Purpose: give a reviewer everything needed to check each calculator without reading `engine.js`. ' + E.CALCS.length + ' calculators in ' + Object.keys(byDiv).length + ' divisions.', '',
  '## How to review one calculator',
  '1. Use the licensed standard edition adopted by the project. Check the exact clauses, tables, annexes and calculation assumptions.',
  '2. Check each assumption and note is true and stated honestly.',
  '3. Work one example by hand and compare it with the calculator.',
  '4. The team-level designation in `tools/team_review_approval.json` is administrative only. Only after a qualified individual has actually approved a calculator should an entry be added to `tools/review_records.json` (format in its `_example`). Never record a review that has not been done.', '',
  'Team-level reviewer designation: Rahul Sharma (self-designation, not independent) (recorded 12 November 2026).', '', 'Individual reviewer name and qualification: ____________________   Date: ____________', '');
md.push('## Wave 1: review these first (' + WAVE1.reduce((n, g) => n + g[1].length, 0) + ' calculators)', '',
  'For each calculator the reviewer fills in: standard and edition used, exact clauses/tables checked, date, name and professional qualification. A public catalogue scope-screen is not a clause review. Set review_status to clause_reviewed only after checking the licensed text. A standard review and a reviewer approval are separate records and either can exist alone.', '');
WAVE1.forEach((g) => {
  md.push('### ' + g[0], '');
  g[1].forEach((id) => md.push('- `' + id + '` (' + E.BY_ID[id].title + '): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________'));
  md.push('');
});
md.push('Record format for each completed review (add under `records` in `tools/review_records.json`; `node tests/run_tests.js` rejects incomplete or placeholder records):', '',
  '```json', '"cable-size-vd": {', '  "standard": { "name": "<standard>", "edition": "<project-adopted edition>", "date": "YYYY-MM-DD", "review_status": "clause_reviewed", "review_basis": "Licensed text checked: exact clauses, tables and annexes recorded in the reference field" },', '  "approved": { "reviewer": "<full name>", "qualification": "<e.g. CEng>", "date": "YYYY-MM-DD", "next_review": "YYYY-MM-DD" },', '  "reference": { "formula_source": "<textbook or standard>", "exact": "<chapter, equation, clause or table>", "author": "<name of the calculation author, if not set in site_info.json>" }', '}', '```', '',
  'A calculator is classified **Verified** only when its record has the reviewer (name, qualification, date), an explicitly `clause_reviewed` standard and edition (unless Not applicable is justified), the formula source and exact reference, a next review date that has not passed, a named calculation author, and independent test cases. `scope_screened` is Partial only. See `docs/VERIFICATION_REGISTER.md`.', '');
Object.keys(byDiv).sort().forEach((d) => {
  md.push('## Division ' + d, '');
  byDiv[d].forEach((c) => {
    md.push('### ' + c.title + ' (`' + c.id + '`)', '',
      '- Formula: `' + String(c.formula).replace(/\s+/g, ' ').trim() + '`',
      '- Inputs: ' + c.inputs.map((i) => i.label + (i.unit ? ' [' + i.unit + ']' : '')).join('; '),
      '- Outputs: ' + c.outputs.map((o) => o.label + (o.unit ? ' [' + o.unit + ']' : '')).join('; '),
      '- Assumptions: ' + (c.assumptions || []).join('; '),
      c.notes ? '- Notes: ' + c.notes : '',
      '- Independent vectors in the test suite: ' + (count[c.id] || 'see tests/README.md'),
      '- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved', '');
  });
});
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'REVIEW_PACK.md'), md.filter((l, i) => l !== '' || md[i - 1] !== '').join('\n') + '\n');
console.log('wrote docs/REVIEW_PACK.md for ' + E.CALCS.length + ' calculators');
