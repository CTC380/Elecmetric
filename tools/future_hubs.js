/* Coming-soon category hubs: Finance, Automotive, Science, AI and IoT (Global SEO Heading Strategy, section 6).
   These pages name the calculators that are PLANNED for each subject, in build order, and link the existing tools that already help.
   They are not calculators and make no claim that a planned tool exists. So that no thin page competes in search:
     - every page is noindex,follow and stays out of sitemap.xml (tools/check_deploy.js enforces both for pages carrying data-coming-soon);
     - the planned tools are not in All Tools, the registry, or the engine, and no tool counts include them.
   Graduating a hub: when a subject has at least 3 working, tested calculators, move it into tools/category_hubs.js (the normal hub path),
   delete its entry here, and it becomes an ordinary indexable hub with a sitemap entry.
   Every formula shown is a standard textbook relation; the page states that a tool is published only after it has worked examples and
   independent reference checks. Edit the content here only; tests/future_hubs_test.js checks the structure. */
'use strict';

/* tool: [name, what it will do, formula (plain text), "You enter", "You get"] */
const HUBS = [
  {
    slug: 'finance-calculators', name: 'Finance', h1: 'Online Finance Calculators',
    title: 'Online Finance Calculators', desc: 'Planned free finance calculators: loan EMI, compound interest, SIP, CAGR, inflation, break-even and GST or VAT, each with its formula and worked example.',
    lede: 'Loan repayments, interest, investment growth and business arithmetic follow fixed formulas, so they suit the same approach Elecmetric uses for engineering: show the formula, show the working, state the assumptions. These are the finance calculators planned first.',
    today: [['percentage-calculator', 'Percentage Calculator'], ['percentage-increase-decrease-calculator', 'Percentage Increase and Decrease Calculator'], ['sequential-discount-markup-calculator', 'Sequential Percentage, Discount and Markup Calculator'], ['led-retrofit-payback', 'LED Retrofit Savings and Payback Calculator'], ['electricity-cost', 'Electricity Cost Calculator']],
    tools: [
      ['Loan EMI Calculator', 'Monthly instalment, total interest and total repayment for a loan.', 'EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)', 'Loan amount P, annual rate (r is the monthly rate), term in months n.', 'EMI, total interest, total payment.'],
      ['Compound Interest and Fixed Deposit Calculator', 'Maturity value of a deposit or investment for any compounding frequency.', 'A = P × (1 + r / m)^(m × t)', 'Principal P, annual rate r, compounding periods per year m, years t.', 'Maturity amount A and interest earned.'],
      ['SIP and Recurring Investment Calculator', 'Future value of a fixed monthly investment at an assumed return.', 'FV = P × [((1 + i)^n − 1) / i] × (1 + i)', 'Monthly amount P, annual return (i is the monthly rate), months n.', 'Future value, amount invested, estimated gain.'],
      ['CAGR Calculator', 'Compound annual growth rate between a start and an end value.', 'CAGR = (End / Start)^(1 / years) − 1', 'Start value, end value, years.', 'CAGR as a percentage.'],
      ['Inflation and Real Return Calculator', 'Real return after inflation, and the future cost of something that costs C today.', 'Real = (1 + nominal) / (1 + inflation) − 1; Future cost = C × (1 + inflation)^t', 'Nominal return, inflation rate, years, current cost.', 'Real return and inflated future cost.'],
      ['Break-Even Calculator', 'Units a business must sell to cover its fixed costs.', 'Break-even units = Fixed costs / (Price − Variable cost per unit)', 'Fixed costs, selling price, variable cost per unit.', 'Break-even units and revenue, margin per unit.'],
      ['GST and VAT Calculator', 'Add tax to a net price, or take it out of a gross price.', 'Gross = Net × (1 + rate); Net = Gross / (1 + rate)', 'Amount, tax rate, whether the amount includes tax.', 'Net, tax amount and gross.'],
      ['Loan Balance and Prepayment Calculator', 'Outstanding balance after k instalments, and the effect of paying extra.', 'Balance after k = P × (1 + r)^k − EMI × ((1 + r)^k − 1) / r', 'Loan amount, rate, term, instalments paid, extra payment.', 'Remaining balance, interest saved, months saved.']
    ],
    limits: 'Rates, tax percentages and fees are inputs you supply, because they differ by country, lender and date. The calculators will show arithmetic, not advice: they will not recommend a product, estimate income tax, or predict market returns. Compounding convention and rounding follow the lender or product terms, which can differ from the textbook formula.',
    faq: [['Will these finance calculators replace professional advice?', 'No. They will show the arithmetic behind a loan or an investment so you can check figures. Decisions about borrowing, investing or tax belong with a qualified adviser and the terms of your own contract.'], ['Which finance calculator will be built first?', 'The Loan EMI Calculator, because the formula is standard and the result can be checked line by line. The order on this page is the planned order and can change.']]
  },
  {
    slug: 'automotive-calculators', name: 'Automotive', h1: 'Online Automotive Calculators',
    title: 'Online Automotive Calculators', desc: 'Planned free automotive calculators: fuel economy, trip fuel cost, EV running cost, engine power, gear ratio and speed, tyre size and compression ratio.',
    lede: 'Fuel use, running cost, drivetrain and engine figures are all short formulas with unit traps, such as km/L against L/100 km against miles per gallon. These are the automotive calculators planned first, with EV tools building on the EV calculators already on Elecmetric.',
    today: [['ev-charge-time', 'EV Charging Time Calculator'], ['ev-energy-consumption', 'EV Energy Consumption Calculator'], ['ev-range', 'EV Range Estimator Calculator'], ['ev-charger-load', 'EV Charger Load Calculator'], ['battery-charge-time', 'Battery Charge Time Calculator']],
    todayLinks: [['../../converters/rotational-speed-converter.html', 'Rotational Speed Converter'], ['../../converters/length-converter.html', 'Length Converter']],
    tools: [
      ['Fuel Efficiency Converter (km/L, L/100 km, mpg)', 'Convert between the three common fuel economy units without the inversion mistake.', 'L/100 km = 100 / (km/L); mpg (US) = 235.215 / (L/100 km); mpg (UK) = 282.481 / (L/100 km)', 'A fuel economy value in any one unit.', 'The same economy in the other units.'],
      ['Trip Fuel Cost Calculator', 'Fuel needed and cost for a journey.', 'Cost = distance × (L/100 km) / 100 × price per litre', 'Distance, fuel economy, fuel price.', 'Litres used and trip cost.'],
      ['EV vs Petrol Running Cost Calculator', 'Cost per kilometre of an electric car against a petrol or diesel car.', 'Cost per km = consumption per km × price per unit (kWh or litre)', 'Consumption, electricity price, fuel price, distance per year.', 'Cost per km and per year for each, and the difference.'],
      ['EV Charging Cost Calculator', 'Cost of a charge, allowing for charging losses.', 'Cost = battery kWh × (SOC end − SOC start) / charging efficiency × tariff', 'Battery size, start and end charge, efficiency, tariff.', 'Energy drawn from the grid and cost of the charge.'],
      ['Engine Power and Torque Calculator', 'Convert between torque and power at a given engine speed.', 'P (kW) = 2π × N (rpm) × T (N·m) / 60,000; hp = T (lb·ft) × rpm / 5252', 'Torque and engine speed, or power and engine speed.', 'Power in kW and hp, or torque.'],
      ['Gear Ratio and Vehicle Speed Calculator', 'Road speed for an engine speed, gear ratio, final drive and tyre.', 'v (km/h) = rpm × π × D × 60 / (1000 × overall ratio), D in metres', 'Engine rpm, gear ratio, final drive ratio, tyre diameter.', 'Road speed, or the rpm needed for a speed.'],
      ['Tyre Size and Speedometer Calculator', 'Overall tyre diameter from a size code, and the speedometer error from a size change.', 'Diameter (mm) = rim (in) × 25.4 + 2 × width (mm) × aspect / 100', 'Tyre width, aspect ratio and rim size, old and new.', 'Diameter, circumference and speed difference.'],
      ['Engine Displacement and Compression Ratio Calculator', 'Swept volume from bore and stroke, and the compression ratio.', 'Vd = (π / 4) × bore² × stroke × cylinders; CR = (Vs + Vc) / Vc', 'Bore, stroke, cylinders, combustion chamber volume.', 'Displacement and compression ratio.']
    ],
    limits: 'Real fuel use and range depend on speed, load, temperature, tyre pressure and driving style, so any figure is an estimate from the inputs you give. Engine and drivetrain calculators use ideal geometry and do not model losses, tuning or emissions rules. Nothing here is a substitute for the manufacturer’s data or for a qualified mechanic.',
    faq: [['Will the EV calculators be separate from the existing ones?', 'No. The EV tools already on Elecmetric stay where they are. The planned EV tools will add cost comparisons and link to them.'], ['Which automotive calculator will be built first?', 'The Fuel Efficiency Converter, because the unit conversion is exact and easy to verify. The order on this page is the planned order and can change.']]
  },
  {
    slug: 'science-calculators', name: 'Science', h1: 'Online Science Calculators',
    title: 'Online Science Calculators', desc: 'Planned free physics and chemistry calculators: kinematics, projectile motion, ideal gas law, molarity, pH, density and molar mass, with formulas.',
    lede: 'Physics and chemistry problems repeat the same few relations with different units. These are the science calculators planned first, each with its formula, a worked example and its assumptions, building on the scientific and conversion tools already here.',
    today: [['scientific-calculator', 'Scientific Calculator Online'], ['half-life-calculator', 'Half-Life Calculator'], ['log-solver', 'Log Solver'], ['exponent-calculator', 'Exponent Calculator']],
    todayLinks: [['../../converters/coulombs-law.html', 'Coulomb’s Law Calculator'], ['../../converters/electrolysis-faraday-formulas.html', 'Electrolysis and Faraday’s Law Formulas'], ['../../converters/temperature-converter.html', 'Temperature Converter'], ['../../converters/pressure-converter.html', 'Pressure Converter'], ['../../converters/sound-level-formulas.html', 'Sound Level and dB Addition Formulas']],
    tools: [
      ['Kinematics (SUVAT) Calculator', 'Solve motion with constant acceleration from any three known quantities.', 'v = u + at; s = ut + ½at²; v² = u² + 2as', 'Any three of u, v, a, s, t.', 'The remaining quantities.'],
      ['Projectile Motion Calculator', 'Range, maximum height and flight time of a launched object.', 'R = v² sin 2θ / g; H = v² sin²θ / 2g; T = 2v sin θ / g', 'Launch speed, launch angle, gravity.', 'Range, height and time of flight.'],
      ['Ideal Gas Law Calculator', 'Solve for pressure, volume, amount or temperature of an ideal gas.', 'PV = nRT, with R = 8.314 J/(mol·K)', 'Any three of P, V, n, T.', 'The fourth quantity, with units.'],
      ['Density, Mass and Volume Calculator', 'Find any one of density, mass or volume from the other two.', 'ρ = m / V', 'Two of density, mass, volume.', 'The third, in your chosen units.'],
      ['Work, Energy and Power Calculator', 'Work done, kinetic and potential energy, and power.', 'W = F × d × cos θ; KE = ½mv²; PE = mgh; P = W / t', 'Force, distance, mass, speed, height or time as needed.', 'Work, energy in joules, power in watts.'],
      ['Molarity and Dilution Calculator', 'Concentration of a solution, and the volume needed to dilute it.', 'M = n / V; M₁V₁ = M₂V₂', 'Moles, volume, or the starting and target concentration.', 'Molarity, or the volume of stock and solvent.'],
      ['pH and pOH Calculator', 'pH from hydrogen ion concentration, and back.', 'pH = −log₁₀[H⁺]; pH + pOH = 14 at 25 °C', 'Hydrogen ion concentration or pH.', 'pH, pOH, [H⁺] and [OH⁻].'],
      ['Molar Mass Calculator', 'Molar mass of a compound from its formula.', 'M = Σ (atoms of element × atomic mass)', 'A chemical formula such as H2SO4.', 'Molar mass in g/mol with the breakdown by element.']
    ],
    limits: 'These will be textbook models. The gas law assumes an ideal gas, projectile motion ignores air resistance, and pH assumes dilute solutions at 25 °C. Real systems at high pressure, high concentration or high speed need more than these formulas. The molar mass tool depends on an atomic mass table that must be checked against IUPAC values before it is published.',
    faq: [['Are these for homework or for professional use?', 'They are general-purpose calculators with the working shown, so they suit both. For safety-critical or regulated work, check the result against your own standard and data.'], ['Which science calculator will be built first?', 'The Kinematics (SUVAT) Calculator, then the Ideal Gas Law Calculator. The order on this page is the planned order and can change.']]
  },
  {
    slug: 'ai-calculators', name: 'AI', h1: 'Online AI and Edge AI Calculators',
    title: 'Online AI and Edge AI Calculators', desc: 'Planned free AI calculators: model memory and quantisation, KV cache size, inference latency, energy per inference, camera data rate and API token cost.',
    lede: 'Sizing a model, a context window or an edge device comes down to multiplication with the right units. These are the AI and edge AI calculators planned first. They give planning estimates from stated assumptions, not benchmark results.',
    today: [['big-number-calculator', 'Big Number Calculator'], ['adc-sampling', 'ADC Resolution and Sampling Calculator'], ['battery-bank-sizing', 'Battery Bank Sizing Calculator']],
    todayLinks: [['../../converters/number-base-converter.html', 'Number Base Converter'], ['../../converters/scientific-notation-converter.html', 'Scientific Notation Converter'], ['../../converters/si-prefix-converter.html', 'SI Prefix Converter']],
    tools: [
      ['Model Memory and Quantisation Calculator', 'Memory needed to hold a model’s weights at different numeric precisions.', 'Bytes = parameters × bytes per parameter (FP32 4, FP16 or BF16 2, INT8 1, INT4 0.5)', 'Parameter count, precision.', 'Weight memory in MB or GB and the saving against FP32.'],
      ['LLM KV Cache Memory Calculator', 'Memory used by the attention key-value cache for a context length.', 'Bytes = 2 × layers × KV heads × head dimension × context length × batch × bytes per value', 'Layers, KV heads, head dimension, context length, batch size, precision.', 'KV cache size in GB.'],
      ['Inference Latency Estimator', 'A lower-bound latency from compute and memory limits.', 't ≥ max(operations / (peak ops/s × utilisation), bytes moved / memory bandwidth)', 'Operations per inference, peak throughput, utilisation, bytes moved, bandwidth.', 'Compute-bound and memory-bound time, and which one limits.'],
      ['Energy per Inference Calculator', 'Energy used by one inference, and how many a battery can run.', 'E = P × t; inferences = battery energy / E', 'Average power during inference, latency, battery capacity and voltage.', 'Joules per inference and inferences per charge.'],
      ['Edge Camera Data Rate Calculator', 'Raw data rate and storage of a camera or sensor stream.', 'Bytes/s = width × height × channels × bits per channel / 8 × frames per second', 'Resolution, channels, bit depth, frame rate, hours.', 'Data rate in MB/s and storage per hour or day.'],
      ['AI API Token Cost Calculator', 'Cost of a workload from token counts and a price per million tokens.', 'Cost = (input tokens × input price + output tokens × output price) / 1,000,000', 'Token counts, price per million tokens, requests.', 'Cost per request and per month.']
    ],
    limits: 'Latency and energy figures from these calculators will be planning bounds. They ignore batching, caching, scheduling, thermal limits and software overhead, so measure on the target device before committing a design. Token prices and model sizes change, so prices are inputs you enter and the tools will not store any provider’s rate.',
    faq: [['Will these calculators run a model or call an AI service?', 'No. They will only do arithmetic in your browser. Nothing you enter is sent anywhere, in line with the rest of Elecmetric.'], ['Which AI calculator will be built first?', 'The Model Memory and Quantisation Calculator, because the formula is exact. The order on this page is the planned order and can change.']]
  },
  {
    slug: 'iot-calculators', name: 'IoT', h1: 'Online IoT, Wireless and Sensor Calculators',
    title: 'Online IoT, Wireless and Sensor Calculators', desc: 'Planned free IoT calculators: node battery life, voltage divider, path loss, link budget, LoRa data rate, antenna length, data usage and solar node sizing.',
    lede: 'Battery life, radio range and sensor interfacing decide whether a connected device works in the field. These are the IoT, wireless and sensor calculators planned first, alongside the instrumentation tools Elecmetric already has.',
    today: [['current-loop-4-20', '4-20 mA Signal Scaling Calculator'], ['adc-sampling', 'ADC Resolution and Sampling Calculator'], ['rtd-pt100', 'RTD Resistance to Temperature Calculator'], ['sensor-range-converter', 'Sensor Range Converter Calculator'], ['battery-charge-time', 'Battery Charge Time Calculator'], ['solar-pv-sizing', 'Solar PV Array Sizing Calculator']],
    todayLinks: [['../../converters/dbm-converter.html', 'dBm to Watts Converter'], ['../../converters/thermistor-formulas.html', 'NTC Thermistor Formulas: Beta Equation']],
    tools: [
      ['IoT Battery Life Calculator', 'Runtime of a duty-cycled device from its sleep and active currents.', 'I avg = (I active × t active + I sleep × t sleep) / (t active + t sleep); life = capacity × derating / I avg', 'Active and sleep current, active time per cycle, cycle time, battery capacity, derating.', 'Average current and battery life.'],
      ['Voltage Divider Calculator', 'Output voltage of a resistor divider, for example to bring a sensor into an ADC range.', 'Vout = Vin × R2 / (R1 + R2)', 'Input voltage, R1, R2.', 'Output voltage and divider current.'],
      ['Free-Space Path Loss Calculator', 'Signal loss over a line-of-sight radio path.', 'FSPL (dB) = 20 log₁₀(d in km) + 20 log₁₀(f in MHz) + 32.44', 'Distance, frequency.', 'Path loss in dB.'],
      ['Wireless Link Budget Calculator', 'Received power and fade margin for a radio link.', 'Prx = Ptx + Gtx + Grx − FSPL − other losses; margin = Prx − sensitivity', 'Transmit power, antenna gains, distance, frequency, losses, receiver sensitivity.', 'Received power and margin in dB.'],
      ['LoRa Data Rate Calculator', 'Bit rate for a chosen spreading factor, bandwidth and coding rate.', 'Rb = SF × (BW / 2^SF) × CR, with CR = 4/5 to 4/8', 'Spreading factor, bandwidth, coding rate.', 'Symbol rate and bit rate.'],
      ['Wavelength and Antenna Length Calculator', 'Wavelength of a signal and a quarter-wave antenna length.', 'λ = c / f; quarter-wave length = λ / 4 × velocity factor', 'Frequency, velocity factor.', 'Wavelength and antenna element length.'],
      ['IoT Data Usage Calculator', 'Monthly data volume of a fleet of devices.', 'Bytes per month = payload × messages per day × days × devices', 'Payload size, messages per day, number of devices.', 'Data per device and per fleet per month.'],
      ['Solar-Powered Sensor Node Sizing Calculator', 'Panel size and battery for an off-grid node.', 'Panel Wp = daily energy (Wh) / (peak sun hours × system efficiency)', 'Daily energy use, peak sun hours, efficiency, days of autonomy.', 'Panel rating and battery capacity.']
    ],
    limits: 'Path loss and link budget formulas assume free space with a clear line of sight. Buildings, terrain, antenna placement and interference add loss, so a result is a best case and needs a fade margin and a field test. Battery life depends on temperature, ageing and self-discharge, which the simple formula only covers through the derating you enter. Radio regulations and duty-cycle limits differ by region and are not checked.',
    faq: [['Will these calculators connect to real devices?', 'No. They will only calculate from numbers you enter, in your browser. They do not read from devices or send data anywhere.'], ['Which IoT calculator will be built first?', 'The IoT Battery Life Calculator, with the Voltage Divider Calculator close behind. The order on this page is the planned order and can change.']]
  }
];

