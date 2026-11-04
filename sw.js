// Schooling offline service worker.
// Opens instantly from the saved copy, then checks the network in the background (stale-while-revalidate).
// When a newer version is found, the open page is told so it can show an "Update" button.
const V="schooling-v7";const EXT="schooling-ext";
const SHELL=["./index.html","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
  const FB=["app","auth","firestore"].map(n=>"https://www.gstatic.com/firebasejs/10.12.2/firebase-"+n+"-compat.js");
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL).then(()=>Promise.all(FB.map(u=>fetch(u,{mode:"cors"}).then(r=>r.ok&&c.put(u,r)).catch(()=>{}))))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==EXT).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const key=u=>new Request(u.origin+u.pathname);
const textual=r=>/text|javascript|json|xml/.test((r.headers.get("content-type")||""));
const MK=new Request(self.location.origin+"/__upd");
function notify(){self.clients.matchAll({type:"window"}).then(cs=>cs.forEach(c=>c.postMessage({t:"upd"})))}
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method==="GET"&&u.hostname==="www.gstatic.com"&&u.pathname.indexOf("/firebasejs/")===0){ // Firebase files never change for a given version: keep them on the phone
    e.respondWith(caches.open(EXT).then(async c=>{const h=await c.match(e.request);if(h)return h;const r=await fetch(e.request);if(r&&(r.ok||r.type==="opaque"))c.put(e.request,r.clone()).catch(()=>{});return r}));return}
  if(e.request.method==="GET"&&u.hostname==="www.gstatic.com"&&u.pathname.indexOf("/firebasejs/")===0){ // versioned Firebase files never change: serve from the saved copy
    e.respondWith(caches.open(V).then(async c=>{const h=await c.match(u.href);if(h)return h;const r=await fetch(e.request);if(r&&(r.ok||r.type==="opaque"))c.put(u.href,r.clone()).catch(()=>{});return r}));return}
  if(e.request.method==="GET"&&u.hostname==="www.gstatic.com"&&u.pathname.indexOf("/firebasejs/")===0){ // Firebase files never change for one version: keep them on the phone
    e.respondWith(caches.open(V).then(async c=>{const h=await c.match(e.request);if(h)return h;try{const r=await fetch(e.request);if(r&&(r.ok||r.type==="opaque"))c.put(e.request,r.clone());return r}catch(x){return Response.error()}}));return}
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
