/* v189 — PESSOA É CONTATO, NÃO PARCEIRO (Bruno, 18-Nov-2026)
   "Partners don't change (often) because the company only have a selected few partners. Contacts can be added… it is more common.
    Let's make it in a way where a contact [doesn't become] a partner — if they want to add someone they go to the right place."
   O que aconteceu: 9 pessoas de escritórios já cadastrados (Arthur Casas, Bossa, Fort Real) foram cadastradas como PARCEIROS novos.
   O que esta camada faz, só no CRM (dentro do iframe), sem mexer em nenhum dado:
     · "Novo parceiro" só aparece para quem gere a lista de parceiros: perfil admin (Bruno, Cesar, Rodolfo, Alan Tito) e coordenador (Renata);
     · todo mundo ganha "Novo contato" em CRM › Parceiros: escolhe o escritório/parceiro e cai na ficha de contato dele;
     · quem não gere parceiros e tenta abrir/gravar um parceiro novo é levado ao "Novo contato";
     · no formulário de parceiro novo (gestores), um aviso com o atalho "É uma pessoa de um escritório já cadastrado? → contato";
     · na ficha do escritório, o botão "Novo arquiteto deste escritório" (v173) passa a ser "Novo contato deste escritório".
   Regra de carga: precisa da v173 de pé dentro do iframe (embrulha as funções depois dela). */
(function(){'use strict';
if(window.__v189)return;window.__v189=true;

function FRAME(){
  if(window.__v189f)return;window.__v189f=true;
  const gestor=()=>!!USER&&(USER.perfil==='admin'||USER.perfil==='coordenador');
  const vivos=()=>DB.parceiros.slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const MAIS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"></path></svg>';

  /* ── "Novo contato": de qual escritório? → a ficha de contato de sempre ── */
  window.v189NovoContato=function(msg){
    const ops=vivos().map(x=>`<option value="${esc(x.nome)}">`).join('');
    modal('Novo contato',`${msg?`<div class="small muted" style="margin-bottom:10px">${esc(msg)}</div>`:''}<div class="form">
      ${fld('Escritório / parceiro do contato',`<input id="v189_p" list="v189_l" autocomplete="off" placeholder="Digite o nome do escritório…"><datalist id="v189_l">${ops}</datalist>`,true,true,'A pessoa fica guardada dentro do escritório dela (aba Contatos). O escritório ainda não existe? Peça o cadastro a quem gere os parceiros: Alan Tito ou Renata.')}
    </div>`,`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="v189Segue()">Continuar</button>`,{narrow:true});
    const i=document.querySelector('#modal #v189_p');if(i)i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();v189Segue()}})};
  window.v189Segue=function(){clearInvalid();const nome=val('v189_p');if(!nome)return invalid('v189_p','Escolha o escritório do contato');
    const c=DB.parceiros.filter(x=>norm(x.nome)===norm(nome));
    if(!c.length)return invalid('v189_p','Escolha um escritório da lista. Se ele ainda não existe, peça o cadastro a quem gere os parceiros.');
    const p=c[0];closeModal();openContato(null,p.id)};

  /* ── parceiro novo: só quem gere a lista ── */
  const open0=window.openParceiro;
  window.openParceiro=function(id,opts){
    if(!id&&!gestor()){const o=opts||{};if(o.escritorio_id&&P(o.escritorio_id))return openContato(null,+o.escritorio_id);
      return v189NovoContato('Parceiro novo (escritório ou empresa) é cadastrado por quem gere os parceiros. Para guardar uma pessoa, cadastre-a como contato do escritório dela.')}
    const r=open0.apply(this,arguments);
    try{if(!id){const c=document.querySelector('#modal .content');if(c&&!c.querySelector('.v189-nota'))c.insertAdjacentHTML('afterbegin',`<div class="v189-nota small" style="background:rgba(245,166,35,.12);border-left:3px solid #f5a623;border-radius:8px;padding:8px 10px;margin-bottom:12px"><b>Parceiro</b> é o escritório ou a empresa. É uma <b>pessoa</b> de um escritório já cadastrado? Ela é contato: <a href="#" style="font-weight:700;text-decoration:underline" onclick="closeModal();v189NovoContato();return false">cadastrar contato ›</a></div>`)}}catch(e){console.error('v189 aviso',e)}
    return r};
  const salvar0=window.salvarParceiro;
  window.salvarParceiro=async function(id){if(!id&&!gestor()){closeModal();toast('Parceiro novo é cadastrado por quem gere os parceiros. Para uma pessoa, use Novo contato.',true);return false}
    return salvar0.apply(this,arguments)};

  /* ── CRM › Parceiros: os botões do topo ── */
  const lista0=window.renderParceiros;
  window.renderParceiros=function(v){const r=lista0.apply(this,arguments);
    try{const b=[...v.querySelectorAll('button')].find(x=>/^\s*Novo parceiro\s*$/.test(x.textContent)&&/openParceiro\(\)/.test(x.getAttribute('onclick')||''));
      if(b&&!v.querySelector('.v189-nc')){const n=document.createElement('button');n.className=(gestor()?'btn':'btn primary')+' v189-nc';n.setAttribute('onclick','v189NovoContato()');n.title='Uma pessoa de um escritório já cadastrado';n.innerHTML=MAIS+' Novo contato';
        b.insertAdjacentElement('beforebegin',n);
        if(gestor())b.title='Um escritório ou empresa que ainda não está na lista';else b.remove()}   /* o botão do gestor fica como era: o guia Aprender fazendo aponta para ele */
    }catch(e){console.error('v189 lista',e)}
    return r};

  /* ── ficha do escritório: "Novo arquiteto deste escritório" → contato ── */
  const ficha0=window.renderParceiro;
  window.renderParceiro=function(v){const r=ficha0.apply(this,arguments);
    try{const p=P(VIEW.params.id);if(p)v.querySelectorAll('button').forEach(b=>{if(/Novo arquiteto deste escrit/.test(b.textContent)){b.setAttribute('onclick',`openContato(null,${+p.id})`);b.innerHTML=MAIS+' Novo contato deste escritório'}})}catch(e){console.error('v189 ficha',e)}
    return r};

  try{if(typeof render==='function'&&DB&&USER&&(VIEW.name==='parceiro'||VIEW.name==='parceiros')&&!document.querySelector('#modal'))render()}catch(e){}
}

function injeta(){var fr=document.getElementById('crmFrame');if(!fr)return;var d,w;try{d=fr.contentDocument;w=fr.contentWindow}catch(e){return}
  if(!d||!w||d.__v189||w.__v189f)return;
  if(!w.__v173f)return;                                  /* depois da v173, para embrulhar por fora dela */
  if(typeof w.openParceiro!=='function'||typeof w.openContato!=='function'||typeof w.salvarParceiro!=='function'||typeof w.renderParceiros!=='function'||typeof w.renderParceiro!=='function'||!d.body)return;
  if(typeof w.systaagReady==='function'&&!w.systaagReady())return;
  d.__v189=true;try{var s=d.createElement('script');s.textContent='('+FRAME.toString()+')();';(d.head||d.documentElement).appendChild(s)}catch(e){console.error('v189 injeta',e)}}
setInterval(injeta,700);
})();
