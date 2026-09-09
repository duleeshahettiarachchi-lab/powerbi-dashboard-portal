const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const net = require('node:net');

(async () => {
  const probe = net.createServer(); probe.listen(0); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-admin-test-'));
  const fixture = path.join(dir, 'app');
  fs.mkdirSync(path.join(fixture, 'js'), { recursive: true });
  for (const name of ['server.js', 'admin.html', 'index.html', 'login.html', 'js/dashboard-config.js']) fs.copyFileSync(path.join(__dirname, '..', name), path.join(fixture, name));
  const userPassword = 'test-viewer-password';
  fs.writeFileSync(path.join(fixture, 'js/auth-config.js'), 'window.PORTAL_AUTH_CONFIG = ' + JSON.stringify({ passwordHash: require('node:crypto').createHash('sha256').update(userPassword).digest('hex') }));
  const env = { ...process.env, ADMIN_PASSWORD: 'test-password-123456', DATA_DIR: dir, PORT: String(port) };
  let child;
  async function start() {
    child = spawn(process.execPath, [path.join(fixture, 'server.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
    await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw new Error('Server failed to start'); })]);
  }
  async function stop() { const ended = once(child, 'exit'); child.kill(); await ended; }
  let cookie = '';
  async function request(route, method = 'GET', data, authorized = true, csrf = true) {
    return fetch(`http://localhost:${port}${route}`, { method, headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-Portal-Request': '1' } : {}), ...(authorized ? { Cookie: cookie } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
  }
  try {
    await start();
    assert.equal((await request('/api/admin/dashboards')).status, 401);
    assert.equal((await request('/api/admin/login', 'POST', { password: 'wrong' })).status, 401);
    const userLogin = await request('/api/login', 'POST', { password: userPassword });
    assert.equal((await userLogin.json()).role, 'user');
    cookie = userLogin.headers.get('set-cookie').split(';')[0];
    assert.equal((await (await request('/api/session')).json()).role, 'user');
    assert.equal((await request('/api/admin/dashboards')).status, 401);
    assert.equal((await request('/api/admin/dashboards', 'PUT', { dashboards: [], revision: 1 })).status, 401);
    const login = await request('/api/login', 'POST', { password: env.ADMIN_PASSWORD });
    assert.equal((await login.json()).role, 'admin');
    assert.equal(login.status, 200); cookie = login.headers.get('set-cookie').split(';')[0];
    assert.match(login.headers.get('set-cookie'), /HttpOnly/);
    assert.equal((await (await request('/api/session')).json()).role, 'admin');
    let state = await (await request('/api/admin/dashboards')).json();
    const item = { id: 100, name: 'Test report', description: 'Test', icon: 'BI', url: 'https://app.powerbi.com/view?r=test', status: 'draft' };
    let next = [...state.dashboards, item];
    async function save(list) {
      const response = await request('/api/admin/dashboards', 'PUT', { revision: state.revision, dashboards: list });
      assert.equal(response.status, 200); state = await response.json();
    }
    assert.equal((await request('/api/admin/dashboards', 'PUT', { revision: state.revision, dashboards: next }, false)).status, 401);
    assert.equal((await request('/api/admin/dashboards', 'PUT', { revision: state.revision, dashboards: next }, true, false)).status, 403);
    await save(next);
    assert.equal((await (await request('/api/dashboards')).json()).some(d => d.id === 100), false);
    const published = { ...item, name: 'Edited report', status: 'published' };
    await save([published, ...state.dashboards.filter(d => d.id !== 100)]);
    assert.equal((await (await request('/api/dashboards')).json())[0].name, 'Edited report');
    assert.match(await (await request('/js/dashboard-config.js')).text(), /Edited report/);
    assert.equal((await request('/api/admin/dashboards', 'PUT', { revision: state.revision - 1, dashboards: [] })).status, 409);
    assert.equal((await request('/api/admin/dashboards', 'PUT', { revision: state.revision, dashboards: [{ ...item, url: 'javascript:alert(1)' }] })).status, 400);
    await save(state.dashboards.map(d => d.id === 100 ? { ...d, status: 'hidden' } : d));
    assert.doesNotMatch(await (await request('/js/dashboard-config.js')).text(), /Edited report/);
    await stop(); await start();
    const relogin = await request('/api/admin/login', 'POST', { password: env.ADMIN_PASSWORD }); cookie = relogin.headers.get('set-cookie').split(';')[0];
    state = await (await request('/api/admin/dashboards')).json();
    assert.equal(state.dashboards[0].status, 'hidden');
    await save(state.dashboards.filter(d => d.id !== 100));
    assert.equal(state.dashboards.some(d => d.id === 100), false);
    assert.equal((await request('/data/dashboards.json')).status, 404);
    assert.equal((await request('/server.js')).status, 404);
    assert.equal((await request('/admin.html')).status, 200);
    const switched = await request('/api/login', 'POST', { password: userPassword });
    const adminCookie = cookie;
    cookie = switched.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/api/admin/dashboards')).status, 401);
    cookie = adminCookie;
    assert.equal((await request('/api/admin/dashboards')).status, 401);
    cookie = switched.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/api/logout', 'POST', {})).status, 200);
    assert.equal((await (await request('/api/session')).json()).role, null);
    assert.equal((await request('/api/admin/dashboards')).status, 401);
    console.log('Admin integration checks passed: auth, CSRF, CRUD, ordering, visibility, validation, conflicts, persistence, logout.');
  } finally {
    if (child && child.exitCode === null) await stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
