/* Internal-link graph of a built Elecmetric site (the committed tree or the production _site).
   Two graphs are produced for every HTML page:
     full        every internal anchor on the page
     contextual  anchors inside <main> only, so the header, footer and mega-footer navigation cannot hide a poorly connected page
   Used by tests/internal_link_graph_test.js and by `node tools/link_graph.js <site dir> [--json]` for a printed report. */
const fs = require('fs'), path = require('path');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    if (d.name === 'node_modules' || d.name === '.git' || d.name === 'tools' || d.name === 'tests' || d.name === 'docs' || d.name === 'data-templates') return;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out); else if (d.name.endsWith('.html')) out.push(p);
  });
  return out;
}
/* /calculators/x/index.html -> /calculators/x/ ; /index.html -> / ; other files keep their name */
const urlOf = (root, file) => {
  const rel = '/' + path.relative(root, file).split(path.sep).join('/');
  return rel.replace(/index\.html$/, '');
};
function resolve(from, href, base) {
  href = href.replace(/#.*$/, '').replace(/\?.*$/, '');
  if (!href) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    if (base && href.indexOf(base) === 0) href = href.slice(base.length) || '/'; else return null;
  }
  if (href.indexOf('//') === 0) return null;
  let abs = href.charAt(0) === '/' ? href : path.posix.join(from.endsWith('/') ? from : path.posix.dirname(from) + '/', href);
  abs = path.posix.normalize(abs);
  if (href.endsWith('/') && !abs.endsWith('/')) abs += '/';
  return abs.replace(/index\.html$/, '');
}
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
function anchors(html) {
  const out = [], re = /<a\s[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g; let m;
  while ((m = re.exec(html))) out.push({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), at: m.index });
  return out;
}
/* map: { '/calculators/x/': html, ... } (what the build holds in memory, or what is read from a folder) -> page records with full and contextual link sets. */
function fromMap(map, base) {
  const pages = {};
  Object.keys(map).forEach((url) => {
    if (url === '/404.html' || url === '/privacy.html' || url === '/terms.html') return;
    const html = strip(map[url]);
    const robots = /<meta name="robots" content="[^"]*noindex/i.test(html);
    const redirect = /<meta http-equiv="refresh"/i.test(html) || /data-redirect="/.test(html);
    const m = /<main[\s\S]*?<\/main>/.exec(html);
    const main = m ? m[0] : html.replace(/<header[\s\S]*?<\/header>/g, '').replace(/<footer[\s\S]*?<\/footer>/g, '');
    const t = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    pages[url] = { url, noindex: robots || redirect, title: t ? t[1].replace(/<[^>]+>/g, '').trim() : url, html, main };
  });
  Object.keys(pages).forEach((u) => {
    const p = pages[u];
    const targets = (h) => { const s = new Set(); anchors(h).forEach((a) => { const r = resolve(u, a.href, base); if (r && r !== u) s.add(r); }); return s; };
    p.full = targets(p.html);
    p.ctx = targets(p.main);
  });
  return pages;
}
function load(root, base) {
  const map = {};
  walk(root, []).forEach((f) => { map[urlOf(root, f)] = fs.readFileSync(f, 'utf8'); });
  return fromMap(map, base);
}
function inbound(pages, which) {
  const inb = {}; Object.keys(pages).forEach((u) => { inb[u] = new Set(); });
  Object.keys(pages).forEach((u) => pages[u][which].forEach((t) => { if (inb[t]) inb[t].add(u); }));
  return inb;
}
function depths(pages, which, start) {
  const d = { [start]: 0 }, q = [start];
  while (q.length) { const u = q.shift(); if (!pages[u]) continue; pages[u][which].forEach((t) => { if (pages[t] && d[t] === undefined) { d[t] = d[u] + 1; q.push(t); } }); }
  return d;
}
function family(u) {
  if (u === '/') return 'Home';
  if (u.indexOf('/calculators/') === 0) return 'Calculators';
  if (u.indexOf('/converters/') === 0) return 'Converters';
  if (u.indexOf('/pages/') === 0) return 'Conversion pages';
  if (u.indexOf('/technical-library/') === 0) return 'Technical Library';
  return 'Other';
}
const median = (a) => { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.floor((a.length - 1) / 2)] : 0; };

if (require.main === module) {
  const root = path.resolve(process.argv[2] || '.');
  const pages = load(root, process.env.BASE_URL || '');
  const ctxIn = inbound(pages, 'ctx'), dep = depths(pages, 'ctx', '/'), idx = Object.keys(pages).filter((u) => !pages[u].noindex);
  console.log('HTML pages', Object.keys(pages).length, '· indexable', idx.length);
  console.log('Unreachable from home by in-content links:', idx.filter((u) => dep[u] === undefined).length, '· max depth', Math.max.apply(null, idx.map((u) => dep[u] || 0)));
  const fam = {}; idx.forEach((u) => { (fam[family(u)] = fam[family(u)] || []).push(ctxIn[u].size); });
  Object.keys(fam).forEach((f) => console.log(f.padEnd(20), String(fam[f].length).padStart(4), 'pages, median inbound', median(fam[f])));
  const low = idx.filter((u) => u.indexOf('/calculators/') === 0 && ctxIn[u].size <= 5).sort((a, b) => ctxIn[a].size - ctxIn[b].size);
  console.log('Calculator pages with <=5 distinct in-content inbound sources:'); low.forEach((u) => console.log('  ', String(ctxIn[u].size).padStart(3), u));
}
module.exports = { load, fromMap, inbound, depths, family, median, resolve, anchors, urlOf, walk };
