/* v139 — GOVERNANÇA (Bruno, 02-Nov-2026)
   §1 "Começar do zero" e "Resetar dados" saem do Início. Moram só na Base › Mapa de entidades › Zona de risco,
      visíveis apenas para perfis com a permissão "zerar" (Usuários e permissões), exigem digitar ZERAR + marcar
      a confirmação, e são REVERSÍVEIS: antes de apagar, a base inteira é guardada (até 3 cópias) e pode ser
      restaurada com um clique na mesma Zona de risco.
   §2 "Rastro — o que mudou" (a gaveta lateral e o ícone do topo) deixa de existir.
   §3 Pessoas: quem está no sistema sem ficha de RH ganha "Criar ficha" (abre Novo colaborador já preenchido) e
      toda pessoa ganha "Excluir" (sai de todas as tabelas de pessoas de uma vez, com confirmação).
   §4 "Disciplina (técnico)" só aparece quando a Classificação é Custo direto de obra (técnico) — Financeiro e
      Comercial não têm disciplina. */
(function(){
'use strict';
if(window.__v139)return;window.__v139=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const podem=p=>{try{return typeof can==='function'&&!!can(p)}catch(e){return false}};
const KEYS=['systaag_erp1z','systaag_erp1','systaag_crm_t','systaag_zero','systaag_guia124'];
const SNAP='systaag_snap_';

/* ───── §1 permissão + snapshots ───── */
try{if(typeof PERMS==='object'&&!PERMS.zerar)PERMS.zerar='Começar do zero / restaurar a base (Zona de risco)';
  if(S.db&&Array.isArray(S.db.perfis)&&!S.db._v139perm){S.db._v139perm=1;const g=S.db.perfis.find(p=>p.id==='gestor'||/gestor|diretor/i.test(p.papel||''));if(g&&!g.perms.includes('zerar'))g.perms.push('zerar');try{save()}catch(e){}}}catch(e){}
function snaps(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(SNAP)){try{const j=JSON.parse(localStorage.getItem(k));out.push({k,ts:+k.slice(SNAP.length),label:j.label||'',n:j.n||''})}catch(e){}}}return out.sort((a,b)=>b.ts-a.ts)}
function guardar(label){try{if(window.save&&window.save.agora)window.save.agora();else if(typeof save==='function')save()}catch(e){}
  try{const j={label,n:resumo()};KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!=null)j[k]=v});localStorage.setItem(SNAP+Date.now(),JSON.stringify(j));
    snaps().slice(3).forEach(s=>localStorage.removeItem(s.k));return true}catch(e){console.error('v139 snapshot',e);return false}}
