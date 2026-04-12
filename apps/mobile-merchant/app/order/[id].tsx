import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    items: { id: string; name: string; quantity: number; unit_price: number; options: { name: string; price: number }[] }[];
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Brouillon',
    scheduled: 'Planifiée',
    pending: 'En attente',
    accepted: 'Acceptée',
    preparing: 'En préparation',
    ready: 'Prête',
    out_for_delivery: 'En livraison',
    delivering: 'En livraison',
    delivered: 'Livrée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
};

function asString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    return value.trim().length > 0 ? value : null;
}

function asAmount(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asOrderNumber(row: Record<string, unknown>): string {
    const value = row.order_number ?? row.invoice_number;
    if (typeof value === 'string' && value.trim().length > 0) return value;
    const id = row.id;
    return typeof id === 'string' ? id.slice(-6).toUpperCase() : '—';
}

function asItemsSource(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function mapOptions(value: unknown): { name: string; price: number }[] {
    if (Array.isArray(value)) {
        return value
            .map((option, index) => {
                if (typeof option === 'string') {
                    return { name: option, price: 0 };
                }

                if (option && typeof option === 'object') {
                    const raw = option as Record<string, unknown>;
                    const name = asString(raw.name) ?? asString(raw.label) ?? `Option ${index + 1}`;
                    const price = asAmount(raw.price ?? raw.extra_price ?? raw.extraPrice);
                    return { name, price };
                }

                return null;
            })
            .filter((option): option is { name: string; price: number } => option !== null);
    }

    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => ({
            name: typeof rawValue === 'string' ? `${key}: ${rawValue}` : key,
            price: 0,
        }));
    }

    return [];
}

function mapItems(value: unknown): OrderDetail['items'] {
    return asItemsSource(value)
        .map((item, index) => {
            if (!item || typeof item !== 'object') return null;

            const raw = item as Record<string, unknown>;
            const rawProduct = raw.products;
            const productName = rawProduct && typeof rawProduct === 'object'
                ? asString((rawProduct as Record<string, unknown>).name)
                : null;

            const name =
                asString(raw.name) ??
                asString(raw.product_name) ??
                asString(raw.productName) ??
                productName ??
                'Article';

            const quantity = Math.max(1, Math.round(asAmount(raw.quantity) || 1));
            const unitPrice = asAmount(raw.unit_price ?? raw.unitPrice ?? raw.price);
            const options = mapOptions(raw.order_item_options ?? raw.options ?? raw.selected_options ?? raw.selectedOptions);
            const id = asString(raw.id) ?? `${index}`;

            return {
                id,
                name,
                quantity,
                unit_price: unitPrice,
                options,
            };
        })
        .filter((item): item is OrderDetail['items'][number] => item !== null);
}

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadOrder = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !data || cancelled) {
                    if (!cancelled) {
                        setErrorMessage(error?.message ?? 'Commande introuvable');
                    }
                    return;
                }

                const row = data as Record<string, unknown>;
                const totalAmount = asAmount(row.total_amount ?? row.total);
                const tableNumber = asString(row.table_number) ?? (typeof row.table_number === 'number' ? String(row.table_number) : null);
                const specialInstructions = asString(row.special_instructions) ?? asString(row.notes);
                const customerName = asString(row.customer_name);
                const customerPhone = asString(row.customer_phone);
                const items = mapItems(row.items);

                const mapped: OrderDetail = {
                    id: typeof row.id === 'string' ? row.id : id,
                    order_number: asOrderNumber(row),
                    status: typeof row.status === 'string' ? row.status : 'pending',
                    total_amount: totalAmount,
                    delivery_type: typeof row.delivery_type === 'string' ? row.delivery_type : 'delivery',
                    delivery_address: asString(row.delivery_address),
                    table_number: tableNumber,
                    special_instructions: specialInstructions,
                    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    items,
                };

                setOrder(mapped);
                setErrorMessage(null);
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger la commande');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadOrder();

        return () => {
            cancelled = true;
        };
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
            <Text style={[s.notFound, { color: theme.textSecondary }]}>{errorMessage ?? 'Commande introuvable'}</Text>
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
                    {order.items.length === 0 ? (
                        <Text style={[s.meta, { color: theme.textSecondary }]}>Aucun article détaillé disponible.</Text>
                    ) : (
                        order.items.map((item) => (
                            <View key={item.id} style={s.item}>
                                <Text style={[s.itemQty, { color: theme.primary }]}>{item.quantity}×</Text>
                                <View style={s.itemInfo}>
                                    <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
                                    {item.options.map((opt, i) => (
                                        <Text key={i} style={[s.itemOpt, { color: theme.textSecondary }]}>
                                            + {opt.name}{opt.price > 0 ? ` (${opt.price.toLocaleString()} FCFA)` : ''}
                                        </Text>
                                    ))}
                                </View>
                                <Text style={[s.itemPrice, { color: theme.text }]}>{(item.unit_price * item.quantity).toLocaleString()} F</Text>
                            </View>
                        ))
                    )}
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
