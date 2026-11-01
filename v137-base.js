/* v137 · a Base manda (01/11/2026) — o que o teste "mude a Base, as telas seguem?" pegou:
   1. Unidade do estoque: o lugar tinha duas verdades no mesmo registro — o id (loc_id, da lista fechada de Base › Locais)
      e um TEXTO copiado (local). Ao gravar, o texto vencia e desfazia a mudança do id. Agora o id é a verdade e o texto
      é só a etiqueta escrita a partir dele.
   2. Cliente: a Pipeline guardava uma cópia do nome (negociacoes.cliente_nome). Renomear o cliente na Base não
      chegava na Pipeline nem no CRM. Agora a cópia é reescrita quando o cliente é renomeado.
   3. Base › Pessoas: o cargo e o departamento mostravam vazio para quem não tem ficha de RH, mesmo com o cadastro
      da pessoa preenchido. A linha passa a ler a pessoa quando não há ficha. */
(function(){'use strict';
  if(typeof S==='undefined'||!S.db||typeof put!=='function')return;
  /* 1 · loc_id é a verdade */
  try{
    const _put=window.put;
    window.put=function(t,row,acao){
      if(t==='unidades'&&row&&row.loc_id&&typeof L==='object'&&typeof L.get==='function'&&L.get(row.loc_id)){
        try{if(typeof locStr==='function')row.local=locStr(row)}catch(e){}
      }
      return _put.apply(this,arguments)};
    /* registros antigos onde o texto e o id já divergem: o id vale, o texto é reescrito (uma vez) */
    if(!S.db._v137_loc){let n=0;(S.db.unidades||[]).forEach(u=>{try{if(u.loc_id&&typeof L==='object'&&L.get(u.loc_id)&&typeof locStr==='function'){const s=locStr(u);if(u.local!==s){u.local=s;n++}}}catch(e){}});S.db._v137_loc={em:new Date().toISOString().slice(0,10),n};try{save()}catch(e){}}
  }catch(e){console.error('v137 loc',e)}

  /* 2 · renomear o cliente alcança as cópias */
  try{
    const _put2=window.put;
    window.put=function(t,row,acao){
      let antes=null;if(t==='clientes'&&row&&row.id){try{const cur=(S.db.clientes||[]).find(c=>c.id===row.id);antes=cur&&cur!==row?{nome:cur.nome,sigla:cur.sigla}:null;if(cur===row&&row.__v137_nome!=null)antes={nome:row.__v137_nome,sigla:row.sigla}}catch(e){}}
      const r=_put2.apply(this,arguments);
      try{if(t==='clientes'&&row&&row.id){const novo=(S.db.clientes||[]).find(c=>c.id===row.id)||row;
        const velho=antes&&antes.nome;if(velho&&novo.nome&&velho!==novo.nome){let n=0;
          (S.db.negociacoes||[]).forEach(g=>{if((g.cliente_id===novo.id||(!g.cliente_id&&g.codinome&&g.codinome===novo.sigla))&&g.cliente_nome===velho){g.cliente_nome=novo.nome;n++}});
          (S.db.obras||[]).forEach(o=>{if(o.cliente_id===novo.id&&o.cliente_nome===velho){o.cliente_nome=novo.nome;n++}});
          (S.db.propostas||[]).forEach(p=>{if((p.cliente_id===novo.id||p.sigla===novo.sigla)&&p.cliente_nome===velho){p.cliente_nome=novo.nome;n++}});
          (S.db.lancamentos||[]).forEach(l=>{if((l.cliente_id===novo.id||l.sigla===novo.sigla)&&l.cliente===velho){l.cliente=novo.nome;n++}});
          if(n){try{log('clientes',novo.id,'nome propagado para '+n+' registro(s) que guardavam cópia')}catch(e){}try{save()}catch(e){}}}
        novo.__v137_nome=novo.nome}}catch(e){console.error('v137 cliente',e)}
      return r};
    /* memoriza o nome atual para detectar a troca mesmo quando o mesmo objeto é editado no lugar */
    (S.db.clientes||[]).forEach(c=>{try{Object.defineProperty(c,'__v137_nome',{value:c.nome,writable:true,enumerable:false,configurable:true})}catch(e){}});
    const _ren=window.renderMain;window.renderMain=function(){try{(S.db.clientes||[]).forEach(c=>{if(c.__v137_nome==null)Object.defineProperty(c,'__v137_nome',{value:c.nome,writable:true,enumerable:false,configurable:true})})}catch(e){}return _ren.apply(this,arguments)};
  }catch(e){console.error('v137 cliente',e)}

  /* 3 · Base › Pessoas: cargo/departamento da pessoa quando não há ficha */
  try{
    const fix=h=>{if(typeof h!=='string')return h;try{h=h.replace(/<input class="form-control form-control-sm" value="" onchange="__pes\('([^']+)','(cargo|dep)',this\.value\)">/g,(m,key,what)=>{
          const e=(typeof ASM==='object'&&ASM.pessoas)?ASM.pessoas().lista.find(x=>x.key===key):null;const p=e&&e.em&&e.em.pessoas&&e.em.pessoas[0];const v=p&&(p[what]||(what==='dep'?p.setor:''))||'';
          return v?m.replace('value=""','value="'+String(v).replace(/"/g,'&quot;')+'"'):m})}catch(e){}return h};
    ['dbpessoas','equipe'].forEach(k=>{if(typeof SCREENS[k]==='function'){const _f=SCREENS[k];SCREENS[k]=function(){return fix(_f.apply(this,arguments))}}});
  }catch(e){console.error('v137 pessoas',e)}

  /* 4 · cargo e departamento: três cópias (ficha, login, pessoa) alinhadas uma vez ao valor que a tela mostra (ficha › login › pessoa) */
  try{
    if(!S.db._v137_cargo&&typeof ASM==='object'&&ASM.pessoas){let n=0;
      (ASM.pessoas().lista||[]).forEach(e=>{const em=e.em||{};const f=(em.folha||[])[0],u=(em.usuarios||[])[0];
        [['cargo','cargo'],['dep','setor']].forEach(([k,ku])=>{const v=(f&&f[k])||(u&&u[ku])||((em.pessoas||[])[0]||{})[k]||'';if(!v)return;
          (em.folha||[]).forEach(r=>{if(r[k]!==v){r[k]=v;n++}});(em.usuarios||[]).forEach(r=>{if(r[ku]!==v){r[ku]=v;n++}});(em.pessoas||[]).forEach(r=>{if(r[k]!==v){r[k]=v;n++}})})});
      S.db._v137_cargo={em:new Date().toISOString().slice(0,10),n};if(n){try{save()}catch(e){}}}
  }catch(e){console.error('v137 cargo',e)}
})();
