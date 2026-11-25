/* =====================================================================================================
   v235 · O CLIENTE SÓ VÊ O NOME GENÉRICO (Bruno, 25/11/2026)
   Regra: tudo o que o cliente vê — modo cliente na tela (editor de hoje e tela nova), o link do cliente e o PDF (a mesma vista,
   impressa) e a apresentação .pptx — mostra só o nome genérico do produto e a quantidade. Nunca marca, nunca modelo — Focal e
   Hi-Fi inclusive. Fotos continuam. As telas internas (consultor, Estoque, Operação) continuam com o nome real.
   Ordem: 1) nome genérico (Base › Produtos, campo "Nomenclatura genérica (apelido)");
          2) tipo do produto (p.tipo_generico, gravado pela carga de categorias — uma fonte só, na Base);
          3) categoria comercial; 4) "Equipamento".
   Rede de segurança: se o nome genérico de um produto contiver a marca ou o modelo dele, não é usado (cai no tipo).
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v235)return;window.__v235=true;
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const tem=(texto,trecho)=>{const t=' '+nz(texto)+' ',x=nz(trecho);return x.length>=2&&t.includes(' '+x+' ')};
const modelo=p=>String(p&&p.nome||'').split(' — ')[0].trim();
/* palavras de marca que não identificam fabricante (TAAG = a própria empresa; CLIENTE = equipamento do cliente) */
const NAO_MARCA=new Set(['TAAG','CLIENTE','']);
const vaza=(texto,p)=>{if(!p)return false;const m=String(p.marca||'').trim();if(m&&!NAO_MARCA.has(nz(m))&&tem(texto,m))return true;const mo=modelo(p);return mo.length>=3&&tem(texto,mo)};
const SVC='Serviços (não é produto)';
window.nomeCliente=function(x){
  const p=typeof x==='string'?(typeof get==='function'?get('produtos',x):null):x;
  if(!p)return 'Equipamento';
  const g=String(p.apelido||'').trim();if(g&&!vaza(g,p))return g;
  const t=String(p.tipo_generico||'').trim();if(t&&!vaza(t,p))return t;
  const c=String(p.categoria_comercial||'').trim();if(c&&c!==SVC)return c;
  return 'Equipamento'};
/* nome do ambiente na vista do cliente: sai qualquer marca do catálogo e o modelo dos produtos da proposta (ex.: um kit "Savant Pro"
   vira "Pro"); se não sobrar nada, "Ambiente". O nome guardado na proposta não muda — só o que o cliente vê. */
let _mc=null,_mcN=-1;
const marcasCatalogo=()=>{const ps=(typeof S!=='undefined'&&S.db&&S.db.produtos)||[];if(_mc&&_mcN===ps.length)return _mc;
  const set=new Set();ps.forEach(p=>{const m=nz(p&&p.marca);if(m&&!NAO_MARCA.has(m))set.add(m)});_mc=[...set].sort((a,b)=>b.length-a.length);_mcN=ps.length;return _mc};
window.nomeCliente.ambiente=function(nome,prods,bloco){
  let orig=String(nome==null?'':nome);
  /* sistema montado de um kit: o nome do kit pode trazer marca ou linha de produto (ex.: "7.10.4 - Focal Utopia") —
     o cliente vê o ambiente digitado ou, sem ele, o grupo do kit (ex.: "Home Cinema") */
  if(bloco&&bloco.kit){const pz=String(bloco.kit).split(' · ');const grupo=pz[0]||'Ambiente';const kn=pz.slice(1).join(' · ');
    if(kn){const i=orig.indexOf(kn);if(i>=0)orig=orig.slice(0,i)+orig.slice(i+kn.length)}
    orig=orig.replace(/^[\s·\-–—|/]+|[\s·\-–—|/]+$/g,'').trim()||grupo}
  let t=' '+nz(orig)+' ';
  const termos=[...marcasCatalogo(),...(prods||[]).filter(Boolean).map(p=>nz(modelo(p))).filter(x=>x.length>=3)];
  let mudou=false;termos.forEach(x=>{if(!x)return;while(t.includes(' '+x+' ')){t=t.replace(' '+x+' ',' ');mudou=true}});
  if(!mudou)return orig;
  /* devolve o texto original sem as palavras retiradas (mantém acento e caixa das que ficam) */
  const fica=new Set(t.trim().split(' ').filter(Boolean));
  const out=orig.split(/(\s+)/).filter(w=>/\s+/.test(w)||fica.has(nz(w))||!nz(w)).join('').replace(/(\s*[-–—·|/]\s*)+(?=[-–—·|/])/g,' ').replace(/[\s·\-–—|/]+$/,'').replace(/^[\s·\-–—|/]+/,'').replace(/\s{2,}/g,' ').trim();
  return /[A-Za-zÀ-ú0-9]/.test(out)?out:'Ambiente'};
window.nomeCliente.vaza=vaza;window.nomeCliente.modelo=modelo;window.nomeCliente.NAO_MARCA=NAO_MARCA;
})();
