const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-ui-test-'));
  const root = path.join(__dirname, '..');
  for (const name of ['server.js', 'index.html', 'dashboards.html', 'login.html', 'admin.html', 'js', 'css', 'assets', 'snapshots']) fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  fs.writeFileSync(path.join(dir, 'js/auth-config.js'), 'window.PORTAL_AUTH_CONFIG=' + JSON.stringify({ passwordHash: crypto.createHash('sha256').update('viewer-test-password').digest('hex') }));
  const probe = require('node:net').createServer(); probe.listen(0); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, [path.join(dir, 'server.js')], { env: { ...process.env, ADMIN_PASSWORD: 'admin-test-password', DATA_DIR: path.join(dir, 'data'), PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
  let browser;
  try {
    await once(child.stdout, 'data');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    async function login(password) {
      await page.goto(`http://localhost:${port}/login.html`);
      await page.locator('#authPassword').fill(password);
      await page.getByRole('button', { name: 'Open Portal' }).click();
      await page.waitForURL('**/index.html');
      await page.evaluate(() => window.PortalAuth.ready);
    }
    await login('viewer-test-password');
    assert.equal(await page.locator('#adminWorkspace').isVisible(), false);
    assert.equal(await page.locator('#viewerDashboards').isVisible(), true);
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await page.waitForURL('**/login.html');
    await login('admin-test-password');
    await page.locator('#adminWorkspace').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#viewerDashboards').isVisible(), false);
    await page.locator('#dashboardName').fill('Browser test dashboard');
    await page.locator('#dashboardUrl').fill('https://app.powerbi.com/view?r=test');
    await page.getByRole('button', { name: 'Save dashboard', exact: true }).click();
    const card = page.locator('.admin-row').filter({ hasText: 'Browser test dashboard' });
    await card.waitFor();
    await card.getByRole('button', { name: /^Publish/ }).click();
    await card.getByRole('button', { name: /^Hide/ }).waitFor();
    await page.reload();
    await page.locator('#adminWorkspace').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await page.waitForURL('**/login.html');
    await login('viewer-test-password');
    assert.equal(await page.locator('#adminWorkspace').isVisible(), false);
    await page.locator('#dashboardGrid').getByRole('heading', { name: 'Browser test dashboard' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Edit/ }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: shared login, user view, inline admin editing, publish, reload, logout and role switching.');
  } finally {
    if (browser) await browser.close();
    const stopped = once(child, 'exit'); child.kill(); await stopped;
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
