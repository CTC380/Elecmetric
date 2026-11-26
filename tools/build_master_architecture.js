#!/usr/bin/env node
/* Master Category Architecture v1.0 generator.
   Implements the three-level classification (Level 1 main category, Level 2 subcategory, Level 3 topic / problem cluster) and the
   separate tool-type classification from the Elecmetric vs Omni strategic comparison.
   Inputs : tools/master_register.json (246 engine calculators), tools/site_pages.json (58 standalone calculators), calculators/ (folders)
   Outputs: tools/master_architecture.json            (machine-readable; the registry future generators read)
            docs/Elecmetric_Master_Category_Architecture_v1.0.csv   (Level 1 / 2 / 3 nodes, counts, reserved capacity)
            docs/Elecmetric_Master_Tool_Mapping_v1.0.csv            (one row per existing tool)
            docs/COUNT_RECONCILIATION.md                            (what each published count means)
   Persistent IDs: tools/master_architecture_ids.json keeps the Tool ID given to each standalone page, so IDs never move when pages are added.
   Usage: node tools/build_master_architecture.js            (writes the files)
          node tools/build_master_architecture.js --check    (exits 1 if the committed files are out of date) */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const REG = J('tools/master_register.json'), SITE = J('tools/site_pages.json').pages;
const IDF = path.join(__dirname, 'master_architecture_ids.json');
const IDS = fs.existsSync(IDF) ? JSON.parse(fs.readFileSync(IDF, 'utf8')) : { standalone: {} };

