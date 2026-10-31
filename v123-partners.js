/* =====================================================================================================================
   V123 · PARTNERS — "the CRM also has configurations, which makes no sense: we already have a Base that feeds the system".
   One master list per thing, in the Base; everything else reads it.
   1  every partner always has the CRM id (assigned on save + one-time backfill); the CRM frame reloads each time a CRM page opens
   2  ONE partner-type list (S.db.cad.ind_tipos, lossless merge of the CRM's 11 + the Base's 8); the CRM reads/writes it
   3  the CRM's lists and automatic rules live in the Base (S.db.listas.relacionamento · S.db.regras.relacionamento);
      CRM › Configurações is a short page that links to the Base; Google-Sheets-era controls removed
   4  Base › Relacionamento (CRM) is read-only: partners are edited in Base › Parceiros (the CRM card is the relationship view)
   5  architect / gerenciadora / indicador fields are pickers fed by the partner list; every record stores the partner id
   6  one store per rule (regras.*), legacy keys are accessors onto it; one "Regras & parâmetros" screen in the Base
   7  one list for frentes de venda + unidades de negócio (S.db.listas.frentes), every frente gets its key
   8  product brand / supplier linked to Marcas / Fornecedores; keypad brands are the Marcas marked "keypad"
   9  categoria → fase: Base › Categorias wins, the old Comercial list follows it
   10 placeholder pages ("próxima sessão de construção") redirect to the nearest real screen
   ===================================================================================================================== */
(function(){
if(window.__V123_partners)return;window.__V123_partners=true;
if(typeof S==='undefined'||!S.db)return;
const W=(tag,f)=>{try{return f()}catch(e){console.warn('[v123 partners] '+tag,e)}};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const J=s=>E(JSON.stringify(String(s==null?'':s)));
const nBR=(n,d)=>(+n||0).toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d==null?2:d});
const hoje=()=>{try{return today()}catch(e){return new Date().toISOString().slice(0,10)}};
const F=()=>S.db._v123p||(S.db._v123p={});
const slug=s=>nz(s).replace(/\s+/g,'_').slice(0,40)||'x';
const Err=m=>{try{return new RuleError(m)}catch(e){return new Error(m)}};
const lg=(t,id,m)=>{try{log(t,id,m)}catch(e){}};
const sv=()=>{try{save()}catch(e){console.warn('[v123 partners] save',e)}};
const P=window.V123P=window.V123P||{};

/* =============================================== 2 · ONE partner-type list =============================================== */
const CRM_LEG={'ARQUITETURA':'arquiteto','GERENCIADORA':'gerenciadora','ENGENHARIA':'engenheiro','LIGHTING DESIGN':'luminotecnico','OUTROS':'outro'};
const CRM_NOVOS=[['associacao','Associação','ASSOCIAÇÃO','outro'],['construtora','Construtora','CONSTRUTORA','empresa'],['eng_gerenciadora','Engenharia e gerenciadora','ENGENHARIA E GERENCIADORA','gerenciadora'],['imobiliaria','Imobiliária','IMOBILIÁRIA','empresa'],['incorporadora','Incorporadora','INCORPORADORA','empresa'],['paisagismo','Paisagismo','PAISAGISMO','empresa']];
const PAPEL_DEF={arquiteto:'arquitetura',escritorio:'arquitetura',gerenciadora:'gerenciadora',engenheiro:'engenharia',luminotecnico:'luminotecnico',pf:'pf',empresa:'empresa',outro:'outro'};
const PAPEIS=[['arquitetura','Arquitetura'],['gerenciadora','Gerenciadora'],['engenharia','Engenharia'],['luminotecnico','Luminotécnico'],['pf','Pessoa física'],['empresa','Empresa'],['outro','Outro']];
const tipos=()=>{S.db.cad=S.db.cad||{};if(!Array.isArray(S.db.cad.ind_tipos))S.db.cad.ind_tipos=[];return S.db.cad.ind_tipos};
const papeisL=()=>{S.db.listas=S.db.listas||{};if(!Array.isArray(S.db.listas.parceiro_papeis))S.db.listas.parceiro_papeis=[];return S.db.listas.parceiro_papeis};
const nextN=()=>{const f=F();let m=+f.n||0;tipos().forEach(t=>m=Math.max(m,+t.crm_n||0));((S.db.listas||{}).relacionamento||[]).forEach(r=>m=Math.max(m,+r.n||0));f.n=m+1;return f.n};
const tipoById=id=>tipos().find(t=>t.id===id);
const tipoLabel=id=>{const t=tipoById(id);return t?t.nome:''};
const tipoByLabel=l=>{const k=nz(l);if(!k)return null;return tipos().find(t=>nz(t.nome)===k)||tipos().find(t=>nz(t.id)===k)||tipos().find(t=>nz(t.crm_legado)===k)||null};
function syncIndTipos(){W('IND_TIPOS',()=>{if(typeof IND_TIPOS!=='object')return;Object.keys(IND_TIPOS).forEach(k=>delete IND_TIPOS[k]);tipos().forEach(t=>{IND_TIPOS[t.id]=t.nome})})}
function ensurePapeis(){let ch=false;const L=papeisL();tipos().forEach(t=>{if(!L.some(r=>r.tipo===t.id)){L.push({id:'pp_'+t.id,tipo:t.id,papel:t._papel||PAPEL_DEF[t.id]||'outro'});ch=true}delete t._papel});return ch}
function addTipo(nome,papel,extra){nome=String(nome||'').trim();if(!nome)throw Err('Digite o nome do tipo de parceiro.');if(tipoByLabel(nome))throw Err(`O tipo "${nome}" já existe.`);let id=slug(nome),i=2;while(tipoById(id))id=slug(nome)+'_'+(i++);const t=Object.assign({id,nome,crm_n:nextN()},extra||{});if(papel)t._papel=papel;tipos().push(t);ensurePapeis();syncIndTipos();lg('cad','ind_tipos','tipo de parceiro: '+nome);return t}
function migrateTipos(){const f=F();if(f.tipos)return false;const L=tipos();
 /* lossless: every Base type keeps its key; the CRM's 11 labels map onto them; the 6 the Base did not have are added */
 Object.entries(CRM_LEG).forEach(([crm,k])=>{const t=tipoById(k);if(t&&!t.crm_legado)t.crm_legado=crm});
 const esc_=tipoById('escritorio');if(esc_&&!esc_.crm_legado)esc_.crm_legado='ARQUITETURA';
 ['pf','empresa'].forEach(k=>{const t=tipoById(k);if(t&&!t.crm_legado)t.crm_legado='OUTROS'});
 CRM_NOVOS.forEach(([id,nome,crm,papel])=>{if(!tipoById(id)&&!tipoByLabel(nome))L.push({id,nome,crm_legado:crm,_papel:papel})});
 /* CRM list rows the CRM itself had saved for tipo_parceiro (live data) — any value not yet in the list joins it */
 ((window.CRM_T||{}).listas||[]).filter(r=>r.lista==='tipo_parceiro').forEach(r=>{if(!tipoByLabel(r.valor))L.push({id:slug(r.valor),nome:String(r.valor).charAt(0)+String(r.valor).slice(1).toLowerCase(),crm_legado:String(r.valor).toUpperCase(),_papel:'outro',inativo:String(r.ativo)==='0'})});
 L.forEach(t=>{if(!t.crm_n)t.crm_n=nextN()});ensurePapeis();
 /* partners whose CRM type was one of the 6 new ones move to that exact type (the old CRM label is kept in tipo_crm_orig) */
 let moved=0;(S.db.parceiros||[]).forEach(p=>{const tc=String(p.tipo_crm||'').toUpperCase();const nv=CRM_NOVOS.find(x=>x[2]===tc);if(p.tipo_crm&&p.tipo_crm_orig===undefined)p.tipo_crm_orig=p.tipo_crm;if(nv&&p.tipo!==nv[0]){p.tipo=nv[0];moved++}});
 f.tipos={em:hoje(),base:8,crm:11,total:L.length,parceiros_movidos:moved};syncIndTipos();return true}
/* the CRM label of a partner always = the name of its Base type (tipo_crm kept only as that mirror for old readers) */
function sweepTipos(){let ch=false;(S.db.parceiros||[]).forEach(p=>{let l=tipoLabel(p.tipo);if(!l&&p.tipo){const t=tipoByLabel(p.tipo_crm)||tipoByLabel(p.tipo);if(t){p.tipo=t.id;l=t.nome}else{const n=addTipo(String(p.tipo));l=n.nome}ch=true}if(!p.tipo){p.tipo='outro';l=tipoLabel('outro')||'Outro';ch=true}if(l&&p.tipo_crm!==l){p.tipo_crm=l;ch=true}});tipos().forEach(t=>{if(!t.crm_n){t.crm_n=nextN();ch=true}});if(ensurePapeis())ch=true;return ch}
P.tipoAdd=function(nome,papel){addTipo(nome,papel||'outro');sweepTipos();sv();render()};
P.tipoSet=function(id,k,v){const t=tipoById(id);if(!t)throw Err('Tipo não encontrado.');if(k==='nome'){v=String(v||'').trim();if(!v)throw Err('O nome não pode ficar vazio.');const o=tipoByLabel(v);if(o&&o!==t)throw Err(`O tipo "${v}" já existe.`);t.nome=v}else if(k==='ativo'){if(v)delete t.inativo;else t.inativo=true}else if(k==='papel'){const r=papeisL().find(x=>x.tipo===id);if(r)r.papel=v;else papeisL().push({id:'pp_'+id,tipo:id,papel:v})}syncIndTipos();sweepTipos();lg('cad','ind_tipos',`${id}.${k} = ${v}`);sv();render()};
P.tipoDel=function(id){const n=(S.db.parceiros||[]).filter(p=>p.tipo===id).length;if(n)throw Err(`${n} parceiro(s) usam este tipo — troque o tipo deles antes de excluir (ou desative o tipo).`);const L=tipos();const i=L.findIndex(t=>t.id===id);if(i>=0)L.splice(i,1);const pl=papeisL();const j=pl.findIndex(r=>r.tipo===id);if(j>=0)pl.splice(j,1);syncIndTipos();lg('cad','ind_tipos','tipo removido: '+id);sv();render()};

/* =============================================== 1 · every partner has the CRM id =============================================== */
function maxCrmRef(){let m=0;(S.db.parceiros||[]).forEach(p=>m=Math.max(m,+p.crm_id||0));const t=window.CRM_T||{};['contatos','interacoes','tarefas','justificativas','depara','esteira','decisoes'].forEach(k=>(t[k]||[]).forEach(r=>{m=Math.max(m,+r.parceiro_id||0)}));((window.CRM_RAW||{}).parceiros||[]).forEach(r=>m=Math.max(m,+r.id||0));return m}
function ensureCrmIds(){const ps=S.db.parceiros||[];const seen=new Set();const miss=[];ps.forEach(p=>{const c=+p.crm_id;if(!(c>0)||seen.has(c))miss.push(p);else seen.add(c)});if(!miss.length)return 0;let m=maxCrmRef();
 miss.forEach(p=>{p.crm_id=++m;const d={status:'A contatar',status_data:p.criado||hoje(),classificacao:'Sem classificação',responsavel_rel:'',responsavel_com:'',cidade:'',estado:'',telefones:'[]',email:'',site:'',redes:'[]',endereco:'',obs:'',origem:'Base de dados',primeira_interacao:'',exclusivo:false};Object.keys(d).forEach(k=>{if(p[k]===undefined)p[k]=d[k]})});
 const f=F();f.crm_ids=(f.crm_ids||0)+miss.length;return miss.length}
P.ensureCrmIds=ensureCrmIds;
P.abrirParceiro=function(crmId){const p=(S.db.parceiros||[]).find(x=>+x.crm_id===+crmId);S.bdQ=p?p.nome:'';if(location.hash==='#/dbparceiros')render();else location.hash='#/dbparceiros'};

/* =============================================== 3 · CRM lists & rules live in the Base =============================================== */
const CRM_LISTAS=[['status','Status do relacionamento',[['parceiros','status'],['interacoes','status']],['A contatar','Frio','Em aquecimento','Ativo','Não perturbe','Out']],
 ['tipo_contato','Tipo de contato',[['interacoes','tipo_contato']],['WhatsApp','E-mail','Ligação','Presencial','Outro']],
 ['evento','Evento realizado',[['interacoes','acao']],['Reunião no Escritório','Reunião na TAAG','Demo do Showroom','Visita à Boutique Focal','TAAG Labs no Escritório','TAAG Labs na TAAG','Almoço','Happy Hour','Evento']],
 ['resultado','Resultado do contato',[['interacoes','resultado']],['Receptivo','Pouco Receptivo','Sem Retorno']],
 ['area','Área (usuários do CRM)',[['usuarios','area']],['Comercial','Marketing','Diretoria','RP','Projetos','Desenvolvedor','Outra']],
 ['rede','Redes sociais',[],['Instagram','LinkedIn','Pinterest','Facebook','TikTok','YouTube','Site','Outro']],
 ['sugestao','Sugestões de próxima ação',[],['LIGAR','ENVIAR WHATSAPP','ENVIAR E-MAIL','AGENDAR REUNIÃO NO ESCRITÓRIO','AGENDAR REUNIÃO NA TAAG','AGENDAR TAAG LABS','AGENDAR ALMOÇO','AGENDAR VISITA À BOUTIQUE FOCAL','ENVIAR PRESENTE','FAZER FOLLOW-UP']]];
