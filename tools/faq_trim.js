/* Trims over-long FAQ sections on built pages (FAQ review v1.99.101, "pages with more than 8 questions").
   Each plan lists the new questions in order; a new question's answer is the joined wording of the old answers it names.
   Nothing new is claimed. Refuses to run on a page whose question count is not the expected "from" count.
   Run:  node tools/faq_trim.js <slug>      e.g. node tools/faq_trim.js random-number-generator */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const plans = require('./faq_trim_plans.js');
const slug = process.argv[2];
/* node tools/faq_trim.js all  -> every plan whose pages still have the old question count (already-trimmed pages are skipped) */
const slugs = slug === 'all' ? Object.keys(plans) : [slug];
slugs.forEach((slug) => {
if (!plans[slug]) throw new Error('no plan for ' + slug + '. Known: ' + Object.keys(plans).join(', '));
const plan = plans[slug];
plan.files.forEach((rel) => {
  const file = path.join(root, rel); let h = fs.readFileSync(file, 'utf8');
  const a = h.indexOf('<section id="faq">'), b = h.indexOf('</section>', a);
  if (a < 0 || b < 0) throw new Error('no FAQ section in ' + rel);
  const old = {}; let n = 0;
  h.slice(a, b).replace(/<h3>(.*?)<\/h3><p>(.*?)<\/p>/g, (m, q, p) => { old[q] = p; n++; return m; });
  if (slug === 'all' || slugs.length > 1) { if (n === plan.faq.length) { console.log(rel + ': already trimmed, skipped'); return; } }
  if (n !== plan.from) throw new Error(rel + ': expected ' + plan.from + ' questions, found ' + n + ' (already trimmed?)');
  const used = new Set();
  const out = plan.faq.map(([q, srcs]) => '<h3>' + q.replace(/&/g, '&amp;') + '</h3><p>' + srcs.map((s) => { if (!(s in old)) throw new Error('missing: ' + s); used.add(s); return old[s]; }).join(' ') + '</p>').join('');
  h = h.slice(0, a) + '<section id="faq"><h2>Questions</h2>' + out + h.slice(b);
  fs.writeFileSync(file, h);
  console.log(rel + ': ' + n + ' -> ' + plan.faq.length + ' questions; dropped: ' + (Object.keys(old).filter((q) => !used.has(q)).join(' | ') || 'none'));
});
});
