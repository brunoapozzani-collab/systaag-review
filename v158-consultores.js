/* =====================================================================================================
   v158 · CONSULTORES DA PIPELINE — o "a confirmar" só fica onde ainda falta resposta (Bruno, 05/11/2026)
   O que estava errado: a planilha To Do Comercial escreve o consultor pelo primeiro nome ("André", "Edson",
   "Renata", "Isabela") e a Equipe tem o nome completo ("André Peluso"…). O casamento exigia o nome idêntico,
   então 870 das 913 negociações ganhavam a etiqueta "a confirmar" — e o filtro por consultor não achava nada.
   Respostas do Bruno (05/11/2026):
     · André = André Peluso
     · AT e Dani = Pós-venda (Danielle Collato)
     · Melissa, Halef e Maria Eduarda ("Duda") = ex-consultores → etiqueta "ex-consultor", não "a confirmar"
     · Tito = Alan Tito, consultor · Felipe = consultor (tratar como da Equipe; se não for mais, sai depois)
   Como resolve um nome (nesta ordem): apelido em Base › Listas (consultor_aliases) → nome da Equipe → apelidos
   guardados na Equipe → primeiro nome, quando só UM consultor da Equipe tem esse primeiro nome. Só os nomes que
   não passam por nada disso continuam "a confirmar" (Base › Listas › Consultores a confirmar).
   Os apelidos ficam na Base (S.db.listas.consultor_aliases) — uma fonte só, editável; nada é escrito na planilha.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v158c)return;window.__v158c=true;
if(typeof S==='undefined'||!S.db)return;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const db=()=>S.db;
const L=()=>{db().listas=db().listas||{};return db().listas};
const eq=()=>(db().equipe||[]).filter(e=>e&&e.papel==='Consultor');
const first=s=>nz(s).split(' ')[0];

/* ---------- §1 as respostas do Bruno entram na Base (uma vez; editáveis depois em Base › Listas) ---------- */
function equipePorNome(nome){const k=nz(nome);return eq().find(e=>nz(e.nome)===k||nz(e.nome_completo)===k||(e.apelidos||[]).some(a=>nz(a)===k))}
function equipePorPrimeiro(nome){const k=first(nome);const xs=eq().filter(e=>first(e.nome)===k);return xs.length===1?xs[0]:null}
function nomeEquipe(alvo){const e=equipePorNome(alvo)||equipePorPrimeiro(alvo);return e?e.nome:alvo}
function pessoaPorNome(nome){const k=nz(nome);return (db().pessoas||[]).find(p=>nz(p.nome)===k||nz(p.nomeCompleto)===k||(p.apelidos||[]).some(a=>nz(a)===k))}
function garanteEquipe(nome,ativo,obs){
  if(equipePorNome(nome))return;
  const p=pessoaPorNome(nome)||(nome==='Alan Tito'?(db().pessoas||[]).find(x=>/^alan tito/.test(nz(x.nome))||/^alan tito/.test(nz(x.nomeCompleto))):null);
  db().equipe=db().equipe||[];
  db().equipe.push({id:'eq_v158_'+nz(nome).replace(/[^a-z0-9]+/g,'_'),nome:p?(p.nome||nome):nome,nome_completo:p?(p.nomeCompleto||p.nome):nome,
    pessoa_id:p?p.id:null,papel:'Consultor',frentes:'TAAG',aprova:false,ativo:!!ativo,apelidos:p&&nz(p.nome)!==nz(nome)?[nome]:[],
    origem:'v158 · '+obs+' (Bruno, 05/11/2026)'});
}
function migra(){
  const d=db();if(d.v158_cons==='2026-11-05')return false;
  const A=L().consultor_aliases=(L().consultor_aliases||[]).filter(a=>!(nz(a.de)==='ricardo petrenko'&&nz(a.para)==='petrenko'));
  /* ex-consultores e consultores que faltavam na Equipe */
  garanteEquipe('Melissa',false,'ex-consultora citada na planilha To Do Comercial');
  garanteEquipe('Halef',false,'ex-consultor citado na planilha To Do Comercial');
  garanteEquipe('Maria Eduarda',false,'ex-consultora citada na planilha To Do Comercial ("Duda")');
  garanteEquipe('Alan Tito',true,'consultor ("Tito" na planilha To Do Comercial)');
  garanteEquipe('Felipe',true,'consultor citado na planilha To Do Comercial');
  const set=(de,para,obs)=>{const alvo=nomeEquipe(para);const x=A.find(a=>nz(a.de)===nz(de));
    if(x){x.para=alvo;x.obs=obs}else A.push({id:'ca_v158_'+nz(de).replace(/[^a-z0-9]+/g,'_'),de,para:alvo,obs})};
  const R='resposta do Bruno 05/11/2026 · planilha To Do Comercial';
  set('André','André Peluso',R);set('Andre','André Peluso',R);
  set('Edson','Edson Freitas','primeiro nome · '+R);set('Renata','Renata Campos','primeiro nome · '+R);
  set('Isabela','Isabela Sousa','primeiro nome · '+R);set('Bela','Isabela Sousa','apelido · '+R);
  set('Petrenko','Ricardo Petrenko','sobrenome · '+R);set('Zpetrenko','Ricardo Petrenko','grafia · '+R);
  set('AT','Danielle Collato','AT = Pós-venda · '+R);set('Dani','Danielle Collato','Pós-venda · '+R);
  set('Duda','Maria Eduarda','apelido · '+R);set('Tito','Alan Tito',R);
  /* respondidos saem da lista "a confirmar" */
  L().consultor_confirmar=(L().consultor_confirmar||[]).filter(c=>!['dani','felipe','at'].includes(nz(c.nome)));
  d.v158_cons='2026-11-05';return true;
}

