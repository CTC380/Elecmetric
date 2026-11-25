/* v1.99.90: the home page must not run every calculator's tests at start-up, and its search must be backed by the generated catalogue index. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
let fails = 0, n = 0;
const K = (ok, msg) => { n++; if (!ok) { fails++; console.log('FAIL: ' + msg); } };

const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
K(!/E\.CALCS\.map\(function \(c\) \{ return E\.runTests\(c\); \}\)/.test(idx), 'home page still runs runTests for every calculator at start-up');
K(/function T\(i\)/.test(idx) && /function allTests\(\)/.test(idx), 'lazy test helpers T() and allTests() are missing');
K(/LL_VERIF\.tests|\(window\.LL_VERIF \|\| \{\}\)\.tests/.test(idx), 'home page does not read the build-time test summary');
const m = /window\.LL_VERIF=(\{[\s\S]*?\});<\/script><!--vdata:end-->/.exec(idx);
const V = m ? JSON.parse(m[1]) : null;
K(V && V.tests && V.tests.total > 0 && V.tests.passed === V.tests.total && V.tests.calcs === V.total, 'LL_VERIF.tests is missing or not consistent');

/* the summary must be what the engine really produces (fails if the committed page is stale) */
const E = require(path.join(root, 'engine.js'));
let total = 0, passed = 0; E.CALCS.forEach((c) => { const r = E.runTests(c); total += r.total; passed += r.passed; });
K(V && V.tests.total === total && V.tests.passed === passed && V.tests.engine === E.VERSION, 'build-time test summary is stale: run node tools/build_pages.js');

const sb = { window: {} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'search-index.js'), 'utf8'), sb);
const S = sb.window.LL_SEARCH;
const html = fs.readFileSync(path.join(root, 'calculators', 'all-tools', 'index.html'), 'utf8');
const cards = (html.match(/class="tcard"/g) || []).length;
K(Array.isArray(S) && S.length === cards && cards > 600, 'search index has ' + (S && S.length) + ' rows but All Tools has ' + cards + ' cards');
K(S.every((r) => r.length === 6 && r[0] && /^\/(calculators|pages|converters)\//.test(r[1])), 'a search index row is malformed');
K(S.every((r) => { const u = r[1].slice(1); const f = path.join(root, u.endsWith('/') ? u + 'index.html' : u); return fs.existsSync(f); }), 'a search index URL has no file');
K(new Set(S.map((r) => r[1])).size === S.length, 'duplicate URL in search index');
K(S.some((r) => r[4] === 0 && /ascii/i.test(r[0])) && S.some((r) => r[4] === 1), 'index should hold standalone and engine entries');
K(/search-index\.js/.test(fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8')), 'search-index.js is not in the deploy copy list');

/* v1.99.90: the home page runs without engine.js (it reads home-data.js) and loads the engine only when a calculator, workflow or search needs it. */
K(!/<script src="engine\.js"><\/script>/.test(idx) && !/rel="preload" href="engine\.js"/.test(idx), 'home page still loads engine.js eagerly');
K(/<script src="home-data\.js"><\/script>\s*<script>\s*window\.__elecBoot = function \(\)/.test(idx), 'home-data.js must load before the app script');
K(/function ensureEngine\(cb\)/.test(idx) && /ensureEngine\(go\)/.test(idx) && /if \(id !== 'home' && !ready\)/.test(idx), 'go() must load the engine for every route except home');
K(/if \(!ready\) \{ sg\.innerHTML/.test(idx), 'route() must load the engine before searching');
K(/if \(ready\) window\.Elecmetric = E;/.test(idx), 'window.Elecmetric must be the real engine only');
{ /* home-data.js must equal the registry, in order, so the stub and the real engine agree on indexes */
  const sb2 = { window: {} }; vm.createContext(sb2); vm.runInContext(fs.readFileSync(path.join(root, 'home-data.js'), 'utf8'), sb2);
  const H = sb2.window.LL_HOME;
  K(H && H.version === E.VERSION && H.calcs.length === E.CALCS.length, 'home-data.js version or length differs from the engine: run node tools/build_pages.js');
  K(H && H.calcs.every((r, i) => r[0] === E.CALCS[i].id && r[1] === E.CALCS[i].title && r[2] === E.CALCS[i].division), 'home-data.js ids, titles or divisions differ from the engine');
  const pop = /\['three-phase-current', 'voltage-drop'[^\]]*\]/.exec(idx);
  const ids = pop ? [...pop[0].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
  K(ids.length === 12 && ids.every((id) => { const r = H.calcs.filter((x) => x[0] === id)[0]; return r && r[3]; }), 'every popular calculator needs a purpose line in home-data.js');
  K(fs.statSync(path.join(root, 'home-data.js')).size < 40000, 'home-data.js should stay small (under 40 KB)');
}
{ const swSrc = fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), wf = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8'), dep = fs.readFileSync(path.join(root, 'DEPLOY.md'), 'utf8');
  const shell = [...(/const SHELL = \[([\s\S]*?)\];/.exec(swSrc) || [, ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  ['./engine.js', './search-index.js', './home-data.js'].forEach((f) => K(shell.indexOf(f) >= 0, f + ' is not in the service worker offline cache list'));
  K(/engine\.js search-index\.js home-data\.js sw\.js/.test(wf) && /engine\.js search-index\.js home-data\.js sw\.js/.test(dep), 'home-data.js is not in the deploy copy list or DEPLOY.md'); }
{ /* loader: with home-data.js the app boots at once and no engine is requested; without it the engine is loaded first, and a load error shows a message */
  const ld = idx.split('<script>').filter((x) => /The home page starts from home-data\.js/.test(x))[0].split('</script>')[0];
  let booted = 0, appended = null; const sheet = { textContent: '' };
  const mk = (win) => ({ document: { createElement: () => ({}), head: { appendChild: (e) => { appended = e; } }, getElementById: (id) => (id === 'sheet' ? sheet : null) }, window: Object.assign({ __elecBoot: () => { booted++; } }, win) });
  vm.runInNewContext(ld, mk({ LL_HOME: {} }));
  K(booted === 1 && appended === null, 'with home-data.js the app must boot at once without requesting the engine');
  booted = 0; vm.runInNewContext(ld, mk({}));
  K(appended && appended.src === 'engine.js' && booted === 0, 'without home-data.js the loader must inject engine.js and not boot yet');
  appended.onload(); K(booted === 1, 'loader must boot once after engine.js loads');
  appended.onerror(); K(/could not be loaded/.test(sheet.textContent), 'loader must show a message when engine.js fails to load');
}
console.log(fails ? fails + ' of ' + n + ' checks FAILED' : 'home_perf_search_test: ' + n + ' checks passed');
process.exit(fails ? 1 : 0);
