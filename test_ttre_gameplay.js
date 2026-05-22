const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: "new"
  });

  const issues = [];
  
  try {
    const hostPage = await browser.newPage();
    hostPage.on('pageerror', err => issues.push(`[Host] Page Error: ${err.toString()}`));
    
    console.log('[TTRE Test] Creating room as Host...');
    const roomCode = 'TTRE' + Math.floor(Math.random() * 1000);
    await hostPage.goto(`http://localhost:5173/lobby/${roomCode}?name=Host`);
    await hostPage.waitForSelector('h3', { timeout: 5000 });

    console.log('[TTRE Test] Spawning 2 players...');
    const playerPages = [];
    for(let i=1; i<=2; i++) {
        const pPage = await browser.newPage();
        pPage.on('pageerror', err => issues.push(`[Player ${i}] Page Error: ${err.toString()}`));
        await pPage.goto(`http://localhost:5173/play?room=${roomCode}&name=Player${i}`);
        playerPages.push(pPage);
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('[TTRE Test] Selecting TTRE...');
    await hostPage.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll('h4'));
        const target = h4s.find(el => el.textContent.includes('Ticket to Ride Europe'));
        if(target && target.closest('div.snap-start')) target.closest('div.snap-start').click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('[TTRE Test] Configuring game...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('CONFIGURE TICKET TO RIDE EUROPE'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('[TTRE Test] Launching game...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('LAUNCH TICKET TO RIDE EUROPE'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Verify host is in game
    if (!hostPage.url().includes('/host/')) issues.push('Host failed to reach game dashboard');

    console.log('[TTRE Test] Attempting gameplay...');
    // In TTRE, one of the players is the currentPlayer.
    for(let i=0; i<2; i++) {
        const pPage = playerPages[i];
        const html = await pPage.content();
        
        // Wait for some TTRE elements to render
        try {
            await pPage.waitForSelector('h2', {timeout: 3000});
        } catch(e) {}

        const newHtml = await pPage.content();
        if(newHtml.includes('Your Hand')) {
            console.log(`[TTRE Test] Player ${i+1} successfully loaded PlayerView hand`);
            
            // Draw a card
            try {
                await pPage.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const deckBtn = buttons.find(b => b.textContent.includes('Draw from Deck'));
                    if(deckBtn) deckBtn.click();
                });
            } catch(e) {
                issues.push(`Failed to click draw card for player ${i+1}: ${e.message}`);
            }
        } else {
            issues.push(`Player ${i+1} did not load TTRE interface properly. HTML preview: ${newHtml.substring(0, 200)}`);
        }
    }
    
    await new Promise(r => setTimeout(r, 2000));

  } catch (error) {
    issues.push(`Script exception: ${error.message}`);
  } finally {
    console.log('\\n--- TTRE ISSUES ---');
    if (issues.length === 0) console.log('None found in basic flow.');
    else issues.forEach(i => console.log('- ' + i));
    console.log('-------------------\\n');
    await browser.close();
  }
})();
