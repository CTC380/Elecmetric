/* Generates one crawlable landing page per conversion intent from the Elecmetric registry.
   Every number on a page is computed by engine.js at build time, so the engine stays the single source.
   Run: node tools/build_pages.js            (writes ./pages)
        BASE_URL=https://example.com/elecmetric node tools/build_pages.js   (adds canonical links and a root sitemap.xml; robots.txt is always written to the root) */
const fs = require('fs'), path = require('path');
const E = require('../engine.js');
E.setGrouping('intl');

/* "Tell us how to improve this page": no server, so Submit opens the visitor's email app with the message and the page address. Hidden when contact_email is empty. */
function feedbackBlock() {
  const mail = (JSON.parse(fs.readFileSync(path.join(__dirname, 'site_info.json'), 'utf8')) || {}).contact_email;
  if (!mail) return '';
  return '<section class="w fb" aria-labelledby="fb-h"><h2 id="fb-h">Tell us how to improve this page</h2><textarea id="fb-t" rows="4" maxlength="1500" placeholder="Your message ..." aria-label="Tell us how to improve this page"></textarea><p><button type="button" class="btn" id="fb-b">Email your suggestion</button> <button type=\"button\" class=\"btn\" id=\"sh-b\">Share this page</button> <span class="note" id="fb-n">This opens your email app. Nothing is sent until you press send.</span></p></section>' +
    '<script>(function(){var b=document.getElementById("fb-b");if(!b)return;b.onclick=function(){var t=document.getElementById("fb-t").value.trim(),n=document.getElementById("fb-n");if(!t){n.textContent="Please write a message first.";return}location.assign("mailto:"+' + JSON.stringify(mail) + '+"?subject="+encodeURIComponent("Elecmetric feedback: "+document.title)+"&body="+encodeURIComponent(t+"\\n\\nPage: "+location.href))}})();</script>' +
    '<script>(function(){var s=document.getElementById(\"sh-b\");if(!s)return;s.onclick=function(){var u=location.href,t=document.title,n=document.getElementById(\"fb-n\");if(navigator.share){navigator.share({title:t,url:u}).catch(function(){});return}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){n.textContent=\"Link copied.\"},function(){n.textContent=\"Copy this address: \"+u})}else{n.textContent=\"Copy this address: \"+u}}})();</script>';
}

/* Author and review attribution for page footers. The author comes from tools/site_info.json; a reviewer is only ever named
   through tools/review_records.json, so a page cannot claim a review that has not been recorded. */
const SITE_INFO = JSON.parse(fs.readFileSync(path.join(__dirname, 'site_info.json'), 'utf8'));
const STD_NA = JSON.parse(fs.readFileSync(path.join(__dirname, 'standard_applicability.json'), 'utf8')).not_applicable || {};
const REVIEW_RECS = JSON.parse(fs.readFileSync(path.join(__dirname, 'review_records.json'), 'utf8')).records || {};
const TEAM_APPROVAL = JSON.parse(fs.readFileSync(path.join(__dirname, 'team_review_approval.json'), 'utf8'));
function attribution() {
  const total = E.CALCS.length, n = Object.keys(REVIEW_RECS).filter((k) => REVIEW_RECS[k] && REVIEW_RECS[k].approved).length;
  const who = SITE_INFO.credit ? SITE_INFO.credit + '. ' : '';
  const ap = n ? REVIEW_RECS[Object.keys(REVIEW_RECS).filter((k) => REVIEW_RECS[k] && REVIEW_RECS[k].approved)[0]].approved : null;
  if (ap) return who + 'Individual technical review recorded for ' + n + ' of ' + total + ' calculators (' + ap.reviewer + ', ' + ap.date + '). This is not a clause-by-clause review against licensed standards.';
  return who + (n ? 'No independent technical review has been carried out' : 'No independent technical review of the calculators has been carried out') + '. Results are for estimating.';
}

/* Verification register (tools/verification_register.js): classification of every calculator and the checked / not-checked lists. */
const VREG = require('./verification_register.js'), VBASIS = JSON.parse(fs.readFileSync(path.join(__dirname, 'verification_register.json'), 'utf8')), SCOPE = JSON.parse(fs.readFileSync(path.join(__dirname, 'calc_scope.json'), 'utf8'));
function vectorCounts() { const vec = {}; JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'reference_vectors.json'), 'utf8')).forEach((v) => { vec[v.id] = (vec[v.id] || 0) + 1; }); return vec; }
const REGISTER = VREG.build(E.CALCS, { records: REVIEW_RECS, basis: VBASIS, stdNA: STD_NA, vectors: vectorCounts(), today: new Date().toISOString().slice(0, 10), author: SITE_INFO.calculation_author || '', reviewer: '', teamApproval: null });
function scopeFor(id) { const e = REGISTER.reg[id], own = SCOPE.calculators[id], d = SCOPE.defaults[e.basis]; return { checked: (own || d).checked, notChecked: (own || d).notChecked, custom: !!own }; }
function verifBlock(def) {
  const e = REGISTER.reg[def.id], sc = scopeFor(def.id), li = (a) => '<ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const row = (k, v) => '<tr><th scope="row">' + k + '</th><td>' + (v ? esc(v) : '<em>not recorded</em>') + '</td></tr>';
  return '<section id="verification"><h2>Verification status: ' + esc(e.label) + '</h2><div class="card vstat v-' + e.cls + '"><p style="margin:0"><strong>' + esc(e.label) + '.</strong> ' + esc(e.meaning) + (e.basisNote ? ' Basis: ' + esc(e.basisNote) + '.' : '') + '</p></div>' +
    '<p><strong>What this calculator checks</strong></p>' + li(sc.checked) + '<p><strong>What remains unverified</strong></p>' + li(sc.notChecked) +
    '<p><strong>Verification register entry</strong></p><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: verification register"><table><tbody>' +
    row('Calculation author', e.author) + row('Technical review', e.individualApprovalStatus === 'Recorded' ? e.reviewer : 'No independent technical review has been carried out') + row('Individual professional approval', e.individualApprovalStatus) + row('Formula reference', e.reference) + row('Standard and edition', e.standard) +
    row('Standard review state', e.standardReviewStatus === 'scope_screened' ? 'Public-scope screened; licensed clause review still pending' : e.standardReviewStatus === 'clause_reviewed' ? 'Clause review recorded' : e.standardReviewStatus === 'not_applicable' ? 'Not applicable' : '') +
    row('Scope-screening note', e.standardScopeNote) + row('Cross-check test cases', e.vectors ? e.vectors + ' reference vectors (tests/reference_vectors.json)' : '') + row('Review date', e.reviewDate) + row('Next review date', e.nextReview) + row('Status', e.label) +
    '</tbody></table></div>' + (/BS 7671|AS\/NZS 3008/.test(e.standard || '') ? '<p class="note">Provisional standard constants: the values used for this standard have not been revalidated against its latest edition. Check them in a licensed copy before relying on the result.</p>' : '') + (e.missing.length ? '<p class="note">Needed before this calculator can be marked Verified: ' + esc(e.missing.join('; ')) + '.</p>' : '') + '</section>';
}

const EE = 1.602176634e-19;
/* [slug, from, to, calculator id, input overrides, headline outputs [[key, unit]], vary [key, unit, values], opposite slug] */
const T = (slug, id, raw, head, vary, rev) => ({ slug, calc: id, raw, head, vary, rev });
const INTENTS = [
  Object.assign(T('amps-to-kw', 'amps-to-kw', { I: [100, 'A'], V: [400, 'V'], pf: 0.9, phase: 3, eff: 0.92 }, [['P', 'kW'], ['Pout', 'kW']], ['I', 'A', [5, 10, 20, 50, 100, 200, 500]], 'kw-to-amps'), { showEng: ['vt', 'eff'] }),
  Object.assign(T('kw-to-amps', 'three-phase-current', { P: [100, 'kW'], V: [400, 'V'], pf: 0.9, phase: 3 }, [['I', 'A']], ['P', 'kW', [1, 5, 10, 50, 100, 200, 500]], 'amps-to-kw'), { showEng: ['vt', 'eff'] }),
  T('hp-to-amps', 'motor-current', { P: [10, 'HP'], V: [415, 'V'], pf: 0.85, eff: 0.9, phase: 3 }, [['I', 'A']], ['P', 'HP', [0.5, 1, 2, 5, 10, 20, 50, 100]], 'amps-to-hp'),
  Object.assign(T('amps-to-hp', 'amps-to-kw', { I: [15, 'A'], V: [415, 'V'], pf: 0.85, phase: 3, eff: 0.9 }, [['Pout', 'HP']], ['I', 'A', [1, 2, 5, 10, 15, 20, 50, 100]], 'hp-to-amps'), { showEng: ['vt', 'eff'] }),
  T('amps-to-kva', 'amps-to-kva', { I: [100, 'A'], V: [415, 'V'], phase: 3 }, [['S', 'kVA']], ['I', 'A', [5, 10, 20, 50, 100, 200, 500]], 'kva-to-amps'),
  T('kva-to-amps', 'kva-to-amps', { S: [500, 'kVA'], V: [415, 'V'], phase: 3 }, [['I', 'A']], ['S', 'kVA', [10, 25, 63, 100, 250, 500, 1000]], 'amps-to-kva'),
  T('amps-to-va', 'amps-to-kva', { I: [10, 'A'], V: [230, 'V'], phase: 1 }, [['S', 'VA']], ['I', 'A', [1, 2, 5, 10, 16, 20, 32]], 'va-to-amps'),
  T('va-to-amps', 'kva-to-amps', { S: [2300, 'VA'], V: [230, 'V'], phase: 1 }, [['I', 'A']], ['S', 'VA', [100, 500, 1000, 2300, 3000, 5000, 10000]], 'amps-to-va'),
  T('amps-to-volts', 'power-vi-solver', { P: [2.07, 'kW'], V: '', I: [10, 'A'], pf: 0.9, phase: 1 }, [['V', 'V']], ['I', 'A', [1, 2, 5, 10, 20, 50]], 'volts-to-amps'),
  T('volts-to-amps', 'watts-to-amps', { P: [2070, 'W'], V: [230, 'V'], pf: 0.9, phase: 1 }, [['I', 'A']], ['V', 'V', [12, 24, 110, 230, 240, 400]], 'amps-to-volts'),
  T('amps-to-watts', 'amps-to-watts', { I: [10, 'A'], V: [230, 'V'], pf: 0.9, phase: 1 }, [['P', 'W']], ['I', 'A', [1, 2, 5, 10, 16, 20, 32]], 'watts-to-amps'),
  T('watts-to-amps', 'watts-to-amps', { P: [2070, 'W'], V: [230, 'V'], pf: 0.9, phase: 1 }, [['I', 'A']], ['P', 'W', [100, 500, 1000, 2070, 3000, 5000]], 'amps-to-watts'),
  T('kva-to-watts', 'kva-to-kw', { S: [100, 'kVA'], pf: 0.8 }, [['P', 'W']], ['S', 'kVA', [1, 5, 10, 50, 100, 500]], 'watts-to-kva'),
  T('watts-to-kva', 'kw-to-kva', { P: [80000, 'W'], pf: 0.8 }, [['S', 'kVA']], ['P', 'W', [1000, 5000, 10000, 50000, 80000, 100000]], 'kva-to-watts'),
  T('kva-to-kw', 'kva-to-kw', { S: [100, 'kVA'], pf: 0.8 }, [['P', 'kW']], ['S', 'kVA', [1, 5, 10, 50, 100, 500]], 'kw-to-kva'),
  T('kw-to-kva', 'kw-to-kva', { P: [80, 'kW'], pf: 0.8 }, [['S', 'kVA']], ['P', 'kW', [1, 5, 10, 50, 80, 100]], 'kva-to-kw'),
  { slug: 'kva-to-va', kind: 'unit', dim: 'apparent', fromU: 'kVA', toU: 'VA', calc: 'kva-to-kw', key: 'S', val: 5, vals: [0.1, 0.5, 1, 5, 10, 100], rev: 'va-to-kva' },
  { slug: 'va-to-kva', kind: 'unit', dim: 'apparent', fromU: 'VA', toU: 'kVA', calc: 'kva-to-kw', key: 'S', val: 5000, vals: [100, 500, 1000, 5000, 10000, 100000], rev: 'kva-to-va' },
  T('kw-to-volts', 'power-vi-solver', { P: [2.07, 'kW'], V: '', I: [10, 'A'], pf: 0.9, phase: 1 }, [['V', 'V']], ['P', 'kW', [0.5, 1, 2.07, 3, 5, 10]], 'volts-to-kw'),
  T('volts-to-kw', 'amps-to-kw', { I: [10, 'A'], V: [230, 'V'], pf: 0.9, phase: 1 }, [['P', 'kW']], ['V', 'V', [12, 24, 110, 230, 240, 415]], 'kw-to-volts'),
  T('kw-to-kwh', 'power-energy-time', { P: [2, 'kW'], E: '', t: [5, 'h'] }, [['E', 'kWh']], ['t', 'h', [0.5, 1, 2, 5, 8, 24]], 'kwh-to-kw'),
  T('kwh-to-kw', 'kwh-to-kw', { E: [12, 'kWh'], t: [4, 'h'] }, [['P', 'kW']], ['E', 'kWh', [1, 5, 12, 24, 50, 100]], 'kw-to-kwh'),
  T('kw-to-va', 'kw-to-kva', { P: [1, 'kW'], pf: 0.8 }, [['S', 'VA']], ['P', 'kW', [0.1, 0.5, 1, 2, 5, 10]], 'va-to-kw'),
  T('va-to-kw', 'kva-to-kw', { S: [10000, 'VA'], pf: 0.8 }, [['P', 'kW']], ['S', 'VA', [100, 500, 1000, 5000, 10000, 50000]], 'kw-to-va'),
  T('kwh-to-watts', 'kwh-to-kw', { E: [12, 'kWh'], t: [4, 'h'] }, [['P', 'W']], ['E', 'kWh', [1, 5, 12, 24, 50, 100]], 'watts-to-kwh'),
  T('watts-to-kwh', 'power-energy-time', { P: [500, 'W'], E: '', t: [6, 'h'] }, [['E', 'kWh']], ['t', 'h', [0.5, 1, 2, 6, 12, 24]], 'kwh-to-watts'),
  T('mah-to-wh', 'battery-mah-wh', { Q: [5000, 'mAh'], V: [3.7, 'V'], E: '' }, [['E', 'Wh']], ['Q', 'mAh', [1000, 2000, 3000, 5000, 10000, 20000]], 'wh-to-mah'),
  T('wh-to-mah', 'battery-mah-wh', { Q: '', V: [3.7, 'V'], E: [18.5, 'Wh'] }, [['Q', 'mAh']], ['E', 'Wh', [5, 10, 18.5, 50, 100]], 'mah-to-wh'),
  T('ah-to-wh', 'battery-mah-wh', { Q: [100, 'Ah'], V: [12, 'V'], E: '' }, [['E', 'Wh']], ['Q', 'Ah', [1, 2, 5, 10, 50, 100, 200]], 'wh-to-ah'),
  T('wh-to-ah', 'battery-mah-wh', { Q: '', V: [12, 'V'], E: [1200, 'Wh'] }, [['Q', 'Ah']], ['E', 'Wh', [12, 60, 120, 600, 1200, 2400]], 'ah-to-wh'),
  T('ah-to-kwh', 'battery-mah-wh', { Q: [100, 'Ah'], V: [48, 'V'], E: '' }, [['E', 'kWh']], ['Q', 'Ah', [10, 50, 100, 150, 200, 300]], 'kwh-to-ah'),
  T('kwh-to-ah', 'battery-mah-wh', { Q: '', V: [48, 'V'], E: [4.8, 'kWh'] }, [['Q', 'Ah']], ['E', 'kWh', [1, 2.4, 4.8, 10, 15, 25]], 'ah-to-kwh'),
  T('va-to-watts', 'kva-to-kw', { S: [1000, 'VA'], pf: 0.8 }, [['P', 'W']], ['S', 'VA', [100, 250, 500, 1000, 2500, 5000]], 'watts-to-va'),
  T('watts-to-va', 'kw-to-kva', { P: [800, 'W'], pf: 0.8 }, [['S', 'VA']], ['P', 'W', [100, 250, 500, 800, 2000, 5000]], 'va-to-watts'),
  T('volts-to-watts', 'power-vir', { V: [230, 'V'], I: [5, 'A'] }, [['P', 'W']], ['V', 'V', [12, 24, 110, 230, 400]], 'watts-to-volts'),
  T('watts-to-volts', 'power-vi-solver', { P: [1150, 'W'], V: '', I: [5, 'A'], pf: 1, phase: 1 }, [['V', 'V']], ['P', 'W', [100, 500, 1150, 2000, 5000]], 'volts-to-watts'),
  T('joules-to-watts', 'power-energy-time', { P: '', E: [3600, 'J'], t: [60, 's'] }, [['P', 'W']], ['E', 'J', [100, 1000, 3600, 10000, 100000]], 'watts-to-joules'),
  T('watts-to-joules', 'power-energy-time', { P: [100, 'W'], E: '', t: [10, 's'] }, [['E', 'J']], ['t', 's', [1, 10, 60, 600, 3600]], 'joules-to-watts'),
  T('joules-to-volts', 'energy-voltage-charge', { E: [24, 'J'], V: '', Q: [2, 'C'] }, [['V', 'V']], ['E', 'J', [1, 6, 12, 24, 100]], 'volts-to-joules'),
  T('volts-to-joules', 'energy-voltage-charge', { E: '', V: [12, 'V'], Q: [2, 'C'] }, [['E', 'J']], ['V', 'V', [1.5, 5, 12, 24, 230]], 'joules-to-volts'),
  T('ev-to-volts', 'energy-voltage-charge', { E: [5, 'eV'], V: '', Q: [EE, 'C'] }, [['V', 'V']], ['E', 'eV', [1, 5, 10, 100, 1000]], 'volts-to-ev'),
  T('volts-to-ev', 'energy-voltage-charge', { E: '', V: [5, 'V'], Q: [EE, 'C'] }, [['Eev', 'eV']], ['V', 'V', [1, 5, 12, 100, 1000]], 'ev-to-volts'),
  T('electricity-bill', 'electricity-bill-slabs', { E: 480, s1: 100, r1: 4, s2: 200, r2: 6, r3: 8, fc: 100, tax: 5 }, [['total', ''], ['energy', '']], ['E', '', [50, 100, 200, 300, 480, 800]], null),
  T('energy-consumption', 'energy-cost', { P: [2, 'kW'], h: 8, d: 30, t: 8 }, [['E', 'kWh']], ['P', 'kW', [0.1, 0.5, 1, 2, 5]], null),
  T('energy-cost', 'energy-cost', { P: [2, 'kW'], h: 8, d: 30, t: 8 }, [['E', 'kWh'], ['cost', '']], ['P', 'kW', [0.1, 0.5, 1, 2, 5]], null),
  T('ohms-law', 'vipr-solver', { V: [230, 'V'], I: [5, 'A'], R: '', P: '' }, [['R', 'Ω'], ['P', 'W']], ['I', 'A', [0.5, 1, 2, 5, 10, 20]], null),
  T('power-calculator', 'power-vir', { V: [230, 'V'], I: [5, 'A'] }, [['P', 'W']], ['I', 'A', [0.5, 1, 2, 5, 10, 20]], null),
  T('power-factor', 'power-factor', { P: [80, 'kW'], S: [100, 'kVA'] }, [['pf', ''], ['phi', '']], ['P', 'kW', [50, 60, 70, 80, 90, 100]], null),
  T('voltage-divider', 'voltage-divider', { Vin: [12, 'V'], R1: [10, 'kΩ'], R2: [10, 'kΩ'] }, [['Vo', 'V']], ['R2', 'kΩ', [1, 2.2, 4.7, 10, 22, 47]], null),
  Object.assign(T('voltage-drop', 'dc-voltage-drop', {}, [['Vd', 'V'], ['pct', '']], ['L', 'm', [10, 25, 50, 100, 200]], null), { hide: ['awg', 'D', 'rhoC', 'aC'], formHide: ['sz', 'awg', 'D', 'rhoC', 'aC'], formOpts: { mat: [1, 2, 3, 4, 5, 6] } }),
  T('watts-volts-amps-ohms', 'vipr-solver', { V: [12, 'V'], I: '', R: [6, 'Ω'], P: '' }, [['I', 'A'], ['P', 'W']], ['R', 'Ω', [1, 2, 6, 10, 100]], null),
  T('amps-to-ohms', 'vipr-solver', { V: [12, 'V'], I: [2, 'A'], R: '', P: '' }, [['R', 'Ω']], ['I', 'A', [0.5, 1, 2, 5, 10, 20]], 'ohms-to-amps'),
  T('ohms-to-amps', 'vipr-solver', { V: [12, 'V'], I: '', R: [6, 'Ω'], P: '' }, [['I', 'A']], ['R', 'Ω', [1, 2, 6, 10, 50, 100]], 'amps-to-ohms'),
  T('volts-to-ohms', 'vipr-solver', { V: [230, 'V'], I: [5, 'A'], R: '', P: '' }, [['R', 'Ω']], ['V', 'V', [12, 24, 110, 230, 400]], 'ohms-to-volts'),
  T('ohms-to-volts', 'vipr-solver', { V: '', I: [5, 'A'], R: [46, 'Ω'], P: '' }, [['V', 'V']], ['R', 'Ω', [1, 10, 46, 100, 1000]], 'volts-to-ohms'),
  T('kw-to-wh', 'power-energy-time', { P: [1.5, 'kW'], E: '', t: [2, 'h'] }, [['E', 'Wh']], ['t', 'h', [0.5, 1, 2, 5, 8, 24]], 'wh-to-kw'),
  T('wh-to-kw', 'power-energy-time', { P: '', E: [3000, 'Wh'], t: [2, 'h'] }, [['P', 'kW']], ['E', 'Wh', [100, 500, 1000, 3000, 5000, 10000]], 'kw-to-wh'),
  T('kw-to-joules', 'power-energy-time', { P: [2, 'kW'], E: '', t: [60, 's'] }, [['E', 'J']], ['t', 's', [1, 10, 60, 600, 3600]], 'joules-to-kw'),
  T('joules-to-kw', 'power-energy-time', { P: '', E: [360000, 'J'], t: [60, 's'] }, [['P', 'kW']], ['E', 'J', [1000, 36000, 360000, 3600000, 36000000]], 'kw-to-joules'),
  T('kj-to-watts', 'power-energy-time', { P: '', E: [36, 'kJ'], t: [60, 's'] }, [['P', 'W']], ['E', 'kJ', [1, 6, 36, 100, 360]], 'watts-to-kj'),
  T('watts-to-kj', 'power-energy-time', { P: [250, 'W'], E: '', t: [60, 's'] }, [['E', 'kJ']], ['t', 's', [1, 10, 60, 600, 3600]], 'kj-to-watts'),
  T('kw-to-kj', 'power-energy-time', { P: [2, 'kW'], E: '', t: [60, 's'] }, [['E', 'kJ']], ['t', 's', [1, 10, 60, 600, 3600]], 'kj-to-kw'),
  T('kj-to-kw', 'power-energy-time', { P: '', E: [360, 'kJ'], t: [60, 's'] }, [['P', 'kW']], ['E', 'kJ', [1, 6, 36, 100, 360, 3600]], 'kw-to-kj'),
  T('watts-to-wh', 'power-energy-time', { P: [250, 'W'], E: '', t: [2, 'h'] }, [['E', 'Wh']], ['t', 'h', [0.5, 1, 2, 5, 8, 24]], 'wh-to-watts'),
  T('wh-to-watts', 'power-energy-time', { P: '', E: [3000, 'Wh'], t: [2, 'h'] }, [['P', 'W']], ['E', 'Wh', [100, 500, 1000, 3000, 5000, 10000]], 'watts-to-wh'),
  T('lumens-to-lux', 'lumens-lux-area', { phi: 3000, E: '', A: [20, 'm²'], u: 1 }, [['E', '']], ['phi', '', [500, 1000, 3000, 5000, 10000]], 'lux-to-lumens'),
  T('lux-to-lumens', 'lumens-lux-area', { phi: '', E: 300, A: [50, 'm²'], u: 1 }, [['phi', '']], ['E', '', [50, 100, 300, 500, 750]], 'lumens-to-lux'),
  T('candela-to-lux', 'candela-lux-distance', { I: 1000, E: '', d: [5, 'm'], th: 0 }, [['E', '']], ['I', '', [100, 500, 1000, 2000, 5000]], 'lux-to-candela'),
  T('lux-to-candela', 'candela-lux-distance', { I: '', E: 25, d: [4, 'm'], th: 0 }, [['I', '']], ['E', '', [5, 10, 25, 50, 100]], 'candela-to-lux'),
  T('lumens-to-candela', 'candela-lumens-beam', { I: '', phi: 1000, th: 60 }, [['I', '']], ['phi', '', [100, 500, 1000, 2000, 5000]], 'candela-to-lumens'),
  T('candela-to-lumens', 'candela-lumens-beam', { I: 1000, phi: '', th: 60 }, [['phi', '']], ['I', '', [100, 500, 1000, 2000, 5000]], 'lumens-to-candela'),
  T('lumens-to-watts', 'lumens-watts', { phi: 800, P: '', eta: 80 }, [['P', 'W']], ['phi', '', [100, 400, 800, 1600, 3000]], 'watts-to-lumens'),
  T('watts-to-lumens', 'lumens-watts', { phi: '', P: [10, 'W'], eta: 100 }, [['phi', '']], ['P', 'W', [3, 5, 10, 20, 50]], 'lumens-to-watts'),
  T('lux-to-watts', 'lux-to-watts', { E: 300, A: [50, 'm²'], eta: 100, uf: 0.6, mf: 0.8 }, [['P', 'W'], ['phi', '']], ['E', '', [100, 300, 500, 750, 1000]], 'watts-to-lux'),
  T('watts-to-lux', 'watts-to-lux', { P: [100, 'W'], eta: 100, A: [20, 'm²'], uf: 0.6, mf: 0.8 }, [['E', '']], ['P', 'W', [10, 50, 100, 250, 500]], 'lux-to-watts'),
  T('lumens-to-millicandela', 'millicandela-lumens-beam', { I: '', phi: 1, th: 30 }, [['I', '']], ['phi', '', [0.5, 1, 2, 5, 10]], 'millicandela-to-lumens'),
  T('millicandela-to-lumens', 'millicandela-lumens-beam', { I: 5000, phi: '', th: 30 }, [['phi', '']], ['I', '', [500, 1000, 5000, 10000, 20000]], 'lumens-to-millicandela'),
  { slug: 'wire-gauge', kind: 'awg', calc: 'wire-gauge-conversion', rev: null }
];

