import {chromium} from 'playwright';import {readFileSync,writeFileSync,cpSync,rmSync} from 'node:fs';
rmSync('/tmp/h/PSW',{recursive:true,force:true});cpSync('/tmp/h/P0','/tmp/h/PSW',{recursive:true});
const ctx=await chromium.launchPersistentContext('/tmp/h/PSW',{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1440,height:900}});
const p=ctx.pages()[0]||await ctx.newPage();
const pronto=()=>p.waitForFunction(()=>!!window.__tRender&&document.documentElement.classList.contains('pronto127'),null,{timeout:120000});
const le=()=>p.evaluate(async()=>{const n=performance.getEntriesByType('navigation')[0];const c=await caches.open('systaag-entrada-1');const m=await c.match('/');const t=m?await m.text():null;const reg=await navigator.serviceWorker.getRegistration();return {pub:window.__PUBLICADO,ctrl:!!navigator.serviceWorker.controller,reg:!!reg,ativo:!!(reg&&reg.active),cache:t?t.length:0,cachePub:t?(/window\.__PUBLICADO=("[^"]*")/.exec(t)||[])[1]:null,ws:Math.round(n.workerStart),rsp:Math.round(n.responseStart),re:Math.round(n.responseEnd),src:[n.workerMatchedSourceType,n.workerFinalSourceType],tam:n.transferSize,tR:Math.round(__tRender),E:(window.__E||[]).length,rec:sessionStorage.getItem('v225:recarga')}});
for(let i=0;i<3;i++){await p.goto('http://localhost:4103/');await pronto();await p.waitForTimeout(4000);console.log('abre',i,JSON.stringify(await le()))}
// publica "versão nova": muda o __PUBLICADO do index servido
const f='/tmp/n225/dist/index.html';const orig=readFileSync(f,'utf8');writeFileSync(f,orig.replace(/window\.__PUBLICADO="[^"]*"/,'window.__PUBLICADO="NOVA-1"'));
await p.goto('http://localhost:4103/');await p.waitForTimeout(1500);await pronto();await p.waitForTimeout(4000);console.log('depois de publicar',JSON.stringify(await le()));
await p.goto('http://localhost:4103/');await pronto();await p.waitForTimeout(3000);console.log('abertura seguinte',JSON.stringify(await le()));
writeFileSync(f,orig);await ctx.close();
