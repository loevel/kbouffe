// Firebase Messaging Service Worker — gère les push en arrière-plan (background)
// Ce fichier DOIT rester dans /public et s'appeler exactement firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDxhlYEORDsQ9KLqY0ceOfo-3w61dwLLGU',
  authDomain: 'kbouffe-app.firebaseapp.com',
  projectId: 'kbouffe-app',
  storageBucket: 'kbouffe-app.firebasestorage.app',
  messagingSenderId: '1016681125133',
  appId: '1:1016681125133:web:454f568ca0d77b0c8f4c44',
});

const messaging = firebase.messaging();

// Affiche la notification quand l'app est en arrière-plan
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};

  self.registration.showNotification(title ?? 'Kbouffe', {
    body: body ?? '',
    icon: icon ?? '/logo-icon.svg',
    badge: '/logo-icon.svg',
    data: payload.data ?? {},
  });
});

// Gère le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(link) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
