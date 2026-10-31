/* ============================================================================================================
   v124-demo.js — "história demo": UMA venda fictícia atravessando todos os departamentos do SYSTAAG.
   window.DEMO = { zerar(), iniciar(ate), carregar(ate), passos, esperado, ids, checar() }
   · carregar(n) constrói a história até o passo n (1–7) chamando as MESMAS ações que os botões chamam
     (A.*, FIL.*, COP.prj.*, formulários COP.form preenchidos e enviados) — nunca empurra linhas cruas no S.db.
   · é idempotente: cada passo grava em S.db.demo124.feito; clicar de novo não duplica nada.
   · modo zero: "Começar do zero" re-aplica a limpeza a cada carregamento. Para a história sobreviver ao F5,
     enquanto a história está carregada (S.db.demo124.ativo) cada save() guarda também um espelho comprimido
     (localStorage 'systaag_demo124z'); no carregamento, se a limpeza do modo zero apagou a história, o espelho
     volta. "Começar do zero", "Resetar dados" e DEMO.zerar() desligam o espelho.
   ============================================================================================================ */
(function(){
'use strict';
if(window.__V124_demo)return;window.__V124_demo=true;
if(typeof S==='undefined'||!S.db)return;
const W=window;
const KEY='systaag_demo124z';
const PEND='systaag_demo124_pend';
const r2=v=>Math.round((+v||0)*100)/100;
const BRL=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const ERR=m=>{try{return new RuleError(m)}catch(e){return new Error(m)}};
const st=()=>S.db.demo124||(S.db.demo124={ativo:false,feito:0,ids:{},log:[]});
const lg=t=>{st().log.push(t)};

/* ---------------- os números da história (fixos) ---------------- */
const CFG={
  cliente:'Cliente Exemplo — Residência São Paulo',sigla:'CEX',
  propNome:'PROP-DEMO-001 · Cliente Exemplo — Residência São Paulo',
  vendedor:'Mariana Costa',projetista:'Carla Mendes',tecnico:'Marcos',
  arquiteto:'PRADO ARQUITETURA',arquitetaNome:'Arq. Helena Prado',
  fornecedor:'FOCAL DISTRIBUIDORA DEMO',
  A:{id:'c218',qtd:10,preco:3800,custo:2115,estoque:6},
  B:{id:'c181',qtd:5,preco:8253.2,custo:4770},
  dias:{instalacao:12,programacao:2},
  hotel:2000,uber:1596.30,
  sinalPct:30,parcelas:2,rtPct:10,
  recebeParcial:20000,pagaParcial:12310,errado:250,
  peca:{id:'c1381',qtd:2},horasGarantia:3
};
W.DEMO_CFG=CFG;

/* ---------------- helpers ---------------- */
function precisa(c,m){if(!c)throw ERR('História demo: '+m)}
function rodar(lb,f){try{const r=f();return r}catch(e){throw ERR(lb+' → '+(e&&e.message||e))}}
/* preenche e envia um formulário COP.form exatamente como a pessoa faria (abrir → digitar → Salvar) */
function form(abrir,vals){
  const antes=new Set([...document.querySelectorAll('form[id^="copf"]')]);
  abrir();
  const f=[...document.querySelectorAll('form[id^="copf"]')].find(x=>!antes.has(x));
  precisa(f,'o formulário não abriu');
  Object.entries(vals||{}).forEach(([k,v])=>{const el=f.querySelector('[data-k="'+k+'"]');if(!el)return;
    if(el.type==='checkbox')el.checked=!!v;
    else if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===String(v))){const o=document.createElement('option');o.value=String(v);o.textContent=String(v);el.appendChild(o);el.value=String(v)}
    else el.value=String(v)});
  const t0=(document.querySelector('.toast-err,.toast.bad')||{}).textContent;
  if(typeof f.requestSubmit==='function')f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true}));
  const ainda=document.body.contains(f);
  if(ainda){const m=f.closest('.modal,.card,div');try{(m||f).remove()}catch(e){}throw ERR('o formulário recusou os dados')}
  return true}
const prop=()=>get('propostas',st().ids.proposta);
/* o mesmo transporte que o frame do CRM usa (google.script.run.api → window.CRM_SERVER.api) */
function crm(action,table,row){const r=JSON.parse(W.CRM_SERVER.api(JSON.stringify({action,table,row})));if(!r||!r.ok)throw ERR('CRM '+action+' '+table+': '+((r&&r.error)||'falhou'));return r}
function crmTabelas(){return JSON.parse(W.CRM_SERVER.api(JSON.stringify({action:'loadAll'}))).tables}
function crmParceiroRow(crmId){return (crmTabelas().parceiros||[]).find(p=>+p.id===+crmId)}
function crmContagem(){const t=crmTabelas();const o={};['parceiros','contatos','interacoes','tarefas','justificativas','esteira','pipeline','depara','decisoes','snapshots'].forEach(k=>o[k]=(t[k]||[]).length);o.negociacoes=(S.db.negociacoes||[]).length;return o}
W.DEMO_CRM={tabelas:crmTabelas,contagem:crmContagem};
const obra=()=>get('obras',st().ids.obra);
const linhas=()=>{const p=prop();return p?blocosDe(p).flatMap(b=>b.itens):[]};
const linhaDe=pid=>linhas().find(l=>l.produto_id===pid);

/* ============================================================================================================
   PASSO 1 · Comercial / CRM
   ============================================================================================================ */
