/* =====================================================================================================
   v192 · EXPORTAR DADOS EM EXCEL (Bruno, 19/11/2026)
   Pedido que chegou de um colega: "Consigo uma listagem de todos os contatos cadastrados e com os respectivos parceiros?"
   O protótipo não tinha como tirar isso — só os JSON técnicos de Base › Parâmetros (e contatos nem estavam lá).
   Decisões do Bruno (19/11):
     · nos DOIS lugares: uma tela própria em Base › "Exportar dados" + um botão "Exportar" em cada tela com lista;
     · arquivo Excel (.xlsx), números de verdade (o Excel mostra no formato brasileiro), cabeçalho fixo e filtro ligado;
     · só os gestores exportam: Bruno, Cesar, Rodolfo, Alan Tito, Renata (+ perfis Diretoria / TI);
     · listas prontas no primeiro dia: Contatos com o parceiro · Parceiros · Pipeline.
   Uma fonte só: contatos e parceiros saem do MESMO servidor do CRM que a tela CRM › Parceiros usa (CRM_SERVER loadAll);
   o Pipeline sai de S.db.negociacoes com a MESMA regra da tela (vivas = nem fechada nem perdida). Nada é gravado.
   Botão "Exportar" das telas: baixa o que está NA TELA (as tabelas visíveis, com os filtros aplicados). No Pipeline, baixa
   as negociações dos cartões visíveis. Nas telas do CRM, oferece as listas de contatos e parceiros.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v192)return;window.__v192=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const N0=v=>(+v||0).toLocaleString('pt-BR');
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hoje=()=>{const d=new Date();return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear()};
const toast_=m=>{try{toast(m)}catch(e){console.log(m)}};
const cur=()=>(location.hash||'').replace(/^#\/?/,'').split(/[/?]/)[0];

/* ═════════════ §1 quem pode exportar ═════════════ */
const GESTORES=['bruno pozzani','cesar','rodolfo','alan tito','renata'];
function eu(){return T(()=>me(),null)}
function quemSou(){const u=eu();if(!u)return '';const p=T(()=>(S.db.pessoas||[]).find(x=>x.id===u.pessoa_id),null);return (p&&p.nome)||u.nome||u.login||''}
function pode(){const u=eu();if(!u)return false;if(['diretoria','ti'].indexOf(u.perfil)>=0)return true;
  const p=T(()=>(S.db.pessoas||[]).find(x=>x.id===u.pessoa_id),null);
  const k=' '+nz([u.login,u.nome,p&&p.nome].join(' '))+' ';return GESTORES.some(g=>k.indexOf(' '+g+' ')>=0||k.indexOf(' '+g)>=0)}

