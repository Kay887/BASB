// sw.js — handles incoming push events and notification clicks
//
// A new worker normally waits until every tab and PWA window for this scope is
// closed before taking over. A phone's PWA is rarely "closed", so an updated
// worker could sit waiting for days while the old one kept control — which is
// why in-app notifications did not appear after the fix that added them was
// uploaded. skipWaiting and clients.claim make an update take effect on the
// next load instead.
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { title: 'CNX Master OS', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'CNX Master OS';
  const options = {
    body: data.body || '',
    icon: data.icon || 'icon-192.png',
    badge: data.badge || 'icon-192.png',
    tag: data.tag || 'cnx-reminder',
    // NOT '/'. openWindow('/') resolves to the ORIGIN root —
    // https://kay887.github.io/ — which GitHub Pages serves as a 404, because
    // the app lives under /BASB/. registration.scope is the path this worker
    // was registered for, so it is right wherever the app is hosted, including
    // a move to a Pi or a custom domain.
    data: { url: data.url || self.registration.scope },
  };
  // Tell any open page as well. The OS banner is easy to miss when you are
  // already looking at the app, and the in-app inbox used to sit stale until
  // its next two-minute poll.
  const tellPages = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(cs => cs.forEach(c => c.postMessage({ type: 'cnx-push', title, body: options.body })));

  event.waitUntil(Promise.all([self.registration.showNotification(title, options), tellPages]));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});