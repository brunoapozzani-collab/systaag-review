/* =====================================================================================================
   v234 · NOVA PROPOSTA — a tela nova de proposta dentro do SYSTAAG (Bruno, 25/11/2026)
   Rascunho aprovado: claude.ai/artifact/DNf65pDSGqXM8aydKVTuuD (fluxo e desenho). Regras do Bruno no BRIEF de 25/11.
   Como foi feita (para os números serem os de hoje e baterem com o Excel):
     · NENHUM motor novo: todo número vem de M.resumo / M.equip / M.serv / M.dias / calcXlHtml (o mesmo do editor de hoje,
       conferido com a calculadora SERVIÇOS do Excel: 36,68 diárias, colunas 34,37);
     · NENHUMA escrita nova: toda mudança passa pelas ações A.* que o editor de hoje já usa (mesmos registros, mesmo formato,
       mesma fila para a nuvem). As poucas ações novas (A.npUsarKit, A.npTrocarLinha, A.npOpcao) montam o mesmo formato que
       A.addBloco + A.addLinha montam;
     · kits = os 52 kits da Base (S.db.kits), pelo ID do produto — preço e custo de cada linha vêm do catálogo (Base › Produtos);
     · produtos filtrados pela Categoria comercial (v233); Focal vende qualquer produto do catálogo;
     · diárias: a Contagem da obra só sugere; o que a pessoa digita em cada sistema é o que vale;
     · proposta vendida abre e edita: troca de produto = substituição com preço mantido (A.rtSubst, regra de 12/11: o cliente
       paga o contratado, a diferença de custo vai para a margem, a linha original fica à vista como trocada); item a mais = Ret/Troc;
     · propostas salvas são lidas como estão — sem migração.
   Tela: #/np (escolher ou começar) e #/np/<id>. Por enquanto só o Bruno vê (BRIEF: construir ao lado da atual).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v234)return;window.__v234=true;
if(typeof S==='undefined'||!S.db||typeof SCREENS!=='object')return;
const NP=window.NP={};
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=v=>E(JSON.stringify(v));                       /* valor JS seguro dentro de atributo onclick="" */
const N0=v=>Math.round(+v||0).toLocaleString('pt-BR');
const RS=v=>(v<-0.5?'−':'')+'R$ '+N0(Math.abs(+v||0));
const N2=v=>(Math.round((+v||0)*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2});
const PC=v=>(Math.round((+v||0)*1000)/10).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const nz=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const login=()=>T(()=>me().login,'')||'';
NP.pode=()=>login()==='bruno.pozzani';
const prod=id=>T(()=>get('produtos',id),null);
const prop=id=>T(()=>get('propostas',id),null);
const vendida=p=>!!p&&(['vendida','em_obra','concluida'].includes(p.estado)||!!p.vendida_em);
const FECHADA=p=>!!p&&['perdida','cancelada'].includes(p.estado);
const rer=()=>{try{render()}catch(e){try{renderMain()}catch(_){}}};
const UI=S.np=S.np||{passo:{},aberto:{},busca:{},fam:null,cmp:null};

/* ───── tipos (os 7 do SYSTAAG + Focal + Pós-venda) e os passos de cada um — rascunho aprovado ───── */
const FRENTES={TAAG:'#2563EB','Acústica':'#f27d26',Focal:'#0f172a','Pós-venda':'#16a34a'};
const TIPOS={
 sistema:{frente:'TAAG',ic:'🏠',nome:'Sistema completo',s:'Projeto incluso (2 por 1) + cabeamento + equipamentos + serviços',passos:['cad','sis','plan','val','pag','arq']},
 projeto:{frente:'TAAG',ic:'📐',nome:'Proposta de projeto',s:'Só o projeto: análise técnica e desenho — preço do Projetos',passos:['cad','esc','plan','val','pag','arq']},
 projeto_cabeamento:{frente:'TAAG',ic:'🧵',nome:'Projeto + cabeamento',s:'Projeto e a infraestrutura de cabos, sem equipamentos',passos:['cad','cab','plan','val','pag','arq']},
 cabeamento:{frente:'TAAG',ic:'🔌',nome:'Cabeamento',s:'Projeto incluso + cabos + diárias de infraestrutura',passos:['cad','cab','plan','val','pag','arq']},
 upgrade:{frente:'TAAG',ic:'⬆️',nome:'Upgrade',s:'Troca ou melhora de sistema em obra já entregue',passos:['cad','sis','plan','val','pag','arq']},
 adicional:{frente:'TAAG',ic:'➕',nome:'Proposta adicional',s:'Algo a mais numa obra em andamento',passos:['cad','sis','plan','val','pag','arq']},
 acustica:{frente:'Acústica',ic:'🎚️',nome:'Acústica',s:'Tratamento acústico orçado no Acoustaag',passos:['cad','acu','plan','val','pag','arq']},
 focal:{frente:'Focal',ic:'🛍️',nome:'Venda Focal (loja)',s:'Qualquer produto do catálogo, sem instalação: entrega ou retirada',passos:['cad','foc','val','pag','arq']},
 posvenda:{frente:'Pós-venda',ic:'🛠️',nome:'Atendimento / Pós-venda',s:'Visita técnica, manutenção ou peça para obra entregue',passos:['cad','pv','val','pag','arq']},
};
const PASSOS={cad:{t:'Cadastro',s:'Tipo, cliente, obra e parceiro'},sis:{t:'Sistemas',s:'Kits, produtos e diárias'},esc:{t:'Escopo do projeto',s:'O que o Projetos vai desenhar'},
 cab:{t:'Cabeamento',s:'Cabos, pontos e diárias de infra'},acu:{t:'Ambiente acústico',s:'Orçamento do Acoustaag'},foc:{t:'Produtos',s:'Itens, quantidades e entrega'},
 pv:{t:'Atendimento',s:'Visitas, peças e garantia'},plan:{t:'Plantas',s:'Onde cada coisa fica'},val:{t:'Valores e margem',s:'Preço final e o que sobra'},
 pag:{t:'Pagamento e NF',s:'Como paga e quem fatura'},arq:{t:'Arquivos gerados',s:'Conferir e gerar documentos'}};
NP.TIPOS=TIPOS;
const tipoDe=p=>{if(!p)return 'sistema';if(p.linha==='posvenda')return 'posvenda';if(p.linha==='focal')return 'focal';if(p.linha==='acustica'||p.tipo==='acustica')return 'acustica';
 if(p.produto==='projeto'||p.tipo==='projeto')return 'projeto';if(TIPOS[p.tipo])return p.tipo;return 'sistema'};
NP.tipoDe=tipoDe;

/* ───── famílias de kit = grupos dos kits da Base ───── */
const FAMILIAS=[
 {id:'ht',nome:'Home Theater / Cinema',ic:'🎬',re:/home (theater|cinema)|extensor de av/i},
 {id:'som',nome:'Som ambiente',ic:'🔊',re:/som ambiente/i},
 {id:'ilum',nome:'Iluminação',ic:'💡',re:/ilumina/i},
 {id:'rede',nome:'Rede e Wi-Fi',ic:'📶',re:/^rede/i},
 {id:'cam',nome:'Câmeras',ic:'📷',re:/c[aâ]mera/i},
 {id:'ac',nome:'Ar-condicionado',ic:'❄️',re:/controle ac|ar.condicionado/i},
 {id:'rack',nome:'Gerenciamento do rack',ic:'🗄️',re:/gerenciamento|r[eé]gua/i},
];
const kits=()=>(S.db.kits||[]).filter(k=>k&&!k._apagado);
const famDoKit=k=>(FAMILIAS.find(f=>f.re.test(k.grupo||''))||{id:'outros'}).id;
/* valor de um kit = soma das linhas pelo catálogo de hoje (o mesmo que A.addLinha grava) */
const kitValor=k=>{let v=0,falta=[];(k.itens||[]).forEach(i=>{const pr=prod(i.produto_id);if(!pr){falta.push(i.nome||i.produto_id);return}v+=(+i.qtd||0)*(+pr.preco||0)});return {v,falta}};
NP.kitValor=kitValor;

/* ───── ações novas (mesmo formato do editor de hoje; nada além de blocos/linhas) ───── */
const travaVendida=(p,o)=>{if(vendida(p))throw new RuleError('Proposta vendida: '+(o||'a composição muda por substituição (preço mantido) ou Ret/Troc.'))};
A.npUsarKit=function(pr,kid,nome){
 const p=get('propostas',pr);if(!p)throw new RuleError('Proposta não encontrada.');travaVendida(p,'kit novo entra por Ret/Troc.');
 const k=kits().find(x=>x.id===kid);if(!k)throw new RuleError('Kit não encontrado na Base.');
 const falta=(k.itens||[]).filter(i=>!prod(i.produto_id));
 if(falta.length)throw new RuleError('Este kit tem '+falta.length+' produto(s) que não estão mais na Base ('+falta.map(i=>i.nome||i.produto_id).slice(0,3).join(', ')+'). Corrija o kit em Base › Kits.');
 const b={id:uid('b'),nome:String(nome||k.nome).trim()||k.nome,kit:k.grupo+' · '+k.nome,kit_id:k.id,itens:[],servicos:{}};
 (k.itens||[]).forEach(i=>{const x=prod(i.produto_id);b.itens.push({id:uid('ln'),produto_id:x.id,qtd:+i.qtd||1,preco_unit:x.preco,custo_unit:x.custo,misc:0,ocultar:false,numero_proposta:p.numero,preco:x.preco})});
 blocosDe(p).push(b);syncItens(p);T(()=>blocoEfetivo(b));put('propostas',p,'kit '+k.nome);return b.id};
