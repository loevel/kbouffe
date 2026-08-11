import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStatusMeta } from '@/lib/order-status';

interface StatusBadgeProps {
    status: string | null | undefined;
    size?: 'small' | 'medium';
}

/**
 * Pastille de statut de commande. Résout libellé et teinte via la source de
 * vérité unique, en s'adaptant au thème clair/sombre.
 */
export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
    const scheme = useColorScheme();
    const meta = getStatusMeta(status, scheme);
    const compact = size === 'small';

    return (
        <View
            style={[
                styles.badge,
                compact ? styles.badgeSmall : styles.badgeMedium,
                { backgroundColor: meta.background },
            ]}
        >
            <Text
                style={[styles.label, compact ? styles.labelSmall : styles.labelMedium, { color: meta.color }]}
                numberOfLines={1}
            >
                {meta.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { borderRadius: 999, alignSelf: 'flex-start' },
    badgeSmall: { paddingHorizontal: 8, paddingVertical: 3 },
    badgeMedium: { paddingHorizontal: 10, paddingVertical: 5 },
    label: { fontWeight: '800' },
    labelSmall: { fontSize: 10 },
    labelMedium: { fontSize: 11 },
});
