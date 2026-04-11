import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

interface OrderDetail {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    delivery_type: string;
    delivery_address: string | null;
    table_number: string | null;
    special_instructions: string | null;
    created_at: string;
    customer_name: string | null;
    customer_phone: string | null;
    items: { id: string; name: string; quantity: number; unit_price: number; options: any[] }[];
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente', accepted: 'Accepté', preparing: 'En préparation',
    ready: 'Prêt', delivering: 'En livraison', delivered: 'Livré', cancelled: 'Annulé',
};

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        supabase
            .from('orders')
            .select(`
                id, order_number, status, total_amount, delivery_type,
                delivery_address, table_number, special_instructions, created_at,
                users!customer_id(name, phone),
                order_items(id, quantity, unit_price, products(name), order_item_options(name, price))
            `)
            .eq('id', id)
            .single()
            .then(({ data }) => {
                if (!data) return;
                setOrder({
                    ...(data as any),
                    customer_name: (data as any).users?.name,
                    customer_phone: (data as any).users?.phone,
                    items: ((data as any).order_items ?? []).map((i: any) => ({
                        id: i.id,
                        name: i.products?.name ?? '?',
                        quantity: i.quantity,
                        unit_price: i.unit_price,
                        options: i.order_item_options ?? [],
                    })),
                });
            })
            .finally(() => setLoading(false));
    }, [id]);

    const s = styles(theme);

    if (loading) return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
        </SafeAreaView>
    );

    if (!order) return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <TouchableOpacity style={s.back} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[s.notFound, { color: theme.textSecondary }]}>Commande introuvable</Text>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[s.title, { color: theme.text }]}>Commande #{order.order_number}</Text>
                <View />
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                {/* Status + meta */}
                <View style={s.card}>
                    <Text style={[s.status, { color: theme.primary }]}>{STATUS_LABELS[order.status] ?? order.status}</Text>
                    <Text style={[s.meta, { color: theme.textSecondary }]}>
                        {new Date(order.created_at).toLocaleString('fr-FR')}
                    </Text>
                    {order.customer_name && <Text style={[s.customer, { color: theme.text }]}>👤 {order.customer_name}</Text>}
                    {order.customer_phone && <Text style={[s.meta, { color: theme.textSecondary }]}>📱 {order.customer_phone}</Text>}
                    {order.table_number && <Text style={[s.meta, { color: theme.text }]}>🍽️ Table {order.table_number}</Text>}
                    {order.delivery_address && <Text style={[s.meta, { color: theme.textSecondary }]}>📍 {order.delivery_address}</Text>}
                    {order.special_instructions && (
                        <Text style={[s.instructions, { color: theme.warning, borderColor: theme.warning }]}>
                            ⚠️ {order.special_instructions}
                        </Text>
                    )}
                </View>

                {/* Items */}
                <View style={s.card}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Articles commandés</Text>
                    {order.items.map((item) => (
                        <View key={item.id} style={s.item}>
                            <Text style={[s.itemQty, { color: theme.primary }]}>{item.quantity}×</Text>
                            <View style={s.itemInfo}>
                                <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
                                {item.options.map((opt, i) => (
                                    <Text key={i} style={[s.itemOpt, { color: theme.textSecondary }]}>+ {opt.name}</Text>
                                ))}
                            </View>
                            <Text style={[s.itemPrice, { color: theme.text }]}>{(item.unit_price * item.quantity).toLocaleString()} F</Text>
                        </View>
                    ))}
                    <View style={s.divider} />
                    <View style={s.totalRow}>
                        <Text style={[s.totalLabel, { color: theme.text }]}>Total</Text>
                        <Text style={[s.totalValue, { color: theme.primary }]}>{order.total_amount?.toLocaleString()} FCFA</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    back: { padding: 8 },
    title: { fontSize: 17, fontWeight: '700' },
    scroll: { padding: 16, gap: 12 },
    card: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    status: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    meta: { fontSize: 13, marginTop: 2 },
    customer: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    instructions: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 13 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
    item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    itemQty: { fontSize: 15, fontWeight: '700', width: 28 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600' },
    itemOpt: { fontSize: 12, marginTop: 1 },
    itemPrice: { fontSize: 14, fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '700' },
    totalValue: { fontSize: 18, fontWeight: '800' },
    notFound: { textAlign: 'center', marginTop: 60, fontSize: 16 },
});
