const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const root = path.resolve('_site');
 const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  const rel = decodeURIComponent(url.pathname).replace(/^\/repo\//,'');
  const file = path.join(root,rel || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.webmanifest':'application/manifest+json','.css':'text/css','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'localhost',r));
 let browser;
 try {
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),headless:true});
  const context=await browser.newContext();
  const page=await context.newPage();
  const base=`http://localhost:${server.address().port}/repo/`;
  await page.goto(base+'login.html');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const manifest = await page.evaluate(async()=> (await fetch('manifest.webmanifest')).json());
  assert.equal(new URL(manifest.start_url,base).href,base+'index.html');
  for(const icon of manifest.icons) {
   const dims=await page.evaluate(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(`${i.width}x${i.height}`);i.onerror=reject;i.src=src;}),icon.src);
   assert.equal(dims,icon.sizes);
  }
  await page.evaluate(()=>fetch('api/session'));
  const keys=await page.evaluate(async()=>{const result=[];for(const name of await caches.keys())for(const req of await (await caches.open(name)).keys())result.push(req.url);return result;});
  assert.deepEqual(keys,[base+'offline.html']);
  await context.setOffline(true);
  await page.goto(base+'viewer.html?id=1');
  await page.getByRole('heading',{name:"You're offline"}).waitFor();
  await context.setOffline(false);
  await page.getByRole('button',{name:'Try again'}).click();
  await page.waitForURL('**/login.html?returnTo=*');
  console.log('PASS: repository subpath, manifest/icons, worker control, offline fallback, reconnect, no session/report caching');
 } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
