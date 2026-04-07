import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAvailableOffers, type AppOffer } from '@/lib/api';

const OFFER_ICONS: Record<string, string> = {
    percentage:   'pricetag-outline',
    fixed:        'cash-outline',
    free_delivery: 'bicycle-outline',
    bogo:         'gift-outline',
    loyalty:      'star-outline',
};

const OFFER_COLORS: Record<string, string> = {
    percentage:   '#f59e0b',
    fixed:        '#3b82f6',
    free_delivery: '#10b981',
    bogo:         '#ec4899',
    loyalty:      '#a855f7',
};

function formatExpiry(date: string | null) {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expiré';
    if (diffDays === 0) return 'Expire aujourd\'hui';
    if (diffDays === 1) return 'Expire demain';
    return `Expire dans ${diffDays}j`;
}

export default function OffersScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [offers, setOffers] = useState<AppOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'promotions' | 'loyalty'>('all');

    const loadOffers = useCallback(async () => {
        try {
            const data = await getAvailableOffers();
            setOffers(data);
        } catch {
            // Fallback to empty state
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadOffers(); }, [loadOffers]);

    const copyCode = (code: string) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Code promo', `Votre code : "${code}"\n\nSaisissez-le dans le panier au moment du checkout.`);
    };

    const useOffer = (offer: AppOffer) => {
        void Haptics.selectionAsync();
        if (offer.restaurantSlug) {
            router.push(`/restaurant/${offer.restaurantSlug}`);
        } else {
            router.push('/(tabs)/explore');
        }
    };

    const filtered = offers.filter(o => {
        if (activeTab === 'promotions') return ['percentage', 'fixed', 'free_delivery', 'bogo'].includes(o.type);
        if (activeTab === 'loyalty') return o.type === 'loyalty';
        return true;
    });

    const tabs = [
        { id: 'all' as const, label: 'Toutes' },
        { id: 'promotions' as const, label: 'Promotions' },
        { id: 'loyalty' as const, label: 'Fidélité' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Offres & Promotions</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {tabs.map(tab => (
                    <Pressable
                        key={tab.id}
                        onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                        style={[
                            styles.tab,
                            activeTab === tab.id && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
                        ]}
                    >
                        <Text style={[
                            styles.tabLabel,
                            { color: activeTab === tab.id ? theme.primary : theme.icon },
                        ]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, filtered.length === 0 && styles.emptyContent]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadOffers(); }}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {filtered.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: theme.border + '40' }]}>
                                <Ionicons name="pricetags-outline" size={48} color={theme.icon} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune offre disponible</Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                Revenez plus tard pour découvrir les promotions et offres exclusives Kbouffe.
                            </Text>
                            <Pressable
                                style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
                                onPress={() => router.push('/(tabs)/explore')}
                            >
                                <Text style={styles.exploreBtnText}>Explorer les restaurants</Text>
                            </Pressable>
                        </View>
                    ) : (
                        filtered.map(offer => {
                            const icon = OFFER_ICONS[offer.type] ?? 'pricetag-outline';
                            const color = OFFER_COLORS[offer.type] ?? '#64748b';
                            const expiry = formatExpiry(offer.expiresAt);
                            const isExpired = expiry === 'Expiré';

                            return (
                                <Pressable
                                    key={offer.id}
                                    style={({ pressed }) => [
                                        styles.offerCard,
                                        { backgroundColor: theme.surface, opacity: isExpired ? 0.6 : pressed ? 0.9 : 1 },
                                    ]}
                                    onPress={() => !isExpired && useOffer(offer)}
                                    disabled={isExpired}
                                >
                                    {/* Decorative stripe */}
                                    <View style={[styles.offerStripe, { backgroundColor: color }]} />

                                    <View style={styles.offerContent}>
                                        <View style={styles.offerTop}>
                                            <View style={[styles.offerIconBox, { backgroundColor: color + '18' }]}>
                                                <Ionicons name={icon as any} size={22} color={color} />
                                            </View>
                                            <View style={styles.offerMeta}>
                                                <Text style={[styles.offerTitle, { color: theme.text }]}>{offer.title}</Text>
                                                {offer.restaurantName && (
                                                    <Text style={[styles.offerRestaurant, { color: theme.icon }]}>
                                                        {offer.restaurantName}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={[styles.discountBadge, { backgroundColor: color + '18' }]}>
                                                <Text style={[styles.discountText, { color }]}>{offer.displayValue}</Text>
                                            </View>
                                        </View>

                                        {offer.description && (
                                            <Text style={[styles.offerDesc, { color: theme.icon }]} numberOfLines={2}>
                                                {offer.description}
                                            </Text>
                                        )}

                                        <View style={styles.offerBottom}>
                                            {offer.code ? (
                                                <Pressable
                                                    style={[styles.codeChip, { borderColor: color, backgroundColor: color + '10' }]}
                                                    onPress={(e) => { e.stopPropagation(); copyCode(offer.code!); }}
                                                >
                                                    <Text style={[styles.codeText, { color }]}>{offer.code}</Text>
                                                    <Ionicons name="copy-outline" size={14} color={color} />
                                                </Pressable>
                                            ) : (
                                                <View />
                                            )}
                                            {expiry && (
                                                <View style={[styles.expiryChip, {
                                                    backgroundColor: isExpired ? '#ef444415' : theme.border + '30',
                                                }]}>
                                                    <Ionicons
                                                        name="time-outline"
                                                        size={12}
                                                        color={isExpired ? '#ef4444' : theme.icon}
                                                    />
                                                    <Text style={[styles.expiryText, { color: isExpired ? '#ef4444' : theme.icon }]}>
                                                        {expiry}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {!isExpired && (
                                            <View style={[styles.useCta, { backgroundColor: color + '12', borderColor: color + '30' }]}>
                                                <Text style={[styles.useCtaText, { color }]}>
                                                    {offer.restaurantSlug ? 'Commander maintenant' : 'Utiliser cette offre'}
                                                </Text>
                                                <Ionicons name="arrow-forward" size={14} color={color} />
                                            </View>
                                        )}
                                    </View>
                                </Pressable>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.title3 },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#00000010',
        marginBottom: Spacing.sm,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabLabel: { ...Typography.captionSemibold },
    loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
    emptyContent: { flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.xxl },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 24 },
    exploreBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2, borderRadius: Radii.full, marginTop: Spacing.sm },
    exploreBtnText: { color: '#fff', ...Typography.bodySemibold },
    offerCard: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.sm,
        flexDirection: 'row',
    },
    offerStripe: { width: 5 },
    offerContent: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
    offerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    offerIconBox: { width: 42, height: 42, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
    offerMeta: { flex: 1 },
    offerTitle: { ...Typography.bodySemibold },
    offerRestaurant: { ...Typography.caption, marginTop: 1 },
    discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full },
    discountText: { ...Typography.captionSemibold, fontWeight: '800' },
    offerDesc: { ...Typography.caption, lineHeight: 19 },
    offerBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    codeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: Radii.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    codeText: { ...Typography.caption, fontWeight: '700', letterSpacing: 1 },
    expiryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    expiryText: { fontSize: 11, fontWeight: '500' },
    useCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        borderWidth: 1,
    },
    useCtaText: { ...Typography.caption, fontWeight: '700' },
});
