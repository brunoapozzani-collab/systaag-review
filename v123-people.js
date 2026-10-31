/* ======== v123 · PEOPLE — uma pessoa, um cadastro, todos os departamentos (Bruno, 29-out-2026) ========
   "we already have a base … that feeds the entire system": cadastrar um vendedor UMA vez faz ele aparecer em todo lugar
   onde ele pertence — e continuar lá depois de recarregar.
   1. A lista do Comercial (CONS, EQUIPE, tipos, motivos…) é reconstruída depois que a base real carrega e depois de cada
      gravação (antes ela vinha dos dados de demonstração e nunca era refeita → o consultor novo "sumia" ao recarregar).
   2. S.db.pessoas é o registro mestre. folha · usuarios · equipe · tecnicos · programadores · at_usuarios apontam para ele
      por pessoa_id. Qualquer porta (Base › Pessoas, Usuários e permissões, Entrada, Operação › Equipes, Pós-venda, CRM)
      grava a pessoa; a reconciliação (a cada save) liga as tabelas e coloca quem é Comercial + consultor na lista do Comercial.
   3. Migração única, sem perda (S.db._v123_pessoas): liga o que já existe por id (nome normalizado / e-mail) e cria as
      pessoas que faltavam.
   4. Nova proposta: o consultor é escolhido nos mesmos chips do editor (até 2), da lista única. A proposta guarda também
      consultor_ids (pessoa_id). window.V123.pessoaDoConsultor(nomeOuId) → { pessoa, folha, usuario, equipe, … }.
   5. CRM: responsáveis comerciais e o mapa nome→consultor vêm da mesma lista.
   6. Perfil de acesso = o perfil do login (perfisAcesso); o campo da Operação vira leitura; usuarios.papel é derivado dele.
   7. Menus: Base › Pessoas é o editor; Pessoas & Cultura › Pessoas e Operação › Equipes apontam para ele; "Visão" duplicado.
   8. Operação: Departamento com nomes de verdade (sem chaves cruas, sem "Comercial" repetido). */
(function(){
'use strict';
if(window.__V123_people)return;window.__V123_people=true;
if(typeof S==='undefined'||!S.db)return;
const V=window.V123=window.V123||{};
const P=window.V123PES=window.V123PES||{};
const log_=(t,id,m)=>{try{log(t,id,m)}catch(e){}};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/&/g,' e ').replace(/[^a-z0-9]+/g,' ').trim();
const sq=s=>nz(s).replace(/([a-z])\1+/g,'$1');
const STOP=new Set(['de','da','do','das','dos','e']);
const toks=s=>sq(String(s==null?'':s).replace(/\([^)]*\)/g,' ')).replace(/\b(rj|sp)$/,'').trim().split(' ').filter(t=>t&&!STOP.has(t));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>1)return 9;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];for(let j=1;j<=b.length;j++)m[i][j]=i?Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1)):j}return m[a.length][b.length]};
const tokEq=(a,b)=>a===b||(a.length===1&&b[0]===a)||(b.length===1&&a[0]===b)||(Math.min(a.length,b.length)>=5&&lev(a,b)<=1);
/* 3 = mesmo nome · 2 = mesmo primeiro e último nome · 1 = só um nome, que é o primeiro ou o último do outro · 0 = outra pessoa */
const nivel=(a,b)=>{const A=toks(a),B=toks(b);if(!A.length||!B.length)return 0;if(A.join(' ')===B.join(' '))return 3;
  if(A.length>=2&&B.length>=2){if(tokEq(A[0],B[0])&&tokEq(A[A.length-1],B[B.length-1])&&(A[0].length>1||B[0].length>1))return 2;return 0}
  const [s,l]=A.length===1?[A[0],B]:[B[0],A];if(s.length<3)return 0;return (s===l[0]||s===l[l.length-1])?1:0};
P.nivel=nivel;
const db=()=>S.db;
const arr=k=>Array.isArray(S.db[k])?S.db[k]:[];
const pes=id=>id?arr('pessoas').find(p=>p.id===id):null;
const ativa=p=>!!p&&p.ativo!==false&&!p.desligado;
const nomeDe=(t,r)=>t==='at_usuarios'?r.name:r.nome;
const nomesDaPessoa=p=>[p.nome,p.nomeCompleto,p.apelido,...(Array.isArray(p.aliases)?p.aliases:[])].filter(Boolean);
const ehComercial=p=>/\bcomercial\b/.test(nz(p.dep)+' '+nz(p.departamento));
const linksDe=id=>{const o={folha:0,usuarios:0};arr('folha').forEach(f=>{if(f.pessoa_id===id)o.folha++});arr('usuarios').forEach(u=>{if(u.pessoa_id===id)o.usuarios++});return o};
/* the best person for a name (+ e-mail): unique top → that person; tie → null (left for a human, never guessed) */
function melhor(nomes,email,opt){opt=opt||{};const em=nz(email);const C=[];
  const umNome=nomes.every(n=>toks(n).length<=1);
  arr('pessoas').forEach(p=>{let lv=0;nomes.forEach(n=>nomesDaPessoa(p).forEach(m=>{lv=Math.max(lv,nivel(n,m))}));
    if(!lv)return;if(lv===1&&opt.soComercial&&!ehComercial(p))return;
    const L=linksDe(p.id);
    /* a bare first name that equals a record nobody points to (no payroll, no login) says no more than a first-name match */
    if(lv===3&&umNome&&!L.folha&&!L.usuarios)lv=1;
    const mail=em&&p.email&&nz(p.email)===em?5:0;
    C.push({p,lv,sc:lv*10+mail+(opt.bonus?opt.bonus(p):0)+(L.folha?2:0)+(L.usuarios?1:0)+(ehComercial(p)&&opt.comercial?1:0)})});
  if(!C.length)return {p:null,n:0};C.sort((a,b)=>b.sc-a.sc);if(C.length>1&&C[0].sc===C[1].sc)return {p:null,n:C.length,amb:C.slice(0,4).map(x=>x.p.id)};return {p:C[0].p,n:C.length,lv:C[0].lv}}
/* departments: proper names, one key per name */
function deptos(){const out=new Map();const org=(S.db.cop_config&&S.db.cop_config.organograma&&S.db.cop_config.organograma.departamentos)||[];
  const DM=(window.COP&&COP.DEP_MAP)||{};const uso={};arr('pessoas').forEach(p=>{if(p.departamento){(uso[p.departamento]=uso[p.departamento]||{n:0,dep:p.dep});uso[p.departamento].n++}});
  const nomeK=k=>{const d=org.find(x=>x.k===k);if(d)return d.nome;if(DM[k])return DM[k];if(uso[k]&&uso[k].dep&&nz(uso[k].dep)===nz(k))return uso[k].dep;const ps=arr('pessoas').find(p=>p.departamento===k&&p.dep);if(ps&&nz(ps.dep)===nz(k))return ps.dep;return String(k).replace(/(^|\s)\S/g,c=>c.toUpperCase())};
  const keys=[...new Set([...org.map(d=>d.k),...Object.keys(uso),...Object.keys(DM)])].filter(Boolean);
  keys.forEach(k=>{const n=nomeK(k);const cur=out.get(nz(n));const score=(uso[k]?uso[k].n*10:0)+(org.some(d=>d.k===k)?5:0);if(!cur||score>cur.score)out.set(nz(n),{k,nome:n,score,keys:[...(cur?cur.keys:[]),k]});else cur.keys.push(k)});
  return [...out.values()].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))}
