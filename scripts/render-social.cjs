/* Regenerate the social preview after editing assets/social-card.svg. */
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../assets/social-card.svg')).href);
    await page.screenshot({ path: path.resolve(__dirname, '../assets/social-card.png') });
    console.log('Generated assets/social-card.png from assets/social-card.svg');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