function passo1(){
  const I=st().ids;
  /* 1a · o vendedor (Base › Pessoas › Novo colaborador) e o projetista */
  if(!(S.db.folha||[]).some(f=>f.nome===CFG.vendedor))rodar('vendedor',()=>A.novoColaborador({nome:CFG.vendedor,cargo:'Consultora comercial',dep:'Comercial',salario:6000,empresa:'e_matriz'}));
  if(!(S.db.folha||[]).some(f=>f.nome===CFG.projetista))rodar('projetista',()=>A.novoColaborador({nome:CFG.projetista,cargo:'Projetista',dep:'Projetos',salario:5500,empresa:'e_matriz'}));
  /* ======== 1A · Relacionamento (CRM) — a história começa aqui ======== */
  st().crmAntes=crmContagem();
  /* 1b · CRM › Parceiros › Novo parceiro — o MESMO registro de Base › Parceiros (o frame do CRM manda isto) */
  let pc=(S.db.parceiros||[]).find(p=>p.nome===CFG.arquiteto&&!p.inativo);
  if(!pc){const r=crm('insert','parceiros',{nome:CFG.arquiteto,tipo:'ESCRITÓRIO DE ARQUITETURA',responsavel_rel:CFG.vendedor.toUpperCase(),responsavel_com:CFG.vendedor.toUpperCase(),endereco:'RUA OSCAR FREIRE, 1200',cidade:'SÃO PAULO',estado:'SP',
      email:'helena@pradoarquitetura.com.br',site:'pradoarquitetura.com.br',status:'A contatar',rt:10,exclusivo:'Não',telefones:'["(11) 99999-0001"]',redes:'[]',origem:'INDICAÇÃO DE CLIENTE',obs:'ESCRITÓRIO DA ARQ. HELENA PRADO',
      criado_em:today(),criado_por:'BRUNO POZZANI',primeira_interacao:'',classificacao:'',status_data:today(),atualizado_em:new Date().toISOString(),atualizado_por:'BRUNO POZZANI'});
    pc=(S.db.parceiros||[]).find(p=>+p.crm_id===+r.id)}
  precisa(pc,'o parceiro não nasceu no CRM');I.parceiro=pc.id;I.parceiroCrm=+pc.crm_id;
  /* a pessoa do escritório (CRM › Parceiro › Contatos) */
  I.contato=crm('insert','contatos',{criado_em:today(),parceiro_id:I.parceiroCrm,nome:CFG.arquitetaNome.toUpperCase(),cargo:'ARQUITETA TITULAR',telefone:'(11) 99999-0001',email:'helena@pradoarquitetura.com.br',aniversario:'',redes:'[]',obs:''}).id;
  /* 1c · CRM › Interações › Nova interação: visita ao escritório + próxima ação (vira tarefa em Próximas ações) */
  const di=dplus(-2),prox=dplus(5);
  I.interacao=crm('insert','interacoes',{criado_em:new Date().toISOString(),criado_por:'BRUNO POZZANI',origem:'manual',data:di,parceiro_id:I.parceiroCrm,contato_id:I.contato,contato_nome:CFG.arquitetaNome.toUpperCase(),cargo:'ARQUITETA TITULAR',
    tipo_contato:'Presencial',tipo_outro:'',acao:'Reunião no Escritório',acao_outra:'',treinamentos:'',etapa:'',resumo:'VISITA AO ESCRITÓRIO PRADO ARQUITETURA: HELENA TEM UM CLIENTE (RESIDÊNCIA EM SÃO PAULO) QUE QUER ÁUDIO DISTRIBUÍDO NA SALA',
    resultado:'Receptivo',status:'Em aquecimento',responsavel:CFG.vendedor.toUpperCase(),proxima_data:prox,proximo_responsavel:CFG.vendedor.toUpperCase(),sugestao:'AGENDAR REUNIÃO NA TAAG',atualizado_em:new Date().toISOString(),atualizado_por:'BRUNO POZZANI'}).id;
  /* o que o frame faz depois de gravar a interação: 1ª interação + mudança de status (com justificativa) + a tarefa da próxima ação */
  const pr0=crmParceiroRow(I.parceiroCrm);crm('update','parceiros',Object.assign({},pr0,{primeira_interacao:di,status:'Em aquecimento',status_data:di,atualizado_em:new Date().toISOString(),atualizado_por:'BRUNO POZZANI'}));
  crm('insert','justificativas',{parceiro_id:I.parceiroCrm,tarefa_id:'',data_alteracao:new Date().toISOString(),usuario:'BRUNO POZZANI',campo:'Status do relacionamento',de:'A contatar',para:'Em aquecimento',justificativa:'ALTERADO NO REGISTRO DA INTERAÇÃO DE '+di.split('-').reverse().join('/')});
  I.tarefa=crm('insert','tarefas',{parceiro_id:I.parceiroCrm,interacao_id:I.interacao,data_prevista:prox,responsavel:CFG.vendedor.toUpperCase(),sugestao:'AGENDAR REUNIÃO NA TAAG',descricao:'VISITA AO ESCRITÓRIO PRADO ARQUITETURA: HELENA TEM UM CLIENTE',status:'pendente',origem:'interacao',criado_em:today(),criado_por:'BRUNO POZZANI',concluida_em:'',interacao_conclusao_id:''}).id;
  /* 1d · CRM › Oportunidades › Criar oportunidade (o botão do frame abre o formulário do SYSTAAG): Helena é a fonte */
  const antesN=new Set((S.db.negociacoes||[]).map(n=>n.id));
  rodar('oportunidade',()=>{W.crmCriarOportunidade(I.parceiroCrm);const m=document.getElementById('crmModal');precisa(m,'o formulário Criar oportunidade não abriu');
    const set=(n,v)=>{const el=m.querySelector('[name="'+n+'"]');if(el){el.value=v;el.dispatchEvent(new Event('change'))}};
    set('parceiro_id',I.parceiro);set('papel','arquitetura');set('cliente_nome',CFG.cliente);set('codinome',CFG.sigla);set('tipo','SISTEMA');set('consultor',CFG.vendedor);set('data',dplus(3));set('acao','Visitar a obra com a Helena');set('obs','Residência em São Paulo — áudio distribuído na sala');
    const b=[...m.querySelectorAll('button')].find(x=>/Criar oportunidade/.test(x.textContent));precisa(b,'botão Criar oportunidade não encontrado');b.click();
    precisa(!document.getElementById('crmModal'),'o CRM recusou a oportunidade')});
  const nova=(S.db.negociacoes||[]).filter(n=>!antesN.has(n.id));precisa(nova.length===1,'a oportunidade do CRM não nasceu (ou nasceu '+nova.length+' vezes)');
  I.negociacao=nova[0].id;I.cliente=nova[0].cliente_id;
  /* RT combinada com a arquiteta (Comercial › Pipeline › negócio › "RT — quem recebe"): 10%, recebedora = o parceiro do CRM */
  rodar('RT negociada',()=>A.rtNegociada(I.negociacao,CFG.rtPct));
  if(!(get('negociacoes',I.negociacao).rt_rec||[]).some(x=>x.pid===I.parceiro))rodar('RT recebedor',()=>A.rtRecAdd(I.negociacao,I.parceiro,CFG.rtPct));
  st().crmDepois=crmContagem();
  lg('1A · CRM: parceiro '+CFG.arquiteto+' · contato '+CFG.arquitetaNome+' · interação + próxima ação · oportunidade '+nova[0].codinome+' criada no CRM');
  /* ======== 1B · Comercial — a MESMA oportunidade vira proposta ======== */
  /* 1d · Montar proposta (cliente → obra → proposta, sem redigitar) */
  I.proposta=rodar('montar proposta',()=>A.montarProposta(I.negociacao));
  I.obra=prop().obra_id;
  /* the obra's inventory, answered the way the 'Qual inventário atende a obra?' card answers it */
  try{if(window.MG&&typeof MG.setObraInv==='function'){const ob=get('obras',I.obra);if(ob&&!ob.unidade)MG.setObraInv(I.obra,'SP')}}catch(e){}
  rodar('nome',()=>A.setP(I.proposta,'nome',CFG.propNome));
  /* unidade de negócio TAAG (frente da oportunidade) · filial SP escolhida no Fechamento */
  rodar('filial',()=>FIL.setProposta(I.proposta,'SP'));
  /* 1e · equipamentos: um ambiente, Produto A e Produto B */
  rodar('bloco',()=>A.addBloco(I.proposta,'Sala de estar'));
  const bid=blocosDe(prop())[0].id;I.bloco=bid;
  rodar('produto A',()=>A.addLinha(I.proposta,bid,CFG.A.id,CFG.A.qtd));
  rodar('produto B',()=>A.addLinha(I.proposta,bid,CFG.B.id,CFG.B.qtd));
  /* adicionar / remover / mudar: um item que entra e sai; A vai a 12 e volta a 10 — nada pode acumular */
  rodar('extra',()=>A.addLinha(I.proposta,bid,'c234',1));
  const ex=linhaDe('c234');rodar('remove extra',()=>A.setLinha(I.proposta,ex.id,'qtd',0));
  rodar('A→12',()=>A.setLinha(I.proposta,linhaDe(CFG.A.id).id,'qtd',12));
  rodar('A→10',()=>A.setLinha(I.proposta,linhaDe(CFG.A.id).id,'qtd',CFG.A.qtd));
  /* preços de venda da história: equipamentos R$ 79.266,00 + mão de obra R$ 20.734,00 = R$ 100.000,00 */
  rodar('preço A',()=>A.setLinha(I.proposta,linhaDe(CFG.A.id).id,'preco',CFG.A.preco));
  rodar('preço B',()=>A.setLinha(I.proposta,linhaDe(CFG.B.id).id,'preco',CFG.B.preco));
  rodar('diárias',()=>{A.setDias(I.proposta,bid,'instalacao',CFG.dias.instalacao);A.setDias(I.proposta,bid,'programacao',CFG.dias.programacao)});
  /* condições de pagamento (Fechamento): sinal 30% + 2 parcelas */
  rodar('fechamento',()=>{A.setFech(I.proposta,'forma','Parcelado');A.setFech(I.proposta,'metodo','PIX');A.setFech(I.proposta,'sinal_pct',CFG.sinalPct);A.setFech(I.proposta,'parcelas',CFG.parcelas);A.setFech(I.proposta,'primeiro',dplus(30))});
  /* 1f · aprovação interna: enviada → REPROVADA → revisão → reenviada → Rodolfo + Thaís assinam */
  rodar('enviar aprovação',()=>A.enviarAprovacao(I.proposta));
  rodar('reprovar',()=>A.reprovar(I.proposta));
  st().reprovada={pedidos:(S.db.pedidos||[]).length,unidades:(S.db.unidades||[]).filter(u=>u.proposta_id===I.proposta).length,lancamentos:(S.db.lancamentos||[]).length,estado:prop().estado,aprov:prop().aprov.status,obraProspeccao:!!obra().prospeccao};
  rodar('revisão',()=>A.setFech(I.proposta,'parcelas',CFG.parcelas));
  rodar('reenviar',()=>A.enviarAprovacao(I.proposta));
  rodar('Rodolfo',()=>A.assinar(I.proposta,'rodolfo'));
  rodar('Thaís',()=>A.assinar(I.proposta,'thais'));
  /* 1g · enviada ao cliente (pré-vendas valida a versão), cliente aprova, VENDIDO */
  rodar('versão',()=>A.novaVersao(I.proposta,'Enviada ao cliente'));
  rodar('validar',()=>A.validar(I.proposta,'Guilherme'));
  rodar('cliente aprovou',()=>A.clienteAprovou(I.proposta));
  rodar('vendido',()=>A.vendido(I.proposta));
  /* 1h · aprovado ≠ título: o Vendido só põe a venda em "Vendas a confirmar"; os títulos nascem quando o
     Financeiro confere e confirma (Financeiro › Vendas a confirmar › Confirmar) */
  st().aposVendido=estagio();
  rodar('confirmar venda',()=>A.confirmarVenda(I.proposta));
  st().aposConfirmar=estagio();
  lg('1 · '+prop().numero+' vendida · '+BRL(M.total(prop()))+' · Financeiro confirmou: '+st().aposConfirmar.titulos+' títulos a receber');
}

