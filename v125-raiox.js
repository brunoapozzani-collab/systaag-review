/* =====================================================================================================
   v125 · VISÃO CEO — RAIO-X POR UNIDADE (30/10/2026)
   Bruno: "you keep the same format and only swap the numbers per department — put graphs and visual
   representation so each department is easy to understand".
   · Empresa: as unidades lado a lado — a ponte de unidade em unidade até o resultado, e o peso de cada uma.
   · Uma unidade: da receita ao resultado (cascata), mês a mês, o peso dela na empresa, e o gráfico que só ela tem:
       TAAG / Acústica → contribuição por obra · Focal → vendas da loja · Pós-venda → garantia × cobrável × contrato
       Administrativo → para onde vai o dinheiro da estrutura.
   Regras: cada unidade tem SEMPRE a mesma cor (TAAG azul, Acústica laranja, Focal verde-água, Pós-venda amarelo,
   Administrativo cinza); todo gráfico tem rótulo de valor (cores claras abaixo de 3:1 → rótulos visíveis); cada barra
   abre o que ela soma; os números vêm do mesmo motor da DRE (V124DIR.dre) e as pontes fecham ao centavo.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__V125RX)return;window.__V125RX=true;
if(typeof SCREENS!=='object'||!window.V124DIR||typeof SCREENS.diretoria!=='function')return;
const DX=window.V124DIR;const VD=window.VD;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const r2=v=>Math.round((+v||0)*100)/100;
const R$=v=>{v=r2(v);return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})};
const Rk=v=>{v=+v||0;const a=Math.abs(v);let t;if(a>=1e6)t=(a/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi';else if(a>=1e3)t=(a/1e3).toLocaleString('pt-BR',{maximumFractionDigits:a>=1e4?0:1})+' mil';else t=a.toLocaleString('pt-BR',{maximumFractionDigits:0});return (v<0?'−':'')+t};
const P1=v=>(isFinite(v)?v*100:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){console.error('Raio-X',e);return d}};
const hoje=()=>{try{return today()}catch(e){return new Date().toISOString().slice(0,10)}};
const ymOf=d=>String(d||'').slice(0,7);
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const ymLb=m=>MES[+m.slice(5,7)-1]+'/'+m.slice(2,4);
const UNIS=()=>T(()=>FD1.UNIDADES.slice(),null)||['TAAG','Acústica','Focal','Pós-venda','Corporativo'];
const uniLb=u=>u==='Corporativo'?'Administrativo':u;
const KEY={'TAAG':'taag','Acústica':'acu','Focal':'foc','Pós-venda':'pos','Corporativo':'adm'};
const cor=u=>'var(--u-'+(KEY[u]||'adm')+')';
const sum=(xs,f)=>r2((xs||[]).reduce((a,x)=>a+(+(f?f(x):x)||0),0));
const ger=d=>r2(d.ebitda);
const dre=(ym,u,fil)=>DX.dre(ym,u,fil);
const go=(k,v)=>`VD.${k}=${typeof v==='string'?`'${J(v)}'`:v};VD.drawer=null;window.VD_R()`;

const CSS=`<style id="v125rx-css">
.vd{--u-taag:#2a78d6;--u-acu:#eb6834;--u-foc:#1baf7a;--u-pos:#eda100;--u-adm:#8a8984;--rx-cost:#c9c8c2;--rx-neg:#e34948;--rx-ink:#0b0b0b;--rx-sub:#52514e;--rx-grid:#e9e8e4;--rx-emp:#86b6ef}
:root[data-theme="dark"] .vd{--u-taag:#3987e5;--u-acu:#d95926;--u-foc:#199e70;--u-pos:#c98500;--u-adm:#8f8e88;--rx-cost:#55544f;--rx-neg:#e66767;--rx-ink:#f0efec;--rx-sub:#c3c2b7;--rx-grid:#2c2c2a;--rx-emp:#256abf}
.vd .rx{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:900px){.vd .rx{grid-template-columns:1fr}}
.vd .rx .card{border-radius:18px;padding:18px 20px}
.vd .rx .wide{grid-column:1/-1}
.vd .rx h3{font-size:15px;font-weight:800;margin:0 0 2px}
.vd .rx .pt{font-size:12.5px;color:var(--rx-sub);margin-bottom:10px;line-height:1.45}
.vd .rx svg{width:100%;height:auto;display:block;overflow:visible}
.vd .rx svg text{font-size:11px;fill:var(--rx-sub)}
.vd .rx svg text.v{fill:var(--rx-ink);font-weight:700}
.vd .rx svg .gl{stroke:var(--rx-grid);stroke-width:1}
.vd .rx svg .zl{stroke:var(--rx-sub);stroke-width:1;opacity:.6}
.vd .rx svg [data-tip]{cursor:pointer}
.vd .rx svg [data-tip]:hover{opacity:.82}
.vd .rx .tiles{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.vd .rx .tile{flex:1;min-width:120px;background:rgba(120,120,128,.08);border-radius:12px;padding:10px 12px}
.vd .rx .tile b{display:block;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.vd .rx .tile span{font-size:11.5px;color:var(--rx-sub)}
.vd .rx .lg{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;margin-top:8px;color:var(--rx-sub)}
.vd .rx .lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.vd .rx .ok{font-size:12px;font-weight:700;color:#16a34a}.vd .rx .bad{font-size:12px;font-weight:700;color:var(--rx-neg)}
.vd .rx .vazio{font-size:13px;color:var(--rx-sub);padding:18px 0}
#vd_tip{position:fixed;z-index:2147483001;pointer-events:none;background:var(--card,#fff);color:inherit;border-radius:10px;padding:8px 11px;font-size:12.5px;box-shadow:0 8px 24px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06);display:none;max-width:280px;line-height:1.4}
</style>`;

/* ───────── tooltip (one, shared) ───────── */
function tipOn(){if(document.getElementById('vd_tip'))return;const t=document.createElement('div');t.id='vd_tip';document.body.appendChild(t);
  document.addEventListener('mousemove',e=>{const el=e.target&&e.target.closest&&e.target.closest('.vd .rx [data-tip]');if(!el){t.style.display='none';return}
    t.innerHTML=el.getAttribute('data-tip');t.style.display='block';const w=t.offsetWidth,h=t.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;t.style.left=x+'px';t.style.top=y+'px'})}