const NAME = { amps: 'Amps', kw: 'kW', kva: 'kVA', va: 'VA', volts: 'Volts', watts: 'Watts', kwh: 'kWh', joules: 'Joules', ev: 'eV', mah: 'mAh', ah: 'Ah', hp: 'HP', wh: 'Wh', ohms: 'Ohms', kj: 'kJ', lumens: 'Lumens', lux: 'Lux', candela: 'Candela', millicandela: 'Millicandela' };
const TITLES = { 'electricity-bill': 'Electricity Bill (tariff slabs)', 'energy-consumption': 'Energy Consumption', 'energy-cost': 'Energy Cost (one appliance)', 'ohms-law': "Ohm's Law (V, I, R, P)", 'power-calculator': 'Power', 'power-factor': 'Power Factor', 'voltage-divider': 'Voltage Divider', 'voltage-drop': 'DC Cable Voltage Drop', 'watts-volts-amps-ohms': 'Watts, Volts, Amps and Ohms', 'wire-gauge': 'Wire Gauge (AWG)' };
const DESCS = {
  'electricity-bill': 'Estimate a whole electricity bill from meter units, tariff slabs, a fixed charge and tax. For one appliance use Energy Cost. Formula and worked example.',
  'energy-consumption': 'Work out energy use in kWh from power, hours per day and days. Formula, worked example and a table of typical values.',
  'energy-cost': 'Work out the energy in kWh and running cost of one appliance from power, hours, days and tariff. For a whole bill use Electricity Bill. Formula and example.',
  'ah-to-wh': 'Convert Ah to Wh by multiplying the capacity by the battery voltage: Wh = Ah × V. Formula, worked example and a table of typical values.',
  'wh-to-ah': 'Convert Wh to Ah by dividing the energy by the battery voltage: Ah = Wh / V. Formula, worked example and a table of typical values.',
  'ah-to-kwh': 'Convert Ah to kWh from the battery voltage: kWh = Ah × V / 1,000. Formula, worked example and a table of typical values for 12 V to 48 V banks.',
  'kwh-to-ah': 'Convert kWh to Ah from the battery voltage: Ah = kWh × 1,000 / V. Formula, worked example and a table of typical values. Voltage is required.',
  'hp-to-amps': 'Convert motor HP to amps from voltage, efficiency, power factor and phase. Formula, worked example and a table. HP alone cannot give amps.',
  'amps-to-hp': 'Convert motor amps to shaft HP from voltage, efficiency, power factor and phase. Formula, worked example and a table. Amps alone cannot give HP.',
  'ohms-law': "Ohm's law calculator: enter any two of voltage, current, resistance and power and get the rest. Formula, worked example and typical values.",
  'power-calculator': 'Calculate electrical power from voltage and current, and resistance from the same two values. Formula, worked example and typical values.',
  'power-factor': 'Calculate power factor and phase angle from real power in kW and apparent power in kVA. Formula, worked example and typical values.',
  'voltage-divider': 'Calculate the output voltage and current of a two-resistor voltage divider. Formula, worked example and a table of typical values.',
  'voltage-drop': 'Calculate cable voltage drop from material, conductor size, length and current. Formula, worked example and a table of typical values.',
  'watts-volts-amps-ohms': 'Enter any two of watts, volts, amps and ohms and get the other two. Formula, worked example and a table of typical values.',
  'amps-to-ohms': 'Convert amps to ohms from the circuit voltage: R = V / I. Formula, worked example and a table of typical values. Amps alone cannot give ohms.',
  'ohms-to-amps': 'Convert ohms to amps from the circuit voltage: I = V / R. Formula, worked example and a table of typical values. Ohms alone cannot give amps.',
  'volts-to-ohms': 'Convert volts to ohms from the current: R = V / I. Ohm\'s law formula, worked example and a table of typical values. Volts alone cannot give ohms.',
  'ohms-to-volts': 'Convert ohms to volts from the current: V = I × R. Ohm\'s law formula, worked example and a table of typical values. Ohms alone cannot give volts.',
  'kw-to-wh': 'Convert kW to Wh by multiplying power by running time in hours. Formula, worked example and a table of typical values. kW is power, Wh is energy.',
  'wh-to-kw': 'Convert Wh to kW by dividing energy by running time in hours. Formula, worked example and a table of typical values. Wh is energy, kW is power.',
  'kw-to-joules': 'Convert kW to joules from the time in seconds: E = P × t. Formula, worked example and a table of typical values. One kW for one second is 1,000 J.',
  'joules-to-kw': 'Convert joules to kW by dividing the energy by the time in seconds, then by 1,000. Formula, worked example and a table of typical values.',
  'kj-to-watts': 'Convert kJ to watts by dividing the energy by the time in seconds. One watt is one joule per second. Formula, worked example and a table of values.',
  'kw-to-kj': 'Convert kW to kJ from the time in seconds: E = P × t. One kW is 1,000 joules per second. Formula, worked example and a table of typical values.',
  'kj-to-kw': 'Convert kJ to kW by dividing the energy by the time in seconds. Formula, worked example and a table of typical values.',
  'watts-to-wh': 'Convert watts to Wh by multiplying power by running time in hours. Formula, worked example and a table of typical values. Watts are power, Wh is energy.',
  'wh-to-watts': 'Convert Wh to watts by dividing energy by running time in hours. Formula, worked example and a table of typical values.',
  'watts-to-kj': 'Convert watts to kJ by multiplying the power by the time in seconds, then dividing by 1,000. Formula, worked example and a table of values.',
  'lumens-to-lux': 'Convert lumens to lux from the area the light covers: E = lumens / m². Formula, worked example and a table. Lumens alone cannot give lux.',
  'lux-to-lumens': 'Convert lux to lumens from the area: lumens = lux × m². Formula, worked example and a table of typical values. Lux alone cannot give lumens.',
  'candela-to-lux': 'Convert candela to lux from the distance with the inverse-square law: E = cd / d². Formula, worked example and a table of typical values.',
  'lux-to-candela': 'Convert lux to candela from the distance with the inverse-square law: cd = lux × d². Formula, worked example and a table of typical values.',
  'lumens-to-candela': 'Convert lumens to candela from the beam angle: cd = lumens / solid angle. Formula, worked example and a table. For millicandela, multiply by 1,000.',
  'candela-to-lumens': 'Convert candela to lumens from the beam angle: lumens = cd × solid angle. Formula, worked example and a table. Millicandela is cd / 1,000.',
  'lumens-to-watts': 'Convert lumens to watts with the lamp efficacy in lm/W: W = lumens / efficacy. Formula, worked example and a table. There is no single factor.',
  'watts-to-lumens': 'Convert watts to lumens with the lamp efficacy in lm/W: lumens = W × efficacy. Formula, worked example and a table. There is no single factor.',
  'lux-to-watts': 'Convert lux to watts for a room: lamp lumens = lux × area / (utilisation × maintenance), then watts = lumens / efficacy. Formula, worked example and a table.',
  'watts-to-lux': 'Convert watts to lux for a room: lumens = watts × efficacy, then lux = lumens × utilisation × maintenance / area. Formula, worked example and a table.',
  'lumens-to-millicandela': 'Convert lumens to millicandela from the beam angle: mcd = lumens / solid angle × 1,000. Formula, worked example and a table for LED data sheets.',
  'millicandela-to-lumens': 'Convert millicandela to lumens from the beam angle: lumens = mcd / 1,000 × solid angle. Formula, worked example and a table for LED data sheets.'
};
const titleOf = (s) => TITLES[s] || s.split('-to-').map((p) => NAME[p]).join(' to ');
const GROUPS = [
  ['Current, power and apparent power', ['amps-to-kw', 'kw-to-amps', 'hp-to-amps', 'amps-to-hp', 'amps-to-kva', 'kva-to-amps', 'amps-to-va', 'va-to-amps', 'amps-to-watts', 'watts-to-amps', 'kva-to-kw', 'kw-to-kva', 'kva-to-watts', 'watts-to-kva', 'va-to-kw', 'kw-to-va', 'va-to-watts', 'watts-to-va', 'kva-to-va', 'va-to-kva']],
  ['Voltage', ['amps-to-volts', 'volts-to-amps', 'kw-to-volts', 'volts-to-kw', 'volts-to-watts', 'watts-to-volts']],
  ['Energy and cost', ['kw-to-kwh', 'kwh-to-kw', 'kw-to-wh', 'wh-to-kw', 'watts-to-wh', 'wh-to-watts', 'watts-to-kwh', 'kwh-to-watts', 'energy-consumption', 'energy-cost', 'electricity-bill']],
  ['Joules, electron-volts and batteries', ['joules-to-watts', 'watts-to-joules', 'kw-to-joules', 'joules-to-kw', 'kj-to-watts', 'watts-to-kj', 'kw-to-kj', 'kj-to-kw', 'joules-to-volts', 'volts-to-joules', 'ev-to-volts', 'volts-to-ev', 'mah-to-wh', 'wh-to-mah', 'ah-to-wh', 'wh-to-ah', 'ah-to-kwh', 'kwh-to-ah']],
  ['Ohms and resistance', ['amps-to-ohms', 'ohms-to-amps', 'volts-to-ohms', 'ohms-to-volts']],
  ['Lighting', ['lumens-to-lux', 'lux-to-lumens', 'candela-to-lux', 'lux-to-candela', 'lumens-to-candela', 'candela-to-lumens', 'lumens-to-watts', 'watts-to-lumens', 'lux-to-watts', 'watts-to-lux', 'lumens-to-millicandela', 'millicandela-to-lumens']],
  ['Circuit laws and design', ['ohms-law', 'watts-volts-amps-ohms', 'power-calculator', 'power-factor', 'voltage-divider', 'voltage-drop', 'wire-gauge']]
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let BASE = '';
const normBase = (b) => String(b || '').replace(/\/$/, '');
const unitTxt = (u) => (u ? ' ' + u : '');

function merged(def, over) { const r = E.defaultsRaw(def); return Object.assign(r, over); }
function run(def, raw, who) {
  const r = E.calculate(def, raw);
  if (!r.ok) throw new Error(who + ': ' + r.errors.map((e) => e.key + ' ' + e.msg).join('; '));
  return r;
}
/* Lighting outputs are plain numbers whose unit is only in the label: Luminous flux (lm), Illuminance (lux), Luminous intensity (cd). */
const lightUnit = (label) => { const m = /\((lm|lux|cd|mcd)\)$/.exec(label); return m ? ' ' + m[1] : ''; };
function outVal(r, key, unit, who) {
  const o = r.outputs.find((x) => x.key === key);
  if (!o) throw new Error(who + ': no output ' + key + ' in ' + r.outputs.map((x) => x.key).join(','));
  return { o, num: E.show(o, unit), text: E.show(o, unit) + unitTxt(unit) + (unit ? '' : lightUnit(o.label)) };
}
/* Share link understood by index.html: #id?key=value:unit for every input that differs from the default. */
function appLink(def, raw, prefix) {
  const parts = [];
  def.inputs.forEach((s) => {
    const cur = raw[s.key];
    if (s.type === 'enum') { if (Number(cur) !== s.def) parts.push(s.key + '=' + cur); return; }
    const v = Array.isArray(cur) ? cur[0] : cur, u = Array.isArray(cur) ? cur[1] : s.unit;
    if (String(v) !== String(s.def) || u !== s.unit) parts.push(s.key + '=' + encodeURIComponent(v) + (u ? ':' + encodeURIComponent(u) : ''));
  });
  return (prefix || '../') + 'index.html#' + def.id + (parts.length ? '?' + parts.join('&') : '');
}
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v) => { const m = v.toExponential(9).replace(/\.?0+e/, 'e').split('e'); return m[0] + ' × 10' + String(Number(m[1])).split('').map((c) => SUP[c]).join(''); };
function inputRows(def, raw, hide) {
  const rows = [];
  def.inputs.forEach((s) => {
    if (hide && hide.indexOf(s.key) >= 0) return;
    const cur = raw[s.key];
    if (s.type === 'enum') { rows.push([s.label, s.labels[cur]]); return; }
    const v = Array.isArray(cur) ? cur[0] : cur, u = Array.isArray(cur) ? cur[1] : s.unit;
    if (v === '' || v == null) return;
    rows.push([s.label.replace(/ \(used when[^)]*\)/, ''), (Number(v) !== 0 && Math.abs(Number(v)) < 1e-6 ? sci(Number(v)) : E.fmt(Number(v), 6)) + unitTxt(u) + (Number(v) === EE && u === 'C' ? ' (1 e, one elementary charge)' : '')]);
  });
  return rows;
}