P.deptos=deptos;
const depKey=label=>{const n=nz(label);if(!n)return '';const d=deptos().find(x=>nz(x.nome)===n||x.keys.some(k=>nz(k)===n));return d?d.k:n};
const depLabel=k=>{const d=deptos().find(x=>x.keys.includes(k));return d?d.nome:k};
P.depLabel=depLabel;
let NOVAS=0;
function novaPessoa(nome,o){o=o||{};const dep=o.dep||'';const p={id:uid('pes'),nome:String(nome).trim(),nomeCompleto:String(nome).trim(),cargo:o.cargo||'',dep,departamento:dep?depKey(dep):'',setores:[],perfil:'',email:o.email||'',telefone:'',unidade:o.unidade||'',status:o.ativo===false?'A confirmar':'Ativo',ativo:o.ativo!==false,lider:false,liderDe:[],respProjetos:false,responsabilidade:'',competencias:'',dataAdmissao:'',desligado:false,validar:o.validar||'',origem:'Cadastro único v123 · '+(o.origem||'')};
  S.db.pessoas=S.db.pessoas||[];S.db.pessoas.push(p);NOVAS++;log_('pessoas',p.id,'pessoa criada (cadastro único) a partir de '+(o.origem||'?'));return p}
const PERFIL_PAPEL={ti:'gestor',diretoria:'gestor',financeiro:'gestor',gestao:'aprovador',prevendas:'aprovador'};
const papelDoPerfil=pf=>PERFIL_PAPEL[pf]||'operador';
P.papelDoPerfil=papelDoPerfil;
const perfilNome=id=>{const x=arr('perfisAcesso').find(p=>p.id===id);return x?x.nome:(id||'')};
const usuarioDa=id=>{const L=arr('usuarios').filter(u=>u.pessoa_id===id);return L.find(u=>u.ativo&&!u.duplicado_de)||L.find(u=>u.ativo)||L[0]||null};
P.usuarioDa=usuarioDa;P.perfilNome=perfilNome;
function ehConsultor(p){if(p.papel_comercial!==undefined&&p.papel_comercial!==null)return p.papel_comercial==='Consultor';
  if(arr('usuarios').some(u=>u.pessoa_id===p.id&&u.perfil==='comercial'&&u.ativo!==false&&!u.duplicado_de))return true;
  return ehComercial(p)&&/consult|vend/i.test(p.cargo||'')}
P.ehConsultor=ehConsultor;

/* ---------------- ligar cada linha de cada tabela à sua pessoa ---------------- */
const AMB=[];
function ligar(t,r,opt){const nome=nomeDe(t,r);if(!nome||r.servico)return false;
  const atual=r.pessoa_id&&pes(r.pessoa_id);
  if(atual){const ok=nomesDaPessoa(atual).some(n=>nivel(n,nome)>0)||(r.email&&atual.email&&nz(r.email)===nz(atual.email));if(ok)return false;
    r._pessoa_id_v122=r.pessoa_id;r.pessoa_id=null;log_(t,r.id||nome,'ligação errada desfeita ('+r._pessoa_id_v122+' é '+atual.nome+')')}
  let m=melhor([nome],r.email,opt);
  /* Bruno (29-out): "there are 2 Brunos" — when the data cannot tell, the Diretoria "Bruno" is Bruno Pozzani */
  if(!m.p&&m.n>1&&t==='equipe'&&toks(nome).join(' ')==='bruno'){const bp=arr('pessoas').find(p=>/\bpozzani\b/.test(nz(p.nomeCompleto||p.nome)));if(bp)m={p:bp,n:1,lv:1}}
  if(m.p){r.pessoa_id=m.p.id;if(m.lv===2&&/^Cadastro único v123/.test(m.p.origem||'')&&!nomesDaPessoa(m.p).some(n=>nz(n)===nz(nome))&&!m.p.validar)m.p.validar='Conferir a grafia do nome: '+m.p.nome+' / '+nome;return true}
  if(m.n>1){AMB.push(t+': '+nome+' → '+(m.amb||[]).join('/'));return false}
  if(opt&&opt.naoCriar)return false;
  const p=novaPessoa(nome,opt&&opt.nova?opt.nova(r):{origem:t});r.pessoa_id=p.id;return true}
function ligarTudo(){let n=0;AMB.length=0;
  arr('folha').forEach(r=>{if(ligar('folha',r,{nova:f=>({cargo:f.cargo,dep:f.dep,origem:'folha'})}))n++});
  arr('usuarios').forEach(r=>{if(ligar('usuarios',r,{nova:u=>({cargo:u.cargo,dep:u.setor,email:u.email,ativo:u.ativo!==false,origem:'usuarios (login '+u.login+')'})}))n++});
  arr('at_usuarios').forEach(r=>{if(ligar('at_usuarios',r,{nova:u=>({cargo:'Pós-venda · '+String(u.role||'').toLowerCase(),dep:'Pós-venda',email:u.email,ativo:!!u.active,origem:'Pós-venda › Usuários'})}))n++});
  arr('equipe').forEach(r=>{const cons=r.papel==='Consultor';const dir=/diretoria|aprova/i.test(r.papel||'')||!!r.aprova;if(ligar('equipe',r,{soComercial:cons,comercial:true,bonus:p=>{if(!dir)return 0;const u=usuarioDa(p.id);return ((u&&(u.papel==='gestor'||/^(diretoria|ti|gestao)$/.test(u.perfil||'')))||/diretoria/.test(nz(p.dep)))?1:0},nova:q=>({cargo:q.papel==='Consultor'?'Consultor(a)':q.papel,dep:'Comercial',ativo:q.ativo!==false,validar:q.ativo===false?'Ex-consultor(a) da equipe do Comercial — confirmar nome completo':'',origem:'Comercial › Equipe'})})){n++;const p=pes(r.pessoa_id);r._pa=ativa(p)}});
  arr('programadores').forEach(r=>{if(ligar('programadores',r,{nova:()=>({cargo:'Programador de automação',dep:'Operação Técnica',origem:'Operação › Programadores'})}))n++});
  arr('tecnicos').forEach(r=>{if(ligar('tecnicos',r,{nova:x=>({cargo:'Técnico de campo',dep:'Operação Técnica',unidade:/rio/i.test(x.base||'')?'RJ':'',origem:'Operação › Técnicos'})}))n++});
  return n}

/* ---------------- a lista do Comercial nasce das pessoas ---------------- */
function comercialSync(){let n=0;S.db.equipe=S.db.equipe||[];
  arr('pessoas').forEach(p=>{if(!ehConsultor(p))return;if(S.db.equipe.some(q=>q.pessoa_id===p.id))return;
    const nome=String(p.nomeCompleto||p.nome).trim();const solto=S.db.equipe.find(q=>!q.pessoa_id&&nz(q.nome)===nz(nome));
    if(solto){solto.pessoa_id=p.id;solto._pa=ativa(p);if(!solto.papel)solto.papel='Consultor';n++;return}
    S.db.equipe.push({id:uid('eq'),nome,nome_completo:nome,pessoa_id:p.id,papel:'Consultor',frentes:'TAAG',aprova:false,ativo:ativa(p),_pa:ativa(p),origem:'cadastro único (v123)'});n++;log_('equipe',p.id,'entrou na lista do Comercial: '+nome)});
  S.db.equipe.forEach(q=>{const p=pes(q.pessoa_id);if(!p)return;const a=ativa(p);if(q._pa===undefined){q._pa=a;return}if(q._pa!==a){q.ativo=a;q._pa=a;n++;log_('equipe',q.id,(a?'reativado':'desativado')+' com a pessoa '+p.id)}
    const nc=String(p.nomeCompleto||p.nome||'').trim();if(nc&&q.nome_completo!==nc)q.nome_completo=nc});
  return n}
