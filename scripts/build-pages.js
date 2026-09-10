const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const output = path.join(root, '_site');
fs.mkdirSync(output, { recursive: true });
// Publish only viewer assets. Server files and persistent admin data stay private.
for (const name of ['index.html', 'dashboards.html', 'login.html', 'admin.html', 'viewer.html', 'snapshot.html', 'slideshow.html', 'offline.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets', 'snapshot-config.json']) {
  fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
}
fs.mkdirSync(path.join(output, 'snapshots'), { recursive: true });
for (const name of fs.readdirSync(path.join(root, 'snapshots'))) {
  if (name === 'metadata.json' || /\.(png|jpe?g|webp)$/i.test(name)) fs.copyFileSync(path.join(root, 'snapshots', name), path.join(output, 'snapshots', name));
}
for (const name of ['Live pictures', 'live-pictures']) {
  if (fs.existsSync(path.join(root, name))) fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('GitHub Pages site prepared in _site');
