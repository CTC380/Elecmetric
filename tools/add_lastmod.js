#!/usr/bin/env node
/* Per-page <lastmod> for the production sitemap.
   Usage: BASE_URL=https://your.domain node tools/add_lastmod.js [sitemap.xml]      (run after build_pages.js, before check_deploy.js)
   Each URL gets the date of the last Git commit that changed ITS OWN file (index.html, pages/x.html, calculators/<slug>/index.html, ...),
   so a commit that touches one page does not make every page look newly updated. A URL whose file has no Git history, or whose date is
   not a plausible YYYY-MM-DD, gets no <lastmod> at all: a missing date is accurate, a guessed one is not. Refuses to run on a shallow
   clone, where every file would take the date of the single commit that was checked out (the workflow uses fetch-depth: 0).
   The committed pages are generated, so a file's last commit is the last time its generated content changed. */
const fs = require('fs'), path = require('path'), cp = require('child_process');

const DAY = 86400000;
const okDate = (d, now) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)) && Date.parse(d) <= (now || Date.now()) + DAY;

/* The file a sitemap URL is served from (same rule as tools/check_deploy.js). */
function fileOf(url, base) {
  base = String(base || '').replace(/\/$/, '');
  if (url.indexOf(base + '/') !== 0) return null;
  const r = url.slice(base.length + 1);
  if (r === '') return 'index.html';
  return /\/$/.test(r) ? r + 'index.html' : r;
}

/* sitemap xml in, sitemap xml out, with one <lastmod> per URL that has a trustworthy date; any existing <lastmod> is replaced. */
function apply(xml, base, dateByFile, now) {
  let withDate = 0, total = 0; const seen = new Set();
  const out = xml.replace(/<url>([\s\S]*?)<\/url>/g, (m, inner) => {
    const loc = (inner.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) return m;
    total++;
    const f = fileOf(loc, base), d = f && dateByFile[f];
    const keep = '<loc>' + loc + '</loc>';
    if (d && okDate(d, now)) { withDate++; seen.add(d); return '<url>' + keep + '<lastmod>' + d + '</lastmod></url>'; }
    return '<url>' + keep + '</url>';
  });
  return { xml: out, total, withDate, distinct: seen.size };
}

/* newest committed date (YYYY-MM-DD) of every tracked file, from one pass over the history */
function gitDates(cwd) {
  const git = (args) => cp.execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
  if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') throw new Error('this is a shallow clone, so file dates would all equal one commit date; fetch the full history (actions/checkout with fetch-depth: 0)');
  const dates = {}; let cur = '';
  git(['log', '--no-renames', '--format=@%cs', '--name-only']).split('\n').forEach((line) => {
    if (!line) return;
    if (line[0] === '@') { cur = line.slice(1); return; }
    if (!(line in dates)) dates[line] = cur;     /* newest first, so the first sighting is the latest change */
  });
  return dates;
}

module.exports = { apply, fileOf, gitDates, okDate };

if (require.main === module) {
  const file = path.resolve(process.argv[2] || 'sitemap.xml'), base = process.env.BASE_URL;
  if (!/^https:\/\//.test(base || '')) { console.error('BASE_URL must be set to the https address the sitemap was built for'); process.exit(1); }
  let dates;
  try { dates = gitDates(path.dirname(file)); } catch (e) { console.error('add_lastmod: ' + e.message); process.exit(1); }
  const r = apply(fs.readFileSync(file, 'utf8'), base, dates);
  if (!r.withDate) { console.error('add_lastmod: no URL could be dated from Git history, so the sitemap would have no lastmod at all'); process.exit(1); }
  fs.writeFileSync(file, r.xml);
  console.log('lastmod: ' + r.withDate + ' of ' + r.total + ' URLs dated from their own last commit (' + r.distinct + ' distinct date' + (r.distinct === 1 ? '' : 's') + '); the other ' + (r.total - r.withDate) + ' have no lastmod' + (r.distinct === 1 && r.total > 1 ? '. WARNING: every dated URL has the same date, which is normal only for a repository with a single commit' : ''));
}
