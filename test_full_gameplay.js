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

  const issues = [];
  
  try {
    const hostContext = await browser.createBrowserContext();
    const hostPage = await hostContext.newPage();
    
    let tvPin = null;
    hostPage.on('dialog', async dialog => {
        console.log(`[Host Alert] ${dialog.message()}`);
        await dialog.dismiss();
    });
    hostPage.on('console', msg => {
        const text = msg.text();
        if (text.includes('TV PIN generated:')) {
            tvPin = text.split('TV PIN generated:')[1].trim();
        }
    });
    
    console.log('[Test] Creating room as Host...');
    const roomCode = 'FULL' + Math.floor(Math.random() * 1000);
    hostPage.on('console', msg => console.log(`[Host Console] ${msg.text()}`));
    await hostPage.goto(`http://localhost:5173/lobby/${roomCode}?name=Host`);
    await hostPage.waitForSelector('h3', { timeout: 5000 });

    // Wait for the pin to be extracted from console log
    await new Promise(r => setTimeout(r, 1000));
    if (!tvPin) throw new Error("Could not extract TV PIN from Host");
    console.log(`[Test] TV PIN is ${tvPin}`);

    console.log('[Test] Spawning 4 players...');
    const playerPages = [];
    for(let i=1; i<=4; i++) {
        const pContext = await browser.createBrowserContext();
        const pPage = await pContext.newPage();
        await pPage.goto(`http://localhost:5173/play?room=${roomCode}&name=Player${i}`);
        
        await new Promise(r => setTimeout(r, 1000)); // WAIT FOR WS TO CONNECT!
        
        await pPage.waitForSelector('input[placeholder="0000"]');
        await pPage.type('input[placeholder="0000"]', tvPin);
        
        await pPage.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const target = buttons.find(b => b.textContent.includes('Connect to TV'));
            if(target) target.click();
        });
        
        playerPages.push(pPage);
    }
    
    await new Promise(r => setTimeout(r, 4000));
    console.log('[Test] Players should be connected now.');
    
    // SECRET SIGNALS TEST
    console.log('[Test] Selecting Secret Signals...');
    await hostPage.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll('h4'));
        const target = h4s.find(el => el.textContent.includes('Secret Signals'));
        if(target && target.closest('div.snap-start')) target.closest('div.snap-start').click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('CONFIGURE SECRET SIGNALS'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('Auto-Assign Teams'));
        if(target) {
            console.log("Found Auto-Assign Teams button, clicking");
            target.click();
        } else {
            console.log("Could NOT find Auto-Assign Teams button");
        }
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('LAUNCH SECRET SIGNALS'));
        if(target) {
            console.log(`Found LAUNCH SECRET SIGNALS button, disabled=${target.disabled}`);
            target.click();
        } else {
            console.log("Could NOT find LAUNCH SECRET SIGNALS button");
        }
    });
    await new Promise(r => setTimeout(r, 2000));
    await new Promise(r => setTimeout(r, 2000));

    if (!hostPage.url().includes('/host/')) {
        issues.push(`Secret Signals: Host failed to reach game dashboard. URL: ${hostPage.url()}`);
        await hostPage.screenshot({ path: 'C:/Users/arjun/.gemini/antigravity-ide/brain/164cafb8-7e35-40c4-a163-5e1d34a0f5e9/scratch/error_host_ss.png' });
    }
    for(let i=0; i<4; i++) {
        const pPage = playerPages[i];
        const html = await pPage.content();
        if (html.includes('Provide a 1-word clue') || html.includes('Waiting for') || html.includes('Operative') || html.includes('Spymaster')) {
            console.log(`[Test] Player ${i+1} successfully loaded Secret Signals`);
            // Find Spymaster
            if (html.includes('Provide a 1-word clue')) {
                try {
                    await pPage.type('input[type="text"]', 'APPLE');
                    await pPage.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const b = buttons.find(btn => btn.textContent.includes('Submit'));
                        if(b) b.click();
                    });
                    console.log(`[Test] Player ${i+1} submitted clue 'APPLE'`);
                } catch(e) {
                    issues.push(`Secret Signals: Spymaster failed to submit clue - ${e.message}`);
                }
            }
        } else {
            issues.push(`Secret Signals: Player ${i+1} failed to load interface. HTML preview: ${html.substring(0, 100)}`);
        }
    }
    
    await new Promise(r => setTimeout(r, 2000));

    // CHECK IF OPERATIVES SEE THE CLUE
    for(let i=0; i<4; i++) {
        const pPage = playerPages[i];
        const html = await pPage.content();
        if (html.includes('APPLE')) {
            console.log(`[Test] Player ${i+1} successfully saw the clue 'APPLE'`);
        }
    }

    // TTRE TEST
    console.log('\n[Test] Testing TTRE...');
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const xBtn = buttons.find(b => b.textContent.includes('✕'));
        if(xBtn) xBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const endBtn = buttons.find(b => b.textContent.includes('End & Reset'));
        if(endBtn) endBtn.click();
    });
    await hostPage.waitForSelector('h3', { timeout: 5000 });
    
    await hostPage.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll('h4'));
        const target = h4s.find(el => el.textContent.includes('Ticket to Ride Europe'));
        if(target && target.closest('div.snap-start')) target.closest('div.snap-start').click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('CONFIGURE TICKET TO RIDE EUROPE'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent.includes('LAUNCH TICKET TO RIDE EUROPE'));
        if(target) target.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    if (!hostPage.url().includes('/host/')) issues.push('TTRE: Host failed to reach game dashboard');

    for(let i=0; i<4; i++) {
        const pPage = playerPages[i];
        const html = await pPage.content();
        if (html.includes('Your Hand')) {
            console.log(`[Test] Player ${i+1} successfully loaded TTRE interface`);
            try {
                await pPage.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const deckBtn = buttons.find(b => b.textContent.includes('Draw from Deck'));
                    if(deckBtn) deckBtn.click();
                });
                console.log(`[Test] Player ${i+1} clicked Draw from Deck`);
            } catch(e) {}
        } else {
            issues.push(`TTRE: Player ${i+1} failed to load TTRE interface.`);
        }
    }

  } catch (error) {
    issues.push(`Script exception: ${error.message}`);
  } finally {
    console.log('\\n--- GAMEPLAY ISSUES FOUND ---');
    if (issues.length === 0) console.log('None found in automated tests.');
    else issues.forEach(i => console.log('- ' + i));
    console.log('-----------------------------\\n');
    await browser.close();
  }
})();
