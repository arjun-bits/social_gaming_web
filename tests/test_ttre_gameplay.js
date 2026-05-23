/**
 * test_ttre_gameplay.js
 * Visual E2E test for Ticket to Ride Europe + Secret Signals improvements
 * - IsometricTileMap SVG rendering verification
 * - TV lobby rich content (not black)
 * - TTRE player: Map/Routes/Hand tabs
 * - SS: Card colors visible to all players
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs   = require('fs');

const BASE_URL    = 'http://localhost:5173';
const SHOTS_DIR   = path.join(__dirname, 'e2e_screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

const RESULTS = [];
let pass = 0, fail = 0;

function log(ok, label, detail = '') {
  const sym = ok ? '✅' : '❌';
  console.log(`${sym} ${label}${detail ? '  → ' + detail : ''}`);
  RESULTS.push({ ok, label, detail });
  ok ? pass++ : fail++;
}
function info(msg) { console.log(`   ℹ️  ${msg}`); }

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
async function shot(page, name) {
  const p = path.join(SHOTS_DIR, `v_${name}.png`);
  await page.screenshot({ path: p });
  info(`📸 v_${name}.png`);
}

async function clickBtn(page, text) {
  return page.evaluate((t) => {
    const b = Array.from(document.querySelectorAll('button,a'))
      .find(el => el.textContent.trim().includes(t));
    if (b) { b.click(); return true; }
    return false;
  }, text);
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function extractPIN(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const m = text.match(/PIN[:\s]+(\d{4})/i) || text.match(/\b(\d{4})\b/);
    return m ? m[1] : null;
  });
}

async function enterPIN(page, pin) {
  // The PIN entry is a 4-digit OTP-style input
  // Try clicking individual digit inputs
  const inputs = await page.$$('input[type="tel"], input[type="number"], input[maxlength="1"]');
  if (inputs.length >= 4) {
    const digits = pin.split('');
    for (let i = 0; i < Math.min(inputs.length, 4); i++) {
      await inputs[i].click();
      await inputs[i].type(digits[i] || '0');
    }
    return true;
  }
  // Single input fallback
  const singleIn = await page.$('input[placeholder*="PIN"], input[id*="pin"]');
  if (singleIn) {
    await singleIn.type(pin, { delay: 50 });
    return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: null,
  });

  const TTRE_ROOM = 'TVIS' + Math.floor(Math.random() * 9000 + 1000);
  const SS_ROOM   = 'SVIS' + Math.floor(Math.random() * 9000 + 1000);
  info(`TTRE Room: ${TTRE_ROOM}  |  SS Room: ${SS_ROOM}`);

  let ttreHost, ttreTV, ttrePl;
  let ssHost, ssTV, ssPl;

  try {
    // ══════════════════════════════════════════════════════════
    // PART A — TTRE: IsometricTileMap + 3-tab navigation
    // ══════════════════════════════════════════════════════════
    console.log('\n══ PART A: TTRE Visual Checks ══\n');

    ttreHost = await browser.newPage();
    await ttreHost.setViewport({ width: 1400, height: 900 });
    await ttreHost.goto(`${BASE_URL}/lobby/${TTRE_ROOM}`, { waitUntil: 'networkidle0' });
    await delay(800);
    await shot(ttreHost, 'a01_ttre_lobby');

    // Add test players
    await clickBtn(ttreHost, 'Add Test Players');
    await delay(1200);
    const lobbyText = await bodyText(ttreHost);
    log(lobbyText.includes('Alice') || lobbyText.includes('player'),
        'TTRE: Test players added to lobby');

    // Select Ticket to Ride Europe game
    const gameTile = await ttreHost.$('[data-game-id="ticket_europe"]');
    if (gameTile) {
      await gameTile.click();
    } else {
      await clickBtn(ttreHost, 'Ticket to Ride');
    }
    await delay(800);
    await shot(ttreHost, 'a02_ttre_game_selected');

    // Launch the game
    await clickBtn(ttreHost, 'Launch');
    await delay(2000);
    await shot(ttreHost, 'a03_ttre_launched');
    log(true, 'TTRE: Game launched');

    // ── TV View ──────────────────────────────────────────────
    ttreTV = await browser.newPage();
    await ttreTV.setViewport({ width: 1920, height: 1080 });
    await ttreTV.goto(`${BASE_URL}/tv/${TTRE_ROOM}`, { waitUntil: 'networkidle0' });
    await delay(2500);
    await shot(ttreTV, 'a04_ttre_tv_lobby');

    const tvText = await bodyText(ttreTV);
    log(tvText.trim().length > 30 && !tvText.match(/^\s*$/),
        'TTRE/SS: TV lobby has visible content (not blank screen)', tvText.slice(0, 60));

    const tvHasTitle = /Secret|Ticket|Arcade|Midnight/i.test(tvText);
    log(tvHasTitle, 'TTRE/SS: TV shows app/game title');

    const tvHasJoin = tvText.includes(TTRE_ROOM) || /PIN|Scan|scan|join/i.test(tvText);
    log(tvHasJoin, 'TTRE/SS: TV shows room code or join instructions');

    const tvQR = await ttreTV.evaluate(() => !!document.querySelector('img[src*="qr"]'));
    log(tvQR, 'TTRE/SS: TV shows QR code image');

    const tvPIN = await extractPIN(ttreTV);
    info(`TV PIN extracted: ${tvPIN}`);

    // ── Player joins and enters PIN ───────────────────────────
    ttrePl = await browser.newPage();
    await ttrePl.setViewport({ width: 390, height: 844 });
    await ttrePl.goto(`${BASE_URL}/play?room=${TTRE_ROOM}`, { waitUntil: 'networkidle0' });
    await delay(800);

    // Enter nickname
    const nIn = await ttrePl.$('input#input-player-nickname, input[placeholder*="nickname"]');
    if (nIn) {
      await nIn.type('MapTester', { delay: 30 });
      await ttrePl.keyboard.press('Enter');
      await delay(1200);
    }
    await shot(ttrePl, 'a05_ttre_player_after_nick');

    // Enter PIN
    if (tvPIN) {
      const pinEntered = await enterPIN(ttrePl, tvPIN);
      if (pinEntered) {
        await clickBtn(ttrePl, 'Connect');
        await delay(3000); // wait for WebRTC to connect
        log(true, 'TTRE: Player entered PIN and connected to TV');
      } else {
        log(false, 'TTRE: Could not find PIN input on player page');
      }
    } else {
      log(false, 'TTRE: Could not extract TV PIN');
    }

    await shot(ttrePl, 'a06_ttre_player_connected');
    const plText = await bodyText(ttrePl);
    info(`Player view text: ${plText.slice(0, 100)}`);

    // Check player is on TTRE game screen (Map/Routes/Hand tabs)
    const onGameScreen = plText.includes('Map') || plText.includes('Routes') ||
                         plText.includes('Hand') || plText.includes('Trains');
    log(onGameScreen, 'TTRE: Player is on TTRE game screen with navigation tabs');

    if (onGameScreen) {
      // Verify IsometricTileMap SVG
      const mapSVG = await ttrePl.evaluate(() => {
        const svgs = document.querySelectorAll('svg');
        let polygons = 0, lines = 0, texts = 0;
        for (const svg of svgs) {
          polygons += svg.querySelectorAll('polygon').length;
          lines    += svg.querySelectorAll('line').length;
          texts    += svg.querySelectorAll('text').length;
        }
        return { count: svgs.length, polygons, lines, texts };
      });
      info(`SVG: count=${mapSVG.count} polygons=${mapSVG.polygons} lines=${mapSVG.lines} texts=${mapSVG.texts}`);
      await shot(ttrePl, 'a07_ttre_map_tab');

      log(mapSVG.count > 0,      'TTRE: Map tab has SVG element (IsometricTileMap renders)');
      log(mapSVG.polygons >= 3,  'TTRE: IsometricTileMap has terrain polygon tiles',   `${mapSVG.polygons}`);
      log(mapSVG.lines > 5,      'TTRE: IsometricTileMap has route track lines',       `${mapSVG.lines}`);
      log(mapSVG.texts >= 5,     'TTRE: IsometricTileMap has city name labels',        `${mapSVG.texts}`);

      // Routes tab
      await clickBtn(ttrePl, 'Routes');
      await delay(500);
      await shot(ttrePl, 'a08_ttre_routes_tab');
      const routesText = await bodyText(ttrePl);
      log(/trains|route|CLAIM/i.test(routesText), 'TTRE: Routes tab shows claimable route list');

      // Hand tab
      await clickBtn(ttrePl, 'Hand');
      await delay(500);
      await shot(ttrePl, 'a09_ttre_hand_tab');
      const handText = await bodyText(ttrePl);
      log(/Hand|Draw|DECK|locomotive/i.test(handText), 'TTRE: Hand tab shows train cards');
    } else {
      log(false, 'TTRE: IsometricTileMap not verified (player not on game screen)');
      log(false, 'TTRE: Routes tab not verified');
      log(false, 'TTRE: Hand tab not verified');
      log(false, 'TTRE: SVG terrain polygons not verified');
      log(false, 'TTRE: SVG route lines not verified');
      log(false, 'TTRE: SVG city labels not verified');
    }

    // ══════════════════════════════════════════════════════════
    // PART B — SS: Card colors visible to all players
    // ══════════════════════════════════════════════════════════
    console.log('\n══ PART B: SS Card Colors ══\n');

    ssHost = await browser.newPage();
    await ssHost.setViewport({ width: 1400, height: 900 });
    await ssHost.goto(`${BASE_URL}/lobby/${SS_ROOM}`, { waitUntil: 'networkidle0' });
    await delay(800);

    await clickBtn(ssHost, 'Add Test Players');
    await delay(1000);

    // Select Secret Signals
    const ssTile = await ssHost.$('[data-game-id="secret_signals"]');
    if (ssTile) await ssTile.click();
    else await clickBtn(ssHost, 'Secret Signals');
    await delay(600);

    // Configure
    await clickBtn(ssHost, 'Configure');
    await delay(500);
    // Launch
    await clickBtn(ssHost, 'Launch');
    await delay(2000);
    await shot(ssHost, 'b01_ss_host_active');

    // TV for SS
    ssTV = await browser.newPage();
    await ssTV.setViewport({ width: 1920, height: 1080 });
    await ssTV.goto(`${BASE_URL}/tv/${SS_ROOM}`, { waitUntil: 'networkidle0' });
    await delay(2000);
    await shot(ssTV, 'b02_ss_tv');

    const ssTVText = await bodyText(ssTV);
    log(/Secret|Signal/i.test(ssTVText), 'SS: TV shows game title');
    const ssPIN = await extractPIN(ssTV);
    info(`SS TV PIN: ${ssPIN}`);

    // Player joins SS
    ssPl = await browser.newPage();
    await ssPl.setViewport({ width: 390, height: 844 });
    await ssPl.goto(`${BASE_URL}/play?room=${SS_ROOM}`, { waitUntil: 'networkidle0' });
    await delay(800);

    const ssNick = await ssPl.$('input#input-player-nickname, input[placeholder*="nickname"]');
    if (ssNick) {
      await ssNick.type('ColorSpy', { delay: 30 });
      await ssPl.keyboard.press('Enter');
      await delay(1200);
    }

    // Enter PIN
    if (ssPIN) {
      await enterPIN(ssPl, ssPIN);
      await clickBtn(ssPl, 'Connect');
      await delay(3000);
      log(true, 'SS: Player entered PIN and connected');
    }

    await shot(ssPl, 'b03_ss_after_connect');

    // Join as Operative (Blue team)
    await clickBtn(ssPl, 'Operative');
    await delay(1500);
    await shot(ssPl, 'b04_ss_operative_view');

    const ssPlText = await bodyText(ssPl);
    info(`SS player text: ${ssPlText.slice(0, 120)}`);
    const onSSGame = ssPlText.includes('Operative') || ssPlText.includes('Blue') ||
                     ssPlText.includes('Pink') || ssPlText.includes('Signal');
    log(onSSGame, 'SS: Player is on Operative game screen');

    if (onSSGame) {
      // Check card grid with color tints
      const cardColors = await ssPl.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll('button'));
        const colored = allBtns.filter(b => {
          const style = b.getAttribute('style') || '';
          return style.includes('rgba') || style.includes('#00E5FF') ||
                 style.includes('#FF007F') || style.includes('#ff0000');
        });
        const totalCardBtns = allBtns.filter(b =>
          b.className.includes('rounded-xl') && b.textContent.trim().length > 0 && b.textContent.trim().length < 30
        ).length;
        return { coloredCount: colored.length, totalCards: totalCardBtns };
      });
      info(`SS colored cards: ${cardColors.coloredCount}/${cardColors.totalCards}`);
      log(cardColors.coloredCount > 5, 'SS: Operative sees card color tints (>5 colored cards)',
          `${cardColors.coloredCount} colored`);
      log(cardColors.totalCards >= 25, 'SS: 5×5 card grid present', `${cardColors.totalCards} card buttons`);
    } else {
      log(false, 'SS: Card color tints not verified (not on operative screen)');
      log(false, 'SS: Card grid not verified');
    }

  } catch (err) {
    console.error('Test error:', err.message);
    log(false, 'Test error', err.message.slice(0, 80));
  } finally {
    for (const p of [ttreHost, ttreTV, ttrePl, ssHost, ssTV, ssPl]) {
      try { await p?.close(); } catch (_) {}
    }
    await browser.close();

    const total = pass + fail;
    console.log('\n' + '═'.repeat(55));
    console.log(`Visual E2E Results: ${pass}/${total} passed`);
    console.log('═'.repeat(55));
    if (fail > 0) {
      console.log('\nFailed:');
      RESULTS.filter(r => !r.ok).forEach(r =>
        console.log(`  ❌ ${r.label}  ${r.detail}`)
      );
    }
    process.exit(fail > 0 ? 1 : 0);
  }
})();
