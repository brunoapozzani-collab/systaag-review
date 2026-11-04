/* v151 · A VENDA TEM DONO + A ENTREGA TÉCNICA NA OBRA (Bruno, 04/11/2026)
   O que ele viu: foi ao Comercial ver quanto o André vendeu e a venda não estava ligada à pessoa — o vendedor era só um
   nome escrito na proposta ("André", "Renata Campos"), Pessoas tinha a mesma pessoa duas vezes (duas Renatas, dois Marcelos)
   e as vendas da Renata apontavam para o cadastro repetido.
   Regras dele: Renata = Renata Campos Martins (FUN-019) · Marcelo = Marcelo Gomes Fontinele da Silva (FUN-012) — os repetidos
   são fundidos; "quanto fulano vendeu" aparece no cadastro da pessoa (Base › Pessoas) E no Comercial › Gestão por consultor,
   o MESMO número; venda com dois vendedores ("Edson / André") divide 50/50, para a soma por pessoa fechar com a empresa.
   O arquivo ET_Clientes_Taag.xlsx (Entrega Técnica por obra) entra na OBRA, em Operação, e aparece no Pós-venda.
   §1 Uma pessoa, um cadastro: FUN-081 → FUN-019, FUN-084 → FUN-012 (apelidos guardados, todo vínculo por id reapontado).
   §2 V151.vendas(ano): a conta única "vendido por pessoa" (rateio igual entre os vendedores da proposta) — usada pela Base,
      pela Gestão e por quem mais precisar; soma por pessoa = total da empresa.
   §3 Comercial › Gestão com filtro de consultor: o valor é o rateio, as obras são as dele e o "% de R$ 51M" vira
      "% do vendido da empresa" (não há meta por consultor — regra do Bruno).
   §4 Base › Pessoas ganha o bloco "Vendas 2026 por pessoa" — cada número abre Propostas já filtrada.
   §5 E.T.: obra.et {situação, data, fim da execução, obs, prazo}; cartão na ficha da obra (Operação) e resumo no
      Pós-venda › Obras finalizadas; linhas do arquivo sem obra ficam na Conferência Mestra. */