const RULES_PADRAO={aquecimentoMeses:6,ativoMeses:2,naoPerturbeDias:180,platinumDias:30,ouroDias:60,prataDias:90,aniversarioDias:7,semContatoDias:90};
const RULES_LB={aquecimentoMeses:'Em aquecimento · meses até o alerta',ativoMeses:'Ativo · meses sem indicação até o alerta',naoPerturbeDias:'Não perturbe · dias até o próximo alerta',aniversarioDias:'Aniversário · avisar N dias antes',platinumDias:'Platinum · dias entre contatos',ouroDias:'Ouro · dias entre contatos',prataDias:'Prata · dias entre contatos',semContatoDias:'Sem contato · dias (Painel de Gestão)'};
const REGUA_PADRAO=[[1,'Enviar fotos + vídeo da rede social + mensagem de agradecimento'],[7,'Enviar mensagem para contato comercial com o convidado'],[30,'Marcar reunião comercial no escritório (apresentação + novidades do mercado)'],[45,'Medir com a equipe comercial: interações e orçamentos gerados; definir próximos passos'],[90,'Enviar caixa de bolo de coco com mensagem afetiva — quem não é visto, não é lembrado'],[120,'Medir novamente com a equipe comercial: interações e orçamentos; definir próximos passos']].map(([d,s])=>({dias:d,sugestao:s.toUpperCase()}));
const relL=()=>{S.db.listas=S.db.listas||{};if(!Array.isArray(S.db.listas.relacionamento))S.db.listas.relacionamento=[];return S.db.listas.relacionamento};
const relR=()=>{S.db.regras=S.db.regras||{};if(!S.db.regras.relacionamento)S.db.regras.relacionamento={regras:Object.assign({},RULES_PADRAO),regua:REGUA_PADRAO.map(r=>Object.assign({},r))};return S.db.regras.relacionamento};
const cfgRow=k=>((window.CRM_T||{}).config||[]).find(c=>c.chave===k);
function migrateListas(){const f=F();if(f.listas)return false;const L=relL();const crm=((window.CRM_T||{}).listas||[]).filter(r=>r.lista!=='tipo_parceiro');let deCrm=0,padrao=0;
 CRM_LISTAS.forEach(([k,,,itens])=>{if(L.some(r=>r.lista===k))return;const rows=crm.filter(r=>r.lista===k).sort((a,b)=>(+a.ordem||0)-(+b.ordem||0));
  if(rows.length)rows.forEach((r,i)=>{L.push({id:'rl_'+k+'_'+i,n:nextN(),lista:k,valor:String(r.valor),ordem:+r.ordem||i+1,ativo:String(r.ativo)==='0'?'0':'1',chave:r.chave||(k==='status'?String(r.valor):'')});deCrm++});
  else itens.forEach((v,i)=>{L.push({id:'rl_'+k+'_'+i,n:nextN(),lista:k,valor:v,ordem:i+1,ativo:'1',chave:k==='status'?v:''});padrao++})});
 const R=relR();W('rules',()=>{const c=cfgRow('regras');if(c&&c.valor){const j=JSON.parse(c.valor);Object.keys(RULES_PADRAO).forEach(k=>{const v=Number(j[k]);if(Number.isFinite(v)&&v>0)R.regras[k]=v})}});
 W('regua',()=>{const c=cfgRow('regua');if(c&&c.valor){const j=JSON.parse(c.valor);if(Array.isArray(j)&&j.length)R.regua=j.map(r=>({dias:Number(r.dias),sugestao:String(r.sugestao||'').toUpperCase()})).filter(r=>r.dias>0&&r.sugestao)}});
 f.listas={em:hoje(),do_crm:deCrm,padrao,regras:'Base'};return true}
function crmListRows(){const rows=[];tipos().forEach((t,i)=>rows.push({id:+t.crm_n,lista:'tipo_parceiro',valor:String(t.nome).toUpperCase(),ordem:+t.ordem||i+1,ativo:t.inativo?'0':'1',chave:t.id}));relL().forEach(r=>rows.push({id:+r.n,lista:r.lista,valor:r.valor,ordem:+r.ordem||0,ativo:String(r.ativo)==='0'?'0':'1',chave:r.chave||''}));return rows}
function crmRun(req){try{return JSON.parse(window.CRM_SERVER.__v123orig(JSON.stringify(req)))}catch(e){console.warn('[v123] crmRun',e);return null}}
/* rename a CRM list value in the Base → every record that uses it follows (the CRM's own renameValues) */
function renameUso(k,de,para){const def=CRM_LISTAS.find(x=>x[0]===k);if(!def||!def[2].length||de===para)return 0;const r=crmRun({action:'renameValues',items:def[2].map(([table,field])=>({table,field,de,para}))});return r&&r.result||0}
function usoValor(k,v){const def=CRM_LISTAS.find(x=>x[0]===k);if(!def)return 0;let n=0;def[2].forEach(([tb,fd])=>{const arr=tb==='parceiros'?(S.db.parceiros||[]).filter(p=>!p.inativo):(((window.CRM_T||{})[tb])||[]);n+=arr.filter(r=>String(r[fd])===String(v)).length});return n}
P.relAdd=function(k,v){v=String(v||'').trim();if(!v)throw Err('Digite a nova opção.');if(k==='sugestao')v=v.toUpperCase();const L=relL();if(L.some(r=>r.lista===k&&nz(r.valor)===nz(v)))throw Err('Essa opção já existe.');const ord=Math.max(0,...L.filter(r=>r.lista===k).map(r=>+r.ordem||0))+1;L.push({id:'rl_'+Math.random().toString(36).slice(2,8),n:nextN(),lista:k,valor:v,ordem:ord,ativo:'1',chave:''});lg('listas','relacionamento',k+' + '+v);sv();render()};
P.relSet=function(id,campo,v){const r=relL().find(x=>x.id===id);if(!r)throw Err('Opção não encontrada.');if(campo==='valor'){v=String(v||'').trim();if(!v)throw Err('O nome não pode ficar vazio.');if(r.lista==='sugestao')v=v.toUpperCase();if(relL().some(x=>x!==r&&x.lista===r.lista&&nz(x.valor)===nz(v)))throw Err('Já existe uma opção com esse nome.');const de=r.valor;if(r.lista==='status'&&!r.chave)r.chave=de;r.valor=v;const n=renameUso(r.lista,de,v);lg('listas','relacionamento',`${r.lista}: ${de} → ${v} (${n} registro(s))`)}else if(campo==='ativo')r.ativo=v?'1':'0';sv();render()};
P.relMove=function(id,dir){const r=relL().find(x=>x.id===id);if(!r)return;const L=relL().filter(x=>x.lista===r.lista).sort((a,b)=>(+a.ordem||0)-(+b.ordem||0));L.forEach((x,i)=>x.ordem=i+1);const i=L.indexOf(r),j=i+dir;if(j<0||j>=L.length)return;const t=L[j].ordem;L[j].ordem=r.ordem;r.ordem=t;sv();render()};
P.relDel=function(id){const L=relL();const r=L.find(x=>x.id===id);if(!r)return;const n=usoValor(r.lista,r.valor);if(n)throw Err(`"${r.valor}" está em uso em ${n} registro(s) — desative a opção, ou renomeie-a.`);L.splice(L.indexOf(r),1);lg('listas','relacionamento',`${r.lista} − ${r.valor}`);sv();render()};
P.regraSet=function(k,v){const R=relR();if(!(k in RULES_PADRAO))return;v=Number(String(v).replace(',','.'));if(!(v>0))throw Err('Use um número maior que zero.');R.regras[k]=v;lg('regras','relacionamento',k+' = '+v);sv();render()};
P.reguaSet=function(i,k,v){const R=relR();const r=R.regua[i];if(!r)return;if(k==='dias'){v=Number(v);if(!(v>0))throw Err('D+ precisa ser maior que zero.');r.dias=v;R.regua.sort((a,b)=>a.dias-b.dias)}else r.sugestao=String(v||'').toUpperCase();sv();render()};
P.reguaAdd=function(){const R=relR();const d=R.regua.length?R.regua[R.regua.length-1].dias+30:1;R.regua.push({dias:d,sugestao:'NOVA AÇÃO'});sv();render()};
P.reguaDel=function(i){const R=relR();R.regua.splice(i,1);sv();render()};

/* ---------- the CRM server: lists, rules and partner types are answered from the Base ---------- */
function keyFromLabel(l){const t=tipoByLabel(l);if(t)return t.id;return addTipo(l,'outro').id}
function fixTipo(crmId,label){if(!label)return;const p=(S.db.parceiros||[]).find(x=>+x.crm_id===+crmId);if(!p)return;p.tipo=keyFromLabel(label);p.tipo_crm=tipoLabel(p.tipo)}
function installServer(){const srv=window.CRM_SERVER;if(!srv||srv.__v123)return;const orig=srv.api.bind(srv);srv.__v123orig=orig;srv.__v123=true;
 srv.api=function(payload){let req;try{req=JSON.parse(payload||'{}')}catch(e){return orig(payload)}
  try{
   const a=req.action;
   if(a==='loadAll'){ensureCrmIds();sweepTipos();const r=JSON.parse(orig(payload));if(r&&r.tables){r.tables.listas=crmListRows();const R=relR();const cfg=(r.tables.config||[]).filter(c=>c.chave!=='regras'&&c.chave!=='regua');const id=k=>(cfgRow(k)||{}).id||(k==='regras'?9001:9002);cfg.push({id:id('regras'),chave:'regras',valor:JSON.stringify(R.regras)});cfg.push({id:id('regua'),chave:'regua',valor:JSON.stringify(R.regua)});r.tables.config=cfg}return JSON.stringify(r)}
   if((a==='insert'||a==='update')&&req.table==='listas'){const row=req.row||{};if(row.lista==='tipo_parceiro'){let t=row.id?tipos().find(x=>+x.crm_n===+row.id):null;if(!t){t=tipoByLabel(row.valor)||addTipo(row.valor,'outro')}else{const o=tipoByLabel(row.valor);if(o&&o!==t)throw Err(`O tipo "${row.valor}" já existe.`);if(nz(t.nome)!==nz(row.valor))t.nome=String(row.valor)}if(row.ordem!=null)t.ordem=+row.ordem;if(String(row.ativo)==='0')t.inativo=true;else delete t.inativo;syncIndTipos();sweepTipos();sv();return JSON.stringify({ok:true,id:+t.crm_n})}
    const L=relL();let r=row.id?L.find(x=>+x.n===+row.id):null;if(!r){r={id:'rl_'+Math.random().toString(36).slice(2,8),n:nextN(),lista:row.lista,valor:'',ordem:0,ativo:'1',chave:''};L.push(r)}Object.assign(r,{lista:row.lista||r.lista,valor:String(row.valor??r.valor),ordem:+row.ordem||r.ordem,ativo:String(row.ativo)==='0'?'0':'1',chave:row.chave!=null?row.chave:r.chave});sv();return JSON.stringify({ok:true,id:+r.n})}
   if(a==='deleteRow'&&req.table==='listas'){const t=tipos().find(x=>+x.crm_n===+req.id);if(t){P.tipoDel(t.id);return JSON.stringify({ok:true,result:true})}const L=relL();const i=L.findIndex(x=>+x.n===+req.id);if(i>=0)L.splice(i,1);sv();return JSON.stringify({ok:true,result:i>=0})}
   if((a==='insert'||a==='update')&&req.table==='config'&&req.row&&(req.row.chave==='regras'||req.row.chave==='regua')){const R=relR();const j=JSON.parse(req.row.valor||'null');if(req.row.chave==='regras'&&j)Object.keys(RULES_PADRAO).forEach(k=>{const v=Number(j[k]);if(Number.isFinite(v)&&v>0)R.regras[k]=v});if(req.row.chave==='regua'&&Array.isArray(j))R.regua=j.map(r=>({dias:Number(r.dias),sugestao:String(r.sugestao||'').toUpperCase()})).filter(r=>r.dias>0);sv()}
   /* partner type: the label the CRM sends is a Base type name → the partner's tipo is that type (no TIPO_MAP guess) */
   let renomTipo=null;if(a==='renameValues')renomTipo=(req.items||[]).filter(it=>it.table==='parceiros'&&it.field==='tipo').map(it=>({de:it.de,para:it.para,ids:(S.db.parceiros||[]).filter(p=>(p.tipo_crm||tipoLabel(p.tipo))===it.de).map(p=>p.crm_id)}));
   if(a==='insert'&&req.table==='parceiros'&&req.row&&!(req.row.id&&(S.db.parceiros||[]).some(p=>+p.crm_id===+req.row.id))){const ex=acharDup('parceiros',{nome:req.row.nome,email:req.row.email});if(ex){STAT.recusados++;dupAviso('parceiros',ex,'recusado');return JSON.stringify({ok:false,error:`${ex.nome} já está cadastrado`})}}
   if((a==='insert'||a==='update')&&req.table==='parceiros')ensureCrmIds();
   const out=orig(payload);
   W('post',()=>{const r=JSON.parse(out);if(!r||r.ok===false)return;let ch=false;
    if((a==='insert'||a==='update')&&req.table==='parceiros'&&req.row&&req.row.tipo){fixTipo(r.id||req.row.id,req.row.tipo);ch=true}
    if(a==='batch')(req.ops||[]).forEach(o=>{if(o.table==='parceiros'&&o.row&&o.row.tipo){const p=(S.db.parceiros||[]).find(x=>nz(x.nome)===nz(o.row.nome))||null;if(p){p.tipo=keyFromLabel(o.row.tipo);p.tipo_crm=tipoLabel(p.tipo);ch=true}}});
    if(renomTipo)renomTipo.forEach(x=>x.ids.forEach(id=>{fixTipo(id,x.para);ch=true}));
    if(a==='insert'&&req.table==='parceiros'){ensureCrmIds();ch=true}
    if(ch){sweepTipos();sv()}});
   return out}catch(e){if(!(e&&e.name==='RuleError'))console.warn('[v123] CRM api',e);return JSON.stringify({ok:false,error:String(e&&e.message||e)})}}}

