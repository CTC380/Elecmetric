#!/usr/bin/env node
/* Deploy guard (conversion pages in pages/, calculator pages in calculators/<slug>/). Run after `BASE_URL=https://your.domain[/subpath] node tools/build_pages.js`.
   Usage: BASE_URL=https://your.domain node tools/check_deploy.js [dir]     (exit code 1 if the site is not launch-ready)
   Set REQUIRE_LASTMOD=1 to also require a lastmod on every sitemap URL (the Pages workflow does).
   Confirms: https base address, canonical + og:url on every page, parsable JSON-LD, sitemap lists every page, robots.txt declares it. */
const fs = require('fs'), path = require('path');

function check(files, baseRaw, opts) {
  opts = opts || {};
  const problems = [], base = String(baseRaw || '').replace(/\/$/, '');
  if (!/^https:\/\/[^/\s]+(\/[^\s]*)?$/.test(base)) { problems.push('BASE_URL must be a full https address, e.g. https://yourdomain.com (got "' + (baseRaw || '') + '")'); return problems; }
  if (/(^|\.)example\.(com|org|net)(\/|$)|localhost|127\.0\.0\.1/.test(base.replace(/^https:\/\//, ''))) { problems.push('BASE_URL is a placeholder or local address: ' + base); return problems; }
  /* Calculator pages live at calculators/<slug>/index.html and are served at the clean URL calculators/<slug>/ */
  const urlOf = (f) => f === 'index.html' ? base + '/' : base + '/' + (/^calculators\/([^/]+\/)?index\.html$/.test(f) ? f.slice(0, -'index.html'.length) : f);
  const fileOf = (u) => { const r = u.slice(base.length + 1); if (r === '') return 'index.html'; return /^calculators\/([^/]+\/)?$/.test(r) ? r + 'index.html' : r; };
  const pageFiles = Object.keys(files).filter((f) => /^(index\.html|pages\/[^/]+\.html|converters\/[^/]+\.html|calculators\/([^/]+\/)?index\.html)$/.test(f));
  if (!files['index.html']) problems.push('index.html is missing');
  pageFiles.forEach((f) => {
    const h = files[f], url = urlOf(f);
    const can = h.match(/<link rel="canonical" href="([^"]*)">/), og = h.match(/<meta property="og:url" content="([^"]*)">/), ld = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!can) problems.push(f + ': canonical link missing');
    else if (can[1] !== url) problems.push(f + ': canonical is ' + can[1] + ', expected ' + url);
    if (!og) problems.push(f + ': og:url missing'); else if (og[1] !== (can && can[1])) problems.push(f + ': og:url differs from canonical');
    if (!ld) problems.push(f + ': JSON-LD missing');
    else {
      try {
        const j = JSON.parse(ld[1].replace(/\\u003c/g, '<'));
        if (!j['@context'] || !j['@graph'] || !j['@graph'].length) problems.push(f + ': JSON-LD has no @graph');
        else if (h.indexOf('Frequently asked questions') > 0) {
          /* The visible FAQ and the FAQPage markup must be the same questions. */
          const fq = j['@graph'].find((x) => x['@type'] === 'FAQPage'), shown = (h.match(/<h3>/g) || []).length;
          if (!fq) problems.push(f + ': has a visible FAQ but no FAQPage JSON-LD');
          else if (fq.mainEntity.length !== shown) problems.push(f + ': FAQPage lists ' + fq.mainEntity.length + ' questions but the page shows ' + shown);
        }
      } catch (e) { problems.push(f + ': JSON-LD does not parse'); }
    }
    const im = h.match(/<meta property="og:image" content="([^"]*)">/), ti = h.match(/<meta name="twitter:image" content="([^"]*)">/);
    if (!im || im[1] !== base + '/og-image.png') problems.push(f + ': og:image missing or not ' + base + '/og-image.png');
    if (!ti || ti[1] !== base + '/og-image.png') problems.push(f + ': twitter:image missing or not ' + base + '/og-image.png');
    if ((h.match(/rel="canonical"/g) || []).length > 1) problems.push(f + ': more than one canonical link');
  });
  ['privacy.html', 'terms.html'].forEach((f) => {
    if (!files[f]) { problems.push(f + ' is missing'); return; }
    const can = files[f].match(/<link rel="canonical" href="([^"]*)">/);
    if (!can || can[1] !== base + '/' + f) problems.push(f + ': canonical missing or not ' + base + '/' + f);
  });
  const sm = files['sitemap.xml'];
  if (!sm) problems.push('sitemap.xml is missing');
  else {
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (new Set(locs).size !== locs.length) problems.push('sitemap.xml has duplicate URLs');
    pageFiles.forEach((f) => { if (locs.indexOf(urlOf(f)) < 0) problems.push('sitemap.xml does not list ' + f); });
    locs.forEach((u) => { if (u.indexOf(base + '/') !== 0 || !files[fileOf(u)]) problems.push('sitemap.xml lists a URL with no file: ' + u); });
    if (opts.requireLastmod) {
      /* The workflow sets SITE_LASTMOD from the last commit; if that ever comes out empty the sitemap would silently lose its dates. */
      const urls = (sm.match(/<url>/g) || []).length, lms = [...sm.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)];
      if (lms.length !== urls) problems.push('sitemap.xml: ' + lms.length + ' of ' + urls + ' URLs have a lastmod (REQUIRE_LASTMOD is set; is SITE_LASTMOD empty?)');
      lms.forEach((m) => { if (Date.parse(m[1]) > Date.now() + 86400000) problems.push('sitemap.xml has a lastmod in the future: ' + m[1]); });
    }
    [...sm.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].forEach((m) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1]) || isNaN(Date.parse(m[1]))) problems.push('sitemap.xml has a bad lastmod: ' + m[1]); });
  }
  if (!files['404.html']) problems.push('404.html is missing'); else if (!/<meta name="robots" content="noindex">/.test(files['404.html'])) problems.push('404.html must be noindex');
  const rb = files['robots.txt'];
  if (!rb) problems.push('robots.txt is missing');
  else if (rb.indexOf('Sitemap: ' + base + '/sitemap.xml') < 0) problems.push('robots.txt does not declare ' + base + '/sitemap.xml');
  else if (/^\s*Disallow:\s*\/\s*$/m.test(rb)) problems.push('robots.txt blocks the whole site');
  return problems;
}

