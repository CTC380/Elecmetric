#!/usr/bin/env node
'use strict';
/*
 * CI test runner. Runs test scripts in parallel and prints one line per script.
 *
 *   node tests/ci_suite.js gate      deploy gate: engine checks, routing, site structure, links (about 20 s)
 *   node tests/ci_suite.js full      everything else: full run_tests.js, committed-page drift, every per-calculator vector suite
 *   node tests/ci_suite.js all       gate + full
 *
 * A script that exits non-zero, or runs past TEST_TIMEOUT_S (default 600), fails the run.
 * A new tests/*_test.js is picked up automatically as a "full" test, so the workflow file never needs editing for it.
 * To make a test block deployment, add its file name to GATE.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

/* Fast, deploy-critical. run_tests.js is run with ELECMETRIC_ENGINE_ONLY=1 here (sections 1-7, calculation maths only). */
const GATE = [
  'run_tests.js',
  'router_test.js',
  'check_site_test.js',
  'master_architecture_test.js',
  'site_pages_test.js',
  'internal_link_graph_test.js',
  'home_perf_search_test.js'
];
/* Scripts whose "gate" run is a reduced version of the "full" run. */
const GATE_ENV = { 'run_tests.js': { ELECMETRIC_ENGINE_ONLY: '1' } };

const group = process.argv[2] || 'all';
if (!['gate', 'full', 'all'].includes(group)) {
  console.error('usage: node tests/ci_suite.js gate|full|all');
  process.exit(2);
}

const dir = __dirname;
const root = path.join(dir, '..');
const every = fs.readdirSync(dir).filter(f => /_test\.js$/.test(f) || f === 'run_tests.js').sort();
const missing = GATE.filter(f => !every.includes(f));
if (missing.length) { console.error('GATE lists missing files: ' + missing.join(', ')); process.exit(2); }

/* Each job is { file, env }. Slowest scripts first so they start at once and the run ends sooner. */
const SLOW_FIRST = ['run_tests.js', 'category_pages_test.js'];
const jobs = [];
if (group !== 'full') GATE.forEach(f => jobs.push({ file: f, env: GATE_ENV[f] || {} }));
if (group !== 'gate') every.filter(f => !GATE.includes(f) || GATE_ENV[f]).forEach(f => jobs.push({ file: f, env: {} }));
jobs.sort((a, b) => (SLOW_FIRST.indexOf(b.file) + 1) - (SLOW_FIRST.indexOf(a.file) + 1));

const limit = Math.max(2, +process.env.TEST_JOBS || os.cpus().length);
const timeoutMs = (+process.env.TEST_TIMEOUT_S || 600) * 1000;
const failures = [];
let next = 0, running = 0, done = 0;
const t0 = Date.now();

function runOne(job, cb) {
  const s = Date.now();
  let out = '';
  const p = spawn(process.execPath, [path.join('tests', job.file)], { cwd: root, env: Object.assign({}, process.env, job.env) });
  const timer = setTimeout(() => { out += '\nTIMED OUT\n'; p.kill('SIGKILL'); }, timeoutMs);
  p.stdout.on('data', d => { out += d; });
  p.stderr.on('data', d => { out += d; });
  p.on('close', (code, sig) => {
    clearTimeout(timer);
    const sec = ((Date.now() - s) / 1000).toFixed(1);
    const ok = code === 0;
    const label = job.file + (job.env.ELECMETRIC_ENGINE_ONLY ? ' (engine-only)' : '');
    console.log((ok ? 'PASS ' : 'FAIL ') + label.padEnd(44) + sec + 's');
    if (!ok) { failures.push(label); console.log('---- ' + label + ' (exit ' + (code === null ? sig : code) + ') ----\n' + out.split('\n').slice(-40).join('\n') + '\n----'); }
    cb();
  });
}

function pump() {
  while (running < limit && next < jobs.length) {
    running++;
    runOne(jobs[next++], () => { running--; done++; pump(); });
  }
  if (done === jobs.length) {
    console.log('\n' + (jobs.length - failures.length) + '/' + jobs.length + ' test scripts passed in ' + ((Date.now() - t0) / 1000).toFixed(0) + 's (group: ' + group + ')');
    if (failures.length) { console.log('FAILED: ' + failures.join(', ')); process.exit(1); }
  }
}
pump();
