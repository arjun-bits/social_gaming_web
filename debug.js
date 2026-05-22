const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:5173/');
    await new Promise(r => setTimeout(r, 2000));
    const content = await page.content();
    if (content.includes('button')) {
      console.log('Button found!');
    } else {
      console.log('No button found. Body:', await page.$eval('body', el => el.innerHTML));
    }
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