/* every consultant name → pessoa id; the proposal keeps the names (display) and gains consultor_ids */
function idDoNome(n){const k=nz(n);if(!k)return null;{const qa=arr('equipe').find(x=>x.pessoa_id&&(x.apelidos||[]).some(a=>nz(a)===k));if(qa&&!arr('equipe').some(x=>nz(x.nome)===k))return qa.pessoa_id}const q=arr('equipe').find(x=>nz(x.nome)===k&&x.pessoa_id)||arr('equipe').find(x=>x.pessoa_id&&nz(x.nome_completo)===k);if(q)return q.pessoa_id;const p=arr('pessoas').find(x=>nomesDaPessoa(x).some(m=>nz(m)===k));return p?p.id:null}
function propostasSync(){let n=0;arr('propostas').forEach(p=>{if(!Array.isArray(p.consultores))return;const ids=p.consultores.map(idDoNome);if(JSON.stringify(ids)!==JSON.stringify(p.consultor_ids||null)){p.consultor_ids=ids;n++}});return n}
/* the login profile is the access profile; papel (approver/operator) follows it */
function perfisSync(){let n=0;arr('usuarios').forEach(u=>{if(!u.perfil)return;const pp=papelDoPerfil(u.perfil);if(u.papel!==pp){if(u._papel_v122===undefined)u._papel_v122=u.papel===undefined?null:u.papel;u.papel=pp;n++}});return n}
/* CRM responsáveis comerciais = the Comercial list (by pessoa id) */
const UP=s=>String(s||'').toUpperCase();
function nomesTodos(p){const s=new Set(nomesDaPessoa(p));arr('usuarios').forEach(u=>{if(u.pessoa_id===p.id)s.add(u.nome)});arr('folha').forEach(f=>{if(f.pessoa_id===p.id)s.add(f.nome)});return [...s]}
function crmSync(migrando){const T=window.CRM_T;if(!T||!Array.isArray(T.responsaveis))return 0;let n=0;const R=T.responsaveis;const at=r=>String(r.ativo)!=='0'&&r.ativo!==false&&r.ativo!==0;
  /* reverse door: a comercial responsável typed in the CRM is a person of the Comercial */
  R.filter(r=>r.tipo==='comercial'&&!r.pessoa_id&&at(r)).forEach(r=>{const m=melhor([r.nome],null,{comercial:true});let p=m.p;if(!p&&m.n>1)return;
    if(!p){p=novaPessoa(String(r.nome).toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()),{dep:'Comercial',cargo:'Consultor(a)',origem:'CRM › Responsáveis comerciais'})}
    r.pessoa_id=p.id;if(!S.db.equipe.some(q=>q.pessoa_id===p.id)&&p.papel_comercial===undefined){p.papel_comercial='Consultor';if(!ehComercial(p)&&!p.dep){p.dep='Comercial';p.departamento=depKey('Comercial')}}n++});
  if(n)comercialSync();
  arr('equipe').filter(q=>q.papel==='Consultor'&&q.pessoa_id).forEach(q=>{const p=pes(q.pessoa_id);if(!p)return;const nm=nomesTodos(p).concat([q.nome]);
    let r=R.find(x=>x.tipo==='comercial'&&x.pessoa_id===p.id)||R.find(x=>x.tipo==='comercial'&&!x.pessoa_id&&nm.some(a=>nivel(a,x.nome)>=2||nz(a)===nz(x.nome)));
    const a=q.ativo!==false;
    if(!r){if(!a)return;r={id:R.reduce((m,x)=>Math.max(m,+x.id||0),0)+1,nome:UP(p.nomeCompleto||p.nome||q.nome),tipo:'comercial',ativo:'1',pessoa_id:p.id,_ea:true};R.push(r);n++;return}
    if(!r.pessoa_id){r.pessoa_id=p.id;r._ea=a;n++;return}
    if(r._ea===undefined){r._ea=a;n++;return}
    if(r._ea!==a){r.ativo=a?'1':'0';r._ea=a;n++}});
  if(n){try{window.CRM_persistT&&CRM_persistT()}catch(e){}}return n}
function rebuild(){try{if(typeof syncMaster==='function')syncMaster()}catch(e){console.error('v123 syncMaster',e)}}
/* official spelling: a person linked to two spellings takes the one of the company's user list (CRM users / e-mail list); the other stays as alias */
function grafias(){let n=0;const T=window.CRM_T;const ofic=(T&&Array.isArray(T.usuarios)?T.usuarios.map(u=>u.nome):[]).filter(Boolean);
  arr('pessoas').forEach(p=>{if(!/^Cadastro único v123/.test(p.origem||''))return;const sp=new Set(nomesDaPessoa(p));arr('usuarios').forEach(u=>{if(u.pessoa_id===p.id&&u.nome)sp.add(u.nome)});arr('at_usuarios').forEach(u=>{if(u.pessoa_id===p.id&&u.name)sp.add(u.name)});
    const L=[...sp];if(L.length<2)return;const of=ofic.find(o=>L.some(x=>nz(x)===nz(o)&&x!==x.toUpperCase()))?L.find(x=>ofic.some(o=>nz(o)===nz(x))&&x!==x.toUpperCase()):null;if(!of)return;
    const cur=p.nomeCompleto||p.nome;if(cur===of&&!/^Conferir a grafia/.test(p.validar||''))return;
    p.aliases=[...new Set([...(p.aliases||[]),...L.filter(x=>nz(x)!==nz(of))])];if(p.nome===cur||!p.nome)p.nome=of;p.nomeCompleto=of;if(/^Conferir a grafia/.test(p.validar||''))p.validar='';n++;log_('pessoas',p.id,'grafia oficial: '+of+' (também: '+p.aliases.join(', ')+')')});return n}
/* rename a Comercial-list row and every place that stored the old name (lossless: old name kept in apelidos) */
function renomearEquipe(q,novo){const old=q.nome;if(!novo||old===novo)return 0;q.apelidos=[...new Set([...(q.apelidos||[]),old])];q.nome=novo;
  const sw=v=>v===old?novo:v;arr('propostas').forEach(p=>{if(Array.isArray(p.consultores)&&p.consultores.includes(old))p.consultores=p.consultores.map(sw)});
  arr('negociacoes').forEach(n=>{if(Array.isArray(n.consultores)&&n.consultores.includes(old))n.consultores=n.consultores.map(sw);if(typeof n.consultor==='string'&&n.consultor.indexOf(old)>=0){const parts=n.consultor.split(/(\s*[+\/,&]\s*|\s+e\s+)/i);const nv=parts.map((x,i)=>i%2===0&&x.trim()===old?novo:x).join('');if(nv!==n.consultor)n.consultor=nv}});
  arr('tarefas').forEach(t=>{if(t.quem===old)t.quem=novo});arr('parceiros').forEach(p=>{if(p.pr===old)p.pr=novo});
  log_('equipe',q.id,'nome na lista: '+old+' → '+novo);return 1}
