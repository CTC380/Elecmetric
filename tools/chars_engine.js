/* Elecmetric ASCII and Unicode converters: engine for Mode 09. One file, no dependencies, no DOM.
   UTF-8 and UTF-16 are worked out by hand (no TextEncoder). Required by tests/chars_test.js and inlined into the ASCII and Unicode pages by tools/chars_page.js. */
(function (root) {
  'use strict';
  function pad(s, n) { while (s.length < n) s = '0' + s; return s; }
  var AB = 'NUL SOH STX ETX EOT ENQ ACK BEL BS HT LF VT FF CR SO SI DLE DC1 DC2 DC3 DC4 NAK SYN ETB CAN EM SUB ESC FS GS RS US'.split(' ');
  var AN = ['Null', 'Start of heading', 'Start of text', 'End of text', 'End of transmission', 'Enquiry', 'Acknowledge', 'Bell', 'Backspace', 'Horizontal tab', 'Line feed', 'Vertical tab', 'Form feed', 'Carriage return', 'Shift out', 'Shift in', 'Data link escape', 'Device control 1', 'Device control 2', 'Device control 3', 'Device control 4', 'Negative acknowledge', 'Synchronous idle', 'End of transmission block', 'Cancel', 'End of medium', 'Substitute', 'Escape', 'File separator', 'Group separator', 'Record separator', 'Unit separator'];
  function label(cp) { if (cp < 32) return AB[cp]; if (cp === 32) return 'SP'; if (cp === 127) return 'DEL'; if (cp >= 128 && cp < 160) return 'C1'; if (cp === 160) return 'NBSP'; return String.fromCodePoint(cp); }
  function ctrl(cp) { return cp < 32 || cp === 127 || (cp >= 128 && cp < 160) || cp === 32 || cp === 160; }
  function aname(cp) { return cp < 32 ? AN[cp] : cp === 32 ? 'Space' : cp === 127 ? 'Delete' : ''; }
  var BASE = { dec: 10, hex: 16, bin: 2, oct: 8 }, RE = { dec: /^\d+$/, hex: /^[0-9a-f]+$/i, bin: /^[01]+$/, oct: /^[0-7]+$/ }, NAME = { dec: 'decimal', hex: 'hexadecimal', bin: 'binary', oct: 'octal' };
  function tok(t, kind, uni) {
    var s = t, m = uni ? /^u\+/i.exec(s) : null;
    if (m) { kind = 'hex'; s = s.slice(2); } else if (!RE[kind].test(s) && (m = /^0([xbo])/i.exec(s)) && s.length > 2) { kind = { x: 'hex', b: 'bin', o: 'oct' }[m[1].toLowerCase()]; s = s.slice(2); }
    if (!RE[kind].test(s)) return { error: '\u2018' + t + '\u2019 is not a valid ' + NAME[kind] + ' number.' };
    return { v: parseInt(s, BASE[kind]), big: s.length > 8 };
  }
  function tokens(text) { return String(text == null ? '' : text).trim().split(/[\s,;]+/).filter(Boolean); }
  /* ---------- ASCII ---------- */
  function arow(cp) { return { cp: cp, ch: label(cp), ctrl: ctrl(cp), dec: String(cp), hex: pad(cp.toString(16).toUpperCase(), 2), bin: pad(cp.toString(2), 8), oct: pad(cp.toString(8), 3), name: aname(cp) }; }
  function ascii(o) {
    var rows = [], cps, i;
    if (o.dir === 'dec') {
      var t = tokens(o.text); if (!t.length) return { ok: false, empty: true, error: 'Enter ASCII codes separated by spaces, for example 72 101 108 108 111.' };
      if (t.length > 500) return { ok: false, error: 'Limit is 500 characters.' };
      cps = [];
      for (i = 0; i < t.length; i++) { var a = tok(t[i], o.kind || 'dec', false); if (a.error) return { ok: false, error: a.error }; if (a.big || a.v > 127) return { ok: false, error: 'Code \u2018' + t[i] + '\u2019 is above 127. ASCII has codes 0 to 127. Use the Unicode converter for larger code points.' }; cps.push(a.v); }
    } else {
      var s = String(o.text == null ? '' : o.text); if (!s) return { ok: false, empty: true, error: 'Enter some text.' };
      cps = Array.from(s).map(function (c) { return c.codePointAt(0); });
      if (cps.length > 500) return { ok: false, error: 'Limit is 500 characters.' };
      for (i = 0; i < cps.length; i++) if (cps[i] > 127) return { ok: false, error: '\u2018' + String.fromCodePoint(cps[i]) + '\u2019 (U+' + pad(cps[i].toString(16).toUpperCase(), 4) + ') is not ASCII. ASCII has codes 0 to 127. Use the Unicode converter for this character.' };
    }
    rows = cps.map(arow);
    var fmt = o.fmt || 'dec', join = function (k) { return rows.map(function (r) { return r[k]; }).join(' '); };
    return { ok: true, dir: o.dir === 'dec' ? 'dec' : 'enc', rows: rows, text: String.fromCodePoint.apply(null, cps), shown: rows.map(function (r) { return r.ctrl && r.cp !== 32 ? '<' + r.ch + '>' : r.cp === 32 ? ' ' : r.ch; }).join(''), dec: join('dec'), hex: join('hex'), bin: join('bin'), oct: join('oct'), codes: join(fmt) };
  }
  /* ---------- Unicode ---------- */
  function utf8(cp) { if (cp < 0x80) return [cp]; if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 63)]; if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)]; return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)]; }
  function utf16(cp) { if (cp < 0x10000) return [cp]; var c = cp - 0x10000; return [0xD800 + (c >> 10), 0xDC00 + (c & 0x3FF)]; }
  var H = function (n, w) { return pad(n.toString(16).toUpperCase(), w); };
  function urow(cp) { var a = utf8(cp), b = utf16(cp); return { cp: cp, ch: label(cp), ctrl: ctrl(cp), u: 'U+' + H(cp, 4), dec: String(cp), utf8: a.map(function (x) { return H(x, 2); }), utf16: b.map(function (x) { return H(x, 4); }), plane: cp >> 16 }; }
  function unicode(o) {
    var cps, i, t;
    if (o.dir === 'dec') {
      t = tokens(o.text); if (!t.length) return { ok: false, empty: true, error: 'Enter code points such as U+0048 U+1F600.' };
      if (t.length > 200) return { ok: false, error: 'Limit is 200 code points.' };
      cps = [];
      for (i = 0; i < t.length; i++) { var a = tok(t[i], o.kind || 'hex', true); if (a.error) return { ok: false, error: a.error };
        if (a.big || a.v > 0x10FFFF) return { ok: false, error: '\u2018' + t[i] + '\u2019 is above U+10FFFF, the last Unicode code point.' };
        if (a.v >= 0xD800 && a.v <= 0xDFFF) return { ok: false, error: '\u2018' + t[i] + '\u2019 is a surrogate (U+D800 to U+DFFF). Surrogates are not characters.' };
        cps.push(a.v); }
    } else {
      var s = String(o.text == null ? '' : o.text); if (!s) return { ok: false, empty: true, error: 'Enter some text.' };
      cps = []; for (i = 0; i < s.length; i++) { var c = s.charCodeAt(i), d = c; if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) { var e = s.charCodeAt(i + 1); if (e >= 0xDC00 && e <= 0xDFFF) { d = 0x10000 + ((c - 0xD800) << 10) + (e - 0xDC00); i++; } }
        if (d >= 0xD800 && d <= 0xDFFF) return { ok: false, error: 'The text contains a lone surrogate (U+' + H(d, 4) + '), which is not a valid character.' }; cps.push(d); }
      if (cps.length > 200) return { ok: false, error: 'Limit is 200 code points.' };
    }
    var rows = cps.map(urow), b8 = 0, u16 = 0; rows.forEach(function (r) { b8 += r.utf8.length; u16 += r.utf16.length; });
    return { ok: true, dir: o.dir === 'dec' ? 'dec' : 'enc', rows: rows, text: String.fromCodePoint.apply(null, cps), shown: rows.map(function (r) { return r.ctrl ? '<' + r.ch + '>' : r.ch; }).join(''), points: rows.map(function (r) { return r.u; }).join(' '), n: cps.length, utf8Bytes: b8, utf16Units: u16 };
  }
  var api = { ascii: ascii, unicode: unicode, utf8: utf8, utf16: utf16 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Chars = api;
})(typeof window !== 'undefined' ? window : this);