/* ---------- Level 1 and Level 2 (from the strategy document, sections 3 to 3.4) ---------- */
const L1 = [
  ['engineering-technology', 'Engineering & Technology', 600, {
    'Electrical Engineering': 'Electrical Fundamentals; AC and DC Circuits; Single-Phase and Three-Phase Systems; Power and Energy; Power Factor and Reactive Power; Cable and Wire Engineering; Voltage Drop and Cable Sizing; Electrical Protection; Short-Circuit Analysis; Earthing and Grounding; Transformers; Motors and Drives; Generators; Batteries and UPS; Electrical Testing and Measurement; Switchgear and Busbar Engineering; Lighting and Illumination (added: not in the strategy list)',
    'Electronics Engineering': 'Analog Electronics; Digital Electronics; Semiconductor Components; Power Electronics; Sensors and Instrumentation; Control Systems; PLC and Automation',
    'Mechanical Engineering': 'Engineering Mechanics; Machine Design; Fluid Mechanics; Thermodynamics; Heat Transfer; Pumps and Compressors; HVAC Engineering; Material Strength',
    'Civil and Structural Engineering': 'Structural Analysis; Beam and Column Design; Concrete Engineering; Steel Structures; Geotechnical Engineering; Surveying and Measurements; Building Material Quantities',
    'Industrial and Manufacturing Engineering': 'Production Engineering; Manufacturing Calculations; Quality Control; Tolerance and Fits; Reliability Engineering; Maintenance Engineering',
    'Airport and Aviation Engineering': 'Airport Ground Lighting (AGL); AGL Series Circuit Calculations; CCR Loading and Sizing; AGL Cable Engineering; Isolating Transformer Engineering; Runway and Taxiway Lighting; Photometric Calculations; PAPI and Approach Lighting Engineering' }],
  ['mathematics', 'Mathematics', 400, { 'Arithmetic and Number Calculations': '', 'Fractions and Decimals': '', 'Percentages and Ratios': '', 'Algebra': '', 'Equations and Inequalities': '', 'Geometry': '', 'Trigonometry': '', 'Calculus': '', 'Differential Equations': '', 'Linear Algebra and Matrices': '', 'Complex Numbers': '', 'Numerical Methods': '', 'Discrete Mathematics': '', 'Applied and Engineering Mathematics': '' }],
  ['finance-money', 'Finance & Money', 250, { 'Loan and EMI Calculators': '', 'Interest Calculators': '', 'Mortgage Calculators': '', 'Investment and Returns': '', 'Compound Interest and Savings': '', 'Tax Calculators': '', 'Salary and Payroll': '', 'Retirement Planning': '', 'Budget and Expenses': '', 'Credit and Debt': '', 'Insurance Calculations': '', 'Inflation Calculators': '' }],
  ['unit-conversion-measurement', 'Unit Conversion & Measurement', 200, { 'Length': '', 'Area': '', 'Volume': '', 'Mass': '', 'Temperature': '', 'Pressure': '', 'Energy': '', 'Power': '', 'Data': '', 'SI Prefixes': '', 'Electrical Units': 'Power Conversion; Current and Apparent Power; Energy and Capacity; Wire Gauge (added: named in strategy section 5)' }],
  ['physics-applied-science', 'Physics & Applied Science', 160, { 'Mechanics': '', 'Optics': '', 'Waves': '', 'Thermodynamics': '', 'Electricity': '', 'Acoustics': '' }],
  ['computer-science-it', 'Computer Science & IT', 160, { 'Programming': '', 'Algorithms': '', 'Networking': '', 'Data Storage': '', 'Web Development': '', 'Databases': '' }],
  ['business-economics', 'Business & Economics', 150, { 'Profit': '', 'Margin': '', 'Pricing': '', 'Marketing': '', 'Inventory': '', 'Project Management': '', 'Economics': '' }],
  ['construction-architecture', 'Construction & Architecture', 140, { 'Materials': '', 'Flooring': '', 'Roofing': '', 'Concrete': '', 'Quantity Estimation': '', 'Building Costs': '' }],
  ['statistics-data-analysis', 'Statistics & Data Analysis', 130, { 'Probability': '', 'Distributions': '', 'Regression': '', 'Sampling': '', 'Hypothesis Testing': '', 'Data Analysis': '' }],
  ['energy-environment', 'Energy & Environment', 130, { 'Solar': '', 'Wind': '', 'Batteries': '', 'Energy Efficiency': '', 'Carbon Footprint': '', 'Environmental Calculations': '' }],
  ['health-fitness', 'Health & Fitness', 100, { 'BMI': '', 'Nutrition': '', 'Exercise': '', 'Body Measurements': '', 'Fitness and Wellness': '' }],
  ['automotive-transportation', 'Automotive & Transportation', 100, { 'Fuel Consumption': '', 'Vehicle Performance': '', 'EV Charging': '', 'Transport and Logistics': '', 'Rail Electrification': '(added: not in the strategy list)' }],
  ['everyday-life-home', 'Everyday Life & Home', 100, { 'Time': '', 'Date': '', 'Household Costs': '', 'Home Planning': '', 'Personal Utilities': '' }],
  ['chemistry', 'Chemistry', 90, { 'Stoichiometry': '', 'Molarity': '', 'Solutions': '', 'Concentration': '', 'pH': '', 'Chemical Reactions': '' }],
  ['biology-life-sciences', 'Biology & Life Sciences', 70, { 'Genetics': '', 'Population': '', 'Ecology': '', 'Physiology': '', 'Biological Measurements': '' }],
  ['education-exams', 'Education & Exams', 70, { 'GPA': '', 'Grades': '', 'Marks': '', 'Exam Scores': '', 'Academic Performance': '' }],
  ['food-agriculture', 'Food & Agriculture', 60, { 'Recipe Scaling': '', 'Cooking': '', 'Crop Yield': '', 'Irrigation': '', 'Agricultural Planning': '' }],
  ['sports-recreation', 'Sports & Recreation', 40, { 'Running': '', 'Cycling': '', 'Sports Statistics': '', 'Performance': '' }],
  ['geography-astronomy', 'Geography & Astronomy', 40, { 'Coordinates': '', 'Distance': '', 'Mapping': '', 'Astronomy and Orbital Calculations': '' }],
  ['design-media-photography', 'Design, Media & Photography', 30, { 'Image Dimensions': '', 'Aspect Ratios': '', 'Printing': '', 'Typography': '', 'Audio and Video': '' }]
];
const ELEC = ['engineering-technology', 'Electrical Engineering'], ELN = ['engineering-technology', 'Electronics Engineering'], AGL = ['engineering-technology', 'Airport and Aviation Engineering'];

/* ---------- Mapping of the existing 24 register categories (C01 to C24) to Level 1 and Level 2 ---------- */
const CAT_DEFAULT = { C01: ELEC, C02: ELEC, C03: ELEC, C04: ELEC, C05: ELEC, C06: ELEC, C07: ELEC, C08: ELEC, C09: ELEC, C10: ELEC,
  C11: ['energy-environment', 'Solar'], C12: ['automotive-transportation', 'EV Charging'], C13: ELN, C14: ELN, C15: ELN, C16: ELEC, C17: AGL, C18: ELEC,
  C19: ELEC, C20: ELEC, C21: ['automotive-transportation', 'Rail Electrification'], C22: ELEC, C23: ELEC, C24: ['mathematics', 'Applied and Engineering Mathematics'] };
