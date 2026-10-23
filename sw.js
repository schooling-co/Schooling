// Schooling offline service worker.
// Install: saves the whole app shell so it opens with no internet.
// Fetch: tries the network first (so updates arrive), falls back to the saved copy when offline.
const V="schooling-5a4a2aa6";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==self.location.origin)return; // external fonts/scripts: normal browser handling
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r.ok){const copy=r.clone();caches.open(V).then(c=>c.put(e.request,copy))}
      return r;
    }).catch(()=>caches.match(e.request)
      .then(m=>m||caches.match(e.request,{ignoreSearch:true}))
      .then(m=>m||caches.match(new URL("./index.html",e.request.url).href))  // role folder: its own page first
      .then(m=>m||caches.match("./index.html")))
  );
});
