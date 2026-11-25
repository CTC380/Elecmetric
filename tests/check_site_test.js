#!/usr/bin/env node
/* Behavioural tests for tools/check_site.js (the site link guard). Usage: node tests/check_site_test.js
   Builds small throw-away sites in the OS temp folder and checks the guard's exit code and message for each. */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const guard = path.join(__dirname, '..', 'tools', 'check_site.js');
let total = 0, fails = 0;
const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FAIL', m); } };
function make(files, sitemapLocs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-')), site = path.join(root, 'site');
  Object.keys(files).forEach((f) => { const fp = path.join(site, f); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, files[f]); });
  fs.writeFileSync(path.join(root, 'outside.txt'), 'x');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset>' + sitemapLocs.map((l) => '<url><loc>' + l + '</loc></url>').join('') + '</urlset>');
  return { site, sm: path.join(root, 'sitemap.xml'), root };
}
function run(t, extra, env) { const r = spawnSync(process.execPath, [guard, t.site, t.sm].concat(extra || []), { encoding: 'utf8', env: Object.assign({}, process.env, { BASE_URL: '' }, env || {}) }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; }
const base = { 'index.html': '<a href="pages/a.html">a</a>', 'pages/a.html': '<h1 id="top">a</h1><a href="../index.html">home</a>', 'calculators/x/index.html': '<a href="../../pages/a.html">a</a>' };
const locs = ['https://elecmetric.com/', 'https://elecmetric.com/pages/a.html', 'https://elecmetric.com/calculators/x/'];

{ const t = make(base, locs), r = run(t); ok(r.code === 0 && /passed: 3 sitemap URLs, 3 pages/.test(r.out), 'clean site passes'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="../missing.html">m</a>' }), locs), r = run(t); ok(r.code === 1 && /missing\.html/.test(r.out), 'missing link fails'); }
{ const t = make(base, locs.concat(['https://elecmetric.com/technical-library/'])), r = run(t); ok(r.code === 1 && /technical-library/.test(r.out), 'sitemap URL with no file fails'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': "<a href='../missing.html'>m</a>" }), locs), r = run(t); ok(r.code === 1, 'single-quoted href is checked'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href=../missing.html>m</a>' }), locs), r = run(t); ok(r.code === 1, 'unquoted href is checked'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<img srcset="../a.png 1x, ../b.png 2x" src="../index.html">' }), locs), r = run(t); ok(r.code === 1 && /a\.png/.test(r.out), 'srcset candidates are checked'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<div style="background:url(\'../bg.png\')"></div>' }), locs), r = run(t); ok(r.code === 1 && /bg\.png/.test(r.out), 'CSS url() is checked'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="../../outside.txt">o</a>' }), locs), r = run(t); ok(r.code === 1 && /outside the upload folder/.test(r.out), 'link that escapes the upload folder fails even if the file exists'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="../../../../etc/hostname">o</a>' }), locs), r = run(t); ok(r.code === 1 && /outside the upload folder/.test(r.out), 'deep ../ escape fails'); }
{ const t = make(base, locs.concat(['https://elecmetric.com/pages/100%-a.html'])), r = run(t); ok(r.code === 1 && /malformed percent-encoding/.test(r.out) && !/URIError/.test(r.out), 'malformed % in sitemap is a clean failure'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="../pages/%zz.html">o</a>' }), locs), r = run(t); ok(r.code === 1 && /malformed percent-encoding/.test(r.out), 'malformed % in a link is a clean failure'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="A.html">case</a>' }), locs), r = run(t); ok(r.code === 1 && /A\.html/.test(r.out), 'lookup is case-exact on every OS'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="#top">t</a><a href="mailto:a@b.c">m</a><a href="https://x.example/">x</a><a href="//cdn.example/x.js">c</a><a href="?q=1">q</a>' }), locs), r = run(t); ok(r.code === 0, 'fragments-only, mailto, http(s), protocol-relative and query-only links are ignored'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="../index.html?x=1#y">ok</a>' }), locs), r = run(t); ok(r.code === 0, 'query and fragment are stripped before lookup'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="/pages/a.html">abs</a>' }), locs), r = run(t); ok(r.code === 0, 'root-absolute link resolves from the site root'); }
/* subpath deploy */
{ const sl = ['https://elecmetric.com/elecmetric/', 'https://elecmetric.com/elecmetric/pages/a.html'], t = make(Object.assign({}, base, { 'pages/a.html': '<a href="/elecmetric/index.html">h</a>' }), sl);
  const bad = run(t), good = run(t, [], { BASE_URL: 'https://elecmetric.com/elecmetric' });
  ok(bad.code === 1, 'subpath sitemap without BASE_URL cannot resolve (control)'); ok(good.code === 0, 'subpath deploy passes when BASE_URL carries the path'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<a href="/other/x.html">o</a>' }), ['https://elecmetric.com/elecmetric/pages/a.html']), r = run(t, [], { BASE_URL: 'https://elecmetric.com/elecmetric' }); ok(r.code === 1 && /outside BASE_URL path/.test(r.out), 'root-absolute link outside the subpath fails'); }
/* fragments */
{ const t = make(Object.assign({}, base, { 'index.html': '<a href="pages/a.html#nope">n</a>' }), locs); ok(run(t).code === 0, 'fragment ids are not checked by default'); const r = run(t, ['--fragments']); ok(r.code === 1 && /no such id/.test(r.out), '--fragments fails on a missing id'); }
{ const t = make(Object.assign({}, base, { 'index.html': '<a href="pages/a.html#top">n</a>' }), locs); ok(run(t, ['--fragments']).code === 0, '--fragments passes on an existing id'); }
/* JavaScript inside <script> is not scanned as links */
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<script>var m=/x/.exec(u);location.href = m[1] + "index.html" + m[2];a.href = URL.createObjectURL(new Blob([d]));var s=\'<a href="nowhere.html">\';</script><a href="../index.html">ok</a>' }), locs), r = run(t); ok(r.code === 0, 'JavaScript href assignments and strings inside <script> are not links'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<script src="../missing.js">var x=1;</script>' }), locs), r = run(t); ok(r.code === 1 && /missing\.js/.test(r.out), 'script src= is still checked'); }
{ const t = make(Object.assign({}, base, { 'pages/a.html': '<script>var a=1;</script><a href="../missing.html">m</a><style>.x{background:url(../bg.png)}</style>' }), locs), r = run(t); ok(r.code === 1 && /missing\.html/.test(r.out) && /bg\.png/.test(r.out), 'links and CSS url() after a script are still checked'); }
/* usage errors */
{ const t = make(base, locs); fs.rmSync(t.site, { recursive: true }); ok(run(t).code === 2, 'missing site folder exits 2'); }
console.log('check_site tests:', (total - fails) + '/' + total);
process.exit(fails ? 1 : 0);
