import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

interface DayStats {
    ordersCount: number;
    revenue: number;
    avgOrderValue: number;
    pendingCount: number;
    cancelledCount: number;
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
    const theme = useTheme();
    return (
        <View style={[cardStyles.card, { backgroundColor: theme.surface }]}>
            <Text style={cardStyles.icon}>{icon}</Text>
            <Text style={[cardStyles.value, { color }]}>{value}</Text>
            <Text style={[cardStyles.label, { color: theme.textSecondary }]}>{label}</Text>
        </View>
    );
}

const cardStyles = StyleSheet.create({
    card: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    icon: { fontSize: 28, marginBottom: 6 },
    value: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    label: { fontSize: 11, textAlign: 'center' },
});

export default function StatsScreen() {
    const { profile } = useAuth();
    const theme = useTheme();
    const [today, setToday] = useState<DayStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!profile?.restaurantId) return;
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from('orders')
            .select('status, total_amount')
            .eq('restaurant_id', profile.restaurantId)
            .gte('created_at', start.toISOString());

        const orders = data ?? [];
        const delivered = orders.filter((o: any) => o.status === 'delivered');
        const revenue = delivered.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);

        setToday({
            ordersCount: orders.length,
            revenue,
            avgOrderValue: delivered.length ? Math.round(revenue / delivered.length) : 0,
            pendingCount: orders.filter((o: any) => ['pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(o.status)).length,
            cancelledCount: orders.filter((o: any) => o.status === 'cancelled').length,
        });
    }, [profile?.restaurantId]);

    useEffect(() => { fetchStats().finally(() => setLoading(false)); }, [fetchStats]);

    const onRefresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };

    const s = styles(theme);

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <Text style={s.title}>Statistiques</Text>
                <Text style={[s.subtitle, { color: theme.textSecondary }]}>
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
            </View>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            ) : (
                <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Aujourd&apos;hui</Text>
                    <View style={s.grid}>
                        <StatCard label="Commandes totales" value={String(today?.ordersCount ?? 0)} icon="📋" color={theme.primary} />
                        <StatCard label="Chiffre d'affaires" value={`${(today?.revenue ?? 0).toLocaleString()} F`} icon="💰" color={theme.success} />
                        <StatCard label="En cours" value={String(today?.pendingCount ?? 0)} icon="⏳" color={theme.warning} />
                        <StatCard label="Panier moyen" value={`${(today?.avgOrderValue ?? 0).toLocaleString()} F`} icon="🧾" color="#0891b2" />
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    title: { fontSize: 22, fontWeight: '700', color: theme.text },
    subtitle: { fontSize: 13, marginTop: 2 },
    scroll: { padding: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
