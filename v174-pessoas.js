/* v174 — PESSOAS: avaliação de desempenho quadrimestral + Facilities enxuto (Bruno, 11-Nov-2026)
   Origem: "Proposta de Avaliação de Desempenho — Modelo Quadrimestral" (Ana Paula, 03/11/2026) e o rascunho aprovado pelo Bruno.
   O que esta camada faz:
     1. MENU · Pessoas & Cultura fica com: Visão · Pessoas · Entrada e saída · Treinamentos e certificações ·
        Avaliação de desempenho · Cultura · (Escritório) Manutenção e escritório · (Acesso) Usuários e permissões.
        Ativos internos, Empréstimos e Contratos passam para o Financeiro (um item "Patrimônio" com as três telas — as MESMAS
        telas e os MESMOS dados, só mudam de lugar; o acesso passa a seguir o Financeiro). "Visão de Facilities" sai
        (o endereço antigo abre Manutenção e escritório).
     2. A tela "Metas e avaliação" (essa pessoa se paga? + nota 0–10) é SUBSTITUÍDA pela Avaliação de desempenho:
        3 ciclos por ano (jan–abr, mai–ago, set–dez) · 3 momentos (registro de metas → check-in → avaliação) ·
        3 metas com indicador e prazo · 4 critérios de comportamento · autoavaliação · próximas metas + PDI · calibração.
        O 1º ciclo é jan–abr de 2027. "Essa pessoa se paga?" continua só em Diretoria › Pessoas (o dono dessa conta).
     3. Visão: o bloco "Avaliações pendentes (90 dias)" vira "Ciclo de avaliação".
   Onde fica gravado (tudo na Base, registro a registro, para a nuvem v172 subir um por um):
     · S.db.pessoas[].gestor_id      — quem avalia a pessoa (a ficha da pessoa na Base é a única verdade);
     · S.db.avaliacoes_ciclo[]       — um registro por pessoa por ciclo (metas, check-in, avaliação do gestor, PDI);
     · S.db.avaliacoes_auto[]        — a autoavaliação (registro separado: a pessoa e o gestor nunca escrevem no mesmo);
     · S.db.avaliacoes_calib[]       — a calibração feita, por área e ciclo.
   Esta camada NÃO grava nada ao abrir: nenhuma tabela é criada, nenhuma pessoa é alterada, nenhum acesso muda —
   só grava quando alguém registra uma meta, um check-in, uma avaliação ou escolhe um gestor.
   Quem vê o quê: nível 2+ na tela (Gestor, RH) vê todos e a calibração; os demais veem só a própria avaliação e a do seu time.
   Carregada ANTES da v171/v172 (a nuvem compara a base por fora). Nenhuma linha existente do protótipo é alterada. */
