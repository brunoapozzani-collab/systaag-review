/* =====================================================================================================
   v165 · AS VENDAS DE 2026 VIRAM A PROPOSTA DE VERDADE (Bruno, 07/11/2026)
   Pedido: as 568 vendas do ano (R$ 20.046.262,59) = 104 propostas da METAS 2026 + 464 atendimentos do Pós-venda.
   As 104 propostas deixam de ser só um valor: cada uma recebe os ambientes, produtos, quantidades, preços,
   miscelâneas, diárias e o CUSTO escritos no arquivo Excel da proposta (Drive Comercial), como na Proposta Interna.
   Regras do Bruno (07/11):
   · a versão vendida = o arquivo cujo TOTAL DESTA PROPOSTA é igual ao valor da METAS (o mais novo nem sempre é o vendido)
   · custo = o custo escrito no arquivo da proposta (não o catálogo de hoje)
   · vale qualquer .xlsb com a aba Proposta Interna que carregue o número (PROP, DEMO, FPBN…)
   · diferença pequena METAS × arquivo → produtos do arquivo, valor da METAS, a diferença aparece como ajuste
   · METAS muito abaixo do arquivo = só parte foi vendida → não carrega produtos até achar o arquivo certo (lista)
   · número da METAS digitado errado → o arquivo é achado pelo nome do cliente (13382 Luan e Sonja = 13282; 13033 Pongada = 13303)
   · fones da Focal sem arquivo → só o valor, com a marca "sem arquivo"
   O valor da venda continua sendo o da METAS (v142). A ponte fica à vista em cada proposta:
   equipamentos + mão de obra + ajuste = valor vendido. Re-executável: chave REV; nada é duplicado.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v165)return;window.__v165=true;
if(typeof S==='undefined'||!S.db)return;
const D=window.V165_XL;if(!D||!Array.isArray(D.props)){console.error('v165: v165-propostas-xl-data.js não carregou');return}
const REV='c';
const T=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R2=v=>'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'').trim();
const head=s=>String(s||'').split(' — ')[0];
const mkid=p=>T(()=>uid(p),p+Math.random().toString(36).slice(2,10));
const BY=new Map(D.props.map(x=>[x.id,x]));
const ST={CONFERE:['confere','✓ Arquivo confere com a METAS','#198754'],AJUSTE:['ajuste','≈ Arquivo com pequena diferença — mostrada como ajuste','#0d6efd'],PARCIAL:['parcial','◐ Só parte foi vendida — falta o arquivo da parte vendida','#fd7e14'],'A CONFIRMAR':['a confirmar','? Arquivo provável — total diferente da METAS; o Comercial confirma','#b8860b'],'SEM ARQUIVO':['sem','✗ Sem arquivo Excel no Drive','#6c757d']};
/* A CONFIRMAR (Bruno, 08/11): arquivo provável mostrado inteiro (produtos, miscelâneas, diárias, custo) mas FORA da proposta —
   não entra em estoque, custo ou margem; a venda segue com o valor da METAS. Ao confirmar, os produtos entram na proposta,
   o valor continua o da METAS e a diferença vira ajuste (igual às vendas "ajuste"). A confirmação fica em db.v165_conf e sobrevive a novas cargas. */
const CONF=()=>{const db=S.db;if(!db.v165_conf||typeof db.v165_conf!=='object')db.v165_conf={};return db.v165_conf};
const conf=id=>T(()=>CONF()[id],null);
const efet=x=>x.status==='A CONFIRMAR'&&conf(x.id)?'AJUSTE':x.status;