/* ============================================================================================================
   PASSO 2 · Projetos
   ============================================================================================================ */
function passo2(){
  const I=st().ids;const oid=I.obra;
  precisa(obra(),'a obra da proposta não existe');
  form(()=>COP.prj.formDados(oid),{arquitetura:CFG.arquiteto,respProjetos:CFG.projetista,briefing:'sim',consolidadoArq:'sim',escopo:'Áudio distribuído: 10 caixas embutidas Focal 300 ICW6 + 5 Focal Theva N2 na sala de estar.'});
  form(()=>COP.prj.formCrono(oid),{base:today(),dias:5,incluirNA:true,sobrescrever:true});
  const o=obra();const ents=(o.entregaveis||[]);const ix=ents.findIndex(e=>/Infraestrutura/.test(e.nome));
  st().prazoAntes=(ents[ix]||{}).prazo;
  rodar('prazo',()=>COP.prj.setEnt(oid,ix,'prazo',dplus(25)));
  st().prazoDepois=(obra().entregaveis[ix]||{}).prazo;
  /* uma revisão do executivo (R01) — Projetos não toca preço nem estoque */
  st().antesRev=foto();
  rodar('revisão do executivo',()=>A.prjNovaRev(oid));
  st().depoisRev=foto();
  lg('2 · projetista '+CFG.projetista+' · cronograma gerado · prazo do executivo '+st().prazoAntes+' → '+st().prazoDepois+' · executivo R01');
}
/* o que Projetos NÃO pode mexer: preço, quantidades, reservas, compras, títulos */
function foto(){const p=prop();return {total:r2(M.total(p)),itens:S.db.itens.filter(i=>i.proposta_id===p.id).map(i=>i.produto_id+'×'+i.qtd).sort().join(','),
  reservadoA:(prodInv(CFG.A.id,'SP')||{}).pedido,unidades:(S.db.unidades||[]).filter(u=>u.proposta_id===p.id).length,pedidos:(S.db.pedidos||[]).length,lancamentos:(S.db.lancamentos||[]).length}}

/* ============================================================================================================
   PASSO 3 · Estoque & Compras
   ============================================================================================================ */
function locPorNome(n){return (S.db.locais||[]).find(l=>!l.inativo&&String(l.nome).toUpperCase()===String(n).toUpperCase())}
function formM(abrir,vals){const k0=new Set(Object.keys(W).filter(k=>k.startsWith('__save_f_')));abrir();
  const k=Object.keys(W).filter(k=>k.startsWith('__save_f_')&&!k0.has(k)).pop();precisa(k,'o formulário não abriu');const id=k.slice(7);
  Object.entries(vals).forEach(([f,v])=>{const el=document.getElementById(id+'_'+f);if(el)el.value=v});
  const b=document.querySelector('button[onclick="__save_'+id+'(this)"]');precisa(b,'botão Salvar não encontrado');b.click();
  if(document.body.contains(b)){try{b.closest('.card').remove()}catch(e){}throw ERR('o formulário recusou os dados')}}
function receberTudo(pdId,nf,prefixo){const pd=get('pedidos',pdId);const prat=locPorNome('CA.E1.P1');const rows=[];let n=1;
  CQ.linhas(pd).forEach(l=>{for(let i=0;i<l.pend;i++){rows.push({linha:n,pid:l.produto_id,tipo:'serial',serie:prefixo+'-'+l.produto_id.toUpperCase()+'-'+String(n).padStart(3,'0'),loc:prat.id,custo:String(l.custo),nf});n++}});
  const valor=r2(CQ.linhas(pd).reduce((a,l)=>a+l.pend*l.custo,0));
  return A.receberPedido(pdId,{nf,rows,fin:{nf,serie:'1',fornecedor:pd.fornecedor,valor,vencimento:dplus(28),pagamento:'Boleto'}})}
