import {chromium} from 'playwright';import {writeFileSync,cpSync,rmSync} from 'node:fs';
const [,, saida, ...hashes]=process.argv;const out={};
const INIT=(await import('node:fs')).readFileSync('h.mjs','utf8').match(/const INIT=`([\s\S]*?)`;/)[1];
for(const h of hashes){rmSync('/tmp/h/PB1',{recursive:true,force:true});cpSync('/tmp/h/P0','/tmp/h/PB1',{recursive:true});
 const ctx=await chromium.launchPersistentContext('/tmp/h/PB1',{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1440,height:900}});
 await ctx.addInitScript(INIT);const p=ctx.pages()[0]||await ctx.newPage();
 await p.goto('http://localhost:4103/'+(h==='-'?'':'#/'+h));
 await p.waitForFunction(()=>!!window.__tRender&&document.documentElement.classList.contains('pronto127'),null,{timeout:120000});
 await p.waitForTimeout(12000);
 out[h]=await p.evaluate(()=>{const ord=x=>Array.isArray(x)?x.map(ord):(x&&typeof x==='object')?Object.keys(x).sort().reduce((o,k)=>(o[k]=ord(x[k]),o),{}):x;const b=document.body.cloneNode(true);b.querySelectorAll('script,#abrindo-sistema,style').forEach(e=>e.remove());
  return {hash:location.hash,body:b.innerHTML,main:document.getElementById('main').innerHTML,db:JSON.stringify(ord(S.db)),erp:localStorage.getItem('systaag_erp1z'),crm:localStorage.getItem('systaag_crm_t'),E:(window.__E||[]).slice(0,5),calma:window.__calma||null,tR:Math.round(__tRender),lt:(window.__LT||[])}});
 console.log(h,out[h].hash,'tR',out[h].tR,'body',out[h].body.length,'calma',JSON.stringify(out[h].calma),'E',out[h].E.length);await ctx.close()}
writeFileSync(saida,JSON.stringify(out));
