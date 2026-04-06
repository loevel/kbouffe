/**
 * payment-pending.tsx
 *
 * Shown immediately after a successful MTN MoMo order placement.
 * Polls the order's payment_status every 5 s and navigates to
 * /order/:id once the payment is confirmed.
 * Times out after 5 minutes with retry / cancel options.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cancelOrder, trackOrder } from '@/lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 5_000;       // 5 seconds between status checks
const TIMEOUT_MS       = 5 * 60_000;  // 5-minute hard timeout

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PaymentPendingScreen() {
    const { orderId, amount, phone } = useLocalSearchParams<{
        orderId: string;
        amount:  string;
        phone:   string;
    }>();

    const router      = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme       = Colors[colorScheme];
    const insets      = useSafeAreaInsets();

    const [timedOut,   setTimedOut]   = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // ── Animation refs ────────────────────────────────────────────────────────
    // Scale + opacity for the pulsing phone icon
    const pulseScale   = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(1)).current;
    // Progress bar fills from 0 → 1 over the full timeout duration
    const progressAnim = useRef(new Animated.Value(0)).current;

    const pulseLoopRef    = useRef<Animated.CompositeAnimation | null>(null);
    const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

    const startPulse = useCallback(() => {
        pulseScale.setValue(1);
        pulseOpacity.setValue(1);

        pulseLoopRef.current = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseScale,   { toValue: 1.20, duration: 750, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.65, duration: 750, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseScale,   { toValue: 1,    duration: 750, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 1,    duration: 750, useNativeDriver: true }),
                ]),
            ]),
        );
        pulseLoopRef.current.start();
    }, [pulseScale, pulseOpacity]);

    const stopPulse = useCallback(() => {
        pulseLoopRef.current?.stop();
    }, []);

    const startProgress = useCallback(() => {
        progressAnim.setValue(0);
        progressAnimRef.current = Animated.timing(progressAnim, {
            toValue:  1,
            duration: TIMEOUT_MS,
            useNativeDriver: false, // 'width' cannot use native driver
        });
        progressAnimRef.current.start();
    }, [progressAnim]);

    const stopProgress = useCallback(() => {
        progressAnimRef.current?.stop();
    }, []);

    // ── Polling refs ──────────────────────────────────────────────────────────
    const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current)    clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        pollRef.current    = null;
        timeoutRef.current = null;
    }, []);

    const startPolling = useCallback(() => {
        if (!orderId) return;

        // Immediate first check so users don't wait a full interval
        trackOrder(orderId).then((order) => {
            if (order.payment_status === 'paid') {
                stopPolling();
                stopPulse();
                stopProgress();
                router.replace(`/order/${orderId}`);
            }
        }).catch(() => {/* ignore */});

        pollRef.current = setInterval(async () => {
            try {
                const order = await trackOrder(orderId);
                if (order.payment_status === 'paid') {
                    stopPolling();
                    stopPulse();
                    stopProgress();
                    router.replace(`/order/${orderId}`);
                }
            } catch {
                // Transient errors: keep polling silently
            }
        }, POLL_INTERVAL_MS);

        timeoutRef.current = setTimeout(() => {
            stopPolling();
            stopPulse();
            stopProgress();
            setTimedOut(true);
        }, TIMEOUT_MS);
    }, [orderId, router, stopPolling, stopPulse, stopProgress]);

    // ── Mount / unmount ───────────────────────────────────────────────────────
    useEffect(() => {
        startPulse();
        startProgress();
        startPolling();

        return () => {
            stopPolling();
            stopPulse();
            stopProgress();
        };
    }, [startPulse, startProgress, startPolling, stopPolling, stopPulse, stopProgress]);

    // ── User actions ──────────────────────────────────────────────────────────
    const handleRetry = () => {
        setTimedOut(false);
        startPulse();
        startProgress();
        startPolling();
    };

    const handleCancel = () => {
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text:  'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            if (orderId) await cancelOrder(orderId);
                            stopPolling();
                            router.replace('/(tabs)');
                        } catch {
                            Alert.alert(
                                'Erreur',
                                "Impossible d'annuler la commande. Veuillez contacter le support.",
                            );
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ],
        );
    };

    // ── Derived display values ────────────────────────────────────────────────
    const displayAmount = `${Number(amount ?? 0).toLocaleString('fr-FR')} FCFA`;

    const progressWidth = progressAnim.interpolate({
        inputRange:  [0, 1],
        outputRange: ['0%', '100%'],
    });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View
            style={[
                styles.root,
                {
                    backgroundColor: theme.background,
                    paddingTop:       insets.top    + Spacing.xl,
                    paddingBottom:    insets.bottom + Spacing.xl,
                },
            ]}
        >
            {/* ── Animated phone icon ─────────────────────────────────────── */}
            <View style={styles.iconSection}>
                {/* Outer diffuse ring */}
                <Animated.View
                    style={[
                        styles.outerRing,
                        { borderColor: theme.primary + '25' },
                        { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                    ]}
                />
                {/* Mid ring */}
                <Animated.View
                    style={[
                        styles.midRing,
                        { borderColor: theme.primary + '50' },
                        { transform: [{ scale: pulseScale }] },
                    ]}
                />
                {/* Icon pill */}
                <View style={[styles.iconBox, { backgroundColor: theme.primaryLight, ...Shadows.md }]}>
                    <Ionicons name="phone-portrait-outline" size={58} color={theme.primary} />
                </View>
            </View>

            {/* ── Title ───────────────────────────────────────────────────── */}
            <Text style={[styles.title, { color: theme.text }]}>
                {timedOut ? 'Délai dépassé' : 'Confirmez sur votre téléphone'}
            </Text>

            {/* ── Subtitle ────────────────────────────────────────────────── */}
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {timedOut
                    ? "La demande de paiement a expiré. Veuillez réessayer ou annuler la commande."
                    : "Une demande de paiement MTN Mobile Money a été envoyée. Veuillez l'accepter pour finaliser votre commande."}
            </Text>

            {/* ── Amount pill ─────────────────────────────────────────────── */}
            <View style={[styles.amountPill, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.amountLabel, { color: theme.textMuted }]}>Montant à payer</Text>
                <Text style={[styles.amountValue, { color: theme.primary }]}>{displayAmount}</Text>
            </View>

            {/* ── Phone number hint ────────────────────────────────────────── */}
            {!!phone && (
                <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={15} color={theme.textMuted} />
                    <Text style={[styles.phoneText, { color: theme.textMuted }]}>{phone}</Text>
                </View>
            )}

            {/* ── Progress bar (shown while waiting) ──────────────────────── */}
            {!timedOut && (
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            { backgroundColor: theme.primary, width: progressWidth },
                        ]}
                    />
                </View>
            )}

            {/* ── Status row ──────────────────────────────────────────────── */}
            {!timedOut ? (
                <>
                    {/* "Checking…" indicator */}
                    <View style={styles.statusRow}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text style={[styles.statusText, { color: theme.textMuted }]}>
                            Vérification en cours…
                        </Text>
                    </View>

                    {/* Cancel while waiting */}
                    <Pressable
                        onPress={handleCancel}
                        disabled={cancelling}
                        style={({ pressed }) => [styles.cancelLink, pressed && { opacity: 0.6 }]}
                    >
                        {cancelling ? (
                            <ActivityIndicator size="small" color={theme.error} />
                        ) : (
                            <Text style={[styles.cancelLinkText, { color: theme.error }]}>
                                Annuler la commande
                            </Text>
                        )}
                    </Pressable>
                </>
            ) : (
                /* Timeout: retry + cancel buttons */
                <View style={styles.actionsColumn}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.retryButton,
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.85 },
                        ]}
                        onPress={handleRetry}
                    >
                        <Ionicons name="refresh-outline" size={18} color="#fff" />
                        <Text style={styles.retryButtonText}>Réessayer</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.cancelButton,
                            { borderColor: theme.border },
                            pressed && { opacity: 0.6 },
                            cancelling && { opacity: 0.6 },
                        ]}
                        onPress={handleCancel}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <ActivityIndicator size="small" color={theme.error} />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={18} color={theme.error} />
                                <Text style={[styles.cancelButtonText, { color: theme.error }]}>
                                    Annuler la commande
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex:            1,
        alignItems:      'center',
        justifyContent:  'center',
        paddingHorizontal: Spacing.xl,
    },

    // ── Icon section ─────────────────────────────────────────────────────────
    iconSection: {
        alignItems:     'center',
        justifyContent: 'center',
        marginBottom:   Spacing.xl,
        // Make sure the rings have enough space
        width:  200,
        height: 200,
    },
    outerRing: {
        position:     'absolute',
        width:        180,
        height:       180,
        borderRadius: 90,
        borderWidth:  2,
    },
    midRing: {
        position:     'absolute',
        width:        136,
        height:       136,
        borderRadius: 68,
        borderWidth:  2,
    },
    iconBox: {
        width:          96,
        height:         96,
        borderRadius:   Radii.full,
        alignItems:     'center',
        justifyContent: 'center',
    },

    // ── Text ─────────────────────────────────────────────────────────────────
    title: {
        ...Typography.title2,
        textAlign:    'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        textAlign:    'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
    },

    // ── Amount pill ───────────────────────────────────────────────────────────
    amountPill: {
        alignItems:      'center',
        paddingVertical:   Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius:    Radii.xl,
        marginBottom:    Spacing.md,
        gap:             Spacing.xs,
    },
    amountLabel: {
        ...Typography.captionSemibold,
    },
    amountValue: {
        ...Typography.title3,
    },

    // ── Phone row ─────────────────────────────────────────────────────────────
    phoneRow: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           Spacing.xs,
        marginBottom:  Spacing.xl,
    },
    phoneText: {
        ...Typography.caption,
    },

    // ── Progress bar ──────────────────────────────────────────────────────────
    progressTrack: {
        width:        '100%',
        height:       4,
        borderRadius: Radii.full,
        overflow:     'hidden',
        marginBottom: Spacing.lg,
    },
    progressFill: {
        height:       4,
        borderRadius: Radii.full,
    },

    // ── Status row (while waiting) ────────────────────────────────────────────
    statusRow: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           Spacing.sm,
        marginBottom:  Spacing.lg,
    },
    statusText: {
        ...Typography.caption,
    },

    // ── Cancel link (while waiting) ───────────────────────────────────────────
    cancelLink: {
        paddingVertical: Spacing.sm,
        minHeight:       36,
        alignItems:      'center',
        justifyContent:  'center',
    },
    cancelLinkText: {
        ...Typography.captionSemibold,
        textDecorationLine: 'underline',
    },

    // ── Timeout actions ───────────────────────────────────────────────────────
    actionsColumn: {
        width: '100%',
        gap:   Spacing.md,
    },
    retryButton: {
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius:    Radii.xl,
        ...Shadows.sm,
    },
    retryButtonText: {
        ...Typography.bodySemibold,
        color: '#fff',
    },
    cancelButton: {
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius:    Radii.xl,
        borderWidth:     1,
    },
    cancelButtonText: {
        ...Typography.bodySemibold,
    },
});
