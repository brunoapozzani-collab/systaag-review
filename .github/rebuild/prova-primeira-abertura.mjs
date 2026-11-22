import {chromium} from 'playwright';import {rmSync,mkdirSync} from 'node:fs';
const out=process.argv[2]||'/tmp/h/shots';rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});rmSync('/tmp/h/PN',{recursive:true,force:true});
const ctx=await chromium.launchPersistentContext('/tmp/h/PN',{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1100,height:700}});
const p=ctx.pages()[0]||await ctx.newPage();const cdp=await ctx.newCDPSession(p);
await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:60,downloadThroughput:(+process.argv[3]||8)*125000,uploadThroughput:1e6});
const t0=Date.now();p.goto('http://localhost:4103/').catch(()=>{});
let escolheu=false;
for(let i=0;i<(+process.argv[4]||40);i++){await new Promise(r=>setTimeout(r,700));const t=((Date.now()-t0)/1000).toFixed(1);
  try{await p.screenshot({path:out+'/'+String(i).padStart(2,'0')+'_'+t+'.png',timeout:5000})}catch(e){}
  let st='';try{st=await p.evaluate(()=>{const a=document.getElementById('abrindo-sistema'),l=document.getElementById('ld'),q=document.getElementById('qv0');const tx=e=>e?(e.innerText||'').replace(/\s+/g,' ').slice(0,90):'';return JSON.stringify({ld:l?tx(l):null,qv:!!q,abr:a?tx(a):null,foto:!!(a&&a.querySelector('.v196h')),pronto:!!window.__tRender})},null,{timeout:3000})}catch(e){st='ocupado'}
  console.log(t,st);
  if(!escolheu){try{const b=await p.$('#qv0 .qv-t');if(b){await b.click({timeout:1000});escolheu=true;console.log(t,'escolheu')}}catch(e){}}
  if(/"pronto":true/.test(st)&&!/"abr":"/.test(st))break}
await ctx.close();
