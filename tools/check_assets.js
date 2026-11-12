#!/usr/bin/env node
/* Upload-set guard. Usage: node tools/check_assets.js <folder> [--production]   (exit code 1 if a file the site depends on is missing)
   check_deploy.js validates the built pages; this validates what is actually in the folder that gets uploaded:
   every file in the service worker SHELL (one 404 makes cache.addAll reject, so the offline cache never installs),
   --production also fails if index.html has no canonical (the folder is the committed tree, not a production build).
   every manifest icon, and every root-level file named in the head of index.html and 404.html. */
const fs = require('fs'), path = require('path');

function missing(dir, opts) {
  opts = opts || {};
  const out = [], need = new Set(), read = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch (e) { return null; } };
  const sw = read('sw.js');
  if (sw === null) out.push('sw.js is missing');
  else {
    const m = sw.match(/const SHELL = \[([\s\S]*?)\];/);
    if (!m) out.push('sw.js has no SHELL list');
    else [...m[1].matchAll(/'\.\/([^']*)'/g)].forEach((x) => { if (x[1] && !/\/$/.test(x[1])) need.add(x[1]); });
  }
  const mf = read('manifest.webmanifest');
  if (mf === null) out.push('manifest.webmanifest is missing');
  else { try { (JSON.parse(mf).icons || []).forEach((i) => need.add(String(i.src).replace(/^\.\//, ''))); } catch (e) { out.push('manifest.webmanifest does not parse'); } }
  ['index.html', '404.html'].forEach((f) => {
    const h = read(f); if (h === null) { out.push(f + ' is missing'); return; }
    [...h.matchAll(/\b(?:href|src)="([^"#?:]+)"/g)].forEach((x) => { if (!/^(\/|\.\.)/.test(x[1]) && x[1].indexOf('/') < 0 && /\.(png|svg|js|webmanifest|ico)$/.test(x[1])) need.add(x[1]); });
  });
  if (opts.production) {
    /* The committed tree has no canonical, og:url or JSON-LD on purpose. Uploading it as it is would publish pages without them. */
    const ix = read('index.html');
    if (ix !== null && !/<link rel="canonical" href="https:\/\//.test(ix)) out.push('index.html has no canonical link: this is the committed tree, not a production build (run BASE_URL=https://yourdomain node tools/build_pages.js first)');
    if (read('sitemap.xml') === null) out.push('sitemap.xml is missing');
  }
  need.forEach((f) => { if (!fs.existsSync(path.join(dir, f))) out.push(f + ' is missing'); });
  return out;
}
module.exports = { missing };
if (require.main === module) {
  const args = process.argv.slice(2), production = args.indexOf('--production') >= 0, dir = path.resolve(args.filter((x) => x[0] !== '-')[0] || path.join(__dirname, '..')), p = missing(dir, { production });
  if (p.length) { console.error('UPLOAD SET INCOMPLETE (' + p.length + '):\n  ' + p.join('\n  ')); process.exit(1); }
  console.log('Upload set complete: every file the service worker, manifest and page heads need is present in ' + dir);
}