/* ───────── 1. cascata: da receita ao resultado (vertical) ───────── */
function cascata(passos,opt){ /* passos: [{lb,v,tipo:'ini'|'menos'|'sub'|'fim',cor,tip,href}] */
  const W=1000,H=270,L=58,Rr=10,Tp=26,B=40;const n=passos.length;const gw=(W-L-Rr)/n,bw=Math.min(64,gw*.62);
  let run=0;const bars=passos.map(p=>{let a,b;if(p.tipo==='ini'||p.tipo==='sub'||p.tipo==='fim'){a=0;b=p.v;run=p.v}else{a=run;b=run-p.v;run=b}return Object.assign({},p,{a,b})});
  const ys=bars.flatMap(b=>[b.a,b.b]).concat([0]);let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo)hi=lo+1;const pad=(hi-lo)*.06;hi+=pad;if(lo<0)lo-=pad;
  const sy=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));
  const grid=[lo,0,hi].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<line class="${v===0?'zl':'gl'}" x1="${L}" x2="${W-Rr}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/>`).join('');
  const body=bars.map((b,i)=>{const x=L+gw*i+(gw-bw)/2;const y1=sy(Math.max(b.a,b.b)),y2=sy(Math.min(b.a,b.b));const h=Math.max(1.5,y2-y1);
    const fill=b.tipo==='menos'?'var(--rx-cost)':(b.v<0&&(b.tipo==='fim'||b.tipo==='sub')?'var(--rx-neg)':b.cor);
    const val=b.tipo==='menos'?'−'+Rk(b.v):Rk(b.v);const ly=(b.tipo==='menos'||b.v>=0)?y1-6:y2+13;
    const link=i<bars.length-1&&(b.tipo!=='fim')?`<line x1="${(x+bw).toFixed(1)}" x2="${(x+gw).toFixed(1)}" y1="${sy(b.b).toFixed(1)}" y2="${sy(b.b).toFixed(1)}" stroke="var(--rx-sub)" stroke-width="1" opacity=".45"/>`:'';
    const lb=b.lb.split('\n');
    return `<g data-tip="${E('<b>'+b.lb.replace('\n',' ')+'</b><br>'+(b.tipo==='menos'?'− ':'')+R$(b.v)+(b.tip?'<br><span style=\"opacity:.7\">'+b.tip+'</span>':''))}"${b.href?` onclick="${b.href}"`:''}><rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${fill}"/><rect x="${(x-6).toFixed(1)}" y="${Tp}" width="${(bw+12).toFixed(1)}" height="${H-Tp-B}" fill="transparent"/>
      <text class="v" x="${(x+bw/2).toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${E(val)}</text>${lb.map((t,k)=>`<text x="${(x+bw/2).toFixed(1)}" y="${H-B+16+k*12}" text-anchor="middle">${E(t)}</text>`).join('')}</g>${link}`}).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(opt&&opt.aria||'Da receita ao resultado')}">${grid}${body}</svg>`}

