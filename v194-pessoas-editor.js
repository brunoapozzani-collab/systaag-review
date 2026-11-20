/* v194 — EDITAR PESSOAS (Bruno, 20/11/2026)
   Pedido: "onde eu vou para mudar o nome, a cor da pessoa, excluir alguém?" — não existia. Decisões dele:
   - Mora na Base › Usuários e permissões (a tela abre numa grade de cartões; a tabela antiga fica em "Acessos e tabela");
     e um ✎ em cada cartão do "Quem é você?" (só para Gestor) abre o mesmo editor.
   - Cor: segue o departamento da pessoa por padrão; um Gestor pode escolher outra cor só para aquela pessoa.
   - Desligar: some do "Quem é você?" e das escolhas, mas o nome fica nos negócios antigos. Excluir: vai para a Lixeira (volta com um clique).
   - Uma pessoa = um registro (Base › Pessoas). Mudar o nome aqui muda em todas as ligações (login, equipe comercial,
     técnicos, programadores, folha, perfis do Financeiro); o nome antigo vira apelido, para os negócios antigos continuarem achando a pessoa.
   Só Gestor (Diretoria / Tecnologia) edita. */
(function(){
'use strict';
if(window.__v194)return;window.__v194=true;
if(typeof S==='undefined'||!S.db)return;

const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const db=()=>S.db;
const pessoas=()=>db().pessoas||[];
const pes=id=>pessoas().find(p=>p.id===id)||null;
const usuarioDe=id=>(db().usuarios||[]).find(u=>u.pessoa_id===id)||null;
const gestor=()=>T(()=>QUEM.isGestor(),false);
const save_=()=>{try{save()}catch(e){console.error('v194 save',e)}};
const toast_=(m,bad)=>{try{toast(m,bad)}catch(e){}};
const redraw=()=>{try{renderMain()}catch(e){try{render()}catch(e2){}}};
const ini=n=>String(n||'?').split(' ').filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase();
const hoje=()=>new Date().toISOString().slice(0,10);
const desligada=p=>p.ativo===false||!!p.desligado;

/* ───────── cores: por departamento, com escolha por pessoa ───────── */
const FAMILIAS=[
  ['Gestão',      '#475569',/diretoria|desenvolvimento|tecnologia|gestao|gerencia/],
  ['Comercial',   '#0071e3',/comercial|pre vendas|marketing/],
  ['Estoque',     '#16a34a',/estoque|compras/],
  ['Financeiro',  '#d97706',/financeir|rh|pessoas|cultura|facilities|administra/],
  ['Operação',    '#7c3aed',/obras|operac|programac|tecnic/],
  ['Projetos',    '#0891b2',/projet|acustica/],
  ['Pós-venda',   '#dc2626',/pos venda/],
  ['Focal',       '#be185d',/focal/]
];
const SEM_DEP=['Outros','#6e6e73'];
const familia=p=>{const d=norm((p&&(p.dep||p.departamento))||'');const f=FAMILIAS.find(x=>x[2].test(d));return f?[f[0],f[1]]:SEM_DEP};
const PALETA=['#0071e3','#0891b2','#16a34a','#65a30d','#d97706','#ea580c','#dc2626','#be185d','#7c3aed','#4f46e5','#475569','#1d1d1f'];
const corDe=p=>(p&&p.cor)||familia(p)[1];
const corDoLogin=login=>{const u=(db().usuarios||[]).find(x=>x.login===login);const p=u&&pes(u.pessoa_id);return p?corDe(p):null};

/* ───────── as ligações de uma pessoa (mesmo registro, várias telas) ───────── */
const LIGADAS=['usuarios','equipe','tecnicos','programadores','folha'];
function renomear(p,novo){
  novo=String(novo||'').trim();const velho=p.nome;if(!novo||novo===velho)return 0;
  let n=0;p.nome=novo;
  LIGADAS.forEach(c=>(db()[c]||[]).forEach(r=>{if(r&&r.pessoa_id===p.id&&r.nome!==novo){r.nome=novo;n++}}));
  (db().perfis||[]).forEach(r=>{if(r&&(r.pessoa_id===p.id||norm(r.nome)===norm(velho))){r.nome=novo;r.pessoa_id=p.id;n++}});
  /* o nome antigo continua achando a pessoa (negócios e propostas antigos gravaram o nome) */
  if(velho){p.apelidos=Array.from(new Set([].concat(p.apelidos||[],[velho])));
    const L=db().listas=db().listas||{};L.consultor_aliases=(L.consultor_aliases||[]).filter(a=>norm(a.de)!==norm(velho));
    if((db().equipe||[]).some(e=>e.pessoa_id===p.id))L.consultor_aliases.push({de:velho,para:novo,por:'v194 · nome trocado em '+hoje()})}
  try{log('pessoas',p.id,'nome: «'+velho+'» → «'+novo+'»')}catch(e){}
  return n}
function marcarAtivo(p,ativo){
  p.ativo=ativo;p.desligado=!ativo;p.status=ativo?'Ativo':'Desligado';
  if(ativo){delete p.desligado_em}else p.desligado_em=hoje();
  (db().usuarios||[]).forEach(u=>{if(u.pessoa_id===p.id)u.ativo=ativo});
  (db().equipe||[]).forEach(e=>{if(e.pessoa_id===p.id)e.ativo=ativo});
  try{log('pessoas',p.id,ativo?'religada':'desligada')}catch(e){}}
function slugLogin(p){const t=norm(p.nome).split(' ').filter(Boolean);let b=t.length>1?t[0]+'.'+t[t.length-1]:(t[0]||'pessoa');let l=b,i=2;
  while((db().usuarios||[]).some(u=>u.login===l))l=b+(i++);return l}
function darAcesso(p){if(usuarioDe(p.id))return usuarioDe(p.id);
  const u={id:'usr_'+Math.random().toString(36).slice(2,8),nome:p.nome,ativo:!desligada(p),cargo:p.cargo||'',email:p.email||'',fonte:'v194 · Base › Usuários e permissões',login:slugLogin(p),papel:'operador',setor:p.dep||'',grupos:[],perfil:'adefinir',excecoes:{},pessoa_id:p.id};
  (db().usuarios=db().usuarios||[]).push(u);try{log('usuarios',u.login,'acesso criado para '+p.nome)}catch(e){}return u}

/* ───────── 1 · correção de dados (uma vez por base, com desfazer guardado) ───────── */
function corrigir(){
  if(window.__TREINO||db().__v194b)return;
  const undo=[];
  pessoas().forEach(p=>{const m=/^(.*?)\s*\((consultor\(a\)|consultora?)\)\s*$/i.exec(p.nome||'');
    if(m&&m[1]){undo.push({id:p.id,nome:p.nome});renomear(p,m[1].trim())}});
  (db().perfis||[]).forEach(r=>{if(r.pessoa_id)return;const p=pessoas().find(x=>[x.nome,x.nomeCompleto].some(n=>norm(n)===norm(r.nome)));
    if(p){undo.push({perfil:r.id,pessoa_id:null});r.pessoa_id=p.id;r.nome=p.nome}});
  db().__v194_undo=undo;db().__v194b=new Date().toISOString();save_();try{redraw()}catch(e){}
}

/* ───────── 2 · a tela: Base › Usuários e permissões ───────── */
const ST=window.__v194st=window.__v194st||{vista:'pessoas',q:'',desl:false};
const CSS=`
.v194-seg{display:inline-flex;background:var(--bd,#e5e5ea);border-radius:12px;padding:3px;gap:2px;margin-bottom:16px}
.v194-seg button{border:0;background:transparent;padding:7px 16px;border-radius:9px;font-weight:600;font-size:14px;color:var(--mut,#6e6e73);cursor:pointer}
.v194-seg button.on{background:var(--card,#fff);color:var(--tx,#1d1d1f);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.v194-top{display:flex;flex-wrap:wrap;align-items:center;gap:22px;padding:18px 22px;border-radius:18px;margin-bottom:18px}
.v194-big{font-size:38px;font-weight:800;line-height:1}
.v194-eq{font-size:14px;color:var(--mut,#6e6e73)} .v194-eq a{cursor:pointer;color:inherit;text-decoration:underline dotted}
.v194-q{margin-left:auto;min-width:260px;max-width:360px;border-radius:12px}
.v194-gh{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mut,#6e6e73);margin:6px 0 10px 4px;display:flex;align-items:center;gap:8px}
.v194-gh i{width:10px;height:10px;border-radius:50%;display:inline-block}
.v194-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:24px}
.v194-c{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;padding:18px 10px 14px;border-radius:18px;border:1px solid var(--bd,#e5e5ea);background:var(--card,#fff);cursor:pointer;transition:transform .12s,box-shadow .12s;color:inherit;font:inherit;text-align:center}
.v194-c:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.v194-c.off{opacity:.5}
.v194-av{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:19px;flex:none}
.v194-n{font-weight:700;font-size:14.5px;line-height:1.2}
.v194-s{font-size:11.5px;color:var(--mut,#6e6e73);line-height:1.25;min-height:14px}
.v194-tag{position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;background:var(--bd,#e5e5ea);color:var(--mut,#6e6e73)}
#v194-ov{position:fixed;inset:0;z-index:100500;background:rgba(0,0,0,.32);display:flex;justify-content:flex-end;animation:v194f .18s ease}
@keyframes v194f{from{opacity:0}to{opacity:1}}
#v194-pn{width:min(440px,100%);height:100%;overflow:auto;background:var(--bg,#f5f5f7);padding:26px 24px 40px;box-shadow:-8px 0 30px rgba(0,0,0,.15);animation:v194s .22s ease}
@keyframes v194s{from{transform:translateX(40px)}to{transform:none}}
#v194-pn .x{position:absolute;top:14px;right:16px;border:0;background:var(--card,#fff);border-radius:50%;width:34px;height:34px;font-size:17px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.12)}
#v194-pn .hero{display:flex;flex-direction:column;align-items:center;gap:8px;margin:8px 0 20px}
#v194-pn .hero .v194-av{width:88px;height:88px;font-size:30px}
#v194-pn .blk{background:var(--card,#fff);border-radius:16px;padding:14px 16px;margin-bottom:12px}
#v194-pn label{display:block;font-size:12px;font-weight:600;color:var(--mut,#6e6e73);margin:0 0 4px}
#v194-pn .fld{margin-bottom:12px}#v194-pn .fld:last-child{margin-bottom:0}
#v194-pn input,#v194-pn select{width:100%;border:1px solid var(--bd,#d2d2d7);border-radius:10px;padding:9px 11px;font-size:15px;background:var(--card,#fff);color:inherit}
#v194-pn input:disabled,#v194-pn select:disabled{opacity:.7}
#v194-pn .sw{display:flex;flex-wrap:wrap;gap:8px}
#v194-pn .sw button{width:30px;height:30px;border-radius:50%;border:3px solid transparent;cursor:pointer;padding:0}
#v194-pn .sw button.on{border-color:var(--tx,#1d1d1f);box-shadow:0 0 0 2px var(--card,#fff) inset}
#v194-pn .sw .auto{width:auto;border-radius:99px;padding:0 12px;font-size:12px;font-weight:700;color:#fff}
#v194-pn .row2{display:flex;gap:8px;flex-wrap:wrap}
#v194-pn .bt{border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:14px;cursor:pointer}
#v194-pn .bt.pri{background:#0071e3;color:#fff;width:100%;margin-top:4px}
#v194-pn .bt.sec{background:var(--bd,#e5e5ea);color:var(--tx,#1d1d1f)}
#v194-pn .bt.red{background:transparent;color:#dc2626;border:1px solid rgba(220,38,38,.35)}
#v194-pn .note{font-size:12px;color:var(--mut,#6e6e73);margin-top:6px;line-height:1.35}
#v194-pn .lk{display:flex;flex-wrap:wrap;gap:6px}#v194-pn .lk span{font-size:11.5px;background:var(--bg,#f5f5f7);border-radius:99px;padding:3px 9px}
`;
function css(){if(document.getElementById('v194-css'))return;const s=document.createElement('style');s.id='v194-css';s.textContent=CSS;document.head.appendChild(s)}

const ORDEM=FAMILIAS.map(f=>f[0]).concat([SEM_DEP[0]]);
function busca(p){const u=usuarioDe(p.id);return norm([p.nome,p.nomeCompleto,p.cargo,p.dep,u&&u.login].concat(p.apelidos||[]).join(' '))}
function cartao(p){const u=usuarioDe(p.id),off=desligada(p);
  const tag=off?'desligado':(!u||u.ativo===false?'sem acesso':'');
  return `<button class="v194-c${off?' off':''}" onclick="V194.abrir('${J(p.id)}')" title="Editar ${E(p.nome)}">${tag?`<span class="v194-tag">${tag}</span>`:''}<span class="v194-av" style="background:${corDe(p)}">${E(ini(p.nome))}</span><span class="v194-n">${E(p.nome)}</span><span class="v194-s">${E(p.cargo||'')}</span></button>`}
function grade(){
  css();const all=pessoas(),on=all.filter(p=>!desligada(p)),off=all.length-on.length;
  const semAcesso=on.filter(p=>{const u=usuarioDe(p.id);return !u||u.ativo===false}).length;
  const qn=norm(ST.q);let L=ST.desl?all:on;if(qn)L=L.filter(p=>busca(p).indexOf(qn)>=0);
  const grupos={};L.forEach(p=>{const f=familia(p);(grupos[f[0]]=grupos[f[0]]||{c:f[1],l:[]}).l.push(p)});
  const corpo=ORDEM.filter(k=>grupos[k]).map(k=>`<div class="v194-gh"><i style="background:${grupos[k].c}"></i>${E(k)} · ${grupos[k].l.length}</div><div class="v194-grid">${grupos[k].l.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(cartao).join('')}</div>`).join('')
    ||'<div class="card p-4 text-center sub" style="border-radius:18px">Ninguém encontrado.</div>';
  const top=`<div class="card v194-top"><div><div class="v194-big">${all.length}</div><div class="v194-eq">pessoas na Base</div></div>
    <div class="v194-eq">= <b>${on.length}</b> ativas <span style="opacity:.7">(${on.length-semAcesso} entram no SYSTAAG + ${semAcesso} sem acesso)</span><br>+ <a onclick="V194.desl(${ST.desl?0:1})"><b>${off}</b> desligadas</a> ${ST.desl?'· mostrando':''}</div>
    <input class="form-control v194-q" id="v194-q" placeholder="Buscar nome, cargo, departamento…" value="${E(ST.q)}" oninput="V194.busca(this.value)"></div>`;
  const aviso=gestor()?'':`<div class="card p-2 mb-3 sub" style="border-radius:12px"><i class="bi bi-lock me-1"></i>Só Gestor (Diretoria ou Tecnologia) muda pessoas. Você pode ver.</div>`;
  return top+aviso+corpo}
function seg(){return `<div class="v194-seg"><button class="${ST.vista==='pessoas'?'on':''}" onclick="V194.vista('pessoas')">Pessoas</button><button class="${ST.vista==='tabela'?'on':''}" onclick="V194.vista('tabela')">Acessos e tabela completa</button></div>`}

function ligarTela(){
  if(typeof SCREENS!=='object'||typeof SCREENS.equipe!=='function'||SCREENS.equipe.__v194)return;
  const _q=SCREENS.equipe;
  const g=function(){if(ST.vista==='tabela'){const h=_q.apply(this,arguments);return typeof h==='string'?seg()+h:h}
    const hd=(typeof head==='function'?head('Pessoas','Toque numa pessoa para mudar o nome, a cor, o departamento, o acesso — ou para desligar e excluir.'):'<h1 class="h1">Pessoas</h1>');
    return hd+seg()+grade()};
  Object.keys(_q).forEach(k=>{try{g[k]=_q[k]}catch(e){}});g.__v194=true;SCREENS.equipe=g}
/* a camada de permissões desenha a Equipe direto (telaEquipe) no renderMain, sem passar por SCREENS.equipe — por isso também aqui */
function ligarRender(){const _rm=window.renderMain;if(typeof _rm!=='function'||_rm.__v194)return;
  const g=function(){const r=_rm.apply(this,arguments);try{if(/^#\/equipe(\/|$)/.test(location.hash||'')){const m=document.getElementById('main');if(!m)return r;
      if(ST.vista==='pessoas'){m.innerHTML=SCREENS.equipe();document.title='SYSTAAG · Pessoas'}
      else if(!m.querySelector('.v194-seg'))m.insertAdjacentHTML('afterbegin',seg())}}catch(e){console.error('v194 render',e)}return r};
  for(const k in _rm)try{g[k]=_rm[k]}catch(e){}g.__v194=1;window.renderMain=g;try{renderMain=g}catch(e){}}

/* ───────── 3 · o editor (painel lateral) ───────── */
let ED=null;
function fechar(){const o=document.getElementById('v194-ov');if(o)o.remove();ED=null}
function painel(){
  const p=pes(ED.id);if(!p){fechar();return}
  const pode=gestor(),dis=pode?'':' disabled',u=usuarioDe(p.id),off=desligada(p);
  const cor=ED.cor||familia(Object.assign({},p,{dep:ED.dep}))[1];
  const deps=Array.from(new Set(['Diretoria','Desenvolvimento e tecnologia','Comercial','Pré-vendas','Marketing','Compras e Estoque','Financeiro','RH','Pessoas & Cultura','Facilities','Obras','Operação Técnica','Programação','Projetos','Acústica','Pós-venda','Focal'].concat(pessoas().map(x=>x.dep).filter(Boolean)))).filter(d=>d!=='Todos');
  const perfis=(db().perfisAcesso||[]);
  const ligs=[];if(u)ligs.push('login '+u.login);
  [['equipe','equipe comercial'],['tecnicos','técnico de campo'],['programadores','programador'],['folha','folha / RH']].forEach(([c,t])=>{if((db()[c]||[]).some(r=>r.pessoa_id===p.id))ligs.push(t)});
  const autoCor=familia(Object.assign({},p,{dep:ED.dep}))[1];
  const h=`<button class="x" onclick="V194.fechar()" title="Fechar">×</button>
   <div class="hero"><span class="v194-av" id="v194-av" style="background:${cor}">${E(ini(ED.nome||p.nome))}</span>
     <div style="font-weight:800;font-size:20px">${E(ED.nome||p.nome)}</div>
     <div class="sub">${off?'<b style="color:#dc2626">Desligado</b>'+(p.desligado_em?' desde '+E(p.desligado_em.split('-').reverse().join('/')):''):(u&&u.ativo!==false?'Entra no SYSTAAG como <b>'+E(u.login)+'</b>':'Ainda sem acesso ao SYSTAAG')}</div></div>
   <div class="blk">
     <div class="fld"><label>Nome (como aparece no sistema)</label><input id="v194-nome" value="${E(ED.nome)}"${dis} oninput="V194.campo('nome',this.value)"></div>
     <div class="fld"><label>Nome completo</label><input id="v194-nc" value="${E(ED.nc)}"${dis} oninput="V194.campo('nc',this.value)"></div>
   </div>
   <div class="blk"><label>Cor</label>
     <div class="sw"><button class="auto${!ED.cor?' on':''}" style="background:${autoCor}"${dis} onclick="V194.cor('')" title="A cor do departamento">Automática</button>
     ${PALETA.map(c=>`<button class="${ED.cor===c?'on':''}" style="background:${c}"${dis} onclick="V194.cor('${c}')" title="${c}"></button>`).join('')}</div>
     <div class="note">Automática = a cor do departamento. Escolha outra só se quiser destacar esta pessoa.</div></div>
   <div class="blk">
     <div class="fld"><label>Departamento</label><select${dis} onchange="V194.campo('dep',this.value)">${deps.map(d=>`<option${d===ED.dep?' selected':''}>${E(d)}</option>`).join('')}</select></div>
     <div class="fld"><label>Cargo</label><input value="${E(ED.cargo)}"${dis} oninput="V194.campo('cargo',this.value)"></div>
   </div>
   <div class="blk"><label>Acesso ao SYSTAAG</label>
     ${u?`<select${dis} onchange="V194.campo('perfil',this.value)">${perfis.map(x=>`<option value="${E(x.id)}"${x.id===ED.perfil?' selected':''}>${E(x.nome)}</option>`).join('')}</select>
       <div class="note">O perfil define o que a pessoa vê. Detalhes por tela: “Acessos e tabela completa”.</div>`
      :`<div class="note" style="margin:0 0 8px">Esta pessoa não aparece no “Quem é você?”.</div>${pode?`<button class="bt sec" onclick="V194.acesso()">Dar acesso</button>`:''}`}
   </div>
   ${pode?`<button class="bt pri" onclick="V194.salvar()">Salvar</button>`:''}
   ${ligs.length?`<div class="blk" style="margin-top:12px"><label>Um registro só — o nome muda em todos estes lugares</label><div class="lk">${ligs.map(x=>`<span>${E(x)}</span>`).join('')}</div></div>`:''}
   ${pode?`<div class="blk" style="margin-top:12px"><label>Saída da empresa</label><div class="row2">
       ${off?`<button class="bt sec" onclick="V194.ativo(1)">Religar</button>`:`<button class="bt sec" onclick="V194.ativo(0)">Desligar</button>`}
       <button class="bt red" onclick="V194.excluir()"><i class="bi bi-trash3 me-1"></i>Excluir</button></div>
     <div class="note"><b>Desligar</b>: some do “Quem é você?” e das listas de escolha; o nome continua nos negócios antigos.<br><b>Excluir</b>: vai para a Lixeira da Base, com tudo o que é dela — volta com um clique em Restaurar.</div></div>`:''}`;
  let ov=document.getElementById('v194-ov');
  if(!ov){css();ov=document.createElement('div');ov.id='v194-ov';ov.onclick=e=>{if(e.target===ov)fechar()};ov.innerHTML='<div id="v194-pn"></div>';document.body.appendChild(ov)}
  document.getElementById('v194-pn').innerHTML=h;
}
function abrir(id){const p=pes(id);if(!p){toast_('Pessoa não encontrada.',true);return}const u=usuarioDe(id);
  ED={id,nome:p.nome||'',nc:p.nomeCompleto||'',cor:p.cor||'',dep:p.dep||'',cargo:p.cargo||'',perfil:u?u.perfil:''};painel()}
function salvar(){
  if(!gestor()){toast_('Só Gestor muda pessoas.',true);return}
  const p=pes(ED.id);if(!p)return;const nome=String(ED.nome||'').trim();if(!nome){toast_('O nome não pode ficar vazio.',true);return}
  const outro=pessoas().find(x=>x.id!==p.id&&norm(x.nome)===norm(nome));if(outro){toast_('Já existe uma pessoa chamada «'+E(outro.nome)+'». Use outro nome.',true);return}
  const mud=[];
  if(nome!==p.nome){const n=renomear(p,nome);mud.push('nome (mudou em '+(n+1)+' lugar'+(n?'es':'')+')')}
  if((ED.nc||'')!==(p.nomeCompleto||'')){p.nomeCompleto=ED.nc;mud.push('nome completo')}
  if((ED.cor||'')!==(p.cor||'')){if(ED.cor)p.cor=ED.cor;else delete p.cor;mud.push('cor')}
  if((ED.dep||'')!==(p.dep||'')){p.dep=ED.dep;p.departamento=ED.dep;(db().usuarios||[]).forEach(u=>{if(u.pessoa_id===p.id)u.setor=ED.dep});mud.push('departamento')}
  if((ED.cargo||'')!==(p.cargo||'')){p.cargo=ED.cargo;(db().usuarios||[]).forEach(u=>{if(u.pessoa_id===p.id)u.cargo=ED.cargo});mud.push('cargo')}
  const u=usuarioDe(p.id);if(u&&ED.perfil&&ED.perfil!==u.perfil){u.perfil=ED.perfil;mud.push('acesso')}
  if(!mud.length){fechar();return}
  try{log('pessoas',p.id,'editado em Usuários e permissões: '+mud.join(', '))}catch(e){}
  save_();fechar();redraw();toast_('«'+E(p.nome)+'» salvo: '+mud.join(', ')+'.')}
function ativo(on){if(!gestor())return;const p=pes(ED.id);if(!p)return;
  const eu=T(()=>me(),null);if(!on&&eu&&eu.pessoa_id===p.id){toast_('Ninguém desliga a si mesmo.',true);return}
  marcarAtivo(p,!!on);save_();abrir(p.id);redraw();toast_(on?'«'+E(p.nome)+'» religado.':'«'+E(p.nome)+'» desligado — saiu do “Quem é você?”. O nome continua nos negócios antigos.')}
function acesso(){if(!gestor())return;const p=pes(ED.id);if(!p)return;const u=darAcesso(p);save_();abrir(p.id);redraw();
  toast_('«'+E(p.nome)+'» já aparece no “Quem é você?” (login '+E(u.login)+', perfil A definir — escolha o perfil e salve).')}
function excluir(){if(!gestor())return;const p=pes(ED.id);if(!p)return;
  const V=window.V155;if(!V||typeof V.plano!=='function'||typeof V.mover!=='function'){toast_('A Lixeira não está disponível agora.',true);return}
  if(!V.pode()){toast_('Excluir registros é uma permissão de Gestor.',true);return}
  let x;try{x=V.plano('pessoas',p.id)}catch(e){toast_(e.message||String(e),true);return}
  if(!x){toast_('Pessoa não encontrada — talvez já esteja na Lixeira.',true);return}
  if(x.bloqs&&x.bloqs.length){toast_('Não dá para excluir: '+x.bloqs.join(' '),true);return}
  const junto=(x.own||[]).length-1,solta=(x.patches||[]).length;
  const msg='Excluir «'+p.nome+'»?\n\n'+(junto>0?'Vão junto para a Lixeira '+junto+' registro(s) dela (login, equipe, técnico…).\n':'')+(solta>0?solta+' ligação(ões) em obras/propostas ficam sem essa pessoa.\n':'')+'\nVolta com um clique em Base › Lixeira › Restaurar.';
  if(!confirm(msg))return;
  try{V.mover(x);fechar();redraw();toast_('«'+E(p.nome)+'» foi para a Lixeira. <a href="#/dblixeira">Abrir a Lixeira</a>')}catch(e){toast_(e.message||String(e),true)}}
function deQuem(login){const u=(db().usuarios||[]).find(x=>x.login===login);if(!u||!u.pessoa_id){toast_('Este login não está ligado a uma pessoa da Base.',true);return}
  try{QUEM.fechar()}catch(e){const q=document.getElementById('qv');if(q)q.remove()}
  ST.vista='pessoas';if(!/^#\/equipe/.test(location.hash))location.hash='#/equipe';setTimeout(()=>abrir(u.pessoa_id),250)}

window.V194={abrir,fechar,salvar,ativo,acesso,excluir,deQuem,corDe,corDoLogin,familia,gestor,
  campo(k,v){if(!ED)return;ED[k]=v;if(k==='nome'){const a=document.getElementById('v194-av');if(a)a.textContent=ini(v)}if(k==='dep')painel()},
  cor(c){if(!ED||!gestor())return;ED.cor=c;painel()},
  vista(v){ST.vista=v;redraw()},
  desl(on){ST.desl=!!on;redraw()},
  busca(v){ST.q=v;clearTimeout(ST.t);ST.t=setTimeout(()=>{redraw();const q=document.getElementById('v194-q');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},250)}};

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('v194-ov'))fechar()});
/* a correção espera a primeira leitura da nuvem (antes disso a nuvem sobrescreve o que rodou) */
const corrigirDepois=()=>{try{corrigir()}catch(e){console.error('v194 corrigir',e)}};
if(window.__v172pronto)corrigirDepois();else window.addEventListener('v172-pronta',corrigirDepois,{once:true});
try{ligarTela();ligarRender()}catch(e){console.error('v194 tela',e)}
try{if(/^#\/equipe(\/|$)/.test(location.hash||''))redraw()}catch(e){}
})();
