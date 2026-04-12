import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, getErrorMessage } from '@/lib/api';
import {
    type DashboardPeriod,
    type DashboardReportsResponse,
    type RevenueBreakdown,
    PERIOD_OPTIONS,
    formatFcfa,
    formatPercent,
    toApiPeriod,
    toDashboardPeriod,
} from '@/lib/dashboard-analytics';

const EMPTY_REPORT: DashboardReportsResponse = {
    period: '30d',
    generatedAt: new Date(0).toISOString(),
    summary: {
        revenue: 0,
        ordersTotal: 0,
        ordersCompleted: 0,
        ordersActive: 0,
        ordersCancelled: 0,
        averageOrderValue: 0,
        completionRate: 0,
        cancellationRate: 0,
        uniqueCustomers: 0,
    },
    timeSeries: [],
    statusBreakdown: [],
    deliveryBreakdown: [],
    paymentBreakdown: [],
    topProducts: [],
    peakHours: [],
};

function exportReportCsv(report: DashboardReportsResponse): string {
    const rows: string[][] = [
        ['Section', 'Indicateur', 'Valeur'],
        ['Synthèse', 'Période', String(report.period)],
        ['Synthèse', 'Chiffre d’affaires', String(report.summary.revenue)],
        ['Synthèse', 'Commandes totales', String(report.summary.ordersTotal)],
        ['Synthèse', 'Commandes terminées', String(report.summary.ordersCompleted)],
        ['Synthèse', 'Commandes actives', String(report.summary.ordersActive)],
        ['Synthèse', 'Commandes annulées', String(report.summary.ordersCancelled)],
        ['Synthèse', 'Panier moyen', String(report.summary.averageOrderValue)],
        ['Synthèse', 'Taux de complétion', String(report.summary.completionRate)],
        ['Synthèse', 'Taux d’annulation', String(report.summary.cancellationRate)],
        ['Synthèse', 'Clients uniques', String(report.summary.uniqueCustomers)],
        [''],
        ['Statuts', 'Libellé', 'Commandes'],
        ...report.statusBreakdown.map((item) => ['Statuts', item.label, String(item.count)]),
        [''],
        ['Canaux', 'Libellé', 'CA'],
        ...report.deliveryBreakdown.map((item) => ['Canaux', item.label, String(item.revenue)]),
        [''],
        ['Paiements', 'Libellé', 'CA'],
        ...report.paymentBreakdown.map((item) => ['Paiements', item.label, String(item.revenue)]),
        [''],
        ['Top Produits', 'Produit', 'Quantité / CA'],
        ...report.topProducts.map((item) => ['Top Produits', item.name, `${item.quantity} / ${item.revenue}`]),
    ];

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    return rows.map((row) => row.map((cell) => escapeCsv(cell)).join(';')).join('\n');
}

