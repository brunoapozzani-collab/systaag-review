/* v153 — ABRIR RÁPIDO (Bruno, 05-Nov-2026)
   "Por que demora tanto para abrir?" — medido com o profiler do Chrome: baixar o arquivo leva 0,1 s; o que demorava eram
   cálculos repetidos milhares de vezes a cada abertura (não o tamanho do arquivo). O arquivo é carregado em camadas e quase
   toda camada redesenha o Início ao instalar; cada desenho refazia do zero:
   1. Q.compute() / Q.demanda() — o motor do Estoque (demanda × unidades × pedidos), refeito para CADA produto
      (nodeStats → prodInv → Q.compute, centenas de vezes por desenho), e a camada F10 (v124-fixes) ainda varria todas as
      unidades para cada proposta concluída dentro de cada chamada.
   2. V123.pessoaDoConsultor() — para cada proposta (comissão → FN.propPlano), comparava o nome do consultor com TODAS as
      pessoas do cadastro, normalizando os nomes de novo a cada vez.
   3. Início v149 logava "C is not defined" ~700 vezes por abertura (C era COP; um console.error por obra) e v130 "D.propTotal"
      (D ali era o helper de porta, não o D da Base) — corrigidos nos próprios arquivos.
   Conserto, sem mudar nenhuma regra de negócio: uma memória de curtíssima duração ("memo") para esses cálculos — vale só dentro
   do MESMO instante (tick) do navegador e cai em qualquer gravação (put/save/reset) ou troca de base (S.db). Dentro de um
   desenho de tela os dados não mudam, então o mesmo cálculo não precisa ser refeito; nada fica em cache de um clique para o outro.
   Este arquivo entra logo depois do motor (Q) ser definido, e se reinstala sozinho sempre que uma camada posterior envolve
   Q.compute / Q.demanda / pessoaDoConsultor / put / save / reset — a memória fica sempre por fora. */
(function(){
'use strict';
if(window.__v153)return;window.__v153=true;
const DB=()=>{try{return S.db||null}catch(e){return null}};

/* ---------- memo de um tick: chave = (geração de gravações, S.db, tick) ---------- */
let gen=0,tick=0,tickArmado=false;
const armaTick=()=>{if(tickArmado)return;tickArmado=true;setTimeout(()=>{tickArmado=false;tick++},0)};
const bump=()=>{gen++};
window.__v153_invalida=bump;
window.__v153_stamp=()=>gen+':'+tick;
const copiaProps=(w,f)=>{Object.keys(f).forEach(k=>{try{w[k]=f[k]}catch(e){}});return w};
const memo=(fn,pos)=>{let db=null,g=-1,t=-1,v;
  const w=function(){const d=DB();
    if(d&&g===gen&&t===tick&&db===d)return pos?pos(v):v;
    v=fn.apply(this,arguments);g=gen;t=tick;db=d;armaTick();return pos?pos(v):v};
  return copiaProps(w,fn)};
const memoMap=(fn,keyOf,pos)=>{let m=new Map(),db=null,g=-1,t=-1;
  const w=function(){const kk=keyOf.apply(this,arguments);const d=DB();
    if(!(d&&g===gen&&t===tick&&db===d)){m=new Map();g=gen;t=tick;db=d}
    if(m.has(kk)){const v=m.get(kk);return pos?pos(v):v}const v=fn.apply(this,arguments);m.set(kk,v);armaTick();return pos?pos(v):v};
  return copiaProps(w,fn)};
const bumper=f=>{if(typeof f!=='function')return f;const w=function(){bump();try{return f.apply(this,arguments)}finally{bump()}};return copiaProps(w,f)};

/* a propriedade fica "vigiada": toda reatribuição feita por uma camada posterior recebe o envoltório de novo (memo por fora) */
function vigia(obj,name,wrap){let cur=wrap(obj[name]);
  try{Object.defineProperty(obj,name,{configurable:true,enumerable:true,get(){return cur},set(f){cur=(typeof f==='function')?wrap(f):f;
    /* FPV (Pós-venda) confere se a função viva é a dele: a memória chama a dele por baixo (nada do Pós-venda sai do número),
       então a viva registrada passa a ser a memória — o carimbo posvendaGarantia continua vindo do embrulho do FPV */
    try{if(f&&f.__fpvNome&&window.FPV&&FPV.__vivos&&FPV.__vivos[f.__fpvNome]===f)FPV.__vivos[f.__fpvNome]=cur}catch(e){}}})}
  catch(e){/* declaração de função (put/save) não aceita getter: fica o envoltório simples; as camadas que envolvem depois chamam este por dentro */obj[name]=cur}}

/* gravações invalidam a memória (antes E depois — as camadas de sync mexem na base dentro do save) */
['put','save','reset','del','remove'].forEach(n=>{if(typeof window[n]==='function'||n==='reset')vigia(window,n,bumper)});

/* 1. motor do Estoque — Q é const de escopo global (não window.Q) */
try{if(typeof Q==='object'&&Q){
  if(typeof Q.demanda==='function')vigia(Q,'demanda',f=>memo(f,v=>v.slice()));
  if(typeof Q.compute==='function')vigia(Q,'compute',f=>memo(f));
}}catch(e){console.warn('v153 Q',e)}

/* 2. pessoa do consultor — V123 ainda não existe neste ponto; cria o objeto e vigia a função */
window.V123=window.V123||{};
vigia(window.V123,'pessoaDoConsultor',f=>typeof f==='function'?memoMap(f,x=>String(x==null?'':x)):f);

/* 4. contas por obra / propostas — nascem em blocos posteriores; o index chama isto logo depois de cada bloco.
   Memo por identidade do objeto (a obra / a proposta) dentro do tick; devolve cópia rasa para ninguém mexer no valor guardado.
   Regra já escrita no FPV (índice ~24190): "o contrafactual NÃO PODE MUTAR A LOJA" — ninguém muda a obra e recalcula no mesmo tick.
   FN.obra é embrulhado pelo FPV (Pós-venda), que confere a identidade da função viva: por isso a memória de FN.obra fica POR DENTRO
   (no original, antes de qualquer embrulho) e não é vigiada — o FPV continua por fora, com o seu carimbo. */
const copia=v=>Array.isArray(v)?v.slice():(v&&typeof v==='object')?Object.assign({},v):v;
window.__v153_memo=function(obj,name,modo){try{if(!obj||typeof obj[name]!=='function')return;
  const wrap=f=>modo==='semArg'?memo(f,copia):memoMap(f,x=>x,copia);
  if(modo==='porDentro')obj[name]=memoMap(obj[name],x=>x,copia);else vigia(obj,name,wrap)}catch(e){console.warn('v153',name,e)}};

/* 3. v130 lê window.D (D é const de escopo global) */
try{if(typeof D==='object'&&D&&typeof D.propTotal==='function'&&!window.D)window.D=D}catch(e){}
})();