(function(){
'use strict';
if(window.__v151)return;window.__v151=true;
if(typeof S==='undefined'||!S.db)return;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N0=v=>(+v||0).toLocaleString('pt-BR');
const R$=v=>'R$ '+(Math.round(+v||0)).toLocaleString('pt-BR');
const T_=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const hoje=()=>T_(()=>today(),new Date().toISOString().slice(0,10));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const ano=()=>String((S.db.meta&&S.db.meta.ano)||new Date().getFullYear());
const real=p=>T_(()=>V142.real(p),['vendida','em_obra','concluida'].includes(p.estado)&&!p.demo);
const tot=p=>T_(()=>+M.total(p),+p.valor_venda||0)||0;
const treino=()=>T_(()=>localStorage.getItem('systaag_treino_on')==='1',false);
function bloco(h,i){if(i<0)return '';let d=0;const re=/<div\b|<\/div>/g;re.lastIndex=i;let m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(d===0)return h.slice(i,m.index+6)}return ''}

/* ---------- §1 uma pessoa, um cadastro ---------- */
const FUSOES=[['FUN-081','FUN-019'],['FUN-084','FUN-012']];
function fundir(db){let n=0;const F=db._v151=db._v151||{};if(F.fundidas)return 0;F.fundidas=[];
  FUSOES.forEach(([de,para])=>{const ps=db.pessoas||[];const a=ps.find(p=>p.id===de),b=ps.find(p=>p.id===para);if(!a||!b)return;
    b.apelidos=Array.from(new Set([...(b.apelidos||[]),a.nome,a.nomeCompleto].filter(Boolean)));
    if(!b.email&&a.email)b.email=a.email;if(!b.telefone&&a.telefone)b.telefone=a.telefone;
    const troca=v=>v===de?para:v;const arrTroca=arr=>Array.isArray(arr)?arr.map(troca):arr;
    ['equipe','folha','usuarios','at_usuarios','tecnicos','programadores','jornadas','veiculos','atividades','pendencias','cop_tarefas'].forEach(t=>(db[t]||[]).forEach(r=>{['pessoa_id','responsavel_id','gerente_id'].forEach(k=>{if(r[k]===de){r[k]=para;n++}})}));
    (db.obras||[]).forEach(o=>{if(o.gerente_id===de){o.gerente_id=para;n++}['comercial_ids','respProjetos_ids','respObra_ids'].forEach(k=>{if(Array.isArray(o[k])&&o[k].includes(de)){o[k]=Array.from(new Set(arrTroca(o[k])));n++}})});
    (db.propostas||[]).forEach(p=>{if(Array.isArray(p.consultor_ids)&&p.consultor_ids.includes(de)){p.consultor_ids=arrTroca(p.consultor_ids);n++}});
    (db.negociacoes||[]).forEach(g=>{if(Array.isArray(g.consultor_ids)&&g.consultor_ids.includes(de)){g.consultor_ids=arrTroca(g.consultor_ids);n++}});
    /* gavetas por nome (rhdocs, holerites, escala) seguem a pessoa certa */
    const nomeA=a.nomeCompleto||a.nome,nomeB=b.nomeCompleto||b.nome;
    ['rhdocs','holerites','escala'].forEach(t=>{const o=db[t];if(o&&typeof o==='object'&&!Array.isArray(o)&&o[nomeA]!==undefined&&o[nomeB]===undefined){o[nomeB]=o[nomeA];delete o[nomeA];n++}});
    (db.folha||[]).forEach(r=>{if(r.nome===nomeA&&(r.pessoa_id===para||!r.pessoa_id)){r.nome=nomeB;n++}});
    /* a lista do Comercial: uma linha por pessoa */
    const eq=(db.equipe||[]).filter(q=>q.pessoa_id===para);if(eq.length>1){const keep=eq[0];eq.slice(1).forEach(d=>{keep.apelidos=Array.from(new Set([...(keep.apelidos||[]),d.nome,...(d.apelidos||[])].filter(Boolean)));db.equipe=db.equipe.filter(x=>x!==d);n++})}
    (db.equipe||[]).forEach(q=>{if(q.pessoa_id===para){q.apelidos=Array.from(new Set([...(q.apelidos||[]),a.nome,a.nomeCompleto].filter(x=>x&&norm(x)!==norm(q.nome))))}});
    db.pessoas=ps.filter(p=>p!==a);F.fundidas.push({de,para,nome:nomeA,em:nomeB});n++});
  return n}

/* ---------- §2 a conta única: vendido por pessoa (rateio igual) ---------- */
function idsDaProposta(p){const ids=Array.isArray(p.consultor_ids)?p.consultor_ids.slice():[];const nomes=p.consultores||[];
  nomes.forEach((nm,i)=>{if(!ids[i]){const r=T_(()=>window.V123&&V123.pessoaDoConsultor(nm),null);ids[i]=r&&r.pessoa&&r.pessoa.id||null}});return ids}
function vendas(a){const y=a||ano();const por={};let total=0,semDono=0;
  (S.db.propostas||[]).forEach(p=>{if(!real(p)||!String(p.vendida_em||'').startsWith(y))return;const v=tot(p);total+=v;const ids=idsDaProposta(p).filter(Boolean);const uniq=Array.from(new Set(ids));
    if(!uniq.length){semDono+=v;return}const parte=v/uniq.length;
    uniq.forEach(id=>{const r=por[id]=por[id]||{pessoa_id:id,n:0,compartilhadas:0,valor:0,propostas:[]};r.n++;if(uniq.length>1)r.compartilhadas++;r.valor+=parte;r.propostas.push(p.id)})});
  const lista=Object.values(por).map(r=>{const p=(S.db.pessoas||[]).find(x=>x.id===r.pessoa_id);r.nome=p?(p.nomeCompleto||p.nome):r.pessoa_id;r.curto=p?p.nome:r.pessoa_id;r.pct=total?r.valor/total*100:0;return r}).sort((a,b)=>b.valor-a.valor);
  return {ano:y,total,semDono,lista}}
window.V151={vendas,idsDaProposta,FUSOES};

/* ---------- §3 Gestão por consultor: rateio, obras do consultor, % do vendido ---------- */
const rota=()=>T_(()=>route().k,'');
function pessoaDoFiltro(){const f=S.comF||{};if(!f.cons)return null;const r=T_(()=>V123.pessoaDoConsultor(f.cons),null);return r&&r.pessoa?r.pessoa:null}
try{if(typeof M==='object'&&M&&typeof M.total==='function'&&!M.total.__v151){const _t=M.total;M.total=function(p){const v=_t.apply(this,arguments);try{if(rota()==='gestao'&&p&&Array.isArray(p.consultores)&&p.consultores.length>1){const pe=pessoaDoFiltro();if(pe){const ids=Array.from(new Set(idsDaProposta(p).filter(Boolean)));if(ids.length>1&&ids.includes(pe.id))return v/ids.length}}}catch(e){}return v};M.total.__v151=1}}catch(e){console.error('v151 total',e)}
function obrasDe(pid){const viaProp=new Set((S.db.propostas||[]).filter(p=>p.obra_id&&idsDaProposta(p).includes(pid)).map(p=>p.obra_id));
  return (S.db.obras||[]).filter(o=>o.ativo!==false&&!o.merged_into&&((o.comercial_ids||[]).includes(pid)||viaProp.has(o.id)))}
try{const g0=SCREENS.gestao;if(g0&&!g0.__v151){SCREENS.gestao=function(){let h=g0.apply(this,arguments);if(typeof h!=='string')return h;const pe=pessoaDoFiltro();if(!pe)return h;
    try{const V=vendas();const r=V.lista.find(x=>x.pessoa_id===pe.id)||{valor:0,n:0,pct:0};
      h=h.replace(/(VENDIDO \d{4}<\/div><div style="font-size:24px;font-weight:800">)[^<]*(<\/div><div class="sub" style="font-size:11px">)[^<]*% de [^<]*</,`$1${'R$ '+(r.valor/1e6).toFixed(2).replace('.',',')}M$2${r.pct.toFixed(1).replace('.',',')}% do vendido da empresa (${R$(V.total)}) · ${r.compartilhadas?N0(r.compartilhadas)+' venda(s) dividida(s) 50/50':'sem vendas divididas'}<`);
      const O=obrasDe(pe.id);const sit={};O.forEach(o=>{const s=T_(()=>COP.situacao(o),o.situacao||'');sit[s]=(sit[s]||0)+1});
      h=h.replace(/OBRAS(<\/div><div style="font-size:24px;font-weight:800">)<a href="#\/obras" class="vx-door">[^<]*<\/a>(<\/div><div class="sub" style="font-size:11px">)as de Operação › Obras/,`OBRAS$1<a href="#/obras" class="vx-door">${N0(O.length)}</a>$2obras vendidas por ${E(pe.nome)}`);
      const i=h.indexOf('id="v146-obras"');if(i>=0){const st=h.lastIndexOf('<div class="card',i);const old=bloco(h,st);
        const novo=`<div class="card p-3 mb-3" id="v146-obras" style="border-left:4px solid #6f42c1"><b style="font-size:12px;letter-spacing:.06em">OBRAS DE ${E(pe.nome).toUpperCase()} · comercial da obra ou proposta vendida por ${E(pe.nome)}</b><div class="d-flex align-items-baseline gap-3 mt-1"><b style="font-size:24px"><a href="#/obras" class="vx-door">${N0(O.length)}</a></b><span class="sub">${Object.entries(sit).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${N0(v)} ${E(k)}`).join(' · ')||'—'}</span></div><div class="sub mt-1" style="font-size:12px">${N0(O.length)} = ${Object.entries(sit).map(([k,v])=>N0(v)+' '+E(k)).join(' + ')||'0'} <span style="color:#198754">✓</span></div></div>`;
        if(old)h=h.replace(old,novo)}
    }catch(e){console.error('v151 gestao',e)}return h};SCREENS.gestao.__v151=1}}catch(e){}

/* ---------- §4 Base › Pessoas: vendas por pessoa ---------- */
function cardVendas(){const V=vendas();if(!V.lista.length&&!V.total)return '';
  const abre=(r)=>{const q=(S.db.equipe||[]).find(x=>x.pessoa_id===r.pessoa_id);const nome=q?q.nome:r.curto;return `S.propF={st:'aprovada',cons:'${E(nome).replace(/'/g,"\\'")}',vano:'${V.ano}'};location.hash='#/propostas';renderMain()`};
  const soma=V.lista.reduce((a,r)=>a+r.valor,0);
  return `<div class="card p-3 mb-3" id="v151-vendas" style="border-left:4px solid #198754"><div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2"><div><b style="font-size:12px;letter-spacing:.06em">VENDAS ${E(V.ano)} POR PESSOA</b> <span class="sub" style="font-size:11px">· a mesma conta de Comercial › Gestão · venda com dois vendedores divide 50/50</span></div><a href="#/gestao" class="sub" style="font-size:12px">ver na Gestão ›</a></div>
   <div class="table-responsive mt-2"><table class="table table-sm mb-0" style="font-size:13px"><thead><tr><th>Pessoa</th><th class="text-end">Propostas</th><th class="text-end">Divididas</th><th class="text-end">Vendido</th><th class="text-end">% da empresa</th></tr></thead><tbody>
   ${V.lista.map(r=>`<tr><td><a href="javascript:void 0" onclick="${abre(r)}">${E(r.nome)}</a></td><td class="text-end"><a href="javascript:void 0" onclick="${abre(r)}">${N0(r.n)}</a></td><td class="text-end sub">${r.compartilhadas?N0(r.compartilhadas):'—'}</td><td class="text-end"><b>${R$(r.valor)}</b></td><td class="text-end">${r.pct.toFixed(1).replace('.',',')}%</td></tr>`).join('')}
   </tbody><tfoot><tr><th>Empresa</th><th class="text-end">${N0((S.db.propostas||[]).filter(p=>real(p)&&String(p.vendida_em||'').startsWith(V.ano)).length)}</th><th></th><th class="text-end">${R$(V.total)}</th><th class="text-end">100%</th></tr></tfoot></table></div>
   <div class="sub mt-1" style="font-size:12px">${R$(V.total)} = ${V.lista.map(r=>R$(r.valor)).join(' + ')}${V.semDono?' + '+R$(V.semDono)+' sem vendedor ligado':''} <span style="color:${Math.abs(soma+V.semDono-V.total)<1?'#198754':'#dc3545'}">${Math.abs(soma+V.semDono-V.total)<1?'✓':'✗ não fecha'}</span></div></div>`}
try{const p0=SCREENS.dbpessoas;if(p0&&!p0.__v151){SCREENS.dbpessoas=function(arg){const h=p0.apply(this,arguments);if(typeof h!=='string'||(arg&&arg!=='ficha'))return h;const i=h.indexOf('data-v136="pessoas"');if(i<0)return h+cardVendas();const st=h.lastIndexOf('<div',i);const b=bloco(h,st);return h.slice(0,st+b.length)+cardVendas()+h.slice(st+b.length)};SCREENS.dbpessoas.__v151=1}}catch(e){}

/* ---------- §5 E.T. na obra ---------- */
const ET=window.V151_ET;
function etSync(db){if(!ET||!Array.isArray(ET.rows))return 0;const F=db._v151=db._v151||{};if(F.etQuando===ET.quando)return 0;F.etQuando=ET.quando;F.etSemObra=[];let n=0;
  const byLinha={};(db.obras||[]).forEach(o=>{if(o.linhaPlanilha&&!o.merged_into)byLinha[o.linhaPlanilha]=o});
  ET.rows.forEach(r=>{const o=byLinha[r.linha];if(!o){F.etSemObra.push({linha:r.linha,cliente:r.cliente,propostas:r.propostas,situacao:r.situacaoET});return}
    const et={situacao:r.situacaoET||'',data:r.dataET||'',fim:r.fim||'',obs:r.obs||'',prazo:r.prazo||'',fonte:ET.fonte,aba:r.aba};
    if(JSON.stringify(o.et||null)!==JSON.stringify(et)){o.et=et;n++}
    if(et.situacao&&/realizad/i.test(et.situacao)&&o.entrega&&!o.entrega.realizada&&/^\d{4}-\d{2}-\d{2}$/.test(et.fim||''))o.entrega.realizada=et.fim});
  return n}
const etChip=s=>{const k=norm(s);const cls=/realizad/.test(k)?'ok':/agendad/.test(k)?'info':k?'warn':'';return `<span class="chip ${cls}">${E(s||'sem E.T. anotada')}</span>`};
const fmtD=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.split('-').reverse().join('/'):(d||'—');
function cardET(o){const e=o.et;if(!e)return '';
  return `<div class="card p-3 mb-3" id="v151-et" style="border-left:4px solid #0d6efd"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><b style="font-size:12px;letter-spacing:.06em">ENTREGA TÉCNICA (E.T.) · anotada pela equipe</b><span class="sub" style="font-size:11px">${E(e.fonte)}</span></div>
   <div class="d-flex gap-4 flex-wrap mt-2"><div><div class="sub" style="font-size:11px">Situação</div>${etChip(e.situacao)}</div><div><div class="sub" style="font-size:11px">Data da E.T. (anotada)</div><b>${E(fmtD(e.data))}</b></div><div><div class="sub" style="font-size:11px">Fim da execução</div><b>${E(fmtD(e.fim))}</b></div>${e.prazo?`<div><div class="sub" style="font-size:11px">Prazo</div><span style="white-space:pre-line">${E(e.prazo)}</span></div>`:''}</div>
   ${e.obs?`<div class="sub mt-2" style="font-size:12px;white-space:pre-line">${E(e.obs)}</div>`:''}</div>`}
try{const o0=SCREENS.obras;if(o0&&!o0.__v151){SCREENS.obras=function(arg){let h=o0.apply(this,arguments);if(typeof h!=='string'||!arg)return h;const o=T_(()=>get('obras',arg),null);if(!o||!o.et)return h;
    const i=h.indexOf('</h1>');if(i<0)return cardET(o)+h;const j=h.indexOf('<div class="row',i);const k=j>=0?j:h.indexOf('<div class="card',i);return k>=0?h.slice(0,k)+cardET(o)+h.slice(k):h+cardET(o)};SCREENS.obras.__v151=1}}catch(e){}
function resumoET(){const O=(S.db.obras||[]).filter(o=>o.et&&o.ativo!==false&&!o.merged_into);if(!O.length)return '';const g={};O.forEach(o=>{const k=o.et.situacao||'sem E.T. anotada';(g[k]=g[k]||[]).push(o)});
  const ord=Object.entries(g).sort((a,b)=>b[1].length-a[1].length);
  return `<div class="card p-3 mb-3" id="v151-et-resumo" style="border-left:4px solid #0d6efd"><b style="font-size:12px;letter-spacing:.06em">ENTREGAS TÉCNICAS (E.T.) · ${E(ET&&ET.fonte||'')}</b>
   <div class="d-flex align-items-baseline gap-3 flex-wrap mt-1"><b style="font-size:24px">${N0(O.length)}</b><span class="sub">obras com E.T. no arquivo</span></div>
   <div class="sub mt-1" style="font-size:12px">${N0(O.length)} = ${ord.map(([k,v])=>`<b>${N0(v.length)}</b> ${E(k)}`).join(' + ')} <span style="color:#198754">✓</span></div>
   ${ord.filter(([k])=>!/realizad|sem E\.T\./i.test(k)).map(([k,v])=>`<div class="mt-2"><b style="font-size:12px">${E(k)}</b> · ${v.map(o=>`<a href="#/obras/${E(o.id)}">${E(o.nome)}</a>${o.et.data?' <span class="sub">('+E(o.et.data)+')</span>':''}`).join(' · ')}</div>`).join('')}</div>`}
try{const s0=SCREENS.posobras;if(s0&&!s0.__v151){SCREENS.posobras=function(){const h=s0.apply(this,arguments);if(typeof h!=='string')return h;const i=h.indexOf('</h1>');const j=i>=0?h.indexOf('<div',h.indexOf('</div>',i)+6):-1;const k=j>=0?h.indexOf('<div class="',j+1):-1;return k>=0?h.slice(0,k)+resumoET()+h.slice(k):h+resumoET()};SCREENS.posobras.__v151=1}}catch(e){}
try{const m0=SCREENS.dbmestra;if(m0&&!m0.__v151){SCREENS.dbmestra=function(){let h=m0.apply(this,arguments);if(typeof h!=='string')return h;const F=S.db._v151||{};const L=F.etSemObra||[];const fund=F.fundidas||[];
    const extra=`${fund.length?`<div class="card p-3 mb-3"><h6 class="m-0 mb-2">Pessoas fundidas (uma pessoa, um cadastro) <span class="chip">${N0(fund.length)}</span></h6>${fund.map(f=>`<div><span class="sub">${E(f.de)} ${E(f.nome)}</span> → <b>${E(f.para)} ${E(f.em)}</b></div>`).join('')}</div>`:''}
      ${L.length?`<div class="card p-3 mb-3"><h6 class="m-0 mb-2">E.T. — linhas do arquivo sem obra no sistema <span class="chip">${N0(L.length)}</span></h6><table class="table table-sm mb-0">${L.map(f=>`<tr><td>${E(f.linha)}</td><td>${E(f.cliente)}</td><td>${E(f.propostas)}</td><td>${E(f.situacao||'—')}</td></tr>`).join('')}</table></div>`:`<div class="sub mb-3" style="font-size:12px">E.T.: todas as ${N0((ET&&ET.rows||[]).length)} linhas do arquivo encontraram a sua obra (chave: linha no Painel). <span style="color:#198754">✓</span></div>`}`;
    const i=h.lastIndexOf('<div class="sub" style="font-size:12px">Fonte:');return i>=0?h.slice(0,i)+extra+h.slice(i):h+extra};SCREENS.dbmestra.__v151=1}}catch(e){}

/* ---------- boot ---------- */
function boot(){try{const db=S.db;if(db.af113_zero||treino())return;const a=fundir(db);const b=etSync(db);
    if(a+b){T_(()=>log('pessoas','v151','v151: '+a+' vínculos reapontados nas fusões, '+b+' obras com E.T.'));T_(()=>save())}}catch(e){console.error('v151',e)}}
boot();
try{const _rm=window.renderMain;window.renderMain=function(){try{const db=S.db;if(db&&!db.af113_zero&&!treino()&&(!db._v151||!db._v151.fundidas||(ET&&db._v151.etQuando!==ET.quando)))boot()}catch(e){}return _rm.apply(this,arguments)}}catch(e){}
})();
