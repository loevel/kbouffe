import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { PermissionGate } from '@/components/PermissionGate';

interface AnalyticsData {
    revenue_14d: number;
    orders_count: number;
    avg_order_value: number;
    peak_hour: string;
    cancellation_rate: number;
    top_products: Array<{ name: string; sold: number; revenue: number }>;
}

export default function AnalyticsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const loadAnalytics = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const analytics = await apiFetch<AnalyticsData>(
                '/api/analytics/stats',
                session.access_token
            );
            setData(analytics);
        } catch (err) {
            // API non implémentée, afficher données vides
            console.log('Analytics non disponibles');
            setData({
                revenue_14d: 0,
                orders_count: 0,
                avg_order_value: 0,
                peak_hour: '-',
                cancellation_rate: 0,
                top_products: [],
            });
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <PermissionGate permission="finances:read">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Analytique avancée</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                <View style={[s.kpiCard, { backgroundColor: theme.surface }]}>
                    <Text style={[s.kpiLabel, { color: theme.textSecondary }]}>CA 14 derniers jours</Text>
                    <Text style={[s.kpiValue, { color: theme.text }]}>
                        {(data?.revenue_14d ?? 0).toLocaleString()} F
                    </Text>
                </View>

                <View style={s.metricsGrid}>
                    <View style={[s.metricCard, { backgroundColor: theme.surface }]}>
                        <Text style={[s.metricLabel, { color: theme.textSecondary }]}>Commandes</Text>
                        <Text style={[s.metricValue, { color: theme.text }]}>{data?.orders_count ?? 0}</Text>
                    </View>
                    <View style={[s.metricCard, { backgroundColor: theme.surface }]}>
                        <Text style={[s.metricLabel, { color: theme.textSecondary }]}>Panier moyen</Text>
                        <Text style={[s.metricValue, { color: theme.text }]}>
                            {(data?.avg_order_value ?? 0).toLocaleString()} F
                        </Text>
                    </View>
                    <View style={[s.metricCard, { backgroundColor: theme.surface }]}>
                        <Text style={[s.metricLabel, { color: theme.textSecondary }]}>Heure de pointe</Text>
                        <Text style={[s.metricValue, { color: theme.text }]}>{data?.peak_hour ?? '-'}</Text>
                    </View>
                    <View style={[s.metricCard, { backgroundColor: theme.surface }]}>
                        <Text style={[s.metricLabel, { color: theme.textSecondary }]}>Taux annulation</Text>
                        <Text style={[s.metricValue, { color: theme.text }]}>{(data?.cancellation_rate ?? 0).toFixed(1)}%</Text>
                    </View>
                </View>

                {data?.top_products && data.top_products.length > 0 && (
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Top produits</Text>
                        {data.top_products.slice(0, 5).map((product, idx) => (
                            <View key={idx} style={[s.productRow, { backgroundColor: theme.surface }]}>
                                <View style={s.productInfo}>
                                    <Text style={[s.productName, { color: theme.text }]}>{product.name}</Text>
                                    <Text style={[s.productSold, { color: theme.textSecondary }]}>{product.sold} vendus</Text>
                                </View>
                                <Text style={[s.productRevenue, { color: theme.text }]}>{product.revenue.toLocaleString()} F</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
        </PermissionGate>
    );
}

const styles = (theme: any) =>
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
        content: { padding: 16, paddingBottom: 32, gap: 16 },
        kpiCard: { borderRadius: 12, padding: 20, alignItems: 'center' },
        kpiLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
        kpiValue: { fontSize: 28, fontWeight: '700' },
        metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        metricCard: { width: '48%', borderRadius: 12, padding: 12 },
        metricLabel: { fontSize: 11, fontWeight: '600' },
        metricValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
        section: { gap: 10 },
        sectionTitle: { fontSize: 14, fontWeight: '700' },
        productRow: { borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        productInfo: { flex: 1 },
        productName: { fontSize: 13, fontWeight: '600' },
        productSold: { fontSize: 11, marginTop: 2 },
        productRevenue: { fontSize: 13, fontWeight: '700' },
    });
