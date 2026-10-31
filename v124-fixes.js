/* ============================================================================================================
   v124-fixes.js — correções encontradas ao rodar a "história demo" (uma venda passando por todos os departamentos).
   Cada correção EMBRULHA a função existente (mesmo estilo de camadas do resto da página) e diz o que estava errado.
   ============================================================================================================ */
(function(){
'use strict';
if(window.__V124_fixes)return;window.__V124_fixes=true;
if(typeof S==='undefined'||!S.db)return;
const W=window;
const FX=W.V124FX={log:[]};
const nota=(id,txt)=>{FX.log.push(id+' · '+txt)};
const safe=(lb,f)=>{try{return f()}catch(e){console.warn('[v124 fixes] '+lb,e)}};
const r2=v=>Math.round((+v||0)*100)/100;

/* ------------------------------------------------------------------------------------------------------------
   F01 · "Começar do zero" apagava o livro de RECEITAS de mão de obra (S.db.receitas está na lista VAZIO de
   aplicarZero), mas os 1.780 produtos do catálogo continuam apontando para receita_id. Resultado: Base › Serviços
   & diárias quebrava (TypeError reading 'projeto' em servicosBody51) e toda proposta feita no modo zero saía SEM
   mão de obra (diárias = 0). Receita é configuração do catálogo, não movimento — fica, como produtos e regras.
   Conserto: (a) no carregamento, se o livro estiver vazio, ele volta a partir da própria semente da página
   (RECEITAS_SEED, lida do texto do script — a constante é local); (b) aplicarZero passa a preservar as receitas.
   ------------------------------------------------------------------------------------------------------------ */
function sementeReceitas(){
  const s=[...document.scripts].find(x=>x.textContent.indexOf('const RECEITAS_SEED=[')>=0);if(!s)return [];
  const t=s.textContent;const i=t.indexOf('const RECEITAS_SEED=')+'const RECEITAS_SEED='.length;let d=0,j=i;
  for(;j<t.length;j++){const c=t[j];if(c==='[')d++;else if(c===']'){d--;if(d===0)break}}
  try{return JSON.parse(t.slice(i,j+1))}catch(e){return []}}
FX.receitasSemente=sementeReceitas;
function garantirReceitas(){
  S.db.receitas=Array.isArray(S.db.receitas)?S.db.receitas:[];
  let n=0;
  if(S.db.receitas.length<5){sementeReceitas().forEach(r=>{if(!S.db.receitas.some(x=>x.id===r.id)){S.db.receitas.push(Object.assign({},r,{origem:'planilha SERVIÇOS',atualizado_em:'2016-03-15'}));n++}})}
  if(!S.db.receitas.some(x=>x.id==='r_none')){S.db.receitas.unshift({id:'r_none',grupos:['—'],nome:'Nenhuma (sem mão de obra)',desc:'Produto que não gera trabalho de instalação: cabos vendidos por metro, acessórios, licenças.',projeto:0,estrutural:0,instalacao:0,programacao:0,unidade:'un',origem:'sistema'});n++}
  return n}
safe('F01 receitas',()=>{if(garantirReceitas()){nota('F01','livro de receitas restaurado');try{save()}catch(e){}}});
safe('F01 wrap aplicarZero',()=>{
  const _az=W.aplicarZero;if(typeof _az!=='function'||_az.__v124)return;
  const az=function(db){const keep=(db&&Array.isArray(db.receitas))?db.receitas.slice():[];const r=_az.apply(this,arguments);
    try{if(db){db.receitas=keep.length?keep:db.receitas;if(db===S.db)garantirReceitas()}}catch(e){}return r};
  az.__v124=true;Object.keys(_az).forEach(k=>{try{az[k]=_az[k]}catch(e){}});W.aplicarZero=az});

/* ------------------------------------------------------------------------------------------------------------
   F02 · "Volta para o estoque" quebrava quando o armazém não usa o código CA.E1.P1. rackFor() escolhe a
   prateleira de volta em L.racks(), que só aceita nomes no padrão /^C[A-Z]\.E\d\.P\d$/. No modo zero (ou com
   prateleiras de outro nome) a lista vem vazia, rackFor devolve undefined e A.triagem(…,'ok') (Conferência OK),
   A.devolverAoEstoque e o retorno de saída morrem com "Cannot read properties of undefined (reading 'id')".
   Conserto: sem prateleira no padrão, L.racks() devolve as prateleiras (N4) de estoque de verdade — nunca as
   áreas de processo (Recebimento/Doca, Separação/Batelada, A DEFINIR).
   ------------------------------------------------------------------------------------------------------------ */
safe('F02 racks',()=>{
  if(typeof L!=='object'||typeof L.racks!=='function'||L.racks.__v124)return;
  const _r=L.racks;const PROC=/^(DOCA|BATELADA|A DEFINIR)$/i;const HOLD=/^(RECEBIMENTO|SEPARA[CÇ][AÃ]O|MONTAGEM|KITS|BACKUP|ASSIST[EÊ]NCIA)$/i;
  const r=function(){const a=_r.apply(this,arguments);if(a&&a.length)return a;
    return L.all().filter(l=>l.nivel===4&&l.tipo!=='hold'&&!PROC.test(String(l.nome).trim())&&!HOLD.test(String((L.get(l.pai)||{}).nome||'').trim()))};
  r.__v124=true;L.racks=r});

/* ------------------------------------------------------------------------------------------------------------
   F03 · Clicar "Vendido" numa proposta que já foi vendida (ou que o cliente ainda não aprovou) criava 3 títulos
   a receber (sinal + parcelas) e SÓ DEPOIS a camada de baixo recusava ("Vendido exige a aprovação do cliente
   antes"). A camada de 1632 grava os títulos antes de chamar a regra, e run() não desfaz a memória: os títulos
   ficavam, o próximo save() gravava, e o Financeiro › Auditoria passava a mostrar "R$ 100.000 em registros que
   não nasceram pela regra". Era o "clique repetido gera lançamento em dobro".
   Conserto: (a) proposta já vendida/em obra/concluída é recusada logo na porta; (b) A.vendido, A.confirmarVenda
   e A.receberPedido viram transação — se qualquer camada recusar, tudo o que as camadas de cima já tinham
   mexido volta como estava (só as tabelas que mudaram são restauradas).
   ------------------------------------------------------------------------------------------------------------ */
const SOLD=['vendida','em_obra','concluida'];
let txDepth=0;
function transacao(nome,porta){const f=A[nome];if(typeof f!=='function'||f.__v124tx)return;
  const g=function(){if(porta)porta.apply(this,arguments);
    if(txDepth>0)return f.apply(this,arguments);
    const snap={};Object.keys(S.db).forEach(k=>{try{snap[k]=JSON.stringify(S.db[k])}catch(e){}});
    txDepth++;try{return f.apply(this,arguments)}
    catch(e){try{Object.keys(S.db).forEach(k=>{if(!(k in snap))delete S.db[k]});
        Object.keys(snap).forEach(k=>{let cur;try{cur=JSON.stringify(S.db[k])}catch(_){}if(cur!==snap[k])S.db[k]=snap[k]===undefined?undefined:JSON.parse(snap[k])})}catch(_){}
      throw e}
    finally{txDepth--}};
  g.__v124tx=true;Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});A[nome]=g}
safe('F03 vendido',()=>{
  transacao('vendido',function(pr){const p=get('propostas',pr);if(p&&SOLD.includes(p.estado))throw new RuleError('A proposta '+p.numero+' já foi vendida em '+(p.vendida_em?String(p.vendida_em).split('-').reverse().join('/'):'—')+' — nada foi criado de novo.')});
  transacao('confirmarVenda');
  transacao('receberPedido');
  nota('F03','Vendido/Confirmar/Receber transacionais')});

