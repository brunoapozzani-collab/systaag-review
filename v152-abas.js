/* v152 · DUAS ABAS NÃO BRIGAM MAIS (05/11/2026)
   O que aconteceu na conferência ao vivo: cinco abas do SYSTAAG abertas no Chrome do Bruno. A regra do v135 ("outra aba
   gravou → esta recarrega") virou um pingue-pongue: cada aba, ao recarregar, gravava de novo no boot, a outra via a gravação,
   recarregava, gravava… e nenhuma saía da tela "Abrindo o sistema…".
   Regra nova: a aba que recarregou POR CAUSA de outra aba fica só lendo (não grava) até a pessoa mexer nela (clique ou tecla).
   Quem grava é a aba em uso; as outras só acompanham. Uma aba só nunca é afetada.
   Também: as fusões que o Bruno confirmou em 05/11 — Soninha = Sonia Meneghetti (FUN-079) e Alan Tito de Almeida = Alan Tito
   (FUN-070) — quando esses cadastros existirem na base, viram um só, pela mesma rotina do v151. */
(function(){
'use strict';
if(window.__v152)return;window.__v152=true;
const K='systaag_v152_recarregou';
/* 1 · marca a recarga provocada pelo v135 (o aviso "Os dados mudaram em outra aba" está na tela na hora de sair) */
try{window.addEventListener('beforeunload',()=>{try{if(document.getElementById('v135-aba'))sessionStorage.setItem(K,'1')}catch(e){}})}catch(e){}
/* 2 · depois dessa recarga, a aba só lê até a pessoa mexer */
try{if(sessionStorage.getItem(K)==='1'){sessionStorage.removeItem(K);window.__v152_quieta=true;
    const libera=()=>{if(!window.__v152_quieta)return;window.__v152_quieta=false;try{if(typeof save==='function')save()}catch(e){}};
    ['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev,libera,{capture:true,once:true}));
    const LS=window.localStorage,set0=Storage.prototype.setItem,rm0=Storage.prototype.removeItem;
    const CH=/^systaag_(erp1z?|zero|crm_t)$/;
    Storage.prototype.setItem=function(k,v){if(this===LS&&window.__v152_quieta&&CH.test(k))return;return set0.apply(this,arguments)};
    Storage.prototype.removeItem=function(k){if(this===LS&&window.__v152_quieta&&CH.test(k))return;return rm0.apply(this,arguments)};
    try{const d=document.createElement('div');d.id='v152-quieta';d.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99998;background:#1d1d1f;color:#fff;font:600 12px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;padding:8px 14px;border-radius:12px;opacity:.9';
      d.textContent='Esta aba está só acompanhando (outra aba do SYSTAAG está em uso) — clique aqui para usar esta.';
      const add=()=>{(document.body||document.documentElement).appendChild(d)};if(document.body)add();else document.addEventListener('DOMContentLoaded',add);
      window.addEventListener('pointerdown',()=>{try{d.remove()}catch(e){}},{capture:true,once:true})}catch(e){}}}catch(e){console.error('v152',e)}
/* 3 · fusões confirmadas em 05/11 (aplicadas quando os dois cadastros existem) */
try{if(typeof S!=='undefined'&&S.db&&!S.db.af113_zero){const db=S.db;const F=db._v152=db._v152||{};if(!F.fundidas){F.fundidas=[];
    [['FUN-079','pes7'],['FUN-083','FUN-070']].forEach(([de,para])=>{const ps=db.pessoas||[];const a=ps.find(p=>p.id===de),b=ps.find(p=>p.id===para);if(!a||!b)return;
      /* o cadastro do organograma (FUN-) é o que fica; o outro é fundido nele */
      const keep=/^FUN-/.test(b.id)?b:a,gone=keep===b?a:b;
      keep.apelidos=Array.from(new Set([...(keep.apelidos||[]),gone.nome,gone.nomeCompleto].filter(Boolean)));
      const t=v=>v===gone.id?keep.id:v;
      ['equipe','folha','usuarios','at_usuarios','tecnicos','programadores','jornadas','veiculos','atividades','pendencias','cop_tarefas'].forEach(tb=>(db[tb]||[]).forEach(r=>{['pessoa_id','responsavel_id','gerente_id'].forEach(k=>{if(r[k]===gone.id)r[k]=keep.id})}));
      (db.obras||[]).forEach(o=>{if(o.gerente_id===gone.id)o.gerente_id=keep.id;['comercial_ids','respProjetos_ids','respObra_ids'].forEach(k=>{if(Array.isArray(o[k]))o[k]=Array.from(new Set(o[k].map(t)))})});
      (db.propostas||[]).forEach(p=>{if(Array.isArray(p.consultor_ids))p.consultor_ids=p.consultor_ids.map(t)});
      const eq=(db.equipe||[]).filter(q=>q.pessoa_id===keep.id);if(eq.length>1)eq.slice(1).forEach(d=>{eq[0].apelidos=Array.from(new Set([...(eq[0].apelidos||[]),d.nome]));db.equipe=db.equipe.filter(x=>x!==d)});
      db.pessoas=ps.filter(p=>p!==gone);F.fundidas.push({de:gone.id,para:keep.id,nome:gone.nome,em:keep.nomeCompleto||keep.nome})});
    if(F.fundidas.length){try{save()}catch(e){}}}}}catch(e){console.error('v152 fusões',e)}
})();