const SUB_DEFAULT = { 'C11-S04': ['energy-environment', 'Wind'], 'C15-S01': ELN, 'C24-S01': ['mathematics', 'Algebra'], 'C24-S02': ['mathematics', 'Calculus'], 'C24-S03': ['mathematics', 'Geometry'],
  'C24-S04': ['statistics-data-analysis', 'Data Analysis'], 'C24-S05': ['statistics-data-analysis', 'Probability'], 'C24-S06': ['mathematics', 'Linear Algebra and Matrices'],
  'C24-S07': ['mathematics', 'Arithmetic and Number Calculations'], 'C24-S08': ['unit-conversion-measurement', 'Length'] };
const M = (l2) => ['mathematics', l2], S = (l2) => ['statistics-data-analysis', l2], EU = ['unit-conversion-measurement', 'Electrical Units'];
const TOOL_OVERRIDE = {
  'first-order-ode': M('Differential Equations'), 'laplace-transform': M('Differential Equations'), 'trig-functions': M('Trigonometry'), 'complex-number': M('Complex Numbers'),
  'quadratic-solver': M('Equations and Inequalities'), 'simultaneous-equations': M('Equations and Inequalities'), 'discriminant-calculator': M('Equations and Inequalities'),
  'engineering-quadratic': M('Equations and Inequalities'), 'parabola-graph': M('Equations and Inequalities'),
  'percentage-calculator': M('Percentages and Ratios'), 'ratio-calculator': M('Percentages and Ratios'), 'proportion-calculator': M('Percentages and Ratios'), 'equivalent-ratio-calculator': M('Percentages and Ratios'),
  'basic-percentage-calculator': M('Percentages and Ratios'), 'percentage-increase-decrease-calculator': M('Percentages and Ratios'), 'percentage-difference-calculator': M('Percentages and Ratios'),
  'engineering-percentage-calculator': M('Percentages and Ratios'), 'sequential-discount-markup-calculator': M('Percentages and Ratios'),
  'fraction-arithmetic': M('Fractions and Decimals'), 'fraction-simplifier': M('Fractions and Decimals'), 'mixed-number-calculator': M('Fractions and Decimals'), 'fraction-ratio-tools': M('Fractions and Decimals'), 'decimal-fraction-converter': M('Fractions and Decimals'),
  'linear-interpolation': M('Numerical Methods'), 'permutations-combinations': M('Discrete Mathematics'), 'matrix-calculator': M('Linear Algebra and Matrices'), 'vector-calculator': M('Linear Algebra and Matrices'),
  'mean-median-mode': S('Data Analysis'), 'standard-deviation': S('Data Analysis'), 'linear-regression': S('Regression'), 'binomial-distribution': S('Distributions'), 'probability-calculator': S('Probability'), 'random-number-generator': S('Probability'),
  'standard-deviation-calculator': S('Data Analysis'), 'descriptive-statistics-calculator': S('Data Analysis'), 'frequency-grouped-data-calculator': S('Data Analysis'), 'number-sequence-pattern-finder': M('Algebra'),
  'bmi-calculator': ['health-fitness', 'BMI'], 'bmi-indian-regional-calculator': ['health-fitness', 'BMI'],
  'bmr-calculator': ['health-fitness', 'Nutrition'], 'tdee-calculator': ['health-fitness', 'Nutrition'], 'calorie-calculator': ['health-fitness', 'Nutrition'], 'weight-loss-gain-calculator': ['health-fitness', 'Nutrition'], 'amortization-calculator': ['finance-money', 'Loan and EMI Calculators'], 'floating-rate-simulator': ['finance-money', 'Loan and EMI Calculators'], 'home-loan-affordability-calculator': ['finance-money', 'Loan and EMI Calculators'], 'home-loan-amortization-calculator': ['finance-money', 'Loan and EMI Calculators'], 'home-loan-balance-transfer-calculator': ['finance-money', 'Loan and EMI Calculators'], 'home-loan-emi-calculator': ['finance-money', 'Loan and EMI Calculators'], 'home-loan-prepayment-calculator': ['finance-money', 'Loan and EMI Calculators'], 'home-purchase-cost-calculator': ['finance-money', 'Loan and EMI Calculators'], 'under-construction-pre-emi-calculator': ['finance-money', 'Loan and EMI Calculators'], 'date-calculator': ['everyday-life-home', 'Date'], 'add-subtract-date-calculator': ['everyday-life-home', 'Date'],
  'concrete-volume-calculator': ['construction-architecture', 'Concrete'], 'concrete-wastage-calculator': ['construction-architecture', 'Concrete'], 'concrete-bag-calculator': ['construction-architecture', 'Concrete'], 'rmc-calculator': ['construction-architecture', 'Concrete'], 'cement-sand-aggregate-calculator': ['construction-architecture', 'Concrete'], 'concrete-cost-estimator': ['construction-architecture', 'Concrete'],
  'derivative-integral': M('Calculus'), 'fractional-inch-converter': ['unit-conversion-measurement', 'Length'],
  /* electrical-unit converters: strategy section 5 (kW to Amps Converter belongs to Unit Conversion, tool type Converter) */
  'three-phase-current': EU, 'kva-to-amps': EU, 'kw-to-kva': EU, 'kwh-to-kw': EU, 'battery-mah-wh': EU, 'watts-to-amps': EU, 'amps-to-watts': EU, 'amps-to-kw': EU, 'amps-to-kva': EU, 'kva-to-kw': EU,
  'wire-gauge-conversion': EU, 'swg-wire': EU, 'hp-kw-converter': EU, 'power-converter': EU, 'energy-converter': EU };

