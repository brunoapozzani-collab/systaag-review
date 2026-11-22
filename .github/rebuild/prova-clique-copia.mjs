import {chromium} from 'playwright';import {cpSync,rmSync} from 'node:fs';
rmSync('/tmp/h/PG',{recursive:true,force:true});cpSync('/tmp/h/P0','/tmp/h/PG',{recursive:true});
const ctx=await chromium.launchPersistentContext('/tmp/h/PG',{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1440,height:900}});const p=ctx.pages()[0]||await ctx.newPage();const pe=[];p.on('pageerror',e=>pe.push(String(e.message).slice(0,120)));
const pronto=()=>p.waitForFunction(()=>!!window.__tRender&&document.documentElement.classList.contains('pronto127'),null,{timeout:240000});
await p.goto('http://localhost:4103/');await pronto();await p.waitForTimeout(26000);
const pos=await p.evaluate(()=>{const b=[...document.querySelectorAll('#main [onclick]')].find(e=>/Visão executiva/.test(e.textContent));const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
for(const atraso of [2500,4600,5000,5600,6000,6400,6800,7500]){
 await p.goto('about:blank');p.goto('http://localhost:4103/').catch(()=>{});await new Promise(r=>setTimeout(r,atraso));
 await p.mouse.click(pos.x,pos.y);await pronto();await p.waitForTimeout(2500);
 console.log('clique aos',atraso,'ms',await p.evaluate(()=>JSON.stringify({tR:Math.round(__tRender),exata:window.__v219exata,guardado:window.__v219clique||null,log:window.__v219log||null,cal:window.__calma,rolou:Math.round((document.scrollingElement||{}).scrollTop||0)+'/'+Math.round(document.getElementById('main').scrollTop),raizTop:Math.round(document.getElementById('v130_root').getBoundingClientRect().top),E:(window.__E||[]).length})));await p.waitForTimeout(9000)}
console.log('pe',pe.slice(0,3));await ctx.close();
