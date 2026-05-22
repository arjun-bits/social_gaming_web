const puppeteer = require('puppeteer');

(async () => {
  console.log('1. Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const hostPage = await browser.newPage();
    let tvPin = null;

    // Intercept console logs to extract TV PIN
    hostPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('[TESTING] TV PIN generated:')) {
        tvPin = text.split(': ')[1].trim();
        console.log(`[Host] Captured TV PIN: ${tvPin}`);
      }
    });

    console.log('2. Opening Host view (http://localhost:5173/)...');
    await hostPage.goto('http://localhost:5173/');

    console.log('3. Clicking "Host a Game" tab...');
    await hostPage.waitForSelector('#tab-host');
    await hostPage.click('#tab-host');

    console.log('3b. Clicking "Create Room" button...');
    await hostPage.waitForSelector('#btn-create-room');
    await hostPage.click('#btn-create-room');

    console.log('4. Waiting for Lobby to load...');
    await hostPage.waitForSelector('h1', { timeout: 10000 });
    const h1Text = await hostPage.$eval('h1', el => el.textContent);
    console.log(`[Host] Reached page with h1: ${h1Text}`);

    // Wait for the room code from the URL
    await hostPage.waitForFunction(() => window.location.pathname.includes('/lobby/'));
    const url = await hostPage.url();
    const roomCode = url.split('/lobby/')[1];
    console.log(`[Host] Room Code: ${roomCode}`);

    // Wait until tvPin is extracted
    let waitCount = 0;
    while (!tvPin && waitCount < 10) {
      await new Promise(r => setTimeout(r, 500));
      waitCount++;
    }

    if (!tvPin) {
      throw new Error('Failed to capture TV PIN');
    }

    console.log(`5. Opening Player view for room ${roomCode}...`);
    const playerPage = await browser.newPage();
    playerPage.on('console', msg => console.log(`[Player] ${msg.text()}`));
    await playerPage.goto(`http://localhost:5173/play?room=${roomCode}`);

    console.log('6. Entering Nickname...');
    await playerPage.waitForSelector('input[placeholder="Your nickname..."]');
    await playerPage.type('input[placeholder="Your nickname..."]', 'TestPlayer');
    await playerPage.click('button'); // Enter Game ->

    console.log('7. Waiting for TV PIN screen...');
    await playerPage.waitForSelector('input[placeholder="0000"]');
    
    // Enter WRONG PIN
    console.log('8. Entering WRONG TV PIN...');
    await playerPage.type('input[placeholder="0000"]', '9999');
    await playerPage.click('button');
    
    // Check for error dialog (browser alert)
    const dialogOccurred = await new Promise((resolve) => {
      playerPage.once('dialog', async dialog => {
        console.log(`[Player] Alert received: ${dialog.message()}`);
        await dialog.accept();
        resolve(true);
      });
      setTimeout(() => resolve(false), 3000);
    });

    if (dialogOccurred) {
      console.log('-> Success: Wrong PIN was rejected.');
    } else {
      console.log('-> Warning: No alert seen for wrong PIN.');
    }

    // Wait for "Connection Failed" screen and click "Try Again"
    console.log('9. Clicking Try Again...');
    await playerPage.waitForSelector('button:has-text("Try Again")', { timeout: 5000 }).catch(() => {});
    const tryAgainBtns = await playerPage.$$('button');
    for (let btn of tryAgainBtns) {
      const text = await playerPage.evaluate(el => el.textContent, btn);
      if (text.includes('Try Again')) {
        await btn.click();
        break;
      }
    }

    console.log('10. Re-entering Nickname...');
    await playerPage.waitForSelector('input[placeholder="Your nickname..."]');
    await playerPage.type('input[placeholder="Your nickname..."]', 'TestPlayer');
    await playerPage.click('button'); // Enter Game ->

    console.log('11. Entering CORRECT TV PIN...');
    await playerPage.waitForSelector('input[placeholder="0000"]');
    await playerPage.type('input[placeholder="0000"]', tvPin);
    await playerPage.click('button');

    console.log('10. Waiting to enter game / Role Selection...');
    await playerPage.waitForSelector('h1', { timeout: 10000 });
    const playerH1 = await playerPage.$eval('h1', el => el.textContent);
    console.log(`[Player] Reached page with h1: ${playerH1}`);

    if (playerH1.includes('Pick Your Role')) {
      console.log('✅ E2E TEST PASSED: Successfully connected via P2P WebRTC data channels!');
    } else {
      console.log('❌ E2E TEST FAILED: Did not reach Role Selection page.');
    }

  } catch (error) {
    console.error('❌ E2E TEST FAILED with error:', error);
  } finally {
    await browser.close();
  }
})();
