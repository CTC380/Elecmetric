/* Client for /calculators/all-tools/. Inlined by tools/build_all_tools.js inside (function(){ var D=document; var L={...lookup}; ... })().
   The cards are already in the page as plain links with data-* attributes; this only shows, hides, orders and pages them. */
var list = D.getElementById('tlist'), cards = Array.prototype.slice.call(list.children);
var st = { q: '', m: '', c: '', s: '', t: '', y: '', k: '', a: '', b: '', g: '', sort: 'rel', page: 1 };
var $ = function (id) { return D.getElementById(id); };
var el = { q: $('tq'), main: $('tmain'), cat: $('tcat'), fams: $('tfams'), sub: $('tsub'), subw: $('tsubw'), task: $('ttask'), sort: $('tsort'), app: $('tapp'), basis: $('tbasis'), std: $('tstd'),
  count: $('tcount'), prev: $('tprev'), next: $('tnext'), pos: $('tpos'), reset: $('treset'), panel: $('fpanel'), toggle: $('ftoggle'), more: $('more') };
var catName = {}, subName = {}, famName = {};
L.cats.forEach(function (c) { catName[c[0]] = c[1]; });
L.subs.forEach(function (s) { subName[s[0]] = s[2]; });
L.fams.forEach(function (f) { famName[f[0]] = f[1]; });
var recs = cards.map(function (li, i) {
  var d = li.dataset;
  return { li: li, i: i, m: d.m, y: d.y, c: d.c, s: d.s, t: d.t, k: d.k, a: d.a ? d.a.split('|') : [], b: d.b, g: d.g, n: d.n, q: ' ' + d.q };
});
function tokens(q) { return q.toLowerCase().split(/[^a-z0-9\u00b2\u00b5.%]+/).filter(Boolean); }
/* A tool matches when every search word appears in its text; a word at the start of a word, or in the name, scores higher. */
function score(r, toks) {
  if (!toks.length) return 0;
  var sc = 0;
  for (var j = 0; j < toks.length; j++) {
    var t = toks[j], inQ = r.q.indexOf(t) >= 0;
    if (!inQ) return -1;
    if (r.n.indexOf(t) === 0) sc += 12; else if (r.n.indexOf(' ' + t) >= 0) sc += 9; else if (r.n.indexOf(t) >= 0) sc += 6;
    if (r.q.indexOf(' ' + t) >= 0) sc += 3; else sc += 1;
  }
  if (r.n === toks.join(' ')) sc += 20;
  return sc;
}
function pass(r, s, skip) {
  if (skip !== 'm' && s.m && r.m !== s.m) return false;
  if (skip !== 'y' && s.y && r.y !== s.y) return false;
  if (skip !== 'c' && s.c && r.c !== s.c) return false;
  if (skip !== 's' && s.s && r.s !== s.s) return false;
  if (skip !== 't' && s.t && r.t !== s.t) return false;
  if (skip !== 'k' && s.k && r.k !== s.k) return false;
  if (skip !== 'a' && s.a && r.a.indexOf(s.a) < 0) return false;
  if (skip !== 'b' && s.b && r.b !== s.b) return false;
  if (skip !== 'g' && s.g && r.g !== s.g) return false;
  return true;
}
function opt(sel, value, text, selected) { var o = D.createElement('option'); o.value = value; o.textContent = text; if (selected) o.selected = true; sel.appendChild(o); }
function fillSelect(sel, all, values, cur, counts) {
  sel.innerHTML = '';
  opt(sel, '', all, !cur);
  values.forEach(function (v) { var n = counts[v[0]] || 0; opt(sel, v[0], v[1] + ' (' + n + ')', cur === v[0]); });
}
function tally(key, skip, toks) {
  var c = {};
  recs.forEach(function (r) {
    if (!pass(r, st, skip)) return;
    if (toks.length && score(r, toks) < 0) return;
    var v = key === 'a' ? r.a : [r[key]];
    v.forEach(function (x) { if (x) c[x] = (c[x] || 0) + 1; });
  });
  return c;
}
function chips(host, items, key, cur, counts, label) {
  host.innerHTML = '';
  var all = D.createElement('button'); all.type = 'button'; all.textContent = label; all.setAttribute('aria-pressed', cur ? 'false' : 'true'); all.setAttribute('data-v', ''); host.appendChild(all);
  items.forEach(function (it) {
    var n = counts[it[0]] || 0, b = D.createElement('button'); b.type = 'button'; b.setAttribute('data-v', it[0]);
    b.textContent = it[1] + ' (' + n + ')'; b.setAttribute('aria-pressed', cur === it[0] ? 'true' : 'false');
    if (!n && cur !== it[0]) b.disabled = true; host.appendChild(b);
  });
}
var lastKey = '';
function render(keepPage) {
  var toks = tokens(st.q), key = JSON.stringify([st.q, st.m, st.y, st.c, st.s, st.t, st.k, st.a, st.b, st.g, st.sort]);
  if (!keepPage && key !== lastKey) st.page = 1; lastKey = key;
  var hits = [];
  recs.forEach(function (r) { if (!pass(r, st)) return; var sc = score(r, toks); if (sc >= 0) hits.push({ r: r, sc: sc }); });
  if (st.sort === 'az') hits.sort(function (x, y) { return x.r.n < y.r.n ? -1 : x.r.n > y.r.n ? 1 : x.r.i - y.r.i; });
  else if (st.sort === 'za') hits.sort(function (x, y) { return x.r.n < y.r.n ? 1 : x.r.n > y.r.n ? -1 : x.r.i - y.r.i; });
  else if (toks.length) hits.sort(function (x, y) { return y.sc - x.sc || x.r.i - y.r.i; });
  else hits.sort(function (x, y) { return x.r.i - y.r.i; });
  var pages = Math.max(1, Math.ceil(hits.length / L.per)); if (st.page > pages) st.page = pages;
  var from = (st.page - 1) * L.per, to = from + L.per, frag = D.createDocumentFragment(), shown = {};
  hits.slice(from, to).forEach(function (h) { shown[h.r.i] = 1; });
  hits.forEach(function (h) { frag.appendChild(h.r.li); });
  recs.forEach(function (r) { r.li.hidden = !shown[r.i]; });
  /* Cards that did not match go after the matches, hidden, so the list order is the result order. */
  var rest = recs.filter(function (r) { return !hits.some(function (h) { return h.r === r; }); });
  hits.length && rest.forEach(function (r) { frag.appendChild(r.li); });
  if (!hits.length) rest = recs, rest.forEach(function (r) { frag.appendChild(r.li); });
  list.appendChild(frag);
  var old = D.getElementById('tnone'); if (old) old.remove();
  if (!hits.length) { var p = D.createElement('li'); p.id = 'tnone'; p.className = 'tnone'; p.textContent = 'No tools match. Remove a filter or try a shorter search.'; list.insertBefore(p, list.firstChild); }
  /* Controls: counts are for the other filters as they stand now, so a choice never leads to an empty list by surprise. */
  fillSelect(el.main, 'All subject areas', L.mains, st.m, tally('m', 'm', toks));
  fillSelect(el.cat, 'All disciplines', L.cats, st.c, tally('c', 'c', toks));
  chips(el.fams, L.types, 'y', st.y, tally('y', 'y', toks), 'All types');
  var sc = tally('s', 's', toks), subs = L.subs.filter(function (s) { return s[1] === st.c; });
  el.subw.hidden = !st.c; if (st.c) fillSelect(el.sub, 'All subcategories', subs.map(function (s) { return [s[0], s[2]]; }), st.s, sc);
  var kc = tally('k', 'k', toks); fillSelect(el.task, 'All tasks', L.tasks.map(function (k) { return [k, k]; }), st.k, kc);
  var ac = tally('a', 'a', toks); fillSelect(el.app, 'All applications', L.apps.map(function (k) { return [k, k]; }), st.a, ac);
  var bc = tally('b', 'b', toks); fillSelect(el.basis, 'Any basis', L.basis.map(function (k) { return [k, k]; }), st.b, bc);
  var gc = tally('g', 'g', toks); fillSelect(el.std, 'Any', [['Applicable', 'Standard identified'], ['Not applicable', 'No governing standard']], st.g, gc);
  el.sort.value = st.sort;
  var active = ['m', 'c', 's', 'y', 'k', 'a', 'b', 'g'].filter(function (k) { return st[k]; }).length;
  el.toggle.textContent = 'Filters' + (active ? ' (' + active + ')' : '');
  el.count.textContent = hits.length === recs.length ? hits.length + ' tools' + (hits.length > L.per ? ', showing ' + (from + 1) + ' to ' + Math.min(to, hits.length) : '') : hits.length + (hits.length === 1 ? ' tool matches' : ' tools match') + (hits.length > L.per ? ', showing ' + (from + 1) + ' to ' + Math.min(to, hits.length) : '');
  el.pos.textContent = 'Page ' + st.page + ' of ' + pages; el.prev.disabled = st.page <= 1; el.next.disabled = st.page >= pages;
  el.prev.parentNode.hidden = pages <= 1;
}
/* Entry links only: ?q=cable (from the home page search) pre-fills the search box. Filter states are never written back to the address, so no combination creates another indexable URL (checked by tests/run_tests.js). */
function readUrl() { try { var v = new URLSearchParams(location.search).get('q'); if (v) { st.q = v.slice(0, 80); el.q.value = st.q; } } catch (e) {} }
function go(keepPage) { render(keepPage); }
var timer;
el.q.addEventListener('input', function () { st.q = el.q.value; clearTimeout(timer); timer = setTimeout(function () { go(); }, 120); });
el.q.addEventListener('keydown', function (e) { if (e.key === 'Escape') { el.q.value = ''; st.q = ''; go(); } });
function chipClick(key) { return function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; st[key] = b.getAttribute('data-v'); if (key === 'c') st.s = ''; go(); }; }
el.fams.addEventListener('click', chipClick('y'));
[['main', 'm'], ['cat', 'c'], ['sub', 's'], ['task', 'k'], ['app', 'a'], ['basis', 'b'], ['std', 'g'], ['sort', 'sort']].forEach(function (p) { el[p[0]].addEventListener('change', function () { st[p[1]] = el[p[0]].value; if (p[1] === 'c') st.s = ''; go(); }); });
el.reset.addEventListener('click', function () { st = { q: '', m: '', c: '', s: '', t: '', y: '', k: '', a: '', b: '', g: '', sort: 'rel', page: 1 }; el.q.value = ''; go(); });
function turn(d) { return function () { st.page += d; render(true); el.count.focus(); el.count.scrollIntoView({ block: 'start' }); }; }
el.prev.addEventListener('click', turn(-1)); el.next.addEventListener('click', turn(1));
el.toggle.addEventListener('click', function () { var o = el.panel.classList.toggle('open'); el.toggle.setAttribute('aria-expanded', o ? 'true' : 'false'); });
readUrl();
go();