/* ---------- the CRM frame: reload on every CRM page opening; Configurações = short page linking to the Base ---------- */
const FRAME_PATCH=`(function(){if(window.__v123cfg)return;window.__v123cfg=true;
const base=(h,crmId)=>{try{if(crmId!=null&&window.parent.V123P&&window.parent.V123P.abrirParceiro)return window.parent.V123P.abrirParceiro(crmId)}catch(e){}window.parent.location.hash=h};window.__v123base=base;
cardListas=function(){return '<div class="card" id="listas"><h2>Listas e regras</h2><p class="muted small" style="margin-top:0">Tipo de parceiro, status, tipo de contato, evento, resultado, área, redes e sugestões de ação — e as regras automáticas — ficam na <b>Base de dados</b>: uma lista só para o sistema inteiro. Mudou lá, o CRM lê daqui.</p><button class="btn primary" data-v123="listas" onclick="__v123base(\\'#/dblistas/relacionamento\\')">Abrir Base › Listas &amp; regras › Relacionamento</button></div>'};
cardEnvioSemanal=function(){return ''};
try{const _rec=recarregar;recarregar=async function(){for(let i=0;i<60&&((window.__v123busy||0)>0||PENDING>0);i++)await new Promise(r=>setTimeout(r,200));return _rec.apply(this,arguments)};const _v29=v29AoAbrir;v29AoAbrir=async function(){window.__v123busy=(window.__v123busy||0)+1;try{return await _v29.apply(this,arguments)}catch(e){}finally{window.__v123busy--}}}catch(e){}
openRegras=function(){base('#/dblistas/relacionamento')};
const _rp=renderParceiro;renderParceiro=function(v){const r=_rp.apply(this,arguments);try{const p=P(VIEW.params.id);if(p&&!v.querySelector('[data-v123=cad]')){const h=v.querySelector('h1');const b=document.createElement('button');b.className='btn sm';b.setAttribute('data-v123','cad');b.style.marginLeft='8px';b.textContent='Cadastro na Base ↗';b.title='O cadastro (nome, tipo, contato, CNPJ, RT) é editado em Base › Parceiros — este cartão é o relacionamento do mesmo parceiro';b.onclick=()=>base('#/dbparceiros',p.id);if(h)h.appendChild(b);else v.prepend(b)}}catch(e){}return r};
const _rc=renderConfig;renderConfig=function(v){const r=_rc.apply(this,arguments);try{
 [...v.querySelectorAll('.card')].forEach(c=>{const h=c.querySelector('h2');const t=h?h.textContent.trim():'';
  if(t==='Fonte de dados')c.innerHTML='<h2>Fonte de dados</h2><p class="muted small" style="margin-top:0">O CRM lê e grava na <b>Base de dados do SYSTAAG</b> — os mesmos parceiros do Comercial e do Financeiro. Não há planilha nem script a configurar.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="recarregar(true)">Recarregar dados</button><button class="btn" onclick="__v123base(\\'#/dbparceiros\\')">Parceiros na Base ↗</button></div>';
  if(t==='Backup e dados'){c.querySelectorAll('label.btn').forEach(l=>{if(/Importar/.test(l.textContent))l.remove()});const p=c.querySelector('p');if(p)p.textContent='Exporte uma cópia das tabelas do CRM em JSON. A fonte é a Base de dados do SYSTAAG.'}
 });
 v.querySelectorAll('button').forEach(b=>{if(/Atualizar De\\/Para desta versão|Enviar carga inicial|Testar conexão/.test(b.textContent))b.remove()});
 const rg=[...v.querySelectorAll('.card')].find(c=>/Regras automáticas/.test((c.querySelector('h2')||{}).textContent||''));if(rg&&!rg.querySelector('[data-v123=regras]')){const b=document.createElement('button');b.className='btn sm';b.setAttribute('data-v123','regras');b.textContent='Editar na Base ↗';b.onclick=()=>base('#/dblistas/relacionamento');const hd=rg.querySelector('.cardhead')||rg;hd.appendChild(b)}
}catch(e){console.warn('v123 config',e)}return r};
try{if(DB&&USER&&VIEW&&(VIEW.name==='config'||VIEW.name==='parceiro'))render()}catch(e){}
})();`;
let LASTCRM='';
const DONE=new Set();const once=k=>{if(DONE.has(k))return false;DONE.add(k);return true};
function frameWin(){try{return window.__crmFrameWin&&window.__crmFrameWin()}catch(e){return null}}
function patchFrame(){const w=frameWin();if(!w||w.__v123cfg)return !!w;try{if(typeof w.eval!=='function'||!w.systaagReady)return false;w.eval(FRAME_PATCH);return true}catch(e){return false}}
let frameTimer=0;function keepPatching(){if(frameTimer)return;let n=0;frameTimer=setInterval(()=>{n++;const w=frameWin();if((w&&w.__v123cfg)||n>200){clearInterval(frameTimer);frameTimer=0;return}patchFrame()},100)}
function reloadFrame(n){const w=frameWin();if(!w)return false;patchFrame();try{if(w.__v123busy>0&&(n||0)<40){setTimeout(()=>reloadFrame((n||0)+1),250);return false}if(w.systaagReady&&w.systaagReady()&&w.systaagReload){w.systaagReload();P.frameReloads=(P.frameReloads||0)+1;return true}}catch(e){}return false}
window.addEventListener('hashchange',()=>{if(!/^#\/crm/.test(location.hash))LASTCRM=''});
function wrapCrmScreens(){['crmhome','crmparceiros','crminteracoes','crmtarefas','crmoport','crmesteira','crmgestao','crmconfig','crmparceiro'].forEach(k=>{const f=SCREENS[k];if(typeof f!=='function'||!once('crm_'+k))return;const g=function(){const h=f.apply(this,arguments);W('crm reload',()=>{if(location.hash!==LASTCRM){LASTCRM=location.hash;reloadFrame()}keepPatching()});return h};g.__v123=true;SCREENS[k]=g})}

/* =============================================== 4 · Base › Relacionamento (CRM) = read-only =============================================== */
function wrapDbcrm(){const f=SCREENS.dbcrm;if(typeof f!=='function'||!once('dbcrm'))return;const g=function(arg){
 if(arg==='parceiros'){setTimeout(()=>location.replace('#/dbparceiros'),0);return head('Parceiros','Abrindo Base › Parceiros — o único cadastro de parceiros…')}
 if(arg==='listas'||arg==='config'){setTimeout(()=>location.replace('#/dblistas/relacionamento'),0);return head('Listas & regras','Abrindo Base › Listas & regras › Relacionamento…')}
 let h=f.apply(this,arguments);if(typeof h!=='string')return h;
 const nota=`<div class="card p-3 mb-3" style="border-left:4px solid #0d6efd;display:block" data-v123="dbcrm"><b>Só leitura.</b> Os parceiros têm um cadastro só: <a href="#/dbparceiros">Base › Parceiros</a> (nome, tipo, contato, CNPJ, RT). O cartão do parceiro no <a href="#/crmparceiros">Relacionamento (CRM)</a> é o relacionamento do mesmo registro. Listas e regras do CRM: <a href="#/dblistas/relacionamento">Base › Listas &amp; regras › Relacionamento</a>.</div>`;
 h=h.replace(/href="#\/dbcrm\/parceiros"/g,'href="#/dbparceiros"').replace(/href="#\/dbcrm\/(listas|config)"/g,'href="#/dblistas/relacionamento"');
 const i=h.indexOf('<div class="d-flex flex-wrap gap-1 mb-3">');return i>=0?h.slice(0,i)+nota+h.slice(i):h+nota};g.__v123=true;SCREENS.dbcrm=g}
function wrapDbparceiros(){const f=SCREENS.dbparceiros;if(typeof f!=='function'||!once('dbparceiros'))return;const g=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;
 (S.db.parceiros||[]).forEach(p=>{const k=`bdSet('parceiros','${p.id}','nome'`;const i=h.indexOf(k);if(i<0||h.indexOf(`data-v123crm="${E(p.id)}"`)>=0)return;const j=h.indexOf('>',i);if(j<0)return;h=h.slice(0,j+1)+`<a class="sub" style="font-size:11px;white-space:nowrap" href="#/crmparceiro/${E(p.id)}" title="Ver o relacionamento deste parceiro no CRM" data-v123crm="${E(p.id)}">relacionamento ↗</a>`+h.slice(j+1)});
 const tipNote=`<div class="sub mb-2" style="font-size:12px" data-v123="tipos">Tipos de parceiro: uma lista só, a mesma do CRM e do Financeiro — edite em <a href="#/dblistas/relacionamento">Listas &amp; regras › Relacionamento</a>.</div>`;
 const pc=W('possiveis',possiveisCard)||'';const i=h.indexOf('<div class="card"><div class="tblwrap">');return i>=0?h.slice(0,i)+pc+tipNote+h.slice(i):h+pc+tipNote};g.__v123=true;SCREENS.dbparceiros=g}

/* =============================================== Base › Listas & regras › Relacionamento (the new tab) =============================================== */
function relTab(){const sel=S.v123Lista||'status';const def=CRM_LISTAS.find(x=>x[0]===sel)||CRM_LISTAS[0];
 const pl=papeisL();const cnt=id=>(S.db.parceiros||[]).filter(p=>p.tipo===id&&!p.inativo).length;
 const tiposT=`<div class="card p-3 mb-3" data-v123="tipos-lista"><div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h6 class="mb-0">Tipos de parceiro</h6><div class="sub" style="font-size:12px">Uma lista só — a que Base › Parceiros, o CRM (Relacionamento), o Comercial e o Financeiro (Indicadores · RT) leem. O <b>papel</b> diz que campo o tipo preenche (arquitetura, gerenciadora, engenharia…).</div></div></div>
  <div class="tblwrap mt-2"><table class="tbl"><thead><tr><th>Tipo</th><th>Papel</th><th class="text-end">Parceiros</th><th>Ativo</th><th></th></tr></thead><tbody>${tipos().map(t=>{const pp=(pl.find(r=>r.tipo===t.id)||{}).papel||'outro';const n=cnt(t.id);return `<tr data-tipo="${E(t.id)}"><td><input class="form-control form-control-sm" style="min-width:220px" value="${E(t.nome)}" onchange="run(()=>V123P.tipoSet('${E(t.id)}','nome',this.value),'Tipo renomeado')"></td><td><select class="form-select form-select-sm" style="width:auto" onchange="run(()=>V123P.tipoSet('${E(t.id)}','papel',this.value),'Papel salvo')">${PAPEIS.map(([v,l])=>`<option value="${v}" ${v===pp?'selected':''}>${l}</option>`).join('')}</select></td><td class="text-end">${n?`<a href="#/dbparceiros" onclick="S.bdQ=${J(t.nome)}">${nBR(n,0)}</a>`:'—'}</td><td><input type="checkbox" class="form-check-input" ${t.inativo?'':'checked'} onchange="run(()=>V123P.tipoSet('${E(t.id)}','ativo',this.checked),'Salvo')"></td><td>${n?'':`<button class="iconbtn" title="Excluir" onclick="run(()=>V123P.tipoDel('${E(t.id)}'),'Tipo excluído')"><i class="bi bi-trash"></i></button>`}</td></tr>`}).join('')}</tbody></table></div>
  <div class="d-flex gap-2 mt-2"><input id="v123_tipo_novo" class="form-control form-control-sm" style="max-width:260px" placeholder="Novo tipo de parceiro"><button class="btn-apple" data-v123="tipo-add" onclick="run(()=>V123P.tipoAdd(document.getElementById('v123_tipo_novo').value),'Tipo cadastrado')"><i class="bi bi-plus-lg me-1"></i>Adicionar</button></div>
  <div class="sub mt-2" style="font-size:11.5px">${nBR(tipos().length,0)} tipos = ${nBR(tipos().filter(t=>!t.inativo).length,0)} ativos + ${nBR(tipos().filter(t=>t.inativo).length,0)} desativados · ${nBR((S.db.parceiros||[]).filter(p=>!p.inativo).length,0)} parceiros ativos.</div></div>`;
 const rows=relL().filter(r=>r.lista===def[0]).sort((a,b)=>(+a.ordem||0)-(+b.ordem||0));
 const listasT=`<div class="card p-3 mb-3" data-v123="rel-listas"><h6 class="mb-0">Listas do Relacionamento (CRM)</h6><div class="sub mb-2" style="font-size:12px">As opções que o CRM mostra. Renomear aqui atualiza todos os registros que usam a opção. Desativar esconde a opção sem apagar o histórico.</div>
  <div class="d-flex flex-wrap gap-1 mb-2">${CRM_LISTAS.map(([k,l])=>`<button class="btn-soft" style="font-size:12px;${k===def[0]?'background:var(--apple-subtle,#e0f2fe);font-weight:700':''}" data-v123lista="${k}" onclick="S.v123Lista='${k}';render()">${l} <span class="sub">${nBR(relL().filter(r=>r.lista===k).length,0)}</span></button>`).join('')}</div>
  <div class="tblwrap"><table class="tbl"><thead><tr><th>Opção</th><th class="text-end">Em uso</th><th>Ativa</th><th></th></tr></thead><tbody>${rows.map((r,i)=>{const u=def[2].length?usoValor(def[0],r.valor):null;return `<tr data-rel="${E(r.id)}"><td><input class="form-control form-control-sm" style="min-width:240px" value="${E(r.valor)}" onchange="run(()=>V123P.relSet('${E(r.id)}','valor',this.value),'Opção renomeada')"></td><td class="text-end">${u==null?'—':nBR(u,0)}</td><td><input type="checkbox" class="form-check-input" ${String(r.ativo)==='0'?'':'checked'} onchange="run(()=>V123P.relSet('${E(r.id)}','ativo',this.checked),'Salvo')"></td><td style="white-space:nowrap"><button class="iconbtn" ${i?'':'disabled'} onclick="V123P.relMove('${E(r.id)}',-1)">↑</button><button class="iconbtn" ${i<rows.length-1?'':'disabled'} onclick="V123P.relMove('${E(r.id)}',1)">↓</button>${u?'':`<button class="iconbtn" title="Excluir" onclick="run(()=>V123P.relDel('${E(r.id)}'),'Opção excluída')"><i class="bi bi-trash"></i></button>`}</td></tr>`}).join('')}</tbody></table></div>
  <div class="d-flex gap-2 mt-2"><input id="v123_rel_novo" class="form-control form-control-sm" style="max-width:300px" placeholder="Nova opção em ${E(def[1])}"><button class="btn-apple" data-v123="rel-add" onclick="run(()=>V123P.relAdd('${def[0]}',document.getElementById('v123_rel_novo').value),'Opção incluída')"><i class="bi bi-plus-lg me-1"></i>Incluir</button></div></div>`;
 const R=relR();
 const regrasT=`<div class="card p-3 mb-3" data-v123="rel-regras"><h6 class="mb-0">Regras automáticas do Relacionamento</h6><div class="sub mb-2" style="font-size:12px">Os alertas do Painel de Ações do CRM. Antes ficavam escondidas nas Configurações do CRM; agora são um valor, um lugar.</div>
  <div class="row g-2">${Object.keys(RULES_PADRAO).map(k=>`<div class="col-6 col-md-3"><label class="sub" style="font-size:11px">${E(RULES_LB[k])}</label><input type="number" min="0.5" step="0.5" class="form-control form-control-sm" data-v123regra="${k}" value="${R.regras[k]}" onchange="run(()=>V123P.regraSet('${k}',this.value),'Regra salva')"></div>`).join('')}</div>
  <div class="mt-3"><b style="font-size:13px">Régua pós-evento</b><div class="sub" style="font-size:12px">Ações criadas pelo CRM depois de um evento (D+ dias).</div><table class="tbl mt-1"><thead><tr><th style="width:90px">D+</th><th>Sugestão de ação</th><th></th></tr></thead><tbody>${R.regua.map((r,i)=>`<tr><td><input type="number" min="1" class="form-control form-control-sm" value="${r.dias}" onchange="run(()=>V123P.reguaSet(${i},'dias',this.value),'Régua salva')"></td><td><input class="form-control form-control-sm" value="${E(r.sugestao)}" onchange="run(()=>V123P.reguaSet(${i},'sugestao',this.value),'Régua salva')"></td><td><button class="iconbtn" onclick="run(()=>V123P.reguaDel(${i}),'Etapa removida')"><i class="bi bi-trash"></i></button></td></tr>`).join('')}</tbody></table><button class="btn-soft mt-1" onclick="run(()=>V123P.reguaAdd(),'Etapa incluída')"><i class="bi bi-plus-lg me-1"></i>Adicionar etapa</button></div></div>`;
 return `<div class="row g-3"><div class="col-xl-6">${tiposT}${regrasT}</div><div class="col-xl-6">${listasT}</div></div>`}

/* =============================================== 6 · one store per rule =============================================== */
const RULE_ALIAS=[ /* [object getter, legacy key, canonical regras key, factor] — factor: legacy = canonical × factor */
 [()=>S.db.params,'serv_alvo_pct','serv_pct',1],
 [()=>S.db.params,'margem_final','margem_alvo',1],
 [()=>S.db.params,'imposto','imp_equip',0.01],
 [()=>S.db.params,'frete','frete_pct',0.01],
 [()=>{try{return PF()}catch(e){return S.db.params&&S.db.params.fin}},'margemMinima','margem_alvo',1],
 /* Financeiro's PF() keys (tied to regras at boot by FIN-24, lost when the store is reloaded — re-tied on every render) */
 [()=>{try{return PF()}catch(e){return S.db.params&&S.db.params.fin}},'impE','imp_equip',1],[()=>{try{return PF()}catch(e){return S.db.params&&S.db.params.fin}},'impS','imp_serv',1],
 [()=>{try{return PF()}catch(e){return S.db.params&&S.db.params.fin}},'frete','frete_pct',1],[()=>{try{return PF()}catch(e){return S.db.params&&S.db.params.fin}},'margemMin','margem_min',1],
 [()=>{try{return PF()}catch(e){return S.db.params&&S.db.params.fin}},'comissao','comissao_default',1]];
function migrateRegras(){const f=F();if(f.regras)return false;const rg=S.db.regras=S.db.regras||{};const pa=S.db.params=S.db.params||{};const antes={serv_pct:rg.serv_pct,serv_alvo_pct:pa.serv_alvo_pct,margem_alvo:rg.margem_alvo,margem_final:pa.margem_final,imp_equip:rg.imp_equip,imposto:pa.imposto,frete_pct:rg.frete_pct,frete:pa.frete,margem_min:rg.margem_min};
 W('margemMinima',()=>{antes.margemMinima=PF().margemMinima});
 /* the value the proposal editor's CALCULATION uses today wins: servAlvo/regra20Bloco read params.serv_alvo_pct; okFinal/margemAlvo read params.margem_final; M.resumo reads regras.imp_equip; frete: regras.frete_pct (= PF().frete) */
 if(pa.serv_alvo_pct!=null&&isFinite(+pa.serv_alvo_pct))rg.serv_pct=+pa.serv_alvo_pct;
 if(pa.margem_final!=null&&isFinite(+pa.margem_final))rg.margem_alvo=+pa.margem_final;
 if(rg.imp_equip==null&&pa.imposto!=null)rg.imp_equip=+pa.imposto*100;
 if(rg.frete_pct==null&&pa.frete!=null)rg.frete_pct=+pa.frete*100;
 f.regras={em:hoje(),antes,depois:{serv_pct:rg.serv_pct,margem_alvo:rg.margem_alvo,imp_equip:rg.imp_equip,frete_pct:rg.frete_pct,margem_min:rg.margem_min}};return true}
function installRuleAliases(){RULE_ALIAS.forEach(([og,key,can,fac])=>W('alias '+key,()=>{const o=og();if(!o)return;const d=Object.getOwnPropertyDescriptor(o,key);if(d&&d.get&&d.get.__v123)return;const g=function(){const v=(S.db.regras||{})[can];return v==null?v:Math.round(+v*fac*1e8)/1e8};g.__v123=true;Object.defineProperty(o,key,{get:g,set(v){S.db.regras[can]=fac===1?+v:Math.round(+v/fac*1e6)/1e6},configurable:true,enumerable:true})}))}
const RULES_UI=[['serv_pct','Serviço — alvo (% da proposta)','0.5','Editor (chip "alvo"), regra dos 20% por bloco, Raio-X'],['serv_min_pct','Serviço — mínimo (%)','0.5','Faixa do serviço na proposta (mínimo ↔ alvo)','params'],
 ['margem_alvo','Margem alvo — final, após a negociação (%)','0.5','Editor (barra de margem, semáforo), confirmação abaixo do alvo, Visão CEO'],['margem_fator_desc','Pontos de margem por 1% de desconto','0.1','Margem com que a proposta nasce = alvo + fator × desconto','params'],
 ['margem_min','Margem mínima para pagar participações (trava, %)','0.5','Financeiro: retém comissão/RT abaixo disto (gestor libera)'],
 ['imp_equip','Impostos sobre equipamentos (%)','0.01','Editor (margem), DRE gerencial, Financeiro'],['imp_serv','Retenção sobre serviços (%)','0.01','Editor (margem), Financeiro'],
 ['frete_pct','Frete (% da venda)','0.1','Financeiro (DRE), custo da proposta'],['comissao_default','Comissão padrão do vendedor (%)','0.1','Financeiro (participações)'],['girando_dias','"Girando" após N dias parado','1','Pipeline']];
const ruleObj=r=>r[4]==='params'?S.db.params:S.db.regras;
P.regra=k=>{const r=RULES_UI.find(x=>x[0]===k);return r?ruleObj(r)[k]:(S.db.regras||{})[k]};
P.setRegra=function(k,v){const r=RULES_UI.find(x=>x[0]===k);if(!r)throw Err('Regra desconhecida.');v=Number(String(v).replace(',','.'));if(!isFinite(v)||v<0)throw Err('Valor inválido.');const o=ruleObj(r);const old=o[k];o[k]=v;lg('regras',k,`${old} → ${v}`);try{syncMaster()}catch(e){}sv();render()};
function regrasCard(){return `<div class="card p-3 mb-3" data-v123="regras"><h6 class="mb-0">Regras &amp; parâmetros da proposta</h6><div class="sub mb-2" style="font-size:12px">Um valor, um lugar. Toda tela e toda conta leem daqui — Comercial, Financeiro (Parâmetros) e Visão CEO mostram estes mesmos números.</div>
 <div class="row g-2">${RULES_UI.map(r=>`<div class="col-12 col-md-6"><label class="sub" style="font-size:11px;font-weight:600">${E(r[1])}</label><input type="number" step="${r[2]}" class="form-control form-control-sm" data-v123rule="${r[0]}" value="${E(P.regra(r[0]))}" onchange="run(()=>V123P.setRegra('${r[0]}',this.value),'Regra salva — todas as telas releem')"><div class="sub" style="font-size:10.5px">usado em: ${E(r[3])}</div></div>`).join('')}</div>
 <div class="sub mt-2" style="font-size:11px">Impostos por regime (Simples, PIS/COFINS, ISS, IRPJ…) são outra coisa — a apuração por empresa, em <a href="#/impostos">Impostos</a>.</div></div>`}
const roRule=(k,suf)=>`<span class="chip info" data-v123ro="${k}" title="Editado em Base › Listas &amp; regras › Regras &amp; parâmetros">${nBR(P.regra(k))}${suf||''}</span> <a class="sub" style="font-size:11px" href="#/dblistas/regras">editar na Base</a>`;
function wrapParametros(){const f=SCREENS.parametros;if(typeof f!=='function'||!once('parametros'))return;const g=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;
 const rep=(re,k,suf)=>{h=h.replace(re,()=>roRule(k,suf))};
 rep(/<input[^>]*onchange="S\.db\.params\.margem_final=[^"]*"[^>]*>/g,'margem_alvo','%');rep(/<input[^>]*onchange="S\.db\.params\.margem_fator_desc=[^"]*"[^>]*>/g,'margem_fator_desc','');
 rep(/<input[^>]*onchange="S\.db\.params\.serv_min_pct=[^"]*"[^>]*>/g,'serv_min_pct','%');rep(/<input[^>]*onchange="S\.db\.params\.serv_alvo_pct=[^"]*"[^>]*>/g,'serv_pct','%');
 [['impE','imp_equip'],['impS','imp_serv'],['frete','frete_pct'],['margemMin','margem_min'],['comissao','comissao_default']].forEach(([a,k])=>rep(new RegExp(`<input[^>]*onchange="run\\(\\(\\)=>A\\.setParamFin\\('${a}',[^"]*"[^>]*>`,'g'),k,'%'));
 /* the partner-type list lives in Listas & regras › Relacionamento (one list) */
 h=h.replace(/(Tipos de indicador \(RT\))/,'$1 <a class="sub" style="font-size:11px" href="#/dblistas/relacionamento" data-v123="tipos-link">— a lista de tipos de parceiro é editada em Base › Listas &amp; regras › Relacionamento</a>');
 return `<div class="card p-2 mb-3" style="border-left:4px solid #0d6efd;display:block;font-size:12.5px" data-v123="params-nota">Margem, serviço, impostos, frete e comissão da proposta: <b>um valor, um lugar</b> — <a href="#/dblistas/regras">Base › Listas &amp; regras › Regras &amp; parâmetros</a>. Aqui eles aparecem só para leitura.</div>`+h};g.__v123=true;SCREENS.parametros=g}
function wrapFinconfig(){const f=SCREENS.finconfig;if(typeof f!=='function'||!once('finconfig'))return;const g=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;const card=`<a class="card p-3 mb-3 d-block" style="border-left:4px solid #0d6efd;text-decoration:none" href="#/dblistas/regras" data-v123="finconfig-regras"><b><i class="bi bi-sliders me-1"></i>Regras &amp; parâmetros (Base de dados)</b><div class="sub" style="font-size:12px">Margem alvo e mínima, impostos, frete, comissão e serviço — um lugar só, que o Comercial e o Financeiro leem.</div></a>`;const i=h.indexOf('<div class="row');return i>=0?h.slice(0,i)+card+h.slice(i):h+card};g.__v123=true;SCREENS.finconfig=g}

