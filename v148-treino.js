/* v148 — MODO TREINO (Bruno, 04-Nov-2026)
   "Aprender do zero" não pode mais zerar o sistema: a base agora tem dados reais. O treino acontece num COFRE
   SEPARADO do navegador (chaves "treino:*", ver o shim no topo do index.html). Enquanto o modo está ligado, toda
   leitura e gravação do protótipo vai para esse cofre; a base real fica intocada e volta ao sair.
   · Entrar: copia a base real para o cofre de treino e aplica o "Começar do zero" lá dentro (catálogo, listas e
     locais ficam; registros somem) — o mesmo esqueleto que o Manual operacional pede.
   · Faixa laranja fixa "MODO TREINO — nada aqui é real", com Sair e Recomeçar.
   · "Aprender fazendo" fora do treino pergunta antes e entra no treino já com o guia aberto.
   · O capítulo 1 do guia ("Começar do zero") vira "Modo treino": o zero já foi feito ao entrar.
   · Base › Mapa de entidades ganha o cartão "Modo treino" (ao lado da Zona de risco). */
(function(){
'use strict';
if(window.__v148)return;window.__v148=true;
var RAW=window.__TREINO_RAW,ON=!!window.__TREINO,F='systaag_treino_on',P='treino:',FRESH='systaag_treino_fresh',AUTO='systaag_treino_guia';
if(!RAW){console.error('v148: shim do modo treino não carregou (index.html topo)');return}
var E=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function salvaAgora(){try{if(window.save&&window.save.agora)window.save.agora();else if(typeof save==='function')save()}catch(e){}}
function tst(m,bad){try{toast(m,bad)}catch(e){console.log(m)}}

/* ───── entrar / sair / recomeçar ───── */
function copiaRealParaTreino(){
  /* chaves reais → cofre (tudo que é systaag_*, menos as cópias de segurança e a própria chave do modo) */
  RAW.keys().forEach(function(k){if(k.indexOf(P)===0)RAW.rm(k)});
  RAW.keys().forEach(function(k){if(k===F||k.indexOf(P)===0||k.indexOf('systaag_')!==0||k.indexOf('systaag_snap_')===0)return;var v=RAW.get(k);if(v!=null)RAW.set(P+k,v)});
  RAW.rm(P+'systaag_guia124');          /* progresso do guia começa limpo no treino */
  RAW.set(P+FRESH,'1')}
function entrar(comGuia){
  if(ON){if(comGuia)abreGuia();return}
  salvaAgora();
  try{copiaRealParaTreino();if(comGuia)RAW.set(P+AUTO,'1');RAW.set(F,'1')}catch(e){tst('Não deu para abrir o modo treino: '+e.message,true);return}
  location.reload()}
function sair(){if(!ON)return;salvaAgora();try{RAW.set(F,'0')}catch(e){}location.reload()}
function recomecar(){if(!ON){entrar(false);return}
  pergunta('Recomeçar o treino?','Apaga tudo o que você fez no treino e abre o cofre de novo, vazio (catálogo, listas e locais da base real). A base real não muda.','Sim, recomeçar',function(){
    congela();
    try{RAW.set(F,'0');copiaRealParaTreino();RAW.set(P+AUTO,'1');RAW.set(F,'1')}catch(e){}location.reload()})}
function abreGuia(){try{if(window.GUIA&&GUIA.iniciar)GUIA.iniciar(0)}catch(e){}}
/* depois de montar o cofre novo, nenhuma gravação automática (pagehide, debounce) da página velha pode sobrescrevê-lo antes do reload */
function congela(){try{var set0=Storage.prototype.setItem,rm0=Storage.prototype.removeItem,RE=/^(treino:)?systaag_(erp1z?|zero|crm_t|guia124|fin_perfil|fin_role|acu_sess)$/;
  Storage.prototype.setItem=function(k,v){if(RE.test(String(k)))return;return set0.call(this,k,v)};Storage.prototype.removeItem=function(k){if(RE.test(String(k)))return;return rm0.call(this,k)};
  window.save=function(){};window.save.agora=function(){}}catch(e){}}

/* ───── ao carregar dentro do treino: aplicar o zero uma vez, abrir o guia se pedido ───── */
if(ON){try{
  if(localStorage.getItem(FRESH)==='1'){localStorage.removeItem(FRESH);
    if(typeof window.aplicarZero==='function'&&typeof S!=='undefined'&&S&&S.db){window.aplicarZero(S.db);delete S.db.af107_cons;delete S.db.af107_usr;salvaAgora()}
    var auto=localStorage.getItem(AUTO)==='1';localStorage.removeItem(AUTO);
    if(auto){try{if(window.GUIA&&GUIA.iniciar){GUIA.iniciar(0);const cap=+(localStorage.getItem('systaag_treino_cap')||0);localStorage.removeItem('systaag_treino_cap');if(cap>0)GUIA.cap(cap)}}catch(e){}}
    location.reload()}
}catch(e){console.error('v148 fresh',e)}}

/* ───── a faixa ───── */
var COR='#ff7a00';
function faixa(){if(!ON||document.getElementById('v148-pill'))return;
  var st=document.createElement('style');st.textContent='#v148-frame{position:fixed;inset:0;pointer-events:none;z-index:99990;box-shadow:inset 0 0 0 5px '+COR+'}'+
   '#v148-pill{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99995;display:flex;align-items:center;gap:10px;background:'+COR+';color:#fff;padding:9px 12px 9px 16px;border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,.28);font:700 13px/1 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap}'+
   '#v148-pill button{border:0;border-radius:999px;padding:7px 12px;font:600 12px/1 inherit;cursor:pointer;background:rgba(255,255,255,.22);color:#fff}#v148-pill button:hover{background:rgba(255,255,255,.36)}#v148-pill button.sair{background:#fff;color:'+COR+'}'+
   '#mg-zero,#v140-zero{display:none!important}.toast-wrap{bottom:76px!important}'+
   '@media (max-width:1500px){#v148-pill .t2{display:none}}@media (max-width:640px){#v148-pill{font-size:11px;gap:6px;padding:7px 8px 7px 12px}}';
  document.head.appendChild(st);
  var fr=document.createElement('div');fr.id='v148-frame';document.body.appendChild(fr);
  var p=document.createElement('div');p.id='v148-pill';
  p.innerHTML='<i class="bi bi-mortarboard-fill"></i><span>MODO TREINO<span class="t2"> — nada aqui é real</span></span>'+
   '<button id="v148-ok" type="button" title="Confirma que você viu a faixa (passo 1 do guia)" onclick="V148.entendi()">Entendi</button>'+
   '<button type="button" title="Apaga o treino e começa de novo, vazio" onclick="V148.recomecar()"><i class="bi bi-arrow-counterclockwise"></i> Recomeçar</button>'+
   '<button type="button" class="sair" title="Volta para a base real. O treino fica guardado para continuar depois." onclick="V148.sair()">Sair do treino</button>';
  document.body.appendChild(p);
  try{if(document.title.indexOf('TREINO')<0)document.title='TREINO · '+document.title}catch(e){}
  try{if(window.__v148_ok)document.getElementById('v148-ok').style.display='none'}catch(e){}}

/* ───── pergunta simples (mesmo visual da Zona de risco, sem a palavra) ───── */
function pergunta(titulo,texto,botao,go){var old=document.getElementById('v148-dlg');if(old)old.remove();
  var d=document.createElement('div');d.id='v148-dlg';d.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
  d.innerHTML='<div class="card p-4" style="max-width:520px;width:100%;border-top:4px solid '+COR+'"><h5 class="mb-2"><i class="bi bi-mortarboard-fill me-2" style="color:'+COR+'"></i>'+E(titulo)+'</h5><div class="sub mb-3" style="font-size:13px">'+texto+'</div>'+
   '<div class="d-flex gap-2 justify-content-end"><button class="btn-soft" onclick="document.getElementById(\'v148-dlg\').remove()">Cancelar</button><button class="btn-apple" style="background:'+COR+'">'+E(botao)+'</button></div></div>';
  d.querySelector('.btn-apple').onclick=function(){d.remove();go()};document.body.appendChild(d)}

/* ───── "Aprender fazendo" fora do treino: entra no treino primeiro ───── */
function engancha(){try{if(!window.GUIA||!GUIA.iniciar||GUIA.iniciar.__v148)return;var _ini=GUIA.iniciar;
  var ini=function(i){if(ON||(i||0)>0)return _ini.apply(this,arguments);
    pergunta('Aprender fazendo acontece no Modo treino','Você vai praticar numa cópia vazia do sistema (catálogo, listas e locais ficam). <b>A base real não muda.</b> Quando terminar, clique em <b>Sair do treino</b> na faixa laranja e tudo volta como estava.','Entrar no modo treino',function(){entrar(true)})};
  ini.__v148=true;GUIA.iniciar=ini}catch(e){}}
engancha();

/* ───── capítulo 1 do guia no treino: "Começar do zero" já foi feito ao entrar ───── */
function capitulo(){try{if(ON&&Array.isArray(window.GUIA_CAPS)){const u=GUIA_CAPS[GUIA_CAPS.length-1];if(u&&u.passos){const k=u.passos.findIndex(p=>p.id==='c11p99');if(k>=0)u.passos.splice(k,1)}}}catch(e){}
  try{if(!ON||!Array.isArray(window.GUIA_CAPS)||!GUIA_CAPS.length||GUIA_CAPS[0].__v148)return;
  GUIA_CAPS[0]={__v148:true,titulo:'Modo treino',depto:'Base de dados',
   objetivo:'A história começa numa empresa vazia — e aqui ela é vazia de propósito: você está num cofre de treino separado. Tudo o que fizer fica só aqui; a base real não muda.',
   aprendeu:['A faixa laranja no rodapé diz que você está no treino: nada aqui é real.','O catálogo de produtos, as listas e os locais do estoque vieram da base real; os registros (clientes, propostas, estoque…) nascem com você, capítulo a capítulo.','Sair do treino devolve a base real na hora; Recomeçar apaga o treino e abre outro, vazio.'],
   passos:[{id:'c0p01',tela:null,menu:'qualquer tela',faca:'Olhe a faixa laranja MODO TREINO no rodapé e clique em “Entendi”.',digite:[],alvo:{css:'#v148-ok',texto:'Entendi',frame:null},
     porque:'Antes de mexer, saber onde está: no treino. A base real continua guardada e volta com “Sair do treino”.',pronto:'!!window.__v148_ok',pula:false}]}}catch(e){}}
capitulo();

/* ───── Base › Mapa de entidades: o cartão ───── */
function cartao(){return '<div class="card p-3 mt-3" id="v148-card" style="border-left:4px solid '+COR+'"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><b><i class="bi bi-mortarboard-fill me-1"></i>Modo treino</b><div class="sub" style="font-size:12px">'+
  (ON?'Você está no treino. Nada do que fez aqui tocou a base real. <b>Sair</b> volta para a base real (o treino fica guardado); <b>Recomeçar</b> apaga o treino e abre outro, vazio.':'Aprenda o sistema sem risco: um cofre separado, vazio (catálogo, listas e locais da base real ficam), onde você monta uma venda inteira seguindo o <b>Aprender fazendo</b>. A base real não muda.')+
  '</div></div><div class="d-flex gap-2 flex-wrap">'+(ON?'<button class="btn-soft" onclick="V148.recomecar()"><i class="bi bi-arrow-counterclockwise me-1"></i>Recomeçar o treino</button><button class="btn-apple" style="background:'+COR+'" onclick="V148.sair()"><i class="bi bi-box-arrow-left me-1"></i>Sair do treino</button>':
  '<button class="btn-soft" onclick="V148.entrar(false)"><i class="bi bi-mortarboard me-1"></i>Entrar no modo treino</button><button class="btn-apple" style="background:'+COR+'" onclick="V148.entrar(true)"><i class="bi bi-play-fill me-1"></i>Entrar e abrir o guia</button>')+'</div></div></div>'}
function envolve(){try{var f=SCREENS.dbmapa;if(f&&!f.__v148){SCREENS.dbmapa=function(arg){var h=f.apply(this,arguments);if(typeof h==='string'&&!arg){var i=h.indexOf('<div class="card p-3 mt-3" id="v139-risco"');h=i>=0?h.slice(0,i)+cartao()+h.slice(i):h+cartao()}return h};SCREENS.dbmapa.__v148=1}}catch(e){console.error('v148 envolve',e)}}
envolve();
function varre(){try{if(location.hash==='#/dbmapa'&&!document.getElementById('v148-card')){var z=document.getElementById('v139-risco');if(z)z.insertAdjacentHTML('beforebegin',cartao());else{var m=document.getElementById('main');if(m)m.insertAdjacentHTML('beforeend',cartao())}}}catch(e){}
  faixa();engancha();capitulo()}

function zeroCom(cap){/* v149: treino novo (base real zerada) já com o guia no capítulo pedido */
  congela();try{RAW.set(F,'0');copiaRealParaTreino();RAW.set(P+AUTO,'1');RAW.set(P+'systaag_treino_cap',String(cap||0));RAW.set(F,'1')}catch(e){}location.reload()}
window.V148={entrar:entrar,sair:sair,recomecar:recomecar,ligado:function(){return ON},_pergunta:pergunta,_congela:congela,_zeroCom:zeroCom,
  entendi:function(){window.__v148_ok=true;try{document.getElementById('v148-ok').style.display='none'}catch(e){}tst('Certo. Agora o guia segue para o capítulo 2.')}};
setInterval(varre,600);
if(document.readyState==='complete')varre();else window.addEventListener('load',varre);
})();
