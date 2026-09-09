(function () {
  'use strict';
  var items = [], revision, editing = null, busy = false;
  var el = function (id) { return document.getElementById(id); };
  function message(text) { el('adminMessage').textContent = text; }
  function showSession(active) {
    el('adminWorkspace').hidden = !active;
    if (el('viewerDashboards')) el('viewerDashboards').hidden = active;
    if (el('adminMode')) el('adminMode').hidden = !active;
    if (!active && window.PortalAuth && window.PortalAuth.isAdmin()) window.PortalAuth.logout();
  }
  async function api(path, method, data) {
    var response = await fetch('api/admin/' + path, { method: method || 'GET', headers: { 'Content-Type': 'application/json', 'X-Portal-Request': '1' }, body: data === undefined ? undefined : JSON.stringify(data) });
    var result;
    try { result = await response.json(); } catch (_) { throw new Error('Admin management requires the portal server. Start it with npm start.'); }
    if (!response.ok) { if (response.status === 401) showSession(false); throw new Error(result.error || 'Request failed.'); }
    return result;
  }
  async function run(action) {
    if (busy) return;
    busy = true; message('');
    el('adminWorkspace').querySelectorAll('button').forEach(function (button) { button.disabled = true; });
    try { await action(); } catch (error) { message(error.message); }
    finally { busy = false; el('adminWorkspace').querySelectorAll('button').forEach(function (button) { button.disabled = false; }); render(); }
  }
  function reset() { editing = null; el('dashboardForm').reset(); el('editorTitle').textContent = 'Add dashboard'; }
  async function load() { var result = await api('dashboards'); items = result.dashboards; revision = result.revision; showSession(true); render(); }
  async function save(next) { var result = await api('dashboards', 'PUT', { dashboards: next, revision: revision }); items = result.dashboards; revision = result.revision; render(); message('Changes saved.'); }
  function render() {
    el('adminCount').textContent = '(' + items.length + ')';
    el('adminList').replaceChildren();
    if (!items.length) el('adminList').textContent = 'No dashboards yet. Add your first dashboard above.';
    items.forEach(function (item, index) {
      var row = document.createElement('article'); row.className = 'admin-row dashboard-card';
      var title = document.createElement('h3'); title.textContent = (index + 1) + '. ' + item.name; row.appendChild(title);
      var description = document.createElement('p'); description.textContent = item.description; row.appendChild(description);
      if (item.url) { var link = document.createElement('a'); link.textContent = 'Open dashboard'; link.href = item.url; link.target = '_blank'; link.rel = 'noopener'; row.appendChild(link); }
      var detail = document.createElement('p'); detail.textContent = item.status + ' · ' + (item.url || 'No link added'); row.appendChild(detail);
      var actions = document.createElement('div'); actions.className = 'admin-actions'; row.appendChild(actions);
      function button(text, action, disabled) { var b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.disabled = busy || !!disabled; b.onclick = action; b.setAttribute('aria-label', text + ' — ' + item.name); actions.appendChild(b); }
      button('Edit', function () {
        editing = item.id; el('editorTitle').textContent = 'Edit dashboard';
        ['Name', 'Description', 'Icon', 'Url', 'Status'].forEach(function (key) { el('dashboard' + key).value = item[key.toLowerCase()]; });
        el('dashboardName').focus(); el('dashboardForm').scrollIntoView({ behavior: 'smooth' });
      });
      button(item.status === 'published' ? 'Hide' : 'Publish', function () { run(async function () { await save(items.map(function (d) { return d.id === item.id ? Object.assign({}, d, { status: d.status === 'published' ? 'hidden' : 'published' }) : d; })); if (editing === item.id) reset(); }); });
      [-1, 1].forEach(function (offset) { button(offset < 0 ? 'Move up' : 'Move down', function () { run(async function () { var next = items.slice(); next.splice(index, 1); next.splice(index + offset, 0, item); await save(next); }); }, index + offset < 0 || index + offset >= items.length); });
      button('Delete', function () { if (window.confirm('Delete “' + item.name + '”? This cannot be undone.')) run(async function () { await save(items.filter(function (d) { return d.id !== item.id; })); if (editing === item.id) reset(); }); });
      el('adminList').appendChild(row);
    });
  }
  el('cancelEdit').onclick = reset;
  el('dashboardForm').onsubmit = function (event) {
    event.preventDefault(); run(async function () {
      var item = { id: editing === null ? Math.max(Date.now(), ...items.map(function (d) { return d.id + 1; })) : editing };
      ['Name', 'Description', 'Icon', 'Url', 'Status'].forEach(function (key) { item[key.toLowerCase()] = el('dashboard' + key).value.trim(); });
      var next = items.slice();
      if (editing === null) next.push(item); else next = next.map(function (d) { return d.id === editing ? item : d; });
      await save(next); reset();
    });
  };
  window.PortalAuth.ready.then(function (role) { if (role === 'admin') run(load); });
})();