/* ── produtos: o mesmo produto do catálogo quando o modelo bate; senão um cadastro novo marcado "da proposta" ── */
let IDX=null;
function idx(){if(IDX)return IDX;IDX=new Map();(S.db.produtos||[]).forEach(p=>{const k=nz(head(p.nome));if(!k)return;(IDX.get(k)||IDX.set(k,[]).get(k)).push(p)});return IDX}
function produto(db,m,marca,desc,cu,pu,cat,tp,num){
  if(m==='(miscelânea sem produto)'){let g=db.produtos.find(p=>p._v165misc);if(!g){g={id:mkid('p'),nome:'Miscelânea — linha do Excel sem produto',marca:'TAAG',categoria:'Miscelânea',rastreio:'nenhum',custo:0,preco:0,tipo:'vb',fase:'instalacao',descricao:'Valor que o vendedor colocou numa linha da Proposta Interna sem modelo (só miscelânea).',fotos:[],portas:[],status:'OK',_v165misc:true};db.produtos.push(g)}return g}
  const k=nz(m);const c=idx().get(k)||[];
  let p=c.length===1?c[0]:c.find(x=>nz(x.marca)===nz(marca))||null;
  if(p)return p;
  p={id:mkid('p'),nome:m+(desc?' — '+String(desc).slice(0,90):''),marca:marca||'',categoria:cat&&cat!=='à definir'?cat:'Outros',rastreio:'serial',custo:+cu||0,preco:+pu||0,tipo:tp||'pç',fase:'instalacao',ncm:'',origem:'Nacional',unidade:'un',garantia_meses:12,cst:'',cod_fornecedor:'',apelido:'',nome_comercial:m,fornecedor:'',unidade_venda:'Unidade',desconto_max:0,descricao:'Cadastrado a partir da proposta nº '+num+' (arquivo Excel, 07/11/2026) — modelo não encontrado no catálogo; conferir.',fotos:[],portas:[],aprovado:false,status:'Revisar',revisar:true,_v165:num};
  db.produtos.push(p);(idx().get(k)||idx().set(k,[]).get(k)).push(p);return p}

/* ── a carga ── */
function carregar(db){let n=0,lin=0,novos0=(db.produtos||[]).length;
  D.props.forEach(x=>{const p=(db.propostas||[]).find(q=>q.id===x.id);if(!p)return;
    const cf=x.status==='A CONFIRMAR'?conf(x.id):null;const rv=REV+(cf?'+c':'');
    if(p.xl&&p.xl.rev===rv)return;const est=efet(x);
    if(x.status==='A CONFIRMAR'&&!cf&&p.xl&&p.xl.confirmado){p.blocos=[];p.ajuste=0}
    p.xl={rev:rv,quando:D.quando,status:est,status_dado:x.status,confirmado:cf||null,candidato:est==='A CONFIRMAR',obs:x.obs||'',arquivo:x.arquivo||'',link:x.link||'',total_arquivo:x.total_arquivo,ajustes_arquivo:x.ajustes_arquivo||0,
      valor_metas:x.valor_metas,serv_venda:x.serv_venda||0,custo_mo:x.custo_mo_arquivo||0,custo_eq:x.custo_eq_arquivo,equip_venda:x.equip_venda||0};
    if(x.blocos&&x.blocos.length&&est!=='A CONFIRMAR'){
      p.blocos=x.blocos.map(b=>({id:mkid('b'),nome:b.n,servicos:Object.assign({},b.s||{}),servicos_adj:Object.assign({},b.s||{}),misc_serv:+b.sm||0,serv_linhas:(+b.sm>0?[{id:mkid('sl'),tipo:'avulso',nome:'Miscelânea dos serviços (do arquivo)',valor:+b.sm,origem:'arquivo Excel da proposta'}]:[]),_xl_serv_venda:+b.sv||0,
        itens:b.i.map(([m,marca,desc,q,pu,mi,cu,cat,tp,ln])=>{const pr=produto(db,m,marca,desc,cu,pu,cat,tp,p.numero);lin++;
          return {id:mkid('l'),produto_id:pr.id,qtd:+q||0,preco_unit:+pu||0,custo_unit:+cu||0,misc:+mi||0,ocultar:false,numero_proposta:p.numero,fase:pr.fase||'instalacao',xl_linha:ln,xl_modelo:m}})}));
      p.ajuste=+x.ajuste||0;if(!Array.isArray(p.opcoes)){p.opcoes=['A'];p.opcao=p.opcao||'A'}if(!Array.isArray(p.versoes))p.versoes=p.versoes||[];
      if(x.rt!=null){p.rt_arquivo=x.rt;p.rt=Math.round(x.rt*1000)/10}if(x.bonif!=null){p.bonif_arquivo=x.bonif;p.bonificacao=Math.round(x.bonif*1000)/10}
    }
    n++});
  return {n,lin,novos:(db.produtos||[]).length-novos0}}

/* ── a mão de obra destas propostas é a do arquivo (venda e custo), não a tabela de diárias de hoje ── */
function motor(){if(typeof M!=='object'||!M||typeof M.serv!=='function'||M.serv.__v165)return;const _s=M.serv;
  M.serv=function(p){const r=_s.apply(this,arguments);if(!p||!p.xl||!(p.blocos&&p.blocos.length))return r;
    return Object.assign({},r,{venda:+p.xl.serv_venda||0,custo:+p.xl.custo_mo||0,misc:(p.blocos||[]).reduce((a,b)=>a+(+b.misc_serv||0),0),do_arquivo:true})};M.serv.__v165=1}

