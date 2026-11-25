/* Practice 3 of the RapidTables benchmark: related-calculator navigation.
   One function decides, for every calculator in the registry, which other calculators to link and why. Pages call it; nothing here is
   written per calculator.

   Edge sources, strongest first (a thin category falls back to the neighbouring categories named in its hub, then to shared keywords):
     next     the registry's own `next` list: "what you usually do after this one" (design-chain order is kept)
     hand     links already chosen by hand in tools/calc_pages_data.js (pages and app lists)
     back     calculators whose `next` list contains this one: "what usually comes before"
     topic    same division, then same category hub, ranked by shared keywords
   Every `next` and `hand` edge is offered back to the page it came from (so if A sends you to B then B may send you back to A), but only while that page
   has room. A page gets at least MIN and at most MAX links, and that limit is applied to the FINAL list, after every reciprocal pass: a reciprocal link
   never pushes a page past MAX, and a relevant one-way link is preferred to a forced two-way one. A page that genuinely needs more is named in EXCEPTIONS
   (calculator id -> its own limit); the list is empty on purpose. */

const MIN = 6, MAX = 9;
/* Every page must stay reachable from at least this many other calculators' related lists, whatever the cap removes. */
const MIN_INBOUND = 2;
const EXCEPTIONS = {};
const limitOf = (id) => Math.max(MIN, EXCEPTIONS[id] || MAX);
const SCORE = { next: 100, hand: 80, back: 60, recip: 50, division: 30, category: 10, sibling: 6, any: 2 };
const LABEL = { next: 'next step', hand: 'next step', back: 'comes before', recip: 'related', division: 'same topic', category: 'same category', sibling: 'neighbouring category', any: 'related' };

