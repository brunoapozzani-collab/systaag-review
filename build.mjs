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
/* v196 (21/11/2026): o script da tela de abertura mora em v195-tela.js (foto do Início + barra pelo tempo esperado) */
const TELA_JS=(await minify(readFileSync('v195-tela.js','utf8'),{compress:false,mangle:false,format:{comments:false}})).code.replace(/<\/script/gi,'<\\/script');
const TELA='<div id="abrindo-sistema" style="visibility:visible!important;position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#f4f5f7;color:#1f2430;font:600 15px/1.4 &quot;Plus Jakarta Sans&quot;,system-ui,-apple-system,sans-serif;transition:opacity .25s ease"><div style="font:300 44px/1 &quot;Plus Jakarta Sans&quot;,system-ui,sans-serif;letter-spacing:.06em">taag</div><div style="opacity:.6;font-weight:500">Quase pronto — montando as telas…</div><div style="width:160px;height:4px;border-radius:999px;background:rgba(0,0,0,.08);overflow:hidden"><i style="display:block;height:100%;width:40%;background:#1f2430;border-radius:999px;animation:abrindo-sistema 1.1s ease-in-out infinite"></i></div><style>@keyframes abrindo-sistema{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}#boot127{display:none!important}</style></div><script>'+TELA_JS+'</script><!--ABRINDO-->';
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
let FOTO_REGS=null;
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
        FOTO_REGS=regs;return {url:href,n:regs.length};
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
  let s=readFileSync('index.html','utf8');
  /* v195 (21/11/2026): a camada "abrir já" entra logo depois da v194 (a fonte index.html não muda) */
  if(!/v195-abrir-ja\.js/.test(s)){const t='<script src="v194-pessoas-editor.js"></script>';if(s.includes(t))s=s.replace(t,t+'<script src="v195-abrir-ja.js"></script>');else console.warn('v195: âncora v194 não encontrada — publicado sem a camada')}
  /* v199 — MONTAGEM SEM REDESENHOS (Bruno, 21/11/2026: "ainda parece lento"): durante a montagem, as ~200 camadas mandam redesenhar a tela dezenas de vezes;
     aqui o redesenho fica suspenso até a última camada e acontece UMA vez no fim. */
  /* 21/11/2026: conferido em cópia só-leitura — 206 telas idênticas à versão anterior, 0 erros; as camadas terminam em ~3,3 s (antes ~5,8 s) */
  /* v208 — MONTAGEM SEM TRABALHO REPETIDO (22/11/2026). Medido: durante a montagem as camadas chamam render() e save() dezenas de vezes e cada
     chamada refaz varreduras inteiras (parceiros, vínculos, cópias) — a v199 só suspendia o desenho final (renderMain), não esse trabalho.
     Aqui render e save passam a ser portas: enquanto window.__BOOT estiver ligado, a chamada só fica anotada; no fim acontece UM save e UM render.
     As duas declarações do núcleo viram atribuições para que a porta (um acessor em window) continue valendo quando as camadas embrulham a função. */
  if(!process.env.SEM_BOOT1&&!process.env.SEM_BOOT2){
    const mS="function save(){try{localStorage.setItem('systaag_erp1',JSON.stringify(S.db))}catch(e){}}",mR='function render(){renderNav();renderMain()}';
    const iS=s.indexOf(mS),iR=s.indexOf(mR);const i0=iS<0?-1:s.lastIndexOf('<script>',iS);
    if(iS>0&&iR>iS&&i0>0&&s.indexOf(mS,iS+1)<0&&s.indexOf(mR,iR+1)<0){
      s=s.slice(0,iR)+'render=function(){renderNav();renderMain()};'+s.slice(iR+mR.length);
      s=s.slice(0,iS)+"save=function(){try{localStorage.setItem('systaag_erp1',JSON.stringify(S.db))}catch(e){}};"+s.slice(iS+mS.length);
      const porta='<script>(function(){window.__BOOT=1;var P=window.__bootP={render:0,save:0};function porta(n){var cur;function tr(f){if(typeof f!=="function"||f.__b208)return f;var t=function(){if(window.__BOOT){P[n]++;return}return f.apply(this,arguments)};t.__b208=1;return t}/* não configurável: a v153 tenta pôr o acessor dela em save e, como hoje (declaração de função), cai no embrulho simples */Object.defineProperty(window,n,{configurable:false,enumerable:true,get:function(){return cur},set:function(f){cur=tr(f)}})}porta("render");porta("save")})();</script>';
      s=s.slice(0,i0)+porta+s.slice(i0);console.log('boot2: render e save viram portas durante a montagem')}
    else console.warn('boot2: marcas não encontradas — publicado sem a v208')}
  /* v212a — IMPORTAÇÕES DE FÁBRICA NÃO SE REPETEM QUANDO HÁ BASE GRAVADA (22/11/2026). Medido no Mac do Bruno: a cada abertura ~0,2 s iam para
     importar os kits e casar produtos sobre a base de fábrica — trabalho jogado fora logo depois, quando a base gravada entra (linha ~7790).
     Com base gravada, essas duas importações são puladas. Se a gravada não puder ser lida, a página recarrega uma vez sem o atalho. */
  if(!process.env.SEM_BOOT1&&!process.env.SEM_BOOT2&&!process.env.SEM_BOOT3){
    const m1='if(S.db.kits55_done)return;',m2="(S.db.kits||[]).forEach(k=>{k.itens=(k.itens||[]).map(it=>{if(it.produto_id&&get('produtos',it.produto_id))return it;const p=findProd(it.nome);",m3="if(db&&db.obras){S.db=db}}}}catch(e){console.error('COP load',e)}";
    const iP=s.indexOf('<script>(function(){window.__BOOT=1;');
    if(s.split(m1).length===2&&s.split(m2).length===2&&s.split(m3).length===2&&iP>0){
      s=s.replace(m1,'if(S.db.kits55_done||window.__gravada)return;');
      s=s.replace(m2,"(window.__gravada?[]:S.db.kits||[]).forEach(k=>{k.itens=(k.itens||[]).map(it=>{if(it.produto_id&&get('produtos',it.produto_id))return it;const p=findProd(it.nome);");
      s=s.replace(m3,"if(db&&db.obras){S.db=db;window.__gravadaOk=1}}}}catch(e){console.error('COP load',e)}try{performance.mark('A:base')}catch(e){}if(window.__gravada&&!window.__gravadaOk){let ok=false;try{sessionStorage.setItem('__semAtalho','1');ok=sessionStorage.getItem('__semAtalho')==='1'}catch(e){}if(ok){location.reload();return}}");
      s=s.slice(0,iP)+"<script>try{var __z=localStorage.getItem('systaag_erp1z');window.__gravada=!!(__z&&__z.length>50000)&&!sessionStorage.getItem('__semAtalho');__z=null}catch(e){window.__gravada=false}</script>"+s.slice(iP);
      console.log('boot3: importações de fábrica puladas quando há base gravada')}
    else console.warn('boot3: marcas não encontradas — publicado sem a v212a',s.split(m1).length,s.split(m2).length,s.split(m3).length)}
  /* v212b — A GRAVAÇÃO DO FIM DA MONTAGEM VAI PARA DEPOIS DE A TELA APARECER (22/11/2026): desenha, o navegador pinta, e só então grava. */
  /* v224 (22/11/2026) — A BASE JÁ DESEMBRULHADA. Medido no Mac do Bruno: desembrulhar a base gravada (1,2 M → 14 M de letras)
     custa 120–148 ms em toda abertura; ler do IndexedDB o texto já desembrulhado custa 7 ms. A porta de entrada guarda, à parte
     (banco "systaag_cache"), o par {z: a base embrulhada, j: o mesmo texto desembrulhado}; ao abrir, o par só é usado se z for
     EXATAMENTE igual (comparação letra a letra) à base gravada — senão desembrulha como sempre. A base continua uma só. */
  if(!process.env.SEM_V224){
    const m='const j=LZString.decompressFromUTF16(z);if(j){const db=JSON.parse(j);if(db&&db.obras){S.db=db';
    if(s.split(m).length===2){s=s.replace(m,'const __c=window.__baseJ;window.__baseJ=null;const __u=!!(__c&&__c.z===z&&typeof __c.j==="string");window.__v224=__u?1:0;const j=__u?__c.j:LZString.decompressFromUTF16(z);if(j&&!__u)window.__baseJ0={z:z,j:j};if(j){const db=JSON.parse(j);if(db&&db.obras){S.db=db');console.log('v224: base já desembrulhada (quando o par guardado confere)')}
    else console.warn('v224: marca não encontrada — publicado sem a v224')}
  const SAVE_DEPOIS=!process.env.SEM_BOOT1&&!process.env.SEM_BOOT2&&!process.env.SEM_BOOT4;
  /* v216 — TELA CLIENTES · OBRAS · PROPOSTAS (22/11/2026). Medido no Mac do Bruno: 5,9 s para desenhar; 4,9 s eram uma única conta repetida —
     para CADA proposta e CADA obra, a lista inteira de clientes era percorrida de novo para achar o cliente da proposta (1.374 × 486 × 1.065).
     O cliente da proposta passa a ser achado uma vez por proposta. O resultado é o mesmo, letra por letra. */
  {const m="S.db.obras.filter(o=>o.id===p.obra_id||o.cliente_id===(S.db.clientes.find(c=>c.sigla===p.sigla)||{}).id)";
    if(s.split(m).length===2){s=s.replace(m,"(cid=>S.db.obras.filter(o=>o.id===p.obra_id||o.cliente_id===cid))((S.db.clientes.find(c=>c.sigla===p.sigla)||{}).id)");const m2="${get('clientes',o.cliente_id)?.sigla} · ${o.nome}</option>`)",m3="function arvoreHtml(){const q=";
      /* e a sigla do cliente de cada obra da lista "mover para outra obra" é lida uma vez por cliente em cada desenho */
      if(s.split(m2).length===2&&s.split(m3).length===2){s=s.replace(m2,"${__sg(o.cliente_id)} · ${o.nome}</option>`)").replace(m3,"function arvoreHtml(){const __SG=new Map(),__sg=id=>{if(!__SG.has(id))__SG.set(id,get('clientes',id)?.sigla);return __SG.get(id)};const q=")}
      else console.warn('v216b: trecho não encontrado');
      console.log('v216: cliente da proposta achado uma vez por proposta')}
    else console.warn('v216: trecho não encontrado — publicado sem a v216')}
  /* v217 — ÍNDICES DE UM DESENHO (22/11/2026). Medido no Mac do Bruno (Início): um terço do desenho era prodInv percorrendo TODAS as unidades
     e TODAS as linhas do motor do Estoque para CADA produto, e 17% era propsDaObra percorrendo TODAS as propostas para CADA obra.
     As duas buscas passam a usar um índice montado uma vez (unidades por produto, linhas por produto, propostas por obra), válido só dentro do
     mesmo instante — a mesma regra da v153: cai a cada gravação, a cada instante novo e sempre que a lista muda de tamanho. Mesma ordem, mesmos itens. */
  if(!process.env.SEM_IX){
    const p1="prodInv=(pid,inv)=>{const c=Q.compute();const rows=c.rows.filter(r=>r.pid===pid&&(!inv||invDe(r.pr)===inv));const livre=S.db.unidades.filter(u=>u.produto_id===pid&&u.estado!=='baixado'&&bucketOf(u)==='livre'";
    const p2="const propsDaObra = oid => S.db.propostas.filter(p => p.obra_id === oid);";
    /* v220: unidades de uma proposta por índice — o selo "separação" do menu percorria TODAS as unidades para CADA proposta (112 ms a cada desenho de qualquer tela) */
    const p3="unidadesDe:pr=>S.db.unidades.filter(u=>u.proposta_id===pr)";
    const iP=s.indexOf('<script>(function(){window.__BOOT=1;');
    if(s.split(p1).length===3&&s.split(p2).length===2&&s.split(p3).length===2&&iP>0){
      s=s.replace(p3,"unidadesDe:pr=>__ixUP(pr)");
      s=s.split(p1).join("prodInv=(pid,inv)=>{const c=Q.compute();const rows=__ixR(c,pid).filter(r=>(!inv||invDe(r.pr)===inv));const livre=__ixU(pid).filter(u=>u.estado!=='baixado'&&bucketOf(u)==='livre'");
      s=s.replace(p2,"const propsDaObra = oid => __ixP(oid);");
      const ix='<script>(function(){var t=null,qA=null,qL=0,qS="",qM=null,uA=null,uL=0,uS="",uM=null,pA=null,pL=0,pS="",pM=null,W=new WeakMap();function arma(){if(t)return;t=setTimeout(function(){t=null;uA=pA=qA=null},0)}function st(){try{return window.__v153_stamp?String(__v153_stamp()):"x"+Math.random()}catch(e){return "x"+Math.random()}}function monta(a,campo){var m=new Map();for(var i=0;i<a.length;i++){var x=a[i],k=x[campo],l=m.get(k);if(!l)m.set(k,l=[]);l.push(x)}return m}window.__ixU=function(pid){var a=S.db.unidades,s=st();if(a!==uA||a.length!==uL||s!==uS){uM=monta(a,"produto_id");uA=a;uL=a.length;uS=s;arma()}return pid!==pid?[]:(uM.get(pid)||[])};window.__ixUP=function(pr){var a=S.db.unidades,s=st();if(a!==qA||a.length!==qL||s!==qS){qM=monta(a,"proposta_id");qA=a;qL=a.length;qS=s;arma()}return pr!==pr?[]:(qM.get(pr)||[]).slice()};window.__ixP=function(oid){var a=S.db.propostas,s=st();if(a!==pA||a.length!==pL||s!==pS){pM=monta(a,"obra_id");pA=a;pL=a.length;pS=s;arma()}return oid!==oid?[]:(pM.get(oid)||[]).slice()};window.__ixR=function(c,pid){var r=c.rows,m=W.get(c);if(!m||m.r!==r||m.n!==r.length){m={r:r,n:r.length,m:monta(r,"pid")};W.set(c,m)}return pid!==pid?[]:(m.m.get(pid)||[])}})();</script>';
      s=s.slice(0,iP)+ix+s.slice(iP);console.log('v217: índices de um desenho (unidades/linhas por produto, propostas por obra)')}
    else console.warn('v217: trechos não encontrados — publicado sem a v217',s.split(p1).length,s.split(p2).length)}
  /* v222 — ao abrir com base gravada, a sincronização "uma obra" do núcleo não roda na carga: a base em repouso já está sincronizada e a gravação do fim da montagem repete-a */
  {const m="busy = true; try { const m = sync(); try { if (window.PARC_SYNC";
    if(!process.env.SEM_V222&&s.split(m).length===2){s=s.replace(m,"busy = true; try { const m = (window.__BOOT&&window.__gravada)?[]:sync(); try { if (window.PARC_SYNC");console.log('v222: sincronizações da carga puladas com base gravada')}
    else console.warn('v222: trecho não encontrado')}
  if(!process.env.SEM_BOOT1){
    const marca=/render=function\(\)\{renderNav\(\);renderMain\(\)\};/.test(s)?'render=function(){renderNav();renderMain()};':'function render(){renderNav();renderMain()}';const i=s.indexOf(marca);const j=i<0?-1:s.indexOf('</script>',i);
    if(j>0){s=s.slice(0,j+9)+'<script>(function(){var rm=renderMain;window.__BOOT=1;window.__bootN=0;window.__E=[];window.addEventListener("error",function(e){__E.push(String(e.message)+" @"+String(e.filename).split("/").pop().split("?")[0]+":"+e.lineno)});renderMain=function(){if(window.__BOOT){window.__bootN++;return}return rm.apply(this,arguments)};})();</script>'+s.slice(j+9);
      const k=s.lastIndexOf('</body>');s=s.slice(0,k)+'<script>window.__BOOT=0;window.__tFim=performance.now();'+(SAVE_DEPOIS?'':'try{if(window.__bootP&&__bootP.save)save()}catch(e){__E.push("save final: "+e.message)}')+'try{var __d=Object.getOwnPropertyDescriptor(window,"render"),__d2=Object.getOwnPropertyDescriptor(window,"save");if(window.__bootP&&(!__d.get||!__d2.get))__E.push("v208: porta perdida")}catch(e){}try{render()}catch(e){__E.push("render final: "+e.message)}window.__tRender=performance.now();/* v223: a cópia local da nuvem só é lida agora, depois de a tela pintar */try{requestAnimationFrame(function(){setTimeout(function(){try{if(window.__espelhoVai)window.__espelhoVai()}catch(e){}},0)})}catch(e){}/* v224: se a base teve de ser desembrulhada nesta abertura, o par é guardado depois (só se a base gravada ainda for a mesma) */setTimeout(function(){try{var c=window.__baseJ0;window.__baseJ0=null;if(c&&window.__cacheBase&&!window.__TREINO&&localStorage.getItem("systaag_erp1z")===c.z)(window.requestIdleCallback||setTimeout)(function(){window.__cacheBase(c.z,c.j)})}catch(e){}},6000);'+(process.env.SEM_CALMA?'':'(function(){/* v213 — os redesenhos pedidos por temporizadores das camadas logo depois de abrir (4 seguidos, ~1 s de tela presa) viram UM: ficam anotados durante 1,4 s ou até o primeiro toque/tecla, e então acontece um só */var rm=window.renderMain,rr=window.render,pend=0,calma=true,n=0,ultH=location.hash;if(typeof rm!=="function"||typeof rr!=="function")return;/* só quando a abertura é no Início: em Financeiro › Hoje e Comercial › Gestão as camadas dependem da sequência de redesenhos (conferido: ficam diferentes) *//* uma rolagem suave pedida há pouco (ex.: botão Visão executiva) é retomada depois de um redesenho, que a cancelaria */var ultRol=null,siv=Element.prototype.scrollIntoView;try{Element.prototype.scrollIntoView=function(a){try{if(this.id)ultRol={id:this.id,a:a,t:performance.now()}}catch(e){}return siv.apply(this,arguments)}}catch(e){}function volta(){try{if(ultRol&&performance.now()-ultRol.t<1600){var e=document.getElementById(ultRol.id);if(e){siv.call(e,ultRol.a);return true}}}catch(e){}return false}var soInicio=/^(#\\/?(home)?)?$/.test(location.hash);var baixo=false,quer=false;function solta(larga){if(!calma)return;if(baixo&&!larga){quer=true;return}calma=false;window.__calma={pedidos:n,quando:performance.now()};if(pend){var p=pend;pend=0;/* v219: o redesenho pendente não desfaz a rolagem (ex.: o botão Visão executiva rola a página) */var se=document.scrollingElement,sy=se?se.scrollTop:0,mm=document.getElementById("main"),my=mm?mm.scrollTop:0;try{(p&2?rr:rm)()}catch(e){__E.push("v213: "+e.message)}try{if(volta())return;if(se&&sy&&se.scrollTop!==sy)se.scrollTop=sy;mm=document.getElementById("main");if(mm&&my&&mm.scrollTop!==my)mm.scrollTop=my}catch(e){}}}function emb(f,bit){var w=function(){if(calma){pend|=bit;n++;return}pend=0;/* v219: redesenhar a MESMA tela não joga a página de volta para o topo */var se=document.scrollingElement,sy=se?se.scrollTop:0,h=location.hash,mesma=h===ultH;ultH=h;var r=f.apply(this,arguments);try{if(mesma){if(!volta()&&se&&sy>0&&se.scrollTop<sy)se.scrollTop=sy}}catch(e){}return r};try{Object.keys(f).forEach(function(k){w[k]=f[k]})}catch(e){}return w}window.renderMain=emb(rm,1);window.render=emb(rr,2);/* v214: nunca redesenha entre o apertar e o soltar do clique (o clique se perderia): o redesenho pendente acontece logo DEPOIS de o clique ser entregue; ao trocar de tela, o pendente é descartado (a própria troca desenha) */addEventListener("pointerdown",function(){baixo=true},true);/* v215: entre o soltar e a entrega do clique também não (com a página ocupada, o clique pode chegar bem depois do soltar) */addEventListener("pointerup",function(){if(calma&&baixo)setTimeout(function(){baixo=false;solta(1)},450)},true);addEventListener("pointercancel",function(){baixo=false;if(quer)setTimeout(function(){solta(1)},0)},true);addEventListener("click",function(){if(calma)setTimeout(function(){baixo=false;solta(1)},700)},true);addEventListener("keydown",function(){if(calma)setTimeout(function(){solta(1)},0)},true);addEventListener("hashchange",function(){if(!calma)return;calma=false;window.__calma={pedidos:n,quando:performance.now(),troca:1};setTimeout(function(){if(pend){var p=pend;pend=0;try{(p&2?rr:rm)()}catch(e){__E.push("v214: "+e.message)}}},0)},true);if(!soInicio){calma=false;window.__calma={pedidos:0,quando:performance.now(),fora:1}}setTimeout(solta,1400);/* teto: aconteça o que acontecer, a espera acaba */setTimeout(function(){baixo=false;solta(1)},4000)})();')+''+(SAVE_DEPOIS?'if(window.__bootP&&__bootP.save){(function(){var f=0,g=function(){if(f)return;f=1;try{save()}catch(e){__E.push("save final: "+e.message)}window.__tSave=performance.now()};try{requestAnimationFrame(function(){setTimeout(g,0)})}catch(e){}setTimeout(g,400)})()}':'')+'/* o sistema já está desenhado: a tela de abertura sai agora (não espera mais o evento load + 300 ms) */try{document.documentElement.classList.add("pronto127")}catch(e){}</script>'+s.slice(k);console.log('boot1: redesenho suspenso durante a montagem')}
    else console.warn('boot1: marca não encontrada')}
  let o=await html(s);
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
  /* v195 (21/11/2026): a lista do "Quem é você?" publicada junto com o site — o computador novo vê-a na hora.
     A regra é a MESMA função da v195 (QUEM0_CALC), lida daqui; se algo falhar, publica sem lista (a v166 pergunta como antes). */
  let quem0=null;
  try{if(FOTO_REGS){const vm=await import('node:vm');const ctx={window:{}};vm.runInNewContext(readFileSync('v195-abrir-ja.js','utf8'),ctx);
    const viva=(t)=>FOTO_REGS.filter(r=>r.tabela===t&&!r.apagado&&r.dados).map(r=>r.dados);
    quem0=ctx.window.QUEM0_CALC(viva('base:usuarios'),viva('base:pessoas'));console.log('quem0:',quem0.reduce((n,g)=>n+g.its.length,0),'pessoas em',quem0.length,'grupos')}}
  catch(e){console.warn('quem0: falhou — publicação sem lista (',String(e&&e.message||e).slice(0,160),')');quem0=null}
  /* o que vai primeiro: a foto da nuvem (a maior espera) e o tempo real; depois o código, na ordem da página */
  /* v211: a foto da nuvem (20 MB) só é pedida de antemão num computador que ainda não abriu o sistema (sem qv0:geracao); os outros já têm a cópia */
  const primeiro=(foto?'<script>try{if(!localStorage.getItem("qv0:geracao"))document.write(\'<link rel="preload" as="fetch" crossorigin="anonymous" fetchpriority="high" href="'+foto.url+'">\')}catch(e){}</script>':'')+'<link rel="preload" as="image" href="taag-wordmark.png">';
  const depois='<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="preload" as="script" href="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" fetchpriority="low">';
  const cab='<!--PRECARGA-->';if(!L.includes(cab))throw new Error('loader.html: âncora PRECARGA não encontrada');
  L=L.replace(cab,'<link rel="preconnect" href="'+((readFileSync('nuvem-config.js','utf8').match(/url:'([^']+)'/)||[])[1]||'')+'" crossorigin><script>window.__FOTO='+JSON.stringify(foto)+';window.__PUBLICADO='+JSON.stringify(V)+';window.__QUEM0='+JSON.stringify(quem0).replace(/</g,'\\u003c')+'</script>'+primeiro+links+depois);
  L=L.replace(/(<script\b[^>]*\bsrc=")([A-Za-z0-9_.-]+\.js)(?:\?[^"]*)?"/g,(m,a,b)=>selo[b]?a+b+'?v='+selo[b]+'"':m);
  writeFileSync(join(OUT,'index.html'),L);saved+=s.length-o.length;
  console.log('index.html → app.html',s.length,'→',o.length,'·',extraidos,'blocos em arquivos próprios ·',vistos.size,'pré-cargas · index.html = loader');
}
console.log('build: dist/ pronto ·',Math.round(saved/1024),'KB a menos ·',falhas,'arquivo(s)/bloco(s) mantidos como estavam');
