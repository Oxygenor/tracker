// HabitFlow Service Worker — Push Notifications

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Handle push event from server (future use)
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'HabitFlow', {
      body: data.body ?? 'Час відмітити звички!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag ?? 'habitflow',
      data: { url: data.url ?? '/' },
    })
  )
})

// Handle notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})

// Handle scheduled alarm messages from the app
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: e.data.tag ?? 'habitflow-reminder',
      data: { url: '/' },
    })
  }
})
