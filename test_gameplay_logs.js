const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-gpu',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ],
    headless: "new"
  });

  try {
    const hostContext = await browser.createBrowserContext();
    const hostPage = await hostContext.newPage();
    
    let tvPin = null;
    hostPage.on('console', msg => {
        const text = msg.text();
        console.log('[HOST LOG]', text);
        if (text.includes('TV PIN generated:')) {
            tvPin = text.split('TV PIN generated:')[1].trim();
        }
    });
    
    console.log('[Test] Creating room as Host...');
    const roomCode = 'LOGS' + Math.floor(Math.random() * 1000);
    await hostPage.goto(`http://localhost:5173/lobby/${roomCode}?name=Host`);
    await hostPage.waitForSelector('h3', { timeout: 5000 });

    if (!tvPin) throw new Error("Could not extract TV PIN from Host");
    console.log(`[Test] TV PIN is ${tvPin}`);

    const pContext = await browser.createBrowserContext();
    const pPage = await pContext.newPage();
    pPage.on('console', msg => console.log('[P1 LOG]', msg.text()));
    pPage.on('dialog', async dialog => {
        console.log('[P1 DIALOG]', dialog.message());
        await dialog.accept();
    });

    await pPage.goto(`http://localhost:5173/play?room=${roomCode}&name=Player1`);
    
    await pPage.waitForSelector('input[placeholder="0000"]');
    await pPage.type('input[placeholder="0000"]', tvPin);
    
    await pPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('Connect to TV'));
        if(target) target.click();
    });
    
    await new Promise(r => setTimeout(r, 4000));
    console.log('[Test] Finished.');
  } finally {
    await browser.close();
  }
})();
