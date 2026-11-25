/* Builds the Quadratic Formula Calculator, Mode 01 (Quadratic Equation Solver), at calculators/quadratic-solver/. Run: node tools/quad_page.js
   The page replaces the registry-generated page at the same address (STANDALONE_OVERRIDES in tools/build_pages.js), so its source is also written to tools/standalone/quadratic-solver.html.
   Shell and style block come from the built page calculators/bcd-converter/index.html. Every example value on the page is calculated by tools/quad_engine.js at build time. */
const fs = require('fs'), path = require('path');
const Q = require('./quad_engine.js'), qm = require('./quad_modes.js'), root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/bcd-converter/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mn = (s) => String(s).replace(/-/g, '\u2212');
const tbl = (head, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const faqs = (a) => '<section id="faq"><h2>Questions</h2>' + a.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>';
const S = (a, b, c) => { const r = Q.solve({ a, b, c }); if (!r.ok) throw new Error('example ' + [a, b, c] + ': ' + r.error); return r; };
const rootsTxt = (r) => r.roots.map((x) => mn(x.exact)).join(',  ');
const decTxt = (r) => r.roots.map((x) => mn(x.dec.text)).join(',  ');
const EX = [['1', '-5', '6'], ['1', '-4', '4'], ['1', '2', '5'], ['2', '3', '-5'], ['1', '-2', '-1'], ['3', '0', '-12'], ['1', '0', '1'], ['3/4', '1/2', '-2'], ['0', '2', '-4'], ['0', '0', '5']];
const eqOf = (t) => mn(Q.equationText(Q.parseNum(t[0]).v, Q.parseNum(t[1]).v, Q.parseNum(t[2]).v));
const chips = EX.map((t) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify({ a: t[0], b: t[1], c: t[2] })) + '">' + esc(eqOf(t)) + '</button>').join('');
const fld = (id, label, v, ph) => '<div class="ns-f"><label for="' + id + '" class="ns-l">' + label + '</label><input id="' + id + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" aria-describedby="nu-err" value="' + v + '" placeholder="' + ph + '"></div>';
const tool = '<div id="nu"><section class="card ns-card"><div class="qgrid">' + fld('nu-a', 'A (coefficient of x\u00b2)', '1', 'e.g. 3/4') + fld('nu-b', 'B (coefficient of x)', '-5', 'e.g. \u22122.5') + fld('nu-c', 'C (constant)', '6', 'e.g. 1/3') +
  '<div class="ns-f"><label for="nu-dp" class="ns-l">Decimal places</label><select id="nu-dp" class="ns-sel"><option value="4">4</option><option value="6">6</option><option value="8" selected>8</option><option value="10">10</option><option value="12">12</option><option value="15">15</option></select></div></div>' +
  '<p class="qeq" id="nu-eq" aria-live="polite"></p><p class="note ns-msg" id="nu-err" role="status"></p><div class="ns-act"><button type="button" class="btn2" data-act="reset">Reset</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div><div id="nu-out" aria-live="polite"></div><p class="sr-only" id="nu-note" role="status" aria-live="polite"></p><noscript><p class="note">This tool needs JavaScript. Nothing is sent anywhere.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="nu-steps"></div></section><section class="card"><h2>Check by substitution</h2><div id="nu-verify"></div></section><section class="card"><h2>History</h2><div id="nu-hist"></div></section></div>';
const formats = tbl(['You type', 'It is read as', 'Value'], [['5', 'whole number', '5'], ['-2.5', 'decimal, held exactly', '\u22125/2'], ['3/4', 'fraction', '3/4'], ['1.5/0.25', 'decimals inside a fraction', '6'], ['2 1/2', 'mixed number: 2 + 1/2', '5/2'], ['-1 3/4', 'negative mixed number', '\u22127/4'], ['1e-6', 'scientific notation', '1/1000000'], ['0', 'a missing term: type 0', '0']]);
const types = tbl(['\u0394 = B\u00b2 \u2212 4AC', 'What it means', 'Example', 'Roots'], [
  ['\u0394 > 0 and a perfect square', 'two different real roots, both rational', eqOf(EX[0]), rootsTxt(S(...EX[0]))],
  ['\u0394 > 0, not a perfect square', 'two different real roots, irrational', eqOf(EX[4]), rootsTxt(S(...EX[4]))],
  ['\u0394 = 0', 'one repeated real root; the parabola touches the x-axis', eqOf(EX[1]), rootsTxt(S(...EX[1]))],
  ['\u0394 < 0', 'two complex conjugate roots, a \u00b1 bi', eqOf(EX[2]), rootsTxt(S(...EX[2]))]]);