function MetricCard({
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
        <View style={s.metricCard}>
            <View style={[s.metricIcon, { backgroundColor: `${color}1A` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={s.metricValue}>{value}</Text>
            <Text style={s.metricLabel}>{label}</Text>
        </View>
    );
}

function BreakdownCard({
    title,
    rows,
}: {
    title: string;
    rows: RevenueBreakdown[];
}) {
    const theme = useTheme();
    const s = styles(theme);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>{title}</Text>
            {rows.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 8 }]}>Aucune donnée disponible.</Text>
            ) : (
                <View style={s.breakdownList}>
                    {rows.map((row) => (
                        <View key={row.key} style={s.breakdownRow}>
                            <View style={s.breakdownTop}>
                                <Text style={s.breakdownLabel}>{row.label}</Text>
                                <Text style={s.breakdownMeta}>{formatFcfa(row.revenue)}</Text>
                            </View>
                            <View style={s.progressTrack}>
                                <View style={[s.progressBar, { width: `${Math.max(row.percentage, 4)}%` }]} />
                            </View>
                            <Text style={s.breakdownMeta}>{row.count} commandes · {formatPercent(row.percentage)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

function StatusBreakdownCard({
    rows,
}: {
    rows: DashboardReportsResponse['statusBreakdown'];
}) {
    const theme = useTheme();
    const s = styles(theme);

    return (
        <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Répartition des statuts</Text>
            {rows.length === 0 ? (
                <Text style={[s.emptyText, { marginTop: 8 }]}>Aucun statut à afficher.</Text>
            ) : (
                <View style={s.breakdownList}>
                    {rows.map((row) => (
                        <View key={row.key} style={s.breakdownRow}>
                            <View style={s.breakdownTop}>
                                <Text style={s.breakdownLabel}>{row.label}</Text>
                                <Text style={s.breakdownMeta}>{row.count} commandes</Text>
                            </View>
                            <View style={s.progressTrack}>
                                <View style={[s.progressBar, { width: `${Math.max(row.percentage, 4)}%` }]} />
                            </View>
                            <Text style={s.breakdownMeta}>{formatPercent(row.percentage)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function ReportsScreen() {
    const params = useLocalSearchParams<{ period?: string }>();
    const initialPeriod = toDashboardPeriod(params.period);
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [period, setPeriod] = useState<DashboardPeriod>(initialPeriod);
    const [payload, setPayload] = useState<DashboardReportsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        if (!session?.access_token || !profile?.restaurantId) {
            setPayload(null);
            return;
        }

        const result = await apiFetch<DashboardReportsResponse>(
            `/api/dashboard/reports?period=${toApiPeriod(period)}`,
            session.access_token
        );
        setPayload(result);
        setErrorMessage(null);
    }, [period, profile?.restaurantId, session?.access_token]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        fetchReports()
            .catch((error) => {
                if (!mounted) return;
                setPayload(null);
                setErrorMessage(getErrorMessage(error, 'Impossible de charger les rapports'));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [fetchReports]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchReports();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Impossible d’actualiser les rapports'));
        } finally {
            setRefreshing(false);
        }
    }, [fetchReports]);

    const report = payload ?? EMPTY_REPORT;
    const csvContent = useMemo(() => exportReportCsv(report), [report]);
    const chartMax = useMemo(
        () => Math.max(...report.timeSeries.map((point) => point.revenue), 1),
        [report.timeSeries]
    );

    const handleCopyCsv = useCallback(async () => {
        await Clipboard.setStringAsync(csvContent);
        Alert.alert('Export copié', 'Le rapport CSV a été copié dans le presse-papiers.');
    }, [csvContent]);

    const handleShare = useCallback(async () => {
        await Share.share({
            title: 'Rapport KBouffe',
            message: csvContent,
        });
    }, [csvContent]);

    const s = styles(theme);

    return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Rapports</Text>
                    <Text style={s.subtitle}>Analyse détaillée de l’activité</Text>
                </View>
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

                <View style={s.actionsRow}>
                    <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={16} color={theme.primary} />
                        <Text style={s.actionText}>Partager</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} onPress={handleCopyCsv}>
                        <Ionicons name="copy-outline" size={16} color={theme.primary} />
                        <Text style={s.actionText}>Copier CSV</Text>
                    </TouchableOpacity>
                </View>

                {errorMessage && (
                    <View style={s.errorCard}>
                        <Ionicons name="alert-circle-outline" size={16} color={theme.error} />
                        <Text style={s.errorText}>{errorMessage}</Text>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} size="large" color={theme.primary} />
                ) : (
                    <>
                        <View style={s.metricsGrid}>
                            <MetricCard label="Chiffre d’affaires" value={formatFcfa(report.summary.revenue)} icon="wallet-outline" color={theme.success} />
                            <MetricCard label="Commandes" value={String(report.summary.ordersTotal)} icon="receipt-outline" color={theme.primary} />
                            <MetricCard label="Panier moyen" value={formatFcfa(report.summary.averageOrderValue)} icon="pricetag-outline" color="#0ea5e9" />
                            <MetricCard label="Clients uniques" value={String(report.summary.uniqueCustomers)} icon="people-outline" color="#14b8a6" />
                        </View>

                        <View style={s.sectionCard}>
                            <Text style={s.sectionTitle}>Qualité opérationnelle</Text>
                            <View style={s.qualityRow}>
                                <View style={s.qualityItem}>
                                    <Text style={s.qualityLabel}>Taux de complétion</Text>
                                    <Text style={s.qualityValue}>{formatPercent(report.summary.completionRate)}</Text>
                                </View>
                                <View style={s.qualityItem}>
                                    <Text style={s.qualityLabel}>Taux d’annulation</Text>
                                    <Text style={s.qualityValue}>{formatPercent(report.summary.cancellationRate)}</Text>
                                </View>
                            </View>
                            <Text style={s.qualityMeta}>
                                {report.summary.ordersActive} en cours · {report.summary.ordersCancelled} annulées
                            </Text>
                        </View>

                        <StatusBreakdownCard rows={report.statusBreakdown} />

                        <View style={s.sectionCard}>
                            <Text style={s.sectionTitle}>Tendance du chiffre d&apos;affaires</Text>
                            {report.timeSeries.length === 0 ? (
                                <Text style={[s.emptyText, { marginTop: 8 }]}>Aucune donnée sur cette période.</Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chartRow}>
                                    {report.timeSeries.map((point) => {
                                        const height = Math.max(4, Math.round((point.revenue / chartMax) * 130));
                                        return (
                                            <View key={point.date} style={s.chartItem}>
                                                <Text style={s.chartValue}>{point.revenue > 0 ? point.revenue.toLocaleString('fr-FR') : '0'}</Text>
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

                        <View style={s.sectionCard}>
                            <Text style={s.sectionTitle}>Top produits</Text>
                            {report.topProducts.length === 0 ? (
                                <Text style={[s.emptyText, { marginTop: 8 }]}>Aucun produit vendu sur cette période.</Text>
                            ) : (
                                <View style={s.productsList}>
                                    {report.topProducts.map((product, index) => (
                                        <View key={`${product.name}-${index}`} style={s.productRow}>
                                            <Text style={s.productRank}>{index + 1}.</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.productName} numberOfLines={1}>{product.name}</Text>
                                                <Text style={s.productMeta}>{product.quantity} vendus</Text>
                                            </View>
                                            <Text style={s.productRevenue}>{formatFcfa(product.revenue)}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={s.sectionCard}>
                            <Text style={s.sectionTitle}>Heures de pointe</Text>
                            {report.peakHours.length === 0 ? (
                                <Text style={[s.emptyText, { marginTop: 8 }]}>Pas encore d&apos;heure de pointe détectée.</Text>
                            ) : (
                                <View style={s.peakList}>
                                    {report.peakHours.map((slot) => (
                                        <View key={slot.hour} style={s.peakRow}>
                                            <Text style={s.peakLabel}>{slot.label}</Text>
                                            <Text style={s.peakMeta}>{slot.orders} commandes · {formatFcfa(slot.revenue)}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        <BreakdownCard title="Canaux de commande" rows={report.deliveryBreakdown} />
                        <BreakdownCard title="Répartition des paiements" rows={report.paymentBreakdown} />
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
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backBtn: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: { fontSize: 20, fontWeight: '700', color: theme.text },
        subtitle: { fontSize: 12, color: theme.textSecondary },
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
        periodChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
        periodChipText: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
        periodChipTextActive: { color: '#fff' },
        actionsRow: { flexDirection: 'row', gap: 10 },
        actionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 10,
            backgroundColor: theme.surface,
            paddingVertical: 8,
            paddingHorizontal: 10,
        },
        actionText: { color: theme.primary, fontSize: 12, fontWeight: '700' },
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
        metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        metricCard: {
            flexBasis: '48%',
            flexGrow: 1,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 12,
            backgroundColor: theme.surface,
            minHeight: 92,
        },
        metricIcon: {
            width: 28,
            height: 28,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        metricValue: { fontSize: 16, fontWeight: '800', color: theme.text },
        metricLabel: { marginTop: 4, fontSize: 12, color: theme.textSecondary },
        sectionCard: {
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            padding: 12,
        },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        qualityRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
        qualityItem: {
            flex: 1,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            padding: 10,
        },
        qualityLabel: { fontSize: 11, color: theme.textSecondary },
        qualityValue: { marginTop: 4, fontSize: 18, fontWeight: '800', color: theme.text },
        qualityMeta: { marginTop: 10, fontSize: 12, color: theme.textSecondary },
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
        productsList: { marginTop: 10, gap: 8 },
        productRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            padding: 9,
        },
        productRank: { width: 18, fontSize: 12, fontWeight: '700', color: theme.textSecondary },
        productName: { fontSize: 13, fontWeight: '700', color: theme.text },
        productMeta: { marginTop: 2, fontSize: 11, color: theme.textSecondary },
        productRevenue: { fontSize: 12, fontWeight: '700', color: theme.text },
        peakList: { marginTop: 10, gap: 8 },
        peakRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            paddingHorizontal: 10,
            paddingVertical: 8,
            gap: 8,
        },
        peakLabel: { fontSize: 12, fontWeight: '700', color: theme.text },
        peakMeta: { fontSize: 11, color: theme.textSecondary, textAlign: 'right', flex: 1 },
        breakdownList: { marginTop: 10, gap: 10 },
        breakdownRow: { gap: 6 },
        breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        breakdownLabel: { fontSize: 12, fontWeight: '700', color: theme.text },
        breakdownMeta: { fontSize: 11, color: theme.textSecondary },
        progressTrack: {
            height: 8,
            borderRadius: 999,
            backgroundColor: theme.background,
            overflow: 'hidden',
        },
        progressBar: { height: '100%', borderRadius: 999, backgroundColor: theme.primary },
        emptyText: { fontSize: 12, color: theme.textSecondary },
    });