/* Bruno (29-out): two active people with the same first name never appear as two identical/bare entries — first name + surname, or the full name */
const prim=s=>(nz(String(s||'').replace(/\([^)]*\)/g,' ')).split(' ')[0]||'');
function distinguir(){let n=0;const A=arr('pessoas').filter(ativa);
  /* the Comercial/equipe rows (CONS, EQUIPE): a v123 row follows the person's full name; a bare first name shared with another active person becomes the full name */
  arr('equipe').forEach(q=>{const p=pes(q.pessoa_id);if(!p)return;const full=String(p.nomeCompleto||p.nome||'').trim();
    if(q.origem==='cadastro único (v123)'){if(full&&q.nome!==full)n+=renomearEquipe(q,full);return}
    if(q.ativo===false||toks(q.nome).length!==1||toks(full).length<2)return;const f=prim(q.nome);
    if(A.some(o=>o.id!==p.id&&prim(o.nome)===f)||arr('equipe').some(o=>o!==q&&o.ativo!==false&&prim(o.nome)===f))n+=renomearEquipe(q,full)});
  /* the people pickers (Operação, Pós-venda…): bare first names and identical names among active people */
  const grp={};A.forEach(p=>{(grp[prim(p.nome)]=grp[prim(p.nome)]||[]).push(p)});
  Object.values(grp).filter(g=>g.length>1).forEach(g=>{g.forEach(p=>{if(toks(p.nome).length===1&&!/\(/.test(p.nome)){const full=String(p.nomeCompleto||'').trim();const novo=toks(full).length>=2?full:(p.cargo?p.nome+' ('+p.cargo+')':p.nome+' ('+p.id+')');if(novo!==p.nome){if(!p.apelido)p.apelido=p.nome;p.nome=novo;n++}}});
  });
  return n}
let busy=false;
function sync(){if(busy)return;busy=true;try{dobrarNovas();ligarTudo();grafias();comercialSync();distinguir();crmSync();propostasSync();perfisSync()}catch(e){console.error('v123 pessoas sync',e)}finally{busy=false}rebuild()}
P.sync=sync;

/* ================= ONE PERSON, ONE RECORD (Bruno 29-out: "fix it so duplicates don't happen — only one place to be the truth") =================
   identity = same name after normalizing (case, accents, spaces, a trailing "(…)" suffix) or same e-mail / login / CPF.
   1. mesclarTudo(): merges the duplicates already in the store (once, flag S.db._v123_merge). The richer record stays; every
      reference anywhere in S.db (and the CRM tables) moves to its id; the other one is kept in S.db.pessoas_mescladas
      (ativo:false, merged_into) — out of every list and picker, nothing lost.
   2. V123.pessoaExistente() is the ONE check every door asks before creating a person; the store refuses (put) or folds
      back (save) any duplicate that slips through another path. */
const chave=s=>nz(String(s==null?'':s).replace(/\([^)]*\)/g,' '));
const cpfDe=p=>{const f=arr('folha').find(r=>r.pessoa_id===p.id);const c=String(p.cpf||(f&&f.cad&&f.cad.cpf)||'').replace(/\D/g,'');return c.length>=11?c:''};
const mailDe=p=>{const s=new Set();if(p.email)s.add(nz(p.email));arr('usuarios').forEach(u=>{if(u.pessoa_id===p.id&&u.email)s.add(nz(u.email))});return s};
const chavesDe=p=>new Set([p.nome,p.nomeCompleto,...(Array.isArray(p.aliases)?p.aliases:[])].map(chave).filter(Boolean));
V.pessoaExistente=function(d,excetoId){d=d||{};const ks=[d.nome,d.nomeCompleto].map(chave).filter(Boolean);const em=d.email?nz(d.email):'';const cpf=String(d.cpf||'').replace(/\D/g,'');
  for(const p of arr('pessoas')){if(p.id===excetoId)continue;const pk=chavesDe(p);if(ks.some(k=>pk.has(k)))return {p,por:'nome'}}
  if(em)for(const p of arr('pessoas')){if(p.id!==excetoId&&mailDe(p).has(em))return {p,por:'e-mail'}}
  if(em){const a=arr('at_usuarios').find(u=>u.email&&nz(u.email)===em&&u.pessoa_id&&u.pessoa_id!==excetoId);if(a&&pes(a.pessoa_id))return {p:pes(a.pessoa_id),por:'e-mail'}}
  if(cpf.length>=11)for(const p of arr('pessoas')){if(p.id!==excetoId&&cpfDe(p)===cpf)return {p,por:'CPF'}}
  if(d.login){const u=arr('usuarios').find(x=>x.login===d.login&&x.pessoa_id);if(u&&pes(u.pessoa_id)&&u.pessoa_id!==excetoId)return {p:pes(u.pessoa_id),por:'login'}}
  return null};
const msgDup=(r)=>{const p=r.p;const nm=esc(p.nomeCompleto||p.nome);const inat=!ativa(p);
  return `<span class="v123-dup" data-pessoa="${esc(p.id)}"><b>${nm}</b> já está cadastrado${r.por!=='nome'?' (mesmo '+r.por+')':''}${inat?' — inativo':''}. Não foi criado outro. <button type="button" class="btn-soft" style="font-size:11px;padding:1px 8px" onclick="V123PES.abrir('${esc(p.id)}')">Abrir cadastro</button>${inat?` <button type="button" class="btn-apple" style="font-size:11px;padding:1px 8px" onclick="V123PES.reativar('${esc(p.id)}')">Reativar</button>`:''}</span>`};
function DupError(r){const e=new RuleError(msgDup(r));e.v123dup=r;return e}
V.DupError=DupError;
const fecharModais=()=>document.querySelectorAll('body > .card').forEach(c=>{if(c.style.position==='fixed')c.remove()});
P.abrir=function(id){fecharModais();location.hash='#/pcpessoas/'+id};
P.reativar=function(id){fecharModais();run(()=>{const p=pes(id);if(!p)throw new RuleError('Pessoa não encontrada.');p.ativo=true;p.desligado=false;if(/Indispon|Mesclad/.test(p.status||''))p.status='Ativo';log_('pessoas',id,'reativada (cadastro já existia)')},'Cadastro reativado');location.hash='#/pcpessoas/'+id};
/* show the refusal inside the open form too (toasts fade) */
const mostrarNoForm=html=>{try{const fs=[...document.querySelectorAll('body > .card form, body > .card .uq-form')];const f=fs[fs.length-1];if(!f)return;let d=f.parentElement.querySelector('.v123-dupbox');if(!d){d=document.createElement('div');d.className='v123-dupbox card p-2 mt-2';d.style.cssText='border-left:4px solid #dc3545;display:block;font-size:13px';f.parentElement.insertBefore(d,f.nextSibling)}d.innerHTML=html}catch(e){}};
const recusar=r=>{const e=DupError(r);mostrarNoForm(e.message);return e};
/* deep move of every reference old id → kept id */
const SKIP_TOP=new Set(['log','logs','audit','auditoria','pessoas_mescladas','_v123_merge','_v123_pessoas']);
function remap(from,to,skipObj){let n=0;const seen=new Set();const walk=o=>{if(!o||typeof o!=='object'||seen.has(o)||o===skipObj)return;seen.add(o);
    if(Array.isArray(o)){for(let i=0;i<o.length;i++){if(o[i]===from){o[i]=to;n++}else walk(o[i])}return}
    for(const k of Object.keys(o)){const v=o[k];if(v===from){o[k]=to;n++}else if(v&&typeof v==='object')walk(v)}};
  for(const k of Object.keys(S.db)){if(SKIP_TOP.has(k))continue;const v=S.db[k];if(v===from){S.db[k]=to;n++}else walk(v)}
  if(window.CRM_T){const before=n;walk(window.CRM_T);if(n>before)try{CRM_persistT()}catch(e){}}
  return n}
const riqueza=p=>{const L=linksDe(p.id);return L.folha*20+L.usuarios*6+arr('equipe').filter(q=>q.pessoa_id===p.id).length*4+Object.keys(p).filter(k=>p[k]!==''&&p[k]!=null&&!(Array.isArray(p[k])&&!p[k].length)).length+(ativa(p)?3:0)};
function mesclar(keep,lose,motivo){if(!keep||!lose||keep===lose)return 0;
  Object.keys(lose).forEach(k=>{if(['id','origem','merged_into','validar','status','ativo','desligado'].includes(k))return;const v=lose[k];const e=keep[k];if((e===undefined||e===null||e===''||(Array.isArray(e)&&!e.length))&&v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&!v.length))keep[k]=v});
  const al=new Set(keep.aliases||[]);[lose.nome,lose.nomeCompleto,lose.apelido,...(lose.aliases||[])].filter(Boolean).forEach(n=>{if(!nomesDaPessoa(keep).some(m=>m===n))al.add(String(n).replace(/\s*\([^)]*\)\s*$/,'').trim())});[...al].forEach(a=>{if(nomesDaPessoa(keep).includes(a))al.delete(a)});if(al.size)keep.aliases=[...al];
  if(!ativa(keep)&&ativa(lose)){keep.ativo=true;keep.desligado=false}
  if(keep.validar&&/^Possível duplicata/.test(keep.validar))keep.validar='';
  S.db.pessoas=arr('pessoas').filter(p=>p!==lose);
  const n=remap(lose.id,keep.id,lose);
  /* two Comercial-list rows for the same person and role: one stays */
  const vis={};arr('equipe').forEach(q=>{if(q.pessoa_id!==keep.id)return;const k=q.papel||'';if(vis[k]&&q.ativo!==false){q.ativo=false;q.merged_into=vis[k].id}else if(!vis[k])vis[k]=q});
  S.db.pessoas_mescladas=S.db.pessoas_mescladas||[];S.db.pessoas_mescladas.push(Object.assign({},lose,{ativo:false,merged_into:keep.id,mesclado_em:new Date().toISOString().slice(0,10),motivo_mescla:motivo||'mesmo nome'}));
  log_('pessoas',keep.id,'mesclado: '+lose.id+' ('+lose.nome+') → '+keep.id+' · '+n+' referência(s) movidas');return n}
