/* Adds an "On this page" chip bar with a #faq link to FAQ pages that have none (FAQ review v1.99.101, "missing #faq nav links").
   The bar is built from the page's own visible <section id> / <details id> blocks that start with an <h2>, so every chip
   points at a real anchor. It goes straight after the lede paragraph, uses the existing .jump and .chip styles, and is
   skipped on any page that already has an href="#faq" link. Safe to run twice.
   Run:  node tools/faq_nav.js          (all pages)      node tools/faq_nav.js --check   (report only, change nothing)
   Regeneration caveat: re-running a page's own generator script removes the bar; run this tool again afterwards. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const check = process.argv.includes('--check');
const MAX = 7;
function walk(d, out) {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  });
  return out;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function label(id, text) {
  if (id === 'faq') return 'FAQ';
  const t = text.replace(/\s*[:\u2013\u2014].*$/, '').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
let changed = 0, skipped = 0, failed = [];
walk(root, []).forEach((file) => {
  const rel = path.relative(root, file).split(path.sep).join('/');
  let h = fs.readFileSync(file, 'utf8');
  if (!/id="faq"/.test(h) || /href="#faq"/.test(h)) { return; }
  /* insertion point: end of the lede paragraph that follows the page's h1 */
  const h1 = h.indexOf('</h1>');
  const lede = h1 < 0 ? -1 : h.indexOf('<p class="lede">', h1);
  const ledeEnd = lede < 0 ? -1 : h.indexOf('</p>', lede);
  if (h1 < 0 || ledeEnd < 0 || ledeEnd - h1 > 3000) { failed.push(rel + ' (no lede after h1)'); return; }
  const at = ledeEnd + 4;
  /* anchors: top-level blocks with an id whose first child is an h2, after the insertion point, not hidden */
  const chips = []; const seen = new Set();
  const re = /<(section|details)\b([^>]*)\sid="([^"]+)"([^>]*)>(?:<summary>)?<h2[^>]*>(.*?)<\/h2>/g;
  re.lastIndex = at; let m;
  while ((m = re.exec(h))) {
    const attrs = m[2] + ' ' + m[4], id = m[3];
    if (/\bhidden\b/.test(attrs) || seen.has(id)) continue;
    const text = strip(m[5]); if (!text) continue;
    seen.add(id); chips.push({ id, text });
  }
  if (!seen.has('faq')) { failed.push(rel + ' (faq block is not <section id="faq"><h2>)'); return; }
  /* keep FAQ plus up to MAX-1 other anchors in page order; headings of 32 characters or fewer come first so no chip needs cutting */
  const others = chips.filter((c) => c.id !== 'faq'), short = others.filter((c) => label(c.id, c.text).length <= 32);
  const pick = new Set(short.slice(0, MAX - 1).map((c) => c.id));
  for (let i = 0; pick.size < Math.min(3, others.length) && i < others.length; i++) if (!pick.has(others[i].id)) pick.add(others[i].id);
  const keep = chips.filter((c) => c.id === 'faq' || pick.has(c.id));
  const bar = '<nav class="jump" aria-label="On this page">' + keep.map((c) => '<a class="chip" href="#' + c.id + '">' + esc(c.id !== 'faq' && label(c.id, c.text).length > 32 ? label(c.id, c.text).slice(0, 31).replace(/\s+\S*$/, '') + '\u2026' : label(c.id, c.text)) + '</a>').join('') + '</nav>';
  if (check) { console.log(rel + ': would add ' + keep.length + ' chips'); changed++; return; }
  h = h.slice(0, at) + bar + h.slice(at);
  fs.writeFileSync(file, h);
  changed++;
});
console.log((check ? 'would change ' : 'changed ') + changed + ' pages' + (failed.length ? '; could not place: ' + failed.join(', ') : ''));
