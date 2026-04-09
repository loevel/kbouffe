import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';

interface EmptyStateProps {
    icon?: string;
    title: string;
    subtitle?: string;
    primaryAction?: {
        label: string;
        onPress: () => void;
    };
    secondaryAction?: {
        label: string;
        onPress: () => void;
    };
}

export function EmptyState({
    icon = 'search-outline',
    title,
    subtitle,
    primaryAction,
    secondaryAction,
}: EmptyStateProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const handlePress = (callback: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        callback();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.border + '20' }]}>
                <Ionicons name={icon as any} size={56} color={theme.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

            {/* Subtitle */}
            {subtitle && (
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {subtitle}
                </Text>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
                {primaryAction && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => handlePress(primaryAction.onPress)}
                    >
                        <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </Pressable>
                )}

                {secondaryAction && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.secondaryButton,
                            { borderColor: theme.border, backgroundColor: theme.surface },
                            pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => handlePress(secondaryAction.onPress)}
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                            {secondaryAction.label}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.bodySemibold,
        fontSize: 18,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.body,
        fontSize: 14,
        marginBottom: Spacing.xl,
        textAlign: 'center',
        maxWidth: '85%',
    },
    actionsContainer: {
        width: '100%',
        gap: Spacing.md,
    },
    primaryButton: {
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        ...Typography.bodySemibold,
        fontSize: 16,
    },
    secondaryButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.xl,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...Typography.bodySemibold,
        fontSize: 16,
    },
});