/* a pair the data proves different (two different CPFs or e-mails): not merged, listed */
const provaDiferentes=(a,b)=>{const ca=cpfDe(a),cb=cpfDe(b);if(ca&&cb&&ca!==cb)return true;const ea=a.email?nz(a.email):'',eb=b.email?nz(b.email):'';return !!(ea&&eb&&ea!==eb)};
function mesclarTudo(){const out={grupos:[],refs:0,homonimos:[]};let mudou=true,guard=0;
  while(mudou&&guard++<50){mudou=false;const P_=arr('pessoas');
    outer:for(let i=0;i<P_.length;i++)for(let j=i+1;j<P_.length;j++){const a=P_[i],b=P_[j];const ka=chavesDe(a),kb=chavesDe(b);
      let por=[...ka].some(k=>kb.has(k))?'nome':'';if(!por){const ma=mailDe(a),mb=mailDe(b);if([...ma].some(m=>mb.has(m)))por='e-mail'}if(!por){const ca=cpfDe(a);if(ca&&ca===cpfDe(b))por='CPF'}
      if(!por)continue;if(provaDiferentes(a,b)){const t=[a.id,b.id].sort().join('/');if(!out.homonimos.some(h=>h.ids===t))out.homonimos.push({ids:t,nome:a.nomeCompleto||a.nome});continue}
      const [k,l]=riqueza(a)>=riqueza(b)?[a,b]:[b,a];out.refs+=mesclar(k,l,'mesmo '+por);out.grupos.push(l.id+' → '+k.id+' ('+(k.nomeCompleto||k.nome)+', mesmo '+por+')');mudou=true;break outer}}
  return out}
P.mesclarTudo=mesclarTudo;
/* store level: put refuses a new duplicate; save folds back any duplicate pushed by another path */
if(typeof window.put==='function'){const _put=window.put;window.put=function(t,row){if(t==='pessoas'&&row&&row.id&&!busy){const novo=!arr('pessoas').some(p=>p.id===row.id);
    const r=V.pessoaExistente({nome:row.nome,nomeCompleto:row.nomeCompleto,email:row.email,cpf:row.cpf},row.id);if(r&&(novo||r.por==='nome'||r.por==='e-mail')){if(novo&&ANEXAR)return r.p;throw recusar(r)}}
  return _put.apply(this,arguments)}}
let CONHECIDAS=null;let ANEXAR=false;
function dobrarNovas(){if(!CONHECIDAS)return 0;let n=0;const novas=arr('pessoas').filter(p=>!CONHECIDAS.has(p.id));
  novas.forEach(p=>{const outras=arr('pessoas').filter(o=>o!==p&&(CONHECIDAS.has(o.id)||novas.indexOf(o)<novas.indexOf(p)));const ks=chavesDe(p);const ms=mailDe(p);
    const o=outras.find(x=>[...chavesDe(x)].some(k=>ks.has(k)))||outras.find(x=>[...mailDe(x)].some(m=>ms.has(m)));
    if(o&&!provaDiferentes(o,p)){mesclar(o,p,'bloqueado: cadastro repetido');n++;try{toast(msgDup({p:o,por:'nome'}),true)}catch(e){}}});
  CONHECIDAS=new Set(arr('pessoas').map(p=>p.id));return n}

/* ---------------- one-time migration (lossless; flag in the store) ---------------- */
function migrar(){const d=S.db;if(d._v123_pessoas)return false;NOVAS=0;
  const n1=ligarTudo();grafias();
  /* CRM responsáveis comerciais ativos (Camilla, Danielle, Renan…) are people of the Comercial */
  const c1=crmSync(true);
  const n2=comercialSync();const nd=distinguir();propostasSync();const n3=perfisSync();
  d._v123_pessoas={em:new Date().toISOString().slice(0,10),ligacoes:n1,pessoas_criadas:NOVAS,comercial:n2,crm:c1,papeis_derivados:n3,nomes_distinguidos:nd,ambiguos:AMB.slice()};
  log_('pessoas','v123','cadastro único: '+n1+' ligação(ões), '+NOVAS+' pessoa(s) criada(s), '+n2+' entrada(s) na lista do Comercial, '+n3+' papel(éis) derivado(s) do perfil'+(AMB.length?', '+AMB.length+' ambígua(s) deixada(s) para conferir':''));
  return true}

/* ---------------- helper for the commission area ---------------- */
V.pessoaDoConsultor=function(x){if(x==null||x==='')return null;const s=String(x);let p=pes(s);let q=null;
  if(!p){q=arr('equipe').find(e=>e.id===s)||arr('equipe').find(e=>e.nome===s)||arr('equipe').find(e=>nz(e.nome)===nz(s)||nz(e.nome_completo)===nz(s));if(q)p=pes(q.pessoa_id)}
  if(!p){const m=melhor([s],null,{comercial:true});p=m.p}
  if(!p)return null;if(!q)q=arr('equipe').find(e=>e.pessoa_id===p.id)||null;
  let f=arr('folha').find(r=>r.pessoa_id===p.id)||null;if(!f){const nm=nomesTodos(p);const c=arr('folha').filter(r=>nm.some(n=>nivel(n,r.nome)>=2));if(c.length===1)f=c[0]}
  return {pessoa_id:p.id,nome:q?q.nome:(p.nome||''),nome_completo:p.nomeCompleto||p.nome||'',pessoa:p,folha:f,usuario:usuarioDa(p.id),equipe:q,ativo:ativa(p)&&(!q||q.ativo!==false)}};
V.consultorIds=p=>(p&&Array.isArray(p.consultores)?p.consultores.map(idDoNome):[]);
V.consMapGet=function(k){if(typeof k!=='string'||!k)return undefined;const K=nz(k);const q=arr('equipe').find(e=>e.papel==='Consultor'&&(nz(e.nome_completo)===K||nz(e.nome)===K));if(q)return q.nome;
  const q2=arr('equipe').find(e=>{if(e.papel!=='Consultor'||!e.pessoa_id)return false;const p=pes(e.pessoa_id);return p&&nomesTodos(p).some(n=>nz(n)===K)});return q2?q2.nome:undefined};
V.listaComercial=()=>arr('equipe').filter(e=>e.papel==='Consultor'&&e.ativo).map(e=>({id:e.id,nome:e.nome,nome_completo:e.nome_completo||e.nome,pessoa_id:e.pessoa_id||null}));
V.syncPessoas=sync;

/* ---------------- save: reconcile before writing (SHARED TOUCH: window.save) ---------------- */
{const _save=window.save;window.save=function(){try{sync()}catch(e){console.error('v123 pessoas',e)}return _save.apply(this,arguments)}}

/* ---------------- doors ---------------- */
/* Papéis grid: Ativo and Comercial act on the PERSON (the master), then the original writes the copies */
const grupo=key=>{try{return ASM.pessoas().lista.find(x=>x.key===key)}catch(e){return null}};
const pessoasDoGrupo=g=>{if(!g)return [];const ids=new Set((g.em.pessoas||[]).map(r=>r.id));Object.keys(g.em).forEach(t=>g.em[t].forEach(r=>{if(r.pessoa_id)ids.add(r.pessoa_id)}));return [...ids].map(pes).filter(Boolean)};
if(typeof window.__pes==='function'){const _p=window.__pes;window.__pes=function(key,what,val){try{const g=grupo(key);const ps=pessoasDoGrupo(g);
    if(what==='ativo')ps.forEach(p=>{p.ativo=!!val;if(val){p.desligado=false;if(p.status==='Indisponível')p.status='Ativo'}else p.status='Indisponível'});
    if(what==='com')ps.forEach(p=>{p.papel_comercial=val||''});}catch(e){console.error('v123 __pes',e)}
  return _p.apply(this,arguments)}}
