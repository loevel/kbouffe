// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Config based on the environment variables defined during build or initialization
const firebaseConfig = {
  apiKey: "AIzaSyDxhlYEORDsQ9KLqY0ceOfo-3w61dwLLGU", 
  authDomain: "kbouffe-app.firebaseapp.com",
  projectId: "kbouffe-app",
  storageBucket: "kbouffe-app.firebasestorage.app",
  messagingSenderId: "1016681125133",
  appId: "1:1016681125133:web:454f568ca0d77b0c8f4c44",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[service-worker] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
