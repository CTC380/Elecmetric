/* Static checks for the calculation report card on the five Percentage Calculator pages, Modes 01 to 05 (tools/percent_report.js, installed by tools/percent_report_install.js).
   No browser needed: each built page must carry exactly one report card, one report style block and one report script that parses, the form fields and the three
   buttons the script reads, a print rule that hides everything but the sheet, no remote resource, and the installer must be idempotent. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const PAGES = ['basic-percentage-calculator', 'percentage-increase-decrease-calculator', 'percentage-difference-calculator', 'percentage-error-calculator', 'engineering-percentage-calculator', 'percent-error-calculator', 'signed-error-analysis', 'tolerance-verification', 'batch-measurement-analysis', 'engineering-measurement-analysis', 'sequential-discount-markup-calculator'];
let n = 0, fail = 0; const eq = (a, b, m) => { n++; if (a !== b) { fail++; if (fail < 15) console.log('FAIL ' + m + ': ' + a + ' vs ' + b); } };
const count = (h, re) => (h.match(re) || []).length;
const src = fs.readFileSync(path.join(root, 'tools/percent_report.js'), 'utf8');
let parsed = true; try { new Function(src); } catch (e) { parsed = false; console.log(e.message); } eq(parsed, true, 'report script parses');
eq(/fraction/i.test(src.replace(/Adapted from tools\/fraction_report\.js/, '').replace(/whole numbers and fractions of any length/, '')), false, 'no leftover fraction wording in the report script');
eq(/<\/?(header|footer|nav|main)[ >]/.test(src), false, 'the sheet uses no header, footer, nav or main element, which the site CSS would restyle');
eq(/eval\(|document\.write|innerHTML\s*=\s*[^;]*location/.test(src), false, 'no eval or document.write');
for (const d of PAGES) {
  const f = path.join(root, 'calculators', d, 'index.html'), h = fs.readFileSync(f, 'utf8'), t = '[' + d + ']';
  eq(count(h, /id="rp-card"/g), 1, 'one report card ' + t); eq(/Document reference/.test(h), true, 'document reference field is labelled ' + t); eq(/rp-fraction|fraction\.report/.test(h), false, 'no fraction report left in the page ' + t); eq(count(h, /<style id="rp-css">/g), 1, 'one report style ' + t); eq(count(h, /<script id="rp-js">/g), 1, 'one report script ' + t);
  ['rp-proj', 'rp-ref', 'rp-by', 'rp-chk', 'rp-note', 'rp-msg', 'rp-prev'].forEach((id) => eq(count(h, new RegExp('id="' + id + '"', 'g')), 1, id + ' ' + t));
  ['print', 'copy', 'save'].forEach((a) => eq(count(h, new RegExp('data-rp="' + a + '"', 'g')), 1, 'button ' + a + ' ' + t));
  eq(/body\.rp-printing>\*:not\(#rp-sheet\)\{display:none!important\}/.test(h), true, 'print hides the page ' + t);
  eq(/<main[\s\S]*<!--rp:start-->[\s\S]*<!--rp:end-->[\s\S]*<\/main>/.test(h), true, 'card is inside main ' + t);
  const m = /<script id="rp-js">([\s\S]*?)<\/script>/.exec(h); eq(!!m && m[1] === src.replace(/<\/script/gi, '<\\/script'), true, 'inlined script equals tools/percent_report.js ' + t);
  eq(/id="ns-out"/.test(h) && /id="ns-steps"/.test(h) && /id="ns-x"/.test(h) && /id="ns-y"/.test(h), true, 'page has the output and working containers the report reads ' + t);
  eq(/<(script|link|img)[^>]+(src|href)="https?:/.test(h.replace(/<a [^>]*>/g, '')), false, 'no remote resource ' + t);
  const tmp = path.join(require('os').tmpdir(), 'rp_' + d + '.html'); fs.writeFileSync(tmp, h); require('../tools/percent_report_install.js')(tmp); eq(fs.readFileSync(tmp, 'utf8'), h, 'installer is idempotent ' + t); fs.unlinkSync(tmp);
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
