import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
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
import { supabase } from '@/lib/supabase';

interface ActivityEvent {
    id: string;
    type: 'order_new' | 'review_new' | 'message_new' | string;
    title: string;
    subtitle?: string;
    timestamp: string;
}

interface ActivityResponse {
    events: ActivityEvent[];
}

interface BadgesResponse {
    orders: number;
    messages: number;
    reviews: number;
}

const ACTIVE_ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'delivering'];

function formatRelativeDate(timestamp: string) {
    const deltaMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.max(0, Math.floor(deltaMs / 60_000));
    if (minutes < 1) return 'À l’instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
}

export default function NotificationsScreen() {
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [badges, setBadges] = useState<BadgesResponse>({ orders: 0, messages: 0, reviews: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const [activityRes, activeOrdersRes, unreadMessagesRes, pendingReviewsRes] = await Promise.all([
                apiFetch<ActivityResponse>('/api/restaurant/activity', session.access_token),
                profile?.restaurantId
                    ? supabase
                        .from('orders')
                        .select('id', { count: 'exact', head: true })
                        .eq('restaurant_id', profile.restaurantId)
                        .in('status', ACTIVE_ORDER_STATUSES)
                    : Promise.resolve({ count: 0 } as { count: number | null }),
                profile?.restaurantId
                    ? supabase
                        .from('messages')
                        .select('id', { count: 'exact', head: true })
                        .eq('restaurant_id', profile.restaurantId)
                        .eq('is_read', false)
                    : Promise.resolve({ count: 0 } as { count: number | null }),
                profile?.restaurantId
                    ? supabase
                        .from('reviews')
                        .select('id', { count: 'exact', head: true })
                        .eq('restaurant_id', profile.restaurantId)
                        .is('reply', null)
                    : Promise.resolve({ count: 0 } as { count: number | null }),
            ]);

            let nextEvents = activityRes.events ?? [];
            if (!nextEvents.length && profile?.restaurantId) {
                const { data: recentOrders } = await supabase
                    .from('orders')
                    .select('id, order_number, customer_name, total_amount, created_at')
                    .eq('restaurant_id', profile.restaurantId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                nextEvents = (recentOrders ?? []).map((order: any) => ({
                    id: order.id,
                    type: 'order_new',
                    title: `Commande #${order.order_number ?? String(order.id).slice(-6).toUpperCase()}`,
                    subtitle: `${order.customer_name ?? 'Client'} — ${(order.total_amount ?? 0).toLocaleString()} FCFA`,
                    timestamp: order.created_at,
                }));
            }

            setEvents(nextEvents);
            setBadges({
                orders: activeOrdersRes.count ?? 0,
                messages: unreadMessagesRes.count ?? 0,
                reviews: pendingReviewsRes.count ?? 0,
            });
            setError(null);
        } catch (err) {
            if (!profile?.restaurantId) {
                setError(getErrorMessage(err, 'Impossible de charger les notifications'));
                setEvents([]);
                setBadges({ orders: 0, messages: 0, reviews: 0 });
            } else {
                try {
                    const [ordersRes, reviewsRes, messagesRes, activeOrdersRes, unreadMessagesRes, pendingReviewsRes] = await Promise.all([
                        supabase
                            .from('orders')
                            .select('id, order_number, customer_name, total_amount, created_at')
                            .eq('restaurant_id', profile.restaurantId)
                            .order('created_at', { ascending: false })
                            .limit(15),
                        supabase
                            .from('reviews')
                            .select('id, rating, comment, created_at')
                            .eq('restaurant_id', profile.restaurantId)
                            .order('created_at', { ascending: false })
                            .limit(15),
                        supabase
                            .from('messages')
                            .select('id, content, created_at')
                            .eq('restaurant_id', profile.restaurantId)
                            .order('created_at', { ascending: false })
                            .limit(15),
                        supabase
                            .from('orders')
                            .select('id', { count: 'exact', head: true })
                            .eq('restaurant_id', profile.restaurantId)
                            .in('status', ACTIVE_ORDER_STATUSES),
                        supabase
                            .from('messages')
                            .select('id', { count: 'exact', head: true })
                            .eq('restaurant_id', profile.restaurantId)
                            .eq('is_read', false),
                        supabase
                            .from('reviews')
                            .select('id', { count: 'exact', head: true })
                            .eq('restaurant_id', profile.restaurantId)
                            .is('reply', null),
                    ]);

                    const fallbackEvents: ActivityEvent[] = [
                        ...(ordersRes.data ?? []).map((order: any) => ({
                            id: order.id,
                            type: 'order_new',
                            title: `Commande #${order.order_number ?? String(order.id).slice(-6).toUpperCase()}`,
                            subtitle: `${order.customer_name ?? 'Client'} — ${(order.total_amount ?? 0).toLocaleString()} FCFA`,
                            timestamp: order.created_at,
                        })),
                        ...(reviewsRes.data ?? []).map((review: any) => ({
                            id: review.id,
                            type: 'review_new',
                            title: `Nouvel avis (${review.rating ?? 0}★)`,
                            subtitle: review.comment ?? undefined,
                            timestamp: review.created_at,
                        })),
                        ...(messagesRes.data ?? []).map((message: any) => ({
                            id: message.id,
                            type: 'message_new',
                            title: 'Nouveau message',
                            subtitle: message.content ?? undefined,
                            timestamp: message.created_at,
                        })),
                    ]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 15);

                    setEvents(fallbackEvents);
                    setBadges({
                        orders: activeOrdersRes.count ?? 0,
                        messages: unreadMessagesRes.count ?? 0,
                        reviews: pendingReviewsRes.count ?? 0,
                    });
                    setError(null);
                } catch (fallbackErr) {
                    setError(getErrorMessage(fallbackErr, getErrorMessage(err, 'Impossible de charger les notifications')));
                    setEvents([]);
                    setBadges({ orders: 0, messages: 0, reviews: 0 });
                }
            }
        } finally {
            setLoading(false);
        }
    }, [session, profile?.restaurantId]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60_000);
        return () => clearInterval(interval);
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const summary = useMemo(
        () => [
            { key: 'orders', label: 'Commandes', value: badges.orders, icon: 'receipt-outline' as const, color: theme.warning },
            { key: 'messages', label: 'Messages', value: badges.messages, icon: 'chatbubble-ellipses-outline' as const, color: theme.primary },
            { key: 'reviews', label: 'Avis', value: badges.reviews, icon: 'star-outline' as const, color: theme.success },
        ],
        [badges.messages, badges.orders, badges.reviews, theme.primary, theme.success, theme.warning]
    );

    const typeMeta: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; actionLabel?: string }> = {
        order_new: { icon: 'receipt-outline', color: theme.warning, actionLabel: 'Voir la commande' },
        message_new: { icon: 'chatbubble-ellipses-outline', color: theme.primary },
        review_new: { icon: 'star-outline', color: theme.success },
    };

    const styles = createStyles(theme);

    const renderEvent = ({ item }: { item: ActivityEvent }) => {
        const meta = typeMeta[item.type] ?? { icon: 'notifications-outline', color: theme.textSecondary };
        const canOpenOrder = item.type === 'order_new';

        return (
            <TouchableOpacity
                style={styles.eventCard}
                activeOpacity={canOpenOrder ? 0.7 : 1}
                onPress={() => {
                    if (canOpenOrder) {
                        router.push(`/order/${item.id}` as never);
                    }
                }}
            >
                <View style={[styles.eventIcon, { backgroundColor: `${meta.color}20` }]}>
                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>

                <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    {!!item.subtitle && (
                        <Text style={styles.eventSubtitle} numberOfLines={2}>
                            {item.subtitle}
                        </Text>
                    )}
                    <Text style={styles.eventTime}>{formatRelativeDate(item.timestamp)}</Text>
                    {meta.actionLabel && <Text style={[styles.eventLink, { color: meta.color }]}>{meta.actionLabel}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
            </View>

            <FlatList
                data={events}
                keyExtractor={(item) => `${item.type}-${item.id}-${item.timestamp}`}
                renderItem={renderEvent}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListHeaderComponent={
                    <View style={styles.summaryRow}>
                        {summary.map((item) => (
                            <View key={item.key} style={styles.summaryCard}>
                                <View style={[styles.summaryIcon, { backgroundColor: `${item.color}20` }]}>
                                    <Ionicons name={item.icon} size={16} color={item.color} />
                                </View>
                                <Text style={styles.summaryValue}>{item.value}</Text>
                                <Text style={styles.summaryLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.icon}>🔔</Text>
                        <Text style={styles.emptyText}>
                            {error ?? 'Aucune activité récente pour le moment'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            padding: 16,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        title: { fontSize: 22, fontWeight: '700', color: theme.text },
        list: { padding: 12, gap: 10, paddingBottom: 24 },
        summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
        summaryCard: {
            flex: 1,
            borderRadius: 12,
            padding: 10,
            backgroundColor: theme.surface,
            alignItems: 'center',
            gap: 4,
        },
        summaryIcon: {
            width: 28,
            height: 28,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        summaryValue: { fontSize: 18, fontWeight: '800', color: theme.text },
        summaryLabel: { fontSize: 11, color: theme.textSecondary },
        eventCard: {
            flexDirection: 'row',
            gap: 12,
            borderRadius: 14,
            backgroundColor: theme.surface,
            padding: 14,
        },
        eventIcon: {
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        eventContent: { flex: 1, gap: 3 },
        eventTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        eventSubtitle: { fontSize: 12, color: theme.textSecondary, lineHeight: 17 },
        eventTime: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        eventLink: { fontSize: 12, fontWeight: '700', marginTop: 2 },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        icon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
    });