/* renders (optional): ids of the calculators whose own page shows a Related section. Only those pages can supply an inbound link, so the reachability floor counts them alone. */
function buildRelated(E, hand, catOf, cats, renders) {
  const shows = renders ? ((R) => (id) => R.has(id))(new Set(renders)) : () => true;
  const catRel = {};
  (cats || []).forEach((k) => { catRel[k.slug] = k.related || []; });
  const ids = E.CALCS.map((c) => c.id), at = {};
  ids.forEach((id, i) => { at[id] = i; });
  const edge = {};
  ids.forEach((id) => { edge[id] = {}; });
  const add = (a, b, kind, bonus) => {
    if (a === b || !E.BY_ID[a] || !E.BY_ID[b]) return;
    const s = SCORE[kind] + (bonus || 0);
    if (!(edge[a][b] && edge[a][b].score >= s)) edge[a][b] = { id: b, kind, score: s };
  };
  const kw = (id) => new Set((E.BY_ID[id].keywords || []).map((k) => k.toLowerCase()));
  const overlap = (a, b) => { const A = kw(a); let n = 0; kw(b).forEach((k) => { if (A.has(k)) n++; }); return n; };

  ids.forEach((id) => (E.BY_ID[id].next || []).forEach((n, i) => add(id, n, 'next', -i)));
  const handCalc = {};
  hand.forEach((h) => { handCalc[h.slug] = h.calc; });
  hand.forEach((h) => {
    (h.pages || []).forEach((s, i) => add(h.calc, handCalc[s], 'hand', -i));
    (h.app || []).forEach((a, i) => add(h.calc, a, 'hand', -10 - i));
  });
  /* Reverse edges are ranked by how close the two calculators are (same division, same category, shared keywords), so when the limit has to choose between
     several "comes before" or "related" links, the technically closest ones stay. The bonus is at most 9, so a back edge never outranks a next or hand edge. */
  const near = (a, b) => (E.BY_ID[a].division === E.BY_ID[b].division ? 6 : catOf(E.BY_ID[a]) === catOf(E.BY_ID[b]) ? 3 : 0) + Math.min(3, overlap(a, b));
  ids.forEach((id) => Object.keys(edge[id]).forEach((b) => { if (edge[id][b].kind === 'next' || edge[id][b].kind === 'hand') add(b, id, 'recip', near(b, id)); }));
  ids.forEach((id) => (E.BY_ID[id].next || []).forEach((n) => add(n, id, 'back', near(n, id))));
  /* The recip edge above is the weaker of back and recip; a calculator that lists this one in `next` is labelled "comes before". */
  ids.forEach((a) => ids.forEach((b) => {
    if (a === b) return;
    const da = E.BY_ID[a].division, db = E.BY_ID[b].division;
    if (da === db) add(a, b, 'division', overlap(a, b));
    else if (catOf(E.BY_ID[a]) === catOf(E.BY_ID[b])) add(a, b, 'category', overlap(a, b));
    else if ((catRel[catOf(E.BY_ID[a])] || []).indexOf(catOf(E.BY_ID[b])) >= 0) add(a, b, 'sibling', overlap(a, b));
    else if (overlap(a, b) > 0) add(a, b, 'any', overlap(a, b));
  }));

  const out = {};
  ids.forEach((id) => {
    const all = Object.values(edge[id]).sort((x, y) => y.score - x.score || at[x.id] - at[y.id]);
    const strong = all.filter((e) => e.score >= SCORE.recip);
    const lim = limitOf(id);
    out[id] = all.slice(0, Math.max(MIN, Math.min(lim, strong.length + 3)));
  });
  /* Topic links are offered back as well, so a calculator that someone else files under "same topic" links back to it. Without this a
     thin division (one or two calculators) could be linked from almost nowhere. A link back is added only while the page has room under its
     limit: relevance decides what stays, symmetry does not. */
  ids.forEach((a) => out[a].slice().forEach((e) => {
    if (e.score >= SCORE.recip || out[e.id].some((x) => x.id === a) || out[e.id].length >= limitOf(e.id)) return;
    out[e.id].push(edge[e.id][a] || { id: a, kind: 'recip', score: SCORE.recip });
  }));
  /* Final guarantee, applied last: ranked by score, never above the page's limit, no repeats, no self-link. */
  const finish = (id) => { const seen = new Set([id]); out[id] = out[id].filter((e) => !seen.has(e.id) && seen.add(e.id)).sort((x, y) => y.score - x.score || at[x.id] - at[y.id]).slice(0, limitOf(id)); };
  ids.forEach(finish);
  /* Reachability floor. Dropping reverse links can leave a calculator listed by almost nobody. Any calculator listed by fewer than MIN_INBOUND others is added to
     the list of its closest neighbours: first one that still has room, otherwise one that gives up its weakest topic link (never a next, hand or back link, and never
     a link whose target would then fall under the floor itself). */
  const inb = {}; ids.forEach((id) => { inb[id] = 0; });
  ids.forEach((a) => { if (shows(a)) out[a].forEach((e) => { inb[e.id]++; }); });
  const weak = ids.filter((id) => shows(id) && inb[id] < MIN_INBOUND);
  weak.forEach((id) => {
    const cand = ids.filter((a) => shows(a) && a !== id && !out[a].some((e) => e.id === id)).map((a) => ({ a, s: (edge[a][id] ? edge[a][id].score : 0) + near(a, id) })).sort((x, y) => y.s - x.s || at[x.a] - at[y.a]);
    for (let i = 0; i < cand.length && inb[id] < MIN_INBOUND; i++) {
      const a = cand[i].a, e = edge[a][id] || { id, kind: 'any', score: SCORE.any };
      if (out[a].length < limitOf(a)) { out[a].push(e); inb[id]++; continue; }
      const give = out[a].filter((x) => ['division', 'category', 'sibling', 'any'].indexOf(x.kind) >= 0 && inb[x.id] > MIN_INBOUND).sort((x, y) => x.score - y.score)[0];
      if (!give || give.score >= e.score + 1000) continue;
      out[a] = out[a].filter((x) => x !== give); inb[give.id]--; out[a].push(e); inb[id]++;
    }
    finish(id);
  });
  ids.forEach(finish);
  return out;
}

module.exports = { buildRelated, LABEL, MIN, MAX, MIN_INBOUND, EXCEPTIONS, limitOf };
