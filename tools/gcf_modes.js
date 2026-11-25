/* Shared mode strip for the Elecmetric GCF Calculator (Modes 01 to 05).
   gm('multiple') returns the HTML with that mode marked current. Only built modes are links: a link to a page that does not exist would fail the deploy guard.
   Modes still to build are shown as plain text, so a visitor can see the plan without a dead link. */
const LIST = [['multiple', 'gcf-calculator', '01', 'Multiple Number GCF', true], ['prime', 'gcf-prime-factorisation-calculator', '02', 'Prime Factorisation', true], ['euclid', 'euclidean-algorithm-calculator', '03', 'Euclidean Algorithm', false], ['common', 'common-factors-calculator', '04', 'Common Factors Finder', false], ['lcm', 'gcf-lcm-ratio-analysis', '05', 'GCF, LCM & Engineering Ratio Analysis', false]];
const amp = (t) => t.replace(/&/g, '&amp;');
module.exports = function (cur) {
  return '<nav class="fmodes" aria-label="GCF Calculator modes"><span class="ns-l">GCF Calculator</span>' + LIST.map((m) => m[4]
    ? '<a class="chip' + (m[0] === cur ? ' on' : '') + '" href="../' + m[1] + '/"' + (m[0] === cur ? ' aria-current="page"' : '') + '>Mode ' + m[2] + ' \u00b7 ' + amp(m[3]) + '</a>'
    : '<span class="chip soon" aria-disabled="true">Mode ' + m[2] + ' \u00b7 ' + amp(m[3]) + ' (coming)</span>').join('') + '</nav>';
};
module.exports.css = '.fmodes{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 12px}.fmodes .ns-l{margin:0 4px 0 0}.fmodes .chip.on{background:var(--gold-fill);border-color:var(--gold);font-weight:700}.fmodes .chip.soon{opacity:.6;cursor:default}';
