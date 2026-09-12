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
 // Native disclosure works with keyboard and needs no JS toggle handlers.
 await page.locator('#groups > details > summary').first().focus();
 await page.keyboard.press('Enter');
 assert(await page.locator('#groups > details').first().evaluate(el=>el.open));
 await page.locator('.submenu > summary').first().click();
 await page.screenshot({path:path.join(root,'docs','desktop.png'),fullPage:true});
 assert(await page.locator('#send').isDisabled());
 await page.click('#connect');await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Conectado');
 assert.equal((await page.evaluate(()=>window.openOptions)).baudRate,115200);
 await page.locator('.submenu > summary').filter({hasText:'Scanners'}).click();
 await page.click('[data-command="scanall"]');
 await page.click('[data-command="stopscan"]');
 assert.deepEqual(await page.evaluate(()=>window.sent),['scanall\n','stopscan\n']);
 // Unsupported physical-menu labels must never become active CLI commands.
 assert.equal(await page.locator('[data-unavailable]').count(),5);
 for(const b of await page.locator('[data-unavailable]').all())assert(await b.isDisabled());
 // Every direct button has a verified wire mapping, including named aliases.
 const mappings={'pwnagotchi':'sniffpwn','scanap':'sniffbeacon','sshescan':'portscan -s ssh','dnsscan':'portscan -s dns','httpsscan':'portscan -s https','deauth':'attack -t deauth','rickroll':'attack -t rickroll','probespam':'attack -t probe','badmsg':'attack -t badmsg','saecommit':'attack -t sae','flock':'sniffbt -t flock','metadetect':'sniffbt -t meta','skimmer':'sniffskim','sourapple':'blespam -t sourapple','applejuice':'blespam -t applejuice','swiftpair':'blespam -t windows','samsungspam':'blespam -t samsung','googlespam':'blespam -t google','flipperspam':'blespam -t flipper','gps sat':'gps -g sat','tracker start':'gpstracker -c start','tracker stop':'gpstracker -c stop','backup':'backupspiffs','restore':'restorespiffs'};
 async function reveal(button){await button.evaluate(b=>{const parents=[];for(let p=b.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')parents.unshift(p);for(const p of parents)p.open=true})}
 for(const [label,command] of Object.entries(mappings)){const b=page.locator('[data-label="'+label+'"]');await reveal(b);await b.click();assert.equal((await page.evaluate(()=>window.sent)).at(-1),command+'\n')}
 const portscan=page.locator('[data-label="portscan"]');await reveal(portscan);await portscan.click();
 let previous=await page.evaluate(()=>window.sent.length);
 await page.click('#runAction');assert.equal(await page.evaluate(()=>window.sent.length),previous);
 await page.locator('#actionFields input').fill('3');await page.click('#runAction');assert.equal((await page.evaluate(()=>window.sent)).at(-1),'portscan -a -t 3\n');
 const brightness=page.locator('[data-label="brightness"]');await reveal(brightness);await brightness.click();await page.locator('#actionFields input').fill('10');previous=await page.evaluate(()=>window.sent.length);await page.click('#runAction');assert.equal(await page.evaluate(()=>window.sent.length),previous);await page.locator('#actionFields input').fill('7');await page.click('#runAction');assert.equal((await page.evaluate(()=>window.sent)).at(-1),'brightness -s 7\n');await page.click('#cancelAction');
 const configuredCases=[['beaconspam',['-l'],'attack -t beacon -l'],['karma',['2'],'karma -p 2'],['clearlist',['-c'],'clearlist -c'],['findmy',['2'],'findmy -t 2'],['spoofairtag',['3'],'spoofat -t 3'],['blespam',['google'],'blespam -t google'],['join',['1','test password'],'join -a 1 -p "test password"'],['setmac',['randapmac',''],'randapmac'],['setmac',['cloneapmac','2'],'cloneapmac -a 2'],['Seleccionar objetivos',['-a','1e2'],'select -a 100']];
 for(const [label,values,expected] of configuredCases){const b=page.locator('[data-label="'+label+'"]');await reveal(b);await b.click();const fields=page.locator('#actionFields input,#actionFields select');for(let i=0;i<values.length;i++){const field=fields.nth(i);if(await field.evaluate(el=>el.tagName==='SELECT'))await field.selectOption(values[i]);else await field.fill(values[i])}await page.click('#runAction');assert.equal((await page.evaluate(()=>window.sent)).at(-1),expected+'\n');await page.click('#cancelAction')}
 await page.evaluate(()=>{window.feedBytes([195]);window.feedBytes([177]);window.feed('<img src=x onerror=alert(1)>\n')});
 await page.waitForFunction(()=>document.querySelector('#terminal').textContent.includes('ñ<img'));
 assert.equal(await page.locator('#terminal img').count(),0);
 await page.click('#listSD');
 assert(await page.locator('[data-command="stopscan"]').isEnabled());
 await page.evaluate(()=>{window.feed('capture.pcap\t10');window.feed('24\r\nnotes.log\t42\r\n')});
 await page.waitForFunction(()=>document.querySelectorAll('#files tr').length===2);
 assert.equal(await page.locator('#files tr').first().innerText(),'capture.pcap\t1024\tLector SD');
 await page.click('#finishList');
 await page.click('#listSD');await page.click('[data-command="stopscan"]');assert(await page.locator('#finishList').isDisabled());assert.equal((await page.evaluate(()=>window.sent)).at(-1),'stopscan\n');
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
 await page.setViewportSize({width:820,height:1180});await page.reload();await page.locator('#groups > details > summary').first().click();await page.locator('.submenu > summary').first().click();await page.screenshot({path:path.join(root,'docs','tablet.png'),fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));const stopBox=await page.locator('.stop').boundingBox();assert(stopBox.y>=0&&stopBox.y+stopBox.height<=844);
 assert.deepEqual(errors,[]);
 console.log('PASS: native accordion keyboard, CLI aliases, unsupported actions, parameter forms, persistent stop during SD, 115200, UTF-8, XSS, SD fragments, CRLF, input validation, binary copy, reconnect/unplug, responsive layouts.');
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

