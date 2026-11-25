/* FAQ fix v1.99.101: readable merged answers.
   tools/faq_trim.js joins the wording of several old answers under one new question, which left sentences such as "Yes." or
   "Because ..." with no question in front of them. This tool puts each merged part's original question in front of it as a bold
   run-in lead, e.g. "<strong>Can I leave some numbers out?</strong> Yes. In Unique numbers mode ...". No wording is changed or added.
   The anchor list gives the first words of every part after the first, in the plan's order. Safe to run twice (skips lead-ins that
   are already there). Run after tools/faq_trim.js:  node tools/faq_trim_leads.js   |  --check */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const plans = require('./faq_trim_plans.js');
const check = process.argv.includes('--check');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ANCHORS = [
  ['Yes. The minimum can be negative'],
  ['It draws numbers that never repeat, like drawing balls', 'Yes. In Unique numbers mode'],
  ['A seed makes the result repeatable'],
  ['No. They are picked from the grid'],
  ['Without a seed, every set draws'],
  ['A sample is random, so its mean'],
  ['No. The values are simulated', 'Enter an amount in the unit'],
  ['Only inside the open tab.'],
  ['The reciprocal of the positive power'],
  ['Factor the base into primes', 'The root is moved out of the denominator.'],
  ['Yes. The exponent reduces to 1/3'],
  ['Because 2/4 reduces to 1/2 first.'],
  ['15 + 1/1 is the same as 16', 'Only of the decimal you type'],
  ['GCD and LCM take up to 20 numbers'],
  ['To divide powers with the same base', 'Multiply the exponents: (3^2)^3'],
  ['A reciprocal: 2^(−3)'],
  ['When a side has no real value'],
  ['Scientific notation with the exponent forced'],
  ['The time in which an RC or RL response'],
  ['Half up on the digits'],
  ['Not here: the exponent of a power of ten'],
  ['This is ordinary decay', 'With a non-zero elapsed time no decay'],
  ['Any label: grams'],
  ['Then it is an irrational number'],
  ['Every value works, or the expression is undefined.'],
  ['Whole numbers, fractions and radicals are exact.'],
  ['The time constant τ is the time to fall'],
  ['That is not covered.'],
  ['No. It is a calculation, not a safety assessment.'],
  ['A percentage of nothing is undefined'],
  ['Yes. Pick a unit for each.'],
  ['It approaches 100% but never reaches it'],
  ['Accuracy is 100% minus the percentage error.'],
  ['The error is divided by the size of the reference'],
  ['Because a^n / a^n'],
  ['Exactly as fractions: 0.5 is 1/2'],
  ['Yes. A step of 0.25 half-lives'],
  ['Yes. Each half-life has its own unit'],
  ['Half of the nuclei are gone after one half-life'],
  ['Use “Also show in”.'],
  ['Yes. Choose the absolute basis'],
  ['Multiply the factors. 20% off'],
  ['In degree and gradian mode the calculator uses exact values'],
  ['Divide the percentage by 100, subtract it from 1'],
  ['The average is 0, so the formula would divide 0 by 0.'],
  ['Arithmetic mode never wraps'],
  ['The page refuses it and names the quantity'],
  ['Named groups of bits in a register'],
  ['Most standard deviations are square roots']
];
let i = 0, done = 0, skipped = 0;
for (const k in plans) for (const [q, srcs] of plans[k].faq) {
  if (srcs.length < 2) continue;
  const an = ANCHORS[i++]; if (!an || an.length !== srcs.length - 1) throw new Error('anchor count mismatch for ' + k + ' / ' + q);
  for (const rel of plans[k].files) {
    const file = path.join(root, rel); let h = fs.readFileSync(file, 'utf8');
    const re = new RegExp('(<h3>' + rx(q.replace(/&/g, '&amp;')) + '</h3><p>)([\\s\\S]*?)(</p>)'); const m = h.match(re);
    if (!m) throw new Error('question not found: ' + rel + ' / ' + q);
    let body = m[2];
    if (body.indexOf('<strong class="sub">') >= 0) { skipped++; continue; }
    let pos = 0;
    an.forEach((a, j) => {
      const at = body.indexOf(a, pos); if (at < 0 || body.indexOf(a, at + 1) >= 0) throw new Error('anchor not found once/in order: ' + rel + ' / "' + a + '"');
      const lead = '<strong class="sub">' + esc(srcs[j + 1]) + '</strong> ';
      body = body.slice(0, at) + lead + body.slice(at); pos = at + lead.length + a.length;
    });
    done++; if (!check) fs.writeFileSync(file, h.replace(re, (_, x, y, z) => x + body + z));
  }
}
console.log((check ? 'would add lead-ins to ' : 'added lead-ins to ') + done + ' answers, skipped ' + skipped);