/* trocar o produto de UMA linha antes da venda: entra o preço e o custo do catálogo do produto novo */
A.npTrocarLinha=function(pr,lid,pid){
 const p=get('propostas',pr);travaVendida(p);const x=prod(pid);if(!x)throw new RuleError('Escolha o produto.');
 let ok=false;blocosDe(p).forEach(b=>b.itens.forEach(l=>{if(l.id===lid){l.produto_id=x.id;l.preco_unit=x.preco;l.preco=x.preco;l.custo_unit=x.custo;ok=true}}));
 if(!ok)throw new RuleError('Linha não encontrada.');syncItens(p);put('propostas',p,'linha trocada: '+x.nome.slice(0,40))};
/* nova opção: cópia da proposta (mesmo cadastro), marcada como opção do mesmo grupo */
A.npOpcao=function(pr){
 const p=get('propostas',pr);if(!p)throw new RuleError('Proposta não encontrada.');if(vendida(p))throw new RuleError('Proposta vendida não recebe opção nova.');
 const grupo=p.opcao_de||p.id;const irmas=grupoDe(p);const letra=String.fromCharCode(65+irmas.length);
 const id=A.duplicar(pr);const c=get('propostas',id);
 c.categoria=p.categoria||'Original';c.opcao_de=grupo;c.opcao=letra;c.opcoes=[letra];c.nome=String(p.nome||'').replace(/\s*\(cópia\)$/,'').replace(/\s*—\s*Opção [A-Z]$/,'')+' — Opção '+letra;
 if(p.negociacao_id)c.negociacao_id=p.negociacao_id;
 if(!p.opcao_de){const pp=get('propostas',grupo);if(pp&&!pp.opcao)pp.opcao='A'}
 put('propostas',c,'opção '+letra+' de '+p.numero);return id};
/* cadastro compartilhado entre as opções: muda numa, muda em todas */
const COMPART=['cliente_id','sigla','obra_id','consultores','distancia','porte','rt'];
A.npSetCad=function(pr,k,v){const p=get('propostas',pr);if(!p)return;if(!COMPART.includes(k))throw new RuleError('Campo fora do cadastro.');
 if(vendida(p)&&['cliente_id','obra_id'].includes(k))throw new RuleError('Venda feita: cliente e obra ficam como foram vendidos.');
 grupoDe(p).forEach(q=>{if(vendida(q)&&q!==p)return;A.setP(q.id,k,v)})};

/* opções do mesmo grupo: mesmo opcao_de, ou mesma negociação (propostas lidas do Excel, opção principal + alternativas) */
function grupoDe(p){if(!p)return [];const raiz=p.opcao_de||p.id;
 let g=S.db.propostas.filter(q=>q&&!q._apagado&&(q.id===raiz||q.opcao_de===raiz));
 if(p.negociacao_id&&p.env){const n=S.db.propostas.filter(q=>q&&!q._apagado&&q.negociacao_id===p.negociacao_id&&q.env&&!FECHADA(q));n.forEach(q=>{if(!g.includes(q))g.push(q)})}
 if(!g.includes(p))g.unshift(p);
 return g.sort((a,b)=>String(a.opcao||'').localeCompare(String(b.opcao||''))||String(a.numero).localeCompare(String(b.numero)))}
NP.grupoDe=grupoDe;
const letraDe=(p,i)=>{const m=String(p.numero||'').match(/[\s-]([A-Z])$/);if(m)return m[1];if(p.opcao_de&&p.opcao&&/^[A-Z]$/.test(p.opcao))return p.opcao;return String.fromCharCode(65+i)};

/* ───── números: só M.* ───── */
function numeros(p){const R=T(()=>M.resumo(p),null)||{tot:0,e:{venda:0,custo:0,misc:0},s:{venda:0,custo:0,dias:{}},margem:0,mg:0};
 const F=T(()=>faltaParaMargem(p),null);const alvo=R.alvo!=null?R.alvo:T(()=>margemAlvo(p)/100,0.3);
 const mo=R.tot?R.s.venda/R.tot:0;return {R,F,alvo,mo,neg:(+p.negociacao||0)/100}}
NP.numeros=numeros;

/* ───── CSS (escopo .np — não mexe no resto do sistema) ───── */
const CSS=`
.np{--ink:#0b1220;--mut:#64748b;--bd:#e2e8f0;--card:#fff;--acc:#2563EB;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;color:var(--ink)}
.np .np-crumbs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.np .np-crumbs span{background:#f1f5f9;border-radius:10px;padding:5px 11px;font-size:12.5px}
.np .np-hero{background:#0b0f19;color:#fff;border-radius:22px;padding:22px 24px 0;margin-bottom:14px}
.np .np-eb{font-size:11px;letter-spacing:.18em;color:#94a3b8;text-transform:uppercase}
.np .np-hero h1{font-size:28px;font-weight:700;margin:6px 0 8px;color:#fff}.np .np-hero h1 small{color:#94a3b8;font-weight:500}
.np .np-pills{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:#cbd5e1}
.np .pill{border-radius:999px;padding:3px 10px;background:#1e293b;color:#e2e8f0;font-weight:600;font-size:12px}.np .pill.draft{background:#facc15;color:#422006}.np .pill.sold{background:#16a34a;color:#fff}
.np .np-opts{display:flex;gap:8px;align-items:flex-end;margin-top:16px;flex-wrap:wrap}
.np .opt{border:0;border-radius:14px 14px 0 0;padding:10px 16px;background:#1e293b;color:#cbd5e1;text-align:left;min-width:170px;cursor:pointer}
.np .opt b{display:block;font-size:14px;color:#fff}.np .opt span{font-size:12px}.np .opt.on{background:#fff;color:#0b1220}.np .opt.on b{color:#0b1220}
.np .opt.add{background:transparent;border:1px dashed #475569;min-width:auto}
.np .hbtn{border:1px solid #334155;background:#111827;color:#fff;border-radius:10px;padding:7px 13px;font-size:13px;font-weight:600;margin-bottom:8px;cursor:pointer}.np .hbtn.purple{background:#7c3aed;border-color:#7c3aed}
.np .sp{flex:1}
.np .np-steps{display:grid;gap:10px;margin-bottom:16px}
.np .step{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid var(--bd);border-radius:14px;padding:12px;text-align:left;cursor:pointer}
.np .step .n{width:26px;height:26px;border-radius:50%;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:12px;flex:none}
.np .step b{display:block;font-size:14px}.np .step span span{font-size:11.5px;color:var(--mut)}
.np .step.on{border-color:var(--acc);box-shadow:0 0 0 3px rgba(37,99,235,.12)}.np .step.on .n{background:var(--acc);color:#fff;border-color:var(--acc)}
.np .step.ok .n{background:#dcfce7;border-color:#22c55e;color:#15803d}
.np .np-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:start}
.np h2{font-size:22px;font-weight:700;margin:0 0 4px}.np .intro p{color:var(--mut);margin:0 0 14px;font-size:13.5px}
.np .ccard{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;margin-bottom:14px}
.np .fams{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}
.np .fam{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:14px;cursor:pointer;text-align:left}.np .fam:hover{border-color:var(--acc)}
.np .fam .ic{font-size:22px}.np .fam b{display:block;margin-top:8px;font-size:14px}.np .fam span{font-size:12px;color:var(--mut)}
.np .sys{background:#fff;border:1px solid var(--bd);border-radius:16px;margin-bottom:10px}
.np .sys-h{display:flex;gap:12px;align-items:center;padding:14px 16px;cursor:pointer}.np .sys-h b{font-size:15px}.np .sys-h .sub2{font-size:12px;color:var(--mut)}
.np .sys-b{border-top:1px solid var(--bd);padding:12px 16px}
.np table.t{width:100%;border-collapse:collapse;font-size:12.5px}.np table.t th{font-size:10.5px;letter-spacing:.06em;color:var(--mut);text-transform:uppercase;font-weight:700;text-align:left;padding:6px 6px;border-bottom:1px solid var(--bd)}
.np table.t td{padding:6px;border-bottom:1px solid #f1f5f9;vertical-align:middle}.np table.t .r{text-align:right}.np .mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.np input.in{width:76px;border:1px solid #cbd5e1;border-radius:8px;padding:3px 6px;font-size:12.5px;text-align:right}.np input.in.wide{width:100%;text-align:left}
.np select.in{border:1px solid #cbd5e1;border-radius:8px;padding:3px 6px;font-size:12.5px}
.np .chipc{display:inline-block;border-radius:999px;padding:1px 8px;font-size:10.5px;background:#eef2ff;color:#3730a3;font-weight:600}
.np .chipc.warn{background:#fef3c7;color:#92400e}.np .chipc.bad{background:#fee2e2;color:#991b1b}.np .chipc.ok{background:#dcfce7;color:#166534}
.np .lnk{border:0;background:none;color:var(--acc);font-weight:600;font-size:12px;cursor:pointer;padding:0}
.np .btn2{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer}.np .btn2.pri{background:var(--acc);border-color:var(--acc);color:#fff}
.np .btn2:disabled{opacity:.45;cursor:not-allowed}
.np .meter{position:sticky;top:12px}.np .mcard{background:#0b0f19;color:#e2e8f0;border-radius:18px;padding:16px}
.np .mcard .lbl{font-size:10.5px;letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;margin-bottom:6px}
.np .mcard .big{font-size:24px;font-weight:700}.np .mrow{display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #1e293b;font-size:12.5px}
.np .mrow b{font-family:'JetBrains Mono',ui-monospace,monospace;color:#fff}.np .ok{color:#4ade80!important}.np .bad{color:#f87171!important}.np .warn{color:#fbbf24!important}
.np .gauge{height:10px;background:#1e293b;border-radius:99px;position:relative;margin:12px 0 18px}.np .gauge .fill{height:100%;border-radius:99px}
.np .gauge .mk{position:absolute;top:-4px;width:2px;height:18px;background:#fff}.np .gauge .mk span{position:absolute;top:18px;left:-24px;font-size:10px;color:#94a3b8;white-space:nowrap}
.np .mlight{background:#f8fafc;border:1px solid var(--bd);border-radius:14px;padding:12px;margin-top:10px;font-size:12px;color:#475569}
.np .navbar2{display:flex;justify-content:space-between;margin:18px 0 6px}
.np .tipos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.np .tipo{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:12px;cursor:pointer;text-align:left}.np .tipo.on{border-color:var(--acc);box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.np .tipo b{display:block;font-size:14px;margin-top:4px}.np .tipo span{font-size:12px;color:var(--mut)}
.np .frm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.np .frm label{font-size:11.5px;color:var(--mut);font-weight:600;display:block;margin-bottom:3px}
.np .frm select,.np .frm input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:7px 10px;font-size:13.5px;background:#fff}
.np .sold-line{background:#fff7ed}.np .swapped{text-decoration:line-through;color:#94a3b8}
.np .res{max-height:260px;overflow:auto;border:1px solid var(--bd);border-radius:10px;margin-top:6px}
.np .res div{display:flex;justify-content:space-between;gap:8px;padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12.5px;cursor:pointer}.np .res div:hover{background:#eff6ff}
.np .cats{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.np .cats button{border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:3px 10px;font-size:11.5px;cursor:pointer}.np .cats button.on{background:#0b1220;color:#fff;border-color:#0b1220}
.np .legacy{border:1px dashed #cbd5e1;border-radius:14px;padding:6px}
.np-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:90;display:flex;align-items:center;justify-content:center}
.np-ov .box{background:#fff;border-radius:18px;padding:18px;width:min(920px,94vw);max-height:86vh;overflow:auto;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
@media (max-width:1100px){.np .np-grid{grid-template-columns:1fr}.np .fams{grid-template-columns:repeat(2,1fr)}.np .tipos{grid-template-columns:1fr 1fr}}
`;
function css(){if(document.getElementById('np-css'))return;const s=document.createElement('style');s.id='np-css';s.textContent=CSS;document.head.appendChild(s)}

