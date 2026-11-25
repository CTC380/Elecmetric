/* FAQ review v1.99.101, open items "links inside FAQ answers" and "answers under 15 words / boilerplate answers".
   1. Short "What does this calculator assume?" answers get one added sentence (tools/faq_answers_plans.js); the original text is kept.
   2. Short "Is anything sent to a server?" answers get a sentence based on the page's own Content-Security-Policy (connect-src 'self').
   3. "How accurate are the results?" answers get a link to "How it is verified" on the home page.
   4. Calculator and tool names in any FAQ answer are linked to the same page's Related links (first mention only, max 3 per answer).
   Safe to run twice: a text change runs only if the original answer is still there, links are added only to answers that have none.
   Run:  node tools/faq_answers.js   or   node tools/faq_answers.js --check
   Regeneration caveat: re-running a page's own generator script restores the old answers; run this tool again afterwards. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const plans = require('./faq_answers_plans.js');
const check = process.argv.includes('--check');
function walk(d, out) {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  });
  return out;
}
const words = (a) => a.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const st = { text: 0, server: 0, acc: 0, links: 0, linkedAnswers: 0, pages: 0 };
walk(root, []).forEach((file) => {
  let h = fs.readFileSync(file, 'utf8');
  const fs0 = h.search(/<section[^>]*\bid="faq"/);
  if (fs0 < 0) return;
  const fe = h.indexOf('</section>', fs0);
  let blk = h.slice(fs0, fe);
  const orig = blk;
  const slug = path.basename(path.dirname(file)) === 'pages' || path.basename(file) !== 'index.html' ? path.basename(file, '.html') : path.basename(path.dirname(file));
  const depth = path.relative(path.dirname(file), root).split(path.sep).filter(Boolean).length;
  const home = (depth ? '../'.repeat(depth) : './') + 'index.html#verification';
  /* link targets: anchors in this page's Related section */
  const rs = h.search(/<section[^>]*\bid="related"/);
  const targets = [];
  if (rs >= 0) {
    const rb = h.slice(rs, h.indexOf('</section>', rs));
    const re = /<a\b[^>]*href="([^"#]+)"[^>]*>([^<]{6,80})<\/a>/g; let m;
    while ((m = re.exec(rb))) if (!targets.some((t) => t.text === m[2])) targets.push({ href: m[1], text: m[2] });
    targets.sort((a, b) => b.text.length - a.text.length);
  }
  const used = new Set();
  blk = blk.replace(/<h3[^>]*>(.*?)<\/h3>\s*<p([^>]*)>(.*?)<\/p>/gs, (all, q, pa, a) => {
    const qt = q.replace(/<[^>]+>/g, '').trim();
    let na = a;
    if (qt === 'What does this calculator assume?' && words(a) < 15 && plans.assume[slug] && !check) {
      na = a + ' ' + plans.assume[slug]; st.text++;
    } else if (qt === 'What does this calculator assume?' && words(a) < 15 && plans.assume[slug]) st.text++;
    if (qt === 'Is anything sent to a server?' && words(a) < 15 && /connect-src 'self'/.test(h) && !/security policy/.test(a)) {
      na = a + ' ' + plans.server; st.server++;
    }
    if (qt === 'How accurate are the results?' && !/<a /.test(na)) {
      na = na + ' How the checks work is explained under <a href="' + home + '">How it is verified</a>.'; st.acc++;
    }
    /* link related names, first mention only, outside existing tags */
    if (!/<a /.test(a) || na !== a) {
      let n = 0;
      targets.forEach((t) => {
        if (n >= 3 || used.has(t.href)) return;
        const parts = na.split(/(<a\b.*?<\/a>)/s);
        for (let i = 0; i < parts.length; i += 2) {
          const k = parts[i].indexOf(t.text);
          if (k >= 0) {
            parts[i] = parts[i].slice(0, k) + '<a href="' + t.href + '">' + t.text + '</a>' + parts[i].slice(k + t.text.length);
            na = parts.join(''); used.add(t.href); n++; st.links++; break;
          }
        }
      });
      if (n) st.linkedAnswers++;
    }
    return all.replace(a, () => na);
  });
  if (blk !== orig) {
    st.pages++;
    if (!check) fs.writeFileSync(file, h.slice(0, fs0) + blk + h.slice(fe));
  }
});
console.log((check ? 'CHECK (nothing written): ' : '') + JSON.stringify(st));