/* ───────── 2. barras horizontais (com sinal) ───────── */
function barrasH(itens,opt){ /* itens: [{lb,v,cor,tip,href,sub}] */
  opt=opt||{};const W=opt.W||1000,rowH=34,L=opt.L||250,Rr=opt.W&&opt.W<800?80:120,H=itens.length*rowH+6;
  const vs=itens.map(i=>i.v);let lo=Math.min(0,...vs),hi=Math.max(0,...vs);if(hi===lo)hi=lo+1;
  const sx=v=>L+(W-L-Rr)*(v-lo)/(hi-lo);const z=sx(0);
  const rows=itens.map((it,i)=>{const y=4+i*rowH;const x1=Math.min(z,sx(it.v)),w=Math.max(2,Math.abs(sx(it.v)-z));const neg=it.v<0;
    const fill=it.cor||'var(--u-taag)';const lbl=it.lb.length>34?it.lb.slice(0,33)+'…':it.lb;
    return `<g data-tip="${E('<b>'+it.lb+'</b><br>'+R$(it.v)+(it.tip?'<br><span style=\"opacity:.7\">'+it.tip+'</span>':''))}"${it.href?` onclick="${it.href}"`:''}><rect x="0" y="${y}" width="${W}" height="${rowH-4}" fill="transparent"/>
      <text x="${L-10}" y="${y+18}" text-anchor="end" style="fill:var(--rx-ink);font-weight:600">${E(lbl)}</text>${it.sub?`<text x="${L-10}" y="${y+30}" text-anchor="end" style="font-size:10px">${E(it.sub)}</text>`:''}
      <rect x="${x1.toFixed(1)}" y="${y+7}" width="${w.toFixed(1)}" height="${rowH-16}" rx="4" fill="${neg&&!it.cor?'var(--rx-neg)':fill}"/>
      <text class="v" x="${(neg?x1-6:x1+w+6).toFixed(1)}" y="${y+19}" text-anchor="${neg?'end':'start'}">${E(Rk(it.v))}</text></g>`}).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(opt.aria||'')}"><line class="zl" x1="${z.toFixed(1)}" x2="${z.toFixed(1)}" y1="0" y2="${H}"/>${rows}</svg>`}

