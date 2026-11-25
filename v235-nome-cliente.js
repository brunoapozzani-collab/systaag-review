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
/* ───── linhas que o cliente vê (Bruno, 25/11 noite) ─────
   · linha com quantidade 0 não aparece (é a "Miscelânea — linha do Excel sem produto": o valor já está em Equipamentos);
   · exceção: cabo/bobina (produto medido) com quantidade 0 e valor — a metragem não veio do arquivo Excel; o cliente vê o item sem
     número ("metragem conforme projeto") e a linha vai para a lista de conferência. */
const prodDe=l=>(typeof get==='function'?get('produtos',l&&l.produto_id):null);
const medido=l=>{const p=prodDe(l);return !!p&&p.rastreio==='medido'};
const valorDe=l=>(+l.qtd||0)*(+l.preco_unit||0)+(+l.misc||0);
const fq=q=>(Math.round((+q||0)*100)/100).toLocaleString('pt-BR');
const SEMQ='metragem conforme projeto';
window.nomeCliente.mostra=l=>!!l&&!l.ocultar&&((+l.qtd||0)>0||(medido(l)&&valorDe(l)>0));
window.nomeCliente.semQtd=l=>!!l&&!((+l.qtd||0)>0)&&medido(l)&&valorDe(l)>0;
window.nomeCliente.texto=l=>{const n=window.nomeCliente(prodDe(l));return (+l.qtd||0)>0?fq(l.qtd)+'× '+n:n+' — '+SEMQ};
/* agrupa por nome que o cliente vê: [[nome, quantidade em texto]] */
window.nomeCliente.agrupa=function(linhas){const m=new Map();(linhas||[]).filter(window.nomeCliente.mostra).forEach(l=>{const n=window.nomeCliente(prodDe(l));const x=m.get(n)||{q:0,sem:false};if((+l.qtd||0)>0)x.q+=+l.qtd;else x.sem=true;m.set(n,x)});
  return [...m.entries()].map(([n,x])=>[n,x.q>0?fq(x.q)+(x.sem?' + '+SEMQ:''):SEMQ])};
/* ───── ponte do rodapé: as partes que o cliente vê somam o total que ele vê ─────
   Equipamentos + Serviços + (Desconto/Acréscimo = ajuste da proposta) + (o que o total tem fora dos itens: atendimento de pós-venda
   ou valor fechado de venda sem itens no sistema) = Total. Cada parte é arredondada em reais e o resto do arredondamento vai para a
   maior parte, para a soma na tela fechar com o total na tela. */
window.nomeCliente.ponte=function(p,R){R=R||M.resumo(p);const tot=+R.tot||0,e=+(R.e&&R.e.venda)||0,sv=+(R.s&&R.s.venda)||0,aj=+p.ajuste||0;
  const P=[];if(Math.abs(e)>=0.005)P.push({k:'equip',lb:'Equipamentos',v:e});if(Math.abs(sv)>=0.005)P.push({k:'serv',lb:'Serviços'+(R.s&&R.s.total?' ('+fq(R.s.total)+' diárias)':''),v:sv});
  const resto0=tot-e-sv;let ajU=0;if(Math.abs(aj)>=0.005&&Math.abs(resto0-aj)<0.01){ajU=aj;P.push({k:'ajuste',lb:aj<0?'Desconto':'Acréscimo',v:aj})}
  const resto=tot-e-sv-ajU;if(Math.abs(resto)>=0.005){const semItens=!(p.blocos||[]).some(b=>(b.itens||[]).length);
    P.push({k:'resto',lb:p.linha==='posvenda'?'Atendimento de pós-venda':semItens?'Valor fechado da venda':'Outros valores',v:resto})}
  const alvo=Math.round(tot);P.forEach(x=>x.r=Math.round(x.v));const soma=P.reduce((a,x)=>a+x.r,0);
  if(P.length&&soma!==alvo){const big=P.reduce((a,x)=>Math.abs(x.v)>Math.abs(a.v)?x:a,P[0]);big.r+=alvo-soma}
  return {partes:P,total:alvo,fecha:P.reduce((a,x)=>a+x.r,0)===alvo||(!P.length&&alvo===0)}};
const R$=v=>(v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR');
window.nomeCliente.ponteTexto=function(p,R){const X=window.nomeCliente.ponte(p,R);if(!X.partes.length)return 'Total '+R$(X.total);
  return X.partes.map((x,i)=>(i?(x.r<0?' − ':' + '):(x.r<0?'− ':''))+x.lb+' '+R$(Math.abs(x.r)).replace('−','')).join('')+' = '+R$(X.total)};
window.nomeCliente.vaza=vaza;window.nomeCliente.modelo=modelo;window.nomeCliente.NAO_MARCA=NAO_MARCA;
})();
