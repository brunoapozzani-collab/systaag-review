/* v171 — endereço e chave PÚBLICA (publishable/anon) do projeto Supabase que guarda o CRM compartilhado.
   A chave publishable é feita para viver no navegador; o acesso à tabela é governado pelas policies (RLS) no Supabase. */
window.NUVEM_CONFIG={url:'https://qptluvvsfhtkbbjaphad.supabase.co',key:'sb_publishable_CY_sKGogvrohbRqcchKeBw_wWLDJ4ne'};

/* v197 — TRAVA DE SEGURANÇA 1 (21/11/2026, depois do incidente das 18:53–19:10)
   Só o endereço oficial (systaag-review-tau.vercel.app) grava na base compartilhada. Qualquer outra cópia do sistema
   (links de teste/pré-visualização do Vercel, cópias locais) LÊ a nuvem normalmente, mas NUNCA grava nela: os envios
   são respondidos aqui mesmo como "feito", sem sair do navegador. Foi uma cópia de teste com defeito que empurrou dados
   de demonstração para a base real e começou o incidente. */
(function(){try{
  var OFICIAL=['systaag-review-tau.vercel.app'];
  if(OFICIAL.indexOf(location.hostname)>=0)return;
  var base=window.NUVEM_CONFIG&&window.NUVEM_CONFIG.url;if(!base||!window.fetch)return;
  window.NUVEM_CONFIG.somenteLeitura=true;
  /* aviso visível: quem abrir uma cópia de teste sabe que nada do que fizer fica guardado */
  setInterval(function(){try{if(!document.body||document.getElementById('somenteLeitura'))return;var d=document.createElement('div');d.id='somenteLeitura';d.style.cssText='position:fixed;left:12px;bottom:12px;z-index:2147483646;background:#b42318;color:#fff;font:700 12px/1.2 system-ui,-apple-system,sans-serif;padding:7px 12px;border-radius:999px;pointer-events:none';d.textContent='CÓPIA DE TESTE · só leitura — nada é gravado';document.body.appendChild(d)}catch(e){}},2000);
  var f0=window.fetch.bind(window);
  window.fetch=function(input,init){try{var u=typeof input==='string'?input:(input&&input.url)||'';var m=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
    if(u.indexOf(base)===0&&m!=='GET'&&m!=='HEAD'){if(!window.__avisoLeitura){window.__avisoLeitura=1;console.warn('SYSTAAG: cópia de teste ('+location.hostname+') — só leitura; nada é gravado na base compartilhada')}
      return Promise.resolve(new Response('[]',{status:201,headers:{'content-type':'application/json'}}))}}catch(e){}
    return f0.apply(window,arguments)};
}catch(e){}})();
