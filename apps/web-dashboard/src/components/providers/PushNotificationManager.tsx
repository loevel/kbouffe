'use client';

import { useEffect, useRef, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * PushNotificationManager — version "effet de bord" du PushNotificationProvider.
 *
 * Ne rend rien (`return null`) et n'enveloppe aucun enfant : il se place en
 * sibling de l'app. Chargé en `ssr: false` (voir PushNotificationManagerLazy),
 * il — et toute la chaîne Firebase qu'il tire — reste hors du bundle serveur
 * Cloudflare Worker. Le push ne s'exécute de toute façon que dans le navigateur.
 *
 * - permission 'granted'  → initialise immédiatement (token + listener)
 * - permission 'default'  → demande automatiquement après 3 s
 * - permission 'denied'   → silencieux
 */
export default function PushNotificationManager() {
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
      initPush();
    } else if (permission === 'default') {
      const timer = setTimeout(() => { initPush(); }, 3000);
      return () => clearTimeout(timer);
    }
    // 'denied' → silencieux
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Si la permission change (ex. clic "Activer" dans un composant externe)
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

  return null;
}
