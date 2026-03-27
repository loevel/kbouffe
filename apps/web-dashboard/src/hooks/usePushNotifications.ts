import { useState, useEffect } from 'react';
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '@/lib/firebase/client';
import toast from 'react-hot-toast';

export function usePushNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async (): Promise<string | null> => {
    try {
      if (typeof window === 'undefined') return null;

      const supported = await isSupported();
      if (!supported) {
        console.warn('[FCM] Firebase Messaging non supporté dans ce navigateur.');
        return null;
      }

      // Demande la permission (no-op si déjà accordée/refusée)
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setIsPermissionGranted(false);
        return null;
      }

      setIsPermissionGranted(true);

      const { getMessaging } = await import('firebase/messaging');
      const messaging = getMessaging(app);

      // Enregistre le SW Firebase dédié pour les push en arrière-plan
      let registration: ServiceWorkerRegistration | undefined;
      try {
        registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );
        await registration.update();
      } catch (swErr) {
        console.warn('[FCM] SW registration failed, using default:', swErr);
        registration = await navigator.serviceWorker.ready;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY non défini — token non obtenu.');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        setFcmToken(currentToken);
        await saveTokenToServer(currentToken);
        return currentToken;
      } else {
        console.warn('[FCM] Aucun token disponible — permission peut être bloquée.');
      }
    } catch (err) {
      console.error('[FCM] Erreur lors de la récupération du token:', err);
    }
    return null;
  };

  const saveTokenToServer = async (token: string): Promise<void> => {
    try {
      const res = await fetch('/api/auth/fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: 'web',
          deviceInfo: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[FCM] Erreur enregistrement token:', err);
      }
    } catch (error) {
      console.error('[FCM] saveTokenToServer error:', error);
    }
  };

  const listenForMessages = async (): Promise<(() => void) | undefined> => {
    if (typeof window === 'undefined') return;

    const supported = await isSupported();
    if (!supported) return;

    const { getMessaging } = await import('firebase/messaging');
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'Notification';
      const body = payload.notification?.body ?? '';
      const link = (payload.data as any)?.link as string | undefined;

      const message = body ? `${title}\n${body}` : title;

      // Toast cliquable si un lien est fourni
      if (link) {
        toast(message, {
          duration: 6000,
          icon: '🔔',
          onClick: () => { window.location.href = link; },
        } as any);
      } else {
        toast(message, { duration: 6000, icon: '🔔' });
      }
    });

    return unsubscribe;
  };

  return { requestPermission, fcmToken, isPermissionGranted, listenForMessages };
}
