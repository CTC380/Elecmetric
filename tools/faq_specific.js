/* FAQ review v1.99.101, open item "rewrite the pages where every FAQ question is generic".
   For each page whose FAQ holds only the four generic questions, add up to five calculator-specific questions whose answers are
   built only from text already on that page (the Formula, Worked example, Inputs and results, "How the result changes with ..." and
   Standards sections). Nothing new is claimed; if a section is missing or odd, that question is skipped.
   The four generic questions stay, so a page ends with 5 to 9 questions. Safe to run twice (skips pages that already have a
   "What formula" question).   Run: node tools/faq_specific.js   |  --check (report only)  |  --show <folder> (print one page's new FAQ)
   Regeneration caveat: re-running a page's own generator script removes these questions; run this tool again afterwards. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const check = process.argv.includes('--check'), si = process.argv.indexOf('--show'), show = si > 0 ? process.argv[si + 1] : null;
const G = new Set(['What do I need to enter?', 'How accurate are the results?', 'What does this calculator assume?', 'Which calculators should I use next?']);
function walk(d, out) {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  });
  return out;
}
const txt = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const sec = (h, id) => { const m = h.match(new RegExp('<(section|details)[^>]*\\bid="' + id + '"[\\s\\S]*?</\\1>')); return m ? m[0] : null; };
const rowsOf = (t) => (t.match(/<tr>[\s\S]*?<\/tr>/g) || []).map((r) => (r.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || []).map((c) => txt(c)));
const lc = (s) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const trim = (s) => s.replace(/[.\s]+$/, '');
const st = { pages: 0, formula: 0, example: 0, change: 0, inputs: 0, standards: 0, skipped: 0 };
walk(root, []).forEach((file) => {
  let h = fs.readFileSync(file, 'utf8');
  const a0 = h.search(/<section[^>]*\bid="faq"/); if (a0 < 0) return;
  const a1 = h.indexOf('</section>', a0); const blk = h.slice(a0, a1);
  const qs = (blk.match(/<h3[^>]*>[\s\S]*?<\/h3>/g) || []).map(txt);
  if (!qs.length || !qs.every((q) => G.has(q)) || /What formula/.test(blk)) { return; }
  const h1 = txt((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]);
  const name = /calculator|converter|tool/i.test(h1) ? h1 : h1 + ' calculator';
  const out = [];
  /* 1 formula */
  const fm = sec(h, 'formula'); const fd = fm && fm.match(/<div class="f">([\s\S]*?)<\/div>/);
  if (fd && txt(fd[1]).length > 3 && txt(fd[1]).length < 400) {
    out.push(['What formula does the ' + name + ' use?', 'It uses ' + trim(fd[1].trim()) + '. The inputs and results are listed under <a href="#inputs">Input Parameters and Results</a>.']); st.formula++;
  }
  /* 2 worked example */
  const ex = sec(h, 'example');
  if (ex) {
    const tb = ex.match(/<table>[\s\S]*?<\/table>/); const steps = (ex.match(/<li>[\s\S]*?<\/li>/g) || []).map(txt);
    const rs = tb ? rowsOf(tb[0]).slice(1).filter((r) => r.length >= 2) : [];
    if (rs.length && steps.length && steps.length <= 6) {
      out.push(['Can you show a worked example of the ' + name + '?', 'With ' + rs.map((r) => (r[1] === 'None' ? 'no ' + lc(r[0]) : lc(r[0]) + ' ' + r[1])).join(', ') + ': ' + steps.map(trim).join('; ') + '. The full working is under <a href="#example">Worked example</a>.']); st.example++;
    }
  }
  /* 3 how the result changes */
  const ty = sec(h, 'typical'); const th = ty && txt((ty.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [, ''])[1]);
  const tm = th && th.match(/^How the result changes with (.+)$/);
  if (tm) {
    const rs = rowsOf((ty.match(/<table>[\s\S]*?<\/table>/) || [''])[0]);
    if (rs.length >= 3 && rs[0].length >= 2) {
      const hd = rs[0], f = rs[1], l = rs[rs.length - 1];
      const parts = hd.slice(1).map((c, i) => [c, f[i + 1], l[i + 1]]).filter((x) => x[1] !== x[2]).map((x) => x[0] + ' goes from ' + x[1] + ' to ' + x[2]);
      if (parts.length) {
        out.push(['How does the result change with ' + tm[1] + '?', 'The table under \u201c' + th + '\u201d varies ' + lc(hd[0].replace(/\s*\(.*$/, '')) + ' from ' + f[0] + ' to ' + l[0] + ((hd[0].match(/\(([^)]+)\)\s*$/) || [])[1] ? ' ' + hd[0].match(/\(([^)]+)\)\s*$/)[1] : '') + ', with the other inputs held at their default values. Over that range, ' + parts.join('; ') + '. See <a href="#typical">the full table</a>.']); st.change++;
      }
    }
  }
  /* 4 inputs and limits */
  const inp = sec(h, 'inputs');
  if (inp) {
    const tb = inp.match(/<table>[\s\S]*?<\/table>/); const rs = tb ? rowsOf(tb[0]).slice(1).filter((r) => r.length >= 3) : [];
    if (rs.length && rs.length <= 10) {
      out.push(['What values does the ' + name + ' accept?', rs.map((r) => r[0] + ': ' + (r[1] === '(choice)' ? 'a choice from the list on the page' : r[2] + (r[1] && r[1] !== '(number)' && r[2].indexOf(r[1]) < 0 ? ' (' + r[1] + ')' : ''))).join('; ') + '. A value outside its allowed range is refused with a message instead of giving a result.']); st.inputs++;
    }
  }
  /* 5 standards */
  const sd = sec(h, 'standards');
  if (sd) {
    const li = (sd.match(/<li>[\s\S]*?<\/li>/g) || []).map(txt);
    const emb = /does not embed clause text or rating tables/.test(sd);
    if (li.length) {
      out.push(['Which standards are relevant to the ' + name + '?', 'The page names ' + li.join('; ') + ' as background reading.' + (emb ? ' Elecmetric does not embed clause text or rating tables, so take limits from your own copy of the standard. See <a href="#standards">Standards and further reading</a>.' : ' See <a href="#standards">Standards and further reading</a>.')]); st.standards++;
    }
  }
  if (!out.length) { st.skipped++; return; }
  /* insert after the first question/answer pair */
  const first = blk.match(/<h3[^>]*>[\s\S]*?<\/h3>\s*<p[^>]*>[\s\S]*?<\/p>/);
  const add = out.map((q) => '<h3>' + q[0] + '</h3><p>' + q[1] + '</p>').join('');
  const nb = blk.replace(first[0], () => first[0] + add);
  st.pages++;
  if (show && path.basename(path.dirname(file)) === show) console.log(txt(nb).replace(/ (?=[A-Z][^.]*\?)/g, '\n'));
  if (!check && !show) fs.writeFileSync(file, h.slice(0, a0) + nb + h.slice(a1));
});
console.log((check || show ? 'CHECK (nothing written): ' : '') + JSON.stringify(st));
