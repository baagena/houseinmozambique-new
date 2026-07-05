const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const consoleErrors = [];
  const consoleAll = [];
  page.on('console', (msg) => {
    consoleAll.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

  await page.goto('http://localhost:5000', { waitUntil: 'load', timeout: 60000 });

  try {
    await page.waitForSelector('flt-glass-pane', { timeout: 30000 });
    console.log('Flutter glass pane mounted');
  } catch (e) {
    console.log('Timed out waiting for flt-glass-pane:', e.message);
  }

  await page.waitForTimeout(5000);
  await page.screenshot({ path: process.argv[2] || 'screenshot-1.png' });

  console.log('CONSOLE_ALL:', JSON.stringify(consoleAll.slice(-30)));
  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors));
  await browser.close();
})();