/* ------------------------------------------------------------------------------------------------------------
   F04 · Custo PREVISTO da obra contava o equipamento duas vezes. FX2.buckets soma, na linha Equipamentos,
   o realizado (unidades entregues, a custo) + o "comprometido" = TODO título a pagar em aberto com origem
   pedido. Mas depois que a NF chega, o título a pagar é a dívida DAS MESMAS unidades que já estão no realizado
   (ou no estoque esperando a saída). Na história: 40.770 entregues + 32.310 da NF dessas unidades = 73.080 de
   equipamento previsto para uma venda de 45.000 → "resultado previsto −7.307" numa obra que dá lucro.
   Regra certa: comprometido de equipamento = pedido aprovado cuja NF ainda NÃO chegou (S.db.compromissos
   em aberto da obra) + conta de fornecedor lançada direto na obra sem pedido (essa não vira unidade).
   O título da NF recebida continua aparecendo em A pagar / Fluxo (é caixa), só não vira custo de novo.
   ------------------------------------------------------------------------------------------------------------ */
safe('F04 buckets',()=>{
  if(!W.FX2||typeof FX2.buckets!=='function'||FX2.buckets.__v124)return;
  const _b=FX2.buckets;
  const f=function(o,r){
    /* F06c · o par lançamento+estorno vale zero na obra: tira da viagem (204.x) que FN.obra já somou e roda o
       resto do quadro (planilha) sem os pares */
    const F=S.db.fin;const all=F&&F.lancamentos;let b;
    try{const pares=(Array.isArray(all)?all:[]).filter(l=>l.obra_id===o.id&&(l.estorno_de||l.estornado_por));
      if(pares.length&&r&&r.viagem&&!r.__v124e){r.__v124e=true;let tot=0;const TR=(W.FD1&&FD1.TRAVEL)||[];
        pares.forEach(l=>{const t=TR.find(x=>x.cdc===l.cdc);if(!t)return;const sv=l.tipo==='saida'?+l.valor:0;if(!sv)return;tot+=sv;if(r.viagem.by&&r.viagem.by[t.k]!=null)r.viagem.by[t.k]=r2(r.viagem.by[t.k]-sv)});
        if(tot){r.viagem.total=r2(r.viagem.total-tot);r.extrasR=r2(r.extrasR-tot);r.custoR=r2(r.custoR-tot);r.resR=r2(r.receitaR-r.custoR);r.custoProj=r2(r.custoProj-tot)}}}catch(e){console.warn('F06c',e)}
    if(Array.isArray(all)&&all.some(l=>l.estorno_de||l.estornado_por)){F.lancamentos=all.filter(l=>!l.estorno_de&&!l.estornado_por);try{b=_b.apply(this,arguments)}finally{F.lancamentos=all}}
    else b=_b.apply(this,arguments);
    try{
    const abertos=(S.db.compromissos||[]).filter(k=>k.obra_id===o.id&&k.estado==='aberto').reduce((a,k)=>a+(+k.valor||0),0);
    const diretos=(S.db.lancamentos||[]).filter(l=>l.tipo==='pagar'&&!l.pago_em&&l.obra_id===o.id&&l.origem!=='pedido'&&/Fornecedor/i.test(l.categoria||'')).reduce((a,l)=>a+(+l.valor||0),0);
    const e=b.B[0];const com=r2(abertos+diretos);
    if(Math.abs(com-e.com)>0.005){e.com=com;e.ac=Math.max(0,r2(e.orc-e.real-com));e.prev=r2(Math.max(e.orc,e.real+com));
      const t=k=>r2(b.B.reduce((a,x)=>a+(+x[k]||0),0));b.com=t('com');b.ac=t('ac');b.prev=t('prev')}
  }catch(e){console.warn('F04',e)}return b};
  f.__v124=true;FX2.buckets=f});

/* F04b · a ficha da obra em Financeiro › Obras (quadro "Orçado · Realizado · Comprometido · A completar") NÃO usa
   FX2.buckets: obraDetail recalcula por conta própria com o mesmo erro (Equipamentos: realizado 50.310 +
   "comprometido" 29.540 das NFs já recebidas = previsto 79.850). O quadro é refeito a partir de FN.obra(o).buckets
   — a MESMA previsão do cartão "Resultado projetado", da lista e do P&L — com a ponte dita na legenda. */
safe('F04b quadro da obra',()=>{
  const f=SCREENS.fobras;if(typeof f!=='function'||f.__v124b)return;
  const R=v=>(v<0?'−':'')+'R$ '+Math.abs(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const g=function(arg){const h=f.apply(this,arguments);try{
    if(typeof h!=='string'||!arg)return h;const o=get('obras',arg);if(!o)return h;
    const ini=h.indexOf('<div class="card p-3 mb-3" id="fs_obra_buckets"');if(ini<0)return h;
    const pt=h.indexOf('Ponte: contratado',ini);if(pt<0)return h;const fim=h.indexOf('</div></div>',pt);if(fim<0)return h;
    const r=FN.obra(o);if(!r||!r.buckets)return h;const b=r.buckets;const v=r.viagem||{by:{}};
    const TR=(W.FD1&&FD1.TRAVEL)||[];
    const line=(lb,x,sub)=>`<tr${sub?' class="sub" style="font-size:12px"':''}><td${sub?' style="padding-left:22px"':''}>${lb}</td><td class="text-end">${R(x.orc)}</td><td class="text-end">${R(x.real)}</td><td class="text-end">${R(x.com)}</td><td class="text-end">${R(x.ac)}</td><td class="text-end" style="color:${x.real+x.com>x.orc+0.5?'#dc3545':'inherit'}">${R(x.prev)}</td></tr>`;
    const rows=b.B.map(x=>line(x.lb,x)+(/Viagem/.test(x.lb)?TR.map(t=>{const real=r2((v.by||{})[t.k]||0);return line(t.cdc+' '+t.lb,{orc:0,real,com:0,ac:0,prev:real},true)}).join(''):'')).join('');
    const nfs=r2((S.db.lancamentos||[]).filter(l=>l.tipo==='pagar'&&!l.pago_em&&l.obra_id===o.id&&l.origem==='pedido').reduce((a,l)=>a+(+l.valor||0),0));
    const lucroProm=r2(r.v-b.orc),lucroPrev=r2(r.v-b.prev);
    const card=`<div class="card p-3 mb-3" id="fs_obra_buckets" data-orc="${b.orc}" data-real="${b.real}" data-com="${b.com}" data-ac="${b.ac}" data-prev="${b.prev}" data-v124="1"><h6 class="mb-0">Orçado · Realizado · Comprometido · A completar</h6><div class="sub mb-2">Comprometido = pedido aprovado cuja NF ainda não chegou + contas em aberto que ainda não viraram custo realizado · A completar = orçado − realizado − comprometido (nunca negativo) · Previsto = realizado + comprometido + a completar.${nfs?` As NFs de equipamento já recebidas (${R(nfs)} em A pagar) são caixa a pagar, não custo novo: essas unidades já estão no Realizado (ou no estoque, esperando a saída).`:''}</div>
  <div class="tblwrap"><table class="tbl"><thead><tr><th>Bucket</th><th class="text-end">Orçado</th><th class="text-end">Realizado</th><th class="text-end">Comprometido</th><th class="text-end">A completar</th><th class="text-end">Previsto</th></tr></thead><tbody>${rows}
  <tr style="font-weight:700;border-top:2px solid var(--bd)"><td>Custo total</td><td class="text-end">${R(b.orc)}</td><td class="text-end">${R(b.real)}</td><td class="text-end">${R(b.com)}</td><td class="text-end">${R(b.ac)}</td><td class="text-end">${R(b.prev)}</td></tr></tbody></table></div>
  <div class="sub mt-2" style="font-size:12px">Ponte: contratado ${R(r.v)} − previsto ${R(b.prev)} = <b>${R(lucroPrev)}</b> · prometido na venda ${R(lucroProm)} → ${lucroPrev<lucroProm-0.5?`<span style="color:#dc3545">${R(lucroProm-lucroPrev)} a menos</span>`:lucroPrev>lucroProm+0.5?`<span style="color:#198754">${R(lucroPrev-lucroProm)} a mais</span>`:'igual'}.</div></div>`;
    return h.slice(0,ini)+card+h.slice(fim+12)}catch(e){console.warn('F04b',e);return h}};
  g.__v124b=true;Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});SCREENS.fobras=g});

