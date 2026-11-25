/* Shared mode strip for the Elecmetric Percent Error Calculator (Modes 01 to 05, standalone measurement-analysis tool).
   pe('abs') returns the HTML with that mode marked current. Only built modes are links: a link to a page that does not exist would fail the deploy guard.
   Modes still to build are shown as plain text, so a visitor can see the plan without a dead link. */
const LIST = [['abs', 'percent-error-calculator', '01', 'Absolute Percent Error', true], ['signed', 'signed-error-analysis', '02', 'Signed Error Analysis', true], ['tol', 'tolerance-verification', '03', 'Tolerance Verification', true], ['batch', 'batch-measurement-analysis', '04', 'Batch Measurement Analysis', true], ['eng', 'engineering-measurement-analysis', '05', 'Engineering Measurement Analysis', true]];
module.exports = function (cur) {
  return '<nav class="fmodes" aria-label="Percent Error Calculator modes"><span class="ns-l">Percent Error Calculator</span>' + LIST.map((m) => m[4]
    ? '<a class="chip' + (m[0] === cur ? ' on' : '') + '" href="../' + m[1] + '/"' + (m[0] === cur ? ' aria-current="page"' : '') + '>Mode ' + m[2] + ' \u00b7 ' + m[3] + '</a>'
    : '<span class="chip soon" aria-disabled="true">Mode ' + m[2] + ' \u00b7 ' + m[3] + ' (coming)</span>').join('') +
    '<a class="chip" href="../percentage-error-calculator/">Percentage Calculator, Mode 04 (reverse and tolerance)</a></nav>';
};
module.exports.css = '.fmodes{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 12px}.fmodes .ns-l{margin:0 4px 0 0}.fmodes .chip.on{background:var(--gold-fill);border-color:var(--gold);font-weight:700}.fmodes .chip.soon{opacity:.6;cursor:default}';