/* ctx: { page, esc, HEADC, FOOTC, calcUrl, ldScript, BASE } */
function build(ctx) {
  const { page, esc, HEADC, FOOTC, calcUrl, ldScript, BASE } = ctx;
  const pages = {}, meta = [];
  const names = (h) => HUBS.filter((x) => x !== h);
  HUBS.forEach((h) => {
    if ((h.title + ' | Elecmetric').length > 60) throw new Error(h.slug + ': title too long');
    if (h.desc.length < 50 || h.desc.length > 160) throw new Error(h.slug + ': description length ' + h.desc.length);
    const chip = (href, t) => '<a class="chip" href="' + href + '">' + esc(t) + '</a>';
    const today = h.today.map(([s, t]) => chip('../' + s + '/', t)).concat((h.todayLinks || []).map(([href, t]) => chip(href, t))).join('');
    const tools = h.tools.map(([name, what, formula, inputs, gets], i) =>
      '<li class="fh-tool"><h3>' + esc(name) + '</h3><p class="fh-tag">Planned, number ' + (i + 1) + ' of ' + h.tools.length + '</p><p>' + esc(what) + '</p>' +
      '<p class="fh-f"><span>Formula</span><code>' + esc(formula) + '</code></p><p><strong>You enter:</strong> ' + esc(inputs) + '</p><p><strong>You get:</strong> ' + esc(gets) + '</p></li>').join('');
    const faq = h.faq.concat([['How are planned calculators chosen and published?', 'Each one is built on a standard formula, shows its working and assumptions, and is published only after it has worked examples and has been checked against separately written reference calculations. Until then it stays on this page as planned.']]);
    const body = HEADC + '<main class="w fh"><p class="fh-crumb"><a href="../all-tools/">All Online Calculators and Tools</a> &rsaquo; ' + esc(h.name) + '</p><h1>' + esc(h.h1) + '</h1><p class="lede">' + esc(h.lede) + '</p>' +
      '<div class="card fh-status" role="note"><strong>Coming soon.</strong> The ' + esc(h.name) + ' calculators below are planned and are not built yet. This page is kept out of search results and the sitemap until the first of them is live and checked. The tools you can use today are listed first.</div>' +
      '<h2>Related Tools You Can Use Today</h2><p class="note">These calculators and converters already exist on Elecmetric and are relevant to this subject.</p><p>' + today + '</p>' +
      '<h2>Upcoming ' + esc(h.name) + ' Calculators</h2><p class="note">Planned order, based on how often the calculation is needed and how clearly its result can be checked. The order can change.</p><ol class="fh-list">' + tools + '</ol>' +
      '<h2>How These Calculators Will Work</h2><p>Every calculator on Elecmetric shows the formula it uses, the working step by step, and a worked example. Inputs have units and sensible limits, and results state what was assumed. A planned calculator is published only when it meets that standard.</p>' +
      '<h2>Assumptions and Limitations</h2><div class="card"><p style="margin:0">' + esc(h.limits) + '</p></div>' +
      '<h2>Frequently Asked Questions</h2>' + faq.map(([q, a]) => '<h3>' + esc(q) + '</h3><p>' + esc(a) + '</p>').join('') +
      '<h2>Explore More Calculators</h2><p><a class="chip" href="../all-tools/">All Online Calculators and Tools</a><a class="chip" href="../">Engineering Calculators</a><a class="chip" href="../../converters/index.html">Conversion Centre</a>' + names(h).map((x) => '<a class="chip" href="../' + x.slug + '/">' + esc(x.name) + ' (coming soon)</a>').join('') + '</p></main>' + FOOTC('../../');
    const css = '<style>.fh-crumb{font-size:13px;color:var(--muted);margin:0 0 6px}.fh-crumb a{color:inherit}.fh-status{border-left:4px solid var(--gold);background:var(--gold-fill)}.fh-list{list-style:none;padding:0;margin:12px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.fh-tool{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:4px 16px 14px}.fh-tool h3{margin:12px 0 2px}.fh-tool p{margin:6px 0;max-width:none}.fh-tag{font:600 12px var(--body);letter-spacing:.04em;text-transform:uppercase;color:var(--gold)}.fh-f span{display:block;font:600 12px var(--body);color:var(--muted);margin-bottom:2px}.fh-f code{display:block;background:var(--field);border:1px solid var(--line);border-radius:4px;padding:8px 10px;font-size:13px;overflow-wrap:anywhere}</style>';
    const ld = BASE ? ldScript({ '@context': 'https://schema.org', '@graph': [{ '@type': 'BreadcrumbList', itemListElement: [['Elecmetric', BASE + '/'], ['All Online Calculators and Tools', calcUrl('all-tools')], [h.h1, calcUrl(h.slug)]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) }] }) : '';
    pages[h.slug] = page(h.slug, h.h1, h.desc, body, '<meta name="robots" content="noindex,follow">' + ld + css, '', { url: BASE ? calcUrl(h.slug) : '', prefix: '../../', title: h.title + ' | Elecmetric' }).replace('<body>', '<body data-coming-soon="' + h.slug + '">');
    meta.push({ slug: h.slug, name: h.name, tools: h.tools.length });
  });
  return { pages, meta };
}

module.exports = { HUBS, build };