/* ------------------------------------------------------------------------------------------------------------
   F05 · Não existia recebimento nem pagamento PARCIAL: A.receber/A.pagar só baixam o título inteiro. Um cliente
   que paga parte da parcela (ou um fornecedor pago em duas vezes) não tinha como ser registrado — ou se baixava
   o total (caixa errado) ou nada (saldo errado).
   Conserto: A.receberParcial(lid,valor) / A.pagarParcial(lid,valor). O título se divide em dois: a parte paga
   (baixada pela porta normal A.receber/A.pagar — caixa, conta, comissão da parcela seguem iguais) e o SALDO,
   que nasce pela porta sancionada FC.novoLancamento com as mesmas datas de competência/caixa, obra, unidade,
   filial, NF e origem, e aponta para o original (parcial_de). A soma dos dois é sempre o título original.
   Botão "Parcial…" ao lado de Registrar recebimento / Pagar.
   ------------------------------------------------------------------------------------------------------------ */
function dividir(lid,valor,tipo){
  const l=get('lancamentos',lid);if(!l)throw new RuleError('Título não encontrado.');
  if(l.tipo!==tipo)throw new RuleError('Este título não é '+(tipo==='receber'?'a receber':'a pagar')+'.');
  if(l.pago_em)throw new RuleError('Este título já foi baixado.');
  const v=r2(typeof valor==='string'?+String(valor).replace(/\./g,'').replace(',','.'):valor);
  if(!(v>0))throw new RuleError('Informe o valor '+(tipo==='receber'?'recebido':'pago')+' agora.');
  if(v>=r2(l.valor)-0.004)throw new RuleError('Esse valor quita o título inteiro — use '+(tipo==='receber'?'Registrar recebimento':'Pagar')+'.');
  const resto=r2(l.valor-v);
  const copia=JSON.parse(JSON.stringify(l));['id','pago_em','fc_selo','fc_selado_em','parcial'].forEach(k=>delete copia[k]);
  Object.assign(copia,{valor:resto,parcial_de:l.id,categoria:String(l.categoria||'').replace(/ · saldo$/,'')+' · saldo',motivo:'saldo do '+(tipo==='receber'?'recebimento':'pagamento')+' parcial de '+l.id,
    data_competencia:l.data_competencia||l.vencimento,data_caixa:l.data_caixa||l.vencimento,vencimento:l.vencimento});
  const novo=FC.novoLancamento(copia);
  const atual=get('lancamentos',lid);atual.parcial={original:r2(v+resto),pago:v,saldo:resto,saldo_id:novo.id,em:today()};atual.valor=v;
  put('lancamentos',atual,(tipo==='receber'?'recebimento':'pagamento')+' parcial: '+v+' de '+r2(v+resto));
  return novo.id}
A.receberParcial=function(lid,valor,meioId){const saldo=dividir(lid,valor,'receber');A.receber(lid,meioId);return saldo};
A.pagarParcial=function(lid,valor){const saldo=dividir(lid,valor,'pagar');A.pagar(lid);return saldo};
['receberParcial','pagarParcial'].forEach(k=>transacao(k));
const btnParcial=(lid,tipo)=>`<button class="btn-soft" data-v124-parcial="${lid}" style="margin-left:4px" onclick="const v=ask('${tipo==='receber'?'Quanto o cliente pagou agora? (R$) — o resto continua em aberto':'Quanto foi pago agora ao fornecedor? (R$) — o resto continua a pagar'}','');if(v)run(()=>A.${tipo==='receber'?'receberParcial':'pagarParcial'}('${lid}',v),'${tipo==='receber'?'Recebimento':'Pagamento'} parcial · o saldo continua em aberto')">Parcial…</button>`;
[['receber',/(<button[^>]*onclick="run\(\(\)=>A\.receber\('([^']+)'\)[^"]*"[^>]*>[\s\S]*?<\/button>)/g],['pagar',/(<button[^>]*onclick="run\(\(\)=>A\.pagar\('([^']+)'\)[^"]*"[^>]*>[\s\S]*?<\/button>)/g]].forEach(([k,re])=>{
  const f=SCREENS[k];if(typeof f!=='function')return;
  SCREENS[k]=function(){const h=f.apply(this,arguments);if(typeof h!=='string'||h.indexOf('data-v124-parcial')>=0)return h;return h.replace(re,(m,b,lid)=>b+btnParcial(lid,k))}});

/* ------------------------------------------------------------------------------------------------------------
   F06 · Não havia ESTORNO rastreável de um lançamento: o único jeito de desfazer um lançamento errado era
   apagá-lo (FUI.remover) — o registro sumia e ninguém sabia que tinha existido.
   Conserto: A.estornarMov(id,motivo) — cria pela porta sancionada FC.novoLancamento o movimento CONTRÁRIO
   (saída ↔ entrada), com o mesmo código do plano de contas, obra, unidade, centro de custo, conta e a MESMA
   competência do original; os dois ficam visíveis, um aponta para o outro (estorno_de / estornado_por), o
   motivo fica gravado, e a soma na obra, na DRE e no caixa volta a zero. Estornar duas vezes é recusado.
   Botão "Estornar" em Financeiro › Lançamentos.
   ------------------------------------------------------------------------------------------------------------ */
A.estornarMov=function(id,motivo){
  const L_=(S.db.fin&&S.db.fin.lancamentos)||[];const l=L_.find(x=>x.id===id);
  if(!l)throw new RuleError('Lançamento não encontrado.');
  if(l.estornado_por)throw new RuleError('Este lançamento já foi estornado ('+l.estornado_por+').');
  if(l.estorno_de)throw new RuleError('Isto já é um estorno — estorne o original, não o estorno.');
  if(!['entrada','saida'].includes(l.tipo))throw new RuleError('Transferência se desfaz com outra transferência.');
  if(!String(motivo||'').trim())throw new RuleError('Diga o motivo do estorno.');
  const comp=(W.FC&&FC.comp)?FC.comp(l):(l.data_competencia||l.data);
  const novo=FC.novoLancamento({data:today(),data_caixa:today(),data_competencia:comp,tipo:l.tipo==='saida'?'entrada':'saida',valor:+l.valor,
    favorecido:l.favorecido,descricao:'ESTORNO de '+l.id+' · '+(l.descricao||'')+' — '+String(motivo).trim(),cdc:l.cdc,conta:l.conta,obra_id:l.obra_id||'',sem_obra:!l.obra_id,
    unidade:l.unidade,centro_custo:l.centro_custo,fonte:'estorno',estorno_de:l.id,motivo:'estorno de '+l.id+': '+String(motivo).trim(),fd1:true,revisao:false});
  l.estornado_por=novo.id;l.estornado_em=today();l.estorno_motivo=String(motivo).trim();
  try{if(W.FIL&&S.db.fin.filial_ovr&&S.db.fin.filial_ovr[l.id])S.db.fin.filial_ovr[novo.id]=S.db.fin.filial_ovr[l.id]}catch(e){}
  try{log('fin',l.id,'estornado por '+novo.id+' — '+String(motivo).trim())}catch(e){}
  return novo.id};
