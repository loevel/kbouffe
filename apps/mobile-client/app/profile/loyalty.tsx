import { Pressable, ScrollView, StyleSheet, Text, View, Share } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radii, Spacing, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLoyalty } from '@/contexts/loyalty-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const AnimatedView = Animated.View;

export default function LoyaltyScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const {
        favoriteRestaurantIds,
        favoriteProductIds,
        referralCode,
        referralInvites,
        referralRewards,
        registerReferralReward,
    } = useLoyalty();

    const referralLink = `https://kbouffe.com/r/${referralCode}`;

    const handleShareReferral = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Share.share({
                message: `Rejoins Kbouffe ! Utilise mon lien pour t'inscrire et profiter d'offres exclusives 🍽️ ${referralLink}`,
            });
        } catch {
            await Linking.openURL(referralLink);
        }
    };

    const handleCopyCode = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await Clipboard.setStringAsync(referralCode ?? '');
        } catch { /* clipboard not available */ }
    };

    const favStats = [
        {
            icon: 'restaurant-outline' as const,
            color: '#f59e0b',
            label: 'Restaurants favoris',
            value: favoriteRestaurantIds.length,
        },
        {
            icon: 'heart-outline' as const,
            color: '#ec4899',
            label: 'Plats favoris',
            value: favoriteProductIds.length,
        },
    ];

    const referralStats = [
        {
            icon: 'people-outline' as const,
            color: '#3b82f6',
            label: 'Invitations envoyées',
            value: referralInvites.toString(),
        },
        {
            icon: 'gift-outline' as const,
            color: '#10b981',
            label: 'Récompenses totales',
            value: `${referralRewards.toLocaleString()} FCFA`,
            highlight: true,
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Fidélisation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Favorites card */}
                <AnimatedView
                    entering={FadeInDown.delay(100).duration(400).springify()}
                    style={[styles.sectionCard, { backgroundColor: theme.surface }]}
                >
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconBox, { backgroundColor: '#f59e0b15' }]}>
                            <Ionicons name="star" size={18} color="#f59e0b" />
                        </View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Mes favoris</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        {favStats.map((stat, i) => (
                            <Pressable
                                key={stat.label}
                                style={({ pressed }) => [
                                    styles.statCard,
                                    { backgroundColor: isDark ? '#ffffff06' : '#f8fafc', borderColor: theme.border + '40' },
                                    pressed && { opacity: 0.85 },
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    router.push('/profile/favorites');
                                }}
                            >
                                <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                                </View>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: theme.icon }]}>{stat.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </AnimatedView>

                {/* Referral card */}
                <AnimatedView
                    entering={FadeInDown.delay(200).duration(400).springify()}
                    style={[styles.sectionCard, { backgroundColor: theme.surface }]}
                >
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconBox, { backgroundColor: '#a855f715' }]}>
                            <Ionicons name="gift" size={18} color="#a855f7" />
                        </View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Parrainage</Text>
                    </View>

                    <Text style={[styles.referralDesc, { color: theme.icon }]}>
                        Invitez vos amis et gagnez des récompenses à chaque inscription !
                    </Text>

                    {/* Referral code box */}
                    <Pressable
                        onPress={handleCopyCode}
                        style={({ pressed }) => [
                            styles.codeBox,
                            {
                                backgroundColor: theme.primary + '08',
                                borderColor: theme.primary + '25',
                            },
                            pressed && { opacity: 0.8 },
                        ]}
                    >
                        <View>
                            <Text style={[styles.codeLabel, { color: theme.icon }]}>Votre code de parrainage</Text>
                            <Text style={[styles.codeText, { color: theme.primary }]}>{referralCode}</Text>
                        </View>
                        <View style={[styles.copyBtn, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="copy-outline" size={18} color={theme.primary} />
                        </View>
                    </Pressable>

                    {/* Referral stats */}
                    <View style={styles.statsGrid}>
                        {referralStats.map((stat) => (
                            <View
                                key={stat.label}
                                style={[
                                    styles.statCard,
                                    { backgroundColor: isDark ? '#ffffff06' : '#f8fafc', borderColor: theme.border + '40' },
                                ]}
                            >
                                <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                                </View>
                                <Text style={[styles.statValue, { color: stat.highlight ? theme.primary : theme.text }]}>
                                    {stat.value}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.icon }]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionButtons}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                { backgroundColor: theme.primary },
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                            ]}
                            onPress={handleShareReferral}
                        >
                            <Ionicons name="share-social-outline" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>Partager mon lien</Text>
                        </Pressable>
                    </View>
                </AnimatedView>

                {/* Benefits info */}
                <AnimatedView
                    entering={FadeInDown.delay(300).duration(400).springify()}
                    style={[styles.infoCard, { backgroundColor: isDark ? '#10b98110' : '#f0fdf4', borderColor: '#10b98130' }]}
                >
                    <Ionicons name="sparkles" size={20} color="#10b981" />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoTitle, { color: isDark ? '#10b981' : '#047857' }]}>Comment ça marche ?</Text>
                        <Text style={[styles.infoText, { color: isDark ? '#a7f3d0' : '#065f46' }]}>
                            Partagez le lien à vos proches. Pour chaque inscription validée, vous recevez une récompense directement dans votre solde.
                        </Text>
                    </View>
                </AnimatedView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...Typography.title3 },

    /* Section card */
    sectionCard: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radii.xl,
        gap: Spacing.md,
        ...Shadows.sm,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sectionIconBox: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: { ...Typography.bodySemibold, fontWeight: '700' },

    /* Stats grid */
    statsGrid: { flexDirection: 'row', gap: Spacing.sm },
    statCard: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
        alignItems: 'center',
        gap: 6,
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: { ...Typography.title3, fontWeight: '800' },
    statLabel: { ...Typography.small, textAlign: 'center', fontWeight: '500' },

    /* Referral */
    referralDesc: { ...Typography.body, lineHeight: 22, marginTop: -Spacing.xs },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    codeLabel: { ...Typography.small, fontWeight: '500', marginBottom: 2 },
    codeText: { ...Typography.title3, fontWeight: '800', letterSpacing: 2 },
    copyBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Action buttons */
    actionButtons: { gap: Spacing.sm },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radii.full,
    },
    primaryBtnText: { color: '#fff', ...Typography.bodySemibold, fontWeight: '700' },

    /* Info card */
    infoCard: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    infoTitle: { ...Typography.captionSemibold, fontWeight: '700', marginBottom: 2 },
    infoText: { ...Typography.caption, lineHeight: 20 },
});