/* Papéis: one row per PERSON (grouped by id, not by how the name was typed) */
if(window.ASM&&typeof ASM.pessoas==='function'){const _ap=ASM.pessoas;ASM.pessoas=function(){const r=_ap.apply(this,arguments);try{
  const L=r.lista;const par=L.map((_,i)=>i);const f=i=>par[i]===i?i:(par[i]=f(par[i]));const by={};
  L.forEach((g,i)=>{const ids=new Set((g.em.pessoas||[]).map(x=>x.id));Object.keys(g.em).forEach(t=>g.em[t].forEach(x=>{if(x.pessoa_id)ids.add(x.pessoa_id)}));ids.forEach(id=>{if(by[id]===undefined)by[id]=i;else par[f(i)]=f(by[id])})});
  const M={};L.forEach((g,i)=>{const k=f(i);if(!M[k]){M[k]={key:g.key,nomes:new Set(g.nomes),em:{},_base:!!g.em.pessoas};Object.keys(g.em).forEach(t=>M[k].em[t]=g.em[t].slice())}else{const m=M[k];g.nomes.forEach(n=>m.nomes.add(n));Object.keys(g.em).forEach(t=>{m.em[t]=(m.em[t]||[]).concat(g.em[t])});if(!m._base&&g.em.pessoas){m.key=g.key;m._base=true}}});
  r.lista=Object.values(M).map(p=>({key:p.key,nomes:[...p.nomes],em:p.em,n:Object.keys(p.em).length,fraco:[...p.nomes].some(x=>!/\s/.test(String(x).trim()))})).sort((a,b)=>b.n-a.n||a.key.localeCompare(b.key))}catch(e){console.error('v123 ASM.pessoas',e)}return r}}
/* Papéis: the access column is the LOGIN PROFILE (perfisAcesso); papel is shown as derived */
P.setPerfil=function(key,perfil){run(()=>{const g=grupo(key);if(!g)throw new RuleError('Pessoa não encontrada.');const ps=pessoasDoGrupo(g);const p=ps[0];
  let u=(g.em.usuarios||[]).find(x=>x.ativo&&!x.duplicado_de)||(g.em.usuarios||[])[0]||(p&&usuarioDa(p.id));
  const f=(g.em.folha||[])[0];const nome=(p&&(p.nomeCompleto||p.nome))||(f&&f.nome)||g.nomes[0];
  if(!perfil){if(u){u.ativo=false;log_('usuarios',u.login,'login desativado (sem perfil) em Base › Pessoas')}return}
  if(!u){const base=nz(nome).replace(/\s+/g,'.')||'pessoa';let login=base,i=2;while(arr('usuarios').some(x=>x.login===login))login=base+(i++);
    u={id:uid('usr'),login,nome,email:(p&&p.email)||'',setor:(p&&p.dep)||(f&&f.dep)||'',cargo:(p&&p.cargo)||(f&&f.cargo)||'',grupos:[],perfil,ativo:true,excecoes:{},fonte:'Base de dados › Pessoas',pessoa_id:p?p.id:null};S.db.usuarios.push(u)}
  u.perfil=perfil;u.ativo=true;u.papel=papelDoPerfil(perfil);log_('usuarios',u.login,'perfil de acesso = '+perfilNome(perfil))},'Perfil de acesso gravado')};
function papeisPost(h){try{
  h=h.replace('<th>Estoque</th>','<th title="O perfil do login (Pessoas & Cultura › Usuários e permissões). Aprova/opera vem dele.">Acesso (perfil do login)</th>');
  h=h.replace(/<select class="form-select form-select-sm" onchange="__pes\('([^']+)','est',this\.value\)">[\s\S]*?<\/select>/g,(m,key)=>{const g=grupo(key);if(!g)return m;const ps=pessoasDoGrupo(g);
    const u=(g.em.usuarios||[]).find(x=>x.ativo&&!x.duplicado_de)||(ps[0]&&usuarioDa(ps[0].id));const cur=u&&u.ativo!==false?u.perfil||'':'';
    return `<select class="form-select form-select-sm" data-v123-perfil="${esc(key)}" onchange="V123PES.setPerfil('${key}',this.value)"><option value="">— sem login —</option>${arr('perfisAcesso').map(p=>`<option value="${esc(p.id)}"${p.id===cur?' selected':''}>${esc(p.nome)}</option>`).join('')}</select>${cur?`<div class="sub" style="font-size:10px">${esc(papelDoPerfil(cur))}</div>`:''}`});
  return h}catch(e){return h}}
if(typeof SCREENS.dbpessoas==='function'){const _d=SCREENS.dbpessoas;SCREENS.dbpessoas=function(arg){let h=_d.apply(this,arguments);if(typeof h!=='string')return h;if(arg==='papeis')h=papeisPost(h);return h}}

/* Nova proposta: the same chips as the editor, from the one Comercial list, max 2 */
P.npToggle=function(btn){const inp=document.getElementById('n_cons');if(!inp)return;const nome=btn.getAttribute('data-nome');const L=inp.value?inp.value.split(' + ').filter(Boolean):[];const i=L.indexOf(nome);
  if(i>=0)L.splice(i,1);else{if(L.length>=2){try{toast('Até 2 consultores por proposta. Desmarque um para trocar.',true)}catch(e){}return}L.push(nome)}
  inp.value=L.join(' + ');document.querySelectorAll('[data-v123-np]').forEach(b=>{const on=L.includes(b.getAttribute('data-nome'));b.classList.toggle('info',on);b.textContent=(on?'✓ ':'')+b.getAttribute('data-nome')})};
const chipsNova=()=>{const L=(typeof CONS!=='undefined'?CONS:[]);return `<input type="hidden" id="n_cons" value=""><div class="d-flex flex-wrap gap-1" id="v123_np_cons">${L.map(c=>`<button type="button" class="chip" data-v123-np="1" data-nome="${esc(c)}" style="border:0;cursor:pointer" onclick="V123PES.npToggle(this)">${esc(c)}</button>`).join('')||'<span class="sub">Ninguém na lista do Comercial — cadastre em Base › Pessoas.</span>'}</div><div class="sub" style="font-size:11px">A lista do Comercial (Base › Pessoas). Escolha 1 ou 2.</div>`};
if(typeof SCREENS.nova==='function'){const _n=SCREENS.nova;SCREENS.nova=function(){let h=_n.apply(this,arguments);if(typeof h!=='string')return h;return h.replace(/<input id="n_cons"[^>]*>/,chipsNova())}}
['novaProposta','novaPropostaTipo'].forEach(k=>{if(typeof A[k]!=='function')return;const _f=A[k];A[k]=function(f){try{if(f&&Array.isArray(f.consultores)&&route().k==='nova'){if(!f.consultores.length)throw new RuleError('Escolha o consultor (até 2) na lista do Comercial.');if(f.consultores.length>2)throw new RuleError('No máximo 2 consultores por proposta.')}}catch(e){if(e instanceof RuleError)throw e}
  const id=_f.apply(this,arguments);try{const p=get('propostas',id);if(p&&Array.isArray(p.consultores))p.consultor_ids=p.consultores.map(idDoNome)}catch(e){}return id}});
if(typeof A.toggleConsultor==='function'){const _t=A.toggleConsultor;A.toggleConsultor=function(pr){const r=_t.apply(this,arguments);try{const p=get('propostas',pr);p.consultor_ids=p.consultores.map(idDoNome)}catch(e){}return r}}
/* editor chips: a consultant who left still shows (marked) on the proposals that carry his name */
if(typeof window.__consChips==='function'){const _c=window.__consChips;window.__consChips=function(p){let h=_c.apply(this,arguments);try{const fora=(p.consultores||[]).filter(c=>!CONS.includes(c));if(fora.length)h=h.replace(/<\/div>$/,fora.map(c=>`<button type="button" class="chip info" style="border:0;cursor:pointer;opacity:.7" title="Fora da lista ativa do Comercial" onclick="run(()=>A.toggleConsultor('${p.id}','${esc(c)}'),'Consultores')">✓ ${esc(c)} (inativo)</button>`).join('')+'</div>')}catch(e){}return h}}

