// Schooling offline service worker.
// Opens instantly from the saved copy, then checks the network in the background (stale-while-revalidate).
// When a newer version is found, the open page is told so it can show an "Update" button.
const V="schooling-v5";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const key=u=>new Request(u.origin+u.pathname);
const textual=r=>/text|javascript|json|xml/.test((r.headers.get("content-type")||""));
const MK=new Request(self.location.origin+"/__upd");
function notify(){self.clients.matchAll({type:"window"}).then(cs=>cs.forEach(c=>c.postMessage({t:"upd"})))}
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==self.location.origin)return; // external fonts/scripts: normal browser handling
  e.respondWith((async()=>{
    const c=await caches.open(V),k=key(u);
    const hit=await c.match(k);
    if(e.request.mode==="navigate")await c.delete(MK);
    const old=hit?hit.clone():null;
    const net=fetch(e.request,{cache:"no-cache"}).then(async r=>{
      if(r&&r.ok){
        let changed=false;
        try{if(old&&textual(r)){const [a,b]=await Promise.all([old.text(),r.clone().text()]);changed=a!==b}}catch(x){}
        await c.put(k,r.clone());
        if(changed){await c.put(MK,new Response("1"));notify()}
      }
      return r;
    }).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const r=await net;
    if(r)return r;
    return (await c.match(new Request(new URL("./index.html",e.request.url).href)))||(await c.match(new Request(new URL("./index.html",self.location.href).href)))||Response.error();
  })());
});
self.addEventListener("message",e=>{
  if(e.data&&e.data.t==="q"&&e.source)e.waitUntil(caches.open(V).then(c=>c.match(MK)).then(m=>{if(m)e.source.postMessage({t:"upd"})}));
});