/* ───────── 3. mês a mês: receita (barras) + resultado (linha), mesmo eixo em R$ ───────── */
function mesAMes(ms,u,W0){
  const adm=u==='Corporativo';const pts=ms.map(m=>{const d=dre(m,u,VD.fil);return adm?{m,rec:r2(+d.fixas||0),res:0}:{m,rec:r2(d.receita),res:ger(d)}});
  const comDado=pts.filter(p=>p.rec||p.res);if(comDado.length<2)return null;
  const W=W0||560,H=W0&&W0>800?230:250,L=50,Rr=W0&&W0>800?14:40,Tp=18,B=30;const n=pts.length;const gw=(W-L-Rr)/n,bw=Math.min(46,gw*.5);
  const ys=pts.flatMap(p=>adm?[p.rec]:[p.rec,p.res]).concat([0]);let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo)hi=lo+1;const pad=(hi-lo)*.08;hi+=pad;if(lo<0)lo-=pad;
  const sy=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));const cx=i=>L+gw*i+gw/2;const bcor=u?cor(u):'var(--rx-emp)';
  const ticks=[lo<0?lo:null,0,hi].filter(v=>v!=null).map(v=>`<line class="${v===0?'zl':'gl'}" x1="${L}" x2="${W-Rr}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/><text x="${L-8}" y="${(sy(v)+4).toFixed(1)}" text-anchor="end">${E(Rk(v))}</text>`).join('');
  const bars=pts.map((p,i)=>{const y=sy(Math.max(0,p.rec)),h=Math.max(0,sy(0)-y);return `<g data-tip="${E('<b>'+ymLb(p.m)+'</b>'+(adm?'<br>Estrutura '+R$(p.rec):'<br>Receita '+R$(p.rec)+'<br>Resultado '+R$(p.res))+'<br><span style=\"opacity:.7\">clique para ver o mês</span>')}" onclick="${go('ym',p.m)}"><rect x="${(cx(i)-gw/2).toFixed(1)}" y="${Tp}" width="${gw.toFixed(1)}" height="${H-Tp-B}" fill="transparent"/><rect x="${(cx(i)-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${bcor}" opacity="${p.m===VD.ym?1:.55}"/><text x="${cx(i).toFixed(1)}" y="${H-10}" text-anchor="middle" style="${p.m===VD.ym?'fill:var(--rx-ink);font-weight:700':''}">${ymLb(p.m)}</text></g>`}).join('');
  const line=pts.map((p,i)=>(i?'L':'M')+cx(i).toFixed(1)+' '+sy(p.res).toFixed(1)).join(' ');
  const dots=pts.map((p,i)=>`<circle cx="${cx(i).toFixed(1)}" cy="${sy(p.res).toFixed(1)}" r="4" fill="${p.res<0?'var(--rx-neg)':'var(--rx-ink)'}" stroke="var(--card,#fff)" stroke-width="2"/>`).join('');
  const last=pts[pts.length-1];
  const linha=adm?'':`<path d="${line}" fill="none" stroke="var(--rx-ink)" stroke-width="2"/>${dots}<text class="v" x="${(cx(n-1)+10).toFixed(1)}" y="${(sy(last.res)-8).toFixed(1)}">${E(Rk(last.res))}</text>`;
  const topo=adm?pts.map((p,i)=>`<text class="v" x="${cx(i).toFixed(1)}" y="${(sy(p.rec)-6).toFixed(1)}" text-anchor="middle">${E(Rk(p.rec))}</text>`).join(''):'';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${adm?'Custo da estrutura mês a mês':'Receita e resultado mês a mês'}">${ticks}${bars}${linha}${topo}</svg>
   <div class="lg">${adm?`<span><i style="background:${bcor}"></i>Despesas da empresa no mês</span>`:`<span><i style="background:${bcor}"></i>Receita</span><span><i style="background:var(--rx-ink);height:3px;border-radius:2px;vertical-align:3px"></i>Resultado gerencial</span>`}<span>· clique num mês para ver aquele mês</span></div>`}

/* ───────── 4. o peso de cada unidade: barra segmentada ───────── */
function pesos(atual,W0){
  const us=UNIS().filter(u=>u!=='Corporativo');const ds=us.map(u=>({u,rec:Math.max(0,r2(dre(VD.ym,u,VD.fil).receita))}));const tot=sum(ds,x=>x.rec);
  if(!(tot>0))return null;const W=W0||560,H=40;let x=0;
  const segs=ds.filter(x=>x.rec>0).map(s=>{const w=(W-2*(ds.filter(x=>x.rec>0).length-1))*s.rec/tot;const g=`<g data-tip="${E('<b>'+uniLb(s.u)+'</b><br>'+R$(s.rec)+' · '+P1(s.rec/tot)+' da receita<br><span style=\"opacity:.7\">clique para ver só ela</span>')}" onclick="${go('uni',s.u)}"><rect x="${x.toFixed(1)}" y="0" width="${Math.max(2,w).toFixed(1)}" height="34" rx="6" fill="${cor(s.u)}" opacity="${atual&&atual!==s.u?.28:1}"/>${w>50?`<text class="v" x="${(x+8).toFixed(1)}" y="22" style="fill:#fff">${E(P1(s.rec/tot))}</text>`:''}</g>`;x+=w+2;return g}).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Peso de cada unidade na receita">${segs}</svg><div class="lg">${ds.map(s=>`<span><i style="background:${cor(s.u)}"></i>${E(uniLb(s.u))} <b style="color:var(--rx-ink)">${E(P1(tot?s.rec/tot:0))}</b> · ${E(Rk(s.rec))}</span>`).join('')}</div>`}

