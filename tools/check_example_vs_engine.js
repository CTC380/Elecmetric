const fs=require('fs'),path=require('path'),E=require(''+__dirname+'/../engine.js');
const dec=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ');
const strip=s=>dec(s.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const root=''+__dirname+'/../calculators';
const num=t=>{const m=t.replace(/[,\u202f\u00a0]/g,'').replace(/−/g,'-').match(/-?\d+(\.\d+)?(e[+-]?\d+)?/i);return m?parseFloat(m[0]):null};
const res={ok:0,nostatic:0,rej:0,mism:[],skipped:0};
for(const d of fs.readdirSync(root)){
  const f=path.join(root,d,'index.html');if(!fs.existsSync(f))continue;
  const s=fs.readFileSync(f,'utf8');
  const fm=s.match(/<form id="try-form"[\s\S]*?<\/form>/),st=s.match(/<div id="static-ans"[\s\S]*?<div class="big">([\s\S]*?)<\/div>/);
  if(!fm||!st){res.nostatic++;continue}
  const inp={};
  for(const m of fm[0].matchAll(/<input[^>]*name="([^"]+)"[^>]*value="([^"]*)"/g)){inp[m[1]]=m[2]==''?undefined:+dec(m[2]);if(isNaN(inp[m[1]]))inp[m[1]]=dec(m[2])}
  for(const m of fm[0].matchAll(/<select name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){
    const o=m[2].match(/<option([^>]*)selected([^>]*)>([^<]*)/)||m[2].match(/<option([^>]*)>([^<]*)/);
    if(!o)continue;const all=o[0];const v=all.match(/value="([^"]*)"/);const val=v?dec(v[1]):dec(o[o.length-1]);
    if(/_u$/.test(m[1])) inp[m[1].replace(/_u$/,'Unit')]=val; else inp[m[1]]=isNaN(+val)?val:+val;}
  const idm=s.match(/index\.html#([a-z0-9-]+)"[^>]*>Open in the calculator/);const eid=idm?idm[1]:d;let r;try{r=E.api(eid,inp)}catch(e){res.rej++;continue}
  if(!r.ok){res.rej++;res.mism.push([d,'rejected: '+String(JSON.stringify(r.errors||r.error||r.message||r)).slice(0,140)]);continue}
  const big=strip(st[1]);
  const bad=[];let checked=0;
  for(const k of Object.keys(r.outputs)){const o=r.outputs[k];if(typeof o.value!=='number')continue;
    const lab=o.label.replace(/\s*\([^)]*\)\s*$/,'');
    const re=new RegExp('(^|[·] )'+lab.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':','gi');const shownAll=[];let mm;while((mm=re.exec(big))){const sv=num(big.slice(mm.index+mm[0].length,mm.index+mm[0].length+40));if(sv!==null)shownAll.push(sv)}if(!shownAll.length)continue;checked++;const shown=shownAll.find(sv=>[1,1000,1e-3,100,1e6,1e-6,0.01,180/Math.PI,Math.PI/180,25.4,1/25.4,1e4,1e-4].some(sc=>Math.abs(o.value*sc-sv)<=Math.max(Math.abs(sv)*0.006,1e-9)));if(shown!==undefined)continue;const shown2=shownAll[0];
    
    // allow display scaling (%, k, m prefixes) by testing x1,x1000,x1e-3,x100
    bad.push(lab+': page '+shownAll.join('/')+' engine '+o.value);}
  if(bad.length)res.mism.push([d,bad.slice(0,3).join(' | ')]);else if(checked)res.ok++;else res.skipped++;
}
console.log(JSON.stringify({ok:res.ok,nostatic:res.nostatic,rej:res.rej,skipped:res.skipped,mism:res.mism.length}));
res.mism.slice(0,40).forEach(m=>console.log(m.join(' :: ').slice(0,260)));