transacao('estornarMov');
/* F06b · o resultado da obra (viagemDaObra, "planilha", DRE por obra, filial) só soma SAÍDAS com obra — a entrada
   do estorno era ignorada e a obra continuava pagando o lançamento errado. O par original+estorno vale zero,
   então o cálculo da obra roda sem os dois (mesmo padrão que Q.totais usa para filtrar unidades). */
/* ------------------------------------------------------------------------------------------------------------
   F07 · Peça usada numa OS do Pós-venda não saía do estoque. FPV.addPeca só guardava um texto + custo digitado:
   o custo ia para a obra, mas a unidade continuava "livre" no Estoque — a mesma peça podia ser vendida de novo
   e o estoque nunca batia com o que foi usado.
   Conserto: FPV.addPecaEstoque(os, unidade) — a peça vem de uma unidade LIVRE do estoque: ela sai pela porta da
   Baixa (A.baixa, com quem autorizou e o motivo "usada na OS …", gera a saída), o nome e o custo vêm da própria
   unidade (ninguém redigita) e a linha da peça guarda a unidade_id. Remover a peça da OS devolve a unidade.
   Na tela da OS aparece "Peça do estoque" (lista das unidades livres).
   ------------------------------------------------------------------------------------------------------------ */
safe('F07 peças do estoque',()=>{
  if(!W.FPV||typeof FPV.addPeca!=='function'||FPV.addPecaEstoque)return;
  FPV.addPecaEstoque=function(os_id,uid_,quem){const os=get('os',os_id);if(!os)throw new RuleError('OS não encontrada.');
    const u=get('unidades',uid_);if(!u)throw new RuleError('Escolha a unidade do estoque.');
    const b=(typeof bucketOf==='function')?bucketOf(u):u.estado;
    if(u.estado!=='livre'||b!=='livre')throw new RuleError('Só uma unidade LIVRE sai para uma OS ('+u.serie+' está '+(b||u.estado)+').');
    if(FPV.pecas(os).some(x=>x.unidade_id===uid_))throw new RuleError('Esta unidade já está nesta OS.');
    const pr=get('produtos',u.produto_id)||{};const custo=+u.custo>0?+u.custo:(+pr.custo||0);
    const nome=(String(pr.nome||'peça').split(' — ')[0])+' · série '+u.serie;
    FPV.addPeca(os_id,nome,1,custo);
    A.baixa(uid_,'Peça usada na '+os_id+(os.tipo?' ('+os.tipo+')':''),quem||((typeof me==='function'&&me()&&me().login)||'bruno.pozzani'));
    const os2=get('os',os_id);const pc=FPV.pecas(os2)[FPV.pecas(os2).length-1];pc.unidade_id=uid_;pc.serie=u.serie;pc.produto_id=u.produto_id;
    const sa=(S.db.saidas||[]).filter(s=>(s.unidade_ids||[]).includes(uid_)).pop();if(sa){sa.os_id=os_id;sa.tipo_os='peça de OS'}
    put('os',os2,'peça do estoque na OS: '+u.serie);return pc.id};
  const _del=FPV.delPeca;FPV.delPeca=function(os_id,pid){const os=get('os',os_id);const pc=os&&FPV.pecas(os).find(x=>x.id===pid);const r=_del.apply(this,arguments);
    try{if(pc&&pc.unidade_id){const u=get('unidades',pc.unidade_id);if(u&&u.estado==='baixado'){const x=Object.assign({},u,{estado:'livre',local:''});try{x.loc_id=(L.racks()[0]||{}).id||u.loc_id;x.local=locStr(x)}catch(e){}put('unidades',x,'peça devolvida da '+os_id)}}}catch(e){console.warn('F07 devolver',e)}return r};
  ['addPecaEstoque'].forEach(k=>{const f=FPV[k];FPV[k]=function(){const snap=JSON.stringify({u:S.db.unidades,s:S.db.saidas,o:S.db.os});try{return f.apply(this,arguments)}catch(e){try{const b=JSON.parse(snap);S.db.unidades=b.u;S.db.saidas=b.s;S.db.os=b.o}catch(_){}throw e}}});
  FPV.novaPecaEstoque=function(os_id){return run(()=>FPV.addPecaEstoque(os_id,(document.getElementById('v124_pc_un')||{}).value),'Peça saiu do estoque para a OS')};
  /* a tela da OS: ao lado do lançamento de peça digitada, a peça do estoque */
  const _rm=W.renderMain;if(typeof _rm==='function'&&!_rm.__v124p){const rm=function(){const r=_rm.apply(this,arguments);try{const inp=document.getElementById('fpv_pc_nome');
      if(inp&&!document.getElementById('v124_pc_un')){const row=inp.closest('.row');const m=(location.hash.match(/OS[^/&]*\d+/)||[])[0];
        const osId=(FPV.ui&&FPV.ui.os)||(typeof FPV.argOS==='function'?FPV.argOS():null)||(m?decodeURIComponent(m):null);
        const livres=(S.db.unidades||[]).filter(u=>u.estado==='livre'&&(typeof bucketOf!=='function'||bucketOf(u)==='livre'));
        const d=document.createElement('div');d.className='row g-2 align-items-end mt-1';d.id='v124_pc_box';
        d.innerHTML='<div class="col-md-8"><label class="sub" style="font-size:11px">Peça do estoque (sai do estoque pela Baixa, custo da própria unidade)</label><select class="form-select form-select-sm" id="v124_pc_un">'+livres.map(u=>{const p=get('produtos',u.produto_id)||{};return '<option value="'+u.id+'">'+String(p.nome||'').split(' — ')[0].replace(/</g,'&lt;')+' · '+u.serie+' · R$ '+(+u.custo||+p.custo||0).toLocaleString('pt-BR',{minimumFractionDigits:2})+'</option>'}).join('')+'</select></div><div class="col-md-4"><button class="btn-soft" '+(osId?'onclick="FPV.novaPecaEstoque(\''+String(osId).replace(/'/g,"\\'")+'\')"':'disabled')+'>Usar peça do estoque</button></div>';
        if(row&&row.parentNode)row.parentNode.insertBefore(d,row.nextSibling)}}catch(e){console.warn('F07 ui',e)}return r};rm.__v124p=true;Object.keys(_rm).forEach(k=>{try{rm[k]=_rm[k]}catch(e){}});W.renderMain=rm}
});

/* ------------------------------------------------------------------------------------------------------------
   F08 · A OS aberta a partir de uma obra entregue não herdava nada: A.abrirOS guardava a obra só como TEXTO
   (os.obra), sem obra_id, sem a proposta e sem os equipamentos. O Pós-venda redigitava o que a obra já tinha e
   FPV.obraOrigem precisava adivinhar a obra pelo nome (garantia sem obra = custo no lugar errado).
   Conserto: quando a OS nasce de uma obra (id), ela recebe obra_id, a proposta vendida dessa obra
   (proposta_id) e a lista dos equipamentos instalados (produto · série · unidade), lidos das unidades
   entregues — nada redigitado.
   ------------------------------------------------------------------------------------------------------------ */
safe('F08 abrirOS herda',()=>{
  const f=A.abrirOS;if(typeof f!=='function'||f.__v124)return;
  const g=function(d){d=Object.assign({},d||{});const o=d.obra&&get('obras',d.obra);const antes=new Set((S.db.os||[]).map(x=>x.id));
    const r=f.call(this,d);
    const os=(S.db.os||[]).find(x=>!antes.has(x.id));if(!os)return r;
    if(o){os.obra_id=o.id;os.obra=o.nome;os.desc=(d.titulo||'')+' — '+o.nome;
      const ps=(S.db.propostas||[]).filter(p=>p.obra_id===o.id&&SOLD.includes(p.estado));const p=ps[0];
      if(p){os.proposta_id=p.id;os.proposta_numero=p.numero}
      os.equipamentos=(S.db.unidades||[]).filter(u=>u.estado==='entregue'&&ps.some(x=>x.id===u.proposta_id)).map(u=>({unidade_id:u.id,produto_id:u.produto_id,serie:u.serie,nome:String((get('produtos',u.produto_id)||{}).nome||'').split(' — ')[0]}));
      put('os',os,'OS herdou obra, proposta e equipamentos')}
    return os.id};
  g.__v124=true;A.abrirOS=g});

safe('F06b obra sem pares estornados',()=>{
  const semPares=(obj,k)=>{const _o=obj&&obj[k];if(typeof _o!=='function'||_o.__v124e)return;
    const g=function(){const F=S.db.fin;const all=F&&F.lancamentos;
      if(!Array.isArray(all)||!all.some(l=>l.estorno_de||l.estornado_por))return _o.apply(this,arguments);
      F.lancamentos=all.filter(l=>!l.estorno_de&&!l.estornado_por);try{return _o.apply(this,arguments)}finally{F.lancamentos=all}};
    g.__v124e=true;Object.keys(_o).forEach(x=>{try{g[x]=_o[x]}catch(e){}});obj[k]=g};
  /* FN.obra (resultado e quadro da obra), FS.dre / FS.dreMeses (DRE do mês por competência soma 204.x por obra),
     FS.obraRow e a ficha da obra (obraDetalhe lê viagemDaObra direto) */
  /* FN.obra NÃO é embrulhado aqui: o módulo do Pós-venda (FIN-POSVENDA-01) prova a cada leitura que a função viva
     FN.obra ainda passa pelo embrulho dele, e num sistema sem venda confirmada a prova não tem obra para chamar →
     cartão vermelho "[FPV] GUARDA". A obra é corrigida por dentro, em FX2.buckets (F06c). */
  if(typeof FS==='object'){semPares(FS,'dre');semPares(FS,'dreMeses');semPares(FS,'obraRow')}
  semPares(W,'obraDetalhe')});

/* ------------------------------------------------------------------------------------------------------------
   F10 · Proposta CONCLUÍDA (entrega técnica registrada) que ainda deve unidades sumia da demanda do Estoque:
   Q.demanda só lê propostas vendida/em_obra. Na história, 2 caixas A voltaram da obra sem uso antes da entrega;
   com a obra entregue a proposta continuava dizendo 10 A, mas o Estoque passava a tratar as 2 como livres
   (vendáveis para outro cliente) e o Ret/Troc recusava a troca: "Só dá para retirar o que ainda está pendente
   (0 de 10)" — a proposta ficava presa. A regra do próprio Ret/Troc diz que proposta vendida (inclui concluída)
   só muda por Ret/Troc formal.
   Conserto: uma proposta concluída que já entregou unidades pelo sistema e ainda deve alguma continua na
   demanda (só o que ela deve: entregue conta como entregue). Concluída que não deve nada não muda nada.
   ------------------------------------------------------------------------------------------------------------ */
safe('F10 demanda de concluída que deve',()=>{
  if(typeof Q!=='object'||typeof Q.demanda!=='function'||Q.demanda.__v124)return;
  const _d=Q.demanda;const g=function(){const rows=_d.apply(this,arguments);try{
    const ja=new Set(rows.map(r=>r.pr));
    (S.db.propostas||[]).filter(p=>p.estado==='concluida'&&!ja.has(p.id)).forEach(p=>{
      const by={};blocosDe(p).forEach(b=>(b.itens||[]).forEach(l=>{const pid=l.substituto||l.produto_id;by[pid]=(by[pid]||0)+(+l.qtd||0)}));
      const ent={};let n=0;(S.db.unidades||[]).forEach(u=>{if(u.proposta_id===p.id&&['entregue','separado','montagem','kit'].includes(u.estado)){ent[u.produto_id]=(ent[u.produto_id]||0)+1;n++}});
      if(!n)return;const deve=Object.entries(by).some(([pid,q])=>{const pr=get('produtos',pid);return pr&&pr.rastreio!=='medido'&&q>(ent[pid]||0)});if(!deve)return;
      Object.entries(by).forEach(([pid,qtd])=>{let need=null;try{need=Q.needDate(p.id,pid)}catch(e){}rows.push({pr:p.id,pid,qtd,need})})});
  }catch(e){console.warn('F10',e)}return rows};
  g.__v124=true;Object.keys(_d).forEach(k=>{try{g[k]=_d[k]}catch(e){}});Q.demanda=g});

/* ------------------------------------------------------------------------------------------------------------
   F11 · Ret/Troc que muda o que o cliente paga passava sem a Diretoria. RT.proximo só chama a Diretoria se a
   margem cair ≥ queda_margem_pp (2 pp); a regra regras.rt.delegacao_limite (R$ 3.000 — até onde o Comercial
   decide sozinho) estava gravada na Base mas nenhum código a lia. Na história, +R$ 8.906,40 cobrados do cliente
   iam de "cliente aceitou" direto para o Financeiro.
   Conserto: a simulação também pede a Diretoria quando a diferença para o cliente (cobrança ou crédito) ou o
   valor absorvido pela TAAG passa do limite de delegação. Diretoria + Financeiro aprovam antes de valer.
   F12 · O item adicionado por Ret/Troc virava uma SEGUNDA linha do mesmo produto no mesmo ambiente
   ("Theva N2 ×5" + "Theva N2 ×2"): a proposta e a obra mostravam o produto duas vezes (regra: uma linha por
   produto). Conserto: na liberação, se o ambiente já tem o produto com o MESMO preço, a quantidade soma na
   linha existente (a linha guarda rt = número do Ret/Troc e o histórico fica no consolidado e no RT).
   ------------------------------------------------------------------------------------------------------------ */
safe('F11/F12 Ret/Troc',()=>{
  const RT=W.RT61;if(!RT||typeof RT.simular!=='function'||RT.simular.__v124)return;
  const _s=RT.simular;const s=function(rt){const r=_s.apply(this,arguments);try{if(r&&rt&&rt.status!=='liberado'){
      const lim=+((S.db.regras&&S.db.regras.rt)||{}).delegacao_limite||0;const vol=Math.max(Math.abs(+r.deltaCliente||0),Math.abs(+r.absorvido||0));
      if(lim>0&&vol>lim&&!r.precisaDiretoria){r.precisaDiretoria=true;r.motivoDiretoria='diferença de '+vol.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+' passa do limite de delegação ('+lim.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+')'}}}catch(e){}return r};
  s.__v124=true;RT.simular=s;
  const _a=RT.aplicar;if(typeof _a==='function'){RT.aplicar=function(rt){const r=_a.apply(this,arguments);try{const p=get('propostas',rt.proposta_id);let mudou=false;
      blocosDe(p).forEach(b=>{const vis={};b.itens=(b.itens||[]).filter(l=>{const k=(l.substituto||l.produto_id)+'|'+r2(l.preco_unit!=null?l.preco_unit:l.preco)+'|'+(l.ocultar?1:0);const o=vis[k];
        if(o){o.qtd=(+o.qtd||0)+(+l.qtd||0);o.rt=l.rt||o.rt;mudou=true;return false}vis[k]=l;return true})});
      if(mudou){syncItens(p);put('propostas',p,'Ret/Troc '+rt.numero+': quantidades somadas na linha do produto')}}catch(e){console.warn('F12',e)}return r}}
});

/* ------------------------------------------------------------------------------------------------------------
   F13 · A vista do cliente (Modo Cliente — a página que vira PDF/impressão) não trazia as CONDIÇÕES DE
   PAGAMENTO: mostrava cliente, ambientes, quantidades e o total, mas o cliente não via sinal, parcelas, datas
   nem a forma de pagamento que o vendedor fechou. Conserto: a vista ganha o quadro "Condições de pagamento",
   lido do mesmo plano que o Financeiro usa (p.fin.plano_pag; antes da confirmação, o Fechamento), com cada
   parcela em R$ pt-BR somando o total, e os aditivos de Ret/Troc.
   ------------------------------------------------------------------------------------------------------------ */
safe('F13 condições no modo cliente',()=>{
  const f=SCREENS.editor;if(typeof f!=='function'||f.__v124c)return;
  const R=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const dB=d=>d?String(d).slice(0,10).split('-').reverse().join('/'):'—';
  const g=function(id){const h=f.apply(this,arguments);try{if(typeof h!=='string'||h.indexOf('TAAG LIFE EXPERIENCE')<0||h.indexOf('data-v124-cond')>=0)return h;
    const p=get('propostas',id);if(!p)return h;const ad=((p.fin||{}).aditivos||[]);const base=r2(M.total(p)-ad.reduce((a,x)=>a+(+x.valor||0),0));
    let rows=[];const pl=(p.fin&&Array.isArray(p.fin.plano_pag)&&p.fin.plano_pag.length)?p.fin.plano_pag:null;
    if(pl)rows=pl.map(x=>[x.lb||'Parcela',dB(x.data),r2(base*(+x.pct||0)/100)]);
    else{const fe=p.fechamento||{};const sp=+fe.sinal_pct||0;const n=fe.forma==='À vista'?1:Math.max(1,+fe.parcelas||1);const sinal=r2(base*sp/100);if(sp>0)rows.push(['Sinal '+sp+'%','na assinatura',sinal]);
      for(let i=0;i<n;i++){let d='';try{const x=new Date((fe.primeiro||today())+'T12:00:00');x.setMonth(x.getMonth()+i);d=x.toISOString().slice(0,10)}catch(e){}rows.push(['Parcela '+(i+1)+'/'+n,dB(d),r2((base-sinal)/n)])}}
    ad.forEach(x=>rows.push([x.desc||'Aditivo',dB(x.data),r2(x.valor)]));
    const soma=r2(rows.reduce((a,x)=>a+x[2],0));const fe=p.fechamento||{};
    const card=`<div class="card p-3 mt-3" data-v124-cond="1" data-soma="${soma}" data-total="${r2(M.total(p))}"><h6 class="mb-1">Condições de pagamento</h6><div class="sub mb-2" style="font-size:12px">${fe.forma||'Parcelado'}${fe.metodo?' · '+fe.metodo:''}</div><table class="tbl no-filter" style="width:100%"><tbody>${rows.map(x=>`<tr><td>${x[0]}</td><td class="sub">${x[1]}</td><td class="text-end mono">${R(x[2])}</td></tr>`).join('')}<tr style="font-weight:800"><td>Total</td><td></td><td class="text-end mono">${R(soma)}</td></tr></tbody></table></div>`;
    const k='Preços de custo, margem e misc não existem nesta vista';const i=h.indexOf(k);if(i<0)return h+card;const j=h.lastIndexOf('<',i);return h.slice(0,j)+card+h.slice(j)}catch(e){console.warn('F13',e);return h}};
  g.__v124c=true;Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});SCREENS.editor=g});

