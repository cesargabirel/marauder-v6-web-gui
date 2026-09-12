// Run with: npm install --no-save playwright && npx playwright install chromium
// Then: node tests/browser.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(root,'index.html')));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{
   let controller;
   window.sent=[];
   window.closeCount=0;
   const serial=new EventTarget();
   const fake={
    async open(options){
     window.openOptions=options;
     this.readable=new ReadableStream({start(c){controller=c}});
     this.writable=new WritableStream({write(bytes){window.sent.push(new TextDecoder().decode(bytes))}});
    },
    async close(){window.closeCount++}
   };
   serial.requestPort=async()=>fake;
   window.feed=text=>controller.enqueue(new TextEncoder().encode(text));
   window.feedBytes=bytes=>controller.enqueue(new Uint8Array(bytes));
   window.unplug=()=>controller.error(new Error('USB disconnected'));
   Object.defineProperty(navigator,'serial',{value:serial});
  });

  await page.goto('http://127.0.0.1:'+server.address().port);
  assert(await page.locator('#send').isDisabled());
  assert(await page.locator('#stop').isDisabled());

  const expectedLabels=[
   'sniffprobe','sniffbeacon','sniffdeauth','packetcount','sniffpmkid','packetmonitor','channelanalyzer','channelsummary','sniffraw','pwnagotchi','pineapple',
   'pingscan','arpscan','portscan','sshescan','telnetscan','smtpscan','dnsscan','httpscan','rdpscan',
   'evilportal','deauth','apclonespam','deauthtarget','karma','badmsg','badmsgtarget','assocsleep','assocsleeptarget','saecommit','channelswitch','quiettime',
   'clearstations','selecthtml','selectap','viewap','selectstation','join','joinsaved','startap','hostapinfo','setmac','shutdown','loadwardrive','generatessids','selectprobessids','addssids','clearssids','clearaps',
   'sniffbt','sniffflipper','findmy','findmymonitor','skimmer','btanalyze','flock','metadetect','foxhunt',
   'sourapple','applejuice','swiftpair','samsungspam','googlespam','flipperspam','blespam','spoofairtag','findmysound',
   'gpsdata','nmea','tracker start','tracker stop','gpspoi','info','reboot','ls /','brightness','settings'
  ];
  for(const label of expectedLabels)assert(await page.locator('[data-label="'+label.replaceAll('"','\\"')+'"]').count()>=1,'Missing menu entry: '+label);
  assert.equal(await page.locator('[data-label="httpscan"]').count(),2);

  await page.fill('#menuFilter','tracker');
  assert.equal(await page.locator('.cmd').count(),2);
  await page.fill('#menuFilter','');

  await page.click('#connect');
  await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Conectado');
  assert.equal((await page.evaluate(()=>window.openOptions)).baudRate,115200);

  async function reveal(label,index=0){
   const b=page.locator('[data-label="'+label+'"]').nth(index);
   await b.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true});
   return b;
  }

  const aliases={
   pwnagotchi:'sniffpwn',
   sshescan:'portscan -s ssh',
   dnsscan:'portscan -s dns',
   deauth:'attack -t deauth',
   badmsg:'attack -t badmsg',
   saecommit:'attack -t sae',
   skimmer:'sniffskim',
   flock:'sniffbt -t flock',
   metadetect:'sniffbt -t meta',
   sourapple:'blespam -t sourapple',
   applejuice:'blespam -t applejuice',
   swiftpair:'blespam -t windows',
   samsungspam:'blespam -t samsung',
   googlespam:'blespam -t google',
   flipperspam:'blespam -t flipper',
   'tracker start':'gpstracker -c start',
   'tracker stop':'gpstracker -c stop'
  };
  for(const [label,command] of Object.entries(aliases)){
   const b=await reveal(label);
   await b.click();
   assert.equal((await page.evaluate(()=>window.sent)).at(-1),command+'\n',label);
  }

  let b=await reveal('portscan');
  await b.click();
  let previous=await page.evaluate(()=>window.sent.length);
  await page.click('#runAction');
  assert.equal(await page.evaluate(()=>window.sent.length),previous);
  await page.locator('#actionFields input').fill('3');
  await page.click('#runAction');
  assert.equal((await page.evaluate(()=>window.sent)).at(-1),'portscan -a -t 3\n');

  b=await reveal('join');
  await b.click();
  let fields=page.locator('#actionFields input,#actionFields select');
  await fields.nth(0).fill('2');
  await fields.nth(1).fill('clave con espacio');
  await page.click('#runAction');
  assert.equal((await page.evaluate(()=>window.sent)).at(-1),'join -a 2 -p "clave con espacio"\n');

  b=await reveal('brightness');
  await b.click();
  await page.locator('#actionFields input').fill('10');
  previous=await page.evaluate(()=>window.sent.length);
  await page.click('#runAction');
  assert.equal(await page.evaluate(()=>window.sent.length),previous);
  await page.locator('#actionFields input').fill('7');
  await page.click('#runAction');
  assert.equal((await page.evaluate(()=>window.sent)).at(-1),'brightness -s 7\n');

  await page.evaluate(()=>{window.feedBytes([195]);window.feedBytes([177]);window.feed('<img src=x onerror=alert(1)>\n')});
  await page.waitForFunction(()=>document.querySelector('#terminal').textContent.includes('ñ<img'));
  assert.equal(await page.locator('#terminal img').count(),0);

  await page.selectOption('#eol','crlf');
  await page.fill('#command','info');
  await page.click('#send');
  assert.equal((await page.evaluate(()=>window.sent)).at(-1),'info\r\n');
  const count=await page.evaluate(()=>window.sent.length);
  await page.evaluate(()=>{document.querySelector('#command').value='info\x01';document.querySelector('#cli').requestSubmit()});
  await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('sola línea'));
  assert.equal(await page.evaluate(()=>window.sent.length),count);

  await page.click('#stop');
  assert.equal((await page.evaluate(()=>window.sent)).at(-1),'stopscan\r\n');

  await page.click('#connect');
  await page.waitForFunction(()=>window.closeCount===1);
  assert(await page.locator('#send').isDisabled());
  await page.click('#connect');
  await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Conectado');
  await page.evaluate(()=>window.unplug());
  await page.waitForFunction(()=>document.querySelector('#stateText').textContent==='Desconectado');

  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const stopBox=await page.locator('#stop').boundingBox();
  assert(stopBox.y>=0&&stopBox.y+stopBox.height<=844);
  assert.deepEqual(errors,[]);
  console.log('PASS: device menu parity, aliases, parameter validation, Web Serial, UTF-8/XSS, LF/CRLF, filter, reconnect and responsive stop button.');
 }finally{
  if(browser)await browser.close();
  server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