/* ───────── os passos da cascata de uma unidade (ou da empresa) ───────── */
function passosDe(d,u,fixasLinha){
  const c=cor(u||'TAAG');const ps=[{lb:'Receita',v:r2(d.receita),tipo:'ini',cor:c,tip:'reconhecida pelo avanço das obras',href:"VD_open('receita')"}];
  [['Impostos',d.deducoes],['Equipamento',d.cmv],['Técnicos',d.tecnicos],['Viagens',d.viagens],['Terceiros\ne frete',d.terceiros],['Comissões\ne RT',r2((+d.comissao||0)+(+d.rt||0))]].forEach(([lb,v])=>{if(Math.abs(+v||0)>=0.005)ps.push({lb,v:r2(v),tipo:'menos'})});
  ps.push({lb:'Contribuição',v:r2(d.mc),tipo:'sub',cor:c,tip:'o que sobra das vendas para pagar a estrutura'});
  if(fixasLinha&&Math.abs(+d.fixas||0)>=0.005){ps.push({lb:'Despesas da\nempresa',v:r2(d.fixas),tipo:'menos',tip:'aluguel, folha administrativa, contas…'});ps.push({lb:'Resultado\ngerencial',v:ger(d),tipo:'fim',cor:c,href:"VD_open('resultado')"})}
  return ps}