function resumo(){try{const d=S.db;return `${(d.clientes||[]).length} clientes · ${(d.propostas||[]).length} propostas · ${(d.unidades||[]).length} unidades · ${(d.lancamentos||[]).length} lançamentos`}catch(e){return ''}}
const dBR=ts=>{const d=new Date(ts);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
window.V139={guardar,
  zerar(){if(!podem('zerar')){toast('Seu perfil não tem a permissão "Começar do zero". Peça a um gestor (Usuários e permissões).',true);return}
    dialogo('Começar do zero','Apaga clientes, obras, propostas, unidades, pedidos, lançamentos, parceiros, fornecedores e pessoas. Mantém o catálogo, as listas, os locais, o seu usuário e a meta anual.<br><b>Uma cópia da base de hoje fica guardada</b> e pode ser restaurada aqui mesmo, na Zona de risco.','ZERAR',()=>{guardar('antes de Começar do zero');MG.zerar(1)})},
  resetar(){if(!podem('zerar')){toast('Seu perfil não tem a permissão "Começar do zero". Peça a um gestor.',true);return}
    dialogo('Resetar dados (demonstração)','Troca TODA a base pelos dados fictícios de demonstração. <b>Uma cópia da base de hoje fica guardada</b> e pode ser restaurada aqui mesmo.','RESETAR',()=>{guardar('antes de Resetar dados');try{localStorage.removeItem('systaag_zero')}catch(e){}reset();try{if(window.save&&window.save.agora)window.save.agora()}catch(e){}location.reload()})},
  restaurar(k){if(!podem('zerar'))return;let j;try{j=JSON.parse(localStorage.getItem(k))}catch(e){}if(!j){toast('Cópia não encontrada.',true);return}
    dialogo('Restaurar a base','Volta a base inteira para como estava em <b>'+E(dBR(+k.slice(SNAP.length)))+'</b> ('+E(j.n||'')+'). O que foi feito depois dessa data se perde — por isso uma cópia de agora também fica guardada.','RESTAURAR',()=>{guardar('antes de restaurar');try{KEYS.forEach(x=>localStorage.removeItem(x));KEYS.forEach(x=>{if(j[x]!=null)localStorage.setItem(x,j[x])})}catch(e){}congela();location.reload()})},
  /* v145.3 — os dois links (artefato e Vercel) são dois cofres separados no navegador: a base de um não aparece no outro.
     "Copiar a base" põe a base inteira (as mesmas chaves das cópias de segurança) na área de transferência, em Base64; "Colar" aplica no outro link. */
  copiar(){try{const j={systaag_pacote:1,de:location.host,quando:new Date().toISOString(),n:resumo()};KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!=null)j[k]=v});const txt=(typeof LZString!=='undefined'?LZString.compressToBase64(JSON.stringify(j)):btoa(unescape(encodeURIComponent(JSON.stringify(j)))));
      const done=()=>toast('Base copiada ('+E(j.n)+'). No outro link: Base › Mapa de entidades › Zona de risco › Colar a base.');
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,()=>{const ta=document.getElementById('v139-pacote');if(ta){ta.value=txt;ta.select();done()}});else{const ta=document.getElementById('v139-pacote');if(ta){ta.value=txt;ta.select();document.execCommand('copy');done()}}}catch(e){toast('Não deu para copiar: '+e.message,true)}},
  colar(){if(!podem('zerar'))return;const ta=document.getElementById('v139-pacote');const txt=(ta&&ta.value||'').trim();if(!txt){toast('Cole aqui o texto copiado no outro link (Copiar a base).',true);return}
    let j=null;try{j=JSON.parse(typeof LZString!=='undefined'?LZString.decompressFromBase64(txt):decodeURIComponent(escape(atob(txt))))}catch(e){}if(!j||!j.systaag_pacote){toast('Isso não é uma base copiada do SYSTAAG.',true);return}
    dialogo('Colar a base de outro link','Troca a base deste link pela base copiada de <b>'+E(j.de||'?')+'</b> em <b>'+E(dBR(String(j.quando||'').slice(0,10)))+'</b> ('+E(j.n||'')+'). O que está aqui agora fica guardado como cópia.','COLAR',()=>{guardar('antes de colar a base de '+(j.de||'outro link'));try{KEYS.forEach(x=>localStorage.removeItem(x));KEYS.forEach(x=>{if(j[x]!=null)localStorage.setItem(x,j[x])})}catch(e){}congela();location.reload()})},
  apagarSnap(k){if(!podem('zerar'))return;if(!confirm('Apagar esta cópia de segurança?'))return;localStorage.removeItem(k);renderMain()},
  check(){const d=document.getElementById('v139-dlg');if(!d)return;const ok=d.querySelector('input[type=text]').value.trim().toUpperCase()===d.dataset.palavra&&d.querySelector('input[type=checkbox]').checked;d.querySelector('#v139-zero-ok').disabled=!ok}
};
/* depois de escrever a base restaurada, nenhuma gravação automática (pagehide, debounce) pode sobrescrevê-la antes do reload */
function congela(){try{const LS=window.localStorage,set0=Storage.prototype.setItem,rm0=Storage.prototype.removeItem;const RE=/^systaag_(erp1z?|zero|crm_t|guia124)$/;Storage.prototype.setItem=function(k,v){if(this===LS&&RE.test(k))return;return set0.call(this,k,v)};Storage.prototype.removeItem=function(k){if(this===LS&&RE.test(k))return;return rm0.call(this,k)};window.save=function(){};if(window.save)window.save.agora=function(){}}catch(e){}}
function dialogo(titulo,texto,palavra,go){const old=document.getElementById('v139-dlg');if(old)old.remove();
  const d=document.createElement('div');d.id='v139-dlg';d.dataset.palavra=palavra;d.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
  d.innerHTML=`<div class="card p-4" style="max-width:520px;width:100%;border-top:4px solid #d03b3b"><h5 class="mb-2"><i class="bi bi-exclamation-triangle-fill me-2" style="color:#d03b3b"></i>${E(titulo)}</h5><div class="sub mb-3" style="font-size:13px">${texto}</div>
    <label class="sub d-block mb-1" style="font-size:12px">Para confirmar, digite <b>${E(palavra)}</b></label><input type="text" class="form-control mb-2" autocomplete="off" oninput="V139.check()" placeholder="${E(palavra)}">
    <label class="d-flex gap-2 align-items-start mb-3" style="font-size:12.5px"><input type="checkbox" class="form-check-input mt-1" onchange="V139.check()"> Entendi: isto muda a base de todos os departamentos. Uma cópia de agora fica guardada na Zona de risco.</label>
    <div class="d-flex gap-2 justify-content-end"><button class="btn-soft" onclick="document.getElementById('v139-dlg').remove()">Cancelar</button><button id="v139-zero-ok" class="btn-apple" disabled style="background:#d03b3b">Confirmar</button></div></div>`;
  d.querySelector('#v139-zero-ok').onclick=()=>{d.remove();go()};document.body.appendChild(d);setTimeout(()=>d.querySelector('input[type=text]').focus(),50)}
