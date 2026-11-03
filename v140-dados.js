/* v140 — DADOS REAIS NA BASE (Bruno, 02-Nov-2026)
   §1 CRM = a planilha "To Do Comercial – Interna Comercial" lida em 02/11/2026 (abas CRM_* + Pipeline, por ID — lei de linhagem
      de 25-Set). Quando a planilha baked (window.CRM_SEED/CRM_RAW) é mais nova que a que está na Base, a Base é atualizada:
      parceiros (campos do CRM sobrescritos pela planilha; campos do Comercial — RT, consultor, exclusividade — preservados),
      oportunidades da Pipeline (as antigas saem, as novas entram; cliente e propostas já ligados são carregados para a nova),
      tabelas do CRM (contatos, interações, tarefas, justificativas, log, config, painéis) substituídas pela planilha.
      Parceiros que saíram da planilha não são apagados (podem ter propostas/indicações): ficam marcados "fora da planilha".
   §2 METAS 2026 (planilha METAS 2026 + quadro do Bruno): TAAG 470 (SP) 33.000.000 · RJ 5.000.000 · Acústica 5.000.000 ·
      FPBN (Focal) 5.000.000 · AT (Pós-venda) 3.000.000 = TAAG 51.000.000. A meta mora só na Base › Listas & regras › Regras & metas;
      a TAAG passa a ter duas linhas (São Paulo · Rio de Janeiro) e o Início mostra as cinco.
      "Vendido no ano" continua vindo das propostas vendidas no sistema; a planilha METAS traz um realizado de 2026 que o sistema
      ainda não tem como propostas — fica guardado como "realizado fora do sistema" e aparece com nome próprio na ponte, nunca somado em silêncio. */