/* Social preview image: needs an absolute address, so it is added with the canonical at deploy time only. */
const socialImg = () => BASE ? '<meta property="og:image" content="' + BASE + '/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Elecmetric: electrical engineering calculators with formulas and working shown"><meta name="twitter:image" content="' + BASE + '/og-image.png">' : '';
/* Content-Security-Policy as a meta tag (GitHub Pages cannot send headers). Nothing may leave the origin: no remote scripts, styles, fonts, images or requests. Inline script and style stay allowed because every page carries its own. */
const CSP_META = "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'\">";
function page(slug, h1, desc, body, extraHead, tail, o) {
  o = o || {};
  const url = o.url !== undefined ? o.url : (BASE ? BASE + '/pages/' + slug + '.html' : ''), up = o.prefix !== undefined ? o.prefix : '../';
  const title = h1 + ' | Elecmetric';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+ CSP_META +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '">' + (url ? '<link rel="canonical" href="' + url + '">' : '') +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="Elecmetric">' + (url ? '<meta property="og:url" content="' + url + '">' + socialImg() : '') +
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '">' +
    '<meta name="theme-color" content="#043B79"><link rel="icon" href="' + up + 'icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="' + up + 'apple-touch-icon.png"><link rel="manifest" href="' + up + 'manifest.webmanifest">' + (extraHead || '') + '<style>' + CSS + '</style></head><body>' + body + (tail || '') + '<script>try{if("serviceWorker"in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register("' + up + 'sw.js")}catch(e){}</script></body></html>';
}
const CSS = '.fb textarea{width:100%;font:15px/1.5 var(--body);padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--field);color:var(--ink);resize:vertical}.fb textarea:focus{outline:2px solid var(--gold);outline-offset:1px}:root{--bg:#F1F6FC;--surface:#fff;--ink:#0A2347;--muted:#4B5F86;--line:#D3DFEF;--navy:#043B79;--on-navy:#FFFFFF;--gold:#B34A00;--gold-fill:#FFEFDC;--field:#F4F8FE;--err:#B3261E;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--display:"Arial Narrow","Roboto Condensed",system-ui,sans-serif;--body:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--navy-2:#0A5BBB;--cyan:#0062DE;--num:#043B79;--orange:#FF7A00;--gold-grad:linear-gradient(135deg,#FFA43D 0%,#FF7A00 52%,#E85F00 100%);--hero:radial-gradient(1000px 360px at 90% -35%,rgba(0,98,222,.55),transparent 62%),radial-gradient(640px 240px at 0% 110%,rgba(255,122,0,.20),transparent 60%),linear-gradient(135deg,#032A58,#043B79 58%,#0A55A8);--r:14px;--sh-0:0 1px 2px rgba(4,35,80,.06);--sh-1:0 1px 2px rgba(4,35,80,.05),0 6px 18px rgba(4,35,80,.07);--sh-2:0 2px 4px rgba(4,35,80,.05),0 22px 44px -14px rgba(4,35,80,.24);--ring:0 0 0 3px rgba(0,98,222,.26);color-scheme:light dark;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  '@media(prefers-color-scheme:dark){:root{--bg:#04122B;--surface:#0A2046;--ink:#EAF2FF;--muted:#A0B5DA;--line:#183868;--navy:#031B3F;--on-navy:#EAF2FF;--gold:#FF9A3D;--gold-fill:#3D2410;--field:#071B3C;--err:#FF8A80;--navy-2:#0B4A98;--cyan:#4DA3FF;--orange:#FF8A1F;--num:#FFB066;--sh-0:0 1px 2px rgba(0,0,0,.4);--sh-1:0 1px 2px rgba(0,0,0,.35),0 8px 22px rgba(0,0,0,.35);--sh-2:0 2px 4px rgba(0,0,0,.4),0 24px 48px -14px rgba(0,0,0,.7);--ring:0 0 0 3px rgba(77,163,255,.34)}}' +
  '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 var(--body)}a{color:inherit}' +
  'header{background:var(--navy);color:var(--on-navy);border-bottom:3px solid var(--gold)}.w{max-width:860px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-left,0px))}' +
  'header .w{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-block:12px;flex-wrap:wrap}header a{text-decoration:none;font:600 20px var(--display);letter-spacing:.04em;text-transform:uppercase}header nav a{font:500 13px var(--body);text-transform:none;letter-spacing:0;margin-left:14px;opacity:.9}' +
  'main{padding-block:24px 56px}h1{font:600 32px/1.1 var(--display);margin:0 0 8px;text-wrap:balance}h2{font:600 20px var(--display);letter-spacing:.02em;margin:28px 0 8px;text-transform:uppercase}.lede{color:var(--muted);margin:0 0 16px;max-width:62ch}' +
  '.card{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:16px 18px;margin:12px 0}.ans{border-left:4px solid var(--gold);display:flex;flex-wrap:wrap;gap:6px 24px;align-items:baseline;justify-content:space-between}.big{font:600 28px var(--display)}' +
  '.jump{margin:8px 0 4px}details.more{border:1px solid var(--line);border-radius:12px;background:var(--surface);margin:14px 0;padding:0 16px;box-shadow:var(--sh-0)}details.more>summary{cursor:pointer;list-style:none}details.more>summary::-webkit-details-marker{display:none}details.more>summary h2{margin:14px 0}details.more>summary h2::after{content:"+";margin-left:auto;color:var(--gold)}details.more[open]>summary h2::after{content:"\\2212"}details.more[open]{padding-bottom:12px}@media print{.jump{display:none}}' +
  '.btn{display:inline-block;background:var(--navy);color:var(--on-navy);padding:9px 16px;border-radius:4px;text-decoration:none;font-weight:600;border:1px solid var(--gold)}.chip{display:inline-block;margin:3px 6px 3px 0;padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);text-decoration:none;font-size:14px}.chip:hover{border-color:var(--gold)}main li>a:only-child{display:inline-block;padding:3px 0}' +
  'code,pre,.f,td.n{font-family:var(--mono)}.f{background:var(--field);border:1px solid var(--line);padding:10px 12px;border-radius:4px;overflow-x:auto;white-space:pre-wrap}ol.steps{padding-left:22px;font-family:var(--mono);font-size:13px}ol.steps li{margin:4px 0}' +
  '.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--surface)}th,td{border:1px solid var(--line);padding:6px 10px;text-align:left}td.n{text-align:right}tr.me td{background:var(--gold-fill)}th{background:var(--field);font-weight:600}.note{color:var(--muted);font-size:13px}ul{padding-left:20px}footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px;padding-block:16px}' +
  'h3{font:600 16px var(--body);margin:18px 0 4px}h3+p{margin:0;max-width:68ch}' +
  '.tres .phasor{flex:0 0 100%;margin-top:12px}.phasor svg{display:block;width:100%;max-width:360px;height:auto;font:11px var(--body)}' +
  '.tgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px 16px}.tgrid label{display:block;font-weight:600;font-size:13px;margin-bottom:4px}.trow{display:flex;gap:6px}.trow input,.trow select,.tgrid>div>select{font:16px var(--body);color:var(--ink);background:var(--field);border:1px solid var(--line);border-radius:4px;padding:8px;min-height:40px}.trow input{flex:1;min-width:0}.tgrid>div>select{width:100%}.hint{color:var(--muted);font-size:12px;margin-top:3px}.err{color:var(--err)}.tres{display:flex;flex-wrap:wrap;gap:6px 28px;align-items:baseline}.tres .big small{display:block;font:500 13px var(--body);color:var(--muted)}' +
  fs.readFileSync(path.join(__dirname, 'premium_static.css'), 'utf8').replace(/\n/g, '');
const HEAD = (rootPrefix) => '<header><div class="w"><a class="brand" href="' + rootPrefix + '"><img src="' + rootPrefix + 'logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="index.html">All conversions</a><a href="' + rootPrefix + 'index.html#verification">How it is verified</a></nav></div></header>';
/* Site footer navigation: five link columns, then the disclaimer. `up` is the relative path back to the site root ('' , '../' or '../../').
   Every target below is a page the build writes, so the deploy guard still checks them. Calculator categories come from the same list as the hubs. */
/* Opened straight from disk (file://), a link to a folder shows a directory listing instead of its index.html, so this script opens index.html for any link to a folder (logo, top nav, footer) in that case only. On a web server nothing changes. */
const FOOT_FILE_JS = '<script>(function(){if(location.protocol!=="file:")return;document.addEventListener("click",function(e){if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target)return;var m=/^([^?#]*)(.*)$/.exec(a.getAttribute("href"));if(!m[1]||/^[a-z][a-z0-9+.-]*:/i.test(m[1])||!/[/]$/.test(m[1]))return;e.preventDefault();location.href=m[1]+"index.html"+m[2]})})();</script>';
const TOP_BTN = '<button type="button" class="totop" id="totop" aria-label="Back to top" tabindex="-1">\u2191 Top</button>';
const TOP_JS = '<script>(function(){var b=document.getElementById("totop");if(!b)return;var t=0;function u(){t=0;var on=(window.pageYOffset||document.documentElement.scrollTop)>400,bar=document.getElementById("bar"),h=bar&&bar.offsetHeight?bar.offsetHeight:0;b.classList.toggle("on",on);b.tabIndex=on?0:-1;b.style.bottom=h?"calc("+(h+16)+"px + env(safe-area-inset-bottom,0px))":"";}function q(){if(!t)t=requestAnimationFrame(u)}window.addEventListener("scroll",q,{passive:true});window.addEventListener("resize",q);b.addEventListener("click",function(){var r=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;window.scrollTo({top:0,behavior:r?"auto":"smooth"})});u()})();</script>';
function megaFooter(up, extra) {
  const a = (href, text) => '<li><a href="' + up + href + '">' + esc(text) + '</a></li>';
  const col = (title, href, items) => '<div class="mf-col"><p class="mf-h">' + (href ? '<a href="' + up + href + '">' + esc(title) + '</a>' : esc(title)) + '</p><ul>' + items.join('') + '</ul></div>';
  const mail = SITE_INFO.contact_email ? '<li><a href="mailto:' + esc(SITE_INFO.contact_email) + '">Contact us</a></li>' : '';
  const grid =
    col('Calculators', 'calculators/', CATS.map((k) => a('calculators/' + k.slug + '/', k.name))) +
    col('Popular calculators', 'calculators/', [['cable-size', 'Cable Size'], ['voltage-drop', 'Voltage Drop'], ['breaker-size', 'Breaker Size'], ['motor-current', 'Motor Current'], ['transformer-sizing', 'Transformer Sizing'], ['earth-resistance', 'Earth Resistance'], ['pf-correction-kvar', 'Power Factor Correction'], ['generator-sizing', 'Generator Sizing'], ['battery-bank-sizing', 'Battery Bank Sizing'], ['pv-energy', 'Solar PV Energy']].map(([s, t]) => a('calculators/' + s + '/', t))) +
    col('Conversions', 'converters/index.html', [a('pages/index.html', 'Electrical conversions'), a('pages/kw-to-amps.html', 'kW to Amps'), a('pages/amps-to-kw.html', 'Amps to kW'), a('pages/kva-to-kw.html', 'kVA to kW'), a('pages/watts-to-amps.html', 'Watts to Amps'), a('converters/length-converter.html', 'Length'), a('converters/power-converter.html', 'Power'), a('converters/energy-converter.html', 'Energy'), a('converters/temperature-converter.html', 'Temperature'), a('pages/wire-gauge.html', 'AWG to mm\u00b2')]) +
    col('Formulas', 'converters/index.html', [a('converters/ohms-law-formulas.html', 'Ohm\u2019s Law formulas'), a('converters/kirchhoffs-laws.html', 'Kirchhoff\u2019s laws'), a('converters/cable-sizing-formulas.html', 'Cable sizing formulas'), a('converters/circuit-breaker-formulas.html', 'Circuit breaker formulas'), a('converters/ac-circuit-formulas.html', 'AC circuit formulas'), a('converters/battery-formulas.html', 'Battery formulas')]) +
    col('Elecmetric', '', [a('calculators/basic-calculator/', 'Basic Calculator'), a('calculators/scientific-calculator/', 'Scientific Calculator'), a('index.html#verification', 'How it is verified'), a('privacy.html', 'Privacy'), a('terms.html', 'Terms'), mail]);
  return '<footer class="mf"><div class="mf-w"><div class="mf-grid" role="navigation" aria-label="Site map">' + grid + '</div><div class="mf-legal">' +
    'Results are computed by the same tested engine as the calculators in Elecmetric and are for estimating. Check design values against the standard and the equipment data you work to.' + (extra || '') +
    '<br>' + attribution() + '<br>&copy; ' + (SITE_INFO.legal_updated ? esc(SITE_INFO.legal_updated.slice(0, 4)) + ' ' : '') + (SITE_INFO.operator_name ? esc(SITE_INFO.operator_name) + ' (Elecmetric)' : 'Elecmetric') + ' &middot; <a href="' + up + 'privacy.html">Privacy</a> &middot; <a href="' + up + 'terms.html">Terms</a></div></div>' + FOOT_FILE_JS + TOP_BTN + TOP_JS + '</footer>';
}
const FOOT = (up) => feedbackBlock() + megaFooter(up);
const table = (head, rows, hi, label) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + (label ? esc(label) + ': ' : '') + head.map((h) => esc(h)).join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r, i) => '<tr' + (i === hi ? ' class="me"' : '') + '>' + r.map((c, j) => '<td' + (j ? ' class="n"' : ' class="n"') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

/* ---------- F4: FAQ, structured data and the index.html head ---------- */
const SETS = {
  realApparent: ['kva-to-watts', 'watts-to-kva', 'kva-to-kw', 'kw-to-kva', 'va-to-kw', 'kw-to-va', 'va-to-watts', 'watts-to-va'],
  apparentOnly: ['amps-to-kva', 'kva-to-amps', 'amps-to-va', 'va-to-amps'],
  powerEnergy: ['kw-to-kwh', 'kwh-to-kw', 'watts-to-kwh', 'kwh-to-watts'],
  joules: ['joules-to-watts', 'watts-to-joules']
};
const plainOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
/* Questions a reader would ask, answered from the page's own formula, notes and assumptions. Nothing here is a number: figures come from the worked example. */
function faqFor(n, def, c) {
  const q = [], has = (k) => def.inputs.some((s) => s.key === k), slug = n.slug, one = (f) => f.split(/\s{3,}|\n/).reduce((a, x) => a + (a ? (x.charAt(0) === '(' ? ' ' : '; ') : '') + x, ''), lc = (t) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  if (n.kind === 'unit') {
    q.push(['How do I convert ' + n.fromU + ' to ' + n.toU + '?', (n.fromU === 'kVA' ? 'Multiply by 1,000.' : 'Divide by 1,000.') + ' One kVA is 1,000 VA, and both are units of apparent power. Worked example: ' + c.plain + '.']);
    q.push(['Is ' + n.fromU + ' the same as watts or kW?', 'No. VA and kVA measure apparent power, and watts and kW measure real power. They are equal only when the power factor is 1. To get real power, multiply apparent power by the power factor with the kVA to kW calculator.']);
  } else if (n.kind === 'awg') {
    q.push(['How do I find the diameter and area of an AWG wire?', one(c.formula) + '. Worked example: ' + c.plain + '.']);
    q.push(['Does a smaller AWG number mean a thicker wire?', 'Yes. Gauge numbers run the opposite way to size: AWG 4 is much thicker than AWG 20, and each step of 6 gauges roughly halves the diameter.']);
    q.push(['Is AWG the same as SWG or a size in mm²?', 'No. AWG and SWG are different gauge systems with different sizes for the same number, and mm² is the cross-section area. Check which system a data sheet uses before converting. The AWG chart in Elecmetric looks up the nearest AWG for a size in mm².']);
  } else {
    q.push([isToTitle(n) ? 'How do I convert ' + c.title + '?' : 'How is ' + c.title + ' calculated?', one(c.formula) + '. Worked example: ' + c.plain + '.']);
    q.push(['What do I need to enter?', 'Enter ' + c.fields.map((f) => lc(f.label)).join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' + (def.inputs.some((s) => s.optional) ? ' Leave blank the value you want to find, and the form solves for it.' : '') + (c.fields.some((f) => f.unit) ? ' Change the unit of a value with its selector and the result stays the same.' : '')]);
    if (def.id !== 'dc-voltage-drop' && def.inputs.some((s) => s.key === 'phase')) q.push(['Does single-phase or three-phase change the answer?', 'Yes. Pick the circuit type that matches the supply. Three-phase uses √3 with the line-to-line voltage, single-phase uses the voltage as it is, and DC, where it is offered, takes the power factor as 1. The formula above shows each case.']);
    if (has('pf')) q.push(['Which power factor should I use?', 'Read it from the equipment nameplate or data sheet. Typical values are only a guide: about 1.0 for a resistive load and about 0.85 for a fully loaded induction motor. Do not use typical values for accurate work.']);
  }
  if (SETS.realApparent.indexOf(slug) >= 0) q.push(['Is kVA the same as kW?', 'No. kVA (or VA) is apparent power and kW (or W) is real power. Real power = apparent power × power factor, so the two are equal only when the power factor is 1.']);
  if (SETS.apparentOnly.indexOf(slug) >= 0) q.push(['Does power factor change the answer?', 'No. Apparent power depends only on voltage and current (with √3 for three-phase), so the power factor does not enter. It matters when you convert to kW or watts.']);
  if (SETS.powerEnergy.indexOf(slug) >= 0) q.push(['What is the difference between kW and kWh?', 'kW (or W) is power, the rate at which energy is used. kWh (or Wh) is energy, power multiplied by time. A 1 kW load running for 1 hour uses 1 kWh.']);
  if (SETS.joules.indexOf(slug) >= 0) q.push(['How are watts and joules related?', 'One watt is one joule per second, so energy in joules is power in watts multiplied by time in seconds.']);
  if (slug === 'energy-consumption') q.push(['How do I turn this into a cost?', 'Multiply the energy in kWh by your tariff per kWh. The Energy Cost calculator does this step for you.']);
  if (slug === 'energy-cost') q.push(['Does the cost include demand or fixed charges?', 'No. It uses a flat tariff for every kWh. Real bills often add demand charges, fixed charges and taxes that are not modelled here; the Electricity Bill calculator estimates a whole bill with slabs, a fixed charge and tax.']);
  if (slug === 'energy-cost') {
    q.push(['How do I get the cost per day, month and year, and what does "run at" mean?', 'Enter the load, the hours of use and the tariff. The calculator shows cost and energy per day, per month and per year, plus the total for the days you enter. A month is 365 / 12 = 30.42 days, a year is 365 days, and hours given per week are spread over 7 days. "Run at" is the share of the rated power the load actually draws while on: a thermostat or cycling compressor may average well below its rating, so enter that percentage, or leave 100 for a load that draws its full rating.']);
    q.push(['Can I use BTU/h or tons, and are the typical appliance wattages exact?', 'Pick BTU/h or TR (tons of refrigeration) beside the load: 1 BTU/h is 0.29307 W and 1 TR is 12,000 BTU/h, or 3,516.85 W. Those are cooling ratings, so for running cost use the electrical input power on the unit label. The typical appliance wattages are rounded, indicative figures; models differ a lot, so use the nameplate or a plug-in meter reading and edit the wattage after choosing.']);
  }
  if (slug === 'energy-cost' || slug === 'energy-consumption') q.push(['Is this my whole electricity bill?', 'No. It is the energy and cost of one appliance or load at one flat rate. Your bill covers everything on the meter and often has slabs, a fixed charge and tax; use the Electricity Bill calculator for that.']);
  if (slug === 'electricity-bill') q.push(['Is this the cost of one appliance?', 'No. It prices the whole bill from the units on your meter. To find what one appliance costs to run, use the Energy Cost calculator with its power, hours and tariff.']);
  if (slug === 'electricity-bill') q.push(['How does slab billing work?', 'Units are billed in order: the first slab at the first rate, the second slab at the second rate, and the rest at the third rate. The fixed charge is added and tax is applied on the total. Some utilities bill differently, so check your tariff order.']);
  if (slug === 'mah-to-wh' || slug === 'wh-to-mah') q.push(['Which voltage should I use?', 'Use the nominal voltage printed on the cell or pack, not the full-charge voltage. Cells in series add voltage, so use the pack voltage. The result is rated energy, not usable energy: depth of discharge, converter losses and temperature reduce it.']);
  if (['ah-to-wh', 'wh-to-ah', 'ah-to-kwh', 'kwh-to-ah'].indexOf(slug) >= 0) {
    q.push(['Why do I need the voltage to convert Ah and Wh?', 'Ah is charge (current × time) and Wh is energy (power × time). They are linked by the battery voltage, so one cannot be converted to the other without it.']);
    q.push(['Which voltage should I use for a battery bank?', 'Use the nominal voltage of the whole bank. Batteries in series add voltage (four 12 V batteries make 48 V) and keep the Ah; batteries in parallel add Ah and keep the voltage. The result is rated energy, not usable energy: depth of discharge, inverter losses and temperature reduce it.']);
  }
  if (slug === 'hp-to-amps' || slug === 'amps-to-hp') {
    q.push(['Is this the motor HP on the nameplate?', 'Yes, HP here is mechanical output at the shaft. The electrical input is higher by the efficiency, so the current depends on efficiency, power factor and voltage as well as HP. Use the nameplate current if you have it.']);
    q.push(['Which HP does it use?', 'Mechanical horsepower, 745.7 W. Metric horsepower (PS) is slightly smaller at 735.5 W, so check which one a data sheet means.']);
    q.push(['Does this give the starting current?', 'No. It gives the full-load running current. An induction motor starting direct on line draws several times that for a few seconds; use the Motor Starting Current calculator.']);
  }
  if (slug === 'ev-to-volts' || slug === 'volts-to-ev') q.push(['What is an electronvolt?', 'One electronvolt is the energy one electron gains moving through one volt, which is 1.602176634 × 10⁻¹⁹ joules. For a single electron, the energy in eV equals the voltage in volts.']);
  if (slug === 'joules-to-volts' || slug === 'volts-to-joules') q.push(['How are volts and joules related?', 'One volt is one joule per coulomb, so energy in joules = charge in coulombs × voltage in volts.']);
  if (slug === 'ohms-law' || slug === 'watts-volts-amps-ohms') q.push(['Why can I only enter two values?', 'Any two of voltage, current, resistance and power fix the other two. With three or four entered the values could contradict each other, so the calculator asks for two.']);
  if (slug === 'ohms-law' || slug === 'watts-volts-amps-ohms' || slug === 'power-calculator') q.push(['Does this work for AC circuits?', 'Only for resistive loads, using RMS values, where the power factor is 1. A load with reactance needs impedance and phase angle, and the power depends on the power factor; use the AC Ohm\'s law (phasors) calculator in Elecmetric, which takes magnitude and angle for voltage, current and impedance and returns the power triangle.']);
  if (['amps-to-ohms', 'ohms-to-amps', 'volts-to-ohms', 'ohms-to-volts'].indexOf(slug) >= 0) q.push(['Why does this need a second value?', 'Amps, volts and ohms are three different quantities linked by Ohm\'s law, V = I × R. Any one of them can be found only from the other two, so a single number cannot be converted on its own.']);
  if (slug === 'amps-to-ohms' || slug === 'volts-to-ohms') q.push(['Does this work for AC circuits?', 'Only for resistive loads using RMS values. For a coil, motor or capacitor the opposition to current is impedance, which depends on frequency and phase; use the AC Ohm\'s law (phasors) calculator in Elecmetric.']);
  if (slug === 'kw-to-wh' || slug === 'wh-to-kw' || slug === 'watts-to-wh' || slug === 'wh-to-watts') q.push(['What is the difference between kW and Wh?', 'kW is power, the rate of using energy. Wh is energy, power multiplied by time. A 1 kW load running for 1 hour uses 1,000 Wh, so kW cannot be converted to Wh without a time.']);
  if (slug === 'kw-to-joules' || slug === 'joules-to-kw' || slug === 'kj-to-watts' || slug === 'watts-to-kj' || slug === 'kw-to-kj' || slug === 'kj-to-kw') q.push(['How are watts, kW, joules and kJ related?', 'One watt is one joule per second, so energy in joules is power in watts multiplied by time in seconds. One kW is 1,000 W and one kJ is 1,000 J. Joules measure energy and watts measure power, so a time is always needed.']);
  if (slug === 'lumens-to-lux' || slug === 'lux-to-lumens') q.push(['What is the difference between lumens and lux?', 'Lumens measure the total light a source gives out. Lux is lumens per square metre arriving on a surface, so it depends on the area the light spreads over. The same lamp gives more lux on a small area and less on a large one.']);
  if (slug === 'lumens-to-lux' || slug === 'lux-to-lumens') q.push(['Why is the fraction of lumens reaching the surface 1?', 'The worked example assumes every lumen lands on the surface, which is the ideal case. In a real room some light is lost to walls, the luminaire and dirt, so use a utilisation and maintenance factor below 1.']);
  if (slug === 'candela-to-lux' || slug === 'lux-to-candela') q.push(['What is the difference between candela and lux?', 'Candela is the light intensity of a source in one direction. Lux is the light arriving on a surface, and it falls with the square of the distance. The same source gives one quarter of the lux at twice the distance.']);
  if (slug === 'candela-to-lux' || slug === 'lux-to-candela') q.push(['When is the inverse-square law valid?', 'When the source is small compared with the distance, at least about five times the size of the source. Close to a large luminaire it overstates the lux.']);
  if (slug === 'lumens-to-candela' || slug === 'candela-to-lumens') q.push(['How do I convert millicandela?', 'One candela is 1,000 millicandela. Divide millicandela by 1,000 to get candela, then convert with the beam angle. The conversion is exact only for an even beam, so a measured polar curve is more accurate for a real LED.']);
  if (slug === 'lumens-to-millicandela' || slug === 'millicandela-to-lumens') q.push(['What is a millicandela?', 'A millicandela (mcd) is one thousandth of a candela, the unit of luminous intensity. LED data sheets quote small indicator LEDs in mcd, usually as the peak value on the axis of the beam.']);
  if (slug === 'lumens-to-millicandela' || slug === 'millicandela-to-lumens') q.push(['Why does the beam angle matter?', 'Candela is light per steradian and lumens is the total light, so the beam angle sets the solid angle that links them. A narrow beam concentrates the same lumens into more millicandela. Use the full angle between the half-intensity points, not the half angle.']);
  if (slug === 'lux-to-watts' || slug === 'watts-to-lux') q.push(['Why are there two factors, utilisation and maintenance?', 'Not every lamp lumen reaches the work plane, which the utilisation factor covers, and lamps and luminaires lose output with age and dirt, which the maintenance factor covers. Typical room values are about 0.5 to 0.7 and 0.7 to 0.85, but take them from your luminaire data and design standard.']);
  if (slug === 'lux-to-watts' || slug === 'watts-to-lux') q.push(['Is there a fixed lux to watts factor?', 'No. Lux depends on the area, the lamp efficacy in lm/W and the room factors, so a lux figure cannot be turned into watts without them. For a precise layout use the lumen method or a point-by-point calculation.']);
  if (slug === 'lumens-to-watts' || slug === 'watts-to-lumens') q.push(['Is there a fixed lumens to watts factor?', 'No. The light per watt, the luminous efficacy, depends on the lamp type and on whether driver losses are counted. Read it in lm/W from the data sheet and use the same basis when you compare lamps.']);
  if (slug === 'power-factor') {
    q.push(['What is a good power factor?', 'Closer to 1 is better. Below about 0.9 many utilities charge a penalty, so check your tariff.']);
    q.push(['How do I improve a low power factor?', 'Capacitors are commonly used to correct a lagging power factor. The Power Factor Correction calculator in Elecmetric sizes the capacitor bank.']);
  }
  if (slug === 'voltage-divider') q.push(['What happens when I connect a load to the output?', 'A load in parallel with R2 lowers the output voltage. Keep the load resistance at least ten times R2 for a stable output.']);
  if (slug === 'voltage-drop') {
    q.push(['Why does the formula use a factor of 2?', 'On a two-wire circuit the current flows out and back, so the current travels twice the one-way length and k = 2. Three-phase uses √3 instead.']);
    q.push(['What voltage drop is acceptable?', 'The limit comes from the wiring rules you work to and varies by circuit type and country. The calculator flags a drop above 3% as a common limit for final circuits; confirm against your standard.']);
    q.push(['Is this suitable for AC cables with large conductors?', 'It treats the load as resistive and ignores reactance. For AC circuits with significant reactance or a low power factor, use the AC Voltage Drop calculator in Elecmetric.']);
  }
  q.push(['How accurate are the results?', 'Every figure comes from the same tested engine as the Elecmetric calculators and is meant for estimating. Check design values against the standard and the equipment data you work to.']);
  return q;
}
function isToTitle(n) { return n.slug.indexOf('-to-') > 0; }
const faqHtml = (faq) => '<h2>Frequently asked questions</h2>' + faq.map(([a, b]) => '<h3>' + esc(a) + '</h3><p>' + esc(b) + '</p>').join('');
const ldScript = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const APP_LD = (name, url, desc) => ({ '@type': 'WebApplication', name, url, description: desc, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', inLanguage: 'en', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isPartOf: { '@id': BASE + '/#website' } });
const SITE_LD = () => ({ '@type': 'WebSite', '@id': BASE + '/#website', url: BASE + '/', name: 'Elecmetric', description: HOME_DESC, inLanguage: 'en' });
/* FAQPage markup built from the same question and answer pairs as the visible FAQ, so the two cannot differ. */
const FAQ_LD = (faq) => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
function pageLd(h1, slug, desc, faq) {
  if (!BASE) return '';
  const crumbs = [['Elecmetric', BASE + '/'], ['Electrical conversions', BASE + '/pages/index.html']].concat(slug === 'index' ? [] : [[h1, BASE + '/pages/' + slug + '.html']]);
  const bc = { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) };
  return ldScript({ '@context': 'https://schema.org', '@graph': slug === 'index' ? [bc] : [bc, APP_LD(h1, BASE + '/pages/' + slug + '.html', desc)].concat(faq && faq.length ? [FAQ_LD(faq)] : []) });
}
/* The part of index.html's head that needs the site address. Kept between markers so the committed file is the same with or without BASE_URL. */
const HOME_DESC = 'Electrical engineering calculators and design tools: cable sizing, motors, transformers, protection, earthing and solar PV, with formulas and working shown.';
function indexSeo() {
  if (!BASE) return '';
  const url = BASE + '/', d = HOME_DESC;
  return '<link rel="canonical" href="' + url + '"><meta property="og:url" content="' + url + '">' + socialImg() + ldScript({ '@context': 'https://schema.org', '@graph': [APP_LD('Elecmetric', url, d), SITE_LD()] });
}
const SEO_RE = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;
/* Plain links on the home page. The calculators themselves are drawn by JavaScript, so without this a crawler finds no path into the site. Relative links, so the same text is committed and deployed. */
const BROWSE_RE = /<!--browse:start-->[\s\S]*?<!--browse:end-->/;
const POPULAR = ['amps-to-kw', 'kva-to-kw', 'kw-to-amps', 'watts-to-amps', 'ohms-law', 'voltage-drop', 'power-factor', 'wire-gauge'];
/* Pages with no shared unit to match on, linked by hand from the nearest topics. */
const EXTRA_SIBS = { 'ohms-law': ['power-calculator'], 'watts-volts-amps-ohms': ['power-calculator'], 'power-factor': ['power-calculator'] };
const MORE_TOOLS = [['calculators/basic-calculator/', 'Basic calculator'], ['calculators/scientific-calculator/', 'Scientific calculator'], ['converters/wire-gauge-converter.html', 'AWG and SWG wire gauge converter'], ['converters/number-base-converter.html', 'Number base converter'], ['converters/scientific-notation-converter.html', 'Scientific notation converter'], ['converters/dms-converter.html', 'DMS to decimal degrees converter'], ['converters/dbm-converter.html', 'dBm to watts converter'], ['converters/db-converter.html', 'dB to ratio converter'], ['converters/binary-calculator.html', 'Binary calculator'], ['converters/si-prefix-converter.html', 'SI prefix converter'], ['converters/resistor-color-code.html', 'Resistor color code calculator'], ['converters/ohms-law-formulas.html', 'Ohm\u2019s law formulas'], ['converters/coulombs-law.html', 'Coulomb\u2019s law calculator'], ['converters/kirchhoffs-laws.html', 'Kirchhoff\u2019s laws'], ['converters/electrical-symbols.html', 'Electrical symbols'], ['calculators/agl-ccr-loading/', 'AGL CCR loading calculator'], ['pages/energy-consumption.html', 'Energy consumption calculator']];
function browseHtml() {
  const a = (href, t) => '<a class="chip" href="' + href + '">' + esc(t) + '</a>';
  return '<section class="browse" aria-labelledby="browse-h"><h2 id="browse-h">Electrical engineering calculators</h2>' +
    '<p>Elecmetric is a set of tested electrical calculators for cable sizing, voltage drop, motors, transformers, protection, earthing, solar PV and airfield ground lighting. Each result shows its formula and working, and is checked against independent reference values.</p>' +
    '<p>' + a('calculators/', 'All engineering calculators') + a('pages/index.html', 'All electrical conversions') + a('converters/index.html', 'Conversion Centre') + '</p>' +
    '<h3>Browse by topic</h3><p>' + CATS.map((k) => a('calculators/' + k.slug + '/', k.name)).join('') + '</p>' +
    '<h3>Popular conversions</h3><p>' + POPULAR.map((x) => a('pages/' + x + '.html', titleOf(x))).join('') + '</p>' +
    '<h3>More tools</h3><p>' + MORE_TOOLS.map(([href, t]) => a(href, t)).join('') + '</p></section>';
}
function indexHtml() {
  const f = path.join(__dirname, '..', 'index.html'), src = fs.readFileSync(f, 'utf8');
  if (!SEO_RE.test(src)) throw new Error('index.html is missing the <!--seo:start--><!--seo:end--> markers');
  let out = src.replace(SEO_RE, () => '<!--seo:start-->' + indexSeo() + '<!--seo:end-->');
  if (!BROWSE_RE.test(out)) throw new Error('index.html is missing the <!--browse:start--><!--browse:end--> markers');
  out = out.replace(BROWSE_RE, () => '<!--browse:start-->' + browseHtml() + '<!--browse:end-->');
  if (!VDATA_RE.test(out)) throw new Error('index.html is missing the <!--vdata:start--><!--vdata:end--> markers');
  return out.replace(VDATA_RE, () => '<!--vdata:start--><script>window.LL_VERIF=' + JSON.stringify(verifData()) + ';</script><!--vdata:end-->');
}
/* Per-calculator verification facts for the app: independent vector counts come from tests/reference_vectors.json,
   reviews only from tools/review_records.json (empty until a review has really been done). */
const VDATA_RE = /<!--vdata:start-->[\s\S]*?<!--vdata:end-->/;
const PARTIAL_VECTORS = {};
function verifData() {
  const vec = {};
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'reference_vectors.json'), 'utf8')).forEach((v) => { vec[v.id] = (vec[v.id] || 0) + 1; });
  const rec = JSON.parse(fs.readFileSync(path.join(__dirname, 'review_records.json'), 'utf8')).records || {};
  return { vec, partial: PARTIAL_VECTORS, rec, teamApproval: null, stdNA: STD_NA, reg: REGISTER.reg, counts: REGISTER.counts, scope: Object.fromEntries(E.CALCS.map((c) => { const x = scopeFor(c.id); return [c.id, { checked: x.checked, notChecked: x.notChecked }]; })), credit: SITE_INFO.credit || '', contact: SITE_INFO.contact_email || '', total: E.CALCS.length };
}

/* ---------- F1: the form on each landing page ----------
   llCompute and llInit are written once, here, and are copied verbatim into every page, so the browser runs the same code the tests run.
   llCompute is pure (engine in, values in, text out); llInit only wires it to the DOM. The static worked example stays on the page as the no-JavaScript fallback. */
/* Phasor diagram for the complex number page: z1, z2 and the result as arrows on the complex plane. Self-contained (inlined into the page with llCompute and llInit) and returns '' when a value is not finite. */
function llPhasorSvg(dg) {
  var W = 320, H = 260, L = 34, R = 290, T = 18, B = 232, k, f = function (n) { return n.toFixed(1); }, g6 = function (n) { return String(Number(n.toPrecision(6))); };
  var op = dg.op, z1 = dg.z1, z2 = dg.z2, res = op === 0 ? dg.z1 : dg.res, pts = [[0, 0], z1, res];
  if (z2) pts.push(z2);
  if (op === 1 && z2) pts.push([z1[0] + z2[0], z1[1] + z2[1]]);
  for (k = 0; k < pts.length; k++) if (!isFinite(pts[k][0]) || !isFinite(pts[k][1])) return '';
  var xmin = 0, xmax = 0, ymin = 0, ymax = 0;
  pts.forEach(function (p) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); });
  var spanX = xmax - xmin, spanY = ymax - ymin, m = Math.max(spanX, spanY);
  if (!(m > 0)) { m = 1; spanX = spanY = 0; }
  var pad = 0.3 * m, s = Math.min((R - L) / (spanX + pad), (B - T) / (spanY + pad));
  var ox = L + (-xmin + pad / 2) * s + ((R - L) - (spanX + pad) * s) / 2, oy = B - ((-ymin + pad / 2) * s + ((B - T) - (spanY + pad) * s) / 2);
  var P = function (p) { return [ox + p[0] * s, oy - p[1] * s]; };
  var arrow = function (a, b, col, w, dash, solid) {
    var x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1], len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    if (len < 0.5) return '';
    var ux = (x1 - x0) / len, uy = (y1 - y0) / len, hx = Math.min(9, len * 0.6), hy = hx * 0.45, bx = x1 - hx * ux, by = y1 - hx * uy;
    return '<line x1="' + f(x0) + '" y1="' + f(y0) + '" x2="' + f(bx) + '" y2="' + f(by) + '" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
      '<polygon points="' + f(x1) + ',' + f(y1) + ' ' + f(bx - hy * uy) + ',' + f(by + hy * ux) + ' ' + f(bx + hy * uy) + ',' + f(by - hy * ux) + '" fill="' + col + '"/>';
  };
  var label = function (p, text, col, below) {
    var right = p[0] >= ox, y = below ? p[1] + 15 : p[1] - 7;
    return '<text x="' + f(p[0] + (right ? 7 : -7)) + '" y="' + f(y) + '" fill="' + col + '" text-anchor="' + (right ? 'start' : 'end') + '" font-weight="600">' + text + '</text>';
  };
  var o = [ox, oy], o1 = P(z1), o2 = z2 ? P(z2) : null, ore = P(res);
  var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Phasor diagram on the complex plane: z1 = ' + g6(z1[0]) + (z1[1] < 0 ? ' - j' : ' + j') + g6(Math.abs(z1[1])) + (z2 ? ', z2 = ' + g6(z2[0]) + (z2[1] < 0 ? ' - j' : ' + j') + g6(Math.abs(z2[1])) : '') + (op === 0 ? '' : ', result = ' + g6(res[0]) + (res[1] < 0 ? ' - j' : ' + j') + g6(Math.abs(res[1]))) + '">';
  out += '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="none" stroke="var(--line)"/>';
  out += '<line x1="' + L + '" y1="' + f(oy) + '" x2="' + R + '" y2="' + f(oy) + '" stroke="var(--muted)"/><line x1="' + f(ox) + '" y1="' + T + '" x2="' + f(ox) + '" y2="' + B + '" stroke="var(--muted)"/>';
  out += '<text x="' + (R - 4) + '" y="' + f(oy - 5) + '" text-anchor="end" fill="var(--muted)">Re</text><text x="' + f(ox + 5) + '" y="' + (T + 11) + '" fill="var(--muted)">Im (j)</text>';
  if (op === 1 && z2) { var sum = P([z1[0] + z2[0], z1[1] + z2[1]]); out += arrow(o1, sum, 'var(--muted)', 1.5, true) + arrow(o2, sum, 'var(--muted)', 1.5, true); }
  out += arrow(o, o1, 'var(--cyan)', 2.5) + label(o1, 'z\u2081', 'var(--cyan)', z1[1] < 0);
  if (z2) out += arrow(o, o2, 'var(--gold)', 2.5) + label(o2, 'z\u2082', 'var(--gold)', z2[1] < 0);
  if (op !== 0) {
    var nm = ['z', 'z\u2081 + z\u2082', 'z\u2081 \u2212 z\u2082', 'z\u2081 \u00d7 z\u2082', 'z\u2081 \u00f7 z\u2082'][op] || 'z';
    out += arrow(o, ore, 'var(--ink)', 3.5) + label(ore, nm, 'var(--ink)', res[1] < 0);
  }
  var ang = Math.atan2(res[1], res[0]), ra = Math.min(28, 0.4 * Math.sqrt((ore[0] - ox) * (ore[0] - ox) + (ore[1] - oy) * (ore[1] - oy)));
  if (ang !== 0 && ra > 9) {
    out += '<path d="M ' + f(ox + ra) + ' ' + f(oy) + ' A ' + f(ra) + ' ' + f(ra) + ' 0 0 ' + (ang > 0 ? 0 : 1) + ' ' + f(ox + ra * Math.cos(ang)) + ' ' + f(oy - ra * Math.sin(ang)) + '" fill="none" stroke="var(--gold)" stroke-width="1.5"/>';
    out += '<text x="' + L + '" y="' + (B + 18) + '" fill="var(--ink)" text-anchor="start">Result angle \u03b8 = ' + g6(Number((ang * 180 / Math.PI).toFixed(2))) + '\u00b0</text>';
  }
  return out + '<circle cx="' + f(ox) + '" cy="' + f(oy) + '" r="2.5" fill="var(--ink)"/></svg>';
}