/* ── na tela da proposta: de onde vem + a ponte ── */
function previa(p){const x=BY.get(p.id);if(!x)return '';const bl=x.blocos||[];const dif=(x.valor_metas||0)-(x.total_arquivo||0);
  const amb=bl.map(b=>{const its=b.i.map(([m,mc,d,q,pu,mi,cu])=>`<tr><td><b>${E(m)}</b><div class="sub" style="font-size:11.5px">${E(String(d||'').slice(0,110))}</div></td><td>${E(mc)}</td><td class="text-end">${N0(q)}</td><td class="text-end">${R2(pu)}</td><td class="text-end">${R2(mi)}</td><td class="text-end">${R2(q*pu+mi)}</td><td class="text-end">${R2(q*cu)}</td></tr>`).join('');
    const di=Object.entries(b.s||{}).map(([k,v])=>`${E(k)} ${N0(v)} d`).join(' · ');
    return `<div class="mt-3"><b>${E(b.n)}</b>${its?`<table class="tbl mt-1"><thead><tr><th>Produto</th><th>Marca</th><th class="text-end">Qtd</th><th class="text-end">Preço unit.</th><th class="text-end">Miscelânea</th><th class="text-end">Venda</th><th class="text-end">Custo (arquivo)</th></tr></thead><tbody>${its}</tbody></table>`:''}`+
      (b.sv||b.sm?`<div class="sub mt-1" style="font-size:12.5px">Mão de obra ${R2(b.sv)}${di?' — diárias '+di:''}${b.sm?' · miscelânea dos serviços '+R2(b.sm):''}</div>`:'')+`</div>`}).join('');
  const ce=bl.reduce((a,b)=>a+b.i.reduce((c,it)=>c+it[3]*it[6],0),0);
  const ponte=bl.length?`<div class="mt-2" style="font-size:13px">No arquivo: equipamentos <b>${R2(x.equip_venda)}</b> + mão de obra <b>${R2(x.serv_venda)}</b> − AJUSTES <b>${R2(x.ajustes_arquivo||0)}</b> = total do arquivo <b>${R2(x.total_arquivo)}</b> · custo (arquivo): equipamentos ${R2(ce)} + mão de obra ${R2(x.custo_mo_arquivo||0)}</div>`:`<div class="mt-2" style="font-size:13px">Arquivo de projeto: só o valor (${R2(x.total_arquivo)}), sem lista de produtos.</div>`;
  return `<div class="mt-2" style="font-size:13px;background:#fff8e1;border-radius:8px;padding:8px 10px">METAS <b>${R2(x.valor_metas)}</b> − arquivo <b>${R2(x.total_arquivo)}</b> = diferença <b>${R2(dif)}</b>. Enquanto não confirmado, a venda vale o da METAS e nada deste arquivo entra em estoque, custo ou margem.</div>${ponte}${amb}`+
    `<div class="mt-3 d-flex gap-2 flex-wrap"><button class="btn" style="background:#b8860b;color:#fff" onclick="V165.confirmar('${E(p.id)}')">Confirmar: é este arquivo</button><span class="sub" style="font-size:12px;align-self:center">Ao confirmar: os produtos entram na proposta, o valor continua ${R2(x.valor_metas)} (METAS) e a diferença ${R2(dif)} vira ajuste.</span></div>`}
