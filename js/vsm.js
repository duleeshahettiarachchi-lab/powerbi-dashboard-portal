(function () {
  'use strict';
  const maps = [
    { name: 'Current state Value Stream Map', icon: 'CS', description: 'Explore the current process flow, activities and opportunities for improvement.', video: 'VSM/Current state VSM/current-state-web.mp4', pdf: 'VSM/Current state VSM/Current state VSM ABM.pdf' },
    { name: 'Intermediate State Value Stream Map', icon: 'IS', description: 'Explore the transition towards the improved process.', video: null, pdf: null },
    { name: 'Future state Value Stream Map', icon: 'FS', description: 'Explore the planned future process and improvement targets.', video: null, pdf: null }
  ];
  const grid = document.getElementById('vsmGrid');
  const dialog = document.getElementById('vsmPlayer');
  const video = document.getElementById('vsmVideo');
  function render() {
    const query = document.getElementById('vsmSearch').value.trim().toLowerCase();
    grid.replaceChildren();
    const visible = maps.filter(map => map.name.toLowerCase().includes(query));
    visible.forEach(map => {
      const card = document.createElement('article');
      card.className = 'dashboard-card';
      card.innerHTML = `<div class="card-accent"></div><div class="card-body"><div class="card-top"><div class="dashboard-icon">${map.icon}</div><span class="status-badge ${map.video || map.pdf ? 'available' : 'unavailable'}">${map.video || map.pdf ? 'Available' : 'Coming soon'}</span></div><h3>${map.name}</h3><p>${map.description}</p><div class="card-action"><button type="button" class="open-dashboard ${map.video ? 'enabled' : 'disabled'}" ${map.video ? '' : 'disabled'}>${map.video ? 'Watch Video →' : 'Video coming soon'}</button>${map.pdf ? `<a class="snapshot-dashboard vsm-pdf" href="${encodeURI(map.pdf)}" target="_blank" rel="noopener" aria-label="View PDF: ${map.name} (opens in new tab)">View PDF ↗</a>` : '<button class="open-dashboard disabled" disabled>PDF coming soon</button>'}</div></div>`;
      if (map.video) card.querySelector('button').addEventListener('click', () => {
        document.getElementById('vsmPlayerTitle').textContent = map.name;
        video.src = encodeURI(map.video);
        dialog.showModal();
        video.play().catch(() => {});
      });
      grid.appendChild(card);
    });
    document.getElementById('vsmCount').textContent = `${visible.length} value stream map${visible.length === 1 ? '' : 's'}`;
    document.getElementById('vsmEmpty').hidden = visible.length > 0;
  }
  document.getElementById('vsmClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.load(); });
  document.getElementById('vsmSearch').addEventListener('input', render);
  render();
})();