/* ───────── o gráfico que só a unidade tem ───────── */
const FIXLB={folhaAdm:'Folha adm., diretoria e benefícios',aluguel:'Aluguel showroom + escritório',condEnergia:'Condomínio, energia, água e telecom',softwares:'Softwares, licenças e cloud',contabJur:'Contabilidade e jurídico',marketing:'Marketing institucional',segurosFrota:'Seguros, veículos e combustível',outros:'Demais despesas de suporte'};
function proprio(u,d){
  if(u==='TAAG'||u==='Acústica'){
    const rows=[];DX.comFilial(VD.fil,()=>{(T(()=>FN.obras(),[])||[]).forEach(r=>{let rec=0,cus=0;(r.porProposta||[]).forEach(x=>{if(x.unidade!==u)return;rec+=+x.receitaR||0;cus+=+x.custoR||0});if(rec||cus)rows.push({o:r.o,rec:r2(rec),c:r2(rec-cus)})})});
    if(!rows.length)return {t:'Contribuição por obra',p:'Nenhuma obra desta unidade com receita reconhecida neste mês.',h:''};
    rows.sort((a,b)=>b.c-a.c);const top=rows.slice(0,8);const soma=sum(rows,r=>r.c);const ajuste=r2(d.mc-soma);
    return {t:'Contribuição por obra',p:`Quanto cada obra deixa depois de equipamento, técnicos, impostos e comissões. ${rows.length>8?'As 8 maiores de '+rows.length+'.':''}`,
      h:barrasH(top.map(r=>({lb:r.o.nome||r.o.id,v:r.c,cor:r.c<0?'var(--rx-neg)':cor(u),sub:'receita '+Rk(r.rec)+(r.rec?' · margem '+P1(r.c/r.rec):''),tip:'clique para abrir a obra',href:`VD_go('#/fobras/${J(r.o.id)}')`})),{aria:'Contribuição por obra'})+
       `<div class="pt" style="margin:8px 0 0">Ponte: obras ${R$(soma)} ${ajuste<0?'−':'+'} frete, viagens e ajustes da obra ${R$(Math.abs(ajuste))} = contribuição da unidade ${R$(d.mc)} <span class="ok">✓</span></div>`}}
  if(u==='Focal'){
    const vs=(T(()=>FN.focal(),[])||[]).filter(x=>x&&x.p&&!x.obra&&ymOf(x.p.vendida_em)===VD.ym&&(!VD.fil||T(()=>FIL.daProposta(x.p),'')===VD.fil));
    if(!vs.length)return {t:'Vendas da loja',p:'Nenhuma venda de loja neste mês.',h:''};
    const tot=sum(vs,x=>x.pl.tot),mg=sum(vs,x=>(+x.pl.tot||0)-(+x.pl.equipC||0)-(+x.pl.com||0)-(+x.pl.rt||0)-(+x.pl.frete||0));
    return {t:'Vendas da loja',p:'Cada venda do showroom no mês, pelo valor vendido.',
      h:`<div class="tiles"><div class="tile"><b>${vs.length}</b><span>vendas no mês</span></div><div class="tile"><b>${E(R$(tot/vs.length))}</b><span>ticket médio</span></div><div class="tile"><b>${E(P1(tot?mg/tot:0))}</b><span>margem média depois de equipamento, comissão e frete</span></div></div>`+
        barrasH(vs.sort((a,b)=>b.pl.tot-a.pl.tot).slice(0,8).map(x=>({lb:x.p.numero+' · '+(T(()=>((S.db.clientes||[]).find(c=>c.sigla===x.p.sigla)||{}).nome,'')||x.p.nome||''),v:r2(x.pl.tot),cor:cor('Focal'),tip:'clique para abrir a venda',href:`VD_go('#/editor/${J(x.p.id)}')`})),{aria:'Vendas da loja',W:560,L:220})}}
  if(u==='Pós-venda'){
    const a=T(()=>FPV.dreMes(VD.ym),{rows:[]});const rows=(a&&a.rows)||[];const os=(S.db.os||[]).filter(o=>o.estado==='aberta').length;
    const g=rows.filter(r=>r.modo==='garantia'),cb=rows.filter(r=>r.modo==='cobravel'),ct=rows.filter(r=>r.modo==='contrato');
    const it=[{lb:'Cobrável — receita',v:sum(cb,r=>r.receita),cor:cor('Pós-venda'),sub:cb.length+' atendimento(s)'},{lb:'Contrato — receita',v:sum(ct,r=>r.receita),cor:cor('Pós-venda'),sub:ct.length+' atendimento(s)'},
      {lb:'Garantia — custo',v:-sum(g,r=>r.custo_gravado),cor:'var(--rx-cost)',sub:g.length+' atendimento(s) · vai para a obra de origem'}];
    return {t:'Garantia, cobrável e contrato',p:'O que o Pós-venda cobrou e o que a garantia custou no mês. A garantia não gera receita e pesa na unidade que vendeu a obra.',
      h:`<div class="tiles"><div class="tile"><b>${os}</b><span>atendimentos abertos agora</span></div><div class="tile"><b>${rows.length}</b><span>fechados no mês</span></div></div>`+(rows.length?barrasH(it.map(x=>Object.assign(x,{href:"VD_go('#/chamados')",tip:'clique para abrir os chamados'})),{aria:'Pós-venda por tipo',W:560,L:200}):'<div class="vazio">Nenhum atendimento fechado neste mês.</div>')}}
  if(u==='Corporativo'){
    const fx=T(()=>FN.fixos(),null);
    if(!fx||!DX.VD||VD.ym!==ymOf(hoje()))return {t:'Para onde vai o dinheiro da estrutura',p:'O detalhe por tipo de despesa está na DRE deste mês.',h:`<a href="javascript:VD_go('#/dre')">Abrir a DRE ›</a>`};
    const it=Object.keys(fx).map(k=>({lb:FIXLB[k]||k,v:r2(fx[k])})).filter(x=>x.v).sort((a,b)=>b.v-a.v);const tot=sum(it,x=>x.v);
    return {t:'Para onde vai o dinheiro da estrutura',p:`Despesas fixas do mês, maiores primeiro — somam ${R$(tot)}.`,
      h:barrasH(it.map(x=>({lb:x.lb,v:x.v,cor:cor('Corporativo'),sub:P1(tot?x.v/tot:0)+' da estrutura',tip:'clique para abrir os lançamentos',href:"VD_go('#/finlanc')"})),{aria:'Despesas fixas por tipo',L:300})+
       `<div class="pt" style="margin:8px 0 0">${Math.abs(tot-r2(d.fixas))<0.05?`<span class="ok">✓ a soma é exatamente as despesas da empresa da DRE (${R$(d.fixas)})</span>`:`<span class="bad">A soma (${R$(tot)}) difere das despesas da DRE (${R$(d.fixas)}) em ${R$(tot-d.fixas)}.</span>`}</div>`}}
  return null}