(function(){'use strict';
if(window.__v174)return;window.__v174=true;
if(typeof SCREENS!=='object'||typeof S==='undefined'||!S||!S.db||typeof NAV==='undefined'){console.error('v174: base ausente');return}

/* ═════════════════════════ utilidades ═════════════════════════ */
var E=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var N0=function(v){return (+v||0).toLocaleString('pt-BR')};
var pad=function(n){return String(n).padStart(2,'0')};
var hoje=function(){try{return today()}catch(e){return new Date().toISOString().slice(0,10)}};
var dBR=function(d){return d?String(d).slice(8,10)+'/'+String(d).slice(5,7)+'/'+String(d).slice(0,4):'—'};
var diff=function(a,b){return Math.round((new Date(String(a).slice(0,10)+'T12:00:00')-new Date(String(b).slice(0,10)+'T12:00:00'))/864e5)};
var eu=function(){try{return me()}catch(e){return null}};
var meNome=function(){var u=eu();return u?(u.nome||u.login||'—'):'—'};
var nivel=function(k){try{return window.UQ&&UQ.nivel?UQ.nivel(k):3}catch(e){return 3}};
var _ts=0;
function gravar(ja){clearTimeout(_ts);_ts=0;if(ja){try{save()}catch(e){console.error('v174 save',e)}}else{_ts=setTimeout(function(){_ts=0;try{save()}catch(e){console.error('v174 save',e)}},700)}}
['pagehide','beforeunload'].forEach(function(ev){window.addEventListener(ev,function(){if(_ts)gravar(true)})});
function redesenha(){try{renderMain()}catch(e){try{render()}catch(x){}}}

/* pessoas: sempre as da Base; uma ficha unida a outra (pessoas_mescladas) responde pela ficha que ficou */
function canon(id){var g=0;while(id&&g++<6){var m=(S.db.pessoas_mescladas||[]).find(function(x){return x&&x.id===id&&x.merged_into});if(!m)break;id=m.merged_into}return id||''}
function pessoa(id){id=canon(id);return (S.db.pessoas||[]).find(function(p){return p.id===id})||null}
function ativas(){return (S.db.pessoas||[]).filter(function(p){return p&&p.ativo!==false&&!p.desligado}).sort(function(a,b){return String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR')})}
function pnome(id){var p=pessoa(id);return p?p.nome:''}
function meuPid(){var u=eu();return u&&u.pessoa_id?canon(u.pessoa_id):''}
function gestorDe(p){var g=p&&p.gestor_id?canon(p.gestor_id):'';return g&&pessoa(g)?g:''}
function nv(){return nivel('pcmetas')}
function veTudo(){return nv()>=2}
function visiveis(){var P=ativas();if(veTudo())return P;var m=meuPid();if(!m)return [];return P.filter(function(p){return p.id===m||gestorDe(p)===m})}
function podeAvaliar(p){if(!p||nv()<1)return false;var m=meuPid();if(p.id===m)return false;return veTudo()||(!!m&&gestorDe(p)===m)}
function podeAuto(p){return !!p&&nv()>=1&&p.id===meuPid()}

/* ═════════════════════════ ciclos ═════════════════════════ */
var INI='2027-1';
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function cInfo(c){var y=+String(c).slice(0,4),q=+String(c).slice(5)||1,m0=(q-1)*4;var fim=new Date(Date.UTC(y,m0+4,0)).toISOString().slice(0,10);
  return {id:y+'-'+q,y:y,q:q,ini:y+'-'+pad(m0+1)+'-01',fim:fim,prazo:q===3?(y+1)+'-01-15':fim,meses:[0,1,2,3].map(function(i){return MES[m0+i]}),nome:q+'º ciclo',periodo:MES[m0]+'–'+MES[m0+3]+' de '+y}}
function cicloDaData(d){return (+d.slice(0,4))+'-'+Math.ceil((+d.slice(5,7))/4)}
function cicloAtual(){var c=cicloDaData(hoje());return c<INI?INI:c}
function prox(c){var i=cInfo(c);return i.q===3?(i.y+1)+'-1':i.y+'-'+(i.q+1)}
function momento(c){var T=hoje(),i=cInfo(c);if(T<i.ini)return {k:'antes',dias:diff(i.ini,T)};if(T>i.prazo)return {k:'fim'};if(T>i.fim)return {k:'avaliacao',mes:4,extra:true};
  var mi=+T.slice(5,7)-(i.q-1)*4;return {k:mi===1?'metas':mi===4?'avaliacao':'checkin',mes:mi}}
function momentoTxt(c){var i=cInfo(c),m=momento(c);
  if(m.k==='antes')return 'O '+i.nome+' ('+i.periodo+') começa em '+dBR(i.ini)+' — '+(m.dias===1?'falta 1 dia':'faltam '+N0(m.dias)+' dias')+'. As metas já podem ser registradas.';
  if(m.k==='metas')return 'Mês 1 · registro de metas até '+dBR(i.ini.slice(0,8)+'15')+' — 15 minutos por pessoa.';
  if(m.k==='checkin')return 'Mês '+m.mes+' · check-in: uma conversa de 15 minutos para ver se a pessoa precisa de apoio. Não gera nota.';
  if(m.k==='avaliacao')return 'Mês 4 · avaliação: primeiro a autoavaliação (5 minutos), depois a reunião de 30 a 45 minutos.'+(m.extra?' Prazo estendido até '+dBR(i.prazo)+'.':'');
  return 'Ciclo encerrado em '+dBR(i.prazo)+'.'}

/* ═════════════════════════ registros ═════════════════════════ */
function AV(){return Array.isArray(S.db.avaliacoes_ciclo)?S.db.avaliacoes_ciclo:[]}
function AU(){return Array.isArray(S.db.avaliacoes_auto)?S.db.avaliacoes_auto:[]}
function CA(){return Array.isArray(S.db.avaliacoes_calib)?S.db.avaliacoes_calib:[]}
function rec(c,pid){var id='AVD:'+c+':'+pid;return AV().find(function(r){return r&&r.id===id})||null}
function recW(c,pid){var r=rec(c,pid);if(!r){if(!Array.isArray(S.db.avaliacoes_ciclo))S.db.avaliacoes_ciclo=[];r={id:'AVD:'+c+':'+pid,ciclo:c,pessoa_id:pid,criado_em:hoje(),criado_por:meNome()};S.db.avaliacoes_ciclo.push(r)}return r}
function aut(c,pid){var id='AUT:'+c+':'+pid;return AU().find(function(r){return r&&r.id===id})||null}
function autW(c,pid){var r=aut(c,pid);if(!r){if(!Array.isArray(S.db.avaliacoes_auto))S.db.avaliacoes_auto=[];r={id:'AUT:'+c+':'+pid,ciclo:c,pessoa_id:pid,criado_em:hoje()};S.db.avaliacoes_auto.push(r)}return r}
function cal(c,area){var id='CAL:'+c+':'+area;return CA().find(function(r){return r&&r.id===id})||null}
var R1=['Superou','Atingiu','Abaixo'],R2=['Referência','Adequado','Precisa desenvolver'],CRIT=['Comunicação','Proatividade','Pontualidade e compromisso','Trabalho em equipe'];
function metaOk(m){return !!(m&&String(m.t||'').trim()&&String(m.ind||'').trim()&&String(m.prazo||'').trim())}
function metas3(a){a=Array.isArray(a)?a:[];return [0,1,2].map(function(i){var m=a[i]||{};return {t:m.t||'',ind:m.ind||'',prazo:m.prazo||''}})}
function passos(p,c){var r=rec(c,p.id),a=aut(c,p.id);return [!!(r&&r.metas_em),!!(r&&r.checkin_em),!!(a&&a.em),!!(r&&r.fechada_em)]}
function faltas(r){var f=[];r=r||{};var res=r.res||[],beh=r.beh||[];
  var n1=[0,1,2].filter(function(i){return res[i]==null}).length,n2=[0,1,2,3].filter(function(i){return beh[i]==null}).length;
  if(n1)f.push(n1+(n1>1?' resultados de meta':' resultado de meta'));
  if(n2)f.push(n2+(n2>1?' critérios de comportamento':' critério de comportamento'));
  var n3=metas3(r.novas).filter(function(m){return !metaOk(m)}).length;if(n3)f.push(n3+(n3>1?' novas metas sem indicador ou prazo':' nova meta sem indicador ou prazo'));
  if(!(String(r.pdi_hab||'').trim()&&String(r.pdi_acao||'').trim()))f.push('PDI');return f}

/* ═════════════════════════ §1 menu ═════════════════════════ */
var FIN3=[['fcativos','Ativos internos'],['fcemprest','Empréstimos'],['fccontratos','Contratos']];
(function(){try{
  var sec=NAV.find(function(s){return s.id==='pes'});
  if(sec){sec.items=sec.items.filter(function(it){return ['fchome','fcativos','fcemprest','fccontratos'].indexOf(it[0])<0});
    sec.items.forEach(function(it){if(it[0]==='pcmetas')it[1]='Avaliação de desempenho'})}
  try{LABEL.pcmetas='Avaliação de desempenho'}catch(e){}
  FIN3.forEach(function(it){try{SEC_OF[it[0]]='fin'}catch(e){}try{LABEL[it[0]]=it[1]}catch(e){}try{if(typeof OWNER==='object')OWNER[it[0]]=OWNER.fhoje||'fin'}catch(e){}try{if(typeof FS==='object'&&FS.REDIR)FS.REDIR[it[0]]=null}catch(e){}});
  try{if(typeof FS==='object'&&Array.isArray(FS.MENU)&&!FS.MENU.some(function(m){return m[0]==='fcativos'})){var i=FS.MENU.findIndex(function(m){return m[0]==='rh'});FS.MENU.splice(i>=0?i:FS.MENU.length,0,['fcativos','Patrimônio','bi-box-seam'])}}catch(e){}
  try{if(typeof SCREEN_DEPS==='object')SCREEN_DEPS.pcmetas=['pessoas','usuarios','avaliacoes_ciclo','avaliacoes_auto','avaliacoes_calib']}catch(e){}
  /* a Visão de Facilities saiu: o endereço antigo abre a tela que ficou */
  SCREENS.fchome=function(){location.hash='#/fcmanut';return ''};
  SCREENS.facilities=function(){location.hash='#/fcmanut';return ''};
  /* as três telas que foram para o Financeiro ganham as abas entre si (mesmas telas, mesmos dados) */
  FIN3.forEach(function(it){var f=SCREENS[it[0]];if(typeof f!=='function')return;SCREENS[it[0]]=function(){var h=f.apply(this,arguments);if(typeof h!=='string'||!h)return h;
    var tabs='<div class="avd-tabs" data-v174="fin3" style="margin-bottom:14px">'+FIN3.map(function(x){return '<a href="#/'+x[0]+'" class="'+(x[0]===it[0]?'on':'')+'">'+E(x[1])+'</a>'}).join('')+'</div>';return tabs+h}});
  /* submenu */
  var _rn=window.renderNav;window.renderNav=function(){var r=_rn.apply(this,arguments);try{var k=route().k,sn=document.getElementById('subnav');if(!sn)return r;
    if(SEC_OF[k]==='pes'){sn.querySelectorAll('.pc-grp').forEach(function(g){if(/^facilities$/i.test((g.textContent||'').trim()))g.textContent='Escritório'})}
    var a=sn.querySelector('a[href="#/fcativos"]');
    if(a&&!sn.querySelector('[data-v174="sub"]')){if(FIN3.some(function(x){return x[0]===k}))a.classList.add('on');
      var d=document.createElement('div');d.className='sub';d.setAttribute('data-v174','sub');d.style.cssText='font-size:11px;padding:0 10px 6px 26px;line-height:1.9';
      d.innerHTML=FIN3.map(function(x){return '<a href="#/'+x[0]+'" class="subitem" style="padding:0;margin-right:8px">'+E(x[1])+'</a>'}).join('');a.insertAdjacentElement('afterend',d)}
  }catch(e){console.error('v174 nav',e)}return r};
  /* Diretoria › Pessoas apontava para "Metas e avaliação" */
  if(typeof SCREENS.diretoria==='function'){var _d=SCREENS.diretoria;SCREENS.diretoria=function(){var h=_d.apply(this,arguments);return typeof h==='string'?h.split('Pessoas &amp; Cultura › Metas e avaliação').join('Pessoas &amp; Cultura › Avaliação de desempenho').split('Pessoas & Cultura › Metas e avaliação').join('Pessoas & Cultura › Avaliação de desempenho'):h}}
}catch(e){console.error('v174 menu',e)}})();

/* ═════════════════════════ §2 Visão: o bloco do ciclo ═════════════════════════ */
(function(){var f=SCREENS.pchome;if(typeof f!=='function')return;SCREENS.pchome=function(){var h=f.apply(this,arguments);if(typeof h!=='string')return h;try{
  var c=cicloAtual(),i=cInfo(c),m=momento(c),P=ativas(),com=P.filter(function(p){return passos(p,c)[0]}).length,fe=P.filter(function(p){return passos(p,c)[3]}).length;
  var s=m.k==='antes'?'começa em '+N0(m.dias)+(m.dias===1?' dia':' dias')+' · '+N0(com)+' de '+N0(P.length)+' com metas registradas':m.k==='avaliacao'?N0(fe)+' de '+N0(P.length)+' avaliações fechadas':N0(com)+' de '+N0(P.length)+' com metas registradas';
  var novo='<a class="card pc-k" href="#/pcmetas"><span class="dot pc-'+(m.k==='antes'?'mute':((m.k==='avaliacao'?fe:com)===P.length?'ok':'warn'))+'"></span><div class="lb">Ciclo de avaliação</div><div class="v">'+i.q+'º · '+i.meses[0]+'–'+i.meses[3]+'</div><div class="s">'+E(s)+'</div></a>';
  h=h.replace(/<a class="card pc-k"[^>]*>(?:(?!<\/a>)[\s\S])*?<div class="lb">Avaliações pendentes<\/div>(?:(?!<\/a>)[\s\S])*?<\/a>/,novo);
}catch(e){console.error('v174 visao',e)}return h}})();

/* ═════════════════════════ estilo ═════════════════════════ */
(function(){var st=document.createElement('style');st.id='v174-css';st.textContent=
'.avd-tabs{display:inline-flex;background:rgba(127,127,127,.14);border-radius:10px;padding:3px;gap:2px;flex-wrap:wrap}'+
'.avd-tabs a,.avd-tabs button{border:0;background:none;padding:6px 14px;border-radius:8px;font-weight:600;font-size:13px;color:inherit;opacity:.7;text-decoration:none;cursor:pointer}'+
'.avd-tabs .on{background:var(--card,#fff);opacity:1;box-shadow:0 1px 3px rgba(0,0,0,.1)}'+
'.avd-stage{border-radius:12px;padding:10px 14px;background:rgba(13,110,253,.08);border:1px solid rgba(13,110,253,.18);font-size:13.5px;margin-bottom:14px}'+
'.avd-year{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}'+
'.avd-q{border:1px solid var(--bd,#dee2e6);border-radius:14px;background:var(--card,#fff);padding:14px;opacity:.62;cursor:pointer;text-align:left;color:inherit;font:inherit}'+
'.avd-q.on{opacity:1;border-color:#0d6efd;box-shadow:0 0 0 3px rgba(13,110,253,.15)}'+
'.avd-q b{font-size:15px;display:block}.avd-q small{display:block;opacity:.65;margin-bottom:10px;font-size:12px}'+
'.avd-ms{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}'+
'.avd-ms div{font-size:11px;border-radius:7px;padding:6px;background:rgba(127,127,127,.12);min-height:50px;line-height:1.25}.avd-ms div b{font-size:11px;text-transform:capitalize}'+
'.avd-ms .now{background:#0d6efd;color:#fff}'+
'.avd-rings{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:14px}'+
'.avd-ring{display:flex;align-items:center;gap:14px;text-align:left;background:var(--card,#fff);border:1px solid var(--bd,#dee2e6);border-radius:14px;padding:14px;color:inherit;font:inherit;cursor:pointer}'+
'.avd-ring.sel{border-color:#0d6efd;box-shadow:0 0 0 3px rgba(13,110,253,.15)}'+
'.avd-ring svg{flex:none}.avd-ring small{font-size:12px;font-weight:600;opacity:.65;display:block}.avd-ring strong{font-size:22px;display:block;font-variant-numeric:tabular-nums;line-height:1.2}.avd-ring em{font-style:normal;font-size:11.5px;opacity:.65;display:block}'+
'.avd-ring circle{transition:stroke-dashoffset .5s}'+
'.avd-dots{display:flex;gap:6px}.avd-dots i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700;background:rgba(127,127,127,.14);color:rgba(127,127,127,.9)}'+
'.avd-dots i.ok{background:rgba(25,135,84,.16);color:#198754}.avd-dots i.cur{background:rgba(255,193,7,.25);color:#9a6b00;outline:1.5px solid rgba(255,193,7,.7)}'+
'.avd-warn{border-radius:12px;padding:9px 14px;background:rgba(255,193,7,.16);border:1px solid rgba(255,193,7,.45);font-size:13px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}'+
'dialog.avd-sheet{border:0;padding:0;border-radius:18px;width:min(1000px,96vw);max-height:92vh;background:var(--bg,#f5f5f7);color:var(--tx,#1d1d1f);box-shadow:0 30px 80px rgba(0,0,0,.35);overflow:hidden}'+
'dialog.avd-sheet[open]{display:flex;flex-direction:column}'+
'dialog.avd-sheet::backdrop{background:rgba(0,0,0,.45)}'+
'.avd-sh-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;padding:18px 22px 12px;border-bottom:1px solid var(--bd,#dee2e6);background:var(--card,#fff)}'+
'.avd-sh-h h2{font-size:21px;font-weight:800;margin:0;letter-spacing:-.02em}.avd-sh-h .sub{font-size:12.5px}'+
'.avd-sh-b{padding:16px 22px;overflow:auto;flex:1}'+
'.avd-sh-f{padding:12px 22px;border-top:1px solid var(--bd,#dee2e6);background:var(--card,#fff);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}'+
'.avd-x{border:0;background:rgba(127,127,127,.15);border-radius:50%;width:34px;height:34px;font-size:18px;line-height:1;cursor:pointer;color:inherit}'+
'.avd-bl{background:var(--card,#fff);border:1px solid var(--bd,#dee2e6);border-radius:14px;padding:16px;margin-bottom:12px}'+
'.avd-bl>header{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}.avd-bl>header b.n{width:26px;height:26px;border-radius:50%;background:var(--tx,#1d1d1f);color:var(--card,#fff);display:grid;place-items:center;font-size:12px;flex:none}'+
'.avd-bl>header h3{font-size:15.5px;font-weight:700;margin:0}.avd-bl>header span.sub{font-size:12px}'+
'.avd-ln{display:grid;grid-template-columns:minmax(190px,1.3fr) auto minmax(150px,1fr);gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--bd,#dee2e6)}'+
'.avd-ln small{display:block;opacity:.65;font-size:12px}'+
'.avd-seg{display:inline-flex;border:1px solid var(--bd,#dee2e6);border-radius:9px;overflow:hidden;background:var(--card,#fff)}'+
'.avd-seg button{border:0;border-left:1px solid var(--bd,#dee2e6);background:none;padding:7px 11px;font-weight:600;font-size:12.5px;color:inherit;cursor:pointer;white-space:nowrap}.avd-seg button:first-child{border-left:0}'+
'.avd-seg button[disabled]{cursor:default;opacity:.55}.avd-seg button.s0{background:#198754;color:#fff;opacity:1}.avd-seg button.s1{background:#0d6efd;color:#fff;opacity:1}.avd-seg button.s2{background:#dc3545;color:#fff;opacity:1}'+
'.avd-auto{font-size:11.5px;color:#6f42c1;font-weight:600;margin-top:4px}'+
'.avd-in{width:100%;font:inherit;font-size:13px;border:1px solid var(--bd,#dee2e6);border-radius:8px;padding:7px 10px;background:var(--card,#fff);color:inherit}textarea.avd-in{min-height:56px;resize:vertical}'+
'.avd-in:focus{outline:2px solid rgba(13,110,253,.5);outline-offset:1px}.avd-in[disabled]{opacity:.7;background:rgba(127,127,127,.08)}'+
'.avd-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:10px}.avd-g2 label{font-size:12px;font-weight:600;opacity:.85;display:block}.avd-g2 label>*{margin-top:4px;font-weight:400}'+
'.avd-nm{display:grid;grid-template-columns:20px 1.6fr 1.2fr 150px;gap:8px;align-items:center;padding:5px 0}.avd-nm.h{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.6}'+
'.avd-miss{color:#dc3545;font-weight:600;font-size:13px}.avd-fine{color:#198754;font-weight:600;font-size:13px}'+
'.avd-violet{border-radius:10px;padding:9px 14px;background:rgba(111,66,193,.1);border:1px solid rgba(111,66,193,.25);font-size:13px;margin-bottom:12px}'+
'.avd-bar{display:flex;height:20px;border-radius:7px;overflow:hidden;background:rgba(127,127,127,.14)}.avd-bar i{display:block}'+
'.avd-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;opacity:.75;margin-top:8px}.avd-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}'+
'.avd-hist{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--bd,#dee2e6);font-size:13px;flex-wrap:wrap}.avd-hist:first-of-type{border-top:0}'+
'.avd-ga{border:1px solid var(--bd,#dee2e6);border-radius:12px;background:var(--card,#fff);padding:12px 14px;margin-bottom:10px}.avd-ga summary{cursor:pointer;font-size:12.5px;opacity:.75;margin-top:8px}'+
'.avd-gr{display:grid;grid-template-columns:1fr minmax(180px,260px);gap:10px;align-items:center;padding:6px 0;border-top:1px solid var(--bd,#dee2e6);font-size:13px}'+
'@media (max-width:800px){.avd-year{grid-template-columns:1fr}.avd-ln{grid-template-columns:1fr}.avd-nm{grid-template-columns:20px 1fr}.avd-nm.h{display:none}.avd-nm input{grid-column:2}.avd-gr{grid-template-columns:1fr}.avd-sh-h,.avd-sh-b,.avd-sh-f{padding-left:14px;padding-right:14px}}';
document.head.appendChild(st)})();

/* ═════════════════════════ §3 a tela ═════════════════════════ */
var ST={ciclo:null,tab:'ciclo',filt:null,area:''};
function HD(t,sub,act){return '<div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3"><div><h1 class="h1">'+t+'</h1><div class="sub">'+sub+'</div></div><div class="d-flex gap-2 flex-wrap">'+(act||'')+'</div></div>'}
function ring(v,t,cor){var r=22,C=2*Math.PI*r,f=t?v/t:0;return '<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="'+r+'" fill="none" stroke="rgba(127,127,127,.18)" stroke-width="7"/><circle cx="28" cy="28" r="'+r+'" fill="none" stroke="'+cor+'" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+(C*(1-f))+'" transform="rotate(-90 28 28)"/></svg>'}
var RN=[['Metas registradas','15 min · mês 1','#0d6efd'],['Check-ins feitos','15 min · sem nota','#0d6efd'],['Autoavaliações','5 min · a pessoa preenche','#6f42c1'],['Avaliações fechadas','30 a 45 min · mês 4','#198754']];

SCREENS.pcmetas=function(){
  if(nv()<1)return HD('Avaliação de desempenho','')+'<div class="card p-4" style="border-left:4px solid #dc3545"><h5 class="mb-1">Sem acesso a esta tela</h5><div class="sub">Peça a liberação em <a href="#/equipe">Usuários e permissões</a>.</div></div>';
  var c=ST.ciclo||cicloAtual(),ci=cInfo(c),tudo=veTudo();if(!tudo)ST.tab='ciclo';
  var H=HD('Avaliação de desempenho','Três ciclos por ano. Poucas metas, um ponto de desenvolvimento, uma conversa. A pessoa vem da <a href="#/dbpessoas">Base › Pessoas</a>.',tudo?'<button class="btn-soft" onclick="AVD.gestores()"><i class="bi bi-diagram-3 me-1"></i>Quem avalia quem</button>':'');
  H+='<div class="avd-stage"><i class="bi bi-calendar-event me-1"></i>'+E(momentoTxt(c))+'</div>';
  if(tudo)H+='<div class="avd-tabs mb-3"><button class="'+(ST.tab==='ciclo'?'on':'')+'" onclick="AVD.tab(\'ciclo\')">Ciclo</button><button class="'+(ST.tab==='calib'?'on':'')+'" onclick="AVD.tab(\'calib\')">Calibração</button></div>';
  /* o ano em 3 ciclos */
  var atual=cicloAtual(),mo=momento(c);
  H+='<div class="avd-year">'+[1,2,3].map(function(q){var id=ci.y+'-'+q,x=cInfo(id),on=id===c;
    return '<button class="avd-q '+(on?'on':'')+'" onclick="AVD.ciclo(\''+id+'\')"><b>'+x.nome+(id===atual?' <span class="pc-chip info" style="font-weight:600">'+(momento(id).k==='antes'?'próximo':'atual')+'</span>':'')+'</b><small>'+x.periodo+(q===3?' · avaliação até 15/01':'')+'</small><div class="avd-ms">'+x.meses.map(function(mm,ix){var lb=ix===0?'Metas até dia 15':ix===3?'Avaliação':'Check-in';var now=id===atual&&momento(id).mes===ix+1;return '<div class="'+(now?'now':'')+'"><b>'+mm+'</b><br>'+lb+'</div>'}).join('')+'</div></button>'}).join('')+'</div>';
  if(ci.y>2027||cInfo(atual).y>ci.y)H+='<div class="mb-3" style="margin-top:-6px">'+(ci.y>2027?'<button class="btn-soft" onclick="AVD.ciclo(\''+(ci.y-1)+'-3\')">← '+(ci.y-1)+'</button> ':'')+(cInfo(atual).y>ci.y?'<button class="btn-soft" onclick="AVD.ciclo(\''+(ci.y+1)+'-1\')">'+(ci.y+1)+' →</button>':'')+'</div>';
  return H+(ST.tab==='calib'&&tudo?telaCalib(c):telaCiclo(c))};

function telaCiclo(c){var P=visiveis(),tot=P.length,tudo=veTudo(),H='';
  var cnt=[0,1,2,3].map(function(i){return P.filter(function(p){return passos(p,c)[i]}).length});
  if(tudo){var sg=P.filter(function(p){return !gestorDe(p)}).length;if(sg)H+='<div class="avd-warn"><span><b>'+N0(sg)+' de '+N0(tot)+'</b> '+(sg===1?'pessoa ainda sem gestor definido':'pessoas ainda sem gestor definido')+' — sem gestor, só Gestor e RH conseguem avaliar.</span><button class="btn-soft" onclick="AVD.gestores()">Definir</button></div>'}
  if(!tot)return H+'<div class="card p-4"><div class="sub">'+(meuPid()?'Você ainda não está em nenhum ciclo.':'O seu login não está ligado a uma pessoa da Base — peça a um Gestor para ligar em <a href="#/equipe">Usuários e permissões</a>.')+'</div></div>';
  H+='<div class="avd-rings">'+RN.map(function(r,i){var f=tot-cnt[i];return '<button class="avd-ring '+(ST.filt===i?'sel':'')+'" onclick="AVD.filt('+i+')">'+ring(cnt[i],tot,r[2])+'<span><small>'+r[0]+'</small><strong>'+N0(cnt[i])+' de '+N0(tot)+'</strong><em>'+(f?(f===1?'falta 1':'faltam '+N0(f))+' · clique para ver':r[1])+'</em></span></button>'}).join('')+'</div>';
  var L=ST.filt==null?P:P.filter(function(p){return !passos(p,c)[ST.filt]});
  H+='<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"><h6 class="mb-0">'+(ST.filt==null?(tudo?'Todas as pessoas do ciclo':'A sua avaliação e a do seu time')+' · '+N0(tot):'Faltando: '+RN[ST.filt][0].toLowerCase()+' · '+N0(L.length)+' de '+N0(tot))+'</h6>'+(ST.filt!=null?'<button class="btn-soft" onclick="AVD.filt(null)">Ver todas as '+N0(tot)+'</button>':'')+'</div>';
  H+='<div class="card p-0"><div class="table-responsive"><table class="table mb-0 pc-tbl"><thead><tr><th>Pessoa</th><th>Área</th><th>Gestor</th><th>Metas · Check-in · Auto · Avaliação</th><th></th></tr></thead><tbody>'+
    (L.length?L.map(function(p){var s=passos(p,c),cur=s.indexOf(false),g=gestorDe(p),sou=p.id===meuPid();
      return '<tr><td class="l"><a href="javascript:void 0" onclick="AVD.abrir(\''+E(p.id)+'\')"><b>'+E(p.nome)+'</b></a>'+(sou?' <span class="pc-chip info">você</span>':'')+'<div class="sub">'+E(p.cargo||'')+'</div></td><td>'+E(p.dep||'—')+'</td><td>'+(g?E(pnome(g)):'<span class="pc-chip warn">sem gestor</span>')+'</td>'+
        '<td><div class="avd-dots">'+['M','C','A','✓'].map(function(l,i){return '<i class="'+(s[i]?'ok':i===cur?'cur':'')+'" title="'+RN[i][0]+(s[i]?' ✓':'')+'">'+l+'</i>'}).join('')+'</div></td>'+
        '<td class="text-end"><button class="'+(s[3]?'btn-soft':'btn-apple')+'" onclick="AVD.abrir(\''+E(p.id)+'\')">'+(s[3]?'Ver avaliação':sou?(s[2]?'Ver':'Autoavaliação'):!s[0]?'Registrar metas':!s[1]?'Check-in':'Avaliar')+'</button></td></tr>'}).join(''):'<tr><td colspan="5" class="sub">Ninguém faltando aqui.</td></tr>')+
    '</tbody></table></div></div>';
  return H}

function pilha(arr,labels){var n=arr.length,cor=['#198754','#0d6efd','#dc3545'];var q=[0,1,2].map(function(k){return arr.filter(function(x){return x===k}).length});
  return n?'<div class="avd-bar" title="'+q.map(function(x,i){return labels[i]+': '+x}).join(' · ')+'">'+q.map(function(x,i){return x?'<i style="width:'+(x/n*100)+'%;background:'+cor[i]+'"></i>':''}).join('')+'</div><div class="sub" style="font-size:12px;margin-top:3px">'+q.map(function(x,i){return N0(x)+' '+labels[i].toLowerCase()}).join(' · ')+'</div>':'<div class="sub" style="font-size:12px">nenhuma avaliação fechada ainda</div>'}
function telaCalib(c){var P=ativas(),areas=[];P.forEach(function(p){var a=p.dep||'—';if(areas.indexOf(a)<0)areas.push(a)});areas.sort(function(a,b){return a.localeCompare(b,'pt-BR')});
  var fe=function(L){return L.filter(function(p){return passos(p,c)[3]})};
  if(ST.area&&areas.indexOf(ST.area)<0)ST.area='';
  var H='<div class="card p-3 mb-3"><h6 class="mb-1">Calibração do '+cInfo(c).nome+' · '+cInfo(c).periodo+'</h6><div class="sub">Ao fim de cada ciclo, os gestores de cada área se reúnem por até 1 hora, com o RH, para comparar os resultados e corrigir diferenças de rigor. <b>'+N0(fe(P).length)+' de '+N0(P.length)+'</b> avaliações fechadas.</div></div>';
  H+='<div class="card p-0 mb-3"><div class="table-responsive"><table class="table mb-0 pc-tbl no-filter"><thead><tr><th>Área</th><th class="text-end">Pessoas</th><th class="text-end">Fechadas</th><th>Calibração</th><th></th></tr></thead><tbody>'+areas.map(function(a){var L=P.filter(function(p){return (p.dep||'—')===a}),f=fe(L).length,k=cal(c,a),pr=f===L.length&&L.length>0;
    return '<tr'+(ST.area===a?' style="background:rgba(13,110,253,.06)"':'')+'><td class="l"><a href="javascript:void 0" onclick="AVD.area(\''+E(a).replace(/&#39;/g,"\\'")+'\')"><b>'+E(a)+'</b></a></td><td class="text-end">'+N0(L.length)+'</td><td class="text-end">'+N0(f)+' de '+N0(L.length)+'</td><td>'+(k?'<span class="pc-chip ok">feita em '+dBR(k.em)+'</span> <span class="sub">'+E(k.por||'')+'</span>':pr?'<span class="pc-chip warn">pronta para a reunião</span>':'<span class="sub">'+(L.length-f===1?'falta 1 avaliação':'faltam '+N0(L.length-f)+' avaliações')+'</span>')+'</td><td class="text-end">'+(!k&&pr?'<button class="btn-apple" onclick="AVD.calibrar(\''+E(a).replace(/&#39;/g,"\\'")+'\')">Marcar calibração feita</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></div>';
  var L2=fe(ST.area?P.filter(function(p){return (p.dep||'—')===ST.area}):P),gs=[];L2.forEach(function(p){var g=gestorDe(p)||'';if(gs.indexOf(g)<0)gs.push(g)});
  var tit=ST.area?E(ST.area):'Todas as áreas';
  H+='<div class="row g-3"><div class="col-lg-6"><div class="card p-3"><h6 class="mb-1">Metas, por gestor · '+tit+'</h6><div class="sub mb-2" style="font-size:12.5px">Barras muito diferentes entre gestores pedem conversa: um pode estar sendo mais rígido que o outro.</div>'+
    (gs.length?gs.map(function(g){var ps=L2.filter(function(p){return (gestorDe(p)||'')===g});var arr=[];ps.forEach(function(p){var r=rec(c,p.id)||{};(r.res||[]).forEach(function(x){if(x!=null)arr.push(x)})});
      return '<div class="mb-2"><b>'+(g?E(pnome(g)):'Sem gestor definido')+'</b> <span class="sub" style="font-size:12px">· '+N0(ps.length)+(ps.length===1?' avaliação':' avaliações')+' · '+N0(arr.length)+' metas</span>'+pilha(arr,R1)+'</div>'}).join(''):'<div class="sub">Nenhuma avaliação fechada ainda.</div>')+
    '<div class="avd-leg"><span><i style="background:#198754"></i>Superou</span><span><i style="background:#0d6efd"></i>Atingiu</span><span><i style="background:#dc3545"></i>Abaixo</span></div></div></div>'+
    '<div class="col-lg-6"><div class="card p-3"><h6 class="mb-1">Comportamento, por critério · '+tit+'</h6><div class="sub mb-2" style="font-size:12.5px">'+N0(L2.length)+(L2.length===1?' pessoa avaliada':' pessoas avaliadas')+' em cada critério.</div>'+
    CRIT.map(function(cr,i){return '<div class="mb-2"><b>'+cr+'</b>'+pilha(L2.map(function(p){return ((rec(c,p.id)||{}).beh||[])[i]}).filter(function(x){return x!=null}),R2)+'</div>'}).join('')+
    '<div class="avd-leg"><span><i style="background:#198754"></i>Referência</span><span><i style="background:#0d6efd"></i>Adequado</span><span><i style="background:#dc3545"></i>Precisa desenvolver</span></div></div></div></div>';
  return H}

/* ═════════════════════════ §4 a folha da pessoa (dialog) ═════════════════════════ */
var SH={pid:'',ciclo:'',modo:'gestor',edit:false,dm:null,msg:''};
function dlg(){var d=document.getElementById('avd-sheet');if(!d){d=document.createElement('dialog');d.id='avd-sheet';d.className='avd-sheet';document.body.appendChild(d);
  d.addEventListener('close',function(){if(_ts)gravar(true);SH.pid='';redesenha()});d.addEventListener('click',function(ev){if(ev.target===d)d.close()})}return d}
function abre(d){if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}}
function seg(val,labels,fn,i,ro){return '<div class="avd-seg" role="group">'+labels.map(function(l,v){return '<button type="button" '+(ro?'disabled':'onclick="AVD.'+fn+'('+i+','+v+')"')+' class="'+(val===v?'s'+v:'')+'">'+l+'</button>'}).join('')+'</div>'}
function inp(f,val,ph,ro,extra){return '<input type="text" class="avd-in" data-f="'+f+'" '+(extra||'')+' value="'+E(val||'')+'" placeholder="'+E(ph||'')+'" '+(ro?'disabled':'oninput="AVD.txt(this)"')+'>'}
function txa(f,val,ro,extra){return '<textarea class="avd-in" data-f="'+f+'" '+(extra||'')+' '+(ro?'disabled':'oninput="AVD.txt(this)"')+'>'+E(val||'')+'</textarea>'}

function folha(){var d=dlg(),p=pessoa(SH.pid);if(!p){if(d.open)d.close();return}
  var c=SH.ciclo,ci=cInfo(c),r=rec(c,p.id)||{},a=aut(c,p.id)||{},g=gestorDe(p),fechada=!!r.fechada_em,pa=podeAvaliar(p),sou=podeAuto(p),au=SH.modo==='auto';
  var verGestor=veTudo()||(!!meuPid()&&g===meuPid())||(sou&&fechada);     /* a pessoa só vê a parte do gestor depois de fechada */
  if(!verGestor&&sou)au=true;
  var roG=!pa||fechada,roA=!sou||fechada;
  var top='<div class="avd-sh-h"><div><h2>'+E(p.nome)+(sou?' <span class="pc-chip info" style="font-size:11px;vertical-align:middle">você</span>':'')+'</h2><div class="sub">'+E(p.cargo||'—')+' · '+E(p.dep||'—')+' · Gestor: '+(g?E(pnome(g)):'<span class="pc-chip warn">sem gestor</span>')+' · '+ci.nome+', '+ci.periodo+'</div></div>'+
    '<div class="d-flex gap-2 align-items-center">'+(verGestor?'<div class="avd-tabs"><button class="'+(au?'':'on')+'" onclick="AVD.modo(\'gestor\')">Gestor</button><button class="'+(au?'on':'')+'" onclick="AVD.modo(\'auto\')">Autoavaliação</button></div>':'')+'<button class="avd-x" title="Fechar" onclick="AVD.fechaFolha()">×</button></div></div>';
  var B='';
  /* ── metas do ciclo ── */
  var temMetas=!!r.metas_em,M=SH.edit&&SH.dm?SH.dm:metas3(r.metas);
  if(!au){
    B+='<section class="avd-bl"><header><h3>Metas do ciclo</h3><span class="sub">'+(temMetas?'registradas em '+dBR(r.metas_em)+' por '+E(r.metas_por||'—'):r.metas_origem?'definidas na avaliação do ciclo anterior — validar e registrar':'três metas, cada uma com indicador e prazo')+'</span>'+
      (temMetas&&!SH.edit&&pa&&!fechada?'<button class="btn-soft ms-auto" onclick="AVD.editMetas()">Editar</button>':'')+'</header>';
    if(temMetas&&!SH.edit){B+=M.map(function(m,i){return '<div class="avd-hist"><span><b>'+(i+1)+'.</b> '+E(m.t)+'</span><span class="sub">Indicador: '+E(m.ind)+' · Prazo: '+dBR(m.prazo)+'</span></div>'}).join('')}
    else if(pa&&!fechada){B+='<div class="avd-nm h"><span></span><span>Meta</span><span>Indicador (como se mede)</span><span>Prazo</span></div>'+M.map(function(m,i){return '<div class="avd-nm"><b>'+(i+1)+'</b><input type="text" class="avd-in" value="'+E(m.t)+'" placeholder="Ex.: concluir 60 diárias sem retorno à obra" oninput="AVD.dm('+i+',\'t\',this.value)"><input type="text" class="avd-in" value="'+E(m.ind)+'" placeholder="Ex.: diárias sem retrabalho" oninput="AVD.dm('+i+',\'ind\',this.value)"><input type="date" class="avd-in" value="'+E(m.prazo)+'" min="'+ci.ini+'" oninput="AVD.dm('+i+',\'prazo\',this.value)"></div>'}).join('')+
      '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2"><span id="avd-mst" class="sub" style="font-size:12.5px">Meta vaga não entra: as três precisam de indicador e prazo.</span><span>'+(SH.edit&&temMetas?'<button class="btn-soft" onclick="AVD.cancelMetas()">Cancelar</button> ':'')+'<button class="btn-apple" onclick="AVD.regMetas()">Registrar metas</button></span></div>'}
    else B+='<div class="sub">'+(fechada?'—':'As metas ainda não foram registradas pelo gestor.')+'</div>';
    B+='</section>';
    /* ── check-in ── */
    if(verGestor||pa){B+='<section class="avd-bl"><header><h3>Check-in</h3><span class="sub">mês 2 ou 3 · 15 minutos · não gera nota</span></header>'+
      (r.checkin_em?'<div class="d-flex justify-content-between flex-wrap gap-2"><span><span class="pc-chip ok">feito em '+dBR(r.checkin_em)+'</span> <span class="sub">'+E(r.checkin_por||'')+'</span></span></div>'+(r.checkin_nota?'<div class="sub mt-2">'+E(r.checkin_nota)+'</div>':''):
       pa&&!fechada?(temMetas?'<div class="d-flex gap-2 flex-wrap align-items-center"><div style="flex:1;min-width:220px">'+inp('checkin_nota',r.checkin_nota,'Precisa de apoio? A rota muda? (opcional)')+'</div><button class="btn-soft" onclick="AVD.checkin()">Marcar check-in feito</button></div>':'<div class="sub">Registre as metas primeiro.</div>'):'<div class="sub">Ainda não foi feito.</div>')+'</section>'}
  }
  /* ── avaliação ── */
  if(au){
    B+='<div class="avd-violet">'+(sou?(fechada?'A sua autoavaliação deste ciclo.':a.em?'Autoavaliação enviada em '+dBR(a.em)+'. Você ainda pode ajustar até o gestor fechar a avaliação.':'Preencha antes da reunião do mês 4 — leva uns 5 minutos. São os mesmos campos que o gestor preenche.'):(a.em?'O que <b>'+E(String(p.nome).split(' ')[0])+'</b> preencheu antes da reunião (enviado em '+dBR(a.em)+').':'<b>'+E(String(p.nome).split(' ')[0])+'</b> ainda não enviou a autoavaliação.'))+'</div>';
    if(!temMetas)B+='<section class="avd-bl"><div class="sub">As metas deste ciclo ainda não foram registradas.</div></section>';
  }
  if(temMetas&&(au||verGestor)){
    var X=au?a:r,ro=au?roA:roG,ar=X.res||[],ab=X.beh||[],MM=metas3(r.metas);
    var autoTxt=function(v,L){return au||!verGestor?'':(a.em&&v!=null?'<div class="avd-auto">Autoavaliação: '+L[v]+'</div>':'')};
    B+='<section class="avd-bl"><header><b class="n">1</b><h3>Entregas e metas</h3><span class="sub">o quê</span></header>'+MM.map(function(m,i){return '<div class="avd-ln"><div>'+E(m.t)+'<small>Indicador: '+E(m.ind)+' · Prazo: '+dBR(m.prazo)+'</small></div><div>'+seg(ar[i],R1,au?'pickAR':'pickR',i,ro)+autoTxt((a.res||[])[i],R1)+'</div>'+inp('cm',(X.cm||[])[i],'Comentário',ro,'data-i="'+i+'"'+(au?' data-a="1"':''))+'</div>'}).join('')+
      '<div class="avd-g2"><label>O que funcionou bem'+txa('bem',X.bem,ro,au?'data-a="1"':'')+'</label><label>Principais dificuldades'+txa('dif',X.dif,ro,au?'data-a="1"':'')+'</label></div></section>';
    B+='<section class="avd-bl"><header><b class="n">2</b><h3>Comportamento e cultura</h3><span class="sub">como · Referência = exemplo para o time · Adequado = atende de forma consistente</span></header>'+CRIT.map(function(cr,i){return '<div class="avd-ln"><div>'+cr+'</div><div>'+seg(ab[i],R2,au?'pickAB':'pickB',i,ro)+autoTxt((a.beh||[])[i],R2)+'</div>'+inp('cb',(X.cb||[])[i],'Comentário',ro,'data-i="'+i+'"'+(au?' data-a="1"':''))+'</div>'}).join('')+
      '<div class="avd-g2"><label>Pontos fortes'+txa('fortes',X.fortes,ro,au?'data-a="1"':'')+'</label><label>O que precisa ser ajustado'+txa('ajustar',X.ajustar,ro,au?'data-a="1"':'')+'</label></div></section>';
    if(!au){var pi=cInfo(prox(c)),NV=metas3(r.novas);
      B+='<section class="avd-bl"><header><b class="n">3</b><h3>Próximo quadrimestre</h3><span class="sub">'+pi.periodo+' · a meta só entra com indicador e prazo</span></header><div class="avd-nm h"><span></span><span>Nova meta</span><span>Indicador</span><span>Prazo</span></div>'+
        NV.map(function(m,i){return '<div class="avd-nm"><b>'+(i+1)+'</b>'+inp('novas',m.t,'Meta '+(i+1),roG,'data-i="'+i+'" data-j="t"')+inp('novas',m.ind,'Como se mede',roG,'data-i="'+i+'" data-j="ind"')+'<input type="date" class="avd-in" data-f="novas" data-i="'+i+'" data-j="prazo" value="'+E(m.prazo)+'" min="'+pi.ini+'" '+(roG?'disabled':'oninput="AVD.txt(this)"')+'></div>'}).join('')+
        '<div class="avd-g2"><label>PDI · uma habilidade a desenvolver'+inp('pdi_hab',r.pdi_hab,'Uma só, técnica ou comportamental',roG)+'</label><label>Ação concreta (curso, mentoria, projeto)'+inp('pdi_acao',r.pdi_acao,'Ex.: curso do catálogo de Treinamentos',roG)+'</label></div></section>'}
  }else if(!au&&temMetas&&!verGestor){B+='<section class="avd-bl"><div class="sub">A avaliação do gestor aparece aqui depois de fechada.</div></section>'}
  /* ── histórico ── */
  if(!au){var hist=AV().filter(function(x){return x&&canon(x.pessoa_id)===p.id&&x.fechada_em&&x.ciclo!==c&&(verGestor||sou)}).sort(function(x,y){return String(y.ciclo).localeCompare(String(x.ciclo))});
    B+='<section class="avd-bl"><header><h3>Histórico</h3><span class="sub">o que embasa promoção, mérito e movimentação</span></header>'+(hist.length?hist.map(function(x){var q=[0,1,2].map(function(k){return (x.res||[]).filter(function(v){return v===k}).length});var xi=cInfo(x.ciclo);
      return '<div class="avd-hist"><span><a href="javascript:void 0" onclick="AVD.abrir(\''+E(p.id)+'\',\''+x.ciclo+'\')"><b>'+xi.nome+' · '+xi.periodo+'</b></a></span><span class="sub">'+q[0]+' superou · '+q[1]+' atingiu · '+q[2]+' abaixo'+(x.pdi_hab?' · PDI: '+E(x.pdi_hab):'')+'</span></div>'}).join(''):'<div class="sub">'+(fechada?'Este é o primeiro ciclo fechado desta pessoa.':'Ainda não há ciclos fechados — o histórico começa na primeira avaliação.')+'</div>')+'</section>'}
  /* ── rodapé ── */
  var F='';
  if(au){F=sou&&!fechada?'<span id="avd-st" class="sub">'+(SH.msg?E(SH.msg):(a.em?'Enviada em '+dBR(a.em)+'.':'Salva sozinha enquanto você preenche.'))+'</span>'+(temMetas?'<button class="btn-apple" onclick="AVD.enviarAuto()">'+(a.em?'Reenviar':'Enviar autoavaliação')+'</button>':''):'<span class="sub">'+(a.em?'Enviada em '+dBR(a.em)+'.':'Não enviada.')+'</span><span></span>'}
  else if(fechada){F='<span class="avd-fine">Avaliação fechada em '+dBR(r.fechada_em)+' por '+E(r.fechada_por||'—')+'. As 3 novas metas já estão no '+cInfo(prox(c)).nome+'.</span>'+(nv()>=3?'<button class="btn-soft" onclick="AVD.reabrir()">Reabrir</button>':'<span></span>')}
  else if(pa&&temMetas){var f=faltas(r);F='<span id="avd-st" class="'+(f.length?'avd-miss':'avd-fine')+'">'+(SH.msg?E(SH.msg):(f.length?'Falta: '+f.join(' · '):'Tudo preenchido.'+(a.em?'':' Sem autoavaliação enviada.')))+'</span><button class="btn-apple" id="avd-close" onclick="AVD.fechar()" '+(f.length?'disabled':'')+'>Fechar avaliação</button>'}
  else F='<span id="avd-st" class="sub">'+E(SH.msg||'')+'</span><span></span>';
  var y=0;try{var b0=d.querySelector('.avd-sh-b');if(b0)y=b0.scrollTop}catch(e){}
  d.innerHTML=top+'<div class="avd-sh-b">'+B+'</div><div class="avd-sh-f">'+F+'</div>';abre(d);try{d.querySelector('.avd-sh-b').scrollTop=y}catch(e){}SH.msg=''}

function rodape(){try{var p=pessoa(SH.pid),r=rec(SH.ciclo,p.id)||{},st=document.getElementById('avd-st'),b=document.getElementById('avd-close');if(!st||!b)return;var f=faltas(r),a=aut(SH.ciclo,p.id)||{};st.className=f.length?'avd-miss':'avd-fine';st.textContent=f.length?'Falta: '+f.join(' · '):'Tudo preenchido.'+(a.em?'':' Sem autoavaliação enviada.');b.disabled=!!f.length}catch(e){}}
function alvo(au){var p=pessoa(SH.pid);if(!p)return null;if(au){if(!podeAuto(p))return null;var r0=rec(SH.ciclo,p.id);if(r0&&r0.fechada_em)return null;return autW(SH.ciclo,p.id)}
  if(!podeAvaliar(p))return null;var r=recW(SH.ciclo,p.id);return r.fechada_em?null:r}
function pick(au,campo,i,v){var x=alvo(au);if(!x)return;x[campo]=Array.isArray(x[campo])?x[campo]:[];while(x[campo].length<=i)x[campo].push(null);x[campo][i]=x[campo][i]===v?null:v;x.atualizado_em=hoje();gravar();folha()}

/* ═════════════════════════ §5 quem avalia quem ═════════════════════════ */
function optsGestor(sel,fora){var P=ativas().filter(function(p){return p.id!==fora}),li=P.filter(function(p){return p.lider}),ou=P.filter(function(p){return !p.lider});
  var o=function(p){return '<option value="'+E(p.id)+'" '+(p.id===sel?'selected':'')+'>'+E(p.nome)+(p.cargo?' — '+E(p.cargo):'')+'</option>'};
  return '<option value="">— sem gestor —</option>'+(li.length?'<optgroup label="Líderes de equipe (Base › Pessoas)">'+li.map(o).join('')+'</optgroup>':'')+'<optgroup label="Outras pessoas">'+ou.map(o).join('')+'</optgroup>'}
function painelGestores(){var d=document.getElementById('avd-gest');if(!d){d=document.createElement('dialog');d.id='avd-gest';d.className='avd-sheet';document.body.appendChild(d);d.addEventListener('close',function(){if(_ts)gravar(true);redesenha()});d.addEventListener('click',function(ev){if(ev.target===d)d.close()})}
  var P=ativas(),areas=[];P.forEach(function(p){var a=p.dep||'—';if(areas.indexOf(a)<0)areas.push(a)});areas.sort(function(a,b){return a.localeCompare(b,'pt-BR')});var sem=P.filter(function(p){return !gestorDe(p)}).length;
  var abertos={};d.querySelectorAll('details[open]').forEach(function(x){abertos[x.getAttribute('data-a')]=1});var y=0;try{y=d.querySelector('.avd-sh-b').scrollTop}catch(e){}
  d.innerHTML='<div class="avd-sh-h"><div><h2>Quem avalia quem</h2><div class="sub">O gestor fica gravado na ficha da pessoa, na Base. <b>'+N0(P.length-sem)+' de '+N0(P.length)+'</b> com gestor definido'+(sem?' · '+(sem===1?'falta 1':'faltam '+N0(sem)):'')+'.</div></div><button class="avd-x" title="Fechar" onclick="document.getElementById(\'avd-gest\').close()">×</button></div><div class="avd-sh-b">'+
    areas.map(function(a,ix){var L=P.filter(function(p){return (p.dep||'—')===a}),gs=[];L.forEach(function(p){var g=gestorDe(p);if(gs.indexOf(g)<0)gs.push(g)});var um=gs.length===1?gs[0]:'';var s=L.filter(function(p){return !gestorDe(p)}).length;
      return '<div class="avd-ga"><div class="avd-gr" style="border-top:0"><span><b>'+E(a)+'</b> <span class="sub">· '+N0(L.length)+(L.length===1?' pessoa':' pessoas')+(s?' · <span class="pc-chip warn">'+N0(s)+' sem gestor</span>':' · <span class="pc-chip ok">completo</span>')+'</span></span><select class="avd-in" title="Gestor da área" onchange="AVD.gestorArea('+ix+',this.value)"><option value="__">Gestor da área inteira…</option>'+optsGestor(gs.length===1?um:'__x','')+'</select></div>'+
        '<details data-a="'+ix+'" '+(abertos[ix]?'open':'')+'><summary>Ver e ajustar pessoa por pessoa</summary>'+L.map(function(p){return '<div class="avd-gr"><span>'+E(p.nome)+' <span class="sub">'+E(p.cargo||'')+'</span></span><select class="avd-in" onchange="AVD.gestor(\''+E(p.id)+'\',this.value)">'+optsGestor(gestorDe(p),p.id)+'</select></div>'}).join('')+'</details></div>'}).join('')+
    '</div><div class="avd-sh-f"><span class="sub">Cada escolha é salva na hora. A pessoa nunca é gestora de si mesma.</span><button class="btn-apple" onclick="document.getElementById(\'avd-gest\').close()">Pronto</button></div>';
  d.__areas=areas;abre(d);try{d.querySelector('.avd-sh-b').scrollTop=y}catch(e){}}
function setGestor(p,gid){gid=gid||'';if(gid===p.id)return false;if((p.gestor_id||'')===gid)return false;if(gid)p.gestor_id=gid;else delete p.gestor_id;try{log('pessoas','gestor',p.nome+' → '+(gid?pnome(gid):'sem gestor'))}catch(e){}return true}

/* ═════════════════════════ ações ═════════════════════════ */
window.AVD={
  tab:function(t){ST.tab=t;redesenha()},
  ciclo:function(c){if(c<INI)c=INI;ST.ciclo=c;ST.filt=null;redesenha()},
  filt:function(i){ST.filt=ST.filt===i?null:i;redesenha()},
  area:function(a){ST.area=ST.area===a?'':a;redesenha()},
  abrir:function(pid,c){var p=pessoa(pid);if(!p||nv()<1)return;if(!veTudo()&&p.id!==meuPid()&&gestorDe(p)!==meuPid())return;SH={pid:p.id,ciclo:c||ST.ciclo||cicloAtual(),modo:'gestor',edit:false,dm:null,msg:''};folha()},
  fechaFolha:function(){var d=document.getElementById('avd-sheet');if(d&&d.open)d.close()},
  modo:function(m){SH.modo=m;folha()},
  /* metas */
  dm:function(i,k,v){var p=pessoa(SH.pid);if(!p)return;if(!SH.dm){SH.dm=metas3((rec(SH.ciclo,p.id)||{}).metas);SH.edit=true}SH.dm[i][k]=v},
  editMetas:function(){var p=pessoa(SH.pid);if(!p||!podeAvaliar(p))return;SH.dm=metas3((rec(SH.ciclo,p.id)||{}).metas);SH.edit=true;folha()},
  cancelMetas:function(){SH.dm=null;SH.edit=false;folha()},
  regMetas:function(){var p=pessoa(SH.pid);if(!p||!podeAvaliar(p))return;var M=SH.dm||metas3((rec(SH.ciclo,p.id)||{}).metas);var ruins=M.filter(function(m){return !metaOk(m)}).length;
    if(ruins){var s=document.getElementById('avd-mst');if(s){s.className='avd-miss';s.textContent=(ruins===1?'Falta 1 meta':'Faltam '+ruins+' metas')+' com texto, indicador e prazo.'}return}
    var r=recW(SH.ciclo,p.id);if(r.fechada_em)return;r.metas=M.map(function(m){return {t:String(m.t).trim(),ind:String(m.ind).trim(),prazo:m.prazo}});r.metas_em=hoje();r.metas_por=meNome();r.gestor_id=gestorDe(p)||'';r.atualizado_em=hoje();
    try{log('pc','metas',p.nome+' · '+cInfo(SH.ciclo).nome+' '+cInfo(SH.ciclo).y)}catch(e){}SH.dm=null;SH.edit=false;gravar(true);folha()},
  checkin:function(){var r=alvo(false);if(!r||!r.metas_em)return;r.checkin_em=hoje();r.checkin_por=meNome();r.atualizado_em=hoje();try{log('pc','checkin',pnome(SH.pid))}catch(e){}gravar(true);folha()},
  /* avaliação */
  pickR:function(i,v){pick(false,'res',i,v)},pickB:function(i,v){pick(false,'beh',i,v)},pickAR:function(i,v){pick(true,'res',i,v)},pickAB:function(i,v){pick(true,'beh',i,v)},
  txt:function(el){var f=el.getAttribute('data-f'),i=el.getAttribute('data-i'),j=el.getAttribute('data-j'),x=alvo(el.getAttribute('data-a')==='1');if(!x)return;
    if(f==='novas'){x.novas=metas3(x.novas);x.novas[+i][j]=el.value}
    else if(i!=null){x[f]=Array.isArray(x[f])?x[f]:[];while(x[f].length<=+i)x[f].push('');x[f][+i]=el.value}
    else x[f]=el.value;
    x.atualizado_em=hoje();gravar();rodape()},
  enviarAuto:function(){var x=alvo(true);if(!x)return;var n=[0,1,2].filter(function(i){return (x.res||[])[i]==null}).length+[0,1,2,3].filter(function(i){return (x.beh||[])[i]==null}).length;
    if(n){SH.msg=(n===1?'Falta 1 resposta':'Faltam '+n+' respostas')+' para enviar.';folha();return}x.em=hoje();try{log('pc','autoavaliacao',pnome(SH.pid))}catch(e){}gravar(true);SH.msg='Autoavaliação enviada.';folha()},
  fechar:function(){var p=pessoa(SH.pid),r=alvo(false);if(!p||!r||!r.metas_em)return;var f=faltas(r);if(f.length){folha();return}
    var a=aut(SH.ciclo,p.id);r.fechada_em=hoje();r.fechada_por=meNome();r.avaliador_id=meuPid()||'';r.gestor_id=gestorDe(p)||'';r.sem_auto=!(a&&a.em);r.novas=metas3(r.novas);
    var n=recW(prox(SH.ciclo),p.id);if(!n.metas_em){n.metas=r.novas.map(function(m){return {t:String(m.t).trim(),ind:String(m.ind).trim(),prazo:m.prazo}});n.metas_origem=SH.ciclo}
    try{log('pc','avaliacao',p.nome+' · '+cInfo(SH.ciclo).nome+' '+cInfo(SH.ciclo).y+' fechada')}catch(e){}gravar(true);folha()},
  reabrir:function(){if(nv()<3)return;var p=pessoa(SH.pid),r=p&&rec(SH.ciclo,p.id);if(!r)return;delete r.fechada_em;delete r.fechada_por;r.atualizado_em=hoje();try{log('pc','avaliacao',p.nome+' reaberta')}catch(e){}gravar(true);folha()},
  /* calibração */
  calibrar:function(a){if(!veTudo())return;var c=ST.ciclo||cicloAtual();if(cal(c,a))return;var L=ativas().filter(function(p){return (p.dep||'—')===a});if(!L.length||L.some(function(p){return !passos(p,c)[3]}))return;
    if(!Array.isArray(S.db.avaliacoes_calib))S.db.avaliacoes_calib=[];S.db.avaliacoes_calib.push({id:'CAL:'+c+':'+a,ciclo:c,area:a,em:hoje(),por:meNome()});try{log('pc','calibracao',a+' · '+cInfo(c).nome)}catch(e){}gravar(true);redesenha()},
  /* gestores */
  gestores:function(){if(!veTudo())return;painelGestores()},
  gestor:function(pid,gid){if(!veTudo())return;var p=pessoa(pid);if(!p)return;if(setGestor(p,gid))gravar(true);painelGestores()},
  gestorArea:function(ix,gid){if(!veTudo()||gid==='__')return;var d=document.getElementById('avd-gest'),a=d&&d.__areas&&d.__areas[ix];if(a==null)return;var ch=false;ativas().filter(function(p){return (p.dep||'—')===a}).forEach(function(p){if(p.id!==gid&&setGestor(p,gid))ch=true});if(ch)gravar(true);painelGestores()},
  /* leitura para conferência */
  _info:function(){return {ciclo:cicloAtual(),pessoas:ativas().length,avaliacoes:AV().length,auto:AU().length,calib:CA().length}}
};

/* Entrada e saída: a mensagem do checklist apontava para "Facilities › Empréstimos" */
try{if(window.PCX&&typeof PCX.marcar==='function'){var _mk=PCX.marcar;PCX.marcar=function(){var t0=window.toast;try{window.toast=function(m,b){return t0.call(this,typeof m==='string'?m.split('Facilities › Empréstimos').join('Financeiro › Patrimônio › Empréstimos'):m,b)}}catch(e){}try{return _mk.apply(this,arguments)}finally{try{window.toast=t0}catch(e){}}}}}catch(e){}

try{if(/^#\/(pcmetas|pchome|fchome|fcativos|fcemprest|fccontratos|fhoje)/.test(location.hash)&&typeof render==='function')render()}catch(e){}
})();
