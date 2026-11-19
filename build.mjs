/* build.mjs — cópia leve para publicar (05/11/2026)
   A fonte (index.html + v*.js) continua exatamente como está: isto roda só na publicação (Vercel) e escreve em dist/ uma cópia
   sem comentários e sem espaços — o código é o MESMO (sem renomear nada, sem "otimizar" lógica: terser com compress=false,
   mangle=false). Se algum arquivo ou bloco não puder ser aliviado, ele é copiado como está e o deploy segue. */
import {readFileSync,writeFileSync,mkdirSync,readdirSync,copyFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {minify} from 'terser';
import CleanCSS from 'clean-css';
const OUT='dist';mkdirSync(OUT,{recursive:true});
const css=new CleanCSS({level:1});
const OPT={compress:false,mangle:false,format:{comments:false,beautify:false}};
let saved=0,falhas=0;
async function js(code,nome){try{const r=await minify(code,OPT);if(r.code==null)throw new Error('sem saída');return r.code}catch(e){falhas++;console.warn('build: mantido como está →',nome,'(',String(e.message||e).slice(0,120),')');return code}}
/* ───── 18/11/2026 (rápido 3) — ABRIR RÁPIDO ─────
   Nada da fonte muda; só a forma de entregar:
   1. cada arquivo de código é carimbado com a impressão digital do SEU conteúdo (?v=…) e pode ficar guardado no navegador
      "para sempre" (vercel.json: immutable quando há ?v=). Arquivo que não mudou entre publicações não é baixado de novo.
   2. os blocos grandes de código e de estilo que viviam dentro do index.html saem para arquivos próprios (dist/app/…),
      na MESMA posição e na MESMA ordem — o app.html encolhe e cada bloco fica guardado no navegador.
   3. a porta de entrada (index.html = loader.html) já manda baixar tudo em paralelo, antes de o app.html chegar.
   4. uma foto da nuvem (a tabela inteira, conferida pela contagem) é publicada como um arquivo só, para o computador
      novo não precisar de 15 pedidos em fila. Se a foto falhar, a publicação segue sem ela.
   Qualquer passo que não der certo é deixado como estava (o bloco fica dentro do app.html, o arquivo é copiado igual). */
const dig=(x)=>createHash('sha256').update(x).digest('hex').slice(0,12);
const MIN_BLOCO=8000;            /* blocos menores que isto ficam dentro do app.html */
const selo={};                   /* arquivo publicado → impressão digital do conteúdo publicado */
const pre=[];                    /* o que a porta de entrada manda baixar já: [href, tipo] na ordem da página */
function publica(nome,conteudo){writeFileSync(join(OUT,nome),conteudo);selo[nome]=dig(conteudo);return nome+'?v='+selo[nome]}
mkdirSync(join(OUT,'app'),{recursive:true});
let extraidos=0;
/* 18/11/2026 (rápido 3b): enquanto o navegador monta o sistema (centenas de blocos de código, um atrás do outro), a página
   ficava BRANCA por 5–10 s. Agora a mesma tela "taag · Abrindo o sistema…" da porta de entrada continua na frente até o
   sistema se dar por pronto (a marca pronto127 da v127) — só aparência: nada do sistema muda, e ela sai sozinha (ou em 30 s, no máximo). */
let telaPosta=false;
const TELA='<div id="abrindo-sistema" style="visibility:visible!important;position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#f4f5f7;color:#1f2430;font:600 15px/1.4 &quot;Plus Jakarta Sans&quot;,system-ui,-apple-system,sans-serif;transition:opacity .25s ease"><div style="font:300 44px/1 &quot;Plus Jakarta Sans&quot;,system-ui,sans-serif;letter-spacing:.06em">taag</div><div style="opacity:.6;font-weight:500">Abrindo o sistema…</div><div style="width:160px;height:4px;border-radius:999px;background:rgba(0,0,0,.08);overflow:hidden"><i style="display:block;height:100%;width:40%;background:#1f2430;border-radius:999px;animation:abrindo-sistema 1.1s ease-in-out infinite"></i></div><style>@keyframes abrindo-sistema{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}#boot127{display:none!important}</style></div><script>(function(){var el=document.getElementById("abrindo-sistema"),H=document.documentElement;function some(){if(!el)return;var e=el;el=null;e.style.opacity="0";e.style.pointerEvents="none";setTimeout(function(){try{e.remove()}catch(x){}},280)}window.__abrindoSome=some;/* sai quando o sistema se dá por pronto (a mesma marca da tela de abertura antiga, v127) */try{new MutationObserver(function(){if(H.classList.contains("pronto127"))some()}).observe(H,{attributes:true,attributeFilter:["class"]})}catch(x){window.addEventListener("load",function(){setTimeout(some,400)})}setTimeout(some,30000)})();</script><!--ABRINDO-->';
async function html(src){
  const parts=src.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/);
  let out='',i=0;
  for(const p of parts){
    let m;
    if((m=p.match(/^(<script\b([^>]*)>)([\s\S]*?)(<\/script>)$/))){
      const attrs=m[2],body=m[3];
      const tipo=(attrs.match(/type\s*=\s*["']([^"']+)["']/)||[])[1];
      if(/\bsrc\s*=/.test(attrs)||!body.trim()||(tipo&&!/javascript|module/i.test(tipo))){out+=p;continue}
      const cod=await js(body,'index.html <script> #'+(++i));
      /* só sai para arquivo o <script> clássico simples (sem type/async/defer) — o comportamento é idêntico ao do bloco na página */
      if(cod.length>=MIN_BLOCO&&!tipo&&!/\b(async|defer|nomodule|src)\b/i.test(attrs)&&!/<\/script/i.test(cod)){
        const href=publica('app/'+dig(cod)+'.js',cod);pre.push([href,'script']);extraidos++;
        out+='<script'+attrs+' src="'+href+'"></script>';
      }else out+=m[1]+cod+m[4];
    }else if((m=p.match(/^(<style\b([^>]*)>)([\s\S]*?)(<\/style>)$/))){
      const r=css.minify(m[3]);const est=r.errors.length?m[3]:r.styles;
      /* estilo grande sem atributos e sem endereços relativos (url(...) que não seja data:) → arquivo próprio, na mesma posição */
      const rel=(est.match(/url\(\s*["']?(?!data:|https?:|\/\/|#)/gi)||[]).length;
      if(est.length>=50000&&!m[2].trim()&&!rel&&!/@import/i.test(est)){
        const href=publica('app/'+dig(est)+'.css',est);pre.push([href,'style']);extraidos++;
        out+='<link rel="stylesheet" href="'+href+'">';
      }else out+=m[1]+est+m[4];
    }else if(!telaPosta&&/<body\b[^>]*>/i.test(p)){telaPosta=true;out+=p.replace(/<body\b[^>]*>/i,(b)=>b+TELA)}
    else out+=p;
  }
  return out;
}
/* a foto da nuvem: a tabela inteira lida por chave (não pula registro), conferida pela contagem antes e depois */
async function fotoDaNuvem(){
  try{
    const cfg=readFileSync('nuvem-config.js','utf8');const url=(cfg.match(/url:'([^']+)'/)||[])[1],key=(cfg.match(/key:'([^']+)'/)||[])[1];
    if(!url||!key||process.env.SEM_FOTO){console.log('foto: sem configuração — publicação sem foto');return null}
    const B=url+'/rest/v1/crm_registros',H={apikey:key,Authorization:'Bearer '+key};
    const asp=(v)=>'"'+String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
    const pede=async(u,h)=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),60000);try{const r=await fetch(u,{headers:{...H,...(h||{})},signal:c.signal});if(!r.ok&&r.status!==206)throw new Error(r.status+' '+(await r.text()).slice(0,160));return r}finally{clearTimeout(t)}};
    const conta=async()=>{const r=await pede(B+'?select=id&limit=1',{Prefer:'count=exact'});const m=/\/(\d+)\s*$/.exec(r.headers.get('content-range')||'');if(!m)throw new Error('sem total');return +m[1]};
    const le=async()=>{const mapa=new Map();let cur=null;for(let n=0;n<400;n++){let u=B+'?select=*&order=atualizado_em.asc,tabela.asc,id.asc&limit=1000';
        if(cur){const T=asp(cur.atualizado_em),X=asp(cur.tabela),Y=asp(cur.id);u+='&or='+encodeURIComponent('(atualizado_em.gt.'+T+',and(atualizado_em.eq.'+T+',tabela.gt.'+X+'),and(atualizado_em.eq.'+T+',tabela.eq.'+X+',id.gt.'+Y+'))')}
        const j=await (await pede(u)).json();if(!Array.isArray(j))throw new Error('resposta inesperada');for(const r of j){if(!r.atualizado_em||!(Date.parse(r.atualizado_em)>0))throw new Error('registro sem data');mapa.set(r.tabela+'\u0001'+r.id,r)}
        if(j.length<1000)return mapa;cur=j[j.length-1]}throw new Error('leitura longa demais')};
    for(let tent=1;tent<=3;tent++){
      const antes=await conta();const mapa=await le();const depois=await conta();
      if(antes===depois&&mapa.size===depois&&mapa.size>0){
        const regs=[...mapa.values()];const corpo=JSON.stringify({gerada:new Date().toISOString(),n:regs.length,regs});
        const href=publica('foto-'+dig(corpo)+'.json',corpo);console.log('foto: '+regs.length+' registros = nuvem ·',Math.round(corpo.length/1048576*10)/10,'MB ·',href);
        return {url:href,n:regs.length};
      }
      console.warn('foto: contagem não bateu (tentativa '+tent+'): antes',antes,'lidos',mapa.size,'depois',depois);
    }
    console.warn('foto: não deu para tirar uma foto conferida — publicação sem foto');return null;
  }catch(e){console.warn('foto: falhou — publicação sem foto (',String(e&&e.message||e).slice(0,200),')');return null}
}
/* primeiro os arquivos soltos (para o index.html poder carimbar cada um com a impressão digital dele) */
const SKIP=['dist','node_modules','.git','.github','api','build.mjs','package.json','package-lock.json','vercel.json','README.md','.gitignore','loader.html','index.html'];
for(const f of readdirSync('.')){
  if(SKIP.includes(f))continue;
  const st=statSync(f);
  if(st.isDirectory()){mkdirSync(join(OUT,f),{recursive:true});for(const g of readdirSync(f))copyFileSync(join(f,g),join(OUT,f,g));continue}
  if(/\.js$/.test(f)){const s=readFileSync(f,'utf8');const o=await js(s,f);publica(f,o);saved+=s.length-o.length}
  else copyFileSync(f,join(OUT,f));
}
{
  const s=readFileSync('index.html','utf8');let o=await html(s);
  /* cada <script src> local leva a impressão digital do arquivo publicado (antes: o commit — tudo era baixado de novo a cada publicação) */
  const V=String(process.env.VERCEL_GIT_COMMIT_SHA||Date.now()).slice(0,10);
  o=o.replace(/(<script\b[^>]*\bsrc=")([A-Za-z0-9_.-]+\.js)(?:\?[^"]*)?"/g,(m,a,b)=>{if(!selo[b])return a+b+'?v='+V+'"';pre.push([b+'?v='+selo[b],'script']);return a+b+'?v='+selo[b]+'"'});
  /* 08/11/2026 (v169): o sistema é publicado como app.html; index.html é a porta de entrada (loader.html) */
  const app=publica('app.html',o);
  const foto=await fotoDaNuvem();
  let L=readFileSync('loader.html','utf8');
  const anc="var APP='app.html'+(location.search?location.search:'');";
  if(!L.includes(anc))throw new Error('loader.html: âncora APP não encontrada');
  L=L.replace(anc,"var APP='"+app+"';");
  /* a porta de entrada manda baixar já, em paralelo, tudo o que o app.html vai pedir (na ordem da página) */
  const vistos=new Set();const links=pre.filter(([h])=>!vistos.has(h)&&vistos.add(h)).map(([h,t])=>'<link rel="preload" as="'+t+'" href="'+h+'">').join('');
  const cab='<!--PRECARGA-->';if(!L.includes(cab))throw new Error('loader.html: âncora PRECARGA não encontrada');
  L=L.replace(cab,'<link rel="preconnect" href="'+((readFileSync('nuvem-config.js','utf8').match(/url:'([^']+)'/)||[])[1]||'')+'" crossorigin><script>window.__FOTO='+JSON.stringify(foto)+';window.__PUBLICADO='+JSON.stringify(V)+'</script>'+links);
  L=L.replace(/(<script\b[^>]*\bsrc=")([A-Za-z0-9_.-]+\.js)(?:\?[^"]*)?"/g,(m,a,b)=>selo[b]?a+b+'?v='+selo[b]+'"':m);
  writeFileSync(join(OUT,'index.html'),L);saved+=s.length-o.length;
  console.log('index.html → app.html',s.length,'→',o.length,'·',extraidos,'blocos em arquivos próprios ·',vistos.size,'pré-cargas · index.html = loader');
}
console.log('build: dist/ pronto ·',Math.round(saved/1024),'KB a menos ·',falhas,'arquivo(s)/bloco(s) mantidos como estavam');