function zonaRisco(){const ok=podem('zerar');const ss=snaps();
  return `<div class="card p-3 mt-3" id="v139-risco" style="border-left:4px solid #d03b3b"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><b><i class="bi bi-shield-lock me-1"></i>Zona de risco</b><div class="sub" style="font-size:12px">Ações que mudam a base inteira. Só perfis com a permissão <b>“${E(PERMS.zerar||'zerar')}”</b> (Base › Pessoas › Usuários e permissões). Cada ação guarda uma cópia da base antes — e a cópia volta com um clique.</div></div>
   ${ok?`<div class="d-flex gap-2"><button class="btn-soft" onclick="V139.zerar()" title="Esvazia o sistema para seguir o Manual operacional desde o primeiro passo"><i class="bi bi-eraser me-1"></i>Começar do zero</button><button class="btn-soft" onclick="V139.resetar()"><i class="bi bi-arrow-counterclockwise me-1"></i>Resetar dados (demonstração)</button></div>`:`<span class="chip">bloqueado para o seu perfil</span>`}</div>
   <div class="mt-3"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em">LEVAR A BASE PARA O OUTRO LINK</div><div class="sub mb-2" style="font-size:12px">Cada link (artefato · systaag-review) guarda a sua própria base no navegador. Para os dois mostrarem os mesmos números: aqui <b>Copiar</b>, no outro link <b>Colar</b>.</div><div class="d-flex gap-2 flex-wrap align-items-start"><button class="btn-soft" onclick="V139.copiar()"><i class="bi bi-clipboard me-1"></i>Copiar a base deste link</button>${ok?`<textarea id="v139-pacote" class="form-control" rows="1" placeholder="cole aqui o texto copiado no outro link" style="max-width:360px;font-size:11px"></textarea><button class="btn-soft" onclick="V139.colar()"><i class="bi bi-clipboard-check me-1"></i>Colar a base</button>`:''}</div></div>
   ${ss.length?`<div class="mt-2"><div class="sub mb-1" style="font-size:11px;letter-spacing:.06em">CÓPIAS GUARDADAS · ${ss.length} de 3</div><table class="tbl no-filter"><tbody>${ss.map(s=>`<tr><td>${E(dBR(s.ts))}</td><td>${E(s.label)}</td><td class="sub">${E(s.n)}</td><td class="text-end">${ok?`<button class="btn-soft" onclick="V139.restaurar('${s.k}')"><i class="bi bi-arrow-return-left me-1"></i>Restaurar esta base</button> <button class="btn-soft" title="Apagar cópia" onclick="V139.apagarSnap('${s.k}') /* usa confirm() — a palavra liga o modal interno da página */"><i class="bi bi-x"></i></button>`:''}</td></tr>`).join('')}</tbody></table></div>`:`<div class="sub mt-2" style="font-size:11px">Nenhuma cópia guardada ainda — a primeira é feita automaticamente antes de zerar ou resetar.</div>`}</div>`}