/* Phasor diagram for the phasor sum page: each phasor as an arrow from the origin (a subtracted one is drawn already negated and labelled with a minus), the dashed head-to-tail path through the partial sums, and the resultant R with its angle. Self-contained (inlined into the page with llCompute and llInit) and returns '' when a value is not finite. */
function llPhasorSumSvg(dg) {
  var W = 320, H = 260, L = 34, R = 290, T = 18, B = 232, k, f = function (n) { return n.toFixed(1); }, g6 = function (n) { return String(Number(n.toPrecision(6))); };
  var ph = dg.ph, res = dg.res, cols = ['var(--cyan)', 'var(--gold)', 'var(--err)'], sub = ['\u2081', '\u2082', '\u2083'];
  var pts = [[0, 0], res], part = [[0, 0]], acc = [0, 0];
  for (k = 0; k < ph.length; k++) { acc = [acc[0] + ph[k].x, acc[1] + ph[k].y]; part.push(acc); pts.push([ph[k].x, ph[k].y], acc); }
  for (k = 0; k < pts.length; k++) if (!isFinite(pts[k][0]) || !isFinite(pts[k][1])) return '';
  var xmin = 0, xmax = 0, ymin = 0, ymax = 0;
  pts.forEach(function (p) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); });
  var spanX = xmax - xmin, spanY = ymax - ymin, m = Math.max(spanX, spanY);
  if (!(m > 0)) { m = 1; spanX = spanY = 0; }
  var pad = 0.3 * m, s = Math.min((R - L) / (spanX + pad), (B - T) / (spanY + pad));
  var ox = L + (-xmin + pad / 2) * s + ((R - L) - (spanX + pad) * s) / 2, oy = B - ((-ymin + pad / 2) * s + ((B - T) - (spanY + pad) * s) / 2);
  var P = function (p) { return [ox + p[0] * s, oy - p[1] * s]; };
  var arrow = function (a, b, col, w, dash) {
    var x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1], len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    if (len < 0.5) return '';
    var ux = (x1 - x0) / len, uy = (y1 - y0) / len, hx = Math.min(9, len * 0.6), hy = hx * 0.45, bx = x1 - hx * ux, by = y1 - hx * uy;
    return '<line x1="' + f(x0) + '" y1="' + f(y0) + '" x2="' + f(bx) + '" y2="' + f(by) + '" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
      '<polygon points="' + f(x1) + ',' + f(y1) + ' ' + f(bx - hy * uy) + ',' + f(by + hy * ux) + ' ' + f(bx + hy * uy) + ',' + f(by - hy * ux) + '" fill="' + col + '"/>';
  };
  var label = function (p, text, col, below) {
    var right = p[0] >= ox, y = below ? p[1] + 15 : p[1] - 7;
    return '<text x="' + f(p[0] + (right ? 7 : -7)) + '" y="' + f(y) + '" fill="' + col + '" text-anchor="' + (right ? 'start' : 'end') + '" font-weight="600">' + text + '</text>';
  };
  var big = 0; pts.forEach(function (p) { big = Math.max(big, Math.abs(p[0]), Math.abs(p[1])); });
  if (Math.abs(res[0]) <= 1e-9 * big && Math.abs(res[1]) <= 1e-9 * big) res = [0, 0];
  var mag = Math.sqrt(res[0] * res[0] + res[1] * res[1]), ang = mag === 0 ? 0 : Math.atan2(res[1], res[0]), o = [ox, oy], ore = P(res);
  var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Phasor diagram: ' + ph.map(function (p) { return (p.sg < 0 ? 'minus ' : '') + 'phasor ' + p.n + ' = ' + g6(p.m) + ' at ' + g6(p.th) + ' degrees'; }).join(', ') + ', resultant = ' + g6(mag) + ' at ' + g6(Number((ang * 180 / Math.PI).toFixed(4))) + ' degrees">';
  out += '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="none" stroke="var(--line)"/>';
  out += '<line x1="' + L + '" y1="' + f(oy) + '" x2="' + R + '" y2="' + f(oy) + '" stroke="var(--muted)"/><line x1="' + f(ox) + '" y1="' + T + '" x2="' + f(ox) + '" y2="' + B + '" stroke="var(--muted)"/>';
  out += '<text x="' + (R - 4) + '" y="' + f(oy - 5) + '" text-anchor="end" fill="var(--muted)">Re</text><text x="' + f(ox + 5) + '" y="' + (T + 11) + '" fill="var(--muted)">Im (j)</text>';
  for (k = 1; k < ph.length; k++) out += arrow(P(part[k]), P(part[k + 1]), 'var(--muted)', 1.5, true);
  for (k = 0; k < ph.length; k++) { var tip = P([ph[k].x, ph[k].y]); out += arrow(o, tip, cols[k % 3], 2.5) + label(tip, (ph[k].sg < 0 ? '\u2212' : '') + 'P' + sub[ph[k].n - 1], cols[k % 3], ph[k].y < 0); }
  if (ph.length > 1 && mag > 0) out += arrow(o, ore, 'var(--ink)', 3.5) + label(ore, 'R', 'var(--ink)', res[1] < 0);
  var ra = Math.min(28, 0.4 * Math.sqrt((ore[0] - ox) * (ore[0] - ox) + (ore[1] - oy) * (ore[1] - oy)));
  if (ang !== 0 && ra > 9) {
    out += '<path d="M ' + f(ox + ra) + ' ' + f(oy) + ' A ' + f(ra) + ' ' + f(ra) + ' 0 0 ' + (ang > 0 ? 0 : 1) + ' ' + f(ox + ra * Math.cos(ang)) + ' ' + f(oy - ra * Math.sin(ang)) + '" fill="none" stroke="var(--gold)" stroke-width="1.5"/>';
  }
  if (mag > 0) out += '<text x="' + L + '" y="' + (B + 18) + '" fill="var(--ink)" text-anchor="start">Resultant R = ' + g6(Number(mag.toPrecision(6))) + ' \u2220 ' + g6(Number((ang * 180 / Math.PI).toFixed(2))) + '\u00b0</text>';
  else out += '<text x="' + L + '" y="' + (B + 18) + '" fill="var(--ink)" text-anchor="start">The phasors close into a loop: R = 0</text>';
  return out + '<circle cx="' + f(ox) + '" cy="' + f(oy) + '" r="2.5" fill="var(--ink)"/></svg>';
}

