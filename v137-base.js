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
  const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  /* 0 · os elos vivos da Base sobrevivem à troca do objeto S.db
     A camada de persistência (COP) carrega a base gravada e TROCA o objeto S.db depois que duas ligações vivas já tinham sido
     instaladas no objeto anterior: indicadores = parceiros (um cadastro só) e caixa.saldo = Σ contas. Numa base gravada (todo uso
     real), as duas se perdiam: A.addIndicador quebrava ("push of undefined") e caixa.saldo virava um número parado, diferente das
     contas. Aqui elas são reinstaladas sempre que faltam — na carga e a cada render (reset/importação também trocam o objeto). */
  function elosVivos(){try{
    if(!(Object.getOwnPropertyDescriptor(S.db,'indicadores')||{}).get){try{delete S.db.indicadores}catch(e){}Object.defineProperty(S.db,'indicadores',{get(){return S.db.parceiros},set(v){S.db.parceiros=v},configurable:true,enumerable:false})}
    if(S.db.caixa&&typeof S.db.caixa==='object'&&!(Object.getOwnPropertyDescriptor(S.db.caixa,'saldo')||{}).get){const tot=()=>(S.db.contas||[]).reduce((a,c)=>a+(+c.saldo||0),0);
      Object.defineProperty(S.db.caixa,'saldo',{get:tot,set(v){const d=(+v||0)-tot();const c=(S.db.contas||[]).find(x=>x.id===S.db.caixa.padrao)||(S.db.contas||[])[0];if(c)c.saldo=+c.saldo+d},configurable:true,enumerable:true})}
  }catch(e){console.error('v137 elos',e)}}
  elosVivos();try{const _r0=window.render;window.render=function(){elosVivos();return _r0.apply(this,arguments)}}catch(e){}

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

  /* 5 · dois custos, cada um com o seu nome (Bruno, 01/11): estoque = custo de compra; equipamento vendido = custo de catálogo */
  try{
    const ROT=[[/Custo unitário/g,'Custo de compra (un.)'],[/Custo total/g,'Custo de compra (total)'],[/Inventário ao custo /g,'Inventário ao custo de compra '],[/\(87 un\. nossas · Financeiro › Hoje\)/g,'(87 un. nossas · Financeiro › Hoje)']];
    ['estoque','epainel','lugar','produto'].forEach(k=>{if(typeof SCREENS[k]!=='function')return;const _f=SCREENS[k];SCREENS[k]=function(){let h=_f.apply(this,arguments);if(typeof h!=='string')return h;ROT.forEach(([re,to])=>{h=h.replace(re,to)});return h}});
    const dom=()=>{try{if(!/^#\/(estoque|lugar|produto|epainel)/.test(location.hash||''))return;document.querySelectorAll('#main th').forEach(th=>{const t=th.textContent.trim();if(/^custo unitário$/i.test(t))th.textContent='Custo de compra (un.)';else if(/^custo total$/i.test(t))th.textContent='Custo de compra (total)'})}catch(e){}};
    const _rm5=window.renderMain;window.renderMain=function(){const r=_rm5.apply(this,arguments);dom();setTimeout(dom,50);return r};
  }catch(e){console.error('v137 custos',e)}

  /* 6 · Pós-venda: uma proposta AT / plano de serviços APROVADA pelo Pós-venda é uma venda — entra na mesma máquina de estados
     do Comercial (estado vendida, data da venda, aprovação registrada) em vez de ficar "aprovada pelo cliente" com títulos a receber. */
  function pvVendas(){let n=0;try{(S.db.lancamentos||[]).forEach(l=>{if(l.tipo!=='receber'||!l.pv)return;const pid=l.origem_id||l.proposta_id;const p=(S.db.propostas||[]).find(x=>x.id===pid);if(!p||p.estado!=='aprovada_cliente')return;
      const ds=(S.db.lancamentos||[]).filter(x=>x.pv&&(x.origem_id||x.proposta_id)===p.id).map(x=>x.data_competencia||x.vencimento).filter(Boolean).sort();const d=ds[0]||(typeof today==='function'?today():new Date().toISOString().slice(0,10));
      p.estado='vendida';p.vendida_em=p.vendida_em||d;p.aprov=Object.assign({},p.aprov||{},{status:'aprovada',posvenda:d,hist:(p.aprov&&p.aprov.hist)||[]});p.aprov.hist.push({em:d,por:'Pós-venda (gestão)',acao:'aprovada no Pós-venda → vendida'});n++})}catch(e){console.error('v137 pv',e)}return n}
  try{if(pvVendas()){try{save()}catch(e){}}
    const _put6=window.put;window.put=function(t,row,acao){const r=_put6.apply(this,arguments);if(t==='lancamentos'||t==='propostas'){try{if(pvVendas())save()}catch(e){}}return r}}catch(e){}

  /* 6b · os títulos que o Pós-venda cria (sync AT/plano) passam pela mesma porta do Financeiro: recebem o selo da regra */
  try{const selar=l=>{try{if(l&&l.pv&&!l.fc_selo&&!l.fc_anterior&&window.FC&&typeof FC.selar==='function'){FC.selar(l);return 1}}catch(e){}return 0};
    let n=0;(S.db.lancamentos||[]).forEach(l=>{n+=selar(l)});if(n){try{save()}catch(e){}}
    const _put6b=window.put;window.put=function(t,row,acao){const r=_put6b.apply(this,arguments);if(t==='lancamentos'&&row&&row.pv){try{const vivo=(S.db.lancamentos||[]).find(x=>x.id===row.id)||row;selar(vivo)}catch(e){}}return r}}catch(e){}

  /* 8 · as setas ← → da barra: desabilitadas quando não há para onde voltar/avançar (antes, clicavam e nada acontecia) */
  try{const st={back:0,fwd:0,last:location.hash,viaBtn:null};const paint=()=>{const b=document.getElementById('nav-back'),f=document.getElementById('nav-forward');if(b){b.disabled=st.back<2;b.style.opacity=st.back<2?'.35':'';}if(f){f.disabled=st.fwd<=0;f.style.opacity=st.fwd<=0?'.35':''}};
    window.addEventListener('hashchange',()=>{if(st.viaBtn==='back'){st.back--;st.fwd++}else if(st.viaBtn==='fwd'){st.fwd--;st.back++}else{st.back++;st.fwd=0}st.viaBtn=null;paint()});
    const arm=()=>{const b=document.getElementById('nav-back'),f=document.getElementById('nav-forward');if(b&&!b.__v137){b.__v137=1;b.addEventListener('click',()=>{st.viaBtn='back'},true)}if(f&&!f.__v137){f.__v137=1;f.addEventListener('click',()=>{st.viaBtn='fwd'},true)}paint()};arm();setTimeout(arm,1500);
  }catch(e){}

  /* 9 · Saídas: o botão "Vincular 0" (nada para vincular) não aparece — um botão que só avisa não é um botão */
  try{const _rm9=window.renderMain;window.renderMain=function(){const r=_rm9.apply(this,arguments);try{document.querySelectorAll('#main button').forEach(b=>{if(/^Vincular\s+0$/.test(b.textContent.trim()))b.remove()})}catch(e){}return r}}catch(e){}

  /* 10 · nomes de produto com quebra de linha / espaço duplo dentro do nome (vieram assim da importação): um nome é uma linha */
  try{const limpo=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();let n=0;(S.db.produtos||[]).forEach(p=>{['nome','descricao','modelo'].forEach(k=>{if(typeof p[k]==='string'&&p[k]!==limpo(p[k])){p[k]=limpo(p[k]);n++}})});if(n){try{save()}catch(e){}}
    const _put10=window.put;window.put=function(t,row,acao){if(t==='produtos'&&row){['nome','descricao','modelo'].forEach(k=>{if(typeof row[k]==='string')row[k]=limpo(row[k])})}return _put10.apply(this,arguments)}}catch(e){}

  /* 11 · telas: a rota no <body> (para CSS por tela) + ajustes de layout que a auditoria de pixels pegou */
  try{const css=document.createElement('style');css.id='v137-css';css.textContent=[
    /* Lançamentos: os selects da linha mostram o valor inteiro (antes cortavam "Admin/Fin…") */
    'body[data-rota="finlanc"] #main td select, body[data-rota="fineixos"] #main td select{max-width:none!important}',
    /* Serviços & diárias: o seletor de categoria ocupa a largura toda da coluna e não corta o nome */
    'body[data-rota="dbservicos"] #main select.form-select-sm{min-width:100%}',
    /* nomes de produto e códigos (ADP-PWR-2460, F-0219) não quebram no meio: só em espaço */
    'body[data-rota="focal"] #main .card, body[data-rota="cortarrolo"] #main, body[data-rota="finlanc"] #main .lx-t td{overflow-wrap:normal!important;word-break:keep-all!important;hyphens:none!important}',
    'body[data-rota="dbservicos"] #main .row>[class*="col-"]:has(>select.form-select-sm[style*="width:100%"]){flex:0 0 100%;max-width:100%}'
  ].join('\n');document.head.appendChild(css);
    const rota=()=>{try{document.body.dataset.rota=(location.hash||'#/home').slice(2).split('/')[0]||'home'}catch(e){}};rota();window.addEventListener('hashchange',rota);
    /* campos que nomeiam um cadastro viram seletores do cadastro (nunca texto livre) */
    /* um select mostra o valor escolhido inteiro: a largura acompanha o texto selecionado (não a opção mais longa) */
    const ajusta=()=>{try{const k=document.body.dataset.rota;if(!['finlanc','fineixos','dbservicos'].includes(k))return;let m=document.getElementById('v137-medir');if(!m){m=document.createElement('span');m.id='v137-medir';m.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0';document.body.appendChild(m)}
      const tabelas=new Set();
      document.querySelectorAll('#main td select').forEach(sel=>{const o=sel.selectedOptions[0];const t=o?o.text:'';const cs=getComputedStyle(sel);m.style.font=cs.font;m.textContent=t||'—';const w=Math.min(480,Math.ceil(m.getBoundingClientRect().width)+34);sel.style.setProperty('width',w+'px','important');sel.style.setProperty('min-width',w+'px','important');sel.style.setProperty('max-width','none','important');const tb=sel.closest('table');if(tb)tabelas.add(tb);if(!sel.__v137w){sel.__v137w=1;sel.addEventListener('change',()=>setTimeout(ajusta,0))}});
      /* a tabela cresce com as células (rolagem horizontal no invólucro), em vez de espremer e sobrepor */
      tabelas.forEach(tb=>{tb.style.setProperty('table-layout','auto','important');tb.style.setProperty('width','max-content','important');tb.style.setProperty('min-width','100%','important');const w=tb.parentElement;if(w&&getComputedStyle(w).overflowX==='visible')w.style.overflowX='auto'})}catch(e){}};
    const pick=()=>{try{ajusta();document.querySelectorAll('#main input[placeholder^="Procurar"]').forEach(i=>{i.placeholder=i.placeholder.replace(/^Procurar/,'Buscar')});const k=document.body.dataset.rota;
      if(k==='programacao'){const inp=[...document.querySelectorAll('#main input[data-cf="programacao.tec"]')][0];if(inp&&inp.tagName==='INPUT'){const cur=inp.value||'';const sel=document.createElement('select');sel.className='form-select form-select-sm';sel.setAttribute('data-cf','programacao.tec');sel.innerHTML='<option value="">Todos os técnicos</option>'+(S.db.tecnicos||[]).map(t=>`<option value="${E(t.nome)}"${t.nome===cur?' selected':''}>${E(t.nome)}</option>`).join('');sel.onchange=function(){COP.ui['programacao']['tec']=this.value;render()};inp.replaceWith(sel)}}
      if(k==='darentrada'){const inp=document.getElementById('rx_forn');if(inp&&inp.tagName==='INPUT'){const cur=inp.value||'';const names=(S.db.fornecedores||[]).map(f=>f.nome).filter(Boolean);if(cur&&!names.includes(cur))names.unshift(cur);const sel=document.createElement('select');sel.id='rx_forn';sel.className=inp.className||'form-select form-select-sm';sel.innerHTML='<option value="">— fornecedor —</option>'+names.map(n=>`<option value="${E(n)}"${n===cur?' selected':''}>${E(n)}</option>`).join('');['onchange','oninput'].forEach(ev=>{const h=inp.getAttribute(ev);if(h)sel.setAttribute(ev,h)});inp.replaceWith(sel)}}
    }catch(e){console.error('v137 pick',e)}};
    const _rm11=window.renderMain;window.renderMain=function(){const r=_rm11.apply(this,arguments);rota();pick();setTimeout(pick,60);return r};setTimeout(pick,1200);window.V137_pick=pick;
    /* telas que se desenham depois (módulos com render próprio): observa o #main e repassa */
    try{let tm=null;const mo=new MutationObserver(()=>{if(tm)return;tm=setTimeout(()=>{tm=null;rota();pick()},80)});const alvo=document.getElementById('main');if(alvo)mo.observe(alvo,{childList:true,subtree:true})}catch(e){}
  }catch(e){console.error('v137 telas',e)}

  /* 12 · toda lista pode ser filtrada — em qualquer departamento, não só no Estoque (a caixa de busca já existia; valia só para telas do Estoque) */
  try{const _rm12=window.renderMain;window.renderMain=function(){const r=_rm12.apply(this,arguments);try{if(typeof window.__autoFilter==='function'&&window.OWNER){const k=(location.hash||'#/home').slice(2).split('/')[0];const o=OWNER[k];if(o!=='est'&&k!=='home'){OWNER[k]='est';try{__autoFilter(k)}finally{if(o===undefined)delete OWNER[k];else OWNER[k]=o}}}}catch(e){}return r}}catch(e){}

  /* 6c · o plano de uma proposta do Pós-venda (AT / plano de serviços) vem do motor do Pós-venda, não do plano de itens do Comercial
     (que não existe para ela e quebrava: "comissao_pct of undefined") */
  try{if(typeof FN!=='undefined'&&FN&&typeof FN.propPlano==='function'&&!FN.propPlano.__v137){const _pp=FN.propPlano;
    const pv=p=>p&&p.linha==='posvenda'&&p.at;
    FN.propPlano=function(p){if(pv(p)){const tot=(()=>{try{return +M.total(p)||0}catch(e){return 0}})();let c=null;try{c=COP.pos.calc(p.at)}catch(e){}
        const disp=c?((+c.disp||0)+(+c.tc||0))/100:0;const liq=c?(+c.total||0)/100:tot;const imp=Math.max(0,Math.round((tot-disp-liq)*100)/100);
        const dias={};try{(typeof DISC!=='undefined'?DISC:[]).forEach(k=>dias[k]=0)}catch(e){}const moC=Math.round(disp*100)/100;return {tot,equipV:0,equipC:0,equipR:0,servV:tot,imp,com:0,rt:0,moC,moR:0,dias,frete:0,extras:0,custo:Math.round((moC+imp)*100)/100,liq,posvenda:true}}
      return _pp.apply(this,arguments)};FN.propPlano.__v137=true}}catch(e){console.error('v137 pv plano',e)}

  /* 7 · Parceiros vindos do CRM sem RT: a RT fica explicitamente "a confirmar pelo Financeiro" (null + marca), não um campo que não existe */
  try{let n=0;(S.db.parceiros||[]).forEach(p=>{if(p.rt_pct===undefined){p.rt_pct=null;p.rt_pendente=true;n++}});if(n){try{save()}catch(e){}}}catch(e){}
})();
