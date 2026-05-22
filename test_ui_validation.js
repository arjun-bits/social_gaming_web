const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: "new"
  });
  
  try {
    const hostPage = await browser.newPage();
    console.log("[Test] Creating room as Host...");
    const randomRoom = 'TEST' + Math.floor(Math.random() * 10000);
    await hostPage.goto(`http://localhost:5173/lobby/${randomRoom}?name=Host`);
    
    // Get room code
    await hostPage.waitForSelector('p.text-\\[\\#00E5FF\\]', { timeout: 5000 });
    const roomCode = await hostPage.evaluate(() => {
      return document.querySelector('p.text-\\[\\#00E5FF\\]').textContent;
    });
    console.log("[Test] Room created:", roomCode);

    // Wait for the mock players button
    await hostPage.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Add Test Players'));
    }, { timeout: 5000 });
    
    // Add Test Players
    console.log("[Test] Adding test players...");
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Test Players'));
      if (btn) btn.click();
    });
    
    // Wait for the players to appear in UI
    await new Promise(r => setTimeout(r, 1000));
    
    // Try to click Configure
    console.log("[Test] Clicking Configure...");
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CONFIGURE'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 500));

    // Try to start game without assigning roles -> should see alert
    console.log("[Test] Clicking Launch without assigning roles...");
    
    let alertMessage = null;
    hostPage.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log(`[Test] Alert triggered: ${alertMessage}`);
      await dialog.dismiss();
    });

    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LAUNCH'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 500));
    if (!alertMessage || !alertMessage.includes('unassigned')) {
      console.error("[Test] FAILED: Expected validation alert for unassigned players, got:", alertMessage);
      process.exit(1);
    }
    alertMessage = null; // reset
    
    // Click Auto-Assign Teams
    console.log("[Test] Clicking Auto-Assign Teams...");
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Auto-Assign'));
      if (btn) btn.click();
    });
    
    // Wait for auto assign
    await new Promise(r => setTimeout(r, 1000));
    
    // Click Launch Game again
    console.log("[Test] Clicking Launch with auto-assigned roles...");
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LAUNCH'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    if (alertMessage) {
      console.error("[Test] FAILED: Validation failed after auto-assign:", alertMessage);
      process.exit(1);
    }
    
    console.log("[Test] SUCCESS: Game launched successfully after auto-assign!");
    
  } catch (err) {
    console.error("Test failed:", err);
    try {
        const pages = await browser.pages();
        if (pages.length > 0) {
            await pages[pages.length - 1].screenshot({ path: '/tmp/game_test_screenshots/error.png' });
            console.log("Screenshot saved to /tmp/game_test_screenshots/error.png");
        }
    } catch(e) {}
  } finally {
    await browser.close();
  }
})();
