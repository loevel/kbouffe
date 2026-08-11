import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { TouchTarget } from '@/constants/theme';

interface ErrorBannerProps {
    message: string;
    /** Omettre pour un bandeau purement informatif, sans action de reprise. */
    onRetry?: () => void;
    style?: object;
}

/**
 * Bandeau d'échec non bloquant, affiché au-dessus de données déjà chargées.
 * Ce motif était copié à l'identique dans une douzaine d'écrans : toute
 * évolution visuelle devait être répercutée fichier par fichier.
 */
export function ErrorBanner({ message, onRetry, style }: ErrorBannerProps) {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.banner,
                { borderColor: theme.error, backgroundColor: `${theme.error}15` },
                style,
            ]}
            accessibilityLiveRegion="polite"
        >
            <Ionicons name="alert-circle" size={18} color={theme.error} />
            <Text style={[styles.message, { color: theme.error }]}>{message}</Text>
            {onRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    style={[styles.retry, { borderColor: theme.error }]}
                    accessibilityRole="button"
                    accessibilityLabel="Réessayer"
                >
                    <Text style={[styles.retryText, { color: theme.error }]}>Réessayer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    message: { flex: 1, fontSize: 13, lineHeight: 18 },
    retry: {
        minHeight: TouchTarget.min,
        justifyContent: 'center',
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
    },
    retryText: { fontSize: 13, fontWeight: '700' },
});