(function(){
'use strict';
if(window.__v140)return;window.__v140=true;
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const LBL=(window.CRM_SEED&&CRM_SEED.versao||'').match(/lida em (\d{2}\/\d{2}\/\d{4})/);const FONTE=LBL?LBL[1]:'';
const KEEP=new Set(['id','rt_pct','exclusivo','pr','whatsapp','escritorio','tipo','crm_fundido','rt_pendente']);

/* o nome do consultor como a equipe o conhece: V123 (pessoa única) → primeiro nome único entre os consultores → como veio */
function consCanon(t){if(!t)return t;try{const v=window.V123&&typeof V123.consMapGet==='function'&&V123.consMapGet(t);if(v)return v}catch(e){}
  try{const eq=(S.db.equipe||[]).filter(e=>e.papel==='Consultor'&&e.ativo!==false);const K=nz(t);const ex=eq.find(e=>nz(e.nome)===K);if(ex)return ex.nome;const fn=eq.filter(e=>nz(e.nome).split(' ')[0]===K);if(fn.length===1)return fn[0].nome}catch(e){}return t}
/* ───── §1 CRM refresh ───── */
function crmRefresh(){try{const db=S.db;if(!db||!db.crm||!window.CRM_SEED||!window.CRM_RAW||!FONTE)return false;if(db.af113_zero)return false;if(db.crm.fonte===FONTE&&db.parceiros.some(p=>p.crm_id!=null&&!p.crm_fora_planilha))return false;/* a marca sem os dados (depois de um Começar do zero) não vale */
  const SEED=window.CRM_SEED,RAW=window.CRM_RAW;db.parceiros=db.parceiros||[];
  /* parceiros */
  const byCrm={},byNome={};db.parceiros.forEach(p=>{if(p.crm_id!==undefined&&p.crm_id!==null)byCrm[+p.crm_id]=p;byNome[nz(p.nome)]=byNome[nz(p.nome)]||p});
  let upd=0,novo=0;const map={};const vistos=new Set();
  SEED.parceiros.forEach(sp=>{let p=byCrm[sp.crm_id]||byNome[nz(sp.nome)];
    if(p){Object.keys(sp).forEach(k=>{if(KEEP.has(k))return;if(k==='nome'&&p.crm_fundido)return;p[k]=sp[k]});if(!p.pr&&sp.pr)p.pr=sp.pr;if(!p.tipo)p.tipo=sp.tipo;p.crm_id=sp.crm_id;delete p.crm_fora_planilha;upd++}
    else{p=Object.assign({},sp);db.parceiros.push(p);novo++}
    vistos.add(p.id);map[sp.id]=p.id});
  let fora=0;db.parceiros.forEach(p=>{if(p.crm_id!==undefined&&p.crm_id!==null&&!vistos.has(p.id)){p.crm_fora_planilha=FONTE;fora++}});
  const rm=id=>map[id]||id;
  /* oportunidades */
  db.negociacoes=db.negociacoes||[];const old=db.negociacoes.filter(n=>/^Pipeline \(/.test(n.origem||''));const resto=db.negociacoes.filter(n=>!/^Pipeline \(/.test(n.origem||''));
  const key=n=>nz(n.cliente_nome)+'|'+nz(n.codinome)+'|'+nz(n.status_pipeline)+'|'+(n.data_upgrade||'');const carry={};old.forEach(n=>{(carry[key(n)]=carry[key(n)]||[]).push(n)});
  const M=window.CRM_MATCH||{};const T=()=>today();const addD=(d,k)=>{const x=new Date(String(d).slice(0,10)+'T12:00:00');x.setDate(x.getDate()+k);return x.toISOString().slice(0,10)};
  let herd=0;const novas=SEED.negociacoes.map(n=>{const x=JSON.parse(JSON.stringify(n));x.parceiros={indicador:rm(x.parceiros.indicador),arquitetura:rm(x.parceiros.arquitetura),gerenciadora:rm(x.parceiros.gerenciadora)};
    const prev=(carry[key(x)]||[]).shift();
    if(prev){herd++;x.cliente_id=prev.cliente_id||null;x.proposta_ids=prev.proposta_ids||[];if(prev.valor)x.valor=prev.valor;if(prev.proxima&&prev.proxima.data)x.proxima.data=prev.proxima.data;if(Array.isArray(prev.timeline)&&prev.timeline.length>1)x.timeline=prev.timeline;if(prev._cli_duvida)x._cli_duvida=true;Object.keys(prev).forEach(k=>{if(x[k]===undefined)x[k]=prev[k]})}
    if(!x.cliente_id&&typeof M.clientePreferido==='function'){const pk=M.clientePreferido(x.cliente_nome,x.codinome);const h=typeof M.clientesDaPessoa==='function'?M.clientesDaPessoa(x.cliente_nome,x.codinome):[];x.cliente_id=pk?pk.id:null;if(!pk&&h.length>1)x._cli_duvida=true}
    /* consultor como a equipe o conhece (Renata → Renata Campos), inclusive em duplas "Isabela + Renata" */
    try{if(typeof x.consultor==='string')x.consultor=x.consultor.split(/(\s*[+\/,&]\s*|\s+e\s+)/i).map((t,i)=>i%2===0?consCanon(t.trim()):t).join('')}catch(e){}
    if(!x.proxima.data)x.proxima.data=x.resultado?'':addD(T(),7);return x});
  resto.forEach(n=>{if(!n.origem&&!n.crm_criada)n.demo=true});/* negociações de demonstração do protótipo: ficam no Comercial, fora do CRM */
  db.negociacoes=resto.concat(novas);
  /* tabelas do CRM (contatos, interações, tarefas…) */
  try{const t=window.CRM_T||(window.CRM_T={});const TABLES=['usuarios','responsaveis','depara','contatos','interacoes','tarefas','justificativas','decisoes','snapshots','config','listas','log','esteira'];TABLES.forEach(k=>{t[k]=JSON.parse(JSON.stringify(RAW[k]||[]))});if(typeof window.CRM_persistT==='function')window.CRM_persistT()}catch(e){console.error('v140 CRM_T',e)}
  db.crm.fonte=FONTE;db.crm.v140={quando:T(),parceiros_atualizados:upd,parceiros_novos:novo,parceiros_fora:fora,oportunidades:novas.length,oportunidades_herdadas:herd,antigas:old.length};
  db._asm=db._asm||{};db._asm.crm='CRM na Base = planilha de '+FONTE+': '+db.parceiros.filter(p=>!p.crm_fora_planilha&&p.crm_id!=null).length+' parceiros, '+(RAW.contatos||[]).length+' contatos, '+(RAW.interacoes||[]).length+' interações, '+(RAW.tarefas||[]).length+' tarefas, '+novas.length+' oportunidades da Pipeline';
  try{log('parceiros','v140','CRM atualizado pela planilha de '+FONTE+': '+upd+' parceiros atualizados, '+novo+' novos, '+fora+' fora da planilha; '+novas.length+' oportunidades ('+herd+' mantiveram cliente/propostas)')}catch(e){}
  save();return true}catch(e){console.error('v140 crm',e);return false}}

/* ───── §2 Metas 2026 ───── */
const META26={taag_sp:33000000,taag_rj:5000000,acustica:5000000,focal:5000000,posvenda:3000000};
const REAL26={taag_sp:15324668.37,taag_rj:2328201.95,acustica:242100,focal:840647,posvenda:0,fonte:'planilha METAS 2026 (02/11/2026) — vendas de 2026 que ainda não estão como propostas no sistema'};
function metas(){try{const db=S.db;if(!db)return;db.metas=db.metas||{};db.meta=db.meta||{};
  if(!db.metas._v140){Object.assign(db.metas,META26);db.metas._v140=1;db.metas.ano=2026;db.meta.ano=2026;db.metas.realizado_fora=REAL26;try{log('metas','v140','Metas 2026 carregadas do quadro do Bruno: SP 33M · RJ 5M · Acústica 5M · FPBN 5M · AT 3M = 51M')}catch(e){}}
  recalc(false)}catch(e){console.error('v140 metas',e)}}
function recalc(doSave){const m=S.db.metas;m.taag_sp=+m.taag_sp||0;m.taag_rj=+m.taag_rj||0;m.taag=m.taag_sp+m.taag_rj;m.empresa=m.taag+(+m.acustica||0)+(+m.focal||0)+(+m.posvenda||0);S.db.meta.valor=m.empresa;if(doSave!==false){try{save()}catch(e){}}}
window.V140_meta=function(k,v){S.db.metas[k]=+String(v).replace(/\./g,'').replace(',','.')||0;recalc(true);try{log('metas',k,String(v))}catch(e){}renderMain()};
window.V140_realizado=function(k,v){S.db.metas.realizado_fora=S.db.metas.realizado_fora||{};S.db.metas.realizado_fora[k]=+String(v).replace(/\./g,'').replace(',','.')||0;try{save()}catch(e){}renderMain()};
const BRL_=v=>'R$ '+(Math.round(+v||0)).toLocaleString('pt-BR');
const LIN5=[['taag_sp','Comercial TAAG · São Paulo (470)'],['taag_rj','Comercial TAAG · Rio de Janeiro'],['acustica','Acústica'],['focal','Boutique (FPBN)'],['posvenda','Pós-venda (AT)']];
window.V140_LIN5=LIN5;
function tabelaMetas(){const m=S.db.metas,rf=m.realizado_fora||{};
  return `<div class="card p-3"><b>Metas anuais ${S.db.meta.ano}</b><div class="sub mb-2" style="font-size:12px">Um lugar só: Propostas, Gestão › Metas e o Início › Meta do ano leem daqui. TAAG = São Paulo + Rio de Janeiro.</div><table class="tbl no-filter"><thead><tr><th>Linha</th><th>Meta (R$)</th><th title="Vendas de 2026 que a planilha METAS registra e que ainda não existem como propostas no sistema">Realizado fora do sistema (R$)</th></tr></thead><tbody>${LIN5.map(([k,l])=>`<tr><td>${l}</td><td><input type="number" class="form-control form-control-sm" value="${+m[k]||0}" onchange="V140_meta('${k}',this.value)"></td><td><input type="number" class="form-control form-control-sm" value="${+rf[k]||0}" onchange="V140_realizado('${k}',this.value)"></td></tr>`).join('')}<tr><td><b>Grupo TAAG</b></td><td><b>${BRL_(m.empresa)}</b></td><td><b>${BRL_(LIN5.reduce((a,[k])=>a+(+rf[k]||0),0))}</b></td></tr></tbody></table><div class="sub mt-1" style="font-size:11px">${rf.fonte?'Realizado fora do sistema: '+rf.fonte:''}</div><div class="row g-2 mt-1"><div class="col-6"><label class="sub" style="font-size:11px">Ano</label><input type="number" class="form-control form-control-sm" value="${S.db.meta.ano}" onchange="S.db.meta.ano=+this.value;S.db.metas.ano=+this.value;save()"></div></div></div>`}
/* Base › Listas & regras › Regras & metas: the metas card is the one above */
const trocaMetas=h=>{if(typeof h!=='string')return h;const i=h.indexOf('<b>Metas anuais ');if(i<0)return h;const a=h.lastIndexOf('<div class="card p-3"',i);const b=h.indexOf('</table>',i);const c=h.indexOf('</div></div>',b);if(a<0||b<0||c<0)return h;return h.slice(0,a)+tabelaMetas()+h.slice(c+12)};
['basedados','dblistas'].forEach(k=>{try{const f=SCREENS[k];if(f&&!f.__v140){SCREENS[k]=function(){return trocaMetas(f.apply(this,arguments))};SCREENS[k].__v140=1}}catch(e){console.error('v140 regras',e)}});

try{if(window.A&&typeof A.novaNegociacao==='function'&&!A.novaNegociacao.__v140){const f=A.novaNegociacao;A.novaNegociacao=function(x){const r=f.apply(this,arguments);try{const n=(S.db.negociacoes||[]).find(q=>q===r||q.id===(r&&r.id));if(n&&!n.origem)n.origem='SYSTAAG (Comercial, '+today()+')'}catch(e){}return r};A.novaNegociacao.__v140=1}}catch(e){}

/* ───── §3 Inventários reais: Estoque RJ (PDF) + Showroom TAAG / Focal (xlsx), 02/11/2026 ─────
   Os produtos dos arquivos são casados com o catálogo por marca + modelo; o que não existe no catálogo nasce como produto novo
   marcado "revisar" (Base › Produtos). Cada peça vira uma unidade no lugar certo (Inventário RJ › Estoque Principal RJ,
   Inventário SP › Focal, Inventário SP › TAAG Showroom) com natureza (à venda · consignado · patrimônio), custo, NF e fornecedor
   quando o arquivo traz. As unidades de demonstração que estavam nesses três lugares saem: o inventário real toma o lugar delas.
   Séries que o Excel estragou ("1,2105E+11") ficam marcadas serie_ilegivel — o número verdadeiro tem de vir do arquivo original. */
function inventarios(){try{const db=S.db;const INV=window.V140_INV;if(!db||!INV||db.af113_zero)return false;if(db._v140inv&&db._v140inv.fonte===INV.fonte&&db.unidades.some(u=>u.origem&&u.origem.indexOf(INV.fonte)>=0))return false;
  const by=id=>db.produtos.find(p=>p.id===id);const pmap={};let pn=0;
  INV.produtos_novos.forEach(np=>{const ex=db.produtos.find(p=>p._v140origem&&nz(p.nome)===nz(np.nome)&&nz(p.marca)===nz(np.marca));if(ex){pmap[np.id]=ex.id;return}
    const id=uid('p');pmap[np.id]=id;db.produtos.push({id,nome:np.nome,marca:np.marca||'',categoria:np.categoria||'Outros',rastreio:np.rastreio||'serial',custo:+np.custo||0,preco:+np.preco||0,tipo:'pç',fase:'estrutural',ncm:'',origem:'Nacional',unidade:np.unidade||'un',garantia_meses:12,cst:'',cod_fornecedor:'',apelido:'',nome_comercial:np.nome,fornecedor:'',unidade_venda:'Unidade',desconto_max:0,descricao:'Cadastrado a partir do inventário de 02/11/2026 — conferir modelo, categoria e preço.',fotos:[],portas:[],aprovado:false,status:'Revisar',_v140origem:INV.fonte,revisar:true});pn++});
  const lug=path=>{let n=T_(()=>L.byPath.apply(L,path),null);if(n)return n;const n1=T_(()=>L.byPath(path[0]),null);if(!n1)return null;try{const l=L.add(2,n1.id,path[1],/showroom/i.test(path[1])?'showroom':'estoque');return L.get(l&&l.id||l)}catch(e){return null}};
  const lugares={};INV.unidades.forEach(u=>{const k=u.lugar.join('›');if(!lugares[k])lugares[k]=lug(u.lugar)});
  const ids=Object.values(lugares).filter(Boolean).map(l=>l.id);
  /* demo units that lived in these places (seeded, no proposal) leave */
  const sub=id=>{const out=new Set([id]);let grow=true;while(grow){grow=false;db.locais.forEach(l=>{if(l.pai&&out.has(l.pai)&&!out.has(l.id)){out.add(l.id);grow=true}})}return out};
  const all=new Set();ids.forEach(id=>sub(id).forEach(x=>all.add(x)));
  const antes=db.unidades.length;db.unidades=db.unidades.filter(u=>!(all.has(u.loc_id)&&!u.proposta_id&&!u.fora));const demoFora=antes-db.unidades.length;
  const pathStr=id=>T_(()=>L.pathStr(id),'')||T_(()=>L.path(id).map(x=>x.nome).join(' › '),'');
  const seq={};let n=0,ileg=0;
  INV.unidades.forEach(r=>{const l=lugares[r.lugar.join('›')];if(!l)return;const pid=pmap[r.produto_id]||r.produto_id;const prod=by(pid);if(!prod)return;const q=r.qtd?Math.max(1,Math.round(+r.qtd)):1;
    for(let i=0;i<q;i++){seq[pid]=(seq[pid]||0)+1;const base=(prod.cod_fornecedor||pid).toUpperCase().replace(/[^A-Z0-9-]/g,'');const serie=(i===0&&r.serie)?r.serie:(prod.rastreio==='medido'?'ROLO-'+base+'-'+seq[pid]:base+'-INV'+String(seq[pid]).padStart(3,'0'));
      const u={id:uid('u'),produto_id:pid,serie,local:pathStr(l.id),estado:r.estado||'livre',proposta_id:null,natureza:r.natureza||'venda',fornecedor:r.fornecedor||prod.fornecedor||'',entrada:r.entrada||'',nf:r.nf||'—',garantia:r.garantia||'',verificado:false,responsavel:'importação 02/11/2026',custo:+r.custo||+prod.custo||0,preco:+prod.preco||0,loc_id:l.id,origem:r.origem,
        hist:[{em:r.entrada||today(),por:'importação',tipo:'entrada',titulo:'Entrada no estoque (inventário de 02/11/2026)',para:pathStr(l.id),ref:{nf:r.nf||'',pc:'',pedido:'',fornecedor:r.fornecedor||''}}]};
      if(prod.rastreio==='medido'){u.metros=+r.metros||+r.qtd||100;u.metros_ini=u.metros;if(r.qtd&&!r.metros){u.metros=u.metros_ini=+r.qtd;i=q}}
      if(r.natureza==='consignado')u.dono=r.fornecedor||(l.nome+' (consignado)');
      if(r.serie_ilegivel&&i===0){u.serie_ilegivel=true;ileg++}
      if(r.inflow_id)u.inflow_id=r.inflow_id;if(r.obs)u.obs=r.obs;
      db.unidades.push(u);n++}});
  db._v140inv={fonte:INV.fonte,quando:today(),unidades:n,produtos_novos:pn,demo_removidas:demoFora,series_ilegiveis:ileg,lugares:Object.keys(lugares)};
  try{log('unidades','v140','Inventários de 02/11/2026 carregados: '+n+' unidades ('+Object.keys(lugares).join(' · ')+'), '+pn+' produtos novos para revisar, '+demoFora+' unidades de demonstração substituídas, '+ileg+' séries ilegíveis (notação científica do Excel)')}catch(e){}
  save();return true}catch(e){console.error('v140 inventários',e);return false}}
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};

/* ───── §4 modo zero × dados reais ─────
   No "sistema do zero" a empresa está vazia de propósito (é o manual). Os dados reais (CRM da planilha, inventários, metas)
   não entram ali — entram quando se sai do zero. A faixa abaixo diz isso onde o leitor procuraria os dados, com o botão certo. */
window.V140_sairDoZero=function(){if(!(typeof can==='function'&&can('zerar'))){toast('Só um perfil com a permissão "Começar do zero / restaurar" sai do modo zero.',true);return}
  if(!confirm('Sair do modo zero e carregar os dados reais (CRM da planilha de 02/11, inventários RJ e showrooms, metas 2026)?\n\nUma cópia da base atual fica guardada na Zona de risco.'))return;
  try{if(window.V139&&typeof V139.guardar==='function')V139.guardar('antes de sair do modo zero')}catch(e){}
  try{delete S.db.af113_zero;localStorage.removeItem('systaag_zero');
    /* grava já, sem depender do debounce: a próxima abertura tem de ler a base SEM a marca de zero */
    const txt=JSON.stringify(S.db);localStorage.setItem('systaag_erp1z',typeof LZString!=='undefined'?LZString.compressToUTF16(txt):txt);window.__semGravar=true}catch(e){console.error('v140 sair do zero',e)}location.reload()};
function faixaZero(){try{if(!S.db||!S.db.af113_zero)return;const k=(location.hash||'#/home').slice(2).split('/')[0];if(!(/^crm/.test(k)||['dbmapa','dbcrm','estoque','epainel','basedados','dbparceiros'].includes(k)))return;const m=document.getElementById('main');if(!m||m.querySelector('#v140-zero'))return;
  const inv=window.V140_INV?window.V140_INV.resumo:null;const d=document.createElement('div');d.id='v140-zero';d.className='card p-3 mb-3';d.style.cssText='border-left:4px solid #0d6efd';
  d.innerHTML=`<div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><b>Sistema do zero</b><div class="sub" style="font-size:12px">A empresa está vazia de propósito (manual). Os dados reais estão guardados e entram quando você sair do zero: CRM da planilha de ${E(FONTE||'02/11/2026')} (${(window.CRM_SEED&&CRM_SEED.parceiros||[]).length} parceiros · ${(window.CRM_RAW&&CRM_RAW.contatos||[]).length} contatos · ${(window.CRM_RAW&&CRM_RAW.interacoes||[]).length} interações · ${(window.CRM_SEED&&CRM_SEED.negociacoes||[]).length} oportunidades)${inv?' · inventários RJ + showrooms ('+(inv.rj_linhas+inv.showroom_linhas)+' linhas)':''} · metas 2026.</div></div><button class="btn-apple" onclick="V140_sairDoZero()"><i class="bi bi-database-up me-1"></i>Sair do zero e carregar os dados reais</button></div>`;
  m.insertBefore(d,m.firstChild)}catch(e){}}
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Começar do zero apaga os dados mas não as marcas de "já carreguei": tiramos as marcas junto, para a próxima base real recarregar */
try{if(typeof window.aplicarZero==='function'&&!window.aplicarZero.__v140){const az=window.aplicarZero;window.aplicarZero=function(db){const r=az.apply(this,arguments);try{if(db){delete db._v140inv;if(db.crm)db.crm.fonte=''}}catch(e){}return r};window.aplicarZero.__v140=1}}catch(e){}
function boot(){metas();crmRefresh();inventarios()}
if(window.S&&S.db)boot();else document.addEventListener('DOMContentLoaded',boot);
try{const _rm=window.renderMain;window.renderMain=function(){try{if(S.db&&S.db.metas&&!S.db.metas._v140)metas()}catch(e){}const r=_rm.apply(this,arguments);try{faixaZero();setTimeout(faixaZero,400)}catch(e){}return r}}catch(e){}
})();