/* =============================================== Listas & regras: the new tab + the rules tab =============================================== */
function wrapDblistas(){const f=SCREENS.dblistas;if(typeof f!=='function'||!once('dblistas'))return;const g=function(arg){
 const addTab=(h,on)=>h.indexOf('data-v123="tab-rel"')>=0?h:h.replace(/(<div class="tabs mb-3">)([\s\S]*?)(<\/div>)/,(m,a,b,c)=>a+(on?b.replace(/class="on"/g,'class=""'):b).replace(/Regras &amp; metas|Regras & metas/,'Regras &amp; parâmetros')+`<button class="${on?'on':''}" data-v123="tab-rel" onclick="location.hash='#/dblistas/relacionamento'"><i class="bi bi-diagram-3 me-1"></i>Relacionamento</button>`+c);
 if(arg==='relacionamento'||arg==='parceiros'){let h=f.call(this,'comercial');if(typeof h!=='string')return h;const i=h.indexOf('<div class="tabs mb-3">');const j=i>=0?h.indexOf('</div>',i):-1;const top=j>=0?h.slice(0,j+6):'';return addTab(top,true)+relTab()}
 let h=f.apply(this,arguments);if(typeof h!=='string')return h;h=addTab(h,false);
 if(arg==='regras'){/* the old "Regras da proposta" card (4 of the same numbers) becomes the one canonical card */
  const k=h.indexOf('<b>Regras da proposta</b>');if(k>=0){const s=h.lastIndexOf('<div class="card',k);let depth=0,p=s,e=-1;const re=/<div\b|<\/div>/g;re.lastIndex=s;let m;while((m=re.exec(h))){if(m[0]==='</div>'){depth--;if(depth===0){e=m.index+6;break}}else depth++}if(s>=0&&e>s)h=h.slice(0,s)+regrasCard()+h.slice(e);else h=h.replace('<b>Regras da proposta</b>','<b>Regras da proposta</b>')}else if(h.indexOf('data-v123="regras"')<0){const t=h.indexOf('</div>',h.indexOf('<div class="tabs mb-3">'));h=h.slice(0,t+6)+regrasCard()+h.slice(t+6)}}
 if(!arg||arg==='comercial'){/* papéis per type: edited with the types (one list) */
  h=h.replace(/(<h6 class="mb-1">Papéis dos tipos de parceiro<\/h6><div class="sub mb-2">)/,'$1<b>Editado junto com os tipos, em <a href="#/dblistas/relacionamento">Relacionamento</a>.</b> ');
  h=h.replace(/Só o nome é editável — a chave move estoque, obra e dinheiro\./,'Uma lista só para frentes de venda e unidades de negócio (Financeiro). A chave nasce do nome e não muda — ela move estoque, obra e dinheiro. "Corporativo" é unidade, não frente de venda: não aparece nas propostas.')}
 return h};g.__v123=true;SCREENS.dblistas=g}