/* ───── modal ───── */
NP.fecha=()=>{const m=document.getElementById('np-ov');if(m)m.remove()};
function abreModal(html){NP.fecha();const d=document.createElement('div');d.id='np-ov';d.className='np-ov';d.innerHTML=`<div class="box np">${html}</div>`;d.onclick=e=>{if(e.target===d)NP.fecha()};document.body.appendChild(d)}

/* ───── navegação ───── */
NP.go=(pid,passo)=>{UI.passo[pid]=passo;rer();T(()=>window.scrollTo({top:0,behavior:'smooth'}))};
NP.abrir=id=>{location.hash='#/np/'+id};
NP.toggle=k=>{UI.aberto[k]=!UI.aberto[k];rer()};
const passos=p=>TIPOS[tipoDe(p)].passos;
function passoAtual(p){const ps=passos(p);let s=UI.passo[p.id];if(!ps.includes(s))s=vendida(p)?(ps.includes('sis')?'sis':ps[1]||'cad'):'cad';return s}
function passoOk(p,s){const bl=T(()=>blocosDe(p),[]);const R=numeros(p).R;
 if(s==='cad')return !!(p.cliente_id||p.sigla||p.obra_id)&&!!(p.consultores&&p.consultores.length);
 if(['sis','cab','foc','acu'].includes(s))return bl.some(b=>b.itens&&b.itens.length);
 if(s==='esc')return +p.honorarios>0||bl.some(b=>+((b.servicos||{}).projeto)>0);
 if(s==='pv')return R.tot>0;
 if(s==='plan')return planta(p).length>0;
 if(s==='val')return R.tot>0&&(numeros(p).F?numeros(p).F.ok:true);
 if(s==='pag')return !!(p.fechamento&&p.fechamento.forma);
 return false}

/* ───── cabeçalho (hero + opções + passos) ───── */
function hero(p){const t=TIPOS[tipoDe(p)];const g=grupoDe(p);const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;
 const cli=T(()=>cliente(p.id),p.sigla||'');const est=vendida(p)?'<span class="pill sold">Vendida</span>':`<span class="pill draft">${E(T(()=>({rascunho:'Rascunho',enviada:'Enviada',alternativa:'Alternativa',em_prevendas:'Pré-vendas',revisao:'Revisão',aprovada_cliente:'Aprovada pelo cliente',perdida:'Perdida'})[p.estado],p.estado)||p.estado)}</span>`;
 const tabs=g.map((q,i)=>{const R=numeros(q).R;return `<button class="opt ${q.id===p.id?'on':''}" onclick="NP.abrir(${J(q.id)})"><b>Opção ${E(letraDe(q,i))} · #${E(q.numero)}</b><span>${RS(R.tot)}${q.estado==='alternativa'?' · alternativa':''}</span></button>`}).join('');
 return `<div class="np-crumbs"><span>Unidade: <b style="color:${FRENTES[t.frente]}">${E(t.frente)}</b></span><span>Obra: ${o?'<b>'+E(o.numero?'Obra '+o.numero:o.nome)+'</b>':'—'}</span><span style="background:#FEF6E7">Tela nova em teste · mesmos registros, mesmo motor da tela de hoje</span><span><a href="#/editor/${E(p.id)}">abrir na tela de hoje</a></span></div>
 <section class="np-hero"><div class="np-eb">Comercial · Proposta</div><h1>${E(cli)}${o?' — '+E(String(o.nome||'').split('—')[0].trim()):''} <small>#${E(p.numero)}</small></h1>
 <div class="np-pills"><span class="pill" style="background:${FRENTES[t.frente]};color:#fff">${E(t.frente)}</span><span class="pill">${t.ic} ${E(t.nome)}</span>${p.categoria?`<span class="pill">${E(p.categoria)}</span>`:''}${est}<span>${E((p.consultores||[]).join(', ')||'sem consultor')} · ${E(rtTexto(p))}</span></div>
 <div class="np-opts">${tabs}${vendida(p)?'':`<button class="opt add" onclick="const id=run(()=>A.npOpcao(${J(p.id)}),'Nova opção criada (mesmo cadastro)');if(id)NP.abrir(id)">+ Nova opção</button>`}<span class="sp"></span>
 <button class="hbtn" onclick="NP.cliente(${J(p.id)})">👁 Modo cliente</button>${g.length>1?`<button class="hbtn purple" style="margin-left:8px" onclick="NP.comparar(${J(p.id)})">⇄ Comparar opções</button>`:''}</div></section>`}
function rtTexto(p){const rec=(p.rt_rec||[]).map(r=>T(()=>(S.db.parceiros||[]).find(x=>x.id===r.pid).nome,'')).filter(Boolean);return (rec.length?rec.join(', '):'sem parceiro')+' · RT '+N2(+p.rt||0)+'%'}
function steps(p){const ps=passos(p),cur=passoAtual(p);return `<div class="np-steps" style="grid-template-columns:repeat(${ps.length},1fr)">${ps.map((s,i)=>{const ok=s!==cur&&passoOk(p,s);return `<button class="step ${s===cur?'on':''} ${ok?'ok':''}" onclick="NP.go(${J(p.id)},'${s}')"><span class="n">${ok?'✓':i+1}</span><span><b>${PASSOS[s].t}</b><span>${PASSOS[s].s}</span></span></button>`}).join('')}</div>`}
function navbar(p){const ps=passos(p),i=ps.indexOf(passoAtual(p));return `<div class="navbar2">${i>0?`<button class="btn2" onclick="NP.go(${J(p.id)},'${ps[i-1]}')">← ${PASSOS[ps[i-1]].t}</button>`:'<span></span>'}${i<ps.length-1?`<button class="btn2 pri" onclick="NP.go(${J(p.id)},'${ps[i+1]}')">Próximo: ${PASSOS[ps[i+1]].t} →</button>`:''}</div>`}
const intro=(t,s)=>`<div class="intro"><h2>${t}</h2><p>${s}</p></div>`;

