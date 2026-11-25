/* Elecmetric Date Engine (Date Calculator, Mode 01: Date Difference).
   Date-only arithmetic: every date is a whole day number (days since 1970-01-01, proleptic Gregorian).
   No Date objects, no timestamps, no time zones, so daylight saving can never move a result by a day.
   Supported range: 0001-01-01 to 9999-12-31. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ElecDate = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MIN_Y = 1, MAX_Y = 9999;
  var ML = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function dim(y, m) { return m === 2 && isLeap(y) ? 29 : ML[m - 1]; }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function validate(y, m, d) {
    if (!isInt(y) || !isInt(m) || !isInt(d)) return 'Enter the year, month and day as whole numbers.';
    if (y < MIN_Y || y > MAX_Y) return 'The year must be between ' + MIN_Y + ' and ' + MAX_Y + '.';
    if (m < 1 || m > 12) return 'The month must be between 1 and 12.';
    if (d < 1) return 'The day must be 1 or more.';
    if (d > dim(y, m)) return d + ' ' + MN[m - 1] + ' ' + y + ' does not exist: ' + MN[m - 1] + ' ' + y + ' has ' + dim(y, m) + ' days.';
    return null;
  }
  /* Howard Hinnant's days_from_civil / civil_from_days: exact integer arithmetic. */
  function toDays(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400), yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function fromDays(z) {
    z += 719468;
    var era = Math.floor(z / 146097), doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400, doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153), d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp < 10 ? mp + 3 : mp - 9;
    return { y: y + (m <= 2 ? 1 : 0), m: m, d: d };
  }
  function weekday(days) { return (((days + 4) % 7) + 7) % 7; } /* 0 = Sunday ... 6 = Saturday; 1970-01-01 was a Thursday */
  function dayOfYear(days) { var c = fromDays(days); return days - toDays(c.y, 1, 1) + 1; }
  /* Calendar-month arithmetic from the ORIGINAL date: keep the day of month, otherwise the last day of the target month. */
  function addMonthsDays(days, n) {
    var c = fromDays(days), t = c.y * 12 + (c.m - 1) + n, ny = Math.floor(t / 12), nm = t - ny * 12 + 1;
    return toDays(ny, nm, Math.min(c.d, dim(ny, nm)));
  }
  /* Whole years, whole months and remaining days from lo to hi (lo <= hi), anchored on lo. */
  function ymdBetween(lo, hi) {
    var a = fromDays(lo), b = fromDays(hi), months = (b.y - a.y) * 12 + (b.m - a.m);
    if (addMonthsDays(lo, months) > hi) months--;
    var rest = hi - addMonthsDays(lo, months);
    return { y: Math.floor(months / 12), m: months % 12, d: rest, totalMonths: months };
  }
  function countWeekdays(a, b) { /* occurrences of each weekday (index 0 = Sunday) in the days a..b inclusive */
    var c = [0, 0, 0, 0, 0, 0, 0], n = b - a + 1;
    if (n <= 0) return c;
    var full = Math.floor(n / 7), rem = n % 7, i;
    for (i = 0; i < 7; i++) c[i] = full;
    for (i = 0; i < rem; i++) c[weekday(a + i)]++;
    return c;
  }
  function addDaysDate(days, n) { return fromDays(days + n); }

  /* opts: { start:{y,m,d}, end:{y,m,d}, inclusive:bool, weekend:[0..6], holidays:[day numbers] } */
  function difference(opts) {
    var e1 = validate(opts.start.y, opts.start.m, opts.start.d); if (e1) return { ok: false, error: 'Start date: ' + e1 };
    var e2 = validate(opts.end.y, opts.end.m, opts.end.d); if (e2) return { ok: false, error: 'End date: ' + e2 };
    var weekend = (opts.weekend || [0, 6]).filter(function (w, i, a) { return isInt(w) && w >= 0 && w <= 6 && a.indexOf(w) === i; });
    if (weekend.length === 7) return { ok: false, error: 'At least one day of the week must be a working day.' };
    var s = toDays(opts.start.y, opts.start.m, opts.start.d), e = toDays(opts.end.y, opts.end.m, opts.end.d);
    var reversed = e < s, lo = reversed ? e : s, hi = reversed ? s : e, inclusive = !!opts.inclusive;
    var elapsed = hi - lo, incl = elapsed + 1, N = inclusive ? incl : elapsed;
    var wa = inclusive ? lo : lo + 1, wb = hi; /* counting window: elapsed = after the start through the end; inclusive = start through end */
    var wc = countWeekdays(wa, wb), weekendDays = 0, i;
    for (i = 0; i < weekend.length; i++) weekendDays += wc[weekend[i]];
    var seen = {}, hol = [], onWork = 0;
    (opts.holidays || []).forEach(function (h) { if (isInt(h) && !seen[h]) { seen[h] = 1; if (h >= wa && h <= wb) { var onWe = weekend.indexOf(weekday(h)) >= 0; hol.push({ days: h, weekend: onWe }); if (!onWe) onWork++; } } });
    var ymd = ymdBetween(lo, inclusive ? hi + 1 : hi);
    var checks = [], nativeDiff = null;
    /* independent route 1: re-add the whole months, then the days, and land on the end of the counted period */
    var endPeriod = inclusive ? hi + 1 : hi;
    checks.push(['Adding ' + ymd.totalMonths + ' calendar month(s) and ' + ymd.d + ' day(s) to the earlier date lands exactly on the end of the counted period', addMonthsDays(lo, ymd.totalMonths) + ymd.d === endPeriod]);
    /* independent route 2: the platform date library (UTC, so no daylight saving), used only as a cross-check */
    if (typeof Date !== 'undefined') {
      var u = function (z) { var c = fromDays(z), dt = new Date(0); dt.setUTCFullYear(c.y, c.m - 1, c.d); dt.setUTCHours(0, 0, 0, 0); return Math.round(dt.getTime() / 86400000); };
      nativeDiff = u(hi) - u(lo);
      checks.push(['The elapsed day count equals the difference found with the browser’s UTC date library', nativeDiff === elapsed]);
    }
    var business = N - weekendDays - onWork, wn = Math.max(0, wb - wa + 1);
    checks.push(['Per-weekday counts add up to the ' + wn + ' day(s) in the counting window', wc.reduce(function (p, q) { return p + q; }, 0) === wn]);
    checks.push(['Business days (' + business + ') = weekdays (' + (N - weekendDays) + ') − holidays on working days (' + onWork + ')', business === (N - weekendDays) - onWork && business >= 0]);
    checks.push(['Weeks × 7 + remaining days = the days counted (' + N + ')', Math.floor(N / 7) * 7 + (N % 7) === N]);
    return {
      ok: true, reversed: reversed, inclusive: inclusive, lo: lo, hi: hi, loDate: fromDays(lo), hiDate: fromDays(hi),
      elapsed: elapsed, inclusiveDays: incl, days: N, ymd: ymd, totalMonths: ymd.totalMonths,
      weeks: Math.floor(N / 7), weekRest: N % 7, weeksDecimal: N / 7, weekdays: N - weekendDays, weekendDays: weekendDays,
      holidaysInPeriod: hol.length, holidaysOnWorkdays: onWork, holidaysOnWeekend: hol.length - onWork, holidayList: hol,
      business: business, byWeekday: wc, weekend: weekend, windowStart: wa, windowEnd: wb, windowDays: Math.max(0, wb - wa + 1),
      lastYearLeap: isLeap(fromDays(hi).y), leapDaysInSpan: leapDaysBetween(lo, hi), checks: checks,
      checksOk: checks.every(function (c) { return c[1]; })
    };
  }

  /* ISO 8601 week: weeks start on Monday, week 1 holds the year's first Thursday. Returns { week, year } (the ISO week-year can differ from the calendar year). */
  function isoWeek(days) {
    var wd = weekday(days) || 7, th = days + (4 - wd), y = fromDays(th).y;
    return { week: Math.floor((th - toDays(y, 1, 1)) / 7) + 1, year: y };
  }
  /* Add or subtract a period. p = { years, months, weeks, days } (whole numbers, 0 or more), sign = +1 or -1.
     Years and months are applied together as calendar months from the ORIGINAL date (day of month kept, otherwise the last valid day),
     then weeks and days as calendar days. A zero period returns the original date. */
  function addPeriod(date, p, sign) {
    var e = validate(date.y, date.m, date.d); if (e) return { ok: false, error: 'Start date: ' + e };
    var k = ['years', 'months', 'weeks', 'days'], i, v = {};
    for (i = 0; i < 4; i++) {
      var x = p[k[i]] == null || p[k[i]] === '' ? 0 : p[k[i]];
      if (!isInt(x)) return { ok: false, error: 'Enter ' + k[i] + ' as a whole number.' };
      if (x < 0) return { ok: false, error: 'Enter ' + k[i] + ' as 0 or more. Use Subtract to go backwards.' };
      if (x > 100000) return { ok: false, error: 'Enter ' + k[i] + ' as 100,000 or less.' };
      v[k[i]] = x;
    }
    sign = sign < 0 ? -1 : 1;
    var s = toDays(date.y, date.m, date.d), tm = v.years * 12 + v.months, td = v.weeks * 7 + v.days;
    var months = sign * tm, afterM = addMonthsDaysRaw(date, months);
    if (afterM === null) return { ok: false, error: 'The result falls outside the supported range (year ' + MIN_Y + ' to ' + MAX_Y + ').' };
    var r = afterM + sign * td, c = fromDays(r);
    if (c.y < MIN_Y || c.y > MAX_Y) return { ok: false, error: 'The result falls outside the supported range (year ' + MIN_Y + ' to ' + MAX_Y + ').' };
    var mc = fromDays(afterM), clamped = mc.d !== date.d;
    return { ok: true, sign: sign, start: s, afterMonths: afterM, afterMonthsDate: mc, clamped: clamped, totalMonths: tm, totalDays: td,
      result: r, date: c, weekday: weekday(r), dayOfYear: dayOfYear(r), iso: isoWeek(r), span: r - s, leap: isLeap(c.y), period: v };
  }
  function addMonthsDaysRaw(date, n) { /* like addMonthsDays but null when the year leaves 1..9999 */
    var t = date.y * 12 + (date.m - 1) + n, ny = Math.floor(t / 12), nm = t - ny * 12 + 1;
    if (ny < MIN_Y || ny > MAX_Y) return null;
    return toDays(ny, nm, Math.min(date.d, dim(ny, nm)));
  }
  function leapDaysBetween(lo, hi) { /* number of 29 February dates in lo..hi inclusive */
    var a = fromDays(lo).y, b = fromDays(hi).y, n = 0, y;
    for (y = a; y <= b; y++) if (isLeap(y)) { var f = toDays(y, 2, 29); if (f >= lo && f <= hi) n++; }
    return n;
  }

  /* ---- text parsing: formats 'dmy', 'mdy', 'ymd'. A 4-digit first number is always read as year-month-day (ISO). ---- */
  var RX = /^\s*(\d{1,4})\s*[\/\-.]\s*(\d{1,4})\s*[\/\-.]\s*(\d{1,4})(?!\d)\s*(.*)$/;
  function parseDate(text, fmt) {
    var m = RX.exec(String(text == null ? '' : text));
    if (!m) return { ok: false, error: 'Enter a date such as ' + example(fmt) + '.' };
    var a = m[1], b = m[2], c = m[3], y, mo, d, f = fmt;
    if (a.length === 4) f = 'ymd';
    if (f === 'ymd') { if (a.length !== 4) return { ok: false, error: 'Write the year with 4 digits first, for example ' + example('ymd') + '.' }; y = +a; mo = +b; d = +c; }
    else { if (c.length !== 4) return { ok: false, error: 'Write the year with 4 digits, for example ' + example(f) + '.' }; y = +c; if (f === 'dmy') { d = +a; mo = +b; } else { mo = +a; d = +b; } }
    var err = validate(y, mo, d);
    if (err) return { ok: false, error: err };
    return { ok: true, y: y, m: mo, d: d, days: toDays(y, mo, d), rest: m[4] };
  }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function example(fmt) { return fmt === 'mdy' ? '08/14/2026' : fmt === 'ymd' ? '2026-08-14' : '14/08/2026'; }
  function format(c, fmt) {
    return fmt === 'mdy' ? pad(c.m, 2) + '/' + pad(c.d, 2) + '/' + pad(c.y, 4) : fmt === 'ymd' ? pad(c.y, 4) + '-' + pad(c.m, 2) + '-' + pad(c.d, 2) : pad(c.d, 2) + '/' + pad(c.m, 2) + '/' + pad(c.y, 4);
  }
  function longDate(c) { var z = toDays(c.y, c.m, c.d); return WN[weekday(z)] + ', ' + c.d + ' ' + MN[c.m - 1] + ' ' + c.y; }
  /* One holiday per line: a date, then an optional name (separated by a comma, semicolon, tab or space). Blank lines and lines starting with # are skipped. */
  function parseHolidays(text, fmt) {
    var out = [], errors = [], lines = String(text || '').split(/\r?\n/), i;
    for (i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (!ln.trim() || /^\s*#/.test(ln) || (i === 0 && /^\s*date\b/i.test(ln))) continue;
      var r = parseDate(ln, fmt);
      if (!r.ok) { errors.push('Line ' + (i + 1) + ': ' + r.error); continue; }
      out.push({ days: r.days, name: String(r.rest || '').replace(/^[\s,;:\-\t]+/, '').trim(), y: r.y, m: r.m, d: r.d });
    }
    return { holidays: out, errors: errors };
  }
  return { MIN_Y: MIN_Y, MAX_Y: MAX_Y, MN: MN, WN: WN, isLeap: isLeap, dim: dim, validate: validate, toDays: toDays, fromDays: fromDays,
    weekday: weekday, dayOfYear: dayOfYear, addMonthsDays: addMonthsDays, ymdBetween: ymdBetween, countWeekdays: countWeekdays,
    difference: difference, isoWeek: isoWeek, addPeriod: addPeriod, parseDate: parseDate, parseHolidays: parseHolidays, format: format, longDate: longDate, example: example, addDaysDate: addDaysDate };
});
