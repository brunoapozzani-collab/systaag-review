/* v173 — O ARQUITETO E O ESCRITÓRIO DELE (10-Nov-2026)
   Pedido do Edson: "não encontrei nenhuma correlação entre um Escritório de Arquitetura cadastrado e o cadastramento
   dos arquitetos desse Escritório". Estava certo: o cadastro de um parceiro não tinha onde dizer a que escritório ele pertence.
   O que esta camada faz (um vínculo só, por ID — nunca por nome):
     · no formulário do parceiro (CRM › Parceiros › Novo / Editar): o campo "Escritório a que pertence";
     · na ficha do arquiteto: "Escritório: NOME ›" (clica e abre o escritório);
     · na ficha do escritório: a aba "Arquitetos (n)" com todos os que pertencem a ele + "Novo arquiteto deste escritório";
     · na lista de Parceiros: sob o nome, o escritório do arquiteto / quantos arquitetos o escritório tem.
   Onde fica gravado: no próprio registro do parceiro na Base (S.db.parceiros[].escritorio_crm_id = id do escritório no CRM).
   O servidor do CRM passa a devolver e a aceitar o campo "escritorio_id" na linha do parceiro; por isso esta camada
   é carregada ANTES da v171 (a nuvem compara antes/depois por fora dela e o vínculo sobe para todos como qualquer outro campo).
   Nada mais muda: nenhum parceiro, contato ou número é alterado por esta camada. */
