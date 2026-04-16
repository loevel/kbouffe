import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, getErrorMessage } from '@/lib/api';
import {
    type CountBreakdown,
    type DashboardPeriod,
    type DashboardStatsResponse,
    type RevenueBreakdown,
    type RevenuePoint,
    PERIOD_OPTIONS,
    formatFcfa,
    formatPercent,
    toApiPeriod,
} from '@/lib/dashboard-analytics';

const EMPTY_STATS: DashboardStatsResponse['stats'] = {
    revenue: { today: 0, week: 0, month: 0 },
    orders: { today: 0, pending: 0, active: 0, completed: 0, cancelled: 0, total: 0 },
    averageOrderValue: 0,
    totalCustomers: 0,
    completionRate: 0,
    cancellationRate: 0,
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#d97706',
    accepted: '#2563eb',
    preparing: '#7c3aed',
    ready: '#16a34a',
    out_for_delivery: '#0891b2',
    delivering: '#0891b2',
    delivered: '#64748b',
    completed: '#64748b',
    cancelled: '#dc2626',
    refunded: '#b45309',
};

function StatCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}) {
    const theme = useTheme();
    const s = styles(theme);
    return (
        <View style={[s.card, { borderColor: theme.border }]}>
            <View style={[s.iconWrap, { backgroundColor: `${color}1A` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={[s.cardValue, { color: theme.text }]} numberOfLines={1}>
                {value}
            </Text>
            <Text style={[s.cardLabel, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
}

function RevenueChart({
    points,
}: {
    points: RevenuePoint[];
}) {
    const theme = useTheme();
    const s = styles(theme);
    const maxValue = Math.max(...points.map((point) => point.value), 1);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Tendance du chiffre d&apos;affaires</Text>
            {points.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 10 }]}>Aucune donnée sur la période.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chartRow}>
                    {points.map((point, index) => {
                        const height = Math.max(4, Math.round((point.value / maxValue) * 130));
                        return (
                            <View key={`${point.label}-${index}`} style={s.chartItem}>
                                <Text style={s.chartValue}>{point.value > 0 ? point.value.toLocaleString('fr-FR') : '0'}</Text>
                                <View style={s.chartTrack}>
                                    <View style={[s.chartBar, { height }]} />
                                </View>
                                <Text style={s.chartLabel}>{point.label}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

function StatusBreakdown({
    rows,
}: {
    rows: CountBreakdown[];
}) {
    const theme = useTheme();
    const s = styles(theme);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Répartition des statuts</Text>
            {rows.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 10 }]}>Aucune commande à répartir.</Text>
            ) : (
                <View style={s.breakdownList}>
                    {rows.map((row) => {
                        const color = STATUS_COLORS[row.key] ?? theme.primary;
                        return (
                            <View key={row.key} style={s.breakdownRow}>
                                <View style={s.breakdownHeader}>
                                    <Text style={s.breakdownLabel}>{row.label}</Text>
                                    <Text style={s.breakdownMeta}>
                                        {row.count} · {formatPercent(row.percentage)}
                                    </Text>
                                </View>
                                <View style={s.progressTrack}>
                                    <View style={[s.progressBar, { width: `${Math.max(row.percentage, 3)}%`, backgroundColor: color }]} />
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

function DeliveryBreakdown({
    rows,
}: {
    rows: RevenueBreakdown[];
}) {
    const theme = useTheme();
    const s = styles(theme);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Canaux de commande</Text>
            {rows.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 10 }]}>Aucune donnée canal sur la période.</Text>
            ) : (
                <View style={s.deliveryList}>
                    {rows.map((row) => (
                        <View key={row.key} style={s.deliveryRow}>
                            <Text style={s.deliveryLabel}>{row.label}</Text>
                            <Text style={s.deliveryMeta}>
                                {row.count} commandes · {formatFcfa(row.revenue)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

function PeakHoursChart({
    hours,
}: {
    hours: Array<{ hour: string; count: number; percentage: number }>;
}) {
    const theme = useTheme();
    const s = styles(theme);
    const maxCount = Math.max(...hours.map((h) => h.count), 1);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Heures de pointe</Text>
            {hours.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 10 }]}>Aucune donnée sur la période.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chartRow}>
                    {hours.map((hour, index) => {
                        const height = Math.max(4, Math.round((hour.count / maxCount) * 100));
                        return (
                            <View key={`${hour.hour}-${index}`} style={s.chartItem}>
                                <Text style={s.chartValue}>{hour.count}</Text>
                                <View style={s.chartTrack}>
                                    <View style={[s.chartBar, { height: `${height}%` }, { backgroundColor: theme.primary }]} />
                                </View>
                                <Text style={s.chartLabel}>{hour.hour}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

function TopProductsList({
    products,
}: {
    products: Array<{ name: string; quantity: number; revenue: number }>;
}) {
    const theme = useTheme();
    const s = styles(theme);
    const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Meilleurs produits</Text>
            {products.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 10 }]}>Aucun produit vendu.</Text>
            ) : (
                <View style={s.productsList}>
                    {products.slice(0, 5).map((product, index) => (
                        <View key={`${product.name}-${index}`} style={s.productRow}>
                            <View style={s.productInfo}>
                                <Text style={s.productName}>{product.name}</Text>
                                <Text style={s.productMeta}>{product.quantity} vendus · {formatFcfa(product.revenue)}</Text>
                            </View>
                            <View style={s.progressTrack}>
                                <View
                                    style={[
                                        s.progressBar,
                                        { width: `${Math.max((product.revenue / maxRevenue) * 100, 4)}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function StatsScreen() {
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [period, setPeriod] = useState<DashboardPeriod>('7d');
    const [payload, setPayload] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!session?.access_token || !profile?.restaurantId) {
            setPayload(null);
            return;
        }

        const result = await apiFetch<DashboardStatsResponse>(
            `/api/dashboard/stats?period=${toApiPeriod(period)}`,
            session.access_token
        );
        setPayload(result);
        setErrorMessage(null);
    }, [period, profile?.restaurantId, session?.access_token]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        fetchStats()
            .catch((error) => {
                if (!mounted) return;
                setErrorMessage(getErrorMessage(error, 'Impossible de charger les statistiques'));
                setPayload(null);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [fetchStats]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchStats();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Impossible d’actualiser les statistiques'));
        } finally {
            setRefreshing(false);
        }
    }, [fetchStats]);

    const stats = useMemo(() => payload?.stats ?? EMPTY_STATS, [payload]);
    const revenueChart = useMemo(() => payload?.revenueChart ?? [], [payload]);
    const statusBreakdown = useMemo(() => payload?.statusBreakdown ?? [], [payload]);
    const deliveryBreakdown = useMemo(() => payload?.deliveryBreakdown ?? [], [payload]);
    const periodRevenue = useMemo(
        () => revenueChart.reduce((sum, point) => sum + (point.value ?? 0), 0),
        [revenueChart]
    );
    const activeOrders = stats.orders.active ?? stats.orders.pending ?? 0;

    const s = styles(theme);

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <Text style={s.title}>Statistiques</Text>
                <Text style={s.subtitle}>
                    Vue pilotage · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <View style={s.periodRow}>
                    {PERIOD_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[s.periodChip, period === option.id && s.periodChipActive]}
                            onPress={() => setPeriod(option.id)}
                        >
                            <Text style={[s.periodChipText, period === option.id && s.periodChipTextActive]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {errorMessage && (
                    <View style={s.errorCard}>
                        <Ionicons name="alert-circle-outline" size={16} color={theme.error} />
                        <Text style={s.errorText}>{errorMessage}</Text>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
                ) : (
                    <>
                        <View style={s.cardsGrid}>
                            <StatCard label="CA période" value={formatFcfa(periodRevenue)} icon="wallet-outline" color={theme.success} />
                            <StatCard label="Commandes" value={String(stats.orders.total)} icon="receipt-outline" color={theme.primary} />
                            <StatCard label="Panier moyen" value={formatFcfa(stats.averageOrderValue)} icon="pricetag-outline" color="#0ea5e9" />
                            <StatCard label="En cours" value={String(activeOrders)} icon="time-outline" color={theme.warning} />
                            <StatCard label="Taux annulation" value={formatPercent(stats.cancellationRate ?? 0)} icon="close-circle-outline" color={theme.error} />
                            <StatCard label="Clients uniques" value={String(stats.totalCustomers)} icon="people-outline" color="#14b8a6" />
                        </View>

                        <RevenueChart points={revenueChart} />
                        <StatusBreakdown rows={statusBreakdown} />
                        <DeliveryBreakdown rows={deliveryBreakdown} />

                        {payload?.peakHours && payload.peakHours.length > 0 && (
                            <PeakHoursChart hours={payload.peakHours} />
                        )}

                        {payload?.topProducts && payload.topProducts.length > 0 && (
                            <TopProductsList products={payload.topProducts} />
                        )}

                        <TouchableOpacity
                            style={s.reportCta}
                            onPress={() => router.push(`/reports?period=${period}`)}
                        >
                            <View style={s.reportCtaLeft}>
                                <Ionicons name="document-text-outline" size={18} color="#fff" />
                                <Text style={s.reportCtaText}>Voir les rapports détaillés</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        title: { fontSize: 22, fontWeight: '700', color: theme.text },
        subtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        scroll: { padding: 14, gap: 12, paddingBottom: 24 },
        periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        periodChip: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 999,
            paddingVertical: 7,
            paddingHorizontal: 12,
            backgroundColor: theme.surface,
        },
        periodChipActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        periodChipText: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
        periodChipTextActive: { color: '#fff' },
        errorCard: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: `${theme.error}55`,
            backgroundColor: `${theme.error}14`,
        },
        errorText: { color: theme.error, fontSize: 12, flex: 1 },
        cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        card: {
            flexBasis: '48%',
            flexGrow: 1,
            borderWidth: 1,
            borderRadius: 14,
            padding: 12,
            backgroundColor: theme.surface,
            minHeight: 92,
        },
        iconWrap: {
            width: 28,
            height: 28,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        cardValue: { fontSize: 16, fontWeight: '800' },
        cardLabel: { marginTop: 4, fontSize: 12 },
        sectionCard: {
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            padding: 12,
        },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        chartRow: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 2 },
        chartItem: { width: 36, alignItems: 'center' },
        chartValue: { fontSize: 10, color: theme.textSecondary, marginBottom: 4 },
        chartTrack: {
            width: 18,
            height: 130,
            borderRadius: 999,
            justifyContent: 'flex-end',
            backgroundColor: theme.background,
            overflow: 'hidden',
        },
        chartBar: {
            width: '100%',
            backgroundColor: theme.primary,
            borderRadius: 999,
        },
        chartLabel: { marginTop: 6, fontSize: 10, color: theme.textSecondary },
        breakdownList: { marginTop: 12, gap: 10 },
        breakdownRow: { gap: 6 },
        breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        breakdownLabel: { fontSize: 12, fontWeight: '600', color: theme.text },
        breakdownMeta: { fontSize: 11, color: theme.textSecondary },
        progressTrack: {
            height: 8,
            borderRadius: 999,
            backgroundColor: theme.background,
            overflow: 'hidden',
        },
        progressBar: { height: '100%', borderRadius: 999 },
        deliveryList: { marginTop: 10, gap: 8 },
        deliveryRow: {
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: theme.background,
        },
        deliveryLabel: { fontSize: 12, fontWeight: '700', color: theme.text },
        deliveryMeta: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        emptyText: { fontSize: 12, color: theme.textSecondary },
        reportCta: {
            marginTop: 2,
            borderRadius: 12,
            backgroundColor: theme.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 12,
        },
        reportCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        reportCtaText: { color: '#fff', fontSize: 13, fontWeight: '700' },
        productsList: { marginTop: 12, gap: 10 },
        productRow: { gap: 8 },
        productInfo: { gap: 2 },
        productName: { fontSize: 12, fontWeight: '600', color: theme.text },
        productMeta: { fontSize: 11, color: theme.textSecondary },
    });
