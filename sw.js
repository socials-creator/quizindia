/* India Map Quiz service worker (v4.8). Installed only after the person taps "save offline".
   The page downloads the app files, libraries and boundary maps into this cache; the worker serves them when there is no connection. */
const CACHE='india-map-quiz-v4.8';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('india-map-quiz-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  const r=e.request; if (r.method!=='GET') return;
  const same=new URL(r.url).origin===self.location.origin;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if (same) { // the app itself: network first so updates arrive, saved copy when offline
      try { const res=await fetch(r); if (res.ok) cache.put(r,res.clone()); return res; }
      catch { return (await cache.match(r))||(r.mode==='navigate'?((await cache.match('index.html'))||(await cache.match('./'))):Response.error()); }
    }
    const hit=await cache.match(r); if (hit) return hit; // libraries and map data: saved copy first
    return fetch(r);
  })());
});
