/* sw.js — v225 (22/11/2026): A PÁGINA DE ENTRADA VEM DO PRÓPRIO NAVEGADOR
   Medido no Mac do Bruno: antes de a página começar, o navegador espera o servidor responder pela página de entrada
   (≈55 ms com a ligação já aberta; 264 ms na primeira abertura depois de um tempo parado). Este arquivo só declara uma regra
   ao navegador: "o endereço / (abrir o sistema) é respondido pela cópia guardada 'systaag-entrada-1'; se não houver cópia,
   pela rede, como sempre". Não há código a correr a cada pedido (sem fetch handler) — tudo o mais nem passa por aqui.
   Quem mantém a cópia em dia é a própria porta de entrada (loader.html): a cada abertura ela busca a página no servidor;
   se mudou, guarda a nova e — se a pessoa ainda não clicou nem digitou — recarrega já na versão nova.
   Para desligar: publicar este arquivo com DESLIGA=true (ele apaga a cópia e se remove). */
const CACHE='systaag-entrada-1',DESLIGA=false;
self.addEventListener('install',e=>{
  if(!DESLIGA){try{if(e.addRoutes)e.waitUntil(e.addRoutes([{condition:{urlPattern:new URLPattern({pathname:'/',search:''}),requestMode:'navigate'},source:{cacheName:CACHE}}]).catch(()=>{}))}catch(x){}}
  self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  if(DESLIGA){try{await caches.delete(CACHE)}catch(x){}try{await self.registration.unregister()}catch(x){}return}
  await self.clients.claim()})())});