/* Phasor diagram for the AC Ohm's law page: the voltage and the current as arrows from the origin, the angle between them as an arc, and a line saying whether the current lags, leads or is in phase. The two lengths are not to a common scale (volts and amps), so the voltage is drawn at full length and the current at 70 percent of it. Self-contained (inlined into the page with llCompute and llInit) and returns '' when a value is not finite. */
function llPhasorVISvg(dg) {
  var W = 320, H = 260, L = 34, R = 290, T = 18, B = 232, cx = (L + R) / 2, cy = (T + B) / 2, f = function (n) { return n.toFixed(1); }, g6 = function (n) { return String(Number(n.toPrecision(6))); };
  var vm = dg.V[0], va = dg.V[1], im = dg.I[0], ia = dg.I[1];
  if (!isFinite(vm) || !isFinite(va) || !isFinite(im) || !isFinite(ia)) return '';
  var d2r = Math.PI / 180, th = va - ia;
  th = ((th + 180) % 360 + 360) % 360 - 180; if (th === -180) th = 180;
  var lv = 95, li = 66.5;
  var pt = function (len, a) { return [cx + len * Math.cos(a * d2r), cy - len * Math.sin(a * d2r)]; };
  var arrow = function (a, b, col, w) {
    var x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1], len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    if (len < 0.5) return '';
    var ux = (x1 - x0) / len, uy = (y1 - y0) / len, hx = Math.min(9, len * 0.6), hy = hx * 0.45, bx = x1 - hx * ux, by = y1 - hx * uy;
    return '<line x1="' + f(x0) + '" y1="' + f(y0) + '" x2="' + f(bx) + '" y2="' + f(by) + '" stroke="' + col + '" stroke-width="' + w + '"/>' +
      '<polygon points="' + f(x1) + ',' + f(y1) + ' ' + f(bx - hy * uy) + ',' + f(by + hy * ux) + ' ' + f(bx + hy * uy) + ',' + f(by - hy * ux) + '" fill="' + col + '"/>';
  };
  var label = function (p, text, col) {
    var right = p[0] >= cx, below = p[1] > cy;
    return '<text x="' + f(p[0] + (right ? 7 : -7)) + '" y="' + f(below ? p[1] + 15 : p[1] - 7) + '" fill="' + col + '" text-anchor="' + (right ? 'start' : 'end') + '" font-weight="600">' + text + '</text>';
  };
  var o = [cx, cy], pv = pt(lv, va), pi = pt(li, ia), rel = Math.abs(th) < 0.005 ? 'in phase with the voltage' : th > 0 ? 'lagging the voltage by ' + g6(Number(th.toFixed(2))) + ' degrees' : 'leading the voltage by ' + g6(Number((-th).toFixed(2))) + ' degrees';
  var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Phasor diagram: voltage ' + g6(vm) + ' at ' + g6(Number(va.toFixed(2))) + ' degrees, current ' + g6(im) + ' at ' + g6(Number(ia.toFixed(2))) + ' degrees, current ' + rel + '">';
  out += '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="none" stroke="var(--line)"/>';
  out += '<line x1="' + L + '" y1="' + f(cy) + '" x2="' + R + '" y2="' + f(cy) + '" stroke="var(--muted)"/><line x1="' + f(cx) + '" y1="' + T + '" x2="' + f(cx) + '" y2="' + B + '" stroke="var(--muted)"/>';
  out += '<text x="' + (R - 4) + '" y="' + f(cy + 14) + '" text-anchor="end" fill="var(--muted)">Re</text><text x="' + f(cx + 5) + '" y="' + (T + 11) + '" fill="var(--muted)">Im (j)</text>';
  if (Math.abs(th) >= 0.005) {
    var ra = 34, a0 = pt(ra, ia), a1 = pt(ra, va);
    out += '<path d="M ' + f(a0[0]) + ' ' + f(a0[1]) + ' A ' + ra + ' ' + ra + ' 0 0 ' + (th > 0 ? 0 : 1) + ' ' + f(a1[0]) + ' ' + f(a1[1]) + '" fill="none" stroke="var(--gold)" stroke-width="1.5"/>';
  }
  out += arrow(o, pv, 'var(--cyan)', 2.5) + label(pv, 'V', 'var(--cyan)') + arrow(o, pi, 'var(--gold)', 2.5) + label(pi, 'I', 'var(--gold)');
  var txt = Math.abs(th) < 0.005 ? 'I is in phase with V' : th > 0 ? 'I lags V by ' + g6(Number(th.toFixed(2))) + '\u00b0 (inductive)' : 'I leads V by ' + g6(Number((-th).toFixed(2))) + '\u00b0 (capacitive)';
  out += '<text x="' + L + '" y="' + (B + 18) + '" fill="var(--ink)" text-anchor="start">' + txt + '</text>';
  out += '<text x="' + R + '" y="' + (B + 18) + '" fill="var(--muted)" text-anchor="end">not to scale</text>';
  return out + '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="2.5" fill="var(--ink)"/></svg>';
}

/* Phasor diagram for the Series RLC Impedance page: the impedance triangle on the complex plane. R runs along the real axis, the net reactance X = XL - XC along the imaginary axis (up when inductive, down when capacitive) and Z is the arrow from the origin to R + jX, with the phase angle as an arc. Both axes use one scale, so a circuit that is mostly resistive really looks flat. Self-contained (inlined into the page with llCompute and llInit) and returns '' when a value is not finite. */
function llPhasorRLCSvg(dg) {
  var W = 320, H = 260, L = 34, R = 290, T = 18, B = 232, ox = L + 40, oy = (T + B) / 2, f = function (n) { return n.toFixed(1); }, g6 = function (n) { return String(Number(n.toPrecision(6))); };
  var r = dg.R, x = dg.X;
  if (!isFinite(r) || !isFinite(x)) return '';
  if (Math.abs(x) <= 1e-9 * Math.abs(r)) x = 0;
  var z = Math.sqrt(r * r + x * x), big = Math.max(Math.abs(r), Math.abs(x));
  var ang = Math.atan2(x, r), deg = ang * 180 / Math.PI;
  var s = big > 0 ? Math.min((R - 20 - ox) / Math.max(r, 1e-300), (oy - T - 22) / Math.max(Math.abs(x), 1e-300), 1e300) : 1;
  if (!isFinite(s) || s <= 0) s = 1;
  var tip = [ox + r * s, oy - x * s], foot = [tip[0], oy], o = [ox, oy];
  var arrow = function (a, b, col, w, dash) {
    var x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1], len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    if (len < 0.5) return '';
    var ux = (x1 - x0) / len, uy = (y1 - y0) / len, hx = Math.min(9, len * 0.6), hy = hx * 0.45, bx = x1 - hx * ux, by = y1 - hx * uy;
    return '<line x1="' + f(x0) + '" y1="' + f(y0) + '" x2="' + f(bx) + '" y2="' + f(by) + '" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
      '<polygon points="' + f(x1) + ',' + f(y1) + ' ' + f(bx - hy * uy) + ',' + f(by + hy * ux) + ' ' + f(bx + hy * uy) + ',' + f(by - hy * ux) + '" fill="' + col + '"/>';
  };
  var kind = Math.abs(deg) < 0.005 ? 'resistive' : deg > 0 ? 'inductive' : 'capacitive';
  var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Impedance triangle on the complex plane: resistance ' + g6(r) + ' ohms, net reactance ' + g6(Number(x.toPrecision(6))) + ' ohms, impedance ' + g6(Number(z.toPrecision(6))) + ' ohms at ' + g6(Number(deg.toFixed(2))) + ' degrees, ' + kind + '">';
  out += '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="none" stroke="var(--line)"/>';
  out += '<line x1="' + L + '" y1="' + f(oy) + '" x2="' + R + '" y2="' + f(oy) + '" stroke="var(--muted)"/><line x1="' + f(ox) + '" y1="' + T + '" x2="' + f(ox) + '" y2="' + B + '" stroke="var(--muted)"/>';
  out += '<text x="' + (R - 4) + '" y="' + f(x > 0 ? oy + 15 : oy - 6) + '" text-anchor="end" fill="var(--muted)">Re (R)</text><text x="' + f(ox + 5) + '" y="' + (T + 11) + '" fill="var(--muted)">Im (jX)</text>';
  if (x !== 0) {
    out += arrow(o, foot, 'var(--cyan)', 2.5) + arrow(foot, tip, 'var(--gold)', 2.5);
    out += '<text x="' + f((ox + foot[0]) / 2) + '" y="' + f(oy + (x > 0 ? 15 : -7)) + '" text-anchor="middle" fill="var(--cyan)" font-weight="600">R</text>';
    out += '<text x="' + f(foot[0] + 7) + '" y="' + f(x > 0 ? Math.min((oy + tip[1]) / 2 + 4, oy - 4) : Math.max((oy + tip[1]) / 2 + 4, oy + 12)) + '" fill="var(--gold)" font-weight="600">X</text>';
  } else out += arrow(o, tip, 'var(--cyan)', 2.5) + '<text x="' + f((ox + tip[0]) / 2) + '" y="' + f(oy - 7) + '" text-anchor="middle" fill="var(--cyan)" font-weight="600">R</text>';
  if (x !== 0) out += arrow(o, tip, 'var(--ink)', 3.5) + '<text x="' + f((ox + tip[0]) / 2 - 6) + '" y="' + f((oy + tip[1]) / 2 + (x > 0 ? -8 : 15)) + '" text-anchor="end" fill="var(--ink)" font-weight="600">Z</text>';
  var ra = Math.min(28, 0.4 * Math.sqrt((tip[0] - ox) * (tip[0] - ox) + (tip[1] - oy) * (tip[1] - oy)));
  if (x !== 0 && ra > 9) out += '<path d="M ' + f(ox + ra) + ' ' + f(oy) + ' A ' + f(ra) + ' ' + f(ra) + ' 0 0 ' + (ang > 0 ? 0 : 1) + ' ' + f(ox + ra * Math.cos(ang)) + ' ' + f(oy - ra * Math.sin(ang)) + '" fill="none" stroke="var(--gold)" stroke-width="1.5"/>';
  out += '<text x="' + L + '" y="' + (B + 18) + '" fill="var(--ink)" text-anchor="start">|Z| = ' + g6(Number(z.toPrecision(6))) + ' \u03a9 \u2220 ' + g6(Number(deg.toFixed(2))) + '\u00b0 (' + kind + ')</text>';
  return out + '<circle cx="' + f(ox) + '" cy="' + f(oy) + '" r="2.5" fill="var(--ink)"/></svg>';
}

