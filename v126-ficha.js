/* v126 · a ficha do colaborador deixa corrigir a Classificação e a Disciplina (30/10/2026)
   Antes, uma ficha salva com a Classificação errada (ex.: CMV em vez de Despesa administrativa) não tinha onde ser
   corrigida na tela — a antiga tabela do RH foi trocada pela Base › Pessoas. Agora a ficha (Base › Pessoas › clique no
   nome) mostra Classificação e Disciplina ao lado de Salário base e Vínculo, e cada troca salva na hora. */
(function(){'use strict';if(window.__V126FICHA)return;window.__V126FICHA=true;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DL={projeto:'Projeto',estrutural:'Estrutural',instalacao:'Instalação',programacao:'Programação'};
A.setClasse126=function(nome,cl){const f=(S.db.folha||[]).find(x=>x.nome===nome);if(!f)throw new Error('Ficha não encontrada.');
  A.setFolha(nome,'classe',cl);if(cl==='cmv'){if(!f.disc)A.setFolha(nome,'disc','instalacao')}else if(f.disc)A.setFolha(nome,'disc',null)};
const _s=SCREENS.colaboradores;if(typeof _s!=='function')return;
SCREENS.colaboradores=function(arg){let h=_s.apply(this,arguments);if(!arg||typeof h!=='string')return h;
  const nome=decodeURIComponent(arg);const f=(S.db.folha||[]).find(x=>x.nome===nome);if(!f)return h;
  const k="A.setFolha('"+nome+"','regime',this.value)";const i=h.indexOf(k);if(i<0)return h;const j=h.indexOf('</select></div>',i);if(j<0)return h;
  let CL={};try{CL=CLASSE_LB}catch(e){}const J=nome.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  const add=`<div class="col-6"><label class="sub">Classificação</label><select class="form-select form-select-sm" data-g126="classe" onchange="run(()=>A.setClasse126('${E(J)}',this.value),'Classificação salva')">${Object.entries(CL).map(([v,l])=>`<option value="${v}" ${f.classe===v?'selected':''}>${E(l)}</option>`).join('')}</select></div>`+
    (f.classe==='cmv'?`<div class="col-6"><label class="sub">Disciplina (técnico)</label><select class="form-select form-select-sm" data-g126="disc" onchange="run(()=>A.setFolha('${E(J)}','disc',this.value),'Disciplina salva')">${Object.entries(DL).map(([v,l])=>`<option value="${v}" ${f.disc===v?'selected':''}>${l}</option>`).join('')}</select></div>`:'');
  const fim=j+'</select></div>'.length;return h.slice(0,fim)+add+h.slice(fim)};
})();