function cartao(p){const x=p.xl;if(!x)return '';const st=ST[x.status]||ST.CONFERE;
  const R=T(()=>M.resumo(p),null);const ev=T(()=>M.equip(p),{venda:0,custo:0,misc:0});const sv=T(()=>M.serv(p),{venda:0,custo:0});
  const tem=p.blocos&&p.blocos.length;const linhas=tem?p.blocos.reduce((a,b)=>a+b.itens.length,0):0;
  const ponte=tem?`<div class="mt-2" style="font-size:13px">Ponte: equipamentos <b>${R2(ev.venda)}</b> + mão de obra <b>${R2(sv.venda)}</b> ${p.ajuste<0?'−':'+'} ajuste <b>${R2(Math.abs(p.ajuste||0))}</b> = <b>${R2(ev.venda+sv.venda+(p.ajuste||0))}</b> = valor vendido na METAS <b>${R2(x.valor_metas)}</b>`+
    `<div class="sub" style="font-size:12px">O ajuste = o AJUSTES do arquivo (${R2(-(x.ajustes_arquivo||0))})${Math.abs((x.valor_metas||0)-(x.total_arquivo||0))>=0.01?` + a diferença METAS × arquivo (${R2((x.valor_metas||0)-(x.total_arquivo||0))})`:''}.</div>`+
    `<div class="mt-1">Mão de obra ${R2(sv.venda)} = diárias ${R2(sv.venda-(sv.misc||0))} + miscelânea dos serviços ${R2(sv.misc||0)} (as duas do arquivo).</div><div class="mt-1">Custo (do arquivo): equipamentos <b>${R2(ev.custo)}</b> + mão de obra <b>${R2(sv.custo)}</b> = <b>${R2(ev.custo+sv.custo)}</b> · ${N0(p.blocos.length)} ambientes · ${N0(linhas)} linhas</div></div>`:'';
  return `<div class="card p-3 mb-3" style="border-left:4px solid ${st[2]}"><div class="d-flex justify-content-between flex-wrap gap-2"><div><b style="color:${st[2]}">${E(st[1])}</b>`+
    `<div class="sub" style="font-size:12.5px">${x.arquivo?`${x.status==='PARCIAL'?'Arquivo mais próximo':'Arquivo'}: <a href="${E(x.link)}" target="_blank" rel="noopener">${E(x.arquivo)}</a> · total do arquivo ${R2(x.total_arquivo)}`:'Nenhum arquivo Excel desta venda no Drive'} · METAS ${R2(x.valor_metas)}${x.obs&&!x.confirmado?' · '+E(x.obs):''}</div></div>`+
    (x.confirmado?`<div class="sub" style="font-size:12px">Arquivo confirmado por ${E(x.confirmado.por||'—')} em ${E(T(()=>new Date(x.confirmado.quando).toLocaleString('pt-BR'),''))} · <a href="javascript:void(0)" onclick="V165.desconfirmar('${E(p.id)}')">desfazer</a></div>`:'')+
    `<a class="btn-soft" href="#/propxl">As 104 vendas de 2026</a></div>${x.status==='A CONFIRMAR'?previa(p):ponte}</div>`}
function ligaEditor(){if(typeof SCREENS!=='object'||typeof SCREENS.editor!=='function')return false;if(SCREENS.editor.__v165)return true;const _e=SCREENS.editor;
  SCREENS.editor=function(id){let h=_e.apply(this,arguments);const p=T(()=>get('propostas',id),null);if(!p||!p.xl||typeof h!=='string')return h;const c=cartao(p);
    if(!(p.blocos&&p.blocos.length)){const k=h.indexOf('Produtos ainda não carregados');if(k>=0){const a=h.lastIndexOf('<div class="card',k);const b=h.indexOf('</div></div>',k);if(a>=0&&b>0)return h.slice(0,a)+c+h.slice(b+12)}return h+c}
    const anchor='<h4 class="mb-2">Ambientes e trabalhos</h4>';const i=h.indexOf(anchor);return i>=0?h.slice(0,i)+c+h.slice(i):c+h};
  SCREENS.editor.__v165=true;return true}