/* =============================================== 7 · one list: frentes de venda = unidades de negócio =============================================== */
const frL=()=>{S.db.listas=S.db.listas||{};if(!Array.isArray(S.db.listas.frentes))S.db.listas.frentes=[];return S.db.listas.frentes};
function frKey(v){let k=slug(v).replace(/_/g,''),i=2;const has=x=>frL().some(f=>f.k===x);if(!k)k='frente';const b=k;while(has(k))k=b+(i++);return k}
function migrateFrentes(){const f=F();if(f.frentes)return false;const L=frL();let add=[];
 W('un',()=>{const raw=Object.getOwnPropertyDescriptor(S.db.cad||{},'unidades_negocio');const arr=raw&&!raw.get?raw.value:[];(arr||[]).forEach(u=>{const nm=typeof u==='string'?u:(u&&(u.nome||u.id));if(!nm)return;if(!L.some(x=>nz(x.v)===nz(nm))){L.push({id:'li_'+slug(nm),k:frKey(nm),v:nm,venda:false});add.push(nm)}})});
 W('UNI',()=>{(window.FD1&&FD1.UNIDADES||[]).forEach(nm=>{if(typeof nm==='string'&&!L.some(x=>nz(x.v)===nz(nm))){L.push({id:'li_'+slug(nm),k:frKey(nm),v:nm,venda:false});add.push(nm)}})});
 f.frentes={em:hoje(),unidades_adicionadas:add};return true}
function sweepFrentes(){let ch=false;frL().forEach(x=>{if(!x.k&&String(x.v||'').trim()){x.k=frKey(x.v);ch=true}});
 W('FRENTES',()=>{if(typeof FRENTES==='undefined')return;frL().forEach(x=>{if(!x.k||x.venda===false)return;const y=FRENTES.find(z=>z[0]===x.k);if(y){if(y[1]!==x.v)y[1]=x.v}else FRENTES.push([x.k,x.v])})});
 W('FD1',()=>{if(!window.FD1||!Array.isArray(FD1.UNIDADES))return;const names=frL().filter(x=>String(x.v||'').trim()).map(x=>x.v);if(FD1.UNIDADES.join('|')!==names.join('|')){FD1.UNIDADES.length=0;names.forEach(n=>FD1.UNIDADES.push(n))}});
 return ch}
function installUnidades(){const c=S.db.cad=S.db.cad||{};const d=Object.getOwnPropertyDescriptor(c,'unidades_negocio');if(d&&d.get&&d.get.__v123)return;const g=function(){return frL().filter(x=>String(x.v||'').trim()).map(x=>x.v)};g.__v123=true;
 Object.defineProperty(c,'unidades_negocio',{get:g,set(arr){const names=(arr||[]).map(u=>typeof u==='string'?u:(u&&(u.nome||u.id))).filter(Boolean);const L=frL();
  names.forEach(n=>{if(!L.some(x=>nz(x.v)===nz(n)))L.push({id:'li_'+Math.random().toString(36).slice(2,8),k:frKey(n),v:n,venda:false})});
  const fora=L.filter(x=>String(x.v||'').trim()&&!names.some(n=>nz(n)===nz(x.v)));const venda=fora.filter(x=>x.venda!==false);if(venda.length)throw Err(`${venda.map(x=>x.v).join(', ')} é frente de venda — remova em Base › Listas & regras › Comercial.`);fora.forEach(x=>L.splice(L.indexOf(x),1));sweepFrentes()},configurable:true,enumerable:true})}
function wrapCadAdd(){if(typeof A==='undefined'||typeof A.cadAdd!=='function'||!once('cadAdd'))return;const f=A.cadAdd;const g=function(lista,obj){if(lista==='unidades_negocio'){const nm=String(obj&&obj.nome||'').trim();if(!nm)throw Err('Digite o nome da unidade.');if(frL().some(x=>nz(x.v)===nz(nm)))throw Err(`"${nm}" já existe.`);frL().push({id:'li_'+Math.random().toString(36).slice(2,8),k:frKey(nm),v:nm,venda:false});sweepFrentes();lg('cad','unidades_negocio','adicionado '+nm);sv();return}
 const r=f.apply(this,arguments);if(lista==='ind_tipos'){sweepTipos();syncIndTipos()}return r};g.__v123=true;A.cadAdd=g}
const semVenda=h=>{if(typeof h!=='string')return h;frL().filter(x=>x.venda===false&&x.k).forEach(x=>{h=h.split(`<option value="${x.k}" >${x.v}</option>`).join('').split(`<option value="${x.k}" selected>${x.v}</option>`).join(`<option value="${x.k}" selected>${x.v}</option>`)});return h};
function wrapSemVenda(){['editor','dbclientes'].forEach(k=>{const f=SCREENS[k];if(typeof f!=='function'||!once('sv_'+k))return;const g=function(){return semVenda(f.apply(this,arguments))};g.__v123sv=true;SCREENS[k]=g})}

/* =============================================== 5 · partner pickers + the partner id on every record =============================================== */
function nameIndex(){const m=new Map();(S.db.parceiros||[]).forEach(p=>{if(p.merged_into)return;const k=nz(p.nome);if(!k)return;m.set(k,m.has(k)?null:p)});return m}
const LINKS=[['clientes',c=>c,'arquiteto'],['obras',o=>o,'arquitetura'],['obras',o=>o,'gerenciadora'],['obras',o=>o,'engenharia'],['obras',o=>o,'luminotecnico'],['propostas',p=>p.fin,'indicador']];
const PREVN=new Map();
function linkPass(report){const idx=nameIndex();let ch=0;const sem=[],amb=[];const byId=new Map((S.db.parceiros||[]).map(p=>[p.id,p]));
 LINKS.forEach(([tb,sub,k])=>(S.db[tb]||[]).forEach(r=>{const o=sub(r);if(!o)return;const t=String(o[k]||'').trim();const kid=k+'_id';
  if(!t){if(o[kid]){delete o[kid];ch++}return}
  /* the partner was renamed (the text still says the old name of the SAME id) → the record follows the id */
  const was=o[kid]&&byId.get(o[kid]);if(was&&nz(was.nome)!==nz(t)&&PREVN.has(was.id)&&nz(PREVN.get(was.id))===nz(t)){o[k]=was.nome;ch++;return}
  const hit=idx.get(nz(t));
  if(hit){if(o[kid]!==hit.id){o[kid]=hit.id;ch++}}else{if(o[kid]){const p=(S.db.parceiros||[]).find(x=>x.id===o[kid]);if(!p||nz(p.nome)!==nz(t)){delete o[kid];ch++}}if(report)(hit===null?amb:sem).push({tabela:tb,campo:k,texto:t,id:r.id})}}));
 PREVN.clear();(S.db.parceiros||[]).forEach(p=>PREVN.set(p.id,p.nome));return report?{mudou:ch,sem,amb}:ch}
