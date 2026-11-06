/* v155 · LIXEIRA (Bruno, 05/11/2026)
   "Não consigo apagar o que eu mesmo criei" (obra de teste "hhhh" nº 1001, "jhjjh" nº 1002, clientes, propostas, pessoas…).
   Decisões do Bruno:
   1. Todo registro principal da Base (obra, cliente, proposta, pessoa, produto, fornecedor, parceiro, negociação e os cadastros
      menores — kits, marcas, categorias, locais, veículos, contas, serviços…) ganha "🗑 Excluir": na ficha e na linha das listas
      (Base e departamentos onde o registro é aberto).
   2. O clique abre uma confirmação que diz o que está ligado ("Esta obra tem 2 propostas e 3 atividades. Tudo vai para a Lixeira
      junto.") e o que FICA porque também pertence a outro registro (o cliente que tem outras obras nunca vai junto).
   3. O registro e os dependentes vão para Base › Lixeira, um pacote por exclusão: nome, o que veio junto, quando, quem.
      [Restaurar] devolve tudo exatamente como era (mesmos ids, mesmas ligações). [Excluir definitivamente] apaga o pacote.
   4. Só quem tem a permissão "Excluir registros" (Usuários e permissões) vê e usa — ligada por padrão nos perfis de Gestor
      (Desenvolvimento e tecnologia, Diretoria, Financeiro), desligada nos outros, e pode ser dada a qualquer pessoa.
   5. Uma fonte de verdade: excluir tira o registro da Base, então toda tela (que lê a Base) deixa de mostrar; ligações de
      outros registros para ele são desligadas (e religadas no Restaurar) — nada fica apontando para o vazio.
   6. Cada exclusão / restauração / exclusão definitiva entra na Auditoria (S.db.auditoria) e no registro de eventos.
   Tudo neste arquivo; nada do index é editado.
   v161 (Bruno, 05/11, decisão final — substitui a 1ª do mesmo dia): "O único lugar onde se exclui proposta, obra, cliente é dentro
   da Base." Aqui mudaram só 4 pontos: (a) o botão 🗑 das linhas/cartões/fichas só é desenhado em telas da Base (SEC_OF='bd');
   (b) a gaveta da negociação (Pipeline) não ganha mais o botão; (c) confirmar() recusa fora da Base com "Excluir só na Base";
   (d) novo tipo que a Base passa a excluir: lançamentos do Financeiro (as propostas do Pós-venda já são propostas da Base —
   S.db.at_propostas é só uma vista de S.db.propostas com linha 'posvenda'). O resto
   (telas extras da Base, guarda das exclusões antigas do core) está em v161-lixeira.js. */
