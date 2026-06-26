'use client';

import dynamic from 'next/dynamic';

/**
 * Charge le PushNotificationManager uniquement côté client (`ssr: false`).
 *
 * Conséquence build : le manager — et tout le SDK Firebase (firebase/app +
 * firebase/messaging) qu'il importe dynamiquement — est exclu du bundle serveur
 * du Worker Cloudflare, ce qui maintient le Worker sous la limite de 3 MiB.
 */
const PushNotificationManager = dynamic(
  () => import('./PushNotificationManager'),
  { ssr: false },
);

export function PushNotificationManagerLazy() {
  return <PushNotificationManager />;
}
