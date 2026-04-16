import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
    createdAt: string;
    segment: 'champion' | 'loyal' | 'potential' | 'at_risk' | 'dormant';
}

interface CustomersResponse {
    customers: Array<{
        id: string;
        name: string;
        phone: string;
        email?: string;
        totalOrders: number;
        totalSpent: number;
        lastOrderAt: string;
        createdAt: string;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function calculateSegment(
    customer: CustomersResponse['customers'][0],
    allCustomers: CustomersResponse['customers'][0][]
): Customer['segment'] {
    const now = Date.now();
    const lastOrder = new Date(customer.lastOrderAt).getTime();
    const daysSinceLastOrder = Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24));

    const avgSpent = allCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / allCustomers.length;
    const medianOrders = allCustomers
        .map((c) => c.totalOrders)
        .sort((a, b) => a - b)[Math.floor(allCustomers.length / 2)];

    // RFM-like segmentation
    const isRecent = daysSinceLastOrder < 30;
    const isFrequent = customer.totalOrders >= medianOrders;
    const isMonetary = customer.totalSpent >= avgSpent;

    if (isRecent && isFrequent && isMonetary) return 'champion';
    if (isRecent && (isFrequent || isMonetary)) return 'loyal';
    if (!isRecent && (isFrequent || isMonetary)) return 'at_risk';
    if (isRecent && !isFrequent && !isMonetary) return 'potential';
    return 'dormant';
}

const SEGMENT_META: Record<Customer['segment'], { label: string; color: string; icon: string }> = {
    champion: { label: 'Champion', color: '#dc2626', icon: 'star' },
    loyal: { label: 'Fidèle', color: '#059669', icon: 'heart' },
    potential: { label: 'Potentiel', color: '#3b82f6', icon: 'trending-up' },
    at_risk: { label: 'À risque', color: '#f59e0b', icon: 'alert-circle' },
    dormant: { label: 'Inactif', color: '#9ca3af', icon: 'moon' },
};

export default function CustomersScreen() {
    const { session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);

    const loadCustomers = useCallback(
        async (pageNum: number = 1) => {
            if (!session) {
                setLoading(false);
                return;
            }

            try {
                const response = await apiFetch<CustomersResponse>(
                    `/api/customers?page=${pageNum}&limit=50&search=${searchText.trim()}`,
                    session.access_token
                );

                const allCustomers = response.customers;
                const processed: Customer[] = allCustomers.map((c) => ({
                    ...c,
                    segment: calculateSegment(c, allCustomers),
                }));

                setCustomers(processed);
                setPage(pageNum);
            } catch (error) {
                console.error('Erreur lors du chargement des clients:', error);
            } finally {
                setLoading(false);
            }
        },
        [session, searchText]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCustomers(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchText, loadCustomers]);

    useEffect(() => {
        loadCustomers(1);
    }, [session]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCustomers(1);
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

    const renderCustomer = ({ item }: { item: Customer }) => {
        const segmentMeta = SEGMENT_META[item.segment];
        const daysSinceOrder = Math.floor(
            (Date.now() - new Date(item.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
            <TouchableOpacity
                style={s.customerCard}
                onPress={() => router.push(`/customer/${item.id}`)}
            >
                <View style={s.customerHeader}>
                    <View style={s.customerInfo}>
                        <Text style={s.customerName}>{item.name}</Text>
                        <Text style={s.customerContact}>{item.phone}</Text>
                    </View>
                    <View
                        style={[
                            s.segmentBadge,
                            { backgroundColor: `${segmentMeta.color}20`, borderColor: segmentMeta.color },
                        ]}
                    >
                        <Ionicons name={segmentMeta.icon as any} size={12} color={segmentMeta.color} />
                        <Text style={[s.segmentLabel, { color: segmentMeta.color }]}>
                            {segmentMeta.label}
                        </Text>
                    </View>
                </View>

                <View style={s.metricsRow}>
                    <View style={s.metric}>
                        <Text style={s.metricValue}>{item.totalOrders}</Text>
                        <Text style={s.metricLabel}>Commandes</Text>
                    </View>
                    <View style={s.metricSeparator} />
                    <View style={s.metric}>
                        <Text style={s.metricValue}>{(item.totalSpent / 1000).toFixed(0)}K</Text>
                        <Text style={s.metricLabel}>FCFA</Text>
                    </View>
                    <View style={s.metricSeparator} />
                    <View style={s.metric}>
                        <Text style={s.metricValue}>{daysSinceOrder}j</Text>
                        <Text style={s.metricLabel}>Dernière cmd</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Clients</Text>
                <View style={s.backButton} />
            </View>

            <View style={[s.searchContainer, { backgroundColor: theme.surface }]}>
                <Ionicons name="search" size={18} color={theme.textSecondary} />
                <TextInput
                    style={[s.searchInput, { color: theme.text }]}
                    placeholder="Rechercher..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={renderCustomer}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>👥</Text>
                        <Text style={s.emptyText}>
                            {searchText ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
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
        title: { fontSize: 17, fontWeight: '700', color: theme.text, flex: 1, textAlign: 'center' },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginHorizontal: 12,
            marginVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
        },
        searchInput: {
            flex: 1,
            paddingVertical: 10,
            fontSize: 14,
        },
        list: { padding: 12, gap: 10, paddingBottom: 24 },
        customerCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        customerHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        customerInfo: { flex: 1, gap: 4 },
        customerName: { fontSize: 14, fontWeight: '700', color: theme.text },
        customerContact: { fontSize: 12, color: theme.textSecondary },
        segmentBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            borderWidth: 1,
        },
        segmentLabel: { fontSize: 10, fontWeight: '600' },
        metricsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        metric: { alignItems: 'center', gap: 2 },
        metricValue: { fontSize: 13, fontWeight: '700', color: theme.text },
        metricLabel: { fontSize: 10, color: theme.textSecondary },
        metricSeparator: { width: 1, height: 20, backgroundColor: theme.border },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
    });
