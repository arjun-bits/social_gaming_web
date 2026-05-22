const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: "new"
  });
  
  let hostPage;
  try {
    hostPage = await browser.newPage();
    
    console.log('[Test] Creating room as Host...');
    const randomRoom = 'TTRE' + Math.floor(Math.random() * 10000);
    await hostPage.goto(`http://localhost:5173/lobby/${randomRoom}?name=Host`);
    
    // Wait for the h3 tag containing "Secret Signals"
    await hostPage.waitForSelector('h3', { timeout: 5000 });
    console.log('[Test] Selecting Ticket to Ride Europe...');
    
    // Click on TTRE game card (it uses snap-start in LobbyPage)
    await hostPage.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll('h4'));
        const target = h4s.find(el => el.textContent.includes('Ticket to Ride Europe'));
        if(target && target.closest('div.snap-start')) {
            target.closest('div.snap-start').click();
        } else {
            console.error('Could not find snap-start div for TTRE');
        }
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('[Test] Adding test players...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('Add Test Players'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Take screenshot after adding test players to verify they are in the list
    await hostPage.screenshot({ path: '/tmp/game_test_screenshots/ttre_lobby_players.png' });
    console.log('[Test] Saved screenshot of lobby with test players.');
    
    console.log('[Test] Clicking Configure...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('CONFIGURE TICKET TO RIDE EUROPE'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Take screenshot after configuring
    await hostPage.screenshot({ path: '/tmp/game_test_screenshots/ttre_configure.png' });
    console.log('[Test] Saved screenshot of configure screen.');

    console.log('[Test] Clicking Launch...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('LAUNCH TICKET TO RIDE EUROPE'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const url = hostPage.url();
    if (url.includes('/host/')) {
        console.log('[Test] SUCCESS: Game launched successfully!');
        await hostPage.screenshot({ path: '/tmp/game_test_screenshots/ttre_launched.png' });
        console.log('[Test] Saved screenshot of launched game.');
    } else {
        throw new Error('Failed to launch game. Current URL: ' + url);
    }
  } catch (error) {
    console.error('Test failed:', error);
    if (hostPage) {
        await hostPage.screenshot({ path: '/tmp/game_test_screenshots/error_ttre.png' }).catch(() => {});
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
