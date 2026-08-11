import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface LoadingStateProps {
    /** Précise ce qui est en cours de chargement — utile aux lecteurs d'écran. */
    label?: string;
    /** `inline` occupe le haut de la zone, `fill` centre dans l'espace restant. */
    variant?: 'inline' | 'fill';
}

export function LoadingState({ label = 'Chargement…', variant = 'inline' }: LoadingStateProps) {
    const theme = useTheme();

    return (
        <View
            style={variant === 'fill' ? styles.fill : styles.inline}
            accessibilityRole="progressbar"
            accessibilityLabel={label}
        >
            <ActivityIndicator size="large" color={theme.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    inline: { marginTop: 40, alignItems: 'center' },
    fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
