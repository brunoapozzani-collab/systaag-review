/* ======== v123 · COMMISSION — Comissões & RT: forma de pagamento (proporcional / à vista / mensal), via folha sem pagar duas vezes,
   uma só conta para previsto/liberado/comprometido, base da regra respeitada, DRE e 13 semanas com as participações ======== */
(function(){
if(window.__V123_commission)return;window.__V123_commission=true;
const C=window.V123C={};
const T0=()=>{try{return today()}catch(e){return new Date().toISOString().slice(0,10)}};
const r2=v=>Math.round((+v||0)*100)/100;
const fin=v=>Number.isFinite(+v)?+v:0;
const fmtR=v=>(v<0?'−':'')+'R$ '+Math.abs(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pctB=v=>(+v||0).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
const escH=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const encN=s=>encodeURIComponent(String(s)).replace(/'/g,'%27');
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const addMonths=(iso,n)=>{const d=new Date((iso||T0())+'T12:00:00');const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.toISOString().slice(0,10)};
const dBR=s=>s&&s.length>=10?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
const isRuleErr=m=>{try{return new RuleError(m)}catch(e){return new Error(m)}};
const CAT='Comissão / RT';
C.MODOS={proporcional:'Proporcional ao recebimento',avista:'À vista (1 título na confirmação)',mensal:'Mensal (N parcelas iguais)'};
C.MODO_CURTO={proporcional:'proporcional',avista:'à vista',mensal:'mensal'};

/* ---------- 11 · quem é o consultor: helper do bloco "people" quando existir; senão nome completo exato (ou 1º nome ÚNICO) — nunca prefixo ---------- */
C.pessoaDe=function(c){if(c==null||c==='')return null;const F=S.db.folha||[];
 try{if(window.V123&&typeof V123.pessoaDoConsultor==='function'){const r=V123.pessoaDoConsultor(c);if(r){if(typeof r==='object'){const hit=F.find(f=>f===r||(r.id&&f.id===r.id)||(r.nome&&f.nome===r.nome));if(hit)return hit}else{const hit=F.find(f=>f.id===r||f.nome===r);if(hit)return hit}}}}catch(e){}
 if(typeof c==='object')c=c.nome||c.id||'';
 const byId=F.find(f=>f.id&&f.id===c);if(byId)return byId;
 const n=norm(c);if(!n)return null;const ex=F.filter(f=>norm(f.nome)===n);if(ex.length===1)return ex[0];
 if(n.indexOf(' ')<0){const fw=F.filter(f=>norm(f.nome).split(' ')[0]===n);if(fw.length===1)return fw[0]}
 return null};
C.ehConsultor=(f,p)=>(p.consultores||[]).some(c=>C.pessoaDe(c)===f);
const nextYm=ym=>{let [y,m]=ym.split('-').map(Number);m++;if(m>12){m=1;y++}return y+'-'+String(m).padStart(2,'0')};
/* competência da folha: a do mês da data; se a folha desse mês já fechou, a próxima aberta (nunca mexe num mês selado) */
C.compFolha=function(d){d=d||T0();let ym=d.slice(0,7);const ym0=ym;let g=0;try{while(window.FFO&&typeof FFO.fechada==='function'&&FFO.fechada(ym)&&g++<36)ym=nextYm(ym)}catch(e){}return ym===ym0?d:ym+'-01'};
C.viaFolha=function(nome,papel){if(papel==='rt')return false;const f=(S.db.folha||[]).find(f=>f.nome===nome);return !!(f&&f.regime==='CLT'&&f.pagto_participacao==='folha')};
C.parceiroDe=x=>{try{return x.ind_id?indDe(x.ind_id):(S.db.parceiros||[]).find(i=>i.nome===x.nome)}catch(e){return null}};

/* ---------- 9 · base: a do participante/regra; padrão bruto. Migração única: consultor sempre foi pago no bruto ---------- */
C.base=function(p,x){const b=(x&&x.base)||(x&&x.papel==='rt'?'liquido':'bruto');try{return fin(baseVenda24(p,b))}catch(e){try{return fin(M.total(p))}catch(e2){return 0}}};
C.totVenda=p=>{try{return fin(totFin(p))}catch(e){return fin(M.total(p))}};
function migrarBase(){if(S.db.v123c_base)return;let n=0;
 (S.db.folha||[]).forEach(f=>(f.regras||[]).forEach(r=>{if(r.tipo==='venda'&&r.papel==='consultor'&&r.base==='liquido'){r.base='bruto';r.base_v123='consultor sempre foi pago no bruto';n++}}));
 (S.db.propostas||[]).forEach(p=>((p.fin&&p.fin.participantes)||[]).forEach(x=>{if(x.papel==='consultor'&&x.base==='liquido'){x.base='bruto';n++}if(x.papel==='rt'&&!x.base)x.base='liquido'}));
 S.db.v123c_base={em:T0(),ajustes:n}}

/* ---------- 1 · forma de pagamento: padrão da regra / do parceiro, sobreposto por proposta ---------- */
C.regraDe=function(x){const f=(S.db.folha||[]).find(f=>f.nome===x.nome);if(!f)return null;const rs=(f.regras||[]).filter(r=>r.tipo==='venda');return rs.find(r=>r.id===x.regra_id)||rs[0]||null};
C.modoPadrao=function(x){if(x.papel==='rt'){const i=C.parceiroDe(x);return {modo:(i&&i.rt_modo)||'proporcional',meses:(i&&+i.rt_meses)||3}}const r=C.regraDe(x);return {modo:(r&&r.modo)||'proporcional',meses:(r&&+r.meses)||3}};
C.cfg=function(p,x){const d=C.modoPadrao(x);const o=(p.fin&&p.fin.modos&&p.fin.modos[x.nome])||{};const modo=x.modo||o.modo||d.modo;const meses=Math.max(1,Math.round(+(x.meses||o.meses||d.meses)||1));const primeiro=x.primeiro||o.primeiro||addMonths(T0(),1);return {modo:C.MODOS[modo]?modo:'proporcional',meses,primeiro}};

/* ---------- participantes padrão (substitui FN20_default inteiro: sem prefixo, BONIFICAÇÃO da proposta semeia o consultor, base da regra) ---------- */
C.defaultParts=function(p){const out=[];const o=p.obra_id?get('obras',p.obra_id):null;
 const consP=[];(p.consultores||[]).forEach(c=>{const f=C.pessoaDe(c);if(f&&!consP.includes(f))consP.push(f)});
 const split=(p.fin&&p.fin.split)||{};
 (S.db.folha||[]).forEach(f=>(f.regras||[]).filter(r=>r.tipo==='venda'&&+r.pct>0).forEach(r=>{
  const isCons=consP.includes(f);let gestor=false;try{gestor=!!(o&&o.programador&&C.pessoaDe(o.programador)===f)}catch(e){}
  const ok=r.escopo==='todas'||(r.escopo==='proprias'&&isCons)||(r.escopo==='gerencia'&&gestor)||(r.escopo==='loja'&&p.linha==='focal');if(!ok)return;
  let pct=+r.pct;
  if(r.escopo==='proprias'){const tot=(+p.bonificacao>0)?+p.bonificacao:+r.pct;const key=(p.consultores||[]).find(c=>C.pessoaDe(c)===f);const sh=(key!=null&&split[key]!=null)?(+split[key]||0)/100:1/Math.max(1,consP.length);pct=+(tot*sh).toFixed(2)}
  out.push({nome:f.nome,pessoa_id:f.id||null,papel:r.papel||'equipe',pct,base:r.base||'bruto',origem:'regra',regra_id:r.id})}));
 ((p.fin&&p.fin.indicadores)||[]).forEach(x=>{let i=null;try{i=indDe(x.id)}catch(e){}if(i)out.push({nome:i.nome,papel:'rt',pct:+x.pct||0,base:i.rt_base||'liquido',origem:'regra',ind_id:i.id})});
 out.forEach(x=>{const c=C.cfg(p,x);x.modo=c.modo;x.meses=c.meses;x.primeiro=c.primeiro});
 return out};
C.parts=p=>(p.fin&&p.fin.confirmada&&p.fin.participantes)?p.fin.participantes:(p.fin&&p.fin.participantes&&p.fin.participantes.length?p.fin.participantes:C.defaultParts(p));
C.pctEff=function(p,x){let pct=+x.pct||0;try{const f=(S.db.folha||[]).find(f=>f.nome===x.nome);const r=f&&(f.regras||[]).find(r=>r.tipo==='venda'&&r.incentivo);if(r&&x.papel==='consultor'&&FN24.atingiuMeta(f.nome,r.incentivo.acima))pct+=+r.incentivo.extra||0}catch(e){}return pct};
/* ONE function: total de uma participação · comprometido da proposta (Confirmar e Por proposta usam esta) */
C.T=(p,x)=>r2(C.base(p,x)*C.pctEff(p,x)/100);
C.comprometido=function(p,parts){parts=parts||C.parts(p);const v=parts.reduce((a,x)=>a+C.T(p,x),0);const t=C.totVenda(p);return {valor:r2(v),pct:t?v/t*100:0,com:r2(parts.filter(x=>x.papel!=='rt').reduce((a,x)=>a+C.T(p,x),0)),rt:r2(parts.filter(x=>x.papel==='rt').reduce((a,x)=>a+C.T(p,x),0))}};
C.recebido=p=>{try{return fin(FN.recebido(p.id))}catch(e){return 0}};
C.fracRec=p=>{const t=C.totVenda(p);return t>0?Math.min(1,C.recebido(p)/t):0};
C.recs=(p,x)=>(S.db.lancamentos||[]).filter(l=>l.categoria===CAT&&l.origem_id===p.id&&l.pessoa===x.nome&&(l.tipo_regra||'venda')==='venda'&&(l.origem||'proposta')==='proposta');
const bruto=l=>l.bruto_part!=null?+l.bruto_part:+l.valor||0;
C.numeros=function(p,x){const T=C.T(p,x);const rs=C.recs(p,x);const ger=rs.reduce((a,l)=>a+bruto(l),0);const pago=rs.filter(l=>l.pago_em).reduce((a,l)=>a+bruto(l),0);const cfg=C.cfg(p,x);const conf=!!(p.fin&&p.fin.confirmada);let lib;
 if(!conf)lib=0;else if(cfg.modo==='proporcional')lib=T*C.fracRec(p);else if(cfg.modo==='avista')lib=T;else{const fut=rs.filter(l=>!l.pago_em&&l.vencimento>T0()).reduce((a,l)=>a+bruto(l),0);lib=Math.max(0,Math.min(T,ger)-fut)}
 lib=Math.max(lib,pago);return {T:r2(T),liberado:r2(Math.min(Math.max(T,pago),lib)),gerado:r2(ger),pago:r2(pago),aberto:r2(ger-pago),saldo:r2(Math.max(0,T-pago)),modo:cfg.modo,meses:cfg.meses,primeiro:cfg.primeiro,viaFolha:C.viaFolha(x.nome,x.papel)}};
C.modoLb=(p,x)=>{const c=C.cfg(p,x);return c.modo==='mensal'?`Mensal ${c.meses}×`:c.modo==='avista'?'À vista':'Proporcional'};

/* ---------- geração de títulos ---------- */
C.criar=function(p,x,v,o){v=r2(v);if(v<0.5)return null;const via=C.viaFolha(x.nome,x.papel);let comp=0;try{comp=fin(FN24.compensar(x.nome,v))}catch(e){}let retido=false;try{retido=!!(S.db.regras.trava_margem&&FN24.margemReal(p)<S.db.regras.margem_min/100)}catch(e){}
 const venc=o.venc||(typeof dplus==='function'?dplus(x.papel==='rt'?10:5):T0());const cfg=C.cfg(p,x);
 const l={id:uid('l'),tipo:via?'folha_part':'pagar',origem:'proposta',origem_id:p.id,valor:r2(v-comp),bruto_part:v,vencimento:venc,pago_em:null,categoria:CAT,sub:x.papel==='rt'?'rt':'com',papel:x.papel,pessoa:x.nome,pessoa_id:x.ind_id||x.pessoa_id||null,quem:x.nome+(x.papel==='rt'?' · RT':' · comissão'),parcela:o.label+(comp?` · −${fmtR(comp)} compensação`:''),gerado_em:via?C.compFolha(o.comp||T0()):T0(),criado_em:T0(),tipo_regra:'venda',retido,pct_aplicado:C.pctEff(p,x),modo:cfg.modo,via_folha:via};
 if(o.n){l.parcela_n=o.n;l.parcela_tot=o.tot}
 put('lancamentos',l,`${(PAPEL_LB&&PAPEL_LB[x.papel])||x.papel} · ${x.nome} · ${C.MODO_CURTO[cfg.modo]}${via?' · via folha':''}`);return l};
/* proporcional: acumulado devido = total × (recebido ÷ vendido) − já gerado (idempotente, nunca passa do total) */
C.gerarProp=function(p,label){if(!p||!p.fin||!p.fin.confirmada)return;(p.fin.participantes||[]).forEach(x=>{if(C.cfg(p,x).modo!=='proporcional')return;const T=C.T(p,x);const devido=Math.min(T,T*C.fracRec(p));const ger=C.recs(p,x).reduce((a,l)=>a+bruto(l),0);const d=devido-ger;if(d>=0.5)C.criar(p,x,d,{label})})};
/* reprograma UMA participação: apaga os títulos ABERTOS e refaz o saldo (total − pago) na forma escolhida */
C.sync=function(p,x,motivo){if(!p.fin||!p.fin.confirmada)return;const cfg=C.cfg(p,x);x.modo=cfg.modo;x.meses=cfg.meses;x.primeiro=cfg.primeiro;
 const rs=C.recs(p,x);const abertos=new Set(rs.filter(l=>!l.pago_em).map(l=>l.id));if(abertos.size)S.db.lancamentos=S.db.lancamentos.filter(l=>!abertos.has(l.id));
 const T=C.T(p,x);const pago=rs.filter(l=>l.pago_em).reduce((a,l)=>a+bruto(l),0);const pre=pago>0?'saldo reprogramado · ':'';
 if(cfg.modo==='proporcional'){const d=Math.min(T,T*C.fracRec(p))-pago;if(d>=0.5)C.criar(p,x,d,{label:pre+'proporcional ao já recebido'+(motivo?' · '+motivo:'')})}
 else if(cfg.modo==='avista'){C.criar(p,x,T-pago,{label:pre+'à vista — total da participação'+(motivo?' · '+motivo:'')})}
 else{const n=cfg.meses;const resto=T-pago;if(resto>=0.5){const parc=r2(resto/n);for(let i=0;i<n;i++){const v=i===n-1?r2(resto-parc*(n-1)):parc;const venc=addMonths(cfg.primeiro,i);C.criar(p,x,v,{label:pre+`mensal ${i+1}/${n}`,venc,comp:venc,n:i+1,tot:n})}}}};
C.syncAll=function(p,motivo){(p.fin.participantes||[]).forEach(x=>C.sync(p,x,motivo))};

/* engine hooks — FN20.gerar is what every receipt/confirm path calls */
try{FN20_default=function(p){return C.defaultParts(p)}}catch(e){}
if(typeof FN20==='object'){FN20.gerar=function(p,l,motivo){C.gerarProp(p,((l&&l.categoria)||'parcela')+(motivo?' · '+motivo:''))};
 FN20.comprometido=p=>C.comprometido(p).valor;
 FN20.porPessoa=function(nome){const rows=[];FN.vendidas().forEach(p=>{const x=(p.fin.participantes||[]).find(x=>x.nome===nome);if(!x)return;const n=C.numeros(p,x);let pc={tot:0,pag:0,ratio:0};try{pc=FN.parcelas(p.id)}catch(e){}rows.push({p,x,tot:C.totVenda(p),previsto:n.T,liberado:n.liberado,gerado:n.gerado,pago:n.pago,pc,modo:n.modo,n})});return rows};
 if(FN20.ganhosMes){const _g=FN20.ganhosMes;FN20.ganhosMes=function(pp,mk){const g=_g.apply(this,arguments);try{if(g&&pp&&C.viaFolha(pp.nome)&&Number.isFinite(g.liquidoBase)){g.total=r2(g.liquidoBase+(+g.ajuste||0));g.viaFolha=true}}catch(e){}return g}}}

/* confirmar venda: participantes já nascem com a forma escolhida; à vista / mensal criam os títulos agora */
if(typeof A==='object'&&A.confirmarVenda){const _cv=A.confirmarVenda;A.confirmarVenda=function(pr){const r=_cv.apply(A,arguments);try{const p=get('propostas',pr);if(p&&p.fin&&p.fin.confirmada){(p.fin.participantes||[]).forEach(x=>{const c=C.cfg(p,x);x.modo=c.modo;x.meses=c.meses;x.primeiro=c.primeiro;if(!x.base)x.base=x.papel==='rt'?'liquido':'bruto'});(p.fin.participantes||[]).forEach(x=>{if(x.modo!=='proporcional')C.sync(p,x,'na confirmação')});C.gerarProp(p,'acerto: recebido antes da confirmação');put('propostas',p,'formas de pagamento das participações')}}catch(e){console.warn('v123c confirmar',e)}return r}}

/* ações da tela */
const gateOk=()=>{try{if(typeof gate==='function')gate()}catch(e){throw e}};
Object.assign(A,{
 setModoPart(pr,nome,k,v){gateOk();const p=get('propostas',pr);if(!p||!p.fin)throw isRuleErr('Proposta sem dados financeiros.');nome=decodeURIComponent(nome);
  const val=k==='meses'?Math.max(1,Math.min(60,Math.round(+v)||1)):v;if(k==='modo'&&!C.MODOS[val])throw isRuleErr('Forma inválida.');
  if(p.fin.confirmada&&p.fin.participantes){const x=p.fin.participantes.find(x=>x.nome===nome);if(!x)throw isRuleErr('Participante não encontrado.');x[k]=val;x.origem_modo='manual';C.sync(p,x,'forma alterada');put('propostas',p,`${nome}: ${k}=${val}`)}
  else{p.fin.modos=p.fin.modos||{};const m=p.fin.modos[nome]=p.fin.modos[nome]||{};m[k]=val;put('propostas',p,`${nome}: ${k}=${val} (vale na confirmação)`)}},
 setModoRegra(nomeP,rid,k,v){gateOk();nomeP=decodeURIComponent(nomeP);const f=(S.db.folha||[]).find(f=>f.nome===nomeP);const r=f&&(f.regras||[]).find(r=>r.id===rid);if(!r)throw isRuleErr('Regra não encontrada.');r[k]=k==='meses'?Math.max(1,Math.min(60,Math.round(+v)||1)):v;try{log('folha',nomeP,'forma de pagamento da regra',null,k+'='+v)}catch(e){}save()},
 setModoParceiro(id,k,v){gateOk();let i=null;try{i=indDe(id)}catch(e){}i=i||(S.db.parceiros||[]).find(x=>x.id===id);if(!i)throw isRuleErr('Parceiro não encontrado.');i[k==='meses'?'rt_meses':'rt_modo']=k==='meses'?Math.max(1,Math.min(60,Math.round(+v)||1)):v;try{log('parceiros',id,'forma de pagamento da RT',null,k+'='+v)}catch(e){}save()},
});

/* 2 · via folha: nunca pagar à parte; a folha fechada quita */
if(A.pagar){const _pg=A.pagar;A.pagar=function(lid){const l=get('lancamentos',lid);if(l&&l.categoria===CAT&&(l.via_folha||l.tipo==='folha_part'))throw isRuleErr('Esta participação é paga dentro da folha (CLT) — não se paga à parte. Ela é quitada quando a folha do mês fecha.');return _pg.apply(A,arguments)}}
function migrarViaFolha(){if(S.db.v123c_folha)return;let n=0;(S.db.lancamentos||[]).forEach(l=>{if(l.categoria===CAT&&!l.pago_em&&l.tipo==='pagar'&&l.origem==='proposta'&&C.viaFolha(l.pessoa,l.papel)){l.tipo='folha_part';l.via_folha=true;n++}});S.db.v123c_folha={em:T0(),n}}
C.quitarFolha=function(ym){let n=0,v=0;let data=T0();try{data=FFO.dataCaixa(ym,'salarios')||data}catch(e){}(S.db.lancamentos||[]).forEach(l=>{if(l.categoria===CAT&&l.tipo==='folha_part'&&!l.pago_em&&String(l.gerado_em||l.vencimento||'').slice(0,7)===ym){l.pago_em=data;l.quitado_folha=ym;n++;v+=+l.valor||0}});if(n)save();return {n,v:r2(v)}};
function hookFolha(){try{if(window.FFO&&typeof FFO.fechar==='function'&&!FFO.fechar.__v123c){const _f=FFO.fechar;FFO.fechar=function(ym){const r=_f.apply(this,arguments);try{C.quitarFolha((r&&r.ym)||ym||T0().slice(0,7))}catch(e){}return r};FFO.fechar.__v123c=1}
 if(window.FFO&&typeof FFO.reabrir==='function'&&!FFO.reabrir.__v123c){const _r=FFO.reabrir;FFO.reabrir=function(ym){const r=_r.apply(this,arguments);try{const y=ym||T0().slice(0,7);(S.db.lancamentos||[]).forEach(l=>{if(l.quitado_folha===y){l.pago_em=null;delete l.quitado_folha}});save()}catch(e){}return r};FFO.reabrir.__v123c=1}}catch(e){}}

/* 4 · liberado pelo VALOR recebido (não pela contagem de parcelas) */
if(FN.parcelas){const _pc=FN.parcelas;FN.parcelas=function(pr){const o=_pc.apply(FN,arguments);try{const p=get('propostas',pr);if(p&&o){const t=C.totVenda(p);o.ratio=t>0?Math.min(1,C.recebido(p)/t):0;o.porValor=true}}catch(e){}return o}}
FN.comissoes=function(){return FN.vendidas().map(p=>{const tot=C.totVenda(p);let pc={tot:0,pag:0,ratio:0};try{pc=FN.parcelas(p.id)}catch(e){}const parts=p.fin.participantes||[];const N=parts.map(x=>[x,C.numeros(p,x)]);const s=(f,k)=>r2(N.filter(([x])=>f(x)).reduce((a,[,n])=>a+n[k],0));const isR=x=>x.papel==='rt',notR=x=>x.papel!=='rt';const o=p.obra_id?get('obras',p.obra_id):null;let esc='—';try{esc=o?get('clientes',o.cliente_id).arquiteto:'—'}catch(e){}return {p,tot,pc,com:s(notR,'T'),rt:s(isR,'T'),comLib:s(notR,'liberado'),rtLib:s(isR,'liberado'),comL:s(notR,'gerado'),rtL:s(isR,'gerado'),comPago:s(notR,'pago'),rtPago:s(isR,'pago'),esc}})};

/* 3 · 9 · plano da proposta (DRE, obra, margem) com a mesma conta, nunca NaN */
if(FN.propPlano){const _pp=FN.propPlano;FN.propPlano=function(p){const pl=_pp.apply(FN,arguments);try{if(p&&p.fin){const c=C.comprometido(p);pl.com=c.com;pl.rt=c.rt}pl.com=fin(pl.com);pl.rt=fin(pl.rt);pl.custo=fin(pl.equipC)+fin(pl.moC)+fin(pl.imp)+pl.com+pl.rt+fin(pl.frete)}catch(e){}return pl}}
if(typeof FS==='object'&&FS.dre){const _dre=FS.dre;FS.dre=function(m,uni){const L=_dre.apply(this,arguments);try{if(!L||m!==T0().slice(0,7))return L;let com=0,rt=0;
  FN.obras().forEach(r=>(r.porProposta||[]).forEach(x=>{if(uni&&x.unidade!==uni)return;if(!(x.p&&x.p.fin&&x.p.fin.confirmada))return;com+=fin(x.com)*fin(x.av);rt+=fin(x.rt)*fin(x.av)}));
  try{FN.focal().filter(x=>!x.obra).forEach(({p,pl})=>{if(uni&&unidadeDaProposta(p)!==uni)return;if(!(p.fin&&p.fin.confirmada))return;com+=fin(pl.com);rt+=fin(pl.rt)})}catch(e){}
  L.comissao=r2(com);L.rt=r2(rt);L.variaveis=r2(L.comissao+L.rt);L.mc=r2(fin(L.recLiq)-fin(L.cmv)-fin(L.diretos)-L.variaveis);L.mcPct=L.receita?L.mc/L.receita:0;L.ebitda=r2(L.mc-fin(L.fixas));L.res=r2(L.ebitda-fin(L.financeiro))}catch(e){}return L}}

/* 10 · 13 semanas: participações projetadas das parcelas futuras + as que saem pela folha */
C.saidas13=function(sem){const out=sem.map(()=>0);const idx=d=>{for(let i=0;i<sem.length;i++){const w=sem[i];if(i===0?d<=w.fim:(d>=w.inicio&&d<=w.fim))return i}return -1};
 (S.db.lancamentos||[]).forEach(l=>{if(l.categoria===CAT&&l.tipo==='folha_part'&&!l.pago_em){const i=idx(l.vencimento);if(i>=0)out[i]+=+l.valor||0}});
 FN.vendidas().forEach(p=>{const t=C.totVenda(p);if(!(t>0))return;const pr=(p.fin.participantes||[]).filter(x=>C.cfg(p,x).modo==='proporcional');if(!pr.length)return;
  (S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&l.origem_id===p.id&&!l.pago_em&&l.vencimento&&l.vencimento<'9999').forEach(l=>{pr.forEach(x=>{const v=C.T(p,x)*(+l.valor||0)/t;const d=typeof addDays==='function'?addDays(l.vencimento,x.papel==='rt'?10:5):l.vencimento;const i=idx(d);if(i>=0)out[i]+=v})})});
 return out.map(r2)};
C.com13=function(_s){const w=function(){const out=_s.apply(this,arguments);try{if(!Array.isArray(out)||!out.length)return out;const add=C.saidas13(out);if(!add.some(v=>v))return out;const min=+PF().caixaMinimo||0;let saldo=out[0].saldoFinal-out[0].entradas+out[0].saidas;out.forEach((w,i)=>{w.participacoes=add[i];w.saidas=r2(w.saidas+add[i]);saldo=r2(saldo+w.entradas-w.saidas);w.saldoFinal=saldo;w.abaixoDoMinimo=saldo<min})}catch(e){}return out};Object.keys(_s).forEach(k=>{try{w[k]=_s[k]}catch(e){}});w.__v123c=1;return w};
if(FN.semanas13&&!FN.semanas13.__v123c){FN.semanas13=C.com13(FN.semanas13)}
/* o motor ORIGINAL que a prova do caixa da folha usa como referência também passa a ver as participações — senão ela acusa a diferença como erro */
try{if(window.FFO&&FFO.__orig&&typeof FFO.__orig['FN.semanas13']==='function'&&!FFO.__orig['FN.semanas13'].__v123c)FFO.__orig['FN.semanas13']=C.com13(FFO.__orig['FN.semanas13'])}catch(e){}
if(typeof FS==='object'&&FS.fluxo13){const _f13=FS.fluxo13;FS.fluxo13=function(){const F=_f13.apply(this,arguments);try{(F.cols||[]).forEach((c,i)=>{const a=fin(c.w&&c.w.participacoes);if(a&&c.X){c.X.outras=r2(fin(c.X.outras)+a);c.X.total=r2(fin(c.X.total)+a)}if(i>0&&F.sem[i-1])c.saldoIni=F.sem[i-1].saldoFinal})}catch(e){}return F}}

/* 6 · 9 · editor: BONIFICAÇÃO semeia o consultor antes do Vendido; depois é só leitura com o % real · RT na margem sobre o bruto */
C.vendida=p=>!!(p&&(['vendida','em_obra','concluida'].includes(p.estado)||(p.fin&&p.fin.confirmada)));
C.pctConsultorReal=p=>{const ps=C.parts(p).filter(x=>x.papel==='consultor');return r2(ps.reduce((a,x)=>a+(+x.pct||0),0))};
if(A.setP){const _sp=A.setP;A.setP=function(pr,k,v){if(k==='bonificacao'){const p=get('propostas',pr);if(C.vendida(p))throw isRuleErr('Venda já fechada: a comissão do consultor agora é a participação dele no Financeiro (Comissões & RT › Por proposta). '+pctB(C.pctConsultorReal(p))+' hoje.')}return _sp.apply(A,arguments)}}
/* margem do editor: fórmula ORIGINAL do Excel (RT sobre total − impostos; incentivo sobre o total) — não mexemos */

/* ---------- telas ---------- */
const modoSel=(id,cur,on)=>`<select id="${id}" class="form-select form-select-sm d-inline-block" style="width:auto;font-size:12px" onchange="${on}">${Object.entries(C.MODOS).map(([k,l])=>`<option value="${k}" ${cur===k?'selected':''}>${l}</option>`).join('')}</select>`;
C.modoCells=function(p,x,i,pref){const c=C.cfg(p,x);const nm=encN(x.nome);const call=k=>`run(()=>A.setModoPart('${p.id}','${nm}','${k}',this.value),'Forma de pagamento salva')`;
 let extra=c.modo==='mensal'?` <input id="${pref}n_${p.id}_${i}" type="number" min="1" max="60" class="form-control form-control-sm d-inline-block text-end" style="width:58px" value="${c.meses}" onchange="${call('meses')}">× a partir de <input id="${pref}d_${p.id}_${i}" type="date" class="form-control form-control-sm d-inline-block" style="width:140px" value="${c.primeiro}" onchange="${call('primeiro')}">`:c.modo==='avista'?' <span class="sub">um título com o total</span>':' <span class="sub">a cada recebimento do cliente</span>';
 return modoSel(`${pref}m_${p.id}_${i}`,c.modo,call('modo'))+extra+(C.viaFolha(x.nome,x.papel)?' <span class="chip info" title="CLT: entra no holerite do mês, não vira título à parte">via folha</span>':'')};
const papelChip=x=>`<span class="chip ${x.papel==='rt'?'pur':x.papel==='socio'?'info':''}">${(typeof PAPEL_LB==='object'&&PAPEL_LB[x.papel])||x.papel}</span>`;
const BASE_TXT=b=>({bruto:'bruto',liquido:'líquido de impostos (como no Excel)',equip:'só equipamentos',servico:'só serviços'}[b||'bruto']||b);

/* Confirmar venda (A receber › Vendas a confirmar) */
C.blocoConfirmar=function(p){const parts=C.defaultParts(p);const c=C.comprometido(p,parts);const t=C.totVenda(p);
 return `<div class="mt-2" data-v123c-conf="${p.id}" data-comp="${c.valor}"><b>Confirmar vai gerar — e como cada um recebe:</b><div class="tblwrap mt-1"><table class="tbl" style="font-size:12px"><thead><tr><th>Quem</th><th>Papel</th><th>%</th><th>Base</th><th class="text-end">Total</th><th>Como pagar</th></tr></thead><tbody>${parts.map((x,i)=>`<tr data-i="${i}" data-nome="${escH(x.nome)}" data-t="${C.T(p,x)}"><td><b>${escH(x.nome)}</b></td><td>${papelChip(x)}</td><td>${pctB(x.pct)}</td><td class="sub">${BASE_TXT(x.base)}</td><td class="text-end"><b>${fmtR(C.T(p,x))}</b></td><td class="text-nowrap">${C.modoCells(p,x,i,'cf')}</td></tr>`).join('')}</tbody></table></div><div class="d-flex flex-wrap gap-2 mt-1"><span>= <b data-v123c-total="${p.id}">${fmtR(c.valor)}</b> em participações (<b>${c.pct.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</b> do vendido ${fmtR(t)})</span>`};
function patchReceber(h){let vendas=[];try{vendas=FN.aConfirmar()}catch(e){return h}vendas.forEach(p=>{try{const a=h.indexOf(`<b>${p.numero} · quem indicou (RT):</b>`);if(a<0)return;const b=h.indexOf('<b>Confirmar vai gerar:</b>',a);if(b<0)return;const s=h.lastIndexOf('<div class="mt-2 d-flex flex-wrap align-items-center gap-2">',b);const e=h.indexOf('</div>',b);if(s<0||e<0)return;const seg=h.slice(s,e);const mg=(seg.match(/<span class="ms-auto">margem[\s\S]*$/)||[''])[0];h=h.slice(0,s)+C.blocoConfirmar(p)+(mg?' '+mg:'')+'</div></div>'+h.slice(e+6)}catch(err){}});return h}

/* Comissões & RT › Por proposta */
C.tabelaProposta=function(p){const parts=p.fin.participantes||[];const N=parts.map(x=>C.numeros(p,x));const S_=k=>r2(N.reduce((a,n)=>a+n[k],0));const fr=C.fracRec(p);
 return `<div class="tblwrap mt-1" data-v123c-prop="${p.id}"><table class="tbl" style="font-size:12.5px"><thead><tr><th>Nome</th><th>Papel</th><th>%</th><th>Como pagar</th><th class="text-end">Previsto</th><th class="text-end" title="proporcional: total × recebido ÷ vendido (${(fr*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% do valor) · à vista: total · mensal: parcelas já vencidas">Liberado</th><th class="text-end">Gerado</th><th class="text-end">Pago</th><th class="text-end">Saldo</th><th></th></tr></thead><tbody>${parts.map((x,i)=>{const n=N[i];return `<tr onclick="event.stopPropagation()" data-pessoa="${escH(x.nome)}" data-t="${n.T}" data-lib="${n.liberado}" data-ger="${n.gerado}" data-pago="${n.pago}"><td><b>${escH(x.nome)}</b> <span class="sub">${x.origem==='manual'?'· manual':'· regra'}</span></td><td><select class="form-select form-select-sm" onchange="run(()=>A.setPart('${p.id}',${i},'papel',this.value),'')">${Object.entries(PAPEL_LB).map(([k,l])=>`<option value="${k}" ${x.papel===k?'selected':''}>${l}</option>`).join('')}</select></td><td><input type="number" step="0.5" class="form-control form-control-sm text-end" style="width:70px" value="${x.pct}" onchange="run(()=>A.setPart('${p.id}',${i},'pct',this.value),'Participação alterada — vale para as próximas parcelas')"></td><td class="text-nowrap">${C.modoCells(p,x,i,'pp')}</td><td class="text-end">${fmtR(n.T)}</td><td class="text-end" style="color:#198754">${fmtR(n.liberado)}</td><td class="text-end">${fmtR(n.gerado)}</td><td class="text-end">${fmtR(n.pago)}</td><td class="text-end"><b>${fmtR(n.saldo)}</b></td><td><button class="btn-soft" style="font-size:11px" onclick="run(()=>A.delPart('${p.id}',${i}),'Removido')">remover</button></td></tr>`}).join('')}<tr style="font-weight:700"><td colspan="4">Total · ${fmtR(S_('T'))} = ${fmtR(S_('pago'))} pago + ${fmtR(r2(S_('gerado')-S_('pago')))} em aberto + ${fmtR(r2(S_('T')-S_('gerado')))} a gerar</td><td class="text-end">${fmtR(S_('T'))}</td><td class="text-end">${fmtR(S_('liberado'))}</td><td class="text-end">${fmtR(S_('gerado'))}</td><td class="text-end">${fmtR(S_('pago'))}</td><td class="text-end">${fmtR(S_('saldo'))}</td><td></td></tr></tbody></table></div><div class="sub" style="font-size:11px">Mudar a forma antes de pagar refaz os títulos em aberto; depois de algo pago, só o saldo é reprogramado. Quem é CLT com participação via folha recebe no holerite — nunca em título à parte.</div>`};
function patchPropostas(h){FN.vendidas().forEach(p=>{try{const k=`onclick="remProp=remProp==='${p.id}'?null:'${p.id}';render()"`;const a=h.indexOf(k);if(a>=0){const e=h.indexOf('</tr>',a);const seg=h.slice(a,e);const j=seg.lastIndexOf('<td class="text-end">');if(j>=0){const c=C.comprometido(p);const k2=seg.indexOf('</td>',j);const seg2=seg.slice(0,j)+`<td class="text-end" data-v123c-comp="${p.id}" data-comp="${c.valor}">${fmtR(c.valor)}</td>`+seg.slice(k2+5);h=h.slice(0,a)+seg2+h.slice(e)}}
 if(typeof remProp!=='undefined'&&remProp===p.id){const b=h.indexOf(`<b>Participações da ${p.numero}</b>`);if(b<0)return;const s=h.indexOf('<div class="tblwrap mt-1"><table class="tbl" style="font-size:12.5px"><thead><tr><th>Nome</th>',b);if(s<0)return;const e2=h.indexOf('</table></div>',s);h=h.slice(0,s)+C.tabelaProposta(p)+h.slice(e2+14)}}catch(err){}});
 return h.replace('Mudar aqui só afeta as parcelas que ainda vão ser recebidas; títulos já gerados ficam como estão (Rastro).','')}
/* Pessoas e regras: o texto do gatilho vira a escolha da forma de pagamento padrão da regra */
function patchPessoas(h){return h.replace(/<span class="sub">a cada parcela recebida<\/span>( · <select [^>]*onchange="run\(\(\)=>A\.setRegra\('([^']*)','([^']*)','papel')/g,(m,rest,nome,rid)=>{const f=(S.db.folha||[]).find(f=>f.nome===nome);const r=f&&(f.regras||[]).find(r=>r.id===rid);const modo=(r&&r.modo)||'proporcional';const nm=encN(nome);const id=`rg_${rid}`;return `<span class="text-nowrap">pago: ${modoSel('rgm_'+rid,modo,`run(()=>A.setModoRegra('${nm}','${rid}','modo',this.value),'Forma padrão salva — vale para as próximas vendas')`)}${modo==='mensal'?` em <input id="rgn_${rid}" type="number" min="1" class="form-control form-control-sm d-inline-block text-end" style="width:56px" value="${(r&&r.meses)||3}" onchange="run(()=>A.setModoRegra('${nm}','${rid}','meses',this.value),'Salvo')">×`:''}${C.viaFolha(nome)?' <span class="chip info">via folha</span>':''}</span>`+rest})}
/* Indicadores (RT): liberada pela forma de pagamento + forma padrão da RT de cada parceiro */
function patchIndicadores(h){let soma=0,old=0;(S.db.parceiros||[]).forEach(i=>{let lib=0,o=0;FN.vendidas().forEach(p=>{(p.fin.participantes||[]).filter(x=>x.papel==='rt'&&(x.ind_id===i.id||(!x.ind_id&&x.nome===i.nome))).forEach(x=>{lib+=C.numeros(p,x).liberado})});(FN.vendidas()).forEach(p=>{const ii=(p.fin.indicadores||[]).find(x=>x.id===i.id);if(ii)o+=fin(M.total(p))*(+ii.pct||0)/100*fin(FN.parcelas(p.id).ratio)});soma+=lib;old+=o;
  const a=h.indexOf(`<tr><td><b>${i.nome}</b>`);if(a<0)return;const e=h.indexOf('</tr>',a);let seg=h.slice(a,e);seg=seg.replace(/<div style="color:#198754">liberada R\$ [^<]*<\/div>/,`<div style="color:#198754" data-v123c-rtlib="${i.id}" data-v="${r2(lib)}">liberada ${fmtR(lib)}</div>`);seg=seg.replace(/(<div class="sub">paga R\$ [^<]*<\/div>)/,`$1<div class="text-nowrap" style="font-size:11.5px">RT paga: ${modoSel('indm_'+i.id,i.rt_modo||'proporcional',`run(()=>A.setModoParceiro('${i.id}','modo',this.value),'Forma padrão da RT salva — vale para as próximas vendas')`)}${i.rt_modo==='mensal'?` <input type="number" min="1" class="form-control form-control-sm d-inline-block text-end" style="width:52px" value="${i.rt_meses||3}" onchange="run(()=>A.setModoParceiro('${i.id}','meses',this.value),'Salvo')">×`:''}</div>`);h=h.slice(0,a)+seg+h.slice(e)});
 return h.replace(/(RT LIBERADA<\/div><div class="v[^"]*">)R\$ [^<]*(<\/div><div class="s">)[^<]*/,`$1${fmtR(soma)}$2pela forma de pagamento de cada RT`)}
/* A pagar (aba da Remuneração): via folha não tem botão Pagar */
function patchLiberar(h){(S.db.lancamentos||[]).forEach(l=>{if(l.categoria===CAT&&!l.pago_em&&l.tipo==='folha_part'){const mk=String(l.gerado_em||l.vencimento||'').slice(0,7);h=h.split(`onclick="run(()=>A.pagar('${l.id}'),'Pago')">Pagar</button>`).join(`disabled title="paga no holerite">Pagar</button> <span class="chip info">via folha ${mk.slice(5,7)}/${mk.slice(0,4)}</span>`)}});return h.replace('Gerados por parcela recebida — a pagar','Participações a pagar (proporcional, à vista e mensal)').replace('Cada linha nasceu de uma parcela que o cliente pagou. Pagar aqui = quitar em contas a pagar.','Cada linha mostra a forma escolhida pelo Financeiro. "via folha" = CLT, entra no holerite do mês e é quitada quando a folha fecha.')}
if(typeof SCREENS==='object'&&SCREENS.fcontas){const _fc=SCREENS.fcontas;SCREENS.fcontas=function(arg){let h=_fc.apply(this,arguments);try{if(typeof h!=='string'||arg!=='comissoes')return h;const sub=(location.hash.split('/')[3]||'').replace(/[^a-z]/g,'')||'pessoas';if(sub==='propostas')h=patchPropostas(h);else if(sub==='pessoas')h=patchPessoas(h);else if(sub==='indicadores')h=patchIndicadores(h);else if(sub==='liberar')h=patchLiberar(h)}catch(e){console.warn('v123c fcontas',e)}return h}}
if(typeof SCREENS==='object'&&SCREENS.receber){const _rc=SCREENS.receber;SCREENS.receber=function(){let h=_rc.apply(this,arguments);try{if(typeof h==='string')h=patchReceber(h)}catch(e){}return h}}
/* Ficha: forma de pagamento ao lado do % de cada venda */
if(typeof colaborador18==='function'){const _cb=colaborador18;colaborador18=function(nome){let h=_cb.apply(this,arguments);try{FN.vendidas().forEach(p=>{const x=(p.fin.participantes||[]).find(x=>x.nome===nome);if(!x)return;const a=h.indexOf(`<td><b>${p.numero}</b> <span class="sub">`);if(a<0)return;const b=h.indexOf('</td>',a)+5;const c2=h.indexOf('</td>',b);if(c2<0)return;const n=C.numeros(p,x);h=h.slice(0,b)+`<td data-v123c-ficha="${p.id}" data-lib="${n.liberado}" data-pago="${n.pago}">${pctB(x.pct)} <span class="chip">${C.modoLb(p,x)}</span>${n.viaFolha?' <span class="chip info">via folha</span>':''}`+h.slice(c2)});if(C.viaFolha(nome))h=h.replace('Comissões / participações geradas no mês</dt>','Comissões / participações geradas no mês <span class="sub">(via folha — já dentro do salário líquido acima)</span></dt>')}catch(e){}return h}}
/* Editor: BONIFICAÇÃO só leitura depois do Vendido; texto da base do RT */
if(typeof SCREENS==='object'&&SCREENS.editor){const _ed=SCREENS.editor;SCREENS.editor=function(id){let h=_ed.apply(this,arguments);try{if(typeof h!=='string')return h;const p=get('propostas',id);if(p&&C.vendida(p)){const real=C.pctConsultorReal(p);h=h.replace(/<input([^>]*)value="[^"]*"([^>]*)onchange="run\(\(\)=>A\.setP\('[^']+','bonificacao'[^"]*"([^>]*)>/g,(m,a,b,c)=>`<input${a}value="${real}"${b}readonly disabled data-v123c-bon="${real}" title="Venda fechada: este é o % real do consultor no Financeiro (Comissões & RT › Por proposta)"${c}>`)}}catch(e){}return h}}

/* ---------- 8 · migrações únicas (sem perder nada) ---------- */
function backfill(){if(S.db.v123c_backfill)return;const feitos=[];FN.vendidas().forEach(p=>{const antes=(S.db.lancamentos||[]).length;(p.fin.participantes||[]).forEach(x=>{if(!x.modo)x.modo='proporcional';if(!x.base)x.base=x.papel==='rt'?'liquido':'bruto'});C.gerarProp(p,'acerto v123: parcelas já recebidas sem título');const n=(S.db.lancamentos||[]).length-antes;if(n)feitos.push({pr:p.numero,n})});
 (S.db.lancamentos||[]).forEach(l=>{if(l.categoria===CAT&&!l.quem&&l.pessoa)l.quem=l.pessoa+(l.papel==='rt'||l.sub==='rt'?' · RT':' · comissão')});
 S.db.v123c_backfill={em:T0(),feitos}}
function migrarRtExcel(){if(S.db.v123c_rtbase)return;const log0=[];
 (S.db.propostas||[]).forEach(p=>((p.fin&&p.fin.participantes)||[]).forEach(x=>{if(x.papel==='rt'&&x.base!=='liquido'){x.base_antes=x.base||null;x.base='liquido'}}));
 FN.vendidas().forEach(p=>(p.fin.participantes||[]).filter(x=>x.papel==='rt').forEach(x=>{const ab=C.recs(p,x).filter(l=>!l.pago_em);if(!ab.length)return;const antes=r2(ab.reduce((a,l)=>a+bruto(l),0));if(!x.modo)x.modo='proporcional';C.sync(p,x,'RT na base do Excel (total − impostos)');const depois=r2(C.recs(p,x).filter(l=>!l.pago_em).reduce((a,l)=>a+bruto(l),0));log0.push({pr:p.numero,rt:x.nome,antes,depois,ids_antes:ab.map(l=>l.id)})}));
 S.db.v123c_rtbase={em:T0(),base:'liquido (total − impostos, igual ao Excel)',recalculados:log0}}
function boot(){try{migrarBase()}catch(e){console.warn('v123c base',e)}try{migrarViaFolha()}catch(e){console.warn('v123c folha',e)}try{migrarRtExcel()}catch(e){console.warn('v123c rt',e)}try{backfill()}catch(e){console.warn('v123c backfill',e)}try{save()}catch(e){}hookFolha()}
boot();setTimeout(hookFolha,0);
})();
