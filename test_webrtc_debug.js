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
    const hostPage = await browser.newPage();
    hostPage.on('console', msg => console.log('[Host Log]', msg.text()));
    
    const roomCode = 'SS' + Math.floor(Math.random() * 1000);
    await hostPage.goto(`http://localhost:5173/lobby/${roomCode}?name=Host`);
    await hostPage.waitForSelector('h3', { timeout: 5000 });

    const playerPages = [];
    for(let i=1; i<=2; i++) { // just 2 players for testing why they don't join
        const pPage = await browser.newPage();
        pPage.on('console', msg => console.log(`[Player ${i} Log]`, msg.text()));
        await pPage.goto(`http://localhost:5173/play?room=${roomCode}&name=Player${i}`);
        playerPages.push(pPage);
    }
    
    await new Promise(r => setTimeout(r, 5000));
    console.log('Host URL:', hostPage.url());

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
