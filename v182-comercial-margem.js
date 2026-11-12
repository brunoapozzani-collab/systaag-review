/* =====================================================================================================
   v182 · PROPOSTA — QUADRO FINANCEIRO COMPLETO SÓ PARA GESTÃO E FINANCEIRO (reunião de 06/11/2026)
   Pedido da reunião: "restringir o quadro-resumo financeiro completo à gestão; o Comercial deverá visualizar
   indicadores simplificados de margem".
   O que muda para quem NÃO é Gestão/Diretoria/TI/Financeiro (perfil de "Quem é você?"):
     · o cartão "Cenário Real · margem por frente" (margens em R$ e a ponte de custo) vira um indicador simples:
       só as porcentagens e um sinal — dentro do alvo / perto do alvo / abaixo do alvo;
     · os botões Raio-X e Fechamento (a tabela completa de custos e o fechamento) somem do editor e, se alguém chegar
       neles, volta para a proposta;
     · a linha "Custo (do arquivo)" do cartão da METAS some.
   Nada é apagado: Gestão e Financeiro continuam vendo tudo como antes. O que decide é o perfil da pessoa escolhida.
   ===================================================================================================== */
(function(){
'use strict';
if(window.__v182)return;window.__v182=true;
const T=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const VEEM=['diretoria','ti','gestao','financeiro'];
const veTudo=()=>{const u=T(()=>me(),null);if(!u)return true;return VEEM.indexOf(String(u.perfil||''))>=0};
window.V182={veTudo};
const pct=s=>{const m=String(s||'').match(/(-?[\d.]+,\d+|-?\d+)%/);return m?+m[1].replace(/\./g,'').replace(',','.'):null};
const fmt=v=>v==null?'—':v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
function simples(card){
  const alvo=pct((card.match(/alvo\s*([\d.,]+%)/)||[])[1]);
  const pega=rot=>{const re=new RegExp('Margem\\s*(?:de\\s*)?<b>'+rot+'</b>\\s*<span class="chip[^"]*">([^<]+)</span>');return pct((card.match(re)||[])[1])};
  const sv=pega('serviço'),eq=pega('equipamentos'),tt=pega('total');
  const sinal=v=>{if(v==null||alvo==null)return ['','—'];if(v>=alvo)return ['ok','dentro do alvo'];if(v>=alvo-5)return ['warn','perto do alvo'];return ['bad','abaixo do alvo']};
  const [cls,txt]=sinal(tt);
  const chip=v=>{const [c]=sinal(v);return `<span class="chip ${c}">${fmt(v)}</span>`};
  const cor=cls==='ok'?'#198754':cls==='warn'?'#fd7e14':'#dc3545';
  return `<div class="card p-3 mb-3" data-v182="1" style="border-left:4px solid ${cor}"><div class="d-flex align-items-center flex-wrap gap-3">
    <div><div class="sub" style="font-size:11px;letter-spacing:.06em">MARGEM DA PROPOSTA</div><div style="font-size:26px;font-weight:800;color:${cor}">${fmt(tt)}</div><div class="sub" style="font-size:12px">${txt}${alvo!=null?' · alvo '+fmt(alvo):''}</div></div>
    <div class="d-flex gap-3 flex-wrap" style="font-size:13px"><span>Equipamentos ${chip(eq)}</span><span>Serviço ${chip(sv)}</span></div>
    <div class="sub ms-auto" style="font-size:11.5px;max-width:300px">Verde = no alvo · laranja = até 5 pontos abaixo · vermelho = mais que isso. Custos e o quadro completo ficam com a Gestão e o Financeiro.</div></div></div>`}
function liga(){if(typeof SCREENS!=='object'||typeof SCREENS.editor!=='function')return false;if(SCREENS.editor.__v182)return true;
  const _e=SCREENS.editor;
  SCREENS.editor=function(id){
    if(!veTudo()){try{if(typeof edPane!=='undefined'&&(edPane==='raiox'||edPane==='fechamento')){edPane='proposta';try{toast('O Raio-X e o Fechamento são da Gestão e do Financeiro.',true)}catch(e){}}}catch(e){}}
    let h=_e.apply(this,arguments);if(typeof h!=='string'||veTudo())return h;
    try{
      h=h.replace(/<button[^>]*onclick="edPane='(?:raiox|fechamento)';render\(\)"[^>]*>[\s\S]*?<\/button>/g,'');
      const i=h.indexOf('Cenário Real · margem por frente');
      if(i>0){const s=h.lastIndexOf('<div class="card',i);const fimTxt='cada % é a margem sobre a venda da própria frente.</div>';let f=h.indexOf(fimTxt,i);
        if(s>=0&&f>0){f=h.indexOf('</div>',f+fimTxt.length);if(f>0){f+=6;h=h.slice(0,s)+simples(h.slice(s,f))+h.slice(f)}}}
      h=h.replace(/<div[^>]*>\s*Custo \(do arquivo\):[\s\S]*?<\/div>/g,'');
    }catch(e){console.error('v182',e)}
    return h};
  SCREENS.editor.__v182=true;Object.keys(_e).forEach(k=>{try{SCREENS.editor[k]=_e[k]}catch(e){}});return true}
if(!liga()){let n=0;const t=setInterval(()=>{if(liga()||++n>40)clearInterval(t)},250)}
})();