P.linkPass=linkPass;
P.vinculos=function(){const out={};LINKS.forEach(([tb,sub,k])=>{const key=tb+'.'+k;let com=0,sem=0;(S.db[tb]||[]).forEach(r=>{const o=sub(r);if(!o||!String(o[k]||'').trim())return;if(o[k+'_id'])com++;else sem++});out[key]={com,sem}});return out};
const optsParc=(papel,atual)=>{const tps=papel?(typeof tiposDoPapel==='function'?tiposDoPapel(papel):[]):null;const ps=(S.db.parceiros||[]).filter(p=>!p.inativo&&(!tps||!tps.length||tps.includes(p.tipo))).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR')).map(p=>[p.nome,p.nome]);const v=String(atual||'');if(v&&!ps.some(x=>nz(x[0])===nz(v)))ps.unshift([v,v+' (texto, sem cadastro)']);return ps};
function wrapCopForm(){if(typeof COP!=='object'||typeof COP.form!=='function'||!once('copform'))return;const f=COP.form;const g=function(title,fields,onSave,opts){W('cli picker',()=>{if(Array.isArray(fields)&&fields.some(x=>x&&x.k==='arquiteto'&&(!x.t||x.t==='text'))&&fields.some(x=>x&&x.k==='sigla')){fields=fields.map(x=>{if(!x||x.k!=='arquiteto'||(x.t&&x.t!=='text'))return x;const nm=((S.db.parceiros||[]).find(p=>nz(p.nome)===nz(x.v))||{}).nome||x.v;return Object.assign({},x,{t:'select',opts:optsParc('arquitetura',x.v),v:nm,help:'Do cadastro de Parceiros (o mesmo do CRM). Não está na lista? Cadastre em Base › Parceiros.'})})}});return f.call(this,title,fields,onSave,opts)};g.__v123=true;COP.form=g}
/* Financeiro › Vendas a confirmar: the indicador (RT) is already a picker over S.db.parceiros (ids) — nothing to change there */


/* =============================================== 5b · same person, two records (Bruno 29/10: "Roberto Migotto is a RT") =============================================== */
const MERGE_NOMES=['Roberto Migotto'];
const PID_KEYS=new Set(['pid','ind_id','parceiro_id','indicador_id','arquiteto_id','arquitetura_id','gerenciadora_id','engenharia_id','luminotecnico_id','escritorio_id','parceiro']);
const PID_ARR=/(^|\.)(parceiros|indicadores|participantes|rt_rec|rt)(\.|$)/;
function scoreParc(p){let n=0;['doc','banco','contato','email','whatsapp','obs','endereco','cidade'].forEach(k=>{if(String(p[k]||'').trim())n+=k==='doc'||k==='banco'?3:1});const J=JSON.stringify(Object.assign({},S.db,{parceiros:[]}));n+=(J.split('"'+p.id+'"').length-1)*2;const t=window.CRM_T||{};['contatos','interacoes','tarefas','justificativas'].forEach(k=>n+=(t[k]||[]).filter(r=>+r.parceiro_id===+p.crm_id).length);return n}
function repointIds(from,to){let n=0;const walk=(o,path)=>{if(!o||typeof o!=='object')return;for(const k in o){const v=o[k];if(v===from&&(PID_KEYS.has(k)||PID_ARR.test(path))){o[k]=to;n++}else if(v&&typeof v==='object')walk(v,path+'.'+k)}};Object.keys(S.db).forEach(k=>{if(k!=='parceiros'&&k!=='_v123p')walk(S.db[k],k)});
 /* a partner listed twice on the same record after the move collapses to one entry */
 const dedup=a=>{if(!Array.isArray(a))return a;const seen=new Set();return a.filter(x=>{const id=x&&(x.id||x.pid||x.ind_id);if(id!==to)return true;if(seen.has(to))return false;seen.add(to);return true})};
 (S.db.clientes||[]).forEach(c=>{if(c.parceiros)c.parceiros=dedup(c.parceiros)});(S.db.propostas||[]).forEach(p=>{if(p.fin&&p.fin.indicadores)p.fin.indicadores=dedup(p.fin.indicadores);if(p.rt_rec)p.rt_rec=dedup(p.rt_rec)});(S.db.negociacoes||[]).forEach(x=>{if(x.rt_rec)x.rt_rec=dedup(x.rt_rec)});return n}
const NOME_KEYS=new Set(['arquiteto','arquitetura','gerenciadora','engenharia','luminotecnico','indicador','escritorio']);
function renomeiaCopias(de,para){if(!de||nz(de)===nz(para))return 0;let n=0;const k0=nz(de);const walk=o=>{if(!o||typeof o!=='object')return;for(const k in o){const v=o[k];if(typeof v==='string'&&NOME_KEYS.has(k)&&nz(v)===k0){o[k]=para;n++}else if(v&&typeof v==='object')walk(v)}};Object.keys(S.db).forEach(k=>{if(k!=='_v123p')walk(S.db[k])});return n}
function mergeParc(win,lose){const moved={refs:repointIds(lose.id,win.id),crm:0};moved.nomes=renomeiaCopias(lose.nome,win.nome);
 const t=window.CRM_T||{};['contatos','interacoes','tarefas','justificativas','depara','esteira','decisoes'].forEach(k=>(t[k]||[]).forEach(r=>{if(+r.parceiro_id===+lose.crm_id){r.parceiro_id=+win.crm_id;moved.crm++}}));if(moved.crm)try{CRM_persistT()}catch(e){}
 Object.keys(lose).forEach(k=>{if(['id','crm_id','tipo','tipo_crm','nome','inativo'].includes(k))return;const v=lose[k];if((win[k]===undefined||win[k]===null||String(win[k]).trim()==='')&&v!==undefined&&v!==null&&String(v).trim()!=='')win[k]=v});
 if(!(+win.rt_pct>0)&&+lose.rt_pct>0)win.rt_pct=lose.rt_pct;
 /* RT-receiving role: the kept type must fill arquitetura/indicador; otherwise he is an architect */
 const pap=(papeisL().find(r=>r.tipo===win.tipo)||{}).papel;if(!['arquitetura','indicador'].includes(pap))win.tipo=(papeisL().find(r=>r.tipo===lose.tipo)||{}).papel==='arquitetura'?lose.tipo:'arquiteto';win.tipo_crm=tipoLabel(win.tipo);
 win.fundidos=(win.fundidos||[]).concat([{id:lose.id,crm_id:lose.crm_id,tipo:lose.tipo,em:hoje()}]);
 lose.inativo=true;lose.merged_into=win.id;lose.fundido_em=hoje();if(lose.escritorio&&nz(lose.escritorio)===nz(win.nome))lose.escritorio='';
 (S.db.parceiros||[]).forEach(p=>{if(p.escritorio&&p.id!==win.id&&nz(p.escritorio)===nz(win.nome))p.escritorio=win.nome});
 lg('parceiros',win.id,`fundido: ${lose.id} → ${win.id} (${moved.refs} vínculo(s), ${moved.crm} registro(s) do CRM)`);return moved}
function dupNomes(){const g={};(S.db.parceiros||[]).forEach(p=>{if(p.merged_into||p.inativo)return;const k=nz(p.nome);if(k)(g[k]=g[k]||[]).push(p.id+' · '+p.nome+' · '+p.tipo)});return Object.values(g).filter(v=>v.length>1)}
P.dupNomes=dupNomes;
/* a merged record is kept (lossless) but never offered or listed again: pickers and partner tables show the one kept record */
function hideMerged(){const m=document.getElementById('main');if(!m)return;const L=(S.db.parceiros||[]).filter(p=>p.merged_into);if(!L.length)return;
 L.forEach(p=>{m.querySelectorAll('option').forEach(o=>{if(o.value===p.id&&!o.selected)o.remove()});
  m.querySelectorAll('tr').forEach(tr=>{if(tr.closest('thead'))return;const h=tr.outerHTML;if((tr.getAttribute('data-row')===p.id||h.indexOf("'"+p.id+"'")>=0||h.indexOf('"'+p.id+'"')>=0)&&nz(tr.innerText).indexOf(nz(p.nome))>=0&&tr.getAttribute('data-row')!==p.merged_into&&h.indexOf("'"+p.merged_into+"'")<0&&h.indexOf('"'+p.merged_into+'"')<0)tr.remove()})})}
P.hideMerged=hideMerged;
function migrateMerge(){const f=F();if(f.fundir)return false;const res={fundidos:[]};
 MERGE_NOMES.forEach(nm=>{const ps=(S.db.parceiros||[]).filter(p=>!p.merged_into&&nz(p.nome)===nz(nm));if(ps.length<2)return;ps.sort((a,b)=>scoreParc(b)-scoreParc(a));const win=ps[0];ps.slice(1).forEach(l=>{const m=mergeParc(win,l);res.fundidos.push({nome:nm,mantido:win.id,crm_id:win.crm_id,fundido:l.id,vinculos_movidos:m.refs,crm_movidos:m.crm,tipo:win.tipo,rt_pct:win.rt_pct})})});
 res.outros_duplicados=dupNomes();f.fundir=Object.assign({em:hoje()},res);return true}

/* =============================================== ONE TRUTH: no duplicate partner / client / supplier / brand / category / obra =============================================== */
/* Bruno 29/10: "fix it so duplicates don't happen and there is only one place to be the truth". Every door ends in put()/bdSet()/the CRM server:
   a record whose normalized name (or CNPJ/CPF, or e-mail) already exists is never created — the door gets the existing record instead. */
const DUP_T=['parceiros','clientes','fornecedores','marcas','categorias','obras'];
const DUP_LB={parceiros:'parceiro',clientes:'cliente',fornecedores:'fornecedor',marcas:'marca',categorias:'categoria',obras:'obra'};
const LEGAL=new Set(['ltda','me','epp','eireli','sa','s','a','ss','mei','cia']);
function nomeKey(n){let t=nz(n).split(' ').filter(Boolean);while(t.length>1&&LEGAL.has(t[t.length-1]))t.pop();if(t.length>1&&t[t.length-1]==='a'&&t[t.length-2]==='s')t=t.slice(0,-2);return t.join(' ')}
const docKey=r=>{const d=String(r.doc||r.cnpj||r.cpf||'').replace(/\D/g,'');return d.length===11||d.length===14?d:''};
const mailKey=r=>{const m=String(r.email||(/@/.test(r.contato||'')?r.contato:'')||'').trim().toLowerCase();return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)?m:''};
const recKey=(t,r)=>t==='obras'?(r.cliente_id&&nomeKey(r.nome)?r.cliente_id+'|'+nomeKey(r.nome):''):nomeKey(r.nome);
const vivo=r=>r&&!r.merged_into;
function acharDup(t,r){const arr=S.db[t]||[];const k=recKey(t,r),d=t==='obras'||t==='marcas'||t==='categorias'?'':docKey(r),m=t==='obras'||t==='marcas'||t==='categorias'?'':mailKey(r);
 let hit=null;for(const x of arr){if(x===r||x.id===r.id)continue;if((k&&recKey(t,x)===k)||(d&&docKey(x)===d)||(m&&mailKey(x)===m)){hit=x;if(vivo(x))break}}
 if(hit&&hit.merged_into){const w=arr.find(y=>y.id===hit.merged_into);if(w)hit=w}return hit}
