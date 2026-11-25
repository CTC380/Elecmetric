/* Elecmetric Universal Number System Converter: engine for Mode 06 (BCD, Excess-3 and Gray code).
   One file, no dependencies, no DOM. Required by tests/codes_test.js and inlined into the BCD and Gray code pages by tools/codes_page.js. */
(function (root) {
  'use strict';
  function pad(s, n) { while (s.length < n) s = '0' + s; return s; }
  function g4(b) { var o = [], i; for (i = b.length; i > 0; i -= 4) o.unshift(b.slice(Math.max(0, i - 4), i)); return o.join(' '); }
  var OFF = { '8421': 0, xs3: 3 };
  /* ---------- BCD (8421) and Excess-3 ---------- */
  function bcdEncode(text, o) {
    o = o || {}; var code = o.code === 'xs3' ? 'xs3' : '8421', off = OFF[code], s = String(text == null ? '' : text).trim().replace(/[\s,_]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter a whole decimal number.' };
    if (!/^\d+$/.test(s)) return { ok: false, error: '\u2018' + String(text).trim() + '\u2019 is not a whole non-negative decimal number. BCD encodes digits 0 to 9 only.' };
    if (s.length > 200) return { ok: false, error: 'Limit is 200 digits.' };
    var groups = s.split('').map(function (d) { var n = pad((+d + off).toString(2), 4); return o.unpacked ? '0000' + n : n; });
    var bits = groups.join(''), hex = ''; for (var i = 0; i < bits.length; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16).toUpperCase();
    return { ok: true, digits: s.split(''), groups: groups, bits: bits, hex: hex, code: code, unpacked: !!o.unpacked, plain: s.length + ' digits \u2192 ' + bits.length + ' bits' };
  }
  function bcdDecode(text, o) {
    o = o || {}; var code = o.code === 'xs3' ? 'xs3' : '8421', off = OFF[code], s = String(text == null ? '' : text).trim().replace(/[\s_]/g, ''), un = !!o.unpacked;
    if (!s) return { ok: false, empty: true, error: 'Enter a binary BCD pattern.' };
    var bad = s.match(/[^01]/); if (bad) return { ok: false, error: '\u2018' + bad[0] + '\u2019 is not a binary digit. Use 0 or 1.' };
    var size = un ? 8 : 4;
    if (s.length % size) { if (!o.padLeft) return { ok: false, error: 'The pattern has ' + s.length + ' bits. ' + (un ? 'Unpacked BCD uses 8 bits per digit.' : 'BCD uses 4 bits per digit.') + ' Add leading zeros to make a multiple of ' + size + '.' }; s = pad(s, Math.ceil(s.length / size) * size); }
    var groups = [], digits = [], i;
    for (i = 0; i < s.length; i += size) {
      var g = s.slice(i, i + size), nib = g.slice(-4), v = parseInt(nib, 2) - off;
      if (un && g.slice(0, 4) !== '0000') return { ok: false, error: 'Unpacked digit ' + (i / 8 + 1) + ' (' + g + ') must start with 0000.' };
      if (v < 0 || v > 9) return { ok: false, error: nib + ' is not a valid ' + (code === 'xs3' ? 'Excess-3' : 'BCD') + ' digit (digit ' + (i / size + 1) + '). Valid groups are ' + (code === 'xs3' ? '0011 to 1100' : '0000 to 1001') + '.' };
      groups.push(g); digits.push(v);
    }
    return { ok: true, dec: digits.join(''), digits: digits, groups: groups, code: code, unpacked: un };
  }
  /* ---------- Gray code ---------- */
  function parseValue(text, kind, w) {
    var s = String(text == null ? '' : text).trim().replace(/[\s_]/g, ''), v, width;
    if (!s) return { ok: false, empty: true, error: 'Enter a value.' };
    if (kind === 'bin') { s = s.replace(/^0b/i, ''); var b = s.match(/[^01]/); if (b) return { ok: false, error: '\u2018' + b[0] + '\u2019 is not a binary digit. Use 0 or 1.' }; v = BigInt('0b' + s); width = s.length; }
    else if (kind === 'hex') { s = s.replace(/^0x/i, ''); var h = s.match(/[^0-9a-fA-F]/); if (h) return { ok: false, error: '\u2018' + h[0] + '\u2019 is not a hexadecimal digit.' }; v = BigInt('0x' + s); width = s.length * 4; }
    else { if (!/^\d+$/.test(s)) return { ok: false, error: '\u2018' + s + '\u2019 is not a whole non-negative decimal number.' }; v = BigInt(s); width = v.toString(2).length; }
    if (width > 256 && !w) return { ok: false, error: 'Limit is 256 bits.' };
    if (w) { if (v >> BigInt(w)) return { ok: false, error: 'The value needs ' + v.toString(2).length + ' bits but the width is ' + w + '.' }; width = w; }
    if (width > 256) return { ok: false, error: 'Limit is 256 bits.' };
    return { ok: true, v: v, w: Math.max(width, 1) };
  }
  function toGray(b) { return b ^ (b >> 1n); }
  function fromGray(g) { var b = 0n, x = g; while (x > 0n) { b ^= x; x >>= 1n; } return b; }
  function bits(v, w) { return pad(v.toString(2), w); }
  /* gray({ text, kind: 'bin'|'dec'|'hex', width: 0|n, dir: 'b2g'|'g2b' }) */
  function gray(o) {
    var p = parseValue(o.text, o.kind, o.width); if (!p.ok) return p;
    var w = p.w, inV = p.v, b2g = o.dir !== 'g2b', binV = b2g ? inV : fromGray(inV), grV = b2g ? toGray(inV) : inV, steps = [], bb = bits(binV, w), gb = bits(grV, w), i;
    if (b2g) { steps.push('The Gray MSB equals the binary MSB: ' + gb[0] + '.'); for (i = 1; i < w && i < 17; i++) steps.push('Gray bit ' + (w - 1 - i) + ' = binary bit ' + (w - i) + ' XOR binary bit ' + (w - 1 - i) + ' = ' + bb[i - 1] + ' XOR ' + bb[i] + ' = ' + gb[i] + '.'); }
    else { steps.push('The binary MSB equals the Gray MSB: ' + bb[0] + '.'); for (i = 1; i < w && i < 17; i++) steps.push('Binary bit ' + (w - 1 - i) + ' = previous binary bit XOR Gray bit ' + (w - 1 - i) + ' = ' + bb[i - 1] + ' XOR ' + gb[i] + ' = ' + bb[i] + '.'); }
    if (w > 17) steps.push('\u2026 and so on for the remaining ' + (w - 17) + ' bits.');
    var sh = pad(((binV >> 1n)).toString(2), w);
    return { ok: true, w: w, bin: bb, gray: gb, binDec: binV.toString(), grayDec: grV.toString(), binHex: pad(binV.toString(16).toUpperCase(), Math.ceil(w / 4)), grayHex: pad(grV.toString(16).toUpperCase(), Math.ceil(w / 4)), steps: steps, shifted: sh, b2g: b2g, hamming: popcount(binV ^ (binV + 1n)) };
  }
  function popcount(x) { var c = 0; while (x > 0n) { c += Number(x & 1n); x >>= 1n; } return c; }
  var api = { bcdEncode: bcdEncode, bcdDecode: bcdDecode, gray: gray, toGray: toGray, fromGray: fromGray, g4: g4, pad: pad };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Codes = api;
})(typeof window !== 'undefined' ? window : this);