/* ------------------------------------------------------------------------------------------------------------
   F14 · "Registrar recebimento" / "Pagar" num título JÁ baixado somava (ou tirava) o valor do caixa DE NOVO:
   A.receber/A.pagar não olham pago_em. Dois cliques (ou a tela atrás de um toast lento) = caixa em dobro —
   na história, receber o sinal duas vezes levava o caixa de R$ 37.690 para R$ 67.690.
   Conserto: título já baixado é recusado na porta, e as duas ações viram transação (nada fica pela metade).
   ------------------------------------------------------------------------------------------------------------ */
safe('F14 baixa em dobro',()=>{
  const porta=nm=>function(lid){const l=get('lancamentos',lid);if(!l)throw new RuleError('Título não encontrado.');
    if(l.pago_em)throw new RuleError('Este título já foi '+(l.tipo==='pagar'?'pago':'recebido')+' em '+String(l.pago_em).split('-').reverse().join('/')+' — nada foi lançado de novo.')};
  transacao('receber',porta('receber'));transacao('pagar',porta('pagar'))});

/* ------------------------------------------------------------------------------------------------------------
   F15 · "Começar do zero" sumiu do Início. A camada v113 coloca o botão procurando o HTML exato
   onclick="reset();render()" do botão Resetar dados; o Início novo (logo + "Resumo dos departamentos") tem
   onclick="reset()" e ainda esconde o bloco antigo (inicio-old hidden) — o regex não casa e o botão nunca é
   desenhado; só restava em Base › Mapa de entidades. Conserto: o botão volta para a faixa visível do Início,
   ao lado de "Resumo dos departamentos", com o mesmo estilo.
   ------------------------------------------------------------------------------------------------------------ */