const special = tbl(['Input', 'What it is', 'Result'], [['A = 0, B \u2260 0', 'a linear equation, not a quadratic', 'one root, x = \u2212C/B (for example ' + eqOf(EX[8]) + ' gives x = ' + S(...EX[8]).roots[0].exact + ')'], ['A = 0, B = 0, C \u2260 0', 'C = 0 is never true', 'no solution'], ['A = 0, B = 0, C = 0', '0 = 0 is always true', 'every real number is a solution']]);
const exs = tbl(['Equation', '\u0394', 'Roots (exact)', 'Roots (decimal)'], EX.slice(0, 8).map((t) => { const r = S(...t); return [eqOf(t), mn(r.discriminant), rootsTxt(r), decTxt(r)]; }));
const related = [['complex-number', 'Complex Number Calculator'], ['powers-roots', 'Powers and Roots'], ['fraction-arithmetic', 'Fraction Arithmetic Calculator'], ['matrix-calculator', 'Matrix Calculator'], ['pythagorean-theorem', 'Pythagorean Theorem'], ['rlc-transient', 'RLC Transient'], ['scientific-calculator', 'Scientific Calculator']].filter((x) => fs.existsSync(path.join(root, 'calculators', x[0], 'index.html')));
const page = {
  dir: 'quadratic-solver', name: 'Quadratic Formula Calculator',
  title: 'Quadratic Formula Calculator | Roots, Discriminant, Steps', desc: 'Solve ax\u00b2 + bx + c = 0 with exact roots, the discriminant, complex roots, fractions and the vertex. Roots are checked by substitution, with every step shown.',
  h1: 'Quadratic Formula Calculator', lede: 'Enter A, B and C to solve ax\u00b2 + bx + c = 0. You get both roots exactly and as decimals, the discriminant, the vertex, and a check that each root satisfies the equation. Complex roots are calculated, not rejected. Calculate. Convert. Understand.',
  body: qm('solver') + tool +
    '<section id="formula"><h2>The quadratic formula</h2><p>For ax\u00b2 + bx + c = 0 with a \u2260 0, the roots are x = (\u2212b \u00b1 \u221a(b\u00b2 \u2212 4ac)) / (2a). The part under the root, \u0394 = b\u00b2 \u2212 4ac, is the discriminant. Its sign decides what kind of roots the equation has. The formula follows from completing the square: divide by a, move c/a across, add (b/2a)\u00b2 to both sides, and take the square root.</p></section>' +
    '<section id="exact"><h2>Exact arithmetic, not floating point</h2><p>Every coefficient is held as an exact fraction of whole numbers, so 0.1 is exactly 1/10 and not a binary approximation. The discriminant, its sign and the roots are calculated exactly. This matters at the edges. For 0.1x\u00b2 + 0.2x + 0.1 = 0 the discriminant is exactly zero and the page reports one repeated root. There is no tolerance that could call a tiny non-zero \u0394 zero, or the reverse. Numbers can be very large or very small without overflow, because nothing is held as a floating-point value until the final decimal is written.</p><p>Roots that are not whole or fractional are written as radicals in simplest form, such as 1 \u00b1 \u221a2, with the decimal beside them. Each root is then substituted back into the equation in exact arithmetic and must give exactly zero.</p></section>' +
    '<section id="formats"><h2>What you can type</h2>' + formats + '<p class="note">Type 0 for a term that is absent: x\u00b2 \u2212 9 = 0 has B = 0. Use a minus sign or the \u2212 character. A comma is ignored, so 1,000 is read as 1000.</p></section>' +
    '<section id="discriminant"><h2>What the discriminant tells you</h2>' + types + '</section>' +
    '<section id="special"><h2>When the equation is not a quadratic</h2>' + special + '</section>' +
    '<section id="examples"><h2>Worked examples</h2>' + exs + '</section>' +
    faqs([['Why does it not show an error when the discriminant is negative?', 'A negative discriminant means the parabola does not cross the x-axis, so there are no real roots. The equation still has two roots in the complex numbers, and the calculator gives them as a \u00b1 bi. For x\u00b2 + 2x + 5 = 0 they are \u22121 + 2i and \u22121 \u2212 2i.'],
      ['Can I enter fractions?', 'Yes. Type 3/4, a mixed number such as 2 1/2, a decimal such as 0.75 or a number in scientific notation such as 1e-6. Fractions are kept exact.'],
      ['What happens when A is zero?', 'Then x\u00b2 drops out and the equation is linear. The calculator solves it as bx + c = 0 and says so. If A and B are both zero there is either no solution (C is not zero) or every number is a solution (C is zero).'],
      ['How is an answer checked?', 'Each root is substituted into A\u00b7x\u00b2 + B\u00b7x + C using exact arithmetic, including roots that contain a square root or i, and the result must be exactly zero. The engine is also tested against independent reference values from a computer algebra system.'],
      ['Is anything sent to a server?', 'No. The calculation runs in your browser. The history list is stored only in this browser and you can clear it.']]) +
    '<section id="related"><h2>Related</h2><p>' + related.map((x) => '<a class="chip" href="../' + x[0] + '/">' + esc(x[1]) + '</a>').join('') + '</p></section>'
};
const extraCss = '#nu .qgrid{display:grid;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr)) 130px}#nu .qeq{font:600 20px var(--mono);color:var(--num);margin:10px 0 0;min-height:1.4em;word-break:break-word}#nu .ns-try{margin-top:6px}#nu ul.fh,#nu ul.vl{list-style:none;margin:0 0 10px;padding:0}#nu ul.fh{display:flex;flex-wrap:wrap;gap:4px}#nu ul.vl li{font:14px/1.5 var(--mono);padding:3px 0;overflow-wrap:anywhere}#nu .res .big{display:flex;flex-direction:column;gap:2px;font:700 30px var(--mono);color:var(--num);word-break:break-word}#nu .res .qroot{overflow-wrap:anywhere}#nu .res .sub{font:500 14px var(--mono);color:var(--muted);margin:6px 0 10px;overflow-wrap:anywhere}#nu ol.steps li{overflow-wrap:anywhere}#nu .ns-t{width:100%}#nu .ns-t td.r{word-break:normal;overflow-wrap:anywhere}#nu .ns-t td:first-child{white-space:nowrap}@media(max-width:700px){#nu .qgrid{grid-template-columns:repeat(2,minmax(0,1fr))}#nu .res .big{font-size:24px}#nu .ns-t td:first-child{white-space:normal}}@media print{#nu .ns-try,#nu .ns-act,#nu .qgrid select{display:none}}' + qm.css;
const client = fs.readFileSync(path.join(__dirname, 'quad_client.js'), 'utf8'), engine = fs.readFileSync(path.join(__dirname, 'quad_engine.js'), 'utf8');
let style = shell.match(/<style>#ns[\s\S]*?<\/style>/)[0]; style = style.replace('</style>', extraCss + '</style>');
let out = shell; const h0 = out.indexOf('<style>'); out = out.slice(0, h0) + style + out.slice(out.indexOf('</style>', h0) + 8);
const p = page;
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(p.title) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? p.title : p.desc; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => '<main class="w"><h1>' + p.h1 + '</h1><p class="lede">' + p.lede + '</p>' + p.body + '</main>');
out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: p.name, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: p.desc, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>');
const s0 = out.indexOf('<script>/* Elecmetric Universal Number System Converter: engine for Mode 06'); if (s0 < 0) throw new Error('Mode 06 script not found');
out = out.slice(0, s0) + '<script>' + engine + '\n' + client + '</script>' + out.slice(out.indexOf('</script>', s0) + 9);
out = out.split('bcd-converter/index.html').join(p.dir + '/index.html').split('bcd-converter/').join(p.dir + '/');
fs.mkdirSync(path.join(__dirname, 'standalone'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'standalone', p.dir + '.html'), out);
const dir = path.join(root, 'calculators', p.dir); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote tools/standalone/' + p.dir + '.html and calculators/' + p.dir + '/index.html (' + out.length + ' bytes); title ' + p.title.length + ', description ' + p.desc.length + ' characters');
