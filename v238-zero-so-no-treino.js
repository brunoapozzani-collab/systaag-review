/* v238 — COMEÇAR DO ZERO SÓ EXISTE NO MODO TREINO (Bruno, 27-Nov-2026)
   "It should be locked under 1000 keys — if someone presses that the entire system goes to zero. The only situation where
   this is okay is when someone is training and goes on Aprender fazendo."
   A base agora é compartilhada (v172): esvaziar a base de um computador é esvaziar a de todos. Por isso, FORA do Modo treino:
     · "Começar do zero" e "Resetar dados (demonstração)" deixam de existir — os botões saem e as funções não fazem nada;
     · o cartão "Sistema do zero" (Início) e a pastilha "sistema do zero" saem;
     · uma base real que ainda carregue a marca de zero (cópia velha de um computador, ou a marca na nuvem) é curada sozinha:
       a marca sai, e os registros voltam da base compartilhada na primeira leitura da nuvem — sem ninguém apertar nada.
   No Modo treino (Aprender fazendo) nada muda: o cofre de treino continua a nascer vazio e a poder recomeçar. */
(function(){'use strict';
if(window.__v238)return;window.__v238=true;
if(window.__TREINO){console.info('v238: modo treino — zero permitido (só no cofre de treino)');return}
if(typeof S==='undefined'||!S||!S.db){console.error('v238: S.db ausente');return}

var MSG_ZERO='“Começar do zero” só existe no Modo treino (Aprender fazendo). A base real não pode ser zerada.';
var MSG_DEMO='“Resetar dados (demonstração)” foi retirado: a base real não pode ser trocada por dados fictícios.';
function avisa(m){try{toast(m,true)}catch(e){try{console.warn('v238: '+m)}catch(x){}}}

/* ───── 1. as funções não fazem nada fora do treino (a mais de fora ganha: nenhuma camada anterior chega a rodar) ───── */
function tranca(){
  try{if(typeof MG!=='undefined'&&MG&&!(MG.zerar&&MG.zerar.__v238)){var z=function(){avisa(MSG_ZERO)};z.__v238=1;MG.zerar=z}}catch(e){}
  try{if(window.V139){if(!(V139.zerar&&V139.zerar.__v238)){var a=function(){avisa(MSG_ZERO)};a.__v238=1;V139.zerar=a}
    if(!(V139.resetar&&V139.resetar.__v238)){var b=function(){avisa(MSG_DEMO)};b.__v238=1;V139.resetar=b}}}catch(e){}
  try{if(!(window.aplicarZero&&window.aplicarZero.__v238)){var az=function(db){try{console.warn('v238: aplicarZero bloqueado fora do Modo treino')}catch(e){}return db};az.__v238=1;window.aplicarZero=az}}catch(e){}
  try{if(!(window.reset&&window.reset.__v238)){var rs=function(){avisa(MSG_DEMO)};rs.__v238=1;window.reset=rs}}catch(e){}
  try{if(!(window.V140_sairDoZero&&window.V140_sairDoZero.__v238)){var sz=function(){cura()};sz.__v238=1;window.V140_sairDoZero=sz}}catch(e){}
}

/* ───── 2. os botões e o cartão saem da tela ───── */
try{var st=document.createElement('style');st.id='v238-css';
  st.textContent='#v140-zero,#mg-zero,#mg-ask,[onclick="MG.zerar()"],[onclick="MG.zerar(1)"],[onclick="V139.zerar()"],[onclick="V139.resetar()"],[onclick^="reset()"]{display:none!important}';
  (document.head||document.documentElement).appendChild(st)}catch(e){}
function varre(){try{document.querySelectorAll('#v140-zero,#mg-zero,#mg-ask,[onclick="MG.zerar()"],[onclick="MG.zerar(1)"],[onclick="V139.zerar()"],[onclick="V139.resetar()"],[onclick^="reset()"]').forEach(function(n){n.remove()})}catch(e){}}

/* ───── 3. a cura: uma base real nunca fica com a marca de zero ───── */
function cura(){var mudou=false;
  try{if(S.db.af113_zero){delete S.db.af113_zero;mudou=true}}catch(e){}
  try{if(localStorage.getItem('systaag_zero')!=null){localStorage.removeItem('systaag_zero');mudou=true}}catch(e){}
  if(mudou){try{if(typeof log==='function')log('base','v238','Marca de “sistema do zero” retirada da base real — o modo zero só existe no Modo treino')}catch(e){}
    try{if(window.save&&window.save.agora){window.save();window.save.agora()}else if(typeof save==='function')save()}catch(e){console.error('v238 save',e)}
    try{if(typeof renderMain==='function')renderMain()}catch(e){}
    console.warn('v238: a base real estava marcada como “sistema do zero” — marca retirada; os registros vêm da base compartilhada')}
  return mudou}

tranca();cura();varre();
/* a marca pode estar na nuvem (base:_k / af113_zero) e voltar na primeira leitura: depois dela, cura de novo — e aí a
   retirada sobe para a nuvem (um registro só), para nenhum outro computador a receber */
window.addEventListener('v172-pronta',function(){try{tranca();cura();varre()}catch(e){}});
/* e a cada desenho: nenhuma camada devolve os botões nem a marca */
try{var _rm=window.renderMain;if(typeof _rm==='function'&&!_rm.__v238){var rm=function(){var r=_rm.apply(this,arguments);try{tranca();if(S.db&&S.db.af113_zero)cura();varre()}catch(e){}return r};rm.__v238=1;window.renderMain=rm}}catch(e){}
setInterval(function(){try{tranca();if(S.db&&S.db.af113_zero)cura();varre()}catch(e){}},2000);
window.V238={cura:cura,curouNaCarga:function(){return !!window.__v238curou}};
})();