/* ───── termômetro (ao lado enquanto monta) — números do Resumo do Excel (M.resumo) ───── */
function meter(p){const {R,F,alvo,mo,neg}=numeros(p);const nec=F&&isFinite(F.X)?R.tot+F.X:R.tot;const max=Math.max(R.tot,nec,1)*1.12;const w=v=>Math.max(0,Math.min(100,v/max*100));
 const ok=F?F.ok:true;const cor=ok?'#22c55e':'#f59e0b';const alvoPct=+T(()=>S.db.params.serv_alvo_pct,20);
 const showMO=!['focal','acustica','projeto','posvenda'].includes(tipoDe(p));
 return `<aside class="meter"><div class="mcard"><div class="lbl">Margem e miscelâneas · #${E(p.numero)}</div>
 <div class="big ${ok?'ok':'warn'}">${ok?'No alvo ✓':'Faltam '+RS(F.X)}</div><div style="font-size:12px;color:#94a3b8">${ok?'a margem fecha com '+PC(neg)+' de negociação':'de miscelânea no preço para a margem de '+PC(alvo)+' (Resumo do Excel)'}</div>
 <div class="gauge"><div class="fill" style="width:${w(R.tot)}%;background:${cor}"></div>${!ok?`<div class="mk" style="left:${w(nec)}%"><span>necessário</span></div>`:''}</div>
 <div class="mrow"><span>Equipamentos</span><b>${RS(R.e.venda)}</b></div>
 ${showMO?`<div class="mrow"><span>Mão de obra (${N2(R.s.total||0)} diárias)</span><b>${RS(R.s.venda)}</b></div>`:''}
 ${(R.s.projeto_extra)?`<div class="mrow"><span>Projeto à parte</span><b>${RS(R.s.projeto_extra)}</b></div>`:''}
 <div class="mrow"><span>Miscelânea nas linhas</span><b>${RS(R.e.misc||0)}</b></div>
 ${+p.ajuste?`<div class="mrow"><span>Ajuste</span><b>${RS(p.ajuste)}</b></div>`:''}
 <div class="mrow" style="font-size:15px"><span style="color:#fff">Total</span><b>${RS(R.tot)}</b></div>
 ${showMO?`<div class="mrow"><span>Mão de obra ÷ equipamentos</span><b class="${R.e.venda&&R.s.venda/R.e.venda*100>=alvoPct-0.05?'ok':'warn'}">${PC(R.e.venda?R.s.venda/R.e.venda:0)} <span style="font-weight:400;color:#94a3b8">· alvo ${alvoPct}%</span></b></div>`:''}
 <div class="mrow"><span>Margem TAAG</span><b class="${R.mg>=alvo-1e-9?'ok':'bad'}">${R.mg==null?'—':PC(R.mg)} <span style="font-weight:400;color:#94a3b8">· alvo ${PC(alvo)}</span></b></div>
 ${vendida(p)?`<div class="mrow"><span>Cenário real (trocas)</span><b>${E(T(()=>PC(M.cenarioReal(p).t.mg),'—'))}</b></div>`:''}
 ${!ok&&!vendida(p)?`<button class="btn2" style="width:100%;margin-top:10px" onclick="run(()=>A.distribuirMisc(${J(p.id)}),'Miscelânea distribuída nas linhas (regra de hoje)')">Distribuir miscelânea nas linhas</button>`:''}
 </div><div class="mlight"><b>De onde vêm:</b> o mesmo motor do editor de hoje (Resumo do Excel): imposto ${N2(T(()=>S.db.regras.imp_equip,11.61))}% equip. · ${N2(T(()=>S.db.regras.imp_serv,17))}% m.o., RT sobre o preço sem impostos, custo da diária da aba Fabricante.</div></aside>`}

