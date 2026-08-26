// sw.js — handles incoming push events and notification clicks
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { title: 'CNX Master OS', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'CNX Master OS';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'cnx-reminder',
    data: { url: data.url || '/' },
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
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});