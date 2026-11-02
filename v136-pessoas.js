/* v136 · uma pessoa, um cadastro, um lugar (Bruno, 01/11/2026)
   1. Base › Pessoas vira UMA página: Novo colaborador + a tabela de pessoas (ficha, cargo, departamento, login,
      perfil de acesso e o papel em cada departamento). Sem abas. "Onde cada pessoa aparece" fica dobrado no fim.
   2. Pessoas & Cultura › Usuários e permissões › Membros mostra ESSA MESMA tabela e o mesmo botão — nada de
      "Novo membro" com os mesmos campos digitados de novo. Perfis de acesso, Matriz por tela e Auditoria continuam.
   3. CRM › Configurações sai do menu do CRM. As ferramentas (De/Para, padronizar nomes, backup, regras, atualização
      em massa) passam para Base de dados › Relacionamento (CRM). Quem acessa o CRM = o login do SYSTAAG
      (Usuários e permissões). Listas = Base › Listas & regras. */
(function(){'use strict';
  if(typeof SCREENS!=='object'||typeof S==='undefined')return;
  const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  /* bloco <div> balanceado a partir de i */
  function bloco(h,i){if(i<0)return '';let d=0;const re=/<div\b|<\/div>/g;re.lastIndex=i;let m;while((m=re.exec(h))){d+=m[0]==='</div>'?-1:1;if(d===0)return h.slice(i,m.index+6)}return ''}

  /* ───────── 1. Base › Pessoas: uma página ───────── */
  const O_db=SCREENS.dbpessoas;
  const BTN='<button class="btn-apple" onclick="novoColabOpen=true;render()"><i class="bi bi-person-plus me-1"></i>Novo colaborador</button>';
  const SUB='Um cadastro por pessoa. A linha dela já diz tudo: cargo, departamento, login, perfil de acesso e o papel que exerce em cada departamento (Comercial, técnico, programador, Financeiro). A ficha de RH (documentos, salário, férias) abre em <b>ficha →</b>. Quem traz cliente (arquitetos, escritórios, indicadores) está em Parceiros.';
  function pessoasPagina(semCabecalho){
    let hF='',hP='',hC='';try{hP=O_db('papeis')||''}catch(e){console.error('v136 papeis',e)}try{hF=O_db('ficha')||''}catch(e){}try{hC=O_db('copias')||''}catch(e){}
    if(typeof hP!=='string')return hP;
    const iT=hP.indexOf('<div class="tabs');let topo=iT>=0?hP.slice(0,iT):'',corpo=iT>=0?hP.slice(iT+bloco(hP,iT).length):hP;
    topo=topo.replace(/A base de quem trabalha na TAAG[^<]*/,SUB);
    corpo=corpo.replace(/sem ficha de RH \(criar em "Ficha e documentos" → Novo colaborador\)/,'sem ficha de RH (botão <b>Novo colaborador</b>, acima)');
    let form='';const iF=hF.indexOf('<h6 class="mb-0">Novo colaborador</h6>');if(iF>=0){const st=hF.lastIndexOf('<div class="card',iF);form=bloco(hF,st)}
    let copias='';if(typeof hC==='string'){const iC=hC.indexOf('<div class="tabs');copias=iC>=0?hC.slice(iC+bloco(hC,iC).length):hC}
    return (semCabecalho?'':topo)+`<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2" data-v136="pessoas"><div class="sub" style="font-size:12px">${semCabecalho?SUB:'Mudar aqui muda em todos os departamentos. O login nasce quando você escolhe o <b>perfil de acesso</b> na linha da pessoa.'}</div>${BTN}</div>${form}${corpo}`+
      (copias?`<details class="mt-3"><summary class="sub" style="cursor:pointer;font-size:12px">Onde cada pessoa aparece no sistema (cópias e vínculos)</summary><div class="mt-2">${copias}</div></details>`:'')}
  SCREENS.dbpessoas=function(arg){return pessoasPagina(false)};
  window.V136_pessoas=pessoasPagina;

  /* ───────── 2. Usuários e permissões › Membros = a mesma tabela, o mesmo botão ───────── */
  if(typeof SCREENS.equipe==='function'){const _eq=SCREENS.equipe;
    SCREENS.equipe=function(){let h=_eq.apply(this,arguments);if(typeof h!=='string')return h;
      const i=h.indexOf('<div class="uq-tabs">');if(i<0)return h;const tabs=bloco(h,i);
      let topo=h.slice(0,i+tabs.length),corpo=h.slice(i+tabs.length);
      topo=topo.replace(/<button class="btn-apple" onclick="UQ\.novo\(\)">[\s\S]*?<\/button>/,BTN).replace('<div class="uq-tabs">','<div class="uq-tabs" data-v136h="1">');
      topo=topo.replace(/Gerencie os membros, os perfis e o que cada pessoa vê e faz em cada tela do SYSTAAG\./,'As pessoas são as da <a href="#/dbpessoas">Base › Pessoas</a> — a mesma tabela, aqui. O perfil de acesso de cada uma define o que ela vê e faz em cada tela.');
      if(/class="on" onclick="UQ\.tab\('membros'\)"/.test(tabs))corpo=pessoasPagina(true);
      const n=(()=>{try{return (typeof ASM==='object'&&ASM.pessoas)?ASM.pessoas().lista.length:null}catch(e){return null}})();const m=/(\d+) pessoas · /.exec(corpo);const q=m?m[1]:n;
      if(q!=null)topo=topo.replace(/<span class="chip info">\d+ membros<\/span>/,'<span class="chip info">'+q+' pessoas</span>');
      return topo+corpo}}
  /* o renderMain da camada de permissões desenha a Equipe direto (telaEquipe), sem passar por SCREENS.equipe */
  try{const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);try{if(/^#\/equipe(\/|$)/.test(location.hash||'')){const m=document.getElementById('main');if(m&&m.innerHTML.indexOf('data-v136h')<0){const h=SCREENS.equipe();if(typeof h==='string'&&h.indexOf('data-v136h')>=0)m.innerHTML=h}}}catch(e){console.error('v136 equipe',e)}return r}}catch(e){}
  try{if(window.UQ&&typeof UQ.novo==='function'){UQ.novo=function(){novoColabOpen=true;if(location.hash.indexOf('#/equipe')!==0&&location.hash.indexOf('#/dbpessoas')!==0)location.hash='#/dbpessoas';else render()}}}catch(e){}

  /* ───────── 3. CRM › Configurações → Base › Relacionamento (CRM) ───────── */
  try{
    const crm=NAV.find(n=>n.id==='crm');if(crm)crm.items=crm.items.filter(it=>it[0]!=='crmconfig');
    const _cfg=SCREENS.crmconfig;
    SCREENS.crmconfig=function(){location.hash='#/dbcrm';return ''};
    if(typeof SCREENS.dbcrm==='function'&&typeof _cfg==='function'){const _dbcrm=SCREENS.dbcrm;
      SCREENS.dbcrm=function(){let h=_dbcrm.apply(this,arguments);if(typeof h!=='string')return h;
        h=h.replace('Listas e regras do CRM: Base › Listas & regras › Relacionamento.','Listas e regras do CRM: Base › Listas & regras › Relacionamento. Quem acessa o CRM: o login do SYSTAAG (Pessoas & Cultura › Usuários e permissões). Responsáveis comercial e de relacionamento: Base › Pessoas.');
        const card='<div class="card p-3 mt-3" id="v136-crmtools"><h6 class="mb-1">Ferramentas do CRM</h6><div class="sub" style="font-size:12px">O que ficava em CRM › Configurações mora aqui: o vínculo Pipeline ↔ Parceiros (De/Para), a padronização de nomes, o backup, as regras automáticas e a atualização em massa. Listas: <a href="#/dblistas/comercial">Base › Listas & regras</a>. Acessos: <a href="#/equipe">Usuários e permissões</a>. Pessoas: <a href="#/dbpessoas">Base › Pessoas</a>.</div></div>';
        return h+card+_cfg()}}
    /* dentro do CRM: sem o botão Configurações; quando a página de configurações aparece embutida na Base, só as ferramentas */
    const estilo=()=>{try{const f=document.getElementById('crmFrame');const d=f&&f.contentDocument;if(!d||!d.head)return;
      if(!d.getElementById('v136-css')){const s=d.createElement('style');s.id='v136-css';s.textContent='.nav button[onclick="go(\'config\')"]{display:none!important}body.v136-embed aside,body.v136-embed .topbar,body.v136-embed main>div>h1,body.v136-embed .v136-oculto{display:none!important}body.v136-embed main{padding:0!important}';d.head.appendChild(s)}
      const embed=(location.hash||'').indexOf('#/dbcrm')===0;d.body.classList.toggle('v136-embed',embed);
      if(embed){const pg=(d.querySelector('main')||d.body);pg.querySelectorAll('.card, .grid').forEach(c=>{const t=(c.firstElementChild&&c.firstElementChild.textContent||c.textContent||'').trim().slice(0,40);if(/^(Fonte de dados|Usuários e acessos|Listas e regras|Responsáveis comerciais)/.test(t)&&!c.closest('.v136-oculto'))c.classList.add('v136-oculto')})}
    }catch(e){}};
    const _rend=window.crmFrameRendered;window.crmFrameRendered=function(){const r=typeof _rend==='function'?_rend.apply(this,arguments):undefined;estilo();setTimeout(estilo,300);return r};
    window.addEventListener('hashchange',()=>setTimeout(estilo,400));setTimeout(estilo,1500);
  }catch(e){console.error('v136 crm',e)}

  try{if(typeof renderMain==='function'&&/#\/(dbpessoas|equipe|dbcrm|crmconfig)/.test(location.hash))renderMain()}catch(e){}
})();
