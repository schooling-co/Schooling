// Single source: edit ONLY the root index.html. Run `node build.js` (Vercel runs it on deploy).
// For every portal (super / teacher / parent=students) it writes:
//   - index.html  : copy of root page + STATIC <link rel=manifest>, icons and titles in <head>
//                   (so each portal installs / gets its shortcut as its OWN app)
//   - sw.js       : its own service worker (own scope + own cache), so installs never mix
// and stamps the cache version so phones always get the new app.
const fs=require("fs"),crypto=require("crypto");
const src=fs.readFileSync("index.html","utf8");
const h=crypto.createHash("sha1").update(src).digest("hex").slice(0,8);
const roles={
  super:  {title:"Schooling Super Admin", short:"Super Admin"},
  teacher:{title:"Schooling Teacher",     short:"Teacher"},
  parent: {title:"Schooling Student",     short:"Student"}
};
const swSrc=fs.readFileSync("sw.js","utf8");
for(const d of Object.keys(roles)){
  const r=roles[d];
  const head='<meta charset="utf-8"><link rel="manifest" href="manifest.webmanifest">'
    +'<link rel="icon" href="icon-192.png" type="image/png">'
    +'<link rel="apple-touch-icon" href="apple-touch-icon.png">'
    +'<meta name="apple-mobile-web-app-title" content="'+r.title+'">'
    +'<meta name="application-name" content="'+r.title+'">';
  let out=src.replace('<meta charset="utf-8">',head).replace(/<title>[^<]*<\/title>/,"<title>"+r.title+"</title>");
  fs.writeFileSync(d+"/index.html",out);
  // role service worker: same logic, but its own cache name (scope = its own folder)
  let sw=swSrc.replace(/const V="[^"]*";/,'const V="schooling-'+d+'-'+h+'";');
  fs.writeFileSync(d+"/sw.js",sw);
}
let sw=swSrc.replace(/const V="[^"]*";/,'const V="schooling-'+h+'";');
fs.writeFileSync("sw.js",sw);
console.log("built: portals synced (own manifest + own service worker each), cache version "+h);
