#!/usr/bin/env node
/* Deploy guard (conversion pages in pages/, calculator pages in calculators/<slug>/). Run after `BASE_URL=https://your.domain[/subpath] node tools/build_pages.js`.
   Usage: BASE_URL=https://your.domain node tools/check_deploy.js [dir]     (exit code 1 if the site is not launch-ready)
   Set REQUIRE_LASTMOD=1 to also require that the sitemap carries per-page lastmod dates (the Pages workflow does; tools/add_lastmod.js adds them,
   and leaves a URL undated when no real date is known, so not every URL needs one).
   Confirms: https base address, canonical + og:url on every page, parsable JSON-LD, sitemap lists every page, robots.txt declares it. */
const fs = require('fs'), path = require('path');

function check(files, baseRaw, opts) {
  opts = opts || {};
  const problems = [], base = String(baseRaw || '').replace(/\/$/, '');
  if (!/^https:\/\/[^/\s]+(\/[^\s]*)?$/.test(base)) { problems.push('BASE_URL must be a full https address, e.g. https://yourdomain.com (got "' + (baseRaw || '') + '")'); return problems; }
  if (/(^|\.)example\.(com|org|net)(\/|$)|localhost|127\.0\.0\.1/.test(base.replace(/^https:\/\//, ''))) { problems.push('BASE_URL is a placeholder or local address: ' + base); return problems; }
  /* Calculator pages live at calculators/<slug>/index.html and are served at the clean URL calculators/<slug>/ */
  const urlOf = (f) => f === 'index.html' ? base + '/' : base + '/' + (/^(calculators\/([^/]+\/)?|categories\/([^/]+\/)?|technical-library\/((category\/[^/]+|technical-articles)\/)?)index\.html$/.test(f) ? f.slice(0, -'index.html'.length) : f);
  const fileOf = (u) => { const r = u.slice(base.length + 1); if (r === '') return 'index.html'; return /^(calculators\/([^/]+\/)?|categories\/([^/]+\/)?|technical-library\/((category\/[^/]+|technical-articles)\/)?)$/.test(r) ? r + 'index.html' : r; };
  const pageFiles = Object.keys(files).filter((f) => /^(index\.html|pages\/[^/]+\.html|converters\/[^/]+\.html|calculators\/([^/]+\/)?index\.html|categories\/([^/]+\/)?index\.html|technical-library\/((category\/[^/]+|technical-articles)\/)?index\.html)$/.test(f));
  /* Redirect pages (a moved calculator's old address) are noindex, outside the sitemap and exempt from the page checks; each must point at a file that exists. */
  const isRedirect = (f) => /data-redirect="/.test(files[f] || '');
  pageFiles.filter(isRedirect).forEach((f) => { const t = (files[f].match(/data-redirect="([^"]+)"/) || [])[1]; if (!t || !files['calculators/' + t + '/index.html']) problems.push(f + ': redirect target calculators/' + t + '/ has no page'); if (!/<meta name="robots" content="noindex">/.test(files[f])) problems.push(f + ': redirect page must be noindex'); });
  for (let i = pageFiles.length - 1; i >= 0; i--) if (isRedirect(pageFiles[i])) pageFiles.splice(i, 1);
  /* Coming-soon hubs (tools/future_hubs.js) are planned-tool pages: they must be noindex and must NOT be in the sitemap. They still get the canonical, og and JSON-LD checks below. */
  const isSoon = (f) => /<body data-coming-soon="/.test(files[f] || '');
  pageFiles.filter(isSoon).forEach((f) => { if (!/<meta name="robots" content="noindex[^"]*">/.test(files[f])) problems.push(f + ': a coming-soon page must be noindex'); if ((files['sitemap.xml'] || '').indexOf('<loc>' + urlOf(f) + '</loc>') >= 0) problems.push(f + ': a coming-soon page must not be in sitemap.xml'); });
  /* Category landing pages (tools/build_categories.js): a category page is in the sitemap exactly when it is indexable (no noindex), so a thin plan page never competes in search. */
  pageFiles.filter((f) => /^categories\//.test(f)).forEach((f) => { const noidx = /<meta name="robots" content="noindex[^"]*">/.test(files[f]), inMap = (files['sitemap.xml'] || '').indexOf('<loc>' + urlOf(f) + '</loc>') >= 0;
    if (noidx && inMap) problems.push(f + ': a noindex category page must not be in sitemap.xml'); if (!noidx && !inMap) problems.push(f + ': an indexable category page must be in sitemap.xml'); });
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
        else if (h.indexOf('<h2>Frequently Asked Questions</h2>') > 0 && f !== 'index.html' && !/^technical-library\//.test(f) && !isSoon(f)) {
          /* The home page and the Technical Library have an FAQ among many other H3 sections and carry no FAQPage markup; every calculator, conversion and directory page does. */
          /* The visible FAQ and the FAQPage markup must be the same questions. */
          const fq = j['@graph'].find((x) => x['@type'] === 'FAQPage'), shown = (h.slice(h.indexOf('<h2>Frequently Asked Questions</h2>')).split(/<h2>/)[1] || '').split('</h2>').slice(1).join('').match(/<h3>/g)?.length || 0; /* only the questions in the FAQ section itself: a page may carry other H3 sections */
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
    pageFiles.forEach((f) => { if (!isSoon(f) && !(/^categories\//.test(f) && /<meta name="robots" content="noindex[^"]*">/.test(files[f])) && locs.indexOf(urlOf(f)) < 0) problems.push('sitemap.xml does not list ' + f); });
    locs.forEach((u) => { if (u.indexOf(base + '/') !== 0 || !files[fileOf(u)]) problems.push('sitemap.xml lists a URL with no file: ' + u); });
    if (opts.requireLastmod) {
      /* tools/add_lastmod.js gives each URL the date of its own last commit and leaves a URL undated when it has none. If no URL has a date, that step did not run. */
      const lms = [...sm.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)];
      if (!lms.length) problems.push('sitemap.xml has no lastmod at all (REQUIRE_LASTMOD is set; did node tools/add_lastmod.js run after the build?)');
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
  const td = path.join(dir, 'technical-library');
  if (fs.existsSync(path.join(td, 'index.html'))) files['technical-library/index.html'] = fs.readFileSync(path.join(td, 'index.html'), 'utf8');
  if (fs.existsSync(path.join(td, 'technical-articles', 'index.html'))) files['technical-library/technical-articles/index.html'] = fs.readFileSync(path.join(td, 'technical-articles', 'index.html'), 'utf8');
  const tc = path.join(td, 'category');
  if (fs.existsSync(tc)) fs.readdirSync(tc, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(tc, d.name, 'index.html'))).forEach((d) => { files['technical-library/category/' + d.name + '/index.html'] = fs.readFileSync(path.join(tc, d.name, 'index.html'), 'utf8'); });
  const cd = path.join(dir, 'calculators');
  if (fs.existsSync(cd)) {
    if (fs.existsSync(path.join(cd, 'index.html'))) files['calculators/index.html'] = fs.readFileSync(path.join(cd, 'index.html'), 'utf8');
    fs.readdirSync(cd, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(cd, d.name, 'index.html'))).forEach((d) => { files['calculators/' + d.name + '/index.html'] = fs.readFileSync(path.join(cd, d.name, 'index.html'), 'utf8'); });
  }
  const kd = path.join(dir, 'categories');
  if (fs.existsSync(kd)) {
    if (fs.existsSync(path.join(kd, 'index.html'))) files['categories/index.html'] = fs.readFileSync(path.join(kd, 'index.html'), 'utf8');
    fs.readdirSync(kd, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(kd, d.name, 'index.html'))).forEach((d) => { files['categories/' + d.name + '/index.html'] = fs.readFileSync(path.join(kd, d.name, 'index.html'), 'utf8'); });
  }
  return files;
}
/* Site details a public launch must not leave unset (tools/site_info.json). Returns a list of problems. */
function siteInfoProblems(info) {
  const p = [], i = info || {};
  if (!String(i.operator_name || '').trim()) p.push('tools/site_info.json: operator_name is empty, so the footer, terms and privacy pages name no operator');
  if (!String(i.operator_location || '').trim()) p.push('tools/site_info.json: operator_location is empty, so the terms and privacy pages give no location');
  if (!String(i.contact_email || '').trim()) p.push('tools/site_info.json: contact_email is empty');
  if (i.public_disclosure_approved !== true) p.push('tools/site_info.json: public_disclosure_approved is not true, so the operator, author and location shown on public pages have not been approved for public disclosure');
  return p;
}
function draftMarkerProblems(files) {
  const out = [];
  Object.keys(files).filter((f) => /\.html$/.test(f)).forEach((f) => { if (/<!--\s*DRAFT\b/i.test(String(files[f]))) out.push(f + ': contains a DRAFT marker comment, so legal review has not been signed off'); });
  return out;
}
module.exports = { check, readDir, siteInfoProblems, draftMarkerProblems };
if (require.main === module) {
  const dir = path.resolve(process.argv[2] || path.join(__dirname, '..')), files = readDir(dir), p = check(files, process.env.BASE_URL, { requireLastmod: process.env.REQUIRE_LASTMOD === '1' });
  if (!fs.existsSync(path.join(dir, 'og-image.png'))) p.push('og-image.png is missing (run python3 tools/make_og_image.py)');
  /* A staging build may set ALLOW_UNSET_SITE_INFO=1 to skip the operator and contact checks. Never set it for the public site. */
  if (process.env.ALLOW_UNSET_SITE_INFO !== '1') siteInfoProblems(JSON.parse(fs.readFileSync(path.join(__dirname, 'site_info.json'), 'utf8'))).forEach((m) => p.push(m));
  else console.warn('WARNING: ALLOW_UNSET_SITE_INFO=1, so operator and contact details were not checked. Do not use this for the public site.');
  /* Legal pages carry a hidden DRAFT comment until a lawyer has approved the wording. Remove the comment (tools/build_pages.js) only after that review. A staging build may set ALLOW_DRAFT_LEGAL=1. Never set it for the public site. */
  if (process.env.ALLOW_DRAFT_LEGAL !== '1') draftMarkerProblems(files).forEach((m) => p.push(m));
  else console.warn('WARNING: ALLOW_DRAFT_LEGAL=1, so draft markers on the legal pages were not checked. Do not use this for the public site.');
  if (p.length) { console.error('NOT LAUNCH-READY (' + p.length + ' problem' + (p.length > 1 ? 's' : '') + '):\n  ' + p.slice(0, 40).join('\n  ')); process.exit(1); }
  console.log('Launch-ready: ' + Object.keys(files).filter((f) => /\.html$/.test(f)).length + ' pages carry canonical, og:url and JSON-LD; sitemap.xml and robots.txt are consistent for ' + process.env.BASE_URL);
}
