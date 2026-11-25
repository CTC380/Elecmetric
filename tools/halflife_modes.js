/* Shared mode strip for the Elecmetric Half-Life Calculator (Modes 01 to 05, exponential decay analysis).
   hl('solver') returns the HTML with that mode marked current. Only built modes are links: a link to a page that does not exist would fail the deploy guard.
   Modes still to build are shown as plain text, so a visitor can see the plan without a dead link. */
const LIST = [['solver', 'half-life-calculator', '01', 'Half-Life Calculator', true], ['constants', 'decay-constant-calculator', '02', 'Decay Constant Converter', true], ['percent', 'decay-percentage-calculator', '03', 'Decay Percentage Calculator', true], ['table', 'decay-table-calculator', '04', 'Decay Table & Graph', true], ['eng', 'engineering-exponential-decay-calculator', '05', 'Engineering Exponential Decay', true]];
module.exports = function (cur) {
  return '<nav class="fmodes" aria-label="Half-Life Calculator modes"><span class="ns-l">Half-Life Calculator</span>' + LIST.map((m) => m[4]
    ? '<a class="chip' + (m[0] === cur ? ' on' : '') + '" href="../' + m[1] + '/"' + (m[0] === cur ? ' aria-current="page"' : '') + '>Mode ' + m[2] + ' \u00b7 ' + m[3] + '</a>'
    : '<span class="chip soon" aria-disabled="true">Mode ' + m[2] + ' \u00b7 ' + m[3] + ' (coming)</span>').join('') + '</nav>';
};
module.exports.css = '.fmodes{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 12px}.fmodes .ns-l{margin:0 4px 0 0}.fmodes .chip.on{background:var(--gold-fill);border-color:var(--gold);font-weight:700}.fmodes .chip.soon{opacity:.6;cursor:default}';