/* ---------- Tool types (strategy section 5): nine types, separate from subject ---------- */
const TYPES = ['Calculator', 'Converter', 'Generator', 'Solver', 'Estimator', 'Analyzer', 'Simulator', 'Reference', 'Worked Example'];
const FAMILY = { TT1: 'Calculator', TT2: 'Estimator', TT3: null, TT4: 'Simulator', TT5: 'Converter', TT6: 'Estimator', TT7: 'Analyzer', TT8: 'Reference' };
const SOLVER_RE = /solver|solve|simultaneous|laplace|differential|ode\b|routh|theorem|kirchhoff|matrix|mesh|nodal|equation|quadratic|thevenin/i;
const TYPE_OVERRIDE = { 'random-number-generator': 'Generator' };
function toolType(id, name, fam) {
  if (TYPE_OVERRIDE[id]) return TYPE_OVERRIDE[id];
  if (fam === 'TT3') return SOLVER_RE.test(id + ' ' + name) ? 'Solver' : 'Analyzer';
  return FAMILY[fam];
}

/* ---------- Build ---------- */
const l1by = Object.fromEntries(L1.map((x, i) => [x[0], { id: 'A' + String(i + 1).padStart(2, '0'), slug: x[0], name: x[1], target: x[2], l2: x[3] }]));
const l2id = {}; Object.values(l1by).forEach((c) => Object.keys(c.l2).forEach((n, i) => { l2id[c.slug + '|' + n] = c.id + '.' + String(i + 1).padStart(2, '0'); }));
const subName = Object.fromEntries(REG.subcategories.map((s) => [s.id, s.name]));
const catByid = Object.fromEntries(REG.categories.map((c) => [c.id, c]));
const familyName = Object.fromEntries(REG.toolTypes.map((t) => [t.id, t.name]));

const tools = [];
REG.tools.forEach((t) => tools.push({ toolId: t.toolId, id: t.engineId, name: t.name, url: t.url, source: 'engine', cat: t.category, sub: t.subcategory, fam: t.toolType, task: t.task, app: t.application, verification: t.verification }));
/* standalone IDs: keep any already given, then number new slugs after the highest in use */
let next = Math.max(...REG.tools.map((t) => +t.toolId.slice(3)), ...Object.values(IDS.standalone).map((v) => +v.slice(3)));
SITE.slice().sort((a, b) => a.id.localeCompare(b.id)).forEach((p) => { if (!IDS.standalone[p.id]) IDS.standalone[p.id] = 'EM-' + String(++next).padStart(5, '0'); });
SITE.forEach((p) => tools.push({ toolId: IDS.standalone[p.id], id: p.id, name: p.name, url: p.url, source: 'standalone', cat: p.category, sub: p.subcategory, fam: p.toolType, task: p.task, app: (catByid[p.category] || {}).application || 'General', verification: 'Not verified' }));
tools.sort((a, b) => a.toolId.localeCompare(b.toolId));

