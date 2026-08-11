import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { TouchTarget } from '@/constants/theme';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    /** Ligne d'explication ou d'incitation à l'action. */
    message?: string;
    action?: { label: string; onPress: () => void };
    style?: object;
}

/**
 * État vide. Utilise une icône Ionicons plutôt que les émojis (📦 💬 🍽️ 📋 🔔)
 * employés jusqu'ici : ceux-ci se rendaient différemment selon la police
 * système et ne pouvaient pas prendre la couleur du thème.
 */
export function EmptyState({ icon, title, message, action, style }: EmptyStateProps) {
    const theme = useTheme();

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.textSecondary}1a` }]}>
                <Ionicons name={icon} size={30} color={theme.textSecondary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
            {action && (
                <TouchableOpacity
                    onPress={action.onPress}
                    style={[styles.action, { backgroundColor: theme.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                >
                    <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 8 },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
    message: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    action: {
        minHeight: TouchTarget.min,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 8,
    },
    actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
