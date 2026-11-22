import {chromium} from 'playwright';import {cpSync,rmSync} from 'node:fs';
for(const atraso of [150,600,1300,2500]){rmSync('/tmp/h/PB1',{recursive:true,force:true});cpSync('/tmp/h/P0','/tmp/h/PB1',{recursive:true});
 const ctx=await chromium.launchPersistentContext('/tmp/h/PB1',{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1440,height:900}});const p=ctx.pages()[0]||await ctx.newPage();
 await p.goto('http://localhost:4103/');await p.waitForFunction(()=>!!window.__tRender&&document.documentElement.classList.contains('pronto127'),null,{timeout:120000});
 await p.waitForTimeout(atraso);
 const alvo=await p.evaluate((IDX)=>{const els=[...document.querySelectorAll('#main a[href^="#/"], #main [onclick*="location.hash"]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>20&&r.height>10&&r.top>60&&r.bottom<880});const e=els[IDX];if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,t:(e.getAttribute('href')||e.getAttribute('onclick')||'').slice(0,60),n:els.length}},+(process.env.IDX||0));
 if(!alvo){console.log(atraso,'sem alvo');await ctx.close();continue}
 await p.mouse.move(alvo.x,alvo.y);await p.mouse.down();await p.waitForTimeout(80);await p.mouse.up();await p.waitForTimeout(2500);
 console.log('clique',atraso,'ms depois de pronto →',alvo.t,'| hash agora',await p.evaluate(()=>location.hash),'calma',await p.evaluate(()=>JSON.stringify(window.__calma)),'E',await p.evaluate(()=>(window.__E||[]).length),'main',await p.evaluate(()=>document.getElementById('main').innerHTML.length+' '+document.title));await ctx.close()}