safe('F15 começar do zero no Início',()=>{
  const f=SCREENS.home;if(typeof f!=='function'||f.__v124z)return;
  const g=function(){const h=f.apply(this,arguments);if(typeof h!=='string')return h;
    const bz='<button class="inicio-more-btn" type="button" style="margin-left:8px" onclick="MG.zerar()" title="Esvazia o sistema para seguir o Manual operacional desde o primeiro passo"><i class="bi bi-eraser"></i> Começar do zero</button>';
    const k='<div class="inicio-more">';const i=h.indexOf(k);
    if(i>=0){const vis=h.slice(i,h.indexOf('</div>',i));if(vis.indexOf('MG.zerar()')>=0)return h;const j=h.indexOf('</button>',i);return j<0?h:h.slice(0,j+9)+bz+h.slice(j+9)}
    if(h.indexOf('MG.zerar()')>=0)return h;return h.replace(/(<button class="btn-soft" onclick="reset\(\)")/,bz.replace('inicio-more-btn','btn-soft')+'$1')};
  g.__v124z=true;Object.keys(f).forEach(k=>{try{g[k]=f[k]}catch(e){}});SCREENS.home=g});

/* ------------------------------------------------------------------------------------------------------------
   F16 · O CRM não começava vazio no "Começar do zero" e acumulava cópias. As tabelas do CRM moram em outra
   chave (systaag_crm_t) e a limpeza do modo zero só esvazia parceiros/contatos/interações/tarefas: ficavam
   347 vínculos De/Para apontando para parceiros que não existem mais, 13 usuários e 20 responsáveis da base de
   demonstração (vendedores apagados aparecendo nos seletores do CRM). E cada vez que uma pessoa era cadastrada
   de novo, a ligação pessoa→responsável criava OUTRA linha "MARIANA COSTA" (a antiga apontava para um id de
   pessoa apagado) — 13 cópias depois de 13 rodadas.
   Conserto: (a) responsável repetido (mesmo nome e papel) fica uma vez só, a linha ligada a uma pessoa viva
   vence; (b) no modo zero: De/Para órfão sai, responsável sem pessoa viva sai, usuário do CRM que não é
   usuário do sistema sai. Roda no carregamento, no "Começar do zero" e depois de cada gravação.
   ------------------------------------------------------------------------------------------------------------ */
