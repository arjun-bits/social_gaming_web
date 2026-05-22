const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: 'new'
  });

  const hostPage = await browser.newPage();
  hostPage.on('console', msg => console.log('[Host]', msg.text()));
  
  await hostPage.goto('http://localhost:5173/');
  await hostPage.waitForSelector('#tab-host');
  await hostPage.click('#tab-host');
  await hostPage.waitForSelector('#btn-create-room');
  await hostPage.click('#btn-create-room');
  await hostPage.waitForSelector('h1');
  
  const roomUrl = await hostPage.evaluate(() => window.location.href);
  const roomCode = roomUrl.split('/').pop();
  console.log('[Test] Room code is', roomCode);

  const tvPage = await browser.newPage();
  tvPage.on('console', msg => console.log('[TV]', msg.text()));
  
  await tvPage.goto('http://localhost:5173/tv/' + roomCode);
  
  console.log('[Test] Waiting for TV to load...');
  await new Promise(r => setTimeout(r, 5000));
  
  const text = await tvPage.evaluate(() => document.body.innerText);
  console.log('[TV Body]', text);
  
  await browser.close();
})();