/* ── a lista das 104: confere / ajuste / parcial / sem arquivo, cada número abre a proposta ── */
function tela(arg){const db=S.db;const f=T(()=>decodeURIComponent(arg||''),'');
  const rows=D.props.map(x=>({x,p:(db.propostas||[]).find(q=>q.id===x.id)}));
  const g={};rows.forEach(({x})=>{const k=efet(x);g[k]=g[k]||{n:0,v:0};g[k].n++;g[k].v+=+x.valor_metas||0});
  const tot=rows.reduce((a,{x})=>a+(+x.valor_metas||0),0);
  const ordem=['CONFERE','AJUSTE','A CONFIRMAR','PARCIAL','SEM ARQUIVO'];
  const tiles=ordem.filter(k=>g[k]).map(k=>`<a class="card p-3 d-block" style="text-decoration:none;border-top:4px solid ${ST[k][2]};min-width:200px;flex:1" href="#/propxl/${encodeURIComponent(k)}"><div style="font-size:28px;font-weight:800;color:${ST[k][2]}">${N0(g[k].n)}</div><div style="font-size:13px">${E(ST[k][1])}</div><div class="sub">${R2(g[k].v)}</div></a>`).join('');
  const ponte=`Ponte: <b>${N0(rows.length)}</b> vendas = ${ordem.filter(k=>g[k]).map(k=>`<a href="#/propxl/${encodeURIComponent(k)}">${N0(g[k].n)} ${ST[k][0]}</a>`).join(' + ')} · <b>${R2(tot)}</b> = ${ordem.filter(k=>g[k]).map(k=>R2(g[k].v)).join(' + ')}`;
  const lista=rows.filter(({x})=>!f||efet(x)===f).map(({x,p})=>{const sk=efet(x);const tem=p&&p.blocos&&p.blocos.length;const ev=tem?T(()=>M.equip(p),null):null;const sv=tem?T(()=>M.serv(p),null):null;
    return `<tr class="rowlink" onclick="location.hash='#/editor/${E(x.id)}'"><td><b>#${E(x.numero)}</b></td><td>${E(x.cliente)}</td><td style="color:${ST[sk][2]}">${E(ST[sk][0])}${sk==='AJUSTE'&&x.status==='A CONFIRMAR'?' (confirmado)':''}</td><td class="text-end">${R2(x.valor_metas)}</td><td class="text-end">${x.total_arquivo!=null?R2(x.total_arquivo):'—'}</td><td class="text-end">${tem?N0(p.blocos.reduce((a,b)=>a+b.itens.length,0)):'—'}</td><td class="text-end">${ev?R2(ev.custo+(sv?sv.custo:0)):'—'}</td><td class="sub" style="font-size:12px">${x.arquivo?`<a href="${E(x.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${E(x.arquivo)}</a>`:E(x.obs||'')}</td></tr>`}).join('');
  return `<h1 class="mb-1">Vendas de 2026 — a proposta de verdade</h1><div class="sub mb-3">Cada venda da METAS 2026 lida do seu arquivo Excel no Drive (Proposta Interna): ambientes, produtos, miscelâneas, diárias e o custo escrito no arquivo. Os 464 atendimentos do Pós-venda ficam no Pós-venda (não têm arquivo de proposta).</div>
  <div class="d-flex gap-3 flex-wrap mb-2">${tiles}</div><div class="v161-ponte mb-3" style="font-size:13px">${ponte}${f?` · <a href="#/propxl">mostrar todas</a>`:''}</div>
  <div class="card p-0"><table class="tbl"><thead><tr><th>Nº</th><th>Cliente</th><th>Situação</th><th class="text-end">Valor METAS</th><th class="text-end">Total do arquivo</th><th class="text-end">Linhas</th><th class="text-end">Custo (arquivo)</th><th>Arquivo</th></tr></thead><tbody>${lista}</tbody></table></div>`}
function ligaTela(){if(typeof SCREENS!=='object')return false;if(!SCREENS.propxl){SCREENS.propxl=tela;T(()=>{if(typeof LABEL==='object')LABEL.propxl='Vendas 2026 · propostas'})}return true}

function boot(){try{const db=S.db;if(!db||db.af113_zero)return;const r=carregar(db);if(r.n){db._v165={quando:D.quando,rev:REV,propostas:r.n,linhas:r.lin,produtos_novos:r.novos};T(()=>log('propostas','v165','Propostas de 2026 lidas dos arquivos Excel: '+r.n+' propostas, '+r.lin+' linhas, '+r.novos+' produtos novos'));T(()=>save())}}catch(e){console.error('v165',e)}}
const quem=()=>T(()=>S.user&&(S.user.nome||S.user.login||S.user.email),'')||'—';
function refaz(id){const p=(S.db.propostas||[]).find(q=>q.id===id);if(p&&p.xl)p.xl.rev='x';boot();T(()=>render())}
window.V165={confirmar:id=>{const x=BY.get(id);if(!x||x.status!=='A CONFIRMAR')return;CONF()[id]={quando:new Date().toISOString(),por:quem(),arquivo:x.arquivo};T(()=>log('propostas',id,'Arquivo da venda nº '+x.numero+' confirmado: '+x.arquivo));refaz(id)},
  desconfirmar:id=>{const x=BY.get(id);if(!x)return;delete CONF()[id];T(()=>log('propostas',id,'Confirmação do arquivo da venda nº '+x.numero+' desfeita'));refaz(id)},recarregar:()=>{(S.db.propostas||[]).forEach(p=>{if(p.xl)p.xl.rev='x'});IDX=null;boot();T(()=>render())},dados:D};
motor();boot();
let tent=0;const iv=setInterval(()=>{let a=false,b=false;try{a=ligaEditor();b=ligaTela()}catch(e){}if((a&&b)||++tent>80){clearInterval(iv);try{const k=location.hash;if(/^#\/(editor|propxl)/.test(k))render()}catch(e){}}},250);
})();
