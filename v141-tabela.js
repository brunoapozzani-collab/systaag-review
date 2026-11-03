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
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const K=s=>nz(s).replace(/ /g,'');
const head=n=>String(n||'').split('—')[0].trim();
const M=s=>K(String(s||'').replace(/[.\s,;:-]+$/,'')); /* modelo sem ponto/traço final */
const ALIAS=[['BLACKFPBN','FOCAL','NAIM','FOCALNAIM'],['ABSOLUTECONTROL','TGCUSTOM','ABSOLUTE','TGINTEGRATION'],['TGCABLES','CABOS','TGCABLE'],['SOHOPLUS','SOHO'],['TPLINK','TP'],['DBSERIES','DB']];
const grp=b=>{const k=K(b);const g=ALIAS.find(a=>a.includes(k));return g?g[0]:k};
const brandOK=(a,b)=>{const x=K(a),y=K(b);return !x||!y||x===y||grp(x)===grp(y)||x.includes(y)||y.includes(x)};
const T=()=>today();
function sync(){try{const db=S.db,TB=window.V141_TABELA;if(!db||!TB||db.af113_zero)return false;if(db._v141&&db._v141.fonte===TB.fonte&&db.produtos.some(p=>p._v141===TB.fonte))return false;
  const byKey={},byModel={};db.produtos.forEach(p=>{const k1=grp(p.marca)+'|'+M(head(p.nome)),k2=grp(p.marca)+'|'+M(p.nome);byKey[k1]=byKey[k1]||p;byKey[k2]=byKey[k2]||p;const m=M(head(p.nome));(byModel[m]=byModel[m]||[]).push(p)});
  const seen=new Set();let upd=0,precoMud=0,novos=0,statusMud=0,fundidos=0;const mudados=[];const diff=[];
  const inv=db.produtos.filter(p=>p._v140origem);
  const ORD={'OK':0,'Sem preço na planilha':1};const itens=TB.itens.slice().sort((a,b)=>(ORD[a.status]??2)-(ORD[b.status]??2)); /* a linha OK ganha o produto; a duplicata não liberada não cria outro */
  itens.forEach(it=>{const key=grp(it.fab)+'|'+M(it.mod);let p=byKey[key];if(p&&seen.has(p.id))p=null;
    if(!p){const mk=M(it.mod);let c=(byModel[mk]||[]).filter(q=>!seen.has(q.id)&&brandOK(q.marca,it.fab));if(!c.length&&mk.length>=6&&/\d/.test(mk))c=(byModel[mk]||[]).filter(q=>!seen.has(q.id)); /* modelo específico (longo, com dígito): a marca da planilha pode ter mudado de rótulo */
      p=c.find(q=>!q._v140origem)||c[0]||null}
    if(!p&&byKey[key])return; /* segunda linha da planilha para o mesmo produto: não cria outro */
    if(p){seen.add(p.id);const antes={preco:+p.preco||0,custo:+p.custo||0,status:p.status||'OK'};
      if(it.tabela!=null)p.preco=it.tabela;if(it.compra!=null)p.custo=it.compra;if(it.desc_pct!=null)p.desconto=it.desc_pct;if(it.margem!=null)p.margem=it.margem;if(it.forn)p.fornecedor=it.forn;
      if(!p.marca)p.marca=it.fab;p.status=it.status;p.atualizado_em=it.data||T();p._v141=TB.fonte;if(it.cod&&!p.cod_fornecedor)p.cod_fornecedor=it.cod;
      const mp=Math.abs(antes.preco-(+p.preco||0))>0.005||Math.abs(antes.custo-(+p.custo||0))>0.005;if(mp){precoMud++;mudados.push(p.id);diff.push({id:p.id,nome:p.nome,de:antes,para:{preco:+p.preco||0,custo:+p.custo||0}})}
      if(antes.status!==p.status)statusMud++;upd++;
      /* an inventory-created twin of this product → merge into it */
      inv.forEach(q=>{if(q!==p&&!q.__fundido&&M(head(q.nome))===M(it.mod)&&brandOK(q.marca,it.fab)){db.unidades.forEach(u=>{if(u.produto_id===q.id)u.produto_id=p.id});q.__fundido=p.id;fundidos++}});
      return}
    if(it.status!=='OK'&&it.status!=='Sem preço na planilha')return; /* a non-OK row we never had: nothing to create */
    const id=uid('p');const nome=it.mod+(it.desc?' — '+it.desc.slice(0,90):'');
    db.produtos.push({id,nome,marca:it.fab,categoria:it.cat||'Outros',rastreio:it.rastreio||'serial',custo:+it.compra||0,preco:+it.tabela||0,tipo:'pç',fase:it.cat==='Cabos'?'cabeamento':'instalacao',ncm:'',origem:'Nacional',unidade:it.med||'un',garantia_meses:12,cst:'',cod_fornecedor:it.cod||'',apelido:'',nome_comercial:nome,fornecedor:it.forn||'',unidade_venda:it.med==='par'?'Par':it.med==='kit'?'Kit':'Unidade',desconto:it.desc_pct,margem:it.margem,desconto_max:0,descricao:it.desc||'',fotos:[],portas:[],aprovado:it.status==='OK',status:it.status,atualizado_em:it.data||T(),_v141:TB.fonte,_v141novo:true});novos++});
  /* merged twins leave the catalogue */
  const antesN=db.produtos.length;db.produtos=db.produtos.filter(p=>!p.__fundido);
  /* products the sheet no longer lists */
  let fora=0;db.produtos.forEach(p=>{if(seen.has(p.id)||p._v141===TB.fonte||p._v140origem||/^Demais itens/.test(p.nome||''))return;if(p.status==='OK'||!p.status){p.status='Fora da tabela (30/10/2026)';fora++}});
  /* prices → open proposals only (sold stay frozen) */
  let linhas=0,props=new Set();if(typeof window.__aplicarCatalogo==='function')mudados.forEach(id=>{try{const r=window.__aplicarCatalogo(id,'Tabela Taag 30/10/2026');linhas+=r.n;(r.props||[]).forEach(x=>props.add(x))}catch(e){}});
  db._v141={fonte:TB.fonte,quando:T(),atualizados:upd,precos_mudados:precoMud,status_mudados:statusMud,novos,fora_da_tabela:fora,fundidos,linhas_propostas:linhas,propostas:[...props],diff:diff.slice(0,400)};
  try{log('produtos','v141','Catálogo = '+TB.fonte+': '+upd+' produtos conferidos, '+precoMud+' com preço/custo novo ('+linhas+' linha(s) de '+props.size+' proposta(s) abertas atualizadas), '+novos+' novos, '+statusMud+' mudaram de status, '+fora+' fora da tabela, '+fundidos+' do inventário fundidos')}catch(e){}
  save();return true}catch(e){console.error('v141',e);return false}}
