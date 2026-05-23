/**
 * Comprehensive E2E Gameplay Test
 * Tests both Secret Signals and Ticket to Ride Europe
 * Spawns real browser windows as players, captures screenshots, logs all issues
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'e2e_screenshots');
const BASE_URL = 'http://localhost:5173';
const ISSUES = [];
const NOTES = [];

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function log(msg) { console.log(`[E2E] ${msg}`); }
function issue(msg) { 
  console.error(`[ISSUE] ${msg}`); 
  ISSUES.push(msg); 
}
function note(msg) { 
  console.log(`[NOTE] ${msg}`); 
  NOTES.push(msg); 
}

async function screenshot(page, name) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  log(`Screenshot: ${name}.png`);
  return p;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function clickButton(page, text, required = false) {
  const found = await page.evaluate((txt) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.textContent.trim().includes(txt));
    if (b) { b.click(); return true; }
    return false;
  }, text);
  if (!found && required) issue(`Button "${text}" not found`);
  return found;
}

async function getVisibleText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function waitForText(page, text, timeout = 5000) {
  try {
    await page.waitForFunction(
      (txt) => document.body.innerText.includes(txt),
      { timeout },
      text
    );
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// MAIN TEST
// ============================================================
(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    // ── PHASE 1: SECRET SIGNALS ────────────────────────────────
    log('═══════════════════════════════════');
    log('PHASE 1: SECRET SIGNALS');
    log('═══════════════════════════════════');
    
    const ssRoomCode = 'SS' + Math.floor(Math.random() * 9000 + 1000);
    log(`Room code: ${ssRoomCode}`);

    // Host opens lobby
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1280, height: 800 });
    hostPage.on('console', msg => {
      const t = msg.text();
      if (t.includes('[') || t.includes('Error')) log(`[Host Console] ${t}`);
    });
    hostPage.on('pageerror', e => issue(`Host JS error: ${e.message}`));
    hostPage.on('dialog', async d => {
      note(`Host alert: "${d.message()}"`);
      await d.accept();
    });

    log('Opening lobby...');
    await hostPage.goto(`${BASE_URL}/lobby/${ssRoomCode}`);
    await sleep(2000);
    await screenshot(hostPage, '01_ss_lobby_empty');

    // Check lobby loaded
    const lobbyText = await getVisibleText(hostPage);
    if (!lobbyText.includes('Game Lobby') && !lobbyText.includes('PartyHub')) {
      issue('Lobby page did not load correctly');
    } else {
      note('Lobby page loaded OK');
    }
    if (!lobbyText.includes('Add Test Players')) {
      issue('Missing "Add Test Players" button in lobby');
    }

    // Add test players (mock players - no P2P needed)
    log('Adding test players via "Add Test Players" button...');
    const addedPlayers = await clickButton(hostPage, '+ Add Test Players', true);
    await sleep(1500);
    await screenshot(hostPage, '02_ss_lobby_with_players');

    const lobbyWithPlayers = await getVisibleText(hostPage);
    if (lobbyWithPlayers.includes('Alice') || lobbyWithPlayers.includes('Bob')) {
      note('Test players added successfully (Alice, Bob, Charlie, Diana visible)');
    } else {
      issue('Test players were not added - player list still empty');
    }

    // Spawn real player browsers too (for P2P flow - they won't connect without TV PIN but we test the UI)
    log('Spawning 4 real player browser windows...');
    const playerPages = [];
    for (let i = 1; i <= 4; i++) {
      const p = await browser.newPage();
      await p.setViewport({ width: 390, height: 844 }); // mobile viewport
      p.on('pageerror', e => issue(`Player${i} JS error: ${e.message}`));
      p.on('dialog', async d => { await d.accept(); });
      await p.goto(`${BASE_URL}/play?room=${ssRoomCode}`);
      playerPages.push(p);
    }
    await sleep(2000);

    // Check player join page
    const p1Text = await getVisibleText(playerPages[0]);
    if (p1Text.includes('Join Room') || p1Text.includes('Your nickname')) {
      note('Player join screen showing correctly');
      await screenshot(playerPages[0], '03_ss_player_join_screen');
    } else {
      issue(`Player join screen not showing. Got: ${p1Text.substring(0, 100)}`);
    }

    // Player 1 types nickname
    log('Player 1 entering nickname...');
    try {
      await playerPages[0].waitForSelector('input[id="input-player-nickname"]', { timeout: 3000 });
      await playerPages[0].type('input[id="input-player-nickname"]', 'Alice');
      await screenshot(playerPages[0], '04_ss_player_nickname_typed');
      await clickButton(playerPages[0], 'Enter Game');
      await sleep(1000);
      await screenshot(playerPages[0], '05_ss_player_after_enter');
      const afterEnter = await getVisibleText(playerPages[0]);
      if (afterEnter.includes('Look at the TV') || afterEnter.includes('4-digit PIN')) {
        note('Player correctly advanced to TV PIN entry screen');
      } else {
        issue(`Player did not reach PIN screen after entering nickname. Got: ${afterEnter.substring(0, 100)}`);
      }
    } catch(e) {
      issue(`Player nickname input failed: ${e.message}`);
    }

    // Configure Secret Signals
    log('Configuring Secret Signals...');
    const configClicked = await clickButton(hostPage, 'CONFIGURE SECRET SIGNALS', false);
    if (!configClicked) {
      // Maybe needs game selection first
      await clickButton(hostPage, 'Secret Signals');
      await sleep(500);
      await clickButton(hostPage, 'CONFIGURE SECRET SIGNALS', false);
    }
    await sleep(1000);
    await screenshot(hostPage, '06_ss_configure_screen');
    
    const configText = await getVisibleText(hostPage);
    if (configText.includes('Configure Teams') || configText.includes('Auto-Assign')) {
      note('Configure screen loaded OK');
    } else {
      issue(`Configure screen not showing team UI. Got: ${configText.substring(0, 150)}`);
    }
    
    if (!configText.includes('Auto-Assign Teams')) {
      issue('Auto-Assign Teams button missing from configure screen');
    }

    // Auto assign teams
    log('Auto-assigning teams...');
    const assigned = await clickButton(hostPage, 'Auto-Assign Teams', false);
    await sleep(1000);
    await screenshot(hostPage, '07_ss_teams_assigned');

    const teamsText = await getVisibleText(hostPage);
    if (teamsText.includes('Spymaster') || (teamsText.includes('TEAM BLUE') && teamsText.includes('TEAM PINK'))) {
      note('Teams assigned and visible in configure screen');
    } else {
      issue('Teams not visible after Auto-Assign');
    }

    if (teamsText.includes('Unassigned Players (0)') || !teamsText.includes('Unassigned')) {
      note('All players assigned to teams');
    } else {
      const unassignedMatch = teamsText.match(/Unassigned Players \((\d+)\)/);
      if (unassignedMatch && parseInt(unassignedMatch[1]) > 0) {
        issue(`${unassignedMatch[1]} players still unassigned after Auto-Assign`);
      }
    }

    // Launch the game
    log('Launching Secret Signals...');
    const launched = await clickButton(hostPage, 'LAUNCH SECRET SIGNALS', false);
    await sleep(2500);
    await screenshot(hostPage, '08_ss_host_game_view');
    
    const hostGameUrl = hostPage.url();
    if (hostGameUrl.includes('/host/')) {
      note(`Host reached game dashboard: ${hostGameUrl}`);
    } else {
      issue(`Host did not navigate to /host/ after launch. URL: ${hostGameUrl}`);
      // Take screenshot to debug
      const alertText = await getVisibleText(hostPage);
      note(`Host page content after launch attempt: ${alertText.substring(0, 200)}`);
    }

    const hostGameText = await getVisibleText(hostPage);
    if (hostGameText.includes('Host Control Panel')) {
      note('Host Control Panel loaded successfully');
    } else if (hostGameText.includes('Lobby Controls')) {
      issue('Host still on Lobby Controls — game did not start');
    }

    // Check if 25-card grid is visible on host
    if (hostGameText.includes('Blue') || hostGameText.includes('Pink') || hostGameText.includes('teamA')) {
      note('Word grid appears to be loaded on host');
    } else {
      issue('No word grid visible on host after game launch');
    }

    // Check remaining count
    if (hostGameText.includes('9') && hostGameText.includes('8')) {
      note('Team remaining counts visible (9 blue, 8 pink)');
    }

    await sleep(2000);

    // Check the HostView game board
    await screenshot(hostPage, '09_ss_host_board');

    log('═══════════════════════════════════');
    log('PHASE 2: TICKET TO RIDE EUROPE');
    log('═══════════════════════════════════');

    const ttreRoomCode = 'TTRE' + Math.floor(Math.random() * 9000 + 1000);
    log(`TTRE Room code: ${ttreRoomCode}`);

    // New host page for TTRE
    const ttreHostPage = await browser.newPage();
    await ttreHostPage.setViewport({ width: 1280, height: 800 });
    ttreHostPage.on('console', msg => {
      const t = msg.text();
      if (t.includes('[') || t.includes('Error')) log(`[TTRE Host] ${t}`);
    });
    ttreHostPage.on('pageerror', e => issue(`TTRE Host JS error: ${e.message}`));
    ttreHostPage.on('dialog', async d => {
      note(`TTRE Host alert: "${d.message()}"`);
      await d.accept();
    });

    await ttreHostPage.goto(`${BASE_URL}/lobby/${ttreRoomCode}`);
    await sleep(2000);
    await screenshot(ttreHostPage, '10_ttre_lobby_empty');

    // Add test players
    await clickButton(ttreHostPage, '+ Add Test Players', true);
    await sleep(1500);
    await screenshot(ttreHostPage, '11_ttre_lobby_with_players');

    const ttreLobbyText = await getVisibleText(ttreHostPage);
    if (ttreLobbyText.includes('Alice') || ttreLobbyText.includes('Players joined')) {
      note('TTRE: Test players added');
    } else {
      issue('TTRE: Test players not showing in lobby');
    }

    // Select TTRE game — click the TTRE thumbnail card in the game selector
    log('Selecting Ticket to Ride Europe...');
    const ttreSelected = await ttreHostPage.evaluate(() => {
      // Find all clickable elements/buttons that are game cards
      // Look for element containing 'Ticket to Ride' that is a direct game card
      const allEls = Array.from(document.querySelectorAll('[class*="snap-start"], [data-gameid]'));
      let ttreCard = allEls.find(el => el.textContent.includes('Ticket to Ride'));
      if (!ttreCard) {
        // Fallback: find by text but click the closest ancestor with an onclick
        const textEls = Array.from(document.querySelectorAll('*'));
        const textEl = textEls.find(el => el.childNodes.length <= 5 && el.textContent.trim() === 'Ticket to Ride Europe');
        if (textEl) {
          // Walk up to find a clickable parent
          let el = textEl;
          for (let i = 0; i < 5; i++) {
            if (el.onclick || el.tagName === 'BUTTON' || (el.className && el.className.includes('cursor'))) {
              ttreCard = el; break;
            }
            el = el.parentElement;
          }
          if (!ttreCard) ttreCard = textEl.parentElement;
        }
      }
      if (ttreCard) {
        ttreCard.scrollIntoView();
        ttreCard.click();
        // Dispatch a synthetic click event in case onclick doesn't fire
        ttreCard.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }
      return false;
    });
    await sleep(1500);
    await screenshot(ttreHostPage, '12_ttre_selected');

    const ttreSelected2 = await getVisibleText(ttreHostPage);
    if (ttreSelected2.includes('Ticket to Ride') || ttreSelected2.includes('CONFIGURE TICKET')) {
      note('TTRE game selected');
    } else {
      issue('Could not select Ticket to Ride Europe game');
    }

    // Configure TTRE
    log('Configuring TTRE...');
    // Click the large bottom button which reads "CONFIGURE TICKET TO RIDE EUROPE"
    const ttreConfigured = await ttreHostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(b => b.textContent && b.textContent.includes('CONFIGURE') && b.textContent.includes('TICKET'));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(1500);
    await screenshot(ttreHostPage, '13_ttre_configure');
    
    const ttreConfigText = await getVisibleText(ttreHostPage);
    if (ttreConfigText.includes('Assign Train Colors') || ttreConfigText.includes('Auto-Assign')) {
      note('TTRE configure screen shows train color assignment ✓');
    } else if (ttreConfigText.includes('Configure Teams')) {
      issue('TTRE configure showing SS lobby (Configure Teams) instead of TTRELobby');
    } else {
      note(`TTRE configure screen: ${ttreConfigText.substring(0, 200)}`);
    }

    // For TTRE configure, colors auto-assign or user picks; we just click launch
    log('Launching TTRE...');
    const ttreLaunched = await ttreHostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(b => b.textContent && b.textContent.includes('LAUNCH') && b.textContent.includes('TICKET'));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(3000);
    await screenshot(ttreHostPage, '14_ttre_host_after_launch');

    const ttreHostUrl = ttreHostPage.url();
    if (ttreHostUrl.includes('/host/')) {
      note(`TTRE: Host reached game dashboard: ${ttreHostUrl}`);
    } else {
      issue(`TTRE: Host did not navigate to /host/. URL: ${ttreHostUrl}`);
    }

    const ttreHostText = await getVisibleText(ttreHostPage);
    if (ttreHostText.includes('Ticket to Ride') || ttreHostText.includes('train') || ttreHostText.includes('Host Control')) {
      note('TTRE game launched on host');
    } else {
      issue('TTRE: Host game view not loading properly');
      note(`TTRE host text: ${ttreHostText.substring(0, 200)}`);
    }

    // Spawn TTRE player browsers
    log('Spawning 2 TTRE player windows...');
    const ttrePlayerPages = [];
    for (let i = 1; i <= 2; i++) {
      const p = await browser.newPage();
      await p.setViewport({ width: 390, height: 844 });
      p.on('pageerror', e => issue(`TTRE Player${i} JS error: ${e.message}`));
      // Get tvPin from the page and embed in URL
      const ttreTvPin = await ttreHostPage.evaluate(() => {
        // Try to read PIN from the page display
        const pinEl = document.querySelector('[class*="tracking"]');
        return pinEl ? pinEl.textContent.trim() : '';
      });
      await p.goto(`${BASE_URL}/play?room=${ttreRoomCode}`);
      ttrePlayerPages.push(p);
    }
    await sleep(2000);

    // Check TTRE player join screen
    // Note: if game is already launched, players see PIN entry screen (expected behavior)
    const ttreP1Text = await getVisibleText(ttrePlayerPages[0]);
    await screenshot(ttrePlayerPages[0], '15_ttre_player_join');
    if (ttreP1Text.includes('Join Room') || ttreP1Text.includes('nickname')) {
      note('TTRE: Player join screen shown (pre-game join)');
    } else if (ttreP1Text.includes('PIN') || ttreP1Text.includes('Look at the TV')) {
      note('TTRE: Player shows PIN entry screen (game already launched - correct behavior) ✓');
    } else {
      issue(`TTRE: Player join screen not shown. Got: ${ttreP1Text.substring(0, 100)}`);
    }

    // ── DEEP UI CHECKS ────────────────────────────────────────
    log('═══════════════════════════════════');
    log('PHASE 3: DEEP UI VALIDATION');
    log('═══════════════════════════════════');

    // Go back to SS host page and check the game board in detail
    const hostBoardText = await getVisibleText(hostPage);
    
    // Check word grid
    const wordCount = (hostBoardText.match(/[A-Z]{3,}/g) || []).length;
    note(`SS Host: ~${wordCount} uppercase words visible (expected ~25+)`);
    
    // Check turn indicator
    if (hostBoardText.includes('Team') || hostBoardText.includes('Blue') || hostBoardText.includes('Pink') || hostBoardText.includes('Spymaster') || hostBoardText.includes('BOARD OVERVIEW')) {
      note('SS Host: Team indicators / board visible');
    } else {
      issue('SS Host: Team indicators missing');
    }

    // Check for game-over state immediately after start (bug)
    if (hostBoardText.includes('Game Over') || hostBoardText.includes('WINS')) {
      issue('SS: Game shows "Game Over" immediately after starting!');
    }

    // Check TTRE board
    const ttreBoardText = await getVisibleText(ttreHostPage);
    if (ttreBoardText.includes('Ticket to Ride') || ttreBoardText.includes('trains left') || 
        ttreBoardText.includes('Player Scores') || ttreBoardText.includes('Map Overview')) {
      note('TTRE: Game board elements visible on host ✓');
    } else if (ttreBoardText.includes('Host Control Panel') && ttreBoardText.includes('TTRE')) {
      note('TTRE: Host Control Panel showing (board may be rendering)');
    } else {
      issue('TTRE: No game board elements visible on host');
      note(`TTRE board text: ${ttreBoardText.substring(0, 300)}`);
    }

    // Final screenshots
    await screenshot(hostPage, '16_ss_final_state');
    await screenshot(ttreHostPage, '17_ttre_final_state');
    await screenshot(playerPages[0], '18_ss_player_final');
    await screenshot(ttrePlayerPages[0], '19_ttre_player_final');

  } catch (err) {
    issue(`Test script crashed: ${err.message}`);
    console.error(err);
  } finally {
    if (browser) await browser.close();

    // ── FINAL REPORT ─────────────────────────────────────────
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║           E2E GAMEPLAY TEST REPORT                   ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log(`\nScreenshots saved to: ${SCREENSHOTS_DIR}\n`);
    
    console.log(`📋 NOTES (${NOTES.length}):`);
    NOTES.forEach(n => console.log(`  ✓ ${n}`));
    
    console.log(`\n🚨 ISSUES FOUND (${ISSUES.length}):`);
    if (ISSUES.length === 0) {
      console.log('  ✅ No issues found!');
    } else {
      ISSUES.forEach((iss, i) => console.log(`  ${i+1}. ${iss}`));
    }
    console.log('\n');
    
    // Write report to file
    const report = {
      timestamp: new Date().toISOString(),
      issueCount: ISSUES.length,
      noteCount: NOTES.length,
      issues: ISSUES,
      notes: NOTES,
      screenshotDir: SCREENSHOTS_DIR,
    };
    fs.writeFileSync(
      path.join(__dirname, 'e2e_report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('Report written to e2e_report.json');
  }
})();