/* Operação › Equipes form: Departamento with proper names; "Perfil de acesso" = the login profile, read-only */
if(window.COP&&typeof COP.form==='function'){const _f=COP.form;COP.form=function(title,fields,onSave,opts){try{
  if(Array.isArray(fields)&&fields.some(f=>f&&f.k==='nomeCompleto')&&fields.some(f=>f&&f.k==='perfil'&&f.t==='select')){
    const E2=(window.COP&&COP.esc)||esc;const cur=/^Pessoa · /.test(String(title))?arr('pessoas').find(p=>title==='Pessoa · '+E2(p.nome)):null;
    fields=fields.map(f=>{if(!f)return f;
      if(f.k==='departamento'){const D=deptos();let v=f.v;if(v&&!D.some(d=>d.k===v)){const d=D.find(x=>x.keys.includes(v));if(d)v=d.k}return Object.assign({},f,{opts:D.map(d=>[d.k,d.nome]),v,help:'Comercial + cargo de consultor/vendedor = entra na lista do Comercial (propostas, Pipeline, CRM).'})}
      if(f.k==='perfil'){const u=cur&&usuarioDa(cur.id);return {k:'_v123_perfil',l:'Perfil de acesso (do login)',v:u?perfilNome(u.perfil)+(u.ativo===false?' · login inativo':''):'sem login',ro:true,help:'Definido no login — Base › Pessoas › Papéis ou Pessoas & Cultura › Usuários e permissões.'}}
      return f});
    const _s=onSave;onSave=function(v){if(v)delete v._v123_perfil;return _s.apply(this,arguments)}}
  if(String(title).indexOf('Entrada')===0&&Array.isArray(fields)){fields=fields.map(f=>f&&f.k==='cargo'?Object.assign({},f,{help:'Comercial + cargo de consultor/vendedor = entra na lista do Comercial.'}):f)}
}catch(e){console.error('v123 form',e)}return _f.call(this,title,fields,onSave,opts)}}
if(window.COP&&typeof COP.filters==='function'){const _fl=COP.filters;COP.filters=function(screen,items){try{if(screen==='equipes'&&Array.isArray(items))items=items.map(f=>{if(!f||f.k!=='departamento')return f;const used=new Set(arr('pessoas').map(p=>p.departamento).filter(Boolean));return Object.assign({},f,{opts:[...used].map(k=>[k,depLabel(k)]).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'))})})}catch(e){}return _fl.apply(this,arguments)}}

/* ---------------- render post-passes: doors point to the one editor; commission list shows who has no payroll ---------------- */
function post(){const m=document.getElementById('main');if(!m)return;let k='';try{k=route().k}catch(e){}const h=location.hash;
  if(k==='pcpessoas'&&!/^#\/pcpessoas\/./.test(h)&&!m.querySelector('#v123-pc')){const t=m.querySelector('h1,.h1');const bar=document.createElement('div');bar.id='v123-pc';bar.className='card p-2 mb-2';bar.style.display='block';
    bar.innerHTML='<b>Cadastro único.</b> Esta lista é para consulta. Para cadastrar ou mudar uma pessoa (cargo, departamento, papel no Comercial, perfil de acesso, ativo), use <a class="btn-apple ms-1" style="padding:2px 10px;font-size:12px" href="#/dbpessoas">Base › Pessoas</a>';
    const anchor=t?t.closest('.d-flex')||t:null;if(anchor&&anchor.parentElement)anchor.parentElement.insertBefore(bar,anchor.nextSibling);else m.prepend(bar)}
  if(k==='equipes'&&!m.querySelector('#v123-eq')){const t=m.querySelector('h1,.h1');const bar=document.createElement('div');bar.id='v123-eq';bar.className='sub mb-2';
    bar.innerHTML='<i class="bi bi-link-45deg"></i> As mesmas pessoas de <a href="#/dbpessoas">Base › Pessoas</a> (cadastro único). Quem é do departamento Comercial com cargo de consultor entra na lista do Comercial.';
    const anchor=t?t.closest('.d-flex')||t:null;if(anchor&&anchor.parentElement)anchor.parentElement.insertBefore(bar,anchor.nextSibling);else m.prepend(bar)}
  if((k==='fcontas'&&/comissoes/.test(h)&&!/comissoes\/(?!pessoas)[a-z]/.test(h))||(k==='remuneracao'&&!/remuneracao\/(?!pessoas)[a-z]/.test(h))){if(!m.querySelector('#v123-semfolha')){
    const L=arr('equipe').filter(q=>q.papel==='Consultor'&&q.ativo).map(q=>{const r=V.pessoaDoConsultor(q.pessoa_id||q.nome);return {q,r}}).filter(x=>!x.r||!x.r.folha);
    const tb=[...m.querySelectorAll('table')].find(t=>/Regras/i.test((t.querySelector('thead')||{}).textContent||''));
    if(L.length&&tb){const c=document.createElement('div');c.id='v123-semfolha';c.className='card p-3 mt-3';
      c.innerHTML=`<h6 class="mb-1">Consultores do Comercial sem ficha na folha <span class="chip">${L.length}</span></h6><div class="sub mb-2" style="font-size:12px">Estão na lista do Comercial (propostas, Pipeline, CRM) mas ainda não têm salário nem regra de comissão. Crie a ficha em Base › Pessoas › Ficha e documentos › Novo colaborador.</div>${L.map(x=>`<div class="d-flex gap-2 py-1" style="border-top:1px solid var(--bd);font-size:13px" data-v123-semfolha="${esc(x.q.pessoa_id||'')}"><b>${esc(x.q.nome_completo||x.q.nome)}</b><span class="sub">Consultor(a) · ${esc(x.q.pessoa_id||'sem pessoa')}</span><span class="sub ms-auto">só salário? — sem regra</span><a class="btn-soft" style="font-size:11px" href="#/dbpessoas">Criar ficha</a></div>`).join('')}`;
      const wrap=tb.closest('.card')||tb;wrap.parentElement.insertBefore(c,wrap.nextSibling)}}}}
if(typeof window.renderMain==='function'){const _rm=window.renderMain;window.renderMain=function(){const r=_rm.apply(this,arguments);try{post()}catch(e){console.error('v123 post',e)}return r}}

/* menus: "Visão" twice in Pessoas & Cultura → the Facilities one says so */
try{const s=NAV.find(x=>x.id==='pes');if(s){const it=s.items.find(i=>i[0]==='fchome');if(it&&it[1]==='Visão'){it[1]='Visão de Facilities';try{LABEL.fchome='Visão de Facilities'}catch(e){}}}}catch(e){}
try{if(window.RAILNOME){}}catch(e){}

/* ---------------- the doors ask the ONE check before creating ---------------- */
const temLogin=p=>arr('usuarios').some(u=>u.pessoa_id===p.id&&u.ativo!==false&&!u.duplicado_de);
const temAT=p=>arr('at_usuarios').some(u=>u.pessoa_id===p.id&&u.active);
/* Base › Pessoas › Novo colaborador: a person who already has a ficha is refused; one without a ficha gets it (attached) */
if(typeof A.novoColaborador==='function'){const _nc=A.novoColaborador;A.novoColaborador=function(o){const r=V.pessoaExistente({nome:o&&o.nome,cpf:o&&o.cpf});
  if(r&&(linksDe(r.p.id).folha||!ativa(r.p)))throw recusar(r);
  ANEXAR=!!r;try{const out=_nc.apply(this,arguments);if(r){const fl=arr('folha').find(x=>chave(x.nome)===chave(o.nome));if(fl)fl.pessoa_id=r.p.id}return out}finally{ANEXAR=false}}}
/* Entrada · Operação Nova pessoa (create a person) · Pós-venda Novo usuário (a login/role: attached to the existing person) */
if(window.COP&&typeof COP.form==='function'){const _f2=COP.form;COP.form=function(title,fields,onSave,opts){try{const T=String(title);const ks=(fields||[]).map(f=>f&&f.k);
  if(/^Entrada/.test(T)&&ks.includes('nome')){const _s=onSave;onSave=function(v){const r=V.pessoaExistente({nome:v.nome,email:v.email});if(r)throw recusar(r);return _s.apply(this,arguments)}}
  else if(ks.includes('nomeCompleto')&&ks.includes('departamento')){const E2=(window.COP&&COP.esc)||esc;const cur=/^Pessoa · /.test(T)?arr('pessoas').find(p=>T==='Pessoa · '+E2(p.nome)):null;const _s=onSave;
    onSave=function(v){const r=V.pessoaExistente({nome:v.nome,nomeCompleto:v.nomeCompleto,email:v.email},cur&&cur.id);if(r&&(!cur||r.por==='nome'||r.por==='e-mail'))throw recusar(r);return _s.apply(this,arguments)}}
  else if(/^Novo usuário/.test(T)&&ks.includes('name')&&ks.includes('role')){const _s=onSave;onSave=function(v){const r=V.pessoaExistente({nome:v.name,email:v.email});if(r&&temAT(r.p))throw recusar(r);
    const out=_s.apply(this,arguments);if(r){const em=nz(v.email);const a=arr('at_usuarios').find(u=>nz(u.email)===em);if(a)a.pessoa_id=r.p.id}return out}}
}catch(e){console.error('v123 portas',e)}return _f2.call(this,title,fields,onSave,opts)}}
/* Usuários e permissões › Novo membro: a login for someone already registered is attached to him; if he already has a login, refused */
if(window.UQ&&typeof UQ.form==='function'){const _uf=UQ.form;UQ.form=function(u){const r0=_uf.apply(this,arguments);try{if(u)return r0;const ms=[...document.querySelectorAll('body > .card')];const m=ms.reverse().find(x=>x.querySelector('#uqf-save'));if(!m)return r0;const b=m.querySelector('#uqf-save');const orig=b.onclick;
  b.onclick=function(ev){const g=id=>((m.querySelector('#'+id)||{}).value||'').trim();const r=V.pessoaExistente({nome:g('uqf-nome'),email:g('uqf-email')});
    if(r&&temLogin(r.p)){mostrarNoForm(msgDup(r).replace('Não foi criado outro.','Ele já tem login — não foi criado outro.'));try{toast(msgDup(r),true)}catch(e){}return}
    const login=g('uqf-login').toLowerCase().replace(/\s+/g,'.');const res=orig&&orig.call(this,ev);
    if(r){const nu=arr('usuarios').find(x=>x.login===login);if(nu&&nu.pessoa_id!==r.p.id){nu.pessoa_id=r.p.id;try{save()}catch(e){}try{renderMain()}catch(e){}}}return res}}catch(e){console.error('v123 novo membro',e)}return r0}}

/* ---------------- Possíveis duplicados (near-matches are NEVER auto-merged — a person decides) ---------------- */
const tk=s=>nz(String(s==null?'':s).replace(/\([^)]*\)/g,' ')).replace(/\b(rj|sp)$/,'').trim().split(' ').filter(t=>t&&!STOP.has(t));
function quase(a,b){const A=tk(a),B=tk(b);if(!A.length||!B.length)return '';if(A.join(' ')===B.join(' '))return 'mesmo nome';
  const [s1,l1]=A.length<=B.length?[A,B]:[B,A];
  if(s1.length>=2&&l1.length>=2&&s1[0]===l1[0]){const x=s1[s1.length-1],y=l1[l1.length-1];if(x.length===1&&y[0]===x)return 'nome + inicial do sobrenome';if(y.length===1&&x[0]===y)return 'nome + inicial do sobrenome'}
  if(A.length>=2&&B.length>=2&&A[A.length-1]===B[B.length-1]&&A[0]!==B[0]&&A[0].slice(0,3)===B[0].slice(0,3)&&Math.min(A[0].length,B[0].length)>=3)return 'apelido (mesmo sobrenome)';
  if(s1.every(t=>l1.includes(t)))return 'um nome contido no outro';return ''}
const IGN=()=>{S.db._v123_dup_ignorar=S.db._v123_dup_ignorar||[];return S.db._v123_dup_ignorar};
const parKey=(a,b)=>[a,b].sort().join('|');
P.possiveis=function(){const L=arr('pessoas').filter(ativa);const ign=new Set(IGN());const out=[];
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];let why='';
    for(const x of nomesDaPessoa(a)){for(const y of nomesDaPessoa(b)){why=quase(x,y);if(why)break}if(why)break}
    if(!why)continue;if(provaDiferentes(a,b))continue;if(linksDe(a.id).folha&&linksDe(b.id).folha)continue; /* two payroll records = two employees */
    const key=parKey(a.id,b.id);if(ign.has(key))continue;out.push({a:a.id,b:b.id,an:a.nomeCompleto||a.nome,bn:b.nomeCompleto||b.nome,why,key})}return out};
P.unir=function(keepId,loseId){run(()=>{const k=pes(keepId),l=pes(loseId);if(!k||!l||k===l)throw new RuleError('Pessoa não encontrada (talvez já unida).');const n=mesclar(k,l,'unido em Base › Pessoas');
  (S.db._v123_unidos=S.db._v123_unidos||[]).push({mantido:keepId,unido:loseId,refs:n,em:new Date().toISOString().slice(0,10)})},'Unidos — um cadastro só, nada se perde')};
P.naoDup=function(key){run(()=>{const I=IGN();if(!I.includes(key))I.push(key)},'Anotado: não são a mesma pessoa')};
function possiveisCard(){const L=P.possiveis();if(!L.length)return `<div class="sub mb-2" style="font-size:12px" data-v123pes="possiveis" data-n="0">Possíveis duplicados: nenhum.</div>`;
  return `<div class="card p-3 mb-3" data-v123pes="possiveis" data-n="${L.length}" style="border-left:4px solid #f5a623;display:block"><h6 class="mb-1">Possíveis duplicados · ${L.length}</h6><div class="sub mb-2" style="font-size:12px">Nomes parecidos. Se for a mesma pessoa, "Unir" junta tudo (folha, login, Comercial, CRM, propostas, obras, atividades) num cadastro só — nada se perde. Se não for, "Não são o mesmo" e o par não aparece mais.</div>
  <table class="tbl"><tbody>${L.map(x=>`<tr data-v123pespair="${esc(x.key)}"><td><b>${esc(x.an)}</b> × <b>${esc(x.bn)}</b><div class="sub" style="font-size:11px">${esc(x.why)} · ${esc(x.a)} / ${esc(x.b)}</div></td><td style="white-space:nowrap"><button class="btn-soft" data-v123unir="a" onclick="V123PES.unir('${esc(x.a)}','${esc(x.b)}')">Unir em ${esc(x.an)}</button> <button class="btn-soft" data-v123unir="b" onclick="V123PES.unir('${esc(x.b)}','${esc(x.a)}')">Unir em ${esc(x.bn)}</button> <button class="btn-soft" data-v123nao="1" onclick="V123PES.naoDup('${esc(x.key)}')">Não são o mesmo</button></td></tr>`).join('')}</tbody></table></div>`}
if(typeof SCREENS.dbpessoas==='function'){const _d2=SCREENS.dbpessoas;SCREENS.dbpessoas=function(){let h=_d2.apply(this,arguments);if(typeof h!=='string')return h;try{const c=possiveisCard();const i=h.indexOf('<div class="tabs');h=i>=0?h.slice(0,i)+c+h.slice(i):c+h}catch(e){console.error('v123 possiveis',e)}return h}}

/* ---------------- boot: migrate once, reconcile, rebuild the lists from the REAL store ---------------- */
try{let mg=false;if(!S.db._v123_merge){busy=true;try{const r=mesclarTudo();S.db._v123_merge=Object.assign({em:new Date().toISOString().slice(0,10),mescladas:r.grupos.length},r);mg=true}finally{busy=false}}const M=S.db._v123_merge;if(M&&!M.tito){busy=true;try{const t=arr('pessoas').find(p=>chave(p.nomeCompleto||p.nome)==='tito'),a=arr('pessoas').find(p=>chave(p.nomeCompleto||p.nome)==='alan tito');
      M.tito=t&&a?{mantido:a.id,unido:t.id,refs:mesclar(a,t,'Tito = Alan Tito (confirmado 29-out)')}:{nada:true};mg=true}finally{busy=false}}
    const mig=migrar();sync();CONHECIDAS=new Set(arr('pessoas').map(p=>p.id));if(mig||mg){try{save()}catch(e){}}}catch(e){console.error('v123 pessoas boot',e)}
try{render()}catch(e){}
})();
