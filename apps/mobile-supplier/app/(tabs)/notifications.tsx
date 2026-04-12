import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import { authApiFetch } from '@/lib/api';
import { formatFCFA, relativeTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { SupplierMessage, SupplierOrder, SupplierProduct } from '@/lib/types';

type NotificationKind = 'order' | 'message' | 'stock';

interface SupplierNotificationItem {
    id: string;
    kind: NotificationKind;
    title: string;
    description: string;
    created_at: string;
}

async function readJson<T>(response: Response): Promise<T> {
    return (await response.json().catch(() => ({}))) as T;
}

function getTimestamp(value: string) {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

export default function NotificationsScreen() {
    const theme = useTheme();
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<SupplierNotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!profile?.id) {
            setNotifications([]);
            return;
        }

        const [ordersResponse, productsResponse, messagesResult] = await Promise.all([
            authApiFetch('/api/marketplace/suppliers/me/orders'),
            authApiFetch('/api/marketplace/suppliers/me/products'),
            supabase
                .from('supplier_messages')
                .select('id, subject, body, status, created_at')
                .eq('supplier_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(25),
        ]);

        const [ordersPayload, productsPayload] = await Promise.all([
            readJson<{ error?: string; orders?: SupplierOrder[] }>(ordersResponse),
            readJson<{ error?: string; products?: SupplierProduct[] }>(productsResponse),
        ]);

        if (!ordersResponse.ok) {
            throw new Error(ordersPayload.error ?? 'Impossible de charger les commandes');
        }

        if (!productsResponse.ok) {
            throw new Error(productsPayload.error ?? 'Impossible de charger les produits');
        }

        if (messagesResult.error) {
            throw messagesResult.error;
        }

        const orders = ordersPayload.orders ?? [];
        const products = productsPayload.products ?? [];
        const messages = (messagesResult.data ?? []) as Pick<
            SupplierMessage,
            'id' | 'subject' | 'body' | 'status' | 'created_at'
        >[];

        const nextNotifications: SupplierNotificationItem[] = [];

        for (const order of orders.filter((item) => item.delivery_status === 'pending').slice(0, 10)) {
            nextNotifications.push({
                id: `order-${order.id}`,
                kind: 'order',
                title: 'Commande à confirmer',
                description: `${order.supplier_products?.name ?? 'Produit'} · ${formatFCFA(order.total_price)}`,
                created_at: order.created_at,
            });
        }

        for (const message of messages.filter((item) => item.status === 'unread').slice(0, 10)) {
            nextNotifications.push({
                id: `message-${message.id}`,
                kind: 'message',
                title: message.subject ?? 'Nouveau message',
                description: message.body,
                created_at: message.created_at,
            });
        }

        for (const product of products.filter((item) => (item.available_quantity ?? 0) > 0 && (item.available_quantity ?? 0) <= 10)) {
            nextNotifications.push({
                id: `stock-${product.id}`,
                kind: 'stock',
                title: `Stock faible (${product.available_quantity})`,
                description: product.name,
                created_at: product.updated_at ?? product.created_at,
            });
        }

        nextNotifications.sort((a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at));
        setNotifications(nextNotifications.slice(0, 30));
    }, [profile?.id]);

    useEffect(() => {
        let mounted = true;

        fetchNotifications()
            .then(() => {
                if (mounted) setErrorMessage(null);
            })
            .catch((error) => {
                if (!mounted) return;
                const message = error instanceof Error ? error.message : 'Impossible de charger les alertes';
                setErrorMessage(message);
                Alert.alert('Erreur', message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [fetchNotifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchNotifications();
            setErrorMessage(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Impossible de rafraîchir les alertes';
            setErrorMessage(message);
            Alert.alert('Erreur', message);
        } finally {
            setRefreshing(false);
        }
    };

    const styles = createStyles(theme);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListHeaderComponent={
                    <View style={styles.headerWrap}>
                        <Text style={styles.title}>Alertes</Text>
                        {errorMessage ? (
                            <View style={styles.errorCard}>
                                <Text style={styles.errorTitle}>Synchronisation incomplète</Text>
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={40} color={theme.textSecondary} />
                        <Text style={styles.emptyTitle}>Aucune alerte active</Text>
                        <Text style={styles.emptyText}>Les nouvelles alertes commandes, messages et stocks apparaîtront ici.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View style={[styles.iconWrap, item.kind === 'stock' && styles.stockIconWrap]}>
                            <Ionicons
                                name={
                                    item.kind === 'order'
                                        ? 'basket-outline'
                                        : item.kind === 'message'
                                          ? 'chatbubble-outline'
                                          : 'warning-outline'
                                }
                                size={18}
                                color={item.kind === 'stock' ? theme.warning : theme.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemDescription} numberOfLines={2}>
                                {item.description}
                            </Text>
                            <Text style={styles.itemTime}>{relativeTime(item.created_at)}</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        centered: {
            flex: 1,
            backgroundColor: theme.background,
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            padding: 16,
            gap: 12,
            flexGrow: 1,
        },
        headerWrap: {
            gap: 12,
        },
        title: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.text,
        },
        errorCard: {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#fecaca',
            backgroundColor: '#fee2e2',
            padding: 12,
            gap: 4,
        },
        errorTitle: {
            color: '#b91c1c',
            fontWeight: '800',
            fontSize: 13,
        },
        errorText: {
            color: '#991b1b',
            lineHeight: 18,
            fontSize: 12,
        },
        item: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            padding: 14,
        },
        iconWrap: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primaryLight,
        },
        stockIconWrap: {
            backgroundColor: '#fef3c7',
        },
        itemTitle: {
            color: theme.text,
            fontSize: 14,
            fontWeight: '700',
        },
        itemDescription: {
            marginTop: 2,
            color: theme.textSecondary,
            lineHeight: 20,
        },
        itemTime: {
            marginTop: 6,
            color: theme.textSecondary,
            fontSize: 12,
        },
        empty: {
            marginTop: 32,
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
        },
        emptyTitle: {
            color: theme.text,
            fontSize: 17,
            fontWeight: '700',
        },
        emptyText: {
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
    });
}
