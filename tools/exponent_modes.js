/* Shared mode strip for the Elecmetric Exponent Calculator (Modes 01 to 05).
   ex('power') returns the HTML with that mode marked current. Only built modes are links: a link to a page that does not exist would fail the deploy guard.
   Modes still to build are shown as plain text, so a visitor can see the plan without a dead link. */
const LIST = [['power', 'exponent-calculator', '01', 'Power Calculator', true], ['fractional', 'negative-fractional-exponents-calculator', '02', 'Negative & Fractional Exponents', true], ['solver', 'exponent-solver', '03', 'Missing Value Solver', true], ['laws', 'exponent-laws-calculator', '04', 'Exponent Laws', true], ['engineering', 'engineering-powers-scientific-notation', '05', 'Engineering Powers & Scientific Notation', true]];
module.exports = function (cur) {
  return '<nav class="fmodes" aria-label="Exponent Calculator modes"><span class="ns-l">Exponent Calculator</span>' + LIST.map((m) => m[4]
    ? '<a class="chip' + (m[0] === cur ? ' on' : '') + '" href="../' + m[1] + '/"' + (m[0] === cur ? ' aria-current="page"' : '') + '>Mode ' + m[2] + ' · ' + m[3] + '</a>'
    : '<span class="chip soon" aria-disabled="true">Mode ' + m[2] + ' · ' + m[3] + ' (coming)</span>').join('') + '</nav>';
};
module.exports.css = '.fmodes{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 12px}.fmodes .ns-l{margin:0 4px 0 0}.fmodes .chip.on{background:var(--gold-fill);border-color:var(--gold);font-weight:700}.fmodes .chip.soon{opacity:.6;cursor:default}';
