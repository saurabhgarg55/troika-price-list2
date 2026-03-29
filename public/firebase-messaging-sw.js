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
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
