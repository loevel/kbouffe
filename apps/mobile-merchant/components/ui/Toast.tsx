import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { Duration, TouchTarget, ZIndex } from '@/constants/theme';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastOptions {
    tone?: ToastTone;
    /** Durée d'affichage en ms. Les erreurs restent plus longtemps par défaut. */
    duration?: number;
}

interface ToastState {
    id: number;
    message: string;
    tone: ToastTone;
}

interface ToastApi {
    /** Affiche une notification éphémère et non bloquante. */
    show: (message: string, options?: ToastOptions) => void;
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_ICON: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
};

const DEFAULT_DURATION: Record<ToastTone, number> = {
    success: 2600,
    // Un échec demande plus de temps de lecture qu'une confirmation.
    error: 4200,
    info: 3200,
};

/**
 * Notifications éphémères, en remplacement des `Alert.alert` de simple
 * confirmation : celles-ci interrompaient le marchand pour chaque succès et
 * devaient être acquittées une par une, ce qui est coûteux au comptoir entre
 * deux commandes. Les confirmations destructives restent des Alert natives.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nextId = useRef(0);

    const clearTimer = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    const show = useCallback((message: string, options?: ToastOptions) => {
        const tone = options?.tone ?? 'info';
        clearTimer();
        nextId.current += 1;
        setToast({ id: nextId.current, message, tone });

        Haptics.notificationAsync(
            tone === 'error'
                ? Haptics.NotificationFeedbackType.Error
                : Haptics.NotificationFeedbackType.Success
        ).catch(() => {});

        timer.current = setTimeout(
            () => setToast(null),
            options?.duration ?? DEFAULT_DURATION[tone]
        );
    }, [clearTimer]);

    // Un toast encore programmé après démontage laisserait un timer orphelin.
    useEffect(() => clearTimer, [clearTimer]);

    const api = useMemo<ToastApi>(() => ({
        show,
        success: (message: string) => show(message, { tone: 'success' }),
        error: (message: string) => show(message, { tone: 'error' }),
    }), [show]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {toast && (
                <ToastView
                    key={toast.id}
                    message={toast.message}
                    tone={toast.tone}
                    onDismiss={() => {
                        clearTimer();
                        setToast(null);
                    }}
                />
            )}
        </ToastContext.Provider>
    );
}

function ToastView({
    message,
    tone,
    onDismiss,
}: {
    message: string;
    tone: ToastTone;
    onDismiss: () => void;
}) {
    const theme = useTheme();
    const accent = tone === 'success' ? theme.success : tone === 'error' ? theme.error : theme.primary;

    return (
        <SafeAreaView style={styles.host} edges={['top']} pointerEvents="box-none">
            <Animated.View
                entering={FadeInUp.duration(Duration.normal)}
                exiting={FadeOutUp.duration(Duration.normal)}
                style={[styles.toast, { backgroundColor: theme.surface, borderColor: accent }]}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
            >
                <Ionicons name={TONE_ICON[tone]} size={20} color={accent} />
                <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>
                    {message}
                </Text>
                <TouchableOpacity
                    onPress={onDismiss}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Fermer la notification"
                    style={styles.dismiss}
                >
                    <Ionicons name="close" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const styles = StyleSheet.create({
    host: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: ZIndex.toast,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        maxWidth: 520,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    message: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 19 },
    dismiss: { width: TouchTarget.min / 2, alignItems: 'flex-end' },
});
