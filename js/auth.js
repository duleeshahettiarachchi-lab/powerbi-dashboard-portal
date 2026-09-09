(function () {
  'use strict';
  var config = window.PORTAL_AUTH_CONFIG || {};
  var key = config.storageKey || 'powerbi-dashboard-portal-auth';
  var role = null, serverAvailable = false;
  var loginPage = /(^|\/)login\.html$/i.test(location.pathname);
  function clearSession() { try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch (_) {} role = null; }
  function storage() { return config.storageType === 'local' ? localStorage : sessionStorage; }
  function localUser() {
    try { var s = JSON.parse(storage().getItem(key) || 'null'); return s && s.passwordHash === config.passwordHash && (!s.expiresAt || s.expiresAt > Date.now()); } catch (_) { return false; }
  }
  function returnUrl() {
    var value = new URLSearchParams(location.search).get('returnTo') || 'index.html';
    return /^(index|dashboards|viewer|snapshot|slideshow)\.html(?:[?#].*)?$/.test(value) ? value : 'index.html';
  }
  function redirect() { location.replace('login.html?returnTo=' + encodeURIComponent((location.pathname.split('/').pop() || 'index.html') + location.search)); }
  async function request(path, data) {
    var response = await fetch('api/' + path, { method: data === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Portal-Request': '1' }, body: data === undefined ? undefined : JSON.stringify(data), cache: 'no-store' });
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
    return result;
  }
  async function logout() {
    if (serverAvailable) { try { await request('logout', {}); } catch (_) { alert('Logout failed. Please try again.'); return; } }
    clearSession(); location.replace('login.html');
  }
  var ready = (async function () {
    try { var session = await request('session'); serverAvailable = true; role = session.role; }
    catch (_) { role = localUser() ? 'user' : null; }
    if (!loginPage && !role) redirect();
    return role;
  })();
  window.PortalAuth = { ready: ready, isAuthenticated: function () { return !!role; }, isAdmin: function () { return role === 'admin'; }, clearSession: clearSession, logout: logout };
  document.addEventListener('DOMContentLoaded', async function () {
    await ready;
    document.addEventListener('click', function (event) { if (event.target.closest('[data-auth-logout]')) { event.preventDefault(); logout(); } });
    if (!loginPage) return;
    if (role) { location.replace(returnUrl()); return; }
    var form = document.getElementById('authForm'), password = document.getElementById('authPassword'), toggle = document.getElementById('togglePassword');
    if (toggle) toggle.onclick = function () {
      password.type = password.type === 'password' ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(password.type === 'text'));
      toggle.setAttribute('aria-label', password.type === 'text' ? 'Hide password' : 'Show password');
    };
    form.onsubmit = async function (event) {
      event.preventDefault();
      var button = form.querySelector('[type="submit"]'); button.disabled = true;
      var error = document.getElementById('authError'); error.textContent = '';
      try {
        if (serverAvailable) { var result = await request('login', { password: password.value }); clearSession(); role = result.role; }
        else {
          var bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password.value));
          var hash = Array.from(new Uint8Array(bytes)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
          if (hash !== config.passwordHash) throw new Error('Incorrect password. Admin access requires the portal server.');
          storage().setItem(key, JSON.stringify({ passwordHash: hash, expiresAt: config.sessionDurationDays ? Date.now() + config.sessionDurationDays * 86400000 : null }));
        }
        location.replace(returnUrl());
      } catch (err) { error.textContent = err.message; password.value = ''; password.focus(); }
      finally { button.disabled = false; }
    };
  });
})();
