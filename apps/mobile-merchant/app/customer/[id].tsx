import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface Order {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface CustomerProfile {
    id: string;
    name: string;
    phone: string;
    email?: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
    createdAt: string;
    averageOrderValue: number;
}

export default function CustomerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCustomerData = useCallback(async () => {
        if (!session || !profile?.restaurantId || !id) {
            setLoading(false);
            return;
        }

        try {
            // Fetch customer profile from API
            const customerResponse = await apiFetch<{
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
            }>(`/api/customers?page=1&limit=1000`, session.access_token);

            const customerData = customerResponse.customers.find((c) => c.id === id);
            if (customerData) {
                setCustomer({
                    ...customerData,
                    averageOrderValue: customerData.totalSpent / Math.max(customerData.totalOrders, 1),
                });
            }

            // Fetch orders from Supabase
            const { data: ordersData, error } = await supabase
                .from('orders')
                .select('id, order_number, total, status, created_at')
                .eq('restaurant_id', profile.restaurantId)
                .eq('customer_id', id)
                .order('created_at', { ascending: false });

            if (!error && ordersData) {
                setOrders(
                    ordersData.map((o: any) => ({
                        id: o.id,
                        orderNumber: o.order_number || o.id.slice(-6).toUpperCase(),
                        totalAmount: o.total,
                        status: o.status,
                        createdAt: o.created_at,
                    }))
                );
            }
        } catch (error) {
            console.error('Erreur lors du chargement du profil client:', error);
        } finally {
            setLoading(false);
        }
    }, [session, profile?.restaurantId, id]);

    useEffect(() => {
        loadCustomerData();
    }, [loadCustomerData]);

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    if (!customer) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={s.title}>Profil client</Text>
                    <View style={s.backButton} />
                </View>
                <View style={s.center}>
                    <Text style={s.errorText}>Client introuvable</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderOrder = ({ item }: { item: Order }) => {
        const statusColors: Record<string, string> = {
            pending: theme.warning,
            accepted: theme.primary,
            preparing: theme.warning,
            ready: theme.success,
            completed: theme.success,
            cancelled: theme.error,
        };

        return (
            <TouchableOpacity
                style={s.orderCard}
                onPress={() => router.push(`/order/${item.id}`)}
            >
                <View style={s.orderHeader}>
                    <Text style={s.orderNumber}>#{item.orderNumber}</Text>
                    <View
                        style={[
                            s.statusBadge,
                            { backgroundColor: `${statusColors[item.status] || theme.textSecondary}20` },
                        ]}
                    >
                        <Text style={[s.statusText, { color: statusColors[item.status] || theme.textSecondary }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <View style={s.orderFooter}>
                    <Text style={s.orderDate}>
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                    <Text style={s.orderAmount}>{item.totalAmount.toLocaleString()} FCFA</Text>
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
                <Text style={s.title}>Profil client</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {/* Customer Info Card */}
                <View style={s.infoCard}>
                    <View style={s.infoHeader}>
                        <View style={[s.avatar, { backgroundColor: `${theme.primary}20` }]}>
                            <Ionicons name="person" size={24} color={theme.primary} />
                        </View>
                        <View style={s.infoText}>
                            <Text style={s.customerName}>{customer.name}</Text>
                            <Text style={s.customerPhone}>{customer.phone}</Text>
                            {customer.email && <Text style={s.customerEmail}>{customer.email}</Text>}
                        </View>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={s.statsGrid}>
                    <View style={s.statCard}>
                        <Text style={s.statValue}>{customer.totalOrders}</Text>
                        <Text style={s.statLabel}>Commandes</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statValue}>{(customer.totalSpent / 1000).toFixed(1)}K</Text>
                        <Text style={s.statLabel}>Total dépensé</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statValue}>{(customer.averageOrderValue / 1000).toFixed(1)}K</Text>
                        <Text style={s.statLabel}>Panier moyen</Text>
                    </View>
                </View>

                {/* Dates Info */}
                <View style={s.datesCard}>
                    <View style={s.dateRow}>
                        <Ionicons name="calendar" size={14} color={theme.textSecondary} />
                        <View>
                            <Text style={s.dateLabel}>Client depuis</Text>
                            <Text style={s.dateValue}>
                                {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                    </View>
                    <View style={[s.dateRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTopVertical: 12 }]}>
                        <Ionicons name="time" size={14} color={theme.textSecondary} />
                        <View>
                            <Text style={s.dateLabel}>Dernière commande</Text>
                            <Text style={s.dateValue}>
                                {new Date(customer.lastOrderAt).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Orders Section */}
                <View style={s.ordersSection}>
                    <Text style={s.sectionTitle}>Historique des commandes</Text>
                    {orders.length > 0 ? (
                        <View style={{ gap: 10 }}>
                            {orders.map((order) => (
                                <View key={order.id}>{renderOrder({ item: order })}</View>
                            ))}
                        </View>
                    ) : (
                        <View style={s.emptyOrders}>
                            <Text style={s.emptyOrdersText}>Aucune commande</Text>
                        </View>
                    )}
                </View>
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
        content: { padding: 16, gap: 16, paddingBottom: 32 },
        infoCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
        },
        infoHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
        avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
        infoText: { flex: 1, gap: 3 },
        customerName: { fontSize: 14, fontWeight: '700', color: theme.text },
        customerPhone: { fontSize: 12, color: theme.textSecondary },
        customerEmail: { fontSize: 11, color: theme.textSecondary },
        statsGrid: { flexDirection: 'row', gap: 10 },
        statCard: {
            flex: 1,
            backgroundColor: theme.surface,
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
        },
        statValue: { fontSize: 16, fontWeight: '700', color: theme.primary },
        statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 4 },
        datesCard: {
            backgroundColor: theme.surface,
            borderRadius: 10,
            padding: 12,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        dateRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
        dateLabel: { fontSize: 11, color: theme.textSecondary },
        dateValue: { fontSize: 12, fontWeight: '600', color: theme.text, marginTop: 2 },
        ordersSection: { gap: 10 },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        orderCard: {
            backgroundColor: theme.surface,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 8,
        },
        orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        orderNumber: { fontSize: 13, fontWeight: '700', color: theme.text },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
        statusText: { fontSize: 10, fontWeight: '600' },
        orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        orderDate: { fontSize: 11, color: theme.textSecondary },
        orderAmount: { fontSize: 12, fontWeight: '700', color: theme.text },
        emptyOrders: { paddingVertical: 20, alignItems: 'center' },
        emptyOrdersText: { fontSize: 12, color: theme.textSecondary },
    });