/* ───── 1. CADASTRO ───── */
function opcoesClientes(sel){return (S.db.clientes||[]).filter(c=>c&&!c._apagado&&!c.merged_into).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR')).map(c=>`<option value="${E(c.id)}"${c.id===sel?' selected':''}>${E(c.nome)}${c.sigla?' · '+E(c.sigla):''}</option>`).join('')}
function opcoesObras(cid,sel){return (S.db.obras||[]).filter(o=>o&&!o._apagado&&(!cid||o.cliente_id===cid)).map(o=>`<option value="${E(o.id)}"${o.id===sel?' selected':''}>${E(o.numero?'Obra '+o.numero+' · ':'')}${E(o.nome)}</option>`).join('')}
const consultoresLista=()=>{const s=new Set();(S.db.usuarios||[]).forEach(u=>{if(u&&u.ativo!==false&&/comercial|pr[eé].?vendas/i.test((u.grupos||[]).join(' ')+' '+(u.setor||'')))s.add(String(u.nome).split(' ')[0])});(S.db.propostas||[]).slice(-300).forEach(p=>(p.consultores||[]).forEach(c=>s.add(c)));return [...s].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'))};
function cadastroNovo(){const f=UI.nova=UI.nova||{tipo:'sistema',cons:[]};const t=TIPOS[f.tipo];
 const parc=(S.db.parceiros||[]).filter(x=>x&&!x.inativo&&!x._apagado).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
 const cons=consultoresLista();
 return intro('Cadastro','Tipo, cliente, obra e quem indicou. A RT vem do cadastro do parceiro (travada). O número é dado pelo sistema.')+
 `<div class="ccard"><div class="tipos">${Object.entries(TIPOS).map(([k,x])=>`<button class="tipo ${f.tipo===k?'on':''}" onclick="S.np.nova.tipo='${k}';NP.r()"><span style="font-size:20px">${x.ic}</span><b>${E(x.nome)}</b><span>${E(x.s)}</span><div style="margin-top:4px"><span class="chipc" style="background:${FRENTES[x.frente]};color:#fff">${E(x.frente)}</span></div></button>`).join('')}</div></div>
 ${f.tipo==='posvenda'?`<div class="ccard">Proposta de pós-venda nasce do atendimento (Pós-venda › Atendimentos → "virar proposta"), que já guarda a obra entregue, a garantia e as visitas. <a href="#/posatend">Abrir Pós-venda › Atendimentos</a>. As propostas de pós-venda já feitas abrem aqui normalmente.</div>`:
 `<div class="ccard"><div class="frm">
  <div><label>Cliente</label><select id="np_cli" onchange="S.np.nova.cli=this.value;S.np.nova.obra='';NP.r()"><option value="">— escolha —</option>${opcoesClientes(f.cli)}</select></div>
  <div><label>Obra</label><select id="np_obra" onchange="S.np.nova.obra=this.value"><option value="">— escolha —</option>${f.cli?opcoesObras(f.cli,f.obra):''}${f.tipo!=='adicional'?`<option value="__nova__"${f.obra==='__nova__'?' selected':''}>+ Nova obra (número automático)</option>`:''}${f.tipo==='focal'?`<option value="__balcao__"${f.obra==='__balcao__'?' selected':''}>Venda de balcão (sem obra)</option>`:''}</select></div>
  <div><label>Consultor(es) — até 2</label><div class="cats">${cons.map(c=>`<button class="${f.cons.includes(c)?'on':''}" onclick="const a=S.np.nova.cons;const i=a.indexOf(${J(c)});if(i>=0)a.splice(i,1);else if(a.length<2)a.push(${J(c)});NP.r()">${E(c)}</button>`).join('')}</div></div>
  <div><label>Quem indicou / recebe RT</label><select id="np_rt" onchange="S.np.nova.rt=this.value"><option value="">— ninguém —</option>${parc.map(x=>`<option value="${E(x.id)}"${x.id===f.rt?' selected':''}>${E(x.nome)}${+x.rt_pct?' · RT '+N2(x.rt_pct)+'%':''}</option>`).join('')}</select></div>
  <div><label>Nome (opcional)</label><input id="np_nome" placeholder="vazio = sigla — tipo" value="${E(f.nome||'')}" oninput="S.np.nova.nome=this.value"></div>
  <div style="display:flex;align-items:flex-end"><button class="btn2 pri" onclick="NP.criar()">Criar proposta ${E(t.ic)}</button></div>
 </div></div>`}`}
NP.r=rer;
NP.criar=function(){const f=UI.nova||{};const t=f.tipo||'sistema';
 const dados={cliente_id:f.cli||'',obra_id:f.obra||'',nome:f.nome||'',tipo:t==='focal'?'sistema':t,linha:t==='focal'?'focal':(t==='acustica'?'acustica':'taag'),consultores:(f.cons||[]).slice(),rt_pid:f.rt||''};
 const id=run(()=>A.novaPropostaTipo(dados),'Proposta criada');if(id){UI.nova=null;UI.passo[id]='sis';NP.abrir(id)}};
function cadastro(p){const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;const cid=p.cliente_id||(o&&o.cliente_id)||'';const g=grupoDe(p);const vd=vendida(p);
 const dist=Object.entries(T(()=>DIST_LB,{capital:'Capital'})).map(([k,l])=>`<option value="${k}"${(p.distancia||'capital')===k?' selected':''}>${E(l)}</option>`).join('');
 return intro('Cadastro',(g.length>1?'As '+g.length+' opções usam este cadastro: mudar aqui muda em todas. ':'')+'A RT vem do cadastro do parceiro e fica travada aqui (Fechamento › RT muda).')+
 `<div class="ccard"><div class="frm">
 <div><label>Tipo</label><input value="${E(TIPOS[tipoDe(p)].nome)}" disabled></div>
 <div><label>Cliente</label><select ${vd?'disabled':''} onchange="run(()=>A.npSetCad(${J(p.id)},'cliente_id',this.value),'Cliente')"><option value=""></option>${opcoesClientes(cid)}</select></div>
 <div><label>Obra</label><select ${vd?'disabled':''} onchange="run(()=>A.npSetCad(${J(p.id)},'obra_id',this.value),'Obra')"><option value=""></option>${opcoesObras(cid,p.obra_id)}</select></div>
 <div><label>Distância da obra (diárias ÷ (1 − %), como no Excel)</label><select onchange="run(()=>A.npSetCad(${J(p.id)},'distancia',this.value),'Distância')">${dist}</select></div>
 <div><label>Consultor(es)</label><input value="${E((p.consultores||[]).join(', '))}" disabled title="muda na tela de hoje (cartões de consultor)"></div>
 <div><label>Parceiro e RT (do cadastro do parceiro)</label><input value="${E(rtTexto(p))}" disabled></div>
 </div></div>`}

/* ───── 2. SISTEMAS ───── */
const catCom=pr=>pr&&pr.categoria_comercial||'';
const linhaTot=l=>(+l.qtd||0)*(+l.preco_unit||0)+(+l.misc||0);
function sistemas(p,modo){const bl=T(()=>blocosDe(p),[]);const vd=vendida(p);const fam=UI.fam;
 const titulo=modo==='cab'?'Cabeamento':modo==='foc'?'Produtos':modo==='acu'?'Ambiente acústico':'Sistemas';
 const famHtml=modo==='sis'&&!vd?`<div class="fams">${FAMILIAS.map(f=>{const n=kits().filter(k=>famDoKit(k)===f.id).length;return `<button class="fam" onclick="NP.familia(${J(p.id)},'${f.id}')"><div class="ic">${f.ic}</div><b>${E(f.nome)}</b><span>${n} kit${n===1?'':'s'} na Base</span></button>`}).join('')}<button class="fam" onclick="NP.blocoNovo(${J(p.id)})"><div class="ic">🧩</div><b>Produto por produto</b><span>sem kit: monta do catálogo</span></button></div>`:
  (!vd?`<div style="margin-bottom:12px"><button class="btn2" onclick="NP.blocoNovo(${J(p.id)})">+ ${modo==='foc'?'Novo grupo de produtos':modo==='cab'?'Novo trecho de cabeamento':'Novo ambiente'}</button></div>`:'');
 const acu=modo==='acu'?acusticaCard(p):'';
 return intro(titulo,vd?'Proposta vendida: o preço do cliente fica. Trocar um produto = substituição (o cliente paga o contratado, a diferença de custo vai para a margem e a linha original fica à vista como trocada). Item a mais = Ret/Troc.':
   modo==='foc'?'Venda Focal: qualquer produto do catálogo. Sem instalação.':'Escolha o sistema, depois o kit. Troque modelos ou acrescente qualquer produto. Miscelânea por linha à vista. As diárias de cada sistema são digitadas; a Contagem da obra sugere.')
 +acu+famHtml+(vd?`<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn2 pri" onclick="rtNovoDialog(${J(p.id)})">+ Item a mais / retirada (Ret/Troc)</button><a class="btn2" style="text-decoration:none" href="#/consolidado/${E(p.id)}">Versões do consolidado</a></div>`:'')+`<h3 style="font-size:16px;font-weight:700;margin:6px 0 10px">Nesta proposta · ${bl.length}</h3>`+bl.map(b=>blocoCard(p,b,modo)).join('')
 +(modo==='sis'||modo==='cab'?contagemCard(p):'')}
function blocoCard(p,b,modo){const vd=vendida(p);const k='b:'+b.id;const aberto=UI.aberto[k]!==false;
 const eq=(b.itens||[]).filter(l=>!l.substituto||true).reduce((a,l)=>a+linhaTot(l),0);const ef=T(()=>blocoEfetivo(b),b.servicos||{});
 const dias=DISC.reduce((a,x)=>a+(+ef[x]||0),0);const mo=DISC.reduce((a,x)=>a+(+ef[x]||0)*RATE[x].venda,0)+(+b.misc_serv||0);
 const fam=b.kit?FAMILIAS.find(f=>f.re.test(b.kit)):null;
 return `<div class="sys"><div class="sys-h" onclick="NP.toggle('${k}')"><span style="font-size:22px">${fam?fam.ic:'🧩'}</span><div style="flex:1"><b>${E(b.nome)}</b><div class="sub2">${b.kit?E(b.kit)+' · ':''}${(b.itens||[]).length} linha(s) · ${N2(dias)} diárias${b.ocultar?' · oculto para o cliente':''}</div></div>
 <div style="text-align:right"><b class="mono">${RS(eq+mo)}</b><div class="sub2">equip. ${RS(eq)} · m.o. ${RS(mo)}</div></div><span>${aberto?'▾':'›'}</span></div>
 ${aberto?`<div class="sys-b">${linhasTab(p,b,vd)}${vd?'':addProduto(p,b,modo)}${modo==='foc'?'':diasTab(p,b,ef)}
 ${vd?'':`<div style="text-align:right;margin-top:8px"><button class="lnk" style="color:#dc2626" onclick="if(confirm('Remover ${E(b.nome).replace(/'/g,'')} da proposta?'))run(()=>A.rmBloco(${J(p.id)},${J(b.id)}),'Removido')">remover este ${modo==='foc'?'grupo':'sistema'}</button></div>`}</div>`:''}</div>`}
function linhasTab(p,b,vd){const L=b.itens||[];if(!L.length)return '<div class="sub2" style="color:#64748b;font-size:12.5px;margin-bottom:8px">Nenhum produto ainda.</div>';
 return `<table class="t"><thead><tr><th>Produto</th><th>Categoria comercial</th><th class="r">Qtd</th><th class="r">Unitário</th><th class="r">Misc. da linha</th><th class="r">Total</th><th></th></tr></thead><tbody>${L.map(l=>{const pr=prod(l.produto_id)||{};const sub=l.substituto?prod(l.substituto):null;
  return `<tr class="${sub?'sold-line':''}"><td><b class="${sub?'swapped':''}">${E(pr.nome||l.produto_id)}</b><div style="font-size:11px;color:#64748b">${E(pr.marca||'')}${pr.apelido?' · '+E(pr.apelido):''}</div>${sub?`<div style="font-size:11.5px;color:#9a3412">↳ atendido com <b>${E(sub.nome)}</b> — preço do cliente mantido</div>`:''}</td>
  <td>${catCom(pr)?`<span class="chipc">${E(catCom(pr))}</span>`:'<span class="chipc warn">sem categoria</span>'}</td>
  <td class="r">${vd?N2(l.qtd):`<input class="in" type="number" min="0" step="1" value="${E(l.qtd)}" onchange="run(()=>A.setLinha(${J(p.id)},${J(l.id)},'qtd',+this.value),'Quantidade')">`}</td>
  <td class="r mono">${vd?RS(l.preco_unit):`<input class="in" style="width:96px" value="${E(N2(l.preco_unit))}" onchange="run(()=>A.setLinha(${J(p.id)},${J(l.id)},'preco',this.value.replace(/\\./g,'')),'Preço unitário')">`}</td>
  <td class="r">${vd?RS(l.misc||0):`<input class="in" style="width:86px" value="${E(N2(l.misc||0))}" onchange="run(()=>A.setLinha(${J(p.id)},${J(l.id)},'misc',+String(this.value).replace(/\\./g,'').replace(',','.')||0),'Miscelânea da linha')">`}</td>
  <td class="r mono">${RS(linhaTot(l))}</td>
  <td class="r" style="white-space:nowrap">${vd?(sub?'':`<button class="lnk" onclick="rtSubstDialog(${J(p.id)},${J(l.id)})">trocar (preço mantido)</button>`):`<button class="lnk" onclick="NP.trocar(${J(p.id)},${J(l.id)})">trocar</button>`}</td></tr>`}).join('')}</tbody></table>`}
function addProduto(p,b,modo){const k=b.id;const q=UI.busca[k]||{q:'',c:''};const cats=T(()=>V233CAT.comerciais(),[]);
 const pre=modo==='cab'?'Cabos e infraestrutura':'';const cc=q.c||(q.q?'':pre);
 const rs=q.q||cc?catalogo(q.q,cc).slice(0,40):[];
 return `<div style="margin-top:10px"><div class="cats">${cats.map(c=>`<button class="${cc===c?'on':''}" onclick="NP.busca(${J(k)},'c',${J(cc===c?'':c)})">${E(c)}</button>`).join('')}</div>
 <input class="in wide" placeholder="+ acrescentar produto: buscar por nome, marca ou modelo…" value="${E(q.q)}" oninput="NP.busca(${J(k)},'q',this.value,true)">
 <div id="np-res-${E(k)}">${resultados(p,b,rs,q.q||cc)}</div></div>`}
function resultados(p,b,rs,ativo){if(!ativo)return '';if(!rs.length)return '<div class="res"><div>nenhum produto</div></div>';
 return `<div class="res">${rs.map(x=>`<div onclick="run(()=>A.addLinha(${J(p.id)},${J(b.id)},${J(x.id)},1),'Produto acrescentado')"><span><b>${E(x.nome)}</b> <span style="color:#64748b">${E(x.marca||'')}</span> ${catCom(x)?`<span class="chipc">${E(catCom(x))}</span>`:''}</span><span class="mono">${RS(x.preco)}</span></div>`).join('')}</div>`}
/* catálogo: produtos da Base que se vendem (sem os 16 de demonstração p1–p16, sem diárias/visitas, sem inativos) */
const DEMO=/^p([1-9]|1[0-6])$/;
function vendavel(x){return x&&!x.inativo&&!x._apagado&&!x.merged_into&&!DEMO.test(x.id)&&!/_TF$/i.test(x.marca||'')&&catCom(x)!=='Serviços (não é produto)'&&!/^di[aá]ria|^visita/i.test(String(x.nome||''))}
function catalogo(q,c){const qq=nz(q);return (S.db.produtos||[]).filter(x=>vendavel(x)&&(!c||catCom(x)===c)&&(!qq||nz(x.nome+' '+(x.marca||'')+' '+(x.apelido||'')+' '+x.id).includes(qq))).sort((a,b)=>String(a.marca+a.nome).localeCompare(String(b.marca+b.nome),'pt-BR'))}
NP.catalogo=catalogo;
NP.busca=function(k,campo,v,soLista){const q=UI.busca[k]=UI.busca[k]||{q:'',c:''};q[campo]=v;
 if(soLista){const el=document.getElementById('np-res-'+k);const p=prop((location.hash.split('/')[2]||''));const b=p&&T(()=>blocosDe(p).find(x=>x.id===k),null);if(el&&p&&b){el.innerHTML=resultados(p,b,catalogo(q.q,q.c).slice(0,40),q.q||q.c);return}}rer()};
function diasTab(p,b,ef){const adj=b.servicos_adj||{};const av=(b.serv_linhas||[]).filter(x=>x.tipo==='avulso');const vd=vendida(p);
 return `<div style="margin-top:12px"><div style="font-size:10.5px;letter-spacing:.1em;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:4px">Diárias deste sistema — o digitado vale</div>
 <table class="t"><thead><tr>${DISC.map(k=>`<th class="r">${E(RATE[k].lb)}</th>`).join('')}<th class="r">Total</th></tr></thead><tbody><tr>${DISC.map(k=>`<td class="r">${vd?N2(ef[k]):`<input class="in" value="${adj[k]!=null&&adj[k]!==''?E(N2(adj[k])):''}" placeholder="0" onchange="run(()=>A.setDias(${J(p.id)},${J(b.id)},'${k}',this.value),'Diárias')">`}</td>`).join('')}<td class="r mono">${N2(DISC.reduce((a,k)=>a+(+ef[k]||0),0))}</td></tr>
 <tr style="color:#64748b">${DISC.map(k=>`<td class="r mono" style="font-size:11.5px">${RS((+ef[k]||0)*RATE[k].venda)}</td>`).join('')}<td class="r mono" style="font-size:11.5px">${RS(DISC.reduce((a,k)=>a+(+ef[k]||0)*RATE[k].venda,0))}</td></tr></tbody></table>
 ${av.length?`<table class="t" style="margin-top:6px"><tbody>${av.map(x=>`<tr><td>Miscelânea de serviço: ${E(x.nome)}</td><td class="r mono">${RS(x.valor)}</td><td class="r">${vd?'':`<button class="lnk" style="color:#dc2626" onclick="run(()=>A.rmServLinha(${J(p.id)},${J(b.id)},${J(x.id)}),'Removido')">remover</button>`}</td></tr>`).join('')}</tbody></table>`:''}
 ${vd?'':`<div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span style="font-size:12px;color:#64748b">Miscelânea de mão de obra deste sistema:</span><input class="in wide" style="max-width:220px" id="np-av-n-${E(b.id)}" placeholder="descrição"><input class="in" id="np-av-v-${E(b.id)}" placeholder="R$"><button class="btn2" onclick="run(()=>A.addAvulso(${J(p.id)},${J(b.id)},document.getElementById('np-av-n-${E(b.id)}').value,+String(document.getElementById('np-av-v-${E(b.id)}').value).replace(/\\./g,'').replace(',','.')),'Miscelânea lançada')">lançar</button>
 <button class="btn2" onclick="run(()=>A.completarMiscBloco(${J(p.id)},${J(b.id)}),'Mão de obra completada até o alvo')">completar até ${E(T(()=>S.db.params.serv_alvo_pct,20))}% dos equip.</button></div>`}</div>`}
/* Contagem da obra: a calculadora SERVIÇOS do Excel (a mesma do editor de hoje) — só sugere */
/* abrir não grava: se a proposta ainda não tinha a calculadora, a calculadora vazia criada só para desenhar sai de novo */
const semCalc=c=>!c||(!Object.keys(c.cont||{}).length&&!Object.keys(c.forced||{}).length);
function contagemCard(p){const tinha=Object.prototype.hasOwnProperty.call(p,'calc_xl');const C=T(()=>calcXlHtml(p),null);if(!tinha&&semCalc(p.calc_xl))delete p.calc_xl;if(!C)return '';const k='cont:'+p.id;const ab=!!UI.aberto[k];
 const d=T(()=>M.dias(p),{});const tot=C.tot||{};
 return `<div class="ccard" style="border-left:4px solid #16a34a"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><b>🧮 Contagem da obra</b> <span style="font-size:12px;color:#64748b">— calculadora SERVIÇOS do Excel; só sugere, o que vale é o digitado em cada sistema</span></div><button class="btn2" onclick="NP.toggle('${k}')">${ab?'fechar':'abrir a calculadora'}</button></div>
 <table class="t" style="margin-top:8px"><thead><tr><th></th>${DISC.map(x=>`<th class="r">${E(RATE[x].lb)}</th>`).join('')}<th class="r">Total</th></tr></thead><tbody>
 <tr><td>Sugerido pela contagem</td>${DISC.map(x=>`<td class="r mono">${N2(tot[x])}</td>`).join('')}<td class="r mono">${N2(C.T)}</td></tr>
 <tr><td>Digitado nos sistemas</td>${DISC.map(x=>`<td class="r mono">${N2(d[x])}</td>`).join('')}<td class="r mono">${N2(DISC.reduce((a,x)=>a+(+d[x]||0),0))}</td></tr>
 <tr style="color:#64748b"><td>Diferença</td>${DISC.map(x=>{const v=(+d[x]||0)-(+tot[x]||0);return `<td class="r mono ${Math.abs(v)<0.005?'':v<0?'bad':''}">${Math.abs(v)<0.005?'—':(v>0?'+':'')+N2(v)}</td>`}).join('')}<td class="r mono">${N2(DISC.reduce((a,x)=>a+(+d[x]||0),0)-(+C.T||0))}</td></tr></tbody></table>
 ${ab?`<div class="legacy" style="margin-top:10px">${C.html}</div>`:''}</div>`}
NP.familia=function(pid,fid){const p=prop(pid);const fam=FAMILIAS.find(f=>f.id===fid);const ks=kits().filter(k=>famDoKit(k)===fid).sort((a,b)=>String(a.grupo+a.nome).localeCompare(String(b.grupo+b.nome),'pt-BR'));
 abreModal(`<div style="display:flex;justify-content:space-between;align-items:center"><h2>${fam.ic} ${E(fam.nome)}</h2><button class="btn2" onclick="NP.fecha()">fechar</button></div><p style="color:#64748b;font-size:13px">Kits da Base (Base › Kits), pelo ID de cada produto. Valor = catálogo de hoje. Depois de usar, troque modelos e quantidades no sistema.</p>
 <div class="frm" style="grid-template-columns:1fr 1fr;margin-bottom:10px"><div><label>Ambiente (nome do sistema na proposta)</label><input id="np-kit-nome" placeholder="ex.: Living"></div></div>
 ${ks.map(k=>{const v=kitValor(k);return `<div class="ccard" style="padding:12px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>${E(k.nome)}</b><div style="font-size:12px;color:#64748b">${E(k.grupo)} · ${(k.itens||[]).length} produtos${v.falta.length?` · <span class="chipc bad">${v.falta.length} fora da Base</span>`:''}</div></div><div style="text-align:right"><b class="mono">${RS(v.v)}</b><div><button class="btn2 pri" ${v.falta.length?'disabled':''} onclick="const n=document.getElementById('np-kit-nome').value;const id=run(()=>A.npUsarKit(${J(pid)},${J(k.id)},n||${J(k.grupo)}),'Kit acrescentado');if(id){NP.fecha()}">usar</button></div></div></div>
 <div style="font-size:11.5px;color:#475569;margin-top:6px">${(k.itens||[]).map(i=>{const x=prod(i.produto_id);return `${E(i.qtd)}× ${E(x?x.nome:(i.nome||i.produto_id))}`}).join(' · ')}</div></div>`}).join('')||'<p>Nenhum kit nesta família.</p>'}`)};
NP.blocoNovo=function(pid){const n=prompt('Nome do ambiente / sistema:','');if(n==null)return;run(()=>A.addBloco(pid,String(n).trim()),'Acrescentado')};
NP.trocar=function(pid,lid){const p=prop(pid);let l=null;T(()=>blocosDe(p),[]).forEach(b=>(b.itens||[]).forEach(x=>{if(x.id===lid)l=x}));const pr=l&&prod(l.produto_id);const c=catCom(pr);
 abreModal(`<div style="display:flex;justify-content:space-between;align-items:center"><h2>Trocar ${E(pr?pr.nome:'')}</h2><button class="btn2" onclick="NP.fecha()">fechar</button></div><p style="color:#64748b;font-size:13px">Entra o produto escolhido com o preço e o custo do catálogo. Mesma quantidade (${E(l?l.qtd:'')}).</p>
 <input class="in wide" placeholder="buscar…" oninput="document.getElementById('np-tr-res').innerHTML=NP._trRes(${J(pid)},${J(lid)},this.value,'')"><div id="np-tr-res">${NP._trRes(pid,lid,'',c)}</div>`)};
NP._trRes=function(pid,lid,q,c){const rs=catalogo(q,q?'':c).slice(0,50);return `<div class="res" style="max-height:60vh">${rs.map(x=>`<div onclick="if(run(()=>A.npTrocarLinha(${J(pid)},${J(lid)},${J(x.id)}),'Produto trocado')!==null)NP.fecha()"><span><b>${E(x.nome)}</b> <span style="color:#64748b">${E(x.marca||'')}</span></span><span class="mono">${RS(x.preco)}</span></div>`).join('')}</div>`};

/* ───── Escopo do projeto (só projeto: Projetos dá o preço) ───── */
function escopo(p){const c=T(()=>compDe(p),null);const vd=vendida(p);
 return intro('Escopo do projeto','Proposta só de projeto: quem dá o preço é o Projetos. Aqui ficam o honorário, as revisões vendidas e os entregáveis.')+
 `<div class="ccard"><div class="frm"><div><label>Honorário do projeto (Projetos)</label><input ${vd?'disabled':''} value="${E(N2(p.honorarios||0))}" onchange="run(()=>A.compPreco(${J(p.id)},+String(this.value).replace(/\\./g,'').replace(',','.')),'Honorário')"></div>
 <div><label>Revisões do executivo vendidas</label><input ${vd?'disabled':''} type="number" min="0" value="${E(p.revisoes_vendidas!=null?p.revisoes_vendidas:3)}" onchange="run(()=>A.compRev(${J(p.id)},this.value),'Revisões')"></div></div>
 <div style="margin-top:10px;font-size:12.5px"><b>Entregáveis:</b> ${(p.entregaveis||[]).map(E).join(' · ')||'—'}</div></div>`+
 (typeof paneProjeto==='function'?`<details class="ccard"><summary style="cursor:pointer;font-weight:600">Detalhe do projeto (o mesmo da tela de hoje)</summary><div class="legacy" style="margin-top:8px">${T(()=>paneProjeto(p,M.resumo(p)),'')}</div></details>`:'')}

/* ───── Acústica: orçamento do Acoustaag ───── */
function acusticaCard(p){const recs=(S.db.acoustaag||[]).filter(r=>r&&!r._apagado);const lig=p.acoustaag_link?recs.find(r=>r.id===p.acoustaag_link):null;const vd=vendida(p);
 return `<div class="ccard" style="border-left:4px solid #f27d26"><b>🎚️ Orçamento do Acoustaag</b><div style="font-size:12.5px;color:#64748b;margin:4px 0 8px">Acústica é precificada no Acoustaag. Vincule o orçamento: os itens entram como um sistema desta proposta.</div>
 ${lig?`<div>Vinculado: <b>${E(lig.ambiente||lig.codinome||lig.id)}</b> ${vd?'':`<button class="btn2" onclick="run(()=>A.acuAtualizar(${J(p.id)}),'Orçamento atualizado')">atualizar do Acoustaag</button>`}</div>`:
 (vd?'—':`<select class="in" id="np-acu" style="min-width:320px"><option value="">— escolha o orçamento —</option>${recs.map(r=>`<option value="${E(r.id)}">${E(r.ambiente||r.codinome||r.id)}${r.proposta_numero?' · #'+E(r.proposta_numero):''}</option>`).join('')}</select> <button class="btn2 pri" onclick="run(()=>A.acuVincular(${J(p.id)},document.getElementById('np-acu').value),'Vinculado ao Acoustaag')">vincular</button>`)}</div>`}

/* ───── Pós-venda: atendimento (valor do atendimento é do Pós-venda) ───── */
function posvenda(p){const R=numeros(p).R;return intro('Atendimento','Proposta de pós-venda: visitas, peças e garantia vêm do atendimento no Pós-venda. Peças entram como produtos abaixo.')+
 `<div class="ccard"><div style="display:flex;justify-content:space-between"><span>Valor do atendimento (Pós-venda)</span><b class="mono">${RS(R.tot)}</b></div>${p.at?`<div style="font-size:12px;color:#64748b;margin-top:4px">Atendimento ${E(typeof p.at==='object'?(p.at.numero||p.at.id||''):p.at)} · <a href="#/posatend">abrir no Pós-venda</a></div>`:''}</div>`+sistemas(p,'foc').replace(/^<div class="intro">[\s\S]*?<\/div>/,'')}

/* ───── 3. PLANTAS ───── */
function planta(p){const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;return ((o&&o.prj_files)||[]).filter(f=>f&&!f._apagado)}
function plantas(p){const o=p.obra_id?T(()=>get('obras',p.obra_id),null):null;const fs=planta(p);const d=(S.db.prevendas_diag||[]).find(x=>x.proposta_id===p.id)||{status:'A fazer',rev:'',arquivos:[],_novo:true};
 return intro('Plantas','Onde cada coisa fica. Os arquivos sobem para a obra (os mesmos que o Projetos vê em Projetos › Arquivos).')+
 `<div class="ccard">${o?`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn2 pri" onclick="upload97('obra',${J(o.id)},{ent:'Planta de forro'})">⬆ Subir planta</button><button class="btn2" onclick="upload97('obra',${J(o.id)},{ent:'Estudo de pontos'})">⬆ Subir estudo de pontos</button><span style="font-size:12px;color:#64748b">Obra ${E(o.numero||'')} · ${E(o.nome)}</span></div>
 <table class="t" style="margin-top:10px"><thead><tr><th>Arquivo</th><th>Entregável</th><th>Rev.</th><th>Data</th><th>Quem</th></tr></thead><tbody>${fs.map(f=>`<tr><td>${E(f.nome)}</td><td>${E(f.entregavel||'')}</td><td>${E(f.rev||'')}</td><td>${E(f.data||'')}</td><td>${E(f.por||'')}</td></tr>`).join('')||'<tr><td colspan="5" style="color:#64748b">nenhum arquivo ainda</td></tr>'}</tbody></table>`:'<div>Sem obra: escolha a obra no Cadastro para subir plantas.</div>'}</div>`+
 (d?`<div class="ccard"><b>Diagrama de equipamentos (pré-vendas)</b> · status <span class="chipc">${E(d.status||'A fazer')}</span> ${d.rev?'· '+E(d.rev):''} <button class="btn2" style="margin-left:8px" onclick="diagDe(get('propostas',${J(p.id)}));upload97('diag',${J(p.id)})">⬆ subir diagrama</button>
 <div style="font-size:12px;color:#64748b;margin-top:4px">${(d.arquivos||[]).map(f=>E(f.nome)).join(' · ')||'sem arquivo'}</div></div>`:'')}

/* ───── 4. VALORES E MARGEM ───── */
function valores(p){const {R,F,alvo}=numeros(p);const vd=vendida(p);const bon=T(()=>podeEditarBonificacao(),false);
 const L=(l,v,cls)=>`<tr><td>${l}</td><td class="r mono ${cls||''}">${v}</td></tr>`;
 return intro('Valores e margem','O Resumo do Excel: as mesmas contas do editor de hoje.')+
 `<div class="ccard"><table class="t"><tbody>
 ${L('Equipamentos (com miscelânea das linhas)',RS(R.e.venda))}${L('Mão de obra ('+N2(R.s.total||0)+' diárias + miscelânea de serviço)',RS(R.s.venda))}${+p.ajuste?L('Ajuste',RS(p.ajuste)):''}
 ${L('<b>Total da proposta</b>','<b>'+RS(R.tot)+'</b>')}
 ${L('Impostos equipamentos ('+N2(T(()=>S.db.regras.imp_equip,11.61))+'%)','−'+RS(R.impE))}${L('Impostos mão de obra ('+N2(T(()=>S.db.regras.imp_serv,17))+'%)','−'+RS(R.impS))}
 ${L('Custo dos equipamentos','−'+RS(R.e.custo))}${L('Custo da mão de obra','−'+RS(R.s.custo))}${L('RT '+N2(+p.rt||0)+'% (sobre o preço sem impostos)','−'+RS(R.rt))}${L('Bonificação '+N2(+p.bonificacao||0)+'%','−'+RS(R.inc))}
 ${L('<b>Margem TAAG</b>','<b>'+RS(R.margem)+' · '+(R.mg==null?'—':PC(R.mg))+'</b>',R.mg>=alvo-1e-9?'ok':'bad')}
 ${L('Alvo de margem (com '+N2(+p.negociacao||0)+'% de negociação)',PC(alvo))}${F&&!F.ok?L('Faltam no preço (miscelânea) para o alvo',RS(F.X),'warn'):''}</tbody></table></div>
 <div class="ccard"><div class="frm">
 <div><label>Negociação prevista (%)</label><input ${vd?'disabled':''} type="number" step="0.5" min="0" value="${E(+p.negociacao||0)}" onchange="run(()=>A.setP(${J(p.id)},'negociacao',+this.value),'Negociação')"></div>
 <div><label>Bonificação (%) ${bon?'':'— só Gestão'}</label><input ${bon&&!vd?'':'disabled'} type="number" step="0.5" min="0" value="${E(+p.bonificacao||0)}" onchange="run(()=>A.setP(${J(p.id)},'bonificacao',+this.value),'Bonificação')"></div>
 <div><label>RT (do cadastro do parceiro)</label><input disabled value="${E(N2(+p.rt||0))}%"></div>
 <div><label>Ajuste no total (R$)</label><input ${vd?'disabled':''} value="${E(N2(p.ajuste||0))}" onchange="run(()=>A.setP(${J(p.id)},'ajuste',+String(this.value).replace(/\\./g,'').replace(',','.')||0),'Ajuste')"></div>
 </div></div>`+(vd&&typeof cenarioRealHtml==='function'?`<div class="legacy">${T(()=>cenarioRealHtml(p,false),'')}</div>`:'')}

/* ───── 5. PAGAMENTO + DADOS DO CLIENTE E DA NF (o painel de Fechamento da tela de hoje) ───── */
/* proposta sem fechamento (as lidas do Excel): começa com o mesmo padrão que o editor de hoje cria (blocosDe) — só com o clique */
A.npIniciarFech=function(pr){const p=get('propostas',pr);if(!p)throw new RuleError('Proposta não encontrada.');if(p.fechamento)return;
 p.fechamento={forma:'Parcelado',metodo:'PIX',parcelas:3,sinal_pct:5,primeiro:dplus(10),arquiteto_comissao:10};put('propostas',p,'fechamento iniciado')};
function pagamento(p){const R=T(()=>M.resumo(p),null);let h='';
 if(!p.fechamento)return intro('Pagamento e NF','Como o cliente paga e quem fatura.')+`<div class="ccard">Esta proposta ainda não tem as condições de pagamento (veio do arquivo Excel). <button class="btn2 pri" onclick="run(()=>A.npIniciarFech(${J(p.id)}),'Fechamento iniciado')">Começar o fechamento</button><div style="font-size:12px;color:#64748b;margin-top:6px">Começa com o padrão do editor de hoje: parcelado em 3, PIX, sinal 5%, 1º vencimento em 10 dias — depois ajuste.</div></div>`;
 try{h=typeof paneFechamento==='function'?paneFechamento(p,R):''}catch(e){h='<div class="ccard">O painel de fechamento não abriu para esta proposta ('+E(e.message)+'). Use a tela de hoje.</div>'}
 return intro('Pagamento e NF','Como o cliente paga e quem fatura — o mesmo painel de Fechamento da tela de hoje (o Financeiro lê daqui).')+`<div class="legacy">${h}</div>`}

/* ───── 6. ARQUIVOS GERADOS ───── */
function arquivos(p){const ppts=p.ppts||[];let docs='';try{docs=typeof paneDocs==='function'?paneDocs(p):''}catch(e){docs=''}
 return intro('Arquivos gerados','Conferir e gerar os documentos para apresentar ao cliente — também numa proposta vendida em andamento.')+
 `<div class="ccard"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn2 pri" onclick="__gerarPPT(${J(p.id)})">📽 Gerar apresentação (.pptx)</button><button class="btn2" onclick="exportProposta(${J(p.id)})" title="uso interno: tem marca e modelo — não enviar ao cliente">⬇ Lista interna (.csv, com marca e modelo)</button><button class="btn2" onclick="NP.cliente(${J(p.id)})">👁 Ver como o cliente vê</button><button class="btn2" onclick="__pptPick(${J(p.id)})">📎 Anexar apresentação feita à mão</button></div>
 ${ppts.length?`<table class="t" style="margin-top:10px"><tbody>${ppts.map((x,i)=>`<tr><td>${E(x.nome)}</td><td>${E(x.data||'')}</td><td>${E(x.por||'')}</td><td class="r"><button class="lnk" style="color:#dc2626" onclick="run(()=>A.removerPPT(${J(p.id)},${i}),'Removido')">remover</button></td></tr>`).join('')}</tbody></table>`:''}</div>`+(docs?`<div class="legacy">${docs}</div>`:'')}

/* ───── modo cliente + comparação A×B ───── */
NP.cliente=function(pid){const p=prop(pid);let h='';try{h=paneCliente(p,M.resumo(p))}catch(e){h='<p>Não abriu: '+E(e.message)+'</p>'}abreModal(`<div style="display:flex;justify-content:flex-end"><button class="btn2" onclick="NP.fecha()">fechar</button></div>${h}`)};
function itensDe(p){const m=new Map();T(()=>blocosDe(p),[]).forEach(b=>(b.itens||[]).forEach(l=>{const id=l.produto_id;const x=m.get(id)||{q:0,v:0};x.q+=+l.qtd||0;x.v+=linhaTot(l);m.set(id,x)}));return m}
NP.itensDe=itensDe;
NP.comparar=function(pid){const p=prop(pid);const g=grupoDe(p);const M_=g.map(itensDe);const ids=[...new Set(M_.flatMap(m=>[...m.keys()]))];
 const nome=id=>T(()=>prod(id).nome,id);const rows=ids.map(id=>({id,c:catCom(prod(id))||'—',v:M_.map(m=>m.get(id)||{q:0,v:0})})).sort((a,b)=>a.c.localeCompare(b.c,'pt-BR')||nome(a.id).localeCompare(nome(b.id),'pt-BR'));
 const tot=g.map(q=>numeros(q).R);
 abreModal(`<div style="display:flex;justify-content:space-between;align-items:center"><h2>⇄ Comparar opções</h2><button class="btn2" onclick="NP.fecha()">fechar</button></div>
 <table class="t"><thead><tr><th></th>${g.map((q,i)=>`<th class="r">Opção ${E(letraDe(q,i))} · #${E(q.numero)}</th>`).join('')}</tr></thead><tbody>
 <tr><td><b>Total</b></td>${tot.map(R=>`<td class="r mono"><b>${RS(R.tot)}</b></td>`).join('')}</tr>
 <tr><td>Equipamentos</td>${tot.map(R=>`<td class="r mono">${RS(R.e.venda)}</td>`).join('')}</tr><tr><td>Mão de obra</td>${tot.map(R=>`<td class="r mono">${RS(R.s.venda)}</td>`).join('')}</tr>
 <tr><td>Margem TAAG</td>${tot.map(R=>`<td class="r mono">${R.mg==null?'—':PC(R.mg)}</td>`).join('')}</tr></tbody></table>
 <h3 style="font-size:15px;margin:14px 0 6px">Equipamento por equipamento</h3>
 <table class="t"><thead><tr><th>Produto</th><th>Categoria comercial</th>${g.map((q,i)=>`<th class="r">${E(letraDe(q,i))}: qtd · valor</th>`).join('')}<th>Diferença</th></tr></thead><tbody>${rows.map(r=>{const qs=r.v.map(x=>x.q);const igual=qs.every(x=>x===qs[0]);
 return `<tr><td>${E(nome(r.id))}</td><td><span class="chipc">${E(r.c)}</span></td>${r.v.map(x=>`<td class="r mono">${x.q?N2(x.q)+' · '+RS(x.v):'—'}</td>`).join('')}<td>${igual?'':qs.some(x=>!x)?'<span class="chipc warn">só em '+r.v.map((x,i)=>x.q?letraDe(g[i],i):'').filter(Boolean).join(', ')+'</span>':'<span class="chipc">quantidade</span>'}</td></tr>`}).join('')}</tbody></table>`)};

/* ───── a tela ───── */
function lista(){const ps=(S.db.propostas||[]).filter(p=>p&&!p._apagado);const ab=ps.filter(p=>['rascunho','em_prevendas','enviada','revisao','alternativa','aprovada_cliente'].includes(p.estado));
 const and=ps.filter(p=>['vendida','em_obra'].includes(p.estado));const li=(arr)=>arr.slice(0,400).map(p=>{const R=numeros(p).R;return `<tr style="cursor:pointer" onclick="NP.abrir(${J(p.id)})"><td class="mono">#${E(p.numero)}</td><td>${E(T(()=>cliente(p.id),p.sigla||''))}</td><td>${E(TIPOS[tipoDe(p)].nome)}</td><td>${E(p.estado)}</td><td class="r mono">${RS(R.tot)}</td></tr>`}).join('');
 return `<div class="ccard"><b>Começar uma proposta nova</b><div style="margin-top:8px">${cadastroNovo()}</div></div>
 <div class="ccard"><b>Em andamento (vendidas, editáveis)</b> · ${and.length}<table class="t" style="margin-top:6px"><tbody>${li(and)}</tbody></table></div>
 <div class="ccard"><b>Abertas</b> · ${ab.length}<table class="t" style="margin-top:6px"><tbody>${li(ab)}</tbody></table></div>`}
SCREENS.np=function(arg){css();
 if(!NP.pode())return head('Nova proposta','Tela em teste — por enquanto só o Bruno vê. A proposta continua na tela de hoje.');
 const p=arg?prop(arg):null;
 if(!p)return `<div class="np">${arg?'<div class="ccard">Proposta não encontrada.</div>':''}<section class="np-hero" style="padding-bottom:18px"><div class="np-eb">Comercial · Nova proposta</div><h1>Propostas na tela nova</h1><div class="np-pills"><span>Mesmos registros e mesmo motor da tela de hoje · em teste, só o Bruno vê</span></div></section>${lista()}</div>`;
 const s=passoAtual(p);const t=tipoDe(p);
 const corpo={cad:()=>cadastro(p),sis:()=>sistemas(p,'sis'),cab:()=>sistemas(p,'cab'),foc:()=>sistemas(p,'foc'),acu:()=>sistemas(p,'acu'),esc:()=>escopo(p),pv:()=>posvenda(p),plan:()=>plantas(p),val:()=>valores(p),pag:()=>pagamento(p),arq:()=>arquivos(p)}[s];
 let c='';try{c=corpo()}catch(e){console.error('v234',e);c=`<div class="ccard">Este passo não abriu: ${E(e.message)}. A proposta continua na <a href="#/editor/${E(p.id)}">tela de hoje</a>.</div>`}
 const lado=['cad','pag','arq'].includes(s)?'':meter(p);
 return `<div class="np">${hero(p)}${steps(p)}<div class="${lado?'np-grid':''}"><div>${c}${navbar(p)}</div>${lado}</div></div>`};

/* ponte: no editor de hoje e na lista, o Bruno vê o botão para a tela nova */
const _ed=SCREENS.editor;if(typeof _ed==='function')SCREENS.editor=function(id){const h=_ed.apply(this,arguments);if(typeof h!=='string'||!NP.pode()||!prop(id))return h;
 return `<div style="margin-bottom:8px"><a class="btn-soft" style="font-size:12px;background:#0b0f19;color:#fff;border-radius:10px;padding:5px 12px;text-decoration:none" href="#/np/${E(id)}">✨ Abrir na tela nova (teste)</a></div>`+h};
const _pr=SCREENS.propostas;if(typeof _pr==='function')SCREENS.propostas=function(){const h=_pr.apply(this,arguments);if(typeof h!=='string'||!NP.pode())return h;
 return `<div style="margin-bottom:8px"><a class="btn-soft" style="font-size:12px;background:#0b0f19;color:#fff;border-radius:10px;padding:5px 12px;text-decoration:none" href="#/np">✨ Propostas na tela nova (teste)</a></div>`+h};
})();