window.V141_sync=sync;
/* Base › Produtos: one line saying where the catalogue comes from and what the last reading changed */
try{const f=SCREENS.dbprodutos;if(f&&!f.__v141){SCREENS.dbprodutos=function(arg){const h=f.apply(this,arguments);if(typeof h!=='string'||arg)return h;const v=S.db._v141;if(!v)return h;const i=h.indexOf('</h1>');if(i<0)return h;const j=h.indexOf('</div>',i);const nota=`<div id="v141-nota" class="card p-2 px-3 mb-3" style="font-size:12px;border-left:4px solid #0d6efd"><b>Catálogo = ${v.fonte}</b> · lido em ${v.quando.split('-').reverse().join('/')}: ${v.atualizados} conferidos · <b>${v.precos_mudados}</b> com preço/custo novo (${v.linhas_propostas} linha(s) de propostas abertas atualizadas; vendidas travadas) · <b>${v.novos}</b> novos · ${v.status_mudados} mudaram de status · ${v.fora_da_tabela} fora da tabela · ${v.fundidos} do inventário fundidos. A planilha segue sendo editada no Drive; a próxima leitura entra pelo mesmo caminho.</div>`;return h.slice(0,j+6)+nota+h.slice(j+6)};SCREENS.dbprodutos.__v141=1}}catch(e){}
/* §7 get(tabela,id) era uma busca linear; a Diretoria a chama 1,5 milhão de vezes numa leitura (716 mil só em produtos, agora 2.100 itens).
   Índice por tabela, validado por identidade (arr[i]===registro) — se a lista mudou, cai na busca linear e reindexa. */
try{const g0=window.get;if(typeof g0==='function'&&!g0.__v141){const IDX=new Map();const build=(t,arr)=>{const m=new Map();for(let i=0;i<arr.length;i++){const r=arr[i];if(r&&r.id!=null&&!m.has(r.id))m.set(r.id,i)}IDX.set(t,{arr,m});return m};
  const g=function(t,id){const arr=S.db&&S.db[t];if(!Array.isArray(arr))return g0.apply(this,arguments);let e=IDX.get(t);let m=(e&&e.arr===arr)?e.m:build(t,arr);const i=m.get(id);if(i!==undefined){const r=arr[i];if(r&&r.id===id)return r}const r=arr.find(x=>x&&x.id===id);if(r)build(t,arr);return r};g.__v141=1;window.get=g}}catch(e){}
/* §6 desempenho: Pessoas & Cultura › Metas chamava DIR_PESSOAS() (o modelo inteiro da Diretoria, ~9 s) uma vez POR PESSOA → 20 pessoas = 3 min de tela parada.
   O modelo é o mesmo para todas: calcula uma vez e reaproveita até a próxima gravação (save) ou 5 s, o que vier antes. */
try{const dp0=window.DIR_PESSOAS;if(typeof dp0==='function'&&!dp0.__v141){let cache=null;const wrap=function(){const now=Date.now();if(cache&&now-cache.t<5000)return cache.v;let v;const M0=window.M,r0=M0&&M0.resumo;if(typeof r0==='function'){const memo=new Map();M0.resumo=function(p){const k=p&&p.id;if(k&&memo.has(k))return memo.get(k);const out=r0.apply(this,arguments);if(k)memo.set(k,out);return out}} /* dentro de uma leitura, a mesma proposta vendida é resumida uma vez, não uma por pessoa × mês */
  try{v=dp0.apply(this,arguments)}finally{if(typeof r0==='function')M0.resumo=r0}cache={t:now,v};return v};wrap.__v141=1;wrap.invalidar=()=>{cache=null};window.DIR_PESSOAS=wrap;
  const s0=window.save;if(typeof s0==='function'){const sv=function(){cache=null;return s0.apply(this,arguments)};Object.keys(s0).forEach(k=>{sv[k]=s0[k]});window.save=sv}}}catch(e){}
if(window.S&&S.db)sync();else document.addEventListener('DOMContentLoaded',sync);
})();