/* Mapa de entidades ganha a Zona de risco; Início perde os botões */
const STRIP=h=>typeof h==='string'?h.replace(/<button[^>]*onclick="MG\.zerar\(\)"[^>]*>[\s\S]*?<\/button>/g,'').replace(/<button[^>]*onclick="reset\(\)(;(render|location\.reload)\(\))?"[^>]*>[\s\S]*?<\/button>/g,''):h;
function envolve(){try{const f=SCREENS.dbmapa;if(f&&!f.__v139){SCREENS.dbmapa=function(arg){let h=STRIP(f.apply(this,arguments));if(typeof h==='string'&&!arg)h+=zonaRisco();return h};SCREENS.dbmapa.__v139=1}
  ['home','basedados','fin'].forEach(k=>{const g=SCREENS[k];if(g&&!g.__v139){SCREENS[k]=function(){return STRIP(g.apply(this,arguments))};SCREENS[k].__v139=1}})}catch(e){console.error('v139 envolve',e)}}
envolve();
function varre(){try{document.querySelectorAll('#main [onclick="MG.zerar()"],#main [onclick^="reset()"],.inicio-hero [onclick="MG.zerar()"]').forEach(b=>b.remove());if(location.hash==='#/dbmapa'&&!document.getElementById('v139-risco')){const m=document.getElementById('main');if(m)m.insertAdjacentHTML('beforeend',zonaRisco())}}catch(e){}}

/* ───── §2 Rastro — o que mudou: some ───── */
function semRastro(){try{const d=document.getElementById('drawer');if(d)d.remove();const ic=document.getElementById('rastroN');if(ic){const b=ic.closest('button')||ic.parentElement;if(b)b.remove()}
  document.querySelectorAll('header .iconbtn').forEach(b=>{if(/rastro|o que mudou|atividade/i.test(b.title||'')||b.querySelector('.bi-activity'))b.remove()})}catch(e){}}
try{window.renderDrawer=function(){};}catch(e){}
semRastro();

/* ───── §3 Pessoas: criar ficha / excluir ───── */
window.V139_criarFicha=function(key){try{const e=ASM.pessoas().lista.find(x=>x.key===key);if(!e)return;const r=Object.values(e.em).flat()[0]||{};const u=(e.em.usuarios||[])[0];
  try{novoColabOpen=true}catch(x){window.novoColabOpen=true}location.hash="#/dbpessoas";render();
  setTimeout(()=>{const set=(id,v)=>{const el=document.getElementById(id);if(el&&v!=null&&v!==''){el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}))}};set('nc_nome',e.nomes[0]);set('nc_cargo',r.cargo||'');set('nc_dep',r.dep||(u&&u.setor)||'');const n=document.getElementById('nc_nome');if(n)n.scrollIntoView({behavior:'smooth',block:'center'});const s=document.getElementById('nc_sal');if(s)s.focus();toast('Ficha de '+e.nomes[0]+': confira cargo e departamento, informe o salário e clique em Salvar.')},120)}catch(err){console.error('v139 ficha',err)}};