const l3 = {}; const rows = [];
tools.forEach((t) => {
  const pl = TOOL_OVERRIDE[t.id] || SUB_DEFAULT[t.sub] || CAT_DEFAULT[t.cat];
  if (!pl) throw new Error('no Level 1/2 mapping for ' + t.id + ' (' + t.cat + ')');
  const c = l1by[pl[0]]; if (!c || !(pl[1] in c.l2)) throw new Error('unknown Level 2 "' + pl[1] + '" for ' + t.id);
  const l2key = c.slug + '|' + pl[1], l3key = l2key + '|' + t.sub;
  if (!l3[l3key]) l3[l3key] = { l1: c, l2: pl[1], l2id: l2id[l2key], legacy: t.sub, name: subName[t.sub], count: 0 };
  l3[l3key].count++;
  rows.push({ t, c, l2: pl[1], l2id: l2id[l2key], l3key });
});
/* Level 3 IDs: number within each Level 2, in legacy-subcategory order */
const byL2 = {}; Object.keys(l3).sort().forEach((k) => { const n = l3[k]; (byL2[n.l2id] = byL2[n.l2id] || []).push(n); });
Object.values(byL2).forEach((a) => a.forEach((n, i) => { n.id = n.l2id + '.' + String(i + 1).padStart(2, '0'); }));
const typeCount = Object.fromEntries(TYPES.map((x) => [x, 0]));

const q = (v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const csv = (head, data) => head.join(',') + '\n' + data.map((r) => r.map(q).join(',')).join('\n') + '\n';

const mapRows = rows.map((r) => {
  const t = r.t, ty = toolType(t.id, t.name, t.fam); typeCount[ty]++;
  return [t.toolId, t.id, t.name, t.url, t.source, r.c.id, r.c.name, r.l2id, r.l2, l3[r.l3key].id, l3[r.l3key].name, ty, t.cat, catByid[t.cat].name, t.sub, familyName[t.fam], t.task, t.app, t.verification, r.c.slug === 'engineering-technology' && r.l2 === 'Airport and Aviation Engineering' ? 'Yes' : ''];
});
const MAP_HEAD = ['Tool ID', 'Slug / engine ID', 'Tool name', 'URL', 'Source', 'L1 ID', 'Level 1 main category', 'L2 ID', 'Level 2 subcategory', 'L3 ID', 'Level 3 topic (existing)', 'Tool type', 'Legacy category ID', 'Legacy category', 'Legacy subcategory ID', 'Legacy tool family', 'Legacy task', 'Application tag', 'Verification', 'Featured hub (AGL)'];

const l1count = {}, l2count = {};
rows.forEach((r) => { l1count[r.c.slug] = (l1count[r.c.slug] || 0) + 1; l2count[r.l2id] = (l2count[r.l2id] || 0) + 1; });
const archRows = [];
Object.values(l1by).forEach((c) => {
  const n = l1count[c.slug] || 0;
  archRows.push([1, c.id, '', c.name, '', '', c.slug, c.target, n, Math.max(0, c.target - n), n ? 'Live' : 'Planned', Object.keys(c.l2).length, '']);
  Object.keys(c.l2).forEach((l2) => {
    const id = l2id[c.slug + '|' + l2], k = l2count[id] || 0;
    archRows.push([2, id, c.id, c.name, l2, '', c.slug + '/' + l2.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), '', k, '', k ? 'Live' : 'Planned', (byL2[id] || []).length, c.l2[l2]]);
    (byL2[id] || []).forEach((n3) => archRows.push([3, n3.id, id, c.name, l2, n3.name, '', '', n3.count, '', 'Live', 0, 'Legacy subcategory ' + n3.legacy]));
  });
});
const ARCH_HEAD = ['Level', 'ID', 'Parent ID', 'Level 1 main category', 'Level 2 subcategory', 'Level 3 topic', 'Slug path', 'Target tools (long-term)', 'Existing tools', 'Reserved capacity', 'Status', 'Child nodes', 'Reference topics (strategy) / note'];