function passo3(){
  const I=st().ids;
  /* 3a · o lugar: Base › Locais — o corredor A com a prateleira CA.E1.P1 (padrão do armazém) no Estoque Principal SP */
  const sp=locPorNome('Estoque Principal SP');precisa(sp,'Estoque Principal SP não existe');
  if(!locPorNome('Corredor A'))rodar('rack',()=>L.add(3,sp.id,'Corredor A'));
  if(!locPorNome('CA.E1.P1'))rodar('prateleira',()=>L.add(4,locPorNome('Corredor A').id,'CA.E1.P1'));
  /* 3b · as 6 unidades de A que já estavam no estoque: Estoque › Entradas › Entrada manual (inventário) */
  rodar('entrada inicial',()=>A.entradaManual(CFG.A.id,CFG.A.estoque,locPorNome('CA.E1.P1').id,'venda'));
  I.entradaInicial=(S.db.entradas.slice(-1)[0]||{}).id;
  /* e 2 telas (grelhas) de reposição — é delas que o Pós-venda tira a peça no passo 6 */
  rodar('entrada peças',()=>A.entradaManual(CFG.peca.id,CFG.peca.qtd,locPorNome('CA.E1.P1').id,'venda'));
  const inv=prodInv(CFG.A.id,'SP');st().invA={livre:inv.livre,pedido:inv.pedido,cobre:inv.cobre,acomprar:inv.acomprar};
  /* 3c · fornecedor (Base › Fornecedores › Novo) */
  if(!(S.db.fornecedores||[]).some(f=>f.nome===CFG.fornecedor))formM(()=>fornForm(),{nome:CFG.fornecedor,cnpj:'00.000.000/0001-00',prazo:7,pagamento:'28 dias'});
  /* 3d · Obras & Compras › Criar cotação do que falta (só o que falta: 4 A + 5 B) */
  const h0=location.hash;rodar('cotação',()=>FI.cotar(I.obra));
  const pd=(S.db.pedidos||[]).filter(p=>p.proposta_id===I.proposta&&p.estado==='cotacao').pop();precisa(pd,'a cotação não nasceu');I.pedido=pd.id;
  st().cotacao=pd.itens.map(i=>i.produto_id+'×'+i.qtd).join(',');
  /* 3e · orçamento do fornecedor → aprovar (vira pedido = COMPROMETIDO, ainda não é conta a pagar) */
  const o=pd.orcamentos[0];const oid=rodar('orçamento',()=>A.salvarOrcamento(pd.id,Object.assign({},o,{fornecedor:CFG.fornecedor,prazo:'7 dias',pagamento:'28 dias'})));
  rodar('aprovar',()=>A.aprovarOrcamento(pd.id,oid));
  st().aposPedido={compromisso:r2((S.db.compromissos||[]).filter(c=>c.pedido_id===pd.id&&c.estado==='aberto').reduce((a,c)=>a+c.valor,0)),aPagar:(S.db.lancamentos||[]).filter(l=>l.tipo==='pagar'&&l.origem_id===pd.id).length};
  /* 3f · chegou: Estoque › A chegar › Receber — série de cada unidade, custo, prateleira e a NF (vira o título a pagar) */
  rodar('receber',()=>receberTudo(pd.id,'NF 004521','DEMO'));
  I.tituloFornecedor=((S.db.lancamentos||[]).find(l=>l.tipo==='pagar'&&l.origem_id===pd.id)||{}).id;
  st().recebidas=(S.db.unidades||[]).filter(u=>/^DEMO-/.test(u.serie)).map(u=>({serie:u.serie,custo:u.custo,nf:u.nf,local:((L.get(u.loc_id)||{}).nome)||''}));
  /* 3g · Separação: as 15 unidades ganham dono (a proposta) — 8 A + 5 B na 1ª batelada, 2 A na 2ª */
  rodar('separar 1',()=>{A.separar(I.proposta,CFG.A.id,8,'izaque.ventura');A.separar(I.proposta,CFG.B.id,CFG.B.qtd,'izaque.ventura')});
  I.batelada1=(S.db.bateladas.find(b=>b.proposta_id===I.proposta&&b.estado==='aberta')||{}).id;
  /* reabrir a proposta (editor) e tentar o Vendido de novo: nada pode reservar ou comprar em dobro */
  const antes=foto();
  try{location.hash='#/editor/'+I.proposta;renderMain()}catch(e){}
  try{syncItens(prop())}catch(e){}
  let recusou=false;try{A.vendido(I.proposta)}catch(e){recusou=true}
  st().reabrir={antes,depois:foto(),vendidoDeNovoRecusado:recusou};
  try{location.hash=h0||'#/home'}catch(e){}
  lg('3 · estoque tinha 6 A → cotação só do que falta ('+st().cotacao+') → pedido → NF 004521 recebida (15 séries) → separado');
}

/* ============================================================================================================
   PASSO 4 · Operação / Obras
   ============================================================================================================ */
function passo4(){
  const I=st().ids;const oid=I.obra;
  /* 4a · 1ª saída (8 A + 5 B) → proposta em obra */
  rodar('saída 1',()=>A.despachar(I.batelada1));
  I.saida1=(S.db.saidas||[]).filter(s=>s.proposta_id===I.proposta).pop().id;
  /* 4b · apontamentos (Financeiro › Apontamento de obra): diárias × dias da Base › Serviços & diárias + despesas */
  const d=i=>dplus(-10+i);
  rodar('apontamento 1',()=>A.apontarObra({obra_id:oid,tecnico:CFG.tecnico,data:d(0),dias:4,linhas:[{cdc:'204.2',valor:CFG.hotel,descricao:'Hotel — equipe na obra (3 noites)'}]}));
  rodar('apontamento 2',()=>A.apontarObra({obra_id:oid,tecnico:CFG.tecnico,data:d(4),dias:4,linhas:[{cdc:'204.1',valor:CFG.uber,descricao:'Uber / combustível da equipe'}]}));
  /* parcial: vistoria e cabeamento concluídos */
  rodar('etapas parciais',()=>{A.concluirEtapa(oid,0);A.concluirEtapa(oid,1)});
  st().parcial=Object.assign({etapas:obra().etapas.filter(e=>/finaliz|conclu/i.test(e.status)).length+'/'+obra().etapas.length,estado:prop().estado},estagio());
  /* 4c · 2ª batelada (2 A) vai e VOLTA sem uso: o cliente pediu para trocar por B (vira Ret/Troc no passo 7) */
  rodar('separar 2',()=>A.separar(I.proposta,CFG.A.id,2,'izaque.ventura'));
  I.batelada2=(S.db.bateladas.find(b=>b.proposta_id===I.proposta&&b.estado==='aberta')||{}).id;
  rodar('saída 2',()=>A.despachar(I.batelada2));
  I.saida2=(S.db.saidas||[]).filter(s=>s.proposta_id===I.proposta).pop().id;
  rodar('retorno',()=>A.retornar(I.saida2,[]));
  get('saidas',I.saida2).unidade_ids.forEach(u=>rodar('conferência',()=>A.triagem(u,'ok')));
  rodar('apontamento 3',()=>A.apontarObra({obra_id:oid,tecnico:CFG.tecnico,data:d(8),dias:4,linhas:[]}));
  rodar('apontamento prog',()=>A.apontarObra({obra_id:oid,tecnico:'Cleiton',disc:'programacao',data:d(9),dias:2,linhas:[]}));
  /* 4d · completa: todas as etapas + Registrar entrega */
  rodar('etapas',()=>{obra().etapas.forEach((e,i)=>{if(!/conclu/i.test(e.status))A.concluirEtapa(oid,i)})});
  rodar('entrega',()=>A.setEntrega(oid,'realizada',today()));
  lg('4 · 1ª saída · 14 diárias apontadas · hotel '+BRL(CFG.hotel)+' · 2 A voltaram sem uso · entrega técnica → '+prop().estado);
}

