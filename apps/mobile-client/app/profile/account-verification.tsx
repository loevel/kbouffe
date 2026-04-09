import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface VerificationItem {
    id: 'password' | 'two_factor' | 'phone' | 'email';
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    completed: boolean;
    action: () => void;
}

export default function AccountVerificationScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';

    const [items, setItems] = useState<VerificationItem[]>([]);

    useEffect(() => {
        setItems([
            {
                id: 'password',
                title: 'Mots de passe',
                subtitle: 'Créer une clé d\'identification',
                icon: 'key-outline',
                color: '#a855f7',
                completed: false,
                action: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/profile/security');
                },
            },
            {
                id: 'two_factor',
                title: 'Validation en deux étapes',
                subtitle: 'Activer la validation en deux étapes',
                icon: 'shield-checkmark-outline',
                color: '#06b6d4',
                completed: false,
                action: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Prochainement', 'La validation en deux étapes sera bientôt disponible.');
                },
            },
            {
                id: 'phone',
                title: 'Numéro de téléphone',
                subtitle: user?.phone ?? '+237 6XX XXX XXX',
                icon: 'call-outline',
                color: '#10b981',
                completed: !!user?.phone,
                action: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/profile/edit');
                },
            },
            {
                id: 'email',
                title: 'Adresse courriel',
                subtitle: user?.email ?? 'Aucun email',
                icon: 'mail-outline',
                color: '#3b82f6',
                completed: !!user?.email,
                action: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/profile/edit');
                },
            },
        ]);
    }, [user, router]);

    const completedCount = items.filter(item => item.completed).length;
    const completionPercentage = Math.round((completedCount / items.length) * 100);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backButton, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Vérification du compte</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={[styles.descriptionBox, { backgroundColor: theme.surface }]}>
                <View style={[styles.descriptionIcon, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="shield-outline" size={24} color={theme.primary} />
                </View>
                <Text style={[styles.descriptionTitle, { color: theme.text }]}>Sécurisez votre compte</Text>
                <Text style={[styles.descriptionText, { color: theme.icon }]}>
                    Vous avez recommandé des mesures à prendre pour améliorer votre expérience avec kBouffe et renforcer la sécurité de votre compte.
                </Text>
            </Animated.View>

            {/* Progress section */}
            <Animated.View entering={FadeInDown.delay(150).duration(400).springify()} style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: theme.icon }]}>Progression</Text>
                    <Text style={[styles.progressPercentage, { color: theme.primary }]}>{completionPercentage}%</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { backgroundColor: theme.primary, width: `${completionPercentage}%` }
                        ]}
                    />
                </View>
                <Text style={[styles.progressText, { color: theme.icon }]}>
                    {completedCount} sur {items.length} éléments complétés
                </Text>
            </Animated.View>

            {/* Items */}
            <View style={styles.itemsSection}>
                {items.map((item, index) => (
                    <Animated.View
                        key={item.id}
                        entering={FadeInDown.delay(200 + index * 50).duration(400).springify()}
                    >
                        <Pressable
                            style={[
                                styles.itemCard,
                                { backgroundColor: theme.surface },
                                item.completed && { opacity: 0.7 }
                            ]}
                            onPress={item.action}
                            disabled={item.completed}
                        >
                            <View style={styles.itemLeft}>
                                <View style={[styles.itemIcon, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemTitle, { color: theme.text }]}>
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.itemSubtitle, { color: theme.icon }]}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                            </View>
                            {item.completed ? (
                                <View style={[styles.completedBadge, { backgroundColor: '#10b98115' }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                                </View>
                            ) : (
                                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                            )}
                        </Pressable>
                    </Animated.View>
                ))}
            </View>

            {/* Benefits section */}
            <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} style={styles.benefitsSection}>
                <Text style={[styles.benefitsTitle, { color: theme.text }]}>Avantages</Text>
                <View style={[styles.benefitsCard, { backgroundColor: theme.surface }]}>
                    {[
                        { icon: 'lock-closed', text: 'Protégez votre compte', color: '#10b981' },
                        { icon: 'notifications', text: 'Recevez des alertes de sécurité', color: '#f59e0b' },
                        { icon: 'person-add', text: 'Partagez votre profil en toute sécurité', color: '#06b6d4' },
                    ].map((benefit, i, arr) => (
                        <View
                            key={i}
                            style={[
                                styles.benefitRow,
                                i !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                            ]}
                        >
                            <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '15' }]}>
                                <Ionicons name={benefit.icon as any} size={16} color={benefit.color} />
                            </View>
                            <Text style={[styles.benefitText, { color: theme.text }]}>
                                {benefit.text}
                            </Text>
                        </View>
                    ))}
                </View>
            </Animated.View>

            {/* Skip button */}
            <View style={styles.skipSection}>
                <Pressable
                    style={[styles.skipButton, { borderColor: theme.border }]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        router.back();
                    }}
                >
                    <Text style={[styles.skipButtonText, { color: theme.icon }]}>Ignorer pour le moment</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: { ...Typography.title3 },

    // Description
    descriptionBox: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
        borderRadius: Radii.xl,
        alignItems: 'center',
        ...Shadows.sm,
    },
    descriptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    descriptionTitle: {
        ...Typography.title2,
        marginBottom: Spacing.xs,
    },
    descriptionText: {
        ...Typography.body,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Progress
    progressSection: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.lg,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    progressLabel: {
        ...Typography.caption,
        fontWeight: '600',
    },
    progressPercentage: {
        ...Typography.bodySemibold,
    },
    progressBar: {
        height: 8,
        borderRadius: Radii.full,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: {
        height: '100%',
        borderRadius: Radii.full,
    },
    progressText: {
        ...Typography.caption,
        marginTop: Spacing.xs,
    },

    // Items
    itemsSection: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.lg,
        gap: Spacing.md,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radii.xl,
        ...Shadows.sm,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.md,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        ...Typography.bodySemibold,
        marginBottom: 2,
    },
    itemSubtitle: {
        ...Typography.small,
    },
    completedBadge: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Benefits
    benefitsSection: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.lg,
    },
    benefitsTitle: {
        ...Typography.bodySemibold,
        marginBottom: Spacing.sm,
    },
    benefitsCard: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
    },
    benefitIcon: {
        width: 32,
        height: 32,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitText: {
        ...Typography.body,
        flex: 1,
    },

    // Skip button
    skipSection: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.xl,
    },
    skipButton: {
        height: 48,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    skipButtonText: {
        ...Typography.bodySemibold,
    },
});
