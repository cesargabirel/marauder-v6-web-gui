// Run with: npm install --no-save playwright && npx playwright install chromium
// Then: node tests/browser.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'index.html')))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  let controller;window.sent=[];window.closeCount=0;
  const serial=new EventTarget();
  const fake={async open(options){window.openOptions=options;this.readable=new ReadableStream({start(c){controller=c}});this.writable=new WritableStream({write(bytes){window.sent.push(new TextDecoder().decode(bytes))}})},async close(){window.closeCount++}};
  serial.requestPort=async()=>fake;
  window.feed=text=>controller.enqueue(new TextEncoder().encode(text));
  window.feedBytes=bytes=>controller.enqueue(new Uint8Array(bytes));
  window.unplug=()=>controller.error(new Error('USB disconnected'));
  Object.defineProperty(navigator,'serial',{value:serial});
 });
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.screenshot({path:path.join(root,'docs','desktop.png'),fullPage:true});
 assert(await page.locator('#send').isDisabled());
 await page.click('#connect');await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Conectado');
 assert.equal((await page.evaluate(()=>window.openOptions)).baudRate,115200);
 await page.click('[data-command="scanall"]');
 await page.click('[data-command="stopscan"]');
 assert.deepEqual(await page.evaluate(()=>window.sent),['scanall\n','stopscan\n']);
 await page.evaluate(()=>{window.feedBytes([195]);window.feedBytes([177]);window.feed('<img src=x onerror=alert(1)>\n')});
 await page.waitForFunction(()=>document.querySelector('#terminal').textContent.includes('ñ<img'));
 assert.equal(await page.locator('#terminal img').count(),0);
 await page.click('#listSD');
 await page.evaluate(()=>{window.feed('capture.pcap\t10');window.feed('24\r\nnotes.log\t42\r\n')});
 await page.waitForFunction(()=>document.querySelectorAll('#files tr').length===2);
 assert.equal(await page.locator('#files tr').first().innerText(),'capture.pcap\t1024\tLector SD');
 await page.click('#finishList');
 await page.selectOption('#eol','crlf');await page.fill('#command','info');await page.click('#send');
 assert.equal((await page.evaluate(()=>window.sent)).at(-1),'info\r\n');
 const count=await page.evaluate(()=>window.sent.length);
 await page.evaluate(()=>{document.querySelector('#command').value='info\x01';document.querySelector('#cli').requestSubmit()});
 await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('sola línea'));
 assert.equal(await page.evaluate(()=>window.sent.length),count);
 await page.setInputFiles('#localFiles',{name:'sample.pcap',mimeType:'application/octet-stream',buffer:Buffer.from([0xd4,0xc3,0xb2,0xa1,0,255,12])});
 const downloadPromise=page.waitForEvent('download');await page.getByText('Guardar copia',{exact:true}).click();const download=await downloadPromise;
 assert.deepEqual(fs.readFileSync(await download.path()),Buffer.from([0xd4,0xc3,0xb2,0xa1,0,255,12]));
 await page.click('#connect');await page.waitForFunction(()=>window.closeCount===1);
 assert(await page.locator('#send').isDisabled());
 await page.click('#connect');await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Conectado');await page.evaluate(()=>window.unplug());await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Desconectado');
 await page.setViewportSize({width:820,height:1180});await page.reload();await page.screenshot({path:path.join(root,'docs','tablet.png'),fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: 115200, command mapping, UTF-8 chunks, XSS, fragmented SD listing, CRLF, control rejection, binary copy, close, reconnect, unplug, responsive layouts.');
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

