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

/**
 * Détermine le label du bouton d'action selon le type de notification.
 */
function getActionLabel(type) {
  switch (type) {
    case 'support_reply':    return 'Voir la réponse';
    case 'support_message':  return 'Voir le message';
    case 'support_ticket':   return 'Voir le ticket';
    default:                 return 'Ouvrir';
  }
}

/**
 * Affiche la notification avec un bouton d'action contextuel.
 * Disponible seulement quand l'app est en arrière-plan.
 */
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  const data = payload.data ?? {};
  const type = data.type ?? '';
  const link = data.link ?? '/';
  const actionLabel = getActionLabel(type);

  self.registration.showNotification(title ?? 'kBouffe', {
    body: body ?? '',
    icon: icon ?? '/logo-icon.svg',
    badge: '/logo-icon.svg',
    tag: data.ticket_id ? `support-${data.ticket_id}` : undefined,
    renotify: true,
    data: { ...data, link },
    actions: [
      {
        action: 'view',
        title: actionLabel,
      },
    ],
  });
});

/**
 * Gère le clic sur la notification ou sur son bouton d'action.
 * Dans les deux cas → ouvre / focus la page de la conversation.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link ?? '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte sur ce lien → la focus
        for (const client of clientList) {
          if (client.url.includes(link) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si une fenêtre kBouffe est ouverte → naviguer dedans
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'navigate' in client) {
            client.focus();
            return client.navigate(link);
          }
        }
        // Sinon → ouvrir un nouvel onglet
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      })
  );
});