/* ============================================================================================================
   PASSO 5 · Financeiro
   ============================================================================================================ */
const titulos=(tipo)=>(S.db.lancamentos||[]).filter(l=>l.tipo===tipo&&(l.origem_id===st().ids.proposta||l.obra_id===st().ids.obra||l.origem_id===st().ids.pedido||l.origem_id===st().ids.pedido2));
function passo5(){
  const I=st().ids;
  const rec=titulos('receber').filter(l=>l.origem_id===I.proposta).sort((a,b)=>String(a.vencimento).localeCompare(String(b.vencimento)));
  precisa(rec.length===3,'a venda devia ter 3 títulos a receber (sinal + 2 parcelas), tem '+rec.length);
  const [sinal,p1]=rec;I.tituloSinal=sinal.id;I.tituloP1=p1.id;
  /* 5a · NF de serviço/venda do sinal e recebimento do sinal (R$ 30.000) */
  rodar('NF do sinal',()=>A.emitirNF(sinal.id));
  rodar('recebe sinal',()=>A.receber(sinal.id));
  /* 5b · o cliente paga só parte da parcela 1: R$ 20.000 de R$ 35.000 → saldo R$ 15.000 continua em aberto */
  rodar('NF da parcela 1',()=>A.emitirNF(p1.id));
  I.saldoP1=rodar('recebimento parcial',()=>A.receberParcial(p1.id,CFG.recebeParcial));
  /* 5c · fornecedor: o Financeiro só APROVA a NF que o Estoque digitou na entrada e paga — parte agora */
  const ent=(S.db.entradas||[]).find(e=>e.pedido_id===I.pedido);
  if(ent&&typeof A.lancarNota==='function'){try{A.lancarNota(ent.id)}catch(e){if(!/já|aprovad/i.test(e.message))throw e}}
  I.saldoFornecedor=rodar('pagamento parcial',()=>A.pagarParcial(I.tituloFornecedor,CFG.pagaParcial));
  /* 5d · um lançamento errado e o seu estorno rastreável: alimentação lançada na obra por engano */
  rodar('lançamento errado',()=>A.apontarObra({obra_id:I.obra,tecnico:CFG.tecnico,data:today(),dias:0,linhas:[{cdc:'204.3',valor:CFG.errado,descricao:'Alimentação — lançada nesta obra por engano'}]}));
  const errado=(S.db.fin.lancamentos||[]).filter(l=>l.obra_id===I.obra&&l.cdc==='204.3'&&+l.valor===CFG.errado).pop();I.movErrado=errado.id;
  I.estorno=rodar('estorno',()=>A.estornarMov(errado.id,'era de outra obra — lançado aqui por engano'));
  st().fin5=estagio();
  lg('5 · sinal recebido · parcela 1 paga em parte (saldo '+BRL(get('lancamentos',I.saldoP1).valor)+') · fornecedor pago em parte (saldo '+BRL(get('lancamentos',I.saldoFornecedor).valor)+') · 1 estorno');
}

/* os três números que não podem se misturar: aprovado (venda) ≠ caixa (recebido) ≠ receita reconhecida (DRE) */
function estagio(){const I=st().ids;const p=prop();const ym=today().slice(0,7);
  const rec=(S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&l.origem_id===I.proposta);
  let dre={};try{dre=FS.dre(ym,'TAAG')||{}}catch(e){}
  let av=0;try{av=FN.avanco(obra())}catch(e){}
  return {aprovado:r2(M.total(p)),titulos:rec.length,aReceber:r2(rec.filter(l=>!l.pago_em).reduce((a,l)=>a+l.valor,0)),recebido:r2(rec.filter(l=>l.pago_em).reduce((a,l)=>a+l.valor,0)),
    receitaDRE:r2(dre.receita||0),avanco:av}}

/* ============================================================================================================
   PASSO 6 · Pós-venda
   ============================================================================================================ */
function passo6(){
  const I=st().ids;
  const livresPeca=()=>(S.db.unidades||[]).filter(u=>u.produto_id===CFG.peca.id&&u.estado==='livre').length;
  const recAntes=(S.db.lancamentos||[]).filter(l=>l.tipo==='receber').length;
  st().pecaAntes=livresPeca();
  /* 6a · Pós-venda › Chamados › Abrir chamado: cliente + obra entregue → a OS herda proposta e equipamentos */
  I.os=rodar('abrir OS',()=>A.abrirOS({cliente_id:I.cliente,titulo:'Tela da caixa embutida da sala amassada',obra:I.obra,tipo:'Garantia',proxima:'Trocar a tela em garantia'}));
  /* 6b · a peça sai do estoque (uma das 2 telas de reposição) */
  const un=(S.db.unidades||[]).find(u=>u.produto_id===CFG.peca.id&&u.estado==='livre');precisa(un,'não há tela livre no estoque');I.pecaUnidade=un.id;
  rodar('peça',()=>FPV.addPecaEstoque(I.os,un.id));
  /* 6c · fecha como GARANTIA: custo (3 h de técnico + peça + deslocamento) na obra original, nenhuma receita */
  rodar('fechar garantia',()=>FPV.fechar(I.os,'garantia',{horas:CFG.horasGarantia,data:today()}));
  try{A.concluirOS(I.os)}catch(e){}
  st().garantia={custo:r2(FPV.garantiaDaObra(I.obra).total!=null?FPV.garantiaDaObra(I.obra).total:FPV.garantiaDaObra(I.obra)),pecaAntes:st().pecaAntes,pecaDepois:livresPeca(),
    titulosNovos:(S.db.lancamentos||[]).filter(l=>l.tipo==='receber').length-recAntes};
  lg('6 · '+I.os+' garantia · peça '+un.serie+' saiu do estoque · custo '+BRL(st().garantia.custo)+' na obra original · receita 0');
}

/* ============================================================================================================
   PASSO 7 · Ret/Troc — 2 das 10 unidades de A viram 2 de B
   ============================================================================================================ */
