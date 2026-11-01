/* v135 · uma fonte só (01/11/2026)
   1. Duas abas do sistema abertas = duas cópias da base na memória; quem saía por último gravava por cima da outra.
      Agora: quando outra aba grava, esta aba para de gravar e recarrega da base assim que você volta para ela.
   2. "Começar do zero" esvazia também o que ficava guardado dentro de objetos (monitoramento do Pós-venda,
      movimentos de uniformes, estoque de suprimentos, diárias de campo) e o imobilizado (a depreciação aparecia na DRE).
   3. A frase do "Começar do zero" passa a dizer exatamente o que fica e o que sai. */
(function(){'use strict';
  /* ───── 1. várias abas, uma base ───── */
  try{
    const CH=/^systaag_(erp1z?|zero|crm_t)$/;let velha=false,ultimoReload=0;const meu={};
    try{meu.systaag_erp1z=localStorage.getItem('systaag_erp1z');meu.systaag_erp1=localStorage.getItem('systaag_erp1');meu.systaag_zero=localStorage.getItem('systaag_zero');meu.systaag_crm_t=localStorage.getItem('systaag_crm_t')}catch(e){}
    const LS=window.localStorage,set0=Storage.prototype.setItem,rm0=Storage.prototype.removeItem,clr0=Storage.prototype.clear;
    Storage.prototype.setItem=function(k,v){if(this===LS&&CH.test(k)){if(velha)return;meu[k]=String(v)}return set0.call(this,k,v)};
    Storage.prototype.removeItem=function(k){if(this===LS&&CH.test(k)){if(velha)return;meu[k]=null}return rm0.call(this,k)};
    Storage.prototype.clear=function(){if(this===LS){if(velha)return;Object.keys(meu).forEach(k=>meu[k]=null)}return clr0.call(this)};
    const aviso=()=>{try{if(document.getElementById('v135-aba'))return;const d=document.createElement('div');d.id='v135-aba';
      d.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99999;background:#1d1d1f;color:#fff;font:600 13px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;padding:10px 16px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.25)';
      d.textContent='Os dados mudaram em outra aba — atualizando esta aba…';(document.body||document.documentElement).appendChild(d)}catch(e){}};
    const recarregar=()=>{if(Date.now()-ultimoReload<8000)return;ultimoReload=Date.now();aviso();setTimeout(()=>location.reload(),350)};
    window.addEventListener('storage',e=>{if(e.storageArea!==LS)return;if(e.key===null){velha=true}else{if(!CH.test(e.key))return;
        /* a outra aba gravou o MESMO conteúdo que esta aba já tem (recarga, migração idêntica): não é mudança */
        if((e.newValue==null?null:String(e.newValue))===(meu[e.key]==null?null:String(meu[e.key])))return;velha=true}
      if(document.visibilityState==='visible')recarregar()});
    document.addEventListener('visibilitychange',()=>{if(velha&&document.visibilityState==='visible')recarregar()},true);
    window.V135_aba=()=>({velha});
  }catch(e){console.error('v135 abas',e)}

  /* ───── 2. começar do zero: o que morava dentro de objetos ───── */
  function zeraObjetos(db){
    try{const m=db.at_monit;const limpa=(o,d)=>{if(!o||typeof o!=='object'||d>3)return;Object.keys(o).forEach(k=>{if(Array.isArray(o[k]))o[k]=[];else if(o[k]&&typeof o[k]==='object')limpa(o[k],d+1);else if(typeof o[k]==='string'&&d>=1)o[k]=''})};if(m&&typeof m==='object'){Object.keys(m).forEach(k=>{if(Array.isArray(m[k]))m[k]=[];else if(k==='links')m[k]={};else limpa(m[k],1)})}}catch(e){}
    try{const u=db.uniformes;if(u&&typeof u==='object'&&!Array.isArray(u)&&Array.isArray(u.movs))u.movs=[]}catch(e){}
    try{const f=db.fac;if(f&&Array.isArray(f.suprimentos))f.suprimentos.forEach(x=>{x.atual=0})}catch(e){}
    try{const v=db.ffo&&db.ffo.campo&&db.ffo.campo.valores;if(v&&typeof v==='object')Object.keys(v).forEach(k=>{v[k]=Array.isArray(v[k])?v[k].map(()=>0):0})}catch(e){}
    try{const pf=db.params&&db.params.fin;if(pf){if(pf.imobilizado&&typeof pf.imobilizado==='object')Object.keys(pf.imobilizado).forEach(k=>{pf.imobilizado[k]=0});pf.financiamentos=0}}catch(e){}
  }
  try{
    if(typeof window.aplicarZero==='function'&&!window.aplicarZero.__v135){
      const az0=window.aplicarZero;const az=function(db){const r=az0.apply(this,arguments);try{zeraObjetos(db||S.db)}catch(e){}return r};
      az.__v135=true;window.aplicarZero=az}
    if(typeof S!=='undefined'&&S&&S.db&&S.db.af113_zero){const antes=JSON.stringify([S.db.at_monit,S.db.fac&&S.db.fac.suprimentos,S.db.uniformes&&S.db.uniformes.movs,S.db.params&&S.db.params.fin&&S.db.params.fin.imobilizado]);
      zeraObjetos(S.db);if(JSON.stringify([S.db.at_monit,S.db.fac&&S.db.fac.suprimentos,S.db.uniformes&&S.db.uniformes.movs,S.db.params&&S.db.params.fin&&S.db.params.fin.imobilizado])!==antes){try{save()}catch(e){}}}
  }catch(e){console.error('v135 zero',e)}

  /* ───── 2b. em modo zero, o que você criou depois do zero NÃO some ao recarregar ─────
     A camada 113 re-aplica a limpeza a cada carga (para as camadas de montagem não devolverem os exemplos).
     Só que isso apagava também o que o usuário criou (cliente, proposta…). Aqui a base gravada — já limpa pelo
     zero e com o que o usuário fez — volta a valer: cada tabela de registros vem da gravação, não da limpeza. */
  try{
    if(typeof S!=='undefined'&&S&&S.db&&S.db.af113_zero&&window.__v135_raw){
      let raw=window.__v135_raw;let j=raw.charAt(0)==='{'?raw:(typeof LZString!=='undefined'?LZString.decompressFromUTF16(raw):'');
      const st=j?JSON.parse(j):null;
      if(st&&st.af113_zero){let n=0;const SUB=['fin','pc','fac','ffo','fpv'];
        Object.keys(st).forEach(k=>{if(Array.isArray(st[k])&&JSON.stringify(st[k])!==JSON.stringify(S.db[k])){S.db[k]=st[k];n++}});
        SUB.forEach(k=>{const a=st[k],b=S.db[k];if(a&&b&&typeof a==='object'&&typeof b==='object')Object.keys(a).forEach(x=>{if(Array.isArray(a[x])&&JSON.stringify(a[x])!==JSON.stringify(b[x])){b[x]=a[x];n++}})});
        if(n){try{save()}catch(e){}try{if(typeof render==='function')render()}catch(e){}console.info('v135 · modo zero: '+n+' tabela(s) da gravação mantidas')}}
    }
  }catch(e){console.error('v135 zero-persist',e)}

  /* ───── 3. a frase do Começar do zero ───── */
  try{
    if(typeof MG!=='undefined'&&MG&&typeof MG.zerar==='function'&&!MG.zerar.__v135){const z=MG.zerar;
      MG.zerar=function(c){const r=z.apply(MG,arguments);if(!c){try{const b=document.querySelector('#mg-ask .sub');if(b)b.innerHTML='Apaga clientes, obras, propostas, unidades do estoque, pedidos, lançamentos, parceiros, fornecedores, o monitoramento do Pós-venda e os movimentos internos (uniformes, suprimentos, diárias). <b>Mantém</b> a equipe técnica, o catálogo (produtos, categorias, marcas), as listas fixas, os lugares do estoque SP/RJ (vazios), o seu usuário e a meta anual.<br>Os dados de demonstração voltam com <b>Resetar dados</b>.'}catch(e){}}return r};
      MG.zerar.__v135=true}
  }catch(e){console.error('v135 frase',e)}
})();