(function(){'use strict';
if(window.__v173)return;window.__v173=true;
if(typeof CRM_SERVER==='undefined'||!CRM_SERVER||typeof CRM_SERVER.api!=='function'){console.error('v173: CRM_SERVER ausente');return}

/* ═════════════════════════ §1 o servidor do CRM: o campo escritorio_id na linha do parceiro ═════════════════════════ */
function PS(){try{return (S.db&&S.db.parceiros)||[]}catch(e){return []}}
function porCrm(id){id=+id;if(!id)return null;var a=PS();for(var i=0;i<a.length;i++){if(+a[i].crm_id===id)return a[i]}return null}
function grava(id,valor){if(valor===undefined||valor===null)return false;var p=porCrm(id);if(!p)return false;
  var v=+valor||0;if(v===+p.crm_id)v=0;var cur=+p.escritorio_crm_id||0;if(cur===v)return false;
  if(v)p.escritorio_crm_id=v;else delete p.escritorio_crm_id;return true}
function salva(){try{if(typeof save==='function')save()}catch(e){console.error('v173 save',e)}}

var api0=CRM_SERVER.api;
CRM_SERVER.api=function(payload){var req=null;try{req=JSON.parse(payload||'{}')}catch(e){}
  if(!req||!req.action)return api0.apply(this,arguments);
  var a=req.action,self=this,args=arguments;
  if(a==='loadAll'){var txt=api0.apply(self,args);
    try{var r=JSON.parse(txt);if(r&&r.tables&&Array.isArray(r.tables.parceiros)){r.tables.parceiros.forEach(function(row){var p=porCrm(row.id);row.escritorio_id=(p&&+p.escritorio_crm_id)||''});return JSON.stringify(r)}}catch(e){console.error('v173 loadAll',e)}
    return txt}
  if((a==='insert'||a==='update')&&req.table==='parceiros'&&req.row){
    var mud=a==='update'&&grava(req.row.id,req.row.escritorio_id);      /* registro que já existe: antes, para a gravação do próprio servidor levar */
    var out=api0.apply(self,args);
    if(a==='insert'){try{var j=JSON.parse(out);if(j&&j.ok!==false&&grava(j.id||req.row.id,req.row.escritorio_id))salva()}catch(e){console.error('v173 insert',e)}}
    else if(mud)salva();
    return out}
  if(a==='batch'){var novos=[],m=false;(req.ops||[]).forEach(function(o){if(!o||o.table!=='parceiros'||!o.row)return;if(o.op==='update'){if(grava(o.row.id,o.row.escritorio_id))m=true}else novos.push(o.row)});
    var out2=api0.apply(self,args);
    try{novos.forEach(function(row){if(grava(row.id,row.escritorio_id))m=true});if(m)salva()}catch(e){console.error('v173 batch',e)}
    return out2}
  if(a==='mergeParceiros'){var out3=api0.apply(self,args);
    /* unir A em K: quem pertencia a A passa a pertencer a K; se A tinha escritório e K não, K herda */
    try{var m3=false;(req.pairs||[]).forEach(function(pr){var de=+pr[0],para=+pr[1];if(!de||!para||de===para)return;var A=porCrm(de),K=porCrm(para);
        if(A&&K&&+A.escritorio_crm_id&&!+K.escritorio_crm_id&&+A.escritorio_crm_id!==para){K.escritorio_crm_id=+A.escritorio_crm_id;m3=true}
        PS().forEach(function(p){if(+p.escritorio_crm_id===de){if(+p.crm_id===para)delete p.escritorio_crm_id;else p.escritorio_crm_id=para;m3=true}})});
      if(m3)salva()}catch(e){console.error('v173 merge',e)}
    return out3}
  if(a==='deleteRow'&&req.table==='parceiros'){var out4=api0.apply(self,args);
    /* escritório excluído: os arquitetos continuam cadastrados, só deixam de apontar para ele */
    try{var j4=JSON.parse(out4);if(j4&&j4.ok!==false&&!porCrm(req.id)){var m4=false;PS().forEach(function(p){if(+p.escritorio_crm_id===+req.id){delete p.escritorio_crm_id;m4=true}});if(m4)salva()}}catch(e){console.error('v173 delete',e)}
    return out4}
  return api0.apply(self,args)};

/* ═════════════════════════ §2 código que roda DENTRO do iframe do CRM ═════════════════════════ */
function FRAME(){
  if(window.__v173f)return;window.__v173f=true;
  var PEND;                                           /* o escritório escolhido no formulário, até a gravação */
  const ehEsc=p=>/ESCRIT/i.test(String((p&&p.tipo)||''));
  const escDe=p=>{const id=+(p&&p.escritorio_id)||0;if(!id||id===+p.id)return null;return P(id)||null};
  const pessoasDe=id=>DB.parceiros.filter(x=>+x.escritorio_id===+id&&+x.id!==+id).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const N=v=>(+v||0).toLocaleString('pt-BR');
  const pl=(n,um,varios)=>N(n)+' '+(n===1?um:varios);
  const css=document.createElement('style');
  css.textContent='.v173-a{color:var(--brand-ink,inherit);font-weight:700;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer}.v173-a:hover{text-decoration-style:solid}';
  (document.head||document.documentElement).appendChild(css);

  /* ── a gravação: o campo vai na linha do parceiro ── */
  ['insert','update'].forEach(function(m){const f=api[m];api[m]=function(table,row){if(table==='parceiros'&&row&&PEND!==undefined)row.escritorio_id=PEND;return f.apply(this,arguments)}});

  /* ── o formulário: "Escritório a que pertence" ── */
  const open0=window.openParceiro;
  window.openParceiro=function(id,opts){const r=open0.apply(this,arguments);
    try{const o=opts||{};const ref=document.querySelector('#modal #f_rcom');const campoRef=ref&&ref.closest('.field');if(!campoRef||document.querySelector('#modal #f_esc'))return r;
      const eu=id?P(id):null;const atual=eu?escDe(eu):(o.escritorio_id?P(o.escritorio_id):null);
      const lista=DB.parceiros.filter(x=>!eu||+x.id!==+eu.id).sort((a,b)=>(ehEsc(b)-ehEsc(a))||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
      const vistos={};const ops=lista.filter(x=>{const k=norm(x.nome);if(vistos[k])return false;vistos[k]=1;return true}).map(x=>`<option value="${esc(x.nome)}">`).join('');
      campoRef.insertAdjacentHTML('afterend',fld('Escritório a que pertence',`<input id="f_esc" list="f_esc_l" autocomplete="off" placeholder="Digite o nome do escritório já cadastrado…" value="${esc(atual?atual.nome:'')}"><datalist id="f_esc_l">${ops}</datalist>`,false,true,'Para o arquiteto que trabalha num escritório já cadastrado em Parceiros. Deixe em branco se não se aplica.'));
      const tipo=document.querySelector('#modal #f_tipo');
      if(!id&&o.escritorio_id&&tipo&&!tipo.value){const op=[...tipo.options].find(x=>/ARQUITETO/i.test(x.value));if(op)tipo.value=op.value}
      const mostra=()=>{const c=document.querySelector('#modal #f_esc');const f=c&&c.closest('.field');if(f)f.style.display=tipo&&/ESCRIT/i.test(tipo.value)?'none':''};
      if(tipo)tipo.addEventListener('change',mostra);mostra();
    }catch(e){console.error('v173 formulário',e)}
    return r};

  const salvar0=window.salvarParceiro;
  window.salvarParceiro=async function(id){let alvo;
    try{const inp=document.querySelector('#modal #f_esc');
      if(inp){const campo=inp.closest('.field');const nome=inp.value.trim();
        if(!nome||(campo&&campo.style.display==='none'))alvo='';
        else{const c=DB.parceiros.filter(x=>norm(x.nome)===norm(nome)&&+x.id!==+id);
          if(!c.length){clearInvalid();return invalid('f_esc','Escolha um escritório da lista. Se ele ainda não existe, cadastre o escritório primeiro.')}
          alvo=(c.find(ehEsc)||c[0]).id}}}catch(e){console.error('v173 salvar',e)}
    PEND=alvo;try{return await salvar0.apply(this,arguments)}finally{PEND=undefined}};

  /* ── a ficha do parceiro: o escritório do arquiteto; a aba Arquitetos do escritório ── */
  const ficha0=window.renderParceiro;
  window.renderParceiro=function(v){const p=P(VIEW.params.id);const aba=VIEW.params.tab==='arq';
    if(aba)VIEW.params.tab='cont';
    let r;try{r=ficha0.apply(this,arguments)}finally{if(aba)VIEW.params.tab='arq'}
    try{if(!p)return r;
      const o=escDe(p),gente=pessoasDe(p.id);
      if(o){const sub=v.querySelector('.cardhead .grow .muted');if(sub)sub.insertAdjacentHTML('beforeend',` · Escritório: <a href="#" class="v173-a" title="Abrir o escritório" onclick="go('parceiro',{id:${o.id}});return false">${esc(o.nome)} ›</a>`)}
      const tabs=v.querySelector('.tabs');
      if(tabs&&(ehEsc(p)||gente.length)){const bts=[...tabs.querySelectorAll('button')];const cont=bts.find(b=>/^Contatos/.test(b.textContent.trim()))||bts[bts.length-1];
        const b=document.createElement('button');b.textContent=`Arquitetos (${N(gente.length)})`;b.title='Parceiros cadastrados que pertencem a este escritório';b.setAttribute('onclick',"VIEW.params.tab='arq';render()");
        cont.insertAdjacentElement('afterend',b);
        if(aba){bts.forEach(x=>x.classList.remove('active'));b.classList.add('active');
          const cards=v.querySelectorAll(':scope > .card');const card=cards[cards.length-1];
          if(card)card.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px"><span class="small muted">${gente.length?pl(gente.length,'parceiro pertence','parceiros pertencem')+' a este escritório. Cada um tem a própria ficha, com histórico e ações.':'Nenhum arquiteto vinculado ainda. Para vincular um que já está cadastrado: abra a ficha dele › Editar › “Escritório a que pertence”.'}</span><button class="btn sm" onclick="openParceiro(null,{escritorio_id:${p.id}})">${ICONS.plus} Novo arquiteto deste escritório</button></div>`+
            (gente.length?`<div class="tablewrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Resp. relacionamento</th><th>Status</th><th>Classificação</th><th>Última interação</th></tr></thead><tbody>${gente.map(x=>{const cl=classificar(x);return `<tr class="click" onclick="go('parceiro',{id:${x.id}})"><td><b>${esc(x.nome)}</b></td><td>${esc(x.tipo)}</td><td>${esc(x.responsavel_rel||'—')}</td><td><span class="tag st-${stCls(x.status)}">${esc(x.status)}</span></td><td><span class="tag cl-${cl}">${cl}</span></td><td>${fmtD(ultimaInteracao(x))}</td></tr>`}).join('')}</tbody></table></div>`:'')}}
    }catch(e){console.error('v173 ficha',e)}
    return r};

  /* ── a lista de Parceiros: o vínculo sob o nome ── */
  const lista0=window.renderParceiros;
  window.renderParceiros=function(v){const r=lista0.apply(this,arguments);
    try{const n={};DB.parceiros.forEach(x=>{const e=+x.escritorio_id||0;if(e&&e!==+x.id&&P(e))n[e]=(n[e]||0)+1});
      v.querySelectorAll('tbody tr.click').forEach(tr=>{const m=/id:(\d+)/.exec(tr.getAttribute('onclick')||'');if(!m)return;const p=P(+m[1]);if(!p)return;const td=tr.children[1];if(!td)return;
        const o=escDe(p);let h='';
        if(o)h+=`<div class="small muted">Escritório: ${esc(o.nome)}</div>`;
        if(n[p.id])h+=`<div class="small muted">${pl(n[p.id],'arquiteto','arquitetos')}</div>`;
        if(h)td.insertAdjacentHTML('beforeend',h)});
    }catch(e){console.error('v173 lista',e)}
    return r};

  try{if(typeof render==='function'&&DB&&USER&&(VIEW.name==='parceiro'||VIEW.name==='parceiros')&&!document.querySelector('#modal'))render()}catch(e){}
}

/* o iframe nasce quando o CRM é aberto pela primeira vez (e renasce se for recriado): injeta o §2 assim que ele estiver de pé */
function injeta(){var fr=document.getElementById('crmFrame');if(!fr)return;var d,w;try{d=fr.contentDocument;w=fr.contentWindow}catch(e){return}
  if(!d||!w||d.__v173||w.__v173f)return;
  if(typeof w.openParceiro!=='function'||typeof w.salvarParceiro!=='function'||typeof w.renderParceiro!=='function'||typeof w.go!=='function'||!d.body)return;
  if(typeof w.systaagReady==='function'&&!w.systaagReady())return;
  d.__v173=true;try{var s=d.createElement('script');s.textContent='('+FRAME.toString()+')();';(d.head||d.documentElement).appendChild(s)}catch(e){console.error('v173 injeta',e)}}
setInterval(injeta,700);
})();