function llCompute(E, cfg, vals) {
  if (cfg.kind === 'unit') {
    const r = E.readNumber(vals.v == null ? '' : vals.v);
    if (r.empty) return { ok: false, errors: ['Enter a value'] };
    if (r.err) return { ok: false, errors: ['Value ' + r.err] };
    const f = E.UNITS[cfg.dim].units;
    return { ok: true, items: [{ label: cfg.toU, text: E.fmt(r.v * f[cfg.fromU] / f[cfg.toU], 6) + ' ' + cfg.toU }], warnings: [] };
  }
  const def = E.BY_ID[cfg.calc], raw = Object.assign({}, cfg.raw);
  cfg.fields.forEach(function (f) {
    if (f.opts) raw[f.key] = Number(vals[f.key]);
    else raw[f.key] = [vals[f.key] == null ? '' : vals[f.key], vals[f.key + '_u'] || f.unit];
  });
  const r = E.calculate(def, raw);
  if (!r.ok) return { ok: false, errors: r.errors.map(function (e) { return e.msg; }) };
  const res = {
    ok: true, warnings: r.warnings,
    items: cfg.heads.map(function (h) { const o = r.outputs.find(function (x) { return x.key === h[0]; }); return { label: h[2], text: E.show(o, h[1]) + (h[1] ? ' ' + h[1] : '') + h[3] }; })
  };
  if (cfg.diagram === 'phasor') {
    const val = function (k) { const o = r.outputs.find(function (x) { return x.key === k; }); return o ? o.value : 0 / 0; }, v = r.inputs;
    res.diagram = { op: v.op, z1: [v.a, v.b], z2: v.op === 0 ? null : [v.c, v.d], res: [val('re'), val('im')] };
  }
  if (cfg.diagram === 'phasor-sum') {
    const val = function (k) { const o = r.outputs.find(function (x) { return x.key === k; }); return o ? o.value : 0 / 0; }, v = r.inputs, r2d = 180 / Math.PI, ph = [];
    [[1, v.m1, v.t1], [v.s2, v.m2, v.t2], [v.s3, v.m3, v.t3]].forEach(function (p, k) {
      if (k > 0 && p[1] === 0) return;
      ph.push({ n: k + 1, sg: p[0], m: p[1], th: p[2], x: p[0] * p[1] * Math.cos(p[2] / r2d), y: p[0] * p[1] * Math.sin(p[2] / r2d) });
    });
    res.diagram = { ph: ph, res: [val('re'), val('im')] };
  }
  if (cfg.diagram === 'phasor-vi') {
    const val = function (k) { const o = r.outputs.find(function (x) { return x.key === k; }); return o ? o.value : 0 / 0; };
    res.diagram = { V: [val('V'), val('Vang')], I: [val('I'), val('Iang')] };
  }
  if (cfg.diagram === 'phasor-rlc') {
    const val = function (k) { const o = r.outputs.find(function (x) { return x.key === k; }); return o ? o.value : 0 / 0; };
    res.diagram = { R: r.inputs.R, X: val('Z') * Math.sin(val('phi') * Math.PI / 180) };
  }
  return res;
}
function llInit(E, cfg, doc) {
  E.setGrouping('intl');
  const box = doc.getElementById('try'), form = doc.getElementById('try-form'), out = doc.getElementById('try-out');
  function read() { const v = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) v[el.name] = el.value; }); return v; }
  function el(tag, cls, text) { const x = doc.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; }
  function render() {
    const r = llCompute(E, cfg, read());
    out.textContent = '';
    if (!r.ok) { out.appendChild(el('p', 'err', r.errors.join(' · '))); return; }
    r.items.forEach(function (it) { const d = el('div', 'big', it.text); d.appendChild(el('small', '', it.label)); out.appendChild(d); });
    const dfn = cfg.diagram === 'phasor-rlc' ? (typeof llPhasorRLCSvg === 'function' ? llPhasorRLCSvg : null) : cfg.diagram === 'phasor-vi' ? (typeof llPhasorVISvg === 'function' ? llPhasorVISvg : null) : cfg.diagram === 'phasor-sum' ? (typeof llPhasorSumSvg === 'function' ? llPhasorSumSvg : null) : (typeof llPhasorSvg === 'function' ? llPhasorSvg : null);
    if (r.diagram && dfn) { const svg = dfn(r.diagram); if (svg) { const wrap = el('div', 'phasor'); wrap.innerHTML = svg; out.appendChild(wrap); } }
    r.warnings.forEach(function (w) { out.appendChild(el('p', 'note', w)); });
  }
  function fill(ev) {
    const t = ev.target;
    if (t.dataset && t.dataset.fill) {
      const W = Number(t.value), inp = form.elements[t.dataset.fill], us = form.elements[t.dataset.fill + '_u'];
      if (W > 0 && inp) inp.value = String(Number((W / E.FACTOR[us ? us.value : 'W']).toPrecision(10)));
    } else if (t.name && ev.type === 'input') {
      const pick = form.querySelector('select[data-fill="' + t.name + '"]');
      if (pick) pick.value = '';
    }
  }
  form.addEventListener('input', function (ev) { fill(ev); render(); });
  form.addEventListener('change', function (ev) { fill(ev); render(); });
  form.addEventListener('submit', function (ev) { ev.preventDefault(); });
  box.hidden = false;
  render();
}

/* Which inputs a page offers: everything the worked example uses, except engineering-mode inputs (they keep their defaults unless the intent lists them in showEng) and any the intent hides. */
function formFor(n, def, raw) {
  if (n.kind === 'unit') {
    const cfg = { kind: 'unit', dim: n.dim, fromU: n.fromU, toU: n.toU };
    const html = '<div><label for="f-v">Value in ' + esc(n.fromU) + '</label><div class="trow"><input id="f-v" name="v" inputmode="decimal" autocomplete="off" value="' + esc(n.val) + '"><span class="note" style="align-self:center">' + esc(n.fromU) + '</span></div></div>';
    cfg.fields = [{ key: 'v', label: 'Value in ' + n.fromU, val: String(n.val) }];
    return { cfg, html };
  }
  const hide = n.formHide || n.hide || [], fields = [], parts = [];
  const heads = (n.kind === 'awg' ? [['d', 'mm'], ['A', 'mm²']] : n.head).map(([k, u]) => { const full = def.outputs.find((x) => x.key === k).label; return [k, u, full.split(' (')[0], (/%/.test(full) ? '%' : '') + (/degrees/.test(full) ? '°' : '') + lightUnit(full)]; });
  def.inputs.forEach((s) => {
    if (hide.indexOf(s.key) >= 0 || (s.mode === 'engineering' && (n.showEng || []).indexOf(s.key) < 0)) return;
    const id = 'f-' + s.key, label = s.label.replace(/ \(used when[^)]*\)/, '');
    if (s.type === 'enum') {
      const opts = (n.formOpts && n.formOpts[s.key]) || s.options, cur = Number(raw[s.key]);
      fields.push({ key: s.key, label, opts: opts.slice(), val: String(cur) });
      parts.push('<div><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '" name="' + s.key + '">' + opts.map((o) => '<option value="' + o + '"' + (o === cur ? ' selected' : '') + '>' + esc(s.labels[o]) + '</option>').join('') + '</select></div>');
      return;
    }
    const cur = raw[s.key];
    let v = Array.isArray(cur) ? cur[0] : cur, u = Array.isArray(cur) ? cur[1] : s.unit;
    if (s.dim === 'coulomb' && Number(v) === EE && u === 'C') { v = 1; u = 'e'; }
    const units = Object.keys(E.UNITS[s.dim].units).filter(Boolean);
    fields.push({ key: s.key, label, unit: s.unit, val: v === '' || v == null ? '' : String(v), unitSel: u });
    parts.push('<div><label for="' + id + '">' + esc(label) + '</label><div class="trow"><input id="' + id + '" name="' + s.key + '" inputmode="decimal" autocomplete="off" value="' + esc(v === '' || v == null ? '' : v) + '">' +
      (units.length > 1 ? '<select name="' + s.key + '_u" aria-label="' + esc(label) + ' unit">' + units.map((x) => '<option' + (x === u ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>' : (s.unit ? '<span class="note" style="align-self:center">' + esc(s.unit) + '</span>' : '')) + '</div>' +
      (s.presets ? '<label class="hint" for="' + id + '-pre">Typical appliance (indicative watts, edit after choosing)</label><select id="' + id + '-pre" data-fill="' + s.key + '" aria-label="Typical appliance"><option value="">Choose to fill the load</option>' + s.presets.map((p) => '<option value="' + p.W + '">' + esc(p.name + ' (about ' + p.W + ' W)') + '</option>').join('') + '</select>' : '') + (s.optional ? '<div class="hint">Leave blank to solve for it</div>' : '') + (s.hint ? '<div class="hint">' + esc(s.hint) + '</div>' : '') + '</div>');
  });
  return { cfg: Object.assign({ calc: def.id, raw, fields, heads }, def.id === 'complex-number' ? { diagram: 'phasor' } : def.id === 'phasor-sum' ? { diagram: 'phasor-sum' } : def.id === 'ac-ohms-law' ? { diagram: 'phasor-vi' } : def.id === 'impedance-rlc' ? { diagram: 'phasor-rlc' } : {}), html: parts.join('') };
}
function formBlock(f) {
  return '<section id="try" hidden><h2>Try your own numbers</h2><form id="try-form" class="card" autocomplete="off" novalidate><div class="tgrid">' + f.html + '</div></form>' +
    '<div id="try-out" class="card ans tres" aria-live="polite"></div></section>';
}
const formScript = (cfg, up) => '<script defer src="' + (up || '../') + 'engine.js"></script><script>' + (cfg.diagram === 'phasor' ? llPhasorSvg.toString() + '\n' : cfg.diagram === 'phasor-sum' ? llPhasorSumSvg.toString() + '\n' : cfg.diagram === 'phasor-vi' ? llPhasorVISvg.toString() + '\n' : cfg.diagram === 'phasor-rlc' ? llPhasorRLCSvg.toString() + '\n' : '') + llCompute.toString() + '\n' + llInit.toString() + '\ndocument.addEventListener("DOMContentLoaded", function () { llInit(Engine, ' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ', document); var sa = document.getElementById("static-ans"), tr = document.getElementById("try"); if (sa && tr && !tr.hidden) sa.hidden = true; function op() { var t = document.getElementById(location.hash.slice(1)); if (t && t.tagName === "DETAILS") t.open = true; } window.addEventListener("hashchange", op); op(); window.addEventListener("beforeprint", function () { Array.prototype.forEach.call(document.querySelectorAll("details.more"), function (d) { d.open = true; }); }); });</script>';


/* ---------- Issue 4: dedicated calculator landing pages (/calculators/<slug>/) ----------
   Content lives in tools/calc_pages_data.js. Same engine, same form code and same CSS as the conversion pages; only the layout of the page differs.
   Each page is written to calculators/<slug>/index.html, so the clean URL is BASE/calculators/<slug>/. */
const CALC_HAND = require('./calc_pages_data.js');
const CATS = require('./category_hubs.js');
/* One page per calculator: hand-written pages first, then pages generated from the registry (tools/calc_pages_auto.js) for every calculator
   whose search intent no hand-written page or conversion page already serves. */
const CALC_DATA = CALC_HAND.concat(require('./calc_pages_auto.js').autoPages(E, CALC_HAND, new Set(INTENTS.map((n) => n.calc)), new Set(CATS.map((k) => k.slug).concat(['index'], CALC_HAND.map((h) => h.slug))), CATS));
const catOfDef = (def) => { const k = CATS.find((x) => x.divisions.indexOf(def.division.slice(0, 2)) >= 0); if (!k) throw new Error(def.id + ': division "' + def.division + '" belongs to no category hub (tools/category_hubs.js)'); return k; };
const VEC = (() => { const c = {}; JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'reference_vectors.json'), 'utf8')).forEach((v) => { c[v.id] = (c[v.id] || 0) + 1; }); return c; })();
const calcUrl = (slug) => BASE + '/calculators/' + (slug === 'index' ? '' : slug + '/');
const HEADC = '<header><div class="w"><a class="brand" href="../../"><img src="../../logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="../">All engineering calculators</a><a href="../../pages/index.html">Conversions</a><a href="../../index.html#verification">How it is verified</a></nav></div></header>';
const HEADH = '<header><div class="w"><a class="brand" href="../"><img src="../logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="../pages/index.html">Conversions</a><a href="../index.html#verification">How it is verified</a></nav></div></header>';
const FOOTC = (up) => feedbackBlock() + megaFooter(up, ' Elecmetric results are not a substitute for a design review by a competent engineer.');
function calcLd(h1, slug, desc, faq) {
  if (!BASE) return '';
  const crumbs = [['Elecmetric', BASE + '/'], ['Engineering calculators', calcUrl('index')]].concat(slug === 'index' ? [] : [[h1, calcUrl(slug)]]);
  const bc = { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) };
  return ldScript({ '@context': 'https://schema.org', '@graph': slug === 'index' ? [bc] : [bc, APP_LD(h1, calcUrl(slug), desc)].concat(faq && faq.length ? [FAQ_LD(faq)] : []) });
}

function catLd(h1, slug, desc, items) {
  if (!BASE) return '';
  const crumbs = [['Elecmetric', BASE + '/'], ['Engineering calculators', calcUrl('index')], [h1, calcUrl(slug)]];
  const bc = { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) };
  const cp = { '@type': 'CollectionPage', name: h1, url: calcUrl(slug), description: desc, mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.title, url: BASE + '/#' + it.id })) } };
  return ldScript({ '@context': 'https://schema.org', '@graph': [bc, cp] });
}
function buildCategoryHubs(bySlug) {
  const pages = {}, meta = [], seen = {};
  const pageOf = {}; CALC_DATA.forEach((c) => { pageOf[c.calc] = c.slug; });
  const first = (t) => t.replace(/\s+/g, ' ').trim();
  CATS.forEach((k) => {
    if (bySlug[k.slug] || k.slug === 'index') throw new Error(k.slug + ': category slug collides with a calculator page');
    if (seen[k.slug]) throw new Error(k.slug + ': duplicate category slug'); seen[k.slug] = 1;
    const prim = E.CALCS.filter((c) => k.divisions.indexOf(c.division.slice(0, 2)) >= 0);
    k.also.forEach((id) => { if (!E.BY_ID[id]) throw new Error(k.slug + ': unknown also calculator ' + id); if (prim.some((c) => c.id === id)) throw new Error(k.slug + ': ' + id + ' is already a primary calculator here'); });
    const all = prim.concat(k.also.map((id) => E.BY_ID[id]));
    k.start.forEach(([id]) => { if (!all.some((c) => c.id === id)) throw new Error(k.slug + ': where-to-start item ' + id + ' is not listed in this category'); });
    k.related.forEach((r) => { if (!CATS.some((x) => x.slug === r) || r === k.slug) throw new Error(k.slug + ': bad related category ' + r); });
    const h1 = k.name + ' Calculators';
    if ((h1 + ' | Elecmetric').length > 60) throw new Error(k.slug + ': title too long');
    if (k.desc.length < 50 || k.desc.length > 160) throw new Error(k.slug + ': description length ' + k.desc.length);
    if (prim.length + k.also.length < 3) throw new Error(k.slug + ': a hub needs at least 3 calculators so it is not thin');
    const href2 = (id) => pageOf[id] ? '../' + pageOf[id] + '/' : '../../index.html#' + id;
    const li = (c) => '<li><a href="' + href2(c.id) + '">' + esc(c.title) + '</a>: ' + esc(first(c.purpose)) + (pageOf[c.id] ? ' <a class="chip" href="../../index.html#' + c.id + '">Open in Elecmetric</a>' : '') + '</li>';
    const divs = []; prim.forEach((c) => { const n = c.division.replace(/^\d+ /, ''); let g = divs.find((x) => x[0] === n); if (!g) divs.push(g = [n, []]); g[1].push(c); });
    const nv = all.filter((c) => (VEC[c.id] || 0) > 0).length, tv = all.reduce((a, c) => a + (VEC[c.id] || 0), 0);
    const verify = 'Cross-check: ' + (nv === all.length ? 'all ' + all.length : nv + ' of ' + all.length) + ' calculators listed here are compared with ' + tv.toLocaleString('en-US') + ' reference calculations written separately from the engine. This confirms the arithmetic and selection rules. It does not confirm that a standard table or convention matches your standard or manufacturer data.';
    const body = HEADC + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(k.desc) + '</p><p class="lede">' + esc(k.intro) + '</p>' +
      '<h2>Where to start</h2><ol class="steps">' + k.start.map(([id, why]) => '<li><a href="' + href2(id) + '">' + esc(E.BY_ID[id].title) + '</a>: ' + esc(why) + '</li>').join('') + '</ol>' +
      '<h2>' + (prim.length === 1 ? 'The calculator in this category' : 'All ' + prim.length + ' calculators in this category') + '</h2>' + divs.map(([n, cs]) => '<h3>' + esc(n) + '</h3><ul>' + cs.map(li).join('') + '</ul>').join('') +
      (k.also.length ? '<h2>Also useful here</h2><p class="note">These sit in other categories but apply to the same work.</p><ul>' + k.also.map((id) => li(E.BY_ID[id])).join('') + '</ul>' : '') +
      '<h2>What these calculators do not cover</h2><div class="card"><p style="margin:0">' + esc(k.limits) + '</p></div><p class="note">' + esc(verify) + '</p>' +
      '<h2>Related categories</h2><p>' + k.related.map((r) => '<a class="chip" href="../' + r + '/">' + esc(CATS.find((x) => x.slug === r).name) + '</a>').join('') + '<a class="chip" href="../scientific-calculator/">Scientific Calculator</a><a class="chip" href="../">All engineering calculators</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></main>' + FOOTC('../../');
    pages[k.slug] = page(k.slug, h1, k.desc, body, catLd(h1, k.slug, k.desc, all), '', { url: BASE ? calcUrl(k.slug) : '', prefix: '../../' });
    meta.push({ slug: k.slug, name: k.name, title: h1 + ' | Elecmetric', desc: k.desc, count: all.length, primary: prim.length, vectors: tv });
  });
  return { pages, meta };
}