/* ───────── a seção ───────── */
function raiox(){
  const u=VD.uni||'';const ms=T(()=>{const all=(FS.dreMeses()||[]).slice().sort();const i=all.indexOf(VD.ym);const end=i<0?all.length:i+1;return all.slice(Math.max(0,end-6),end)},[]);
  const blocos=[];
  if(!u){/* empresa: as unidades lado a lado */
    const d=dre(VD.ym,'',VD.fil);
    const ps=UNIS().map(x=>({lb:uniLb(x).replace('Administrativo','Adminis-\ntrativo'),v:x==='Corporativo'?ger(dre(VD.ym,x,VD.fil)):r2(dre(VD.ym,x,VD.fil).mc),u:x}));
    const soma=sum(ps,p=>p.v);const ok=Math.abs(soma-ger(d))<0.05;
    let run=0;const steps=ps.map(p=>{const st={lb:p.lb,v:Math.abs(p.v),tipo:p.v>=0?'ini':'menos',cor:cor(p.u),u:p.u};return st});
    /* a bridge across units: each unit adds (or takes away) its share, ending at the company result */
    const W=1000,H=270,L=58,Rr=10,Tp=26,B=40;const all=ps.concat([{lb:'Resultado\ngerencial',v:ger(d),u:'',fim:true}]);const n=all.length;const gw=(W-L-Rr)/n,bw=Math.min(64,gw*.62);
    let acc=0;const bars=all.map(p=>{let a,b;if(p.fim){a=0;b=p.v}else{a=acc;b=acc+p.v;acc=b}return Object.assign({},p,{a,b})});
    const ys=bars.flatMap(b=>[b.a,b.b]).concat([0]);let lo=Math.min(...ys),hi=Math.max(...ys);if(hi===lo)hi=lo+1;const pad=(hi-lo)*.06;hi+=pad;if(lo<0)lo-=pad;const sy=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));
    const svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribuição de cada unidade até o resultado"><line class="zl" x1="${L}" x2="${W-Rr}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}"/>${bars.map((b,i)=>{const x=L+gw*i+(gw-bw)/2;const y1=sy(Math.max(b.a,b.b)),y2=sy(Math.min(b.a,b.b));const h=Math.max(1.5,y2-y1);
      const fill=b.fim?(b.v<0?'var(--rx-neg)':'var(--rx-ink)'):cor(b.u);const ly=y1-6;
      const link=!b.fim?`<line x1="${(x+bw).toFixed(1)}" x2="${(x+gw).toFixed(1)}" y1="${sy(b.b).toFixed(1)}" y2="${sy(b.b).toFixed(1)}" stroke="var(--rx-sub)" opacity=".45"/>`:'';
      return `<g data-tip="${E('<b>'+b.lb.replace(/-?\n/,'')+'</b><br>'+R$(b.v)+(b.fim?'':'<br><span style=\"opacity:.7\">clique para ver só esta unidade</span>'))}"${b.fim?` onclick="VD_open('resultado')"`:` onclick="${go('uni',b.u)}"`}><rect x="${(x-6).toFixed(1)}" y="${Tp}" width="${(bw+12).toFixed(1)}" height="${H-Tp-B}" fill="transparent"/><rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${fill}"/><text class="v" x="${(x+bw/2).toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${E(Rk(b.v))}</text>${b.lb.split('\n').map((t,k)=>`<text x="${(x+bw/2).toFixed(1)}" y="${H-B+16+k*12}" text-anchor="middle">${E(t)}</text>`).join('')}</g>${link}`}).join('')}</svg>`;
    blocos.push(`<div class="card wide"><h3>Cada unidade, até o resultado da empresa</h3><div class="pt">Cada barra é o que a unidade deixa (contribuição) — o Administrativo é a estrutura que todas pagam. Clique numa unidade para ver o raio-x dela.</div>${svg}<div class="pt" style="margin:6px 0 0">${ps.map(p=>uniLb(p.u)+' '+R$(p.v)).join(' + ')} = ${R$(ger(d))} ${ok?'<span class="ok">✓ fecha ao centavo</span>':'<span class="bad">não fecha — veja “Sem unidade” na tabela</span>'}</div></div>`);
    const pz=pesos('');if(pz)blocos.push(`<div class="card"><h3>De onde vem a receita</h3><div class="pt">O peso de cada unidade na receita do mês.</div>${pz}</div>`);
    const mm=mesAMes(ms,'',560);if(mm)blocos.push(`<div class="card"><h3>Mês a mês — a empresa</h3><div class="pt">Receita e resultado gerencial dos últimos ${ms.length} meses.</div>${mm}</div>`);
    else blocos.push(`<div class="card"><h3>Mês a mês</h3><div class="vazio">Só há um mês com dados até agora — o gráfico aparece a partir do segundo mês.</div></div>`);
  } else {
    const d=dre(VD.ym,u,VD.fil);const nome=uniLb(u);
    if(u==='Corporativo'){
      const pr=proprio(u,d);if(pr)blocos.push(`<div class="card wide"><h3>${E(pr.t)}</h3><div class="pt">${pr.p}</div>${pr.h}</div>`);
    } else {
      const mg=d.receita?d.mc/d.receita:0;
      if(!d.receita&&!d.mc){blocos.push(`<div class="card wide"><h3>${E(nome)}: da receita ao resultado</h3><div class="vazio">A ${E(nome)} não teve receita nem custo de obra neste mês.</div></div>`)}else blocos.push(`<div class="card wide"><h3>${E(nome)}: da receita ao resultado</h3><div class="pt">${d.receita?`De cada R$ 100 que a ${E(nome)} faturou, sobram <b>R$ ${E((mg*100).toLocaleString('pt-BR',{maximumFractionDigits:0}))}</b> depois de pagar o que a venda custou.`:`A ${E(nome)} não teve receita reconhecida neste mês.`} Barras cinzas são custos.</div>${cascata(passosDe(d,u,false),{aria:'Da receita à contribuição — '+nome})}</div>`);
      const pr=proprio(u,d);if(pr)blocos.push(`<div class="card${u==='Focal'||u==='Pós-venda'?'':' wide'}"><h3>${E(pr.t)}</h3><div class="pt">${pr.p}</div>${pr.h}</div>`);
      const pz=pesos(u);if(pz)blocos.push(`<div class="card"><h3>O peso da ${E(nome)} na empresa</h3><div class="pt">A parte da receita do mês que veio desta unidade.</div>${pz}</div>`);
    }
    const halves=blocos.filter(x=>/^<div class="card"/.test(x)).length,wd=u==='Corporativo'||halves%2===0;const mm=mesAMes(ms,u,wd?1000:560);blocos.push(mm?`<div class="card${wd?' wide':''}"><h3>Mês a mês — ${E(nome)}</h3><div class="pt">${u==='Corporativo'?'Quanto a estrutura custou':'Receita e resultado'} nos últimos ${ms.length} meses.</div>${mm}</div>`:`<div class="card"><h3>Mês a mês — ${E(nome)}</h3><div class="vazio">Só há um mês com dados até agora — o gráfico aparece a partir do segundo mês.</div></div>`);
  }
  return `${CSS}<div class="sec" id="vd_raiox"><h2>${VD.uni?'Raio-X · '+E(uniLb(VD.uni)):'As unidades lado a lado'}</h2><div class="q">${VD.uni?'Os números desta unidade em gráficos — passe o mouse para ver o valor, clique para abrir.':'Passe o mouse para ver o valor; clique numa unidade para ver o raio-x dela.'}</div><div class="rx">${blocos.join('')}</div></div>`}

const _d=SCREENS.diretoria;
SCREENS.diretoria=function(){let h=_d.apply(this,arguments);if(typeof h!=='string'||h.indexOf('id="vd_root"')<0)return h;
  tipOn();const sec=T(raiox,'');
  const mk='<div class="sec"><div class="d-flex justify-content-between align-items-end flex-wrap gap-2"><div><h2>Quem dá lucro';
  const i=h.indexOf(mk);if(i>0)h=h.slice(0,i)+sec+h.slice(i);else{const j=h.indexOf('<div class="foot">');h=j>0?h.slice(0,j)+sec+h.slice(j):h+sec}
  return h};
SCREENS.diretoria.__v125=true;
window.V125RX={raiox,cascata,barrasH};
try{if(typeof route==='function'&&route().k==='diretoria')renderMain()}catch(e){}
})();
