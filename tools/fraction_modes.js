/* Shared mode strip for the Fraction Calculator pages (Modes 01 to 06). modes('simplifier') returns the HTML with that mode marked current. */
const LIST = [['arithmetic', 'fraction-arithmetic', '01', 'Fraction Arithmetic'], ['simplifier', 'fraction-simplifier', '02', 'Fraction Simplifier'], ['converter', 'decimal-fraction-converter', '03', 'Decimal & Fraction Converter'], ['mixed', 'mixed-number-calculator', '04', 'Mixed Number Calculator'], ['advanced', 'fraction-ratio-tools', '05', 'Advanced Fraction & Ratio Tools'], ['inch', 'fractional-inch-converter', '06', 'Fractional Inch to mm']];
module.exports = function (cur) {
  return '<nav class="fmodes" aria-label="Fraction Calculator modes"><span class="ns-l">Fraction Calculator</span>' + LIST.map((m) => '<a class="chip' + (m[0] === cur ? ' on' : '') + '" href="../' + m[1] + '/"' + (m[0] === cur ? ' aria-current="page"' : '') + '>Mode ' + m[2] + ' \u00b7 ' + m[3] + '</a>').join('') + '</nav>';
};
module.exports.css = '.fmodes{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 12px}.fmodes .ns-l{margin:0 4px 0 0}.fmodes .chip.on{background:var(--gold-fill);border-color:var(--gold);font-weight:700}';