/* Practice 2: explanation blocks shared by every calculator page (hand-written and generated). All text comes from the registry entry. */
const REFS = require('./calc_refs.js');
function allowedText(s) {
  if (s.type === 'enum') return (s.options || []).map((o) => s.labels[o]).join('; ');
  const u = s.unit ? ' ' + s.unit : '', parts = [];
  if (s.min != null) parts.push(s.exMin ? 'greater than ' + E.fmt(s.min, 6) + u : E.fmt(s.min, 6) + u + ' or more');
  if (s.max != null) parts.push('up to ' + E.fmt(s.max, 6) + u);
  return (parts.join(', ') || 'any number') + (s.optional ? '; may be left blank' : '');
}
function variablesBlock(def, hide) {
  const clean = (t) => t.replace(/ \(used when[^)]*\)/, '');
  const ins = def.inputs.filter((s) => !(hide && hide.indexOf(s.key) >= 0)).map((s) => [esc(clean(s.label)), esc(s.type === 'enum' ? '(choice)' : s.unit || '(number)'), esc(allowedText(s)), esc(s.hint || '')]);
  const outs = def.outputs.map((o) => [esc(clean(o.label)), esc(o.unit || '(number)'), esc('Shown to ' + o.prec + ' decimal place' + (o.prec === 1 ? '' : 's')), '']);
  const row = (r) => '<tr>' + r.map((x) => '<td>' + x + '</td>').join('') + '</tr>';
  const tbl = (cap, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + cap + '"><table><thead><tr><th>' + cap + '</th><th>Unit</th><th>Allowed or shown</th><th>Note</th></tr></thead><tbody>' + rows.map(row).join('') + '</tbody></table></div>';
  return '<h2>Inputs and results</h2>' + tbl('Input', ins) + tbl('Result', outs);
}
const methodBlock = () => '<h2>How it is calculated</h2><p>Each input is converted to the base unit of its quantity, the formula above is applied in the order shown in the worked example, and each result is shown in the unit you choose. Results are held at full precision and rounded only for display, except where a step selects a standard size, as the worked example shows. A value outside its allowed range is refused with a message instead of giving a result.</p>';
function refsBlock(def) {
  const k = catOfDef(def), r = REFS[k.slug];
  if (!r) throw new Error(k.slug + ': no entry in tools/calc_refs.js');
  return '<h2>Standards and further reading</h2>' + (r.refs.length ? '<ul>' + r.refs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '<p class="note">' + esc(r.note) + (r.refs.length ? ' These are named as background reading. Elecmetric does not embed clause text or rating tables, and the reviewer record for this calculator is separate from this list.' : '') + '</p>';
}

/* Practice 3: related-calculator navigation. The link graph is decided in tools/calc_related.js; this turns it into HTML.
   A related calculator is linked to its own page, or to its conversion page when that page serves the search intent (28 calculators),
   and only as a last resort to the app. */
const RELATED = require('./calc_related.js');
const REL_GRAPH = RELATED.buildRelated(E, CALC_HAND, (d) => catOfDef(d).slug, CATS);
function relatedTarget(id, fromCalcPage) {
  const own = CALC_DATA.find((x) => x.calc === id), def = E.BY_ID[id];
  const blurb = (def.purpose || '').trim().replace(/\s+/g, ' ');
  const first = (blurb.split(/(?<=[a-z0-9)])\.\s/)[0] || blurb).replace(/\.$/, '');
  const short = first.length > 110 ? first.slice(0, 110).replace(/[ ,;:(]+[^ ]*$/, '') + '…' : first;
  if (own) return { href: (fromCalcPage ? '../' : '../calculators/') + own.slug + '/', name: own.name, blurb: short };
  const cv = INTENTS.find((n) => n.calc === id && n.kind !== 'unit');
  if (cv) return { href: (fromCalcPage ? '../../pages/' : '') + cv.slug + '.html', name: titleOf(cv.slug), blurb: short, conv: true };
  return { href: (fromCalcPage ? '../../' : '../') + 'index.html#' + id, name: def.title + ' in Elecmetric', blurb: short, app: true };
}
const REL_GROUPS = [['Next steps', ['next', 'hand']], ['Usually done before this', ['back']], ['Also related', ['recip', 'division', 'category', 'sibling', 'any']]];
function relatedBlock(def, c) {
  const list = REL_GRAPH[def.id], seen = new Set(), out = ['<h2>Related calculators</h2>'];
  REL_GROUPS.forEach(([head, kinds]) => {
    const rows = list.filter((e) => kinds.indexOf(e.kind) >= 0);
    if (!rows.length) return;
    out.push('<p><strong>' + head + '</strong></p><ul>' + rows.map((e) => {
      const t = relatedTarget(e.id, true);
      return '<li><a href="' + t.href + '">' + esc(t.name) + '</a>' + (t.blurb ? ': ' + esc(t.blurb) : '') + '</li>';
    }).join('') + '</ul>');
  });
  return out.join('');
}
const nextCalcs = (n) => (n.kind === 'unit' || n.kind === 'awg' ? [] : (REL_GRAPH[n.calc] || []).filter((e) => e.kind === 'next' || e.kind === 'hand').slice(0, 4));

/* Practice 5: formula guides and converters. Which guides belong to which calculator is decided in tools/calc_articles.js (checked when it loads). */
const GUIDES = require('./calc_articles.js').guideInfo(E, require('./reference_articles.js').articles({ esc, table }));
function guideItems(slugs, prefix) {
  return slugs.map((g) => {
    const i = GUIDES.info(g), first = (i.blurb.split(/(?<=[a-z0-9)])\.\s/)[0] || i.blurb).replace(/\.$/, '');
    const cut = first.lastIndexOf(', ', 120), short = first.length <= 120 ? first : (cut > 50 ? first.slice(0, cut) : first.slice(0, 120).replace(/[ ,;:(]+[^ ]*$/, '') + '…');
    return { href: prefix + g + '.html', title: i.title, blurb: short };
  });
}
const guidesBlock = (slugs) => slugs.length ? '<section id="guides"><h2>Formula guides and reference</h2><p class="note">Longer explanations with worked examples and tables, written for the same topic.</p><ul>' + guideItems(slugs, '../../converters/').map((g) => '<li><a href="' + g.href + '">' + esc(g.title) + '</a>: ' + esc(g.blurb) + '</li>').join('') + '</ul></section>' : '';
const guidesRow = (slugs) => slugs.length ? 'Formula guides: ' + guideItems(slugs, '../converters/').map((g) => '<a class="chip" href="' + g.href + '">' + esc(g.title) + '</a>').join('') + '<br>' : '';
/* Practice 4: simple presentation. The calculator and its result come first; reference sections that most visitors skim past are folded
   into closed <details> blocks (their text stays in the HTML for search, and they open for print and when linked to). */
const det = (html, id) => html.replace(/^<h2>(.*?)<\/h2>/, (m, t) => '<details class="more" id="' + id + '"><summary><h2>' + t + '</h2></summary>') + '</details>';
function buildCalcPages() {
  const pages = {}, meta = [], forms = {}, faqs = {}, bySlug = {};
  CALC_DATA.forEach((c) => { bySlug[c.slug] = c; });
  const link = (s) => '<a class="chip" href="../' + s + '/">' + esc(bySlug[s].name) + '</a>';
  CALC_DATA.forEach((c) => {
    const def = E.BY_ID[c.calc]; if (!def) throw new Error(c.slug + ': unknown calculator ' + c.calc);
    c.pages.forEach((s) => { if (!bySlug[s]) throw new Error(c.slug + ': related page ' + s + ' does not exist'); });
    c.app.forEach((id) => { if (!E.BY_ID[id] && id !== 'feeder-designer') throw new Error(c.slug + ': related app calculator ' + id + ' does not exist'); });
    const h1 = /Calculator$/.test(c.name) ? c.name : c.name + ' Calculator';
    if (c.desc.length < 50 || c.desc.length > 160) throw new Error(c.slug + ': description length ' + c.desc.length);
    if ((h1 + ' | Elecmetric').length > 60) throw new Error(c.slug + ': title too long');
    const raw = merged(def, c.raw || {}), r = run(def, raw, c.slug);
    const heads = c.head.map(([k, u]) => outVal(r, k, u, c.slug)), labels = c.head.map(([k, u]) => r.outputs.find((x) => x.key === k).label);
    const sum = inputRows(def, raw, c.hide).slice(0, 4).map((x) => (/^[A-Z][a-z]/.test(x[0]) ? x[0].charAt(0).toLowerCase() + x[0].slice(1) : x[0]) + ' ' + x[1]).join(', ').replace(/^./, (ch) => ch.toUpperCase());
    const answer = '<div class="card ans"><div>' + esc(sum) + ' gives</div><div class="big">' + heads.map((h, i) => esc((heads.length > 1 ? labels[i].split(' (')[0] + ': ' : '') + h.text + (/%/.test(labels[i]) ? '%' : '')).replace(/^/, '')).join(' · ') + '</div></div>';
    const [vk, vu, vals] = c.vary, spec = def.inputs.find((x) => x.key === vk);
    const rows = vals.map((v) => { const rr = run(def, Object.assign({}, raw, { [vk]: [v, vu] }), c.slug); return [E.fmt(v, 6)].concat(c.head.map(([k, u]) => outVal(rr, k, u, c.slug).num)); });
    const form = formFor({ head: c.head, hide: c.hide, formHide: c.formHide, formOpts: c.formOpts }, def, raw); forms[c.slug] = form.cfg;
    const n = VEC[def.id] || 0;
    const verify = n ? 'Cross-check: ' + n + ' reference cases, calculated from textbook formulas coded separately from the engine by the same author, agree with this calculator. This is not an independent review.' : 'Cross-check: not yet. This calculator is covered by the built-in tests only, so its results have not been compared with separately coded reference values.';
    const faq = [['What do I need to enter?', 'Enter ' + form.cfg.fields.map((f) => f.label.charAt(0).toLowerCase() + f.label.slice(1)).join(', ').replace(/, ([^,]*)$/, ' and $1') + '. Change the unit of a value with its selector and the result stays the same.']].concat(c.faq, [['How accurate are the results?', 'Every figure comes from the same tested engine as the Elecmetric calculators and is meant for estimating. ' + verify.replace('Cross-check: ', '') + ' Check design values against the standard and the equipment data you work to.']]); faqs[c.slug] = faq;
    const body = HEADC + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(c.desc) + '</p>' + formBlock(form) + answer.replace('<div class="card ans">', '<div id="static-ans" class="card ans">') +
      '<p class="note" id="results-note"><strong>Estimate only.</strong> Not engineering or safety advice. Check the result against the applicable standard and the equipment data, and have a competent engineer review it before it is relied on. <a href="../../terms.html">Terms of use</a>.</p>' +
      '<p><a class="btn" href="' + appLink(def, raw, '../../') + '">Open in the calculator with these values</a></p>' +
      '<nav class="jump" aria-label="On this page"><a class="chip" href="#about">About</a><a class="chip" href="#verification">Verification</a><a class="chip" href="#formula">Formula</a><a class="chip" href="#example">Worked example</a><a class="chip" href="#inputs">Inputs and results</a><a class="chip" href="#faq">FAQ</a><a class="chip" href="#related">Related</a>' + (GUIDES.forCalc(def.id).length ? '<a class="chip" href="#guides">Guides</a>' : '') + '</nav>' +
      '<section id="about"><h2>About this calculator</h2><p>' + esc(c.intro) + '</p></section>' +
      '<h2>Limits of this calculator</h2><div class="card"><p style="margin:0">' + esc(c.caveat) + '</p></div><p class="note">' + esc(verify) + '</p>' + verifBlock(def) +
      '<section id="formula">' + '<h2>Formula</h2><div class="f">' + esc(def.formula) + '</div>' + '</section>' +
      '<section id="example">' + '<h2>Worked example</h2>' + table(['Input', 'Value'], inputRows(def, raw, c.hide)) + '<ol class="steps">' + r.steps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' + '</section>' +
      '<h2>Assumptions</h2><ul>' + (def.assumptions || []).map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' + (def.notes ? '<p class="note">' + esc(def.notes) + '</p>' : '') +
      det(variablesBlock(def, c.hide), 'inputs') + det(methodBlock(), 'method') + det('<h2>' + (c.auto ? 'How the result changes with ' + esc(spec.label.replace(/ \(used when[^)]*\)/, '').toLowerCase()) : 'Typical values') + '</h2>' + table([spec.label + (vu ? ' (' + vu + ')' : '')].concat(labels.map((l, i) => l.split(' (')[0] + (c.head[i][1] ? ' (' + c.head[i][1] + ')' : ''))), rows) + '<p class="note">Other inputs are the same as in the worked example above.</p>', 'typical') + det(refsBlock(def), 'standards') +
      '<section id="faq">' + faqHtml(faq) + '</section>' +
      '<section id="related">' + relatedBlock(def, c) + '</section>' + guidesBlock(GUIDES.forCalc(def.id)) + '<p>' + '<a class=\"chip\" href=\"../' + catOfDef(def).slug + '/\">More ' + esc(catOfDef(def).name) + ' calculators</a>' + '<a class=\"chip\" href=\"../\">All engineering calculators</a><a class=\"chip\" href=\"../../index.html#' + def.id + '\">' + esc(def.title) + ' in Elecmetric</a></p></main>' + FOOTC('../../');
    pages[c.slug] = page(c.slug, h1, c.desc, body, calcLd(h1, c.slug, c.desc, faq), formScript(form.cfg, '../../'), { url: BASE ? calcUrl(c.slug) : '', prefix: '../../' });
    meta.push({ slug: c.slug, title: h1 + ' | Elecmetric', desc: c.desc, calc: def.id, group: c.group, vectors: n });
  });
  /* ---------- Issue 8: category hubs (/calculators/<category>/) ---------- */
  /* The Scientific Calculator is a standalone tool, not a registry calculator: its own engine (tools/scicalc_engine.js) and tests (tests/scicalc_vectors.json). */
  const sci = require('./scicalc_page.js').build({ page, esc, table, faqHtml, calcLd, HEADC, FOOTC, calcUrl, BASE });
  pages[sci.slug] = sci.html;
  /* The Basic Calculator is a second standalone tool on the same engine (tools/basiccalc_page.js, tools/basiccalc_client.js). */
  const basic = require('./basiccalc_page.js').build({ page, esc, table, faqHtml, calcLd, HEADC, FOOTC, calcUrl, BASE });
  pages[basic.slug] = basic.html;
  const cats = buildCategoryHubs(bySlug), catMeta = cats.meta;
  Object.keys(cats.pages).forEach((k) => { pages[k] = cats.pages[k]; });
  const groups = []; CALC_DATA.forEach((c) => { let g = groups.find((x) => x[0] === c.group); if (!g) groups.push(g = [c.group, []]); g[1].push(c.slug); });
  const hubDesc = 'Engineering calculators for motors, transformers, cables, short circuit, earthing, generators, solar PV, batteries and airfield lighting.';
  const hub = HEADH + '<main class="w"><h1>Electrical engineering calculators</h1><p class="lede">' + esc(hubDesc) + ' Each page states what the calculator does not cover, and whether independent reference values back it.</p>' +
    '<p>These calculators are built for electrical engineers, technicians, estimators and students. Every page shows the formula, a worked example with the steps written out, a table of typical values and the assumptions behind the result, so you can check the working against your standard or design basis. Results come from one tested engine, and you can open any calculator with your own values and print a calculation sheet.</p>' +
    '<p>Start with a category below, or pick a calculator by task. For simple unit changes such as kW to HP or psi to kPa, use the <a href="../converters/index.html">Conversion Centre</a>. For quick everyday formulas such as amps to kW or Ohm\'s law, see the <a href="../pages/index.html">electrical conversions</a>.</p>' +
    '<h2>Browse by category</h2><p>' + catMeta.map((m) => '<a class="chip" href="' + m.slug + '/">' + esc(m.name) + ' (' + m.count + ')</a>').join('') + '</p>' +
    groups.map(([g, ss]) => '<h2>' + esc(g) + '</h2><p>' + ss.map((s) => '<a class="chip" href="' + s + '/">' + esc(bySlug[s].name) + '</a>').join('') + '</p>').join('') +
    '<h2>General tools</h2><p><a class="chip" href="basic-calculator/">Basic Calculator</a><a class="chip" href="scientific-calculator/">Scientific Calculator (standard and engineering, with complex numbers and phasors)</a></p>' +
    '<h2>More</h2><p><a class="chip" href="../pages/index.html">Electrical conversions</a><a class="chip" href="../">All calculators in Elecmetric</a></p></main>' + FOOTC('../');
  pages['index'] = page('index', 'Electrical engineering calculators', hubDesc, hub, calcLd('Electrical engineering calculators', 'index', ''), '', { url: BASE ? calcUrl('index') : '', prefix: '../' });
  return { pages, meta, forms, faqs, groups, cats: catMeta, sci: { slug: sci.slug, name: sci.name, title: sci.title, desc: sci.desc }, basic: { slug: basic.slug, name: basic.name, title: basic.title, desc: basic.desc, defaultText: basic.defaultText } };
}

