import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { usePermission } from '@/hooks/use-permission';
import { getMemberRoleLabel } from '@/lib/member-role';
import { Springs } from '@/constants/theme';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface OverviewOrder {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_amount: number;
    created_at: string;
    delivery_type: 'delivery' | 'pickup' | 'dine_in';
    customer_name: string | null;
}

interface OverviewData {
    todayRevenue: number;
    todayOrdersCount: number;
    activeOrdersCount: number;
    cancelledOrdersCount: number;
    menuItemsCount: number;
    unavailableItemsCount: number;
    categoriesCount: number;
    recentOrders: OverviewOrder[];
}

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'delivering'];

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: 'En attente', color: '#d97706' },
    accepted: { label: 'Acceptée', color: '#2563eb' },
    preparing: { label: 'Préparation', color: '#7c3aed' },
    ready: { label: 'Prête', color: '#16a34a' },
    delivering: { label: 'Livraison', color: '#0891b2' },
    delivered: { label: 'Livrée', color: '#64748b' },
    cancelled: { label: 'Annulée', color: '#dc2626' },
};

function SpringCard({
    children,
    onPress,
    style,
}: {
    children: React.ReactNode;
    onPress: () => void;
    style?: object;
}) {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={[animStyle, style]}>
            <Pressable
                onPress={onPress}
                onPressIn={() => {
                    scale.value = withSpring(0.96, Springs.snappy);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                onPressOut={() => {
                    scale.value = withSpring(1, Springs.snappy);
                }}
                style={{ flex: 1 }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

function MetricCard({
    label,
    value,
    accent,
    subtitle,
}: {
    label: string;
    value: string;
    accent: string;
    subtitle: string;
}) {
    const theme = useTheme();

    return (
        <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.metricAccent, { backgroundColor: accent }]} />
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.metricSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
    );
}

export default function OverviewScreen() {
    const { profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const canSeeFinances = usePermission('finances:read');
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOverview = useCallback(async () => {
        if (!profile?.restaurantId) return;

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const [
            todayOrdersRes,
            activeOrdersRes,
            recentOrdersRes,
            productsCountRes,
            unavailableProductsRes,
            categoriesCountRes,
        ] = await Promise.all([
            supabase
                .from('orders')
                .select(`
                    id,
                    status,
                    total_amount,
                    created_at
                `)
                .eq('restaurant_id', profile.restaurantId)
                .gte('created_at', start.toISOString()),
            supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', profile.restaurantId)
                .in('status', ACTIVE_STATUSES),
            supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    status,
                    total_amount,
                    created_at,
                    delivery_type,
                    users!customer_id(name)
                `)
                .eq('restaurant_id', profile.restaurantId)
                .order('created_at', { ascending: false })
                .limit(4),
            supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', profile.restaurantId),
            supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', profile.restaurantId)
                .eq('is_available', false),
            supabase
                .from('categories')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', profile.restaurantId),
        ]);

        const todayOrders = (todayOrdersRes.data ?? []) as { status: OrderStatus; total_amount: number; created_at: string }[];
        const deliveredToday = todayOrders.filter((order) => order.status === 'delivered');
        const recentOrders = (recentOrdersRes.data ?? []) as any[];

        setOverview({
            todayRevenue: deliveredToday.reduce((sum, order) => sum + (order.total_amount ?? 0), 0),
            todayOrdersCount: todayOrders.length,
            activeOrdersCount: activeOrdersRes.count ?? 0,
            cancelledOrdersCount: todayOrders.filter((order) => order.status === 'cancelled').length,
            menuItemsCount: productsCountRes.count ?? 0,
            unavailableItemsCount: unavailableProductsRes.count ?? 0,
            categoriesCount: categoriesCountRes.count ?? 0,
            recentOrders: recentOrders.map((order) => ({
                id: order.id,
                order_number: order.order_number,
                status: order.status,
                total_amount: order.total_amount ?? 0,
                created_at: order.created_at,
                delivery_type: order.delivery_type,
                customer_name: order.users?.name ?? null,
            })),
        });
    }, [profile?.restaurantId]);

    useEffect(() => {
        fetchOverview().finally(() => setLoading(false));
    }, [fetchOverview]);

    const alerts = useMemo(() => {
        if (!overview) return [];

        const nextAlerts: { icon: keyof typeof Ionicons.glyphMap; label: string; tone: string }[] = [];

        if (overview.activeOrdersCount > 0) {
            nextAlerts.push({
                icon: 'timer-outline',
                label: `${overview.activeOrdersCount} commande${overview.activeOrdersCount > 1 ? 's' : ''} à traiter`,
                tone: theme.warning,
            });
        }

        if (overview.unavailableItemsCount > 0) {
            nextAlerts.push({
                icon: 'restaurant-outline',
                label: `${overview.unavailableItemsCount} article${overview.unavailableItemsCount > 1 ? 's' : ''} indisponible${overview.unavailableItemsCount > 1 ? 's' : ''}`,
                tone: theme.error,
            });
        }

        if (overview.menuItemsCount === 0) {
            nextAlerts.push({
                icon: 'add-circle-outline',
                label: 'Ajoutez vos premiers produits au menu',
                tone: theme.primary,
            });
        }

        if (nextAlerts.length === 0) {
            nextAlerts.push({
                icon: 'checkmark-circle-outline',
                label: 'Tout est sous contrôle pour le moment',
                tone: theme.success,
            });
        }

        return nextAlerts;
    }, [overview, theme.error, theme.primary, theme.success, theme.warning]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOverview();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.heroHeader}>
                        <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {profile?.restaurantName?.[0] ?? 'K'}
                            </Text>
                        </View>
                        <View style={styles.heroText}>
                            <Text style={[styles.heroTitle, { color: theme.text }]}>{profile?.restaurantName ?? 'Mon restaurant'}</Text>
                            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                                {getMemberRoleLabel(profile?.memberRole)} · Vue gestionnaire mobile
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="phone-portrait-outline" size={16} color={theme.primary} />
                        <Text style={[styles.statusPillText, { color: theme.primary }]}>Pilotage rapide du restaurant</Text>
                    </View>
                </View>

                <View style={styles.metricsGrid}>
                    {canSeeFinances && (
                        <MetricCard
                            label="CA du jour"
                            value={`${(overview?.todayRevenue ?? 0).toLocaleString()} F`}
                            subtitle={`${overview?.todayOrdersCount ?? 0} commande${overview?.todayOrdersCount && overview.todayOrdersCount > 1 ? 's' : ''} aujourd'hui`}
                            accent={theme.success}
                        />
                    )}
                    <MetricCard
                        label="Commandes en cours"
                        value={String(overview?.activeOrdersCount ?? 0)}
                        subtitle={`${overview?.cancelledOrdersCount ?? 0} annulation${overview?.cancelledOrdersCount && overview.cancelledOrdersCount > 1 ? 's' : ''} aujourd'hui`}
                        accent={theme.warning}
                    />
                    <MetricCard
                        label="Produits au menu"
                        value={String(overview?.menuItemsCount ?? 0)}
                        subtitle={`${overview?.categoriesCount ?? 0} catégorie${overview?.categoriesCount && overview.categoriesCount > 1 ? 's' : ''}`}
                        accent={theme.primary}
                    />
                    <MetricCard
                        label="Produits indisponibles"
                        value={String(overview?.unavailableItemsCount ?? 0)}
                        subtitle="Mettez le menu à jour rapidement"
                        accent={theme.error}
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions rapides</Text>
                    </View>
                    <View style={styles.quickActions}>
                        {[
                            { label: 'Voir les commandes', icon: 'receipt-outline', href: '/(tabs)/orders' },
                            { label: 'Écran cuisine', icon: 'layers-outline', href: '/kitchen' },
                            { label: 'Gérer le menu', icon: 'restaurant-outline', href: '/(tabs)/menu' },
                            { label: 'Consulter les stats', icon: 'bar-chart-outline', href: '/(tabs)/stats' },
                        ].map((action) => (
                            <SpringCard
                                key={action.label}
                                style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
                                onPress={() => router.push(action.href as never)}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: theme.primaryLight }]}>
                                    <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={20} color={theme.primary} />
                                </View>
                                <Text style={[styles.quickActionLabel, { color: theme.text }]}>{action.label}</Text>
                            </SpringCard>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Priorités du moment</Text>
                    </View>
                    <View style={styles.alertList}>
                        {alerts.map((alert) => (
                            <View key={alert.label} style={[styles.alertCard, { backgroundColor: theme.surface }]}>
                                <View style={[styles.alertIcon, { backgroundColor: `${alert.tone}22` }]}>
                                    <Ionicons name={alert.icon} size={18} color={alert.tone} />
                                </View>
                                <Text style={[styles.alertText, { color: theme.text }]}>{alert.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dernières commandes</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                            <Text style={[styles.linkText, { color: theme.primary }]}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {overview?.recentOrders.length ? (
                        <View style={styles.orderList}>
                            {overview.recentOrders.map((order) => {
                                const statusMeta = STATUS_META[order.status];
                                const deliveryLabel = order.delivery_type === 'delivery'
                                    ? 'Livraison'
                                    : order.delivery_type === 'pickup'
                                        ? 'À emporter'
                                        : 'Sur place';

                                return (
                                    <SpringCard
                                        key={order.id}
                                        style={[styles.orderCard, { backgroundColor: theme.surface }]}
                                        onPress={() => router.push(`/order/${order.id}`)}
                                    >
                                        <View style={styles.orderTopRow}>
                                            <View>
                                                <Text style={[styles.orderNumber, { color: theme.text }]}>#{order.order_number}</Text>
                                                <Text style={[styles.orderMeta, { color: theme.textSecondary }]}>
                                                    {order.customer_name ?? 'Client'} · {deliveryLabel}
                                                </Text>
                                            </View>
                                            <View style={[styles.orderBadge, { backgroundColor: `${statusMeta.color}22` }]}>
                                                <Text style={[styles.orderBadgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.orderBottomRow}>
                                            <Text style={[styles.orderMeta, { color: theme.textSecondary }]}>
                                                {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <Text style={[styles.orderAmount, { color: theme.text }]}>{order.total_amount.toLocaleString()} FCFA</Text>
                                        </View>
                                    </SpringCard>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                            <Text style={styles.emptyEmoji}>📦</Text>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune commande récente</Text>
                            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                                Les nouvelles commandes apparaîtront ici pour un suivi rapide.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, gap: 16, paddingBottom: 28 },
    hero: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        gap: 16,
    },
    heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 24, fontWeight: '800' },
    heroText: { flex: 1 },
    heroTitle: { fontSize: 22, fontWeight: '800' },
    heroSubtitle: { fontSize: 13, marginTop: 3 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
    },
    statusPillText: { fontSize: 12, fontWeight: '700' },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metricCard: {
        width: '47%',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    metricAccent: {
        width: 36,
        height: 4,
        borderRadius: 999,
        marginBottom: 2,
    },
    metricLabel: { fontSize: 12, fontWeight: '600' },
    metricValue: { fontSize: 22, fontWeight: '800' },
    metricSubtitle: { fontSize: 12, lineHeight: 17 },
    section: { gap: 12 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: { fontSize: 17, fontWeight: '800' },
    linkText: { fontSize: 13, fontWeight: '700' },
    quickActions: { flexDirection: 'row', gap: 10 },
    quickActionCard: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        gap: 10,
    },
    quickActionIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
    alertList: { gap: 10 },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 16,
        padding: 14,
    },
    alertIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
    orderList: { gap: 10 },
    orderCard: {
        borderRadius: 16,
        padding: 14,
        gap: 12,
    },
    orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    orderBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderNumber: { fontSize: 15, fontWeight: '800' },
    orderMeta: { fontSize: 12, marginTop: 2 },
    orderBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    orderBadgeText: { fontSize: 11, fontWeight: '800' },
    orderAmount: { fontSize: 14, fontWeight: '800' },
    emptyState: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    emptyEmoji: { fontSize: 38, marginBottom: 10 },
    emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
    emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
