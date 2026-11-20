/* =====================================================================================================
   v193 · FECHAMENTO SEMANAL DO CRM — ENVIO DE VERDADE (Bruno, 19/11/2026)
   Até aqui o "Fechar a semana" e o envio de sexta 17:50 do CRM eram SIMULADOS no protótipo (nada saía).
   O Tito desligou a automação dele (que lia a planilha antiga e mandou tudo zerado). Agora:
     · quem envia é o servidor do protótipo (/api/fechamento, Vercel), com o remetente programacao04@taagbrasil.com.br;
     · o PDF é o MESMO desenho do PDF do Tito (2 páginas A4), com os números da base compartilhada (a nuvem);
     · Base › Relacionamento (CRM) › aba "Envio semanal" (depois de Log): ligar/desligar, dia da semana, hora e destinatários — um lugar só, na Base;
       um agendador pergunta a cada 10 minutos se chegou a hora; quem decide é esta tela;
     · os botões do CRM ("Fechar a semana", "Enviar agora", ligar/desligar em Configurações) passam a usar o mesmo servidor.
   Decisões do Bruno (19/11): enviar hoje (quinta) porque sexta 20/11 é feriado; depois toda sexta 17:50; poder desligar
   e trocar o dia (ex.: quarta) pela Base; destinatários = os 5 da lista do Tito + Guilherme + Bruno; layout igual ao do Tito.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v193)return;window.__v193=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const toast_=m=>{try{toast(m)}catch(e){console.log(m)}};
const API='/api/fechamento';
const DIAS=['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const br=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:''};
const N0=v=>(+v||0).toLocaleString('pt-BR');

/* quem pode mudar (os mesmos gestores da Base › Exportar dados) */
const GESTORES=['bruno pozzani','cesar','rodolfo','alan tito','renata'];
function eu(){return T(()=>me(),null)}
function quemSou(){const u=eu();if(!u)return '';const p=T(()=>(S.db.pessoas||[]).find(x=>x.id===u.pessoa_id),null);return (p&&p.nome)||u.nome||u.login||''}
function pode(){const u=eu();if(!u)return false;if(['diretoria','ti'].indexOf(u.perfil)>=0)return true;
  const p=T(()=>(S.db.pessoas||[]).find(x=>x.id===u.pessoa_id),null);const k=' '+nz([u.login,u.nome,p&&p.nome].join(' '))+' ';
  return GESTORES.some(g=>k.indexOf(' '+g)>=0)}

/* ───── estado vindo do servidor ───── */
let EST=null,ERR='',carregando=false;
function carregar(){if(carregando)return;carregando=true;
  fetch(API+'?modo=resumo',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(!j.ok)throw new Error(j.erro||'erro');EST=j;ERR=''}).catch(e=>{ERR=String(e.message||e)})
  .finally(()=>{carregando=false;redesenha()})}
