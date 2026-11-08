/* v166 — "Quem é você?" · acesso por pessoa (07/11/2026)
   Regras do Bruno (07/11):
   - Ao abrir: tocar no próprio nome (lista = Base › Usuários e permissões; uma pessoa = um registro).
   - O computador lembra a pessoa; o nome no topo vira "Trocar pessoa".
   - Acesso = perfil + exceções por pessoa (motor já existente em Usuários e permissões, UQ).
   - Sem acesso = some do menu, do Início e dos atalhos.
   - Por perfil: vê o departamento inteiro OU só o próprio trabalho (Técnico = só o seu).
   - Só Gestor (Diretoria / TI) vê e muda Usuários e permissões.
   Sem senha: é só para separar as visões. */
(function(){
'use strict';
var KEY='systaag_quem';
var E=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()};
var save_=function(){try{save()}catch(e){}};
var users=function(){return (S.db.usuarios||[])};
var usr=function(l){return users().find(function(u){return u.login===l})};
var meU=function(){try{return me()}catch(e){return null}};
var perfilDe=function(u){try{return UQ.perfil(u&&u.perfil)}catch(e){return null}};
var ADMIN=['diretoria','ti'];
var isGestor=function(u){u=u||meU();return !!u&&ADMIN.indexOf(u.perfil)>=0};
var escopo=function(u){u=u||meU();var p=perfilDe(u);return (p&&p.regra&&p.regra.escopo)||'todos'};
var pessoaDe=function(u){if(!u)return null;var L=S.db.pessoas||[];return L.find(function(p){return p.id===u.pessoa_id})||null};

/* ───────── 1. a tabela de acesso aprovada (uma vez por base) ───────── */
function migrar(){
  if(!Array.isArray(S.db.perfisAcesso)||!S.db.perfisAcesso.length)return;
  if(S.db.__acesso166)return;
  var P=S.db.perfisAcesso,get=function(id){return P.find(function(p){return p.id===id})};
  var set=function(id,nome,desc,dep,tela,esc){var p=get(id);if(!p){p={id:id};P.push(p)}p.nome=nome||p.nome;if(desc)p.desc=desc;p.regra={dep:dep,tela:tela||{},escopo:esc||'todos'}};
  var all3={'*':3};
  var d=get('diretoria');if(d){d.nome='Gestor · Diretoria';d.desc='Vê e aprova tudo. Muda os acessos de todos.';d.regra.escopo='todos'}
  var t=get('ti');if(t){t.nome='Gestor · Tecnologia';t.desc='Administrador do sistema: tudo, inclusive Usuários e permissões.';t.regra.escopo='todos'}
  set('comercial','Comercial','CRM e Comercial (Pipeline, Gestão, Propostas). Vê o departamento inteiro.',{'*':0,com:2,crm:2},{gestao:2,focal:1,rettroc:1},'todos');
  set('estoque','Estoque e compras','Estoque completo (entradas, saídas, cotações) e as obras da Operação que precisam de material.',{'*':0,est:3,ope:1},{baixas:2,dbprodutos:2,fornecedores:2},'todos');
  set('financeiro','Financeiro','Financeiro completo, mais os números de venda do Comercial só para consulta.',{'*':0,fin:3,com:1},{rh:3,impostos:3,nf:3,finconfig:3},'todos');
  set('chefetec','Chefe dos técnicos','Operação completa e a agenda de todos os técnicos; Projetos para consulta.',{'*':0,ope:3,prj:1},{},'todos');
  set('tecnico','Técnico','Só o que é seu: Meu dia (agenda e jornada) e os seus atendimentos de Pós-venda.',{'*':0},{meudia:2,posfield:2,ajuda:1},'meus');
  set('adefinir','A definir','Ainda sem acesso: só o Início. Um Gestor escolhe o perfil.',{'*':0},{},'todos');
  P.forEach(function(p){p.regra=p.regra||{dep:{},tela:{}};if(!p.regra.escopo)p.regra.escopo='todos'});
  S.db.__acesso166=new Date().toISOString();
  try{log('perfis','v166','tabela de acesso por pessoa aplicada (Gestor, Comercial, Estoque, Financeiro, Chefe dos técnicos, Técnico)')}catch(e){}
}

/* ───────── 2. cada pessoa ativa tem o seu acesso (sem duplicar ninguém) ───────── */
function perfilPorPessoa(p){
  var c=norm(p.cargo),dep=norm(p.dep)+' '+norm(p.departamento);
  if(p.lider&&/tecnico/.test(norm(p.liderDe))||/gestor de obras/.test(c))return 'chefetec';
  if(/diretor|diretoria/.test(c+' '+dep))return 'diretoria';
  if(!c||/a definir/.test(c)||/facilities|pessoas e cultura/.test(dep+' '+c))return 'adefinir';
  if(/gestor de obra|supervisor responsavel/.test(c))return 'obras';
  if(/tecnico|auxiliar|instalador|supervisor|programador|marcenaria/.test(c))return 'tecnico';
  if(/pos venda/.test(dep))return 'posvenda';
  if(/comercial|pre vendas|consultor/.test(dep+' '+c))return 'comercial';
  if(/estoque|compras|estoquista/.test(dep+' '+c))return 'estoque';
  if(/financeir/.test(dep+' '+c))return 'financeiro';
  if(/projet|acustica/.test(dep+' '+c))return 'projetos';
  if(/obras|operacao/.test(dep))return 'tecnico';
  return 'adefinir';
}
function ligarPessoas(){
  var ch=false,U=users(),Ps=(S.db.pessoas||[]).filter(function(p){return p.ativo!==false&&!p.desligado});
  var ligado={};U.forEach(function(u){if(u.pessoa_id)ligado[u.pessoa_id]=u});
  var nomesDe=function(p){return [p.nome,p.nomeCompleto,p.apelido].concat(p.apelidos||[]).filter(Boolean).map(norm)};
  /* usuários sem pessoa → liga pelo nome (primeiro + segundo nome iguais) */
  U.forEach(function(u){if(u.pessoa_id&&(S.db.pessoas||[]).some(function(p){return p.id===u.pessoa_id}))return;var n=norm(u.nome),t=n.split(' ');
    var c=Ps.filter(function(p){return !ligado[p.id]&&nomesDe(p).some(function(x){return x===n||(t.length>1&&x.split(' ')[0]===t[0]&&x.indexOf(t[t.length-1])>=0)})});
    if(c.length===1){u.pessoa_id=c[0].id;ligado[c[0].id]=u;ch=true}});
  /* pessoas sem usuário → cria o acesso (perfil pelo cargo/área; Gestor ajusta depois) */
  Ps.forEach(function(p){if(ligado[p.id])return;var n=norm(p.nome);
    var u2=U.find(function(u){return !u.pessoa_id&&norm(u.nome)===n});if(u2){u2.pessoa_id=p.id;ligado[p.id]=u2;ch=true;return}
    /* o mesmo nome já tem acesso (ficha repetida na Base) → não cria um segundo; fica na lista de conferência */
    var nn=nomesDe(p);if(U.some(function(u){return nn.indexOf(norm(u.nome))>=0})){(S.db.__quemDuplicadas=S.db.__quemDuplicadas||[]).indexOf(p.id)<0&&S.db.__quemDuplicadas.push(p.id);return}
    var t=norm(p.nomeCompleto||p.nome).split(' ').filter(function(x){return x.length>1&&['da','de','do','dos','das'].indexOf(x)<0});
    var base=(t[0]||'pessoa')+(t.length>1?'.'+t[1]:''),login=base,i=2;while(usr(login))login=base+(i++);
    var nu={id:'usr_'+Math.random().toString(36).slice(2,8),login:login,nome:p.apelido||p.nome,email:p.email||'',setor:p.dep||'',cargo:p.cargo||'',grupos:[],papel:'operador',ativo:true,perfil:perfilPorPessoa(p),excecoes:{},pessoa_id:p.id,fonte:'v166 · criado da ficha da pessoa (Base › Pessoas)'};
    U.push(nu);ligado[p.id]=nu;ch=true});
  /* Marcelo = Chefe dos técnicos; Pós-venda gerencial vindo do módulo AT = perfil Pós-venda */
  U.forEach(function(u){var p=pessoaDe(u);
    if(!S.db.__acesso166b){
      if(p&&(/gestor de obras/.test(norm(p.cargo))||(p.lider&&norm(p.liderDe)==='tecnico'))&&u.perfil!=='chefetec'&&ADMIN.indexOf(u.perfil)<0){u.perfil='chefetec';ch=true}
      if(u.posvenda&&/GERENCIAL|ADMINISTRADOR/.test(u.posvenda.perfil||'')&&u.perfil==='tecnico'){u.perfil='posvenda';ch=true}
    }});
  if(!S.db.__acesso166b){S.db.__acesso166b=1;ch=true}
  if(ch)save_();
}

/* ───────── 3. "Quem é você?" ───────── */
var GRUPOS=[['Gestão',['diretoria','ti']],['Comercial',['comercial','prevendas','marketing']],['Estoque e compras',['estoque']],['Financeiro e administração',['financeiro','admin']],['Operação',['chefetec','obras','gestao']],['Técnicos',['tecnico']],['Projetos',['projetos']],['Pós-venda',['posvenda']],['Outros',[]]];
var CORES=['#0071e3','#be185d','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626','#475569'];
var cor=function(l){var h=0;for(var i=0;i<l.length;i++)h=(h*31+l.charCodeAt(i))&0xffff;return CORES[h%CORES.length]};
var ini=function(n){return String(n||'?').split(' ').filter(Boolean).map(function(x){return x[0]}).join('').slice(0,2).toUpperCase()};
var nomeCurto=function(u){return u.nome||((pessoaDe(u)||{}).nome)||u.login};
var CSS='#qv{position:fixed;inset:0;z-index:100000;background:var(--bg,#f5f5f7);overflow:auto;font-family:var(--font-sans,-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif);color:var(--tx,#1d1d1f);animation:qvIn .25s ease}'+
 '@keyframes qvIn{from{opacity:0}to{opacity:1}}'+
 '#qv .qv-in{max-width:980px;margin:0 auto;padding:56px 22px 60px}'+
 '#qv .qv-logo{display:block;height:34px;margin:0 auto 26px;opacity:.9}:root[data-theme="dark"] #qv .qv-logo{filter:invert(1)}'+
 '#qv h1{font-size:2.3rem;font-weight:800;letter-spacing:-.8px;text-align:center;margin:0}'+
 '#qv .qv-sub{text-align:center;color:var(--mut,#6e6e73);margin:6px 0 22px;font-size:15px}'+
 '#qv .qv-q{display:block;width:100%;max-width:420px;margin:0 auto 30px;padding:12px 16px;border-radius:14px;border:1px solid var(--bd,#d2d2d7);background:var(--card,#fff);color:inherit;font-size:16px;outline:none}'+
 '#qv .qv-q:focus{border-color:#0071e3;box-shadow:0 0 0 4px rgba(0,113,227,.15)}'+
 '#qv .qv-g{margin-bottom:26px}#qv .qv-gh{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mut,#6e6e73);margin:0 0 10px 4px}'+
 '#qv .qv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}'+
 '#qv .qv-t{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 10px 14px;border-radius:18px;border:1px solid var(--bd,#e5e5ea);background:var(--card,#fff);cursor:pointer;transition:transform .12s,box-shadow .12s;color:inherit;font:inherit;text-align:center}'+
 '#qv .qv-t:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}#qv .qv-t:active{transform:scale(.97)}'+
 '#qv .qv-av{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:19px}'+
 '#qv .qv-n{font-weight:700;font-size:14.5px;line-height:1.2}#qv .qv-c{font-size:11.5px;color:var(--mut,#6e6e73);line-height:1.25;min-height:14px}'+
 '#qv .qv-t.cur{border-color:#0071e3;box-shadow:0 0 0 3px rgba(0,113,227,.18)}'+
 '#qv .qv-x{position:fixed;top:16px;right:18px;border:0;background:var(--card,#fff);border-radius:50%;width:38px;height:38px;font-size:18px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.12);color:inherit}'+
 '#qv .qv-none{text-align:center;color:var(--mut,#6e6e73);padding:30px}';
function abrir(podeFechar){
  if(document.getElementById('qv'))return;
  if(!document.getElementById('qv-css')){var st=document.createElement('style');st.id='qv-css';st.textContent=CSS;document.head.appendChild(st)}
  var d=document.createElement('div');d.id='qv';d.setAttribute('role','dialog');d.setAttribute('aria-label','Quem é você?');
  d.innerHTML='<div class="qv-in"><img class="qv-logo" src="taag-wordmark.png" alt="taag" onerror="this.style.display=\'none\'"><h1>Quem é você?</h1><div class="qv-sub">Toque no seu nome para ver o seu SYSTAAG.</div><input class="qv-q" id="qv-q" placeholder="Buscar seu nome…" autocomplete="off"><div id="qv-list"></div></div>'+(podeFechar?'<button class="qv-x" title="Fechar" onclick="QUEM.fechar()">×</button>':'');
  document.body.appendChild(d);
  var q=document.getElementById('qv-q');q.oninput=function(){pintar(q.value)};pintar('');
  setTimeout(function(){try{q.focus({preventScroll:true})}catch(e){}},60);
}
function pintar(qs){
  var cur=(meU()||{}).login,qn=norm(qs);
  var L=users().filter(function(u){return u.ativo!==false&&(!qn||norm(nomeCurto(u)+' '+u.nome+' '+u.cargo+' '+u.setor).indexOf(qn)>=0)});
  var usados={};
  var html=GRUPOS.map(function(g){var its=L.filter(function(u){if(usados[u.login])return false;var ok=g[1].length?g[1].indexOf(u.perfil)>=0:true;if(ok)usados[u.login]=1;return ok})
      .sort(function(a,b){return nomeCurto(a).localeCompare(nomeCurto(b),'pt-BR')});
    if(!its.length)return '';
    return '<div class="qv-g"><div class="qv-gh">'+E(g[0])+'</div><div class="qv-grid">'+its.map(function(u){var n=nomeCurto(u);
      return '<button class="qv-t'+(u.login===cur&&localStorage.getItem(KEY)?' cur':'')+'" onclick="QUEM.entrar(\''+E(u.login)+'\')"><span class="qv-av" style="background:'+cor(u.login)+'">'+E(ini(n))+'</span><span class="qv-n">'+E(n)+'</span><span class="qv-c">'+E(u.cargo||'')+'</span></button>'}).join('')+'</div></div>'}).join('');
  document.getElementById('qv-list').innerHTML=html||'<div class="qv-none">Nenhum nome encontrado.</div>';
}
function entrar(login){
  var u=usr(login);if(!u)return;
  try{localStorage.setItem(KEY,login)}catch(e){}
  S.user=login;save_();
  try{if(window.COP&&COP.ui){delete COP.ui.meudia;delete COP.ui.posfield}}catch(e){}
  var el=document.getElementById('qv');if(el)el.remove();
  if(location.hash&&location.hash!=='#/home'&&location.hash!=='#/'&&!podeVerRota((location.hash.replace(/^#\/?/,'').split('/')[0])))location.hash='#/home';
  try{renderNav()}catch(e){}try{pintarPilula()}catch(e){}try{render()}catch(e){}
  try{toast('Olá, '+E(nomeCurto(u).split(' ')[0])+' · perfil '+E((perfilDe(u)||{}).nome||u.perfil))}catch(e){}
}
var podeVerRota=function(k){if(!k||k==='home')return true;if(k==='equipe')return isGestor();try{return UQ.nivel(k)>=1}catch(e){return true}};
window.QUEM={abrir:function(){abrir(true)},entrar:entrar,fechar:function(){var el=document.getElementById('qv');if(el)el.remove()},escopo:escopo,isGestor:isGestor,
  sair:function(){try{localStorage.removeItem(KEY)}catch(e){}abrir(false)}};

/* ───────── 4. só Gestor vê Usuários e permissões ───────── */
var _rm=window.renderMain;
window.renderMain=function(){
  var k='';try{k=route().k}catch(e){}
  if(k==='equipe'&&!isGestor()){var m=document.getElementById('main');var u=meU()||{};
    m.innerHTML=head('Sem acesso','Usuários e permissões é só para Gestor. Você entrou como <b>'+E(nomeCurto(u))+'</b> (perfil '+E((perfilDe(u)||{}).nome||u.perfil)+').')+'<a class="btn-apple" href="#/home">Voltar ao Início</a>';document.title='SYSTAAG · Sem acesso';return}
  var r=_rm.apply(this,arguments);
  try{if(k==='home')limparInicio();if(k==='equipe')injetarEscopo()}catch(e){console.error(e)}
  return r};

/* ───────── 5. Início: some o que a pessoa não vê ───────── */
var rotaDe=function(el){var k0=el.getAttribute('data-qv-k');if(k0)return k0;var s=(el.getAttribute('href')||'')+' '+(el.getAttribute('onclick')||'');var m=/#\/([a-z0-9]+)/.exec(s);return m?m[1]:null};
function limparInicio(){
  var m=document.getElementById('main');if(!m)return;var u=meU();if(!u||isGestor(u))return;
  /* atalhos (Resumos) */
  m.querySelectorAll('nav.v155-tiles a').forEach(function(a){var k=rotaDe(a);a.style.display=k&&!podeVerRota(k)?'none':''});
  var tiles=m.querySelector('nav.v155-tiles');if(tiles){var vis=[].some.call(tiles.querySelectorAll('a'),function(a){return a.style.display!=='none'});tiles.style.display=vis?'':'none'}
  /* blocos da Visão executiva: o bloco pertence ao departamento do link do cabeçalho */
  var algum=false;
  m.querySelectorAll('section.vx149').forEach(function(sec){var h=sec.querySelector('.vx-sh a.vx-lk');var k=h&&rotaDe(h);var ok=!k||podeVerRota(k);sec.style.display=ok?'':'none';if(ok)algum=true});
  /* dentro de um bloco visível, um número que leva a uma tela sem acesso fica só como texto */
  m.querySelectorAll('section.vx149 [href^="#/"],section.vx149 [onclick*="#/"]').forEach(function(el){var k=rotaDe(el);if(k&&!podeVerRota(k)){el.setAttribute('data-qv-k',k);el.removeAttribute('href');el.removeAttribute('onclick');el.style.cursor='default';el.style.pointerEvents='none';el.title='Fora do seu acesso'}});
  var more=m.querySelector('.inicio-more');if(more)more.style.display=algum?'':'none';
  m.querySelectorAll('.vx149-sem a').forEach(function(a){var id=(/V130_sec\('(b\d)'\)/.exec(a.getAttribute('onclick')||'')||[])[1];if(!id)return;var sec=document.getElementById('v130_s_'+id);a.style.display=sec&&sec.style.display!=='none'?'':'none'});
  /* quem vê só o próprio trabalho: atalhos para as suas telas no lugar dos Resumos */
  if(tiles&&tiles.style.display==='none'&&soMeu()&&!m.querySelector('#qv-meus')){var ts=[['meudia','Meu dia','agenda e jornada','bi-calendar-check','#16a34a'],['posfield','Meus atendimentos','Pós-venda em campo','bi-tools','#0891b2']].filter(function(t){return podeVerRota(t[0])});
    if(ts.length){var nv=document.createElement('nav');nv.className='v155-tiles';nv.id='qv-meus';nv.innerHTML=ts.map(function(t){return '<a href="#/'+t[0]+'" style="--dc:'+t[4]+'" title="'+E(t[1])+'"><i class="bi '+t[3]+'"></i><span>'+E(t[1])+'<small>'+E(t[2])+'</small></span></a>'}).join('');tiles.parentNode.insertBefore(nv,tiles.nextSibling)}}
  if(tiles&&tiles.style.display==='none'&&!m.querySelector('#qv-meus')&&!algum&&!m.querySelector('#qv-nada')){var nd=document.createElement('div');nd.id='qv-nada';nd.className='sub';nd.style.cssText='margin:6px 0 0;font-size:14px';nd.innerHTML='<i class="bi bi-hourglass-split me-1"></i>Seu acesso ainda não foi definido. Peça a um Gestor para escolher o seu perfil.';tiles.parentNode.insertBefore(nd,tiles.nextSibling)}
}
var mo=null,raf=0;
function observar(){var m=document.getElementById('main');if(!m||mo)return;mo=new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;try{if(route().k==='home')limparInicio()}catch(e){}})});mo.observe(m,{childList:true,subtree:true})}

/* ───────── 6. "Só o próprio trabalho" (Técnico) ───────── */
function soMeu(){var u=meU();return !!u&&!isGestor(u)&&escopo(u)==='meus'}
(function(){
  if(typeof SCREENS==='undefined')return;
  var _md=SCREENS.meudia;
  if(typeof _md==='function')SCREENS.meudia=function(){
    if(!soMeu())return _md.apply(this,arguments);
    var p=pessoaDe(meU());
    try{COP.ui.meudia=COP.ui.meudia||{};COP.ui.meudia.pessoa=p?p.id:'__ninguem'}catch(e){}
    var h=_md.apply(this,arguments);
    return String(h).replace(/<select[^>]*COP\.ui\.meudia\.pessoa[\s\S]*?<\/select>/,'<span class="chip info" style="font-size:12.5px"><i class="bi bi-person-check me-1"></i>'+E(p?p.nome:nomeCurto(meU()))+'</span>');
  };
  try{var R=COP.pos.role;
    var _m=R.manage,_o=R.operate,_n=R.name,_b=R.bar;
    R.manage=function(){return soMeu()?false:_m.apply(R,arguments)};
    R.operate=function(){return soMeu()?true:_o.apply(R,arguments)};
    R.name=function(){if(soMeu()){var p=pessoaDe(meU());return (p&&(p.apelido||p.nome))||nomeCurto(meU())}return _n.apply(R,arguments)};
    if(typeof _b==='function')R.bar=function(){return soMeu()?'':_b.apply(R,arguments)};
  }catch(e){}
})();

/* ── Perfis de acesso: escolher "departamento inteiro" ou "só o próprio trabalho" ── */
var perfilAberto=null;
(function(){try{var _vp=UQ.verPerfil;UQ.verPerfil=function(id){perfilAberto=id;return _vp.apply(UQ,arguments)};var _tab=UQ.tab;UQ.tab=function(t){if(t!=='perfis')perfilAberto=null;return _tab.apply(UQ,arguments)}}catch(e){}})();
window.QUEM.setEscopo=function(id,v){if(!isGestor()){toast('Só Gestor muda acessos.',true);return}var p=UQ.perfil(id);if(!p)return;p.regra.escopo=v;save_();try{log('perfis',id,'escopo → '+(v==='meus'?'só o próprio trabalho':'departamento inteiro'))}catch(e){}try{renderMain()}catch(e){}};
function injetarEscopo(){
  var m=document.getElementById('main');if(!m||!perfilAberto)return;if(m.querySelector('#qv-esc'))return;
  var lg=m.querySelector('.uq-legend');if(!lg)return;var p=UQ.perfil(perfilAberto);if(!p)return;var v=(p.regra&&p.regra.escopo)||'todos';
  var b=function(val,txt,sub){return '<button class="btn-soft" style="'+(v===val?'border-color:#0071e3;background:rgba(0,113,227,.08);color:#0071e3;font-weight:700':'')+'" onclick="QUEM.setEscopo(\''+E(p.id)+'\',\''+val+'\')">'+txt+'<div class="sub" style="font-size:11px;font-weight:400">'+sub+'</div></button>'};
  var box=document.createElement('div');box.id='qv-esc';box.className='mb-3';
  box.innerHTML='<div class="sub" style="font-size:11px;font-weight:700;letter-spacing:.06em;margin-bottom:6px">DENTRO DO DEPARTAMENTO, ESTE PERFIL VÊ</div><div class="d-flex gap-2 flex-wrap">'+b('todos','O departamento inteiro','ex.: todo o Pipeline, todo o estoque')+b('meus','Só o próprio trabalho','ex.: o técnico vê só o seu dia e os seus atendimentos')+'</div>';
  lg.parentNode.insertBefore(box,lg);
}

/* ───────── 7. o nome no topo: Trocar pessoa · Sair ───────── */
function pilula(){
  var sw=document.getElementById('uq-switch');if(sw&&!sw.__q){sw.__q=1;sw.innerHTML='<i class="bi bi-arrow-left-right"></i> Trocar pessoa';sw.onclick=function(e){e.stopPropagation();var mn=document.getElementById('uq-menu');if(mn)mn.classList.remove('open');abrir(true)}}
  var sa=document.getElementById('uq-sair');if(sa&&!sa.__q){sa.__q=1;sa.onclick=function(e){e.stopPropagation();var mn=document.getElementById('uq-menu');if(mn)mn.classList.remove('open');QUEM.sair()}}
  var lk=document.querySelector('#uq-menu a[href="#/equipe"]');if(lk){lk.style.display=isGestor()?'':'none';lk.innerHTML='<i class="bi bi-people-fill"></i> Usuários e permissões'}
}
function pintarPilula(){var pill=document.querySelector('.userpill');var u=meU();if(!pill||!u)return;var sp=pill.querySelector('span');var av=pill.querySelector('.av');
  if(av)av.textContent=ini(nomeCurto(u));if(sp)sp.innerHTML=E(nomeCurto(u))+' <span class="chip" style="font-size:9px">'+E(((perfilDe(u)||{}).nome||u.perfil).replace(/^Gestor · .*/,'Gestor'))+'</span>';pill.title='Você entrou como '+nomeCurto(u)+' · clique para trocar de pessoa'}
var _rd=window.render;window.render=function(){var r=_rd.apply(this,arguments);try{pintarPilula()}catch(e){}return r};
var _rn=window.renderNav;window.renderNav=function(){var r=_rn.apply(this,arguments);try{pilula()}catch(e){}return r};

/* ───────── início ───────── */
try{migrar();ligarPessoas()}catch(e){console.error('v166',e)}
var lembrado=null;try{lembrado=localStorage.getItem(KEY)}catch(e){}
if(lembrado&&usr(lembrado)&&usr(lembrado).ativo!==false){if(S.user!==lembrado){S.user=lembrado;save_()}}
try{pilula();observar();renderNav();pintarPilula();render()}catch(e){}
if(!window.__TREINO&&!(lembrado&&usr(lembrado)&&usr(lembrado).ativo!==false))abrir(false);
})();
