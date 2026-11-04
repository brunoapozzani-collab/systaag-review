/* v149 — PULAR PARA O CAPÍTULO DO SEU DEPARTAMENTO (Bruno, 04-Nov-2026)
   Quem é de Projetos não precisa montar a empresa inteira para aprender Projetos. No guia, "Capítulos" › clique no
   capítulo do seu departamento: o treino é montado com todos os capítulos anteriores JÁ FEITOS (a história do guia —
   Cliente Exemplo, PROP-DEMO-001, Obra 1001…) e o guia abre no primeiro passo do capítulo escolhido.
   · As "fotos" de cada capítulo (treino-snaps/capN.json) foram gravadas rodando o guia de ponta a ponta numa base zerada.
   · Regra: pular SUBSTITUI o que havia no cofre de treino (aviso antes). "Só abrir o capítulo" mantém o cofre como está.
   · O botão "Próximo: …" no fim de um capítulo continua como sempre — sem pergunta, sem troca de cofre.
   · A base real nunca é tocada: tudo vive no cofre "treino:*" (v148). */
(function(){
'use strict';
if(window.__v149caps)return;window.__v149caps=true;
var RAW=window.__TREINO_RAW,ON=!!window.__TREINO,P='treino:',F='systaag_treino_on',COR='#ff7a00';
if(!RAW){console.error('v149: shim do modo treino não carregou');return}
var E=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function tst(m,bad){try{toast(m,bad)}catch(e){console.log(m)}}
function titulo(i){try{return (GUIA_CAPS[i]||{}).titulo||('capítulo '+(i+1))}catch(e){return 'capítulo '+(i+1)}}

/* ───── montar o cofre no estado "fim do capítulo i-1" e abrir o guia no capítulo i ───── */
function montar(i){
  if(i<=1){if(window.V148&&V148._zeroCom){V148._zeroCom(i)}return}
  tst('Montando o treino com os capítulos 1 a '+i+' já feitos…');
  fetch('treino-snaps/cap'+(i-1)+'.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('foto do capítulo '+i+' não encontrada ('+r.status+')');return r.json()}).then(function(snap){
    if(window.V148&&V148._congela)V148._congela();
    try{RAW.keys().forEach(function(k){if(/^treino:systaag_(erp1z?|zero|crm_t|guia124|treino_fresh|treino_guia|treino_cap)$/.test(k))RAW.rm(k)});
      Object.keys(snap).forEach(function(k){RAW.set(P+k,snap[k])});
      RAW.set(P+'systaag_guia124',JSON.stringify({on:true,cap:i,passo:0,min:false,feitos:{},lista:false}));
      RAW.set(F,'1')}catch(e){tst('Não deu para montar o treino: '+e.message,true);return}
    location.reload()}).catch(function(e){tst(String(e.message||e),true)})}

/* ───── a pergunta (três saídas) ───── */
function pergunta(i,soAbrir){var old=document.getElementById('v149-dlg');if(old)old.remove();
  var d=document.createElement('div');d.id='v149-dlg';d.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
  var antes=i>=1?'os capítulos <b>1 a '+i+'</b> já feitos':'o sistema vazio';
  d.innerHTML='<div class="card p-4" style="max-width:560px;width:100%;border-top:4px solid '+COR+'"><h5 class="mb-2"><i class="bi bi-mortarboard-fill me-2" style="color:'+COR+'"></i>Pular para o capítulo '+(i+1)+'</h5><div class="sub mb-1" style="font-size:14px;font-weight:700">'+E(titulo(i))+'</div>'+
   '<div class="sub mb-3" style="font-size:13px">O treino será montado com '+antes+' (a história do guia: Cliente Exemplo, PROP-DEMO-001, Obra 1001…) e o guia abre no primeiro passo deste capítulo.'+(ON?' <b>O que você fez no treino até agora será substituído.</b>':'')+' A base real não muda.</div>'+
   '<div class="d-flex gap-2 justify-content-end flex-wrap"><button class="btn-soft" onclick="document.getElementById(\'v149-dlg\').remove()">Cancelar</button>'+(ON?'<button class="btn-soft" id="v149-so">Só abrir o capítulo</button>':'')+'<button class="btn-apple" id="v149-ok" style="background:'+COR+'">Montar e abrir</button></div></div>';
  d.querySelector('#v149-ok').onclick=function(){d.remove();montar(i)};var so=d.querySelector('#v149-so');if(so)so.onclick=function(){d.remove();soAbrir()};document.body.appendChild(d)}

/* ───── GUIA.cap: só intercepta o clique vindo da lista "Capítulos" ───── */
function engancha(){try{if(!window.GUIA||!GUIA.cap||GUIA.cap.__v149)return;var _cap=GUIA.cap;
  var cap=function(i){var st={};try{st=GUIA.estado()}catch(e){}
    if(!st.lista||i<=0)return _cap.apply(this,arguments);          /* "Próximo:" e capítulo 1 seguem como sempre */
    var self=this,args=arguments;pergunta(i,function(){_cap.apply(self,args)})};
  cap.__v149=true;GUIA.cap=cap}catch(e){}}
engancha();setInterval(engancha,800);
/* a lista de capítulos explica o atalho */
function nota(){try{var b=document.querySelector('#g124 .caps');if(!b||b.__v149)return;b.__v149=true;var n=document.createElement('div');n.className='pq';n.style.cssText='margin:6px 0 0;padding:8px 10px;border-radius:10px;background:rgba(255,122,0,.1);font-size:12.5px';n.innerHTML='<b>Só quer aprender o seu departamento?</b> Clique no capítulo dele: o treino é montado com os capítulos anteriores já feitos e você começa direto ali.';b.insertAdjacentElement('afterend',n)}catch(e){}}
setInterval(nota,600);
window.V149={montar:montar};
})();