const out = {
  meta: { version: '1.0', source: 'Elecmetric vs Omni Calculator strategic comparison', build: 'v1.99.104', note: 'Existing tools are classified by primary Level 1, 2 and 3 placement. Target counts are the strategy document\'s long-term portfolio, not a launch requirement. Subject (Level 1-3) and tool type are separate fields. Verification is separate from category: no tool is Verified.' },
  toolTypes: TYPES, legacyCategoryLevel1: Object.fromEntries(Object.keys(CAT_DEFAULT).map((k) => [k, l1by[CAT_DEFAULT[k][0]].id])), level1: Object.values(l1by).map((c) => ({ id: c.id, slug: c.slug, name: c.name, target: c.target, existing: l1count[c.slug] || 0, level2: Object.keys(c.l2).map((n) => ({ id: l2id[c.slug + '|' + n], name: n, existing: l2count[l2id[c.slug + '|' + n]] || 0, topics: (byL2[l2id[c.slug + '|' + n]] || []).map((x) => ({ id: x.id, name: x.name, legacySubcategory: x.legacy, existing: x.count })) })) })),
  tools: mapRows.map((r) => Object.fromEntries(['toolId', 'id', 'name', 'url', 'source', 'l1', 'l1Name', 'l2', 'l2Name', 'l3', 'l3Name', 'toolType', 'legacyCategory'].map((k, i) => [k, r[i]])))
};


/* ---------- Review queue: who must review what, in what order. Reviewer fields stay blank until a named, qualified person signs; nothing here approves a tool. ---------- */
const P1 = new Set(['C03', 'C05', 'C06', 'C07', 'C08', 'C09', 'C17', 'C23']);
const DISC = { 'Electrical Engineering': 'Electrical power engineer', 'Electronics Engineering': 'Electronics / control engineer', 'Airport and Aviation Engineering': 'AGL / airfield lighting specialist', 'Mathematics': 'Mathematician or numerical-methods reviewer', 'Statistics & Data Analysis': 'Statistician', 'Unit Conversion & Measurement': 'Metrology / units reviewer', 'Energy & Environment': 'Renewable energy engineer', 'Automotive & Transportation': 'EV / traction engineer' };
const prio = (t) => (P1.has(t.cat) ? 'P1 safety or protection critical' : /^C24$/.test(t.cat) ? 'P3 general mathematics' : 'P2 engineering');
const REVIEW_HEAD = ['Priority', 'Tool ID', 'Tool name', 'URL', 'Level 1', 'Level 2', 'Reviewer discipline needed', 'Review stage', 'Reviewer name', 'Reviewer qualification', 'Review date', 'Worksheet / evidence reference', 'Outcome', 'Next review due'];
const reviewRows = rows.map((r) => [prio(r.t), r.t.toolId, r.t.name, r.t.url, r.c.name, r.l2, DISC[r.l2] || DISC[r.c.name], 'Not reviewed', '', '', '', '', '', '']).sort((a, b) => (a[0] + a[1] < b[0] + b[1] ? -1 : 1));

