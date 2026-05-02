importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC34cklzfqOLdz2naBGj1ScgKeXjlMIqnY",
  authDomain: "gen-lang-client-0129855464.firebaseapp.com",
  projectId: "gen-lang-client-0129855464",
  storageBucket: "gen-lang-client-0129855464.firebasestorage.app",
  messagingSenderId: "500388286679",
  appId: "1:500388286679:web:e846627d4c51b3f9392092"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    data: payload.data // Pass custom data payload to the notification event
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close(); // Close the notification

  // Read URL from custom data payload provided in Firebase console
  const urlToOpen = event.notification.data && event.notification.data.click_url;

  if (urlToOpen) {
    event.waitUntil(clients.openWindow(urlToOpen));
  } else {
    // If no URL is provided, open the main app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // If app is already open, focus it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window to the main app
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