function passo7(){
  const I=st().ids;const p0=prop();
  const antes=M.resumo(p0);const invA0=prodInv(CFG.A.id,'SP'),invB0=prodInv(CFG.B.id,'SP');
  st().rtAntes={tot:r2(antes.tot),custoE:r2(antes.e.custo),margem:r2(antes.margem),mg:antes.mg,itens:foto().itens,aReceber:estagio().aReceber,
    livreA:invA0.livre,pedidoA:invA0.pedido,livreB:invB0.livre,pedidoB:invB0.pedido,acomprarB:invB0.acomprar};
  /* 7a · Comercial › Ret/Troc › Novo: cliente envolvido (ele paga a diferença) */
  I.rettroc=rodar('ret/troc',()=>A.rtNovo(I.proposta,{motivo:(W.RT61&&RT61.MOTIVOS?RT61.MOTIVOS()[0]:undefined),cliente_envolvido:true,
    justificativa:'Cliente trocou 2 caixas embutidas 300 ICW6 por 2 caixas de piso Theva N2 na sala (as 2 ICW6 voltaram da obra sem uso).'}));
  rodar('retirar 2 A',()=>A.rtItem(I.rettroc,{acao:'reduzir',lid:linhaDe(CFG.A.id).id,qtd:2}));
  rodar('adicionar 2 B',()=>A.rtItem(I.rettroc,{acao:'adicionar',produto_id:CFG.B.id,qtd:2,preco_base:'historico',bloco:'Sala de estar'}));
  const rt0=get('rettrocs',I.rettroc);const iB=rt0.itens.find(x=>x.acao==='adicionar');
  if(iB&&r2(iB.preco_unit)!==r2(CFG.B.preco))rodar('preço B',()=>A.rtItemPreco(I.rettroc,iB.id,'manual',CFG.B.preco));
  st().rtSim=(()=>{const x=RT61.simular(get('rettrocs',I.rettroc));return {rem:r2(x.rem),add:r2(x.add),custoEvit:r2(x.custoEvit),custoNovo:r2(x.custoNovo),deltaCliente:r2(x.deltaCliente),dLucro:r2(x.dLucro),dPP:r2(x.dPP),antesTot:r2(x.antes.tot),depoisTot:r2(x.depois.tot),precisaDiretoria:x.precisaDiretoria}})();
  /* 7b · enviar → cliente aceita → Diretoria (Rodolfo) → Financeiro (Thaís) → consolidado liberado.
     Antes da liberação NADA muda na proposta, no estoque nem no Financeiro. */
  rodar('enviar',()=>A.rtEnviar(I.rettroc));
  const trilha=[];let guard=0;
  while(guard++<6){const r=get('rettrocs',I.rettroc);
    if(/^aguardando_(cliente|diretoria|financeiro)$/.test(r.status)){st().rtDuranteAprovacao=st().rtDuranteAprovacao||{itens:foto().itens,aReceber:estagio().aReceber,pedidoA:prodInv(CFG.A.id,'SP').pedido,pedidoB:prodInv(CFG.B.id,'SP').pedido};
      trilha.push(r.status);rodar('decidir '+r.status,()=>A.rtDecidir(I.rettroc,true,{aguardando_cliente:'Cliente assinou o aditivo',aguardando_diretoria:'Rodolfo: aprovado',aguardando_financeiro:'Thaís: aprovado — aditivo a receber'}[r.status]));continue}
    if(r.status==='aguardando_consolidado'){trilha.push(r.status);rodar('liberar',()=>A.rtLiberarConsolidado(r.consolidado_id));continue}
    break}
  st().rtTrilha=trilha;
  const rt=get('rettrocs',I.rettroc);precisa(rt.status==='liberado','o Ret/Troc não foi liberado (parou em '+rt.status+')');
  const depois=M.resumo(prop());
  /* 7c · Compras: B não tem estoque livre → cotação só das 2 B → pedido → NF → separação → saída */
  const h0=location.hash;rodar('cotação B',()=>FI.cotar(I.obra));try{location.hash=h0}catch(e){}
  const pd=(S.db.pedidos||[]).filter(x=>x.proposta_id===I.proposta&&x.estado==='cotacao').pop();precisa(pd,'a cotação das 2 B não nasceu');I.pedido2=pd.id;
  st().cotacao2=pd.itens.map(i=>i.produto_id+'×'+i.qtd).join(',');
  const o=pd.orcamentos[0];const oid=rodar('orçamento B',()=>A.salvarOrcamento(pd.id,Object.assign({},o,{fornecedor:CFG.fornecedor,prazo:'7 dias',pagamento:'28 dias'})));
  rodar('aprovar B',()=>A.aprovarOrcamento(pd.id,oid));
  rodar('receber B',()=>receberTudo(pd.id,'NF 004688','DEMO2'));
  rodar('separar B',()=>A.separar(I.proposta,CFG.B.id,2,'izaque.ventura'));
  I.batelada3=(S.db.bateladas.find(b=>b.proposta_id===I.proposta&&b.estado==='aberta')||{}).id;
  rodar('saída B',()=>A.despachar(I.batelada3));
  const invA=prodInv(CFG.A.id,'SP'),invB=prodInv(CFG.B.id,'SP');
  st().rtDepois={tot:r2(depois.tot),custoE:r2(depois.e.custo),margem:r2(depois.margem),mg:depois.mg,itens:foto().itens,aReceber:estagio().aReceber,
    aditivo:r2((S.db.lancamentos||[]).filter(l=>l.tipo==='receber'&&l.origem_id===I.proposta&&/Aditivo/.test(l.categoria||'')).reduce((a,l)=>a+l.valor,0)),
    livreA:invA.livre,pedidoA:invA.pedido,livreB:invB.livre,pedidoB:invB.pedido,acomprarB:invB.acomprar,
    entreguesA:(S.db.unidades||[]).filter(u=>u.produto_id===CFG.A.id&&u.proposta_id===I.proposta&&u.estado==='entregue').length,
    entreguesB:(S.db.unidades||[]).filter(u=>u.produto_id===CFG.B.id&&u.proposta_id===I.proposta&&u.estado==='entregue').length};
  lg('7 · '+rt.numero+' liberado ('+trilha.join(' → ')+') · −2 A +2 B · cliente paga +'+BRL(st().rtSim.deltaCliente)+' · 2 B compradas e entregues');
}

const PASSOS=[null,passo1,passo2,passo3,passo4,passo5,passo6,passo7];

/* ============================================================================================================
   API
   ============================================================================================================ */
