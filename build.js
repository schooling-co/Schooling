// Single source: edit ONLY the root index.html. Run `node build.js` (Vercel runs it on deploy).
// It copies it to the role folders and stamps the service-worker cache version, so phones always get the new app.
const fs=require("fs"),crypto=require("crypto");
const src=fs.readFileSync("index.html");
for(const d of ["super","teacher","parent"])fs.writeFileSync(d+"/index.html",src);
const h=crypto.createHash("sha1").update(src).digest("hex").slice(0,8);
let sw=fs.readFileSync("sw.js","utf8");
sw=sw.replace(/const V="[^"]*";/,'const V="schooling-'+h+'";');
fs.writeFileSync("sw.js",sw);
console.log("built: role pages synced, cache version schooling-"+h);
