import {chromium} from 'playwright';import {cpSync,rmSync} from 'node:fs';
rmSync('/tmp/h/PD',{recursive:true,force:true});cpSync('/tmp/h/P0','/tmp/h/PD',{recursive:true});
const ctx=await chromium.launchPersistentContext('/tmp/h/PD',{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1440,height:900}});
const p=ctx.pages()[0]||await ctx.newPage();
await p.goto('http://localhost:4103/');await p.waitForFunction(()=>!!window.__tRender&&document.documentElement.classList.contains('pronto127'),null,{timeout:120000});
await p.waitForTimeout(9000);
const le=()=>p.evaluate(()=>{const f=JSON.parse(localStorage.getItem('systaag_v195_t:#/home')||'null');return {pronto172:!!window.__v172pronto,v228:window.__v228||0,fp:f&&f.fp,q:f&&f.q,hoje:new Date().toDateString(),E:(window.__E||[]).length}});
console.log('antes',JSON.stringify(await le()));
// o dia vira: o relógio da página anda 26 h (Date), sem recarregar
await p.evaluate(()=>{const D=Date,salto=26*3600*1000;const N=function(...a){return a.length?new D(...a):new D(D.now()+salto)};N.now=()=>D.now()+salto;N.parse=D.parse;N.UTC=D.UTC;N.prototype=D.prototype;window.Date=N});
await p.waitForTimeout(27000);
console.log('depois',JSON.stringify(await le()));
await ctx.close();