const DEMO=W.DEMO={CFG};
/* ---------------- roteiro: a tela de cada passo e o que apontar ---------------- */
DEMO.passos=[
 {n:'1a',titulo:'Relacionamento: parceiro, interação, próxima ação, oportunidade',depto:'Relacionamento (CRM)',hash:()=>'#/crmhome',
  oQueMostrar:'A história nasce no CRM: o escritório PRADO ARQUITETURA (Arq. Helena Prado) foi cadastrado em Parceiros, a visita ao escritório está em Interações, a próxima ação "Agendar reunião na TAAG" está no Painel de Ações, e a oportunidade CEX foi criada aqui com a Helena como fonte.'},
 {n:'1b',titulo:'Comercial: a mesma oportunidade vira proposta → aprovação → Vendido',depto:'Comercial',hash:()=>'#/editor/'+st().ids.proposta,
  oQueMostrar:'PROP-DEMO-001 nasceu da oportunidade do CRM (mesmo id): 10× Focal 300-ICW6 + 5× Theva N2 + 14 diárias = R$ 100.000,00; RT 10% para PRADO ARQUITETURA; Histórico: Reprovada → reenviada → Rodolfo + Thaís; "Modo Cliente" é a página do PDF com as condições de pagamento.'},
 {n:2,titulo:'A venda vira projeto',depto:'Projetos',hash:()=>'#/prjobras/'+st().ids.obra,
  oQueMostrar:'Obra 1001 nasceu da proposta (nada redigitado): projetista Carla Mendes, 12 entregáveis com prazo; o executivo foi para 23/11 e está em R01 — preço e estoque não mudaram.'},
 {n:3,titulo:'Estoque cobre 6, compra só 4 + 5',depto:'Estoque & Compras',hash:()=>'#/obrascompras',
  oQueMostrar:'6 Focal 300-ICW6 já no estoque → a cotação pediu só 4 (não 10) + 5 Theva N2; pedido aprovado = comprometido; NF 004521 recebida com 15 séries na prateleira CA.E1.P1.'},
 {n:4,titulo:'Obra: diárias, hotel, entrega',depto:'Operação / Obras',hash:()=>'#/obras/'+st().ids.obra,
  oQueMostrar:'14 diárias apontadas (12 instalação × R$ 800,25 + 2 programação × R$ 900,35) + hotel R$ 2.000,00 + Uber R$ 1.596,30 = R$ 15.000,00 de mão de obra e despesas; 2 caixas voltaram sem uso; entrega técnica registrada.'},
 {n:5,titulo:'Dinheiro: títulos, recebido, pago, DRE',depto:'Financeiro',hash:()=>'#/receber',
  oQueMostrar:'Aprovado R$ 100.000 ≠ caixa (R$ 50.000 recebidos: sinal + parte da parcela 1) ≠ receita reconhecida na DRE (pelo avanço da obra). Fornecedor pago em parte (saldo R$ 20.000). O lançamento errado e o estorno aparecem lado a lado em Lançamentos.'},
 {n:6,titulo:'Garantia',depto:'Pós-venda',hash:()=>'#/chamados',
  oQueMostrar:'OS 2405 herdou cliente, obra, proposta e as séries instaladas; fechou como Garantia: R$ 694,50 (3 h + tela do estoque + deslocamento) na obra original, R$ 0 de receita, a tela saiu do estoque.'},
 {n:7,titulo:'Troca de 2 A por 2 B',depto:'Ret/Troc',hash:()=>'#/rettroc',
  oQueMostrar:'RT-0001: −2 300-ICW6 (−R$ 7.600) +2 Theva N2 (+R$ 16.506,40) → cliente paga +R$ 8.906,40 (aditivo); custo +R$ 5.310; passou por cliente → Diretoria → Financeiro → consolidado; 2 Theva compradas e entregues; as 2 ICW6 viraram estoque livre.'}];
DEMO.passos.forEach(x=>{const f=x.hash;Object.defineProperty(x,'hash',{enumerable:true,get:()=>{try{return f()}catch(e){return '#/home'}}})});

/* ---------------- os números exatos do fim da história ---------------- */
DEMO.esperado={
  venda:100000,custoEquipamento:45000,
  diarias:{instalacao:12,programacao:2,total:14,custo:11403.70},hotel:2000,uber:1596.30,maoDeObraEDespesas:15000,
  contribuicaoIlustrativa:40000,margemSistemaAntes:17641.49,rt:{pct:10,parceiro:'PRADO ARQUITETURA',baseLiquida:87272.44,valor:8727.24,pagoProporcional:'2.618,17 (sinal) + 1.745,45 (parte da parcela 1) a pagar à PRADO ARQUITETURA'},
  titulosVenda:{sinal:30000,parcela1:35000,parcela2:35000},
  aposVendido:{titulos:0,aReceber:0,recebido:0,receitaDRE:0},
  aposConfirmar:{titulos:3,aReceber:100000,recebido:0,receitaDRE:0},
  parcial:{avanco:0.8363,receitaDRE:83630,recebido:0},
  recebido:50000,saldoParcela1:15000,aReceber:58906.40,
  pagoFornecedor:12310,saldoFornecedor:20000,aPagarFornecedores:29540,
  estornoLiquido:0,
  receitaReconhecidaMes:108906.40,
  garantia:{custo:694.50,receita:0,horas:3,peca:269.50,deslocamento:140},
  rettroc:{retirado:7600,adicionado:16506.40,diferencaCliente:8906.40,custoRetirado:4230,custoAdicionado:9540,
    vendaDepois:108906.40,custoEquipamentoDepois:50310,contribuicaoIlustrativaDepois:43596.40,
    margemSistemaDepois:19015.84,margemPctAntes:17.64,margemPctDepois:17.46,porque:'a venda sobe R$ 8.906,40 e o custo de equipamento R$ 5.310,00; tirando impostos, RT de 10% e comissão sobre os R$ 8.906,40 a mais, o lucro do sistema cresce R$ 1.374,34, mas o % cai 0,18 pp porque a Theva N2 tem markup menor que a 300-ICW6 — o cliente PAGA a diferença (aditivo a receber), não recebe crédito'},
  estoque:{A:{antes:6,depoisLivre:2,entregues:8},B:{compradas:7,entregues:7,livre:0},peca:{antes:2,depois:1}},
  quantidadesFinais:'c181×7,c218×8',
  crm:{antes:'tudo 0 (parceiros, contatos, interações, ações, oportunidades, De/Para)',depois:{parceiros:1,contatos:1,interacoes:1,tarefas:1,oportunidades:1}},
  dreTAAG:{receita:108906.40,viagens:3736.30,nota:'viagens = hotel 2.000 + Uber 1.596,30 + deslocamento da garantia 140 (o custo da garantia vai para a unidade da obra original)'}
};
/* ---------------- os mesmos números lidos AO VIVO do sistema (o teste compara um com o outro) ---------------- */
DEMO.checar=function(){const s=st();const I=s.ids;const p=prop();const o=obra();if(!p||!o)return null;
  const L=S.db.lancamentos||[];const rec=L.filter(l=>l.tipo==='receber'&&l.origem_id===I.proposta);
  const forn=L.filter(l=>l.tipo==='pagar'&&(l.origem_id===I.pedido||l.origem_id===I.pedido2||l.parcial_de===I.tituloFornecedor));
  const r=FN.obra(o)||{};const dre=FS.dre(today().slice(0,7),'TAAG')||{};
  const fin=(S.db.fin.lancamentos||[]).filter(l=>l.obra_id===I.obra);
  const sumC=c=>r2(fin.filter(l=>l.cdc===c).reduce((a,l)=>a+(l.tipo==='saida'?+l.valor:-l.valor),0));
  const un=(pid,f)=>(S.db.unidades||[]).filter(u=>u.produto_id===pid&&f(u)).length;
  const pv=(()=>{try{return FPV.garantiaDaObra(I.obra)}catch(e){return {}}})();
  return {venda:r2(M.total(p)),custoEquipamento:r2(M.resumo(p).e.custo),diasApontados:r2(Object.values(o.fin_real.dias).reduce((a,x)=>a+x,0)),custoDiarias:r2(r.moR),
    hotel:sumC('204.2'),uber:sumC('204.1'),estornoLiquido:sumC('204.3'),maoDeObraEDespesas:r2(r.moR+(r.viagem?r.viagem.total:0)),
    recebido:r2(rec.filter(l=>l.pago_em).reduce((a,l)=>a+l.valor,0)),aReceber:r2(rec.filter(l=>!l.pago_em).reduce((a,l)=>a+l.valor,0)),
    pagoFornecedor:r2(forn.filter(l=>l.pago_em).reduce((a,l)=>a+l.valor,0)),aPagarFornecedores:r2(forn.filter(l=>!l.pago_em).reduce((a,l)=>a+l.valor,0)),
    receitaReconhecidaMes:r2(dre.receita||0),hotelNaObra:r2(r.viagem&&r.viagem.by?r.viagem.by.hotel:0),viagensDRE:r2(dre.viagens||0),
    garantiaCusto:r2(pv.total||0),garantiaTitulos:L.filter(l=>l.tipo==='receber'&&/OS 2405|Pós-venda/.test(String(l.categoria||'')+String(l.descricao||''))).length,
    estoqueA:un(CFG.A.id,u=>u.estado==='livre'),entreguesA:un(CFG.A.id,u=>u.estado==='entregue'&&u.proposta_id===I.proposta),entreguesB:un(CFG.B.id,u=>u.estado==='entregue'&&u.proposta_id===I.proposta),
    estoquePeca:un(CFG.peca.id,u=>u.estado==='livre'),quantidades:foto().itens,filialObra:FIL.daObra(o),filialProposta:FIL.daProposta(p)}};