/* ---------- Count reconciliation ---------- */
const dirs = fs.readdirSync(path.join(ROOT, 'calculators')).filter((d) => fs.statSync(path.join(ROOT, 'calculators', d)).isDirectory());
const html = (d) => { const f = path.join(ROOT, 'calculators', d, 'index.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
const HUBS = new Set(['electrical-fundamentals', 'power-and-energy', 'cable-engineering', 'motor-engineering', 'transformer-engineering', 'electrical-protection', 'power-systems', 'earthing-and-grounding', 'renewable-energy', 'airport-agl-engineering', 'electronics-and-instrumentation', 'lighting-and-facilities', 'engineering-mathematics']);
const stand = new Set(SITE.map((p) => p.id)), eng = new Set(REG.tools.map((t) => t.engineId));
const kinds = { hub: 0, allTools: 0, comingSoon: 0, redirect: 0, standalone: 0, engineOwn: 0, engineAlias: 0 };
dirs.forEach((d) => { const h = html(d);
  if (HUBS.has(d)) kinds.hub++; else if (d === 'all-tools') kinds.allTools++; else if (/data-coming-soon/.test(h)) kinds.comingSoon++;
  else if (/http-equiv="refresh"/i.test(h)) kinds.redirect++; else if (stand.has(d)) kinds.standalone++; else if (eng.has(d)) kinds.engineOwn++; else kinds.engineAlias++; });
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8'), smCalc = (sitemap.match(/<loc>[^<]*\/calculators\/[^<]*<\/loc>/g) || []).length, smAll = (sitemap.match(/<loc>/g) || []).length;
const convPages = REG.converterPages.length, conv2 = REG.conversionPages.length;
const eVer = REG.tools.reduce((m, t) => (m[t.verification] = (m[t.verification] || 0) + 1, m), {});
const md = `# Count reconciliation (generated by tools/build_master_architecture.js, build v1.99.104)

One figure per question, so a published count always means the same thing. Regenerate with \`node tools/build_master_architecture.js\`.

## The number to publish

| Question | Count | Source |
|---|---|---|
| Calculators and tools Elecmetric has (engine + standalone) | **${tools.length}** | \`tools/master_register.json\` (${REG.tools.length}) + \`tools/site_pages.json\` (${SITE.length}) |
| of which run by the shared engine | ${REG.tools.length} | master_register.json \`tools\` |
| of which standalone calculators with their own page script | ${SITE.length} | site_pages.json \`pages\` |

\`README.md\` and \`ROADMAP.md\` state "246 calculators". That is the engine count only and leaves out the ${SITE.length} standalone calculators (Exponent, Root, Percentage, Fraction, Binary, Half-Life and the rest). Decide whether public wording says "${tools.length} calculators" or "246 engine calculators plus ${SITE.length} standalone tools" and use it everywhere.

## Why other numbers differ

| Figure | Value | What it counts |
|---|---|---|
| Folders in \`calculators/\` | ${dirs.length} | Every folder, including hubs and redirects. Not a calculator count |
| Category hubs | ${kinds.hub} | 13 subject hubs |
| All Tools catalogue | ${kinds.allTools} | Directory page |
| Coming-soon hubs | ${kinds.comingSoon} | Finance, Automotive, Science, AI, IoT (noindex, not in sitemap, not counted as tools) |
| Redirect folders | ${kinds.redirect} | Old URLs that forward to a live page |
| Standalone calculator folders | ${kinds.standalone} | Same ${SITE.length} standalone tools |
| Engine calculators with their own folder | ${kinds.engineOwn} | One URL per calculator |
| Other folders | ${kinds.engineAlias} | Slug aliases and renamed pages; check each before treating as a tool |
| Engine calculators reached through a conversion page | ${REG.tools.filter((t) => /^Via/.test(t.urlStatus)).length} | They have no folder of their own, so folders under-count engine calculators |
| Sitemap URLs, all | ${smAll} | Indexable pages of every kind |
| Sitemap URLs under /calculators/ | ${smCalc} | Hubs, All Tools, calculators; not coming-soon or redirects |
| Converter and formula pages | ${convPages} | Register \`converterPages\`: formula articles, numeric pages, direction pages, converters, references |
| Conversion pages in /pages/ | ${conv2} | Register \`conversionPages\` |
| Engine verification (register) | ${JSON.stringify(eVer)} | Every tool is "Not verified": passing automated tests is not independent engineering verification |

## Rules from now on
1. Say "calculators and tools" for the ${tools.length}, never for folders or sitemap URLs.
2. Do not add a page count to marketing copy without naming what it counts.
3. When a calculator is added, add it to \`tools/master_register.json\` (engine) or \`tools/site_pages.json\` (standalone), then run the generator. \`tests/master_architecture_test.js\` fails if any tool is unclassified or the committed files are stale.
`;
const files = {
  'tools/master_architecture.json': JSON.stringify(out, null, 1) + '\n',
  'tools/master_architecture_ids.json': JSON.stringify(IDS, null, 1) + '\n',
  'docs/Elecmetric_Master_Category_Architecture_v1.0.csv': csv(ARCH_HEAD, archRows),
  'docs/Elecmetric_Master_Tool_Mapping_v1.0.csv': csv(MAP_HEAD, mapRows),
  'docs/Elecmetric_Review_Queue_v1.0.csv': csv(REVIEW_HEAD, reviewRows),
  'docs/COUNT_RECONCILIATION.md': md
};
if (require.main === module) {
  const check = process.argv.includes('--check'); let stale = 0;
  Object.keys(files).forEach((f) => { const p = path.join(ROOT, f), cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (check) { if (cur !== files[f]) { stale++; console.log('stale: ' + f); } } else { fs.writeFileSync(p, files[f]); console.log('wrote ' + f); } });
  if (check) process.exit(stale ? 1 : 0);
  console.log('tools ' + tools.length + ', Level 1 ' + L1.length + ', Level 2 ' + archRows.filter((r) => r[0] === 2).length + ', Level 3 ' + archRows.filter((r) => r[0] === 3).length + ', types ' + JSON.stringify(typeCount));
}
module.exports = { out, tools, TYPES, files };