function readDir(dir) {
  const files = {};
  ['index.html', 'sitemap.xml', 'robots.txt', '404.html', 'privacy.html', 'terms.html'].forEach((f) => { const p = path.join(dir, f); if (fs.existsSync(p)) files[f] = fs.readFileSync(p, 'utf8'); });
  const pd = path.join(dir, 'pages');
  if (fs.existsSync(pd)) fs.readdirSync(pd).filter((f) => /\.html$/.test(f)).forEach((f) => { files['pages/' + f] = fs.readFileSync(path.join(pd, f), 'utf8'); });
  const vd = path.join(dir, 'converters');
  if (fs.existsSync(vd)) fs.readdirSync(vd).filter((f) => /\.html$/.test(f)).forEach((f) => { files['converters/' + f] = fs.readFileSync(path.join(vd, f), 'utf8'); });
  const cd = path.join(dir, 'calculators');
  if (fs.existsSync(cd)) {
    if (fs.existsSync(path.join(cd, 'index.html'))) files['calculators/index.html'] = fs.readFileSync(path.join(cd, 'index.html'), 'utf8');
    fs.readdirSync(cd, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(cd, d.name, 'index.html'))).forEach((d) => { files['calculators/' + d.name + '/index.html'] = fs.readFileSync(path.join(cd, d.name, 'index.html'), 'utf8'); });
  }
  return files;
}
/* Site details a public launch must not leave unset (tools/site_info.json). Returns a list of problems. */
function siteInfoProblems(info) {
  const p = [], i = info || {};
  if (!String(i.operator_name || '').trim()) p.push('tools/site_info.json: operator_name is empty, so the footer, terms and privacy pages name no operator');
  if (!String(i.operator_location || '').trim()) p.push('tools/site_info.json: operator_location is empty, so the terms and privacy pages give no location');
  if (!String(i.contact_email || '').trim()) p.push('tools/site_info.json: contact_email is empty');
  return p;
}
module.exports = { check, readDir, siteInfoProblems };
if (require.main === module) {
  const dir = path.resolve(process.argv[2] || path.join(__dirname, '..')), files = readDir(dir), p = check(files, process.env.BASE_URL, { requireLastmod: process.env.REQUIRE_LASTMOD === '1' });
  if (!fs.existsSync(path.join(dir, 'og-image.png'))) p.push('og-image.png is missing (run python3 tools/make_og_image.py)');
  /* A staging build may set ALLOW_UNSET_SITE_INFO=1 to skip the operator and contact checks. Never set it for the public site. */
  if (process.env.ALLOW_UNSET_SITE_INFO !== '1') siteInfoProblems(JSON.parse(fs.readFileSync(path.join(__dirname, 'site_info.json'), 'utf8'))).forEach((m) => p.push(m));
  else console.warn('WARNING: ALLOW_UNSET_SITE_INFO=1, so operator and contact details were not checked. Do not use this for the public site.');
  if (p.length) { console.error('NOT LAUNCH-READY (' + p.length + ' problem' + (p.length > 1 ? 's' : '') + '):\n  ' + p.slice(0, 40).join('\n  ')); process.exit(1); }
  console.log('Launch-ready: ' + Object.keys(files).filter((f) => /\.html$/.test(f)).length + ' pages carry canonical, og:url and JSON-LD; sitemap.xml and robots.txt are consistent for ' + process.env.BASE_URL);
}