const nzK=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
function limparCRM(){const T=W.CRM_T;if(!T||typeof T!=='object')return 0;let n=0;const zero=!!S.db.af113_zero;
  const vivas=new Set((S.db.pessoas||[]).filter(p=>p.ativo!==false&&!p.desligado).map(p=>p.id));
  const nomesVivos=new Set((S.db.pessoas||[]).filter(p=>p.ativo!==false).flatMap(p=>[nzK(p.nome),nzK(p.nomeCompleto)]).filter(Boolean));
  if(Array.isArray(T.responsaveis)){const best={};
    T.responsaveis.forEach(r=>{const k=nzK(r.nome)+'|'+r.tipo;const b=best[k];const viva=r.pessoa_id&&vivas.has(r.pessoa_id);if(!b||(viva&&!(b.pessoa_id&&vivas.has(b.pessoa_id))))best[k]=r});
    const antes=T.responsaveis.length;
    T.responsaveis=T.responsaveis.filter(r=>{if(best[nzK(r.nome)+'|'+r.tipo]!==r)return false;
      if(zero){if(r.pessoa_id)return vivas.has(r.pessoa_id);return nomesVivos.has(nzK(r.nome))}return true});
    n+=antes-T.responsaveis.length}
  if(zero){
    if(Array.isArray(T.depara)){const ids=new Set((S.db.parceiros||[]).map(p=>+p.crm_id));const a=T.depara.length;T.depara=T.depara.filter(d=>d.parceiro_id!==''&&d.parceiro_id!=null&&ids.has(+d.parceiro_id));n+=a-T.depara.length}
    if(Array.isArray(T.usuarios)){const us=(S.db.usuarios||[]);const ok=u=>us.some(x=>nzK(x.nome)===nzK(u.nome)||(x.login&&String(u.login||'').toLowerCase()===String(x.login).toLowerCase())||(x.email&&String(u.email||'').toLowerCase()===String(x.email).toLowerCase()));
      const a=T.usuarios.length;T.usuarios=T.usuarios.filter(ok);n+=a-T.usuarios.length}}
  if(n){try{W.CRM_persistT&&CRM_persistT()}catch(e){}}return n}
FX.limparCRM=limparCRM;
safe('F16 CRM limpo',()=>{
  const n=limparCRM();if(n)nota('F16',n+' sobras do CRM removidas');
  const _s=W.save;if(typeof _s==='function'&&!_s.__v124crm){const s=function(){const r=_s.apply(this,arguments);try{limparCRM()}catch(e){}return r};s.__v124crm=true;Object.keys(_s).forEach(k=>{try{s[k]=_s[k]}catch(e){}});W.save=s}
  const _z=W.aplicarZero;if(typeof _z==='function'&&!_z.__v124crm){const z=function(){const r=_z.apply(this,arguments);try{limparCRM()}catch(e){}return r};z.__v124crm=true;Object.keys(_z).forEach(k=>{try{z[k]=_z[k]}catch(e){}});W.aplicarZero=z}});

/* ------------------------------------------------------------------------------------------------------------
   F18 · Oportunidade criada no CRM ficava parada em "DESENVOLVER PROPOSTA" no CRM para sempre. O CRM lê
   n.status_pipeline (gravado na criação); só A.moverEtapa/A.fecharDeal o atualizam — mas o Vendido fecha o
   negócio direto (n.resultado='fechada') e o Montar proposta muda a etapa direto (n.etapa='desenvolvida').
   Resultado: CRM › Oportunidades e o Painel de Gestão mostravam a venda de R$ 100.000 como "Em andamento ·
   Desenvolver proposta", 0 fechadas. Conserto: a cada gravação, o status do CRM segue o negócio do Comercial
   (resultado manda; senão a etapa).
   ------------------------------------------------------------------------------------------------------------ */
const ETAPA_CRM={desenvolver:'DESENVOLVER PROPOSTA',desenvolvida:'PROPOSTA DESENVOLVIDA',aguardando:'AGUARDANDO APRESENTAÇÃO',enviada:'PROPOSTA ENVIADA',revisao:'REVISÃO DE PROPOSTA'};
const RES_CRM={fechada:'FECHADO',perdida:'PERDIDO',futuro:'FUTURO'};
function syncStatusCRM(){let n=0;(S.db.negociacoes||[]).forEach(d=>{if(!d.status_pipeline)return;let alvo=null;
  if(d.resultado&&RES_CRM[d.resultado])alvo=RES_CRM[d.resultado];else if(!d.resultado&&ETAPA_CRM[d.etapa]&&Object.values(ETAPA_CRM).concat(Object.values(RES_CRM)).includes(d.status_pipeline))alvo=ETAPA_CRM[d.etapa];
  if(alvo&&alvo!==d.status_pipeline){d.status_pipeline=alvo;if(d.resultado&&d.resultado!=='futuro'&&!d.data_decisao)d.data_decisao=d.movido||today();n++}});return n}
FX.syncStatusCRM=syncStatusCRM;
safe('F18 status da oportunidade no CRM',()=>{syncStatusCRM();const _s=W.save;if(typeof _s!=='function'||_s.__v124st)return;const s=function(){try{syncStatusCRM()}catch(e){}return _s.apply(this,arguments)};s.__v124st=true;Object.keys(_s).forEach(k=>{try{s[k]=_s[k]}catch(e){}});W.save=s});

/* ------------------------------------------------------------------------------------------------------------
   F17 · "Criar oportunidade" do CRM dava TypeError depois de criar: o botão chama
   window.__crmFrameWin().systaagReload, e __crmFrameWin() devolve null enquanto o frame do CRM ainda não foi
   aberto nesta sessão (ex.: oportunidade criada pelo atalho do Comercial ou logo depois de um F5). A oportunidade
   nascia, mas o modal não fechava e o erro ia para o console. Conserto: sem frame, devolve um objeto vazio.
   ------------------------------------------------------------------------------------------------------------ */
safe('F17 frame do CRM',()=>{const f=W.__crmFrameWin;if(typeof f!=='function'||f.__v124)return;const g=function(){let r=null;try{r=f.apply(this,arguments)}catch(e){}return r||{}};g.__v124=true;W.__crmFrameWin=g});

/* ------------------------------------------------------------------------------------------------------------
   F09 · O custo da garantia ia para a filial ERRADA. FPV.fechar grava os movimentos da OS com obra_id vazio
   (o custo é atribuído à obra pela marca fpv_obra_origem), e FIL.doLanc, sem obra_id, manda tudo para
   "Administrativo". Regra do Bruno: TUDO da obra — de todos os departamentos — vai para a filial da proposta.
   Conserto: movimento de Pós-venda com obra de origem segue a filial dessa obra (exceção manual do Financeiro
   continua valendo).
   ------------------------------------------------------------------------------------------------------------ */
safe('F09 filial da garantia',()=>{
  if(!W.FIL||typeof FIL.doLanc!=='function'||FIL.doLanc.__v124)return;
  const _d=FIL.doLanc;const f=function(l){const r=_d.apply(this,arguments);try{
    if(l&&!l.obra_id&&l.fpv_obra_origem&&!((S.db.fin&&S.db.fin.filial_ovr)||{})[l.id]){const o=get('obras',l.fpv_obra_origem);if(o)return FIL.daObra(o)}}catch(e){}return r};
  f.__v124=true;FIL.doLanc=f});
