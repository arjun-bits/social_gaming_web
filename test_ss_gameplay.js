const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: "new"
  });

  try {
    const hostPage = await browser.newPage();
    hostPage.on('dialog', async dialog => {
      console.log('HOST ALERT:', dialog.message());
      await dialog.accept();
    });
    
    console.log('[SS Test] Creating room as Host...');
    const roomCode = 'SS' + Math.floor(Math.random() * 1000);
    await hostPage.goto(`http://localhost:5173/lobby/${roomCode}?name=Host`);
    await hostPage.waitForSelector('h3', { timeout: 5000 });

    console.log('[SS Test] Spawning 4 players...');
    const playerPages = [];
    for(let i=1; i<=4; i++) {
        const pPage = await browser.newPage();
        pPage.on('dialog', async dialog => await dialog.accept());
        await pPage.goto(`http://localhost:5173/play?room=${roomCode}&name=Player${i}`);
        playerPages.push(pPage);
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('[SS Test] Selecting Secret Signals...');
    await hostPage.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll('h4'));
        const target = h4s.find(el => el.textContent.includes('Secret Signals'));
        if(target && target.closest('div.snap-start')) target.closest('div.snap-start').click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('[SS Test] Configuring game...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('CONFIGURE SECRET SIGNALS'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('[SS Test] Auto-assigning teams...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('Auto-Assign Teams'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    await hostPage.screenshot({ path: '/tmp/game_test_screenshots/debug_ss_teams.png' });

    console.log('[SS Test] Launching game...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('LAUNCH SECRET SIGNALS'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    await hostPage.screenshot({ path: '/tmp/game_test_screenshots/debug_ss_host.png' });
    await playerPages[0].screenshot({ path: '/tmp/game_test_screenshots/debug_ss_player1.png' });

    console.log('Host URL:', hostPage.url());
  } finally {
    await browser.close();
  }
})();