P.acharDup=acharDup;
const STAT=P.dupStat=P.dupStat||{recusados:0,reaproveitados:0,auto:0};
function abrirCad(t,id){const r=(S.db[t]||[]).find(x=>x.id===id);if(!r)return;S.bdQ=r.nome;const go={parceiros:'#/dbparceiros',clientes:'#/dbclientes',fornecedores:'#/fornecedores',marcas:'#/dados/marcas',categorias:'#/dados/categorias',obras:'#/obras/'+id}[t];if(t==='fornecedores'&&typeof fornForm==='function'){location.hash='#/fornecedores';setTimeout(()=>fornForm(id),300);return}if(location.hash===go)render();else location.hash=go}
P.abrirCad=abrirCad;
P.reativar=function(t,id){const r=(S.db[t]||[]).find(x=>x.id===id);if(!r)return;delete r.inativo;if(r.ativo===false)r.ativo=true;lg(t,id,'reativado');sv();render();dupAviso(t,r,'reativado')};
function dupAviso(t,ex,modo){W('aviso',()=>{let el=document.getElementById('v123dup');if(!el){el=document.createElement('div');el.id='v123dup';el.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;max-width:420px;background:var(--bs-body-bg,#fff);border:1px solid rgba(127,127,127,.35);border-left:5px solid #f5a623;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:12px 14px;font-size:13.5px';document.body.appendChild(el)}
 const ina=ex.inativo||ex.ativo===false;el.setAttribute('data-t',t);el.setAttribute('data-id',ex.id);
 el.innerHTML=`<div><b>${E(ex.nome)}</b> já está cadastrado${ina?' (inativo)':''}.</div><div class="sub" style="font-size:12px">${modo==='reaproveitado'?'Nenhum cadastro novo foi criado — usamos o que já existe.':modo==='reativado'?'Reativado.':'Nada foi criado: um '+DUP_LB[t]+' só, num lugar só.'}</div><div class="d-flex gap-2 mt-2"><button class="btn-apple" data-v123dup="abrir" onclick="V123P.abrirCad('${t}','${E(ex.id)}');document.getElementById('v123dup').remove()">Abrir cadastro</button>${ina?`<button class="btn-soft" data-v123dup="reativar" onclick="V123P.reativar('${t}','${E(ex.id)}')">Reativar</button>`:''}<button class="btn-soft" onclick="document.getElementById('v123dup').remove()">OK</button></div>`;clearTimeout(el.__t);el.__t=setTimeout(()=>{try{el.remove()}catch(e){}},15000)})}
P.dupAviso=dupAviso;
let EXPL=0;const explicito=f=>function(){EXPL++;try{return f.apply(this,arguments)}catch(e){const m=String(e&&e.message||'').match(/Já existe o cliente (.+?) \(([^)]+)\)/);if(m){const ex=(S.db.clientes||[]).find(c=>c.id===m[2]);if(ex){STAT.recusados++;dupAviso('clientes',ex,'recusado');throw Err(`${ex.nome} já está cadastrado`)}}throw e}finally{EXPL--}};
function wrapPutDup(){if(typeof window.put!=='function'||!once('putdup'))return;const f=window.put;const g=function(t,row,acao){
 if(DUP_T.includes(t)&&row&&typeof row==='object'&&!row.merged_into&&String(row.nome||'').trim()){const arr=S.db[t]||[];const novo=!arr.some(x=>x.id===row.id);const ex=acharDup(t,row);
  if(ex&&novo){if(EXPL){STAT.recusados++;dupAviso(t,ex,'recusado');throw Err(`${ex.nome} já está cadastrado`)}
   /* a door that was picking a value: it gets the existing record (blank fields of the existing one are completed) */
   Object.keys(row).forEach(k=>{if(['id','nome','sigla','crm_id','criado','criadoEm'].includes(k))return;const v=row[k];if((ex[k]===undefined||ex[k]===null||String(ex[k]).trim()==='')&&v!=null&&String(v).trim()!=='')ex[k]=v});
   const keep=Object.assign({},ex);Object.keys(row).forEach(k=>delete row[k]);Object.assign(row,keep);STAT.reaproveitados++;dupAviso(t,ex,'reaproveitado');return f.call(this,t,ex,acao)}
  if(ex&&!novo){const cur=arr.find(x=>x.id===row.id);if(cur&&recKey(t,cur)!==recKey(t,row)&&recKey(t,ex)===recKey(t,row)){STAT.recusados++;dupAviso(t,ex,'recusado');throw Err(`${ex.nome} já está cadastrado`)}}}
 return f.apply(this,arguments)};window.put=g;try{put=g}catch(e){}}
/* Base grids: a typed name that already exists is refused; the empty row that "Adicionar" created goes away (0 records) */
function wrapBdSetDup(){if(typeof window.bdSet!=='function'||!once('bdsetdup'))return;const f=window.bdSet;window.bdSet=function(t,id,k,v){if(DUP_T.includes(t)&&k==='nome'&&String(v||'').trim()){const arr=S.db[t]||[];const r=arr.find(x=>x.id===id);if(r){const probe=Object.assign({},r,{nome:v});const ex=acharDup(t,probe);if(ex&&ex.id!==id){STAT.recusados++;if(!String(r.nome||'').trim()){arr.splice(arr.indexOf(r),1);sv()}try{render()}catch(e){}dupAviso(t,ex,'recusado');return}}}return f.apply(this,arguments)}}
function wrapFormsDup(){if(typeof COP==='object'&&typeof COP.form==='function'&&once('copformdup')){const f=COP.form;COP.form=function(title,fields,onSave,opts){return f.call(this,title,fields,typeof onSave==='function'?explicito(onSave):onSave,opts)}}
 if(typeof window.formModal==='function'&&once('formmodaldup')){const f=window.formModal;window.formModal=function(title,fields,onSave,opts){return f.call(this,title,fields,typeof onSave==='function'?explicito(onSave):onSave,opts)}}}
P.explicito=explicito;
/* picking doors: "cliente novo" with a name that already exists → the existing client is used (no refusal, no duplicate) */
function wrapPickDoors(){if(window.CRMA&&typeof CRMA.criarOportunidade==='function'&&once('crmaopp')){const f=CRMA.criarOportunidade;CRMA.criarOportunidade=function(o){if(o&&!o.cliente_id&&String(o.cliente_nome||'').trim()){const ex=acharDup('clientes',{nome:o.cliente_nome});if(ex){o=Object.assign({},o,{cliente_id:ex.id,cliente_nome:'',codinome:''});STAT.reaproveitados++;dupAviso('clientes',ex,'reaproveitado')}}return f.call(this,o)}}
 if(typeof A!=='undefined'&&typeof A.novaNegociacao==='function'&&once('novaneg')){const f=A.novaNegociacao;A.novaNegociacao=function(o){if(o&&!o.cliente_id&&String(o.cliente_nome||'').trim()){const ex=acharDup('clientes',{nome:o.cliente_nome});if(ex){o=Object.assign({},o,{cliente_id:ex.id,criar_cliente:false});STAT.reaproveitados++;dupAviso('clientes',ex,'reaproveitado')}}return f.apply(this,[o].concat([].slice.call(arguments,1)))}}}


/* ---------- merge (lossless) for any of the tables ---------- */
const REF_KEYS={clientes:['cliente_id','clienteId'],fornecedores:['fornecedor_id'],marcas:['marca_id'],categorias:['categoria_id'],obras:['obra_id','obraId']};
const TXT_KEYS={fornecedores:['fornecedor'],marcas:['marca'],categorias:['categoria']};
function mergeRec(t,win,lose){if(t==='parceiros')return mergeParc(win,lose);let n=0;const ks=new Set(REF_KEYS[t]||[]),tx=new Set(TXT_KEYS[t]||[]);const ln=nz(lose.nome);
 const walk=o=>{if(!o||typeof o!=='object')return;for(const k in o){const v=o[k];if(v===lose.id&&ks.has(k)){o[k]=win.id;n++}else if(v&&typeof v==='object')walk(v)}};
 Object.keys(S.db).forEach(k=>{if(k!==t&&k!=='_v123p')walk(S.db[k])});
 ['produtos','pedidos','marcas','itens','kits'].forEach(tb=>(S.db[tb]||[]).forEach(r=>{if(!r||typeof r!=='object')return;tx.forEach(k=>{const v=r[k];if(typeof v==='string'&&v!==win.nome&&nz(v)===ln){r[k]=win.nome;n++}});(r.orcamentos||[]).forEach(o=>tx.forEach(k=>{if(typeof o[k]==='string'&&o[k]!==win.nome&&nz(o[k])===ln){o[k]=win.nome;n++}}))}));
 Object.keys(lose).forEach(k=>{if(['id','nome','sigla','inativo','ativo'].includes(k))return;const v=lose[k];if((win[k]===undefined||win[k]===null||String(win[k]).trim()==='')&&v!=null&&String(v).trim()!=='')win[k]=v});
 if(t==='clientes'){win.aliases=[...new Set([...(win.aliases||[]),lose.nome,...(lose.aliases||[])].filter(a=>a&&a!==win.nome))]}
 win.fundidos=(win.fundidos||[]).concat([{id:lose.id,nome:lose.nome,em:hoje()}]);lose.inativo=true;lose.merged_into=win.id;lose.fundido_em=hoje();lg(t,win.id,`fundido: ${lose.id} → ${win.id} (${n} vínculo(s))`);return {refs:n}}
P.mergeRec=mergeRec;
function scoreRec(t,r){if(t==='parceiros')return scoreParc(r);let n=0;Object.keys(r).forEach(k=>{if(r[k]!=null&&String(r[k]).trim()!=='')n++});const J=JSON.stringify(Object.assign({},S.db,{[t]:[]}));n+=(J.split('"'+r.id+'"').length-1)*3;if(!r.inativo&&r.ativo!==false)n+=2;return n}
/* clients are found by sigla in proposals: two clients with the same name but different siglas are left for a person */
const podeAuto=(t,a,b)=>t!=='clientes'||!a.sigla||!b.sigla||a.sigla===b.sigla;
function gruposExatos(t){const g=new Map();(S.db[t]||[]).forEach(r=>{if(!vivo(r))return;const k=recKey(t,r);if(!k)return;(g.get(k)||g.set(k,[]).get(k)).push(r)});return [...g.values()].filter(v=>v.length>1)}
function autoMerge(tag){let n=0;const pend=[];DUP_T.forEach(t=>gruposExatos(t).forEach(grp=>{grp.sort((a,b)=>scoreRec(t,b)-scoreRec(t,a));const w=grp[0];grp.slice(1).forEach(l=>{if(podeAuto(t,w,l)){mergeRec(t,w,l);n++;(tag||[]).push(t+': '+l.nome+' ('+l.id+') → '+w.nome+' ('+w.id+')')}else pend.push(t)})}));return n}
/* close but not exact ("Arthur Casas" × "Studio Arthur Casas"): a person decides */
const FILL=new Set(['studio','estudio','arquitetura','arquitetos','arquiteto','arquitetas','associados','associadas','escritorio','design','interiores','interior','e','de','da','do','das','dos','and','grupo','projetos','engenharia','&']);
const core=n=>nomeKey(n).split(' ').filter(x=>x&&!FILL.has(x));
function possiveis(){const out=[];const ign=new Set(F().dup_ignorar||[]);['parceiros','clientes','fornecedores','marcas','categorias'].forEach(t=>{const L=(S.db[t]||[]).filter(r=>vivo(r)&&!r.inativo&&String(r.nome||'').trim());const K=L.map(r=>recKey(t,r)),C=L.map(r=>core(r.nome));
 for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];const ka=K[i],kb=K[j];let why='';
  if(ka===kb)why='mesmo nome (siglas diferentes)';else{const ca=C[i],cb=C[j];if(!ca.length||!cb.length||!ca.some(x=>cb.includes(x)))continue;if(!ca.length||!cb.length)continue;const sa=new Set(ca),sb=new Set(cb);const sh=ca.filter(x=>sb.has(x)).length;const sub=ca.every(x=>sb.has(x))||cb.every(x=>sa.has(x));if((sub&&(sh>=2||ca.join(' ')===cb.join(' ')))||(sh>=2&&sh>=Math.min(ca.length,cb.length)-1))why='nome quase igual'}
  if(!why)continue;const key=t+'|'+[a.id,b.id].sort().join('|');if(ign.has(key))continue;out.push({t,a:a.id,b:b.id,an:a.nome,bn:b.nome,why,key})}});return out}
P.possiveis=possiveis;
P.unir=function(t,winId,loseId){const arr=S.db[t]||[];const w=arr.find(x=>x.id===winId),l=arr.find(x=>x.id===loseId);if(!w||!l||w===l)throw Err('Registro não encontrado.');if(l.merged_into)throw Err('Já foi unido.');const r=mergeRec(t,w,l);const f=F();(f.unidos=f.unidos||[]).push({t,mantido:winId,unido:loseId,em:hoje()});W('links',()=>linkPass());sv();render();return r};
P.naoDup=function(key){const f=F();(f.dup_ignorar=f.dup_ignorar||[]).push(key);sv();render()};
function possiveisCard(){const L=possiveis();if(!L.length)return `<div class="sub mb-2" style="font-size:12px" data-v123="possiveis" data-n="0">Possíveis duplicados: nenhum.</div>`;
 return `<div class="card p-3 mb-3" data-v123="possiveis" data-n="${L.length}" style="border-left:4px solid #f5a623;display:block"><h6 class="mb-1">Possíveis duplicados · ${nBR(L.length,0)}</h6><div class="sub mb-2" style="font-size:12px">Nomes quase iguais. Se for a mesma pessoa/empresa, "Unir" junta tudo (negócios, propostas, obras, RT, CRM) num cadastro só — nada se perde. Se não for, "Não são o mesmo".</div>
 <table class="tbl"><tbody>${L.map(x=>`<tr data-v123pair="${E(x.key)}"><td><span class="chip">${DUP_LB[x.t]}</span></td><td><b>${E(x.an)}</b> × <b>${E(x.bn)}</b><div class="sub" style="font-size:11px">${E(x.why)}</div></td><td style="white-space:nowrap"><button class="btn-soft" data-v123unir="a" onclick="run(()=>V123P.unir('${x.t}','${E(x.a)}','${E(x.b)}'),'Unidos — um cadastro só')">Unir em ${E(x.an)}</button> <button class="btn-soft" data-v123unir="b" onclick="run(()=>V123P.unir('${x.t}','${E(x.b)}','${E(x.a)}'),'Unidos — um cadastro só')">Unir em ${E(x.bn)}</button> <button class="btn-soft" onclick="V123P.naoDup('${E(x.key)}')">Não são o mesmo</button></td></tr>`).join('')}</tbody></table></div>`}
