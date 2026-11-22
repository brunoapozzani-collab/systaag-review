import {chromium} from 'playwright';import fs from 'fs';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext();const p=await ctx.newPage();
const pronto=async()=>{for(let i=0;i<240;i++){if(await p.evaluate(()=>!!window.__tRender).catch(()=>false))return;const k=await p.$('#qv0 .qv-t, #qv .qv-t');if(k){await k.click().catch(()=>{});}await p.waitForTimeout(500)}throw new Error('nao abriu')};
await p.goto('http://localhost:'+(process.env.PORTA||4101)+'/');await pronto();
const k2=await p.$('#qv .qv-t');if(k2)await k2.click().catch(()=>{});
await p.waitForTimeout(8000);
for(let i=0;i<2;i++){await p.reload();await pronto();await p.waitForTimeout(6000);}
const c=await ctx.newCDPSession(p);await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:200});await c.send('Profiler.start');
await p.reload();await pronto();
const tR=await p.evaluate(()=>Math.round(window.__tRender));
const {profile}=await c.send('Profiler.stop');
fs.writeFileSync(process.env.SAIDA||'prof.json',JSON.stringify(profile));
const dt=profile.timeDeltas,ids=profile.samples;const self=new Map();for(let i=0;i<ids.length;i++)self.set(ids[i],(self.get(ids[i])||0)+dt[i]);
const byFn=new Map(),byUrl=new Map();let tot=0;
for(const n of profile.nodes){const t=(self.get(n.id)||0)/1000;tot+=t;const u=(n.callFrame.url||'').split('/').pop().split('?')[0].slice(0,28)||'(native)';const k=n.callFrame.functionName+' @'+u+':'+n.callFrame.lineNumber;byFn.set(k,(byFn.get(k)||0)+t);byUrl.set(u,(byUrl.get(u)||0)+t)}
const top=(m,n)=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>Math.round(v)+'ms '+k).join('\n');
console.log('tRender',tR,'total sampled',Math.round(tot));console.log('--- by fn\n'+top(byFn,45));console.log('--- by file\n'+top(byUrl,40));
await b.close();
