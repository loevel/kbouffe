/**
 * hooks/use-push-notifications.ts
 *
 * Handles the full Expo push-notification lifecycle:
 *   1. Requests permission from the OS
 *   2. Obtains an Expo push token
 *   3. Registers that token with our backend (POST /api/account/push-token)
 *   4. Listens for notifications received while the app is in the foreground
 *   5. Listens for notification taps and navigates to the right screen
 *
 * Must be called inside a component that lives inside <AuthProvider>.
 * Designed to be called from the root layout via a bridge component so it
 * runs for the entire session.
 *
 * Physical device required for real tokens — the simulator will cause
 * getExpoPushTokenAsync() to throw; the error is caught and logged silently.
 */

import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { registerPushToken } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

// expo-notifications is not supported in Expo Go since SDK 53.
// We lazy-import it so the app doesn't crash when running in Expo Go.
let Notifications: typeof import('expo-notifications') | null = null;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Notifications = require('expo-notifications');
        Notifications!.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    } catch {
        Notifications = null;
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UsePushNotificationsReturn {
    expoPushToken: string | null;
    notification: unknown | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<unknown | null>(null);

    const foregroundListenerRef = useRef<{ remove: () => void } | null>(null);
    const responseListenerRef = useRef<{ remove: () => void } | null>(null);

    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Push notifications non disponibles dans Expo Go (SDK 53+)
        if (!isAuthenticated || !Notifications) return;

        let cancelled = false;

        async function registerForPushNotifications() {
            try {
                if (Platform.OS === 'android') {
                    await Notifications!.setNotificationChannelAsync('orders', {
                        name: 'Commandes',
                        description: "Mises à jour de l'état de vos commandes",
                        importance: Notifications!.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#FF6B2B',
                        sound: 'default',
                        enableLights: true,
                        enableVibrate: true,
                        showBadge: true,
                    });
                    await Notifications!.setNotificationChannelAsync('promotions', {
                        name: 'Promotions',
                        description: 'Offres spéciales et promotions des restaurants',
                        importance: Notifications!.AndroidImportance.DEFAULT,
                        sound: 'default',
                        showBadge: false,
                    });
                }

                // ── Permission request ────────────────────────────────────────
                const { status: existingStatus } = await Notifications!.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications!.requestPermissionsAsync({
                        ios: {
                            allowAlert: true,
                            allowBadge: true,
                            allowSound: true,
                            allowCriticalAlerts: false,
                            provideAppNotificationSettings: true,
                        },
                    });
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('[PushNotifications] Permission refusée ou non accordée.');
                    return;
                }

                // ── Expo push token ───────────────────────────────────────────
                // getExpoPushTokenAsync throws on a simulator — catch gracefully.
                const projectId =
                    Constants.expoConfig?.extra?.eas?.projectId ??
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (Constants as any).easConfig?.projectId ??
                    undefined;

                const tokenData = await Notifications!.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined,
                );

                if (cancelled) return;

                const token = tokenData.data;

                if (!token) {
                    console.log('[PushNotifications] Token vide (simulateur ?).');
                    return;
                }

                setExpoPushToken(token);

                // ── Backend registration ──────────────────────────────────────
                const platform = Platform.OS === 'android' ? 'android' : 'ios';
                await registerPushToken(token, platform);

                console.log(`[PushNotifications] Token enregistré (${platform}):`, token);
            } catch (err) {
                // Simulators, permission denials and network errors all surface here.
                // We log but never crash.
                console.warn('[PushNotifications] Impossible d\'enregistrer le token:', err);
            }
        }

        void registerForPushNotifications();

        // ── Foreground notification listener ──────────────────────────────────
        // Called when a push notification arrives while the app is open.
        foregroundListenerRef.current = Notifications!.addNotificationReceivedListener(
            (receivedNotification) => {
                setNotification(receivedNotification);
            },
        );

        // ── Response (tap) listener ───────────────────────────────────────────
        // Called when the user taps a notification (foreground or background).
        responseListenerRef.current = Notifications!.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data as Record<string, unknown>;

                try {
                    // Navigate to the relevant screen based on notification data.
                    if (data?.orderId && typeof data.orderId === 'string') {
                        router.push(`/order/${data.orderId}`);
                        return;
                    }

                    if (data?.restaurantSlug && typeof data.restaurantSlug === 'string') {
                        router.push(`/restaurant/${data.restaurantSlug}`);
                        return;
                    }

                    // Generic deep-link fallback
                    if (data?.url && typeof data.url === 'string') {
                        router.push(data.url as never);
                    }
                } catch (navErr) {
                    console.warn('[PushNotifications] Erreur de navigation:', navErr);
                }
            },
        );

        return () => {
            cancelled = true;
            foregroundListenerRef.current?.remove();
            responseListenerRef.current?.remove();
        };
    }, [isAuthenticated, router]);

    return { expoPushToken, notification };
}