function redesenha(){try{if(/^#\/?dbcrm\/envio/.test(location.hash||'')&&typeof render==='function')render()}catch(e){}}
const cur=()=>(location.hash||'').replace(/^#\/?/,'').split(/[/?]/)[0];

function proxima(){if(!EST)return '';const ag=EST.agenda,ag0=EST.agora;if(!ag.ligado)return 'Desligado — nada será enviado.';
  let falta=(ag.dia-ag0.dow+7)%7;if(falta===0&&ag0.hora>=ag.hora)falta=7;
  let d=addD(ag0.iso,falta);/* a semana do envio já foi enviada (ex.: enviada antes por causa de feriado) → pula para a semana seguinte */
  const ini=addD(d,-(((new Date(d+'T12:00:00Z').getUTCDay())+6)%7));if(ag.semana_enviada===ini){d=addD(d,7);falta+=7}
  if(falta===0)return 'Hoje às '+ag.hora;return DIAS[ag.dia]+', '+br(d)+' às '+ag.hora}

function css(){if(document.getElementById('v193-css'))return;const s=document.createElement('style');s.id='v193-css';s.textContent=`
.v193-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.v193-c{border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:10px}
.v193-big{font-size:34px;font-weight:300;line-height:1;letter-spacing:-.02em}
.v193-c .sub{font-size:12.5px;line-height:1.45}
.v193-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.v193-row label{font-size:12.5px;opacity:.75;min-width:70px}
.v193-c select,.v193-c input[type=time],.v193-c textarea{border:1px solid rgba(0,0,0,.15);border-radius:10px;padding:7px 10px;font:inherit;background:transparent;color:inherit}
.v193-c textarea{width:100%;min-height:120px;font-size:13px;line-height:1.5}
.v193-sw{display:inline-flex;border-radius:999px;background:rgba(0,0,0,.07);padding:3px}
.v193-sw button{border:0;border-radius:999px;padding:6px 14px;background:transparent;font:600 13px/1 inherit;color:inherit;cursor:pointer}
.v193-sw button.on{background:#1f2430;color:#fff}
.v193-k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.v193-k div{border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:8px 10px}
.v193-k b{display:block;font-size:22px;font-weight:300}
.v193-k span{font-size:11px;text-transform:uppercase;letter-spacing:.05em;opacity:.7}
.v193-conf{border:1px solid #c8372d;border-radius:12px;padding:12px;display:none;gap:8px;flex-direction:column}
[data-theme=dark] .v193-c select,[data-theme=dark] .v193-c input,[data-theme=dark] .v193-c textarea{border-color:rgba(255,255,255,.2)}
[data-theme=dark] .v193-k div{border-color:rgba(255,255,255,.15)}`;document.head.appendChild(s)}

function tela(semCabecalho){css();
  const hd=semCabecalho?'<div class="sub mb-3" style="font-size:13px">O fechamento da semana do CRM (PDF de 2 páginas + resumo no corpo) sai por e-mail sozinho, no dia e na hora escolhidos aqui. Remetente: <b>'+E((EST&&EST.remetente)||'—')+'</b>.</div>':T(()=>head('Envio semanal do CRM','O fechamento da semana do CRM (PDF de 2 páginas + resumo no corpo) sai por e-mail sozinho, no dia e na hora escolhidos aqui. Remetente: <b>'+E((EST&&EST.remetente)||'—')+'</b>.'),'<h1 class="h1">Envio semanal do CRM</h1>');
  if(!EST&&!ERR){carregar();return hd+'<div class="card p-4" style="border-radius:18px"><div class="sub">Lendo o servidor…</div></div>'}
  if(!EST)return hd+`<div class="card p-4" style="border-radius:18px"><div class="sub" style="color:#b23">Não consegui falar com o servidor: ${E(ERR)}</div><button class="btn-apple mt-2" onclick="V193.recarregar()">Tentar de novo</button></div>`;
  const ag=EST.agenda,R=EST.R,ed=pode(),dis=ed?'':' disabled';
  const ult=T(()=>EST.ultimo,'');
  const agenda=`<div class="card v193-c"><b style="font-size:15px"><i class="bi bi-calendar-week me-1"></i>Quando enviar</b>
    <div class="v193-row"><label>Envio</label><span class="v193-sw"><button class="${ag.ligado?'on':''}" onclick="V193.liga(true)"${dis}>Ligado</button><button class="${ag.ligado?'':'on'}" onclick="V193.liga(false)"${dis}>Desligado</button></span></div>
    <div class="v193-row"><label>Dia</label><select id="v193-dia"${dis}>${[1,2,3,4,5,6,7].map(d=>`<option value="${d}"${d===ag.dia?' selected':''}>${DIAS[d]}</option>`).join('')}</select>
      <label style="min-width:auto">às</label><input type="time" id="v193-hora" value="${E(ag.hora)}"${dis}></div>
    <div class="sub"><b>Próximo envio:</b> ${E(proxima())}</div>
    <div class="sub">Semana já enviada: ${ag.semana_enviada?E(br(ag.semana_enviada))+' a '+E(br(addD(ag.semana_enviada,6))):'—'}${ag.semana_enviada===EST.semana.ini?' (esta semana — não envia de novo)':''}</div>
    ${ed?'<button class="btn-apple" onclick="V193.salvarAgenda()"><i class="bi bi-check2 me-1"></i>Salvar dia e hora</button>':'<div class="sub">Só os gestores mudam o envio.</div>'}</div>`;
  const dest=`<div class="card v193-c"><b style="font-size:15px"><i class="bi bi-people me-1"></i>Quem recebe <span class="sub">(${EST.destinatarios.length})</span></b>
    <textarea id="v193-dest"${dis}>${E(EST.destinatarios.join('\n'))}</textarea><div class="sub">Um e-mail por linha.</div>
    ${ed?'<button class="btn-apple" onclick="V193.salvarDest()"><i class="bi bi-check2 me-1"></i>Salvar destinatários</button>':''}</div>`;
  const semana=`<div class="card v193-c"><b style="font-size:15px"><i class="bi bi-file-earmark-pdf me-1"></i>Esta semana · ${E(br(EST.semana.ini))} a ${E(br(EST.semana.fim))}</b>
    <div class="v193-k"><div><b>${N0(R.ints)}</b><span>Interações</span></div><div><b>${N0(R.eventos)}</b><span>Eventos</span></div><div><b>${N0(R.concluidas)}</b><span>Ações concluídas</span></div>
      <div><b>${N0(R.atrasadas)}</b><span>Ações atrasadas</span></div><div><b>${N0(R.recebidas)}</b><span>Indicações</span></div><div><b>${N0(R.fechadas)}</b><span>Fechadas</span></div></div>
    <div class="sub">${N0(R.atrasadas)} atrasadas de ${N0(R.pendentes)} ações pendentes em toda a base (todas as pessoas, todas as datas) — por isso pode ser maior que o número de um painel filtrado.</div>
    <div class="v193-row"><a class="btn-apple" href="${API}?modo=pdf" target="_blank" rel="noopener"><i class="bi bi-eye me-1"></i>Ver o PDF</a>
      ${ed?'<button class="btn-apple" onclick="V193.pedeEnvio()"><i class="bi bi-send me-1"></i>Enviar agora</button>':''}</div>
    <div class="v193-conf" id="v193-conf"><div><b>Enviar agora para ${EST.destinatarios.length} pessoa(s)?</b></div><div class="sub">${E(EST.destinatarios.join(', '))}</div>
      <div class="v193-row"><button class="btn-apple" onclick="V193.envia()">Sim, enviar</button><button class="btn-apple" style="background:transparent;color:inherit;border:1px solid rgba(0,0,0,.2)" onclick="V193.cancela()">Cancelar</button></div></div>
    ${EST.remetente_ok?'':'<div class="sub" style="color:#b23">O remetente ainda não está configurado no servidor — nada pode ser enviado até lá.</div>'}</div>`;
  return hd+`<div class="v193-g">${agenda}${dest}${semana}</div><div class="sub mt-3" style="font-size:12px">Os números são calculados no servidor com as mesmas regras do CRM (Painel de Gestão, sem filtros), a partir da base compartilhada.</div>`}
function addD(iso,n){const d=new Date(String(iso).slice(0,10)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}

function post(modo,corpo,extra){return fetch(API+'?modo='+modo+(extra||''),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({por:quemSou()||'BASE'},corpo||{}))}).then(r=>r.json())}
function salvar(corpo,msg){if(!pode())return;post('config',corpo).then(j=>{if(!j.ok)throw new Error(j.erro);toast_(msg);EST=null;carregar()}).catch(e=>toast_('Não salvou: '+(e.message||e)))}
window.V193={recarregar(){EST=null;ERR='';carregar()},
  liga(v){salvar({envio_auto:v},v?'Envio semanal ligado':'Envio semanal desligado')},
  salvarAgenda(){const d=+document.getElementById('v193-dia').value,h=document.getElementById('v193-hora').value;salvar({envio_dia:d,envio_hora:h},'Envio: '+DIAS[d]+' às '+h)},
  salvarDest(){const t=document.getElementById('v193-dest').value;salvar({emails_painel:t},'Destinatários salvos')},
  pedeEnvio(){const c=document.getElementById('v193-conf');if(c)c.style.display='flex'},cancela(){const c=document.getElementById('v193-conf');if(c)c.style.display='none'},
  envia(){V193.cancela();toast_('Enviando o fechamento…');post('enviar',{},'&confirmo=sim').then(j=>{if(!j.ok||!j.enviado)throw new Error(j.erro||j.motivo||'não enviado');toast_('Fechamento enviado para '+j.para.length+' pessoa(s)');EST=null;carregar()}).catch(e=>toast_('Não enviou: '+(e.message||e)))}};

/* 20/11 (Bruno): o envio semanal mora DENTRO da Base › Relacionamento (CRM), numa aba depois de "Log" — não num item solto da Base */
function ligaAba(){try{const orig=SCREENS.dbcrm;if(typeof orig!=='function'||orig.__v193)return false;
  const g=function(arg){if(arg!=='envio')return String(orig.apply(this,arguments)).replace(/(href="#\/dbcrm\/log">[\s\S]*?<\/a>)/,'$1'+abaLink(false));
    let h=String(orig.call(this,'__envio'));h=h.replace(/(href="#\/dbcrm\/log">[\s\S]*?<\/a>)/,'$1'+abaLink(true));return h+tela(true)};
  g.__v193=true;SCREENS.dbcrm=g;return true}catch(e){console.error('v193 aba',e);return false}}
function abaLink(on){return `<a class="btn-soft" style="font-size:12px;${on?'background:var(--apple-subtle,#e0f2fe);font-weight:700':''}" href="#/dbcrm/envio">Envio semanal</a>`}
if(!ligaAba()){let n=0;const t=setInterval(()=>{if(ligaAba()||++n>60)clearInterval(t)},500)}
/* o endereço antigo (#/dbenvio) leva para a aba nova; o item solto sai do menu da Base */
try{SCREENS.dbenvio=function(){setTimeout(()=>{location.hash='#/dbcrm/envio'},0);return ''};LABEL.dbenvio='Envio semanal do CRM';SEC_OF.dbenvio='bd';if(window.OWNER)OWNER.dbenvio='bd'}catch(e){}
function menu(){try{const bd=NAV.find(s=>s.id==='bd');if(!bd)return;const i=bd.items.findIndex(x=>x[0]==='dbenvio');if(i>=0)bd.items.splice(i,1)}catch(e){}}
menu();
try{const _rn=window.renderNav;if(typeof _rn==='function'&&!_rn.__v193){const g=function(){menu();return _rn.apply(this,arguments)};g.__v193=true;Object.keys(_rn).forEach(k=>{try{g[k]=_rn[k]}catch(e){}});window.renderNav=g;try{renderNav=g}catch(e){}}}catch(e){}

/* ───── os botões do CRM passam a usar o mesmo servidor (antes: simulado) ───── */
function ligaCRM(){try{if(!window.CRM_SERVER||CRM_SERVER.__v193)return false;const api0=CRM_SERVER.api;
  CRM_SERVER.api=function(payload){let req=null;try{req=JSON.parse(payload||'{}')}catch(e){}
    if(req&&req.action==='enviarPainel'){post('enviar',{por:quemSou()||'FECHAR A SEMANA',sem_snapshot:true},'&confirmo=sim').then(j=>toast_(j.ok&&j.enviado?'Fechamento enviado para '+j.para.length+' pessoa(s)':'Não enviou: '+(j.erro||j.motivo))).catch(e=>toast_('Não enviou: '+e.message));
      return JSON.stringify({ok:true,result:{enviado:true,para:T(()=>EST.destinatarios,[]),de:T(()=>EST.remetente,''),anexo:true}})}
    if(req&&req.action==='enviarAutomatico'){post('enviar',{por:quemSou()||'ENVIAR AGORA (CRM)'},'&confirmo=sim').then(j=>toast_(j.ok&&j.enviado?'Teste enviado para '+j.para.length+' pessoa(s)':'Não enviou: '+(j.erro||j.motivo))).catch(e=>toast_('Não enviou: '+e.message));
      return JSON.stringify({ok:true,result:{enviado:true,para:[],simulado:false}})}
    if(req&&req.action==='gatilhoSemanal'){post('config',{envio_auto:!!req.ligar}).catch(()=>{});return JSON.stringify({ok:true,result:req.ligar?{proximo:'conforme Base › Relacionamento (CRM) › Envio semanal'}:{removido:true}})}
    return api0.apply(this,arguments)};CRM_SERVER.__v193=true;return true}catch(e){console.error('v193 crm',e);return false}}
if(!ligaCRM()){let n=0;const t=setInterval(()=>{if(ligaCRM()||++n>60)clearInterval(t)},1000)}
})();
