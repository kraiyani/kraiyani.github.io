/* Browser smoke checks. Install Playwright separately; no site dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output/playwright');
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const filename = path.resolve(root, `.${decodeURIComponent(pathname.endsWith('/') ? `${pathname}index.html` : pathname)}`);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'text/plain' });
  fs.createReadStream(filename).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    fs.mkdirSync(output, { recursive: true });
    const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    assert.equal(await page.locator('h1').textContent(), 'Kashyap Raiyani', 'Portfolio must identify its owner');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    await page.getByRole('button', { name: 'Patterns', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Patterns', exact: true }).getAttribute('aria-pressed'), 'true');
    assert((await page.locator('#language-detail').textContent()).includes('representations'));
    assert.equal(await page.locator('.profile-intro').evaluate(element => getComputedStyle(element).animationName), 'none', 'Reduced motion must disable the entrance');
    const theme = page.getByRole('button', { name: 'Dark theme', exact: true });
    await theme.click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', 'Theme selection must survive reload');
    await theme.click();
    for (const scenario of [{ height: 650, scale: 100 }, { height: 900, scale: 200 }]) {
      await page.setViewportSize({ width: 1440, height: scenario.height });
      await page.goto(origin);
      await page.addStyleTag({ content: `html { font-size: ${scenario.scale}% !important; }` });
      await page.keyboard.press('Tab');
      for (let step = 0; step < 20; step++) {
        if (await theme.evaluate(element => element === document.activeElement)) break;
        await page.keyboard.press('Tab');
      }
      assert(await theme.evaluate(element => element === document.activeElement), 'Theme control must be keyboard reachable');
      const control = await theme.boundingBox();
      assert(control.y >= 0 && control.y + control.height <= scenario.height, `Sidebar control clipped at height ${scenario.height}, text ${scenario.scale}%`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Projects', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('nav a[href="#projects"]').getAttribute('aria-current') === 'location');
    await page.goto(origin);
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });

    const listingPage = await context.newPage();
    await listingPage.goto(origin + '/blog/');
    const blogRoutes = await listingPage.locator('.writing-entry h3 a').evaluateAll(links => links.map(link => new URL(link.href).pathname));
    await listingPage.close();
    const homepageRoutes = await page.locator('#writing .writing-entry h3 a').evaluateAll(links => links.map(link => new URL(link.href).pathname));
    assert.deepEqual(homepageRoutes, blogRoutes.slice(0, 3), 'Homepage must show only the latest three articles');
    for (const route of ['/', '/resume.html', '/404.html', '/blog/', ...blogRoutes]) {
      await page.goto(origin + route);
      assert.equal(await page.locator('h1').count(), 1);
      assert(!(await page.locator('body').textContent()).includes('[EDIT:'), 'No unfinished template content');
      const references = await page.locator('[href], [src]').evaluateAll(elements => elements.map(element => element.getAttribute('href') || element.getAttribute('src')));
      for (const reference of references) {
        const url = new URL(reference, page.url());
        if (url.origin !== origin) continue;
        if (url.hash) {
          const destination = await context.newPage();
          await destination.goto(url.href);
          assert.equal(await destination.locator('[id]').evaluateAll((elements, id) => elements.filter(element => element.id === id).length, decodeURIComponent(url.hash.slice(1))), 1, `Missing anchor: ${reference}`);
          await destination.close();
        } else {
          assert.equal((await context.request.get(url.href)).status(), 200, `Missing local file: ${reference}`);
        }
      }
      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${route} at ${width}`);
      }
      await page.setViewportSize({ width: 375, height: 900 });
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      const overflowing = await page.evaluate(() => [...document.querySelectorAll('body *')]
        .filter(element => element.scrollWidth > element.clientWidth + 1)
        .map(element => ({ tag: element.tagName, className: element.className, width: element.clientWidth, scrollWidth: element.scrollWidth })));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow with enlarged text: ${route}: ${JSON.stringify(overflowing)}`);
    }
    await page.goto(origin);
    await page.locator('.project-image img').scrollIntoViewIfNeeded();
    await page.locator('.project-image img').evaluate(image => image.decode());
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    const sampleRoute = blogRoutes.find(route => route === '/blog/preventing-data-leakage-customer-level-ml/') || blogRoutes.find(route => route === '/blog/jev-system-one/') || blogRoutes[0] || '/blog/';
    await page.goto(origin + sampleRoute);
    for (const picture of await page.locator('.article-body img').all()) {
      await picture.scrollIntoViewIfNeeded();
      await picture.evaluate(element => element.decode());
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'article-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(output, 'article-desktop.png'), fullPage: true });
    await page.goto(origin + '/blog/');
    assert.equal(await page.locator('.writing-entry').count(), blogRoutes.length);
    if (blogRoutes.length) {
      await page.locator('.writing-entry h3 a').first().click();
      assert.equal(new URL(page.url()).pathname, blogRoutes[0]);
    }
    const feedResponse = await context.request.get(origin + '/feed.xml');
    assert.equal(feedResponse.status(), 200);
    const feed = await feedResponse.text();
    const feedCheck = await page.evaluate(xml => {
      const document = new DOMParser().parseFromString(xml, 'application/xml');
      return { errors: document.querySelectorAll('parsererror').length, routes: [...document.querySelectorAll('item > link')].map(link => new URL(link.textContent).pathname) };
    }, feed);
    assert.deepEqual(feedCheck, { errors: 0, routes: blogRoutes });
    await page.goto(origin + '/blog/preventing-data-leakage/');
    await page.waitForURL(origin + '/blog/preventing-data-leakage-customer-level-ml/');
    assert.equal(await page.locator('.table-scroll table').count() >= 3, true);
    assert(await page.locator('.article-body img').count() > 0);
    await page.goto(origin + '/resume.html');
    await page.emulateMedia({ media: 'print' });
    assert(!(await page.getByRole('button', { name: 'Print résumé' }).isVisible()));
    assert(await page.getByRole('heading', { name: 'Experience', exact: true }).isVisible());
    await page.pdf({ path: path.join(output, 'resume.pdf'), format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    await page.goto(origin + '/404.html');
    await page.getByRole('link', { name: 'Back to portfolio', exact: true }).click();
    assert.equal(new URL(page.url()).pathname, '/');
    assert.deepEqual(errors, [], 'Browser errors');

    const plainContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
    const plain = await plainContext.newPage();
    await plain.goto(origin);
    assert.equal(await plain.locator('#projects article').count(), 3);
    assert(await plain.getByRole('link', { name: 'View full résumé', exact: true }).isVisible());
    assert(!(await plain.getByRole('button', { name: 'Dark theme', exact: true }).isVisible()));
    await plain.goto(origin + '/blog/');
    assert.equal(await plain.locator('.writing-entry').count(), blogRoutes.length, 'Writing must remain available without scripts');
    const motionContext = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 1000 } });
    const motionPage = await motionContext.newPage();
    motionPage.on('pageerror', error => errors.push(error.message));
    await motionPage.goto(origin);
    assert.equal(await motionPage.locator('.profile-intro').evaluate(element => getComputedStyle(element).animationName), 'intro-enter');
    await motionPage.locator('.project').first().hover();
    await motionPage.waitForFunction(() => getComputedStyle(document.querySelector('.project'), '::before').opacity === '1');
    await motionPage.locator('.project h3 a').first().focus();
    assert.equal(await motionPage.locator('.project').first().evaluate(element => getComputedStyle(element, '::before').opacity), '1');
    const blockedContext = await browser.newContext({ colorScheme: 'dark' });
    await blockedContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
    const blocked = await blockedContext.newPage();
    blocked.on('pageerror', error => errors.push(error.message));
    await blocked.goto(origin);
    await blocked.getByRole('button', { name: 'Dark theme', exact: true }).click();
    assert.equal(await blocked.locator('html').getAttribute('data-theme'), 'light');
    assert.deepEqual(errors, []);
    console.log('PASS: portfolio and writing links, RSS, graphic interaction, reduced motion, project hover/focus, keyboard navigation, themes, responsive layouts, enlarged text, no JavaScript, résumé print and 404');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
