import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { TouchTarget } from '@/constants/theme';

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Écran d'échec plein, pour un contenu qui n'a jamais pu être chargé.
 * À distinguer d'ErrorBanner, qui coiffe des données déjà à l'écran.
 */
export function ErrorState({
    title = 'Contenu indisponible',
    message,
    onRetry,
    icon = 'cloud-offline-outline',
}: ErrorStateProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={44} color={theme.error} />
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
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
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 32,
    },
    title: { fontSize: 17, fontWeight: '800' },
    message: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    retry: {
        minHeight: TouchTarget.min,
        justifyContent: 'center',
        paddingHorizontal: 18,
        borderRadius: 10,
        borderWidth: 1,
        marginTop: 4,
    },
    retryText: { fontSize: 13, fontWeight: '700' },
});