window.V139_excluir=function(key){try{const e=ASM.pessoas().lista.find(x=>x.key===key);if(!e)return;const nome=e.nomes[0];const onde=Object.entries(e.em).map(([t,rs])=>t+' ('+rs.length+')').join(', ');
  if(!confirm(`Excluir ${nome} do sistema?\n\nSai de: ${onde}.\nLançamentos, obras e propostas já feitos continuam com o nome gravado.`))return;
  let n=0;Object.entries(e.em).forEach(([t,rs])=>{if(!Array.isArray(S.db[t]))return;S.db[t]=S.db[t].filter(r=>!rs.includes(r));n+=rs.length});
  if(Array.isArray(S.db.pessoas))S.db.pessoas=S.db.pessoas.filter(p=>!e.nomes.includes(p.nome));
  try{log('pessoas',key,'excluída de '+n+' registro(s)')}catch(x){}try{if(typeof syncMaster==='function')syncMaster()}catch(x){}save();renderMain();toast(nome+' excluída de '+n+' registro(s).')}catch(err){if(err&&typeof err==='object'&&'k' in err&&'m' in err)throw err; /* pedido de confirm() do modal interno: tem de subir até quem abre o modal */ console.error('v139 excluir',err)}};
function pessoasBotoes(){try{const m=document.getElementById('main');if(!m)return;
  m.querySelectorAll('table.bdgrid tbody tr').forEach(tr=>{if(tr.querySelector('[data-v139]'))return;const td=tr.cells[0];if(!td)return;const sel=tr.querySelector('[onchange^="__pes("]');const mk=sel&&(sel.getAttribute('onchange').match(/__pes\('([^']+)'/)||[])[1];if(!mk)return;
    const sem=td.querySelector('div.sub');const semFicha=sem&&/sem ficha/i.test(sem.textContent);
    const box=document.createElement('div');box.setAttribute('data-v139','1');box.className='d-flex gap-1 mt-1 flex-wrap';
    box.innerHTML=(semFicha?`<button class="btn-soft" style="font-size:11px;padding:2px 8px" onclick="V139_criarFicha('${E(mk)}')"><i class="bi bi-person-plus me-1"></i>Criar ficha</button>`:'')+`<button class="btn-soft" style="font-size:11px;padding:2px 8px;color:#b42318" title="Excluir esta pessoa de todas as tabelas" onclick="V139_excluir('${E(mk)}') /* usa confirm() — a palavra liga o modal interno da página */"><i class="bi bi-trash me-1"></i>Excluir</button>`;
    if(semFicha)sem.replaceWith(box);else td.appendChild(box)})}catch(e){}}

/* ───── §4 Disciplina só para técnico ───── */
function disciplina(){try{const cl=document.getElementById('nc_cl'),di=document.getElementById('nc_disc');if(!cl||!di)return;const wrap=di.closest('.col-md-2,.col-md-3,.col-6,div');const ap=()=>{const tec=cl.value==='cmv';if(wrap)wrap.style.display=tec?'':'none';if(!tec)di.value=di.options[0]?di.options[0].value:''};if(!cl.__v139){cl.__v139=1;cl.addEventListener('change',ap)}ap()}catch(e){}}

function pos(){varre();pessoasBotoes();disciplina();semRastro()}
try{const _rm=window.renderMain;window.renderMain=function(){envolve();const r=_rm.apply(this,arguments);try{pos()}catch(e){}return r}}catch(e){}
try{const mo=new MutationObserver(ms=>{if(ms.some(x=>x.addedNodes&&x.addedNodes.length)){clearTimeout(window.__v139t);window.__v139t=setTimeout(pos,60)}});const st=()=>{const m=document.getElementById('main');if(m)mo.observe(m,{childList:true,subtree:true});else setTimeout(st,300)};st()}catch(e){}
setTimeout(pos,900);
})();