(function(){const f=SCREENS.finlanc;if(typeof f!=='function')return;
  SCREENS.finlanc=function(arg){const h=f.apply(this,arguments);if(typeof h!=='string'||h.indexOf('data-v124-estorno')>=0)return h;
    return h.replace(/(<[^>]*onclick="FUI\.editar\('([^']+)'\)"[^>]*>[\s\S]*?<\/(?:button|a|i|span)>)/g,(m,b,id)=>{const l=((S.db.fin||{}).lancamentos||[]).find(x=>x.id===id);
      if(!l||!['entrada','saida'].includes(l.tipo))return b;
      if(l.estornado_por)return b+`<span class="chip" data-v124-estorno="${id}" title="estornado por ${l.estornado_por} — ${(l.estorno_motivo||'').replace(/"/g,'&quot;')}" style="font-size:10px;margin-left:4px">estornado</span>`;
      if(l.estorno_de)return b+`<span class="chip warn" data-v124-estorno="${id}" title="estorno de ${l.estorno_de}" style="font-size:10px;margin-left:4px">estorno</span>`;
      return b+`<button class="btn-soft" data-v124-estorno="${id}" style="padding:1px 6px;font-size:11px;margin-left:4px" title="Cria o movimento contrário, com o mesmo código, obra e competência — os dois ficam no histórico" onclick="event.stopPropagation();const m=ask('Motivo do estorno de ${id}','');if(m)run(()=>A.estornarMov('${id}',m),'Estornado — o original e o estorno ficam no histórico')">Estornar</button>`})}})();

})();

/* F19 · Comercial › Pipeline: the four headline boxes (Fechadas · No futuro · Perdidas · Em jogo) only set
   pipeView='jogo' — the view they were already on — so "Fechadas 1 · R$ 108.906" opened nothing. Owner's rule:
   a clickable number lands on a screen already filtered to exactly that number. Each box now opens the deal
   list (#/negs) filtered by its result; "No futuro" opens the deals still in play. */
(function(){
  if(typeof SCREENS!=='object'||typeof SCREENS.pipeline!=='function'||SCREENS.pipeline.__f19)return;
  var MAP={'Fechadas':'fechada','Perdidas':'perdida','Em jogo':'jogo','No futuro':'jogo'};
  var _p=SCREENS.pipeline;
  SCREENS.pipeline=function(){var h=_p.apply(this,arguments);if(typeof h!=='string')return h;
    Object.keys(MAP).forEach(function(lb){
      var a='onclick="S.pipeView=\'jogo\';render()"><div class="sub" style="font-size:12px">'+lb+'</div>';
      var b='onclick="S.negF={res:\''+MAP[lb]+'\'};location.hash=\'#/negs\'" title="Abrir a lista filtrada"><div class="sub" style="font-size:12px">'+lb+'</div>';
      h=h.split(a).join(b)});
    return h};
  SCREENS.pipeline.__f19=true;
  try{if(typeof route==='function'&&route().k==='pipeline')renderMain()}catch(e){}
})();

/* F20 · every "door" into the deal list (Pipeline boxes, the "N fechadas / perdidas / em jogo" phrase via negGo)
   sets S.negF and goes to #/negs — but #/negs is redirected to Comercial › Gestão (FX2.legacy, one screen per
   idea), and Gestão never read S.negF, so the door opened the whole company unfiltered. Gestão now honours
   S.negF: every number on it is computed over the deals that match, and a chip says which filter is on. */
(function(){
  if(typeof SCREENS!=='object'||typeof SCREENS.gestao!=='function'||SCREENS.gestao.__f20)return;
  var LB={fechada:'fechadas',perdida:'perdidas',jogo:'em jogo',decidida:'decididas'};
  var _g=SCREENS.gestao;
  window.__negLimpar=function(){S.negF=null;try{renderMain()}catch(e){render()}};
  SCREENS.gestao=function(){var F=S.negF;var on=F&&Object.keys(F).some(function(k){return F[k]});
    if(!on||typeof negMatch!=='function')return _g.apply(this,arguments);
    var all=S.db.negociacoes;var h;
    var allP=S.db.propostas;var sel=all.filter(function(n){return negMatch(n,F)});
    var ids={};sel.forEach(function(n){(n.proposta_ids||[]).forEach(function(i){ids[i]=1})});
    try{S.db.negociacoes=sel;S.db.propostas=allP.filter(function(p){return ids[p.id]||!all.some(function(n){return (n.proposta_ids||[]).indexOf(p.id)>=0})&&false});h=_g.apply(this,arguments)}finally{S.db.negociacoes=all;S.db.propostas=allP}
    if(typeof h==='string')h=h.replace(/Mostrando \d+ de \d+ negociações/,'Mostrando '+sel.length+' de '+all.length+' negociações');
    var txt='Mostrando '+sel.length+' de '+all.length+' negociações';[0,60,250].forEach(function(ms){setTimeout(function(){try{document.querySelectorAll('[data-comsearch] .sub').forEach(function(e){if(/^Mostrando \d+ de \d+ negocia/.test(e.textContent))e.textContent=txt})}catch(e){}},ms)});
    if(typeof h!=='string')return h;
    var desc=Object.keys(F).filter(function(k){return F[k]}).map(function(k){return k==='res'?(LB[F[k]]||F[k]):(k+': '+F[k])}).join(' · ');
    var chip='<div class="card p-2 mb-2 d-flex flex-row align-items-center gap-2" style="border-left:4px solid #0d6efd"><b>Filtro aplicado:</b> <span>'+desc+'</span> <span class="sub">— todos os números desta tela contam só estas negociações</span> <a href="javascript:void(0)" class="ms-auto" onclick="__negLimpar()">limpar filtro</a></div>';
    return chip+h};
  SCREENS.gestao.__f20=true;
  /* leaving Gestão drops the filter, so the next visit starts clean */
  window.addEventListener('hashchange',function(){try{var k=(location.hash.replace(/^#\/?/,'').split('/')[0]);if(k!=='gestao'&&k!=='negs')S.negF=null}catch(e){}});
})();

/* F21 · Estoque Geral (#/entradas) filled the eight count cells of each product row by ORDER, but collected the
   product ids with /estOpen\['(p[^']+)'\]/ — only ids starting with "p". Real catalogue products (Tabela Taag)
   have ids like "c218", so their rows got "Total 0 · Livre undefined", and with a mix of ids every row after the
   first catalogue product showed ANOTHER product's numbers. Now each row is re-filled from its own id. */
(function(){
  if(typeof SCREENS!=='object'||typeof SCREENS.entradas!=='function'||SCREENS.entradas.__f21)return;
  if(typeof tProduto!=='function'||typeof tupleCells!=='function')return;
  var _e=SCREENS.entradas;
  var RE=/(<tr class="rowlink" onclick="estOpen\['([^']+)'\]=!estOpen[\s\S]*?<td class="mono" style="font-size:12px">[^<]*<\/td>)((?:<td class="text-end">[\s\S]*?<\/td>){8})<\/tr>/g;
  SCREENS.entradas=function(){var h=_e.apply(this,arguments);if(typeof h!=='string')return h;
    return h.replace(RE,function(m,a,pid){var x;try{x=tProduto(pid)}catch(e){return m}if(!x||x.livre==null)return m;return a+tupleCells(Object.assign({},x,{cliente:x.cliente}))+'</tr>'})};
  SCREENS.entradas.__f21=true;
})();

/* F22 · "Qual inventário atende a obra?" is scheduled 60 ms after an obra is born and never re-checked: if the
   inventory was answered in between (or the obra already had one), the card still popped up over whatever screen
   was open — including the Visão CEO in front of the directors. It now asks only while the obra truly has none. */
(function(){
  if(!window.MG||typeof MG.perguntarInventario!=='function'||MG.perguntarInventario.__f22)return;
  var _a=MG.perguntarInventario;
  MG.perguntarInventario=function(oid){try{var o=get('obras',oid);if(!o||o.unidade)return}catch(e){}return _a.apply(this,arguments)};
  MG.perguntarInventario.__f22=true;
})();
