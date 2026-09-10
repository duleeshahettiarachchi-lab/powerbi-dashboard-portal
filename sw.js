'use strict';
// Increment the version whenever the offline screen changes.
const PREFIX = 'abm-offline-' + self.registration.scope + '-';
const CACHE = PREFIX + 'v1';
const OFFLINE = new URL('offline.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE, { cache: 'reload' }))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Never cache sessions, admin data, report content or dashboard configuration.
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' ||
      url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope) ||
      url.pathname.startsWith(new URL('api/', self.registration.scope).pathname)) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.open(CACHE)).match(OFFLINE)));
});
