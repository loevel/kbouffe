import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { PermissionGate } from '@/components/PermissionGate';

interface FinanceSummary {
    grossRevenue: number;
    deliveryRevenue: number;
    feesRevenue: number;
    tipsRevenue: number;
    totalRevenue: number;
    transactionCount: number;
    avgOrderValue: number;
    totalPaidOut: number;
    pendingPayouts: number;
}

interface Transaction {
    id: string;
    customer_name: string;
    total: number;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
}

interface Payout {
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    created_at: string;
}

interface FinancesResponse {
    summary: FinanceSummary;
    transactions: Transaction[];
    payouts: Payout[];
}

export default function FinancesScreen() {
    const { session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [finances, setFinances] = useState<FinancesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');

    const getDateRange = useCallback(() => {
        const today = new Date();
        const from = new Date();

        if (period === 'today') {
            from.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            from.setDate(from.getDate() - 7);
        } else {
            from.setDate(from.getDate() - 30);
        }

        return {
            from: from.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
        };
    }, [period]);

    const loadFinances = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const { from, to } = getDateRange();
            const response = await apiFetch<FinancesResponse>(
                `/api/finances/summary?from=${from}&to=${to}`,
                session.access_token
            );

            setFinances(response);
        } catch (error) {
            console.error('Erreur lors du chargement des finances:', error);
        } finally {
            setLoading(false);
        }
    }, [session, getDateRange]);

    useEffect(() => {
        loadFinances();
    }, [loadFinances, period]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFinances();
        setRefreshing(false);
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    if (!finances) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={s.title}>Finances</Text>
                    <View style={s.backButton} />
                </View>
                <View style={s.center}>
                    <Text style={s.errorText}>Impossible de charger les données financières</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderTransaction = ({ item }: { item: Transaction }) => (
        <View style={s.transactionCard}>
            <View style={s.transactionHeader}>
                <Text style={s.transactionCustomer}>{item.customer_name}</Text>
                <Text style={s.transactionAmount}>{item.total.toLocaleString()} FCFA</Text>
            </View>
            <View style={s.transactionFooter}>
                <Text style={s.transactionMethod}>{item.payment_method}</Text>
                <Text style={s.transactionDate}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
            </View>
        </View>
    );

    const renderPayout = ({ item }: { item: Payout }) => {
        const statusColor =
            item.status === 'paid'
                ? theme.success
                : item.status === 'pending'
                  ? theme.warning
                  : theme.error;

        return (
            <View style={s.payoutCard}>
                <View style={s.payoutHeader}>
                    <Text style={s.payoutAmount}>{item.amount.toLocaleString()} FCFA</Text>
                    <View
                        style={[
                            s.payoutStatusBadge,
                            { backgroundColor: `${statusColor}20`, borderColor: statusColor },
                        ]}
                    >
                        <Text style={[s.payoutStatusText, { color: statusColor }]}>
                            {item.status === 'paid'
                                ? 'Payé'
                                : item.status === 'pending'
                                  ? 'En attente'
                                  : 'Échoué'}
                        </Text>
                    </View>
                </View>
                <Text style={s.payoutDate}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
            </View>
        );
    };

    const netRevenue = finances.summary.totalRevenue - finances.summary.feesRevenue;

    return (
        <PermissionGate permission="finances:read">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Finances</Text>
                <View style={s.backButton} />
            </View>

            <View style={s.periodBar}>
                {(['today', 'week', 'month'] as const).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[s.periodButton, period === p && s.periodButtonActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text
                            style={[
                                s.periodButtonText,
                                period === p && s.periodButtonTextActive,
                            ]}
                        >
                            {p === 'today' ? 'Aujourd\'hui' : p === 'week' ? '7 jours' : '30 jours'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={s.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Summary Cards */}
                <View style={s.summaryGrid}>
                    <View style={s.summaryCard}>
                        <View style={[s.summaryIcon, { backgroundColor: `${theme.primary}20` }]}>
                            <Ionicons name="cash" size={20} color={theme.primary} />
                        </View>
                        <Text style={s.summaryValue}>{(finances.summary.totalRevenue / 1000).toFixed(1)}K</Text>
                        <Text style={s.summaryLabel}>Revenu total</Text>
                    </View>

                    <View style={s.summaryCard}>
                        <View style={[s.summaryIcon, { backgroundColor: `${theme.warning}20` }]}>
                            <Ionicons name="receipt" size={20} color={theme.warning} />
                        </View>
                        <Text style={s.summaryValue}>{(finances.summary.feesRevenue / 1000).toFixed(1)}K</Text>
                        <Text style={s.summaryLabel}>Frais</Text>
                    </View>

                    <View style={s.summaryCard}>
                        <View style={[s.summaryIcon, { backgroundColor: `${theme.success}20` }]}>
                            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                        </View>
                        <Text style={s.summaryValue}>{(netRevenue / 1000).toFixed(1)}K</Text>
                        <Text style={s.summaryLabel}>Net</Text>
                    </View>

                    <View style={s.summaryCard}>
                        <View style={[s.summaryIcon, { backgroundColor: `#f59e0b20` }]}>
                            <Ionicons name="heart" size={20} color="#f59e0b" />
                        </View>
                        <Text style={s.summaryValue}>{(finances.summary.tipsRevenue / 1000).toFixed(1)}K</Text>
                        <Text style={s.summaryLabel}>Pourboires</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={s.statsCard}>
                    <View style={s.statRow}>
                        <Text style={s.statLabel}>Commandes</Text>
                        <Text style={s.statValue}>{finances.summary.transactionCount}</Text>
                    </View>
                    <View style={[s.statRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTopVertical: 10 }]}>
                        <Text style={s.statLabel}>Panier moyen</Text>
                        <Text style={s.statValue}>{(finances.summary.avgOrderValue / 1000).toFixed(1)}K FCFA</Text>
                    </View>
                </View>

                {/* Payouts Section */}
                {finances.payouts.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Paiements</Text>
                        <View style={{ gap: 8 }}>
                            {finances.payouts.slice(0, 5).map((payout) => (
                                <View key={payout.id}>{renderPayout({ item: payout })}</View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Transactions Section */}
                {finances.transactions.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Transactions récentes</Text>
                        <View style={{ gap: 8 }}>
                            {finances.transactions.slice(0, 10).map((trans) => (
                                <View key={trans.id}>{renderTransaction({ item: trans })}</View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
        </PermissionGate>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
        errorText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center' },
        periodBar: {
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        periodButton: {
            flex: 1,
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        periodButtonActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        periodButtonText: { fontSize: 11, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
        periodButtonTextActive: { color: '#fff' },
        content: { padding: 16, gap: 16, paddingBottom: 32 },
        summaryGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        summaryCard: {
            width: '48%',
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            gap: 6,
        },
        summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        summaryValue: { fontSize: 14, fontWeight: '700', color: theme.text },
        summaryLabel: { fontSize: 10, color: theme.textSecondary },
        statsCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 10,
        },
        statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
        statLabel: { fontSize: 12, color: theme.textSecondary },
        statValue: { fontSize: 14, fontWeight: '700', color: theme.text },
        section: { gap: 10 },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        transactionCard: {
            backgroundColor: theme.surface,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 6,
        },
        transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        transactionCustomer: { fontSize: 12, fontWeight: '600', color: theme.text },
        transactionAmount: { fontSize: 13, fontWeight: '700', color: theme.primary },
        transactionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        transactionMethod: { fontSize: 10, color: theme.textSecondary },
        transactionDate: { fontSize: 10, color: theme.textSecondary },
        payoutCard: {
            backgroundColor: theme.surface,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 6,
        },
        payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        payoutAmount: { fontSize: 13, fontWeight: '700', color: theme.text },
        payoutStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
        payoutStatusText: { fontSize: 10, fontWeight: '600' },
        payoutDate: { fontSize: 10, color: theme.textSecondary },
    });