function migrateDup(){const f=F();if(f.dedup)return false;const antes={};DUP_T.forEach(t=>antes[t]=(S.db[t]||[]).filter(vivo).length);const lista=[];const n=autoMerge(lista);const depois={};DUP_T.forEach(t=>depois[t]=(S.db[t]||[]).filter(vivo).length);f.dedup={em:hoje(),fundidos:n,lista,antes,depois,possiveis:possiveis().map(x=>x.t+': '+x.an+' × '+x.bn)};return true}
/* anything a seed/import pushed straight into the arrays (outside put) is caught on the next render */
function sweepDup(){if(!F().dedup)return false;const n=autoMerge();if(n){STAT.auto+=n;W('links',()=>linkPass())}return n>0}
/* merged records never show in pickers or lists */
function hideMergedAll(){const m=document.getElementById('main');if(!m)return;['clientes','fornecedores','marcas','categorias','obras'].forEach(t=>(S.db[t]||[]).filter(r=>r.merged_into).forEach(r=>{m.querySelectorAll('option').forEach(o=>{if(o.value===r.id&&!o.selected)o.remove()});m.querySelectorAll(`tr[data-row="${r.id}"]`).forEach(tr=>tr.remove())}));
 document.querySelectorAll('select option').forEach(o=>{if(o.selected)return;const t=['parceiros','clientes','fornecedores','marcas','categorias'].find(t=>(S.db[t]||[]).some(r=>r.merged_into&&r.id===o.value));if(t)o.remove()})}

/* =============================================== 8 · brands & suppliers =============================================== */
const mkL=()=>{if(!Array.isArray(S.db.marcas))S.db.marcas=[];return S.db.marcas};
function canonIdx(arr){const m=new Map();arr.forEach(x=>{if(x.inativo&&x.fundido_em)return;const k=nz(x.nome);if(!k)return;m.set(k,m.has(k)?null:x)});return m}
function migrateMarcas(){const f=F();if(f.marcas)return false;const M=mkL();const res={marcas_fundidas:[],kp_ligadas:0,kp_criadas:[]};
 /* case duplicates INSIDE Marcas/Fornecedores: the first keeps, the others point at it (kept, inactive) */
 [[M,'marcas'],[S.db.fornecedores||[],'fornecedores']].forEach(([arr,nm])=>{const seen=new Map();arr.forEach(x=>{const k=nz(x.nome);if(!k)return;if(seen.has(k)){const a=seen.get(k);x.inativo=true;x.fundido_em=a.id;res.marcas_fundidas.push(nm+': '+x.nome+' → '+a.nome)}else seen.set(k,x)})});
 /* keypad brands = Marcas marked keypad (lossless: a keypad brand not in Marcas joins Marcas) */
 (S.db.kpmarcas||[]).forEach(k=>{const hit=M.find(m=>!m.fundido_em&&nz(m.nome)===nz(k.nome));if(hit){hit.keypad=true;hit.kp_id=hit.kp_id||k.id;res.kp_ligadas++}else{M.push({id:'mk_'+slug(k.nome),nome:k.nome,fornecedor:null,garantia_meses:12,inativo:false,keypad:true,kp_id:k.id,origem:'Marcas de keypad (v123)'});res.kp_criadas.push(k.nome)}});
 f.marcas=Object.assign({em:hoje()},res);return true}
function sweepProdutos(report){const mi=canonIdx(mkL()),fi=canonIdx(S.db.fornecedores||[]);let ch=0;const sm=new Map(),sf=new Map(),amb=[];
 (S.db.produtos||[]).forEach(p=>{
  if(p.marca){const h=mi.get(nz(p.marca));if(h){if(p.marca!==h.nome){if(p.marca_orig===undefined)p.marca_orig=p.marca;p.marca=h.nome;ch++}if(p.marca_id!==h.id){p.marca_id=h.id;ch++}}else{if(p.marca_id){delete p.marca_id;ch++}if(report){if(h===null)amb.push('marca '+p.marca);else sm.set(p.marca,(sm.get(p.marca)||0)+1)}}}
  if(p.fornecedor){const h=fi.get(nz(p.fornecedor));if(h){if(p.fornecedor!==h.nome){if(p.fornecedor_orig===undefined)p.fornecedor_orig=p.fornecedor;p.fornecedor=h.nome;ch++}if(p.fornecedor_id!==h.id){p.fornecedor_id=h.id;ch++}}else{if(p.fornecedor_id){delete p.fornecedor_id;ch++}if(report){if(h===null)amb.push('fornecedor '+p.fornecedor);else sf.set(p.fornecedor,(sf.get(p.fornecedor)||0)+1)}}}});
 return report?{mudou:ch,marcas_sem_cadastro:[...sm.entries()],fornecedores_sem_cadastro:[...sf.entries()],ambiguos:amb}:ch}
P.sweepProdutos=sweepProdutos;
let kpPrev=null;
function syncKp(){if(!Array.isArray(S.db.kpmarcas))return false;const M=mkL();let ch=false;const cur=S.db.kpmarcas;
 /* what the keypad screen did since the last sync goes into Marcas: added rows → a marca (keypad); removed rows → keypad off; renamed → marca renamed */
 if(kpPrev){cur.forEach(k=>{const m=M.find(x=>x.kp_id===k.id);if(!m){const hit=M.find(x=>!x.fundido_em&&nz(x.nome)===nz(k.nome));if(hit){hit.keypad=true;hit.kp_id=k.id}else M.push({id:'mk_'+Math.random().toString(36).slice(2,8),nome:k.nome,fornecedor:null,garantia_meses:12,inativo:false,keypad:true,kp_id:k.id,origem:'Marcas de keypad'});ch=true}else if(m.nome!==k.nome&&kpPrev.get(k.id)!==k.nome){m.nome=k.nome;ch=true}});
  kpPrev.forEach((nm,id)=>{if(!cur.some(k=>k.id===id)){const m=M.find(x=>x.kp_id===id);if(m&&m.keypad){m.keypad=false;ch=true}}})}
 /* Marcas is the master: the keypad list = the Marcas marked keypad */
 const want=M.filter(m=>m.keypad&&!m.inativo).map(m=>{if(!m.kp_id){m.kp_id='kpb_'+m.id;ch=true}return {id:m.kp_id,nome:m.nome}});
 if(JSON.stringify(want)!==JSON.stringify(cur.map(k=>({id:k.id,nome:k.nome})))){cur.length=0;want.forEach(w=>cur.push(w));ch=true}
 /* obras keep the keypad brand by name: same brand, master spelling */
 (S.db.obras||[]).forEach(o=>{const k=o&&o.keypads;if(!k||!k.marca)return;const m=want.find(w=>nz(w.nome)===nz(k.marca));if(m&&m.nome!==k.marca){k.marca=m.nome;ch=true}});
 kpPrev=new Map(cur.map(k=>[k.id,k.nome]));return ch}
P.syncKp=syncKp;
P.marcaKeypad=function(id,on){const m=mkL().find(x=>x.id===id);if(!m)return;m.keypad=!!on;syncKp();sv();render()};
function wrapOpedados(){['opedados','dblistas'].forEach(key=>{const f=SCREENS[key];if(typeof f!=='function'||!once('kp_'+key))return;const g=function(){let h=f.apply(this,arguments);if(typeof h!=='string')return h;if(S.opeTab!=='kpmarcas'||h.indexOf('data-v123="kp"')>=0)return h;return h.replace(/(\d+ cadastrado\(s\)\. Excluir só é permitido)/,`<span data-v123="kp" style="display:block;font-size:12px" class="mb-1">Esta lista é a lista de <b>Marcas</b> da Base com a marca "keypad" — uma lista só. Adicionar aqui cria a marca lá; remover aqui só tira a marca "keypad".</span>$1`)};g.__v123kp=true;SCREENS[key]=g})}

/* =============================================== 9 · categoria → fase: Base › Categorias wins =============================================== */
function syncCats(){if(!Array.isArray(S.db.categorias)||!S.db.categorias.length||typeof FASE_PRODUTO!=='object')return false;const L=(S.db.listas.categorias=S.db.listas.categorias||[]);let ch=false;
 Object.entries(FASE_PRODUTO).forEach(([c,f])=>{const x=L.find(y=>y.v===c);if(x){if(x.fase!==f){if(x.fase_antiga===undefined)x.fase_antiga=x.fase;x.fase=f;ch=true}}else{L.push({id:'li_'+slug(c),v:c,fase:f,de:'Categorias'});ch=true}});return ch}
P.syncCats=syncCats;

/* =============================================== 10 · placeholders → the nearest real screen =============================================== */
const PH_MAP={mkt:'comunicados',facilities:'fchome'};
function nearest(k){if(PH_MAP[k]&&SCREENS[PH_MAP[k]])return PH_MAP[k];let sec=null;try{sec=SEC_OF[k]}catch(e){}const nav=(typeof NAV!=='undefined'?NAV:[]);const s=nav.find(x=>x.id===sec)||nav.find(x=>(x.items||[]).some(i=>k.indexOf(i[0])===0||i[0].indexOf(k)===0));const it=s&&s.items&&s.items.find(i=>i[0]!==k&&typeof SCREENS[i[0]]==='function');return it?it[0]:'home'}
P.nearest=nearest;
function wrapRenderMain(){const f=window.renderMain;if(typeof f!=='function'||!once('renderMain'))return;const g=function(){const r=f.apply(this,arguments);W('merged',hideMerged);W('mergedAll',hideMergedAll);W('placeholder',()=>{const m=document.getElementById('main');if(!m||m.innerHTML.indexOf('próxima sessão de construção')<0)return;const k=(location.hash.replace(/^#\/?/,'').split('/')[0])||'home';const to=nearest(k);if(to&&to!==k){P.redirects=(P.redirects||0)+1;(P.redirLog=P.redirLog||[]).push(k+'→'+to);setTimeout(()=>location.replace('#/'+to),0);m.innerHTML=`<div class="card p-3"><b>Abrindo ${E((typeof LABEL!=='undefined'&&LABEL[to])||to)}…</b><div class="sub">Esta página ainda não existe — você foi levado à tela mais próxima.</div></div>`}});return r};g.__v123=true;window.renderMain=g;try{renderMain=g}catch(e){}}

/* =============================================== install =============================================== */
function sweepAll(){let ch=false;W('crm ids',()=>{if(ensureCrmIds())ch=true});W('tipos',()=>{if(sweepTipos())ch=true});W('aliases',installRuleAliases);W('unidades',installUnidades);W('frentes',()=>{if(sweepFrentes())ch=true});W('kp',()=>{if(syncKp())ch=true});W('links',()=>{if(linkPass())ch=true});W('prod',()=>{if(sweepProdutos())ch=true});W('cats',()=>{if(syncCats())ch=true});W('dedup',()=>{if(sweepDup())ch=true});return ch}
function wrapBdSet(){if(typeof window.bdSet!=='function'||!once('bdSet'))return;const f=window.bdSet;window.bdSet=function(t){const r=f.apply(this,arguments);if(/^(parceiros|listas|clientes|obras|produtos|marcas|fornecedores)/.test(String(t||'')))W('bdSet sweep',()=>{if(sweepAll())sv()});return r}}
function wrapAll(){W('bdSetDup',wrapBdSetDup);W('bdSet',wrapBdSet);W('putdup',wrapPutDup);W('formsdup',wrapFormsDup);W('pickdoors',wrapPickDoors);W('server',installServer);W('crm screens',wrapCrmScreens);W('dbcrm',wrapDbcrm);W('dbparceiros',wrapDbparceiros);W('dblistas',wrapDblistas);W('parametros',wrapParametros);W('finconfig',wrapFinconfig);W('cadAdd',wrapCadAdd);W('semvenda',wrapSemVenda);W('copform',wrapCopForm);W('opedados',wrapOpedados);W('renderMain',wrapRenderMain)}
function boot(){let ch=false;W('m tipos',()=>{if(migrateTipos())ch=true});W('m listas',()=>{if(migrateListas())ch=true});W('m regras',()=>{if(migrateRegras())ch=true});W('m frentes',()=>{if(migrateFrentes())ch=true});W('m marcas',()=>{if(migrateMarcas())ch=true});W('m fundir',()=>{if(migrateMerge())ch=true});W('m dedup',()=>{if(migrateDup())ch=true});
 const f=F();if(!f.links){const r=linkPass(true);f.links={em:hoje(),ligados:r.mudou,sem_cadastro:r.sem.length,ambiguos:r.amb.length};ch=true}
 if(!f.produtos){const r=sweepProdutos(true);f.produtos={em:hoje(),ligados:r.mudou,marcas_sem_cadastro:r.marcas_sem_cadastro,fornecedores_sem_cadastro:r.fornecedores_sem_cadastro,ambiguos:r.ambiguos};ch=true}
 if(sweepAll())ch=true;syncIndTipos();if(ch)sv()}
W('boot',boot);wrapAll();setTimeout(()=>W('rewrap',wrapAll),0);
/* S.db may be replaced (import, reset, reload of the store): the sweeps re-attach on every render; save only when something moved */
(function(){const f=window.render;if(typeof f!=='function')return;const g=function(){W('render sweep',()=>{if(!F().tipos)boot();if(sweepAll())sv()});return f.apply(this,arguments)};g.__v123=true;window.render=g;try{render=g}catch(e){}})();
window.__V123_partners_v=1;
try{render()}catch(e){}
})();
