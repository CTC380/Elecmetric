/* Tool-first layer shared by every generated page (calculator pages, hubs, conversion pages): a one-row sticky header, a calculator zone with the live result beside the form
   on wide screens, collapsed reference sections, and a global [hidden] rule. Appended after the base CSS in build_pages.js, so these rules win on equal specificity. */
'use strict';

const CSS = '[hidden]{display:none!important}' +
  /* One-row sticky header, same width as the page content */
  'header{position:sticky;top:0;z-index:30}header .w{max-width:1120px;flex-wrap:nowrap;gap:16px;padding-block:8px}header .brand{flex:0 0 auto}header::after{height:3px;background:linear-gradient(90deg,#FF7A00,#FFA43D 55%,#FFC37A)}' +
  'header nav{display:flex;gap:2px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;min-width:0}header nav::-webkit-scrollbar{display:none}header nav a{margin-left:0;padding:8px 11px;border-radius:8px;opacity:.92}header nav a:hover,header nav a:focus-visible{background:rgba(255,255,255,.14);opacity:1;outline:none}' +
  /* Calculator zone: form left, live result right (sticky), reference below at reading width */
  'main.calc{max-width:1120px;padding-top:18px}.calc h1{font-size:28px;margin-bottom:4px}.calc .lede{margin:0 0 10px;max-width:70ch}' +
  '.calc-vb{display:inline-flex;align-items:center;gap:7px;margin:0 0 14px;padding:4px 11px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font:600 12.5px var(--body);color:var(--ink);text-decoration:none}.calc-vb::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--gold)}.calc-vb:hover,.calc-vb:focus-visible{border-color:var(--gold);outline:none}' +
  '.calc #try{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(290px,1fr);gap:0 20px;align-items:start}.calc #try>h2{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;margin:0}' +
  '.calc #try>form{grid-column:1;margin:0}.calc #try>#try-out{grid-column:2;grid-row:1;position:sticky;top:64px;margin:0;flex-direction:column;align-items:stretch;gap:12px}' +
  '.calc .tgrid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));align-items:start}' +
  '.hd{margin-top:4px}.hd summary{cursor:pointer;font-size:12px;color:var(--muted);list-style:none}.hd summary::-webkit-details-marker{display:none}.hd summary::before{content:"\\24D8  "}.hd[open]{font-size:12px;line-height:1.45}.hd[open] summary{margin-bottom:3px}' +
  '.calc-limit{margin:14px 0 0;padding:10px 14px;border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:8px;background:var(--surface);font-size:14px}.calc-limit h2{font:700 13px var(--body);margin:0 0 2px;letter-spacing:0;text-transform:none}.calc-limit h2::before{display:none}.calc-limit p{margin:0}' +
  '.calc-act{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:12px 0 4px}.calc-act .btn{margin:0}.calc-act .note{margin:0;flex:1 1 340px;font-size:12px}' +
  '.calc .cref{max-width:860px;margin-top:6px}.calc .jump{position:sticky;top:52px;z-index:10;display:flex;gap:6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;background:var(--bg);padding:8px 0;margin:10px 0 4px;border-bottom:1px solid var(--line)}.calc .jump::-webkit-scrollbar{display:none}.calc .jump .chip{flex:0 0 auto;margin:0}' +
  '@media (max-width:980px){.calc #try{grid-template-columns:minmax(0,1fr)}.calc #try>#try-out{grid-column:1;grid-row:auto;position:static;margin-top:12px}}' +
  '#mini-res{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;flex-wrap:wrap;gap:2px 18px;padding:8px 16px calc(8px + env(safe-area-inset-bottom,0px));background:var(--surface);color:var(--ink);border-top:3px solid var(--gold);box-shadow:0 -8px 20px -10px rgba(5,20,50,.5);text-decoration:none}#mini-res span{display:block}#mini-res b{display:block;font:600 19px/1.2 var(--display)}#mini-res small{display:block;font-size:11px;color:var(--muted)}@media (min-width:981px){#mini-res{display:none!important}}' +
  '@media (max-width:640px){main.calc{padding-top:12px}.calc h1{font-size:24px}.calc .jump{top:0}header{position:static}header .w{flex-wrap:wrap;gap:4px 8px;padding-block:8px 4px}header nav{flex:1 1 100%;-webkit-mask-image:linear-gradient(90deg,#000 90%,transparent);mask-image:linear-gradient(90deg,#000 90%,transparent)}}';

/* A long field hint becomes a one-line "note" that opens on demand, so one wordy hint does not stretch its row of the form. */
const hintHtml = (h, esc) => !h ? '' : h.length > 90 ? '<details class="hint hd"><summary>About this value</summary>' + esc(h) + '</details>' : '<div class="hint">' + esc(h) + '</div>';

module.exports = { CSS, hintHtml };
