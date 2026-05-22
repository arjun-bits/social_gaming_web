const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const hostContext = await browser.createBrowserContext();
  const hostPage = await hostContext.newPage();
  let tvPin = null;
  hostPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('TV PIN generated:')) tvPin = text.split('TV PIN generated:')[1].trim();
  });
  const roomCode = 'TEST' + Math.floor(Math.random() * 1000);
  await hostPage.goto(`http://localhost:5173/lobby/${roomCode}?name=Host`);
  await hostPage.waitForSelector('h3', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 1000));
  
  const pContext = await browser.createBrowserContext();
  const pPage = await pContext.newPage();
  await pPage.goto(`http://localhost:5173/play?room=${roomCode}&name=Player1`);
  await new Promise(r => setTimeout(r, 1000));
  await pPage.type('input[placeholder="0000"]', tvPin);
  await pPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.textContent.includes('Connect to TV'));
      if(target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
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
  
  await hostPage.screenshot({ path: 'scratch/host_pre_start.png' });
  
  await hostPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.textContent.includes('Auto-Assign Teams'));
      if(target) target.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await hostPage.screenshot({ path: 'scratch/host_post_assign.png' });
  
  await hostPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.textContent.includes('LAUNCH SECRET SIGNALS'));
      if(target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await hostPage.screenshot({ path: 'scratch/host_post_launch.png' });
  await pPage.screenshot({ path: 'scratch/pPage_post_launch.png' });
  
  await browser.close();
})();