DEMO.ids=new Proxy({},{get:(t,k)=>st().ids[k],ownKeys:()=>Reflect.ownKeys(st().ids),getOwnPropertyDescriptor:(t,k)=>({enumerable:true,configurable:true,value:st().ids[k]})});
DEMO.estado=()=>st();
DEMO.carregar=function(ate){ate=Math.max(1,Math.min(PASSOS.length-1,+ate||PASSOS.length-1));let s=st();
  if(s.feito===0){const sujo=(S.db.clientes||[]).length||(S.db.propostas||[]).length;if(sujo)throw ERR('Comece do zero antes (DEMO.zerar ou "Carregar história demo" no Início).')}
  s.ativo=true;
  for(let n=s.feito+1;n<=ate;n++){
    /* cada passo é tudo-ou-nada: se uma ação recusar, o passo inteiro volta e nada fica pela metade */
    const snap={};Object.keys(S.db).forEach(k=>{try{snap[k]=JSON.stringify(S.db[k])}catch(e){}});
    try{PASSOS[n]()}catch(e){Object.keys(S.db).forEach(k=>{if(!(k in snap))delete S.db[k]});Object.keys(snap).forEach(k=>{let c;try{c=JSON.stringify(S.db[k])}catch(_){}if(c!==snap[k])S.db[k]=JSON.parse(snap[k])});try{save()}catch(_){}throw ERR('passo '+n+': '+(e&&e.message||e))}
    st().feito=n;try{save()}catch(e){}}
  try{save()}catch(e){}return s.feito};
DEMO.zerar=function(){try{localStorage.removeItem(KEY);localStorage.removeItem(KEY+'_crm')}catch(e){}delete S.db.demo124;try{save()}catch(e){}
  if(typeof MG!=='undefined'&&MG.zerar)MG.zerar(1)};
DEMO.iniciar=function(ate){try{localStorage.setItem(PEND,String(ate||7))}catch(e){}DEMO.zerar()};

/* ---------------- espelho: a história sobrevive ao F5 no modo zero ---------------- */
const _save=W.save;
W.save=function(){const r=_save.apply(this,arguments);
  try{if(S.db.demo124&&S.db.demo124.ativo){localStorage.setItem(KEY,LZString.compressToUTF16(JSON.stringify(S.db)));if(W.CRM_T)localStorage.setItem(KEY+'_crm',LZString.compressToUTF16(JSON.stringify(W.CRM_T)))}}catch(e){console.warn('DEMO espelho',e)}
  return r};
function restaurar(){try{
  const s=S.db.demo124;if(!s||!s.ativo||!S.db.af113_zero)return false;
  if((S.db.propostas||[]).some(p=>p.id===(s.ids||{}).proposta))return false;   /* nada foi apagado */
  const z=localStorage.getItem(KEY);if(!z)return false;const db=JSON.parse(LZString.decompressFromUTF16(z));if(!db||!db.demo124)return false;
  Object.keys(db).forEach(k=>{S.db[k]=db[k]});
  /* as tabelas do CRM moram em outra chave e a limpeza do modo zero também as esvazia no carregamento */
  try{const zc=localStorage.getItem(KEY+'_crm');if(zc){W.CRM_T=JSON.parse(LZString.decompressFromUTF16(zc));W.CRM_persistT&&CRM_persistT()}}catch(e){console.warn('DEMO CRM',e)}
  _save.call(W);return true}catch(e){console.warn('DEMO restaurar',e);return false}}
DEMO._restaurou=restaurar();
/* a tela (e o frame do CRM) já tinham sido desenhados com o sistema vazio antes do espelho voltar: redesenha */
if(DEMO._restaurou){setTimeout(function(){try{renderMain()}catch(e){}},0);
  let k=0;const t=setInterval(function(){k++;try{const w=W.__crmFrameWin&&W.__crmFrameWin();if(w&&w.systaagReady&&w.systaagReady()){clearInterval(t);if(w.systaagReload)w.systaagReload();return}}catch(e){}if(k>40)clearInterval(t)},400)}
/* sair da história: Começar do zero e Resetar dados desligam o espelho */
['aplicarZero','reset'].forEach(nm=>{const f=W[nm];if(typeof f!=='function'||f.__demo124)return;const g=function(){try{localStorage.removeItem(KEY);localStorage.removeItem(KEY+'_crm')}catch(e){}try{if(S.db&&S.db.demo124)delete S.db.demo124;const db=arguments[0];if(db&&db.demo124)delete db.demo124}catch(e){}return f.apply(this,arguments)};g.__demo124=true;Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});W[nm]=g});

/* ---------------- botão no Início: "Carregar história demo" ao lado de "Começar do zero" ---------------- */
const bot='<button class="inicio-more-btn" type="button" style="margin-left:8px" id="demo124-btn" onclick="DEMO.iniciar(7)" title="Esvazia o sistema e monta uma venda fictícia (PROP-DEMO-001) passando por todos os departamentos"><i class="bi bi-play-circle me-1"></i>Carregar história demo</button>';
['home'].forEach(k=>{const f=SCREENS[k];if(typeof f!=='function')return;SCREENS[k]=function(){const h=f.apply(this,arguments);if(typeof h!=='string'||h.indexOf('demo124-btn')>=0)return h;
  const i=h.indexOf('onclick="MG.zerar()"');if(i<0)return h;const j=h.indexOf('</button>',i);return j<0?h:h.slice(0,j+9)+bot+h.slice(j+9)}});

/* o Início já foi desenhado antes destas camadas carregarem: redesenha uma vez para os botões aparecerem */
setTimeout(function(){try{const k=(typeof route==='function'&&route().k)||'';if(!k||k==='home')renderMain()}catch(e){}},0);
/* ---------------- pedido pendente (o botão: zera → recarrega → monta) ---------------- */
setTimeout(function(){let n=null;try{n=localStorage.getItem(PEND)}catch(e){}if(!n)return;try{localStorage.removeItem(PEND)}catch(e){}
  try{DEMO.carregar(+n);toast('História demo carregada — PROP-DEMO-001 passou pelos 7 departamentos.');location.hash='#/home';render()}catch(e){console.error('DEMO',e);try{toast(e.message,true)}catch(_){}}},300);
})();
