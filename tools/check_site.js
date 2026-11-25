#!/usr/bin/env node
/* Site link guard: every sitemap URL and every internal link in the assembled upload folder must resolve to a file.
   Usage: node tools/check_site.js [siteDir=_site] [sitemap=sitemap.xml] [--fragments]
   BASE_URL (env) is the production URL; its path (for a subpath deploy such as https://elecmetric.com/elecmetric)
   is stripped from sitemap URLs and root-absolute links before they are looked up in siteDir.
   Checks href, src, srcset and CSS url(...) written with double, single or no quotes. Lookups are case-exact (as on GitHub Pages)
   on every OS, a link may not resolve outside siteDir, and a malformed %-escape is reported as a problem.
   --fragments also requires every #fragment on a link to an HTML page to match an id or name on that page.
   Catches a folder that is linked or listed in the sitemap but missing from the upload set. */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith('--')), pos = args.filter((a) => !a.startsWith('--'));
const checkFragments = flags.includes('--fragments');
const site = path.resolve(pos[0] || '_site'), sitemap = pos[1] || 'sitemap.xml';
if (!fs.existsSync(site)) { console.error('Site folder not found: ' + site); process.exit(2); }
if (!fs.existsSync(sitemap)) { console.error('Sitemap not found: ' + sitemap); process.exit(2); }

let prefix = '';
if (process.env.BASE_URL) { try { prefix = new URL(process.env.BASE_URL).pathname.replace(/\/+$/, ''); } catch (e) { console.error('BASE_URL is not a valid URL: ' + process.env.BASE_URL); process.exit(2); } }

const dirCache = new Map();
const entries = (d) => { if (!dirCache.has(d)) { let l = []; try { l = fs.readdirSync(d); } catch (e) { /* not a directory */ } dirCache.set(d, new Set(l)); } return dirCache.get(d); };
/* Case-exact lookup of a path inside site; returns the file path it serves (a directory serves its index.html) or null. */
function resolveFile(rel) {
  const segs = rel.split('/').filter((s) => s && s !== '.');
  let cur = site;
  for (const s of segs) { if (s === '..' || !entries(cur).has(s)) return null; cur = path.join(cur, s); }
  if (fs.existsSync(cur) && fs.statSync(cur).isDirectory()) { return entries(cur).has('index.html') ? path.join(cur, 'index.html') : null; }
  return fs.existsSync(cur) && fs.statSync(cur).isFile() ? cur : null;
}
const decode = (s) => { try { return decodeURIComponent(s); } catch (e) { return null; } };
const unent = (s) => s.replace(/&amp;/g, '&').replace(/&#38;/g, '&');
const stripPrefix = (p) => { if (!prefix) return p; if (p === prefix) return '/'; return p.startsWith(prefix + '/') ? p.slice(prefix.length) : null; };

const problems = [];
const xml = fs.readFileSync(sitemap, 'utf8');
const locs = [...xml.matchAll(/<loc>\s*(https?:\/\/[^/<\s]+)([^<]*?)\s*<\/loc>/g)].map((m) => unent(m[2]) || '/');
locs.forEach((l) => {
  const clean = l.split(/[?#]/)[0], sp = stripPrefix(clean), dec = sp === null ? null : decode(sp);
  if (sp === null) return problems.push('sitemap URL is outside the BASE_URL path (' + prefix + '): ' + l);
  if (dec === null) return problems.push('sitemap URL has malformed percent-encoding: ' + l);
  if (!resolveFile(dec) && !resolveFile(dec.replace(/\/$/, '') + '.html')) problems.push('sitemap URL has no file: ' + l);
});

const idCache = new Map();
const idsOf = (file) => { if (!idCache.has(file)) { const s = fs.readFileSync(file, 'utf8'), ids = new Set(); for (const m of s.matchAll(/\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi)) ids.add(m[1] || m[2] || m[3]); idCache.set(file, ids); } return idCache.get(file); };

const refs = (s) => {
  const out = [];
  /* JavaScript is not markup: drop the body of every <script> (keeping the tag, so src= is still checked) before the attribute scan. */
  s = s.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script\s*>)/gi, '$1$2');
  for (const m of s.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi)) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  for (const m of s.matchAll(/\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) (m[1] || m[2] || '').split(',').forEach((c) => { const u = c.trim().split(/\s+/)[0]; if (u) out.push(u); });
  for (const m of s.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s"']+))\s*\)/gi)) out.push(m[1] || m[2] || m[3]);
  return out;
};

let pages = 0, links = 0;
(function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) return walk(fp);
    if (!e.name.endsWith('.html')) return;
    pages++;
    const rel = path.relative(site, fp).split(path.sep).join('/'), s = fs.readFileSync(fp, 'utf8');
    refs(s).forEach((raw) => {
      const h = unent(String(raw || '').trim());
      if (!h || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(h)) return;
      const hashAt = h.indexOf('#'), frag = hashAt >= 0 ? h.slice(hashAt + 1) : '', noHash = hashAt >= 0 ? h.slice(0, hashAt) : h, p0 = noHash.split('?')[0];
      if (!p0) { if (checkFragments && frag && !idsOf(fp).has(decode(frag) || frag)) problems.push(rel + ' -> #' + frag + ' (no such id on this page)'); return; }
      links++;
      const base = p0.startsWith('/') ? null : path.posix.dirname('/' + rel).split('/').filter(Boolean);
      let rootRel = p0;
      if (p0.startsWith('/')) { const sp = stripPrefix(p0); if (sp === null) return problems.push(rel + ' -> ' + h + ' (root-absolute link outside BASE_URL path)'); rootRel = sp; }
      const stack = base ? base.slice() : [], trailing = /\/$/.test(rootRel);
      let escaped = false;
      rootRel.split('/').forEach((seg) => { if (!seg || seg === '.') return; if (seg === '..') { if (!stack.length) escaped = true; else stack.pop(); } else stack.push(seg); });
      if (escaped) return problems.push(rel + ' -> ' + h + ' (resolves outside the upload folder)');
      const norm = '/' + stack.join('/') + (trailing && stack.length ? '/' : '');
      const dec = decode(norm);
      if (dec === null) return problems.push(rel + ' -> ' + h + ' (malformed percent-encoding)');
      const file = resolveFile(dec);
      if (!file) return problems.push(rel + ' -> ' + h);
      if (checkFragments && frag && file.endsWith('.html') && !idsOf(file).has(decode(frag) || frag)) problems.push(rel + ' -> ' + h + ' (no such id on the target page)');
    });
  });
})(site);

const byTarget = {};
problems.forEach((p) => { const k = p.includes(' -> ') ? p.split(' -> ')[1] : p; (byTarget[k] = byTarget[k] || []).push(p); });
if (problems.length) {
  console.error('Site link guard FAILED: ' + problems.length + ' problem(s) across ' + Object.keys(byTarget).length + ' target(s)');
  Object.keys(byTarget).slice(0, 20).forEach((k) => console.error('  ' + k + ' (' + byTarget[k].length + ' reference(s); first: ' + byTarget[k][0] + ')'));
  process.exit(1);
}
console.log('Site link guard passed: ' + locs.length + ' sitemap URLs, ' + pages + ' pages, ' + links + ' internal links all resolve in ' + site + (checkFragments ? ' (fragments checked)' : ''));
