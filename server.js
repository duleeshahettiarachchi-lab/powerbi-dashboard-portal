const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = __dirname;
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const dataFile = path.join(dataDir, 'dashboards.json');
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12) throw new Error('Set ADMIN_PASSWORD to at least 12 characters before starting.');
const passwordDigest = crypto.createHash('sha256').update(password).digest();
const viewerConfig = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/auth-config.js'), 'utf8'), viewerConfig);
const viewerDigest = Buffer.from(viewerConfig.window.PORTAL_AUTH_CONFIG.passwordHash, 'hex');
if (crypto.timingSafeEqual(passwordDigest, viewerDigest)) throw new Error('Admin and user passwords must be different.');
const sessions = new Map();
const attempts = new Map();
const seed = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/dashboard-config.js'), 'utf8'), seed);
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(seed.window.DASHBOARD_CONFIG.map(d => ({ ...d, status: 'published' })), null, 2));
let dashboards = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
let revision = Date.now();

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function authenticated(req) {
  return sessionRole(req) === 'admin';
}
function sessionRole(req) {
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('portal_admin='));
  const session = token && sessions.get(token.slice(13));
  return session && session.expiresAt > Date.now() ? session.role : null;
}
async function body(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > 1024 * 1024) throw new Error('Request too large.');
  }
  return JSON.parse(text);
}
function validate(items) {
  if (!Array.isArray(items) || items.length > 500) throw new Error('Invalid dashboard list.');
  const ids = new Set();
  return items.map(d => {
    if (!Number.isSafeInteger(d.id) || d.id <= 0 || ids.has(d.id)) throw new Error('Invalid dashboard ID.');
    ids.add(d.id);
    if (typeof d.name !== 'string' || !d.name.trim() || d.name.length > 120) throw new Error('A dashboard name is required (maximum 120 characters).');
    if (typeof d.description !== 'string' || d.description.length > 1000 || typeof d.icon !== 'string' || d.icon.length > 8 || typeof d.url !== 'string' || d.url.length > 4096) throw new Error('Invalid dashboard fields.');
    if (!['draft', 'published', 'hidden'].includes(d.status)) throw new Error('Invalid status.');
    if (d.url) {
      const url = new URL(d.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS dashboard URL without credentials.');
    }
    if (d.status === 'published' && !d.url && !dashboards.some(old => old.id === d.id && old.status === 'published' && !old.url)) throw new Error('Add a dashboard link before publishing.');
    return { id: d.id, name: d.name.trim(), description: d.description.trim(), icon: d.icon.trim(), url: d.url.trim(), status: d.status };
  });
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    if (route.startsWith('/api/')) {
      if (!['GET', 'HEAD'].includes(req.method) && (req.headers['x-portal-request'] !== '1' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host))) return json(res, 403, { error: 'Invalid request origin.' });
      if ((route === '/api/admin/login' || route === '/api/login') && req.method === 'POST') {
        const ip = req.socket.remoteAddress;
        const now = Date.now();
        const rate = attempts.get(ip) || { count: 0, until: now + 600000 };
        if (rate.until <= now) { rate.count = 0; rate.until = now + 600000; }
        if (rate.count >= 10) return json(res, 429, { error: 'Too many attempts. Try again in 10 minutes.' });
        rate.count++; attempts.set(ip, rate);
        const input = await body(req);
        const digest = crypto.createHash('sha256').update(String(input.password || '')).digest();
        const role = crypto.timingSafeEqual(digest, passwordDigest) ? 'admin' : route === '/api/login' && crypto.timingSafeEqual(digest, viewerDigest) ? 'user' : null;
        if (!role) return json(res, 401, { error: 'Incorrect password.' });
        attempts.delete(ip);
        const previous = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('portal_admin='));
        if (previous) sessions.delete(previous.slice(13));
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { role, expiresAt: now + 8 * 3600000 });
        res.setHeader('Set-Cookie', `portal_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`);
        return json(res, 200, { ok: true, role });
      }
      if (route === '/api/session' && req.method === 'GET') return json(res, 200, { role: sessionRole(req) });
      if (route === '/api/logout' && req.method === 'POST') {
        const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('portal_admin='));
        if (token) sessions.delete(token.slice(13));
        res.setHeader('Set-Cookie', 'portal_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return json(res, 200, { ok: true });
      }
      if (route === '/api/dashboards' && req.method === 'GET') return json(res, 200, dashboards.filter(d => d.status === 'published'));
      if (!authenticated(req)) return json(res, 401, { error: 'Admin login required.' });
      if (route === '/api/admin/session' && req.method === 'GET') return json(res, 200, { ok: true });
      if (route === '/api/admin/logout' && req.method === 'POST') {
        const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('portal_admin='));
        if (token) sessions.delete(token.slice(13));
        res.setHeader('Set-Cookie', 'portal_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return json(res, 200, { ok: true });
      }
      if (route === '/api/admin/dashboards' && req.method === 'GET') return json(res, 200, { dashboards, revision });
      if (route === '/api/admin/dashboards' && req.method === 'PUT') {
        const input = await body(req);
        if (input.revision !== revision) return json(res, 409, { error: 'Another administrator changed the dashboards. Reload before editing.' });
        const next = validate(input.dashboards);
        fs.writeFileSync(dataFile + '.tmp', JSON.stringify(next, null, 2));
        fs.renameSync(dataFile + '.tmp', dataFile);
        dashboards = next; revision++;
        return json(res, 200, { dashboards, revision });
      }
      return json(res, 404, { error: 'Not found.' });
    }
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
    if (route === '/js/dashboard-config.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' });
      return res.end('window.DASHBOARD_CONFIG = ' + JSON.stringify(dashboards.filter(d => d.status === 'published')) + ';');
    }
    const relative = decodeURIComponent(route).replace(/^\/+/, '') || 'index.html';
    if (!/^(?:[\w-]+\.html|(?:css|js|assets|snapshots|Live pictures|live-pictures)\/[^\\]+|snapshot-config\.json)$/.test(relative) || relative.split('/').some(p => p.startsWith('.'))) return json(res, 404, { error: 'Not found.' });
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: 'Not found.' });
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (error) { json(res, 400, { error: error.code ? 'Unable to save or read dashboard data.' : error.message }); }
});
server.listen(Number(process.env.PORT) || 3000, () => console.log('Dashboard portal listening on port ' + (process.env.PORT || 3000)));
