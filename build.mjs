/* build.mjs — cópia leve para publicar (05/11/2026)
   A fonte (index.html + v*.js) continua exatamente como está: isto roda só na publicação (Vercel) e escreve em dist/ uma cópia
   sem comentários e sem espaços — o código é o MESMO (sem renomear nada, sem "otimizar" lógica: terser com compress=false,
   mangle=false). Se algum arquivo ou bloco não puder ser aliviado, ele é copiado como está e o deploy segue. */
import {readFileSync,writeFileSync,mkdirSync,readdirSync,copyFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {minify} from 'terser';
import CleanCSS from 'clean-css';
const OUT='dist';mkdirSync(OUT,{recursive:true});
const css=new CleanCSS({level:1});
const OPT={compress:false,mangle:false,format:{comments:false,beautify:false}};
let saved=0,falhas=0;
async function js(code,nome){try{const r=await minify(code,OPT);if(r.code==null)throw new Error('sem saída');return r.code}catch(e){falhas++;console.warn('build: mantido como está →',nome,'(',String(e.message||e).slice(0,120),')');return code}}
async function html(src){
  const parts=src.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/);
  let out='',i=0;
  for(const p of parts){
    let m;
    if((m=p.match(/^(<script\b([^>]*)>)([\s\S]*?)(<\/script>)$/))){
      const attrs=m[2],body=m[3];
      const tipo=(attrs.match(/type\s*=\s*["']([^"']+)["']/)||[])[1];
      if(/\bsrc\s*=/.test(attrs)||!body.trim()||(tipo&&!/javascript|module/i.test(tipo))){out+=p;continue}
      out+=m[1]+await js(body,'index.html <script> #'+(++i))+m[4];
    }else if((m=p.match(/^(<style\b[^>]*>)([\s\S]*?)(<\/style>)$/))){
      const r=css.minify(m[2]);out+=m[1]+(r.errors.length?m[2]:r.styles)+m[3];
    }else out+=p;
  }
  return out;
}
for(const f of readdirSync('.')){
  if(['dist','node_modules','.git','build.mjs','package.json','package-lock.json','vercel.json','README.md','.gitignore','loader.html'].includes(f))continue;
  const st=statSync(f);
  if(st.isDirectory()){mkdirSync(join(OUT,f),{recursive:true});for(const g of readdirSync(f))copyFileSync(join(f,g),join(OUT,f,g));continue}
  if(f==='index.html'){const s=readFileSync(f,'utf8');let o=await html(s);
    /* 07/11/2026: cada publicação carimba os scripts locais (?v=commit) — o navegador nunca roda uma cópia velha depois de um deploy */
    const V=String(process.env.VERCEL_GIT_COMMIT_SHA||Date.now()).slice(0,10);o=o.replace(/(<script\b[^>]*\bsrc=")(v[0-9][^"?]*\.js)(?:\?[^"]*)?"/g,(m,a,b)=>a+b+'?v='+V+'"');/* 08/11/2026 (v169): o sistema é publicado como app.html; index.html passa a ser a porta de entrada (loader.html), que carrega a base
       do IndexedDB antes de escrever o sistema na página — a base sai do teto de 10 MB do localStorage */
    writeFileSync(join(OUT,'app.html'),o);const L=readFileSync('loader.html','utf8').replace("var APP='app.html'+(location.search?location.search:'');","var APP='app.html?v="+V+"';");if(!L.includes("app.html?v="))throw new Error('loader.html: âncora APP não encontrada');writeFileSync(join(OUT,'index.html'),L);saved+=s.length-o.length;console.log('index.html → app.html',s.length,'→',o.length,'· index.html = loader')}
  else if(/\.js$/.test(f)){const s=readFileSync(f,'utf8');const o=await js(s,f);writeFileSync(join(OUT,f),o);saved+=s.length-o.length}
  else copyFileSync(f,join(OUT,f));
}
console.log('build: dist/ pronto ·',Math.round(saved/1024),'KB a menos ·',falhas,'arquivo(s)/bloco(s) mantidos como estavam');