/* build({ base }) : base '' gives the committed, deploy-independent output; the default is the BASE_URL environment variable. */
function build(opts) {
  BASE = normBase(opts && 'base' in opts ? opts.base : process.env.BASE_URL);
  const pages = {}, meta = [], forms = {}, faqs = {};
  const bySlug = {}; INTENTS.forEach((n) => { bySlug[n.slug] = n; });
  /* Up to four sibling conversions that share a quantity (the same from or to unit, or the same calculator), so no page depends on one or two inbound links. Fixed order, so the output is deterministic. */
  const sibs = (n, rev) => {
    const tok = n.slug.indexOf('-to-') > 0 ? n.slug.split('-to-') : [], at = INTENTS.indexOf(n), cand = [];
    /* Walk the list in a circle starting after this page, so inbound links are spread evenly instead of piling onto the first few entries. */
    for (let i = 1; i < INTENTS.length; i++) {
      const o = INTENTS[(at + i) % INTENTS.length], ot = o.slug.indexOf('-to-') > 0 ? o.slug.split('-to-') : [];
      if (o.slug === n.slug || (rev && o.slug === rev.slug) || o.kind === 'awg') continue;
      if (tok.some((t) => ot.indexOf(t) >= 0) || o.calc === n.calc) cand.push(o.slug);
    }
    return cand.slice(0, 4).concat((EXTRA_SIBS[n.slug] || []).filter((x) => cand.slice(0, 4).indexOf(x) < 0));
  };
  const linkTo = (s) => '<a class="chip" href="' + s + '.html">' + esc(titleOf(s)) + '</a>';
  INTENTS.forEach((n) => {
    const def = E.BY_ID[n.calc]; if (!def) throw new Error(n.slug + ': unknown calculator ' + n.calc);
    const h1 = titleOf(n.slug) + ' Calculator', isTo = n.slug.indexOf('-to-') > 0;
    let formRaw, formDef, body = '', desc, openHref, formula = def.formula, steps = [], answer = '', exTable = '', varyTable = '', varyNote = '';
    if (n.kind === 'unit') {
      const f = E.UNITS[n.dim].units, a = n.fromU, b = n.toU, conv = (v) => v * f[a] / f[b];
      const val = n.val, res = E.fmt(conv(val), 6) + ' ' + b;
      formula = '1 kVA = 1,000 VA     VA = kVA × 1,000     kVA = VA / 1,000';
      steps = [E.fmt(val, 6) + ' ' + a + ' × ' + E.fmt(f[a] / f[b], 6) + ' = ' + res];
      answer = '<div class="card ans"><div>' + esc(E.fmt(val, 6) + ' ' + a) + ' =</div><div class="big">' + esc(res) + '</div></div>';
      varyTable = table([a, b], n.vals.map((v) => [E.fmt(v, 6), E.fmt(conv(v), 6)]));
      openHref = '../index.html#' + n.calc + '?S=' + n.val + ':' + a;
      desc = 'Convert ' + a + ' to ' + b + ' with the exact factor, a worked example and a table of common values. Apparent power only: this is not a kW conversion.';
      n._assump = ['Both units measure apparent power, so no voltage or power factor is needed', 'To get real power in kW, use the kVA to kW calculator, which needs a power factor'];
    } else if (n.kind === 'awg') {
      const w = E.BY_ID['wire-gauge-conversion'], raw = merged(w, { n: 10 }), r = run(w, raw, n.slug); formRaw = raw; formDef = w;
      const d = outVal(r, 'd', 'mm', n.slug), ar = outVal(r, 'A', 'mm²', n.slug);
      steps = r.steps; formula = w.formula;
      answer = '<div class="card ans"><div>AWG 10 has</div><div class="big">' + esc(d.text) + ' · ' + esc(ar.text) + '</div></div>';
      const ch = E.awgChart();
      varyTable = table(['AWG', 'Diameter (mm)', 'Diameter (in)', 'Area (mm²)', 'kcmil', 'Copper Ω/km'], ch.map((c) => [c.label, E.fmt(c.dMm, 4), E.fmt(c.dIn, 4), E.fmt(c.AMm2, 4), E.fmt(c.kcmil, 3), E.fmt(c.ohmPerKm, 4)]), ch.findIndex((c) => c.n === 10));
      varyNote = 'The full chart runs from AWG 0000 to 40. Open the chart in Elecmetric to look up the nearest AWG for a size in mm².';
      openHref = '../index.html#awg-chart';
      desc = 'AWG wire gauge chart from 0000 to 40: diameter in mm and inches, area in mm² and kcmil, and copper resistance per km, with the formula.';
      n._assump = w.assumptions;
    } else {
      const raw = merged(def, n.raw), r = run(def, raw, n.slug); formRaw = raw; formDef = def;
      const heads = n.head.map(([k, u]) => outVal(r, k, u, n.slug)), labels = n.head.map(([k, u]) => r.outputs.find((x) => x.key === k).label + (u ? ' (' + u + ')' : ''));
      steps = r.steps; openHref = appLink(def, raw);
      answer = '<div class="card ans"><div>' + esc(inputRows(def, raw, n.hide).filter((x) => !/^Voltage type|^Conductor size given/.test(x[0])).slice(0, 4).map((x) => (/^[A-Z][a-z]/.test(x[0]) ? x[0].charAt(0).toLowerCase() + x[0].slice(1) : x[0]) + ' ' + x[1].replace(/ \(1 e.*$/, '')).join(', ').replace(/^./, (c) => c.toUpperCase())) + ' gives</div><div class="big">' + heads.map((h, i) => esc(heads.length > 1 ? labels[i].split(' (')[0] + ': ' + h.text + (/degrees/.test(labels[i]) ? '°' : '') + (/%/.test(labels[i]) ? '%' : '') : h.text)).join(' · ') + '</div></div>';
      exTable = table(['Input', 'Value'], inputRows(def, raw, n.hide));
      const [vk, vu, vals] = n.vary, spec = def.inputs.find((s) => s.key === vk), vl = spec.label + unitTxt(vu && ' (' + vu + ')');
      const rows = vals.map((v) => { const rr = run(def, Object.assign({}, raw, { [vk]: [v, vu] }), n.slug); return [E.fmt(v, 6)].concat(n.head.map(([k, u]) => outVal(rr, k, u, n.slug).num)); });
      varyTable = table([spec.label + (vu ? ' (' + vu + ')' : '')].concat(labels), rows);
      varyNote = 'Other inputs are the same as in the worked example above.';
      const fromTo = isTo ? n.slug.split('-to-').map((p) => NAME[p]) : null;
      desc = DESCS[n.slug] || (fromTo ? 'Convert ' + fromTo[0] + ' to ' + fromTo[1] + ' with the formula, a worked example and a table of typical values.' : def.purpose) + (DESCS[n.slug] ? '' : ' Working shown step by step.');
      n._assump = def.assumptions;
    }
    if (desc.length > 160) throw new Error(n.slug + ': description too long (' + desc.length + ')');
    const rev = n.rev ? bySlug[n.rev] : null;
    const form = formFor(n, formDef, formRaw); forms[n.slug] = form.cfg;
    const faq = faqFor(n, def, { title: titleOf(n.slug), formula, plain: plainOf(answer), fields: form.cfg.fields }); faqs[n.slug] = faq;
    body = HEAD('../') + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' + formBlock(form) + answer +
      '<p class="note" id="results-note"><strong>Estimate only.</strong> Not engineering or safety advice. Check the result against the applicable standard and the equipment data, and have a competent engineer review it before it is relied on. <a href="../terms.html">Terms of use</a>.</p>' +
      '<p><a class="btn" href="' + openHref + '">Open in the calculator with these values</a></p>' +
      '<h2>Formula</h2><div class="f">' + esc(formula) + '</div>' +
      (n.kind === 'awg' ? '' : '<h2>Worked example</h2>' + (exTable || '') + '<ol class="steps">' + steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>') +
            '<h2>' + (n.kind === 'awg' ? 'AWG chart' : 'Typical values') + '</h2>' + varyTable + '<p class="note">' + esc(varyNote) + '</p>' +
      '<h2>Assumptions</h2><ul>' + (n._assump || []).map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' + (n.kind || !def.notes ? '' : '<p class="note">' + esc(def.notes) + '</p>') + faqHtml(faq) +
      '<h2>Related</h2><p>' + (nextCalcs(n).length ? 'Next steps in a design: ' + nextCalcs(n).map((e) => { const t = relatedTarget(e.id, false); return '<a class=\"chip\" href=\"' + t.href + '\">' + esc(t.name) + '</a>'; }).join('') + '<br>' : '') + (rev ? 'Opposite direction: ' + linkTo(rev.slug) + '<br>' : '') + (sibs(n, rev).length ? 'Also see: ' + sibs(n, rev).map(linkTo).join(' ') + '<br>' : '') + guidesRow(n.kind === 'awg' ? GUIDES.forSlug(n.slug, n.calc) : GUIDES.forSlug(n.slug, n.calc)) + (n.slug === 'electricity-bill' ? 'Cost of one appliance: ' + linkTo('energy-cost') + '<br>' : '') + (n.slug === 'energy-cost' || n.slug === 'energy-consumption' ? 'Whole bill with slabs and tax: ' + linkTo('electricity-bill') + '<br>' : '') + '<a class="chip" href="index.html">All ' + INTENTS.length + ' conversions</a><a class="chip" href="../index.html#' + def.id + '">' + esc(def.title) + ' in Elecmetric</a>' + (n.slug === 'ohms-law' || n.slug === 'watts-volts-amps-ohms' ? '<a class="chip" href="../index.html#ac-ohms-law">AC Ohm\'s law (phasors) in Elecmetric</a>' : '') + '</p></main>' + FOOT('../');
    pages[n.slug + '.html'] = page(n.slug, h1, desc, body, pageLd(h1, n.slug, desc, faq), formScript(form.cfg));
    meta.push({ slug: n.slug, title: h1 + ' | Elecmetric', desc, calc: def.id, rev: n.rev });
  });
  const hub = HEAD('../') + '<main class="w"><h1>Electrical conversion calculators</h1><p class="lede">One page for each common conversion, each with the formula, a worked example and a table of typical values. Every number is computed by the tested Elecmetric engine.</p>' +
    GROUPS.map(([g, ss]) => '<h2>' + esc(g) + '</h2><p>' + ss.map(linkTo).join('') + '</p>').join('') + '<h2>Conversion Centre</h2><p><a class="chip" href="../converters/index.html">Unit converters for power, energy, voltage, current, resistance, frequency and more</a></p><h2>Reference and worked examples</h2><p><a class="chip" href="../converters/resistor-color-code.html">Resistor color code calculator</a><a class="chip" href="../converters/ohms-law-formulas.html">Ohm\u2019s law formulas</a><a class="chip" href="../converters/kirchhoffs-laws.html">Kirchhoff\u2019s laws</a><a class="chip" href="../converters/coulombs-law.html">Coulomb\u2019s law calculator</a><a class="chip" href="../converters/electrical-symbols.html">Electrical symbols</a><a class="chip" href="../converters/1000-watts-to-amps.html">1,000 watts to amps</a><a class="chip" href="../converters/100-amps-to-watts.html">100 amps to watts</a></p><h2>Engineering calculators</h2><p><a class="chip" href="../calculators/">Motors, transformers, cables, earthing, solar PV and more</a></p></main>' + FOOT('../');
  pages['index.html'] = page('index', 'Electrical conversion calculators', 'Electrical conversion calculators: amps, kW, kVA, volts, watts, kWh, joules, mAh and more, each with formula, worked example and typical values.', hub, pageLd('Electrical conversion calculators', 'index', ''));
  /* Files that belong at the site root, not in pages/. robots.txt is always written; sitemap.xml needs BASE_URL. */
  const root = { 'robots.txt': 'User-agent: *\nAllow: /\n' + (BASE ? 'Sitemap: ' + BASE + '/sitemap.xml\n' : '') };
  const calc = buildCalcPages();
  const conv = require('./build_converters.js').build({ page, esc, FOOT, table, ldScript, APP_LD, FAQ_LD, faqHtml, base: BASE });
  if (BASE) {
    const urls = [BASE + '/'].concat(['index'].concat(INTENTS.map((n) => n.slug)).map((u) => BASE + '/pages/' + u + '.html')).concat(['index'].concat(CALC_DATA.map((c) => c.slug)).concat(CATS.map((k) => k.slug)).concat(['basic-calculator', 'scientific-calculator']).map(calcUrl)).concat(conv.slugs.map((u) => BASE + '/converters/' + u + '.html'));
    /* lastmod only when the build is given a real date (the workflow passes the last commit date); a made-up "today" on every build would tell crawlers pages changed when they did not. */
    const lm = String((opts && opts.lastmod) || process.env.SITE_LASTMOD || ''), lmTag = /^\d{4}-\d{2}-\d{2}$/.test(lm) ? '<lastmod>' + lm + '</lastmod>' : '';
    root['sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => '  <url><loc>' + u + '</loc>' + lmTag + '</url>').join('\n') + '\n</urlset>\n';
    /* A real 404 page for the host to serve. Absolute links, because it is shown at any address. noindex so it never competes in search. */
    root['404.html'] = page('404', 'Page not found', 'This page does not exist. Go to the Elecmetric electrical calculators.',
      '<header><div class="w"><a class="brand" href="' + BASE + '/"><img src="' + BASE + '/logo.png" alt="Elecmetric" width="160" height="40"></a></div></header><main class="w"><h1>Page not found</h1><p class="lede">That address does not exist. Try one of these.</p><p><a class="chip" href="' + BASE + '/">Elecmetric calculators</a><a class="chip" href="' + BASE + '/calculators/">All engineering calculators</a><a class="chip" href="' + BASE + '/pages/index.html">Electrical conversions</a><a class="chip" href="' + BASE + '/converters/index.html">Conversion Centre</a></p></main>' + FOOT(BASE + '/'),
      '<meta name="robots" content="noindex">', '', { url: '', prefix: BASE + '/' });
  }
  root['index.html'] = indexHtml();
  return { pages, meta, GROUPS, root, forms, faqs, calc, conv, legal: legalPages() };
}

/* Privacy notice and terms of use, written to match what the app really does (no analytics, no accounts, nothing sent to a server).
   Draft text for a lawyer to review. Contact and dates come from tools/site_info.json. */
function legalPages() {
  const L = SITE_INFO, mail = L.contact_email ? '<a href="mailto:' + esc(L.contact_email) + '">' + esc(L.contact_email) + '</a>' : '', law = esc(L.governing_law || 'India'), courts = esc(L.courts_city || 'Delhi, India'), upd = esc(L.legal_updated || '');
  const op = L.operator_name ? esc(L.operator_name) : '', opLine = op ? '<p>Elecmetric is operated by ' + op + (L.operator_location ? ', ' + esc(L.operator_location) : '') + '.</p>' : '';
  const contact = mail ? '<h2>Contact</h2>' + opLine + '<p>Questions, error reports and requests: ' + mail + '.</p>' : '';
  const shell = (slug, h1, desc, inner) => page(slug, h1, desc, '<header><div class="w"><a class="brand" href="./"><img src="logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="./">Calculators</a><a href="pages/index.html">Conversions</a></nav></div></header><main class="w"><h1>' + esc(h1) + '</h1><p class="note">Last updated ' + upd + '</p>' + inner + '</main>' + FOOT(''), '', '', { url: BASE ? BASE + '/' + slug + '.html' : '', prefix: '' });
  const privacy = '<!-- DRAFT: have a lawyer review before publishing -->' +
    '<p class="lede">Elecmetric runs in your browser. It has no accounts and does not send what you type to any server.</p>' +
    '<h2>What stays on your device</h2><p>The values you enter and the results are processed in your browser and are not stored. Elecmetric saves the following in your browser storage so they are there next time: your settings (theme, number grouping, simple or engineering mode), your favourites and your recently used calculators, and the details you type into the calculation sheet form: project, sheet or reference, prepared by, checked by and revision. Those sheet details can include people\'s names, so do not enter them on a shared or public computer. They are used only to fill the next sheet and never leave your device. If you load standards tables into the Cable Selection Check, the table text you load (including the name you give as the person who entered it) is also kept in your browser storage and never leaves your device. It also keeps a cache of its own files so it can work offline. You can clear all of this in your browser settings (clear site data for this website).</p>' +
    '<h2>What we do not use</h2><p>No analytics, advertising or tracking cookies, no user accounts, and no fonts or scripts loaded from other companies\' servers.</p>' +
    '<h2>Hosting</h2><p>The site files are delivered by a hosting provider (for example GitHub Pages). Like any web host, it may log technical data such as your IP address and browser type under its own privacy policy. Elecmetric does not receive or use those logs. The host is a United States company, so those logs may be processed outside India.</p>' +
    '<h2>Shared links</h2><p>A shared calculator link carries its input values in the part of the web address after the # sign. Your browser does not send that part to the web server, so the values stay between you and the people you give the link to. Anyone who opens the link sees those values, and they can show up in your browser history, chat apps and emails where you paste the link. Do not put confidential project data into links you share.</p>' +
    '<h2>Feedback and contact</h2><p>The "Tell us how to improve this page" box has no server behind it. When you press Email your suggestion, your own email app opens with your message and the page address already filled in, and nothing is sent until you press send in that app. If you email us, we use your message and email address only to reply and to fix errors, on the basis that you contacted us. We keep correspondence for up to 12 months after it is resolved, unless the law requires longer, and you can ask us to delete it sooner. Elecmetric is aimed at a general audience and does not knowingly collect personal data other than what you choose to email.</p>' +
    '<h2>Your rights</h2><p>Because nothing you enter is sent to us, we hold no profile about you. For the emails we hold, you can ask us to access, correct or delete them using the contact address below, and we will reply within 30 days. Under the Digital Personal Data Protection Act, 2023 of India you may also ask for a response to a grievance, and you may complain to the Data Protection Board of India once it is operating. Visitors outside India may have additional rights under their local law, for example the GDPR in the European Economic Area and the UK.</p>' +
    '<h2>Changes</h2><p>If Elecmetric later adds accounts, saved projects or analytics, this notice will be updated before that starts and will explain what is collected, why, and how to withdraw consent.</p>' + contact +
    '<p class="note">This notice is governed by the laws of ' + law + '.</p>';
  const terms = '<!-- DRAFT: have a lawyer review before publishing -->' +
    '<p class="lede">Elecmetric is a set of electrical calculators for estimating. These terms apply when you use the site. If you do not accept them, do not use the results.</p>' +
    '<h2>1. Estimating tool, not professional advice</h2><p>Results are design assistance. They are not engineering, legal or safety advice and do not create an engineer-client relationship. You are responsible for checking every result against the applicable standard, the equipment data and local regulations, and for having a competent engineer review any design before it is built, installed or relied on. Do not rely on Elecmetric alone for safety-critical work.</p>' +
    '<h2>2. Standards</h2><p>Elecmetric does not contain the text or tables of any standard and does not claim that a result complies with one. Calculation bases (IEC, IS, BS, AS/NZS, NEC style) use selected method constants only. Names of standards and organisations are used to identify them. Elecmetric is not affiliated with or endorsed by their owners. Some calculation constants are provisional and have not been checked against the latest edition of the named standard; the verification section on each page says so where it applies. If you load standards tables or other third-party data into a calculator, you must have the right to use and enter it. Elecmetric does not supply licensed standards content and does not check your right to use it.</p>' +
    '<h2>3. No warranty</h2><p>Elecmetric is provided "as is" and "as available", without warranties of any kind, including accuracy, completeness, fitness for a particular purpose or uninterrupted availability. Automated tests and cross-checks against separately coded reference calculations reduce errors but cannot rule them out. The verification status on each page shows what has actually been done. No independent technical review has been carried out unless a page states otherwise.</p>' +
    '<h2>4. Limit of liability</h2><p>To the maximum extent permitted by law, Elecmetric and its owner are not liable for any loss or damage, direct or indirect, arising from use of or reliance on the site or its results, including project delays, rework, equipment damage or lost profit. Nothing in these terms excludes or limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be excluded or limited by law.</p>' +
    '<h2>5. Acceptable use</h2><p>Do not misuse the site, interfere with its operation, or present Elecmetric results as certified, approved or independently verified unless they have been.</p>' +
    '<h2>6. Ownership</h2><p>The site, its code, text and design belong to ' + (op || 'Elecmetric') + ' and are protected by copyright. You may use the site and link to it, but you may not copy, republish or resell the site or its content without written permission. Calculation sheets and results you produce are yours to use, subject to point 1.</p>' +
    '<h2>7. Changes</h2><p>We may change the site or these terms. The date at the top shows when they last changed; use of the site after a change is subject to the updated terms.</p>' +
    '<h2>8. Third-party links and data</h2><p>Pages may link to the websites of standards bodies, manufacturers and other organisations. Elecmetric does not control those sites and is not responsible for their content.</p>' +
    '<h2>9. Copyright and other complaints</h2><p>If you believe content on Elecmetric infringes your rights, or you find an error in a calculation, write to the contact address below with the page address and details. We will review it and reply, and we will correct or remove content where that is justified.</p>' +
    '<h2>10. General</h2><p>If any part of these terms is held unenforceable, the rest stays in force. These terms are the whole agreement between you and Elecmetric about the use of the site.</p>' +
    '<h2>11. Governing law and courts</h2><p>These terms are governed by the laws of ' + law + '. The courts at ' + courts + ' have exclusive jurisdiction over disputes about the site, subject to any mandatory consumer rights you have under the law of the place where you live.</p>' + contact;
  return {
    'privacy.html': shell('privacy', 'Privacy notice', 'How Elecmetric handles data: calculations run in your browser, with no accounts, analytics or tracking.', privacy),
    'terms.html': shell('terms', 'Terms of use', 'Terms of use for Elecmetric electrical calculators: estimating tool, no warranty, limits of liability.', terms)
  };
}
module.exports = { legalPages, INTENTS, GROUPS, CALC_DATA, CALC_HAND, CATS, build, titleOf, llCompute, llPhasorSvg, llPhasorSumSvg, llPhasorVISvg, llPhasorRLCSvg };
if (require.main === module) {
  const out = path.join(__dirname, '..', 'pages'); fs.mkdirSync(out, { recursive: true });
  const { pages, root, calc, conv, legal } = build(); const top = path.join(__dirname, '..');
  Object.keys(pages).forEach((f) => fs.writeFileSync(path.join(out, f), pages[f]));
  Object.keys(calc.pages).forEach((k) => { const d = k === 'index' ? path.join(top, 'calculators') : path.join(top, 'calculators', k); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), calc.pages[k]); });
  const cdir = path.join(top, 'converters'); fs.mkdirSync(cdir, { recursive: true });
  Object.keys(conv.pages).forEach((f) => fs.writeFileSync(path.join(cdir, f), conv.pages[f]));
  Object.keys(root).forEach((f) => fs.writeFileSync(path.join(top, f), root[f]));
  Object.keys(legal).forEach((f) => fs.writeFileSync(path.join(top, f), legal[f]));
  if (process.env.BASE_URL && !SITE_INFO.contact_email) console.warn('WARNING: tools/site_info.json has no contact_email, so the privacy and terms pages show no contact address.');
  console.log('wrote ' + Object.keys(pages).length + ' files to pages/, ' + Object.keys(calc.pages).length + ' to calculators/, ' + Object.keys(conv.pages).length + ' to converters/ and ' + Object.keys(root).join(', ') + ' to the site root');
}