/* ═════════════ §2 o Excel (.xlsx) — escrito aqui mesmo, sem biblioteca de fora ═════════════ */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zip(files){/* files: [{name, data:Uint8Array}] — "store", sem compressão */
  const enc=new TextEncoder();const parts=[];const cd=[];let off=0;
  const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  files.forEach(f=>{const nm=enc.encode(f.name);const crc=crc32(f.data);const sz=f.data.length;
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0)]);
    parts.push(lh,nm,f.data);
    cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
    off+=lh.length+nm.length+sz});
  const cdLen=cd.reduce((a,b)=>a+b.length,0);
  const end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdLen),...u32(off),...u16(0)]);
  return new Blob([...parts,...cd,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
const X=s=>String(s==null?'':s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const COL=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
const ST={txt:0,head:1,int:2,dec:3,pct:4,data:5,brl:6};
function serial(iso){const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return null;const d=Date.UTC(+m[1],+m[2]-1,+m[3]);return d/86400000+25569}
function cel(v,tipo,ref){
  if(v==null||v==='')return '';
  if(tipo==='data'){const s=serial(v);if(s!=null)return `<c r="${ref}" s="${ST.data}"><v>${s}</v></c>`}
  if(tipo==='int'||tipo==='dec'||tipo==='pct'||tipo==='brl'||typeof v==='number'){const n=typeof v==='number'?v:+v;
    if(isFinite(n)&&String(v).trim()!=='')return `<c r="${ref}" s="${ST[tipo]||(Number.isInteger(n)?ST.int:ST.dec)}"><v>${n}</v></c>`}
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${X(v)}</t></is></c>`}
function folha(sh){const cols=sh.cols,rows=sh.rows;
  const larg=cols.map((c,i)=>Math.min(60,Math.max(8,String(c.h).length+2,...rows.slice(0,400).map(r=>String(r[i]==null?'':r[i]).length+2))));
  let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
  x+='<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
  x+='<cols>'+larg.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols><sheetData>';
  x+='<row r="1">'+cols.map((c,i)=>`<c r="${COL(i)}1" t="inlineStr" s="${ST.head}"><is><t xml:space="preserve">${X(c.h)}</t></is></c>`).join('')+'</row>';
  rows.forEach((r,j)=>{x+=`<row r="${j+2}">`+cols.map((c,i)=>cel(r[i],c.t,COL(i)+(j+2))).join('')+'</row>'});
  x+='</sheetData>';if(cols.length&&!sh.semFiltro)x+=`<autoFilter ref="A1:${COL(cols.length-1)}${rows.length+1}"/>`;
  return x+'</worksheet>'}
function nomeAba(s,usados){let n=String(s||'Lista').replace(/[\[\]:*?\/\\]/g,' ').trim().slice(0,31)||'Lista';let k=n,i=2;while(usados.has(k.toLowerCase())){k=n.slice(0,28)+' '+i++}usados.add(k.toLowerCase());return k}
function xlsx(abas){const enc=new TextEncoder();const usados=new Set();abas.forEach(a=>a._n=nomeAba(a.nome,usados));
  const f=[];const add=(n,s)=>f.push({name:n,data:enc.encode(s)});
  add('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+abas.map((a,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>');
  add('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  add('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+abas.map((a,i)=>`<sheet name="${X(a._n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets><definedNames>'+abas.map((a,i)=>a.cols.length&&!a.semFiltro?`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${X(a._n).replace(/'/g,"''")}'!$A$1:$${COL(a.cols.length-1)}$${a.rows.length+1}</definedName>`:'').join('')+'</definedNames></workbook>');
  add('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+abas.map((a,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${abas.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  add('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="0&quot;%&quot;"/><numFmt numFmtId="165" formatCode="&quot;R$&quot; #,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F2430"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
  abas.forEach((a,i)=>add(`xl/worksheets/sheet${i+1}.xml`,folha(a)));
  return zip(f)}
function baixar(nome,abas){const blob=xlsx(abas);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SYSTAAG - '+nome+' - '+hoje()+'.xlsx';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
function sobre(titulo,fonte,linhas){return {nome:'Sobre',semFiltro:true,cols:[{h:'Sobre este arquivo'},{h:''}],rows:[['Lista',titulo],['Gerado em',new Date().toLocaleString('pt-BR')],['Por',quemSou()],['De onde vem',fonte]].concat(linhas||[])}}

/* ═════════════ §3 as listas prontas (uma fonte: a mesma das telas) ═════════════ */
const lst=v=>{if(Array.isArray(v))return v;if(!v)return [];try{const j=JSON.parse(v);return Array.isArray(j)?j:[String(j)]}catch(e){return [String(v)]}};
const junta=v=>lst(v).map(x=>typeof x==='object'&&x?Object.values(x).filter(Boolean).join(' '):String(x)).filter(Boolean).join(' · ');
function crm(){const r=JSON.parse(CRM_SERVER.api(JSON.stringify({action:'loadAll'})));if(!r||!r.ok)throw new Error((r&&r.error)||'CRM não respondeu');return r.tables}
const tipoParc=id=>T(()=>{const k=window.V187.tipoDe(id);const t=window.V187.tipos().find(x=>x.k===k);return t?t.l:''},'');
const rtParc=id=>T(()=>{const v=window.V187.rtVal(id);return v===''?'':+v},'');
function dadosCrm(){const t=crm();const P=t.parceiros||[],C=(t.contatos||[]),I=(t.interacoes||[]);
  const pid={};P.forEach(p=>pid[+p.id]=p);
  const contPor={},intPor={},ultPor={};C.forEach(c=>{contPor[+c.parceiro_id]=(contPor[+c.parceiro_id]||0)+1});
  I.forEach(i=>{const k=+i.parceiro_id;intPor[k]=(intPor[k]||0)+1;const d=String(i.data||'').slice(0,10);if(d&&(!ultPor[k]||d>ultPor[k]))ultPor[k]=d});
  const inativo=id=>T(()=>(S.db.parceiros||[]).find(x=>+x.crm_id===+id),null);
  return {P,C,I,pid,contPor,intPor,ultPor,inativo}}

function listaContatos(){const D=dadosCrm();
  const C=D.C.slice().sort((a,b)=>{const pa=D.pid[+a.parceiro_id],pb=D.pid[+b.parceiro_id];return String(pa?pa.nome:'~').localeCompare(String(pb?pb.nome:'~'),'pt-BR')||String(a.nome).localeCompare(String(b.nome),'pt-BR')});
  let fora=0;
  const rows=C.map(c=>{const p=D.pid[+c.parceiro_id];let nomeP=p?p.nome:'';let sit='Ativo';
    if(!p){fora++;const q=D.inativo(c.parceiro_id);nomeP=q?q.nome:'(parceiro não encontrado)';sit=q?'Parceiro excluído / fora da lista':'Sem parceiro'}
    return [nomeP,p?p.tipo:'',p?p.classificacao:'',p?tipoParc(p.id):'',p?p.cidade:'',p?p.estado:'',c.nome,c.cargo,c.telefone,c.email,String(c.aniversario||'').slice(0,10),junta(c.redes),c.obs,p?p.responsavel_rel:'',p?p.responsavel_com:'',sit]});
  const semC=D.P.filter(p=>!D.contPor[+p.id]).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const comC=D.P.length-semC.length;
  return {n:C.length,ativos:C.length-fora,fora,parceiros:comC,semContato:semC.length,totalParceiros:D.P.length,
    abas:[{nome:'Contatos',cols:[{h:'Parceiro'},{h:'Tipo do parceiro'},{h:'Classificação'},{h:'Tipo de parceria'},{h:'Cidade'},{h:'UF'},{h:'Contato'},{h:'Cargo'},{h:'Telefone'},{h:'E-mail'},{h:'Aniversário',t:'data'},{h:'Redes'},{h:'Observação'},{h:'Resp. relacionamento'},{h:'Resp. comercial'},{h:'Situação do parceiro'}],rows},
      {nome:'Parceiros sem contato',cols:[{h:'Parceiro'},{h:'Tipo do parceiro'},{h:'Classificação'},{h:'Cidade'},{h:'UF'},{h:'Telefones do parceiro'},{h:'E-mail do parceiro'},{h:'Resp. relacionamento'}],
        rows:semC.map(p=>[p.nome,p.tipo,p.classificacao,p.cidade,p.estado,junta(p.telefones),p.email,p.responsavel_rel])}]}}

function listaParceiros(){const D=dadosCrm();const P=D.P.slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const escr=id=>T(()=>{const q=(S.db.parceiros||[]).find(x=>+x.crm_id===+id);const e=q&&q.escritorio_crm_id?D.pid[+q.escritorio_crm_id]:null;return e?e.nome:''},'');
  const rows=P.map(p=>[p.nome,p.tipo,escr(p.id),p.classificacao,tipoParc(p.id),rtParc(p.id),p.status,p.cidade,p.estado,junta(p.telefones),p.email,p.site,p.responsavel_rel,p.responsavel_com,D.contPor[+p.id]||0,D.intPor[+p.id]||0,D.ultPor[+p.id]||'',String(p.criado_em||'').slice(0,10),p.obs]);
  const semC=P.filter(p=>!D.contPor[+p.id]).length;
  return {n:P.length,comContato:P.length-semC,semContato:semC,
    abas:[{nome:'Parceiros',cols:[{h:'Parceiro'},{h:'Tipo'},{h:'Escritório a que pertence'},{h:'Classificação'},{h:'Tipo de parceria'},{h:'RT',t:'pct'},{h:'Status'},{h:'Cidade'},{h:'UF'},{h:'Telefones'},{h:'E-mail'},{h:'Site'},{h:'Resp. relacionamento'},{h:'Resp. comercial'},{h:'Nº de contatos',t:'int'},{h:'Nº de interações',t:'int'},{h:'Última interação',t:'data'},{h:'Cadastrado em',t:'data'},{h:'Observação'}],rows}]}}

const NEG=()=>(S.db&&S.db.negociacoes)||[];
const vivo=n=>n&&n.resultado!=='fechada'&&n.resultado!=='perdida';
const consDe=n=>T(()=>negCons(n),[n.consultor]).filter(Boolean).join(', ');
const FRENTE={taag:'TAAG',acustica:'Acústica',focal:'Focal',posvenda:'Pós-venda'};
const ETQ={null:'Em jogo',sem_status:'Status vazio na planilha',futuro:'No futuro'};
function valorNeg(n){const v=+n.valor||0;if(v>0)return v;
  const ps=(n.proposta_ids||[]).map(id=>T(()=>(S.db.propostas||[]).find(p=>p.id===id),null)).filter(Boolean);
  const s=ps.reduce((a,p)=>a+(+T(()=>p.total,0)||+p.valor||0),0);return s>0?s:''}
function listaPipeline(ids){let L=NEG().filter(vivo);if(ids)L=L.filter(n=>ids.has(String(n.id)));
  const cont={};L.forEach(n=>{const k=ETQ[String(n.resultado)]?String(n.resultado):'null';cont[k]=(cont[k]||0)+1});
  L.sort((a,b)=>String(a.cliente_nome).localeCompare(String(b.cliente_nome),'pt-BR'));
  const f=n=>n.fontes||{};
  const rows=L.map(n=>[n.cliente_nome,FRENTE[n.frente]||n.frente||'',consDe(n),n.status_pipeline||n.etapa||'',ETQ[String(n.resultado)]||'Em jogo',n.chance===''||n.chance==null?'':+n.chance,valorNeg(n),f(n).indicador||'',f(n).gerenciadora||'',f(n).arquitetura||'',n.tipo_pipeline||'',n.data_envio||'',n.data_upgrade||'',n.previsao_obra||'',T(()=>n.proxima.acao,'')||'',T(()=>n.proxima.data,'')||'',n.gestao||'',n.planilha&&n.planilha.linha?n.planilha.linha:'']);
  return {n:L.length,emJogo:cont['null']||0,semStatus:cont.sem_status||0,futuro:cont.futuro||0,
    abas:[{nome:'Pipeline',cols:[{h:'Cliente'},{h:'Frente'},{h:'Consultor'},{h:'Status'},{h:'Situação'},{h:'Chance',t:'pct'},{h:'Valor',t:'brl'},{h:'Indicador'},{h:'Gerenciadora'},{h:'Arquitetura'},{h:'Tipo'},{h:'Envio da proposta',t:'data'},{h:'Upgrade',t:'data'},{h:'Previsão de obra',t:'data'},{h:'Próxima ação'},{h:'Data da próxima ação',t:'data'},{h:'Anotação (Gerenciamento de Vendas)'},{h:'Linha na planilha',t:'int'}],rows}]}}

const PRONTAS={
  contatos:{t:'Contatos e parceiros',ic:'bi-person-lines-fill',fn:listaContatos,
    fonte:'CRM › Parceiros (servidor do CRM, a mesma base que a tela mostra)',
    big:r=>N0(r.n),lb:'contatos cadastrados',
    ponte:r=>`em <b>${N0(r.parceiros)}</b> parceiros${r.fora?` · <b>${N0(r.n)}</b> = ${N0(r.ativos)} de parceiros ativos + ${N0(r.fora)} de parceiro excluído`:''}<br><b>${N0(r.semContato)}</b> parceiros ainda sem contato (vão numa aba à parte) · ${N0(r.parceiros)} + ${N0(r.semContato)} = ${N0(r.totalParceiros)} parceiros`,
    sobre:r=>[['Contatos',r.n],['Parceiros com contato',r.parceiros],['Parceiros sem contato (aba à parte)',r.semContato],['Total de parceiros',r.totalParceiros]]},
  parceiros:{t:'Parceiros',ic:'bi-buildings',fn:listaParceiros,
    fonte:'CRM › Parceiros (servidor do CRM, a mesma lista da tela)',
    big:r=>N0(r.n),lb:'parceiros',
    ponte:r=>`<b>${N0(r.n)}</b> = ${N0(r.comContato)} com contato + ${N0(r.semContato)} sem contato<br>com tipo de parceria, RT, classificação, nº de contatos e de interações`,
    sobre:r=>[['Parceiros',r.n],['Com contato',r.comContato],['Sem contato',r.semContato]]},
  pipeline:{t:'Pipeline',ic:'bi-kanban',fn:()=>listaPipeline(null),
    fonte:'Comercial › Pipeline (negociações vivas: nem fechadas nem perdidas — a mesma conta da tela)',
    big:r=>N0(r.n),lb:'negociações vivas',
    ponte:r=>`<b>${N0(r.n)}</b> = ${N0(r.emJogo)} em jogo + ${N0(r.semStatus)} com status vazio + ${N0(r.futuro)} no futuro<br>fechadas e perdidas ficam de fora (estão em Comercial › Gestão)`,
    sobre:r=>[['Negociações',r.n],['Em jogo',r.emJogo],['Status vazio',r.semStatus],['No futuro',r.futuro]]}};

const V=window.V192={};V._xlsx=xlsx;
V.pronta=k=>{if(!pode())return toast_('Exportar é só para os gestores (Bruno, Cesar, Rodolfo, Alan Tito, Renata).');
  const P=PRONTAS[k];try{const r=P.fn();baixar(P.t,r.abas.concat([sobre(P.t,P.fonte,P.sobre(r))]));toast_(P.t+': Excel baixado ('+N0(r.n)+' linhas).')}catch(e){console.error('v192',e);toast_('Não consegui gerar o Excel: '+(e.message||e))}};

/* ═════════════ §4 a tela Base › Exportar dados ═════════════ */
function css(){if(document.getElementById('v192-css'))return;const s=document.createElement('style');s.id='v192-css';s.textContent=`
.v192-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.v192-c{border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:8px}
.v192-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(31,36,48,.07)}
.v192-big{font-size:38px;font-weight:300;line-height:1;letter-spacing:-.02em}
.v192-c .sub{font-size:12.5px;line-height:1.45}
.v192-c button{margin-top:auto;align-self:flex-start}
#v192-fab{position:fixed;right:22px;bottom:22px;z-index:60;display:none;align-items:center;gap:7px;border:0;border-radius:999px;padding:10px 16px;background:#1f2430;color:#fff;font:600 13px/1 inherit;box-shadow:0 6px 22px rgba(0,0,0,.18);cursor:pointer}
#v192-fab:hover{transform:translateY(-1px)}
#v192-menu{position:fixed;right:22px;bottom:70px;z-index:61;min-width:250px;background:var(--card,#fff);color:inherit;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.2);padding:6px;display:none}
#v192-menu button{display:flex;width:100%;gap:10px;align-items:center;border:0;background:transparent;padding:10px 12px;border-radius:10px;text-align:left;font-size:13.5px;color:inherit}
#v192-menu button:hover{background:rgba(0,0,0,.06)}
#v192-menu small{display:block;opacity:.6;font-size:11.5px}
[data-theme=dark] #v192-menu{background:#232838}`;document.head.appendChild(s)}
function tela(){css();
  const hd=T(()=>head('Exportar dados','Baixe qualquer lista em Excel. Em toda tela com lista há também o botão <b>Exportar</b> (canto inferior direito), que baixa exatamente o que está na tela, com os filtros.'),'<h1 class="h1">Exportar dados</h1>');
  if(!pode())return hd+`<div class="card p-4 text-center" style="border-radius:18px"><div style="font-size:40px;opacity:.35"><i class="bi bi-lock"></i></div><div style="font-size:17px;font-weight:700;margin-top:6px">Só os gestores exportam</div><div class="sub mt-1">Bruno, Cesar, Rodolfo, Alan Tito e Renata. Precisa de uma lista? Peça a um deles.</div></div>`;
  const cards=Object.keys(PRONTAS).map(k=>{const P=PRONTAS[k];let r=null,err='';try{r=P.fn()}catch(e){err=String(e.message||e)}
    return `<div class="card v192-c"><div class="d-flex align-items-center gap-2"><div class="v192-ic"><i class="bi ${P.ic}"></i></div><b style="font-size:15px">${E(P.t)}</b></div>
      ${r?`<div><span class="v192-big">${P.big(r)}</span> <span class="sub">${E(P.lb)}</span></div><div class="sub">${P.ponte(r)}</div>`:`<div class="sub" style="color:#b23">Não consegui ler: ${E(err)}</div>`}
      <button class="btn-apple" onclick="V192.pronta('${k}')"${r?'':' disabled'}><i class="bi bi-download me-1"></i>Baixar Excel</button></div>`}).join('');
  return hd+`<div class="v192-g">${cards}</div><div class="sub mt-3" style="font-size:12px">Os números acima são os mesmos das telas (CRM › Parceiros e Comercial › Pipeline). Cada arquivo traz uma aba "Sobre" com a data, quem gerou e de onde veio.</div>`}
try{SCREENS.dbexportar=function(){return tela()};LABEL.dbexportar='Exportar dados';SEC_OF.dbexportar='bd';if(window.OWNER)OWNER.dbexportar='bd'}catch(e){console.error('v192 tela',e)}
function menu(){try{const bd=NAV.find(s=>s.id==='bd');if(!bd)return;const tem=bd.items.some(i=>i[0]==='dbexportar');
  if(pode()&&!tem)bd.items.push(['dbexportar','Exportar dados']);else if(!pode()&&tem)bd.items=bd.items.filter(i=>i[0]!=='dbexportar')}catch(e){}}
menu();
try{const _rn=window.renderNav;if(typeof _rn==='function'&&!_rn.__v192){const g=function(){menu();return _rn.apply(this,arguments)};g.__v192=true;Object.keys(_rn).forEach(k=>{try{g[k]=_rn[k]}catch(e){}});window.renderNav=g;try{renderNav=g}catch(e){}}}catch(e){}

/* ═════════════ §5 o botão "Exportar" de cada tela ═════════════ */
const vis=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
function txt(el){const c=el.cloneNode(true);c.querySelectorAll('button,.btn,.btn-soft,.btn-apple,script,style,[aria-hidden=true]').forEach(x=>x.remove());return String(c.textContent||'').replace(/\s+/g,' ').trim()}
function num(s){const v=String(s).trim();if(!v||v.length>22)return s;if(/^0\d/.test(v))return s;
  let m=v.match(/^(-?)R\$\s?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d+))?$/);if(m)return +(m[1]+m[2].replace(/\./g,'')+(m[3]?'.'+m[3]:''));
  m=v.match(/^(-?)(\d{1,3}(?:\.\d{3})+|\d{1,9})(?:,(\d+))?$/);if(m)return +(m[1]+m[2].replace(/\./g,'')+(m[3]?'.'+m[3]:''));
  return s}
function tabelas(root){const out=[];if(!root)return out;
  root.querySelectorAll('table').forEach(tb=>{if(!vis(tb)||tb.closest('#v192-menu'))return;
    const trs=[...tb.rows].filter(vis);if(trs.length<2)return;
    const hr=tb.tHead&&tb.tHead.rows.length?[...tb.tHead.rows].filter(vis).pop():trs[0];
    const cab=[...hr.cells].map(c=>txt(c));const corpo=trs.filter(r=>r!==hr&&!(tb.tHead&&tb.tHead.contains(r)));
    const rows=corpo.map(r=>[...r.cells].map(c=>num(txt(c)))).filter(r=>r.some(v=>v!==''));if(!rows.length)return;
    const w=Math.max(cab.length,...rows.map(r=>r.length));
    let nome='';const card=tb.closest('.card');if(card){const h=card.querySelector('h5,h6,b,.h6');if(h&&!tb.contains(h))nome=txt(h).slice(0,40)}
    out.push({nome:nome||'Lista',cols:Array.from({length:w},(_,i)=>({h:cab[i]||('Coluna '+(i+1))})),rows})});
  return out}
function idsVisiveis(){const set=new Set(NEG().map(n=>String(n.id)));const achou=new Set();const m=document.getElementById('main');if(!m)return achou;
  m.querySelectorAll('[onclick],[data-id],[data-neg],[href]').forEach(el=>{if(!vis(el))return;const s=(el.getAttribute('onclick')||'')+' '+(el.getAttribute('data-id')||'')+' '+(el.getAttribute('data-neg')||'')+' '+(el.getAttribute('href')||'');
    const r=/['"=\/ ]([A-Za-z]{1,4}_?[A-Za-z0-9]{1,12})(?=['"&?\/ ]|$)/g;let x;while((x=r.exec(' '+s+' ')))if(set.has(x[1]))achou.add(x[1])});
  return achou}
function opcoes(){const k=cur();const o=[];
  if(/^crm/.test(k)){o.push({t:'Contatos e parceiros',d:'todos os contatos, cada um com o seu parceiro',f:()=>V.pronta('contatos')},{t:'Parceiros',d:'a lista de parceiros do CRM',f:()=>V.pronta('parceiros')});return o}
  if(k==='pipeline'){const ids=idsVisiveis();const vivos=NEG().filter(vivo).filter(n=>ids.has(String(n.id))).length;
    if(vivos)o.push({t:'Pipeline — o que está na tela',d:N0(vivos)+' negociações dos cartões visíveis (com os filtros)',f:()=>{if(!pode())return;const r=listaPipeline(ids);baixar('Pipeline (filtrado)',r.abas.concat([sobre('Pipeline — cartões visíveis na tela',PRONTAS.pipeline.fonte,PRONTAS.pipeline.sobre(r))]));toast_('Pipeline: Excel baixado ('+N0(r.n)+' negociações).')}});
    o.push({t:'Pipeline — tudo o que está vivo',d:'todas as negociações vivas, sem filtro',f:()=>V.pronta('pipeline')});return o}
  if(k==='dbexportar')return o;
  const tb=tabelas(document.getElementById('main'));
  if(tb.length){const nm=T(()=>LABEL[k],'')||'Lista';const n=tb.reduce((a,t)=>a+t.rows.length,0);
    o.push({t:'Esta tela: '+nm,d:N0(n)+' linhas'+(tb.length>1?' em '+tb.length+' tabelas':'')+' — exatamente o que está na tela',f:()=>{if(!pode())return;const t=tabelas(document.getElementById('main'));if(!t.length)return toast_('Nada para exportar nesta tela.');
      if(t.length===1)t[0].nome=nm;baixar(nm,t.concat([sobre(nm,'Tela '+nm+' do SYSTAAG, como estava na tela (filtros aplicados)',[])]));toast_(nm+': Excel baixado.')}})}
  return o}
function fecha(){const m=document.getElementById('v192-menu');if(m)m.style.display='none'}
function fab(){css();let b=document.getElementById('v192-fab');if(!b){b=document.createElement('button');b.id='v192-fab';b.type='button';b.innerHTML='<i class="bi bi-download"></i>Exportar';
    b.onclick=e=>{e.stopPropagation();const o=opcoes();if(!o.length)return;if(o.length===1){fecha();return o[0].f()}
      let m=document.getElementById('v192-menu');if(!m){m=document.createElement('div');m.id='v192-menu';document.body.appendChild(m)}
      if(m.style.display==='block')return fecha();
      m.innerHTML=o.map((x,i)=>`<button type="button" data-i="${i}"><i class="bi bi-file-earmark-spreadsheet" style="font-size:18px;opacity:.7"></i><span>${E(x.t)}<small>${E(x.d)}</small></span></button>`).join('');
      m.querySelectorAll('button').forEach(bt=>bt.onclick=ev=>{ev.stopPropagation();fecha();o[+bt.dataset.i].f()});m.style.display='block'};
    document.body.appendChild(b);document.addEventListener('click',fecha)}
  return b}
let tmr=0;
function atualiza(){clearTimeout(tmr);tmr=setTimeout(()=>{try{const b=fab();const ok=pode()&&opcoes().length>0;b.style.display=ok?'inline-flex':'none';if(!ok)fecha()}catch(e){}},250)}
window.addEventListener('hashchange',()=>{fecha();atualiza()});
function liga(){const m=document.getElementById('main');if(!m){setTimeout(liga,500);return}
  try{new MutationObserver(atualiza).observe(m,{childList:true,subtree:true})}catch(e){}atualiza()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',liga);else liga();
})();
