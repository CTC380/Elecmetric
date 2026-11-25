/* Applies tools/calc_refs_by_page.js to built calculator pages: rewrites the "Standards and further reading" block and the
   "Which standards are relevant ...?" FAQ answer. Safe to run twice.  Run: node tools/calc_refs_fix.js  |  --check */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), check = process.argv.includes('--check');
const BY = require('./calc_refs_by_page.js');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let n = 0;
for (const slug in BY) {
  const f = path.join(root, 'calculators', slug, 'index.html'); if (!fs.existsSync(f)) throw new Error('no page: ' + slug);
  let h = fs.readFileSync(f, 'utf8'); const r = BY[slug];
  const blk = '<summary><h2>Standards and further reading</h2></summary>' + (r.refs.length ? '<ul>' + r.refs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '<p class="note">' + esc(r.note) + (r.refs.length ? ' These are named as background reading. Elecmetric does not embed clause text or rating tables, and the reviewer record for this calculator is separate from this list.' : '') + '</p>';
  const re1 = /<summary><h2>Standards and further reading<\/h2><\/summary>[\s\S]*?(?=<\/details>)/; if (!re1.test(h)) throw new Error('no standards block: ' + slug);
  const re2 = /(<h3>Which standards are relevant to [^<]*<\/h3><p>)[\s\S]*?(<\/p>)/;
  const name = (h.match(re2) || [])[0] && h.match(/<h3>Which standards are relevant to ([^<]*)<\/h3>/)[1];
  let h2 = h.replace(re1, () => blk);
  if (name) h2 = h2.replace(re2, (_, a, b) => a + (r.refs.length ? 'The page names ' + esc(r.refs.join('; ')) + ' as background reading. Elecmetric does not embed clause text or rating tables, so take limits from your own copy of the standard.' : 'No single standard is named for this calculator. ' + esc(r.note)) + ' See <a href="#standards">Standards and further reading</a>.' + b);
  if (h2 !== h) { n++; if (!check) fs.writeFileSync(f, h2); }
}
console.log((check ? 'would change ' : 'changed ') + n + ' pages');