/* ---------- §2 o casamento de nomes (substitui o que exigia o nome idêntico) ---------- */
function canon(nome){const raw=String(nome||'').trim();if(!raw)return raw;const k=nz(raw);
  const a=(L().consultor_aliases||[]).find(x=>nz(x.de)===k);const alvo=a?a.para:raw;
  const e=equipePorNome(alvo)||(a?null:equipePorPrimeiro(alvo));if(e)return e.nome;
  const c=(L().consultor_confirmar||[]).find(x=>nz(x.nome)===nz(alvo));return c?c.nome:alvo}
const split=s=>String(s||'').split(/\s*[+\/,&]\s*|\s+e\s+/i).map(x=>x.trim()).filter(Boolean);
const naEquipe=n=>!!equipePorNome(n);
const ex=n=>{const e=equipePorNome(n);return !!(e&&e.ativo===false)};
const conf=n=>(L().consultor_confirmar||[]).some(x=>nz(x.nome)===nz(n));
window.negCons=function(n){if(!n)return [];if(typeof n==='string')n={consultor:n};
  const names=Array.from(new Set((n.consultores&&n.consultores.length?n.consultores:split(n.consultor)).map(canon).filter(Boolean)));const out=names.slice();
  if(names.some(ex))out.push('_ex');if(names.some(x=>!naEquipe(x)))out.push('_conf');return out};
window.consultorValido=function(n){return negCons(n).filter(x=>x[0]!=='_').every(x=>naEquipe(x)||conf(x))};
window.consLb=function(n){const c=negCons(n);const names=c.filter(x=>x[0]!=='_');let h=E(names.join(' + ').toUpperCase());
  if(c.indexOf('_ex')>=0)h+='<span class="af-chip af-ex" title="Ex-colaborador(a): continua na Equipe com ativo = não">ex-consultor</span>';
  if(c.indexOf('_conf')>=0)h+='<span class="af-chip af-conf" title="Nome que ninguém reconheceu na importação — Base › Listas › Consultores a confirmar">a confirmar</span>';return h};
window.V158=Object.assign(window.V158||{},{canon,
  aConfirmar:()=>{const o={};(db().negociacoes||[]).forEach(n=>{if(negCons(n).includes('_conf')){const k=n.consultor||'(vazio)';o[k]=(o[k]||0)+1}});return o}});

const mudou=T(migra,false);
if(mudou){T(()=>save_());T(()=>{if(typeof renderMain==='function')renderMain()})}
})();
