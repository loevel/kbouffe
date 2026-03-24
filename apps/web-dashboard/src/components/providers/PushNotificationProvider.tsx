'use client';

import { useEffect, useRef, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * PushNotificationProvider
 * - Si la permission est déjà accordée → initialise immédiatement (token + listener)
 * - Si la permission est 'default' (jamais demandée) → demande automatiquement
 *   après 3 s (laisse le temps à la page de se charger)
 * - Si la permission est 'denied' → silencieux
 */
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isPermissionGranted, requestPermission, listenForMessages } = usePushNotifications();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Délai de 1 tick pour attendre que window soit disponible
  useEffect(() => { setReady(true); }, []);

  // Si déjà accordée au montage → init directement
  useEffect(() => {
    if (!ready) return;
    if (initializedRef.current) return;

    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

    if (permission === 'granted') {
      // Init immédiate
      initPush();
    } else if (permission === 'default') {
      // Demande automatique après 3 s (nécessite que l'utilisateur interagisse
      // avec la page dans les navigateurs modernes — si bloqué, silencieux)
      const timer = setTimeout(() => { initPush(); }, 3000);
      return () => clearTimeout(timer);
    }
    // 'denied' → silencieux
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Si la permission change (ex. l'utilisateur clique "Activer" dans un composant externe)
  useEffect(() => {
    if (!ready) return;
    if (!isPermissionGranted) return;
    if (initializedRef.current) return;
    initPush();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPermissionGranted, ready]);

  async function initPush() {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      await requestPermission();
      const unsub = await listenForMessages();
      if (unsub) {
        unsubscribeRef.current = unsub;
      }
    } catch {
      initializedRef.current = false; // Permettre retry
    }
  }

  // Cleanup à l'unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
