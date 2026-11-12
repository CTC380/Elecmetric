/* Practice 3 of the RapidTables benchmark: related-calculator navigation.
   One function decides, for every calculator in the registry, which other calculators to link and why. Pages call it; nothing here is
   written per calculator.

   Edge sources, strongest first (a thin category falls back to the neighbouring categories named in its hub, then to shared keywords):
     next     the registry's own `next` list: "what you usually do after this one" (design-chain order is kept)
     hand     links already chosen by hand in tools/calc_pages_data.js (pages and app lists)
     back     calculators whose `next` list contains this one: "what usually comes before"
     topic    same division, then same category hub, ranked by shared keywords
   Every `next` and `hand` edge is made two-way, so if A sends you to B then B sends you back to A. A page gets at least MIN and at most MAX links. */

const MIN = 6, MAX = 9;
const SCORE = { next: 100, hand: 80, back: 60, recip: 50, division: 30, category: 10, sibling: 6, any: 2 };
const LABEL = { next: 'next step', hand: 'next step', back: 'comes before', recip: 'related', division: 'same topic', category: 'same category', sibling: 'neighbouring category', any: 'related' };

function buildRelated(E, hand, catOf, cats) {
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
  ids.forEach((id) => Object.keys(edge[id]).forEach((b) => { if (edge[id][b].kind === 'next' || edge[id][b].kind === 'hand') add(b, id, 'recip'); }));
  ids.forEach((id) => (E.BY_ID[id].next || []).forEach((n) => add(n, id, 'back')));
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
    const keep = strong.length >= MAX ? strong : all.slice(0, Math.max(MIN, Math.min(MAX, strong.length + 3)));
    out[id] = keep;
  });
  /* Topic links are made two-way as well, so a calculator that someone else files under "same topic" links back to it. Without this a
     thin division (one or two calculators) could be linked from almost nowhere. */
  ids.forEach((a) => out[a].slice().forEach((e) => {
    if (e.score >= SCORE.recip || out[e.id].some((x) => x.id === a)) return;
    out[e.id].push(edge[e.id][a] || { id: a, kind: 'recip', score: SCORE.recip });
  }));
  return out;
}

module.exports = { buildRelated, LABEL, MIN, MAX };
