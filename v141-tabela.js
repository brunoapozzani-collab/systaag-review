/* v141 — A TABELA TAAG DO DRIVE É O CATÁLOGO (Bruno, 03-Nov-2026)
   Fonte: PlanilhaPrecos.xlsx › Tabela Taag (Drive compartilhado, editada em 30/10/2026), lida em 03/11/2026 → window.V141_TABELA.
   Regras dele: preços que mudaram entram (Tabela = venda, Compra = custo) e valem para as propostas ainda não vendidas; vendidas
   ficam travadas (regra da casa, __aplicarCatalogo). Produtos novos entram com marca, modelo, categoria e rastreio inferidos — sem
   "revisar". Produtos que saíram da planilha ficam, marcados "Fora da tabela". Linhas sem status e sem preço (os 27 JBL) entram
   como "Sem preço na planilha" — existem, mas não podem ser orçados até a planilha trazer o preço.
   Produtos que os inventários criaram (v140) e que existem na Tabela são fundidos no produto da Tabela (as unidades seguem). */
(function(){
'use strict';
if(window.__v141)return;window.__v141=true;
const nz=(()=>{/* rapido3 09-nov: mesma função, com memória */const f=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim(),m=new Map();return s=>{if(typeof s!=='string')return f(s);let v=m.get(s);if(v===undefined){v=f(s);m.set(s,v)}return v}})();
const K=s=>nz(s).replace(/ /g,'');
const head=n=>String(n||'').split('—')[0].trim();
const M=s=>K(String(s||'').replace(/[.\s,;:-]+$/,'')); /* modelo sem ponto/traço final */
const ALIAS=[['BLACKFPBN','FOCAL','NAIM','FOCALNAIM'],['ABSOLUTECONTROL','TGCUSTOM','ABSOLUTE','TGINTEGRATION'],['TGCABLES','CABOS','TGCABLE'],['SOHOPLUS','SOHO'],['TPLINK','TP'],['DBSERIES','DB']];
const grp=b=>{const k=K(b);const g=ALIAS.find(a=>a.includes(k));return g?g[0]:k};
const brandOK=(a,b)=>{const x=K(a),y=K(b);return !x||!y||x===y||grp(x)===grp(y)||x.includes(y)||y.includes(x)};
const T=()=>today();
/* 27-Nov-2026 (Bruno: "os produtos daqui para frente precisam ser atualizados") — REGRA ESTRITA, substitui a de 03/11:
   • a Tabela (só linhas OK) atualiza preço (Tabela Fornecedor) e custo (Compra) do produto quando MARCA + MODELO batem exatamente
     e a Tabela tem UMA linha OK para eles; marca+modelo repetidos com preços diferentes ficam fora (lista em _v141.repetidos);
   • sem apelidos de marca (FOCAL ≠ BLACK_FPBN, LUTRON ≠ LUTRON_TF) e sem "só o modelo" — foi assim que a regra antiga trocava custo errado;
   • linha OK cujo modelo não existe no catálogo vira produto novo (id fixo tb_…, então dois computadores não criam dois);
   • propostas NÃO são mexidas (as já feitas guardam o preço/custo da época); o que entra daqui para frente usa o catálogo atualizado. */
function hk(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)}
function sync(){try{const db=S.db,TB=window.V141_TABELA;if(!db||!TB||!Array.isArray(db.produtos))return false;
  if(db._v141&&db._v141.fonte===TB.fonte&&db._v141.regra==='estrita')return false;
  const KM=s=>K(s);const ok=new Map();
  TB.itens.forEach(it=>{if(String(it.status||'').trim().toUpperCase()!=='OK')return;const k=K(it.fab)+'|'+KM(it.mod);if(!ok.has(k))ok.set(k,[]);ok.get(k).push(it)});
  const repetidos=[];ok.forEach((a,k)=>{if(new Set(a.map(x=>x.tabela+'/'+x.compra)).size>1)repetidos.push(k)});const rep=new Set(repetidos);
  const vivos=db.produtos.filter(p=>!p._apagado&&!p.merged_into&&!p.__fundido);
  const porChave=new Map();vivos.forEach(p=>{const k=K(p.marca)+'|'+KM(head(p.nome));if(!porChave.has(k))porChave.set(k,[]);porChave.get(k).push(p)});
  const modelos=new Set(vivos.map(p=>M(head(p.nome))));
  const diff=[];let conferidos=0,novos=0;const novosL=[];
  ok.forEach((a,k)=>{if(rep.has(k))return;const it=a[0];const ps=porChave.get(k);
    if(ps){ps.forEach(p=>{conferidos++;const antes={preco:+p.preco||0,custo:+p.custo||0};let mud=false;
      if(it.tabela!=null&&Math.abs(antes.preco-it.tabela)>0.005){p.preco=it.tabela;mud=true}
      if(it.compra!=null&&Math.abs(antes.custo-it.compra)>0.005){p.custo=it.compra;mud=true}
      if(it.forn&&p.fornecedor!==it.forn)p.fornecedor=it.forn;
      if(p.status!=='OK'&&!/^Sem preço/.test(p.status||''))p.status='OK';
      if(mud){p.atualizado_em=it.data||T();p.fonte_preco=TB.fonte;diff.push({id:p.id,nome:head(p.nome),marca:p.marca,de:antes,para:{preco:+p.preco||0,custo:+p.custo||0}});try{put('produtos',p,'preço/custo = '+TB.fonte)}catch(e){}}});return}
    if(modelos.has(M(it.mod)))return; /* o modelo já existe com outra marca: não cria duplicata (fica para conferência) */
    const id='tb_'+hk(k);if(db.produtos.some(p=>p.id===id))return;
    const p={id,nome:it.mod+(it.desc?' — '+String(it.desc).slice(0,90):''),marca:it.fab,categoria:it.cat&&!/defin/i.test(it.cat)?it.cat:'Outros',rastreio:'serial',custo:+it.compra||0,preco:+it.tabela||0,tipo:'pç',fase:'instalacao',ncm:'',origem:'Nacional',status:'OK',fornecedor:it.forn||'',atualizado_em:it.data||T(),fonte_preco:TB.fonte,_v141:TB.fonte};
    db.produtos.push(p);novos++;novosL.push(p.id+' '+it.fab+' '+it.mod);try{put('produtos',p,'novo da '+TB.fonte)}catch(e){}});
  db._v141={fonte:TB.fonte,regra:'estrita',quando:T(),conferidos,precos_mudados:diff.length,novos,novos_lista:novosL.slice(0,200),repetidos,diff:diff.slice(0,400)};
  try{log('produtos','v141','Catálogo = '+TB.fonte+' (regra estrita): '+conferidos+' conferidos, '+diff.length+' com preço/custo novo, '+novos+' novos, '+repetidos.length+' marca+modelo repetidos na Tabela (não aplicados). Propostas não mudam.')}catch(e){}
  save();return true}catch(e){console.error('v141',e);return false}}
window.V141_sync=sync;
/* Base › Produtos: one line saying where the catalogue comes from and what the last reading changed */
try{const f=SCREENS.dbprodutos;if(f&&!f.__v141){SCREENS.dbprodutos=function(arg){const h=f.apply(this,arguments);if(typeof h!=='string'||arg)return h;const v=S.db._v141;if(!v)return h;const i=h.indexOf('</h1>');if(i<0)return h;const j=h.indexOf('</div>',i);const nota=`<div id="v141-nota" class="card p-2 px-3 mb-3" style="font-size:12px;border-left:4px solid #0d6efd"><b>Catálogo = ${v.fonte}</b> · aplicado em ${String(v.quando||'').split('-').reverse().join('/')}: ${v.regra==='estrita'?v.conferidos:v.atualizados} conferidos · <b>${v.precos_mudados}</b> com preço/custo novo · <b>${v.novos}</b> novos${v.regra==='estrita'?` · ${(v.repetidos||[]).length} marca+modelo aparecem 2× na Tabela com preços diferentes (não aplicados — corrigir na Tabela)`:''}. Atualiza sozinho todo dia a partir da Tabela de preços do Drive; propostas já feitas não mudam.</div>`;return h.slice(0,j+6)+nota+h.slice(j+6)};SCREENS.dbprodutos.__v141=1}}catch(e){}
/* §7 get(tabela,id) era uma busca linear; a Diretoria a chama 1,5 milhão de vezes numa leitura (716 mil só em produtos, agora 2.100 itens).
   Índice por tabela, validado por identidade (arr[i]===registro) — se a lista mudou, cai na busca linear e reindexa. */
try{const g0=window.get;if(typeof g0==='function'&&!g0.__v141){const IDX=new Map();const build=(t,arr)=>{const m=new Map();for(let i=0;i<arr.length;i++){const r=arr[i];if(r&&r.id!=null&&!m.has(r.id))m.set(r.id,i)}IDX.set(t,{arr,m});return m};
  const g=function(t,id){const arr=S.db&&S.db[t];if(!Array.isArray(arr))return g0.apply(this,arguments);let e=IDX.get(t);let m=(e&&e.arr===arr)?e.m:build(t,arr);const i=m.get(id);if(i!==undefined){const r=arr[i];if(r&&r.id===id)return r}const r=arr.find(x=>x&&x.id===id);if(r)build(t,arr);return r};g.__v141=1;window.get=g}}catch(e){}
/* §6 desempenho: Pessoas & Cultura › Metas chamava DIR_PESSOAS() (o modelo inteiro da Diretoria, ~9 s) uma vez POR PESSOA → 20 pessoas = 3 min de tela parada.
   O modelo é o mesmo para todas: calcula uma vez e reaproveita até a próxima gravação (save) ou 5 s, o que vier antes. */
try{const dp0=window.DIR_PESSOAS;if(typeof dp0==='function'&&!dp0.__v141){let cache=null;const wrap=function(){const now=Date.now();if(cache&&now-cache.t<5000)return cache.v;let v;const M0=window.M,r0=M0&&M0.resumo;if(typeof r0==='function'){const memo=new Map();M0.resumo=function(p){const k=p&&p.id;if(k&&memo.has(k))return memo.get(k);const out=r0.apply(this,arguments);if(k)memo.set(k,out);return out}} /* dentro de uma leitura, a mesma proposta vendida é resumida uma vez, não uma por pessoa × mês */
  try{v=dp0.apply(this,arguments)}finally{if(typeof r0==='function')M0.resumo=r0}cache={t:now,v};return v};wrap.__v141=1;wrap.invalidar=()=>{cache=null};window.DIR_PESSOAS=wrap;
  const s0=window.save;if(typeof s0==='function'){const sv=function(){cache=null;return s0.apply(this,arguments)};Object.keys(s0).forEach(k=>{sv[k]=s0[k]});window.save=sv}}}catch(e){}
/* 27-Nov: roda depois que a Base compartilhada carregou (antes rodava na base provisória e era sobrescrito); de novo a cada 6 h com a aba aberta */
(function quando(fn){if(window.__TREINO||!window.NUVEM_CONFIG||!window.NUVEM_CONFIG.url){setTimeout(fn,1500);return}
  if(window.__v172pronto){setTimeout(fn,500);return}window.addEventListener('v172-pronta',()=>setTimeout(fn,800),{once:true})})(()=>{sync();setInterval(sync,6*3600*1000)});
})();