(function(){
'use strict';
if(window.__v155lx)return;window.__v155lx=true;
if(typeof S==='undefined'||!S.db)return;

const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const clone=o=>JSON.parse(JSON.stringify(o));
const N0=n=>T(()=>(+n||0).toLocaleString('pt-BR'),String(n));
const dBR=ts=>{const d=new Date(ts);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
const newId=()=>'lx_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const RED='#c62828';

/* ───────────────────────── 0 · onde mora cada coleção ───────────────────────── */
/* 'obras' = S.db.obras · 'pc.certs' = S.db.pc.certs · 'crm:contatos' = tabela do CRM (window.CRM_T, gravada na chave do CRM) */
function arr(k){try{if(k.indexOf('crm:')===0){const t=window.CRM_T;const a=t&&t[k.slice(4)];return Array.isArray(a)?a:null}
  let o=S.db;for(const p of k.split('.')){if(o==null)return null;o=o[p]}return Array.isArray(o)?o:null}catch(e){return null}}
function arrEnsure(k){let a=arr(k);if(a)return a;try{if(k.indexOf('crm:')===0){if(!window.CRM_T)return null;window.CRM_T[k.slice(4)]=[];return window.CRM_T[k.slice(4)]}
  const ps=k.split('.');let o=S.db;for(let i=0;i<ps.length-1;i++){if(o[ps[i]]==null||typeof o[ps[i]]!=='object')o[ps[i]]={};o=o[ps[i]]}o[ps[ps.length-1]]=[];return o[ps[ps.length-1]]}catch(e){return null}}
const gp=(o,path)=>{let v=o;for(const p of path.split('.')){if(v==null)return undefined;v=v[p]}return v};
const sp=(o,path,val)=>{const ps=path.split('.');let v=o;for(let i=0;i<ps.length-1;i++){if(v[ps[i]]==null||typeof v[ps[i]]!=='object')v[ps[i]]={};v=v[ps[i]]}v[ps[ps.length-1]]=val};
/* indexOf próprio: S.db.obras tem um indexOf trocado (devolve o nº da obra − 1001) — aqui sempre o nativo */
const ix=(a,r)=>Array.prototype.indexOf.call(a,r);
const find=(col,id)=>{const a=arr(col);return a?a.find(r=>r&&r.id===id)||null:null};

/* ───────────────────────── 1 · os tipos ───────────────────────── */
const TIPO={
  obras:{s:'obra',p:'obras',g:'a',i:'bi-building',n:o=>(o.nome||o.id)+(o.numero?' · nº '+o.numero:'')},
  propostas:{s:'proposta',p:'propostas',g:'a',i:'bi-file-earmark-text',n:p=>'#'+(p.numero||p.id)+(p.nome?' '+p.nome:'')},
  clientes:{s:'cliente',p:'clientes',g:'o',i:'bi-person-vcard',n:c=>(c.sigla?c.sigla+' — ':'')+(c.nome||c.id)},
  negociacoes:{s:'negociação',p:'negociações',g:'a',i:'bi-kanban',n:x=>(x.cliente_nome||x.codinome||x.id)+(x.etapa?' · '+x.etapa:'')},
  pessoas:{s:'pessoa',p:'pessoas',g:'a',i:'bi-person',n:x=>x.nomeCompleto||x.nome||x.id},
  produtos:{s:'produto',p:'produtos',g:'o',i:'bi-box-seam',n:x=>x.nome||x.id},
  fornecedores:{s:'fornecedor',p:'fornecedores',g:'o',i:'bi-truck',n:x=>x.nome||x.id},
  parceiros:{s:'parceiro',p:'parceiros',g:'o',i:'bi-people',n:x=>x.nome||x.id},
  kits:{s:'kit',p:'kits',g:'o',i:'bi-boxes',n:x=>x.nome||x.id},
  marcas:{s:'marca',p:'marcas',g:'a',i:'bi-tag',n:x=>x.nome||x.id},
  categorias:{s:'categoria',p:'categorias',g:'a',i:'bi-collection',n:x=>x.nome||x.id},
  locais:{s:'local do estoque',p:'locais do estoque',g:'o',i:'bi-geo-alt',n:x=>(x.sigla?x.sigla+' · ':'')+(x.nome||x.id)},
  veiculos:{s:'veículo',p:'veículos',g:'o',i:'bi-car-front',n:x=>(x.nome||x.modelo||x.id)+(x.placa?' · '+x.placa:'')},
  contas:{s:'conta bancária',p:'contas bancárias',g:'a',i:'bi-bank',n:x=>x.apelido||x.nome||x.id},
  catserv:{s:'serviço',p:'serviços',g:'o',i:'bi-tools',n:x=>x.nome||x.id},
  receitas:{s:'receita de serviço',p:'receitas de serviço',g:'a',i:'bi-tools',n:x=>x.nome||x.id},
  plataformas:{s:'plataforma',p:'plataformas',g:'a',i:'bi-cpu',n:x=>x.nome||x.id},
  kpmarcas:{s:'marca de keypad',p:'marcas de keypad',g:'a',i:'bi-grid-3x3',n:x=>x.nome||x.id},
  subetapas:{s:'subetapa',p:'subetapas',g:'a',i:'bi-list-check',n:x=>x.nome||x.id},
  /* dependentes (só aparecem "junto") */
  itens:{s:'item da proposta',p:'itens da proposta',n:x=>x.nome||T(()=>find('produtos',x.produto_id).nome,'')||x.produto_id||x.id},
  unidades:{s:'unidade em estoque',p:'unidades em estoque',n:x=>x.serie||x.id},
  atividades:{s:'atividade do cronograma',p:'atividades do cronograma',n:x=>x.nome||x.item||x.id},
  relatorios:{s:'relatório de obra',p:'relatórios de obra'},pendencias:{s:'pendência',p:'pendências',n:x=>x.desc||x.id},
  drive_eventos:{s:'arquivo recebido',p:'arquivos recebidos',n:x=>x.arquivo||x.id},prj_horas:{s:'lançamento de horas',p:'lançamentos de horas'},
  apontamentos:{s:'apontamento',p:'apontamentos'},compromissos:{s:'compromisso',p:'compromissos'},os:{s:'OS',p:'OS'},
  ajustes_custo:{s:'ajuste de custo',p:'ajustes de custo'},jornadas:{s:'jornada',p:'jornadas'},lancamentos:{s:'lançamento financeiro',p:'lançamentos financeiros'},
  'fin.lancamentos':{s:'lançamento do Financeiro',p:'lançamentos do Financeiro',g:'o',i:'bi-cash-coin',n:x=>(x.descricao||x.historico||x.desc||x.nome||x.id)+(x.data?' · '+String(x.data).split('-').reverse().join('/'):'')},veiculos_usos:{s:'uso de veículo',p:'usos de veículo'},
  at_atendimentos:{s:'atendimento AT',p:'atendimentos AT'},at_relatorios:{s:'relatório AT',p:'relatórios AT'},
  bateladas:{s:'separação',p:'separações'},pedidos:{s:'pedido de compra',p:'pedidos de compra'},pedidos_alt:{s:'pedido de alteração',p:'pedidos de alteração'},
  saidas:{s:'saída do estoque',p:'saídas do estoque'},montagens:{s:'montagem',p:'montagens'},kitsobra:{s:'kit de obra',p:'kits de obra'},
  rettrocs:{s:'Ret/Troc',p:'Ret/Trocs'},consolidados:{s:'consolidado',p:'consolidados'},alertas:{s:'alerta',p:'alertas'},prevendas_diag:{s:'diagnóstico de pré-vendas',p:'diagnósticos de pré-vendas'},
  tarefas:{s:'tarefa',p:'tarefas',n:x=>x.titulo||x.id},
  folha:{s:'ficha de RH',p:'fichas de RH',n:x=>x.nome},usuarios:{s:'login',p:'logins',n:x=>x.login},equipe:{s:'lugar na equipe comercial',p:'lugares na equipe comercial',n:x=>x.nome},
  tecnicos:{s:'cadastro de técnico',p:'cadastros de técnico',n:x=>x.nome},programadores:{s:'cadastro de programador',p:'cadastros de programador',n:x=>x.nome},at_usuarios:{s:'usuário do Pós-venda',p:'usuários do Pós-venda',n:x=>x.name||x.email},
  'pc.certs':{s:'certificado',p:'certificados'},'pc.onboard':{s:'onboarding',p:'onboardings'},'pc.avaliacoes':{s:'avaliação',p:'avaliações'},'fac.emprestimos':{s:'empréstimo de ativo',p:'empréstimos de ativo'},
  'listas.login_pessoa':{s:'vínculo login → pessoa',p:'vínculos login → pessoa'},'cop_config.agendaGoogle.ausencias':{s:'ausência na agenda',p:'ausências na agenda'},
  pessoas_mescladas:{s:'cadastro já unido a ela',p:'cadastros já unidos a ela',n:x=>x.nome},
  'crm:contatos':{s:'contato do CRM',p:'contatos do CRM',n:x=>x.nome},'crm:interacoes':{s:'interação do CRM',p:'interações do CRM',n:x=>(x.data||'')+' '+(x.tipo_contato||'')},
  'crm:tarefas':{s:'próxima ação do CRM',p:'próximas ações do CRM',n:x=>x.sugestao||x.descricao},'crm:justificativas':{s:'justificativa do CRM',p:'justificativas do CRM'},
  'crm:esteira':{s:'passo da esteira',p:'passos da esteira'},'crm:depara':{s:'vínculo De/Para',p:'vínculos De/Para',n:x=>x.nome_pipeline},'crm:responsaveis':{s:'responsável no CRM',p:'responsáveis no CRM',n:x=>x.nome}
};
const tipo=k=>TIPO[k]||{s:k,p:k};
const nomeDe=(col,r)=>{if(!r)return '';const t=tipo(col);return String(T(()=>t.n?t.n(r):(r.nome||r.titulo||r.id),'')||r.id||'')};
const qt=(n,col)=>N0(n)+' '+(n===1?tipo(col).s:tipo(col).p);
/* o que pode ser raiz de uma exclusão (ganha o botão) */
const ROOTS=['fin.lancamentos','obras','propostas','clientes','negociacoes','pessoas','produtos','fornecedores','parceiros','kits','marcas','categorias','locais','veiculos','contas','catserv','receitas','plataformas','kpmarcas','subetapas'];

/* ───────────────────────── 2 · permissão "Excluir registros" ───────────────────────── */
const GESTOR_PERFIS=['ti','diretoria','financeiro'];     /* os perfis cujo papel é Gestor (UQ.form: ti/diretoria/financeiro → gestor) */
const meU=()=>T(()=>me(),null)||T(()=>S.db.usuarios.find(u=>u.login===(S.user||'bruno.pozzani')),null);
const usr=l=>T(()=>S.db.usuarios.find(u=>u.login===l),null);
const perfilA=id=>T(()=>(S.db.perfisAcesso||[]).find(p=>p.id===id),null);
function seedPerm(){try{const st=S.db._v155=S.db._v155||{};if(st.perm)return;st.perm=1;
  (S.db.perfisAcesso||[]).forEach(p=>{p.regra=p.regra||{dep:{},tela:{}};p.regra.acoes=p.regra.acoes||{};if(typeof p.regra.acoes.excluir!=='boolean')p.regra.acoes.excluir=GESTOR_PERFIS.includes(p.id)});
  try{save()}catch(e){}}catch(e){console.error('v155 perm',e)}}
function podeExcluir(login){const u=login?usr(login):meU();if(!u||u.ativo===false)return false;
  if(u.acoes&&typeof u.acoes.excluir==='boolean')return u.acoes.excluir;
  const p=perfilA(u.perfil);if(p&&p.regra&&p.regra.acoes&&typeof p.regra.acoes.excluir==='boolean')return p.regra.acoes.excluir;
  return u.papel==='gestor'}
const podeGerirPerm=()=>{const u=meU();return !!u&&(u.perfil==='ti'||u.perfil==='diretoria')};
const NEGADO='Excluir registros é uma permissão de Gestor — peça em Pessoas & Cultura › Usuários e permissões.';

/* ───────────────────────── 3 · o grafo: o que vai junto, o que é desligado, o que fica ───────────────────────── */
/* own(c,pred)  → vai para a Lixeira junto (é deste registro)
   set(c,path)  → outro registro aponta para ele: o campo é esvaziado (e volta no Restaurar)
   del(c,path)  → outro registro tem o id numa lista: o id sai da lista (e volta)
   dob(c,path,pred) → outro registro tem um objeto na lista que é dele: o objeto sai (e volta)
   bloq(texto)  → não pode ir para a Lixeira enquanto isso existir */
const RULES={
  obras(x,o){const id=o.id;
    x.own('propostas',p=>p.obra_id===id);
    ['atividades','relatorios','pendencias','drive_eventos','prj_horas','apontamentos','compromissos','os','ajustes_custo','jornadas','lancamentos','fin.lancamentos','veiculos_usos','at_atendimentos','at_relatorios'].forEach(c=>x.own(c,r=>r.obra_id===id));
    x.own('obras',r=>r.merged_into===id);
    x.set('unidades','obra_id',id);
    x.dob('jornadas','visitas',v=>v&&v.obraId===id)},
  propostas(x,p){const id=p.id;
    ['itens','bateladas','pedidos','pedidos_alt','saidas','montagens','kitsobra','rettrocs','consolidados','alertas','prevendas_diag','fin.lancamentos','at_atendimentos'].forEach(c=>x.own(c,r=>r.proposta_id===id));
    x.own('lancamentos',l=>l.proposta_id===id||(l.origem==='proposta'&&l.origem_id===id));
    x.set('unidades','proposta_id',id);
    x.del('negociacoes','proposta_ids',id);
    if(p.vendida_em||['vendida','em_obra','entregue','concluida'].includes(p.estado))x.aviso('A proposta '+E('#'+(p.numero||p.id))+' está <b>vendida</b> — os títulos e lançamentos dela vão junto para a Lixeira (e voltam no Restaurar).')},
  clientes(x,c){const id=c.id;
    x.own('obras',o=>o.cliente_id===id);
    const unica=c.sigla&&(S.db.clientes||[]).filter(k=>k.sigla===c.sigla).length===1;
    x.own('propostas',p=>p.cliente_id===id||p.cliente_ref===id||(unica&&!p.cliente_id&&!p.cliente_ref&&p.sigla===c.sigla));
    x.own('negociacoes',n=>n.cliente_id===id)},
  negociacoes(x,n){x.own('tarefas',t=>t.negociacao_id===n.id)},
  pessoas(x,p){const id=p.id;
    const eu=meU();if(eu&&eu.pessoa_id===id)x.bloq('Esta é a sua própria pessoa (login <b>'+E(eu.login)+'</b>) — ninguém exclui a si mesmo.');
    ['folha','equipe','usuarios','tecnicos','programadores','at_usuarios','jornadas','pc.certs','pc.onboard','pc.avaliacoes','fac.emprestimos','listas.login_pessoa','crm:responsaveis'].forEach(c=>x.own(c,r=>r.pessoa_id===id));
    x.own('pessoas_mescladas',r=>r.merged_into===id);
    x.own('cop_config.agendaGoogle.ausencias',r=>r.funcionarioId===id);
    x.set('obras','gerente_id',id);x.set('obras','fases.entrega.responsavelId',id);
    ['comercial_ids','respObra_ids','respProjetos_ids'].forEach(f=>x.del('obras',f,id));
    x.del('propostas','consultor_ids',id);
    x.set('atividades','responsavel_id',id);x.set('veiculos','responsavel_id',id);x.set('fac.ativos','responsavel_id',id);x.set('fac.chaves','com',id);
    x.set('cop_config.organograma.departamentos','responsavelId',id);x.set('cop_config.organograma.funcoes','responsavelId',id);
    x.own('cop_config.organograma.diretores',r=>r.id===id)},
  produtos(x,p){const id=p.id;
    const its=(S.db.itens||[]).filter(i=>i.produto_id===id&&!x.has(i));
    if(its.length){const ps=[...new Set(its.map(i=>i.proposta_id))].map(pid=>find('propostas',pid)).filter(Boolean);
      x.bloq('Está em '+qt(its.length,'itens')+' de '+N0(ps.length)+' proposta(s)'+(ps.length?' ('+ps.slice(0,4).map(q=>E('#'+(q.numero||q.id))).join(', ')+(ps.length>4?'…':'')+')':'')+' — tire o produto dessas propostas antes (ou exclua as propostas).')}
    x.own('unidades',u=>u.produto_id===id);
    x.dob('kits','itens',it=>it&&it.produto_id===id)},
  fornecedores(x,f){const id=f.id,nm=f.nome;
    const ped=[...(S.db.pedidos||[]),...(S.db.entradas||[]),...(S.db.orcamentos||[])].filter(r=>r&&(r.fornecedor_id===id||(nm&&r.fornecedor===nm)));
    if(ped.length)x.bloq('Tem '+N0(ped.length)+' pedido(s)/entrada(s) de compra registrados — o histórico de compras não pode perder o fornecedor.');
    x.set('produtos','fornecedor_id',id);if(nm){x.set('produtos','fornecedor',nm,'');x.set('marcas','fornecedor',nm,'')}},
  parceiros(x,p){const id=p.id;
    if(p.crm_id!=null&&p.crm_id!=='')['contatos','interacoes','tarefas','justificativas','esteira','depara'].forEach(t=>x.own('crm:'+t,r=>r.parceiro_id!=null&&r.parceiro_id!==''&&+r.parceiro_id===+p.crm_id));
    x.own('parceiros',q=>q.merged_into===id);
    x.set('clientes','arquiteto_id',id);x.dob('clientes','parceiros',q=>q&&q.id===id);
    ['indicador','arquitetura','gerenciadora'].forEach(k=>x.set('negociacoes','parceiros.'+k,id,''));
    ['arquitetura_id','engenharia_id','gerenciadora_id','luminotecnico_id'].forEach(f=>x.set('obras',f,id))},
  veiculos(x,v){x.own('veiculos_usos',r=>r.veiculo_id===v.id)},
  marcas(x,m){const n=(S.db.produtos||[]).filter(p=>p.marca_id===m.id||(m.nome&&!p.marca_id&&p.marca===m.nome)).length;if(n)x.bloq(N0(n)+' produto(s) do catálogo são desta marca — troque a marca deles antes.')},
  kpmarcas(x,m){const n=(S.db.marcas||[]).filter(r=>r.kp_id===m.id).length;if(n)x.bloq(N0(n)+' marca(s) usam esta marca de keypad.')},
  categorias(x,c){const n=(S.db.produtos||[]).filter(p=>p.categoria===c.nome).length;if(n)x.bloq(N0(n)+' produto(s) estão nesta categoria — troque a categoria deles antes.')},
  locais(x,l){const u=(S.db.unidades||[]).filter(r=>r.loc_id===l.id).length,f=(S.db.locais||[]).filter(r=>r.pai===l.id).length;
    if(u)x.bloq(N0(u)+' unidade(s) do estoque estão neste local — mova-as antes.');if(f)x.bloq('Tem '+N0(f)+' local(is) dentro dele — exclua ou mova esses antes.')},
  contas(x,c){const n=(S.db.lancamentos||[]).filter(l=>l.conta_id===c.id).length+T(()=>(S.db.fin.lancamentos||[]).filter(l=>l.conta_id===c.id).length,0);
    if(n)x.bloq(N0(n)+' lançamento(s) estão nesta conta.');if(T(()=>S.db.caixa.padrao===c.id,false)||T(()=>S.db.fin.params.conta_padrao===c.id,false))x.bloq('É a conta padrão do caixa — escolha outra conta padrão antes.')},
  receitas(x,r){const n=(S.db.produtos||[]).filter(p=>p.receita_id===r.id).length;if(n)x.bloq(N0(n)+' produto(s) usam esta receita de serviço.')},
  'fin.lancamentos'(x,l){if(String(l.id).indexOf('erp:')===0||l.fonte==='erp')x.bloq('Este lançamento vem do ERP (venda/compra) — ele some sozinho quando a origem muda.')},
  kits(){},catserv(){},plataformas(){},subetapas(){}
};
/* rede de segurança: qualquer campo de ligação (…_id, …_ids, …Id, merged_into) que ainda aponte para um id que sai, em qualquer tabela da Base,
   é desligado — o nome do campo precisa combinar com o tipo do registro (evita confundir ids iguais de tabelas diferentes) */
const HINT={obras:/obra/i,propostas:/propost/i,clientes:/client/i,negociacoes:/negoci|deal/i,pessoas:/pessoa|respons|gerente|consultor|funcionario|tecnico|programador|lider/i,produtos:/produt/i,fornecedores:/fornec/i,parceiros:/parceir|arquitet|gerenciad|indicador|engenhar|luminot/i,veiculos:/veicul/i,kits:/kit/i,marcas:/marca/i,locais:/^loc|local/i,contas:/conta/i,receitas:/receita/i};
const REFF=/(_id|_ids|_ref|Id|Ids)$|^merged_into$/;
const SKIP=/^(auditoria|cop_auditoria|lixeira|eventos|_.*|v1\d\d.*|af1\d\d.*|demo124|pessoas_mescladas|mensagens)$/;

function plano(col,id,extra){
  const x={root:null,own:[],seen:new Set(),patches:[],bloqs:[],avisos:[],pk:new Set()};
  const seenIds={};const markId=(c,r)=>{if(r&&r.id!=null)(seenIds[c]=seenIds[c]||new Set()).add(r.id)};
  const api={
    has:r=>x.seen.has(r),
    own(c,pred){const a=arr(c);if(!a)return;a.slice().forEach(r=>{if(r&&!x.seen.has(r)&&T(()=>pred(r),false))take(c,r)})},
    set(c,path,val,vazio){x.pk.add(JSON.stringify(['set',c,path,val]));x._p=x._p||[];x._p.push({kind:'set',c,path,val,vazio:vazio===undefined?null:vazio})},
    del(c,path,val){x._p=x._p||[];x._p.push({kind:'del',c,path,val})},
    dob(c,path,pred){x._p=x._p||[];x._p.push({kind:'dob',c,path,pred})},
    bloq(t){x.bloqs.push(t)},aviso(t){x.avisos.push(t)}};
  function take(c,r){if(x.seen.has(r))return;x.seen.add(r);x.own.push({c,r});markId(c,r);const f=RULES[c];if(f)T(()=>f(api,r),null)}
  const rec=find(col,id);if(!rec)return null;
  x.root={c:col,id,r:rec,nome:nomeDe(col,rec)};take(col,rec);
  (extra||[]).forEach(([c,i])=>{const r=find(c,i);if(r)take(c,r)});
  /* ligações de fora para dentro → patches (só em registros que FICAM) */
  (x._p||[]).forEach(p=>{const a=arr(p.c);if(!a)return;a.forEach((r,idx)=>{if(!r||x.seen.has(r))return;
    if(p.kind==='set'){if(gp(r,p.path)===p.val)x.patches.push({kind:'set',c:p.c,r,idx,path:p.path,antes:p.val,depois:p.vazio})}
    else if(p.kind==='del'){const v=gp(r,p.path);if(Array.isArray(v)){const i=ix(v,p.val);if(i>=0)x.patches.push({kind:'del',c:p.c,r,idx,path:p.path,antes:p.val,pos:i})}}
    else if(p.kind==='dob'){const v=gp(r,p.path);if(Array.isArray(v))v.forEach((o,i)=>{if(T(()=>p.pred(o),false))x.patches.push({kind:'dob',c:p.c,r,idx,path:p.path,antes:clone(o),pos:i,obj:o})})}})});
  /* rede de segurança */
  const ids=new Map();Object.keys(seenIds).forEach(c=>{if(!HINT[c])return;seenIds[c].forEach(i=>{if(i!=null&&String(i).length>=2)ids.set(String(i),c)})});
  const ja=new Set(x.patches.map(p=>p.c+'|'+p.idx+'|'+p.path+'|'+p.antes));
  Object.keys(S.db).forEach(k=>{if(SKIP.test(k))return;const a=S.db[k];if(!Array.isArray(a))return;a.forEach((r,idx)=>{if(!r||typeof r!=='object'||x.seen.has(r))return;
    for(const f in r){if(!REFF.test(f)||f==='id')continue;const v=r[f];
      if(typeof v==='string'||typeof v==='number'){const c=ids.get(String(v));if(c&&HINT[c].test(f)&&!ja.has(k+'|'+idx+'|'+f+'|'+v)){x.patches.push({kind:'set',c:k,r,idx,path:f,antes:v,depois:null,rede:1});ja.add(k+'|'+idx+'|'+f+'|'+v)}}
      else if(Array.isArray(v))v.forEach((e,i)=>{if(typeof e!=='string')return;const c=ids.get(e);if(c&&HINT[c].test(f)&&!ja.has(k+'|'+idx+'|'+f+'|'+e)){x.patches.push({kind:'del',c:k,r,idx,path:f,antes:e,pos:i,rede:1});ja.add(k+'|'+idx+'|'+f+'|'+e)}})}})});
  return x}

/* o que FICA: pais e vizinhos que não vão junto (o cliente que tem outras obras, a obra que tem outras propostas…) */
function fica(x){const out=[],opc=[];const seen=x.seen;const dentro=(c,id)=>x.own.some(o=>o.c===c&&o.r.id===id);
  const fora=(c,pred)=>(arr(c)||[]).filter(r=>!seen.has(r)&&T(()=>pred(r),false));
  const clis=new Set(),obs=new Set();
  x.own.forEach(({c,r})=>{if(c==='obras'&&r.cliente_id&&!dentro('clientes',r.cliente_id))clis.add(r.cliente_id);
    if(c==='propostas'){if(r.obra_id&&!dentro('obras',r.obra_id))obs.add(r.obra_id);const cid=r.cliente_id||r.cliente_ref||T(()=>((find('obras',r.obra_id)||{}).cliente_id),null);if(cid&&!dentro('clientes',cid))clis.add(cid)}
    if(c==='negociacoes'&&r.cliente_id&&!dentro('clientes',r.cliente_id))clis.add(r.cliente_id)});
  obs.forEach(oid=>{const o=find('obras',oid);if(!o)return;const n=fora('propostas',p=>p.obra_id===oid).length;out.push('Obra <b>'+E(nomeDe('obras',o))+'</b> fica'+(n?' (tem mais '+qt(n,'propostas')+')':'')+'.')});
  clis.forEach(cid=>{const c=find('clientes',cid);if(!c)return;const no=fora('obras',o=>o.cliente_id===cid).length,np=fora('propostas',p=>p.cliente_id===cid).length,nn=fora('negociacoes',n=>n.cliente_id===cid).length;
    const usos=[no?qt(no,'obras'):'',np?qt(np,'propostas'):'',nn?qt(nn,'negociacoes'):''].filter(Boolean);
    if(usos.length)out.push('Cliente <b>'+E(nomeDe('clientes',c))+'</b> fica (usado por outras: '+usos.join(', ')+').');
    else{out.push('Cliente <b>'+E(nomeDe('clientes',c))+'</b> fica.');opc.push({c:'clientes',id:cid,label:'Levar também o cliente <b>'+E(nomeDe('clientes',c))+'</b> — ele não tem outras obras, propostas nem negociações.'})}});
  const r=x.root;
  if(r.c==='negociacoes'){const ps=(r.r.proposta_ids||[]).map(i=>find('propostas',i)).filter(p=>p&&!seen.has(p));if(ps.length)out.push(qt(ps.length,'propostas').replace(/^(\d+)/,'$1')+' ficam — moram na obra ('+ps.slice(0,3).map(p=>E('#'+(p.numero||p.id))).join(', ')+').')}
  if(r.c==='obras'||r.c==='propostas'||r.c==='clientes'){if(x.own.some(o=>o.c==='obras'&&(o.r.gerente_id||(o.r.respProjetos_ids||[]).length))||x.own.some(o=>o.c==='clientes'&&o.r.arquiteto_id))out.push('Pessoas da equipe e parceiros (arquitetura, gerenciadora) ficam — só a ligação com '+(r.c==='clientes'?'este cliente':'esta '+tipo(r.c).s)+' sai.')}
  return {out,opc}}

/* frase de resumo: "2 propostas e 3 atividades" */
function grupos(x,semRaiz){const g={};x.own.forEach((o,i)=>{if(semRaiz&&i===0)return;(g[o.c]=g[o.c]||[]).push(o.r)});return g}
function frase(g){const ks=Object.keys(g);if(!ks.length)return '';const ps=ks.map(k=>qt(g[k].length,k));return ps.length===1?ps[0]:ps.slice(0,-1).join(', ')+' e '+ps[ps.length-1]}
function patchResumo(ps){const g={};ps.forEach(p=>{const k=p.c;g[k]=g[k]||new Set();g[k].add(p.idx)});return Object.keys(g).map(k=>qt(g[k].size,k))}

/* ───────────────────────── 4 · mover para a Lixeira ───────────────────────── */
function lix(){if(!Array.isArray(S.db.lixeira))S.db.lixeira=[];return S.db.lixeira}
function loc(c,r,idx){return r&&r.id!=null?{id:r.id}:(r&&r.k!=null?{k:r.k}:{idx})}
function acha(c,l){const a=arr(c);if(!a)return null;if(l.id!=null)return a.find(r=>r&&r.id===l.id)||null;if(l.k!=null)return a.find(r=>r&&r.k===l.k)||null;return a[l.idx]||null}
function auditar(acao,col,id,rot,dep){try{if(typeof audit90==='function')audit90(acao,tipo(col).s,id,rot,'Lixeira','',dep||'')}catch(e){}
  try{if(typeof log==='function')log(col,id,(acao==='deleted'?'movido para a Lixeira':acao==='restored'?'restaurado da Lixeira':'excluído definitivamente')+(dep?' — '+dep:''))}catch(e){}}
function gravar(){try{S.changed&&S.changed.add&&S.changed.add('lixeira')}catch(e){}try{save()}catch(e){console.error('v155 save',e)}}
function redesenha(){try{if(typeof render==='function')render();else renderMain()}catch(e){try{renderMain()}catch(e2){}}}

function mover(x){
  if(!podeExcluir())throw new Error(NEGADO);
  if(x.bloqs.length)throw new Error('Não dá para excluir: '+x.bloqs.join(' '));
  const itens=[];let crm=false;
  x.own.forEach(({c,r})=>{const a=arr(c);const idx=a?ix(a,r):-1;if(idx<0)return;itens.push({c,idx,rec:clone(r)});if(c.indexOf('crm:')===0)crm=true});
  const patches=x.patches.map(p=>{const out={kind:p.kind,c:p.c,loc:loc(p.c,p.r,p.idx),path:p.path,antes:p.antes,rede:p.rede||0};
    if(p.kind==='set'){out.depois=p.depois;sp(p.r,p.path,p.depois)}
    else if(p.kind==='del'){out.pos=p.pos;const v=gp(p.r,p.path);const i=ix(v,p.antes);if(i>=0)v.splice(i,1)}
    else if(p.kind==='dob'){out.pos=p.pos;const v=gp(p.r,p.path);const i=ix(v,p.obj);if(i>=0)v.splice(i,1)}
    return out});
  /* tira da Base (do fim para o começo, para os índices guardados continuarem certos) */
  const porCol={};itens.forEach(it=>{(porCol[it.c]=porCol[it.c]||[]).push(it.idx)});
  Object.keys(porCol).forEach(c=>{const a=arr(c);porCol[c].sort((m,n)=>n-m).forEach(i=>a.splice(i,1))});
  const g=grupos(x,true);const veio=Object.keys(g).map(k=>({c:k,n:g[k].length,nomes:g[k].slice(0,8).map(r=>nomeDe(k,r))}));
  const b={id:newId(),quando:Date.now(),quem:T(()=>meU().login,'?'),raiz:{c:x.root.c,id:x.root.id,nome:x.root.nome,tipo:tipo(x.root.c).s},veio,itens,patches,desligados:patchResumo(x.patches),crm};
  lix().unshift(b);
  if(crm)persistCRM();
  auditar('deleted',x.root.c,x.root.id,x.root.nome,frase(g)||'sozinho');
  gravar();return b}

/* ───────────────────────── 5 · restaurar e excluir definitivamente ───────────────────────── */
function precisaAntes(b){/* um pai que está noutro pacote da Lixeira precisa voltar primeiro */
  const noPacote=(c,id)=>b.itens.some(it=>it.c===c&&it.rec&&it.rec.id===id);const falta=[];
  const naLix=(c,id)=>lix().find(o=>o!==b&&o.itens.some(it=>it.c===c&&it.rec&&it.rec.id===id));
  b.itens.forEach(({c,rec})=>{const pais=c==='obras'?[['clientes',rec.cliente_id]]:c==='propostas'?[['obras',rec.obra_id],['clientes',rec.cliente_id]]:c==='negociacoes'?[['clientes',rec.cliente_id]]:[];
    pais.forEach(([pc,pid])=>{if(!pid||noPacote(pc,pid)||find(pc,pid))return;const o=naLix(pc,pid);if(o&&!falta.includes(o))falta.push(o)})});
  return falta}
function restaurar(bid){
  if(!podeExcluir())throw new Error(NEGADO);
  const L=lix();const b=L.find(o=>o.id===bid);if(!b)throw new Error('Este item não está mais na Lixeira.');
  const antes=precisaAntes(b);if(antes.length)throw new Error('Restaure antes '+antes.map(o=>'«'+o.raiz.nome+'» ('+o.raiz.tipo+')').join(', ')+' — '+(b.raiz.tipo==='proposta'?'a proposta':'este item')+' mora dentro dele(a).');
  const pulados=[];
  const porCol={};b.itens.forEach(it=>{(porCol[it.c]=porCol[it.c]||[]).push(it)});
  Object.keys(porCol).forEach(c=>{const a=arrEnsure(c);if(!a){pulados.push(c);return}porCol[c].sort((m,n)=>m.idx-n.idx).forEach(it=>{
    if(it.rec&&it.rec.id!=null&&a.some(r=>r&&r.id===it.rec.id)){pulados.push(nomeDe(c,it.rec));return}
    a.splice(Math.min(it.idx,a.length),0,it.rec)})});
  b.patches.slice().reverse().forEach(p=>{const r=acha(p.c,p.loc);if(!r)return;
    if(p.kind==='set'){const cur=gp(r,p.path);if(cur===p.depois||cur==null||cur==='')sp(r,p.path,p.antes)}
    else if(p.kind==='del'){let v=gp(r,p.path);if(!Array.isArray(v)){v=[];sp(r,p.path,v)}if(!v.includes(p.antes))v.splice(Math.min(p.pos,v.length),0,p.antes)}
    else if(p.kind==='dob'){let v=gp(r,p.path);if(!Array.isArray(v)){v=[];sp(r,p.path,v)}const oid=p.antes&&p.antes.id;if(!(oid!=null&&v.some(o=>o&&o.id===oid)))v.splice(Math.min(p.pos,v.length),0,p.antes)}});
  S.db.lixeira=L.filter(o=>o!==b);
  if(b.crm)persistCRM();
  auditar('restored',b.raiz.c,b.raiz.id,b.raiz.nome,(b.veio||[]).map(v=>qt(v.n,v.c)).join(', '));
  gravar();return {b,pulados}}
function purgar(bid){
  if(!podeExcluir())throw new Error(NEGADO);
  const L=lix();const b=L.find(o=>o.id===bid);if(!b)return null;
  const mortos=(S.db._v155=S.db._v155||{}).mortos=S.db._v155.mortos||{};b.itens.forEach(it=>{if(it.rec&&it.rec.id!=null&&ROOTS.includes(it.c)){(mortos[it.c]=mortos[it.c]||[]);if(!mortos[it.c].includes(it.rec.id))mortos[it.c].push(it.rec.id)}});
  S.db.lixeira=L.filter(o=>o!==b);auditar('purged',b.raiz.c,b.raiz.id,b.raiz.nome,'');gravar();return b}
/* o que está na Lixeira não volta sozinho: se uma carga/semente da abertura recolocar um registro que está na Lixeira (ou foi excluído
   definitivamente), ele sai de novo — a Lixeira manda */
function semRessuscitar(){try{const L=S.db.lixeira;const mortos=T(()=>S.db._v155.mortos,{})||{};let n=0;
  const tira=(c,id)=>{const a=arr(c);if(!a)return;for(let i=a.length-1;i>=0;i--)if(a[i]&&a[i].id===id){a.splice(i,1);n++}};
  (L||[]).forEach(b=>b.itens.forEach(it=>{if(it.rec&&it.rec.id!=null&&ROOTS.includes(it.c))tira(it.c,it.rec.id)}));
  Object.keys(mortos).forEach(c=>(mortos[c]||[]).forEach(id=>tira(c,id)));
  if(n){gravar();console.info('v155: '+n+' registro(s) da Lixeira tinham voltado na abertura — tirados de novo')}}catch(e){console.error('v155 ressuscitar',e)}}

/* ───────────────────────── 6 · a confirmação ───────────────────────── */
const CSS=`<style id="v155-lx-css">
#v155-ov{position:fixed;inset:0;z-index:100050;background:rgba(20,20,24,.42);display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#v155-dlg{background:var(--card,#fff);color:inherit;border-radius:18px;width:min(560px,96vw);max-height:90vh;overflow:auto;box-shadow:0 24px 70px rgba(0,0,0,.35);padding:22px 22px 16px}
#v155-dlg .ico{width:46px;height:46px;border-radius:14px;background:rgba(198,40,40,.1);color:${RED};display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:10px}
#v155-dlg h5{font-weight:700;margin:0 0 4px;font-size:18px}#v155-dlg .lead{font-size:14.5px;margin:0 0 12px}
#v155-dlg .sec{border-radius:12px;padding:10px 12px;margin-bottom:8px;font-size:13px;background:rgba(127,127,127,.07)}
#v155-dlg .sec b.t{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-bottom:4px}
#v155-dlg .sec.go{background:rgba(198,40,40,.06)}#v155-dlg .sec.stay{background:rgba(25,135,84,.07)}#v155-dlg .sec.bl{background:rgba(198,40,40,.12);color:${RED}}
#v155-dlg ul{margin:0;padding-left:18px}#v155-dlg li{margin:2px 0}
#v155-dlg .acts{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
#v155-dlg .btn-x{border:0;border-radius:10px;padding:9px 16px;font-weight:600;font-size:14px;cursor:pointer}
#v155-dlg .btn-c{background:rgba(127,127,127,.14);color:inherit}#v155-dlg .btn-d{background:${RED};color:#fff}#v155-dlg .btn-d[disabled]{opacity:.4;cursor:not-allowed}
#v155-dlg .nota{font-size:12px;opacity:.7;margin-top:8px}
.v155-tr{border:0;background:transparent;color:${RED};opacity:.55;padding:2px 6px;border-radius:8px;cursor:pointer;font-size:13px;line-height:1}
.v155-tr:hover{opacity:1;background:rgba(198,40,40,.1)}
.v155-hd{color:${RED}!important}
.v155-card{position:relative}.v155-card .v155-tr{position:absolute;right:4px;bottom:4px}
.v155-lx{display:flex!important;flex-direction:row!important;gap:14px;align-items:flex-start;padding:14px 16px;border-radius:16px;margin-bottom:10px}
.v155-lx .ic{width:44px;height:44px;flex:0 0 44px;border-radius:12px;background:rgba(127,127,127,.12);display:flex;align-items:center;justify-content:center;font-size:20px}
.v155-lx .nm{font-weight:700;font-size:15px}.v155-lx .chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.v155-lx .chips span{font-size:11.5px;background:rgba(127,127,127,.12);border-radius:20px;padding:2px 9px}
.v155-lx .bt{display:flex;flex-direction:column;gap:6px;margin-left:auto;flex:0 0 auto;align-self:center}
.v155-big{font-size:40px;font-weight:800;line-height:1}
</style>`;
function css(){if(!document.getElementById('v155-lx-css'))document.head.insertAdjacentHTML('beforeend',CSS)}
function fechar(){const o=document.getElementById('v155-ov');if(o)o.remove()}
function lista(rs,col,max){max=max||5;const ns=rs.slice(0,max).map(r=>'<li>'+E(nomeDe(col,r))+'</li>').join('');return ns+(rs.length>max?'<li class="sub">… e mais '+N0(rs.length-max)+'</li>':'')}

/* v161 · excluir só na Base */
const naBaseK=k=>{try{return !!k&&typeof SEC_OF!=='undefined'&&SEC_OF[k]==='bd'}catch(e){return false}};
const naBase=()=>{try{return naBaseK(route().k)}catch(e){return false}};
const ONDE_BASE={obras:'Clientes · Obras · Propostas',propostas:'Clientes · Obras · Propostas',clientes:'Clientes · Obras · Propostas',negociacoes:'Negociações',pessoas:'Pessoas',produtos:'Produtos',parceiros:'Parceiros',fornecedores:'Fornecedores','fin.lancamentos':'Lançamentos financeiros',locais:'Locais',catserv:'Serviços & diárias'};
const SO_BASE=col=>'Excluir só na Base — abra <b>Base de dados › '+E(ONDE_BASE[col]||'a lista do cadastro')+'</b>.';
function confirmar(col,id,extraSel){
  if(!naBase()){try{toast(SO_BASE(col),true)}catch(e){}return}
  try{css();
    if(!podeExcluir()){toast(NEGADO,true);return}
    const x=plano(col,id,extraSel);if(!x){toast('Registro não encontrado — talvez já esteja na Lixeira.',true);return}
    const t=tipo(col);const g=grupos(x,true);const fr=frase(g);const fc=fica(x);
    const des=patchResumo(x.patches);
    const art=t.g==='a'?'Esta':'Este';
    const lead=x.bloqs.length?'':(fr?`${art} ${E(t.s)} tem ${fr}. <b>Tudo vai para a Lixeira junto.</b>`:`${art} ${E(t.s)} vai sozinh${t.g==='a'?'a':'o'} para a Lixeira — nada mais está ligado a ${t.g==='a'?'ela':'ele'}.`);
    let h=`<div class="ico"><i class="bi bi-trash3"></i></div><h5>Excluir ${E(t.s)} «${E(x.root.nome)}»?</h5><p class="lead">${lead}</p>`;
    if(x.bloqs.length)h+=`<div class="sec bl"><b class="t">Não dá para excluir agora</b><ul>${x.bloqs.map(b=>'<li>'+b+'</li>').join('')}</ul></div>`;
    if(fr)h+=`<div class="sec go"><b class="t">Vai para a Lixeira junto</b><ul>${Object.keys(g).map(k=>`<li><b>${qt(g[k].length,k)}</b>${g[k].length<=5?': '+g[k].map(r=>E(nomeDe(k,r))).filter(Boolean).join(' · '):''}</li>`).join('')}</ul></div>`;
    if(fc.out.length)h+=`<div class="sec stay"><b class="t">Fica (usado por outros registros)</b><ul>${fc.out.map(s=>'<li>'+s+'</li>').join('')}</ul></div>`;
    if(des.length)h+=`<div class="sec"><b class="t">Ligação desfeita (volta ao restaurar)</b>${des.join(', ')} deixa${des.length>1?'m':''} de apontar para o que sai.</div>`;
    if(x.avisos.length)h+=`<div class="sec"><ul>${x.avisos.map(a=>'<li>'+a+'</li>').join('')}</ul></div>`;
    if(fc.opc.length&&!x.bloqs.length)h+=fc.opc.map((o,i)=>`<label class="sec d-flex gap-2 align-items-start" style="cursor:pointer"><input type="checkbox" class="v155-opc" data-c="${E(o.c)}" data-id="${E(o.id)}" ${(extraSel||[]).some(e=>e[1]===o.id)?'checked':''} style="margin-top:3px"> <span>${o.label}</span></label>`).join('');
    h+=`<div class="acts"><button class="btn-x btn-c" id="v155-no">Cancelar</button><button class="btn-x btn-d" id="v155-ok" ${x.bloqs.length?'disabled':''}><i class="bi bi-trash3 me-1"></i>Mover para a Lixeira</button></div>
      <div class="nota">Nada é apagado de vez: tudo fica em <b>Base › Lixeira</b> e volta exatamente como era com <b>Restaurar</b>.</div>`;
    fechar();const ov=document.createElement('div');ov.id='v155-ov';ov.innerHTML=`<div id="v155-dlg" role="dialog" aria-modal="true">${h}</div>`;document.body.appendChild(ov);
    ov.addEventListener('click',e=>{if(e.target===ov)fechar()});
    ov.querySelector('#v155-no').onclick=fechar;
    ov.querySelectorAll('.v155-opc').forEach(cb=>cb.onchange=()=>{const sel=[...ov.querySelectorAll('.v155-opc:checked')].map(c=>[c.dataset.c,c.dataset.id]);confirmar(col,id,sel)});
    ov.querySelector('#v155-ok').onclick=()=>{try{const b=mover(x);fechar();toast(`«${E(b.raiz.nome)}» foi para a Lixeira${b.veio.length?' com '+b.veio.map(v=>qt(v.n,v.c)).join(', '):''}. <a href="#/dblixeira" style="color:inherit;text-decoration:underline">Abrir a Lixeira</a>`);
      depois(col,id);redesenha()}catch(e){toast(e.message||String(e),true)}};
  }catch(e){console.error('v155 confirmar',e);toast('Não consegui preparar a exclusão: '+(e.message||e),true)}}
/* se a tela aberta era a ficha do que saiu, volta para a lista */
function depois(col,id){try{const {k,arg}=route();if(arg===id){const volta={obras:'#/obras',prjobras:'#/prjobras',fobras:'#/fobras',editor:'#/propostas',pospropostas:'#/pospropostas',produto:'#/dbprodutos',pcpessoas:'#/pcpessoas',crmparceiro:'#/dbparceiros'}[k];if(volta)location.hash=volta}
  if(col==='negociacoes'&&S.deal===id)S.deal=null}catch(e){}}

function confirmarDialogo(titulo,texto,botao,fn){css();fechar();const ov=document.createElement('div');ov.id='v155-ov';
  ov.innerHTML=`<div id="v155-dlg"><div class="ico"><i class="bi bi-exclamation-octagon"></i></div><h5>${titulo}</h5><p class="lead">${texto}</p><div class="acts"><button class="btn-x btn-c" id="v155-no">Cancelar</button><button class="btn-x btn-d" id="v155-ok">${botao}</button></div></div>`;
  document.body.appendChild(ov);ov.addEventListener('click',e=>{if(e.target===ov)fechar()});ov.querySelector('#v155-no').onclick=fechar;ov.querySelector('#v155-ok').onclick=()=>{fechar();fn()}}

/* ───────────────────────── 7 · Base › Lixeira ───────────────────────── */
function telaLixeira(){css();const L=lix();const pode=podeExcluir();
  const hd=(typeof head==='function'?head('Lixeira',`O que foi excluído fica aqui, com tudo o que veio junto. <b>Restaurar</b> devolve exatamente como era — mesmos números, mesmas ligações. Só quem tem a permissão <b>Excluir registros</b> restaura ou apaga de vez.`):'<h1 class="h1">Lixeira</h1>');
  if(!L.length)return hd+`<div class="card p-4 text-center" style="border-radius:18px"><div style="font-size:44px;opacity:.35"><i class="bi bi-trash3"></i></div><div style="font-size:17px;font-weight:700;margin-top:6px">A Lixeira está vazia</div><div class="sub mt-1">Quando você excluir uma obra, um cliente, uma proposta, uma pessoa ou um produto, ele aparece aqui — e pode voltar com um clique.</div></div>`;
  const porTipo={};L.forEach(b=>{porTipo[b.raiz.tipo]=(porTipo[b.raiz.tipo]||0)+1});
  const totItens=L.reduce((a,b)=>a+b.itens.length,0);
  const topo=`<div class="card p-3 mb-3 d-flex flex-row flex-wrap gap-4 align-items-center" style="border-radius:18px"><div><div class="v155-big">${N0(L.length)}</div><div class="sub">${L.length===1?'exclusão na Lixeira':'exclusões na Lixeira'}</div></div><div><div class="v155-big" style="opacity:.55">${N0(totItens)}</div><div class="sub">registros guardados no total<br>(${N0(L.length)} ${L.length===1?'principal':'principais'} + ${N0(totItens-L.length)} que vieram junto)</div></div><div class="d-flex flex-wrap gap-1">${Object.keys(porTipo).map(k=>`<span class="chip">${N0(porTipo[k])} ${E(porTipo[k]===1?k:(Object.values(TIPO).find(t=>t.s===k)||{p:k}).p)}</span>`).join('')}</div></div>`;
  const cards=L.map(b=>{const t=TIPO[b.raiz.c]||{};const veio=(b.veio||[]);const antes=precisaAntes(b);
    return `<div class="card v155-lx" data-v155b="${E(b.id)}"><div class="ic"><i class="bi ${t.i||'bi-file'}"></i></div><div style="min-width:0;flex:1"><div class="sub" style="font-size:11px;letter-spacing:.06em;text-transform:uppercase">${E(b.raiz.tipo)}</div><div class="nm">${E(b.raiz.nome)}</div>
      <div class="chips">${veio.length?veio.map(v=>`<span title="${E((v.nomes||[]).join(' · '))}">+ ${E(qt(v.n,v.c))}</span>`).join(''):'<span>sozinh'+(t.g==='a'?'a':'o')+'</span>'}${(b.desligados||[]).length?`<span title="ligações desfeitas — voltam no Restaurar" style="background:rgba(13,110,253,.1)">↺ ligação desfeita: ${E(b.desligados.join(', '))}</span>`:''}</div>
      <div class="sub mt-1" style="font-size:12px">Excluído em ${E(dBR(b.quando))} por <b>${E(b.quem)}</b>${antes.length?` · <span style="color:${RED}">restaure antes ${antes.map(o=>'«'+E(o.raiz.nome)+'»').join(', ')}</span>`:''}</div></div>
      ${pode?`<div class="bt"><button class="btn-apple" onclick="V155.restaurar('${J(b.id)}')"><i class="bi bi-arrow-counterclockwise me-1"></i>Restaurar</button><button class="btn-soft" style="color:${RED};font-size:12px" onclick="V155.purgar('${J(b.id)}')">Excluir definitivamente</button></div>`:''}</div>`}).join('');
  return hd+topo+cards}

/* ───────────────────────── 8 · botões nas telas ───────────────────────── */
/* ficha (rota com id): qual coleção */
const FICHA={obras:'obras',prjobras:'obras',fobras:'obras',robra:'obras',editor:'propostas',pospropostas:'propostas',produto:'produtos',pcpessoas:'pessoas',crmparceiro:'parceiros'};
/* listas onde a linha é deste tipo (quando a linha não diz por si) */
const PREF={prjobras:'obras',obras:'obras',fobras:'obras',copainel:'obras',cronogramas:'obras',propostas:'propostas',pospropostas:'propostas',prevendas:'propostas',dbprodutos:'produtos',produtos:'produtos',fornecedores:'fornecedores',dbparceiros:'parceiros',pcpessoas:'pessoas',posclientes:'clientes',dbservicos:'catserv',dblocais:'locais'};
let IDX=null,IDXt=0;
function idx(){const now=Date.now();if(IDX&&now-IDXt<400)return IDX;IDX=new Map();ROOTS.forEach(c=>(arr(c)||[]).forEach(r=>{if(r&&r.id!=null){const k=String(r.id);if(!IDX.has(k))IDX.set(k,[]);IDX.get(k).push(c)}}));IDXt=now;return IDX}
function colDe(id,pref){const cs=idx().get(String(id));if(!cs||!cs.length)return null;if(pref&&cs.includes(pref))return pref;return cs[0]}
const ROTA=/#\/(obras|prjobras|fobras|editor|pospropostas|produto|pcpessoas|crmparceiro)\/([^'"\s/?&]+)/;
function idDaLinha(tr,k){
  const dr=tr.getAttribute('data-row');if(dr){const c=colDe(dr,PREF[k]);if(c)return [c,dr]}
  const bd=tr.querySelector('[onchange^="bdSet(\'"],[oninput^="bdSet(\'"]');if(bd){const m=/bdSet\('([^']+)','([^']+)'/.exec(bd.getAttribute('onchange')||bd.getAttribute('oninput'));if(m&&ROOTS.includes(m[1])&&find(m[1],m[2]))return [m[1],m[2]]}
  const on=tr.getAttribute('onclick')||'';let m=ROTA.exec(on);
  if(!m){const a=tr.querySelector('a[href*="#/"]');if(a)m=ROTA.exec(a.getAttribute('href')||'')}
  if(m){const c=FICHA[m[1]];const id=decodeURIComponent(m[2]);if(find(c,id))return [c,id]}
  const els=[tr,...tr.querySelectorAll('[onclick]')];for(const el of els){const s=el.getAttribute('onclick')||'';let q;
    if((q=/fornForm\('([^']+)'\)|L\.fornSet\('([^']+)'/.exec(s))){const id=q[1]||q[2];if(find('fornecedores',id))return ['fornecedores',id]}
    if((q=/produtoForm\('([^']+)'\)/.exec(s))&&find('produtos',q[1]))return ['produtos',q[1]];
    if((q=/formCliente\('([^']+)'\)/.exec(s))&&find('clientes',q[1]))return ['clientes',q[1]];
    if((q=/formObra\('([^']+)'\)/.exec(s))&&find('obras',q[1]))return ['obras',q[1]]}
  if(PREF[k]){const re=/'([^']{2,60})'/g;for(const el of els){const s=el.getAttribute('onclick')||'';let q;while((q=re.exec(s))){if(find(PREF[k],q[1]))return [PREF[k],q[1]]}}}
  return null}
const btnLinha=(c,id)=>`<button class="v155-tr" data-v155="${E(c)}|${E(id)}" title="Excluir ${E(tipo(c).s)} (vai para a Lixeira)" onclick="event.stopPropagation();event.preventDefault();V155.excluir('${J(c)}','${J(id)}')"><i class="bi bi-trash3"></i></button>`;
/* exclusões antigas, sem volta: escondidas onde o botão novo aparece */
const VELHO=/S\.db\.fornecedores=S\.db\.fornecedores\.filter|S\.db\.produtos=S\.db\.produtos\.filter|A\.rmObra\(|A\.excluirObra\(|S\.s64\.confirm\[/;
let decorando=false;
function decorar(){if(decorando)return;decorando=true;try{css();
  const m=document.getElementById('main');if(!m)return;const pode=podeExcluir();
  /* as exclusões antigas, sem volta, saem de cena — excluir agora é só pela Lixeira */
  m.querySelectorAll('button').forEach(b=>{if(b.style.display!=='none'&&VELHO.test(b.getAttribute('onclick')||''))b.style.display='none'});
  /* sem permissão: nenhum botão de excluir (nem os antigos de pessoas do v139) */
  if(!pode){m.querySelectorAll('[data-v155],#v155-hdbtn').forEach(b=>b.remove());m.querySelectorAll('button[onclick*="V139_excluir"]').forEach(b=>b.style.display='none');return}
  let k='',arg='';try{const r=route();k=r.k;arg=r.arg?decodeURIComponent(r.arg):''}catch(e){}
  if(k==='dblixeira')return;
  if(!naBaseK(k)){m.querySelectorAll('[data-v155],#v155-hdbtn').forEach(b=>b.remove());return}
  /* 1 · a ficha */
  const fc=FICHA[k];
  if(fc&&arg&&find(fc,arg)&&!m.querySelector('#v155-hdbtn')){
    const b=document.createElement('button');b.id='v155-hdbtn';b.className='btn-soft v155-hd';b.innerHTML='<i class="bi bi-trash3 me-1"></i>Excluir';b.title='Excluir '+tipo(fc).s+' (vai para a Lixeira, com o que estiver ligado)';
    b.onclick=e=>{e.preventDefault();e.stopPropagation();confirmar(fc,arg)};
    let alvo=null;const h1=m.querySelector('h1.h1');if(h1){const hd=h1.closest('.justify-content-between');if(hd&&hd.lastElementChild&&hd.lastElementChild!==h1.parentElement)alvo=hd.lastElementChild}
    if(!alvo){const ed=[...m.querySelectorAll('button[onclick],a[onclick]')].find(x=>(x.getAttribute('onclick')||'').indexOf("'"+arg+"'")>=0&&/form|Editar/i.test((x.getAttribute('onclick')||'')+x.textContent));if(ed)alvo=ed.parentElement}
    if(alvo)alvo.appendChild(b);else{const bar=document.createElement('div');bar.className='d-flex justify-content-end mb-2';bar.appendChild(b);m.insertBefore(bar,m.firstChild)}}
  /* 2 · as linhas das listas */
  m.querySelectorAll('tr').forEach(tr=>{if(tr.__v155||tr.closest('thead'))return;tr.__v155=1;if(tr.hasAttribute('data-v123pair')||tr.hasAttribute('data-v123pespair'))return;
    const r=idDaLinha(tr,k);if(!r)return;
    /* tabela mais larga que a tela (as grades da Base): o botão vai no começo da linha, onde se vê; nas outras, no fim */
    const tb=tr.closest('table');if(tb&&tb.__v155w==null){const w=tb.parentElement;tb.__v155w=!!(w&&tb.scrollWidth>w.clientWidth+20)}
    const larga=tb&&tb.__v155w;const td=larga?tr.cells[0]:tr.cells[tr.cells.length-1];if(!td)return;
    td.insertAdjacentHTML(larga?'afterbegin':'beforeend',btnLinha(r[0],r[1]))});
  /* 3 · os cartões da Pipeline (negociações) */
  m.querySelectorAll('[onclick^="S.deal=\'"]').forEach(c=>{if(c.__v155)return;c.__v155=1;const q=/S\.deal='([^']+)'/.exec(c.getAttribute('onclick'));if(!q||!find('negociacoes',q[1]))return;c.classList.add('v155-card');c.insertAdjacentHTML('beforeend',btnLinha('negociacoes',q[1]))});
  }catch(e){console.error('v155 decorar',e)}finally{decorando=false}}

/* Usuários e permissões: a permissão "Excluir registros" no perfil e, por pessoa, como exceção */
function decorarPermissoes(){try{const m=document.getElementById('main');if(!m||!/^#\/equipe/.test(location.hash||''))return;if(m.querySelector('#v155-perm'))return;
  const adm=podeGerirPerm();
  /* lista de perfis: chip em quem tem */
  m.querySelectorAll('.uq-perfil[onclick*="UQ.verPerfil("]').forEach(c=>{if(c.querySelector('.v155-chip'))return;const q=/verPerfil\('([^']+)'/.exec(c.getAttribute('onclick'));const p=q&&perfilA(q[1]);if(!p)return;
    const on=!!(p.regra&&p.regra.acoes&&p.regra.acoes.excluir);c.insertAdjacentHTML('beforeend',`<div class="sub v155-chip" style="font-size:11px;margin-top:4px;color:${on?RED:'inherit'}"><i class="bi bi-trash3 me-1"></i>${on?'pode excluir registros':'não exclui registros'}</div>`)});
  const leg=m.querySelector('.uq-legend');if(!leg)return;
  const dep=m.querySelector('select[onchange^="UQ.setDep(\'"]');const us=m.querySelector('select[onchange^="UQ.user("]');
  let html='';
  if(us){const login=us.value;const u=usr(login);if(!u)return;const p=perfilA(u.perfil);const herd=!!(p&&p.regra&&p.regra.acoes?p.regra.acoes.excluir:u.papel==='gestor');const ov=u.acoes&&typeof u.acoes.excluir==='boolean'?u.acoes.excluir:null;const ef=podeExcluir(login);
    html=`<div class="card p-3 mb-2" id="v155-perm" style="border-left:4px solid ${RED};border-radius:14px"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><b><i class="bi bi-trash3 me-1"></i>Excluir registros</b> <span class="chip ${ef?'bad':''}" style="margin-left:6px">${ef?'pode':'não pode'}</span><div class="sub" style="font-size:12px">Mandar obras, clientes, propostas, pessoas, produtos… para a Lixeira, restaurar e excluir definitivamente. Do perfil <b>${E(p?p.nome:u.perfil)}</b>: ${herd?'sim':'não'}.</div></div>
      <select class="form-select form-select-sm" style="width:auto" ${adm?'':'disabled'} onchange="V155.setUsuario('${J(login)}',this.value)"><option value="" ${ov===null?'selected':''}>Herdar do perfil (${herd?'sim':'não'})</option><option value="1" ${ov===true?'selected':''}>Sim — exceção desta pessoa</option><option value="0" ${ov===false?'selected':''}>Não — exceção desta pessoa</option></select></div></div>`}
  else if(dep){const q=/UQ\.setDep\('([^']+)'/.exec(dep.getAttribute('onchange'));const p=q&&perfilA(q[1]);if(!p)return;const on=!!(p.regra&&p.regra.acoes&&p.regra.acoes.excluir);
    html=`<div class="card p-3 mb-2" id="v155-perm" style="border-left:4px solid ${RED};border-radius:14px"><label class="d-flex justify-content-between align-items-center gap-3 mb-0" style="cursor:${adm?'pointer':'default'}"><div><b><i class="bi bi-trash3 me-1"></i>Excluir registros</b><div class="sub" style="font-size:12px">Ação especial: mandar registros para a Lixeira, restaurar e excluir definitivamente. Vem ligada nos perfis de Gestor.</div></div>
      <input type="checkbox" class="form-check-input" style="width:2.6em;height:1.4em" ${on?'checked':''} ${adm?'':'disabled'} onchange="V155.setPerfil('${J(p.id)}',this.checked)"></label></div>`}
  if(html)leg.insertAdjacentHTML('beforebegin',html)}catch(e){console.error('v155 perm ui',e)}}

/* ───────────────────────── 9 · API ───────────────────────── */
window.V155={
  pode:podeExcluir,plano,mover,restaurar:null,purgar:null,naBase,naBaseK,soBase:SO_BASE,tipo:c=>tipo(c),
  excluir(c,id){confirmar(c,id)},
  restaurar(bid){if(!podeExcluir()){toast(NEGADO,true);return}const b=lix().find(o=>o.id===bid);if(!b)return;
    try{const r=restaurar(bid);toast(`«${E(r.b.raiz.nome)}» voltou${(r.b.veio||[]).length?' com '+r.b.veio.map(v=>qt(v.n,v.c)).join(', '):''}.`+(r.pulados.length?` (${r.pulados.length} já existiam e ficaram como estão)`:''));redesenha()}catch(e){toast(e.message||String(e),true)}},
  purgar(bid){if(!podeExcluir()){toast(NEGADO,true);return}const b=lix().find(o=>o.id===bid);if(!b)return;
    confirmarDialogo('Excluir definitivamente?',`«${E(b.raiz.nome)}»${(b.veio||[]).length?' e '+b.veio.map(v=>qt(v.n,v.c)).join(', '):''} saem da Lixeira e <b>não podem mais voltar</b>.`,'Excluir definitivamente',()=>{purgar(bid);toast('Excluído definitivamente.');redesenha()})},
  setPerfil(pid,on){if(!podeGerirPerm()){toast('Só Diretoria ou Desenvolvimento e tecnologia mudam permissões.',true);return}const p=perfilA(pid);if(!p)return;p.regra=p.regra||{dep:{},tela:{}};p.regra.acoes=p.regra.acoes||{};p.regra.acoes.excluir=!!on;
    try{log('perfis',pid,'Excluir registros → '+(on?'sim':'não'))}catch(e){}gravar();toast('Perfil '+E(p.nome)+': Excluir registros '+(on?'ligado':'desligado'));redesenha()},
  setUsuario(login,v){if(!podeGerirPerm()){toast('Só Diretoria ou Desenvolvimento e tecnologia mudam permissões.',true);return}const u=usr(login);if(!u)return;u.acoes=u.acoes||{};if(v==='')delete u.acoes.excluir;else u.acoes.excluir=v==='1';
    try{log('usuarios',login,v===''?'Excluir registros: volta a herdar do perfil':'Excluir registros → '+(v==='1'?'sim':'não')+' (exceção)')}catch(e){}gravar();toast(login+': Excluir registros '+(v===''?'herdado do perfil':v==='1'?'liberado':'bloqueado'));redesenha()},
  lixeira:()=>lix()
};

/* ───────────────────────── 10 · instalação ───────────────────────── */
/* trava de segurança da gravação (achada no teste da Lixeira, 05/11): o v154 manda para o worker QUALQUER texto grande comprimido
   dentro de um save e devolve "o último comprimido da base" — quando o CRM grava as tabelas dele (systaag_crm_t) nesse caminho,
   a chave do CRM recebia a base do ERP (e o worker gravava as tabelas do CRM na chave da base). Aqui: só o JSON da base
   (começa com {"clientes":) segue para o worker; qualquer outro texto é comprimido na hora, como sempre foi. */
try{if(window.LZString&&typeof LZString.compressToUTF16==='function'&&!LZString.compressToUTF16.__v155){const _c=LZString.compressToUTF16;
  const g=function(s){if(typeof s==='string'&&s.length>=200000&&s.slice(0,12)!=='{"clientes":'&&!window.__v154_sync){window.__v154_sync=true;try{return _c.apply(this,arguments)}finally{window.__v154_sync=false}}return _c.apply(this,arguments)};
  g.__v155=1;LZString.compressToUTF16=g}}catch(e){}
const persistCRM=()=>{const was=window.__v154_sync;window.__v154_sync=true;try{window.CRM_persistT&&window.CRM_persistT()}catch(e){console.error('v155 crm',e)}finally{window.__v154_sync=was}};
seedPerm();semRessuscitar();
try{SCREENS.dblixeira=function(){return telaLixeira()};LABEL.dblixeira='Lixeira';SEC_OF.dblixeira='bd';if(window.OWNER)OWNER.dblixeira='bd'}catch(e){console.error('v155 tela',e)}
function menu(){try{const bd=NAV.find(s=>s.id==='bd');if(bd&&!bd.items.some(i=>i[0]==='dblixeira'))bd.items.push(['dblixeira','Lixeira'])}catch(e){}}
menu();
/* contador ao lado de "Lixeira" no submenu */
try{const _rn=typeof renderNav==='function'?renderNav:window.renderNav;if(typeof _rn==='function'&&!_rn.__v155){const g=function(){menu();const r=_rn.apply(this,arguments);try{const a=document.querySelector('#subnav a[href="#/dblixeira"]');const n=lix().length;if(a&&n&&!a.querySelector('.cnt'))a.insertAdjacentHTML('beforeend',`<span class="cnt">${n}</span>`)}catch(e){}return r};g.__v155=1;window.renderNav=g;try{renderNav=g}catch(e){}}}catch(e){}
/* pessoas (Base › Pessoas, botão do v139) e cliente (AF107) passam pela Lixeira */
try{window.V139_excluir=function(key){try{if(!podeExcluir()){toast(NEGADO,true);return}const e=ASM.pessoas().lista.find(x=>x.key===key);if(!e)return;
  const p=(e.em.pessoas||[])[0];if(p&&p.id)return confirmar('pessoas',p.id);
  /* sem cadastro mestre: o primeiro registro dela vira a raiz e os outros vão junto */
  const ts=Object.keys(e.em).filter(t=>Array.isArray(S.db[t])&&(e.em[t]||[]).length);if(!ts.length)return;const t0=ts[0],r0=e.em[t0][0];
  if(r0&&r0.id!=null)return confirmar(t0,r0.id);toast('Esta pessoa não tem cadastro com número — use Base › Pessoas › unir antes.',true)}catch(err){console.error('v155 pessoa',err)}}}catch(e){}
try{if(window.AF107)AF107.apagarCliente=function(id){confirmar('clientes',id)}}catch(e){}
/* a gaveta da negociação (Pipeline) também ganha o botão */
try{const _dd=window.dealDrawer;if(typeof _dd==='function'&&!_dd.__v155){const g=function(){const h=_dd.apply(this,arguments);try{if(typeof h==='string'&&S.deal&&naBase()&&podeExcluir()&&find('negociacoes',S.deal)&&h.indexOf('data-v155d')<0)return h+`<div class="mt-3" data-v155d="1"><button class="btn-soft v155-hd" onclick="V155.excluir('negociacoes','${J(S.deal)}')"><i class="bi bi-trash3 me-1"></i>Excluir negociação</button></div>`}catch(e){}return h};g.__v155=1;window.dealDrawer=g}}catch(e){}
try{const _rm=window.renderMain;if(typeof _rm==='function'&&!_rm.__v155){const g=function(){menu();const r=_rm.apply(this,arguments);try{decorar();decorarPermissoes()}catch(e){}return r};g.__v155=1;window.renderMain=g;try{renderMain=g}catch(e){}}}catch(e){console.error('v155 renderMain',e)}
try{const mo=new MutationObserver(ms=>{if(decorando)return;if(ms.some(x=>x.addedNodes&&x.addedNodes.length&&![...x.addedNodes].every(n=>n.nodeType===1&&(n.classList.contains('v155-tr')||n.id==='v155-hdbtn'||n.id==='v155-perm'))))
  {clearTimeout(window.__v155t);window.__v155t=setTimeout(()=>{decorar();decorarPermissoes()},90)}});
  const st=()=>{const m=document.getElementById('main');if(m)mo.observe(m,{childList:true,subtree:true});else setTimeout(st,300)};st()}catch(e){}
setTimeout(()=>{semRessuscitar();menu();try{renderNav()}catch(e){}decorar();decorarPermissoes()},1500);
setTimeout(semRessuscitar,6000);
})();
