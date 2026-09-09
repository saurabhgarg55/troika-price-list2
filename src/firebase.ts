import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export let messaging: any = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && messaging) {
      const token = await getToken(messaging, { vapidKey: 'BBttFA3VMXBSpHQAVJb1CC0moc9xKtSmfXbexS9VZByFZfMsfSiiDLvGhy4wP3N4O4gtnXW6YmcjZlVALbwpJN0' });
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return null;
};
